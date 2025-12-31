import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../services/firebaseConfig';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { getBadgeDetails, getLevelStats } from "../services/levelUtils.ts";

// --- LEVEL UP MODAL ---
const LevelUpModal: React.FC<{ level: number; onClose: () => void }> = ({ level, onClose }) => {
    const badge = getBadgeDetails(level);
    return (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center z-3"
             style={{ backgroundColor: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(12px)' }}>
            <div className="card border-0 shadow-lg p-5 rounded-5 text-center position-relative overflow-hidden"
                 style={{ maxWidth: '500px', animation: 'zoomIn 0.5s ease-out' }}>
                {/* Confetti Background Effect */}
                <div className="position-absolute top-0 start-0 w-100 h-100 opacity-10"
                     style={{ background: `radial-gradient(circle, ${badge.color} 0%, transparent 70%)` }}></div>

                <div className="position-relative z-1">
                    <div className="display-1 mb-4" style={{ fontSize: '6rem', animation: 'tada 1s ease-in-out infinite' }}>
                        {badge.icon}
                    </div>
                    <div className="mb-2" style={{ animation: 'pulse 2s ease-in-out infinite' }}>✨🎉✨</div>
                    <h1 className="fw-bold mb-3" style={{
                        background: `linear-gradient(135deg, ${badge.color}, #6366f1)`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        fontSize: '3rem'
                    }}>LEVEL UP!</h1>
                    <p className="lead mb-2 text-muted">
                        <strong style={{ color: badge.color }}>Zwi khou bvelela!</strong> You reached Level {level}
                    </p>
                    <div className="p-4 rounded-4 mb-4 position-relative overflow-hidden"
                         style={{
                             backgroundColor: `${badge.color}15`,
                             border: `3px solid ${badge.color}`,
                             boxShadow: `0 0 30px ${badge.color}40`
                         }}>
                        <div className="position-absolute top-0 start-0 w-100 h-100 opacity-20"
                             style={{ background: `linear-gradient(45deg, ${badge.color}20, transparent)` }}></div>
                        <div className="h4 fw-bold mb-1" style={{ color: badge.color }}>🏆 New Rank</div>
                        <div className="h3 fw-bold" style={{ color: badge.color }}>{badge.name}</div>
                    </div>
                    <button className="btn btn-lg w-100 rounded-pill fw-bold shadow-lg position-relative overflow-hidden"
                            onClick={onClose}
                            style={{
                                background: `linear-gradient(135deg, ${badge.color}, #6366f1)`,
                                color: 'white',
                                border: 'none',
                                padding: '1rem',
                                transition: 'transform 0.2s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                        Phanda (Continue) →
                    </button>
                </div>
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

    const [isRecording, setIsRecording] = useState(false);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [isPlayingAudio, setIsPlayingAudio] = useState(false);
    const [audioLoadError, setAudioLoadError] = useState(false);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        const loadVoices = () => { window.speechSynthesis.getVoices(); };
        loadVoices();
        window.speechSynthesis.onvoiceschanged = loadVoices;

        const fetchLessonAndProgress = async () => {
            if (!lessonId || !auth.currentUser) return;

            const docSnap = await getDoc(doc(db, "lessons", lessonId));
            if (docSnap.exists()) {
                const lessonData = docSnap.data();
                setLesson(lessonData);

                const userSnap = await getDoc(doc(db, "users", auth.currentUser.uid));
                if (userSnap.exists()) {
                    const userData = userSnap.data();
                    if (userData.lastLessonId === lessonId) {
                        setCurrentSlide(userData.lastSlide || 0);
                        setCurrentQIndex(userData.lastQuestion || 0);
                        if (userData.lastState) setGameState(userData.lastState);
                    }
                }
            }
        };
        fetchLessonAndProgress();
    }, [lessonId]);

    useEffect(() => {
        const saveProgress = async () => {
            if (auth.currentUser && lessonId && gameState !== 'RESULT') {
                const userRef = doc(db, "users", auth.currentUser.uid);
                await updateDoc(userRef, {
                    lastLessonId: lessonId,
                    lastSlide: currentSlide,
                    lastQuestion: currentQIndex,
                    lastState: gameState,
                    lastUpdated: new Date().toISOString()
                });
            }
        };
        saveProgress();
    }, [currentSlide, currentQIndex, gameState, lessonId]);

    const speakVenda = (text: string) => {
        setIsPlayingAudio(true);
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        const voices = window.speechSynthesis.getVoices();
        const selectedVoice = voices.find(v => v.lang.includes('ZA')) || voices.find(v => v.lang.includes('en')) || voices[0];
        if (selectedVoice) utterance.voice = selectedVoice;
        utterance.rate = 0.8;
        utterance.onend = () => setIsPlayingAudio(false);
        utterance.onerror = () => setIsPlayingAudio(false);
        window.speechSynthesis.speak(utterance);
    };

    const startRecording = async () => {
        try {
            setAudioUrl(null);
            setAudioLoadError(false);
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    audioChunksRef.current.push(e.data);
                }
            };

            mediaRecorderRef.current.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const url = URL.createObjectURL(audioBlob);
                setAudioUrl(url);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Recording error:", err);
            alert("Please enable microphone access to practice pronunciation.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const handleAnswerSelection = (opt: string, correctAnswer: string) => {
        if (selectedOption) return;
        setSelectedOption(opt);
        if (opt === correctAnswer) {
            setAnswerStatus('correct');
            setScore(s => s + 10);
            setTimeout(() => nextQuestion(), 1500);
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
                    const statsAfterGame = getLevelStats(newPoints);

                    await updateDoc(userRef, {
                        points: newPoints,
                        level: statsAfterGame.level,
                        completedLessons: arrayUnion(lessonId),
                        lastLessonId: null
                    });

                    if (statsAfterGame.level > (userSnap.data().level || 1)) {
                        setNewLevelReached(statsAfterGame.level);
                        setShowLevelUp(true);
                    }
                }
            } catch (err) { console.error("Save Error:", err); }
        }
    };

    const ElephantMascot = () => {
        let animation = "bounceIn";
        let expression = "🐘";
        let bgColor = "#f3f4f6";

        if (answerStatus === 'correct') {
            animation = "bounce";
            expression = "🐘🎉";
            bgColor = "#dcfce7";
        } else if (answerStatus === 'wrong') {
            animation = "headShake";
            expression = "🐘💡";
            bgColor = "#fee2e2";
        }

        return (
            <div className="mb-4 d-inline-flex align-items-center justify-content-center rounded-circle p-4 shadow-lg"
                 style={{
                     fontSize: '4rem',
                     backgroundColor: bgColor,
                     animation: `${animation} 1s ease-in-out`,
                     transition: 'all 0.3s ease'
                 }}>
                {expression}
            </div>
        );
    };

    if (!lesson) {
        return (
            <div className="d-flex flex-column justify-content-center align-items-center min-vh-100 bg-light">
                <div className="spinner-border text-primary mb-3" style={{ width: '4rem', height: '4rem' }}></div>
                <p className="text-muted fw-bold">Loading lesson...</p>
            </div>
        );
    }

    if (gameState === 'STUDY') {
        const slide = lesson.slides[currentSlide];
        const progress = ((currentSlide + 1) / lesson.slides.length) * 100;

        return (
            <div className="min-vh-100 bg-gradient-to-br from-blue-50 to-indigo-50" style={{ background: 'linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 100%)' }}>
                <div className="container py-4 py-md-5">
                    {/* Progress Bar */}
                    <div className="mb-4">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <button className="btn btn-light rounded-pill px-3 py-2 shadow-sm" onClick={() => navigate('/courses')}>
                                ← Back
                            </button>
                            <span className="badge bg-primary rounded-pill px-3 py-2">
                                {currentSlide + 1} / {lesson.slides.length}
                            </span>
                        </div>
                        <div className="progress" style={{ height: '8px', borderRadius: '10px', backgroundColor: '#e0e7ff' }}>
                            <div className="progress-bar bg-primary"
                                 style={{ width: `${progress}%`, transition: 'width 0.5s ease' }}></div>
                        </div>
                    </div>

                    <div className="row justify-content-center">
                        <div className="col-12 col-md-10 col-lg-8 col-xl-7">
                            <div className="text-center mb-4">
                                <ElephantMascot />
                            </div>

                            <div className="card border-0 shadow-lg rounded-4 overflow-hidden"
                                 style={{ animation: 'fadeIn 0.5s ease-in' }}>
                                {/* Image Section */}
                                {slide.imageUrl && (
                                    <div className="position-relative overflow-hidden" style={{ height: '250px', backgroundColor: '#f8fafc' }}>
                                        <img src={slide.imageUrl}
                                             alt={slide.english}
                                             className="w-100 h-100 object-fit-cover"
                                             onError={(e) => {
                                                 e.currentTarget.style.display = 'none';
                                                 e.currentTarget.parentElement!.style.height = '0px';
                                             }} />
                                    </div>
                                )}

                                <div className="card-body p-4 p-md-5">
                                    {/* Main Word */}
                                    <div className="text-center mb-4">
                                        <div className="d-flex align-items-center justify-content-center gap-3 mb-3">
                                            <h1 className="display-3 fw-bold mb-0" style={{
                                                color: '#3b82f6',
                                                textShadow: '2px 2px 4px rgba(59, 130, 246, 0.1)'
                                            }}>
                                                {slide.venda}
                                            </h1>
                                            <button
                                                className={`btn btn-primary rounded-circle shadow-lg p-3 ${isPlayingAudio ? 'pulse-animation' : ''}`}
                                                onClick={() => speakVenda(slide.venda)}
                                                disabled={isPlayingAudio}
                                                style={{
                                                    width: '60px',
                                                    height: '60px',
                                                    transition: 'all 0.3s ease',
                                                    opacity: isPlayingAudio ? 0.7 : 1
                                                }}>
                                                <span style={{ fontSize: '1.5rem' }}>🔊</span>
                                            </button>
                                        </div>
                                        <h4 className="text-muted fw-normal">{slide.english}</h4>
                                    </div>

                                    {/* Practice Recording */}
                                    <div className="bg-light p-4 rounded-4 mb-4 border border-2 border-dashed">
                                        <div className="d-flex flex-column flex-sm-row align-items-center justify-content-center gap-3">
                                            {!isRecording ? (
                                                <button
                                                    className="btn btn-danger rounded-pill px-4 py-2 fw-bold shadow-sm d-flex align-items-center gap-2"
                                                    onClick={startRecording}
                                                    style={{ transition: 'all 0.3s ease' }}>
                                                    <span style={{ fontSize: '1.2rem' }}>🎤</span>
                                                    Practice Speaking
                                                </button>
                                            ) : (
                                                <button
                                                    className="btn btn-danger rounded-pill px-4 py-2 fw-bold d-flex align-items-center gap-2"
                                                    onClick={stopRecording}
                                                    style={{ animation: 'pulse 1.5s ease-in-out infinite' }}>
                                                    <span style={{ fontSize: '1.2rem' }}>⏹️</span>
                                                    Stop Recording
                                                </button>
                                            )}
                                        </div>

                                        {audioUrl && !audioLoadError && (
                                            <div className="mt-3 p-3 bg-white rounded-3 shadow-sm">
                                                <p className="text-muted small mb-2 text-center">
                                                    <strong>✓ Recording saved!</strong> Listen to your pronunciation:
                                                </p>
                                                <audio
                                                    ref={audioRef}
                                                    src={audioUrl}
                                                    controls
                                                    className="w-100"
                                                    style={{ height: '40px' }}
                                                    onError={() => setAudioLoadError(true)}
                                                    onLoadedData={() => setAudioLoadError(false)} />
                                            </div>
                                        )}

                                        {audioLoadError && (
                                            <div className="mt-3 alert alert-warning small mb-0">
                                                Unable to play recording. Try recording again.
                                            </div>
                                        )}
                                    </div>

                                    {/* Context */}
                                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-3 border border-warning"
                                         style={{ backgroundColor: '#fef3c7', borderColor: '#fbbf24' }}>
                                        <div className="d-flex align-items-start gap-2">
                                            <span style={{ fontSize: '1.3rem' }}>💡</span>
                                            <p className="mb-0 text-secondary fst-italic" style={{ lineHeight: '1.7' }}>
                                                "{slide.context}"
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Navigation Footer */}
                                <div className="card-footer bg-white border-0 p-4">
                                    <div className="d-flex justify-content-between align-items-center gap-3">
                                        <button
                                            className="btn btn-outline-secondary rounded-pill px-4 py-2 fw-bold"
                                            disabled={currentSlide === 0}
                                            onClick={() => {
                                                setCurrentSlide(prev => prev - 1);
                                                setAudioUrl(null);
                                            }}
                                            style={{ minWidth: '120px' }}>
                                            ← Murahu
                                        </button>

                                        {currentSlide + 1 < lesson.slides.length ? (
                                            <button
                                                className="btn btn-primary rounded-pill px-4 py-2 fw-bold shadow"
                                                onClick={() => {
                                                    setCurrentSlide(prev => prev + 1);
                                                    setAudioUrl(null);
                                                }}
                                                style={{ minWidth: '120px' }}>
                                                Phanda →
                                            </button>
                                        ) : (
                                            <button
                                                className="btn btn-success rounded-pill px-4 py-2 fw-bold shadow-lg d-flex align-items-center gap-2"
                                                onClick={() => setGameState('QUIZ')}
                                                style={{ minWidth: '150px' }}>
                                                Start Quiz 🚀
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (gameState === 'QUIZ') {
        const q = lesson.questions[currentQIndex];
        const progress = ((currentQIndex + 1) / lesson.questions.length) * 100;

        return (
            <div className="min-vh-100 bg-gradient-to-br from-green-50 to-emerald-50"
                 style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #d1fae5 100%)' }}>
                <div className="container py-4 py-md-5">
                    <div className="row justify-content-center">
                        <div className="col-12 col-md-10 col-lg-8">
                            <div className="text-center mb-4">
                                <ElephantMascot />
                            </div>

                            {/* Progress Bar */}
                            <div className="mb-4">
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <span className="text-muted fw-bold">Question {currentQIndex + 1} of {lesson.questions.length}</span>
                                    <span className="badge bg-success rounded-pill px-3 py-2">
                                        Score: {score} LP
                                    </span>
                                </div>
                                <div className="progress" style={{ height: '10px', borderRadius: '10px', backgroundColor: '#d1fae5' }}>
                                    <div className="progress-bar bg-success"
                                         style={{
                                             width: `${progress}%`,
                                             transition: 'width 0.5s ease',
                                             boxShadow: '0 0 10px rgba(34, 197, 94, 0.5)'
                                         }}></div>
                                </div>
                            </div>

                            <div className="card border-0 shadow-lg rounded-4 overflow-hidden">
                                <div className="card-body p-4 p-md-5">
                                    <h3 className="fw-bold mb-4 text-center" style={{ fontSize: '1.5rem', lineHeight: '1.6' }}>
                                        {q.question}
                                    </h3>

                                    {!showExplanation ? (
                                        <div className="d-grid gap-3">
                                            {q.options.map((opt: string, idx: number) => {
                                                let buttonClass = "btn btn-lg py-3 fw-bold rounded-4 border-2";
                                                let buttonStyle: any = {
                                                    transition: 'all 0.3s ease',
                                                    position: 'relative',
                                                    overflow: 'hidden'
                                                };

                                                if (selectedOption === opt) {
                                                    if (opt === q.correctAnswer) {
                                                        buttonClass += " btn-success shadow-lg";
                                                        buttonStyle.animation = 'correctAnswer 0.6s ease-in-out';
                                                    } else {
                                                        buttonClass += " btn-danger shadow-lg";
                                                        buttonStyle.animation = 'wrongAnswer 0.6s ease-in-out';
                                                    }
                                                } else if (selectedOption && opt === q.correctAnswer) {
                                                    buttonClass += " btn-success";
                                                } else {
                                                    buttonClass += " btn-outline-primary";
                                                }

                                                return (
                                                    <button
                                                        key={opt}
                                                        className={buttonClass}
                                                        style={buttonStyle}
                                                        onClick={() => handleAnswerSelection(opt, q.correctAnswer)}
                                                        disabled={!!selectedOption}>
                                                        <span className="d-flex align-items-center justify-content-between">
                                                            <span>{opt}</span>
                                                            {selectedOption === opt && (
                                                                <span style={{ fontSize: '1.5rem' }}>
                                                                    {opt === q.correctAnswer ? '✓' : '✗'}
                                                                </span>
                                                            )}
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="card border-danger border-2 shadow-lg p-4 bg-light rounded-4"
                                             style={{ animation: 'shakeX 0.6s ease-in-out' }}>
                                            <div className="text-center mb-3">
                                                <div className="display-4 mb-2">💡</div>
                                                <h5 className="text-danger fw-bold">Ndi khou humbela pfarelo!</h5>
                                                <p className="text-muted mb-0 small">(Don't worry, let's learn!)</p>
                                            </div>
                                            <div className="bg-white p-3 rounded-3 mb-3">
                                                <p className="mb-0 text-secondary">{q.explanation}</p>
                                            </div>
                                            <button
                                                className="btn btn-primary w-100 py-3 rounded-pill fw-bold shadow"
                                                onClick={nextQuestion}
                                                style={{ transition: 'all 0.3s ease' }}>
                                                I got it, next! →
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-vh-100 d-flex align-items-center justify-content-center"
             style={{ background: 'linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%)' }}>
            {showLevelUp && <LevelUpModal level={newLevelReached} onClose={() => setShowLevelUp(false)} />}

            <div className="container py-5">
                <div className="row justify-content-center">
                    <div className="col-12 col-md-8 col-lg-6">
                        <div className="card border-0 shadow-lg p-5 rounded-5 text-center"
                             style={{ animation: 'bounceIn 0.8s ease-out' }}>
                            <div className="display-1 mb-4" style={{
                                fontSize: '6rem',
                                animation: 'bounce 2s ease-in-out infinite'
                            }}>
                                🐘🏅
                            </div>
                            <h2 className="fw-bold mb-2" style={{ fontSize: '2.5rem' }}>Ro fhedza!</h2>
                            <p className="text-muted mb-4">Congratulations on completing this lesson!</p>

                            <div className="bg-gradient-to-r from-amber-100 to-orange-100 p-5 rounded-4 mb-4 shadow-sm"
                                 style={{ backgroundColor: '#fed7aa' }}>
                                <h5 className="mb-2 text-muted fw-normal">You earned</h5>
                                <div className="display-3 fw-bold mb-2" style={{
                                    background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent'
                                }}>
                                    +{score} LP
                                </div>
                                <p className="text-muted small mb-0">Learning Points</p>
                            </div>

                            <div className="d-grid gap-3">
                                <button
                                    className="btn btn-primary btn-lg px-5 py-3 rounded-pill shadow-lg fw-bold"
                                    onClick={() => navigate('/courses')}
                                    style={{ transition: 'all 0.3s ease' }}>
                                    Back to Courses 📚
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GameRoom;
