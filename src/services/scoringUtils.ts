// src/services/scoringUtils.ts
// Centralized scoring engine for the GameRoom quiz.

export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';

export interface ScoreResult {
    base: number;
    speedBonus: number;
    streakMultiplier: number;
    total: number;
    label: string; // e.g. "+18 🔥×1.5"
}

// ---- CONSTANTS ----
const BASE_POINTS: Record<Difficulty, number> = {
    Beginner: 10,
    Intermediate: 15,
    Advanced: 20,
};

const MAX_SPEED_BONUS = 5;        // extra points for answering fast
const SPEED_BONUS_WINDOW_MS = 10_000; // must answer within 10 s to earn any
const FAST_THRESHOLD_MS = 3_000;      // ≤3 s gets full bonus

const STREAK_TIER_1 = 3;   // 3 consecutive → ×1.5
const STREAK_TIER_2 = 5;   // 5 consecutive → ×2.0

export const CONSOLATION_POINTS = 2; // awarded when wrong but user reads explanation

// ---- HELPERS ----

/** Returns a multiplier based on the current streak count. */
const getStreakMultiplier = (streak: number): number => {
    if (streak >= STREAK_TIER_2) return 2.0;
    if (streak >= STREAK_TIER_1) return 1.5;
    return 1.0;
};

/** Returns 0–MAX_SPEED_BONUS based on how quickly the user answered. */
const getSpeedBonus = (elapsedMs: number): number => {
    if (elapsedMs <= FAST_THRESHOLD_MS) return MAX_SPEED_BONUS;
    if (elapsedMs >= SPEED_BONUS_WINDOW_MS) return 0;
    // Linear interpolation between thresholds
    const ratio = 1 - (elapsedMs - FAST_THRESHOLD_MS) / (SPEED_BONUS_WINDOW_MS - FAST_THRESHOLD_MS);
    return Math.round(MAX_SPEED_BONUS * ratio);
};

// ---- MAIN ----

/**
 * Calculate points for a correct answer.
 *
 * @param difficulty   Lesson difficulty ('Easy' | 'Medium' | 'Hard')
 * @param streak       Number of consecutive correct answers *before* this one
 * @param elapsedMs    Milliseconds since the question was shown
 */
export const calculateScore = (
    difficulty: Difficulty,
    streak: number,
    elapsedMs: number,
): ScoreResult => {
    const base = BASE_POINTS[difficulty] ?? BASE_POINTS.Beginner;
    const speedBonus = getSpeedBonus(elapsedMs);
    const streakMultiplier = getStreakMultiplier(streak);

    const raw = (base + speedBonus) * streakMultiplier;
    const total = Math.round(raw);

    // Build a human‑readable label
    const parts: string[] = [`+${total}`];
    if (speedBonus > 0) parts.push('⚡');
    if (streakMultiplier > 1) parts.push(`🔥×${streakMultiplier}`);
    const label = parts.join(' ');

    return { base, speedBonus, streakMultiplier, total, label };
};
