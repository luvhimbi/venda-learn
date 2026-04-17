import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Image, Layout, FileText, Gamepad2, ArrowRight, Trophy, X } from 'lucide-react';
import { popupService } from '../../services/popupService';
import { fetchUserData, fetchLanguages, warmupGameCache } from '../../services/dataCache';
import { onAuthStateChanged } from "firebase/auth";
import { auth } from '../../services/firebaseConfig';


const GamesDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
    const [preferredLanguage, setPreferredLanguage] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [gameLevels, setGameLevels] = useState<Record<string, number>>({});

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
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setIsLoggedIn(!!user);
            if (user) {
                const [uData, langs] = await Promise.all([
                    fetchUserData(),
                    fetchLanguages()
                ]);

                if (uData) {
                    setGameLevels(uData.gameLevels || {});
                    if (langs) {
                        const lang = langs.find((l: any) => l.id === uData.preferredLanguageId);
                        setPreferredLanguage(lang || { name: 'Language', id: 'default' });
                    }
                }
            }
            setLoading(false);
        });
        warmupGameCache();
        return () => unsubscribe();
    }, []);

    const games = useMemo(() => {
        const langName = preferredLanguage?.name || 'Local';

        return [
            {
                id: 'syllable-builder',
                title: `${langName} Syllables`,
                level: gameLevels.syllable || 1,
                description: `Learn how to build ${langName} words! Arrange the blocks in the correct order.`,
                icon: <Layout size={40} />,
                route: '/syllable-builder',
                color: 'var(--venda-blue)',
                gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
            },
            {
                id: 'picture-puzzle',
                title: `Picture Match (${langName})`,
                level: gameLevels.picture || 1,
                description: `Race against the clock and match pictures to the correct ${langName} words.`,
                icon: <Image size={40} />,
                route: '/picture-puzzle',
                color: 'var(--game-amber)',
                gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
            },
            {
                id: 'sentence-scramble',
                title: 'Sentence Scramble',
                level: gameLevels.sentence || 1,
                description: `Unscramble the words to form correct ${langName} sentences accurately.`,
                icon: <FileText size={40} />,
                route: '/game/scramble',
                color: 'var(--venda-green)',
                gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
            },
            {
                id: 'morabaraba',
                title: 'Morabaraba Strategy',
                description: 'The ancient South African "Board of 12 Cows". Outsmart the CPU or a friend in this classic game.',
                icon: <Trophy size={40} />,
                route: '/morabaraba',
                color: 'var(--venda-purple)',
                gradient: 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)'
            }
        ];
    }, [preferredLanguage, gameLevels]);

    const shuffledGames = useMemo(() => {
        const arr = [...games];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }, [games]);

    if (isLoggedIn === null || loading) {
        return (
            <div className="min-vh-100 d-flex align-items-center justify-content-center bg-theme-base">
                <div className="spinner-border text-theme-main" style={{ borderWidth: '4px' }} role="status"></div>
            </div>
        );
    }

    if (!isLoggedIn) {
        return (
            <div className="min-vh-100 d-flex align-items-center justify-content-center bg-theme-base px-4 py-5">
                <div className="brutalist-card bg-theme-card p-4 p-md-5 text-center shadow-action" style={{ maxWidth: '500px' }}>
                    <div className="mb-4 text-warning d-flex justify-content-center">
                        <div className="p-4 bg-warning bg-opacity-10 border border-theme-main border-3 rounded-circle shadow-action-sm">
                            <Gamepad2 size={60} strokeWidth={2.5} className="text-theme-main" />
                        </div>
                    </div>
                    <h1 className="fw-black mb-3 ls-tight text-theme-main" style={{ fontSize: '2.5rem' }}>READY TO PLAY?</h1>
                    <p className="fw-bold text-theme-muted mb-5 px-md-4">Log in to track your scores, earn XP, and climb the leaderboard while practicing South African languages.</p>
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
        <div className="min-vh-100 pt-4 pb-5 bg-theme-base" style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'currentColor\' fill-opacity=\'0.02\' fill-rule=\'evenodd\'%3E%3Ccircle cx=\'3\' cy=\'3\' r=\'1\'/%3E%3C/g%3E%3C/svg%3E")'
        }}>
            <div className="container">
                <div className="mb-4 d-flex align-items-center">
                    <button
                        className="btn btn-white border-3 border-theme-main rounded-circle p-0 d-flex align-items-center justify-content-center text-theme-main shadow-action-sm"
                        onClick={() => navigate('/')}
                        style={{ width: '44px', height: '44px', backgroundColor: 'var(--color-bg)' }}
                        title="Back to Dashboard"
                    >
                        <X size={24} strokeWidth={3} />
                    </button>
                </div>

                <div className="text-center mb-4 mt-0 animate__animated animate__fadeInDown">
                    <span className="badge bg-warning text-dark border border-theme-main border-2 rounded-pill px-3 py-1 smallest fw-black ls-1 uppercase mb-2 shadow-action-sm">
                        {preferredLanguage?.name || 'Local'} Quests
                    </span>
                    <h1 className="fw-black display-3 text-theme-main mb-0 ls-tight">THE GAMES</h1>
                    <p className="fw-bold text-theme-muted uppercase tracking-widest smallest">Level up your {preferredLanguage?.name || ''} skills</p>
                </div>

                <div className="row g-3 justify-content-center">
                    {shuffledGames.map((game, idx) => (
                        <div key={game.id} className="col-md-6 animate__animated animate__fadeInUp" style={{ animationDelay: `${idx * 0.1}s` }}>
                            <div
                                className="brutalist-card shadow-action-sm transition-all hover-lift overflow-hidden"
                                onClick={() => {
                                    if (isLoggedIn) navigate(game.route);
                                    else handleLoginNagger();
                                }}
                                style={{ cursor: 'pointer' }}
                            >
                                <div className="d-flex flex-column">
                                    <div
                                        className="py-4 d-flex align-items-center justify-content-center text-white border-bottom border-theme-main border-4"
                                        style={{ background: game.gradient }}
                                    >
                                        <div className="p-3 rounded-circle border border-white border-2 d-flex align-items-center justify-content-center"
                                            style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}>
                                            {React.cloneElement(game.icon as React.ReactElement, { color: '#ffffff', strokeWidth: 2.5, size: 40 } as any)}
                                        </div>
                                    </div>
                                    <div className="p-3 flex-grow-1 bg-theme-card d-flex flex-column">
                                        <div className="d-flex justify-content-between align-items-start mb-1">
                                            <h3 className="fw-black mb-0 text-theme-main uppercase ls-1" style={{ fontSize: '1.1rem' }}>{game.title}</h3>
                                            {(game as any).level && (
                                                <span className="badge bg-dark text-white smallest fw-black px-2 py-1 rounded" style={{ letterSpacing: '0.5px', fontSize: '10px' }}>
                                                    LVL {(game as any).level}
                                                </span>
                                            )}
                                        </div>
                                        <p className="small fw-bold text-theme-muted mb-3 flex-grow-1" style={{ fontSize: '0.8rem', lineHeight: '1.3' }}>{game.description}</p>
                                        <button className="btn btn-game btn-game-primary w-100 py-3 smallest fw-black">
                                            PLAY NOW <ArrowRight size={18} className="ms-2" strokeWidth={3} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <style>{`
                .hover-lift {
                    transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }
                .hover-lift:hover {
                    transform: translate(-4px, -4px);
                    box-shadow: 12px 12px 0px var(--color-border) !important;
                }
                
                .tracking-widest { letter-spacing: 0.3em; }
            `}</style>
        </div>
    );
};

export default GamesDashboard;










