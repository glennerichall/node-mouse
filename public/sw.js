const CACHE_NAME = 'remote-mouse-shell-v4';
const SHELL_ASSETS = [
  '/',
  '/styles.css?v=20260404a',
  '/favicon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
  '/manifest.webmanifest',
  '/client/ui/main/page.js?v=20260404a',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAME);
        await cache.addAll(SHELL_ASSETS);
      } catch (_error) {}
    })(),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      );
    })(),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    return;
  }
  if (url.pathname.startsWith('/socket.io/')) {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/')),
    );
    return;
  }

  if (
    request.destination === 'script'
    || request.destination === 'style'
    || url.pathname.startsWith('/client/')
  ) {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(request);
          const responseClone = response.clone();
          void (async () => {
            try {
              const cache = await caches.open(CACHE_NAME);
              await cache.put(request, responseClone);
            } catch (_error) {}
          })();
          return response;
        } catch (_error) {
          return caches.match(request);
        }
      })(),
    );
    return;
  }

  event.respondWith(
    (async () => {
      const cached = await caches.match(request);
      if (cached) {
        return cached;
      }

      const response = await fetch(request);
      const responseClone = response.clone();
      void (async () => {
        try {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(request, responseClone);
        } catch (_error) {}
      })();
      return response;
    })(),
  );
});
