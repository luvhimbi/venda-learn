import { useEffect, useRef } from 'react';
import { useNotification } from '../contexts/NotificationContext';

export const useRetentionEngine = (userData: any, shouldDelay: boolean = false) => {
    const { showNotification } = useNotification();
    const hasFired = useRef(false); // Ensure we only fire once per session/mount

    useEffect(() => {
        if (!userData || hasFired.current || shouldDelay) return;

        // Give the UI a moment to load before showing a nudge
        const timer = setTimeout(() => {
            evaluateRetentionTriggers(userData);
            hasFired.current = true;
        }, 1500);

        // For Scheduled Reminders: Check every minute if they are still on the page
        const interval = setInterval(() => {
            if (userData?.reminderEnabled) {
                evaluateRetentionTriggers(userData);
            }
        }, 60000); // 1 minute

        return () => {
            clearTimeout(timer);
            clearInterval(interval);
        };
    }, [userData, shouldDelay]);

    const evaluateRetentionTriggers = (data: any) => {
        // Enforce a 10-minute global cooldown using localStorage
        const lastShown = localStorage.getItem('vendalearn_last_nudge');
        if (lastShown) {
            const timeSince = Date.now() - parseInt(lastShown, 10);
            if (timeSince < 10 * 60 * 1000) {
                return; // Skip if less than 10 mins
            }
        }

        const todayStr = new Date().toISOString().split('T')[0];
        
        // Ensure activityHistory exists to avoid errors
        const history = data.activityHistory || [];
        const activeToday = history.includes(todayStr);

        // Helper to mark fired
        const fireNotification = (options: any) => {
            showNotification(options);
            localStorage.setItem('vendalearn_last_nudge', Date.now().toString());
        };

        // 1. STREAK PROTECTOR (Highest Priority)
        // If they have an active streak, but haven't played today
        if (data.streak && data.streak > 0 && !activeToday) {
            const lastStreakNudge = localStorage.getItem('vendalearn_last_streak_risk_date');
            if (lastStreakNudge !== todayStr) {
                fireNotification({
                    title: "Streak at Risk!",
                    message: `Don't lose your ${data.streak}-day streak. Complete a quick lesson today!`,
                    type: 'streak',
                    duration: 8000
                });
                localStorage.setItem('vendalearn_last_streak_risk_date', todayStr);
                return; // Only show one notification at a time
            }
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
                    fireNotification({
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
            fireNotification({
                title: "Almost there! ⭐",
                message: `You are only ${distance} points away from ${nextMilestone} XP! Keep going!`,
                type: 'success',
                duration: 6000
            });
            return;
        }

        // 4. SCHEDULED REMINDER (Time-based)
        if (data.reminderEnabled && data.reminderTime && !activeToday) {
            const now = new Date();
            const [remHour, remMin] = data.reminderTime.split(':').map(Number);
            
            // Check if we are within the reminder hour/minute block
            const isMatch = now.getHours() === remHour && now.getMinutes() === remMin;
            
            if (isMatch) {
                // Check if we already fired a reminder today to avoid multiple notifications in the same minute
                const lastReminderDate = localStorage.getItem('vendalearn_last_reminder_date');
                if (lastReminderDate !== todayStr) {
                    fireNotification({
                        title: "Time to Learn! 📚",
                        message: "It's your scheduled time for Tshivenda! Ready for a quick lesson?",
                        type: 'info',
                        duration: 8000
                    });
                    localStorage.setItem('vendalearn_last_reminder_date', todayStr);
                }
            }
        }
    };
};
