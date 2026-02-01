import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../services/firebaseConfig';
import { doc, getDoc, updateDoc, arrayUnion, increment } from 'firebase/firestore';
import { getBadgeDetails, getLevelStats } from "../services/levelUtils.ts";
import { updateStreak } from "../services/streakUtils.ts";

// --- MINIMALIST LEVEL UP MODAL ---
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

                <button className="btn game-btn-primary w-100 py-3 fw-bold" onClick={onClose}>
                    PHANDA (CONTINUE)
                </button>
            </div>
        </div>
    );
};

const GameRoom: React.FC = () => {
    const { lessonId } = useParams();
    const navigate = useNavigate();

    const [lesson, setLesson] = useState<any>(null);
    const [gameState, setGameState] = useState<'STUDY' | 'QUIZ' | 'RESULT'>('STUDY');
    const [currentSlide, setCurrentSlide] = useState(0);
    const [currentQIndex, setCurrentQIndex] = useState(0);
    const [score, setScore] = useState(0);

    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [answerStatus, setAnswerStatus] = useState<'correct' | 'wrong' | null>(null);
    const [showExplanation, setShowExplanation] = useState(false);
    const [showLevelUp, setShowLevelUp] = useState(false);
    const [newLevelReached, setNewLevelReached] = useState(1);
    const [isFirstTime, setIsFirstTime] = useState(true);

    const [isRecording, setIsRecording] = useState(false);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [isPlayingAudio, setIsPlayingAudio] = useState(false);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    useEffect(() => {
        const fetchLesson = async () => {
            if (!lessonId) return;
            const docSnap = await getDoc(doc(db, "lessons", lessonId));
            if (docSnap.exists()) setLesson(docSnap.data());

            if (auth.currentUser) {
                const userSnap = await getDoc(doc(db, "users", auth.currentUser.uid));
                if (userSnap.exists()) {
                    const completed = userSnap.data().completedLessons || [];
                    setIsFirstTime(!completed.includes(lessonId));
                }
            }
        };
        fetchLesson();
    }, [lessonId]);

    const speakVenda = (text: string) => {
        setIsPlayingAudio(true);
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.8;
        utterance.onend = () => setIsPlayingAudio(false);
        window.speechSynthesis.speak(utterance);
    };

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
        } catch (err) { alert("Enable microphone access to practice."); }
    };

    const stopRecording = () => {
        mediaRecorderRef.current?.stop();
        setIsRecording(false);
    };

    const handleAnswerSelection = (opt: string, correctAnswer: string) => {
        if (selectedOption) return;
        setSelectedOption(opt);

        if (opt === correctAnswer) {
            setAnswerStatus('correct');
            setScore(s => s + 10);
            setTimeout(() => nextQuestion(), 1000);
        } else {
            setAnswerStatus('wrong');
            // Give a tiny delay before showing explanation for better UX
            setTimeout(() => setShowExplanation(true), 600);
        }
    };

    const nextQuestion = () => {
        setSelectedOption(null);
        setAnswerStatus(null);
        setShowExplanation(false);
        if (currentQIndex + 1 < lesson.questions.length) setCurrentQIndex(prev => prev + 1);
        else handleFinishQuiz();
    };

    const handleFinishQuiz = async () => {
        setGameState('RESULT');
        if (auth.currentUser) {
            const userRef = doc(db, "users", auth.currentUser.uid);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                const currentData = userSnap.data();

                if (isFirstTime) {
                    const newPoints = (currentData.points || 0) + score;
                    const stats = getLevelStats(newPoints);

                    await updateDoc(userRef, {
                        points: increment(score),
                        level: stats.level,
                        completedLessons: arrayUnion(lessonId)
                    });

                    await updateStreak(auth.currentUser.uid);

                    if (stats.level > (currentData.level || 1)) {
                        setNewLevelReached(stats.level);
                        setShowLevelUp(true);
                    }
                }
            }
        }
    };

    if (!lesson) return <div className="min-vh-100 bg-white d-flex align-items-center justify-content-center"><div className="spinner-border" style={{ color: '#FACC15' }}></div></div>;

    // --- STUDY MODE ---
    if (gameState === 'STUDY') {
        const slide = lesson.slides[currentSlide];
        const progress = ((currentSlide + 1) / lesson.slides.length) * 100;

        return (
            <div className="min-vh-100 bg-white py-5 px-3">
                <div className="container" style={{ maxWidth: '800px' }}>
                    <div className="d-flex justify-content-between align-items-center mb-5">
                        <button className="btn btn-link text-decoration-none p-0 text-dark fw-bold smallest ls-2" onClick={() => navigate('/courses')}>
                            <i className="bi bi-x-lg me-2"></i> EXIT
                        </button>
                        <div className="flex-grow-1 mx-4">
                            <div className="progress" style={{ height: '6px', borderRadius: '10px', backgroundColor: '#F3F4F6' }}>
                                <div className="progress-bar" style={{ width: `${progress}%`, backgroundColor: '#FACC15', transition: '0.5s' }}></div>
                            </div>
                        </div>
                        <span className="smallest fw-bold ls-1 text-muted">{currentSlide + 1} / {lesson.slides.length}</span>
                    </div>

                    <div className="text-center py-5">
                        <p className="smallest fw-bold text-muted mb-2 ls-2 text-uppercase">Study Session {!isFirstTime && '(Review)'}</p>
                        <div className="d-flex align-items-center justify-content-center gap-3 mb-2">
                            <h1 className="display-2 fw-bold text-dark ls-tight">{slide.venda}</h1>
                            <button className={`btn btn-link text-dark p-0 ${isPlayingAudio ? 'opacity-50' : ''}`} onClick={() => speakVenda(slide.venda)}>
                                <i className="bi bi-volume-up-fill fs-1"></i>
                            </button>
                        </div>
                        <h4 className="text-muted mb-5">{slide.english}</h4>

                        <div className="py-4 border-top border-bottom mb-5">
                            <h6 className="smallest fw-bold text-muted ls-2 text-uppercase mb-4">Pronunciation Lab</h6>
                            {!isRecording ? (
                                <button className="btn btn-outline-dark border-2 rounded-pill px-4 py-2 fw-bold smallest ls-1" onClick={startRecording}>
                                    <i className="bi bi-mic-fill me-2"></i> PRACTICE SPEAKING
                                </button>
                            ) : (
                                <button className="btn btn-danger rounded-pill px-4 py-2 fw-bold smallest ls-1 animate__animated animate__pulse animate__infinite" onClick={stopRecording}>
                                    <i className="bi bi-stop-fill me-2"></i> STOP RECORDING
                                </button>
                            )}
                            {audioUrl && <div className="mt-4 d-flex justify-content-center"><audio src={audioUrl} controls className="w-75" style={{ height: '35px' }} /></div>}
                        </div>

                        <div className="p-4 border-start border-4 text-start mb-5" style={{ borderColor: '#FACC15', backgroundColor: '#FAFAFA' }}>
                            <p className="smallest fw-bold text-muted mb-2 ls-2 text-uppercase">Cultural Context</p>
                            <p className="fs-5 text-secondary fst-italic mb-0">"{slide.context}"</p>
                        </div>

                        <div className="d-flex gap-3 mt-5 pt-4">
                            <button className="btn btn-outline-dark border-2 w-50 py-3 fw-bold ls-1 rounded-3" disabled={currentSlide === 0} onClick={() => setCurrentSlide(s => s - 1)}>
                                MURAHU
                            </button>
                            {currentSlide + 1 < lesson.slides.length ? (
                                <button className="btn game-btn-primary w-50 py-3 fw-bold ls-1" onClick={() => setCurrentSlide(s => s + 1)}>PHANDA</button>
                            ) : (
                                <button className="btn btn-dark w-50 py-3 fw-bold ls-1 text-white" onClick={() => setGameState('QUIZ')}>START QUIZ</button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- QUIZ MODE ---
    if (gameState === 'QUIZ') {
        const q = lesson.questions[currentQIndex];
        const progress = ((currentQIndex + 1) / lesson.questions.length) * 100;

        return (
            <div className="min-vh-100 bg-white py-5 px-3">
                <div className="container" style={{ maxWidth: '700px' }}>
                    <div className="d-flex justify-content-between align-items-center mb-5">
                        <span className="smallest fw-bold ls-1 text-muted">QUESTION {currentQIndex + 1}</span>
                        <div className="flex-grow-1 mx-4">
                            <div className="progress" style={{ height: '6px', borderRadius: '10px', backgroundColor: '#F3F4F6' }}>
                                <div className="progress-bar" style={{ width: `${progress}%`, backgroundColor: '#FACC15' }}></div>
                            </div>
                        </div>
                        <span className="smallest fw-bold ls-1 text-warning">{isFirstTime ? `${score} LP` : 'REVIEWING'}</span>
                    </div>

                    <div className="py-5 text-center">
                        <h2 className="fw-bold text-dark mb-5 ls-tight">{q.question}</h2>

                        {!showExplanation ? (
                            <div className="d-grid gap-3">
                                {q.options.map((opt: string) => {
                                    const isCorrect = opt === q.correctAnswer;
                                    const isSelected = selectedOption === opt;

                                    let btnClass = 'btn-outline-dark border-2';
                                    if (isSelected) {
                                        btnClass = isCorrect ? 'btn-success border-success text-white' : 'btn-danger border-danger text-white';
                                    } else if (selectedOption && isCorrect && answerStatus === 'wrong') {
                                        // Highlight the correct answer if the user picked the wrong one
                                        btnClass = 'btn-success border-success text-white opacity-75';
                                    }

                                    return (
                                        <button
                                            key={opt}
                                            className={`btn btn-lg py-4 fw-bold rounded-4 transition-all ${btnClass}`}
                                            onClick={() => handleAnswerSelection(opt, q.correctAnswer)}
                                            disabled={!!selectedOption}
                                        >
                                            {opt}
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-start animate__animated animate__fadeIn">
                                <div className="p-4 border-start border-4 border-danger bg-light mb-4">
                                    <h5 className="fw-bold text-danger mb-2">Pfarelo (Oops!)</h5>
                                    <p className="text-secondary mb-0">{q.explanation}</p>
                                </div>
                                <button className="btn game-btn-primary w-100 py-3 fw-bold ls-1" onClick={nextQuestion}>I UNDERSTAND, NEXT</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // --- RESULT MODE ---
    return (
        <div className="min-vh-100 bg-white d-flex align-items-center justify-content-center p-3">
            {showLevelUp && <LevelUpModal level={newLevelReached} onClose={() => setShowLevelUp(false)} />}
            <div className="text-center w-100" style={{ maxWidth: '500px' }}>
                <div className="display-1 mb-4">{isFirstTime ? '🐘🏅' : '📖✨'}</div>
                <h1 className="fw-bold display-4 text-dark mb-2 ls-tight">
                    {isFirstTime ? 'Ro Fhedza!' : 'Review Done!'}
                </h1>
                <p className="text-muted mb-5 ls-1">
                    {isFirstTime ? "You've mastered this lesson." : "Great job refreshing your knowledge."}
                </p>

                <div className="py-5 border-top border-bottom mb-5">
                    <p className="smallest fw-bold text-muted mb-1 ls-2 text-uppercase">
                        {isFirstTime ? 'Reward Earned' : 'Progress Status'}
                    </p>
                    <h1 className="display-2 fw-bold mb-0" style={{ color: '#FACC15' }}>
                        {isFirstTime ? `+${score} LP` : 'COMPLETE'}
                    </h1>
                </div>

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
            `}</style>
        </div>
    );
};

export default GameRoom;