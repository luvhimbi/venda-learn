import React, { useState } from 'react';
import { fetchSentences } from '../../services/dataCache';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { auth, db } from '../../services/firebaseConfig';
import { doc, updateDoc, increment } from 'firebase/firestore';
import Mascot from '../../components/Mascot';

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

const MASCOT_CHEERS = [
    'Zwavhuḓi! 🎉', 'Ndi zwone! ✨', 'Hu ḓo luga! 💪',
    'Wa ḓivha! 🌟', 'Ṱhonifhani! 🔥',
];

const DIFFICULTY_COLORS: Record<string, { bg: string, text: string }> = {
    'Easy': { bg: '#ECFDF5', text: '#065F46' },
    'Medium': { bg: '#FEF3C7', text: '#92400E' },
    'Hard': { bg: '#FEF2F2', text: '#991B1B' },
};

const SentenceScramble: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [puzzles, setPuzzles] = useState<SentencePuzzle[]>([]);
    const [currentPuzzle, setCurrentPuzzle] = useState<SentencePuzzle | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showRules, setShowRules] = useState(false);
    const [selectedLevel, setSelectedLevel] = useState<string | null>(null);

    const [scrambledWords, setScrambledWords] = useState<{ id: string, text: string, colorIdx: number }[]>([]);
    const [answerZone, setAnswerZone] = useState<{ id: string, text: string, colorIdx: number }[]>([]);
    const [status, setStatus] = useState<'playing' | 'correct' | 'wrong'>('playing');
    const [score, setScore] = useState(0);
    const [sessionStartTime, setSessionStartTime] = useState(Date.now());

    // Mascot
    const [showMascotCheer, setShowMascotCheer] = useState(false);
    const [mascotCheerText, setMascotCheerText] = useState(MASCOT_CHEERS[0]);

    // We don't auto-load the game into Playing state anymore
    // useEffect(() => { loadGameData(); }, []);

    const startLevel = async (level: string) => {
        setSelectedLevel(level);
        setLoading(true);
        try {
            const data = await fetchSentences();
            const filtered = data.filter(d => d.difficulty === level);
            const shuffled = [...filtered].sort(() => 0.5 - Math.random());
            setPuzzles(shuffled);
            if (shuffled.length > 0) {
                setupRound(shuffled[0], 0);
            } else {
                Swal.fire('Info', `No sentence puzzles found for ${level}.`, 'info');
                setSelectedLevel(null);
            }
        } catch (error) {
            console.error("Error loading sentences:", error);
            Swal.fire('Error', 'Failed to load game.', 'error');
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
    };

    const handleWordClick = (item: typeof scrambledWords[0], from: 'pool' | 'answer') => {
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
            const totalDuration = Math.floor((Date.now() - sessionStartTime) / 1000);
            setStatus('correct');

            setMascotCheerText(MASCOT_CHEERS[Math.floor(Math.random() * MASCOT_CHEERS.length)]);
            setShowMascotCheer(true);
            setTimeout(() => setShowMascotCheer(false), 1200);

            const user = auth.currentUser;
            if (user) {
                const userRef = doc(db, 'users', user.uid);
                await updateDoc(userRef, {
                    points: increment(10),
                    [`gamePerformance.sentenceScramble.${currentPuzzle.id}`]: {
                        sentence: currentSentence,
                        duration: totalDuration,
                        timestamp: new Date().toISOString()
                    }
                });
            }
            setScore(prev => prev + 10);
            setTimeout(() => nextRound(), 1500);
        } else {
            setStatus('wrong');
            setTimeout(() => setStatus('playing'), 1000);
        }
    };

    const nextRound = () => {
        if (!currentPuzzle) return;
        const nextIdx = (currentIndex + 1) % puzzles.length;
        setSessionStartTime(Date.now());
        setupRound(puzzles[nextIdx], nextIdx);
    };

    if (loading) return (
        <div className="min-vh-100 d-flex flex-column justify-content-center align-items-center" style={{ background: 'linear-gradient(180deg, #111827, #1F2937)' }}>
            <Mascot width="100px" height="100px" mood="excited" />
            <p className="text-white-50 mt-3 fw-bold" style={{ fontSize: '12px', letterSpacing: '2px', textTransform: 'uppercase' }}>Loading sentences...</p>
        </div>
    );

    if (!selectedLevel) {
        return (
            <div className="min-vh-100 d-flex flex-column" style={{ background: 'linear-gradient(180deg, #111827 0%, #1F2937 100%)' }}>
                <div className="container d-flex flex-column align-items-center justify-content-center flex-grow-1 px-3" style={{ maxWidth: '500px' }}>
                    
                    <button onClick={() => navigate('/mitambo')} className="btn btn-link text-decoration-none p-0 text-white-50 position-absolute top-0 start-0 m-4 fw-bold" style={{ fontSize: '11px', letterSpacing: '2px' }}>
                        <i className="bi bi-x-lg me-2"></i>EXIT
                    </button>

                    <div className="text-center mb-5">
                        <div className="d-inline-flex justify-content-center align-items-center mb-3" style={{ width: '80px', height: '80px', background: 'rgba(250, 204, 21, 0.1)', borderRadius: '24px' }}>
                            <span style={{ fontSize: '32px' }}>🔀</span>
                        </div>
                        <h1 className="fw-bold text-white mb-2">Sentence Scramble</h1>
                        <p className="text-white-50 mb-0">Select a difficulty level to begin</p>
                    </div>

                    <div className="w-100 d-flex flex-column gap-3">
                        <button onClick={() => startLevel('Beginner')} className="btn btn-dark border-secondary p-4 rounded-4 text-start position-relative overflow-hidden level-btn text-white">
                            <h5 className="fw-bold mb-1" style={{ color: '#34D399' }}>Beginner</h5>
                            <span className="text-white-50 small">Short and simple everyday sentences</span>
                        </button>
                        
                        <button onClick={() => startLevel('Intermediate')} className="btn btn-dark border-secondary p-4 rounded-4 text-start position-relative overflow-hidden level-btn text-white">
                            <h5 className="fw-bold mb-1" style={{ color: '#FCD34D' }}>Intermediate</h5>
                            <span className="text-white-50 small">Longer phrases and questions</span>
                        </button>
                        
                        <button onClick={() => startLevel('Advanced')} className="btn btn-dark border-secondary p-4 rounded-4 text-start position-relative overflow-hidden level-btn text-white">
                            <h5 className="fw-bold mb-1" style={{ color: '#F87171' }}>Advanced</h5>
                            <span className="text-white-50 small">Complex proverbs and expressions</span>
                        </button>
                    </div>
                </div>

                <style>{`
                    .level-btn {
                        transition: all 0.2s ease;
                        background: #1F2937 !important;
                    }
                    .level-btn:hover {
                        transform: translateY(-2px);
                        border-color: #FACC15 !important;
                        background: #374151 !important;
                    }
                    .level-btn:active {
                        transform: translateY(0);
                    }
                `}</style>
            </div>
        );
    }

    const expectedWords = currentPuzzle?.words.length || 0;
    const diffColors = DIFFICULTY_COLORS[currentPuzzle?.difficulty || 'Easy'] || DIFFICULTY_COLORS['Easy'];

    return (
        <div className="min-vh-100 d-flex flex-column" style={{ background: 'linear-gradient(180deg, #111827 0%, #1F2937 25%, #F9FAFB 25%)' }}>

            {/* DARK HEADER */}
            <div className="px-3 pt-4 pb-5" style={{ color: 'white' }}>
                <div className="container" style={{ maxWidth: '700px' }}>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <button onClick={() => navigate('/mitambo')} className="btn btn-link text-decoration-none p-0 text-white fw-bold" style={{ fontSize: '11px', letterSpacing: '2px' }}>
                            <i className="bi bi-x-lg me-2"></i>EXIT
                        </button>
                        <span className="fw-bold" style={{ color: '#FACC15', fontSize: '11px', letterSpacing: '1px' }}>
                            🔀 SENTENCE SCRAMBLE
                        </span>
                    </div>
                    <div className="d-flex align-items-center justify-content-between">
                        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', fontWeight: 700, letterSpacing: '1px' }}>
                            SENTENCE {currentIndex + 1} / {puzzles.length}
                        </span>
                        <span className="badge rounded-pill px-3 py-2 fw-bold" style={{ background: '#FACC15', color: '#111827', fontSize: '12px' }}>
                            <i className="bi bi-star-fill me-1"></i>{score} XP
                        </span>
                    </div>
                    <div className="mt-2">
                        <div className="progress" style={{ height: '5px', borderRadius: 10, backgroundColor: 'rgba(255,255,255,.12)' }}>
                            <div className="progress-bar" style={{ width: `${((currentIndex + 1) / puzzles.length) * 100}%`, backgroundColor: '#FACC15', transition: '0.5s', borderRadius: 10 }}></div>
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
                        <p className="text-muted mb-3 small">Tap the words in the correct order to form a Tshivenda sentence.</p>
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
                    <div className={`rounded-4 p-4 mb-4 d-flex flex-wrap justify-content-center gap-2 align-items-center transition-all
                        ${status === 'correct' ? 'scr-zone-correct' : ''}
                        ${status === 'wrong' ? 'scr-zone-wrong animate__animated animate__shakeX' : ''}
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
                                <span><i className="bi bi-check-circle-fill me-2"></i>Zwavhuḓi!</span>
                            ) : status === 'wrong' ? (
                                <span><i className="bi bi-x-circle-fill me-2"></i>Lingedza hafhu!</span>
                            ) : (
                                <span>CHECK ANSWER</span>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* MASCOT */}
            {showMascotCheer && (
                <div className="mascot-cheer-overlay">
                    <div className="mascot-cheer-bubble">{mascotCheerText}</div>
                    <Mascot width="80px" height="80px" mood="excited" />
                </div>
            )}

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
                    font-family: 'Poppins', sans-serif;
                    outline: none;
                    white-space: nowrap;
                }
                .scr-chip:active {
                    transform: translateY(2px);
                    box-shadow: none !important;
                }
                .scr-chip-pool:hover {
                    transform: translateY(-2px);
                    filter: brightness(0.97);
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
                    box-shadow: 0 0 20px rgba(52, 211, 153, 0.2);
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
                    font-family: 'Poppins', sans-serif;
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
