// src/services/dataCache.ts
// Lightweight in-memory cache to avoid redundant Firestore reads across pages.
// Data is fetched once per session and shared between Home, Courses, GameRoom, etc.

import { db, auth } from './firebaseConfig';
import { collection, getDocs, doc, getDoc, query, orderBy, limit } from 'firebase/firestore';


interface CacheEntry<T> {
    data: T;
    timestamp: number;
}

const cache = new Map<string, CacheEntry<any>>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const getCached = <T>(key: string): T | null => {
    const entry = cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > CACHE_TTL) {
        cache.delete(key);
        return null;
    }
    return entry.data as T;
};

const setCache = <T>(key: string, data: T): void => {
    cache.set(key, { data, timestamp: Date.now() });
};

// Invalidate a specific key (e.g. after completing a lesson)
export const invalidateCache = (key?: string) => {
    if (key) cache.delete(key);
    else cache.clear();
};

// ----- SHARED DATA FETCHERS -----

export const fetchLessons = async (): Promise<any[]> => {
    const cached = getCached<any[]>('lessons');
    if (cached) return cached;

    const snap = await getDocs(collection(db, "lessons"));
    const lessons = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    // Sort client-side: by order if present, else alphabetically
    lessons.sort((a: any, b: any) => {
        if (a.order !== undefined && b.order !== undefined) return a.order - b.order;
        if (a.order !== undefined) return -1;
        if (b.order !== undefined) return 1;
        return (a.title || '').localeCompare(b.title || '');
    });

    setCache('lessons', lessons);
    return lessons;
};

export const fetchUserData = async (): Promise<any | null> => {
    const user = auth.currentUser;
    if (!user) return null;

    const cached = getCached<any>(`user_${user.uid}`);
    if (cached) return cached;

    const snap = await getDoc(doc(db, "users", user.uid));
    if (!snap.exists()) return null;

    const data = { ...snap.data(), uid: user.uid };
    setCache(`user_${user.uid}`, data);
    return data;
};

// Force-refresh user data (after streak update, score change, etc.)
export const refreshUserData = async (): Promise<any | null> => {
    const user = auth.currentUser;
    if (!user) return null;
    invalidateCache(`user_${user.uid}`);
    return fetchUserData();
};

export const fetchTopLearners = async (count = 5): Promise<any[]> => {
    const cacheKey = `topLearners_${count}`;
    const cached = getCached<any[]>(cacheKey);
    if (cached) return cached;

    const q = query(collection(db, "users"), orderBy("points", "desc"), limit(count));
    const snap = await getDocs(q);
    const learners = snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        points: Number(d.data().points || 0)
    }));

    setCache(cacheKey, learners);
    return learners;
};

export const fetchDailyWord = async (): Promise<any> => {
    // 1. Check if we already have a word for today in LocalStorage
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const stored = localStorage.getItem('dailyWord_record');
    if (stored) {
        const record = JSON.parse(stored);
        if (record.date === today) return record.word;
    }

    // 2. Fetch all available words from cache or Firestore
    let allWords = getCached<any[]>('allDailyWords');
    if (!allWords) {
        const snap = await getDocs(collection(db, "dailyWords"));
        allWords = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setCache('allDailyWords', allWords);
    }

    if (!allWords || allWords.length === 0) {
        return { word: "Vhuthu", meaning: "Humanity", example: "Vhuthu ndi tshumelo.", explanation: "Default word." };
    }

    // 3. Filter out words seen recently (stored in LocalStorage)
    const seenIds = JSON.parse(localStorage.getItem('seenWordIds') || '[]');
    let candidates = allWords.filter(w => !seenIds.includes(w.id));

    // 4. If all words seen, reset the cycle
    if (candidates.length === 0) {
        candidates = allWords;
        localStorage.setItem('seenWordIds', '[]');
    }

    // 5. Pick a random word from candidates
    const picked = candidates[Math.floor(Math.random() * candidates.length)];

    // 6. Save as today's word and mark as seen
    localStorage.setItem('dailyWord_record', JSON.stringify({ date: today, word: picked }));

    // Update seen list
    const newSeen = [...seenIds, picked.id];
    localStorage.setItem('seenWordIds', JSON.stringify(newSeen));

    return picked;
};

