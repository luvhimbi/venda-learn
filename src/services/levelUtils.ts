// src/services/levelUtils.ts

export const getLevelStats = (totalPoints: number = 0) => {
    // Each level requires 200 points
    const POINTS_PER_LEVEL = 200;

    // 1. Calculate Current Level
    // Level 1: 0-199, Level 2: 200-399, etc.
    const currentLevel = Math.floor(totalPoints / POINTS_PER_LEVEL) + 1;

    // 2. Calculate Point Thresholds
    const pointsAtStart = (currentLevel - 1) * POINTS_PER_LEVEL;
    const pointsAtNext = currentLevel * POINTS_PER_LEVEL;

    // 3. Math for the Progress Bar
    const levelRange = POINTS_PER_LEVEL;
    const pointsIntoLevel = totalPoints - pointsAtStart;

    // 4. Percentage Calculation
    const progress = Math.min(100, Math.max(0, Math.round((pointsIntoLevel / levelRange) * 100)));

    return {
        level: currentLevel,
        pointsInCurrentLevel: Math.floor(pointsIntoLevel),
        pointsForNextLevel: levelRange,
        nextLevelThreshold: pointsAtNext,
        progress,
        totalPoints
    };
};

export const getBadgeDetails = (level: number) => {
    if (level >= 50) return { name: "Grandmaster", icon: "bi-stars", color: "#f472b6" }; // Pink/Legendary
    if (level >= 40) return { name: "Supreme Sage", icon: "bi-gem", color: "#fb7185" }; // Rose/Supreme
    if (level >= 30) return { name: "Guardian", icon: "bi-shield-fill-check", color: "#38bdf8" }; // Sky/Guardian
    if (level >= 25) return { name: "Royal King/Queen", icon: "bi-trophy-fill", color: "#f59e0b" }; // Gold/King
    if (level >= 20) return { name: "Noble Chief", icon: "bi-crown-fill", color: "#fbbf24" }; // Amber/Chief
    if (level >= 15) return { name: "Elite Leader", icon: "bi-award-fill", color: "#059669" }; // Emerald/Leader
    if (level >= 10) return { name: "Master Learner", icon: "bi-shield-shaded", color: "#4f46e5" }; // Indigo/Master
    if (level >= 5) return { name: "Language Warrior", icon: "bi-patch-check-fill", color: "#818cf8" }; // Light Indigo/Warrior
    if (level >= 2) return { name: "Apprentice", icon: "bi-book-fill", color: "#10b981" }; // Green/Apprentice
    return { name: "Novice", icon: "bi-seedling", color: "#34d399" }; // Light Green/Novice
};

/**
 * Returns a unique identifier for the current ISO week (e.g., "2024-W12").
 * Used for the Weekly Leaderboard reset.
 */
export const getCurrentWeekIdentifier = (): string => {
    const d = new Date();
    // Copy date so don't modify original
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    // Set to nearest Thursday: current date + 4 - current day number
    // Make Sunday's day number 7
    date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
    // Get first day of year
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    // Calculate full weeks to nearest Thursday
    const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return `${date.getUTCFullYear()}-W${weekNo}`;
};