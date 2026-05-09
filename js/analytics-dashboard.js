// js/analytics-dashboard.js
async function renderAnalyticsSection(role) {
    showLoading();
    try {
        let data;
        if (role === 'superadmin') {
            const res = await api.superAdmin.getAnalytics();
            data = res.data;
        } else if (role === 'admin') {
            const res = await api.admin.getAnalytics();
            data = res.data;
        } else if (role === 'teacher') {
            const res = await api.teacher.getAnalytics();
            data = res.data;
        } else if (role === 'parent') {
            const childId = dashboardData?.selectedChildId || dashboardData?.selectedChild?.id || dashboardData?.children?.[0]?.id;
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

// ... (Super Admin unchanged, but from previous correct version)

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
        <div class="flex items-center justify-between gap-3 flex-wrap"><h2 class="text-2xl font-bold">School Analytics</h2><span class="text-xs px-3 py-1 rounded-full bg-green-100 text-green-700">Live data • ${formatDateTime(data.__loadedAt)}</span></div>
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
        <div class="flex items-center justify-between gap-3 flex-wrap"><h2 class="text-2xl font-bold">My Class Analytics</h2><span class="text-xs px-3 py-1 rounded-full bg-green-100 text-green-700">Live data • ${formatDateTime(data.__loadedAt)}</span></div>
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
