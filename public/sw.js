/**
 * Service Worker (Phase 4A)
 * Progressive Web App offline support and caching
 */

const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `crm-cache-${CACHE_VERSION}`;

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/crm',
  '/crm.html',
  '/styles.css',
  '/styles/mobile.css',
  '/app.js',
  '/crm.js',
  '/crm.html'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching static assets');
        return cache.addAll(STATIC_ASSETS.map(asset => new Request(asset, { cache: 'reload' })));
      })
      .catch((error) => {
        console.error('[Service Worker] Cache install failed:', error);
      })
  );
  
  // Force activation of new service worker
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => {
              console.log('[Service Worker] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
  );
  
  // Take control of all pages immediately
  return self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests (except Firebase)
  if (url.origin !== self.location.origin && 
      !url.hostname.includes('firebase') && 
      !url.hostname.includes('googleapis') &&
      !url.hostname.includes('gstatic')) {
    return;
  }

  // Strategy: Cache First for static assets, Network First for API/data
  if (isStaticAsset(request.url)) {
    event.respondWith(cacheFirst(request));
  } else if (isDataRequest(request.url)) {
    event.respondWith(networkFirst(request));
  } else {
    event.respondWith(networkFirst(request));
  }
});

/**
 * Check if request is for static asset
 * @param {string} url - Request URL
 * @returns {boolean} True if static asset
 */
function isStaticAsset(url) {
  return url.match(/\.(js|css|html|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$/i) ||
         url.includes('/crm.html') ||
         url === self.location.origin + '/' ||
         url === self.location.origin + '/crm';
}

/**
 * Check if request is for data/API
 * @param {string} url - Request URL
 * @returns {boolean} True if data request
 */
function isDataRequest(url) {
  return url.includes('firebase') ||
         url.includes('googleapis') ||
         url.includes('/api/');
}

/**
 * Cache First strategy
 * @param {Request} request - Request object
 * @returns {Promise<Response>} Response
 */
async function cacheFirst(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.error('[Service Worker] Cache First failed:', error);
    
    // Return offline page if available
    const offlinePage = await caches.match('/offline.html');
    if (offlinePage) {
      return offlinePage;
    }
    
    throw error;
  }
}

/**
 * Network First strategy
 * @param {Request} request - Request object
 * @returns {Promise<Response>} Response
 */
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log('[Service Worker] Network failed, trying cache:', error);
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline page if available
    const offlinePage = await caches.match('/offline.html');
    if (offlinePage) {
      return offlinePage;
    }
    
    throw error;
  }
}

// Message event - handle messages from main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(CACHE_NAME)
        .then((cache) => {
          return cache.addAll(event.data.urls);
        })
    );
  }
});

// Push event - handle push notifications
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push event received');
  
  let notificationData = {
    title: 'CRM Notification',
    body: 'You have a new notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png'
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = { ...notificationData, ...data };
    } catch (error) {
      notificationData.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Focus existing window or open new one
        for (const client of clientList) {
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow('/crm');
        }
      })
  );
});

// Background sync (if supported)
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

/**
 * Perform background sync
 */
async function doBackgroundSync() {
  // Sync pending data when online
  console.log('[Service Worker] Background sync triggered');
  // Implementation would sync pending changes
}
