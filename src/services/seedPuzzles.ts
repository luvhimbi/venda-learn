import { db } from './firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';

const puzzleData = [
    { id: 'word_001', word: 'MUTHU', hint: 'A human being', translation: 'Person', difficulty: 'Beginner' },
    { id: 'word_002', word: 'THOHO', hint: 'Top part of your body', translation: 'Head', difficulty: 'Beginner' },
    { id: 'word_003', word: 'KHOSI', hint: 'Leader of a tribe', translation: 'King/Chief', difficulty: 'Intermediate' },
    { id: 'word_004', word: 'NNDWA', hint: 'Conflict between groups', translation: 'War', difficulty: 'Advanced' },
    { id: 'word_005', word: 'PFUMA', hint: 'Having lots of money/cattle', translation: 'Wealth', difficulty: 'Intermediate' },
    { id: 'word_006', word: 'NDILA', hint: 'Way to go somewhere', translation: 'Path/Road', difficulty: 'Beginner' },
    { id: 'word_007', word: 'SHUMA', hint: 'To do a job', translation: 'Work', difficulty: 'Beginner' },
    { id: 'word_008', word: 'MVULA', hint: 'Water from the sky', translation: 'Rain', difficulty: 'Beginner' },
    { id: 'word_009', word: 'TSINI', hint: 'Not far', translation: 'Near', difficulty: 'Beginner' },
    { id: 'word_010', word: 'LUVHA', hint: 'Pay respects to a chief', translation: 'Respect/Pay tribute', difficulty: 'Advanced' },
    { id: 'word_011', word: 'TENDA', hint: 'To agree or believe', translation: 'Believe/Agree', difficulty: 'Intermediate' },
    { id: 'word_012', word: 'VHONA', hint: 'To use your eyes', translation: 'See', difficulty: 'Beginner' },
    { id: 'word_013', word: 'DZHIA', hint: 'To take something', translation: 'Take', difficulty: 'Beginner' },
    { id: 'word_014', word: 'LINDA', hint: 'To wait or guard', translation: 'Wait/Guard', difficulty: 'Intermediate' },
    { id: 'word_015', word: 'RENDA', hint: 'To praise someone', translation: 'Praise', difficulty: 'Intermediate' },
    { id: 'word_016', word: 'FHASA', hint: 'To catch something', translation: 'Catch', difficulty: 'Intermediate' },
    { id: 'word_017', word: 'PHULA', hint: 'To open or pierce', translation: 'Pierce/Open', difficulty: 'Advanced' },
    { id: 'word_018', word: 'SWIKA', hint: 'To arrive', translation: 'Arrive', difficulty: 'Beginner' },
    { id: 'word_019', word: 'TANDA', hint: 'To wind or weave', translation: 'Weave', difficulty: 'Advanced' },
    { id: 'word_020', word: 'AMBA', hint: 'To speak', translation: 'Talk', difficulty: 'Beginner' }
];

export const seedPuzzles = async () => {
    try {
        console.log("Starting puzzle seed...");
        for (const puzzle of puzzleData) {
            await setDoc(doc(db, "puzzleWords", puzzle.id), puzzle);
        }
        alert("Zwi khou bvelela! Word Puzzles seeded successfully.");
    } catch (error) {
        console.error("Error seeding puzzles: ", error);
        alert("Failed to seed puzzles.");
    }
};
