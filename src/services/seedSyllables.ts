import { db } from './firebaseConfig';
import { doc, collection, writeBatch } from 'firebase/firestore';

export const syllableWords = [
    { word: "Muthu", syllables: ["Mu", "thu"], translation: "Person", difficulty: "Easy" },
    { word: "Vhuthu", syllables: ["Vhu", "thu"], translation: "Humanity/Kindness", difficulty: "Easy" },
    { word: "Nwana", syllables: ["Nwa", "na"], translation: "Child", difficulty: "Easy" },
    { word: "Shuma", syllables: ["Shu", "ma"], translation: "Work", difficulty: "Easy" },
    { word: "Lufuno", syllables: ["Lu", "fu", "no"], translation: "Love", difficulty: "Medium" },
    { word: "Kholomo", syllables: ["Kho", "lo", "mo"], translation: "Cow", difficulty: "Medium" },
    { word: "Thavha", syllables: ["Tha", "vha"], translation: "Mountain", difficulty: "Easy" },
    { word: "Mulambo", syllables: ["Mu", "la", "mbo"], translation: "River", difficulty: "Medium" },
    { word: "Tshikolo", syllables: ["Tshi", "ko", "lo"], translation: "School", difficulty: "Medium" },
    { word: "Makhulu", syllables: ["Ma", "khu", "lu"], translation: "Grandparent", difficulty: "Medium" },
    { word: "Mutukana", syllables: ["Mu", "tu", "ka", "na"], translation: "Boy", difficulty: "Hard" },
    { word: "Musidzana", syllables: ["Mu", "si", "dza", "na"], translation: "Girl", difficulty: "Hard" },
    { word: "Vho-mme", syllables: ["Vho", "mme"], translation: "Mother (Respectful)", difficulty: "Medium" },
    { word: "Vho-khotsi", syllables: ["Vho", "khotsi"], translation: "Father (Respectful)", difficulty: "Medium" },
    { word: "Nndu", syllables: ["N", "ndu"], translation: "House", difficulty: "Easy" },
    { word: "Madi", syllables: ["Ma", "di"], translation: "Water", difficulty: "Easy" },
    { word: "Zwilo", syllables: ["Zwi", "lo"], translation: "Food", difficulty: "Easy" },
    { word: "Duvha", syllables: ["Du", "vha"], translation: "Sun/Day", difficulty: "Easy" },
    { word: "Nwedzi", syllables: ["Nwe", "dzi"], translation: "Moon/Month", difficulty: "Easy" },
    { word: "Mvula", syllables: ["Mvu", "la"], translation: "Rain", difficulty: "Easy" },
    { word: "Vunda", syllables: ["Vu", "na", "nda"], translation: "Break/Harvest", difficulty: "Medium" }
];

export const seedSyllables = async () => {
    try {
        const batch = writeBatch(db);
        const collectionRef = collection(db, "syllablePuzzles");

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
