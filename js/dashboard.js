
// Dashboard data fetching and rendering

async function fetchDashboardData(role) {
    const endpoints = {
        superadmin: '/api/super-admin/overview',
        admin: '/api/admin/dashboard',
        teacher: '/api/teacher/dashboard',
        parent: '/api/parent/dashboard',
        student: '/api/student/dashboard'
    };
    
    try {
        const data = await apiRequest(endpoints[role]);
        return data;
    } catch (error) {
        console.error(`Failed to fetch ${role} dashboard:`, error);
        throw error;
    }
}

function renderDashboard(role, data) {
    const templates = {
        superadmin: renderSuperAdminDashboard,
        admin: renderAdminDashboard,
        teacher: renderTeacherDashboard,
        parent: renderParentDashboard,
        student: renderStudentDashboard
    };
    
    return templates[role](data);
}

function renderSuperAdminDashboard(data) {
    return `
        <div class="space-y-6 animate-fade-in">
            <!-- Stats Grid -->
            <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div class="rounded-xl border bg-card p-6 card-hover">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-muted-foreground">Total Schools</p>
                            <h3 class="text-2xl font-bold mt-1">${data.totalSchools}</h3>
                            <p class="text-xs text-green-600 mt-1 flex items-center gap-1">
                                <i data-lucide="trending-up" class="h-3 w-3"></i>
                                +${data.newSchoolsThisMonth} this month
                            </p>
                        </div>
                        <div class="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                            <i data-lucide="building-2" class="h-6 w-6 text-blue-600"></i>
                        </div>
                    </div>
                </div>
                
                <div class="rounded-xl border bg-card p-6 card-hover">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-muted-foreground">Active Admins</p>
                            <h3 class="text-2xl font-bold mt-1">${data.activeAdmins}</h3>
                            <p class="text-xs text-green-600 mt-1 flex items-center gap-1">
                                <i data-lucide="trending-up" class="h-3 w-3"></i>
                                +${data.newAdmins} new
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
                            <p class="text-sm font-medium text-muted-foreground">Pending Approvals</p>
                            <h3 class="text-2xl font-bold mt-1">${data.pendingApprovals}</h3>
                            <p class="text-xs text-yellow-600 mt-1 flex items-center gap-1">
                                <i data-lucide="clock" class="h-3 w-3"></i>
                                Awaiting review
                            </p>
                        </div>
                        <div class="h-12 w-12 rounded-lg bg-amber-100 flex items-center justify-center">
                            <i data-lucide="alert-circle" class="h-6 w-6 text-amber-600"></i>
                        </div>
                    </div>
                </div>
                
                <div class="rounded-xl border bg-card p-6 card-hover">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-muted-foreground">Revenue (MTD)</p>
                            <h3 class="text-2xl font-bold mt-1">$${data.revenue}</h3>
                            <p class="text-xs text-green-600 mt-1 flex items-center gap-1">
                                <i data-lucide="trending-up" class="h-3 w-3"></i>
                                +${data.revenueGrowth}% from last month
                            </p>
                        </div>
                        <div class="h-12 w-12 rounded-lg bg-emerald-100 flex items-center justify-center">
                            <i data-lucide="dollar-sign" class="h-6 w-6 text-emerald-600"></i>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Charts Row -->
            <div class="grid gap-4 lg:grid-cols-2">
                <div class="rounded-xl border bg-card p-6">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="font-semibold">School Growth Trends</h3>
                        <select class="text-sm border rounded-md px-2 py-1 bg-background" onchange="updateSuperAdminChart(this.value)">
                            <option value="year">This Year</option>
                            <option value="last-year">Last Year</option>
                        </select>
                    </div>
                    <div class="chart-container h-64">
                        <canvas id="superadmin-enrollmentChart"></canvas>
                    </div>
                </div>
                
                <div class="rounded-xl border bg-card p-6">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="font-semibold">School Distribution</h3>
                        <select class="text-sm border rounded-md px-2 py-1 bg-background" onchange="updateSuperAdminPieChart(this.value)">
                            <option value="level">By Level</option>
                            <option value="region">By Region</option>
                        </select>
                    </div>
                    <div class="chart-container h-64">
                        <canvas id="superadmin-gradeChart"></canvas>
                    </div>
                </div>
            </div>
            
            <!-- Admin Management Table -->
            <div class="rounded-xl border bg-card overflow-hidden">
                <div class="p-4 border-b flex justify-between items-center">
                    <h3 class="font-semibold">School/Admin Management</h3>
                    <span class="text-sm text-muted-foreground">${data.totalSchools} total</span>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-sm">
                        <thead class="bg-muted/50">
                            <tr>
                                <th class="px-4 py-3 text-left font-medium">School</th>
                                <th class="px-4 py-3 text-left font-medium">Admin</th>
                                <th class="px-4 py-3 text-left font-medium">Level</th>
                                <th class="px-4 py-3 text-left font-medium">Status</th>
                                <th class="px-4 py-3 text-right font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y">
                            ${data.schools.map(school => `
                                <tr class="hover:bg-accent/50 transition-colors">
                                    <td class="px-4 py-3 font-medium">${school.name}</td>
                                    <td class="px-4 py-3">${school.adminEmail}</td>
                                    <td class="px-4 py-3">${school.level}</td>
                                    <td class="px-4 py-3">
                                        <span class="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${school.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}">
                                            ${school.status}
                                        </span>
                                    </td>
                                    <td class="px-4 py-3 text-right">
                                        <button onclick="viewSchool('${school.id}')" class="p-2 hover:bg-accent rounded-lg">
                                            <i data-lucide="eye" class="h-4 w-4"></i>
                                        </button>
                                        <button onclick="manageSchool('${school.id}')" class="p-2 hover:bg-accent rounded-lg">
                                            <i data-lucide="more-vertical" class="h-4 w-4"></i>
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <!-- Name Change Requests -->
            <div class="rounded-xl border bg-card">
                <div class="p-4 border-b">
                    <h3 class="font-semibold">Name Change Requests</h3>
                </div>
                <div class="divide-y">
                    ${data.nameChangeRequests.map(request => `
                        <div class="p-4 flex items-center justify-between hover:bg-accent/50 transition-colors">
                            <div>
                                <p class="text-sm font-medium">${request.oldName} → ${request.newName}</p>
                                <p class="text-xs text-muted-foreground">Payment: $${request.amount} verified • ${timeAgo(request.createdAt)}</p>
                            </div>
                            <div class="flex gap-2">
                                <button onclick="approveNameChange('${request.id}')" class="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full hover:bg-green-200">Approve</button>
                                <button onclick="rejectNameChange('${request.id}')" class="px-3 py-1 bg-red-100 text-red-700 text-xs rounded-full hover:bg-red-200">Reject</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

function renderAdminDashboard(data) {
    return `
        <div class="space-y-6 animate-fade-in">
            <!-- School Profile Card -->
            <div class="rounded-xl border bg-card p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 card-hover">
                <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <div class="flex items-center gap-3 mb-2">
                            <h2 class="text-2xl font-bold">${data.school.name}</h2>
                            <span class="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">${data.school.level}</span>
                        </div>
                        <div class="flex items-center gap-4">
                            <p class="text-sm"><span class="font-mono bg-muted px-2 py-1 rounded">SCH-ID: ${data.school.id}</span></p>
                            <button onclick="showNameChangeModal()" class="text-sm text-primary hover:underline">Change School Name ($${data.nameChangeFee})</button>
                        </div>
                    </div>
                    <div class="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm">
                        <p class="text-xs text-muted-foreground">Share this ID with teachers</p>
                        <p class="text-lg font-mono font-bold">${data.school.id}</p>
                    </div>
                </div>
            </div>
            
            <!-- Stats Grid -->
            <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div class="rounded-xl border bg-card p-6 card-hover">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-muted-foreground">Total Students</p>
                            <h3 class="text-2xl font-bold mt-1">${data.stats.totalStudents}</h3>
                            <p class="text-xs text-green-600 mt-1 flex items-center gap-1">
                                <i data-lucide="trending-up" class="h-3 w-3"></i>
                                +${data.stats.studentGrowth}% from last term
                            </p>
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
                            <h3 class="text-2xl font-bold mt-1">${data.stats.totalTeachers}</h3>
                            <p class="text-xs text-green-600 mt-1 flex items-center gap-1">
                                <i data-lucide="trending-up" class="h-3 w-3"></i>
                                +${data.stats.pendingTeachers} pending approval
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
                            <h3 class="text-2xl font-bold mt-1">${data.stats.totalClasses}</h3>
                            <p class="text-xs text-muted-foreground mt-1">Across ${data.stats.totalGrades} grades</p>
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
                            <h3 class="text-2xl font-bold mt-1">${data.stats.attendanceRate}%</h3>
                            <p class="text-xs text-yellow-600 mt-1 flex items-center gap-1">
                                <i data-lucide="alert-circle" class="h-3 w-3"></i>
                                -${data.stats.attendanceVariance}% from target
                            </p>
                        </div>
                        <div class="h-12 w-12 rounded-lg bg-amber-100 flex items-center justify-center">
                            <i data-lucide="calendar-check" class="h-6 w-6 text-amber-600"></i>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Charts Row -->
            <div class="grid gap-4 lg:grid-cols-2">
                <div class="rounded-xl border bg-card p-6">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="font-semibold">Enrollment Trends</h3>
                        <select class="text-sm border rounded-md px-2 py-1 bg-background" onchange="updateAdminChart(this.value)">
                            <option value="year">This Year</option>
                            <option value="last-year">Last Year</option>
                        </select>
                    </div>
                    <div class="chart-container h-64">
                        <canvas id="admin-enrollmentChart"></canvas>
                    </div>
                </div>
                
                <div class="rounded-xl border bg-card p-6">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="font-semibold">Grade Distribution</h3>
                        <select class="text-sm border rounded-md px-2 py-1 bg-background" onchange="updateAdminPieChart(this.value)">
                            <option value="all">All Grades</option>
                            <option value="9">Grade 9</option>
                            <option value="10">Grade 10</option>
                        </select>
                    </div>
                    <div class="chart-container h-64">
                        <canvas id="admin-gradeChart"></canvas>
                    </div>
                </div>
            </div>
            
            <!-- Teacher Approval Queue -->
            <div class="rounded-xl border bg-card overflow-hidden">
                <div class="p-4 border-b flex justify-between items-center">
                    <h3 class="font-semibold">Pending Teacher Approvals</h3>
                    <span class="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">${data.pendingTeachers.length} new</span>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-sm">
                        <thead class="bg-muted/50">
                            <tr>
                                <th class="px-4 py-3 text-left font-medium">Teacher</th>
                                <th class="px-4 py-3 text-left font-medium">Subject</th>
                                <th class="px-4 py-3 text-left font-medium">Applied</th>
                                <th class="px-4 py-3 text-right font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y">
                            ${data.pendingTeachers.map(teacher => `
                                <tr class="hover:bg-accent/50 transition-colors">
                                    <td class="px-4 py-3">
                                        <div class="flex items-center gap-3">
                                            <div class="h-8 w-8 rounded-full bg-violet-100 flex items-center justify-center">
                                                <span class="font-medium text-violet-700 text-sm">${getInitials(teacher.name)}</span>
                                            </div>
                                            <span class="font-medium">${teacher.name}</span>
                                        </div>
                                    </td>
                                    <td class="px-4 py-3">${teacher.subject}</td>
                                    <td class="px-4 py-3">${timeAgo(teacher.appliedAt)}</td>
                                    <td class="px-4 py-3 text-right">
                                        <button onclick="approveTeacher('${teacher.id}')" class="p-2 hover:bg-green-100 rounded-lg text-green-600">
                                            <i data-lucide="check" class="h-4 w-4"></i>
                                        </button>
                                        <button onclick="rejectTeacher('${teacher.id}')" class="p-2 hover:bg-red-100 rounded-lg text-red-600">
                                            <i data-lucide="x" class="h-4 w-4"></i>
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <!-- Calendar & Duty Management -->
            <div class="grid gap-4 md:grid-cols-2">
                <div class="rounded-xl border bg-card p-6">
                    <h3 class="font-semibold mb-4">School Calendar</h3>
                    <div class="space-y-3">
                        <div class="flex items-center gap-2">
                            <input type="date" id="event-date" class="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm">
                            <input type="text" id="event-name" placeholder="Event" class="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm">
                            <button onclick="addCalendarEvent()" class="px-3 py-2 bg-primary text-primary-foreground rounded-lg">Add</button>
                        </div>
                        <div class="mt-4 space-y-2">
                            ${data.calendar.map(event => `
                                <div class="flex justify-between text-sm p-2 bg-muted/30 rounded">
                                    <span>${event.name}</span>
                                    <span class="font-mono">${formatDate(event.date)}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
                
                <div class="rounded-xl border bg-card p-6">
                    <h3 class="font-semibold mb-4">Duty Assignment</h3>
                    <div class="space-y-3">
                        <select id="duty-teacher" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                            <option value="">Select Teacher</option>
                            ${data.teachers.map(teacher => `
                                <option value="${teacher.id}">${teacher.name}</option>
                            `).join('')}
                        </select>
                        <select id="duty-slot" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                            <option value="">Select Duty</option>
                            <option value="gate-morning">Main Gate (7:30-10:30)</option>
                            <option value="gate-afternoon">Main Gate (10:30-13:30)</option>
                            <option value="dining">Dining Hall (13:30-16:30)</option>
                        </select>
                        <button onclick="assignDuty()" class="w-full bg-primary text-primary-foreground py-2 rounded-lg">Assign Duty</button>
                    </div>
                    
                    <div class="mt-4">
                        <h4 class="text-sm font-medium mb-2">Today's Duty Roster</h4>
                        <div class="space-y-2">
                            ${data.todayDuty.map(duty => `
                                <div class="flex justify-between text-sm p-2 bg-muted/30 rounded">
                                    <span>${duty.location}</span>
                                    <span>${duty.teacher}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Personal Tools -->
            <div class="grid gap-4 md:grid-cols-2">
                <div class="rounded-xl border bg-card p-6">
                    <h3 class="font-semibold mb-4">My Tasks</h3>
                    <div class="space-y-2">
                        ${data.tasks.map(task => `
                            <div class="flex items-center gap-2 p-2 hover:bg-accent/50 rounded">
                                <input type="checkbox" ${task.completed ? 'checked' : ''} onchange="toggleTask('${task.id}')" class="rounded">
                                <span class="text-sm ${task.completed ? 'line-through text-muted-foreground' : ''}">${task.title}</span>
                                ${task.dueDate ? `<span class="text-xs text-red-600 ml-auto">Due ${formatDate(task.dueDate)}</span>` : ''}
                            </div>
                        `).join('')}
                    </div>
                    <button onclick="addTask()" class="mt-4 text-sm text-primary flex items-center gap-1">
                        <i data-lucide="plus" class="h-4 w-4"></i>
                        Add Task
                    </button>
                </div>
                
                <div class="rounded-xl border bg-card p-6">
                    <h3 class="font-semibold mb-4">My Timetable</h3>
                    <div class="space-y-2">
                        ${data.timetable.map(item => `
                            <div class="p-3 bg-muted/30 rounded">
                                <p class="text-sm font-medium">${item.time} - ${item.title}</p>
                                <p class="text-xs text-muted-foreground">${item.description}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
            
            <!-- Recent Activity -->
            <div class="rounded-xl border bg-card">
                <div class="p-4 border-b">
                    <h3 class="font-semibold">Recent Activity</h3>
                </div>
                <div class="divide-y">
                    ${data.recentActivity.map(activity => `
                        <div class="p-4 flex items-center gap-4 hover:bg-accent/50 transition-colors">
                            <div class="h-10 w-10 rounded-full ${activity.iconBg} flex items-center justify-center">
                                <i data-lucide="${activity.icon}" class="h-5 w-5 ${activity.iconColor}"></i>
                            </div>
                            <div class="flex-1">
                                <p class="text-sm font-medium">${activity.title}</p>
                                <p class="text-xs text-muted-foreground">${activity.description}</p>
                            </div>
                            <span class="text-xs text-muted-foreground">${timeAgo(activity.timestamp)}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

// Similar render functions for teacher, parent, and student dashboards...

function getInitials(name) {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

function timeAgo(timestamp) {
    const seconds = Math.floor((new Date() - new Date(timestamp)) / 1000);
    
    const intervals = {
        year: 31536000,
        month: 2592000,
        week: 604800,
        day: 86400,
        hour: 3600,
        minute: 60
    };
    
    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
        const interval = Math.floor(seconds / secondsInUnit);
        if (interval >= 1) {
            return `${interval} ${unit}${interval === 1 ? '' : 's'} ago`;
        }
    }
    
    return 'just now';
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

// Export functions
window.fetchDashboardData = fetchDashboardData;
window.renderDashboard = renderDashboard;
window.getInitials = getInitials;
window.timeAgo = timeAgo;
window.formatDate = formatDate;
