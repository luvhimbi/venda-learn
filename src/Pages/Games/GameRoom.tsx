import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useMachine } from '@xstate/react';
import { gameRoomMachine } from '../../machines/gameRoomMachine';
import type { Question, MCQuestion, TFQuestion, FBQuestion, MPQuestion, LCQuestion } from '../../types/game';
import ScorePopup from '../../components/Game/ScorePopup';
import ExitModal from '../../components/Game/ExitModal';
import MultipleChoiceQuestion from '../../components/Game/MultipleChoiceQuestion';
import TrueFalseQuestion from '../../components/Game/TrueFalseQuestion';
import FillBlankQuestion from '../../components/Game/FillBlankQuestion';
import MatchPairsQuestion from '../../components/Game/MatchPairsQuestion';
import ListenChooseQuestion from '../../components/Game/ListenChooseQuestion';
import { useAudio } from '../../hooks/useAudio';
import { useGameLogic } from '../../hooks/useGameLogic';
import Mascot, { type MascotMood } from '../../components/Mascot';
import { useVisualJuice } from '../../hooks/useVisualJuice';
import { updateStreak } from '../../services/streakUtils';
import { popupService } from '../../services/popupService';
import { Trophy, HelpCircle, X, Bookmark, CheckCircle2, Volume2, Play, Flame, Zap, Users, Circle } from 'lucide-react';
import { db, auth } from '../../services/firebaseConfig';
import { doc, updateDoc, arrayUnion, increment } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { getCurrentWeekIdentifier } from "../../services/levelUtils.ts";
import { type Difficulty } from "../../services/scoringUtils.ts";
import { fetchLessons, fetchUserData, refreshUserData, invalidateCache, getMicroLessons } from '../../services/dataCache';
import { checkAchievements, awardTrophies } from '../../services/achievementService';
import Swal from 'sweetalert2';

const MASCOT_CHEERS = [
    'Zwavhuḓi!',
    'Ndi zwone!',
    'Hu ḓo luga!',
    'Wa ḓivha!',
    'Ṱhonifhani!',
];

