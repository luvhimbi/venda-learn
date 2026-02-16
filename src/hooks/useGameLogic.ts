import { useState, useEffect, useCallback } from 'react';
import { calculateScore, CONSOLATION_POINTS, type Difficulty, type ScoreResult } from '../services/scoringUtils';

interface GameLogicOptions {
    difficulty: Difficulty;
    totalQuestions: number;
    onFinish: (finalScore: number, finalCorrect: number, totalDuration: number) => void;
    onCorrect?: (result: ScoreResult, newScore: number, newCorrect: number, nextIndex: number) => void;
    onWrong?: () => void;
    onConsolation?: (newScore: number) => void;
}

export const useGameLogic = ({
    difficulty,
    totalQuestions,
    onFinish,
    onCorrect,
    onWrong,
    onConsolation
}: GameLogicOptions) => {
    const [currentQIndex, setCurrentQIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [correctCount, setCorrectCount] = useState(0);
    const [streak, setStreak] = useState(0);
    const [sessionStartTime] = useState(Date.now());
    const [questionStartTime, setQuestionStartTime] = useState(Date.now());
    const [lastScoreResult, setLastScoreResult] = useState<ScoreResult | null>(null);
    const [answerStatus, setAnswerStatus] = useState<'correct' | 'wrong' | null>(null);
    const [showExplanation, setShowExplanation] = useState(false);
    const [scoreBreakdown, setScoreBreakdown] = useState({
        base: 0,
        speed: 0,
        streakBonus: 0,
        consolation: 0
    });

    // Reset question timer when moving to a new question
    useEffect(() => {
        setQuestionStartTime(Date.now());
    }, [currentQIndex]);

    const awardCorrectAnswer = useCallback(() => {
        const elapsed = Date.now() - questionStartTime;
        const result = calculateScore(difficulty, streak, elapsed);

        const newScore = score + result.total;
        const newCorrect = correctCount + 1;
        const newStreak = streak + 1;
        const nextIdx = currentQIndex + 1;

        setScore(newScore);
        setCorrectCount(newCorrect);
        setStreak(newStreak);
        setLastScoreResult(result);
        setAnswerStatus('correct');

        setScoreBreakdown(prev => ({
            ...prev,
            base: prev.base + result.base,
            speed: prev.speed + result.speedBonus,
            streakBonus: prev.streakBonus + Math.round((result.base + result.speedBonus) * (result.streakMultiplier - 1)),
        }));

        if (onCorrect) {
            onCorrect(result, newScore, newCorrect, nextIdx);
        }

        setTimeout(() => moveNext(), 1200);
    }, [difficulty, streak, questionStartTime, score, correctCount, currentQIndex, onCorrect]);

    const awardConsolation = useCallback(() => {
        const newScore = score + CONSOLATION_POINTS;
        setScore(newScore);
        setScoreBreakdown(prev => ({
            ...prev,
            consolation: prev.consolation + CONSOLATION_POINTS
        }));

        if (onConsolation) {
            onConsolation(newScore);
        }
    }, [score, onConsolation]);

    const handleCorrect = useCallback(() => {
        awardCorrectAnswer();
    }, [awardCorrectAnswer]);

    const handleWrong = useCallback(() => {
        setAnswerStatus('wrong');
        setStreak(0);
        if (onWrong) onWrong();
        setTimeout(() => setShowExplanation(true), 600);
    }, [onWrong]);

    const moveNext = useCallback(() => {
        setAnswerStatus(null);
        setShowExplanation(false);
        setLastScoreResult(null);

        const nextIdx = currentQIndex + 1;
        if (nextIdx < totalQuestions) {
            setCurrentQIndex(nextIdx);
        } else {
            const totalDuration = Math.floor((Date.now() - sessionStartTime) / 1000);
            onFinish(score, correctCount, totalDuration);
        }
    }, [currentQIndex, totalQuestions, score, correctCount, onFinish, sessionStartTime]);

    const reset = useCallback(() => {
        setCurrentQIndex(0);
        setScore(0);
        setCorrectCount(0);
        setStreak(0);
        setAnswerStatus(null);
        setShowExplanation(false);
        setScoreBreakdown({ base: 0, speed: 0, streakBonus: 0, consolation: 0 });
    }, []);

    return {
        currentQIndex,
        setCurrentQIndex,
        score,
        setScore,
        correctCount,
        setCorrectCount,
        streak,
        setStreak,
        lastScoreResult,
        answerStatus,
        setAnswerStatus,
        showExplanation,
        setShowExplanation,
        scoreBreakdown,
        handleCorrect,
        handleWrong,
        awardConsolation,
        moveNext,
        reset
    };
};
