import React, { useEffect, useState } from 'react';
import { db, auth } from '../../services/firebaseConfig';
import { doc, getDoc, updateDoc, writeBatch, collection, query, where, getDocs, setDoc, increment } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { Gem, Compass, Bell, Flame, CheckCircle, LogOut, Users, Gift, Clock, Camera, Share2, MoreVertical, Shield, ChevronRight, Star, Globe } from 'lucide-react';
import LogoutModal from '../../components/LogoutModal';
import ShareProfileModal from '../../components/ShareProfileModal';
import ShareStreakModal from '../../components/ShareStreakModal';
import { checkAchievements, awardTrophies, ALL_TROPHIES } from '../../services/achievementService';
import TrophyIcon from '../../components/TrophyIcon';
import AvatarPicker, { AvatarDisplay } from '../../components/AvatarPicker';
import StreakCalendar from '../../components/StreakCalendar';
import JuicyButton from '../../components/JuicyButton';
import { invalidateCache, refreshUserData, fetchUserData, fetchLearnedStats, fetchLanguages } from '../../services/dataCache';
import ReviewModal from '../../components/ReviewModal';
import AvatarBuilder from '../../components/AvatarBuilder';

import { updateReminderSettings, requestNotificationPermission, getUserTokens } from '../../services/reminderService';
import Swal from 'sweetalert2';
import { useNavigate, Link } from "react-router-dom";

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
    frozenDays?: string[];
    reminderEnabled?: boolean;
    reminderTime?: string;
    soundEnabled?: boolean;
    hapticEnabled?: boolean;
    lastLessonId?: string;
    createdAt?: string;
}

// LearnedStats type removed as it was unused

