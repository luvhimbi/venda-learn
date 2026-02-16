import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { warmupGameCache } from '../../services/dataCache';
import { auth } from '../../services/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { Puzzle, Image, Layout, FileText, Gamepad2, Calendar } from 'lucide-react';

const GamesDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setIsLoggedIn(!!user);
        });
        warmupGameCache();
        return () => unsubscribe();
    }, []);

    const games = [
        {
            id: 'word-puzzle',
            title: 'Guess The correct venda word',
            description: 'Guess the 5-letter Venda word. A daily challenge to test your vocabulary!',
            icon: <Puzzle size={64} />,
            route: '/word-puzzle',
            color: 'bg-primary',
            gradient: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)'
        },
        {
            id: 'picture-puzzle',
            title: 'Match the pictures with venda words',
            description: 'Race against the clock! Match the pictures to the correct Venda words.',
            icon: <Image size={64} />,
            route: '/picture-puzzle',
            color: 'bg-warning',
            gradient: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)'
        },
        {
            id: 'syllable-builder',
            title: 'Build the venda Words(Syllables)',
            description: 'Learn how to build words! Arrange the blocks in the correct order.',
            icon: <Layout size={64} />,
            route: '/syllable-builder',
            color: 'bg-info',
            gradient: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)'
        },
        {
            id: 'sentence-scramble',
            title: 'Build sentences(Sentences)',
            description: 'Unscramble the words to form correct Venda sentences!',
            icon: <FileText size={64} />,
            route: '/game/scramble',
            color: 'bg-success',
            gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
        },
        {
            id: 'daily-challenge',
            title: 'Daily Challenge',
            description: '20 random questions to test your skills every day!',
            icon: <Calendar size={64} />,
            route: '/daily-challenge',
            color: 'bg-indigo',
            gradient: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)'
        },
        {
            id: 'knowledge-battle',
            title: 'Battle each other',
            description: 'Challenge others who completed the same lessons to a live quiz showdown!',
            icon: <i className="bi bi-lightning-charge-fill text-warning"></i>,
            route: '/battle',
            color: 'bg-danger',
            gradient: 'linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)'
        }
    ];

    if (isLoggedIn === null) {
        return (
            <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
                <div className="spinner-border text-primary" role="status"></div>
            </div>
        );
    }

    if (!isLoggedIn) {
        return (
            <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light px-4">
                <div className="text-center p-5 bg-white rounded-5 shadow-sm" style={{ maxWidth: '500px' }}>
                    <div className="mb-4 text-warning d-flex justify-content-center">
                        <Gamepad2 size={80} strokeWidth={1.5} />
                    </div>
                    <h1 className="fw-bold mb-3 ls-tight">Ready to Play?</h1>
                    <p className="text-muted mb-5">Log in to track your scores, earn XP, and climb the leaderboard while mastering Tshivenda.</p>
                    <div className="d-grid gap-3">
                        <button onClick={() => navigate('/login')} className="btn btn-dark py-3 fw-bold ls-1 rounded-pill">
                            LOG IN TO PLAY
                        </button>
                        <button onClick={() => navigate('/register')} className="btn btn-outline-dark py-3 fw-bold ls-1 rounded-pill">
                            CREATE ACCOUNT
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-vh-100 bg-light py-5">
            <div className="container">
                <div className="text-center mb-5">
                    <h1 className="fw-bold display-4 text-dark mb-3">Mitambo</h1>
                    <p className="lead text-muted">Play games to practice your Tshivenda and earn XP!</p>
                </div>

                <div className="row g-4 justify-content-center">
                    {games.map((game) => (
                        <div key={game.id} className="col-md-6 col-lg-5">
                            <div
                                className="card border-0 h-100 shadow-sm overflow-hidden game-card"
                                onClick={() => navigate(game.route)}
                                style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                            >
                                <div className="card-body p-0 d-flex flex-column">
                                    <div
                                        className="p-4 d-flex align-items-center justify-content-center text-white"
                                        style={{ background: game.gradient, height: '150px' }}
                                    >
                                        <span style={{ fontSize: '4rem' }}>{game.icon}</span>
                                    </div>
                                    <div className="p-4 flex-grow-1 bg-white">
                                        <h3 className="fw-bold mb-2">{game.title}</h3>
                                        <p className="text-muted mb-4">{game.description}</p>
                                        <button className="btn btn-dark w-100 rounded-pill fw-bold">
                                            Play Now <i className="bi bi-arrow-right ms-2"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <style>{`
                .game-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 10px 20px rgba(0,0,0,0.1) !important;
                }
            `}</style>
        </div>
    );
};

export default GamesDashboard;



