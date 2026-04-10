import React, { useEffect, useState } from 'react';
import { auth } from '../../services/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { fetchLessons, fetchUserData, getMicroLessons, fetchLanguages, invalidateCache } from '../../services/dataCache';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebaseConfig';
import { Key, BookOpen, MessageSquare, Star, Lightbulb, CheckSquare, Zap, Globe, ChevronRight, ArrowLeft, Check, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import JuicyButton from '../../components/JuicyButton';
import LanguageCharacter from '../../components/illustrations/LanguageCharacters';
import '../../styles/learning-grid.css';

const CARD_THEMES = [
    { bg: '#A3E635', border: '#65A30D', icon: <MessageSquare size={32} color="white" fill="white" strokeWidth={1} />, progress: '#84CC16' },
    { bg: '#7DD3FC', border: '#0284C7', icon: <Star size={36} color="#FEF08A" fill="#FEF08A" strokeWidth={1} />, progress: '#38BDF8' },
    { bg: '#F87171', border: '#DC2626', icon: <Lightbulb size={32} color="#FEF08A" fill="#FEF08A" strokeWidth={1} />, progress: '#EF4444' },
    { bg: '#FB923C', border: '#EA580C', icon: <CheckSquare size={32} color="white" fill="white" strokeWidth={1} />, progress: '#F97316' },
    { bg: '#FACC15', border: '#CA8A04', icon: <Zap size={32} color="white" fill="white" strokeWidth={1} />, progress: '#EAB308' }
];

const Courses: React.FC = () => {
    const navigate = useNavigate();
    const [courses, setCourses] = useState<any[]>([]);
    const [languages, setLanguages] = useState<any[]>([]);
    const [selectedLanguageId, setSelectedLanguageId] = useState<string | null>(null);
    const [completedMlIds, setCompletedMlIds] = useState<string[]>([]);
    const [completedCourseIds, setCompletedCourseIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [currentLangPage, setCurrentLangPage] = useState(1);
    const coursesPerPage = 6;
    const langsPerPage = 5;

    useEffect(() => {
        const unsubAuth = onAuthStateChanged(auth, (user) => {
            setIsLoggedIn(!!user);
        });

        const fetchData = async () => {
            try {
                const [lessonsData, userData, langsData] = await Promise.all([
                    fetchLessons(),
                    fetchUserData(),
                    fetchLanguages()
                ]);

                setLanguages(langsData);

                const prefId = userData?.preferredLanguageId || localStorage.getItem('venda_student_lang');
                if (prefId) setSelectedLanguageId(prefId);

                const sorted = [...lessonsData].sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
                setCourses(sorted);

                if (userData) {
                    setCompletedMlIds(userData.completedLessons || []);
                    setCompletedCourseIds(userData.completedCourses || []);
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            }
            setLoading(false);
        };

        fetchData();
        return () => unsubAuth();
    }, []);

    const handleLanguageSelect = async (langId: string) => {
        setSelectedLanguageId(langId);
        localStorage.setItem('venda_student_lang', langId);

        if (auth.currentUser) {
            try {
                const userRef = doc(db, "users", auth.currentUser.uid);
                await updateDoc(userRef, { preferredLanguageId: langId });
                invalidateCache(`user_${auth.currentUser.uid}`);
            } catch (e) {
                console.error("Failed to save language preference:", e);
            }
        }
    };

    const getCourseProgress = (course: any) => {
        const mls = getMicroLessons(course);
        const total = mls.length;
        const completed = mls.filter((ml: any) => completedMlIds.includes(ml.id)).length;
        return { total, completed, percent: total > 0 ? Math.round((completed / total) * 100) : 0 };
    };

    const isCourseComplete = (course: any) => {
        if (completedCourseIds.includes(course.id)) return true;
        const { total, completed } = getCourseProgress(course);
        return total > 0 && completed === total;
    };

    if (loading) return (
        <div className="learning-container animate__animated animate__fadeIn">
            <div className="container pt-2 pb-4" style={{ maxWidth: '1000px' }}>
                <div className="mb-4" style={{ maxWidth: 280 }}>
                    <Skeleton height={36} width={200} borderRadius={8} />
                    <Skeleton height={18} width={280} borderRadius={6} style={{ marginTop: 8 }} />
                </div>
                <div className="course-grid">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="course-card-professional" style={{ border: '2px solid #e2e8f0' }}>
                            <div className="d-flex justify-content-between align-items-start mb-3">
                                <div style={{ flex: 1 }}>
                                    <Skeleton height={24} width="70%" borderRadius={6} />
                                    <Skeleton height={16} width="50%" borderRadius={6} style={{ marginTop: 6 }} />
                                </div>
                                <Skeleton circle height={40} width={40} />
                            </div>
                            <div className="card-footer-progress">
                                <Skeleton height={10} width="40%" borderRadius={4} style={{ marginBottom: 6 }} />
                                <Skeleton height={14} borderRadius={7} />
                                <Skeleton height={10} width="30%" borderRadius={4} style={{ marginTop: 6 }} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const filteredCourses = courses.filter(c =>
        c.languageId === selectedLanguageId ||
        (!c.languageId && selectedLanguageId === 'venda')
    );

    return (
        <div className="learning-container animate__animated animate__fadeIn">
            <div className="container pt-2 pb-4" style={{ maxWidth: '1000px' }}>

                {/* NAVIGATION */}
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4 mb-md-3">
                    <JuicyButton
                        className="btn btn-link text-decoration-none p-0 d-flex align-items-center justify-content-start gap-2 text-dark fw-bold smallest ls-1 text-uppercase"
                        onClick={() => navigate('/')}
                    >
                        <ArrowLeft size={16} /> Home
                    </JuicyButton>

                    {selectedLanguageId && (
                        <JuicyButton
                            className="btn btn-outline-dark rounded-pill px-3 py-1 fw-bold smallest ls-1 text-uppercase d-flex align-items-center gap-2"
                            onClick={() => setSelectedLanguageId(null)}
                            style={{ fontSize: '10px' }}
                        >
                            <Globe size={12} /> Switch Language
                        </JuicyButton>
                    )}
                </div>

                {!selectedLanguageId ? (
                    <div className="animate__animated animate__fadeIn">
                        <header className="mb-5 text-center">
                            <h2 className="fw-bold mb-2 ls-tight text-dark" style={{ fontSize: '2.5rem' }}>Select Your Path</h2>
                            <p className="text-muted small">Choose a language course to begin your learning journey.</p>
                        </header>

                        {(() => {
                            const totalLangPages = Math.ceil(languages.length / langsPerPage);
                            const startIdx = (currentLangPage - 1) * langsPerPage;
                            const paginatedLangs = languages.slice(startIdx, startIdx + langsPerPage);

                            return (
                                <>
                                    <div className="d-flex flex-column gap-3 mx-auto" style={{ maxWidth: '600px' }}>
                                        {paginatedLangs.map((lang) => (
                                            <div key={lang.id} className="w-100">
                                                <div
                                                    onClick={() => handleLanguageSelect(lang.id)}
                                                    className="course-card-professional p-4 shadow-sm"
                                                    style={{ transition: 'all 0.3s ease', minHeight: '120px' }}
                                                >
                                                    <div className="d-flex flex-column flex-md-row align-items-center justify-content-between gap-3 text-center text-md-start">
                                                        <div className="d-flex flex-column flex-md-row align-items-center gap-3 gap-md-4">
                                                            <div className="bg-white p-0 rounded-4 border overflow-hidden d-flex align-items-center justify-content-center" 
                                                                 style={{ width: '100px', height: '100px', flexShrink: 0 }}>
                                                                <LanguageCharacter languageName={lang.name} style={{ height: '90%', width: 'auto' }} />
                                                            </div>
                                                            <div>
                                                                <h4 className="fw-bold text-dark mb-1" style={{ fontSize: '1.6rem' }}>{lang.name}</h4>
                                                                <p className="smallest text-muted fw-bold ls-1 uppercase opacity-75 mb-0">Explore {lang.name} Library</p>
                                                            </div>
                                                        </div>
                                                        <div className="d-flex align-items-center gap-3 mt-2 mt-md-0">
                                                            <span className="badge bg-light text-muted border fw-bold ls-1 px-3 py-2" style={{ fontSize: '12px' }}>
                                                                {lang.code?.toUpperCase()}
                                                            </span>
                                                            <ChevronRight size={24} className="text-warning d-none d-md-block" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* LANGUAGE PAGINATION */}
                                    {totalLangPages > 1 && (
                                        <div className="d-flex justify-content-center align-items-center gap-2 mt-4">
                                            <JuicyButton
                                                className="btn pagination-btn px-4 py-2"
                                                disabled={currentLangPage === 1}
                                                onClick={() => setCurrentLangPage(p => p - 1)}
                                            >
                                                ← PREV
                                            </JuicyButton>
                                            {[...Array(totalLangPages)].map((_, i) => (
                                                <JuicyButton
                                                    key={i}
                                                    className={`btn pagination-btn px-3 py-2 ${currentLangPage === i + 1 ? 'active' : ''}`}
                                                    onClick={() => setCurrentLangPage(i + 1)}
                                                >
                                                    {i + 1}
                                                </JuicyButton>
                                            ))}
                                            <JuicyButton
                                                className="btn pagination-btn px-4 py-2"
                                                disabled={currentLangPage === totalLangPages}
                                                onClick={() => setCurrentLangPage(p => p + 1)}
                                            >
                                                NEXT →
                                            </JuicyButton>
                                        </div>
                                    )}
                                </>
                            );
                        })()}
                    </div>
                ) : (
                    <>
                        {/* HEADER */}
                        <header className="learning-header d-flex flex-column flex-md-row align-items-center gap-3 gap-md-4 mb-4 text-center text-md-start mt-3 mt-md-0">
                            <div className="bg-white border rounded-4 shadow-sm p-2 d-flex align-items-center justify-content-center" style={{ width: 100, height: 100, flexShrink: 0 }}>
                                <LanguageCharacter 
                                    languageName={languages.find(l => l.id === selectedLanguageId)?.name} 
                                    style={{ height: '100%', width: 'auto' }} 
                                />
                            </div>
                            <div className="flex-grow-1 w-100">
                                <div className="d-flex align-items-center justify-content-center justify-content-md-start gap-2 mb-2">
                                    <span className="badge bg-warning text-dark px-3 py-2 fw-bold smallest ls-1 rounded-3">
                                        {languages.find(l => l.id === selectedLanguageId)?.name.toUpperCase() || 'LANGUAGE'}
                                    </span>
                                </div>
                                <div className="d-flex flex-column flex-md-row align-items-center align-items-md-end justify-content-between gap-2 gap-md-4">
                                    <div className="w-100">
                                        <h2 className="mb-1 fw-bold">Learning Path</h2>
                                        <p className="mb-0 text-muted">Structured courses to help you master {languages.find(l => l.id === selectedLanguageId)?.name}.</p>
                                    </div>
                                </div>
                            </div>
                        </header>

                            {!isLoggedIn && (
                                <div className="mt-4 p-4 rounded-4 d-flex flex-column flex-md-row align-items-center gap-3 bg-white border shadow-sm text-center text-md-start">
                                    <div className="bg-warning bg-opacity-10 p-3 rounded-circle text-warning">
                                        <Key size={30} />
                                    </div>
                                    <div className="flex-grow-1">
                                        <h6 className="fw-bold text-dark mb-1">Sign in to save progress</h6>
                                        <p className="small text-muted mb-0">Your learning data will be synced across all your devices.</p>
                                    </div>
                                    <JuicyButton onClick={() => navigate('/login')} className="btn btn-sm btn-dark rounded-pill px-4 py-2 fw-bold smallest ls-1 text-nowrap w-100 w-md-auto mt-2 mt-md-0">
                                        SIGN IN
                                    </JuicyButton>
                                </div>
                            )}


                        {/* COURSE GRID */}
                        {(() => {
                            const totalPages = Math.ceil(filteredCourses.length / coursesPerPage);
                            const startIdx = (currentPage - 1) * coursesPerPage;
                            const paginatedCourses = filteredCourses.slice(startIdx, startIdx + coursesPerPage);
                            const maxCompletedIdx = filteredCourses.reduce((max, c, i) => isCourseComplete(c) ? i : max, -1);

                            return (
                                <>
                                    <div className="course-grid">
                                        {paginatedCourses.map((course, idx) => {
                                            const globalIdx = startIdx + idx;
                                            const isDone = isCourseComplete(course);
                                            const hasStarted = getMicroLessons(course).some((ml: any) => completedMlIds.includes(ml.id));
                                            const isUnlocked = globalIdx <= (maxCompletedIdx + 1) || hasStarted;
                                            const progress = getCourseProgress(course);
                                            const theme = CARD_THEMES[globalIdx % CARD_THEMES.length];
                                            return (
                                                <motion.div
                                                    key={course.id}
                                                    className={`course-card-professional position-relative ${!isUnlocked ? 'locked' : ''}`}
                                                    onClick={() => { if (isUnlocked) navigate(`/courses/${course.id}`); }}
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: idx * 0.08, duration: 0.4, ease: 'easeOut' }}
                                                    whileHover={isUnlocked ? { y: -4, boxShadow: '0 12px 24px -8px rgba(0,0,0,0.12)' } : {}}
                                                    style={{
                                                        '--theme-color': theme.bg,
                                                        '--theme-hover': theme.border,
                                                    } as any}
                                                >
                                                    {!isUnlocked && (
                                                        <div className="locked-overlay">
                                                            <div className="locked-badge">
                                                                <Lock size={16} className="d-none d-md-block" />
                                                                <Lock size={16} className="d-block d-md-none mb-1" />
                                                                <span>FINISH PREVIOUS</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                                        <div>
                                                            <div className="card-title text-truncate-2 mb-0" style={{ minHeight: 'auto' }}>{course.title}</div>
                                                            <div className="card-subtitle mb-0">{course.vendaTitle}</div>
                                                        </div>
                                                        {isDone && (
                                                            <div className="bg-success bg-opacity-10 text-success p-2 rounded-circle">
                                                                <Check size={20} />
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="card-footer-progress">
                                                        {isUnlocked ? (
                                                            <>
                                                                <div className="progress-text">
                                                                    <span>PROGRESS</span>
                                                                    <span>{progress.percent}%</span>
                                                                </div>
                                                                <div className="professional-progress-container mb-2">
                                                                    <div
                                                                        className="professional-progress-bar"
                                                                        style={{
                                                                            width: `${progress.percent}%`,
                                                                            backgroundColor: isDone ? 'var(--venda-green)' : 'var(--venda-yellow)'
                                                                        } as any}
                                                                    ></div>
                                                                </div>
                                                                <div className="smallest fw-bold text-dark ls-1 uppercase opacity-75">
                                                                    {progress.completed} / {progress.total} Sections Complete
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <div className="d-flex align-items-center justify-content-between h-100 mt-2">
                                                                <span className="smallest fw-bold text-dark ls-1 uppercase opacity-75">
                                                                    {progress.total} Sections
                                                                </span>
                                                                <span className="smallest fw-bold text-muted ls-1 uppercase opacity-50">
                                                                    LOCKED
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </div>

                                    {/* PAGINATION */}
                                    {totalPages > 1 && (
                                        <div className="d-flex justify-content-center align-items-center gap-2 mt-5">
                                            <JuicyButton
                                                className="btn pagination-btn px-4 py-2"
                                                disabled={currentPage === 1}
                                                onClick={() => setCurrentPage(p => p - 1)}
                                            >
                                                ← PREV
                                            </JuicyButton>
                                            {[...Array(totalPages)].map((_, i) => (
                                                <JuicyButton
                                                    key={i}
                                                    className={`btn pagination-btn px-3 py-2 ${currentPage === i + 1 ? 'active' : ''}`}
                                                    onClick={() => setCurrentPage(i + 1)}
                                                >
                                                    {i + 1}
                                                </JuicyButton>
                                            ))}
                                            <JuicyButton
                                                className="btn pagination-btn px-4 py-2"
                                                disabled={currentPage === totalPages}
                                                onClick={() => setCurrentPage(p => p + 1)}
                                            >
                                                NEXT →
                                            </JuicyButton>
                                        </div>
                                    )}
                                </>
                            );
                        })()}
                    </>
                )}

                {filteredCourses.length === 0 && selectedLanguageId && !loading && (
                    <div className="text-center py-5 mt-5">
                        <BookOpen size={80} className="text-muted opacity-25 mb-4" />
                        <h4 className="fw-bold text-dark mb-2">No courses found</h4>
                        <p className="text-muted">Stay tuned! We're preparing new content for this language.</p>
                        <JuicyButton className="btn btn-dark rounded-pill px-5 py-2 mt-3" onClick={() => setSelectedLanguageId(null)}>BACK TO LANGUAGES</JuicyButton>
                    </div>
                )}
            </div>

            <style>{`
                .text-truncate-2 {
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
            `}</style>
        </div>
    );
};

export default Courses;
