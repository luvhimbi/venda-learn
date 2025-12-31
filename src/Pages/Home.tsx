import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db } from '../services/firebaseConfig';
import { doc, getDoc, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { getBadgeDetails, getLevelStats } from "../services/levelUtils.ts";

const Home: React.FC = () => {
    const navigate = useNavigate();

    // User & Content States
    const [userData, setUserData] = useState<any>(null);
    const [lastLesson, setLastLesson] = useState<any>(null);
    const [topLearners, setTopLearners] = useState<any[]>([]);
    const [dailyWord, setDailyWord] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // --- TIME-BASED GREETING LOGIC ---
    const getVendaGreeting = () => {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) return "Ndi Matsheloni"; // 05:00 - 11:59
        if (hour >= 12 && hour < 17) return "Ndi Masiari";   // 12:00 - 16:59
        if (hour >= 17 && hour <= 23) return "Ndi Madekwana"; // 17:00 - 23:59
        return "Ndi Madaucha";                               // 00:00 - 04:59
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    // 1. Fetch User Data
                    const userDoc = await getDoc(doc(db, "users", user.uid));
                    if (userDoc.exists()) {
                        const data = userDoc.data();
                        setUserData({ ...data, uid: user.uid });

                        // 2. Fetch the specific lesson they were last on
                        if (data.lastLessonId) {
                            const lessonSnap = await getDoc(doc(db, "lessons", data.lastLessonId));
                            if (lessonSnap.exists()) {
                                setLastLesson({ id: lessonSnap.id, ...lessonSnap.data() });
                            }
                        }
                    }

                    // 3. Fetch Leaderboard (Top 5)
                    const q = query(collection(db, "users"), orderBy("points", "desc"), limit(5));
                    const leaderSnapshot = await getDocs(q);
                    setTopLearners(leaderSnapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data(),
                        points: Number(doc.data().points || 0)
                    })));

                    // 4. Fetch Daily Word
                    const today = new Date().toISOString().split('T')[0];
                    const wordSnap = await getDoc(doc(db, "dailyWords", today));
                    if (wordSnap.exists()) {
                        setDailyWord(wordSnap.data());
                    } else {
                        setDailyWord({ word: "Vhuthu", meaning: "Humanity" });
                    }

                } catch (err) {
                    console.error("Error fetching home data:", err);
                }
                setLoading(false);
            } else {
                navigate('/login');
            }
        });
        return () => unsubscribe();
    }, [navigate]);

    if (loading) return (
        <div className="d-flex justify-content-center align-items-center min-vh-100 bg-light">
            <div className="spinner-border text-primary" role="status"></div>
        </div>
    );

    const stats = getLevelStats(userData?.points || 0);
    const badge = getBadgeDetails(stats.level);

    return (
        <div className="container py-4 px-md-5 bg-light min-vh-100 animate__animated animate__fadeIn">
            {/* Header with Dynamic Greeting */}
            <div className="row mb-4 align-items-center">
                <div className="col-md-7">
                    <h2 className="fw-bold mb-0">{getVendaGreeting()} ,{userData?.username || 'Mufunzi'}!</h2>
                    <p className="text-muted small">Continue where you left off in your Tshivenda journey.</p>
                </div>
                <div className="col-md-5 d-flex justify-content-md-end gap-2 mt-3 mt-md-0">
                    <div className="bg-white px-3 py-2 rounded-pill shadow-sm border">
                        <span className="me-1">💎</span> <strong>{userData?.points || 0} LP</strong>
                    </div>
                    <div className="bg-white px-3 py-2 rounded-pill shadow-sm border">
                        <span className="me-1">🔥</span> <strong>{userData?.streak || 0}</strong>
                    </div>
                </div>
            </div>

            <div className="row">
                {/* Main Content: Recent Activity */}
                <div className="col-lg-8">

                    {/* Resume Progress Card */}
                    <div className="mb-4">
                        <h4 className="fw-bold mb-3">Bvelelani phanda (Continue)</h4>
                        {lastLesson ? (
                            <div className="card border-0 shadow-sm rounded-4 bg-primary text-white p-4 position-relative overflow-hidden transition-all hover-shadow">
                                <div className="position-relative z-index-1">
                                    <span className="badge bg-white text-primary mb-2 px-3 py-2">IN PROGRESS</span>
                                    <h3 className="fw-bold mb-1">{lastLesson.title}</h3>
                                    <p className="opacity-75 mb-4">{lastLesson.vendaTitle}</p>
                                    <button
                                        onClick={() => navigate(`/game/${lastLesson.id}`)}
                                        className="btn btn-light rounded-pill px-5 fw-bold shadow-sm"
                                    >
                                        Resume Lesson
                                    </button>
                                </div>
                                <div className="position-absolute end-0 top-50 translate-middle-y opacity-10" style={{fontSize: '8rem', marginRight: '20px'}}>
                                    🐘
                                </div>
                            </div>
                        ) : (
                            <div className="card border-0 shadow-sm rounded-4 p-5 text-center bg-white">
                                <div className="display-4 mb-3">📚</div>
                                <h4>Ready to start learning?</h4>
                                <p className="text-muted mb-4">You haven't started any lessons yet. Browse the catalog to begin!</p>
                                <Link to="/courses" className="btn btn-primary rounded-pill px-5 fw-bold shadow">
                                    Browse Courses
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Quick Access Menu */}
                    <h4 className="fw-bold mb-3">Quick Access</h4>
                    <div className="row g-3">
                        <div className="col-md-6">
                            <Link to="/courses" className="card border-0 shadow-sm p-4 rounded-4 text-center text-decoration-none hover-shadow transition-all bg-white h-100">
                                <div className="display-6 mb-2">📖</div>
                                <h6 className="fw-bold text-dark mb-1">Tshigwada tsha pfunzo</h6>
                                <p className="small text-muted mb-0">All Courses & Lessons</p>
                            </Link>
                        </div>
                        <div className="col-md-6">
                            <Link to="/word-of-the-day" className="card border-0 shadow-sm p-4 rounded-4 text-center text-decoration-none hover-shadow transition-all bg-white h-100">
                                <div className="display-6 mb-2">💡</div>
                                <h6 className="fw-bold text-dark mb-1">Ipfi la duvha</h6>
                                <p className="small text-muted mb-0">Word of the Day: <strong>{dailyWord?.word}</strong></p>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Sidebar: Stats & Leaderboard */}
                <div className="col-lg-4 mt-4 mt-lg-0">

                    {/* Level Progress */}
                    <div className="card border-0 shadow-sm p-4 mb-4 bg-dark text-white rounded-4 position-relative overflow-hidden shadow-lg">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <span className="badge bg-primary px-3 py-2 rounded-pill shadow-sm">{badge.name}</span>
                            <span className="h3 mb-0">{badge.icon}</span>
                        </div>
                        <h5 className="fw-bold mb-1">Level {stats.level}</h5>
                        <div className="progress my-2" style={{ height: '10px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '10px' }}>
                            <div className="progress-bar bg-primary shadow-sm" style={{ width: `${stats.progress}%` }}></div>
                        </div>
                        <div className="d-flex justify-content-between mt-1">
                            <small className="text-muted">{userData?.points || 0} LP Total</small>
                            <small className="text-primary fw-bold">{stats.nextLevelThreshold - (userData?.points || 0)} LP to Level {stats.level + 1}</small>
                        </div>
                    </div>

                    {/* Muvhigo (Leaderboard) */}
                    <div className="card border-0 shadow-sm p-4 rounded-4 bg-white">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h5 className="fw-bold mb-0">Muvhigo (Top 5)</h5>
                            <span className="badge bg-warning text-dark rounded-pill">🏆</span>
                        </div>
                        {topLearners.map((learner, index) => (
                            <div key={learner.id} className={`d-flex align-items-center p-2 mb-2 rounded-3 ${learner.uid === auth.currentUser?.uid ? 'bg-primary bg-opacity-10 border border-primary border-opacity-25' : ''}`}>
                                <div className="me-3 fw-bold text-muted" style={{width: '20px'}}>{index + 1}</div>
                                <div className="flex-grow-1 small fw-bold text-truncate">
                                    {learner.username} {learner.uid === auth.currentUser?.uid && <span className="ms-1 text-primary">(You)</span>}
                                </div>
                                <div className="small text-primary fw-bold">{learner.points} LP</div>
                            </div>
                        ))}
                        <Link to="/muvhigo" className="btn btn-outline-primary btn-sm w-100 rounded-pill mt-3 fw-bold">
                            View Full Leaderboard
                        </Link>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Home;