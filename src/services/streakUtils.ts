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
 */
export const updateStreak = async (uid: string): Promise<{ streak: number; isNewDay: boolean }> => {
    try {
        const userRef = doc(db, "users", uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            console.error("User document not found");
            return { streak: 0, isNewDay: false };
        }

        const data = userSnap.data();
        const now = new Date();
        const todayMid = toMidnight(now);

        // Parse last activity — handle Firestore Timestamps, ISO strings, etc.
        const lastActivityDate = toDate(data.lastActivity) || toDate(data.lastLogin);

        let newStreak = data.streak || 0;
        let isNewDay = false;

        if (lastActivityDate) {
            const lastMid = toMidnight(lastActivityDate);
            const diffInDays = Math.round((todayMid - lastMid) / (1000 * 60 * 60 * 24));

            if (diffInDays === 1) {
                // CONSECUTIVE DAY → increment streak
                newStreak = (data.streak || 0) + 1;
                isNewDay = true;
                await updateDoc(userRef, {
                    streak: newStreak,
                    lastActivity: now.toISOString(),
                    lastLogin: now.toISOString()
                });
            } else if (diffInDays > 1) {
                // BROKEN STREAK → reset to 1 (today still counts)
                newStreak = 1;
                isNewDay = true;
                await updateDoc(userRef, {
                    streak: 1,
                    lastActivity: now.toISOString(),
                    lastLogin: now.toISOString()
                });
            } else if (diffInDays === 0) {
                // SAME DAY → don't touch streak, just update timestamp
                isNewDay = false;
                newStreak = data.streak || 0;
                await updateDoc(userRef, {
                    lastActivity: now.toISOString()
                });
            } else {
                // Negative diff (clock skew) → safe no-op
                newStreak = data.streak || 0;
                isNewDay = false;
            }
        } else {
            // FIRST EVER VISIT
            newStreak = 1;
            isNewDay = true;
            await updateDoc(userRef, {
                streak: 1,
                lastActivity: now.toISOString(),
                lastLogin: now.toISOString()
            });
        }

        return { streak: newStreak, isNewDay };
    } catch (error) {
        console.error("Error updating streak:", error);
        return { streak: 0, isNewDay: false };
    }
};