const Profile: React.FC = () => {
    const [userData, setUserData] = useState<any>(null);
    const [currentLessonTitle, setCurrentLessonTitle] = useState<string | null>(null);
    const [showLogout, setShowLogout] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [isShareStreakOpen, setIsShareStreakOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [updateLoading, setUpdateLoading] = useState(false);
    const [claimLoading, setClaimLoading] = useState(false);
    const [editUsername, setEditUsername] = useState('');
    const [editAvatarId, setEditAvatarId] = useState('adventurer');
    const [unclaimedInvites, setUnclaimedInvites] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'overview' | 'gear'>('overview');
    const [reminderEnabled, setReminderEnabled] = useState(false);
    const [reminderTime, setReminderTime] = useState('09:00');
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [hapticEnabled, setHapticEnabled] = useState(true);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [showCustomBuilder, setShowCustomBuilder] = useState(false);
    const [languages, setLanguages] = useState<any[]>([]);
    const navigate = useNavigate();
    const inviteLink = `${window.location.origin}/register?ref=${auth.currentUser?.uid}`;

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                const [data, learnedStats, langsData] = await Promise.all([
                    fetchUserData(),
                    fetchLearnedStats(),
                    fetchLanguages()
                ]);

                if (langsData) setLanguages(langsData);

                if (data) {
                    const profile = data as UserProfile;
                    const normalizedProfile = {
                        ...profile,
                        points: Number(profile.points) || 0,
                        trophies: profile.trophies || []
                    };
                    setUserData(normalizedProfile);
                    setEditUsername(profile.username || '');
                    setEditAvatarId(profile.avatarId || 'adventurer');

                    // Default states for inputs
                    setReminderEnabled(profile.reminderEnabled ?? false);
                    setReminderTime(profile.reminderTime || '18:00');
                    setSoundEnabled(profile.soundEnabled ?? true);
                    setHapticEnabled(profile.hapticEnabled ?? true);

                    // Fetch the active lesson if they have one
                    if (profile.lastLessonId) {
                        try {
                            const lessonSnap = await getDoc(doc(db, "lessons", profile.lastLessonId));
                            if (lessonSnap.exists()) {
                                setCurrentLessonTitle(lessonSnap.data().title);
                            }
                        } catch (e) {
                            console.error("Could not fetch current lesson", e);
                        }
                    }

                    // Check for new achievements (including 1st Login)
                    const newTrophies = checkAchievements(normalizedProfile, profile.trophies || []);
                    if (newTrophies.length > 0) {
                        const newIds = newTrophies.map(t => t.id);
                        await awardTrophies(user.uid, newIds);

                        // Update local state
                        setUserData((prev: UserProfile | null) => prev ? {
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
                    // setStats(learnedStats);
                }
            }
            setLoading(false);
        });

        return () => {
            unsubscribe();
        };
    }, []);

    const handleCopyLink = () => {
        navigator.clipboard.writeText(inviteLink);
        Swal.fire({
            title: 'Copy!',
            text: 'Invite link copied to clipboard.',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false,
            customClass: { popup: 'rounded-4' }
        });
    };

    const handleBuyFreeze = async () => {
        if (!userData) return;

        if (userData.streak === 0) {
            Swal.fire({
                title: 'No Active Streak!',
                text: 'You need an active streak to protect before you can buy a freeze.',
                icon: 'info',
                confirmButtonColor: '#FACC15',
                customClass: { popup: 'rounded-4' }
            });
            return;
        }

        if (userData.points < 100) {
            Swal.fire({
                title: 'Insufficient XP!',
                text: 'You need 100 XP points to buy a streak freeze.',
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

            setUserData((prev: UserProfile | null) => prev ? {
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
                avatarId: editAvatarId,
                soundEnabled: soundEnabled,
                hapticEnabled: hapticEnabled
            }, { merge: true });

            setUserData((prev: UserProfile | null) => prev ? {
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

    const handleLanguageChange = async (langId: string) => {
        if (!auth.currentUser) return;
        try {
            const userRef = doc(db, "users", auth.currentUser.uid);
            await updateDoc(userRef, { preferredLanguageId: langId });
            setUserData((prev: any) => ({ ...prev, preferredLanguageId: langId }));
            invalidateCache(`user_${auth.currentUser.uid}`);
            Swal.fire({
                title: 'Language Updated!',
                text: `Target language changed.`,
                icon: 'success',
                toast: true,
                position: 'top-end',
                timer: 3000,
                showConfirmButton: false
            });
        } catch (e) {
            Swal.fire('Error', 'Failed to update language.', 'error');
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
                text: `You claimed ${totalReward} XP rewards!`,
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

    return (
        <div className="bg-white min-vh-100 py-5">
            <div className="container" style={{ maxWidth: '850px' }}>

                {/* PROFILE HEADER & SETTINGS */}
                <header className={`mb-5 pb-4 border-bottom transition-all ${isEditing ? 'bg-light p-4 rounded-4 border-warning shadow-sm' : ''}`}>
                    <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-4">

                        {/* LEFT COMPONENT - Avatar & Identity */}
                        <div className="d-flex flex-column flex-md-row align-items-center gap-3 gap-md-4 text-center text-md-start">
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
                            <div>
                                <div className="d-flex flex-wrap align-items-center justify-content-center justify-content-md-start gap-2 mb-1">
                                    <h1 className="fw-bold mb-0 text-black ls-tight" style={{ fontSize: '1.75rem' }}>{userData?.username}</h1>
                                    {/*{userData?.isNativeSpeaker && (*/}
                                    {/*    <span className="badge bg-success text-white smallest fw-bold ls-1 rounded-pill px-2 py-1">*/}
                                    {/*        <i className="bi bi-patch-check-fill me-1"></i> VERIFIED*/}
                                    {/*    </span>*/}
                                    {/*)}*/}
                                    {/*{userData?.nativeVerificationStatus === 'pending' && (*/}
                                    {/*    <span className="badge bg-warning text-dark smallest fw-bold ls-1 rounded-pill px-2 py-1">PENDING</span>*/}
                                    {/*)}*/}
                                    {/*{userData?.nativeVerificationStatus === 'rejected' && (*/}
                                    {/*    <span className="badge bg-danger text-white smallest fw-bold ls-1 rounded-pill px-2 py-1">REJECTED</span>*/}
                                    {/*)}*/}
                                </div>
                                <p className="small text-muted mb-0">{userData?.email}</p>

                                {/* JOIN DATE & CURRENT LESSON BADGES */}
                                <div className="d-flex flex-wrap align-items-center justify-content-center gap-2 mt-3">
                                    {userData?.createdAt && (
                                        <div className="d-flex align-items-center gap-2 px-3 py-1 bg-light border rounded-pill smallest text-muted fw-bold ls-1 uppercase">
                                            <i className="bi bi-calendar-check"></i>
                                            Joined {new Date(userData.createdAt).toLocaleString('default', { month: 'long', year: 'numeric' })}
                                        </div>
                                    )}
                                    {currentLessonTitle && (
                                        <div className="d-flex align-items-center gap-1 px-2 py-0.5 bg-warning bg-opacity-10 text-dark border border-warning border-opacity-50 rounded-pill fw-bold ls-1 uppercase" style={{ fontSize: '9px' }}>
                                            <i className="bi bi-book text-warning" style={{ fontSize: '10px' }}></i>
                                            LEARNING: {currentLessonTitle}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COMPONENT - Actions */}
                        <div className="d-flex align-items-center justify-content-center justify-content-md-end gap-2 w-100 w-md-auto mt-3 mt-md-0">
                            {!isEditing && (
                                <>
                                    {auth.currentUser?.isAnonymous ? (
                                        <div className="d-flex align-items-center px-4 py-2 bg-light border rounded-pill shadow-sm">
                                            <div className="bg-secondary rounded-circle me-2 animate-pulse" style={{ width: 8, height: 8 }}></div>
                                            <span className="small fw-bold text-muted ls-1 uppercase">Guest Account</span>
                                        </div>
                                    ) : (
                                        <button onClick={() => setIsEditing(true)} className="btn btn-primary px-4 py-2 fw-bold ls-1 rounded-pill shadow-sm d-flex align-items-center gap-2 text-white border-0">
                                            Edit Profile
                                        </button>
                                    )}

                                    <div className="dropdown">
                                        <button className="btn btn-light rounded-circle shadow-sm border border-light-subtle d-flex align-items-center justify-content-center" style={{ width: '42px', height: '42px' }} data-bs-toggle="dropdown" aria-expanded="false">
                                            <MoreVertical size={18} className="text-secondary" />
                                        </button>
                                        <ul className="dropdown-menu dropdown-menu-end shadow border-0 rounded-4 mt-2 py-2" style={{ minWidth: '200px' }}>
                                            <li className="d-none d-md-block">
                                                <button
                                                    onClick={async () => {
                                                        const userRef = doc(db, "users", auth.currentUser!.uid);
                                                        await updateDoc(userRef, { tourCompleted: false });
                                                        sessionStorage.removeItem('tour_offered');
                                                        window.location.href = '/';
                                                    }}
                                                    className="dropdown-item d-flex align-items-center gap-3 py-2 fw-medium text-dark"
                                                >
                                                    <Compass size={16} className="text-muted" /> Restart Tour
                                                </button>
                                            </li>
                                            <li>
                                                <button onClick={() => setIsShareModalOpen(true)} className="dropdown-item d-flex align-items-center gap-3 py-2 fw-medium text-dark">
                                                    <Share2 size={16} className="text-primary" /> Share Profile
                                                </button>
                                            </li>
                                            <li><hr className="dropdown-divider opacity-10" /></li>
                                            <li>
                                                <button onClick={() => setShowLogout(true)} className="dropdown-item d-flex align-items-center gap-3 py-2 fw-medium text-danger">
                                                    <LogOut size={16} /> Logout
                                                </button>
                                            </li>
                                        </ul>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* EDIT FORM - Placed underneath */}
                    {isEditing && (
                        <div className="mt-4 pt-4 border-top">
                            <form onSubmit={handleUpdate} className="animate__animated animate__fadeIn">
                                <div className="d-flex flex-column gap-4">
                                    <div className="d-flex flex-column">
                                        <label className="small fw-bold text-muted ls-1 mb-2">Display Name</label>
                                        <input
                                            type="text"
                                            className="form-control form-control-lg border border-light-subtle bg-white py-2 px-3 rounded-4 shadow-sm fw-bold"
                                            style={{ maxWidth: '300px' }}
                                            value={editUsername}
                                            onChange={(e) => setEditUsername(e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div className="p-4 rounded-4 bg-white border border-light-subtle shadow-sm flex-grow-1" style={{ maxWidth: '500px' }}>
                                        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center mb-3 gap-2">
                                            <p className="small fw-bold text-muted mb-0 ls-1 text-uppercase">Choose Style</p>
                                            <button 
                                                type="button" 
                                                onClick={() => setShowCustomBuilder(true)}
                                                className="btn btn-sm btn-dark text-warning fw-bold rounded-pill shadow-sm ls-1 px-3 py-2 d-flex align-items-center gap-2"
                                            >
                                                <i className="bi bi-palette"></i> BUILD CUSTOM AVATAR
                                            </button>
                                        </div>
                                        <AvatarPicker
                                            selectedStyle={editAvatarId}
                                            seed={editUsername || 'warrior'}
                                            onSelect={setEditAvatarId}
                                        />
                                        {editAvatarId.startsWith('{') && (
                                            <div className="mt-3 p-3 bg-light rounded-3 border d-flex align-items-center gap-3">
                                                 <div className="bg-success rounded-circle" style={{ width: 12, height: 12 }}></div>
                                                 <div>
                                                     <p className="small fw-bold text-dark mb-0">Custom Avatar Base</p>
                                                     <p className="smallest text-muted mb-0">Your uniquely crafted character applies here.</p>
                                                 </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="d-flex gap-2 mt-2">
                                        <JuicyButton type="submit" className="btn btn-primary px-5 py-3 fw-bold ls-1 rounded-pill shadow" disabled={updateLoading}>
                                            {updateLoading ? (
                                                <span className="spinner-border spinner-border-sm me-2"></span>
                                            ) : (
                                                <><CheckCircle size={18} className="me-2" /> SAVE CHANGES</>
                                            )}
                                        </JuicyButton>
                                        <button type="button" onClick={() => setIsEditing(false)} className="btn btn-light px-4 py-3 fw-bold ls-1 border border-light-subtle rounded-pill">
                                            CANCEL
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    )}
                </header>

                {/* TABS NAVIGATION */}
                <div className="d-flex justify-content-center mb-4 mb-md-5 tour-profile-tabs">
                    <div className="nav nav-pills bg-light p-1 rounded-pill shadow-sm border border-white flex-nowrap overflow-auto hide-scrollbar" style={{ maxWidth: '100%' }}>
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`nav-link rounded-pill px-4 px-sm-5 py-2 fw-bold ls-1 smallest d-flex align-items-center justify-content-center transition-all ${activeTab === 'overview' ? 'bg-dark text-white active shadow-sm' : 'text-muted'}`}
                            style={{ minWidth: 'fit-content' }}
                        >
                            <Gem size={14} className="me-2" /> PROGRESS
                        </button>
                        <button
                            onClick={() => setActiveTab('gear')}
                            className={`nav-link rounded-pill px-4 px-sm-5 py-2 fw-bold ls-1 smallest d-flex align-items-center justify-content-center transition-all tour-gear-tab ${activeTab === 'gear' ? 'bg-dark text-white active shadow-sm' : 'text-muted'}`}
                            style={{ minWidth: 'fit-content' }}
                        >
                            <Bell size={14} className="me-2" /> SETTINGS
                        </button>
                    </div>
                </div>

                {activeTab === 'overview' && (
                    <div className="animate__animated animate__fadeIn">
                        {/* MY PROGRESS JOURNEY SECTION */}
                        <section className="mb-5">
                            <div className="d-flex justify-content-between align-items-end mb-4">
                                <div className="w-100">
                                    {/* TROPHY CASE */}
                                    <div className="mb-5">
                                        <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-4 text-center text-md-start gap-3">
                                            <div>
                                                <h5 className="fw-bold mb-0 text-uppercase ls-2 smallest text-muted">Trophy Case</h5>
                                                <h4 className="fw-bold text-dark mt-1">ACHIEVEMENTS</h4>
                                            </div>
                                            <button
                                                onClick={() => navigate('/achievements')}
                                                className="btn btn-link text-warning fw-bold smallest text-uppercase ls-1 p-0 text-decoration-none"
                                            >
                                                View All <i className="bi bi-arrow-right ms-1"></i>
                                            </button>
                                        </div>
                                        <div className="d-flex flex-wrap justify-content-center justify-content-md-center gap-3 gap-md-4">
                                            {[...ALL_TROPHIES]
                                                .sort((a, b) => {
                                                    const aEarned = (userData?.trophies || []).includes(a.id);
                                                    const bEarned = (userData?.trophies || []).includes(b.id);
                                                    if (aEarned && !bEarned) return -1;
                                                    if (!aEarned && bEarned) return 1;
                                                    return 0;
                                                })
                                                .slice(0, 3)
                                                .map(trophy => {
                                                    const isEarned = (userData?.trophies || []).includes(trophy.id);
                                                    return (
                                                        <div key={trophy.id} style={{ width: '100px' }}>
                                                            <div
                                                                className="d-flex flex-column align-items-center gap-2 w-100"
                                                                title={trophy.description}
                                                                style={{
                                                                    cursor: 'pointer',
                                                                    opacity: isEarned ? 1 : 0.5,
                                                                    filter: isEarned ? 'none' : 'grayscale(1)'
                                                                }}
                                                                onClick={() => navigate('/achievements')}
                                                            >
                                                                <div className={`p-3 rounded-4 w-100 d-flex justify-content-center transition-all ${isEarned ? 'bg-white shadow-sm border border-warning' : 'bg-white border'}`}>
                                                                    <TrophyIcon
                                                                        rarity={trophy.rarity as any}
                                                                        size={56}
                                                                        animate={isEarned}
                                                                        color={trophy.color}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                        </div>
                                    </div>

                                </div>
                            </div>



                            {/* DAILY ACTIVITY LOG (Moved from Mastery) */}
                            <div className="mt-5">
                                <StreakCalendar
                                    activityHistory={userData?.activityHistory || []}
                                    frozenDays={userData?.frozenDays || []}
                                    streakFreezes={userData?.streakFreezes || 0}
                                    points={userData?.points || 0}
                                    streak={userData?.streak || 0}
                                    onBuyFreeze={handleBuyFreeze}
                                    onShareClick={() => setIsShareStreakOpen(true)}
                                />
                            </div>
                        </section>
                    </div>
                )}


                {activeTab === 'gear' && (
                    <div className="animate__animated animate__fadeIn">
                        {/* LANGUAGE PREFERENCES */}
                        <section className="mb-4">
                            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white overflow-hidden position-relative mb-4">
                                <div className="d-flex align-items-center gap-2 mb-4">
                                    <div className="bg-primary bg-opacity-10 p-2 rounded-3 text-primary">
                                        <Globe size={20} />
                                    </div>
                                    <h5 className="fw-bold mb-0 text-dark">Target Language</h5>
                                </div>
                                <div className="row g-3">
                                    {languages.map((lang, idx) => (
                                        <div key={lang.id} className="col-6 col-md-4 animate__animated animate__fadeInUp" style={{ animationDelay: `${idx * 0.1}s` }}>
                                            <div
                                                onClick={() => handleLanguageChange(lang.id)}
                                                className={`p-3 rounded-4 border-2 text-center cursor-pointer transition-all h-100 d-flex flex-column justify-content-center hover-up ${userData?.preferredLanguageId === lang.id
                                                        ? 'border-warning bg-white shadow'
                                                        : 'border-light bg-light bg-opacity-50'
                                                    }`}
                                            >
                                                <h6 className={`fw-bold mb-1 ${userData?.preferredLanguageId === lang.id ? 'text-dark' : 'text-secondary'}`}>{lang.name}</h6>
                                                <span className="smallest fw-extrabold ls-1 opacity-50 mb-2">{lang.code.toUpperCase()}</span>
                                                {userData?.preferredLanguageId === lang.id ? (
                                                    <div className="mt-1">
                                                        <span
                                                            className="badge smallest fw-bold ls-1 rounded-pill px-3 py-1 shadow-sm border border-warning"
                                                            style={{
                                                                fontSize: '9px',
                                                                backgroundColor: '#FACC15',
                                                                color: '#000000',
                                                                display: 'inline-block'
                                                            }}
                                                        >
                                                            ACTIVE
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <div style={{ height: '20px' }}></div> // Spacer to maintain uniform height
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>

                        {/* NOTIFICATION PREFERENCES */}
                        <section className="mb-5">
                            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white overflow-hidden position-relative mb-4">
                                <div className="d-flex align-items-center gap-2 mb-4">
                                    <div className="bg-warning bg-opacity-10 p-2 rounded-3 text-warning">
                                        <Bell size={20} />
                                    </div>
                                    <h5 className="fw-bold mb-0 text-dark">Learning Reminders</h5>
                                </div>

                                <div className="row align-items-center g-4">
                                    <div className="col-md-7">
                                        <p className="small text-muted mb-0">
                                            Set a daily reminder to keep your streak alive and make steady progress in your language-learning journey.
                                        </p>
                                    </div>
                                    <div className="col-md-5">
                                        <div className="d-flex flex-column gap-3">
                                            <div className="form-check form-switch d-flex align-items-center gap-3 ps-0 mb-0">
                                                <input
                                                    className="form-check-input ms-0"
                                                    type="checkbox"
                                                    role="switch"
                                                    id="reminderSwitch"
                                                    checked={reminderEnabled}
                                                    onChange={async (e) => {
                                                        const enabled = e.target.checked;
                                                        if (enabled) {
                                                            const granted = await requestNotificationPermission();
                                                            if (!granted) {
                                                                Swal.fire({
                                                                    title: 'Permission Required',
                                                                    text: 'Please enable notifications in your browser to receive reminders.',
                                                                    icon: 'info',
                                                                    confirmButtonColor: '#111827'
                                                                });
                                                                return;
                                                            }
                                                        }
                                                        setReminderEnabled(enabled);
                                                        await updateReminderSettings({
                                                            reminderEnabled: enabled,
                                                            reminderTime
                                                        });
                                                        if (enabled) {
                                                            Swal.fire({
                                                                title: 'Push Alerts Enabled!',
                                                                text: 'You will now receive external notifications for your reminders.',
                                                                icon: 'success',
                                                                toast: true,
                                                                position: 'top-end',
                                                                timer: 3000,
                                                                showConfirmButton: false
                                                            });
                                                        }
                                                    }}
                                                    style={{ width: '45px', height: '24px', cursor: 'pointer' }}
                                                />
                                                <label className="form-check-label small fw-bold text-dark cursor-pointer" htmlFor="reminderSwitch">
                                                    {reminderEnabled ? 'Daily Reminders On' : 'Daily Reminders Off'}
                                                </label>
                                            </div>

                                            {reminderEnabled && (
                                                <div className="d-flex flex-column gap-2 mt-2 animate__animated animate__fadeIn">
                                                    <button
                                                        onClick={async () => {
                                                            if (!('Notification' in window)) return;

                                                            // Local test notification (simulates the look)
                                                            new Notification("Test Notification", {
                                                                body: "This is a test of your pop-up notifications! It works! 🎉",
                                                                icon: '/images/vendalearn.png'
                                                            });

                                                            const tokens = await getUserTokens(auth.currentUser!.uid);
                                                            const latestToken = tokens[tokens.length - 1];

                                                            if (latestToken) {
                                                                Swal.fire({
                                                                    title: 'Test Sent!',
                                                                    html: `
                                                                        <div class="text-start">
                                                                            <p class="small text-muted mb-3">A local pop-up has been triggered. To test a real <b>remote</b> push from Firebase, use your device token below:</p>
                                                                            <div class="p-2 bg-light rounded border smallest fw-mono text-break" style="max-height: 100px; overflow-y: auto;">
                                                                                ${latestToken}
                                                                            </div>
                                                                        </div>
                                                                    `,
                                                                    icon: 'success',
                                                                    showCancelButton: true,
                                                                    confirmButtonText: 'Copy Token',
                                                                    confirmButtonColor: '#FACC15',
                                                                    cancelButtonText: 'Great!',
                                                                }).then((result) => {
                                                                    if (result.isConfirmed) {
                                                                        navigator.clipboard.writeText(latestToken);
                                                                        Swal.fire({ title: 'Copied!', icon: 'success', timer: 1500, showConfirmButton: false });
                                                                    }
                                                                });
                                                            }
                                                        }}
                                                        className="btn btn-outline-warning btn-sm border-2 fw-bold ls-1 smallest rounded-pill py-2"
                                                        style={{ width: 'fit-content' }}
                                                    >
                                                        SEND TEST POP-UP
                                                    </button>
                                                </div>
                                            )}

                                            {reminderEnabled && (
                                                <div className="d-flex align-items-center gap-2 animate__animated animate__fadeIn">
                                                    <div className="bg-light p-2 rounded-3 text-muted">
                                                        <Clock size={16} />
                                                    </div>
                                                    <input
                                                        type="time"
                                                        className="form-control form-control-sm border-0 bg-light p-2 rounded-3 fw-bold"
                                                        style={{ width: '120px' }}
                                                        value={reminderTime}
                                                        onChange={async (e) => {
                                                            const time = e.target.value;
                                                            setReminderTime(time);
                                                            await updateReminderSettings({
                                                                reminderEnabled,
                                                                reminderTime: time
                                                            });
                                                        }}
                                                    />
                                                    <span className="smallest fw-bold text-muted text-uppercase ls-1">Daily</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* AUDIO & TACTILE PREFERENCES */}
                            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white overflow-hidden position-relative mb-4">
                                <div className="d-flex align-items-center gap-2 mb-4">
                                    <div className="bg-primary bg-opacity-10 p-2 rounded-3 text-primary">
                                        <Flame size={20} />
                                    </div>
                                    <h5 className="fw-bold mb-0 text-dark">Audio & Tactile Feedback</h5>
                                </div>

                                <div className="row g-4">
                                    <div className="col-md-6">
                                        <div className="form-check form-switch d-flex align-items-center gap-3 ps-0 mb-3">
                                            <input
                                                className="form-check-input ms-0"
                                                type="checkbox"
                                                role="switch"
                                                id="soundSwitch"
                                                checked={soundEnabled}
                                                onChange={async (e) => {
                                                    const enabled = e.target.checked;
                                                    setSoundEnabled(enabled);
                                                    const userRef = doc(db, "users", auth.currentUser!.uid);
                                                    await updateDoc(userRef, { soundEnabled: enabled });
                                                    invalidateCache(`user_${auth.currentUser!.uid}`);
                                                }}
                                                style={{ width: '45px', height: '24px', cursor: 'pointer' }}
                                            />
                                            <label className="form-check-label small fw-bold text-dark cursor-pointer" htmlFor="soundSwitch">
                                                Sound Effects {soundEnabled ? 'On' : 'Off'}
                                            </label>
                                        </div>
                                        <p className="smallest text-muted mb-0 ps-5 ms-3">Play subtle sounds during navigation and games.</p>
                                    </div>

                                    <div className="col-md-6">
                                        <div className="form-check form-switch d-flex align-items-center gap-3 ps-0 mb-3">
                                            <input
                                                className="form-check-input ms-0"
                                                type="checkbox"
                                                role="switch"
                                                id="hapticSwitch"
                                                checked={hapticEnabled}
                                                onChange={async (e) => {
                                                    const enabled = e.target.checked;
                                                    setHapticEnabled(enabled);
                                                    const userRef = doc(db, "users", auth.currentUser!.uid);
                                                    await updateDoc(userRef, { hapticEnabled: enabled });
                                                    invalidateCache(`user_${auth.currentUser!.uid}`);
                                                }}
                                                style={{ width: '45px', height: '24px', cursor: 'pointer' }}
                                            />
                                            <label className="form-check-label small fw-bold text-dark cursor-pointer" htmlFor="hapticSwitch">
                                                Haptic Feedback {hapticEnabled ? 'On' : 'Off'}
                                            </label>
                                        </div>
                                        <p className="smallest text-muted mb-0 ps-5 ms-3">Feel subtle vibrations on your mobile device.</p>
                                    </div>
                                </div>
                            </div>

                            {/* LEGAL SECTION */}
                            <Link
                                to="/legal"
                                className="card border-0 shadow-sm rounded-4 p-4 bg-white overflow-hidden position-relative mb-4 text-decoration-none hover-up transition-all"
                            >
                                <div className="d-flex align-items-center justify-content-between">
                                    <div className="d-flex align-items-center gap-3">
                                        <div className="bg-primary bg-opacity-10 p-2 rounded-3 text-primary">
                                            <Shield size={20} />
                                        </div>
                                        <div>
                                            <h5 className="fw-bold mb-1 text-dark">Legal & Policies</h5>
                                            <p className="smallest text-muted mb-0">Privacy, Terms, DMCA & POPI Act</p>
                                        </div>
                                    </div>
                                    <ChevronRight size={20} className="text-muted" />
                                </div>
                            </Link>

                            {/* REVIEW / FEEDBACK SECTION */}
                            <button
                                onClick={() => setShowReviewModal(true)}
                                className="w-100 text-start border-0 p-0 bg-transparent mb-4"
                            >
                                <div className="card border-0 shadow-sm rounded-4 p-4 bg-white overflow-hidden position-relative hover-up transition-all">
                                    <div className="d-flex align-items-center justify-content-between">
                                        <div className="d-flex align-items-center gap-3">
                                            <div className="bg-warning bg-opacity-10 p-2 rounded-3 text-warning">
                                                <Star size={20} />
                                            </div>
                                            <div>
                                                <h5 className="fw-bold mb-1 text-dark">Leave a Review</h5>
                                                <p className="smallest text-muted mb-0">Help us improve your South African languages learning journey</p>
                                            </div>
                                        </div>
                                        <ChevronRight size={20} className="text-muted" />
                                    </div>
                                </div>
                            </button>

                            {/* REFERRAL / INVITE SECTION (SHRUNK) */}
                            <div className="bg-dark text-white p-4 rounded-4 position-relative overflow-hidden shadow-lg mb-4">
                                <div className="position-relative z-1">
                                    <div className="d-flex align-items-center gap-2 mb-2">
                                        <div className="bg-primary bg-opacity-20 p-1 rounded-2 text-warning">
                                            <Users size={16} />
                                        </div>
                                        <p className="smallest fw-bold ls-1 text-uppercase mb-0" style={{ color: '#FACC15' }}>Referral Rewards</p>
                                    </div>
                                    <h5 className="fw-bold mb-2">Invite & Earn 500 XP</h5>
                                    <p className="smallest opacity-75 mb-3 pe-lg-5">
                                        Invite friends to learn South African languages and get 500 XP for every learner who joins.
                                    </p>

                                    {unclaimedInvites.length > 0 && (
                                        <div className="mb-3 animate__animated animate__pulse animate__infinite">
                                            <JuicyButton
                                                onClick={handleClaimRewards}
                                                disabled={claimLoading}
                                                className="w-100 py-2 fw-bold smallest ls-1 shadow-lg text-dark d-flex align-items-center justify-content-center gap-2"
                                                style={{ border: '1px solid #000' }}
                                            >
                                                {claimLoading ? 'CLAIMING...' : <><Gift size={16} /> CLAIM {unclaimedInvites.length * 500} XP</>}
                                            </JuicyButton>
                                        </div>
                                    )}

                                    <div className="d-flex flex-column flex-md-row gap-2">
                                        <div className="flex-grow-1 bg-white bg-opacity-10 rounded-2 p-2 smallest text-truncate border border-secondary border-opacity-25 opacity-75">
                                            {inviteLink}
                                        </div>
                                        <JuicyButton className="btn game-btn-primary px-3 py-1 smallest fw-bold ls-1" onClick={handleCopyLink}>
                                            COPY LINK
                                        </JuicyButton>
                                    </div>
                                </div>
                                <div className="position-absolute end-0 bottom-0 opacity-10 p-3"><Users size={60} strokeWidth={1} /></div>
                            </div>
                        </section>
                    </div>
                )}


            </div>

            {/* REVIEW MODAL */}
            {showReviewModal && (
                <ReviewModal
                    username={userData?.username || 'Learner'}
                    onClose={() => setShowReviewModal(false)}
                />
            )}

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


                .path-animation {
                    stroke-dashoffset: 1000;
                    animation: dash 60s linear infinite;
                }

                @keyframes dash {
                    to { stroke-dashoffset: 0; }
                }

                .hide-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .hide-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }

                .active-streak-fire {
                    animation: active-pulse 2s infinite ease-in-out;
                }
                .active-streak-text {
                    text-shadow: 0 0 8px rgba(239, 68, 68, 0.2);
                }
                .fire-shake {
                    display: inline-block !important;
                    animation: fire-shake 0.5s infinite alternate ease-in-out;
                }
                @keyframes active-pulse {
                    0%, 100% { transform: scale(1); box-shadow: 0 0 15px rgba(239, 68, 68, 0.4); }
                    50% { transform: scale(1.05); box-shadow: 0 0 25px rgba(239, 68, 68, 0.6); }
                }
                @keyframes fire-shake {
                    from { transform: rotate(-5deg); }
                    to { transform: rotate(5deg); }
                }
            `}</style>
            {showLogout && (
                <LogoutModal
                    onClose={() => setShowLogout(false)}
                    onConfirm={async () => {
                        await signOut(auth);
                        invalidateCache();
                        navigate('/login');
                    }}
                />
            )}

            <ShareProfileModal
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                userData={userData}
                inviteLink={inviteLink}
            />

            <ShareStreakModal
                isOpen={isShareStreakOpen}
                onClose={() => setIsShareStreakOpen(false)}
                userData={userData}
                inviteLink={inviteLink}
            />

            {/* CUSTOM AVATAR BUILDER MODAL */}
            {showCustomBuilder && (
                <div className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-75" style={{ zIndex: 1055, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backdropFilter: 'blur(5px)' }}>
                     <div className="w-100 bg-white rounded-4 overflow-hidden shadow-lg animate__animated animate__zoomIn" style={{ maxWidth: '1000px' }}>
                        <AvatarBuilder
                             initialConfig={editAvatarId.startsWith('{') ? JSON.parse(editAvatarId) : undefined}
                             onSave={(config) => {
                                 setEditAvatarId(JSON.stringify(config));
                                 setShowCustomBuilder(false);
                             }}
                             onCancel={() => setShowCustomBuilder(false)}
                        />
                     </div>
                </div>
            )}
        </div>
    );
};

export default Profile;



