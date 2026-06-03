// Shule AI v123: hard pilot/demo/free visibility fix. Loaded last.
(function(){
  'use strict';
  if (window.__v123PilotVisibilityHardFixLoaded) return;
  window.__v123PilotVisibilityHardFixLoaded = true;

  const FULL_ACCESS_FEATURES = [
    '*','dashboard','teachers','teacher_approvals','students','analytics','alerts','finance_fees','parent_messages','school_settings','billing','classes','report_cards',
    'calendar','school_branding','timetable','homework','duty','fairness_report','departments','bulk_sms','senior_subject_choice','advanced_report_cards',
    'ai_tutor','ai_tutor_limited','ai_tutor_extended','live_child_analytics','advanced_alerts','child_recommendations'
  ];

  function role(){
    try {
      const u = typeof getCurrentUser === 'function' ? getCurrentUser() : JSON.parse(localStorage.getItem('user') || '{}');
      return String(u?.role || localStorage.getItem('userRole') || window.currentRole || '').toLowerCase().replace('-', '_');
    } catch (_) { return String(localStorage.getItem('userRole') || window.currentRole || '').toLowerCase().replace('-', '_'); }
  }

  function looksFullAccess(data){
    const d = data || window.ShulePlanState || {};
    const sub = d.subscription || {};
    const text = [
      d.accessMode, d.accessStatus, d.status, d.planCode, d.currentPlan, d.schoolTier, d.plan, d.reason,
      sub.planCode, sub.status, localStorage.getItem('shule_full_access_override')
    ].filter(Boolean).join(' ').toLowerCase();
    return d.fullAccess === true || d.override === true || d.pilotFullAccessEnabled === true || d.demoMode === true || d.freeFullAccess === true ||
      localStorage.getItem('shule_full_access_override') === 'true' ||
      /pilot[_\s-]*full|full[_\s-]*pilot|demo[_\s-]*full|free[_\s-]*full|manual[_\s-]*full|full[_\s-]*access/.test(text);
  }

  function applyFullAccess(data){
    window.ShulePlanState = {
      ...(window.ShulePlanState || {}),
      ...(data || {}),
      fullAccess: true,
      override: true,
      accessMode: (data && data.accessMode) || 'pilot_full_access',
      accessStatus: 'active',
      status: 'active',
      planCode: 'enterprise',
      currentPlan: 'Enterprise / Full Access',
      schoolTier: 'Enterprise / Full Access',
      features: [...FULL_ACCESS_FEATURES],
      featureList: [...FULL_ACCESS_FEATURES],
      hiddenFeatures: [],
      gracefulMode: false
    };
    try {
      localStorage.setItem('schoolPlan', 'enterprise');
      localStorage.setItem('shule_full_access_override', 'true');
    } catch (_) {}
    document.documentElement.setAttribute('data-shule-full-access', 'true');
    document.body?.setAttribute('data-shule-full-access', 'true');
  }

  function clearFullAccessIfServerSaysNo(data){
    if (!data || looksFullAccess(data)) return;
    try { localStorage.removeItem('shule_full_access_override'); } catch (_) {}
    document.documentElement.removeAttribute('data-shule-full-access');
    document.body?.removeAttribute('data-shule-full-access');
  }

  async function refreshStatus(){
    if (!localStorage.getItem('token')) return looksFullAccess();
    try {
      const res = await (window.apiRequest ? window.apiRequest('/api/subscriptions/my-status') : fetch('/api/subscriptions/my-status').then(r => r.json()));
      const data = res && (res.data || res);
      if (looksFullAccess(data)) { applyFullAccess(data); return true; }
      clearFullAccessIfServerSaysNo(data);
      window.ShulePlanState = { ...(window.ShulePlanState || {}), ...(data || {}) };
      return false;
    } catch (e) {
      console.warn('[v123] could not refresh subscription status:', e.message);
      return looksFullAccess();
    }
  }

  function restoreHiddenFeatures(){
    if (!looksFullAccess()) return;
    const selectors = [
      '[data-shule-pruned="true"]','[data-feature-hidden="true"]','[data-plan-hidden="true"]','[data-feature-required]',
      '[hidden][data-section]','[hidden].sidebar-link','[hidden].mobile-nav-item','[style*="display: none"][data-section]'
    ].join(',');
    document.querySelectorAll(selectors).forEach(el => {
      el.hidden = false;
      el.style.display = '';
      el.style.visibility = '';
      el.style.opacity = '';
      el.removeAttribute('data-shule-pruned');
      el.removeAttribute('data-feature-hidden');
      el.removeAttribute('data-plan-hidden');
      el.classList.remove('hidden');
    });
  }

  const ADMIN_FULL_SECTIONS = [
    ['layout-dashboard','Dashboard','dashboard'],['users','Teachers','teachers'],['user-plus','Teacher Approvals','teacher-approvals'],['graduation-cap','Students','students'],['users','Classes','classes'],
    ['book-open','Custom Subjects','custom-subjects'],['list-checks','Student Subjects','student-subject-selection'],['calendar','Calendar','calendar'],['clock','Timetable','timetable'],['book-open','Homework','homework'],
    ['clock','Duty','duty'],['building-2','Departments','departments'],['bar-chart-2','Fairness Report','fairness-report'],['trending-up','Analytics','analytics'],['bell','Alerts Center','alerts'],
    ['message-square','Bulk SMS','sms'],['message-circle','Parent Messages','parent-messages'],['wallet','Finance & Fees','finance-fees']
  ];
  const ADMIN_FULL_SETTINGS = [
    ['settings','School Settings','settings'],['credit-card','Subscription & Billing','subscription-billing'],['palette','School Branding','school-branding'],['help-circle','Help','help']
  ];
  const TEACHER_FULL_SECTIONS = [
    ['layout-dashboard','Dashboard','dashboard'],['users','My Students','students'],['calendar-check','Attendance','attendance'],['trending-up','Grades','grades'],['check-square','Tasks','tasks'],
    ['clock','My Duty','duty'],['settings','Duty Preferences','duty-preferences'],['message-circle','Messages','staff-chat'],['list-checks','Subject Requests','subject-requests'],
    ['bar-chart-2','Analytics','analytics'],['calendar','My Timetable','my-timetable'],['book-open','Homework','homework'],['bell','Alerts','alerts']
  ];
  const PARENT_FULL_SECTIONS = [
    ['layout-dashboard','Dashboard','dashboard'],['trending-up','Progress','progress'],['credit-card','Payments','payments'],['calendar','Child Timetable','timetable'],['message-circle','Messages','chat'],
    ['list-checks','Subject Choice','subject-choice'],['bell','Alerts','alerts'],['bar-chart-2','Analytics','analytics']
  ];
  const STUDENT_FULL_SECTIONS = [
    ['layout-dashboard','Dashboard','dashboard'],['trending-up','My Grades','grades'],['calendar-check','Attendance','attendance'],['message-circle','Study Chat','chat'],['bot','AI Tutor','ai-tutor'],
    ['compass','Career Path','career-path'],['bell','Alerts','alerts'],['calendar','My Timetable','schedule'],['shopping-bag','Rewards','rewards'],['book-open','My Homework','my-homework'],['bar-chart-2','Analytics','analytics']
  ];

  function linkHtml(item){
    const [icon,label,section] = item;
    return `<a href="#" onclick="showDashboardSection('${section}')" class="flex items-center gap-3 rounded-lg px-3 py-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors sidebar-link" data-section="${section}"><i data-lucide="${icon}" class="h-5 w-5"></i><span>${label}</span></a>`;
  }
  function mobileHtml(item){
    const [icon,label,section] = item;
    return `<a href="#" onclick="showDashboardSection('${section}')" class="mobile-nav-item flex flex-col items-center justify-center flex-1 h-14 text-muted-foreground" data-section="${section}"><i data-lucide="${icon}" class="h-5 w-5"></i><span class="text-xs mt-1">${label}</span></a>`;
  }

  function renderFullAccessSidebar(){
    if (!looksFullAccess()) return;
    const r = role();
    const nav = document.getElementById('sidebar-nav');
    const settingsNav = document.getElementById('settings-nav');
    const mobileNav = document.getElementById('mobile-nav');
    if (!nav) return;
    let main = null, settings = [['settings','My Settings','settings'],['help-circle','Help','help']];
    if (r === 'admin') { main = ADMIN_FULL_SECTIONS; settings = ADMIN_FULL_SETTINGS; }
    else if (r === 'teacher') { main = TEACHER_FULL_SECTIONS; }
    else if (r === 'parent') { main = PARENT_FULL_SECTIONS; }
    else if (r === 'student') { main = STUDENT_FULL_SECTIONS; }
    else return;
    nav.innerHTML = main.map(linkHtml).join('');
    if (settingsNav) settingsNav.innerHTML = settings.map(linkHtml).join('');
    if (mobileNav) mobileNav.innerHTML = main.slice(0,4).map(mobileHtml).join('');
    if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
  }

  const oldUpdateSidebar = window.updateSidebar;
  window.updateSidebar = function(r){
    const out = oldUpdateSidebar ? oldUpdateSidebar.apply(this, arguments) : undefined;
    if (looksFullAccess()) { renderFullAccessSidebar(); restoreHiddenFeatures(); }
    return out;
  };

  const oldShowDashboard = window.showDashboard;
  if (typeof oldShowDashboard === 'function') {
    window.showDashboard = async function(){
      await refreshStatus();
      const out = await oldShowDashboard.apply(this, arguments);
      await refreshStatus();
      renderFullAccessSidebar();
      restoreHiddenFeatures();
      setTimeout(()=>{ renderFullAccessSidebar(); restoreHiddenFeatures(); }, 150);
      return out;
    };
  }

  const oldShowSection = window.showDashboardSection;
  if (typeof oldShowSection === 'function') {
    window.showDashboardSection = async function(section){
      if (looksFullAccess()) { restoreHiddenFeatures(); return oldShowSection.apply(this, arguments); }
      await refreshStatus();
      if (looksFullAccess()) { renderFullAccessSidebar(); restoreHiddenFeatures(); return oldShowSection.apply(this, arguments); }
      return oldShowSection.apply(this, arguments);
    };
  }

  const oldRenderSection = window.renderDashboardSection;
  if (typeof oldRenderSection === 'function') {
    window.renderDashboardSection = async function(r, section){
      if (looksFullAccess()) restoreHiddenFeatures();
      return oldRenderSection.apply(this, arguments);
    };
  }

  document.addEventListener('DOMContentLoaded', async () => {
    await refreshStatus();
    renderFullAccessSidebar();
    restoreHiddenFeatures();
    setTimeout(()=>{ renderFullAccessSidebar(); restoreHiddenFeatures(); }, 500);
    try { new MutationObserver(() => { if (looksFullAccess()) { renderFullAccessSidebar(); restoreHiddenFeatures(); } }).observe(document.body, { childList:true, subtree:true, attributes:true, attributeFilter:['hidden','style','class','data-shule-pruned','data-feature-hidden'] }); } catch(_) {}
  });
  setTimeout(async()=>{ await refreshStatus(); renderFullAccessSidebar(); restoreHiddenFeatures(); }, 1000);
  setInterval(()=>{ if(looksFullAccess()) { renderFullAccessSidebar(); restoreHiddenFeatures(); } }, 2500);
})();
