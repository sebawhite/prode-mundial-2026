const CACHE_VERSION = 'v2';
const STATIC_CACHE = `prode-static-${CACHE_VERSION}`;
const IMAGE_CACHE = `prode-images-${CACHE_VERSION}`;
const FONT_CACHE = `prode-fonts-${CACHE_VERSION}`;

// Core application shell assets to pre-cache immediately
const CORE_SHELL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Common external domains for world cup assets (such as flag CDNs or user google avatars)
const PRE_CACHE_IMAGE_DOMAINS = [
  'https://flagcdn.com',
  'https://lh3.googleusercontent.com',
  'https://firebasestorage.googleapis.com'
];

// Installs and pre-caches the critical app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[PRODE SW] Pre-caching core app shell and static resources');
        return cache.addAll(CORE_SHELL_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Cleans up old service worker caches
self.addEventListener('activate', (event) => {
  const allowedCaches = [STATIC_CACHE, IMAGE_CACHE, FONT_CACHE];
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (!allowedCaches.includes(key)) {
            console.log(`[PRODE SW] Deleting obsolete cache: ${key}`);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Helper to check if request belongs to Firebase auth/realtime/firestore database, which must NOT be cached in SW
function isFirebaseOrAction(url) {
  return (
    url.includes('firestore.googleapis.com') ||
    url.includes('identitytoolkit.googleapis.com') ||
    url.includes('securetoken.googleapis.com') ||
    url.includes('firebaseapp.com') ||
    url.includes('/api/admin') || // Exclude administrative action endpoints
    url.includes('__') // Firebase Hosting reserved URLs (e.g. /__/auth)
  );
}

// Intercepts network requests and implements strategic caching
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Strategy Only for GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Strictly skip external Firebase Database / Authentication nodes
  if (isFirebaseOrAction(request.url)) {
    return;
  }

  // 1. STRATEGY FOR FONTS: Cache-First (with network fallbacks)
  if (
    url.hostname.includes('fonts.googleapis.com') || 
    url.hostname.includes('fonts.gstatic.com') ||
    request.destination === 'font'
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((networkResponse) => {
          if (networkResponse.status === 200) {
            const cacheCopy = networkResponse.clone();
            caches.open(FONT_CACHE).then((cache) => cache.put(request, cacheCopy));
          }
          return networkResponse;
        }).catch(() => {
          // If completely offline and font is missing, try returning any cache match
          return caches.match('/');
        });
      })
    );
    return;
  }

  // 2. STRATEGY FOR IMAGES: Cache-First with Stale-While-Revalidate background sync
  // (Handles PWA icons, local images, Google avatars, and World Cup flag CDNs like flagcdn)
  const isImageRequest = 
    request.destination === 'image' || 
    url.pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|ico)$/i) ||
    PRE_CACHE_IMAGE_DOMAINS.some(domain => request.url.startsWith(domain));

  if (isImageRequest) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request).then((networkResponse) => {
          if (networkResponse.status === 200) {
            const cacheCopy = networkResponse.clone();
            caches.open(IMAGE_CACHE).then((cache) => {
              cache.put(request, cacheCopy);
              // Limit the image cache size to protect storage memory (max 100 images)
              limitCacheSize(IMAGE_CACHE, 100);
            });
          }
          return networkResponse;
        }).catch(() => null);

        // Instant return from cache, fallback to background network update
        return cachedResponse || fetchPromise || getOfflineImageFallback();
      })
    );
    return;
  }

  // 3. STRATEGY FOR APP SHELL & STATIC ASSETS (HTML, JS, CSS, JSON, local files)
  // Uses Stale-While-Revalidate to ensure connection-resilient, instant loading
  if (
    request.destination === 'document' ||
    request.destination === 'script' ||
    request.destination === 'style' ||
    url.origin === self.location.origin
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request).then((networkResponse) => {
          if (networkResponse.status === 200) {
            const cacheCopy = networkResponse.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, cacheCopy));
          }
          return networkResponse;
        }).catch(() => {
          // Fallback to cached index.html for SPA page loads if network fails and route is not in cache
          if (request.destination === 'document') {
            return caches.match('/index.html') || caches.match('/');
          }
          return null;
        });

        // Instantly return the cached app shell while updating in background, fallback to offline index.html if completely empty
        return cachedResponse || fetchPromise;
      })
    );
    return;
  }
});

// Limits the number of items stored in a given cache to prevent storage leaks
function limitCacheSize(cacheName, maxItems) {
  caches.open(cacheName).then((cache) => {
    cache.keys().then((keys) => {
      if (keys.length > maxItems) {
        cache.delete(keys[0]).then(() => {
          limitCacheSize(cacheName, maxItems);
        });
      }
    });
  });
}

// Creative fallback SVG image when completely offline & loading on low connection, matching our Bento Grid palette
function getOfflineImageFallback() {
  const offlineSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <rect width="100" height="100" fill="#ede0c8" />
      <circle cx="50" cy="45" r="15" fill="none" stroke="#2a1f17" stroke-width="3" stroke-dasharray="4, 4" />
      <text x="50" y="75" font-family="monospace" font-size="7" font-weight="bold" fill="#6b5d4f" text-anchor="middle">OFFLINE</text>
    </svg>
  `;
  return new Response(offlineSvg, {
    status: 200,
    headers: { 'Content-Type': 'image/svg+xml' }
  });
}
