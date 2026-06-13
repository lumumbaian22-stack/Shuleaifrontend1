// notifications.js - Shule AI final alert center, bell redirect, date grouping, and background refresh
(function () {
  'use strict';

  let notifications = [];
  let unreadCount = 0;
  let notificationsLoadPromise = null;
  let notificationsLoadSequence = 0;
  const expandedDateGroups = new Set();
  const FILTERS = ['all', 'unread', 'financial', 'academic', 'wellness', 'subscription', 'announcement', 'system', 'ai insight'];

  const esc = (value) => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  function activeChildIdForAlerts() {
    const role = getCurrentRoleSafe();
    if (role !== 'parent') return '';
    return String(window.dashboardData?.selectedChildId || localStorage.getItem('shule_selected_child_id') || '').trim();
  }

  function scopedAlertsUrl() {
    const childId = activeChildIdForAlerts();
    return childId ? `/api/alerts?studentId=${encodeURIComponent(childId)}` : '/api/alerts';
  }

  function apiAlerts() {
    return {
      getMine: () => apiRequest(scopedAlertsUrl()),
      markRead: (id) => apiRequest(`/api/alerts/${id}/read`, { method: 'PUT' }),
      markAllRead: () => apiRequest('/api/alerts/read-all', { method: 'PUT' })
    };
  }

  function normalizeRole(role) {
    return String(role || '').toLowerCase().replace('-', '_') || 'user';
  }

  function getCurrentRoleSafe() {
    try {
      const user = typeof getCurrentUser === 'function' ? getCurrentUser() : JSON.parse(localStorage.getItem('user') || '{}');
      return normalizeRole(user?.role || localStorage.getItem('role'));
    } catch (_) { return normalizeRole(localStorage.getItem('role')); }
  }

  function hasAuthToken() {
    return !!(localStorage.getItem('authToken') || localStorage.getItem('token'));
  }

  let notifiedSessionMissing = false;
  let alertsAuthFailures = 0;
  let alertsPausedUntil = 0;

  function normalizeCategory(alert) {
    const raw = String(alert.categoryLabel || alert.category || alert.type || alert.data?.category || '').toLowerCase();
    if (/fee|payment|finance|bursary|credit|cash|bank|mpesa|balance/.test(raw)) return 'Financial';
    if (/academic|grade|mark|report|homework|study/.test(raw)) return 'Academic';
    if (/wellness|mood|emotion|emotional/.test(raw)) return 'Emotional / Wellness';
    if (/physical|safety|attendance|absent|late/.test(raw)) return 'Physical / Safety';
    if (/subscription|renew|expiry|expired/.test(raw)) return 'Subscription';
    if (/announce|message|notice/.test(raw)) return 'Announcement';
    if (/ai|insight|recommend/.test(raw)) return 'Shule AI Insight';
    if (/system|health|error/.test(raw)) return 'System';
    return alert.categoryLabel || alert.type || 'System';
  }

  function normalizeAlert(alert) {
    const createdAt = alert.createdAt || alert.timestamp || alert.date || new Date().toISOString();
    const category = normalizeCategory(alert);
    const sourceType = alert.sourceType || alert.data?.sourceType || (category === 'Shule AI Insight' ? 'ai_insight' : 'system_auto');
    return {
      ...alert,
      id: alert.id || `${createdAt}-${alert.title || 'alert'}`,
      title: alert.title || alert.data?.title || 'Alert',
      message: alert.message || alert.description || alert.data?.message || '',
      createdAt,
      isRead: !!(alert.isRead || alert.read || alert.readAt),
      category,
      sourceLabel: alert.sourceLabel || alert.data?.aiLabel || sourceLabel(sourceType, category),
      actionUrl: alert.actionUrl || alert.data?.actionUrl || '',
      actionLabel: alert.actionLabel || alert.data?.actionLabel || defaultActionLabel(category),
      studentId: Number(alert.studentId || alert.data?.studentId || alert.data?.student_id || 0) || null,
      studentName: alert.studentName || alert.data?.studentName || alert.data?.student || '',
      priority: alert.priority || alert.severity || alert.data?.priority || 'info'
    };
  }


  function alertFingerprint(alert) {
    return String(alert.dedupeKey || alert.data?.dedupeKey || [alert.userId || '', alert.type || '', alert.title || '', alert.message || '', alert.studentId || alert.data?.studentId || '', Math.floor(new Date(alert.createdAt || 0).getTime()/30000)].join('|'));
  }

  function dedupeAlerts(rows) {
    const map = new Map();
    (rows || []).map(normalizeAlert).forEach(alert => {
      const key = alertFingerprint(alert);
      const existing = map.get(key);
      if (!existing || new Date(alert.createdAt) > new Date(existing.createdAt)) map.set(key, alert);
    });
    return [...map.values()].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
  function sourceLabel(sourceType, category) {
    const source = String(sourceType || '').toLowerCase();
    if (source.includes('ai_generated')) return 'AI-generated suggestion';
    if (source.includes('ai') || category === 'Shule AI Insight') return 'Shule AI Insight';
    if (source.includes('admin')) return 'Admin announcement';
    if (source.includes('teacher')) return 'Teacher update';
    if (source.includes('finance')) return 'Finance update';
    if (source.includes('wellness')) return 'Wellness update';
    return 'System reminder';
  }

  function defaultActionLabel(category) {
    const c = String(category || '').toLowerCase();
    if (c.includes('financial')) return 'View Payments';
    if (c.includes('subscription')) return 'Renew Subscription';
    if (c.includes('academic')) return 'View Progress';
    if (c.includes('wellness')) return 'View Wellness';
    if (c.includes('announcement')) return 'View Announcement';
    return '';
  }

  function dateKey(dateValue) {
    const d = new Date(dateValue || Date.now());
    if (Number.isNaN(d.getTime())) return new Date().toISOString().slice(0,10);
    return d.toISOString().slice(0,10);
  }

  function dateLabel(key) {
    const today = new Date();
    const y = new Date(today); y.setDate(today.getDate() - 1);
    const todayKey = today.toISOString().slice(0,10);
    const yKey = y.toISOString().slice(0,10);
    const d = new Date(`${key}T00:00:00`);
    const nice = d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    if (key === todayKey) return `Today - ${nice}`;
    if (key === yKey) return `Yesterday - ${nice}`;
    return nice;
  }

  function timeLabel(value) {
    const d = new Date(value || Date.now());
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function groupAlerts(alerts) {
    const groups = {};
    alerts.forEach(a => {
      const key = dateKey(a.createdAt);
      if (!groups[key]) groups[key] = [];
      groups[key].push(a);
    });
    return Object.entries(groups)
      .sort((a,b) => b[0].localeCompare(a[0]))
      .map(([key, items]) => ({ key, items: items.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)) }));
  }

  async function loadNotifications({ silent = false } = {}) {
    if (notificationsLoadPromise) return notificationsLoadPromise;
    const sequence = ++notificationsLoadSequence;
    notificationsLoadPromise = (async () => {
      if (Date.now() < alertsPausedUntil) return notifications;
      if (!hasAuthToken()) {
        notifications = []; updateUnreadCount();
        if (!silent && !notifiedSessionMissing) { notifiedSessionMissing = true; console.warn('[Alerts] No authenticated session.'); }
        return notifications;
      }
      try {
        const res = await apiAlerts().getMine();
        alertsAuthFailures = 0; alertsPausedUntil = 0;
        if (sequence !== notificationsLoadSequence) return notifications;
        const data = Array.isArray(res?.data) ? res.data : (Array.isArray(res?.alerts) ? res.alerts : []);
        const activeChild = activeChildIdForAlerts();
        notifications = dedupeAlerts(data).filter(alert => !activeChild || !alert.studentId || String(alert.studentId) === String(activeChild));
        updateUnreadCount();
        if (document.getElementById('alerts-center-v82')) renderAlertsCenterIntoDom();
        return notifications;
      } catch (error) {
        if (error?.status === 401 || /not authorized|invalid token|jwt/i.test(error?.message || '')) {
          alertsAuthFailures += 1;
          alertsPausedUntil = Date.now() + Math.min(300000, 30000 * alertsAuthFailures);
          notifications = []; updateUnreadCount(); notifiedSessionMissing = true; return notifications;
        }
        if (!silent) console.error('Failed to load alerts:', error);
        return notifications;
      } finally { notificationsLoadPromise = null; }
    })();
    return notificationsLoadPromise;
  }

  function updateUnreadCount() {
    unreadCount = notifications.filter(n => !n.isRead).length;
    document.querySelectorAll('#notification-badge,[data-alert-badge],.alert-badge').forEach(badge => {
      if (unreadCount > 0) {
        badge.textContent = unreadCount > 99 ? '99+' : String(unreadCount);
        badge.classList.remove('hidden');
      } else {
        badge.textContent = '';
        badge.classList.add('hidden');
      }
    });
  }

  async function markAsRead(alertId) {
    const alert = notifications.find(n => String(n.id) === String(alertId));
    if (alert) alert.isRead = true;
    updateUnreadCount();
    const row = document.querySelector(`[data-alert-id="${CSS.escape(String(alertId))}"]`);
    if (row) row.classList.add('is-read');
    try { await apiAlerts().markRead(alertId); } catch (e) { console.warn('Mark alert read failed:', e.message); }
  }

  async function markAllAsRead() {
    notifications.forEach(n => { n.isRead = true; });
    updateUnreadCount();
    document.querySelectorAll('.alert-v82-card').forEach(el => el.classList.add('is-read'));
    try { await apiAlerts().markAllRead(); } catch (e) { console.warn('Mark all alerts read failed:', e.message); }
    if (typeof showToast === 'function') showToast('All alerts marked as read', 'success');
  }

  function currentFilter() {
    return (document.getElementById('alerts-filter-v82')?.value || 'all').toLowerCase();
  }

  function filteredAlerts() {
    const filter = currentFilter();
    if (filter === 'all') return notifications;
    if (filter === 'unread') return notifications.filter(a => !a.isRead);
    return notifications.filter(a => String(a.category || '').toLowerCase().includes(filter));
  }

  function renderAlertCard(alert) {
    const unread = !alert.isRead;
    const priority = String(alert.priority || 'info').toLowerCase();
    return `
      <article class="alert-v82-card ${unread ? 'is-unread' : 'is-read'} priority-${esc(priority)}" data-alert-id="${esc(alert.id)}">
        <div class="alert-v82-card-head">
          <div class="min-w-0">
            <div class="alert-v82-badges">
              <span class="alert-v82-category">${esc(alert.category)}</span>
              <span class="alert-v82-source">${esc(alert.sourceLabel)}</span>
              ${unread ? '<span class="alert-v82-unread">Unread</span>' : ''}
            </div>
            <h3>${esc(alert.title)}</h3>
          </div>
          <time>${esc(timeLabel(alert.createdAt))}</time>
        </div>
        <p class="alert-v82-message">${esc(alert.message)}</p>
        ${alert.studentName ? `<p class="alert-v82-student">Student: ${esc(alert.studentName)}</p>` : ''}
        <div class="alert-v82-actions">
          ${alert.actionUrl && alert.actionLabel ? `<button type="button" onclick="openAlertAction('${esc(alert.actionUrl)}')">${esc(alert.actionLabel)}</button>` : ''}
          ${unread ? `<button type="button" onclick="markAsRead('${esc(alert.id)}')">Mark as read</button>` : ''}
        </div>
      </article>`;
  }

  function renderGroup(group, index) {
    const isOpen = expandedDateGroups.has(group.key) || index === 0;
    if (isOpen) expandedDateGroups.add(group.key);
    const unread = group.items.filter(a => !a.isRead).length;
    return `
      <section class="alert-v82-date-group" data-alert-date="${esc(group.key)}">
        <button type="button" class="alert-v82-date-toggle" onclick="toggleAlertDateGroup('${esc(group.key)}')">
          <span>${isOpen ? '▼' : '▶'} ${esc(dateLabel(group.key))}</span>
          <small>${group.items.length} alert${group.items.length === 1 ? '' : 's'}${unread ? ` • ${unread} unread` : ''}</small>
        </button>
        <div class="alert-v82-group-list ${isOpen ? '' : 'hidden'}">
          ${group.items.map(renderAlertCard).join('')}
        </div>
      </section>`;
  }

  function renderAlertsHtml(role = getCurrentRoleSafe(), errorMessage = '') {
    const list = filteredAlerts();
    const groups = groupAlerts(list);
    const roleLabel = role.replace('_', ' ');
    return `
      <section id="alerts-center-v82" class="alerts-v82-shell animate-fade-in" data-role="${esc(role)}">
        <div class="alerts-v82-hero">
          <div>
            <p class="alerts-v82-kicker">Shule AI Alert Center</p>
            <h2>Alerts for ${esc(roleLabel.charAt(0).toUpperCase() + roleLabel.slice(1))}</h2>
            <p>Financial, academic, physical/safety, emotional/wellness, subscription, announcement, and Shule AI insight alerts grouped by date.</p>
          </div>
          <div class="alerts-v82-actions">
            <select id="alerts-filter-v82" onchange="renderAlertsCenterIntoDom()">
              ${FILTERS.map(f => `<option value="${esc(f)}" ${currentFilter() === f ? 'selected' : ''}>${esc(f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1))}</option>`).join('')}
            </select>
            <button type="button" onclick="markAllAsRead()">Mark all as read</button>
            <button type="button" onclick="loadNotifications()">Refresh</button>
          </div>
        </div>
        ${errorMessage ? `<div class="alerts-v82-error">${esc(errorMessage)}</div>` : ''}
        ${groups.length ? `<div class="alerts-v82-groups">${groups.map(renderGroup).join('')}</div>` : '<div class="alerts-v82-empty">No alerts found for this filter yet.</div>'}
      </section>`;
  }

  async function renderAlertsCenter(role = getCurrentRoleSafe()) {
    let errorMessage = '';
    try { await loadNotifications({ silent: true }); } catch (e) { errorMessage = e.message || 'Failed to load alerts'; }
    return renderAlertsHtml(role, errorMessage);
  }

  function renderAlertsCenterIntoDom() {
    const shell = document.getElementById('alerts-center-v82');
    if (!shell) return;
    const role = shell.dataset.role || getCurrentRoleSafe();
    shell.outerHTML = renderAlertsHtml(role);
    if (window.lucide) lucide.createIcons();
  }

  function toggleAlertDateGroup(key) {
    if (expandedDateGroups.has(key)) expandedDateGroups.delete(key); else expandedDateGroups.add(key);
    renderAlertsCenterIntoDom();
  }

  function openAlertAction(actionUrl) {
    const target = String(actionUrl || '').trim();
    if (!target) return;
    if (target.startsWith('#')) {
      const section = target.replace('#', '');
      if (typeof showDashboardSection === 'function') showDashboardSection(section);
      return;
    }
    if (/^https?:\/\//i.test(target)) window.open(target, '_blank', 'noopener,noreferrer');
    else if (typeof showDashboardSection === 'function') showDashboardSection(target);
  }

  function openAlertsFromBell() {
    const panel = document.getElementById('notifications-panel');
    if (panel) panel.classList.add('hidden');
    if (typeof showDashboardSection === 'function') return showDashboardSection('alerts');
    if (typeof navigateToSection === 'function') return navigateToSection('alerts');
    window.location.hash = '#alerts';
  }

  function toggleNotifications() { return openAlertsFromBell(); }
  function viewAllNotifications() { return openAlertsFromBell(); }

  function renderNotificationsPanel() { updateUnreadCount(); }
  function createNotificationsPanel() {}
  async function deleteNotification() {}
  async function clearAllNotifications() {}

  function initNotificationWebSocket() {
    // v143: the single authenticated realtime client owns socket listeners.
    // Alerts are refreshed through realtime-handlers.js to prevent duplicate rows/toasts.
  }

  window.addEventListener('shule:realtime-event', (event) => {
    const type = String(event.detail?.type || '');
    if (type === 'alert:created' || type === 'alert:updated' || type === 'alert:deleted' || type === 'alerts:read_all') loadNotifications({ silent:true });
  });

  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => { if (hasAuthToken()) loadNotifications({ silent: true }); }, 1200);
    setTimeout(initNotificationWebSocket, 1500);
    setInterval(() => {
      if (!hasAuthToken() || Date.now() < alertsPausedUntil) return;
      loadNotifications({ silent: true }).then(() => {
        if (document.getElementById('alerts-center-v82')) renderAlertsCenterIntoDom();
      });
    }, 60000);
  });


  function resetAlertsForChildSwitch(childId) {
    notifications = [];
    updateUnreadCount();
    if (document.getElementById('alerts-center-v82')) renderAlertsCenterIntoDom();
    return loadNotifications({ silent: true }).then(() => {
      if (document.getElementById('alerts-center-v82')) renderAlertsCenterIntoDom();
      return notifications;
    });
  }


  async function renderRecentAlertsPreview() {
    const host = document.getElementById('dashboard-recent-alerts-v146');
    if (!host) return;
    host.innerHTML = '<div class="text-sm text-muted-foreground">Loading alerts…</div>';
    await loadNotifications({ silent: true });
    const rows = notifications.slice(0, 5);
    host.innerHTML = rows.length ? rows.map(alert => `
      <button type="button" class="w-full rounded-xl border bg-card p-3 text-left transition hover:border-primary/40 hover:bg-accent/40 ${alert.isRead ? '' : 'ring-1 ring-primary/10'}" onclick="showDashboardSection('alerts')">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0"><p class="truncate text-sm font-semibold">${esc(alert.title)}</p><p class="mt-1 line-clamp-2 text-xs text-muted-foreground">${esc(alert.sourceLabel)} • ${esc(alert.message)}</p></div>
          <time class="shrink-0 text-[11px] text-muted-foreground">${esc(timeLabel(alert.createdAt))}</time>
        </div>
      </button>`).join('') : '<div class="rounded-xl border border-dashed bg-muted/20 p-5 text-center text-sm text-muted-foreground">No recent alerts.</div>';
  }

  window.addEventListener('shule:child-switched', () => setTimeout(renderRecentAlertsPreview, 80));
  window.addEventListener('shule:realtime-event', (event) => {
    const type = String(event.detail?.type || '');
    if (type.startsWith('alert:') || type === 'class:released') setTimeout(renderRecentAlertsPreview, 40);
  });

  window.loadNotifications = loadNotifications;
  window.loadAlerts = loadNotifications;
  window.v94LoadAlerts = loadNotifications;
  window.updateUnreadCount = updateUnreadCount;
  window.markAsRead = markAsRead;
  window.markAllAsRead = markAllAsRead;
  window.deleteNotification = deleteNotification;
  window.clearAllNotifications = clearAllNotifications;
  window.toggleNotifications = toggleNotifications;
  window.openAlertsFromBell = openAlertsFromBell;
  window.viewAllNotifications = viewAllNotifications;
  window.renderNotificationsPanel = renderNotificationsPanel;
  window.renderAlertsCenter = renderAlertsCenter;
  window.v12RenderAlertsCenter = renderAlertsCenter;
  window.renderAlertsCenterIntoDom = renderAlertsCenterIntoDom;
  window.toggleAlertDateGroup = toggleAlertDateGroup;
  window.openAlertAction = openAlertAction;
  window.resetAlertsForChildSwitch = resetAlertsForChildSwitch;
  window.renderRecentAlertsPreview = renderRecentAlertsPreview;
  window.ShuleAlerts = { load: loadNotifications, open: openAlertsFromBell, render: renderAlertsCenter, resetForChild: resetAlertsForChildSwitch };
})();
