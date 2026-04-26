const CACHE_NAME = 'cloud-media-manager-v2';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './styles.css',
  './script.js',
  './data.json',
  './manifest.json',
  './privacy.html',
  './robots.txt',
  './sitemap.xml'
];

// Install Event: Caches core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching app shell and core assets');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => {
      // Force the waiting service worker to become the active service worker
      return self.skipWaiting();
    })
  );
});

// Activate Event: Cleans up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Clearing old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => {
      // Claim clients immediately so the service worker controls the page on first load
      return self.clients.claim();
    })
  );
});

// Fetch Event: Cache-First Strategy
self.addEventListener('fetch', (event) => {
  // We only intercept GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Skip intercepting YouTube IFrame API or external media streams
  // (We only cache our app shell and local catalog)
  if (url.hostname.includes('youtube.com') || 
      url.hostname.includes('youtu.be') || 
      url.hostname.includes('googlevideo.com') || 
      url.hostname.includes('soundhelix.com') ||
      url.hostname.includes('unsplash.com')) {
    return;
  }

  // Handle data.json with Network-First strategy for live updates
  if (url.pathname.endsWith('data.json')) {
    event.respondWith(
      fetch(event.request).then((networkResponse) => {
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      }).catch(() => {
        return caches.match(event.request);
      })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached response immediately
        return cachedResponse;
      }

      // If not in cache, fetch from network
      return fetch(event.request).then((networkResponse) => {
        // Check if response is valid (don't cache error responses or opaque responses like range requests)
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        // Clone response to put in cache while returning it to the browser
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch((err) => {
        console.error('[Service Worker] Fetch failed for:', event.request.url, err);
        // Fallback for document navigation if offline and uncached
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
        return new Response('Offline content not available', { status: 503, statusText: 'Service Unavailable' });
      });
    })
  );
});
