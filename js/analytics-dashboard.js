// js/analytics-dashboard.js
// Comprehensive Analytics Dashboard for all roles

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
            const childId = dashboardData?.selectedChildId;
            if (!childId) {
                hideLoading();
                return '<div class="text-center py-12">Please select a child first</div>';
            }
            const res = await api.parent.getAnalytics(childId);
            data = res.data;
        } else if (role === 'student') {
            const res = await api.student.getAnalytics();
            data = res.data;
        } else {
            hideLoading();
            return '<div class="text-center py-12">Analytics not available for this role</div>';
        }
        hideLoading();
        return generateAnalyticsHTML(role, data);
    } catch (error) {
        hideLoading();
        console.error('Analytics error:', error);
        return `<div class="text-center py-12 text-red-500">Error loading analytics: ${error.message}</div>`;
    }
}

function generateAnalyticsHTML(role, data) {
    switch (role) {
        case 'superadmin': return renderSuperAdminAnalytics(data);
        case 'admin': return renderAdminAnalytics(data);
        case 'teacher': return renderTeacherAnalytics(data);
        case 'parent': return renderParentAnalytics(data);
        case 'student': return renderStudentAnalytics(data);
        default: return '';
    }
}

// ============ SUPER ADMIN ANALYTICS ============
function renderSuperAdminAnalytics(data) {
    const ov = data.overview || {};
    setTimeout(() => {
        if (data.growth) initLineChart('superadmin-growth-chart', data.growth.labels, data.growth.values, 'New Schools');
        if (data.revenueTrend) initLineChart('superadmin-revenue-chart', data.revenueTrend.labels, data.revenueTrend.values, 'Revenue ($)');
        if (data.distributionByLevel) initDoughnutChart('superadmin-level-chart', Object.keys(data.distributionByLevel), Object.values(data.distributionByLevel));
        if (data.distributionByCurriculum) initDoughnutChart('superadmin-curriculum-chart', Object.keys(data.distributionByCurriculum), Object.values(data.distributionByCurriculum));
    }, 100);

    return `
        <div class="space-y-6 animate-fade-in">
            <h2 class="text-2xl font-bold">Platform Analytics</h2>
            <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div class="rounded-xl border bg-card p-6"><p class="text-sm text-muted-foreground">Total Schools</p><h3 class="text-2xl font-bold">${ov.totalSchools || 0}</h3></div>
                <div class="rounded-xl border bg-card p-6"><p class="text-sm text-muted-foreground">Active Schools</p><h3 class="text-2xl font-bold text-green-600">${ov.activeSchools || 0}</h3></div>
                <div class="rounded-xl border bg-card p-6"><p class="text-sm text-muted-foreground">Pending Approvals</p><h3 class="text-2xl font-bold text-yellow-600">${ov.pendingSchools || 0}</h3></div>
                <div class="rounded-xl border bg-card p-6"><p class="text-sm text-muted-foreground">Revenue (MTD)</p><h3 class="text-2xl font-bold">$${ov.revenueMTD || 0}</h3></div>
            </div>
            <div class="grid gap-4 lg:grid-cols-2">
                <div class="rounded-xl border bg-card p-6"><h3 class="font-semibold mb-4">School Growth</h3><canvas id="superadmin-growth-chart" height="200"></canvas></div>
                <div class="rounded-xl border bg-card p-6"><h3 class="font-semibold mb-4">Revenue Trend</h3><canvas id="superadmin-revenue-chart" height="200"></canvas></div>
            </div>
            <div class="grid gap-4 lg:grid-cols-2">
                <div class="rounded-xl border bg-card p-6"><h3 class="font-semibold mb-4">Schools by Level</h3><canvas id="superadmin-level-chart" height="200"></canvas></div>
                <div class="rounded-xl border bg-card p-6"><h3 class="font-semibold mb-4">Schools by Curriculum</h3><canvas id="superadmin-curriculum-chart" height="200"></canvas></div>
            </div>
            ${data.topSchools ? `
            <div class="rounded-xl border bg-card overflow-hidden">
                <div class="p-4 border-b"><h3 class="font-semibold">Top Schools by Students</h3></div>
                <table class="w-full text-sm"><thead><tr><th class="px-4 py-2 text-left">School</th><th class="px-4 py-2 text-left">Students</th></tr></thead>
                <tbody>${data.topSchools.map(s => `<tr><td class="px-4 py-2">${escapeHtml(s.name)}</td><td class="px-4 py-2">${s.studentCount}</td></tr>`).join('')}</tbody></table>
            </div>` : ''}
        </div>
    `;
}

