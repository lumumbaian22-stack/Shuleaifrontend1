function getTeacherRole() {
    const user = getCurrentUser();
    if (!user || user.role !== 'teacher') return 'subject_teacher';
    if (!user.teacher) user.teacher = {};
    // If type is set, use it
    if (user.teacher.type) return user.teacher.type;
    // Fallback: if classTeacher exists, assume class teacher
    if (user.teacher.classTeacher) return 'class_teacher';
    return 'subject_teacher';
}

    return user.teacher.type;
}

function isClassTeacher() {
    const role = getTeacherRole();
    return role === 'class_teacher' || role === 'both';
}

function isSubjectTeacher() {
    const role = getTeacherRole();
    return role === 'subject_teacher' || role === 'both';
}

function getTeacherRoleDescription() {
    const role = getTeacherRole();
    if (role === 'class_teacher') {
        return 'You are the Class Teacher. You can manage students, upload via CSV, and enter marks for all subjects in your class.';
    } else if (role === 'subject_teacher') {
        return 'You are a Subject Teacher. You can enter marks for your assigned subjects and classes.';
    } else if (role === 'both') {
        return 'You are both a Class Teacher and Subject Teacher. You have full access to student management and marks entry.';
    }
    return 'Manage your classes, students, and grades.';
}

// ============ RENDER SECTION ============

async function renderTeacherSection(section) {
    try {
        switch(section) {
            case 'dashboard':
                return renderTeacherDashboard();
            case 'students':
                if (isClassTeacher()) {
                    return await renderTeacherStudents();
                } else {
                    return `<div class="text-center py-12"><i data-lucide="lock" class="h-12 w-12 mx-auto text-muted-foreground mb-3"></i><p class="text-muted-foreground">Only Class Teachers can manage students.</p></div>`;
                }
            case 'attendance':
                return await renderTeacherAttendance();
            case 'grades':
            case 'marks':
                return await renderTeacherMarksEntry();
            case 'my-subjects':
                if (isSubjectTeacher()) {
                    return await renderTeacherSubjects();
                } else {
                    return `<div class="text-center py-12"><i data-lucide="lock" class="h-12 w-12 mx-auto text-muted-foreground mb-3"></i><p class="text-muted-foreground">You are not assigned as a Subject Teacher.</p></div>`;
                }
            case 'my-class':
                if (isClassTeacher()) {
                    return await renderTeacherClassDashboard();
                } else {
                    return `<div class="text-center py-12"><i data-lucide="lock" class="h-12 w-12 mx-auto text-muted-foreground mb-3"></i><p class="text-muted-foreground">You are not assigned as a Class Teacher.</p></div>`;
                }
            case 'tasks':
                return renderTeacherTasks();
            case 'duty':
                return await renderTeacherDuty();
            case 'duty-preferences':
                return renderTeacherDutyPreferences();
            case 'chat':
                return renderTeacherChat();
            case 'settings':
                return renderUserSettings('teacher');
            default:
                return renderTeacherDashboard();
        }
    } catch (error) {
        console.error('Error rendering teacher section:', error);
        return `<div class="text-center py-12 text-red-500">Error loading section: ${error.message}</div>`;
    }
}

