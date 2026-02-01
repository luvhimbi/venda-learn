// src/services/streakUtils.ts
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';

/**
 * Updates the user's streak based on their last activity date.
 * This should be called whenever a user completes an activity (lesson, story, etc.)
 * 
 * @param uid - User ID
 * @returns Promise<number> - The updated streak count
 */
export const updateStreak = async (uid: string): Promise<number> => {
    try {
        const userRef = doc(db, "users", uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            console.error("User document not found");
            return 0;
        }

        const data = userSnap.data();
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

        // Get last activity date (use lastActivity if available, otherwise lastLogin)
        const lastActivityDate = data.lastActivity 
            ? new Date(data.lastActivity) 
            : (data.lastLogin ? new Date(data.lastLogin) : null);

        let newStreak = data.streak || 0;

        if (lastActivityDate) {
            const lastActivityMid = new Date(
                lastActivityDate.getFullYear(), 
                lastActivityDate.getMonth(), 
                lastActivityDate.getDate()
            ).getTime();
            
            const diffInDays = (today - lastActivityMid) / (1000 * 60 * 60 * 24);

            if (diffInDays === 1) {
                // Consecutive day - increment streak
                newStreak = (data.streak || 0) + 1;
                await updateDoc(userRef, {
                    streak: newStreak,
                    lastActivity: now.toISOString(),
                    lastLogin: now.toISOString() // Also update lastLogin for backward compatibility
                });
            } else if (diffInDays > 1) {
                // Missed at least one day - reset streak to 1
                newStreak = 1;
                await updateDoc(userRef, {
                    streak: 1,
                    lastActivity: now.toISOString(),
                    lastLogin: now.toISOString()
                });
            } else if (diffInDays === 0) {
                // Same day - keep streak, just update timestamp
                await updateDoc(userRef, {
                    lastActivity: now.toISOString()
                });
                newStreak = data.streak || 0;
            } else {
                // Future date (shouldn't happen, but handle it)
                await updateDoc(userRef, {
                    lastActivity: now.toISOString(),
                    lastLogin: now.toISOString()
                });
                newStreak = data.streak || 0;
            }
        } else {
            // First time activity - start streak at 1
            newStreak = 1;
            await updateDoc(userRef, {
                streak: 1,
                lastActivity: now.toISOString(),
                lastLogin: now.toISOString()
            });
        }

        return newStreak;
    } catch (error) {
        console.error("Error updating streak:", error);
        return 0;
    }
};

