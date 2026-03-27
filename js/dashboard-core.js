// dashboard-core.js - Core dashboard state and navigation

let currentRole = null;
let currentSection = 'dashboard';
let dashboardData = {};
let schoolSettings = {};
let customSubjects = [];
let schoolUpdateCallbacks = [];
let clickCount = 0;

async function loadSchoolSettings() {
    try {
        const cached = localStorage.getItem('schoolSettings');
        if (cached) {
            try {
                const parsed = JSON.parse(cached);
                if (parsed && parsed.curriculum) {
                    window.schoolSettings = parsed;
                    window.customSubjects = parsed.customSubjects || [];
                    console.log('✅ Settings loaded from cache:', { curriculum: window.schoolSettings.curriculum, schoolLevel: window.schoolSettings.schoolLevel });
                    return window.schoolSettings;
                }
            } catch (e) {}
        }

        const response = await api.admin.getSchoolSettings();
        if (response && response.success) {
            window.schoolSettings = response.data;
            window.customSubjects = response.data.customSubjects || [];
            localStorage.setItem('schoolSettings', JSON.stringify(response.data));
            console.log('✅ School settings loaded from API:', { curriculum: window.schoolSettings.curriculum, schoolLevel: window.schoolSettings.schoolLevel });

            const school = JSON.parse(localStorage.getItem('school') || '{}');
            if (school) {
                school.settings = window.schoolSettings;
                localStorage.setItem('school', JSON.stringify(school));
            }
            return window.schoolSettings;
        }

        console.warn('⚠️ Using default school settings');
        window.schoolSettings = { curriculum: 'cbc', schoolLevel: 'both', customSubjects: [] };
        return window.schoolSettings;

    } catch (error) {
        console.error('Failed to load settings:', error);
        window.schoolSettings = { curriculum: 'cbc', schoolLevel: 'both', customSubjects: [] };
        return window.schoolSettings;
    }
}

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
            console.error('❌ No role found, redirecting to login');
            showToast('Session expired. Please log in again.', 'error');
            setTimeout(() => {
                window.location.href = '/';
            }, 2000);
            return;
        }
    }

    localStorage.setItem('userRole', role);
    currentRole = role;
    console.log('✅ Final role set to:', role);

    const landingPage = document.getElementById('landing-page');
    const dashboardContainer = document.getElementById('dashboard-container');

    if (landingPage) landingPage.style.display = 'none';
    if (dashboardContainer) {
        dashboardContainer.style.display = 'block';
        dashboardContainer.setAttribute('data-current-role', role);
    }

    await loadSchoolSettings();

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
            const [teachers, students, pendingTeachers, classes] = await Promise.all([
                api.admin.getTeachers().catch(err => ({ data: [] })),
                api.admin.getStudents().catch(err => ({ data: [] })),
                api.admin.getPendingApprovals().catch(err => ({ data: { teachers: [] } })),
                api.admin.getClasses().catch(err => ({ data: [] }))
            ]);
            dashboardData = { teachers: teachers.data, students: students.data, pendingTeachers: pendingTeachers.data?.teachers || [], classes: classes.data };
        } else if (role === 'teacher') {
            const [students, todayDuty] = await Promise.all([
                api.teacher.getMyStudents().catch(err => ({ data: [] })),
                api.duty.getTodayDuty().catch(err => ({ data: {} }))
            ]);
            dashboardData = { students: students.data, todayDuty: todayDuty.data };
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
            setTimeout(() => {
                window.location.href = '/';
            }, 2000);
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
            schools: 'School Management',
            'platform-health': 'Platform Health',
            'name-change-requests': 'Name Change Requests',
            'school-approvals': 'School Approvals',
            'pending-approvals': 'Pending School Approvals',
            'teacher-approvals': 'Pending Teacher Approvals',
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
                if (currentRole === 'admin' && typeof initAdminCharts === 'function') initAdminCharts();
                if (typeof initRoleCharts === 'function') initRoleCharts(currentRole, dashboardData);
            }, 300);
        }

        setupSectionListeners(currentRole, section);

        if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
    } catch (error) {
        console.error('Error loading section:', error);
        content.innerHTML = `<div class="text-center py-12">
            <i data-lucide="alert-circle" class="h-12 w-12 mx-auto text-red-500 mb-4"></i>
            <p class="text-red-500">Failed to load section: ${error.message}</p>
        </div>`;
        if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
    } finally {
        hideLoading();
    }
}

async function renderDashboardSection(role, section) {
    switch(role) {
        case 'superadmin':
            return await renderSuperAdminSection(section);
        case 'admin':
            return await renderAdminSection(section);
        case 'teacher':
            return await renderTeacherSection(section);
        case 'parent':
            return await renderParentSection(section);
        case 'student':
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
                if (e.key === 'Enter' && typeof sendChatMessage === 'function') sendChatMessage();
            });
        }
    }

    if (section === 'ai-tutor') {
        const input = document.getElementById('ai-question-input');
        if (input) {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && typeof askAITutor === 'function') askAITutor();
            });
        }
    }
}

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

function onSchoolUpdate(callback) {
    if (typeof callback === 'function') {
        schoolUpdateCallbacks.push(callback);
    }
}

window.currentRole = currentRole;
window.currentSection = currentSection;
window.dashboardData = dashboardData;
window.schoolSettings = schoolSettings;
window.customSubjects = customSubjects;
window.clickCount = clickCount;

window.loadSchoolSettings = loadSchoolSettings;
window.showDashboard = showDashboard;
window.showDashboardSection = showDashboardSection;
window.renderDashboardSection = renderDashboardSection;
window.updateAdminStats = updateAdminStats;
window.onSchoolUpdate = onSchoolUpdate;
