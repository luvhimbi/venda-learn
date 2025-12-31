import { db } from './firebaseConfig';
import { doc, writeBatch, collection, getDocs } from 'firebase/firestore';
import wordsData from '../data/vendaWords.json'; // Import your JSON list

export const seedDailyWords = async () => {
    const batch = writeBatch(db);
    const startDate = new Date();

    // Safety check: Don't overwrite if already populated for today
    const existingWords = await getDocs(collection(db, "dailyWords"));
    if (existingWords.size > 50) {
        console.log("Database already has enough words.");
        return;
    }

    wordsData.forEach((wordEntry, index) => {
        // Calculate the date ID: YYYY-MM-DD
        const targetDate = new Date(startDate);
        targetDate.setDate(startDate.getDate() + index);
        const dateId = targetDate.toISOString().split('T')[0];

        const wordRef = doc(db, "dailyWords", dateId);

        batch.set(wordRef, {
            ...wordEntry,
            createdAt: new Date()
        });
    });

    try {
        await batch.commit();
        console.log(`✅ Successfully scheduled ${wordsData.length} days of words!`);
    } catch (error) {
        console.error("❌ Seeding failed:", error);
    }
};