import React, { useState, useEffect } from 'react';
import { fetchSentences } from '../../services/dataCache';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { auth, db } from '../../services/firebaseConfig';
import { doc, updateDoc, increment } from 'firebase/firestore';

interface SentencePuzzle {
    id: string;
    words: string[];
    translation: string;
    difficulty: string;
}

const SentenceScramble: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [puzzles, setPuzzles] = useState<SentencePuzzle[]>([]);
    const [currentPuzzle, setCurrentPuzzle] = useState<SentencePuzzle | null>(null);
    const [showRules, setShowRules] = useState(false);

    // Game State
    const [scrambledWords, setScrambledWords] = useState<{ id: string, text: string }[]>([]);
    const [answerZone, setAnswerZone] = useState<{ id: string, text: string }[]>([]);
    const [status, setStatus] = useState<'playing' | 'correct' | 'wrong'>('playing');
    const [score, setScore] = useState(0);
    const [sessionStartTime, setSessionStartTime] = useState(Date.now());

    useEffect(() => {
        loadGame();
    }, []);

    const loadGame = async () => {
        setLoading(true);
        try {
            const data = await fetchSentences();
            const shuffled = [...data].sort(() => 0.5 - Math.random());
            setPuzzles(shuffled);
            if (shuffled.length > 0) {
                setupRound(shuffled[0]);
            } else {
                Swal.fire('Info', 'No sentence puzzles found. Please have an admin seed the database.', 'info');
                navigate('/mitambo');
            }
        } catch (error) {
            console.error("Error loading sentences:", error);
            Swal.fire('Error', 'Failed to load game.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const setupRound = (puzzle: SentencePuzzle) => {
        setCurrentPuzzle(puzzle);
        setAnswerZone([]);
        setStatus('playing');

        // Prepare words with unique IDs
        const wordsWithIds = puzzle.words.map((w, i) => ({
            id: `${w}-${i}-${Math.random()}`, // Ensure uniqueness
            text: w
        }));

        // Scramble them for the pool
        const scrambled = [...wordsWithIds].sort(() => 0.5 - Math.random());
        setScrambledWords(scrambled);
    };

    const handleWordClick = (item: { id: string, text: string }, from: 'pool' | 'answer') => {
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

        // Check if length matches first
        if (answerZone.length !== currentPuzzle.words.length) {
            setStatus('wrong');
            setTimeout(() => setStatus('playing'), 1000);
            return;
        }

        if (currentSentence === correctSentence) {
            const totalDuration = Math.floor((Date.now() - sessionStartTime) / 1000);
            setStatus('correct');

            // Award XP
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
                }); // Higher points for sentences
            }
            setScore(prev => prev + 10);

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
        setSessionStartTime(Date.now());
        setupRound(puzzles[nextIndex]);
    };

    if (loading) return (
        <div className="min-vh-100 d-flex justify-content-center align-items-center">
            <div className="spinner-border text-primary"></div>
        </div>
    );

    return (
        <div className="min-vh-100 py-4 d-flex flex-column align-items-center position-relative" style={{ backgroundColor: '#F3F4F6' }}>

            {/* Rules Modal */}
            {showRules && (
                <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
                    style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
                    <div className="bg-white p-4 rounded-4 shadow-lg animate__animated animate__fadeInUp" style={{ maxWidth: '500px', width: '90%' }}>
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h4 className="fw-bold m-0"><i className="bi bi-info-circle text-primary me-2"></i>How to Play</h4>
                            <button onClick={() => setShowRules(false)} className="btn btn-close"></button>
                        </div>
                        <p className="text-muted mb-3">Tap the words in the correct order to form a meaningful Tshivenda sentence.</p>

                        <h6 className="fw-bold text-dark border-bottom pb-2 mb-3">Example</h6>
                        <div className="p-3 bg-light rounded-3 mb-3 text-center">
                            <span className="badge bg-secondary me-1">zwili</span>
                            <span className="badge bg-secondary me-1">Ndi</span>
                            <span className="badge bg-secondary">funa</span>
                            <div className="my-2"><i className="bi bi-arrow-down"></i></div>
                            <span className="badge bg-success me-1">Ndi</span>
                            <span className="badge bg-success me-1">funa</span>
                            <span className="badge bg-success">zwili</span>
                        </div>

                        <div className="d-grid">
                            <button onClick={() => setShowRules(false)} className="btn btn-primary text-white fw-bold rounded-pill">Got it!</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="container" style={{ maxWidth: '800px' }}>
                {/* HEADER */}
                <div className="d-flex justify-content-between align-items-center mb-5">
                    <button onClick={() => navigate('/mitambo')} className="btn btn-outline-dark btn-sm rounded-circle shadow-sm" style={{ width: '40px', height: '40px' }}>
                        <i className="bi bi-arrow-left"></i>
                    </button>

                    <div className="d-flex align-items-center gap-3">
                        <span className="badge bg-warning text-dark rounded-pill px-3 py-2 shadow-sm border border-warning-subtle">
                            <i className="bi bi-star-fill me-1"></i> {score} XP
                        </span>
                        <button onClick={() => setShowRules(true)} className="btn btn-white text-primary shadow-sm rounded-circle border" style={{ width: '40px', height: '40px' }}>
                            <i className="bi bi-question-lg fw-bold"></i>
                        </button>
                    </div>
                </div>

                {/* TARGET CONTEXT */}
                <div className="text-center mb-5 animate__animated animate__fadeIn">
                    <h6 className="text-uppercase text-muted fw-bold ls-1 mb-2">Translate this sentence</h6>
                    <h2 className="fw-black text-dark mb-0 display-6">"{currentPuzzle?.translation}"</h2>
                    <div className="mt-2 text-muted small fst-italic">Tap words to arrange the Venda sentence</div>
                </div>

                {/* ANSWER ZONE */}
                <div
                    className={`min-vh-25 rounded-4 border-2 border-dashed mb-5 p-4 d-flex flex-wrap justify-content-center gap-2 align-items-center transition-all bg-white
                        ${status === 'correct' ? 'border-success bg-success-subtle' : ''}
                        ${status === 'wrong' ? 'border-danger bg-danger-subtle animate__animated animate__shakeX' : 'border-primary-subtle'}
                    `}
                    style={{ minHeight: '120px', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)' }}
                >
                    {answerZone.length === 0 && (
                        <div className="text-center text-muted opacity-50 w-100">
                            <span className="small fw-bold text-uppercase ls-1">Your sentence will appear here</span>
                        </div>
                    )}
                    {answerZone.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => handleWordClick(item, 'answer')}
                            className="btn btn-primary fw-bold animate__animated animate__bounceIn shadow-sm"
                            style={{ fontSize: '1.2rem' }}
                        >
                            {item.text}
                        </button>
                    ))}
                </div>

                {/* WORD POOL */}
                <div className="d-flex flex-wrap justify-content-center gap-3 mb-5">
                    {scrambledWords.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => handleWordClick(item, 'pool')}
                            className="btn btn-light border fw-bold animate__animated animate__fadeInUp shadow-sm text-dark"
                            style={{ fontSize: '1.2rem', minWidth: '80px' }}
                        >
                            {item.text}
                        </button>
                    ))}
                </div>

                {/* CONTROLS */}
                <div className="text-center">
                    <button
                        onClick={checkAnswer}
                        disabled={answerZone.length === 0}
                        className={`btn btn-lg rounded-pill px-5 fw-bold shadow-sm transition-all ${status === 'correct' ? 'btn-success' : 'btn-dark'
                            }`}
                        style={{ transform: 'scale(1.05)' }}
                    >
                        {status === 'correct' ? (
                            <span><i className="bi bi-check-lg me-2"></i>Correct!</span>
                        ) : (
                            <span>Check Answer</span>
                        )}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default SentenceScramble;



