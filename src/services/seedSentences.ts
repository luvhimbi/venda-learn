import { db } from './firebaseConfig';
import type { Firestore } from 'firebase/firestore';
import { collection, writeBatch, doc } from 'firebase/firestore';

export interface SentencePuzzle {
    id: string;
    words: string[];
    translation: string;
    difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
}

const sentenceData = [
    { words: ["Ndi", "funa", "zwiliwa"], translation: "I like food", difficulty: "Beginner" },
    { words: ["Ndo", "livhuwa"], translation: "Thank you", difficulty: "Beginner" },
    { words: ["Ndina", "ndala"], translation: "I am hungry", difficulty: "Beginner" },
    { words: ["Ni", "Kho u", "bva", "gai?"], translation: "Where are you from?", difficulty: "Beginner" },
    { words: ["Ni", "Kho uya ", "gai"], translation: "Where are you going?", difficulty: "Beginner" },
    { words: ["Ndi", "ani ", "funa"], translation: "I love you", difficulty: "Beginner" },
    { words: ["Ndi ", "Kho uya ", " u vhala"], translation: "Am going to study", difficulty: "Beginner" },
    { words: ["Ndi", "shuma", "namusi"], translation: "I am working today", difficulty: "Beginner" },
    { words: ["Ndi", "vhuya", "hayani"], translation: "I am coming home", difficulty: "Beginner" },
    { words: ["Kholomo", "yo", "xela"], translation: "The cow is lost", difficulty: "Beginner" },
    { words: ["Madi", "a", "rotha"], translation: "The water is dripping", difficulty: "Beginner" },
    
    { words: ["Ni", "khou", "ita", "mini?"], translation: "What are you doing?", difficulty: "Intermediate" },
    { words: ["Ndi", "matsheloni", "avhudi"], translation: "Good morning", difficulty: "Intermediate" },
    { words: ["Ni", "do vhuya nga  ", "tshifhinga-de"], translation: "What time are you coming back?", difficulty: "Intermediate" },
    { words: ["Ndi", "khou", "divha", "Zwino"], translation: "I know it now", difficulty: "Intermediate" },
    { words: ["Vhathu", "vho", "ṱangana", "vhoṱhe"], translation: "The people have gathered together", difficulty: "Intermediate" },
    { words: ["Ndi", "do", "vhuya", "matsho"], translation: "I will return tomorrow", difficulty: "Intermediate" },
    { words: ["Mulambo", "wo", "dala", "madi"], translation: "The river is full of water", difficulty: "Intermediate" },

    { words: ["Muthu", "ndi", "Muthu", "nga", "vhathu"], translation: "A person is a person through other people", difficulty: "Advanced" },
    { words: ["U", "tenda", "ndi", "u", "shuma"], translation: "To believe is to work", difficulty: "Advanced" },
    { words: ["Vhukuma", "zwithu", "zwi", "do", "luga"], translation: "Truly things will be fine", difficulty: "Advanced" },
    { words: ["A", "hu", "na", "zwi", "dinaho"], translation: "There is nothing troubling/wrong", difficulty: "Advanced" },
    { words: ["Kha", "ri", "bve", "ri", "tshi", "ya", "phanda"], translation: "Let us go outside and move forward", difficulty: "Advanced" }
];

export const seedSentences = async () => {
    try {
        console.log("Starting seed for Sentence Scramble...");
        const batch = writeBatch(db as Firestore);
        const collectionRef = collection(db as Firestore, "sentencePuzzles");

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








