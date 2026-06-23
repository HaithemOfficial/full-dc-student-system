/* eslint-disable no-restricted-globals */
const CACHE = 'en-precache-v1';
const API_CACHE = 'en-api-v1';
// self.__WB_MANIFEST is replaced by vite-plugin-pwa with the list of hashed assets to precache
const PRECACHE_URLS = self.__WB_MANIFEST || [];

self.addEventListener('install', event => {
  const urls = PRECACHE_URLS.map(e => (typeof e === 'string' ? e : e.url));
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(urls))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE && k !== API_CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and cross-origin
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  // API: NetworkFirst with 10s timeout, fall back to cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      Promise.race([
        fetch(request.clone()).then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(API_CACHE).then(c => c.put(request, clone));
          }
          return response;
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 10000)),
      ]).catch(() => caches.match(request))
    );
    return;
  }

  // Navigate: network first, fall back to cached index.html (SPA)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match('/index.html').then(r => r || fetch(request))
      )
    );
    return;
  }

  // Static assets: CacheFirst
  event.respondWith(
    caches.match(request).then(cached => cached || fetch(request))
  );
});

// Push notification received (app may be closed)
self.addEventListener('push', event => {
  const data = event.data?.json() ?? {};
  const title = data.title || 'El Nadjah';
  const options = {
    body: data.body || '',
    icon: '/icon.png',
    badge: '/icon.png',
    tag: 'el-nadjah',
    renotify: true,
    data,
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// User clicks the push notification — open/focus the app
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then(list => {
        const existing = list.find(c => 'focus' in c);
        if (existing) {
          existing.focus();
          return existing.navigate('/notifications');
        }
        return self.clients.openWindow('/notifications');
      })
  );
});
