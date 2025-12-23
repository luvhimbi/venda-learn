import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../services/firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { getBadgeDetails, getLevelStats } from "../services/levelUtils.ts";

// --- LEVEL UP MODAL ---
const LevelUpModal: React.FC<{ level: number; onClose: () => void }> = ({ level, onClose }) => {
    const badge = getBadgeDetails(level);
    return (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center z-3"
             style={{ backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}>
            <div className="card border-0 shadow-lg p-5 rounded-5 text-center animate__animated animate__zoomIn" style={{ maxWidth: '420px' }}>
                <div className="display-1 mb-3 animate__animated animate__tada animate__infinite animate__slow">{badge.icon}</div>
                <h1 className="fw-bold text-primary">LEVEL UP!</h1>
                <p className="lead mb-2">Zwi khou bvelela! You reached <strong>Level {level}</strong>.</p>
                <div className="p-3 rounded-4 mb-4 border" style={{ backgroundColor: `${badge.color}15`, borderColor: badge.color }}>
                    <span className="h5 fw-bold" style={{ color: badge.color }}>New Rank: {badge.name}</span>
                </div>
                <button className="btn btn-primary btn-lg w-100 rounded-pill fw-bold shadow" onClick={onClose}>Phanda</button>
            </div>
        </div>
    );
};

const GameRoom: React.FC = () => {
    const { lessonId } = useParams();
    const navigate = useNavigate();

    // Data & Logic States
    const [lesson, setLesson] = useState<any>(null);
    const [gameState, setGameState] = useState<'STUDY' | 'QUIZ' | 'RESULT'>('STUDY');
    const [currentSlide, setCurrentSlide] = useState(0);
    const [currentQIndex, setCurrentQIndex] = useState(0);
    const [score, setScore] = useState(0);

    // Interaction Feedback
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [answerStatus, setAnswerStatus] = useState<'correct' | 'wrong' | null>(null);
    const [showExplanation, setShowExplanation] = useState(false);
    const [showLevelUp, setShowLevelUp] = useState(false);
    const [newLevelReached, setNewLevelReached] = useState(1);

    // Speech & Recording State
    const [isRecording, setIsRecording] = useState(false);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    // --- FIX: PRE-LOAD VOICES FOR SPEECH API ---
    useEffect(() => {
        const loadVoices = () => {
            window.speechSynthesis.getVoices();
        };
        loadVoices();
        window.speechSynthesis.onvoiceschanged = loadVoices;

        const fetchLesson = async () => {
            if (!lessonId) return;
            const docSnap = await getDoc(doc(db, "lessons", lessonId));
            if (docSnap.exists()) setLesson(docSnap.data());
        };
        fetchLesson();
    }, [lessonId]);

    // --- IMPROVED SPEECH FUNCTION ---
    const speakVenda = (text: string) => {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);

        // Find best South African or English voice
        const voices = window.speechSynthesis.getVoices();
        const selectedVoice = voices.find(v => v.lang.includes('ZA')) || voices.find(v => v.lang.includes('en')) || voices[0];

        if (selectedVoice) utterance.voice = selectedVoice;
        utterance.rate = 0.8;
        utterance.pitch = 1;
        window.speechSynthesis.speak(utterance);
    };

    // --- RECORDING LOGIC ---
    const startRecording = async () => {
        try {
            setAudioUrl(null);
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (e) => audioChunksRef.current.push(e.data);
            mediaRecorderRef.current.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
                setAudioUrl(URL.createObjectURL(audioBlob));
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
        } catch (err) {
            alert("Please enable microphone access to practice pronunciation.");
        }
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
            setTimeout(() => nextQuestion(), 1200);
        } else {
            setAnswerStatus('wrong');
            setShowExplanation(true);
        }
    };

    const nextQuestion = () => {
        setSelectedOption(null);
        setAnswerStatus(null);
        setShowExplanation(false);
        setAudioUrl(null);
        if (currentQIndex + 1 < lesson.questions.length) setCurrentQIndex(prev => prev + 1);
        else handleFinishQuiz();
    };

    const handleFinishQuiz = async () => {
        setGameState('RESULT');
        if (auth.currentUser) {
            try {
                const userRef = doc(db, "users", auth.currentUser.uid);
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                    const oldPoints = Number(userSnap.data().points || 0);
                    const newPoints = oldPoints + score;
                    const oldLevel = getLevelStats(oldPoints).level;
                    const statsAfterGame = getLevelStats(newPoints);
                    await updateDoc(userRef, { points: newPoints, level: statsAfterGame.level });
                    if (statsAfterGame.level > oldLevel) {
                        setNewLevelReached(statsAfterGame.level);
                        setShowLevelUp(true);
                    }
                }
            } catch (err) { console.error("Save Error:", err); }
        }
    };

    const ElephantMascot = () => {
        let animation = "animate__bounceIn";
        let expression = "🐘";
        if (answerStatus === 'correct') { animation = "animate__bounce"; expression = "🐘🎉"; }
        else if (answerStatus === 'wrong') { animation = "animate__headShake"; expression = "🐘💡"; }
        return <div className={`display-4 animate__animated ${animation}`} style={{ fontSize: '4rem' }}>{expression}</div>;
    };

    if (!lesson) return (
        <div className="d-flex justify-content-center align-items-center min-vh-100">
            <div className="spinner-border text-primary" role="status"></div>
        </div>
    );

    // --- VIEW 1: STUDY PHASE ---
    if (gameState === 'STUDY') {
        const slide = lesson.slides[currentSlide];
        return (
            <div className="container py-5">
                <div className="row justify-content-center text-center">
                    <div className="col-md-8 col-lg-6">
                        <ElephantMascot />
                        <div className="card border-0 shadow-lg p-4 p-md-5 rounded-4 bg-white my-4">
                            {slide.imageUrl && <img src={slide.imageUrl} alt={slide.english} className="img-fluid mb-4 rounded-3" style={{ maxHeight: '180px', objectFit: 'contain' }} />}

                            <div className="d-flex align-items-center justify-content-center gap-3 mb-2">
                                <h1 className="display-3 text-primary fw-bold mb-0">{slide.venda}</h1>
                                <button className="btn btn-primary rounded-circle shadow-sm p-3" onClick={() => speakVenda(slide.venda)}>
                                    <span style={{fontSize: '1.2rem'}}>🔊</span>
                                </button>
                            </div>

                            <h4 className="text-muted fw-light mb-4">{slide.english}</h4>

                            <div className="bg-light p-3 rounded-4 mb-3 border border-dashed">
                                <p className="small text-muted mb-2 font-monospace">Practice Pronunciation</p>
                                {!isRecording ? (
                                    <button className="btn btn-outline-danger rounded-pill px-4 btn-sm fw-bold" onClick={startRecording}>
                                        🎤 Start Recording
                                    </button>
                                ) : (
                                    <button className="btn btn-danger rounded-pill px-4 btn-sm animate__animated animate__pulse animate__infinite fw-bold" onClick={stopRecording}>
                                        ⏹️ Stop
                                    </button>
                                )}
                                {audioUrl && (
                                    <div className="mt-3 animate__animated animate__fadeIn">
                                        <audio src={audioUrl} controls className="w-100" style={{height: '35px'}} />
                                    </div>
                                )}
                            </div>

                            <div className="bg-light p-3 rounded-3 text-secondary italic small">"{slide.context}"</div>
                        </div>
                        <div className="d-flex justify-content-between align-items-center px-2">
                            <button className="btn btn-light rounded-pill px-4 fw-bold" disabled={currentSlide === 0} onClick={() => {setCurrentSlide(prev => prev - 1); setAudioUrl(null);}}>Murahu</button>
                            <span className="fw-bold text-muted small">{currentSlide + 1} / {lesson.slides.length}</span>
                            {currentSlide + 1 < lesson.slides.length ? (
                                <button className="btn btn-primary rounded-pill px-4 fw-bold" onClick={() => {setCurrentSlide(prev => prev + 1); setAudioUrl(null);}}>Phanda</button>
                            ) : (
                                <button className="btn btn-success rounded-pill px-4 fw-bold shadow" onClick={() => setGameState('QUIZ')}>Start Quiz 🚀</button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- VIEW 2: QUIZ PHASE ---
    if (gameState === 'QUIZ') {
        const q = lesson.questions[currentQIndex];
        return (
            <div className="container py-5 text-center">
                <div className="col-md-6 mx-auto">
                    <ElephantMascot />
                    <div className="progress mb-5 mt-3" style={{ height: '8px', borderRadius: '10px' }}>
                        <div className="progress-bar bg-success" style={{ width: `${((currentQIndex + 1) / lesson.questions.length) * 100}%` }}></div>
                    </div>
                    <h3 className="fw-bold mb-4">{q.question}</h3>
                    {!showExplanation ? (
                        <div className="d-grid gap-3">
                            {q.options.map((opt: string) => (
                                <button key={opt} className={`btn btn-lg py-3 fw-bold rounded-4 border-2 transition-all ${selectedOption === opt ? (opt === q.correctAnswer ? "btn-success" : "btn-danger") : "btn-outline-primary"}`}
                                        onClick={() => handleAnswerSelection(opt, q.correctAnswer)} disabled={!!selectedOption}>
                                    {opt}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="card border-0 shadow-lg p-4 bg-white rounded-4 animate__animated animate__shakeX">
                            <h5 className="text-danger fw-bold">Ndi khou humbela pfarelo!</h5>
                            <p className="text-muted">{q.explanation}</p>
                            <button className="btn btn-primary w-100 py-3 rounded-pill fw-bold" onClick={nextQuestion}>I got it, next!</button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // --- VIEW 3: RESULT PHASE ---
    return (
        <div className="container py-5 text-center">
            {showLevelUp && <LevelUpModal level={newLevelReached} onClose={() => setShowLevelUp(false)} />}
            <div className="card border-0 shadow-lg p-5 rounded-5 d-inline-block bg-white">
                <div className="display-1 mb-3 animate__animated animate__bounceIn">🐘🏅</div>
                <h2 className="fw-bold">Ro fhedza!</h2>
                <div className="bg-light p-4 rounded-4 my-4">
                    <h5 className="mb-0">You earned</h5>
                    <div className="display-4 fw-bold text-primary">+{score} LP</div>
                </div>
                <button className="btn btn-primary btn-lg px-5 rounded-pill shadow fw-bold" onClick={() => navigate('/')}>Hayani (Home)</button>
            </div>
        </div>
    );
};

export default GameRoom;