// src/services/achievementService.ts
import { db } from './firebaseConfig';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import type { Trophy } from '../types/achievements';

export const ALL_TROPHIES: Trophy[] = [
    {
        id: 'first_login',
        title: 'Dzhina (Enter)',
        description: 'Awarded for your first login to VendaLearn! Welcome warrior.',
        icon: 'bi-door-open-fill',
        color: '#10b981', // Emerald
        rarity: 'bronze',
        requirement: { type: 'login', value: 1 }
    },
    {
        id: 'level_5',
        title: 'Muhali (Warrior)',
        description: 'Reach Level 5 to prove your dedication.',
        icon: 'bi-patch-check-fill',
        color: '#4f46e5', // Indigo
        rarity: 'silver',
        requirement: { type: 'level', value: 5 }
    },
    {
        id: 'points_1000',
        title: 'Vhatali (Wise)',
        description: 'Earn 1000 LP to show your wisdom in Tshivenda.',
        icon: 'bi-gem',
        color: '#f59e0b', // Amber
        rarity: 'silver',
        requirement: { type: 'points', value: 1000 }
    },
    {
        id: 'streak_3',
        title: 'Vhudambudzi (Progress)',
        description: 'Maintain a 3-day learning streak.',
        icon: 'bi-fire',
        color: '#ef4444', // Red
        rarity: 'bronze',
        requirement: { type: 'streak', value: 3 }
    },
    {
        id: 'lessons_5',
        title: 'Muthu (Person)',
        description: 'Complete 5 micro-lessons.',
        icon: 'bi-book-half',
        color: '#8b5cf6', // Violet
        rarity: 'bronze',
        requirement: { type: 'lessons', value: 5 }
    },
    {
        id: 'points_5000',
        title: 'Thovhele (King)',
        description: 'Earn 5000 LP. You are a true master.',
        icon: 'bi-trophy-fill',
        color: '#facc15', // Yellow
        rarity: 'gold',
        requirement: { type: 'points', value: 5000 }
    }
];

/**
 * Checks which trophies the user is eligible for but hasn't earned yet.
 */
export const checkAchievements = (userData: any, earnedIds: string[] = []): Trophy[] => {
    if (!userData) return [];

    return ALL_TROPHIES.filter(trophy => {
        // Skip if already earned
        if (earnedIds.includes(trophy.id)) return false;

        const { type, value } = trophy.requirement;

        switch (type) {
            case 'login':
                return true; // Simple login trophy
            case 'level':
                return (userData.level || 1) >= value;
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
    if (!uid || trophyIds.length === 0) return;

    try {
        const userRef = doc(db, "users", uid);
        await updateDoc(userRef, {
            trophies: arrayUnion(...trophyIds)
        });
        return true;
    } catch (error) {
        console.error("Error awarding trophies:", error);
        return false;
    }
};
