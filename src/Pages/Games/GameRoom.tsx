import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useMachine } from '@xstate/react';
import { gameRoomMachine } from '../../app/machines/gameRoomMachine';
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
import Mascot, { type MascotMood } from '../../features/gamification/components/Mascot';
import { useVisualJuice } from '../../hooks/useVisualJuice';
import { HelpCircle, X, Bookmark, CheckCircle2, Volume2, Play, Users } from 'lucide-react';
import { db, auth } from '../../services/firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { type Difficulty } from "../../services/scoringUtils.ts";
import { fetchLessons, fetchUserData, getMicroLessons } from '../../services/dataCache';
import { progressTracker } from '../../services/progressTracker';
import Swal from 'sweetalert2';

const MASCOT_CHEERS = [
    'Well done!',
    'That is right!',
    'You got it!',
    'Great job!',
    'Keep going!',
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

    const { isPlayingAudio, speakVenda: speakNative, setAudioUrl } = useAudio();
    const [studyStartTime, setStudyStartTime] = useState(initialPersistentState?.studyStartTime || Date.now());

    const [showExitModal, setShowExitModal] = useState(false);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [selectedTF, setSelectedTF] = useState<boolean | null>(null);

    const [showMascotCheer, setShowMascotCheer] = useState(false);
    const [mascotCheerText, setMascotCheerText] = useState(MASCOT_CHEERS[0]);
    const [mascotMood, setMascotMood] = useState<MascotMood>('happy');
    const [showSavedHint, setShowSavedHint] = useState(false);
    const [, setUserData] = useState<any>(null);
    const [sessionStartTime] = useState(Date.now());
    const [hasPlayedWinSound, setHasPlayedWinSound] = useState(false);
    const [finishedTime, setFinishedTime] = useState<number | null>(null);
    const [correctSessionWords, setCorrectSessionWords] = useState<string[]>([]);
    const [wrongSessionWords, setWrongSessionWords] = useState<string[]>([]);
    const { playCorrect, playWrong, triggerShake, playWin, playWinner } = useVisualJuice();

    const handleFinishQuiz = async (finalScore: number, _finalCorrect: number, totalDuration: number) => {
        send({ type: 'FINISH', score: finalScore });
        setMascotMood('excited');

        if (isFirstTime) {
            triggerConfetti();
        }

        if (auth.currentUser && lessonId) {
            const streakResult = await progressTracker.submitSession({
                lessonId: lessonId,
                microLessonId: microLessonId || `${lessonId}__ml_0`,
                courseId: lesson?.courseId || lessonId,
                isFirstTime,
                finalScore,
                totalSessionTime: finishedTime || Math.floor((Date.now() - sessionStartTime) / 1000),
                quizDuration: totalDuration || 0,
                correctWords: correctSessionWords,
                wrongWords: wrongSessionWords
            });

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
            localStorage.removeItem(storageKey);
        }
    };

    const triggerConfetti = () => {
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
            setTimeout(() => {
                if (document.body.contains(canvas)) document.body.removeChild(canvas);
            }, 5000);
        });
    };

    const {
        currentQIndex, setCurrentQIndex,
        score,
        lastScoreResult, setLastScoreResult,
        answerStatus, setAnswerStatus,
        showExplanation, setShowExplanation,
        scoreBreakdown,
        correctCount,
        streak,
        handleCorrect: onCorrectAnswer,
        handleWrong: onWrongAnswer,
        awardConsolation,
        reset: resetGameLogic
    } = useGameLogic({
        difficulty: (lesson?.difficulty as Difficulty) || 'Easy',
        totalQuestions: lesson?.questions?.length || 0,
        initialState: initialPersistentState?.quizState,
        onFinish: handleFinishQuiz,
        onCorrect: () => {
            const currentQ = lesson?.questions?.[currentQIndex];
            const word = currentQ?.nativeWord || currentQ?.word || currentQ?.tshivenda || currentQ?.venda;
            if (word) {
                setCorrectSessionWords(prev => [...prev, word]);
            }
            
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
            const currentQ = lesson?.questions?.[currentQIndex];
            if (currentQ && !currentQ._isRepeat) {
                const word = currentQ.nativeWord || currentQ.word || currentQ.tshivenda || currentQ.venda;
                if (word) {
                    setWrongSessionWords(prev => [...prev, word]);
                }
            }

            setMascotMood('sad');
            playWrong();
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

    useEffect(() => {
        if ((gameState === 'NO_QUIZ' || gameState === 'RESULT') && !hasPlayedWinSound) {
            const now = Date.now();
            setFinishedTime(Math.floor((now - sessionStartTime) / 1000));
            playWin();
            setTimeout(() => playWinner(), 1200);
            setHasPlayedWinSound(true);
            setMascotMood('excited');
            triggerConfetti();
        }
    }, [gameState, playWin, playWinner, hasPlayedWinSound, sessionStartTime]);

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
        // Prevent body scrolling to fix mobile pull-to-refresh and bouncing
        const originalOverflow = document.body.style.overflow;
        const originalOverscroll = document.body.style.overscrollBehavior;
        document.body.style.overflow = 'hidden';
        document.body.style.overscrollBehavior = 'none';

        return () => {
            document.body.style.overflow = originalOverflow;
            document.body.style.overscrollBehavior = originalOverscroll;
        };
    }, []);

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

    const handleQuizAdvance = (currentScore: number, currentCorrect: number) => {
        setAnswerStatus(null);
        setShowExplanation(false);
        setSelectedOption(null);
        setSelectedTF(null);
        setLastScoreResult(null);

        // Strict Rule: Lesson must appear first, then a quiz.
        // After a quiz finishes, immediately attempt to show the next lesson slide
        if (lesson.slides && currentSlide + 1 < lesson.slides.length) {
            send({ type: 'CONTINUE_STUDY' });
            const nextSlideIndex = currentSlide + 1;
            setCurrentSlide(nextSlideIndex);
            saveProgress(nextSlideIndex, 'STUDY');
        } 
        // If we ran out of slides but there are still questions
        else if (lesson.questions && currentQIndex + 1 < lesson.questions.length) {
            setCurrentQIndex((prev: number) => prev + 1);
        } else {
            handleFinishQuiz(currentScore, currentCorrect, Math.floor((Date.now() - sessionStartTime) / 1000));
        }
    };

    const handleMatchComplete = (allCorrect: boolean) => {
        if (allCorrect) {
            onCorrectAnswer();
        } else {
            setAnswerStatus('correct');
            awardConsolation();
            setTimeout(() => handleQuizAdvance(score, correctCount), 1200);
        }
    };

    const handleLCSelect = (opt: string, correctAnswer: string) => {
        if (selectedOption || answerStatus) return;
        setSelectedOption(opt);
        opt === correctAnswer ? onCorrectAnswer() : onWrongAnswer();
    };

    if (!lesson) {
        return (
            <div className="bg-theme-base d-flex align-items-center justify-content-center overflow-hidden" style={{ height: '100dvh' }}>
                <div className="spinner-border" style={{ color: 'var(--venda-yellow)' }}></div>
            </div>
        );
    }

    const renderProgressHeader = () => {
        let current = 0;
        let total = (lesson.slides?.length || 0) + (lesson.questions?.length || 0);

        if (gameState === 'STUDY') {
            // We've completed currentSlide previous slides and currentQIndex previous quizzes
            current = currentSlide + currentQIndex + 1;
        } else if (gameState === 'QUIZ') {
            // We've completed currentSlide+1 slides and currentQIndex previous quizzes
            current = currentSlide + currentQIndex + 1;
        }
        
        // Ensure current doesn't exceed total in edge cases
        current = Math.min(current, total);
        
        const progress = total > 0 ? (current / total) * 100 : 0;
        const modeLabel = gameState === 'STUDY' ? 'LEARN' : (gameState === 'QUIZ' ? 'PRACTICE' : 'COMPLETE');

        return (
            <div className="bg-theme-surface px-3 pt-2 pb-2 sticky-top" style={{ zIndex: 1000 }}>
                <div className="container" style={{ maxWidth: '650px' }}>
                    <div className="d-flex justify-content-start align-items-center mb-3">
                        <button className="btn p-0 btn-game-white brutalist-card--sm rounded-circle d-flex align-items-center justify-content-center" onClick={() => setShowExitModal(true)} style={{ width: 36, height: 36 }}>
                            <X size={20} className="text-theme-main" />
                        </button>
                    </div>
                    <div className="d-flex flex-column gap-2">
                        <div className="progress brutalist-card--sm p-0 overflow-hidden" style={{ height: '12px', borderRadius: 20, backgroundColor: 'var(--color-surface-soft)', border: '3px solid var(--color-border)' }}>
                            <div className="progress-bar" style={{ width: `${progress}%`, backgroundColor: 'var(--venda-yellow)', transition: '0.6s cubic-bezier(0.34, 1.56, 0.64, 1)' }}></div>
                        </div>
                        <div className="d-flex justify-content-between align-items-center">
                            <span className="smallest fw-black text-theme-main uppercase ls-1">{modeLabel}</span>
                            {gameState === 'STUDY' ? (
                                <button className="btn btn-link p-0 text-decoration-none smallest fw-black text-success uppercase ls-1" onClick={() => saveStateToStorage(true)}>
                                    {showSavedHint ? 'PROGRESS SAVED!' : 'SAVE SESSION'}
                                </button>
                            ) : (
                                <span className="smallest fw-black text-danger uppercase ls-1"></span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderCelebration = () => {
        const totalSessionTime = finishedTime || Math.floor((Date.now() - sessionStartTime) / 1000);
        const minutes = Math.floor(totalSessionTime / 60);
        const seconds = totalSessionTime % 60;
        const timeStr = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

        return (
            <div className="d-flex flex-column bg-theme-surface animate__animated animate__fadeIn overflow-hidden" style={{ height: '100dvh' }}>
                <div className="flex-grow-1 d-flex align-items-center justify-content-center p-3 p-md-4 overflow-auto">
                    <div className="text-center w-100 brutalist-card p-4 p-md-5 shadow-action-lg position-relative" style={{ maxWidth: '550px', background: 'var(--color-surface)' }}>
                        {/* Decorative Background Elements */}
                        <div className="position-absolute top-0 start-0 w-100 h-100 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(var(--venda-yellow) 2px, transparent 2px)', backgroundSize: '30px 30px' }}></div>

                        <div className="position-relative z-1">
                            <div className="mb-4 mt-2 animate__animated animate__bounceIn d-flex justify-content-center">
                                <Mascot mood="excited" width="160px" height="160px" />
                            </div>

                            <h1 className="fw-black display-3 text-theme-main mb-1 ls-tight uppercase animate__animated animate__jackInTheBox">
                                {gameState === 'NO_QUIZ' ? 'ALL DONE!' : 'QUEST COMPLETE!'}
                            </h1>
                            <p className="text-theme-muted mb-5 ls-2 smallest fw-black uppercase letter-spacing-2">
                                {gameState === 'NO_QUIZ' ? "YOU'VE REVIEWED ALL CONTENT" : "YOU'RE BECOMING A MASTER"}
                            </p>

                            <div className="bg-theme-surface border border-theme-main border-3 rounded-4 p-4 mb-5 shadow-action-sm animate__animated animate__fadeInUp animate__delay-1s">
                                <div className="row g-4 d-flex align-items-center">
                                    <div className="col-6 border-end border-theme-main border-2">
                                        <div className="d-flex flex-column align-items-center">
                                            <span className="smallest fw-black text-theme-muted uppercase ls-1 mb-1">POINTS</span>
                                            <h2 className="fw-black mb-0 display-6" style={{ color: 'var(--venda-yellow)', WebkitTextStroke: '1.5px var(--color-border)' }}>
                                                +{isFirstTime ? score : 0}
                                            </h2>
                                            <span className="smallest fw-black text-theme-main opacity-50">{isFirstTime ? 'XP EARNED' : 'REVIEW SESSION'}</span>
                                        </div>
                                    </div>
                                    <div className="col-6">
                                        <div className="d-flex flex-column align-items-center">
                                            <span className="smallest fw-black text-theme-muted uppercase ls-1 mb-1">TIME TAKEN</span>
                                            <h2 className="fw-black mb-0 display-6 text-theme-main">{timeStr}</h2>
                                            <span className="smallest fw-black text-theme-main opacity-50">FAST WORK!</span>
                                        </div>
                                    </div>
                                </div>

                            </div>

                            <div className="px-md-4">
                                <button
                                    className="btn btn-game btn-game-primary w-100 py-3 fw-black ls-1 uppercase shadow-action hover-scale"
                                    onClick={async () => {
                                        if (gameState === 'NO_QUIZ') {
                                            await handleFinishQuiz(50, 0, 0);
                                        }
                                        navigate('/courses');
                                    }}
                                    style={{ fontSize: '1.25rem' }}>
                                    {isFirstTime ? 'CLAIM REWARDS' : 'BACK TO MAP'}
                                </button>
                            </div>

                            <p className="mt-4 text-theme-muted smallest fw-black uppercase ls-1 opacity-50">
                                {gameState === 'NO_QUIZ'
                                    ? "GREAT JOB! THERE WAS NO QUIZ THIS TIME."
                                    : "KEEP GOING TO MAINTAIN YOUR STREAK!"}
                            </p>
                        </div>
                    </div>
                </div>

                <style>{`
                    .shadow-action-lg { box-shadow: 12px 12px 0px var(--color-border); }
                    .letter-spacing-2 { letter-spacing: 4px; }
                `}</style>
            </div>
        );
    };

    const renderContent = () => {
        if (gameState === 'STUDY') {
            const slide = lesson.slides[currentSlide];
            const isLastSlide = currentSlide + 1 >= lesson.slides.length;

            return (
                <div className="d-flex flex-column bg-theme-surface overflow-hidden" style={{ height: '100dvh' }}>
                    {renderProgressHeader()}

                    <div className="flex-grow-1 overflow-auto bg-theme-surface d-flex align-items-center">
                        <div className="container py-3" style={{ maxWidth: '600px' }}>
                            <div key={currentSlide} className="animate__animated animate__fadeIn animate__faster px-2 w-100">

                                {/* Main Lesson Card */}
                                <div className="brutalist-card p-3 p-md-4 w-100 position-relative shadow-action" style={{ overflow: 'hidden' }}>

                                    {/* Section 1: Phrase Display */}
                                    <div className="text-center mb-4">
                                        <h1 className="fw-black mb-1 text-theme-main ls-tight uppercase" style={{ fontSize: 'clamp(2rem, 8vw, 4rem)' }}>{slide.nativeWord || slide.native || slide.word || slide.venda || slide.tshivenda}</h1>
                                        <h4 className="text-theme-muted fw-black uppercase ls-1" style={{ fontSize: '1.25rem' }}>{slide.english}</h4>
                                    </div>

                                    {/* Section 2: Audio Interaction */}
                                    <div className="text-center mb-4">
                                        <div className="d-flex flex-column align-items-center gap-4">
                                            <div className="d-flex align-items-center gap-4">
                                                <button className="btn rounded-circle d-flex align-items-center justify-content-center shadow-action-light hover-scale"
                                                    onClick={() => speakNative(slide.nativeWord || slide.native || slide.word || slide.venda || slide.tshivenda)}
                                                    style={{ width: 80, height: 80, backgroundColor: isPlayingAudio ? 'var(--venda-yellow)' : '#111827', border: '5px solid var(--color-border)', transition: 'all 0.1s' }}>
                                                    <Play size={32} fill={isPlayingAudio ? '#000' : '#FFFFFF'} className={isPlayingAudio ? 'text-dark' : 'text-white'} />
                                                </button>
                                                <button className="btn bg-theme-surface brutalist-card--sm rounded-circle d-flex align-items-center justify-content-center hover-scale"
                                                    onClick={() => speakNative(slide.nativeWord || slide.native || slide.word || slide.venda || slide.tshivenda)}
                                                    style={{ width: 50, height: 50 }}>
                                                    <span className="fw-black text-theme-main uppercase ls-1" style={{ fontSize: '11px' }}>0.5x</span>
                                                </button>
                                            </div>
                                            <span className="smallest fw-black text-theme-muted ls-2 text-uppercase">Tap to hear pronunciation</span>
                                        </div>
                                    </div>



                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Navigation Controls */}
                    <div className="bg-theme-surface px-4 py-3 border-top border-theme-main border-3 pb-4">
                        <div className="container" style={{ maxWidth: '650px' }}>
                            <div className="d-flex gap-3">
                                <button className="btn btn-game btn-game-white px-3 fw-black ls-1 flex-grow-1"
                                    disabled={currentSlide === 0}
                                    onClick={() => { setAudioUrl(null); const prev = currentSlide - 1; setCurrentSlide(prev); saveProgress(prev, 'STUDY'); }}>
                                    BACK
                                </button>
                                {!isLastSlide ? (
                                    <button className="btn btn-game btn-game-primary px-3 fw-black ls-1 flex-grow-2"
                                        onClick={() => {
                                            setAudioUrl(null);
                                            // Interleaving logic: if there is a question for this slide, go to quiz.
                                            // Otherwise, go to next slide.
                                            if (lesson.questions && lesson.questions.length > currentSlide) {
                                                setCurrentQIndex(currentSlide);
                                                send({ type: 'START_QUIZ' });
                                                saveProgress(currentSlide, 'QUIZ');
                                            } else {
                                                const next = currentSlide + 1;
                                                setCurrentSlide(next);
                                                saveProgress(next, 'STUDY');
                                            }
                                        }}
                                        style={{ flex: 2 }}>
                                        NEXT SLIDE
                                    </button>
                                ) : (
                                    <button className="btn btn-game btn-game-dark px-3 fw-black ls-1 flex-grow-2 shadow-action-light"
                                        style={{ flex: 2 }}
                                        onClick={() => {
                                            if (lesson.questions && lesson.questions.length > currentSlide) {
                                                setCurrentQIndex(currentSlide);
                                                send({ type: 'START_QUIZ' });
                                                saveProgress(currentSlide, 'QUIZ');
                                            } else if (lesson.questions && lesson.questions.length > 0) {
                                              // Fallback to start quiz if we reached the end of slides but have questions left
                                                send({ type: 'START_QUIZ' });
                                                saveProgress(0, 'QUIZ');
                                            } else {
                                                send({ type: 'SKIP_QUIZ' });
                                                setMascotMood('excited');
                                            }
                                        }}>
                                        FINISH
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        if (gameState === 'NO_QUIZ') {
            return renderCelebration();
        }

        if (gameState === 'QUIZ') {
            const q = lesson.questions[currentQIndex] as Question;

            if (!q) {
                // Defensive check to prevent crash if data/index is invalid
                return (
                    <div className="d-flex flex-column bg-theme-base align-items-center justify-content-center p-4 text-center overflow-hidden" style={{ height: '100dvh' }}>
                        <Mascot mood="sad" width="120px" height="120px" />
                        <h2 className="fw-black text-theme-main mt-4">Oops! Something went wrong.</h2>
                        <p className="text-theme-muted mb-4">We couldn't find the next challenge.</p>
                        <button className="btn btn-game btn-game-primary px-5" onClick={() => navigate('/courses')}>
                            BACK TO COURSES
                        </button>
                    </div>
                );
            }

            const renderQuestion = () => {
                switch (q.type) {
                    case 'true-false': return <TrueFalseQuestion q={q as TFQuestion} selected={selectedTF} status={answerStatus} onSelect={(v) => handleTFSelect(v, (q as TFQuestion).correctAnswer)} />;
                    case 'fill-in-the-blank': return <FillBlankQuestion q={q as FBQuestion} status={answerStatus} onSubmit={(a) => handleFBSubmit(a, (q as FBQuestion).correctAnswer)} />;
                    case 'match-pairs': return <MatchPairsQuestion q={q as MPQuestion} onComplete={handleMatchComplete} />;
                    case 'listen-and-choose': return <ListenChooseQuestion q={q as LCQuestion} selected={selectedOption} status={answerStatus} onSelect={(o) => handleLCSelect(o, (q as LCQuestion).correctAnswer)} speakNative={speakNative} />;
                    default: return <MultipleChoiceQuestion q={q as MCQuestion} selected={selectedOption} status={answerStatus} onSelect={(o) => handleMCSelect(o, (q as MCQuestion).correctAnswer)} />;
                }
            };

            const typeLabel: Record<string, { label: string, icon: any }> = {
                'multiple-choice': { label: 'CHOOSE CORRECT', icon: <Bookmark size={14} /> },
                'true-false': { label: 'TRUE OR FALSE', icon: <CheckCircle2 size={14} /> },
                'fill-in-the-blank': { label: 'COMPLETE SENTENCE', icon: <HelpCircle size={14} /> },
                'match-pairs': { label: 'MATCH PHRASES', icon: <Users size={14} /> },
                'listen-and-choose': { label: 'LISTEN & SELECT', icon: <Volume2 size={14} /> },
            };
            const currentLabel = typeLabel[q.type] || { label: 'CHALLENGE', icon: <HelpCircle size={14} /> };

            return (
                <div className="d-flex flex-column bg-theme-surface overflow-hidden" style={{ height: '100dvh' }}>
                    {renderProgressHeader()}
                    <ScorePopup result={lastScoreResult} />
                    {showMascotCheer && (
                        <div className="mascot-cheer-overlay">
                            <div className="mascot-cheer-bubble">{mascotCheerText}</div>
                            <Mascot width="90px" height="90px" mood={mascotMood} />
                        </div>
                    )}
                    <div className="flex-grow-1 overflow-auto bg-theme-surface d-flex align-items-center">
                        <div className="container py-3" style={{ maxWidth: '650px' }}>
                            <div className="animate__animated animate__fadeIn px-2 w-100">
                                <div className="brutalist-card p-3 p-md-4 w-100 text-center shadow-action">
                                    <div className="d-flex justify-content-center mb-2">
                                        <span className="badge brutalist-card--sm bg-theme-surface text-theme-main border-theme-main border-2 px-2 py-1 smallest fw-black uppercase ls-1 d-flex align-items-center gap-1" style={{ fontSize: '0.6rem' }}>
                                            {currentLabel.icon} {currentLabel.label}
                                        </span>
                                    </div>

                                    <h2 className="fw-black text-theme-main mb-3 ls-tight uppercase" style={{ fontSize: 'clamp(1.1rem, 4vw, 1.6rem)' }}>{q.question}</h2>

                                    <div className="w-100 text-start pb-5" style={{ marginBottom: showExplanation ? '200px' : '0', transition: 'margin-bottom 0.3s' }}>
                                        {renderQuestion()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Feedback Panel */}
                    {showExplanation && (
                        <div className="position-fixed bottom-0 start-0 end-0 animate__animated animate__slideInUp animate__faster"
                            style={{ zIndex: 9999, borderTop: '6px solid var(--color-border)', backgroundColor: answerStatus === 'correct' ? (document.documentElement.getAttribute('data-theme') === 'dark' ? '#064e3b' : '#dcfce7') : (document.documentElement.getAttribute('data-theme') === 'dark' ? '#1f2937' : '#f8fafc'), boxShadow: '0 -20px 60px rgba(0,0,0,0.2)' }}>
                            <div className="container py-2 py-md-3" style={{ maxWidth: '650px' }}>
                                {answerStatus === 'correct' ? (
                                    <div className="d-flex flex-column gap-2">
                                        <div className="d-flex align-items-center gap-3 px-1">
                                            <Mascot width="50px" height="50px" mood="excited" />
                                            <div className="flex-grow-1 p-2 rounded-3" style={{ backgroundColor: 'rgba(255,255,255,0.3)', border: '2px solid rgba(22,163,106,0.3)' }}>
                                                <h2 className="fw-black mb-0 ls-tight uppercase" style={{ color: '#16a34a', fontSize: '1rem' }}>You got it! 🎉</h2>
                                                <p className="smallest fw-bold mb-0 text-uppercase ls-1" style={{ color: '#16a34a', opacity: 0.8, fontSize: '0.55rem' }}>Keep this energy going!</p>
                                            </div>
                                        </div>
                                        <button className="btn btn-game w-100 py-2 text-white border-0 mt-1"
                                            style={{ backgroundColor: '#22c55e', boxShadow: '0 4px 0 #16a34a', fontSize: '1rem' }}
                                            onClick={() => {
                                                handleQuizAdvance(score, correctCount);
                                            }}>
                                            CONTINUE QUEST
                                        </button>
                                    </div>
                                ) : (
                                    <div className="d-flex flex-column gap-2">
                                        <div className="d-flex align-items-center gap-3 px-1">
                                            <Mascot width="50px" height="50px" mood="sad" />
                                            <div className="flex-grow-1 p-2 rounded-3" style={{ backgroundColor: 'rgba(255,255,255,0.2)', border: '2px solid rgba(245,158,11,0.3)' }}>
                                                <h2 className="fw-black mb-0 ls-tight uppercase" style={{ color: 'var(--color-text)', fontSize: '1rem' }}>Almost there!</h2>
                                                <p className="smallest fw-bold mb-0 text-uppercase ls-1" style={{ color: 'var(--color-text)', opacity: 0.7, fontSize: '0.55rem' }}>Don't worry, mistakes help you learn!</p>
                                            </div>
                                        </div>

                                        <div className="bg-theme-surface p-2 mt-1 brutalist-card--sm border-theme-main border-2 border-dashed shadow-none">
                                            <p className="smallest fw-black mb-1 ls-2 text-uppercase text-theme-muted" style={{ fontSize: '0.6rem' }}>Correct Answer</p>
                                            <p className="fs-6 fw-black mb-0 text-theme-main uppercase ls-1">
                                                {q.type === 'true-false' ? ((q as any).correctAnswer === true ? 'TRUE' : 'FALSE') : (q as any).correctAnswer}
                                            </p>
                                        </div>

                                        <div className="d-flex flex-column gap-2 mt-1">
                                            <button className="btn btn-game w-100 py-2 text-white border-0"
                                                style={{ backgroundColor: '#ef4444', boxShadow: '0 4px 0 #dc2626', fontSize: '1rem' }}
                                                onClick={() => {
                                                    setAnswerStatus(null);
                                                    setShowExplanation(false);
                                                    setSelectedOption(null);
                                                    setSelectedTF(null);
                                                }}>
                                                RETRY QUESTION
                                            </button>
                                            <div className="d-flex gap-2">
                                                <button className="btn btn-game flex-grow-1 py-2 text-white border-0"
                                                    style={{ backgroundColor: 'var(--color-surface-darker)', boxShadow: '0 4px 0 var(--color-border)', fontSize: '0.85rem' }}
                                                    onClick={() => {
                                                        send({ type: 'CONTINUE_STUDY' });
                                                        saveProgress(currentSlide, 'STUDY');
                                                    }}>
                                                    REVIEW SLIDE
                                                </button>
                                                <button className="btn btn-game flex-grow-1 py-2 text-white border-0"
                                                    style={{ backgroundColor: '#64748b', boxShadow: '0 4px 0 #475569', fontSize: '0.85rem' }}
                                                    onClick={() => {
                                                        const newScore = isFirstTime ? awardConsolation() : score;
                                                        handleQuizAdvance(newScore, correctCount);
                                                    }}>
                                                    SKIP FOR NOW
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            );
        }

        return renderCelebration();
    };

    return (
        <div className="game-room">
            {renderContent()}
            {showExitModal && <ExitModal onClose={() => setShowExitModal(false)} onConfirm={() => navigate('/courses')} />}
            <style>{`
                .ls-tight { letter-spacing: -2px; }
                .ls-1 { letter-spacing: 1px; }
                .ls-2 { letter-spacing: 2px; }
                .smallest { font-size: 11px; }
                .fw-black { font-weight: 900; }
                .italic-text { font-style: italic; }
                .hover-scale { transition: transform 0.1s ease; }
                .hover-scale:hover { transform: scale(1.05); }
                .hover-scale:active { transform: scale(0.95); }
                .hr-fade { height: 1px; background: linear-gradient(to right, transparent, var(--color-border-soft), transparent); }
                .bg-warning-subtle { background-color: #FEF3C7; }
                .bg-blue-subtle { background-color: #DBEAFE; }
                .pulse-danger { animation: pulseDanger 1.5s infinite; }
                @keyframes pulseDanger { 0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); } 70% { box-shadow: 0 0 0 15px rgba(239, 68, 68, 0); } 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); } }
                .pulse-wave { animation: pulseWave 1s infinite ease-in-out; }
                @keyframes pulseWave { 0%, 100% { transform: scaleY(1); } 50% { transform: scaleY(2); } }
                .study-card { max-width: 500px; margin: 0 auto; transition: all 0.3s ease; }
                @keyframes cheerPopIn { 0% { opacity: 0; transform: translateX(-50%) translateY(40px) scale(0.7); } 50% { opacity: 1; transform: translateX(-50%) translateY(-8px) scale(1.05); } 100% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); } }
                .mascot-cheer-overlay { position: fixed; bottom: 120px; left: 50%; transform: translateX(-50%); z-index: 9999; display: flex; flex-direction: column; align-items: center; animation: cheerPopIn 0.4s ease-out forwards; pointer-events: none; filter: drop-shadow(0 6px 20px rgba(0,0,0,0.15)); }
                .mascot-cheer-bubble { background: #FACC15; color: #000; font-size: 14px; font-weight: 900; letter-spacing: 0.5px; padding: 10px 24px; border: 3px solid #000; border-radius: 20px; margin-bottom: 6px; white-space: nowrap; box-shadow: 6px 6px 0px #000; position: relative; }
                .mascot-cheer-bubble::after { content: ''; position: absolute; bottom: -12px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 10px solid transparent; border-right: 10px solid transparent; border-top: 10px solid #000; }
            `}</style>
        </div>
    );
};

export default GameRoom;









