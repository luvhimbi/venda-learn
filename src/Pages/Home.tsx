import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db } from '../services/firebaseConfig';
import { doc, getDoc, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { getBadgeDetails, getLevelStats } from "../services/levelUtils.ts";

interface Lesson {
    id: string;
    title: string;
    vendaTitle: string;
    difficulty: string;
}

interface DailyWord {
    word: string;
    meaning: string;
    explanation: string;
    example: string;
}

const Home: React.FC = () => {
    const navigate = useNavigate();

    // User & Content States
    const [userData, setUserData] = useState({
        username: 'Mufunzi',
        points: 0,
        streak: '0'
    });
    const [dbLessons, setDbLessons] = useState<Lesson[]>([]);
    const [topLearners, setTopLearners] = useState<any[]>([]);
    const [dailyWord, setDailyWord] = useState<DailyWord | null>(null);
    const [loading, setLoading] = useState(true);
    const [isLoggedOut, setIsLoggedOut] = useState(false);

    // Derived State
    const stats = getLevelStats(userData.points);
    const badge = getBadgeDetails(stats.level);
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setIsLoggedOut(false);
                try {
                    // 1. Fetch User Data with Numeric Enforcement
                    const userDoc = await getDoc(doc(db, "users", user.uid));
                    if (userDoc.exists()) {
                        const data = userDoc.data();

                        // Force conversion to Number to avoid stale string data
                        const actualPoints = Number(data.points || 0);

                        setUserData({
                            username: data.username || 'Mufunzi',
                            points: actualPoints,
                            streak: data.streak || '0'
                        });

                        console.log("Fetched actual points:", actualPoints); // Debugging
                    }

                    // 2. Fetch Lessons
                    const lessonsSnapshot = await getDocs(collection(db, "lessons"));
                    const lessonsList = lessonsSnapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    })) as Lesson[];
                    setDbLessons(lessonsList);

                    // 3. Fetch Leaderboard - Correcting the Query
                    // We must cast the query to pull the latest points accurately
                    const q = query(collection(db, "users"), orderBy("points", "desc"), limit(3));
                    const leaderSnapshot = await getDocs(q);
                    setTopLearners(leaderSnapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data(),
                        points: Number(doc.data().points || 0) // Ensure leaderboard shows numbers too
                    })));

                    // 4. Word of the Day Logic...
                    const today = new Date().toISOString().split('T')[0];
                    const wordSnap = await getDoc(doc(db, "dailyWords", today));
                    if (wordSnap.exists()) {
                        setDailyWord(wordSnap.data() as DailyWord);
                    } else {
                        setDailyWord({
                            word: "Vhuthu",
                            meaning: "Humanity",
                            explanation: "The Venda concept of compassion and respect towards others.",
                            example: "Muthu u vhonala nga vhuthu hawe."
                        });
                    }

                } catch (err) {
                    console.error("Error fetching data:", err);
                }
                setLoading(false);
            } else {
                setIsLoggedOut(true);
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, []);


