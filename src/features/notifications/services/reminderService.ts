import { db, auth } from '../../../services/firebaseConfig';
import type { Firestore } from 'firebase/firestore';
import { doc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';

export interface ReminderSettings {
    reminderEnabled: boolean;
    reminderTime: string;
}

/**
 * Utility to convert base64 VAPID key to Uint8Array required for Push Subscription
 */
const urlB64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
};

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
 * Registers the current device for push notifications using Native Web Push (PWABuilder standard)
 */
export const registerForPushNotifications = async () => {
    if (!auth.currentUser) return;

    try {
        const hasPermission = await requestNotificationPermission();
        if (!hasPermission) return false;

        if ('serviceWorker' in navigator && 'PushManager' in window) {
            const registration = await navigator.serviceWorker.ready;
            
            const vapidPublicKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
            if (!vapidPublicKey) {
                console.error("VAPID key not found (VITE_FIREBASE_VAPID_KEY is missing)");
                return false;
            }

            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlB64ToUint8Array(vapidPublicKey)
            });

            console.log("Push Subscription successfully generated:", subscription);
            const userRef = doc(db as Firestore, "users", auth.currentUser.uid);
            
            // Store stringified subscription object in an array to support multiple devices natively
            await updateDoc(userRef, {
                pushSubscriptions: arrayUnion(JSON.stringify(subscription)),
                lastPushUpdate: new Date().toISOString()
            });

            return true;
        } else {
            console.warn("Push notifications are not supported by this browser.");
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
    // Listen for broadcasted messages from the native service-worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('message', (event) => {
            console.log('Message received in foreground via service worker:', event.data);
            // Can be expanded to show custom toasts in app
        });
    }
};

/**
 * Helper to get user's current push subscriptions (for backend push delivery)
 */
export const getUserTokens = async (userId: string) => {
    const userSnap = await getDoc(doc(db as Firestore, "users", userId));
    if (userSnap.exists()) {
        const data = userSnap.data();
        return {
            pushSubscriptions: data.pushSubscriptions || [],
            fcmTokens: data.fcmTokens || [] // Keep legacy FCM tokens if needed for migration
        };
    }
    return { pushSubscriptions: [], fcmTokens: [] };
};







