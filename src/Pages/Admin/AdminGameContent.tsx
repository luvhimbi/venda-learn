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
        <div className="min-vh-100 pb-5 bg-light">
            <AdminNavbar />

            {/* HEADER */}
            <div className="py-5 bg-white border-bottom shadow-sm">
                <div className="container" style={{ maxWidth: '1100px' }}>
                    <div className="px-3">
                        <span className="fw-bold ls-2 text-uppercase smallest d-block mb-2 text-warning"
                            style={{ animation: 'pulseAdmin 3s infinite ease-in-out' }}>
                            Content Management
                        </span>
                        <h1 className="fw-bold ls-tight mb-1 text-dark" style={{ fontSize: '2.5rem' }}>
                            Game <span style={{ color: '#FACC15' }}>Content</span> 🎮
                        </h1>
                        <p className="text-muted mb-0 fw-bold" style={{ fontSize: 14 }}>
                            Manage all game data from one place. Add entries individually or batch import via JSON.
                        </p>
                    </div>
                </div>
            </div>

            <div className="container py-5" style={{ maxWidth: '1100px' }}>

                {loading ? (
                    <div className="text-center py-5">
                        <Loader2 className="animate-spin text-warning mx-auto mb-3" size={48} />
                        <p className="ls-1 smallest fw-bold text-muted">LOADING GAME STATS...</p>
                    </div>
                ) : (
                    <>
                        {/* OVERVIEW CARD */}
                        <div className="bg-dark text-white rounded-4 border shadow-sm p-4 p-md-5 mb-5">
                            <div className="d-flex flex-column flex-md-row align-items-md-center gap-4">
                                <div className="d-flex align-items-center justify-content-center rounded-3"
                                    style={{ width: 64, height: 64, backgroundColor: 'rgba(250, 204, 21, 0.15)' }}>
                                    <Gamepad2 size={32} style={{ color: '#FACC15' }} />
                                </div>
                                <div className="flex-grow-1">
                                    <h3 className="fw-bold mb-1">Total Game Content</h3>
                                    <p className="text-secondary mb-0 smallest fw-bold ls-1 text-uppercase">
                                        Across all 4 games — add, edit, delete, or batch import content
                                    </p>
                                </div>
                                <div className="text-center text-md-end">
                                    <h1 className="fw-bold mb-0" style={{ color: '#FACC15', fontSize: '3rem' }}>{totalEntries}</h1>
                                    <span className="smallest fw-bold ls-1 text-uppercase text-secondary">Total Entries</span>
                                </div>
                            </div>
                        </div>

                        {/* GAME CARDS */}
                        <div className="row g-4 px-2">
                            {stats.map((game) => (
                                <div key={game.title} className="col-md-6">
                                    <Link to={game.link} className="text-decoration-none">
                                        <div className="bg-white border rounded-4 shadow-sm p-4 h-100 gc-card">
                                            <div className="d-flex align-items-start gap-3">
                                                <div className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
                                                    style={{ width: 56, height: 56, backgroundColor: game.bgColor }}>
                                                    <span style={{ color: game.color }}>{game.icon}</span>
                                                </div>
                                                <div className="flex-grow-1">
                                                    <h4 className="fw-bold mb-1 text-dark">{game.title}</h4>
                                                    <p className="text-muted small mb-3">{game.subtitle}</p>
                                                    <div className="d-flex align-items-center gap-3">
                                                        <div className="d-flex align-items-center gap-2">
                                                            <span className="fw-bold" style={{ fontSize: '1.5rem', color: game.color }}>{game.count}</span>
                                                            <span className="smallest fw-bold ls-1 text-uppercase text-muted">entries</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                                                    style={{ width: 40, height: 40, backgroundColor: '#f3f4f6' }}>
                                                    <ChevronRight size={20} className="text-muted" />
                                                </div>
                                            </div>
                                            <div className="mt-3 pt-3 border-top d-flex gap-2">
                                                <span className="badge bg-light text-dark fw-bold smallest ls-1 px-3 py-2 border">
                                                    Add / Edit / Delete
                                                </span>
                                                <span className="badge fw-bold smallest ls-1 px-3 py-2 border"
                                                    style={{ backgroundColor: game.bgColor, color: game.color }}>
                                                    Batch JSON Import
                                                </span>
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
                .ls-tight { letter-spacing: -1.5px; }
                .ls-1 { letter-spacing: 1px; }
                .ls-2 { letter-spacing: 2px; }
                .smallest { font-size: 11px; }
                @keyframes pulseAdmin { 0% { opacity: 0.7; } 50% { opacity: 1; } 100% { opacity: 0.7; } }
                .gc-card { transition: all 0.25s ease; cursor: pointer; border-bottom: 4px solid transparent !important; }
                .gc-card:hover { transform: translateY(-6px); border-bottom-color: #FACC15 !important; box-shadow: 0 12px 30px rgba(0,0,0,0.08) !important; }
                .animate-spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default AdminGameContent;
