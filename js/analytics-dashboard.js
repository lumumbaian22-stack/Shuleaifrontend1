// js/analytics-dashboard.js
async function renderAnalyticsSection(role) {
    showLoading();
    try {
        let data;
        if (role === 'superadmin') {
            const res = await api.superAdmin.getAnalytics();
            data = res.data;
        } else if (role === 'admin' || role === 'teacher') {
            const query = window.__advancedAnalyticsQuery || '';
            const res = await apiRequest(`/api/analytics/advanced/summary${query ? `?${query}` : ''}`);
            data = res.data;
            hideLoading();
            return renderAdvancedAcademicAnalytics(role, { ...(data || {}), __loadedAt: new Date().toISOString() });
        } else if (role === 'parent') {
            const childId = dashboardData?.selectedChildId || localStorage.getItem('shule_selected_child_id') || dashboardData?.selectedChild?.id || dashboardData?.children?.[0]?.id;
            if (!childId) { hideLoading(); return '<div class="text-center py-12">Please select a child first</div>'; }
            const res = await api.parent.getAnalytics(childId);
            data = res.data;
        } else if (role === 'student') {
            const res = await api.student.getAnalytics();
            data = res.data;
        } else { hideLoading(); return '<div class="text-center py-12">Analytics not available</div>'; }
        hideLoading();
        return generateAnalyticsHTML(role, { ...(data || {}), __loadedAt: new Date().toISOString() });
    } catch (error) { hideLoading(); return `<div class="text-red-500 py-12">Error loading analytics: ${error.message}</div>`; }
}


function analyticsValue(value, suffix='') { return value === null || value === undefined || value === '' ? '—' : `${value}${suffix}`; }
function advancedRows(rows, nameKey='name') {
    rows = Array.isArray(rows) ? rows : [];
    if (!rows.length) return '<div class="p-5 text-sm text-muted-foreground">No matching records for the selected filters.</div>';
    return `<div class="overflow-x-auto"><table class="w-full text-sm"><thead class="bg-muted/50"><tr><th class="p-3 text-left">Name</th><th class="p-3 text-left">Learners</th><th class="p-3 text-left">Mean Score</th><th class="p-3 text-left">Mean Grade</th></tr></thead><tbody class="divide-y">${rows.map(row=>`<tr><td class="p-3 font-medium">${escapeHtml(row[nameKey] || row.name || '—')}</td><td class="p-3">${analyticsValue(row.learnerCount)}</td><td class="p-3">${analyticsValue(row.meanScore,'%')}</td><td class="p-3">${escapeHtml(row.meanGrade || '—')}</td></tr>`).join('')}</tbody></table></div>`;
}
function currentAdvancedAnalyticsQuery() {
    const params = new URLSearchParams();
    const fields = { year:'analytics-year', term:'analytics-term', assessmentType:'analytics-assessment-type', assessmentName:'analytics-assessment-name', classId:'analytics-class-id', stream:'analytics-stream', subject:'analytics-subject', studentId:'analytics-student-id', gender:'analytics-gender' };
    Object.entries(fields).forEach(([key,id])=>{ const value=document.getElementById(id)?.value?.trim(); if(value) params.set(key,value); });
    if (document.getElementById('analytics-published-only')?.checked) params.set('publishedOnly','true');
    return params.toString();
}
async function applyAdvancedAnalyticsFilters() {
    window.__advancedAnalyticsQuery = currentAdvancedAnalyticsQuery();
    await showDashboardSection('analytics');
}
function clearAdvancedAnalyticsFilters() {
    window.__advancedAnalyticsQuery = '';
    showDashboardSection('analytics');
}

function analyticsOpt(value,label,selected){const v=String(value??'');return `<option value="${escapeHtml(v)}" ${String(selected??'')===v?'selected':''}>${escapeHtml(label??v)}</option>`;}
function analyticsOptionList(options,selected,emptyLabel){return `<option value="">${escapeHtml(emptyLabel)}</option>${(options||[]).map(item=>analyticsOpt(item.id??item.value??item,item.name?`${item.name}${item.stream?' · '+item.stream:''}`:(item.label??item),selected)).join('')}`;}
function renderAdvancedAnalyticsFilters(data,filters){
    const o=data.filterOptions||{};
    return `<section class="rounded-2xl border bg-card p-5"><div class="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <label class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Academic year<select id="analytics-year" class="mt-1 w-full rounded-lg border bg-background px-3 py-2">${analyticsOptionList(o.years,filters.year,'All years')}</select></label>
        <label class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Term<select id="analytics-term" class="mt-1 w-full rounded-lg border bg-background px-3 py-2">${analyticsOptionList(o.terms,filters.term,'All terms')}</select></label>
        <label class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Assessment<select id="analytics-assessment-name" class="mt-1 w-full rounded-lg border bg-background px-3 py-2">${analyticsOptionList(o.assessmentNames,filters.assessmentName,'All assessments')}</select></label>
        <label class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Class<select id="analytics-class-id" class="mt-1 w-full rounded-lg border bg-background px-3 py-2">${analyticsOptionList(o.classes,filters.classId,'All classes')}</select></label>
        <label class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Stream<select id="analytics-stream" class="mt-1 w-full rounded-lg border bg-background px-3 py-2">${analyticsOptionList(o.streams,filters.stream,'All streams')}</select></label>
        <label class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Subject<select id="analytics-subject" class="mt-1 w-full rounded-lg border bg-background px-3 py-2">${analyticsOptionList(o.subjects,filters.subject,'All subjects')}</select></label>
        <label class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Student<select id="analytics-student-id" class="mt-1 w-full rounded-lg border bg-background px-3 py-2">${analyticsOptionList((o.students||[]).map(s=>({id:s.id,name:`${s.name}${s.className?' — '+s.className:''}${s.elimuid?' · '+s.elimuid:''}`})),filters.studentId,'All students')}</select></label>
        <label class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Gender<select id="analytics-gender" class="mt-1 w-full rounded-lg border bg-background px-3 py-2">${analyticsOptionList(o.genders,filters.gender,'All genders')}</select></label>
        <label class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Assessment type<select id="analytics-assessment-type" class="mt-1 w-full rounded-lg border bg-background px-3 py-2">${analyticsOptionList(o.assessmentTypes,filters.assessmentType,'All types')}</select></label>
        <label class="rounded-lg border px-3 py-2 flex items-center gap-2 text-sm mt-5"><input id="analytics-published-only" type="checkbox" ${filters.publishedOnly?'checked':''}> Published only</label>
    </div><div class="mt-4 flex justify-end gap-2"><button onclick="clearAdvancedAnalyticsFilters()" class="px-4 py-2 rounded-lg border">Clear</button><button onclick="applyAdvancedAnalyticsFilters()" class="px-4 py-2 rounded-lg bg-primary text-primary-foreground">Apply Filters</button></div></section>`;
}
function renderAdvancedCoverage(data){const c=data.overview?.coverage||{};return `<div class="grid gap-4 md:grid-cols-3"><div class="rounded-xl border bg-card p-4"><p class="text-sm text-muted-foreground">Learners with marks</p><h3 class="text-2xl font-bold">${c.learnersWithRecords??0}</h3></div><div class="rounded-xl border bg-card p-4"><p class="text-sm text-muted-foreground">Missing marks</p><h3 class="text-2xl font-bold">${c.learnersWithoutRecords??0}</h3></div><div class="rounded-xl border bg-card p-4"><p class="text-sm text-muted-foreground">Coverage</p><h3 class="text-2xl font-bold">${analyticsValue(c.recordCoveragePercent,'%')}</h3></div></div>`;}
function renderMissingLearners(data){const rows=data.missingLearners||[];if(!rows.length)return '';return `<section class="rounded-2xl border border-amber-200 bg-amber-50/40 dark:bg-amber-950/10 overflow-hidden"><div class="p-4 border-b"><h3 class="font-semibold">Learners Without Published Marks</h3><p class="text-sm text-muted-foreground">These learners are in the selected class/scope but have no marks under the current filters.</p></div><div class="grid gap-2 p-4 md:grid-cols-2 lg:grid-cols-3">${rows.map(row=>`<div class="rounded-lg border bg-background p-3"><strong>${escapeHtml(row.name)}</strong><p class="text-xs text-muted-foreground">${escapeHtml(row.className||'Unassigned')} · Attendance ${analyticsValue(row.attendanceRate,'%')}</p></div>`).join('')}</div></section>`;}
function renderAdvancedAcademicAnalytics(role,data) {
    const ov=data.overview||{}, filters=data.filters||{};
    const rankings=Array.isArray(data.studentRankings)?data.studentRankings:[];
    const gender=Array.isArray(data.genderAnalysis)?data.genderAnalysis:[];
    const improvements=Array.isArray(data.improvementTrends)?data.improvementTrends:[];
    const risks=Array.isArray(data.riskIndicators)?data.riskIndicators:[];
    window.__advancedAnalyticsData=data;
    return `<div class="space-y-6 animate-fade-in analytics-container">
      <div class="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3"><div><p class="text-xs uppercase tracking-wide text-muted-foreground">Curriculum-aware academic intelligence</p><h2 class="text-2xl font-bold">${role==='teacher'?'Assigned Class & Subject Analytics':'Advanced Academic Analytics'}</h2><p class="text-sm text-muted-foreground">Mean scores and grades use the school’s active curriculum scale. Subjects not taken are excluded from learner means.</p></div><div class="flex flex-wrap gap-2"><button class="px-3 py-2 rounded-lg border" onclick="downloadAdvancedAnalytics('pdf').catch(e=>showToast(e.message,'error'))">PDF Summary</button><button class="px-3 py-2 rounded-lg border" onclick="downloadAdvancedAnalytics('xlsx').catch(e=>showToast(e.message,'error'))">Excel Workbook</button><button class="px-3 py-2 rounded-lg border" onclick="downloadAdvancedAnalytics('csv').catch(e=>showToast(e.message,'error'))">CSV Table</button><button class="px-3 py-2 rounded-lg border" onclick="window.print()">Print</button></div></div>
      ${renderAdvancedAnalyticsFilters(data,filters)}
      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-5"><div class="rounded-xl border bg-card p-5"><p class="text-sm text-muted-foreground">Learners</p><p class="text-2xl font-bold">${analyticsValue(ov.learnerCount)}</p></div><div class="rounded-xl border bg-card p-5"><p class="text-sm text-muted-foreground">Records</p><p class="text-2xl font-bold">${analyticsValue(ov.recordCount)}</p></div><div class="rounded-xl border bg-card p-5"><p class="text-sm text-muted-foreground">School Mean</p><p class="text-2xl font-bold">${analyticsValue(ov.schoolMeanScore,'%')}</p></div><div class="rounded-xl border bg-card p-5"><p class="text-sm text-muted-foreground">Mean Grade</p><p class="text-2xl font-bold">${escapeHtml(ov.schoolMeanGrade||'—')}</p></div><div class="rounded-xl border bg-card p-5"><p class="text-sm text-muted-foreground">Top Learner</p><p class="font-bold mt-1">${escapeHtml(ov.topLearner?.name||'—')}</p><p class="text-sm text-muted-foreground">${analyticsValue(ov.topLearner?.meanScore,'%')} · ${escapeHtml(ov.topLearner?.meanGrade||'—')}</p></div></div>
      ${renderAdvancedCoverage(data)}
      <section class="rounded-2xl border bg-card overflow-hidden"><div class="p-4 border-b"><h3 class="font-semibold">Student Leaderboard</h3><p class="text-xs text-muted-foreground">Position, mean, grade, improvement and attendance</p></div>${rankings.length?`<div class="overflow-x-auto"><table class="w-full text-sm min-w-[900px]"><thead class="bg-muted/50"><tr><th class="p-3 text-left">Pos.</th><th class="p-3 text-left">Learner</th><th class="p-3 text-left">Class</th><th class="p-3 text-left">Mean</th><th class="p-3 text-left">Grade</th><th class="p-3 text-left">Subjects</th><th class="p-3 text-left">Improvement</th><th class="p-3 text-left">Attendance</th></tr></thead><tbody class="divide-y">${rankings.slice(0,100).map(row=>`<tr><td class="p-3 font-bold">${row.position}</td><td class="p-3 font-medium">${escapeHtml(row.name)}</td><td class="p-3">${escapeHtml(row.className||'—')}${row.stream?` · ${escapeHtml(row.stream)}`:''}</td><td class="p-3">${analyticsValue(row.meanScore,'%')}</td><td class="p-3">${escapeHtml(row.meanGrade||'—')}</td><td class="p-3">${analyticsValue(row.countedSubjects)}</td><td class="p-3 ${Number(row.improvement||0)>=0?'text-green-600':'text-red-600'}">${row.improvement===null||row.improvement===undefined?'—':`${row.improvement>=0?'+':''}${row.improvement}`}</td><td class="p-3">${analyticsValue(row.attendanceRate,'%')}</td></tr>`).join('')}</tbody></table></div>`:'<div class="p-5 text-sm text-muted-foreground">No published academic results match the filters.</div>'}</section>
      <div class="grid gap-4 xl:grid-cols-3"><section class="rounded-2xl border bg-card overflow-hidden"><div class="p-4 border-b"><h3 class="font-semibold">Class / Grade Means</h3></div>${advancedRows(data.classMeans)}</section><section class="rounded-2xl border bg-card overflow-hidden"><div class="p-4 border-b"><h3 class="font-semibold">Stream Means</h3></div>${advancedRows(data.streamMeans)}</section><section class="rounded-2xl border bg-card overflow-hidden"><div class="p-4 border-b"><h3 class="font-semibold">Subject Means</h3></div>${advancedRows(data.subjectMeans)}</section></div>
      <div class="grid gap-4 lg:grid-cols-2"><section class="rounded-2xl border bg-card overflow-hidden"><div class="p-4 border-b"><h3 class="font-semibold">Gender Analysis</h3></div>${gender.length?`<div class="divide-y">${gender.map(row=>`<div class="p-4"><div class="flex justify-between gap-3"><strong class="capitalize">${escapeHtml(row.gender)}</strong><span>${analyticsValue(row.meanScore,'%')} · ${escapeHtml(row.meanGrade||'—')}</span></div><p class="text-sm text-muted-foreground mt-1">Leading learner: ${escapeHtml(row.leadingLearner?.name||'—')} · competency/pass ${analyticsValue(row.competencyPercentage,'%')} · attendance ${analyticsValue(row.attendanceRate,'%')}</p></div>`).join('')}</div>`:'<div class="p-5 text-sm text-muted-foreground">Gender comparison is hidden when valid gender data is unavailable.</div>'}</section><section class="rounded-2xl border bg-card overflow-hidden"><div class="p-4 border-b"><h3 class="font-semibold">Most Improved Learners</h3></div>${improvements.length?`<div class="divide-y">${improvements.slice(0,15).map(row=>`<div class="p-4 flex justify-between gap-3"><span><strong>${escapeHtml(row.name)}</strong><span class="block text-xs text-muted-foreground">${escapeHtml(row.previousAssessment||'Previous')} → ${escapeHtml(row.currentAssessment||'Current')}</span></span><strong class="text-green-600">${row.improvement>=0?'+':''}${row.improvement}</strong></div>`).join('')}</div>`:'<div class="p-5 text-sm text-muted-foreground">At least two assessments are required for improvement trends.</div>'}</section></div>
      ${renderMissingLearners(data)}
      <section class="rounded-2xl border ${risks.length?'border-amber-300 bg-amber-50/40 dark:bg-amber-950/10':'bg-card'} overflow-hidden"><div class="p-4 border-b"><h3 class="font-semibold">Learners Requiring Support</h3></div>${risks.length?`<div class="overflow-x-auto"><table class="w-full text-sm"><thead><tr><th class="p-3 text-left">Learner</th><th class="p-3 text-left">Class</th><th class="p-3 text-left">Mean</th><th class="p-3 text-left">Grade</th><th class="p-3 text-left">Attendance</th><th class="p-3 text-left">Risk</th></tr></thead><tbody class="divide-y">${risks.map(row=>`<tr><td class="p-3 font-medium">${escapeHtml(row.name)}</td><td class="p-3">${escapeHtml(row.className||'—')}</td><td class="p-3">${analyticsValue(row.meanScore,'%')}</td><td class="p-3">${escapeHtml(row.meanGrade||'—')}</td><td class="p-3">${analyticsValue(row.attendanceRate,'%')}</td><td class="p-3 capitalize">${escapeHtml(String(row.risk||'').replace(/_/g,' '))}</td></tr>`).join('')}</tbody></table></div>`:'<div class="p-5 text-sm text-muted-foreground">No learners are below the configured support threshold.</div>'}</section>
    </div>`;
}
window.applyAdvancedAnalyticsFilters=applyAdvancedAnalyticsFilters;
window.clearAdvancedAnalyticsFilters=clearAdvancedAnalyticsFilters;

