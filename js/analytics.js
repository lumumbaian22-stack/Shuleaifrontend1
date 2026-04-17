// analytics.js - Charts with real data and proper destruction

let charts = {};

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

async function initAdminCharts() {
    try {
        const [gradeStats, enrollmentStats] = await Promise.all([
            api.admin.getStudentGrades().catch(() => ({ data: {} })),
            api.admin.getAttendanceStats().catch(() => ({ data: {} }))
        ]);

        const gradeData = gradeStats.data || {};
        const enrollmentData = enrollmentStats.data || {};

        const enrollCtx = document.getElementById('admin-enrollmentChart');
        if (enrollCtx) {
            if (charts.adminEnroll) {
                charts.adminEnroll.destroy();
                charts.adminEnroll = null;
            }
            const labels = enrollmentData.labels || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const values = enrollmentData.values || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            if (values.every(v => v === 0)) {
                enrollCtx.parentElement.innerHTML = '<div class="flex items-center justify-center h-full"><p class="text-muted-foreground">No enrollment data available</p></div>';
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
                    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
                });
            }
        }

        const gradeCtx = document.getElementById('admin-gradeChart');
        if (gradeCtx) {
            if (charts.adminGrade) {
                charts.adminGrade.destroy();
                charts.adminGrade = null;
            }
            const gradeLabels = gradeData.labels || ['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];
            const gradeValues = gradeData.values || [0, 0, 0, 0];
            if (gradeValues.every(v => v === 0)) {
                gradeCtx.parentElement.innerHTML = '<div class="flex items-center justify-center h-full"><p class="text-muted-foreground">No grade distribution data available</p></div>';
            } else {
                charts.adminGrade = new Chart(gradeCtx, {
                    type: 'doughnut',
                    data: {
                        labels: gradeLabels,
                        datasets: [{
                            data: gradeValues,
                            backgroundColor: ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b'],
                            borderWidth: 0
                        }]
                    },
                    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20 } } }, cutout: '70%' }
                });
            }
        }
    } catch (error) {
        console.error('Error initializing admin charts:', error);
    }
}

async function initTeacherCharts(data) {
    const perfCtx = document.getElementById('teacher-performanceChart');
    const gradeCtx = document.getElementById('teacher-gradeChart');
    
    try {
        const response = await api.teacher.getPerformanceData();
        const perf = response.data;
        
        if (perfCtx) {
            if (charts.teacherPerf) {
                charts.teacherPerf.destroy();
                charts.teacherPerf = null;
            }
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
                    options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, max: 100 } } }
                });
            } else {
                perfCtx.parentElement.innerHTML = '<div class="flex items-center justify-center h-full"><p class="text-muted-foreground">No performance data yet</p></div>';
            }
        }
        
        if (gradeCtx) {
            if (charts.teacherGrade) {
                charts.teacherGrade.destroy();
                charts.teacherGrade = null;
            }
            if (perf.attendanceTrend && perf.attendanceTrend.length > 0) {
                charts.teacherGrade = new Chart(gradeCtx, {
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
                    options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, max: 100 } } }
                });
            } else {
                gradeCtx.parentElement.innerHTML = '<div class="flex items-center justify-center h-full"><p class="text-muted-foreground">No attendance data yet</p></div>';
            }
        }
    } catch (error) {
        console.error('Teacher chart error:', error);
        if (perfCtx) perfCtx.parentElement.innerHTML = '<div class="flex items-center justify-center h-full"><p class="text-red-500">Failed to load data</p></div>';
        if (gradeCtx) gradeCtx.parentElement.innerHTML = '<div class="flex items-center justify-center h-full"><p class="text-red-500">Failed to load data</p></div>';
    }
}

async function initParentCharts(data) {
    const ctx = document.getElementById('parent-gradeChart');
    if (ctx) {
        if (charts.parentGrade) {
            charts.parentGrade.destroy();
            charts.parentGrade = null;
        }
        const performanceData = data?.performanceData || [];
        if (performanceData.length === 0) {
            ctx.parentElement.innerHTML = '<div class="flex items-center justify-center h-full"><p class="text-muted-foreground">No performance data available</p></div>';
        } else {
            charts.parentGrade = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: performanceData.map(p => p.date) || ['Test 1', 'Test 2', 'Test 3', 'Exam'],
                    datasets: [{
                        label: 'Child\'s Performance',
                        data: performanceData.map(p => p.score) || [0, 0, 0, 0],
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
            });
        }
    }
}

