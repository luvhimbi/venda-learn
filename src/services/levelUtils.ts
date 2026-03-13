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
    if (level >= 50) return { name: "Tshivhumbeo", icon: "bi-stars", color: "#f472b6" }; // Pink/Legendary
    if (level >= 40) return { name: "Khosi", icon: "bi-gem", color: "#fb7185" }; // Rose/Supreme
    if (level >= 30) return { name: "Ndumi", icon: "bi-shield-fill-check", color: "#38bdf8" }; // Sky/Guardian
    if (level >= 25) return { name: "Thovhele", icon: "bi-trophy-fill", color: "#f59e0b" }; // Gold/King
    if (level >= 20) return { name: "Vhamusanda", icon: "bi-crown-fill", color: "#fbbf24" }; // Amber/Chief
    if (level >= 15) return { name: "Gota", icon: "bi-award-fill", color: "#059669" }; // Emerald/Leader
    if (level >= 10) return { name: "Vele", icon: "bi-shield-shaded", color: "#4f46e5" }; // Indigo/Master
    if (level >= 5) return { name: "Muhali", icon: "bi-patch-check-fill", color: "#818cf8" }; // Light Indigo/Warrior
    if (level >= 2) return { name: "Mudzulathungo", icon: "bi-book-fill", color: "#10b981" }; // Green/Apprentice
    return { name: "Mugudi", icon: "bi-seedling", color: "#34d399" }; // Light Green/Novice
};