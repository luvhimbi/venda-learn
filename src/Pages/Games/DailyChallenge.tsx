import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, Trophy, Loader2, ArrowRight, Star, BookOpen } from 'lucide-react';
import MultipleChoiceQuestion from '../../components/Game/MultipleChoiceQuestion';
import TrueFalseQuestion from '../../components/Game/TrueFalseQuestion';
import FillBlankQuestion from '../../components/Game/FillBlankQuestion';
import MatchPairsQuestion from '../../components/Game/MatchPairsQuestion';
import ListenChooseQuestion from '../../components/Game/ListenChooseQuestion';
import { fetchDailyChallenge } from '../../services/dataCache';
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

    const speakVenda = (text: string) => {
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

    const finishGame = () => {
        setIsFinished(true);
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
            <div className="d-flex justify-content-center align-items-center vh-100">
                <Loader2 className="animate-spin text-warning" size={48} />
            </div>
        );
    }

    if (isFinished) {
        return (
            <div className="container min-vh-100 d-flex flex-column justify-content-center align-items-center text-center p-4">
                <div className="bg-warning text-dark p-4 rounded-circle mb-4 shadow-lg animate__animated animate__bounceIn">
                    <Trophy size={64} />
                </div>
                <h1 className="display-4 fw-bold mb-3">Daily Challenge Complete!</h1>
                <p className="lead mb-5 text-muted">You scored {score} out of {questions.length}</p>

                <div className="card border-0 shadow-sm p-4 w-100" style={{ maxWidth: '400px' }}>
                    <div className="progress mb-3" style={{ height: '20px' }}>
                        <div className="progress-bar bg-warning" role="progressbar"
                            style={{ width: `${(score / questions.length) * 100}%` }}>
                        </div>
                    </div>
                    <p className="small text-muted mb-4 d-flex align-items-center justify-content-center gap-2">
                        {score === questions.length ? <span><Star size={14} className="text-warning" fill="currentColor" /> Perfect score!</span> :
                            score > questions.length * 0.7 ? <span><CheckCircle size={14} className="text-success" /> Great job! Keep it up!</span> :
                                <span><BookOpen size={14} className="text-muted" /> Good practice! Come back tomorrow!</span>}
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
            <div className="d-flex flex-column justify-content-center align-items-center vh-100 text-center p-4">
                <h2 className="fw-bold">No Daily Challenge Available</h2>
                <p className="text-muted">Check back later or try again.</p>
                <button onClick={() => navigate(-1)} className="btn btn-primary mt-3">Go Back</button>
            </div>
        );
    }

    const currentQ = questions[currentIndex];
    return (
        <div className="min-vh-100 bg-light d-flex flex-column">
            {/* Header */}
            <header className="bg-white border-bottom p-3 sticky-top shadow-sm z-3">
                <div className="container max-w-lg d-flex align-items-center justify-content-between">
                    <button onClick={() => navigate(-1)} className="btn btn-link text-dark p-0">
                        <ArrowLeft size={24} />
                    </button>
                    <div className="flex-grow-1 mx-4 text-center">
                        <h6 className="fw-bold mb-0 ls-1 small text-uppercase text-muted">Daily Challenge</h6>
                    </div>
                    <div className="badge bg-warning text-dark pill px-3 py-2 fw-bold shadow-sm">
                        {currentIndex + 1}/{questions.length}
                    </div>
                </div>
            </header>

            {/* Game Content */}
            <main className="flex-grow-1 d-flex flex-column justify-content-center p-3 p-md-4">
                <div className="container" style={{ maxWidth: '768px' }}>
                    <div id="dc-card-container" className="card border-0 shadow-lg rounded-4 overflow-hidden animate__animated animate__fadeIn">
                        <div className="card-body p-4 p-md-5">
                            <div className="text-center mb-4">
                                <Mascot width="100px" height="100px" mood={status === 'correct' ? 'excited' : status === 'wrong' ? 'sad' : 'happy'} />
                            </div>
                            <h4 className="fw-bold mb-4 text-center">{currentQ.question}</h4>

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
                                        speakVenda={speakVenda}
                                    />
                                )}
                            </div>

                            {status && (
                                <div className={`alert ${status === 'correct' ? 'alert-success' : 'alert-danger'} d-flex align-items-center gap-3 rounded-4 mb-0 animate__animated animate__fadeInUp`}>
                                    {status === 'correct' ? <CheckCircle size={24} /> : <XCircle size={24} />}
                                    <div>
                                        <h6 className="fw-bold mb-0">{status === 'correct' ? 'Excellent!' : 'So Close!'}</h6>
                                        {status === 'wrong' && (
                                            <div className="mt-2 p-2 bg-white bg-opacity-50 rounded-3">
                                                <p className="small fw-bold mb-1 text-dark border-bottom pb-1">
                                                    Correct answer: <span className="text-success">{
                                                        currentQ.type === 'true-false' 
                                                            ? ((currentQ as any).correctAnswer === true ? 'NGOHO (TRUE)' : 'MAZWIFHI (FALSE)')
                                                            : (currentQ as any).correctAnswer
                                                    }</span>
                                                </p>
                                                {(currentQ as any).explanation && (
                                                    <p className="small mb-0 text-secondary" style={{ lineHeight: '1.4' }}>{(currentQ as any).explanation}</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer / Next Button */}
                        <div className="card-footer bg-white p-3 border-top d-flex justify-content-end">
                            <button
                                onClick={handleNext}
                                disabled={!selectedAnswer}
                                className="btn btn-dark rounded-pill px-4 py-3 fw-bold d-flex align-items-center gap-2 shadow-sm hover-scale transition-all"
                            >
                                {currentIndex === questions.length - 1 ? 'Finish Challenge' : 'Next Question'} <ArrowRight size={18} />
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
