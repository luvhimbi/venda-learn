import React, { useEffect, useState } from 'react';
import { db, auth } from '../../services/firebaseConfig';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Compass, LogOut, Camera, Share2, MoreVertical, Settings, Trophy } from 'lucide-react';
import LogoutModal from '../../components/feedback/modals/LogoutModal';
import ShareProfileModal from '../../components/feedback/modals/ShareProfileModal';
import ShareStreakModal from '../../components/feedback/modals/ShareStreakModal';
import { AvatarDisplay } from '../../features/avatar/components/AvatarPicker';
import { invalidateCache, fetchUserData } from '../../services/dataCache';
import ReviewModal from '../../components/feedback/modals/ReviewModal';
import AvatarBuilder from '../../features/avatar/components/AvatarBuilder';
import AvatarPicker from '../../features/avatar/components/AvatarPicker';
import WeeklyActivityGraph from '../../features/gamification/components/WeeklyActivityGraph';

import Swal from 'sweetalert2';
import { useNavigate } from "react-router-dom";

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
    dailyXP?: Record<string, number>;
    frozenDays?: string[];
    reminderEnabled?: boolean;
    reminderTime?: string;
    soundEnabled?: boolean;
    hapticEnabled?: boolean;
    lastLessonId?: string;
    createdAt?: string;
}

