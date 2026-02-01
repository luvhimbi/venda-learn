import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db } from '../services/firebaseConfig';
import { doc, getDoc, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { getBadgeDetails, getLevelStats } from "../services/levelUtils.ts";
import InstallBanner from '../components/InstallBanner';

const Home: React.FC = () => {
    const navigate = useNavigate();

    const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
    const [userData, setUserData] = useState<any>(null);
    const [lastLesson, setLastLesson] = useState<any>(null);
    const [topLearners, setTopLearners] = useState<any[]>([]);
    const [dailyWord, setDailyWord] = useState<any>(null);
    const [totalLessonsCount, setTotalLessonsCount] = useState(0);
    const [loading, setLoading] = useState(true);

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
                    const userDoc = await getDoc(doc(db, "users", user.uid));
                    if (userDoc.exists()) {
                        const data = userDoc.data();
                        setUserData({ ...data, uid: user.uid });

                        if (data.lastLessonId) {
                            const lessonSnap = await getDoc(doc(db, "lessons", data.lastLessonId));
                            if (lessonSnap.exists()) {
                                setLastLesson({ id: lessonSnap.id, ...lessonSnap.data() });
                            }
                        }
                    }

                    const lessonsSnap = await getDocs(collection(db, "lessons"));
                    setTotalLessonsCount(lessonsSnap.size);

                    const q = query(collection(db, "users"), orderBy("points", "desc"), limit(5));
                    const leaderSnapshot = await getDocs(q);
                    setTopLearners(leaderSnapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data(),
                        points: Number(doc.data().points || 0)
                    })));

                    // Fetch Word of the Day
                    const today = new Date().toISOString().split('T')[0];
                    const wordSnap = await getDoc(doc(db, "dailyWords", today));
                    setDailyWord(wordSnap.exists() ? wordSnap.data() : { word: "Vhuthu", meaning: "Humanity" });

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
            <div className="spinner-border" style={{ color: '#FACC15' }} role="status"></div>
        </div>
    );

    if (!isLoggedIn) {
        return (
            <div className="min-vh-100 bg-white d-flex align-items-center justify-content-center px-4">
                <div className="text-center" style={{ maxWidth: '600px' }}>
                    <div className="d-inline-flex align-items-center justify-content-center rounded-4 mb-4"
                         style={{ width: '64px', height: '64px', backgroundColor: '#FACC15' }}>
                        <span className="fw-bold fs-2 text-dark">V</span>
                    </div>
                    <h1 className="fw-bold text-dark mb-3 ls-tight">Learn Tshivenda.</h1>
                    <p className="text-muted mb-5 small ls-1">Join the community preserving the heart of Venda through gamified education.</p>
                    <div className="d-grid gap-3 d-sm-flex justify-content-center">
                        <button onClick={() => navigate('/register')} className="btn game-btn-primary px-5 py-3 fw-bold">START LEARNING</button>
                        <button onClick={() => navigate('/login')} className="btn btn-outline-dark border-2 px-5 py-3 fw-bold rounded-3 smallest uppercase ls-1">LOG IN</button>
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

    return (
        <div className="bg-white min-vh-100 py-5">
            <div className="container" style={{ maxWidth: '1100px' }}>

                <InstallBanner />

                {/* HEADER - Metadata title used here to satisfy TS without ruining design */}
                <header
                    className="row align-items-center mb-5 pb-4 border-bottom g-0"
                    title={dailyWord ? `Today's Word: ${dailyWord.word}` : 'VendaLearn'}
                >
                    <div className="col-8 text-start">
                        <h2 className="fw-bold text-dark mb-0 ls-tight">{getVendaGreeting()}, {userData?.username || 'Learner'}</h2>
                        <span className="text-muted smallest fw-bold text-uppercase ls-1">Kha ri gude Tshivenda</span>
                    </div>
                    <div className="col-4 d-flex justify-content-end gap-3">
                        <div className="text-center">
                            <i className="bi bi-gem text-warning d-block small"></i>
                            <span className="fw-bold smallest ls-1">{userData?.points || 0} LP</span>
                        </div>
                        <div className="text-center">
                            <i className="bi bi-fire text-danger d-block small"></i>
                            <span className="fw-bold smallest ls-1">{userData?.streak || 0}</span>
                        </div>
                    </div>
                </header>

                <div className="row g-5">
                    {/* PRIMARY COLUMN */}
                    <main className="col-lg-7">

                        {/* RESUME PROGRESS SECTION */}
                        <section className="mb-5 text-start">
                            <h6 className="fw-bold text-uppercase text-muted smallest ls-2 mb-4">Bvelelani Phanda (Continue)</h6>
                            {lastLesson ? (
                                <div className="p-4 rounded-4 border-start border-4 transition-all hover-bg-light position-relative overflow-hidden"
                                     style={{ borderColor: '#FACC15', backgroundColor: '#FAFAFA' }}>
                                    <div className="position-relative z-1">
                                        <p className="smallest fw-bold text-warning uppercase ls-1 mb-1">Last Active Lesson</p>
                                        <h3 className="fw-bold mb-1 text-dark">{lastLesson.title}</h3>
                                        <p className="text-muted small mb-4">{lastLesson.vendaTitle}</p>
                                        <button
                                            onClick={() => navigate(`/game/${lastLesson.id}`)}
                                            className="btn game-btn-primary px-4 py-2 fw-bold smallest ls-1"
                                        >
                                            RESUME NOW
                                        </button>
                                    </div>
                                    <i className="bi bi-play-fill position-absolute end-0 bottom-0 opacity-10" style={{ fontSize: '120px', transform: 'translate(20%, 20%)' }}></i>
                                </div>
                            ) : (
                                <div className="py-5 text-center border rounded-4 border-dashed">
                                    <p className="text-muted smallest fw-bold uppercase ls-1 mb-3">No active lesson found</p>
                                    <button onClick={() => navigate('/courses')} className="btn btn-dark rounded-3 px-4 py-2 fw-bold smallest ls-1">EXPLORE LESSONS</button>
                                </div>
                            )}
                        </section>

                        {/* NAVIGATIONAL LINKS */}
                        <section className="text-start">
                            <h6 className="fw-bold text-uppercase text-muted smallest ls-2 mb-4">Focus Areas</h6>
                            <div className="d-grid gap-3">
                                <Link to="/courses" className="text-decoration-none d-block p-4 border rounded-4 transition-all hover-bg-light">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <div>
                                            <h6 className="fw-bold text-dark mb-1">Courses & Catalog</h6>
                                            <p className="smallest text-muted mb-0 uppercase ls-1">Browse all lessons</p>
                                        </div>
                                        <i className="bi bi-chevron-right text-muted"></i>
                                    </div>
                                </Link>
                                <Link to="/history" className="text-decoration-none d-block p-4 border rounded-4 transition-all hover-bg-light">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <div>
                                            <h6 className="fw-bold text-dark mb-1">Ḓivhazwakale (History)</h6>
                                            <p className="smallest text-muted mb-0 uppercase ls-1">Learn about Venda heritage</p>
                                        </div>
                                        <i className="bi bi-chevron-right text-muted"></i>
                                    </div>
                                </Link>
                            </div>
                        </section>
                    </main>

                    {/* SIDEBAR */}
                    <aside className="col-lg-5">
                        <div className="ps-lg-4 text-start">

                            {/* RANK STATUS CARD */}
                            <div className="mb-4 p-4 rounded-4 border bg-white shadow-sm">
                                <h6 className="fw-bold text-uppercase text-muted smallest ls-2 mb-4">Rank Status</h6>
                                <div className="d-flex align-items-center gap-3 mb-4">
                                    <span className="fs-1">{badge.icon}</span>
                                    <div>
                                        <h5 className="fw-bold mb-0">Level {stats.level}</h5>
                                        <span className="text-warning fw-bold smallest uppercase ls-1">{badge.name}</span>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <div className="d-flex justify-content-between mb-2">
                                        <span className="smallest fw-bold text-muted uppercase ls-1">Experience</span>
                                        <span className="smallest fw-bold ls-1 text-dark uppercase">{stats.progress}%</span>
                                    </div>
                                    <div className="progress-container">
                                        <div className="progress-bar-fill experience-bar" style={{ width: `${stats.progress}%` }}></div>
                                    </div>
                                </div>

                                <div className="pt-3 border-top">
                                    <div className="d-flex justify-content-between mb-2">
                                        <span className="smallest fw-bold text-muted uppercase ls-1">Course Progress</span>
                                        <span className="smallest fw-bold ls-1 text-dark uppercase">{courseProgressPercentage}%</span>
                                    </div>
                                    <div className="progress-container">
                                        <div className="progress-bar-fill course-bar" style={{ width: `${courseProgressPercentage}%` }}></div>
                                    </div>
                                </div>
                            </div>

                            {/* LEADERBOARD */}
                            <div className="p-4 rounded-4 border">
                                <h6 className="fw-bold text-uppercase text-muted smallest ls-2 mb-4">Top Learners</h6>
                                <div className="list-group list-group-flush mb-4">
                                    {topLearners.map((learner, index) => (
                                        <div key={learner.id} className="list-group-item bg-transparent border-0 px-0 py-2 d-flex align-items-center">
                                            <span className="me-3 smallest fw-bold text-muted" style={{ width: '20px' }}>{index + 1}</span>
                                            <span className={`flex-grow-1 smallest ls-1 ${learner.uid === auth.currentUser?.uid ? 'fw-bold text-dark' : ''}`}>
                                                {learner.username}
                                            </span>
                                            <span className="fw-bold smallest ls-1 text-warning">{learner.points} LP</span>
                                        </div>
                                    ))}
                                </div>
                                <Link to="/muvhigo" className="btn btn-outline-dark w-100 py-2 fw-bold ls-1 smallest uppercase">LEADERBOARD</Link>
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
                
                .progress-container {
                    width: 100%; height: 8px; background-color: #F3F4F6; border-radius: 10px; overflow: hidden;
                }
                .progress-bar-fill {
                    height: 100%; border-radius: 10px; transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .experience-bar { background-color: #FACC15; }
                .course-bar { background-color: #111827; }

                .hover-bg-light:hover { background-color: #fafafa; transform: translateX(5px); }
                .transition-all { transition: all 0.2s ease-in-out; }
                
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