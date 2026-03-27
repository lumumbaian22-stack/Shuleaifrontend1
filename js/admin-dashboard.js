// admin-dashboard.js - Complete, self-contained version

// ============ FALLBACK DEFINITIONS ============
// Ensure these functions are defined even if admin-approvals.js didn't load
if (typeof window.loadAllTeachers !== 'function') {
    window.loadAllTeachers = async function() {
        try {
            const response = await api.admin.getTeachers();
            return response?.data || [];
        } catch (error) {
            console.error('Failed to load teachers (fallback):', error);
            showToast('Failed to load teachers', 'error');
            return [];
        }
    };
}
if (typeof window.loadPendingTeachers !== 'function') {
    window.loadPendingTeachers = async function() {
        try {
            const response = await api.admin.getPendingApprovals();
            return response?.data?.teachers || [];
        } catch (error) {
            console.error('Failed to load pending teachers (fallback):', error);
            showToast('Failed to load pending teachers', 'error');
            return [];
        }
    };
}
if (typeof window.loadAllStudents !== 'function') {
    window.loadAllStudents = async function() {
        try {
            const response = await api.admin.getStudents();
            return response?.data || [];
        } catch (error) {
            console.error('Failed to load students (fallback):', error);
            return [];
        }
    };
}

// ============ HELP SECTION ============
function renderHelpSection() {
    const user = getCurrentUser();
    const role = user?.role || 'user';
    
    const helpArticles = {
        admin: [
            { title: 'How to add a student', content: 'Go to Students, click Add Student, fill in details.', keywords: ['add', 'student'] },
            { title: 'How to approve a teacher', content: 'Go to Teacher Approvals, review details, click Approve.', keywords: ['teacher', 'approve'] },
            { title: 'How to generate duty roster', content: 'Go to Duty Management, select dates, click Generate Roster.', keywords: ['duty', 'roster'] },
            { title: 'How to change curriculum', content: 'Go to Settings, select new curriculum, click Save.', keywords: ['curriculum'] }
        ]
    };
    const articles = helpArticles[role] || helpArticles.admin;
    
    return `
        <div class="space-y-6 animate-fade-in max-w-5xl mx-auto">
            <div class="text-center">
                <h2 class="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Help Center</h2>
                <p class="text-muted-foreground mt-2">Find answers to common questions</p>
            </div>
            <div class="relative">
                <i data-lucide="search" class="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground"></i>
                <input type="text" id="help-search" placeholder="Search..." onkeyup="searchHelpArticles()" class="w-full pl-10 pr-4 py-3 rounded-xl border bg-card">
            </div>
            <div id="help-articles-container" class="grid gap-4">
                ${articles.map(article => `
                    <div class="help-article rounded-xl border bg-card p-6 hover:shadow-md cursor-pointer" data-title="${article.title.toLowerCase()}" data-content="${article.content.toLowerCase()}" data-keywords="${article.keywords.join(' ').toLowerCase()}" onclick="showHelpArticleDetail('${article.title.replace(/'/g, "\\'")}', '${article.content.replace(/'/g, "\\'")}')">
                        <h3 class="font-semibold text-lg mb-2">📚 ${article.title}</h3>
                        <p class="text-muted-foreground">${article.content.substring(0, 150)}...</p>
                    </div>
                `).join('')}
            </div>
            <div class="rounded-xl border bg-gradient-to-r from-blue-50 to-purple-50 p-6 text-center">
                <h3 class="font-semibold text-lg mb-2">💬 Still Need Help?</h3>
                <button onclick="window.location.href='mailto:support@shuleai.com'" class="px-4 py-2 bg-primary text-white rounded-lg">Email Support</button>
            </div>
        </div>
    `;
}

