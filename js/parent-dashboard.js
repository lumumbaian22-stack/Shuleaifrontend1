// parent-dashboard.js - Complete Parent Dashboard with Analytics Support
// Use global dashboardData from dashboard-controller.js
if (typeof window.dashboardData === 'undefined') window.dashboardData = {};
var dashboardData = window.dashboardData;
function parentSelectedChildStorageKey() {
    try {
        const user = typeof getCurrentUser === 'function' ? getCurrentUser() : {};
        const school = typeof getCurrentSchool === 'function' ? getCurrentSchool() : {};
        if (window.parentSelectedChildKey) return window.parentSelectedChildKey(user?.id);
        return `selectedChild:${user?.schoolCode || school?.schoolId || school?.schoolCode || 'no-school'}:${user?.id || 'unknown-parent'}`;
    } catch (_) {
        return 'selectedChild:no-school:unknown-parent';
    }
}
function getStoredSelectedChildId() { return localStorage.getItem(parentSelectedChildStorageKey()) || localStorage.getItem('shule_selected_child_id') || ''; }
function setStoredSelectedChildId(id) { localStorage.setItem(parentSelectedChildStorageKey(), String(id || '')); localStorage.setItem('shule_selected_child_id', String(id || '')); }

function formatParentMoney(amount, currency = 'KES') {
    const code = String(currency || 'KES').toUpperCase();
    const value = Number(amount || 0);
    try {
        return new Intl.NumberFormat('en-KE', { style: 'currency', currency: code, maximumFractionDigits: 2 }).format(value);
    } catch (_) {
        return `${code} ${value.toLocaleString('en-KE')}`;
    }
}

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
    dashboardData = window.dashboardData || window.parentDashboardData || {};
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
        dashboardData = window.dashboardData || window.parentDashboardData || dashboardData || {};
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
                setStoredSelectedChildId(selectedChildId);
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
        if (selectedChildId) setStoredSelectedChildId(selectedChildId);
        window.dashboardData = dashboardData;
        window.parentDashboardData = dashboardData;

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
                                    ${formatParentMoney(
                                        feeBalance,
                                        selectedChildSummary.currency ||
                                        selectedChildSummary.feeCurrency ||
                                        outstandingFees?.currency ||
                                        student.currency ||
                                        'KES'
                                    )}
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
        const children = dashboardData?.children || [];
        const selectedChildId = dashboardData?.selectedChildId || children?.[0]?.id;
        const selectedChild = children.find(c => String(c.id) === String(selectedChildId)) || children?.[0] || {};
        const historyFilter = localStorage.getItem('parent_payment_history_filter') || 'all';
        const subPhone = escapeHtml((typeof getCurrentUser === 'function' ? (getCurrentUser()?.phone || getCurrentUser()?.phoneNumber || '') : '') || '');
        let platformChildPlans = [];
        let platformPaymentMethod = { active:false, method:null, prompt:null };
        try { platformChildPlans = (await api.subscription.getPlans('child')).data || []; } catch (_) { platformChildPlans = []; }
        try { platformPaymentMethod = (await api.payments.getPlatformMethod()).data || platformPaymentMethod; } catch (_) {}
        const childSubHtml = renderParentChildSubscriptionCards ? renderParentChildSubscriptionCards(selectedChildId, selectedChild, subPhone, platformChildPlans, platformPaymentMethod) : '';

        let finance = { accounts: [], totals: { totalExpected:0, parentPaidAmount:0, creditAmount:0, balance:0 } };
        let payments = [];
        let parentPaymentMethods = { defaultProvider: 'manual', enabledProviders: [], methods: [] };
        if (selectedChildId) {
            try { finance = (await api.parent.getStudentFeeAccounts(selectedChildId)).data || finance; } catch (e) { console.warn('Student fee accounts failed', e.message); }
            try {
                payments = ((await api.parent.getStudentPaymentHistory(selectedChildId, { status: historyFilter })).data || [])
                    .filter(payment => payment.parentVisible !== false && payment.integrityValid !== false);
            } catch (e) { console.warn('Student payment history failed', e.message); }
        }
        try {
            const methodResponse = await (api.payments?.getParentMethods ? api.payments.getParentMethods({ studentId: selectedChildId }) : apiRequest('/api/payments/parent/methods'));
            parentPaymentMethods = methodResponse?.data || methodResponse || parentPaymentMethods;
        } catch (e) { console.warn('Parent payment methods failed', e.message); }

        const fees = finance.accounts || [];
        const feeBalance = f => Number(f?.balance ?? Math.max(0, Number(f?.totalAmount || f?.amount || 0) - Number((f?.parentPaidAmount ?? f?.paidAmount) || 0) - Number(f?.creditAmount || 0))) || 0;
        const payableFees = fees.filter(f => feeBalance(f) > 0);
        const activeFee = payableFees[0] || null;
        const balance = Number(activeFee?.balance ?? Math.max(0, Number(activeFee?.totalAmount||0) - Number((activeFee?.parentPaidAmount ?? activeFee?.paidAmount) || 0) - Number(activeFee?.creditAmount||0))) || 0;
        const parentPaid = Number(activeFee?.parentPaidAmount ?? activeFee?.paidAmount ?? 0);
        const credit = Number(activeFee?.creditAmount || 0);
        const totalBalance = children.reduce((sum, c) => sum + Number(c.outstandingBalance || c.balance || (String(c.id)===String(selectedChildId) ? balance : 0) || 0), 0) || Number(finance?.totals?.balance || balance || 0);
        const elimuId = selectedChild?.elimuid || selectedChild?.elimuId || selectedChild?.admissionNumber || finance.student?.elimuid || '—';
        const invoiceRows = payableFees.length ? payableFees.slice(0,8).map((f,idx)=>{
          const rowBalance = feeBalance(f);
          return `<tr><td>INV-${String(f.id || idx+1).padStart(4,'0')}</td><td>${escapeHtml(f.term || 'School Fees')} ${escapeHtml(String(f.year || ''))}</td><td>KES ${Number(f.totalAmount || f.amount || 0).toLocaleString()}</td><td>KES ${rowBalance.toLocaleString()}</td><td>${escapeHtml(f.dueDate ? String(f.dueDate).slice(0,10) : '—')}</td><td><span class="parent-pay-unpaid">${rowBalance>0?'Unpaid':'Paid'}</span></td><td>${rowBalance>0?`<button type="button" onclick="document.getElementById('payment-fee').value='${String(f.id)}'; updateParentFeeSummaryFromSelect(); setParentFeeAmount(${rowBalance});">Pay this</button>`:'—'}</td></tr>`;
        }).join('') : '<tr><td colspan="7">No active invoices found for this child.</td></tr>';
        const feeOptions = payableFees.length ? payableFees.map((f,idx)=>{
          const rowBalance = feeBalance(f);
          const total = Number(f.totalAmount || f.amount || 0);
          const paid = Number((f.parentPaidAmount ?? f.paidAmount) || 0);
          const creditValue = Number(f.creditAmount || 0);
          const label = `INV-${String(f.id || idx+1).padStart(4,'0')} • ${f.term || 'School Fees'} ${f.year || ''} • Balance KES ${rowBalance.toLocaleString()}`;
          return `<option value="${escapeHtml(f.id || '')}" data-total="${total}" data-paid="${paid}" data-credit="${creditValue}" data-balance="${rowBalance}" data-currency="${escapeHtml(f.currency || 'KES')}" ${activeFee && String(activeFee.id)===String(f.id)?'selected':''}>${escapeHtml(label)}</option>`;
        }).join('') : '<option value="" data-balance="0">No active fee account</option>';
        const childRows = children.length ? children.map(child => {
          const isActive = String(child.id) === String(selectedChildId);
          const childBalance = isActive ? balance : Number(child.outstandingBalance || child.balance || 0);
          return `<button type="button" class="parent-child-card ${isActive?'active':''}" onclick="selectChild(${jsAttrArg(child.id)})"><span class="parent-child-avatar">${escapeHtml((child.User?.name || child.name || 'S').charAt(0))}</span><span><strong>${escapeHtml(child.User?.name || child.name || 'Student')}</strong><small>${escapeHtml(child.grade || child.className || '')}</small></span><em>Outstanding<br>KES ${childBalance.toLocaleString()}</em></button>`;
        }).join('') : '<div class="payment-lock-alert">No linked children found.</div>';
        const historyRows = payments.length ? payments.slice(0,8).map(payment => `<div class="parent-history-row"><span><strong>${escapeHtml(payment.transactionTypeLabel || payment.transactionType || 'Payment')}</strong><small>${formatDate(payment.createdAt)} • ${escapeHtml(payment.reference || '')}</small></span><em>KES ${Number(payment.amount || 0).toLocaleString()}<small>${escapeHtml(payment.statusLabel || payment.status || '')}</small></em></div>`).join('') : '<div class="payment-lock-alert">No payment history for this child yet.</div>';

        const schoolPaymentMethods = normalizeParentPaymentMethods(parentPaymentMethods);
        const schoolPaymentMethod = schoolPaymentMethods[0] || null;
        const canPaySchoolFees = payableFees.length > 0 && !!schoolPaymentMethod;
        const manualSchoolFeeFlow = schoolPaymentMethod?.prompt === 'manual_instructions';
        const schoolInstructions = parentPaymentMethods?.paymentInstructions || {};
        const manualDestination = schoolInstructions.paybill || schoolInstructions.till || schoolInstructions.accountNumber || '';

        return `<div class="parent-payment-ui animate-fade-in" id="parent-payments-root" data-student-id="${escapeHtml(selectedChildId || '')}">
          <select id="payment-child" style="display:none">${children.map(child => `<option value="${child.id}" ${String(child.id)===String(selectedChildId)?'selected':''}></option>`).join('')}</select>
          <div class="parent-payment-card">
            <div class="parent-payment-top"><div><p>Total Outstanding Balance</p><h2>KES ${Number(totalBalance || balance || 0).toLocaleString()}</h2><span>${children.length} Children &nbsp; | &nbsp; ${fees.filter(f=>Number(f.balance||0)>0).length || 0} Unpaid Invoices</span></div><button type="button" onclick="setParentPaymentHistoryFilter('all')">View Statement</button></div>
            <div class="parent-payment-layout">
              <section>
                <h3>Select Child</h3>
                <div class="parent-child-list">${childRows}</div>
                <h3>${escapeHtml(selectedChild?.User?.name || selectedChild?.name || 'Selected Child')} — Outstanding Invoices <button type="button" onclick="setParentPaymentHistoryFilter('all')">View All</button></h3>
                <div class="parent-invoice-table"><table><thead><tr><th>Invoice No.</th><th>Description</th><th>Amount</th><th>Balance</th><th>Due Date</th><th>Status</th><th>Action</th></tr></thead><tbody>${invoiceRows}</tbody><tfoot><tr><td colspan="6">Selected Outstanding</td><td>KES ${balance.toLocaleString()}</td></tr></tfoot></table></div>
                ${payableFees.length ? `<div class="parent-checkout-box">
                  <h3>Pay School Fees <small>Choose amount before payment</small></h3>
                  <label>Fee item / invoice
                    <select id="payment-fee" onchange="updateParentFeeSummaryFromSelect()">${feeOptions}</select>
                  </label>
                  <div class="parent-amount-actions">
                    <button type="button" onclick="setParentFeeAmountMode('full')">Pay Full Balance</button>
                    <button type="button" onclick="setParentFeeAmountMode('half')">Pay Half</button>
                    <button type="button" onclick="setParentFeeAmountMode('custom')">Custom Amount</button>
                  </div>
                  <label>Amount to pay (KES)
                    <input id="payment-amount" type="number" min="1" max="${Number(balance || 0)}" value="${Number(balance || 0)}" placeholder="Enter amount to pay" oninput="updateParentPaymentSummaryDisplay()">
                  </label>
                  <div class="parent-payment-hidden-fields visible">
                    ${manualSchoolFeeFlow
                      ? '<label>Payment reference / M-Pesa code<input type="text" id="payment-mpesa-code" placeholder="Enter the unique payment reference" class="uppercase" minlength="5" maxlength="100"></label>'
                      : `<label>Payment phone<input type="tel" id="payment-phone" placeholder="2547XXXXXXXX" value="${escapeHtml((typeof getCurrentUser === 'function' ? (getCurrentUser()?.phone || getCurrentUser()?.phoneNumber || '') : ''))}"></label>`}
                  </div>
                  <div class="parent-pay-summary-card">
                    <span>Amount to Pay <strong id="parent-pay-amount-label">KES ${Number(balance || 0).toLocaleString()}</strong></span>
                    <span>Remaining After Payment <strong id="parent-pay-remaining-label">KES 0</strong></span>
                  </div>
                </div>` : `<div class="payment-lock-alert">This child has no unpaid invoice. School-fee payment is locked until the school creates an active fee account with an outstanding balance.</div>`}
                ${payableFees.length ? renderParentProviderMethods(parentPaymentMethods) : ''}
                ${canPaySchoolFees ? `<div class="parent-total-row"><span>Amount to Pay</span><strong id="parent-total-pay-label">KES ${balance.toLocaleString()}</strong></div>
                <button type="button" class="parent-pay-main-btn" id="parent-pay-now-main" onclick="${manualSchoolFeeFlow ? "submitManualSchoolFeePayment('manual')" : `processSchoolFeeProviderPayment(null,'${schoolPaymentMethod.method}')`}">${manualSchoolFeeFlow ? 'Submit Reference for Verification' : `Pay KES ${balance.toLocaleString()}`}</button>` : ''}
                <div class="parent-payment-info-strip"><span>🛡️ Secure Payments</span><span>🧾 Instant Receipts</span><span>🎧 24/7 Support</span></div>
              </section>
              <aside>
                ${manualSchoolFeeFlow && payableFees.length ? `<div class="parent-side-box manual-mpesa-box">
                  <h3>${escapeHtml(parentMethodLabel(schoolPaymentMethod.method))} <small>(School Fees)</small></h3>
                  <p>${escapeHtml(schoolInstructions.instructions || 'Complete the offline payment using details supplied by the school, then submit the unique reference for verification.')}</p>
                  ${manualDestination ? `<label>School payment destination<input readonly value="${escapeHtml(manualDestination)}"></label>` : '<div class="payment-lock-alert">Payment destination details are not configured. Contact the school finance office before paying.</div>'}
                  ${schoolInstructions.bankName ? `<label>Bank<input readonly value="${escapeHtml(schoolInstructions.bankName)}"></label>` : ''}
                  <label>Account Name<input readonly value="${escapeHtml(selectedChild?.User?.name || selectedChild?.name || 'Student')}"></label>
                  <label>Reference Format<input readonly value="${escapeHtml(elimuId && elimuId !== '—' ? elimuId + ' / Invoice Number' : 'ELIMU ID / Invoice Number')}"></label>
                  <p>Enter the reference in the payment form, then submit it once. The school will verify it before the balance changes.</p>
                </div>` : ''}
                <div class="parent-side-box"><h3>Payment History</h3>${historyRows}</div>
              </aside>
            </div>
            ${childSubHtml ? `<div class="parent-subscription-wrap exact-platform-subscriptions">${childSubHtml}</div>` : ''}
            <div class="parent-side-box important exact-parent-important"><h3>IMPORTANT FOR PARENTS</h3><p>✓ You only choose how to pay by method. You never choose a provider.</p><p>✓ School fees use the school active provider automatically.</p><p>✓ Platform subscriptions use the platform active provider automatically.</p></div>
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
    dashboardData = window.dashboardData || window.parentDashboardData || dashboardData || {};
    dashboardData.selectedChildId = childId;
    setStoredSelectedChildId(childId);
    window.dashboardData = dashboardData;
    window.parentDashboardData = dashboardData;

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
        window.dashboardData = dashboardData;
        window.parentDashboardData = dashboardData;
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
        const linkedChildId = response.data?.id || response.data?.studentId || '';
        if (linkedChildId) setStoredSelectedChildId(linkedChildId);
        const returnSection = currentSection || 'dashboard';
        await showDashboard('parent');
        if (returnSection !== 'dashboard') await showDashboardSection(returnSection);
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



function renderParentChildSubscriptionCards(selectedChildId, selectedChild, phone='', livePlans=null, platformFlow={}) {
    const fallbackPlans = [
        { code:'child_basic', name:'Basic', amount:100, features:['Report Cards','Attendance','Progress'], badge:'Basic' },
        { code:'child_premium', name:'Premium', amount:250, features:['AI Tutor','Analytics','Alerts'], badge:'Popular' },
        { code:'child_ultimate', name:'Ultimate', amount:500, features:['Everything in Premium','Stronger AI','Recommendations'], badge:'Ultimate' }
    ];
    const plans = (Array.isArray(livePlans) && livePlans.length ? livePlans : fallbackPlans).slice(0,3).map((p, i) => {
        const fallback = fallbackPlans[i] || fallbackPlans[0];
        const code = p.code || p.planCode || fallback.code;
        const name = p.displayName || p.name || fallback.name;
        const amount = Number(p.monthlyPriceKes ?? p.price_kes ?? p.amount ?? p.price ?? fallback.amount) || fallback.amount;
        const features = Array.isArray(p.features) && p.features.length ? p.features.slice(0,3) : fallback.features;
        const badge = fallback.badge;
        return { code, name, amount, features, badge };
    });
    const studentName = escapeHtml(selectedChild?.User?.name || selectedChild?.name || selectedChildId || 'Child');
    const manualPlatformFlow = platformFlow?.prompt === 'manual_instructions';
    const providerReady = platformFlow?.active === true;
    const planCards = plans.map((p, idx) => `<div class="platform-plan-card ${idx===1?'premium':idx===2?'ultimate':'basic'}">
        <div class="platform-plan-head"><h4>${escapeHtml(p.name)}</h4>${idx===1?'<span>POPULAR</span>':''}</div>
        <strong>KES ${Number(p.amount).toLocaleString()} <small>/ month</small></strong>
        <ul>${p.features.map(f => `<li>✓ ${escapeHtml(f)}</li>`).join('')}</ul>
        ${providerReady && !manualPlatformFlow ? `<button type="button" onclick="payChildSubscription(${jsAttrArg(p.code)}, ${Number(p.amount)})">Subscribe</button>` : ''}
        ${providerReady && manualPlatformFlow ? `<input id="parent-sub-code-${escapeHtml(p.code)}" class="platform-sub-code uppercase" placeholder="Payment code/reference"><button type="button" class="manual-sub-btn" onclick="submitManualChildSubscription(${jsAttrArg(p.code)}, ${Number(p.amount)})">Submit Reference</button>` : ''}
        ${!providerReady ? '<div class="payment-lock-alert">Platform payment method is not ready. Contact ShuleAI support.</div>' : ''}
      </div>`).join('');
    const methodCards = providerReady ? `<div class="payment-method-card parent-method-card green available"><span class="payment-method-icon">▣</span><span><strong>${manualPlatformFlow ? 'Manual Reference' : (platformFlow.prompt === 'hosted_checkout' ? 'Secure Checkout' : 'Automatic Phone Prompt')}</strong><small>Platform active method</small></span></div>` : '';
    return `<section class="platform-subscription-section">
        <div class="platform-subscription-title"><div><h3>Platform Subscription Plans</h3><p>For ${studentName}. Platform subscriptions use the platform active provider automatically.</p></div><input id="parent-sub-phone" type="tel" value="${phone}" placeholder="2547XXXXXXXX"></div>
        <div class="platform-plan-grid">${planCards}</div>
        <div class="platform-sub-methods"><div class="payment-lock-mini-head"><div><h4>Platform Subscription Payment Methods</h4><p>You choose the method. The platform active provider is used automatically.</p></div></div><div class="payment-method-grid four">${methodCards}</div></div>
      </section>`;
}

async function initiateChildPlatformSubscriptionPayment({ studentId, planCode, amount, phone, paymentMethod = '' }) {
    const res = await api.payments.parentSubscriptionSTK({
        studentId: Number(studentId),
        plan: planCode,
        planCode,
        amount: Number(amount),
        phone,
        ...(paymentMethod ? { paymentMethod } : {}),
        billingCycle: 'monthly',
        billingPeriod: 'monthly'
    });
    const data = res?.data || {};
    // Parent fee payments never expose checkout URLs. Provider URLs remain internal/admin-only.
    return res;
}

async function payChildSubscription(planCode, amount) {
    const studentId = dashboardData?.selectedChildId || document.getElementById('payment-child')?.value;
    const phone = document.getElementById('parent-sub-phone')?.value?.trim() || getParentPaymentPhone();
    if (!studentId) return showToast('Select a child first', 'error');
    if (!phone) return showToast('Enter payment phone number', 'error');
    showLoading();
    try {
        const res = await initiateChildPlatformSubscriptionPayment({ studentId, planCode, amount, phone });
        if (res?.data?.checkoutUrl && /^https:\/\//i.test(res.data.checkoutUrl)) window.location.assign(res.data.checkoutUrl);
        showToast(res.message || 'Backend started subscription payment. It activates only after provider confirmation.', 'success');
        window.dispatchEvent(new CustomEvent('shule:subscription-updated',{detail:{type:'parent-subscription-platform-provider'}}));
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
    const p = String(provider || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
    if (['mpesa','m_pesa','mpesa_stk','stk','safaricom','daraja'].includes(p)) return 'mpesa';
    if (['manual_mpesa','manual_verification','reference'].includes(p)) return 'manual';
    return p;
}

function normalizeParentPaymentMethod(method) {
    const m = String(method || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
    if (['mpesa','m_pesa','mpesa_stk','stk','daraja','mobile','mobile_money'].includes(m)) return 'mobile_money';
    if (['visa','mastercard','card_payment','cards','stripe'].includes(m)) return 'card';
    if (['bank_transfer','bank_deposit'].includes(m)) return 'bank';
    if (['cash_payment','office_cash'].includes(m)) return 'cash';
    if (['manual_mpesa','manual_verification','reference'].includes(m)) return 'manual';
    return m;
}

function parentProviderLabel(provider, fallback = '') {
    const p = normalizeParentPaymentProvider(provider);
    const labels = { manual: 'Manual verification', bank: 'Bank transfer', cash: 'Cash office payment', card: 'Card/POS', mpesa: 'M-Pesa', daraja: 'M-Pesa', paystack: 'Paystack', flutterwave: 'Flutterwave', pesapal: 'PesaPal', stripe: 'Stripe' };
    return fallback || labels[p] || String(provider || 'Payment provider');
}

function parentMethodLabel(method, fallback = '') {
    const m = normalizeParentPaymentMethod(method);
    const labels = { mobile_money: 'Mobile Money', card: 'Card Payments', bank: 'Bank Transfer', cash: 'Cash at Office', manual: 'Manual Reference' };
    return fallback || labels[m] || String(method || 'Payment method');
}

function parentProviderPrompt(provider, prompt = '') {
    const p = normalizeParentPaymentProvider(provider);
    if (prompt === 'hosted_checkout' || p === 'stripe' || p === 'pesapal') return 'hosted_checkout';
    if (p === 'mpesa' || p === 'daraja') return 'phone_prompt';
    if (prompt === 'phone_prompt') return 'phone_prompt';
    return 'manual_instructions';
}

function parentProviderDescription(method, prompt = '', provider = '') {
    const m = normalizeParentPaymentMethod(method);
    const p = normalizeParentPaymentProvider(provider);
    const type = parentProviderPrompt(p, prompt);
    if (type === 'hosted_checkout') return 'Continue securely to the active provider. Fees update only after provider confirmation.';
    if (type === 'phone_prompt' || m === 'mobile_money') return 'Enter your payment phone, then complete the secure provider prompt.';
    if (m === 'bank') return 'Pay using the bank details above, then submit the reference for finance approval.';
    if (m === 'cash') return 'Pay at the school office, then submit the receipt number for finance approval.';
    return 'Submit your payment reference for school finance verification.';
}

function normalizeParentPaymentMethods(methodData = {}) {
    const activeProvider = normalizeParentPaymentProvider(methodData.activeProvider || methodData.defaultProvider || '');
    const providers = methodData.providers || {};
    const activeCfg = providers[activeProvider] || {};
    const activeReady = !!activeProvider && activeCfg.enabled !== false && (activeCfg.ready === true || activeCfg.readiness === 'ready' || activeCfg.parentReady === true);
    const rows = [];
    const prompt = activeCfg.prompt || (activeCfg.supportsHostedCheckout ? 'hosted_checkout' : (activeCfg.supportsStkPush ? 'phone_prompt' : 'manual_instructions'));
    if (activeReady) rows.push({ provider: activeProvider, method: prompt === 'hosted_checkout' ? 'card' : (prompt === 'manual_instructions' ? 'manual' : 'mobile_money'), prompt, label: prompt === 'hosted_checkout' ? 'Continue to Secure Checkout' : 'Pay with School Active Provider' });
    return rows;
}

function renderParentProviderMethods(methodData = {}) {
    const methods = normalizeParentPaymentMethods(methodData);
    const active = methods[0] || null;
    const rows = !active ? [] : active.prompt === 'manual_instructions'
      ? [{ method:'manual', label:'Manual Verification', sub:'Reference / proof', icon:'▧', cls:'purple', action:"submitManualSchoolFeePayment('manual')" }]
      : [{ method:active.method, label:active.prompt === 'hosted_checkout' ? 'Continue to Secure Checkout' : 'Send Phone Prompt', sub:'School active payment method', icon:'▣', cls:'green', action:`processSchoolFeeProviderPayment(null,'${active.method}')` }];
    const cards = rows.map(row => {
        return `<button type="button" onclick="${row.action}" class="payment-method-card parent-method-card ${row.cls} available">
            <span class="payment-method-icon">${row.icon}</span>
            <span><strong>${escapeHtml(row.label)}</strong><small>${escapeHtml(row.sub)}</small></span>
        </button>`;
    }).join('') || `<div class="payment-lock-alert">No online payment method is ready yet. Use manual verification or contact the school finance office.</div>`;
    return `<div class="payment-lock-parent-box parent-school-methods">
        <div class="payment-lock-mini-head"><div><h4>School Fee Payment</h4><p>The school chooses one active provider. ShuleAI sends a phone prompt or securely opens the provider checkout when required.</p></div></div>
        <div class="payment-method-grid four">${cards}</div>
    </div>`;
}

function renderParentLegacyPaymentButtons(methodData = {}) { return ''; }

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
    const selectedFee = feeSelect?.selectedOptions?.[0];
    const studentId = childSelect?.value || dashboardData?.selectedChildId;
    const feeId = feeSelect?.value || selectedFee?.value || null;
    const amount = Number(String(amountInput?.value || '0').replace(/,/g, ''));
    const phone = phoneInput?.value?.trim() || getParentPaymentPhone();
    const balance = Number(selectedFee?.dataset?.balance || amountInput?.max || 0);
    const currency = selectedFee?.dataset?.currency || 'KES';
    return { studentId, feeId, amount, phone, balance, currency };
}

function updateParentPaymentSummaryDisplay() {
    const payload = getSelectedFeePaymentPayload();
    const amount = Number(payload.amount || 0);
    const balance = Number(payload.balance || 0);
    const remaining = Math.max(0, balance - amount);
    const amountLabel = document.getElementById('parent-pay-amount-label');
    const remainingLabel = document.getElementById('parent-pay-remaining-label');
    const mainBtn = document.getElementById('parent-pay-now-main');
    const totalLabel = document.getElementById('parent-total-pay-label');
    if (amountLabel) amountLabel.textContent = `${payload.currency || 'KES'} ${amount.toLocaleString()}`;
    if (remainingLabel) remainingLabel.textContent = `${payload.currency || 'KES'} ${remaining.toLocaleString()}`;
    if (totalLabel) totalLabel.textContent = `${payload.currency || 'KES'} ${amount.toLocaleString()}`;
    if (mainBtn) mainBtn.textContent = amount > 0 ? `Pay ${payload.currency || 'KES'} ${amount.toLocaleString()}` : 'Enter amount to pay';
}
window.updateParentPaymentSummaryDisplay = updateParentPaymentSummaryDisplay;

function setParentFeeAmount(amount) {
    const input = document.getElementById('payment-amount');
    const clean = Number(amount || 0);
    if (input && clean > 0) {
        input.value = clean;
        updateParentPaymentSummaryDisplay();
        input.focus();
    }
}

function setParentFeeAmountMode(mode) {
    const select = document.getElementById('payment-fee');
    const balance = Number(select?.selectedOptions?.[0]?.dataset?.balance || 0);
    const input = document.getElementById('payment-amount');
    if (mode === 'full') return setParentFeeAmount(balance);
    if (mode === 'half') return setParentFeeAmount(Math.ceil(balance / 2));
    if (input) { input.value = ''; input.focus(); updateParentPaymentSummaryDisplay(); }
}
window.setParentFeeAmountMode = setParentFeeAmountMode;

async function processSchoolFeeProviderPayment(provider = null, paymentMethod = '') {
    const normalizedProvider = provider ? normalizeParentPaymentProvider(provider) : '';
    const normalizedMethod = normalizeParentPaymentMethod(paymentMethod || provider || '');
    if (['manual','cash'].includes(normalizedMethod)) return submitManualSchoolFeePayment(normalizedMethod);

    const payload = getSelectedFeePaymentPayload();
    if (!payload.studentId) return showToast('Please select a child', 'error');
    if (!payload.feeId) return showToast('Select a fee account first', 'error');
    if (!payload.balance || payload.balance <= 0) return showToast('This child has no unpaid invoice to pay', 'error');
    if (!payload.amount || payload.amount <= 0) return showToast('Enter the amount you want to pay', 'error');
    if (payload.balance > 0 && payload.amount > payload.balance) return showToast(`Amount cannot exceed the selected balance of ${payload.currency || 'KES'} ${payload.balance.toLocaleString()}`, 'error');
    showLoading();
    try {
        const requestPayload = { studentId: parseInt(payload.studentId), feeId: payload.feeId || undefined, amount: payload.amount, phone: payload.phone };
        const response = await (api.payments?.initiateParentStk ? api.payments.initiateParentStk(requestPayload) : (api.payments?.initiateParentFee ? api.payments.initiateParentFee(requestPayload) : apiRequest('/api/payments/parent/stk/initiate', { method: 'POST', body: JSON.stringify(requestPayload) })));
        showToast(response.message || 'Payment request started through the school active provider. It will show as paid only after provider confirmation.', 'success');
        if (response?.data?.action?.type === 'redirect' && response.data.reference) {
            const continuation = await api.payments.continueCheckout(response.data.reference);
            const redirectUrl = continuation?.data?.redirectUrl;
            if (!redirectUrl || !/^https:\/\//i.test(redirectUrl)) throw new Error('The provider did not return a secure checkout address.');
            window.location.assign(redirectUrl);
            return;
        }
        window.dispatchEvent(new CustomEvent('shule:finance-updated',{detail:{type:'parent-provider-payment-started', provider: normalizedProvider}}));
        localStorage.setItem('shule:lastFinanceUpdate', String(Date.now()));
        await refreshParentPaymentPanelSoft();
    } catch (error) {
        console.error('School fee provider payment error:', error);
        showToast(error.message || 'Could not start the selected payment method.', 'error');
    } finally { hideLoading(); }
}

async function processSchoolFeeDarajaPayment() {
    const payload = getSelectedFeePaymentPayload();
    if (!payload.studentId) return showToast('Please select a child', 'error');
    if (!payload.amount || payload.amount <= 0) return showToast('Enter the amount you want to pay', 'error');
    if (payload.balance > 0 && payload.amount > payload.balance) return showToast(`Amount cannot exceed the selected balance of ${payload.currency || 'KES'} ${payload.balance.toLocaleString()}`, 'error');
    if (!payload.phone) return showToast('Enter the M-Pesa phone number', 'error');
    showLoading();
    try {
        const response = await (api.payments?.initiateParentStk ? api.payments.initiateParentStk({
            paymentType: 'school_fee',
            paymentMethod: 'mobile_money',
            studentId: parseInt(payload.studentId),
            feeId: payload.feeId || undefined,
            amount: payload.amount,
            phone: payload.phone,
            purpose: 'school_fee'
        }) : api.payments.parentFeeSTK({ studentId: parseInt(payload.studentId), feeId: payload.feeId || undefined, amount: payload.amount, phone: payload.phone }));
        const data = response?.data || {};
        showToast(response.message || 'STK Push sent. Check your phone and enter your M-Pesa PIN. It is not marked paid until provider confirmation.', 'success');
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
    if (!payload.feeId) return showToast('Select an unpaid invoice first', 'error');
    if (!payload.balance || payload.balance <= 0) return showToast('This child has no unpaid invoice to pay', 'error');
    if (!payload.amount || payload.amount <= 0) return showToast('Enter the amount paid', 'error');
    if (payload.balance > 0 && payload.amount > payload.balance) return showToast(`Amount cannot exceed the selected balance of ${payload.currency || 'KES'} ${payload.balance.toLocaleString()}`, 'error');
    if (!paymentReference) return showToast('Enter the payment reference/code after paying', 'error');
    if (!/^[A-Z0-9][A-Z0-9._/-]{4,99}$/.test(paymentReference)) return showToast('Use a valid 5–100 character reference containing letters, numbers, dot, slash, underscore, or hyphen', 'error');
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
        const response = await initiateChildPlatformSubscriptionPayment({
            studentId: parseInt(studentId),
            amount: parseFloat(amount),
            phone,
            planCode: plan,
            paymentMethod: normalizeParentPaymentMethod(method) || 'mobile_money'
        });

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
        const response = await initiateChildPlatformSubscriptionPayment({
            studentId: parseInt(selectedChildId),
            planCode: planId,
            amount,
            phone
        });

        if (response.success) {
            showToast(response.message || `Subscription payment started for ${planId}`, 'success');
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


const parentChatState = window.__parentChatState || { conversationKey:null, messages:[], target:'teacher', childId:null, targets:null };
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
async function loadParentMessageTargets(childId){
    try{
        const res = await api.parent.getMessageTargets(childId);
        parentChatState.targets = res.data || null;
        const select = document.getElementById('parent-recipient-type');
        if (select && parentChatState.targets) {
            const ct = parentChatState.targets.classTeacher || {};
            const admin = parentChatState.targets.admin || {};
            select.innerHTML = `${ct.available ? `<option value="teacher">📚 Class Teacher (${escapeHtml(ct.name || 'Class Teacher')})</option>` : `<option value="teacher" disabled>📚 Class Teacher not assigned</option>`}${admin.available ? `<option value="admin">🏫 ${escapeHtml(admin.name || 'School Administrator')}</option>` : ''}`;
            if (!ct.available && admin.available) select.value = 'admin';
            if (ct.available && parentChatState.target === 'teacher') select.value = 'teacher';
        }
        return parentChatState.targets;
    }catch(error){ console.warn('Parent message targets failed', error.message); parentChatState.targets = null; return null; }
}

function parentChatRender({forceBottom=false}={}){
    const container=document.getElementById('parent-chat-messages'); if(!container)return;
    const me=typeof getCurrentUser==='function'?(getCurrentUser()||{}):JSON.parse(localStorage.getItem('user')||'{}');
    const wasNearBottom=container.scrollHeight-container.scrollTop-container.clientHeight<100;
    if(!parentChatState.messages.length){container.innerHTML='<div class="text-center text-muted-foreground py-8"><i data-lucide="message-circle" class="h-10 w-10 mx-auto mb-2 opacity-50"></i><p>No messages yet. Start the conversation below.</p></div>';return;}
    container.innerHTML=parentChatState.messages.map(msg=>{const mine=Number(msg.senderId)===Number(me.id);const status=msg.status==='sending'?'Sending…':msg.status==='failed'?'Failed — tap Retry':(msg.isRead||msg.deliveryStatus==='read'?'Read':msg.deliveryStatus==='delivered'?'Delivered':'Sent');const person=mine?me:{name:msg.senderName||(parentChatState.target==='admin'?'School Administrator':'Class Teacher'),profileImage:msg.senderProfileImage};return `<div class="flex items-end gap-2 ${mine?'justify-end':'justify-start'}" data-parent-message="${escapeHtml(parentChatMessageId(msg))}">${mine?'':avatarHTML(person.name,person.profileImage,'h-8 w-8')}<button type="button" ${msg.status==='failed'?`onclick="retryParentMessage(${jsAttrArg(msg.clientMessageId)})"`:''} class="${mine?'chat-bubble-sent':'chat-bubble-received'} max-w-[78%] text-left"><p class="text-sm font-medium">${mine?'You':escapeHtml(person.name)}</p><p class="text-sm whitespace-pre-wrap">${escapeHtml(msg.content||'')}</p><p class="text-[11px] mt-1 ${msg.status==='failed'?'text-red-500':'text-muted-foreground'}">${escapeHtml(status)} • ${timeAgo(msg.createdAt)}</p></button>${mine?avatarHTML(me.name,me.profileImage||me.profilePicture,'h-8 w-8'):''}</div>`;}).join('');
    if(forceBottom||wasNearBottom)container.scrollTop=container.scrollHeight;
    if(window.lucide)lucide.createIcons();
}

window.loadParentRecipientConversation = async function() {
    const container=document.getElementById('parent-chat-messages'); if(!container)return;
    parentChatState.childId=String(dashboardData?.selectedChildId||'');
    await loadParentMessageTargets(parentChatState.childId);
    parentChatState.target=document.getElementById('parent-recipient-type')?.value||'teacher';
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
    if(!parentChatState.targets || String(parentChatState.targets.studentId||'')!==String(childId)) await loadParentMessageTargets(childId);
    if(parentChatState.target==='teacher' && parentChatState.targets?.classTeacher?.available===false){
        return showToast(parentChatState.targets.classTeacher.reason || 'Class teacher is not assigned for this child yet. Please message the school admin.', 'warning');
    }
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


function jsAttrArg(value) {
    return JSON.stringify(String(value ?? '')).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

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
window.getStoredSelectedChildId = getStoredSelectedChildId;
window.setStoredSelectedChildId = setStoredSelectedChildId;
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
    const credit = Number(option?.dataset?.credit || 0);
    const totalEl = document.getElementById('parent-fee-total');
    const paidEl = document.getElementById('parent-fee-paid');
    const creditEl = document.getElementById('parent-fee-credit');
    const balanceEl = document.getElementById('parent-fee-balance');
    const amountEl = document.getElementById('payment-amount');
    if (totalEl) totalEl.textContent = `KES ${total.toLocaleString()}`;
    if (paidEl) paidEl.textContent = `KES ${paid.toLocaleString()}`;
    if (creditEl) creditEl.textContent = `KES ${credit.toLocaleString()}`;
    if (balanceEl) balanceEl.textContent = `KES ${balance.toLocaleString()}`;
    if (amountEl) {
        amountEl.max = balance || '';
        if (!Number(amountEl.value || 0) || Number(amountEl.value || 0) > balance) amountEl.value = balance > 0 ? balance : '';
    }
    if (typeof updateParentPaymentSummaryDisplay === 'function') updateParentPaymentSummaryDisplay();
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
