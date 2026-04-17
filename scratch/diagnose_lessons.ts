
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

// Manual .env parser to avoid new dependencies
const envContent = fs.readFileSync(path.join(process.cwd(), '.env'), 'utf8');
const env: Record<string, string> = {};
envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length === 2) env[parts[0].trim()] = parts[1].trim();
});

const firebaseConfig = {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function diagnose() {
    console.log("--- Firestore Lessons Global Status ---");
    try {
        const snap = await getDocs(collection(db, "lessons"));
        console.log(`Units found in Firestore: ${snap.docs.length}`);
        
        const lessons = snap.docs.map(d => {
            const data = d.data();
            return {
                id: d.id,
                title: data.title || "Untitled",
                languageId: data.languageId || "None",
                order: data.order ?? "N/A"
            };
        });
        
        lessons.sort((a,b) => {
            const ordA = a.order === "N/A" ? 999 : a.order;
            const ordB = b.order === "N/A" ? 999 : b.order;
            return ordA - ordB;
        });
        
        console.table(lessons);
        
        console.log("\n--- Analysis ---");
        if (snap.docs.length > 6) {
            console.log(`discrepancy confirmed: Firestore has ${snap.docs.length} units.`);
            console.log("Recommend using a cleanup script to remove extra units.");
        }
        
    } catch (e) {
        console.error("Diagnosis failed:", e);
    }
}

diagnose();
