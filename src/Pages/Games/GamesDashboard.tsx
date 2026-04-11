import React, {useState, useEffect, useMemo} from 'react';
import { useNavigate } from 'react-router-dom';
import { Puzzle, Image, Layout, FileText, Gamepad2, Bomb, ArrowRight, Trophy } from 'lucide-react';
import { popupService } from '../../services/popupService';
import { fetchUserData, fetchLanguages, warmupGameCache } from '../../services/dataCache';
import { onAuthStateChanged } from "firebase/auth";
import { auth } from '../../services/firebaseConfig';


const GamesDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
    const [preferredLanguage, setPreferredLanguage] = useState<any>(null);
    const [loading, setLoading] = useState(true);

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
                
                if (uData && langs) {
                    const lang = langs.find((l: any) => l.id === uData.preferredLanguageId);
                    setPreferredLanguage(lang || { name: 'Language', id: 'default' });
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
                id: 'word-puzzle',
                title: `Guess the ${langName} Word`,
                description: `Guess the 5-letter target word. A fun way to test your ${langName} vocabulary.`,
                icon: <Puzzle size={48} />,
                route: '/word-puzzle',
                color: 'var(--venda-yellow)',
                gradient: 'linear-gradient(135deg, #FACC15 0%, #EAB308 100%)'
            },
            {
                id: 'picture-puzzle',
                title: `Picture Match (${langName})`,
                description: `Race against the clock and match pictures to the correct ${langName} words.`,
                icon: <Image size={48} />,
                route: '/picture-puzzle',
                color: 'var(--game-amber)',
                gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
            },
            {
                id: 'syllable-builder',
                title: `${langName} Syllables`,
                description: `Learn how to build ${langName} words! Arrange the blocks in the correct order.`,
                icon: <Layout size={48} />,
                route: '/syllable-builder',
                color: 'var(--venda-blue)',
                gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
            },
            {
                id: 'sentence-scramble',
                title: 'Sentence Scramble',
                description: `Unscramble the words to form correct ${langName} sentences accurately.`,
                icon: <FileText size={48} />,
                route: '/game/scramble',
                color: 'var(--venda-green)',
                gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
            },
            {
                id: 'word-bomb',
                title: `${langName} Word Bomb 💣`,
                description: `English words fall from the sky — type the matching ${langName} translation fast!`,
                icon: <Bomb size={48} />,
                route: '/word-bomb',
                color: 'var(--venda-red)',
                gradient: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)'
            },
            {
                id: 'morabaraba',
                title: 'Morabaraba Strategy',
                description: 'The ancient South African "Board of 12 Cows". Outsmart the CPU or a friend in this classic game.',
                icon: <Trophy size={48} />,
                route: '/morabaraba',
                color: 'var(--venda-dark)',
                gradient: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)'
            }
        ];
    }, [preferredLanguage]);

    // Shuffle games on each visit so users discover all games
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
            <div className="min-vh-100 d-flex align-items-center justify-content-center bg-white">
                <div className="spinner-border text-warning" style={{ borderWidth: '4px' }} role="status"></div>
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
        <div className="min-vh-100 bg-white py-5" style={{ background: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23000000\' fill-opacity=\'0.02\' fill-rule=\'evenodd\'%3E%3Ccircle cx=\'3\' cy=\'3\' r=\'1\'/%3E%3C/g%3E%3C/svg%3E")' }}>
            <div className="container">
                <div className="text-center mb-5 mt-4 animate__animated animate__fadeInDown">
                    <span className="badge bg-warning text-dark border border-dark border-2 rounded-pill px-3 py-1 smallest fw-black ls-1 uppercase mb-2 shadow-action-sm">
                        {preferredLanguage?.name || 'Local'} Quests
                    </span>
                    <h1 className="fw-black display-3 text-dark mb-0 ls-tight">THE GAMES</h1>
                    <p className="fw-bold text-muted uppercase tracking-widest smallest">Level up your {preferredLanguage?.name || ''} skills</p>
                </div>

                <div className="row g-4 justify-content-center">
                    {shuffledGames.map((game, idx) => (
                        <div key={game.id} className="col-md-6 animate__animated animate__fadeInUp" style={{ animationDelay: `${idx * 0.1}s` }}>
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
                                        style={{ background: game.gradient, height: '160px' }}
                                    >
                                        <div className="p-4 rounded-circle border border-white border-2 d-flex align-items-center justify-content-center" 
                                             style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', width: '100px', height: '100px' }}>
                                            {React.cloneElement(game.icon as React.ReactElement, { color: '#ffffff', strokeWidth: 2.5 } as any)}
                                        </div>
                                    </div>
                                    <div className="p-4 flex-grow-1 bg-white d-flex flex-column">
                                        <h3 className="fw-black mb-2 text-dark uppercase ls-1" style={{ fontSize: '1.4rem' }}>{game.title}</h3>
                                        <p className="small fw-bold text-muted mb-4 flex-grow-1">{game.description}</p>
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
                    box-shadow: 12px 12px 0px #000 !important;
                }
                
                .tracking-widest { letter-spacing: 0.3em; }
            `}</style>
        </div>
    );
};

export default GamesDashboard;



