// src/services/levelUtils.ts

export const getLevelStats = (totalPoints: number = 0) => {
    // Constant determines how fast levels are gained
    // 0.1 means Level 10 is reached at 10,000 points
    const constant = 0.1;

    // 1. Calculate Current Level
    // Formula: L = 0.1 * sqrt(points)
    const currentLevel = Math.floor(constant * Math.sqrt(totalPoints)) || 1;

    // 2. Calculate Point Thresholds
    // Points needed for the START of the current level
    const pointsAtStart = Math.pow(currentLevel / constant, 2);

    // Points needed for the NEXT level
    const pointsAtNext = Math.pow((currentLevel + 1) / constant, 2);

    // 3. Math for the Progress Bar
    // Total points required specifically to cross this current level
    const levelRange = pointsAtNext - pointsAtStart;

    // How many points the user has earned BEYOND the start of this level
    const pointsIntoLevel = totalPoints - pointsAtStart;

    // 4. Percentage Calculation
    const progress = Math.min(100, Math.max(0, (pointsIntoLevel / levelRange) * 100));

    return {
        level: currentLevel,
        pointsInCurrentLevel: Math.floor(pointsIntoLevel),
        pointsForNextLevel: Math.floor(levelRange),
        nextLevelThreshold: Math.floor(pointsAtNext),
        progress,
        totalPoints
    };
};

export const getBadgeDetails = (level: number) => {
    if (level >= 20) return { name: "Thovhele", icon: "👑", color: "#f59e0b" }; // Gold
    if (level >= 15) return { name: "Gota", icon: "🐘", color: "#059669" }; // Emerald
    if (level >= 10) return { name: "Vele", icon: "🦁", color: "#4f46e5" }; // Indigo
    if (level >= 5) return { name: "Muhali", icon: "🛡️", color: "#4f46e5" }; // Indigo
    return { name: "Mufunzi", icon: "🌱", color: "#10b981" }; // Green
};