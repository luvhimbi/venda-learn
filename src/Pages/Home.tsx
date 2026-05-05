import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc, type Firestore } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../services/firebaseConfig';
import { fetchLessons, refreshUserData, getMicroLessons, fetchLanguages, warmupCache, invalidateCache } from '../services/dataCache';
import LandingPage from './LandingPage';
import InstallBanner from '../components/feedback/banners/InstallBanner';
import TourGuide from '../features/onboarding/components/TourGuide';
import JuicyButton from '../components/ui/JuicyButton/JuicyButton';
import PremiumStreakModal from '../components/feedback/modals/PremiumStreakModal';
import NotificationNudge from '../features/notifications/components/NotificationNudge';
import LanguageCharacter from '../components/illustrations/LanguageCharacters';
import { MessageSquare, Star, Lightbulb, CheckSquare, Zap, ChevronRight, Check, Lock, Play, X, BookOpen, ArrowUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import '../styles/learning-grid.css';

// Constants from Courses.tsx
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

const Home: React.FC = () => {
    const navigate = useNavigate();

    // Combined State
    const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
    const [userData, setUserData] = useState<any>(null);
    const [courses, setCourses] = useState<any[]>([]);
    const [languages, setLanguages] = useState<any[]>([]);
    const [selectedLanguageId, setSelectedLanguageId] = useState<string | null>(null);
    const [lastLanguageId, setLastLanguageId] = useState<string | null>(null);
    const [completedMlIds, setCompletedMlIds] = useState<string[]>([]);
    const [completedCourseIds, setCompletedCourseIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [isTourOpen, setIsTourOpen] = useState(false);
    const [showStreakModal, setShowStreakModal] = useState(false);
    const [currentLanguage, setCurrentLanguage] = useState<any>(null);
    const [currentLangPage, setCurrentLangPage] = useState(1);
    const [showScrollTop, setShowScrollTop] = useState(false);
    const langsPerPage = 5;

    const handleTourComplete = async () => {
        setIsTourOpen(false);
        if (auth.currentUser) {
            try {
                const userRef = doc(db as Firestore, "users", auth.currentUser.uid);
                await updateDoc(userRef, { tourCompleted: true });
                setUserData((prev: any) => ({ ...prev, tourCompleted: true }));
            } catch (err) {
                console.error("Error updating tour status:", err);
            }
        }
    };

    const handleLanguageSelect = async (langId: string) => {
        setSelectedLanguageId(langId);
        setLastLanguageId(langId);
        localStorage.setItem('chommie_student_lang', langId);

        if (auth.currentUser) {
            try {
                const userRef = doc(db, "users", auth.currentUser.uid);
                await updateDoc(userRef, { preferredLanguageId: langId });
                invalidateCache(`user_${auth.currentUser.uid}`);
                const updatedLang = languages.find(l => l.id === langId);
                if (updatedLang) setCurrentLanguage(updatedLang);
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

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setIsLoggedIn(true);
                try {
                    const [uData, lessons, langs] = await Promise.all([
                        refreshUserData(),
                        fetchLessons(),
                        fetchLanguages(),
                    ]);

                    setLanguages(langs);
                    const sorted = [...lessons].sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
                    setCourses(sorted);

                    if (uData) {
                        setUserData(uData);
                        setCompletedMlIds(uData.completedLessons || []);
                        setCompletedCourseIds(uData.completedCourses || []);
                        warmupCache();

                        const prefId = uData.preferredLanguageId
                            || localStorage.getItem('chommie_student_lang')
                            || localStorage.getItem('venda_student_lang');
                        
                        if (prefId) {
                            setSelectedLanguageId(prefId);
                            setLastLanguageId(prefId);
                            const lang = langs.find((l: any) => l.id === prefId);
                            if (lang) setCurrentLanguage(lang);
                        }
                    }

                    if (uData && uData.tourCompleted === false && window.innerWidth >= 768) {
                        const tourSeenThisSession = sessionStorage.getItem('tour_offered');
                        if (!tourSeenThisSession) {
                            setIsTourOpen(true);
                            sessionStorage.setItem('tour_offered', 'true');
                        }
                    }

                } catch (err) {
                    console.error("Error fetching data:", err);
                }
            } else {
                setIsLoggedIn(false);
            }
            setLoading(false);
        });

        const handleScroll = () => {
            setShowScrollTop(window.scrollY > 300);
        };

        const handleOutsideClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!target.closest('.streak-trigger-area')) {
                setShowStreakModal(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        if (showStreakModal) document.addEventListener('click', handleOutsideClick);

        return () => {
            unsubscribe();
            window.removeEventListener('scroll', handleScroll);
            document.removeEventListener('click', handleOutsideClick);
        };
    }, [showStreakModal]);

    const renderLanguageSelection = () => {
        const sortedLangs = [...languages].sort((a, b) => {
            if (a.id === lastLanguageId) return -1;
            if (b.id === lastLanguageId) return 1;
            return 0;
        });

        const totalLangPages = Math.ceil(sortedLangs.length / langsPerPage);
        const startIdx = (currentLangPage - 1) * langsPerPage;
        const paginatedLangs = sortedLangs.slice(startIdx, startIdx + langsPerPage);

        return (
            <div className="animate__animated animate__fadeIn py-4 position-relative">
                {lastLanguageId && (
                    <button 
                        onClick={() => setSelectedLanguageId(lastLanguageId)}
                        className="btn position-absolute top-0 end-0 p-2 text-theme-muted hover-text-main transition-all"
                        style={{ zIndex: 10 }}
                    >
                        <X size={24} strokeWidth={3} />
                    </button>
                )}
                <header className="mb-4 text-center">
                    <h4 className="fw-black mb-1 ls-tight text-theme-main text-uppercase">Select Your Path</h4>
                    <p className="smallest text-theme-muted fw-bold ls-1 text-uppercase opacity-75">Choose a language to start learning</p>
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
                                            <p className="smallest text-theme-muted fw-bold ls-1 uppercase opacity-75 mb-0">Explore Lessons</p>
                                        </div>
                                    </div>
                                    <ChevronRight size={18} className="text-warning" />
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
        const filteredCourses = courses.filter(c => c.languageId === selectedLanguageId || !c.languageId);
        let globalLessonIdx = 0;
        const maxCompletedCourseIdx = filteredCourses.reduce((max, c, i) => isCourseComplete(c) ? i : max, -1);

        if (filteredCourses.length === 0) {
            return (
                <div className="animate__animated animate__fadeIn d-flex flex-column align-items-center justify-content-center py-5 text-center">
                    <div className="position-relative mb-4">
                        <div className="rounded-circle d-flex align-items-center justify-content-center mx-auto"
                            style={{ width: 100, height: 100, background: 'linear-gradient(135deg, #FEF3C7, #FDE68A)', border: '4px solid var(--color-border)' }}>
                            <BookOpen size={40} strokeWidth={2} className="text-dark" />
                        </div>
                    </div>
                    <h4 className="fw-black text-theme-main mb-2 uppercase ls-tight">Coming Soon!</h4>
                    <p className="text-theme-muted fw-bold mb-4" style={{ maxWidth: 300 }}>
                        We're currently building lessons for {currentLanguage?.name || 'this language'}.
                    </p>
                    <JuicyButton
                        onClick={() => { setLastLanguageId(selectedLanguageId); setSelectedLanguageId(null); }}
                        className="btn btn-game btn-game-white py-3 px-5 smallest fw-black ls-1 uppercase"
                    >
                        SWITCH LANGUAGE
                    </JuicyButton>
                </div>
            );
        }

        return (
            <div className="path-container animate__animated animate__fadeIn pb-5">
                {filteredCourses.map((course, cIdx) => {
                    const progress = getCourseProgress(course);
                    const mls = getMicroLessons(course);
                    const isCourseUnlocked = cIdx <= (maxCompletedCourseIdx + 1);
                    const maxCompletedMlIdx = mls.reduce((max, ml, i) => completedMlIds.includes(ml.id) ? i : max, -1);

                    return (
                        <div key={course.id} className="w-100">
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

                            {mls.map((ml, mIdx) => {
                                const isDone = completedMlIds.includes(ml.id);
                                const isUnlocked = isCourseUnlocked && mIdx <= (maxCompletedMlIdx + 1);
                                const theme = THEMES[globalLessonIdx % THEMES.length];
                                globalLessonIdx++;

                                return (
                                    <div key={ml.id} className="path-node-row">
                                        {mIdx < mls.length - 1 && (
                                            <div className={`path-node-line ${isDone ? 'is-active' : ''}`}></div>
                                        )}
                                        <motion.div 
                                            className={`path-node-circle ${!isUnlocked ? 'locked' : ''} ${isDone ? 'is-done' : ''}`}
                                            onClick={() => { if (isUnlocked) navigate(`/game/${course.id}/${ml.id}`); }}
                                            whileHover={isUnlocked ? { scale: 1.15 } : {}}
                                            whileTap={isUnlocked ? { scale: 0.95 } : {}}
                                            style={{ backgroundColor: isUnlocked ? theme.bg : 'var(--color-surface-soft)' }}
                                        >
                                            {!isUnlocked ? <Lock size={24} className="text-theme-muted" /> : (isDone ? <Check size={30} className="text-success" /> : <Play size={24} fill="currentColor" />)}
                                        </motion.div>

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

    if (loading) return (
        <div className="d-flex justify-content-center align-items-center min-vh-100 bg-theme-base">
            <div className="text-center">
                <Skeleton circle height={60} width={60} />
                <p className="smallest fw-bold text-muted ls-2 uppercase mt-3">LOADING YOUR PATH...</p>
            </div>
        </div>
    );

    if (!isLoggedIn) return <LandingPage />;

    return (
        <div className="bg-theme-base min-vh-100" style={{ overflowX: 'hidden' }}>
            <TourGuide isOpen={isTourOpen} onClose={() => setIsTourOpen(false)} onComplete={handleTourComplete} />

            {/* SIMPLIFIED HERO HEADER */}
            <div className="px-3 py-3 bg-theme-base border-bottom border-theme-main border-4 position-relative overflow-hidden" style={{ background: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'currentColor\' fill-opacity=\'0.03\' fill-rule=\'evenodd\'%3E%3Ccircle cx=\'3\' cy=\'3\' r=\'1\'/%3E%3C/g%3E%3C/svg%3E")' }}>
                <div className="container" style={{ maxWidth: '750px' }}>
                    <InstallBanner />
                    
                    <div className="d-flex align-items-center justify-content-center gap-2 mt-2">
                        {/* Compact Language Selector */}
                        <div 
                            className="d-flex align-items-center justify-content-between p-1 px-3 brutalist-card--sm bg-theme-surface border-theme-main border-2 shadow-sm transition-all hover-lift"
                            onClick={() => { setLastLanguageId(selectedLanguageId); setSelectedLanguageId(null); }}
                            style={{ cursor: 'pointer', minWidth: '180px' }}
                        >
                            <div className="d-flex align-items-center gap-2">
                                <div className="stat-icon-box rounded-circle bg-warning d-flex align-items-center justify-content-center border border-theme-main border-2" style={{ width: 28, height: 28 }}>
                                    <LanguageCharacter languageName={currentLanguage?.name || 'Venda'} style={{ width: '80%', height: '80%' }} />
                                </div>
                                <div className="lh-1">
                                    <h6 className="mb-0 fw-black text-theme-main uppercase ls-tight" style={{ fontSize: '0.75rem' }}>{currentLanguage?.name || 'SELECT'}</h6>
                                    <p className="mb-0 smallest fw-black text-theme-muted uppercase ls-1" style={{ fontSize: '6px' }}>Path</p>
                                </div>
                            </div>
                            <i className="bi bi-chevron-down text-theme-muted opacity-50" style={{ fontSize: '8px' }}></i>
                        </div>

                        {/* Subtle Streak Indicator */}
                        <div 
                            className={`d-flex align-items-center gap-2 p-1 px-3 rounded-pill border-2 transition-all hover-lift streak-trigger-area ${userData?.streak > 0 ? 'bg-danger text-white border-dark' : 'bg-theme-surface text-theme-main border-theme-main'}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowStreakModal(true);
                            }}
                            style={{ cursor: 'pointer', borderStyle: 'solid' }}
                        >
                            <i className={`bi bi-fire ${userData?.streak > 0 ? 'fire-shake' : ''}`} style={{ fontSize: '14px' }}></i>
                            <span className="fw-black smallest uppercase ls-1" style={{ fontSize: '10px' }}>{userData?.streak || 0}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container py-4" style={{ maxWidth: '750px' }}>
                <NotificationNudge />
                
                {/* THE PATH OR LANGUAGE SELECTION */}
                {!selectedLanguageId ? renderLanguageSelection() : renderPath()}


            </div>

            <AnimatePresence>
                {showScrollTop && (
                    <motion.button
                        className="scroll-top-btn"
                        initial={{ opacity: 0, scale: 0.5, y: 50 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.5, y: 50 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    >
                        <ArrowUp size={30} strokeWidth={3} />
                    </motion.button>
                )}
            </AnimatePresence>

            <style>{`
                .ls-tight { letter-spacing: -1.5px; }
                .ls-1 { letter-spacing: 1px; }
                .ls-2 { letter-spacing: 2px; }
                .smallest { font-size: 11px; }
                .uppercase { text-transform: uppercase; }
                .fw-black { font-weight: 900; }
                .transition-all { transition: all 0.2s ease-in-out; }
                .hover-lift:hover { transform: translateY(-4px); }
            `}</style>

            <PremiumStreakModal
                streak={userData?.streak || 0}
                activityHistory={userData?.activityHistory || []}
                frozenDays={userData?.frozenDays || []}
                streakFreezes={userData?.streakFreezes || 0}
                points={userData?.points || 0}
                isVisible={showStreakModal}
                onClose={() => setShowStreakModal(false)}
            />
        </div>
    );
};

export default Home;
