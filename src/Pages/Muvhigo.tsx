import React, { useEffect, useState } from 'react';
import { db, auth } from '../services/firebaseConfig';
import { collection, query, getDocs, orderBy, limit } from 'firebase/firestore';
import { getLevelStats, getBadgeDetails } from "../services/levelUtils.ts";
import { Link } from 'react-router-dom';

interface Player {
    id: string;
    username: string;
    points: number;
}

const Leaderboard: React.FC = () => {
    const [players, setPlayers] = useState<Player[]>([]);
    const [currentUserRank, setCurrentUserRank] = useState<{rank: number, player: Player} | null>(null);
    const [loading, setLoading] = useState(true);
    const [communityStats, setCommunityStats] = useState({ totalLP: 0, avgLevel: 0 });

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const q = query(collection(db, "users"), orderBy("points", "desc"), limit(20));
                const querySnapshot = await getDocs(q);

                let totalLP = 0;
                let totalLevel = 0;

                const playersData = querySnapshot.docs.map((doc, index) => {
                    const data = doc.data();
                    const player = {
                        id: doc.id,
                        username: data.username || "Anonymous",
                        points: Number(data.points) || 0
                    };

                    if (index < 10) {
                        totalLP += player.points;
                        totalLevel += getLevelStats(player.points).level;
                    }

                    if (doc.id === auth.currentUser?.uid) {
                        setCurrentUserRank({ rank: index + 1, player });
                    }

                    return player;
                });

                setPlayers(playersData);
                setCommunityStats({
                    totalLP,
                    avgLevel: Math.round(totalLevel / Math.min(playersData.length, 10))
                });
            } catch (error) {
                console.error("Error fetching leaderboard:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchLeaderboard();
    }, []);

    if (loading) return (
        <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
            <div className="spinner-grow text-primary" role="status"></div>
        </div>
    );

    const topThree = players.slice(0, 3);
    const topTen = players.slice(0, 10);

    return (
        <div className="min-vh-100 bg-light py-5 animate__animated animate__fadeIn">
            <div className="container-fluid px-md-5">

                {/* PAGE TITLE */}
                <div className="mb-5 text-center">
                    <Link to="/" className="text-primary text-decoration-none fw-bold small text-uppercase ls-1">
                        ← Murahu (Back Home)
                    </Link>
                    <h1 className="display-4 fw-bold mt-2">Muvhigo wa Vhahali</h1>
                    <p className="text-muted">Celebrating the top Tshivenda learners in our community.</p>
                </div>

                <div className="row g-4">
                    {/* LEFT COLUMN: MAIN LEADERBOARD */}
                    <div className="col-lg-8">

                        {/* VISUAL PODIUM */}
                        <div className="row align-items-end mb-5 text-center g-2 px-md-5">
                            {topThree[1] && (
                                <div className="col-4">
                                    <div className="card border-0 shadow-sm rounded-4 p-3 mb-2 bg-white scale-hover">
                                        <div className="fs-1">🥈</div>
                                        <div className="fw-bold text-truncate">{topThree[1].username}</div>
                                        <div className="text-primary small fw-bold">{topThree[1].points} LP</div>
                                    </div>
                                    <div className="bg-secondary bg-opacity-25 rounded-top-4" style={{ height: '60px' }}></div>
                                </div>
                            )}
                            {topThree[0] && (
                                <div className="col-4">
                                    <div className="position-relative">
                                        <div className="position-absolute top-0 start-50 translate-middle mt-n4" style={{fontSize: '2rem'}}>👑</div>
                                        <div className="card border-0 shadow rounded-4 p-3 mb-2 bg-white border-top border-warning border-4 scale-hover-lg">
                                            <div className="fs-1">🥇</div>
                                            <div className="fw-bold text-truncate">{topThree[0].username}</div>
                                            <div className="text-primary fw-bold">{topThree[0].points} LP</div>
                                        </div>
                                    </div>
                                    <div className="bg-warning bg-opacity-25 rounded-top-4" style={{ height: '100px' }}></div>
                                </div>
                            )}
                            {topThree[2] && (
                                <div className="col-4">
                                    <div className="card border-0 shadow-sm rounded-4 p-3 mb-2 bg-white scale-hover">
                                        <div className="fs-1">🥉</div>
                                        <div className="fw-bold text-truncate">{topThree[2].username}</div>
                                        <div className="text-primary small fw-bold">{topThree[2].points} LP</div>
                                    </div>
                                    <div className="bg-danger bg-opacity-10 rounded-top-4" style={{ height: '40px' }}></div>
                                </div>
                            )}
                        </div>

                        {/* FULL TOP 10 LIST */}
                        <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4 bg-white">
                            <div className="card-header bg-white py-4 border-0">
                                <h4 className="fw-bold mb-0">Hall of Fame</h4>
                                <p className="text-muted small mb-0">Top 10 learners ranked by total Learning Points (LP)</p>
                            </div>
                            <div className="list-group list-group-flush">
                                {topTen.map((player, index) => {
                                    const stats = getLevelStats(player.points);
                                    const badge = getBadgeDetails(stats.level);
                                    const isMe = player.id === auth.currentUser?.uid;
                                    const rank = index + 1;
                                    const gap = index > 0 ? players[index - 1].points - player.points : 0;

                                    return (
                                        <div key={player.id} className={`list-group-item d-flex align-items-center py-3 px-4 border-bottom ${isMe ? 'bg-primary bg-opacity-10' : ''}`}>
                                            <div className="me-3 d-flex align-items-center justify-content-center fw-bold text-muted" style={{width: '35px'}}>
                                                {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}
                                            </div>
                                            <div className="rounded-circle bg-light border d-flex align-items-center justify-content-center fw-bold me-3 shadow-sm" style={{ width: '48px', height: '48px', color: badge.color }}>
                                                {player.username.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-grow-1">
                                                <div className="fw-bold mb-0">{player.username} {isMe && <span className="badge bg-primary ms-1" style={{fontSize: '0.6rem'}}>YOU</span>}</div>
                                                <div className="small text-muted fw-bold" style={{fontSize: '0.7rem'}}>{badge.icon} {badge.name} • Lvl {stats.level}</div>
                                            </div>
                                            <div className="text-end">
                                                <div className="fw-bold text-dark mb-0">{player.points.toLocaleString()} LP</div>
                                                <div className="text-muted" style={{fontSize: '0.65rem'}}>{index === 0 ? 'LEADER' : `-${gap} LP gap`}</div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: SIDEBAR */}
                    <div className="col-lg-4">

                        {/* HOW TO EARN POINTS GUIDE */}
                        <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white sticky-top" style={{ top: '20px' }}>
                            <h5 className="fw-bold mb-4">
                                <span className="me-2">💡</span> Hu winiwa hani?
                            </h5>

                            <div className="mb-4">
                                <div className="d-flex align-items-start mb-3">
                                    <div className="bg-primary bg-opacity-10 text-primary rounded-3 p-2 me-3">📚</div>
                                    <div>
                                        <h6 className="fw-bold mb-0">Pfunzo (Lessons)</h6>
                                        <p className="small text-muted mb-0">Complete a lesson to earn up to 100 LP.</p>
                                    </div>
                                </div>
                                <div className="d-flex align-items-start mb-3">
                                    <div className="bg-success bg-opacity-10 text-success rounded-3 p-2 me-3">🔥</div>
                                    <div>
                                        <h6 className="fw-bold mb-0">Muvhigo (Streaks)</h6>
                                        <p className="small text-muted mb-0">Daily logins multiply your lesson rewards.</p>
                                    </div>
                                </div>
                                <div className="d-flex align-items-start mb-3">
                                    <div className="bg-warning bg-opacity-10 text-warning rounded-3 p-2 me-3">🎯</div>
                                    <div>
                                        <h6 className="fw-bold mb-0">Milingo (Quizzes)</h6>
                                        <p className="small text-muted mb-0">Get 100% accuracy for a "Perfect" bonus.</p>
                                    </div>
                                </div>
                            </div>

                            <hr className="my-4 opacity-50" />

                            {/* COMMUNITY QUICK STATS */}
                            <h6 className="text-muted text-uppercase small fw-bold mb-3">Top 10 Insights</h6>
                            <div className="bg-light rounded-4 p-3 mb-2">
                                <small className="text-muted d-block">Combined LP</small>
                                <span className="fw-bold h5 text-primary mb-0">{communityStats.totalLP.toLocaleString()}</span>
                            </div>
                            <div className="bg-light rounded-4 p-3">
                                <small className="text-muted d-block">Average Warrior Level</small>
                                <span className="fw-bold h5 text-success mb-0">Lvl {communityStats.avgLevel}</span>
                            </div>

                            {/* USER POSITION (If not in top 10) */}
                            {currentUserRank && currentUserRank.rank > 10 && (
                                <div className="mt-4 p-3 bg-dark text-white rounded-4 shadow-lg animate__animated animate__pulse animate__infinite">
                                    <div className="d-flex justify-content-between align-items-center mb-1">
                                        <small className="opacity-75">Your Ranking</small>
                                        <span className="badge bg-primary">#{currentUserRank.rank}</span>
                                    </div>
                                    <div className="h4 fw-bold mb-0 text-warning">{currentUserRank.player.points} LP</div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .scale-hover:hover { transform: translateY(-5px); transition: 0.3s; }
                .scale-hover-lg:hover { transform: translateY(-10px); transition: 0.3s; }
                .ls-1 { letter-spacing: 1px; }
                .sticky-top { z-index: 10; }
            `}</style>
        </div>
    );
};

export default Leaderboard;