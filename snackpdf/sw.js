/**
 * Service Worker for SnackPDF
 * Implements caching strategies for optimal performance
 */

const CACHE_NAME = 'snackpdf-v1.0.0';
const STATIC_CACHE = 'snackpdf-static-v1.0.0';
const DYNAMIC_CACHE = 'snackpdf-dynamic-v1.0.0';

// Resources to cache immediately
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/assets/css/style.css',
    '/assets/js/main.js',
    '/assets/js/config.js',
    '/assets/js/analytics.js',
    '/assets/js/seo.js',
    '/assets/js/performance.js',
    '/assets/images/logo.png',
    '/assets/images/favicon.ico',
    '/merge-pdf',
    '/split-pdf',
    '/compress-pdf',
    '/pricing',
    '/features',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js'
];

// Resources that should always be fetched from network
const NETWORK_ONLY = [
    '/api/',
    '/auth/',
    '/upload/',
    '/download/'
];

// Resources to cache with network-first strategy
const NETWORK_FIRST = [
    '/blog',
    '/help',
    '/faq'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('Service Worker: Installing...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => {
                console.log('Service Worker: Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('Service Worker: Static assets cached');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('Service Worker: Failed to cache static assets', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activating...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
                            console.log('Service Worker: Deleting old cache', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('Service Worker: Activated');
                return self.clients.claim();
            })
    );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }

    // Skip chrome-extension and other non-http requests
    if (!url.protocol.startsWith('http')) {
        return;
    }

    // Network-only resources (API calls, auth, uploads)
    if (NETWORK_ONLY.some(pattern => url.pathname.startsWith(pattern))) {
        event.respondWith(
            fetch(request)
                .catch(() => {
                    // Return offline page for API failures
                    if (url.pathname.startsWith('/api/')) {
                        return new Response(
                            JSON.stringify({ error: 'Offline', message: 'Please check your internet connection' }),
                            { 
                                status: 503,
                                headers: { 'Content-Type': 'application/json' }
                            }
                        );
                    }
                })
        );
        return;
    }

    // Network-first strategy for dynamic content
    if (NETWORK_FIRST.some(pattern => url.pathname.startsWith(pattern))) {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    // Cache successful responses
                    if (response.status === 200) {
                        const responseClone = response.clone();
                        caches.open(DYNAMIC_CACHE)
                            .then((cache) => {
                                cache.put(request, responseClone);
                            });
                    }
                    return response;
                })
                .catch(() => {
                    // Fallback to cache
                    return caches.match(request);
                })
        );
        return;
    }

    // Cache-first strategy for static assets
    event.respondWith(
        caches.match(request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    // Return cached version and update in background
                    fetch(request)
                        .then((response) => {
                            if (response.status === 200) {
                                const responseClone = response.clone();
                                caches.open(STATIC_CACHE)
                                    .then((cache) => {
                                        cache.put(request, responseClone);
                                    });
                            }
                        })
                        .catch(() => {
                            // Ignore network errors for background updates
                        });
                    
                    return cachedResponse;
                }

                // Not in cache, fetch from network
                return fetch(request)
                    .then((response) => {
                        // Cache successful responses
                        if (response.status === 200) {
                            const responseClone = response.clone();
                            const cacheToUse = STATIC_ASSETS.includes(url.pathname) ? STATIC_CACHE : DYNAMIC_CACHE;
                            
                            caches.open(cacheToUse)
                                .then((cache) => {
                                    cache.put(request, responseClone);
                                });
                        }
                        return response;
                    })
                    .catch(() => {
                        // Network failed, return offline page for HTML requests
                        if (request.headers.get('accept').includes('text/html')) {
                            return caches.match('/offline.html') || 
                                   new Response(
                                       '<h1>Offline</h1><p>Please check your internet connection.</p>',
                                       { headers: { 'Content-Type': 'text/html' } }
                                   );
                        }
                        
                        // For other resources, return a generic error
                        return new Response('Offline', { status: 503 });
                    });
            })
    );
});

// Background sync for analytics
self.addEventListener('sync', (event) => {
    if (event.tag === 'analytics-sync') {
        event.waitUntil(syncAnalytics());
    }
});

// Push notifications (for future use)
self.addEventListener('push', (event) => {
    if (event.data) {
        const data = event.data.json();
        const options = {
            body: data.body,
            icon: '/assets/images/icon-192x192.png',
            badge: '/assets/images/badge-72x72.png',
            data: data.url,
            actions: [
                {
                    action: 'open',
                    title: 'Open SnackPDF'
                },
                {
                    action: 'close',
                    title: 'Close'
                }
            ]
        };

        event.waitUntil(
            self.registration.showNotification(data.title, options)
        );
    }
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'open' || !event.action) {
        event.waitUntil(
            clients.openWindow(event.notification.data || '/')
        );
    }
});

// Sync analytics data when online
async function syncAnalytics() {
    try {
        // Get stored analytics events
        const cache = await caches.open(DYNAMIC_CACHE);
        const requests = await cache.keys();
        const analyticsRequests = requests.filter(req => 
            req.url.includes('/api/analytics/track')
        );

        // Send stored events
        for (const request of analyticsRequests) {
            try {
                await fetch(request);
                await cache.delete(request);
            } catch (error) {
                console.log('Failed to sync analytics event:', error);
            }
        }
    } catch (error) {
        console.log('Analytics sync failed:', error);
    }
}

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'analytics-cleanup') {
        event.waitUntil(cleanupOldCache());
    }
});

// Clean up old cache entries
async function cleanupOldCache() {
    try {
        const cache = await caches.open(DYNAMIC_CACHE);
        const requests = await cache.keys();
        const now = Date.now();
        const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days

        for (const request of requests) {
            const response = await cache.match(request);
            if (response) {
                const dateHeader = response.headers.get('date');
                if (dateHeader) {
                    const responseDate = new Date(dateHeader).getTime();
                    if (now - responseDate > maxAge) {
                        await cache.delete(request);
                    }
                }
            }
        }
    } catch (error) {
        console.log('Cache cleanup failed:', error);
    }
}

// Message handler for communication with main thread
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'GET_CACHE_SIZE') {
        getCacheSize().then(size => {
            event.ports[0].postMessage({ cacheSize: size });
        });
    }
});

// Get total cache size
async function getCacheSize() {
    const cacheNames = await caches.keys();
    let totalSize = 0;

    for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const requests = await cache.keys();
        
        for (const request of requests) {
            const response = await cache.match(request);
            if (response && response.headers.get('content-length')) {
                totalSize += parseInt(response.headers.get('content-length'));
            }
        }
    }

    return totalSize;
}
