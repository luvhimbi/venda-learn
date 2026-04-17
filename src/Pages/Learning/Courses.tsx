import React, { useEffect, useState } from 'react';
import { auth } from '../../services/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { fetchLessons, fetchUserData, getMicroLessons, fetchLanguages, invalidateCache } from '../../services/dataCache';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebaseConfig';
import { Key, MessageSquare, Star, Lightbulb, CheckSquare, Zap, ChevronRight, Check, Lock, Play, X, BookOpen, Sparkles, ArrowUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import JuicyButton from '../../components/ui/JuicyButton/JuicyButton';
import LanguageCharacter from '../../components/illustrations/LanguageCharacters';
import '../../styles/learning-grid.css';

const THEMES = [
    { bg: '#A3E635', border: '#65A30D', icon: <MessageSquare size={24} />, progress: '#84CC16' },
    { bg: '#7DD3FC', border: '#0284C7', icon: <Star size={24} />, progress: '#38BDF8' },
    { bg: '#F87171', border: '#DC2626', icon: <Lightbulb size={24} />, progress: '#EF4444' },
    { bg: '#FB923C', border: '#EA580C', icon: <CheckSquare size={24} />, progress: '#F97316' },
    { bg: '#FACC15', border: '#CA8A04', icon: <Zap size={24} />, progress: '#EAB308' }
];

const CircularProgress: React.FC<{ percent: number; size?: number; strokeWidth?: number }> = ({ percent, size = 60, strokeWidth = 6 }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (percent / 100) * circumference;

    return (
        <svg width={size} height={size} className="circular-progress">
            <circle
                className="bg"
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="rgba(255,255,255,0.2)"
                strokeWidth={strokeWidth}
            />
            <circle
                className="bar"
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="#FACC15"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={offset}
            />
            <text
                x="50%"
                y="50%"
                dy=".3em"
                textAnchor="middle"
                style={{ fill: '#fff', fontSize: '12px', fontWeight: '900', transform: 'rotate(90deg)', transformOrigin: 'center' }}
            >
                {percent}%
            </text>
        </svg>
    );
};

const Courses: React.FC = () => {
    const navigate = useNavigate();
    const [courses, setCourses] = useState<any[]>([]);
    const [languages, setLanguages] = useState<any[]>([]);
    const [selectedLanguageId, setSelectedLanguageId] = useState<string | null>(null);
    const [lastLanguageId, setLastLanguageId] = useState<string | null>(null);
    const [completedMlIds, setCompletedMlIds] = useState<string[]>([]);
    const [completedCourseIds, setCompletedCourseIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [currentLangPage, setCurrentLangPage] = useState(1);
    const [showScrollTop, setShowScrollTop] = useState(false);
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

                const prefId = userData?.preferredLanguageId
                    || localStorage.getItem('chommie_student_lang')
                    || localStorage.getItem('venda_student_lang');
                if (prefId) {
                    setSelectedLanguageId(prefId);
                    setLastLanguageId(prefId);
                }

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

        const handleScroll = () => {
            if (window.scrollY > 300) {
                setShowScrollTop(true);
            } else {
                setShowScrollTop(false);
            }
        };

        window.addEventListener('scroll', handleScroll);

        fetchData();
        return () => {
            unsubAuth();
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    const handleLanguageSelect = async (langId: string) => {
        setSelectedLanguageId(langId);
        setLastLanguageId(langId);
        localStorage.setItem('chommie_student_lang', langId);

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
        <div className="learning-container bg-theme-base min-vh-100 animate__animated animate__fadeIn">
            <div className="container pt-2 pb-4" style={{ maxWidth: '800px' }}>
                <div className="mb-4" style={{ maxWidth: 280 }}>
                    <Skeleton height={36} width={200} borderRadius={8} />
                    <Skeleton height={18} width={280} borderRadius={6} style={{ marginTop: 8 }} />
                </div>
                <div className="path-container">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="w-100 mb-4">
                            <Skeleton height={80} borderRadius={20} />
                            <div className="ps-5 mt-4">
                                <Skeleton circle height={60} width={60} />
                                <Skeleton height={40} width={200} borderRadius={12} className="ms-3 d-inline-block" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const filteredCourses = courses.filter(c =>
        c.languageId === selectedLanguageId || !c.languageId
    );

    const selectedLangName = languages.find(l => l.id === selectedLanguageId)?.name || 'this language';

    const renderLanguageSelection = () => {
        // Sort languages so the last selected one is first
        const sortedLangs = [...languages].sort((a, b) => {
            if (a.id === lastLanguageId) return -1;
            if (b.id === lastLanguageId) return 1;
            return 0;
        });

        const totalLangPages = Math.ceil(sortedLangs.length / langsPerPage);
        const startIdx = (currentLangPage - 1) * langsPerPage;
        const paginatedLangs = sortedLangs.slice(startIdx, startIdx + langsPerPage);

        return (
            <div className="animate__animated animate__fadeIn">
                <header className="mb-3 text-center">
                    <h4 className="fw-black mb-1 ls-tight text-theme-main text-uppercase">Select Your Path</h4>
                    <p className="smallest text-theme-muted fw-bold ls-1 text-uppercase opacity-75">Choose a language course</p>
                </header>

                <div className="d-flex flex-column gap-3 mx-auto" style={{ maxWidth: '600px' }}>
                    {paginatedLangs.map((lang) => {
                        const isSelected = lang.id === lastLanguageId;
                        return (
                            <div key={lang.id} className="w-100">
                                <div
                                    onClick={() => handleLanguageSelect(lang.id)}
                                    className={`course-card-professional p-3 shadow-sm ${isSelected ? 'border-success' : ''}`}
                                    style={{ 
                                        transition: 'all 0.3s ease', 
                                        minHeight: '100px',
                                        boxShadow: isSelected ? '8px 8px 0px #198754' : '8px 8px 0px var(--color-border)',
                                        borderColor: isSelected ? '#198754' : 'var(--color-border)'
                                    }}
                                >
                                <div className="d-flex align-items-center justify-content-between gap-3 text-start">
                                    <div className="d-flex align-items-center gap-3 gap-md-4">
                                        <div className="bg-theme-card p-0 rounded-4 border border-theme-main overflow-hidden d-flex align-items-center justify-content-center" 
                                             style={{ width: '70px', height: '70px', flexShrink: 0 }}>
                                            <LanguageCharacter languageName={lang.name} style={{ height: '90%', width: 'auto' }} />
                                        </div>
                                        <div>
                                            <h6 className="fw-black text-theme-main mb-0 text-uppercase">{lang.name}</h6>
                                            <p className="smallest text-theme-muted fw-bold ls-1 uppercase opacity-75 mb-0">Explore Library</p>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-center gap-2">
                                        <span className="badge bg-theme-surface text-theme-muted border border-theme-main fw-bold ls-1 px-2 py-1 d-none d-sm-inline-block" style={{ fontSize: '10px' }}>
                                            {lang.code?.toUpperCase()}
                                        </span>
                                        <ChevronRight size={18} className="text-warning" />
                                    </div>
                                </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

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
            </div>
        );
    };

    const renderPath = () => {
        let globalLessonIdx = 0;
        const maxCompletedCourseIdx = filteredCourses.reduce((max, c, i) => isCourseComplete(c) ? i : max, -1);

        return (
            <div className="path-container animate__animated animate__fadeIn">
                {filteredCourses.map((course, cIdx) => {
                    const progress = getCourseProgress(course);
                    const mls = getMicroLessons(course);
                    const isCourseUnlocked = cIdx <= (maxCompletedCourseIdx + 1);
                    const maxCompletedMlIdx = mls.reduce((max, ml, i) => completedMlIds.includes(ml.id) ? i : max, -1);

                    return (
                        <div key={course.id} className="w-100">
                            {/* Chapter Header */}
                            <div className="chapter-separator">
                                <motion.div 
                                    className="chapter-header-brutalist"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: cIdx * 0.1 }}
                                >
                                    <div className="chapter-header-info">
                                        <div className="chapter-title">Chapter {cIdx + 1}</div>
                                        <h3 className="chapter-subtitle">{course.title}</h3>
                                        <div className="smallest text-white opacity-50 uppercase ls-1 mt-1">{course.vendaTitle}</div>
                                    </div>
                                    <div className="chapter-progress-circle">
                                        <CircularProgress percent={progress.percent} />
                                    </div>
                                </motion.div>
                            </div>

                            {/* Lessons in Path */}
                            {mls.map((ml, mIdx) => {
                                const isDone = completedMlIds.includes(ml.id);
                                const isUnlocked = isCourseUnlocked && mIdx <= (maxCompletedMlIdx + 1);
                                const theme = THEMES[globalLessonIdx % THEMES.length];
                                globalLessonIdx++;

                                return (
                                    <div key={ml.id} className="path-node-row">
                                        {/* Connecting Line */}
                                        {mIdx < mls.length - 1 && (
                                            <div className={`path-node-line ${isDone ? 'is-active' : ''}`}></div>
                                        )}
                                        
                                        {/* Circular Visual Node */}
                                        <motion.div 
                                            className={`path-node-circle ${!isUnlocked ? 'locked' : ''} ${isDone ? 'is-done' : ''}`}
                                            onClick={() => { if (isUnlocked) navigate(`/game/${course.id}/${ml.id}`); }}
                                            whileHover={isUnlocked ? { scale: 1.15 } : {}}
                                            whileTap={isUnlocked ? { scale: 0.95 } : {}}
                                            style={{ backgroundColor: isUnlocked ? theme.bg : 'var(--color-surface-soft)' }}
                                        >
                                            {!isUnlocked ? <Lock size={24} className="text-theme-muted" /> : (isDone ? <Check size={30} className="text-success" /> : <Play size={24} fill="currentColor" />)}
                                        </motion.div>

                                        {/* Lesson Info Card */}
                                        <div 
                                            className={`path-node-card ${!isUnlocked ? 'locked' : ''}`}
                                            onClick={() => { if (isUnlocked) navigate(`/game/${course.id}/${ml.id}`); }}
                                        >
                                            <div className="path-node-title">{ml.title}</div>
                                            <div className="smallest text-theme-muted fw-bold ls-1 uppercase mt-1">
                                                {isDone ? 'COMPLETED' : (isUnlocked ? 'START MISSION' : 'LOCKED')}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="learning-container bg-theme-base min-vh-100">
            <div className="container pt-3 pb-5" style={{ maxWidth: '900px' }}>
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <JuicyButton
                        className="btn btn-white border-3 border-theme-main rounded-circle p-0 d-flex align-items-center justify-content-center text-theme-main shadow-action-sm"
                        onClick={() => {
                            if (!selectedLanguageId && lastLanguageId) {
                                setSelectedLanguageId(lastLanguageId);
                            } else {
                                navigate('/');
                            }
                        }}
                        style={{ width: '44px', height: '44px', backgroundColor: 'var(--color-bg)' }}
                    >
                        <X size={24} strokeWidth={3} />
                    </JuicyButton>

                    {selectedLanguageId && (
                        <motion.div 
                            className="bg-dark text-white rounded-pill pe-3 ps-1 py-1 fw-bold smallest ls-1 text-uppercase d-flex align-items-center gap-2 shadow-action-sm"
                            onClick={() => {
                                setLastLanguageId(selectedLanguageId);
                                setSelectedLanguageId(null);
                            }}
                            whileHover={{ scale: 1.05, backgroundColor: '#333' }}
                            whileTap={{ scale: 0.95 }}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className="bg-white rounded-circle p-1 d-flex align-items-center justify-content-center overflow-hidden" style={{ width: 24, height: 24 }}>
                                <LanguageCharacter 
                                    languageName={languages.find(l => l.id === selectedLanguageId)?.name} 
                                    style={{ height: '110%', width: 'auto' }} 
                                />
                            </div>
                            <span>{languages.find(l => l.id === selectedLanguageId)?.name}</span>
                            <ChevronRight size={10} className="opacity-50" />
                        </motion.div>
                    )}
                </div>

                {!selectedLanguageId ? renderLanguageSelection() : (
                    <>
                        {!isLoggedIn && (
                            <div className="brutalist-card p-4 d-flex flex-column flex-md-row align-items-center gap-3 bg-theme-card mb-5 shadow-action-sm">
                                <div className="bg-warning p-3 rounded-circle border-3 border-theme-main">
                                    <Key size={30} className="text-dark" />
                                </div>
                                <div className="flex-grow-1 text-center text-md-start">
                                    <h5 className="fw-black text-uppercase text-theme-main mb-1">Save Your Progress!</h5>
                                    <p className="small fw-bold text-theme-muted mb-0">Sign in to sync your achievements across all devices.</p>
                                </div>
                                <JuicyButton onClick={() => navigate('/login')} className="game-btn-primary px-4 py-2 w-100 w-md-auto">
                                    SIGN IN
                                </JuicyButton>
                            </div>
                        )}

                        {filteredCourses.length === 0 ? (
                            <div className="animate__animated animate__fadeIn d-flex flex-column align-items-center justify-content-center py-5 text-center" style={{ minHeight: '50vh' }}>
                                <div className="position-relative mb-4">
                                    <div className="rounded-circle d-flex align-items-center justify-content-center mx-auto"
                                        style={{ width: 120, height: 120, background: 'linear-gradient(135deg, #FEF3C7, #FDE68A)', border: '4px solid var(--color-border)' }}>
                                        <BookOpen size={48} strokeWidth={2} className="text-dark" />
                                    </div>
                                    <div className="position-absolute rounded-circle d-flex align-items-center justify-content-center bg-warning border border-dark border-3"
                                        style={{ width: 40, height: 40, bottom: -4, right: -4 }}>
                                        <Sparkles size={20} className="text-dark" />
                                    </div>
                                </div>
                                <h3 className="fw-black text-theme-main mb-2 ls-tight">Coming Soon!</h3>
                                <p className="text-theme-muted fw-bold mb-1" style={{ maxWidth: 380, lineHeight: 1.6 }}>
                                    We're currently building lessons for <strong className="text-warning">{selectedLangName}</strong>. Our team is crafting authentic, high-quality content.
                                </p>
                                <p className="smallest text-theme-muted fw-bold ls-1 text-uppercase mb-4 opacity-75">Check back soon or explore games in the meantime</p>
                                <div className="d-flex flex-column flex-sm-row gap-3 w-100 justify-content-center" style={{ maxWidth: 400 }}>
                                    <button
                                        onClick={() => navigate('/mitambo')}
                                        className="btn btn-game btn-game-primary py-3 px-4 flex-grow-1 smallest fw-black"
                                    >
                                        PLAY GAMES INSTEAD
                                    </button>
                                    <button
                                        onClick={() => { setLastLanguageId(selectedLanguageId); setSelectedLanguageId(null); }}
                                        className="btn btn-game btn-game-white py-3 px-4 flex-grow-1 smallest fw-black"
                                    >
                                        SWITCH LANGUAGE
                                    </button>
                                </div>
                            </div>
                        ) : renderPath()}
                    </>
                )}
            </div>

            <AnimatePresence>
                {showScrollTop && (
                    <motion.button
                        className="scroll-top-btn"
                        initial={{ opacity: 0, scale: 0.5, y: 50 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.5, y: 50 }}
                        whileHover={{ scale: 1.1, backgroundColor: '#FFD600' }}
                        whileTap={{ scale: 0.9, y: 4 }}
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        aria-label="Scroll to top"
                    >
                        <ArrowUp size={30} strokeWidth={3} />
                    </motion.button>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Courses;








