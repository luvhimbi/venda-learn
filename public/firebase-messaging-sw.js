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

messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/images/vendalearn.png'
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
