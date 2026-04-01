// teacher-dashboard.js - Complete with role-based views and marks entry

// ============ ROLE DETECTION (PERMANENT FIX) ============

function getTeacherRole() {
    const user = getCurrentUser();

    if (!user || user.role !== 'teacher') {
        console.warn('⚠️ No valid teacher user found');
        return 'subject_teacher';
    }

    // Ensure teacher object exists
    if (!user.teacher) {
        console.warn('⚠️ Missing teacher object, fixing...');
        user.teacher = {
            type: 'subject_teacher',
            subjects: [],
            classId: null,
            className: null,
            studentCount: 0
        };
        saveUser(user);
    }

    // Ensure type exists
    if (!user.teacher.type) {
        console.warn('⚠️ Missing teacher.type, defaulting to subject_teacher');
        user.teacher.type = 'subject_teacher';
        saveUser(user);
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

// ============ PERMANENT HELPER FUNCTIONS ============

function saveUser(userData) {
    if (!userData) return;
    
    if (userData.role === 'teacher') {
        userData.teacher = userData.teacher || {};
        userData.teacher.type = userData.teacher.type || 'subject_teacher';
        userData.teacher.subjects = userData.teacher.subjects || [];
        userData.teacher.classId = userData.teacher.classId || null;
        userData.teacher.className = userData.teacher.className || null;
        userData.teacher.studentCount = userData.teacher.studentCount || 0;
    }
    
    localStorage.setItem('user', JSON.stringify(userData));
    return userData;
}

function getTeacherAssignedClass() {
    const user = getCurrentUser();

    if (!user || user.role !== 'teacher') return null;

    if (!user.teacher) {
        user.teacher = {
            type: 'subject_teacher',
            subjects: [],
            classId: null,
            className: null,
            studentCount: 0
        };
        saveUser(user);
    }

    return {
        id: user.teacher?.classId || null,
        name: user.teacher?.className || null,
        studentCount: user.teacher?.studentCount || 0
    };
}

function renderUserSettings(role) {
    const user = getCurrentUser();
    const teacherClass = getTeacherAssignedClass();
    
    return `
        <div class="space-y-6 animate-fade-in max-w-4xl mx-auto">
            <div class="rounded-xl border bg-card p-6">
                <h2 class="text-2xl font-bold mb-4">${role === 'teacher' ? 'Teacher' : 'User'} Settings</h2>
                <p class="text-muted-foreground">Account management and preferences</p>
                
                <div class="mt-6 space-y-4">
                    <div class="border-t pt-4">
                        <h3 class="font-semibold mb-2">Profile Information</h3>
                        <p class="text-sm text-muted-foreground">Name: ${escapeHtml(user?.name || 'N/A')}</p>
                        <p class="text-sm text-muted-foreground">Email: ${escapeHtml(user?.email || 'N/A')}</p>
                        <p class="text-sm text-muted-foreground">Role: ${role}</p>
                    </div>
                    
                    <div class="border-t pt-4">
                        <h3 class="font-semibold mb-2">Class Information</h3>
                        <p class="text-sm text-muted-foreground">Assigned Class: ${escapeHtml(teacherClass?.name || 'None')}</p>
                        <p class="text-sm text-muted-foreground">Teacher Type: ${getTeacherRole()}</p>
                        <p class="text-sm text-muted-foreground">Students: ${teacherClass?.studentCount || 0}</p>
                    </div>
                    
                    <div class="border-t pt-4">
                        <h3 class="font-semibold mb-2">Change Password</h3>
                        <div class="space-y-3">
                            <input type="password" id="current-password" placeholder="Current Password" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                            <input type="password" id="new-password" placeholder="New Password" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                            <input type="password" id="confirm-password" placeholder="Confirm Password" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                            <button onclick="handleChangePassword()" class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">Update Password</button>
                        </div>
                    </div>
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

// ============ TEACHER DASHBOARD ============

function renderTeacherDashboard() {
    const data = dashboardData || {};
    const user = getCurrentUser();
    const role = getTeacherRole();
    const teacherClass = getTeacherAssignedClass();
    const hasClass = teacherClass !== null && teacherClass.name !== null;
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

            <!-- Stats Grid -->
            <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div class="rounded-xl border bg-card p-6 card-hover">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-muted-foreground">My Students</p>
                            <h3 class="text-2xl font-bold mt-1">${studentCount}</h3>
                            <p class="text-xs text-muted-foreground mt-1">In ${hasClass ? className : 'your class'}</p>
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

// ============ PERMANENT FIX FUNCTION - Run this ONCE ============

function setTeacherAsClassTeacher() {
    const user = getCurrentUser();
    if (!user || user.role !== 'teacher') {
        console.log('❌ Not logged in as teacher');
        return;
    }
    
    console.log('🔧 Setting teacher as CLASS TEACHER permanently...');
    
    user.teacher = user.teacher || {};
    user.teacher.type = 'class_teacher';
    user.teacher.classId = 54;
    user.teacher.className = 'Grade 1 EAST';
    user.teacher.studentCount = 0;
    user.teacher.subjects = user.teacher.subjects || [];
    
    saveUser(user);
    
    console.log('✅ Teacher type set to:', user.teacher.type);
    console.log('✅ Class set to:', user.teacher.className);
    console.log('\n🔄 Refresh the page now!');
}

// ============ THE REST OF YOUR FUNCTIONS (keep as they are) ============
// [Keep all your existing functions: renderTeacherClassDashboard, renderTeacherSubjects, 
//  renderTeacherMarksEntry, openMarksEntry, saveAllMarks, etc.]

// ============ EXPORT ============

window.renderTeacherSection = renderTeacherSection;
window.renderTeacherDashboard = renderTeacherDashboard;
window.renderTeacherClassDashboard = renderTeacherClassDashboard;
window.renderTeacherSubjects = renderTeacherSubjects;
window.renderTeacherMarksEntry = renderTeacherMarksEntry;
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
window.getTeacherAssignedClass = getTeacherAssignedClass;
window.renderUserSettings = renderUserSettings;
window.handleChangePassword = handleChangePassword;
window.setTeacherAsClassTeacher = setTeacherAsClassTeacher;
