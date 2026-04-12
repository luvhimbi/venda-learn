import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../services/firebaseConfig';
import { fetchTopLearnersByWeek, fetchUserData } from '../../services/dataCache';
import { getCurrentWeekIdentifier } from "../../services/levelUtils.ts";
import { AvatarDisplay } from '../../components/AvatarPicker';
import { Award, Trophy, Loader2, Info, X } from 'lucide-react';
import Swal from 'sweetalert2';

interface Player {
    id: string;
    username: string;
    points: number;
    avatarId?: string;
}

const LEAGUES = {
    PODIUM: { min: 1, max: 3, color: '#facc15' },
    GOLD: { min: 4, max: 10, color: '#CA8A04' },
    SILVER: { min: 11, max: 20, color: '#6B7280' }
};

interface RankItemProps {
    player: Player;
    rank: number;
    leagueColor: string;
    isMe: boolean;
}

const RankItem: React.FC<RankItemProps> = ({ player, rank, leagueColor, isMe }) => (
    <div className={`list-group-item bg-transparent border-0 px-3 py-3 d-flex align-items-center ${isMe ? 'border-start border-4' : ''}`} style={isMe ? { borderLeftColor: leagueColor, backgroundColor: 'var(--color-surface)' } : {}}>
        <span className="me-3 fw-black text-theme-muted smallest" style={{ width: '25px' }}>#{rank > 20 ? '20+' : rank}</span>
        <div className="me-3">
            <AvatarDisplay avatarId={player.avatarId || 'adventurer'} seed={player.username} size={40} />
        </div>
        <div className="flex-grow-1 text-start">
            <div className="d-flex align-items-center gap-2">
                <span className="fw-black text-theme-main">{player.username || 'Anonymous Learner'}</span>
                {isMe && <span className="smallest fw-black ls-1 text-uppercase" style={{ color: leagueColor }}> (YOU)</span>}
            </div>
        </div>
        <div className="text-end">
            <div className="fw-black text-theme-main">{player.points.toLocaleString()} XP</div>
        </div>
    </div>
);

