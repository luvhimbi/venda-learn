import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../services/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { getBadgeDetails, getLevelStats } from "../services/levelUtils.ts";
import { updateStreak } from "../services/streakUtils.ts";
import { fetchLessons, fetchTopLearners, fetchDailyWord, refreshUserData } from '../services/dataCache';
import InstallBanner from '../components/InstallBanner';

// --- STREAK MOTIVATION MODAL ---
const StreakModal: React.FC<{ streak: number; onClose: () => void }> = ({ streak, onClose }) => {
    const getMessage = () => {
        if (streak >= 30) return "Thovhele wa Tshivenda! You are a language warrior!";
        if (streak >= 14) return "Incredible discipline! Two weeks strong!";
        if (streak >= 7) return "A full week! You're building a real habit!";
        if (streak >= 3) return "Zwi khou bvelela! You're on fire!";
        return "Great start! Come back tomorrow to keep the flame alive!";
    };
    return (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center z-3 px-3"
            style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
            <div className="text-center p-5 rounded-5 bg-white shadow-lg animate__animated animate__bounceIn" style={{ maxWidth: '400px' }}>
                <div className="mb-3"><i className="bi bi-fire text-danger" style={{ fontSize: '72px' }}></i></div>
                <h1 className="fw-bold display-4 mb-1 ls-tight text-dark">{streak}</h1>
                <p className="fw-bold text-muted ls-1 smallest uppercase mb-3">DAY STREAK</p>
                <p className="text-muted mb-4" style={{ lineHeight: 1.6 }}>{getMessage()}</p>
                <button className="btn game-btn-primary w-100 py-3 fw-bold ls-1" onClick={onClose}>
                    KHA RI YE! (LET'S GO)
                </button>
            </div>
        </div>
    );
};

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
    const [dailyWord, setDailyWord] = useState<any>(null);
    const [totalLessonsCount, setTotalLessonsCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [showStreakModal, setShowStreakModal] = useState(false);

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
                    // Update streak first (must run before fetching user data)
                    const streakResult = await updateStreak(user.uid);
                    if (streakResult?.isNewDay) {
                        setShowStreakModal(true);
                    }

                    // Fetch everything in parallel using the cache layer
                    const [userData, lessons, topLearnersData, dailyWordData] = await Promise.all([
                        refreshUserData(),      // fresh after streak update
                        fetchLessons(),          // cached across pages
                        fetchTopLearners(),      // cached across pages
                        fetchDailyWord(),        // cached for the day
                    ]);

                    if (userData) {
                        setUserData(userData);
                        setTotalLessonsCount(lessons.length);
                        setTopLearners(topLearnersData);
                        setDailyWord(dailyWordData);

                        // Resolve last lesson from cached lessons instead of extra Firestore call
                        if (userData.lastLessonId) {
                            const cached = lessons.find((l: any) => l.id === userData.lastLessonId);
                            if (cached) {
                                setLastLesson({
                                    id: cached.id,
                                    ...cached,
                                    savedIndex: userData.lastProgressIndex || 0,
                                    savedType: userData.lastProgressType || 'slide'
                                });
                            }
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

    if (loading) return (
        <div className="d-flex justify-content-center align-items-center min-vh-100 bg-white">
            <div className="text-center">
                <div className="spinner-border mb-3" style={{ color: '#FACC15', width: 48, height: 48 }} role="status"></div>
                <p className="smallest fw-bold text-muted ls-2 uppercase">LOADING...</p>
            </div>
        </div>
    );

    if (!isLoggedIn) {
        return (
            <div className="min-vh-100 d-flex align-items-center justify-content-center px-4"
                style={{ background: 'linear-gradient(180deg, #111827 0%, #1F2937 60%, #FACC15 100%)' }}>
                <div className="text-center" style={{ maxWidth: '500px' }}>
                    <div className="d-inline-flex align-items-center justify-content-center rounded-4 mb-4"
                        style={{ width: '72px', height: '72px', backgroundColor: '#FACC15' }}>
                        <span className="fw-bold fs-1 text-dark">V</span>
                    </div>
                    <h1 className="fw-bold text-white mb-3 ls-tight" style={{ fontSize: '2.5rem' }}>Learn Tshivenda.</h1>
                    <p className="mb-5 ls-1" style={{ color: 'rgba(255,255,255,.7)' }}>Join the community preserving the heart of Venda through gamified education.</p>
                    <div className="d-grid gap-3 d-sm-flex justify-content-center">
                        <button onClick={() => navigate('/register')} className="btn px-5 py-3 fw-bold rounded-3 ls-1"
                            style={{ backgroundColor: '#FACC15', color: '#111827', boxShadow: '0 4px 0 #EAB308' }}>
                            START LEARNING
                        </button>
                        <button onClick={() => navigate('/login')} className="btn btn-outline-light border-2 px-5 py-3 fw-bold rounded-3 smallest uppercase ls-1">
                            LOG IN
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const stats = getLevelStats(userData?.points || 0);
    const badge = getBadgeDetails(stats.level);
    const completedCount = userData?.completedLessons?.length || 0;
    const courseProgressPercentage = totalLessonsCount > 0
        ? Math.round((completedCount / totalLessonsCount) * 100)
        : 0;
    const motivation = getLevelMotivation(stats.level, stats.progress);

    return (
        <div className="bg-white min-vh-100">
            {/* Streak Popup */}
            {showStreakModal && (
                <StreakModal
                    streak={userData?.streak || 0}
                    onClose={() => setShowStreakModal(false)}
                />
            )}

            {/* DARK HERO HEADER */}
            <div className="px-3 py-5" style={{ background: 'linear-gradient(135deg, #111827, #1F2937)' }}>
                <div className="container" style={{ maxWidth: '1100px' }}>
                    <InstallBanner />
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <h2 className="fw-bold text-white mb-1 ls-tight">{getVendaGreeting()}, {userData?.username || 'Learner'}</h2>
                            <span className="smallest fw-bold ls-2 uppercase" style={{ color: 'rgba(255,255,255,.5)' }}>Kha ri gude Tshivenda</span>
                        </div>
                        <div className="d-flex gap-4">
                            <div className="text-center">
                                <div className="d-inline-flex align-items-center justify-content-center rounded-3 mb-1"
                                    style={{ width: 40, height: 40, backgroundColor: 'rgba(250,204,21,.15)' }}>
                                    <i className="bi bi-gem" style={{ color: '#FACC15' }}></i>
                                </div>
                                <p className="mb-0 smallest fw-bold text-white ls-1">{userData?.points || 0}</p>
                            </div>
                            <div className="text-center">
                                <div className="d-inline-flex align-items-center justify-content-center rounded-3 mb-1"
                                    style={{ width: 40, height: 40, backgroundColor: 'rgba(239,68,68,.15)' }}>
                                    <i className="bi bi-fire" style={{ color: '#EF4444' }}></i>
                                </div>
                                <p className="mb-0 smallest fw-bold text-white ls-1">{userData?.streak || 0}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container py-5" style={{ maxWidth: '1100px' }}>
                <div className="row g-5">
                    <main className="col-lg-7">

                        {/* DAILY WORD */}
                        {dailyWord && (
                            <section className="mb-5">
                                <div className="p-4 rounded-4 position-relative overflow-hidden"
                                    style={{ background: 'linear-gradient(135deg, #FFFBEB, #FEF3C7)', border: '1px solid #FDE68A' }}>
                                    <div className="d-flex align-items-center gap-2 mb-3">
                                        <i className="bi bi-book-half fs-4 text-warning"></i>
                                        <span className="smallest fw-bold ls-2 uppercase" style={{ color: '#92400E' }}>WORD OF THE DAY</span>
                                    </div>
                                    <h2 className="fw-bold ls-tight mb-1 text-dark">{dailyWord.word}</h2>
                                    <p className="text-muted fw-bold mb-2">{dailyWord.meaning}</p>
                                    {dailyWord.example && (
                                        <p className="fst-italic small mb-0" style={{ color: '#78350F' }}>"{dailyWord.example}"</p>
                                    )}
                                </div>
                            </section>
                        )}

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
                                        <p className="text-muted small mb-4">{lastLesson.vendaTitle}</p>
                                        <button
                                            onClick={() => navigate(`/game/${lastLesson.id}?start=${lastLesson.savedIndex}&type=${lastLesson.savedType?.toUpperCase()}`)}
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
                                    <button onClick={() => navigate('/courses')} className="btn btn-dark rounded-3 px-4 py-2 fw-bold smallest ls-1">
                                        EXPLORE LESSONS
                                    </button>
                                </div>
                            )}
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

                            {/* RANK CARD */}
                            <div className="mb-4 p-4 rounded-4 shadow-sm position-relative overflow-hidden"
                                style={{ background: 'linear-gradient(135deg, #111827, #1F2937)', color: 'white' }}>
                                <h6 className="fw-bold smallest ls-2 uppercase mb-4" style={{ color: 'rgba(255,255,255,.5)' }}>Your Rank</h6>

                                <div className="d-flex align-items-center gap-3 mb-4">
                                    <div className="d-flex align-items-center justify-content-center rounded-circle"
                                        style={{ width: 56, height: 56, backgroundColor: badge.color + '22', border: `2px solid ${badge.color}` }}>
                                        <i className={`bi ${badge.icon}`} style={{ fontSize: '28px', color: badge.color }}></i>
                                    </div>
                                    <div>
                                        <h4 className="fw-bold mb-0 text-white">Level {stats.level}</h4>
                                        <span className="fw-bold smallest ls-1" style={{ color: badge.color }}>{badge.name}</span>
                                    </div>
                                </div>

                                {/* XP Progress */}
                                <div className="mb-3">
                                    <div className="d-flex justify-content-between mb-2">
                                        <span className="smallest fw-bold ls-1" style={{ color: 'rgba(255,255,255,.5)' }}>XP PROGRESS</span>
                                        <span className="smallest fw-bold ls-1" style={{ color: '#FACC15' }}>{stats.progress}%</span>
                                    </div>
                                    <div style={{ height: 8, borderRadius: 10, backgroundColor: 'rgba(255,255,255,.1)' }}>
                                        <div style={{
                                            width: `${stats.progress}%`, height: '100%', borderRadius: 10,
                                            background: 'linear-gradient(90deg, #FACC15, #F59E0B)',
                                            transition: 'width 0.8s ease'
                                        }}></div>
                                    </div>
                                    <p className="smallest mt-2 mb-0" style={{ color: 'rgba(255,255,255,.4)' }}>
                                        {stats.pointsInCurrentLevel} / {stats.pointsForNextLevel} XP to Level {stats.level + 1}
                                    </p>
                                </div>

                                {/* Course Progress */}
                                <div className="pt-3" style={{ borderTop: '1px solid rgba(255,255,255,.1)' }}>
                                    <div className="d-flex justify-content-between mb-2">
                                        <span className="smallest fw-bold ls-1" style={{ color: 'rgba(255,255,255,.5)' }}>COURSE PROGRESS</span>
                                        <span className="smallest fw-bold ls-1 text-white">{courseProgressPercentage}%</span>
                                    </div>
                                    <div style={{ height: 8, borderRadius: 10, backgroundColor: 'rgba(255,255,255,.1)' }}>
                                        <div style={{
                                            width: `${courseProgressPercentage}%`, height: '100%', borderRadius: 10,
                                            backgroundColor: '#10B981',
                                            transition: 'width 0.8s ease'
                                        }}></div>
                                    </div>
                                    <p className="smallest mt-2 mb-0" style={{ color: 'rgba(255,255,255,.4)' }}>
                                        {completedCount} / {totalLessonsCount} lessons completed
                                    </p>
                                </div>

                                {/* Motivation message */}
                                <div className="mt-4 p-3 rounded-3" style={{ backgroundColor: 'rgba(255,255,255,.05)' }}>
                                    <p className="mb-0 small fw-bold" style={{ color: motivation.color }}>{motivation.msg}</p>
                                </div>
                            </div>

                            {/* STREAK CARD */}
                            <div className="mb-4 p-4 rounded-4 border" style={{ backgroundColor: '#FEF2F2', borderColor: '#FECACA' }}>
                                <div className="d-flex align-items-center justify-content-between mb-2">
                                    <h6 className="fw-bold smallest ls-2 uppercase text-muted mb-0">Daily Streak</h6>
                                    <i className="bi bi-fire text-danger fs-3"></i>
                                </div>
                                <h2 className="fw-bold text-dark mb-1">{userData?.streak || 0} <span className="fs-6 text-muted">days</span></h2>
                                <p className="smallest fw-bold ls-1 mb-0" style={{ color: '#DC2626' }}>
                                    {(userData?.streak || 0) === 0 ? 'Start a streak today!' :
                                        (userData?.streak || 0) >= 7 ? 'Amazing consistency!' :
                                            'Come back tomorrow to keep it going!'}
                                </p>
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
                                <Link to="/muvhigo" className="btn btn-outline-dark w-100 py-2 fw-bold ls-1 smallest uppercase rounded-3">
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
                    color: #111827 !important; 
                    border: none !important; 
                    border-radius: 8px; 
                    box-shadow: 0 3px 0 #EAB308 !important; 
                }
                .game-btn-primary:active { transform: translateY(2px); box-shadow: 0 1px 0 #EAB308 !important; }
            `}</style>
        </div>
    );
};

export default Home;