import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchWordBombWords, refreshUserData } from '../../services/dataCache';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { auth, db } from '../../services/firebaseConfig';
import Swal from 'sweetalert2';
import { ArrowLeft, Loader2, Heart, Bomb, Zap, Trophy } from 'lucide-react';

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
    const [correctFlash, setCorrectFlash] = useState<string | null>(null);
    const [missFlash, setMissFlash] = useState(false);
    const [sessionStartTime, setSessionStartTime] = useState(Date.now());
    const [isMobile, setIsMobile] = useState(window.innerWidth < 576);
    const [paletteOptions, setPaletteOptions] = useState<WordBombWord[]>([]);

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
                const userRef = doc(db, 'users', user.uid);
                await updateDoc(userRef, {
                    points: increment(finalScore),
                    [`gamePerformance.wordBomb.lastPlayed`]: {
                        score: finalScore,
                        duration: totalDuration,
                        timestamp: new Date().toISOString()
                    }
                });
                await refreshUserData();
            } catch (err) {
                console.error("Error saving score:", err);
            }
        }

        Swal.fire({
            title: '💣 Game Over!',
            html: `
                <div style="font-size:1.1rem">
                    <p><strong>Score:</strong> ${finalScore} LP</p>
                    <p><strong>Time:</strong> ${totalDuration}s</p>
                </div>
            `,
            icon: 'info',
            confirmButtonText: 'Play Again',
            confirmButtonColor: '#FACC15',
            showCancelButton: true,
            cancelButtonText: 'Back to Games'
        }).then((result) => {
            if (result.isConfirmed) {
                startGame();
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
            setLives(newLives);
            setCombo(0);
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
    }, [handleGameOver]);

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
            setScore(prev => prev + points);
            setCombo(newCombo);

            // Increase speed every 5 correct answers
            if (newCombo % 5 === 0) {
                setSpeedLevel(prev => prev + 1);
            }
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
            setScore(prev => prev + points);
            setCombo(newCombo);

            if (newCombo % 5 === 0) {
                setSpeedLevel(prev => prev + 1);
            }

            if (isMobile) {
                updatePalette(fallingWordsRef.current.filter(fw => fw.id !== match.id));
            }
        }
    };

    // Loading state
    if (gameStatus === 'loading') {
        return (
            <div className="min-vh-100 d-flex justify-content-center align-items-center bg-dark">
                <Loader2 className="animate-spin text-warning" size={48} />
            </div>
        );
    }

    return (
        <div className="min-vh-100 d-flex flex-column wb-bg" onClick={() => inputRef.current?.focus()}>
            {/* HEADER BAR */}
            <div className="wb-header d-flex justify-content-between align-items-center px-3 py-2">
                <button onClick={() => navigate('/mitambo')} className="btn btn-sm btn-outline-light rounded-circle d-flex align-items-center justify-content-center" style={{ width: 36, height: 36 }}>
                    <ArrowLeft size={18} />
                </button>

                <div className="d-flex align-items-center gap-2 gap-md-4">
                    {/* LIVES */}
                    <div className="d-flex align-items-center gap-1">
                        {isMobile ? (
                            <div className="d-flex align-items-center gap-2 px-2 py-1 rounded-pill bg-danger bg-opacity-10 border border-danger border-opacity-25 shadow-sm">
                                <Heart size={16} fill="#EF4444" color="#EF4444" className="wb-heart-pulse" />
                                <span className="text-white fw-bold smallest">x {lives}</span>
                            </div>
                        ) : (
                            <div className="d-flex align-items-center gap-1">
                                {[...Array(INITIAL_LIVES)].map((_, i) => (
                                    <Heart
                                        key={i}
                                        size={18}
                                        fill={i < lives ? '#EF4444' : 'transparent'}
                                        color={i < lives ? '#EF4444' : '#555'}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* SCORE */}
                    <div className="d-flex align-items-center gap-1 text-warning fw-bold">
                        <Trophy size={16} />
                        <span className="small">{score}</span>
                    </div>

                    {/* COMBO */}
                    {combo >= 2 && (
                        <div className="d-flex align-items-center gap-1 wb-combo-badge">
                            <Zap size={14} />
                            <span className="fw-bold smallest">{combo}</span>
                        </div>
                    )}
                </div>

                <div className="text-white-50 smallest fw-bold ls-1">
                    SPD {speedLevel}
                </div>
            </div>

            {/* GAME ARENA */}
            <div className="flex-grow-1 position-relative wb-arena overflow-hidden">
                {/* Ready Screen */}
                {gameStatus === 'ready' && (
                    <div className="position-absolute top-50 start-50 translate-middle text-center wb-ready-overlay">
                        <div className="mb-4">
                            <Bomb size={80} className="text-warning wb-pulse" />
                        </div>
                        <h2 className="fw-bold text-white mb-2">Word Bomb</h2>
                        <p className="text-white-50 mb-1">English words fall from the sky</p>
                        <p className="text-warning fw-bold mb-4">Type the Venda translation!</p>
                        <button onClick={startGame} className="btn wb-start-btn fw-bold px-5 py-3 rounded-pill shadow">
                            <Bomb size={18} className="me-2" />
                            START GAME
                        </button>
                    </div>
                )}

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
                    <div className="wb-palette-bar">
                        <div className="wb-palette-grid">
                            {paletteOptions.map((opt) => (
                                <button
                                    key={opt.id}
                                    className="wb-palette-btn"
                                    onClick={() => handlePaletteSelection(opt.venda)}
                                >
                                    {opt.venda}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="wb-input-bar d-flex gap-2 p-3">
                        <input
                            ref={inputRef}
                            type="text"
                            className="form-control wb-input fw-bold"
                            placeholder="Type the Venda word..."
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

            {/* Game Over Overlay */}
            {gameStatus === 'over' && (
                <div className="position-absolute top-50 start-50 translate-middle text-center wb-ready-overlay">
                    <Bomb size={64} className="text-danger mb-3" />
                    <h2 className="fw-bold text-white mb-3">BOOM!</h2>
                    <p className="text-white-50">Final Score: <span className="text-warning fw-bold fs-4">{score} LP</span></p>
                    <div className="d-flex gap-3 justify-content-center mt-4">
                        <button onClick={startGame} className="btn wb-start-btn fw-bold px-4 py-2 rounded-pill">
                            Play Again
                        </button>
                        <button onClick={() => navigate('/mitambo')} className="btn btn-outline-light fw-bold px-4 py-2 rounded-pill">
                            Back
                        </button>
                    </div>
                </div>
            )}

            <style>{`
                .wb-bg {
                    background: linear-gradient(180deg, #0f0f1a 0%, #1a1a2e 40%, #16213e 100%);
                    position: relative;
                    cursor: text;
                    height: 100vh;
                    height: calc(var(--vh, 1vh) * 100);
                    overflow: hidden;
                }
                .wb-header {
                    background: rgba(0,0,0,0.6);
                    backdrop-filter: blur(15px);
                    border-bottom: 1px solid rgba(250,204,21,0.2);
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
                    background: rgba(15, 15, 26, 0.7);
                    border: 1.5px solid rgba(250,204,21,0.5);
                    color: #fff;
                    font-weight: 700;
                    padding: clamp(6px, 2vw, 10px) clamp(12px, 4vw, 24px);
                    border-radius: 12px;
                    font-size: clamp(0.75rem, 3.5vw, 1.1rem);
                    backdrop-filter: blur(8px);
                    box-shadow: 0 4px 15px rgba(0,0,0,0.4), 0 0 20px rgba(250,204,21,0.1);
                    animation: wordGlow 2s ease-in-out infinite;
                    white-space: nowrap;
                    text-shadow: 0 1px 2px rgba(0,0,0,0.5);
                }
                .wb-heart-pulse {
                    animation: heartPulse 1.5s infinite ease-in-out;
                }
                @keyframes heartPulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.15); filter: drop-shadow(0 0 5px #EF4444); }
                }
                @keyframes wordGlow {
                    0%, 100% { border-color: rgba(250,204,21,0.4); box-shadow: 0 4px 15px rgba(0,0,0,0.4); }
                    50% { border-color: rgba(250,204,21,0.8); box-shadow: 0 4px 20px rgba(250,204,21,0.2); }
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
                    box-shadow: 0 0 20px rgba(239,68,68,0.4);
                }
                .wb-input-bar {
                    background: rgba(0,0,0,0.7);
                    backdrop-filter: blur(15px);
                    border-top: 1px solid rgba(250,204,21,0.2);
                    z-index: 100;
                    padding: clamp(10px, 3vw, 20px) !important;
                }
                .wb-input {
                    background: rgba(255,255,255,0.05) !important;
                    border: 2px solid rgba(250,204,21,0.2) !important;
                    color: #fff !important;
                    border-radius: 12px !important;
                    font-size: 16px !important; /* Prevents auto-zoom on mobile */
                    padding: clamp(10px, 2.5vw, 14px) 16px !important;
                    flex: 1;
                }
                .wb-input::placeholder { color: rgba(255,255,255,0.2) !important; }
                .wb-input:focus {
                    border-color: #FACC15 !important;
                    box-shadow: 0 0 20px rgba(250,204,21,0.15) !important;
                    background: rgba(255,255,255,0.1) !important;
                }
                .wb-submit-btn {
                    background: linear-gradient(135deg, #FACC15, #F59E0B) !important;
                    border: none !important;
                    border-radius: 12px !important;
                    color: #000 !important;
                    box-shadow: 0 4px 0 #A1810B !important;
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
                    background: rgba(0,0,0,0.85);
                    backdrop-filter: blur(20px);
                    border-top: 1px solid rgba(250,204,21,0.2);
                    padding: 8px 10px;
                    z-index: 100;
                }
                .wb-palette-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 6px;
                    width: 100%;
                }
                .wb-palette-btn {
                    background: rgba(255,255,255,0.08);
                    border: 1px solid rgba(250,204,21,0.25);
                    color: #fff;
                    border-radius: 10px;
                    padding: 10px 4px;
                    font-size: 0.8rem;
                    font-weight: 600;
                    text-align: center;
                    min-height: 42px;
                    transition: all 0.1s;
                }
                .wb-palette-btn:active {
                    background: #FACC15;
                    color: #000;
                    transform: scale(0.95);
                    border-color: #FACC15;
                }
            `}</style>
        </div>
    );
};

export default WordBomb;
