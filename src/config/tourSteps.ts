
export interface TourStep {
    target: string;
    content: string;
    position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
    mood?: 'happy' | 'excited' | 'sad';
}

export const tourSteps: TourStep[] = [
    {
        target: 'body', // Fallback/Center
        content: "Ndaa! Welcome to Venda Learn! I'm Ndou, and I'll show you around. Click 'Next' to start our tour!",
        position: 'center',
        mood: 'excited'
    },
    {
        target: '.tour-sidebar-home',
        content: "This is your Home base. Here you'll find your daily lessons and progress.",
        position: 'right',
        mood: 'happy'
    },
    {
        target: '.tour-sidebar-lessons',
        content: "Jump into 'Lessons' to start learning new words and phrases!",
        position: 'right',
        mood: 'happy'
    },
    {
        target: '.tour-sidebar-culture',
        content: "Explore Venda history, traditions, and stories in the 'Culture' section.",
        position: 'right',
        mood: 'happy'
    },
    {
        target: '.tour-sidebar-practice',
        content: "Practice speaking with Native Speakers here. Don't be shy!",
        position: 'right',
        mood: 'excited'
    },
    {
        target: '.tour-sidebar-games',
        content: "Love games? Test your Venda skills with our cultural games and challenges!",
        position: 'right',
        mood: 'excited'
    },
    {
        target: '.tour-sidebar-profile',
        content: "Check your profile here to see your badges, stats, and settings.",
        position: 'right',
        mood: 'happy'
    },
    {
        target: '.tour-stats-card', // We need to add this to Home.tsx stats
        content: "Keep an eye on your streak and points here. Consistency is key!",
        position: 'left',
        mood: 'happy'
    },
    {
        target: 'body',
        content: "That's it! You're ready to become a Venda warrior. Let's go!",
        position: 'center',
        mood: 'excited'
    }
];
