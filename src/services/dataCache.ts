// src/services/dataCache.ts
// Lightweight in-memory cache to avoid redundant Firestore reads across pages.
// Data is fetched once per session and shared between Home, Courses, GameRoom, etc.

import { db, auth } from './firebaseConfig';
import type { Firestore } from 'firebase/firestore';
import { 
    collection, getDocs, doc, getDoc, setDoc, query, orderBy, 
    limit, where, deleteDoc, updateDoc, increment, serverTimestamp, arrayUnion 
} from 'firebase/firestore';
import { getCurrentWeekIdentifier } from './levelUtils';
import { syncStreak } from './streakUtils';
import dayjs from 'dayjs';

interface CacheEntry<T> {
    data: T;
    timestamp: number;
}

const cache = new Map<string, CacheEntry<any>>();

// --- CACHE CONFIGURATION ---
const STALE_TTL = 5 * 60 * 1000;      // 5 minutes: data is "fresh", no need to re-fetch
const CACHE_TTL = 60 * 60 * 1000;     // 1 hour: absolute expiration
const STORAGE_PREFIX = 'imaginators_cache_v1_'; 
const LEGACY_PREFIXES = ['chommie_cache_', 'venda_cache_'];

interface CacheResult<T> {
    data: T | null;
    status: 'fresh' | 'stale' | 'expired' | 'missing';
}

/**
 * Internal helper to retrieve data from memory or localStorage with status.
 */
const getCached = <T>(key: string): CacheResult<T> => {
    const getStatus = (timestamp: number): 'fresh' | 'stale' | 'expired' => {
        const age = Date.now() - timestamp;
        if (age < STALE_TTL) return 'fresh';
        if (age < CACHE_TTL) return 'stale';
        return 'expired';
    };

    // 1. Check in-memory
    const entry = cache.get(key);
    if (entry) {
        const status = getStatus(entry.timestamp);
        if (status === 'expired') {
            cache.delete(key);
            try { localStorage.removeItem(STORAGE_PREFIX + key); } catch (e) {}
            return { data: null, status: 'expired' };
        }
        return { data: entry.data as T, status };
    }

    // 2. Check localStorage
    try {
        let stored = localStorage.getItem(STORAGE_PREFIX + key);
        if (!stored) {
            for (const prefix of LEGACY_PREFIXES) {
                stored = localStorage.getItem(prefix + key);
                if (stored) break;
            }
        }

        if (stored) {
            const parsed = JSON.parse(stored) as CacheEntry<T>;
            const status = getStatus(parsed.timestamp);
            if (status === 'expired') {
                localStorage.removeItem(STORAGE_PREFIX + key);
                LEGACY_PREFIXES.forEach(p => localStorage.removeItem(p + key));
                return { data: null, status: 'expired' };
            }
            cache.set(key, parsed);
            return { data: parsed.data, status };
        }
    } catch (e) {
        console.warn("localStorage read error:", e);
    }

    return { data: null, status: 'missing' };
};

/**
 * Internal helper to commit data to memory and localStorage.
 */
const setCache = <T>(key: string, data: T): void => {
    const entry = { data, timestamp: Date.now() };
    cache.set(key, entry);
    try {
        localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(entry));
    } catch (e) {
        console.warn("localStorage write failed (quota exceeded?):", e);
        try {
            Object.keys(localStorage).forEach(k => {
                if (k.startsWith(STORAGE_PREFIX)) localStorage.removeItem(k);
            });
            localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(entry));
        } catch (_) {}
    }
};

/**
 * Invalidates specific cache keys or all local storage if no key is provided.
 */
