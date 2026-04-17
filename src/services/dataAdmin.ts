import { db } from './firebaseConfig';
import { collection, getDocs, deleteDoc, doc, setDoc, Firestore } from 'firebase/firestore';

/**
 * Deletes all documents in a collection. USE WITH CAUTION.
 */
export const clearCollection = async (collectionName: string) => {
    try {
        const snap = await getDocs(collection(db as Firestore, collectionName));
        const deletes = snap.docs.map(d => deleteDoc(doc(db as Firestore, collectionName, d.id)));
        await Promise.all(deletes);
        console.log(`Cleared collection: ${collectionName}`);
    } catch (error) {
        console.error(`Failed to clear ${collectionName}:`, error);
        throw error;
    }
};

/**
 * Migrates languages to standardized slug-based IDs.
 */
export const migrateLanguages = async () => {
    try {
        const snap = await getDocs(collection(db as Firestore, "languages"));
        for (const d of snap.docs) {
            const data = d.data();
            const slug = data.name.toLowerCase()
                            .replace(/tshivenda/g, 'venda')
                            .replace(/[^a-z]/g, '')
                            .trim();
            
            if (d.id !== slug) {
                // Create new doc with slug ID
                await setDoc(doc(db as Firestore, "languages", slug), {
                    ...data,
                    originalId: d.id
                });
                // Delete old doc
                await deleteDoc(doc(db as Firestore, "languages", d.id));
                console.log(`Migrated ${data.name} from ${d.id} to ${slug}`);
            }
        }
    } catch (error) {
        console.error("Migration failed:", error);
        throw error;
    }
};






