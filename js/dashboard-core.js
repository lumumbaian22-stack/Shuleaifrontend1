// dashboard-core.js - Core dashboard state and navigation

// ============ GLOBAL VARIABLES ============
let currentRole = null;
let currentSection = 'dashboard';
let dashboardData = {};
let schoolSettings = {};
let customSubjects = [];
let schoolUpdateCallbacks = [];
let clickCount = 0;

// ============ SCHOOL SETTINGS ============
// Replace the loadSchoolSettings function in dashboard-core.js
async function loadSchoolSettings() {
    try {
        const cached = localStorage.getItem('schoolSettings');
        if (cached) {
            try {
                const parsed = JSON.parse(cached);
                if (parsed && parsed.curriculum) {
                    window.schoolSettings = parsed;
                    // Extract custom subjects from nested settings
                    window.customSubjects = parsed.settings?.customSubjects || [];
                    console.log('✅ Settings loaded from cache');
                    return window.schoolSettings;
                }
            } catch (e) {}
        }
        
        try {
            const response = await api.admin.getSchoolSettings();
            if (response && response.success && response.data) {
                window.schoolSettings.schoolName = response.data.name;
                // FIXED: Get customSubjects from settings object
                window.customSubjects = response.data.settings?.customSubjects || [];
                localStorage.setItem('schoolSettings', JSON.stringify(response.data));
                console.log('✅ School settings loaded from API');
                return window.schoolSettings;
            }
        } catch (apiError) {
            console.warn('⚠️ Cannot fetch school settings:', apiError.message);
        }
        
        // Defaults
        window.schoolSettings = { curriculum: 'cbc', schoolLevel: 'both', settings: { customSubjects: [] } };
        window.customSubjects = [];
        return window.schoolSettings;
    } catch (error) {
        console.error('Failed to load settings:', error);
        window.schoolSettings = { curriculum: 'cbc', schoolLevel: 'both', settings: { customSubjects: [] } };
        window.customSubjects = [];
        return window.schoolSettings;
    }
}

async function saveSchoolSettings(settings) {
    try {
        const response = await api.admin.updateSchoolSettings(settings);
        if (response.success) {
            schoolSettings = response.data;
            customSubjects = response.data.customSubjects || [];
            localStorage.setItem('schoolSettings', JSON.stringify(response.data));
            showToast('Settings saved successfully!', 'success');
            await showDashboardSection(currentSection);
        }
    } catch (error) {
        showToast('Failed to save settings', 'error');
    }
}

