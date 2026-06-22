const CACHE_NAME = 'dhikr-counter-v2';
const PRECACHE_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/icon-192.png',
  '/icon-512.png',
  '/favicon.png'
];

// Install Event: Precache static shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate Event: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Helper to generate a unique cache key that distinguishes Inertia requests
function getCacheKey(request) {
  if (request.headers.has('x-inertia')) {
    // Append a query parameter to separate Inertia JSON responses from full HTML pages
    const url = new URL(request.url);
    url.searchParams.set('__inertia', 'true');
    return url.toString();
  }
  return request.url;
}

// Fetch Event: Cache strategies
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  const cacheKey = getCacheKey(event.request);

  // 1. Immutable Vite Assets (Cache-First)
  if (url.origin === self.location.origin && url.pathname.startsWith('/build/assets/')) {
    event.respondWith(
      caches.match(cacheKey).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        return fetch(event.request).then((networkResponse) => {
          if (networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(cacheKey, responseClone);
            });
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // 2. Static CDN Resources (Stale-While-Revalidate)
  const isCDN = url.hostname.includes('fonts.bunny.net') || url.hostname.includes('flaticon.com');
  if (isCDN) {
    event.respondWith(
      caches.match(cacheKey).then((cachedResponse) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          if (networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(cacheKey, responseClone);
            });
          }
          return networkResponse;
        }).catch(() => {
          // Fail silently for background fetch errors
        });
        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // 3. App Routes and Dynamic Data (Network-First with Cache Fallback)
  if (url.origin === self.location.origin) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          // Only cache successful requests
          if (networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(cacheKey, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // If offline, check cache
          return caches.match(cacheKey).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;
            // Generic fallback if not in cache (e.g. serve root shell for navigation)
            if (event.request.mode === 'navigate') {
              return caches.match('/');
            }
          });
        })
    );
  }
});