export const fetchHistoryData = async (): Promise<any[]> => {
    const cached = getCached<any[]>('history');
    if (cached) return cached;

    const q = query(collection(db, "history"), orderBy("order", "asc"));
    const snap = await getDocs(q);
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    setCache('history', data);
    return data;
};

export const fetchAllUsers = async (): Promise<any[]> => {
    const cached = getCached<any[]>('allUsers');
    if (cached) return cached;

    const snap = await getDocs(collection(db, "users"));
    const users = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    setCache('allUsers', users);
    return users;
};

export const fetchAuditLogs = async (): Promise<any[]> => {
    const cached = getCached<any[]>('auditLogs');
    if (cached) return cached;

    const q = query(collection(db, "logs"), orderBy("timestamp", "desc"));
    const snap = await getDocs(q);
    const logs = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    setCache('auditLogs', logs);
    return logs;
};

export const fetchPuzzles = async (): Promise<any[]> => {
    const cached = getCached<any[]>('puzzles');
    if (cached) return cached;

    const snap = await getDocs(collection(db, "puzzleWords"));
    const puzzles = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    setCache('puzzles', puzzles);
    return puzzles;
};

export const fetchSyllables = async (): Promise<any[]> => {
    const cached = getCached<any[]>('syllablePuzzles');
    if (cached) return cached;

    console.log("Fetching syllables from Firestore...");
    try {
        const snap = await getDocs(collection(db, "syllablePuzzles"));
        const puzzles = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        console.log(`Fetched ${puzzles.length} syllables.`);

        setCache('syllablePuzzles', puzzles);
        return puzzles;
    } catch (error) {
        console.error("Error fetching syllables from Firestore:", error);
        throw error;
    }
};


export const fetchSentences = async (): Promise<any[]> => {
    const cached = getCached<any[]>('sentencePuzzles');
    if (cached) return cached;

    const snap = await getDocs(collection(db, "sentencePuzzles"));
    const puzzles = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    setCache('sentencePuzzles', puzzles);
    return puzzles;
};

// ----- NEW GAME FETCHERS & WARMUP -----

export const fetchPicturePuzzles = async (): Promise<any[]> => {
    const cached = getCached<any[]>('picturePuzzles');
    if (cached) return cached;

    const lessons = await fetchLessons();
    const slides: any[] = [];
    lessons.forEach((lesson: any) => {
        if (lesson.slides) {
            lesson.slides.forEach((slide: any) => {
                if (slide.imageUrl && slide.venda) {
                    slides.push({
                        imageUrl: slide.imageUrl,
                        venda: slide.venda,
                        english: slide.english
                    });
                }
            });
        }
    });

    setCache('picturePuzzles', slides);
    return slides;
};

export const fetchLearnedStats = async (): Promise<any> => {
    const [userData, lessons] = await Promise.all([fetchUserData(), fetchLessons()]);
    if (!userData) return null;

    const completedIds = userData.completedLessons || [];
    const completedLessons = lessons.filter(l => completedIds.includes(l.id));

    // Estimate words learned: Count all unique 'venda' words in slides and questions of completed lessons
    const learnedWords = new Set<string>();
    completedLessons.forEach(lesson => {
        if (lesson.slides) {
            lesson.slides.forEach((s: any) => { if (s.venda) learnedWords.add(s.venda.toLowerCase().trim()); });
        }
        if (lesson.questions) {
            lesson.questions.forEach((q: any) => { if (q.venda) learnedWords.add(q.venda.toLowerCase().trim()); });
        }
    });

    return {
        wordsCount: learnedWords.size,
        lessonsCount: completedIds.length,
        points: userData.points || 0,
        streak: userData.streak || 0,
        level: userData.level || 1,
        completedLessons: completedIds
    };
};

/**
 * Pre-fetches common game data to reduce load times when entering games.
 */
export const warmupGameCache = async () => {
    console.log("Warming up game cache...");
    try {
        await Promise.all([
            fetchLessons(),
            fetchPuzzles(),
            fetchSyllables(),
            fetchSentences(),
            fetchPicturePuzzles(),
            fetchTopLearners(5)
        ]);
        console.log("Game cache warmup complete.");
    } catch (error) {
        console.error("Error warming up game cache:", error);
    }
};
