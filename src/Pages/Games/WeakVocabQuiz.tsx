import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Zap, Target, CheckCircle2, XCircle, RefreshCw, BookOpen } from 'lucide-react';
import { progressTracker, type VocabItem } from '../../services/progressTracker';
import { awardPoints, refreshUserData } from '../../services/dataCache';
import { auth, db } from '../../services/firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';
import Mascot from '../../features/gamification/components/Mascot';
import { useVisualJuice } from '../../hooks/useVisualJuice';
import confetti from 'canvas-confetti';

interface QuizQuestion {
    id: number;
    question: string;
    nativeWord: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
    masteryLevel: number;
    wrongCount: number;
}

const WeakVocabQuiz: React.FC = () => {
    const navigate = useNavigate();
    const { playCorrect, playWrong, triggerShake } = useVisualJuice();

    const [loading, setLoading] = useState(true);
    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [answerStatus, setAnswerStatus] = useState<'correct' | 'wrong' | null>(null);
    const [score, setScore] = useState(0);
    const [correctCount, setCorrectCount] = useState(0);
    const [showResult, setShowResult] = useState(false);
    const [correctWords, setCorrectWords] = useState<string[]>([]);
    const [wrongWords, setWrongWords] = useState<string[]>([]);
    const [weakWordsList, setWeakWordsList] = useState<VocabItem[]>([]);
    const [showEmptyState, setShowEmptyState] = useState(false);

    // Lock body scroll
    useEffect(() => {
        const orig = document.body.style.overflow;
        const origOS = document.body.style.overscrollBehavior;
        document.body.style.overflow = 'hidden';
        document.body.style.overscrollBehavior = 'none';
        return () => {
            document.body.style.overflow = orig;
            document.body.style.overscrollBehavior = origOS;
        };
    }, []);

    const loadQuiz = useCallback(async () => {
        setLoading(true);
        setShowEmptyState(false);
        try {
            const [generatedQuestions, weakWords] = await Promise.all([
                progressTracker.generateWeakWordQuiz(10),
                progressTracker.getWeakWords(20)
            ]);

            setWeakWordsList(weakWords);

            if (generatedQuestions.length === 0) {
                setShowEmptyState(true);
            } else {
                setQuestions(generatedQuestions);
                setCurrentIndex(0);
                setSelectedOption(null);
                setAnswerStatus(null);
                setScore(0);
                setCorrectCount(0);
                setShowResult(false);
                setCorrectWords([]);
                setWrongWords([]);
            }
        } catch (error) {
            console.error('Error loading weak vocab quiz:', error);
            setShowEmptyState(true);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadQuiz(); }, [loadQuiz]);

    const handleSelect = (opt: string) => {
        if (selectedOption || answerStatus) return;
        setSelectedOption(opt);

        const q = questions[currentIndex];
        const isCorrect = opt === q.correctAnswer;

        if (isCorrect) {
            playCorrect();
            setAnswerStatus('correct');
            setScore(prev => prev + 2);
            setCorrectCount(prev => prev + 1);
            setCorrectWords(prev => [...prev, q.nativeWord]);
        } else {
            playWrong();
            setAnswerStatus('wrong');
            triggerShake('weak-quiz-card');
            setWrongWords(prev => [...prev, q.nativeWord]);
        }
    };

    const handleContinue = async () => {
        const nextIdx = currentIndex + 1;

        if (nextIdx >= questions.length) {
            // Quiz complete - save results
            setShowResult(true);

            confetti({
                particleCount: 80,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#FACC15', '#FFD700', '#10B981', '#FFFFFF']
            });

            // Update vocabulary mastery
            if (auth.currentUser) {
                const userData = await refreshUserData();
                if (userData?.vocabulary) {
                    const vocab = { ...userData.vocabulary };
                    const now = Date.now();

                    correctWords.forEach(w => {
                        const key = w.toLowerCase().trim();
                        if (vocab[key]) {
                            vocab[key].correctCount += 1;
                            vocab[key].lastReviewed = now;
                            const total = vocab[key].correctCount + vocab[key].wrongCount;
                            vocab[key].masteryLevel = total > 0 ? Math.round((vocab[key].correctCount / total) * 100) : 0;
                        }
                    });

                    wrongWords.forEach(w => {
                        const key = w.toLowerCase().trim();
                        if (vocab[key]) {
                            vocab[key].wrongCount += 1;
                            vocab[key].lastReviewed = now;
                            const total = vocab[key].correctCount + vocab[key].wrongCount;
                            vocab[key].masteryLevel = total > 0 ? Math.round((vocab[key].correctCount / total) * 100) : 0;
                        }
                    });

                    await updateDoc(doc(db, "users", auth.currentUser.uid), { vocabulary: vocab });

                    if (score > 0) {
                        await awardPoints(score);
                    }
                }
            }
        } else {
            setCurrentIndex(nextIdx);
            setSelectedOption(null);
            setAnswerStatus(null);
        }
    };

    // --- LOADING STATE ---
    if (loading) {
        return (
            <div className="d-flex flex-column justify-content-center align-items-center bg-theme-base overflow-hidden" style={{ height: '100dvh' }}>
                <Mascot width="100px" height="100px" mood="excited" />
                <p className="text-theme-muted mt-3 fw-bold" style={{ fontSize: '12px', letterSpacing: '2px', textTransform: 'uppercase' }}>
                    Finding your weak spots...
                </p>
            </div>
        );
    }

    // --- EMPTY STATE ---
    if (showEmptyState) {
        return (
            <div className="d-flex flex-column align-items-center justify-content-center bg-theme-base px-4 overflow-hidden" style={{ height: '100dvh' }}>
                <button onClick={() => navigate('/mitambo')} className="btn-game btn-game-white rounded-circle d-flex align-items-center justify-content-center position-absolute" style={{ top: '20px', left: '20px', width: 44, height: 44, padding: 0, zIndex: 10 }}>
                    <ArrowLeft size={24} strokeWidth={3} className="text-theme-main" />
                </button>

                <div className="text-center" style={{ maxWidth: '400px' }}>
                    <div className="brutalist-card bg-theme-card p-5 shadow-action text-center">
                        <div className="mb-4">
                            <Mascot width="120px" height="120px" mood="excited" />
                        </div>
                        <h2 className="fw-black text-theme-main mb-2 uppercase ls-tight" style={{ fontSize: '1.5rem' }}>ALL CLEAR!</h2>
                        <p className="fw-bold text-theme-muted mb-4" style={{ fontSize: '0.9rem' }}>
                            You don't have any weak vocabulary yet. Complete some lessons first, and we'll track the words you struggle with!
                        </p>

                        {weakWordsList.length > 0 && (
                            <div className="mb-4">
                                <p className="smallest fw-black text-theme-muted uppercase ls-1 mb-2">Words being tracked: {weakWordsList.length}</p>
                            </div>
                        )}

                        <div className="d-grid gap-3">
                            <button className="btn btn-game btn-game-primary py-3 smallest fw-black" onClick={() => navigate('/courses')}>
                                <BookOpen size={16} className="me-2" /> GO TO LESSONS
                            </button>
                            <button className="btn btn-game btn-game-white py-3 smallest fw-black" onClick={() => navigate('/mitambo')}>
                                BACK TO GAMES
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- RESULT SCREEN ---
    if (showResult) {
        const accuracy = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;
        const getMessage = () => {
            if (accuracy >= 80) return "AMAZING PROGRESS!";
            if (accuracy >= 50) return "GETTING STRONGER!";
            return "KEEP PRACTICING!";
        };

        return (
            <div className="d-flex flex-column align-items-center justify-content-center bg-theme-base px-4 overflow-hidden" style={{ height: '100dvh' }}>
                <div className="text-center animate__animated animate__fadeIn" style={{ maxWidth: '450px', width: '100%' }}>
                    <div className="brutalist-card bg-theme-card p-4 shadow-action">
                        <div className="mb-3">
                            <Mascot width="100px" height="100px" mood="excited" />
                        </div>

                        <h1 className="fw-black text-theme-main mb-1 uppercase ls-tight" style={{ fontSize: '2rem' }}>
                            {getMessage()}
                        </h1>
                        <p className="text-theme-muted fw-bold smallest uppercase ls-1 mb-4">
                            Weak vocab review complete
                        </p>

                        <div className="d-flex justify-content-center gap-4 mb-4">
                            <div className="text-center">
                                <div className="fw-black text-success" style={{ fontSize: '2.5rem' }}>{correctCount}</div>
                                <div className="smallest fw-black text-theme-muted uppercase ls-1">Correct</div>
                            </div>
                            <div className="text-center">
                                <div className="fw-black text-danger" style={{ fontSize: '2.5rem' }}>{questions.length - correctCount}</div>
                                <div className="smallest fw-black text-theme-muted uppercase ls-1">Missed</div>
                            </div>
                            <div className="text-center">
                                <div className="fw-black" style={{ fontSize: '2.5rem', color: 'var(--venda-yellow)' }}>{accuracy}%</div>
                                <div className="smallest fw-black text-theme-muted uppercase ls-1">Accuracy</div>
                            </div>
                        </div>

                        {score > 0 && (
                            <div className="mb-4">
                                <span className="badge bg-dark text-warning px-3 py-2 fw-black" style={{ fontSize: '1rem' }}>
                                    +{score} XP EARNED
                                </span>
                            </div>
                        )}

                        <div className="d-grid gap-3">
                            <button className="btn btn-game btn-game-primary py-3 smallest fw-black" onClick={loadQuiz}>
                                <RefreshCw size={16} className="me-2" /> PRACTICE AGAIN
                            </button>
                            <button className="btn btn-game btn-game-white py-3 smallest fw-black" onClick={() => navigate('/mitambo')}>
                                BACK TO GAMES
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- QUIZ UI ---
    const q = questions[currentIndex];
    const progress = ((currentIndex + 1) / questions.length) * 100;

    return (
        <div className="d-flex flex-column bg-theme-surface overflow-hidden" style={{ height: '100dvh' }}>
            {/* Header */}
            <div className="bg-theme-surface px-3 pt-2 pb-2 sticky-top" style={{ zIndex: 1000 }}>
                <div className="container" style={{ maxWidth: '650px' }}>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <button className="btn p-0 btn-game-white brutalist-card--sm rounded-circle d-flex align-items-center justify-content-center" onClick={() => navigate('/mitambo')} style={{ width: 36, height: 36 }}>
                            <ArrowLeft size={20} className="text-theme-main" />
                        </button>
                        <div className="d-flex align-items-center gap-2">
                            <Target size={16} className="text-danger" />
                            <span className="smallest fw-black text-danger uppercase ls-1">WEAK WORDS</span>
                        </div>
                        <span className="badge bg-dark text-white smallest fw-black px-2 py-1 rounded" style={{ fontSize: '10px' }}>
                            {currentIndex + 1}/{questions.length}
                        </span>
                    </div>
                    <div className="progress brutalist-card--sm p-0 overflow-hidden" style={{ height: '12px', borderRadius: 20, backgroundColor: 'var(--color-surface-soft)', border: '3px solid var(--color-border)' }}>
                        <div className="progress-bar" style={{ width: `${progress}%`, backgroundColor: '#EF4444', transition: '0.6s cubic-bezier(0.34, 1.56, 0.64, 1)' }}></div>
                    </div>
                </div>
            </div>

            {/* Quiz Content */}
            <div className="flex-grow-1 overflow-auto bg-theme-surface d-flex align-items-center">
                <div className="container py-3" style={{ maxWidth: '650px' }}>
                    <div id="weak-quiz-card" className="animate__animated animate__fadeIn px-2 w-100">
                        <div className="brutalist-card p-3 p-md-4 w-100 text-center shadow-action">
                            {/* Mastery Indicator */}
                            <div className="d-flex justify-content-center mb-2">
                                <span className="badge brutalist-card--sm bg-theme-surface text-danger border-danger border-2 px-2 py-1 smallest fw-black uppercase ls-1 d-flex align-items-center gap-1" style={{ fontSize: '0.6rem' }}>
                                    <Zap size={12} /> NEEDS PRACTICE
                                </span>
                            </div>

                            {/* Question */}
                            <h2 className="fw-black text-theme-main mb-3 ls-tight uppercase" style={{ fontSize: 'clamp(1.1rem, 4vw, 1.6rem)' }}>
                                {q.question}
                            </h2>

                            {/* Options */}
                            <div className="d-grid gap-2 w-100 text-start pb-2">
                                {q.options.map((opt) => {
                                    const isCorrect = opt === q.correctAnswer;
                                    const isSelected = selectedOption === opt;
                                    let cls = 'btn-game-white border-dark border-3';

                                    if (isSelected) {
                                        cls = isCorrect
                                            ? 'btn-success border-success text-white'
                                            : 'btn-danger border-danger text-white';
                                    } else if (selectedOption && isCorrect && answerStatus === 'wrong') {
                                        cls = 'btn-success border-success text-white opacity-75';
                                    }

                                    return (
                                        <button
                                            key={opt}
                                            className={`btn py-3 fw-bold rounded-4 ${cls}`}
                                            style={{ fontSize: '0.95rem' }}
                                            onClick={() => handleSelect(opt)}
                                            disabled={!!selectedOption}
                                        >
                                            {opt}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Feedback Panel */}
            {answerStatus && (
                <div className="position-fixed bottom-0 start-0 end-0 animate__animated animate__slideInUp animate__faster"
                    style={{
                        zIndex: 9999,
                        borderTop: '6px solid var(--color-border)',
                        backgroundColor: answerStatus === 'correct'
                            ? (document.documentElement.getAttribute('data-theme') === 'dark' ? '#064e3b' : '#dcfce7')
                            : (document.documentElement.getAttribute('data-theme') === 'dark' ? '#7f1d1d' : '#fef2f2'),
                        boxShadow: '0 -20px 60px rgba(0,0,0,0.2)'
                    }}>
                    <div className="container py-2 py-md-3" style={{ maxWidth: '650px' }}>
                        <div className="d-flex flex-column gap-2">
                            <div className="d-flex align-items-center gap-2 px-2">
                                <div className="bg-white brutalist-card--sm rounded-circle d-flex align-items-center justify-content-center" style={{ width: 40, height: 40 }}>
                                    {answerStatus === 'correct'
                                        ? <CheckCircle2 size={24} color="#16a34a" />
                                        : <XCircle size={24} color="#dc2626" />}
                                </div>
                                <div>
                                    <h2 className="fw-black mb-0 ls-tight uppercase" style={{
                                        color: answerStatus === 'correct' ? '#16a34a' : '#dc2626',
                                        fontSize: '1.1rem'
                                    }}>
                                        {answerStatus === 'correct' ? 'Getting Stronger!' : 'Keep Trying!'}
                                    </h2>
                                    {answerStatus === 'wrong' && (
                                        <p className="smallest fw-black mb-0 text-uppercase" style={{ opacity: 0.8, fontSize: '0.6rem' }}>
                                            {q.explanation}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <button
                                className="btn btn-game w-100 py-2 text-white border-0 mt-1"
                                style={{
                                    backgroundColor: answerStatus === 'correct' ? '#22c55e' : '#ef4444',
                                    boxShadow: `0 4px 0 ${answerStatus === 'correct' ? '#16a34a' : '#dc2626'}`,
                                    fontSize: '1rem'
                                }}
                                onClick={handleContinue}
                            >
                                CONTINUE
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WeakVocabQuiz;
