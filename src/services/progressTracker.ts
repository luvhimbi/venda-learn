import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db, auth } from './firebaseConfig';
import { awardPoints, fetchLessons, getMicroLessons, refreshUserData, invalidateCache } from './dataCache';
import { updateStreak } from './streakUtils';

export interface VocabItem {
    id: string; // The native word
    firstSeen: number;
    lastReviewed: number;
    correctCount: number;
    wrongCount: number;
    masteryLevel: number; // 0 to 100
}

export interface SessionResults {
    lessonId: string;
    microLessonId: string;
    courseId: string;
    isFirstTime: boolean;
    finalScore: number;
    totalSessionTime: number;
    quizDuration: number;
    
    // Performance arrays to track specific words
    correctWords: string[];
    wrongWords: string[];
}

/**
 * Recalculates mastery level based on correct/wrong ratios and recency.
 * For now, simple percentage-based calculation.
 */
const calculateMastery = (correct: number, wrong: number): number => {
    const total = correct + wrong;
    if (total === 0) return 0;
    // A simple ratio, but caps at certain thresholds.
    // E.g. 5 correct, 0 wrong = 100%
    const ratio = correct / total;
    return Math.round(ratio * 100);
};

export const progressTracker = {
    /**
     * The unified entry point for saving ALL session data.
     * Replaces scattered writes in GameRoom.
     */
    submitSession: async (results: SessionResults) => {
        if (!auth.currentUser) return null;
        
        const {
            lessonId, microLessonId, courseId,
            isFirstTime, finalScore, totalSessionTime, quizDuration,
            correctWords, wrongWords
        } = results;

        const uid = auth.currentUser.uid;
        const userRef = doc(db, "users", uid);
        const currentData = await refreshUserData();
        
        if (!currentData) return null;

        const mlId = microLessonId || `${lessonId}__ml_0`;
        const studyDuration = Math.max(0, totalSessionTime - quizDuration);

        const updateData: any = {};
        
        // --- 1. CURRICULUM PROGRESS ---
        if (isFirstTime) {
            updateData.completedLessons = arrayUnion(mlId);
            updateData.lastLessonId = null;
            updateData[`microLessonProgress.${mlId}`] = {
                completed: true,
                score: finalScore,
                quizDuration,
                studyDuration,
                totalDuration: totalSessionTime,
                timestamp: new Date().toISOString()
            };

            // Check if course is fully completed
            const lessons = await fetchLessons();
            const foundCourse = lessons.find((l: any) => l.id === lessonId);
            if (foundCourse) {
                const allMls = getMicroLessons(foundCourse);
                const alreadyCompleted = currentData.completedLessons || [];
                const nowCompleted = [...alreadyCompleted, mlId];
                
                const allMlsDone = allMls.every((ml: any) => nowCompleted.includes(ml.id));
                if (allMlsDone) {
                    updateData.completedCourses = arrayUnion(courseId);
                }
            }
        }

        // --- 2. KNOWLEDGE GRAPH (VOCABULARY) ---
        // Build the new vocabulary map state
        const currentVocab: Record<string, VocabItem> = currentData.vocabulary || {};
        const now = Date.now();

        // Process correct words
        correctWords.forEach(word => {
            const key = word.toLowerCase().trim();
            if (!key) return;
            
            const existing = currentVocab[key] || {
                id: key,
                firstSeen: now,
                correctCount: 0,
                wrongCount: 0
            };
            
            existing.correctCount += 1;
            existing.lastReviewed = now;
            existing.masteryLevel = calculateMastery(existing.correctCount, existing.wrongCount);
            
            currentVocab[key] = existing;
        });

        // Process wrong words
        wrongWords.forEach(word => {
            const key = word.toLowerCase().trim();
            if (!key) return;
            
            const existing = currentVocab[key] || {
                id: key,
                firstSeen: now,
                correctCount: 0,
                wrongCount: 0
            };
            
            existing.wrongCount += 1;
            existing.lastReviewed = now;
            existing.masteryLevel = calculateMastery(existing.correctCount, existing.wrongCount);
            
            currentVocab[key] = existing;
        });

        if (Object.keys(currentVocab).length > 0) {
            updateData.vocabulary = currentVocab;
        }

        // --- 3. BATched WRITE ---
        if (Object.keys(updateData).length > 0) {
            await updateDoc(userRef, updateData);
        }

        // --- 4. ENGAGEMENT (XP & STREAKS) ---
        if (isFirstTime && finalScore > 0) {
            await awardPoints(finalScore);
        }
        
        // This will update activity history and evaluate streaks
        const streakResult = await updateStreak(uid);
        
        // Invalidate caches to refresh UI
        invalidateCache(`user_${uid}`);
        invalidateCache('topLearners');

        return streakResult;
    },

    /**
     * Returns vocabulary items sorted by weakness (lowest mastery first).
     * Filters out words with mastery >= threshold.
     */
    getWeakWords: async (maxCount = 20, masteryThreshold = 80): Promise<VocabItem[]> => {
        const userData = await refreshUserData();
        if (!userData?.vocabulary) return [];

        const vocab: Record<string, VocabItem> = userData.vocabulary;
        const weakWords = Object.values(vocab)
            .filter(v => v.masteryLevel < masteryThreshold && (v.correctCount + v.wrongCount) > 0)
            .sort((a, b) => a.masteryLevel - b.masteryLevel);

        return weakWords.slice(0, maxCount);
    },

    /**
     * Generates MC quiz questions from weak vocabulary by cross-referencing lesson data.
     * Each question asks "What does X mean?" with the correct translation + distractors.
     */
    generateWeakWordQuiz: async (maxQuestions = 10): Promise<any[]> => {
        const weakWords = await progressTracker.getWeakWords(maxQuestions * 2);
        if (weakWords.length === 0) return [];

        // Fetch all lesson data to find the English translations for each weak word
        const lessons = await fetchLessons();
        const wordMap = new Map<string, { native: string; english: string }>();
        
        lessons.forEach((course: any) => {
            getMicroLessons(course).forEach((ml: any) => {
                ml.slides?.forEach((s: any) => {
                    const native = (s.nativeWord || s.native || s.word || s.venda || s.tshivenda || '').toLowerCase().trim();
                    const english = s.english || '';
                    if (native && english) wordMap.set(native, { native, english });
                });
                ml.questions?.forEach((q: any) => {
                    const native = (q.nativeWord || q.word || q.tshivenda || q.venda || '').toLowerCase().trim();
                    const english = q.english || q.correctAnswer || '';
                    if (native && english) wordMap.set(native, { native, english });
                });
            });
        });

        // Build pool of all available English translations for distractors
        const allEnglish = Array.from(wordMap.values()).map(v => v.english);

        // Generate quiz questions
        const questions: any[] = [];
        for (const weakItem of weakWords) {
            const match = wordMap.get(weakItem.id);
            if (!match) continue;

            // Pick 3 random distractors (excluding correct answer)
            const distractors = allEnglish
                .filter(e => e.toLowerCase() !== match.english.toLowerCase())
                .sort(() => 0.5 - Math.random())
                .slice(0, 3);

            if (distractors.length < 2) continue; // Not enough distractors

            const options = [...distractors, match.english].sort(() => 0.5 - Math.random());

            questions.push({
                id: Date.now() + Math.random(),
                type: 'multiple-choice',
                question: `What does "${match.native}" mean?`,
                nativeWord: match.native,
                options,
                correctAnswer: match.english,
                explanation: `"${match.native}" means "${match.english}"`,
                masteryLevel: weakItem.masteryLevel,
                wrongCount: weakItem.wrongCount
            });

            if (questions.length >= maxQuestions) break;
        }

        return questions;
    }
};
