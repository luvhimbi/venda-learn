/**
 * clean_firebase_games.mjs
 * 
 * This script purges all game-related content from your Firebase project.
 * It deletes documents in the following collections:
 * - puzzleWords
 * - syllablePuzzles
 * - sentencePuzzles
 * - picturePuzzles
 * 
 * It also removes the 'gameLevels' field from all user documents.
 * 
 * USAGE:
 * 1. Ensure you have 'firebase-admin' installed: npm install firebase-admin
 * 2. Download your service account key from Firebase Console (Project Settings > Service Accounts)
 * 3. Save it as 'service-account.json' in this directory.
 * 4. Run: node clean_firebase_games.mjs
 */

import admin from 'firebase-admin';
import { readFile } from 'fs/promises';

async function cleanup() {
    try {
        const serviceAccount = JSON.parse(
            await readFile(new URL('./service-account.json', import.meta.url))
        );

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });

        const db = admin.firestore();
        const collections = ['puzzleWords', 'syllablePuzzles', 'sentencePuzzles', 'picturePuzzles'];

        console.log("--- STARTING FIREBASE CLEANUP ---");

        // 1. Delete Game Collections
        for (const collName of collections) {
            console.log(`Checking collection: ${collName}...`);
            const snapshot = await db.collection(collName).get();
            
            if (snapshot.empty) {
                console.log(`Collection ${collName} is already empty.`);
                continue;
            }

            console.log(`Deleting ${snapshot.size} documents from ${collName}...`);
            const batch = db.batch();
            snapshot.docs.forEach(doc => batch.delete(doc.ref));
            await batch.commit();
            console.log(`Deleted ${collName}.`);
        }

        // 2. Clean User Documents (remove gameLevels field)
        console.log("Cleaning user documents (removing gameLevels)...");
        const usersSnapshot = await db.collection('users').get();
        let userCount = 0;
        
        for (const userDoc of usersSnapshot.docs) {
            const data = userDoc.data();
            if (data.gameLevels) {
                await userDoc.ref.update({
                    gameLevels: admin.firestore.FieldValue.delete()
                });
                userCount++;
            }
        }
        console.log(`Cleaned gameLevels from ${userCount} user documents.`);

        console.log("--- CLEANUP COMPLETE ---");
        process.exit(0);
    } catch (error) {
        console.error("Cleanup failed:", error);
        process.exit(1);
    }
}

cleanup();