const Muvhigo: React.FC = () => {
    const navigate = useNavigate();
    const [players, setPlayers] = useState<Player[]>([]);
    const [currentUserRank, setCurrentUserRank] = useState<{ rank: number, player: Player } | null>(null);
    const [loading, setLoading] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [communityStats, setCommunityStats] = useState({ totalXP: 0 });

    const handleShowGuide = () => {
        Swal.fire({
            title: '<span class="fw-black ls-tight text-theme-main">HOW TO RANK UP</span>',
            html: `
        <div class="text-start p-2">
            <div class="mb-4 d-flex align-items-start gap-3">
                <div class="bg-theme-surface p-3 rounded-4 border border-2 border-theme-main shadow-action-sm text-primary">
                    <i class="bi bi-book-half fs-4"></i>
                </div>
                <div>
                    <p class="smallest fw-black text-theme-main mb-1 ls-1 text-uppercase">Lessons</p>
                    <p class="small text-theme-muted mb-0">Earn base points for every successfully completed module.</p>
                </div>
            </div>

            <div class="mb-4 d-flex align-items-start gap-3">
                <div class="bg-theme-surface p-3 rounded-4 border border-2 border-theme-main shadow-action-sm text-warning">
                    <i class="bi bi-zap-fill fs-4"></i>
                </div>
                <div>
                    <p class="smallest fw-black text-theme-main mb-1 ls-1 text-uppercase">Streaks</p>
                    <p class="small text-theme-muted mb-0">Maintain a daily learning streak to multiply your rewards.</p>
                </div>
            </div>

            <div class="mb-0 d-flex align-items-start gap-3">
                <div class="bg-theme-surface p-3 rounded-4 border border-2 border-theme-main shadow-action-sm text-danger">
                    <i class="bi bi-target fs-4"></i>
                </div>
                <div>
                    <p class="smallest fw-black text-theme-main mb-1 ls-1 text-uppercase">Accuracy</p>
                    <p class="small text-theme-muted mb-0">Perfect scores in quizzes grant the "Muhali" bonus points.</p>
                </div>
            </div>
        </div>
    `,
            confirmButtonText: 'GOT IT',
            confirmButtonColor: 'var(--color-bg-inv)',
            customClass: {
                popup: 'rounded-4 border border-4 border-theme-main shadow-action bg-theme-card',
                confirmButton: 'rounded-pill px-5 fw-black text-theme-inv ls-1'
            }
        });
    };

    const handleShowLeaguesGuide = () => {
        Swal.fire({
            title: '<span class="fw-bold ls-tight text-theme-main">LEAGUES EXPLAINED</span>',
            html: `
<div class="text-start p-2">
    <div class="mb-4 d-flex align-items-start gap-3">
        <div class="bg-theme-surface p-3 rounded-4 border border-theme-main" style="color: #facc15;"><i class="bi bi-gem fs-4"></i></div>
        <div>
            <p class="smallest fw-bold text-theme-main mb-1 ls-1 text-uppercase">The Podium (Top 3)</p>
            <p class="small text-theme-muted mb-0">The elite learners. Your avatar is displayed dynamically at the top of the leaderboard.</p>
        </div>
    </div>
    <div class="mb-4 d-flex align-items-start gap-3">
        <div class="bg-theme-surface p-3 rounded-4 border border-theme-main" style="color: #CA8A04;"><i class="bi bi-star-fill fs-4"></i></div>
        <div>
            <p class="smallest fw-bold text-theme-main mb-1 ls-1 text-uppercase">Gold League</p>
            <p class="small text-muted mb-0">The rising stars. Place between Rank 4 and Rank 10 to earn your gold shield.</p>
        </div>
    </div>
    <div class="mb-0 d-flex align-items-start gap-3">
        <div class="bg-theme-surface p-3 rounded-4 border border-theme-main" style="color: #6B7280;"><i class="bi bi-shield-fill fs-4"></i></div>
        <div>
            <p class="smallest fw-bold text-theme-main mb-1 ls-1 text-uppercase">Silver League</p>
            <p class="small text-muted mb-0">The active challengers. Secure a spot between Rank 11 and Rank 20 to maintain Silver League status.</p>
        </div>
    </div>
</div>
`,
            confirmButtonText: 'GOT IT',
            confirmButtonColor: '#FACC15',
            customClass: {
                popup: 'rounded-5 border border-4 border-theme-main bg-theme-card shadow-lg',
                confirmButton: 'rounded-pill px-5 fw-bold text-dark ls-1'
            }
        });
    };

    useEffect(() => {
        const unsubAuth = onAuthStateChanged(auth, (user) => {
            setIsLoggedIn(!!user);
        });

        const fetchLeaderboard = async () => {
            try {
                const playersData = await fetchTopLearnersByWeek(20);
                const currentUserData = await fetchUserData();
                const currentWeek = getCurrentWeekIdentifier();

                let totalXP = 0;

                if (playersData && Array.isArray(playersData)) {
                    let foundMe = false;
                    playersData.forEach((player, index) => {
                        if (index < 10) totalXP += (player.points || 0);
                        if (auth.currentUser && player.id === auth.currentUser.uid) {
                            setCurrentUserRank({ rank: index + 1, player });
                            foundMe = true;
                        }
                    });

                    // If user is active but not in top 20, show them as "Unranked" but with points
                    if (!foundMe && currentUserData && currentUserData.lastActiveWeek === currentWeek && (currentUserData.weeklyXP || 0) > 0) {
                        setCurrentUserRank({
                            rank: 21, // Use 21 as local indicator for "20+" or just outside Top 20
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
        return () => unsubAuth();
    }, []);

    if (loading) return (
        <div className="d-flex justify-content-center align-items-center vh-100 bg-theme-base">
            <Loader2 className="animate-spin text-warning" size={48} />
        </div>
    );

    const topThree = players.slice(0, 3);
    const goldLeague = players.slice(3, 10);
    const silverLeague = players.slice(10, 20);

    return (
        <div className="bg-theme-base min-vh-100 pt-3 pb-5" style={{ overflowX: 'hidden' }}>
            <div className="container" style={{ maxWidth: '1100px' }}>

                {/* BACK NAVIGATION */}
                <button
                    className="btn btn-white bg-theme-surface border border-3 border-theme-main rounded-circle p-0 d-flex align-items-center justify-content-center text-theme-main shadow-action-sm mb-4"
                    onClick={() => navigate(-1)}
                    style={{ width: '40px', height: '40px' }}
                >
                    <X size={24} strokeWidth={3} />
                </button>

                {/* HEADER SECTION */}
                <header className="mb-4 border-bottom border-4 border-theme-main pb-4 d-flex flex-column flex-md-row justify-content-between align-items-md-end gap-3">
                    <div>
                        <p className="smallest fw-black text-theme-muted mb-1 ls-2 text-uppercase">Weekly Standings</p>
                        <h2 className="fw-black mb-0 ls-tight text-theme-main" style={{ fontSize: '2.5rem' }}>THE WEEKLY TRIBE</h2>
                    </div>
                    <div className="d-flex align-items-center gap-4">
                        <div className="d-none d-md-block text-end">
                            <span className="smallest fw-black text-theme-muted ls-1 uppercase d-block">Community Effort:</span>
                            <span className="fw-black text-theme-main">{communityStats.totalXP.toLocaleString()} XP</span>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                            <button
                                className="btn btn-outline-theme rounded-pill py-2 px-3 fw-black smallest ls-1 d-flex align-items-center gap-2 border-2"
                                onClick={handleShowGuide}
                            >
                                <Info size={16} /> <span className="d-none d-sm-block text-uppercase">Scoring</span>
                            </button>
                            <button
                                className="btn btn-theme-main rounded-pill py-2 px-3 fw-black smallest ls-1 d-flex align-items-center gap-2 shadow-action-sm"
                                onClick={handleShowLeaguesGuide}
                            >
                                <Trophy size={16} className="text-venda" /> <span className="d-none d-sm-block text-uppercase">Leagues</span>
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
                            <section className="p-5 bg-theme-base border border-4 border-theme-main rounded-4 shadow-action mb-5 text-center">
                                <Award size={64} className="mx-auto mb-3 text-warning animate-heartbeat" />
                                <h3 className="fw-black text-theme-main mb-2">Leaderboard Locked!</h3>
                                <p className="text-theme-muted fw-bold mb-4">Complete a lesson this week to join the rankings.</p>
                                <button onClick={() => navigate('/courses')} className="btn btn-game btn-game-primary rounded-pill px-5 py-3 fw-black smallest ls-2 shadow-action-sm">
                                    START YOUR FIRST LESSON
                                </button>
                            </section>
                        ) : (
                            <>
                                {/* PODIUM */}
                                <div className="row align-items-end mb-5 g-0 text-center border-bottom border-4 border-theme-main pb-5 mx-auto" style={{ maxWidth: '600px' }}>
                                    {topThree[1] && (
                                        <div className="col-4 px-2 d-flex flex-column justify-content-end">
                                            <div className="d-flex justify-content-center mb-2">
                                                <AvatarDisplay avatarId={topThree[1].avatarId || 'adventurer'} seed={topThree[1].username} size={60} />
                                            </div>
                                            <Award className="text-secondary mx-auto mb-1" size={24} />
                                            <div className="fw-black text-theme-main text-truncate small mb-1">{topThree[1].username}</div>
                                            <div className="rounded-top-3 border-top border-start border-end border-4 border-theme-main mx-auto w-100" style={{ height: '80px', backgroundColor: '#9CA3AF' }}></div>
                                        </div>
                                    )}
                                    {topThree[0] && (
                                        <div className="col-4 px-2 d-flex flex-column justify-content-end">
                                            <div className="d-flex justify-content-center mb-2">
                                                <AvatarDisplay avatarId={topThree[0].avatarId || 'adventurer'} seed={topThree[0].username} size={85} />
                                            </div>
                                            <Trophy className="text-venda mx-auto mb-1" size={32} />
                                            <div className="fw-black text-theme-main text-truncate mb-1">{topThree[0].username}</div>
                                            <div className="rounded-top-3 border-top border-start border-end border-4 border-theme-main mx-auto w-100" style={{ height: '140px', backgroundColor: '#FACC15' }}></div>
                                        </div>
                                    )}
                                    {topThree[2] && (
                                        <div className="col-4 px-2 d-flex flex-column justify-content-end">
                                            <div className="d-flex justify-content-center mb-2">
                                                <AvatarDisplay avatarId={topThree[2].avatarId || 'adventurer'} seed={topThree[2].username} size={50} />
                                            </div>
                                            <Award style={{ color: '#CD7F32' }} className="mx-auto mb-1" size={24} />
                                            <div className="fw-black text-theme-main text-truncate small mb-1">{topThree[2].username}</div>
                                            <div className="rounded-top-3 border-top border-start border-end border-4 border-theme-main mx-auto w-100" style={{ height: '50px', backgroundColor: '#CD7F32' }}></div>
                                        </div>
                                    )}
                                </div>

                                {/* LEAGUES */}
                                <section className="text-center mt-5">
                                    {goldLeague.length > 0 && (
                                        <div className="mb-5 mx-auto" style={{ maxWidth: '600px' }}>
                                            <div className="d-flex align-items-center gap-2 mb-3 bg-theme-card py-2 px-4 rounded-pill d-inline-flex border border-4 border-theme-main shadow-action-sm">
                                                <i className="bi bi-star-fill text-warning"></i>
                                                <h6 className="mb-0 fw-black ls-1 text-uppercase text-theme-main" style={{ fontSize: "12px" }}>Gold League</h6>
                                            </div>
                                            <div className="list-group shadow-action rounded-4 border border-4 border-theme-main bg-theme-card overflow-hidden">
                                                {goldLeague.map((player, index) => (
                                                    <RankItem 
                                                        key={player.id} 
                                                        player={player} 
                                                        rank={index + 4} 
                                                        leagueColor={LEAGUES.GOLD.color} 
                                                        isMe={isLoggedIn && player.id === auth.currentUser?.uid} 
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {silverLeague.length > 0 && (
                                        <div className="mb-5 mx-auto" style={{ maxWidth: '600px' }}>
                                            <div className="d-flex align-items-center gap-2 mb-3 bg-theme-card py-2 px-4 rounded-pill d-inline-flex border border-4 border-theme-main shadow-action-sm">
                                                <i className="bi bi-shield-fill text-theme-muted"></i>
                                                <h6 className="mb-0 fw-black ls-1 text-uppercase text-theme-muted" style={{ fontSize: "12px" }}>Silver League</h6>
                                            </div>
                                            <div className="list-group shadow-action rounded-4 border border-4 border-theme-main bg-theme-card overflow-hidden">
                                                {silverLeague.map((player, index) => (
                                                    <RankItem 
                                                        key={player.id} 
                                                        player={player} 
                                                        rank={index + 11} 
                                                        leagueColor={LEAGUES.SILVER.color} 
                                                        isMe={isLoggedIn && player.id === auth.currentUser?.uid} 
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* PERSONAL STANDINGS (If outside top 20) */}
                                    {currentUserRank && currentUserRank.rank > 20 && (
                                        <div className="mt-5 pt-4 border-top border-4 border-theme-main border-dashed mx-auto" style={{ maxWidth: '600px' }}>
                                            <p className="smallest fw-black text-theme-muted ls-2 text-uppercase mb-3">Your Progress</p>
                                            <div className="list-group shadow-action rounded-4 border border-4 border-theme-main bg-theme-base overflow-hidden">
                                                <RankItem 
                                                    player={currentUserRank.player} 
                                                    rank={currentUserRank.rank} 
                                                    leagueColor="#2563eb" 
                                                    isMe={true} 
                                                />
                                                <div className="bg-theme-surface p-3 border-top border-2 border-theme-main text-center">
                                                    <p className="small fw-bold text-theme-muted mb-0">You are just outside the Top 20. Keep learning to break into the Silver League!</p>
                                                </div>
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

export default Muvhigo;