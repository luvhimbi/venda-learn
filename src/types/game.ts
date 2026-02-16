export interface QuestionBase {
    id: number;
    question: string;
    explanation: string;
    type: string;
}

export interface MCQuestion extends QuestionBase {
    type: 'multiple-choice';
    options: string[];
    correctAnswer: string;
}

export interface TFQuestion extends QuestionBase {
    type: 'true-false';
    correctAnswer: boolean;
}

export interface FBQuestion extends QuestionBase {
    type: 'fill-in-the-blank';
    correctAnswer: string;
    hint?: string;
}

export interface MPQuestion extends QuestionBase {
    type: 'match-pairs';
    pairs: { venda: string; english: string }[];
}

export interface LCQuestion extends QuestionBase {
    type: 'listen-and-choose';
    vendaWord: string;
    options: string[];
    correctAnswer: string;
}

export type Question = MCQuestion | TFQuestion | FBQuestion | MPQuestion | LCQuestion;

export interface ScoreBreakdown {
    base: number;
    speed: number;
    streakBonus: number;
    consolation: number;
}