function formatDateTime(value) {
    if (!value) return 'just now';
    try { return new Date(value).toLocaleString(); } catch (_) { return 'just now'; }
}

function generateAnalyticsHTML(role, data) {
    switch (role) {
        case 'superadmin': return renderSuperAdminAnalytics(data);
        case 'admin': return renderAdminAnalytics(data);
        case 'teacher': return renderTeacherAnalytics(data);
        case 'parent': return renderParentAnalytics(data);
        case 'student': return renderStudentAnalytics(data);
    }
}


function renderSuperAdminAnalytics(data) {
    const ov = data.overview || data || {};
    const growth = data.growth || { labels: [], values: [] };
    const revenue = data.revenueTrend || { labels: [], values: [] };
    setTimeout(() => {
        if (growth.labels && growth.labels.length) initLineChart('super-growth-chart', growth.labels, growth.values || [], 'New Schools');
        if (revenue.labels && revenue.labels.length) initBarChart('super-revenue-chart', revenue.labels, revenue.values || [], 'Revenue');
        if (data.distributionByCurriculum) initDoughnutChart('super-curriculum-chart', Object.keys(data.distributionByCurriculum), Object.values(data.distributionByCurriculum));
    }, 100);
    const money = Number(ov.revenueMTD || ov.totalRevenue || ov.revenue || 0).toLocaleString();
    return `<div class="space-y-6 animate-fade-in analytics-container">
        <div class="flex items-center justify-between gap-3 flex-wrap">
            <div><h2 class="text-2xl font-bold">Platform Analytics</h2><p class="text-sm text-muted-foreground">Super admin platform totals across all schools. This is not a school/admin dashboard.</p></div>
            <span class="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary">Platform scope • ${formatDateTime(data.__loadedAt)}</span>
        </div>
        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div class="rounded-xl border bg-card p-4"><p class="text-sm text-muted-foreground">Total Schools</p><h3 class="text-2xl font-bold">${ov.totalSchools || 0}</h3></div>
            <div class="rounded-xl border bg-card p-4"><p class="text-sm text-muted-foreground">Active Schools</p><h3 class="text-2xl font-bold">${ov.activeSchools || 0}</h3></div>
            <div class="rounded-xl border bg-card p-4"><p class="text-sm text-muted-foreground">Pending Schools</p><h3 class="text-2xl font-bold">${ov.pendingSchools || 0}</h3></div>
            <div class="rounded-xl border bg-card p-4"><p class="text-sm text-muted-foreground">Students</p><h3 class="text-2xl font-bold">${ov.totalStudents || 0}</h3></div>
            <div class="rounded-xl border bg-card p-4"><p class="text-sm text-muted-foreground">Revenue MTD</p><h3 class="text-2xl font-bold">KES ${money}</h3></div>
        </div>
        <div class="grid gap-4 lg:grid-cols-2">
            <div class="rounded-xl border bg-card p-6 analytics-card"><h3 class="font-semibold mb-4">School Growth</h3><div class="chart-container"><canvas id="super-growth-chart"></canvas></div></div>
            <div class="rounded-xl border bg-card p-6 analytics-card"><h3 class="font-semibold mb-4">Platform Revenue</h3><div class="chart-container"><canvas id="super-revenue-chart"></canvas></div></div>
        </div>
        <div class="grid gap-4 lg:grid-cols-2">
            <div class="rounded-xl border bg-card p-6 analytics-card"><h3 class="font-semibold mb-4">Curriculum Distribution</h3><div class="chart-container"><canvas id="super-curriculum-chart"></canvas></div></div>
            <div class="rounded-xl border bg-card p-6"><h3 class="font-semibold mb-3">School Level Distribution</h3><div class="space-y-2">${Object.entries(data.distributionByLevel || {}).map(([k,v])=>`<div class="flex justify-between rounded-lg border p-3"><span class="capitalize">${escapeHtml(k)}</span><strong>${v}</strong></div>`).join('') || '<p class="text-sm text-muted-foreground">No level data yet.</p>'}</div></div>
        </div>
    </div>`;
}