window.searchHelpArticles = function() {
    const term = document.getElementById('help-search')?.value.toLowerCase().trim();
    const articles = document.querySelectorAll('.help-article');
    if (!term) { articles.forEach(a => a.style.display = 'block'); return; }
    let found = 0;
    articles.forEach(a => {
        const match = (a.dataset.title || '').includes(term) || (a.dataset.content || '').includes(term) || (a.dataset.keywords || '').includes(term);
        a.style.display = match ? 'block' : 'none';
        if (match) found++;
    });
    const container = document.getElementById('help-articles-container');
    let noMsg = document.getElementById('no-results-message');
    if (found === 0 && term) {
        if (!noMsg) {
            noMsg = document.createElement('div');
            noMsg.id = 'no-results-message';
            noMsg.className = 'text-center py-12 col-span-full';
            noMsg.innerHTML = `<i data-lucide="search-x" class="h-12 w-12 mx-auto text-muted-foreground mb-3"></i><p class="text-muted-foreground">No results found for "${term}"</p>`;
            container.appendChild(noMsg);
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }
    } else if (noMsg) noMsg.remove();
};

window.showHelpArticleDetail = function(title, content) {
    let modal = document.getElementById('help-article-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'help-article-modal';
        modal.className = 'fixed inset-0 z-50 hidden';
        modal.innerHTML = `
            <div class="absolute inset-0 bg-black/50" onclick="closeHelpArticleModal()"></div>
            <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md p-4">
                <div class="rounded-xl border bg-card p-6 shadow-xl">
                    <div class="modal-content"></div>
                </div>
            </div>`;
        document.body.appendChild(modal);
    }
    const modalContent = modal.querySelector('.modal-content');
    modalContent.innerHTML = `
        <div class="space-y-4">
            <div class="border-b pb-3"><h3 class="text-xl font-semibold">${title}</h3></div>
            <p class="text-muted-foreground">${content}</p>
            <div class="flex justify-end gap-2 pt-4 border-t">
                <button onclick="closeHelpArticleModal()" class="px-4 py-2 border rounded-lg">Close</button>
            </div>
        </div>`;
    modal.classList.remove('hidden');
    if (typeof lucide !== 'undefined') lucide.createIcons();
};

window.closeHelpArticleModal = function() {
    const modal = document.getElementById('help-article-modal');
    if (modal) modal.classList.add('hidden');
};

// ============ DUTY ROSTER GENERATION ============
window.handleGenerateDutyRoster = async function() {
    const startDate = document.getElementById('duty-start-date')?.value;
    const endDate = document.getElementById('duty-end-date')?.value;
    if (!startDate || !endDate) {
        showToast('Please select start and end dates', 'error');
        return;
    }
    showLoading();
    try {
        const response = await api.admin.generateDutyRoster(startDate, endDate);
        if (response.success) {
            showToast(`✅ Generated ${response.data.rosters?.length || 0} duty rosters`, 'success');
            if (response.data.understaffed?.length > 0) {
                showToast(`⚠️ ${response.data.understaffed.length} understaffed slots`, 'warning');
            }
            await showDashboardSection('duty');
        }
    } catch (error) {
        showToast(error.message || 'Failed to generate duty roster', 'error');
    } finally {
        hideLoading();
    }
};

// ============ RENDER SECTION ============
async function renderAdminSection(section) {
    try {
        switch(section) {
            case 'dashboard': return renderAdminDashboard();
            case 'students': return await renderAdminStudents();
            case 'teachers': return await renderAdminTeachers();
            case 'teacher-approvals': return await renderAdminPendingTeachers();
            case 'classes': return await renderClassManagement();
            case 'duty': return await renderAdminDuty();
            case 'fairness-report': return await renderAdminFairnessReport();
            case 'teacher-workload': return await renderAdminTeacherWorkload();
            case 'settings': return renderAdminSettings();
            case 'custom-subjects': return renderAdminCustomSubjects();
            case 'calendar': return renderAdminCalendar();
            case 'help': return renderHelpSection();
            default: return '<div class="text-center py-12">Section not found</div>';
        }
    } catch (error) {
        return `<div class="text-center py-12 text-red-500">Error loading section: ${error.message}</div>`;
    }
}

