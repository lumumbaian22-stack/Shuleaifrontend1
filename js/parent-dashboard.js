// parent-dashboard.js - Complete Parent Dashboard with Analytics Support
// Use global dashboardData from dashboard-controller.js
if (typeof window.dashboardData === 'undefined') window.dashboardData = {};
var dashboardData = window.dashboardData;
function parentSelectedChildStorageKey() {
    try { const user = typeof getCurrentUser === 'function' ? getCurrentUser() : {}; return window.parentSelectedChildKey ? window.parentSelectedChildKey(user?.id) : `selectedChild:${user?.id || 'unknown-parent'}`; } catch (_) { return 'selectedChild:unknown-parent'; }
}
function getStoredSelectedChildId() { return localStorage.getItem(parentSelectedChildStorageKey()) || localStorage.getItem('shule_selected_child_id') || ''; }
function setStoredSelectedChildId(id) { localStorage.setItem(parentSelectedChildStorageKey(), String(id || '')); localStorage.setItem('shule_selected_child_id', String(id || '')); }


function getParentChildDisplay(child) {
    const name = child?.name || child?.User?.name || 'Student';
    const className = child?.className || child?.grade || 'Not Assigned';
    const schoolName = child?.schoolName || child?.schoolCode || 'School';
    return { name, className, schoolName };
}

function renderParentChildSwitcher(children, selectedChildId) {
    if (!children || children.length === 0) {
        return `
            <div class="rounded-xl border bg-card p-4">
                <div class="flex items-start gap-3">
                    <div class="h-10 w-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
                        <i data-lucide="link" class="h-5 w-5"></i>
                    </div>
                    <div class="flex-1">
                        <h3 class="font-semibold">No linked children yet</h3>
                        <p class="text-sm text-muted-foreground">Enter your child’s Elimu ID to securely link them to your parent account.</p>
                        <div class="mt-3 flex flex-col sm:flex-row gap-2">
                            <input id="parent-link-elimuid" class="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm font-mono" placeholder="Enter Elimu ID">
                            <button onclick="linkParentChildByElimuId()" class="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm">Link Child</button>
                        </div>
                    </div>
                </div>
            </div>`;
    }

    const selected = children.find(c => String(c.id) === String(selectedChildId)) || children[0];
    const display = getParentChildDisplay(selected);
    const options = children.map(child => {
        const d = getParentChildDisplay(child);
        return `<option value="${escapeHtml(String(child.id))}" ${String(child.id) === String(selected?.id) ? 'selected' : ''}>${escapeHtml(d.name)} — ${escapeHtml(d.className)} • ${escapeHtml(d.schoolName)}</option>`;
    }).join('');

    if (children.length === 1) {
        return `
            <div class="rounded-xl border bg-card p-4" id="child-selector">
                <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                        <p class="text-xs uppercase tracking-wide text-muted-foreground">Viewing child</p>
                        <h3 class="text-lg font-semibold">${escapeHtml(display.name)}</h3>
                        <p class="text-sm text-muted-foreground">${escapeHtml(display.className)} • ${escapeHtml(display.schoolName)}</p>
                    </div>
                    <div class="flex flex-col sm:flex-row gap-2">
                        <input id="parent-link-elimuid" class="rounded-lg border border-input bg-background px-3 py-2 text-sm font-mono" placeholder="Add another child by Elimu ID">
                        <button onclick="linkParentChildByElimuId()" class="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm">Add Child</button>
                    </div>
                </div>
            </div>`;
    }

    return `
        <div class="rounded-xl border bg-card p-4" id="child-selector">
            <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                    <p class="text-xs uppercase tracking-wide text-muted-foreground">Viewing child</p>
                    <h3 class="text-lg font-semibold">${escapeHtml(display.name)}</h3>
                    <p class="text-sm text-muted-foreground">${escapeHtml(display.className)} • ${escapeHtml(display.schoolName)}</p>
                </div>
                <div class="flex flex-col sm:flex-row gap-2 md:min-w-[380px]">
                    <select id="parent-child-switcher" onchange="selectChild(this.value)" class="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm">
                        ${options}
                    </select>
                    <button onclick="toggleParentAddChildBox()" class="px-4 py-2 bg-muted rounded-lg text-sm">Add Child</button>
                </div>
            </div>
            <div id="parent-add-child-box" class="hidden mt-3 pt-3 border-t">
                <div class="flex flex-col sm:flex-row gap-2">
                    <input id="parent-link-elimuid" class="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm font-mono" placeholder="Enter another child’s Elimu ID">
                    <button onclick="linkParentChildByElimuId()" class="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm">Link Child</button>
                </div>
                <p class="text-xs text-muted-foreground mt-2">Only children linked through their real Elimu ID appear here. Each child allows a maximum of two parent/guardian accounts.</p>
            </div>
        </div>`;
}

async function renderParentSection(section) {
    switch(section) {
        case 'dashboard':
            return await renderParentDashboard();
        case 'progress':
            return await renderParentProgress();
        case 'child-attendance':
            return await window.renderParentAttendanceCentre();
        case 'report-history':
            return await window.renderReportHistoryCentre('parent');
        case 'school-history':
            return await window.renderOwnEnrollmentHistory('parent');
        case 'child-subscription':
            return await window.renderParentSubscriptionCentre();
        case 'competency':
            return await renderParentCompetency();    
        case 'payments':
            return await (window.v12RenderParentPayments || window.renderParentPayments)();
        case 'timetable':
            return await (window.v12RenderParentTimetable || window.renderParentTimetable || window.renderAdminTimetable)();
        case 'help':
            return renderHelpSection();
        case 'chat':
            return await renderParentChat();
        case 'subject-choice':
            return await window.renderSeniorSubjectChoice('parent');
        case 'profile':
        case 'settings':
            return await renderProfileSection();
        case 'analytics':                               // <-- ADDED
            return await renderAnalyticsSection('parent');
        case 'alerts':
            return await (window.v12RenderAlertsCenter || window.renderAlertsCenter)('parent');
            default:
            return await renderParentDashboard();
    }
}

async function renderParentCompetency() {
  const selectedChildId = dashboardData?.selectedChildId;
  if (!selectedChildId) return `<div class="text-center py-8 text-muted-foreground">Select a child first</div>`;
  const progress = await apiRequest(`/api/cbe/student-progress/${selectedChildId}`);
  const compMap = {};
  progress.data.forEach(p => {
    const comp = p.LearningOutcome.Competency;
    if (!compMap[comp.id]) compMap[comp.id] = { name: comp.name, levels: [] };
    compMap[comp.id].levels.push(p.level);
  });
  const chartData = Object.values(compMap).map(comp => ({
    competency: comp.name,
    averageLevel: comp.levels.reduce((sum, l) => sum + (l === 'EE' ? 4 : l === 'ME' ? 3 : l === 'AE' ? 2 : 1), 0) / comp.levels.length
  }));
  return `<div class="space-y-6"><h2 class="text-2xl font-bold">Competency Progress</h2><canvas id="parent-competency-chart" height="300"></canvas><script>
    new Chart(document.getElementById('parent-competency-chart'), {
      type: 'bar',
      data: { labels: ${JSON.stringify(chartData.map(c => c.competency))}, datasets: [{ label: 'Average Level (1-4)', data: ${JSON.stringify(chartData.map(c => c.averageLevel))}, backgroundColor: '#3b82f6' }] }
    });
  </script></div>`;
}

