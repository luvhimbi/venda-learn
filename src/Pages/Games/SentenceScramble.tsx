import React, { useState, useCallback } from 'react';
import { fetchSentences, fetchUserData, fetchLanguages, awardPoints } from '../../services/dataCache';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../services/firebaseConfig';
import GameResultModal from '../../components/GameResultModal';
import { doc, updateDoc, getDoc, type Firestore } from 'firebase/firestore';
import Mascot from '../../components/Mascot';
import confetti from 'canvas-confetti';
import { updateStreak } from "../../services/streakUtils.ts";
import { useVisualJuice } from '../../hooks/useVisualJuice';
import { Flame, ArrowLeft, ChevronRight, Hash, Star, HelpCircle, BookOpen, MousePointerClick, Trophy } from 'lucide-react';
import GameIntroModal, { resetIntroSeen } from '../../components/GameIntroModal';
import ExitConfirmModal from '../../components/ExitConfirmModal';

interface SentencePuzzle {
    id: string;
    words: string[];
    translation: string;
    difficulty: string;
}

const CHIP_COLORS = [
    { bg: '#EFF6FF', border: '#93C5FD', shadow: '#60A5FA', text: '#1E40AF' },
    { bg: '#FEF3C7', border: '#FCD34D', shadow: '#F59E0B', text: '#92400E' },
    { bg: '#ECFDF5', border: '#6EE7B7', shadow: '#34D399', text: '#065F46' },
    { bg: '#FDF2F8', border: '#F9A8D4', shadow: '#EC4899', text: '#9D174D' },
    { bg: '#F5F3FF', border: '#C4B5FD', shadow: '#8B5CF6', text: '#5B21B6' },
    { bg: '#FFF7ED', border: '#FDBA74', shadow: '#F97316', text: '#9A3412' },
    { bg: '#F0FDFA', border: '#5EEAD4', shadow: '#14B8A6', text: '#134E4A' },
];



const DIFFICULTY_COLORS: Record<string, { bg: string, text: string }> = {
    'Easy': { bg: '#ECFDF5', text: '#065F46' },
    'Medium': { bg: '#FEF3C7', text: '#92400E' },
    'Hard': { bg: '#FEF2F2', text: '#991B1B' },
};

const SENTENCE_SCRAMBLE_INTRO_STEPS = [
    {
        icon: <BookOpen size={28} strokeWidth={3} />,
        title: 'Read the Sentence',
        description: 'An English sentence is shown at the top. Your job is to translate it!'
    },
    {
        icon: <MousePointerClick size={28} strokeWidth={3} />,
        title: 'Tap Words in Order',
        description: 'Tap the scrambled words in the correct order to form the translated sentence.'
    },
    {
        icon: <Trophy size={28} strokeWidth={3} />,
        title: 'Check Your Answer',
        description: 'Hit CHECK ANSWER when done. Correct answers earn +10 XP! Tap placed words to remove them.'
    }
];

