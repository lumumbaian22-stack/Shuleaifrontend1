// global-realtime-sync.js
// Role-safe realtime refresh coordinator.
// Fixes parent/admin finance bleed: parents never call admin Finance & Fees loaders.
(function () {
  'use strict';

  const w = window;
  const pending = new Map();
  const MIN_DELAY = 300;
  const MAX_DELAY = 900;

  function currentUser() {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch (_) { return {}; }
  }

  function role() {
    return String(currentUser().role || localStorage.getItem('role') || '').toLowerCase();
  }

  function isAdminLike() { return ['admin', 'super_admin', 'superadmin'].includes(role()); }
  function isParent() { return role() === 'parent'; }

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

  function activeSection() {
    return w.currentSection || w.activeDashboardSection || '';
  }

  function refreshCurrentSection(reason) {
    const section = activeSection();
    if (!section) return;
    debounce(`section:${section}`, async () => {
      if (typeof w.showDashboardSection === 'function') await w.showDashboardSection(section, { realtime: true, reason });
      else if (typeof w.showSection === 'function') await w.showSection(section);
    }, MAX_DELAY);
  }

  function refreshPayments(evt) {
    // Parent payment updates are DOM-diffed inside parent-dashboard.js.
    // DO NOT call financeV31Refresh/v31RenderFinanceFees for parents.
    if (isParent()) {
      debounce('parent-payments', async () => {
        if (typeof w.refreshParentPaymentsSilent === 'function') return w.refreshParentPaymentsSilent({ reason: evt.type });
        if (activeSection() === 'payments') refreshCurrentSection(evt.type);
      }, MAX_DELAY);
      return;
    }

    // Only admin/super admin can touch Finance & Fees. This prevents 403 loops and the
    // admin finance UI appearing inside the parent payment area.
    if (isAdminLike()) {
      debounce('admin-finance', async () => {
        if (typeof w.financeV31SoftRefresh === 'function' && document.querySelector('.finance-v31')) return w.financeV31SoftRefresh();
        if (typeof w.financeV31Refresh === 'function' && document.querySelector('.finance-v31')) return w.financeV31Refresh();
        if (['finance', 'finance-fees'].includes(activeSection()) && typeof w.v31RenderFinanceFees === 'function') return w.v31RenderFinanceFees();
      }, MAX_DELAY);
    }
  }

  function refreshGrades(evt) {
    debounce('grades', async () => {
      await Promise.allSettled([
        callIf('loadStudentGrades'),
        callIf('refreshSavedClassReports'),
        callIf('refreshTeacherGrades'),
        isParent() ? callIf('refreshParentDashboardSilent') : Promise.resolve()
      ]);
      if (['grades','students','my-students','progress'].includes(activeSection())) refreshCurrentSection(evt.type);
    });
  }

  function refreshAttendance(evt) {
    debounce('attendance', async () => {
      await Promise.allSettled([
        callIf('loadStudentAttendance'),
        callIf('loadLiveAttendance'),
        callIf('refreshMyStudents'),
        callIf('refreshStudentsList')
      ]);
      if (activeSection() === 'attendance') refreshCurrentSection(evt.type);
    });
  }

  function refreshHomework(evt) {
    debounce('homework', async () => {
      await Promise.allSettled([
        callIf('v66LoadStudentHomework'),
        callIf('loadStudentHomework'),
        callIf('refreshTeacherHomework'),
        callIf('v12RenderTeacherHomework')
      ]);
      if (activeSection() === 'homework') refreshCurrentSection(evt.type);
    });
  }

  function refreshAlerts(evt) {
    debounce('alerts', async () => {
      await Promise.allSettled([callIf('loadNotifications'), callIf('loadAlerts')]);
      if (activeSection() === 'alerts') refreshCurrentSection(evt.type);
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
      if (['students','teachers','classes','my-students'].includes(activeSection())) refreshCurrentSection(evt.type);
    });
  }

  function refreshAnalytics(evt) {
    debounce('analytics', async () => {
      await Promise.allSettled([callIf('loadAnalytics'), callIf('refreshAnalytics'), callIf('renderAnalyticsDashboard')]);
      if (activeSection() === 'analytics') refreshCurrentSection(evt.type);
    }, MAX_DELAY);
  }

  function routeRealtimeEvent(evt) {
    if (!evt || !evt.type || !belongsToThisSchool(evt)) return;
    const type = String(evt.type).toLowerCase();

    if (type.includes('payment') || type.includes('fee') || type.includes('subscription')) refreshPayments(evt);
    if (type.includes('grade') || type.includes('mark') || type.includes('report')) refreshGrades(evt);
    if (type.includes('attendance')) refreshAttendance(evt);
    if (type.includes('homework')) refreshHomework(evt);
    if (type.includes('alert') || type.includes('approval')) refreshAlerts(evt);
    if (type.includes('student') || type.includes('teacher') || type.includes('parent') || type.includes('class')) refreshPeople(evt);
    if (!isParent() && (type.includes('analytics') || type.includes('payment') || type.includes('fee') || type.includes('grade') || type.includes('attendance') || type.includes('homework'))) refreshAnalytics(evt);

    w.dispatchEvent(new CustomEvent('shule:realtime-update', { detail: evt }));
  }

  function attachSocketListeners() {
    const socket = w.socket;
    if (!socket || socket.__globalRealtimeAttached) return;
    socket.__globalRealtimeAttached = true;

    socket.on('realtime:update', routeRealtimeEvent);
    [
      'payment:updated','payment:approved','payment:rejected','fees:updated','subscription:updated',
      'grades:updated','reports:updated','attendance:updated','homework:updated','alerts:updated',
      'approvals:updated','analytics:updated','student:updated','teacher:updated','class:updated','timetable:updated'
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
  w.addEventListener('shule:subscription-updated', (e) => routeRealtimeEvent({ type: 'subscription:updated', ...(e.detail || {}) }));
  w.addEventListener('shule:grades-updated', (e) => routeRealtimeEvent({ type: 'grades:updated', ...(e.detail || {}) }));
  w.addEventListener('shule:attendance-updated', (e) => routeRealtimeEvent({ type: 'attendance:updated', ...(e.detail || {}) }));
  w.addEventListener('shule:homework-updated', (e) => routeRealtimeEvent({ type: 'homework:updated', ...(e.detail || {}) }));

  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(attachSocketListeners, 800);
    setInterval(attachSocketListeners, 5000);
  });

  w.ShuleRealtimeSync = { routeRealtimeEvent, attachSocketListeners, role, isParent, isAdminLike };
})();
