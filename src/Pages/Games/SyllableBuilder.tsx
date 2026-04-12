import React, { useState, useCallback } from 'react';
import { fetchSyllables, fetchUserData, fetchLanguages, awardPoints } from '../../services/dataCache';
import { useNavigate } from 'react-router-dom';
import { Layout, Star, HelpCircle, ArrowLeft, ChevronRight, Flame, MousePointerClick, Trophy } from 'lucide-react';
import { auth, db } from '../../services/firebaseConfig';
import GameResultModal from '../../components/GameResultModal';
import { doc, updateDoc, getDoc, type Firestore } from 'firebase/firestore';
import Mascot from '../../components/Mascot';
import confetti from 'canvas-confetti';
import { updateStreak } from "../../services/streakUtils.ts";
import { useVisualJuice } from '../../hooks/useVisualJuice';
import GameIntroModal, { resetIntroSeen } from '../../components/GameIntroModal';
import ExitConfirmModal from '../../components/ExitConfirmModal';


interface SyllablePuzzle {
    id: string;
    word: string;
    syllables: string[];
    translation: string;
}

const BLOCK_COLORS = [
    { bg: '#EFF6FF', border: '#93C5FD', shadow: '#60A5FA', text: '#1E40AF' },
    { bg: '#FEF3C7', border: '#FCD34D', shadow: '#F59E0B', text: '#92400E' },
    { bg: '#ECFDF5', border: '#6EE7B7', shadow: '#34D399', text: '#065F46' },
    { bg: '#FDF2F8', border: '#F9A8D4', shadow: '#EC4899', text: '#9D174D' },
    { bg: '#F5F3FF', border: '#C4B5FD', shadow: '#8B5CF6', text: '#5B21B6' },
    { bg: '#FFF7ED', border: '#FDBA74', shadow: '#F97316', text: '#9A3412' },
];



const SYLLABLE_BUILDER_INTRO_STEPS = [
    {
        icon: <Layout size={28} strokeWidth={3} />,
        title: 'See the Word',
        description: 'An English word is shown at the top. Your goal is to build its translation!'
    },
    {
        icon: <MousePointerClick size={28} strokeWidth={3} />,
        title: 'Tap Syllable Blocks',
        description: 'Tap the syllable blocks in the correct order. Tap placed blocks to remove them.'
    },
    {
        icon: <Trophy size={28} strokeWidth={3} />,
        title: 'Build the Word!',
        description: 'Once all blocks are placed correctly, hit CHECK ANSWER. Each correct word = +5 XP!'
    }
];