const SentenceScramble: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [puzzles, setPuzzles] = useState<SentencePuzzle[]>([]);
    const [currentPuzzle, setCurrentPuzzle] = useState<SentencePuzzle | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showRules, setShowRules] = useState(false);
    const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
    const [preferredLanguage, setPreferredLanguage] = useState<any>(null);
    const [showIntro, setShowIntro] = useState(true);
    const [showExitConfirm, setShowExitConfirm] = useState(false);
    const [showResult, setShowResult] = useState(false);
    const [resultData, setResultData] = useState({ isSuccess: false, title: '', message: '', points: 0 });

    const [scrambledWords, setScrambledWords] = useState<{ id: string, text: string, colorIdx: number }[]>([]);
    const [answerZone, setAnswerZone] = useState<{ id: string, text: string, colorIdx: number }[]>([]);
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
                fetchSentences(),
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
                const isCorrectLang = !activeLang || d.languageId === activeLang.id || (!d.languageId && activeLang.name.toLowerCase().includes('venda'));
                return isCorrectDifficulty && isCorrectLang;
            });

            const shuffled = [...filtered].sort(() => 0.5 - Math.random());
            setPuzzles(shuffled);
            if (shuffled.length > 0) {
                setupRound(shuffled[0], 0);
            } else {
                setResultData({
                    isSuccess: false,
                    title: 'No Puzzles',
                    message: `No sentence puzzles found for ${level} in ${activeLang?.name || 'this language'}.`,
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

    const setupRound = (puzzle: SentencePuzzle, idx: number) => {
        setCurrentPuzzle(puzzle);
        setCurrentIndex(idx);
        setAnswerZone([]);
        setStatus('playing');

        const wordsWithIds = puzzle.words.map((w, i) => ({
            id: `${w}-${i}-${Math.random()}`,
            text: w,
            colorIdx: i % CHIP_COLORS.length
        }));
        setScrambledWords([...wordsWithIds].sort(() => 0.5 - Math.random()));

        // Fetch streak for UI
        if (auth.currentUser) {
            getDoc(doc(db, "users", auth.currentUser.uid)).then(snap => {
                if (snap.exists()) setStreak(snap.data().streak || 0);
            });
        }
    };

    const handleWordClick = (item: typeof scrambledWords[0], from: 'pool' | 'answer') => {
        playClick();
        if (status !== 'playing') return;
        if (from === 'pool') {
            setScrambledWords(prev => prev.filter(w => w.id !== item.id));
            setAnswerZone(prev => [...prev, item]);
        } else {
            setAnswerZone(prev => prev.filter(w => w.id !== item.id));
            setScrambledWords(prev => [...prev, item]);
        }
    };

    const checkAnswer = async () => {
        if (!currentPuzzle) return;

        const currentSentence = answerZone.map(w => w.text).join(' ').trim();
        const correctSentence = currentPuzzle.words.join(' ').trim();

        if (answerZone.length !== currentPuzzle.words.length) {
            setStatus('wrong');
            setTimeout(() => setStatus('playing'), 1000);
            return;
        }

        if (currentSentence === correctSentence) {
            playCorrect();
            const totalDuration = Math.floor((Date.now() - sessionStartTime) / 1000);
            setStatus('correct');


            
            // CONFETTI!
            confetti({
                particleCount: 120,
                spread: 80,
                origin: { y: 0.6 },
                colors: ['#FACC15', '#FFD700', '#3B82F6', '#FFFFFF']
            });



            const user = auth.currentUser;
            if (user) {
                // Using centralized awardPoints to ensure weekly leaderboard sync
                await awardPoints(10);

                const userRef = doc(db as Firestore, 'users', user.uid);
                await updateDoc(userRef, {
                    [`gamePerformance.sentenceScramble.${currentPuzzle.id}`]: {
                        sentence: currentSentence,
                        duration: totalDuration,
                        timestamp: new Date().toISOString()
                    }
                });
                await updateStreak(user.uid);
            }
            setScore(prev => prev + 10);
            setTimeout(() => nextRound(), 1500);
        } else {
            setStatus('wrong');
            playWrong();
            triggerShake('scr-answer-zone');
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
                message: `Excellent! You've mastered all ${puzzles.length} sentences in this level.`,
                points: score
            });
            setShowResult(true);
            return;
        }

        setSessionStartTime(Date.now());
        setupRound(puzzles[nextIdx], nextIdx);
    };

    if (loading) return (
        <div className="min-vh-100 d-flex flex-column justify-content-center align-items-center bg-white">
            <Mascot width="100px" height="100px" mood="excited" />
            <p className="text-muted mt-3 fw-bold" style={{ fontSize: '12px', letterSpacing: '2px', textTransform: 'uppercase' }}>Loading sentences...</p>
        </div>
    );

    if (!selectedLevel) {
        return (
            <div className="min-vh-100 p-4 d-flex flex-column align-items-center justify-content-center" style={{ backgroundColor: '#ffffff' }}>

                {/* INTRO MODAL */}
                {showIntro && (
                    <GameIntroModal
                        gameId="sentenceScramble"
                        gameTitle="SENTENCE SCRAMBLE"
                        gameIcon={<Hash size={28} strokeWidth={3} />}
                        steps={SENTENCE_SCRAMBLE_INTRO_STEPS}
                        accentColor="#FACC15"
                        onClose={handleIntroDismiss}
                    />
                )}

                <div className="container d-flex flex-column align-items-center" style={{ maxWidth: '600px' }}>
                    <div className="w-100 d-flex justify-content-start mb-4">
                        <button onClick={() => navigate('/mitambo')} className="btn btn-link text-decoration-none p-0 text-dark">
                            <ArrowLeft size={24} />
                        </button>
                    </div>

                    <div className="text-center mb-5 d-flex flex-column align-items-center">
                        <div className="brutalist-card bg-warning p-4 mb-4 shadow-action-sm">
                            <Hash size={48} strokeWidth={3} className="text-dark" />
                        </div>
                        <h1 className="fw-black mb-2 text-dark uppercase ls-tight display-5 text-center">SENTENCE SCRAMBLE</h1>
                        <p className="fw-bold text-muted uppercase smallest ls-1">Master {preferredLanguage?.name || ''} sentence structures</p>
                    </div>

                    <div className="d-flex flex-column gap-4 w-100">
                        {['Beginner', 'Intermediate', 'Advanced'].map((lvl) => (
                            <button
                                key={lvl}
                                onClick={() => startLevel(lvl)}
                                className="brutalist-card transition-all hover-lift--sm w-100 p-4 text-start bg-white shadow-action-sm"
                            >
                                <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                        <h2 className="fw-black mb-1 uppercase ls-1" style={{ fontSize: '1.25rem' }}>{lvl}</h2>
                                        <p className="fw-bold text-muted small mb-0">
                                            {lvl === 'Beginner' ? 'Short everyday interactions' : lvl === 'Intermediate' ? 'Standard dialogue & structures' : 'Deep language logic & proverbs'}
                                        </p>
                                    </div>
                                    <div className="bg-warning p-2 border border-dark border-2 rounded-circle">
                                        <ChevronRight strokeWidth={4} className="text-dark" size={20} />
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={() => { resetIntroSeen('sentenceScramble'); setShowIntro(true); }}
                        className="btn-game btn-game-white w-100 p-3 mt-4 d-flex align-items-center justify-content-center gap-2"
                        style={{ maxWidth: '600px' }}
                    >
                        <HelpCircle size={18} strokeWidth={3} /> HOW TO PLAY
                    </button>
                </div>

                <style>{`
                    .brutalist-card:hover {
                        transform: translateY(-4px);
                        border-color: #FACC15 !important;
                        background-color: #FFFDF5 !important;
                        box-shadow: 8px 8px 0 #111827 !important;
                    }
                `}</style>
            </div>
        );
    }
    const expectedWords = currentPuzzle?.words.length || 0;
    const diffColors = DIFFICULTY_COLORS[currentPuzzle?.difficulty || 'Easy'] || DIFFICULTY_COLORS['Easy'];

    return (
        <div className="min-vh-100 d-flex flex-column bg-white" style={{ 
            backgroundColor: '#ffffff',
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23000000\' fill-opacity=\'0.01\' fill-rule=\'evenodd\'%3E%3Ccircle cx=\'3\' cy=\'3\' r=\'1\'/%3E%3C/g%3E%3C/svg%3E")' 
        }}>
            {/* RESULT MODAL */}
            <GameResultModal
                isOpen={showResult}
                isSuccess={resultData.isSuccess}
                title={resultData.title}
                message={resultData.message}
                points={resultData.points}
                primaryActionText={resultData.isSuccess ? "PLAY AGAIN" : "TRY AGAIN"}
                secondaryActionText="EXIT TO MENU"
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
            <div className="px-3 pt-4 pb-5 bg-dark text-white border-bottom border-dark border-4 shadow-action-sm">
                <div className="container" style={{ maxWidth: '700px' }}>
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <button onClick={handleExit} className="btn-game btn-game-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: 44, height: 44, padding: 0 }}>
                            <ArrowLeft size={24} strokeWidth={3} className="text-dark" />
                        </button>
                        <div className="text-center">
                            <span className="smallest fw-black text-warning uppercase ls-1 mb-0 d-block">{preferredLanguage?.name || 'Local'} Grammar</span>
                        </div>
                        <div className="d-flex align-items-center gap-3">
                             {streak > 0 && (
                                <div className="d-flex align-items-center flex-column bg-warning brutalist-card--sm px-2 py-1" title="Daily Streak">
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
                    style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1050 }}>
                    <div className="bg-white p-4 rounded-4 shadow-lg animate__animated animate__fadeInUp" style={{ maxWidth: '450px', width: '90%' }}>
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h5 className="fw-bold m-0"><i className="bi bi-info-circle me-2" style={{ color: '#FACC15' }}></i>How to Play</h5>
                            <button onClick={() => setShowRules(false)} className="btn btn-close"></button>
                        </div>
                        <p className="text-muted mb-3 small">Tap the words in the correct order to form a sentence.</p>
                        <div className="p-3 bg-light rounded-3 mb-3 text-center">
                            <span className="badge bg-secondary me-1">zwili</span>
                            <span className="badge bg-secondary me-1">Ndi</span>
                            <span className="badge bg-secondary">funa</span>
                            <div className="my-2"><i className="bi bi-arrow-down"></i></div>
                            <span className="badge bg-success me-1">Ndi</span>
                            <span className="badge bg-success me-1">funa</span>
                            <span className="badge bg-success">zwili</span>
                        </div>
                        <button onClick={() => setShowRules(false)} className="btn w-100 fw-bold rounded-3 py-2" style={{ background: '#FACC15', color: '#111827' }}>Got it!</button>
                    </div>
                </div>
            )}

            {/* MAIN CONTENT */}
            <div className="flex-grow-1 px-3" style={{ marginTop: '-20px' }}>
                <div className="container" style={{ maxWidth: '700px' }}>

                    {/* PROMPT CARD */}
                    <div className="bg-white rounded-4 shadow-sm p-4 text-center mb-4 border">
                        <p className="text-muted fw-bold mb-1" style={{ fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase' }}>Translate this sentence</p>
                        <h2 className="fw-bold mb-2" style={{ color: '#111827', letterSpacing: '-0.5px', fontSize: 'clamp(1.3rem, 5vw, 2rem)' }}>
                            "{currentPuzzle?.translation}"
                        </h2>
                        <div className="d-flex justify-content-center gap-2 align-items-center">
                            <span className="badge rounded-pill px-3 py-1 fw-bold" style={{ background: diffColors.bg, color: diffColors.text, fontSize: '10px', letterSpacing: '1px' }}>
                                {currentPuzzle?.difficulty?.toUpperCase()}
                            </span>
                            <button onClick={() => setShowRules(true)} className="btn btn-link text-muted small text-decoration-none p-0">
                                <i className="bi bi-question-circle"></i>
                            </button>
                        </div>
                    </div>

                    {/* ANSWER ZONE */}
                    <div id="scr-answer-zone" className={`rounded-4 p-4 mb-4 d-flex flex-wrap justify-content-center gap-2 align-items-center transition-all
                        ${status === 'correct' ? 'scr-zone-correct' : ''}
                        ${status === 'wrong' ? 'scr-zone-wrong' : ''}
                        ${status === 'playing' ? 'scr-zone-default' : ''}
                    `} style={{ minHeight: '100px' }}>
                        {answerZone.length === 0 ? (
                            Array.from({ length: expectedWords }).map((_, i) => (
                                <div key={`slot-${i}`} className="scr-empty-slot"></div>
                            ))
                        ) : (
                            <>
                                {answerZone.map((item) => {
                                    const c = CHIP_COLORS[item.colorIdx];
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => handleWordClick(item, 'answer')}
                                            className="scr-chip animate__animated animate__bounceIn"
                                            style={{ background: c.bg, color: c.text, borderColor: c.border, boxShadow: `0 3px 0 ${c.shadow}` }}
                                        >
                                            {item.text}
                                        </button>
                                    );
                                })}
                                {answerZone.length < expectedWords && Array.from({ length: expectedWords - answerZone.length }).map((_, i) => (
                                    <div key={`rem-${i}`} className="scr-empty-slot"></div>
                                ))}
                            </>
                        )}
                    </div>

                    {/* WORD POOL */}
                    <div className="d-flex flex-wrap justify-content-center gap-3 mb-5">
                        {scrambledWords.map((item) => {
                            const c = CHIP_COLORS[item.colorIdx];
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => handleWordClick(item, 'pool')}
                                    className="scr-chip scr-chip-pool animate__animated animate__fadeInUp"
                                    style={{ background: c.bg, color: c.text, borderColor: c.border, boxShadow: `0 3px 0 ${c.shadow}` }}
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
                            disabled={answerZone.length === 0}
                            className={`btn rounded-3 px-5 py-3 fw-bold fs-6 transition-all
                                ${status === 'correct' ? 'scr-btn-correct' : status === 'wrong' ? 'scr-btn-wrong' : 'scr-btn-check'}
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

                /* WORD CHIPS */
                .scr-chip {
                    border: 2px solid;
                    border-radius: 24px;
                    padding: 10px 22px;
                    font-size: 1.1rem;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.15s ease;
                    font-family: var(--game-font-family);
                    outline: none;
                    white-space: nowrap;
                }
                .scr-chip:active {
                    transform: translateY(2px);
                    box-shadow: none !important;
                }
                .scr-chip-pool:hover {
                    transform: translateY(-4px) scale(1.05);
                    filter: brightness(1.05);
                }
                .scr-chip-pool:active {
                    transform: translateY(1px) scale(0.98);
                }

                /* EMPTY SLOTS */
                .scr-empty-slot {
                    width: 60px;
                    height: 40px;
                    border: 2px dashed #D1D5DB;
                    border-radius: 24px;
                }

                /* ZONE STATES */
                .scr-zone-default {
                    background: #F9FAFB;
                    border: 2px dashed #D1D5DB;
                }
                .scr-zone-correct {
                    background: #ECFDF5;
                    border: 2px solid #34D399;
                    box-shadow: 0 0 30px rgba(52, 211, 153, 0.4);
                    animation: successPulseScramble 1.5s infinite;
                }
                @keyframes successPulseScramble {
                    0% { box-shadow: 0 0 20px rgba(52, 211, 153, 0.2); }
                    50% { box-shadow: 0 0 40px rgba(52, 211, 153, 0.5); }
                    100% { box-shadow: 0 0 20px rgba(52, 211, 153, 0.2); }
                }
                .scr-zone-wrong {
                    background: #FEF2F2;
                    border: 2px solid #F87171;
                }

                /* BUTTON STATES */
                .scr-btn-check {
                    background: #111827;
                    color: white;
                    border: none;
                    box-shadow: 0 4px 0 #000;
                }
                .scr-btn-check:disabled { opacity: 0.4; box-shadow: 0 4px 0 #555; }
                .scr-btn-check:active:not(:disabled) { transform: translateY(3px); box-shadow: none; }
                .scr-btn-correct {
                    background: #10B981; color: white; border: none; box-shadow: 0 4px 0 #059669;
                }
                .scr-btn-wrong {
                    background: #EF4444; color: white; border: none; box-shadow: 0 4px 0 #DC2626;
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
                    background: #111827;
                    color: #FACC15;
                    font-size: 14px;
                    font-weight: 800;
                    font-family: var(--game-font-family);
                    padding: 8px 20px;
                    border-radius: 20px;
                    margin-bottom: 6px;
                    white-space: nowrap;
                    box-shadow: 0 4px 16px rgba(250, 204, 21, 0.25);
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
                    border-top: 6px solid #111827;
                }
            `}</style>
        </div>
    );
};

export default SentenceScramble;