const Profile: React.FC = () => {
    const [userData, setUserData] = useState<any>(null);
    const [currentLessonTitle, setCurrentLessonTitle] = useState<string | null>(null);
    const [showLogout, setShowLogout] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [isShareStreakOpen, setIsShareStreakOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [updateLoading, setUpdateLoading] = useState(false);
    const [editUsername, setEditUsername] = useState('');
    const [editAvatarId, setEditAvatarId] = useState('adventurer');
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [showCustomBuilder, setShowCustomBuilder] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                const data = await fetchUserData();

                if (data) {
                    const profile = data as UserProfile;
                    const normalizedProfile = {
                        ...profile,
                        points: Number(profile.points) || 0
                    };
                    setUserData(normalizedProfile);
                    setEditUsername(profile.username || '');
                    setEditAvatarId(profile.avatarId || 'adventurer');

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
                }
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

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



    const handleLogout = async () => {
        try {
            await auth.signOut();
            navigate('/login');
        } catch (error) {
            Swal.fire('Error', 'Sign out failed', 'error');
        }
    };



    if (loading) return (
        <div className="min-vh-100 bg-theme-base d-flex justify-content-center align-items-center">
            <div className="spinner-border" style={{ color: '#FACC15' }}></div>
        </div>
    );

    return (
        <div className="bg-theme-base min-vh-100 py-5" style={{ background: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23888888\' fill-opacity=\'0.03\' fill-rule=\'evenodd\'%3E%3Ccircle cx=\'3\' cy=\'3\' r=\'1\'/%3E%3C/g%3E%3C/svg%3E")' }}>
            <div className="container" style={{ maxWidth: '900px' }}>

                {/* PROFILE HEADER */}
                <header className={`mb-5 p-3 p-md-4 brutalist-card transition-all ${isEditing ? 'border-warning shadow-action-light' : ''}`} style={{ overflow: 'visible' }}>
                    <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-4">

                        {/* LEFT COMPONENT - Avatar & Identity */}
                        <div className="d-flex flex-column flex-md-row align-items-center gap-3 gap-md-4 text-center text-md-start">
                            <div className="position-relative">
                                <AvatarDisplay
                                    avatarId={userData?.avatarId || 'adventurer'}
                                    seed={userData?.username || 'learner'}
                                    size={110}
                                    className="border-dark"
                                    style={{ borderWidth: '4px', borderStyle: 'solid', borderRadius: '24px' }}
                                />
                                {isEditing && (
                                    <div className="position-absolute bottom-0 end-0 bg-dark text-white rounded-circle d-flex align-items-center justify-content-center shadow" style={{ width: 32, height: 32, border: '2px solid white' }}>
                                        <Camera size={16} />
                                    </div>
                                )}
                            </div>
                            <div>
                                <p className="fw-black text-theme-main mb-1 ls-tight uppercase" style={{ fontSize: '1.25rem' }}>MY PROFILE</p>
                                <p className="small fw-bold text-theme-muted mb-0 ls-1 uppercase">{userData?.email}</p>

                                <div className="d-flex flex-wrap align-items-center justify-content-center gap-2 mt-3">
                                    {userData?.createdAt && (
                                        <div className="d-flex align-items-center gap-2 px-3 py-1 bg-theme-base border border-theme-main border-2 rounded-pill smallest text-theme-muted fw-bold ls-1 uppercase shadow-action-sm">
                                            <i className="bi bi-calendar-check text-theme-main"></i>
                                            Joined {new Date(userData.createdAt).toLocaleString('default', { month: 'long', year: 'numeric' })}
                                        </div>
                                    )}
                                    {currentLessonTitle && (
                                        <div className="d-flex align-items-center gap-1 px-3 py-1 bg-warning text-dark border border-dark border-2 rounded-pill fw-black ls-1 uppercase shadow-action-sm" style={{ fontSize: '10px' }}>
                                            <i className="bi bi-zap-fill text-dark" style={{ fontSize: '12px' }}></i>
                                            LEARNING: {currentLessonTitle}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COMPONENT - Actions */}
                        <div className="d-flex align-items-center justify-content-center justify-content-md-end gap-2 w-auto mt-3 mt-md-0">
                            {!isEditing && (
                                <>
                                    {auth.currentUser?.isAnonymous ? (
                                        <div className="d-flex align-items-center px-3 py-1.5 bg-light border rounded-pill shadow-sm">
                                            <div className="bg-secondary rounded-circle me-2 animate-pulse" style={{ width: 8, height: 8 }}></div>
                                            <span className="small fw-bold text-muted ls-1 uppercase" style={{ fontSize: '10px' }}>Guest Account</span>
                                        </div>
                                    ) : (
                                        <button onClick={() => setIsEditing(true)} className="btn btn-game btn-game-primary px-3 py-1.5 smallest ls-1 fw-black uppercase">
                                            EDIT PROFILE
                                        </button>
                                    )}

                                    <button onClick={() => navigate('/settings')} className="btn btn-game-white brutalist-card--sm rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }} title="Settings">
                                        <Settings size={18} className="text-dark" strokeWidth={3} />
                                    </button>

                                    <div className="dropdown">
                                        <button className="btn btn-game-white brutalist-card--sm rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }} data-bs-toggle="dropdown" aria-expanded="false">
                                            <MoreVertical size={18} className="text-dark" strokeWidth={3} />
                                        </button>
                                        <ul className="dropdown-menu dropdown-menu-end shadow-action-sm border border-theme-main border-3 rounded-3 mt-2 py-2 overflow-hidden bg-theme-surface" style={{ minWidth: '200px' }}>
                                            <li className="d-none d-md-block">
                                                <button
                                                    onClick={async () => {
                                                        const userRef = doc(db, "users", auth.currentUser!.uid);
                                                        await updateDoc(userRef, { tourCompleted: false });
                                                        sessionStorage.removeItem('tour_offered');
                                                        window.location.href = '/';
                                                    }}
                                                    className="dropdown-item d-flex align-items-center gap-3 py-3 fw-black text-theme-main uppercase ls-1 smallest hover-bg-warning"
                                                >
                                                    <Compass size={18} className="text-theme-main" strokeWidth={3} /> Restart Tour
                                                </button>
                                            </li>
                                            <li>
                                                <button onClick={() => setIsShareModalOpen(true)} className="dropdown-item d-flex align-items-center gap-3 py-3 fw-black text-theme-main uppercase ls-1 smallest hover-bg-warning">
                                                    <Share2 size={18} className="text-theme-main" strokeWidth={3} /> Share Profile
                                                </button>
                                            </li>
                                            <li><hr className="dropdown-divider border-theme-soft opacity-100 border-1 my-0" /></li>
                                            <li>
                                                <button onClick={() => setShowLogout(true)} className="dropdown-item d-flex align-items-center gap-3 py-3 fw-black text-danger uppercase ls-1 smallest hover-bg-danger-subtle">
                                                    <LogOut size={18} strokeWidth={3} /> Logout
                                                </button>
                                            </li>
                                        </ul>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* EDIT FORM */}
                    {isEditing && (
                        <div className="mt-4 pt-4 border-top">
                            <form onSubmit={handleUpdate} className="animate__animated animate__fadeIn">
                                <div className="d-flex flex-column gap-4">
                                        <label className="small fw-black text-theme-main ls-1 mb-2 uppercase">Display Name</label>
                                        <div className="custom-input-group--brutalist w-100 border-theme-main" style={{ maxWidth: '400px' }}>
                                            <input
                                                type="text"
                                                className="bg-transparent border-0 w-100 px-4 py-3 fw-black text-theme-main"
                                                style={{ outline: 'none', fontSize: '1.1rem' }}
                                                value={editUsername}
                                                onChange={(e) => setEditUsername(e.target.value)}
                                                required
                                            />
                                        </div>

                                    <div className="p-4 brutalist-card shadow-action-light bg-theme-card">
                                        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center mb-4 gap-3">
                                            <p className="small fw-black text-theme-main mb-0 ls-1 text-uppercase">Choose Character</p>
                                            <button 
                                                type="button" 
                                                onClick={() => setShowCustomBuilder(true)}
                                                className="btn btn-game btn-game-primary smallest ls-1 fw-black uppercase"
                                            >
                                                <i className="bi bi-palette-fill me-2"></i> CUSTOM BUILDER
                                            </button>
                                        </div>
                                        <AvatarPicker
                                            selectedStyle={editAvatarId}
                                            seed={editUsername || 'warrior'}
                                            onSelect={setEditAvatarId}
                                        />
                                    </div>

                                    <div className="d-flex gap-3 mt-3">
                                        <button type="submit" className="btn btn-game btn-game-primary px-4 py-2 smallest ls-1 fw-black uppercase" disabled={updateLoading}>
                                            {updateLoading ? (
                                                <span className="spinner-border spinner-border-sm me-2"></span>
                                            ) : (
                                                'SAVE'
                                            )}
                                        </button>
                                        <button type="button" onClick={() => setIsEditing(false)} className="btn btn-game btn-game-white px-3 py-1.5 smallest ls-1 fw-black uppercase">
                                            CANCEL
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    )}
                </header>

                <div className="animate__animated animate__fadeIn">

                    <div className="row g-4 mt-2">
                        <div className={`col-12 ${(userData?.weeklyXP || 0) > 0 ? 'col-md-7' : ''}`}>
                             <WeeklyActivityGraph dailyXP={userData?.dailyXP || {}} />
                        </div>
                        {(userData?.weeklyXP || 0) > 0 && (
                            <div className="col-12 col-md-5">
                                <div className="brutalist-card p-4 transition-all h-100 bg-theme-surface border-4" style={{ borderColor: 'var(--venda-yellow)' }}>
                                    <div className="d-flex align-items-center justify-content-between mb-4">
                                        <h4 className="fw-black text-theme-main mb-0 uppercase ls-tight" style={{ fontSize: '1.25rem' }}>Weekly Tribe</h4>
                                        <Trophy size={20} className="text-warning" />
                                    </div>

                                    <div className="text-center py-3">
                                        <div className="display-4 fw-black text-theme-main mb-1">{userData?.weeklyXP?.toLocaleString()}</div>
                                        <p className="smallest fw-black text-theme-muted ls-2 uppercase">Points Earned This Week</p>
                                        <div className="mt-4">
                                            <button onClick={() => navigate('/muvhigo')} className="btn btn-game btn-game-primary w-100 py-3 fw-black smallest ls-1 uppercase shadow-action-sm">
                                                VIEW LEADERBOARD
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>


                </div>

                {/* MODALS */}
                {showLogout && <LogoutModal onClose={() => setShowLogout(false)} onConfirm={handleLogout} />}
                {isShareModalOpen && <ShareProfileModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} userData={userData} inviteLink={`${window.location.origin}/register?ref=${auth.currentUser?.uid}`} />}
                {isShareStreakOpen && <ShareStreakModal isOpen={isShareStreakOpen} onClose={() => setIsShareStreakOpen(false)} userData={userData} inviteLink={`${window.location.origin}/register?ref=${auth.currentUser?.uid}`} />}
                {showReviewModal && <ReviewModal username={userData?.username || 'Learner'} onClose={() => setShowReviewModal(false)} />}
                {showCustomBuilder && (
                    <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center z-3 p-3" style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)' }}>
                        <div className="w-100 h-100 brutalist-card p-0 overflow-hidden" style={{ maxWidth: '1000px', maxHeight: '90vh' }}>
                            <AvatarBuilder 
                                onSave={(config) => { 
                                    setEditAvatarId(JSON.stringify(config)); 
                                    setShowCustomBuilder(false); 
                                }} 
                                onCancel={() => setShowCustomBuilder(false)} 
                                initialConfig={editAvatarId.startsWith('{') ? JSON.parse(editAvatarId) : undefined} 
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Profile;








