// VendaLearn Service Worker — Network-First with Cache Fallback
const CACHE_NAME = 'venda-learn-v5';
const AVATAR_CACHE = 'venda-avatars-v1';
const IMAGE_CACHE = 'venda-images-v1';
const KNOWN_CACHES = [CACHE_NAME, AVATAR_CACHE, IMAGE_CACHE];

// Pre-cache these on install (app shell)
const PRECACHE_URLS = [
    '/',
    '/images/Logo.png'
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

// Activate: clean up old caches (keep only known ones)
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((key) => !KNOWN_CACHES.includes(key))
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

    // DiceBear Avatar SVGs — Cache-first with dedicated cache (they rarely change)
    if (request.url.includes('api.dicebear.com')) {
        event.respondWith(
            caches.open(AVATAR_CACHE).then((cache) => {
                return cache.match(request).then((cached) => {
                    if (cached) {
                        // Stale-while-revalidate: return cache, update in background
                        fetch(request).then((response) => {
                            if (response.ok) cache.put(request, response);
                        }).catch(() => {});
                        return cached;
                    }
                    // Not cached — fetch, cache, and return
                    return fetch(request).then((response) => {
                        if (response.ok) {
                            cache.put(request, response.clone());
                        }
                        return response;
                    }).catch(() => {
                        // Return a simple fallback SVG circle for offline
                        return new Response(
                            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="#e2e8f0"/><text x="50" y="58" text-anchor="middle" font-size="30" fill="#94a3b8">?</text></svg>',
                            { headers: { 'Content-Type': 'image/svg+xml' } }
                        );
                    });
                });
            })
        );
        return;
    }

    // External images (culture content hosted on Firebase Storage, CDNs, etc.) — Stale-while-revalidate
    if (request.destination === 'image' || request.url.match(/\.(png|jpg|jpeg|webp|gif|svg)(\?.*)?$/i)) {
        event.respondWith(
            caches.open(IMAGE_CACHE).then((cache) => {
                return cache.match(request).then((cached) => {
                    const fetchPromise = fetch(request).then((response) => {
                        if (response.ok) {
                            cache.put(request, response.clone());
                        }
                        return response;
                    }).catch(() => {
                        if (cached) return cached;
                        // Return a transparent 1x1 PNG as last-resort fallback
                        return new Response(
                            Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN88P/BfwAJhAPk3KFb2AAAAABJRU5ErkJggg=='), c => c.charCodeAt(0)),
                            { headers: { 'Content-Type': 'image/png' } }
                        );
                    });
                    return cached || fetchPromise;
                });
            })
        );
        return;
    }

    // Default: network-first with cache fallback
    event.respondWith(
        fetch(request)
            .then((response) => {
                if (response.ok && request.url.startsWith('http')) {
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