export const invalidateCache = (key?: string) => {
    if (key) {
        if (key.endsWith('*')) {
            const prefix = key.slice(0, -1);
            for (const k of cache.keys()) {
                if (k.startsWith(prefix)) cache.delete(k);
            }
            try {
                Object.keys(localStorage).forEach(k => {
                    const isOurKey = k.startsWith(STORAGE_PREFIX) || LEGACY_PREFIXES.some(p => k.startsWith(p));
                    if (!isOurKey) return;
                    const actualKey = k.replace(STORAGE_PREFIX, "").replace(/^(chommie_cache_|venda_cache_)/, "");
                    if (actualKey.startsWith(prefix)) localStorage.removeItem(k);
                });
            } catch (e) {}
        } else {
            cache.delete(key);
            try {
                localStorage.removeItem(STORAGE_PREFIX + key);
                LEGACY_PREFIXES.forEach(p => localStorage.removeItem(p + key));
            } catch (e) {}
        }
    } else {
        cache.clear();
        try {
            Object.keys(localStorage).forEach(k => {
                if (k.startsWith(STORAGE_PREFIX) || LEGACY_PREFIXES.some(p => k.startsWith(p))) {
                    localStorage.removeItem(k);
                }
            });
        } catch (e) {}
    }
};

/**
 * Checks Firestore for a global cache bust version. 
 * Purges local storage if the remote version is higher than stored.
 */
export const checkGlobalCacheBust = async () => {
    try {
        const snap = await getDoc(doc(db as Firestore, "settings", "cache"));
        if (!snap.exists()) return;

        const remoteVersion = snap.data().version || 0;
        const localVersion = parseInt(localStorage.getItem('last_cache_bust_version') || '0');

        if (remoteVersion > localVersion) {
            console.log(`[Cache] Global cache bust triggered (v${localVersion} -> v${remoteVersion})`);
            invalidateCache();
            localStorage.setItem('last_cache_bust_version', remoteVersion.toString());
        }
    } catch (e) {
        console.warn("Global cache bust check failed:", e);
    }
};

/**
 * Increments the remote cache version, forcing all users to refresh their local data.
 * Call this only after significant data updates (e.g. Admin editing lessons).
 */
export const incrementGlobalCacheVersion = async () => {
    try {
        const cacheRef = doc(db as Firestore, "settings", "cache");
        await setDoc(cacheRef, { 
            version: increment(1),
            lastUpdated: serverTimestamp(),
            updatedBy: auth.currentUser?.email || "Admin"
        }, { merge: true });
        
        // Also invalidate our own local cache immediately
        invalidateCache();
        console.log("[Cache] Global cache bust version incremented.");
    } catch (e) {
        console.error("Failed to increment global cache version:", e);
    }
};

// ----- SHARED DATA FETCHERS (SWR Pattern) -----

export const fetchLessons = async (): Promise<any[]> => {
    const { data, status } = getCached<any[]>('lessons');
    
    if (status === 'stale') {
        getDocs(collection(db as Firestore, "lessons")).then(snap => {
            const lessons = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            lessons.sort((a: any, b: any) => (a.order ?? 999) - (b.order ?? 999) || (a.title || '').localeCompare(b.title || ''));
            setCache('lessons', lessons);
        }).catch(() => {});
    }

    if (data && status !== 'expired') return data;

    const snap = await getDocs(collection(db as Firestore, "lessons"));
    const lessons = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    lessons.sort((a: any, b: any) => (a.order ?? 999) - (b.order ?? 999) || (a.title || '').localeCompare(b.title || ''));
    setCache('lessons', lessons);
    return lessons;
};

export const fetchLanguages = async (): Promise<any[]> => {
    const { data, status } = getCached<any[]>('languages');
    if (status === 'stale') {
        getDocs(collection(db as Firestore, "languages")).then(snap => {
            const languages = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setCache('languages', languages);
        }).catch(() => {});
    }
    if (data && status !== 'expired') return data;
    const snap = await getDocs(collection(db as Firestore, "languages"));
    const languages = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    setCache('languages', languages);
    return languages;
};

export const fetchUserData = async (): Promise<any | null> => {
    const user = auth.currentUser;
    if (!user) return null;

    const { data, status } = getCached<any>(`user_${user.uid}`);
    if (status === 'stale') {
        getDoc(doc(db as Firestore, "users", user.uid)).then(snap => {
            if (snap.exists()) setCache(`user_${user.uid}`, { ...snap.data(), uid: user.uid });
        }).catch(() => {});
    }
    if (data && status !== 'expired') return data;

    const snap = await getDoc(doc(db as Firestore, "users", user.uid));
    if (!snap.exists()) return null;
    await syncStreak(user.uid);
    const updatedSnap = await getDoc(doc(db as Firestore, "users", user.uid));
    const finalData = { ...updatedSnap.data(), uid: user.uid };
    setCache(`user_${user.uid}`, finalData);
    return finalData;
};

