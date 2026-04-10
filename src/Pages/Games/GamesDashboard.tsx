import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { warmupGameCache } from '../../services/dataCache';
import { auth } from '../../services/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { Puzzle, Image, Layout, FileText, Gamepad2, Calendar, Bomb } from 'lucide-react';
import { popupService } from '../../services/popupService';


const GamesDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

    const handleLoginNagger = () => {
        popupService.confirm(
            'Luvha (Log In Required)',
            'Log in to track your scores, earn XP, and climb the leaderboard while practicing South African languages.',
            'LOG IN',
            'NOT NOW'
        ).then((res) => {
            if (res.isConfirmed) navigate('/login');
        });
    };

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
            title: 'Guess The correct language word',
            description: 'Guess the 5-letter target word. A daily challenge to test your vocabulary.',
            icon: <Puzzle size={64} />,
            route: '/word-puzzle',
            color: 'bg-primary',
            gradient: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)'
        },
        {
            id: 'picture-puzzle',
            title: 'Match the pictures with the south african words',
            description: 'Race against the clock and match pictures to the correct words.',
            icon: <Image size={64} />,
            route: '/picture-puzzle',
            color: 'bg-warning',
            gradient: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)'
        },
        {
            id: 'syllable-builder',
            title: 'Build the  Words(Syllables)',
            description: 'Learn how to build words! Arrange the blocks in the correct order.',
            icon: <Layout size={64} />,
            route: '/syllable-builder',
            color: 'bg-info',
            gradient: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)'
        },
        {
            id: 'sentence-scramble',
            title: 'Build sentences(Sentences)',
            description: 'Unscramble the words to form correct sentences.',
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
            id: 'word-bomb',
            title: 'Word Bomb 💣',
            description: 'English words fall from the sky — type the matching translation before they hit the ground.',
            icon: <Bomb size={64} />,
            route: '/word-bomb',
            color: 'bg-dark',
            gradient: 'linear-gradient(135deg, #1a1a2e 0%, #e94560 100%)'
        }
    ];

    // Shuffle games on each visit so users discover all games
    const shuffledGames = useMemo(() => {
        const arr = [...games];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }, []);

    if (isLoggedIn === null) {
        return (
            <div className="min-vh-100 d-flex align-items-center justify-content-center bg-white">
                <div className="spinner-border text-primary" role="status"></div>
            </div>
        );
    }

    if (!isLoggedIn) {
        return (
            <div className="min-vh-100 d-flex align-items-center justify-content-center bg-white px-4 py-5">
                <div className="brutalist-card bg-white p-4 p-md-5 text-center shadow-action" style={{ maxWidth: '500px' }}>
                    <div className="mb-4 text-warning d-flex justify-content-center">
                        <div className="p-4 bg-warning bg-opacity-10 border border-dark border-3 rounded-circle shadow-action-sm">
                            <Gamepad2 size={60} strokeWidth={2.5} className="text-dark" />
                        </div>
                    </div>
                    <h1 className="fw-black mb-3 ls-tight text-dark" style={{ fontSize: '2.5rem' }}>READY TO PLAY?</h1>
                    <p className="fw-bold text-muted mb-5 px-md-4">Log in to track your scores, earn XP, and climb the leaderboard while practicing South African languages.</p>
                    <div className="d-grid gap-3">
                        <button onClick={() => navigate('/login')} className="btn btn-game btn-game-primary py-3 smallest fw-black">
                            LOG IN TO PLAY
                        </button>
                        <button onClick={() => navigate('/register')} className="btn btn-game btn-game-white py-3 smallest fw-black">
                            CREATE ACCOUNT
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-vh-100 bg-white py-5">
            <div className="container">
                <div className="text-center mb-5 mt-4">
                    <h1 className="fw-black display-3 text-dark mb-0 ls-tight">GAMES</h1>
                    <p className="fw-bold text-muted uppercase tracking-widest smallest">Practice and earn XP!</p>
                </div>

                <div className="row g-4 justify-content-center">
                    {shuffledGames.map((game) => (
                        <div key={game.id} className="col-md-6">
                            <div
                                className="brutalist-card h-100 shadow-action-sm transition-all hover-lift overflow-hidden"
                                onClick={() => {
                                    if (isLoggedIn) navigate(game.route);
                                    else handleLoginNagger();
                                }}
                                style={{ cursor: 'pointer' }}
                            >
                                <div className="d-flex flex-column h-100">
                                    <div
                                        className="p-4 d-flex align-items-center justify-content-center text-white border-bottom border-dark border-4"
                                        style={{ background: game.gradient, height: '150px' }}
                                    >
                                        <span style={{ fontSize: '4rem' }}>
                                            {game.icon}
                                        </span>
                                    </div>
                                    <div className="p-4 flex-grow-1 bg-white">
                                        <h3 className="fw-black mb-2 text-dark uppercase ls-1" style={{ fontSize: '1.2rem' }}>{game.title}</h3>
                                        <p className="small fw-bold text-muted mb-4">{game.description}</p>
                                        <button className="btn btn-game btn-game-primary w-100 py-3 smallest fw-black">
                                            PLAY NOW <i className="bi bi-arrow-right ms-2 mt-1"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <style>{`
                .hover-lift:hover {
                    transform: translate(-4px, -4px);
                    box-shadow: 10px 10px 0px #000 !important;
                }
                
                .tracking-widest { letter-spacing: 0.2em; }
            `}</style>
        </div>
    );
};

export default GamesDashboard;



