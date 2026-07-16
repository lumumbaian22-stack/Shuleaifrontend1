// Health guard: never force-hide loading before a visible app shell exists.
window.addEventListener('load', () => {
  setTimeout(() => {
    const overlay = document.getElementById('loading-overlay');
    const landing = document.getElementById('landing-page');
    const dashboard = document.getElementById('dashboard-container');
    const hasVisibleShell = (landing && getComputedStyle(landing).display !== 'none') || (dashboard && getComputedStyle(dashboard).display !== 'none');
    if (overlay && hasVisibleShell) overlay.classList.add('hidden');
  }, 2500);
});

// Shule AI v149.8 final service-worker registration and stale-cache cleanup.
(function () {
  if (!('serviceWorker' in navigator)) return;
  const BUILD = '2031-student-ai-chatbot-onboarding-project-learning-assistant-lock';
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    refreshing = true;
    try {
      const key = 'shule-sw-reloaded-' + BUILD;
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, '1');
        location.reload();
      }
    } catch (_) {}
  });
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js?v=2031-student-ai-chatbot-onboarding-project-learning-assistant-lock', { updateViaCache:'none' });
      try { registration.active?.postMessage({ type: 'CLEAR_OLD_CACHES' }); } catch (_) {}
      if (registration.waiting) registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      try { await registration.update?.(); } catch (_) {}
    } catch (error) {
      console.warn('[Shule AI] Service worker registration failed:', error?.message || error);
    }
  });
})();
