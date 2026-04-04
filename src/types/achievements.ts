// src/types/achievements.ts

export type RequirementType = 'points' | 'streak' | 'lessons' | 'login';

export interface Trophy {
    id: string;
    title: string;
    description: string;
    icon: string;
    color: string;
    rarity?: 'bronze' | 'silver' | 'gold' | 'special';
    requirement: {
        type: RequirementType;
        value: number;
    };
}
