/* Shule AI V128 service worker - complete app shell cache, API-safe */
const CACHE_NAME = 'shule-ai-v128-full-locked-final-fix';
const APP_SHELL = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/css/approved-student-teacher-ui.css',
  '/css/approved-visuals.css',
  '/css/chat-v9.css',
  '/css/dashboard-production.css',
  '/css/help-support.css',
  '/css/landing-premium.css',
  '/css/mobile-complete.css',
  '/css/mobile-responsive-pwa.css',
  '/css/owner-level-hardening.css',
  '/css/rollout-stability-polish.css',
  '/css/shule-clean-consolidated-source.css',
  '/css/style.css',
  '/css/theme-stability.css',
  '/css/theme-system.css',
  '/js/admin-approval.js',
  '/js/admin-dashboard.js',
  '/js/admin-departments.js',
  '/js/admin-student-management.js',
  '/js/analytics-dashboard.js',
  '/js/analytics.js',
  '/js/api.js',
  '/js/app-health.js',
  '/js/approved-student-teacher-ui.js',
  '/js/approved-visuals.js',
  '/js/auth-modal.js',
  '/js/auth-self-test.js',
  '/js/auth.js',
  '/js/branding-manager.js',
  '/js/calendar.js',
  '/js/chat-v9-ui.js',
  '/js/chat.js',
  '/js/class-management.js',
  '/js/csv-upload.js',
  '/js/curriculum.js',
  '/js/dashboard-controller.js',
  '/js/duty-points.js',
  '/js/duty-ui.js',
  '/js/duty.js',
  '/js/finance-fees.js',
  '/js/global-profile.js',
  '/js/global-realtime-sync.js',
  '/js/help-support.js',
  '/js/helpers.js',
  '/js/landing-premium.js',
  '/js/main.js',
  '/js/messaging.js',
  '/js/mobile-complete.js',
  '/js/mobile-responsive-pwa.js',
  '/js/name-change.js',
  '/js/notifications.js',
  '/js/owner-level-hardening.js',
  '/js/parent-dashboard.js',
  '/js/profile.js',
  '/js/rollout-stability-polish.js',
  '/js/shule-clean-consolidated-source.js',
  '/js/student-dashboard-extended.js',
  '/js/student-dashboard.js',
  '/js/student-details-unified.js',
  '/js/super-admin-approvals.js',
  '/js/superadmin-dashboard.js',
  '/js/tasks.js',
  '/js/teacher-dashboard.js',
  '/js/teacher-student-management.js',
  '/js/timetable.js',
  '/js/ui-helpers.js',
  '/js/upload.js',
  '/js/websocket.js',
  '/assets/logo-dark.png',
  '/assets/logo-light.png',
  '/assets/logo.png',
  '/legal/dpa.html',
  '/legal/privacy.html',
  '/legal/terms.html'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL.map(url => new Request(url, { cache: 'reload' })))).catch(() => null));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== 'GET') return;
  if (url.pathname.startsWith('/api/') || url.hostname.includes('onrender.com')) return;

  if (req.mode === 'navigate') {
    event.respondWith(fetch(req).then(response => {
      const copy = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put('/index.html', copy)).catch(() => null);
      return response;
    }).catch(() => caches.match('/index.html').then(r => r || caches.match('/offline.html'))));
    return;
  }

  event.respondWith(caches.match(req).then(cached => cached || fetch(req).then(response => {
    if (!response || response.status !== 200 || response.type === 'opaque') return response;
    const copy = response.clone();
    caches.open(CACHE_NAME).then(cache => cache.put(req, copy)).catch(() => null);
    return response;
  }).catch(() => cached)));
});
