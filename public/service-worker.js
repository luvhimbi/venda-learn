// VendaLearn Service Worker — Network-First with Cache Fallback
const CACHE_NAME = 'venda-learn-v4';

// Pre-cache these on install (app shell)
const PRECACHE_URLS = [
    '/',
    '/images/ven.png',
    '/images/VendaLearnLogo.png'
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

    // Skip Firebase/API requests — Firestore SDK handles its own offline caching
    if (request.url.includes('firestore.googleapis.com') ||
        request.url.includes('firebase') ||
        request.url.includes('googleapis.com/identitytoolkit') ||
        request.url.includes('securetoken.googleapis.com')) {
        return;
    }

    // For navigation requests (page loads), always serve index.html from cache if offline
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    // Cache the latest index.html
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put('/', responseClone);
                    });
                    return response;
                })
                .catch(() => {
                    return caches.match('/').then((cached) => {
                        return cached || new Response('Offline', { status: 503 });
                    });
                })
        );
        return;
    }

    // For static assets (JS, CSS, images, fonts) — cache-first for speed
    if (request.url.match(/\.(js|css|woff2?|ttf|eot|svg|png|jpg|jpeg|webp|ico)(\?.*)?$/)) {
        event.respondWith(
            caches.match(request).then((cached) => {
                if (cached) {
                    // Return cache immediately, but update in background
                    fetch(request).then((response) => {
                        if (response.ok) {
                            caches.open(CACHE_NAME).then((cache) => {
                                cache.put(request, response);
                            });
                        }
                    }).catch(() => {}); // Ignore network errors
                    return cached;
                }

                // Not cached yet — fetch and cache
                return fetch(request).then((response) => {
                    if (response.ok) {
                        const responseClone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(request, responseClone);
                        });
                    }
                    return response;
                }).catch(() => {
                    return new Response('', { status: 503, statusText: 'Offline' });
                });
            })
        );
        return;
    }

    // Default: network-first with cache fallback
    event.respondWith(
        fetch(request)
            .then((response) => {
                if (response.ok) {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(request, responseClone);
                    });
                }
                return response;
            })
            .catch(() => {
                return caches.match(request).then((cached) => {
                    if (cached) return cached;
                    return new Response('Offline', { status: 503, statusText: 'Offline' });
                });
            })
    );
});