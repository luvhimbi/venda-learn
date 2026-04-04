import { db, auth, messaging } from './firebaseConfig';
import type { Firestore } from 'firebase/firestore';
import { doc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';
import { getToken, onMessage } from 'firebase/messaging';

export interface ReminderSettings {
    reminderEnabled: boolean;
    reminderTime: string;
}

/**
 * Updates user's reminder settings in Firestore
 */
export const updateReminderSettings = async (settings: ReminderSettings) => {
    if (!auth.currentUser) return;
    
    try {
        const userRef = doc(db as Firestore, "users", auth.currentUser.uid);
        await updateDoc(userRef, {
            reminderEnabled: settings.reminderEnabled,
            reminderTime: settings.reminderTime
        });

        // If enabled, also ensure we have a push token
        if (settings.reminderEnabled) {
            await registerForPushNotifications();
        }

        return true;
    } catch (error) {
        console.error("Error updating reminder settings:", error);
        return false;
    }
};

/**
 * Registers the current device for push notifications
 */
export const registerForPushNotifications = async () => {
    if (!auth.currentUser) return;

    try {
        const hasPermission = await requestNotificationPermission();
        if (!hasPermission) return false;

        const token = await getToken(messaging, {
            vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
        });

        if (token) {
            console.log("FCM Token earned:", token);
            const userRef = doc(db as Firestore, "users", auth.currentUser.uid);
            
            // Store token in an array to support multiple devices
            await updateDoc(userRef, {
                fcmTokens: arrayUnion(token),
                lastTokenUpdate: new Date().toISOString()
            });
            return true;
        }
    } catch (error) {
        console.error("Error registering for push notifications:", error);
    }
    return false;
};

/**
 * Requests browser permission for notifications
 */
export const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
        console.warn("This browser does not support desktop notifications");
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

/**
 * Listen for foreground messages (when app is open)
 */
export const listenForMessages = () => {
    onMessage(messaging, (payload) => {
        console.log('Message received in foreground: ', payload);
        // You can show a custom toast here if you want
    });
};

/**
 * Helper to get user's current tokens (for testing/admin)
 */
export const getUserTokens = async (userId: string) => {
    const userSnap = await getDoc(doc(db as Firestore, "users", userId));
    if (userSnap.exists()) {
        return userSnap.data().fcmTokens || [];
    }
    return [];
};


