// Runtime integrity guards for ShuleAI frontend.
// This file prevents legacy dashboard sections from crashing when an optional helper
// is not loaded yet. Each guard delegates to the canonical implementation when it exists.

var BarcodeDetector = window.BarcodeDetector;
var currentStudentId = window.currentStudentId || null;

var moment = window.moment || function shuleMomentFallback(input) {
  const date = input ? new Date(input) : new Date();
  const api = {
    _date: Number.isNaN(date.getTime()) ? new Date() : date,
    startOf(unit) {
      const d = new Date(this._date);
      if (unit === 'isoWeek' || unit === 'week') {
        const day = d.getDay() || 7;
        d.setDate(d.getDate() - day + 1);
        d.setHours(0, 0, 0, 0);
      }
      this._date = d;
      return this;
    },
    format(pattern) {
      const d = this._date;
      if (pattern === 'YYYY-MM-DD') return d.toISOString().slice(0, 10);
      if (pattern === 'MMM D') return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      if (pattern === 'dddd') return d.toLocaleDateString(undefined, { weekday: 'long' });
      return d.toLocaleDateString();
    },
    isSame(other, unit) {
      const a = this.format('YYYY-MM-DD');
      const b = (window.moment || moment)(other).format('YYYY-MM-DD');
      return unit === 'day' ? a === b : this._date.getTime() === (other instanceof Date ? other.getTime() : new Date(other).getTime());
    },
    add(amount, unit) {
      const d = new Date(this._date);
      if (unit === 'day' || unit === 'days') d.setDate(d.getDate() + Number(amount || 0));
      this._date = d;
      return this;
    }
  };
  return api;
};
window.moment = window.moment || moment;

function attendanceJsArg(value) {
  return JSON.stringify(String(value ?? ''));
}
window.attendanceJsArg = window.attendanceJsArg || attendanceJsArg;

function runtimeApiBaseUrl() {
  try { if (typeof API_BASE_URL !== 'undefined' && API_BASE_URL) return String(API_BASE_URL).replace(/\/$/, ''); } catch (_) {}
  const saved = localStorage.getItem('SHULE_API_BASE_URL');
  return String(window.SHULE_API_BASE_URL || saved || 'https://api.shuleai.live').replace(/\/$/, '');
}

