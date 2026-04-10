import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../services/firebaseConfig';
import { fetchTopLearnersByWeek, fetchUserData } from '../../services/dataCache';
import { getCurrentWeekIdentifier } from "../../services/levelUtils.ts";
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
    const [communityStats, setCommunityStats] = useState({ totalXP: 0 });

    useEffect(() => {
        const unsubAuth = onAuthStateChanged(auth, (user: any) => {
            setIsLoggedIn(!!user);
        });

        const fetchLeaderboard = async () => {
            try {
                const playersData = await fetchTopLearnersByWeek(20);
                const currentUserData = await fetchUserData();
                const currentWeek = getCurrentWeekIdentifier();

                let totalXP = 0;

                if (playersData && Array.isArray(playersData)) {
                    playersData.forEach((player, index) => {
                        if (index < 10) totalXP += (player.points || 0);
                        if (player.id === auth.currentUser?.uid) {
                            setCurrentUserRank({ rank: index + 1, player });
                        }
                    });

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
                    setCommunityStats({ totalXP });
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
                title: '<span class="fw-black ls-tight text-dark">HOW TO RANK UP</span>',
                html: `
            <div class="text-start p-2">
                <div class="mb-4 d-flex align-items-start gap-3">
                    <div class="bg-light p-3 rounded-4 border border-2 border-dark shadow-action-sm text-primary">
                        <i class="bi bi-book-half fs-4"></i>
                    </div>
                    <div>
                        <p class="smallest fw-black text-dark mb-1 ls-1 text-uppercase">Lessons</p>
                        <p class="small text-muted mb-0">Earn base points for every successfully completed module.</p>
                    </div>
                </div>

                <div class="mb-4 d-flex align-items-start gap-3">
                    <div class="bg-light p-3 rounded-4 border border-2 border-dark shadow-action-sm text-warning">
                        <i class="bi bi-zap-fill fs-4"></i>
                    </div>
                    <div>
                        <p class="smallest fw-black text-dark mb-1 ls-1 text-uppercase">Streaks</p>
                        <p class="small text-muted mb-0">Maintain a daily learning streak to multiply your rewards.</p>
                    </div>
                </div>

                <div class="mb-0 d-flex align-items-start gap-3">
                    <div class="bg-light p-3 rounded-4 border border-2 border-dark shadow-action-sm text-danger">
                        <i class="bi bi-target fs-4"></i>
                    </div>
                    <div>
                        <p class="smallest fw-black text-dark mb-1 ls-1 text-uppercase">Accuracy</p>
                        <p class="small text-muted mb-0">Perfect scores in quizzes grant the "Muhali" bonus points.</p>
                    </div>
                </div>
            </div>
        `,
                confirmButtonText: 'GOT IT',
                confirmButtonColor: '#000',
                customClass: {
                    popup: 'rounded-4 border border-4 border-dark shadow-action',
                    confirmButton: 'rounded-pill px-5 fw-black text-white ls-1'
                }
            });
        };
        (window as any).showScoringGuide = handleShowGuide;

        const handleShowLeaguesGuide = () => {

            Swal.fire({

                title: '<span class="fw-bold ls-tight">LEAGUES EXPLAINED</span>',

                html: `

<div class="text-start p-2">

<div class="mb-4 d-flex align-items-start gap-3">

<div class="bg-light p-3 rounded-4" style="color: #0284c7;"><i class="bi bi-gem fs-4"></i></div>

<div>

<p class="smallest fw-bold text-dark mb-1 ls-1 text-uppercase">The Podium (Top 3)</p>

<p class="small text-muted mb-0">The elite learners. Your avatar is displayed dynamically at the top of the leaderboard.</p>

</div>

</div>

<div class="mb-4 d-flex align-items-start gap-3">

<div class="bg-light p-3 rounded-4" style="color: #CA8A04;"><i class="bi bi-star-fill fs-4"></i></div>

<div>

<p class="smallest fw-bold text-dark mb-1 ls-1 text-uppercase">Gold League</p>

<p class="small text-muted mb-0">The rising stars. Place between Rank 4 and Rank 10 to earn your gold shield.</p>

</div>

</div>

<div class="mb-0 d-flex align-items-start gap-3">

<div class="bg-light p-3 rounded-4 text-secondary"><i class="bi bi-shield-fill fs-4"></i></div>

<div>

<p class="smallest fw-bold text-dark mb-1 ls-1 text-uppercase">Silver League</p>

<p class="small text-muted mb-0">The active challengers. Secure a spot between Rank 11 and Rank 20 to maintain Silver League status.</p>

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
        (window as any).showLeaguesGuide = handleShowLeaguesGuide;

        return () => unsubAuth();
    }, []);

    if (loading) return (
        <div className="d-flex justify-content-center align-items-center vh-100 bg-white">
            <Loader2 className="animate-spin text-warning" size={48} />
        </div>
    );

    const topThree = players.slice(0, 3);
    const goldLeague = players.slice(3, 10);
    const silverLeague = players.slice(10, 20);

    const renderPlayer = (player: Player, globalIndex: number, leagueColor: string) => {
        const isMe = isLoggedIn && player.id === auth.currentUser?.uid;
        return (
            <div key={player.id} className={`list-group-item bg-transparent border-0 px-3 py-3 d-flex align-items-center ${isMe ? 'border-start border-4' : ''}`} style={isMe ? { borderLeftColor: leagueColor, backgroundColor: 'rgba(0,0,0,0.04)' } : {}}>
                <span className="me-3 fw-black text-muted smallest" style={{ width: '25px' }}>#{globalIndex + 1}</span>
                <div className="me-3">
                    <AvatarDisplay avatarId={player.avatarId || 'adventurer'} seed={player.username} size={40} />
                </div>
                <div className="flex-grow-1 text-start">
                    <div className="d-flex align-items-center gap-2">
                        <span className="fw-black text-dark">{player.username || 'Anonymous Learner'}</span>
                        {isMe && <span className="smallest fw-black ls-1 text-uppercase" style={{ color: leagueColor }}> (YOU)</span>}
                    </div>
                </div>
                <div className="text-end">
                    <div className="fw-black text-dark">{player.points.toLocaleString()} XP</div>
                </div>
            </div>
        );
    };

    return (
        <div className="bg-white min-vh-100 pt-3 pb-5" style={{ overflowX: 'hidden' }}>
            <div className="container" style={{ maxWidth: '1100px' }}>

                {/* BACK NAVIGATION */}
                <button
                    className="btn btn-link text-decoration-none p-0 mb-4 d-flex align-items-center gap-2 text-dark fw-black smallest ls-2 text-uppercase"
                    onClick={() => navigate('/')}
                >
                    <ArrowLeft size={16} /> Murahu
                </button>

                {/* HEADER SECTION */}
                <header className="mb-4 border-bottom border-4 border-dark pb-4 d-flex flex-column flex-md-row justify-content-between align-items-md-end gap-3">
                    <div>
                        <p className="smallest fw-black text-muted mb-1 ls-2 text-uppercase">Weekly Standings</p>
                        <h2 className="fw-black mb-0 ls-tight text-dark" style={{ fontSize: '2.5rem' }}>THE WEEKLY TRIBE</h2>
                    </div>
                    <div className="d-flex align-items-center gap-4">
                        <div className="d-none d-md-block text-end">
                            <span className="smallest fw-black text-muted ls-1 uppercase d-block">Community Effort:</span>
                            <span className="fw-black text-dark">{communityStats.totalXP.toLocaleString()} XP</span>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                            <button
                                className="btn btn-outline-dark rounded-pill py-2 px-3 fw-black smallest ls-1 d-flex align-items-center gap-2 border-2"
                                onClick={() => (window as any).showScoringGuide()}
                            >
                                <Info size={16} /> <span className="d-none d-sm-block text-uppercase">Scoring</span>
                            </button>
                            <button
                                className="btn btn-dark rounded-pill py-2 px-3 fw-black smallest ls-1 d-flex align-items-center gap-2 shadow-action-sm"
                                onClick={() => (window as any).showLeaguesGuide()}
                            >
                                <Trophy size={16} className="text-warning" /> <span className="d-none d-sm-block text-uppercase">Leagues</span>
                            </button>
                        </div>
                    </div>
                </header>

                <div className="row justify-content-center">
                    <main className="col-lg-10 col-xl-8">

                        {!isLoggedIn ? (
                            <section className="p-5 bg-dark text-white rounded-4 border border-4 border-dark shadow-action mb-5 text-center">
                                <p className="smallest fw-black ls-2 text-uppercase mb-2 text-warning">Join the Tribe</p>
                                <h2 className="fw-black mb-4">Ready to climb the ranks?</h2>
                                <button onClick={() => navigate('/login')} className="btn btn-game-primary px-5 py-3 fw-black smallest ls-1">
                                    SIGN IN TO RANK
                                </button>
                            </section>
                        ) : !currentUserRank ? (
                            <section className="p-5 bg-white border border-4 border-dark rounded-4 shadow-action mb-5 text-center">
                                <Award size={64} className="mx-auto mb-3 text-warning animate-heartbeat" />
                                <h3 className="fw-black text-dark mb-2">Leaderboard Locked!</h3>
                                <p className="text-muted fw-bold mb-4">Complete a lesson this week to join the rankings.</p>
                                <button onClick={() => navigate('/courses')} className="btn btn-dark rounded-pill px-5 py-3 fw-black smallest ls-2 shadow-action-sm">
                                    START YOUR FIRST LESSON
                                </button>
                            </section>
                        ) : (
                            <>
                                {/* PODIUM */}
                                <div className="row align-items-end mb-5 g-0 text-center border-bottom border-4 border-dark pb-5 mx-auto" style={{ maxWidth: '600px' }}>
                                    {topThree[1] && (
                                        <div className="col-4 px-2">
                                            <AvatarDisplay avatarId={topThree[1].avatarId || 'adventurer'} seed={topThree[1].username} size={60} className="shadow-action-sm border-2 border-dark mb-3" />
                                            <Award className="text-secondary mx-auto mb-2" size={32} />
                                            <div className="fw-black text-dark text-truncate small">{topThree[1].username}</div>
                                            <div className="rounded-top-3 border-top border-start border-end border-4 border-dark" style={{ height: '80px', backgroundColor: '#9CA3AF' }}></div>
                                        </div>
                                    )}
                                    {topThree[0] && (
                                        <div className="col-4 px-2">
                                            <AvatarDisplay avatarId={topThree[0].avatarId || 'adventurer'} seed={topThree[0].username} size={85} className="shadow-action border-4 border-dark mb-3" />
                                            <Trophy className="text-warning mx-auto mb-2" size={48} />
                                            <div className="fw-black text-dark text-truncate">{topThree[0].username}</div>
                                            <div className="rounded-top-3 border-top border-start border-end border-4 border-dark" style={{ height: '140px', backgroundColor: '#FACC15' }}></div>
                                        </div>
                                    )}
                                    {topThree[2] && (
                                        <div className="col-4 px-2">
                                            <AvatarDisplay avatarId={topThree[2].avatarId || 'adventurer'} seed={topThree[2].username} size={50} className="shadow-action-sm border-2 border-dark mb-3" />
                                            <Award style={{ color: '#CD7F32' }} className="mx-auto mb-2" size={24} />
                                            <div className="fw-black text-dark text-truncate small">{topThree[2].username}</div>
                                            <div className="rounded-top-3 border-top border-start border-end border-4 border-dark" style={{ height: '50px', backgroundColor: '#CD7F32' }}></div>
                                        </div>
                                    )}
                                </div>

                                {/* LEAGUES */}
                                <section className="text-center mt-5">
                                    {goldLeague.length > 0 && (
                                        <div className="mb-5 mx-auto" style={{ maxWidth: '600px' }}>
                                            <div className="d-flex align-items-center gap-2 mb-3 bg-white py-2 px-4 rounded-pill d-inline-flex border border-4 border-dark shadow-action-sm">
                                                <i className="bi bi-star-fill text-warning"></i>
                                                <h6 className="mb-0 fw-black ls-1 text-uppercase text-dark" style={{ fontSize: "12px" }}>Gold League</h6>
                                            </div>
                                            <div className="list-group shadow-action rounded-4 border border-4 border-dark bg-white overflow-hidden">
                                                {goldLeague.map((player, index) => renderPlayer(player, index + 3, '#CA8A04'))}
                                            </div>
                                        </div>
                                    )}

                                    {silverLeague.length > 0 && (
                                        <div className="mb-5 mx-auto" style={{ maxWidth: '600px' }}>
                                            <div className="d-flex align-items-center gap-2 mb-3 bg-white py-2 px-4 rounded-pill d-inline-flex border border-4 border-dark shadow-action-sm">
                                                <i className="bi bi-shield-fill text-muted"></i>
                                                <h6 className="mb-0 fw-black ls-1 text-uppercase text-muted" style={{ fontSize: "12px" }}>Silver League</h6>
                                            </div>
                                            <div className="list-group shadow-action rounded-4 border border-4 border-dark bg-white overflow-hidden">
                                                {silverLeague.map((player, index) => renderPlayer(player, index + 10, '#6B7280'))}
                                            </div>
                                        </div>
                                    )}
                                </section>
                            </>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
};

export default Leaderboard;