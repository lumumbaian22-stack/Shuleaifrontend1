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
