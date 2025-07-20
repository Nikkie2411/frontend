// Service Worker for caching
const CACHE_NAME = 'pedmed-v1.7-20250719'; // Force cache clear with new timestamp
const urlsToCache = [
  '/',
  '/index.html',
  '/css/styles.css',
  '/js/utils.js',
  '/js/auth.js',
  '/js/drugSearch.js',
  '/js/tools.js',
  '/js/ui.js',
  '/assets/favicon.png',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css'
];

// List of old cache versions to delete
const OLD_CACHES = [
  'pedmed-v1.4-20250718',
  'pedmed-v1.3',
  'pedmed-v1.2', 
  'pedmed-v1.1',
  'pedmed-v1.0'
];

// Install event
self.addEventListener('install', event => {

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {

        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('❌ Cache installation failed:', error);
      })
  );
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', event => {

  event.waitUntil(
    Promise.all([
      // Delete old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME || OLD_CACHES.includes(cacheName)) {

              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Claim all clients immediately
      self.clients.claim()
    ])
  );
});

// Fetch event - Cache First strategy for static assets, Network First for API calls
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Skip unsupported schemes (chrome-extension, moz-extension, etc.)
  if (!url.protocol.startsWith('http')) {

    return;
  }
  
  // Skip non-GET requests
  if (event.request.method !== 'GET') {

    return;
  }
  
  // API calls - Network First
  if (url.pathname.startsWith('/api/') || url.hostname.includes('render.com')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Clone response for cache
          const responseClone = response.clone();
          
          // Cache successful API responses for 5 minutes
          if (response.ok && event.request.method === 'GET') {
            caches.open(CACHE_NAME + '-api').then(cache => {
              cache.put(event.request, responseClone);
              // Set expiration (5 minutes for API cache)
              setTimeout(() => {
                cache.delete(event.request);
              }, 5 * 60 * 1000);
            }).catch(error => {
              console.warn('⚠️ Failed to cache API response:', error);
            });
          }
          
          return response;
        })
        .catch(() => {
          // Fallback to cache if network fails
          return caches.match(event.request);
        })
    );
    return;
  }
  
  // Static assets - Cache First
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        
        return fetch(event.request).then(response => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Clone the response
          const responseToCache = response.clone();
          
          // Safely cache the response
          caches.open(CACHE_NAME)
            .then(cache => {
              try {
                cache.put(event.request, responseToCache);
              } catch (error) {
                console.warn('⚠️ Failed to cache response:', error, event.request.url);
              }
            })
            .catch(error => {
              console.warn('⚠️ Failed to open cache:', error);
            });
          
          return response;
        }).catch(error => {
          console.warn('⚠️ Fetch failed:', error);
          return response;
        });
      })
  );
});

// Background sync for offline actions
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {

    // Handle offline actions here
  }
});

// Push notifications (for future use)
self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json();
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/assets/favicon.png'
    });
  }
});
