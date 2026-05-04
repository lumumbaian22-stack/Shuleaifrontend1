(function(){
  const manifest = [
    "js/api.js",
    "js/auth.js",
    "js/helpers.js",
    "js/ui-helpers.js",
    "js/curriculum.js",
    "js/auth-modal.js",
    "js/websocket.js",
    "js/class-management.js",
    "js/csv-upload.js",
    "js/upload.js",
    "js/calendar.js",
    "js/messaging.js",
    "js/chat-v9-ui.js",
    "js/admin-departments-v92.js",
    "js/duty.js",
    "js/duty-v93-ui.js",
    "js/notifications.js",
    "js/duty-points.js",
    "js/chat.js",
    "js/profile.js",
    "js/tasks.js",
    "js/analytics.js",
    "js/analytics-dashboard.js",
    "js/student-details-unified.js",
    "js/landing-premium.js",
    "js/v12-dashboard-recovery.js",
    "js/shule-ai-production-overrides.js",
    "js/shule-ai-v12-dashboard-core.js",
    "js/app-health.js"
  ];
  function loadScript(src){
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src + (src.includes('?') ? '&' : '?') + 'v=production-v3-clean-dashboard';
      s.async = false;
      s.onload = () => resolve(src);
      s.onerror = () => reject(new Error('Failed to load ' + src));
      document.head.appendChild(s);
    });
  }
  async function boot(){
    window.SHULE_AI_BOOT = { startedAt: new Date().toISOString(), loaded: [], failed: [], mode: 'v3-clean-dashboard' };
    for (const src of manifest) {
      try { await loadScript(src); window.SHULE_AI_BOOT.loaded.push(src); }
      catch (error) { console.error(error); window.SHULE_AI_BOOT.failed.push(src); }
    }
    window.dispatchEvent(new CustomEvent('shule-ai-production-ready', { detail: window.SHULE_AI_BOOT }));
    console.log('✅ Shule AI clean production loader completed', window.SHULE_AI_BOOT);
  }
  boot();
})();
