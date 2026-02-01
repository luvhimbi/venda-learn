// src/services/firebaseConfig.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
    initializeFirestore,
    persistentLocalCache,
    persistentMultipleTabManager
} from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyDktGtTGJDo11ol3FLJGI-ygKFnIZkqzuM",
    authDomain: "venda-learn.firebaseapp.com",
    projectId: "venda-learn",
    storageBucket: "venda-learn.firebasestorage.app",
    messagingSenderId: "931595838430",
    appId: "1:931595838430:web:01f516df83f0b45c6bb34f",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore with Persistent Caching
// Multi-tab manager allows the cache to work across different browser tabs
export const db = initializeFirestore(app, {
    localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
    })
});

// Export Auth
export const auth = getAuth(app);