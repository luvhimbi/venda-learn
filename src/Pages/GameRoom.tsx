import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { db, auth } from '../services/firebaseConfig';
import { doc, updateDoc, arrayUnion, increment } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { getBadgeDetails, getLevelStats } from "../services/levelUtils.ts";
import { updateStreak } from "../services/streakUtils.ts";
import { calculateScore, CONSOLATION_POINTS, type Difficulty, type ScoreResult } from "../services/scoringUtils.ts";
import { fetchLessons, fetchUserData, refreshUserData, invalidateCache } from '../services/dataCache';
import Mascot from '../components/Mascot';

const ExitModal: React.FC<{ onClose: () => void, onConfirm: () => void }> = ({ onClose, onConfirm }) => (
    <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-black bg-opacity-50" style={{ zIndex: 1050 }}>
        <div className="bg-white p-4 rounded-4 shadow-lg text-center animate__animated animate__fadeInUp" style={{ maxWidth: '320px' }}>
            <div className="mb-3 d-flex justify-content-center">
                <Mascot mood="sad" width="120px" height="120px" />
            </div>
            <h5 className="fw-bold mb-2 text-dark">Leaving so soon?</h5>
            <p className="text-muted small mb-4">You'll lose your progress for this session.</p>
            <div className="d-flex gap-2">
                <button className="btn btn-light flex-grow-1 fw-bold text-dark" onClick={onClose}>
                    Stay
                </button>
                <button className="btn btn-danger flex-grow-1 fw-bold" onClick={onConfirm}>
                    Exit
                </button>
            </div>
        </div>
    </div>
);


// =============================================
//  TYPES
// =============================================
interface QuestionBase {
    id: number;
    question: string;
    explanation: string;
    type: string;
}
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
        <div className="score-popup animate__animated animate__bounceIn" style={{
            position: 'fixed', top: '18%', left: '50%', transform: 'translateX(-50%)',
            zIndex: 50, background: '#111827', color: '#FACC15', padding: '10px 28px',
            borderRadius: 40, fontWeight: 800, fontSize: 22, letterSpacing: 1,
            boxShadow: '0 6px 24px rgba(0,0,0,.35)', pointerEvents: 'none'
        }}>
            {result.label}
        </div>
    );
};

// =============================================
//  LEVEL-UP MODAL
// =============================================
const LevelUpModal: React.FC<{ level: number; onClose: () => void }> = ({ level, onClose }) => {
    const badge = getBadgeDetails(level);
    return (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center z-3 bg-white">
            <div className="text-center p-4 animate__animated animate__zoomIn" style={{ maxWidth: '500px' }}>
                <div className="display-1 mb-4">{badge.icon}</div>
                <h1 className="fw-bold display-4 mb-2 ls-tight text-dark">LEVEL UP!</h1>
                <p className="text-muted mb-5 ls-1">Zwi khou bvelela! You are now Level {level}.</p>
                <div className="py-4 border-top border-bottom mb-5">
                    <p className="smallest fw-bold text-muted mb-1 ls-2 text-uppercase">New Rank</p>
                    <h2 className="fw-bold mb-0" style={{ color: '#FACC15' }}>{badge.name}</h2>
                </div>
                <button className="btn game-btn-primary w-100 py-3 fw-bold" onClick={onClose}>PHANDA (CONTINUE)</button>
            </div>
        </div>
    );
};

// =============================================
//  QUESTION COMPONENTS
// =============================================

// --- MULTIPLE CHOICE ---
const MultipleChoiceQuestion: React.FC<{
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
                <button key={opt} className={`btn btn-lg py-4 fw-bold rounded-4 ${cls}`}
                    onClick={() => onSelect(opt)} disabled={!!selected}>
                    {opt}
                </button>
            );
        })}
    </div>
);

