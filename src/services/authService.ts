import { 
    collection, 
    query, 
    where, 
    getDocs, 
    doc, 
    setDoc, 
    type Firestore 
} from 'firebase/firestore';
import { db } from './firebaseConfig';

/**
 * Finds a user document by their email address.
 * Use this to check for existing profiles during cross-provider sign-in.
 */
export const findUserByEmail = async (email: string) => {
    if (!email) return null;
    
    const usersRef = collection(db as Firestore, 'users');
    const q = query(usersRef, where('email', '==', email.toLowerCase()));
    
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
        // Return the first matching document
        const userDoc = querySnapshot.docs[0];
        return {
            id: userDoc.id,
            data: userDoc.data()
        };
    }
    
    return null;
};

/**
 * Consolidates profile data when a user signs in with a new provider.
 * If a profile exists with the same email but different UID, we "transport" 
 * the data to the new UID doc.
 */
export const consolidateUserProfile = async (newUid: string, email: string) => {
    const existingProfile = await findUserByEmail(email);
    
    if (existingProfile && existingProfile.id !== newUid) {
        console.log(`Consolidating profile: found existing data for ${email} at UID ${existingProfile.id}. Syncing to new UID ${newUid}.`);
        
        // Copy the data to the new UID document
        // We preserve the original createdAt if present, but the new UID is the key
        await setDoc(doc(db as Firestore, 'users', newUid), {
            ...existingProfile.data,
            // Ensure email stays lowecase for future lookups
            email: email.toLowerCase(),
            lastMergedFrom: existingProfile.id,
            mergedAt: new Date().toISOString()
        }, { merge: true });
        
        return true;
    }
    
    return false;
};






