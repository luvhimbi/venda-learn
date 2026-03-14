import React, { useEffect, useState } from 'react';
import { auth, db } from '../../services/firebaseConfig';
import { doc, setDoc, updateDoc, collection, query, where, getDocs, writeBatch, increment } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { fetchUserData, invalidateCache, refreshUserData, fetchLearnedStats } from '../../services/dataCache';
import { getLevelStats, getBadgeDetails } from '../../services/levelUtils';
import { checkAchievements, awardTrophies, ALL_TROPHIES } from '../../services/achievementService';
import Swal from 'sweetalert2';
import { useNavigate } from "react-router-dom";
import { MessageCircle, Book, Flame, Gem, Gift, Edit3, Compass, LogOut, CheckCircle, Info, Shield, Users, Camera } from 'lucide-react';
import AvatarPicker, { AvatarDisplay } from '../../components/AvatarPicker';
import StreakCalendar from '../../components/StreakCalendar';

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
    avatarId?: string;
    trophies?: string[];
    streakFreezes?: number;
    activityHistory?: string[];
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
    const [editAvatarId, setEditAvatarId] = useState('user');
    const [unclaimedInvites, setUnclaimedInvites] = useState<any[]>([]);
    const navigate = useNavigate();
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
                    const normalizedProfile = {
                        ...profile,
                        points: Number(profile.points) || 0,
                        level: Number(profile.level) || 1,
                        streak: Number(profile.streak) || 0,
                        trophies: profile.trophies || []
                    };
                    setUserData(normalizedProfile);
                    setEditUsername(profile.username || '');
                    setEditAvatarId(profile.avatarId || 'adventurer');

                    // Check for new achievements (including 1st Login)
                    const newTrophies = checkAchievements(normalizedProfile, profile.trophies || []);
                    if (newTrophies.length > 0) {
                        const newIds = newTrophies.map(t => t.id);
                        await awardTrophies(user.uid, newIds);

                        // Update local state
                        setUserData(prev => prev ? {
                            ...prev,
                            trophies: [...(prev.trophies || []), ...newIds]
                        } : null);

                        // Notify user for the most significant one if multiple
                        const first = newTrophies[0];
                        Swal.fire({
                            title: 'Trophy Unlocked!',
                            text: `New Achievement: ${first.title}!`,
                            icon: 'success',
                            imageUrl: 'https://cdn-icons-png.flaticon.com/512/3112/3112946.png',
                            imageWidth: 80,
                            confirmButtonColor: '#FACC15',
                            confirmButtonText: 'Awesome!',
                            customClass: { popup: 'rounded-4' }
                        });
                    }

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

    const handleBuyFreeze = async () => {
        if (!userData || userData.points < 100) {
            Swal.fire({
                title: 'Insufficient LP!',
                text: 'You need 100 LP points to buy a streak freeze.',
                icon: 'warning',
                confirmButtonColor: '#FACC15',
                customClass: { popup: 'rounded-4' }
            });
            return;
        }

        try {
            setUpdateLoading(true);
            const userRef = doc(db, "users", auth.currentUser!.uid);
            await updateDoc(userRef, {
                points: increment(-100),
                streakFreezes: increment(1)
            });

            setUserData(prev => prev ? {
                ...prev,
                points: prev.points - 100,
                streakFreezes: (prev.streakFreezes || 0) + 1
            } : null);

            invalidateCache(`user_${auth.currentUser!.uid}`);
            refreshUserData(); // Ensure cache is totally fresh

            Swal.fire({
                title: 'Freeze Purchased!',
                text: 'Your streak is now protected for one missed day.',
                icon: 'success',
                confirmButtonColor: '#FACC15',
                customClass: { popup: 'rounded-4' }
            });
        } catch (err) {
            console.error("Error buying freeze:", err);
            Swal.fire('Error', 'Could not purchase freeze.', 'error');
        } finally {
            setUpdateLoading(false);
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!auth.currentUser) return;

        setUpdateLoading(true);
        try {
            const userRef = doc(db, "users", auth.currentUser.uid);

            await setDoc(userRef, {
                username: editUsername,
                email: auth.currentUser.email,
                avatarId: editAvatarId
            }, { merge: true });

            setUserData(prev => prev ? {
                ...prev,
                username: editUsername,
                avatarId: editAvatarId
            } : null);
            setIsEditing(false);
            invalidateCache(`user_${auth.currentUser.uid}`);
            Swal.fire('Success', 'Profile updated!', 'success');
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
        { level: 1, label: "Beginner" },
        { level: 2, label: "Apprentice" },
        { level: 5, label: "Warrior" },
        { level: 10, label: "Master" },
        { level: 15, label: "Leader" },
        { level: 20, label: "Chief" },
        { level: 25, label: "King/Queen" },
        { level: 30, label: "Guardian" },
        { level: 40, label: "Supreme" },
        { level: 50, label: "Legendary" }
    ];

    return (
        <div className="bg-white min-vh-100 py-5">
            <div className="container" style={{ maxWidth: '850px' }}>

                {/* PROFILE HEADER & SETTINGS */}
                <header className={`mb-5 pb-5 border-bottom transition-all ${isEditing ? 'bg-light p-4 rounded-4 border-warning shadow-sm' : ''}`}>
                    <div className="d-flex flex-column flex-md-row align-items-center gap-4 text-center text-md-start">
                        <div className="position-relative">
                            <AvatarDisplay
                                avatarId={userData?.avatarId || 'adventurer'}
                                seed={userData?.username || 'learner'}
                                size={100}
                                className="shadow-sm border-dark"
                                style={{ borderWidth: '3px' }}
                            />
                            {isEditing && (
                                <div className="position-absolute bottom-0 end-0 bg-dark text-white rounded-circle d-flex align-items-center justify-content-center shadow" style={{ width: 32, height: 32, border: '2px solid white' }}>
                                    <Camera size={16} />
                                </div>
                            )}
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

                            <div className="d-flex gap-2 flex-wrap justify-content-center justify-content-md-start mb-3">
                                {!isEditing && (
                                    <>
                                        {auth.currentUser?.isAnonymous ? (
                                            <div className="d-flex align-items-center px-4 py-2 bg-light border rounded-pill shadow-sm">
                                                <div className="bg-secondary rounded-circle me-2 animate-pulse" style={{ width: 8, height: 8 }}></div>
                                                <span className="small fw-bold text-muted ls-1 uppercase">Guest Account</span>
                                            </div>
                                        ) : (
                                            <button onClick={() => setIsEditing(true)} className="btn btn-dark btn-sm px-4 py-2 fw-bold ls-1 rounded-pill shadow-sm d-flex align-items-center gap-2">
                                                <Edit3 size={16} /> EDIT PROFILE
                                            </button>
                                        )}
                                        {window.innerWidth >= 768 && (
                                            <button
                                                onClick={async () => {
                                                    const userRef = doc(db, "users", auth.currentUser!.uid);
                                                    await updateDoc(userRef, { tourCompleted: false });
                                                    sessionStorage.removeItem('tour_offered');
                                                    window.location.href = '/';
                                                }}
                                                className="btn btn-outline-warning btn-sm px-4 py-2 fw-bold ls-1 rounded-pill shadow-sm text-dark d-flex align-items-center gap-2"
                                            >
                                                <Compass size={16} /> RESTART TOUR
                                            </button>
                                        )}
                                    </>
                                )}

                                {isEditing && (
                                    <button
                                        type="button"
                                        onClick={(e) => handleUpdate(e as any)}
                                        className="btn btn-primary btn-sm px-4 py-2 fw-bold ls-1 rounded-pill shadow-sm d-flex align-items-center gap-2"
                                        disabled={updateLoading}
                                    >
                                        {updateLoading ? <span className="spinner-border spinner-border-sm"></span> : <><CheckCircle size={16} /> SAVE</>}
                                    </button>
                                )}

                                <button onClick={async () => {
                                    await signOut(auth);
                                    invalidateCache();
                                    navigate('/login');
                                }} className="btn btn-outline-danger btn-sm px-4 py-2 fw-bold ls-1 rounded-pill shadow-sm d-flex align-items-center gap-2">
                                    <LogOut size={16} /> LOGOUT
                                </button>
                            </div>

                            {isEditing && (
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
                                            <p className="smallest fw-bold text-muted mb-3 ls-2 text-uppercase">CHOOSE YOUR STYLE</p>
                                            <AvatarPicker
                                                selectedStyle={editAvatarId}
                                                seed={editUsername || 'warrior'}
                                                onSelect={setEditAvatarId}
                                            />
                                        </div>

                                        <div className="d-flex gap-2 justify-content-center justify-content-md-start mt-2">
                                            <button type="submit" className="btn btn-warning btn-lg px-5 py-3 fw-bold ls-1 rounded-pill shadow" disabled={updateLoading}>
                                                {updateLoading ? (
                                                    <span className="spinner-border spinner-border-sm me-2"></span>
                                                ) : (
                                                    <><CheckCircle size={18} className="me-2" /> SAVE CHANGES</>
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
                            {/* TROPHY CASE */}
                            <div className="mb-5 animate__animated animate__fadeInUp">
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <h5 className="fw-bold mb-0 text-uppercase ls-2 smallest text-muted">Trophy Case</h5>
                                    <span className="smallest fw-bold text-muted">{userData?.trophies?.length || 0} / {ALL_TROPHIES.length} EARNED</span>
                                </div>
                                <div className="row g-3">
                                    {ALL_TROPHIES.map(trophy => {
                                        const isEarned = (userData?.trophies || []).includes(trophy.id);
                                        return (
                                            <div key={trophy.id} className="col-4 col-md-2 text-center">
                                                <div
                                                    className={`p-3 rounded-4 transition-all mb-2 ${isEarned ? 'bg-white shadow-sm border border-warning hover-up' : 'opacity-25 bg-light border-dashed border-2'}`}
                                                    title={trophy.description}
                                                    style={{ cursor: isEarned ? 'pointer' : 'default' }}
                                                    onClick={() => isEarned && Swal.fire({
                                                        title: trophy.title,
                                                        text: trophy.description,
                                                        iconHtml: `<i class="bi ${trophy.icon}"></i>`,
                                                        customClass: { icon: 'border-0', popup: 'rounded-4' },
                                                        confirmButtonColor: '#111827'
                                                    })}
                                                >
                                                    <i className={`bi ${trophy.icon} display-6`} style={{ color: isEarned ? trophy.color : '#999' }}></i>
                                                </div>
                                                <p className={`smallest fw-bold mb-0 text-truncate ${isEarned ? 'text-dark' : 'text-muted'}`}>{trophy.title.split(' (')[0]}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <p className="smallest fw-bold text-warning mb-1 ls-2 text-uppercase">Journey Overview</p>
                            <h2 className="fw-bold mb-0 ls-tight">MY PROGRESS JOURNEY</h2>
                        </div>
                    </div>

                    <div className="row g-4 mb-5">
                        {/* Summary Cards */}
                        <div className="col-6 col-md-3">
                            <div className="p-4 rounded-4 bg-light text-center h-100 shadow-sm border border-white hover-up transition-all">
                                <MessageCircle className="mx-auto mb-2 text-primary" size={32} />
                                <h3 className="fw-bold mb-0">{stats?.wordsCount || 0}</h3>
                                <p className="smallest fw-bold text-muted text-uppercase ls-1">Words Learned</p>
                            </div>
                        </div>
                        <div className="col-6 col-md-3">
                            <div className="p-4 rounded-4 bg-light text-center h-100 shadow-sm border border-white hover-up transition-all">
                                <Book className="mx-auto mb-2 text-success" size={32} />
                                <h3 className="fw-bold mb-0">{stats?.lessonsCount || 0}</h3>
                                <p className="smallest fw-bold text-muted text-uppercase ls-1">Lessons Done</p>
                            </div>
                        </div>
                        <div className="col-6 col-md-3">
                            <div className="p-4 rounded-4 bg-light text-center h-100 shadow-sm border border-white hover-up transition-all">
                                <Flame className="mx-auto mb-2 text-danger" size={32} />
                                <h3 className="fw-bold mb-0">{stats?.streak || 0}</h3>
                                <p className="smallest fw-bold text-muted text-uppercase ls-1">Day Streak</p>
                            </div>
                        </div>
                        <div className="col-6 col-md-3">
                            <div className="p-4 rounded-4 bg-light text-center h-100 shadow-sm border border-white hover-up transition-all">
                                <Gem className="mx-auto mb-2 text-warning" size={32} />
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

                            <p className="small text-muted mb-0 d-flex align-items-center gap-2">
                                <Info size={14} />
                                Earn {levelStats.pointsForNextLevel - levelStats.pointsInCurrentLevel} more LP to reach Level {levelStats.level + 1}
                            </p>
                        </div>
                        <div className="position-absolute end-0 bottom-0 opacity-10 display-1 p-4"><Shield size={120} strokeWidth={1} /></div>
                    </div>

                    {/* MASTERY PATH - High Fidelity Zigzag Map */}
                    <div className="card border-0 shadow-sm rounded-4 p-4 p-md-5 mb-5 bg-white overflow-hidden">
                        <div className="text-center mb-5">
                            <h5 className="fw-bold mb-1 text-uppercase ls-2 smallest text-muted">Venda Mastery Path</h5>
                            <h3 className="fw-bold text-dark">Your Journey to Fluency</h3>
                        </div>

                        <div className="mastery-path position-relative py-5">
                            {/* The connecting path line - Zigzag dynamic path */}
                            <svg className="position-absolute start-0 top-0 w-100 h-100" style={{ zIndex: 0, overflow: 'visible' }}>
                                <path
                                    d={milestones.map((_, idx) => {
                                        const isRightStagger = idx % 2 === 0;
                                        const x = isRightStagger ? '25%' : '75%';
                                        const y = `${(idx * 100) / (milestones.length - 1)}%`;
                                        return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                                    }).reverse().join(' ')}
                                    stroke="url(#pathGradient)"
                                    strokeWidth="6"
                                    strokeDasharray="12 12"
                                    fill="none"
                                    className="path-animation"
                                    strokeLinecap="round"
                                />
                                <defs>
                                    <linearGradient id="pathGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                        <stop offset="0%" stopColor="#FACC15" stopOpacity="1" />
                                        <stop offset="100%" stopColor="#111827" stopOpacity="0.3" />
                                    </linearGradient>
                                </defs>
                            </svg>

                            <div className="d-flex flex-column gap-5 position-relative z-1">
                                {[...milestones].reverse().map((m, idx) => {
                                    const isReached = levelStats.level >= m.level;
                                    const isCurrent = levelStats.level >= m.level && (idx === 0 || levelStats.level < [...milestones].reverse()[idx - 1].level);
                                    const badge = getBadgeDetails(m.level);
                                    const isRight = idx % 2 === 0;

                                    return (
                                        <div key={m.level} className={`path-node d-flex align-items-center justify-content-center w-100 gap-4 ${isReached ? 'reached' : 'locked'} ${isCurrent ? 'current' : ''}`}>
                                            <div className={`node-content d-flex align-items-center gap-3 ${isRight ? 'flex-row' : 'flex-row-reverse text-end'}`} style={{ width: '100%', maxWidth: '500px' }}>

                                                <div className="flex-grow-1 d-none d-md-block" style={{ width: '150px' }}>
                                                    <h6 className={`fw-bold mb-0 ${isReached ? 'text-dark' : 'text-muted'}`}>{badge.name}</h6>
                                                    <span className="smallest text-muted uppercase ls-1">{m.label}</span>
                                                </div>

                                                <div className="node-icon-wrapper position-relative">
                                                    <div className={`milestone-circle shadow-lg d-flex align-items-center justify-content-center rounded-circle transition-all ${isReached ? 'heartbeat-sm' : ''}`}
                                                        style={{
                                                            width: isCurrent ? '85px' : '70px',
                                                            height: isCurrent ? '85px' : '70px',
                                                            backgroundColor: isReached ? badge.color : '#f1f5f9',
                                                            border: isCurrent ? `4px solid #111827` : isReached ? `2px solid white` : '2px dashed #cbd5e1',
                                                            fontSize: isCurrent ? '1.8rem' : '1.5rem',
                                                            color: isReached ? 'white' : '#94a3b8',
                                                            zIndex: isCurrent ? 10 : 1,
                                                            boxShadow: isCurrent ? `0 0 20px ${badge.color}66` : 'none'
                                                        }}>
                                                        <i className={`bi ${badge.icon}`}></i>
                                                    </div>
                                                    {isReached && !isCurrent && (
                                                        <div className="position-absolute top-0 end-0 bg-success text-white rounded-circle d-flex align-items-center justify-content-center shadow-sm" style={{ width: 22, height: 22, border: '2px solid white' }}>
                                                            <CheckCircle size={12} fill="currentColor" />
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex-grow-1" style={{ width: '150px' }}>
                                                    <span className="smallest fw-bold text-muted ls-1 uppercase d-block">LEVEL {m.level}</span>
                                                    {isReached ? (
                                                        <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill smallest px-2">UNLOCKED</span>
                                                    ) : (
                                                        <span className="badge bg-light text-muted border border-light-subtle rounded-pill smallest px-2">LOCKED</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* STREAK CALENDAR & FREEZES MOVED TO A MORE PROMINENT SPOT WITHIN LEARNING PATH OR AFTER */}
                        <div className="mt-5 pt-5 border-top">
                            <StreakCalendar
                                activityHistory={userData?.activityHistory || []}
                                streakFreezes={userData?.streakFreezes || 0}
                                points={userData?.points || 0}
                                onBuyFreeze={handleBuyFreeze}
                            />
                        </div>
                    </div>
                </section>

                {/* REFERRAL / INVITE SECTION */}
                <section className="bg-dark text-white p-5 rounded-4 position-relative overflow-hidden shadow-lg mb-5">
                    <div className="position-relative z-1">
                        <p className="smallest fw-bold ls-2 text-uppercase mb-2" style={{ color: '#FACC15' }}>Referral Rewards</p>
                        <h2 className="fw-bold mb-3">Invite & Earn 500 LP</h2>
                        <p className="small opacity-75 mb-4 pe-lg-5">
                            Ramba vhangana vhavho! Spread the language. You'll receive 500 Learning Points for every warrior who joins through your link.
                        </p>

                        {unclaimedInvites.length > 0 && (
                            <div className="mb-4 animate__animated animate__pulse animate__infinite">
                                <button
                                    onClick={handleClaimRewards}
                                    disabled={claimLoading}
                                    className="btn btn-warning w-100 py-3 fw-bold ls-1 shadow-lg text-dark d-flex align-items-center justify-content-center gap-2"
                                    style={{ border: '2px solid #000' }}
                                >
                                    {claimLoading ? 'CLAIMING...' : <><Gift size={20} /> CLAIM {unclaimedInvites.length * 500} LP REWARDS</>}
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
                    <div className="position-absolute top-0 end-0 opacity-10 display-1 p-4"><Users size={120} strokeWidth={1} /></div>
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

                .heartbeat-sm {
                    animation: heartbeat-sm 2s infinite ease-in-out;
                }

                @keyframes heartbeat-sm {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                    100% { transform: scale(1); }
                }

                .path-node.current .milestone-circle {
                    animation: current-glow 2s infinite alternate;
                    z-index: 10;
                }

                @keyframes current-glow {
                    from { transform: scale(1); box-shadow: 0 0 10px rgba(0,0,0,0.1); }
                    to { transform: scale(1.1); box-shadow: 0 0 25px currentColor; }
                }

                .bg-success-subtle { background-color: #dcfce7 !important; }
                .text-success { color: #166534 !important; }
                .border-success-subtle { border-color: #bbf7d0 !important; }

                .mastery-path {
                    max-width: 600px;
                    margin: 0 auto;
                }

                .path-node {
                    transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
                }

                .path-node.locked {
                    filter: saturate(0.5);
                    opacity: 0.7;
                }

                .path-animation {
                    stroke-dashoffset: 1000;
                    animation: dash 60s linear infinite;
                }

                @keyframes dash {
                    to { stroke-dashoffset: 0; }
                }
            `}</style>
        </div>
    );
};

export default Profile;



