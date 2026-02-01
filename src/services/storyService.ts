import { db, auth } from './firebaseConfig';
import { doc, updateDoc, increment, arrayUnion } from 'firebase/firestore';
import { updateStreak } from './streakUtils';

export const completeStory = async (storyId: string, points: number) => {
    const user = auth.currentUser;
    if (!user) return false;

    const userRef = doc(db, "users", user.uid);
    try {
        // Update points using atomic increment
        await updateDoc(userRef, {
            points: increment(points),
            completedStories: arrayUnion(storyId) // Track which stories are read
        });

        // Update streak when story is completed
        await updateStreak(user.uid);

        return true;
    } catch (error) {
        console.error("Error saving story progress:", error);
        return false;
    }
};