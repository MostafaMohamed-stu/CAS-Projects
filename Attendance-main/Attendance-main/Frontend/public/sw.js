importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBIX2WjSxeAiHbEGev1u53DzGpZGmnExX0",
  authDomain: "attendance-28f89.firebaseapp.com",
  projectId: "attendance-28f89",
  storageBucket: "attendance-28f89.firebasestorage.app",
  messagingSenderId: "284330471098",
  appId: "1:284330471098:web:a85228865db3597cb71c83",
  measurementId: "G-KBNK5D32QX"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload?.notification?.title || 'Notification';
  const notificationOptions = {
    body: payload?.notification?.body || '',
    icon: '/Logo.png',
    badge: '/Logo.png',
    data: payload?.data || {}
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    try {
      data = { body: event.data ? event.data.text() : '' };
    } catch {
      data = {};
    }
  }

  const title = data.title || 'Notification';
  const options = {
    body: data.body || '',
    icon: data.icon || '/Logo.png',
    badge: data.badge || '/Logo.png',
    data: data.data || {}
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification?.data?.url || '/';

  event.waitUntil(
    (async () => {
      const allClients = await clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of allClients) {
        if ('focus' in client) {
          await client.focus();
          if ('navigate' in client) {
            await client.navigate(url);
          }
          return;
        }
      }
      if (clients.openWindow) {
        await clients.openWindow(url);
      }
    })()
  );
});
