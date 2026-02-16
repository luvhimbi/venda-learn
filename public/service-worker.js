// VendaLearn Service Worker — Network-First with Cache Fallback
const CACHE_NAME = 'venda-learn-v2';

// Pre-cache these on install
const PRECACHE_URLS = [
    '/',
    '/images/vendalearn.png'
];

// Install: pre-cache shell
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(PRECACHE_URLS);
        })
    );
    self.skipWaiting(); // Activate immediately
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((key) => key !== CACHE_NAME)
                    .map((key) => caches.delete(key))
            );
        })
    );
    self.clients.claim(); // Take control of all pages
});

// Fetch: Network first, fall back to cache
self.addEventListener('fetch', (event) => {
    const request = event.request;

    // Skip non-GET requests
    if (request.method !== 'GET') return;

    // Skip Firebase/API requests — always go to network
    if (request.url.includes('firestore.googleapis.com') ||
        request.url.includes('firebase') ||
        request.url.includes('googleapis.com/identitytoolkit') ||
        request.url.includes('securetoken.googleapis.com')) {
        return;
    }

    event.respondWith(
        fetch(request)
            .then((response) => {
                // Cache successful responses
                if (response.ok) {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(request, responseClone);
                    });
                }
                return response;
            })
            .catch(() => {
                // Network failed — try cache
                return caches.match(request).then((cached) => {
                    if (cached) return cached;

                    // For navigation requests, return cached index
                    if (request.mode === 'navigate') {
                        return caches.match('/');
                    }

                    return new Response('Offline', { status: 503, statusText: 'Offline' });
                });
            })
    );
});