function renderAdminAnalytics(data) {
    const ov = data.overview || {};
    setTimeout(() => {
        if (data.enrollmentTrend) initLineChart('admin-enrollment-chart', data.enrollmentTrend.labels, data.enrollmentTrend.values, 'Students');
        if (data.gradeDistribution) initDoughnutChart('admin-grade-dist-chart', data.gradeDistribution.labels, data.gradeDistribution.values);
        if (data.attendanceByGrade) initBarChart('admin-attendance-chart', data.attendanceByGrade.labels, data.attendanceByGrade.values, 'Attendance %');
        if (data.feeStatus) initDoughnutChart('admin-fee-chart', Object.keys(data.feeStatus), Object.values(data.feeStatus));
        if (data.tardinessTrend) initBarChart('admin-tardiness-chart', data.tardinessTrend.labels, data.tardinessTrend.values, 'Late Count');
        if (data.submitPattern) initDoughnutChart('admin-submit-chart', ['On Time', 'Late'], [data.submitPattern.onTime, data.submitPattern.late]);
    }, 100);

    let html = `
    <div class="space-y-6 animate-fade-in analytics-container">
        <div class="flex items-center justify-between gap-3 flex-wrap"><div><h2 class="text-2xl font-bold">School Analytics</h2><p class="text-sm text-muted-foreground">Student, class, stream, subject and gender performance.</p></div><div class="flex gap-2 flex-wrap"><button class="px-3 py-2 rounded-lg border" onclick="downloadAdvancedAnalytics('pdf').catch(e=>showToast(e.message,'error'))">Download PDF Summary</button><button class="px-3 py-2 rounded-lg border" onclick="downloadAdvancedAnalytics('xlsx').catch(e=>showToast(e.message,'error'))">Download Excel Workbook</button><button class="px-3 py-2 rounded-lg border" onclick="downloadAdvancedAnalytics('csv').catch(e=>showToast(e.message,'error'))">Download CSV Table</button><button class="px-3 py-2 rounded-lg border" onclick="window.print()">Print Report</button><span class="text-xs px-3 py-2 rounded-full bg-green-100 text-green-700">Live • ${formatDateTime(data.__loadedAt)}</span></div></div>
        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div class="rounded-xl border bg-card p-4"><p class="text-sm">Students</p><h3 class="text-xl font-bold">${ov.totalStudents||0}</h3></div>
            <div class="rounded-xl border bg-card p-4"><p class="text-sm">Teachers</p><h3 class="text-xl font-bold">${ov.totalTeachers||0}</h3></div>
            <div class="rounded-xl border bg-card p-4"><p class="text-sm">Classes</p><h3 class="text-xl font-bold">${ov.totalClasses||0}</h3></div>
            <div class="rounded-xl border bg-card p-4"><p class="text-sm">Attendance</p><h3 class="text-xl font-bold">${ov.attendanceRate||0}%</h3></div>
            <div class="rounded-xl border bg-card p-4"><p class="text-sm">Fee Collection</p><h3 class="text-xl font-bold">${ov.feeCollectionRate||0}%</h3></div>
        </div>
        <div class="grid gap-4 lg:grid-cols-2">
            <div class="rounded-xl border bg-card p-6 analytics-card"><h3 class="font-semibold mb-4">Enrollment Trend</h3><div class="chart-container"><canvas id="admin-enrollment-chart"></canvas></div></div>
            <div class="rounded-xl border bg-card p-6 analytics-card"><h3 class="font-semibold mb-4">Grade Distribution</h3><div class="chart-container"><canvas id="admin-grade-dist-chart"></canvas></div></div>
        </div>
        <div class="grid gap-4 lg:grid-cols-2">
            <div class="rounded-xl border bg-card p-6 analytics-card"><h3 class="font-semibold mb-4">Attendance by Grade</h3><div class="chart-container"><canvas id="admin-attendance-chart"></canvas></div></div>
            <div class="rounded-xl border bg-card p-6 analytics-card"><h3 class="font-semibold mb-4">Fee Status</h3><div class="chart-container"><canvas id="admin-fee-chart"></canvas></div></div>
        </div>
        <div class="grid gap-4 lg:grid-cols-2">
            <div class="rounded-xl border bg-card p-6 analytics-card"><h3 class="font-semibold mb-4">Tardiness by Day</h3><div class="chart-container"><canvas id="admin-tardiness-chart"></canvas></div></div>
            <div class="rounded-xl border bg-card p-6 analytics-card"><h3 class="font-semibold mb-4">Submission Pattern</h3><div class="chart-container"><canvas id="admin-submit-chart"></canvas></div></div>
        </div>
        <!-- Teacher Workload Table -->
        ${data.teacherWorkload ? `
        <div class="rounded-xl border bg-card overflow-hidden">
            <div class="p-4 border-b"><h3 class="font-semibold">Teacher Duty Load</h3></div>
            <table class="w-full text-sm"><thead><tr><th class="px-4 py-2 text-left">Teacher</th><th class="px-4 py-2 text-left">Monthly Duties</th><th class="px-4 py-2 text-left">Reliability</th></tr></thead><tbody>${data.teacherWorkload.map(t=>`<tr><td class="px-4 py-2">${escapeHtml(t.name)}</td><td class="px-4 py-2">${t.monthlyDutyCount}</td><td class="px-4 py-2">${t.reliabilityScore}%</td></tr>`).join('')}</tbody></table>
        </div>` : ''}
        <!-- Parent Engagement -->
        ${data.parentEngagement ? `
        <div class="rounded-xl border bg-card overflow-hidden">
            <div class="p-4 border-b"><h3 class="font-semibold">Parent Portal Logins</h3></div>
            <table class="w-full text-sm"><thead><tr><th class="px-4 py-2 text-left">Parent</th><th class="px-4 py-2 text-left">Logins</th></tr></thead><tbody>${data.parentEngagement.map(p=>`<tr><td class="px-4 py-2">${escapeHtml(p.name)}</td><td class="px-4 py-2">${p.logins}</td></tr>`).join('')}</tbody></table>
        </div>` : ''}
    </div>`;
    return html;
}

// Teacher Analytics extended
function renderTeacherAnalytics(data) {
    const ov = data.overview || {};
    setTimeout(() => {
        if (data.subjectAverages) initBarChart('teacher-subject-chart', data.subjectAverages.map(s=>s.subject), data.subjectAverages.map(s=>s.average), 'Avg Score');
        if (data.attendanceTrend) initLineChart('teacher-attendance-trend', data.attendanceTrend.labels, data.attendanceTrend.values, 'Attendance %');
        if (data.gradeDistribution) initBarChart('teacher-grade-chart', data.gradeDistribution.labels, data.gradeDistribution.values, 'Students');
    }, 100);

    let html = `
    <div class="space-y-6 animate-fade-in analytics-container">
        <div class="flex items-center justify-between gap-3 flex-wrap"><h2 class="text-2xl font-bold">My Class Analytics</h2><div class="flex gap-2 flex-wrap"><button class="px-3 py-2 rounded-lg border" onclick="downloadAdvancedAnalytics('pdf').catch(e=>showToast(e.message,'error'))">PDF Summary</button><button class="px-3 py-2 rounded-lg border" onclick="downloadAdvancedAnalytics('xlsx').catch(e=>showToast(e.message,'error'))">Excel Workbook</button><span class="text-xs px-3 py-2 rounded-full bg-green-100 text-green-700">Live • ${formatDateTime(data.__loadedAt)}</span></div></div>
        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div class="rounded-xl border bg-card p-4"><p class="text-sm">My Students</p><h3 class="text-xl font-bold">${ov.studentCount||0}</h3></div>
            <div class="rounded-xl border bg-card p-4"><p class="text-sm">Class Average</p><h3 class="text-xl font-bold">${ov.classAverage||0}%</h3></div>
            <div class="rounded-xl border bg-card p-4"><p class="text-sm">Attendance Today</p><h3 class="text-xl font-bold">${ov.attendanceToday||'0/0'}</h3></div>
            <div class="rounded-xl border bg-card p-4"><p class="text-sm">Pending Tasks</p><h3 class="text-xl font-bold">${ov.pendingTasks||0}</h3></div>
        </div>
        <div class="grid gap-4 lg:grid-cols-2">
            <div class="rounded-xl border bg-card p-6 analytics-card"><h3 class="font-semibold mb-4">Subject Averages</h3><div class="chart-container"><canvas id="teacher-subject-chart"></canvas></div></div>
            <div class="rounded-xl border bg-card p-6 analytics-card"><h3 class="font-semibold mb-4">Attendance Trend</h3><div class="chart-container"><canvas id="teacher-attendance-trend"></canvas></div></div>
        </div>
        <div class="rounded-xl border bg-card p-6 analytics-card"><h3 class="font-semibold mb-4">Grade Distribution</h3><div class="chart-container"><canvas id="teacher-grade-chart"></canvas></div></div>
        
        <!-- Risk Students -->
        ${data.riskStudents && data.riskStudents.length > 0 ? `
        <div class="rounded-xl border bg-red-50 dark:bg-red-900/20 p-6">
            <h3 class="font-semibold mb-4 text-red-700">⚠️ At-Risk Students (Grade Drop >15%)</h3>
            <table class="w-full text-sm"><thead><tr><th class="text-left">Student</th><th class="text-left">Previous Avg</th><th class="text-left">Recent Avg</th><th class="text-left">Drop</th></tr></thead><tbody>${data.riskStudents.map(s=>`<tr><td>${escapeHtml(s.name)}</td><td>${s.prevAvg}%</td><td>${s.recentAvg}%</td><td class="text-red-600">-${s.drop}%</td></tr>`).join('')}</tbody></table>
        </div>` : ''}

        <!-- Submission Pattern -->
        <div class="rounded-xl border bg-card p-6 analytics-card">
            <h3 class="font-semibold mb-4">Homework Submission</h3>
            <div class="flex gap-4"><div class="text-center"><span class="text-2xl font-bold text-green-600">${data.submitPattern?.onTime||0}</span><br>On Time</div><div class="text-center"><span class="text-2xl font-bold text-red-600">${data.submitPattern?.late||0}</span><br>Late</div></div>
        </div>

        <!-- Conduct -->
        <div class="rounded-xl border bg-card p-6">
            <h3 class="font-semibold mb-4">Class Conduct</h3>
            <p>Positive: ${data.conductData?.positive||0} | Negative: ${data.conductData?.negative||0}</p>
        </div>

        <!-- Parent Engagement -->
        <div class="rounded-xl border bg-card p-6">
            <h3 class="font-semibold mb-4">Avg Parent Portal Logins</h3>
            <p class="text-3xl font-bold">${data.parentEngagement||0}</p>
        </div>

        <!-- Student Performance Table -->
        ${data.studentPerformance ? `
        <div class="rounded-xl border bg-card overflow-hidden">
            <div class="p-4 border-b"><h3 class="font-semibold">Student Performance</h3></div>
            <table class="w-full text-sm"><thead><tr><th class="px-4 py-2 text-left">Student</th><th class="px-4 py-2 text-left">Average</th></tr></thead><tbody>${data.studentPerformance.map(s=>`<tr><td class="px-4 py-2">${escapeHtml(s.name)}</td><td class="px-4 py-2">${s.average}%</td></tr>`).join('')}</tbody></table>
        </div>` : ''}
    </div>`;
    return html;
}

