import { db } from './firebaseConfig';
import type { Firestore } from 'firebase/firestore';
import { doc, collection, writeBatch } from 'firebase/firestore';

export const syllableWords = [
    { word: "Muthu", syllables: ["Mu", "thu"], translation: "Person", difficulty: "Beginner" },
    { word: "Vhuthu", syllables: ["Vhu", "thu"], translation: "Humanity/Kindness", difficulty: "Beginner" },
    { word: "Nwana", syllables: ["Nwa", "na"], translation: "Child", difficulty: "Beginner" },
    { word: "Shuma", syllables: ["Shu", "ma"], translation: "Work", difficulty: "Beginner" },
    { word: "Thavha", syllables: ["Tha", "vha"], translation: "Mountain", difficulty: "Beginner" },
    { word: "Nndu", syllables: ["N", "ndu"], translation: "House", difficulty: "Beginner" },
    { word: "Madi", syllables: ["Ma", "di"], translation: "Water", difficulty: "Beginner" },
    { word: "Zwiliwa", syllables: ["Zwi", "li","wa"], translation: "Food", difficulty: "Beginner" },
    { word: "Duvha", syllables: ["Du", "vha"], translation: "Sun/Day", difficulty: "Beginner" },
    { word: "Nwedzi", syllables: ["Nwe", "dzi"], translation: "Moon/Month", difficulty: "Beginner" },
    { word: "Mvula", syllables: ["Mvu", "la"], translation: "Rain", difficulty: "Beginner" },
    { word: "Bugu", syllables: ["Bu", "gu"], translation: "Book", difficulty: "Beginner" },
    { word: "Mato", syllables: ["Ma", "to"], translation: "Eyes", difficulty: "Beginner" },

    { word: "Lufuno", syllables: ["Lu", "fu", "no"], translation: "Love", difficulty: "Intermediate" },
    { word: "Kholomo", syllables: ["Kho", "lo", "mo"], translation: "Cow", difficulty: "Intermediate" },
    { word: "Mulambo", syllables: ["Mu", "la", "mbo"], translation: "River", difficulty: "Intermediate" },
    { word: "Tshikolo", syllables: ["Tshi", "ko", "lo"], translation: "School", difficulty: "Intermediate" },
    { word: "Makhulu", syllables: ["Ma", "khu", "lu"], translation: "Grandparent", difficulty: "Intermediate" },
    { word: "Vho-mme", syllables: ["Vho", "mme"], translation: "Mother (Respectful)", difficulty: "Intermediate" },
    { word: "Vho-khotsi", syllables: ["Vho", "khotsi"], translation: "Father (Respectful)", difficulty: "Intermediate" },
    { word: "Vunda", syllables: ["Vu", "na", "nda"], translation: "Break/Harvest", difficulty: "Intermediate" },
    { word: "Ndinda", syllables: ["Ndi", "nda"], translation: "I wait", difficulty: "Intermediate" },
    { word: "Duvhanya", syllables: ["Du", "vha", "nya"], translation: "To strike/hit", difficulty: "Intermediate" },
    { word: "Khofhe", syllables: ["Kho", "fhe"], translation: "Sleep", difficulty: "Intermediate" },

    { word: "Mutukana", syllables: ["Mu", "tu", "ka", "na"], translation: "Boy", difficulty: "Advanced" },
    { word: "Musidzana", syllables: ["Mu", "si", "dza", "na"], translation: "Girl", difficulty: "Advanced" },
    { word: "Makhuwa", syllables: ["Ma", "khu", "wa"], translation: "White people", difficulty: "Advanced" },
    { word: "Tshithu", syllables: ["Tshi", "thu"], translation: "Thing", difficulty: "Advanced" },
    { word: "Vhukuma", syllables: ["Vhu", "ku", "ma"], translation: "Truly/Very", difficulty: "Advanced" },
    { word: "Thonifho", syllables: ["Tho", "ni", "fho"], translation: "Respect", difficulty: "Advanced" },
    { word: "Tshisima", syllables: ["Tshi", "si", "ma"], translation: "Fountain/Well", difficulty: "Advanced" }
];

export const seedSyllables = async () => {
    try {
        const batch = writeBatch(db as Firestore);
        const collectionRef = collection(db as Firestore, "syllablePuzzles");

        syllableWords.forEach((item) => {
            const docRef = doc(collectionRef, item.word.toLowerCase());
            batch.set(docRef, item);
        });

        await batch.commit();
        alert("Zwiaki seeded successfully! (Syllables added)");
    } catch (error) {
        console.error("Error seeding syllables:", error);
        alert("Failed to seed syllables.");
    }
};








