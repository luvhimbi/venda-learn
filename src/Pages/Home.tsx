import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { doc, updateDoc, type Firestore } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../services/firebaseConfig';
import { fetchLessons, refreshUserData, getMicroLessons } from '../services/dataCache';
import { useRetentionEngine } from '../hooks/useRetentionEngine';
import { ALL_TROPHIES } from '../services/achievementService';
import LandingPage from './LandingPage';
import InstallBanner from '../components/InstallBanner';
import TourGuide from '../components/TourGuide';
import DailyWelcomeModal from '../components/DailyWelcomeModal';
import TrophyIcon from '../components/TrophyIcon';
import JuicyButton from '../components/JuicyButton';
import PremiumStreakModal from '../components/PremiumStreakModal';
import NotificationNudge from '../components/NotificationNudge';


const Home: React.FC = () => {
    const navigate = useNavigate();

    const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
    const [userData, setUserData] = useState<any>(null);
    const [lastLesson, setLastLesson] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isTourOpen, setIsTourOpen] = useState(false);
    const [showStreakModal, setShowStreakModal] = useState(false);




    const handleTourComplete = async () => {
        setIsTourOpen(false);
        if (auth.currentUser) {
            try {
                const userRef = doc(db as Firestore, "users", auth.currentUser.uid);
                await updateDoc(userRef, { tourCompleted: true });
                // We don't necessarily need to refresh everything, just set local state if needed
                setUserData((prev: any) => ({ ...prev, tourCompleted: true }));
            } catch (err) {
                console.error("Error updating tour status:", err);
            }
        }
    };



    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setIsLoggedIn(true);
                try {
                    const [userData, lessons] = await Promise.all([
                        refreshUserData(),
                        fetchLessons(),
                    ]);

                    if (userData) {
                        setUserData(userData);
                        const prefId = userData.preferredLanguageId || localStorage.getItem('venda_student_lang');



                        // Resolve last lesson from cached lessons instead of extra Firestore call
                        if (userData.lastLessonId) {
                            const cachedCourse = lessons.find((l: any) => l.id === userData.lastLessonId);

                            // Only show if it matches the current language preference
                            const isVendaFallback = !cachedCourse?.languageId && (prefId === 'venda' || !prefId);
                            const matchesLang = cachedCourse?.languageId === prefId || isVendaFallback;

                            if (cachedCourse && matchesLang) {
                                const microLessons = getMicroLessons(cachedCourse);
                                let targetMl = microLessons[0];

                                if (userData.lastMicroLessonId) {
                                    const foundMl = microLessons.find((ml: any) => ml.id === userData.lastMicroLessonId);
                                    if (foundMl) targetMl = foundMl;
                                }

                                setLastLesson({
                                    id: cachedCourse.id,
                                    microLessonId: targetMl.id,
                                    title: targetMl.title || cachedCourse.title,
                                    courseTitle: cachedCourse.title,
                                    savedIndex: userData.lastProgressIndex || 0,
                                    savedType: userData.lastProgressType || 'slide'
                                });
                            }
                        }
                    }

                    if (userData && userData.tourCompleted === false && window.innerWidth >= 768) {
                        // Check if we've already tried to open it in this session to prevent loops
                        const tourSeenThisSession = sessionStorage.getItem('tour_offered');
                        if (!tourSeenThisSession) {
                            setIsTourOpen(true);
                            sessionStorage.setItem('tour_offered', 'true');
                        }
                    }

                } catch (err) {
                    console.error("Error fetching home data:", err);
                }
            } else {
                setIsLoggedIn(false);
            }
            setLoading(false);
        });
        const handleOutsideClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!target.closest('.streak-trigger-area')) {
                setShowStreakModal(false);
            }
        };

        if (showStreakModal) {
            document.addEventListener('click', handleOutsideClick);
        }

        return () => {
            unsubscribe();
            document.removeEventListener('click', handleOutsideClick);
        };
    }, [showStreakModal]);

    // --- EMOTIONAL DESIGN: MASCOT QUOTES ---
    const [showWelcomeModal, setShowWelcomeModal] = useState(false);

    useEffect(() => {
        if (isLoggedIn && userData) {

            // Show daily welcome if not seen today
            const lastWelcome = localStorage.getItem('vendalearn_last_welcome');
            const today = new Date().toISOString().split('T')[0];
            if (lastWelcome !== today) {
                setShowWelcomeModal(true);
            }
        }
    }, [isLoggedIn, userData]);

    // Retention Engine: Intelligently triggers daily/milestone nudges
    // Now delayed if welcome modal is showing to prevent visual clutter
    useRetentionEngine(userData, showWelcomeModal);

    if (loading) return (
        <div className="d-flex justify-content-center align-items-center min-vh-100 bg-white">
            <div className="text-center">
                <div className="spinner-border mb-3" style={{ color: '#FACC15', width: 48, height: 48 }} role="status"></div>
                <p className="smallest fw-bold text-muted ls-2 uppercase">LOADING...</p>
            </div>
        </div>
    );

    if (!isLoggedIn) {
        return <LandingPage />;
    }


    return (
        <div className="bg-white min-vh-100" style={{ overflowX: 'hidden' }}>


            {/* Daily Welcome Experience */}
            {showWelcomeModal && userData && (
                <DailyWelcomeModal
                    username={userData.username || 'Learner'}
                    streak={userData.streak || 0}
                    lastLesson={lastLesson}
                    onClose={() => setShowWelcomeModal(false)}
                />
            )}

            {/* App Tour Guide */}
            <TourGuide
                isOpen={isTourOpen}
                onClose={() => setIsTourOpen(false)}
                onComplete={handleTourComplete}
            />

            {/* CLEAN HERO HEADER WITH MASCOT */}
            <div className="px-3 py-3 bg-white border-bottom position-relative">
                <div className="container" style={{ maxWidth: '800px' }}>
                    <InstallBanner />

                    <div className="row align-items-center">
                        <div className="col-12 mb-4 mb-md-0">


                            {/* Clean Stat Chips */}
                            <div className="d-flex flex-wrap gap-4 mt-3">
                                {/* XP */}
                                <div className="d-flex align-items-center gap-3">
                                    <div className="d-inline-flex align-items-center justify-content-center rounded-3"
                                        style={{ width: 44, height: 44, backgroundColor: 'rgba(250,204,21,.15)' }}>
                                        <i className="bi bi-gem fs-5" style={{ color: '#FACC15' }}></i>
                                    </div>
                                    <div>
                                        <p className="mb-0 fw-bold fs-5 text-slate-800 lh-1">{userData?.points || 0}</p>
                                        <p className="mb-0 smallest text-slate-400 uppercase ls-1">Total XP</p>
                                    </div>
                                </div>

                                {/* Streak */}
                                <div
                                    className="d-flex align-items-center gap-3 position-relative streak-trigger-area"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowStreakModal(!showStreakModal);
                                    }}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <div className={`d-inline-flex align-items-center justify-content-center rounded-3 transition-all ${userData?.streak > 0 ? 'active-streak-fire' : ''}`}
                                        style={{ width: 44, height: 44, backgroundColor: userData?.streak > 0 ? '#EF4444' : 'rgba(239,68,68,.15)' }}>
                                        <i className={`bi bi-fire fs-5 ${userData?.streak > 0 ? 'fire-shake text-white' : 'text-danger'}`}></i>
                                    </div>
                                    <div>
                                        <p className={`mb-0 fw-bold fs-5 lh-1 ${userData?.streak > 0 ? 'text-danger' : 'text-slate-800'}`}>{userData?.streak || 0}</p>
                                        <p className="mb-0 smallest text-slate-400 uppercase ls-1">Day Streak</p>
                                    </div>

                                    <PremiumStreakModal
                                        streak={userData?.streak || 0}
                                        activityHistory={userData?.activityHistory || []}
                                        frozenDays={userData?.frozenDays || []}
                                        streakFreezes={userData?.streakFreezes || 0}
                                        points={userData?.points || 0}
                                        isVisible={showStreakModal}
                                        onClose={() => setShowStreakModal(false)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container py-3" style={{ maxWidth: '800px' }}>

                <div className="row g-5">
                    <main className="col-12">
                        
                        <NotificationNudge />

                        {/* CONTINUE LEARNING */}
                        <section className="mb-3 text-start">
                            <h6 className="fw-bold text-uppercase text-muted smallest ls-2 mb-4">Continue Learning</h6>
                            {lastLesson ? (
                                <div className="p-4 rounded-4 position-relative overflow-hidden"
                                    style={{ backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB' }}>
                                    <div className="position-relative z-1">
                                        <div className="d-flex align-items-center gap-1 mb-2">
                                            <span className="px-2 py-0.5 rounded-pill fw-bold ls-1"
                                                style={{ backgroundColor: '#FEF3C7', color: '#92400E', fontSize: '9px' }}>
                                                {lastLesson.savedType === 'quiz' ? <><i className="bi bi-pencil-square me-1" style={{ fontSize: '10px' }}></i> QUIZ</> : <><i className="bi bi-journal-text me-1" style={{ fontSize: '10px' }}></i> LEARNING:</>}
                                            </span>
                                        </div>
                                        <h5 className="fw-bold mb-1 text-dark">{lastLesson.title}</h5>
                                        <p className="text-muted smallest mb-0 uppercase ls-1">{lastLesson.courseTitle}</p>
                                        <div className="mb-4"></div>
                                        <JuicyButton
                                            onClick={() => navigate(`/game/${lastLesson.id}/${lastLesson.microLessonId}?start=${lastLesson.savedIndex}&type=${lastLesson.savedType?.toUpperCase()}`)}
                                            className="btn game-btn-primary px-4 py-2 fw-bold smallest ls-1"
                                        >
                                            <i className="bi bi-play-fill me-1"></i> RESUME NOW
                                        </JuicyButton>
                                    </div>
                                    <i className="bi bi-play-fill position-absolute end-0 bottom-0 opacity-5" style={{ fontSize: '120px', transform: 'translate(20%, 20%)', color: '#111827' }}></i>
                                </div>
                            ) : (
                                <div className="py-4 text-center rounded-4" style={{ backgroundColor: '#F9FAFB', border: '1px dashed #D1D5DB' }}>
                                    <div className="mb-2"><i className="bi bi-mortarboard-fill text-muted" style={{ fontSize: '32px' }}></i></div>
                                    <p className="text-muted smallest fw-bold uppercase ls-1 mb-2">No active lesson found</p>
                                    <JuicyButton onClick={() => navigate('/courses')} className="btn btn-slate rounded-3 px-4 py-2 fw-bold smallest ls-1">
                                        EXPLORE LESSONS
                                    </JuicyButton>
                                </div>
                            )}
                        </section>

                        {/* ACHIEVEMENTS PREVIEW */}
                        <section className="mb-3 text-start">
                            <div className="d-flex justify-content-between align-items-end mb-4">
                                <h6 className="fw-bold text-uppercase text-muted smallest ls-2 mb-0">Mastery Collection</h6>
                                <Link to="/achievements" className="smallest fw-bold text-warning text-decoration-none ls-1">VIEW ALL <i className="bi bi-arrow-right"></i></Link>
                            </div>
                            <div className="row g-3">
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
                                            <div key={trophy.id} className="col-4">
                                                <div
                                                    onClick={() => navigate('/achievements')}
                                                    className={`p-3 rounded-4 text-center transition-all hover-lift ${isEarned ? 'bg-white shadow-sm border border-warning' : 'bg-white border'}`}
                                                    style={{
                                                        cursor: 'pointer',
                                                        opacity: isEarned ? 1 : 0.5,
                                                        filter: isEarned ? 'none' : 'grayscale(1)'
                                                    }}
                                                >
                                                    <TrophyIcon
                                                        rarity={trophy.rarity as any}
                                                        size={42}
                                                        animate={isEarned}
                                                        color={trophy.color}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        </section>

                        {/* FOCUS AREAS */}
                        <section className="text-start">
                            <h6 className="fw-bold text-uppercase text-muted smallest ls-2 mb-4">Focus Areas</h6>
                            <div className="d-grid gap-3">
                                {[
                                    { to: '/courses', icon: 'bi-grid-fill', title: 'Courses & Catalog', sub: 'Browse all lessons' },
                                    { to: '/history', icon: 'bi-bank2', title: 'History', sub: 'Learn about South African heritage' },
                                    { to: '/muvhigo', icon: 'bi-trophy-fill', title: 'Leaderboard', sub: 'See how you rank' },
                                ].map((item) => (
                                    <Link key={item.to} to={item.to} className="text-decoration-none d-block p-4 rounded-4 transition-all hover-lift"
                                        style={{ backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB' }}>
                                        <div className="d-flex justify-content-between align-items-center">
                                            <div className="d-flex align-items-center gap-3">
                                                <i className={`bi ${item.icon} text-primary fs-3`}></i>
                                                <div>
                                                    <h6 className="fw-bold text-dark mb-0">{item.title}</h6>
                                                    <p className="smallest text-muted mb-0 uppercase ls-1">{item.sub}</p>
                                                </div>
                                            </div>
                                            <i className="bi bi-chevron-right text-muted"></i>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    </main>
                </div>
            </div>

            <style>{`
                .rounded-2xl { border-radius: 1rem; }
                .text-slate-800 { color: #1e293b; }
                .text-slate-500 { color: #64748b; }
                .text-slate-400 { color: #94a3b8; }
                .bg-red-50 { background-color: #fef2f2; }
                .ls-2 { letter-spacing: 2px; }
                .uppercase { text-transform: uppercase; }
                
                .transition-all { transition: all 0.2s ease-in-out; }
                .hover-lift:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,.08); }

                .btn-slate {
                    background-color: #1e293b;
                    color: white;
                }
                .btn-slate:hover {
                    background-color: #334155;
                    color: white;
                }
                .btn-outline-slate {
                    border: 1px solid #1e293b;
                    color: #1e293b;
                }
                .btn-outline-slate:hover {
                    background-color: #1e293b;
                    color: white;
                }
                .text-slate {
                    color: #1e293b !important;
                }
                .mascot-speech-bubble {
                    animation: floatBubble 4s infinite ease-in-out;
                }
                @keyframes floatBubble {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-5px); }
                }

                .active-streak-fire {
                    box-shadow: 0 0 15px rgba(239, 68, 68, 0.4);
                    animation: active-pulse 2s infinite ease-in-out;
                }
                .active-streak-text {
                    text-shadow: 0 0 8px rgba(239, 68, 68, 0.2);
                }
                .fire-shake {
                    display: inline-block;
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
        </div>
    );
};

export default Home;