function renderAdminDashboard() {
    const school = getCurrentSchool();
    const data = dashboardData || {};
    return `
        <div class="space-y-6 animate-fade-in">
            <div class="rounded-xl border bg-card p-6 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <div class="flex items-center gap-3 mb-2">
                            <h2 class="text-2xl font-bold">${school?.name || 'Your School'}</h2>
                            <span class="px-3 py-1 ${school?.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'} text-xs rounded-full">
                                ${school?.status || 'pending'}
                            </span>
                        </div>
                        <div class="flex items-center gap-4">
                            <p class="text-sm"><span class="font-mono bg-muted px-2 py-1 rounded">Short Code: ${school?.shortCode || 'SHL-XXXXX'}</span></p>
                            <button onclick="showNameChangeModal()" class="text-sm text-primary hover:underline">Change School Name ($50)</button>
                        </div>
                    </div>
                    <div class="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm">
                        <p class="text-xs text-muted-foreground">Share this code with teachers</p>
                        <p class="text-lg font-mono font-bold">${school?.shortCode || 'SHL-XXXXX'}</p>
                    </div>
                </div>
            </div>
            <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div class="rounded-xl border bg-card p-6 card-hover"><div class="flex items-center justify-between"><div><p class="text-sm font-medium text-muted-foreground">Total Students</p><h3 class="text-2xl font-bold mt-1" id="total-students">${data.students?.length || 0}</h3></div><div class="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center"><i data-lucide="users" class="h-6 w-6 text-blue-600"></i></div></div></div>
                <div class="rounded-xl border bg-card p-6 card-hover"><div class="flex items-center justify-between"><div><p class="text-sm font-medium text-muted-foreground">Teachers</p><h3 class="text-2xl font-bold mt-1" id="total-teachers">${data.teachers?.length || 0}</h3><p class="text-xs text-green-600 mt-1">+${data.pendingTeachers?.length || 0} pending</p></div><div class="h-12 w-12 rounded-lg bg-violet-100"><i data-lucide="user-plus" class="h-6 w-6 text-violet-600"></i></div></div></div>
                <div class="rounded-xl border bg-card p-6 card-hover"><div class="flex items-center justify-between"><div><p class="text-sm font-medium text-muted-foreground">Classes</p><h3 class="text-2xl font-bold mt-1" id="total-classes">${data.classes?.length || 0}</h3></div><div class="h-12 w-12 rounded-lg bg-emerald-100"><i data-lucide="book-open" class="h-6 w-6 text-emerald-600"></i></div></div></div>
                <div class="rounded-xl border bg-card p-6 card-hover"><div class="flex items-center justify-between"><div><p class="text-sm font-medium text-muted-foreground">Attendance Rate</p><h3 class="text-2xl font-bold mt-1">94.2%</h3></div><div class="h-12 w-12 rounded-lg bg-amber-100"><i data-lucide="calendar-check" class="h-6 w-6 text-amber-600"></i></div></div></div>
            </div>
            <div class="grid gap-4 lg:grid-cols-2">
                <div class="rounded-xl border bg-card p-6"><h3 class="font-semibold mb-4">Enrollment Trends</h3><div class="chart-container h-64"><canvas id="admin-enrollmentChart"></canvas></div></div>
                <div class="rounded-xl border bg-card p-6"><h3 class="font-semibold mb-4">Grade Distribution</h3><div class="chart-container h-64"><canvas id="admin-gradeChart"></canvas></div></div>
            </div>
        </div>
    `;
}

