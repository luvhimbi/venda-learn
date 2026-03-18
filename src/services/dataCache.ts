// src/services/dataCache.ts
// Lightweight in-memory cache to avoid redundant Firestore reads across pages.
// Data is fetched once per session and shared between Home, Courses, GameRoom, etc.

import { db, auth } from './firebaseConfig';
import type { Firestore } from 'firebase/firestore';
import { collection, getDocs, doc, getDoc, setDoc, query, orderBy, limit, where } from 'firebase/firestore';
import { getCurrentWeekIdentifier } from './levelUtils';


interface CacheEntry<T> {
    data: T;
    timestamp: number;
}

const cache = new Map<string, CacheEntry<any>>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours for offline resilience
const STORAGE_PREFIX = 'venda_cache_';

const getCached = <T>(key: string): T | null => {
    // 1. Check in-memory first
    const entry = cache.get(key);
    if (entry) {
        if (Date.now() - entry.timestamp > CACHE_TTL) {
            cache.delete(key);
            // Also invalidate storage if expired
            try { localStorage.removeItem(STORAGE_PREFIX + key); } catch (e) { }
            return null;
        }
        return entry.data as T;
    }

    // 2. Check localStorage (persists across sessions for offline support)
    try {
        const stored = localStorage.getItem(STORAGE_PREFIX + key);
        if (stored) {
            const parsed = JSON.parse(stored) as CacheEntry<T>;
            if (Date.now() - parsed.timestamp > CACHE_TTL) {
                localStorage.removeItem(STORAGE_PREFIX + key);
                return null;
            }
            // Hydrate in-memory cache
            cache.set(key, parsed);
            return parsed.data;
        }
    } catch (e) {
        console.warn("localStorage read error:", e);
    }

    return null;
};

const setCache = <T>(key: string, data: T): void => {
    const entry = { data, timestamp: Date.now() };

    // 1. Write to in-memory
    cache.set(key, entry);

    // 2. Write to localStorage (persists for offline access)
    try {
        localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(entry));
    } catch (e) {
        console.warn("localStorage write failed (quota exceeded?):", e);
        // Clear old cache entries to make space
        try {
            Object.keys(localStorage).forEach(k => {
                if (k.startsWith(STORAGE_PREFIX)) localStorage.removeItem(k);
            });
            localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(entry));
        } catch (_) { }
    }
};

// Invalidate a specific key (e.g. after completing a lesson)
export const invalidateCache = (key?: string) => {
    if (key) {
        cache.delete(key);
        try { localStorage.removeItem(STORAGE_PREFIX + key); } catch (e) { }
    } else {
        cache.clear();
        try {
            // Clear only our keys
            Object.keys(localStorage).forEach(k => {
                if (k.startsWith(STORAGE_PREFIX)) localStorage.removeItem(k);
            });
        } catch (e) { }
    }
};

// ----- SHARED DATA FETCHERS -----

export const fetchLessons = async (): Promise<any[]> => {
    const cached = getCached<any[]>('lessons');
    if (cached) return cached;

    const snap = await getDocs(collection(db as Firestore, "lessons"));
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

/**
 * Normalize a course doc into micro lessons.
 * Supports both new `microLessons[]` format and legacy `slides/questions` format.
 */
export const getMicroLessons = (course: any): any[] => {
    if (course.microLessons && course.microLessons.length > 0) {
        return course.microLessons;
    }
    // Legacy fallback: wrap top-level slides/questions into a single micro lesson
    if (course.slides || course.questions) {
        return [{
            id: `${course.id}__ml_0`,
            title: 'Part 1',
            slides: course.slides || [],
            questions: course.questions || []
        }];
    }
    return [];
};

export const fetchUserData = async (): Promise<any | null> => {
    const user = auth.currentUser;
    if (!user) return null;

    const cached = getCached<any>(`user_${user.uid}`);
    if (cached) return cached;

    const snap = await getDoc(doc(db as Firestore, "users", user.uid));
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

    const q = query(collection(db as Firestore, "users"), orderBy("points", "desc"), limit(count));
    const snap = await getDocs(q);
    const learners = snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        points: Number(d.data().points || 0)
    }));

    setCache(cacheKey, learners);
    return learners;
};

