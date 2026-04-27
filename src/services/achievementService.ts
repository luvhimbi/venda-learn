// src/services/achievementService.ts
import { db } from './firebaseConfig';
import type { Firestore } from 'firebase/firestore';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import type { Trophy } from '../types/achievements';

export const ENABLE_TROPHIES = false; // [TOGGLE] Set to false to disable trophies across the app

export const ALL_TROPHIES: Trophy[] = [
    {
        id: 'first_login',
        title: 'The First Step',
        description: 'Awarded for your first login to Chommie. Your journey to mastery begins here.',
        icon: 'bi-door-open-fill',
        color: '#10b981', // Emerald
        rarity: 'bronze',
        requirement: { type: 'login', value: 1 }
    },
    {
        id: 'level_5',
        title: 'Aspiring Scholar',
        description: 'Earn 1,000 XP. You are building a strong foundation in your target language.',
        icon: 'bi-patch-check-fill',
        color: '#4f46e5', // Indigo
        rarity: 'silver',
        requirement: { type: 'points', value: 1000 }
    },
    {
        id: 'level_10',
        title: 'Rising Champion',
        description: 'Earn 2,000 XP. The community watches your ascent with pride.',
        icon: 'bi-graph-up-arrow',
        color: '#a855f7', // Purple
        rarity: 'silver',
        requirement: { type: 'points', value: 2000 }
    },
    {
        id: 'level_25',
        title: 'Noble Sage',
        description: 'Earn 5,000 XP. Your wisdom and dedication are recognized by the community.',
        icon: 'bi-star-fill',
        color: '#8b5cf6', // Violet
        rarity: 'gold',
        requirement: { type: 'points', value: 5000 }
    },
    {
        id: 'level_50',
        title: 'Living Legend',
        description: 'Earn 10,000 XP. You have reached elite fluency on your learning path.',
        icon: 'bi-stars',
        color: '#f43f5e', // Rose
        rarity: 'special',
        requirement: { type: 'points', value: 10000 }
    },
    {
        id: 'points_1000',
        title: 'Treasure Hunter',
        description: 'Earn 1000 XP. You are gathering the precious riches of knowledge.',
        icon: 'bi-gem',
        color: '#f59e0b', // Amber
        rarity: 'silver',
        requirement: { type: 'points', value: 1000 }
    },
    {
        id: 'points_5000',
        title: 'Great Orator',
        description: 'Earn 5000 XP. You speak with the authority of a master.',
        icon: 'bi-trophy-fill',
        color: '#facc15', // Yellow
        rarity: 'gold',
        requirement: { type: 'points', value: 5000 }
    },
    {
        id: 'points_10000',
        title: 'Wealth of Wisdom',
        description: 'Accumulate 10,000 XP. A true powerhouse of language learning.',
        icon: 'bi-lightning-charge-fill',
        color: '#3b82f6', // Blue
        rarity: 'gold',
        requirement: { type: 'points', value: 10000 }
    },
    {
        id: 'points_25000',
        title: 'Victory Knight',
        description: '25,000 XP! You have reached the elite echelons of learning.',
        icon: 'bi-shield-fill',
        color: '#3b82f6', // Blue
        rarity: 'gold',
        requirement: { type: 'points', value: 25000 }
    },
    {
        id: 'points_50000',
        title: 'The Ultimate Guide',
        description: '50,000 XP achieved! You light the way for all future learners.',
        icon: 'bi-shield-shaded',
        color: '#111827', // Dark
        rarity: 'special',
        requirement: { type: 'points', value: 50000 }
    },
    {
        id: 'streak_3',
        title: 'Reliable Learner',
        description: 'Maintain a 3-day streak. Consistency is the secret to fluency.',
        icon: 'bi-fire',
        color: '#ef4444', // Red
        rarity: 'bronze',
        requirement: { type: 'streak', value: 3 }
    },
    {
        id: 'streak_7',
        title: 'Dedicated Warrior',
        description: 'A full week of learning! Your habits are paving the way to success.',
        icon: 'bi-calendar-check',
        color: '#10b981', // Emerald
        rarity: 'silver',
        requirement: { type: 'streak', value: 7 }
    },
    {
        id: 'streak_30',
        title: 'Eternal Flame',
        description: '30 days of dedication. Your passion for learning burns brighter than ever.',
        icon: 'bi-calendar-heart',
        color: '#ec4899', // Pink
        rarity: 'gold',
        requirement: { type: 'streak', value: 30 }
    },
    {
        id: 'streak_100',
        title: 'Guardian of Heritage',
        description: '100 day streak! You are now a pillar of the Chommie learning community.',
        icon: 'bi-infinity',
        color: '#6366f1', // Indigo
        rarity: 'special',
        requirement: { type: 'streak', value: 100 }
    },
    {
        id: 'lessons_5',
        title: 'Culture Voyager',
        description: 'Complete 5 micro-lessons. Your exploration into our world has begun.',
        icon: 'bi-book-half',
        color: '#8b5cf6', // Violet
        rarity: 'bronze',
        requirement: { type: 'lessons', value: 5 }
    },
    {
        id: 'lessons_10',
        title: 'Diligent Beginner',
        description: 'Complete 10 micro-lessons. Every word is a brick in your foundation.',
        icon: 'bi-journal-bookmark-fill',
        color: '#14b8a6', // Teal
        rarity: 'bronze',
        requirement: { type: 'lessons', value: 10 }
    },
    {
        id: 'lessons_20',
        title: 'Rooted Scholar',
        description: 'Complete 20 micro-lessons. You are deeply planted in the soil of knowledge.',
        icon: 'bi-journal-check',
        color: '#22c55e', // Green
        rarity: 'silver',
        requirement: { type: 'lessons', value: 20 }
    },
    {
        id: 'lessons_30',
        title: 'Steadfast Student',
        description: '30 micro-lessons completed. You are nearly halfway to total mastery.',
        icon: 'bi-bookmark-check-fill',
        color: '#f59e0b', // Amber
        rarity: 'silver',
        requirement: { type: 'lessons', value: 30 }
    },
    {
        id: 'lessons_40',
        title: 'Master Builder',
        description: '40 micro-lessons completed. Your speech is becoming a work of art.',
        icon: 'bi-mortarboard',
        color: '#06b6d4', // Cyan
        rarity: 'gold',
        requirement: { type: 'lessons', value: 40 }
    },
    {
        id: 'lessons_60',
        title: 'Venda Vanguard',
        description: '60 micro-lessons finished! You have mastered the entire curriculum.',
        icon: 'bi-mortarboard-fill',
        color: '#1e293b', // Slate
        rarity: 'special',
        requirement: { type: 'lessons', value: 60 }
    }
];

/**
 * Checks which trophies the user is eligible for but hasn't earned yet.
 */
export const checkAchievements = (userData: any, earnedIds: string[] = []): Trophy[] => {
    if (!userData || !ENABLE_TROPHIES) return [];

    return ALL_TROPHIES.filter(trophy => {
        // Skip if already earned
        if (earnedIds.includes(trophy.id)) return false;

        const { type, value } = trophy.requirement;

        switch (type) {
            case 'login':
                return true; // Simple login trophy
            case 'points':
                return (userData.points || 0) >= value;
            case 'streak':
                return (userData.streak || 0) >= value;
            case 'lessons':
                return (userData.completedLessons?.length || 0) >= value;
            default:
                return false;
        }
    });
};

/**
 * Awards multiple trophies to a user in Firestore.
 */
export const awardTrophies = async (uid: string, trophyIds: string[]) => {
    if (!uid || trophyIds.length === 0 || !ENABLE_TROPHIES) return;

    try {
        const userRef = doc(db as Firestore, "users", uid);
        await updateDoc(userRef, {
            trophies: arrayUnion(...trophyIds)
        });
        return true;
    } catch (error) {
        console.error("Error awarding trophies:", error);
        return false;
    }
};
