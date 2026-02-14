import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../services/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { fetchLessons, fetchUserData } from '../services/dataCache';
import {
    createBattle, fetchOpenBattles, fetchMyBattles, joinBattle,
    subscribeToBattle, updateBattleProgress, finalizeBattle,
    type Battle
} from '../services/battleService';
import { calculateScore, CONSOLATION_POINTS, type Difficulty, type ScoreResult } from '../services/scoringUtils';

// =============================================
//  QUESTION TYPES (mirrored from GameRoom)
// =============================================
interface QuestionBase { id: number; question: string; explanation: string; type: string; }
interface MCQuestion extends QuestionBase { type: 'multiple-choice'; options: string[]; correctAnswer: string; }
interface TFQuestion extends QuestionBase { type: 'true-false'; correctAnswer: boolean; }
interface FBQuestion extends QuestionBase { type: 'fill-in-the-blank'; correctAnswer: string; hint?: string; }
interface MPQuestion extends QuestionBase { type: 'match-pairs'; pairs: { venda: string; english: string }[]; }
interface LCQuestion extends QuestionBase { type: 'listen-and-choose'; vendaWord: string; options: string[]; correctAnswer: string; }
type Question = MCQuestion | TFQuestion | FBQuestion | MPQuestion | LCQuestion;

// =============================================
//  SCORE POPUP
// =============================================
const ScorePopup: React.FC<{ result: ScoreResult | null }> = ({ result }) => {
    if (!result) return null;
    return (
        <div className="battle-score-popup">
            <i className="bi bi-stars me-2"></i>
            {result.label}
        </div>
    );
};

// =============================================
//  QUESTION COMPONENTS
// =============================================
const MultipleChoiceQ: React.FC<{
    q: MCQuestion; selected: string | null; status: 'correct' | 'wrong' | null;
    onSelect: (opt: string) => void;
}> = ({ q, selected, status, onSelect }) => (
    <div className="d-grid gap-3">
        {q.options.map((opt) => {
            const isCorrect = opt === q.correctAnswer;
            const isSelected = selected === opt;
            let cls = 'btn-outline-dark border-2';
            if (isSelected) cls = isCorrect ? 'btn-success border-success text-white' : 'btn-danger border-danger text-white';
            else if (selected && isCorrect && status === 'wrong') cls = 'btn-success border-success text-white opacity-75';
            return (
                <button key={opt} className={`btn btn-lg py-3 fw-bold rounded-4 ${cls}`}
                    onClick={() => onSelect(opt)} disabled={!!selected}>
                    {opt}
                </button>
            );
        })}
    </div>
);

const TrueFalseQ: React.FC<{
    q: TFQuestion; selected: boolean | null; status: 'correct' | 'wrong' | null;
    onSelect: (val: boolean) => void;
}> = ({ q, selected, status, onSelect }) => {
    const renderBtn = (val: boolean, label: string, vendaLabel: string) => {
        const isCorrect = val === q.correctAnswer;
        const isSelected = selected === val;
        let cls = 'btn-outline-dark border-2';
        if (isSelected) cls = isCorrect ? 'btn-success border-success text-white' : 'btn-danger border-danger text-white';
        else if (selected !== null && isCorrect && status === 'wrong') cls = 'btn-success border-success text-white opacity-75';
        return (
            <button className={`btn btn-lg py-3 fw-bold rounded-pill flex-fill ${cls}`}
                onClick={() => onSelect(val)} disabled={selected !== null}>
                <span className="d-block fs-4">{vendaLabel}</span>
                <span className="smallest text-uppercase ls-2 opacity-75">{label}</span>
            </button>
        );
    };
    return (
        <div className="d-flex gap-3">
            {renderBtn(true, 'TRUE', 'NGOHO')}
            {renderBtn(false, 'FALSE', 'MAZWIFHI')}
        </div>
    );
};

const FillBlankQ: React.FC<{
    q: FBQuestion; onSubmit: (answer: string) => void; status: 'correct' | 'wrong' | null;
}> = ({ q, onSubmit, status }) => {
    const [input, setInput] = useState('');
    const submitted = status !== null;
    return (
        <div>
            {q.hint && <p className="text-muted smallest mb-3 ls-1">HINT: {q.hint}</p>}
            <div className="d-flex gap-2">
                <input type="text"
                    className={`form-control form-control-lg rounded-3 fw-bold text-center ${submitted ? (status === 'correct' ? 'border-success' : 'border-danger') : ''}`}
                    placeholder="Type your answer…" value={input}
                    onChange={e => setInput(e.target.value)} disabled={submitted}
                    onKeyDown={e => { if (e.key === 'Enter' && input.trim()) onSubmit(input.trim()); }}
                    style={{ borderWidth: 2 }}
                />
            </div>
            {!submitted && (
                <button className="btn battle-btn-primary w-100 py-3 fw-bold ls-1 mt-3"
                    disabled={!input.trim()} onClick={() => onSubmit(input.trim())}>
                    CHECK ANSWER
                </button>
            )}
        </div>
    );
};

