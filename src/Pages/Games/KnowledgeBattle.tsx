import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Question, MCQuestion, TFQuestion, FBQuestion, MPQuestion, LCQuestion } from '../../types/game';
import ScorePopup from '../../components/Game/ScorePopup';
import MultipleChoiceQuestion from '../../components/Game/MultipleChoiceQuestion';
import TrueFalseQuestion from '../../components/Game/TrueFalseQuestion';
import FillBlankQuestion from '../../components/Game/FillBlankQuestion';
import MatchPairsQuestion from '../../components/Game/MatchPairsQuestion';
import ListenChooseQuestion from '../../components/Game/ListenChooseQuestion';
import { useGameLogic } from '../../hooks/useGameLogic';
import { auth } from '../../services/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { fetchLessons, fetchUserData } from '../../services/dataCache';
import {
    createBattle, fetchOpenBattles, fetchMyBattles, joinBattle,
    subscribeToBattle, updateBattleProgress, finalizeBattle,
    type Battle
} from '../../services/battleService';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebaseConfig';
import { CONSOLATION_POINTS, type Difficulty } from '../../services/scoringUtils';


// =============================================
//  MAIN COMPONENT
// =============================================
type BattleView = 'lobby' | 'waiting' | 'playing' | 'results';

const KnowledgeBattle: React.FC = () => {
    const navigate = useNavigate();

    // Auth & data
    const [user, setUser] = useState<any>(null);
    const [lessons, setLessons] = useState<any[]>([]);
    const [completedIds, setCompletedIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    // Battle state
    const [view, setView] = useState<BattleView>('lobby');
    const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
    const [openBattles, setOpenBattles] = useState<Battle[]>([]);
    const [myBattles, setMyBattles] = useState<Battle[]>([]);
    const [currentBattle, setCurrentBattle] = useState<Battle | null>(null);
    const [battleId, setBattleId] = useState<string | null>(null);
    const [myRole, setMyRole] = useState<'challenger' | 'opponent'>('challenger');
    const [loadingAction, setLoadingAction] = useState(false);
    const [lobbyTab, setLobbyTab] = useState<'find' | 'history'>('find');

    // Quiz finished state (separate from hook to handle waiting for opponent)
    const [quizFinished, setQuizFinished] = useState(false);

    // Refs for cleanup
    const unsubRef = useRef<(() => void) | null>(null);
    const gameStartedRef = useRef(false);

    const getLesson = useCallback(() => lessons.find(l => l.id === selectedLessonId), [lessons, selectedLessonId]);

    // Game Logic via custom hook
    const {
        currentQIndex, setCurrentQIndex,
        score, setScore,
        correctCount, setCorrectCount,
        streak,
        lastScoreResult,
        answerStatus, setAnswerStatus,
        showExplanation,
        handleCorrect: onCorrectAnswer,
        handleWrong: onWrongAnswer,
        awardConsolation,
        moveNext: nextQuestion,
        reset: resetGameLogic
    } = useGameLogic({
        difficulty: (getLesson()?.difficulty as Difficulty) || 'Easy',
        totalQuestions: currentBattle?.questionOrder?.length || getLesson()?.questions?.length || 0,
        onFinish: (finalScore, finalCorrect, totalDuration) => handleQuizFinish(finalScore, finalCorrect, totalDuration),
        onCorrect: (_result, newScore, newCorrect, nextIdx) => {
            if (battleId) {
                updateBattleProgress(battleId, myRole, newScore, newCorrect, nextIdx, false);
            }
        },
        onConsolation: (newScore) => {
            if (battleId) {
                updateBattleProgress(battleId, myRole, newScore, correctCount, currentQIndex, false);
            }
        }
    });

    // ---- INIT ----
    useEffect(() => {
        const unsubAuth = onAuthStateChanged(auth, async (u) => {
            setUser(u);
            if (u) {
                try {
                    const [lessonsData, userData] = await Promise.all([fetchLessons(), fetchUserData()]);
                    setLessons(lessonsData);
                    if (userData) {
                        setCompletedIds(userData.completedLessons || []);
                    }
                    // Fetch battle history
                    const battles = await fetchMyBattles();
                    setMyBattles(battles);
                } catch (error) {
                    console.error("Error initializing battle page:", error);
                }
            }
            setLoading(false);
        });
        return () => {
            unsubAuth();
            if (unsubRef.current) unsubRef.current();
        };
    }, []);

    // TTS
    const speakVenda = useCallback((text: string) => {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.rate = 0.8;
        window.speechSynthesis.speak(u);
    }, []);

    // ---- LESSON SELECTION ----
    const handleSelectLesson = async (lessonId: string) => {
        setSelectedLessonId(lessonId);
        setLoadingAction(true);
        try {
            const battles = await fetchOpenBattles(completedIds.filter(id => id === lessonId));
            setOpenBattles(battles);
        } catch (e) { console.error(e); }
        setLoadingAction(false);
    };

    // ---- CREATE BATTLE ----
    const handleCreateBattle = async () => {
        if (!selectedLessonId) return;
        const lesson = lessons.find(l => l.id === selectedLessonId);
        if (!lesson) return;

        setLoadingAction(true);
        try {
            const id = await createBattle(selectedLessonId, lesson.title, lesson.questions?.length || 0);
            setBattleId(id);
            setMyRole('challenger');
            setView('waiting');

            // Subscribe to real-time updates
            const unsub = subscribeToBattle(id, (battle) => {
                setCurrentBattle(prev => {
                    // Check transition to 'playing'
                    if (prev?.status === 'waiting' && battle.status === 'playing' && !gameStartedRef.current) {
                        gameStartedRef.current = true;
                        setView('playing');
                        resetQuizState();
                    }
                    // Check transition to 'completed'
                    if (battle.challengerFinished && battle.opponentFinished && battle.status === 'completed') {
                        setView('results');
                    }
                    return battle;
                });
            });
            unsubRef.current = unsub;
        } catch (e) { console.error(e); }
        setLoadingAction(false);
    };

    // ---- JOIN BATTLE ----
    const handleJoinBattle = async (battle: Battle) => {
        setLoadingAction(true);
        try {
            await joinBattle(battle.id);
            setBattleId(battle.id);
            setMyRole('opponent');
            setSelectedLessonId(battle.lessonId);

            // Subscribe to real-time updates
            const unsub = subscribeToBattle(battle.id, (b) => {
                setCurrentBattle(() => {
                    if (b.challengerFinished && b.opponentFinished && b.status === 'completed') {
                        setView('results');
                    }
                    return b;
                });
            });
            unsubRef.current = unsub;

            resetQuizState();
            gameStartedRef.current = true;
            setView('playing');
        } catch (e) { console.error(e); }
        setLoadingAction(false);
    };

    // ---- RESUME BATTLE ----
    const handleResumeBattle = async (battle: Battle) => {
        setLoadingAction(true);
        try {
            setBattleId(battle.id);
            const role = battle.challengerId === user?.uid ? 'challenger' : 'opponent';
            setMyRole(role);
            setSelectedLessonId(battle.lessonId);

            // Restore progress
            const myProgress = role === 'challenger' ? battle.challengerProgress : battle.opponentProgress;
            const myScore = role === 'challenger' ? battle.challengerScore : battle.opponentScore;
            const myCorrect = role === 'challenger' ? battle.challengerCorrect : battle.opponentCorrect;

            setScore(myScore);
            setCorrectCount(myCorrect);
            setCurrentQIndex(myProgress);

            const totalQ = battle.questionOrder?.length || 0;
            if (myProgress >= totalQ && totalQ > 0) {
                setQuizFinished(true);
            }

            // Subscribe to real-time updates
            const unsub = subscribeToBattle(battle.id, (b) => {
                setCurrentBattle(() => {
                    if (b.challengerFinished && b.opponentFinished && b.status === 'completed') {
                        setView('results');
                    }
                    return b;
                });
            });
            unsubRef.current = unsub;

            gameStartedRef.current = true;
            setView('playing');
        } catch (e) { console.error(e); }
        setLoadingAction(false);
    };

    const handleResumeWaiting = (battle: Battle) => {
        setBattleId(battle.id);
        setMyRole('challenger');
        setSelectedLessonId(battle.lessonId);
        setView('waiting');

        const unsub = subscribeToBattle(battle.id, (b) => {
            setCurrentBattle(prev => {
                if (prev?.status === 'waiting' && b.status === 'playing' && !gameStartedRef.current) {
                    gameStartedRef.current = true;
                    setView('playing');
                    resetQuizState();
                }
                if (b.challengerFinished && b.opponentFinished && b.status === 'completed') {
                    setView('results');
                }
                return b;
            });
        });
        unsubRef.current = unsub;
    };

    // ---- QUIZ LOGIC ----
    const resetQuizState = () => {
        resetGameLogic();
        setQuizFinished(false);
    };

    const handleMCSelect = (opt: string, correctAnswer: string) => {
        if (answerStatus) return;
        opt === correctAnswer ? onCorrectAnswer() : onWrongAnswer();
    };

    const handleTFSelect = (val: boolean, correctAnswer: boolean) => {
        if (answerStatus) return;
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
            const newScore = score + CONSOLATION_POINTS;
            setScore(newScore);
            if (battleId) {
                updateBattleProgress(battleId, myRole, newScore, correctCount, currentQIndex + 1, false);
            }
            setTimeout(() => nextQuestion(), 1200);
        }
    };

    const handleLCSelect = (opt: string, correctAnswer: string) => {
        if (answerStatus) return;
        opt === correctAnswer ? onCorrectAnswer() : onWrongAnswer();
    };

    const handleQuizFinish = async (finalScore: number, finalCorrect: number, totalDuration: number) => {
        setQuizFinished(true);
        if (battleId) {
            const totalQ = currentBattle?.questionOrder?.length || 0;
            // Update battle progress with duration if battleService supports it (or just metadata)
            await updateDoc(doc(db, 'battles', battleId), {
                [`${myRole}Duration`]: totalDuration,
                [`${myRole}FinishedAt`]: new Date().toISOString()
            });
            await updateBattleProgress(battleId, myRole, finalScore, finalCorrect, totalQ, true);
            // Try to finalize (will only succeed if both done)
            await finalizeBattle(battleId);
        }
    };

    const handleExplanationNext = () => {
        awardConsolation();
        nextQuestion();
    };

    // ---- BACK TO LOBBY ----
    const backToLobby = () => {
        if (unsubRef.current) { unsubRef.current(); unsubRef.current = null; }
        setView('lobby');
        setCurrentBattle(null);
        setBattleId(null);
        setSelectedLessonId(null);
        setOpenBattles([]);
        gameStartedRef.current = false;
        resetQuizState();
        // Refresh history
        fetchMyBattles().then(setMyBattles).catch(console.error);
    };

    // ---- RENDER HELPERS ----
    const battleStyles = `
        .ls-tight { letter-spacing: -1.5px; }
        .ls-1 { letter-spacing: 1px; }
        .ls-2 { letter-spacing: 2px; }
        .smallest { font-size: 11px; }
        .battle-header-icon {
            width: 48px;
            height: 48px;
            background: #FACC15;
            color: #111827;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
        }
        .battle-btn-primary {
            background-color: #FACC15 !important;
            color: #111827 !important;
            border: none !important;
            border-radius: 12px;
            box-shadow: 0 4px 0 #EAB308 !important;
            transition: all 0.2s;
        }
        .battle-btn-primary:active { transform: translateY(2px); box-shadow: 0 2px 0 #EAB308 !important; }
        .battle-btn-primary:disabled { opacity: 0.5; }
        .neon-dot {
            width: 8px;
            height: 8px;
            background-color: #10B981;
            border-radius: 50%;
            display: inline-block;
            box-shadow: 0 0 8px #10B981;
            animation: pulse-dot 1.5s infinite;
        }
        @keyframes pulse-dot { 
            0% { opacity: 0.5; transform: scale(0.8); }
            50% { opacity: 1; transform: scale(1.2); }
            100% { opacity: 0.5; transform: scale(0.8); }
        }
        @keyframes pulse {
            0% { opacity: 0.3; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.1); }
            100% { opacity: 0.3; transform: scale(1); }
        }
        .battle-waiting-ring {
            width: 120px;
            height: 120px;
            border-radius: 50%;
            border: 4px solid #F3F4F6;
            border-top-color: #FACC15;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: spin 2s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
    `;

    // ---- LOADING ----
    if (loading) return (
        <div className="min-vh-100 bg-white d-flex justify-content-center align-items-center">
            <div className="text-center">
                <div className="spinner-border mb-3" style={{ color: '#FACC15', width: 48, height: 48 }}></div>
                <p className="smallest fw-bold text-muted ls-2 text-uppercase">LOADING...</p>
            </div>
        </div>
    );

    if (!user) return (
        <div className="min-vh-100 bg-white d-flex align-items-center justify-content-center p-3">
            <div className="text-center" style={{ maxWidth: 400 }}>
                <div className="mb-4">
                    <i className="bi bi-shield-lock-fill display-1 text-dark opacity-10"></i>
                </div>
                <h2 className="fw-bold mb-3">Sign In Required</h2>
                <p className="text-muted mb-4">You need to be logged in to battle other learners.</p>
                <button className="btn btn-dark rounded-pill px-5 py-2 fw-bold" onClick={() => navigate('/login')}>
                    SIGN IN
                </button>
            </div>
        </div>
    );

    // =============================================
    //  LOBBY VIEW
    // =============================================
    if (view === 'lobby') {
        const completedLessons = lessons.filter(l => completedIds.includes(l.id));

        return (
            <div className="min-vh-100 py-5 px-3" style={{ background: 'linear-gradient(180deg, #111827 0%, #1F2937 30%, #F9FAFB 30%)' }}>
                <div className="container" style={{ maxWidth: 700 }}>

                    {/* Header */}
                    <div className="text-white mb-5 pb-4">
                        <button className="btn btn-link text-decoration-none p-0 mb-4 d-flex align-items-center gap-2 text-white fw-bold smallest ls-2"
                            onClick={() => navigate('/mitambo')}>
                            <i className="bi bi-arrow-left"></i> MURAHU
                        </button>
                        <div className="d-flex align-items-center gap-3 mb-2">
                            <div className="battle-header-icon">
                                <i className="bi bi-lightning-charge-fill"></i>
                            </div>
                            <div>
                                <h1 className="fw-bold mb-0 ls-tight" style={{ fontSize: '2rem' }}>Ndivhano</h1>
                                <p className="mb-0 smallest ls-1" style={{ color: '#FACC15' }}>KNOWLEDGE BATTLE</p>
                            </div>
                        </div>
                        <p className="mb-0 small" style={{ color: 'rgba(255,255,255,.6)' }}>
                            Challenge others who have completed the same lessons!
                        </p>
                    </div>

                    {/* Tabs */}
                    <div className="d-flex gap-2 mb-4" style={{ marginTop: -20 }}>
                        <button className={`btn flex-fill py-2 fw-bold smallest ls-1 rounded-3 ${lobbyTab === 'find' ? 'text-dark' : 'btn-outline-secondary'}`}
                            style={lobbyTab === 'find' ? { backgroundColor: '#FACC15', border: 'none', boxShadow: '0 2px 0 #EAB308' } : {}}
                            onClick={() => setLobbyTab('find')}>
                            <i className="bi bi-search me-2"></i> FIND BATTLE
                        </button>
                        <button className={`btn flex-fill py-2 fw-bold smallest ls-1 rounded-3 ${lobbyTab === 'history' ? 'text-dark' : 'btn-outline-secondary'}`}
                            style={lobbyTab === 'history' ? { backgroundColor: '#FACC15', border: 'none', boxShadow: '0 2px 0 #EAB308' } : {}}
                            onClick={() => setLobbyTab('history')}>
                            <i className="bi bi-clock-history me-2"></i> MY BATTLES ({myBattles.length})
                        </button>
                    </div>

                    {lobbyTab === 'find' ? (
                        <>
                            {/* NEW: Active Battles Section */}
                            {myBattles.some(b => b.status !== 'completed') && (
                                <div className="bg-white rounded-4 shadow-sm p-4 mb-4" style={{ border: '1px solid #FDE68A', backgroundColor: '#FFFBEB' }}>
                                    <h5 className="fw-bold mb-1 text-dark">🔴 In Progress</h5>
                                    <p className="text-muted small mb-3">You have an active battle! Jump back in.</p>
                                    {myBattles.filter(b => b.status !== 'completed').map(b => (
                                        <div key={b.id} className="d-flex align-items-center justify-content-between p-3 mb-2 rounded-3 bg-white border">
                                            <div>
                                                <div className="fw-bold small">{b.lessonTitle}</div>
                                                <div className="smallest text-muted">vs {b.challengerId === user?.uid ? (b.opponentName || 'Waiting...') : b.challengerName}</div>
                                            </div>
                                            <button className="btn btn-sm btn-primary px-3 py-1 fw-bold smallest ls-1 rounded-pill text-dark"
                                                style={{ backgroundColor: '#FACC15', border: 'none' }}
                                                onClick={() => b.status === 'waiting' ? handleResumeWaiting(b) : handleResumeBattle(b)}>
                                                CONTINUE
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Step 1: Select Lesson */}
                            <div className="bg-white rounded-4 shadow-sm p-4 mb-4" style={{ border: '1px solid #E5E7EB' }}>
                                <h5 className="fw-bold mb-1">① Choose a Lesson</h5>
                                <p className="text-muted small mb-3">Pick a lesson you've completed to battle on.</p>

                                {completedLessons.length === 0 ? (
                                    <div className="text-center py-4">
                                        <div className="mb-2 opacity-25">
                                            <i className="bi bi-journal-x display-1"></i>
                                        </div>
                                        <p className="text-muted small">Complete a lesson first to start battling!</p>
                                        <button className="btn btn-dark rounded-pill px-4 py-2 smallest fw-bold ls-1"
                                            onClick={() => navigate('/courses')}>
                                            GO TO COURSES
                                        </button>
                                    </div>
                                ) : (
                                    <div className="d-flex flex-wrap gap-2">
                                        {completedLessons.map(lesson => (
                                            <button key={lesson.id}
                                                className={`btn rounded-pill px-3 py-2 fw-bold smallest ls-1 ${selectedLessonId === lesson.id
                                                    ? 'text-dark' : 'btn-outline-dark border-2'}`}
                                                style={selectedLessonId === lesson.id ? {
                                                    backgroundColor: '#FACC15', border: '2px solid #EAB308',
                                                    boxShadow: '0 2px 0 #EAB308'
                                                } : {}}
                                                onClick={() => handleSelectLesson(lesson.id)}>
                                                {lesson.title}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Step 2: Open Battles / Create */}
                            {selectedLessonId && (
                                <div className="bg-white rounded-4 shadow-sm p-4 mb-4 animate__animated animate__fadeIn" style={{ border: '1px solid #E5E7EB' }}>
                                    <h5 className="fw-bold mb-1">② Join or Create</h5>
                                    <p className="text-muted small mb-3">Join an open battle or create your own room.</p>

                                    {loadingAction ? (
                                        <div className="text-center py-3">
                                            <div className="spinner-border spinner-border-sm" style={{ color: '#FACC15' }}></div>
                                        </div>
                                    ) : (
                                        <>
                                            {openBattles.length > 0 && (
                                                <div className="mb-3">
                                                    <p className="smallest fw-bold text-muted ls-2 text-uppercase mb-2">OPEN BATTLES</p>
                                                    {openBattles.map(b => (
                                                        <div key={b.id} className="d-flex align-items-center justify-content-between p-3 mb-2 rounded-3"
                                                            style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                                                            <div>
                                                                <span className="fw-bold">{b.challengerName}</span>
                                                                <span className="text-muted small ms-2">is waiting...</span>
                                                            </div>
                                                            <button className="btn btn-sm px-3 py-1 fw-bold smallest ls-1 rounded-pill text-white"
                                                                style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}
                                                                onClick={() => handleJoinBattle(b)}>
                                                                ⚔️ ACCEPT
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            <button className="btn battle-btn-primary w-100 py-3 fw-bold ls-1"
                                                onClick={handleCreateBattle} disabled={loadingAction}>
                                                🏟️ CREATE BATTLE ROOM
                                            </button>

                                            {openBattles.length === 0 && (
                                                <p className="text-muted smallest text-center mt-2 mb-0">
                                                    No open battles for this lesson. Create one and wait for a challenger!
                                                </p>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}
                        </>
                    ) : (
                        /* BATTLE HISTORY TAB */
                        <div className="bg-white rounded-4 shadow-sm p-4" style={{ border: '1px solid #E5E7EB' }}>
                            {myBattles.length === 0 ? (
                                <div className="text-center py-4">
                                    <div className="mb-2 opacity-25">
                                        <i className="bi bi-trophy display-1"></i>
                                    </div>
                                    <p className="text-muted">No battles yet. Start your first one!</p>
                                </div>
                            ) : (
                                myBattles.map(b => {
                                    const isChallenger = b.challengerId === user?.uid;
                                    const myScore = isChallenger ? b.challengerScore : b.opponentScore;
                                    const theirScore = isChallenger ? b.opponentScore : b.challengerScore;
                                    const theirName = isChallenger ? (b.opponentName || 'Waiting...') : b.challengerName;
                                    const isWinner = b.winnerId === user?.uid;
                                    const isDraw = b.status === 'completed' && !b.winnerId;
                                    const isWaiting = b.status === 'waiting';
                                    const isPlaying = b.status === 'playing';

                                    return (
                                        <div key={b.id} className="p-3 mb-2 rounded-3 d-flex align-items-center justify-content-between"
                                            style={{
                                                backgroundColor: isWinner ? '#F0FDF4' : isDraw ? '#FFFBEB' : isWaiting ? '#F3F4F6' : '#FEF2F2',
                                                border: `1px solid ${isWinner ? '#BBF7D0' : isDraw ? '#FDE68A' : isWaiting ? '#E5E7EB' : '#FECACA'}`
                                            }}>
                                            <div>
                                                <div className="fw-bold small">{b.lessonTitle}</div>
                                                <div className="smallest text-muted">
                                                    vs {theirName}
                                                    {b.status === 'completed' && ` • ${myScore} - ${theirScore}`}
                                                </div>
                                            </div>
                                            <div className="d-flex align-items-center gap-2">
                                                {isWaiting && isChallenger && (
                                                    <button className="btn btn-sm btn-dark px-3 py-1 fw-bold smallest ls-1 rounded-pill"
                                                        onClick={() => handleResumeWaiting(b)}>
                                                        RESUME
                                                    </button>
                                                )}
                                                {isPlaying && (
                                                    <button className="btn btn-sm btn-primary px-3 py-1 fw-bold smallest ls-1 rounded-pill text-dark"
                                                        style={{ backgroundColor: '#FACC15', border: 'none' }}
                                                        onClick={() => handleResumeBattle(b)}>
                                                        RESUME
                                                    </button>
                                                )}
                                                <span className={`badge rounded-pill smallest fw-bold d-flex align-items-center gap-1 ${isWaiting ? 'bg-secondary' : isPlaying ? 'bg-primary' : isWinner ? 'bg-success' : isDraw ? 'bg-warning text-dark' : 'bg-danger'}`}>
                                                    {isWaiting ? <><i className="bi bi-hourglass-split"></i> WAITING</> :
                                                        isPlaying ? <><span className="neon-dot"></span> LIVE</> :
                                                            isWinner ? <><i className="bi bi-trophy-fill"></i> WON</> :
                                                                isDraw ? <><i className="bi bi-people-fill"></i> DRAW</> :
                                                                    <><i className="bi bi-exclamation-triangle-fill"></i> LOST</>}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}
                </div>

                <style>{battleStyles}</style>
            </div>
        );
    }

    // =============================================
    //  WAITING VIEW
    // =============================================
    if (view === 'waiting') {
        return (
            <div className="min-vh-100 bg-white d-flex align-items-center justify-content-center p-3">
                <div className="text-center" style={{ maxWidth: 500 }}>
                    <div className="mb-4">
                        <div className="battle-waiting-ring mx-auto">
                            <i className="bi bi-lightning-charge-fill display-1 text-warning"></i>
                        </div>
                    </div>
                    <h2 className="fw-bold mb-2 ls-tight">Waiting for Opponent...</h2>
                    <p className="text-muted mb-4">Share this battle with a friend who has completed the same lesson!</p>

                    <div className="p-4 rounded-4 mb-4" style={{ backgroundColor: '#F3F4F6', border: '1px solid #E5E7EB' }}>
                        <p className="smallest fw-bold text-muted ls-2 text-uppercase mb-2">LESSON</p>
                        <h4 className="fw-bold mb-0">{currentBattle?.lessonTitle || '...'}</h4>
                    </div>

                    {/* Pulsing dots animation */}
                    <div className="d-flex justify-content-center gap-2 mb-4">
                        {[0, 1, 2].map(i => (
                            <div key={i} style={{
                                width: 12, height: 12, borderRadius: '50%', backgroundColor: '#FACC15',
                                animation: `pulse 1.5s infinite ${i * 0.3}s`
                            }}></div>
                        ))}
                    </div>

                    <button className="btn btn-outline-dark border-2 rounded-pill px-4 py-2 fw-bold smallest ls-1"
                        onClick={backToLobby}>
                        CANCEL
                    </button>
                </div>
                <style>{battleStyles}</style>
            </div>
        );
    }

    // =============================================
    //  PLAYING VIEW
    // =============================================
    if (view === 'playing') {
        const lesson = getLesson();
        if (!lesson || !lesson.questions || lesson.questions.length === 0) {
            return (
                <div className="min-vh-100 bg-white d-flex align-items-center justify-content-center">
                    <p className="text-muted">No questions found for this lesson.</p>
                </div>
            );
        }

        // If quiz is finished but waiting for opponent
        if (quizFinished) {
            const isChallenger = myRole === 'challenger';
            const opponentFinished = isChallenger ? currentBattle?.opponentFinished : currentBattle?.challengerFinished;

            if (!opponentFinished) {
                return (
                    <div className="min-vh-100 bg-white d-flex align-items-center justify-content-center p-3">
                        <div className="text-center" style={{ maxWidth: 500 }}>
                            <div className="mb-4">
                                <i className="bi bi-flag-fill display-1 text-dark opacity-10"></i>
                            </div>
                            <h2 className="fw-bold mb-2 ls-tight">You Finished!</h2>
                            <p className="text-muted mb-2">Your Score: <strong style={{ color: '#FACC15' }}>{score} LP</strong></p>
                            <p className="text-muted mb-4">Waiting for your opponent to finish...</p>
                            <div className="d-flex justify-content-center gap-2 mb-4">
                                {[0, 1, 2].map(i => (
                                    <div key={i} style={{
                                        width: 12, height: 12, borderRadius: '50%', backgroundColor: '#FACC15',
                                        animation: `pulse 1.5s infinite ${i * 0.3}s`
                                    }}></div>
                                ))}
                            </div>
                        </div>
                        <style>{battleStyles}</style>
                    </div>
                );
            }
        }

        // Active quiz
        if (!quizFinished) {
            const qIndex = currentBattle?.questionOrder ? currentBattle.questionOrder[currentQIndex] : currentQIndex;
            const q = lesson.questions[qIndex] as Question;
            const totalQ = currentBattle?.questionOrder?.length || lesson.questions.length;
            const progress = ((currentQIndex + 1) / totalQ) * 100;

            // Opponent progress
            const isChallenger = myRole === 'challenger';
            const opponentProgress = isChallenger
                ? ((currentBattle?.opponentProgress || 0) / totalQ) * 100
                : ((currentBattle?.challengerProgress || 0) / totalQ) * 100;
            const opponentName = isChallenger ? (currentBattle?.opponentName || 'Opponent') : currentBattle?.challengerName || 'Opponent';

            const renderQuestion = () => {
                switch (q.type) {
                    case 'true-false': return <TrueFalseQuestion q={q as TFQuestion} selected={null} status={answerStatus} onSelect={(v) => handleTFSelect(v, (q as TFQuestion).correctAnswer)} />;
                    case 'fill-in-the-blank': return <FillBlankQuestion q={q as FBQuestion} status={answerStatus} onSubmit={(a) => handleFBSubmit(a, (q as FBQuestion).correctAnswer)} />;
                    case 'match-pairs': return <MatchPairsQuestion q={q as MPQuestion} onComplete={handleMatchComplete} />;
                    case 'listen-and-choose': return <ListenChooseQuestion q={q as LCQuestion} selected={null} status={answerStatus} onSelect={(o) => handleLCSelect(o, (q as LCQuestion).correctAnswer)} speakVenda={speakVenda} />;
                    default: return <MultipleChoiceQuestion q={q as MCQuestion} selected={null} status={answerStatus} onSelect={(o) => handleMCSelect(o, (q as MCQuestion).correctAnswer)} />;
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
                <div className="min-vh-100 bg-white py-4 px-3">
                    <ScorePopup result={lastScoreResult} />
                    <div className="container" style={{ maxWidth: 700 }}>

                        {/* Battle HUD */}
                        <div className="p-3 rounded-4 mb-4" style={{ background: 'linear-gradient(135deg, #111827, #1F2937)' }}>
                            <div className="d-flex justify-content-between align-items-center text-white mb-2">
                                <div className="text-center flex-fill">
                                    <p className="smallest fw-bold mb-0 ls-1" style={{ color: '#FACC15' }}>YOU</p>
                                    <h4 className="fw-bold mb-0">{score}</h4>
                                </div>
                                <div className="px-3">
                                    <span className="fw-bold fs-5" style={{ color: '#6B7280' }}>VS</span>
                                </div>
                                <div className="text-center flex-fill">
                                    <p className="smallest fw-bold mb-0 ls-1" style={{ color: '#EF4444' }}>{opponentName.toUpperCase()}</p>
                                    <h4 className="fw-bold mb-0">
                                        {isChallenger ? (currentBattle?.opponentScore || 0) : (currentBattle?.challengerScore || 0)}
                                    </h4>
                                </div>
                            </div>

                            {/* Dual progress bars */}
                            <div className="d-flex gap-1">
                                <div className="flex-fill">
                                    <div className="progress" style={{ height: 4, borderRadius: 10, backgroundColor: 'rgba(255,255,255,.1)' }}>
                                        <div className="progress-bar" style={{ width: `${progress}%`, backgroundColor: '#FACC15', transition: '0.5s ease' }}></div>
                                    </div>
                                </div>
                                <div className="flex-fill">
                                    <div className="progress" style={{ height: 4, borderRadius: 10, backgroundColor: 'rgba(255,255,255,.1)' }}>
                                        <div className="progress-bar" style={{ width: `${opponentProgress}%`, backgroundColor: '#EF4444', transition: '0.5s ease' }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Question Header */}
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <span className="smallest fw-bold ls-1 text-muted">Q{currentQIndex + 1}/{totalQ}</span>
                            <span className="badge rounded-pill bg-light text-dark border smallest">{typeLabel[q.type] || '📝 QUESTION'}</span>
                            {streak >= 2 && <span className="badge rounded-pill bg-dark text-warning smallest">🔥 {streak}</span>}
                        </div>

                        {/* Question */}
                        <div className="py-3 text-center">
                            <h3 className="fw-bold text-dark mb-4 ls-tight">{q.question}</h3>

                            {!showExplanation ? (
                                renderQuestion()
                            ) : (
                                <div className="text-start">
                                    <div className="p-4 border-start border-4 border-danger bg-light mb-4">
                                        <h5 className="fw-bold text-danger mb-2">Pfarelo (Oops!)</h5>
                                        <p className="text-secondary mb-0">{q.explanation}</p>
                                    </div>
                                    <button className="btn battle-btn-primary w-100 py-3 fw-bold ls-1"
                                        onClick={handleExplanationNext}>
                                        I UNDERSTAND, NEXT
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            );
        }

        // This part should technically only be results view now
        return null;
    }

    // =============================================
    //  RESULTS VIEW
    // =============================================
    if (view === 'results') {
        if (!currentBattle) return null;

        const isChallenger = currentBattle.challengerId === user?.uid;
        const myScore = isChallenger ? currentBattle.challengerScore : currentBattle.opponentScore;
        const theirScore = isChallenger ? currentBattle.opponentScore : currentBattle.challengerScore;
        const opponentName = isChallenger ? (currentBattle.opponentName || 'Opponent') : currentBattle.challengerName;
        const isWinner = currentBattle.winnerId === user?.uid;
        const isDraw = !currentBattle.winnerId;

        return (
            <div className="min-vh-100 bg-white d-flex align-items-center justify-content-center p-3 animate__animated animate__fadeIn">
                <div className="text-center w-100" style={{ maxWidth: 500 }}>

                    <div className="mb-4">
                        {isWinner ? (
                            <div className="display-1">🏆</div>
                        ) : isDraw ? (
                            <div className="display-1">🤝</div>
                        ) : (
                            <div className="display-1">🎯</div>
                        )}
                    </div>

                    <h1 className="fw-bold display-4 mb-2 ls-tight">
                        {isWinner ? 'YOU WON!' : isDraw ? "IT'S A DRAW!" : 'GOOD GAME!'}
                    </h1>
                    <p className="text-muted mb-5">Battle against {opponentName}</p>

                    <div className="row g-3 mb-5">
                        <div className="col-6">
                            <div className="p-4 rounded-4 bg-light border">
                                <p className="smallest fw-bold text-muted ls-2 text-uppercase mb-1">YOU</p>
                                <h2 className="fw-bold mb-0" style={{ color: isWinner ? '#10B981' : '#111827' }}>{myScore}</h2>
                                <p className="smallest text-muted mb-0">LP EARNED</p>
                            </div>
                        </div>
                        <div className="col-6">
                            <div className="p-4 rounded-4 bg-light border">
                                <p className="smallest fw-bold text-muted ls-2 text-uppercase mb-1">{opponentName.toUpperCase()}</p>
                                <h2 className="fw-bold mb-0" style={{ color: !isWinner && !isDraw ? '#10B981' : '#111827' }}>{theirScore}</h2>
                                <p className="smallest text-muted mb-0">LP EARNED</p>
                            </div>
                        </div>
                    </div>

                    <button className="btn battle-btn-primary w-100 py-3 fw-bold ls-1 mb-3"
                        onClick={backToLobby}>
                        BACK TO LOBBY
                    </button>
                    <button className="btn btn-link text-decoration-none text-muted smallest fw-bold ls-1"
                        onClick={() => navigate('/mitambo')}>
                        EXIT TO GAMES
                    </button>
                </div>
                <style>{battleStyles}</style>
            </div>
        );
    }

    return null;
};

export default KnowledgeBattle;