/**
 * Force-refresh user data (after streak update, score change, etc.)
 */
export const refreshUserData = async (): Promise<any | null> => {
    const user = auth.currentUser;
    if (!user) return null;
    invalidateCache(`user_${user.uid}`);
    return fetchUserData();
};

export const awardPoints = async (points: number): Promise<void> => {
    const user = auth.currentUser;
    if (!user || points <= 0) return;
    try {
        const userRef = doc(db as Firestore, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) return;
        const userData = userSnap.data() as any;
        const currentWeek = getCurrentWeekIdentifier();
        const today = dayjs().format('YYYY-MM-DD'); 
        const updateData: any = { points: increment(points) };
        if (!userData.dailyXP) updateData.dailyXP = { [today]: points };
        else updateData[`dailyXP.${today}`] = increment(points);
        if (userData.lastActiveWeek !== currentWeek) {
            updateData.weeklyXP = points;
            updateData.lastActiveWeek = currentWeek;
        } else updateData.weeklyXP = increment(points);
        await updateDoc(userRef, updateData);
        await refreshUserData();
        invalidateCache('topLearners*');
    } catch (e) {
        console.error("awardPoints error:", e);
    }
};

export const fetchTopLearners = async (count = 5): Promise<any[]> => {
    const cacheKey = `topLearners_${count}`;
    const { data, status } = getCached<any[]>(cacheKey);
    if (status === 'stale') {
        const q = query(collection(db as Firestore, "users"), orderBy("points", "desc"), limit(count));
        getDocs(q).then(snap => {
            const learners = snap.docs.map(d => ({ id: d.id, ...d.data(), points: Number(d.data().points || 0) }));
            setCache(cacheKey, learners);
        }).catch(() => {});
    }
    if (data && status !== 'expired') return data;
    const q = query(collection(db as Firestore, "users"), orderBy("points", "desc"), limit(count));
    const snap = await getDocs(q);
    const learners = snap.docs.map(d => ({ id: d.id, ...d.data(), points: Number(d.data().points || 0) }));
    setCache(cacheKey, learners);
    return learners;
};

export const fetchTopLearnersByWeek = async (count = 20): Promise<any[]> => {
    const currentWeek = getCurrentWeekIdentifier();
    const cacheKey = `topLearners_weekly_${count}_${currentWeek}`;
    const { data, status } = getCached<any[]>(cacheKey);
    if (status === 'stale') {
        const q = query(collection(db as Firestore, "users"), where("lastActiveWeek", "==", currentWeek), orderBy("weeklyXP", "desc"), limit(count));
        getDocs(q).then(snap => {
            const learners = snap.docs.map(d => ({ id: d.id, ...d.data(), points: Number(d.data().weeklyXP || 0) }));
            setCache(cacheKey, learners);
        }).catch(() => {});
    }
    if (data && status !== 'expired') return data;
    try {
        const q = query(collection(db as Firestore, "users"), where("lastActiveWeek", "==", currentWeek), orderBy("weeklyXP", "desc"), limit(count));
        const snap = await getDocs(q);
        const learners = snap.docs.map(d => ({ id: d.id, ...d.data(), points: Number(d.data().weeklyXP || 0) }));
        setCache(cacheKey, learners);
        return learners;
    } catch (e: any) {
        return fetchTopLearners(count);
    }
};

