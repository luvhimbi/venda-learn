import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Hash, CheckCircle2, XCircle } from 'lucide-react';
import { progressTracker } from '../../../services/progressTracker';
import { fetchGameContentByLevel, fetchUserData } from '../../../services/dataCache';
import { useVisualJuice } from '../../../hooks/useVisualJuice';
import Mascot from '../../../features/gamification/components/Mascot';

interface LearningChallengeModalProps {
    isOpen: boolean;
    onSuccess: () => void;
    onFailure: () => void;
    languageId?: string;
}

type ChallengeType = 'quiz' | 'scramble';

const CHIP_COLORS = [
    { bg: '#EFF6FF', border: '#93C5FD', shadow: '#60A5FA', text: '#1E40AF' },
    { bg: '#FEF3C7', border: '#FCD34D', shadow: '#F59E0B', text: '#92400E' },
    { bg: '#ECFDF5', border: '#6EE7B7', shadow: '#34D399', text: '#065F46' },
    { bg: '#FDF2F8', border: '#F9A8D4', shadow: '#EC4899', text: '#9D174D' },
    { bg: '#F5F3FF', border: '#C4B5FD', shadow: '#8B5CF6', text: '#5B21B6' },
];

const LearningChallengeModal: React.FC<LearningChallengeModalProps> = ({ isOpen, onSuccess, onFailure, languageId = 'venda' }) => {
    const { playCorrect, playWrong, playClick, triggerShake } = useVisualJuice();
    const [loading, setLoading] = useState(true);
    const [challengeType, setChallengeType] = useState<ChallengeType>('quiz');
    const [challengeData, setChallengeData] = useState<any>(null);
    const [answerStatus, setAnswerStatus] = useState<'correct' | 'wrong' | null>(null);
    
    // Quiz State
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    
    // Scramble State
    const [scrambledWords, setScrambledWords] = useState<any[]>([]);
    const [answerZone, setAnswerZone] = useState<any[]>([]);

    const loadChallenge = useCallback(async () => {
        setLoading(true);
        setAnswerStatus(null);
        setSelectedOption(null);
        setAnswerZone([]);
        setScrambledWords([]);
        
        try {
            const uData = await fetchUserData();
            const level = uData?.gameLevels?.sentence || 1;
            const lang = uData?.preferredLanguageId || languageId;

            // Randomly pick challenge type
            const type: ChallengeType = Math.random() > 0.5 ? 'quiz' : 'scramble';
            setChallengeType(type);

            if (type === 'quiz') {
                const questions = await progressTracker.generateWeakWordQuiz(1);
                if (questions.length > 0) {
                    setChallengeData(questions[0]);
                } else {
                    // Fallback if no weak words: fetch regular sentence and use it for scramble
                    setChallengeType('scramble');
                    const sentences = await fetchGameContentByLevel("sentencePuzzles", lang, level);
                    if (sentences.length > 0) {
                        const s = sentences[Math.floor(Math.random() * sentences.length)];
                        setupScramble(s);
                    }
                }
            } else {
                const sentences = await fetchGameContentByLevel("sentencePuzzles", lang, level);
                if (sentences.length > 0) {
                    const s = sentences[Math.floor(Math.random() * sentences.length)];
                    setupScramble(s);
                } else {
                    // Fallback to quiz if no sentences
                    setChallengeType('quiz');
                    const questions = await progressTracker.generateWeakWordQuiz(1);
                    if (questions.length > 0) {
                        setChallengeData(questions[0]);
                    }
                }
            }
        } catch (error) {
            console.error("Failed to load challenge:", error);
            onSuccess(); // Fail safe: just let them move if we can't load a challenge
        } finally {
            setLoading(false);
        }
    }, [languageId, onSuccess]);

    const setupScramble = (s: any) => {
        const words = s.words || [];
        setChallengeData(s);
        const wordsWithIds = words.map((w: string, i: number) => ({
            id: `${w}-${i}-${Math.random()}`,
            text: w,
            colorIdx: i % CHIP_COLORS.length
        }));
        setScrambledWords([...wordsWithIds].sort(() => 0.5 - Math.random()));
    };

    useEffect(() => {
        if (isOpen) {
            loadChallenge();
        }
    }, [isOpen, loadChallenge]);

    // Quiz Actions
    const handleQuizSelect = (opt: string) => {
        if (selectedOption || answerStatus) return;
        setSelectedOption(opt);
        const isCorrect = opt === challengeData.correctAnswer;
        if (isCorrect) {
            playCorrect();
            setAnswerStatus('correct');
            setTimeout(onSuccess, 1000);
        } else {
            playWrong();
            setAnswerStatus('wrong');
            triggerShake('challenge-card');
            setTimeout(onFailure, 1200);
        }
    };

    // Scramble Actions
    const handleWordClick = (item: any, from: 'pool' | 'answer') => {
        playClick();
        if (answerStatus) return;
        if (from === 'pool') {
            setScrambledWords(prev => prev.filter(w => w.id !== item.id));
            setAnswerZone(prev => [...prev, item]);
        } else {
            setAnswerZone(prev => prev.filter(w => w.id !== item.id));
            setScrambledWords(prev => [...prev, item]);
        }
    };

    const checkScramble = () => {
        const currentSentence = answerZone.map(w => w.text).join(' ').trim();
        const correctSentence = challengeData.words.join(' ').trim();

        if (currentSentence === correctSentence) {
            playCorrect();
            setAnswerStatus('correct');
            setTimeout(onSuccess, 1000);
        } else {
            playWrong();
            setAnswerStatus('wrong');
            triggerShake('challenge-card');
            setTimeout(onFailure, 1200);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
                style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 3000, backdropFilter: 'blur(4px)' }}
            >
                <motion.div
                    id="challenge-card"
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    className="brutalist-card bg-theme-surface border-4 border-theme-main p-4 w-100 shadow-action text-theme-main overflow-hidden"
                    style={{ maxWidth: '500px', position: 'relative' }}
                >
                    {/* Header */}
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <div className="d-flex align-items-center gap-2">
                            {challengeType === 'quiz' ? <Target className="text-danger" size={20} /> : <Hash className="text-warning" size={20} />}
                            <h3 className="fw-black mb-0 ls-tight uppercase small">
                                {challengeType === 'quiz' ? 'VOCAB CHALLENGE' : 'GRAMMAR CHALLENGE'}
                            </h3>
                        </div>
                        <div className="badge bg-dark text-white smallest fw-black px-2 py-1 uppercase">Move Verification</div>
                    </div>

                    {loading ? (
                        <div className="py-5 text-center">
                            <Mascot width="80px" height="80px" mood="excited" />
                            <p className="smallest fw-black text-theme-muted uppercase mt-3 ls-1">Preparing challenge...</p>
                        </div>
                    ) : (
                        <div className="animate__animated animate__fadeIn">
                            {challengeType === 'quiz' ? (
                                <div className="text-center">
                                    <h4 className="fw-black mb-4 uppercase ls-tight" style={{ fontSize: '1.2rem' }}>
                                        {challengeData.question}
                                    </h4>
                                    <div className="d-grid gap-2">
                                        {challengeData.options.map((opt: string) => {
                                            const isSelected = selectedOption === opt;
                                            const isCorrect = opt === challengeData.correctAnswer;
                                            let cls = 'btn-game-white border-3';
                                            if (isSelected) {
                                                cls = isCorrect ? 'btn-success border-success text-white' : 'btn-danger border-danger text-white';
                                            } else if (selectedOption && isCorrect) {
                                                cls = 'btn-success border-success text-white opacity-50';
                                            }
                                            return (
                                                <button
                                                    key={opt}
                                                    onClick={() => handleQuizSelect(opt)}
                                                    disabled={!!selectedOption}
                                                    className={`btn py-3 fw-black rounded-3 transition-all ${cls}`}
                                                >
                                                    {opt}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center">
                                    <p className="smallest fw-black text-theme-muted uppercase mb-2">Translate this sentence</p>
                                    <h4 className="fw-black mb-4 ls-tight" style={{ fontSize: '1.2rem' }}>
                                        "{challengeData.translation}"
                                    </h4>
                                    
                                    {/* Answer Zone */}
                                    <div className={`brutalist-card--sm bg-theme-base p-3 mb-4 d-flex flex-wrap justify-content-center gap-2 min-vh-10 border-2 dashed border-theme-muted ${answerStatus === 'wrong' ? 'border-danger' : ''}`}>
                                        {answerZone.length === 0 ? (
                                            <span className="smallest fw-bold text-theme-muted opacity-50 uppercase">Tap words to build translation</span>
                                        ) : (
                                            answerZone.map(item => (
                                                <button
                                                    key={item.id}
                                                    onClick={() => handleWordClick(item, 'answer')}
                                                    className="btn btn-sm fw-black rounded-pill border-2 shadow-action-sm px-3"
                                                    style={{ backgroundColor: CHIP_COLORS[item.colorIdx].bg, color: CHIP_COLORS[item.colorIdx].text, borderColor: CHIP_COLORS[item.colorIdx].border }}
                                                >
                                                    {item.text}
                                                </button>
                                            ))
                                        )}
                                    </div>

                                    {/* Pool */}
                                    <div className="d-flex flex-wrap justify-content-center gap-2 mb-4">
                                        {scrambledWords.map(item => (
                                            <button
                                                key={item.id}
                                                onClick={() => handleWordClick(item, 'pool')}
                                                className="btn btn-sm fw-black rounded-pill border-2 shadow-action-sm px-3"
                                                style={{ backgroundColor: CHIP_COLORS[item.colorIdx].bg, color: CHIP_COLORS[item.colorIdx].text, borderColor: CHIP_COLORS[item.colorIdx].border }}
                                            >
                                                {item.text}
                                            </button>
                                        ))}
                                    </div>

                                    <button 
                                        onClick={checkScramble}
                                        disabled={answerZone.length === 0 || !!answerStatus}
                                        className="btn btn-game btn-game-primary w-100 py-3 fw-black uppercase"
                                    >
                                        CHECK ANSWER
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Status Feedback */}
                    {answerStatus && (
                        <motion.div 
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className={`position-absolute bottom-0 start-0 w-100 p-3 text-center text-white fw-black uppercase ls-1 ${answerStatus === 'correct' ? 'bg-success' : 'bg-danger'}`}
                        >
                            {answerStatus === 'correct' ? (
                                <div className="d-flex align-items-center justify-content-center gap-2">
                                    <CheckCircle2 size={20} /> MOVE ACCEPTED!
                                </div>
                            ) : (
                                <div className="d-flex align-items-center justify-content-center gap-2">
                                    <XCircle size={20} /> WRONG! MOVE REJECTED
                                </div>
                            )}
                        </motion.div>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default LearningChallengeModal;
