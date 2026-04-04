
const toDate = (val) => {
    if (!val) return null;
    return new Date(val);
};

const toMidnight = (d) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

const updateStreakLogic = (data, now) => {
    const todayMid = toMidnight(now);
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    let activityHistory = [...(data.activityHistory || [])];
    let frozenDays = [...(data.frozenDays || [])];
    
    // THE BUG IS LIKELY HERE:
    // If we call updateStreak twice on the same day, does it cause issues?
    if (!activityHistory.includes(todayStr)) {
        activityHistory = [todayStr, ...activityHistory].slice(0, 90);
    }

    let newStreak = data.streak || 0;
    let isNewDay = false;
    let freezeUsed = false;
    let wasReset = false;
    let streakFreezes = data.streakFreezes || 0;

    const lastActivityDate = toDate(data.lastActivity) || toDate(data.lastLogin);

    if (lastActivityDate) {
        const lastMid = toMidnight(lastActivityDate);
        const diffInDays = Math.round((todayMid - lastMid) / (1000 * 60 * 60 * 24));

        if (diffInDays === 1) {
            newStreak = (data.streak || 0) + 1;
            isNewDay = true;
        } else if (diffInDays > 1) {
            const missedDays = diffInDays - 1;
            if (streakFreezes >= missedDays) {
                streakFreezes -= missedDays;
                for (let i = 1; i <= missedDays; i++) {
                    const fDate = new Date(lastMid);
                    fDate.setDate(fDate.getDate() + i);
                    const fStr = `${fDate.getFullYear()}-${String(fDate.getMonth() + 1).padStart(2, '0')}-${String(fDate.getDate()).padStart(2, '0')}`;
                    if (!frozenDays.includes(fStr)) {
                        frozenDays.push(fStr);
                    }
                }
                freezeUsed = true;
                isNewDay = true;
                newStreak = (data.streak || 0) + 1;
            } else {
                streakFreezes = 0;
                newStreak = 1;
                isNewDay = true;
                wasReset = true;
            }
        } else if (diffInDays === 0) {
            isNewDay = false;
            newStreak = data.streak || 0;
        }
    } else {
        newStreak = 1;
        isNewDay = true;
    }

    return { 
        streak: newStreak, 
        isNewDay, 
        freezeUsed, 
        wasReset, 
        activityHistory, 
        frozenDays,
        lastActivity: now.toISOString()
    };
};

// Case 1: Gap from Wednesday to Saturday (0 streak, 0 freezes)
const user1 = {
    streak: 0,
    streakFreezes: 0,
    lastActivity: "2026-03-25T10:00:00Z", // Wednesday
    activityHistory: ["2026-03-25"]
};
const now1 = new Date("2026-03-28T03:55:00Z"); // Saturday morning
const res1 = updateStreakLogic(user1, now1);
console.log("Test 1 (Wait -> Play Saturday):", res1.streak === 1 && res1.activityHistory.includes("2026-03-28") ? "PASSED" : "FAILED", res1.activityHistory);

// Case 2: Playing AGAIN on Saturday (Streak already 1)
const user2 = {
    ...user1,
    streak: res1.streak,
    lastActivity: res1.lastActivity,
    activityHistory: res1.activityHistory
};
const res2 = updateStreakLogic(user2, new Date("2026-03-28T10:00:00Z")); // Same day later
console.log("Test 2 (Play AGAIN same day):", res2.streak === 1 && res2.activityHistory.includes("2026-03-28") ? "PASSED" : "FAILED", res2.streak, res2.activityHistory);

// Case 3: Gap with freeze (streak preserved)
const user3 = {
    streak: 5,
    streakFreezes: 2,
    lastActivity: "2026-03-25T10:00:00Z",
    activityHistory: ["2026-03-25"]
};
const res3 = updateStreakLogic(user3, now1);
console.log("Test 3 (Gap with freeze):", res3.streak === 6 && res3.freezeUsed === true ? "PASSED" : "FAILED", res3.streak, res3.frozenDays);
