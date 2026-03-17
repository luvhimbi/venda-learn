import { db } from './firebaseConfig';
import type { Firestore } from 'firebase/firestore';
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
    { id: 'word_020', word: 'AMBA', hint: 'To speak', translation: 'Talk', difficulty: 'Beginner' },
    { id: 'word_021', word: 'NWANA', hint: 'A young child', translation: 'Child', difficulty: 'Beginner' },
    { id: 'word_022', word: 'MBILU', hint: 'The pump of life', translation: 'Heart', difficulty: 'Intermediate' },
    { id: 'word_023', word: 'NDILO', hint: 'Traditional wooden plate', translation: 'Plate', difficulty: 'Intermediate' },
    { id: 'word_024', word: 'VOTHI', hint: 'Entrance to a house', translation: 'Door', difficulty: 'Beginner' },
    { id: 'word_025', word: 'MMBWA', hint: 'Man’s best friend', translation: 'Dog', difficulty: 'Beginner' },
    { id: 'word_026', word: 'LWAYO', hint: 'Part of the leg used for walking', translation: 'Foot', difficulty: 'Advanced' },
    { id: 'word_027', word: 'NINGO', hint: 'Used for smelling', translation: 'Nose', difficulty: 'Intermediate' },
    { id: 'word_028', word: 'DUVHA', hint: 'The sun or a day', translation: 'Sun/Day', difficulty: 'Beginner' },
    { id: 'word_029', word: 'TOMBO', hint: 'Hard natural object', translation: 'Stone', difficulty: 'Beginner' },
    { id: 'word_030', word: 'HATSI', hint: 'Green ground cover', translation: 'Grass', difficulty: 'Beginner' }
];

export const seedPuzzles = async () => {
    try {
        console.log("Starting puzzle seed...");
        for (const puzzle of puzzleData) {
            await setDoc(doc(db as Firestore, "puzzleWords", puzzle.id), puzzle);
        }
        alert("Zwi khou bvelela! Word Puzzles seeded successfully.");
    } catch (error) {
        console.error("Error seeding puzzles: ", error);
        alert("Failed to seed puzzles.");
    }
};