export const fetchTopLearnersByWeek = async (count = 20): Promise<any[]> => {
    const currentWeek = getCurrentWeekIdentifier();
    const cacheKey = `topLearners_weekly_${count}_${currentWeek}`;
    const cached = getCached<any[]>(cacheKey);
    if (cached) return cached;

    try {
        const q = query(
            collection(db as Firestore, "users"),
            where("lastActiveWeek", "==", currentWeek),
            orderBy("weeklyXP", "desc"),
            limit(count)
        );
        const snap = await getDocs(q);
        const learners = snap.docs.map(d => ({
            id: d.id,
            ...d.data(),
            points: Number(d.data().weeklyXP || 0) // We use weeklyXP for the leaderboard points
        }));

        setCache(cacheKey, learners);
        return learners;
    } catch (e: any) {
        console.error("Weekly leaderboard fetch failed:", e);
        // Fallback to total points if weekly query fails (e.g. missing index)
        return fetchTopLearners(count);
    }
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
        const snap = await getDocs(collection(db as Firestore, "dailyWords"));
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

    const q = query(collection(db as Firestore, "history"), orderBy("order", "asc"));
    const snap = await getDocs(q);
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    setCache('history', data);
    return data;
};

export const fetchAllUsers = async (): Promise<any[]> => {
    const cached = getCached<any[]>('allUsers');
    if (cached) return cached;

    const snap = await getDocs(collection(db as Firestore, "users"));
    const users = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    setCache('allUsers', users);
    return users;
};

export const fetchAuditLogs = async (): Promise<any[]> => {
    const cached = getCached<any[]>('auditLogs');
    if (cached) return cached;

    const q = query(collection(db as Firestore, "logs"), orderBy("timestamp", "desc"));
    const snap = await getDocs(q);
    const logs = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    setCache('auditLogs', logs);
    return logs;
};

export const fetchPuzzles = async (): Promise<any[]> => {
    const cached = getCached<any[]>('puzzles');
    if (cached) return cached;

    const snap = await getDocs(collection(db as Firestore, "puzzleWords"));
    const puzzles = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    setCache('puzzles', puzzles);
    return puzzles;
};

