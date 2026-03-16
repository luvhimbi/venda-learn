import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../services/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { getBadgeDetails, getLevelStats } from "../services/levelUtils.ts";
import { fetchLessons, fetchTopLearners, refreshUserData, getMicroLessons } from '../services/dataCache';
import InstallBanner from '../components/InstallBanner';
import Mascot from '../components/Mascot';
import LandingPage from './LandingPage';
import TourGuide from '../components/TourGuide';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import { useRetentionEngine } from '../hooks/useRetentionEngine';
import DailyWelcomeModal from '../components/DailyWelcomeModal';
import { ALL_TROPHIES } from '../services/achievementService';
import TrophyIcon from '../components/TrophyIcon';

// --- LEVEL UP MOTIVATION ---
const getLevelMotivation = (level: number, progress: number) => {
    if (progress >= 80) return { msg: "Almost there! Push through for the next level!", color: "#F59E0B" };
    if (progress >= 50) return { msg: "Halfway to the next level! Keep learning!", color: "#10B981" };
    if (level >= 10) return { msg: "You're a Venda language master!", color: "#4f46e5" };
    if (level >= 5) return { msg: "Solid progress! You're becoming fluent!", color: "#059669" };
    return { msg: "Every word brings you closer to fluency!", color: "#10B981" };
};

