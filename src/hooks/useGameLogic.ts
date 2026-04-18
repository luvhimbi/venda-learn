import { useState, useEffect, useCallback } from 'react';
import { calculateScore, CONSOLATION_POINTS, type Difficulty, type ScoreResult } from '../services/scoringUtils';

interface GameLogicOptions {
    difficulty: Difficulty;
    totalQuestions: number;
    initialState?: {
        currentQIndex?: number;
        score?: number;
        correctCount?: number;
        streak?: number;
        scoreBreakdown?: {
            base: number;
            speed: number;
            streakBonus: number;
            consolation: number;
        };
    };
    onFinish: (finalScore: number, finalCorrect: number, totalDuration: number) => void;
    onCorrect?: (result: ScoreResult, newScore: number, newCorrect: number, nextIndex: number) => void;
    onWrong?: () => void;
    onConsolation?: (newScore: number) => void;
}

export const useGameLogic = ({
    difficulty,
    totalQuestions,
    initialState,
    onFinish,
    onCorrect,
    onWrong,
    onConsolation
}: GameLogicOptions) => {
    const [currentQIndex, setCurrentQIndex] = useState(initialState?.currentQIndex ?? 0);
    const [score, setScore] = useState(initialState?.score ?? 0);
    const [correctCount, setCorrectCount] = useState(initialState?.correctCount ?? 0);
    const [streak, setStreak] = useState(initialState?.streak ?? 0);
    const [sessionStartTime] = useState(Date.now());
    const [questionStartTime, setQuestionStartTime] = useState(Date.now());
    const [lastScoreResult, setLastScoreResult] = useState<ScoreResult | null>(null);
    const [answerStatus, setAnswerStatus] = useState<'correct' | 'wrong' | null>(null);
    const [showExplanation, setShowExplanation] = useState(false);
    const [scoreBreakdown, setScoreBreakdown] = useState(initialState?.scoreBreakdown ?? {
        base: 0,
        speed: 0,
        streakBonus: 0,
        consolation: 0
    });

    // Reset question timer when moving to a new question
    useEffect(() => {
        setQuestionStartTime(Date.now());
    }, [currentQIndex]);

    const reset = useCallback(() => {
        setCurrentQIndex(0);
        setScore(0);
        setCorrectCount(0);
        setStreak(0);
        setAnswerStatus(null);
        setShowExplanation(false);
        setScoreBreakdown({ base: 0, speed: 0, streakBonus: 0, consolation: 0 });
    }, []);

    const moveNext = useCallback((scoreOverride?: number, correctCountOverride?: number) => {
        setAnswerStatus(null);
        setShowExplanation(false);
        setLastScoreResult(null);

        const nextIdx = currentQIndex + 1;
        if (nextIdx < totalQuestions) {
            setCurrentQIndex(nextIdx);
        } else {
            const totalDuration = Math.floor((Date.now() - sessionStartTime) / 1000);
            const finalScore = scoreOverride !== undefined ? scoreOverride : score;
            const finalCorrect = correctCountOverride !== undefined ? correctCountOverride : correctCount;
            onFinish(finalScore, finalCorrect, totalDuration);
        }
    }, [currentQIndex, totalQuestions, score, correctCount, onFinish, sessionStartTime]);

    const awardCorrectAnswer = useCallback(() => {
        const elapsed = Date.now() - questionStartTime;
        const result = calculateScore(difficulty, 0, elapsed);

        const newScore = score + result.total;
        const newCorrect = correctCount + 1;
        const newStreak = 0; // Disabled in-game streaks

        setScore(newScore);
        setCorrectCount(newCorrect);
        setStreak(newStreak);
        setLastScoreResult(result);
        setAnswerStatus('correct');

        setScoreBreakdown(prev => ({
            ...prev,
            base: prev.base + result.base,
            speed: prev.speed + result.speedBonus,
            streakBonus: 0,
        }));

        if (onCorrect) {
            onCorrect(result, newScore, newCorrect, currentQIndex + 1);
        }
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
        return newScore;
    }, [score, onConsolation]);

    const handleCorrect = useCallback(() => {
        awardCorrectAnswer();
        setTimeout(() => setShowExplanation(true), 400);
    }, [awardCorrectAnswer]);

    const handleWrong = useCallback(() => {
        setAnswerStatus('wrong');
        setStreak(0);
        if (onWrong) onWrong();
        setTimeout(() => setShowExplanation(true), 400);
    }, [onWrong]);

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
        setLastScoreResult,
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






