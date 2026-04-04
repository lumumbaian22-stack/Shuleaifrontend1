// analytics.js - Charts with real data

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
        // Fetch real data
        const [gradeStats, enrollmentStats] = await Promise.all([
            api.admin.getStudentGrades().catch(() => ({ data: {} })),
            api.admin.getAttendanceStats().catch(() => ({ data: {} }))
        ]);

        const gradeData = gradeStats.data || {};
        const enrollmentData = enrollmentStats.data || {};

        // Enrollment Chart
        const enrollCtx = document.getElementById('admin-enrollmentChart');
        if (enrollCtx) {
            if (charts.adminEnroll) charts.adminEnroll.destroy();

            const labels = enrollmentData.labels || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const values = enrollmentData.values || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

            if (values.every(v => v === 0)) {
                // Show "No data" message
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
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: { y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } }, x: { grid: { display: false } } }
                    }
                });
            }
        }

        // Grade Distribution Chart
        const gradeCtx = document.getElementById('admin-gradeChart');
        if (gradeCtx) {
            if (charts.adminGrade) charts.adminGrade.destroy();

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
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20 } }
                        },
                        cutout: '70%'
                    }
                });
            }
        }
    } catch (error) {
        console.error('Error initializing admin charts:', error);
        // Show error message in chart containers
        document.querySelectorAll('#admin-enrollmentChart, #admin-gradeChart').forEach(canvas => {
            canvas.parentElement.innerHTML = '<div class="flex items-center justify-center h-full"><p class="text-red-500">Failed to load chart data</p></div>';
        });
    }
}

async function initTeacherCharts(data) {
    // Subject Performance Chart (bar chart)
    const subjectCtx = document.getElementById('teacher-subjectChart');
    if (subjectCtx) {
        if (window.charts.teacherSubject) window.charts.teacherSubject.destroy();
        
        // Aggregate subject averages from student records
        const subjectScores = {};
        if (data.students && data.students.length) {
            for (const student of data.students) {
                if (student.records && student.records.length) {
                    student.records.forEach(record => {
                        if (!subjectScores[record.subject]) subjectScores[record.subject] = [];
                        subjectScores[record.subject].push(record.score);
                    });
                }
            }
        }
        const subjectLabels = Object.keys(subjectScores);
        const subjectAverages = subjectLabels.map(sub => 
            subjectScores[sub].reduce((a,b) => a+b, 0) / subjectScores[sub].length
        );
        
        if (subjectLabels.length === 0) {
            subjectCtx.parentElement.innerHTML = '<div class="flex items-center justify-center h-full"><p class="text-muted-foreground">No grade data available</p></div>';
        } else {
            window.charts.teacherSubject = new Chart(subjectCtx, {
                type: 'bar',
                data: {
                    labels: subjectLabels,
                    datasets: [{
                        label: 'Average Score (%)',
                        data: subjectAverages,
                        backgroundColor: '#8b5cf6',
                        borderRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: { y: { beginAtZero: true, max: 100, grid: { color: 'rgba(0,0,0,0.05)' } } }
                }
            });
        }
    }
    
    // Attendance Trend Chart (line chart)
    const attendanceCtx = document.getElementById('teacher-attendanceChart');
    if (attendanceCtx) {
        if (window.charts.teacherAttendance) window.charts.teacherAttendance.destroy();
        
        // Generate last 7 days attendance data (mock for now – you can replace with real API data)
        const dates = [];
        const attendanceRates = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            dates.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
            attendanceRates.push(Math.floor(Math.random() * 30) + 70); // placeholder 70-100%
        }
        
        window.charts.teacherAttendance = new Chart(attendanceCtx, {
            type: 'line',
            data: {
                labels: dates,
                datasets: [{
                    label: 'Attendance Rate (%)',
                    data: attendanceRates,
                    borderColor: '#f59e0b',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: { y: { beginAtZero: true, max: 100, grid: { color: 'rgba(0,0,0,0.05)' } } }
            }
        });
    }
}

async function initParentCharts(data) {
    const ctx = document.getElementById('parent-gradeChart');
    if (ctx) {
        if (charts.parentGrade) charts.parentGrade.destroy();

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
        if (charts.studentGrade) charts.studentGrade.destroy();

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
            if (charts.superGrowth) charts.superGrowth.destroy();

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
            if (charts.superDist) charts.superDist.destroy();

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
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20 } } },
                        cutout: '70%'
                    }
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