export const fetchDailyWord = async (): Promise<any> => {
    const today = new Date().toISOString().split('T')[0];
    const stored = localStorage.getItem('dailyWord_record');
    if (stored) {
        const record = JSON.parse(stored);
        if (record.date === today) return record.word;
    }
    let allWords = getCached<any[]>('allDailyWords').data;
    if (!allWords) {
        const snap = await getDocs(collection(db as Firestore, "dailyWords"));
        allWords = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setCache('allDailyWords', allWords);
    }
    if (!allWords || allWords.length === 0) return { word: "Vhuthu", meaning: "Humanity" };
    const seenIds = JSON.parse(localStorage.getItem('seenWordIds') || '[]');
    let candidates = allWords.filter(w => !seenIds.includes(w.id));
    if (candidates.length === 0) { candidates = allWords; localStorage.setItem('seenWordIds', '[]'); }
    const picked = candidates[Math.floor(Math.random() * candidates.length)];
    localStorage.setItem('dailyWord_record', JSON.stringify({ date: today, word: picked }));
    localStorage.setItem('seenWordIds', JSON.stringify([...seenIds, picked.id]));
    return picked;
};

// ... Remaining fetchers (AuditLogs, Puzzles, etc.) simplified forbrevity but maintaining patterns ...

export const fetchAuditLogs = async (): Promise<any[]> => {
    const { data, status } = getCached<any[]>('auditLogs');
    const q = query(collection(db as Firestore, "logs"), orderBy("timestamp", "desc"));
    if (status === 'stale') { 
        getDocs(q).then(snap => setCache('auditLogs', snap.docs.map(d => ({ id: d.id, ...d.data() })))).catch(() => {}); 
    }
    if (data && status !== 'expired') return data;
    const snap = await getDocs(q);
    const logs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    setCache('auditLogs', logs);
    return logs;
};

export const fetchPuzzles = async (): Promise<any[]> => {
    const { data, status } = getCached<any[]>('puzzles');
    if (status === 'stale') {
        getDocs(collection(db as Firestore, "puzzleWords")).then(snap => setCache('puzzles', snap.docs.map(d => ({ id: d.id, ...d.data() })))).catch(() => {});
    }
    if (data && status !== 'expired') return data;
    const snap = await getDocs(collection(db as Firestore, "puzzleWords"));
    const puzzles = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    setCache('puzzles', puzzles);
    return puzzles;
};

export const fetchSyllables = async (): Promise<any[]> => {
    const { data, status } = getCached<any[]>('syllablePuzzles');
    if (status === 'stale') {
        getDocs(collection(db as Firestore, "syllablePuzzles")).then(snap => setCache('syllablePuzzles', snap.docs.map(d => ({ id: d.id, ...d.data() })))).catch(() => {});
    }
    if (data && status !== 'expired') return data;
    const snap = await getDocs(collection(db as Firestore, "syllablePuzzles"));
    const puzzles = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    setCache('syllablePuzzles', puzzles);
    return puzzles;
};

export const fetchSentences = async (): Promise<any[]> => {
    const { data, status } = getCached<any[]>('sentencePuzzles');
    if (status === 'stale') {
        getDocs(collection(db as Firestore, "sentencePuzzles")).then(snap => setCache('sentencePuzzles', snap.docs.map(d => ({ id: d.id, ...d.data() })))).catch(() => {});
    }
    if (data && status !== 'expired') return data;
    const snap = await getDocs(collection(db as Firestore, "sentencePuzzles"));
    const puzzles = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    setCache('sentencePuzzles', puzzles);
    return puzzles;
};


// Helper for lessons
export const getMicroLessons = (course: any): any[] => {
    if (course.microLessons && course.microLessons.length > 0) return course.microLessons;
    if (course.slides || course.questions) return [{ id: `${course.id}__ml_0`, title: 'Part 1', slides: course.slides || [], questions: course.questions || [] }];
    return [];
};

export const fetchPicturePuzzles = async (): Promise<any[]> => {
    const { data, status } = getCached<any[]>('picturePuzzles');
    if (status === 'stale') { /* Background revalidation logic simplifies here but usually depends on fetchLessons */ }
    if (data && status !== 'expired') return data;
    const [standaloneSnap, courses] = await Promise.all([getDocs(collection(db as Firestore, "picturePuzzles")), fetchLessons()]);
    const slides: any[] = standaloneSnap.docs.map(d => d.data()).filter(d => d.imageUrl && d.nativeWord);
    courses.forEach((c: any) => getMicroLessons(c).forEach((ml: any) => ml.slides?.forEach((s: any) => { if(s.imageUrl && s.nativeWord) slides.push(s); })));
    setCache('picturePuzzles', slides);
    return slides;
};

