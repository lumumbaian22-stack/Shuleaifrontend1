// js/admin-dashboard.js - Admin dashboard rendering

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
        console.error('Error rendering admin section:', error);
        return `<div class="text-center py-12 text-red-500">Error loading section: ${error.message}</div>`;
    }
}

function renderAdminDashboard() {
    const school = getCurrentSchool();
    const data = dashboardData || {};
    return `
        <div class="space-y-6 animate-fade-in">
            <div class="rounded-xl border bg-card p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 card-hover">
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
                <div class="rounded-xl border bg-card p-6 card-hover">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-muted-foreground">Total Students</p>
                            <h3 class="text-2xl font-bold mt-1" id="total-students">${data.students?.length || 0}</h3>
                        </div>
                        <div class="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                            <i data-lucide="users" class="h-6 w-6 text-blue-600"></i>
                        </div>
                    </div>
                </div>
                <div class="rounded-xl border bg-card p-6 card-hover">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-muted-foreground">Teachers</p>
                            <h3 class="text-2xl font-bold mt-1" id="total-teachers">${data.teachers?.length || 0}</h3>
                            <p class="text-xs text-green-600 mt-1 flex items-center gap-1">
                                <i data-lucide="trending-up" class="h-3 w-3"></i>
                                +${data.pendingTeachers?.length || 0} pending approval
                            </p>
                        </div>
                        <div class="h-12 w-12 rounded-lg bg-violet-100 flex items-center justify-center">
                            <i data-lucide="user-plus" class="h-6 w-6 text-violet-600"></i>
                        </div>
                    </div>
                </div>
                <div class="rounded-xl border bg-card p-6 card-hover">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-muted-foreground">Classes</p>
                            <h3 class="text-2xl font-bold mt-1" id="total-classes">${data.classes?.length || 0}</h3>
                        </div>
                        <div class="h-12 w-12 rounded-lg bg-emerald-100 flex items-center justify-center">
                            <i data-lucide="book-open" class="h-6 w-6 text-emerald-600"></i>
                        </div>
                    </div>
                </div>
                <div class="rounded-xl border bg-card p-6 card-hover">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-muted-foreground">Attendance Rate</p>
                            <h3 class="text-2xl font-bold mt-1">94.2%</h3>
                        </div>
                        <div class="h-12 w-12 rounded-lg bg-amber-100 flex items-center justify-center">
                            <i data-lucide="calendar-check" class="h-6 w-6 text-amber-600"></i>
                        </div>
                    </div>
                </div>
            </div>

            <div class="grid gap-4 lg:grid-cols-2">
                <div class="rounded-xl border bg-card p-6">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="font-semibold">Enrollment Trends</h3>
                    </div>
                    <div class="chart-container h-64">
                        <canvas id="admin-enrollmentChart"></canvas>
                    </div>
                </div>
                <div class="rounded-xl border bg-card p-6">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="font-semibold">Grade Distribution</h3>
                    </div>
                    <div class="chart-container h-64">
                        <canvas id="admin-gradeChart"></canvas>
                    </div>
                </div>
            </div>
        </div>
    `;
}