const SyllableBuilder: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [puzzles, setPuzzles] = useState<SyllablePuzzle[]>([]);
    const [currentPuzzle, setCurrentPuzzle] = useState<SyllablePuzzle | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showIntro, setShowIntro] = useState(true);
    const [showRules, setShowRules] = useState(false);
    const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
    const [showExitConfirm, setShowExitConfirm] = useState(false);
    const [showResult, setShowResult] = useState(false);
    const [resultData, setResultData] = useState({ isSuccess: false, title: '', message: '', points: 0 });

    const [preferredLanguage, setPreferredLanguage] = useState<any>(null);
    const [pool, setPool] = useState<{ id: string, text: string, colorIdx: number }[]>([]);
    const [placed, setPlaced] = useState<{ id: string, text: string, colorIdx: number }[]>([]);
    const [status, setStatus] = useState<'playing' | 'correct' | 'wrong'>('playing');
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(0);
    const [sessionStartTime, setSessionStartTime] = useState(Date.now());
    const { playCorrect, playWrong, playClick, triggerShake } = useVisualJuice();

    const handleIntroDismiss = useCallback(() => setShowIntro(false), []);

    const handleExit = () => {
        if (selectedLevel) {
            setShowExitConfirm(true);
        } else {
            navigate('/mitambo');
        }
    };

    const confirmExit = () => {
        setShowExitConfirm(false);
        navigate('/mitambo');
    };



    // We don't auto-load the game into Playing state anymore
    // useEffect(() => { loadGameData(); }, []);

    const startLevel = async (level: string) => {
        setSelectedLevel(level);
        setLoading(true);
        try {
            const [data, uData, langs] = await Promise.all([
                fetchSyllables(),
                fetchUserData(),
                fetchLanguages()
            ]);

            let activeLang: any = null;
            if (uData && langs) {
                activeLang = langs.find((l: any) => l.id === uData.preferredLanguageId);
                setPreferredLanguage(activeLang);
            }

            const filtered = data.filter(d => {
                const isCorrectDifficulty = d.difficulty === level;
                const isCorrectLang = !activeLang || d.languageId === activeLang.id || !d.languageId;
                return isCorrectDifficulty && isCorrectLang;
            });

            // Shuffle and limit to 5 puzzles to avoid repetition and make the session finite
            const shuffled = [...filtered].sort(() => 0.5 - Math.random()).slice(0, 5);
            setPuzzles(shuffled);
            if (shuffled.length > 0) {
                setupRound(shuffled[0], 0);
            } else {
                setResultData({
                    isSuccess: false,
                    title: 'No Puzzles',
                    message: `No puzzles found for ${level} in ${activeLang?.name || 'this language'}.`,
                    points: 0
                });
                setShowResult(true);
                setSelectedLevel(null);
            }
        } catch (error) {
            setResultData({
                isSuccess: false,
                title: 'Error',
                message: 'Failed to load game data. Please try again.',
                points: 0
            });
            setShowResult(true);
            setSelectedLevel(null);
        } finally {
            setLoading(false);
        }
    };

    const setupRound = (puzzle: SyllablePuzzle, idx: number) => {
        setCurrentPuzzle(puzzle);
        setCurrentIndex(idx);
        setPlaced([]);
        setStatus('playing');

        const poolItems = puzzle.syllables.map((s, i) => ({
            id: `${s}-${i}`,
            text: s,
            colorIdx: i % BLOCK_COLORS.length
        }));
        setPool(poolItems.sort(() => 0.5 - Math.random()));

        // Fetch streak for UI
        if (auth.currentUser) {
            getDoc(doc(db as Firestore, "users", auth.currentUser.uid)).then(snap => {
                if (snap.exists()) setStreak(snap.data().streak || 0);
            });
        }
    };

    const handlePoolClick = (item: typeof pool[0]) => {
        playClick();
        if (status !== 'playing') return;
        setPool(prev => prev.filter(p => p.id !== item.id));
        setPlaced(prev => [...prev, item]);
    };

    const handlePlacedClick = (item: typeof pool[0]) => {
        playClick();
        if (status !== 'playing') return;
        setPlaced(prev => prev.filter(p => p.id !== item.id));
        setPool(prev => [...prev, item]);
    };

    const checkAnswer = async () => {
        if (!currentPuzzle || status !== 'playing') return;

        const currentWord = placed.map(p => p.text).join('').toLowerCase();
        const targetWord = currentPuzzle.word.toLowerCase();

        if (currentWord === targetWord) {
            setStatus('correct');
            playCorrect();
            const totalDuration = Math.floor((Date.now() - sessionStartTime) / 1000);


            
            // CONFETTI!
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#FACC15', '#FFD700', '#FFFFFF']
            });



            const user = auth.currentUser;
            if (user) {
                // Using centralized awardPoints to ensure weekly leaderboard sync
                await awardPoints(5);

                const userRef = doc(db as Firestore, 'users', user.uid);
                await updateDoc(userRef, {
                    [`gamePerformance.syllableBuilder.${currentPuzzle.id}`]: {
                        word: currentPuzzle.word,
                        duration: totalDuration,
                        timestamp: new Date().toISOString()
                    }
                });
                await updateStreak(user.uid);
            }
            setScore(prev => prev + 5);
            setTimeout(() => nextRound(), 1500);
        } else {
            setStatus('wrong');
            playWrong();
            triggerShake('game-answer-zone');
            setTimeout(() => setStatus('playing'), 1000);
        }
    };

    const nextRound = () => {
        if (!currentPuzzle) return;
        const nextIdx = currentIndex + 1;
        
        if (nextIdx >= puzzles.length) {
            setResultData({
                isSuccess: true,
                title: 'Category Complete!',
                message: `You've built all ${puzzles.length} words in this level. Ndi hone!`,
                points: score + 5 // Include points for the last correctly answered word
            });
            setShowResult(true);
            return;
        }

        setSessionStartTime(Date.now());
        setupRound(puzzles[nextIdx], nextIdx);
    };

    if (loading) return (
        <div className="min-vh-100 bg-theme-base d-flex flex-column justify-content-center align-items-center">
            <Mascot width="100px" height="100px" mood="excited" />
            <p className="text-theme-muted mt-3 fw-bold" style={{ fontSize: '12px', letterSpacing: '2px', textTransform: 'uppercase' }}>Loading puzzles...</p>
        </div>
    );

    if (!selectedLevel) {
        return (
            <div className="min-vh-100 p-4 d-flex flex-column align-items-center justify-content-center bg-theme-base" style={{ minHeight: '100vh' }}>

                {/* INTRO MODAL */}
                {showIntro && (
                    <GameIntroModal
                        gameId="syllableBuilder"
                        gameTitle="SYLLABLE BUILDER"
                        gameIcon={<Layout size={28} strokeWidth={3} />}
                        steps={SYLLABLE_BUILDER_INTRO_STEPS}
                        accentColor="#FACC15"
                        onClose={handleIntroDismiss}
                    />
                )}

                <div className="container d-flex flex-column align-items-center" style={{ maxWidth: '600px' }}>
                    <div className="w-100 d-flex justify-content-start mb-4">
                        <button onClick={() => navigate('/mitambo')} className="btn btn-link text-decoration-none p-0 text-theme-main">
                            <ArrowLeft size={24} />
                        </button>
                    </div>

                    <div className="text-center mb-5 d-flex flex-column align-items-center">
                        <div className="brutalist-card bg-warning p-4 mb-4 shadow-action-sm">
                            <Layout size={48} strokeWidth={3} className="text-dark" />
                        </div>
                        <h1 className="fw-black mb-2 text-theme-main uppercase ls-tight display-5">SYLLABLE BUILDER</h1>
                        <p className="fw-bold text-theme-muted uppercase smallest ls-1">Master building {preferredLanguage?.name || ''} words</p>
                    </div>

                    <div className="d-flex flex-column gap-4 w-100">
                        {['Beginner', 'Intermediate', 'Advanced'].map((lvl) => (
                            <button
                                key={lvl}
                                onClick={() => startLevel(lvl)}
                                className="brutalist-card transition-all hover-lift--sm w-100 p-4 text-start bg-theme-card text-theme-main shadow-action-sm border-theme-main"
                            >
                                <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                        <h2 className="fw-black mb-1 uppercase ls-1" style={{ fontSize: '1.25rem' }}>{lvl}</h2>
                                        <p className="fw-bold text-muted small mb-0">
                                            {lvl === 'Beginner' ? 'Simple 2-syllable items' : lvl === 'Intermediate' ? 'Standard 3-syllable phrases' : 'Complex multilingual constructs'}
                                        </p>
                                    </div>
                                    <div className="bg-warning p-2 border border-theme-main border-2 rounded-circle">
                                        <ChevronRight strokeWidth={4} className="text-black" size={20} />
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={() => { resetIntroSeen('syllableBuilder'); setShowIntro(true); }}
                        className="btn-game btn-game-white w-100 p-3 mt-4 d-flex align-items-center justify-content-center gap-2"
                        style={{ maxWidth: '600px' }}
                    >
                        <HelpCircle size={18} strokeWidth={3} /> HOW TO PLAY
                    </button>
                </div>

                <style>{`
                    .brutalist-card:hover {
                        transform: translateY(-4px);
                        border-color: var(--venda-yellow) !important;
                        background-color: var(--venda-yellow) !important;
                        box-shadow: 8px 8px 0 var(--color-border) !important;
                        color: #111827 !important;
                    }
                    .brutalist-card:hover p, 
                    .brutalist-card:hover h2 {
                        color: #111827 !important;
                    }
                    .brutalist-card:hover .bg-warning {
                        background-color: var(--color-border) !important;
                        border-color: var(--color-border) !important;
                    }
                    .brutalist-card:hover .bg-warning svg {
                        color: var(--venda-yellow) !important;
                    }
                `}</style>
            </div>
        );
    }

    const expectedSlots = currentPuzzle?.syllables.length || 0;

    return (
        <div className="min-vh-100 d-flex flex-column bg-theme-base" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'currentColor\' fill-opacity=\'0.01\' fill-rule=\'evenodd\'%3E%3Ccircle cx=\'3\' cy=\'3\' r=\'1\'/%3E%3C/g%3E%3C/svg%3E")' }}>
            {/* RESULT MODAL */}
            <GameResultModal
                isOpen={showResult}
                isSuccess={resultData.isSuccess}
                title={resultData.title}
                message={resultData.message}
                points={resultData.points}
                primaryActionText={resultData.isSuccess ? "PLAY AGAIN" : "TRY AGAIN"}
                secondaryActionText="EXIT TO DASHBOARD"
                onPrimaryAction={() => { setShowResult(false); setSelectedLevel(null); setScore(0); }}
                onSecondaryAction={() => { setShowResult(false); navigate('/mitambo'); }}
            />
            {/* EXIT CONFIRM MODAL */}
            <ExitConfirmModal
                visible={showExitConfirm}
                onConfirmExit={confirmExit}
                onCancel={() => setShowExitConfirm(false)}
            />

            {/* HEADER */}
            <div className="px-3 pt-4 pb-5 bg-theme-surface border-bottom border-theme-main border-4 shadow-action-sm">
                <div className="container" style={{ maxWidth: '700px' }}>
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <button onClick={handleExit} className="btn-game btn-game-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: 44, height: 44, padding: 0 }}>
                            <ArrowLeft size={24} strokeWidth={3} className="text-theme-main" />
                        </button>
                        <div className="text-center">
                            <span className="smallest fw-black text-warning uppercase ls-1 mb-0 d-block">{preferredLanguage?.name || 'Local'} Builder</span>
                            <h2 className="fw-black mb-0 text-theme-main ls-tight" style={{ fontSize: '1.5rem' }}>SILEBI</h2>
                        </div>
                        <div className="d-flex align-items-center gap-3">
                             {streak > 0 && (
                                <div className="d-flex align-items-center flex-column bg-warning brutalist-card--sm px-2 py-1 border border-theme-main" title="Daily Streak">
                                    <Flame size={18} color="#000" fill="#000" />
                                    <span className="fw-black smallest text-dark">{streak}</span>
                                </div>
                            )}
                            <Mascot width="45px" height="45px" mood={status === 'correct' ? 'excited' : status === 'wrong' ? 'sad' : 'happy'} />
                        </div>
                    </div>
                    <div className="d-flex align-items-center justify-content-between gap-4">
                        <div className="flex-grow-1">
                            <div className="d-flex justify-content-between smallest fw-black uppercase mb-1 opacity-75">
                                <span>Progress</span>
                                <span>{currentIndex + 1} / {puzzles.length}</span>
                            </div>
                            <div className="progress border border-white border-opacity-10" style={{ height: '10px', borderRadius: 0, backgroundColor: 'rgba(255,255,255,0.05)' }}>
                                <div className="progress-bar bg-warning" style={{ width: `${((currentIndex + 1) / puzzles.length) * 100}%`, transition: '0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}></div>
                            </div>
                        </div>
                        <div className="bg-warning text-dark brutalist-card--sm px-3 py-1 fw-black d-flex align-items-center gap-2 smallest shadow-action-sm">
                            <Star size={14} fill="currentColor" /> {score} XP
                        </div>
                    </div>
                </div>
            </div>

            {/* Rules Modal */}
            {showRules && (
                <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
                    style={{ backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1050 }}>
                    <div className="bg-theme-card p-4 rounded-4 shadow-lg animate__animated animate__fadeInUp border border-theme-main" style={{ maxWidth: '450px', width: '90%' }}>
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h5 className="fw-black m-0 text-theme-main uppercase"><HelpCircle size={20} className="text-warning me-2" strokeWidth={3} />How to Play</h5>
                            <button onClick={() => setShowRules(false)} className="btn-close btn-close-white"></button>
                        </div>
                        <p className="text-theme-muted mb-3 small fw-bold">Arrange the syllable blocks to build the correct word.</p>
                        <ul className="list-unstyled small mb-4">
                            <li className="mb-2 text-theme-main"><span className="text-success me-2">●</span>Tap a block to place it in the answer zone</li>
                            <li className="mb-2 text-theme-main"><span className="text-success me-2">●</span>Tap a placed block to remove it</li>
                            <li className="mb-2 text-theme-main"><span className="text-success me-2">●</span>Syllables usually end in a vowel (CV pattern)</li>
                            <li className="text-theme-main"><span className="text-success me-2">●</span><strong>Example:</strong> "Vunda" → <span className="badge bg-theme-surface text-theme-main border border-theme-main">Vu</span> + <span className="badge bg-theme-surface text-theme-main border border-theme-main">nda</span></li>
                        </ul>
                        <button onClick={() => setShowRules(false)} className="btn-game btn-game-primary w-100 py-2">Got it!</button>
                    </div>
                </div>
            )}

            {/* MAIN CONTENT */}
            <div className="flex-grow-1 px-3" style={{ marginTop: '-20px' }}>
                <div className="container" style={{ maxWidth: '700px' }}>

                    {/* PROMPT CARD */}
                    <div className="bg-theme-card rounded-4 shadow-sm p-4 text-center mb-4 border border-theme-main">
                        <p className="text-theme-muted fw-bold mb-1" style={{ fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase' }}>Translate this word</p>
                        <h1 className="fw-bold mb-1 text-theme-main" style={{ fontSize: 'clamp(2rem, 8vw, 3.5rem)', letterSpacing: '-1px' }}>
                            {currentPuzzle?.translation}
                        </h1>
                        <p className="text-theme-muted small mb-0">Build the correct word using the blocks below.</p>
                        <button onClick={() => setShowRules(true)} className="btn btn-link text-theme-muted small text-decoration-none mt-1 d-flex align-items-center justify-content-center gap-1">
                            <HelpCircle size={14} /> How to play
                        </button>
                    </div>

                    {/* ANSWER SLOTS */}
                    <div id="game-answer-zone" className={`rounded-4 p-4 mb-4 d-flex flex-wrap justify-content-center gap-3 align-items-center transition-all
                        ${status === 'correct' ? 'syl-zone-correct' : ''}
                        ${status === 'wrong' ? 'syl-zone-wrong' : ''}
                        ${status === 'playing' ? 'syl-zone-default' : ''}
                    `} style={{ minHeight: '130px' }}>
                        {placed.length === 0 ? (
                            // Show empty slots
                            Array.from({ length: expectedSlots }).map((_, i) => (
                                <div key={`slot-${i}`} className="syl-empty-slot">
                                    <span>{i + 1}</span>
                                </div>
                            ))
                        ) : (
                            <>
                                {placed.map((item) => {
                                    const c = BLOCK_COLORS[item.colorIdx];
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => handlePlacedClick(item)}
                                            className="syl-block animate__animated animate__bounceIn"
                                            style={{ background: c.bg, color: c.text, borderColor: c.border, boxShadow: `0 4px 0 ${c.shadow}` }}
                                        >
                                            {item.text}
                                        </button>
                                    );
                                })}
                                {/* remaining empty slots */}
                                {placed.length < expectedSlots && Array.from({ length: expectedSlots - placed.length }).map((_, i) => (
                                    <div key={`rem-${i}`} className="syl-empty-slot">
                                        <span>{placed.length + i + 1}</span>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>

                    {/* POOL */}
                    <div className="d-flex flex-wrap justify-content-center gap-3 mb-5">
                        {pool.map((item) => {
                            const c = BLOCK_COLORS[item.colorIdx];
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => handlePoolClick(item)}
                                    className="syl-block syl-block-pool animate__animated animate__fadeInUp"
                                    style={{ background: c.bg, color: c.text, borderColor: c.border, boxShadow: `0 4px 0 ${c.shadow}` }}
                                >
                                    {item.text}
                                </button>
                            );
                        })}
                    </div>

                    {/* CHECK BUTTON */}
                    <div className="text-center pb-4">
                        <button
                            onClick={checkAnswer}
                            disabled={placed.length === 0}
                            className={`btn rounded-3 px-5 py-3 fw-bold fs-6 transition-all
                                ${status === 'correct' ? 'syl-btn-correct' : status === 'wrong' ? 'syl-btn-wrong' : 'syl-btn-check'}
                            `}
                            style={{ minWidth: '220px', letterSpacing: '1px' }}
                        >
                            {status === 'correct' ? (
                                <span><i className="bi bi-check-circle-fill me-2"></i>Great job!</span>
                            ) : status === 'wrong' ? (
                                <span><i className="bi bi-x-circle-fill me-2"></i>Try again!</span>
                            ) : (
                                <span>CHECK ANSWER</span>
                            )}
                        </button>
                    </div>
                </div>
            </div>



            <style>{`
                .transition-all { transition: all 0.3s ease; }

                /* SYLLABLE BLOCKS */
                .syl-block {
                    border: 2px solid;
                    border-radius: 14px;
                    padding: 12px 26px;
                    font-size: 1.5rem;
                    font-weight: 800;
                    min-width: 72px;
                    cursor: pointer;
                    transition: all 0.15s ease;
                    text-transform: capitalize;
                    font-family: var(--game-font-family);
                    outline: none;
                }
                .syl-block:active {
                    transform: translateY(3px);
                    box-shadow: none !important;
                }
                .syl-block-pool:hover {
                    transform: translateY(-4px) scale(1.05);
                    filter: brightness(1.05);
                }
                .syl-block-pool:active {
                    transform: translateY(1px) scale(0.98);
                }

                /* EMPTY SLOTS */
                .syl-empty-slot {
                    width: 72px;
                    height: 56px;
                    border: 2px dashed var(--color-border-soft, #D1D5DB);
                    border-radius: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--color-text-muted, #D1D5DB);
                    font-weight: 700;
                    font-size: 1rem;
                }

                /* ANSWER ZONE STATES */
                .syl-zone-default {
                    background: var(--color-surface-soft, #F9FAFB);
                    border: 2px dashed var(--color-border-soft, #D1D5DB);
                }
                .syl-zone-correct {
                    background: #ECFDF5;
                    border: 2px solid #34D399;
                    box-shadow: 0 0 30px rgba(52, 211, 153, 0.4);
                    animation: successPulse 1.5s infinite;
                }
                @keyframes successPulse {
                    0% { box-shadow: 0 0 20px rgba(52, 211, 153, 0.2); }
                    50% { box-shadow: 0 0 40px rgba(52, 211, 153, 0.5); }
                    100% { box-shadow: 0 0 20px rgba(52, 211, 153, 0.2); }
                }
                .syl-zone-wrong {
                    background: #FEF2F2;
                    border: 2px solid #F87171;
                }

                /* CHECK BUTTON STATES */
                .syl-btn-check {
                    background: var(--color-border, #111827);
                    color: var(--color-text-inv, #ffffff);
                    border: none;
                    box-shadow: 0 4px 0 var(--color-shadow, #000);
                }
                .syl-btn-check:disabled {
                    opacity: 0.4;
                    box-shadow: 0 4px 0 var(--color-shadow, #555);
                }
                .syl-btn-check:active:not(:disabled) {
                    transform: translateY(3px);
                    box-shadow: none;
                }
                .syl-btn-correct {
                    background: #10B981;
                    color: white;
                    border: none;
                    box-shadow: 0 4px 0 #059669;
                }
                .syl-btn-wrong {
                    background: #EF4444;
                    color: white;
                    border: none;
                    box-shadow: 0 4px 0 #DC2626;
                }

                /* MASCOT CHEER */
                @keyframes cheerPopIn {
                    0%   { opacity: 0; transform: translateY(40px) scale(0.7); }
                    50%  { opacity: 1; transform: translateY(-8px) scale(1.05); }
                    100% { opacity: 1; transform: translateY(0) scale(1); }
                }
                .mascot-cheer-overlay {
                    position: fixed;
                    bottom: 24px;
                    left: 50%;
                    transform: translateX(-50%);
                    z-index: 60;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    animation: cheerPopIn 0.4s ease-out forwards;
                    pointer-events: none;
                    filter: drop-shadow(0 6px 20px rgba(0,0,0,0.15));
                }
                .mascot-cheer-bubble {
                    background: var(--color-border);
                    color: var(--venda-yellow, #FACC15);
                    font-size: 14px;
                    font-weight: 800;
                    font-family: var(--game-font-family);
                    letter-spacing: 0.5px;
                    padding: 8px 20px;
                    border-radius: 20px;
                    margin-bottom: 6px;
                    white-space: nowrap;
                    box-shadow: 0 4px 16px var(--color-shadow);
                    position: relative;
                }
                .mascot-cheer-bubble::after {
                    content: '';
                    position: absolute;
                    bottom: -6px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 0; height: 0;
                    border-left: 6px solid transparent;
                    border-right: 6px solid transparent;
                    border-top: 6px solid var(--color-border);
                }
            `}</style>
        </div>
    );
};

export default SyllableBuilder;

