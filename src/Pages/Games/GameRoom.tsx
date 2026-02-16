import React, { useEffect, useState } from 'react';
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
import { useAudio } from '../../hooks/useAudio';
import { useGameLogic } from '../../hooks/useGameLogic';
import Mascot from '../../components/Mascot';
import { db, auth } from '../../services/firebaseConfig';
import { doc, updateDoc, arrayUnion, increment } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { getLevelStats } from "../../services/levelUtils.ts";
import { updateStreak } from "../../services/streakUtils.ts";
import { type Difficulty } from "../../services/scoringUtils.ts";
import { fetchLessons, fetchUserData, refreshUserData, invalidateCache, getMicroLessons } from '../../services/dataCache';


// =============================================
//  MAIN GAME ROOM
// =============================================
const GameRoom: React.FC = () => {
    const { lessonId, microLessonId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    const queryParams = new URLSearchParams(location.search);
    const startIdx = parseInt(queryParams.get('start') || '0');
    const startType = queryParams.get('type') || 'STUDY';

    // Core state
    const [lesson, setLesson] = useState<any>(null);
    const [gameState, setGameState] = useState<'STUDY' | 'QUIZ' | 'RESULT'>(startType as any);
    const [currentSlide, setCurrentSlide] = useState(startType === 'STUDY' ? startIdx : 0);
    const [isFirstTime, setIsFirstTime] = useState(true);
    const [isFlipped, setIsFlipped] = useState(false);

    // Audio & Recording logic via custom hook
    const { isRecording, audioUrl, isPlayingAudio, speakVenda, startRecording, stopRecording, setAudioUrl } = useAudio();
    const [studyStartTime, setStudyStartTime] = useState(Date.now());

    const [showExitModal, setShowExitModal] = useState(false);
    const [showLevelUp, setShowLevelUp] = useState(false);
    const [newLevelReached, setNewLevelReached] = useState(1);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [selectedTF, setSelectedTF] = useState<boolean | null>(null);

    // Game Logic via custom hook
    const {
        currentQIndex, setCurrentQIndex,
        score,
        lastScoreResult,
        answerStatus, setAnswerStatus,
        showExplanation,
        scoreBreakdown,
        handleCorrect: onCorrectAnswer,
        handleWrong: onWrongAnswer,
        awardConsolation,
        moveNext: nextQuestion,
        reset: resetGameLogic
    } = useGameLogic({
        difficulty: (lesson?.difficulty as Difficulty) || 'Easy',
        totalQuestions: lesson?.questions?.length || 0,
        onFinish: (finalScore, finalCorrect, totalDuration) => handleFinishQuiz(finalScore, finalCorrect, totalDuration),
        onCorrect: () => {
            setSelectedOption(null);
            setSelectedTF(null);
        }
    });

    // Reset game logic when switching to QUIZ
    useEffect(() => {
        if (gameState === 'QUIZ') {
            resetGameLogic();
            if (startType === 'QUIZ' && startIdx > 0) {
                setCurrentQIndex(startIdx);
            }
        }
        if (gameState === 'STUDY') {
            setStudyStartTime(Date.now());
        }
    }, [gameState, resetGameLogic, startIdx, startType, setCurrentQIndex, setStudyStartTime]);

    // Load lesson + user data
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user && lessonId) {
                const lessons = await fetchLessons();
                const foundCourse = lessons.find((l: any) => l.id === lessonId);
                if (foundCourse) {
                    if (microLessonId) {
                        const mls = getMicroLessons(foundCourse);
                        const foundMl = mls.find((ml: any) => ml.id === microLessonId);
                        if (foundMl) {
                            setLesson({
                                ...foundMl,
                                difficulty: foundCourse.difficulty,
                                title: foundMl.title,
                                courseId: foundCourse.id,
                                courseTitle: foundCourse.title
                            });
                        }
                    } else {
                        const mls = getMicroLessons(foundCourse);
                        if (mls.length > 0) {
                            const ml = mls[0];
                            setLesson({
                                ...ml,
                                difficulty: foundCourse.difficulty,
                                title: ml.title,
                                courseId: foundCourse.id,
                                courseTitle: foundCourse.title
                            });
                        } else {
                            setLesson(foundCourse);
                        }
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
            const userRef = doc(db, "users", auth.currentUser.uid);
            await updateDoc(userRef, {
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
        if (answer.toLowerCase() === correctAnswer.toLowerCase()) {
            onCorrectAnswer();
        } else {
            onWrongAnswer();
        }
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
                    await updateStreak(auth.currentUser.uid);
                    invalidateCache(`user_${auth.currentUser.uid}`);
                    invalidateCache('topLearners');
                    if (stats.level > (currentData.level || 1)) {
                        setNewLevelReached(stats.level);
                        setShowLevelUp(true);
                    }
                }
            }
        }
    };

    // --- RENDER LOGIC ---
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
                                <button className="btn btn-link text-decoration-none p-0 text-white fw-bold smallest ls-2" onClick={() => setShowExitModal(true)}>
                                    <i className="bi bi-x-lg me-2"></i> EXIT
                                </button>
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
                                <div className={`flashcard-container ${isFlipped ? 'is-flipped' : ''}`} onClick={() => setIsFlipped(!isFlipped)}>
                                    <div className="flashcard-inner">
                                        <div className="flashcard-front">
                                            <div className="d-flex justify-content-center gap-1 mb-5" style={{ position: 'absolute', top: '25px' }}>
                                                {lesson.slides.map((_: any, i: number) => (
                                                    <div key={i} style={{ width: i === currentSlide ? 20 : 6, height: 6, borderRadius: 10, backgroundColor: i === currentSlide ? '#FACC15' : (i < currentSlide ? '#10B981' : '#E2E8F0'), transition: 'all 0.3s' }}></div>
                                                ))}
                                            </div>
                                            <h1 className="fw-bold ls-tight mb-4" style={{ fontSize: 'clamp(2.5rem, 10vw, 4rem)', color: '#111827' }}>{slide.venda}</h1>
                                            <button className="btn rounded-circle d-inline-flex align-items-center justify-content-center mb-5" onClick={(e) => { e.stopPropagation(); speakVenda(slide.venda); }} style={{ width: 64, height: 64, backgroundColor: isPlayingAudio ? '#FEF3C7' : '#F9FBFF', border: isPlayingAudio ? '2px solid #FACC15' : '2px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', transition: 'all 0.2s' }}>
                                                <i className={`bi ${isPlayingAudio ? 'bi-soundwave' : 'bi-volume-up-fill'} fs-4`} style={{ color: '#111827' }}></i>
                                            </button>
                                            <div className="flip-hint"><i className="bi bi-arrow-repeat"></i> TAP TO REVEAL ENGLISH</div>
                                        </div>
                                        <div className="flashcard-back">
                                            <p className="smallest fw-bold text-muted ls-2 text-uppercase mb-4">DEFINITION</p>
                                            <h2 className="fw-bold mb-4" style={{ color: '#111827', fontSize: '2rem' }}>{slide.english}</h2>
                                            <div className="mx-auto my-4" style={{ width: '40px', height: '2px', backgroundColor: '#E2E8F0' }}></div>
                                            <div className="p-3 rounded-4 w-100" style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A' }}>
                                                <p className="smallest fw-bold mb-2 ls-2 text-uppercase" style={{ color: '#92400E' }}>Context</p>
                                                <p className="mb-0 small fst-italic" style={{ color: '#78350F', lineHeight: 1.5 }}>"{slide.context}"</p>
                                            </div>
                                            <div className="flip-hint"><i className="bi bi-arrow-repeat"></i> TAP TO SEE VENDA</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white rounded-4 p-4 mt-4 text-center mx-auto" style={{ border: '1px solid #E5E7EB', maxWidth: '500px' }}>
                                    <div className="d-flex align-items-center justify-content-center gap-2 mb-3">
                                        <i className="bi bi-mic-fill" style={{ color: '#FACC15' }}></i>
                                        <span className="smallest fw-bold text-muted ls-2 text-uppercase">Pronunciation Lab</span>
                                    </div>
                                    {!isRecording ? (
                                        <button className="btn rounded-pill px-4 py-2 fw-bold smallest ls-1" onClick={(e) => { e.stopPropagation(); startRecording(); }} style={{ backgroundColor: '#111827', color: 'white' }}>
                                            <i className="bi bi-mic-fill me-2"></i> TAP TO RECORD
                                        </button>
                                    ) : (
                                        <button className="btn btn-danger rounded-pill px-4 py-2 fw-bold smallest ls-1 animate__animated animate__pulse animate__infinite" onClick={(e) => { e.stopPropagation(); stopRecording(); }}>
                                            <i className="bi bi-stop-fill me-2"></i> STOP RECORDING
                                        </button>
                                    )}
                                    {audioUrl && <div className="mt-3 d-flex justify-content-center"><audio src={audioUrl} controls style={{ height: 35, width: '100%', maxWidth: 300 }} /></div>}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="d-flex gap-3 pb-4 container mt-auto" style={{ maxWidth: '700px' }}>
                        <button className="btn btn-outline-dark border-2 w-50 py-3 fw-bold ls-1 rounded-3" disabled={currentSlide === 0} onClick={() => { setIsFlipped(false); setAudioUrl(null); const prev = currentSlide - 1; setCurrentSlide(prev); saveProgress(prev, 'STUDY'); }}>
                            <i className="bi bi-arrow-left me-2"></i> MURAHU
                        </button>
                        {!isLastSlide ? (
                            <button className="btn game-btn-primary w-50 py-3 fw-bold ls-1" onClick={() => { setIsFlipped(false); setAudioUrl(null); const next = currentSlide + 1; setCurrentSlide(next); saveProgress(next, 'STUDY'); }}>
                                PHANDA <i className="bi bi-arrow-right ms-2"></i>
                            </button>
                        ) : (
                            <button className="btn w-50 py-3 fw-bold ls-1 text-white rounded-3" style={{ background: 'linear-gradient(135deg, #111827, #374151)', boxShadow: '0 4px 0 #000' }} onClick={() => { setGameState('QUIZ'); saveProgress(0, 'QUIZ'); }}>🧠 START QUIZ</button>
                        )}
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

            const typeLabel: Record<string, string> = {
                'multiple-choice': '📝 MULTIPLE CHOICE',
                'true-false': '✅ TRUE OR FALSE',
                'fill-in-the-blank': '✏️ FILL IN THE BLANK',
                'match-pairs': '🔗 MATCH PAIRS',
                'listen-and-choose': '🔊 LISTEN & CHOOSE',
            };

            return (
                <div className="min-vh-100 bg-white py-5 px-3">
                    <ScorePopup result={lastScoreResult} />
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
                            <span className="badge rounded-pill bg-light text-dark border smallest">{typeLabel[q.type] || '📝 QUESTION'}</span>
                            {/* We don't have direct access to streak in GameRoom anymore, but we can if we want. For now, it's inside useGameLogic. */}
                        </div>
                        <div className="py-4 text-center">
                            <h2 className="fw-bold text-dark mb-5 ls-tight">{q.question}</h2>
                            {!showExplanation ? renderQuestion() : (
                                <div className="text-start animate__animated animate__fadeIn">
                                    <div className="p-4 border-start border-4 border-danger bg-light mb-4">
                                        <h5 className="fw-bold text-danger mb-2">Pfarelo (Oops!)</h5>
                                        <p className="text-secondary mb-0">{q.explanation}</p>
                                    </div>
                                    <button className="btn game-btn-primary w-100 py-3 fw-bold ls-1" onClick={() => { if (isFirstTime) awardConsolation(); nextQuestion(); }}>I UNDERSTAND, NEXT</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            );
        }

        // RESULT MODE
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
                                <div className="d-flex justify-content-between smallest text-muted"><span>📝 Base points</span><span className="fw-bold text-dark">{scoreBreakdown.base}</span></div>
                                {scoreBreakdown.speed > 0 && <div className="d-flex justify-content-between smallest text-muted"><span>⚡ Speed bonus</span><span className="fw-bold text-dark">+{scoreBreakdown.speed}</span></div>}
                                {scoreBreakdown.streakBonus > 0 && <div className="d-flex justify-content-between smallest text-muted"><span>🔥 Streak bonus</span><span className="fw-bold text-dark">+{scoreBreakdown.streakBonus}</span></div>}
                                {scoreBreakdown.consolation > 0 && <div className="d-flex justify-content-between smallest text-muted"><span>📖 Learning bonus</span><span className="fw-bold text-dark">+{scoreBreakdown.consolation}</span></div>}
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
                .game-btn-primary {
                    background-color: #FACC15 !important;
                    color: #111827 !important;
                    border: none !important;
                    border-radius: 12px;
                    box-shadow: 0 4px 0 #EAB308 !important;
                    transition: all 0.2s;
                }
                .game-btn-primary:active { transform: translateY(2px); box-shadow: 0 2px 0 #EAB308 !important; }
                .game-btn-primary:disabled { opacity: 0.5; }

                /* FLASHCARD STYLES */
                .flashcard-container {
                    perspective: 1000px;
                    width: 100%;
                    max-width: 500px;
                    margin: 0 auto;
                    height: 400px;
                    cursor: pointer;
                    position: relative;
                    z-index: 10;
                }

                .flashcard-inner {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    text-align: center;
                    transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
                    transform-style: preserve-3d;
                }

                .flashcard-container.is-flipped .flashcard-inner {
                    transform: rotateY(180deg);
                }

                .flashcard-front, .flashcard-back {
                    position: absolute;
                    inset: 0;
                    width: 100%;
                    height: 100%;
                    -webkit-backface-visibility: hidden;
                    backface-visibility: hidden;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    border-radius: 28px;
                    padding: 2.5rem;
                    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.12);
                    background-color: white !important;
                    border: 1px solid #E5E7EB;
                }

                .flashcard-back {
                    transform: rotateY(180deg);
                    background-color: #F8FAFC !important;
                }

                .flip-hint {
                    position: absolute;
                    bottom: 25px;
                    left: 0;
                    right: 0;
                    color: #94A3B8;
                    font-size: 0.75rem;
                    font-weight: 600;
                    letter-spacing: 1px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    text-transform: uppercase;
                }
            `}</style>
        </div>
    );
};

export default GameRoom;
