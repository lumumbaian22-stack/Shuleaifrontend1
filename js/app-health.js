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


// Shule AI v145 service-worker registration
(function () {
  if (!('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js?v=145', { updateViaCache:'none' })
      .then(async (registration) => {
        if (registration.waiting) registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        try { await registration.update?.(); } catch (_) {}
      })
      .catch((error) => console.warn('[Shule AI] Service worker registration failed:', error?.message || error));
  });
})();