// this is to display the difficulty in the lessons

    const getDifficultyStyle = (difficulty: string) => {
        switch (difficulty?.toLowerCase()) {
            case 'easy': return { color: 'success', icon: '🌱' };
            case 'medium': return { color: 'warning', icon: '🔥' };
            case 'hard': return { color: 'danger', icon: '🏆' };
            default: return { color: 'primary', icon: '📚' };
        }
    };

    if (loading) return (
        <div className="d-flex justify-content-center align-items-center min-vh-100 bg-light">
            <div className="spinner-border text-primary" role="status"></div>
        </div>
    );

    if (isLoggedOut) return (
        <div className="container py-5 text-center">
            <div className="my-5 animate__animated animate__fadeIn">
                <div className="display-1 mb-4">🐘</div>
                <h1 className="fw-bold display-4">Ndaa!</h1>
                <p className="lead text-muted mb-5">Welcome to VendaLearn. Please sign in to track your progress.</p>
                <div className="d-flex justify-content-center gap-3">
                    <Link to="/login" className="btn btn-primary btn-lg px-5 rounded-pill shadow">Dzhena (Login)</Link>
                    <Link to="/register" className="btn btn-outline-primary btn-lg px-5 rounded-pill">Ṅwalisani</Link>
                </div>
            </div>
        </div>
    );

    return (
        <div className="container py-4 px-md-5 bg-light min-vh-100 animate__animated animate__fadeIn">
            {/* Header */}
            <div className="row mb-4 align-items-center">
                <div className="col-md-6">
                    <h2 className="fw-bold mb-0">Ndaa, {userData.username}!</h2>
                    <p className="text-muted small">Kha ri gude Tshivenda (Let's learn Tshivenda)</p>
                </div>
                <div className="col-md-6 d-flex justify-content-md-end gap-3 mt-3 mt-md-0">
                    <div className="bg-white px-3 py-2 rounded-pill shadow-sm border d-flex align-items-center">
                        <span className="me-2">💎</span> <strong>{userData.points} LP</strong>
                    </div>
                    <div className="bg-white px-3 py-2 rounded-pill shadow-sm border d-flex align-items-center">
                        <span className="me-2">🔥</span> <strong>{userData.streak} Streak</strong>
                    </div>
                </div>
            </div>

            <div className="row">
                {/* Main Content: Lessons */}
                <div className="col-lg-8">
                    <h4 className="fw-bold mb-3">Tshigwada tsha pfunzo (Lessons)</h4>
                    <div className="row g-4">
                        {dbLessons.map((lesson) => {
                            const style = getDifficultyStyle(lesson.difficulty);
                            return (
                                <div key={lesson.id} className="col-md-6">
                                    <div className="card h-100 border-0 shadow-sm overflow-hidden rounded-4 transition-all hover-shadow">
                                        <div className="card-body p-4">
                                            <span className={`badge bg-${style.color} bg-opacity-10 text-${style.color} mb-2 px-3 py-2`}>
                                                {style.icon} {lesson.difficulty}
                                            </span>
                                            <h5 className="fw-bold mb-1">{lesson.title}</h5>
                                            <p className="text-primary small fw-bold mb-3">{lesson.vendaTitle}</p>
                                            <Link to={`/game/${lesson.id}`} className={`btn btn-${style.color} w-100 fw-bold rounded-pill`}>
                                                Thoma (Start)
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Sidebar */}
                <div className="col-lg-4 mt-4 mt-lg-0">

                    {/* Word of the Day Card - Now Links to its own page */}
                    <Link to="/word-of-the-day" className="text-decoration-none text-dark">
                        <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4 border-start border-warning border-4 hover-shadow transition-all">
                            <div className="card-body p-4">
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <span className="badge bg-warning text-dark rounded-pill px-3">Ipfi la duvha</span>
                                    <small className="text-muted" style={{fontSize: '0.7rem'}}>VIEW FULL →</small>
                                </div>
                                <div className="text-center py-2">
                                    <div className="d-flex align-items-center justify-content-center gap-2">
                                        <h2 className="fw-bold text-primary mb-0">{dailyWord?.word}</h2>
                                    </div>
                                    <p className="text-muted mb-0">"{dailyWord?.meaning}"</p>
                                </div>
                                <div className="mt-2 border-top pt-3">
                                    <p className="small text-dark mb-0 text-truncate">
                                        <strong>Context:</strong> {dailyWord?.explanation}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Link>

                    {/* Rank & Progress Card */}
                    <div className="card border-0 shadow-sm p-4 mb-4 bg-primary text-white rounded-4 overflow-hidden position-relative shadow-lg">
                        <div className="position-relative z-index-1">
                            <div className="d-flex justify-content-between align-items-start mb-2">
                                <div>
                                    <div className="badge bg-white text-primary rounded-pill px-3 py-2 mb-2 shadow-sm">
                                        {badge.icon} {badge.name}
                                    </div>
                                    <h3 className="fw-bold mb-0">Level {stats.level}</h3>
                                </div>
                                <div className="text-end">
                                    <span className="fw-bold">{stats.pointsInCurrentLevel}</span>
                                    <span className="opacity-75 small"> / {stats.pointsForNextLevel} LP</span>
                                </div>
                            </div>
                            <div className="progress mb-2" style={{ height: '12px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '10px' }}>
                                <div className="progress-bar bg-white shadow-sm" style={{ width: `${stats.progress}%`, transition: 'width 1s' }}></div>
                            </div>
                            <small className="opacity-75">{stats.pointsForNextLevel - stats.pointsInCurrentLevel} LP to Level {stats.level + 1}</small>
                        </div>
                        <div className="position-absolute end-0 bottom-0 opacity-10" style={{ fontSize: '6rem', transform: 'translate(10%, 20%)' }}>🐘</div>
                    </div>

                    {/* Leaderboard */}
                    <div className="card border-0 shadow-sm p-4 rounded-4">
                        <h5 className="fw-bold mb-3">Muvhigo (Top 3)</h5>
                        {topLearners.map((learner, index) => (
                            <div key={learner.id} className="d-flex align-items-center mb-3">
                                <div className="me-3 fw-bold text-muted" style={{width: '20px'}}>{index + 1}</div>
                                <div className="rounded-circle bg-light d-flex align-items-center justify-content-center me-3" style={{width: '35px', height: '35px', fontSize: '0.8rem'}}>
                                    {learner.username?.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-grow-1 small fw-bold text-truncate">{learner.username}</div>
                                <div className="small text-primary fw-bold">{learner.points} LP</div>
                            </div>
                        ))}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Home;