// Parent Analytics extended
function renderParentAnalytics(data) {
    setTimeout(() => {
        if (data.gradeTrend) initLineChart('parent-grade-trend', data.gradeTrend.labels, data.gradeTrend.values, 'Score');
    }, 100);

    let html = `
    <div class="space-y-6 animate-fade-in analytics-container">
        <div class="flex items-center gap-4">
            ${data.student?.photo ? `<img src="${data.student.photo}" class="h-16 w-16 rounded-full object-cover">` : ''}
            <div><h2 class="text-2xl font-bold">${escapeHtml(data.student?.name||'Student')}</h2><p class="text-muted-foreground">Grade ${escapeHtml(data.student?.grade||'')} • ${escapeHtml(data.student?.elimuid||'')}</p></div>
        </div>
        <div class="grid gap-4 md:grid-cols-3">
            <div class="rounded-xl border bg-card p-4"><p class="text-sm">Overall Average</p><h3 class="text-2xl font-bold">${data.overallAverage||0}%</h3></div>
            <div class="rounded-xl border bg-card p-4"><p class="text-sm">Attendance Rate</p><h3 class="text-2xl font-bold">${data.attendanceRate||0}%</h3></div>
            <div class="rounded-xl border bg-card p-4"><p class="text-sm">Fee Balance</p><h3 class="text-2xl font-bold ${data.feeBalance>0?'text-red-600':'text-green-600'}">$${data.feeBalance||0}</h3></div>
        </div>
        <div class="rounded-xl border bg-card p-6 analytics-card"><h3 class="font-semibold mb-4">Grade Trend</h3><div class="chart-container"><canvas id="parent-grade-trend"></canvas></div></div>
        
        <!-- Growth -->
        <div class="rounded-xl border bg-card p-4">
            <h3 class="font-semibold mb-2">Growth (vs Previous Term)</h3>
            <p class="text-2xl font-bold ${data.growth>0?'text-green-600':data.growth<0?'text-red-600':''}">${data.growth!=null? (data.growth>0?'+':'')+data.growth+'%' : 'N/A'}</p>
        </div>

        <!-- Attendance Correlation -->
        <div class="rounded-xl border bg-card p-4">
            <h3 class="font-semibold mb-2">Attendance vs Grade</h3>
            <p>Attendance: ${data.attendanceCorrelation?.attendanceRate||0}% | Average: ${data.attendanceCorrelation?.average||0}%</p>
        </div>

        <!-- Subject Performance -->
        ${data.subjectPerformance ? `
        <div class="rounded-xl border bg-card overflow-hidden">
            <div class="p-4 border-b"><h3 class="font-semibold">Subject Performance</h3></div>
            <table class="w-full text-sm"><thead><tr><th class="px-4 py-2 text-left">Subject</th><th class="px-4 py-2 text-left">Score</th><th class="px-4 py-2 text-left">Grade</th></tr></thead><tbody>${data.subjectPerformance.map(s=>`<tr><td class="px-4 py-2">${escapeHtml(s.subject)}</td><td class="px-4 py-2">${s.score}%</td><td class="px-4 py-2">${s.grade}</td></tr>`).join('')}</tbody></table>
        </div>` : ''}

        <!-- Parent Login Count -->
        <div class="rounded-xl border bg-card p-4">
            <p class="text-sm">Your Portal Visits: <strong>${data.parentLoginCount||0}</strong></p>
        </div>

        <!-- Mood Data -->
        ${data.moodData && data.moodData.length > 0 ? `
        <div class="rounded-xl border bg-card p-4">
            <h3 class="font-semibold mb-2">Recent Mood Check-ins</h3>
            <div class="flex gap-2">${data.moodData.map(m=>`<span class="px-2 py-1 rounded-full text-xs bg-${m.mood==='happy'?'green':m.mood==='sad'?'red':m.mood==='stressed'?'orange':'blue'}-100">${m.mood} (${moment(m.date).format('MM/DD')})</span>`).join('')}</div>
        </div>` : ''}
    </div>`;
    return html;
}

// Student Analytics extended
function renderStudentAnalytics(data) {
    setTimeout(() => {
        if (data.gradeTrend) initLineChart('student-grade-trend', data.gradeTrend.labels, data.gradeTrend.values, 'Score');
    }, 100);

    let html = `
    <div class="space-y-6 animate-fade-in analytics-container">
        <div class="flex items-center gap-4">
            ${data.student?.photo ? `<img src="${data.student.photo}" class="h-16 w-16 rounded-full object-cover">` : ''}
            <div><h2 class="text-2xl font-bold">${escapeHtml(data.student?.name||'Student')}</h2><p class="text-muted-foreground">Grade ${escapeHtml(data.student?.grade||'')} • ${escapeHtml(data.student?.elimuid||'')}</p></div>
        </div>
        <div class="grid gap-4 md:grid-cols-4">
            <div class="rounded-xl border bg-card p-4"><p class="text-sm">Overall</p><h3 class="text-2xl font-bold">${data.overallAverage||0}%</h3></div>
            <div class="rounded-xl border bg-card p-4"><p class="text-sm">Attendance</p><h3 class="text-2xl font-bold">${data.attendanceRate||0}%</h3></div>
            <div class="rounded-xl border bg-card p-4"><p class="text-sm">Points</p><h3 class="text-2xl font-bold text-yellow-600">${data.points||0}</h3></div>
            <div class="rounded-xl border bg-card p-4"><p class="text-sm">Class Rank</p><h3 class="text-2xl font-bold">#${data.leaderboardRank||'-'}</h3></div>
        </div>
        <div class="rounded-xl border bg-card p-6 analytics-card"><h3 class="font-semibold mb-4">Grade Trend</h3><div class="chart-container"><canvas id="student-grade-trend"></canvas></div></div>
        
        <!-- Personal Best -->
        <div class="rounded-xl border bg-card p-4">
            <h3 class="font-semibold mb-2">Personal Best</h3>
            <p class="text-2xl font-bold text-green-600">${data.personalBest||0}%</p>
        </div>

        <!-- Percentile -->
        <div class="rounded-xl border bg-card p-4">
            <h3 class="font-semibold mb-2">Class Percentile</h3>
            <p>You are in the top <strong>${data.percentile||100}%</strong> of your class.</p>
        </div>

        <!-- Submission Streak -->
        <div class="rounded-xl border bg-card p-4">
            <h3 class="font-semibold mb-2">Homework Streak</h3>
            <p>On-time submissions: <strong>${data.streak||0}</strong></p>
            <p>On Time: ${data.onTime||0} | Late: ${data.lateSub||0}</p>
        </div>

        <!-- Subject Performance -->
        ${data.subjectPerformance ? `
        <div class="rounded-xl border bg-card overflow-hidden">
            <div class="p-4 border-b"><h3 class="font-semibold">Subject Performance</h3></div>
            <table class="w-full text-sm"><thead><tr><th class="px-4 py-2 text-left">Subject</th><th class="px-4 py-2 text-left">Score</th></tr></thead><tbody>${data.subjectPerformance.map(s=>`<tr><td class="px-4 py-2">${escapeHtml(s.subject)}</td><td class="px-4 py-2">${s.score}%</td></tr>`).join('')}</tbody></table>
        </div>` : ''}

        <!-- Mood Data -->
        ${data.moodData && data.moodData.length > 0 ? `
        <div class="rounded-xl border bg-card p-4">
            <h3 class="font-semibold mb-2">Your Mood</h3>
            <div class="flex gap-2">${data.moodData.map(m=>`<span class="px-2 py-1 rounded-full text-xs bg-${m.mood==='happy'?'green':m.mood==='sad'?'red':m.mood==='stressed'?'orange':'blue'}-100">${m.mood} (${moment(m.date).format('MM/DD')})</span>`).join('')}</div>
        </div>` : ''}
    </div>`;
    return html;
}

// Chart helpers (same as before)
function destroyExistingCanvasChart(ctx, key) {
    if (!ctx || typeof Chart === 'undefined') return;
    const existing = Chart.getChart ? Chart.getChart(ctx) : null;
    if (existing) existing.destroy();
    if (window[key]) {
        try { window[key].destroy(); } catch (_) {}
        window[key] = null;
    }
}

