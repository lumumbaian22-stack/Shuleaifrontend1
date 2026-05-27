// global-realtime-sync.js
// Dashboard-wide realtime refresh coordinator.
// DB remains source of truth; this file only refetches affected sections after backend emits changes.
(function () {
  'use strict';

  const w = window;
  const pending = new Map();
  const MIN_DELAY = 250;
  const MAX_DELAY = 900;

  function currentUser() {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch (_) { return {}; }
  }

  function currentRole() {
    const u = currentUser();
    return String(u.role || localStorage.getItem('role') || '').toLowerCase().replace('-', '_');
  }

  function hasAuthToken() {
    return !!(localStorage.getItem('authToken') || localStorage.getItem('token'));
  }

  function isAdminLike() {
    const role = currentRole();
    return role === 'admin' || role === 'super_admin' || role === 'superadmin';
  }

  function isParent() { return currentRole() === 'parent'; }
  function isStudent() { return currentRole() === 'student'; }
  function isTeacher() { return currentRole() === 'teacher'; }

  function currentSchoolCode() {
    const u = currentUser();
    if (u.schoolCode) return String(u.schoolCode);
    try {
      const s = JSON.parse(localStorage.getItem('school') || '{}');
      return String(s.schoolId || s.schoolCode || s.shortCode || '');
    } catch (_) { return ''; }
  }

  function belongsToThisSchool(evt) {
    const mine = currentSchoolCode();
    const incoming = String(evt?.schoolCode || evt?.schoolId || '');
    return !incoming || !mine || incoming === mine;
  }

  function debounce(key, fn, delay = MIN_DELAY) {
    if (pending.has(key)) clearTimeout(pending.get(key));
    pending.set(key, setTimeout(async () => {
      pending.delete(key);
      try { await fn(); } catch (e) { console.warn('[RealtimeSync] refresh failed:', key, e.message); }
    }, delay));
  }

  async function callIf(fnName, ...args) {
    if (typeof w[fnName] === 'function') return w[fnName](...args);
  }

  function refreshCurrentSection(reason) {
    const section = w.currentSection || w.activeDashboardSection;
    if (!section) return;
    debounce(`section:${section}`, async () => {
      if (typeof w.showDashboardSection === 'function') await w.showDashboardSection(section, { realtime: true, reason });
      else if (typeof w.showSection === 'function') await w.showSection(section);
    }, MAX_DELAY);
  }

  function isPlatformSubscriptionEvent(evt){ const t=String(evt?.type||'').toLowerCase(); const paid=String(evt?.paidTo||evt?.metadata?.paidTo||evt?.data?.paidTo||'').toLowerCase(); const ptype=String(evt?.paymentType||evt?.metadata?.paymentType||evt?.data?.paymentType||'').toLowerCase(); const src=String(evt?.source||evt?.metadata?.source||evt?.data?.source||'').toLowerCase(); return t.includes('subscription') || paid==='platform' || ptype==='subscription' || src.includes('subscription'); }
  function isFinanceSection(){ return ['finance','finance-fees','payment-settings','fee-structures','records','verification'].includes(String(w.currentSection||w.activeDashboardSection||'')); }
  function refreshSubscription(evt){ debounce('subscription', async()=>{ if (typeof w.refreshSubscriptionBilling === 'function') return w.refreshSubscriptionBilling(); if (isAdminLike() && String(w.currentSection||'')==='subscription-billing' && typeof w.showDashboardSection==='function') return w.showDashboardSection('subscription-billing',{realtime:true,reason:evt?.type}); if (isParent() && typeof w.loadParentSubscriptions==='function') return w.loadParentSubscriptions(); }, MAX_DELAY); }

  function refreshFinance(evt) {
    if (isPlatformSubscriptionEvent(evt)) { refreshSubscription(evt); return; }
    debounce('finance', async () => {
      // HARD ROLE GATE: parent/student/teacher dashboards must never call admin finance endpoints.
      // This prevents /api/admin/classes, /api/fee-structures, /api/payments/admin/* 403 spam on parent dashboards.
      if (isParent()) {
        await Promise.allSettled([
          callIf('refreshParentPaymentsSilent'),
          callIf('v75ParentPaymentsRefresh'),
          callIf('loadParentPaymentHistory'),
          callIf('loadParentSubscriptions'),
          callIf('loadNotifications'),
          callIf('loadAlerts')
        ]);
        if (w.currentSection === 'payments') refreshCurrentSection(evt.type);
        return;
      }
      if (!isAdminLike()) return;
      if (!isFinanceSection()) return;
      if (typeof w.financeV31Refresh === 'function') return w.financeV31Refresh();
      if (typeof w.v31RenderFinanceFees === 'function' && (w.currentSection === 'finance' || w.currentSection === 'finance-fees')) return w.v31RenderFinanceFees();
      refreshCurrentSection(evt.type);
    });
  }

  function refreshGrades(evt) {
    debounce('grades', async () => {
      await Promise.allSettled([
        callIf('loadStudentGrades'),
        callIf('refreshSavedClassReports'),
        callIf('refreshTeacherGrades'),
        callIf('loadParentDashboard')
      ]);
      if (['grades','students','my-students'].includes(w.currentSection)) refreshCurrentSection(evt.type);
    });
  }

  function refreshAttendance(evt) {
    debounce('attendance', async () => {
      const calls = [];
      if (isStudent()) calls.push(callIf('loadStudentAttendance'));
      if (isTeacher() || isAdminLike()) calls.push(callIf('loadLiveAttendance'), callIf('refreshMyStudents'), callIf('refreshStudentsList'));
      await Promise.allSettled(calls);
      if (w.currentSection === 'attendance') refreshCurrentSection(evt.type);
    });
  }

  function refreshHomework(evt) {
    debounce('homework', async () => {
      const calls = [];
      if (isStudent()) calls.push(callIf('v66LoadStudentHomework'), callIf('loadStudentHomework'));
      if (isTeacher() || isAdminLike()) calls.push(callIf('refreshTeacherHomework'), callIf('v12RenderTeacherHomework'));
      await Promise.allSettled(calls);
      if (w.currentSection === 'homework') refreshCurrentSection(evt.type);
    });
  }

  function refreshAlerts(evt) {
    debounce('alerts', async () => {
      await Promise.allSettled([callIf('loadNotifications'), callIf('loadAlerts')]);
      if (w.currentSection === 'alerts') refreshCurrentSection(evt.type);
    });
  }

  function refreshPeople(evt) {
    debounce('people', async () => {
      await Promise.allSettled([
        callIf('refreshStudentsList'),
        callIf('refreshTeachersList'),
        callIf('refreshClassesList'),
        callIf('refreshMyStudents')
      ]);
      if (['students','teachers','classes','my-students'].includes(w.currentSection)) refreshCurrentSection(evt.type);
    });
  }

  function refreshAnalytics(evt) {
    debounce('analytics', async () => {
      await Promise.allSettled([callIf('loadAnalytics'), callIf('refreshAnalytics'), callIf('renderAnalyticsDashboard')]);
      if (w.currentSection === 'analytics') refreshCurrentSection(evt.type);
    }, MAX_DELAY);
  }

  function routeRealtimeEvent(evt) {
    if (!hasAuthToken()) return;
    if (!evt || !evt.type || !belongsToThisSchool(evt)) return;
    const type = String(evt.type);

    if (type.includes('subscription')) refreshSubscription(evt);
    if ((type.includes('payment') || type.includes('fee')) && !isPlatformSubscriptionEvent(evt)) refreshFinance(evt);
    if (type.includes('grade') || type.includes('mark') || type.includes('report')) refreshGrades(evt);
    if (type.includes('attendance')) refreshAttendance(evt);
    if (type.includes('homework')) refreshHomework(evt);
    if (type.includes('alert') || type.includes('approval')) refreshAlerts(evt);
    if (type.includes('student') || type.includes('teacher') || type.includes('parent') || type.includes('class')) refreshPeople(evt);
    if (type.includes('analytics') || type.includes('payment') || type.includes('fee') || type.includes('grade') || type.includes('attendance') || type.includes('homework')) refreshAnalytics(evt);

    w.dispatchEvent(new CustomEvent('shule:realtime-update', { detail: evt }));
  }

  function attachSocketListeners() {
    const socket = w.socket;
    if (!socket || socket.__globalRealtimeAttached) return;
    socket.__globalRealtimeAttached = true;

    socket.on('realtime:update', routeRealtimeEvent);
    [
      'payment:updated','fees:updated','grades:updated','reports:updated','attendance:updated',
      'homework:updated','alerts:updated','approvals:updated','analytics:updated','student:updated',
      'teacher:updated','class:updated','timetable:updated'
    ].forEach(eventName => socket.on(eventName, (payload) => routeRealtimeEvent({ ...(payload || {}), type: eventName })));
  }

  const originalConnect = w.connectWebSocket;
  if (typeof originalConnect === 'function' && !originalConnect.__realtimeWrapped) {
    const wrapped = function () {
      const out = originalConnect.apply(this, arguments);
      setTimeout(attachSocketListeners, 500);
      setTimeout(attachSocketListeners, 1500);
      return out;
    };
    wrapped.__realtimeWrapped = true;
    w.connectWebSocket = wrapped;
  }

  w.addEventListener('shule:finance-updated', (e) => routeRealtimeEvent({ type: 'payment:updated', ...(e.detail || {}) }));
  w.addEventListener('shule:grades-updated', (e) => routeRealtimeEvent({ type: 'grades:updated', ...(e.detail || {}) }));
  w.addEventListener('shule:attendance-updated', (e) => routeRealtimeEvent({ type: 'attendance:updated', ...(e.detail || {}) }));
  w.addEventListener('shule:homework-updated', (e) => routeRealtimeEvent({ type: 'homework:updated', ...(e.detail || {}) }));

  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(attachSocketListeners, 800);
    setInterval(attachSocketListeners, 5000);
  });

  w.ShuleRealtimeSync = { routeRealtimeEvent, attachSocketListeners };
})();