async function renderParentDashboard() {
    try {
        const school = getCurrentSchool();
        const childrenResponse = await api.parent.getChildren();
        const children = childrenResponse.data || [];

        let selectedChildSummary = null;
        let selectedChildId = getStoredSelectedChildId() || (children.length > 0 ? children[0].id : null);

        if (selectedChildId && children.length > 0) {
            // Verify child still belongs to parent
            const childExists = children.find(c => String(c.id) === String(selectedChildId));
            if (!childExists) {
                selectedChildId = children[0].id;
                localStorage.setItem('shule_selected_child_id', selectedChildId);
            }
            
            const summaryResponse = await api.parent.getChildSummary(selectedChildId);
            selectedChildSummary = summaryResponse.data;
        }

        // Update global dashboardData without overwriting the object reference
        Object.assign(dashboardData, {
            children: children,
            selectedChild: selectedChildSummary,
            selectedChildId: selectedChildId
        });
        window.dashboardData = dashboardData;

        const selectedChildMeta = children.find(c => String(c.id) === String(selectedChildId));
        if (selectedChildMeta) {
            localStorage.setItem('shule_selected_child_school_code', selectedChildMeta.schoolCode || '');
            localStorage.setItem('shule_selected_child_school_name', selectedChildMeta.schoolName || '');
            if (window.ShuleBrandingManager?.applyGlobalBranding) {
                window.ShuleBrandingManager.applyGlobalBranding({ schoolName: selectedChildMeta.schoolName, schoolLogo: selectedChildMeta.schoolLogo });
            }
        }

        let html = `
            <div class="space-y-6 animate-fade-in">
                <!-- School Name Header -->
                <div class="rounded-xl border bg-card p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700">
                    <div class="flex items-center justify-between">
                        <div>
                            <h2 id="parent-school-name" class="text-xl font-semibold">${escapeHtml(selectedChildSummary?.school?.name || children.find(c => String(c.id) === String(selectedChildId))?.schoolName || school?.name || 'Your School')}</h2>
                            <p class="text-sm text-muted-foreground">Parent Portal</p>
                        </div>
                        <div class="bg-white dark:bg-gray-800 px-3 py-1 rounded-lg shadow-sm">
                            <p class="text-xs text-muted-foreground">School Code</p>
                            <p class="text-sm font-mono font-bold">${escapeHtml(selectedChildSummary?.school?.schoolId || children.find(c => String(c.id) === String(selectedChildId))?.schoolCode || school?.shortCode || 'SHL-XXXXX')}</p>
                        </div>
                    </div>
                </div>

                ${renderParentChildSwitcher(children, selectedChildId)}
        `;

        const parent = getCurrentUser();
        if (parent.trialEndsAt && new Date(parent.trialEndsAt) > new Date()) {
            const daysLeft = Math.ceil((new Date(parent.trialEndsAt) - new Date()) / (1000*60*60*24));
            html += `<div class="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4 flex justify-between items-center">
                <div><i data-lucide="gift" class="h-5 w-5 inline mr-2 text-amber-600"></i> <span class="font-medium">Free Trial Active</span> – ${daysLeft} day${daysLeft !== 1 ? 's' : ''} remaining</div>
                <button class="px-4 py-2 bg-primary text-white rounded-lg text-sm" disabled>Upgrade Now</button>
            </div>`;
        }
        
        if (selectedChildSummary) {
            const classTeacher = selectedChildSummary.classTeacher;
            const student = selectedChildSummary.student || {};
            const avgScore = selectedChildSummary.averageScore || 0;
            const recentRecords = selectedChildSummary.recentRecords || [];
            const recentAttendance = selectedChildSummary.recentAttendance || [];
            const outstandingFees = selectedChildSummary.outstandingFees || null;

            const attendanceRate = recentAttendance.length > 0 
                ? Math.round((recentAttendance.filter(a => a.status === 'present').length / recentAttendance.length) * 100) 
                : 0;

            const feeBalance = outstandingFees?.balance || 0;

            if (classTeacher) {
                html += `
                    <div class="rounded-xl border bg-card p-4 mb-4">
                        <div class="flex items-center gap-3">
                            <div class="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <i data-lucide="user" class="h-5 w-5 text-primary"></i>
                            </div>
                            <div>
                                <p class="text-xs text-muted-foreground">Class Teacher</p>
                                <p class="font-medium">${escapeHtml(classTeacher.name || 'Not Assigned')}</p>
                                <p class="text-xs text-muted-foreground">${escapeHtml(classTeacher.email || '')}</p>
                            </div>
                        </div>
                    </div>
                `;
            }

            html += `
                <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div class="rounded-xl border bg-card p-6 card-hover">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-muted-foreground">ELIMUID</p>
                                <h3 class="text-lg font-mono font-bold mt-1">${escapeHtml(student.elimuid || 'N/A')}</h3>
                            </div>
                            <div class="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center">
                                <i data-lucide="id-card" class="h-6 w-6 text-purple-600"></i>
                            </div>
                        </div>
                    </div>
                    
                    <div class="rounded-xl border bg-card p-6 card-hover">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-muted-foreground">Class Average</p>
                                <h3 class="text-2xl font-bold mt-1">${avgScore}%</h3>
                                <p class="text-xs text-muted-foreground mt-1">Overall performance</p>
                            </div>
                            <div class="h-12 w-12 rounded-lg bg-violet-100 flex items-center justify-center">
                                <i data-lucide="trending-up" class="h-6 w-6 text-violet-600"></i>
                            </div>
                        </div>
                    </div>
                    
                    <div class="rounded-xl border bg-card p-6 card-hover">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-muted-foreground">Attendance</p>
                                <h3 class="text-2xl font-bold mt-1">${attendanceRate}%</h3>
                                <p class="text-xs text-muted-foreground mt-1">Last ${recentAttendance.length} days</p>
                            </div>
                            <div class="h-12 w-12 rounded-lg bg-amber-100 flex items-center justify-center">
                                <i data-lucide="calendar-check" class="h-6 w-6 text-amber-600"></i>
                            </div>
                        </div>
                    </div>
                    
                    <div class="rounded-xl border bg-card p-6 card-hover">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-muted-foreground">Fee Balance</p>
                                <h3 class="text-2xl font-bold mt-1 ${feeBalance > 0 ? 'text-red-600' : 'text-green-600'}">
                                    $${feeBalance}
                                </h3>
                                <p class="text-xs text-muted-foreground mt-1">${feeBalance > 0 ? 'Outstanding' : 'Paid in full'}</p>
                            </div>
                            <div class="h-12 w-12 rounded-lg ${feeBalance > 0 ? 'bg-red-100' : 'bg-green-100'} flex items-center justify-center">
                                <i data-lucide="credit-card" class="h-6 w-6 ${feeBalance > 0 ? 'text-red-600' : 'text-green-600'}"></i>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Recent Alerts removed from parent dashboard by V97. Alerts live only in the Alerts Center. -->

                <!-- Live Attendance -->
                <div class="rounded-xl border bg-card p-6">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="font-semibold">Today's Attendance</h3>
                        <span class="text-xs text-muted-foreground" id="attendance-date"></span>
                    </div>
                    <div id="live-attendance-status" class="text-center py-4">
                        <div class="text-muted-foreground">Loading...</div>
                    </div>
                    <div class="mt-3">
                        <h4 class="text-sm font-medium mb-2">This Week</h4>
                        <div id="weekly-attendance-calendar" class="flex gap-1"></div>
                    </div>
                </div>

                <div class="rounded-xl border bg-card p-4">
                    <div class="grid gap-2 sm:grid-cols-3">
                        <button onclick="openReportCard(${selectedChildId})" class="w-full px-4 py-2 bg-primary text-white rounded-lg flex items-center justify-center gap-2">
                            <i data-lucide="file-text" class="h-4 w-4"></i> View Latest
                        </button>
                        <button onclick="downloadReportCard(${selectedChildId})" class="w-full px-4 py-2 border rounded-lg flex items-center justify-center gap-2 hover:bg-accent">
                            <i data-lucide="download" class="h-4 w-4"></i> Download PDF
                        </button>
                        <button onclick="openReportHistory(${selectedChildId})" class="w-full px-4 py-2 border rounded-lg flex items-center justify-center gap-2 hover:bg-accent">
                            <i data-lucide="history" class="h-4 w-4"></i> Report History
                        </button>
                    </div>
                </div>
                
                <div class="rounded-xl border bg-card overflow-hidden">
                    <div class="p-4 border-b">
                        <h3 class="font-semibold">Recent Grades</h3>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="w-full text-sm">
                            <thead class="bg-muted/50">
                                <tr>
                                    <th class="px-4 py-3 text-left font-medium">Subject</th>
                                    <th class="px-4 py-3 text-left font-medium">Assessment</th>
                                    <th class="px-4 py-3 text-center font-medium">Score</th>
                                    <th class="px-4 py-3 text-center font-medium">Grade</th>
                                    <th class="px-4 py-3 text-left font-medium">Date</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y">
                                ${recentRecords.slice(0, 5).map(record => {
                                    const score = record.score || 0;
                                    const curriculum = window.schoolSettings?.curriculum || window.schoolSettings?.system || 'cbc';
                                    const level = window.schoolSettings?.schoolLevel || window.schoolSettings?.settings?.schoolLevel || 'secondary';
                                    const grade = getGradeFromScore(score, curriculum, level);
                                    const gradeClass = grade === 'A' || grade === 'EE' ? 'bg-green-100 text-green-700' :
                                                       grade === 'B' || grade === 'ME' ? 'bg-blue-100 text-blue-700' :
                                                       grade === 'C' || grade === 'AE' ? 'bg-yellow-100 text-yellow-700' :
                                                       'bg-red-100 text-red-700';
                                    return `
                                        <tr class="hover:bg-accent/50 transition-colors">
                                            <td class="px-4 py-3 font-medium">${escapeHtml(record.subject || 'N/A')}</td>
                                            <td class="px-4 py-3">${escapeHtml(record.assessmentName || record.assessmentType || 'N/A')}</td>
                                            <td class="px-4 py-3 text-center">${score}%</td>
                                            <td class="px-4 py-3 text-center">
                                                <span class="px-2 py-1 ${gradeClass} text-xs rounded-full">${grade}</span>
                                            </td>
                                            <td class="px-4 py-3">${record.date ? formatDate(record.date) : 'N/A'}</td>
                                        </tr>
                                    `;
                                }).join('')}
                                ${recentRecords.length === 0 ? `
                                    <tr>
                                        <td colspan="5" class="px-4 py-8 text-center text-muted-foreground">
                                            No grade records available
                                        </td>
                                    </tr>
                                ` : ''}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div id="home-tasks-container" class="rounded-xl border bg-card p-6">${await renderHomeTasks()}
                </div>
                
                <div class="rounded-xl border bg-card p-6">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="font-semibold">Report Absence</h3>
                    </div>
                    <div class="space-y-3">
                        <div>
                            <label class="block text-sm font-medium mb-1">Date</label>
                            <input type="date" id="absence-date" value="${new Date().toISOString().split('T')[0]}" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                        </div>
                        <div>
                            <label class="block text-sm font-medium mb-1">Reason</label>
                            <textarea id="absence-reason" rows="2" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" placeholder="Why will your child be absent?"></textarea>
                        </div>
                        <button onclick="reportAbsence()" class="w-full bg-primary text-primary-foreground py-2 rounded-lg hover:bg-primary/90">
                            Report Absence
                        </button>
                    </div>
                </div>
            `;
        }

        html += `</div>`;

        // Load live attendance after DOM is updated. Recent Alerts were removed from dashboard to avoid child-alert leakage; use Alerts Center only.
        setTimeout(() => {
            if (selectedChildId) {
                loadLiveAttendance();
            }
        }, 200);

        return html;

    } catch (error) {
        console.error('Parent dashboard error:', error);
        return `<div class="text-center py-12 text-red-500">Error loading dashboard: ${error.message}</div>`;
    }
}

