import { db } from './firebaseConfig';
import { collection, writeBatch, doc } from 'firebase/firestore';

const dailyWordsData = [
    { word: "Maanda", meaning: "Power/Strength", example: "U na maanda.", explanation: "Used to describe physical or spiritual strength." },
    { word: "Dakalo", meaning: "Happiness", example: "Ri na dakalo.", explanation: "A state of being happy or joyful." },
    { word: "Mulalo", meaning: "Peace", example: "Vha na mulalo.", explanation: "Peacefulness or tranquility." },
    { word: "Vhutali", meaning: "Wisdom", example: "O pfuma vhutali.", explanation: "Knowledge and good judgment." },
    { word: "Gundo", meaning: "Victory", example: "Ro wana gundo.", explanation: "Success in a contest or struggle." },
    { word: "Phanda", meaning: "Forward/Future", example: "Ri ya phanda.", explanation: "Moving ahead or looking to the future." },
    { word: "Mbilu", meaning: "Heart", example: "U na mbilu yavhudi.", explanation: "Anatomical heart or figurative seat of emotions." },
    { word: "Lufuno", meaning: "Love", example: "Lufuno lwa Mme.", explanation: "A Mothers Love" }
];

export const seedDailyWords = async () => {
    try {
        console.log("Starting seed for Daily Words...");
        const batch = writeBatch(db);
        const collectionRef = collection(db, "dailyWords");

        // Check if exists to avoid duplicates is a bit hard with random IDs, 
        // but for now we will just add them. In production, use IDs.

        for (const item of dailyWordsData) {
            const newDocRef = doc(collectionRef); // Generate new ID
            batch.set(newDocRef, item);
        }

        await batch.commit();
        console.log("Seeding complete!");
        return { success: true, message: "Daily words seeded successfully!" };
    } catch (error) {
        console.error("Error seeding daily words:", error);
        return { success: false, message: "Failed to seed daily words." };
    }
};
