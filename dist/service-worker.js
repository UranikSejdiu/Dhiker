// Dhikr Counter Service Worker
// Caches app shell for offline support and instant load

const CACHE_NAME = 'dhikr-counter-v2';

// These are the core app files to pre-cache on install
const PRECACHE_URLS = ['/'];

// On install: cache the bare minimum
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// On activate: clean up old caches and reload clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    ).then(() => {
      // Force all client tabs/windows to reload to fetch the new app version
      return self.clients.matchAll({ type: 'window' }).then((clients) => {
        clients.forEach((client) => {
          try {
            client.navigate(client.url);
          } catch (e) {
            // Fallback: post a message to the client if navigate() fails
            client.postMessage({ type: 'VERSION_UPDATE' });
          }
        });
      });
    })
  );
  self.clients.claim();
});

// Fetch strategy: Network First, fallback to cache
// This ensures fresh data when online but app still loads offline
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  // Only handle http/https requests (ignore chrome-extension://, etc.)
  if (!event.request.url.startsWith('http')) return;

  // Skip external APIs (Supabase, Firebase, Google)
  const url = new URL(event.request.url);
  if (
    url.hostname.includes('supabase') ||
    url.hostname.includes('firebase') ||
    url.hostname.includes('google') ||
    url.hostname.includes('googleapis')
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone the response and cache it for next time
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Network failed — serve from cache
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          // If nothing in cache, return the index page (for SPA routing)
          return caches.match('/');
        });
      })
  );
});
