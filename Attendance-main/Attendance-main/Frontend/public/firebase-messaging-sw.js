// Scripts for firebase and firebase messaging
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in the messagingSenderId
firebase.initializeApp({
  apiKey: "AIzaSyBIX2WjSxeAiHbEGev1u53DzGpZGmnExX0",
  authDomain: "attendance-28f89.firebaseapp.com",
  projectId: "attendance-28f89",
  storageBucket: "attendance-28f89.firebasestorage.app",
  messagingSenderId: "284330471098",
  appId: "1:284330471098:web:a85228865db3597cb71c83",
  measurementId: "G-KBNK5D32QX"
});

// Retrieve an instance of Firebase Messaging so that it can handle background messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  // Customize notification here
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/Logo.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