const MatchPairsQ: React.FC<{
    q: MPQuestion; onComplete: (allCorrect: boolean) => void;
}> = ({ q, onComplete }) => {
    const [selectedVenda, setSelectedVenda] = useState<string | null>(null);
    const [matched, setMatched] = useState<string[]>([]);
    const [wrongPair, setWrongPair] = useState<string | null>(null);
    const [mistakes, setMistakes] = useState(0);
    const [shuffledEnglish] = useState(() => [...q.pairs].sort(() => Math.random() - 0.5).map(p => p.english));

    const handleEnglishTap = (eng: string) => {
        if (!selectedVenda || matched.includes(eng)) return;
        const correctPair = q.pairs.find(p => p.venda === selectedVenda);
        if (correctPair && correctPair.english === eng) {
            setMatched(prev => [...prev, eng]);
            setSelectedVenda(null);
            if (matched.length + 1 === q.pairs.length) {
                setTimeout(() => onComplete(mistakes === 0), 600);
            }
        } else {
            setMistakes(m => m + 1);
            setWrongPair(eng);
            setTimeout(() => { setWrongPair(null); setSelectedVenda(null); }, 700);
        }
    };

    return (
        <div className="row g-3">
            <div className="col-6">
                <p className="smallest fw-bold text-muted ls-2 text-uppercase mb-3">TSHIVENDA</p>
                {q.pairs.map(p => {
                    const isMatched = matched.includes(p.english);
                    return (
                        <button key={p.venda}
                            className={`btn w-100 mb-2 py-3 fw-bold rounded-3 border-2 ${isMatched ? 'btn-success text-white border-success' : selectedVenda === p.venda ? 'btn-dark text-white' : 'btn-outline-dark'}`}
                            disabled={isMatched} onClick={() => setSelectedVenda(p.venda)}>
                            {p.venda}
                        </button>
                    );
                })}
            </div>
            <div className="col-6">
                <p className="smallest fw-bold text-muted ls-2 text-uppercase mb-3">ENGLISH</p>
                {shuffledEnglish.map(eng => {
                    const isMatched = matched.includes(eng);
                    const isWrong = wrongPair === eng;
                    return (
                        <button key={eng}
                            className={`btn w-100 mb-2 py-3 fw-bold rounded-3 border-2 ${isMatched ? 'btn-success text-white border-success' : isWrong ? 'btn-danger text-white border-danger' : 'btn-outline-dark'}`}
                            disabled={isMatched || !selectedVenda} onClick={() => handleEnglishTap(eng)}>
                            {eng}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

const ListenChooseQ: React.FC<{
    q: LCQuestion; selected: string | null; status: 'correct' | 'wrong' | null;
    onSelect: (opt: string) => void; speakVenda: (text: string) => void;
}> = ({ q, selected, status, onSelect, speakVenda }) => {
    useEffect(() => { speakVenda(q.vendaWord); }, []);
    return (
        <div>
            <button className="btn btn-outline-dark border-2 rounded-pill px-5 py-3 mb-4 fw-bold"
                onClick={() => speakVenda(q.vendaWord)}>
                <i className="bi bi-volume-up-fill fs-3 me-2"></i> PLAY AGAIN
            </button>
            <div className="d-grid gap-3 mt-2">
                {q.options.map(opt => {
                    const isCorrect = opt === q.correctAnswer;
                    const isSelected = selected === opt;
                    let cls = 'btn-outline-dark border-2';
                    if (isSelected) cls = isCorrect ? 'btn-success border-success text-white' : 'btn-danger border-danger text-white';
                    else if (selected && isCorrect && status === 'wrong') cls = 'btn-success border-success text-white opacity-75';
                    return (
                        <button key={opt} className={`btn btn-lg py-3 fw-bold rounded-4 ${cls}`}
                            onClick={() => onSelect(opt)} disabled={!!selected}>
                            {opt}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

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

    // Quiz state
    const [currentQIndex, setCurrentQIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [correctCount, setCorrectCount] = useState(0);
    const [streak, setStreak] = useState(0);
    const [questionStartTime, setQuestionStartTime] = useState(Date.now());
    const [lastScoreResult, setLastScoreResult] = useState<ScoreResult | null>(null);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [selectedTF, setSelectedTF] = useState<boolean | null>(null);
    const [answerStatus, setAnswerStatus] = useState<'correct' | 'wrong' | null>(null);
    const [showExplanation, setShowExplanation] = useState(false);
    const [quizFinished, setQuizFinished] = useState(false);

    // Refs for cleanup
    const unsubRef = useRef<(() => void) | null>(null);
    const gameStartedRef = useRef(false);

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

    // Clear score popup
    useEffect(() => {
        if (!lastScoreResult) return;
        const t = setTimeout(() => setLastScoreResult(null), 1500);
        return () => clearTimeout(t);
    }, [lastScoreResult]);

    // Reset question timer
    useEffect(() => {
        if (view === 'playing') setQuestionStartTime(Date.now());
    }, [currentQIndex, view]);

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
        setCurrentQIndex(0);
        setScore(0);
        setCorrectCount(0);
        setStreak(0);
        setSelectedOption(null);
        setSelectedTF(null);
        setAnswerStatus(null);
        setShowExplanation(false);
        setQuizFinished(false);
        setQuestionStartTime(Date.now());
    };

    const getLesson = () => lessons.find(l => l.id === selectedLessonId);
    const getDifficulty = (): Difficulty => (getLesson()?.difficulty as Difficulty) || 'Easy';

    const handleCorrect = () => {
        const elapsed = Date.now() - questionStartTime;
        const result = calculateScore(getDifficulty(), streak, elapsed);
        const newScore = score + result.total;
        const newCorrect = correctCount + 1;
        setScore(newScore);
        setCorrectCount(newCorrect);
        setStreak(s => s + 1);
        setLastScoreResult(result);
        setAnswerStatus('correct');

        // Update live progress
        if (battleId) {
            updateBattleProgress(battleId, myRole, newScore, newCorrect, currentQIndex + 1, false);
        }

        setTimeout(() => nextQuestion(newScore, newCorrect), 1200);
    };

    const handleWrong = () => {
        setAnswerStatus('wrong');
        setStreak(0);
        setTimeout(() => setShowExplanation(true), 600);
    };

    const handleMCSelect = (opt: string, correctAnswer: string) => {
        if (selectedOption) return;
        setSelectedOption(opt);
        opt === correctAnswer ? handleCorrect() : handleWrong();
    };

    const handleTFSelect = (val: boolean, correctAnswer: boolean) => {
        if (selectedTF !== null) return;
        setSelectedTF(val);
        val === correctAnswer ? handleCorrect() : handleWrong();
    };

    const handleFBSubmit = (answer: string, correctAnswer: string) => {
        if (answer.toLowerCase() === correctAnswer.toLowerCase()) {
            handleCorrect();
        } else {
            handleWrong();
        }
    };

    const handleMatchComplete = (allCorrect: boolean) => {
        if (allCorrect) {
            handleCorrect();
        } else {
            setAnswerStatus('correct');
            const newScore = score + CONSOLATION_POINTS;
            setScore(newScore);
            if (battleId) {
                updateBattleProgress(battleId, myRole, newScore, correctCount, currentQIndex + 1, false);
            }
            setTimeout(() => nextQuestion(newScore, correctCount), 1200);
        }
    };

    const handleLCSelect = (opt: string, correctAnswer: string) => {
        if (selectedOption) return;
        setSelectedOption(opt);
        opt === correctAnswer ? handleCorrect() : handleWrong();
    };

    const nextQuestion = (currentScore?: number, currentCorrect?: number) => {
        setSelectedOption(null);
        setSelectedTF(null);
        setAnswerStatus(null);
        setShowExplanation(false);

        const lesson = getLesson();
        const nextIdx = currentQIndex + 1;
        const totalQ = currentBattle?.questionOrder?.length || (lesson?.questions?.length || 0);

        if (lesson && nextIdx < totalQ) {
            setCurrentQIndex(nextIdx);
        } else {
            // Quiz finished
            handleQuizFinish(currentScore ?? score, currentCorrect ?? correctCount);
        }
    };

    const handleQuizFinish = async (finalScore: number, finalCorrect: number) => {
        setQuizFinished(true);
        if (battleId) {
            const totalQ = currentBattle?.questionOrder?.length || 0;
            await updateBattleProgress(battleId, myRole, finalScore, finalCorrect, totalQ, true);
            // Try to finalize (will only succeed if both done)
            await finalizeBattle(battleId);
        }
    };

    const handleExplanationNext = () => {
        const newScore = score + CONSOLATION_POINTS;
        setScore(newScore);
        if (battleId) {
            updateBattleProgress(battleId, myRole, newScore, correctCount, currentQIndex, false);
        }
        nextQuestion(newScore, correctCount);
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
                const qKey = `q-${qIndex}-${currentQIndex}`;
                switch (q.type) {
                    case 'true-false':
                        return <TrueFalseQ key={qKey} q={q as TFQuestion} selected={selectedTF} status={answerStatus} onSelect={(v) => handleTFSelect(v, (q as TFQuestion).correctAnswer)} />;
                    case 'fill-in-the-blank':
                        return <FillBlankQ key={qKey} q={q as FBQuestion} status={answerStatus} onSubmit={(a) => handleFBSubmit(a, (q as FBQuestion).correctAnswer)} />;
                    case 'match-pairs':
                        return <MatchPairsQ key={qKey} q={q as MPQuestion} onComplete={handleMatchComplete} />;
                    case 'listen-and-choose':
                        return <ListenChooseQ key={qKey} q={q as LCQuestion} selected={selectedOption} status={answerStatus} onSelect={(o) => handleLCSelect(o, (q as LCQuestion).correctAnswer)} speakVenda={speakVenda} />;
                    default:
                        return <MultipleChoiceQ key={qKey} q={q as MCQuestion} selected={selectedOption} status={answerStatus} onSelect={(o) => handleMCSelect(o, (q as MCQuestion).correctAnswer)} />;
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
                    <style>{battleStyles}</style>
                </div>
            );
        }
    }

    // =============================================
    //  RESULTS VIEW
    // =============================================
    if (view === 'results' && currentBattle) {
        const isChallenger = myRole === 'challenger';
        const myScore = isChallenger ? currentBattle.challengerScore : currentBattle.opponentScore;
        const myCorrect = isChallenger ? currentBattle.challengerCorrect : currentBattle.opponentCorrect;
        const theirScore = isChallenger ? currentBattle.opponentScore : currentBattle.challengerScore;
        const theirCorrect = isChallenger ? currentBattle.opponentCorrect : currentBattle.challengerCorrect;
        const theirName = isChallenger ? (currentBattle.opponentName || 'Opponent') : currentBattle.challengerName;
        const isWinner = currentBattle.winnerId === user?.uid;
        const isDraw = !currentBattle.winnerId;
        const totalQ = currentBattle.questionCount;

        return (
            <div className="min-vh-100 d-flex align-items-center justify-content-center p-3"
                style={{ background: isWinner ? 'linear-gradient(180deg, #064E3B, #111827)' : isDraw ? 'linear-gradient(180deg, #78350F, #111827)' : 'linear-gradient(180deg, #7F1D1D, #111827)' }}>
                <div className="text-center w-100" style={{ maxWidth: 500 }}>

                    {/* Result Icon */}
                    <div className="battle-result-icon mb-4" style={{ animation: 'bounceIn 0.8s' }}>
                        {isWinner ? <i className="bi bi-trophy-fill text-warning"></i> : isDraw ? <i className="bi bi-people-fill text-white"></i> : <i className="bi bi-emoji-expressionless text-white opacity-50"></i>}
                    </div>
                    <h1 className="fw-bold display-4 text-white mb-1 ls-tight">
                        {isWinner ? 'U WINNA!' : isDraw ? 'DRAW!' : 'U LUTEA!'}
                    </h1>
                    <p className="mb-4" style={{ color: 'rgba(255,255,255,.6)' }}>
                        {isWinner ? 'You proved your knowledge!' : isDraw ? 'Equally matched!' : 'Better luck next time!'}
                    </p>

                    {/* Head-to-Head Comparison */}
                    <div className="p-4 rounded-4 mb-4" style={{ backgroundColor: 'rgba(255,255,255,.1)', backdropFilter: 'blur(10px)' }}>
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <div className="text-center flex-fill">
                                <p className="smallest fw-bold ls-1 mb-1" style={{ color: '#FACC15' }}>YOU</p>
                                <h2 className="fw-bold text-white mb-0">{myScore}</h2>
                                <p className="smallest mb-0" style={{ color: 'rgba(255,255,255,.5)' }}>{myCorrect}/{totalQ} correct</p>
                            </div>
                            <div className="px-3">
                                <span className="fw-bold fs-4" style={{ color: 'rgba(255,255,255,.3)' }}>VS</span>
                            </div>
                            <div className="text-center flex-fill">
                                <p className="smallest fw-bold ls-1 mb-1" style={{ color: '#EF4444' }}>{theirName.toUpperCase()}</p>
                                <h2 className="fw-bold text-white mb-0">{theirScore}</h2>
                                <p className="smallest mb-0" style={{ color: 'rgba(255,255,255,.5)' }}>{theirCorrect}/{totalQ} correct</p>
                            </div>
                        </div>

                        {/* Score bars */}
                        <div className="mb-2">
                            <div className="d-flex gap-1" style={{ height: 8, borderRadius: 10, overflow: 'hidden' }}>
                                <div style={{
                                    width: `${Math.max(5, (myScore / Math.max(myScore + theirScore, 1)) * 100)}%`,
                                    backgroundColor: '#FACC15', borderRadius: '10px 0 0 10px', transition: 'width 1s ease'
                                }}></div>
                                <div style={{
                                    width: `${Math.max(5, (theirScore / Math.max(myScore + theirScore, 1)) * 100)}%`,
                                    backgroundColor: '#EF4444', borderRadius: '0 10px 10px 0', transition: 'width 1s ease'
                                }}></div>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="d-flex gap-3">
                        <button className="btn btn-outline-light border-2 flex-fill py-3 fw-bold ls-1 rounded-3"
                            onClick={backToLobby}>
                            🏟️ LOBBY
                        </button>
                        <button className="btn battle-btn-primary flex-fill py-3 fw-bold ls-1"
                            onClick={() => { backToLobby(); setLobbyTab('find'); }}>
                            ⚔️ REMATCH
                        </button>
                    </div>
                </div>
                <style>{battleStyles}</style>
            </div>
        );
    }

    return null;
};

// =============================================
//  STYLES
// =============================================
const battleStyles = `
    .ls-tight { letter-spacing: -1.5px; }
    .ls-1 { letter-spacing: 1px; }
    .ls-2 { letter-spacing: 2px; }
    .smallest { font-size: 11px; }

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

    @keyframes pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.5; transform: scale(0.95); }
    }

    @keyframes bounceIn {
        0% { opacity: 0; transform: scale(0.3); }
        50% { opacity: 1; transform: scale(1.05); }
        70% { transform: scale(0.9); }
        100% { transform: scale(1); }
    }

    .battle-header-icon {
        width: 60px;
        height: 60px;
        background: rgba(250, 204, 21, 0.1);
        border: 2px solid rgba(250, 204, 21, 0.3);
        border-radius: 18px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 2rem;
        color: #FACC15;
        box-shadow: 0 0 20px rgba(250, 204, 21, 0.2);
    }

    .neon-dot {
        width: 8px;
        height: 8px;
        background-color: #EF4444;
        border-radius: 50%;
        display: inline-block;
        box-shadow: 0 0 10px #EF4444;
        animation: neon-pulse 1.5s infinite;
    }

    @keyframes neon-pulse {
        0%, 100% { opacity: 1; filter: brightness(1.2); }
        50% { opacity: 0.5; filter: brightness(0.8); }
    }

    .battle-waiting-ring {
        width: 140px;
        height: 140px;
        border: 4px solid #F3F4F6;
        border-top-color: #FACC15;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: spin 2s linear infinite;
    }

    .battle-waiting-ring > i {
        animation: counter-spin 2s linear infinite;
    }

    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
    @keyframes counter-spin {
        from { transform: rotate(360deg); }
        to { transform: rotate(0deg); }
    }

    .battle-score-popup {
        position: fixed; top: 18%; left: 50%; transform: translateX(-50%);
        z-index: 50; background: #111827; color: #FACC15; padding: 10px 28px;
        border-radius: 40px; fontWeight: 800; fontSize: 22px; letterSpacing: 1px;
        boxShadow: 0 6px 24px rgba(0,0,0,.35); pointerEvents: none;
        animation: bounceIn 0.5s;
        border: 2px solid rgba(250, 204, 21, 0.2);
    }

    .battle-result-icon {
        font-size: 6rem;
        filter: drop-shadow(0 0 30px rgba(255,255,255,0.2));
    }
`;

export default KnowledgeBattle;