export const fetchLearnedStats = async (): Promise<any> => {
    const [userData, courses] = await Promise.all([fetchUserData(), fetchLessons()]);
    if (!userData) return null;
    const completedMlIds = userData.completedLessons || [];
    const learnedWords = new Set<string>();
    courses.forEach((c: any) => getMicroLessons(c).forEach((ml: any) => {
        if (completedMlIds.includes(ml.id)) {
            ml.slides?.forEach((s: any) => { if (s.nativeWord) learnedWords.add(s.nativeWord.toLowerCase().trim()); });
            ml.questions?.forEach((q: any) => { if (q.nativeWord) learnedWords.add(q.nativeWord.toLowerCase().trim()); });
        }
    }));
    return { wordsCount: learnedWords.size, lessonsCount: completedMlIds.length, coursesCount: (userData.completedCourses || []).length, points: userData.points || 0, streak: userData.streak || 0 };
};

export const fetchDailyChallenge = async (): Promise<any[]> => {
    const today = new Date().toISOString().split('T')[0];
    const storageKey = `dailyChallenge_${today}`;
    const stored = localStorage.getItem(storageKey);
    if (stored) return JSON.parse(stored);
    const courses = await fetchLessons();
    let allQuestions: any[] = [];
    courses.forEach((course: any) => getMicroLessons(course).forEach((ml: any) => { if (ml.questions) allQuestions.push(...ml.questions); }));
    const selected = allQuestions.sort(() => 0.5 - Math.random()).slice(0, 20);
    localStorage.setItem(storageKey, JSON.stringify(selected));
    return selected;
};

export const warmupGameCache = async () => {
    try {
        await Promise.all([fetchLessons(), fetchPuzzles(), fetchSyllables(), fetchSentences(), fetchPicturePuzzles(), fetchTopLearners(5)]);
    } catch (error) { console.error("Warmup failed", error); }
};

export const fetchThemeSettings = async (): Promise<any | null> => {
    const { data, status } = getCached<any>('theme_settings');
    if (status === 'stale') {
        getDoc(doc(db as Firestore, "settings", "theme")).then(snap => { if (snap.exists()) setCache('theme_settings', snap.data()); }).catch(() => {});
    }
    if (data && status !== 'expired') return data;
    const snap = await getDoc(doc(db as Firestore, "settings", "theme"));
    if (!snap.exists()) return null;
    setCache('theme_settings', snap.data());
    return snap.data();
};

export const saveThemeSettings = async (settings: any): Promise<void> => {
    await setDoc(doc(db as Firestore, "settings", "theme"), settings, { merge: true });
    setCache('theme_settings', settings);
};


export const fetchAllUsers = async (): Promise<any[]> => {
    const { data, status } = getCached<any[]>('allUsers');
    if (status === 'stale') {
        getDocs(collection(db as Firestore, "users")).then(snap => setCache('allUsers', snap.docs.map(d => ({ id: d.id, ...d.data() })))).catch(() => {});
    }
    if (data && status !== 'expired') return data;
    const snap = await getDocs(collection(db as Firestore, "users"));
    const users = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    setCache('allUsers', users);
    return users;
};

export const fetchChatMetadata = async (chatId: string): Promise<any | null> => {
    const cacheKey = `chat_${chatId}`;
    const { data, status } = getCached<any>(cacheKey);
    if (status === 'stale') {
        getDoc(doc(db as Firestore, "chats", chatId)).then(snap => {
            if (snap.exists()) setCache(cacheKey, { id: snap.id, ...snap.data() });
        }).catch(() => {});
    }
    if (data && status !== 'expired') return data;
    const snap = await getDoc(doc(db as Firestore, "chats", chatId));
    if (!snap.exists()) return null;
    const chatData = { id: snap.id, ...snap.data() };
    setCache(cacheKey, chatData);
    return chatData;
};

