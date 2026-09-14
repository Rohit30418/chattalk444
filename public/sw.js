const CACHE_NAME = 'vaani-shell-v1';
const APP_SHELL = ['/', '/manifest.webmanifest', '/vaani-icon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/socket.io/')) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put('/', copy)).catch(() => {});
          return response;
        })
        .catch(() => caches.match('/'))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response?.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)).catch(() => {});
          }
          return response;
        })
        .catch(() => cached);

      return cached || network;
    })
  );
});

const showVaaniNotification = async (payload = {}) => {
  const title = payload.title || 'Vaani';
  const options = {
    body: payload.body || 'You have a new update on Vaani.',
    icon: payload.icon || '/vaani-icon.svg',
    badge: payload.badge || '/vaani-icon.svg',
    tag: payload.tag || 'vaani-notification',
    renotify: payload.renotify !== false,
    vibrate: [120, 60, 120],
    data: {
      url: payload.url || '/',
      ...(payload.data || {}),
    },
  };

  return self.registration.showNotification(title, options);
};

self.addEventListener('push', (event) => {
  let payload = {};

  try {
    payload = event.data?.json?.() || {};
  } catch {
    payload = { body: event.data?.text?.() || 'You have a new Vaani notification.' };
  }

  event.waitUntil(showVaaniNotification(payload));
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SHOW_NOTIFICATION') {
    event.waitUntil(showVaaniNotification(event.data.payload || {}));
  }

  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = new URL(event.notification.data?.url || '/', self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async (clients) => {
      for (const client of clients) {
        if ('focus' in client) {
          if ('navigate' in client) await client.navigate(targetUrl).catch(() => {});
          return client.focus();
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }

      return undefined;
    })
  );
});
