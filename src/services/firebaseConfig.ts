// src/firebaseConfig.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
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

// Export services to use in your pages
export const auth = getAuth(app);
export const db = getFirestore(app);