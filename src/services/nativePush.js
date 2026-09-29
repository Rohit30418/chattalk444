import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import api from './api';

let initialized = false;
let tokenSyncInFlight = null;

const syncNativeToken = async (token) => {
  const clean = String(token || '').trim();
  if (!clean) return;

  if (tokenSyncInFlight) return tokenSyncInFlight;

  tokenSyncInFlight = api.post('/api/social/fcm/subscribe', {
    token: clean,
    platform: Capacitor.getPlatform(),
  })
    .catch((error) => {
      console.warn('[Native Push] Token sync failed:', error?.message || error);
    })
    .finally(() => {
      tokenSyncInFlight = null;
    });

  return tokenSyncInFlight;
};

export const registerNativePush = async () => {
  if (initialized || !Capacitor.isNativePlatform()) return;
  initialized = true;

  try {
    let permission = await PushNotifications.checkPermissions();

    if (permission.receive === 'prompt') {
      permission = await PushNotifications.requestPermissions();
    }

    if (permission.receive !== 'granted') {
      console.warn('[Native Push] Notification permission not granted.');
      return;
    }

    await PushNotifications.addListener('registration', async ({ value }) => {
      await syncNativeToken(value);
    });

    await PushNotifications.addListener('registrationError', (error) => {
      console.warn('[Native Push] Registration error:', error?.error || error);
    });

    await PushNotifications.addListener('pushNotificationReceived', (notification) => {
      window.dispatchEvent(new CustomEvent('vaani-native-push', {
        detail: notification,
      }));
    });

    await PushNotifications.addListener('pushNotificationActionPerformed', (event) => {
      const url = event?.notification?.data?.url || '/';
      if (url && typeof window !== 'undefined') {
        window.location.assign(url);
      }
    });

    await PushNotifications.register();
  } catch (error) {
    console.warn('[Native Push] Initialization failed:', error?.message || error);
  }
};
