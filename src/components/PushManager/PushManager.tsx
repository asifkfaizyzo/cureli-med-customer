// src/components/PushManager/PushManager.tsx (do not remove this comment)
// src/components/PushManager/PushManager.tsx

import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';

import { useAuthStore } from '../../store/authStore';
import { useNotificationPreferencesStore } from '../../store/notificationPreferencesStore';
import {
  initializePushNotifications,
  removePushToken,
} from '../../services/pushNotificationService';
import {
  extractTapData,
  handleNotificationTap,
} from '../../utils/notificationTap';

export function PushManager() {
  const status      = useAuthStore((s) => s.status);
  const prevStatus  = useRef<string | null>(null);

  const loadPreferences = useNotificationPreferencesStore(
    (s) => s.loadPreferences,
  );

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = extractTapData(
          response.notification.request.content.data,
        );
        // console.log('[Push] Notification tapped:', data);
        handleNotificationTap(data);
      },
    );

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        // console.log(
        //   '[Push] Notification received in foreground:',
        //   notification.request.content.title,
        // );
      },
    );

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const prev = prevStatus.current;
    prevStatus.current = status;

    if (status === 'authenticated' && prev !== 'authenticated') {
      initializePushNotifications().then((token) => {
        if (token) {
          // console.log('[Push] Initialized with token:', token.slice(0, 30) + '...');
        }
      });

      loadPreferences();
    }

    if (status === 'unauthenticated' && prev === 'authenticated') {
      removePushToken();
    }
  }, [status, loadPreferences]);

  useEffect(() => {
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!response) return;

      const data = extractTapData(
        response.notification.request.content.data,
      );

      if (data) {
        setTimeout(() => handleNotificationTap(data), 500);
      }
    });
  }, []);

  return null;
}