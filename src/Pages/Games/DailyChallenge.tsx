import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, Trophy, Loader2, ArrowRight, Star, BookOpen } from 'lucide-react';
import MultipleChoiceQuestion from '../../components/Game/MultipleChoiceQuestion';
import TrueFalseQuestion from '../../components/Game/TrueFalseQuestion';
import FillBlankQuestion from '../../components/Game/FillBlankQuestion';
import MatchPairsQuestion from '../../components/Game/MatchPairsQuestion';
import ListenChooseQuestion from '../../components/Game/ListenChooseQuestion';
import { fetchDailyChallenge, awardPoints } from '../../services/dataCache';
import { auth } from '../../services/firebaseConfig';
import type { Question } from '../../types/game';
import { useVisualJuice } from '../../hooks/useVisualJuice';
import Mascot from '../../components/Mascot';

const DailyChallenge: React.FC = () => {
    const navigate = useNavigate();
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<any>(null);
    const [status, setStatus] = useState<'correct' | 'wrong' | null>(null);
    const [isFinished, setIsFinished] = useState(false);
    const { playCorrect, playWrong, triggerShake } = useVisualJuice();

    useEffect(() => {
        loadQuestions();
    }, []);

    const loadQuestions = async () => {
        try {
            const data = await fetchDailyChallenge();
            setQuestions(data);
        } catch (error) {
            console.error("Failed to load daily challenge:", error);
        } finally {
            setLoading(false);
        }
    };

    const speakNative = (text: string) => {
        // Simple fallback to browser speech, or use existing hook if available
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            // Try to find a suitable voice, otherwise default
            // utterance.lang = 've-ZA'; // Venda might not be supported, but we can try
            window.speechSynthesis.speak(utterance);
        }
    };

    const handleAnswer = (answer: any) => {
        if (selectedAnswer) return; // Prevent multiple answers
        setSelectedAnswer(answer);
        const currentQ = questions[currentIndex];
        let isCorrect = false;

        // Check correctness based on type
        if (currentQ.type === 'multiple-choice') {
            isCorrect = answer === (currentQ as any).correctAnswer;
        } else if (currentQ.type === 'listen-and-choose') {
            isCorrect = answer === (currentQ as any).correctAnswer;
        } else if (currentQ.type === 'true-false') {
            isCorrect = answer === (currentQ as any).correctAnswer;
        } else if (currentQ.type === 'fill-in-the-blank') {
            isCorrect = answer.toLowerCase().trim() === (currentQ as any).correctAnswer.toLowerCase().trim();
        } else if (currentQ.type === 'match-pairs') {
            isCorrect = answer === true;
        }

        setStatus(isCorrect ? 'correct' : 'wrong');
        if (isCorrect) {
            setScore(s => s + 1);
            playCorrect();
        } else {
            playWrong();
            triggerShake('dc-card-container');
        }
    };

    const handleNext = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setSelectedAnswer(null);
            setStatus(null);
        } else {
            finishGame();
        }
    };

    const finishGame = async () => {
        setIsFinished(true);
        
        // Save points even if score is zero (to mark as active this week)
        // But score 0 shouldn't necessarily award points unless we want to show they played.
        // awardPoints(score) will handle increments.
        if (auth.currentUser) {
            await awardPoints(score);
        }

        if (score > questions.length * 0.5) {
            const canvas = document.createElement('canvas');
            canvas.style.position = 'fixed';
            canvas.style.top = '0';
            canvas.style.left = '0';
            canvas.style.width = '100vw';
            canvas.style.height = '100vh';
            canvas.style.pointerEvents = 'none';
            canvas.style.zIndex = '9999';
            document.body.appendChild(canvas);

            import('canvas-confetti').then(confetti => {
                const myConfetti = confetti.create(canvas, { resize: true });
                myConfetti({
                    particleCount: 150,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ['#f59e0b', '#fbbf24', '#34d399']
                });
                setTimeout(() => document.body.removeChild(canvas), 5000);
            });
        }
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100 bg-theme-base">
                <Loader2 className="animate-spin text-warning" size={48} />
            </div>
        );
    }

    if (isFinished) {
        return (
            <div className="container-fluid min-vh-100 d-flex flex-column justify-content-center align-items-center text-center p-4 bg-theme-base">
                <div className="bg-warning text-black p-4 rounded-circle mb-4 shadow-lg animate__animated animate__bounceIn border border-theme-main border-4">
                    <Trophy size={64} />
                </div>
                <h1 className="display-4 fw-black mb-3 text-theme-main uppercase ls-tight">CHALLENGE COMPLETE!</h1>
                <p className="lead mb-5 text-theme-muted fw-bold">You scored {score} out of {questions.length}</p>

                <div className="brutalist-card bg-theme-card p-4 w-100 shadow-action-sm border-theme-main" style={{ maxWidth: '400px' }}>
                    <div className="progress mb-3" style={{ height: '20px' }}>
                        <div className="progress-bar bg-warning" role="progressbar"
                            style={{ width: `${(score / questions.length) * 100}%` }}>
                        </div>
                    </div>
                    <p className="small text-theme-muted mb-4 d-flex align-items-center justify-content-center gap-2 fw-bold">
                        {score === questions.length ? <span className="text-warning"><Star size={14} fill="currentColor" /> Perfect score!</span> :
                            score > questions.length * 0.7 ? <span className="text-success"><CheckCircle size={14} /> Great job! Keep it up!</span> :
                                <span className="text-theme-muted"><BookOpen size={14} /> Good practice! Come back tomorrow!</span>}
                    </p>
                    <button onClick={() => navigate('/mitambo')} className="btn-game btn-game-primary w-100 p-4 rounded-4 fw-bold shadow-lg" style={{ fontSize: '1.2rem' }}>
                        Back to Games Hub
                    </button>
                </div>
            </div>
        );
    }

    if (questions.length === 0) {
        return (
            <div className="d-flex flex-column justify-content-center align-items-center vh-100 text-center p-4 bg-theme-base">
                <h2 className="fw-black text-theme-main uppercase ls-tight">NO CHALLENGE YET</h2>
                <p className="text-theme-muted fw-bold">Check back later for today's tasks.</p>
                <button onClick={() => navigate(-1)} className="btn-game btn-game-primary mt-3 px-5 py-3">GO BACK</button>
            </div>
        );
    }

    const currentQ = questions[currentIndex];
    return (
        <div className="min-vh-100 bg-theme-base d-flex flex-column">
            {/* Header */}
            <header className="bg-theme-card border-bottom border-theme-main border-4 p-3 sticky-top shadow-action-sm z-3">
                <div className="container max-w-lg d-flex align-items-center justify-content-between">
                    <button onClick={() => navigate(-1)} className="btn btn-link text-theme-main p-0">
                        <ArrowLeft size={24} />
                    </button>
                    <div className="flex-grow-1 mx-4 text-center">
                        <h6 className="fw-black mb-0 ls-1 smallest uppercase text-theme-muted">Daily Challenge</h6>
                    </div>
                    <div className="badge bg-warning text-black brutalist-card--sm px-3 py-2 fw-black shadow-action-sm border border-theme-main">
                        {currentIndex + 1}/{questions.length}
                    </div>
                </div>
            </header>

            {/* Game Content */}
            <main className="flex-grow-1 d-flex flex-column justify-content-center p-3 p-md-4">
                <div className="container" style={{ maxWidth: '768px' }}>
                    <div id="dc-card-container" className="brutalist-card bg-theme-card overflow-hidden animate__animated animate__fadeIn shadow-action-sm border-theme-main">
                        <div className="card-body p-4 p-md-5">
                            <div className="text-center mb-4">
                                <Mascot width="100px" height="100px" mood={status === 'correct' ? 'excited' : status === 'wrong' ? 'sad' : 'happy'} />
                            </div>
                            <h4 className="fw-black mb-4 text-center text-theme-main uppercase ls-tight">{currentQ.question}</h4>

                            <div className="mb-4" key={currentIndex}>
                                {currentQ.type === 'multiple-choice' && (
                                    <MultipleChoiceQuestion
                                        q={currentQ as any}
                                        selected={selectedAnswer}
                                        status={status}
                                        onSelect={(ans) => handleAnswer(ans)}
                                    />
                                )}
                                {currentQ.type === 'true-false' && (
                                    <TrueFalseQuestion
                                        q={currentQ as any}
                                        selected={selectedAnswer}
                                        status={status}
                                        onSelect={(ans) => handleAnswer(ans)}
                                    />
                                )}
                                {currentQ.type === 'fill-in-the-blank' && (
                                    <FillBlankQuestion
                                        q={currentQ as any}
                                        onSubmit={(ans) => handleAnswer(ans)}
                                        status={status}
                                    />
                                )}
                                {currentQ.type === 'match-pairs' && (
                                    <MatchPairsQuestion
                                        q={currentQ as any}
                                        // MatchPairs is special, it handles its own internal state and returns success on completion
                                        onComplete={(success) => handleAnswer(success)}
                                    />
                                )}
                                {currentQ.type === 'listen-and-choose' && (
                                    <ListenChooseQuestion
                                        q={currentQ as any}
                                        selected={selectedAnswer}
                                        status={status}
                                        onSelect={(ans) => handleAnswer(ans)}
                                        speakNative={speakNative}
                                    />
                                )}
                            </div>

                            {status && (
                                <div className={`alert ${status === 'correct' ? 'alert-success border-success' : 'alert-danger border-danger'} border-2 d-flex align-items-center gap-3 rounded-4 mb-0 animate__animated animate__fadeInUp`}>
                                    {status === 'correct' ? <CheckCircle size={24} /> : <XCircle size={24} />}
                                    <div>
                                        <h6 className="fw-bold mb-0 text-theme-main">{status === 'correct' ? 'Excellent!' : 'So Close!'}</h6>
                                        {status === 'wrong' && (
                                            <div className="mt-2 p-2 bg-theme-base bg-opacity-50 rounded-3">
                                                <p className="small fw-bold mb-1 text-theme-main border-bottom border-theme-soft pb-1">
                                                    Correct answer: <span className="text-success">{
                                                        currentQ.type === 'true-false' 
                                                            ? ((currentQ as any).correctAnswer === true ? 'NGOHO (TRUE)' : 'MAZWIFHI (FALSE)')
                                                            : (currentQ as any).correctAnswer
                                                    }</span>
                                                </p>
                                                {(currentQ as any).explanation && (
                                                    <p className="small mb-0 text-theme-muted fw-bold" style={{ lineHeight: '1.4' }}>{(currentQ as any).explanation}</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer / Next Button */}
                        <div className="bg-theme-card p-4 border-top border-theme-main d-flex justify-content-end">
                            <button
                                onClick={handleNext}
                                disabled={!selectedAnswer}
                                className="btn-game btn-game-primary px-5 py-3 rounded-pill"
                            >
                                {currentIndex === questions.length - 1 ? 'FINISH CHALLENGE' : 'NEXT QUESTION'} <ArrowRight size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            <style>{`
                .hover-scale:hover { transform: scale(1.02); }
                .transition-all { transition: all 0.2s ease; }
            `}</style>
        </div>
    );
};

export default DailyChallenge;
