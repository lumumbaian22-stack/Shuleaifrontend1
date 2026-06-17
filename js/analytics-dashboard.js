// Shule AI v151.0 Analytics UI — role-safe, real backend data, dark-mode ready
(function(){
  const chartBag = window.__shuleAnalyticsCharts || (window.__shuleAnalyticsCharts = {});
  const state = window.__shuleAnalyticsState || (window.__shuleAnalyticsState = { data:null, query:'' });

  function esc(value){
    if (typeof escapeHtml === 'function') return escapeHtml(value == null ? '' : String(value));
    return String(value == null ? '' : value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  }
  function roleKey(role){
    const raw = String(role || getCurrentUser?.()?.role || localStorage.getItem('userRole') || '').toLowerCase();
    if (raw === 'super_admin') return 'superadmin';
    return raw;
  }
  function fmtNumber(v){
    if (v === null || v === undefined || v === '') return '—';
    if (typeof v === 'string') return esc(v);
    const n = Number(v);
    if (!Number.isFinite(n)) return esc(v);
    return n.toLocaleString();
  }
  function fmtMoney(v){
    const n = Number(v || 0); return `KSh ${Math.round(n).toLocaleString()}`;
  }
  function pct(v){ return `${Number(v || 0).toFixed(Number(v || 0) % 1 ? 1 : 0)}%`; }
  function updatedAtLabel(iso){
    try { return new Date(iso || Date.now()).toLocaleString(undefined, { dateStyle:'medium', timeStyle:'short' }); } catch(_) { return 'just now'; }
  }
  function currentParams(){
    const params = new URLSearchParams();
    ['year','term','classId','childId','status'].forEach(key => {
      const el = document.querySelector(`[data-v151-filter="${key}"]`);
      if (el && el.value) params.set(key, el.value);
    });
    return params.toString();
  }
  function destroyChart(id){
    try { if (chartBag[id]) chartBag[id].destroy(); } catch(_) {}
    chartBag[id] = null;
    const c = document.getElementById(id);
    if (c && window.Chart && Chart.getChart) { const existing = Chart.getChart(c); if (existing) existing.destroy(); }
  }
  function cssVar(name, fallback){
    try { return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback; } catch(_) { return fallback; }
  }
  function chartColors(){
    return {
      teal: cssVar('--shule-chart-teal', '#11B5B1'),
      blue: cssVar('--shule-chart-blue', '#2F80ED'),
      green: cssVar('--shule-chart-green', '#22C55E'),
      orange: cssVar('--shule-chart-orange', '#F59E0B'),
      red: cssVar('--shule-chart-red', '#EF4444'),
      purple: cssVar('--shule-chart-purple', '#8B5CF6'),
      grid: cssVar('--shule-chart-grid', 'rgba(100,116,139,.18)'),
      text: cssVar('--shule-chart-text', '#475569')
    };
  }
  function renderMiniBars(containerId, labels=[], values=[]){
    const el = document.getElementById(containerId); if(!el) return;
    const max = Math.max(...values.map(Number), 1);
    el.innerHTML = labels.map((label,i)=>`<div class="v151-bar-row"><span>${esc(label)}</span><div class="v151-bar-track"><i style="width:${Math.min(100, Number(values[i]||0)/max*100)}%"></i></div><b>${fmtNumber(values[i]||0)}</b></div>`).join('') || '<p class="v151-empty">No data yet.</p>';
  }
  function makeChart(id, type, labels, values, opts={}){
    const el = document.getElementById(id); if(!el) return;
    if (!window.Chart) { renderMiniBars(`${id}-fallback`, labels, values); return; }
    destroyChart(id);
    const colors = chartColors();
    const palette = [colors.teal, colors.green, colors.orange, colors.blue, colors.purple, colors.red];
    const common = {
      responsive:true,
      maintainAspectRatio:false,
      plugins:{ legend:{ display: opts.legend !== false, position:'right', labels:{ color:colors.text, usePointStyle:true, boxWidth:8 } }, tooltip:{ callbacks:{ label:(ctx)=>`${ctx.label || ctx.dataset.label || ''}: ${fmtNumber(ctx.parsed?.y ?? ctx.parsed ?? ctx.raw)}` } } },
      scales: type === 'doughnut' ? undefined : { x:{ grid:{ display:false }, ticks:{ color:colors.text } }, y:{ beginAtZero:true, max:opts.max, grid:{ color:colors.grid }, ticks:{ color:colors.text } } }
    };
    const dataset = type === 'doughnut'
      ? { data: values || [], backgroundColor: palette, borderWidth: 0, cutout: opts.cutout || '68%' }
      : { label: opts.label || 'Value', data: values || [], borderColor: opts.color || colors.teal, backgroundColor: type === 'line' ? 'rgba(17,181,177,.16)' : (opts.barColor || colors.teal), borderWidth: 3, fill: type === 'line', tension:.38, pointRadius:4, borderRadius: type === 'bar' ? 8 : 0 };
    chartBag[id] = new Chart(el, { type, data:{ labels: labels || [], datasets:[dataset] }, options: common });
  }

  async function fetchAnalytics(role){
    const query = state.query || currentParams();
    const suffix = query ? `?${query}` : '';
    const res = await apiRequest(`/api/analytics/dashboard${suffix}`);
    const data = res.data || {};
    state.data = data;
    return data;
  }

  function filterBar(role, data){
    const r = roleKey(role);
    const year = data.filters?.year || new Date().getFullYear();
    const term = data.filters?.term || '';
    const classes = data.filters?.classes || [];
    const children = (window.dashboardData?.children || []).map(c => ({ id:c.id, name:c.name || c.User?.name || c.studentName || `Child ${c.id}` }));
    return `<div class="v151-filterbar">
      ${r !== 'parent' && r !== 'student' ? `<label>Year<select data-v151-filter="year"><option value="${esc(year)}">${esc(year)}</option><option value="${new Date().getFullYear()}">${new Date().getFullYear()}</option></select></label>` : `<label>Year<select data-v151-filter="year"><option value="${esc(year)}">${esc(year)}</option></select></label>`}
      <label>Term<select data-v151-filter="term"><option value="">All Terms</option>${['Term 1','Term 2','Term 3'].map(t=>`<option ${term===t?'selected':''}>${t}</option>`).join('')}</select></label>
      ${r === 'teacher' ? `<label>Class<select data-v151-filter="classId"><option value="">All Assigned Classes</option>${classes.map(c=>`<option value="${esc(c.id)}">${esc(c.name)}${c.stream?' · '+esc(c.stream):''}</option>`).join('')}</select></label>` : ''}
      ${r === 'parent' && children.length ? `<label>Child<select data-v151-filter="childId">${children.map(c=>`<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('')}</select></label>` : ''}
      ${r === 'admin' || r === 'finance_officer' ? `<label>${r==='finance_officer'?'Payment Status':'Class Scope'}<select data-v151-filter="status"><option value="">${r==='finance_officer'?'All Statuses':'All Classes'}</option></select></label>` : ''}
      <button class="v151-export" onclick="window.v151ExportAnalytics()"><i data-lucide="download"></i><span>${r === 'parent' ? 'Download Report' : 'Export'}</span></button>
    </div>`;
  }
  function header(role, data){
    return `<div class="v151-head">
      <div class="v151-title"><div class="v151-title-icon"><i data-lucide="trending-up"></i></div><div><h2>${esc(data.title || 'Analytics')}</h2><p>${esc(data.subtitle || 'Real-time dashboard analytics')}</p></div></div>
      ${filterBar(role, data)}
    </div>`;
  }
  function kpiCards(data){
    const cards = data.kpis || [];
    return `<div class="v151-kpis">${cards.map(c=>`<article class="v151-kpi v151-tone-${esc(c.tone||'teal')}"><div class="v151-kpi-icon"><i data-lucide="${esc(c.icon||'activity')}"></i></div><div><p>${esc(c.label)}</p><h3>${fmtNumber(c.value)}</h3>${c.hint||c.sub?`<small>${esc(c.hint||c.sub)}</small>`:''}</div></article>`).join('')}</div>`;
  }
  function card(title, body, cls='') { return `<section class="v151-card ${cls}"><div class="v151-card-head"><h3>${esc(title)}</h3></div>${body}</section>`; }
  function insightList(items=[]){
    if(!items.length) return '<p class="v151-empty">No insights yet.</p>';
    return `<div class="v151-insights">${items.slice(0,5).map(x=>`<div class="v151-insight v151-tone-${esc(x.tone||x.severity||'info')}"><span><i data-lucide="${esc(x.icon||'info')}"></i></span><div><b>${esc(x.title)}</b><p>${esc(x.message)}</p></div><time>${esc(x.time||'now')}</time></div>`).join('')}</div>`;
  }
  function progressRows(rows=[], valueKey='value'){
    if(!rows.length) return '<p class="v151-empty">No data yet.</p>';
    return `<div class="v151-progress-list">${rows.map((r,i)=>`<div class="v151-progress-row"><span>${i+1}. ${esc(r.name || r.className || r.subject || 'Item')}</span><div class="v151-bar-track"><i style="width:${Math.min(100, Number(r[valueKey] || r.average || r.score || 0))}%"></i></div><b>${fmtNumber(r[valueKey] || r.average || r.score || 0)}${Number(r[valueKey] || r.average || r.score || 0) <= 100 ? '%' : ''}</b></div>`).join('')}</div>`;
  }
  function tableRows(rows=[], columns=[]){
    if(!rows.length) return '<p class="v151-empty">No records yet.</p>';
    return `<div class="v151-table-wrap"><table class="v151-table"><thead><tr>${columns.map(c=>`<th>${esc(c.label)}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${columns.map(c=>`<td>${c.render ? c.render(row) : esc(row[c.key] ?? '—')}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  }
  function renderSchool(data){
    setTimeout(()=>{
      makeChart('v151-attendance','line',data.charts?.attendanceTrend?.labels,data.charts?.attendanceTrend?.values,{label:'Attendance %',legend:false,max:100});
      makeChart('v151-classperf','bar',data.charts?.classPerformance?.labels,data.charts?.classPerformance?.values,{label:'Average %',legend:false,max:100});
      makeChart('v151-fee','doughnut',data.charts?.feeSplit?.labels,data.charts?.feeSplit?.values,{legend:true});
    },80);
    const subjectRows = (data.charts?.subjectPerformance?.labels || []).map((x, i) => ({ name: x, value: (data.charts?.subjectPerformance?.values || [])[i] }));
    return `<div class="v151-grid-main">
      ${card('Attendance Trend (by Month)', '<div class="v151-chart"><canvas id="v151-attendance"></canvas></div><p class="v151-footnote">Overall attendance is calculated from real attendance records.</p>')}
      ${card('Performance by Class (Average Score %)', '<div class="v151-chart"><canvas id="v151-classperf"></canvas></div><p class="v151-footnote">Class averages use scoped academic records only.</p>')}
      ${card('Fee Collection Split', '<div class="v151-chart doughnut"><canvas id="v151-fee"></canvas></div><p class="v151-footnote">Collection rate is '+pct(data.finance?.collectionRate)+'.</p>')}
      ${card('Subject Performance Overview', progressRows(subjectRows))}
      ${card('Top & At-Risk Classes', `<div class="v151-split"><div><h4>Top Performing Classes</h4>${progressRows(data.lists?.topClasses||[])}</div><div><h4>At-Risk Classes</h4>${progressRows(data.lists?.atRiskClasses||[])}</div></div>`)}
      ${card('Recent Alerts & Insights', insightList(data.lists?.insights||[]))}
    </div>`;
  }
  function renderPlatform(data){
    setTimeout(()=>{
      makeChart('v151-growth','line',data.charts?.growth?.labels,data.charts?.growth?.values,{label:'Schools',legend:false});
      makeChart('v151-plans','doughnut',data.charts?.planDistribution?.labels,data.charts?.planDistribution?.values,{legend:true});
      makeChart('v151-engagement','bar',data.charts?.engagement?.labels,data.charts?.engagement?.values,{label:'Engagement %',legend:false,max:100});
    },80);
    const geoRows = (data.charts?.geographic?.labels || []).map((x, i) => ({ name: x, value: (data.charts?.geographic?.values || [])[i] }));
    return `<div class="v151-grid-main">
      ${card('School Growth Trend (by Month)', '<div class="v151-chart"><canvas id="v151-growth"></canvas></div>')}
      ${card('Subscription Plan Distribution', '<div class="v151-chart doughnut"><canvas id="v151-plans"></canvas></div>')}
      ${card('Platform Engagement by Role', '<div class="v151-chart"><canvas id="v151-engagement"></canvas></div>')}
      ${card('Top-Performing Schools', tableRows(data.lists?.topSchools||[], [{label:'#',key:'rank'}, {label:'School',key:'name'}, {label:'Location',key:'location'}, {label:'Engagement',render:r=>`${fmtNumber(r.score)}%`}]))}
      ${card('School Health Overview', insightList(data.lists?.insights||[]))}
      ${card('Geographic Spread', progressRows(geoRows))}
    </div>`;
  }
  function renderTeacher(data){
    setTimeout(()=>{
      makeChart('v151-teacher-att','line',data.charts?.attendanceTrend?.labels,data.charts?.attendanceTrend?.values,{label:'Attendance %',legend:false,max:100});
      makeChart('v151-teacher-sub','line',data.charts?.subjectPerformance?.labels,data.charts?.subjectPerformance?.values,{label:'Average %',legend:true,max:100});
      makeChart('v151-teacher-home','doughnut',data.charts?.homeworkSplit?.labels,data.charts?.homeworkSplit?.values,{legend:true});
    },80);
    return `<div class="v151-grid-main v151-teacher-layout">
      ${card('Attendance Trend (by Week)', '<div class="v151-chart"><canvas id="v151-teacher-att"></canvas></div>')}
      ${card('Subject Performance Trend (Average Score %)', '<div class="v151-chart"><canvas id="v151-teacher-sub"></canvas></div>')}
      ${card('Homework Completion', '<div class="v151-chart doughnut"><canvas id="v151-teacher-home"></canvas></div>')}
      ${card('Top-Performing Students (Average Score %)', progressRows(data.lists?.topStudents||[], 'average'))}
      ${card('Learners Needing Support', tableRows(data.lists?.riskStudents||[], [{label:'Student',key:'name'}, {label:'Avg Score',render:r=>`<span class="v151-pill red">${fmtNumber(r.average)}%</span>`}]))}
      ${card('Recent Insights', insightList(data.lists?.insights||[]))}
    </div>`;
  }
  function renderFinance(data){
    setTimeout(()=>{
      makeChart('v151-fin-trend','line',data.charts?.collectionTrend?.labels,data.charts?.collectionTrend?.values,{label:'Collected KSh',legend:false});
      makeChart('v151-fin-split','doughnut',data.charts?.feeSplit?.labels,data.charts?.feeSplit?.values,{legend:true});
      makeChart('v151-fin-method','doughnut',data.charts?.paymentMethods?.labels,data.charts?.paymentMethods?.values,{legend:true});
    },80);
    return `<div class="v151-grid-main">
      ${card('Collection Trend (by Month)', '<div class="v151-chart"><canvas id="v151-fin-trend"></canvas></div>')}
      ${card('Paid vs Outstanding Fee Split', '<div class="v151-chart doughnut"><canvas id="v151-fin-split"></canvas></div>')}
      ${card('Top Debtor Classes', tableRows(data.lists?.debtorClasses||[], [{label:'Class',key:'className'}, {label:'Outstanding',render:r=>`<span class="v151-danger">${fmtMoney(r.outstanding)}</span>`}, {label:'Students',key:'students'}]))}
      ${card('Payment Method Breakdown', '<div class="v151-chart doughnut"><canvas id="v151-fin-method"></canvas></div>')}
      ${card('Fee Performance by Class', tableRows(data.lists?.classCollection||[], [{label:'Class',key:'className'}, {label:'Expected',render:r=>fmtMoney(r.expected)}, {label:'Collected',render:r=>fmtMoney(r.paid)}]))}
      ${card('Recent Finance Alerts', insightList(data.lists?.insights||[]))}
    </div>`;
  }
  function renderChildStudent(data){
    const isChild = data.variant === 'child';
    setTimeout(()=>{
      makeChart('v151-child-perf','line',data.charts?.performanceTrend?.labels,data.charts?.performanceTrend?.values,{label:'Average %',legend:false,max:100});
      makeChart('v151-child-att','line',data.charts?.attendanceTrend?.labels,data.charts?.attendanceTrend?.values,{label:'Attendance %',legend:false,max:100});
      makeChart('v151-child-strength','doughnut',data.charts?.strengthsSplit?.labels,data.charts?.strengthsSplit?.values,{legend:true});
    },80);
    return `<div class="v151-grid-main">
      ${card(isChild?'Performance Trend by Subject (Average Score %)':'Subject Performance Trend (Average Score %)', '<div class="v151-chart"><canvas id="v151-child-perf"></canvas></div>')}
      ${card('Attendance Trend', '<div class="v151-chart"><canvas id="v151-child-att"></canvas></div>')}
      ${card('Strengths vs Needs Support', '<div class="v151-chart doughnut"><canvas id="v151-child-strength"></canvas></div>')}
      ${card(isChild?'Recent Report Card Summary':'Class Leaderboard (Top 5)', tableRows(data.lists?.subjectPerformance||[], [{label:'Subject',key:'subject'}, {label:'Score',render:r=>`${fmtNumber(r.average||r.score)}%`}, {label:'Grade',render:r=>r.grade || (Number(r.average||r.score)>=80?'A':Number(r.average||r.score)>=70?'B':Number(r.average||r.score)>=60?'C':'') }]))}
      ${card(isChild?'Recommendations':'Today’s Learning Tasks', insightList(data.lists?.recommendations||data.lists?.insights||[]))}
      ${card(isChild?'Recent Child Alerts':'Personalized Insights', insightList(data.lists?.insights||[]))}
    </div>`;
  }
  function bodyFor(role, data){
    const variant = data.variant || roleKey(role);
    if (variant === 'platform') return renderPlatform(data);
    if (variant === 'school') return renderSchool(data);
    if (variant === 'finance') return renderFinance(data);
    if (variant === 'class') return renderTeacher(data);
    if (variant === 'child' || variant === 'student') return renderChildStudent(data);
    return renderSchool(data);
  }

  async function renderAnalyticsSection(role){
    if (typeof showLoading === 'function') showLoading();
    try {
      const data = await fetchAnalytics(role);
      const html = `<div class="v151-analytics-shell animate-fade-in">${header(role, data)}${kpiCards(data)}${bodyFor(role, data)}<footer class="v151-updated">All data is updated as of ${esc(updatedAtLabel(data.updatedAt))} <button onclick="showDashboardSection('analytics')"><i data-lucide="refresh-cw"></i></button></footer></div>`;
      setTimeout(()=>{ try { lucide?.createIcons?.(); } catch(_) {} }, 20);
      return html;
    } catch (error) {
      console.error('v151 analytics load failed:', error);
      return `<div class="rounded-2xl border bg-card p-8 text-center"><h2 class="text-xl font-bold text-red-600">Analytics could not load</h2><p class="mt-2 text-muted-foreground">${esc(error.message || 'Unknown error')}</p><button class="mt-4 v151-export" onclick="showDashboardSection('analytics')">Retry</button></div>`;
    } finally {
      if (typeof hideLoading === 'function') hideLoading();
    }
  }

  async function applyAnalyticsFilters(){
    state.query = currentParams();
    await showDashboardSection('analytics');
  }
  function exportAnalytics(){
    const data = state.data || {};
    const blob = new Blob([JSON.stringify(data, null, 2)], { type:'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `shule-ai-${data.variant || 'analytics'}-${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(link); link.click(); link.remove(); setTimeout(()=>URL.revokeObjectURL(link.href), 1000);
  }
  document.addEventListener('change', e => { if (e.target?.matches?.('[data-v151-filter]')) applyAnalyticsFilters(); });
  try {
    const rerenderOnTheme = () => {
      if (document.querySelector('.v151-analytics-shell') && typeof showDashboardSection === 'function') {
        clearTimeout(window.__v151ThemeRefreshTimer);
        window.__v151ThemeRefreshTimer = setTimeout(() => showDashboardSection('analytics'), 120);
      }
    };
    new MutationObserver(rerenderOnTheme).observe(document.documentElement, { attributes:true, attributeFilter:['class','data-theme'] });
  } catch (_) {}
  window.renderAnalyticsSection = renderAnalyticsSection;
  window.v151ExportAnalytics = exportAnalytics;
})();