async function renderParentProgress() {
    try {
        const school = getCurrentSchool();
        const selectedChildId = dashboardData?.selectedChildId;

        if (!selectedChildId) {
            return `<div class="text-center py-12">Please select a child first</div>`;
        }

        const summaryResponse = await api.parent.getChildSummary(selectedChildId);
        const childData = summaryResponse.data;

        const records = childData?.recentRecords || [];
        const avgScore = childData?.averageScore || 0;

        setTimeout(() => {
            const ctx = document.getElementById('parent-gradeChart');
            if (ctx && typeof Chart !== 'undefined') {
                if (window.parentChart) window.parentChart.destroy();
                window.parentChart = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: records.map(r => r.date ? formatDate(r.date) : ''),
                        datasets: [{
                            label: 'Performance',
                            data: records.map(r => r.score || 0),
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
        }, 100);

        return `
            <div class="space-y-6 animate-fade-in">
                <!-- School Name Header -->
                <div class="rounded-xl border bg-card p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700">
                    <h2 id="parent-school-name-progress" class="text-xl font-semibold">${escapeHtml(school?.name || 'Your School')}</h2>
                    <p class="text-sm text-muted-foreground">Academic Progress - ${escapeHtml(childData?.student?.name || 'Student')}</p>
                </div>

                <div class="grid gap-4 md:grid-cols-3">
                    <div class="rounded-xl border bg-card p-6">
                        <p class="text-sm text-muted-foreground">Overall Average</p>
                        <p class="text-3xl font-bold ${avgScore >= 80 ? 'text-green-600' : avgScore >= 60 ? 'text-yellow-600' : 'text-red-600'}">
                            ${avgScore}%
                        </p>
                    </div>
                    <div class="rounded-xl border bg-card p-6">
                        <p class="text-sm text-muted-foreground">Total Assessments</p>
                        <p class="text-3xl font-bold">${records.length}</p>
                    </div>
                    <div class="rounded-xl border bg-card p-6">
                        <p class="text-sm text-muted-foreground">Last Assessment</p>
                        <p class="text-3xl font-bold text-blue-600">${records[0]?.score || 0}%</p>
                    </div>
                </div>

                <div class="rounded-xl border bg-card p-6">
                    <h3 class="font-semibold mb-4">Performance Over Time</h3>
                    <div class="chart-container h-80">
                        <canvas id="parent-gradeChart"></canvas>
                    </div>
                </div>

                <div class="rounded-xl border bg-card overflow-hidden">
                    <div class="p-4 border-b">
                        <h3 class="font-semibold">Detailed Grades</h3>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="w-full text-sm">
                            <thead class="bg-muted/50">
                                <tr>
                                    <th class="px-4 py-3 text-left font-medium">Subject</th>
                                    <th class="px-4 py-3 text-left font-medium">Assessment</th>
                                    <th class="px-4 py-3 text-center font-medium">Score</th>
                                    <th class="px-4 py-3 text-center font-medium">Grade</th>
                                    <th class="px-4 py-3 text-left font-medium">Date</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y">
                                ${records.map(record => {
                                    const score = record.score || 0;
                                    const curriculum = window.schoolSettings?.curriculum || window.schoolSettings?.system || 'cbc';
                                    const level = window.schoolSettings?.schoolLevel || window.schoolSettings?.settings?.schoolLevel || 'secondary';
                                    const grade = getGradeFromScore(score, curriculum, level);
                                    const gradeClass = grade === 'A' || grade === 'EE' ? 'bg-green-100 text-green-700' :
                                                       grade === 'B' || grade === 'ME' ? 'bg-blue-100 text-blue-700' :
                                                       grade === 'C' || grade === 'AE' ? 'bg-yellow-100 text-yellow-700' :
                                                       'bg-red-100 text-red-700';
                                    return `
                                        <tr class="hover:bg-accent/50 transition-colors">
                                            <td class="px-4 py-3 font-medium">${escapeHtml(record.subject || 'N/A')}</td>
                                            <td class="px-4 py-3">${escapeHtml(record.assessmentName || record.assessmentType || 'N/A')}</td>
                                            <td class="px-4 py-3 text-center">${score}%</td>
                                            <td class="px-4 py-3 text-center">
                                                <span class="px-2 py-1 ${gradeClass} text-xs rounded-full">${grade}</span>
                                            </td>
                                            <td class="px-4 py-3">${record.date ? formatDate(record.date) : 'N/A'}</td>
                                        </tr>
                                    `;
                                }).join('')}
                                ${records.length === 0 ? `
                                    <tr>
                                        <td colspan="5" class="px-4 py-8 text-center text-muted-foreground">
                                            No grade records available
                                        </td>
                                    </tr>
                                ` : ''}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Progress error:', error);
        return `<div class="text-center py-12 text-red-500">Error loading progress: ${error.message}</div>`;
    }
}

async function renderParentPayments() {
    try {
        const school = getCurrentSchool();
        const selectedChildId = dashboardData?.selectedChildId || dashboardData?.children?.[0]?.id;
        const selectedChild = (dashboardData?.children || []).find(c => String(c.id) === String(selectedChildId)) || dashboardData?.children?.[0];
        const historyFilter = localStorage.getItem('parent_payment_history_filter') || 'all';
        const subPhone = escapeHtml((typeof getCurrentUser === 'function' ? (getCurrentUser()?.phone || getCurrentUser()?.phoneNumber || '') : '') || '');
        let platformChildPlans = [];
        try { platformChildPlans = (await api.subscription.getPlans('child')).data || []; } catch (_) { platformChildPlans = []; }
        const childSubHtml = renderParentChildSubscriptionCards ? renderParentChildSubscriptionCards(selectedChildId, selectedChild, subPhone, platformChildPlans) : '';

        let finance = { accounts: [], totals: { totalExpected:0, parentPaidAmount:0, creditAmount:0, balance:0 } };
        let payments = [];
        let parentPaymentMethods = { defaultProvider: 'manual', enabledProviders: [], methods: [] };
        if (selectedChildId) {
            try { finance = (await api.parent.getStudentFeeAccounts(selectedChildId)).data || finance; } catch (e) { console.warn('Student fee accounts failed', e.message); }
            try { payments = (await api.parent.getStudentPaymentHistory(selectedChildId, { status: historyFilter })).data || []; } catch (e) { console.warn('Student payment history failed', e.message); }
        }
        try {
            const methodResponse = await (api.payments?.getParentMethods ? api.payments.getParentMethods({ studentId: selectedChildId }) : apiRequest('/api/payments/parent/methods'));
            parentPaymentMethods = methodResponse?.data || methodResponse || parentPaymentMethods;
        } catch (e) {
            console.warn('Parent payment methods failed', e.message);
        }
        const fees = finance.accounts || [];
        const activeFee = fees.find(f => Number(f.balance || 0) > 0) || fees[0] || null;
        const balance = Number(activeFee?.balance ?? Math.max(0, Number(activeFee?.totalAmount||0) - Number((activeFee?.parentPaidAmount ?? activeFee?.paidAmount) || 0) - Number(activeFee?.creditAmount||0))) || 0;
        const parentPaid = Number(activeFee?.parentPaidAmount ?? activeFee?.paidAmount ?? 0);
        const credit = Number(activeFee?.creditAmount || 0);
        const paidCovered = parentPaid + credit;
        const elimuId = selectedChild?.elimuid || selectedChild?.elimuId || selectedChild?.admissionNumber || finance.student?.elimuid || '—';
        const feeSelectHtml = fees.length > 1 ? `
            <label class="text-sm">Fee Account / Term
                <select id="payment-fee" onchange="updateParentFeeSummaryFromSelect()" class="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                    ${fees.map(f => `<option value="${f.id}" data-total="${Number(f.totalAmount||0)}" data-parent-paid="${Number((f.parentPaidAmount ?? f.paidAmount) || 0)}" data-credit="${Number(f.creditAmount||0)}" data-balance="${Number(f.balance||0)}">${escapeHtml(f.term || 'Fees')} ${escapeHtml(String(f.year || ''))} • Total KES ${Number(f.totalAmount||0).toLocaleString()} • Paid KES ${Number((f.parentPaidAmount ?? f.paidAmount) || 0).toLocaleString()} • Credits KES ${Number(f.creditAmount||0).toLocaleString()} • Balance KES ${Number(f.balance||0).toLocaleString()}</option>`).join('')}
                </select>
            </label>` : `
            <div class="text-sm rounded-lg border border-input bg-background px-3 py-2">
                <span class="text-muted-foreground">Fee Account / Term</span><br>
                <strong>${activeFee ? `${escapeHtml(activeFee.term || 'Fees')} ${escapeHtml(String(activeFee.year || ''))}` : 'No active fee account found'}</strong>
                ${activeFee ? `<input type="hidden" id="payment-fee" value="${activeFee.id}">` : '<input type="hidden" id="payment-fee" value="">'}
            </div>`;

        return `
            <div class="space-y-6 animate-fade-in" id="parent-payments-root" data-student-id="${escapeHtml(selectedChildId || '')}">
                ${childSubHtml}
                <div class="rounded-xl border bg-card p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700">
                    <h2 id="parent-school-name-payments" class="text-xl font-semibold">${escapeHtml(selectedChild?.schoolName || school?.name || 'Your School')}</h2>
                    <p class="text-sm text-muted-foreground">School Fees & Student-Specific Payment Verification</p>
                </div>

                <div class="grid gap-4 lg:grid-cols-3">
                    <div class="rounded-xl border bg-card p-6 lg:col-span-2">
                        <h3 class="font-semibold mb-1">Pay School Fees</h3>
                        <p class="text-sm text-muted-foreground mb-4">Each balance and history is personal to the selected child only.</p>
                        <div id="parent-school-payment-info-card" class="rounded-xl border bg-muted/30 p-4 mb-4">
                            <div class="flex items-center justify-between gap-3 flex-wrap">
                                <div>
                                    <h4 class="font-semibold">School Payment Information</h4>
                                    <p class="text-sm text-muted-foreground">Use the school details below, then choose one of the payment options enabled by school finance.</p>
                                </div>
                                <button type="button" onclick="refreshParentSchoolPaymentInfo()" class="px-3 py-2 rounded-lg border text-sm">Refresh Details</button>
                            </div>
                            <div id="parent-school-payment-info-body" class="mt-3 text-sm text-muted-foreground">Loading school payment details...</div>
                        </div>
                        <div class="grid gap-3 md:grid-cols-2">
                            <label class="text-sm">Child
                                <select id="payment-child" onchange="selectChild(this.value)" class="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                                    ${(dashboardData?.children || []).map(child => `<option value="${child.id}" ${String(child.id)===String(selectedChildId)?'selected':''}>${escapeHtml(child.User?.name || child.name || 'Student')} • ${escapeHtml(child.grade || child.className || '')}</option>`).join('')}
                                </select>
                            </label>
                            ${feeSelectHtml}
                            <div class="rounded-lg bg-muted/40 p-3 md:col-span-2" id="parent-fee-summary-card">
                                <div class="grid gap-2 md:grid-cols-5 text-sm">
                                    <div><span class="text-muted-foreground">Elimu ID</span><br><strong>${escapeHtml(elimuId)}</strong></div>
                                    <div><span class="text-muted-foreground">Total</span><br><strong id="parent-fee-total">KES ${Number(activeFee?.totalAmount || 0).toLocaleString()}</strong></div>
                                    <div><span class="text-muted-foreground">Parent Paid</span><br><strong id="parent-fee-paid">KES ${parentPaid.toLocaleString()}</strong></div>
                                    <div><span class="text-muted-foreground">Bursary/Credit</span><br><strong id="parent-fee-credit">KES ${credit.toLocaleString()}</strong></div>
                                    <div><span class="text-muted-foreground">Balance</span><br><strong id="parent-fee-balance">KES ${balance.toLocaleString()}</strong></div>
                                </div>
                            </div>
                            <label class="text-sm">Amount to Pay
                                <input type="number" id="payment-amount" placeholder="e.g. 5000" max="${balance || ''}" class="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                            </label>
                            <label class="text-sm">M-Pesa Phone
                                <input type="tel" id="payment-phone" placeholder="2547XXXXXXXX" value="${escapeHtml((typeof getCurrentUser === 'function' ? (getCurrentUser()?.phone || getCurrentUser()?.phoneNumber || '') : ''))}" class="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                            </label>
                            <div class="flex flex-wrap gap-2 md:col-span-2">
                                <button type="button" onclick="setParentFeeAmount(${Math.ceil(balance/2)||0})" class="px-3 py-2 rounded-lg border text-sm">Half Balance</button>
                                <button type="button" onclick="setParentFeeAmount(${balance||0})" class="px-3 py-2 rounded-lg border text-sm">Full Balance</button>
                            </div>
                            <label class="text-sm md:col-span-2">Payment reference/code after paying outside checkout
                                <input type="text" id="payment-mpesa-code" placeholder="Payment reference e.g. QEH123ABC, bank slip, cash receipt" class="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm uppercase">
                            </label>
                            <div class="md:col-span-2">
                                ${renderParentProviderMethods(parentPaymentMethods)}
                            </div>
                            ${renderParentLegacyPaymentButtons(parentPaymentMethods)}
                        </div>
                    </div>

                    <div class="rounded-xl border bg-card p-6">
                        <div class="flex items-center justify-between gap-2 mb-4">
                            <h3 class="font-semibold">Payment History</h3>
                            <select id="parent-payment-history-filter" onchange="setParentPaymentHistoryFilter(this.value)" class="rounded-lg border border-input bg-background px-2 py-1 text-xs">
                                ${['all','pending','successful','failed','rejected','bursaries','credits'].map(v => `<option value="${v}" ${historyFilter===v?'selected':''}>${v === 'all' ? 'All' : v.charAt(0).toUpperCase()+v.slice(1)}</option>`).join('')}
                            </select>
                        </div>
                        <div class="space-y-2 max-h-96 overflow-y-auto" id="parent-student-payment-history">
                            ${payments.length > 0 ? payments.map(payment => `
                                <div class="flex justify-between items-center p-3 bg-muted/30 rounded-lg" data-payment-id="${payment.id}">
                                    <div>
                                        <p class="text-sm font-medium">${escapeHtml(payment.transactionTypeLabel || payment.transactionType || 'Payment')}</p>
                                        <p class="text-xs text-muted-foreground">${formatDate(payment.createdAt)} • ${escapeHtml(payment.reference || '')}</p>
                                        <p class="text-[11px] text-muted-foreground">${escapeHtml(payment.feeTerm || payment.Fee?.term || payment.metadata?.term || 'Fee')} ${escapeHtml(String(payment.feeYear || payment.Fee?.year || payment.metadata?.year || ''))} • ${escapeHtml(payment.method || '')}</p>
                                    </div>
                                    <div class="text-right">
                                        <p class="font-semibold">KES ${Number(payment.amount || 0).toLocaleString()}</p>
                                        <span class="text-xs ${['completed','success','successful','approved'].includes(String(payment.status).toLowerCase()) ? 'text-green-600' : ['failed','rejected'].includes(String(payment.status).toLowerCase()) ? 'text-red-600' : 'text-yellow-600'}">${escapeHtml(payment.statusLabel || payment.status)}</span>
                                    </div>
                                </div>
                            `).join('') : `<div class="text-center py-8"><i data-lucide="credit-card" class="h-12 w-12 mx-auto text-muted-foreground mb-3"></i><p class="text-sm text-muted-foreground">No ${historyFilter !== 'all' ? historyFilter + ' ' : ''}history for this student</p></div>`}
                        </div>
                    </div>
                </div>
            </div>`;
    } catch (error) {
        console.error('Payments error:', error);
        return `<div class="text-center py-12 text-red-500">Error loading payments: ${error.message}</div>`;
    }
}


async function renderParentChat() {
    const selectedChild = dashboardData?.selectedChild?.student || 
                          (dashboardData?.children && dashboardData.children[0]?.User);
    const childName = selectedChild?.name || 'your child';
    const classTeacher = dashboardData?.selectedChild?.classTeacher;
    const conversations = await api.parent.getConversations({ studentId: dashboardData?.selectedChildId || getStoredSelectedChildId() || '' }).catch(() => ({data: []}));
    const parentConversations = conversations.data || [];
    setTimeout(() => { if (window.loadParentRecipientConversation) window.loadParentRecipientConversation(); }, 120);

    return `
        <div class="max-w-4xl mx-auto space-y-6 animate-fade-in">
            <div class="rounded-xl border bg-card p-4 h-[600px] flex flex-col">
                <div class="flex justify-between items-center mb-4 pb-2 border-b">
                    <div>
                        <h3 id="parent-chat-current-title" class="font-semibold">Message School Staff</h3>
                        <p class="text-xs text-muted-foreground">Chat with class teacher or admin about ${escapeHtml(childName)}</p>
                    </div>
                </div>
                
                <div class="flex gap-4 mb-4">
                    <select id="parent-recipient-type" onchange="loadParentRecipientConversation()" class="px-3 py-2 border rounded-lg bg-background flex-1">
                        <option value="teacher">📚 Class Teacher ${classTeacher ? `(${escapeHtml(classTeacher.name)})` : ''}</option>
                        <option value="admin">🏫 School Administrator</option>
                    </select>
                </div>
                
                <div class="flex-1 overflow-y-auto space-y-4 mb-4 p-4 bg-muted/20 rounded-lg" id="parent-chat-messages">
                    <div class="text-center text-muted-foreground py-8">
                        <i data-lucide="message-circle" class="h-12 w-12 mx-auto mb-3 opacity-50"></i>
                        <p>Select a recipient and start messaging</p>
                    </div>
                </div>
                
                <div class="flex gap-2">
                    <input type="text" id="parent-chat-input" placeholder="Type your message..." onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();sendParentMessage();}" 
                           class="flex-1 rounded-lg border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                    <button onclick="sendParentMessage()" class="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 flex items-center gap-2">
                        <i data-lucide="send" class="h-4 w-4"></i>
                        Send
                    </button>
                </div>
            </div>
        </div>
    `;
}

// ============ HELPER FUNCTIONS ============

async function selectChild(childId) {
    dashboardData.selectedChildId = childId;
    localStorage.setItem('shule_selected_child_id', childId);

    const selectedChild = (dashboardData.children || []).find(c => String(c.id) === String(childId));
    if (selectedChild) {
        localStorage.setItem('shule_selected_child_school_code', selectedChild.schoolCode || '');
        localStorage.setItem('shule_selected_child_school_name', selectedChild.schoolName || '');
        if (window.ShuleBrandingManager?.applyGlobalBranding) {
            window.ShuleBrandingManager.applyGlobalBranding({ schoolName: selectedChild.schoolName, schoolLogo: selectedChild.schoolLogo });
        }
    }

    showLoading();
    try {
        // Privacy guard: clear child-scoped UI caches before loading the next child so alerts/payments/analytics cannot visually leak.
        if (window.ShuleAlerts?.resetForChild) await window.ShuleAlerts.resetForChild(childId).catch(() => null);
        window.dispatchEvent(new CustomEvent('shule:child-switched', { detail: { studentId: childId } }));
        const summaryResponse = await api.parent.getChildSummary(childId);
        dashboardData.selectedChild = summaryResponse.data;
        await showDashboardSection(currentSection);
    } catch (error) {
        console.error('Error selecting child:', error);
        showToast('Failed to load child data', 'error');
    } finally {
        hideLoading();
    }
}

function toggleParentAddChildBox() {
    const box = document.getElementById('parent-add-child-box');
    if (box) box.classList.toggle('hidden');
}

async function linkParentChildByElimuId() {
    const input = document.getElementById('parent-link-elimuid');
    const elimuid = input?.value?.trim();
    if (!elimuid) {
        showToast('Enter the child Elimu ID first', 'error');
        return;
    }

    showLoading();
    try {
        const response = await api.parent.linkChildByElimuId(elimuid);
        showToast(response.message || 'Child linked successfully', 'success');
        localStorage.setItem('shule_selected_child_id', response.data?.id || '');
        await showDashboardSection(currentSection || 'dashboard');
    } catch (error) {
        console.error('Link child error:', error);
        showToast(error.message || 'Could not link child', 'error');
    } finally {
        hideLoading();
    }
}

async function reportAbsence() {
    const selectedChildId = dashboardData?.selectedChildId;

    if (!selectedChildId) {
        showToast('Please select a child first', 'error');
        return;
    }

    const date = document.getElementById('absence-date')?.value;
    const reason = document.getElementById('absence-reason')?.value;

    if (!date || !reason) {
        showToast('Please select date and enter reason', 'error');
        return;
    }

    showLoading();
    try {
        const response = await api.parent.reportAbsence({
            studentId: parseInt(selectedChildId),
            date: date,
            reason: reason
        });

        if (response.success) {
            showToast('✅ Absence reported and class teacher notified', 'success');
            document.getElementById('absence-date').value = new Date().toISOString().split('T')[0];
            document.getElementById('absence-reason').value = '';
        } else {
            throw new Error(response.message || 'Failed to report absence');
        }
    } catch (error) {
        console.error('Report absence error:', error);
        showToast(error.message || 'Failed to report absence', 'error');
    } finally {
        hideLoading();
    }
}



function renderParentChildSubscriptionCards(selectedChildId, selectedChild, phone='', livePlans=null) {
    const fallbackPlans = [
        { code:'child_basic', name:'Basic', amount:100, features:['Report cards','Attendance','Progress'], ai:'No AI Tutor' },
        { code:'child_premium', name:'Premium', amount:250, features:['Everything in Basic','AI Tutor: 6 messages/day','Child timetable if school has timetable'], ai:'6 AI messages/day' },
        { code:'child_ultimate', name:'Ultimate', amount:500, features:['Everything in Premium','Extended AI Tutor','Live child analytics','Stronger child alerts','Child recommendations'], ai:'Extended AI access' }
    ];
    const plans = (Array.isArray(livePlans) && livePlans.length ? livePlans : fallbackPlans).map(p => {
        const code = p.code || p.planCode || p.name || 'child_basic';
        const name = p.displayName || p.name || code.replace(/^child_/, '');
        const amount = Number(p.monthlyPriceKes ?? p.price_kes ?? p.amount ?? p.price ?? 0) || 0;
        const features = Array.isArray(p.features) && p.features.length ? p.features : fallbackPlans.find(x => String(x.code) === String(code))?.features || [];
        const ai = String(code).includes('ultimate') ? 'Extended AI access' : String(code).includes('premium') ? '6 AI messages/day' : 'No AI Tutor';
        return { code, name, amount, features, ai };
    });
    return `<div class="rounded-xl border bg-card p-6"><div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4"><div><h3 class="font-semibold text-lg">Shule AI Child Subscription</h3><p class="text-sm text-muted-foreground">Per-child subscription. Selected child: <b>${escapeHtml(selectedChild?.User?.name || selectedChild?.name || selectedChildId || 'Child')}</b></p></div><input id="parent-sub-phone" type="tel" value="${phone}" placeholder="2547XXXXXXXX" class="rounded-lg border bg-background px-3 py-2 text-sm md:w-56"></div><div class="grid gap-4 md:grid-cols-3">${plans.map(p => `<div class="rounded-xl border p-4 bg-background"><div class="flex justify-between items-start"><div><h4 class="font-bold">${escapeHtml(p.name)}</h4><p class="text-sm text-muted-foreground">KES ${Number(p.amount).toLocaleString()} / month</p></div><span class="text-xs rounded-full bg-primary/10 text-primary px-2 py-1">${escapeHtml(p.ai)}</span></div><ul class="mt-3 text-sm space-y-1">${p.features.map(f => `<li>✓ ${escapeHtml(f)}</li>`).join('')}</ul><button onclick="payChildSubscription('${escapeHtml(p.code)}', ${Number(p.amount)})" class="mt-4 w-full rounded-lg bg-primary text-primary-foreground py-2">Try STK / Pay ${escapeHtml(p.name)}</button><div class="mt-3"><input id="parent-sub-code-${escapeHtml(p.code)}" class="w-full rounded-lg border bg-background px-3 py-2 text-sm uppercase" placeholder="Manual M-Pesa code/reference"><button onclick="submitManualChildSubscription('${escapeHtml(p.code)}', ${Number(p.amount)})" class="mt-2 w-full rounded-lg border py-2 text-sm">Submit Code for Approval</button></div></div>`).join('')}</div></div>`;
}
async function payChildSubscription(planCode, amount) {
    const studentId = dashboardData?.selectedChildId || document.getElementById('payment-child')?.value;
    const phone = document.getElementById('parent-sub-phone')?.value?.trim() || getParentPaymentPhone();
    if (!studentId) return showToast('Select a child first', 'error');
    if (!phone) return showToast('Enter M-Pesa phone number', 'error');
    showLoading();
    try {
        const res = await api.payments.parentSubscriptionSTK({ studentId: Number(studentId), plan: planCode, planCode, amount, phone, billingPeriod:'monthly' });
        showToast(res.message || 'Subscription M-Pesa prompt sent.', 'success');
    } catch (e) { showToast(e.message || 'Could not start subscription payment', 'error'); }
    finally { hideLoading(); }
}
async function submitManualChildSubscription(planCode, amount) {
    const studentId = dashboardData?.selectedChildId || document.getElementById('payment-child')?.value;
    const mpesaCode = document.getElementById(`parent-sub-code-${planCode}`)?.value?.trim()?.toUpperCase();
    const phone = document.getElementById('parent-sub-phone')?.value?.trim() || getParentPaymentPhone();
    if (!studentId) return showToast('Select a child first', 'error');
    if (!mpesaCode) return showToast('Enter the manual M-Pesa code/reference', 'error');
    showLoading();
    try {
        const res = await api.payments.parentSubscriptionManual({ studentId: Number(studentId), plan: planCode, planCode, amount, phone, mpesaCode, billingPeriod:'monthly' });
        showToast(res.message || 'Subscription payment submitted for approval.', 'success');
    } catch (e) { showToast(e.message || 'Could not submit subscription code', 'error'); }
    finally { hideLoading(); }
}

function normalizeParentPaymentProvider(provider) {
    return String(provider || '').trim().toLowerCase().replace(/\s+/g, '_');
}

function parentProviderLabel(provider, fallback = '') {
    const p = normalizeParentPaymentProvider(provider);
    const labels = { manual: 'Manual verification', bank: 'Bank transfer', cash: 'Cash office payment', card: 'Card/POS', daraja: 'M-Pesa STK Push', paystack: 'Paystack checkout', flutterwave: 'Flutterwave checkout', pesapal: 'Pesapal checkout', stripe: 'Stripe checkout' };
    return fallback || labels[p] || String(provider || 'Payment option');
}

function parentProviderPrompt(provider, prompt = '') {
    const p = normalizeParentPaymentProvider(provider);
    if (prompt) return prompt;
    if (['paystack','flutterwave','pesapal','stripe'].includes(p)) return 'checkout_url';
    if (p === 'daraja') return 'phone_prompt';
    return 'manual_instructions';
}

function parentProviderDescription(provider, prompt = '') {
    const p = normalizeParentPaymentProvider(provider);
    const type = parentProviderPrompt(p, prompt);
    if (type === 'checkout_url') return 'Open a secure checkout. Balances update only after provider confirmation.';
    if (type === 'phone_prompt') return 'Enter your M-Pesa phone, then complete the prompt on your phone.';
    if (p === 'bank') return 'Pay using the bank details above, then submit the reference for finance approval.';
    if (p === 'cash') return 'Pay at the school office, then submit the receipt number for finance approval.';
    if (p === 'card') return 'Pay using the school card/POS option, then submit the receipt reference.';
    return 'Submit your payment reference for school finance verification.';
}

function normalizeParentPaymentMethods(methodData = {}) {
    const methods = Array.isArray(methodData.methods) ? methodData.methods : [];
    const enabled = Array.isArray(methodData.enabledProviders) ? methodData.enabledProviders : [];
    const rows = methods.length ? methods : enabled.map(provider => ({ provider }));
    const seen = new Set();
    return rows.map(row => {
        const provider = normalizeParentPaymentProvider(row?.provider || row);
        if (!provider || seen.has(provider)) return null;
        seen.add(provider);
        return { provider, label: parentProviderLabel(provider, row?.label || ''), prompt: parentProviderPrompt(provider, row?.prompt || '') };
    }).filter(Boolean);
}

function renderParentProviderMethods(methodData = {}) {
    const methods = normalizeParentPaymentMethods(methodData);
    if (!methods.length) {
        return '<div class="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-100">Payment options could not be loaded. You can still use the M-Pesa/manual buttons below.</div>';
    }
    const cards = methods.map(method => {
        const provider = method.provider;
        const prompt = method.prompt;
        const action = provider === 'daraja'
            ? 'processSchoolFeeDarajaPayment()'
            : (['manual','bank','cash','card'].includes(provider) ? 'submitManualSchoolFeePayment(' + JSON.stringify(provider) + ')' : 'processSchoolFeeProviderPayment(' + JSON.stringify(provider) + ')');
        const actionLabel = prompt === 'checkout_url' ? 'Open ' + parentProviderLabel(provider) : (provider === 'daraja' ? 'Send STK Prompt' : 'Submit Reference');
        return '<div class="rounded-lg border bg-background p-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">' +
            '<div><div class="font-semibold">' + escapeHtml(method.label) + '</div>' +
            '<p class="text-sm text-muted-foreground">' + escapeHtml(parentProviderDescription(provider, prompt)) + '</p></div>' +
            '<button type="button" onclick="' + escapeHtml(action) + '" class="px-4 py-2 rounded-lg border text-sm hover:bg-muted whitespace-nowrap">' + escapeHtml(actionLabel) + '</button>' +
            '</div>';
    }).join('');
    return '<div class="space-y-3"><div class="flex items-center justify-between gap-2 flex-wrap"><h4 class="font-semibold">Available School Payment Options</h4><span class="text-xs text-muted-foreground">Enabled by school finance</span></div>' + cards + '</div>';
}

function renderParentLegacyPaymentButtons(methodData = {}) {
    if (normalizeParentPaymentMethods(methodData).length) return '';
    return '<div class="grid gap-2 md:grid-cols-2 md:col-span-2">' +
        '<button onclick="processSchoolFeeDarajaPayment()" class="w-full bg-primary text-primary-foreground py-2 rounded-lg hover:bg-primary/90">Pay with STK Push</button>' +
        '<button onclick="submitManualSchoolFeePayment()" class="w-full border border-input py-2 rounded-lg hover:bg-muted">Submit Payment Reference</button>' +
    '</div>';
}

function getParentPaymentPhone() {
    const explicit = document.getElementById('payment-phone')?.value?.trim();
    if (explicit) return explicit;
    try {
        const user = typeof getCurrentUser === 'function' ? getCurrentUser() : JSON.parse(localStorage.getItem('user') || '{}');
        return user?.phone || user?.phoneNumber || user?.parent?.phone || '';
    } catch (_) {
        return '';
    }
}

function getPlanAmountFromDom(planId) {
    const option = document.querySelector(`#payment-plan option[value="${CSS.escape(String(planId || ''))}"]`);
    const amount = Number(option?.dataset?.amount || 0);
    return Number.isFinite(amount) ? amount : 0;
}

function getSelectedFeePaymentPayload() {
    const childSelect = document.getElementById('payment-child');
    const feeSelect = document.getElementById('payment-fee');
    const amountInput = document.getElementById('payment-amount');
    const phoneInput = document.getElementById('payment-phone');
    const studentId = childSelect?.value || dashboardData?.selectedChildId;
    const feeId = feeSelect?.value || null;
    const amount = Number(amountInput?.value || 0);
    const phone = phoneInput?.value?.trim() || getParentPaymentPhone();
    return { studentId, feeId, amount, phone };
}

function setParentFeeAmount(amount) {
    const input = document.getElementById('payment-amount');
    if (input && amount > 0) input.value = amount;
}

async function processSchoolFeeProviderPayment(provider) {
    const normalizedProvider = normalizeParentPaymentProvider(provider);
    if (!normalizedProvider) return showToast('Choose a payment option first', 'error');
    if (normalizedProvider === 'daraja') return processSchoolFeeDarajaPayment();
    if (['manual','bank','cash','card'].includes(normalizedProvider)) return submitManualSchoolFeePayment(normalizedProvider);

    const payload = getSelectedFeePaymentPayload();
    if (!payload.studentId) return showToast('Please select a child', 'error');
    if (!payload.feeId) return showToast('Select a fee account first', 'error');
    if (!payload.amount || payload.amount <= 0) return showToast('Enter the amount you want to pay', 'error');
    showLoading();
    try {
        const currentUser = typeof getCurrentUser === 'function' ? getCurrentUser() : {};
        const requestPayload = { paymentType: 'school_fee', provider: normalizedProvider, studentId: parseInt(payload.studentId), feeId: payload.feeId || undefined, amount: payload.amount, phone: payload.phone, email: currentUser?.email || '', name: currentUser?.name || '', purpose: 'school_fee' };
        const response = await (api.payments?.initiate ? api.payments.initiate(requestPayload) : apiRequest('/api/payments/initiate', { method: 'POST', body: JSON.stringify(requestPayload) }));
        const data = response?.data || {};
        if (data.checkoutUrl) {
            window.open(data.checkoutUrl, '_blank', 'noopener');
            showToast(response.message || parentProviderLabel(normalizedProvider) + ' checkout opened. Complete payment there.', 'success');
        } else if (data.promptType === 'checkout_url') {
            showToast(response.message || parentProviderLabel(normalizedProvider) + ' is enabled, but no checkout link was returned. Ask finance to complete provider checkout setup.', 'error');
        } else {
            showToast(response.message || 'Payment request created. Follow the provider instructions to finish.', 'success');
        }
        window.dispatchEvent(new CustomEvent('shule:finance-updated',{detail:{type:'parent-provider-payment-started', provider: normalizedProvider}}));
        localStorage.setItem('shule:lastFinanceUpdate', String(Date.now()));
        await refreshParentPaymentPanelSoft();
    } catch (error) {
        console.error('School fee provider payment error:', error);
        showToast(error.message || 'Could not start ' + parentProviderLabel(normalizedProvider) + ' payment.', 'error');
    } finally { hideLoading(); }
}

async function processSchoolFeeDarajaPayment() {
    const payload = getSelectedFeePaymentPayload();
    if (!payload.studentId) return showToast('Please select a child', 'error');
    if (!payload.amount || payload.amount <= 0) return showToast('Enter the amount you want to pay', 'error');
    if (!payload.phone) return showToast('Enter the M-Pesa phone number', 'error');
    showLoading();
    try {
        const response = await api.payments.parentFeeSTK({
            studentId: parseInt(payload.studentId),
            feeId: payload.feeId || undefined,
            amount: payload.amount,
            phone: payload.phone
        });
        showToast(response.message || 'M-Pesa prompt sent. Complete payment on your phone.', 'success');
        window.dispatchEvent(new CustomEvent('shule:finance-updated',{detail:{type:'parent-stk-started'}}));
        localStorage.setItem('shule:lastFinanceUpdate', String(Date.now()));
    } catch (error) {
        console.error('School fee STK error:', error);
        showToast(error.message || 'Could not start school fee payment. If the school is manual, submit the M-Pesa code instead.', 'error');
    } finally { hideLoading(); }
}

async function submitManualSchoolFeePayment(method = 'manual_mpesa') {
    const payload = getSelectedFeePaymentPayload();
    const providerMethod = normalizeParentPaymentProvider(method) || 'manual_mpesa';
    const paymentReference = document.getElementById('payment-mpesa-code')?.value?.trim()?.toUpperCase();
    if (!payload.studentId) return showToast('Please select a child', 'error');
    if (!payload.amount || payload.amount <= 0) return showToast('Enter the amount paid', 'error');
    if (!paymentReference) return showToast('Enter the payment reference/code after paying', 'error');
    showLoading();
    try {
        const manualPayload = { studentId: parseInt(payload.studentId), feeId: payload.feeId || undefined, amount: payload.amount, phone: payload.phone, mpesaCode: paymentReference, reference: paymentReference, method: providerMethod, notes: parentProviderLabel(providerMethod) + ' payment awaiting school finance verification' };
        const response = await (api.parent.submitManualFeePayment ? api.parent.submitManualFeePayment(manualPayload) : api.payments.parentFeeManual(manualPayload));
        showToast(response.message || 'Payment submitted for verification.', 'success');
        window.dispatchEvent(new CustomEvent('shule:finance-updated',{detail:{type:'manual-payment-submitted'}}));
        localStorage.setItem('shule:lastFinanceUpdate', String(Date.now()));
        await refreshParentPaymentPanelSoft();
    } catch (error) {
        console.error('Manual school fee payment error:', error);
        showToast(error.message || 'Could not submit payment for verification.', 'error');
    } finally { hideLoading(); }
}

async function processPayment() {
    const selectedChildId = dashboardData?.selectedChildId;
    const childSelect = document.getElementById('payment-child');
    const planSelect = document.getElementById('payment-plan');
    const amountInput = document.getElementById('payment-amount');
    const methodSelect = document.getElementById('payment-method');

    const studentId = childSelect?.value || selectedChildId;
    const plan = planSelect?.value;
    const selectedOption = planSelect?.selectedOptions?.[0];
    const amount = amountInput?.value || selectedOption?.dataset?.amount;
    const method = methodSelect?.value || 'mpesa';
    const phone = getParentPaymentPhone();

    if (!studentId) {
        showToast('Please select a child', 'error');
        return;
    }

    if (!plan) {
        showToast('Please select a payment plan', 'error');
        return;
    }

    if (!amount || amount <= 0) {
        showToast('Please enter a valid amount', 'error');
        return;
    }

    if (!phone) {
        showToast('Please enter the M-Pesa phone number', 'error');
        return;
    }

    if (!method) {
        showToast('Please select payment method', 'error');
        return;
    }

    showLoading();
    try {
        const response = await (api.payments?.parentSubscriptionSTK ? api.payments.parentSubscriptionSTK({
            studentId: parseInt(studentId),
            amount: parseFloat(amount),
            phone,
            plan,
            planCode: plan,
            billingPeriod: 'monthly',
            reference: `SUB-${Date.now()}`
        }) : api.parent.upgradePlan({
            studentId: parseInt(studentId),
            amount: parseFloat(amount),
            phone,
            plan,
            planCode: plan,
            billingPeriod: 'monthly'
        }));

        if (response.success) {
            showToast(response.message || '✅ Subscription M-Pesa prompt sent. Complete payment on your phone.', 'success');
            window.dispatchEvent(new CustomEvent('shule:subscription-updated',{detail:{type:'parent-subscription-stk'}}));
        } else {
            throw new Error(response.message || 'Payment initiation failed');
        }
    } catch (error) {
        console.error('Payment error:', error);
        showToast(error.message || 'Failed to process payment', 'error');
    } finally {
        hideLoading();
    }
}

async function upgradePlan(planId, amountFromCard = 0) {
    const selectedChildId = dashboardData?.selectedChildId;

    if (!selectedChildId) {
        showToast('Please select a child first', 'error');
        return;
    }

    const phone = getParentPaymentPhone();
    const amount = Number(amountFromCard || getPlanAmountFromDom(planId));
    if (!phone) {
        showToast('Please enter your M-Pesa phone number in the payment form first', 'error');
        return;
    }
    if (!amount || amount <= 0) {
        showToast('Could not determine the plan amount. Please use the payment form.', 'error');
        return;
    }

    showLoading();
    try {
        const response = await api.parent.upgradePlan({
            studentId: parseInt(selectedChildId),
            plan: planId,
            planCode: planId,
            billingPeriod: 'monthly',
            amount,
            phone
        });

        if (response.success) {
            showToast(response.message || `✅ M-Pesa prompt sent for ${planId} plan`, 'success');
            if (currentSection === 'payments') {
                await refreshParentPaymentPanelSoft();
            }
        } else {
            throw new Error(response.message || 'Upgrade failed');
        }
    } catch (error) {
        console.error('Upgrade error:', error);
        showToast(error.message || 'Failed to upgrade plan', 'error');
    } finally {
        hideLoading();
    }
}

// Home Tasks Section
async function renderHomeTasks() {
  const childId = dashboardData?.selectedChildId;
  if (!childId) return;
  if (!childId) return '<div class="text-center py-4">Select a child first</div>';
  const res = await apiRequest(`/api/home-tasks/today?studentId=${childId}`);
  const tasks = res.data;
  if (!tasks.length) return '<div class="text-center py-4">No tasks for today – check back tomorrow!</div>';
  return `
    <div class="space-y-4">
      <h3 class="font-semibold text-lg">Today’s Learning Tasks</h3>
      ${tasks.map(task => `
        <div class="border rounded-lg p-4 bg-card">
          <div class="flex justify-between items-start">
            <div>
              <span class="text-xs px-2 py-1 rounded-full bg-primary/10">${task.type}</span>
              <h4 class="font-medium mt-1">${escapeHtml(task.title)}</h4>
              <p class="text-sm text-muted-foreground mt-1">⏱️ ${task.estimatedMinutes} min | ⭐ ${task.points} points</p>
            </div>
            <button onclick="toggleTaskInstructions(${task.id})" class="text-primary text-sm">Show</button>
          </div>
          <div id="task-instr-${task.id}" class="hidden mt-2 text-sm bg-muted p-3 rounded">
            <p>${escapeHtml(task.instructions)}</p>
            ${task.materials ? `<p class="mt-1 text-xs">📦 Materials: ${escapeHtml(task.materials)}</p>` : ''}
            <div class="flex gap-2 mt-3">
              <button onclick="completeTask(${task.assignmentId || task.id}, 'easy')" class="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">😊 Easy</button>
              <button onclick="completeTask(${task.assignmentId || task.id}, 'ok')" class="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">😐 Okay</button>
              <button onclick="completeTask(${task.assignmentId || task.id}, 'hard')" class="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">😓 Hard</button>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}
window.toggleTaskInstructions = function(taskId) {
  const el = document.getElementById(`task-instr-${taskId}`);
  if (el) el.classList.toggle('hidden');
};
window.completeTask = async function(taskId, difficulty) {
  try {
    await apiRequest(`/api/home-tasks/${taskId}/complete`, {
      method: 'POST',
      body: JSON.stringify({ parentFeedback: { difficulty }, studentId: dashboardData?.selectedChildId || null })
    });
    showToast('Task completed! Points awarded.', 'success');
    const container = document.getElementById('home-tasks-container');
    if (container) container.innerHTML = await renderHomeTasks();
    if (window.lucide) lucide.createIcons();
  } catch (e) {
    showToast(e.message, 'error');
  }
};


const parentChatState = window.__parentChatState || { conversationKey:null, messages:[], target:'teacher', childId:null };
window.__parentChatState = parentChatState;

function parentChatMessageId(message){ return String(message?.id || message?.messageId || message?.clientMessageId || message?.metadata?.clientMessageId || ''); }
function parentChatNormalize(message={}){
    const metadata=message.metadata||{};
    return { ...message, id:message.id||message.messageId||null, content:message.content||message.body||'', clientMessageId:message.clientMessageId||metadata.clientMessageId||null, conversationKey:message.conversationKey||message.conversationId||metadata.conversationKey||null, senderName:message.senderName||message.Sender?.name||metadata.senderName||'',senderProfileImage:message.senderProfileImage||message.Sender?.profileImage||message.Sender?.profilePicture||metadata.senderProfileImage||'', createdAt:message.createdAt||message.sentAt||new Date().toISOString() };
}
function parentChatUpsert(raw){
    const message=parentChatNormalize(raw); const key=parentChatMessageId(message); if(!key)return;
    const index=parentChatState.messages.findIndex(row => (message.clientMessageId && (row.clientMessageId===message.clientMessageId || row.metadata?.clientMessageId===message.clientMessageId)) || (message.id && String(row.id)===String(message.id)));
    if(index>=0) parentChatState.messages[index]={...parentChatState.messages[index],...message,status:message.status||message.deliveryStatus||'sent'};
    else parentChatState.messages.push(message);
    parentChatState.messages.sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt));
}
function parentChatRender({forceBottom=false}={}){
    const container=document.getElementById('parent-chat-messages'); if(!container)return;
    const me=typeof getCurrentUser==='function'?(getCurrentUser()||{}):JSON.parse(localStorage.getItem('user')||'{}');
    const wasNearBottom=container.scrollHeight-container.scrollTop-container.clientHeight<100;
    if(!parentChatState.messages.length){container.innerHTML='<div class="text-center text-muted-foreground py-8"><i data-lucide="message-circle" class="h-10 w-10 mx-auto mb-2 opacity-50"></i><p>No messages yet. Start the conversation below.</p></div>';return;}
    container.innerHTML=parentChatState.messages.map(msg=>{const mine=Number(msg.senderId)===Number(me.id);const status=msg.status==='sending'?'Sending…':msg.status==='failed'?'Failed — tap Retry':(msg.isRead||msg.deliveryStatus==='read'?'Read':msg.deliveryStatus==='delivered'?'Delivered':'Sent');const person=mine?me:{name:msg.senderName||(parentChatState.target==='admin'?'School Administrator':'Class Teacher'),profileImage:msg.senderProfileImage};return `<div class="flex items-end gap-2 ${mine?'justify-end':'justify-start'}" data-parent-message="${escapeHtml(parentChatMessageId(msg))}">${mine?'':avatarHTML(person.name,person.profileImage,'h-8 w-8')}<button type="button" ${msg.status==='failed'?`onclick="retryParentMessage('${escapeHtml(msg.clientMessageId)}')"`:''} class="${mine?'chat-bubble-sent':'chat-bubble-received'} max-w-[78%] text-left"><p class="text-sm font-medium">${mine?'You':escapeHtml(person.name)}</p><p class="text-sm whitespace-pre-wrap">${escapeHtml(msg.content||'')}</p><p class="text-[11px] mt-1 ${msg.status==='failed'?'text-red-500':'text-muted-foreground'}">${escapeHtml(status)} • ${timeAgo(msg.createdAt)}</p></button>${mine?avatarHTML(me.name,me.profileImage||me.profilePicture,'h-8 w-8'):''}</div>`;}).join('');
    if(forceBottom||wasNearBottom)container.scrollTop=container.scrollHeight;
    if(window.lucide)lucide.createIcons();
}

window.loadParentRecipientConversation = async function() {
    const container=document.getElementById('parent-chat-messages'); if(!container)return;
    parentChatState.target=document.getElementById('parent-recipient-type')?.value||'teacher';
    parentChatState.childId=String(dashboardData?.selectedChildId||'');
    parentChatState.messages=[]; parentChatState.conversationKey=null;
    container.innerHTML='<div class="py-8 text-center text-muted-foreground">Loading conversation…</div>';
    try{
        const response=await api.parent.getConversations({studentId:parentChatState.childId});
        const rows=Array.isArray(response?.data)?response.data:[];
        const wanted=parentChatState.target==='admin'?'parent_admin':'parent_class_teacher';
        const match=rows.find(row=>String(row.conversationType||'').toLowerCase()===wanted&&(!parentChatState.childId||String(row.studentId||'')===parentChatState.childId));
        if(match){parentChatState.conversationKey=match.conversationKey||null;parentChatState.messages=(match.messages||[]).map(parentChatNormalize);}
        if(parentChatState.conversationKey)window.ShuleRealtime?.joinConversation?.(parentChatState.conversationKey);
        parentChatRender({forceBottom:true});
    }catch(error){container.innerHTML=`<div class="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">${escapeHtml(error.message||'Conversation could not load.')}</div>`;}
};

async function sendParentMessage() {
    const childId=String(dashboardData?.selectedChildId||'');
    const input=document.getElementById('parent-chat-input');
    const message=input?.value?.trim();
    if(!childId)return showToast('Please select a child first','error');
    if(!message)return showToast('Please enter a message','error');
    const clientMessageId=(crypto.randomUUID?.()||`parent-${Date.now()}-${Math.random().toString(16).slice(2)}`);
    const me=typeof getCurrentUser==='function'?(getCurrentUser()||{}):JSON.parse(localStorage.getItem('user')||'{}');
    parentChatUpsert({clientMessageId,senderId:me.id,senderName:'You',content:message,createdAt:new Date().toISOString(),status:'sending',conversationKey:parentChatState.conversationKey});
    input.value=''; parentChatRender({forceBottom:true});
    try{
        const response=await api.parent.sendMessage({studentId:Number(childId),message,recipientType:parentChatState.target,clientMessageId});
        const saved=parentChatNormalize(response.data||{}); parentChatState.conversationKey=saved.conversationKey||parentChatState.conversationKey; parentChatUpsert({...saved,clientMessageId,status:'sent'});
        if(parentChatState.conversationKey)window.ShuleRealtime?.joinConversation?.(parentChatState.conversationKey);
        parentChatRender({forceBottom:true});
    }catch(error){
        const failed=parentChatState.messages.find(row=>row.clientMessageId===clientMessageId);if(failed)failed.status='failed';parentChatRender({forceBottom:true});
        if(/class teacher/i.test(error.message||'')){const selector=document.getElementById('parent-recipient-type');if(selector)selector.value='admin';showToast('No class teacher is assigned. Switch to School Administrator and resend.','warning');}else showToast(error.message||'Message failed to send','error');
    }
}

window.retryParentMessage=async function(clientMessageId){
    const row=parentChatState.messages.find(item=>item.clientMessageId===clientMessageId);if(!row)return;
    parentChatState.messages=parentChatState.messages.filter(item=>item!==row);const input=document.getElementById('parent-chat-input');if(input)input.value=row.content||'';parentChatRender();await sendParentMessage();
};

window.addEventListener('shule:realtime-event',event=>{
    const envelope=event.detail||{}; if(String(envelope.type||'')!=='chat:message_created')return;
    const message=parentChatNormalize(envelope.data||{}); if(!document.getElementById('parent-chat-messages'))return;
    if(parentChatState.conversationKey&&message.conversationKey&&String(message.conversationKey)!==String(parentChatState.conversationKey))return;
    if(!parentChatState.conversationKey&&String(message.metadata?.studentId||'')!==String(parentChatState.childId||''))return;
    parentChatState.conversationKey=message.conversationKey||parentChatState.conversationKey;parentChatUpsert(message);parentChatRender();
    if(message.id&&Number(message.senderId)!==Number((typeof getCurrentUser==='function'?getCurrentUser()?.id:0)))window.socket?.emit('chat:message_read',{messageId:message.id});
});

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function loadParentAlerts() {
  const container = document.getElementById('parent-alerts-container');
  if (!container) return;
  try {
    const activeChildId = String(dashboardData?.selectedChildId || getStoredSelectedChildId() || '').trim();
    const res = await apiRequest('/api/alerts' + (activeChildId ? `?studentId=${encodeURIComponent(activeChildId)}` : ''));
    const alerts = (res.data || []).filter(a => !activeChildId || !a.studentId || String(a.studentId) === activeChildId);
    if (alerts.length === 0) {
      container.innerHTML = '<div class="text-center text-muted-foreground py-4">No alerts</div>';
      return;
    }
    container.innerHTML = alerts.slice(0, 5).map(alert => `
      <div class="p-3 border rounded-lg ${!alert.isRead ? 'bg-primary/5' : ''}">
        <p class="font-medium text-sm">${escapeHtml(alert.title)}</p>
        <p class="text-xs text-muted-foreground">${escapeHtml(alert.message)}</p>
        <p class="text-xs text-muted-foreground mt-1">${timeAgo(alert.createdAt)}</p>
      </div>
    `).join('');
  } catch (e) {
    container.innerHTML = '<div class="text-red-500">Failed to load alerts</div>';
  }
}

async function loadLiveAttendance() {
  const childId = dashboardData?.selectedChildId;
  if (!childId) return;
  if (!childId) return;

  const statusDiv = document.getElementById('live-attendance-status');
  const dateSpan = document.getElementById('attendance-date');
  const calendarDiv = document.getElementById('weekly-attendance-calendar');

  try {
    const res = await api.parent.getChildTodayAttendance(childId);
    const data = res.data || { status: 'not_recorded' };
    const today = new Date();

    dateSpan.textContent = today.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

    if (data.status === 'present') {
      statusDiv.innerHTML = `<div class="text-green-600"><i data-lucide="check-circle" class="h-8 w-8 mx-auto"></i><p class="font-medium mt-2">Present</p><p class="text-xs">Checked in at ${data.timeIn || 'N/A'}</p></div>`;
    } else if (data.status === 'absent') {
      statusDiv.innerHTML = `<div class="text-red-600"><i data-lucide="x-circle" class="h-8 w-8 mx-auto"></i><p class="font-medium mt-2">Absent</p><p class="text-xs">Reason: ${data.reason || 'Not provided'}</p></div>`;
    } else if (data.status === 'late') {
      statusDiv.innerHTML = `<div class="text-yellow-600"><i data-lucide="clock" class="h-8 w-8 mx-auto"></i><p class="font-medium mt-2">Late</p></div>`;
    } else {
      statusDiv.innerHTML = `<div class="text-muted-foreground"><i data-lucide="minus-circle" class="h-8 w-8 mx-auto"></i><p class="font-medium mt-2">Not Recorded</p></div>`;
    }

    const weekDays = ['M', 'T', 'W', 'T', 'F'];
    const todayIndex = (today.getDay() + 6) % 7;
    calendarDiv.innerHTML = weekDays.map((day, i) => {
      const isToday = i === todayIndex;
      const bgClass = isToday ? 'bg-primary' : (i < todayIndex ? 'bg-green-500' : 'bg-gray-300');
      return `<div class="flex-1 h-2 ${bgClass} rounded"></div>`;
    }).join('');

    if (window.lucide) lucide.createIcons();
  } catch (e) {
    console.error('Failed to load attendance', e);
  }
}

setTimeout(() => {
  loadParentAlerts();
  loadLiveAttendance();
}, 200);


async function refreshParentSchoolPaymentInfo() {
    const body = document.getElementById('parent-school-payment-info-body');
    if (!body) return;
    body.innerHTML = '<span class="text-muted-foreground">Loading school payment details...</span>';
    try {
        const res = await (api.payments?.getParentSchoolPaymentSettings ? api.payments.getParentSchoolPaymentSettings() : apiRequest('/api/payments/parent/school-settings'));
        const d = res.data || {};
        let providerMethods = [];
        try {
            const selectedChildId = document.getElementById('parent-payments-root')?.dataset?.studentId || dashboardData?.selectedChildId || document.getElementById('payment-child')?.value;
            const methodRes = await (api.payments?.getParentMethods ? api.payments.getParentMethods({ studentId: selectedChildId }) : apiRequest('/api/payments/parent/methods'));
            providerMethods = normalizeParentPaymentMethods(methodRes?.data || methodRes || {});
        } catch (_) { providerMethods = []; }
        const lines = [];
        lines.push(`<div><span class="text-muted-foreground">Payment mode:</span> <strong>${escapeHtml(d.paymentMode || 'manual')}</strong></div>`);
        if (providerMethods.length) lines.push('<div><span class="text-muted-foreground">Enabled options:</span> <strong>' + providerMethods.map(m => escapeHtml(m.label)).join(', ') + '</strong></div>');
        if (d.mpesaType) lines.push(`<div><span class="text-muted-foreground">M-Pesa type:</span> <strong>${escapeHtml(d.mpesaType)}</strong></div>`);
        if (d.paybill) lines.push(`<div><span class="text-muted-foreground">Paybill:</span> <strong>${escapeHtml(d.paybill)}</strong></div>`);
        if (d.till) lines.push(`<div><span class="text-muted-foreground">Till:</span> <strong>${escapeHtml(d.till)}</strong></div>`);
        if (d.shortcode && !d.paybill && !d.till) lines.push(`<div><span class="text-muted-foreground">Shortcode:</span> <strong>${escapeHtml(d.shortcode)}</strong></div>`);
        if (d.referenceFormat) lines.push(`<div><span class="text-muted-foreground">Account reference:</span> <strong>${escapeHtml(d.referenceFormat)}</strong></div>`);
        if (d.bankName || d.accountNumber) lines.push(`<div><span class="text-muted-foreground">Bank:</span> <strong>${escapeHtml(d.bankName || '')}</strong> ${escapeHtml(d.accountNumber || '')}</div>`);
        if (d.accountName) lines.push(`<div><span class="text-muted-foreground">Account name:</span> <strong>${escapeHtml(d.accountName)}</strong></div>`);
        const instructions = d.manualInstructions || d.offlineInstructions || 'Use the school payment details, then submit your reference for verification.';
        body.innerHTML = `<div class="grid gap-1">${lines.join('')}<div class="mt-2 text-muted-foreground">${escapeHtml(instructions)}</div></div>`;
    } catch (e) {
        body.innerHTML = `<span class="text-red-600">${escapeHtml(e.message || 'Could not load payment details.')}</span>`;
    }
}
window.refreshParentSchoolPaymentInfo = refreshParentSchoolPaymentInfo;

// ============ EXPORT FUNCTIONS ============
window.loadParentAlerts = loadParentAlerts;
window.loadLiveAttendance = loadLiveAttendance;
window.selectChild = selectChild;
window.reportAbsence = reportAbsence;
window.processPayment = processPayment;
window.processSchoolFeeDarajaPayment = processSchoolFeeDarajaPayment;
window.processSchoolFeeProviderPayment = processSchoolFeeProviderPayment;
window.submitManualSchoolFeePayment = submitManualSchoolFeePayment;
window.setParentFeeAmount = setParentFeeAmount;
window.upgradePlan = upgradePlan;
window.sendParentMessage = sendParentMessage;
window.renderParentSection = renderParentSection;
window.renderParentDashboard = renderParentDashboard;
window.renderParentProgress = renderParentProgress;
window.renderParentPayments = renderParentPayments;
window.renderParentChat = renderParentChat;


async function loadParentConversation(otherUserId) {
    const container = document.getElementById('parent-chat-messages');
    if (!container) return;
    container.innerHTML = '<div class="text-center text-muted-foreground py-8">Loading conversation...</div>';
    try {
        const res = await api.parent.getMessages(otherUserId);
        const messages = res.data || [];
        container.innerHTML = messages.length ? messages.map(msg => `
            <div class="flex ${msg.senderId === getCurrentUser().id ? 'justify-end' : 'justify-start'}">
                <div class="${msg.senderId === getCurrentUser().id ? 'chat-bubble-sent' : 'chat-bubble-received'} max-w-[70%]">
                    <p class="text-sm font-medium">${msg.senderId === getCurrentUser().id ? 'You' : escapeHtml(msg.Sender?.name || 'School Staff')}</p>
                    <p class="text-sm">${escapeHtml(msg.content)}</p>
                    <p class="text-xs text-muted-foreground mt-1">${timeAgo(msg.createdAt || msg.timestamp)}</p>
                </div>
            </div>
        `).join('') : '<div class="text-center text-muted-foreground py-8">No messages in this conversation yet.</div>';
        window.currentParentChatPartner = otherUserId;
    } catch (error) {
        console.error('Parent conversation load failed:', error);
        container.innerHTML = `<div class="text-center text-red-500 py-8">Could not load messages: ${escapeHtml(error.message)}</div>`;
    }
}
window.loadParentConversation = loadParentConversation;


// V42 compatibility alias: keep original parent payment layout, only satisfy older v12 callers.
window.v12RenderParentPayments = window.v12RenderParentPayments || window.renderParentPayments;



function updateParentFeeSummaryFromSelect() {
    const select = document.getElementById('payment-fee');
    const option = select?.selectedOptions?.[0];
    const total = Number(option?.dataset?.total || 0);
    const paid = Number(option?.dataset?.paid || 0);
    const balance = Number(option?.dataset?.balance || Math.max(0, total - paid));
    const totalEl = document.getElementById('parent-fee-total');
    const paidEl = document.getElementById('parent-fee-paid');
    const creditEl = document.getElementById('parent-fee-credit');
    const balanceEl = document.getElementById('parent-fee-balance');
    const amountEl = document.getElementById('payment-amount');
    if (totalEl) totalEl.textContent = `KES ${total.toLocaleString()}`;
    if (paidEl) paidEl.textContent = `KES ${paid.toLocaleString()}`;
    if (creditEl) creditEl.textContent = `KES ${credit.toLocaleString()}`;
    if (balanceEl) balanceEl.textContent = `KES ${balance.toLocaleString()}`;
    if (amountEl) amountEl.max = balance || '';
}
window.updateParentFeeSummaryFromSelect = updateParentFeeSummaryFromSelect;


async function setParentPaymentHistoryFilter(value) {
    localStorage.setItem('parent_payment_history_filter', value || 'all');
    await refreshParentPaymentPanelSoft();
}
window.setParentPaymentHistoryFilter = setParentPaymentHistoryFilter;

async function refreshParentPaymentPanelSoft() {
    const root = document.getElementById('parent-payments-root');
    if (!root || typeof renderParentPayments !== 'function') return;
    const html = await renderParentPayments();
    const wrapper = document.createElement('div');
    wrapper.innerHTML = html.trim();
    const next = wrapper.firstElementChild;
    if (next) root.replaceWith(next);
    if (window.lucide?.createIcons) window.lucide.createIcons();
    if (typeof window.refreshParentSchoolPaymentInfo === 'function') window.refreshParentSchoolPaymentInfo();
}
window.refreshParentPaymentPanelSoft = refreshParentPaymentPanelSoft;

window.renderParentChildSubscriptionCards = renderParentChildSubscriptionCards;
window.payChildSubscription = payChildSubscription;
window.submitManualChildSubscription = submitManualChildSubscription;
