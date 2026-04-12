import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getDocs, collection } from 'firebase/firestore';
import { db } from '../../services/firebaseConfig';
import AdminNavbar from '../../components/AdminNavbar';
import { Layout, Hash, Image as ImageIcon, Bomb, Loader2, Gamepad2, ChevronRight } from 'lucide-react';

interface GameStat {
    title: string;
    subtitle: string;
    icon: React.ReactNode;
    count: number;
    color: string;
    bgColor: string;
    link: string;
    collection: string;
}

const AdminGameContent: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<GameStat[]>([]);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        setLoading(true);
        try {
            const [syllableSnap, sentenceSnap, pictureSnap, wordBombSnap] = await Promise.all([
                getDocs(collection(db, "syllablePuzzles")),
                getDocs(collection(db, "sentencePuzzles")),
                getDocs(collection(db, "picturePuzzles")),
                getDocs(collection(db, "wordBombWords"))
            ]);

            setStats([
                {
                    title: 'Syllable Builder',
                    subtitle: 'Build words from syllable blocks',
                    icon: <Layout size={28} strokeWidth={2.5} />,
                    count: syllableSnap.size,
                    color: '#3B82F6',
                    bgColor: '#EFF6FF',
                    link: '/admin/syllable-builder',
                    collection: 'syllablePuzzles'
                },
                {
                    title: 'Sentence Scramble',
                    subtitle: 'Arrange scrambled words into sentences',
                    icon: <Hash size={28} strokeWidth={2.5} />,
                    count: sentenceSnap.size,
                    color: '#10B981',
                    bgColor: '#ECFDF5',
                    link: '/admin/sentence-scramble',
                    collection: 'sentencePuzzles'
                },
                {
                    title: 'Picture Puzzle',
                    subtitle: 'Match pictures to translations',
                    icon: <ImageIcon size={28} strokeWidth={2.5} />,
                    count: pictureSnap.size,
                    color: '#F59E0B',
                    bgColor: '#FEF3C7',
                    link: '/admin/picture-puzzles',
                    collection: 'picturePuzzles'
                },
                {
                    title: 'Word Bomb',
                    subtitle: 'Falling word translation challenge',
                    icon: <Bomb size={28} strokeWidth={2.5} />,
                    count: wordBombSnap.size,
                    color: '#EF4444',
                    bgColor: '#FEF2F2',
                    link: '/admin/word-bomb',
                    collection: 'wordBombWords'
                }
            ]);
        } catch (error) {
            console.error("Error loading game stats:", error);
        } finally {
            setLoading(false);
        }
    };

    const totalEntries = stats.reduce((sum, s) => sum + s.count, 0);

    return (
        <div className="min-vh-100 pb-5 bg-theme-base">
            <AdminNavbar />

            {/* HEADER */}
            <div className="py-5 bg-theme-surface border-bottom shadow-sm">
                <div className="container" style={{ maxWidth: '1100px' }}>
                    <div className="px-3">
                        <span className="shumela-venda-pulse fw-bold ls-1 text-uppercase smallest d-block mb-2 text-warning-custom">
                            Content Management
                        </span>
                        <h1 className="fw-bold ls-tight mb-1 text-theme-main" style={{ fontSize: '2.5rem' }}>
                            Game <span className="text-warning-custom">Content</span> 🎮
                        </h1>
                        <p className="text-theme-muted mb-0 fw-bold" style={{ fontSize: 14 }}>
                            Manage all game data from one place. Add entries individually or batch import via JSON.
                        </p>
                    </div>
                </div>
            </div>

            <div className="container py-5" style={{ maxWidth: '1100px' }}>

                {loading ? (
                    <div className="text-center py-5">
                        <Loader2 className="animate-spin text-warning mx-auto mb-3" size={48} />
                        <p className="ls-1 smallest fw-bold text-theme-muted">LOADING GAME STATS...</p>
                    </div>
                ) : (
                    <>
                        {/* OVERVIEW CARD */}
                        <div className="card-premium p-4 p-md-5 mb-5 game-overview-gradient text-white">
                            <div className="d-flex flex-column flex-md-row align-items-md-center gap-4">
                                <div className="d-flex align-items-center justify-content-center rounded-3 bg-white-10"
                                    style={{ width: 64, height: 64 }}>
                                    <Gamepad2 size={32} style={{ color: '#FACC15' }} />
                                </div>
                                <div className="flex-grow-1">
                                    <h3 className="fw-bold mb-1">Total Game Content</h3>
                                    <p className="text-white-50 mb-0 smallest fw-bold ls-1 text-uppercase">
                                        Across all games — manage, edit, or batch synchronize content
                                    </p>
                                </div>
                                <div className="text-center text-md-end">
                                    <h1 className="fw-bold mb-0 text-warning-custom" style={{ fontSize: '3.5rem' }}>{totalEntries}</h1>
                                    <span className="smallest fw-bold ls-1 text-uppercase text-white-50">Total Active Entries</span>
                                </div>
                            </div>
                        </div>

                        {/* GAME CARDS */}
                        <div className="row g-4 px-2">
                            {stats.map((game) => (
                                <div key={game.title} className="col-md-6">
                                    <Link to={game.link} className="text-decoration-none">
                                        <div className="card-premium p-4 h-100 gc-card">
                                            <div className="d-flex align-items-start gap-3">
                                                <div className="icon-box-premium flex-shrink-0"
                                                    style={{ width: 60, height: 60, backgroundColor: 'var(--color-bg)' }}>
                                                    <span style={{ color: game.color }}>{game.icon}</span>
                                                </div>
                                                <div className="flex-grow-1">
                                                    <h4 className="fw-bold mb-1 text-theme-main">{game.title}</h4>
                                                    <p className="text-theme-muted small mb-3">{game.subtitle}</p>
                                                    <div className="d-flex align-items-center gap-3">
                                                        <div className="d-flex align-items-center gap-2">
                                                            <span className="fw-bold text-theme-main" style={{ fontSize: '1.75rem' }}>{game.count}</span>
                                                            <span className="smallest fw-bold ls-1 text-uppercase text-theme-muted">puzzles</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="icon-box-premium sm flex-shrink-0">
                                                    <ChevronRight size={20} className="text-theme-muted" />
                                                </div>
                                            </div>
                                            <div className="mt-4 pt-3 border-top border-theme-soft d-flex flex-wrap gap-2">
                                                <span className="badge-pill-premium">
                                                    EDIT RECORDS
                                                </span>
                                                <div className="badge-pill-premium" style={{ borderColor: game.color, color: game.color }}>
                                                    BATCH SYNC
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            <style>{`
                .text-warning-custom { color: var(--venda-yellow-dark) !important; }
                .card-premium {
                    background-color: var(--color-surface);
                    border: 1px solid var(--color-border);
                    border-radius: 20px;
                    box-shadow: var(--shadow-premium);
                    transition: all 0.3s ease;
                }
                .gc-card:hover {
                    transform: translateY(-8px);
                    border-color: var(--venda-yellow-dark);
                }
                .game-overview-gradient {
                    background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
                    border: none;
                }
                [data-theme='dark'] .game-overview-gradient {
                    background: linear-gradient(135deg, #0f172a 0%, #000000 100%);
                }
                .bg-white-10 { background-color: rgba(255, 255, 255, 0.1); }
                .icon-box-premium {
                    width: 48px;
                    height: 48px;
                    background-color: var(--color-surface-soft);
                    border-radius: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .icon-box-premium.sm { width: 36px; height: 36px; border-radius: 10px; }
                .badge-pill-premium {
                    background-color: var(--color-surface-soft);
                    color: var(--color-text-muted);
                    padding: 6px 14px;
                    border-radius: 50px;
                    border: 1px solid var(--color-border);
                    font-size: 10px;
                    font-weight: 800;
                    letter-spacing: 1px;
                }
                .shumela-venda-pulse { animation: pulseAdmin 3s infinite ease-in-out; }
                @keyframes pulseAdmin { 0% { opacity: 0.7; } 50% { opacity: 1; color: var(--venda-yellow-dark); } 100% { opacity: 0.7; } }
            `}</style>
        </div>
    );
};

export default AdminGameContent;
