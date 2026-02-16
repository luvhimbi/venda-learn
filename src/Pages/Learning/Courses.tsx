import React, { useEffect, useState } from 'react';
import { auth } from '../../services/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { useNavigate, Link } from 'react-router-dom';
import { fetchLessons, fetchUserData, getMicroLessons } from '../../services/dataCache';
import { Sprout, Shield, Flame, Key, BookOpen, CheckCircle } from 'lucide-react';

const Courses: React.FC = () => {
    const navigate = useNavigate();
    const [courses, setCourses] = useState<any[]>([]);
    const [completedMlIds, setCompletedMlIds] = useState<string[]>([]);
    const [completedCourseIds, setCompletedCourseIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const coursesPerPage = 5;

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

                const sorted = [...lessonsData].sort((a, b) => {
                    const orderA = a.order ?? 999;
                    const orderB = b.order ?? 999;
                    return orderA - orderB;
                });

                setCourses(sorted);

                if (userData) {
                    setCompletedMlIds(userData.completedLessons || []);
                    setCompletedCourseIds(userData.completedCourses || []);
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
        if (diff === 'easy') return { color: '#10B981', bg: '#EDFDF5', label: 'MAVHAYI', icon: <Sprout size={14} className="me-1" /> };
        if (diff === 'medium') return { color: '#F59E0B', bg: '#FFFBEB', label: 'VHUKATI', icon: <Shield size={14} className="me-1" /> };
        return { color: '#EF4444', bg: '#FEF2F2', label: 'VHUḒU', icon: <Flame size={14} className="me-1" /> };
    };

    const getCourseProgress = (course: any) => {
        const mls = getMicroLessons(course);
        const total = mls.length;
        const completed = mls.filter((ml: any) => completedMlIds.includes(ml.id)).length;
        return { total, completed, percent: total > 0 ? Math.round((completed / total) * 100) : 0 };
    };

    const isCourseComplete = (course: any) => {
        // Check explicit completedCourses array first, then fallback to checking all micro lessons
        if (completedCourseIds.includes(course.id)) return true;
        const { total, completed } = getCourseProgress(course);
        return total > 0 && completed === total;
    };

    if (loading) return (
        <div className="min-vh-100 bg-white d-flex justify-content-center align-items-center">
            <div className="text-center">
                <div className="spinner-border mb-3" style={{ color: '#FACC15', width: 48, height: 48 }}></div>
                <p className="smallest fw-bold text-muted ls-2 text-uppercase">LOADING COURSES...</p>
            </div>
        </div>
    );

    // Count total completed micro lessons and courses
    const totalMlCompleted = completedMlIds.length;
    const totalCoursesCompleted = courses.filter(c => isCourseComplete(c)).length;

    return (
        <div className="bg-white min-vh-100 py-5">
            <div className="container" style={{ maxWidth: '800px' }}>

                {/* NAVIGATION */}
                <button
                    className="btn btn-link text-decoration-none p-0 mb-5 d-flex align-items-center gap-2 text-dark fw-bold smallest ls-1 text-uppercase"
                    onClick={() => navigate('/')}
                >
                    <i className="bi bi-arrow-left"></i> Murahu
                </button>

                {/* HEADER */}
                <header className="mb-5 pb-4">
                    <p className="smallest fw-bold text-muted mb-1 ls-2 text-uppercase">Tshivenda Learning Path</p>
                    <h2 className="fw-bold mb-2 ls-tight" style={{ fontSize: '2rem' }}>PFUNZO DZOTHE</h2>
                    <p className="text-muted small mb-0">
                        {courses.length} courses • {totalCoursesCompleted} completed • {totalMlCompleted} micro lessons done
                    </p>

                    {!isLoggedIn && (
                        <div className="mt-3 p-3 rounded-3 d-flex align-items-center gap-3" style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A' }}>
                            <span className="text-warning"><Key size={24} /></span>
                            <span className="small fw-bold text-dark">Sign in to save your progress and earn points.</span>
                        </div>
                    )}
                </header>

                {/* LEARNING PATH */}
                {(() => {
                    const totalPages = Math.ceil(courses.length / coursesPerPage);
                    const startIdx = (currentPage - 1) * coursesPerPage;
                    const paginatedCourses = courses.slice(startIdx, startIdx + coursesPerPage);

                    // Sequential unlock: find highest index with a completed course
                    const maxCompletedIdx = courses.reduce((max, c, i) =>
                        isCourseComplete(c) ? i : max, -1);

                    return (<>
                        <div className="position-relative">
                            {/* Connector line */}
                            <div className="position-absolute" style={{ left: '20px', top: 0, bottom: 0, width: '2px', background: 'linear-gradient(to bottom, #FACC15, #E5E7EB)', zIndex: 0 }}></div>

                            {paginatedCourses.map((course, pageIdx) => {
                                const index = startIdx + pageIdx;
                                const isDone = isCourseComplete(course);

                                // Course is unlocked if it's the first one, or if any earlier course is complete,
                                // or if the user has started any micro lesson in this course
                                const hasStarted = getMicroLessons(course).some((ml: any) => completedMlIds.includes(ml.id));
                                const isUnlocked = index <= (maxCompletedIdx + 1) || hasStarted;

                                const diffStyle = getDifficultyStyle(course.difficulty);
                                const progress = getCourseProgress(course);
                                const microLessons = getMicroLessons(course);

                                return (
                                    <div key={course.id} className="position-relative mb-4 ps-5 animate__animated animate__fadeInUp" style={{ animationDelay: `${pageIdx * 0.08}s` }}>

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

                                        {/* Course Card */}
                                        <div className={`p-4 rounded-4 border ${!isUnlocked ? 'opacity-50' : ''}`}
                                            style={{
                                                backgroundColor: isDone ? '#F0FDF4' : 'white',
                                                borderColor: isDone ? '#BBF7D0' : '#E5E7EB',
                                                transition: 'all 0.2s',
                                            }}>
                                            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                                                <div className="flex-grow-1">
                                                    <div className="d-flex align-items-center gap-2 mb-2">
                                                        <span className="smallest fw-bold ls-1 px-2 py-1 rounded-pill d-flex align-items-center"
                                                            style={{ color: diffStyle.color, backgroundColor: diffStyle.bg }}>
                                                            {diffStyle.icon} {diffStyle.label}
                                                        </span>
                                                        {isDone && <span className="smallest fw-bold text-success ls-1">✓ COMPLETED</span>}
                                                    </div>
                                                    <h4 className="fw-bold mb-1 text-dark">{course.title}</h4>
                                                    <p className="text-muted small mb-2">{course.vendaTitle}</p>

                                                    {/* Micro lesson count & progress */}
                                                    <div className="d-flex align-items-center gap-3 mb-2">
                                                        <span className="smallest text-muted fw-bold d-flex align-items-center gap-1"><BookOpen size={12} /> {microLessons.length} micro lesson{microLessons.length !== 1 ? 's' : ''}</span>
                                                        <span className="smallest text-muted fw-bold d-flex align-items-center gap-1"><CheckCircle size={12} className="text-success" /> {progress.completed}/{progress.total} done</span>
                                                    </div>

                                                    {/* Progress bar */}
                                                    {isUnlocked && progress.total > 0 && (
                                                        <div className="progress" style={{ height: '6px', borderRadius: 10, backgroundColor: '#F3F4F6' }}>
                                                            <div className="progress-bar" style={{
                                                                width: `${progress.percent}%`,
                                                                backgroundColor: isDone ? '#10B981' : '#FACC15',
                                                                transition: '0.5s ease',
                                                                borderRadius: 10
                                                            }}></div>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="text-md-end flex-shrink-0">
                                                    {isUnlocked ? (
                                                        <Link
                                                            to={`/courses/${course.id}`}
                                                            className={`btn ${isDone ? 'btn-outline-dark border-2' : 'game-btn-primary'} px-4 py-2 smallest fw-bold ls-1`}
                                                        >
                                                            {isDone ? '🔄 REVIEW' : progress.completed > 0 ? '▶ CONTINUE' : '▶ THOMA'}
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

                        {/* PAGINATION */}
                        {totalPages > 1 && (
                            <div className="d-flex justify-content-center align-items-center gap-2 mt-5">
                                <button
                                    className="btn btn-outline-dark border-2 px-3 py-2 fw-bold smallest ls-1 rounded-3"
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage(p => p - 1)}
                                >
                                    ← PREV
                                </button>
                                {[...Array(totalPages)].map((_, i) => (
                                    <button
                                        key={i}
                                        className={`btn px-3 py-2 fw-bold smallest ls-1 rounded-3 ${currentPage === i + 1 ? 'text-dark' : 'btn-outline-secondary'}`}
                                        style={currentPage === i + 1 ? { backgroundColor: '#FACC15', border: 'none', boxShadow: '0 2px 0 #EAB308' } : {}}
                                        onClick={() => setCurrentPage(i + 1)}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                                <button
                                    className="btn btn-outline-dark border-2 px-3 py-2 fw-bold smallest ls-1 rounded-3"
                                    disabled={currentPage === totalPages}
                                    onClick={() => setCurrentPage(p => p + 1)}
                                >
                                    NEXT →
                                </button>
                            </div>
                        )}
                    </>);
                })()}

                {/* Empty State */}
                {courses.length === 0 && (
                    <div className="text-center py-5">
                        <div className="mb-3 text-muted">
                            <BookOpen size={64} strokeWidth={1} />
                        </div>
                        <h4 className="fw-bold text-dark">No courses yet</h4>
                        <p className="text-muted">Check back soon — new courses are being added!</p>
                    </div>
                )}

                {/* GUEST FOOTER */}
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

export default Courses;


