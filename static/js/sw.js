/**
 * Service Worker for Cybersecurity Threat Intelligence Dashboard
 * Enables offline viewing and faster subsequent loads
 */

const CACHE_NAME = 'ti-dashboard-v1';
const OFFLINE_URL = '/index.html';

// Assets to cache on install
const CACHE_ASSETS = [
    '/',
    '/index.html',
    '/static/css/dashboard.css',
    '/static/js/services/api.js',
    '/static/js/services/charts.js',
    '/static/js/services/utils.js',
    '/static/js/components/executive-summary.js',
    '/static/js/components/stats-cards.js',
    '/static/js/components/incidents-table.js',
    '/static/js/components/vulnerabilities-table.js',
    '/static/js/components/threat-actors-table.js',
    '/static/js/components/charts-container.js',
    '/static/js/components/analytics-dashboard.js',
    '/static/js/app.js',
    '/gui/latest_summary.json',
    '/gui/incidents.json',
    '/gui/vulnerabilities.json',
    '/gui/threat_actors.json',
    '/gui/statistics.json',
    '/gui/dashboard.json'
];

// CDN resources to cache
const CDN_RESOURCES = [
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css',
    'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css',
    'https://unpkg.com/vue@3/dist/vue.global.prod.js',
    'https://cdn.jsdelivr.net/npm/chart.js',
    'https://cdn.jsdelivr.net/npm/marked/marked.min.js',
    'https://fonts.googleapis.com/css2?family=Orbitron:wght@900&display=swap'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                return cache.addAll([...CACHE_ASSETS, ...CDN_RESOURCES]);
            })
            .then(() => {
                self.skipWaiting();
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((cacheName) => cacheName !== CACHE_NAME)
                        .map((cacheName) => {
                            return caches.delete(cacheName);
                        })
                );
            })
            .then(() => {
                self.clients.claim();
            })
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    // Skip chrome-extension and other protocols
    if (!event.request.url.startsWith('http')) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                // Return cached response if available
                if (cachedResponse) {
                    return cachedResponse;
                }

                // Otherwise fetch from network
                return fetch(event.request)
                    .then((networkResponse) => {
                        // Cache valid responses
                        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                            const responseToCache = networkResponse.clone();
                            caches.open(CACHE_NAME)
                                .then((cache) => {
                                    cache.put(event.request, responseToCache);
                                });
                        }
                        return networkResponse;
                    })
                    .catch((error) => {
                        // Return offline page for navigation requests
                        if (event.request.mode === 'navigate') {
                            return caches.match(OFFLINE_URL);
                        }
                        throw error;
                    });
            })
    );
});

// Message event - handle cache updates
self.addEventListener('message', (event) => {
    if (event.data === 'SKIP_WAITING') {
        self.skipWaiting();
    } else if (event.data === 'UPDATE_CACHE') {
        event.waitUntil(
            caches.open(CACHE_NAME)
                .then((cache) => {
                    return cache.addAll([...CACHE_ASSETS, ...CDN_RESOURCES]);
                })
        );
    }
});
