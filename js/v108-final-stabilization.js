
/* V108 final stabilization: scoped theme, real super-admin data, image safety, custom subjects. */
(function(){
  'use strict';
  function esc(v){ return String(v ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
  function role(){ try { return (JSON.parse(localStorage.getItem('user')||'{}').role || localStorage.getItem('userRole') || '').toLowerCase(); } catch(_) { return (localStorage.getItem('userRole')||'').toLowerCase(); } }
  const oldResolve = window.resolveMediaUrl;
  window.resolveMediaUrl = window.resolveImageUrl = function(value){
    const raw = String(value || '').trim();
    if (!raw || raw === 'undefined' || raw === 'null') return '';
    if (/^data:image\//i.test(raw) || /^https?:\/\//i.test(raw) || /^(blob:|file:)/i.test(raw)) return raw;
    if (raw.includes('data:image/')) return '';
    const base = (window.API_BASE_URL || (typeof API_BASE_URL !== 'undefined' ? API_BASE_URL : '') || '').replace(/\/$/, '');
    if (!base) return raw.startsWith('/') ? raw : '/' + raw;
    return base + (raw.startsWith('/') ? raw : '/' + raw);
  };
  window.v108ApplyDashboardScope = function(){
    const r = role();
    if (r === 'super_admin' || r === 'superadmin') {
      document.body.classList.add('platform-theme-scope');
      document.body.classList.remove('school-theme-scope');
      document.documentElement.setAttribute('data-dashboard-scope','platform');
      try { window.schoolBranding = {}; localStorage.removeItem('schoolBranding'); } catch(_) {}
    } else {
      document.body.classList.add('school-theme-scope');
      document.body.classList.remove('platform-theme-scope');
      document.documentElement.setAttribute('data-dashboard-scope','school');
    }
  };
  window.addEventListener('DOMContentLoaded', window.v108ApplyDashboardScope);
  window.addEventListener('storage', window.v108ApplyDashboardScope);
  setInterval(window.v108ApplyDashboardScope, 2500);

  if (window.api && window.api.superAdmin) {
    Object.assign(window.api.superAdmin, {
      getPlatformBranding: () => apiRequest('/api/super-admin/platform-branding'),
      getPlatformAnalytics: () => apiRequest(`/api/super-admin/platform-analytics?_=${Date.now()}`),
      getPlatformHealth: () => apiRequest(`/api/super-admin/platform-health?_=${Date.now()}`),
      getPlatformEvents: () => apiRequest(`/api/super-admin/platform-events?_=${Date.now()}`),
      getPlatformAlerts: () => apiRequest(`/api/super-admin/platform-alerts?_=${Date.now()}`),
      getPlatformPlans: () => apiRequest('/api/super-admin/platform-plans'),
      savePlatformPlans: (plans) => apiRequest('/api/super-admin/platform-plans', { method:'PUT', body: JSON.stringify({ plans }) })
    });
  }
  if (window.api && window.api.admin) {
    window.api.admin.addCustomSubject = (data) => apiRequest('/api/admin/curriculum/custom-subjects', { method:'POST', body: JSON.stringify(data) });
  }

  window.renderSuperAdminAnalyticsStandalone = async function(){
    try {
      const res = await api.superAdmin.getPlatformAnalytics();
      const d = res.data || {};
      const o = d.overview || {};
      const cards = [
        ['Total Schools', o.totalSchools, 'building-2'], ['Active Schools', o.activeSchools, 'check-circle'], ['Pilot Schools', o.pilotSchools, 'rocket'], ['Paid Schools', o.paidSchools, 'credit-card'],
        ['Total Students', o.totalStudents, 'graduation-cap'], ['Total Teachers', o.totalTeachers, 'users'], ['Payment Requests', o.paymentRequestsPending, 'receipt'], ['System Errors', o.recentErrors, 'alert-triangle']
      ];
      return `<div class="space-y-6 animate-fade-in"><div><h2 class="text-2xl font-bold">Super Admin Analytics</h2><p class="text-sm text-muted-foreground">Platform-wide real data only. This is separate from school admin analytics.</p></div><div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">${cards.map(c=>`<div class="rounded-xl border bg-card p-5"><div class="flex items-center justify-between"><div><p class="text-sm text-muted-foreground">${esc(c[0])}</p><h3 class="text-2xl font-bold">${Number(c[1]||0).toLocaleString()}</h3></div><i data-lucide="${c[2]}" class="h-6 w-6 text-primary"></i></div></div>`).join('')}</div><div class="grid gap-4 lg:grid-cols-2"><div class="rounded-xl border bg-card p-5"><h3 class="font-semibold mb-3">Access Modes</h3>${Object.entries(d.accessModes||{}).length ? Object.entries(d.accessModes).map(([k,v])=>`<div class="flex justify-between border-b py-2 text-sm"><span>${esc(k)}</span><strong>${Number(v||0)}</strong></div>`).join('') : '<p class="text-sm text-muted-foreground">No access records yet.</p>'}</div><div class="rounded-xl border bg-card p-5"><h3 class="font-semibold mb-3">Recent Platform Events</h3>${(d.recentEvents||[]).length ? d.recentEvents.map(e=>`<div class="border-b py-2"><p class="text-sm font-medium">${esc(e.action || e.title || e.eventType)}</p><p class="text-xs text-muted-foreground">${esc(e.schoolCode || 'Platform')} • ${esc(e.createdAt ? new Date(e.createdAt).toLocaleString() : '')}</p></div>`).join('') : '<p class="text-sm text-muted-foreground">No platform events yet.</p>'}</div></div></div>`;
    } catch(e) { return `<div class="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">Failed to load super admin analytics: ${esc(e.message)}</div>`; }
  };

  window.renderSuperAdminHealth = async function(){
    try {
      const res = await api.superAdmin.getPlatformHealth(); const d = res.data || {};
      const status = d.database === 'operational' ? 'text-green-600' : 'text-red-600';
      return `<div class="space-y-6 animate-fade-in"><div><h2 class="text-2xl font-bold">Platform Health</h2><p class="text-sm text-muted-foreground">Real backend/database health. No fake sample data.</p></div><div class="grid gap-4 md:grid-cols-3"><div class="rounded-xl border bg-card p-5"><p class="text-sm text-muted-foreground">Database</p><h3 class="text-xl font-bold ${status}">${esc(d.database || 'unknown')}</h3></div><div class="rounded-xl border bg-card p-5"><p class="text-sm text-muted-foreground">Active Sockets</p><h3 class="text-xl font-bold">${Number(d.activeConnections||0)}</h3></div><div class="rounded-xl border bg-card p-5"><p class="text-sm text-muted-foreground">Recent Errors</p><h3 class="text-xl font-bold">${Number(d.recentErrors||0)}</h3></div></div><div class="rounded-xl border bg-card p-5"><h3 class="font-semibold mb-3">Latest Health Events</h3>${(d.events||[]).length ? d.events.map(e=>`<div class="border-b py-2"><p class="text-sm font-medium">${esc(e.action||e.title||'Event')}</p><p class="text-xs text-muted-foreground">${esc(e.module||'system')} • ${esc(e.createdAt ? new Date(e.createdAt).toLocaleString() : '')}</p></div>`).join('') : '<p class="text-sm text-muted-foreground">No health events recorded yet.</p>'}</div></div>`;
    } catch(e) { return `<div class="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">Failed to load platform health: ${esc(e.message)}</div>`; }
  };

  window.renderSuperAdminAlerts = async function(){
    try {
      const res = await api.superAdmin.getPlatformAlerts(); const alerts = res.data || [];
      return `<div class="space-y-6 animate-fade-in"><div><h2 class="text-2xl font-bold">Super Admin Alerts</h2><p class="text-sm text-muted-foreground">Only platform-owner alerts: approvals, payment requests, system errors, subscription/pilot actions.</p></div><div class="rounded-xl border bg-card divide-y">${alerts.length ? alerts.map(a=>`<div class="p-4"><div class="flex justify-between gap-3"><div><p class="font-medium">${esc(a.title)}</p><p class="text-sm text-muted-foreground">${esc(a.message || a.description || '')}</p><p class="text-xs text-muted-foreground mt-1">${esc(a.createdAt ? new Date(a.createdAt).toLocaleString() : '')}</p></div><span class="text-xs px-2 py-1 rounded-full bg-muted h-fit">${esc(a.severity || a.type || 'info')}</span></div></div>`).join('') : '<div class="p-8 text-center text-muted-foreground">No super admin alerts yet.</div>'}</div></div>`;
    } catch(e) { return `<div class="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">Failed to load super admin alerts: ${esc(e.message)}</div>`; }
  };

  window.v108RenderCustomSubjectModal = async function(){
    let classes=[]; try { const res=await api.admin.getClasses(); classes=res.data||[]; } catch(_){}
    const options = classes.map(c=>`<label class="flex items-center gap-2 p-2 border rounded"><input type="checkbox" class="v108-custom-subject-class" value="${c.id}" data-grade="${esc(c.grade||c.name||'')}"><span class="text-sm">${esc(c.name||c.grade||('Class '+c.id))}</span></label>`).join('') || '<p class="text-sm text-muted-foreground">Create classes first.</p>';
    const html = `<div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" id="v108-custom-subject-modal"><div class="bg-background rounded-xl shadow-xl max-w-2xl w-full p-6 space-y-4"><div class="flex justify-between"><h3 class="text-xl font-bold">Add Custom Subject</h3><button onclick="document.getElementById('v108-custom-subject-modal').remove()" class="text-muted-foreground">✕</button></div><div class="grid md:grid-cols-2 gap-3"><input id="v108-custom-subject-name" class="border rounded px-3 py-2" placeholder="Subject name e.g. Robotics"><input id="v108-custom-subject-code" class="border rounded px-3 py-2" placeholder="Code optional"></div><div class="grid md:grid-cols-3 gap-3"><select id="v108-custom-subject-category" class="border rounded px-3 py-2"><option value="custom">Custom</option><option value="technical">Technical</option><option value="creative">Creative</option><option value="language">Language</option><option value="club">Club/Activity</option></select><select id="v108-custom-subject-counts" class="border rounded px-3 py-2"><option value="true">Counts in final</option><option value="false">Not counted</option></select><select id="v108-custom-subject-teacher" class="border rounded px-3 py-2"><option value="true">Requires teacher</option><option value="false">No teacher required</option></select></div><div><p class="text-sm font-medium mb-2">Classes doing this subject</p><div class="grid md:grid-cols-2 gap-2 max-h-64 overflow-auto">${options}</div></div><div class="flex justify-end gap-2"><button class="px-4 py-2 border rounded" onclick="document.getElementById('v108-custom-subject-modal').remove()">Cancel</button><button class="px-4 py-2 bg-primary text-primary-foreground rounded" onclick="v108SaveCustomSubject()">Save Custom Subject</button></div></div></div>`;
    document.body.insertAdjacentHTML('beforeend', html);
  };
  window.v108SaveCustomSubject = async function(){
    const name = document.getElementById('v108-custom-subject-name')?.value.trim();
    if(!name) return showToast('Subject name is required','error');
    const classes = Array.from(document.querySelectorAll('.v108-custom-subject-class:checked')).map(cb=>({ classId:Number(cb.value), grade:cb.dataset.grade }));
    if(!classes.length) return showToast('Select at least one class','error');
    showLoading();
    try{
      await api.admin.addCustomSubject({ name, code:document.getElementById('v108-custom-subject-code')?.value.trim(), category:document.getElementById('v108-custom-subject-category')?.value, classes, countsInFinalByDefault:document.getElementById('v108-custom-subject-counts')?.value==='true', requiresTeacher:document.getElementById('v108-custom-subject-teacher')?.value==='true' });
      document.getElementById('v108-custom-subject-modal')?.remove();
      showToast('✅ Custom subject saved and synced to selected classes','success');
      await showDashboardSection('custom-subjects');
    } catch(e){ showToast(e.message||'Failed to save custom subject','error'); } finally { hideLoading(); }
  };

  const original = window.renderAdminCustomSubjects;
  window.renderAdminCustomSubjects = async function(){
    let base = '';
    try { base = typeof original === 'function' ? await original() : ''; } catch(e) { base = `<div class="rounded-xl border bg-card p-6"><h2 class="text-2xl font-bold">Add Subjects</h2></div>`; }
    const button = `<div class="rounded-xl border bg-card p-5 flex justify-between items-center"><div><h3 class="font-semibold">Custom school subjects</h3><p class="text-sm text-muted-foreground">Add a real school-specific subject and choose the classes that do it.</p></div><button onclick="v108RenderCustomSubjectModal()" class="px-4 py-2 rounded-lg bg-primary text-primary-foreground">Add Custom Subject</button></div>`;
    return String(base).replace('<div class="space-y-6 animate-fade-in">', '<div class="space-y-6 animate-fade-in">'+button);
  };
})();