const Home: React.FC = () => {
    const navigate = useNavigate();

    const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
    const [userData, setUserData] = useState<any>(null);
    const [lastLesson, setLastLesson] = useState<any>(null);
    const [topLearners, setTopLearners] = useState<any[]>([]);
    const [totalMlsCount, setTotalMlsCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [isTourOpen, setIsTourOpen] = useState(false);



    const handleTourComplete = async () => {
        setIsTourOpen(false);
        if (auth.currentUser) {
            try {
                const userRef = doc(db, "users", auth.currentUser.uid);
                await updateDoc(userRef, { tourCompleted: true });
                // We don't necessarily need to refresh everything, just set local state if needed
                setUserData((prev: any) => ({ ...prev, tourCompleted: true }));
            } catch (err) {
                console.error("Error updating tour status:", err);
            }
        }
    };

    const getVendaGreeting = () => {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) return "Ndi Matsheloni";
        if (hour >= 12 && hour < 17) return "Ndi Masiari";
        if (hour >= 17 && hour <= 23) return "Ndi Madekwana";
        return "Ndi Madaucha";
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setIsLoggedIn(true);
                try {
                    // Fetch everything in parallel using the cache layer
                    const [userData, lessons, topLearnersData] = await Promise.all([
                        refreshUserData(),
                        fetchLessons(),          // cached across pages
                        fetchTopLearners(),      // cached across pages
                    ]);

                    if (userData) {
                        setUserData(userData);
                        setTotalMlsCount(lessons.reduce((acc: number, course: any) => acc + getMicroLessons(course).length, 0));
                        setTopLearners(topLearnersData);

                        // Resolve last lesson from cached lessons instead of extra Firestore call
                        if (userData.lastLessonId) {
                            const cachedCourse = lessons.find((l: any) => l.id === userData.lastLessonId);
                            if (cachedCourse) {
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
        return () => unsubscribe();
    }, []);

    // --- EMOTIONAL DESIGN: MASCOT QUOTES ---
    const [mascotQuote, setMascotQuote] = useState("");
    const [showWelcomeModal, setShowWelcomeModal] = useState(false);

    useEffect(() => {
        if (isLoggedIn && userData) {
            const quotes = [
                `Vho vuwa hani, ${userData.username || 'Learner'}? Ready to learn?`,
                "Every word you learn today is a victory! 🏆",
                "I believe in you! Let's crush some lessons! ✨",
                "Tshivenda is beautiful, just like your progress! 🌸",
                "Ready to earn some more LP today? 💎",
                "Keep going! You're becoming a Venda master! 🦁"
            ];
            setMascotQuote(quotes[Math.floor(Math.random() * quotes.length)]);

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

    const stats = getLevelStats(userData?.points || 0);
    const badge = getBadgeDetails(stats.level);

    // Correct progress calculation for micro-lessons architecture
    const completedMlsCount = userData?.completedLessons?.length || 0;

    const overallProgressPercentage = totalMlsCount > 0
        ? Math.round((completedMlsCount / totalMlsCount) * 100)
        : 0;

    const motivation = getLevelMotivation(stats.level, stats.progress);

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

            {/* LIGHT HERO HEADER WITH MASCOT */}
            <div className="px-3 py-5" style={{ background: 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)', borderBottom: '1px solid #E2E8F0' }}>
                <div className="container" style={{ maxWidth: '1100px' }}>
                    <InstallBanner />
                    <div className="row align-items-center">
                        <div className="col-8">
                            <h2 className="fw-bold text-slate mb-1 ls-tight">{getVendaGreeting()}, {userData?.username || 'Learner'}</h2>
                            <span className="smallest fw-bold ls-2 uppercase text-muted">Kha ri gude Tshivenda</span>

                            <div className="d-flex gap-4 mt-4">
                                <div className="d-flex align-items-center gap-2">
                                    <div className="d-inline-flex align-items-center justify-content-center rounded-3"
                                        style={{ width: 40, height: 40, backgroundColor: 'rgba(250,204,21,.15)' }}>
                                        <i className="bi bi-gem" style={{ color: '#FACC15' }}></i>
                                    </div>
                                    <div>
                                        <p className="mb-0 fw-bold text-slate ls-1">{userData?.points || 0}</p>
                                        <p className="mb-0 smallest text-muted uppercase">LP Points</p>
                                    </div>
                                </div>
                                <div className="d-flex align-items-center gap-2">
                                    <div className="d-inline-flex align-items-center justify-content-center rounded-3"
                                        style={{ width: 40, height: 40, backgroundColor: 'rgba(239,68,68,.15)' }}>
                                        <i className="bi bi-fire" style={{ color: '#EF4444' }}></i>
                                    </div>
                                    <div>
                                        <p className="mb-0 fw-bold text-slate ls-1">{userData?.streak || 0}</p>
                                        <p className="mb-0 smallest text-muted uppercase">Day Streak</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-4 d-flex justify-content-center position-relative">
                            {mascotQuote && !isTourOpen && (
                                <div className="mascot-speech-bubble position-absolute bg-white px-3 py-2 rounded-4 shadow-sm border"
                                    style={{ top: '-10px', right: '10%', maxWidth: '180px', zIndex: 5 }}>
                                    <p className="mb-0 small fw-bold text-dark lh-sm">{mascotQuote}</p>
                                    <div className="bubble-tail position-absolute bg-white border-bottom border-end"
                                        style={{ width: '12px', height: '12px', bottom: '-6px', left: '20px', transform: 'rotate(45deg)' }}></div>
                                </div>
                            )}
                            <Mascot width="140px" height="140px" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="container py-5" style={{ maxWidth: '1100px' }}>
                <div className="row g-5">
                    <main className="col-lg-7">



                        {/* CONTINUE LEARNING */}
                        <section className="mb-5 text-start">
                            <h6 className="fw-bold text-uppercase text-muted smallest ls-2 mb-4">Bvelelani Phanda (Continue)</h6>
                            {lastLesson ? (
                                <div className="p-4 rounded-4 position-relative overflow-hidden"
                                    style={{ backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB' }}>
                                    <div className="position-relative z-1">
                                        <div className="d-flex align-items-center gap-2 mb-2">
                                            <span className="px-2 py-1 rounded-pill smallest fw-bold ls-1"
                                                style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}>
                                                {lastLesson.savedType === 'quiz' ? <><i className="bi bi-pencil-square me-1"></i> QUIZ</> : <><i className="bi bi-journal-text me-1"></i> LESSON</>}
                                            </span>
                                        </div>
                                        <h3 className="fw-bold mb-1 text-dark">{lastLesson.title}</h3>
                                        <p className="text-muted small mb-0">{lastLesson.courseTitle}</p>
                                        <div className="mb-4"></div>
                                        <button
                                            onClick={() => navigate(`/game/${lastLesson.id}/${lastLesson.microLessonId}?start=${lastLesson.savedIndex}&type=${lastLesson.savedType?.toUpperCase()}`)}
                                            className="btn game-btn-primary px-4 py-2 fw-bold smallest ls-1"
                                        >
                                            ▶ RESUME NOW
                                        </button>
                                    </div>
                                    <i className="bi bi-play-fill position-absolute end-0 bottom-0 opacity-5" style={{ fontSize: '120px', transform: 'translate(20%, 20%)', color: '#111827' }}></i>
                                </div>
                            ) : (
                                <div className="py-5 text-center rounded-4" style={{ backgroundColor: '#F9FAFB', border: '1px dashed #D1D5DB' }}>
                                    <div className="mb-3"><i className="bi bi-mortarboard-fill text-muted" style={{ fontSize: '40px' }}></i></div>
                                    <p className="text-muted smallest fw-bold uppercase ls-1 mb-3">No active lesson found</p>
                                    <button onClick={() => navigate('/courses')} className="btn btn-slate rounded-3 px-4 py-2 fw-bold smallest ls-1">
                                        EXPLORE LESSONS
                                    </button>
                                </div>
                            )}
                        </section>

                        {/* ACHIEVEMENTS PREVIEW */}
                        <section className="mb-5 text-start">
                            <div className="d-flex justify-content-between align-items-end mb-4">
                                <h6 className="fw-bold text-uppercase text-muted smallest ls-2 mb-0">Mastery Collection</h6>
                                <Link to="/achievements" className="smallest fw-bold text-warning text-decoration-none ls-1">VIEW ALL <i className="bi bi-arrow-right"></i></Link>
                            </div>
                            <div className="row g-3">
                                {ALL_TROPHIES.slice(0, 3).map(trophy => {
                                    const isEarned = (userData?.trophies || []).includes(trophy.id);
                                    return (
                                        <div key={trophy.id} className="col-4">
                                            <div 
                                                onClick={() => navigate('/achievements')}
                                                className={`p-3 rounded-4 text-center transition-all hover-lift ${isEarned ? 'bg-white shadow-sm border border-warning' : 'bg-light grayscale border-dashed border-2'}`}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                <TrophyIcon 
                                                    rarity={isEarned ? trophy.rarity as any : 'locked'} 
                                                    size={42} 
                                                    animate={isEarned}
                                                    color={trophy.color}
                                                />
                                                <p className={`smallest fw-bold mb-0 mt-2 text-truncate ${isEarned ? 'text-dark' : 'text-muted'}`}>{trophy.title.split(' (')[0]}</p>
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
                                    { to: '/history', icon: 'bi-bank2', title: 'Ḓivhazwakale (History)', sub: 'Learn about Venda heritage' },
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

                    <aside className="col-lg-5">
                        <div className="ps-lg-4 text-start">

                            {/* RANK CARD - LIGHT THEME */}
                            <div className="mb-4 p-4 rounded-4 shadow-sm position-relative overflow-hidden bg-white border tour-stats-card"
                                style={{ borderColor: '#E2E8F0' }}>
                                <h6 className="fw-bold smallest ls-2 uppercase mb-4 text-muted">Your Rank</h6>

                                <div className="d-flex align-items-center gap-3 mb-4">
                                    <div className="d-flex align-items-center justify-content-center rounded-circle"
                                        style={{ width: 56, height: 56, backgroundColor: badge.color + '15', border: `2px solid ${badge.color}` }}>
                                        <i className={`bi ${badge.icon}`} style={{ fontSize: '28px', color: badge.color }}></i>
                                    </div>
                                    <div>
                                        <h4 className="fw-bold mb-0 text-slate">Level {stats.level}</h4>
                                        <span className="fw-bold smallest ls-1" style={{ color: badge.color }}>{badge.name}</span>
                                    </div>
                                </div>

                                {/* XP Progress */}
                                <div className="mb-3">
                                    <div className="d-flex justify-content-between mb-2">
                                        <span className="smallest fw-bold ls-1 text-muted">XP PROGRESS</span>
                                        <span className="smallest fw-bold ls-1 text-warning">{stats.progress}%</span>
                                    </div>
                                    <div style={{ height: 8, borderRadius: 10, backgroundColor: '#F1F5F9' }}>
                                        <div style={{
                                            width: `${stats.progress}%`, height: '100%', borderRadius: 10,
                                            background: 'linear-gradient(90deg, #FACC15, #F59E0B)',
                                            transition: 'width 0.8s ease'
                                        }}></div>
                                    </div>
                                    <p className="smallest mt-2 mb-0 text-muted">
                                        {stats.pointsInCurrentLevel} / {stats.pointsForNextLevel} XP to Level {stats.level + 1}
                                    </p>
                                </div>

                                {/* Course Progress */}
                                <div className="pt-3" style={{ borderTop: '1px solid #F1F5F9' }}>
                                    <div className="d-flex justify-content-between mb-2">
                                        <span className="smallest fw-bold ls-1 text-muted">LANGUAGE PROGRESS</span>
                                        <span className="smallest fw-bold ls-1 text-slate">{overallProgressPercentage}%</span>
                                    </div>
                                    <div style={{ height: 8, borderRadius: 10, backgroundColor: '#F1F5F9' }}>
                                        <div style={{
                                            width: `${overallProgressPercentage}%`, height: '100%', borderRadius: 10,
                                            backgroundColor: '#10B981',
                                            transition: 'width 0.8s ease'
                                        }}></div>
                                    </div>
                                    <p className="smallest mt-2 mb-0 text-muted">
                                        {completedMlsCount} / {totalMlsCount} micro-lessons completed
                                    </p>
                                </div>

                                {/* Motivation message */}
                                <div className="mt-4 p-3 rounded-3" style={{ backgroundColor: '#F8FAFC' }}>
                                    <p className="mb-0 small fw-bold" style={{ color: motivation.color }}>{motivation.msg}</p>
                                </div>
                            </div>



                            {/* TOP LEARNERS */}
                            <div className="p-4 rounded-4 border" style={{ backgroundColor: '#F9FAFB' }}>
                                <h6 className="fw-bold text-uppercase text-muted smallest ls-2 mb-4">Top Learners</h6>
                                <div className="list-group list-group-flush mb-4">
                                    {topLearners.map((learner, index) => (
                                        <div key={learner.id} className="list-group-item bg-transparent border-0 px-0 py-2 d-flex align-items-center">
                                            <span className="me-3 d-flex align-items-center justify-content-center" style={{ width: 24 }}>
                                                {index === 0 ? <i className="bi bi-trophy-fill text-warning"></i> :
                                                    index === 1 ? <i className="bi bi-trophy-fill text-secondary"></i> :
                                                        index === 2 ? <i className="bi bi-trophy-fill" style={{ color: '#CD7F32' }}></i> :
                                                            <span className="fw-bold text-muted small">{index + 1}</span>}
                                            </span>
                                            <span className={`flex-grow-1 smallest ls-1 ${learner.id === auth.currentUser?.uid ? 'fw-bold text-dark' : ''}`}>
                                                {learner.username || 'Anonymous'}
                                                {learner.id === auth.currentUser?.uid && <i className="bi bi-star-fill ms-1 text-warning"></i>}
                                            </span>
                                            <span className="fw-bold smallest ls-1" style={{ color: '#F59E0B' }}>{learner.points} LP</span>
                                        </div>
                                    ))}
                                </div>
                                <Link to="/muvhigo" className="btn btn-outline-slate w-100 py-2 fw-bold ls-1 smallest uppercase rounded-3">
                                    FULL LEADERBOARD
                                </Link>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>

            <style>{`
                .ls-tight { letter-spacing: -1.5px; }
                .ls-1 { letter-spacing: 1px; }
                .ls-2 { letter-spacing: 2px; }
                .smallest { font-size: 10px; font-family: 'Poppins', sans-serif; }
                .uppercase { text-transform: uppercase; }
                
                .transition-all { transition: all 0.2s ease-in-out; }
                .hover-lift:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,.08); }
                
                .game-btn-primary { 
                    background-color: #FACC15 !important; 
                    color: #1e293b !important; 
                    border: none !important; 
                    border-radius: 8px; 
                    box-shadow: 0 3px 0 #EAB308 !important; 
                }
                .game-btn-primary:active { transform: translateY(2px); box-shadow: 0 1px 0 #EAB308 !important; }

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
            `}</style>
        </div>
    );
};

export default Home;