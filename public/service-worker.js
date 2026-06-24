const CACHE_NAME = 'tive-cache-v1';
const DYNAMIC_CACHE = 'tive-dynamic-v1';
const IMAGE_CACHE = 'tive-images-v1';

// App shell
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon.svg',
  // Vite injects hashed files dynamically, so we rely heavily on runtime caching for assets
];

// Install Event: Pre-cache static assets
self.addEventListener('install', (event) => {
  // Wait for SKIP_WAITING message to activate
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching offline page');
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
});

// Activate Event: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (![CACHE_NAME, DYNAMIC_CACHE, IMAGE_CACHE].includes(key)) {
            console.log('[Service Worker] Removing old cache', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Listen for messages from client
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Fetch Event: Network-first for API, Cache-first for images, Stale-while-revalidate for JS/CSS
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. Supabase API & AI endpoints -> Network Only
  if (url.origin.includes('supabase.co') || url.pathname.includes('/v1/models/')) {
    return; // Pass through to browser
  }

  // 2. Images (Exercise DB GIFs, etc.) -> Cache First, fallback to network
  if (event.request.destination === 'image' || url.pathname.match(/\.(png|jpg|jpeg|gif|svg|webp)$/i)) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        
        return fetch(event.request).then((networkResponse) => {
          // Only cache valid responses
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }
          const responseToCache = networkResponse.clone();
          caches.open(IMAGE_CACHE).then((cache) => cache.put(event.request, responseToCache));
          return networkResponse;
        });
      })
    );
    return;
  }

  // 3. Fonts and JS/CSS bundles -> Stale While Revalidate
  if (url.origin === location.origin && (url.pathname.match(/\.(js|css)$/i) || event.request.destination === 'font')) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
          });
          return networkResponse;
        }).catch(() => {
          // Ignore network errors for stale-while-revalidate
        });
        
        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // 4. Default: Network first, fallback to cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses for offline access
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => cache.put(event.request, responseToCache));
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache if network fails
        return caches.match(event.request).then(cached => {
            if (cached) return cached;
            // If it's a navigation request and no cache, fallback to index.html
            if (event.request.mode === 'navigate') {
                return caches.match('/index.html');
            }
            return new Response('Network error happened', {
                status: 408,
                headers: { 'Content-Type': 'text/plain' },
            });
        });
      })
  );
});

// Background Sync (Optional for future)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-workouts') {
    // Implement background sync if needed
    console.log('[Service Worker] Background sync triggered');
  }
});
