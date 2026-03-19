import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../services/firebaseConfig';
import { fetchTopLearnersByWeek, fetchUserData } from '../../services/dataCache';
import { getCurrentWeekIdentifier, getLevelStats, getBadgeDetails } from "../../services/levelUtils.ts";
import { AvatarDisplay } from '../../components/AvatarPicker';
import { ArrowLeft, Award, Trophy, Loader2, Info } from 'lucide-react';
import Swal from 'sweetalert2';

interface Player {
    id: string;
    username: string;
    points: number;
    avatarId?: string;
}

const Leaderboard: React.FC = () => {
    const navigate = useNavigate();
    const [players, setPlayers] = useState<Player[]>([]);
    const [currentUserRank, setCurrentUserRank] = useState<{ rank: number, player: Player } | null>(null);
    const [loading, setLoading] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [communityStats, setCommunityStats] = useState({ totalXP: 0, avgLevel: 0 });

    useEffect(() => {
        // Track Auth State for the sidebar display
        const unsubAuth = onAuthStateChanged(auth, (user: any) => {
            setIsLoggedIn(!!user);
        });

        const fetchLeaderboard = async () => {
            try {
                const playersData = await fetchTopLearnersByWeek(20);
                const currentUserData = await fetchUserData();
                const currentWeek = getCurrentWeekIdentifier();

                let totalXP = 0;
                let totalLevel = 0;

                if (playersData && Array.isArray(playersData)) {
                    playersData.forEach((player, index) => {
                        if (index < 10) {
                            totalXP += (player.points || 0);
                            totalLevel += getLevelStats(player.points || 0).level;
                        }

                        if (player.id === auth.currentUser?.uid) {
                            setCurrentUserRank({ rank: index + 1, player });
                        }
                    });

                    // Special case: if current user is not in top 20, but is active this week
                    if (currentUserData && 
                        currentUserData.lastActiveWeek === currentWeek && 
                        (currentUserData.weeklyXP || 0) > 0 &&
                        !playersData.find(p => p.id === auth.currentUser?.uid)) {
                        setCurrentUserRank({ 
                            rank: 0,
                            player: { 
                                id: auth.currentUser?.uid || '', 
                                username: currentUserData.username || 'Anonymous', 
                                points: currentUserData.weeklyXP || 0,
                                avatarId: currentUserData.avatarId 
                            } 
                        });
                    }

                    setPlayers(playersData);
                    const count = Math.min(playersData.length, 10);
                    setCommunityStats({
                        totalXP,
                        avgLevel: count > 0 ? Math.round(totalLevel / count) : 0
                    });
                }
            } catch (error) {
                console.error("Error fetching leaderboard:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchLeaderboard();

        const handleShowGuide = () => {
            Swal.fire({
                title: '<span class="fw-bold ls-tight">HOW TO RANK UP</span>',
                html: `
                    <div class="text-start p-2">
                        <div class="mb-4 d-flex align-items-start gap-3">
                            <div class="bg-light p-3 rounded-4 text-primary"><i class="bi bi-book-half fs-4"></i></div>
                            <div>
                                <p class="smallest fw-bold text-dark mb-1 ls-1 text-uppercase">Lessons</p>
                                <p class="small text-muted mb-0">Earn base points for every successfully completed module.</p>
                            </div>
                        </div>
                        <div class="mb-4 d-flex align-items-start gap-3">
                            <div class="bg-light p-3 rounded-4 text-warning"><i class="bi bi-zap-fill fs-4"></i></div>
                            <div>
                                <p class="smallest fw-bold text-dark mb-1 ls-1 text-uppercase">Streaks</p>
                                <p class="small text-muted mb-0">Maintain a daily learning streak to multiply your rewards.</p>
                            </div>
                        </div>
                        <div class="mb-0 d-flex align-items-start gap-3">
                            <div class="bg-light p-3 rounded-4 text-danger"><i class="bi bi-target fs-4"></i></div>
                            <div>
                                <p class="smallest fw-bold text-dark mb-1 ls-1 text-uppercase">Accuracy</p>
                                <p class="small text-muted mb-0">Perfect scores in quizzes grant the "Muhali" bonus points.</p>
                            </div>
                        </div>
                    </div>
                `,
                confirmButtonText: 'GOT IT',
                confirmButtonColor: '#FACC15',
                customClass: {
                    popup: 'rounded-5 border-0 shadow-lg',
                    confirmButton: 'rounded-pill px-5 fw-bold text-dark ls-1'
                }
            });
        };

        // Add to window for the icon click
        (window as any).showScoringGuide = handleShowGuide;

        return () => unsubAuth();
    }, []);

    if (loading) return (
        <div className="d-flex justify-content-center align-items-center vh-100 bg-white">
            <Loader2 className="animate-spin" style={{ color: '#FACC15' }} size={48} />
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
                    <ArrowLeft size={16} /> Murahu
                </button>

                {/* HEADER SECTION */}
                <header className="mb-5 border-bottom pb-4 d-flex flex-column flex-md-row justify-content-between align-items-md-end gap-3">
                    <div>
                        <p className="smallest fw-bold text-muted mb-1 ls-2 text-uppercase">Weekly Standings</p>
                        <h2 className="fw-bold mb-0 ls-tight">THE WEEKLY TRIBE</h2>
                    </div>
                    <div className="d-flex align-items-center gap-4">
                        <div className="d-none d-md-block text-end">
                            <span className="smallest fw-bold text-muted ls-1 uppercase d-block">Top 10 Average:</span>
                            <span className="fw-bold text-dark">Level {communityStats.avgLevel}</span>
                        </div>
                        <button
                            className="btn btn-outline-dark rounded-pill py-2 px-4 fw-bold smallest ls-1 d-flex align-items-center gap-2 transition-all"
                            onClick={() => (window as any).showScoringGuide()}
                        >
                            <Info size={16} /> HOW TO RANK UP
                        </button>
                    </div>
                </header>

                <div className="row justify-content-center">
                    {/* CENTERED COLUMN: PODIUM & HALL OF FAME */}
                    <main className="col-lg-10 col-xl-8">

                        {/* DYNAMIC AUTH STATE CARD */}
                        {!isLoggedIn ? (
                            <section className="p-4 bg-dark text-white rounded-4 shadow-lg mb-5 text-center animate__animated animate__fadeIn">
                                <p className="smallest fw-bold ls-2 text-uppercase mb-2" style={{ color: '#FACC15' }}>Join the Tribe</p>
                                <h4 className="fw-bold mb-3">Ready to climb the ranks?</h4>
                                <p className="small opacity-75 mb-4">Log in to track your personal ranking, earn badges, and climb the Venda Learn Hall of Fame.</p>
                                <button onClick={() => navigate('/login')} className="btn game-btn-primary px-5 py-3 fw-bold smallest ls-1">
                                    SIGN IN TO RANK
                                </button>
                            </section>
                        ) : (
                            !currentUserRank ? (
                                <section className="p-5 bg-white border rounded-5 shadow-sm mb-5 text-center animate__animated animate__fadeIn">
                                    <div className="mb-4 text-warning">
                                        <Award size={64} className="mx-auto heartbeat-sm" />
                                    </div>
                                    <h4 className="fw-bold mb-2">Weekly Leaderboard is Locked!</h4>
                                    <p className="text-muted mb-4 opacity-75">You must complete a lesson this week in order to be shown on the leaderboard or to see the rankings.</p>
                                    <button onClick={() => navigate('/courses')} className="btn btn-dark rounded-pill px-5 py-3 fw-bold smallest ls-2">
                                        START YOUR FIRST LESSON
                                    </button>
                                </section>
                            ) : (
                                <>
                                    {/* THE PODIUM */}
                                    <div className="row align-items-end mb-5 g-0 text-center border-bottom pb-5 mx-auto" style={{ maxWidth: '600px' }}>
                                        {topThree[1] && (
                                            <div className="col-4 px-2">
                                                <div className="mb-3 d-flex justify-content-center">
                                                    <AvatarDisplay
                                                        avatarId={topThree[1].avatarId || 'adventurer'}
                                                        seed={topThree[1].username}
                                                        size={60}
                                                        className="shadow-sm border-secondary"
                                                        style={{ borderWidth: '2px' }}
                                                    />
                                                </div>
                                                <div className="mb-2"><Award className="text-secondary mx-auto" size={32} /></div>
                                                <div className="fw-bold text-truncate small">{topThree[1].username || 'Learner'}</div>
                                                <div className="smallest fw-bold text-muted mb-3">{topThree[1].points} XP</div>
                                                <div className="rounded-top-3 shadow-sm" style={{ height: '80px', backgroundColor: '#9CA3AF' }}></div>
                                            </div>
                                        )}
                                        {topThree[0] && (
                                            <div className="col-4 px-2">
                                                <div className="mb-3 d-flex justify-content-center">
                                                    <AvatarDisplay
                                                        avatarId={topThree[0].avatarId || 'adventurer'}
                                                        seed={topThree[0].username}
                                                        size={80}
                                                        className="shadow border-warning"
                                                        style={{ borderWidth: '3px' }}
                                                    />
                                                </div>
                                                <div className="mb-2"><Trophy className="text-warning mx-auto" size={48} /></div>
                                                <div className="fw-bold text-truncate">{topThree[0].username || 'Learner'}</div>
                                                <div className="small fw-bold mb-3" style={{ color: '#FACC15' }}>{topThree[0].points} XP</div>
                                                <div className="rounded-top-3" style={{ height: '140px', backgroundColor: '#FACC15' }}></div>
                                            </div>
                                        )}
                                        {topThree[2] && (
                                            <div className="col-4 px-2">
                                                <div className="mb-3 d-flex justify-content-center">
                                                    <AvatarDisplay
                                                        avatarId={topThree[2].avatarId || 'adventurer'}
                                                        seed={topThree[2].username}
                                                        size={50}
                                                        className="shadow-sm border-bronze"
                                                        style={{ borderWidth: '2px', borderColor: '#CD7F32' }}
                                                    />
                                                </div>
                                                <div className="mb-2"><Award size={24} style={{ color: '#CD7F32' }} className="mx-auto" /></div>
                                                <div className="fw-bold text-truncate small">{topThree[2].username || 'Learner'}</div>
                                                <div className="smallest fw-bold text-muted mb-3">{topThree[2].points} XP</div>
                                                <div className="rounded-top-3 shadow-sm" style={{ height: '50px', backgroundColor: '#CD7F32' }}></div>
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

                                                        <div className="me-3">
                                                            {player.id === 'community_avg' ? null : (
                                                                <AvatarDisplay
                                                                    avatarId={player.avatarId || 'adventurer'}
                                                                    seed={player.username}
                                                                    size={40}
                                                                />
                                                            )}
                                                        </div>

                                                        <div className="flex-grow-1 text-start">
                                                            <div className="d-flex align-items-center gap-2">
                                                                <span className={`fw-bold ${isMe ? 'text-dark' : 'text-secondary'}`}>{player.username || 'Anonymous Learner'}</span>
                                                                {isMe && <span className="smallest fw-bold ls-1 text-uppercase" style={{ color: '#FACC15' }}> (YOU)</span>}
                                                            </div>
                                                            <div className="smallest fw-bold text-muted ls-1 d-flex align-items-center gap-1">
                                                                <i className={`bi ${badge.icon}`}></i> {badge.name} • LEVEL {stats.level}
                                                            </div>
                                                        </div>

                                                        <div className="text-end">
                                                            <div className="fw-bold" style={{ color: isMe ? '#FACC15' : '#111827' }}>{player.points.toLocaleString()} XP</div>
                                                            <div className="smallest text-muted text-uppercase ls-1 fw-bold">This Week</div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </section>
                                </>
                            )
                        )}
                    </main>
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

                .heartbeat-sm {
                   animation: heartbeat 2s infinite ease-in-out;
                }

                @keyframes heartbeat {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                    100% { transform: scale(1); }
                }
            `}</style>
        </div>
    );
};

export default Leaderboard;
