import React, { useEffect, useState } from 'react';
import { auth } from '../../services/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { fetchLessons, fetchUserData, getMicroLessons } from '../../services/dataCache';

const CourseLessons: React.FC = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const [course, setCourse] = useState<any>(null);
    const [microLessons, setMicroLessons] = useState<any[]>([]);
    const [completedMlIds, setCompletedMlIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        const unsubAuth = onAuthStateChanged(auth, (user) => {
            setIsLoggedIn(!!user);
        });

        const fetchData = async () => {
            try {
                const [lessonsData, userData] = await Promise.all([
                    fetchLessons(),
                    fetchUserData()
                ]);

                const found = lessonsData.find((l: any) => l.id === courseId);
                if (found) {
                    setCourse(found);
                    setMicroLessons(getMicroLessons(found));
                }

                if (userData) {
                    setCompletedMlIds(userData.completedLessons || []);
                }
            } catch (error) {
                console.error("Error fetching course:", error);
            }
            setLoading(false);
        };

        fetchData();
        return () => unsubAuth();
    }, [courseId]);

    const getDifficultyStyle = (d: string) => {
        const diff = d?.toLowerCase();
        if (diff === 'easy') return { color: '#10B981', bg: '#EDFDF5', label: 'MAVHAYI', icon: '🌱' };
        if (diff === 'medium') return { color: '#F59E0B', bg: '#FFFBEB', label: 'VHUKATI', icon: '🦁' };
        return { color: '#EF4444', bg: '#FEF2F2', label: 'VHUḒU', icon: '🔥' };
    };

    if (loading) return (
        <div className="min-vh-100 bg-white d-flex justify-content-center align-items-center">
            <div className="text-center">
                <div className="spinner-border mb-3" style={{ color: '#FACC15', width: 48, height: 48 }}></div>
                <p className="smallest fw-bold text-muted ls-2 text-uppercase">LOADING COURSE...</p>
            </div>
        </div>
    );

    if (!course) return (
        <div className="min-vh-100 bg-white d-flex justify-content-center align-items-center">
            <div className="text-center">
                <div className="display-1 mb-3">📚</div>
                <h4 className="fw-bold text-dark">Course not found</h4>
                <button className="btn btn-dark rounded-pill px-4 mt-3" onClick={() => navigate('/courses')}>Back to Courses</button>
            </div>
        </div>
    );

    const completedCount = microLessons.filter(ml => completedMlIds.includes(ml.id)).length;
    const totalCount = microLessons.length;
    const courseProgress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
    const allDone = completedCount === totalCount && totalCount > 0;
    const diffStyle = getDifficultyStyle(course.difficulty);

    // Sequential unlock: find the highest completed micro lesson index
    const maxCompletedIdx = microLessons.reduce((max: number, ml: any, i: number) =>
        completedMlIds.includes(ml.id) ? i : max, -1);

    return (
        <div className="bg-white min-vh-100">
            {/* HERO HEADER */}
            <div className="position-relative overflow-hidden" style={{
                background: allDone
                    ? 'linear-gradient(135deg, #065F46, #047857)'
                    : 'linear-gradient(135deg, #1e293b, #0f172a)',
                padding: '2rem 1rem 3rem'
            }}>
                {/* Decorative circles */}
                <div className="position-absolute" style={{ width: 200, height: 200, borderRadius: '50%', background: 'rgba(250,204,21,.06)', top: -60, right: -40 }}></div>
                <div className="position-absolute" style={{ width: 120, height: 120, borderRadius: '50%', background: 'rgba(250,204,21,.04)', bottom: -30, left: -20 }}></div>

                <div className="container" style={{ maxWidth: '700px' }}>
                    <button
                        className="btn btn-link text-decoration-none p-0 mb-4 d-flex align-items-center gap-2 fw-bold smallest ls-1 text-uppercase"
                        style={{ color: 'rgba(255,255,255,.6)' }}
                        onClick={() => navigate('/courses')}
                    >
                        <i className="bi bi-arrow-left"></i> All Courses
                    </button>

                    <div className="d-flex align-items-center gap-2 mb-2">
                        <span className="smallest fw-bold ls-1 px-2 py-1 rounded-pill"
                            style={{ color: diffStyle.color, backgroundColor: 'rgba(255,255,255,.1)', border: `1px solid ${diffStyle.color}40` }}>
                            {diffStyle.icon} {diffStyle.label}
                        </span>
                        {allDone && <span className="smallest fw-bold ls-1 text-white" style={{ color: '#6EE7B7' }}>✓ COMPLETED</span>}
                    </div>

                    <h2 className="fw-bold text-white mb-1 ls-tight" style={{ fontSize: '2rem' }}>{course.title}</h2>
                    <p className="mb-3" style={{ color: 'rgba(255,255,255,.5)', fontSize: '0.95rem' }}>{course.vendaTitle}</p>

                    {/* Progress */}
                    <div className="d-flex align-items-center gap-3">
                        <div className="flex-grow-1">
                            <div className="progress" style={{ height: '8px', borderRadius: 10, backgroundColor: 'rgba(255,255,255,.1)' }}>
                                <div className="progress-bar" style={{
                                    width: `${courseProgress}%`,
                                    backgroundColor: allDone ? '#6EE7B7' : '#FACC15',
                                    transition: '0.5s ease',
                                    borderRadius: 10
                                }}></div>
                            </div>
                        </div>
                        <span className="smallest fw-bold" style={{ color: allDone ? '#6EE7B7' : '#FACC15' }}>
                            {completedCount}/{totalCount}
                        </span>
                    </div>
                </div>
            </div>

            {/* MICRO LESSONS PATH */}
            <div className="container py-4" style={{ maxWidth: '700px', marginTop: '-1.5rem' }}>
                <div className="position-relative">
                    {/* Connector line */}
                    <div className="position-absolute" style={{ left: '20px', top: 0, bottom: 0, width: '2px', background: 'linear-gradient(to bottom, #FACC15, #E5E7EB)', zIndex: 0 }}></div>

                    {microLessons.map((ml, index) => {
                        const isDone = completedMlIds.includes(ml.id);
                        const isUnlocked = index <= (maxCompletedIdx + 1);
                        const slideCount = ml.slides?.length || 0;
                        const questionCount = ml.questions?.length || 0;

                        return (
                            <div key={ml.id} className="position-relative mb-4 ps-5 animate__animated animate__fadeInUp" style={{ animationDelay: `${index * 0.08}s` }}>

                                {/* Step Indicator */}
                                <div className="position-absolute start-0 d-flex align-items-center justify-content-center rounded-circle"
                                    style={{
                                        width: '42px', height: '42px', zIndex: 1,
                                        backgroundColor: isDone ? '#10B981' : (isUnlocked ? '#FACC15' : '#E5E7EB'),
                                        border: '3px solid white',
                                        boxShadow: isDone ? '0 0 12px rgba(16,185,129,.3)' : (isUnlocked ? '0 0 12px rgba(250,204,21,.3)' : 'none')
                                    }}>
                                    {isDone ? <i className="bi bi-check-lg text-white fw-bold"></i>
                                        : isUnlocked ? <span className="fw-bold smallest text-dark">{index + 1}</span>
                                            : <i className="bi bi-lock-fill text-muted small"></i>}
                                </div>

                                {/* Micro Lesson Card */}
                                <div className={`p-4 rounded-4 border ${!isUnlocked ? 'opacity-50' : ''}`}
                                    style={{
                                        backgroundColor: isDone ? '#F0FDF4' : 'white',
                                        borderColor: isDone ? '#BBF7D0' : '#E5E7EB',
                                        transition: 'all 0.2s',
                                    }}>
                                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                                        <div className="flex-grow-1">
                                            <div className="d-flex align-items-center gap-2 mb-2">
                                                <span className="smallest fw-bold ls-1 px-2 py-1 rounded-pill"
                                                    style={{ color: '#6B7280', backgroundColor: '#F3F4F6' }}>
                                                    📖 MICRO LESSON {index + 1}
                                                </span>
                                                {isDone && <span className="smallest fw-bold text-success ls-1">✓ DONE</span>}
                                            </div>
                                            <h5 className="fw-bold mb-1 text-dark">{ml.title}</h5>
                                            <div className="d-flex gap-3">
                                                <span className="smallest text-muted fw-bold">📖 {slideCount} slides</span>
                                                <span className="smallest text-muted fw-bold">📝 {questionCount} questions</span>
                                            </div>
                                        </div>

                                        <div className="text-md-end flex-shrink-0">
                                            {isUnlocked ? (
                                                <Link
                                                    to={`/game/${courseId}/${ml.id}`}
                                                    className={`btn ${isDone ? 'btn-outline-dark border-2' : 'game-btn-primary'} px-4 py-2 smallest fw-bold ls-1`}
                                                >
                                                    {isDone ? '🔄 REVIEW' : '▶ THOMA'}
                                                </Link>
                                            ) : (
                                                <span className="smallest fw-bold text-muted ls-1"><i className="bi bi-lock-fill me-1"></i>LOCKED</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Course Complete Celebration */}
                {allDone && (
                    <div className="text-center py-5 animate__animated animate__fadeIn">
                        <div className="display-1 mb-3">🎉</div>
                        <h4 className="fw-bold text-dark mb-2">Course Completed!</h4>
                        <p className="text-muted small">You've mastered all {totalCount} micro lessons in this course.</p>
                        <button className="btn btn-dark rounded-pill px-5 py-2 fw-bold smallest ls-1 mt-2" onClick={() => navigate('/courses')}>
                            BACK TO COURSES
                        </button>
                    </div>
                )}

                {/* Guest Footer */}
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
                    color: #1e293b !important; 
                    border: none !important; 
                    border-radius: 8px; 
                    box-shadow: 0 4px 0 #EAB308 !important; 
                    transition: all 0.2s; 
                }
                .game-btn-primary:active { transform: translateY(2px); box-shadow: 0 2px 0 #EAB308 !important; }
            `}</style>
        </div>
    );
};

export default CourseLessons;