export const fetchSyllables = async (): Promise<any[]> => {
    const cached = getCached<any[]>('syllablePuzzles');
    if (cached) return cached;

    console.log("Fetching syllables from Firestore...");
    try {
        const snap = await getDocs(collection(db as Firestore, "syllablePuzzles"));
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

    const snap = await getDocs(collection(db as Firestore, "sentencePuzzles"));
    const puzzles = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    setCache('sentencePuzzles', puzzles);
    return puzzles;
};

export const fetchWordBombWords = async (): Promise<any[]> => {
    const cached = getCached<any[]>('wordBombWords');
    if (cached) return cached;

    const snap = await getDocs(collection(db as Firestore, "wordBombWords"));
    const words = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    setCache('wordBombWords', words);
    return words;
};

export const fetchChatMetadata = async (chatId: string): Promise<any | null> => {
    const cacheKey = `chat_${chatId}`;
    const cached = getCached<any>(cacheKey);
    if (cached) return cached;

    const snap = await getDoc(doc(db as Firestore, "chats", chatId));
    if (!snap.exists()) return null;

    const data = { id: snap.id, ...snap.data() };
    setCache(cacheKey, data);
    return data;
};

// ----- NEW GAME FETCHERS & WARMUP -----

export const fetchPicturePuzzles = async (): Promise<any[]> => {
    const cached = getCached<any[]>('picturePuzzles');
    if (cached) return cached;

    const slides: any[] = [];

    // 1. Fetch from standalone picturePuzzles collection
    try {
        const snap = await getDocs(collection(db as Firestore, "picturePuzzles"));
        snap.docs.forEach(d => {
            const data = d.data();
            if (data.imageUrl && data.venda) {
                slides.push({
                    imageUrl: data.imageUrl,
                    venda: data.venda,
                    english: data.english || ''
                });
            }
        });
    } catch (e) {
        console.error("Error fetching standalone picture puzzles:", e);
    }

    // 2. Derive from lesson slides (backwards compatibility)
    const courses = await fetchLessons();
    courses.forEach((course: any) => {
        const mls = getMicroLessons(course);
        mls.forEach((ml: any) => {
            if (ml.slides) {
                ml.slides.forEach((slide: any) => {
                    if (slide.imageUrl && slide.venda) {
                        slides.push({
                            imageUrl: slide.imageUrl,
                            venda: slide.venda,
                            english: slide.english || ''
                        });
                    }
                });
            }
        });
    });

    setCache('picturePuzzles', slides);
    return slides;
};

export const fetchLearnedStats = async (): Promise<any> => {
    const [userData, courses] = await Promise.all([fetchUserData(), fetchLessons()]);
    if (!userData) return null;

    const completedMlIds = userData.completedLessons || [];
    const completedCourseIds = userData.completedCourses || [];

    // Estimate words learned from completed micro lessons
    const learnedWords = new Set<string>();
    courses.forEach((course: any) => {
        const mls = getMicroLessons(course);
        mls.forEach((ml: any) => {
            if (completedMlIds.includes(ml.id)) {
                if (ml.slides) {
                    ml.slides.forEach((s: any) => { if (s.venda) learnedWords.add(s.venda.toLowerCase().trim()); });
                }
                if (ml.questions) {
                    ml.questions.forEach((q: any) => { if (q.venda) learnedWords.add(q.venda.toLowerCase().trim()); });
                }
            }
        });
    });

    return {
        wordsCount: learnedWords.size,
        lessonsCount: completedMlIds.length,
        coursesCount: completedCourseIds.length,
        points: userData.points || 0,
        streak: userData.streak || 0,
        level: userData.level || 1,
        completedLessons: completedMlIds,
        completedCourses: completedCourseIds
    };
};

/**
 * Pre-fetches common game data to reduce load times when entering games.
 */
/**
 * Fetches 20 random questions for the Daily Challenge.
 * Persists the set in LocalStorage for the current day to ensure consistency.
 */
export const fetchDailyChallenge = async (): Promise<any[]> => {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const storageKey = `dailyChallenge_${today}`;

    // 1. Check LocalStorage for today's challenge
    const stored = localStorage.getItem(storageKey);
    if (stored) {
        return JSON.parse(stored);
    }

    // 2. Fetch all lessons and extract questions
    const courses = await fetchLessons();
    let allQuestions: any[] = [];

    courses.forEach((course: any) => {
        const mls = getMicroLessons(course);
        mls.forEach((ml: any) => {
            if (ml.questions) {
                allQuestions.push(...ml.questions);
            }
        });
    });

    // 3. Shuffle and pick 20
    const shuffled = allQuestions.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 20);

    // 4. Save to LocalStorage
    localStorage.setItem(storageKey, JSON.stringify(selected));

    // Cleanup old keys (optional, simple housekeeping)
    Object.keys(localStorage).forEach(k => {
        if (k.startsWith('dailyChallenge_') && k !== storageKey) {
            localStorage.removeItem(k);
        }
    });

    return selected;
};

export const warmupGameCache = async () => {
    console.log("Warming up game cache...");
    try {
        await Promise.all([
            fetchLessons(),
            fetchPuzzles(),
            fetchSyllables(),
            fetchSentences(),
            fetchPicturePuzzles(),
            fetchTopLearners(5),
            fetchWordBombWords()
        ]);
        console.log("Game cache warmup complete.");
    } catch (error) {
        console.error("Error warming up game cache:", error);
    }
};

// ----- THEME SETTINGS -----
export const fetchThemeSettings = async (): Promise<any | null> => {
    const cached = getCached<any>('theme_settings');
    if (cached) return cached;

    try {
        const snap = await getDoc(doc(db as Firestore, "settings", "theme"));
        if (!snap.exists()) return null;

        const data = snap.data();
        setCache('theme_settings', data);
        return data;
    } catch (e) {
        console.error("fetchThemeSettings error:", e);
        return null;
    }
};

export const saveThemeSettings = async (settings: any): Promise<void> => {
    try {
        await setDoc(doc(db as Firestore, "settings", "theme"), settings, { merge: true });
        setCache('theme_settings', settings);
    } catch (e) {
        console.error("saveThemeSettings error:", e);
        throw e;
    }
};



