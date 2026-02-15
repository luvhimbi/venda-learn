import React, { useEffect, useState } from 'react';
import { auth, db } from '../services/firebaseConfig';
import { doc, setDoc, updateDoc, collection, query, where, getDocs, writeBatch, increment } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { fetchUserData, invalidateCache, refreshUserData, fetchLearnedStats } from '../services/dataCache';
import { getLevelStats, getBadgeDetails } from '../services/levelUtils';
import Swal from 'sweetalert2';
import {useNavigate} from "react-router-dom";

interface UserProfile {
    username: string;
    email: string;
    points: number;
    level: number;
    streak: number;
    completedLessons: string[];
    isNativeSpeaker?: boolean;
    nativeSpeakerBio?: string;
    nativeVerificationStatus?: 'none' | 'pending' | 'verified' | 'rejected';
}

interface LearnedStats {
    wordsCount: number;
    lessonsCount: number;
    points: number;
    streak: number;
    level: number;
    completedLessons: string[];
}

const Profile: React.FC = () => {
    const [userData, setUserData] = useState<UserProfile | null>(null);
    const [stats, setStats] = useState<LearnedStats | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [updateLoading, setUpdateLoading] = useState(false);
    const [claimLoading, setClaimLoading] = useState(false);
    const [editUsername, setEditUsername] = useState('');
    const [editBio, setEditBio] = useState('');
    const [isNativeSpeaker, setIsNativeSpeaker] = useState(false);
    const [unclaimedInvites, setUnclaimedInvites] = useState<any[]>([]);
    const  navigate = useNavigate();
    const inviteLink = `${window.location.origin}/register?ref=${auth.currentUser?.uid}`;

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                const [data, learnedStats] = await Promise.all([
                    fetchUserData(),
                    fetchLearnedStats()
                ]);

                if (data) {
                    const profile = data as UserProfile;
                    setUserData({
                        ...profile,
                        points: Number(profile.points) || 0,
                        level: Number(profile.level) || 1,
                        streak: Number(profile.streak) || 0
                    });
                    setEditUsername(profile.username || '');
                    setEditBio(profile.nativeSpeakerBio || '');
                    setIsNativeSpeaker(!!profile.isNativeSpeaker);

                    // Fetch unclaimed invites
                    const q = query(
                        collection(db, "invites"),
                        where("inviterId", "==", user.uid),
                        where("claimed", "==", false)
                    );
                    const snap = await getDocs(q);
                    setUnclaimedInvites(snap.docs.map(d => ({ id: d.id, ...d.data() })));
                }

                if (learnedStats) {
                    setStats(learnedStats);
                }
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleCopyLink = () => {
        navigator.clipboard.writeText(inviteLink);
        Swal.fire({
            title: 'Khopi!',
            text: 'Invite link copied to clipboard.',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false,
            customClass: { popup: 'rounded-4' }
        });
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!auth.currentUser) return;

        setUpdateLoading(true);
        try {
            const userRef = doc(db, "users", auth.currentUser.uid);

            // Logic for verification status
            let newStatus = userData?.nativeVerificationStatus || 'none';
            if (isNativeSpeaker && (newStatus === 'none' || newStatus === 'rejected')) {
                newStatus = 'pending';
            } else if (!isNativeSpeaker) {
                newStatus = 'none';
            }

            await setDoc(userRef, {
                username: editUsername,
                email: auth.currentUser.email,
                isNativeSpeaker: newStatus === 'verified', // only verified users have the flag
                nativeSpeakerBio: editBio,
                nativeVerificationStatus: newStatus
            }, { merge: true });

            setUserData(prev => prev ? {
                ...prev,
                username: editUsername,
                isNativeSpeaker: newStatus === 'verified',
                nativeSpeakerBio: editBio,
                nativeVerificationStatus: newStatus
            } : null);
            setIsEditing(false);
            invalidateCache(`user_${auth.currentUser.uid}`);
            Swal.fire('Success', 'Phurofayili yo vusuluswa!', 'success');
        } catch (error) {
            Swal.fire('Error', 'Update failed', 'error');
        } finally {
            setUpdateLoading(false);
        }
    };

    const handleClaimRewards = async () => {
        if (!auth.currentUser || unclaimedInvites.length === 0) return;

        setClaimLoading(true);
        try {
            const batch = writeBatch(db);
            const rewardPerInvite = 500;
            const totalReward = unclaimedInvites.length * rewardPerInvite;

            // 1. Update user points
            const userRef = doc(db, "users", auth.currentUser.uid);
            batch.update(userRef, { points: increment(totalReward) });

            // 2. Mark invites as claimed
            unclaimedInvites.forEach(invite => {
                const inviteRef = doc(db, "invites", invite.id);
                batch.update(inviteRef, { claimed: true });
            });

            await batch.commit();

            // 3. Update local state
            await refreshUserData().then(d => {
                if (d) setUserData({ ...d, points: Number(d.points) || 0 });
            });
            setUnclaimedInvites([]);

            Swal.fire({
                title: 'Ndi khwine!',
                text: `You claimed ${totalReward} LP rewards!`,
                icon: 'success',
                confirmButtonColor: '#111827'
            });
        } catch (error) {
            console.error("Claim failed:", error);
            Swal.fire('Error', 'Failed to claim rewards.', 'error');
        } finally {
            setClaimLoading(false);
        }
    };

    if (loading) return (
        <div className="min-vh-100 bg-white d-flex justify-content-center align-items-center">
            <div className="spinner-border" style={{ color: '#FACC15' }}></div>
        </div>
    );

    const levelStats = getLevelStats(userData?.points || 0);
    const milestones = [
        { level: 1, name: "Mugudi", label: "Beginner" },
        { level: 5, name: "Muhali", label: "Warrior" },
        { level: 10, name: "Vele", label: "Master" },
        { level: 15, name: "Gota", label: "Leader" },
        { level: 20, name: "Thovhele", label: "King" }
    ];

    return (
        <div className="bg-white min-vh-100 py-5">
            <div className="container" style={{ maxWidth: '850px' }}>

                {/* PROFILE HEADER & SETTINGS */}
                <header className={`mb-5 pb-5 border-bottom transition-all ${isEditing ? 'bg-light p-4 rounded-4 border-warning shadow-sm' : ''}`}>
                    <div className="d-flex flex-column flex-md-row align-items-center gap-4 text-center text-md-start">
                        <div className="text-dark rounded-circle d-flex align-items-center justify-content-center fw-bold shadow-sm"
                            style={{ width: '100px', height: '100px', fontSize: '2.5rem', backgroundColor: '#FACC15', border: '3px solid #111827' }}>
                            {userData?.username?.charAt(0).toUpperCase() || 'V'}
                        </div>
                        <div className="flex-grow-1">
                            <div className="d-flex align-items-center gap-2 mb-1">
                                <h1 className="fw-bold mb-0 ls-tight">{userData?.username}</h1>
                                {userData?.isNativeSpeaker && (
                                    <span className="badge bg-success text-white smallest fw-bold ls-1 rounded-pill px-3">
                                        <i className="bi bi-patch-check-fill me-1"></i> VERIFIED NATIVE
                                    </span>
                                )}
                                {userData?.nativeVerificationStatus === 'pending' && (
                                    <span className="badge bg-warning text-dark smallest fw-bold ls-1 rounded-pill px-3">
                                        VERIFICATION PENDING
                                    </span>
                                )}
                                {userData?.nativeVerificationStatus === 'rejected' && (
                                    <span className="badge bg-danger text-white smallest fw-bold ls-1 rounded-pill px-3">
                                        VERIFICATION REJECTED
                                    </span>
                                )}
                            </div>
                            <p className="smallest fw-bold text-muted text-uppercase ls-2 mb-3">{userData?.email}</p>

                            {!isEditing ? (
                                <div className="d-flex gap-2 flex-wrap justify-content-center justify-content-md-start">
                                    <button onClick={() => setIsEditing(true)} className="btn btn-dark btn-sm px-4 py-2 fw-bold ls-1 rounded-pill shadow-sm">
                                        <i className="bi bi-pencil-square me-2"></i> EDIT PROFILE
                                    </button>
                                    {window.innerWidth >= 768 && (
                                        <button
                                            onClick={async () => {
                                                const userRef = doc(db, "users", auth.currentUser!.uid);
                                                await updateDoc(userRef, { tourCompleted: false });
                                                sessionStorage.removeItem('tour_offered');
                                                window.location.href = '/';
                                            }}
                                            className="btn btn-outline-warning btn-sm px-4 py-2 fw-bold ls-1 rounded-pill shadow-sm text-dark"
                                        >
                                            <i className="bi bi-compass me-2 fw-bold"></i> RESTART TOUR
                                        </button>
                                    )}
                                    <button onClick={async () => {
                                        await signOut(auth);
                                        invalidateCache();
                                        navigate('/login');
                                    }} className="btn btn-outline-danger btn-sm px-4 py-2 fw-bold ls-1 rounded-pill shadow-sm">
                                        <i className="bi bi-box-arrow-right me-2"></i> LOGOUT
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleUpdate} className="animate__animated animate__fadeIn">
                                    <div className="d-flex flex-column gap-3">
                                        <div className="d-flex gap-2 justify-content-center justify-content-md-start">
                                            <input
                                                type="text"
                                                className="form-control form-control-sm border-0 bg-light py-2 px-3 rounded-pill fw-bold"
                                                style={{ maxWidth: '200px' }}
                                                value={editUsername}
                                                onChange={(e) => setEditUsername(e.target.value)}
                                                required
                                            />
                                        </div>

                                        <div className="p-3 rounded-4 bg-light border-0 text-start" style={{ maxWidth: '400px' }}>
                                            <div className="form-check form-switch mb-2">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    id="isSpeakerToggle"
                                                    checked={isNativeSpeaker}
                                                    onChange={(e) => setIsNativeSpeaker(e.target.checked)}
                                                />
                                                <label className="form-check-label small fw-bold" htmlFor="isSpeakerToggle">
                                                    Apply for Native Speaker Status
                                                </label>
                                            </div>
                                            <p className="smallest text-muted mb-2">
                                                Verification allows you to appear in the Practice Hub and help others.
                                            </p>
                                            {isNativeSpeaker && (
                                                <textarea
                                                    className="form-control form-control-sm border-0 bg-white rounded-3 small mt-2"
                                                    placeholder="Short bio for learners..."
                                                    rows={2}
                                                    value={editBio}
                                                    onChange={(e) => setEditBio(e.target.value)}
                                                />
                                            )}
                                        </div>

                                        <div className="d-flex gap-2 justify-content-center justify-content-md-start mt-2">
                                            <button type="submit" className="btn btn-warning btn-lg px-5 py-3 fw-bold ls-1 rounded-pill shadow" disabled={updateLoading}>
                                                {updateLoading ? (
                                                    <span className="spinner-border spinner-border-sm me-2"></span>
                                                ) : (
                                                    <><i className="bi bi-check-circle-fill me-2"></i> SAVE CHANGES</>
                                                )}
                                            </button>
                                            <button type="button" onClick={() => setIsEditing(false)} className="btn btn-light btn-lg px-4 py-3 fw-bold ls-1 rounded-pill">
                                                CANCEL
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </header>

                {/* MY PROGRESS JOURNEY SECTION */}
                <section className="mb-5">
                    <div className="d-flex justify-content-between align-items-end mb-4">
                        <div>
                            <p className="smallest fw-bold text-warning mb-1 ls-2 text-uppercase">Tshimbila na nne</p>
                            <h2 className="fw-bold mb-0 ls-tight">MY PROGRESS JOURNEY</h2>
                        </div>
                    </div>

                    <div className="row g-4 mb-5">
                        {/* Summary Cards */}
                        <div className="col-6 col-md-3">
                            <div className="p-4 rounded-4 bg-light text-center h-100 shadow-sm border border-white hover-up transition-all">
                                <i className="bi bi-chat-dots-fill fs-2 text-primary mb-2 d-block"></i>
                                <h3 className="fw-bold mb-0">{stats?.wordsCount || 0}</h3>
                                <p className="smallest fw-bold text-muted text-uppercase ls-1">Words Learned</p>
                            </div>
                        </div>
                        <div className="col-6 col-md-3">
                            <div className="p-4 rounded-4 bg-light text-center h-100 shadow-sm border border-white hover-up transition-all">
                                <i className="bi bi-book-fill fs-2 text-success mb-2 d-block"></i>
                                <h3 className="fw-bold mb-0">{stats?.lessonsCount || 0}</h3>
                                <p className="smallest fw-bold text-muted text-uppercase ls-1">Lessons Done</p>
                            </div>
                        </div>
                        <div className="col-6 col-md-3">
                            <div className="p-4 rounded-4 bg-light text-center h-100 shadow-sm border border-white hover-up transition-all">
                                <i className="bi bi-fire fs-2 text-danger mb-2 d-block"></i>
                                <h3 className="fw-bold mb-0">{stats?.streak || 0}</h3>
                                <p className="smallest fw-bold text-muted text-uppercase ls-1">Day Streak</p>
                            </div>
                        </div>
                        <div className="col-6 col-md-3">
                            <div className="p-4 rounded-4 bg-light text-center h-100 shadow-sm border border-white hover-up transition-all">
                                <i className="bi bi-gem fs-2 text-warning mb-2 d-block"></i>
                                <h3 className="fw-bold mb-0">{stats?.points || 0}</h3>
                                <p className="smallest fw-bold text-muted text-uppercase ls-1">Total XP</p>
                            </div>
                        </div>
                    </div>

                    {/* Progress Bar & Badges */}
                    <div className="card border-0 shadow-sm rounded-4 p-4 p-md-5 mb-5 overflow-hidden position-relative" style={{ backgroundColor: '#111827', color: 'white' }}>
                        <div className="position-relative z-1">
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <div>
                                    <h4 className="fw-bold mb-1">Rank Progress</h4>
                                    <p className="smallest fw-bold text-warning ls-1 uppercase">{getBadgeDetails(levelStats.level).name} (LEVEL {levelStats.level})</p>
                                </div>
                                <div className="text-end">
                                    <h2 className="fw-bold mb-0 text-warning">{levelStats.progress}%</h2>
                                    <p className="smallest fw-bold opacity-50 ls-1">TO NEXT RANK</p>
                                </div>
                            </div>

                            <div className="progress mb-4" style={{ height: '12px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.1)' }}>
                                <div
                                    className="progress-bar progress-bar-striped progress-bar-animated bg-warning"
                                    style={{ width: `${levelStats.progress}%`, borderRadius: '10px' }}
                                ></div>
                            </div>

                            <p className="small text-muted mb-0">
                                <i className="bi bi-info-circle me-2"></i>
                                Earn {levelStats.pointsForNextLevel - levelStats.pointsInCurrentLevel} more LP to reach Level {levelStats.level + 1}
                            </p>
                        </div>
                        <div className="position-absolute end-0 bottom-0 opacity-10 display-1 p-4"><i className="bi bi-shield-shaded"></i></div>
                    </div>

                    {/* LEVEL MAP - Visual game world style */}
                    <div className="card border-0 shadow-sm rounded-4 p-4 p-md-5 mb-5 bg-white overflow-hidden">
                        <h5 className="fw-bold mb-5 text-uppercase ls-2 smallest text-muted text-center">Your Learning Path</h5>

                        <div className="level-map position-relative py-5">
                            {/* The connecting line */}
                            <div className="position-absolute start-50 top-0 bottom-0 border-start border-3 border-dashed border-secondary opacity-25" style={{ marginLeft: '-1.5px' }}></div>

                            <div className="d-flex flex-column gap-5 align-items-center position-relative">
                                {[...milestones].reverse().map((m) => {
                                    const isReached = levelStats.level >= m.level;
                                    const badge = getBadgeDetails(m.level);

                                    return (
                                        <div key={m.level} className={`milestone-node d-flex align-items-center w-100 justify-content-center gap-4 ${isReached ? 'reached' : 'locked'}`}>
                                            <div className="text-end d-none d-md-block" style={{ width: '150px' }}>
                                                <h6 className={`fw-bold mb-0 ${isReached ? 'text-dark' : 'text-muted'}`}>{m.name}</h6>
                                                <span className="smallest text-muted uppercase ls-1">{m.label}</span>
                                            </div>

                                            <div className="milestone-icon-wrapper rounded-circle shadow-lg d-flex align-items-center justify-content-center position-relative z-1"
                                                style={{
                                                    width: '70px', height: '70px',
                                                    backgroundColor: isReached ? '#FACC15' : '#eee',
                                                    border: isReached ? '3px solid #111827' : '3px dashed #ccc',
                                                    fontSize: '1.5rem',
                                                    color: isReached ? '#111827' : '#999',
                                                    transform: isReached ? 'scale(1.1)' : 'scale(1)',
                                                    opacity: isReached ? 1 : 0.6
                                                }}>
                                                <i className={`bi ${badge.icon}`}></i>
                                                {isReached && <i className="bi bi-patch-check-fill position-absolute bottom-0 end-0 text-primary fs-5 bg-white rounded-circle"></i>}
                                            </div>

                                            <div className="text-start d-none d-md-block" style={{ width: '150px' }}>
                                                <span className="smallest fw-bold text-muted ls-1 uppercase">LEVEL {m.level}+</span>
                                                {isReached ? (
                                                    <p className="smallest text-success fw-bold mb-0">UNLOCKED</p>
                                                ) : (
                                                    <p className="smallest text-muted mb-0">LOCKED</p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </section>

                {/* REFERRAL / INVITE SECTION */}
                <section className="bg-dark text-white p-5 rounded-4 position-relative overflow-hidden shadow-lg mb-5">
                    <div className="position-relative z-1">
                        <p className="smallest fw-bold ls-2 text-uppercase mb-2" style={{ color: '#FACC15' }}>Vhuimo ha Thonifho</p>
                        <h2 className="fw-bold mb-3">Invite & Earn 500 LP</h2>
                        <p className="small opacity-75 mb-4 pe-lg-5">
                            Ramba vhangana vhavho! Spread the language. You'll receive 500 Learning Points for every warrior who joins through your link.
                        </p>

                        {unclaimedInvites.length > 0 && (
                            <div className="mb-4 animate__animated animate__pulse animate__infinite">
                                <button
                                    onClick={handleClaimRewards}
                                    disabled={claimLoading}
                                    className="btn btn-warning w-100 py-3 fw-bold ls-1 shadow-lg text-dark"
                                    style={{ border: '2px solid #000' }}
                                >
                                    {claimLoading ? 'CLAIMING...' : `🎁 CLAIM ${unclaimedInvites.length * 500} LP REWARDS`}
                                </button>
                            </div>
                        )}

                        <div className="d-flex flex-column flex-md-row gap-2">
                            <div className="flex-grow-1 bg-white bg-opacity-10 rounded-3 p-3 small text-truncate border border-secondary border-opacity-25">
                                {inviteLink}
                            </div>
                            <button className="btn game-btn-primary px-4 py-2 fw-bold ls-1" onClick={handleCopyLink}>
                                COPY LINK
                            </button>
                        </div>
                    </div>
                    {/* Background decoration */}
                    <div className="position-absolute top-0 end-0 opacity-10 display-1 p-4">🐘</div>
                </section>


            </div>

            <style>{`
                .ls-tight { letter-spacing: -1.5px; }
                .ls-1 { letter-spacing: 1px; }
                .ls-2 { letter-spacing: 2px; }
                .smallest { font-size: 11px; }
                .uppercase { text-transform: uppercase; }
                
                .game-btn-primary { 
                    background-color: #FACC15 !important; 
                    color: #111827 !important; 
                    border: none !important; 
                    border-radius: 8px; 
                    box-shadow: 0 4px 0 #EAB308 !important; 
                    transition: all 0.2s; 
                }
                .game-btn-primary:active { transform: translateY(2px); box-shadow: 0 2px 0 #EAB308 !important; }

                .hover-up:hover { transform: translateY(-5px); }
                .transition-all { transition: all 0.3s ease; }

                .progress-bar-animated {
                    animation: progress-bar-stripes 1s linear infinite;
                }

                @keyframes progress-bar-stripes {
                    from { background-position: 1rem 0; }
                    to { background-position: 0 0; }
                }

                .milestone-node { opacity: 1; transition: all 0.5s ease; }
                .milestone-node.locked { opacity: 0.8; }
                .milestone-node.reached .milestone-icon-wrapper { animation: bounceIn 0.5s; }
            `}</style>
        </div>
    );
};

export default Profile;