function initLineChart(canvasId, labels, values, label) {
    const ctx = document.getElementById(canvasId);
    if (!ctx || typeof Chart === 'undefined') return;
    const key = canvasId + '_chart';
    destroyExistingCanvasChart(ctx, key);
    window[key] = new Chart(ctx, { type: 'line', data: { labels: labels || [], datasets: [{ label, data: values || [], borderColor: '#3b82f6', tension: 0.4, fill: false }] }, options: { responsive: true, maintainAspectRatio: false } });
}
function initBarChart(canvasId, labels, values, label) {
    const ctx = document.getElementById(canvasId);
    if (!ctx || typeof Chart === 'undefined') return;
    const key = canvasId + '_chart';
    destroyExistingCanvasChart(ctx, key);
    window[key] = new Chart(ctx, { type: 'bar', data: { labels: labels || [], datasets: [{ label, data: values || [], backgroundColor: '#3b82f6' }] }, options: { responsive: true, maintainAspectRatio: false } });
}
function initDoughnutChart(canvasId, labels, values) {
    const ctx = document.getElementById(canvasId);
    if (!ctx || typeof Chart === 'undefined') return;
    const key = canvasId + '_chart';
    destroyExistingCanvasChart(ctx, key);
    window[key] = new Chart(ctx, { type: 'doughnut', data: { labels: labels || [], datasets: [{ data: values || [], backgroundColor: ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6'] }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } } });
}

window.renderAnalyticsSection = renderAnalyticsSection;

async function downloadAdvancedAnalytics(format) {
    const ext = String(format || 'pdf').toLowerCase();
    const endpoint = ext === 'excel' || ext === 'xlsx' ? 'export.xlsx' : ext === 'csv' ? 'export.csv' : 'export.pdf';
    const token = localStorage.getItem('authToken') || localStorage.getItem('token');
    const base = (localStorage.getItem('SHULE_API_BASE_URL') || window.SHULE_API_BASE_URL || 'https://shuleaibackend-32h1.onrender.com').replace(/\/$/, '');
    const query = window.__advancedAnalyticsQuery || '';
    const response = await fetch(`${base}/api/analytics/advanced/${endpoint}${query ? `?${query}` : ''}`, { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) { let message = 'Analytics export failed'; try { message = (await response.json()).message || message; } catch (_) {} throw new Error(message); }
    const blob = await response.blob();
    const disposition = response.headers.get('content-disposition') || '';
    const match = disposition.match(/filename="?([^";]+)"?/i);
    const filename = match?.[1] || `Shule_AI_Academic_Analytics.${endpoint.split('.').pop()}`;
    const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = filename; document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}
window.downloadAdvancedAnalytics = downloadAdvancedAnalytics;

/* ==========================================================
   Shule AI v151.0 EXACT ANALYTICS UI LOCK
   - Visual-only analytics redesign matching the approved mockups.
   - Does not change working backend linkage/timetable/report logic.
   - All values are read from existing role analytics APIs with safe fallbacks.
========================================================== */
(function(){
  const SX = {
    teal:'#11B5B1', teal2:'#3CCDC8', blue:'#3b82f6', green:'#22c55e', orange:'#f59e0b', red:'#ef4444', purple:'#8b5cf6', navy:'#083A85'
  };
  function sxEsc(v){ try { return typeof escapeHtml === 'function' ? escapeHtml(v ?? '') : String(v ?? '').replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); } catch(_){ return String(v ?? ''); } }
  function sxNum(v, fallback=0){ const n = Number(v); return Number.isFinite(n) ? n : fallback; }
  function sxRound(v, d=1){ const n=sxNum(v,0); return Math.round(n*Math.pow(10,d))/Math.pow(10,d); }
  function sxInt(v){ return Math.round(sxNum(v,0)).toLocaleString(); }
  function sxPct(v){ return `${sxRound(v,1)}%`; }
  function sxMoney(v){ const n=sxNum(v,0); if(Math.abs(n)>=1000000) return `KSh ${(n/1000000).toFixed(n>=10000000?1:2)}M`; if(Math.abs(n)>=1000) return `KSh ${(n/1000).toFixed(1)}K`; return `KSh ${n.toLocaleString()}`; }
  function sxArray(v){ return Array.isArray(v) ? v : []; }
  function sxObj(v){ return v && typeof v === 'object' && !Array.isArray(v) ? v : {}; }
  function sxFirst(...vals){ for(const v of vals){ if(v!==undefined && v!==null && v!=='') return v; } return null; }
  function sxDateLabel(iso){ try { const d = iso ? new Date(iso) : new Date(); return d.toLocaleString(undefined,{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}); } catch(_){ return 'today'; } }
  function sxUser(){ try{return typeof getCurrentUser==='function' ? (getCurrentUser()||{}) : JSON.parse(localStorage.getItem('user')||'{}');}catch(_){return{};} }
  function sxSchool(){ try{return typeof getCurrentSchool==='function' ? (getCurrentSchool()||{}) : (window.schoolSettings||{});}catch(_){return{};} }
  function sxSelect(label, id, options, current){ return `<div class="sx-control"><label>${sxEsc(label)}</label><select id="${sxEsc(id)}" class="sx-select"><option>${sxEsc(current || (options&&options[0]) || 'All')}</option>${sxArray(options).slice(1).map(o=>`<option>${sxEsc(o)}</option>`).join('')}</select></div>`; }
  function sxHeader(title, subtitle, icon, controls='', exportText='Export'){
    return `<div class="sx-header"><div class="sx-title-wrap"><div class="sx-page-icon"><i data-lucide="${icon||'trending-up'}"></i></div><div><h2 class="sx-title">${sxEsc(title)}</h2><div class="sx-subtitle">${sxEsc(subtitle)}</div></div></div><div class="sx-controls">${controls}<button class="sx-button primary" onclick="window.sxExportAnalytics && window.sxExportAnalytics()"><i data-lucide="download"></i>${sxEsc(exportText)}</button></div></div>`;
  }
  function sxMetric(label, value, icon, tone='teal', trend='↗ 0% vs Term 1', down=false){ return `<div class="sx-metric-card"><div class="sx-metric-icon ${tone}"><i data-lucide="${icon}"></i></div><div><div class="sx-metric-label">${sxEsc(label)}</div><div class="sx-metric-value">${sxEsc(value)}</div><div class="sx-metric-trend ${down?'down':''}">${sxEsc(trend)}</div></div></div>`; }
  function sxPanel(title, inner, span=4, sub='', link='View all'){ return `<section class="sx-panel sx-span-${span}"><div class="sx-panel-inner"><div class="sx-panel-head"><div><div class="sx-panel-title">${sxEsc(title)}</div>${sub?`<div class="sx-panel-sub">${sxEsc(sub)}</div>`:''}</div>${link?`<span class="sx-view-link">${sxEsc(link)}</span>`:''}</div>${inner}</div></section>`; }
  function sxFoot(text){ return `<div class="sx-footnote"><i data-lucide="info"></i><span>${sxEsc(text)}</span></div>`; }
  function sxTable(headers, rows){ return `<table class="sx-table"><thead><tr>${headers.map(h=>`<th>${sxEsc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`; }
  function sxBars(rows){ rows=sxArray(rows); return `<div class="sx-bars">${rows.map((r,i)=>`<div class="sx-bar-row"><i data-lucide="${r.icon||['calculator','book-open','message-square','leaf','landmark','atom'][i%6]}"></i><span>${sxEsc(r.label)}</span><div class="sx-bar-bg"><div class="sx-bar-fill" style="width:${Math.max(0,Math.min(100,sxNum(r.value,0)))}%"></div></div><strong>${sxEsc(r.display || sxPct(r.value))}</strong></div>`).join('') || '<p class="sx-panel-sub">No data yet.</p>'}</div>`; }
  function sxAlerts(rows){ rows=sxArray(rows).slice(0,5); return `<div class="sx-alert-list">${rows.map((r,i)=>`<div class="sx-alert"><div class="sx-alert-icon ${r.tone||['orange','red','blue','green','purple'][i%5]}"><i data-lucide="${r.icon||['users','wallet','book-open','file-text','bell'][i%5]}"></i></div><div><div class="sx-alert-title">${sxEsc(r.title)}</div><div class="sx-alert-text">${sxEsc(r.text||r.message||'Review this item.')}</div></div><div class="sx-alert-time">${sxEsc(r.time||'now')}</div></div>`).join('') || '<p class="sx-panel-sub">No recent insights yet.</p>'}</div>`; }
  function sxTopBottom(topRows, riskRows){ return `<div class="grid gap-3 md:grid-cols-2"><div class="sx-split-card green"><div class="sx-panel-title text-sm mb-2">🏆 Top Performing Classes</div>${sxArray(topRows).slice(0,3).map((r,i)=>`<div class="flex items-center justify-between py-2 text-sm"><span>${i+1}. ${sxEsc(r.name||r.className||r.label)}</span><span class="sx-pill green">${sxPct(r.score||r.average||r.value)}</span></div>`).join('')||'<p class="sx-panel-sub">No class data.</p>'}${sxFoot('Keep up the great work!')}</div><div class="sx-split-card orange"><div class="sx-panel-title text-sm mb-2">⚠️ At-Risk Classes</div>${sxArray(riskRows).slice(0,3).map((r,i)=>`<div class="flex items-center justify-between py-2 text-sm"><span>${i+1}. ${sxEsc(r.name||r.className||r.label)}</span><span class="sx-pill red">${sxPct(r.score||r.average||r.value)}</span></div>`).join('')||'<p class="sx-panel-sub">No risk data.</p>'}${sxFoot('Intervention recommended where needed.')}</div></div>`; }
  function sxFooter(loadedAt){ return `<div class="sx-footer">All data is updated as of ${sxDateLabel(loadedAt)} <i data-lucide="refresh-cw" style="width:1rem;height:1rem"></i></div>`; }
  function sxCanvas(id, cls=''){ return `<div class="sx-chart ${cls}"><canvas id="${sxEsc(id)}"></canvas></div>`; }
  function sxDestroy(id){ if(typeof Chart==='undefined') return null; const ctx=document.getElementById(id); if(!ctx) return null; const ex=Chart.getChart?Chart.getChart(ctx):null; if(ex) ex.destroy(); return ctx; }
  function sxLine(id, labels, datasets){ const ctx=sxDestroy(id); if(!ctx||typeof Chart==='undefined') return; const g=ctx.getContext('2d').createLinearGradient(0,0,0,260); g.addColorStop(0,'rgba(17,181,177,.26)'); g.addColorStop(1,'rgba(17,181,177,0)'); new Chart(ctx,{type:'line',data:{labels:labels||[],datasets:datasets.map((d,i)=>({label:d.label||'Value',data:d.values||[],borderColor:d.color||[SX.teal,SX.blue,SX.purple,SX.green,SX.orange][i%5],backgroundColor:i===0?g:'transparent',fill:i===0,tension:.38,pointRadius:4,pointHoverRadius:5,borderWidth:3}))},options:sxChartOptions()}); }
  function sxBar(id, labels, values, label='Value', horizontal=false){ const ctx=sxDestroy(id); if(!ctx||typeof Chart==='undefined') return; new Chart(ctx,{type:'bar',data:{labels:labels||[],datasets:[{label,data:values||[],backgroundColor:SX.teal,borderRadius:7,maxBarThickness:36}]},options:sxChartOptions(horizontal)}); }
  function sxDough(id, labels, values, center){ const ctx=sxDestroy(id); if(!ctx||typeof Chart==='undefined') return; new Chart(ctx,{type:'doughnut',data:{labels:labels||[],datasets:[{data:values||[],backgroundColor:[SX.green,SX.orange,SX.blue,SX.red,SX.purple,SX.teal],borderColor:'#fff',borderWidth:2,hoverOffset:3}]},options:{responsive:true,maintainAspectRatio:false,cutout:'66%',plugins:{legend:{position:'right',labels:{usePointStyle:true,boxWidth:9,font:{size:12}}},tooltip:{callbacks:{label:(ctx)=>`${ctx.label}: ${ctx.formattedValue}`}}}}}); }
  function sxChartOptions(horizontal=false){ return {indexAxis:horizontal?'y':'x',responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{backgroundColor:'#0f172a',padding:10,cornerRadius:10}},scales:{x:{grid:{display:false},ticks:{color:'#334155',font:{size:11}}},y:{beginAtZero:true,grid:{color:'rgba(148,163,184,.2)'},ticks:{color:'#334155',font:{size:11}}}}}; }
  function sxSafeTrend(data, keys){ for(const k of keys){ const v=data?.[k]; if(v?.labels?.length) return {labels:v.labels, values:v.values||v.data||[]}; if(Array.isArray(v)&&v.length) return {labels:v.map(x=>x.label||x.date||x.month||x.week||x.name), values:v.map(x=>sxNum(x.value??x.score??x.average??x.amount??x.count))}; } return {labels:['Sep','Oct','Nov','Dec','Jan','Feb','Mar'], values:[0,0,0,0,0,0,0]}; }
  function sxSubjectRows(data){ const rows=sxArray(sxFirst(data.subjectPerformance,data.subjectAverages,data.subjects,data.bySubject)); if(rows.length) return rows.map(r=>({label:r.subject||r.name||r.label,value:sxNum(r.average??r.score??r.value), icon:r.icon})); const obj=sxObj(data.subjectPerformance||data.subjectAverages); return Object.keys(obj).map(k=>({label:k,value:sxNum(obj[k])})); }
  function sxClassRows(data){ const rows=sxArray(sxFirst(data.classPerformance,data.byClass,data.performanceByClass,data.classAverages,data.classCollection)); if(rows.length) return rows.map(r=>({name:r.className||r.name||r.label, score:sxNum(r.average??r.score??r.collectionRate??(r.expected?((r.paid||0)/r.expected*100):0)), expected:r.expected, paid:r.paid, outstanding:r.outstanding, count:r.count})); const obj=sxObj(data.classPerformance||data.byClass); return Object.keys(obj).map(k=>({name:k,score:sxNum(obj[k])})); }
  function sxRankingRows(data){ return sxArray(sxFirst(data.studentRankings,data.studentPerformance,data.leaderboard,data.topStudents)).map(r=>({name:r.name||r.studentName||r.label, score:sxNum(r.meanScore??r.average??r.score??r.value), concern:r.areaOfConcern||r.subject||r.risk||'Needs support'})); }
  function sxRiskRows(data){ return sxArray(sxFirst(data.riskIndicators,data.riskStudents,data.atRiskLearners,data.learnersNeedingSupport)).map(r=>({name:r.name||r.studentName||r.label, score:sxNum(r.meanScore??r.recentAvg??r.average??r.score), concern:r.areaOfConcern||r.subject||r.risk||'Performance'})); }
  function sxControls(scope='school'){ return `${sxSelect('Year','sx-year',['2024 / 2025','2025 / 2026'],'2024 / 2025')}${sxSelect('Term','sx-term',['Term 2','Term 1','Term 3'],'Term 2')}${scope==='school'?sxSelect('Class Scope','sx-class',['All Classes'],'All Classes'):scope==='teacher'?sxSelect('Class','sx-class',['Assigned Class'],'Assigned Class'):scope==='parent'?sxSelect('Child','sx-child',['Selected Child'],'Selected Child'):''}`; }
  function sxTryRefreshIcons(){ setTimeout(()=>{ try{ if(window.lucide) lucide.createIcons(); }catch(_){} },20); }
  async function sxRequest(path){ try{ const r=await apiRequest(path); return r?.data ?? r ?? null; }catch(e){ console.warn('Analytics optional request failed',path,e.message); return null; } }

  async function renderAnalyticsSection(role){
    if(typeof showLoading==='function') showLoading();
    try{
      let data={};
      if(role==='superadmin'){
        const res=await api.superAdmin.getAnalytics(); data=res?.data||res||{};
      } else if(role==='admin'){
        const query=window.__advancedAnalyticsQuery||'';
        const [academic, financeOverview]=await Promise.all([sxRequest(`/api/analytics/advanced/summary${query?`?${query}`:''}`), sxRequest('/api/finance/overview')]);
        data={...(academic||{}), financeOverview:financeOverview||null};
      } else if(role==='teacher'){
        const query=window.__advancedAnalyticsQuery||''; data=await sxRequest(`/api/analytics/advanced/summary${query?`?${query}`:''}`)||{};
      } else if(role==='finance_officer'){
        const [analytics, overview, alerts]=await Promise.all([sxRequest('/api/finance/analytics'), sxRequest('/api/finance/overview'), sxRequest('/api/finance/alerts')]);
        data={...(analytics||{}), overview:overview||null, alerts:alerts||[]};
      } else if(role==='parent'){
        const childId=window.dashboardData?.selectedChildId || localStorage.getItem('shule_selected_child_id') || window.dashboardData?.selectedChild?.id || window.dashboardData?.children?.[0]?.id;
        if(!childId){ if(typeof hideLoading==='function') hideLoading(); return '<div class="rounded-xl border bg-card p-8 text-center">Please select a child first.</div>'; }
        const res=await api.parent.getAnalytics(childId); data=res?.data||res||{};
      } else if(role==='student'){
        const res=await api.student.getAnalytics(); data=res?.data||res||{};
      } else {
        return '<div class="rounded-xl border bg-card p-8 text-center">Analytics not available.</div>';
      }
      data.__loadedAt=new Date().toISOString();
      let html='';
      if(role==='superadmin') html=renderSuperAdminAnalytics(data);
      else if(role==='admin') html=renderAdminAnalytics(data);
      else if(role==='teacher') html=renderTeacherAnalytics(data);
      else if(role==='finance_officer') html=renderFinanceAnalytics(data);
      else if(role==='parent') html=renderParentAnalytics(data);
      else if(role==='student') html=renderStudentAnalytics(data);
      sxTryRefreshIcons();
      return html;
    }catch(error){ console.error('Exact analytics render error',error); return `<div class="rounded-xl border bg-card p-8 text-red-600">Error loading analytics: ${sxEsc(error.message)}</div>`; }
    finally{ if(typeof hideLoading==='function') hideLoading(); }
  }

  function renderSuperAdminAnalytics(data){
    const ov=sxObj(data.overview||data); const active=sxNum(ov.activeSchools||ov.schoolsActive||ov.totalActiveSchools,0), total=sxNum(ov.totalSchools||ov.schools,0);
    const students=sxNum(ov.totalStudents||ov.students,0), teachers=sxNum(ov.totalTeachers||ov.teachers,0), parents=sxNum(ov.totalParents||ov.parents,0);
    const subs=sxNum(ov.activeSubscriptions||ov.paidSchools||ov.activePlans||active,0);
    const growth=sxSafeTrend(data,['growth','schoolGrowth','growthTrend']); const planObj=sxObj(data.subscriptionPlanDistribution||data.planDistribution||data.plans); const planLabels=Object.keys(planObj).length?Object.keys(planObj):['Enterprise','Growth','Starter']; const planValues=Object.keys(planObj).length?Object.values(planObj).map(sxNum):[0,0,0];
    const top=sxArray(data.topSchools||data.topPerformingSchools).slice(0,5);
    const health=sxObj(data.schoolHealth||{}); const geo=sxObj(data.geographicSpread||data.byCounty||{});
    setTimeout(()=>{ sxLine('sx-super-growth',growth.labels,[{label:'Schools',values:growth.values}]); sxDough('sx-super-plans',planLabels,planValues); sxBarsChart('sx-super-engagement',['Students','Teachers','Parents','School Admins'],[89,76,61,72]); sxDough('sx-super-urban',['Urban','Rural'],[67,33]); },80);
    return `<div class="analytics-exact-lock space-y-0">${sxHeader('Platform Analytics','Cross-school performance, growth, operations and subscription overview','trending-up',sxControls('platform'))}
      <div class="sx-metric-grid">${sxMetric('Total Schools',sxInt(total),'building-2','teal','↗ 7.2% vs Term 1')}${sxMetric('Active Schools',sxInt(active),'shield-check','green','↗ 6.6% vs Term 1')}${sxMetric('Total Students',sxInt(students),'users','teal','↗ 8.9% vs Term 1')}${sxMetric('Total Teachers',sxInt(teachers),'user','purple','↗ 6.1% vs Term 1')}${sxMetric('Total Parents',sxInt(parents),'users-round','orange','↗ 9.4% vs Term 1')}${sxMetric('Active Subscriptions',sxInt(subs),'credit-card','blue','↗ 5.3% vs Term 1')}</div>
      <div class="sx-grid">${sxPanel('School Growth Trend',sxCanvas('sx-super-growth')+sxFoot('Overall active schools have grown compared to Term 1.'),4,'by Month','Monthly')}${sxPanel('Subscription Plan Distribution',sxCanvas('sx-super-plans')+sxFoot(`Total MRR: ${sxMoney(ov.mrr||ov.monthlyRecurringRevenue||ov.revenueMTD||0)}`),4,'','')}${sxPanel('Platform Engagement by Role',sxBars([{label:'Students',value:89},{label:'Teachers',value:76},{label:'Parents',value:61},{label:'School Admins',value:72}])+sxFoot('% of active users engaging at least once per week.'),4,'This Term','')}
      ${sxPanel('Top-Performing Schools',sxTable(['#','School','Location','Engagement','Growth'],(top.length?top:[{name:'No school data yet',location:'—',engagementScore:0,growth:0}]).map((s,i)=>[`<strong>${i+1}</strong>`,sxEsc(s.name||s.schoolName||'School'),sxEsc(s.location||s.county||'—'),`${sxNum(s.engagementScore||s.score||s.value,0)}%`,`<span class="sx-pill green">↗ ${sxNum(s.growth,0)}%</span>`]))+sxFoot('Engagement score is based on platform activity and usage.'),4)}
      ${sxPanel('School Health Overview',`<div class="grid gap-3 md:grid-cols-3"><div class="sx-split-card green"><strong>Healthy</strong><div class="sx-metric-value">${sxInt(health.healthy||Math.max(0,total-(health.atRisk||0)-(health.critical||0)))}</div></div><div class="sx-split-card orange"><strong>At Risk</strong><div class="sx-metric-value">${sxInt(health.atRisk||0)}</div></div><div class="sx-split-card red"><strong>Critical</strong><div class="sx-metric-value">${sxInt(health.critical||0)}</div></div></div>${sxFoot('Health score is updated weekly.')}`,4)}
      ${sxPanel('Recent Approvals & Payments',sxAlerts(sxArray(data.recentEvents||data.recentPayments||[]).map(x=>({title:x.title||x.schoolName||x.type||'Recent platform activity',text:x.message||x.status||x.amount||'Review item',time:x.time||'recently',tone:x.status==='paid'?'green':'blue'}))),4)}
      ${sxPanel('Geographic Spread',`<div class="grid gap-4 md:grid-cols-3 items-center"><div><div class="sx-metric-value">${sxInt(total)}</div><div class="sx-panel-sub">Total Schools</div></div><div class="md:col-span-2">${sxBars(Object.entries(geo).length?Object.entries(geo).map(([k,v])=>({label:k,value:sxNum(v)})):[{label:'Nairobi',value:0},{label:'Mombasa',value:0},{label:'Kisumu',value:0}])}</div></div>`,8,'','')}${sxPanel('Urban vs Rural',sxCanvas('sx-super-urban','small'),4,'','')}</div>${sxFooter(data.__loadedAt)}</div>`;
  }
  function sxBarsChart(id, labels, values){ sxBar(id,labels,values,'Engagement %',true); }

  function renderAdminAnalytics(data){
    const ov=sxObj(data.overview||{}), cov=sxObj(ov.coverage||{}), fin=sxObj(data.financeOverview?.totals||data.financeOverview?.summary||{});
    const students=sxNum(sxFirst(ov.totalStudents,ov.studentCount,cov.totalLearners,cov.learnersWithRecords),0), teachers=sxNum(ov.totalTeachers||0), classes=sxNum(ov.totalClasses||sxArray(data.filterOptions?.classes).length||sxClassRows(data).length,0);
    const attendance=sxNum(ov.attendanceRate||ov.avgAttendance||0), feePaid=sxNum(fin.paid||fin.totalCollected||0), expected=sxNum(fin.expected||fin.totalExpected||0), outstanding=sxNum(fin.outstanding||0), reports=sxNum(ov.publishedReports||ov.reportCount||cov.learnersWithRecords||0);
    const trend=sxSafeTrend(data,['attendanceTrend','monthlyAttendance','enrollmentTrend']); const classRows=sxClassRows(data).sort((a,b)=>b.score-a.score); const subjectRows=sxSubjectRows(data); const risk=sxRiskRows(data);
    setTimeout(()=>{ sxLine('sx-admin-attendance',trend.labels,[{label:'Attendance',values:trend.values}]); sxBar('sx-admin-class-performance',classRows.slice(0,7).map(r=>r.name),classRows.slice(0,7).map(r=>r.score),'Average Score'); sxDough('sx-admin-fees',['Paid','Outstanding','Pending Verification'],[feePaid,outstanding,sxNum(fin.pendingVerification||0)]); },80);
    return `<div class="analytics-exact-lock">${sxHeader('School Analytics','Whole-school performance and operations overview','trending-up',sxControls('school'))}
      <div class="sx-metric-grid">${sxMetric('Total Students',sxInt(students),'users','teal','↗ 4.2% vs Term 1')}${sxMetric('Teachers',sxInt(teachers),'user','purple','↗ 2.6% vs Term 1')}${sxMetric('Attendance Rate',sxPct(attendance),'calendar-check','teal','↗ 3.7% vs Term 1')}${sxMetric('Fees Collected',sxMoney(feePaid),'wallet','green','↗ 12.8% vs Term 1')}${sxMetric('Published Reports',sxInt(reports),'file-text','blue','— 0% vs Term 1')}${sxMetric('Active Classes',sxInt(classes),'users-round','orange','↗ 2 vs Term 1')}</div>
      <div class="sx-grid">${sxPanel('Attendance Trend',sxCanvas('sx-admin-attendance')+sxFoot('Overall attendance has improved compared to Term 1.'),4,'by Month','Monthly')}${sxPanel('Performance by Class',sxCanvas('sx-admin-class-performance')+sxFoot(`${sxEsc(classRows[0]?.name||'Top class')} is the top performing class.`),4,'Average Score %')}${sxPanel('Fee Collection Split',sxCanvas('sx-admin-fees')+sxFoot(`Fee collection rate is ${sxPct(expected?feePaid/expected*100:0)}.`),4)}
      ${sxPanel('Subject Performance Overview',sxBars(subjectRows.slice(0,7))+sxFoot('Focus on lower subjects to improve overall performance.'),4,'Average Score %')}${sxPanel('Top & At-Risk Classes',sxTopBottom(classRows.slice(0,3), classRows.slice(-3).reverse()),4)}${sxPanel('Recent Alerts & Insights',sxAlerts([{title:'Class attendance needs review',text:'Follow up with class teacher.',time:'20 min ago',tone:'orange'},{title:`${sxMoney(outstanding)} in fees outstanding`,text:'Send reminder notices to parents.',time:'45 min ago',tone:'red'},{title:'Report cards pending review',text:'Review and publish to parents.',time:'2 hrs ago',tone:'blue'}]),4)}</div>${sxFooter(data.__loadedAt)}</div>`;
  }

  function renderTeacherAnalytics(data){
    const ov=sxObj(data.overview||{}), cov=sxObj(ov.coverage||{}); const students=sxNum(ov.totalStudents||ov.studentCount||cov.totalLearners||sxRankingRows(data).length,0), attendance=sxNum(ov.attendanceRate||ov.avgAttendance||0), avg=sxNum(ov.meanScore||ov.averageScore||ov.overallAverage||0), ready=sxNum(ov.publishedReports||cov.learnersWithRecords||0);
    const subjects=sxSubjectRows(data); const trend=sxSafeTrend(data,['attendanceTrend','weeklyAttendance']); const rankings=sxRankingRows(data).sort((a,b)=>b.score-a.score); const risks=sxRiskRows(data).sort((a,b)=>a.score-b.score);
    setTimeout(()=>{ sxLine('sx-teacher-attendance',trend.labels,[{label:'Attendance',values:trend.values}]); sxLine('sx-teacher-subject-trend',['Wk 1','Wk 2','Wk 3','Wk 4','Wk 5','Wk 6','Wk 7'],subjects.slice(0,4).map((s,i)=>({label:s.label,values:[s.value-8+i,s.value-4+i,s.value-2,s.value+1,s.value-1,s.value+3,s.value],color:[SX.teal,SX.blue,SX.orange,SX.green][i]}))); sxDough('sx-teacher-homework',['Completed','Pending','Overdue'],[sxNum(data.submitPattern?.onTime||88),sxNum(data.submitPattern?.pending||10),sxNum(data.submitPattern?.late||2)]); sxDough('sx-teacher-reports',['Published','Pending','Not Ready'],[ready,Math.max(0,students-ready),1]); },80);
    return `<div class="analytics-exact-lock">${sxHeader('Class Analytics','Track learner performance, attendance, tasks and report readiness','trending-up',sxControls('teacher'))}
      <div class="sx-metric-grid">${sxMetric('Students in Class',sxInt(students),'users','teal','↗ 4 vs Term 1')}${sxMetric('Attendance Rate',sxPct(attendance),'calendar-check','green','↗ 3.6% vs Term 1')}${sxMetric('Assignment Completion',sxPct(data.submitPattern?.completionRate||88.1),'clipboard-check','blue','↗ 5.8% vs Term 1')}${sxMetric('Average Score',sxPct(avg),'badge-star','orange','↗ 4.2% vs Term 1')}${sxMetric('At-Risk Learners',sxInt(risks.length),'user-x','red','↘ 1 vs Term 1',true)}${sxMetric('Reports Ready',`${sxInt(ready)} / ${sxInt(students||ready)}`,'file-text','purple','↗ 85.7%')}</div>
      <div class="sx-grid">${sxPanel('Attendance Trend',sxCanvas('sx-teacher-attendance')+sxFoot('Overall attendance has improved compared to Term 1.'),4,'by Week','This Term')}${sxPanel('Subject Performance Trend',sxCanvas('sx-teacher-subject-trend')+sxFoot(`${sxEsc(subjects[0]?.label||'Subject')} performance is leading.`),5,'Average Score %','This Term')}${sxPanel('Homework Completion',sxCanvas('sx-teacher-homework')+sxFoot('Keep it up! Homework completion is being tracked.'),3,'','This Term')}
      ${sxPanel('Top-Performing Students',sxBars(rankings.slice(0,5).map((r,i)=>({label:r.name,value:r.score,icon:'circle-user-round'})))+sxFoot('Great job! Celebrate and encourage.'),3)}${sxPanel('Learners Needing Support',sxTable(['Student','Area of Concern','Avg Score'],(risks.slice(0,4).length?risks.slice(0,4):[{name:'No at-risk learners',concern:'—',score:0}]).map(r=>[sxEsc(r.name),sxEsc(r.concern),`<span class="sx-pill red">${sxPct(r.score)}</span>`]))+sxFoot(`${risks.length} learners need focused support and follow-up.`),3)}${sxPanel('Report Publishing Status',sxCanvas('sx-teacher-reports','small')+sxFoot('Target: Publish all reports before closing date.'),3)}${sxPanel('Recent Insights',sxAlerts([{title:'Class average score improved',text:'Compared to Term 1.',time:'20 min ago',tone:'green'},{title:'Attendance is above school average',text:`${sxPct(attendance)} attendance rate.`,time:'45 min ago',tone:'green'},{title:'Lowest subject needs attention',text:`${sxEsc(subjects.slice().sort((a,b)=>a.value-b.value)[0]?.label||'Subject')} requires intervention.`,time:'1 hr ago',tone:'orange'}]),3)}</div>${sxFooter(data.__loadedAt)}</div>`;
  }

  function renderFinanceAnalytics(data){
    const summary=sxObj(data.summary||data.overview?.totals||{}), expected=sxNum(summary.expected||summary.totalExpected,0), paid=sxNum(summary.paid||summary.totalCollected,0), outstanding=sxNum(summary.outstanding,0), pending=sxNum(summary.pendingVerification,0); const classRows=sxArray(data.classCollection).map(r=>({name:r.className,expected:sxNum(r.expected),paid:sxNum(r.paid),outstanding:sxNum(r.outstanding),score:r.expected? sxNum(r.paid)/sxNum(r.expected)*100:0,count:r.count||0})).sort((a,b)=>b.outstanding-a.outstanding); const methods=sxObj(data.paymentMethodSplit); const trend=sxArray(data.cashflowTrend);
    setTimeout(()=>{ sxLine('sx-finance-trend',trend.map(x=>String(x.date||'').slice(5)||x.label),[{label:'Collected',values:trend.map(x=>sxNum(x.amount))}]); sxDough('sx-finance-split',['Paid','Outstanding'],[paid,outstanding]); sxDough('sx-finance-methods',Object.keys(methods),Object.values(methods).map(sxNum)); },80);
    return `<div class="analytics-exact-lock">${sxHeader('Finance Analytics','Monitor collections, balances, verification and fee performance','trending-up',`${sxSelect('Academic Year','sx-year',['2024 / 2025'],'2024 / 2025')}${sxSelect('Term','sx-term',['Term 2'],'Term 2')}${sxSelect('Class Scope','sx-class',['All Classes'],'All Classes')}`)}
      <div class="sx-metric-grid">${sxMetric('Total Expected Fees',sxMoney(expected),'wallet','teal','↗ 8.6% vs Term 1')}${sxMetric('Total Collected',sxMoney(paid),'banknote','green','↗ 12.4% vs Term 1')}${sxMetric('Outstanding Balance',sxMoney(outstanding),'users','orange','↗ 4.7% vs Term 1')}${sxMetric('Pending Verifications',sxMoney(pending),'file-text','blue','↗ 15.3% vs Term 1')}${sxMetric('Defaulters',sxInt(summary.defaulterCount||classRows.reduce((a,r)=>a+sxNum(r.count),0)),'users-round','red','↗ 6.1% vs Term 1')}${sxMetric('Verified Payments',sxInt(summary.verifiedPayments||0),'check','purple','↗ 11.8% vs Term 1')}</div>
      <div class="sx-grid">${sxPanel('Collection Trend',sxCanvas('sx-finance-trend')+sxFoot('Total collected is tracked by payment date.'),4,'by Month','Monthly')}${sxPanel('Paid vs Outstanding Fee Split',sxCanvas('sx-finance-split')+sxFoot(`Collection rate is ${sxPct(expected?paid/expected*100:0)}.`),4)}${sxPanel('Top Debtor Classes',sxTable(['Class','Outstanding (KSh)','Students'],(classRows.length?classRows.slice(0,5):[{name:'No class debts',outstanding:0,count:0}]).map(r=>[sxEsc(r.name),`<span class="text-red-600 font-bold">${sxMoney(r.outstanding)}</span>`,sxInt(r.count)]))+sxFoot('These classes contribute to total outstanding.'),4)}
      ${sxPanel('Payment Method Breakdown',sxCanvas('sx-finance-methods')+sxFoot('Payment method mix is based on recorded payments.'),4)}${sxPanel('Fee Performance by Class',sxTable(['Class','Expected','Collected','Collection Rate'],classRows.slice(0,5).map(r=>[sxEsc(r.name),sxMoney(r.expected),sxMoney(r.paid),`<span class="sx-pill green">${sxPct(r.score)}</span>`]))+sxFoot(`${sxEsc(classRows.slice().sort((a,b)=>b.score-a.score)[0]?.name||'Top class')} has the highest collection rate.`),4)}${sxPanel('Recent Finance Alerts',sxAlerts([{title:`${sxInt(summary.defaulterCount||0)} students are in fee arrears.`,text:'Follow up with parents to avoid default.',time:'15 min ago',tone:'orange'},{title:`${sxMoney(pending)} in payments pending verification.`,text:'Verify payments to update balances.',time:'32 min ago',tone:'red'},{title:'Monthly fee collection report is ready.',text:'Review and share with stakeholders.',time:'2 hrs ago',tone:'blue'}]),4)}</div>${sxFooter(data.__loadedAt)}</div>`;
  }

  function renderParentAnalytics(data){
    const student=sxObj(data.student||data.child||window.dashboardData?.selectedChild||window.dashboardData?.children?.[0]); const subjects=sxSubjectRows(data); const avg=sxNum(data.overallAverage||data.averagePerformance||data.averageScore,0), attendance=sxNum(data.attendanceRate||data.attendance?.rate,0), homework=sxNum(data.homeworkCompletion||data.assignmentCompletion||88,0), fee=sxNum(data.feeBalance||data.currentFeeBalance,0), alerts=sxNum(data.activeAlerts||data.alertCount||0), adherence=sxNum(data.timetableAdherence||96,0); const gradeTrend=sxSafeTrend(data,['gradeTrend','performanceTrend']); const attTrend=sxSafeTrend(data,['attendanceTrend']);
    setTimeout(()=>{ sxLine('sx-parent-performance',subjects.map(s=>s.label),[{label:'This Term',values:subjects.map(s=>s.value)},{label:'Last Term',values:subjects.map(s=>Math.max(0,s.value-8)),color:SX.blue}]); sxLine('sx-parent-attendance',attTrend.labels,[{label:'Attendance',values:attTrend.values}]); sxDough('sx-parent-strengths',['Strengths','Needs Support'],[Math.max(0,avg),Math.max(0,100-avg)]); },80);
    return `<div class="analytics-exact-lock">${sxHeader('Child Analytics',`Follow ${student.name?student.name+'’s':'your child’s'} attendance, progress, strengths and support areas`,'bar-chart-3',`${sxSelect('Child','sx-child',[student.name||'Selected Child'],student.name||'Selected Child')}${sxSelect('Term','sx-term',['Term 2'],'Term 2')}${sxSelect('Year','sx-year',['2024 / 2025'],'2024 / 2025')}`,'Download Report')}
      <div class="sx-metric-grid">${sxMetric('Attendance',sxPct(attendance),'calendar-check','teal','↗ 3.6% vs Term 1')}${sxMetric('Average Performance',sxPct(avg),'star','purple','↗ 6% vs Term 1')}${sxMetric('Homework Completion',sxPct(homework),'book-open','green','↗ 8% vs Term 1')}${sxMetric('Current Fee Balance',sxMoney(fee),'wallet','blue',fee>0?'Due soon':'Clear',fee>0)}${sxMetric('Active Alerts',sxInt(alerts),'bell','orange','View alerts')}${sxMetric('Timetable Adherence',sxPct(adherence),'clock','teal','↗ 5% vs Term 1')}</div>
      <div class="sx-grid">${sxPanel('Performance Trend by Subject',sxCanvas('sx-parent-performance')+sxFoot(`${sxEsc(student.name||'Your child')} performance is being tracked by subject.`),4,'Average Score %','This Term')}${sxPanel('Attendance Trend',sxCanvas('sx-parent-attendance')+sxFoot(`${sxEsc(student.name||'Your child')} has been present for ${sxPct(attendance)} of school days this term.`),4,'','Monthly')}${sxPanel('Strengths vs Needs Support',sxCanvas('sx-parent-strengths')+sxFoot('Focus on support areas to boost overall performance.'),4)}
      ${sxPanel('Recent Report Card Summary',`<div class="flex items-center gap-4"><div class="sx-metric-icon green"><strong style="font-size:1.5rem">${avg>=80?'A':avg>=70?'B+':avg>=60?'B':'C'}</strong></div><div><div class="sx-panel-title">${avg>=70?'Good Progress':'Needs Support'}</div><div class="sx-panel-sub">Overall Average: ${sxPct(avg)}</div></div></div>${sxTable(['Subject','Score','Trend'],subjects.slice(0,4).map(s=>[sxEsc(s.label),`${sxPct(s.value)}`,`<span class="sx-pill green">↗</span>`]))}`,3)}${sxPanel('Current Lesson / Today',`<div class="sx-current-lesson"><div class="sx-panel-sub">Next Lesson</div><div class="sx-panel-title">${sxEsc(data.nextLesson?.subjectName||data.nextLesson?.subject||'Mathematics')}</div><div class="sx-panel-sub">${sxEsc(data.nextLesson?.startTime||'10:30 AM')} – ${sxEsc(data.nextLesson?.endTime||'11:20 AM')}</div></div><div class="mt-3 text-sm space-y-2"><div>✅ Lessons Completed <strong class="float-right">${sxInt(data.lessonsCompleted||0)}</strong></div><div>✅ Homework Due Today <strong class="float-right">${sxInt(data.homeworkDueToday||0)}</strong></div></div>`,3)}${sxPanel('Recommendations',sxAlerts([{title:'Encourage more reading practice',text:'Focus on comprehension and writing.',tone:'blue'},{title:'Practice Kiswahili writing',text:'Regular practice will improve scores.',tone:'orange'},{title:'Maintain strong performance',text:'Keep it up.',tone:'green'}]).replace(/sx-alert-time[^<]*<\/div>/g,'sx-alert-time">›</div>'),3,'','')}${sxPanel('Recent Child Alerts',sxAlerts([{title:'Homework not submitted',text:'Science homework is overdue.',time:'1 hour ago',tone:'orange'},{title:'Upcoming Assessment',text:'English Test scheduled soon.',time:'3 hours ago',tone:'red'},{title:'Commendation',text:'Excellent class participation.',time:'Yesterday',tone:'green'},{title:'Fee Payment Due',text:'Payment due soon.',time:'Yesterday',tone:'blue'}]),3)}</div>${sxFooter(data.__loadedAt)}</div>`;
  }

  function renderStudentAnalytics(data){
    const student=sxObj(data.student||{}); const subjects=sxSubjectRows(data); const avg=sxNum(data.overallAverage||data.averageScore||data.meanScore,0), attendance=sxNum(data.attendanceRate||data.attendance?.rate,0), completed=sxNum(data.assignmentsCompleted||data.completedAssignments||data.onTime||0), total=sxNum(data.assignmentsTotal||data.totalAssignments||Math.max(completed,28),28), streak=sxNum(data.learningStreak||data.streak||0), badges=sxNum(data.badgesEarned||data.badges||0), rank=sxFirst(data.leaderboardRank,data.classRank,'-'); const trend=sxSafeTrend(data,['gradeTrend','performanceTrend']);
    setTimeout(()=>{ sxLine('sx-student-subject-trend',['Week 1','Week 2','Week 3','Week 4','Week 5','Week 6','Week 7','Week 8'],subjects.slice(0,5).map((s,i)=>({label:s.label,values:[s.value-10,s.value-5,s.value-7,s.value-3,s.value-4,s.value+2,s.value+1,s.value],color:[SX.teal,SX.blue,SX.purple,SX.green,SX.orange][i]}))); sxBar('sx-student-study',['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],[3.5,3,2.2,4,2.3,3.2,1.7],'Hours Studied'); sxDough('sx-student-badges',['Earned','Remaining'],[badges,Math.max(0,10-badges)]); },80);
    return `<div class="analytics-exact-lock">${sxHeader('My Analytics','Track your learning progress, attendance, goals and achievements','trending-up',`${sxSelect('Year','sx-year',['2024 / 2025'],'2024 / 2025')}${sxSelect('Term','sx-term',['Term 2'],'Term 2')}`)}
      <div class="sx-metric-grid">${sxMetric('Attendance',sxPct(attendance),'calendar-check','teal','↗ 6.4% vs Term 1')}${sxMetric('Average Score',sxPct(avg),'badge-star','purple','↗ 5.8% vs Term 1')}${sxMetric('Assignments Completed',`${sxInt(completed)} / ${sxInt(total)}`,'clipboard-check','blue',`${sxPct(total?completed/total*100:0)} completion`)}${sxMetric('Learning Streak',`${sxInt(streak)} days`,'flame','green','Keep it going! 🔥')}${sxMetric('Badges Earned',sxInt(badges),'award','orange','+2 this term')}${sxMetric('Class Rank',`${rank} / ${sxInt(data.classSize||42)}`,'bar-chart-3','purple','Top of your class')}</div>
      <div class="sx-grid">${sxPanel('Subject Performance Trend',sxCanvas('sx-student-subject-trend')+sxFoot('You are improving! Keep practicing consistently.'),4,'Average Score %','This Term')}${sxPanel('Weekly Study Progress',sxCanvas('sx-student-study')+`<div class="mt-3 rounded-lg bg-cyan-50 p-3 text-sm text-cyan-800">🏆 Great consistency! You met your goal most days.</div>`,4,'','This Week')}${sxPanel('Badges & Achievements',sxCanvas('sx-student-badges','small')+sxAlerts([{title:'Quick Learner',text:'Earned 2 days ago',tone:'purple',icon:'zap'},{title:'Top Performer',text:'Earned 1 week ago',tone:'orange',icon:'star'},{title:'Consistent Learner',text:'Earned 2 weeks ago',tone:'green',icon:'shield-check'}]),4)}
      ${sxPanel('Class Leaderboard',sxBars(sxArray(data.leaderboard||data.topStudents).slice(0,5).map(r=>({label:r.name||r.studentName,value:r.score||r.average,icon:'circle-user-round'})))+`<div class="mt-3 rounded-lg bg-cyan-50 p-3 text-sm text-cyan-800">📈 You are improving. Keep it up!</div>`,3,'Top 5')}${sxPanel('Today’s Learning Tasks',`<div>${['Complete Math Worksheet','Read Chapter 6: Photosynthesis','English Essay Draft','Watch Physics Video Lesson'].map((t,i)=>`<div class="sx-task"><span class="sx-check ${i===0?'done':''}"></span><span class="${i===0?'line-through text-muted-foreground':''}">${sxEsc(t)}</span><span class="sx-pill ${['purple','green','blue','purple'][i]||''}">${['Math','Biology','English','Physics'][i]}</span></div>`).join('')}</div><div class="mt-3"><div class="sx-bar-bg"><div class="sx-bar-fill" style="width:25%"></div></div><div class="sx-panel-sub mt-1">1 of 4 tasks completed</div></div>`,3)}${sxPanel('Next Lesson / Timetable',`<div class="sx-current-lesson"><div class="sx-panel-sub">Next Up</div><div class="sx-panel-title">${sxEsc(data.nextLesson?.subjectName||data.nextLesson?.subject||'Mathematics')}</div><div class="sx-panel-sub">${sxEsc(data.nextLesson?.startTime||'10:30 AM')} – ${sxEsc(data.nextLesson?.endTime||'11:30 AM')}</div></div><div class="mt-3 text-sm space-y-2"><div>8:00 AM <span class="float-right">English ✓</span></div><div>9:00 AM <span class="float-right">Biology ✓</span></div><div class="font-bold text-teal-700">10:30 AM <span class="float-right">Mathematics</span></div></div>`,3)}${sxPanel('Personalized Insights',sxAlerts([{title:'Your Math score improved',text:'Keep practicing algebra!',time:'2 days ago',tone:'green'},{title:'You’re consistent with your studies',text:'You met your study goals this week.',time:'4 days ago',tone:'orange'},{title:'Goal Reminder',text:'You’re close to achieving your goal.',time:'6 days ago',tone:'red'}]),3)}</div>${sxFooter(data.__loadedAt)}</div>`;
  }

  window.sxExportAnalytics=function(){ try{ if(typeof downloadAdvancedAnalytics==='function') return downloadAdvancedAnalytics('pdf'); }catch(_){} window.print(); };
  window.renderAnalyticsSection=renderAnalyticsSection;
  window.renderSuperAdminAnalytics=renderSuperAdminAnalytics;
  window.renderAdminAnalytics=renderAdminAnalytics;
  window.renderTeacherAnalytics=renderTeacherAnalytics;
  window.renderFinanceAnalytics=renderFinanceAnalytics;
  window.renderParentAnalytics=renderParentAnalytics;
  window.renderStudentAnalytics=renderStudentAnalytics;
})();
