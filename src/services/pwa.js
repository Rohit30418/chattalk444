import api from './api';

let deferredInstallPrompt = null;
let registrationPromise = null;
let pushRecoveryBound = false;
let pushSyncInFlight = null;

const base64UrlToUint8Array = (value = '') => {
  const padding = '='.repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
};

const hasSignedInUser = () => {
  try {
    const stored = JSON.parse(localStorage.getItem('userInfo') || 'null');
    return Boolean(stored?.uid);
  } catch {
    return false;
  }
};

const canAttemptPushRecovery = () => (
  typeof window !== 'undefined'
  && typeof Notification !== 'undefined'
  && Notification.permission === 'granted'
  && hasSignedInUser()
);

const attemptPushRecovery = () => {
  if (!canAttemptPushRecovery()) return;

  window.setTimeout(() => {
    syncPushSubscription().catch(() => {});
  }, 0);
};

const bindPushRecovery = () => {
  if (pushRecoveryBound || typeof window === 'undefined') return;
  pushRecoveryBound = true;

  window.addEventListener('online', attemptPushRecovery);
  window.addEventListener('focus', attemptPushRecovery);

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', attemptPushRecovery);
  }

  // A previous subscription attempt may have failed while the backend was
  // deploying or temporarily unavailable. Retry shortly after every app load.
  window.setTimeout(attemptPushRecovery, 1500);
  window.setTimeout(attemptPushRecovery, 15000);
};

export const isStandalonePwa = () => (
  window.matchMedia?.('(display-mode: standalone)').matches
  || window.navigator.standalone === true
);

export const registerVaaniPwa = () => {
  if (!('serviceWorker' in navigator)) return Promise.resolve(null);

  bindPushRecovery();

  if (registrationPromise) return registrationPromise;

  registrationPromise = navigator.serviceWorker
    .register('/sw.js', { scope: '/' })
    .then((registration) => {
      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
      return registration;
    })
    .catch((error) => {
      console.warn('[PWA] Service worker registration failed:', error?.message || error);
      return null;
    });

  return registrationPromise;
};

export const captureInstallPrompt = (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  window.dispatchEvent(new CustomEvent('vaani-install-available'));
};

export const hasInstallPrompt = () => Boolean(deferredInstallPrompt);

export const promptVaaniInstall = async () => {
  if (!deferredInstallPrompt) return { outcome: 'unavailable' };

  const prompt = deferredInstallPrompt;
  deferredInstallPrompt = null;
  await prompt.prompt();
  const choice = await prompt.userChoice;
  window.dispatchEvent(new CustomEvent('vaani-install-consumed'));
  return choice;
};

export const showVaaniNotification = async (payload) => {
  if (!('Notification' in window) || Notification.permission !== 'granted') return false;

  const registration = await registerVaaniPwa();
  if (!registration) return false;

  if (registration.active) {
    registration.active.postMessage({
      type: 'SHOW_NOTIFICATION',
      payload,
    });
  } else {
    await registration.showNotification(payload?.title || 'Vaani', {
      body: payload?.body || 'You have a new update on Vaani.',
      icon: '/vaani-icon.svg',
      badge: '/vaani-icon.svg',
      tag: payload?.tag || 'vaani-notification',
      data: { url: payload?.url || '/' },
    });
  }

  return true;
};

export const syncPushSubscription = async () => {
  if (pushSyncInFlight) return pushSyncInFlight;

  pushSyncInFlight = (async () => {
    if (!('PushManager' in window) || !('serviceWorker' in navigator)) {
      return { subscribed: false, reason: 'unsupported' };
    }

    const registration = await registerVaaniPwa();
    if (!registration) return { subscribed: false, reason: 'service-worker' };

    try {
      const { data } = await api.get('/api/social/push/public-key');
      const publicKey = data?.publicKey;

      if (!publicKey) {
        return { subscribed: false, reason: 'server-not-configured' };
      }

      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: base64UrlToUint8Array(publicKey),
        });
      }

      await api.post('/api/social/push/subscribe', {
        subscription: subscription.toJSON(),
      });

      return { subscribed: true };
    } catch (error) {
      console.warn('[PWA] Push subscription unavailable:', error?.userMessage || error?.message || error);
      return { subscribed: false, reason: 'request-failed' };
    }
  })();

  try {
    return await pushSyncInFlight;
  } finally {
    pushSyncInFlight = null;
  }
};

export const requestVaaniNotifications = async () => {
  if (!('Notification' in window)) {
    return { permission: 'unsupported', subscribed: false };
  }

  const permission = Notification.permission === 'default'
    ? await Notification.requestPermission()
    : Notification.permission;

  if (permission !== 'granted') {
    return { permission, subscribed: false };
  }

  const pushResult = await syncPushSubscription();
  return { permission, ...pushResult };
};

export const clearAppBadge = () => {
  if (typeof navigator.clearAppBadge === 'function') {
    navigator.clearAppBadge().catch(() => {});
  }
};

export const bumpAppBadge = (count = 1) => {
  if (typeof navigator.setAppBadge === 'function') {
    navigator.setAppBadge(Math.max(1, Number(count) || 1)).catch(() => {});
  }
};
