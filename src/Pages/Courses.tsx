import React, { useEffect, useState } from 'react';
import { auth } from '../services/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { useNavigate, Link } from 'react-router-dom';
import { fetchLessons, fetchUserData } from '../services/dataCache';

const Courses: React.FC = () => {
    const navigate = useNavigate();
    const [lessons, setLessons] = useState<any[]>([]);
    const [completedIds, setCompletedIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [lastLessonId, setLastLessonId] = useState<string | null>(null);
    const [lastProgressIndex, setLastProgressIndex] = useState<number>(0);
    const [lastProgressType, setLastProgressType] = useState<string>('');
    const [currentPage, setCurrentPage] = useState(1);
    const lessonsPerPage = 5;

    useEffect(() => {
        const unsubAuth = onAuthStateChanged(auth, (user) => {
            setIsLoggedIn(!!user);
        });

        const fetchData = async () => {
            try {
                // Fetch lessons and user data in parallel using the cache
                const [lessonsData, userData] = await Promise.all([
                    fetchLessons(),
                    fetchUserData()
                ]);

                setLessons(lessonsData);

                if (userData) {
                    setCompletedIds(userData.completedLessons || []);
                    setLastLessonId(userData.lastLessonId || null);
                    setLastProgressIndex(userData.lastProgressIndex || 0);
                    setLastProgressType(userData.lastProgressType || '');
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
        if (diff === 'easy') return { color: '#10B981', bg: '#ECFDF5', label: 'MAVHAYI', icon: '🌱' };
        if (diff === 'medium') return { color: '#F59E0B', bg: '#FFFBEB', label: 'VHUKATI', icon: '🦁' };
        return { color: '#EF4444', bg: '#FEF2F2', label: 'VHUḒU', icon: '🔥' };
    };

    if (loading) return (
        <div className="min-vh-100 bg-white d-flex justify-content-center align-items-center">
            <div className="text-center">
                <div className="spinner-border mb-3" style={{ color: '#FACC15', width: 48, height: 48 }}></div>
                <p className="smallest fw-bold text-muted ls-2 text-uppercase">LOADING COURSES...</p>
            </div>
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
                <header className="mb-5 pb-4">
                    <p className="smallest fw-bold text-muted mb-1 ls-2 text-uppercase">Tshivenda Learning Path</p>
                    <h2 className="fw-bold mb-2 ls-tight" style={{ fontSize: '2rem' }}>PFUNZO DZOTHE</h2>
                    <p className="text-muted small mb-0">{lessons.length} lessons • {completedIds.length} completed</p>

                    {!isLoggedIn && (
                        <div className="mt-3 p-3 rounded-3 d-flex align-items-center gap-3" style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A' }}>
                            <span className="fs-4">🔑</span>
                            <span className="small fw-bold text-dark">Sign in to save your progress and earn points.</span>
                        </div>
                    )}
                </header>

                {/* RESUME BANNER */}
                {lastLessonId && isLoggedIn && (
                    <div className="mb-5 p-4 rounded-4 d-flex align-items-center justify-content-between"
                        style={{ background: 'linear-gradient(135deg, #111827, #1F2937)', color: 'white' }}>
                        <div>
                            <p className="smallest fw-bold ls-2 text-uppercase mb-1" style={{ color: '#FACC15' }}>CONTINUE WHERE YOU LEFT OFF</p>
                            <p className="fw-bold mb-0">{lessons.find(l => l.id === lastLessonId)?.title || 'Last Lesson'}</p>
                        </div>
                        <Link
                            to={`/game/${lastLessonId}?start=${lastProgressIndex}&type=${lastProgressType === 'quiz' ? 'QUIZ' : 'STUDY'}`}
                            className="btn px-4 py-2 fw-bold smallest ls-1 rounded-3"
                            style={{ backgroundColor: '#FACC15', color: '#111827', boxShadow: '0 3px 0 #EAB308' }}
                        >
                            RESUME →
                        </Link>
                    </div>
                )}

                {/* LEARNING PATH */}
                {(() => {
                    const totalPages = Math.ceil(lessons.length / lessonsPerPage);
                    const startIdx = (currentPage - 1) * lessonsPerPage;
                    const paginatedLessons = lessons.slice(startIdx, startIdx + lessonsPerPage);
                    return (<>
                        <div className="position-relative">
                            {/* Connector line */}
                            <div className="position-absolute" style={{ left: '20px', top: 0, bottom: 0, width: '2px', background: 'linear-gradient(to bottom, #FACC15, #E5E7EB)', zIndex: 0 }}></div>

                            {paginatedLessons.map((lesson, pageIdx) => {
                                const index = startIdx + pageIdx;
                                const isDone = completedIds.includes(lesson.id);
                                // Sequential hierarchy: first lesson always unlocked,
                                // subsequent lessons unlock when the previous one is completed
                                const isUnlocked = index === 0 || completedIds.includes(lessons[index - 1]?.id);
                                const diffStyle = getDifficultyStyle(lesson.difficulty);
                                const slideCount = lesson.slides?.length || 0;
                                const questionCount = lesson.questions?.length || 0;

                                return (
                                    <div key={lesson.id} className="position-relative mb-4 ps-5 animate__animated animate__fadeInUp" style={{ animationDelay: `${index * 0.08}s` }}>

                                        {/* Step Indicator */}
                                        <div className="position-absolute start-0 d-flex align-items-center justify-content-center rounded-circle"
                                            style={{
                                                width: '42px', height: '42px', zIndex: 1,
                                                backgroundColor: isDone ? '#10B981' : (isUnlocked ? '#FACC15' : '#F3F4F6'),
                                                border: '3px solid white',
                                                boxShadow: isDone ? '0 0 12px rgba(16,185,129,.3)' : (isUnlocked ? '0 0 12px rgba(250,204,21,.3)' : 'none')
                                            }}>
                                            {isDone ? <i className="bi bi-check-lg text-white fw-bold"></i>
                                                : isUnlocked ? <span className="fw-bold smallest">{index + 1}</span>
                                                    : <i className="bi bi-lock-fill text-muted small"></i>}
                                        </div>

                                        {/* Lesson Card */}
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
                                                            style={{ color: diffStyle.color, backgroundColor: diffStyle.bg }}>
                                                            {diffStyle.icon} {diffStyle.label}
                                                        </span>
                                                        {isDone && <span className="smallest fw-bold text-success ls-1">✓ COMPLETED</span>}
                                                    </div>
                                                    <h4 className="fw-bold mb-1 text-dark">{lesson.title}</h4>
                                                    <p className="text-muted small mb-1">{lesson.vendaTitle}</p>
                                                    <div className="d-flex gap-3">
                                                        <span className="smallest text-muted fw-bold">📖 {slideCount} slides</span>
                                                        <span className="smallest text-muted fw-bold">📝 {questionCount} questions</span>
                                                    </div>
                                                </div>

                                                <div className="text-md-end flex-shrink-0">
                                                    {isUnlocked ? (
                                                        <Link
                                                            to={`/game/${lesson.id}`}
                                                            className={`btn ${isDone ? 'btn-outline-dark border-2' : 'game-btn-primary'} px-4 py-2 smallest fw-bold ls-1`}
                                                        >
                                                            {isDone ? '🔄 REVIEW' : '▶ THOMA'}
                                                        </Link>
                                                    ) : (
                                                        <span className="smallest fw-bold text-muted ls-1">🔒 LOCKED</span>
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
                {lessons.length === 0 && (
                    <div className="text-center py-5">
                        <div className="display-1 mb-3">📚</div>
                        <h4 className="fw-bold text-dark">No lessons yet</h4>
                        <p className="text-muted">Check back soon — new lessons are being added!</p>
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
                    color: #111827 !important; 
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