export const fetchReviews = async (): Promise<any[]> => {
    const { data, status } = getCached<any[]>('reviews');
    const q = query(collection(db as Firestore, "reviews"), orderBy("timestamp", "desc"));
    if (status === 'stale') { getDocs(q).then(snap => setCache('reviews', snap.docs.map(d => ({ id: d.id, ...d.data() })))).catch(() => {}); }
    if (data && status !== 'expired') return data;
    const snap = await getDocs(q);
    const reviews = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    setCache('reviews', reviews);
    return reviews;
};

export const deleteReview = async (reviewId: string): Promise<void> => {
    await deleteDoc(doc(db as Firestore, "reviews", reviewId));
    invalidateCache('reviews');
};

/**
 * Mastery Tracking: Marks words as learned and updates level progress.
 */
export const completeLevel = async (gameType: string, levelNum: number, wordIds: string[]) => {
    const user = auth.currentUser;
    if (!user) return;

    try {
        const userRef = doc(db as Firestore, "users", user.uid);
        
        // Use an object update to increment the level progress for this specific game type
        // and add word IDs to the learned list.
        await updateDoc(userRef, {
            [`gameLevels.${gameType}`]: levelNum + 1,
            learnedVocabulary: arrayUnion(...wordIds),
            lastActivity: serverTimestamp()
        });
        
        // Invalidate user data cache to reflect new level/vocab
        invalidateCache(`user_${user.uid}`);
        await refreshUserData();
    } catch (e) {
        console.error("Failed to complete level:", e);
    }
};

/**
 * Fetches game content filtered by level and language.
 */
export const fetchGameContentByLevel = async (collectionName: string, langId: string, level: number) => {
    try {
        const q = query(
            collection(db as Firestore, collectionName),
            where("languageId", "==", langId),
            where("level", "==", level)
        );
        const snap = await getDocs(q);
        
        // Deduplicate items base on nativeWord to prevent session repetition if DB has duplicates
        const uniqueItems = new Map<string, any>();
        snap.docs.forEach(d => {
            const data = d.data();
            // Use nativeWord or native or englishWord as fallback for key
            const key = (data.nativeWord || data.native || data.englishWord || "").toLowerCase().trim();
            if (key && !uniqueItems.has(key)) {
                uniqueItems.set(key, { id: d.id, ...data });
            } else if (!key) {
                // If no key, just add it (unlikely for valid content)
                uniqueItems.set(d.id, { id: d.id, ...data });
            }
        });

        return Array.from(uniqueItems.values());
    } catch (e) {
        console.error(`Error fetching ${collectionName} for level ${level}:`, e);
        return [];
    }
};

/**
 * Converts difficulty string to numeric level.
 */
export const difficultyToLevel = (difficulty: string): number => {
    switch (difficulty?.toLowerCase()) {
        case 'beginner': return 1;
        case 'intermediate': return 2;
        case 'advanced': return 3;
        default: return 1;
    }
};

/**
 * Vocabulary Tracking: Adds multiple words to the user's mastered list in a single transaction.
 * Use this at the end of a game session to minimize Firestore write costs.
 */
export const markWordsAsLearned = async (wordIds: string[]) => {
    const user = auth.currentUser;
    if (!user || !wordIds || wordIds.length === 0) return;

    try {
        const userRef = doc(db as Firestore, "users", user.uid);
        await updateDoc(userRef, {
            learnedVocabulary: arrayUnion(...wordIds),
            lastActivity: serverTimestamp()
        });
        invalidateCache(`user_${user.uid}`);
        await refreshUserData();
    } catch (e) {
        console.error("Failed to mark words as learned:", e);
    }
};

/**
 * Vocabulary Tracking: Adds a word to the user's mastered list.
 * Note: For fast gameplay, use markWordsAsLearned() in batch instead.
 */
export const markWordAsLearned = async (wordId: string) => {
    return markWordsAsLearned([wordId]);
};








