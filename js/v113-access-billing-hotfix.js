// Shule AI v113 access, billing, SMS and super-admin isolation fixes.
(function(){
  'use strict';
  const $ = (id) => document.getElementById(id);
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const safeParse = (v, fb={}) => { try { return v ? JSON.parse(v) : fb; } catch { return fb; } };
  const apiReq = (path, opts={}) => window.apiRequest ? window.apiRequest(path, opts) : Promise.reject(new Error('API helper not loaded'));
  const toast = (msg, type='success') => window.showToast ? window.showToast(msg, type) : alert(msg);
  function currentUser(){ return (typeof window.getCurrentUser === 'function' ? window.getCurrentUser() : null) || safeParse(localStorage.getItem('user'), {}); }
  function currentRole(){ return String(currentUser()?.role || localStorage.getItem('userRole') || '').toLowerCase().replace('-', '_'); }
  function isSuper(){ const r=currentRole(); return r === 'superadmin' || r === 'super_admin'; }

  // Super admin must never ask for a school-scoped owner branding record.
  if (window.BrandingManager) {
    const oldLoad = window.BrandingManager.loadSchoolBranding;
    window.BrandingManager.loadSchoolBranding = async function(force){
      if (isSuper()) {
        try { localStorage.removeItem('schoolBranding'); } catch (_) {}
        window.schoolBranding = {};
        if (typeof window.BrandingManager.forceApply === 'function') window.BrandingManager.forceApply('ShuleAI');
        return {};
      }
      return oldLoad ? oldLoad.call(this, force) : {};
    };
  }

  // Role-safe parent report-card API hook. helpers.js uses this when present.
  window.api = window.api || {};
  window.api.parent = window.api.parent || {};
  window.api.sms = window.api.sms || {};
  window.api.parent.getChildReportCardDetails = window.api.parent.getChildReportCardDetails || ((studentId) => apiReq(`/api/parent/child/${studentId}/report-card-details`));
  window.api.sms.getConfig = window.api.sms.getConfig || (() => apiReq('/api/sms/config'));
  window.api.sms.saveConfig = window.api.sms.saveConfig || ((payload) => apiReq('/api/sms/config', { method:'PUT', body:JSON.stringify(payload) }));
  window.api.sms.send = window.api.sms.send || ((payload) => apiReq('/api/sms/send', { method:'POST', body:JSON.stringify(payload) }));

  function parseRecipients(value){ return String(value || '').split(/[\n,;]+/).map(s => s.trim()).filter(Boolean); }
  function parseProviders(value){ try { const parsed = JSON.parse(value || '[]'); return Array.isArray(parsed) ? parsed : []; } catch { throw new Error('Providers JSON is invalid'); } }

  window.v110RenderSms = async function(){
    const res = await window.api.sms.getConfig().catch(e => ({ success:false, message:e.message, data:{} }));
    const cfg = res.data || {};
    const remaining = Math.max(0, Number(cfg.tokenBalance || 0) - Number(cfg.usedThisMonth || 0));
    return `<div class="space-y-6 animate-fade-in">
      <div class="rounded-2xl border bg-card p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div><p class="text-xs uppercase tracking-wide text-muted-foreground">${isSuper() ? 'Platform SMS' : 'School SMS'}</p><h2 class="text-3xl font-bold">Bulk SMS Center</h2><p class="text-sm text-muted-foreground mt-1">Provider-neutral SMS. It works as a ready queue now and can later connect to Africa's Talking, Twilio, Infobip, Celcom or any provider.</p></div>
        <div class="grid grid-cols-3 gap-2 text-center text-xs"><div class="rounded-xl border p-3"><b>${esc(cfg.activeProvider || 'noop')}</b><span class="block text-muted-foreground">Provider</span></div><div class="rounded-xl border p-3"><b>${Number(cfg.tokenBalance || 0).toLocaleString()}</b><span class="block text-muted-foreground">Tokens</span></div><div class="rounded-xl border p-3"><b>${remaining.toLocaleString()}</b><span class="block text-muted-foreground">Remaining</span></div></div>
      </div>
      <div class="grid xl:grid-cols-[.9fr_1.1fr] gap-5">
        <div class="rounded-2xl border bg-card p-6 space-y-4">
          <h3 class="font-semibold text-lg">SMS Settings</h3>
          <div class="grid md:grid-cols-2 gap-3">
            <label class="space-y-1"><span class="text-sm font-medium">Sender ID</span><input id="sms-sender-id" value="${esc(cfg.senderId || 'SHULEAI')}" class="w-full rounded-lg border bg-background px-3 py-2"></label>
            <label class="space-y-1"><span class="text-sm font-medium">Active provider</span><input id="sms-provider" value="${esc(cfg.activeProvider || 'noop')}" class="w-full rounded-lg border bg-background px-3 py-2" placeholder="noop / africastalking / twilio"></label>
            <label class="space-y-1"><span class="text-sm font-medium">Token balance</span><input id="sms-token-balance" type="number" min="0" value="${Number(cfg.tokenBalance || 0)}" class="w-full rounded-lg border bg-background px-3 py-2"></label>
            <label class="space-y-1"><span class="text-sm font-medium">Monthly limit</span><input id="sms-monthly-limit" type="number" min="0" value="${Number(cfg.monthlyLimit || 0)}" class="w-full rounded-lg border bg-background px-3 py-2"></label>
          </div>
          <label class="flex items-center gap-2 text-sm"><input id="sms-api-ready" type="checkbox" ${cfg.apiReady ? 'checked' : ''}> API provider is connected and allowed to send live SMS</label>
          <label class="space-y-1 block"><span class="text-sm font-medium">Providers JSON</span><textarea id="sms-providers" rows="6" class="w-full rounded-lg border bg-background px-3 py-2 font-mono text-xs">${esc(JSON.stringify(cfg.providers || [], null, 2))}</textarea></label>
          <label class="space-y-1 block"><span class="text-sm font-medium">Notes</span><textarea id="sms-notes" rows="3" class="w-full rounded-lg border bg-background px-3 py-2">${esc(cfg.notes || '')}</textarea></label>
          <button onclick="v113SaveSmsConfig()" class="px-5 py-3 rounded-xl bg-primary text-primary-foreground font-semibold">Save SMS Settings</button>
        </div>
        <div class="rounded-2xl border bg-card p-6 space-y-4">
          <h3 class="font-semibold text-lg">Compose / Validate SMS</h3>
          <label class="space-y-1 block"><span class="text-sm font-medium">Recipients</span><textarea id="sms-recipients" rows="5" class="w-full rounded-lg border bg-background px-3 py-2" placeholder="2547..., one per line or comma separated"></textarea></label>
          <label class="space-y-1 block"><span class="text-sm font-medium">Message</span><textarea id="sms-message" rows="7" maxlength="480" class="w-full rounded-lg border bg-background px-3 py-2" placeholder="Type school alert or platform SMS..."></textarea></label>
          <div class="flex gap-3 flex-wrap"><button onclick="v113SendSmsDraft()" class="px-5 py-3 rounded-xl bg-primary text-primary-foreground font-semibold">Validate / Queue SMS</button><span class="text-xs text-muted-foreground self-center">If API is not connected, the backend validates the draft without charging tokens.</span></div>
          <div id="sms-send-result" class="text-sm"></div>
        </div>
      </div>
    </div>`;
  };

  window.v113SaveSmsConfig = async function(){
    const payload = {
      senderId: $('sms-sender-id')?.value || 'SHULEAI',
      activeProvider: $('sms-provider')?.value || 'noop',
      tokenBalance: Number($('sms-token-balance')?.value || 0),
      monthlyLimit: Number($('sms-monthly-limit')?.value || 0),
      apiReady: !!$('sms-api-ready')?.checked,
      providers: parseProviders($('sms-providers')?.value),
      notes: $('sms-notes')?.value || ''
    };
    await window.api.sms.saveConfig(payload);
    toast('SMS settings saved');
    await window.showDashboardSection?.('sms');
  };
  window.v113SendSmsDraft = async function(){
    const result = $('sms-send-result');
    try {
      const payload = { recipients: parseRecipients($('sms-recipients')?.value), message: $('sms-message')?.value || '' };
      const res = await window.api.sms.send(payload);
      if (result) result.innerHTML = `<div class="rounded-xl border p-3 ${res.queued ? 'text-green-700' : 'text-amber-700'}">${esc(res.message || 'SMS processed')}<pre class="text-xs mt-2 whitespace-pre-wrap">${esc(JSON.stringify(res.data || {}, null, 2))}</pre></div>`;
      toast(res.message || 'SMS processed', res.queued ? 'success' : 'info');
    } catch(e) { if (result) result.innerHTML = `<div class="rounded-xl border border-red-300 p-3 text-red-600">${esc(e.message)}</div>`; toast(e.message || 'SMS failed', 'error'); }
  };

  // Force true super-admin/platform analytics, never admin analytics.
  window.v112RenderSuperAdminAnalytics = async function(){
    const [analyticsRes, overviewRes] = await Promise.all([
      (window.api?.superAdmin?.getAnalytics ? window.api.superAdmin.getAnalytics() : apiReq('/api/super-admin/analytics')).catch(() => ({data:{}})),
      apiReq('/api/super-admin/overview').catch(() => ({data:{}}))
    ]);
    const data = analyticsRes.data || {};
    const overview = { ...(overviewRes.data || {}), ...(data.overview || {}) };
    const cards = [
      ['Total Schools', overview.totalSchools ?? overview.schools ?? 0],
      ['Active Schools', overview.activeSchools ?? 0],
      ['Pending Schools', overview.pendingSchools ?? 0],
      ['Students', overview.totalStudents ?? overview.students ?? 0],
      ['Teachers', overview.totalTeachers ?? overview.teachers ?? 0],
      ['Parents', overview.totalParents ?? overview.parents ?? 0],
      ['Revenue MTD', `KES ${Number(overview.revenueMTD ?? overview.totalRevenue ?? 0).toLocaleString()}`]
    ];
    setTimeout(() => {
      try {
        if (data.growth?.labels?.length && typeof initLineChart === 'function') initLineChart('v113-platform-growth', data.growth.labels, data.growth.values || [], 'Schools');
        if (data.revenueTrend?.labels?.length && typeof initBarChart === 'function') initBarChart('v113-platform-revenue', data.revenueTrend.labels, data.revenueTrend.values || [], 'KES');
        if (data.distributionByCurriculum && typeof initDoughnutChart === 'function') initDoughnutChart('v113-platform-curriculum', Object.keys(data.distributionByCurriculum), Object.values(data.distributionByCurriculum));
      } catch (_) {}
    }, 120);
    return `<div class="space-y-6 animate-fade-in analytics-container">
      <div class="flex items-center justify-between gap-3 flex-wrap"><div><h2 class="text-2xl font-bold">Super Admin Platform Analytics</h2><p class="text-sm text-muted-foreground">Platform-wide totals across all schools. This section is isolated from admin/school analytics.</p></div><span class="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary">Platform scope only</span></div>
      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">${cards.map(c => `<div class="rounded-xl border bg-card p-4"><p class="text-sm text-muted-foreground">${esc(c[0])}</p><h3 class="text-xl font-bold mt-1">${esc(c[1])}</h3></div>`).join('')}</div>
      <div class="grid gap-4 lg:grid-cols-2"><div class="rounded-xl border bg-card p-6 analytics-card"><h3 class="font-semibold mb-4">School Growth</h3><div class="chart-container"><canvas id="v113-platform-growth"></canvas></div></div><div class="rounded-xl border bg-card p-6 analytics-card"><h3 class="font-semibold mb-4">Platform Revenue</h3><div class="chart-container"><canvas id="v113-platform-revenue"></canvas></div></div></div>
      <div class="grid gap-4 lg:grid-cols-2"><div class="rounded-xl border bg-card p-6 analytics-card"><h3 class="font-semibold mb-4">Curriculum Distribution</h3><div class="chart-container"><canvas id="v113-platform-curriculum"></canvas></div></div><div class="rounded-xl border bg-card p-6"><h3 class="font-semibold mb-3">Access / Level Snapshot</h3><pre class="text-xs bg-muted rounded-lg p-3 overflow-auto">${esc(JSON.stringify({ distributionByLevel:data.distributionByLevel || {}, distributionByCurriculum:data.distributionByCurriculum || {} }, null, 2))}</pre></div></div>
    </div>`;
  };

  const oldRenderAdmin = window.renderAdminSection;
  if (typeof oldRenderAdmin === 'function') {
    window.renderAdminSection = async function(section){
      if (section === 'sms') return await window.v110RenderSms();
      return oldRenderAdmin.call(this, section);
    };
  }
  const oldRenderSuper = window.renderSuperAdminSection;
  if (typeof oldRenderSuper === 'function') {
    window.renderSuperAdminSection = async function(section){
      if (section === 'analytics') return await window.v112RenderSuperAdminAnalytics();
      if (section === 'sms') return await window.v110RenderSms();
      return oldRenderSuper.call(this, section);
    };
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (isSuper() && window.BrandingManager?.forceApply) window.BrandingManager.forceApply('ShuleAI');
  });
})();