// ============ DASHBOARD RENDERING ============
async function showDashboard(role) {
    console.log('🔵 showDashboard called with role:', role);

    if (!role) {
        if (typeof getCurrentRole === 'function') {
            role = getCurrentRole();
        }
        if (!role) {
            role = localStorage.getItem('userRole');
        }
        if (!role) {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            role = user.role;
        }
        if (!role) {
            try {
                const response = await api.auth.getMe();
                if (response && response.data && response.data.user) {
                    role = response.data.user.role;
                    localStorage.setItem('userRole', role);
                    localStorage.setItem('user', JSON.stringify(response.data.user));
                }
            } catch (error) {
                console.error('Failed to fetch user from API:', error);
            }
        }
        if (!role) {
            console.error('❌ No role found after all attempts');
            showToast('Session expired. Please log in again.', 'error');
            setTimeout(() => { window.location.href = '/'; }, 2000);
            return;
        }
    }

    localStorage.setItem('userRole', role);
    currentRole = role;

    const landingPage = document.getElementById('landing-page');
    const dashboardContainer = document.getElementById('dashboard-container');

    if (landingPage) landingPage.style.display = 'none';
    if (dashboardContainer) {
        dashboardContainer.style.display = 'block';
        dashboardContainer.setAttribute('data-current-role', role);
    }

    // Only load school settings for admin and superadmin
    if (role === 'admin' || role === 'superadmin') {
        await loadSchoolSettings();
    } else {
        const cached = localStorage.getItem('schoolSettings');
        if (cached) {
            try {
                schoolSettings = JSON.parse(cached);
                customSubjects = schoolSettings.settings?.customSubjects || [];
            } catch(e) {}
        } else {
            schoolSettings = { curriculum: 'cbc', schoolLevel: 'both', settings: { customSubjects: [] } };
            customSubjects = [];
        }
    }

    showLoading();
    try {
        if (role === 'superadmin') {
            const [overview, schools, pending] = await Promise.all([
                api.superAdmin.getOverview().catch(err => ({ data: {} })),
                api.superAdmin.getSchools().catch(err => ({ data: [] })),
                api.superAdmin.getPendingSchools().catch(err => ({ data: [] }))
            ]);
            dashboardData = { ...overview.data, schools: schools.data, pendingSchools: pending.data };
        } else if (role === 'admin') {
            const [teachers, students, pendingTeachers] = await Promise.all([
                api.admin.getTeachers().catch(err => ({ data: [] })),
                api.admin.getStudents().catch(err => ({ data: [] })),
                api.admin.getPendingApprovals().catch(err => ({ data: { teachers: [] } }))
            ]);
            dashboardData = { teachers: teachers.data, students: students.data, pendingTeachers: pendingTeachers.data?.teachers || [] };
        } else if (role === 'teacher') {
            const [students, subjects, todayDuty] = await Promise.all([
                api.teacher.getMyStudents().catch(err => ({ data: [] })),
                api.teacher.getMySubjects().catch(err => ({ data: [] })),
                api.duty.getTodayDuty().catch(err => ({ data: {} }))
            ]);
            dashboardData = { students: students.data, subjects: subjects.data, todayDuty: todayDuty.data };
        } else if (role === 'parent') {
            const children = await api.parent.getChildren().catch(err => ({ data: [] }));
            let childSummary = null;
            if (children.data && children.data.length > 0) {
                childSummary = await api.parent.getChildSummary(children.data[0].id).catch(err => ({ data: {} }));
            }
            dashboardData = { children: children.data, selectedChild: childSummary?.data };
        } else if (role === 'student') {
            const [grades, attendance] = await Promise.all([
                api.student.getGrades().catch(err => ({ data: [] })),
                api.student.getAttendance().catch(err => ({ data: [] }))
            ]);
            dashboardData = { grades: grades.data, attendance: attendance.data };
        } else {
            console.error('Unknown role:', role);
            showToast('Invalid user role', 'error');
            setTimeout(() => { window.location.href = '/'; }, 2000);
            return;
        }

        updateSidebar(role);
        updateUserInfo();
        await showDashboardSection('dashboard');

        if (typeof connectWebSocket === 'function') {
            setTimeout(connectWebSocket, 500);
        }
    } catch (error) {
        console.error('❌ Error loading dashboard:', error);
        showToast('Failed to load dashboard data. Please check your connection.', 'error');
    } finally {
        hideLoading();
    }
}

async function showDashboardSection(section) {
    currentSection = section;
    const content = document.getElementById('dashboard-content');
    const pageTitle = document.getElementById('page-title');

    if (!content) return;

    showLoading();

    try {
        const sectionNames = {
            dashboard: 'Dashboard',
            students: 'Students',
            teachers: 'Teachers',
            classes: 'Classes',
            attendance: 'Attendance',
            grades: 'Grades',
            analytics: 'Analytics',
            duty: 'Duty Management',
            calendar: 'School Calendar',
            tasks: 'My Tasks',
            timetable: 'My Timetable',
            profile: 'Profile',
            settings: 'School Settings',
            'platform-settings': 'Platform Settings',
            'user-settings': 'My Settings',
            help: 'Help',
            chat: 'Study Group Chat',
            'ai-tutor': 'AI Tutor',
            payments: 'Payments',
            progress: 'Academic Progress',
            'child-selector': 'Select Child',
            schools: 'School Management',
            'platform-health': 'Platform Health',
            'name-change-requests': 'Name Change Requests',
            'school-approvals': 'School Approvals',
            'pending-approvals': 'Pending School Approvals',
            'teacher-approvals': 'Pending Teacher Approvals',
            'paid-schools': 'Paid Schools',
            'custom-subjects': 'Custom Subjects',
            'duty-preferences': 'Duty Preferences',
            'fairness-report': 'Fairness Report',
            'teacher-workload': 'Teacher Workload'
        };
        pageTitle.textContent = sectionNames[section] || 'Dashboard';

        content.innerHTML = await renderDashboardSection(currentRole, section);

        updateSidebarActiveState(section);

        if (section === 'dashboard' || section === 'analytics') {
            setTimeout(() => {
                if (currentRole === 'admin') {
                    if (typeof initAdminCharts === 'function') initAdminCharts();
                }
                if (typeof initRoleCharts === 'function') {
                    initRoleCharts(currentRole, dashboardData);
                }
            }, 300);
        }

        setupSectionListeners(currentRole, section);

        lucide.createIcons();
    } catch (error) {
        console.error('Error loading section:', error);
        content.innerHTML = `<div class="text-center py-12">
            <i data-lucide="alert-circle" class="h-12 w-12 mx-auto text-red-500 mb-4"></i>
            <p class="text-red-500">Failed to load section: ${error.message}</p>
        </div>`;
        lucide.createIcons();
    } finally {
        hideLoading();
    }
}

