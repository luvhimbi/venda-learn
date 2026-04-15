import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc, type Firestore } from 'firebase/firestore';
import { ArrowLeft, Loader2, Bomb, Zap, HelpCircle, Eye, Keyboard, AlertTriangle } from 'lucide-react';
import { auth, db } from '../../services/firebaseConfig';
import GameResultModal from '../../components/GameResultModal';
import { fetchWordBombWords, fetchUserData, fetchLanguages, awardPoints } from '../../services/dataCache';
import { useVisualJuice } from '../../hooks/useVisualJuice';
import { updateStreak } from '../../services/streakUtils';
import Mascot, { type MascotMood } from '../../components/Mascot';
import GameIntroModal, { resetIntroSeen } from '../../components/GameIntroModal';
import ExitConfirmModal from '../../components/ExitConfirmModal';

interface WordBombWord {
    id: string;
    english: string;
    nativeWord: string;
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

const WORD_BOMB_INTRO_STEPS = [
    {
        icon: <Eye size={28} strokeWidth={3} />,
        title: 'Words Fall Down',
        description: 'English words (e.g. "Water") fall from the sky. Read them quickly before they reach the bottom!'
    },
    {
        icon: <Keyboard size={28} strokeWidth={3} />,
        title: 'Type the Translation',
        description: 'Quickly type or tap the correct translation (e.g. "Madi"). On mobile, just select it from the word palette below!'
    },
    {
        icon: <AlertTriangle size={28} strokeWidth={3} />,
        title: "Don't Let Them Drop!",
        description: 'You have 10 lives. Each missed word costs a life. Build combos by answering fast without mistakes for bonus points!'
    }
];

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
    const [preferredLanguage, setPreferredLanguage] = useState<any>(null);
    const [paletteOptions, setPaletteOptions] = useState<WordBombWord[]>([]);
    const [showIntro, setShowIntro] = useState(true);
    const [showExitConfirm, setShowExitConfirm] = useState(false);
    const [showResult, setShowResult] = useState(false);
    const [resultData, setResultData] = useState({ isSuccess: false, title: '', message: '', points: 0 });
    const { playCorrect, playWrong, playClick, playWin, playLose, triggerShake } = useVisualJuice();

    const handleIntroDismiss = useCallback(() => setShowIntro(false), []);

