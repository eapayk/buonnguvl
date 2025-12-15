const CACHE_NAME = 'expense-manager-v2';
const urlsToCache = [
    '/',
    '/index.html',
    '/styles.css',
    '/app-fixed.js',
    '/firebase-service.js',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js',
    'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth-compat.js',
    'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore-compat.js',
    'https://www.gstatic.com/firebasejs/9.22.0/firebase-storage-compat.js',
    'icon-192x192.png'
];

// Install Service Worker
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

// Fetch from cache or network
self.addEventListener('fetch', event => {
    // Skip Firebase requests for real-time updates
    if (event.request.url.includes('firestore.googleapis.com') ||
        event.request.url.includes('firebasestorage.googleapis.com')) {
        return fetch(event.request);
    }
    
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response;
                }
                return fetch(event.request);
            })
    );
});

// Background sync for offline data
self.addEventListener('sync', event => {
    if (event.tag === 'sync-expenses') {
        console.log('Background sync: sync-expenses');
        event.waitUntil(syncExpenses());
    }
});

async function syncExpenses() {
    // Get pending data from IndexedDB
    const pendingData = await getPendingData();
    
    if (pendingData.length > 0) {
        // Try to sync with Firebase
        try {
            // Your sync logic here
            console.log('Syncing pending data:', pendingData);
            // Clear pending data after successful sync
            await clearPendingData();
        } catch (error) {
            console.error('Sync failed:', error);
        }
    }
}

// Update cache and delete old caches
self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
