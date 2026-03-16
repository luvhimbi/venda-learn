import React, { useState } from 'react';
import { fetchSyllables } from '../../services/dataCache';
import { useNavigate } from 'react-router-dom';
import { Layout, Star, HelpCircle } from 'lucide-react';
import Swal from 'sweetalert2';
import { auth, db } from '../../services/firebaseConfig';
import { doc, updateDoc, increment } from 'firebase/firestore';
import Mascot from '../../components/Mascot';

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

const MASCOT_CHEERS = [
    'Zwavhuḓi!',
    'Ndi zwone!',
    'Hu ḓo luga!',
    'Wa ḓivha!',
    'Ṱhonifhani!',
];

const SyllableBuilder: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [puzzles, setPuzzles] = useState<SyllablePuzzle[]>([]);
    const [currentPuzzle, setCurrentPuzzle] = useState<SyllablePuzzle | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showRules, setShowRules] = useState(false);
    const [selectedLevel, setSelectedLevel] = useState<string | null>(null);

    const [pool, setPool] = useState<{ id: string, text: string, colorIdx: number }[]>([]);
    const [placed, setPlaced] = useState<{ id: string, text: string, colorIdx: number }[]>([]);
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
            const data = await fetchSyllables();
            const filtered = data.filter(d => d.difficulty === level);
            const shuffled = [...filtered].sort(() => 0.5 - Math.random());
            setPuzzles(shuffled);
            if (shuffled.length > 0) {
                setupRound(shuffled[0], 0);
            } else {
                Swal.fire('Info', `No puzzles found for ${level}.`, 'info');
                setSelectedLevel(null);
            }
        } catch (error) {
            console.error("Error loading syllables:", error);
            Swal.fire('Error', 'Failed to load game.', 'error');
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
    };

    const handlePoolClick = (item: typeof pool[0]) => {
        if (status !== 'playing') return;
        setPool(prev => prev.filter(p => p.id !== item.id));
        setPlaced(prev => [...prev, item]);
    };

    const handlePlacedClick = (item: typeof pool[0]) => {
        if (status !== 'playing') return;
        setPlaced(prev => prev.filter(p => p.id !== item.id));
        setPool(prev => [...prev, item]);
    };

    const checkAnswer = async () => {
        if (!currentPuzzle) return;

        const currentWord = placed.map(p => p.text).join('').toLowerCase();
        const targetWord = currentPuzzle.word.toLowerCase();

        if (currentWord === targetWord) {
            setStatus('correct');
            const totalDuration = Math.floor((Date.now() - sessionStartTime) / 1000);

            // Mascot cheer
            setMascotCheerText(MASCOT_CHEERS[Math.floor(Math.random() * MASCOT_CHEERS.length)]);
            setShowMascotCheer(true);
            setTimeout(() => setShowMascotCheer(false), 1200);

            const user = auth.currentUser;
            if (user) {
                const userRef = doc(db, 'users', user.uid);
                await updateDoc(userRef, {
                    points: increment(5),
                    [`gamePerformance.syllableBuilder.${currentPuzzle.id}`]: {
                        word: currentPuzzle.word,
                        duration: totalDuration,
                        timestamp: new Date().toISOString()
                    }
                });
            }
            setScore(prev => prev + 5);
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
            <p className="text-white-50 mt-3 fw-bold" style={{ fontSize: '12px', letterSpacing: '2px', textTransform: 'uppercase' }}>Loading puzzles...</p>
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
                            <Layout size={40} color="#FACC15" />
                        </div>
                        <h1 className="fw-bold text-white mb-2">Syllable Builder</h1>
                        <p className="text-white-50 mb-0">Select a difficulty level to begin</p>
                    </div>

                    <div className="w-100 d-flex flex-column gap-3">
                        <button onClick={() => startLevel('Beginner')} className="btn btn-dark border-secondary p-4 rounded-4 text-start position-relative overflow-hidden level-btn text-white">
                            <h5 className="fw-bold mb-1" style={{ color: '#34D399' }}>Beginner</h5>
                            <span className="text-white-50 small">Basic syllables and simple words</span>
                        </button>
                        
                        <button onClick={() => startLevel('Intermediate')} className="btn btn-dark border-secondary p-4 rounded-4 text-start position-relative overflow-hidden level-btn text-white">
                            <h5 className="fw-bold mb-1" style={{ color: '#FCD34D' }}>Intermediate</h5>
                            <span className="text-white-50 small">Longer words and prefixes</span>
                        </button>
                        
                        <button onClick={() => startLevel('Advanced')} className="btn btn-dark border-secondary p-4 rounded-4 text-start position-relative overflow-hidden level-btn text-white">
                            <h5 className="fw-bold mb-1" style={{ color: '#F87171' }}>Advanced</h5>
                            <span className="text-white-50 small">Complex syllable structures</span>
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

    const expectedSlots = currentPuzzle?.syllables.length || 0;

    return (
        <div className="min-vh-100 d-flex flex-column" style={{ background: 'linear-gradient(180deg, #111827 0%, #1F2937 25%, #F9FAFB 25%)' }}>

            {/* DARK HEADER */}
            <div className="px-3 pt-4 pb-5" style={{ color: 'white' }}>
                <div className="container" style={{ maxWidth: '700px' }}>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <button onClick={() => navigate('/mitambo')} className="btn btn-link text-decoration-none p-0 text-white fw-bold" style={{ fontSize: '11px', letterSpacing: '2px' }}>
                            <i className="bi bi-x-lg me-2"></i>EXIT
                        </button>
                        <div className="d-flex align-items-center gap-2">
                            <span className="fw-bold d-flex align-items-center gap-2" style={{ color: '#FACC15', fontSize: '11px', letterSpacing: '1px' }}>
                                <Layout size={14} /> SYLLABLE BUILDER
                            </span>
                        </div>
                    </div>
                    <div className="d-flex align-items-center justify-content-between">
                        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', fontWeight: 700, letterSpacing: '1px' }}>
                            PUZZLE {currentIndex + 1} / {puzzles.length}
                        </span>
                        <span className="badge rounded-pill px-3 py-2 fw-bold d-flex align-items-center gap-1" style={{ background: '#FACC15', color: '#111827', fontSize: '12px' }}>
                            <Star size={14} fill="currentColor" /> {score} XP
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
                            <h5 className="fw-bold m-0"><i className="bi bi-book-half me-2" style={{ color: '#FACC15' }}></i>How to Play</h5>
                            <button onClick={() => setShowRules(false)} className="btn btn-close"></button>
                        </div>
                        <p className="text-muted mb-3 small">Arrange the syllable blocks to build the correct Tshivenda word!</p>
                        <ul className="list-unstyled small mb-4">
                            <li className="mb-2"><i className="bi bi-check-circle-fill text-success me-2"></i>Tap a block to place it in the answer zone</li>
                            <li className="mb-2"><i className="bi bi-check-circle-fill text-success me-2"></i>Tap a placed block to remove it</li>
                            <li className="mb-2"><i className="bi bi-check-circle-fill text-success me-2"></i>Syllables usually end in a vowel (CV pattern)</li>
                            <li><i className="bi bi-check-circle-fill text-success me-2"></i><strong>Example:</strong> "Vunda" → <span className="badge bg-light text-dark border">Vu</span> + <span className="badge bg-light text-dark border">nda</span></li>
                        </ul>
                        <button onClick={() => setShowRules(false)} className="btn w-100 fw-bold rounded-3 py-2" style={{ background: '#FACC15', color: '#111827' }}>Got it!</button>
                    </div>
                </div>
            )}

            {/* MAIN CONTENT */}
            <div className="flex-grow-1 px-3" style={{ marginTop: '-20px' }}>
                <div className="container" style={{ maxWidth: '700px' }}>

                    {/* PROMPT CARD */}
                    <div className="bg-white rounded-4 shadow-sm p-4 text-center mb-4 border">
                        <p className="text-muted fw-bold mb-1" style={{ fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase' }}>Translate this word</p>
                        <h1 className="fw-bold mb-1" style={{ fontSize: 'clamp(2rem, 8vw, 3.5rem)', color: '#111827', letterSpacing: '-1px' }}>
                            {currentPuzzle?.translation}
                        </h1>
                        <p className="text-muted small mb-0">Build the Tshivenda word using the blocks below</p>
                        <button onClick={() => setShowRules(true)} className="btn btn-link text-muted small text-decoration-none mt-1 d-flex align-items-center justify-content-center gap-1">
                            <HelpCircle size={14} /> How to play
                        </button>
                    </div>

                    {/* ANSWER SLOTS */}
                    <div className={`rounded-4 p-4 mb-4 d-flex flex-wrap justify-content-center gap-3 align-items-center transition-all
                        ${status === 'correct' ? 'syl-zone-correct' : ''}
                        ${status === 'wrong' ? 'syl-zone-wrong animate__animated animate__shakeX' : ''}
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
                    font-family: 'Poppins', sans-serif;
                    outline: none;
                }
                .syl-block:active {
                    transform: translateY(3px);
                    box-shadow: none !important;
                }
                .syl-block-pool:hover {
                    transform: translateY(-2px);
                    filter: brightness(0.97);
                }

                /* EMPTY SLOTS */
                .syl-empty-slot {
                    width: 72px;
                    height: 56px;
                    border: 2px dashed #D1D5DB;
                    border-radius: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #D1D5DB;
                    font-weight: 700;
                    font-size: 1rem;
                }

                /* ANSWER ZONE STATES */
                .syl-zone-default {
                    background: #F9FAFB;
                    border: 2px dashed #D1D5DB;
                }
                .syl-zone-correct {
                    background: #ECFDF5;
                    border: 2px solid #34D399;
                    box-shadow: 0 0 20px rgba(52, 211, 153, 0.2);
                }
                .syl-zone-wrong {
                    background: #FEF2F2;
                    border: 2px solid #F87171;
                }

                /* CHECK BUTTON STATES */
                .syl-btn-check {
                    background: #111827;
                    color: white;
                    border: none;
                    box-shadow: 0 4px 0 #000;
                }
                .syl-btn-check:disabled {
                    opacity: 0.4;
                    box-shadow: 0 4px 0 #555;
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
                    background: #111827;
                    color: #FACC15;
                    font-size: 14px;
                    font-weight: 800;
                    font-family: 'Poppins', sans-serif;
                    letter-spacing: 0.5px;
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

export default SyllableBuilder;
