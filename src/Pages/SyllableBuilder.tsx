import React, { useState, useEffect } from 'react';
import { fetchSyllables } from '../services/dataCache';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { auth, db } from '../services/firebaseConfig';
import { doc, updateDoc, increment } from 'firebase/firestore';

interface SyllablePuzzle {
    id: string;
    word: string;
    syllables: string[];
    translation: string;
}

const SyllableBuilder: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [puzzles, setPuzzles] = useState<SyllablePuzzle[]>([]);
    const [currentPuzzle, setCurrentPuzzle] = useState<SyllablePuzzle | null>(null);
    const [showRules, setShowRules] = useState(false);

    // State for the game
    const [pool, setPool] = useState<{ id: string, text: string }[]>([]);
    const [placed, setPlaced] = useState<{ id: string, text: string }[]>([]);
    const [status, setStatus] = useState<'playing' | 'correct' | 'wrong'>('playing');
    const [score, setScore] = useState(0);

    useEffect(() => {
        loadGame();
    }, []);

    const loadGame = async () => {
        setLoading(true);
        console.log("SyllableBuilder: Loading game...");
        try {
            const data = await fetchSyllables();
            console.log("SyllableBuilder: Received data:", data);

            // simple shuffle
            const shuffled = [...data].sort(() => 0.5 - Math.random());
            setPuzzles(shuffled);
            if (shuffled.length > 0) {
                console.log("SyllableBuilder: Setting up first round with:", shuffled[0]);
                setupRound(shuffled[0]);
            } else {
                console.warn("SyllableBuilder: No data found.");
                Swal.fire('Info', 'No syllable puzzles found. Please seed the database.', 'info');
                navigate('/mitambo');
            }
        } catch (error) {
            console.error("SyllableBuilder: Error loading syllables:", error);
            Swal.fire('Error', 'Failed to load game.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const setupRound = (puzzle: SyllablePuzzle) => {
        setCurrentPuzzle(puzzle);
        setPlaced([]);
        setStatus('playing');

        // Create pool items with unique IDs to handle duplicate syllables if any
        const poolItems = puzzle.syllables.map((s, i) => ({
            id: `${s}-${i}`,
            text: s
        }));

        // Shuffle the pool
        setPool(poolItems.sort(() => 0.5 - Math.random()));
    };

    const handlePoolClick = (item: { id: string, text: string }) => {
        if (status !== 'playing') return;
        setPool(prev => prev.filter(p => p.id !== item.id));
        setPlaced(prev => [...prev, item]);
    };

    const handlePlacedClick = (item: { id: string, text: string }) => {
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

            // Award XP
            const user = auth.currentUser;
            if (user) {
                const userRef = doc(db, 'users', user.uid);
                await updateDoc(userRef, { points: increment(5) });
            }
            setScore(prev => prev + 5);

            setTimeout(() => {
                nextRound();
            }, 1500);
        } else {
            setStatus('wrong');
            setTimeout(() => setStatus('playing'), 1000);
        }
    };

    const nextRound = () => {
        if (!currentPuzzle) return;
        const currentIndex = puzzles.indexOf(currentPuzzle);
        const nextIndex = (currentIndex + 1) % puzzles.length;
        setupRound(puzzles[nextIndex]);
    };

    if (loading) return (
        <div className="min-vh-100 d-flex justify-content-center align-items-center">
            <div className="spinner-border text-info"></div>
        </div>
    );

    return (
        <div className="min-vh-100 bg-light py-4 d-flex flex-column align-items-center position-relative">

            {/* Rules Modal Overlay */}
            {showRules && (
                <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
                    style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
                    <div className="bg-white p-4 rounded-4 shadow-lg animate__animated animate__fadeInUp" style={{ maxWidth: '500px', width: '90%' }}>
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h4 className="fw-bold m-0"><i className="bi bi-book-half text-info me-2"></i>How to Play</h4>
                            <button onClick={() => setShowRules(false)} className="btn btn-close"></button>
                        </div>
                        <p className="text-muted mb-3">Arrange the blocks to build the correct Venda word!</p>

                        <h6 className="fw-bold text-dark border-bottom pb-2 mb-3">Syllable Rules (Zwiaki)</h6>
                        <ul className="list-group list-group-flush small mb-4">
                            <li className="list-group-item px-0 border-0"><i className="bi bi-check-circle-fill text-success me-2"></i>Syllables usually end in a vowel.</li>
                            <li className="list-group-item px-0 border-0"><i className="bi bi-check-circle-fill text-success me-2"></i>Consonants are always followed by vowels (CV pattern).</li>
                            <li className="list-group-item px-0 border-0"><i className="bi bi-check-circle-fill text-success me-2"></i><strong>Example:</strong> "Vunda" → <span className="badge bg-light text-dark border">Vu</span> - <span className="badge bg-light text-dark border">nda</span></li>
                        </ul>

                        <div className="d-grid">
                            <button onClick={() => setShowRules(false)} className="btn btn-info text-white fw-bold rounded-pill">Got it!</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="container" style={{ maxWidth: '700px' }}>
                {/* HEADER */}
                <div className="d-flex justify-content-between align-items-center mb-5">
                    <button onClick={() => navigate('/mitambo')} className="btn btn-outline-dark btn-sm rounded-circle shadow-sm" style={{ width: '40px', height: '40px' }}>
                        <i className="bi bi-arrow-left"></i>
                    </button>

                    <div className="d-flex align-items-center gap-3">
                        <span className="badge bg-warning text-dark rounded-pill px-3 py-2 shadow-sm border border-warning-subtle">
                            <i className="bi bi-star-fill me-1"></i> {score} XP
                        </span>
                        <button onClick={() => setShowRules(true)} className="btn btn-white text-info shadow-sm rounded-circle border" style={{ width: '40px', height: '40px' }}>
                            <i className="bi bi-question-lg fw-bold"></i>
                        </button>
                    </div>
                </div>

                {/* TARGET CONTEXT */}
                <div className="text-center mb-5 animate__animated animate__fadeIn">
                    <h6 className="text-uppercase text-muted fw-bold ls-1 mb-2">Translate this word</h6>
                    <h1 className="display-4 fw-black text-dark mb-0">{currentPuzzle?.translation}</h1>
                    <div className="mt-2 text-muted small fst-italic">Build the Venda word using the blocks below</div>
                </div>

                {/* DROP ZONE (Answer Area) */}
                <div
                    className={`min-vh-25 rounded-4 border-2 border-dashed mb-5 p-4 d-flex flex-wrap justify-content-center gap-3 align-items-center transition-all bg-white
                        ${status === 'correct' ? 'border-success bg-success-subtle' : ''}
                        ${status === 'wrong' ? 'border-danger bg-danger-subtle animate__animated animate__shakeX' : 'border-secondary-subtle'}
                    `}
                    style={{ minHeight: '160px', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)' }}
                >
                    {placed.length === 0 && (
                        <div className="text-center text-muted opacity-50">
                            <i className="bi bi-hand-index-thumb mb-2 d-block fs-2"></i>
                            <span className="small fw-bold text-uppercase ls-1">Tap blocks to place them here</span>
                        </div>
                    )}
                    {placed.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => handlePlacedClick(item)}
                            className="syllable-block btn fw-bold animate__animated animate__bounceIn"
                        >
                            {item.text}
                        </button>
                    ))}
                </div>

                {/* POOL (Options) */}
                <div className="d-flex flex-wrap justify-content-center gap-3 mb-5">
                    {pool.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => handlePoolClick(item)}
                            className="syllable-block btn fw-bold animate__animated animate__fadeInUp"
                        >
                            {item.text}
                        </button>
                    ))}
                </div>

                {/* CONTROLS */}
                <div className="text-center">
                    <button
                        onClick={checkAnswer}
                        disabled={placed.length === 0}
                        className={`btn rounded-pill px-5 py-3 fw-bold fs-5 shadow-lg transition-all ${placed.length > 0 ? 'btn-primary' : 'btn-secondary opacity-50'
                            }`}
                        style={{ transform: placed.length > 0 ? 'scale(1.05)' : 'scale(1)' }}
                    >
                        {status === 'correct' ? (
                            <span><i className="bi bi-check-lg me-2"></i>Correct!</span>
                        ) : status === 'wrong' ? (
                            <span><i className="bi bi-x-lg me-2"></i>Try Again</span>
                        ) : (
                            'Check Answer'
                        )}
                    </button>
                </div>
            </div>

            <style>{`
                .syllable-block {
                    background-color: #f8f9fa;
                    color: #333;
                    border: 1px solid #dee2e6;
                    border-bottom: 4px solid #adb5bd;
                    border-radius: 12px;
                    padding: 12px 24px;
                    font-size: 1.5rem;
                    min-width: 70px;
                    transition: all 0.1s ease;
                    text-transform: capitalize;
                }
                
                .syllable-block:active {
                    transform: translateY(3px);
                    border-bottom-width: 1px;
                    box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
                }

                .transition-all { transition: all 0.3s ease; }
                .ls-1 { letter-spacing: 1px; }
                .fw-black { font-weight: 900; }
                .min-vh-25 { min-height: 25vh; }
            `}</style>
        </div>
    );
};

export default SyllableBuilder;
