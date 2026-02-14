// src/services/battleService.ts
// Real-time Knowledge Battle service using Firestore

import { db, auth } from './firebaseConfig';
import {
    collection, doc, addDoc, getDoc, getDocs, updateDoc,
    query, where, onSnapshot, serverTimestamp
} from 'firebase/firestore';

// =============================================
//  TYPES
// =============================================
export interface Battle {
    id: string;
    lessonId: string;
    lessonTitle: string;
    questionCount: number;
    status: 'waiting' | 'playing' | 'completed';
    createdAt: any;
    completedAt: any;

    // Player A (challenger)
    challengerId: string;
    challengerName: string;
    challengerScore: number;
    challengerCorrect: number;
    challengerProgress: number;
    challengerFinished: boolean;

    // Player B (opponent)
    opponentId: string | null;
    opponentName: string | null;
    opponentScore: number;
    opponentCorrect: number;
    opponentProgress: number;
    opponentFinished: boolean;

    winnerId: string | null;
    questionOrder: number[]; // Array of indices from the lesson questions
}

const BATTLES_COL = 'battles';

// =============================================
//  CREATE A BATTLE ROOM
// =============================================
export const createBattle = async (
    lessonId: string,
    lessonTitle: string,
    questionCount: number
): Promise<string> => {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be logged in');

    const battleData = {
        lessonId,
        lessonTitle,
        questionCount,
        status: 'waiting',
        createdAt: serverTimestamp(),
        completedAt: null,

        challengerId: user.uid,
        challengerName: user.displayName || 'Player 1',
        challengerScore: 0,
        challengerCorrect: 0,
        challengerProgress: 0,
        challengerFinished: false,

        opponentId: null,
        opponentName: null,
        opponentScore: 0,
        opponentCorrect: 0,
        opponentProgress: 0,
        opponentFinished: false,

        winnerId: null,
        questionOrder: Array.from({ length: questionCount }, (_, i) => i)
            .sort(() => Math.random() - 0.5)
            .slice(0, 10), // Limit battles to 10 questions max for speed/fairness
    };

    const docRef = await addDoc(collection(db, BATTLES_COL), battleData);
    return docRef.id;
};

// =============================================
//  FETCH OPEN BATTLES (for lessons user completed)
// =============================================
export const fetchOpenBattles = async (completedLessonIds: string[]): Promise<Battle[]> => {
    const user = auth.currentUser;
    if (!user || completedLessonIds.length === 0) return [];

    // Firestore 'in' queries support max 30 items
    const chunks: string[][] = [];
    for (let i = 0; i < completedLessonIds.length; i += 30) {
        chunks.push(completedLessonIds.slice(i, i + 30));
    }

    const all: Battle[] = [];
    for (const chunk of chunks) {
        const q = query(
            collection(db, BATTLES_COL),
            where('status', '==', 'waiting'),
            where('lessonId', 'in', chunk)
        );
        const snap = await getDocs(q);
        snap.docs.forEach(d => {
            const data = d.data();
            // Don't show your own battles
            if (data.challengerId !== user.uid) {
                all.push({ id: d.id, ...data } as Battle);
            }
        });
    }

    // Sort newest first
    all.sort((a, b) => {
        const ta = a.createdAt?.toMillis?.() || 0;
        const tb = b.createdAt?.toMillis?.() || 0;
        return tb - ta;
    });

    return all;
};

// =============================================
//  FETCH MY BATTLES (history)
// =============================================
export const fetchMyBattles = async (): Promise<Battle[]> => {
    const user = auth.currentUser;
    if (!user) return [];

    // Get battles where user is challenger
    const q1 = query(
        collection(db, BATTLES_COL),
        where('challengerId', '==', user.uid)
    );

    // Get battles where user is opponent
    const q2 = query(
        collection(db, BATTLES_COL),
        where('opponentId', '==', user.uid)
    );

    const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);

    const battles: Battle[] = [];
    const seen = new Set<string>();

    [...snap1.docs, ...snap2.docs].forEach(d => {
        if (!seen.has(d.id)) {
            seen.add(d.id);
            battles.push({ id: d.id, ...d.data() } as Battle);
        }
    });

    // Sort newest first
    battles.sort((a, b) => {
        const ta = a.createdAt?.toMillis?.() || 0;
        const tb = b.createdAt?.toMillis?.() || 0;
        return tb - ta;
    });

    return battles;
};

// =============================================
//  JOIN A BATTLE
// =============================================
export const joinBattle = async (battleId: string): Promise<void> => {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be logged in');

    const ref = doc(db, BATTLES_COL, battleId);
    await updateDoc(ref, {
        opponentId: user.uid,
        opponentName: user.displayName || 'Player 2',
        opponentScore: 0,
        opponentCorrect: 0,
        opponentProgress: 0,
        opponentFinished: false,
        status: 'playing',
    });
};

// =============================================
//  REAL-TIME SUBSCRIPTION
// =============================================
export const subscribeToBattle = (
    battleId: string,
    callback: (battle: Battle) => void
): (() => void) => {
    const ref = doc(db, BATTLES_COL, battleId);
    return onSnapshot(ref, (snap) => {
        if (snap.exists()) {
            callback({ id: snap.id, ...snap.data() } as Battle);
        }
    });
};

// =============================================
//  UPDATE PROGRESS (live scoring)
// =============================================
export const updateBattleProgress = async (
    battleId: string,
    role: 'challenger' | 'opponent',
    score: number,
    correct: number,
    progress: number,
    finished: boolean
): Promise<void> => {
    const ref = doc(db, BATTLES_COL, battleId);
    const prefix = role === 'challenger' ? 'challenger' : 'opponent';

    await updateDoc(ref, {
        [`${prefix}Score`]: score,
        [`${prefix}Correct`]: correct,
        [`${prefix}Progress`]: progress,
        [`${prefix}Finished`]: finished,
    });
};

// =============================================
//  FINALIZE BATTLE (determine winner)
// =============================================
export const finalizeBattle = async (battleId: string): Promise<void> => {
    const ref = doc(db, BATTLES_COL, battleId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;

    const data = snap.data() as Omit<Battle, 'id'>;

    // Only finalize if both are done
    if (!data.challengerFinished || !data.opponentFinished) return;

    let winnerId: string | null = null;
    if (data.challengerScore > data.opponentScore) {
        winnerId = data.challengerId;
    } else if (data.opponentScore > data.challengerScore) {
        winnerId = data.opponentId;
    }
    // else draw → winnerId stays null

    await updateDoc(ref, {
        status: 'completed',
        completedAt: serverTimestamp(),
        winnerId,
    });
};

// =============================================
//  FETCH SINGLE BATTLE
// =============================================
export const fetchBattleById = async (battleId: string): Promise<Battle | null> => {
    const ref = doc(db, BATTLES_COL, battleId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as Battle;
};
