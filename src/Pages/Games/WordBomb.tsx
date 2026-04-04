import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc, increment, getDoc, type Firestore } from 'firebase/firestore';
import { ArrowLeft, Loader2, Heart, Bomb, Zap } from 'lucide-react';
import { auth, db } from '../../services/firebaseConfig';
import { fetchWordBombWords, refreshUserData } from '../../services/dataCache';
import { useVisualJuice } from '../../hooks/useVisualJuice';
import { updateStreak } from '../../services/streakUtils';
import { popupService } from '../../services/popupService';
import Mascot, { type MascotMood } from '../../components/Mascot';

interface WordBombWord {
    id: string;
    english: string;
    venda: string;
    difficulty: string;
}

interface FallingWord {
    id: string;
    word: WordBombWord;
    x: number;       // horizontal position (%)
    y: number;       // vertical position (%)
    speed: number;   // fall speed
    active: boolean;
}

const INITIAL_LIVES = 10;
const BASE_SPEED = 0.25;
const SPEED_INCREMENT = 0.04;
const SPAWN_INTERVAL_MS = 2500;
const MAX_ACTIVE_WORDS = 5;

interface ScoreHighlight {
    id: number;
    x: number;
    y: number;
    text: string;
}

const WordBomb: React.FC = () => {
    const navigate = useNavigate();
    const [allWords, setAllWords] = useState<WordBombWord[]>([]);
    const [fallingWords, setFallingWords] = useState<FallingWord[]>([]);
    const [userInput, setUserInput] = useState('');
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(INITIAL_LIVES);
    const [gameStatus, setGameStatus] = useState<'loading' | 'ready' | 'playing' | 'over'>('loading');
    const [combo, setCombo] = useState(0);
    const [speedLevel, setSpeedLevel] = useState(1);
    const [highlights, setHighlights] = useState<ScoreHighlight[]>([]);
    const [mascotMood, setMascotMood] = useState<MascotMood>('happy');
    const [correctFlash, setCorrectFlash] = useState<string | null>(null);
    const [missFlash, setMissFlash] = useState(false);
    const [sessionStartTime, setSessionStartTime] = useState(Date.now());
    const [isMobile, setIsMobile] = useState(window.innerWidth < 576);
    const [paletteOptions, setPaletteOptions] = useState<WordBombWord[]>([]);
    const { playCorrect, playWrong, playClick, triggerShake } = useVisualJuice();

    const inputRef = useRef<HTMLInputElement>(null);
    const gameLoopRef = useRef<number | null>(null);
    const spawnTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const fallingWordsRef = useRef<FallingWord[]>([]);
    const livesRef = useRef(INITIAL_LIVES);
    const scoreRef = useRef(0);
    const comboRef = useRef(0);
    const speedLevelRef = useRef(1);
    const allWordsRef = useRef<WordBombWord[]>([]);
    const usedWordIds = useRef<Set<string>>(new Set());
    const isPlayingRef = useRef(false);

    // Keep refs in sync
    useEffect(() => { fallingWordsRef.current = fallingWords; }, [fallingWords]);
    useEffect(() => { livesRef.current = lives; }, [lives]);
    useEffect(() => { scoreRef.current = score; }, [score]);
    useEffect(() => { comboRef.current = combo; }, [combo]);
    useEffect(() => { speedLevelRef.current = speedLevel; }, [speedLevel]);
    useEffect(() => { allWordsRef.current = allWords; }, [allWords]);

    // Handle resize
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 576);
            // Fix for mobile browser address bar/keyboard
            let vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        };
        handleResize(); // Initial call
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Load words
    const cleanup = useCallback(() => {
        if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
        if (spawnTimerRef.current) clearInterval(spawnTimerRef.current);
    }, []);

    // Load words
    useEffect(() => {
        const loadData = async () => {
            try {
                const words = await fetchWordBombWords();
                if (words && Array.isArray(words)) {
                    setAllWords(words as WordBombWord[]);
                    setGameStatus('ready');
                }
                if (auth.currentUser) {
                    await getDoc(doc(db as Firestore, "users", auth.currentUser.uid));
                    // streak state removed as it was unused in render
                }
            } catch (err) {
                console.error("Failed to load Word Bomb words:", err);
            }
        };
        loadData();
        return () => cleanup();
    }, [cleanup]);

    const getRandomWord = useCallback((): WordBombWord | null => {
        const available = allWordsRef.current.filter(w => !usedWordIds.current.has(w.id));
        if (available.length === 0) {
            usedWordIds.current.clear(); // reset cycle
            return allWordsRef.current[Math.floor(Math.random() * allWordsRef.current.length)] || null;
        }
        return available[Math.floor(Math.random() * available.length)];
    }, []);

    const spawnWord = useCallback(() => {
        const activeFalling = fallingWordsRef.current.filter(w => w.active);
        if (activeFalling.length >= MAX_ACTIVE_WORDS) return;

        const word = getRandomWord();
        if (!word) return;

        usedWordIds.current.add(word.id);

        const newFalling: FallingWord = {
            id: `${word.id}_${Date.now()}`,
            word,
            x: 10 + Math.random() * 75,
            y: -5,
            speed: BASE_SPEED + (speedLevelRef.current - 1) * SPEED_INCREMENT,
            active: true,
        };

        setFallingWords(prev => [...prev, newFalling]);

        // Update palette for mobile
        if (isMobile) {
            updatePalette([...fallingWordsRef.current, newFalling]);
        }
    }, [getRandomWord, isMobile]);

    // Build palette: active words + random distractors, shuffled
    const updatePalette = useCallback((currentFalling: FallingWord[]) => {
        const activeWords = currentFalling.filter(fw => fw.active).map(fw => fw.word);
        const activeIds = new Set(activeWords.map(w => w.id));

        let options = [...activeWords];
        const pool = allWordsRef.current.filter(w => !activeIds.has(w.id));

        while (options.length < 8 && pool.length > 0) {
            const idx = Math.floor(Math.random() * pool.length);
            options.push(pool.splice(idx, 1)[0]);
        }

        setPaletteOptions(options.sort(() => 0.5 - Math.random()));
    }, []);

    const handleGameOver = useCallback(async () => {
        cleanup();
        const start = sessionStartTime;
        const totalDuration = Math.floor((Date.now() - start) / 1000);
        const finalScore = scoreRef.current;

        const user = auth.currentUser;
        if (user) {
            try {
                const userRef = doc(db as Firestore, 'users', user.uid);
                await updateDoc(userRef, {
                    points: increment(finalScore),
                    [`gamePerformance.wordBomb.lastPlayed`]: {
                        score: finalScore,
                        duration: totalDuration,
                        timestamp: new Date().toISOString()
                    }
                });
                await updateStreak(user.uid);
                await refreshUserData();
            } catch (err) {
                console.error("Error saving score:", err);
            }
        }

        popupService.innerSuccess(
            'Game Over!',
            `<p style="font-size:14px;color:#666">Great job!</p><h2 style="color:#FACC15;font-weight:800">+${finalScore} XP</h2>`,
            'Play Again'
        ).then((result) => {
            if (result.isConfirmed) {
                startGame(); // Changed from resetGame to startGame
            } else {
                navigate('/mitambo');
            }
        });
    }, [navigate, cleanup, sessionStartTime]);

    const gameLoop = useCallback(() => {
        if (!isPlayingRef.current || livesRef.current <= 0) return;

        setFallingWords(prev => {
            const updated = prev.map(fw => {
                if (!fw.active) return fw;
                // Use current speed from ref to ensure it's always up to date
                const currentSpeed = BASE_SPEED + (speedLevelRef.current - 1) * SPEED_INCREMENT;
                const newY = fw.y + currentSpeed;

                if (newY >= 95) {
                    return { ...fw, active: false, y: newY };
                }
                return { ...fw, y: newY, speed: currentSpeed };
            });
            return updated.filter(fw => fw.active || fw.y < 100);
        });

        // Sync physics check
        const currentPhysicsCheck = fallingWordsRef.current;
        let missedCount = 0;
        currentPhysicsCheck.forEach(fw => {
            if (fw.active && (fw.y + fw.speed) >= 95) {
                missedCount++;
            }
        });

        if (missedCount > 0) {
            const newLives = Math.max(0, livesRef.current - missedCount);
            livesRef.current = newLives;
            setLives(prev => {
                const updatedLives = prev - missedCount;
                if (updatedLives <= 1) setMascotMood('sad');
                return updatedLives;
            });
            setCombo(0);
            setMascotMood('happy'); // Reset mascot if was excited
            playWrong();
            triggerShake('wb-arena-shake');
            setMissFlash(true);
            setTimeout(() => setMissFlash(false), 500);

            if (newLives <= 0) {
                isPlayingRef.current = false;
                setGameStatus('over');
                handleGameOver();
                return;
            }

            if (isMobile) {
                updatePalette(fallingWordsRef.current);
            }
        }

        gameLoopRef.current = requestAnimationFrame(gameLoop);
    }, [handleGameOver, isMobile, updatePalette]);

    // Defined startGame after gameLoop to avoid reference issues
    const startGame = useCallback(() => {
        cleanup();
        setScore(0);
        setLives(INITIAL_LIVES);
        livesRef.current = INITIAL_LIVES;
        setCombo(0);
        setSpeedLevel(1);
        speedLevelRef.current = 1;
        setFallingWords([]);
        setUserInput('');
        setGameStatus('playing');
        isPlayingRef.current = true;
        setSessionStartTime(Date.now());
        usedWordIds.current.clear();
        setMascotMood('happy'); // Reset mascot mood

        // Start game loop
        gameLoopRef.current = requestAnimationFrame(gameLoop);

        // Start spawning words
        spawnWord();
        spawnTimerRef.current = setInterval(() => {
            spawnWord();
        }, SPAWN_INTERVAL_MS);

        if (isMobile) {
            updatePalette([]);
        }

        setTimeout(() => inputRef.current?.focus(), 100);
    }, [gameLoop, spawnWord, cleanup, isMobile, updatePalette]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setUserInput(e.target.value);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!userInput.trim()) return;

        const guess = userInput.trim().toLowerCase();
        const match = fallingWordsRef.current.find(fw =>
            fw.active && fw.word.venda.toLowerCase() === guess
        );

        if (match) {
            // Correct!
            setCorrectFlash(match.id);
            setTimeout(() => setCorrectFlash(null), 600);

            setFallingWords(prev => prev.map(fw =>
                fw.id === match.id ? { ...fw, active: false } : fw
            ));

            const newCombo = comboRef.current + 1;
            const points = 10 + Math.floor(newCombo / 3) * 5;

            // Add floating point highlight
            const newHighlight = {
                id: Date.now(),
                x: match.x,
                y: match.y,
                text: `+${points}`
            };
            setHighlights(prev => [...prev, newHighlight]);
            setTimeout(() => {
                setHighlights(prev => prev.filter(h => h.id !== newHighlight.id));
            }, 1000);

            setScore(prev => prev + points);
            setCombo(newCombo);
            // Update mascot mood based on combo
            if (newCombo >= 5) setMascotMood('excited');
            playCorrect();

            // Increase speed every 5 correct answers
            if (newCombo % 5 === 0) {
                setSpeedLevel(prev => prev + 1);
            }
            // Add Visual Juice: Confetti for correct answer
            const canvas = document.createElement('canvas');
            canvas.style.position = 'fixed';
            canvas.style.top = '0';
            canvas.style.left = '0';
            canvas.style.width = '100%';
            canvas.style.height = '100%';
            canvas.style.pointerEvents = 'none';
            canvas.style.zIndex = '9999';
            document.body.appendChild(canvas);

            import('canvas-confetti').then((confetti) => {
                const myConfetti = confetti.create(canvas, { resize: true });
                myConfetti({
                    particleCount: 40,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ['#FACC15', '#F59E0B', '#34D399']
                });
                setTimeout(() => document.body.removeChild(canvas), 3000);
            });
        } else {
            playWrong();
            triggerShake('wb-input-zone');
        }

        setUserInput('');
        inputRef.current?.focus();
    };

    const handlePaletteSelection = (vendaWord: string) => {
        const match = fallingWordsRef.current.find(fw =>
            fw.active && fw.word.venda.toLowerCase() === vendaWord.toLowerCase()
        );

        if (match) {
            setCorrectFlash(match.id);
            setTimeout(() => setCorrectFlash(null), 600);

            setFallingWords(prev => prev.map(fw =>
                fw.id === match.id ? { ...fw, active: false } : fw
            ));

            const newCombo = comboRef.current + 1;
            const points = 10 + Math.floor(newCombo / 3) * 5;

            // Add floating point highlight
            const newHighlight = {
                id: Date.now(),
                x: match.x,
                y: match.y,
                text: `+${points}`
            };
            setHighlights(prev => [...prev, newHighlight]);
            setTimeout(() => {
                setHighlights(prev => prev.filter(h => h.id !== newHighlight.id));
            }, 1000);

            setScore(prev => prev + points);
            setCombo(newCombo);
            if (newCombo >= 5) setMascotMood('excited');
            playCorrect();

            if (newCombo % 5 === 0) {
                setSpeedLevel(prev => prev + 1);
            }

            if (isMobile) {
                updatePalette(fallingWordsRef.current.filter(fw => fw.id !== match.id));
            }
        }
    };

    if (gameStatus === 'loading') {
        return (
            <div className="min-vh-100 d-flex justify-content-center align-items-center bg-white">
                <Loader2 className="animate-spin text-warning" size={48} />
            </div>
        );
    }

    if (gameStatus === 'ready') {
        return (
            <div className="flex-grow-1 d-flex flex-column align-items-center justify-content-center p-4" style={{ backgroundColor: '#ffffff', minHeight: '80vh' }}>
                <button onClick={() => navigate('/mitambo')} className="btn btn-link text-decoration-none p-0 text-dark position-absolute top-0 start-0 m-4">
                    <ArrowLeft size={24} />
                </button>

                <div className="text-center mb-5 d-flex flex-column align-items-center">
                    <div className="mb-4">
                        <Mascot width="140px" height="140px" mood="excited" />
                    </div>
                    <div className="rounded-circle d-flex align-items-center justify-content-center mb-3 shadow-sm bg-game-warning" style={{ width: '80px', height: '80px', border: '2px solid #FEF3C7', flexShrink: 0 }}>
                        <Bomb size={40} className="text-warning wb-pulse" />
                    </div>
                    <h1 className="fw-bold mb-2 text-dark" style={{ fontSize: '2.5rem' }}>Word Bomb</h1>
                    <p className="text-muted mb-0" style={{ maxWidth: '300px', fontSize: '1.1rem' }}>English words fall from the sky. Type the matching translation.</p>
                </div>

                <div className="d-flex flex-column gap-3 w-100 mt-4 px-3" style={{ maxWidth: '400px' }}>
                    <button
                        onClick={startGame}
                        className="btn-game btn-game-primary w-100 p-3 p-md-4 rounded-4 fw-bold shadow-lg transition-all"
                        style={{ fontSize: isMobile ? '1.1rem' : '1.4rem', letterSpacing: '2px' }}
                    >
                        START GAME
                    </button>
                    <p className="text-center text-muted small mt-3">Ready to test your speed?</p>
                </div>

                <style>{`
                    .wb-pulse { animation: bombPulse 2s infinite; }
                    @keyframes bombPulse {
                        0%, 100% { transform: scale(1); }
                        50% { transform: scale(1.1); }
                    }
                    .btn-game-primary {
                        background-color: #f59e0b !important;
                        color: #111827 !important;
                        box-shadow: 0 6px 0 #d97706 !important;
                    }
                    .btn-game-primary:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 8px 0 #d97706 !important;
                    }
                    .btn-game-primary:active {
                        transform: translateY(4px);
                        box-shadow: 0 2px 0 #d97706 !important;
                    }
                `}</style>
            </div>
        );
    }

    if (gameStatus === 'over') {
        return (
            <div className="min-vh-100 d-flex flex-column align-items-center justify-content-center p-4" style={{ backgroundColor: '#ffffff' }}>
                <div className="text-center mb-5 d-flex flex-column align-items-center">
                    <Mascot width="160px" height="160px" mood="sad" className="mb-4" />
                    <h1 className="display-4 fw-bold mb-2 text-dark">Game Over!</h1>
                    <p className="lead text-muted mb-4">You scored {score} points</p>
                    <div className="display-1 fw-bold text-warning mb-5">{score}</div>
                </div>

                <div className="d-flex flex-column gap-3 w-100" style={{ maxWidth: '400px' }}>
                    <button
                        onClick={() => {
                            setScore(0);
                            setLives(INITIAL_LIVES);
                            setCombo(0);
                            setGameStatus('ready');
                        }}
                        className="btn-game btn-game-primary w-100 p-4 rounded-4 fw-bold shadow-lg text-dark"
                        style={{ fontSize: '1.2rem' }}
                    >
                        PLAY AGAIN
                    </button>
                    <button
                        onClick={() => navigate('/mitambo')}
                        className="btn btn-outline-dark w-100 p-4 rounded-4 fw-bold"
                    >
                        QUIT GAME
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-vh-100 d-flex flex-column wb-bg" onClick={() => inputRef.current?.focus()}>
            {/* GAME HUD / HEADER */}
            {gameStatus === 'playing' && (
                <div className={`position-absolute top-0 start-0 ${isMobile ? 'p-2' : 'p-4'} w-100 d-flex justify-content-between align-items-center`} style={{ zIndex: 50 }}>
                    <div className="d-flex align-items-center gap-1 gap-md-3">
                        <Mascot width={isMobile ? "50px" : "80px"} height={isMobile ? "50px" : "80px"} mood={mascotMood} className="shadow-sm rounded-circle bg-white p-1 border" />
                        <div className={`${isMobile ? 'p-1 px-2' : 'p-3'} bg-white text-dark rounded-3 rounded-md-4 shadow-sm border border-warning border-opacity-50`}>
                            <h5 className={`mb-0 fw-bold ls-1 ${isMobile ? 'smallest text-nowrap' : ''}`}>SCORE: {score}</h5>
                            <div className="d-flex align-items-center gap-2">
                                <small className="text-warning fw-bold" style={{ fontSize: isMobile ? '9px' : '' }}>C:{combo}</small>
                                <small className="text-muted" style={{ fontSize: isMobile ? '9px' : '' }}>S:{speedLevel}</small>
                            </div>
                        </div>
                    </div>
                    <div className={`${isMobile ? 'p-1 px-2' : 'p-3'} bg-white text-dark rounded-3 rounded-md-4 shadow-sm border border-danger border-opacity-50`}>
                        <div className="d-flex gap-1 gap-md-2">
                            {[...Array(INITIAL_LIVES)].map((_, i) => (
                                <Heart
                                    key={i}
                                    size={isMobile ? 12 : 24}
                                    fill={i < lives ? "#ef4444" : "none"}
                                    className={i < lives ? "text-danger animate__animated animate__pulse animate__infinite" : "text-muted opacity-25"}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* GAME ARENA */}
            <div id="wb-arena-shake" className="flex-grow-1 position-relative wb-arena overflow-hidden">
                {/* Floating Score Highlights */}
                {highlights.map(h => (
                    <div
                        key={h.id}
                        className="position-absolute animate__animated animate__fadeOutUp fw-bold text-warning"
                        style={{
                            left: `${h.x}%`,
                            top: `${h.y}%`,
                            fontSize: '1.5rem',
                            pointerEvents: 'none',
                            zIndex: 100,
                            textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                        }}
                    >
                        {h.text}
                    </div>
                ))}

                {/* Falling Words */}
                {gameStatus === 'playing' && fallingWords.filter(fw => fw.active).map((fw) => (
                    <div
                        key={fw.id}
                        className={`wb-falling-word ${correctFlash === fw.id ? 'wb-explode' : ''}`}
                        style={{
                            left: `${fw.x}%`,
                            top: `${fw.y}%`,
                        }}
                    >
                        <span className="wb-word-text">{fw.word.english}</span>
                    </div>
                ))}

                {/* Miss flash */}
                {missFlash && <div className="wb-miss-flash" />}

                {/* Ground line */}
                {gameStatus === 'playing' && (
                    <div className="wb-ground" />
                )}
            </div>

            {/* INPUT / PALETTE BAR */}
            {gameStatus === 'playing' && (
                isMobile ? (
                    <div className="wb-palette-bar pb-safe">
                        <div className="wb-palette-grid">
                            {paletteOptions.map((opt) => (
                                <button
                                    key={opt.id}
                                    className="wb-palette-btn"
                                    onClick={() => { playClick(); handlePaletteSelection(opt.venda); }}
                                >
                                    <span className="text-truncate" style={{ maxWidth: '100%' }}>{opt.venda}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <form id="wb-input-zone" onSubmit={handleSubmit} className="wb-input-bar d-flex gap-2 p-3">
                        <input
                            ref={inputRef}
                            type="text"
                            className="form-control wb-input fw-bold"
                            placeholder="Type the translated word..."
                            value={userInput}
                            onChange={handleInputChange}
                            autoFocus
                            autoComplete="off"
                            autoCapitalize="off"
                        />
                        <button type="submit" className="btn wb-submit-btn fw-bold px-4">
                            <Zap size={18} />
                        </button>
                    </form>
                )
            )}

            {/* Game Over logic handled via early return above */}

            <style>{`
                .wb-bg {
                    background: #ffffff;
                    position: relative;
                    cursor: text;
                    height: 100vh;
                    height: calc(var(--vh, 1vh) * 100);
                    overflow: hidden;
                }
                .wb-header {
                    background: rgba(255,255,255,0.9);
                    backdrop-filter: blur(15px);
                    border-bottom: 1px solid rgba(0,0,0,0.1);
                    z-index: 100;
                    height: 60px;
                }
                .wb-arena {
                    position: relative;
                    flex: 1;
                    width: 100%;
                }
                .wb-falling-word {
                    position: absolute;
                    transform: translateX(-50%);
                    z-index: 5;
                    transition: left 0.3s ease-out;
                }
                .wb-word-text {
                    display: inline-block;
                    background: #ffffff;
                    border: 2px solid #111827;
                    color: #111827;
                    font-weight: 700;
                    padding: clamp(6px, 2vw, 10px) clamp(12px, 4vw, 24px);
                    border-radius: 12px;
                    font-size: clamp(0.75rem, 3.5vw, 1.1rem);
                    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                    animation: wordGlow 2s ease-in-out infinite;
                    white-space: nowrap;
                    text-shadow: none;
                }
                .wb-heart-pulse {
                    animation: heartPulse 1.5s infinite ease-in-out;
                }
                @keyframes heartPulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.15); filter: drop-shadow(0 0 5px #EF4444); }
                }
                @keyframes wordGlow {
                    0%, 100% { border-color: rgba(17, 24, 39, 0.4); box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
                    50% { border-color: rgba(17, 24, 39, 0.8); box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
                }
                .wb-explode {
                    animation: explode 0.5s forwards !important;
                }
                @keyframes explode {
                    0% { transform: translateX(-50%) scale(1); opacity: 1; }
                    50% { transform: translateX(-50%) scale(1.5); opacity: 0.6; }
                    100% { transform: translateX(-50%) scale(0); opacity: 0; }
                }
                .wb-miss-flash {
                    position: absolute;
                    inset: 0;
                    background: rgba(239, 68, 68, 0.15);
                    animation: flashOut 0.5s forwards;
                    z-index: 20;
                    pointer-events: none;
                }
                @keyframes flashOut {
                    0% { opacity: 1; }
                    100% { opacity: 0; }
                }
                .wb-ground {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    height: 4px;
                    background: linear-gradient(90deg, transparent, #EF4444, #FACC15, #EF4444, transparent);
                    box-shadow: 0 0 20px rgba(239,68,68,0.2);
                }
                .wb-input-bar {
                    background: #ffffff;
                    border-top: 1px solid rgba(0,0,0,0.1);
                    z-index: 100;
                    padding: clamp(10px, 3vw, 20px) !important;
                }
                .wb-input {
                    background: #f9fafb !important;
                    border: 2px solid #e5e7eb !important;
                    color: #111827 !important;
                    border-radius: 12px !important;
                    font-size: 16px !important;
                    padding: clamp(10px, 2.5vw, 14px) 16px !important;
                    flex: 1;
                }
                .wb-input::placeholder { color: #9ca3af !important; }
                .wb-input:focus {
                    border-color: #FACC15 !important;
                    box-shadow: 0 0 20px rgba(250, 204, 21, 0.1) !important;
                    background: #ffffff !important;
                }
                .wb-submit-btn {
                    background: #111827 !important;
                    border: none !important;
                    border-radius: 12px !important;
                    color: #ffffff !important;
                    box-shadow: 0 4px 0 #000 !important;
                    transition: transform 0.1s;
                }
                .wb-submit-btn:active {
                    transform: translateY(2px);
                    box-shadow: 0 2px 0 #A1810B !important;
                }
                .wb-start-btn {
                    background: linear-gradient(135deg, #FACC15, #F59E0B) !important;
                    color: #000 !important;
                    border: none;
                    font-size: 1rem;
                    letter-spacing: 2px;
                    box-shadow: 0 6px 0 #A1810B, 0 10px 30px rgba(250,204,21,0.3) !important;
                }
                .wb-start-btn:active { transform: translateY(3px); box-shadow: 0 3px 0 #A1810B !important; }
                .wb-combo-badge {
                    background: linear-gradient(135deg, #8B5CF6, #6366f1);
                    color: #fff;
                    padding: 2px 10px;
                    border-radius: 20px;
                    font-size: 12px;
                    animation: comboPop 0.3s ease-out;
                }
                @keyframes comboPop {
                    0% { transform: scale(0.5); }
                    70% { transform: scale(1.2); }
                    100% { transform: scale(1); }
                }
                .wb-pulse {
                    animation: bombPulse 2s infinite;
                }
                @keyframes bombPulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                }
                .wb-ready-overlay {
                    z-index: 15;
                }
                .smallest { font-size: 11px; }
                .ls-1 { letter-spacing: 1px; }

                /* Mobile palette */
                .wb-palette-bar {
                    background: #ffffff;
                    border-top: 1px solid rgba(0,0,0,0.1);
                    padding: 8px 6px;
                    z-index: 100;
                    position: relative;
                }
                .pb-safe { padding-bottom: max(8px, env(safe-area-inset-bottom)); }
                .wb-palette-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 6px;
                    width: 100%;
                }
                .wb-palette-btn {
                    background: #f3f4f6;
                    border: 2px solid #e5e7eb;
                    color: #111827;
                    border-radius: 10px;
                    padding: 6px 2px;
                    font-size: 0.8rem;
                    font-weight: 700;
                    text-align: center;
                    min-height: 40px;
                    transition: all 0.1s;
                    box-shadow: 0 2px 0 #d1d5db;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    overflow: hidden;
                }
                .wb-palette-btn:active {
                    transform: translateY(2px);
                    box-shadow: none;
                }
                    transform: translateY(2px);
                    box-shadow: none;
                }
            `}</style>
        </div>
    );
};

export default WordBomb;