// ============ ADMIN ANALYTICS ============
function renderAdminAnalytics(data) {
    const ov = data.overview || {};
    setTimeout(() => {
        if (data.enrollmentTrend) initLineChart('admin-enrollment-chart', data.enrollmentTrend.labels, data.enrollmentTrend.values, 'Students');
        if (data.gradeDistribution) initDoughnutChart('admin-grade-dist-chart', data.gradeDistribution.labels, data.gradeDistribution.values);
        if (data.attendanceByGrade) initBarChart('admin-attendance-chart', data.attendanceByGrade.labels, data.attendanceByGrade.values, 'Attendance %');
        if (data.feeStatus) initDoughnutChart('admin-fee-chart', Object.keys(data.feeStatus), Object.values(data.feeStatus));
    }, 100);

    return `
        <div class="space-y-6 animate-fade-in analytics-container">
            <h2 class="text-2xl font-bold">School Analytics</h2>
            
            <!-- KPI Cards -->
            <div class="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
                <div class="rounded-xl border bg-card p-4 analytics-card">
                    <p class="text-sm text-muted-foreground">Students</p>
                    <h3 class="text-xl font-bold">${ov.totalStudents || 0}</h3>
                </div>
                <div class="rounded-xl border bg-card p-4 analytics-card">
                    <p class="text-sm text-muted-foreground">Teachers</p>
                    <h3 class="text-xl font-bold">${ov.totalTeachers || 0}</h3>
                </div>
                <div class="rounded-xl border bg-card p-4 analytics-card">
                    <p class="text-sm text-muted-foreground">Classes</p>
                    <h3 class="text-xl font-bold">${ov.totalClasses || 0}</h3>
                </div>
                <div class="rounded-xl border bg-card p-4 analytics-card">
                    <p class="text-sm text-muted-foreground">Attendance</p>
                    <h3 class="text-xl font-bold">${ov.attendanceRate || 0}%</h3>
                </div>
                <div class="rounded-xl border bg-card p-4 analytics-card">
                    <p class="text-sm text-muted-foreground">Fee Collection</p>
                    <h3 class="text-xl font-bold">${ov.feeCollectionRate || 0}%</h3>
                </div>
            </div>

            <!-- First Chart Row -->
            <div class="grid gap-4 lg:grid-cols-2">
                <div class="rounded-xl border bg-card p-4 md:p-6 analytics-card">
                    <h3 class="font-semibold mb-4">Enrollment Trend</h3>
                    <div class="chart-container">
                        <canvas id="admin-enrollment-chart"></canvas>
                    </div>
                </div>
                <div class="rounded-xl border bg-card p-4 md:p-6 analytics-card">
                    <h3 class="font-semibold mb-4">Grade Distribution</h3>
                    <div class="chart-container">
                        <canvas id="admin-grade-dist-chart"></canvas>
                    </div>
                </div>
            </div>

            <!-- Second Chart Row -->
            <div class="grid gap-4 lg:grid-cols-2">
                <div class="rounded-xl border bg-card p-4 md:p-6 analytics-card">
                    <h3 class="font-semibold mb-4">Attendance by Grade</h3>
                    <div class="chart-container">
                        <canvas id="admin-attendance-chart"></canvas>
                    </div>
                </div>
                <div class="rounded-xl border bg-card p-4 md:p-6 analytics-card">
                    <h3 class="font-semibold mb-4">Fee Status</h3>
                    <div class="chart-container">
                        <canvas id="admin-fee-chart"></canvas>
                    </div>
                </div>
            </div>

            <!-- Class Averages Table -->
            ${data.classAverages ? `
            <div class="rounded-xl border bg-card overflow-hidden analytics-card">
                <div class="p-4 border-b">
                    <h3 class="font-semibold">Class Averages</h3>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-sm">
                        <thead class="bg-muted/50">
                            <tr>
                                <th class="px-4 py-2 text-left font-medium">Class</th>
                                <th class="px-4 py-2 text-left font-medium">Average</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y">
                            ${data.classAverages.map(c => `
                                <tr class="hover:bg-accent/50">
                                    <td class="px-4 py-2">${escapeHtml(c.class)}</td>
                                    <td class="px-4 py-2">${c.average}%</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            ` : ''}
        </div>
    `;
}

// ============ TEACHER ANALYTICS ============
function renderTeacherAnalytics(data) {
    const ov = data.overview || {};
    setTimeout(() => {
        if (data.subjectAverages && data.subjectAverages.length > 0) {
            initBarChart('teacher-subject-chart', data.subjectAverages.map(s => s.subject), data.subjectAverages.map(s => s.average), 'Avg Score');
        }
        if (data.attendanceTrend && data.attendanceTrend.labels && data.attendanceTrend.labels.length > 0) {
            initLineChart('teacher-attendance-trend', data.attendanceTrend.labels, data.attendanceTrend.values, 'Attendance %');
        }
        if (data.gradeDistribution && data.gradeDistribution.labels && data.gradeDistribution.labels.length > 0) {
            initBarChart('teacher-grade-chart', data.gradeDistribution.labels, data.gradeDistribution.values, 'Students');
        }
    }, 100);

    return `
        <div class="space-y-6 animate-fade-in analytics-container">
            <h2 class="text-2xl font-bold">My Class Analytics</h2>
            <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div class="rounded-xl border bg-card p-4"><p class="text-sm text-muted-foreground">My Students</p><h3 class="text-xl font-bold">${ov.studentCount || 0}</h3></div>
                <div class="rounded-xl border bg-card p-4"><p class="text-sm text-muted-foreground">Class Average</p><h3 class="text-xl font-bold">${ov.classAverage || 0}%</h3></div>
                <div class="rounded-xl border bg-card p-4"><p class="text-sm text-muted-foreground">Attendance Today</p><h3 class="text-xl font-bold">${ov.attendanceToday || '0/0'}</h3></div>
                <div class="rounded-xl border bg-card p-4"><p class="text-sm text-muted-foreground">Pending Tasks</p><h3 class="text-xl font-bold">${ov.pendingTasks || 0}</h3></div>
            </div>
            <div class="grid gap-4 lg:grid-cols-2">
                <div class="rounded-xl border bg-card p-6 analytics-card">
                    <h3 class="font-semibold mb-4">Subject Averages</h3>
                    <div class="chart-container">
                        <canvas id="teacher-subject-chart"></canvas>
                    </div>
                </div>
                <div class="rounded-xl border bg-card p-6 analytics-card">
                    <h3 class="font-semibold mb-4">Attendance Trend</h3>
                    <div class="chart-container">
                        <canvas id="teacher-attendance-trend"></canvas>
                    </div>
                </div>
            </div>
            <div class="rounded-xl border bg-card p-6 analytics-card">
                <h3 class="font-semibold mb-4">Grade Distribution</h3>
                <div class="chart-container">
                    <canvas id="teacher-grade-chart"></canvas>
                </div>
            </div>
            ${data.studentPerformance && data.studentPerformance.length > 0 ? `
            <div class="rounded-xl border bg-card overflow-hidden">
                <div class="p-4 border-b"><h3 class="font-semibold">Student Performance</h3></div>
                <table class="w-full text-sm"><thead><tr><th class="px-4 py-2 text-left">Student</th><th class="px-4 py-2 text-left">Average</th></tr></thead>
                <tbody>${data.studentPerformance.map(s => `<tr><td class="px-4 py-2">${escapeHtml(s.name)}</td><td class="px-4 py-2">${s.average}%</td></tr>`).join('')}</tbody></table>
            </div>` : ''}
        </div>
    `;
}

// ============ PARENT ANALYTICS ============
function renderParentAnalytics(data) {
    setTimeout(() => {
        if (data.gradeTrend && data.gradeTrend.labels && data.gradeTrend.labels.length > 0) {
            initLineChart('parent-grade-trend', data.gradeTrend.labels, data.gradeTrend.values, 'Score');
        }
    }, 100);

    return `
        <div class="space-y-6 animate-fade-in analytics-container">
            <div class="flex items-center gap-4">
                ${data.student?.photo ? `<img src="${data.student.photo}" class="h-16 w-16 rounded-full object-cover">` : ''}
                <div>
                    <h2 class="text-2xl font-bold">${escapeHtml(data.student?.name || 'Student')}</h2>
                    <p class="text-muted-foreground">Grade ${escapeHtml(data.student?.grade || 'N/A')} • ${escapeHtml(data.student?.elimuid || '')}</p>
                </div>
            </div>
            <div class="grid gap-4 md:grid-cols-3">
                <div class="rounded-xl border bg-card p-4"><p class="text-sm text-muted-foreground">Overall Average</p><h3 class="text-2xl font-bold">${data.overallAverage || 0}%</h3></div>
                <div class="rounded-xl border bg-card p-4"><p class="text-sm text-muted-foreground">Attendance Rate</p><h3 class="text-2xl font-bold">${data.attendanceRate || 0}%</h3></div>
                <div class="rounded-xl border bg-card p-4"><p class="text-sm text-muted-foreground">Fee Balance</p><h3 class="text-2xl font-bold ${data.feeBalance > 0 ? 'text-red-600' : 'text-green-600'}">$${data.feeBalance || 0}</h3></div>
            </div>
            <div class="rounded-xl border bg-card p-6 analytics-card">
                <h3 class="font-semibold mb-4">Grade Trend</h3>
                <div class="chart-container">
                    <canvas id="parent-grade-trend"></canvas>
                </div>
            </div>
            ${data.subjectPerformance && data.subjectPerformance.length > 0 ? `
            <div class="rounded-xl border bg-card overflow-hidden">
                <div class="p-4 border-b"><h3 class="font-semibold">Subject Performance</h3></div>
                <table class="w-full text-sm"><thead><tr><th class="px-4 py-2 text-left">Subject</th><th class="px-4 py-2 text-left">Score</th><th class="px-4 py-2 text-left">Grade</th></tr></thead>
                <tbody>${data.subjectPerformance.map(s => `<tr><td class="px-4 py-2">${escapeHtml(s.subject)}</td><td class="px-4 py-2">${s.score}%</td><td class="px-4 py-2">${s.grade}</td></tr>`).join('')}</tbody></table>
            </div>` : ''}
        </div>
    `;
}

// ============ STUDENT ANALYTICS ============
function renderStudentAnalytics(data) {
    setTimeout(() => {
        if (data.gradeTrend && data.gradeTrend.labels && data.gradeTrend.labels.length > 0) {
            initLineChart('student-grade-trend', data.gradeTrend.labels, data.gradeTrend.values, 'Score');
        }
    }, 100);

    return `
        <div class="space-y-6 animate-fade-in analytics-container">
            <div class="flex items-center gap-4">
                ${data.student?.photo ? `<img src="${data.student.photo}" class="h-16 w-16 rounded-full object-cover">` : ''}
                <div>
                    <h2 class="text-2xl font-bold">${escapeHtml(data.student?.name || 'Student')}</h2>
                    <p class="text-muted-foreground">Grade ${escapeHtml(data.student?.grade || 'N/A')} • ${escapeHtml(data.student?.elimuid || '')}</p>
                </div>
            </div>
            <div class="grid gap-4 md:grid-cols-4">
                <div class="rounded-xl border bg-card p-4"><p class="text-sm text-muted-foreground">Overall Average</p><h3 class="text-2xl font-bold">${data.overallAverage || 0}%</h3></div>
                <div class="rounded-xl border bg-card p-4"><p class="text-sm text-muted-foreground">Attendance</p><h3 class="text-2xl font-bold">${data.attendanceRate || 0}%</h3></div>
                <div class="rounded-xl border bg-card p-4"><p class="text-sm text-muted-foreground">Points</p><h3 class="text-2xl font-bold text-yellow-600">${data.points || 0}</h3></div>
                <div class="rounded-xl border bg-card p-4"><p class="text-sm text-muted-foreground">Class Rank</p><h3 class="text-2xl font-bold">#${data.leaderboardRank || '-'}</h3></div>
            </div>
            <div class="rounded-xl border bg-card p-6 analytics-card">
                <h3 class="font-semibold mb-4">Grade Trend</h3>
                <div class="chart-container">
                    <canvas id="student-grade-trend"></canvas>
                </div>
            </div>
            ${data.subjectPerformance && data.subjectPerformance.length > 0 ? `
            <div class="rounded-xl border bg-card overflow-hidden">
                <div class="p-4 border-b"><h3 class="font-semibold">Subject Performance</h3></div>
                <table class="w-full text-sm"><thead><tr><th class="px-4 py-2 text-left">Subject</th><th class="px-4 py-2 text-left">Score</th></tr></thead>
                <tbody>${data.subjectPerformance.map(s => `<tr><td class="px-4 py-2">${escapeHtml(s.subject)}</td><td class="px-4 py-2">${s.score}%</td></tr>`).join('')}</tbody></table>
            </div>` : ''}
        </div>
    `;
}

// ============ CHART HELPERS ============
function initLineChart(canvasId, labels, values, label) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    if (window[canvasId + '_chart']) window[canvasId + '_chart'].destroy();
    window[canvasId + '_chart'] = new Chart(ctx, {
        type: 'line',
        data: { labels, datasets: [{ label, data: values, borderColor: '#3b82f6', tension: 0.4, fill: false }] },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

function initBarChart(canvasId, labels, values, label) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    if (window[canvasId + '_chart']) window[canvasId + '_chart'].destroy();
    window[canvasId + '_chart'] = new Chart(ctx, {
        type: 'bar',
        data: { labels, datasets: [{ label, data: values, backgroundColor: '#3b82f6' }] },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

function initDoughnutChart(canvasId, labels, values) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    if (window[canvasId + '_chart']) window[canvasId + '_chart'].destroy();
    window[canvasId + '_chart'] = new Chart(ctx, {
        type: 'doughnut',
        data: { labels, datasets: [{ data: values, backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'] }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
    });
}

// Escape HTML utility
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Make globally available
window.renderAnalyticsSection = renderAnalyticsSection;
