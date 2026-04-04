import React, { useEffect, useState } from 'react';
import { auth } from '../../services/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchLessons, fetchUserData, getMicroLessons } from '../../services/dataCache';
import { BookOpen, MessageSquare, Star, Lightbulb, CheckSquare, Zap, ChevronRight, ArrowLeft, Check, ClipboardEdit } from 'lucide-react';
import { motion } from 'framer-motion';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import JuicyButton from '../../components/JuicyButton';
import '../../styles/learning-grid.css';

const CARD_THEMES = [
    { bg: '#A3E635', border: '#65A30D', icon: <MessageSquare size={32} color="white" fill="white" strokeWidth={1} />, progress: '#84CC16' },
    { bg: '#7DD3FC', border: '#0284C7', icon: <Star size={36} color="#FEF08A" fill="#FEF08A" strokeWidth={1} />, progress: '#38BDF8' },
    { bg: '#F87171', border: '#DC2626', icon: <Lightbulb size={32} color="#FEF08A" fill="#FEF08A" strokeWidth={1} />, progress: '#EF4444' },
    { bg: '#FB923C', border: '#EA580C', icon: <CheckSquare size={32} color="white" fill="white" strokeWidth={1} />, progress: '#F97316' },
    { bg: '#FACC15', border: '#CA8A04', icon: <Zap size={32} color="white" fill="white" strokeWidth={1} />, progress: '#EAB308' }
];

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

    if (loading) return (
        <div className="learning-container animate__animated animate__fadeIn">
            <div className="container pt-2 pb-4" style={{ maxWidth: '1000px' }}>
                {/* Header skeleton */}
                <div className="learning-header">
                    <Skeleton height={16} width={120} borderRadius={6} style={{ marginBottom: 12 }} />
                    <Skeleton height={36} width={300} borderRadius={8} />
                    <Skeleton height={18} width={200} borderRadius={6} style={{ marginTop: 6 }} />
                    <div className="mt-4" style={{ maxWidth: 220 }}>
                        <Skeleton height={10} width={160} borderRadius={4} style={{ marginBottom: 6 }} />
                        <Skeleton height={14} borderRadius={7} />
                        <Skeleton height={10} width={100} borderRadius={4} style={{ marginTop: 6 }} />
                    </div>
                </div>
                {/* Card skeletons */}
                <div className="course-grid">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="course-card-professional" style={{ border: '2px solid #e2e8f0' }}>
                            <div className="d-flex justify-content-between align-items-start mb-3">
                                <div style={{ flex: 1 }}>
                                    <Skeleton height={12} width={80} borderRadius={4} style={{ marginBottom: 6 }} />
                                    <Skeleton height={22} width="75%" borderRadius={6} />
                                </div>
                                <Skeleton circle height={40} width={40} />
                            </div>
                            <div className="card-footer-progress">
                                <div className="d-flex gap-3 mb-3">
                                    <Skeleton height={12} width={70} borderRadius={4} />
                                    <Skeleton height={12} width={60} borderRadius={4} />
                                </div>
                                <Skeleton height={14} borderRadius={7} />
                                <Skeleton height={10} width="40%" borderRadius={4} style={{ marginTop: 6 }} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    if (!course) return (
        <div className="min-vh-100 bg-white d-flex justify-content-center align-items-center">
            <div className="text-center">
                <div className="mb-4 text-muted opacity-25">
                    <BookOpen size={80} className="mx-auto" />
                </div>
                <h4 className="fw-bold text-dark">Course not found</h4>
                <button className="btn btn-dark rounded-pill px-4 mt-3" onClick={() => navigate('/courses')}>Back to Path</button>
            </div>
        </div>
    );

    const completedCount = microLessons.filter(ml => completedMlIds.includes(ml.id)).length;
    const totalCount = microLessons.length;
    const courseProgress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
    const maxCompletedIdx = microLessons.reduce((max: number, ml: any, i: number) =>
        completedMlIds.includes(ml.id) ? i : max, -1);

    return (
        <div className="learning-container animate__animated animate__fadeIn">
            <div className="container pt-2 pb-4" style={{ maxWidth: '1000px' }}>
                
                {/* HEADER */}
                <header className="learning-header">
                    <JuicyButton
                        className="btn btn-link text-decoration-none p-0 d-flex align-items-center gap-2 text-dark fw-bold smallest ls-1 text-uppercase mb-2"
                        onClick={() => navigate('/courses')}
                    >
                        <ArrowLeft size={16} /> Course Path
                    </JuicyButton>

                    <div className="d-md-flex align-items-end justify-content-between gap-4">
                        <div className="flex-grow-1">
                            <div className="d-flex align-items-center gap-2 mb-2">
                                <span className="badge bg-warning text-dark px-3 mt-1 py-1 fw-bold smallest ls-1 rounded-3">
                                    CURRENT MISSION
                                </span>
                            </div>
                            <h2 className="mb-1">{course.title}</h2>
                            <p className="mb-0 text-muted">{course.vendaTitle}</p>
                        </div>
                        <div className="text-md-end mt-4 mt-md-0" style={{ minWidth: '220px' }}>
                            <div className="d-flex justify-content-between smallest fw-bold text-muted ls-1 uppercase mb-2">
                                <span>MISSION PROGRESS</span>
                                <span>{courseProgress}%</span>
                            </div>
                            <div className="professional-progress-container mb-1 shadow-sm">
                                <div 
                                    className="professional-progress-bar" 
                                    style={{ 
                                        width: `${courseProgress}%`,
                                        backgroundColor: '#FACC15'
                                    }}
                                ></div>
                            </div>
                            <div className="smallest fw-bold text-muted opacity-50 uppercase">{completedCount} / {totalCount} MASTERED</div>
                        </div>
                    </div>
                </header>

                {/* LESSON GRID */}
                <div className="course-grid">
                    {microLessons.map((ml, index) => {
                        const isDone = completedMlIds.includes(ml.id);
                        const isUnlocked = index <= (maxCompletedIdx + 1);
                        const theme = CARD_THEMES[index % CARD_THEMES.length];
                        const slideCount = ml.slides?.length || 0;
                        const questionCount = ml.questions?.length || 0;

                        const borderColor = isDone
                            ? '#22c55e'
                            : isUnlocked
                                ? '#3b82f6'
                                : '#cbd5e1';

                        return (
                            <motion.div 
                                key={ml.id}
                                className={`course-card-professional ${!isUnlocked ? 'locked' : ''}`}
                                onClick={() => { if (isUnlocked) navigate(`/game/${courseId}/${ml.id}`); }}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.06, duration: 0.4, ease: 'easeOut' }}
                                whileHover={isUnlocked ? { y: -4, boxShadow: '0 12px 24px -8px rgba(0,0,0,0.12)' } : {}}
                                style={{ 
                                    '--theme-color': theme.bg,
                                    '--theme-hover': theme.border,
                                    borderColor: borderColor,
                                    borderBottomColor: isDone ? '#16a34a' : isUnlocked ? '#2563eb' : '#94a3b8',
                                } as any}
                            >
                                <div className="d-flex justify-content-between align-items-start mb-2">
                                    <div>
                                        <div className="smallest fw-bold ls-1 text-muted uppercase opacity-50 mb-1">
                                            SECTION {index + 1}
                                        </div>
                                        <div className="card-title text-truncate-2 mb-0" style={{ minHeight: 'auto' }}>{ml.title}</div>
                                    </div>
                                    {isDone && (
                                        <div className="bg-success bg-opacity-10 text-success p-2 rounded-circle">
                                            <Check size={20} />
                                        </div>
                                    )}
                                </div>

                                <div className="card-footer-progress">
                                    <div className="d-flex gap-3 mb-3">
                                        <span className="smallest text-muted fw-bold d-flex align-items-center gap-1">
                                            <BookOpen size={14} /> {slideCount} Slides
                                        </span>
                                        <span className="smallest text-muted fw-bold d-flex align-items-center gap-1">
                                            <ClipboardEdit size={14} /> {questionCount} Tasks
                                        </span>
                                    </div>
                                    <div className="professional-progress-container mb-2">
                                            <div 
                                                className="professional-progress-bar" 
                                                style={{ 
                                                    width: isDone ? '100%' : '0%',
                                                    '--theme-color': theme.progress 
                                                } as any}
                                            ></div>
                                    </div>
                                    <div className="d-flex align-items-center justify-content-between">
                                        <span className="smallest fw-bold text-muted ls-1 uppercase opacity-50">
                                            {isDone ? 'COMPLETED' : (isUnlocked ? 'READY TO START' : 'LOCKED')}
                                        </span>
                                        {isUnlocked && <ChevronRight size={16} className="text-warning" />}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {!isLoggedIn && (
                    <footer className="mt-5 pt-5 text-center">
                        <p className="text-muted small mb-4">Sign in to ensure your learning progress is saved to your account.</p>
                        <JuicyButton onClick={() => navigate('/login')} className="btn btn-dark rounded-pill px-5 py-2 fw-bold smallest ls-1">
                            SIGN IN NOW
                        </JuicyButton>
                    </footer>
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

export default CourseLessons;
