// Shule AI v151.2 Analytics — real backend data only, tenant-scoped, background refresh, PDF/XLSX/CSV/Print exports
(function(){
  'use strict';
  const chartBag = window.__shuleAnalyticsCharts || (window.__shuleAnalyticsCharts = {});
  const state = window.__shuleAnalyticsState || (window.__shuleAnalyticsState = { data:null, role:null, query:'', refreshInFlight:null, exportOpen:false, lastRenderAt:0, analyticsType:'overview' });

  function esc(value){
    if (typeof escapeHtml === 'function') return escapeHtml(value == null ? '' : String(value));
    return String(value == null ? '' : value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  }
  function roleKey(role){ const r=String(role||getCurrentUser?.()?.role||localStorage.getItem('userRole')||'').toLowerCase().replace(/-/g,'_'); return r==='super_admin'?'superadmin':r; }
  function number(v){ const n=Number(v); return Number.isFinite(n)?n:0; }
  function fmt(v){ if(v===null||v===undefined||v==='') return '—'; if(typeof v==='number') return v.toLocaleString(); return esc(v); }
  function money(v){ return `KSh ${Math.round(number(v)).toLocaleString()}`; }
  function updated(iso){ try{return new Date(iso||Date.now()).toLocaleString(undefined,{dateStyle:'medium',timeStyle:'short'});}catch(_){return 'just now';} }
  function today(){ return new Date().toISOString().slice(0,10); }
  function daysAgo(days){ const d=new Date(); d.setDate(d.getDate()-days); return d.toISOString().slice(0,10); }
  function titleize(key){ return String(key||'').replace(/^(chart:|list:)/,'').replace(/([A-Z])/g,' $1').replace(/^./,m=>m.toUpperCase()); }
  function currentRole(){ return state.role || getCurrentRole?.() || getCurrentUser?.()?.role || localStorage.getItem('userRole') || 'admin'; }

  function cssVar(name,fallback){ try{return getComputedStyle(document.documentElement).getPropertyValue(name).trim()||fallback;}catch(_){return fallback;} }
  function colors(){ return { teal:cssVar('--shule-chart-teal','#11B5B1'),blue:cssVar('--shule-chart-blue','#2F80ED'),green:cssVar('--shule-chart-green','#22C55E'),orange:cssVar('--shule-chart-orange','#F59E0B'),red:cssVar('--shule-chart-red','#EF4444'),purple:cssVar('--shule-chart-purple','#8B5CF6'),grid:cssVar('--shule-chart-grid','rgba(100,116,139,.18)'),text:cssVar('--shule-chart-text','#475569') }; }
  function destroyChart(id){ try{chartBag[id]?.destroy?.();}catch(_){} chartBag[id]=null; const c=document.getElementById(id); try{window.Chart?.getChart?.(c)?.destroy?.();}catch(_){} }
  function makeChart(id,type,labels=[],values=[],opts={}){
    const canvas=document.getElementById(id); if(!canvas) return;
    if(!window.Chart){ const fallback=document.getElementById(`${id}-fallback`); if(fallback) fallback.innerHTML=labels.map((l,i)=>`<div class="v152-bar-row"><span>${esc(l)}</span><i><b style="width:${Math.min(100,number(values[i]))}%"></b></i><strong>${fmt(values[i])}</strong></div>`).join(''); return; }
    destroyChart(id); const c=colors(); const palette=[c.teal,c.blue,c.green,c.orange,c.purple,c.red];
    const datasets=Array.isArray(values?.[0])?values.map((series,i)=>({label:opts.seriesLabels?.[i]||`Series ${i+1}`,data:series,borderColor:palette[i%palette.length],backgroundColor:`${palette[i%palette.length]}22`,borderWidth:2.5,fill:false,tension:.36,pointRadius:3})):[type==='doughnut'?{data:values,backgroundColor:palette,borderWidth:0,cutout:opts.cutout||'68%'}:{label:opts.label||'Value',data:values,borderColor:opts.color||c.teal,backgroundColor:type==='line'?`${c.teal}22`:(opts.color||c.teal),borderWidth:2.5,fill:type==='line',tension:.36,pointRadius:3,borderRadius:type==='bar'?7:0}];
    chartBag[id]=new Chart(canvas,{type,data:{labels,datasets},options:{responsive:true,maintainAspectRatio:false,animation:{duration:250},plugins:{legend:{display:opts.legend!==false,position:opts.legendPosition||'right',labels:{color:c.text,usePointStyle:true,boxWidth:8}},tooltip:{callbacks:{label:ctx=>`${ctx.dataset.label||ctx.label||''}: ${fmt(ctx.parsed?.y??ctx.parsed??ctx.raw)}`}}},scales:type==='doughnut'?undefined:{x:{grid:{display:false},ticks:{color:c.text,maxRotation:0,autoSkip:true}},y:{beginAtZero:true,max:opts.max,grid:{color:c.grid},ticks:{color:c.text}}}}});
  }
  function redrawCharts(){ const data=state.data; if(!data||!document.querySelector('.v152-shell'))return; setTimeout(()=>drawVariantCharts(data),40); }

  function paramsFromUi(){
    const params=new URLSearchParams();
    document.querySelectorAll('[data-v152-filter]').forEach(el=>{ const value=el.value; if(value!==undefined&&value!==null&&value!==''&&value!=='undefined') params.set(el.dataset.v152Filter,value); });
    return params;
  }
  function getScopeOptions(data,type){
    const o=data.options||{};
    if(type==='stream') return o.streams||[];
    if(type==='class') return o.classes||[];
    if(type==='student') return o.students||o.children||[];
    if(type==='teacher') return o.teachers||[];
    if(type==='subject') return o.subjects||[];
    return [];
  }
  function scopeTargetOptions(data,type,selected){ const items=getScopeOptions(data,type); return `<option value="">Select ${esc(type)}</option>${items.map(x=>`<option value="${esc(x.id)}" ${String(x.id)===String(selected)?'selected':''}>${esc(x.name||x.label||x.id)}${x.elimuid?` · ${esc(x.elimuid)}`:''}</option>`).join('')}`; }
  function scopeTypesFor(role,data){
    const r=roleKey(role);
    if(r==='admin') return [['school','Whole School'],['stream','Particular Stream'],['class','Particular Class'],['student','Particular Student'],['teacher','Particular Teacher'],['subject','Particular Subject']];
    if(r==='finance_officer') return [['school','Whole School Finance'],['stream','Stream'],['class','Class'],['student','Student Account']];
    if(r==='teacher') return [['class','Class Analytics'],['student','Student Analytics'],['subject','Subject Analytics']];
    if(r==='parent'||r==='student') return [['student',r==='parent'?'Linked Child':'My Analytics'],['subject','Subject']];
    return [['platform','All Schools']];
  }

  async function fetchAnalytics(){ const query=state.query||paramsFromUi().toString(); const result=await apiRequest(`/api/analytics/dashboard${query?`?${query}`:''}`); state.data=result.data||{}; return state.data; }

  function filterBar(role,data){
    const r=roleKey(role), f=data.filters||{}, scope=data.scope||{}, types=scopeTypesFor(role,data);
    const years=[new Date().getFullYear(),new Date().getFullYear()-1,new Date().getFullYear()-2];
    const selectedType=scope.type||f.scopeType||types[0]?.[0];
    const target=getScopeOptions(data,selectedType);
    return `<div class="v152-filterbar">
      ${r==='admin'?`<div class="v152-tenant"><small>Tenant Scoped</small><b>${esc(data.school?.name||'School')}</b><span>${esc(data.school?.schoolCode||data.tenantScoped||'')}</span></div>`:''}
      <label>Academic Year<select data-v152-filter="year">${years.map(y=>`<option value="${y}" ${Number(f.year)===y?'selected':''}>${y}</option>`).join('')}</select></label>
      <label>Term<select data-v152-filter="term"><option value="">All Terms</option>${['Term 1','Term 2','Term 3'].map(t=>`<option value="${t}" ${f.term===t?'selected':''}>${t}</option>`).join('')}</select></label>
      <label>Date From<input type="date" data-v152-filter="dateFrom" value="${esc(f.dateFrom||daysAgo(210))}"></label>
      <label>Date To<input type="date" data-v152-filter="dateTo" value="${esc(f.dateTo||today())}"></label>
      ${r==='parent'?`<label>Child<select data-v152-filter="childId">${(data.options?.children||[]).map(c=>`<option value="${esc(c.id)}" ${Number(c.id)===Number(data.student?.id)?'selected':''}>${esc(c.name)}</option>`).join('')}</select></label>`:''}
      ${['admin','finance_officer','teacher'].includes(r)?`<label>Analytics Scope<select data-v152-filter="scopeType" data-v152-scope-type>${types.map(([id,name])=>`<option value="${id}" ${selectedType===id?'selected':''}>${esc(name)}</option>`).join('')}</select></label>`:''}
      ${['admin','finance_officer','teacher'].includes(r)&&selectedType!=='school'&&selectedType!=='platform'?`<label>Choose ${esc(selectedType)}<select data-v152-filter="scopeId" data-v152-scope-target>${scopeTargetOptions(data,selectedType,scope.id||f.scopeId)}</select></label>`:''}
      <label>Analytics Type<select data-v152-filter="analyticsType"><option value="overview" ${(f.analyticsType||state.analyticsType)==='overview'?'selected':''}>Overview</option><option value="academic" ${(f.analyticsType||state.analyticsType)==='academic'?'selected':''}>Academic</option><option value="attendance" ${(f.analyticsType||state.analyticsType)==='attendance'?'selected':''}>Attendance</option><option value="finance" ${(f.analyticsType||state.analyticsType)==='finance'?'selected':''}>Finance</option><option value="teachers" ${(f.analyticsType||state.analyticsType)==='teachers'?'selected':''}>Teachers</option><option value="reports" ${(f.analyticsType||state.analyticsType)==='reports'?'selected':''}>Reports</option></select></label>
      <button type="button" class="v152-export-btn" onclick="window.v152OpenExport()"><i data-lucide="download"></i><span>Export</span><i data-lucide="chevron-down"></i></button>
    </div>`;
  }
  function header(role,data){ return `<header class="v152-head"><div class="v152-heading"><span><i data-lucide="trending-up"></i></span><div><h2>${esc(data.title||'Analytics')}</h2><p>${esc(data.subtitle||'Live analytics')}</p></div></div>${filterBar(role,data)}</header>`; }
  function kpis(data){ return `<div class="v152-kpis">${(data.kpis||[]).map(k=>`<article class="v152-kpi tone-${esc(k.tone||'teal')}"><span><i data-lucide="${esc(k.icon||'activity')}"></i></span><div><small>${esc(k.label)}</small><strong>${fmt(k.value)}</strong>${k.hint?`<em>${esc(k.hint)}</em>`:''}</div></article>`).join('')}</div>`; }
  function categoryForTitle(title){const t=String(title||'').toLowerCase();if(/attendance|present|absent/.test(t))return'attendance';if(/fee|finance|collection|payment|defaulter|expense|bursary|credit|reconciliation|arrears|revenue/.test(t))return'finance';if(/teacher|staff/.test(t))return'teachers';if(/report|marks|publication|readiness/.test(t))return'reports';if(/class|subject|student|assessment|performance|mastery|leaderboard|learning|homework|task|badge|achievement|strength|support/.test(t))return'academic';return'overview';}
  function card(title,body,cls='',action=''){ return `<section class="v152-card ${cls}" data-analytics-category="${categoryForTitle(title)}"><header><h3>${esc(title)}</h3>${action?`<button type="button">${esc(action)}</button>`:''}</header>${body}</section>`; }
  function empty(message='No real data is available for the selected scope yet.'){ return `<div class="v152-empty"><i data-lucide="database"></i><p>${esc(message)}</p></div>`; }
  function chart(id){ return `<div class="v152-chart"><canvas id="${id}"></canvas><div id="${id}-fallback"></div></div>`; }
  function doughnut(id){ return `<div class="v152-chart doughnut"><canvas id="${id}"></canvas><div id="${id}-fallback"></div></div>`; }
  function progress(rows=[],key='average',labelKey='name',suffix='%'){ if(!rows.length)return empty(); return `<div class="v152-progress">${rows.map((r,i)=>{const v=number(r[key]??r.value??r.score);return `<div><span>${i+1}. ${esc(r[labelKey]||r.student||r.teacher||r.subject||'Item')}</span><i><b style="width:${Math.min(100,v)}%"></b></i><strong>${fmt(v)}${suffix}</strong></div>`;}).join('')}</div>`; }
  function table(rows=[],columns=[]){ if(!rows.length)return empty(); return `<div class="v152-table-wrap"><table><thead><tr>${columns.map(c=>`<th>${esc(c.label)}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${columns.map(c=>`<td>${c.render?c.render(row):esc(row[c.key]??'—')}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`; }
  function insights(rows=[]){ if(!rows.length)return empty('No alerts or insights are available.'); return `<div class="v152-insights">${rows.slice(0,8).map(x=>`<article class="tone-${esc(x.tone||'info')}"><span><i data-lucide="${esc(x.icon||'info')}"></i></span><div><b>${esc(x.title||'Insight')}</b><p>${esc(x.message||'')}</p></div><time>${esc(x.time||'')}</time></article>`).join('')}</div>`; }
  function heatmap(data){ const h=data?.charts?.attendanceHeatmap; if(!h?.weeks?.length)return empty(); return `<div class="v152-heatmap"><div></div>${(h.weekdays||[]).map(d=>`<b>${esc(d)}</b>`).join('')}${h.weeks.map(w=>`<strong>${esc(w.label)}</strong>${(w.cells||[]).map(v=>`<i class="${v>=90?'good':v>=80?'fair':'bad'}" title="${v}%">${v?Math.round(v):'—'}</i>`).join('')}`).join('')}</div>`; }

  function schoolBody(data){
    return `<div class="v152-grid">
      ${card('Attendance Trend (by Month)',chart('v152-attendance'),'span-4')}
      ${card('Class Performance (Average Score %)',chart('v152-classperf'),'span-4')}
      ${card('Subject Performance (Average Score %)',progress((data.lists?.topSubjects||[]).map(x=>({...x,subject:x.name})), 'average','subject'),'span-4')}
      ${card('Top Classes',table(data.lists?.topClasses||[],[{label:'#',render:(r,i)=>''},{label:'Class',key:'name'},{label:'Average',render:r=>`${fmt(r.average)}%`},{label:'Marks',key:'marks'}]),'span-3')}
      ${card('At-Risk Classes',table(data.lists?.atRiskClasses||[],[{label:'Class',key:'name'},{label:'Average',render:r=>`<span class="danger">${fmt(r.average)}%</span>`},{label:'Marks',key:'marks'}]),'span-3')}
      ${card('Top Teachers',table(data.lists?.topTeachers||[],[{label:'Teacher',key:'name'},{label:'Average',render:r=>`${fmt(r.average)}%`},{label:'Records',key:'count'}]),'span-3')}
      ${card('Top Subjects',table(data.lists?.topSubjects||[],[{label:'Subject',key:'name'},{label:'Average',render:r=>`${fmt(r.average)}%`},{label:'Records',key:'count'}]),'span-3')}
      ${card('Operational Insights',table(data.lists?.operational||[],[{label:'Metric',key:'label'},{label:'Value',render:r=>r.label?.toLowerCase().includes('balance')?money(r.value):fmt(r.value)}]),'span-3')}
      ${card('Attendance Heatmap',heatmap(data),'span-3')}
      ${card('Performance by Stream',progress(data.lists?.streamPerformance||[],'average','name'),'span-3')}
      ${card('Teacher Effectiveness Summary',doughnut('v152-teachers'),'span-3')}
      ${card('Subject Mastery Breakdown',progress(data.lists?.topSubjects||[],'average','name'),'span-4')}
      ${card('Student Risk Alerts',table(data.lists?.riskStudents||[],[{label:'Student',render:r=>esc(r.student||r.name)},{label:'Average',render:r=>`${fmt(r.average)}%`},{label:'Attendance',render:r=>r.attendance!==undefined?`${fmt(r.attendance)}%`:'—'}]),'span-4')}
      ${card('Report Publication Status',doughnut('v152-reports'),'span-4')}
      ${card('Recent Alerts & Insights',insights(data.lists?.alerts||[]),'span-12')}
    </div>`;
  }
  function platformBody(data){ return `<div class="v152-grid">
    ${card('Monthly Growth Overview',chart('v152-platform-growth'),'span-6')}${card('School Plan Distribution',doughnut('v152-platform-plans'),'span-3')}${card('Revenue Trend (KES)',chart('v152-platform-revenue'),'span-3')}
    ${card('Region Distribution',progress((data.charts?.geographic?.labels||[]).map((name,i)=>({name,average:data.charts.geographic.values[i]})),'average','name',''),'span-3')}
    ${card('Top Performing Schools',table(data.lists?.topSchools||[],[{label:'School',key:'name'},{label:'Region',key:'region'},{label:'Students',key:'students'},{label:'Engagement',render:r=>`${fmt(r.engagement)}%`}]),'span-3')}
    ${card('At-Risk Schools',table(data.lists?.atRiskSchools||[],[{label:'School',key:'name'},{label:'Status',key:'status'},{label:'Engagement',render:r=>`<span class="danger">${fmt(r.engagement)}%</span>`}]),'span-3')}
    ${card('Platform Usage',progress(data.lists?.usage||[],'average','name'),'span-3')}
    ${card('Subscription Status',doughnut('v152-platform-subs'),'span-4')}${card('Approval Summary',table(data.lists?.approvals||[],[{label:'Type',key:'type'},{label:'Status',key:'status'},{label:'Created',render:r=>updated(r.createdAt)}]),'span-4')}${card('Platform Insights',insights(data.lists?.insights||[]),'span-4')}
    ${card('School Comparison',table(data.lists?.schoolComparison||[],[{label:'School',key:'name'},{label:'Region',key:'region'},{label:'Plan',key:'plan'},{label:'Students',key:'students'},{label:'Teachers',key:'teachers'},{label:'Parents',key:'parents'},{label:'Revenue',render:r=>money(r.revenue)},{label:'Engagement',render:r=>`${fmt(r.engagement)}%`},{label:'Status',key:'status'}]),'span-12')}
  </div>`; }
  function financeBody(data){ return `<div class="v152-grid">
    ${card('Collection Trend (by Month)',chart('v152-finance-collection'),'span-4')}${card('Payment Channel Split',doughnut('v152-finance-methods'),'span-4')}${card('Paid vs Outstanding',doughnut('v152-finance-split'),'span-4')}
    ${card('Defaulters List',table(data.lists?.defaulters||[],[{label:'Student',key:'student'},{label:'Class',key:'className'},{label:'Outstanding',render:r=>`<span class="danger">${money(r.outstanding)}</span>`},{label:'Due Date',render:r=>r.dueDate?new Date(r.dueDate).toLocaleDateString():'—'}]),'span-6')}
    ${card('Expense Categories',doughnut('v152-finance-expenses'),'span-3')}${card('Quick Finance Insights',insights(data.lists?.alerts||[]),'span-3')}
    ${card('Fee Performance by Class',table(data.lists?.classFeePerformance||[],[{label:'Class',key:'name'},{label:'Expected',render:r=>money(r.expected)},{label:'Collected',render:r=>money(r.paid)},{label:'Rate',render:r=>`${fmt(r.collectionRate)}%`}]),'span-6')}
    ${card('Bursary / Credit Summary',table(data.lists?.bursarySummary||[],[{label:'Metric',key:'name'},{label:'Value',render:r=>String(r.name||'').toLowerCase().includes('credit')&&number(r.value)>100?money(r.value):fmt(r.value)}]),'span-3')}
    ${card('Reconciliation Status',table(data.lists?.reconciliation||[],[{label:'Status',key:'name'},{label:'Count',key:'value'}]),'span-3')}
    ${card('Collection & Operational Notes',table(data.lists?.operational||[],[{label:'Metric',key:'label'},{label:'Value',render:r=>r.label?.toLowerCase().includes('balance')?money(r.value):fmt(r.value)}]),'span-6')}${card('Student Risk / Arrears',table(data.lists?.riskStudents||[],[{label:'Student',render:r=>esc(r.student||r.name)},{label:'Average',render:r=>`${fmt(r.average)}%`}]),'span-6')}
  </div>`; }
  function teacherBody(data){ return `<div class="v152-grid">
    ${card('Class Performance Trend',chart('v152-teacher-trend'),'span-4')}${card('Subject Performance',chart('v152-teacher-subjects'),'span-4')}${card('Assessment Breakdown',doughnut('v152-teacher-assessments'),'span-4')}
    ${card('Student Leaderboard',table(data.lists?.topStudents||[],[{label:'Student',render:r=>esc(r.student||r.name)},{label:'Mean Score',render:r=>`${fmt(r.average)}%`},{label:'Records',key:'count'}]),'span-3')}${card('Students Needing Support',table(data.lists?.riskStudents||[],[{label:'Student',render:r=>esc(r.student||r.name)},{label:'Mean Score',render:r=>`<span class="danger">${fmt(r.average)}%</span>`}]),'span-3')}${card('Attendance Pattern',doughnut('v152-teacher-attendance'),'span-3')}${card('Homework Completion',doughnut('v152-teacher-homework'),'span-3')}
    ${card('Marks Entry Readiness',doughnut('v152-teacher-reports'),'span-3')}${card('Assessment Performance',table(data.lists?.assessmentPerformance||[],[{label:'Assessment',key:'name'},{label:'Average',render:r=>`${fmt(r.average)}%`},{label:'Records',key:'count'}]),'span-3')}${card('Actionable Insights',insights(data.lists?.actionableInsights||[]),'span-3')}${card('Quick Actions','<div class="v152-actions"><button onclick="showDashboardSection(\'announcements\')"><i data-lucide="send"></i>Send Class Announcement</button><button onclick="showDashboardSection(\'homework\')"><i data-lucide="plus-circle"></i>Create Assignment</button><button onclick="showDashboardSection(\'grades\')"><i data-lucide="clipboard-list"></i>Open Marks Entry</button><button onclick="showDashboardSection(\'report-cards\')"><i data-lucide="bar-chart-3"></i>Generate Class Report</button></div>','span-3')}
  </div>`; }
  function childBody(data){ const isParent=data.variant==='child'; return `<div class="v152-privacy"><i data-lucide="lock"></i>${isParent?'You are viewing data for your linked child only. Access is restricted to authorized parent accounts.':'This analytics view contains only your own student data.'}</div><div class="v152-grid">
    ${card('Performance by Subject',table(data.lists?.subjectPerformance||[],[{label:'Subject',key:'name'},{label:'Average Score',render:r=>`${fmt(r.average)}%`},{label:'Grade',render:r=>r.average?grade(r.average):'—'},{label:'Records',key:'count'}]),'span-4')}${card('Attendance Trend',chart('v152-child-attendance'),'span-4')}${card('Strengths vs Support Areas',doughnut('v152-child-strengths'),'span-4')}
    ${card('Recent Assessments',table(data.lists?.recentAssessments||[],[{label:'Subject',key:'subject'},{label:'Assessment',key:'assessment'},{label:'Score',render:r=>`${fmt(r.score)}%`},{label:'Grade',key:'grade'},{label:'Date',render:r=>r.date?new Date(r.date).toLocaleDateString():'—'}]),'span-4')}${card('Recommendations',insights(data.lists?.recommendations||[]),'span-4')}${card('Upcoming / Recent Tasks',table(data.lists?.tasks||[],[{label:'Task',key:'title'},{label:'Subject',key:'subject'},{label:'Status',key:'status'},{label:'Due',render:r=>r.dueDate?new Date(r.dueDate).toLocaleDateString():'—'}]),'span-4')}
    ${card('Badges & Achievements',table([...(data.lists?.badges||[]),...(data.lists?.achievements||[])],[{label:'Achievement',render:r=>esc(r.name||r.title)},{label:'Description',render:r=>esc(r.description||r.note||'')},{label:'Date',render:r=>updated(r.awardedAt||r.createdAt)}]),'span-4')}${card('Class Leaderboard',table(data.lists?.leaderboard||[],[{label:'Student',key:'name'},{label:'Average',render:r=>`${fmt(r.average)}%`}]),'span-4')}${card('Recent Alerts',insights(data.lists?.recentAlerts||[]),'span-4')}
    ${card('Timetable Summary',table(data.lists?.timetable||[],[{label:'Day',render:r=>esc(r.day||r.dayOfWeek||'—')},{label:'Time',render:r=>esc(r.startTime&&r.endTime?`${r.startTime} – ${r.endTime}`:r.time||'—')},{label:'Subject',render:r=>esc(r.subjectName||r.subject||r.learningArea||'—')},{label:'Teacher',render:r=>esc(r.teacherName||r.teacher||'—')}]),'span-12')}
  </div>`; }
  function grade(score){ const n=number(score); return n>=80?'A':n>=70?'B':n>=60?'C':n>=50?'D':n>0?'E':'—'; }

  function body(data){ if(data.variant==='platform')return platformBody(data); if(data.variant==='finance')return financeBody(data); if(data.variant==='class')return teacherBody(data); if(data.variant==='child'||data.variant==='student')return childBody(data); return schoolBody(data); }

  function exportPanel(data){
    const role=currentRole(), types=scopeTypesFor(role,data), selected=data.scope?.type||types[0]?.[0], sections=data.exportSections||[];
    return `<div class="v152-export-overlay ${state.exportOpen?'open':''}" data-v152-export-overlay onclick="if(event.target===this)window.v152CloseExport()"><aside class="v152-export-panel"><header><div><h3>Export Analytics</h3><p>Choose scope, format and sections before generating the file.</p></div><button onclick="window.v152CloseExport()"><i data-lucide="x"></i></button></header>
      <div class="v152-export-scroll"><fieldset><legend>Export Scope</legend>${types.map(([id,name])=>`<label class="v152-radio"><input type="radio" name="v152-export-scope" value="${id}" ${selected===id?'checked':''} onchange="window.v152ExportScopeChanged()"><span><b>${esc(name)}</b><small>${id==='school'?'All authorized school data':`Choose a ${esc(id)} from your authorized scope`}</small></span></label>`).join('')}<select data-v152-export-target ${selected==='school'||selected==='platform'?'hidden':''}>${scopeTargetOptions(data,selected,data.scope?.id)}</select></fieldset>
      <fieldset><legend>Export Format</legend><div class="v152-format-grid">${[['pdf','file-text','PDF Document'],['xlsx','sheet','Excel Workbook'],['csv','table-2','CSV File'],['print','printer','Print / Preview']].map(([id,icon,name],i)=>`<label><input type="radio" name="v152-export-format" value="${id}" ${i===0?'checked':''}><span><i data-lucide="${icon}"></i>${name}</span></label>`).join('')}</div></fieldset>
      <fieldset><legend>Include in Export <button type="button" onclick="window.v152ToggleAllExport(true)">Select All</button></legend><div class="v152-checks">${sections.map(s=>`<label><input type="checkbox" data-v152-export-section value="${esc(s.key)}" checked><span>${esc(s.label)} <small>${fmt(s.count)}</small></span></label>`).join('')||'<p>No exportable analytics are available for this scope.</p>'}</div></fieldset>
      <div class="v152-export-preview"><b>Export Preview</b><p>Scope: <span data-v152-preview-scope>${esc(data.scope?.label||'Current analytics')}</span></p><p>Items selected: <span data-v152-preview-count>${sections.length}</span></p><p>All exported data is generated from the live, authorized backend scope.</p></div></div>
      <footer><button class="secondary" onclick="window.v152CloseExport()">Cancel</button><button class="primary" onclick="window.v152GenerateExport()"><i data-lucide="download"></i>Generate Export</button></footer></aside></div>`;
  }
  function renderShell(role,data){ return `<div class="v152-shell" data-variant="${esc(data.variant||'school')}">${header(role,data)}${kpis(data)}${body(data)}<footer class="v152-updated"><span>All data is tenant-scoped and loaded from the backend database.</span><span>Last updated: ${esc(updated(data.updatedAt))}</span><button onclick="window.v152RefreshAnalytics({manual:true})"><i data-lucide="refresh-cw"></i></button><em data-v152-refresh-note></em></footer>${exportPanel(data)}</div>`; }

  function drawVariantCharts(data){
    if(data.variant==='platform'){
      makeChart('v152-platform-growth','line',data.charts?.growth?.labels,data.charts?.growth?.values,{label:'Schools',legend:false});
      makeChart('v152-platform-plans','doughnut',data.charts?.planDistribution?.labels,data.charts?.planDistribution?.values,{legend:true});
      makeChart('v152-platform-revenue','line',data.charts?.revenueTrend?.labels,data.charts?.revenueTrend?.values,{label:'Revenue',legend:false});
      makeChart('v152-platform-subs','doughnut',data.charts?.planDistribution?.labels,data.charts?.planDistribution?.values,{legend:true});
    } else if(data.variant==='finance'){
      makeChart('v152-finance-collection','line',data.charts?.collectionTrend?.labels,data.charts?.collectionTrend?.values,{label:'Collected KSh',legend:false});
      makeChart('v152-finance-methods','doughnut',data.charts?.paymentMethods?.labels,data.charts?.paymentMethods?.values,{legend:true});
      makeChart('v152-finance-split','doughnut',data.charts?.feeSplit?.labels,data.charts?.feeSplit?.values,{legend:true});
      makeChart('v152-finance-expenses','doughnut',data.charts?.expenseCategories?.labels,data.charts?.expenseCategories?.values,{legend:true});
    } else if(data.variant==='class'){
      makeChart('v152-teacher-trend','line',data.charts?.performanceTrend?.labels,data.charts?.performanceTrend?.values,{label:'Mean Score',legend:false,max:100});
      makeChart('v152-teacher-subjects','bar',data.charts?.subjectPerformance?.labels,data.charts?.subjectPerformance?.values,{label:'Average',legend:false,max:100});
      makeChart('v152-teacher-assessments','doughnut',data.charts?.assessmentBreakdown?.labels,data.charts?.assessmentBreakdown?.values,{legend:true});
      makeChart('v152-teacher-attendance','doughnut',data.charts?.attendancePattern?.labels,data.charts?.attendancePattern?.values,{legend:true});
      makeChart('v152-teacher-homework','doughnut',data.charts?.homeworkSplit?.labels,data.charts?.homeworkSplit?.values,{legend:true});
      makeChart('v152-teacher-reports','doughnut',data.charts?.reportStatus?.labels,data.charts?.reportStatus?.values,{legend:true});
    } else if(data.variant==='child'||data.variant==='student'){
      makeChart('v152-child-attendance','line',data.charts?.attendanceTrend?.labels,data.charts?.attendanceTrend?.values,{label:'Attendance',legend:false,max:100});
      makeChart('v152-child-strengths','doughnut',data.charts?.strengthsSplit?.labels,data.charts?.strengthsSplit?.values,{legend:true});
    } else {
      makeChart('v152-attendance','line',data.charts?.attendanceTrend?.labels,data.charts?.attendanceTrend?.values,{label:'Attendance',legend:false,max:100});
      makeChart('v152-classperf','bar',data.charts?.classPerformance?.labels,data.charts?.classPerformance?.values,{label:'Average Score',legend:false,max:100});
      makeChart('v152-teachers','doughnut',data.charts?.teacherPerformance?.labels,data.charts?.teacherPerformance?.values,{legend:true});
      makeChart('v152-reports','doughnut',data.charts?.reportStatus?.labels,data.charts?.reportStatus?.values,{legend:true});
    }
    try{window.lucide?.createIcons?.();}catch(_){}
  }

  function applyCategoryFilter(){const selected=state.analyticsType||document.querySelector('[data-v152-filter="analyticsType"]')?.value||'overview';document.querySelectorAll('.v152-card[data-analytics-category]').forEach(card=>{card.hidden=selected!=='overview'&&card.dataset.analyticsCategory!==selected;});}

  async function renderAnalyticsSection(role){ state.role=role; state.query=''; try{const data=await fetchAnalytics();setTimeout(()=>{drawVariantCharts(data);applyCategoryFilter();},50);return renderShell(role,data);}catch(error){console.error('[v152 analytics]',error);return `<div class="v152-load-error"><i data-lucide="triangle-alert"></i><h2>Analytics could not load</h2><p>${esc(error.message||'Unknown error')}</p><button onclick="showDashboardSection('analytics')">Retry</button></div>`;} }
  async function refreshAnalytics(options={}){
    const shell=document.querySelector('.v152-shell'); if(!shell)return null; if(state.refreshInFlight)return state.refreshInFlight;
    state.query=paramsFromUi().toString(); const note=shell.querySelector('[data-v152-refresh-note]'); if(note)note.textContent=options.manual?'Refreshing…':'Updating quietly…'; shell.classList.add('is-updating');
    state.refreshInFlight=(async()=>{try{const data=await fetchAnalytics();const wrapper=document.createElement('div');wrapper.innerHTML=renderShell(currentRole(),data);const next=wrapper.firstElementChild;if(next){const wasOpen=state.exportOpen;shell.innerHTML=next.innerHTML;state.exportOpen=wasOpen;const overlay=shell.querySelector('[data-v152-export-overlay]');overlay?.classList.toggle('open',wasOpen);}setTimeout(()=>{drawVariantCharts(data);applyCategoryFilter();},30);state.lastRenderAt=Date.now();return data;}catch(error){console.error('[v152 analytics refresh]',error);if(note)note.textContent='Update failed; existing data kept.';return null;}finally{state.refreshInFlight=null;shell.classList.remove('is-updating');}})();return state.refreshInFlight;
  }

  function scopeTypeChanged(select){ const data=state.data||{}; const type=select.value; let target=document.querySelector('[data-v152-scope-target]'); const label=select.closest('.v152-filterbar'); if(type==='school'||type==='platform'){target?.closest('label')?.remove();state.query=paramsFromUi().toString();refreshAnalytics({filter:true});return;} if(!target){const wrap=document.createElement('label');wrap.innerHTML=`Choose ${esc(type)}<select data-v152-filter="scopeId" data-v152-scope-target></select>`;select.closest('label').after(wrap);target=wrap.querySelector('select');}target.innerHTML=scopeTargetOptions(data,type,'');target.closest('label').childNodes[0].textContent=`Choose ${type}`;}
  document.addEventListener('change',event=>{
    const el=event.target;
    if(el.matches('[data-v152-scope-type]')){scopeTypeChanged(el);return;}
    if(el.matches('[data-v152-filter="analyticsType"]')){state.analyticsType=el.value||'overview';applyCategoryFilter();return;}
    if(el.matches('[data-v152-filter]')){if(el.matches('[data-v152-scope-target]')&&!el.value)return;refreshAnalytics({filter:true});}
    if(el.matches('[data-v152-export-section]'))updateExportPreview();
  });

  function openExport(){state.exportOpen=true;document.querySelector('[data-v152-export-overlay]')?.classList.add('open');document.body.classList.add('v152-modal-open');updateExportPreview();try{lucide?.createIcons?.();}catch(_){} }
  function closeExport(){state.exportOpen=false;document.querySelector('[data-v152-export-overlay]')?.classList.remove('open');document.body.classList.remove('v152-modal-open');}
  function exportScopeChanged(){ const data=state.data||{}; const type=document.querySelector('input[name="v152-export-scope"]:checked')?.value||data.scope?.type||'school'; const target=document.querySelector('[data-v152-export-target]'); if(target){target.hidden=type==='school'||type==='platform';target.innerHTML=scopeTargetOptions(data,type,type===data.scope?.type?data.scope?.id:'');}updateExportPreview(); }
  function updateExportPreview(){ const count=document.querySelectorAll('[data-v152-export-section]:checked').length; const target=document.querySelector('[data-v152-preview-count]'); if(target)target.textContent=String(count); const type=document.querySelector('input[name="v152-export-scope"]:checked')?.value||state.data?.scope?.type; const option=document.querySelector('[data-v152-export-target] option:checked'); const scope=document.querySelector('[data-v152-preview-scope]'); if(scope)scope.textContent=(type==='school'?'Whole School':type==='platform'?'All Schools':option?.textContent||titleize(type)); }
  function toggleAllExport(on){document.querySelectorAll('[data-v152-export-section]').forEach(c=>c.checked=on);updateExportPreview();}
  async function generateExport(){
    const button=document.querySelector('.v152-export-panel footer .primary'); if(button){button.disabled=true;button.innerHTML='<span class="v152-spinner"></span>Generating…';}
    try{
      const format=document.querySelector('input[name="v152-export-format"]:checked')?.value||'pdf';
      const scopeType=document.querySelector('input[name="v152-export-scope"]:checked')?.value||state.data?.scope?.type||'school';
      const scopeId=(scopeType==='school'||scopeType==='platform')?'':document.querySelector('[data-v152-export-target]')?.value||'';
      if(!scopeId&&scopeType!=='school'&&scopeType!=='platform')throw new Error(`Select the ${scopeType} to export.`);
      const include=[...document.querySelectorAll('[data-v152-export-section]:checked')].map(x=>x.value); if(!include.length)throw new Error('Select at least one analytics section.');
      const filters=Object.fromEntries(paramsFromUi().entries()); filters.scopeType=scopeType; filters.scopeId=scopeId;
      const token=localStorage.getItem('authToken')||localStorage.getItem('token')||'';
      const response=await fetch(`${API_BASE_URL}/api/analytics/export`,{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:JSON.stringify({format,scopeType,scopeId,include,filters,childId:filters.childId||state.data?.student?.id})});
      if(!response.ok){let message='Export failed';try{message=(await response.json()).message||message;}catch(_){}throw new Error(message);}
      const disposition=response.headers.get('content-disposition')||'';const filename=disposition.match(/filename="?([^";]+)"?/i)?.[1]||`shule-ai-analytics.${format==='print'?'html':format}`;
      const blob=await response.blob();const url=URL.createObjectURL(blob);
      if(format==='print'){window.open(url,'_blank','noopener');setTimeout(()=>URL.revokeObjectURL(url),120000);}else{const a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);}
      showToast?.('Analytics export generated successfully.','success');closeExport();
    }catch(error){showToast?.(error.message||'Analytics export failed.','error');}
    finally{if(button){button.disabled=false;button.innerHTML='<i data-lucide="download"></i>Generate Export';try{lucide?.createIcons?.();}catch(_){}}}
  }

  try{const redraw=()=>{if(document.querySelector('.v152-shell')){clearTimeout(window.__v152ThemeTimer);window.__v152ThemeTimer=setTimeout(redrawCharts,120);}};new MutationObserver(redraw).observe(document.documentElement,{attributes:true,attributeFilter:['class','data-theme']});window.addEventListener('shule:theme-changed',redraw);}catch(_){}

  window.renderAnalyticsSection=renderAnalyticsSection;
  window.v152RefreshAnalytics=refreshAnalytics;
  window.v151RefreshAnalytics=refreshAnalytics;
  window.v152OpenExport=openExport;
  window.v152CloseExport=closeExport;
  window.v152ExportScopeChanged=exportScopeChanged;
  window.v152ToggleAllExport=toggleAllExport;
  window.v152GenerateExport=generateExport;
  window.v152RedrawAnalyticsCharts=redrawCharts;
})();
