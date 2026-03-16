import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import type { Question, MCQuestion, TFQuestion, FBQuestion, MPQuestion, LCQuestion } from '../../types/game';
import ScorePopup from '../../components/Game/ScorePopup';
import ExitModal from '../../components/Game/ExitModal';
import LevelUpModal from '../../components/Game/LevelUpModal';
import MultipleChoiceQuestion from '../../components/Game/MultipleChoiceQuestion';
import TrueFalseQuestion from '../../components/Game/TrueFalseQuestion';
import FillBlankQuestion from '../../components/Game/FillBlankQuestion';
import MatchPairsQuestion from '../../components/Game/MatchPairsQuestion';
import ListenChooseQuestion from '../../components/Game/ListenChooseQuestion';
import SceneView from '../../components/Game/SceneView';
import { useAudio } from '../../hooks/useAudio';
import { useGameLogic } from '../../hooks/useGameLogic';
import Mascot from '../../components/Mascot';
import {
    MessageSquare, Zap, Flame,
    FileText, CheckCircle2, Pencil, Link, Volume2, BookOpen,
    X, Mic, Square, ArrowLeft, ArrowRight, RefreshCw, Save
} from 'lucide-react';
import { db, auth } from '../../services/firebaseConfig';
import { doc, updateDoc, arrayUnion, increment } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { getLevelStats } from "../../services/levelUtils.ts";
import { updateStreak } from "../../services/streakUtils.ts";
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

    const [lesson, setLesson] = useState<any>(null);
    const [gameState, setGameState] = useState<'STUDY' | 'SCENE' | 'QUIZ' | 'RESULT'>(
        initialPersistentState?.gameState || (startType as any)
    );
    const [currentSlide, setCurrentSlide] = useState(
        initialPersistentState?.gameState === 'STUDY' ? initialPersistentState.currentSlide : (startType === 'STUDY' ? startIdx : 0)
    );
    const [currentSceneIndex, setCurrentSceneIndex] = useState(
        initialPersistentState?.gameState === 'SCENE' ? initialPersistentState.currentSceneIndex : 0
    );
    const [isFirstTime, setIsFirstTime] = useState(true);

    const { isRecording, audioUrl, isPlayingAudio, speakVenda, startRecording, stopRecording, setAudioUrl } = useAudio();
    const [studyStartTime, setStudyStartTime] = useState(initialPersistentState?.studyStartTime || Date.now());

    const [showExitModal, setShowExitModal] = useState(false);
    const [showLevelUp, setShowLevelUp] = useState(false);
    const [newLevelReached, setNewLevelReached] = useState(1);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [selectedTF, setSelectedTF] = useState<boolean | null>(null);

    const [showMascotCheer, setShowMascotCheer] = useState(false);
    const [mascotCheerText, setMascotCheerText] = useState(MASCOT_CHEERS[0]);
    const [showSavedHint, setShowSavedHint] = useState(false);

    const handleFinishQuiz = async (finalScore: number, _finalCorrect: number, totalDuration: number) => {
        setGameState('RESULT');
        if (auth.currentUser) {
            const userRef = doc(db, "users", auth.currentUser.uid);
            const currentData = await refreshUserData();
            if (currentData) {
                const mlId = microLessonId || lesson?.id || `${lessonId}__ml_0`;
                const courseId = lesson?.courseId || lessonId;
                const studyDuration = Math.floor((Date.now() - studyStartTime) / 1000) - totalDuration;

                if (isFirstTime) {
                    const stats = getLevelStats((currentData.points || 0) + finalScore);
                    const updateData: any = {
                        points: increment(finalScore),
                        level: stats.level,
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
                                    confirmButtonText: 'Kha ri ye!',
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
                                    confirmButtonText: 'Kha ri ye!',
                                    customClass: { popup: 'rounded-4' }
                                });
                            }
                        }, 1300);
                    }

                    if (stats.level > (currentData.level || 1)) {
                        setNewLevelReached(stats.level);
                        setShowLevelUp(true);
                    }

                    const newTrophies = checkAchievements(
                        {
                            ...currentData,
                            points: (currentData.points || 0) + finalScore,
                            level: stats.level,
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
                }
                localStorage.removeItem(storageKey);
            }
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
            setMascotCheerText(MASCOT_CHEERS[Math.floor(Math.random() * MASCOT_CHEERS.length)]);
            setShowMascotCheer(true);
            setTimeout(() => setShowMascotCheer(false), 1100);
        }
    });

    const saveStateToStorage = useCallback((showHint = false) => {
        if (gameState === 'RESULT') return;
        const stateToSave = {
            gameState, currentSlide, currentSceneIndex, studyStartTime,
            quizState: { currentQIndex, score, correctCount, streak, scoreBreakdown },
            timestamp: Date.now()
        };
        localStorage.setItem(storageKey, JSON.stringify(stateToSave));
        if (showHint) {
            setShowSavedHint(true);
            setTimeout(() => setShowSavedHint(false), 2000);
        }
    }, [gameState, currentSlide, currentSceneIndex, studyStartTime, currentQIndex, score, correctCount, streak, scoreBreakdown, storageKey]);

    useEffect(() => { saveStateToStorage(false); }, [saveStateToStorage, gameState, currentSlide, currentSceneIndex, studyStartTime, currentQIndex, score, correctCount, streak, scoreBreakdown]);

    useEffect(() => {
        if (gameState === 'QUIZ') {
            const saved = getSavedState();
            if (!saved || saved.gameState !== 'QUIZ') {
                resetGameLogic();
                if (startType === 'QUIZ' && startIdx > 0) setCurrentQIndex(startIdx);
            }
        }
        if (gameState === 'STUDY') {
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
                        setLesson({
                            ...foundMl,
                            difficulty: foundCourse.difficulty,
                            title: foundMl.title,
                            courseId: foundCourse.id,
                            courseTitle: foundCourse.title
                        });
                    }
                }
                const userData = await fetchUserData();
                if (userData) {
                    const completed = userData.completedLessons || [];
                    const mlId = microLessonId || `${lessonId}__ml_0`;
                    setIsFirstTime(!completed.includes(mlId));
                }
            }
        });
        return () => unsubscribe();
    }, [lessonId, microLessonId]);

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

    const renderContent = () => {
        if (gameState === 'STUDY') {
            const slide = lesson.slides[currentSlide];
            const progress = ((currentSlide + 1) / lesson.slides.length) * 100;
            const isLastSlide = currentSlide + 1 >= lesson.slides.length;

            return (
                <div className="min-vh-100 d-flex flex-column" style={{ background: 'linear-gradient(180deg, #111827 0%, #1F2937 40%, #F9FAFB 40%)' }}>
                    <div className="px-3 pt-4 pb-5" style={{ color: 'white' }}>
                        <div className="container" style={{ maxWidth: '700px' }}>
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <div className="d-flex align-items-center gap-3">
                                    <button className="btn btn-link text-decoration-none p-0 text-white fw-bold smallest ls-1 d-flex align-items-center gap-2"
                                        onClick={() => saveStateToStorage(true)}
                                        style={{ opacity: showSavedHint ? 1 : 0.7, color: showSavedHint ? '#10B981' : 'white', transition: 'all 0.3s' }}>
                                        {showSavedHint ? <CheckCircle2 size={14} /> : <Save size={14} />}
                                        {showSavedHint ? 'PROGRESS SAVED' : 'SAVE PROGRESS'}
                                    </button>
                                    <button className="btn btn-link text-decoration-none p-0 text-white fw-bold smallest ls-2 d-flex align-items-center gap-2" onClick={() => setShowExitModal(true)}>
                                        <X size={16} /> EXIT
                                    </button>
                                </div>
                                <div className="d-flex align-items-center gap-2">
                                    <span className="smallest fw-bold ls-1" style={{ color: '#FACC15' }}>
                                        {!isFirstTime ? '🔄 REVIEW' : `📖 ${lesson.title?.toUpperCase() || 'STUDY'}`}
                                    </span>
                                </div>
                            </div>
                            <div className="d-flex align-items-center gap-3">
                                <div className="flex-grow-1">
                                    <div className="progress" style={{ height: '5px', borderRadius: 10, backgroundColor: 'rgba(255,255,255,.15)' }}>
                                        <div className="progress-bar" style={{ width: `${progress}%`, backgroundColor: '#FACC15', transition: '0.5s ease', borderRadius: 10 }}></div>
                                    </div>
                                </div>
                                <span className="smallest fw-bold" style={{ color: 'rgba(255,255,255,.6)' }}>{currentSlide + 1}/{lesson.slides.length}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex-grow-1 px-3 d-flex align-items-center" style={{ marginTop: '-30px' }}>
                        <div className="container" style={{ maxWidth: '700px' }}>
                            <div key={currentSlide} className="animate__animated animate__fadeIn animate__faster">
                                <div className="study-card bg-white rounded-4 p-4 p-md-5 d-flex flex-column align-items-center text-center shadow-sm w-100" style={{ border: '1px solid #E5E7EB', position: 'relative' }}>
                                    <div className="d-flex justify-content-center gap-1 mb-4">
                                        {lesson.slides.map((_: any, i: number) => (
                                            <div key={i} style={{ width: i === currentSlide ? 20 : 6, height: 6, borderRadius: 10, backgroundColor: i === currentSlide ? '#FACC15' : (i < currentSlide ? '#10B981' : '#E2E8F0'), transition: 'all 0.3s' }}></div>
                                        ))}
                                    </div>
                                    <h1 className="fw-bold ls-tight mb-4" style={{ fontSize: 'clamp(2.5rem, 10vw, 4rem)', color: '#111827' }}>{slide.venda}</h1>
                                    <button className="btn rounded-circle d-inline-flex align-items-center justify-content-center mb-4" onClick={(e) => { e.stopPropagation(); speakVenda(slide.venda); }} style={{ width: 64, height: 64, backgroundColor: isPlayingAudio ? '#FEF3C7' : '#F9FBFF', border: isPlayingAudio ? '2px solid #FACC15' : '2px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', transition: 'all 0.2s' }}>
                                        <Volume2 className="fs-4" />
                                    </button>
                                    
                                    <div className="w-100 mt-2 mb-4" style={{ height: '1px', backgroundColor: '#E2E8F0' }}></div>
                                    
                                    <p className="smallest fw-bold text-muted ls-2 text-uppercase mb-3">DEFINITION</p>
                                    <h2 className="fw-bold mb-4" style={{ color: '#111827', fontSize: 'clamp(1.5rem, 6vw, 2rem)' }}>{slide.english}</h2>
                                    
                                    <div className="p-3 rounded-4 w-100 text-start" style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A' }}>
                                        <p className="smallest fw-bold mb-2 ls-2 text-uppercase" style={{ color: '#92400E' }}>Context</p>
                                        <p className="mb-0 small fst-italic" style={{ color: '#78350F', lineHeight: 1.5 }}>"{slide.context}"</p>
                                    </div>
                                </div>

                                <div className="bg-white rounded-4 p-4 mt-4 text-center mx-auto" style={{ border: '1px solid #E5E7EB', maxWidth: '500px' }}>
                                    <div className="d-flex align-items-center justify-content-center gap-2 mb-3">
                                        <Mic size={14} style={{ color: '#FACC15' }} />
                                        <span className="smallest fw-bold text-muted ls-2 text-uppercase">Pronunciation Lab</span>
                                    </div>
                                    {!isRecording ? (
                                        <button className="btn rounded-pill px-4 py-2 fw-bold smallest ls-1 d-flex align-items-center gap-2 mx-auto" onClick={(e) => { e.stopPropagation(); startRecording(); }} style={{ backgroundColor: '#111827', color: 'white' }}>
                                            <Mic size={14} /> TAP TO RECORD
                                        </button>
                                    ) : (
                                        <button className="btn btn-danger rounded-pill px-4 py-2 fw-bold smallest ls-1 animate__animated animate__pulse animate__infinite d-flex align-items-center gap-2 mx-auto" onClick={(e) => { e.stopPropagation(); stopRecording(); }}>
                                            <Square size={14} /> STOP RECORDING
                                        </button>
                                    )}
                                    {audioUrl && <div className="mt-3 d-flex justify-content-center"><audio src={audioUrl} controls style={{ height: 35, width: '100%', maxWidth: 300 }} /></div>}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="d-flex gap-3 pb-4 container mt-auto" style={{ maxWidth: '700px' }}>
                        <button className="btn btn-outline-dark border-2 w-50 py-3 fw-bold ls-1 rounded-3 d-flex align-items-center justify-content-center gap-2" disabled={currentSlide === 0} onClick={() => { setAudioUrl(null); const prev = currentSlide - 1; setCurrentSlide(prev); saveProgress(prev, 'STUDY'); }}>
                            <ArrowLeft size={18} /> MURAHU
                        </button>
                        {!isLastSlide ? (
                            <button className="btn game-btn-primary w-50 py-3 fw-bold ls-1 d-flex align-items-center justify-content-center gap-2" onClick={() => { setAudioUrl(null); const next = currentSlide + 1; setCurrentSlide(next); saveProgress(next, 'STUDY'); }}>
                                PHANDA <ArrowRight size={18} />
                            </button>
                        ) : (
                            <button className="btn w-50 py-3 fw-bold ls-1 text-white rounded-3 d-flex align-items-center justify-content-center gap-2" style={{ background: 'linear-gradient(135deg, #111827, #374151)', boxShadow: '0 4px 0 #000' }}
                                onClick={() => {
                                    if (lesson.scenes && lesson.scenes.length > 0) {
                                        setGameState('SCENE');
                                        setCurrentSceneIndex(0);
                                    } else {
                                        setGameState('QUIZ');
                                        saveProgress(0, 'QUIZ');
                                    }
                                }}>
                                <MessageSquare size={18} /> {lesson.scenes && lesson.scenes.length > 0 ? 'VIEW SCENE' : 'START QUIZ'}
                            </button>
                        )}
                    </div>
                </div>
            );
        }

        if (gameState === 'SCENE') {
            const scene = lesson.scenes[currentSceneIndex];
            return (
                <div className="min-vh-100 bg-white py-5 px-3">
                    <div className="container" style={{ maxWidth: '700px' }}>
                        <SceneView
                            scene={scene}
                            speakVenda={speakVenda}
                            onComplete={() => {
                                if (currentSceneIndex < (lesson.scenes?.length || 0) - 1) {
                                    setCurrentSceneIndex(currentSceneIndex + 1);
                                } else {
                                    setGameState('QUIZ');
                                    saveProgress(0, 'QUIZ');
                                }
                            }}
                        />
                    </div>
                </div>
            );
        }

        if (gameState === 'QUIZ') {
            const q = lesson.questions[currentQIndex] as Question;
            const progress = ((currentQIndex + 1) / lesson.questions.length) * 100;

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
                'multiple-choice': { label: 'MULTIPLE CHOICE', icon: <FileText size={12} /> },
                'true-false': { label: 'TRUE OR FALSE', icon: <CheckCircle2 size={12} /> },
                'fill-in-the-blank': { label: 'FILL IN THE BLANK', icon: <Pencil size={12} /> },
                'match-pairs': { label: 'MATCH PAIRS', icon: <Link size={12} /> },
                'listen-and-choose': { label: 'LISTEN & CHOOSE', icon: <Volume2 size={12} /> },
            };
            const currentLabel = typeLabel[q.type] || { label: 'QUESTION', icon: <FileText size={12} /> };

            return (
                <div className="min-vh-100 bg-white py-5 px-3">
                    <ScorePopup result={lastScoreResult} />
                    {showMascotCheer && (
                        <div className="mascot-cheer-overlay">
                            <div className="mascot-cheer-bubble">{mascotCheerText}</div>
                            <Mascot width="90px" height="90px" mood="excited" />
                        </div>
                    )}
                    <div className="container" style={{ maxWidth: '700px' }}>
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <span className="smallest fw-bold ls-1 text-muted">QUESTION {currentQIndex + 1}</span>
                            <div className="flex-grow-1 mx-4">
                                <div className="progress" style={{ height: '6px', borderRadius: '10px', backgroundColor: '#F3F4F6' }}>
                                    <div className="progress-bar" style={{ width: `${progress}%`, backgroundColor: '#FACC15' }}></div>
                                </div>
                            </div>
                            <span className="smallest fw-bold ls-1 text-warning">{isFirstTime ? `${score} LP` : 'REVIEWING'}</span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <span className="badge rounded-pill bg-light text-dark border smallest d-flex align-items-center gap-2">
                                {currentLabel.icon} {currentLabel.label}
                            </span>
                        </div>
                        <div className="py-4 text-center">
                            <h2 className="fw-bold text-dark mb-5 ls-tight">{q.question}</h2>
                            {!showExplanation ? renderQuestion() : (
                                <div className="text-start animate__animated animate__fadeIn">
                                    <div className="p-4 border-start border-4 border-danger bg-light mb-4">
                                        <h5 className="fw-bold text-danger mb-2">Pfarelo (Oops!)</h5>
                                        <p className="text-secondary mb-0">{q.explanation}</p>
                                    </div>
                                    <button className="btn game-btn-primary w-100 py-3 fw-bold ls-1" onClick={() => {
                                        const newScore = isFirstTime ? awardConsolation() : score;
                                        nextQuestion(newScore);
                                    }}>I UNDERSTAND, NEXT</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className="min-vh-100 bg-white d-flex align-items-center justify-content-center p-3">
                {showLevelUp && <LevelUpModal level={newLevelReached} onClose={() => setShowLevelUp(false)} />}
                <div className="text-center w-100" style={{ maxWidth: '500px' }}>
                    <div className="d-flex justify-content-center mb-4">
                        <Mascot mood="excited" width="150px" height="150px" />
                    </div>
                    <h1 className="fw-bold display-4 text-dark mb-2 ls-tight">{isFirstTime ? 'Ro Fhedza!' : 'Review Done!'}</h1>
                    <p className="text-muted mb-4 ls-1">{isFirstTime ? "You've mastered this lesson." : "Great job refreshing your knowledge."}</p>
                    {isFirstTime && (
                        <div className="py-4 border-top border-bottom mb-4">
                            <h1 className="display-2 fw-bold mb-3" style={{ color: '#FACC15' }}>+{score} LP</h1>
                            <div className="d-flex flex-column gap-2 text-start mx-auto" style={{ maxWidth: 280 }}>
                                <div className="d-flex justify-content-between smallest text-muted align-items-center">
                                    <span className="d-flex align-items-center gap-2"><FileText size={14} /> Base points</span>
                                    <span className="fw-bold text-dark">{scoreBreakdown.base}</span>
                                </div>
                                {scoreBreakdown.speed > 0 &&
                                    <div className="d-flex justify-content-between smallest text-muted align-items-center">
                                        <span className="d-flex align-items-center gap-2"><Zap size={14} /> Speed bonus</span>
                                        <span className="fw-bold text-dark">+{scoreBreakdown.speed}</span>
                                    </div>}
                                {scoreBreakdown.streakBonus > 0 &&
                                    <div className="d-flex justify-content-between smallest text-muted align-items-center">
                                        <span className="d-flex align-items-center gap-2"><Flame size={14} /> Streak bonus</span>
                                        <span className="fw-bold text-dark">+{scoreBreakdown.streakBonus}</span>
                                    </div>}
                                {scoreBreakdown.consolation > 0 &&
                                    <div className="d-flex justify-content-between smallest text-muted align-items-center">
                                        <span className="d-flex align-items-center gap-2"><BookOpen size={14} /> Learning bonus</span>
                                        <span className="fw-bold text-dark">+{scoreBreakdown.consolation}</span>
                                    </div>}
                            </div>
                        </div>
                    )}
                    {!isFirstTime && (
                        <div className="py-5 border-top border-bottom mb-5">
                            <p className="smallest fw-bold text-muted mb-1 ls-2 text-uppercase">Progress Status</p>
                            <h1 className="display-2 fw-bold mb-0" style={{ color: '#FACC15' }}>COMPLETE</h1>
                        </div>
                    )}
                    <button className="btn game-btn-primary w-100 py-3 fw-bold ls-1" onClick={() => navigate(lesson?.courseId ? `/courses/${lesson.courseId}` : '/courses')}>BACK TO COURSE</button>
                </div>
            </div>
        );
    };

    return (
        <div className="game-room">
            {renderContent()}
            {showExitModal && <ExitModal onClose={() => setShowExitModal(false)} onConfirm={() => navigate(lesson?.courseId ? `/courses/${lesson.courseId}` : '/courses')} />}
            <style>{`
                .ls-tight { letter-spacing: -1.5px; }
                .ls-1 { letter-spacing: 1px; }
                .ls-2 { letter-spacing: 2px; }
                .smallest { font-size: 11px; }
                .game-btn-primary { background-color: #FACC15 !important; color: #111827 !important; border: none !important; border-radius: 12px; box-shadow: 0 4px 0 #EAB308 !important; transition: all 0.2s; }
                .game-btn-primary:active { transform: translateY(2px); box-shadow: 0 2px 0 #EAB308 !important; }
                .game-btn-primary:disabled { opacity: 0.5; }
                .study-card { max-width: 500px; margin: 0 auto; transition: transform 0.2s; }
                @keyframes cheerPopIn { 0% { opacity: 0; transform: translateX(-50%) translateY(40px) scale(0.7); } 50% { opacity: 1; transform: translateX(-50%) translateY(-8px) scale(1.05); } 100% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); } }
                .mascot-cheer-overlay { position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%); z-index: 9999; display: flex; flex-direction: column; align-items: center; animation: cheerPopIn 0.4s ease-out forwards; pointer-events: none; filter: drop-shadow(0 6px 20px rgba(0,0,0,0.15)); }
                .mascot-cheer-bubble { background: #111827; color: #FACC15; font-size: 14px; font-weight: 800; font-family: 'Poppins', sans-serif; letter-spacing: 0.5px; padding: 8px 20px; border-radius: 20px; margin-bottom: 6px; white-space: nowrap; box-shadow: 0 4px 16px rgba(250, 204, 21, 0.25); position: relative; }
                .mascot-cheer-bubble::after { content: ''; position: absolute; bottom: -6px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 6px solid #111827; }
            `}</style>
        </div>
    );
};

export default GameRoom;
