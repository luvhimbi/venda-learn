export interface TourStep {
    target: string;
    title?: string;
    content: string;
    position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
    mood?: 'happy' | 'excited' | 'sad';
    path?: string;
}

export const tourSteps: TourStep[] = [
    {
        target: 'body',
        title: "Heita, Chommie! 🇿🇦",
        content: "Welcome to the Chommie Language Companion! I'm Elphie, your guide for this epic cross-country trip. Ready to chat to all 60 million of us? Let's go!",
        position: 'center',
        mood: 'excited',
        path: '/'
    },
    {
        target: '.tour-sidebar-home',
        title: "The Rank",
        content: "This is your main taxi rank! Whether you're heading to KZN for Zulu or the Cape for Xhosa, you start your journey right here.",
        position: 'right',
        mood: 'happy',
        path: '/'
    },
    {
        target: '.game-btn-primary',
        title: "Keep the Engine Running!",
        content: "Don't stall now! Hit this to jump back into your last lesson. Consistency is how you become a local legend!",
        position: 'top',
        mood: 'excited',
        path: '/'
    },
    {
        target: '.tour-sidebar-lessons',
        title: "The Route Map",
        content: "Every language has its own road. Check out the lessons to see the stops you'll make along the way. Sharp-sharp!",
        position: 'right',
        mood: 'happy',
        path: '/'
    },
    {
        target: '.tour-sidebar-games',
        title: "Shisanyama & Games",
        content: "Time for a break? Head over here to play minigames. It's the fun way to make sure the words actually stick in your head!",
        position: 'right',
        mood: 'excited',
        path: '/'
    },
    {
        target: '.tour-sidebar-progress',
        title: "The Logbook",
        content: "Want to see how much petrol you've got in the tank? Track your stats and see how you're climbing the national leaderboard.",
        position: 'right',
        mood: 'happy',
        path: '/'
    },
    {
        target: '.tour-sidebar-footer',
        title: "Your Passport",
        content: "This is your personal corner. We've redesigned it so you can see your 'Visa Stamps' for every language you're mastering. Take a look!",
        position: 'right',
        mood: 'happy',
        path: '/'
    },
    {
        target: '.tour-profile-tabs',
        title: "The Breakdown",
        content: "We've got 'Overview' for your stats, 'Mastery' for your language progress, and 'Gear' to customize your trip.",
        position: 'bottom',
        mood: 'excited',
        path: '/profile'
    },
    {
        target: '.tour-gear-tab',
        title: "Custom Gear",
        content: "The Gear tab is where you set your reminders and pimp your profile. Make sure those notifications are ON so you don't lose your streak!",
        position: 'bottom',
        mood: 'happy',
        path: '/profile'
    },
    {
        target: 'body',
        title: "Aitse! You’re Ready! ",
        content: "The road is open and the vibes are high. Go forth, learn a new tongue, and make some new chommies. Hosh!",
        position: 'center',
        mood: 'excited',
        path: '/'
    }
];





