
export interface TourStep {
    target: string;
    title?: string;
    content: string;
    position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
    mood?: 'happy' | 'excited' | 'sad';
    path?: string; // Support navigating between pages during the tour
}

export const tourSteps: TourStep[] = [
    {
        target: 'body',
        title: "Ndaa! 🦁",
        content: "Welcome to Venda Learn! I'm Ndou, your guide. Let's get you ready for your journey to becoming a Venda Master!",
        position: 'center',
        mood: 'excited',
        path: '/'
    },
    {
        target: '.tour-sidebar-home',
        title: "Command Center",
        content: "This is your Home base. It's where you'll spend most of your time tracking progress.",
        position: 'right',
        mood: 'happy',
        path: '/'
    },
    {
        target: '.game-btn-primary', // Resuming now
        title: "Resume Learning",
        content: "Clicking here takes you right back to your last lesson. Consistency is key, warrior!",
        position: 'top',
        mood: 'excited',
        path: '/'
    },
    {
        target: '.tour-sidebar-lessons',
        title: "Lessons",
        content: "Explore our collection of lessons and improve your Venda skills step by step.",
        position: 'right',
        mood: 'happy',
        path: '/'
    },
    {
        target: '.tour-sidebar-culture',
        title: "Ḓivhazwakale",
        content: "Dive into Venda stories and history. You can even share your favorite parts with friends!",
        position: 'right',
        mood: 'happy',
        path: '/'
    },
    {
        target: '.tour-sidebar-games',
        title: "Games",
        content: "Learning should be fun! Practice your vocabulary with exciting minigames like Word Bomb.",
        position: 'right',
        mood: 'excited',
        path: '/'
    },
    {
        target: '.tour-sidebar-progress',
        title: "Deep Insights",
        content: "Track your detailed stats and see how far you've come on your journey.",
        position: 'right',
        mood: 'happy',
        path: '/'
    },
    {
        target: '.tour-sidebar-footer', // The new clickable user profile card
        title: "Your Profile",
        content: "This is where you manage your growth. Let's take a look at the new redesigned layout!",
        position: 'right',
        mood: 'happy',
        path: '/'
    },
    {
        target: '.tour-profile-tabs', // The new tabs
        title: "Focused Views",
        content: "We've organized everything into three tabs: Overview for stats, Mastery for your path, and Gear for settings.",
        position: 'bottom',
        mood: 'excited',
        path: '/profile'
    },
    {
        target: '.tour-gear-tab', // Selecting the gear tab
        title: "Warrior Gear",
        content: "The Gear tab is where you set reminders and manage rewards. Don't forget to enable notifications!",
        position: 'bottom',
        mood: 'happy',
        path: '/profile'
    },
    {
        target: 'body',
        title: "Ready to Start?",
        content: "You're all set! Go forth and learn. I'll be here if you need any help. Shumela Venda!",
        position: 'center',
        mood: 'excited',
        path: '/'
    }
];
