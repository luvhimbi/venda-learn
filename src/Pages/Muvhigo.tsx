import React, { useEffect, useState } from 'react';
import { auth } from '../services/firebaseConfig';
import { getLevelStats, getBadgeDetails } from "../services/levelUtils.ts";
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { fetchTopLearners } from '../services/dataCache';

interface Player {
    id: string;
    username: string;
    points: number;
}

const Leaderboard: React.FC = () => {
    const navigate = useNavigate();
    const [players, setPlayers] = useState<Player[]>([]);
    const [currentUserRank, setCurrentUserRank] = useState<{ rank: number, player: Player } | null>(null);
    const [loading, setLoading] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [communityStats, setCommunityStats] = useState({ totalLP: 0, avgLevel: 0 });

    useEffect(() => {
        // Track Auth State for the sidebar display
        const unsubAuth = onAuthStateChanged(auth, (user) => {
            setIsLoggedIn(!!user);
        });

        const fetchLeaderboard = async () => {
            try {
                const playersData = await fetchTopLearners(20);

                let totalLP = 0;
                let totalLevel = 0;

                playersData.forEach((player, index) => {
                    if (index < 10) {
                        totalLP += player.points;
                        totalLevel += getLevelStats(player.points).level;
                    }

                    if (player.id === auth.currentUser?.uid) {
                        setCurrentUserRank({ rank: index + 1, player });
                    }
                });

                setPlayers(playersData);
                setCommunityStats({
                    totalLP,
                    avgLevel: playersData.length > 0
                        ? Math.round(totalLevel / Math.min(playersData.length, 10))
                        : 0
                });
            } catch (error) {
                console.error("Error fetching leaderboard:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchLeaderboard();
        return () => unsubAuth();
    }, []);

    if (loading) return (
        <div className="d-flex justify-content-center align-items-center vh-100 bg-white">
            <div className="spinner-border" style={{ color: '#FACC15' }}></div>
        </div>
    );

    const topThree = players.slice(0, 3);
    const topTen = players.slice(0, 10);

    return (
        <div className="bg-white min-vh-100 py-5" style={{ overflowX: 'hidden' }}>
            <div className="container" style={{ maxWidth: '1100px' }}>

                {/* BACK NAVIGATION */}
                <button
                    className="btn btn-link text-decoration-none p-0 mb-5 d-flex align-items-center gap-2 text-dark fw-bold smallest ls-2 text-uppercase"
                    onClick={() => navigate('/')}
                >
                    <i className="bi bi-arrow-left"></i> Murahu
                </button>

                {/* HEADER SECTION */}
                <header className="mb-5 border-bottom pb-4 text-center">
                    <div>
                        <p className="smallest fw-bold text-muted mb-1 ls-2 text-uppercase">Muvhigo wa Vhahali</p>
                        <h2 className="fw-bold mb-2 ls-tight">LEADERBOARD</h2>
                    </div>
                    <div className="d-none d-md-block">
                        <span className="smallest fw-bold text-muted ls-1 uppercase me-2">Top 10 Average:</span>
                        <span className="fw-bold text-dark">Level {communityStats.avgLevel}</span>
                    </div>
                </header>

                <div className="row g-5">
                    {/* LEFT COLUMN: PODIUM & HALL OF FAME */}
                    <main className="col-lg-8">

                        {/* THE PODIUM */}
                        <div className="row align-items-end mb-5 g-0 text-center border-bottom pb-5 mx-auto" style={{ maxWidth: '600px' }}>
                            {topThree[1] && (
                                <div className="col-4 px-2">
                                    <div className="mb-2"><i className="bi bi-award-fill text-secondary fs-1"></i></div>
                                    <div className="fw-bold text-truncate small">{topThree[1].username}</div>
                                    <div className="smallest fw-bold text-muted mb-3">{topThree[1].points} LP</div>
                                    <div className="bg-light rounded-top-3" style={{ height: '80px', opacity: 0.6 }}></div>
                                </div>
                            )}
                            {topThree[0] && (
                                <div className="col-4 px-2">
                                    <div className="mb-2"><i className="bi bi-trophy-fill text-warning" style={{ fontSize: '3rem' }}></i></div>
                                    <div className="fw-bold text-truncate">{topThree[0].username}</div>
                                    <div className="small fw-bold mb-3" style={{ color: '#FACC15' }}>{topThree[0].points} LP</div>
                                    <div className="rounded-top-3" style={{ height: '140px', backgroundColor: '#FACC15' }}></div>
                                </div>
                            )}
                            {topThree[2] && (
                                <div className="col-4 px-2">
                                    <div className="mb-2"><i className="bi bi-award-fill fs-2" style={{ color: '#CD7F32' }}></i></div>
                                    <div className="fw-bold text-truncate small">{topThree[2].username}</div>
                                    <div className="smallest fw-bold text-muted mb-3">{topThree[2].points} LP</div>
                                    <div className="bg-light rounded-top-3" style={{ height: '50px', opacity: 0.4 }}></div>
                                </div>
                            )}
                        </div>

                        {/* FULL LIST */}
                        <section className="text-center">
                            <h6 className="fw-bold text-uppercase text-muted small ls-2 mb-4">Hall of Fame</h6>
                            <div className="list-group list-group-flush mb-5 mx-auto" style={{ maxWidth: '600px' }}>
                                {topTen.map((player, index) => {
                                    const stats = getLevelStats(player.points);
                                    const badge = getBadgeDetails(stats.level);
                                    const isMe = isLoggedIn && player.id === auth.currentUser?.uid;

                                    return (
                                        <div key={player.id} className={`list-group-item bg-transparent border-0 px-0 py-4 d-flex align-items-center ${isMe ? 'border-start border-4 ps-3' : ''}`} style={isMe ? { borderColor: '#FACC15' } : {}}>
                                            <span className="me-3 fw-bold text-muted smallest" style={{ width: '25px', textAlign: 'left' }}>#{index + 1}</span>

                                            <div className="flex-grow-1 text-start">
                                                <div className="d-flex align-items-center gap-2">
                                                    <span className={`fw-bold ${isMe ? 'text-dark' : 'text-secondary'}`}>{player.username}</span>
                                                    {isMe && <span className="smallest fw-bold ls-1 text-uppercase" style={{ color: '#FACC15' }}> (YOU)</span>}
                                                </div>
                                                <div className="smallest fw-bold text-muted ls-1">{badge.icon} {badge.name} • LEVEL {stats.level}</div>
                                            </div>

                                            <div className="text-end">
                                                <div className="fw-bold" style={{ color: isMe ? '#FACC15' : '#111827' }}>{player.points.toLocaleString()} LP</div>
                                                <div className="smallest text-muted text-uppercase ls-1 fw-bold">Earned</div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    </main>

                    {/* RIGHT COLUMN: LOGOUT STATE / GUIDE */}
                    <aside className="col-lg-4 ps-lg-5">

                        {/* 1. DYNAMIC AUTH STATE CARD */}
                        {!isLoggedIn ? (
                            <section className="p-4 bg-dark text-white rounded-4 shadow-lg mb-5 animate__animated animate__fadeIn">
                                <p className="smallest fw-bold ls-2 text-uppercase mb-2" style={{ color: '#FACC15' }}>Join the Tribe</p>
                                <h4 className="fw-bold mb-3">Vha khou bvelela hani?</h4>
                                <p className="small opacity-75 mb-4">Log in to track your personal ranking, earn badges, and climb the Venda Learn Hall of Fame.</p>
                                <button onClick={() => navigate('/login')} className="btn game-btn-primary w-100 py-3 fw-bold smallest ls-1">
                                    SIGN IN TO RANK
                                </button>
                            </section>
                        ) : (
                            currentUserRank && currentUserRank.rank > 10 && (
                                <section className="p-4 bg-dark text-white rounded-4 shadow-lg mb-5 animate__animated animate__fadeInUp">
                                    <p className="smallest fw-bold text-muted mb-1 ls-2 text-uppercase">Your Status</p>
                                    <div className="d-flex justify-content-between align-items-center">
                                        <h3 className="fw-bold mb-0">Rank #{currentUserRank.rank}</h3>
                                        <div className="text-end">
                                            <div className="fw-bold" style={{ color: '#FACC15' }}>{currentUserRank.player.points} LP</div>
                                            <div className="smallest fw-bold opacity-50">TOTAL</div>
                                        </div>
                                    </div>
                                    <button onClick={() => navigate('/courses')} className="btn game-btn-primary w-100 mt-4 py-2 smallest fw-bold ls-1">
                                        CLIMB HIGHER
                                    </button>
                                </section>
                            )
                        )}

                        {/* 2. HOW TO WIN GUIDE */}
                        <section>
                            <h6 className="fw-bold text-uppercase text-muted small ls-2 mb-4">How to Win</h6>
                            <div className="mb-4">
                                <div className="mb-4">
                                    <p className="smallest fw-bold text-dark mb-1 ls-1">📚 LESSONS</p>
                                    <p className="small text-muted">Earn base points for every successfully completed module.</p>
                                </div>
                                <div className="mb-4">
                                    <p className="smallest fw-bold text-dark mb-1 ls-1">🔥 STREAKS</p>
                                    <p className="small text-muted">Maintain a daily learning streak to multiply your rewards.</p>
                                </div>
                                <div className="mb-4">
                                    <p className="smallest fw-bold text-dark mb-1 ls-1">🎯 ACCURACY</p>
                                    <p className="small text-muted">Perfect scores in quizzes grant the "Muhali" bonus.</p>
                                </div>
                            </div>
                        </section>
                    </aside>
                </div>
            </div>

            <style>{`
                .ls-tight { letter-spacing: -1.5px; }
                .ls-1 { letter-spacing: 1px; }
                .ls-2 { letter-spacing: 2px; }
                .smallest { font-size: 11px; }
                .game-btn-primary { 
                    background-color: #FACC15 !important; 
                    color: #111827 !important; 
                    border: none !important; 
                    border-radius: 12px; 
                    box-shadow: 0 4px 0 #EAB308 !important; 
                    transition: all 0.2s; 
                }
                .game-btn-primary:active { transform: translateY(2px); box-shadow: 0 2px 0 #EAB308 !important; }
            `}</style>
        </div>
    );
};

export default Leaderboard;