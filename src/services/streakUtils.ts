// src/services/streakUtils.ts
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';

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
 * Gets midnight of a given date (strips time component for accurate day-diff).
 */
const toMidnight = (d: Date): number =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

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
        const userRef = doc(db, "users", uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            console.error("User document not found");
            return { streak: 0, isNewDay: false, freezeUsed: false, wasReset: false };
        }

        const data = userSnap.data();
        const now = new Date();
        const todayMid = toMidnight(now);
        const todayStr = now.toISOString().split('T')[0]; // YYYY-MM-DD

        // Parse last activity
        const lastActivityDate = toDate(data.lastActivity) || toDate(data.lastLogin);

        // Activity History (Limit to 90 days)
        let activityHistory = data.activityHistory || [];
        if (!activityHistory.includes(todayStr)) {
            activityHistory = [todayStr, ...activityHistory].slice(0, 90);
        }

        let newStreak = data.streak || 0;
        let isNewDay = false;
        let freezeUsed = false;
        let wasReset = false;
        let streakFreezes = data.streakFreezes || 0;

        if (lastActivityDate) {
            const lastMid = toMidnight(lastActivityDate);
            const diffInDays = Math.round((todayMid - lastMid) / (1000 * 60 * 60 * 24));

            if (diffInDays === 1) {
                // CONSECUTIVE DAY → increment streak
                newStreak = (data.streak || 0) + 1;
                isNewDay = true;
            } else if (diffInDays > 1) {
                // MISSED DAYS → check for streak freeze
                if (streakFreezes > 0) {
                    streakFreezes -= 1;
                    freezeUsed = true;
                    isNewDay = true;
                    newStreak = (data.streak || 0) + 1; // Protect and increment as if yesterday was done
                } else {
                    // BROKEN STREAK → reset to 1
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
            streakFreezes: streakFreezes
        };

        await updateDoc(userRef, updateData);

        return { streak: newStreak, isNewDay, freezeUsed, wasReset };
    } catch (error) {
        console.error("Error updating streak:", error);
        return { streak: 0, isNewDay: false, freezeUsed: false, wasReset: false };
    }
};
