// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyDktGtTGJDo11ol3FLJGI-ygKFnIZkqzuM",
    authDomain: "venda-learn.firebaseapp.com",
    projectId: "venda-learn",
    storageBucket: "venda-learn.firebasestorage.app",
    messagingSenderId: "931595838430",
    appId: "1:931595838430:web:01f516df83f0b45c6bb34f"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    
    const notificationTitle = payload.notification?.title || 'New Notification';
    const notificationOptions = {
        body: payload.notification?.body || 'You have a new message!',
        icon: '/images/vendalearn.png',
        badge: '/images/vendalearn.png',
        data: payload.data || {}
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click event
self.addEventListener('notificationclick', (event) => {
    console.log('[firebase-messaging-sw.js] Notification click Received.');
    event.notification.close();

    // Open the app when notification is clicked
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            if (clientList.length > 0) {
                let client = clientList[0];
                for (let i = 0; i < clientList.length; i++) {
                    if (clientList[i].focused) {
                        client = clientList[i];
                    }
                }
                return client.focus();
            }
            return clients.openWindow('/');
        })
    );
});