    const inputRef = useRef<HTMLInputElement>(null);
    const gameLoopRef = useRef<number | null>(null);
    const spawnTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const fallingWordsRef = useRef<FallingWord[]>([]);
    const lastSpawnTimeRef = useRef(0);
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
            let vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        };
        handleResize();
        window.addEventListener('resize', handleResize);

        const originalOverflow = document.body.style.overflow;
        const originalOverscroll = document.body.style.overscrollBehavior;
        document.body.style.overflow = 'hidden';
        document.body.style.overscrollBehavior = 'none';

        return () => {
            window.removeEventListener('resize', handleResize);
            document.body.style.overflow = originalOverflow;
            document.body.style.overscrollBehavior = originalOverscroll;
        };
    }, []);

    const cleanup = useCallback(() => {
        if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
        if (spawnTimerRef.current) clearInterval(spawnTimerRef.current);
    }, []);

    const handleExit = () => {
        if (gameStatus === 'playing') {
            setShowExitConfirm(true);
        } else {
            navigate('/mitambo');
        }
    };

    const confirmExit = () => {
        cleanup();
        isPlayingRef.current = false;
        setShowExitConfirm(false);
        navigate('/mitambo');
    };

    useEffect(() => {
        const loadData = async () => {
            try {
                const [words, uData, langs] = await Promise.all([
                    fetchWordBombWords(),
                    fetchUserData(),
                    fetchLanguages()
                ]);

                let activeLang: any = null;
                if (uData && langs) {
                    activeLang = langs.find((l: any) => l.id === uData.preferredLanguageId);
                    setPreferredLanguage(activeLang);
                }

                if (words && Array.isArray(words)) {
                    const filtered = words.filter((w: any) => !activeLang || w.languageId === activeLang.id || !w.languageId);
                    setAllWords(filtered as WordBombWord[]);
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
            usedWordIds.current.clear();
            return allWordsRef.current[Math.floor(Math.random() * allWordsRef.current.length)] || null;
        }
        return available[Math.floor(Math.random() * available.length)];
    }, []);

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

    const spawnWord = useCallback(() => {
        const activeFalling = fallingWordsRef.current.filter(w => w.active);
        if (activeFalling.length >= MAX_ACTIVE_WORDS) return;

        const now = Date.now();
        if (now - lastSpawnTimeRef.current < 800) return;
        lastSpawnTimeRef.current = now;

        const word = getRandomWord();
        if (!word) return;

        usedWordIds.current.add(word.id);

        const currentActive = fallingWordsRef.current.filter(fw => fw.active);
        let newX = 10 + Math.random() * 75;

        for (let i = 0; i < 5; i++) {
            const hasConflict = currentActive.some(fw => Math.abs(fw.x - newX) < 20);
            if (!hasConflict) break;
            newX = 10 + Math.random() * 75;
        }

        const newFalling: FallingWord = {
            id: `${word.id}_${Date.now()}`,
            word,
            x: newX,
            y: -5,
            speed: BASE_SPEED + (speedLevelRef.current - 1) * SPEED_INCREMENT,
            active: true,
        };

        setFallingWords(prev => [...prev, newFalling]);

        if (isMobile) {
            updatePalette([...fallingWordsRef.current, newFalling]);
        }
    }, [getRandomWord, isMobile, updatePalette]);

    const handleGameOver = useCallback(async () => {
        cleanup();
        const start = sessionStartTime;
        const totalDuration = Math.floor((Date.now() - start) / 1000);
        const finalScore = scoreRef.current;

        const user = auth.currentUser;
        if (user) {
            try {
                // Using centralized awardPoints to ensure weekly leaderboard sync
                await awardPoints(finalScore);

                // Still update specific game performance stats
                const userRef = doc(db as Firestore, 'users', user.uid);
                await updateDoc(userRef, {
                    [`gamePerformance.wordBomb.lastPlayed`]: {
                        score: finalScore,
                        duration: totalDuration,
                        timestamp: new Date().toISOString()
                    }
                });
                await updateStreak(user.uid);
            } catch (err) {
                console.error("Failed to save Word Bomb score:", err);
            }
        }

        if (finalScore > 50) {
            playWin();
        } else {
            playLose();
        }

        setGameStatus('over');
        setResultData({
            isSuccess: finalScore > 0,
            title: finalScore > 40 ? 'Muḓifho! (Sweet!)' : 'Zwavhuḓi! (Good!)',
            message: `You scored ${finalScore} points and saved the day!`,
            points: finalScore
        });
        setShowResult(true);
    }, [cleanup, sessionStartTime, awardPoints, playWin, playLose]);

    const gameLoop = useCallback(() => {
        if (!isPlayingRef.current || livesRef.current <= 0) return;

        setFallingWords(prev => {
            const updated = prev.map(fw => {
                if (!fw.active) return fw;
                const currentSpeed = BASE_SPEED + (speedLevelRef.current - 1) * SPEED_INCREMENT;
                const newY = fw.y + currentSpeed;

                if (newY >= 95) {
                    return { ...fw, active: false, y: newY };
                }
                return { ...fw, y: newY, speed: currentSpeed };
            });
            return updated.filter(fw => fw.active || fw.y < 100);
        });

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
            setMascotMood('happy');
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
    }, [handleGameOver, isMobile, updatePalette, playWrong, triggerShake]);

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
        setMascotMood('happy');

        gameLoopRef.current = requestAnimationFrame(gameLoop);

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
            fw.active && fw.word.nativeWord.toLowerCase() === guess
        );

        if (match) {
            setCorrectFlash(match.id);
            setTimeout(() => setCorrectFlash(null), 600);

            setFallingWords(prev => prev.map(fw =>
                fw.id === match.id ? { ...fw, active: false } : fw
            ));

            const newCombo = comboRef.current + 1;
            const points = 10 + Math.floor(newCombo / 3) * 5;

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
        } else {
            playWrong();
            triggerShake('wb-input-zone');
        }

        setUserInput('');
        inputRef.current?.focus();
    };

    const handlePaletteSelection = (nativeWord: string) => {
        const match = fallingWordsRef.current.find(fw =>
            fw.active && fw.word.nativeWord.toLowerCase() === nativeWord.toLowerCase()
        );

        if (match) {
            setCorrectFlash(match.id);
            setTimeout(() => setCorrectFlash(null), 600);

            setFallingWords(prev => prev.map(fw =>
                fw.id === match.id ? { ...fw, active: false } : fw
            ));

            const newCombo = comboRef.current + 1;
            const points = 10 + Math.floor(newCombo / 3) * 5;

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

            if (isMobile) {
                updatePalette(fallingWordsRef.current.filter(fw => fw.id !== match.id));
            }
        }
    };

    if (gameStatus === 'loading') {
        return (
            <div className="d-flex justify-content-center align-items-center bg-theme-base overflow-hidden" style={{ height: '100dvh' }}>
                <Loader2 className="animate-spin text-warning" size={48} />
            </div>
        );
    }

    if (gameStatus === 'ready') {
        return (
            <div className="flex-grow-1 d-flex flex-column align-items-center justify-content-center p-4 bg-theme-base overflow-hidden position-relative" style={{ height: '100dvh' }}>
                <button onClick={() => navigate('/mitambo')} className="btn-game btn-game-white rounded-circle d-flex align-items-center justify-content-center position-absolute" style={{ top: '20px', left: '20px', width: 44, height: 44, padding: 0, zIndex: 10 }}>
                    <ArrowLeft size={24} strokeWidth={3} className="text-theme-main" />
                </button>
                <button onClick={() => { resetIntroSeen('wordBomb'); setShowIntro(true); }} className="btn-game btn-game-white rounded-circle d-flex align-items-center justify-content-center position-absolute" style={{ top: '20px', right: '20px', width: 44, height: 44, padding: 0, zIndex: 10 }}>
                    <HelpCircle size={24} strokeWidth={3} className="text-theme-main" />
                </button>

                {showIntro && (
                    <GameIntroModal
                        gameId="wordBomb"
                        gameTitle="WORD BOMB"
                        gameIcon={<Bomb size={28} strokeWidth={3} />}
                        steps={WORD_BOMB_INTRO_STEPS}
                        accentColor="#FACC15"
                        onClose={handleIntroDismiss}
                    />
                )}

                <div className="text-center mb-4 d-flex flex-column align-items-center mt-3">
                    <div className="mb-3">
                        <Mascot width="80px" height="80px" mood="excited" />
                    </div>
                    <div className="brutalist-card bg-warning p-3 mb-3 shadow-action-sm">
                        <Bomb size={32} strokeWidth={3} className="text-dark wb-pulse" />
                    </div>
                    <h1 className="fw-black mb-1 text-theme-main uppercase ls-tight text-center" style={{ fontSize: '1.75rem' }}>WORD BOMB</h1>
                    <p className="fw-bold text-theme-muted uppercase mb-0 ls-1" style={{ fontSize: '0.75rem' }}>Master {preferredLanguage?.name || 'Local'} vocabulary at speed</p>
                </div>

                <div className="d-flex flex-column gap-3 w-100 mt-2 px-3" style={{ maxWidth: '400px' }}>
                    <button
                        onClick={startGame}
                        className="btn-game btn-game-warning w-100 p-3 rounded-4 shadow-action-lg fw-black ls-1 uppercase" style={{ fontSize: '1.1rem' }}
                    >
                        START GAME
                    </button>
                </div>
            </div>
        );
    }

    if (gameStatus === 'over') {
        const totalDuration = Math.floor((Date.now() - sessionStartTime) / 1000);
        const minutes = Math.floor(totalDuration / 60);
        const seconds = totalDuration % 60;
        const timeStr = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

        return (
            <div className="d-flex flex-column align-items-center justify-content-center p-4 bg-theme-base animate__animated animate__fadeIn overflow-hidden" style={{ height: '100dvh' }}>
                <div className="text-center w-100 brutalist-card p-4 p-md-5 shadow-action-lg position-relative overflow-hidden" style={{ maxWidth: '550px', background: 'var(--color-surface)' }}>
                    {/* Decorative Background */}
                    <div className="position-absolute top-0 start-0 w-100 h-100 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(var(--venda-yellow) 2px, transparent 2px)', backgroundSize: '30px 30px' }}></div>

                    <div className="position-relative z-1">
                        <div className="mb-4 mt-2 animate__animated animate__bounceIn d-flex justify-content-center">
                            <Mascot width="160px" height="160px" mood="excited" />
                        </div>

                        <h1 className="fw-black display-3 text-theme-main mb-1 ls-tight uppercase animate__animated animate__jackInTheBox">
                            {score > 0 ? 'STRONG EFFORT!' : 'KEEP GOING!'}
                        </h1>
                        <p className="text-theme-muted mb-5 ls-2 smallest fw-black uppercase letter-spacing-2">
                            {score > 50 ? "YOU'RE BECOMING UNSTOPPABLE" : "EVERY ROUND MAKES YOU FASTER"}
                        </p>

                        <div className="bg-theme-surface border border-theme-main border-3 rounded-4 p-4 mb-5 shadow-action-sm animate__animated animate__fadeInUp animate__delay-1s">
                            <div className="row g-4 d-flex align-items-center">
                                <div className="col-6 border-end border-theme-main border-2">
                                    <div className="d-flex flex-column align-items-center">
                                        <span className="smallest fw-black text-theme-muted uppercase ls-1 mb-1">SCORE</span>
                                        <h2 className="fw-black mb-0 display-6" style={{ color: 'var(--venda-yellow)', WebkitTextStroke: '1.5px var(--color-border)' }}>{score}</h2>
                                        <span className="smallest fw-black text-theme-main opacity-50">POINTS EARNED</span>
                                    </div>
                                </div>
                                <div className="col-6">
                                    <div className="d-flex flex-column align-items-center">
                                        <span className="smallest fw-black text-theme-muted uppercase ls-1 mb-1">STAYED ALIVE</span>
                                        <h2 className="fw-black mb-0 display-6 text-theme-main">{timeStr}</h2>
                                        <span className="smallest fw-black text-theme-main opacity-50">GREAT FOCUS!</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="d-flex flex-column gap-3 px-md-4">
                            <button
                                onClick={() => {
                                    setScore(0);
                                    setLives(INITIAL_LIVES);
                                    setCombo(0);
                                    setGameStatus('playing');
                                    startGame();
                                }}
                                className="btn-game btn-game-warning w-100 py-3 fw-black ls-1 uppercase shadow-action hover-scale"
                                style={{ fontSize: '1.25rem' }}
                            >
                                PLAY AGAIN
                            </button>
                            <button
                                onClick={() => navigate('/mitambo')}
                                className="btn btn-game btn-game-white w-100 py-3 fw-black ls-1 uppercase hover-scale"
                            >
                                BACK TO HUB
                            </button>
                        </div>

                        <p className="mt-4 text-theme-muted smallest fw-black uppercase ls-1 opacity-50">
                            {score > 0 ? "FANTASTIC! YOUR VOCABULARY IS GROWING." : "DON'T GIVE UP! RETRY TO BEAT YOUR BEST."}
                        </p>
                    </div>
                </div>

                <style>{`
                    .shadow-action-lg { box-shadow: 12px 12px 0px var(--color-border); }
                    .letter-spacing-2 { letter-spacing: 4px; }
                    .hover-scale { transition: transform 0.1s ease; }
                    .hover-scale:hover { transform: scale(1.02); }
                    .hover-scale:active { transform: scale(0.98); }
                    .ls-tight { letter-spacing: -2px; }
                `}</style>
            </div>
        );
    }

    return (
        <div className="d-flex flex-column wb-bg overflow-hidden" style={{ height: '100dvh' }} onClick={() => inputRef.current?.focus()}>
            <GameResultModal
                isOpen={showResult}
                isSuccess={resultData.isSuccess}
                title={resultData.title}
                message={resultData.message}
                points={resultData.points}
                primaryActionText="PLAY AGAIN"
                secondaryActionText="EXIT GAME"
                onPrimaryAction={() => { setShowResult(false); startGame(); }}
                onSecondaryAction={() => { setShowResult(false); navigate('/mitambo'); }}
            />

            <ExitConfirmModal
                visible={showExitConfirm}
                onConfirmExit={confirmExit}
                onCancel={() => setShowExitConfirm(false)}
            />

            {gameStatus === 'playing' && (
                <div className="px-3 pt-3 pb-4 w-100 d-flex justify-content-between align-items-center mb-3 position-relative" style={{ zIndex: 100 }}>
                    <div className="container-fluid d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center gap-2 gap-md-3">
                            <button onClick={handleExit} className="btn-game btn-game-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: 40, height: 40, padding: 0 }}>
                                <ArrowLeft size={20} strokeWidth={3} className="text-dark" />
                            </button>
                            <Mascot width={isMobile ? "40px" : "60px"} height={isMobile ? "40px" : "60px"} mood={mascotMood} className="brutalist-card bg-white p-1" />
                            <div className="text-start">
                                <span className="smallest fw-black text-warning uppercase ls-1 mb-0 d-block">Score: {score}</span>
                                <div className="d-flex gap-2 smallest uppercase fw-black opacity-75">
                                    <span>Combo: {combo}</span>
                                    <span>Lvl: {speedLevel}</span>
                                </div>
                            </div>
                        </div>

                        <div className="d-flex flex-column align-items-end gap-1">
                            <div className="bg-warning text-dark brutalist-card--sm px-3 py-1 fw-black d-flex align-items-center gap-2 smallest shadow-action-sm mb-1">
                                {lives} LIVES LEFT
                            </div>
                            <div className="d-flex gap-1">
                                {[...Array(Math.min(INITIAL_LIVES, 10))].map((_, i) => (
                                    <div
                                        key={i}
                                        style={{
                                            width: isMobile ? 8 : 12,
                                            height: isMobile ? 8 : 12,
                                            background: i < lives ? '#EF4444' : 'rgba(255,255,255,0.1)',
                                            border: i < lives ? '1px solid #000' : 'none'
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div id="wb-arena-shake" className="flex-grow-1 position-relative wb-arena overflow-hidden">
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

                {missFlash && <div className="wb-miss-flash" />}

                {gameStatus === 'playing' && (
                    <div className="wb-ground" />
                )}
            </div>

            {gameStatus === 'playing' && (
                isMobile ? (
                    <div className="wb-palette-bar pb-safe">
                        <div className="wb-palette-grid">
                            {paletteOptions.map((opt) => (
                                <button
                                    key={opt.id}
                                    className="wb-palette-btn brutalist-card--sm"
                                    onClick={() => { playClick(); handlePaletteSelection(opt.nativeWord); }}
                                >
                                    <span className="text-truncate" style={{ maxWidth: '100%' }}>{opt.nativeWord || opt.english}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <form id="wb-input-zone" onSubmit={handleSubmit} className="wb-input-bar d-flex gap-3 p-4 bg-theme-base border-top border-theme-main border-4 shadow-action-sm">
                        <input
                            ref={inputRef}
                            type="text"
                            className="brutalist-card bg-theme-card text-theme-main flex-grow-1 p-3 fw-black uppercase ls-1"
                            placeholder={`TYPE THE ${preferredLanguage?.name || 'TARGET'} WORD...`}
                            value={userInput}
                            onChange={handleInputChange}
                            autoFocus
                            autoComplete="off"
                            autoCapitalize="off"
                            style={{ fontSize: '1.1rem' }}
                        />
                        <button type="submit" className="btn-game btn-game-warning px-4 py-2">
                            <Zap size={24} strokeWidth={3} />
                        </button>
                    </form>
                )
            )}

            <style>{`
                .wb-bg {
                    background: var(--color-bg);
                    position: relative;
                    cursor: text;
                    height: 100vh;
                    height: calc(var(--vh, 1vh) * 100);
                    overflow: hidden;
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
                    background: var(--color-card-bg);
                    border: 4px solid var(--color-border);
                    color: var(--color-text);
                    font-weight: 900;
                    padding: clamp(8px, 2vw, 12px) clamp(16px, 4vw, 32px);
                    border-radius: 0;
                    font-size: clamp(0.9rem, 3.5vw, 1.25rem);
                    box-shadow: 4px 4px 0 var(--color-border);
                    text-transform: uppercase;
                    letter-spacing: 1px;
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
                    background: var(--color-bg);
                    border-top: 1px solid var(--color-border-soft);
                    z-index: 100;
                    padding: clamp(10px, 3vw, 20px) !important;
                }
                .smallest { font-size: 11px; }
                .ls-1 { letter-spacing: 1px; }
                .wb-palette-bar {
                    background: var(--color-bg);
                    border-top: 1px solid var(--color-border-soft);
                    padding: 8px 6px;
                    z-index: 100;
                    position: relative;
                }
                .pb-safe { padding-bottom: max(8px, env(safe-area-inset-bottom)); }
                .wb-palette-grid {
                    display: flex;
                    flex-wrap: wrap;
                    justify-content: center;
                    gap: 8px;
                    width: 100%;
                    padding: 4px;
                }
                .wb-palette-btn {
                    background: var(--color-border);
                    border: 3px solid var(--color-border);
                    color: var(--color-text-inv) !important;
                    border-radius: 0;
                    padding: 10px 14px;
                    font-size: 0.95rem;
                    font-weight: 900;
                    text-align: center;
                    min-height: 54px;
                    min-width: 90px;
                    transition: all 0.2s;
                    box-shadow: 4px 4px 0 var(--venda-yellow, #FACC15);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    text-transform: uppercase;
                    cursor: pointer;
                    line-height: 1.1;
                }
                .wb-palette-btn:hover {
                    opacity: 0.9;
                    transform: translateY(-2px);
                    box-shadow: 6px 6px 0 var(--venda-yellow, #FACC15);
                }
                .wb-palette-btn:active {
                    transform: translateY(2px);
                    box-shadow: none !important;
                }
            `}</style>
        </div>
    );
};

export default WordBomb;

