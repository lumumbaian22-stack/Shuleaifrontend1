// Shule AI v36 - Compatibility fallbacks after clean index consolidation
// Keeps old dashboard calls working without re-loading old patch files.
(function () {
  const w = window;
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function card(title, body, icon = 'bell') {
    return `
      <div class="space-y-6 animate-fade-in">
        <div class="rounded-2xl border bg-card text-card-foreground p-6 shadow-sm">
          <div class="flex items-center gap-3 mb-3">
            <div class="h-11 w-11 rounded-xl bg-blue-600/10 flex items-center justify-center">
              <i data-lucide="${esc(icon)}" class="h-5 w-5 text-blue-600"></i>
            </div>
            <div>
              <h2 class="text-2xl font-bold">${esc(title)}</h2>
              <p class="text-sm text-muted-foreground">${esc(body)}</p>
            </div>
          </div>
          <div id="v36-fallback-content" class="mt-4"></div>
        </div>
      </div>`;
  }

  async function safeApi(path) {
    try {
      if (typeof apiRequest !== 'function') throw new Error('API client not loaded');
      return await apiRequest(path);
    } catch (error) {
      return { success: false, error: error.message, data: [] };
    }
  }

  async function renderAlertsCenter(role = 'user') {
    const result = await safeApi('/api/alerts');
    const alerts = Array.isArray(result.data) ? result.data : (result.alerts || result.data?.alerts || []);
    if (!result.success && !alerts.length) {
      return card('Alerts Center', `No alerts could be loaded right now: ${result.error || 'Unknown error'}`, 'bell');
    }
    return `
      <div class="space-y-6 animate-fade-in">
        <div class="rounded-2xl border bg-card text-card-foreground p-6 shadow-sm">
          <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
            <div>
              <p class="text-sm uppercase tracking-wide text-muted-foreground font-semibold">${esc(role)} alerts</p>
              <h2 class="text-2xl font-bold">Alerts Center</h2>
              <p class="text-sm text-muted-foreground">Important school alerts and notifications.</p>
            </div>
            <button class="px-4 py-2 rounded-xl border hover:bg-muted" onclick="showDashboardSection && showDashboardSection('alerts')">Refresh</button>
          </div>
          ${alerts.length ? `
            <div class="grid gap-3">
              ${alerts.map(a => `
                <div class="rounded-xl border bg-background p-4">
                  <div class="font-semibold">${esc(a.title || a.type || 'Alert')}</div>
                  <div class="text-sm text-muted-foreground mt-1">${esc(a.message || a.body || a.description || 'No message')}</div>
                  <div class="text-xs text-muted-foreground mt-2">${esc(a.createdAt ? new Date(a.createdAt).toLocaleString() : '')}</div>
                </div>`).join('')}
            </div>` : `<div class="rounded-xl border border-dashed p-6 text-center text-muted-foreground">No alerts available.</div>`}
        </div>
      </div>`;
  }

  async function renderGenericTimetable() {
    if (typeof w.renderAdminTimetable === 'function') return await w.renderAdminTimetable();
    return card('Timetable', 'Timetable module is loading. Refresh if this does not update.', 'calendar-days');
  }

  async function renderAcademicCalendar() {
    if (typeof w.renderAdminCalendar === 'function') return w.renderAdminCalendar();
    if (typeof w.renderCalendarSection === 'function') return await w.renderCalendarSection();
    return card('Academic Calendar', 'Calendar module is available, but the renderer was not found.', 'calendar');
  }



  async function renderPlatformPayments() {
    if (typeof w.renderPlatformPayments === 'function') return await w.renderPlatformPayments();
    const result = await safeApi('/api/super-admin/payments');
    const rows = Array.isArray(result.data) ? result.data : (result.payments || result.data?.payments || []);
    return `
      <div class="space-y-6 animate-fade-in">
        <div class="rounded-2xl border bg-card text-card-foreground p-6 shadow-sm">
          <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
            <div>
              <p class="text-sm uppercase tracking-wide text-muted-foreground font-semibold">Platform finance</p>
              <h2 class="text-2xl font-bold">Platform Payments</h2>
              <p class="text-sm text-muted-foreground">Subscription and platform payment records.</p>
            </div>
          </div>
          ${rows.length ? `<div class="overflow-x-auto"><table class="w-full text-sm"><thead><tr class="text-left border-b"><th class="py-2">School/User</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead><tbody>${rows.map(r => `<tr class="border-b"><td class="py-2">${esc(r.schoolName || r.userName || r.schoolCode || 'Record')}</td><td>KES ${esc(r.amount || 0)}</td><td>${esc(r.status || 'pending')}</td><td>${esc(r.createdAt ? new Date(r.createdAt).toLocaleString() : '')}</td></tr>`).join('')}</tbody></table></div>` : `<div class="rounded-xl border border-dashed p-6 text-center text-muted-foreground">No platform payments available.</div>`}
        </div>
      </div>`;
  }

  async function renderSafeAnalytics(role = 'user') {
    if (typeof w.renderAnalyticsSection === 'function') {
      try { return await w.renderAnalyticsSection(role); }
      catch (error) { return card('Analytics', `Analytics could not load right now: ${error.message}`, 'bar-chart-3'); }
    }
    return card('Analytics', 'Analytics module is not loaded on this screen.', 'bar-chart-3');
  }

  async function renderGenericPayments() {
    if (typeof w.renderParentPayments === 'function') return await w.renderParentPayments();
    if (typeof w.v31RenderFinanceFees === 'function') {
      try { await w.v31RenderFinanceFees(); return document.getElementById('dashboard-content')?.innerHTML || card('Payments', 'Payments loaded.', 'credit-card'); } catch (_) {}
    }
    return card('Payments', 'Payment records are available inside Finance & Fees.', 'credit-card');
  }

  // Aliases expected by old dashboard section switchers after cleanup.
  w.v12RenderAlertsCenter = w.v12RenderAlertsCenter || renderAlertsCenter;
  w.v12RenderAdminTimetable = w.v12RenderAdminTimetable || (async () => {
    if (typeof w.renderAdminTimetable === 'function') return await w.renderAdminTimetable();
    return renderGenericTimetable();
  });
  w.v12RenderTeacherTimetable = w.v12RenderTeacherTimetable || (async () => {
    if (typeof w.renderTeacherTimetable === 'function') return await w.renderTeacherTimetable();
    return renderGenericTimetable();
  });
  w.v12RenderParentTimetable = w.v12RenderParentTimetable || renderGenericTimetable;
  w.v12RenderStudentTimetable = w.v12RenderStudentTimetable || renderGenericTimetable;
  w.v12RenderAcademicCalendar = w.v12RenderAcademicCalendar || renderAcademicCalendar;

  // Defensive fallbacks for modules still referenced by old dashboard files.
  w.v12RenderTeacherHomework = w.v12RenderTeacherHomework || (async () => {
    if (typeof w.renderTeacherHomework === 'function') return await w.renderTeacherHomework();
    return card('Homework', 'Homework module is not loaded on this screen.', 'book-open');
  });
  w.v12RenderStudentHomework = w.v12RenderStudentHomework || (async () => {
    if (typeof w.renderStudentHomework === 'function') return await w.renderStudentHomework();
    return card('Homework', 'Homework module is not loaded on this screen.', 'book-open');
  });
  w.v12RenderTeacherDuty = w.v12RenderTeacherDuty || (async () => {
    if (typeof w.renderTeacherDuty === 'function') return await w.renderTeacherDuty();
    return card('Duty Roster', 'Duty module is not loaded on this screen.', 'clipboard-list');
  });
  w.v12RenderParentPayments = w.v12RenderParentPayments || renderGenericPayments;
  w.v12RenderPlatformPayments = w.v12RenderPlatformPayments || renderPlatformPayments;
  w.v12RenderAdminAnalytics = w.v12RenderAdminAnalytics || (() => renderSafeAnalytics('admin'));
  w.v12RenderTeacherAnalytics = w.v12RenderTeacherAnalytics || (() => renderSafeAnalytics('teacher'));
  w.v12RenderParentAnalytics = w.v12RenderParentAnalytics || (() => renderSafeAnalytics('parent'));
  w.v12RenderStudentAnalytics = w.v12RenderStudentAnalytics || (() => renderSafeAnalytics('student'));
  w.v12RenderSuperAdminAnalytics = w.v12RenderSuperAdminAnalytics || (() => renderSafeAnalytics('superadmin'));

  // Extra aliases for section names still used by some role dashboards.
  w.v12RenderAdminCalendar = w.v12RenderAdminCalendar || renderAcademicCalendar;
  w.v12RenderParentCalendar = w.v12RenderParentCalendar || renderAcademicCalendar;
  w.v12RenderStudentCalendar = w.v12RenderStudentCalendar || renderAcademicCalendar;

  // Last-resort global error guard for missing legacy renderer calls.
  w.__shuleEnsureRenderer = w.__shuleEnsureRenderer || function(name, renderer) {
    if (typeof w[name] !== 'function') w[name] = renderer || (async () => card(name, 'This section is still being loaded. Please refresh if it remains blank.', 'layout-dashboard'));
  };
})();
