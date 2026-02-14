import React, { useState, useEffect, useRef } from 'react';
import { fetchPicturePuzzles } from '../services/dataCache';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { auth, db } from '../services/firebaseConfig';
import { doc, updateDoc, increment } from 'firebase/firestore';

interface GameSlide {
    imageUrl: string;
    venda: string;
    english: string;
}

const GAME_DURATION = 60; // 60 seconds

const PicturePuzzle: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [slides, setSlides] = useState<GameSlide[]>([]);
    const [currentSlide, setCurrentSlide] = useState<GameSlide | null>(null);
    const [options, setOptions] = useState<string[]>([]);
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
    const [gameActive, setGameActive] = useState(false);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        loadGameData();
        return () => stopTimer();
    }, []);

    useEffect(() => {
        if (gameActive && timeLeft > 0) {
            timerRef.current = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        endGame();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => stopTimer();
    }, [gameActive]);

    const stopTimer = () => {
        if (timerRef.current) clearInterval(timerRef.current);
    };

    const loadGameData = async () => {
        setLoading(true);
        try {
            const allSlides = await fetchPicturePuzzles();

            // Shuffle slides
            const shuffled = [...allSlides].sort(() => 0.5 - Math.random());
            setSlides(shuffled);

            if (shuffled.length > 0) {
                setGameActive(true);
                setupRound(shuffled[0], shuffled);
            } else {
                Swal.fire('Error', 'No image puzzles found!', 'error');
                navigate('/mitambo');
            }
        } catch (error) {
            console.error("Error loading picture puzzle:", error);
            Swal.fire('Error', 'Failed to load game data.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const setupRound = (target: GameSlide, allSlides: GameSlide[]) => {
        setCurrentSlide(target);

        // Generate options (1 correct + 3 random)
        const otherOptions = allSlides
            .filter(s => s.venda !== target.venda)
            .sort(() => 0.5 - Math.random())
            .slice(0, 3)
            .map(s => s.venda);

        const roundOptions = [target.venda, ...otherOptions].sort(() => 0.5 - Math.random());
        setOptions(roundOptions);
    };

    const handleAnswer = (answer: string) => {
        if (!gameActive || !currentSlide) return;

        if (answer === currentSlide.venda) {
            // Correct
            const newScore = score + 5;
            setScore(newScore);

            // Next round
            const currentIndex = slides.indexOf(currentSlide);
            const nextIndex = (currentIndex + 1) % slides.length;
            setupRound(slides[nextIndex], slides);
        } else {
            // Wrong - Shake/Feedback (Optional: Deduction?)
            // For now just ignore or small shake
            const btn = document.getElementById(`btn-${answer}`);
            if (btn) {
                btn.classList.add('animate__animated', 'animate__shakeX', 'btn-danger');
                setTimeout(() => {
                    btn.classList.remove('animate__animated', 'animate__shakeX', 'btn-danger');
                }, 500);
            }
        }
    };

    const endGame = async () => {
        setGameActive(false);
        stopTimer();

        // Award XP
        const user = auth.currentUser;
        if (user && score > 0) {
            try {
                const userRef = doc(db, 'users', user.uid);
                await updateDoc(userRef, {
                    points: increment(score)
                });
            } catch (e) {
                console.error("Error saving score:", e);
            }
        }

        Swal.fire({
            title: 'Tshifhinga tsho fhela! (Time Up!)',
            text: `You scored ${score} XP!`,
            icon: 'success',
            confirmButtonText: 'Play Again',
            showCancelButton: true,
            cancelButtonText: 'Exit'
        }).then((result) => {
            if (result.isConfirmed) {
                setScore(0);
                setTimeLeft(GAME_DURATION);
                setGameActive(true);
                // Reshuffle
                const reshuffled = [...slides].sort(() => 0.5 - Math.random());
                setSlides(reshuffled);
                setupRound(reshuffled[0], reshuffled);
            } else {
                navigate('/mitambo');
            }
        });
    };

    if (loading) return (
        <div className="min-vh-100 d-flex justify-content-center align-items-center">
            <div className="spinner-border text-warning"></div>
        </div>
    );

    return (
        <div className="min-vh-100 bg-light py-4 d-flex flex-column align-items-center">
            <div className="container" style={{ maxWidth: '600px' }}>
                {/* HEADER */}
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <button onClick={() => navigate('/mitambo')} className="btn btn-outline-dark btn-sm rounded-circle">
                        <i className="bi bi-arrow-left"></i>
                    </button>
                    <h4 className="fw-bold mb-0">Tshifaniso Race</h4>
                    <div className="badge bg-dark fs-6 d-flex align-items-center gap-2">
                        <i className="bi bi-clock"></i> {timeLeft}s
                    </div>
                </div>

                {/* GAME CARD */}
                <div className="card border-0 shadow-lg rounded-4 overflow-hidden mb-4">
                    <div className="card-body p-0 text-center bg-white">
                        <div className="bg-light p-4 d-flex align-items-center justify-content-center" style={{ height: '300px' }}>
                            {currentSlide?.imageUrl ? (
                                <img
                                    src={currentSlide.imageUrl}
                                    alt="Puzzle"
                                    className="img-fluid rounded shadow-sm"
                                    style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
                                />
                            ) : (
                                <div className="text-muted">No Image</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* SCORE */}
                <div className="text-center mb-4">
                    <span className="badge bg-warning text-dark fs-5 shadow-sm">
                        Score: {score} XP
                    </span>
                </div>

                {/* OPTIONS */}
                <div className="row g-3">
                    {options.map((opt, i) => (
                        <div key={i} className="col-6">
                            <button
                                id={`btn-${opt}`}
                                onClick={() => handleAnswer(opt)}
                                className="btn btn-white w-100 p-4 shadow-sm border fw-bold text-uppercase option-btn"
                                style={{ fontSize: '1.2rem', transition: 'all 0.2s' }}
                            >
                                {opt}
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            <style>{`
                .option-btn:hover {
                    transform: translateY(-3px);
                    background-color: #FACC15 !important;
                    border-color: #FACC15 !important;
                }
                .option-btn:active {
                    transform: scale(0.98);
                }
                .btn-danger {
                    background-color: #EF4444 !important;
                    color: white !important;
                    border-color: #EF4444 !important;
                }
            `}</style>
        </div>
    );
};

export default PicturePuzzle;
