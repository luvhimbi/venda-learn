import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../services/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { fetchUserData } from '../../services/dataCache';
import { ArrowLeft, Flame, Shield, Trophy } from 'lucide-react';
import Swal from 'sweetalert2';
import StreakCalendar from '../../components/StreakCalendar';
import Mascot from '../../components/Mascot';
import ShareStreakModal from '../../components/ShareStreakModal';

const StreakDetails: React.FC = () => {
    const navigate = useNavigate();
    const [userData, setUserData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                const data = await fetchUserData();
                setUserData(data);
            } else {
                navigate('/login');
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, [navigate]);

    if (loading) return (
        <div className="min-vh-100 bg-theme-base d-flex justify-content-center align-items-center">
            <div className="spinner-border text-warning"></div>
        </div>
    );

    return (
        <div className="bg-theme-base min-vh-100 py-4 py-md-5">
            <div className="container" style={{ maxWidth: '800px' }}>
                
                {/* Header */}
                <div className="d-flex align-items-center gap-3 mb-5">
                    <button onClick={() => navigate(-1)} className="btn btn-game-white rounded-circle shadow-action-sm p-3">
                        <ArrowLeft size={24} strokeWidth={3} className="text-theme-main" />
                    </button>
                    <div>
                        <h2 className="fw-black text-theme-main mb-0 ls-tight uppercase">Streak & Progress</h2>
                        <p className="smallest fw-bold text-theme-muted mb-0 ls-1 uppercase">YOUR LEARNING CONSISTENCY</p>
                    </div>
                </div>

                {/* Main Stats Card */}
                <div className="brutalist-card p-4 p-md-5 bg-theme-surface mb-5 position-relative overflow-hidden">
                    <div className="position-absolute top-0 end-0 p-4 opacity-10">
                        <Flame size={120} strokeWidth={1} className="fire-animate" />
                    </div>
                    
                    <div className="row align-items-center">
                        <div className="col-md-5 text-center mb-4 mb-md-0">
                            <Mascot mood={userData?.streak > 0 ? 'excited' : 'happy'} width="120px" height="120px" />
                        </div>
                        <div className="col-md-7">
                            <div className="d-flex align-items-center gap-3 mb-2">
                                <div className="bg-warning text-dark p-2 rounded-3 shadow-sm fire-animate">
                                    <Flame size={32} fill="currentColor" />
                                </div>
                                <div>
                                    <h1 className="fw-black text-theme-main mb-0 display-4 ls-tight">{userData?.streak || 0}</h1>
                                    <p className="fw-black text-warning mb-0 ls-1 uppercase">Day Streak</p>
                                </div>
                            </div>
                            <p className="text-theme-muted fw-bold mt-3">
                                {userData?.streak > 0 
                                    ? "You're on fire! Keep learning today to protect your streak." 
                                    : "Start a new streak today by completing a lesson!"}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Calendar Section */}
                <div className="mt-4">
                    <div className="brutalist-card p-3 p-md-4 bg-theme-surface">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h5 className="fw-black text-theme-main mb-0 ls-tight uppercase d-flex align-items-center gap-2">
                                <Trophy size={20} className="text-warning" /> Activity Calendar
                            </h5>
                            <div className="d-flex align-items-center gap-2 bg-theme-base px-3 py-2 rounded-3 border border-theme-soft">
                                <Shield size={18} className="text-primary" strokeWidth={3} />
                                <span className="fw-black text-theme-main smallest uppercase">{userData?.streakFreezes || 0} Freezes</span>
                            </div>
                        </div>
                        
                        <StreakCalendar
                            activityHistory={userData?.activityHistory || []}
                            frozenDays={userData?.frozenDays || []}
                            streakFreezes={userData?.streakFreezes || 0}
                            points={userData?.points || 0}
                            streak={userData?.streak || 0}
                            onBuyFreeze={async () => {
                                // I'll add the buy freeze logic back here since it's streak related
                                if (!userData) return;
                                if (userData.points < 100) {
                                    Swal.fire({
                                        title: 'Insufficient XP!',
                                        text: 'You need 100 XP points to buy a streak freeze.',
                                        icon: 'warning',
                                        confirmButtonColor: '#FACC15'
                                    });
                                    return;
                                }
                                try {
                                    const userRef = doc(db, "users", auth.currentUser!.uid);
                                    await updateDoc(userRef, {
                                        points: increment(-100),
                                        streakFreezes: increment(1)
                                    });
                                    setUserData((prev: any) => ({
                                        ...prev,
                                        points: prev.points - 100,
                                        streakFreezes: (prev.streakFreezes || 0) + 1
                                    }));
                                    Swal.fire('Success', 'Freeze purchased!', 'success');
                                } catch (e) {
                                        Swal.fire('Error', 'Purchase failed', 'error');
                                }
                            }}
                            onShareClick={() => setIsShareModalOpen(true)}
                        />

                        <div className="mt-4 pt-3 border-top border-theme-soft">
                             <button 
                                onClick={() => navigate('/profile')} 
                                className="btn btn-game btn-game-primary w-100 uppercase fw-black ls-1 smallest py-3 shadow-action-sm"
                            >
                                BACK TO PROFILE
                            </button>
                        </div>
                    </div>
                </div>

                {/* Modals */}
                <ShareStreakModal 
                    isOpen={isShareModalOpen} 
                    onClose={() => setIsShareModalOpen(false)} 
                    userData={userData} 
                    inviteLink={`${window.location.origin}/register?ref=${auth.currentUser?.uid}`}
                />

            </div>

            <style>{`
                .ls-tight { letter-spacing: -1.5px; }
                .ls-1 { letter-spacing: 1px; }
                .uppercase { text-transform: uppercase; }
                .fw-black { font-weight: 950 !important; }
            `}</style>
        </div>
    );
};

export default StreakDetails;
