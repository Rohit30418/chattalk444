const CACHE_NAME = 'vaani-shell-v2';
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

const cacheResponse = (request, response) => {
  if (!response?.ok) return;
  const copy = response.clone();
  caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)).catch(() => {});
};

const networkFirst = async (request, fallbackRequest = request) => {
  try {
    const response = await fetch(request, { cache: 'no-store' });
    cacheResponse(fallbackRequest, response);
    return response;
  } catch {
    return caches.match(fallbackRequest);
  }
};

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/socket.io/')) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      networkFirst(request, '/')
        .then((response) => response || caches.match('/'))
    );
    return;
  }

  const isCodeAsset = request.destination === 'script'
    || request.destination === 'style'
    || request.destination === 'worker'
    || /\.(?:js|css|mjs)(?:$|\?)/i.test(url.pathname);

  // App code must prefer the network so a newly deployed Vite bundle cannot be
  // hidden behind an older PWA cache. Cached code remains only as an offline
  // fallback.
  if (isCodeAsset) {
    event.respondWith(networkFirst(request).then((response) => response || caches.match(request)));
    return;
  }

  // Images/fonts/icons are safe to serve quickly from cache and refresh in the
  // background because they do not control application behavior.
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          cacheResponse(request, response);
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

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        const appIsVisible = clients.some((client) => (
          client.visibilityState === 'visible' || client.focused === true
        ));

        // The React app already handles live foreground events. System push is
        // for the background/closed-app case so users do not get duplicates.
        if (appIsVisible) return undefined;
        return showVaaniNotification(payload);
      })
  );
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
