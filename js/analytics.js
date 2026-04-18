// analytics.js - Complete chart system for all roles
let charts = {};

// ============ MAIN INITIALIZATION ============
async function initRoleCharts(role, data) {
    try {
        if (role === 'admin') {
            await initAdminCharts();
        } else if (role === 'teacher') {
            await initTeacherCharts(data);
        } else if (role === 'parent') {
            await initParentCharts(data);
        } else if (role === 'student') {
            await initStudentCharts(data);
        } else if (role === 'superadmin') {
            await initSuperAdminCharts();
        }
    } catch (error) {
        console.error('Chart initialization error:', error);
    }
}

// ============ ADMIN CHARTS ============
async function initAdminCharts() {
    try {
        const gradeCtx = document.getElementById('admin-gradeChart');
        const enrollCtx = document.getElementById('admin-enrollmentChart');
        
        if (charts.adminGrade) { charts.adminGrade.destroy(); charts.adminGrade = null; }
        if (charts.adminEnroll) { charts.adminEnroll.destroy(); charts.adminEnroll = null; }

        const [gradeRes, enrollRes] = await Promise.all([
            api.admin.getStudentGrades().catch(() => ({ data: {} })),
            api.admin.getAttendanceStats().catch(() => ({ data: {} }))
        ]);

        // Grade Distribution (Doughnut)
        if (gradeCtx) {
            const gData = gradeRes.data || {};
            const labels = gData.labels || ['A', 'B', 'C', 'D', 'E'];
            const values = gData.values || [0, 0, 0, 0, 0];
            if (values.every(v => v === 0)) {
                gradeCtx.parentElement.innerHTML = '<div class="flex items-center justify-center h-full"><p class="text-muted-foreground">No grade data yet</p></div>';
            } else {
                charts.adminGrade = new Chart(gradeCtx, {
                    type: 'doughnut',
                    data: {
                        labels: labels,
                        datasets: [{
                            data: values,
                            backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#f97316', '#ef4444'],
                            borderWidth: 0
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { position: 'bottom', labels: { usePointStyle: true } } },
                        cutout: '60%'
                    }
                });
            }
        }

        // Enrollment Trends (Line)
        if (enrollCtx) {
            const eData = enrollRes.data || {};
            const labels = eData.labels || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
            const values = eData.values || [0, 0, 0, 0, 0, 0];
            if (values.every(v => v === 0)) {
                enrollCtx.parentElement.innerHTML = '<div class="flex items-center justify-center h-full"><p class="text-muted-foreground">No enrollment data yet</p></div>';
            } else {
                charts.adminEnroll = new Chart(enrollCtx, {
                    type: 'line',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'Students',
                            data: values,
                            borderColor: '#3b82f6',
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            tension: 0.4,
                            fill: true
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: { y: { beginAtZero: true } }
                    }
                });
            }
        }
    } catch (error) {
        console.error('Admin charts error:', error);
    }
}

// ============ TEACHER CHARTS ============
async function initTeacherCharts(data) {
    const perfCtx = document.getElementById('teacher-performanceChart');
    const attCtx = document.getElementById('teacher-gradeChart');
    
    if (charts.teacherPerf) { charts.teacherPerf.destroy(); charts.teacherPerf = null; }
    if (charts.teacherGrade) { charts.teacherGrade.destroy(); charts.teacherGrade = null; }

    try {
        const response = await api.teacher.getPerformanceData();
        const perf = response.data || { subjectAverages: [], attendanceTrend: [] };

        if (perfCtx) {
            if (perf.subjectAverages && perf.subjectAverages.length > 0) {
                charts.teacherPerf = new Chart(perfCtx, {
                    type: 'line',
                    data: {
                        labels: perf.subjectAverages.map(s => s.subject),
                        datasets: [{
                            label: 'Average Score (%)',
                            data: perf.subjectAverages.map(s => s.average),
                            borderColor: '#8b5cf6',
                            backgroundColor: 'rgba(139, 92, 246, 0.1)',
                            tension: 0.4,
                            fill: true
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: { y: { beginAtZero: true, max: 100 } }
                    }
                });
            } else {
                perfCtx.parentElement.innerHTML = '<div class="flex items-center justify-center h-full"><p class="text-muted-foreground">No performance data yet</p></div>';
            }
        }

        if (attCtx) {
            if (perf.attendanceTrend && perf.attendanceTrend.length > 0) {
                charts.teacherGrade = new Chart(attCtx, {
                    type: 'bar',
                    data: {
                        labels: perf.attendanceTrend.map(a => moment(a.date).format('MMM D')),
                        datasets: [{
                            label: 'Attendance Rate (%)',
                            data: perf.attendanceTrend.map(a => a.rate),
                            backgroundColor: '#3b82f6',
                            borderRadius: 6
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: { y: { beginAtZero: true, max: 100 } }
                    }
                });
            } else {
                attCtx.parentElement.innerHTML = '<div class="flex items-center justify-center h-full"><p class="text-muted-foreground">No attendance data yet</p></div>';
            }
        }
    } catch (error) {
        console.error('Teacher charts error:', error);
        if (perfCtx) perfCtx.parentElement.innerHTML = '<div class="text-red-500">Failed to load chart</div>';
        if (attCtx) attCtx.parentElement.innerHTML = '<div class="text-red-500">Failed to load chart</div>';
    }
}

// ============ PARENT CHARTS ============
async function initParentCharts(data) {
    const ctx = document.getElementById('parent-gradeChart');
    if (!ctx) return;
    
    if (charts.parentGrade) { charts.parentGrade.destroy(); charts.parentGrade = null; }

    const records = data?.selectedChild?.recentRecords || [];
    if (records.length === 0) {
        ctx.parentElement.innerHTML = '<div class="flex items-center justify-center h-full"><p class="text-muted-foreground">No performance data yet</p></div>';
        return;
    }

    const scores = records.map(r => r.score);
    const labels = records.map(r => r.date ? new Date(r.date).toLocaleDateString() : '');

    charts.parentGrade = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Score (%)',
                data: scores,
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true, max: 100 } }
        }
    });
}