async function renderAdminStudents() {
    const students = await window.loadAllStudents();
    return `
        <div class="space-y-6 animate-fade-in">
            <div class="flex justify-between items-center"><h2 class="text-2xl font-bold">Student Management</h2><button onclick="showAddStudentModal()" class="px-4 py-2 bg-primary text-white rounded-lg">+ Add Student</button></div>
            <div class="rounded-xl border bg-card overflow-hidden">
                <div class="overflow-x-auto">
                    <table class="w-full text-sm">
                        <thead class="bg-muted/50"><tr><th class="px-4 py-3 text-left">Student</th><th class="px-4 py-3 text-left">ELIMUID</th><th class="px-4 py-3 text-left">Grade</th><th class="px-4 py-3 text-left">Status</th><th class="px-4 py-3 text-center">Actions</th></tr></thead>
                        <tbody class="divide-y" id="students-table-body">
                            ${students.map(s => {
                                const user = s.User || {};
                                return `<tr><td class="px-4 py-3"><div class="flex items-center gap-3"><div class="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center"><span class="font-medium text-blue-700 text-sm">${getInitials(user.name)}</span></div><span class="font-medium">${user.name}</span></div></td>
                                <td class="px-4 py-3"><span class="font-mono text-xs bg-muted px-2 py-1 rounded">${s.elimuid}</span></td>
                                <td class="px-4 py-3">${s.grade}</td>
                                <td class="px-4 py-3"><span class="px-2 py-1 ${s.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'} text-xs rounded-full">${s.status}</span></td>
                                <td class="px-4 py-3 text-center"><button onclick="viewStudentDetails('${s.id}')" class="p-2 hover:bg-accent rounded-lg"><i data-lucide="eye" class="h-4 w-4"></i></button>
                                <button onclick="editStudent('${s.id}')" class="p-2 hover:bg-accent rounded-lg"><i data-lucide="edit" class="h-4 w-4"></i></button>
                                <button onclick="suspendStudent('${s.id}', '${user.name}')" class="p-2 hover:bg-yellow-100 rounded-lg text-yellow-600"><i data-lucide="pause-circle" class="h-4 w-4"></i></button>
                                <button onclick="deleteStudent('${s.id}', '${user.name}')" class="p-2 hover:bg-red-100 rounded-lg text-red-600"><i data-lucide="trash-2" class="h-4 w-4"></i></button>
                                <button onclick="copyToClipboard('${s.elimuid}')" class="p-2 hover:bg-purple-100 rounded-lg"><i data-lucide="copy" class="h-4 w-4"></i></button></td></tr>`;
                            }).join('')}
                            ${students.length === 0 ? '<tr><td colspan="5" class="text-center py-8">No students found</td></tr>' : ''}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

async function renderAdminTeachers() {
    const teachers = await window.loadAllTeachers();
    return `
        <div class="space-y-6 animate-fade-in">
            <h2 class="text-2xl font-bold">Teacher Management</h2>
            <div class="rounded-xl border bg-card overflow-hidden">${renderTeachersTable(teachers)}</div>
        </div>
    `;
}

async function renderAdminPendingTeachers() {
    const teachers = await window.loadPendingTeachers();
    return `
        <div class="space-y-6 animate-fade-in">
            <h2 class="text-2xl font-bold">Pending Teacher Approvals</h2>
            <div class="rounded-xl border bg-card overflow-hidden">${renderPendingTeachersTable(teachers)}</div>
        </div>
    `;
}

function renderPendingTeachersTable(teachers) {
    if (!teachers.length) return '<div class="text-center py-8">No pending teachers</div>';
    return `<div class="overflow-x-auto"><table class="w-full text-sm"><thead class="bg-muted/50"><tr><th class="px-4 py-3 text-left">Teacher</th><th class="px-4 py-3 text-left">Email</th><th class="px-4 py-3 text-left">Subjects</th><th class="px-4 py-3 text-left">Applied</th><th class="px-4 py-3 text-right">Actions</th></tr></thead><tbody class="divide-y">
        ${teachers.map(t => {
            const user = t.User || {};
            return `<tr><td class="px-4 py-3"><div class="flex items-center gap-3"><div class="h-8 w-8 rounded-full bg-violet-100 flex items-center justify-center"><span class="font-medium text-violet-700 text-sm">${getInitials(user.name)}</span></div><span class="font-medium">${user.name}</span></div></td>
            <td class="px-4 py-3">${user.email}</td>
            <td class="px-4 py-3">${(t.subjects || []).join(', ')}</td>
            <td class="px-4 py-3">${timeAgo(t.createdAt)}</td>
            <td class="px-4 py-3 text-right"><button onclick="approveTeacher('${t.id}')" class="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full mr-2">Approve</button><button onclick="rejectTeacher('${t.id}')" class="px-3 py-1 bg-red-100 text-red-700 text-xs rounded-full">Reject</button></td></tr>`;
        }).join('')}
    </tbody></table></div>`;
}

function renderTeachersTable(teachers) {
    if (!teachers.length) return '<div class="text-center py-8">No teachers found</div>';
    return `<div class="overflow-x-auto"><table class="w-full text-sm"><thead class="bg-muted/50"><tr><th class="px-4 py-3 text-left">Teacher</th><th class="px-4 py-3 text-left">Email</th><th class="px-4 py-3 text-left">Subjects</th><th class="px-4 py-3 text-left">Status</th><th class="px-4 py-3 text-right">Actions</th></tr></thead><tbody class="divide-y">
        ${teachers.map(t => {
            const user = t.User || {};
            const active = t.isActive !== false;
            return `<tr><td class="px-4 py-3"><div class="flex items-center gap-3"><div class="h-8 w-8 rounded-full bg-blue-100"><span class="font-medium text-blue-700 text-sm">${getInitials(user.name)}</span></div><span class="font-medium">${user.name}</span></div></td>
            <td class="px-4 py-3">${user.email}</td>
            <td class="px-4 py-3">${(t.subjects || []).join(', ')}</td>
            <td class="px-4 py-3"><span class="px-2 py-1 ${active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'} text-xs rounded-full">${active ? 'Active' : 'Inactive'}</span></td>
            <td class="px-4 py-3 text-right"><button onclick="viewTeacherDetails('${t.id}')" class="p-2 hover:bg-accent"><i data-lucide="eye" class="h-4 w-4"></i></button>
            ${active ? `<button onclick="deactivateTeacher('${t.id}', '${user.name}')" class="p-2 hover:bg-yellow-100 text-yellow-600"><i data-lucide="pause-circle"></i></button>` : `<button onclick="activateTeacher('${t.id}', '${user.name}')" class="p-2 hover:bg-green-100 text-green-600"><i data-lucide="play-circle"></i></button>`}
            <button onclick="removeTeacher('${t.id}')" class="p-2 hover:bg-red-100 text-red-600"><i data-lucide="trash-2"></i></button></td></tr>`;
        }).join('')}
    </tbody></table></div>`;
}

async function renderAdminDuty() {
    const todayDuty = await api.duty.getTodayDuty().catch(() => ({ data: {} }));
    const weeklyDuty = await api.duty.getWeeklyDuty().catch(() => ({ data: [] }));
    return `
        <div class="space-y-6">
            <div class="flex justify-between"><h2 class="text-2xl font-bold">Duty Management</h2><button onclick="handleGenerateDutyRoster()" class="px-4 py-2 bg-primary text-white rounded-lg">Generate New Roster</button></div>
            <div class="grid md:grid-cols-2 gap-4">
                <div class="border rounded-lg p-4"><h3 class="font-semibold mb-2">Generate Roster</h3><input type="date" id="duty-start-date" class="w-full border rounded p-2 mb-2"><input type="date" id="duty-end-date" class="w-full border rounded p-2 mb-2"><button onclick="handleGenerateDutyRoster()" class="w-full bg-primary text-white py-2 rounded">Generate</button></div>
                <div class="border rounded-lg p-4"><h3 class="font-semibold mb-2">Today's Duty</h3>${todayDuty.data?.duties?.map(d => `<div class="flex justify-between py-1"><span>${d.area}</span><span>${d.teacherName}</span></div>`).join('') || '<p>No duty today</p>'}</div>
            </div>
        </div>
    `;
}

async function renderAdminFairnessReport() {
    try {
        const report = await api.admin.getFairnessReport();
        const fairness = report.data || {};
        return `
            <div class="space-y-6"><h2 class="text-2xl font-bold">Fairness Report</h2>
            <div class="grid md:grid-cols-3 gap-4">
                <div class="border rounded p-4"><p>Fairness Score</p><p class="text-3xl font-bold">${fairness.summary?.fairnessScore || 0}%</p></div>
                <div class="border rounded p-4"><p>Total Duties</p><p class="text-3xl font-bold">${fairness.summary?.totalDuties || 0}</p></div>
                <div class="border rounded p-4"><p>Teachers</p><p class="text-3xl font-bold">${fairness.teacherStats?.length || 0}</p></div>
            </div>
            <div class="border rounded overflow-x-auto"><table class="w-full"><thead><tr><th>Teacher</th><th>Scheduled</th><th>Completed</th><th>Completion</th></tr></thead><tbody>${(fairness.teacherStats || []).map(t => `<tr><td>${t.teacherName}</td><td class="text-center">${t.scheduled}</td><td class="text-center">${t.completed}</td><td class="text-center">${t.completionRate}%</td></tr>`).join('')}</tbody></table></div></div>
        `;
    } catch { return '<div class="text-center py-12">No data available</div>'; }
}

async function renderAdminTeacherWorkload() {
    try {
        const workload = await api.admin.getTeacherWorkload();
        const teachers = workload.data || [];
        return `
            <div class="space-y-6"><h2 class="text-2xl font-bold">Teacher Workload</h2>
            <div class="grid md:grid-cols-3 gap-4">
                <div class="border rounded p-4"><p>Overworked</p><p class="text-3xl font-bold text-red-600">${teachers.filter(t => t.status === 'overworked').length}</p></div>
                <div class="border rounded p-4"><p>Balanced</p><p class="text-3xl font-bold text-green-600">${teachers.filter(t => t.status === 'balanced').length}</p></div>
                <div class="border rounded p-4"><p>Underworked</p><p class="text-3xl font-bold text-yellow-600">${teachers.filter(t => t.status === 'underworked').length}</p></div>
            </div>
            <div class="border rounded overflow-x-auto"><table class="w-full"><thead><tr><th>Teacher</th><th>Monthly</th><th>Weekly</th><th>Reliability</th><th>Status</th></tr></thead><tbody>${teachers.map(t => `<tr><td>${t.teacherName}</td><td class="text-center">${t.monthlyDutyCount}</td><td class="text-center">${t.weeklyDutyCount}</td><td class="text-center">${t.reliabilityScore}</td><td class="text-center">${t.status}</td></tr>`).join('')}</tbody></table></div></div>
        `;
    } catch { return '<div class="text-center py-12">No data available</div>'; }
}

function renderAdminSettings() { return `<div class="p-6"><h2>Settings</h2><p>Coming soon</p></div>`; }
function renderAdminCustomSubjects() { return `<div class="p-6"><h2>Custom Subjects</h2><p>Coming soon</p></div>`; }
function renderAdminCalendar() { return `<div class="p-6"><h2>Calendar</h2><p>Coming soon</p></div>`; }

// Export all needed globals
window.renderAdminSection = renderAdminSection;
window.renderAdminDashboard = renderAdminDashboard;
window.renderAdminStudents = renderAdminStudents;
window.renderAdminTeachers = renderAdminTeachers;
window.renderAdminPendingTeachers = renderAdminPendingTeachers;
window.renderAdminDuty = renderAdminDuty;
window.renderAdminFairnessReport = renderAdminFairnessReport;
window.renderAdminTeacherWorkload = renderAdminTeacherWorkload;
window.renderAdminSettings = renderAdminSettings;
window.renderAdminCustomSubjects = renderAdminCustomSubjects;
window.renderHelpSection = renderHelpSection;
window.handleGenerateDutyRoster = handleGenerateDutyRoster;
