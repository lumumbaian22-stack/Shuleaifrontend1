const CACHE_NAME = 'shule-ai-2038-functional-flow-integrity-lock';
const CORE_ASSETS = ['/', '/index.html', '/manifest.json', '/offline.html'];
const DYNAMIC_FILE_RE = /\.(?:js|css|html|json)$/i;

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME && k.startsWith('shule-ai-')).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
  if (event.data && event.data.type === 'CLEAR_OLD_CACHES') {
    event.waitUntil(caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k)))));
  }
});

self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  // Never proxy cross-origin backend/API/socket calls through the PWA worker.
  // Let the browser talk directly to Render so CORS/auth errors are real and do not
  // become service-worker "Failed to fetch" crashes.
  if (url.origin !== self.location.origin) return;

  if (req.method !== 'GET') return;
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/socket.io/') || url.pathname.startsWith('/uploads/') || req.headers.get('authorization')) return;

  if (req.mode === 'navigate' || DYNAMIC_FILE_RE.test(url.pathname)) {
    return event.respondWith(
      fetch(req, { cache: 'no-store' })
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, copy)).catch(() => null);
          return res;
        })
        .catch(() => caches.match(req).then(cached => cached || caches.match('/index.html')))
    );
  }

  event.respondWith(
    caches.match(req).then(cached => cached || fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(req, copy)).catch(() => null);
      return res;
    }).catch(() => caches.match('/offline.html')))
  );
});
