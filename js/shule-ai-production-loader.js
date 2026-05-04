
(function(){
  const manifest = [
  "js/api.js",
  "js/auth.js",
  "js/websocket.js",
  "js/helpers.js",
  "js/ui-helpers.js",
  "js/curriculum.js",
  "js/duty.js",
  "js/super-admin-approvals.js",
  "js/admin-approval.js",
  "js/class-management.js",
  "js/student-dashboard.js",
  "js/admin-student-management.js",
  "js/teacher-student-management.js",
  "js/csv-upload.js",
  "js/analytics.js",
  "js/upload.js",
  "js/calendar.js",
  "js/messaging.js",
  "js/teacher-dashboard.js",
  "js/superadmin-dashboard.js",
  "js/admin-dashboard.js",
  "js/parent-dashboard.js",
  "js/student-dashboard-extended.js",
  "js/sidebar.js",
  "js/dashboard-core.js",
  "js/auth-modal.js",
  "js/auth-self-test.js",
  "js/global-profile-v92.js",
  "js/chat-v9-ui.js",
  "js/admin-departments-v92.js",
  "js/duty-v93-ui.js",
  "js/name-change.js",
  "js/notifications.js",
  "js/duty-points.js",
  "js/chat.js",
  "js/profile.js",
  "js/tasks.js",
  "js/analytics-dashboard.js",
  "js/student-details-unified.js",
  "js/landing-premium.js",
  "js/dashboard-production.js",
  "js/main.js",
  "js/app-health.js",
  "js/v94-modals-alerts-marks.js",
  "js/v95-exact-approved-visuals.js",
  "js/v96-functional-approved-visuals.js",
  "js/v97-modal-stability.js",
  "js/v11-daraja-payments.js",
  "js/v12-dashboard-recovery.js",
  "js/shule-ai-production-overrides.js"
];
  function loadScript(src){
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src + (src.includes('?') ? '&' : '?') + 'v=production-v2';
      s.async = false;
      s.onload = () => resolve(src);
      s.onerror = () => reject(new Error('Failed to load ' + src));
      document.head.appendChild(s);
    });
  }
  async function boot(){
    window.SHULE_AI_BOOT = { startedAt: new Date().toISOString(), loaded: [], failed: [] };
    for (const src of manifest) {
      try { await loadScript(src); window.SHULE_AI_BOOT.loaded.push(src); }
      catch (error) { console.error(error); window.SHULE_AI_BOOT.failed.push(src); }
    }
    window.dispatchEvent(new CustomEvent('shule-ai-production-ready', { detail: window.SHULE_AI_BOOT }));
    console.log('✅ Shule AI production loader completed', window.SHULE_AI_BOOT);
  }
  boot();
})();
