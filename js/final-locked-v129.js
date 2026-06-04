/* ========================================================================
   Shule AI v129 FINAL LOCKED FIX LAYER
   Clean final guard for plan visibility, school-specific cache, stable branding,
   selected-child isolation, duty/SMS gating, announcement delivery channels,
   report settings entry point, and runtime-critical fixes.
   ======================================================================== */
(function () {
  'use strict';

  const DEFAULT_LOGO = 'assets/logo.png';
  const PLAN_FEATURES = {
    starter: ['dashboard','teachers','teacher_approvals','students','analytics','alerts','finance_fees','parent_messages','school_settings','billing','classes','report_cards'],
    growth: ['dashboard','teachers','teacher_approvals','students','analytics','alerts','finance_fees','parent_messages','school_settings','billing','classes','report_cards','calendar','school_branding','timetable','homework'],
    enterprise: ['dashboard','teachers','teacher_approvals','students','analytics','alerts','finance_fees','parent_messages','school_settings','billing','classes','report_cards','calendar','school_branding','timetable','homework','duty','fairness_report','departments','bulk_sms','senior_subject_choice']
  };
  const GATED_ENDPOINTS = [
    { rx: /^\/api\/duty\b|^\/api\/admin\/duty\b/, feature: 'duty' },
    { rx: /^\/api\/sms\b/, feature: 'bulk_sms' },
    { rx: /^\/api\/calendar\b/, feature: 'calendar' },
    { rx: /^\/api\/timetable\b/, feature: 'timetable' },
    { rx: /^\/api\/homework\b/, feature: 'homework' },
    { rx: /^\/api\/departments\b/, feature: 'departments' },
    { rx: /^\/api\/fairness\b/, feature: 'fairness_report' }
  ];
  const SECTION_FEATURE = {
    dashboard: 'dashboard', teachers: 'teachers', students: 'students', classes: 'classes', analytics: 'analytics', alerts: 'alerts',
    'teacher-approvals': 'teacher_approvals', 'finance-fees': 'finance_fees', finances: 'finance_fees', fees: 'finance_fees',
    'parent-messages': 'parent_messages', settings: 'school_settings', 'school-settings': 'school_settings', 'subscription-billing': 'billing', billing: 'billing',
    reports: 'report_cards', 'report-cards': 'report_cards', 'report-settings': 'report_cards', exams: 'report_cards', calendar: 'calendar', timetable: 'timetable', 'my-timetable': 'timetable', schedule: 'timetable',
    homework: 'homework', 'my-homework': 'homework', duty: 'duty', 'duty-preferences': 'duty', 'fairness-report': 'fairness_report', 'teacher-workload': 'fairness_report',
    departments: 'departments', sms: 'bulk_sms', 'bulk-sms': 'bulk_sms', 'school-branding': 'school_branding', branding: 'school_branding',
    'student-subject-selection': 'senior_subject_choice', 'subject-choice': 'senior_subject_choice', 'subject-selection': 'senior_subject_choice', pathway: 'senior_subject_choice'
  };

  const $ = (id) => document.getElementById(id);
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const toast = (msg, type = 'info') => (typeof window.showToast === 'function' ? window.showToast(msg, type) : console.log(`[${type}] ${msg}`));

  function readJson(key, fallback) {
    try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch (_) { return fallback; }
  }
  function writeJson(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {}
  }
  function currentUser() {
    const u = (typeof window.getCurrentUser === 'function' ? window.getCurrentUser() : null) || readJson('user', {}) || readJson('shule_user', {}) || {};
    return u && typeof u === 'object' ? u : {};
  }
  function currentRole() {
    return String(currentUser().role || localStorage.getItem('userRole') || '').toLowerCase().replace('-', '_');
  }
  function currentSchool() {
    const s = (typeof window.getCurrentSchool === 'function' ? window.getCurrentSchool() : null) || readJson('school', {}) || currentUser().school || {};
    return s && typeof s === 'object' ? s : {};
  }
  function schoolCode() {
    const u = currentUser(); const s = currentSchool();
    return String(u.schoolCode || s.schoolCode || s.schoolId || s.code || '').trim();
  }
  function planCode(raw) {
    const v = String(raw || '').toLowerCase().replace(/^school_/, '');
    if (v.includes('enterprise')) return 'enterprise';
    if (v.includes('growth')) return 'growth';
    if (v.includes('starter')) return 'starter';
    if (v.includes('pilot') || v.includes('demo') || v.includes('free_full') || v.includes('full')) return 'enterprise';
    return 'starter';
  }
  function fullAccessFrom(obj) {
    if (!obj || typeof obj !== 'object') return false;
    const access = [obj.accessMode, obj.accessStatus, obj.subscriptionStatus, obj.plan, obj.subscriptionPlan, obj.currentPlan, obj.status].filter(Boolean).join(' ').toLowerCase();
    return obj.pilotFullAccessEnabled === true || obj.demoMode === true || obj.freeFullAccess === true || obj.fullAccess === true || obj.manualFullAccess === true || /pilot[_\s-]*full|full[_\s-]*access|demo[_\s-]*full|free[_\s-]*full|manual[_\s-]*full/.test(access);
  }
  function isSuspended() {
    const s = currentSchool();
    return String(s.status || '').toLowerCase() === 'suspended' || s.isSuspended === true || s.accessSuspended === true;
  }
  function refreshPlanState(source) {
    const saved = readJson('shule_plan_state', {}) || {};
    const school = currentSchool(); const user = currentUser();
    const merged = { ...saved, ...(source || {}) };
    const full = currentRole().startsWith('super') || fullAccessFrom(merged) || fullAccessFrom(school) || fullAccessFrom(school.settings) || fullAccessFrom(school.settings?.billing) || fullAccessFrom(user);
    const code = planCode(merged.planCode || merged.currentPlan || merged.schoolTier || merged.plan || school.subscriptionPlan || school.plan || school.tier || 'starter');
    const features = full ? ['*', ...PLAN_FEATURES.enterprise, 'ai_tutor', 'ai_tutor_limited', 'ai_tutor_extended', 'live_child_analytics', 'advanced_alerts', 'child_recommendations'] : (Array.isArray(merged.features) && merged.features.length ? merged.features : PLAN_FEATURES[code]);
    window.ShulePlanState = { ...merged, planCode: code, features, fullAccess: full, override: full, suspended: isSuspended() };
    writeJson('shule_plan_state', window.ShulePlanState);
    return window.ShulePlanState;
  }
  function hasFeature(feature) {
    if (!feature) return true;
    const role = currentRole();
    if (role === 'super_admin' || role === 'superadmin') return true;
    const state = refreshPlanState();
    if (state.suspended) return ['billing','school_settings','dashboard'].includes(feature);
    if (state.fullAccess || state.override || (Array.isArray(state.features) && state.features.includes('*'))) return true;
    return new Set(Array.isArray(state.features) ? state.features : PLAN_FEATURES[planCode(state.planCode)]).has(String(feature));
  }
  function selectedChild() {
    return window.dashboardData?.selectedChild || readJson('shule_selected_child', null) || null;
  }
  function childClassText(child = selectedChild()) {
    return [child?.grade, child?.className, child?.Class?.name, child?.level, child?.student?.grade].filter(Boolean).join(' ');
  }
  function isSeniorGrade(text) {
    return /(^|\D)(grade\s*)?(10|11|12)(\D|$)|\bg10\b|\bg11\b|\bg12\b|senior/i.test(String(text || ''));
  }
  function schoolHasSenior() {
    const s = currentSchool(); const settings = s.settings || {}; const engine = settings.curriculumEngine || {};
    const levels = Array.isArray(s.enabledLevels) && s.enabledLevels.length ? s.enabledLevels : (Array.isArray(engine.enabledLevels) ? engine.enabledLevels : []);
    const text = [s.schoolStructure, s.schoolType, settings.schoolStructure, engine.structureType, levels.join(' ')].join(' ').toLowerCase();
    if (/primary[_\s-]*only|junior[_\s-]*only|early[_\s-]*only|grade_[1-9](\D|$)/.test(text) && !/grade_1[0-2]|senior|secondary|mixed/.test(text)) return false;
    return /senior|secondary|mixed|grade_10|grade_11|grade_12|g10|g11|g12|form_/.test(text);
  }
  function sectionFeature(section) {
    const key = String(section || '').toLowerCase().replace(/_/g, '-');
    return SECTION_FEATURE[key] || SECTION_FEATURE[key.replace(/\s+/g, '-')];
  }
  function sectionAllowed(section) {
    const feature = sectionFeature(section);
    if (!hasFeature(feature)) return false;
    if (feature === 'senior_subject_choice') {
      const role = currentRole();
      if (role === 'admin' || role === 'teacher' || role.startsWith('super')) return schoolHasSenior();
      const cur = String(selectedChild()?.curriculum || currentSchool().system || currentSchool().curriculum || 'cbc').toLowerCase();
      return ['cbc','cbe'].includes(cur) && schoolHasSenior() && isSeniorGrade(childClassText());
    }
    return true;
  }
  function notAvailableCard(section) {
    const feature = sectionFeature(section) || 'this feature';
    return `<div class="rounded-2xl border bg-card p-8 text-center max-w-2xl mx-auto">
      <div class="h-14 w-14 mx-auto rounded-full bg-muted flex items-center justify-center mb-4"><i data-lucide="lock" class="h-7 w-7 text-muted-foreground"></i></div>
      <h2 class="text-xl font-bold">Feature not available</h2>
      <p class="text-sm text-muted-foreground mt-2">${esc(feature.replace(/_/g, ' '))} is not included in this school’s active access mode, so it is hidden and blocked.</p>
      <button onclick="showDashboardSection('dashboard')" class="mt-5 px-4 py-2 rounded-lg bg-primary text-primary-foreground">Back to Dashboard</button>
    </div>`;
  }

  function cacheKey(base) {
    const code = schoolCode() || 'unknown-school';
    return `${base}:${code}`;
  }
  function purgeUnsafeSchoolCache() {
    const active = schoolCode();
    ['schoolSettings','schoolBranding','sidebarBrand','schoolName','schoolLogo','selectedChild'].forEach(k => localStorage.removeItem(k));
    localStorage.setItem('activeSchoolCode', active || '');
  }
  function restoreSchoolScopedCache() {
    const code = schoolCode();
    if (!code) return;
    const last = localStorage.getItem('activeSchoolCode');
    if (last && last !== code) purgeUnsafeSchoolCache();
    localStorage.setItem('activeSchoolCode', code);
    const scopedSettings = localStorage.getItem(cacheKey('schoolSettings'));
    if (scopedSettings) localStorage.setItem('schoolSettings', scopedSettings);
    const scopedBranding = localStorage.getItem(cacheKey('schoolBranding'));
    if (scopedBranding) localStorage.setItem('schoolBranding', scopedBranding);
  }
  function saveScopedCache(base, value) {
    const code = schoolCode();
    if (!code) return;
    try { localStorage.setItem(cacheKey(base), typeof value === 'string' ? value : JSON.stringify(value)); } catch (_) {}
  }
  function stableLogo(raw) {
    const v = String(raw || '').trim();
    if (!v || v === 'undefined' || v === 'null' || /\/(undefined|null)($|\?)/i.test(v)) return DEFAULT_LOGO;
    if (/^data:image\//i.test(v) || /^blob:/i.test(v) || /^https?:\/\//i.test(v) || /^assets\//i.test(v)) return v;
    if (/^[A-Za-z0-9+/=]{120,}$/.test(v)) return `data:image/png;base64,${v}`;
    return v;
  }
  function applyStableBranding() {
    refreshPlanState();
    const allowBranding = hasFeature('school_branding');
    const school = currentSchool();
    const branding = readJson('schoolBranding', {}) || {};
    const officialName = school.officialSchoolName || school.schoolName || school.name || branding.officialSchoolName || '';
    const sidebarName = allowBranding ? (branding.schoolName || branding.displayName || branding.name || officialName || 'Shule AI') : 'Shule AI';
    const rawLogo = allowBranding ? (branding.logoDataUrl || branding.logoUrl || branding.logo || school.logo || school.logoUrl || school.logoDataUrl) : DEFAULT_LOGO;
    const logo = stableLogo(rawLogo);
    document.querySelectorAll('#sidebar-school-name,.school-name,.school-name-display,[data-school-name]').forEach(el => { if (el) { el.textContent = sidebarName; el.title = sidebarName; }});
    document.querySelectorAll('img.sidebar-logo,img.school-logo,img[data-school-logo],[data-school-logo] img,.brand-logo img').forEach(img => {
      if (!img) return;
      const current = String(img.getAttribute('src') || '');
      if (!current || current === 'undefined' || /\/(undefined|null)($|\?)/i.test(current) || (!allowBranding && current !== logo)) img.src = logo;
      img.onerror = function () { if (this.src !== DEFAULT_LOGO) this.src = DEFAULT_LOGO; this.style.opacity = '1'; this.style.visibility = 'visible'; };
      img.style.opacity = '1'; img.style.visibility = 'visible';
    });
  }
  function applyVisibility(root = document) {
    root.querySelectorAll?.('[data-section], [onclick*="showDashboardSection"]').forEach(el => {
      const section = el.getAttribute('data-section') || ((el.getAttribute('onclick') || '').match(/showDashboardSection\(['"]([^'"]+)/) || [])[1];
      if (!section) return;
      const allowed = sectionAllowed(section);
      if (!allowed) {
        if (!el.dataset.v129Display) el.dataset.v129Display = el.style.display || '';
        el.dataset.v129Hidden = 'true';
        el.style.display = 'none';
      } else if (el.dataset.v129Hidden === 'true') {
        el.style.display = el.dataset.v129Display || '';
        delete el.dataset.v129Hidden;
      }
    });
    applyStableBranding();
  }

  window.v129HasFeature = hasFeature;
  window.v129SectionAllowed = sectionAllowed;
  window.v129RefreshPlanState = refreshPlanState;
  window.v129ApplyVisibility = applyVisibility;
  window.closePasswordChangeModal = function closePasswordChangeModal() { $('password-change-modal')?.classList.add('hidden'); };

  function patchAuthAndCache() {
    ['login','studentLogin','superAdminLogin'].forEach(name => {
      const original = window[name];
      if (typeof original !== 'function' || original.__v129) return;
      window[name] = async function () {
        purgeUnsafeSchoolCache();
        const res = await original.apply(this, arguments);
        restoreSchoolScopedCache();
        if (res?.data?.school) { localStorage.setItem('school', JSON.stringify(res.data.school)); saveScopedCache('schoolSettings', res.data.school); }
        refreshPlanState(res?.data?.access || res?.data?.subscription || res?.data?.schoolAccess || {});
        applyStableBranding();
        return res;
      };
      window[name].__v129 = true;
    });
    const oldCheckAuth = window.checkAuth;
    if (typeof oldCheckAuth === 'function' && !oldCheckAuth.__v129) {
      window.checkAuth = async function () {
        const ok = await oldCheckAuth.apply(this, arguments);
        if (ok) { restoreSchoolScopedCache(); refreshPlanState(); applyStableBranding(); }
        return ok;
      };
      window.checkAuth.__v129 = true;
    }
    const oldLogout = window.logout;
    if (typeof oldLogout === 'function' && !oldLogout.__v129) {
      window.logout = function () {
        ['authToken','refreshToken','token','user','school','userRole','activeSchoolCode','schoolSettings','schoolBranding','sidebarBrand','selectedChild','shule_selected_child','shule_selected_child_id','shule_plan_state'].forEach(k => localStorage.removeItem(k));
        Object.keys(localStorage).forEach(k => { if (/^(schoolSettings|schoolBranding|sidebarBrand|selectedChild):/.test(k)) localStorage.removeItem(k); });
        return oldLogout.apply(this, arguments);
      };
      window.logout.__v129 = true;
    }
    const oldGetCurrentSchool = window.getCurrentSchool;
    window.getCurrentSchool = function () {
      try {
        const school = readJson('school', null);
        if (school && typeof school === 'object') return school;
      } catch (_) {}
      return typeof oldGetCurrentSchool === 'function' ? oldGetCurrentSchool.apply(this, arguments) : null;
    };
  }

  function patchApiGuards() {
    const original = window.apiRequest;
    if (typeof original === 'function' && !original.__v129) {
      window.apiRequest = async function (endpoint, options = {}) {
        const path = String(endpoint || '');
        const method = String(options.method || 'GET').toUpperCase();
        const match = GATED_ENDPOINTS.find(x => x.rx.test(path));
        if (match && !hasFeature(match.feature)) {
          const err = new Error(`${match.feature.replace(/_/g, ' ')} is not available for this school plan.`);
          err.status = 403; err.code = 'FEATURE_NOT_AVAILABLE_FOR_PLAN';
          return Promise.reject(err);
        }
        return original.apply(this, arguments);
      };
      window.apiRequest.__v129 = true;
      window.apiRequest.API_BASE_URL = original.API_BASE_URL;
    }
    if (window.api?.duty) {
      Object.keys(window.api.duty).forEach(k => {
        if (typeof window.api.duty[k] !== 'function' || window.api.duty[k].__v129) return;
        const fn = window.api.duty[k];
        window.api.duty[k] = function () {
          if (!hasFeature('duty')) return Promise.reject(Object.assign(new Error('Duty is not available for this school plan.'), { status: 403, code: 'FEATURE_NOT_AVAILABLE_FOR_PLAN' }));
          return fn.apply(this, arguments);
        };
        window.api.duty[k].__v129 = true;
      });
    }
    if (window.api?.sms) {
      ['send','saveConfig','updateConfig'].forEach(k => {
        const fn = window.api.sms[k];
        if (typeof fn !== 'function' || fn.__v129) return;
        window.api.sms[k] = function () {
          if (!hasFeature('bulk_sms')) return Promise.reject(Object.assign(new Error('Bulk SMS is not available for this school plan.'), { status: 403, code: 'FEATURE_NOT_AVAILABLE_FOR_PLAN' }));
          return fn.apply(this, arguments);
        };
        window.api.sms[k].__v129 = true;
      });
      if (typeof window.api.sms.history !== 'function') window.api.sms.history = () => window.apiRequest('/api/sms/history');
    }
  }

  function patchDashboard() {
    const oldUpdateSidebar = window.updateSidebar;
    if (typeof oldUpdateSidebar === 'function' && !oldUpdateSidebar.__v129) {
      window.updateSidebar = function () {
        const result = oldUpdateSidebar.apply(this, arguments);
        setTimeout(() => applyVisibility(document), 0);
        return result;
      };
      window.updateSidebar.__v129 = true;
    }
    const oldShow = window.showDashboardSection;
    if (typeof oldShow === 'function' && !oldShow.__v129) {
      window.showDashboardSection = async function (section) {
        if (!sectionAllowed(section)) {
          const content = $('dashboard-content');
          const title = $('page-title');
          if (title) title.textContent = 'Not available';
          if (content) content.innerHTML = notAvailableCard(section);
          setTimeout(() => { if (window.lucide) window.lucide.createIcons(); applyVisibility(document); }, 0);
          return;
        }
        const res = await oldShow.apply(this, arguments);
        setTimeout(() => {
          if (section === 'competency') initParentCompetencyChart();
          injectReportSettingsEntrypoint();
          injectAnnouncementChannel();
          applyVisibility(document);
        }, 20);
        return res;
      };
      window.showDashboardSection.__v129 = true;
    }
  }

  function initParentCompetencyChart() {
    const canvas = $('parent-competency-chart');
    const rows = Array.isArray(window.__parentCompetencyData) ? window.__parentCompetencyData : [];
    if (!canvas || !rows.length || typeof window.Chart !== 'function') return;
    if (canvas.__v129Chart) return;
    canvas.__v129Chart = new window.Chart(canvas, {
      type: 'bar',
      data: {
        labels: rows.map(r => r.competency || 'Competency'),
        datasets: [{ label: 'Average Level (1-4)', data: rows.map(r => Number(r.averageLevel || 0)) }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }

  function renderAdminSmsSimple() {
    return (window.api?.sms?.getConfig ? window.api.sms.getConfig().catch(e => ({ success: false, message: e.message, data: {} })) : Promise.resolve({ data: {} })).then(res => {
      const cfg = res.data || {};
      const remaining = Math.max(0, Number(cfg.tokenBalance || 0) - Number(cfg.usedThisMonth || 0));
      return `<div class="space-y-6 animate-fade-in" data-v129-admin-sms="true">
        <div class="rounded-2xl border bg-card p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div><p class="text-xs uppercase tracking-wide text-muted-foreground">Bulk SMS</p><h2 class="text-2xl font-bold">SMS Center</h2><p class="text-sm text-muted-foreground mt-1">Admin can only send messages and view usage. Provider/API setup is controlled by Super Admin.</p></div>
          <div class="grid grid-cols-2 gap-3 text-center"><div class="rounded-xl border p-4"><b class="text-2xl">${Number(remaining).toLocaleString()}</b><span class="block text-xs text-muted-foreground">Tokens left</span></div><div class="rounded-xl border p-4"><b class="text-2xl">${Number(cfg.usedThisMonth || 0).toLocaleString()}</b><span class="block text-xs text-muted-foreground">Used</span></div></div>
        </div>
        <div class="grid lg:grid-cols-[.9fr_1.1fr] gap-5">
          <div class="rounded-2xl border bg-card p-6 space-y-4">
            <h3 class="font-semibold text-lg">Compose SMS</h3>
            <label class="block space-y-1"><span class="text-sm font-medium">Recipients</span><textarea id="v129-sms-recipients" rows="5" class="w-full rounded-lg border bg-background px-3 py-2" placeholder="2547..., one per line or comma separated"></textarea></label>
            <label class="block space-y-1"><span class="text-sm font-medium">Message</span><textarea id="v129-sms-message" rows="7" maxlength="480" class="w-full rounded-lg border bg-background px-3 py-2" placeholder="Type message..."></textarea></label>
            <button onclick="v129SendSms()" class="w-full px-5 py-3 rounded-xl bg-primary text-primary-foreground font-semibold">Send SMS</button>
            <div id="v129-sms-result" class="text-sm"></div>
          </div>
          <div class="rounded-2xl border bg-card p-6"><div class="flex items-center justify-between mb-3"><h3 class="font-semibold text-lg">SMS History</h3><button onclick="v129LoadSmsHistory()" class="text-sm px-3 py-1 border rounded-lg">Refresh</button></div><div id="v129-sms-history" class="text-sm text-muted-foreground">Loading history...</div></div>
        </div>
      </div>`;
    });
  }
  function patchSmsRender() {
    const oldAdmin = window.renderAdminSection;
    if (typeof oldAdmin === 'function' && !oldAdmin.__v129Sms) {
      window.renderAdminSection = async function (section) {
        if (section === 'sms' && currentRole() === 'admin') return await renderAdminSmsSimple();
        return oldAdmin.apply(this, arguments);
      };
      window.renderAdminSection.__v129Sms = true;
    }
  }
  function parseRecipients(v) { return String(v || '').split(/[\n,;]+/).map(s => s.trim()).filter(Boolean); }
  window.v129SendSms = async function () {
    const result = $('v129-sms-result');
    try {
      const payload = { recipients: parseRecipients($('v129-sms-recipients')?.value), message: $('v129-sms-message')?.value || '' };
      const res = await window.api.sms.send(payload);
      if (result) result.innerHTML = `<div class="rounded-xl border p-3 text-green-700">${esc(res.message || 'SMS sent')}<br><span class="text-xs">Reached: ${esc(res.data?.successCount ?? res.data?.recipients ?? payload.recipients.length)} • Tokens used: ${esc(res.data?.tokensUsed ?? payload.recipients.length)}</span></div>`;
      toast(res.message || 'SMS processed', 'success');
      window.v129LoadSmsHistory();
    } catch (e) { if (result) result.innerHTML = `<div class="rounded-xl border border-red-300 p-3 text-red-600">${esc(e.message)}</div>`; toast(e.message || 'SMS failed', 'error'); }
  };
  window.v129LoadSmsHistory = async function () {
    const root = $('v129-sms-history'); if (!root || !window.api?.sms?.history) return;
    const res = await window.api.sms.history().catch(e => ({ success: false, message: e.message, data: [] }));
    const rows = Array.isArray(res.data) ? res.data : [];
    root.innerHTML = rows.length ? `<div class="overflow-x-auto"><table class="w-full text-sm"><thead><tr><th class="text-left py-2">Date</th><th class="text-left py-2">Message</th><th class="text-left py-2">Reached</th><th class="text-left py-2">Tokens</th><th class="text-left py-2">Status</th></tr></thead><tbody>${rows.map(r => `<tr class="border-t"><td class="py-2">${esc(new Date(r.createdAt).toLocaleString())}</td><td class="py-2">${esc(String(r.message || '').slice(0, 80))}</td><td class="py-2">${esc(r.successCount ?? r.recipientCount ?? 0)}</td><td class="py-2">${esc(r.tokensUsed ?? r.recipientCount ?? 0)}</td><td class="py-2">${esc(r.status || '-')}</td></tr>`).join('')}</tbody></table></div>` : 'No SMS sent yet.';
  };

  function injectAnnouncementChannel() {
    if (!$('announcement-message') || $('announcement-channel')) return;
    const target = $('announcement-message')?.closest('div');
    const channel = document.createElement('div');
    channel.className = 'grid gap-3 md:grid-cols-2';
    channel.innerHTML = `<div><label class="block text-sm font-medium mb-1">Send using</label><select id="announcement-channel" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"><option value="platform">Platform Alert only</option><option value="sms">SMS only</option><option value="both">Platform Alert + SMS</option></select><p class="text-xs text-muted-foreground mt-1">SMS uses school tokens. Platform alerts do not reduce SMS tokens.</p></div><div><label class="block text-sm font-medium mb-1">SMS short version</label><textarea id="announcement-sms-message" rows="2" maxlength="160" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" placeholder="Optional 160-char SMS version"></textarea></div>`;
    target?.after(channel);
  }
  function recipientPhonesFromRows(rows) {
    return (rows || []).map(x => x.phone || x.User?.phone || x.parentPhone || x.Parent?.User?.phone || x.User?.contact?.phone).filter(Boolean);
  }
  async function collectAnnouncementRecipients(recipientType) {
    let userIds = [], phones = [];
    if (['all_parents','fee_defaulters','pending_payments','subscription_expiry'].includes(recipientType)) {
      const parents = await window.api.admin.getParents();
      userIds = (parents.data || []).map(p => p.userId || p.User?.id).filter(Boolean);
      phones = recipientPhonesFromRows(parents.data || []);
    } else if (recipientType === 'whole_school') {
      const [parents, teachers, students] = await Promise.allSettled([window.api.admin.getParents(), window.api.admin.getTeachers?.() || Promise.resolve({data: []}), window.api.admin.getStudents?.() || Promise.resolve({data: []})]);
      const rows = [...(parents.value?.data || []), ...(teachers.value?.data || []), ...(students.value?.data || [])];
      userIds = rows.map(x => x.userId || x.User?.id).filter(Boolean);
      phones = recipientPhonesFromRows(rows);
    } else if (recipientType === 'teachers') {
      const teachers = await (window.api.admin.getTeachers?.() || window.apiRequest('/api/admin/teachers'));
      userIds = (teachers.data || []).map(t => t.userId || t.User?.id).filter(Boolean);
      phones = recipientPhonesFromRows(teachers.data || []);
    } else if (recipientType === 'students') {
      const students = await (window.api.admin.getStudents?.() || window.apiRequest('/api/admin/students'));
      userIds = (students.data || []).map(st => st.userId || st.User?.id).filter(Boolean);
      phones = recipientPhonesFromRows(students.data || []);
    } else if (recipientType === 'specific_class') {
      const classId = $('announcement-class')?.value;
      if (!classId) throw new Error('Please select a class');
      const students = await window.api.admin.getClassStudents(classId);
      const ids = new Set(), ph = new Set();
      (students.data || []).forEach(student => (student.parents || student.Parents || []).forEach(parent => { const uid = parent.userId || parent.User?.id; if (uid) ids.add(uid); const phone = parent.phone || parent.User?.phone; if (phone) ph.add(phone); }));
      userIds = [...ids]; phones = [...ph];
    } else {
      const parentId = $('announcement-parent')?.value;
      if (!parentId) throw new Error('Please select a parent');
      userIds = [parentId];
      const parents = await window.api.admin.getParents().catch(() => ({ data: [] }));
      const parent = (parents.data || []).find(p => String(p.userId || p.User?.id || p.id) === String(parentId));
      phones = recipientPhonesFromRows(parent ? [parent] : []);
    }
    return { userIds: [...new Set(userIds.map(String))], phones: [...new Set(phones.map(String))] };
  }
  function patchAnnouncement() {
    const oldSend = window.sendAnnouncement;
    if (typeof oldSend !== 'function' || oldSend.__v129) return;
    window.sendAnnouncement = async function () {
      injectAnnouncementChannel();
      const channel = $('announcement-channel')?.value || 'platform';
      if (channel === 'platform') return oldSend.apply(this, arguments);
      const recipientType = $('announcement-recipients')?.value;
      const title = $('announcement-title')?.value?.trim();
      const platformMessage = $('announcement-message')?.value?.trim();
      const smsMessage = ($('announcement-sms-message')?.value || platformMessage || '').trim();
      if (!title || !platformMessage) return toast('Please enter a title and message', 'error');
      if (!hasFeature('bulk_sms')) return toast('Bulk SMS is not available for this school plan.', 'error');
      if (typeof window.showLoading === 'function') window.showLoading();
      try {
        const { userIds, phones } = await collectAnnouncementRecipients(recipientType);
        let platformCount = 0, smsCount = 0;
        if (channel === 'both') {
          for (const userId of userIds) {
            await window.apiRequest('/api/alerts', { method: 'POST', body: JSON.stringify({ userId, type: 'system', category: 'Announcement', severity: 'info', title, message: platformMessage, data: { sourceType: 'admin_announcement', sourceLabel: 'Admin announcement', deliveryChannel: channel, actionUrl: '#alerts' } }) });
            platformCount++;
          }
        }
        if (!phones.length) throw new Error('No phone numbers found for this audience.');
        const sms = await window.api.sms.send({ recipients: phones, message: smsMessage, meta: { title, audience: recipientType, deliveryChannel: channel } });
        smsCount = sms.data?.successCount ?? sms.data?.recipients ?? phones.length;
        toast(`Announcement processed: ${platformCount} platform alert(s), ${smsCount} SMS recipient(s).`, 'success');
        if ($('announcement-title')) $('announcement-title').value = '';
        if ($('announcement-message')) $('announcement-message').value = '';
        if ($('announcement-sms-message')) $('announcement-sms-message').value = '';
      } catch (e) { toast(e.message || 'Failed to send announcement', 'error'); }
      finally { if (typeof window.hideLoading === 'function') window.hideLoading(); }
    };
    window.sendAnnouncement.__v129 = true;
  }

  function injectReportSettingsEntrypoint() {
    if (currentRole() !== 'admin') return;
    const content = $('dashboard-content');
    if (!content || $('v129-report-settings-card')) return;
    const headerText = (content.textContent || '').toLowerCase();
    if (!headerText.includes('dashboard')) return;
    const card = document.createElement('button');
    card.id = 'v129-report-settings-card';
    card.type = 'button';
    card.onclick = () => window.showDashboardSection('report-settings');
    card.className = 'p-6 border rounded-lg hover:bg-accent transition-colors text-left';
    card.innerHTML = `<i data-lucide="file-check" class="h-8 w-8 text-primary mb-3"></i><h4 class="font-semibold">Report Settings</h4><p class="text-sm text-muted-foreground">Choose CAT, Midterm, End Term, SBA, Project, Practical visibility, weights and final-report columns.</p>`;
    const quick = content.querySelector('.grid.gap-4.md\\:grid-cols-3, .grid.gap-4');
    if (quick) quick.appendChild(card);
  }

  function renderReportSettings() {
    const settings = readJson(cacheKey('schoolSettings'), readJson('schoolSettings', {})) || {};
    const existing = settings.settings?.reportSettings || settings.reportSettings || {};
    const types = ['CAT','Midterm','End Term','SBA','Project','Practical'];
    return `<div class="space-y-6 animate-fade-in" data-v129-report-settings="true"><div class="rounded-2xl border bg-card p-6"><h2 class="text-2xl font-bold">Assessment & Report Card Settings</h2><p class="text-sm text-muted-foreground mt-1">Admin decides which tests appear on the final report card and which ones count in the final result.</p></div><div class="rounded-2xl border bg-card overflow-hidden"><table class="w-full text-sm"><thead class="bg-muted/50"><tr><th class="text-left p-3">Assessment</th><th class="p-3">Show on report</th><th class="p-3">Count in final</th><th class="p-3">Weight %</th><th class="p-3">Display order</th></tr></thead><tbody>${types.map((t, i) => { const row = existing[t] || existing[t.toLowerCase()] || {}; return `<tr class="border-t"><td class="p-3 font-semibold">${t}</td><td class="p-3 text-center"><input type="checkbox" class="v129-assessment-show" data-type="${t}" ${row.showOnReport !== false ? 'checked' : ''}></td><td class="p-3 text-center"><input type="checkbox" class="v129-assessment-count" data-type="${t}" ${row.countInFinal !== false ? 'checked' : ''}></td><td class="p-3"><input type="number" min="0" max="100" class="v129-assessment-weight w-24 rounded border bg-background px-2 py-1" data-type="${t}" value="${Number(row.weight ?? (i < 3 ? 20 : 0))}"></td><td class="p-3"><input type="number" min="1" class="v129-assessment-order w-20 rounded border bg-background px-2 py-1" data-type="${t}" value="${Number(row.displayOrder ?? i + 1)}"></td></tr>`; }).join('')}</tbody></table></div><div class="flex justify-end"><button onclick="v129SaveReportSettings()" class="px-5 py-3 rounded-xl bg-primary text-primary-foreground font-semibold">Save Report Settings</button></div></div>`;
  }
  window.v129SaveReportSettings = async function () {
    const reportSettings = {};
    document.querySelectorAll('.v129-assessment-show').forEach(show => {
      const type = show.dataset.type;
      reportSettings[type] = {
        assessmentType: type,
        showOnReport: show.checked,
        countInFinal: document.querySelector(`.v129-assessment-count[data-type="${CSS.escape(type)}"]`)?.checked !== false,
        weight: Number(document.querySelector(`.v129-assessment-weight[data-type="${CSS.escape(type)}"]`)?.value || 0),
        displayOrder: Number(document.querySelector(`.v129-assessment-order[data-type="${CSS.escape(type)}"]`)?.value || 1)
      };
    });
    const current = readJson('schoolSettings', {}) || {};
    const payload = { ...current, settings: { ...(current.settings || {}), reportSettings }, reportSettings };
    const res = await window.api.admin.updateSchoolSettings(payload);
    saveScopedCache('schoolSettings', res.data || payload);
    localStorage.setItem('schoolSettings', JSON.stringify(res.data || payload));
    toast('Report settings saved', 'success');
  };

  function patchRenderReportSettings() {
    const oldAdmin = window.renderAdminSection;
    if (typeof oldAdmin === 'function' && !oldAdmin.__v129Report) {
      window.renderAdminSection = async function (section) {
        if (section === 'report-settings' || section === 'exams') return renderReportSettings();
        return oldAdmin.apply(this, arguments);
      };
      window.renderAdminSection.__v129Report = true;
    }
  }

  function patchTasks() {
    window.saveTask = async function () {
      const title = $('task-title')?.value?.trim();
      const description = $('task-description')?.value?.trim() || '';
      const dueDate = $('task-due-date')?.value || null;
      if (!title) return toast('Please enter a task title', 'error');
      try {
        await (window.api?.tasks?.createTask ? window.api.tasks.createTask({ title, description, dueDate }) : window.apiRequest('/api/tasks', { method: 'POST', body: JSON.stringify({ title, description, dueDate }) }));
        toast('Task saved successfully', 'success');
        window.closeAddTaskModal?.();
        if (window.currentSection === 'tasks') window.showDashboardSection?.('tasks');
      } catch (e) { toast(e.message || 'Failed to save task', 'error'); }
    };
  }

  function patchParentChildIsolation() {
    const oldSet = localStorage.setItem.bind(localStorage);
    localStorage.setItem = function (key, value) {
      const oldChild = localStorage.getItem('shule_selected_child_id') || localStorage.getItem('selectedChild');
      const res = oldSet(key, value);
      if (['shule_selected_child_id','selectedChild'].includes(key) && oldChild && String(oldChild) !== String(value)) {
        ['parentAlerts','parentPayments','parentAttendance','parentProgress','parentHomework','parentTimetable','parentReportCards'].forEach(k => localStorage.removeItem(`${k}:${oldChild}`));
        if (window.dashboardData) {
          delete window.dashboardData.alerts; delete window.dashboardData.payments; delete window.dashboardData.attendance; delete window.dashboardData.progress; delete window.dashboardData.homework; delete window.dashboardData.timetable;
        }
        window.dispatchEvent(new CustomEvent('shule:child-switched', { detail: { oldChild, newChild: value } }));
      }
      return res;
    };
  }

  function boot() {
    restoreSchoolScopedCache();
    refreshPlanState();
    patchAuthAndCache();
    patchApiGuards();
    patchDashboard();
    patchSmsRender();
    patchRenderReportSettings();
    patchAnnouncement();
    patchTasks();
    patchParentChildIsolation();
    applyVisibility(document);
    applyStableBranding();
    setTimeout(() => { window.v129LoadSmsHistory?.(); injectAnnouncementChannel(); injectReportSettingsEntrypoint(); applyVisibility(document); }, 350);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  window.addEventListener('load', () => { boot(); setInterval(applyStableBranding, 3000); });
  try { new MutationObserver(() => applyVisibility(document)).observe(document.documentElement, { childList: true, subtree: true }); } catch (_) {}
})();
