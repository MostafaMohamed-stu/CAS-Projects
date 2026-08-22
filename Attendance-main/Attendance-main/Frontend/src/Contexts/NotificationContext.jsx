import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import api from '../Services/api';
import { useAuth } from './AuthContext';
import { app, getMessaging, getToken, onMessage } from '../Services/firebase'; // Import Firebase app and getMessaging

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState(() => {
    try {
      const stored = localStorage.getItem('notifications');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const lastNotificationIdRef = useRef(0);

  const { user } = useAuth();

  useEffect(() => {
    try {
      const stored = localStorage.getItem('lastNotificationId');
      lastNotificationIdRef.current = stored ? parseInt(stored) : 0;
    } catch {
      lastNotificationIdRef.current = 0;
    }
  }, []);

  const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  useEffect(() => {
    if (!user?.id) return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return;

    (async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return;

        const registration = await navigator.serviceWorker.ready;
        const existing = await registration.pushManager.getSubscription();
        if (existing) return;

        const resp = await api.get('/api/Push/public-key');
        const publicKey = resp?.data?.publicKey;
        if (!publicKey) return;

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey)
        });

        const json = subscription.toJSON();

        await api.post('/api/Push/subscribe', {
          userId: parseInt(user.id),
          endpoint: subscription.endpoint,
          keys: {
            p256dh: json?.keys?.p256dh,
            auth: json?.keys?.auth,
          },
        });
      } catch (e) {
        console.error('[WebPush] Failed to subscribe', e);
      }
    })();
  }, [user?.id]);

  useEffect(() => {
    console.log("[NotificationContext] Main useEffect triggered. User ID:", user?.id);
    let intervalId;
    if (user?.id) {
        const fetchNotifications = () => {
            console.log(`[Notifications] Fetching for user ID: ${user.id}`);
            api.get(`/api/Notifications/for-user/${user.id}`)
            .then(resp => {
              if (Array.isArray(resp.data)) {
                const unread = resp.data.filter(n => !n.isRead);
                const maxUnreadId = unread.length > 0 ? Math.max(...unread.map(n => n.id)) : 0;

                const lastSeenId = lastNotificationIdRef.current;

                if (maxUnreadId > lastSeenId) {
                    const newUnreads = unread.filter(n => n.id > lastSeenId);
                    newUnreads.forEach(item => {
                        if ("Notification" in window && Notification.permission === "granted") {
                            new Notification("Attendance Alert", {
                                body: item.message,
                                icon: '/Logo.png',
                                badge: '/Logo.png',
                                tag: `notif-${item.id}` 
                            });
                        }
                    });
                    lastNotificationIdRef.current = maxUnreadId;
                    localStorage.setItem('lastNotificationId', maxUnreadId.toString());
                }

                setNotifications(resp.data);
              }
            })
            .catch(() => {
              // fallback handled by initial state
            });
        };

        fetchNotifications();
        intervalId = setInterval(fetchNotifications, 5000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [user?.id]);

  // Dedicated useEffect for Firebase Messaging initialization
  useEffect(() => {
    if (!('Notification' in window) || !('serviceWorker' in navigator) || !user?.id) return;

    // Don't attempt FCM if permission is already denied — avoids the console error
    if (Notification.permission === 'denied') return;

    console.log("[FCM] Attempting to initialize Firebase Messaging for user:", user.id);
    const messagingInstance = getMessaging(app);

    if (!messagingInstance) {
      console.warn("[FCM] Messaging instance is null or undefined. FCM will not be initialized.");
      return;
    }

    navigator.serviceWorker.ready.then(async registration => {
      try {
        // Only request the token if permission is already granted; don't prompt again here
        // (the WebPush effect above already handles the permission request)
        if (Notification.permission !== 'granted') return;

        const currentToken = await getToken(messagingInstance, {
          vapidKey: 'BPscwZ-VdUcMxFP_u1vmSJ8fvVabg-E5I_-dsOK2hT_yVy9kT9nK4njNTcjLhg8L0bHohVAFFG2Pbfiphzy97pU',
          serviceWorkerRegistration: registration
        });

        if (currentToken) {
          console.log("[FCM] Token obtained.");
          try {
            await api.post('/api/Push/subscribe-fcm', {
              userId: parseInt(user.id),
              fcmToken: currentToken
            });
            console.log("[FCM] Token synced with backend.");
          } catch (apiError) {
            console.error("[FCM] Error syncing token with backend:", apiError);
          }
        }
      } catch (err) {
        // Only log non-permission errors to avoid noise when permission is blocked
        if (!err?.message?.includes('permission')) {
          console.error('[FCM] An error occurred while retrieving token.', err);
        }
      }
    });

    // Handle incoming messages while in foreground
    onMessage(messagingInstance, (payload) => {
      console.log('[FCM] Message received.', payload);
      if (Notification.permission === 'granted') {
        new Notification(payload.notification.title, {
          body: payload.notification.body,
          icon: '/Logo.png',
          badge: '/Logo.png',
        });
      }
    });
  }, [user?.id]);

  useEffect(() => {
    try {
      localStorage.setItem('notifications', JSON.stringify(notifications));
    } catch (error) {
      console.error("Failed to save notifications to localStorage", error);
    }
  }, [notifications]);

  const addNotification = (notification) => {
    setNotifications((prevNotifications) => {
      const newNotification = {
        id: Date.now(), // Simple unique ID
        isRead: false,
        createdAt: new Date().toISOString(),
        ...notification,
      };
      // Trigger desktop notification
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Attendance Notification", {
          body: newNotification.message,
        });
      }
      return [newNotification, ...prevNotifications];
    });
  };

  const markNotificationAsRead = (id) => {
    try {
      const userRaw = localStorage.getItem('user');
      const user = userRaw ? JSON.parse(userRaw) : null;
      if (user?.id) {
        api.post(`/api/Notifications/mark-read/${user.id}/${id}`).catch(() => {});
      }
    } catch {}
    setNotifications((prevNotifications) =>
      prevNotifications.map((notif) =>
        notif.id === id ? { ...notif, isRead: true } : notif
      )
    );
  };

  const markAllNotificationsAsRead = () => {
    try {
      const userRaw = localStorage.getItem('user');
      const user = userRaw ? JSON.parse(userRaw) : null;
      if (user?.id) {
        const toMark = notifications.filter(n => !n.isRead).map(n => n.id);
        toMark.forEach(id => api.post(`/api/Notifications/mark-read/${user.id}/${id}`).catch(() => {}));
      }
    } catch {}
    setNotifications((prevNotifications) =>
      prevNotifications.map((notif) => ({ ...notif, isRead: true }))
    );
  };

  const unreadCount = notifications.filter((notif) => !notif.isRead).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        unreadCount,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