async function renderAdminStudents() {
    const students = await loadAllStudents();
    return `
        <div class="space-y-6 animate-fade-in">
            <div class="flex justify-between items-center">
                <h2 class="text-2xl font-bold">Student Management</h2>
                <button onclick="showAddStudentModal()" class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 flex items-center gap-2">
                    <i data-lucide="plus" class="h-4 w-4"></i> Add Student
                </button>
            </div>

            <div class="grid gap-4 md:grid-cols-4">
                <div class="rounded-xl border bg-card p-4">
                    <p class="text-sm text-muted-foreground">Total Students</p>
                    <p class="text-2xl font-bold">${students.length}</p>
                </div>
                <div class="rounded-xl border bg-card p-4">
                    <p class="text-sm text-muted-foreground">Active</p>
                    <p class="text-2xl font-bold text-green-600">${students.filter(s => s.status === 'active').length}</p>
                </div>
                <div class="rounded-xl border bg-card p-4">
                    <p class="text-sm text-muted-foreground">Suspended</p>
                    <p class="text-2xl font-bold text-red-600">${students.filter(s => s.status === 'suspended').length}</p>
                </div>
                <div class="rounded-xl border bg-card p-4">
                    <p class="text-sm text-muted-foreground">Graduated</p>
                    <p class="text-2xl font-bold text-blue-600">${students.filter(s => s.status === 'graduated').length}</p>
                </div>
            </div>

            <div class="rounded-xl border bg-card overflow-hidden">
                <div class="overflow-x-auto">
                    <table class="w-full text-sm">
                        <thead class="bg-muted/50">
                            <tr>
                                <th class="px-4 py-3 text-left font-medium">Student</th>
                                <th class="px-4 py-3 text-left font-medium">ELIMUID</th>
                                <th class="px-4 py-3 text-left font-medium">Grade</th>
                                <th class="px-4 py-3 text-left font-medium">Status</th>
                                <th class="px-4 py-3 text-center font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y" id="students-table-body">
                            ${students.map(student => {
                                const user = student.User || {};
                                const name = user.name || 'Unknown';
                                const status = student.status || 'active';
                                const statusClass = status === 'active' ? 'bg-green-100 text-green-700' : 
                                                   status === 'suspended' ? 'bg-red-100 text-red-700' : 
                                                   'bg-gray-100 text-gray-700';
                                const initials = getInitials(name);
                                return `
                                    <tr class="hover:bg-accent/50 transition-colors">
                                        <td class="px-4 py-3">
                                            <div class="flex items-center gap-3">
                                                <div class="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                                    <span class="font-medium text-blue-700 text-sm">${initials}</span>
                                                </div>
                                                <span class="font-medium">${name}</span>
                                            </div>
                                        </td>
                                        <td class="px-4 py-3"><span class="font-mono text-xs bg-muted px-2 py-1 rounded">${student.elimuid || 'N/A'}</span></td>
                                        <td class="px-4 py-3">${student.grade || 'N/A'}</td>
                                        <td class="px-4 py-3"><span class="px-2 py-1 ${statusClass} text-xs rounded-full">${status}</span></td>
                                        <td class="px-4 py-3 text-center">
                                            <div class="flex items-center justify-center gap-2">
                                                <button onclick="viewStudentDetails('${student.id}')" class="p-2 hover:bg-accent rounded-lg" title="View">
                                                    <i data-lucide="eye" class="h-4 w-4 text-blue-600"></i>
                                                </button>
                                                <button onclick="editStudent('${student.id}')" class="p-2 hover:bg-accent rounded-lg" title="Edit">
                                                    <i data-lucide="edit" class="h-4 w-4 text-green-600"></i>
                                                </button>
                                                ${status === 'active' ? 
                                                    `<button onclick="suspendStudent('${student.id}', '${name}')" class="p-2 hover:bg-yellow-100 rounded-lg" title="Suspend">
                                                        <i data-lucide="pause-circle" class="h-4 w-4 text-yellow-600"></i>
                                                    </button>` : 
                                                    `<button onclick="reactivateStudent('${student.id}', '${name}')" class="p-2 hover:bg-green-100 rounded-lg" title="Reactivate">
                                                        <i data-lucide="play-circle" class="h-4 w-4 text-green-600"></i>
                                                    </button>`
                                                }
                                                <button onclick="deleteStudent('${student.id}', '${name}')" class="p-2 hover:bg-red-100 rounded-lg" title="Delete">
                                                    <i data-lucide="trash-2" class="h-4 w-4 text-red-600"></i>
                                                </button>
                                                <button onclick="copyToClipboard('${student.elimuid}')" class="p-2 hover:bg-purple-100 rounded-lg" title="Copy ELIMUID">
                                                    <i data-lucide="copy" class="h-4 w-4 text-purple-600"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                            ${students.length === 0 ? '<tr><td colspan="5" class="text-center py-8 text-muted-foreground">No students found</td></tr>' : ''}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

async function renderAdminTeachers() {
    const teachers = await loadAllTeachers();
    return `
        <div class="space-y-6 animate-fade-in">
            <h2 class="text-2xl font-bold">Teacher Management</h2>
            <div class="rounded-xl border bg-card overflow-hidden">
                ${renderTeachersTable(teachers)}
            </div>
        </div>
    `;
}

async function renderAdminPendingTeachers() {
    const teachers = await loadPendingTeachers();
    return `
        <div class="space-y-6 animate-fade-in">
            <h2 class="text-2xl font-bold">Pending Teacher Approvals</h2>
            <div class="rounded-xl border bg-card overflow-hidden">
                ${renderPendingTeachersTable(teachers)}
            </div>
        </div>
    `;
}

async function renderAdminDuty() {
    const todayDuty = await api.duty.getTodayDuty().catch(() => ({ data: {} }));
    const weeklyDuty = await api.duty.getWeeklyDuty().catch(() => ({ data: [] }));
    const understaffed = await api.admin.getUnderstaffedAreas().catch(() => ({ data: [] }));
    return `
        <div class="space-y-6 animate-fade-in">
            <div class="flex justify-between items-center">
                <h2 class="text-2xl font-bold">Duty Management</h2>
                <button onclick="handleGenerateDutyRoster()" class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 flex items-center gap-2">
                    <i data-lucide="refresh-cw" class="h-4 w-4"></i> Generate New Roster
                </button>
            </div>

            ${understaffed.data?.length > 0 ? `
                <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-lg p-4">
                    <div class="flex items-center gap-2 text-red-700 mb-2">
                        <i data-lucide="alert-triangle" class="h-5 w-5"></i>
                        <h3 class="font-semibold">Understaffed Areas Detected</h3>
                    </div>
                    <div class="space-y-2">
                        ${understaffed.data.map(area => `
                            <div class="text-sm text-red-600">${area.date}: ${area.areas.map(a => `${a.area} (need ${a.required}, have ${a.current})`).join(', ')}</div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}

            <div class="grid gap-4 md:grid-cols-2">
                <div class="rounded-xl border bg-card p-6">
                    <h3 class="font-semibold mb-4">Generate Duty Roster</h3>
                    <div class="space-y-3">
                        <div>
                            <label class="block text-sm font-medium mb-1">Start Date</label>
                            <input type="date" id="duty-start-date" value="${new Date().toISOString().split('T')[0]}" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                        </div>
                        <div>
                            <label class="block text-sm font-medium mb-1">End Date</label>
                            <input type="date" id="duty-end-date" value="${new Date(Date.now() + 7*24*60*60*1000).toISOString().split('T')[0]}" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                        </div>
                        <button onclick="handleGenerateDutyRoster()" class="w-full bg-primary text-primary-foreground py-2 rounded-lg hover:bg-primary/90">
                            Generate Roster
                        </button>
                    </div>
                </div>
                <div class="rounded-xl border bg-card p-6">
                    <h3 class="font-semibold mb-4">Quick Actions</h3>
                    <div class="space-y-2">
                        <button onclick="showDashboardSection('fairness-report')" class="w-full text-left p-3 hover:bg-accent rounded-lg flex items-center gap-3">
                            <i data-lucide="bar-chart-2" class="h-5 w-5 text-blue-600"></i>
                            <div><p class="font-medium">Fairness Report</p><p class="text-xs text-muted-foreground">View duty distribution analytics</p></div>
                        </button>
                        <button onclick="showDashboardSection('teacher-workload')" class="w-full text-left p-3 hover:bg-accent rounded-lg flex items-center gap-3">
                            <i data-lucide="users" class="h-5 w-5 text-green-600"></i>
                            <div><p class="font-medium">Teacher Workload</p><p class="text-xs text-muted-foreground">Monitor duty load per teacher</p></div>
                        </button>
                    </div>
                </div>
            </div>

            <div class="rounded-xl border bg-card p-6">
                <h3 class="font-semibold mb-4">Today's Duty (${new Date().toLocaleDateString()})</h3>
                <div class="space-y-3">
                    ${todayDuty.data?.duties?.length > 0 ? todayDuty.data.duties.map(duty => `
                        <div class="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                            <div><p class="font-medium">${duty.area}</p><p class="text-sm text-muted-foreground">${duty.timeSlot?.start} - ${duty.timeSlot?.end}</p></div>
                            <div class="text-right"><p class="font-medium">${duty.teacherName}</p><p class="text-xs ${duty.checkedIn ? 'text-green-600' : 'text-yellow-600'}">${duty.checkedIn ? '✓ Checked In' : '⏳ Pending'}</p></div>
                        </div>
                    `).join('') : '<p class="text-center text-muted-foreground py-4">No duty today</p>'}
                </div>
            </div>

            <div class="rounded-xl border bg-card p-6">
                <h3 class="font-semibold mb-4">Weekly Schedule</h3>
                <div class="space-y-3">
                    ${weeklyDuty.data?.map(day => `
                        <div class="border rounded-lg overflow-hidden">
                            <div class="bg-muted/30 px-4 py-2 font-medium ${day.isToday ? 'bg-primary/10' : ''}">
                                ${day.dayName} ${day.isToday ? '(Today)' : ''}
                            </div>
                            <div class="p-3 space-y-2">
                                ${day.duties.length > 0 ? day.duties.map(duty => `
                                    <div class="flex justify-between text-sm"><span>${duty.area}</span><span>${duty.teacherName}</span></div>
                                `).join('') : '<p class="text-sm text-muted-foreground">No duty</p>'}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

async function renderAdminFairnessReport() {
    showLoading();
    try {
        const report = await api.admin.getFairnessReport();
        const fairness = report.data || {};
        return `
            <div class="space-y-6 animate-fade-in">
                <div class="flex justify-between items-center">
                    <h2 class="text-2xl font-bold">Duty Fairness Report</h2>
                    <button onclick="renderAdminFairnessReport()" class="px-4 py-2 border rounded-lg hover:bg-accent">
                        <i data-lucide="refresh-cw" class="h-4 w-4"></i> Refresh
                    </button>
                </div>
                <div class="grid gap-4 md:grid-cols-3">
                    <div class="rounded-xl border bg-card p-6">
                        <p class="text-sm text-muted-foreground">Fairness Score</p>
                        <div class="flex items-end gap-2"><h3 class="text-3xl font-bold">${fairness.summary?.fairnessScore || 0}%</h3><span class="text-sm mb-1">/ 100</span></div>
                    </div>
                    <div class="rounded-xl border bg-card p-6"><p class="text-sm text-muted-foreground">Total Duties</p><h3 class="text-3xl font-bold">${fairness.summary?.totalDuties || 0}</h3></div>
                    <div class="rounded-xl border bg-card p-6"><p class="text-sm text-muted-foreground">Teachers</p><h3 class="text-3xl font-bold">${fairness.teacherStats?.length || 0}</h3></div>
                </div>
                <div class="rounded-xl border bg-card overflow-hidden">
                    <div class="p-4 border-b"><h3 class="font-semibold">Teacher Workload Distribution</h3></div>
                    <div class="overflow-x-auto">
                        <table class="w-full text-sm">
                            <thead class="bg-muted/50"><tr><th class="px-4 py-3 text-left">Teacher</th><th class="px-4 py-3 text-left">Department</th><th class="px-4 py-3 text-center">Scheduled</th><th class="px-4 py-3 text-center">Completed</th><th class="px-4 py-3 text-center">Completion Rate</th></tr></thead>
                            <tbody class="divide-y">
                                ${(fairness.teacherStats || []).map(t => `
                                    <tr><td class="px-4 py-3 font-medium">${t.teacherName}</td><td class="px-4 py-3">${t.department}</td><td class="px-4 py-3 text-center">${t.scheduled}</td><td class="px-4 py-3 text-center">${t.completed}</td><td class="px-4 py-3 text-center"><span class="px-2 py-1 rounded-full text-xs ${t.completionRate >= 80 ? 'bg-green-100 text-green-700' : t.completionRate >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}">${t.completionRate}%</span></td></tr>
                                `).join('')}
                                ${(!fairness.teacherStats || fairness.teacherStats.length === 0) ? '<tr><td colspan="5" class="text-center py-8 text-muted-foreground">No data available</td></tr>' : ''}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        return `<div class="text-center py-12 text-red-500">Error loading fairness report: ${error.message}</div>`;
    } finally {
        hideLoading();
    }
}

async function renderAdminTeacherWorkload() {
    try {
        const workload = await api.admin.getTeacherWorkload();
        const teachers = workload.data || [];
        return `
            <div class="space-y-6 animate-fade-in">
                <h2 class="text-2xl font-bold">Teacher Workload Monitor</h2>
                <div class="grid gap-4 md:grid-cols-3">
                    <div class="rounded-xl border bg-card p-6"><p class="text-sm text-muted-foreground">Overworked Teachers</p><h3 class="text-3xl font-bold text-red-600">${teachers.filter(t => t.status === 'overworked').length}</h3></div>
                    <div class="rounded-xl border bg-card p-6"><p class="text-sm text-muted-foreground">Balanced Teachers</p><h3 class="text-3xl font-bold text-green-600">${teachers.filter(t => t.status === 'balanced').length}</h3></div>
                    <div class="rounded-xl border bg-card p-6"><p class="text-sm text-muted-foreground">Underworked Teachers</p><h3 class="text-3xl font-bold text-yellow-600">${teachers.filter(t => t.status === 'underworked').length}</h3></div>
                </div>
                <div class="rounded-xl border bg-card overflow-hidden">
                    <div class="p-4 border-b"><h3 class="font-semibold">Current Workload Distribution</h3></div>
                    <div class="overflow-x-auto">
                        <table class="w-full text-sm">
                            <thead class="bg-muted/50"><tr><th class="px-4 py-3 text-left font-medium">Teacher</th><th class="px-4 py-3 text-left font-medium">Department</th><th class="px-4 py-3 text-center font-medium">Monthly Duties</th><th class="px-4 py-3 text-center font-medium">Weekly Duties</th><th class="px-4 py-3 text-center font-medium">Reliability</th><th class="px-4 py-3 text-center font-medium">Status</th></tr></thead>
                            <tbody class="divide-y">
                                ${teachers.map(t => `
                                    <tr><td class="px-4 py-3 font-medium">${t.teacherName}</td><td class="px-4 py-3">${t.department}</td><td class="px-4 py-3 text-center">${t.monthlyDutyCount}</td><td class="px-4 py-3 text-center">${t.weeklyDutyCount}</td><td class="px-4 py-3 text-center">${t.reliabilityScore}</td><td class="px-4 py-3 text-center"><span class="px-2 py-1 ${t.status === 'overworked' ? 'bg-red-100 text-red-700' : t.status === 'underworked' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'} text-xs rounded-full">${t.status}</span></td></tr>
                                `).join('')}
                                ${teachers.length === 0 ? '<tr><td colspan="6" class="text-center py-8 text-muted-foreground">No data available</td></tr>' : ''}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        return `<div class="text-center py-12 text-red-500">Error loading workload: ${error.message}</div>`;
    }
}

function renderAdminSettings() {
    const curriculum = schoolSettings.curriculum || 'cbc';
    const schoolLevel = schoolSettings.schoolLevel || 'secondary';
    const curriculumInfo = CURRICULUMS[curriculum];
    const levelInfo = curriculumInfo?.levels[schoolLevel] || [];
    const subjectInfo = curriculumInfo?.subjects[schoolLevel] || [];

    return `
        <div class="space-y-6 animate-fade-in">
            <h2 class="text-2xl font-bold">School Settings</h2>
            <p class="text-sm text-muted-foreground">Changes made here will reflect across all dashboards for this school.</p>
            <div class="grid gap-6">
                <div class="rounded-xl border bg-card p-6">
                    <h3 class="font-semibold mb-4">School Information</h3>
                    <div class="space-y-4">
                        <div><label class="block text-sm font-medium mb-1">School Name</label><input type="text" id="settings-school-name" value="${schoolSettings.schoolName || ''}" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"></div>
                        <div><label class="block text-sm font-medium mb-1">School Level</label><select id="settings-school-level" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"><option value="primary" ${schoolLevel === 'primary' ? 'selected' : ''}>Primary</option><option value="secondary" ${schoolLevel === 'secondary' ? 'selected' : ''}>Secondary</option><option value="both" ${schoolLevel === 'both' ? 'selected' : ''}>Both</option></select></div>
                    </div>
                </div>
                <div class="rounded-xl border bg-card p-6">
                    <h3 class="font-semibold mb-4">Curriculum Settings</h3>
                    <div class="space-y-4">
                        <div><label class="block text-sm font-medium mb-1">Select Curriculum</label><select id="settings-curriculum" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"><option value="cbc" ${curriculum === 'cbc' ? 'selected' : ''}>CBC</option><option value="844" ${curriculum === '844' ? 'selected' : ''}>8-4-4</option><option value="british" ${curriculum === 'british' ? 'selected' : ''}>British</option><option value="american" ${curriculum === 'american' ? 'selected' : ''}>American</option></select></div>
                        <div class="p-4 bg-muted/30 rounded-lg"><h4 class="font-sm font-medium mb-2">Curriculum Information</h4><p class="text-sm text-muted-foreground"><span class="font-medium">Name:</span> ${curriculumInfo?.name || 'N/A'}</p><p class="text-sm text-muted-foreground mt-1"><span class="font-medium">Grade Levels:</span> ${levelInfo.join(', ')}</p><p class="text-sm text-muted-foreground mt-1"><span class="font-medium">Core Subjects:</span> ${subjectInfo.join(', ')}</p></div>
                    </div>
                </div>
                <div class="flex justify-end"><button onclick="saveAllSettings()" class="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">Save Settings</button></div>
            </div>
        </div>
    `;
}

function renderAdminCustomSubjects() {
    const curriculum = schoolSettings.curriculum || 'cbc';
    const schoolLevel = schoolSettings.schoolLevel || 'secondary';
    const curriculumInfo = CURRICULUMS[curriculum];
    const subjectInfo = curriculumInfo?.subjects[schoolLevel] || [];

    return `
        <div class="space-y-6 animate-fade-in">
            <div class="flex justify-between items-center"><h2 class="text-2xl font-bold">Custom Subjects</h2></div>
            <p class="text-sm text-muted-foreground">Add subjects that are not in the standard curriculum</p>
            <div class="rounded-xl border bg-card p-6">
                <div class="space-y-4">
                    <div class="flex gap-2"><input type="text" id="new-subject-name" placeholder="e.g., French, Computer Science, Art" class="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm"><button onclick="addCustomSubject()" class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">Add Subject</button></div>
                    <div><h4 class="text-sm font-medium mb-3">Curriculum Subjects</h4><div class="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">${subjectInfo.map(subject => `<div class="flex items-center justify-between p-3 bg-muted/30 rounded-lg border"><span class="text-sm font-medium">${subject}</span><span class="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">core</span></div>`).join('')}</div></div>
                    <div><h4 class="text-sm font-medium mb-3">Custom Subjects</h4><div class="grid grid-cols-2 md:grid-cols-3 gap-3" id="custom-subjects-container">${customSubjects && customSubjects.length > 0 ? customSubjects.map(subject => `<div class="custom-subject-item flex items-center justify-between p-3 bg-secondary/30 rounded-lg border" data-subject="${subject}"><span class="text-sm font-medium">${subject}</span><button onclick="removeCustomSubject('${subject}')" class="text-red-500 hover:text-red-700"><i data-lucide="x" class="h-4 w-4"></i></button></div>`).join('') : '<p class="text-sm text-muted-foreground col-span-3 py-4 text-center bg-muted/30 rounded-lg" id="no-custom-subjects-message">No custom subjects added yet</p>'}</div></div>
                </div>
            </div>
            <div class="flex justify-end"><button onclick="saveAllSettings()" class="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 flex items-center gap-2"><i data-lucide="save" class="h-4 w-4"></i> Save Changes</button></div>
        </div>
    `;
}

function renderAdminCalendar() {
    return `<div class="space-y-6"><h2 class="text-2xl font-bold">School Calendar</h2><div class="rounded-xl border bg-card p-6">Calendar feature coming soon</div></div>`;
}

function renderHelpSection() {
    const user = getCurrentUser();
    const role = user?.role || 'user';
    const helpArticles = {
        admin: [
            { title: 'How to add a student', content: 'Go to Students, click Add Student, fill in details. The student receives an ELIMUID automatically.', keywords: ['add', 'student', 'create', 'enroll'] },
            { title: 'How to approve a teacher', content: 'Go to Teacher Approvals, review teacher details, click Approve or Reject.', keywords: ['teacher', 'approve', 'hire', 'staff'] },
            { title: 'How to generate duty roster', content: 'Go to Duty Management, select dates, click Generate Roster. The system assigns duties based on points.', keywords: ['duty', 'roster', 'schedule', 'generate', 'assign'] },
            { title: 'How to change curriculum', content: 'Go to Settings, select new curriculum, click Save. All users will see updated grading.', keywords: ['curriculum', 'cbc', '844', 'british', 'american', 'change'] }
        ]
    };
    const articles = helpArticles[role] || helpArticles.admin;
    return `
        <div class="space-y-6 animate-fade-in max-w-5xl mx-auto">
            <div class="text-center"><h2 class="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Help Center</h2><p class="text-muted-foreground mt-2">Find answers to common questions</p></div>
            <div class="relative"><i data-lucide="search" class="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground"></i><input type="text" id="help-search" placeholder="Search help articles..." onkeyup="searchHelpArticles()" class="w-full pl-10 pr-4 py-3 rounded-xl border bg-card focus:ring-2 focus:ring-primary transition-all"></div>
            <div id="help-articles-container" class="grid gap-4">${articles.map(article => `<div class="help-article rounded-xl border bg-card p-6 hover:shadow-md transition-all cursor-pointer" data-title="${article.title.toLowerCase()}" data-content="${article.content.toLowerCase()}" data-keywords="${article.keywords.join(' ').toLowerCase()}" onclick="showHelpArticleDetail('${article.title.replace(/'/g, "\\'")}', '${article.content.replace(/'/g, "\\'")}')"><h3 class="font-semibold text-lg mb-2">📚 ${article.title}</h3><p class="text-muted-foreground">${article.content.substring(0, 150)}...</p></div>`).join('')}</div>
            <div class="rounded-xl border bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 p-6 text-center"><h3 class="font-semibold text-lg mb-2">💬 Still Need Help?</h3><p class="text-muted-foreground mb-4">Contact our support team for assistance</p><div class="flex gap-3 justify-center"><button onclick="window.location.href='mailto:support@shuleai.com'" class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">Email Support</button></div></div>
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
            noMsg.innerHTML = `<i data-lucide="search-x" class="h-12 w-12 mx-auto text-muted-foreground mb-3"></i><p class="text-muted-foreground">No results found for "${term}"</p><p class="text-sm text-muted-foreground mt-1">Try different keywords or contact support</p>`;
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
        modal.innerHTML = `<div class="absolute inset-0 bg-black/50" onclick="closeHelpArticleModal()"></div><div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md p-4"><div class="rounded-xl border bg-card p-6 shadow-xl animate-fade-in"><div class="modal-content"></div></div></div>`;
        document.body.appendChild(modal);
    }
    const modalContent = modal.querySelector('.modal-content');
    modalContent.innerHTML = `<div class="space-y-4"><div class="border-b pb-3"><h3 class="text-xl font-semibold">${title}</h3></div><div class="prose prose-sm max-w-none"><p class="text-muted-foreground">${content}</p></div><div class="flex justify-end gap-2 pt-4 border-t"><button onclick="closeHelpArticleModal()" class="px-4 py-2 border rounded-lg hover:bg-accent">Close</button><button onclick="window.location.href='mailto:support@shuleai.com'" class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">Contact Support</button></div></div>`;
    modal.classList.remove('hidden');
    if (typeof lucide !== 'undefined') lucide.createIcons();
};

window.closeHelpArticleModal = function() {
    const modal = document.getElementById('help-article-modal');
    if (modal) modal.classList.add('hidden');
};

// Export
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
window.renderAdminCalendar = renderAdminCalendar;
window.renderHelpSection = renderHelpSection;