// ============ STUDENT CHARTS ============
async function initStudentCharts(data) {
    const ctx = document.getElementById('student-gradeChart');
    if (!ctx) return;
    
    if (charts.studentGrade) { charts.studentGrade.destroy(); charts.studentGrade = null; }

    const grades = data?.grades || [];
    if (grades.length === 0) {
        ctx.parentElement.innerHTML = '<div class="flex items-center justify-center h-full"><p class="text-muted-foreground">No grades yet</p></div>';
        return;
    }

    const subjectMap = {};
    grades.forEach(g => {
        if (!subjectMap[g.subject]) subjectMap[g.subject] = { total: 0, count: 0 };
        subjectMap[g.subject].total += g.score;
        subjectMap[g.subject].count++;
    });

    const labels = Object.keys(subjectMap);
    const values = labels.map(s => Math.round(subjectMap[s].total / subjectMap[s].count));

    charts.studentGrade = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: labels,
            datasets: [{
                label: 'My Scores',
                data: values,
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                borderColor: '#3b82f6',
                pointBackgroundColor: '#3b82f6'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { r: { beginAtZero: true, max: 100 } }
        }
    });
}

// ============ SUPER ADMIN CHARTS ============
async function initSuperAdminCharts() {
    try {
        const growthCtx = document.getElementById('superadmin-enrollmentChart');
        const distCtx = document.getElementById('superadmin-gradeChart');
        
        if (charts.superGrowth) { charts.superGrowth.destroy(); charts.superGrowth = null; }
        if (charts.superDist) { charts.superDist.destroy(); charts.superDist = null; }

        const [growthRes, distRes] = await Promise.all([
            api.superAdmin.getGrowthData().catch(() => ({ data: {} })),
            api.superAdmin.getSchoolDistribution().catch(() => ({ data: {} }))
        ]);

        if (growthCtx) {
            const gData = growthRes.data || {};
            const labels = gData.labels || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
            const values = gData.values || [0, 0, 0, 0, 0, 0];
            if (values.every(v => v === 0)) {
                growthCtx.parentElement.innerHTML = '<div class="flex items-center justify-center h-full"><p class="text-muted-foreground">No growth data yet</p></div>';
            } else {
                charts.superGrowth = new Chart(growthCtx, {
                    type: 'line',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'New Schools',
                            data: values,
                            borderColor: '#3b82f6',
                            tension: 0.4
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: { y: { beginAtZero: true } }
                    }
                });
            }
        }

        if (distCtx) {
            const dData = distRes.data || {};
            const labels = dData.labels || ['Primary', 'Secondary', 'Mixed'];
            const values = dData.values || [0, 0, 0];
            if (values.every(v => v === 0)) {
                distCtx.parentElement.innerHTML = '<div class="flex items-center justify-center h-full"><p class="text-muted-foreground">No distribution data yet</p></div>';
            } else {
                charts.superDist = new Chart(distCtx, {
                    type: 'doughnut',
                    data: {
                        labels: labels,
                        datasets: [{
                            data: values,
                            backgroundColor: ['#3b82f6', '#8b5cf6', '#10b981'],
                            borderWidth: 0
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { position: 'bottom', labels: { usePointStyle: true } } },
                        cutout: '60%'
                    }
                });
            }
        }
    } catch (error) {
        console.error('Super admin charts error:', error);
    }
}

// ============ THEME UPDATE ============
function updateChartTheme() {
    const isDark = document.documentElement.classList.contains('dark');
    const gridColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';
    const textColor = isDark ? '#94a3b8' : '#64748b';

    Object.values(charts).forEach(chart => {
        if (!chart) return;
        if (chart.options.scales) {
            Object.values(chart.options.scales).forEach(scale => {
                if (scale.grid) scale.grid.color = gridColor;
                if (scale.ticks) scale.ticks.color = textColor;
            });
        }
        if (chart.options.plugins?.legend?.labels) {
            chart.options.plugins.legend.labels.color = textColor;
        }
        chart.update();
    });
}

window.initRoleCharts = initRoleCharts;
window.updateChartTheme = updateChartTheme;
window.charts = charts;
