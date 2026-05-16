// student-dashboard-extended.js - Student dashboard rendering with dynamic school name
// Use global dashboardData from dashboard-controller.js
if (typeof window.dashboardData === 'undefined') window.dashboardData = {};
var dashboardData = window.dashboardData;

// Fallback helpers (if not globally defined)
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function timeAgo(timestamp) {
    if (!timestamp) return 'N/A';
    const seconds = Math.floor((new Date() - new Date(timestamp)) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
}

async function renderStudentSection(section) {
    switch(section) {
        case 'dashboard':
            return await renderStudentDashboard();
        case 'leaderboard':
            return await renderStudentLeaderboard();
        case 'grades':
            return await renderStudentGrades();
        case 'badges':
            return await renderStudentBadges();
        case 'rewards':
            return await renderRewardsStore();
        case 'my-homework':
            return await (window.v12RenderStudentHomework || window.renderStudentHomework)();
        case 'attendance':
            return await renderStudentAttendance();
        case 'chat':
            return await renderStudentV9Classroom();
        case 'ai-tutor':
            return renderStudentAITutor();
        case 'schedule':
            return await (window.v12RenderStudentTimetable || window.renderStudentTimetable || window.renderAdminTimetable)();
        case 'help':
            return renderHelpSection();
        case 'settings':
        case 'profile':
            return await renderProfileSection();
        case 'alerts':
            return await (window.v12RenderAlertsCenter || window.renderAlertsCenter)('student');
            default:
            return await renderStudentDashboard();
    }
}

async function renderStudentDashboard() {
    try {
        if (!dashboardData || Object.keys(dashboardData).length === 0) {
            try {
                const res = await api.student.getDashboard();
                dashboardData = res.data || {};
                window.dashboardData = dashboardData;
                window.studentDashboardData = dashboardData;
            } catch(e) { dashboardData = window.dashboardData || {}; }
        }
        const data = dashboardData || {};
        const user = getCurrentUser();
        const school = getCurrentSchool();
        const average = data.stats?.averageScore || data.averageScore || 0;
        const attendanceRate = data.stats?.attendanceRate || (data.recentAttendance?.length ? Math.round((data.recentAttendance.filter(a => a.status === 'present').length / data.recentAttendance.length) * 100) : 0);
        const studentPoints = data.student?.points || user?.points || 0;

        return `
            <div class="space-y-6 animate-fade-in">
                <!-- Report Card Button -->
                <div class="flex justify-end">
                     <button onclick="openReportCard()" class="px-3 py-1 bg-primary text-white text-sm rounded-lg inline-flex items-center gap-1">
                          <i data-lucide="file-text" class="h-4 w-4"></i> View Report Card
                    </button>
                </div>
                
                <!-- School Name Header -->
                <div class="rounded-xl border bg-card p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700">
                    <h2 id="student-school-name" class="text-xl font-semibold">${escapeHtml((window.BrandingManager && window.BrandingManager.getDisplayName ? window.BrandingManager.getDisplayName() : ((school && school.status === 'active') ? school.name : 'ShuleAI')))}</h2>
                    <p class="text-sm text-muted-foreground">Welcome back, ${user?.name || 'Student'}</p>
                </div>
                
                <!-- Stats Grid -->
                <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div class="rounded-xl border bg-card p-6 card-hover">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-muted-foreground">My ELIMUID</p>
                                <h3 class="text-lg font-mono font-bold mt-1" id="student-elimuid">${user?.elimuid || 'ELI-2024-001'}</h3>
                            </div>
                            <div class="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center">
                                <i data-lucide="id-card" class="h-6 w-6 text-purple-600"></i>
                            </div>
                        </div>
                    </div>
                    <div class="rounded-xl border bg-card p-6 card-hover">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-muted-foreground">My Points</p>
                                <h3 class="text-2xl font-bold mt-1" id="student-points">${studentPoints}</h3>
                                <p class="text-xs text-muted-foreground mt-1">Earned from tasks</p>
                            </div>
                            <div class="h-12 w-12 rounded-lg bg-yellow-100 flex items-center justify-center">
                                <i data-lucide="star" class="h-6 w-6 text-yellow-600"></i>
                            </div>
                        </div>
                    </div>
                    <div class="rounded-xl border bg-card p-6 card-hover">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-muted-foreground">Class Average</p>
                                <h3 class="text-2xl font-bold mt-1" id="class-average-student">${average}%</h3>
                            </div>
                            <div class="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
                                <i data-lucide="trending-up" class="h-6 w-6 text-green-600"></i>
                            </div>
                        </div>
                    </div>
                    <div class="rounded-xl border bg-card p-6 card-hover">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-muted-foreground">My Attendance</p>
                                <h3 class="text-2xl font-bold mt-1" id="student-attendance">${attendanceRate}%</h3>
                            </div>
                            <div class="h-12 w-12 rounded-lg bg-amber-100 flex items-center justify-center">
                                <i data-lucide="calendar-check" class="h-6 w-6 text-amber-600"></i>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Leaderboard & Badges Row (loaded dynamically) -->
                <div class="grid gap-4 md:grid-cols-2">
                    <div class="rounded-xl border bg-card p-4">
                        <h3 class="font-semibold mb-3 flex items-center gap-2">
                            <i data-lucide="trophy" class="h-5 w-5 text-yellow-500"></i> Class Leaderboard
                        </h3>
                        <div id="student-leaderboard">
                            <p class="text-sm text-muted-foreground">Loading...</p>
                        </div>
                    </div>
                    <div class="rounded-xl border bg-card p-4">
                        <h3 class="font-semibold mb-3 flex items-center gap-2">
                            <i data-lucide="award" class="h-5 w-5 text-purple-500"></i> My Badges
                        </h3>
                        <div id="student-badges">
                            <p class="text-sm text-muted-foreground">Loading...</p>
                        </div>
                    </div>
                </div>

                <!-- Quick Actions -->
                <div class="grid gap-4 md:grid-cols-2">
                    <button onclick="showDashboardSection('chat')" class="p-6 border rounded-lg hover:bg-accent transition-colors text-left flex items-center gap-4">
                        <div class="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                            <i data-lucide="message-circle" class="h-6 w-6 text-blue-600"></i>
                        </div>
                        <div>
                            <h4 class="font-semibold">Study Groups</h4>
                            <p class="text-sm text-muted-foreground">Chat with students from other schools</p>
                        </div>
                    </button>
                    <button onclick="showDashboardSection('ai-tutor')" class="p-6 border rounded-lg hover:bg-accent transition-colors text-left flex items-center gap-4">
                        <div class="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                            <i data-lucide="bot" class="h-6 w-6 text-purple-600"></i>
                        </div>
                        <div>
                            <h4 class="font-semibold">AI Tutor</h4>
                            <p class="text-sm text-muted-foreground">Get help with any subject</p>
                        </div>
                    </button>
                </div>

                <!-- Study Progress Summary - dashboard uses cards/tables, not charts -->
                <div class="rounded-xl border bg-card p-6">
                    <h3 class="font-semibold mb-4">My Progress Summary</h3>
                    <div class="grid gap-3 md:grid-cols-3 text-sm">
                        <div class="p-3 rounded-lg bg-muted/30">
                            <p class="text-muted-foreground">Current Average</p>
                            <p class="text-2xl font-bold">${dashboardData?.averageScore || dashboardData?.overallAverage || 0}%</p>
                        </div>
                        <div class="p-3 rounded-lg bg-muted/30">
                            <p class="text-muted-foreground">Attendance</p>
                            <p class="text-2xl font-bold">${dashboardData?.attendanceRate || 0}%</p>
                        </div>
                        <div class="p-3 rounded-lg bg-muted/30">
                            <p class="text-muted-foreground">Points</p>
                            <p class="text-2xl font-bold">${dashboardData?.points || 0}</p>
                        </div>
                    </div>
                </div>

                <!-- Gamified Home Tasks Section -->
                <div class="rounded-xl border bg-card p-6" id="student-home-tasks-container">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="font-semibold flex items-center gap-2">
                            <i data-lucide="star" class="h-5 w-5 text-yellow-500"></i>
                            Today's Learning Tasks
                        </h3>
                        <span class="text-xs text-muted-foreground">Complete to earn points</span>
                    </div>
                    <div id="student-home-tasks-list">
                        <div class="text-center text-muted-foreground py-4">
                            <i data-lucide="loader-2" class="h-6 w-6 animate-spin mx-auto mb-2"></i>
                            Loading tasks...
                        </div>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        return `<div class="text-center py-12 text-red-500">Error loading dashboard: ${error.message}</div>`;
    }
}

// Load leaderboard & badges into the dashboard widgets
async function loadDashboardLeaderboard() {
    try {
        const dashboardRes = await api.student.getDashboard();
        const classId = dashboardRes.data?.classId;
        if (!classId) {
            const lb0 = document.getElementById('student-leaderboard'); if (lb0) lb0.innerHTML = '<p class="text-sm text-muted-foreground">Class not available</p>'; else return;
            return;
        }
        const res = await apiRequest(`/api/gamification/leaderboard/${classId}`);
        const list = res.data || [];
        const html = list.length === 0
            ? '<p class="text-sm text-muted-foreground">No data</p>'
            : list.slice(0, 5).map(i => `<div class="flex justify-between py-1"><span>#${i.rank} ${escapeHtml(i.name)}</span><span class="font-bold">${i.points} pts</span></div>`).join('');
        const lb = document.getElementById('student-leaderboard'); if (lb) lb.innerHTML = html;
    } catch (e) {
        const lb = document.getElementById('student-leaderboard'); if (lb) lb.innerHTML = ''; 
    }
}

async function loadDashboardBadges() {
    try {
        const dashboardRes = await api.student.getDashboard();
        const studentId = dashboardRes.data?.student?.id;
        if (!studentId) {
            const badgesEl = document.getElementById('student-badges'); if (badgesEl) badgesEl.innerHTML = ''; 
            return;
        }
        const res = await apiRequest(`/api/gamification/badges/${studentId}`);
        const badges = res.data || [];
        const html = badges.length === 0
            ? '<p class="text-sm text-muted-foreground">No badges yet</p>'
            : badges.map(b => `<span class="inline-flex items-center px-2 py-1 mr-2 mt-2 bg-purple-100 text-purple-800 rounded-full text-xs">${b.Badge?.icon || '🏅'} ${b.Badge?.name}</span>`).join('');
        const badgesEl = document.getElementById('student-badges'); if (badgesEl) badgesEl.innerHTML = html;
    } catch (e) {
        const badgesEl = document.getElementById('student-badges'); if (badgesEl) badgesEl.innerHTML = ''; 
    }
}

// Trigger widget loads after dashboard render
setTimeout(() => {
    loadStudentHomeTasks();
    loadDashboardLeaderboard();
    loadDashboardBadges();
    if (typeof initStudentCharts === 'function') initStudentCharts(window.dashboardData || dashboardData || {});
}, 200);

async function loadStudentHomeTasks() {
    const container = document.getElementById('student-home-tasks-list');
    if (!container) return;
    try {
        const user = getCurrentUser();
        const studentId = user?.id;
        const res = await api.homeTasks.getToday(studentId);
        const tasks = res.data || [];
        if (tasks.length === 0) {
            container.innerHTML = '<div class="text-center text-muted-foreground py-4">No tasks for today – check back later!</div>';
            return;
        }
        container.innerHTML = tasks.map(task => `
            <div class="border rounded-lg p-4 mb-3 hover:shadow-md transition-shadow">
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <div class="flex items-center gap-2 mb-2">
                            <span class="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">${escapeHtml(task.type)}</span>
                            <span class="text-xs text-muted-foreground">⭐ ${task.points} points</span>
                            <span class="text-xs text-muted-foreground">⏱️ ${task.estimatedMinutes} min</span>
                        </div>
                        <h4 class="font-medium">${escapeHtml(task.title)}</h4>
                        <p class="text-sm text-muted-foreground mt-1">${escapeHtml(task.instructions)}</p>
                        ${task.materials ? `<p class="text-xs text-muted-foreground mt-2">📦 Materials: ${escapeHtml(task.materials)}</p>` : ''}
                    </div>
                </div>
                <div class="mt-3 flex justify-end">
                    <button onclick="markTaskComplete(${task.id})" class="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-lg hover:bg-green-200 transition-colors">
                        Mark Complete
                    </button>
                </div>
            </div>
        `).join('');
        if (window.lucide) lucide.createIcons();
    } catch (e) {
        console.error('Failed to load home tasks:', e);
        container.innerHTML = '<div class="text-center text-red-500 py-4">Failed to load tasks</div>';
    }
}

// ========== GRADES SECTION ==========
async function renderStudentGrades() {
    try {
        let grades = [];

        // Stage 1C: use only the official student endpoint for this section.
        // No mock/demo/dashboard fallback data is used here, so the screen either
        // shows real published marks or an honest empty state.
        const res = await apiRequest('/api/student/grades');
        grades = Array.isArray(res.data) ? res.data : [];
        window.v66GradeRecommendationCache = window.v66GradeRecommendationCache || {};

        window.v66StudentGrades = grades.map(v66NormalizeStudentGrade);
        const filters = v66BuildGradeFilters(window.v66StudentGrades);
        const initial = v66PickInitialGradeFilter(filters);
        window.v66StudentGradeFilter = initial;
        setTimeout(() => v66LoadGradeRecommendations(initial), 0);

        return `
            <div class="space-y-6 animate-fade-in student-grades-section">
                <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h2 class="text-2xl font-bold">My Grades</h2>
                        <p class="text-sm text-muted-foreground">Choose academic year, term, and test type to view the exact results for that period.</p>
                    </div>
                    <button onclick="openReportCard && openReportCard()" class="px-3 py-2 bg-primary text-white text-sm rounded-lg inline-flex items-center gap-2 w-fit">
                        <i data-lucide="file-text" class="h-4 w-4"></i> View Report Card
                    </button>
                </div>

                <div class="grid gap-3 md:grid-cols-3 rounded-xl border bg-card p-4">
                    ${v66RenderSelect('Academic Year', 'year', filters.years, initial.year)}
                    ${v66RenderSelect('Term', 'term', filters.terms, initial.term)}
                    ${v66RenderSelect('Assessment/Test', 'assessment', filters.assessments, initial.assessment)}
                </div>

                <div id="student-grades-results">
                    ${v66RenderGradesResults(window.v66StudentGrades, initial)}
                </div>
            </div>
        `;
    } catch (error) {
        return `<div class="rounded-xl border bg-card p-8 text-center text-red-500"><p class="font-medium">Could not load published grades.</p><p class="text-xs mt-1">${escapeHtml(error.message)}</p></div>`;
    }
}

function v66NormalizeStudentGrade(record) {
    const rawDate = record.date || record.createdAt || record.updatedAt || record.assessmentDate || null;
    const d = rawDate ? new Date(rawDate) : null;
    const year = String(record.academicYear || record.year || record.schoolYear || (d && !isNaN(d) ? d.getFullYear() : new Date().getFullYear()));
    const term = String(record.term || record.termName || record.schoolTerm || record.Term?.name || 'Term 1');
    const assessment = String(record.assessmentName || record.assessmentType || record.testType || record.examType || record.type || 'Assessment');
    const scoreRaw = record.score ?? record.marks ?? record.mark ?? record.percentage ?? null;
    const score = Number.isFinite(Number(scoreRaw)) ? Number(scoreRaw) : 0;
    return {
        id: record.id || `${record.subject || 'subject'}-${year}-${term}-${assessment}`,
        subject: record.subject || record.Subject?.name || 'Unknown Subject',
        year,
        term,
        assessment,
        score,
        totalMarks: Number(record.totalMarks || record.outOf || record.maxScore || 100),
        grade: record.grade || 'N/A',
        teacher: record.teacherName || record.Teacher?.User?.name || record.Teacher?.name || record.teacher || 'Not assigned',
        remark: record.remark || record.remarks || record.teacherRemark || record.comments || '',
        date: rawDate
    };
}

function v66BuildGradeFilters(grades) {
    const unique = (arr) => [...new Set(arr.filter(Boolean))];
    const years = unique(grades.map(g => g.year)).sort((a, b) => Number(b) - Number(a));
    const terms = unique(grades.map(g => g.term)).sort();
    const assessments = unique(grades.map(g => g.assessment)).sort();
    return {
        years: years.length ? years : [String(new Date().getFullYear())],
        terms: terms.length ? terms : ['Term 1'],
        assessments: assessments.length ? assessments : ['Assessment']
    };
}

function v66PickInitialGradeFilter(filters) {
    return {
        year: filters.years[0] || String(new Date().getFullYear()),
        term: filters.terms[0] || 'Term 1',
        assessment: filters.assessments[0] || 'Assessment'
    };
}

function v66RenderSelect(label, key, options, selected) {
    return `
        <label class="space-y-1">
            <span class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">${escapeHtml(label)}</span>
            <select id="student-grade-filter-${key}" onchange="v66ApplyStudentGradeFilters()" class="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                ${options.map(opt => `<option value="${escapeHtml(opt)}" ${String(opt) === String(selected) ? 'selected' : ''}>${escapeHtml(opt)}</option>`).join('')}
            </select>
        </label>`;
}

async function v66ApplyStudentGradeFilters() {
    const filter = {
        year: document.getElementById('student-grade-filter-year')?.value,
        term: document.getElementById('student-grade-filter-term')?.value,
        assessment: document.getElementById('student-grade-filter-assessment')?.value
    };
    window.v66StudentGradeFilter = filter;
    const target = document.getElementById('student-grades-results');
    if (target) target.innerHTML = v66RenderGradesResults(window.v66StudentGrades || [], filter);
    if (window.lucide) lucide.createIcons();
    await v66LoadGradeRecommendations(filter);
}

function v66RecommendationKey(filter = {}) {
    return `${filter.year || ''}|${filter.term || ''}|${filter.assessment || ''}`;
}

async function v66LoadGradeRecommendations(filter = {}) {
    const container = document.getElementById('student-grade-recommendations');
    if (!container) return;
    const key = v66RecommendationKey(filter);
    window.v66GradeRecommendationCache = window.v66GradeRecommendationCache || {};
    if (Array.isArray(window.v66GradeRecommendationCache[key])) {
        container.innerHTML = v66RenderGradeRecommendationCards(window.v66GradeRecommendationCache[key]);
        if (window.lucide) lucide.createIcons();
        return;
    }
    container.innerHTML = '<div class="rounded-lg border bg-background p-3 text-sm text-muted-foreground">Loading real recommendations from published marks...</div>';
    try {
        const apiFn = api?.student?.getRecommendations || ((params) => apiRequest(`/api/student/recommendations?${new URLSearchParams(params).toString()}`));
        const res = await apiFn({ year: filter.year || '', term: filter.term || '', assessment: filter.assessment || '' });
        const items = Array.isArray(res.data) ? res.data : [];
        window.v66GradeRecommendationCache[key] = items;
        container.innerHTML = v66RenderGradeRecommendationCards(items);
    } catch (error) {
        container.innerHTML = `<div class="rounded-lg border bg-background p-3 text-sm text-red-600">${escapeHtml(error.message || 'Could not load recommendations.')}</div>`;
    }
    if (window.lucide) lucide.createIcons();
}

function v66RenderGradeRecommendationCards(items = []) {
    if (!items.length) {
        return '<div class="rounded-lg border bg-background p-3 text-sm text-muted-foreground">No recommendations yet. Recommendations will appear after marks are published.</div>';
    }
    return items.map(item => {
        const icon = item.priority === 'high' ? 'alert-triangle' : item.priority === 'positive' ? 'trending-up' : 'lightbulb';
        return `
            <div class="rounded-lg border bg-background p-3">
                <div class="flex items-start gap-2">
                    <i data-lucide="${icon}" class="h-4 w-4 mt-0.5 text-primary"></i>
                    <div>
                        <p class="text-sm font-medium">${escapeHtml(item.title || 'Recommendation')}</p>
                        <p class="text-xs text-muted-foreground mt-1">${escapeHtml(item.detail || '')}</p>
                        ${item.action ? `<p class="text-xs font-medium mt-2">Action: ${escapeHtml(item.action)}</p>` : ''}
                    </div>
                </div>
            </div>`;
    }).join('');
}

function v66RenderGradesResults(grades, filter) {
    const selected = grades.filter(g => String(g.year) === String(filter.year) && String(g.term) === String(filter.term) && String(g.assessment) === String(filter.assessment));
    const average = selected.length ? Math.round(selected.reduce((sum, g) => sum + Number(g.score || 0), 0) / selected.length) : 0;
    const sorted = [...selected].sort((a, b) => Number(b.score || 0) - Number(a.score || 0));
    const strongest = sorted[0]?.subject || 'N/A';
    const weakest = sorted[sorted.length - 1]?.subject || 'N/A';

    if (!grades.length) {
        return `
            <div class="rounded-xl border bg-card p-8 text-center text-muted-foreground">
                <i data-lucide="clipboard-list" class="h-10 w-10 mx-auto mb-3 opacity-70"></i>
                <p class="font-medium">No published grades yet.</p>
                <p class="text-sm mt-1">Published marks will appear here grouped by year, term, and assessment.</p>
            </div>`;
    }

    return `
        <div class="space-y-4">
            <div class="grid gap-4 md:grid-cols-4">
                <div class="rounded-xl border bg-card p-4">
                    <p class="text-xs text-muted-foreground">Average Score</p>
                    <h3 class="text-2xl font-bold mt-1">${average}%</h3>
                </div>
                <div class="rounded-xl border bg-card p-4">
                    <p class="text-xs text-muted-foreground">Subjects</p>
                    <h3 class="text-2xl font-bold mt-1">${selected.length}</h3>
                </div>
                <div class="rounded-xl border bg-card p-4">
                    <p class="text-xs text-muted-foreground">Strongest</p>
                    <h3 class="text-base font-semibold mt-1 truncate">${escapeHtml(strongest)}</h3>
                </div>
                <div class="rounded-xl border bg-card p-4">
                    <p class="text-xs text-muted-foreground">Needs Focus</p>
                    <h3 class="text-base font-semibold mt-1 truncate">${escapeHtml(weakest)}</h3>
                </div>
            </div>

            ${selected.length ? `
                <div class="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
                    <div class="rounded-xl border bg-card overflow-hidden">
                        <div class="p-4 border-b flex items-center justify-between">
                            <div>
                                <h3 class="font-semibold">${escapeHtml(filter.term)} • ${escapeHtml(filter.assessment)} Results</h3>
                                <p class="text-xs text-muted-foreground">Academic year ${escapeHtml(filter.year)}</p>
                            </div>
                        </div>
                        <div class="overflow-x-auto">
                            <table class="w-full text-sm">
                                <thead class="bg-muted/50">
                                    <tr>
                                        <th class="px-4 py-3 text-left font-medium">Subject</th>
                                        <th class="px-4 py-3 text-center font-medium">Marks</th>
                                        <th class="px-4 py-3 text-center font-medium">Grade</th>
                                        <th class="px-4 py-3 text-left font-medium">Teacher</th>
                                        <th class="px-4 py-3 text-left font-medium">Remark</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y">
                                    ${selected.map(g => `
                                        <tr class="hover:bg-accent/50 transition-colors">
                                            <td class="px-4 py-3 font-medium">${escapeHtml(g.subject)}</td>
                                            <td class="px-4 py-3 text-center">${Number(g.score || 0)}/${Number(g.totalMarks || 100)}</td>
                                            <td class="px-4 py-3 text-center"><span class="px-2 py-1 ${getGradeColorClass(g.grade)} text-xs rounded-full">${escapeHtml(g.grade)}</span></td>
                                            <td class="px-4 py-3">${escapeHtml(g.teacher)}</td>
                                            <td class="px-4 py-3 text-muted-foreground">${escapeHtml(g.remark || '-')}</td>
                                        </tr>`).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div class="rounded-xl border bg-card p-4 space-y-4">
                        <div>
                            <h3 class="font-semibold">Subject Performance</h3>
                            <p class="text-xs text-muted-foreground">Quick visual comparison</p>
                        </div>
                        <div class="space-y-3">
                            ${selected.map(g => `
                                <div>
                                    <div class="flex justify-between text-xs mb-1"><span>${escapeHtml(g.subject)}</span><span>${Number(g.score || 0)}%</span></div>
                                    <div class="h-2 rounded-full bg-muted overflow-hidden"><div class="h-full bg-primary" style="width:${Math.max(0, Math.min(100, Number(g.score || 0)))}%"></div></div>
                                </div>`).join('')}
                        </div>
                    </div>
                </div>

                <div class="rounded-xl border bg-card p-4">
                    <div class="flex items-center justify-between gap-3 mb-3">
                        <h3 class="font-semibold">Recommended Actions</h3>
                        <span class="text-xs text-muted-foreground">Generated from real published marks</span>
                    </div>
                    <div id="student-grade-recommendations" class="grid gap-3 md:grid-cols-3">
                        <div class="rounded-lg border bg-background p-3 text-sm text-muted-foreground">Loading real recommendations...</div>
                    </div>
                </div>` : `
                <div class="rounded-xl border bg-card p-8 text-center text-muted-foreground">
                    <p class="font-medium">No records for this exact selection.</p>
                    <p class="text-sm mt-1">Try a different year, term, or assessment type.</p>
                </div>`}
        </div>`;
}


function getGradeColorClass(grade) {
    if (!grade) return 'bg-gray-100 text-gray-700';
    const firstChar = grade.charAt(0).toUpperCase();
    if (firstChar === 'A' || grade === 'EE') return 'bg-green-100 text-green-700';
    if (firstChar === 'B' || grade === 'ME') return 'bg-blue-100 text-blue-700';
    if (firstChar === 'C' || grade === 'AE') return 'bg-yellow-100 text-yellow-700';
    if (firstChar === 'D') return 'bg-orange-100 text-orange-700';
    return 'bg-red-100 text-red-700';
}

function getAttendanceStatusClass(status) {
    switch (status) {
        case 'present': return 'bg-green-100 text-green-700';
        case 'absent': return 'bg-red-100 text-red-700';
        case 'late': return 'bg-yellow-100 text-yellow-700';
        case 'sick': return 'bg-purple-100 text-purple-700';
        default: return 'bg-gray-100 text-gray-700';
    }
}

async function markTaskComplete(taskId) {
    showLoading();
    try {
        await api.homeTasks.complete(taskId, {});
        showToast('✅ Task completed! Points awarded.', 'success');
        await loadStudentHomeTasks();
        // Refresh points display
        const user = getCurrentUser();
        const statsRes = await api.user.getMyStats();
        if (statsRes.data) {
            const pointsEl = document.getElementById('student-points');
            if (pointsEl) pointsEl.textContent = statsRes.data.points || 0;
        }
    } catch (e) {
        showToast(e.message || 'Failed to complete task', 'error');
    } finally {
        hideLoading();
    }
}

// ============ ATTENDANCE SECTION ============
async function renderStudentAttendance() {
    try {
        const data = dashboardData || {};
        const school = getCurrentSchool();
        const attendanceRecords = data.attendance || [];
        
        const total = attendanceRecords.length;
        const present = attendanceRecords.filter(a => a.status === 'present').length;
        const absent = attendanceRecords.filter(a => a.status === 'absent').length;
        const late = attendanceRecords.filter(a => a.status === 'late').length;

        return `
            <div class="space-y-6 animate-fade-in">
                <div class="flex justify-between items-center">
                    <h2 class="text-2xl font-bold">My Attendance</h2>
                    <div class="text-sm text-muted-foreground">${escapeHtml((window.BrandingManager && window.BrandingManager.getDisplayName ? window.BrandingManager.getDisplayName() : ((school && school.status === 'active') ? school.name : 'ShuleAI')))}</div>
                </div>
                <div class="rounded-xl border bg-card p-6">
                    <div class="grid gap-4 md:grid-cols-3">
                        <div class="text-center p-4">
                            <p class="text-sm text-muted-foreground">Present</p>
                            <p class="text-3xl font-bold text-green-600">${present}</p>
                        </div>
                        <div class="text-center p-4">
                            <p class="text-sm text-muted-foreground">Absent</p>
                            <p class="text-3xl font-bold text-red-600">${absent}</p>
                        </div>
                        <div class="text-center p-4">
                            <p class="text-sm text-muted-foreground">Late</p>
                            <p class="text-3xl font-bold text-yellow-600">${late}</p>
                        </div>
                    </div>
                </div>
                <div class="rounded-xl border bg-card overflow-hidden">
                    <div class="p-4 border-b">
                        <h3 class="font-semibold">Attendance History</h3>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="w-full text-sm">
                            <thead class="bg-muted/50">
                                <tr>
                                    <th class="px-4 py-3 text-left font-medium">Date</th>
                                    <th class="px-4 py-3 text-left font-medium">Status</th>
                                    <th class="px-4 py-3 text-left font-medium">Reason</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y" id="attendance-history-body">
                                ${attendanceRecords.length > 0 ? attendanceRecords.slice(0, 20).map(record => {
                                    const status = record.status || 'unknown';
                                    const statusClass = getAttendanceStatusClass(status);
                                    return `
                                        <tr class="hover:bg-accent/50 transition-colors">
                                            <td class="px-4 py-3">${record.date ? formatDate(record.date) : 'N/A'}</td>
                                            <td class="px-4 py-3">
                                                <span class="px-2 py-1 ${statusClass} text-xs rounded-full">${status}</span>
                                            </td>
                                            <td class="px-4 py-3">${escapeHtml(record.reason || '-')}</td>
                                        </tr>
                                    `;
                                }).join('') : `
                                    <tr>
                                        <td colspan="3" class="px-4 py-8 text-center text-muted-foreground">
                                            No attendance records yet
                                        </td>
                                    </tr>
                                `}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        return `<div class="text-center py-12 text-red-500">Error loading attendance: ${error.message}</div>`;
    }
}

// ============ CHAT SECTION ============
let studentReplyTo = null;

function renderStudentChat() {
  return `
    <div class="max-w-4xl mx-auto h-[600px] flex flex-col">
      <div class="flex-1 overflow-y-auto p-4 space-y-3" id="student-chat-messages">
        <div class="text-center text-muted-foreground py-8">Loading messages...</div>
      </div>
      <div id="reply-preview" class="hidden text-xs bg-muted p-2 rounded-lg mb-2 flex justify-between items-center">
        <span id="reply-preview-text"></span>
        <button onclick="cancelStudentReply()" class="text-red-500">✖</button>
      </div>
      <div class="flex gap-2 p-4 border-t">
        <input type="text" id="student-chat-input" placeholder="Type a message..." class="flex-1 rounded-lg border p-2 bg-background">
        <button onclick="sendStudentChatMessage()" class="px-4 py-2 bg-primary text-white rounded-lg">Send</button>
      </div>
    </div>
  `;
}

async function loadStudentChatMessages() {
  const container = document.getElementById('student-chat-messages');
  if (!container) return;
  try {
    const res = await api.student.getGroupMessages();
    const messages = res.data || [];
    const currentUser = getCurrentUser();

    container.innerHTML = messages.map(msg => {
      const isSent = msg.senderId === currentUser.id;
      return `
        <div class="flex ${isSent ? 'justify-end' : 'justify-start'} group relative">
          <div class="${isSent ? 'chat-bubble-sent' : 'chat-bubble-received'} max-w-[70%]">
            ${msg.replyToMessageId ? `<div class="text-xs border-l-2 border-primary pl-2 mb-1 italic text-muted-foreground">Replying to a message</div>` : ''}
            ${!isSent ? `<p class="text-xs font-medium">${escapeHtml(msg.Sender?.name)}</p>` : ''}
            <p class="text-sm">${escapeHtml(msg.content)}</p>
            <p class="text-xs text-muted-foreground mt-1">${timeAgo(msg.createdAt)}</p>
          </div>
          <button onclick="setStudentReply(${msg.id}, '${escapeHtml(msg.content.substring(0, 30))}')" class="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 bg-primary text-white rounded-full p-1 text-xs">↩️</button>
        </div>
      `;
    }).join('') || '<div class="text-center text-muted-foreground py-8">No messages yet</div>';

    container.scrollTop = container.scrollHeight;
  } catch (e) {
    container.innerHTML = '<div class="text-red-500 text-center py-8">Failed to load messages</div>';
  }
}

function setStudentReply(messageId, contentPreview) {
  studentReplyTo = { id: messageId, content: contentPreview };
  document.getElementById('reply-preview-text').textContent = `Replying to: ${contentPreview}...`;
  document.getElementById('reply-preview').classList.remove('hidden');
}

function cancelStudentReply() {
  studentReplyTo = null;
  document.getElementById('reply-preview').classList.add('hidden');
}

async function sendStudentChatMessage() {
  const input = document.getElementById('student-chat-input');
  const content = input.value.trim();
  if (!content) return;

  const data = { content };
  if (studentReplyTo) {
    data.replyToId = studentReplyTo.id;
  }

  try {
    await api.student.sendGroupMessage(data);
    input.value = '';
    cancelStudentReply();
    await loadStudentChatMessages();
  } catch (e) {
    showToast(e.message, 'error');
  }
}

// ============ AI TUTOR ============
function renderStudentAITutor() {
    const curriculum = schoolSettings.curriculum || 'cbc';
    const context = v66GetStudentTutorContext();
    setTimeout(() => v66LoadStudentTutorContext(), 0);

    return `
        <div class="max-w-6xl mx-auto space-y-6 animate-fade-in">
            <div class="flex flex-wrap justify-between items-center gap-3">
                <div>
                    <h2 class="text-2xl font-bold">Enhanced AI Tutor</h2>
                    <p class="text-sm text-muted-foreground">The tutor now identifies the learner from the student dashboard and adjusts to their class level automatically.</p>
                </div>
                <div class="rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground" id="ai-student-level-badge">
                    ${escapeHtml(context.displayText)}
                </div>
            </div>

            <div class="rounded-xl border bg-card p-4 space-y-4">
                <div class="flex items-center gap-3 pb-3 border-b">
                    <div class="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                        <i data-lucide="bot" class="h-6 w-6 text-white"></i>
                    </div>
                    <div>
                        <h3 class="font-semibold text-lg">Shule AI Tutor</h3>
                        <p class="text-xs text-muted-foreground" id="ai-tutor-context-line">Curriculum: ${CURRICULUMS[curriculum]?.name || 'CBC'} • ${escapeHtml(context.displayText)}</p>
                    </div>
                </div>

                <div class="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                    <label class="space-y-1">
                        <span class="text-xs font-semibold text-muted-foreground">Subject</span>
                        <select id="ai-subject-select" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"></select>
                    </label>
                    <label class="space-y-1">
                        <span class="text-xs font-semibold text-muted-foreground">Tutor Mode</span>
                        <select id="ai-command-select" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                            <option value="ask">Auto detect</option>
                            <option value="explain">Explain</option>
                            <option value="solve">Solve</option>
                            <option value="quiz">Quiz me</option>
                            <option value="summarize">Summarize</option>
                            <option value="revise">Revision</option>
                            <option value="homework">Give homework</option>
                            <option value="weakness">Show weak areas</option>
                            <option value="plan">Study plan</option>
                        </select>
                    </label>
                    <button onclick="loadTutorProgress()" class="self-end rounded-lg border px-3 py-2 text-sm hover:bg-accent">Load Progress</button>
                </div>

                <div class="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
                    <b class="text-foreground">Try:</b> “explain fractions”, “quiz me in science”, “summarize nouns”, “make revision plan”, “show my weak areas”.
                </div>
                <div id="ai-progress-panel" class="text-xs space-y-2"></div>

                <div class="h-[520px] flex flex-col">
                    <div class="flex-1 overflow-y-auto space-y-4 mb-4 p-4 bg-muted/20 rounded-lg" id="ai-chat-container">
                        <div class="flex justify-start">
                            <div class="chat-bubble-received max-w-[80%]">
                                <p class="text-sm">Hi! I’ll use your registered class/grade from the student dashboard, then adjust subjects and explanations to your level.</p>
                            </div>
                        </div>
                    </div>
                    <div class="flex flex-wrap gap-2 mb-2">
                        ${['Explain this', 'Quiz me', 'Summarize topic', 'Revision plan', 'Give homework', 'Show weak areas'].map(label => `<button onclick="fillTutorCommand('${label}')" class="text-xs rounded-full border px-3 py-1 hover:bg-accent">${label}</button>`).join('')}
                    </div>
                    <div class="flex gap-2">
                        <input type="text" id="ai-question-input" placeholder="Ask me anything or type a command..." class="flex-1 rounded-lg border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary" onkeydown="if(event.key==='Enter'){askAITutor()}">
                        <button onclick="askAITutor()" class="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 flex items-center gap-2">
                            <i data-lucide="send" class="h-4 w-4"></i>
                            Ask
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function v66GetStudentTutorContext() {
    const user = (typeof getCurrentUser === 'function') ? getCurrentUser() : {};
    const saved = window.v66StudentTutorContext || {};
    const detectedGrade = saved.grade || saved.gradeLevel || saved.className || saved.class || user.grade || user.gradeLevel || user.class || user.className || 'Grade 5';
    const grade = (!detectedGrade || String(detectedGrade).toLowerCase() === 'not assigned') ? 'Grade 5' : detectedGrade;
    const level = v66TutorLevelFromGrade(grade);
    return {
        ...saved,
        grade,
        gradeLevel: grade,
        level,
        studentId: saved.studentId || user.studentId || null,
        curriculum: saved.curriculum || schoolSettings.curriculum || 'cbc',
        displayText: grade && grade !== 'Not assigned' ? `Level: ${grade}` : 'Detecting learner level...'
    };
}

function v66TutorLevelFromGrade(gradeText = '') {
    const raw = String(gradeText || '').toLowerCase();
    if (/pp\s?1|pp\s?2|pre|kg|grade\s?[1-3]\b|class\s?[1-3]\b/.test(raw)) return 'early_years';
    if (/grade\s?[4-6]\b|class\s?[4-6]\b|std\s?[4-6]\b|standard\s?[4-6]\b/.test(raw)) return 'upper_primary';
    if (/grade\s?[7-9]\b|junior|jss|class\s?[7-8]\b/.test(raw)) return 'junior_secondary';
    if (/grade\s?1[0-2]\b|form\s?[1-4]\b|senior|secondary/.test(raw)) return 'senior_school';
    return 'upper_primary';
}

async function v66LoadStudentTutorContext() {
    try {
        const res = await (api?.student?.getDashboard ? api.student.getDashboard() : apiRequest('/api/student/dashboard'));
        const data = res.data || {};
        const student = data.student || {};
        window.v66StudentTutorContext = {
            studentId: student.studentId || data.studentId || student.id || null,
            grade: student.grade || student.gradeLevel || data.grade || data.gradeLevel || student.className || student.class || 'Grade 5',
            gradeLevel: student.gradeLevel || student.grade || data.gradeLevel || data.grade || student.className || student.class || 'Grade 5',
            classId: student.classId || data.classId || null,
            curriculum: student.curriculum || data.school?.curriculum || schoolSettings.curriculum || 'cbc',
            academicStatus: student.academicStatus || null
        };
        const ctx = v66GetStudentTutorContext();
        const badge = document.getElementById('ai-student-level-badge');
        if (badge) badge.textContent = ctx.displayText;
        const line = document.getElementById('ai-tutor-context-line');
        if (line) line.textContent = `Curriculum: ${(CURRICULUMS[ctx.curriculum]?.name || ctx.curriculum || 'CBC')} • ${ctx.displayText}`;
        updateTutorSubjects();
    } catch (error) {
        console.warn('Could not load student tutor context:', error.message);
        updateTutorSubjects();
    }
}

const SHULE_TUTOR_SUBJECTS = {
    early_years: ['Literacy', 'Kiswahili Language Activities', 'English Language Activities', 'Mathematical Activities', 'Environmental Activities', 'Creative Activities', 'Religious Education', 'Psychomotor Activities'],
    upper_primary: ['Mathematics', 'English', 'Kiswahili', 'Science and Technology', 'Agriculture and Nutrition', 'Social Studies', 'Creative Arts', 'Religious Education', 'Physical and Health Education'],
    junior_secondary: ['Mathematics', 'English', 'Kiswahili', 'Integrated Science', 'Health Education', 'Pre-Technical Studies', 'Social Studies', 'Religious Education', 'Business Studies', 'Agriculture', 'Life Skills Education', 'Sports and Physical Education', 'Computer Science', 'Visual Arts', 'Performing Arts', 'Home Science', 'Foreign Languages'],
    senior_school: ['Mathematics', 'English', 'Kiswahili', 'Biology', 'Chemistry', 'Physics', 'History and Government', 'Geography', 'CRE', 'IRE', 'Business Studies', 'Agriculture', 'Computer Studies', 'Home Science', 'Art and Design', 'Music', 'Physical Education']
};

function updateTutorSubjects() {
    const ctx = v66GetStudentTutorContext();
    const level = ctx.level || 'upper_primary';
    const select = document.getElementById('ai-subject-select');
    if (!select) return;
    const previous = select.value;
    select.innerHTML = (SHULE_TUTOR_SUBJECTS[level] || SHULE_TUTOR_SUBJECTS.upper_primary).map(s => `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join('');
    if (previous && [...select.options].some(opt => opt.value === previous)) select.value = previous;
}

function fillTutorCommand(label) {
    const input = document.getElementById('ai-question-input');
    if (!input) return;
    const subject = document.getElementById('ai-subject-select')?.value || 'Mathematics';
    const map = {
        'Explain this': `Explain ${subject} in simple steps`,
        'Quiz me': `Quiz me in ${subject}`,
        'Summarize topic': `Summarize a key topic in ${subject}`,
        'Revision plan': `Make a revision plan for ${subject}`,
        'Give homework': `Give homework for ${subject}`,
        'Show weak areas': `Show my weak areas in ${subject}`
    };
    input.value = map[label] || label;
    input.focus();
}

setTimeout(updateTutorSubjects, 0);

function renderStudentSchedule() {
    const school = getCurrentSchool();
    
    return `
        <div class="space-y-6 animate-fade-in">
            <div class="flex justify-between items-center">
                <h2 class="text-2xl font-bold">My Schedule</h2>
                <div class="text-sm text-muted-foreground">${escapeHtml((window.BrandingManager && window.BrandingManager.getDisplayName ? window.BrandingManager.getDisplayName() : ((school && school.status === 'active') ? school.name : 'ShuleAI')))}</div>
            </div>
            <div class="rounded-xl border bg-card p-6">
                <h3 class="font-semibold mb-4">Today's Classes</h3>
                <div class="space-y-3">
                    <div class="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                        <div>
                            <p class="font-medium">Mathematics</p>
                            <p class="text-sm text-muted-foreground">Mr. Kamau • Room 101</p>
                        </div>
                        <span class="text-sm font-medium">8:00 AM - 9:30 AM</span>
                    </div>
                    <div class="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                        <div>
                            <p class="font-medium">English</p>
                            <p class="text-sm text-muted-foreground">Ms. Atieno • Room 203</p>
                        </div>
                        <span class="text-sm font-medium">10:00 AM - 11:30 AM</span>
                    </div>
                    <div class="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                        <div>
                            <p class="font-medium">Science</p>
                            <p class="text-sm text-muted-foreground">Mr. Omondi • Lab 1</p>
                        </div>
                        <span class="text-sm font-medium">12:00 PM - 1:30 PM</span>
                    </div>
                </div>
            </div>
            <div class="rounded-xl border bg-card p-6">
                <h3 class="font-semibold mb-4">Upcoming Exams</h3>
                <div class="space-y-3">
                    <div class="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                            <p class="font-medium">Mathematics Mid-term</p>
                            <p class="text-sm text-muted-foreground">Topics: Algebra, Calculus</p>
                        </div>
                        <span class="px-3 py-1 bg-red-100 text-red-700 text-xs rounded-full">in 3 days</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// ============ GAMIFICATION SECTIONS ============

async function renderStudentLeaderboard() {
    try {
        const dashboardRes = await api.student.getDashboard();
        const classId = dashboardRes.data?.classId;
        if (!classId) return '<div class="text-center py-12">Could not determine class</div>';
        const res = await apiRequest(`/api/gamification/leaderboard/${classId}`);
        const list = res.data || [];
        return `
            <div class="space-y-6 animate-fade-in">
                <h2 class="text-2xl font-bold">Class Leaderboard</h2>
                <div class="space-y-2">
                    ${list.length === 0 ? '<p class="text-center text-muted-foreground">No data</p>' :
                      list.map(item => `
                        <div class="flex justify-between items-center p-2 border rounded">
                            <span>#${item.rank} ${escapeHtml(item.name)}</span>
                            <span class="font-bold">${item.points} pts</span>
                        </div>
                      `).join('')}
                </div>
            </div>`;
    } catch (e) {
        return '<div class="text-red-500">Error loading leaderboard</div>';
    }
}

async function renderStudentBadges() {
    try {
        const dashboardRes = await api.student.getDashboard();
        const studentId = dashboardRes.data?.student?.id;
        if (!studentId) return '<div class="text-center py-12">Student not found</div>';
        const res = await apiRequest(`/api/gamification/badges/${studentId}`);
        const badges = res.data || [];
        return `
            <div class="space-y-6 animate-fade-in">
                <h2 class="text-2xl font-bold">My Badges</h2>
                <div class="flex flex-wrap gap-2">
                    ${badges.length === 0 ? '<p class="text-muted-foreground">No badges yet</p>' :
                      badges.map(b => `
                        <span class="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">${b.Badge?.icon || '🏅'} ${b.Badge?.name}</span>
                      `).join('')}
                </div>
            </div>`;
    } catch (e) {
        return '<div class="text-red-500">Error loading badges</div>';
    }
}

function v66RewardPercent(value) {
    return value === null || value === undefined || value === '' ? '—' : `${Number(value)}%`;
}

function v66RewardStatusClass(earned) {
    return earned ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200';
}

async function renderRewardsStore() {
    try {
        const res = await apiRequest('/api/gamification/my-summary');
        const data = res.data || {};
        const summary = data.summary || {};
        const badges = Array.isArray(data.badges) ? data.badges : [];
        const events = Array.isArray(data.recentEvents) ? data.recentEvents : [];
        const actions = Array.isArray(data.actions) ? data.actions : [];

        return `
            <div class="space-y-6 animate-fade-in student-rewards-section">
                <div class="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <p class="text-sm text-muted-foreground">Student motivation</p>
                        <h2 class="text-2xl font-bold">My Rewards</h2>
                        <p class="text-sm text-muted-foreground">Rewards are calculated from real attendance, homework, published marks, and teacher-awarded participation.</p>
                    </div>
                    <div class="rounded-2xl border bg-card p-4 text-center shadow-sm">
                        <p class="text-xs uppercase tracking-wide text-muted-foreground">Total Points</p>
                        <p class="text-3xl font-black">${Number(summary.totalPoints || 0)}</p>
                    </div>
                </div>

                <div class="grid gap-4 md:grid-cols-4">
                    <div class="rounded-2xl border bg-card p-4 shadow-sm">
                        <p class="text-sm text-muted-foreground">Attendance</p>
                        <p class="text-2xl font-black">${v66RewardPercent(summary.attendanceRate)}</p>
                    </div>
                    <div class="rounded-2xl border bg-card p-4 shadow-sm">
                        <p class="text-sm text-muted-foreground">Homework</p>
                        <p class="text-2xl font-black">${v66RewardPercent(summary.homeworkRate)}</p>
                    </div>
                    <div class="rounded-2xl border bg-card p-4 shadow-sm">
                        <p class="text-sm text-muted-foreground">Average Score</p>
                        <p class="text-2xl font-black">${v66RewardPercent(summary.averageScore)}</p>
                    </div>
                    <div class="rounded-2xl border bg-card p-4 shadow-sm">
                        <p class="text-sm text-muted-foreground">Badges Earned</p>
                        <p class="text-2xl font-black">${Number(summary.earnedBadges || 0)}/${Number(summary.availableBadges || badges.length || 0)}</p>
                    </div>
                </div>

                <div class="grid gap-4 lg:grid-cols-5">
                    <div class="lg:col-span-3 rounded-2xl border bg-card p-5 shadow-sm">
                        <div class="flex items-center justify-between gap-3 mb-4">
                            <div>
                                <h3 class="text-lg font-bold">Real Achievement Badges</h3>
                                <p class="text-sm text-muted-foreground">No mock rewards. Locked badges show exactly what is missing.</p>
                            </div>
                        </div>
                        <div class="grid gap-3 md:grid-cols-2">
                            ${badges.length ? badges.map(b => `
                                <div class="rounded-2xl border p-4 ${b.earned ? 'ring-1 ring-emerald-300 dark:ring-emerald-700' : ''}">
                                    <div class="flex items-start justify-between gap-3">
                                        <div class="flex items-start gap-3">
                                            <div class="text-3xl">${escapeHtml(b.icon || '🏅')}</div>
                                            <div>
                                                <h4 class="font-bold">${escapeHtml(b.title || 'Reward')}</h4>
                                                <p class="text-xs text-muted-foreground">${escapeHtml(b.category || 'Achievement')}</p>
                                            </div>
                                        </div>
                                        <span class="rounded-full px-2.5 py-1 text-xs font-semibold ${v66RewardStatusClass(b.earned)}">${escapeHtml(b.label || (b.earned ? 'Earned' : 'Locked'))}</span>
                                    </div>
                                    <p class="mt-3 text-sm text-muted-foreground">${escapeHtml(b.description || '')}</p>
                                    <p class="mt-3 text-sm font-bold">${Number(b.points || 0)} pts</p>
                                </div>
                            `).join('') : '<div class="rounded-xl border p-4 text-sm text-muted-foreground md:col-span-2">Rewards will appear after attendance, homework, marks, or teacher participation records are available.</div>'}
                        </div>
                    </div>

                    <div class="lg:col-span-2 space-y-4">
                        <div class="rounded-2xl border bg-card p-5 shadow-sm">
                            <h3 class="text-lg font-bold">Recommended Next Actions</h3>
                            <div class="mt-3 space-y-2">
                                ${actions.length ? actions.map(a => `
                                    <div class="rounded-xl border p-3 text-sm">${escapeHtml(a)}</div>
                                `).join('') : '<div class="rounded-xl border p-3 text-sm text-muted-foreground">No reward recommendations yet. They will appear after real student activity is recorded.</div>'}
                            </div>
                        </div>

                        <div class="rounded-2xl border bg-card p-5 shadow-sm">
                            <h3 class="text-lg font-bold">Teacher-Awarded Participation</h3>
                            <div class="mt-3 space-y-2">
                                ${events.length ? events.map(e => `
                                    <div class="rounded-xl border p-3">
                                        <div class="flex justify-between gap-2">
                                            <strong class="text-sm">${escapeHtml(e.title || 'Achievement')}</strong>
                                            <span class="text-sm font-bold">+${Number(e.points || 0)} pts</span>
                                        </div>
                                        <p class="text-xs text-muted-foreground">${escapeHtml(e.note || 'Teacher-awarded achievement')}</p>
                                    </div>
                                `).join('') : '<div class="rounded-xl border p-3 text-sm text-muted-foreground">No teacher-awarded participation yet. Join study discussions and answer questions to earn points.</div>'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
    } catch (e) {
        return `<div class="rounded-lg border p-4 text-muted-foreground">Rewards are temporarily unavailable. Your points are safe; try again after backend sync. ${escapeHtml(e.message || '')}</div>`;
    }
}

async function redeemReward(rewardId) {
    showToast('Reward redemption is not enabled for rollout yet. Rewards currently track real school progress only.', 'info');
}

// ============ HOMEWORK SECTION ============
async function renderStudentHomework() {
    try {
        const res = await apiRequest('/api/homework/student');
        const assignments = Array.isArray(res.data) ? res.data : [];
        window.v66StudentHomework = assignments.map(v66NormalizeHomeworkAssignment);
        window.v66StudentHomeworkTab = window.v66StudentHomeworkTab || 'all';

        return `
            <div class="space-y-6 animate-fade-in student-homework-section">
                <div class="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h2 class="text-2xl font-bold">My Homework</h2>
                        <p class="text-sm text-muted-foreground">Track pending, submitted, late, and graded assignments in one place.</p>
                    </div>
                    <div class="text-xs text-muted-foreground">${v66HomeworkCompletionText(window.v66StudentHomework)}</div>
                </div>

                <div class="grid gap-4 md:grid-cols-4">
                    ${v66HomeworkStatCard('Pending', window.v66StudentHomework.filter(a => a.smartStatus === 'pending').length, 'clock')}
                    ${v66HomeworkStatCard('Submitted', window.v66StudentHomework.filter(a => a.smartStatus === 'submitted').length, 'check-circle')}
                    ${v66HomeworkStatCard('Late', window.v66StudentHomework.filter(a => a.smartStatus === 'late').length, 'alert-triangle')}
                    ${v66HomeworkStatCard('Graded', window.v66StudentHomework.filter(a => a.smartStatus === 'graded').length, 'star')}
                </div>

                <div class="rounded-xl border bg-card p-2 flex gap-2 overflow-x-auto">
                    ${['all','pending','submitted','late','graded'].map(tab => `
                        <button onclick="v66SetHomeworkTab('${tab}')" id="homework-tab-${tab}" class="px-4 py-2 rounded-lg text-sm font-medium ${window.v66StudentHomeworkTab === tab ? 'bg-primary text-white' : 'hover:bg-accent text-muted-foreground'}">
                            ${tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>`).join('')}
                </div>

                <div id="student-homework-list">
                    ${v66RenderHomeworkList(window.v66StudentHomework, window.v66StudentHomeworkTab)}
                </div>
            </div>`;
    } catch (e) {
        return `<div class="rounded-lg border p-4 text-muted-foreground">Homework could not load yet. Ask your teacher to confirm it was assigned to your class/student account.<br><span class="text-xs">${escapeHtml(e.message || '')}</span></div>`;
    }
}

function v66NormalizeHomeworkAssignment(assignment) {
    const task = assignment.HomeTask || assignment.homeTask || assignment.task || assignment.homeTaskData || assignment;
    const dueRaw = task.dueDate || assignment.dueDate || assignment.deadline || null;
    const due = dueRaw ? new Date(dueRaw) : null;
    const status = String(assignment.status || task.status || 'pending').toLowerCase();
    const isLate = due && !isNaN(due) && due < new Date() && !['submitted','graded','completed'].includes(status);
    const smartStatus = status === 'graded' ? 'graded' : (['submitted','completed'].includes(status) ? 'submitted' : (isLate ? 'late' : 'pending'));
    return {
        id: assignment.id || assignment.assignmentId || task.id,
        taskId: task.id,
        title: task.title || 'Untitled Homework',
        instructions: task.instructions || task.description || assignment.instructions || '',
        subject: task.subject || task.Subject?.name || 'General',
        teacher: task.teacherName || assignment.teacherName || task.Teacher?.User?.name || task.teacher || 'Not assigned',
        dueDate: dueRaw,
        assignedAt: assignment.assignedAt || task.createdAt || task.assignedAt,
        status,
        smartStatus,
        feedback: assignment.studentFeedback || assignment.feedback || null,
        teacherComment: assignment.teacherComment || assignment.remark || '',
        score: assignment.score ?? assignment.marks ?? null,
        attachments: Array.isArray(task.attachments) ? task.attachments : (Array.isArray(assignment.attachments) ? assignment.attachments : [])
    };
}

function v66HomeworkStatCard(label, value, icon) {
    return `
        <div class="rounded-xl border bg-card p-4">
            <div class="flex items-center justify-between">
                <div><p class="text-xs text-muted-foreground">${label}</p><h3 class="text-2xl font-bold mt-1">${value}</h3></div>
                <i data-lucide="${icon}" class="h-5 w-5 text-muted-foreground"></i>
            </div>
        </div>`;
}

function v66HomeworkCompletionText(assignments) {
    if (!assignments.length) return 'No assignments yet';
    const done = assignments.filter(a => ['submitted','graded'].includes(a.smartStatus)).length;
    return `${done}/${assignments.length} completed`;
}

function v66SetHomeworkTab(tab) {
    window.v66StudentHomeworkTab = tab;
    ['all','pending','submitted','late','graded'].forEach(t => {
        const btn = document.getElementById(`homework-tab-${t}`);
        if (!btn) return;
        btn.className = `px-4 py-2 rounded-lg text-sm font-medium ${t === tab ? 'bg-primary text-white' : 'hover:bg-accent text-muted-foreground'}`;
    });
    const target = document.getElementById('student-homework-list');
    if (target) target.innerHTML = v66RenderHomeworkList(window.v66StudentHomework || [], tab);
    if (window.lucide) lucide.createIcons();
}

function v66RenderHomeworkList(assignments, tab = 'all') {
    const filtered = tab === 'all' ? assignments : assignments.filter(a => a.smartStatus === tab);
    if (!assignments.length) {
        return `
            <div class="rounded-xl border bg-card p-8 text-center text-muted-foreground">
                <i data-lucide="book-open" class="h-10 w-10 mx-auto mb-3 opacity-70"></i>
                <p class="font-medium">No homework assigned yet.</p>
                <p class="text-sm mt-1">Assignments from your teachers will appear here.</p>
            </div>`;
    }
    if (!filtered.length) {
        return `<div class="rounded-xl border bg-card p-8 text-center text-muted-foreground">No ${escapeHtml(tab)} homework right now.</div>`;
    }
    return `
        <div class="grid gap-4 lg:grid-cols-2">
            ${filtered.map(a => v66RenderHomeworkCard(a)).join('')}
        </div>`;
}


function v66SafeHomeworkFileUrl(rawUrl) {
    const raw = String(rawUrl || '').trim();
    if (!raw) return '';
    const resolved = typeof resolveMediaUrl === 'function' ? resolveMediaUrl(raw) : raw;
    if (!/^https?:\/\//i.test(resolved) && !resolved.startsWith('/uploads/')) return '';
    return resolved.replace(/"/g, '%22').replace(/</g, '%3C').replace(/>/g, '%3E');
}

function v66RenderStudentHomeworkAttachments(attachments = []) {
    const files = Array.isArray(attachments) ? attachments : [];
    if (!files.length) return '<p class="text-muted-foreground mt-1">No assignment file was uploaded.</p>';
    return `<div class="space-y-2 mt-2">${files.map((file, index) => {
        const url = v66SafeHomeworkFileUrl(file.downloadUrl || file.secureUrl || file.url || '');
        const name = escapeHtml(file.name || `Assignment file ${index + 1}`);
        const actions = url ? `<a href="${url}" target="_blank" rel="noopener noreferrer" class="px-3 py-1 rounded-lg border text-xs hover:bg-accent">View</a><a href="${url}" download class="px-3 py-1 rounded-lg bg-primary text-white text-xs">Download</a>` : '<span class="text-xs text-red-500">File unavailable</span>';
        return `<div class="flex items-center justify-between gap-3 rounded-lg border p-3 bg-background"><div class="min-w-0"><p class="font-medium truncate">${name}</p><p class="text-xs text-muted-foreground">${escapeHtml(file.mimeType || 'file')}</p></div><div class="flex gap-2 shrink-0">${actions}</div></div>`;
    }).join('')}</div>`;
}

function v66RenderHomeworkCard(a) {
    const statusClass = a.smartStatus === 'late' ? 'bg-red-100 text-red-700' : a.smartStatus === 'submitted' ? 'bg-blue-100 text-blue-700' : a.smartStatus === 'graded' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700';
    const dueText = a.dueDate ? formatDate(a.dueDate) : 'No due date';
    const canSubmit = !['submitted','graded'].includes(a.smartStatus);
    return `
        <div class="rounded-xl border bg-card p-4 space-y-4 homework-card" id="homework-card-${a.id}">
            <div class="flex items-start justify-between gap-3">
                <div>
                    <p class="text-xs font-semibold text-primary uppercase tracking-wide">${escapeHtml(a.subject)}</p>
                    <h3 class="text-lg font-bold mt-1">${escapeHtml(a.title)}</h3>
                    <p class="text-xs text-muted-foreground mt-1">Teacher: ${escapeHtml(a.teacher)} • Due: ${escapeHtml(dueText)}</p>
                </div>
                <span class="px-2 py-1 rounded-full text-xs font-medium ${statusClass}">${escapeHtml(a.smartStatus)}</span>
            </div>

            ${a.instructions ? `<p class="text-sm text-muted-foreground line-clamp-2">${escapeHtml(a.instructions)}</p>` : '<p class="text-sm text-muted-foreground">No written instructions were attached to this homework.</p>'}

            <div class="rounded-lg bg-muted/40 p-3 text-xs">
                <p class="font-medium mb-1">Recommended next step</p>
                <p class="text-muted-foreground">${escapeHtml(v66HomeworkRecommendation(a))}</p>
            </div>

            <div class="flex flex-wrap gap-2">
                <button onclick="v66ToggleHomeworkDetails('${a.id}')" class="px-3 py-2 rounded-lg border text-sm hover:bg-accent">View Details</button>
                ${canSubmit ? `<button onclick="submitHomework(${a.id})" class="px-3 py-2 rounded-lg bg-primary text-white text-sm">Submit Homework</button>` : ''}
            </div>

            <div id="homework-details-${a.id}" class="hidden border-t pt-3 text-sm space-y-3">
                <div>
                    <p class="font-semibold">Instructions</p>
                    <p class="text-muted-foreground mt-1 whitespace-pre-line">${escapeHtml(a.instructions || 'No written instructions were attached to this homework.')}</p>
                </div>
                <div><p class="font-semibold">Assignment File / Materials</p>${v66RenderStudentHomeworkAttachments(a.attachments || [])}</div>
                ${a.teacherComment ? `<div><p class="font-semibold">Teacher Comment</p><p class="text-muted-foreground mt-1">${escapeHtml(a.teacherComment)}</p></div>` : ''}
                ${a.score !== null ? `<div><p class="font-semibold">Score</p><p class="text-muted-foreground mt-1">${escapeHtml(String(a.score))}</p></div>` : ''}
                <div class="text-xs text-muted-foreground">Assigned: ${a.assignedAt ? formatDate(a.assignedAt) : 'N/A'}</div>
            </div>
        </div>`;
}

function v66ToggleHomeworkDetails(id) {
    const el = document.getElementById(`homework-details-${id}`);
    if (el) el.classList.toggle('hidden');
}

function v66HomeworkRecommendation(a) {
    if (a.smartStatus === 'late') return `Submit ${a.subject} as soon as possible, then ask your teacher if corrections are allowed.`;
    if (a.smartStatus === 'submitted') return `Wait for teacher feedback, then review corrections when it is returned.`;
    if (a.smartStatus === 'graded') return `Review your score and teacher comment before the next ${a.subject} task.`;
    return `Start with the instructions, finish the main task, then submit before the due date.`;
}

async function submitHomework(assignmentId) {
    const comment = prompt('Any comments?');
    showLoading();
    try {
        await apiRequest(`/api/homework/submit/${assignmentId}`, { method: 'POST', body: JSON.stringify({ comment }) });
        hideLoading();
        showToast('Submitted', 'success');
        showDashboardSection('my-homework');
    } catch (e) {
        hideLoading();
        showToast(e.message, 'error');
    }
}

// ============ HELPERS ============
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

window.sendStudentMessage = function() {
    const input = document.getElementById('chat-message-input');
    const message = input?.value.trim();
    if (!message) return;
    const container = document.getElementById('chat-messages-container');
    if (container) {
        container.innerHTML += `
            <div class="flex justify-end">
                <div class="chat-bubble-sent max-w-[70%]">
                    <p class="text-sm font-medium">You</p>
                    <p class="text-sm">${escapeHtml(message)}</p>
                    <p class="text-xs text-muted-foreground mt-1">just now</p>
                </div>
            </div>
        `;
        container.scrollTop = container.scrollHeight;
    }
    input.value = '';
};

window.askAITutor = async function() {
    const input = document.getElementById('ai-question-input');
    const question = input?.value.trim();
    if (!question) return;
    const container = document.getElementById('ai-chat-container');
    if (!container) return;
    const subject = document.getElementById('ai-subject-select')?.value || undefined;
    const command = document.getElementById('ai-command-select')?.value || 'ask';
    const tutorContext = v66GetStudentTutorContext();

    container.innerHTML += `
        <div class="flex justify-end">
            <div class="chat-bubble-sent max-w-[75%]">
                <p class="text-sm font-medium">You</p>
                <p class="text-sm">${escapeHtml(question)}</p>
                <p class="text-xs text-muted-foreground mt-1">just now</p>
            </div>
        </div>
    `;
    container.scrollTop = container.scrollHeight;
    input.value = '';

    const typingDiv = document.createElement('div');
    typingDiv.className = 'flex justify-start';
    typingDiv.innerHTML = `<div class="chat-bubble-received"><p class="text-sm text-muted-foreground">Shule AI Tutor is thinking...</p></div>`;
    container.appendChild(typingDiv);
    container.scrollTop = container.scrollHeight;

    try {
        const res = await api.tutor.ask({
            question,
            subject,
            command: command === 'ask' ? undefined : command,
            level: tutorContext.level || 'upper_primary',
            grade: tutorContext.grade || 'Grade 5',
            gradeLevel: tutorContext.gradeLevel || tutorContext.grade || 'Grade 5',
            studentId: tutorContext.studentId || undefined,
            curriculum: tutorContext.curriculum || undefined
        });
        typingDiv.remove();
        const data = res.data || {};
        container.innerHTML += `
            <div class="flex justify-start">
                <div class="chat-bubble-received max-w-[82%]">
                    <p class="text-sm font-medium">AI Tutor <span class="text-xs text-muted-foreground">• ${escapeHtml(data.subject || subject || 'Subject')} • ${escapeHtml(data.command || 'ask')}</span></p>
                    <p class="text-sm whitespace-pre-line mt-1"><b>${escapeHtml(data.answer || 'Answer')}</b></p>
                    <p class="text-sm whitespace-pre-line mt-2">${escapeHtml(data.explanation || '')}</p>
                    ${data.nextQuestion ? `<div class="mt-3 rounded-lg bg-muted/40 p-2 text-sm"><b>Next:</b> ${escapeHtml(data.nextQuestion)}</div>` : ''}
                    ${data.usage ? `<p class="text-xs text-muted-foreground mt-2">Today: ${data.usage.used}/${data.usage.limit} tutor questions used.</p>` : ''}
                </div>
            </div>
        `;
        container.scrollTop = container.scrollHeight;
    } catch (error) {
        typingDiv.remove();
        container.innerHTML += `<div class="flex justify-start"><div class="chat-bubble-received max-w-[80%]"><p class="text-sm text-red-600">${escapeHtml(error.message || 'Tutor could not answer right now.')}</p></div></div>`;
    }
};

window.loadTutorProgress = async function() {
    const panel = document.getElementById('ai-progress-panel');
    if (!panel) return;
    panel.innerHTML = '<p class="text-muted-foreground">Loading progress...</p>';
    try {
        const tutorContext = v66GetStudentTutorContext();
        const res = await api.tutor.getProgress(tutorContext.studentId || '');
        const rows = res.data || [];
        if (!rows.length) {
            panel.innerHTML = '<p class="text-muted-foreground">No tutor progress yet. Ask your first question.</p>';
            return;
        }
        panel.innerHTML = rows.slice(0, 6).map(r => `<div class="rounded-lg border p-2"><b>${escapeHtml(r.subject)}</b><br><span>${escapeHtml(r.topic)} • ${r.attempts || 0} attempts</span></div>`).join('');
    } catch (e) {
        panel.innerHTML = `<p class="text-red-600">${escapeHtml(e.message)}</p>`;
    }
};

// ============ EXPORT FUNCTIONS ============
window.renderStudentSection = renderStudentSection;
window.renderStudentDashboard = renderStudentDashboard;
window.renderStudentGrades = renderStudentGrades;
window.renderStudentAttendance = renderStudentAttendance;
window.renderStudentChat = renderStudentChat;
window.renderStudentAITutor = renderStudentAITutor;
window.renderStudentSchedule = renderStudentSchedule;
window.renderStudentLeaderboard = renderStudentLeaderboard;
window.renderStudentBadges = renderStudentBadges;
window.renderRewardsStore = renderRewardsStore;
window.renderStudentHomework = renderStudentHomework;
window.redeemReward = redeemReward;
window.submitHomework = submitHomework;
window.loadStudentHomeTasks = loadStudentHomeTasks;
window.markTaskComplete = markTaskComplete;
window.sendStudentMessage = sendStudentMessage;
window.updateTutorSubjects = updateTutorSubjects;
window.fillTutorCommand = fillTutorCommand;
window.setStudentReply = setStudentReply;
window.cancelStudentReply = cancelStudentReply;
window.sendStudentChatMessage = sendStudentChatMessage;
window.loadStudentChatMessages = loadStudentChatMessages;
window.loadDashboardLeaderboard = loadDashboardLeaderboard;
window.loadDashboardBadges = loadDashboardBadges;


// V42 compatibility alias: keep original student homework layout, only satisfy older v12 callers.
window.v12RenderStudentHomework = window.v12RenderStudentHomework || window.renderStudentHomework;

