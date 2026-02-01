import React, { useEffect, useState } from 'react';
import { db, auth } from '../services/firebaseConfig';
import { collection, getDocs, doc, getDoc, query, orderBy } from 'firebase/firestore';
import { Link, useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';

const Courses: React.FC = () => {
    const navigate = useNavigate();
    const [lessons, setLessons] = useState<any[]>([]);
    const [completedIds, setCompletedIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        const unsubAuth = onAuthStateChanged(auth, (user) => {
            setIsLoggedIn(!!user);
        });

        const fetchData = async () => {
            try {
                const q = query(collection(db, "lessons"), orderBy("order", "asc"));
                const querySnapshot = await getDocs(q);
                const lessonsData = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
                setLessons(lessonsData);

                if (auth.currentUser) {
                    const userSnap = await getDoc(doc(db, "users", auth.currentUser.uid));
                    if (userSnap.exists()) {
                        setCompletedIds(userSnap.data().completedLessons || []);
                    }
                }
            } catch (error) {
                console.error("Error fetching courses:", error);
            }
            setLoading(false);
        };
        fetchData();
        return () => unsubAuth();
    }, []);

    const getDifficultyStyle = (d: string) => {
        const diff = d?.toLowerCase();
        if (diff === 'easy') return { color: '#10B981', label: 'MAVHAYI' }; // Green
        if (diff === 'medium') return { color: '#F59E0B', label: 'VHUKATI' }; // Amber
        return { color: '#EF4444', label: 'VHUḒU' }; // Red
    };

    if (loading) return (
        <div className="min-vh-100 bg-white d-flex justify-content-center align-items-center">
            <div className="spinner-border" style={{ color: '#FACC15' }}></div>
        </div>
    );

    return (
        <div className="bg-white min-vh-100 py-5">
            <div className="container" style={{ maxWidth: '800px' }}>

                {/* NAVIGATION */}
                <button
                    className="btn btn-link text-decoration-none p-0 mb-5 d-flex align-items-center gap-2 text-dark fw-bold smallest ls-2 text-uppercase"
                    onClick={() => navigate('/')}
                >
                    <i className="bi bi-arrow-left"></i> Murahu
                </button>

                {/* HEADER */}
                <header className="mb-5 border-bottom pb-4">
                    <p className="smallest fw-bold text-muted mb-1 ls-2 text-uppercase">Tshivenda Learning Path</p>
                    <h2 className="fw-bold mb-0 ls-tight">PFUNZO DZOTHE</h2>
                    {!isLoggedIn && (
                        <div className="mt-3 p-3 bg-light rounded-3 d-flex align-items-center gap-3">
                            <span className="fs-4">🔑</span>
                            <span className="small fw-bold">Sign in to save your progress and unlock advanced lessons.</span>
                        </div>
                    )}
                </header>

                {/* LEARNING PATH LIST */}
                <div className="position-relative">
                    {/* The connector line */}
                    <div className="position-absolute h-100 border-start border-2 opacity-10" style={{ left: '20px', top: '0', zIndex: 0 }}></div>

                    {lessons.map((lesson, index) => {
                        const isDone = completedIds.includes(lesson.id);
                        const isUnlocked = index === 0 || completedIds.includes(lessons[index - 1].id);
                        const diffStyle = getDifficultyStyle(lesson.difficulty);

                        return (
                            <div key={lesson.id} className={`position-relative mb-5 ps-5 animate__animated animate__fadeInUp`} style={{ animationDelay: `${index * 0.1}s` }}>

                                {/* Step Indicator */}
                                <div className={`position-absolute start-0 d-flex align-items-center justify-content-center rounded-circle shadow-sm`}
                                     style={{
                                         width: '42px',
                                         height: '42px',
                                         zIndex: 1,
                                         backgroundColor: isDone ? '#10B981' : (isUnlocked ? '#FACC15' : '#F3F4F6'),
                                         border: '3px solid white'
                                     }}>
                                    {isDone ? <i className="bi bi-check-lg text-white"></i> : (isUnlocked ? <span className="fw-bold smallest">{index + 1}</span> : <i className="bi bi-lock-fill text-muted small"></i>)}
                                </div>

                                {/* Content Row */}
                                <div className={`d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-4 py-2 ${!isUnlocked ? 'opacity-50' : ''}`}>
                                    <div className="flex-grow-1">
                                        <div className="d-flex align-items-center gap-2 mb-1">
                                            <span className="smallest fw-bold ls-1" style={{ color: diffStyle.color }}>{diffStyle.label}</span>
                                            {isDone && <span className="smallest fw-bold text-success ls-1">• COMPLETED</span>}
                                        </div>
                                        <h4 className="fw-bold mb-0 text-dark">{lesson.title}</h4>
                                        <p className="text-muted small mb-0">{lesson.vendaTitle}</p>
                                    </div>

                                    <div className="text-md-end">
                                        {isUnlocked ? (
                                            <Link
                                                to={`/game/${lesson.id}`}
                                                className={`btn ${isDone ? 'btn-outline-dark' : 'game-btn-primary'} px-4 py-2 smallest fw-bold ls-1`}
                                            >
                                                {isDone ? 'REVIEW' : 'THOMA'}
                                            </Link>
                                        ) : (
                                            <span className="smallest fw-bold text-muted ls-1">LOCKED</span>
                                        )}
                                    </div>
                                </div>

                                {/* Separator line for non-card look */}
                                {index !== lessons.length - 1 && <hr className="mt-5 opacity-5" />}
                            </div>
                        );
                    })}
                </div>

                {/* LOGOUT / GUEST STATE FOOTER */}
                {!isLoggedIn && (
                    <footer className="mt-5 pt-5 text-center">
                        <p className="text-muted small mb-4">You are browsing as a guest. Your progress will not be saved.</p>
                        <button onClick={() => navigate('/login')} className="btn btn-dark rounded-pill px-5 py-2 fw-bold smallest ls-1">
                            SIGN IN NOW
                        </button>
                    </footer>
                )}
            </div>

            <style>{`
                .ls-tight { letter-spacing: -1.5px; }
                .ls-1 { letter-spacing: 1px; }
                .ls-2 { letter-spacing: 2px; }
                .smallest { font-size: 11px; }
                
                .game-btn-primary { 
                    background-color: #FACC15 !important; 
                    color: #111827 !important; 
                    border: none !important; 
                    border-radius: 8px; 
                    box-shadow: 0 4px 0 #EAB308 !important; 
                    transition: all 0.2s; 
                }
                .game-btn-primary:active { transform: translateY(2px); box-shadow: 0 2px 0 #EAB308 !important; }
                
                .hover-shadow:hover {
                    transform: translateX(5px);
                    transition: 0.3s ease;
                }
            `}</style>
        </div>
    );
};

export default Courses;