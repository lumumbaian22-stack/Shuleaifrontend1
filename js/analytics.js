// Analytics and Charts
let charts = {};

// Initialize charts based on role and data
function initRoleCharts(role, data) {
    switch(role) {
        case 'superadmin':
            initSuperAdminCharts(data);
            break;
        case 'admin':
            initAdminCharts(data);
            break;
        case 'teacher':
            initTeacherCharts(data);
            break;
        case 'parent':
            initParentCharts(data);
            break;
        case 'student':
            initStudentCharts(data);
            break;
    }
}

// Super Admin Charts
function initSuperAdminCharts(data) {
    // School growth chart
    const growthCtx = document.getElementById('superadmin-growthChart');
    if (growthCtx) {
        if (charts.superGrowth) charts.superGrowth.destroy();
        charts.superGrowth = new Chart(growthCtx, {
            type: 'line',
            data: {
                labels: data?.growthLabels || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'New Schools',
                    data: data?.growthData || [2, 3, 4, 3, 5, 7],
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } }
            }
        });
    }
    
    // School distribution chart
    const distCtx = document.getElementById('superadmin-distChart');
    if (distCtx) {
        if (charts.superDist) charts.superDist.destroy();
        charts.superDist = new Chart(distCtx, {
            type: 'doughnut',
            data: {
                labels: data?.distributionLabels || ['Primary', 'Secondary', 'Mixed'],
                datasets: [{
                    data: data?.distributionData || [12, 18, 4],
                    backgroundColor: ['#3b82f6', '#8b5cf6', '#10b981'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { usePointStyle: true, padding: 20 }
                    }
                },
                cutout: '70%'
            }
        });
    }
}

// Admin Charts
function initAdminCharts(data) {
    // Enrollment chart
    const enrollCtx = document.getElementById('admin-enrollmentChart');
    if (enrollCtx) {
        if (charts.adminEnroll) charts.adminEnroll.destroy();
        charts.adminEnroll = new Chart(enrollCtx, {
            type: 'line',
            data: {
                labels: data?.enrollmentLabels || ['Term 1', 'Term 2', 'Term 3'],
                datasets: [{
                    label: 'Students',
                    data: data?.enrollmentData || [520, 535, 543],
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } }
            }
        });
    }
    
    // Grade distribution chart
    const gradeCtx = document.getElementById('admin-gradeChart');
    if (gradeCtx) {
        if (charts.adminGrade) charts.adminGrade.destroy();
        charts.adminGrade = new Chart(gradeCtx, {
            type: 'doughnut',
            data: {
                labels: data?.gradeLabels || ['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'],
                datasets: [{
                    data: data?.gradeData || [142, 138, 135, 128],
                    backgroundColor: ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { usePointStyle: true, padding: 20 }
                    }
                },
                cutout: '70%'
            }
        });
    }
    
    // Fairness score chart
    const fairnessCtx = document.getElementById('admin-fairnessChart');
    if (fairnessCtx) {
        if (charts.adminFairness) charts.adminFairness.destroy();
        charts.adminFairness = new Chart(fairnessCtx, {
            type: 'gauge',
            data: {
                datasets: [{
                    value: data?.fairnessScore || 85,
                    minValue: 0,
                    maxValue: 100,
                    data: [data?.fairnessScore || 85],
                    backgroundColor: ['#10b981'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } }
            }
        });
    }
}

// Teacher Charts
function initTeacherCharts(data) {
    // Performance chart
    const perfCtx = document.getElementById('teacher-performanceChart');
    if (perfCtx) {
        if (charts.teacherPerf) charts.teacherPerf.destroy();
        charts.teacherPerf = new Chart(perfCtx, {
            type: 'line',
            data: {
                labels: data?.performanceLabels || ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                datasets: [{
                    label: 'Class Average',
                    data: data?.performanceData || [74, 78, 76, 82],
                    borderColor: '#8b5cf6',
                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } }
            }
        });
    }
    
    // Grade distribution chart
    const gradeCtx = document.getElementById('teacher-gradeChart');
    if (gradeCtx) {
        if (charts.teacherGrade) charts.teacherGrade.destroy();
        charts.teacherGrade = new Chart(gradeCtx, {
            type: 'bar',
            data: {
                labels: data?.gradeLabels || ['A', 'B', 'C', 'D', 'E'],
                datasets: [{
                    label: 'Students',
                    data: data?.gradeData || [12, 18, 8, 4, 2],
                    backgroundColor: '#3b82f6',
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
                    x: { grid: { display: false } }
                }
            }
        });
    }
}

// Parent Charts
function initParentCharts(data) {
    const ctx = document.getElementById('parent-gradeChart');
    if (ctx) {
        if (charts.parentGrade) charts.parentGrade.destroy();
        charts.parentGrade = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data?.labels || ['Test 1', 'Test 2', 'Test 3', 'Exam'],
                datasets: [{
                    label: 'Child\'s Performance',
                    data: data?.performanceData || [72, 78, 75, 85],
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } }
            }
        });
    }
}

// Student Charts
function initStudentCharts(data) {
    const ctx = document.getElementById('student-gradeChart');
    if (ctx) {
        if (charts.studentGrade) charts.studentGrade.destroy();
        charts.studentGrade = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: data?.subjectLabels || ['Math', 'English', 'Science', 'History', 'Art'],
                datasets: [{
                    label: 'My Scores',
                    data: data?.subjectScores || [85, 78, 92, 88, 95],
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
}

// Update chart theme (dark/light mode)
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

// Export functions
window.initRoleCharts = initRoleCharts;
window.updateChartTheme = updateChartTheme;
window.charts = charts;