import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { doc, updateDoc, type Firestore } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../services/firebaseConfig';
import { fetchLessons, refreshUserData, getMicroLessons, fetchLanguages } from '../services/dataCache';
import LandingPage from './LandingPage';
import InstallBanner from '../components/InstallBanner';
import TourGuide from '../components/TourGuide';
import JuicyButton from '../components/JuicyButton';
import PremiumStreakModal from '../components/PremiumStreakModal';
import NotificationNudge from '../components/NotificationNudge';
import LanguageCharacter from '../components/illustrations/LanguageCharacters';
import AchievementCard from '../components/AchievementCard';
import { ALL_TROPHIES } from '../services/achievementService';


const Home: React.FC = () => {
    const navigate = useNavigate();

    const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
    const [userData, setUserData] = useState<any>(null);
    const [lastLesson, setLastLesson] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isTourOpen, setIsTourOpen] = useState(false);
    const [showStreakModal, setShowStreakModal] = useState(false);
    const [currentLanguage, setCurrentLanguage] = useState<any>(null);




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
                    const [userData, lessons, languages] = await Promise.all([
                        refreshUserData(),
                        fetchLessons(),
                        fetchLanguages(),
                    ]);

                    if (userData) {
                        setUserData(userData);
                        const prefId = userData.preferredLanguageId || localStorage.getItem('chommie_student_lang');
                        if (prefId) {
                            const lang = languages.find((l: any) => l.id === prefId);
                            if (lang) setCurrentLanguage(lang);
                        }



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

            {/* App Tour Guide */}
            <TourGuide
                isOpen={isTourOpen}
                onClose={() => setIsTourOpen(false)}
                onComplete={handleTourComplete}
            />

            {/* CLEAN HERO HEADER WITH MASCOT */}
            <div className="px-3 py-3 bg-white border-bottom border-dark border-4 position-relative overflow-hidden" style={{ background: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23000000\' fill-opacity=\'0.03\' fill-rule=\'evenodd\'%3E%3Ccircle cx=\'3\' cy=\'3\' r=\'1\'/%3E%3C/g%3E%3C/svg%3E")' }}>
                <div className="container" style={{ maxWidth: '750px' }}>
                    <InstallBanner />

                    <div className="row align-items-center">
                        <div className="col-12">
                            {/* Clean Stat Chips */}
                            {/* Clean Stat Chips */}
                            <div className="d-flex flex-column gap-2 mt-2">
                                {/* Row 1: XP, STREAK, TROPHIES */}
                                <div className="d-flex align-items-center gap-2">
                                    {/* XP Card */}
                                    <div className="brutalist-card--sm d-flex align-items-center flex-fill gap-2 p-2 pe-3 bg-white shadow-action-sm transition-all hover-lift border border-dark border-3"
                                         style={{ minWidth: '100px' }}>
                                        <div className="stat-icon-box rounded-3 d-flex align-items-center justify-content-center bg-warning border border-dark border-2"
                                            style={{ width: 34, height: 34 }}>
                                            <i className="bi bi-gem fs-6 text-dark"></i>
                                        </div>
                                        <div className="lh-1">
                                            <p className="mb-0 fw-black text-dark" style={{ fontSize: '1rem' }}>{userData?.points || 0}</p>
                                            <p className="mb-0 smallest fw-black text-muted uppercase ls-1" style={{ fontSize: '8px' }}>XP</p>
                                        </div>
                                    </div>

                                    {/* Streak Card */}
                                    <div
                                        className={`brutalist-card--sm d-flex align-items-center flex-fill gap-2 p-2 pe-3 shadow-action-sm transition-all hover-lift border border-dark border-3 streak-trigger-area ${userData?.streak > 0 ? 'bg-danger text-white' : 'bg-white text-dark'}`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowStreakModal(!showStreakModal);
                                        }}
                                        style={{ cursor: 'pointer', minWidth: '100px' }}
                                    >
                                        <div className={`stat-icon-box rounded-3 d-flex align-items-center justify-content-center border border-dark border-2 ${userData?.streak > 0 ? 'bg-white text-danger' : 'bg-danger-subtle text-danger'}`}
                                            style={{ width: 34, height: 34 }}>
                                            <i className={`bi bi-fire fs-6 ${userData?.streak > 0 ? 'fire-shake' : ''}`}></i>
                                        </div>
                                        <div className="lh-1">
                                            <p className="mb-0 fw-black" style={{ fontSize: '1rem' }}>{userData?.streak || 0}</p>
                                            <p className={`mb-0 smallest fw-black uppercase ls-1 ${userData?.streak > 0 ? 'opacity-75' : 'text-muted'}`} style={{ fontSize: '8px' }}>STREAK</p>
                                        </div>
                                    </div>

                                    {/* Trophies Card */}
                                    <div className="brutalist-card--sm d-flex align-items-center flex-fill gap-2 p-2 pe-3 bg-white shadow-action-sm transition-all hover-lift border border-dark border-3"
                                         onClick={() => navigate('/achievements')}
                                         style={{ minWidth: '100px', cursor: 'pointer' }}>
                                        <div className="stat-icon-box rounded-3 d-flex align-items-center justify-content-center bg-info border border-dark border-2"
                                            style={{ width: 34, height: 34 }}>
                                            <i className="bi bi-trophy-fill fs-6 text-dark"></i>
                                        </div>
                                        <div className="lh-1">
                                            <p className="mb-0 fw-black text-dark" style={{ fontSize: '1rem' }}>{userData?.trophies?.length || 0}</p>
                                            <p className="mb-0 smallest fw-black text-muted uppercase ls-1" style={{ fontSize: '8px' }}>TROPHIES</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Row 2: Target Language (Wide) */}
                                {currentLanguage && (
                                    <div className="brutalist-card--sm d-flex align-items-center justify-content-between p-2 px-3 bg-white shadow-action-sm transition-all hover-lift border border-dark border-3 w-100"
                                         onClick={() => navigate('/courses')}
                                         style={{ cursor: 'pointer' }}>
                                        <div className="d-flex align-items-center gap-3">
                                            <div className="stat-icon-box rounded-3 bg-light d-flex align-items-center justify-content-center overflow-hidden border border-dark border-2"
                                                style={{ width: 38, height: 38 }}>
                                                <LanguageCharacter 
                                                    languageName={currentLanguage.name} 
                                                    style={{ width: '130%', height: '130%', transform: 'translateY(15%)' }} 
                                                />
                                            </div>
                                            <div className="lh-1">
                                                <p className="mb-0 smallest fw-black text-muted uppercase ls-1" style={{ fontSize: '9px' }}>LEARNING TARGET</p>
                                                <p className="mb-0 fw-black text-dark" style={{ fontSize: '1.25rem' }}>{currentLanguage.name?.toUpperCase()}</p>
                                            </div>
                                        </div>
                                        <i className="bi bi-chevron-right text-dark opacity-50"></i>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container py-4 py-md-5" style={{ maxWidth: '750px' }}>

                <div className="row g-5">
                    <main className="col-12">
                        
                        <NotificationNudge />

                        {/* CONTINUE LEARNING */}
                        <section className="mb-5 text-start">
                            <h6 className="fw-black text-uppercase text-dark smallest ls-2 mb-4 px-2">CONTINUE LEARNING</h6>
                            {lastLesson ? (
                                <div className="p-4 p-md-5 brutalist-card shadow-action bg-white position-relative overflow-hidden">
                                    <div className="position-relative z-1">
                                        <div className="d-flex align-items-center gap-2 mb-2">
                                            <span className="px-2 py-0.5 rounded-pill fw-black ls-1 bg-warning text-dark border border-dark border-2"
                                                style={{ fontSize: '9px' }}>
                                                {lastLesson.savedType === 'quiz' ? <><i className="bi bi-pencil-square me-1"></i> QUIZ</> : <><i className="bi bi-journal-text me-1"></i> LESSON</>}
                                            </span>
                                            <span className="smallest fw-black text-muted ls-1 uppercase" style={{ fontSize: '9px' }}>{lastLesson.courseTitle}</span>
                                        </div>
                                        <h3 className="fw-black mb-4 text-dark uppercase ls-tight" style={{ fontSize: '1.5rem' }}>{lastLesson.title}</h3>
                                        
                                        <JuicyButton
                                            onClick={() => navigate(`/game/${lastLesson.id}/${lastLesson.microLessonId}?start=${lastLesson.savedIndex}&type=${lastLesson.savedType?.toUpperCase()}`)}
                                            className="btn btn-game btn-game-primary px-4 py-2 fw-black smallest ls-1"
                                        >
                                            <i className="bi bi-play-fill fs-6 me-1"></i> RESUME NOW
                                        </JuicyButton>
                                    </div>
                                    <i className="bi bi-play-fill position-absolute end-0 bottom-0 opacity-10" style={{ fontSize: '120px', transform: 'translate(20%, 20%)', color: '#000' }}></i>
                                </div>
                            ) : (
                                <div className="py-5 text-center brutalist-card bg-light border-dashed border-dark border-3 shadow-none">
                                    <div className="mb-3 text-muted opacity-50"><i className="bi bi-mortarboard-fill fs-1"></i></div>
                                    <p className="text-dark smallest fw-black uppercase ls-2 mb-3">Master your language journey</p>
                                    <JuicyButton onClick={() => navigate('/courses')} className="btn btn-game btn-game-white px-5">
                                        EXPLORE LESSONS
                                    </JuicyButton>
                                </div>
                            )}
                        </section>

                        {/* RECENT TROPHIES */}
                        {userData?.trophies?.length > 0 && (
                            <section className="mb-5 text-start">
                                <div className="d-flex justify-content-between align-items-center mb-4 px-2">
                                    <h6 className="fw-black text-uppercase text-dark smallest ls-2 mb-0">RECENT ACHIEVEMENTS</h6>
                                    <Link to="/achievements" className="smallest fw-black text-warning ls-1 uppercase text-decoration-none">COLLECTION</Link>
                                </div>
                                <div className="row g-3 flex-nowrap overflow-auto hide-scrollbar pb-3 px-1">
                                    {[...ALL_TROPHIES]
                                        .filter(t => (userData?.trophies || []).includes(t.id))
                                        .slice(-4)
                                        .reverse()
                                        .map((trophy: any) => (
                                            <div key={trophy.id} className="col-8 col-sm-4 col-md-3">
                                                <AchievementCard
                                                    id={trophy.id}
                                                    color={trophy.color}
                                                    isEarned={true}
                                                    progress={100}
                                                    rarity={trophy.rarity as any}
                                                    onShare={() => navigate('/achievements')}
                                                />
                                            </div>
                                        ))}
                                </div>
                            </section>
                        )}


                        {/* FOCUS AREAS */}
                        <section className="text-start mb-5">
                            <h6 className="fw-black text-uppercase text-dark smallest ls-2 mb-4 px-2">FOCUS AREAS</h6>
                            <div className="row g-4">
                                {[
                                    { to: '/courses', icon: 'bi-grid-fill', title: 'Courses & Catalog', sub: 'Explore all lessons', color: '#FACC15' },
                                    { to: '/muvhigo', icon: 'bi-trophy-fill', title: 'Leaderboard', sub: 'Compete for top rank', color: '#FACC15' },
                                ].map((item) => (
                                    <div key={item.to} className="col-md-6">
                                        <Link to={item.to} className="text-decoration-none d-block p-4 brutalist-card--sm shadow-action-sm transition-all bg-white hover-lift h-100">
                                            <div className="d-flex justify-content-between align-items-center">
                                                <div className="d-flex align-items-center gap-3">
                                                    <div className="bg-warning p-2 rounded-3 border border-dark border-2 shadow-none d-flex align-items-center justify-content-center" style={{ width: 50, height: 50 }}>
                                                        <i className={`bi ${item.icon} text-dark fs-3`}></i>
                                                    </div>
                                                    <div>
                                                        <h5 className="fw-black text-dark mb-1 uppercase ls-tight">{item.title}</h5>
                                                        <p className="smallest fw-bold text-muted mb-0 uppercase ls-1">{item.sub}</p>
                                                    </div>
                                                </div>
                                                <i className="bi bi-chevron-right text-dark fs-5 fw-black"></i>
                                            </div>
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </main>
                </div>
            </div>

            <style>{`
                .ls-tight { letter-spacing: -1.5px; }
                .ls-1 { letter-spacing: 1px; }
                .ls-2 { letter-spacing: 2px; }
                .smallest { font-size: 11px; }
                .uppercase { text-transform: uppercase; }
                .fw-black { font-weight: 900; }
                
                .transition-all { transition: all 0.2s ease-in-out; }
                .hover-lift:hover { transform: translateY(-4px); }

                @media (max-width: 575.98px) {
                    .brutalist-card--sm {
                        flex: 1 1 100%;
                    }
                }
                
                .fire-shake {
                    display: inline-block;
                    animation: fire-shake 0.5s infinite alternate ease-in-out;
                }
                @keyframes fire-shake {
                    from { transform: rotate(-8deg) scale(1); }
                    to { transform: rotate(8deg) scale(1.1); }
                }
            `}</style>
            {/* Global Overlays */}
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
    );
};

export default Home;
