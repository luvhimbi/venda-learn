import { useEffect, useRef } from 'react';
import { useNotification } from '../contexts/NotificationContext';

export const useRetentionEngine = (userData: any) => {
    const { showNotification } = useNotification();
    const hasFired = useRef(false); // Ensure we only fire once per session/mount

    useEffect(() => {
        if (!userData || hasFired.current) return;

        // Give the UI a moment to load before showing a nudge
        const timer = setTimeout(() => {
            evaluateRetentionTriggers(userData);
            hasFired.current = true;
        }, 2000);

        return () => clearTimeout(timer);
    }, [userData]);

    const evaluateRetentionTriggers = (data: any) => {
        const todayStr = new Date().toISOString().split('T')[0];
        
        // Ensure activityHistory exists to avoid errors
        const history = data.activityHistory || [];
        const activeToday = history.includes(todayStr);

        // 1. STREAK PROTECTOR (Highest Priority)
        // If they have an active streak, but haven't played today
        if (data.streak && data.streak > 0 && !activeToday) {
            showNotification({
                title: "Streak at Risk! 🔥",
                message: `Don't lose your ${data.streak}-day streak. Complete a quick lesson today!`,
                type: 'streak',
                duration: 8000
            });
            return; // Only show one notification at a time
        }

        // 2. WELCOME BACK (Re-engagement)
        // If they haven't been active in the last 3 days
        if (history.length > 0 && !activeToday) {
            // Sort history to find the most recent active date
            const sortedHistory = [...history].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
            const lastActiveStr = sortedHistory[0];
            
            if (lastActiveStr) {
                const lastActiveDate = new Date(lastActiveStr);
                const todayDate = new Date();
                const diffTime = Math.abs(todayDate.getTime() - lastActiveDate.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                
                if (diffDays > 3) {
                    showNotification({
                        title: "We've missed you! 👋",
                        message: "Welcome back to VendaLearn! Ready to pick up where you left off?",
                        type: 'info',
                        duration: 6000
                    });
                    return;
                }
            }
        }

        // 3. MILESTONE MOTIVATOR (Progress)
        // If they are within 50 points of a multiple of 500
        const points = data.points || 0;
        const nextMilestone = Math.ceil((points + 1) / 500) * 500; // E.g., if 460 -> 500
        const distance = nextMilestone - points;

        if (distance > 0 && distance <= 50) {
            showNotification({
                title: "Almost there! ⭐",
                message: `You are only ${distance} points away from ${nextMilestone} LP! Keep going!`,
                type: 'success',
                duration: 6000
            });
            return;
        }
    };
};
