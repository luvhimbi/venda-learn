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
    SILVER: { min: 11, max: 20, color: '#6B7280' },
    BRONZE: { min: 21, max: 50, color: '#92400e' }
};

interface RankItemProps {
    player: Player;
    rank: number;
    leagueColor: string;
    isMe: boolean;
}

const RankItem: React.FC<RankItemProps> = ({ player, rank, leagueColor, isMe }) => (
    <div className={`list-group-item bg-transparent border-0 px-3 py-3 d-flex align-items-center ${isMe ? 'border-start border-4' : ''}`} style={isMe ? { borderLeftColor: leagueColor, backgroundColor: 'var(--color-surface)' } : {}}>
        <span className="me-3 fw-black text-theme-muted smallest" style={{ width: '25px' }}>#{rank > 50 ? '50+' : rank}</span>
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
            title: '<h3 class="fw-black ls-tight text-theme-main uppercase mb-0">How to Climb</h3>',
            html: `
                <div class="text-start py-3 px-1">
                    <div class="brutalist-card--sm p-3 mb-3 d-flex align-items-center gap-3 bg-theme-base border-theme-main">
                        <div class="rounded-3 p-2 bg-success bg-opacity-10 border border-success border-2">
                             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="text-success"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                        </div>
                        <div>
                            <p class="smallest fw-black text-theme-main mb-0 ls-1 uppercase">LESSONS</p>
                            <p class="smallest fw-bold text-theme-muted mb-0">Base points per module completed.</p>
                        </div>
                    </div>

                    <div class="brutalist-card--sm p-3 mb-3 d-flex align-items-center gap-3 bg-theme-base border-theme-main">
                        <div class="rounded-3 p-2 bg-warning bg-opacity-10 border border-warning border-2">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="text-warning"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg>
                        </div>
                        <div>
                            <p class="smallest fw-black text-theme-main mb-0 ls-1 uppercase">STREAKS</p>
                            <p class="smallest fw-bold text-theme-muted mb-0">Multiply rewards with daily visits.</p>
                        </div>
                    </div>

                    <div class="brutalist-card--sm p-3 d-flex align-items-center gap-3 bg-theme-base border-theme-main">
                        <div class="rounded-3 p-2 bg-danger bg-opacity-10 border border-danger border-2">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="text-danger"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>
                        </div>
                        <div>
                            <p class="smallest fw-black text-theme-main mb-0 ls-1 uppercase">MUHALI BONUS</p>
                            <p class="smallest fw-bold text-theme-muted mb-0">Extra points for perfect accuracy!</p>
                        </div>
                    </div>
                </div>
            `,
            confirmButtonText: 'UNDERSTOOD',
            buttonsStyling: false,
            customClass: {
                popup: 'rounded-5 border border-4 border-theme-main shadow-action bg-theme-card p-4',
                confirmButton: 'btn btn-game btn-game-primary px-5 py-3 fw-black smallest ls-2 uppercase',
                title: 'text-theme-main'
            }
        });
    };

    const handleShowLeaguesGuide = () => {
        Swal.fire({
            title: '<h3 class="fw-black ls-tight text-theme-main uppercase mb-0">The Leagues</h3>',
            html: `
                <div class="text-start py-3 px-1">
                    <div class="brutalist-card--sm p-3 mb-3 d-flex align-items-center gap-3 bg-theme-base border-theme-main">
                        <div class="rounded-3 p-2 border-2 border" style="background: rgba(250, 204, 21, 0.1); border-color: #facc15;">
                             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#facc15" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55.45 1 1 1h2c.55 0 1-.45 1-1v-2.34"></path><path d="M15.3 14.3A5 5 0 0 0 12 5a5 5 0 0 0-3.3 9.3"></path></svg>
                        </div>
                        <div>
                            <p class="smallest fw-black text-theme-main mb-0 ls-1 uppercase">THE PODIUM (1-3)</p>
                            <p class="smallest fw-bold text-theme-muted mb-0">The elite learners of the Tribe.</p>
                        </div>
                    </div>

                    <div class="brutalist-card--sm p-3 mb-3 d-flex align-items-center gap-3 bg-theme-base border-theme-main">
                        <div class="rounded-3 p-2 border-2 border" style="background: rgba(202, 138, 4, 0.1); border-color: #CA8A04;">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#CA8A04" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                        </div>
                        <div>
                            <p class="smallest fw-black text-theme-main mb-0 ls-1 uppercase">GOLD LEAGUE (4-10)</p>
                            <p class="smallest fw-bold text-theme-muted mb-0">Rising stars with gold shields.</p>
                        </div>
                    </div>

                    <div class="brutalist-card--sm p-3 d-flex align-items-center gap-3 bg-theme-base border-theme-main">
                        <div class="rounded-3 p-2 border-2 border" style="background: rgba(107, 114, 128, 0.1); border-color: #6B7280;">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6B7280" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                        </div>
                        <div>
                            <p class="smallest fw-black text-theme-main mb-0 ls-1 uppercase">SILVER LEAGUE (11-20)</p>
                            <p class="smallest fw-bold text-theme-muted mb-0">Active challengers of the path.</p>
                        </div>
                    </div>
                </div>
            `,
            confirmButtonText: 'LET\'S GO',
            buttonsStyling: false,
            customClass: {
                popup: 'rounded-5 border border-4 border-theme-main shadow-action bg-theme-card p-4',
                confirmButton: 'btn btn-game btn-game-primary px-5 py-3 fw-black smallest ls-2 uppercase',
                title: 'text-theme-main'
            }
        });
    };

    useEffect(() => {
        const unsubAuth = onAuthStateChanged(auth, (user) => {
            setIsLoggedIn(!!user);
        });

        const fetchLeaderboard = async () => {
            try {
                const playersData = await fetchTopLearnersByWeek(50);
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

                    // If user is active but not in top 50, show them as unranked or high rank
                    if (!foundMe && currentUserData && currentUserData.lastActiveWeek === currentWeek && (currentUserData.weeklyXP || 0) > 0) {
                        setCurrentUserRank({
                            rank: 51, // Local indicator for 50+
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
    const bronzeLeague = players.slice(20, 50);

    return (
        <div className="bg-theme-base min-vh-100 pt-3 pb-5" style={{ overflowX: 'hidden' }}>
            <div className="container" style={{ maxWidth: '1100px' }}>

                {/* BACK NAVIGATION */}
                <button
                    className="btn btn-white bg-theme-base border border-3 border-theme-main rounded-circle p-0 d-flex align-items-center justify-content-center text-theme-main shadow-action-sm mb-4"
                    onClick={() => navigate(-1)}
                    style={{ width: '44px', height: '44px' }}
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
                                className="btn btn-game btn-game-white py-2 px-3 fw-black smallest ls-1 d-flex align-items-center gap-2 shadow-action-sm"
                                onClick={handleShowGuide}
                            >
                                <Info size={16} strokeWidth={3} /> <span className="d-none d-sm-block text-uppercase">Scoring</span>
                            </button>
                            <button
                                className="btn btn-game btn-game-primary py-2 px-3 fw-black smallest ls-1 d-flex align-items-center gap-2 shadow-action-sm"
                                onClick={handleShowLeaguesGuide}
                            >
                                <Trophy size={16} className="text-dark" strokeWidth={3} /> <span className="d-none d-sm-block text-uppercase">Leagues</span>
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
                        ) : null}

                        {players.length === 0 && !loading ? (
                            <section className="p-5 bg-theme-base border border-4 border-theme-main rounded-4 shadow-action mb-5 text-center">
                                <Award size={64} className="mx-auto mb-3 text-warning animate-heartbeat" />
                                <h3 className="fw-black text-theme-main mb-2">A New Week Begins!</h3>
                                <p className="text-theme-muted fw-bold mb-4">Be the first to join the rankings this week.</p>
                                <button onClick={() => navigate('/courses')} className="btn btn-game btn-game-primary rounded-pill px-5 py-3 fw-black smallest ls-2 shadow-action-sm">
                                    START LEARNING
                                </button>
                            </section>
                        ) : (
                            <>
                                {/* PODIUM */}
                                <div className="row align-items-end mb-5 g-0 text-center border-bottom border-4 border-theme-main pb-5 mx-auto" style={{ maxWidth: '600px' }}>
                                    {topThree[1] && (
                                        <div className="col-4 px-1 d-flex flex-column justify-content-end">
                                            <div className={`d-flex justify-content-center mb-2 position-relative`}>
                                                <AvatarDisplay 
                                                    avatarId={topThree[1].avatarId || 'adventurer'} 
                                                    seed={topThree[1].username} 
                                                    size={60} 
                                                    className={auth.currentUser?.uid === topThree[1].id ? "border-warning border-3" : ""}
                                                />
                                            </div>
                                            <Award className="text-secondary mx-auto mb-1" size={24} />
                                            <div className="fw-black text-theme-main text-truncate small mb-0 px-2">{topThree[1].username}</div>
                                            {auth.currentUser?.uid === topThree[1].id && <div className="smallest fw-black text-warning ls-1 uppercase">(YOU)</div>}
                                            <div className="rounded-top-3 border-top border-start border-end border-4 border-theme-main mx-auto w-100 mt-1" style={{ height: '80px', backgroundColor: '#9CA3AF' }}></div>
                                        </div>
                                    )}
                                    {topThree[0] && (
                                        <div className="col-4 px-1 d-flex flex-column justify-content-end">
                                            <div className="d-flex justify-content-center mb-2 position-relative">
                                                <AvatarDisplay 
                                                    avatarId={topThree[0].avatarId || 'adventurer'} 
                                                    seed={topThree[0].username} 
                                                    size={85} 
                                                    className={auth.currentUser?.uid === topThree[0].id ? "border-warning border-4" : ""}
                                                />
                                            </div>
                                            <Trophy className="text-venda mx-auto mb-1" size={32} />
                                            <div className="fw-black text-theme-main text-truncate mb-0 px-2">{topThree[0].username}</div>
                                            {auth.currentUser?.uid === topThree[0].id && <div className="smallest fw-black text-warning ls-1 uppercase">(YOU)</div>}
                                            <div className="rounded-top-3 border-top border-start border-end border-4 border-theme-main mx-auto w-100 mt-1" style={{ height: '140px', backgroundColor: '#FACC15' }}></div>
                                        </div>
                                    )}
                                    {topThree[2] && (
                                        <div className="col-4 px-1 d-flex flex-column justify-content-end">
                                            <div className="d-flex justify-content-center mb-2 position-relative">
                                                <AvatarDisplay 
                                                    avatarId={topThree[2].avatarId || 'adventurer'} 
                                                    seed={topThree[2].username} 
                                                    size={50} 
                                                    className={auth.currentUser?.uid === topThree[2].id ? "border-warning border-3" : ""}
                                                />
                                            </div>
                                            <Award style={{ color: '#CD7F32' }} className="mx-auto mb-1" size={24} />
                                            <div className="fw-black text-theme-main text-truncate small mb-0 px-2">{topThree[2].username}</div>
                                            {auth.currentUser?.uid === topThree[2].id && <div className="smallest fw-black text-warning ls-1 uppercase">(YOU)</div>}
                                            <div className="rounded-top-3 border-top border-start border-end border-4 border-theme-main mx-auto w-100 mt-1" style={{ height: '50px', backgroundColor: '#CD7F32' }}></div>
                                        </div>
                                    )}
                                </div>

                                {/* LEAGUES */}
                                <section className="text-center mt-5">
                                    {/* PERSONAL STANDINGS (If outside top 20 or haven't earned points) - Floating Sticky/Static Tip */}
                                    {isLoggedIn && !currentUserRank && (
                                        <div className="mb-5 mx-auto border-4 border border-warning rounded-4 p-4 bg-warning bg-opacity-10 shadow-action-sm" style={{ maxWidth: '600px' }}>
                                            <h5 className="fw-black text-theme-main mb-2">YOU ARE CURRENTLY UNRANKED</h5>
                                            <p className="text-theme-muted small fw-bold mb-3">Complete a lesson to join the Weekly Tribe and start climbing!</p>
                                            <button onClick={() => navigate('/courses')} className="btn btn-game btn-game-primary rounded-pill px-4 py-2 smallest fw-black ls-1">
                                                EARN XP NOW
                                            </button>
                                        </div>
                                    )}

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

                                    {bronzeLeague.length > 0 && (
                                        <div className="mb-5 mx-auto" style={{ maxWidth: '600px' }}>
                                            <div className="d-flex align-items-center gap-2 mb-3 bg-theme-card py-2 px-4 rounded-pill d-inline-flex border border-4 border-theme-main shadow-action-sm">
                                                <i className="bi bi-shield-fill-check text-secondary" style={{ color: '#92400e' }}></i>
                                                <h6 className="mb-0 fw-black ls-1 text-uppercase text-theme-muted" style={{ fontSize: "12px", color: '#92400e' }}>Bronze League</h6>
                                            </div>
                                            <div className="list-group shadow-action rounded-4 border border-4 border-theme-main bg-theme-card overflow-hidden">
                                                {bronzeLeague.map((player, index) => (
                                                    <RankItem 
                                                        key={player.id} 
                                                        player={player} 
                                                        rank={index + 21} 
                                                        leagueColor={LEAGUES.BRONZE.color} 
                                                        isMe={isLoggedIn && player.id === auth.currentUser?.uid} 
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* PERSONAL STANDINGS (If outside top 50) */}
                                    {currentUserRank && currentUserRank.rank > 50 && (
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
                                                    <p className="small fw-bold text-theme-muted mb-0">You are just outside the Top 50. Keep learning to break into the Bronze League!</p>
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