function runtimeAuthHeaders(extra) {
  let token = '';
  try { token = typeof getStoredAuthToken === 'function' ? getStoredAuthToken() : (localStorage.getItem('authToken') || localStorage.getItem('token') || ''); } catch (_) {}
  return { ...(extra || {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

async function fetchPublishedReportPdf(studentId) {
  if (!studentId) throw new Error('Student ID is required to load the report card.');
  const endpoint = `/api/report-cards/latest/${encodeURIComponent(studentId)}/pdf`;
  const response = await fetch(`${runtimeApiBaseUrl()}${endpoint}`, { headers: runtimeAuthHeaders() });
  if (!response.ok) {
    let message = `Report PDF request failed (${response.status})`;
    try {
      const text = await response.text();
      try { message = JSON.parse(text)?.message || JSON.parse(text)?.error || message; }
      catch (_) { if (text && !text.includes('<html')) message = text.slice(0, 180); }
    } catch (_) {}
    throw new Error(message);
  }
  const blob = await response.blob();
  const disposition = response.headers.get('content-disposition') || '';
  const match = disposition.match(/filename="?([^";]+)"?/i);
  return { blob, filename: match?.[1] || `report-card-${studentId}.pdf` };
}
window.fetchPublishedReportPdf = window.fetchPublishedReportPdf || fetchPublishedReportPdf;

async function loadWeeklyDuty() {
  if (typeof apiRequest === 'function') {
    const res = await apiRequest('/api/duty/week');
    return res?.data || res || [];
  }
  return [];
}
window.loadWeeklyDuty = window.loadWeeklyDuty || loadWeeklyDuty;

async function loadUnderstaffedAreas() {
  if (typeof apiRequest === 'function') {
    const res = await apiRequest('/api/duty/understaffed');
    return res?.data || res || [];
  }
  return [];
}
window.loadUnderstaffedAreas = window.loadUnderstaffedAreas || loadUnderstaffedAreas;

async function loadTeacherWorkload() {
  if (typeof apiRequest === 'function') {
    const res = await apiRequest('/api/duty/teacher-workload');
    return res?.data || res || [];
  }
  return [];
}
window.loadTeacherWorkload = window.loadTeacherWorkload || loadTeacherWorkload;

async function refreshStudentsList() {
  if (typeof window.renderAdminStudents === 'function') return window.renderAdminStudents();
  if (typeof window.adminLoadAllStudents === 'function') return window.adminLoadAllStudents();
  if (typeof window.refreshMyStudents === 'function') return window.refreshMyStudents();
  if (typeof window.loadMyStudents === 'function') return window.loadMyStudents();
  if (typeof window.loadAllStudents === 'function') return window.loadAllStudents();
  return [];
}
window.refreshStudentsList = window.refreshStudentsList || refreshStudentsList;

async function refreshStudentList() {
  return refreshStudentsList();
}
window.refreshStudentList = window.refreshStudentList || refreshStudentList;

async function loadStudentDetails(studentId) {
  if (typeof window.showUnifiedStudentModal === 'function') return window.showUnifiedStudentModal(studentId);
  if (typeof window.viewStudentDetails === 'function') return window.viewStudentDetails(studentId);
  if (window.api?.students?.getFullDetails) return window.api.students.getFullDetails(studentId);
  return null;
}
window.loadStudentDetails = window.loadStudentDetails || loadStudentDetails;

function emitCurriculumUpdate(curriculum) {
  try {
    if (window.realtimeClient?.emit) window.realtimeClient.emit('curriculum-updated', { curriculum });
    window.dispatchEvent(new CustomEvent('shule:curriculum-updated', { detail: { curriculum } }));
  } catch (_) {}
}
window.emitCurriculumUpdate = window.emitCurriculumUpdate || emitCurriculumUpdate;

async function refreshParentDashboard() {
  if (typeof window.renderParentDashboard === 'function') return window.renderParentDashboard();
  if (typeof window.loadParentDashboard === 'function') return window.loadParentDashboard();
  return null;
}
window.refreshParentDashboard = window.refreshParentDashboard || refreshParentDashboard;

async function renderHelpSupport() {
  if (typeof window.renderHelpSection === 'function') return window.renderHelpSection();
  return '<div class="rounded-xl border bg-card p-6"><h3 class="font-semibold">Help & Support</h3><p class="text-muted-foreground mt-2">Support tools are loading. Please try again in a moment.</p></div>';
}
window.renderHelpSupport = window.renderHelpSupport || renderHelpSupport;

function sendChatMessage() {
  if (typeof window.v9SendMessage === 'function') return window.v9SendMessage();
  const input = document.getElementById('chat-message-input') || document.getElementById('message-input') || document.getElementById('v9-message-input');
  if (input && input.value && typeof window.showToast === 'function') showToast('Open the Messages panel to send this message.', 'info');
}
window.sendChatMessage = window.sendChatMessage || sendChatMessage;

function navigateToSection(section) {
  if (typeof window.showDashboardSection === 'function') return window.showDashboardSection(section);
  if (typeof window.renderDashboardSection === 'function') return window.renderDashboardSection(section);
  const target = document.querySelector(`[data-section="${CSS.escape(String(section || ''))}"]`);
  if (target) target.click();
}
window.navigateToSection = window.navigateToSection || navigateToSection;

function safeSetUserStorage(user) {
  if (!user) return;
  try {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('currentUser', JSON.stringify(user));
    if (user.role) localStorage.setItem('userRole', user.role);
  } catch (_) {}
}
window.safeSetUserStorage = window.safeSetUserStorage || safeSetUserStorage;

function closeTaskModal() {
  const modal = document.getElementById('task-modal') || document.querySelector('.task-modal, [data-task-modal]');
  if (modal) modal.classList.add('hidden');
}
window.closeTaskModal = window.closeTaskModal || closeTaskModal;

async function refreshTeacherHomeworkListNow() {
  if (typeof window.loadTeacherHomework === 'function') return window.loadTeacherHomework();
  if (typeof window.renderTeacherHomework === 'function') return window.renderTeacherHomework();
  if (typeof window.renderTeacherTasks === 'function') return window.renderTeacherTasks();
  return [];
}
window.refreshTeacherHomeworkListNow = window.refreshTeacherHomeworkListNow || refreshTeacherHomeworkListNow;

async function v93LoadAdminDuty() {
  if (typeof window.v145LoadAdminDuty === 'function') return window.v145LoadAdminDuty();
  if (typeof loadWeeklyDuty === 'function') return loadWeeklyDuty();
  return [];
}
window.v93LoadAdminDuty = window.v93LoadAdminDuty || v93LoadAdminDuty;

async function v93LoadTeacherDuty() {
  if (typeof window.v145LoadTeacherDuty === 'function') return window.v145LoadTeacherDuty();
  if (typeof loadWeeklyDuty === 'function') return loadWeeklyDuty();
  return [];
}
window.v93LoadTeacherDuty = window.v93LoadTeacherDuty || v93LoadTeacherDuty;

function financeV31AddFeeItem(item) {
  if (window.financeV31AddFeeItem && window.financeV31AddFeeItem !== financeV31AddFeeItem) return window.financeV31AddFeeItem(item);
  const box = document.getElementById('ff-items');
  if (box) box.insertAdjacentHTML('beforeend', '<div class="finance-v31-fee-item"><input class="finance-v31-input ff-item-name" placeholder="Item name"><input class="finance-v31-input ff-item-amount" type="number" placeholder="Amount" oninput="financeV31RecalcTotal()"><button class="finance-v31-btn danger" onclick="this.closest(\'.finance-v31-fee-item\').remove();financeV31RecalcTotal()">Remove</button></div>');
}
window.financeV31AddFeeItem = window.financeV31AddFeeItem || financeV31AddFeeItem;

function financeV31RecalcTotal() {
  if (window.financeV31RecalcTotal && window.financeV31RecalcTotal !== financeV31RecalcTotal) return window.financeV31RecalcTotal();
  let total = 0;
  document.querySelectorAll('.finance-v31-fee-item .ff-item-amount').forEach(input => { total += Number(input.value || 0); });
  const el = document.getElementById('ff-total');
  if (el) el.textContent = `KES ${total.toLocaleString()}`;
}
window.financeV31RecalcTotal = window.financeV31RecalcTotal || financeV31RecalcTotal;