// --- TRUE / FALSE ---
const TrueFalseQuestion: React.FC<{
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
            <button className={`btn btn-lg py-4 fw-bold rounded-pill flex-fill ${cls}`}
                onClick={() => onSelect(val)} disabled={selected !== null}>
                <span className="d-block fs-3">{vendaLabel}</span>
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

// --- FILL IN THE BLANK ---
const FillBlankQuestion: React.FC<{
    q: FBQuestion; onSubmit: (answer: string) => void; status: 'correct' | 'wrong' | null;
}> = ({ q, onSubmit, status }) => {
    const [input, setInput] = useState('');
    const submitted = status !== null;
    return (
        <div>
            {q.hint && <p className="text-muted smallest mb-3 ls-1">HINT: {q.hint}</p>}
            <div className="d-flex gap-2">
                <input
                    type="text"
                    className={`form-control form-control-lg rounded-3 fw-bold text-center ${submitted ? (status === 'correct' ? 'border-success' : 'border-danger') : ''}`}
                    placeholder="Type your answer…"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    disabled={submitted}
                    onKeyDown={e => { if (e.key === 'Enter' && input.trim()) onSubmit(input.trim()); }}
                    style={{ borderWidth: 2 }}
                />
            </div>
            {!submitted && (
                <button className="btn game-btn-primary w-100 py-3 fw-bold ls-1 mt-3"
                    disabled={!input.trim()}
                    onClick={() => onSubmit(input.trim())}>
                    CHECK ANSWER
                </button>
            )}
        </div>
    );
};

// --- MATCH PAIRS ---
const MatchPairsQuestion: React.FC<{
    q: MPQuestion; onComplete: (allCorrect: boolean) => void;
}> = ({ q, onComplete }) => {
    const [selectedVenda, setSelectedVenda] = useState<string | null>(null);
    const [matched, setMatched] = useState<string[]>([]);
    const [wrongPair, setWrongPair] = useState<string | null>(null);
    const [mistakes, setMistakes] = useState(0);

    // Shuffle English column once
    const [shuffledEnglish] = useState(() => [...q.pairs].sort(() => Math.random() - 0.5).map(p => p.english));

    const handleEnglishTap = (eng: string) => {
        if (!selectedVenda || matched.includes(eng)) return;
        const correctPair = q.pairs.find(p => p.venda === selectedVenda);
        if (correctPair && correctPair.english === eng) {
            setMatched(prev => [...prev, eng]);
            setSelectedVenda(null);
            // Check completion
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
            {/* Venda Column */}
            <div className="col-6">
                <p className="smallest fw-bold text-muted ls-2 text-uppercase mb-3">TSHIVENDA</p>
                {q.pairs.map(p => {
                    const isMatched = matched.includes(p.english);
                    return (
                        <button key={p.venda}
                            className={`btn w-100 mb-2 py-3 fw-bold rounded-3 border-2 ${isMatched ? 'btn-success text-white border-success' : selectedVenda === p.venda ? 'btn-dark text-white' : 'btn-outline-dark'}`}
                            disabled={isMatched}
                            onClick={() => setSelectedVenda(p.venda)}>
                            {p.venda}
                        </button>
                    );
                })}
            </div>
            {/* English Column */}
            <div className="col-6">
                <p className="smallest fw-bold text-muted ls-2 text-uppercase mb-3">ENGLISH</p>
                {shuffledEnglish.map(eng => {
                    const isMatched = matched.includes(eng);
                    const isWrong = wrongPair === eng;
                    return (
                        <button key={eng}
                            className={`btn w-100 mb-2 py-3 fw-bold rounded-3 border-2 ${isMatched ? 'btn-success text-white border-success' : isWrong ? 'btn-danger text-white border-danger animate__animated animate__shakeX' : 'btn-outline-dark'}`}
                            disabled={isMatched || !selectedVenda}
                            onClick={() => handleEnglishTap(eng)}>
                            {eng}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

// --- LISTEN & CHOOSE ---
const ListenChooseQuestion: React.FC<{
    q: LCQuestion; selected: string | null; status: 'correct' | 'wrong' | null;
    onSelect: (opt: string) => void; speakVenda: (text: string) => void;
}> = ({ q, selected, status, onSelect, speakVenda }) => {
    // Auto-play on mount
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
                        <button key={opt} className={`btn btn-lg py-4 fw-bold rounded-4 ${cls}`}
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
//  MAIN GAME ROOM
// =============================================
const GameRoom: React.FC = () => {
    const { lessonId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    const queryParams = new URLSearchParams(location.search);
    const startIdx = parseInt(queryParams.get('start') || '0');
    const startType = queryParams.get('type') || 'STUDY';

    // Core state
    const [lesson, setLesson] = useState<any>(null);
    const [gameState, setGameState] = useState<'STUDY' | 'QUIZ' | 'RESULT'>(startType as any);
    const [currentSlide, setCurrentSlide] = useState(startType === 'STUDY' ? startIdx : 0);
    const [currentQIndex, setCurrentQIndex] = useState(startType === 'QUIZ' ? startIdx : 0);
    const [isFirstTime, setIsFirstTime] = useState(true);

    // Scoring state
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(0);
    const [questionStartTime, setQuestionStartTime] = useState(Date.now());
    const [lastScoreResult, setLastScoreResult] = useState<ScoreResult | null>(null);
    const [scoreBreakdown, setScoreBreakdown] = useState<{ base: number; speed: number; streakBonus: number; consolation: number }>({ base: 0, speed: 0, streakBonus: 0, consolation: 0 });

    // Answer state
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [selectedTF, setSelectedTF] = useState<boolean | null>(null);
    const [answerStatus, setAnswerStatus] = useState<'correct' | 'wrong' | null>(null);
    const [showExplanation, setShowExplanation] = useState(false);
    const [showLevelUp, setShowLevelUp] = useState(false);
    const [newLevelReached, setNewLevelReached] = useState(1);

    // Audio state
    const [isRecording, setIsRecording] = useState(false);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [isPlayingAudio, setIsPlayingAudio] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const [showExitModal, setShowExitModal] = useState(false);

    // Reset question timer when moving to a new question
    useEffect(() => {
        if (gameState === 'QUIZ') setQuestionStartTime(Date.now());
    }, [currentQIndex, gameState]);

    // Clear score popup after delay
    useEffect(() => {
        if (!lastScoreResult) return;
        const t = setTimeout(() => setLastScoreResult(null), 1500);
        return () => clearTimeout(t);
    }, [lastScoreResult]);

    // Load lesson + user data
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user && lessonId) {
                const lessons = await fetchLessons();
                const found = lessons.find((l: any) => l.id === lessonId);
                if (found) setLesson(found);
                const userData = await fetchUserData();
                if (userData) {
                    const completed = userData.completedLessons || [];
                    setIsFirstTime(!completed.includes(lessonId));
                }
            }
        });
        return () => unsubscribe();
    }, [lessonId]);

    // Save progress
    const saveProgress = async (index: number, type: 'STUDY' | 'QUIZ') => {
        if (auth.currentUser && lessonId) {
            const userRef = doc(db, "users", auth.currentUser.uid);
            await updateDoc(userRef, { lastLessonId: lessonId, lastProgressIndex: index, lastProgressType: type.toLowerCase() });
        }
    };

    // TTS
    const speakVenda = useCallback((text: string) => {
        setIsPlayingAudio(true);
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.rate = 0.8;
        u.onend = () => setIsPlayingAudio(false);
        window.speechSynthesis.speak(u);
    }, []);

    // Recording
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];
            mediaRecorderRef.current.ondataavailable = (e) => audioChunksRef.current.push(e.data);
            mediaRecorderRef.current.onstop = () => {
                const url = URL.createObjectURL(new Blob(audioChunksRef.current, { type: 'audio/webm' }));
                setAudioUrl(url);
            };
            mediaRecorderRef.current.start();
            setIsRecording(true);
        } catch { alert("Enable microphone access to practice."); }
    };
    const stopRecording = () => { mediaRecorderRef.current?.stop(); setIsRecording(false); };

    // ---------- SCORING ----------
    const getDifficulty = (): Difficulty => (lesson?.difficulty as Difficulty) || 'Easy';

    const awardCorrectAnswer = () => {
        const elapsed = Date.now() - questionStartTime;
        const result = calculateScore(getDifficulty(), streak, elapsed);
        setScore(s => s + result.total);
        setStreak(s => s + 1);
        setLastScoreResult(result);
        setScoreBreakdown(prev => ({
            ...prev,
            base: prev.base + result.base,
            speed: prev.speed + result.speedBonus,
            streakBonus: prev.streakBonus + Math.round((result.base + result.speedBonus) * (result.streakMultiplier - 1)),
        }));
    };

    const awardConsolation = () => {
        setScore(s => s + CONSOLATION_POINTS);
        setScoreBreakdown(prev => ({ ...prev, consolation: prev.consolation + CONSOLATION_POINTS }));
    };

    // ---------- ANSWER HANDLERS ----------
    const handleCorrect = () => {
        setAnswerStatus('correct');
        awardCorrectAnswer();
        setTimeout(() => nextQuestion(), 1200);
    };

    const handleWrong = () => {
        setAnswerStatus('wrong');
        setStreak(0);
        setTimeout(() => setShowExplanation(true), 600);
    };

    // MC
    const handleMCSelect = (opt: string, correctAnswer: string) => {
        if (selectedOption) return;
        setSelectedOption(opt);
        opt === correctAnswer ? handleCorrect() : handleWrong();
    };

    // TF
    const handleTFSelect = (val: boolean, correctAnswer: boolean) => {
        if (selectedTF !== null) return;
        setSelectedTF(val);
        val === correctAnswer ? handleCorrect() : handleWrong();
    };

    // Fill-blank
    const handleFBSubmit = (answer: string, correctAnswer: string) => {
        if (answer.toLowerCase() === correctAnswer.toLowerCase()) {
            setAnswerStatus('correct');
            awardCorrectAnswer();
            setTimeout(() => nextQuestion(), 1200);
        } else {
            setAnswerStatus('wrong');
            setStreak(0);
            setTimeout(() => setShowExplanation(true), 600);
        }
    };

    // Match pairs
    const handleMatchComplete = (allCorrect: boolean) => {
        if (allCorrect) {
            setAnswerStatus('correct');
            awardCorrectAnswer();
            setTimeout(() => nextQuestion(), 1200);
        } else {
            // Give partial credit — they finished but had mistakes
            setAnswerStatus('correct');
            setScore(s => s + CONSOLATION_POINTS);
            setScoreBreakdown(prev => ({ ...prev, consolation: prev.consolation + CONSOLATION_POINTS }));
            setTimeout(() => nextQuestion(), 1200);
        }
    };

    // Listen-choose
    const handleLCSelect = (opt: string, correctAnswer: string) => {
        if (selectedOption) return;
        setSelectedOption(opt);
        opt === correctAnswer ? handleCorrect() : handleWrong();
    };

    // ---------- NAV ----------
    const nextQuestion = () => {
        setSelectedOption(null);
        setSelectedTF(null);
        setAnswerStatus(null);
        setShowExplanation(false);
        const nextIdx = currentQIndex + 1;
        if (nextIdx < lesson.questions.length) {
            setCurrentQIndex(nextIdx);
            saveProgress(nextIdx, 'QUIZ');
        } else {
            handleFinishQuiz();
        }
    };

    const handleFinishQuiz = async () => {
        setGameState('RESULT');
        if (auth.currentUser) {
            const userRef = doc(db, "users", auth.currentUser.uid);
            const currentData = await refreshUserData();
            if (currentData) {
                if (isFirstTime) {
                    const newPoints = (currentData.points || 0) + score;
                    const stats = getLevelStats(newPoints);
                    await updateDoc(userRef, {
                        points: increment(score),
                        level: stats.level,
                        completedLessons: arrayUnion(lessonId),
                        lastLessonId: null,
                    });
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

    // ---------- LOADING ----------
    if (!lesson) return (
        <div className="min-vh-100 bg-white d-flex align-items-center justify-content-center">
            <div className="spinner-border" style={{ color: '#FACC15' }}></div>
        </div>
    );

    // =============================================
    //  STUDY MODE
    // =============================================
    if (gameState === 'STUDY') {
        const slide = lesson.slides[currentSlide];
        const progress = ((currentSlide + 1) / lesson.slides.length) * 100;
        const isLastSlide = currentSlide + 1 >= lesson.slides.length;

        return (
            <div className="min-vh-100 d-flex flex-column" style={{ background: 'linear-gradient(180deg, #111827 0%, #1F2937 40%, #F9FAFB 40%)' }}>

                {/* ---- DARK HEADER ---- */}
                <div className="px-3 pt-4 pb-5" style={{ color: 'white' }}>
                    <div className="container" style={{ maxWidth: '700px' }}>
                        {/* Top bar */}
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

                        {/* Progress bar */}
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

                {/* ---- MAIN CARD ---- */}
                <div className="flex-grow-1 px-3" style={{ marginTop: '-30px' }}>
                    <div className="container" style={{ maxWidth: '700px' }}>
                        <div key={currentSlide} className="animate__animated animate__fadeIn animate__faster">

                            {/* Word Card */}
                            <div className="bg-white rounded-4 shadow-lg p-5 text-center mb-4 position-relative overflow-hidden" style={{ border: '1px solid #E5E7EB' }}>
                                {/* Decorative top accent */}
                                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg, #FACC15, #F59E0B)' }}></div>

                                {/* Slide dots */}
                                <div className="d-flex justify-content-center gap-1 mb-4">
                                    {lesson.slides.map((_: any, i: number) => (
                                        <div key={i} style={{
                                            width: i === currentSlide ? 20 : 6, height: 6, borderRadius: 10,
                                            backgroundColor: i === currentSlide ? '#FACC15' : (i < currentSlide ? '#10B981' : '#E5E7EB'),
                                            transition: 'all 0.3s'
                                        }}></div>
                                    ))}
                                </div>

                                {/* Venda Word */}
                                <div className="mb-2">
                                    <h1 className="fw-bold ls-tight mb-0" style={{ fontSize: 'clamp(2rem, 8vw, 3.5rem)', color: '#111827' }}>
                                        {slide.venda}
                                    </h1>
                                </div>

                                {/* Audio button */}
                                <button
                                    className="btn rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                                    onClick={() => speakVenda(slide.venda)}
                                    style={{
                                        width: 52, height: 52, backgroundColor: isPlayingAudio ? '#FEF3C7' : '#F3F4F6',
                                        border: isPlayingAudio ? '2px solid #FACC15' : '2px solid #E5E7EB',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <i className={`bi ${isPlayingAudio ? 'bi-soundwave' : 'bi-volume-up-fill'} fs-5`} style={{ color: '#111827' }}></i>
                                </button>

                                {/* English Translation */}
                                <div className="mb-4">
                                    <span className="px-3 py-2 rounded-pill fw-bold" style={{ backgroundColor: '#F3F4F6', color: '#6B7280', fontSize: '1.1rem' }}>
                                        {slide.english}
                                    </span>
                                </div>

                                {/* Image if available */}
                                {slide.imageUrl && (
                                    <div className="mb-3">
                                        <img src={slide.imageUrl} alt={slide.english} style={{ width: 64, height: 64, objectFit: 'contain', opacity: 0.8 }} />
                                    </div>
                                )}
                            </div>

                            {/* Pronunciation Lab */}
                            <div className="bg-white rounded-4 p-4 mb-4 text-center" style={{ border: '1px solid #E5E7EB' }}>
                                <div className="d-flex align-items-center justify-content-center gap-2 mb-3">
                                    <i className="bi bi-mic-fill" style={{ color: '#FACC15' }}></i>
                                    <span className="smallest fw-bold text-muted ls-2 text-uppercase">Pronunciation Lab</span>
                                </div>
                                {!isRecording ? (
                                    <button className="btn rounded-pill px-4 py-2 fw-bold smallest ls-1" onClick={startRecording}
                                        style={{ backgroundColor: '#111827', color: 'white' }}>
                                        <i className="bi bi-mic-fill me-2"></i> TAP TO RECORD
                                    </button>
                                ) : (
                                    <button className="btn btn-danger rounded-pill px-4 py-2 fw-bold smallest ls-1 animate__animated animate__pulse animate__infinite" onClick={stopRecording}>
                                        <i className="bi bi-stop-fill me-2"></i> STOP RECORDING
                                    </button>
                                )}
                                {audioUrl && (
                                    <div className="mt-3 d-flex justify-content-center">
                                        <audio src={audioUrl} controls style={{ height: 35, width: '100%', maxWidth: 300 }} />
                                    </div>
                                )}
                            </div>

                            {/* Cultural Context */}
                            <div className="rounded-4 p-4 mb-4 d-flex gap-3 align-items-start" style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A' }}>
                                <span className="fs-4 flex-shrink-0">💡</span>
                                <div>
                                    <p className="smallest fw-bold mb-1 ls-2 text-uppercase" style={{ color: '#92400E' }}>Cultural Context</p>
                                    <p className="mb-0 fst-italic" style={{ color: '#78350F', lineHeight: 1.6 }}>"{slide.context}"</p>
                                </div>
                            </div>

                            {/* Navigation Buttons */}
                            <div className="d-flex gap-3 pb-4">
                                <button className="btn btn-outline-dark border-2 w-50 py-3 fw-bold ls-1 rounded-3"
                                    disabled={currentSlide === 0}
                                    onClick={() => { setAudioUrl(null); const prev = currentSlide - 1; setCurrentSlide(prev); saveProgress(prev, 'STUDY'); }}>
                                    <i className="bi bi-arrow-left me-2"></i> MURAHU
                                </button>
                                {!isLastSlide ? (
                                    <button className="btn game-btn-primary w-50 py-3 fw-bold ls-1"
                                        onClick={() => { setAudioUrl(null); const next = currentSlide + 1; setCurrentSlide(next); saveProgress(next, 'STUDY'); }}>
                                        PHANDA <i className="bi bi-arrow-right ms-2"></i>
                                    </button>
                                ) : (
                                    <button className="btn w-50 py-3 fw-bold ls-1 text-white rounded-3"
                                        style={{ background: 'linear-gradient(135deg, #111827, #374151)', boxShadow: '0 4px 0 #000' }}
                                        onClick={() => { setGameState('QUIZ'); saveProgress(0, 'QUIZ'); }}>
                                        🧠 START QUIZ
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                {showExitModal && <ExitModal onClose={() => setShowExitModal(false)} onConfirm={() => navigate('/courses')} />}
            </div>
        );
    }

    // =============================================
    //  QUIZ MODE
    // =============================================
    if (gameState === 'QUIZ') {
        const q = lesson.questions[currentQIndex] as Question;
        const progress = ((currentQIndex + 1) / lesson.questions.length) * 100;

        // Render the right component based on question type
        const renderQuestion = () => {
            switch (q.type) {
                case 'true-false':
                    return <TrueFalseQuestion q={q as TFQuestion} selected={selectedTF} status={answerStatus} onSelect={(v) => handleTFSelect(v, (q as TFQuestion).correctAnswer)} />;
                case 'fill-in-the-blank':
                    return <FillBlankQuestion q={q as FBQuestion} status={answerStatus} onSubmit={(a) => handleFBSubmit(a, (q as FBQuestion).correctAnswer)} />;
                case 'match-pairs':
                    return <MatchPairsQuestion q={q as MPQuestion} onComplete={handleMatchComplete} />;
                case 'listen-and-choose':
                    return <ListenChooseQuestion q={q as LCQuestion} selected={selectedOption} status={answerStatus} onSelect={(o) => handleLCSelect(o, (q as LCQuestion).correctAnswer)} speakVenda={speakVenda} />;
                default:
                    return <MultipleChoiceQuestion q={q as MCQuestion} selected={selectedOption} status={answerStatus} onSelect={(o) => handleMCSelect(o, (q as MCQuestion).correctAnswer)} />;
            }
        };

        // Type label badge
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
                    {/* Header */}
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <span className="smallest fw-bold ls-1 text-muted">QUESTION {currentQIndex + 1}</span>
                        <div className="flex-grow-1 mx-4">
                            <div className="progress" style={{ height: '6px', borderRadius: '10px', backgroundColor: '#F3F4F6' }}>
                                <div className="progress-bar" style={{ width: `${progress}%`, backgroundColor: '#FACC15' }}></div>
                            </div>
                        </div>
                        <span className="smallest fw-bold ls-1 text-warning">{isFirstTime ? `${score} LP` : 'REVIEWING'}</span>
                    </div>

                    {/* Streak + Type badge */}
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <span className="badge rounded-pill bg-light text-dark border smallest">{typeLabel[q.type] || '📝 QUESTION'}</span>
                        {streak >= 2 && isFirstTime && (
                            <span className="badge rounded-pill bg-dark text-warning smallest">🔥 {streak} streak</span>
                        )}
                    </div>

                    <div className="py-4 text-center">
                        <h2 className="fw-bold text-dark mb-5 ls-tight">{q.question}</h2>

                        {!showExplanation ? (
                            renderQuestion()
                        ) : (
                            <div className="text-start animate__animated animate__fadeIn">
                                <div className="p-4 border-start border-4 border-danger bg-light mb-4">
                                    <h5 className="fw-bold text-danger mb-2">Pfarelo (Oops!)</h5>
                                    <p className="text-secondary mb-0">{q.explanation}</p>
                                </div>
                                <button className="btn game-btn-primary w-100 py-3 fw-bold ls-1" onClick={() => {
                                    if (isFirstTime) awardConsolation();
                                    nextQuestion();
                                }}>I UNDERSTAND, NEXT</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // =============================================
    //  RESULT MODE
    // =============================================

    return (
        <div className="min-vh-100 bg-white d-flex align-items-center justify-content-center p-3">
            {showLevelUp && <LevelUpModal level={newLevelReached} onClose={() => setShowLevelUp(false)} />}
            <div className="text-center w-100" style={{ maxWidth: '500px' }}>
                <div className="d-flex justify-content-center mb-4">
                    <Mascot mood="excited" width="150px" height="150px" />
                </div>
                <h1 className="fw-bold display-4 text-dark mb-2 ls-tight">
                    {isFirstTime ? 'Ro Fhedza!' : 'Review Done!'}
                </h1>
                <p className="text-muted mb-4 ls-1">
                    {isFirstTime ? "You've mastered this lesson." : "Great job refreshing your knowledge."}
                </p>

                {/* Score Breakdown */}
                {isFirstTime && (
                    <div className="py-4 border-top border-bottom mb-4">
                        <h1 className="display-2 fw-bold mb-3" style={{ color: '#FACC15' }}>+{score} LP</h1>
                        <div className="d-flex flex-column gap-2 text-start mx-auto" style={{ maxWidth: 280 }}>
                            <div className="d-flex justify-content-between smallest text-muted">
                                <span>📝 Base points</span><span className="fw-bold text-dark">{scoreBreakdown.base}</span>
                            </div>
                            {scoreBreakdown.speed > 0 && (
                                <div className="d-flex justify-content-between smallest text-muted">
                                    <span>⚡ Speed bonus</span><span className="fw-bold text-dark">+{scoreBreakdown.speed}</span>
                                </div>
                            )}
                            {scoreBreakdown.streakBonus > 0 && (
                                <div className="d-flex justify-content-between smallest text-muted">
                                    <span>🔥 Streak bonus</span><span className="fw-bold text-dark">+{scoreBreakdown.streakBonus}</span>
                                </div>
                            )}
                            {scoreBreakdown.consolation > 0 && (
                                <div className="d-flex justify-content-between smallest text-muted">
                                    <span>📖 Learning bonus</span><span className="fw-bold text-dark">+{scoreBreakdown.consolation}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {!isFirstTime && (
                    <div className="py-5 border-top border-bottom mb-5">
                        <p className="smallest fw-bold text-muted mb-1 ls-2 text-uppercase">Progress Status</p>
                        <h1 className="display-2 fw-bold mb-0" style={{ color: '#FACC15' }}>COMPLETE</h1>
                    </div>
                )}

                <button className="btn game-btn-primary w-100 py-3 fw-bold ls-1" onClick={() => navigate('/courses')}>
                    BACK TO COURSES
                </button>
            </div>

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
            `}</style>
        </div>
    );
};

export default GameRoom;