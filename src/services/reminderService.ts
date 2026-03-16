import { db, auth } from './firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';

export interface ReminderSettings {
    reminderEnabled: boolean;
    reminderTime: string;
}

export const updateReminderSettings = async (settings: ReminderSettings) => {
    if (!auth.currentUser) return;
    
    try {
        const userRef = doc(db, "users", auth.currentUser.uid);
        await updateDoc(userRef, {
            reminderEnabled: settings.reminderEnabled,
            reminderTime: settings.reminderTime
        });
        return true;
    } catch (error) {
        console.error("Error updating reminder settings:", error);
        return false;
    }
};

export const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
        console.log("This browser does not support desktop notification");
        return false;
    }

    if (Notification.permission === 'granted') {
        return true;
    }

    if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }

    return false;
};
