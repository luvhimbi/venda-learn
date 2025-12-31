import React, { useEffect, useState } from 'react';
import { db, auth } from '../services/firebaseConfig';
import { collection, getDocs, doc, getDoc, query, orderBy } from 'firebase/firestore';
import { Link } from 'react-router-dom';

const Courses: React.FC = () => {
    const [lessons, setLessons] = useState<any[]>([]);
    const [completedIds, setCompletedIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Fetch lessons ordered by a 'sequence' or 'order' field
                // Ensure your Firestore documents have a numeric 'order' field (e.g., 1, 2, 3)
                const q = query(collection(db, "lessons"), orderBy("order", "asc"));
                const querySnapshot = await getDocs(q);
                const lessonsData = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
                setLessons(lessonsData);

                // 2. Fetch user's completed lessons
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
    }, []);

    const getDifficultyColor = (d: string) => {
        if (d?.toLowerCase() === 'easy') return 'success';
        if (d?.toLowerCase() === 'medium') return 'warning';
        return 'danger';
    };

    if (loading) return (
        <div className="d-flex justify-content-center align-items-center min-vh-100">
            <div className="spinner-border text-primary" role="status"></div>
        </div>
    );

    return (
        <div className="container py-5 animate__animated animate__fadeIn">
            <div className="mb-5">
                <Link to="/" className="btn btn-link p-0 text-decoration-none fw-bold text-primary">
                    ← MURAHU (BACK HOME)
                </Link>
                <h1 className="fw-bold mt-2 display-5">Pfunzo Dzoothe</h1>
                <p className="text-muted lead">Complete lessons in order to unlock new content.</p>
            </div>

            <div className="row g-4">
                {lessons.map((lesson, index) => {
                    const isDone = completedIds.includes(lesson.id);

                    // --- LOCK LOGIC ---
                    // A lesson is UNLOCKED if:
                    // 1. It is the very first lesson (index === 0)
                    // 2. The previous lesson (index - 1) is in the completedIds array
                    const isUnlocked = index === 0 || completedIds.includes(lessons[index - 1].id);

                    return (
                        <div key={lesson.id} className="col-md-6 col-lg-4">
                            <div className={`card h-100 border-0 shadow-sm rounded-4 overflow-hidden transition-all ${!isUnlocked ? 'opacity-75' : 'hover-shadow'}`}>

                                {/* Lock Overlay for locked lessons */}
                                {!isUnlocked && (
                                    <div className="position-absolute w-100 h-100 d-flex align-items-center justify-content-center z-2 rounded-4"
                                         style={{ backgroundColor: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(2px)' }}>
                                        <div className="text-center">
                                            <div className="h1 mb-0">🔒</div>
                                            <small className="fw-bold text-muted">Complete previous lesson to unlock</small>
                                        </div>
                                    </div>
                                )}

                                <div className={`card-body p-4 ${isDone ? 'bg-light' : ''}`}>
                                    <div className="d-flex justify-content-between align-items-start mb-3">
                                        <span className={`badge bg-${getDifficultyColor(lesson.difficulty)} bg-opacity-10 text-${getDifficultyColor(lesson.difficulty)} px-3 py-2`}>
                                            {lesson.difficulty}
                                        </span>
                                        {isDone && (
                                            <span className="badge bg-success rounded-pill px-3 py-2 shadow-sm">
                                                ✓ Completed
                                            </span>
                                        )}
                                    </div>

                                    <div className="mb-4">
                                        <small className="text-muted fw-bold text-uppercase ls-1">Lesson {index + 1}</small>
                                        <h5 className="fw-bold mb-1">{lesson.title}</h5>
                                        <p className="text-primary small fw-bold">{lesson.vendaTitle}</p>
                                    </div>

                                    {isUnlocked ? (
                                        <Link
                                            to={`/game/${lesson.id}`}
                                            className={`btn ${isDone ? 'btn-outline-primary' : 'btn-primary'} w-100 rounded-pill fw-bold py-2`}
                                        >
                                            {isDone ? 'Review Lesson' : 'Thoma (Start)'}
                                        </Link>
                                    ) : (
                                        <button className="btn btn-secondary w-100 rounded-pill fw-bold py-2 disabled" disabled>
                                            Locked
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Courses;