const GameRoom: React.FC = () => {
    const { lessonId, microLessonId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    const queryParams = new URLSearchParams(location.search);
    const startIdx = parseInt(queryParams.get('start') || '0');
    const startType = queryParams.get('type') || 'STUDY';

    const storageKey = `game_state_${lessonId}_${microLessonId || 'default'}`;

    const getSavedState = useCallback(() => {
        try {
            const saved = localStorage.getItem(storageKey);
            return saved ? JSON.parse(saved) : null;
        } catch (e) {
            console.error('Failed to load saved game state', e);
            return null;
        }
    }, [storageKey]);

    const initialPersistentState = getSavedState();

    const [state, send] = useMachine(gameRoomMachine);
    
    // Map XState value to original gameState string formats for UI logic
    const gameState = state.value === 'idle' 
        ? (initialPersistentState?.gameState || startType || 'STUDY') 
        : state.value.toString().toUpperCase();
        
    const isFirstTime = state.value === 'idle' ? true : state.context.isFirstTime;

    const [lesson, setLesson] = useState<any>(null);
    const [currentSlide, setCurrentSlide] = useState(
        initialPersistentState?.gameState === 'STUDY' ? initialPersistentState.currentSlide : (startType === 'STUDY' ? startIdx : 0)
    );

    const { isPlayingAudio, speakVenda, setAudioUrl } = useAudio();
    const [studyStartTime, setStudyStartTime] = useState(initialPersistentState?.studyStartTime || Date.now());

    const [showExitModal, setShowExitModal] = useState(false);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [selectedTF, setSelectedTF] = useState<boolean | null>(null);

    const [showMascotCheer, setShowMascotCheer] = useState(false);
    const [mascotCheerText, setMascotCheerText] = useState(MASCOT_CHEERS[0]);
    const [mascotMood, setMascotMood] = useState<MascotMood>('happy');
    const [showSavedHint, setShowSavedHint] = useState(false);
    const [userData, setUserData] = useState<any>(null);
    const { playCorrect, playWrong, triggerShake } = useVisualJuice();

    const handleFinishQuiz = async (finalScore: number, _finalCorrect: number, totalDuration: number) => {
        send({ type: 'FINISH', score: finalScore });
        setMascotMood('excited');

        if (isFirstTime) {
            // Add celebration effect
            const canvas = document.createElement('canvas');
            canvas.style.position = 'fixed';
            canvas.style.top = '0';
            canvas.style.left = '0';
            canvas.style.width = '100%';
            canvas.style.height = '100%';
            canvas.style.pointerEvents = 'none';
            canvas.style.zIndex = '9999';
            document.body.appendChild(canvas);

            import('canvas-confetti').then((confetti) => {
                const myConfetti = confetti.create(canvas, { resize: true });
                myConfetti({
                    particleCount: 150,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ['#FACC15', '#3B82F6', '#EF4444']
                });
                setTimeout(() => document.body.removeChild(canvas), 5000);
            });
        }

        if (auth.currentUser) {
            const userRef = doc(db, "users", auth.currentUser.uid);
            const currentData = await refreshUserData();
            if (currentData) {
                const mlId = microLessonId || lesson?.id || `${lessonId}__ml_0`;
                const courseId = lesson?.courseId || lessonId;
                const studyDuration = Math.floor((Date.now() - studyStartTime) / 1000) - totalDuration;

                if (isFirstTime) {
                    const currentWeek = getCurrentWeekIdentifier();
                    
                    const updateData: any = {
                        points: increment(finalScore),
                        completedLessons: arrayUnion(mlId),
                        lastLessonId: null,
                        [`microLessonProgress.${mlId}`]: {
                            completed: true,
                            score: finalScore,
                            quizDuration: totalDuration,
                            studyDuration: Math.max(0, studyDuration),
                            timestamp: new Date().toISOString()
                        },
                    };

                    if (currentData.lastActiveWeek !== currentWeek) {
                        updateData.weeklyXP = finalScore;
                        updateData.lastActiveWeek = currentWeek;
                    } else {
                        updateData.weeklyXP = increment(finalScore);
                    }
                    const lessons = await fetchLessons();
                    const foundCourse = lessons.find((l: any) => l.id === lessonId);
                    if (foundCourse) {
                        const allMls = getMicroLessons(foundCourse);
                        const alreadyCompleted = currentData.completedLessons || [];
                        const nowCompleted = [...alreadyCompleted, mlId];
                        const allMlsDone = allMls.every((ml: any) => nowCompleted.includes(ml.id));
                        if (allMlsDone) updateData.completedCourses = arrayUnion(courseId);
                    }
                    await updateDoc(userRef, updateData);
                }

                const streakResult = await updateStreak(auth.currentUser.uid);
                invalidateCache(`user_${auth.currentUser.uid}`);
                invalidateCache('topLearners');

                if (streakResult?.isNewDay) {
                    setTimeout(() => {
                        if (streakResult.freezeUsed) {
                            Swal.fire({
                                title: 'Streak Frozen!',
                                text: `A freeze was used to protect your ${streakResult.streak} day streak!`,
                                icon: 'info',
                                imageUrl: 'https://cdn-icons-png.flaticon.com/512/2913/2913524.png',
                                imageWidth: 80,
                                confirmButtonColor: '#0EA5E9',
                                confirmButtonText: 'Whew!',
                                customClass: { popup: 'rounded-4' }
                            });
                        } else if (streakResult.wasReset) {
                            Swal.fire({
                                title: 'New Streak!',
                                text: `Starting fresh today. Keep it up!`,
                                icon: 'info',
                                confirmButtonColor: '#64748B',
                                confirmButtonText: 'Let us go!',
                                customClass: { popup: 'rounded-4' }
                            });
                        } else {
                            Swal.fire({
                                title: 'Streak Maintained!',
                                text: `${streakResult.streak} Days Strong!`,
                                icon: 'success',
                                imageUrl: 'https://cdn-icons-png.flaticon.com/512/785/785116.png',
                                imageWidth: 80,
                                confirmButtonColor: '#EF4444',
                                confirmButtonText: 'Let us go!',
                                customClass: { popup: 'rounded-4' }
                            });
                        }
                    }, 1300);
                }

                const newTrophies = checkAchievements(
                    {
                        ...currentData,
                        points: (currentData.points || 0) + finalScore,
                        completedLessons: [...(currentData.completedLessons || []), mlId]
                    },
                    currentData.trophies || []
                );
                if (newTrophies.length > 0) {
                    await awardTrophies(auth.currentUser.uid, newTrophies.map(t => t.id));
                    setTimeout(() => {
                        const first = newTrophies[0];
                        Swal.fire({
                            title: 'Trophy Unlocked!',
                            text: `New Achievement: ${first.title}!`,
                            icon: 'success',
                            imageUrl: 'https://cdn-icons-png.flaticon.com/512/3112/3112946.png',
                            imageWidth: 80,
                            confirmButtonColor: '#FACC15',
                            confirmButtonText: 'Awesome!',
                            customClass: { popup: 'rounded-4' }
                        });
                    }, 1000);
                }
                if (isFirstTime) {
                    popupService.innerSuccess(
                        'Quiz Finished!',
                        `<p style="font-size:14px;color:#666">You've completed this session.</p><h2 style="color:#FACC15;font-weight:800">+${finalScore} XP</h2>`
                    ).then(() => { navigate('/mitambo'); });
                } else {
                    popupService.innerSuccess(
                        'Review Complete!',
                        `<p style="font-size:14px;color:#666">Great job refreshing your knowledge.</p>`
                    ).then(() => { navigate('/mitambo'); });
                }
            }
            localStorage.removeItem(storageKey);
        }
    };

    const {
        currentQIndex, setCurrentQIndex,
        score,
        lastScoreResult,
        answerStatus, setAnswerStatus,
        showExplanation,
        scoreBreakdown,
        correctCount,
        streak,
        handleCorrect: onCorrectAnswer,
        handleWrong: onWrongAnswer,
        awardConsolation,
        moveNext: nextQuestion,
        reset: resetGameLogic
    } = useGameLogic({
        difficulty: (lesson?.difficulty as Difficulty) || 'Easy',
        totalQuestions: lesson?.questions?.length || 0,
        initialState: initialPersistentState?.quizState,
        onFinish: handleFinishQuiz,
        onCorrect: () => {
            setSelectedOption(null);
            setSelectedTF(null);
            setMascotMood('excited');
            playCorrect();
            setMascotCheerText(MASCOT_CHEERS[Math.floor(Math.random() * MASCOT_CHEERS.length)]);
            setShowMascotCheer(true);
            setTimeout(() => {
                setShowMascotCheer(false);
                setMascotMood('happy');
            }, 1100);
        },
        onWrong: () => {
            setMascotMood('sad');
            playWrong();
            // triggerShake('dc-card-container');
            const arena = document.getElementById('wb-arena-shake');
            if (arena) triggerShake('wb-arena-shake');
            else triggerShake('quiz-container');

            setLesson((prev: any) => {
                if (!prev || !prev.questions) return prev;
                const currentQuestion = prev.questions[currentQIndex];
                return {
                    ...prev,
                    questions: [...prev.questions, { ...currentQuestion, _isRepeat: true }]
                };
            });
        }
    });

    const saveStateToStorage = useCallback((showHint = false) => {
        if (gameState === 'RESULT') return;
        const repeatedQuestions = lesson?.questions?.filter((q: any) => q._isRepeat) || [];
        const stateToSave = {
            gameState, currentSlide, studyStartTime,
            quizState: { currentQIndex, score, correctCount, streak, scoreBreakdown, repeatedQuestions },
            timestamp: Date.now()
        };
        localStorage.setItem(storageKey, JSON.stringify(stateToSave));
        if (showHint) {
            setShowSavedHint(true);
            setTimeout(() => setShowSavedHint(false), 2000);
        }
    }, [gameState, currentSlide, studyStartTime, currentQIndex, score, correctCount, streak, scoreBreakdown, storageKey, lesson]);

    useEffect(() => { saveStateToStorage(false); }, [saveStateToStorage, gameState, currentSlide, studyStartTime, currentQIndex, score, correctCount, streak, scoreBreakdown, lesson]);

    useEffect(() => {
        if (gameState === 'QUIZ') {
            const saved = getSavedState();
            if (!saved || saved.gameState !== 'QUIZ') {
                resetGameLogic();
                if (startType === 'QUIZ' && startIdx > 0) setCurrentQIndex(startIdx);
            }
        } else if (gameState === 'STUDY') {
            const saved = getSavedState();
            if (!saved || saved.gameState !== 'STUDY') setStudyStartTime(Date.now());
        }
    }, [gameState, resetGameLogic, startIdx, startType, setCurrentQIndex, getSavedState]);

    useEffect(() => {
        // Prevent state leak between questions
        setSelectedOption(null);
        setSelectedTF(null);
    }, [currentQIndex]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user && lessonId) {
                const lessons = await fetchLessons();
                const foundCourse = lessons.find((l: any) => l.id === lessonId);
                if (foundCourse) {
                    const mls = getMicroLessons(foundCourse);
                    const foundMl = microLessonId ? mls.find((ml: any) => ml.id === microLessonId) : mls[0];
                    if (foundMl) {
                        const saved = getSavedState();
                        const extraQuestions = saved?.quizState?.repeatedQuestions || [];
                        setLesson({
                            ...foundMl,
                            questions: [...(foundMl.questions || []), ...extraQuestions],
                            difficulty: foundCourse.difficulty,
                            title: foundMl.title,
                            courseId: foundCourse.id,
                            courseTitle: foundCourse.title
                        });
                    }
                }
                const userData = await fetchUserData();
                if (userData) {
                    setUserData(userData);
                    const completed = userData.completedLessons || [];
                    const mlId = microLessonId || `${lessonId}__ml_0`;
                    const isFirst = !completed.includes(mlId);
                    
                    send({ 
                        type: 'INITIALIZE', 
                        isFirstTime: isFirst,
                        startType: initialPersistentState?.gameState || startType || 'STUDY'
                    });
                }
            }
        });
        return () => unsubscribe();
    }, [lessonId, microLessonId, send, initialPersistentState?.gameState, startType]);

    const saveProgress = async (index: number, type: 'STUDY' | 'QUIZ') => {
        if (auth.currentUser && lessonId) {
            await updateDoc(doc(db, "users", auth.currentUser.uid), {
                lastLessonId: lessonId,
                lastMicroLessonId: microLessonId || null,
                lastProgressIndex: index,
                lastProgressType: type.toLowerCase()
            });
        }
    };

    const handleMCSelect = (opt: string, correctAnswer: string) => {
        if (selectedOption || answerStatus) return;
        setSelectedOption(opt);
        opt === correctAnswer ? onCorrectAnswer() : onWrongAnswer();
    };

    const handleTFSelect = (val: boolean, correctAnswer: boolean) => {
        if (selectedTF !== null || answerStatus) return;
        setSelectedTF(val);
        val === correctAnswer ? onCorrectAnswer() : onWrongAnswer();
    };

    const handleFBSubmit = (answer: string, correctAnswer: string) => {
        answer.toLowerCase() === correctAnswer.toLowerCase() ? onCorrectAnswer() : onWrongAnswer();
    };

    const handleMatchComplete = (allCorrect: boolean) => {
        if (allCorrect) {
            onCorrectAnswer();
        } else {
            setAnswerStatus('correct');
            awardConsolation();
            setTimeout(() => nextQuestion(), 1200);
        }
    };

    const handleLCSelect = (opt: string, correctAnswer: string) => {
        if (selectedOption || answerStatus) return;
        setSelectedOption(opt);
        opt === correctAnswer ? onCorrectAnswer() : onWrongAnswer();
    };

    if (!lesson) {
        return (
            <div className="min-vh-100 bg-white d-flex align-items-center justify-content-center">
                <div className="spinner-border" style={{ color: '#FACC15' }}></div>
            </div>
        );
    }

    const renderProgressHeader = () => {
        let current = 0;
        let total = 1;
        
        if (gameState === 'STUDY') {
            current = currentSlide + 1;
            total = lesson.slides.length;
        } else if (gameState === 'QUIZ') {
            current = currentQIndex + 1;
            total = lesson.questions.length;
        }
        const progress = (current / total) * 100;
        const modeLabel = gameState === 'STUDY' ? 'STUDY' : (gameState === 'QUIZ' ? 'QUIZ' : 'COMPLETE');

        return (
            <div className="bg-white px-3 pt-3 pb-2 sticky-top border-bottom" style={{ zIndex: 1000 }}>
                <div className="container" style={{ maxWidth: '600px' }}>
                    <div className="d-flex justify-content-end align-items-center mb-2">
                        <div className="d-flex align-items-center gap-3">
                            <div className="d-flex align-items-center gap-2 bg-light px-3 py-1 rounded-pill">
                                <Trophy size={14} className="text-warning" />
                                <span className="smallest fw-bold" style={{ color: '#111827' }}>{userData?.points || 0} XP</span>
                            </div>
                            <button className="btn p-0 border-0" onClick={() => setShowExitModal(true)}>
                                <X size={20} className="text-secondary" />
                            </button>
                        </div>
                    </div>
                    <div className="d-flex flex-column gap-1">
                        <div className="progress" style={{ height: '4px', borderRadius: 10, backgroundColor: 'rgba(0,0,0,.05)' }}>
                            <div className="progress-bar" style={{ width: `${progress}%`, backgroundColor: '#FACC15', transition: '0.6s cubic-bezier(0.34, 1.56, 0.64, 1)', borderRadius: 10 }}></div>
                        </div>
                        <div className="d-flex justify-content-between mt-1">
                            <span className="smallest fw-bold text-muted ls-1">{modeLabel}</span>
                            {gameState === 'STUDY' ? (
                                <button className="btn btn-link p-0 text-decoration-none smallest fw-bold text-success ls-1" onClick={() => saveStateToStorage(true)}>
                                    {showSavedHint ? 'SAVED!' : 'SAVE PROGRESS'}
                                </button>
                            ) : (
                                <span className="smallest fw-bold text-warning ls-1">{streak > 1 ? `🔥 ${streak} STREAK` : ''}</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderContent = () => {
        if (gameState === 'STUDY') {
            const slide = lesson.slides[currentSlide];
            const isLastSlide = currentSlide + 1 >= lesson.slides.length;

            return (
                <div className="min-vh-100 d-flex flex-column" style={{ background: '#FFFFFF' }}>
                    {renderProgressHeader()}

                    <div className="flex-grow-1 overflow-auto bg-light">
                        <div className="container py-4" style={{ maxWidth: '600px' }}>
                            <div key={currentSlide} className="animate__animated animate__fadeIn animate__faster px-2">
                                
                                {/* Main Lesson Card */}
                                <div className="bg-white rounded-5 shadow-sm border border-light p-4 p-md-5 w-100 position-relative" style={{ overflow: 'hidden' }}>
                                    
                                    {/* Mascot Tutoring */}
                                    <div className="d-flex align-items-start gap-3 mb-5 mt-2">
                                        <Mascot width="60px" height="60px" mood={mascotMood} />
                                        <div className="bg-light p-3 rounded-4 position-relative" style={{ fontSize: '0.9rem', color: '#111827' }}>
                                            <div className="position-absolute" style={{ width: 12, height: 12, backgroundColor: '#f8f9fa', top: 15, left: -6, transform: 'rotate(45deg)' }}></div>
                                            <strong>Tip:</strong> {currentSlide === 0 ? "Let's start with basic greetings!" : "You're doing great, keep going!"}
                                        </div>
                                    </div>

                                    {/* Section 1: Phrase Display */}
                                    <div className="text-center mb-5">
                                        <h1 className="fw-900 mb-2" style={{ fontSize: 'clamp(2.5rem, 10vw, 4.5rem)', color: '#111827', letterSpacing: '-2px' }}>{slide.venda}</h1>
                                        <h4 className="text-secondary fw-bold mb-0" style={{ opacity: 0.6 }}>{slide.english}</h4>
                                    </div>

                                    {/* Section 2: Audio Interaction */}
                                    <div className="text-center mb-5">
                                        <div className="d-flex flex-column align-items-center gap-3">
                                            <div className="d-flex align-items-center gap-3">
                                                <button className="btn rounded-circle d-flex align-items-center justify-content-center shadow-lg hover-scale" 
                                                    onClick={() => speakVenda(slide.venda)}
                                                    style={{ width: 64, height: 64, backgroundColor: isPlayingAudio ? '#FACC15' : '#111827', border: 'none', transition: 'all 0.3s' }}>
                                                    <Play size={24} fill={isPlayingAudio ? '#111827' : '#FFFFFF'} className={isPlayingAudio ? 'text-dark' : 'text-white'} />
                                                </button>
                                                <button className="btn bg-light rounded-circle shadow-sm d-flex align-items-center justify-content-center hover-scale" 
                                                    onClick={() => speakVenda(slide.venda)}
                                                    style={{ width: 42, height: 42, border: 'none' }}>
                                                    <span className="fw-bold text-dark" style={{ fontSize: '10px' }}>0.5x</span>
                                                </button>
                                            </div>
                                            <span className="smallest fw-bold text-muted ls-2 text-uppercase">Listen to pronunciation</span>
                                        </div>
                                    </div>

                                    <div className="hr-fade mb-5"></div>

                                    {/* Section 3: Usage Explanation */}
                                    <div className="mb-5 px-md-4">
                                        <p className="smallest fw-bold text-muted ls-2 mb-4 text-uppercase d-flex align-items-center gap-2">
                                            <HelpCircle size={14} className="text-warning" /> USAGE EXPLAINER
                                        </p>
                                        <div className="d-flex flex-column gap-4">
                                            {slide.context.split('. ').map((point: string, idx: number) => {
                                                if (!point.trim()) return null;
                                                const isGenderSpecific = point.toLowerCase().includes('men') || point.toLowerCase().includes('women');
                                                return (
                                                    <div key={idx} className="d-flex align-items-start gap-3">
                                                        <div className="mt-1">
                                                            {isGenderSpecific ? (
                                                                <div className="rounded-pill bg-warning-subtle p-2 d-flex align-items-center justify-content-center" style={{ width: 32, height: 32 }}>
                                                                    <Users size={16} className="text-warning" />
                                                                </div>
                                                            ) : (
                                                                <div className="rounded-pill bg-blue-subtle p-2 d-flex align-items-center justify-content-center" style={{ width: 32, height: 32 }}>
                                                                    <Circle size={10} fill="currentColor" className="text-primary" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <p className="mb-0 text-dark-emphasis" style={{ lineHeight: 1.6, fontSize: '1.05rem' }}>{point.endsWith('.') ? point : point + '.'}</p>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Navigation Controls */}
                    <div className="bg-white px-4 py-3 border-top pb-5">
                        <div className="container" style={{ maxWidth: '600px' }}>
                            <div className="d-flex gap-3">
                                <button className="btn border-2 py-1.5 px-3 rounded-4 d-flex flex-column align-items-center justify-content-center flex-grow-1"
                                    disabled={currentSlide === 0}
                                    onClick={() => { setAudioUrl(null); const prev = currentSlide - 1; setCurrentSlide(prev); saveProgress(prev, 'STUDY'); }}
                                    style={{ borderColor: '#E5E7EB', color: '#6B7280', minHeight: '44px' }}>
                                    <span className="fw-900 ls-1" style={{ fontSize: '0.75rem' }}>BACK</span>
                                    <span className="smallest opacity-50 fw-bold" style={{ fontSize: '8px' }}>BACK</span>
                                </button>
                                {!isLastSlide ? (
                                    <button className="btn game-btn-primary py-1.5 px-3 d-flex flex-column align-items-center justify-content-center flex-grow-2"
                                        onClick={() => { setAudioUrl(null); const next = currentSlide + 1; setCurrentSlide(next); saveProgress(next, 'STUDY'); }}
                                        style={{ backgroundColor: '#FACC15', border: 'none', borderRadius: '12px', boxShadow: '0 3px 0 #EAB308', flex: 2, minHeight: '44px' }}>
                                        <span className="fw-900 ls-1" style={{ fontSize: '0.85rem' }}>NEXT</span>
                                        <span className="smallest opacity-70 fw-900" style={{ fontSize: '8px' }}>NEXT</span>
                                    </button>
                                ) : (
                                    <button className="btn py-1.5 px-3 d-flex flex-column align-items-center justify-content-center text-white flex-grow-2"
                                        style={{ background: '#111827', borderRadius: '12px', boxShadow: '0 3px 0 #000', flex: 2, minHeight: '44px' }}
                                        onClick={() => {
                                            if (lesson.questions && lesson.questions.length > 0) {
                                                send({ type: 'START_QUIZ' });
                                                saveProgress(0, 'QUIZ');
                                            } else {
                                                send({ type: 'SKIP_QUIZ' });
                                                setMascotMood('excited');
                                            }
                                        }}>
                                        <span className="fw-900 ls-1" style={{ fontSize: '0.85rem' }}>{lesson.questions?.length > 0 ? 'START QUIZ' : 'FINISH LESSON'}</span>
                                        <span className="smallest opacity-50 fw-bold" style={{ fontSize: '8px' }}>{lesson.questions?.length > 0 ? "LET'S PLAY" : "WELL DONE"}</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        if (gameState === 'NO_QUIZ') {
            return (
                <div className="min-vh-100 d-flex flex-column" style={{ background: '#FFFFFF' }}>
                    {renderProgressHeader()}
                    <div className="flex-grow-1 d-flex align-items-center justify-content-center p-3 bg-light">
                        <div className="text-center w-100 bg-white rounded-5 p-4 p-md-5 shadow-sm border border-light animate__animated animate__zoomIn" style={{ maxWidth: '500px' }}>
                            <div className="d-flex justify-content-center mb-4">
                                <Mascot mood="excited" width="120px" height="120px" />
                            </div>
                            <h1 className="fw-900 display-5 text-dark mb-2 ls-tight">All Done!</h1>
                            <p className="text-muted mb-4 ls-1 smallest fw-bold uppercase">YOU'VE REVIEWED ALL THE CONTENT</p>
                            <div className="py-4 border-top border-bottom mb-4">
                                <p className="text-secondary small mb-0 px-3">Great job! There's no quiz for this lesson, but you've mastered the material.</p>
                                {isFirstTime && (
                                    <div className="mt-3">
                                        <h2 style={{ color: '#FACC15', fontWeight: 800 }}>+50 XP</h2>
                                        <span className="smallest text-muted fw-bold">COMPLETION BONUS</span>
                                    </div>
                                )}
                            </div>
                            <button className="btn game-btn-primary w-100 py-3 fw-900 ls-1 shadow-sm" 
                                onClick={() => handleFinishQuiz(50, 0, 0)} 
                                style={{ borderRadius: '18px', backgroundColor: '#FACC15', boxShadow: '0 6px 0 #EAB308' }}>
                                {isFirstTime ? 'FINISH & COLLECT' : 'FINISH REVIEW'}
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        if (gameState === 'QUIZ') {
            const q = lesson.questions[currentQIndex] as Question;

            const renderQuestion = () => {
                switch (q.type) {
                    case 'true-false': return <TrueFalseQuestion q={q as TFQuestion} selected={selectedTF} status={answerStatus} onSelect={(v) => handleTFSelect(v, (q as TFQuestion).correctAnswer)} />;
                    case 'fill-in-the-blank': return <FillBlankQuestion q={q as FBQuestion} status={answerStatus} onSubmit={(a) => handleFBSubmit(a, (q as FBQuestion).correctAnswer)} />;
                    case 'match-pairs': return <MatchPairsQuestion q={q as MPQuestion} onComplete={handleMatchComplete} />;
                    case 'listen-and-choose': return <ListenChooseQuestion q={q as LCQuestion} selected={selectedOption} status={answerStatus} onSelect={(o) => handleLCSelect(o, (q as LCQuestion).correctAnswer)} speakVenda={speakVenda} />;
                    default: return <MultipleChoiceQuestion q={q as MCQuestion} selected={selectedOption} status={answerStatus} onSelect={(o) => handleMCSelect(o, (q as MCQuestion).correctAnswer)} />;
                }
            };

            const typeLabel: Record<string, { label: string, icon: any }> = {
                'multiple-choice': { label: 'MULTIPLE CHOICE', icon: <Bookmark size={12} /> },
                'true-false': { label: 'TRUE OR FALSE', icon: <CheckCircle2 size={12} /> },
                'fill-in-the-blank': { label: 'FILL IN THE BLANK', icon: <HelpCircle size={12} /> },
                'match-pairs': { label: 'MATCH PAIRS', icon: <Users size={12} /> },
                'listen-and-choose': { label: 'LISTEN & CHOOSE', icon: <Volume2 size={12} /> },
            };
            const currentLabel = typeLabel[q.type] || { label: 'QUESTION', icon: <HelpCircle size={12} /> };

            return (
                <div className="min-vh-100 d-flex flex-column" style={{ background: '#FFFFFF' }}>
                    {renderProgressHeader()}
                    <ScorePopup result={lastScoreResult} />
                    {showMascotCheer && (
                        <div className="mascot-cheer-overlay">
                            <div className="mascot-cheer-bubble">{mascotCheerText}</div>
                            <Mascot width="90px" height="90px" mood={mascotMood} />
                        </div>
                    )}
                    <div className="flex-grow-1 overflow-auto bg-light">
                        <div className="container py-4" style={{ maxWidth: '600px' }}>
                            <div className="animate__animated animate__fadeIn px-2">
                                <div className="bg-white rounded-5 shadow-sm border border-light p-4 p-md-5 w-100 text-center">
                                    <div className="d-flex justify-content-center mb-4">
                                        <span className="badge rounded-pill bg-light text-dark border smallest d-flex align-items-center gap-2 py-2 px-3">
                                            {currentLabel.icon} {currentLabel.label}
                                        </span>
                                    </div>

                                    <div className="mb-4">
                                        <Mascot width="80px" height="80px" mood={mascotMood} />
                                    </div>

                                    <h2 className="fw-900 text-dark mb-5 ls-tight" style={{ fontSize: 'clamp(1.5rem, 5vw, 2.25rem)' }}>{q.question}</h2>

                                    <div className="w-100 text-start pb-5" style={{ marginBottom: showExplanation ? '180px' : '0', transition: 'margin-bottom 0.3s' }}>
                                        {renderQuestion()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Feedback Panel */}
                    {showExplanation && (
                        <div className="position-fixed bottom-0 start-0 end-0 animate__animated animate__slideInUp animate__faster" 
                             style={{ zIndex: 9999, borderTopLeftRadius: 36, borderTopRightRadius: 36, backgroundColor: answerStatus === 'correct' ? '#dcfce7' : '#fee2e2', boxShadow: '0 -10px 40px rgba(0,0,0,0.1)' }}>
                            <div className="container pt-4 pb-sm-4 pb-5 mb-2" style={{ maxWidth: '600px' }}>
                                {answerStatus === 'correct' ? (
                                    <div className="d-flex flex-column gap-4">
                                        <div className="d-flex align-items-center gap-3 px-2">
                                            <div className="bg-white rounded-circle d-flex align-items-center justify-content-center shadow-sm" style={{ width: 56, height: 56 }}>
                                                <CheckCircle2 size={36} color="#16a34a" />
                                            </div>
                                            <h2 className="fw-900 mb-0 ls-tight" style={{ color: '#16a34a', fontSize: '1.8rem' }}>Amazing!</h2>
                                        </div>
                                        <button className="btn w-100 py-3 fw-900 ls-1 text-white hover-scale border-0" 
                                            style={{ borderRadius: '20px', backgroundColor: '#22c55e', boxShadow: '0 6px 0 #16a34a', fontSize: '1.2rem', transition: 'all 0.2s' }} 
                                            onClick={() => nextQuestion(score, correctCount)}>
                                            CONTINUE
                                        </button>
                                    </div>
                                ) : (
                                    <div className="d-flex flex-column gap-4">
                                        <div className="d-flex align-items-center gap-3 px-2">
                                            <div className="bg-white rounded-circle d-flex align-items-center justify-content-center shadow-sm" style={{ width: 56, height: 56 }}>
                                                <X size={36} color="#dc2626" />
                                            </div>
                                            <div>
                                                <h2 className="fw-900 mb-0 ls-tight" style={{ color: '#dc2626', fontSize: '1.8rem' }}>Don't worry!</h2>
                                                <p className="smallest fw-bold ls-1 mb-0 text-uppercase mt-1" style={{ color: '#dc2626', opacity: 0.8 }}>We'll review this later</p>
                                            </div>
                                        </div>
                                        
                                        <div className="bg-white p-3 rounded-4 mx-2 border-0 shadow-sm">
                                            <p className="smallest fw-bold mb-1 ls-2 text-uppercase" style={{ color: '#ef4444' }}>Correct Answer</p>
                                            <p className="fs-5 fw-bold mb-0" style={{ color: '#dc2626' }}>
                                                {q.type === 'true-false' ? ((q as any).correctAnswer === true ? 'NGOHO (TRUE)' : 'MAZWIFHI (FALSE)') : (q as any).correctAnswer}
                                            </p>
                                        </div>

                                        <button className="btn w-100 py-3 fw-900 ls-1 text-white hover-scale border-0" 
                                            style={{ borderRadius: '20px', backgroundColor: '#ef4444', boxShadow: '0 6px 0 #dc2626', fontSize: '1.2rem', transition: 'all 0.2s' }} 
                                            onClick={() => {
                                                const newScore = isFirstTime ? awardConsolation() : score;
                                                nextQuestion(newScore);
                                            }}>
                                            GOT IT
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            );
        }

        return (
            <div className="min-vh-100 d-flex flex-column" style={{ background: '#FFFFFF' }}>
                <div className="flex-grow-1 d-flex align-items-center justify-content-center p-3 bg-light">
                    <div className="text-center w-100 bg-white rounded-5 p-4 p-md-5 shadow-sm border border-light" style={{ maxWidth: '500px' }}>
                        <div className="d-flex justify-content-center mb-4">
                            <Mascot mood={mascotMood} width="120px" height="120px" />
                        </div>
                        <h1 className="fw-900 display-5 text-dark mb-2 ls-tight">{isFirstTime ? 'Ro Fhedza!' : 'Review Done!'}</h1>
                        <p className="text-muted mb-4 ls-1 smallest fw-bold">{isFirstTime ? "YOU'VE MASTERED THIS LESSON" : "GREAT JOB REFRESHING YOUR KNOWLEDGE"}</p>
                        
                        {isFirstTime && (
                            <div className="py-4 border-top border-bottom mb-4">
                                <h1 className="display-2 fw-900 mb-3" style={{ color: '#FACC15', letterSpacing: '-2px' }}>+{score} XP</h1>
                                <div className="d-flex flex-column gap-2 text-start mx-auto" style={{ maxWidth: 280 }}>
                                    <div className="d-flex justify-content-between smallest text-muted align-items-center">
                                        <span className="d-flex align-items-center gap-2 px-2 py-1 bg-light rounded-pill"><Bookmark size={12} /> Base points</span>
                                        <span className="fw-900 text-dark">{scoreBreakdown.base}</span>
                                    </div>
                                    {scoreBreakdown.speed > 0 &&
                                        <div className="d-flex justify-content-between smallest text-muted align-items-center">
                                            <span className="d-flex align-items-center gap-2 px-2 py-1 bg-light rounded-pill"><Zap size={12} className="text-warning" /> Speed bonus</span>
                                            <span className="fw-900 text-dark">+{scoreBreakdown.speed}</span>
                                        </div>}
                                    {scoreBreakdown.streakBonus > 0 &&
                                        <div className="d-flex justify-content-between smallest text-muted align-items-center">
                                            <span className="d-flex align-items-center gap-2 px-2 py-1 bg-light rounded-pill"><Flame size={12} className="text-danger" /> Streak bonus</span>
                                            <span className="fw-900 text-dark">+{scoreBreakdown.streakBonus}</span>
                                        </div>}
                                    {scoreBreakdown.consolation > 0 &&
                                        <div className="d-flex justify-content-between smallest text-muted align-items-center">
                                            <span className="d-flex align-items-center gap-2 px-2 py-1 bg-light rounded-pill"><HelpCircle size={12} className="text-primary" /> Learning bonus</span>
                                            <span className="fw-900 text-dark">{scoreBreakdown.consolation}</span>
                                        </div>}
                                </div>
                            </div>
                        )}
                        
                        {!isFirstTime && (
                            <div className="py-5 border-top border-bottom mb-5">
                                <p className="smallest fw-bold text-muted mb-1 ls-2 text-uppercase">Progress Status</p>
                                <h1 className="display-2 fw-900 mb-0" style={{ color: '#FACC15', letterSpacing: '-2px' }}>COMPLETE</h1>
                            </div>
                        )}
                        
                        <button className="btn game-btn-primary w-100 py-3 fw-900 ls-1 shadow-sm" onClick={() => navigate(lesson?.courseId ? `/courses/${lesson.courseId}` : '/courses')} style={{ borderRadius: '18px', backgroundColor: '#FACC15', boxShadow: '0 6px 0 #EAB308' }}>
                            BACK TO COURSE
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="game-room">
            {renderContent()}
            {showExitModal && <ExitModal onClose={() => setShowExitModal(false)} onConfirm={() => navigate(lesson?.courseId ? `/courses/${lesson.courseId}` : '/courses')} />}
            <style>{`
                .ls-tight { letter-spacing: -2px; }
                .ls-1 { letter-spacing: 1px; }
                .ls-2 { letter-spacing: 2px; }
                .smallest { font-size: 11px; }
                .fw-900 { font-weight: 900; }
                .italic-text { font-style: italic; }
                .hover-scale { transition: transform 0.2s ease; }
                .hover-scale:hover { transform: scale(1.05); }
                .hover-scale:active { transform: scale(0.95); }
                .hr-fade { height: 1px; background: linear-gradient(to right, transparent, #E5E7EB, transparent); }
                .bg-warning-subtle { background-color: #FEF3C7; }
                .bg-blue-subtle { background-color: #DBEAFE; }
                .pulse-danger { animation: pulseDanger 1.5s infinite; }
                @keyframes pulseDanger { 0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); } 70% { box-shadow: 0 0 0 15px rgba(239, 68, 68, 0); } 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); } }
                .pulse-wave { animation: pulseWave 1s infinite ease-in-out; }
                @keyframes pulseWave { 0%, 100% { transform: scaleY(1); } 50% { transform: scaleY(2); } }
                .game-btn-primary { background-color: #FACC15 !important; color: #111827 !important; border: none !important; border-radius: 12px; transition: all 0.2s; }
                .game-btn-primary:active { transform: translateY(4px); box-shadow: 0 2px 0 #EAB308 !important; }
                .game-btn-primary:disabled { opacity: 0.5; }
                .study-card { max-width: 500px; margin: 0 auto; transition: all 0.3s ease; }
                @keyframes cheerPopIn { 0% { opacity: 0; transform: translateX(-50%) translateY(40px) scale(0.7); } 50% { opacity: 1; transform: translateX(-50%) translateY(-8px) scale(1.05); } 100% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); } }
                .mascot-cheer-overlay { position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%); z-index: 9999; display: flex; flex-direction: column; align-items: center; animation: cheerPopIn 0.4s ease-out forwards; pointer-events: none; filter: drop-shadow(0 6px 20px rgba(0,0,0,0.15)); }
                .mascot-cheer-bubble { background: #111827; color: #FACC15; font-size: 14px; font-weight: 800; font-family: var(--game-font-family); letter-spacing: 0.5px; padding: 8px 20px; border-radius: 20px; margin-bottom: 6px; white-space: nowrap; box-shadow: 0 4px 16px rgba(250, 204, 21, 0.25); position: relative; }
                .mascot-cheer-bubble::after { content: ''; position: absolute; bottom: -6px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 6px solid #111827; }
            `}</style>
        </div>
    );
};

export default GameRoom;
