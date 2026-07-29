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
  function today(){ return window.localDateInputValue ? window.localDateInputValue() : new Intl.DateTimeFormat('en-CA',{timeZone:'Africa/Nairobi'}).format(new Date()); }
  function daysAgo(days){ const d=new Date(); d.setDate(d.getDate()-days); return window.localDateInputValue ? window.localDateInputValue(d) : new Intl.DateTimeFormat('en-CA',{timeZone:'Africa/Nairobi'}).format(d); }
  function titleize(key){ return String(key||'').replace(/^(chart:|list:)/,'').replace(/([A-Z])/g,' $1').replace(/^./,m=>m.toUpperCase()); }
  function currentRole(){ return state.role || getCurrentRole?.() || getCurrentUser?.()?.role || localStorage.getItem('userRole') || 'admin'; }

  const EXPORT_REGISTRY = {
    'KPI Summary': { key:'kpis', category:'overview' },
    'Attendance Trend (by Month)': { key:'chart:attendanceTrend', category:'attendance' },
    'Attendance Trend': { key:'chart:attendanceTrend', category:'attendance' },
    'Attendance Pattern': { key:'chart:attendancePattern', category:'attendance' },
    'Attendance Heatmap': { key:'chart:attendanceHeatmap', category:'attendance' },
    'Class Performance (Average Score %)': { key:'chart:classPerformance', category:'academic' },
    'Class Performance Trend': { key:'chart:performanceTrend', category:'academic' },
    'Subject Performance (Average Score %)': { key:'chart:subjectPerformance', category:'academic' },
    'Subject Performance': { key:'chart:subjectPerformance', category:'academic' },
    'Subject Mastery Breakdown': { key:'list:topSubjects', category:'academic' },
    'Performance by Stream': { key:'list:streamPerformance', category:'academic' },
    'Performance by Subject': { key:'list:subjectPerformance', category:'academic' },
    'Assessment Breakdown': { key:'chart:assessmentBreakdown', category:'academic' },
    'Assessment Performance': { key:'list:assessmentPerformance', category:'academic' },
    'Top Classes': { key:'list:topClasses', category:'academic' },
    'At-Risk Classes': { key:'list:atRiskClasses', category:'academic' },
    'Top Subjects': { key:'list:topSubjects', category:'academic' },
    'Top Students': { key:'list:topStudents', category:'academic' },
    'Student Leaderboard': { key:'list:topStudents', category:'academic' },
    'Students Needing Support': { key:'list:riskStudents', category:'academic' },
    'Student Risk Alerts': { key:'list:riskStudents', category:'academic' },
    'Strengths vs Support Areas': { key:'chart:strengthsSplit', category:'academic' },
    'Recent Assessments': { key:'list:recentAssessments', category:'academic' },
    'Recommendations': { key:'list:recommendations', category:'academic' },
    'Upcoming / Recent Tasks': { key:'list:tasks', category:'academic' },
    'Badges & Achievements': { key:'list:badges', category:'academic' },
    'Class Leaderboard': { key:'list:leaderboard', category:'academic' },
    'Homework Completion': { key:'chart:homeworkSplit', category:'academic' },
    'Timetable Summary': { key:'list:timetable', category:'reports' },
    'Report Publication Status': { key:'chart:reportStatus', category:'reports' },
    'Marks Entry Readiness': { key:'chart:reportStatus', category:'reports' },
    'Top Teachers': { key:'list:topTeachers', category:'teachers' },
    'Teacher Effectiveness Summary': { key:'chart:teacherPerformance', category:'teachers' },
    'Operational Insights': { key:'list:operational', category:'overview' },
    'Recent Alerts & Insights': { key:'list:alerts', category:'overview' },
    'Recent Alerts': { key:'list:recentAlerts', category:'overview' },
    'Actionable Insights': { key:'list:actionableInsights', category:'overview' },
    'Monthly Growth Overview': { key:'chart:growth', category:'overview' },
    'School Plan Distribution': { key:'chart:planDistribution', category:'overview' },
    'Revenue Trend (KES)': { key:'chart:revenueTrend', category:'finance' },
    'Region Distribution': { key:'chart:geographic', category:'overview' },
    'Top Performing Schools': { key:'list:topSchools', category:'overview' },
    'At-Risk Schools': { key:'list:atRiskSchools', category:'overview' },
    'Platform Usage': { key:'list:usage', category:'overview' },
    'Subscription Status': { key:'chart:planDistribution', category:'finance' },
    'Approval Summary': { key:'list:approvals', category:'overview' },
    'Platform Insights': { key:'list:insights', category:'overview' },
    'School Comparison': { key:'list:schoolComparison', category:'overview' },
    'Data Quality Warnings': { key:'list:dataQualityWarnings', category:'overview' },
    'Recommended Actions': { key:'list:recommendedActions', category:'overview' },
    'Collection Trend (by Month)': { key:'chart:collectionTrend', category:'finance' },
    'Payment Channel Split': { key:'chart:paymentMethods', category:'finance' },
    'Paid vs Outstanding': { key:'chart:feeSplit', category:'finance' },
    'Defaulters List': { key:'list:defaulters', category:'finance' },
    'Expense Categories': { key:'chart:expenseCategories', category:'finance' },
    'Quick Finance Insights': { key:'list:alerts', category:'finance' },
    'Fee Performance by Class': { key:'list:classFeePerformance', category:'finance' },
    'Bursary / Credit Summary': { key:'list:bursarySummary', category:'finance' },
    'Reconciliation Status': { key:'list:reconciliation', category:'finance' },
    'Collection & Operational Notes': { key:'list:operational', category:'finance' },
    'Student Risk / Arrears': { key:'list:riskStudents', category:'finance' },
    'KEMIS Readiness': { key:'list:kemisReadiness', category:'compliance' },
    'Enrollment by Gender': { key:'list:enrollmentByGender', category:'compliance' },
    'Enrollment by Class': { key:'list:enrollmentByClass', category:'compliance' },
    'Compliance Missing Data': { key:'list:complianceMissing', category:'compliance' }
  };
  const SECTION_CATEGORY = Object.fromEntries(Object.values(EXPORT_REGISTRY).map(x => [x.key, x.category]));
  const SECTION_LABEL = Object.fromEntries(Object.entries(EXPORT_REGISTRY).map(([label,x]) => [x.key, label]));
  Object.assign(SECTION_CATEGORY, {
    'chart:attendanceTrend':'attendance','chart:attendancePattern':'attendance','chart:attendanceHeatmap':'attendance',
    'chart:collectionTrend':'finance','chart:paymentMethods':'finance','chart:feeSplit':'finance','chart:expenseCategories':'finance','list:defaulters':'finance','list:classFeePerformance':'finance','list:bursarySummary':'finance','list:reconciliation':'finance',
    'chart:teacherPerformance':'teachers','list:topTeachers':'teachers',
    'chart:reportStatus':'reports','list:timetable':'reports',
    'chart:classPerformance':'academic','chart:subjectPerformance':'academic','chart:performanceTrend':'academic','chart:assessmentBreakdown':'academic','chart:strengthsSplit':'academic','chart:homeworkSplit':'academic','list:topStudents':'academic','list:riskStudents':'academic','list:topClasses':'academic','list:atRiskClasses':'academic','list:topSubjects':'academic','list:streamPerformance':'academic','list:subjectPerformance':'academic','list:recentAssessments':'academic','list:recommendations':'academic','list:tasks':'academic','list:badges':'academic','list:achievements':'academic','list:leaderboard':'academic','list:assessmentPerformance':'academic'
  });
  function exportInfoForTitle(title){ return EXPORT_REGISTRY[String(title||'').trim()] || null; }
  function categoryForSectionKey(key){ return SECTION_CATEGORY[key] || (key === 'kpis' ? 'overview' : 'overview'); }
  function sectionAvailable(key){ return !!(state.data?.exportSections || []).some(s => s.key === key); }
  const EMPTY_DIAGNOSTICS = {
    'Attendance Trend (by Month)': { state:'Waiting for attendance', icon:'calendar-check', required:'Attendance records for the selected date range.', action:'Mark attendance for several school days, then refresh analytics.' },
    'Attendance Trend': { state:'Waiting for attendance', icon:'calendar-check', required:'Attendance records for the selected learner/date range.', action:'Mark attendance first; this card fills once attendance exists.' },
    'Attendance Pattern': { state:'Waiting for attendance', icon:'calendar-check', required:'Present/absent/late attendance statuses.', action:'Record attendance for this class or learner.' },
    'Attendance Heatmap': { state:'Needs several attendance days', icon:'grid-3x3', required:'Attendance across multiple days/weeks.', action:'Use after at least a few days of attendance have been marked.' },
    'Class Performance (Average Score %)': { state:'Waiting for marks', icon:'clipboard-list', required:'Academic records connected to classes.', action:'Enter marks for students in classes for the selected term/year.' },
    'Class Performance Trend': { state:'Waiting for marks', icon:'clipboard-list', required:'Published or saved class academic records.', action:'Enter marks for your assigned class.' },
    'Subject Performance (Average Score %)': { state:'Waiting for subject marks', icon:'book-open', required:'Marks with subject/learning-area names.', action:'Enter subject marks for the selected scope.' },
    'Subject Performance': { state:'Waiting for subject marks', icon:'book-open', required:'Subject marks for this class/learner.', action:'Enter subject scores first.' },
    'Subject Mastery Breakdown': { state:'Waiting for subject marks', icon:'book-open', required:'Subject averages from academic records.', action:'Enter marks by learning area/subject.' },
    'Performance by Stream': { state:'Needs stream data', icon:'layers', required:'Classes/students with stream values and marks.', action:'Set streams on classes/students and enter marks.' },
    'Performance by Subject': { state:'Waiting for subject marks', icon:'book-open', required:'Subject marks for the selected learner.', action:'Enter and save assessments first.' },
    'Assessment Breakdown': { state:'Waiting for assessments', icon:'pie-chart', required:'Assessment names/types connected to marks.', action:'Record CAT/midterm/end-term assessments.' },
    'Assessment Performance': { state:'Waiting for assessments', icon:'clipboard-check', required:'Assessment results grouped by assessment name/type.', action:'Enter assessment records for this scope.' },
    'Top Classes': { state:'Waiting for class marks', icon:'trophy', required:'Class-linked academic records.', action:'Enter marks for at least one class.' },
    'At-Risk Classes': { state:'No at-risk classes found', icon:'shield-check', required:'Class averages below the risk threshold.', action:'This is good if all classes are performing above risk level.' },
    'Top Subjects': { state:'Waiting for subject marks', icon:'trophy', required:'Subject averages from academic records.', action:'Enter marks by subject/learning area.' },
    'Top Students': { state:'Waiting for student marks', icon:'trophy', required:'Student academic records in the selected scope.', action:'Enter marks for students first.' },
    'Student Leaderboard': { state:'Waiting for class marks', icon:'bar-chart-3', required:'Classmate marks in the selected class.', action:'Enter marks for several students in the class.' },
    'Students Needing Support': { state:'No support-risk students found', icon:'shield-check', required:'Low-score or low-attendance risk signals.', action:'This is good if no learner currently matches the risk rule.' },
    'Student Risk Alerts': { state:'No risk alerts found', icon:'shield-check', required:'Low marks, arrears, or attendance risk indicators.', action:'This card fills only when a learner matches risk rules.' },
    'Strengths vs Support Areas': { state:'Waiting for learning data', icon:'activity', required:'Subject performance split into strengths/support areas.', action:'Enter subject marks to generate the split.' },
    'Recent Assessments': { state:'Waiting for assessments', icon:'file-text', required:'Saved assessment records for the selected learner.', action:'Enter CAT/midterm/end-term marks.' },
    'Recommendations': { state:'Waiting for insights', icon:'lightbulb', required:'Marks or risk data to generate recommendations.', action:'Recommendations appear after academic records exist.' },
    'Upcoming / Recent Tasks': { state:'No tasks yet', icon:'clipboard-list', required:'Homework/home-task assignments.', action:'Create or assign tasks for learners.' },
    'Badges & Achievements': { state:'No badges yet', icon:'award', required:'Awarded badges or achievement events.', action:'Badges appear after achievements are awarded.' },
    'Class Leaderboard': { state:'Waiting for class data', icon:'bar-chart-3', required:'Marks from students in the same class.', action:'Enter class marks first.' },
    'Recent Alerts': { state:'No alerts yet', icon:'bell', required:'Alerts for this learner/account.', action:'Alerts appear when the system creates notifications.' },
    'Timetable Summary': { state:'Needs timetable', icon:'calendar-days', required:'Published timetable for the selected class/term.', action:'Publish a timetable for this class.' },
    'Report Publication Status': { state:'Waiting for reports', icon:'file-check', required:'Draft or published report snapshots.', action:'Generate or publish report cards for this term.' },
    'Marks Entry Readiness': { state:'Waiting for report readiness data', icon:'file-check', required:'Report/marks status records.', action:'Enter marks and generate class reports.' },
    'Top Teachers': { state:'Waiting for teacher-linked marks', icon:'users', required:'Academic records linked to teacher IDs/classes.', action:'Enter marks through teacher accounts or assign teachers to classes/subjects.' },
    'Teacher Effectiveness Summary': { state:'Waiting for teacher-linked marks', icon:'users', required:'Teacher-linked academic records.', action:'Assign teachers and enter marks connected to them.' },
    'Operational Insights': { state:'Waiting for school activity', icon:'activity', required:'Students, teachers, attendance, fees, or reports.', action:'This fills as normal school activity is recorded.' },
    'Recent Alerts & Insights': { state:'No insights yet', icon:'bell', required:'Alerts generated from school activity.', action:'Insights appear after attendance, fees, marks, or report activity exists.' },
    'Actionable Insights': { state:'No actions yet', icon:'lightbulb', required:'Class risks, pending marks, or task signals.', action:'This fills as classroom activity is recorded.' },
    'Collection Trend (by Month)': { state:'Waiting for payments', icon:'circle-dollar-sign', required:'Completed fee payments with dates.', action:'Record or reconcile payments to build a trend.' },
    'Payment Channel Split': { state:'Waiting for payments', icon:'credit-card', required:'Completed payments with provider/method.', action:'Receive payments through configured providers.' },
    'Paid vs Outstanding': { state:'Waiting for fee records', icon:'wallet', required:'Fee invoices/balances and payments.', action:'Create fee invoices/structures and record payments.' },
    'Defaulters List': { state:'No defaulters found', icon:'shield-check', required:'Overdue unpaid fee invoices/balances.', action:'This is good if no students currently owe overdue fees.' },
    'Expense Categories': { state:'Waiting for expenses', icon:'receipt', required:'Finance expenses categorized by type.', action:'Record expenses to see category analytics.' },
    'Quick Finance Insights': { state:'No finance insights yet', icon:'lightbulb', required:'Fee, payment, arrears, or expense activity.', action:'Insights appear after finance activity is recorded.' },
    'Fee Performance by Class': { state:'Waiting for fee data', icon:'wallet', required:'Fee expectations/payments grouped by class.', action:'Create fee invoices and receive payments.' },
    'Bursary / Credit Summary': { state:'No bursary/credit data', icon:'hand-coins', required:'Bursary, credit, or adjustment records.', action:'Record credits/bursaries if the school uses them.' },
    'Reconciliation Status': { state:'Waiting for reconciliation data', icon:'scale', required:'Payment reconciliation records/statuses.', action:'Reconcile provider payments to fill this card.' },
    'Collection & Operational Notes': { state:'Waiting for finance activity', icon:'activity', required:'Fee/payment/expense records.', action:'This fills as finance activity grows.' },
    'Student Risk / Arrears': { state:'No arrears risk found', icon:'shield-check', required:'Outstanding balances or arrears-risk rules.', action:'This is good if no linked learners are in arrears.' },
    'Monthly Growth Overview': { state:'Waiting for platform growth', icon:'trending-up', required:'School signup dates over time.', action:'This fills as schools are added.' },
    'School Plan Distribution': { state:'Waiting for subscriptions', icon:'pie-chart', required:'School subscription plans.', action:'Assign plans/subscriptions to schools.' },
    'Revenue Trend (KES)': { state:'Waiting for platform payments', icon:'circle-dollar-sign', required:'Completed platform subscription payments.', action:'This fills when schools pay subscriptions.' },
    'Region Distribution': { state:'Waiting for school locations', icon:'map-pin', required:'School county/region/location fields.', action:'Add school location details.' },
    'Top Performing Schools': { state:'Waiting for school metrics', icon:'trophy', required:'Schools with users/marks/engagement/revenue.', action:'This fills as schools use the platform.' },
    'At-Risk Schools': { state:'No at-risk schools found', icon:'shield-check', required:'Inactive/low-engagement schools.', action:'This is good if no school matches the risk rule.' },
    'Platform Usage': { state:'Waiting for login activity', icon:'activity', required:'User last-login/activity records.', action:'This fills as users log in and use the system.' },
    'Subscription Status': { state:'Waiting for subscriptions', icon:'badge-check', required:'School subscription records.', action:'Create or activate school subscriptions.' },
    'Approval Summary': { state:'No approvals yet', icon:'shield-check', required:'Approval request records.', action:'This fills when schools/admins/teachers request approval.' },
    'Platform Insights': { state:'No platform insights yet', icon:'lightbulb', required:'Platform usage, revenue, or approval activity.', action:'This fills as the platform is used.' },
    'School Comparison': { state:'Waiting for school data', icon:'building-2', required:'Multiple schools with users/activity/revenue.', action:'This fills when schools are onboarded and active.' }
  };
  function currentAnalyticsType(){ return state.analyticsType || document.querySelector('.v152-shell [data-v152-filter="analyticsType"]')?.value || 'overview'; }
  function visibleExportKeys(includeKpis = true){
    const data = state.data || {};
    const sections = data.exportSections || [];
    const selected = currentAnalyticsType();
    const keys = sections.filter(s => selected === 'overview' || s.key === 'kpis' && includeKpis || categoryForSectionKey(s.key) === selected).map(s => s.key);
    return [...new Set(keys)];
  }

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
    // Only read filters from the currently rendered analytics shell. This prevents stale hidden filters
    // from another dashboard/role from being sent to /api/analytics/dashboard.
    const root=document.querySelector('.v152-shell');
    if (!root) return params;
    root.querySelectorAll('[data-v152-filter]').forEach(el=>{ const value=el.value; if(value!==undefined&&value!==null&&value!==''&&value!=='undefined') params.set(el.dataset.v152Filter,value); });
    const type=params.get('scopeType');
    const id=params.get('scopeId');
    if(type && id && state.data){
      const allowed=(getScopeOptions(state.data,type)||[]).map(x=>String(x.id));
      if(allowed.length && !allowed.includes(String(id))){
        params.delete('scopeId');
        if(type!=='class' || roleKey(currentRole())!=='teacher') params.set('scopeType','school');
      }
    }
    return params;
  }
  function getScopeOptions(data,type){
    const o=data.options||{};
    if(type==='stream') return o.streams||[];
    if(type==='class') return o.classes||[];
    if(type==='student') {
      const rows=o.students?.length ? o.students : (o.children||[]);
      if (rows.length) return rows;
      return data.student?.id ? [{ id:data.student.id, name:data.student.name||'My Analytics', elimuid:data.student.elimuid }] : [];
    }
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

  async function fetchAnalytics(){
    const params = paramsFromUi();
    if (roleKey(state.role || currentRole()) === 'parent' && !params.get('childId')) {
      let user = {};
      try { user = JSON.parse(localStorage.getItem('user') || '{}'); } catch (_) {}
      const selectedChildId =
        localStorage.getItem(`selectedChild:${user.id || 'unknown-parent'}`) ||
        localStorage.getItem('shule_selected_child_id') ||
        localStorage.getItem('selectedChild');
      if (selectedChildId && selectedChildId !== 'undefined' && selectedChildId !== 'null') {
        params.set('childId', selectedChildId);
      }
    }
    const query=params.toString();
    state.query=query;
    const result=await apiRequest(`/api/analytics/dashboard${query?`?${query}`:''}`);
    state.data=result.data||{};
    return state.data;
  }

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
      <label>Analytics Type<select data-v152-filter="analyticsType"><option value="overview" ${(f.analyticsType||state.analyticsType)==='overview'?'selected':''}>Overview</option><option value="academic" ${(f.analyticsType||state.analyticsType)==='academic'?'selected':''}>Academic</option><option value="attendance" ${(f.analyticsType||state.analyticsType)==='attendance'?'selected':''}>Attendance</option><option value="finance" ${(f.analyticsType||state.analyticsType)==='finance'?'selected':''}>Finance</option><option value="teachers" ${(f.analyticsType||state.analyticsType)==='teachers'?'selected':''}>Teachers</option><option value="reports" ${(f.analyticsType||state.analyticsType)==='reports'?'selected':''}>Reports</option>${['admin','superadmin'].includes(r)?`<option value="compliance" ${(f.analyticsType||state.analyticsType)==='compliance'?'selected':''}>KEMIS / Compliance</option>`:''}</select></label>
      <div class="v152-export-actions" role="group" aria-label="Export current analytics view">
        <button type="button" class="v152-export-btn" title="Export current view to PDF" onclick="window.v152GenerateExport('pdf')"><i data-lucide="file-text"></i><span>PDF</span></button>
        <button type="button" class="v152-export-btn" title="Export current view to Excel" onclick="window.v152GenerateExport('xlsx')"><i data-lucide="sheet"></i><span>Excel</span></button>
        <button type="button" class="v152-export-btn" title="Export current view to CSV" onclick="window.v152GenerateExport('csv')"><i data-lucide="table-2"></i><span>CSV</span></button>
        <button type="button" class="v152-export-btn" title="Choose sections and print options" onclick="window.v152OpenExport()"><i data-lucide="sliders-horizontal"></i><span>More</span></button>
      </div>
    </div>`;
  }

  function intelligencePanel(data){
    if (data.showIntelligencePanel === false || !['platform','school'].includes(String(data.variant||'').toLowerCase())) return '';
    const intel=data.intelligence||{};
    const warnings=data.lists?.dataQualityWarnings||[];
    const actions=data.lists?.recommendedActions||[];
    if(!intel.healthScore && !warnings.length && !actions.length) return '';
    const warningHtml=warnings.slice(0,3).map(w=>`<li class="tone-${esc(w.severity||'medium')}"><b>${esc(w.title||'Warning')}</b><span>${esc(w.message||'')}</span><small>${esc(w.action||'')}</small></li>`).join('') || '<li><b>No major warnings</b><span>Data checks did not find an urgent issue.</span></li>';
    const actionHtml=actions.slice(0,4).map(a=>`<li><b>${esc(a.priority||'Action')}</b><span>${esc(a.action||'')}</span><small>${esc(a.reason||'')}</small></li>`).join('');
    return `<section class="v152-intelligence"><div class="v152-score"><small>School Health Score</small><strong>${esc(intel.healthScore||'—')}<em>/100</em></strong><span>${esc(intel.status||'Current status')}</span></div><div class="v152-intel-main"><div class="v152-intel-grid"><article><small>Strongest area</small><b>${esc(intel.strongestArea||'—')}</b></article><article><small>Main concern</small><b>${esc(intel.mainConcern||'—')}</b></article><article><small>Trend</small><b>${esc(intel.trend||'—')}</b></article><article><small>Confidence</small><b>${esc(intel.confidence||'—')}</b></article></div><div class="v152-intel-lists"><div><h3>Data Quality Warnings</h3><ul>${warningHtml}</ul></div><div><h3>Recommended Actions</h3><ul>${actionHtml}</ul></div></div></div></section>`;
  }

  function header(role,data){ return `<header class="v152-head"><div class="v152-heading"><span><i data-lucide="trending-up"></i></span><div><h2>${esc(data.title||'Analytics')}</h2><p>${esc(data.subtitle||'Live analytics')}</p></div></div>${filterBar(role,data)}</header>`; }
  function kpis(data){ return `<div class="v152-kpis">${(data.kpis||[]).map(k=>`<article class="v152-kpi tone-${esc(k.tone||'teal')}"><span><i data-lucide="${esc(k.icon||'activity')}"></i></span><div><small>${esc(k.label)}</small><strong>${fmt(k.value)}</strong>${k.hint?`<em>${esc(k.hint)}</em>`:''}</div></article>`).join('')}</div>`; }
  function categoryForTitle(title){ const info=exportInfoForTitle(title); if(info?.category) return info.category; const t=String(title||'').toLowerCase();if(/attendance|present|absent/.test(t))return'attendance';if(/kemis|nemis|upi|capitation|enrollment|sne|compliance/.test(t))return'compliance';if(/fee|finance|collection|payment|defaulter|expense|bursary|credit|reconciliation|arrears|revenue/.test(t))return'finance';if(/teacher|staff/.test(t))return'teachers';if(/report|marks|publication|readiness/.test(t))return'reports';if(/class|subject|student|assessment|performance|mastery|leaderboard|learning|homework|task|badge|achievement|strength|support/.test(t))return'academic';return'overview';}
  function isEmptyBlock(body){ return /^<div class="v152-empty/.test(String(body||'').trim()); }
  function emptyDiagnostic(title){
    const info=exportInfoForTitle(title);
    const key=info?.key||'';
    const diag=EMPTY_DIAGNOSTICS[title] || { state: info ? 'Waiting for data' : 'Mapping needs review', icon: info ? 'database' : 'triangle-alert', required: info ? 'Backend data for this analytics section.' : 'A registered export/data key for this visual card.', action: info ? 'Add the required activity/data, then refresh analytics.' : 'Developer should add this card to the analytics registry.' };
    const category=info?.category || categoryForTitle(title);
    const connected=!!info;
    const available=key ? sectionAvailable(key) : false;
    const tone=connected ? (available ? 'ready' : 'waiting') : 'error';
    return `<div class="v152-empty v152-empty-diagnostic tone-${tone}" data-v152-empty-state="${esc(tone)}" data-v152-empty-key="${esc(key)}"><span class="v152-empty-icon"><i data-lucide="${esc(diag.icon||'database')}"></i></span><b>${esc(diag.state)}</b><p>${esc(diag.required)}</p><small>${esc(diag.action)}</small><em>${connected ? `Connected · ${category}` : 'Not connected to export registry'}</em></div>`;
  }
  function card(title,body,cls='',action=''){
    const info=exportInfoForTitle(title); const exportKey=info?.key||''; const hasData=exportKey ? sectionAvailable(exportKey) : false;
    if(isEmptyBlock(body) || (exportKey && !hasData && /<canvas\s/i.test(String(body||'')))) body = emptyDiagnostic(title);
    const exportButton=exportKey ? (hasData ? `<button type="button" title="Download only ${esc(title)}" onclick="event.stopPropagation();window.v152GenerateExport('pdf',['${esc(exportKey)}'])"><i data-lucide="download"></i><span>Download</span></button>` : `<button type="button" class="is-disabled" disabled title="No exportable data yet for ${esc(title)}"><i data-lucide="database"></i><span>No data</span></button>`) : (action?`<button type="button">${esc(action)}</button>`:'');
    const status=exportKey ? (hasData?'ready':'waiting') : 'unmapped';
    return `<section class="v152-card ${cls}" data-analytics-category="${categoryForTitle(title)}" data-v152-data-status="${status}" ${exportKey?`data-v152-card-export-key="${esc(exportKey)}"`:''}><header><h3>${esc(title)}</h3><div class="v152-card-tools"><small class="v152-data-badge ${status}">${status==='ready'?'Data ready':status==='waiting'?'Waiting for data':'Needs mapping'}</small>${exportButton}</div></header>${body}</section>`;
  }
  function empty(message='No real data is available for the selected scope yet.'){ return `<div class="v152-empty" data-v152-empty-state="generic"><i data-lucide="database"></i><p>${esc(message)}</p></div>`; }
  function chart(id){ return `<div class="v152-chart"><canvas id="${id}"></canvas><div id="${id}-fallback"></div></div>`; }
  function doughnut(id){ return `<div class="v152-chart doughnut"><canvas id="${id}"></canvas><div id="${id}-fallback"></div></div>`; }
  function progress(rows=[],key='average',labelKey='name',suffix='%'){ if(!rows.length)return empty(); return `<div class="v152-progress">${rows.map((r,i)=>{const v=number(r[key]??r.value??r.score);return `<div><span>${i+1}. ${esc(r[labelKey]||r.student||r.teacher||r.subject||'Item')}</span><i><b style="width:${Math.min(100,v)}%"></b></i><strong>${fmt(v)}${suffix}</strong></div>`;}).join('')}</div>`; }
  function table(rows=[],columns=[]){ if(!rows.length)return empty(); return `<div class="v152-table-wrap"><table><thead><tr>${columns.map(c=>`<th>${esc(c.label)}</th>`).join('')}</tr></thead><tbody>${rows.map((row,index)=>`<tr>${columns.map(c=>`<td>${c.render?c.render(row,index):esc(row[c.key]??'—')}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`; }
  function insights(rows=[]){ if(!rows.length)return empty('No alerts or insights are available.'); return `<div class="v152-insights">${rows.slice(0,8).map(x=>`<article class="tone-${esc(x.tone||'info')}"><span><i data-lucide="${esc(x.icon||'info')}"></i></span><div><b>${esc(x.title||'Insight')}</b><p>${esc(x.message||'')}</p></div><time>${esc(x.time||'')}</time></article>`).join('')}</div>`; }
  function heatmap(data){ const h=data?.charts?.attendanceHeatmap; if(!h?.weeks?.length)return empty(); return `<div class="v152-heatmap"><div></div>${(h.weekdays||[]).map(d=>`<b>${esc(d)}</b>`).join('')}${h.weeks.map(w=>`<strong>${esc(w.label)}</strong>${(w.cells||[]).map(v=>`<i class="${v>=90?'good':v>=80?'fair':'bad'}" title="${v}%">${v?Math.round(v):'—'}</i>`).join('')}`).join('')}</div>`; }

  function schoolBody(data){
    return `<div class="v152-grid">
      ${card('Attendance Trend (by Month)',chart('v152-attendance'),'span-4')}
      ${card('Class Performance (Average Score %)',chart('v152-classperf'),'span-4')}
      ${card('Subject Performance (Average Score %)',progress((data.lists?.topSubjects||[]).map(x=>({...x,subject:x.name})), 'average','subject'),'span-4')}
      ${card('Top Classes',table(data.lists?.topClasses||[],[{label:'#',render:(r,i)=>String(i+1)},{label:'Class',key:'name'},{label:'Average',render:r=>`${fmt(r.average)}%`},{label:'Marks',key:'marks'}]),'span-3')}
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
      ${card('KEMIS Readiness',table(data.lists?.kemisReadiness||[],[{label:'Metric',key:'name'},{label:'Value',key:'value'},{label:'Status',key:'status'}]),'span-4')}
      ${card('Enrollment by Gender',table(data.lists?.enrollmentByGender||[],[{label:'Gender',key:'name'},{label:'Learners',key:'value'}]),'span-4')}
      ${card('Compliance Missing Data',insights(data.lists?.complianceMissing||[]),'span-4')}
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
    ${card('Badges & Achievements',table([...(data.lists?.badges||[]),...(data.lists?.achievements||[])],[{label:'Achievement',render:r=>esc(r.name||r.title)},{label:'Status',render:r=>r.earned===true?'Earned':r.earned===false?esc(r.label||'Locked'):'Recorded'},{label:'Description',render:r=>esc(r.description||r.note||'')},{label:'Date',render:r=>updated(r.awardedAt||r.createdAt)}]),'span-4')}${card('Class Leaderboard',table(data.lists?.leaderboard||[],[{label:'Student',render:r=>`${esc(r.name)}${r.elimuid?`<small>${esc(r.elimuid)}</small>`:''}`},{label:'Average',render:r=>`${fmt(r.average)}%`}]),'span-4')}${card('Recent Alerts',insights(data.lists?.recentAlerts||[]),'span-4')}
    ${card('Timetable Summary',table(data.lists?.timetable||[],[{label:'Day',render:r=>esc(r.day||r.dayOfWeek||'—')},{label:'Time',render:r=>esc(r.startTime&&r.endTime?`${r.startTime} – ${r.endTime}`:r.time||'—')},{label:'Subject',render:r=>esc(r.subjectName||r.subject||r.learningArea||'—')},{label:'Teacher',render:r=>esc(r.teacherName||r.teacher||'—')}]),'span-12')}
  </div>`; }
  function grade(score){ const n=number(score); return n>=80?'A':n>=70?'B':n>=60?'C':n>=50?'D':n>0?'E':'—'; }

  function body(data){ if(data.variant==='platform')return platformBody(data); if(data.variant==='finance')return financeBody(data); if(data.variant==='class')return teacherBody(data); if(data.variant==='child'||data.variant==='student')return childBody(data); return schoolBody(data); }

  function exportPanel(data){
    const role=currentRole(), types=scopeTypesFor(role,data), selected=data.scope?.type||types[0]?.[0], sections=data.exportSections||[], selectedType=currentAnalyticsType();
    const sectionRows = sections.map(s => ({...s, category: s.category || categoryForSectionKey(s.key), label: s.label || SECTION_LABEL[s.key] || titleize(s.key)}));
    return `<div class="v152-export-overlay ${state.exportOpen?'open':''}" data-v152-export-overlay onclick="if(event.target===this)window.v152CloseExport()"><aside class="v152-export-panel"><header><div><h3>Export Analytics</h3><p>Choose scope, format and exact analytics sections before generating the file.</p></div><button onclick="window.v152CloseExport()"><i data-lucide="x"></i></button></header>
      <div class="v152-export-scroll"><fieldset><legend>Export Scope</legend>${types.map(([id,name])=>`<label class="v152-radio"><input type="radio" name="v152-export-scope" value="${id}" ${selected===id?'checked':''} onchange="window.v152ExportScopeChanged()"><span><b>${esc(name)}</b><small>${id==='school'?'All authorized school data':`Choose a ${esc(id)} from your authorized scope`}</small></span></label>`).join('')}<select data-v152-export-target ${selected==='school'||selected==='platform'||roleKey(role)==='student'?'hidden':''}>${scopeTargetOptions(data,selected,data.scope?.id)}</select></fieldset>
      <fieldset><legend>Export Format</legend><div class="v152-format-grid">${[['pdf','file-text','PDF Document'],['xlsx','sheet','Excel Workbook'],['csv','table-2','CSV File'],['print','printer','Print / Preview']].map(([id,icon,name],i)=>`<label><input type="radio" name="v152-export-format" value="${id}" ${i===0?'checked':''}><span><i data-lucide="${icon}"></i>${name}</span></label>`).join('')}</div></fieldset>
      <fieldset><legend>Include in Export <span class="v152-export-selectors"><button type="button" onclick="window.v152ToggleVisibleExport()">Select Visible</button><button type="button" onclick="window.v152ToggleAllExport(false)">Select None</button><button type="button" onclick="window.v152ToggleAllExport(true)">Select All</button></span></legend><div class="v152-checks">${sectionRows.map(s=>{const visible=selectedType==='overview'||s.key==='kpis'||s.category===selectedType;return `<label data-v152-export-option-category="${esc(s.category)}"><input type="checkbox" data-v152-export-section data-v152-export-category="${esc(s.category)}" value="${esc(s.key)}" ${visible?'checked':''}><span>${esc(s.label)} <small>${esc(s.category)} · ${fmt(s.count)}</small></span></label>`}).join('')||'<p>No exportable analytics are available for this scope.</p>'}</div></fieldset>
      <div class="v152-export-preview"><b>Export Preview</b><p>Scope: <span data-v152-preview-scope>${esc(data.scope?.label||'Current analytics')}</span></p><p>Items selected: <span data-v152-preview-count>${visibleExportKeys(true).length}</span></p><p>All exported data is generated from the live, authorized backend scope.</p></div></div>
      <footer><button class="secondary" onclick="window.v152CloseExport()">Cancel</button><button class="primary" onclick="window.v152GenerateExport()"><i data-lucide="download"></i>Generate Export</button></footer></aside></div>`;
  }
  function renderShell(role,data){ return `<div class="v152-shell" data-variant="${esc(data.variant||'school')}">${header(role,data)}${kpis(data)}${intelligencePanel(data)}${body(data)}<footer class="v152-updated"><span>All data is tenant-scoped and loaded from the backend database.</span><span>Last updated: ${esc(updated(data.updatedAt))}</span><button onclick="window.v152RefreshAnalytics({manual:true})"><i data-lucide="refresh-cw"></i></button><em data-v152-refresh-note></em></footer>${exportPanel(data)}</div>`; }

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

  function applyCategoryFilter(){const selected=currentAnalyticsType();const shell=document.querySelector('.v152-shell');shell?.querySelectorAll('.v152-card[data-analytics-category]').forEach(card=>{const hide=selected!=='overview'&&card.dataset.analyticsCategory!==selected;card.hidden=hide;card.style.display=hide?'none':'';});updateExportPreview();}

  async function renderAnalyticsSection(role){ state.role=role;state.data=null;state.query='';state.exportOpen=false;state.analyticsType='overview';document.body.classList.remove('v152-modal-open');try{const data=await fetchAnalytics();setTimeout(()=>{drawVariantCharts(data);applyCategoryFilter();},50);return renderShell(role,data);}catch(error){if(error?.name==='AbortError')throw error;console.error('[v152 analytics]',error);return `<div class="v152-load-error"><i data-lucide="triangle-alert"></i><h2>Analytics could not load</h2><p>${esc(error.message||'Unknown error')}</p><button onclick="showDashboardSection('analytics')">Retry</button></div>`;} }
  async function refreshAnalytics(options={}){
    const shell=document.querySelector('.v152-shell'); if(!shell)return null; if(state.refreshInFlight)return state.refreshInFlight;
    state.query=paramsFromUi().toString(); const note=shell.querySelector('[data-v152-refresh-note]'); if(note)note.textContent=options.manual?'Refreshing…':'Updating quietly…'; shell.classList.add('is-updating');
    state.refreshInFlight=(async()=>{try{const data=await fetchAnalytics();const wrapper=document.createElement('div');wrapper.innerHTML=renderShell(currentRole(),data);const next=wrapper.firstElementChild;if(next){const wasOpen=state.exportOpen;shell.innerHTML=next.innerHTML;state.exportOpen=wasOpen;const overlay=shell.querySelector('[data-v152-export-overlay]');overlay?.classList.toggle('open',wasOpen);}setTimeout(()=>{drawVariantCharts(data);applyCategoryFilter();},30);state.lastRenderAt=Date.now();return data;}catch(error){if(error?.name==='AbortError')return null;console.error('[v152 analytics refresh]',error);if(note)note.textContent='Update failed; existing data kept.';return null;}finally{state.refreshInFlight=null;shell.classList.remove('is-updating');}})();return state.refreshInFlight;
  }

  function scopeTypeChanged(select){ const data=state.data||{}; const type=select.value; let target=document.querySelector('[data-v152-scope-target]'); const label=select.closest('.v152-filterbar'); if(type==='school'||type==='platform'){target?.closest('label')?.remove();state.query=paramsFromUi().toString();refreshAnalytics({filter:true});return;} if(!target){const wrap=document.createElement('label');wrap.innerHTML=`Choose ${esc(type)}<select data-v152-filter="scopeId" data-v152-scope-target></select>`;select.closest('label').after(wrap);target=wrap.querySelector('select');}target.innerHTML=scopeTargetOptions(data,type,'');target.closest('label').childNodes[0].textContent=`Choose ${type}`;}
  document.addEventListener('change',event=>{
    const el=event.target;
    if(el.matches('[data-v152-scope-type]')){scopeTypeChanged(el);return;}
    if(el.matches('[data-v152-filter="analyticsType"]')){state.analyticsType=el.value||'overview';applyCategoryFilter();return;}
    if(el.matches('[data-v152-filter="childId"]')){
      if(typeof window.setStoredSelectedChildId==='function')window.setStoredSelectedChildId(el.value);
      if(window.dashboardData){window.dashboardData.selectedChildId=el.value;window.parentDashboardData=window.dashboardData;}
      refreshAnalytics({filter:true});return;
    }
    if(el.matches('[data-v152-filter]')){if(el.matches('[data-v152-scope-target]')&&!el.value)return;refreshAnalytics({filter:true});}
    if(el.matches('[data-v152-export-section]'))updateExportPreview();
  });

  function openExport(){state.exportOpen=true;document.querySelector('[data-v152-export-overlay]')?.classList.add('open');document.body.classList.add('v152-modal-open');updateExportPreview();try{lucide?.createIcons?.();}catch(_){} }
  function closeExport(){state.exportOpen=false;document.querySelector('[data-v152-export-overlay]')?.classList.remove('open');document.body.classList.remove('v152-modal-open');}
  function exportScopeChanged(){ const data=state.data||{}; const type=document.querySelector('input[name="v152-export-scope"]:checked')?.value||data.scope?.type||'school'; const target=document.querySelector('[data-v152-export-target]'); if(target){target.hidden=type==='school'||type==='platform'||roleKey(currentRole())==='student';target.innerHTML=scopeTargetOptions(data,type,type===data.scope?.type?data.scope?.id:'');}updateExportPreview(); }
  function updateExportPreview(){
    const count=document.querySelectorAll('[data-v152-export-section]:checked').length;
    const target=document.querySelector('[data-v152-preview-count]'); if(target)target.textContent=String(count);
    const type=document.querySelector('input[name="v152-export-scope"]:checked')?.value||state.data?.scope?.type;
    const option=document.querySelector('[data-v152-export-target] option:checked');
    const scope=document.querySelector('[data-v152-preview-scope]'); if(scope)scope.textContent=(type==='school'?'Whole School':type==='platform'?'All Schools':option?.textContent||titleize(type));
  }
  function toggleAllExport(on){document.querySelectorAll('[data-v152-export-section]').forEach(c=>c.checked=!!on);updateExportPreview();}
  function toggleVisibleExport(){ const selected=currentAnalyticsType(); document.querySelectorAll('[data-v152-export-section]').forEach(c=>{ const cat=c.dataset.v152ExportCategory || categoryForSectionKey(c.value); c.checked = selected==='overview' || c.value==='kpis' || cat===selected; }); updateExportPreview(); }
  async function generateExport(preferredFormat=null, includeOverride=null){
    const button=document.querySelector('.v152-export-panel footer .primary'); if(button){button.disabled=true;button.innerHTML='<span class="v152-spinner"></span>Generating…';}
    try{
      const quick = !!preferredFormat || Array.isArray(includeOverride);
      const format=preferredFormat || document.querySelector('input[name="v152-export-format"]:checked')?.value || 'pdf';
      const currentScope = state.data?.scope || {};
      const scopeType=quick ? (currentScope.type || state.data?.variant || 'school') : (document.querySelector('input[name="v152-export-scope"]:checked')?.value||currentScope.type||'school');
      const selfStudentId = roleKey(currentRole())==='student' ? (state.data?.student?.id || currentScope.id || '') : '';
      const scopeId=quick ? (currentScope.id || selfStudentId || '') : ((scopeType==='school'||scopeType==='platform')?'':selfStudentId||document.querySelector('[data-v152-export-target]')?.value||'');
      if(!scopeId&&scopeType!=='school'&&scopeType!=='platform'&&!quick)throw new Error(`Select the ${scopeType} to export.`);
      let include = [];
      if (Array.isArray(includeOverride)) include = includeOverride;
      else if (preferredFormat) include = visibleExportKeys(true);
      else include = [...document.querySelectorAll('[data-v152-export-section]:checked')].map(x=>x.value);
      include = [...new Set(include)].filter(Boolean);
      if(!include.length)throw new Error('Select at least one analytics section to export.');
      const filters=Object.fromEntries(paramsFromUi().entries()); filters.scopeType=scopeType; filters.scopeId=scopeId; filters.analyticsType=currentAnalyticsType();
      const token=localStorage.getItem('authToken')||localStorage.getItem('token')||'';
      const response=await fetch(`${API_BASE_URL}/api/analytics/export`,{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:JSON.stringify({format,scopeType,scopeId,include,filters,analyticsType:filters.analyticsType,childId:filters.childId||state.data?.student?.id})});
      if(!response.ok){let message='Export failed';try{message=(await response.json()).message||message;}catch(_){}throw new Error(message);}
      const disposition=response.headers.get('content-disposition')||'';const filename=disposition.match(/filename="?([^";]+)"?/i)?.[1]||`shule-ai-analytics.${format==='print'?'html':format}`;
      const blob=await response.blob();const url=URL.createObjectURL(blob);
      if(format==='print'){window.open(url,'_blank','noopener');setTimeout(()=>URL.revokeObjectURL(url),120000);}else{const a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);}
      showToast?.('Analytics export generated successfully.','success');if(!preferredFormat&&!Array.isArray(includeOverride))closeExport();
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
  window.v152ToggleVisibleExport=toggleVisibleExport;
  window.v152GenerateExport=generateExport;
  window.v152RedrawAnalyticsCharts=redrawCharts;
})();
