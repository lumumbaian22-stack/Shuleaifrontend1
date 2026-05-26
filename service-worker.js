/* Shule AI V86 service worker - conservative PWA shell cache */
const CACHE_NAME = 'shule-ai-v86-shell';
const APP_SHELL = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/css/style.css',
  '/css/dashboard-production.css',
  '/css/theme-system.css',
  '/css/help-support.css',
  '/css/mobile-responsive-pwa.css',
  '/css/mobile-complete-v86.css',
  '/js/mobile-responsive-pwa.js',
  '/js/mobile-complete-v86.js',
  '/assets/logo.png',
  '/assets/logo-light.png',
  '/assets/logo-dark.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL.map(url => new Request(url, { cache: 'reload' })))).catch(() => null)
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  if (req.method !== 'GET') return;

  // Never cache API responses: fees, payments, marks, attendance and auth must stay live.
  if (url.pathname.startsWith('/api/') || url.hostname.includes('onrender.com')) return;

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).then(response => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put('/index.html', copy)).catch(() => null);
        return response;
      }).catch(() => caches.match('/offline.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(cached => cached || fetch(req).then(response => {
      if (!response || response.status !== 200 || response.type === 'opaque') return response;
      const copy = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(req, copy)).catch(() => null);
      return response;
    }).catch(() => cached))
  );
});