async function renderDashboardSection(role, section) {
    switch(role) {
        case 'superadmin':
            if (typeof renderSuperAdminSection !== 'function') {
                console.error('renderSuperAdminSection missing');
                return '<div class="text-center py-12 text-red-500">Error: Super Admin module not loaded</div>';
            }
            return await renderSuperAdminSection(section);
        case 'admin':
            if (typeof renderAdminSection !== 'function') {
                console.error('renderAdminSection missing');
                return '<div class="text-center py-12 text-red-500">Error: Admin module not loaded</div>';
            }
            return await renderAdminSection(section);
        case 'teacher':
            // Ensure renderTeacherSection exists, if not, define a simple fallback
            if (typeof renderTeacherSection !== 'function') {
                console.warn('renderTeacherSection missing – using built-in fallback');
                // Simple teacher dashboard fallback
                return `
                    <div class="space-y-6 animate-fade-in">
                        <div class="rounded-xl border bg-card p-6 bg-gradient-to-r from-blue-50 to-indigo-50">
                            <h2 class="text-2xl font-bold">Teacher Dashboard</h2>
                            <p class="text-muted-foreground">Welcome, ${escapeHtml(getCurrentUser()?.name || 'Teacher')}</p>
                            <p class="text-sm text-yellow-600 mt-2">⚠️ Dashboard module not fully loaded. Please refresh the page.</p>
                            <button onclick="location.reload()" class="mt-4 px-4 py-2 bg-primary text-white rounded-lg">Refresh Page</button>
                        </div>
                    </div>
                `;
            }
            return await renderTeacherSection(section);
        case 'parent':
            if (typeof renderParentSection !== 'function') {
                console.error('renderParentSection missing');
                return '<div class="text-center py-12 text-red-500">Error: Parent module not loaded</div>';
            }
            return await renderParentSection(section);
        case 'student':
            if (typeof renderStudentSection !== 'function') {
                console.error('renderStudentSection missing');
                return '<div class="text-center py-12 text-red-500">Error: Student module not loaded</div>';
            }
            return await renderStudentSection(section);
        default:
            return '<div class="text-center py-12">Invalid role</div>';
    }
}

function setupSectionListeners(role, section) {
    if (section === 'students' && role === 'teacher') {
        setTimeout(() => {
            if (typeof setupFileUpload === 'function') {
                setupFileUpload('csv-drop-zone', 'csv-file-input', 'students');
            }
        }, 500);
    }

    if (section === 'chat') {
        const input = document.getElementById('chat-message-input');
        if (input) {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') sendChatMessage();
            });
        }
    }

    if (section === 'ai-tutor') {
        const input = document.getElementById('ai-question-input');
        if (input) {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') askAITutor();
            });
        }
    }
}

// ============ ADMIN STATS ============
async function updateAdminStats() {
    try {
        const [students, teachers, classes] = await Promise.all([
            api.admin.getStudents().catch(() => ({ data: [] })),
            api.admin.getTeachers().catch(() => ({ data: [] })),
            api.admin.getClasses().catch(() => ({ data: [] }))
        ]);

        const studentCount = students.data?.length || 0;
        const teacherCount = teachers.data?.length || 0;
        const classCount = classes.data?.length || 0;

        const studentEl = document.getElementById('total-students');
        const teacherEl = document.getElementById('total-teachers');
        const classEl = document.getElementById('total-classes');

        if (studentEl) studentEl.textContent = studentCount;
        if (teacherEl) teacherEl.textContent = teacherCount;
        if (classEl) classEl.textContent = classCount;

        console.log('📊 Stats updated:', { studentCount, teacherCount, classCount });

    } catch (error) {
        console.error('Stats error:', error);
    }
}

// ============ REGISTER SCHOOL UPDATE CALLBACK ============
function onSchoolUpdate(callback) {
    if (typeof callback === 'function') {
        schoolUpdateCallbacks.push(callback);
    }
}

// Expose globally
window.currentRole = currentRole;
window.currentSection = currentSection;
window.dashboardData = dashboardData;
window.schoolSettings = schoolSettings;
window.customSubjects = customSubjects;
window.schoolUpdateCallbacks = schoolUpdateCallbacks;
window.clickCount = clickCount;

window.loadSchoolSettings = loadSchoolSettings;
window.saveSchoolSettings = saveSchoolSettings;
window.showDashboard = showDashboard;
window.showDashboardSection = showDashboardSection;
window.renderDashboardSection = renderDashboardSection;
window.updateAdminStats = updateAdminStats;
window.onSchoolUpdate = onSchoolUpdate;
