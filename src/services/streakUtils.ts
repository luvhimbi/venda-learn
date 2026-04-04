// src/services/streakUtils.ts
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import { db } from './firebaseConfig';
import dayjs from 'dayjs';

/**
 * Safely converts a Firestore date field to a JS Date.
 * Handles: Firestore Timestamp, ISO string, Date object, or null.
 */
const toDate = (val: any): Date | null => {
    if (!val) return null;
    // Firestore Timestamp has a .toDate() method
    if (typeof val?.toDate === 'function') return val.toDate();
    // ISO string or Date-like
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
};

/**
 * Updates the user's streak based on their last activity date.
 * Called on every app visit. Returns streak count and whether today is a new day.
 * Includes "Streak Freeze" logic and activity history logging.
 */
export const syncStreak = async (uid: string): Promise<{
    streak: number;
    freezeUsed: boolean;
    wasReset: boolean;
}> => {
    try {
        const userRef = doc(db as Firestore, "users", uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) return { streak: 0, freezeUsed: false, wasReset: false };

        const data = userSnap.data();
        const now = dayjs();
        const todayMid = now.startOf('day');

        const lastActivityDate = toDate(data.lastActivity) || toDate(data.lastLogin);
        if (!lastActivityDate) return { streak: 0, freezeUsed: false, wasReset: false };

        const lastMid = dayjs(lastActivityDate).startOf('day');
        const diffInDays = todayMid.diff(lastMid, 'day');

        if (diffInDays <= 1) {
            // No gap yet (either today or yesterday was active)
            return { streak: data.streak || 0, freezeUsed: false, wasReset: false };
        }

        // GAP DETECTED
        let streak = data.streak || 0;
        let streakFreezes = data.streakFreezes || 0;
        let frozenDays = data.frozenDays || [];
        let freezeUsed = false;
        let wasReset = false;

        const missedDays = diffInDays - 1; // Days between last activity and today
        
        if (streakFreezes >= missedDays) {
            // Use freezes to bridge the gap
            streakFreezes -= missedDays;
            for (let i = 1; i <= missedDays; i++) {
                const fStr = lastMid.add(i, 'day').format('YYYY-MM-DD');
                if (!frozenDays.includes(fStr)) {
                    frozenDays.push(fStr);
                }
            }
            freezeUsed = true;
        } else {
            // Not enough freezes -> reset
            streak = 0;
            streakFreezes = 0;
            wasReset = true;
        }

        if (freezeUsed || wasReset) {
            await updateDoc(userRef, {
                streak,
                streakFreezes,
                frozenDays: frozenDays.slice(-90),
            });
        }

        return { streak, freezeUsed, wasReset };
    } catch (error) {
        console.error("Error in syncStreak:", error);
        return { streak: 0, freezeUsed: false, wasReset: false };
    }
};

/**
 * Updates the user's streak based on their last activity date.
 * Called on every app visit. Returns streak count and whether today is a new day.
 * Includes "Streak Freeze" logic and activity history logging.
 */
export const updateStreak = async (uid: string): Promise<{
    streak: number;
    isNewDay: boolean;
    freezeUsed: boolean;
    wasReset: boolean;
}> => {
    try {
        const userRef = doc(db as Firestore, "users", uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            console.error("User document not found");
            return { streak: 0, isNewDay: false, freezeUsed: false, wasReset: false };
        }

        const data = userSnap.data();
        const now = dayjs();
        const todayMid = now.startOf('day');
        const todayStr = now.format('YYYY-MM-DD');

        // Parse last activity
        const lastActivityDate = toDate(data.lastActivity) || toDate(data.lastLogin);

        // Activity History (Limit to 90 days)
        let activityHistory = data.activityHistory || [];
        let frozenDays = data.frozenDays || [];
        if (!activityHistory.includes(todayStr)) {
            activityHistory = [todayStr, ...activityHistory].slice(0, 90);
        }

        let newStreak = data.streak || 0;
        let isNewDay = false;
        let freezeUsed = false;
        let wasReset = false;
        let streakFreezes = data.streakFreezes || 0;

        if (lastActivityDate) {
            const lastMid = dayjs(lastActivityDate).startOf('day');
            const diffInDays = todayMid.diff(lastMid, 'day');

            if (diffInDays === 1) {
                // CONSECUTIVE DAY → increment streak
                newStreak = (data.streak || 0) + 1;
                isNewDay = true;
            } else if (diffInDays > 1) {
                // MISSED DAYS → check for streak freeze
                const missedDays = diffInDays - 1;
                if (streakFreezes >= missedDays) {
                    streakFreezes -= missedDays;
                    
                    // Log the missed days as frozen
                    for (let i = 1; i <= missedDays; i++) {
                        const fStr = lastMid.add(i, 'day').format('YYYY-MM-DD');
                        if (!frozenDays.includes(fStr)) {
                            frozenDays.push(fStr);
                        }
                    }
                    frozenDays = frozenDays.slice(-90); // Limit history

                    freezeUsed = true;
                    isNewDay = true;
                    newStreak = (data.streak || 0) + 1; // Preserve and increment for TODAY's activity
                } else {
                    // BROKEN STREAK → reset to 1 (they were away too long but are here today)
                    streakFreezes = 0;
                    newStreak = 1;
                    isNewDay = true;
                    wasReset = true;
                }
            } else if (diffInDays === 0) {
                // SAME DAY → already count
                isNewDay = false;
                newStreak = data.streak || 0;
            } else {
                newStreak = data.streak || 0;
                isNewDay = false;
            }
        } else {
            // FIRST EVER VISIT
            newStreak = 1;
            isNewDay = true;
        }

        // Final update to Firestore
        const updateData: any = {
            streak: newStreak,
            lastActivity: now.toISOString(),
            activityHistory: activityHistory,
            frozenDays: frozenDays,
            streakFreezes: streakFreezes
        };

        await updateDoc(userRef, updateData);

        return { streak: newStreak, isNewDay, freezeUsed, wasReset };
    } catch (error) {
        console.error("Error updating streak:", error);
        return { streak: 0, isNewDay: false, freezeUsed: false, wasReset: false };
    }
};
