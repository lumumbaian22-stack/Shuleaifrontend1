(function(){
  'use strict';
  const w = window;
  const chartStore = w.__shuleOwnerCharts = w.__shuleOwnerCharts || {};
  const originalRenderDashboardSection = w.renderDashboardSection;

  function escape(v){
    if (typeof w.escapeHtml === 'function') return w.escapeHtml(v);
    return String(v ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  }
  function currentRole(){
    try { return (typeof w.getCurrentUser === 'function' ? w.getCurrentUser()?.role : null) || localStorage.getItem('userRole') || JSON.parse(localStorage.getItem('user')||'{}').role || 'student'; } catch(_){ return 'student'; }
  }
  function chartTheme(){
    const dark = document.documentElement.classList.contains('dark');
    return {
      gridColor: dark ? 'rgba(255,255,255,0.10)' : 'rgba(15,23,42,0.06)',
      textColor: dark ? '#cbd5e1' : '#64748b',
      cardText: dark ? '#f8fafc' : '#0f172a'
    };
  }
  function destroyChart(id){ if (chartStore[id]) { try { chartStore[id].destroy(); } catch(_){} delete chartStore[id]; } }
  function colorSet(){ return ['#3b82f6','#11B5B1','#8b5cf6','#f59e0b','#ef4444','#22c55e','#06b6d4','#ec4899','#64748b','#84cc16']; }
  function chartOptions(type, extra){
    const t = chartTheme();
    const common = {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 650, easing: 'easeOutQuart' },
      plugins: { legend: { position: 'bottom', labels: { color: t.textColor, usePointStyle: true, padding: 14 } }, tooltip: { mode: 'index', intersect: false } }
    };
    if (type === 'doughnut') return { ...common, cutout: extra?.cutout || '70%' };
    if (type === 'radar') return { ...common, scales: { r: { beginAtZero: true, max: 100, ticks: { stepSize: 20, color: t.textColor, backdropColor: 'transparent' }, grid: { color: t.gridColor }, angleLines: { color: t.gridColor }, pointLabels: { color: t.textColor } } } };
    return { ...common, scales: { x: { ticks: { color: t.textColor }, grid: { color: 'transparent' }, stacked: type === 'stackedBar' }, y: { beginAtZero: true, ticks: { color: t.textColor }, grid: { color: t.gridColor }, stacked: type === 'stackedBar' } } };
  }
  function normalizeChartPayload(ch){
    const ds = Array.isArray(ch?.datasets) ? ch.datasets : [];
    const colors = colorSet();
    return {
      labels: Array.isArray(ch?.labels) ? ch.labels : [],
      datasets: ds.map((d, i) => ({
        label: d.label || ch.title || 'Data',
        data: Array.isArray(d.data) ? d.data.map(Number) : [],
        borderColor: d.borderColor || colors[i % colors.length],
        backgroundColor: ch?.type === 'line' ? 'rgba(59,130,246,0.12)' : (ch?.type === 'doughnut' || ch?.type === 'bar' ? colors : (d.backgroundColor || colors[i % colors.length] + '33')),
        fill: ch?.type === 'line',
        tension: 0.4,
        borderWidth: 2,
        borderRadius: ch?.type === 'bar' || ch?.type === 'stackedBar' ? 6 : 0,
        pointBackgroundColor: d.pointBackgroundColor || colors[i % colors.length]
      }))
    };
  }
  function renderChart(id, ch){
    const canvas = document.getElementById(id);
    if (!canvas || typeof Chart === 'undefined') return;
    destroyChart(id);
    const type = ch.type === 'stackedBar' ? 'bar' : ch.type;
    chartStore[id] = new Chart(canvas, { type, data: normalizeChartPayload(ch), options: chartOptions(ch.type, ch) });
  }
  function statCard(label, value, note){
    return `<div class="owner-stat-card rounded-xl border bg-card p-4 card-hover"><p class="text-xs uppercase tracking-wide text-muted-foreground">${escape(label)}</p><h3 class="text-2xl font-bold mt-1">${escape(value ?? 0)}</h3>${note ? `<p class="text-xs text-muted-foreground mt-1">${escape(note)}</p>` : ''}</div>`;
  }
  function chartCard(id, title, subtitle){
    return `<div class="owner-chart-card rounded-xl border bg-card p-6"><div class="flex items-start justify-between gap-3 mb-4"><div><h3 class="font-semibold">${escape(title)}</h3>${subtitle?`<p class="text-xs text-muted-foreground mt-1">${escape(subtitle)}</p>`:''}</div><span class="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">Live</span></div><div class="owner-chart-container chart-container"><canvas id="${id}"></canvas></div></div>`;
  }
  function tableCard(title, rows){
    return `<div class="rounded-xl border bg-card p-6"><h3 class="font-semibold mb-3">${escape(title)}</h3><div class="space-y-2">${rows.map(r=>`<div class="flex items-start gap-3 rounded-lg bg-muted/40 p-3"><span class="mt-1 h-2 w-2 rounded-full bg-primary"></span><p class="text-sm">${escape(r)}</p></div>`).join('')}</div></div>`;
  }
  async function ownerAnalyticsHTML(role){
    const selectedChild = window.dashboardData?.selectedChildId || localStorage.getItem('shule_selected_child_id') || '';
    const params = new URLSearchParams();
    if (selectedChild && String(role).toLowerCase() === 'parent') params.set('studentId', selectedChild);
    params.set('_ts', Date.now());
    const res = await apiRequest(`/api/owner/analytics/overview?${params.toString()}`);
    const data = res || {};
    const ov = data.overview || {};
    const charts = data.charts || {};
    const chartIds = [];
    const chartSets = {
      super_admin: [
        ['enrollmentTrend','School/Enrollment Growth','All-school growth trend'], ['gradeDistribution','School / Grade Distribution','Distribution across the platform'], ['feeStatus','Subscription/Fee Status','Platform payment coverage'], ['aiTutorUsage','AI Usage by School','AI activity overview'], ['careerDistribution','Career Interest Distribution','Student career demand signals']
      ],
      admin: [
        ['enrollmentTrend','Enrollment Trend','Students in this school over time'], ['gradeDistribution','Grade / Class Distribution','This school only'], ['monthlyAttendanceTrend','Monthly Attendance Trends','Present vs absent'], ['subjectPerformance','Subject-wise Performance','School academic performance'], ['performanceRadar','Performance Distribution','Academic strength shape'], ['feeStatus','Fee Status Distribution','Paid, partial and unpaid accounts'], ['homeworkSubmission','Homework Submission Pattern','On-time vs late/pending'], ['careerDistribution','Career Interest Distribution','Career choices in this school']
      ],
      teacher: [
        ['monthlyAttendanceTrend','My Class Attendance Trends','Assigned classes only'], ['subjectPerformance','Subject Averages','Subjects/classes assigned to this teacher'], ['performanceRadar','Class Performance Distribution','Academic shape for assigned learners'], ['homeworkSubmission','Homework Submission Pattern','Assigned class submissions'], ['careerDistribution','Career Interests in My Classes','Only learners this teacher supports']
      ],
      parent: [
        ['performanceRadar','Child Subject Strengths','Selected child only'], ['subjectPerformance','Child Subject Performance','Selected child only'], ['monthlyAttendanceTrend','Child Attendance Trend','Selected child attendance'], ['feeStatus','Child Fee Status','Selected child fee account'], ['homeworkSubmission','Child Homework Pattern','Selected child only'], ['aiTutorUsage','Child AI Tutor Usage','Selected child subscription usage'], ['careerDistribution','Child Career Interests','Selected child only']
      ],
      student: [
        ['performanceRadar','My Subject Strengths','My learning profile'], ['subjectPerformance','My Subject Performance','My scores only'], ['monthlyAttendanceTrend','My Attendance Trend','My attendance only'], ['homeworkSubmission','My Homework Pattern','My submissions'], ['aiTutorUsage','My AI Tutor Usage','My subscription usage'], ['careerDistribution','My Career Interests','My selected careers']
      ]
    };
    const effectiveRole = role === 'superadmin' ? 'super_admin' : role;
    const chartList = (chartSets[effectiveRole] || chartSets.student).filter(([key]) => charts[key]);
    const cards = chartList.map(([key,title,subtitle], idx) => { const id = `owner-chart-${key}`; chartIds.push([id, charts[key]]); return chartCard(id,title,subtitle); }).join('');
    setTimeout(()=>chartIds.forEach(([id,ch])=>renderChart(id,ch)), 120);
    return `<div class="owner-analytics space-y-6 animate-fade-in">
      <div class="flex flex-wrap items-center justify-between gap-3"><div><h2 class="text-2xl font-bold">${escape((role||'student').replace('_',' ').toUpperCase())} Analytics</h2><p class="text-muted-foreground">Real backend data • ${escape(JSON.stringify(data.scope || {}))} • ${escape(new Date(data.generatedAt || Date.now()).toLocaleString())}</p></div><span class="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs">Role scoped</span></div>
      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-5">${statCard('Students', ov.totalStudents)}${statCard('Teachers', ov.totalTeachers)}${statCard('Classes', ov.totalClasses)}${statCard('Attendance', `${ov.attendanceRate || 0}%`)}${statCard('Fee Collection', `${ov.feeCollectionRate || 0}%`)}</div>
      <div class="grid gap-4 lg:grid-cols-2">${cards}</div>
      <div class="rounded-xl border bg-card p-4 text-sm text-muted-foreground">
        <strong class="text-foreground">Data scope:</strong> ${escape(JSON.stringify(data.scope || {}))}. These charts are fetched from the backend for the current role/session and refresh when the Analytics section is opened or refreshed.
      </div>
    </div>`;
  }

  const previousRenderAnalyticsSection = w.renderAnalyticsSection;
  w.renderAnalyticsSection = async function(role){
    try { return await ownerAnalyticsHTML(role || currentRole()); }
    catch (error) {
      console.warn('[Owner Analytics] falling back to existing analytics:', error.message);
      if (typeof previousRenderAnalyticsSection === 'function') return previousRenderAnalyticsSection(role || currentRole());
      return `<div class="p-6 text-red-600">Analytics unavailable: ${escape(error.message)}</div>`;
    }
  };

  async function renderAgentToolkit(){
    let data = null;
    try { data = (await apiRequest('/api/owner/agent-toolkit')).data; } catch(_){ data = null; }
    const pricing = data?.pricing || [];
    const faq = data?.faq || [];
    return `<div class="space-y-6 animate-fade-in"><div><h2 class="text-2xl font-bold">Agent Sales Toolkit</h2><p class="text-muted-foreground">Demo, pricing, FAQ and school pitch material for Shule AI agents.</p></div><div class="rounded-xl border bg-card p-6"><h3 class="font-semibold mb-3">Pitch Script</h3><p class="text-sm leading-6">${escape(data?.pitchScript || 'Shule AI gives schools one intelligent platform for fees, attendance, academics, communication, alerts, AI tutoring and student success.')}</p></div><div class="grid gap-4 md:grid-cols-3">${pricing.map(p=>`<div class="rounded-xl border bg-card p-5"><h3 class="font-semibold">${escape(p.name)}</h3><p class="text-xs text-muted-foreground mb-3">${escape(p.target)}</p><ul class="text-sm space-y-1">${(p.includes||[]).map(x=>`<li>• ${escape(x)}</li>`).join('')}</ul><p class="text-xs text-primary mt-3">${escape(p.note)}</p></div>`).join('')}</div><div class="rounded-xl border bg-card p-6"><h3 class="font-semibold mb-3">FAQ</h3><div class="space-y-3">${faq.map(f=>`<details class="rounded-lg border p-3"><summary class="font-medium cursor-pointer">${escape(f.q)}</summary><p class="text-sm text-muted-foreground mt-2">${escape(f.a)}</p></details>`).join('')}</div></div></div>`;
  }
  async function renderSchoolBranding(){
    let b = {}; try { b = (await apiRequest('/api/owner/branding')).data || {}; } catch(_) {}
    const colors = ['Shule Blue','Royal Blue','Emerald Green','Purple','Orange','Red','Gold','Slate'];
    const currentLogo = b.logoDataUrl || b.logoUrl || b.logo || '';
    return `<div class="branding-v98 space-y-6 animate-fade-in">
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3"><div><h2 class="text-2xl font-bold">School Branding</h2><p class="text-muted-foreground">Set school name, logo, colors, report footer and parent payment instructions from one place.</p></div><span class="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary">Changes apply to this school only</span></div>
      <form onsubmit="return window.saveOwnerBranding(event)" class="rounded-xl border bg-card p-6 space-y-6">
        <section class="branding-block rounded-xl border bg-muted/20 p-4 space-y-4"><h3 class="font-semibold">1. School identity</h3><label class="block"><span class="text-sm font-medium">School display name</span><input name="schoolName" value="${escape(b.schoolName || b.name || '')}" placeholder="e.g. Green Valley Academy" class="mt-1 w-full rounded-lg border bg-background p-3"></label><p class="text-xs text-muted-foreground">This replaces the old dashboard school-name request area. It updates the sidebar, reports and school identity areas after saving.</p></section>
        <section class="branding-block rounded-xl border bg-muted/20 p-4 space-y-4"><h3 class="font-semibold">2. School logo</h3><div class="flex flex-col sm:flex-row gap-4 items-start"><div class="branding-logo-preview h-24 w-24 rounded-xl border bg-background flex items-center justify-center overflow-hidden" data-branding-logo-preview>${currentLogo ? `<img src="${escape(currentLogo)}" class="h-full w-full object-contain" onerror="this.replaceWith(document.createTextNode('Shule AI'))">` : `<span class="text-xs text-muted-foreground text-center px-2">Shule AI default logo</span>`}</div><div class="flex-1 space-y-3"><label class="block"><span class="text-sm font-medium">Upload logo file</span><input type="file" name="logoFile" accept="image/*" onchange="window.previewOwnerLogoFile && window.previewOwnerLogoFile(this)" class="mt-1 w-full rounded-lg border bg-background p-3"></label><label class="block"><span class="text-sm font-medium">Or enter logo URL</span><input name="logoUrl" value="${escape(b.logoUrl || '')}" placeholder="https://example.com/logo.png" class="mt-1 w-full rounded-lg border bg-background p-3"></label><p class="text-xs text-muted-foreground">Uploaded logos are stored inside the school branding data so they do not disappear after Render restarts. If no logo is provided, Shule AI logo is used.</p></div></div></section>
        <section class="branding-block rounded-xl border bg-muted/20 p-4 space-y-4"><h3 class="font-semibold">3. School colors</h3><label class="block"><span class="text-sm font-medium">Color theme name</span><select name="colorName" class="mt-1 w-full rounded-lg border bg-background p-3">${colors.map(c=>`<option value="${c}" ${String(b.colorName||'Shule Blue')===c?'selected':''}>${c}</option>`).join('')}</select></label><p class="text-xs text-muted-foreground">No colour codes needed. The selected color theme controls school accents like active sidebar highlights, buttons, report card header line and small dashboard highlights while keeping text readable in dark/light mode.</p></section>
        <section class="branding-block rounded-xl border bg-muted/20 p-4 space-y-4"><h3 class="font-semibold">4. Report card footer</h3><textarea name="reportFooter" class="mt-1 w-full rounded-lg border bg-background p-3 min-h-[90px]" placeholder="e.g. Discipline, Excellence and Service. Principal signature: ________">${escape(b.reportFooter || '')}</textarea><p class="text-xs text-muted-foreground">Appears at the bottom of report cards and printable report forms only.</p></section>
        <section class="branding-block rounded-xl border bg-muted/20 p-4 space-y-4"><h3 class="font-semibold">5. Parent payment instructions</h3><textarea name="paymentInstructions" class="mt-1 w-full rounded-lg border bg-background p-3 min-h-[110px]" placeholder="Tell parents how to pay fees, account reference format, bank notes, office/cash instructions...">${escape(b.paymentInstructions || '')}</textarea><p class="text-xs text-muted-foreground">Shown to parents in Pay School Fees. It should include only public information, never Daraja secrets.</p></section>
        <div class="sticky bottom-0 bg-card/95 backdrop-blur border-t pt-4 flex flex-col sm:flex-row gap-2 sm:justify-end"><button type="button" onclick="window.previewOwnerBranding && window.previewOwnerBranding(this.form)" class="px-4 py-2 rounded-lg border hover:bg-accent">Preview locally</button><button class="px-5 py-2 rounded-lg bg-primary text-white font-medium">Save Branding</button></div>
      </form>
    </div>`;
  }
  async function renderHealth(){
    const res = await apiRequest('/api/owner/health-dashboard').catch(e => ({ success:false, message:e.message, checks:{} }));
    return `<div class="space-y-6 animate-fade-in"><div><h2 class="text-2xl font-bold">Admin Health Dashboard</h2><p class="text-muted-foreground">Operational readiness snapshot.</p></div><div class="grid gap-4 md:grid-cols-3">${Object.entries(res.checks||{}).map(([k,v])=>`<div class="rounded-xl border bg-card p-5"><p class="text-sm text-muted-foreground">${escape(k)}</p><h3 class="font-semibold mt-1 ${v?.ok===false?'text-red-600':'text-green-600'}">${v?.ok===false?'Needs Attention':'OK'}</h3><pre class="text-xs whitespace-pre-wrap mt-2 text-muted-foreground">${escape(JSON.stringify(v,null,2))}</pre></div>`).join('')}</div></div>`;
  }
  async function renderDemoSchool(){
    return `<div class="space-y-6 animate-fade-in"><div><h2 class="text-2xl font-bold">Demo School Mode</h2><p class="text-muted-foreground">Create safe sample data for agent demos without using real school records.</p></div><div class="rounded-xl border bg-card p-6"><p class="text-sm mb-4">This creates a demo school with sample admin, teacher, parent, student, alerts and AI-style examples. Super Admin only.</p><button onclick="window.seedOwnerDemoSchool()" class="px-4 py-2 rounded-lg bg-primary text-white">Seed Demo School</button><div id="demo-seed-result" class="mt-4 text-sm"></div></div></div>`;
  }
  w.saveOwnerBranding = async function(event){
    event.preventDefault();
    const form = event.target;
    const fd = new FormData(form);
    const logoFile = form.querySelector('input[name="logoFile"]')?.files?.[0] || null;
    const payload = {
      schoolName: String(fd.get('schoolName') || '').trim(),
      colorName: String(fd.get('colorName') || 'Shule Blue').trim(),
      logoUrl: String(fd.get('logoUrl') || '').trim(),
      reportFooter: String(fd.get('reportFooter') || '').trim(),
      paymentInstructions: String(fd.get('paymentInstructions') || '').trim()
    };
    try {
      let response = await apiRequest('/api/owner/branding', { method:'PUT', body: JSON.stringify(payload) });
      if (logoFile) {
        const upload = new FormData();
        upload.append('logo', logoFile);
        const base = (localStorage.getItem('SHULE_API_BASE_URL') || 'https://shuleaibackend-32h1.onrender.com').replace(/\/$/, '');
        const token = localStorage.getItem('authToken') || localStorage.getItem('token') || '';
        const logoRes = await fetch(`${base}/api/owner/branding/logo`, { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {}, body: upload });
        response = await logoRes.json().catch(() => ({}));
        if (!logoRes.ok) throw new Error(response.message || 'Logo upload failed');
      }
      let branding = response.data || {};
      if (window.BrandingManager?.loadSchoolBranding) {
        branding = await window.BrandingManager.loadSchoolBranding().catch(() => branding);
      }
      localStorage.setItem('schoolBranding', JSON.stringify(branding));
      window.schoolBranding = branding;
      if (branding.schoolName || branding.name) {
        window.dispatchEvent(new CustomEvent('school-name-changed', { detail: { newName: branding.schoolName || branding.name, schoolName: branding.schoolName || branding.name } }));
      }
      window.dispatchEvent(new CustomEvent('school-branding-updated', { detail: branding }));
      if (window.BrandingManager?.apply) window.BrandingManager.apply(branding.schoolName || branding.name);
      showToast?.('School branding saved and applied', 'success');
    }
    catch(e){ showToast?.(e.message || 'Branding update failed', 'error'); }
    return false;
  };
  w.previewOwnerLogoFile = function(input){
    const file = input?.files?.[0];
    const form = input?.form;
    const preview = form?.querySelector('[data-branding-logo-preview]') || document.querySelector('[data-branding-logo-preview]');
    if (!file || !preview) return;
    if (!/^image\//.test(file.type || '')) {
      showToast?.('Please choose an image logo file.', 'error');
      input.value = '';
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showToast?.('Logo is too large. Please use an image under 2MB.', 'error');
      input.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = function(){
      const src = String(reader.result || '');
      preview.innerHTML = `<img src="${src}" class="h-full w-full object-contain" data-local-logo-preview>`;
      window.schoolBranding = { ...(window.schoolBranding || {}), logoDataUrl: src, logoUrl: '' };
      localStorage.setItem('schoolBranding', JSON.stringify(window.schoolBranding));
      window.dispatchEvent(new CustomEvent('school-branding-updated', { detail: window.schoolBranding }));
      if (window.BrandingManager?.apply) window.BrandingManager.apply();
    };
    reader.readAsDataURL(file);
  };

  w.previewOwnerBranding = function(form){
    const fd = new FormData(form);
    const localLogo = form.querySelector('[data-local-logo-preview]')?.getAttribute('src') || '';
    const branding = {
      schoolName: String(fd.get('schoolName') || '').trim(),
      colorName: String(fd.get('colorName') || 'Shule Blue').trim(),
      logoUrl: String(fd.get('logoUrl') || '').trim(),
      logoDataUrl: localLogo || (window.schoolBranding && window.schoolBranding.logoDataUrl) || '',
      reportFooter: String(fd.get('reportFooter') || '').trim(),
      paymentInstructions: String(fd.get('paymentInstructions') || '').trim()
    };
    if (branding.logoUrl) branding.logoDataUrl = '';
    window.schoolBranding = { ...(window.schoolBranding || {}), ...branding };
    localStorage.setItem('schoolBranding', JSON.stringify(window.schoolBranding));
    window.dispatchEvent(new CustomEvent('school-branding-updated', { detail: window.schoolBranding }));
    if (branding.schoolName) window.dispatchEvent(new CustomEvent('school-name-changed', { detail: { newName: branding.schoolName } }));
    showToast?.('Preview applied locally. Save to make it permanent.', 'info');
  };
  w.seedOwnerDemoSchool = async function(){
    const el = document.getElementById('demo-seed-result'); if (el) el.textContent = 'Seeding demo school...';
    try { const res = await apiRequest('/api/owner/demo-school/seed', { method:'POST', body: JSON.stringify({}) }); if (el) el.innerHTML = `<pre class="whitespace-pre-wrap">${escape(JSON.stringify(res.data,null,2))}</pre>`; showToast?.('Demo school seeded', 'success'); }
    catch(e){ if (el) el.textContent = e.message; showToast?.(e.message || 'Demo seed failed', 'error'); }
  };

  setTimeout(()=>{
    const original = w.renderDashboardSection || originalRenderDashboardSection;
    if (typeof original === 'function' && !original.__ownerWrapped) {
      const wrapped = async function(role, section){
        const __role = currentRole();
        if (section === 'agent-toolkit') return __role === 'super_admin' || __role === 'superadmin' ? renderAgentToolkit() : original.apply(this, arguments);
        if (section === 'school-branding') return renderSchoolBranding();
        if (section === 'admin-health') return __role === 'super_admin' || __role === 'superadmin' ? renderHealth() : original.apply(this, arguments);
        if (section === 'demo-school') return renderDemoSchool();
        return original.apply(this, arguments);
      };
      wrapped.__ownerWrapped = true;
      w.renderDashboardSection = wrapped;
    }
  }, 0);


  w.refreshAnalytics = async function(){
    try {
      const section = w.currentSection || localStorage.getItem('currentSection') || '';
      if (section === 'analytics' && typeof w.showDashboardSection === 'function') {
        await w.showDashboardSection('analytics');
      }
    } catch (e) { console.warn('[Owner Analytics] refresh failed:', e.message); }
  };
  ['shule:data-updated','finance:updated','attendance:updated','marks:updated','career:updated','alerts:updated'].forEach(evt => {
    w.addEventListener(evt, () => { if ((w.currentSection || localStorage.getItem('currentSection')) === 'analytics') w.refreshAnalytics(); });
  });

  w.addEventListener('resize', () => { Object.values(chartStore).forEach(ch => { try { ch.resize(); } catch(_){} }); });
  const oldToggleTheme = w.toggleTheme;
  if (typeof oldToggleTheme === 'function') {
    w.toggleTheme = function(){ const out = oldToggleTheme.apply(this, arguments); setTimeout(()=>{ if (w.currentSection === 'analytics' && typeof w.showDashboardSection === 'function') w.showDashboardSection('analytics'); }, 80); return out; };
  }
})();
