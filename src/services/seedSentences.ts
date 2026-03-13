import { db } from './firebaseConfig';
import { collection, writeBatch, doc } from 'firebase/firestore';

export interface SentencePuzzle {
    id: string;
    words: string[];
    translation: string;
    difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
}

const sentenceData = [
    {
        words: ["Ndi", "funa", "zwiliwa"],
        translation: "I like food",
        difficulty: "Beginner"
    },
    {
        words: ["Ndo", "livhuwa"],
        translation: "Thank you (I possess gratitude)",
        difficulty: "Beginner"
    },
    {
        words: ["Ni", "khou", "ita", "mini?"],
        translation: "What are you doing?",
        difficulty: "Intermediate"
    },
    {
        words: ["Ndi", "matsheloni", "avhudi"],
        translation: "Good morning (It is a beautiful morning)",
        difficulty: "Intermediate"
    },
    {
        words: ["Muthu", "ndi", "Muthu", "nga", "vhathu"],
        translation: "A person is a person through other people",
        difficulty: "Advanced"
    },
    {
        words: ["Ndina", "ndala"],
        translation: "I am hungry",
        difficulty: "Beginner"
    },
    {
        words: ["Ni", "Kho u", "bva", "gai?"],
        translation: "Where are you from?",
        difficulty: "Beginner"
    },
    {
        words: ["Ni", "Kho uya ", "gai"],
        translation: "Where are you going?",
        difficulty: "Beginner"
    },
    {
        words: ["Ni", "do vhuya nga  ", "tshifhinga-de"],
        translation: "What time are you coming back?",
        difficulty: "Beginner"
    },
    {
        words: ["Ndi", "ani ", "funa"],
        translation: "I love you",
        difficulty: "Beginner"
    },
    {
        words: ["Ndi ", "Kho uya ", " u vhala"],
        translation: "Am going to study",
        difficulty: "Beginner"
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
