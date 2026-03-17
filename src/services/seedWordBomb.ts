import { db, auth } from './firebaseConfig';
import type { Firestore } from 'firebase/firestore';
import { doc, setDoc } from 'firebase/firestore';

const wordBombData = [
    { id: 'wb_001', english: 'Water', venda: 'Madi', difficulty: 'Beginner' },
    { id: 'wb_002', english: 'Fire', venda: 'Mulilo', difficulty: 'Beginner' },
    { id: 'wb_003', english: 'Sun', venda: 'Duvha', difficulty: 'Beginner' },
    { id: 'wb_004', english: 'Moon', venda: 'Nwedzi', difficulty: 'Beginner' },
    { id: 'wb_005', english: 'Rain', venda: 'Mvula', difficulty: 'Beginner' },
    { id: 'wb_006', english: 'House', venda: 'Nndu', difficulty: 'Beginner' },
    { id: 'wb_007', english: 'Dog', venda: 'Mmbwa', difficulty: 'Beginner' },
    { id: 'wb_008', english: 'Cat', venda: 'Tshimange', difficulty: 'Beginner' },
    { id: 'wb_009', english: 'Tree', venda: 'Muri', difficulty: 'Beginner' },
    { id: 'wb_010', english: 'Food', venda: 'Zwiḽiwa', difficulty: 'Beginner' },
    { id: 'wb_011', english: 'Mountain', venda: 'Thavha', difficulty: 'Intermediate' },
    { id: 'wb_012', english: 'River', venda: 'Mulambo', difficulty: 'Intermediate' },
    { id: 'wb_013', english: 'Road', venda: 'Ndila', difficulty: 'Beginner' },
    { id: 'wb_014', english: 'Mother', venda: 'Mme', difficulty: 'Beginner' },
    { id: 'wb_015', english: 'Father', venda: 'Khotsi', difficulty: 'Beginner' },
    { id: 'wb_016', english: 'Child', venda: 'Nwana', difficulty: 'Beginner' },
    { id: 'wb_017', english: 'King', venda: 'Khosi', difficulty: 'Intermediate' },
    { id: 'wb_018', english: 'Love', venda: 'Lufuno', difficulty: 'Beginner' },
    { id: 'wb_019', english: 'Earth', venda: 'Shango', difficulty: 'Intermediate' },
    { id: 'wb_020', english: 'Cow', venda: 'Kholomo', difficulty: 'Intermediate' },
    { id: 'wb_021', english: 'Chicken', venda: 'Khuhu', difficulty: 'Beginner' },
    { id: 'wb_022', english: 'Heart', venda: 'Mbilu', difficulty: 'Intermediate' },
    { id: 'wb_023', english: 'Head', venda: 'Thoho', difficulty: 'Beginner' },
    { id: 'wb_024', english: 'Hand', venda: 'Tshanḓa', difficulty: 'Intermediate' },
    { id: 'wb_025', english: 'Eye', venda: 'Ḽiṱo', difficulty: 'Advanced' },
    { id: 'wb_026', english: 'Ear', venda: 'Nḓevhe', difficulty: 'Intermediate' },
    { id: 'wb_027', english: 'Nose', venda: 'Ningo', difficulty: 'Intermediate' },
    { id: 'wb_028', english: 'Mouth', venda: 'Mulomo', difficulty: 'Beginner' },
    { id: 'wb_029', english: 'Tooth', venda: 'Ḽino', difficulty: 'Intermediate' },
    { id: 'wb_030', english: 'Shoulder', venda: 'Khanda', difficulty: 'Advanced' },
    { id: 'wb_031', english: 'Leg', venda: 'Mulenzhe', difficulty: 'Beginner' },
    { id: 'wb_032', english: 'Foot', venda: 'Lwayo', difficulty: 'Advanced' },
    { id: 'wb_033', english: 'Sky', venda: 'Lutaure', difficulty: 'Advanced' },
    { id: 'wb_034', english: 'Cloud', venda: 'Gole', difficulty: 'Intermediate' },
    { id: 'wb_035', english: 'Wind', venda: 'Muya', difficulty: 'Beginner' },
    { id: 'wb_036', english: 'Sand', venda: 'Mavu', difficulty: 'Beginner' },
    { id: 'wb_037', english: 'Stone', venda: 'Tombo', difficulty: 'Beginner' },
    { id: 'wb_038', english: 'Grass', venda: 'Hatsi', difficulty: 'Beginner' },
    { id: 'wb_039', english: 'Bird', venda: 'Nozhana', difficulty: 'Advanced' },
    { id: 'wb_040', english: 'Fish', venda: 'Khovhe', difficulty: 'Intermediate' },
    { id: 'wb_041', english: 'Snake', venda: 'Nowa', difficulty: 'Beginner' },
    { id: 'wb_042', english: 'Lion', venda: 'Ndou', difficulty: 'Beginner' },
    { id: 'wb_043', english: 'Elephant', venda: 'Ndou', difficulty: 'Beginner' }, // Ndou is elephant
    { id: 'wb_044', english: 'Water', venda: 'Maḓi', difficulty: 'Beginner' },
    { id: 'wb_045', english: 'Milk', venda: 'Mafhi', difficulty: 'Beginner' },
    { id: 'wb_046', english: 'Bread', venda: 'Vhuswa', difficulty: 'Beginner' },
    { id: 'wb_047', english: 'Eat', venda: 'Ḽa', difficulty: 'Beginner' },
    { id: 'wb_048', english: 'Drink', venda: 'Nwa', difficulty: 'Beginner' },
    { id: 'wb_049', english: 'Sleep', venda: 'Eḓela', difficulty: 'Intermediate' },
    { id: 'wb_050', english: 'Work', venda: 'Shuma', difficulty: 'Intermediate' },
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


