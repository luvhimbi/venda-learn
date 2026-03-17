import { db } from './firebaseConfig';
import type { Firestore } from 'firebase/firestore';
import { collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';

const picturePuzzleData = [
    { 
        imageUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&auto=format&fit=crop',
        venda: 'Mmbwa',
        english: 'Dog'
    },
    { 
        imageUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=500&auto=format&fit=crop',
        venda: 'Phathi',
        english: 'Cat'
    },
    { 
        imageUrl: 'https://images.unsplash.com/photo-1444464666168-49d633b867ad?w=500&auto=format&fit=crop',
        venda: 'Zwinoni',
        english: 'Bird'
    },
    { 
        imageUrl: 'https://images.unsplash.com/photo-1544526226-d4568090ffb8?w=500&auto=format&fit=crop',
        venda: 'Maḓi',
        english: 'Water'
    },
    { 
        imageUrl: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=500&auto=format&fit=crop',
        venda: 'Muri',
        english: 'Tree'
    },
    { 
        imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=500&auto=format&fit=crop',
        venda: 'Thavha',
        english: 'Mountain'
    },
    { 
        imageUrl: 'https://images.unsplash.com/photo-1534067783941-51c9c23ecefd?w=500&auto=format&fit=crop',
        venda: 'Ḓuvha',
        english: 'Sun/Day'
    },
    { 
        imageUrl: 'https://images.unsplash.com/photo-1529736571195-42ed9e1734f4?w=500&auto=format&fit=crop',
        venda: 'Ṅwedzi',
        english: 'Moon'
    }
];

export const seedPicturePuzzles = async () => {
    try {
        console.log("Starting picture puzzle seed...");
        
        // 1. Clear existing standalone puzzles to avoid duplicates
        const snap = await getDocs(collection(db as Firestore, "picturePuzzles"));
        for (const d of snap.docs) {
            await deleteDoc(doc(db as Firestore, "picturePuzzles", d.id));
        }

        // 2. Add new data
        for (const p of picturePuzzleData) {
            await addDoc(collection(db as Firestore, "picturePuzzles"), {
                ...p,
                createdAt: serverTimestamp()
            });
        }

        return { success: true, message: "Picture puzzles seeded successfully!" };
    } catch (error) {
        console.error("Error seeding picture puzzles:", error);
        throw error;
    }
};


