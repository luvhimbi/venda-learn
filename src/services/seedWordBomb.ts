import { db, auth } from './firebaseConfig';
import type { Firestore } from 'firebase/firestore';
import { doc, setDoc } from 'firebase/firestore';

const wordBombData = [
    { id: 'wb_001', english: 'Water', nativeWord: 'Madi', difficulty: 'Beginner' },
    { id: 'wb_002', english: 'Fire', nativeWord: 'Mulilo', difficulty: 'Beginner' },
    { id: 'wb_003', english: 'Sun', nativeWord: 'Duvha', difficulty: 'Beginner' },
    { id: 'wb_004', english: 'Moon', nativeWord: 'Nwedzi', difficulty: 'Beginner' },
    { id: 'wb_005', english: 'Rain', nativeWord: 'Mvula', difficulty: 'Beginner' },
    { id: 'wb_006', english: 'House', nativeWord: 'Nndu', difficulty: 'Beginner' },
    { id: 'wb_007', english: 'Dog', nativeWord: 'Mmbwa', difficulty: 'Beginner' },
    { id: 'wb_008', english: 'Cat', nativeWord: 'Tshimange', difficulty: 'Beginner' },
    { id: 'wb_009', english: 'Tree', nativeWord: 'Muri', difficulty: 'Beginner' },
    { id: 'wb_010', english: 'Food', nativeWord: 'Zwiḽiwa', difficulty: 'Beginner' },
    { id: 'wb_011', english: 'Mountain', nativeWord: 'Thavha', difficulty: 'Intermediate' },
    { id: 'wb_012', english: 'River', nativeWord: 'Mulambo', difficulty: 'Intermediate' },
    { id: 'wb_013', english: 'Road', nativeWord: 'Ndila', difficulty: 'Beginner' },
    { id: 'wb_014', english: 'Mother', nativeWord: 'Mme', difficulty: 'Beginner' },
    { id: 'wb_015', english: 'Father', nativeWord: 'Khotsi', difficulty: 'Beginner' },
    { id: 'wb_016', english: 'Child', nativeWord: 'Nwana', difficulty: 'Beginner' },
    { id: 'wb_017', english: 'King', nativeWord: 'Khosi', difficulty: 'Intermediate' },
    { id: 'wb_018', english: 'Love', nativeWord: 'Lufuno', difficulty: 'Beginner' },
    { id: 'wb_019', english: 'Earth', nativeWord: 'Shango', difficulty: 'Intermediate' },
    { id: 'wb_020', english: 'Cow', nativeWord: 'Kholomo', difficulty: 'Intermediate' },
    { id: 'wb_021', english: 'Chicken', nativeWord: 'Khuhu', difficulty: 'Beginner' },
    { id: 'wb_022', english: 'Heart', nativeWord: 'Mbilu', difficulty: 'Intermediate' },
    { id: 'wb_023', english: 'Head', nativeWord: 'Thoho', difficulty: 'Beginner' },
    { id: 'wb_024', english: 'Hand', nativeWord: 'Tshanḓa', difficulty: 'Intermediate' },
    { id: 'wb_025', english: 'Eye', nativeWord: 'Ḽiṱo', difficulty: 'Advanced' },
    { id: 'wb_026', english: 'Ear', nativeWord: 'Nḓevhe', difficulty: 'Intermediate' },
    { id: 'wb_027', english: 'Nose', nativeWord: 'Ningo', difficulty: 'Intermediate' },
    { id: 'wb_028', english: 'Mouth', nativeWord: 'Mulomo', difficulty: 'Beginner' },
    { id: 'wb_029', english: 'Tooth', nativeWord: 'Ḽino', difficulty: 'Intermediate' },
    { id: 'wb_030', english: 'Shoulder', nativeWord: 'Khanda', difficulty: 'Advanced' },
    { id: 'wb_031', english: 'Leg', nativeWord: 'Mulenzhe', difficulty: 'Beginner' },
    { id: 'wb_032', english: 'Foot', nativeWord: 'Lwayo', difficulty: 'Advanced' },
    { id: 'wb_033', english: 'Sky', nativeWord: 'Lutaure', difficulty: 'Advanced' },
    { id: 'wb_034', english: 'Cloud', nativeWord: 'Gole', difficulty: 'Intermediate' },
    { id: 'wb_035', english: 'Wind', nativeWord: 'Muya', difficulty: 'Beginner' },
    { id: 'wb_036', english: 'Sand', nativeWord: 'Mavu', difficulty: 'Beginner' },
    { id: 'wb_037', english: 'Stone', nativeWord: 'Tombo', difficulty: 'Beginner' },
    { id: 'wb_038', english: 'Grass', nativeWord: 'Hatsi', difficulty: 'Beginner' },
    { id: 'wb_039', english: 'Bird', nativeWord: 'Nozhana', difficulty: 'Advanced' },
    { id: 'wb_040', english: 'Fish', nativeWord: 'Khovhe', difficulty: 'Intermediate' },
    { id: 'wb_041', english: 'Snake', nativeWord: 'Nowa', difficulty: 'Beginner' },
    { id: 'wb_042', english: 'Lion', nativeWord: 'Ndou', difficulty: 'Beginner' },
    { id: 'wb_043', english: 'Elephant', nativeWord: 'Ndou', difficulty: 'Beginner' }, // Ndou is elephant
    { id: 'wb_044', english: 'Water', nativeWord: 'Maḓi', difficulty: 'Beginner' },
    { id: 'wb_045', english: 'Milk', nativeWord: 'Mafhi', difficulty: 'Beginner' },
    { id: 'wb_046', english: 'Bread', nativeWord: 'Vhuswa', difficulty: 'Beginner' },
    { id: 'wb_047', english: 'Eat', nativeWord: 'Ḽa', difficulty: 'Beginner' },
    { id: 'wb_048', english: 'Drink', nativeWord: 'Nwa', difficulty: 'Beginner' },
    { id: 'wb_049', english: 'Sleep', nativeWord: 'Eḓela', difficulty: 'Intermediate' },
    { id: 'wb_050', english: 'Work', nativeWord: 'Shuma', difficulty: 'Intermediate' },
];

export const seedWordBomb = async () => {
    try {
        console.log("Starting Word Bomb seed process...");
        const user = auth.currentUser;
        if (!user) {
            console.error("No authenticated user found for seeding.");
            return { success: false, message: "You must be logged in to seed." };
        }
        console.log("Seeding as user:", user.uid);
        
        for (const word of wordBombData) {
            console.log(`Setting word: ${word.english} (${word.id})...`);
            await setDoc(doc(db as Firestore, "wordBombWords", word.id), word);
        }
        console.log("Seeding complete!");
        return { success: true, message: "Word Bomb words seeded successfully!" };
    } catch (error: any) {
        console.error("Firestore Error Code:", error.code);
        console.error("Firestore Error Message:", error.message);
        return { success: false, message: `Failed to seed: ${error.message}` };
    }
};