async function initStudentCharts(data) {
    const ctx = document.getElementById('student-gradeChart');
    if (ctx) {
        if (charts.studentGrade) {
            charts.studentGrade.destroy();
            charts.studentGrade = null;
        }
        const subjectScores = data?.subjectScores || [];
        if (subjectScores.length === 0) {
            ctx.parentElement.innerHTML = '<div class="flex items-center justify-center h-full"><p class="text-muted-foreground">No grades available</p></div>';
        } else {
            charts.studentGrade = new Chart(ctx, {
                type: 'radar',
                data: {
                    labels: subjectScores.map(s => s.subject) || ['Math', 'English', 'Science', 'History', 'Art'],
                    datasets: [{
                        label: 'My Scores',
                        data: subjectScores.map(s => s.score) || [0, 0, 0, 0, 0],
                        backgroundColor: 'rgba(59, 130, 246, 0.2)',
                        borderColor: '#3b82f6',
                        pointBackgroundColor: '#3b82f6'
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false, scales: { r: { beginAtZero: true, max: 100 } } }
            });
        }
    }
}

async function initSuperAdminCharts() {
    try {
        const [growthData, distributionData] = await Promise.all([
            api.superAdmin.getGrowthData().catch(() => ({ data: {} })),
            api.superAdmin.getSchoolDistribution().catch(() => ({ data: {} }))
        ]);

        const growthCtx = document.getElementById('superadmin-enrollmentChart');
        if (growthCtx) {
            if (charts.superGrowth) {
                charts.superGrowth.destroy();
                charts.superGrowth = null;
            }
            const labels = growthData.data?.labels || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
            const values = growthData.data?.values || [0, 0, 0, 0, 0, 0];
            if (values.every(v => v === 0)) {
                growthCtx.parentElement.innerHTML = '<div class="flex items-center justify-center h-full"><p class="text-muted-foreground">No growth data available</p></div>';
            } else {
                charts.superGrowth = new Chart(growthCtx, {
                    type: 'line',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'New Schools',
                            data: values,
                            borderColor: '#3b82f6',
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            tension: 0.4,
                            fill: true
                        }]
                    },
                    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
                });
            }
        }

        const distCtx = document.getElementById('superadmin-gradeChart');
        if (distCtx) {
            if (charts.superDist) {
                charts.superDist.destroy();
                charts.superDist = null;
            }
            const distLabels = distributionData.data?.labels || ['Primary', 'Secondary', 'Mixed'];
            const distValues = distributionData.data?.values || [0, 0, 0];
            if (distValues.every(v => v === 0)) {
                distCtx.parentElement.innerHTML = '<div class="flex items-center justify-center h-full"><p class="text-muted-foreground">No distribution data available</p></div>';
            } else {
                charts.superDist = new Chart(distCtx, {
                    type: 'doughnut',
                    data: {
                        labels: distLabels,
                        datasets: [{
                            data: distValues,
                            backgroundColor: ['#3b82f6', '#8b5cf6', '#10b981'],
                            borderWidth: 0
                        }]
                    },
                    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20 } } }, cutout: '70%' }
                });
            }
        }
    } catch (error) {
        console.error('Error initializing super admin charts:', error);
    }
}

function updateChartTheme() {
    const isDark = document.documentElement.classList.contains('dark');
    const gridColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';
    const textColor = isDark ? '#94a3b8' : '#64748b';

    Object.values(charts).forEach(chart => {
        if (chart && chart.options) {
            if (chart.options.scales) {
                if (chart.options.scales.y) {
                    if (chart.options.scales.y.grid) chart.options.scales.y.grid.color = gridColor;
                    if (chart.options.scales.y.ticks) chart.options.scales.y.ticks.color = textColor;
                }
                if (chart.options.scales.x) {
                    if (chart.options.scales.x.ticks) chart.options.scales.x.ticks.color = textColor;
                }
                if (chart.options.scales.r) {
                    if (chart.options.scales.r.grid) chart.options.scales.r.grid.color = gridColor;
                    if (chart.options.scales.r.angleLines) chart.options.scales.r.angleLines.color = gridColor;
                    if (chart.options.scales.r.ticks) chart.options.scales.r.ticks.color = textColor;
                }
            }
            if (chart.options.plugins?.legend?.labels) {
                chart.options.plugins.legend.labels.color = textColor;
            }
            chart.update();
        }
    });
}

window.initRoleCharts = initRoleCharts;
window.updateChartTheme = updateChartTheme;
window.charts = charts;
