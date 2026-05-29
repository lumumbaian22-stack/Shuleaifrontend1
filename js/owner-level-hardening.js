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
    const selectedChild = localStorage.getItem('shule_selected_child_id') || window.dashboardData?.selectedChildId || '';
    const res = await apiRequest(`/api/owner/analytics/overview${selectedChild ? `?studentId=${encodeURIComponent(selectedChild)}` : ''}`);
    const data = res || {};
    const ov = data.overview || {};
    const charts = data.charts || {};
    const chartIds = [];
    const chartList = [
      ['enrollmentTrend','Enrollment Trend','Smooth growth chart from real student records'],
      ['gradeDistribution','Grade / Class Distribution','Doughnut style from the approved visual HTML'],
      ['monthlyAttendanceTrend','Monthly Attendance Trends','Stacked present vs absent trend'],
      ['performanceRadar','Grade Performance Distribution','Radar view of subject strength'],
      ['subjectPerformance','Subject-wise Performance','Multi-color subject performance bars'],
      ['feeStatus','Fee Status Distribution','Paid, partial and unpaid fee accounts'],
      ['homeworkSubmission','Homework Submission Pattern','On-time vs late or pending submissions'],
      ['aiTutorUsage','AI Tutor Usage','Student AI tutor activity'],
      ['careerDistribution','Career Interest Distribution','Career selections and guidance interests']
    ].filter(([key]) => charts[key]);
    const cards = chartList.map(([key,title,subtitle], idx) => { const id = `owner-chart-${key}`; chartIds.push([id, charts[key]]); return chartCard(id,title,subtitle); }).join('');
    setTimeout(()=>chartIds.forEach(([id,ch])=>renderChart(id,ch)), 120);
    return `<div class="owner-analytics space-y-6 animate-fade-in">
      <div class="flex flex-wrap items-center justify-between gap-3"><div><h2 class="text-2xl font-bold">Shule AI Intelligence Analytics</h2><p class="text-muted-foreground">Real backend data • ${escape(role)} view • ${escape(new Date(data.generatedAt || Date.now()).toLocaleString())}</p></div><span class="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs">Tenant scoped</span></div>
      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-5">${statCard('Students', ov.totalStudents)}${statCard('Teachers', ov.totalTeachers)}${statCard('Classes', ov.totalClasses)}${statCard('Attendance', `${ov.attendanceRate || 0}%`)}${statCard('Fee Collection', `${ov.feeCollectionRate || 0}%`)}</div>
      <div class="grid gap-4 lg:grid-cols-2">${cards}</div>
      <div class="grid gap-4 lg:grid-cols-2">${tableCard('AI + Parent Comfort Signals', ['Parents see reassuring updates like child attendance, payment receipt and progress improvements.', 'AI tutor usage and career insights are tracked without mixing siblings or schools.', 'Failed AI calls should not deduct student usage.'])}${tableCard('School Intelligence Signals', ['Fees, attendance, homework, subjects, alerts and career interests are combined into one analytics layer.', 'Super Admin may see all-school aggregation; other roles stay restricted by school, class, parent-child or student ownership.', 'Charts use real backend data and the visual style from the approved HTML.'])}</div>
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
    return `<div class="space-y-6 animate-fade-in"><div><h2 class="text-2xl font-bold">School Branding</h2><p class="text-muted-foreground">Control school identity across sidebar, reports and parent payment messages.</p></div><form onsubmit="return window.saveOwnerBranding(event)" class="rounded-xl border bg-card p-6 space-y-4"><div class="grid gap-4 md:grid-cols-2"><label class="block"><span class="text-sm font-medium">Primary color</span><input name="primaryColor" value="${escape(b.primaryColor || '#083A85')}" class="mt-1 w-full rounded-lg border bg-background p-3"></label><label class="block"><span class="text-sm font-medium">Accent color</span><input name="accentColor" value="${escape(b.accentColor || '#11B5B1')}" class="mt-1 w-full rounded-lg border bg-background p-3"></label></div><label class="block"><span class="text-sm font-medium">Logo URL</span><input name="logo" value="${escape(b.logo || '')}" class="mt-1 w-full rounded-lg border bg-background p-3"></label><label class="block"><span class="text-sm font-medium">Custom payment instructions</span><textarea name="paymentInstructions" class="mt-1 w-full rounded-lg border bg-background p-3 min-h-[100px]">${escape(b.paymentInstructions || '')}</textarea></label><label class="block"><span class="text-sm font-medium">Report card footer</span><textarea name="reportFooter" class="mt-1 w-full rounded-lg border bg-background p-3 min-h-[80px]">${escape(b.reportFooter || '')}</textarea></label><button class="px-4 py-2 rounded-lg bg-primary text-white">Save Branding</button></form></div>`;
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
    const fd = new FormData(event.target); const payload = Object.fromEntries(fd.entries());
    try { await apiRequest('/api/owner/branding', { method:'PUT', body: JSON.stringify(payload) }); showToast?.('School branding updated', 'success'); }
    catch(e){ showToast?.(e.message || 'Branding update failed', 'error'); }
    return false;
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
        if (section === 'agent-toolkit') return renderAgentToolkit();
        if (section === 'school-branding') return renderSchoolBranding();
        if (section === 'admin-health') return renderHealth();
        if (section === 'demo-school') return renderDemoSchool();
        return original.apply(this, arguments);
      };
      wrapped.__ownerWrapped = true;
      w.renderDashboardSection = wrapped;
    }
  }, 0);

  w.addEventListener('resize', () => { Object.values(chartStore).forEach(ch => { try { ch.resize(); } catch(_){} }); });
  const oldToggleTheme = w.toggleTheme;
  if (typeof oldToggleTheme === 'function') {
    w.toggleTheme = function(){ const out = oldToggleTheme.apply(this, arguments); setTimeout(()=>Object.values(chartStore).forEach(ch=>{ try { ch.destroy(); } catch(_){} }), 50); setTimeout(()=>{ if (w.currentSection === 'analytics' && typeof w.showDashboardSection === 'function') w.showDashboardSection('analytics'); }, 80); return out; };
  }
})();
