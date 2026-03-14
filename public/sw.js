const CACHE_NAME = 'terminalfeed-v1';

const APP_SHELL = [
  '/',
  '/manifest.json',
  '/offline.html',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // External API calls — network only, don't cache
  if (url.origin !== self.location.origin) return;

  // App shell — cache first, network fallback
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkFetch = fetch(event.request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // Offline — return cached or offline page
        if (cached) return cached;
        if (event.request.mode === 'navigate') {
          return caches.match('/offline.html');
        }
        return cached;
      });

      // Return cached immediately, update in background (stale-while-revalidate)
      return cached || networkFetch;
    })
  );
});
