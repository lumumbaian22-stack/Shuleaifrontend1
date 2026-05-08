(function(){
  'use strict';
  window.SHULE_V26_STABILITY = true;

  function safeUser(){
    try {
      const raw = localStorage.getItem('user') || localStorage.getItem('currentUser') || sessionStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }
  window.getSafeCurrentUser = window.getSafeCurrentUser || safeUser;

  // Prevent missing optional functions from crashing old onclick handlers.
  const noopNames = [
    'toggleNotifications','toggleUserMenu','toggleTheme','showDashboardSection',
    'v93OpenDepartmentGroupChat','v16RefreshTeacherDutyCard','v17RefreshTeacherDutyCard'
  ];
  noopNames.forEach(name => { if (typeof window[name] !== 'function') window[name] = function(){ console.warn('[V26] Missing optional UI function ignored:', name); }; });

  // Convert unhandled UI promise errors into visible warnings instead of full crash loops.
  window.addEventListener('unhandledrejection', function(event){
    const msg = event.reason && (event.reason.message || String(event.reason));
    if (msg && /Cannot (set|read) properties of null|Route not found|Forbidden|Not authorized/i.test(msg)) {
      console.warn('[V26 stability caught]', msg);
      event.preventDefault();
    }
  });

  // Stable dashboard helpers.
  window.shuleSafeSetHTML = function(id, html){ const el=document.getElementById(id); if(el) el.innerHTML=html; return !!el; };
  window.shuleSafeText = function(id, text){ const el=document.getElementById(id); if(el) el.textContent=text; return !!el; };

  // Dark/light hardening for old panels.
  const css = document.createElement('style');
  css.id = 'v26-theme-hardening';
  css.textContent = `
    :root{--shule-bg:#ffffff;--shule-text:#111827;--shule-card:#ffffff;--shule-border:#e5e7eb;}
    .dark,[data-theme="dark"]{--shule-bg:#0f172a;--shule-text:#f8fafc;--shule-card:#111827;--shule-border:#334155;}
    .dark .card,.dark .modal,.dark .dashboard-card,.dark .section-card,.dark table,.dark .bg-white,
    [data-theme="dark"] .card,[data-theme="dark"] .modal,[data-theme="dark"] .dashboard-card,[data-theme="dark"] .section-card,[data-theme="dark"] table,[data-theme="dark"] .bg-white{background:var(--shule-card)!important;color:var(--shule-text)!important;border-color:var(--shule-border)!important;}
    .dark input,.dark select,.dark textarea,[data-theme="dark"] input,[data-theme="dark"] select,[data-theme="dark"] textarea{background:#1f2937!important;color:#f9fafb!important;border-color:#475569!important;}
    .dark table th,.dark table td,[data-theme="dark"] table th,[data-theme="dark"] table td{color:var(--shule-text)!important;border-color:var(--shule-border)!important;}
  `;
  document.head.appendChild(css);

  console.log('✅ Shule AI V26 frontend stability hotfix loaded');
})();
