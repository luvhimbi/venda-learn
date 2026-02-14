import { db } from './firebaseConfig';
import { collection, writeBatch, doc } from 'firebase/firestore';

export interface SentencePuzzle {
    id: string;
    words: string[]; // Correct order: ["Ndi", "funa", "zwili"]
    translation: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
}

const sentenceData = [
    {
        words: ["Ndi", "funa", "zwili"],
        translation: "I like food",
        difficulty: "Easy"
    },
    {
        words: ["Ndi", "a", "livhuwa"],
        translation: "Thank you (I possess gratitude)",
        difficulty: "Easy"
    },
    {
        words: ["Vha", "khou", "ita", "mini?"],
        translation: "What are you doing?",
        difficulty: "Medium"
    },
    {
        words: ["Ndi", "matsheloni", "avhudi"],
        translation: "Good morning (It is a beautiful morning)",
        difficulty: "Medium"
    },
    {
        words: ["Muthu", "udi", "nga", "vhathu"],
        translation: "A person is a person through other people",
        difficulty: "Hard"
    },
    {
        words: ["Ndi", "khou", "pfa", "ndala"],
        translation: "I am hungry",
        difficulty: "Easy"
    },
    {
        words: ["U", "bva", "gai?"],
        translation: "Where are you from?",
        difficulty: "Easy"
    }
];

export const seedSentences = async () => {
    try {
        console.log("Starting seed for Sentence Scramble...");
        const batch = writeBatch(db);
        const collectionRef = collection(db, "sentencePuzzles");

        for (const item of sentenceData) {
            const newDocRef = doc(collectionRef);
            // We store the words in correct order. 
            // The game frontend will handle shuffling them for display.
            batch.set(newDocRef, item);
        }

        await batch.commit();
        console.log("Seeding complete!");
        return { success: true, message: "Sentence puzzles seeded successfully!" };
    } catch (error) {
        console.error("Error seeding sentences:", error);
        return { success: false, message: "Failed to seed sentences." };
    }
};