function renderUserSettings(role) {
    return `
        <div class="space-y-6 animate-fade-in max-w-4xl mx-auto">
            <div class="rounded-xl border bg-card p-6">
                <h2 class="text-2xl font-bold mb-4">${role === 'teacher' ? 'Teacher' : 'User'} Settings</h2>
                <p class="text-muted-foreground">Account management and preferences</p>
                
                <div class="mt-6 space-y-4">
                    <div class="border-t pt-4">
                        <h3 class="font-semibold mb-2">Profile Information</h3>
                        <p class="text-sm text-muted-foreground">Name: ${escapeHtml(getCurrentUser()?.name || 'N/A')}</p>
                        <p class="text-sm text-muted-foreground">Email: ${escapeHtml(getCurrentUser()?.email || 'N/A')}</p>
                        <p class="text-sm text-muted-foreground">Role: ${role}</p>
                    </div>
                    
                    <div class="border-t pt-4">
                        <h3 class="font-semibold mb-2">Class Information</h3>
                        <p class="text-sm text-muted-foreground">Assigned Class: ${escapeHtml(getTeacherAssignedClass()?.name || 'None')}</p>
                        <p class="text-sm text-muted-foreground">Teacher Type: ${getTeacherRole()}</p>
                    </div>
                    
                    <div class="border-t pt-4">
                        <h3 class="font-semibold mb-2">Change Password</h3>
                        <div class="space-y-3">
                            <input type="password" id="current-password" placeholder="Current Password" class="w-full rounded-lg border p-2">
                            <input type="password" id="new-password" placeholder="New Password" class="w-full rounded-lg border p-2">
                            <input type="password" id="confirm-password" placeholder="Confirm Password" class="w-full rounded-lg border p-2">
                            <button onclick="handleChangePassword()" class="px-4 py-2 bg-primary text-white rounded-lg">Update Password</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// ============ TEACHER DASHBOARD ============

function renderTeacherDashboard() {
    const data = dashboardData || {};
    const user = getCurrentUser();
    const role = getTeacherRole();
    
    let roleBadge = '';
    if (role === 'class_teacher') roleBadge = '<span class="ml-2 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded-full">Class Teacher</span>';
    else if (role === 'subject_teacher') roleBadge = '<span class="ml-2 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full">Subject Teacher</span>';
    else if (role === 'both') roleBadge = '<span class="ml-2 px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs rounded-full">Class & Subject Teacher</span>';
    
    return `
        <div class="space-y-6 animate-fade-in">
            <!-- Welcome Header -->
            <div class="rounded-xl border bg-card p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700">
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <div class="flex items-center flex-wrap gap-2">
                            <h2 class="text-2xl font-bold">Welcome, ${escapeHtml(user?.name || 'Teacher')}!</h2>
                            ${roleBadge}
                        </div>
                        <p class="text-muted-foreground mt-1 text-sm">${getTeacherRoleDescription()}</p>
                    </div>
                    ${isClassTeacher() ? `
                        <button onclick="showCSVUploadModal()" class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2 shadow-sm">
                            <i data-lucide="upload" class="h-4 w-4"></i>
                            Upload Students (CSV)
                        </button>
                    ` : ''}
                </div>
            </div>

            <!-- Stats Grid -->
            <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div class="rounded-xl border bg-card p-6 card-hover">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-muted-foreground">My Students</p>
                            <h3 class="text-2xl font-bold mt-1" id="my-students-count">${data.students?.length || 0}</h3>
                            <p class="text-xs text-muted-foreground mt-1">Across ${data.classes?.length || 1} class(es)</p>
                        </div>
                        <div class="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <i data-lucide="users" class="h-6 w-6 text-blue-600 dark:text-blue-400"></i>
                        </div>
                    </div>
                </div>

                <div class="rounded-xl border bg-card p-6 card-hover">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-muted-foreground">My Subjects</p>
                            <h3 class="text-2xl font-bold mt-1" id="my-subjects-count">${data.subjects?.length || 0}</h3>
                            <p class="text-xs text-muted-foreground mt-1">Assigned to teach</p>
                        </div>
                        <div class="h-12 w-12 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                            <i data-lucide="book-open" class="h-6 w-6 text-violet-600 dark:text-violet-400"></i>
                        </div>
                    </div>
                </div>

                <div class="rounded-xl border bg-card p-6 card-hover">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-muted-foreground">Attendance Today</p>
                            <h3 class="text-2xl font-bold mt-1" id="attendance-today">0/0</h3>
                            <p class="text-xs text-yellow-600 dark:text-yellow-400 mt-1">Not taken yet</p>
                        </div>
                        <div class="h-12 w-12 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                            <i data-lucide="calendar-check" class="h-6 w-6 text-amber-600 dark:text-amber-400"></i>
                        </div>
                    </div>
                </div>

                <div class="rounded-xl border bg-card p-6 card-hover">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-muted-foreground">Pending Tasks</p>
                            <h3 class="text-2xl font-bold mt-1" id="pending-tasks">0</h3>
                            <p class="text-xs text-red-600 dark:text-red-400 mt-1">Marks to enter</p>
                        </div>
                        <div class="h-12 w-12 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                            <i data-lucide="check-square" class="h-6 w-6 text-red-600 dark:text-red-400"></i>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Quick Actions based on Role -->
            <div class="grid gap-4 md:grid-cols-3">
                ${isClassTeacher() ? `
                    <button onclick="showDashboardSection('my-class')" class="p-4 border rounded-lg hover:bg-accent transition-colors text-left group">
                        <i data-lucide="graduation-cap" class="h-6 w-6 text-blue-600 mb-2 group-hover:scale-110 transition-transform"></i>
                        <p class="font-medium">My Class Dashboard</p>
                        <p class="text-xs text-muted-foreground">View class overview and analytics</p>
                    </button>
                ` : ''}
                
                ${isSubjectTeacher() ? `
                    <button onclick="showDashboardSection('my-subjects')" class="p-4 border rounded-lg hover:bg-accent transition-colors text-left group">
                        <i data-lucide="book-open" class="h-6 w-6 text-green-600 mb-2 group-hover:scale-110 transition-transform"></i>
                        <p class="font-medium">My Subjects</p>
                        <p class="text-xs text-muted-foreground">View subjects and classes you teach</p>
                    </button>
                ` : ''}
                
                <button onclick="showDashboardSection('marks')" class="p-4 border rounded-lg hover:bg-accent transition-colors text-left group">
                    <i data-lucide="trending-up" class="h-6 w-6 text-purple-600 mb-2 group-hover:scale-110 transition-transform"></i>
                    <p class="font-medium">Enter Marks</p>
                    <p class="text-xs text-muted-foreground">Record student grades and assessments</p>
                </button>
                
                <button onclick="showDashboardSection('attendance')" class="p-4 border rounded-lg hover:bg-accent transition-colors text-left group">
                    <i data-lucide="calendar-check" class="h-6 w-6 text-amber-600 mb-2 group-hover:scale-110 transition-transform"></i>
                    <p class="font-medium">Take Attendance</p>
                    <p class="text-xs text-muted-foreground">Mark today's attendance</p>
                </button>
            </div>

            <!-- Parent Messages Inbox -->
            <div class="rounded-xl border bg-card p-6">
                <div class="flex justify-between items-center mb-4">
                    <div class="flex items-center gap-2">
                        <i data-lucide="message-circle" class="h-5 w-5 text-primary"></i>
                        <h3 class="font-semibold text-lg">Parent Messages</h3>
                    </div>
                    <span class="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-1 rounded-full text-xs font-medium" id="teacher-message-count-badge">0</span>
                </div>
                <div id="teacher-messages-list" class="space-y-2 max-h-96 overflow-y-auto">
                    <div class="text-center text-muted-foreground py-8">
                        <i data-lucide="message-circle" class="h-12 w-12 mx-auto mb-3 opacity-50"></i>
                        <p>Loading messages...</p>
                    </div>
                </div>
                <button onclick="loadTeacherMessages()" class="mt-4 w-full py-2 text-sm border rounded-lg hover:bg-accent flex items-center justify-center gap-2 transition-colors">
                    <i data-lucide="refresh-cw" class="h-4 w-4"></i>
                    Refresh Messages
                </button>
            </div>

            <!-- Duty Card -->
            <div class="rounded-xl border bg-card p-6" id="duty-card">
                <div class="flex justify-between items-start">
                    <div>
                        <h3 class="font-semibold">Today's Duty</h3>
                        <p class="text-sm text-muted-foreground" id="duty-location">${data.todayDuty?.duties?.find(d => d.teacherId === user?.id)?.area || 'No duty today'}</p>
                    </div>
                    <span class="duty-status px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs rounded-full" id="duty-status">Not Checked In</span>
                </div>
                <div class="mt-4 flex gap-3">
                    <button onclick="handleCheckIn()" class="flex-1 bg-primary text-primary-foreground py-2 rounded-lg hover:bg-primary/90 transition-colors" id="check-in-btn">
                        <i data-lucide="log-in" class="inline h-4 w-4 mr-2"></i>
                        Check In
                    </button>
                    <button onclick="handleCheckOut()" class="flex-1 border border-input bg-background py-2 rounded-lg hover:bg-accent transition-colors" id="check-out-btn" disabled>
                        <i data-lucide="log-out" class="inline h-4 w-4 mr-2"></i>
                        Check Out
                    </button>
                </div>
                <div class="mt-3 text-xs text-muted-foreground" id="duty-rating">
                    Last duty rating: <span id="last-rating">4.5</span>/5
                </div>
            </div>
        </div>
    `;
}



// ============ TEACHER CLASS DASHBOARD ============

async function renderTeacherClassDashboard() {
    const user = getCurrentUser();
    const teacherClass = user?.teacher?.classId || null;
    
    if (!teacherClass) {
        return `<div class="text-center py-12"><i data-lucide="school" class="h-12 w-12 mx-auto text-muted-foreground mb-3"></i><p class="text-muted-foreground">No class assigned to you as Class Teacher.</p></div>`;
    }
    
    let students = [];
    let classData = null;
    
    showLoading();
    try {
        students = await loadMyStudents();
        classData = await api.admin.getClassDetails(teacherClass);
    } catch (error) {
        console.error('Error loading class data:', error);
        students = dashboardData?.students || [];
    } finally {
        hideLoading();
    }
    
    const avgScore = calculateClassAverage(students);
    const attendanceRate = calculateClassAttendance(students);
    const topPerformer = getTopPerformer(students);
    
    return `
        <div class="space-y-6 animate-fade-in">
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 class="text-2xl font-bold">My Class: ${escapeHtml(classData?.name || 'Your Class')}</h2>
                    <p class="text-muted-foreground mt-1">${students.length} students enrolled</p>
                </div>
                <button onclick="showCSVUploadModal()" class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2 shadow-sm">
                    <i data-lucide="upload" class="h-4 w-4"></i>
                    Upload Students
                </button>
            </div>
            
            <!-- Class Analytics -->
            <div class="grid gap-4 md:grid-cols-3">
                <div class="rounded-xl border bg-card p-4 text-center">
                    <p class="text-sm text-muted-foreground">Class Average</p>
                    <p class="text-3xl font-bold ${avgScore >= 80 ? 'text-green-600' : avgScore >= 60 ? 'text-yellow-600' : 'text-red-600'}">${avgScore}%</p>
                </div>
                <div class="rounded-xl border bg-card p-4 text-center">
                    <p class="text-sm text-muted-foreground">Attendance Rate</p>
                    <p class="text-3xl font-bold text-blue-600">${attendanceRate}%</p>
                </div>
                <div class="rounded-xl border bg-card p-4 text-center">
                    <p class="text-sm text-muted-foreground">Top Performer</p>
                    <p class="text-lg font-bold truncate">${escapeHtml(topPerformer)}</p>
                </div>
            </div>
            
            <!-- Student List -->
            <div class="rounded-xl border bg-card overflow-hidden">
                <div class="p-4 border-b bg-muted/30">
                    <h3 class="font-semibold">Student List</h3>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-sm">
                        <thead class="bg-muted/50">
                            <tr>
                                <th class="px-4 py-3 text-left font-medium">Student</th>
                                <th class="px-4 py-3 text-left font-medium">ELIMUID</th>
                                <th class="px-4 py-3 text-center font-medium">Average</th>
                                <th class="px-4 py-3 text-center font-medium">Attendance</th>
                                <th class="px-4 py-3 text-right font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y">
                            ${students.map(student => `
                                <tr class="hover:bg-accent/50 transition-colors">
                                    <td class="px-4 py-3 font-medium">${escapeHtml(student.User?.name || 'Unknown')} </td>
                                    <td class="px-4 py-3"><span class="font-mono text-xs bg-muted px-2 py-1 rounded">${student.elimuid || 'N/A'}</span></td>
                                    <td class="px-4 py-3 text-center">${student.average || 0}%</td>
                                    <td class="px-4 py-3 text-center">${student.attendance || 95}%</td>
                                    <td class="px-4 py-3 text-right">
                                        <button onclick="viewStudentDetails('${student.id}')" class="p-2 hover:bg-accent rounded-lg transition-colors" title="View Details">
                                            <i data-lucide="eye" class="h-4 w-4"></i>
                                        </button>
                                        <button onclick="openMarksEntryForStudent('${student.id}', '${escapeHtml(student.User?.name || 'Unknown')}')" class="p-2 hover:bg-accent rounded-lg transition-colors" title="Enter Marks">
                                            <i data-lucide="edit-3" class="h-4 w-4"></i>
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                            ${students.length === 0 ? '<tr><td colspan="5" class="px-4 py-8 text-center text-muted-foreground">No students in this class yet. Click "Upload Students" to add them.</td></tr>' : ''}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

// ============ TEACHER SUBJECTS DASHBOARD ============

async function renderTeacherSubjects() {
    const user = getCurrentUser();
    const teacherSubjects = user?.teacher?.subjects || [];
    const subjectList = Array.isArray(teacherSubjects) ? teacherSubjects : [];
    
    if (subjectList.length === 0) {
        return `<div class="text-center py-12"><i data-lucide="book-open" class="h-12 w-12 mx-auto text-muted-foreground mb-3"></i><p class="text-muted-foreground">No subjects assigned to you yet.</p></div>`;
    }
    
    return `
        <div class="space-y-6 animate-fade-in">
            <h2 class="text-2xl font-bold">My Subjects</h2>
            <p class="text-muted-foreground">Select a subject to enter marks for that class</p>
            
            <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                ${subjectList.map(subject => `
                    <div class="rounded-xl border bg-card p-5 hover:shadow-md transition-all">
                        <div class="flex items-center gap-3 mb-3">
                            <div class="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                <i data-lucide="book" class="h-6 w-6 text-primary"></i>
                            </div>
                            <div>
                                <h3 class="font-semibold text-lg">${escapeHtml(subject.name)}</h3>
                                <p class="text-xs text-muted-foreground">${subject.classes?.length || 1} class(es)</p>
                            </div>
                        </div>
                        <div class="space-y-2">
                            ${(subject.classes || []).map(cls => `
                                <div class="flex justify-between items-center p-2 bg-muted/30 rounded-lg">
                                    <div>
                                        <span class="text-sm font-medium">${escapeHtml(cls.name)}</span>
                                        <span class="text-xs text-muted-foreground ml-2">${cls.studentCount || 0} students</span>
                                    </div>
                                    <button onclick="openMarksEntry('${escapeHtml(subject.name)}', '${cls.id}', '${escapeHtml(cls.name)}')" 
                                            class="px-3 py-1 bg-primary text-primary-foreground text-xs rounded-lg hover:bg-primary/90 transition-colors">
                                        Enter Marks
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// ============ MARKS ENTRY SYSTEM ============

async function renderTeacherMarksEntry() {
    const user = getCurrentUser();
    const teacherClass = user?.teacher?.classId;
    const teacherSubjects = user?.teacher?.subjects || [];
    const subjectList = Array.isArray(teacherSubjects) ? teacherSubjects : [];
    
    const assignments = [];
    
    if (teacherClass && isClassTeacher()) {
        assignments.push({
            type: 'class',
            id: teacherClass,
            name: 'My Class',
            subject: 'All Subjects',
            isClassTeacher: true
        });
    }
    
    subjectList.forEach(subject => {
        (subject.classes || []).forEach(cls => {
            assignments.push({
                type: 'subject',
                id: cls.id,
                name: cls.name,
                subject: subject.name,
                isClassTeacher: false
            });
        });
    });
    
    if (assignments.length === 0) {
        return `<div class="text-center py-12"><i data-lucide="edit-3" class="h-12 w-12 mx-auto text-muted-foreground mb-3"></i><p class="text-muted-foreground">No classes or subjects assigned to you yet.</p><p class="text-sm text-muted-foreground mt-1">Contact your school admin to assign you as a Class Teacher or Subject Teacher.</p></div>`;
    }
    
    return `
        <div class="space-y-6 animate-fade-in">
            <div>
                <h2 class="text-2xl font-bold">Enter Marks</h2>
                <p class="text-muted-foreground mt-1">Select a class and subject to enter student grades</p>
            </div>
            
            <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                ${assignments.map(ass => `
                    <div class="rounded-xl border bg-card p-5 hover:shadow-md transition-all cursor-pointer group" 
                         onclick="openMarksEntry('${escapeHtml(ass.subject)}', '${ass.id}', '${escapeHtml(ass.name)}')">
                        <div class="flex items-center gap-3 mb-3">
                            <div class="h-12 w-12 rounded-xl ${ass.type === 'class' ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-green-100 dark:bg-green-900/30'} flex items-center justify-center">
                                <i data-lucide="${ass.type === 'class' ? 'graduation-cap' : 'book'}" class="h-6 w-6 ${ass.type === 'class' ? 'text-blue-600' : 'text-green-600'}"></i>
                            </div>
                            <div>
                                <p class="font-semibold text-lg">${escapeHtml(ass.name)}</p>
                                <p class="text-sm text-muted-foreground">${escapeHtml(ass.subject)}</p>
                            </div>
                        </div>
                        <button class="w-full mt-2 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors group-hover:shadow-md">
                            <i data-lucide="edit-3" class="h-3 w-3 inline mr-1"></i>
                            Enter Marks
                        </button>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// ============ MARKS ENTRY MODAL ============

let currentMarksClassId = null;
let currentMarksSubject = null;
let currentMarksClassName = null;
let currentMarksStudents = [];

async function openMarksEntry(subject, classId, className) {
    currentMarksSubject = subject;
    currentMarksClassId = classId;
    currentMarksClassName = className;
    
    showLoading();
    try {
        const response = await api.teacher.getClassStudents(classId);
        currentMarksStudents = response.data || [];
        
        if (currentMarksStudents.length === 0) {
            showToast('No students found in this class', 'warning');
            hideLoading();
            return;
        }
        
        showMarksEntryModal();
    } catch (error) {
        console.error('Error loading students:', error);
        showToast('Failed to load students', 'error');
    } finally {
        hideLoading();
    }
}

function openMarksEntryForStudent(studentId, studentName) {
    if (!currentMarksClassId) {
        showToast('Please select a class first', 'error');
        return;
    }
    showMarksEntryModal();
}

function showMarksEntryModal() {
    let modal = document.getElementById('marks-entry-modal');
    if (!modal) {
        createMarksEntryModal();
        modal = document.getElementById('marks-entry-modal');
    }
    
    const modalContent = modal.querySelector('.modal-content');
    const assessmentTypes = ['test', 'exam', 'assignment', 'project', 'quiz'];
    const today = new Date().toISOString().split('T')[0];
    
    modalContent.innerHTML = `
        <div class="space-y-4">
            <div class="border-b pb-3 flex justify-between items-center sticky top-0 bg-card">
                <div>
                    <h3 class="text-lg font-semibold">Enter Marks</h3>
                    <p class="text-sm text-muted-foreground">${escapeHtml(currentMarksClassName)} - ${escapeHtml(currentMarksSubject)}</p>
                </div>
                <button onclick="closeMarksEntryModal()" class="p-2 hover:bg-accent rounded-lg transition-colors">
                    <i data-lucide="x" class="h-5 w-5"></i>
                </button>
            </div>
            
            <div class="flex flex-wrap gap-3 mb-4">
                <select id="assessment-type" class="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary">
                    ${assessmentTypes.map(type => `<option value="${type}">${type.charAt(0).toUpperCase() + type.slice(1)}</option>`).join('')}
                </select>
                <input type="text" id="assessment-name" placeholder="Assessment Name (e.g., Mid-term, Week 3 Test)" 
                       class="flex-1 min-w-[200px] rounded-lg border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary">
                <input type="date" id="assessment-date" value="${today}" 
                       class="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary">
            </div>
            
            <div class="overflow-x-auto max-h-[55vh] overflow-y-auto border rounded-lg">
                <table class="w-full text-sm">
                    <thead class="bg-muted/50 sticky top-0">
                        <tr>
                            <th class="px-4 py-3 text-left font-medium">Student</th>
                            <th class="px-4 py-3 text-left font-medium">ELIMUID</th>
                            <th class="px-4 py-3 text-center font-medium w-32">Score (%)</th>
                            <th class="px-4 py-3 text-center font-medium w-24">Grade</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y">
                        ${currentMarksStudents.map(student => `
                            <tr class="hover:bg-accent/50 transition-colors">
                                <td class="px-4 py-2 font-medium">${escapeHtml(student.User?.name || 'Unknown')}</td>
                                <td class="px-4 py-2"><span class="font-mono text-xs">${student.elimuid || 'N/A'}</span></td>
                                <td class="px-4 py-2 text-center">
                                    <input type="number" id="score-${student.id}" class="score-input w-24 rounded border border-input px-2 py-1 text-center focus:ring-2 focus:ring-primary" 
                                           min="0" max="100" step="0.5" value="" onchange="updateGradeDisplayForStudent('${student.id}')">
                                </td>
                                <td class="px-4 py-2 text-center">
                                    <span id="grade-${student.id}" class="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs rounded-full">-</span>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            
            <div class="flex justify-end gap-3 pt-4 border-t">
                <button onclick="closeMarksEntryModal()" class="px-4 py-2 border rounded-lg hover:bg-accent transition-colors">Cancel</button>
                <button onclick="saveAllMarks()" class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2">
                    <i data-lucide="save" class="h-4 w-4"></i>
                    Save All Marks
                </button>
            </div>
        </div>
    `;
    
    modal.classList.remove('hidden');
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function createMarksEntryModal() {
    const modalHTML = `
        <div id="marks-entry-modal" class="fixed inset-0 z-50 hidden">
            <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" onclick="closeMarksEntryModal()"></div>
            <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-5xl p-4">
                <div class="rounded-xl border bg-card shadow-2xl animate-fade-in max-h-[90vh] overflow-hidden flex flex-col">
                    <div class="modal-content p-6 overflow-y-auto"></div>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeMarksEntryModal() {
    const modal = document.getElementById('marks-entry-modal');
    if (modal) modal.classList.add('hidden');
    currentMarksClassId = null;
    currentMarksSubject = null;
    currentMarksStudents = [];
}

window.updateGradeDisplayForStudent = function(studentId) {
    const scoreInput = document.getElementById(`score-${studentId}`);
    const gradeSpan = document.getElementById(`grade-${studentId}`);
    const score = parseFloat(scoreInput?.value);
    
    if (!isNaN(score) && score >= 0 && score <= 100) {
        let grade = '';
        let color = 'gray';
        
        if (score >= 80) { grade = 'A'; color = 'green'; }
        else if (score >= 75) { grade = 'A-'; color = 'green'; }
        else if (score >= 70) { grade = 'B+'; color = 'blue'; }
        else if (score >= 65) { grade = 'B'; color = 'blue'; }
        else if (score >= 60) { grade = 'B-'; color = 'blue'; }
        else if (score >= 55) { grade = 'C+'; color = 'yellow'; }
        else if (score >= 50) { grade = 'C'; color = 'yellow'; }
        else if (score >= 45) { grade = 'C-'; color = 'yellow'; }
        else if (score >= 40) { grade = 'D+'; color = 'orange'; }
        else if (score >= 35) { grade = 'D'; color = 'orange'; }
        else if (score >= 30) { grade = 'D-'; color = 'orange'; }
        else { grade = 'E'; color = 'red'; }
        
        gradeSpan.textContent = grade;
        gradeSpan.className = `px-2 py-1 bg-${color}-100 dark:bg-${color}-900/30 text-${color}-700 dark:text-${color}-400 text-xs rounded-full`;
    } else {
        gradeSpan.textContent = '-';
        gradeSpan.className = 'px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs rounded-full';
    }
};

async function saveAllMarks() {
    const assessmentType = document.getElementById('assessment-type')?.value;
    const assessmentName = document.getElementById('assessment-name')?.value;
    const assessmentDate = document.getElementById('assessment-date')?.value;
    
    if (!assessmentName) {
        showToast('Please enter an assessment name', 'error');
        return;
    }
    
    showLoading();
    
    let saved = 0;
    let failed = 0;
    const marksData = [];
    
    for (const student of currentMarksStudents) {
        const scoreInput = document.getElementById(`score-${student.id}`);
        const score = parseFloat(scoreInput?.value);
        
        if (!isNaN(score) && score >= 0 && score <= 100) {
            marksData.push({
                studentId: student.id,
                classId: currentMarksClassId,
                subject: currentMarksSubject,
                assessmentType: assessmentType,
                assessmentName: assessmentName,
                score: score,
                date: assessmentDate
            });
        }
    }
    
    if (marksData.length === 0) {
        showToast('No marks entered to save', 'warning');
        hideLoading();
        return;
    }
    
    try {
        for (const data of marksData) {
            await api.teacher.enterMarks(data);
            saved++;
        }
        
        if (saved > 0) {
            showToast(`✅ Saved marks for ${saved} student(s)`, 'success');
            closeMarksEntryModal();
            
            if (typeof refreshMyStudents === 'function') refreshMyStudents();
        }
        
        if (failed > 0) {
            showToast(`⚠️ Failed to save for ${failed} student(s)`, 'warning');
        }
    } catch (error) {
        console.error('Error saving marks:', error);
        showToast(error.message || 'Failed to save marks', 'error');
    } finally {
        hideLoading();
    }
}

// ============ HELPER FUNCTIONS ============

function calculateClassAverage(students) {
    if (!students || students.length === 0) return 0;
    const validScores = students.filter(s => s.average && s.average > 0);
    if (validScores.length === 0) return 0;
    const sum = validScores.reduce((acc, s) => acc + (s.average || 0), 0);
    return Math.round(sum / validScores.length);
}

function calculateClassAttendance(students) {
    if (!students || students.length === 0) return 0;
    const sum = students.reduce((acc, s) => acc + (s.attendance || 95), 0);
    return Math.round(sum / students.length);
}

function getTopPerformer(students) {
    if (!students || students.length === 0) return 'N/A';
    const top = [...students].sort((a, b) => (b.average || 0) - (a.average || 0))[0];
    return top.User?.name || 'Unknown';
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============ EXISTING FUNCTIONS (Placeholders - keep from your original) ============

async function renderTeacherStudents() {
    const students = await loadMyStudents();
    return renderStudentsTable(students);
}

async function renderTeacherAttendance() {
    const students = await loadMyStudents();
    return `
        <div class="space-y-6 animate-fade-in">
            <h2 class="text-2xl font-bold">Take Attendance</h2>
            <div class="rounded-xl border bg-card overflow-hidden">
                <div class="p-4 border-b bg-muted/30 flex justify-between items-center">
                    <div class="flex items-center gap-4">
                        <span class="flex items-center gap-2"><span class="h-3 w-3 bg-green-500 rounded-full"></span> Present</span>
                        <span class="flex items-center gap-2"><span class="h-3 w-3 bg-red-500 rounded-full"></span> Absent</span>
                        <span class="flex items-center gap-2"><span class="h-3 w-3 bg-yellow-500 rounded-full"></span> Late</span>
                    </div>
                    <button onclick="saveAttendance()" class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">Save Attendance</button>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-sm">
                        <thead class="bg-muted/50">
                            <tr>
                                <th class="px-4 py-3 text-left">Student</th>
                                <th class="px-4 py-3 text-left">ELIMUID</th>
                                <th class="px-4 py-3 text-center">Status</th>
                                <th class="px-4 py-3 text-left">Notes</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${students.map(student => `
                                <tr data-student-id="${student.id}">
                                    <td class="px-4 py-3 font-medium">${escapeHtml(student.User?.name)}</td>
                                    <td class="px-4 py-3"><span class="font-mono text-xs">${student.elimuid}</span></td>
                                    <td class="px-4 py-3 text-center">
                                        <select class="attendance-status rounded border px-2 py-1">
                                            <option value="present">Present</option>
                                            <option value="absent">Absent</option>
                                            <option value="late">Late</option>
                                            <option value="sick">Sick</option>
                                        </select>
                                    </td>
                                    <td class="px-4 py-3"><input type="text" class="attendance-note w-full rounded border px-2 py-1" placeholder="Note"></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

function renderTeacherTasks() {
    return `
        <div class="space-y-6 animate-fade-in">
            <div class="flex justify-between items-center">
                <h2 class="text-2xl font-bold">My Tasks</h2>
                <button onclick="addTeacherTask()" class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">+ New Task</button>
            </div>
            <div class="grid gap-4 md:grid-cols-2">
                <div class="rounded-xl border bg-card p-6">
                    <h3 class="font-semibold mb-4">Pending Tasks</h3>
                    <div class="space-y-2">
                        <div class="flex items-center gap-3 p-3 hover:bg-accent/50 rounded-lg">
                            <input type="checkbox" class="rounded">
                            <div class="flex-1">
                                <p class="font-medium">Grade Mathematics exams</p>
                                <p class="text-sm text-muted-foreground">Due: ${formatDate(new Date(Date.now() + 2*24*60*60*1000))}</p>
                            </div>
                            <span class="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">Urgent</span>
                        </div>
                    </div>
                </div>
                <div class="rounded-xl border bg-card p-6">
                    <h3 class="font-semibold mb-4">Completed Tasks</h3>
                    <div class="space-y-2">
                        <div class="flex items-center gap-3 p-3 hover:bg-accent/50 rounded-lg">
                            <input type="checkbox" class="rounded" checked disabled>
                            <div class="flex-1">
                                <p class="font-medium line-through text-muted-foreground">Update gradebook</p>
                                <p class="text-sm text-muted-foreground">Completed ${formatDate(new Date(Date.now() - 1*24*60*60*1000))}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Add this function to get teacher's assigned class
function getTeacherAssignedClass() {
    const user = getCurrentUser();

    if (!user || user.role !== 'teacher') return null;

    // Ensure teacher object exists
    if (!user.teacher) {
        user.teacher = {};
        saveUser(user);
    }

    return {
        id: user.teacher?.classId || null,
        name: user.teacher?.className || null,
        studentCount: user.teacher?.studentCount || 0
    };
}

// Update your renderTeacherDashboard function to use this
async function renderTeacherDashboard() {
    const data = dashboardData || {};
    const user = getCurrentUser();
    const role = getTeacherRole();
    const teacherClass = await getTeacherAssignedClass();
    const hasClass = teacherClass !== null;
    const className = teacherClass?.name || 'No class assigned';
    const studentCount = teacherClass?.studentCount || 0;
    
    let roleBadge = '';
    if (role === 'class_teacher') roleBadge = '<span class="ml-2 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded-full">Class Teacher</span>';
    else if (role === 'subject_teacher') roleBadge = '<span class="ml-2 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full">Subject Teacher</span>';
    else if (role === 'both') roleBadge = '<span class="ml-2 px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs rounded-full">Class & Subject Teacher</span>';
    
    const classInfo = hasClass ? `
        <div class="mt-3 p-3 bg-primary/10 rounded-lg inline-block">
            <span class="text-sm font-medium">📚 Your Class: </span>
            <span class="text-sm font-bold text-primary">${escapeHtml(className)}</span>
            <span class="text-xs text-muted-foreground ml-2">(${studentCount} students)</span>
        </div>
    ` : '';
    
    return `
        <div class="space-y-6 animate-fade-in">
            <!-- Welcome Header -->
            <div class="rounded-xl border bg-card p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700">
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <div class="flex items-center flex-wrap gap-2">
                            <h2 class="text-2xl font-bold">Welcome, ${escapeHtml(user?.name || 'Teacher')}!</h2>
                            ${roleBadge}
                        </div>
                        <p class="text-muted-foreground mt-1 text-sm">${getTeacherRoleDescription()}</p>
                        ${classInfo}
                    </div>
                    ${hasClass ? `
                        <button onclick="showCSVUploadModal()" class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2 shadow-sm">
                            <i data-lucide="upload" class="h-4 w-4"></i>
                            Upload Students (CSV)
                        </button>
                    ` : ''}
                </div>
            </div>
            
            <!-- Rest of your dashboard... -->
            <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div class="rounded-xl border bg-card p-6 card-hover">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-muted-foreground">My Students</p>
                            <h3 class="text-2xl font-bold mt-1">${studentCount}</h3>
                            <p class="text-xs text-muted-foreground mt-1">In ${className !== 'No class assigned' ? className : 'your class'}</p>
                        </div>
                        <div class="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <i data-lucide="users" class="h-6 w-6 text-blue-600 dark:text-blue-400"></i>
                        </div>
                    </div>
                </div>
                
                <div class="rounded-xl border bg-card p-6 card-hover">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-muted-foreground">Class Average</p>
                            <h3 class="text-2xl font-bold mt-1">0%</h3>
                            <p class="text-xs text-muted-foreground mt-1">No marks yet</p>
                        </div>
                        <div class="h-12 w-12 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                            <i data-lucide="trending-up" class="h-6 w-6 text-violet-600 dark:text-violet-400"></i>
                        </div>
                    </div>
                </div>

                <div class="rounded-xl border bg-card p-6 card-hover">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-muted-foreground">Attendance Today</p>
                            <h3 class="text-2xl font-bold mt-1">0/${studentCount}</h3>
                            <p class="text-xs text-yellow-600 dark:text-yellow-400 mt-1">Not taken yet</p>
                        </div>
                        <div class="h-12 w-12 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                            <i data-lucide="calendar-check" class="h-6 w-6 text-amber-600 dark:text-amber-400"></i>
                        </div>
                    </div>
                </div>

                <div class="rounded-xl border bg-card p-6 card-hover">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-muted-foreground">Pending Tasks</p>
                            <h3 class="text-2xl font-bold mt-1">0</h3>
                            <p class="text-xs text-red-600 dark:text-red-400 mt-1">Marks to enter</p>
                        </div>
                        <div class="h-12 w-12 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                            <i data-lucide="check-square" class="h-6 w-6 text-red-600 dark:text-red-400"></i>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Quick Actions -->
            <div class="grid gap-4 md:grid-cols-3">
                ${hasClass ? `
                    <button onclick="showDashboardSection('my-class')" class="p-4 border rounded-lg hover:bg-accent transition-colors text-left group">
                        <i data-lucide="graduation-cap" class="h-6 w-6 text-blue-600 mb-2 group-hover:scale-110 transition-transform"></i>
                        <p class="font-medium">My Class Dashboard</p>
                        <p class="text-xs text-muted-foreground">View ${escapeHtml(className)} overview and analytics</p>
                    </button>
                    
                    <button onclick="showDashboardSection('marks')" class="p-4 border rounded-lg hover:bg-accent transition-colors text-left group">
                        <i data-lucide="trending-up" class="h-6 w-6 text-purple-600 mb-2 group-hover:scale-110 transition-transform"></i>
                        <p class="font-medium">Enter Marks</p>
                        <p class="text-xs text-muted-foreground">Record student grades and assessments</p>
                    </button>
                    
                    <button onclick="showDashboardSection('attendance')" class="p-4 border rounded-lg hover:bg-accent transition-colors text-left group">
                        <i data-lucide="calendar-check" class="h-6 w-6 text-amber-600 mb-2 group-hover:scale-110 transition-transform"></i>
                        <p class="font-medium">Take Attendance</p>
                        <p class="text-xs text-muted-foreground">Mark today's attendance for ${escapeHtml(className)}</p>
                    </button>
                ` : `
                    <div class="col-span-3 text-center py-8 text-muted-foreground">
                        <i data-lucide="school" class="h-12 w-12 mx-auto mb-3 opacity-50"></i>
                        <p>No class assigned to you yet.</p>
                        <p class="text-sm">Please contact your school administrator to assign you as a class teacher.</p>
                    </div>
                `}
            </div>
            
            <!-- Rest of your dashboard (messages, duty card, etc.) -->
        </div>
    `;
}

async function renderTeacherDuty() {
    const todayDuty = await loadTodayDuty();
    const weeklyDuty = await loadWeeklyDuty();
    const user = getCurrentUser();
    
    return `
        <div class="space-y-6 animate-fade-in">
            <h2 class="text-2xl font-bold">My Duty Schedule</h2>
            <div class="grid gap-4 md:grid-cols-2">
                <div class="rounded-xl border bg-card p-6">
                    <h3 class="font-semibold mb-4">This Week's Duty</h3>
                    <div class="space-y-3">
                        ${weeklyDuty?.filter(day => day.duties?.some(d => d.teacherId === user?.id)).map(day => day.duties?.filter(d => d.teacherId === user?.id).map(duty => `
                            <div class="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                                <div><p class="font-medium">${day.dayName}</p><p class="text-sm text-muted-foreground">${duty.area}</p></div>
                                <span class="text-sm">${duty.timeSlot?.start} - ${duty.timeSlot?.end}</span>
                            </div>
                        `).join('')).join('')}
                        ${!weeklyDuty?.some(day => day.duties?.some(d => d.teacherId === user?.id)) ? '<p class="text-center text-muted-foreground py-4">No duty assigned this week</p>' : ''}
                    </div>
                    <button onclick="showDashboardSection('duty-preferences')" class="mt-4 w-full py-2 border rounded-lg hover:bg-accent">Set Preferences</button>
                </div>
                <div class="rounded-xl border bg-card p-6">
                    <h3 class="font-semibold mb-4">Request Duty Swap</h3>
                    <div class="space-y-3">
                        <input type="date" id="swap-date" class="w-full rounded-lg border p-2">
                        <textarea id="swap-reason" rows="2" class="w-full rounded-lg border p-2" placeholder="Reason for swap"></textarea>
                        <button onclick="handleSwapRequest()" class="w-full bg-primary text-primary-foreground py-2 rounded-lg">Submit Request</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderTeacherDutyPreferences() {
    return `
        <div class="space-y-6 animate-fade-in">
            <h2 class="text-2xl font-bold">Duty Preferences</h2>
            <div class="rounded-xl border bg-card p-6 max-w-2xl mx-auto">
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium mb-1">Preferred Days</label>
                        <div class="flex flex-wrap gap-3">
                            ${['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => `
                                <label class="flex items-center gap-2"><input type="checkbox" class="rounded"> <span>${day}</span></label>
                            `).join('')}
                        </div>
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-1">Max Duties Per Week</label>
                        <input type="number" value="3" min="1" max="5" class="w-full rounded-lg border p-2">
                    </div>
                    <button onclick="showToast('Preferences saved', 'success')" class="w-full bg-primary text-primary-foreground py-2 rounded-lg">Save Preferences</button>
                </div>
            </div>
        </div>
    `;
}

function renderTeacherChat() {
    return `
        <div class="max-w-4xl mx-auto space-y-6 animate-fade-in">
            <div class="rounded-xl border bg-card p-4 h-[600px] flex flex-col">
                <div class="flex justify-between items-center mb-4 pb-2 border-b">
                    <div class="flex items-center gap-3">
                        <div class="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
                            <i data-lucide="message-circle" class="h-5 w-5 text-white"></i>
                        </div>
                        <div><h3 class="font-semibold">Teachers' Staff Room</h3><p class="text-xs text-muted-foreground">Staff chat</p></div>
                    </div>
                </div>
                <div class="flex-1 overflow-y-auto space-y-4 mb-4 p-4 bg-muted/20 rounded-lg" id="chat-messages-container">
                    <div class="flex justify-start"><div class="chat-bubble-received max-w-[70%]"><p class="text-sm">Has anyone prepared the math exam?</p><p class="text-xs text-muted-foreground mt-1">Mr. Kamau • 10:30 AM</p></div></div>
                    <div class="flex justify-end"><div class="chat-bubble-sent max-w-[70%]"><p class="text-sm">Yes, I have it ready.</p><p class="text-xs text-muted-foreground mt-1">You • 10:32 AM</p></div></div>
                </div>
                <div class="flex gap-2">
                    <input type="text" id="chat-message-input" placeholder="Type your message..." class="flex-1 rounded-lg border bg-background px-4 py-3 text-sm">
                    <button onclick="sendChatMessage()" class="px-6 py-3 bg-primary text-primary-foreground rounded-lg">Send</button>
                </div>
            </div>
        </div>
    `;
}

async function handleChangePassword() {
    const currentPassword = document.getElementById('current-password')?.value;
    const newPassword = document.getElementById('new-password')?.value;
    const confirmPassword = document.getElementById('confirm-password')?.value;
    
    if (!currentPassword || !newPassword || !confirmPassword) {
        showToast('Please fill all password fields', 'error');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showToast('New passwords do not match', 'error');
        return;
    }
    
    if (newPassword.length < 8) {
        showToast('Password must be at least 8 characters', 'error');
        return;
    }
    
    showLoading();
    try {
        const response = await api.auth.changePassword(currentPassword, newPassword);
        if (response.success) {
            showToast('✅ Password changed successfully', 'success');
            document.getElementById('current-password').value = '';
            document.getElementById('new-password').value = '';
            document.getElementById('confirm-password').value = '';
        }
    } catch (error) {
        showToast(error.message || 'Failed to change password', 'error');
    } finally {
        hideLoading();
    }
}

// ============ EXPORT ============

window.renderTeacherDashboard = renderTeacherDashboard;
window.renderTeacherClassDashboard = renderTeacherClassDashboard;
window.renderTeacherTasks = renderTeacherTasks;
window.renderTeacherDuty = renderTeacherDuty;
window.renderTeacherDutyPreferences = renderTeacherDutyPreferences;
window.renderTeacherChat = renderTeacherChat;
window.renderTeacherSubjects = renderTeacherSubjects;
window.renderTeacherMarksEntry = renderTeacherMarksEntry;
window.renderTeacherStudents = renderTeacherStudents;
window.renderTeacherAttendance = renderTeacherAttendance;
window.renderUserSettings = renderUserSettings;
window.openMarksEntry = openMarksEntry;
window.closeMarksEntryModal = closeMarksEntryModal;
window.saveAllMarks = saveAllMarks;
window.updateGradeDisplayForStudent = updateGradeDisplayForStudent;
window.getTeacherRole = getTeacherRole;
window.isClassTeacher = isClassTeacher;
window.isSubjectTeacher = isSubjectTeacher;
window.calculateClassAverage = calculateClassAverage;
window.calculateClassAttendance = calculateClassAttendance;
window.getTopPerformer = getTopPerformer;
window.renderTeacherSection = renderTeacherSection;
