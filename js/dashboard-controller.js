// Shule AI v34 - Single dashboard controller bundle

// ===== sidebar.js merged into dashboard-controller.js =====
// sidebar.js - Sidebar navigation and user info

function updateSidebar(role) {
    const nav = document.getElementById('sidebar-nav');
    const settingsNav = document.getElementById('settings-nav');
    const mobileNav = document.getElementById('mobile-nav');
    
    // Update sidebar brand identity from the single BrandingManager source.
    if (window.BrandingManager && typeof window.BrandingManager.apply === 'function') {
        window.BrandingManager.apply();
    } else {
        const schoolNameSpan = document.getElementById('sidebar-school-name');
        const school = typeof getCurrentSchool === 'function' ? getCurrentSchool() : null;
        if (schoolNameSpan && school && school.status === 'active' && school.name) {
            schoolNameSpan.textContent = school.name;
        } else if (schoolNameSpan) {
            schoolNameSpan.textContent = 'ShuleAI';
        }
    }

    if (!nav) return;

    const sidebarConfig = {
        superadmin: {
            main: [
                { icon: 'shield', label: 'Dashboard', section: 'dashboard' },
                { icon: 'building-2', label: 'Schools', section: 'schools' },
                { icon: 'check-circle', label: 'School Approvals', section: 'school-approvals' },
                { icon: 'file-edit', label: 'Name Changes', section: 'name-change-requests' },
                { icon: 'activity', label: 'Platform Health', section: 'platform-health' },
                { icon: 'credit-card', label: 'Platform Payments', section: 'platform-payments' },
                { icon: 'bar-chart-2', label: 'Analytics', section: 'analytics' },
                { icon: 'bell', label: 'Super Admin Alerts', section: 'alerts' },
                { icon: 'message-square', label: 'Bulk SMS', section: 'sms' }
            ],
            settings: [
                { icon: 'settings', label: 'Platform Settings', section: 'settings' },
                { icon: 'help-circle', label: 'Help', section: 'help' }
            ]
        },
        admin: {
            main: [
                { icon: 'layout-dashboard', label: 'Dashboard', section: 'dashboard' },
                { icon: 'users', label: 'Teachers', section: 'teachers' },
                { icon: 'building-2', label: 'Departments', section: 'departments' },
                { icon: 'user-plus', label: 'Teacher Approvals', section: 'teacher-approvals' },
                { icon: 'graduation-cap', label: 'Students', section: 'students' },
                { icon: 'list-checks', label: 'Student Subjects', section: 'student-subject-selection' },
                { icon: 'calendar', label: 'Calendar', section: 'calendar' },
                { icon: 'clock', label: 'Duty', section: 'duty' },
                { icon: 'bar-chart-2', label: 'Fairness Report', section: 'fairness-report' },
                { icon: 'book-open', label: 'Custom Subjects', section: 'custom-subjects' },
                { icon: 'trending-up', label: 'Analytics', section: 'analytics' },
                { icon: 'clock', label: 'Timetable', section: 'timetable' },
                { icon: 'bell', label: 'Alerts Center', section: 'alerts' },
                { icon: 'message-square', label: 'Bulk SMS', section: 'sms' },
                { icon: 'message-circle', label: 'Parent Messages', section: 'parent-messages' },
                { icon: 'wallet', label: 'Finance & Fees', section: 'finance-fees' }
            ],
            settings: [
                { icon: 'settings', label: 'School Settings', section: 'settings' },
                { icon: 'credit-card', label: 'Subscription & Billing', section: 'subscription-billing' },
                { icon: 'palette', label: 'School Branding', section: 'school-branding' },
                { icon: 'help-circle', label: 'Help', section: 'help' },
                { icon: 'users', label: 'Classes', section: 'classes' }
            ]
        },
        teacher: {
            main: [
                { icon: 'layout-dashboard', label: 'Dashboard', section: 'dashboard' },
                ...(function(){
                    try {
                        const u = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
                        const t = u?.teacher || {};
                        const isClassTeacher = !!(u?.classTeacher || u?.classId || t.classTeacher || t.classId || t.isClassTeacher || t.role === 'class_teacher');
                        return isClassTeacher ? [{ icon: 'users', label: 'My Students', section: 'students' }] : [];
                    } catch (_) { return []; }
                })(),
                { icon: 'calendar-check', label: 'Attendance', section: 'attendance' },
                { icon: 'trending-up', label: 'Grades', section: 'grades' },
                { icon: 'check-square', label: 'Tasks', section: 'tasks' },
                { icon: 'clock', label: 'My Duty', section: 'duty' },
                { icon: 'settings', label: 'Duty Preferences', section: 'duty-preferences' },
                { icon: 'message-circle', label: 'Messages', section: 'staff-chat' },
                { icon: 'message-circle', label: 'Parent Messages', section: 'parent-chat' },
                { icon: 'list-checks', label: 'Subject Requests', section: 'subject-requests' },
                { icon: 'bar-chart-2', label: 'Analytics', section: 'analytics' },
                { icon: 'calendar', label: 'My Timetable', section: 'my-timetable' },
                { icon: 'book-open', label: 'Homework', section: 'homework' },
                { icon: 'bell', label: 'Alerts', section: 'alerts' }
            ],
            settings: [
                { icon: 'settings', label: 'My Settings', section: 'settings' },
                { icon: 'help-circle', label: 'Help', section: 'help' }
            ]
        },
        parent: {
            main: [
                { icon: 'layout-dashboard', label: 'Dashboard', section: 'dashboard' },
                { icon: 'trending-up', label: 'Progress', section: 'progress' },
                { icon: 'credit-card', label: 'Payments', section: 'payments' },
                { icon: 'calendar', label: 'Child Timetable', section: 'timetable' },
                { icon: 'message-circle', label: 'Messages', section: 'chat' },
                { icon: 'list-checks', label: 'Subject Choice', section: 'subject-choice' },
                { icon: 'bell', label: 'Alerts', section: 'alerts' },
                { icon: 'bar-chart-2', label: 'Analytics', section: 'analytics' }
            ],
            settings: [
                { icon: 'settings', label: 'My Settings', section: 'settings' },
                { icon: 'help-circle', label: 'Help', section: 'help' }
            ]
        },
        student: {
            main: [
                { icon: 'layout-dashboard', label: 'Dashboard', section: 'dashboard' },
                { icon: 'trending-up', label: 'My Grades', section: 'grades' },
                { icon: 'calendar-check', label: 'Attendance', section: 'attendance' },
                { icon: 'message-circle', label: 'Study Chat', section: 'chat' },
                { icon: 'bot', label: 'AI Tutor', section: 'ai-tutor' },
                { icon: 'compass', label: 'Career Path', section: 'career-path' },
                { icon: 'bell', label: 'Alerts', section: 'alerts' },
                { icon: 'calendar', label: 'My Timetable', section: 'schedule' },
                { icon: 'shopping-bag', label: 'Rewards', section: 'rewards' },
                { icon: 'book-open', label: 'My Homework', section: 'my-homework' },
                { icon: 'bar-chart-2', label: 'Analytics', section: 'analytics' }
            ],
            settings: [
                { icon: 'settings', label: 'My Settings', section: 'settings' },
                { icon: 'help-circle', label: 'Help', section: 'help' }
            ]
        }
    };

    const config = sidebarConfig[role] || sidebarConfig.student;

    nav.innerHTML = config.main.map(item => `
        <a href="#" onclick="showDashboardSection('${item.section}')" class="flex items-center gap-3 rounded-lg px-3 py-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors sidebar-link" data-section="${item.section}">
            <i data-lucide="${item.icon}" class="h-5 w-5"></i>
            <span>${item.label}</span>
        </a>
    `).join('');

    settingsNav.innerHTML = config.settings.map(item => `
        <a href="#" onclick="showDashboardSection('${item.section}')" class="flex items-center gap-3 rounded-lg px-3 py-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors sidebar-link" data-section="${item.section}">
            <i data-lucide="${item.icon}" class="h-5 w-5"></i>
            <span>${item.label}</span>
        </a>
    `).join('');

    if (mobileNav) {
        mobileNav.innerHTML = config.main.slice(0, 4).map(item => `
            <a href="#" onclick="showDashboardSection('${item.section}')" class="mobile-nav-item flex flex-col items-center justify-center flex-1 h-14 text-muted-foreground" data-section="${item.section}">
                <i data-lucide="${item.icon}" class="h-5 w-5"></i>
                <span class="text-xs mt-1">${item.label}</span>
            </a>
        `).join('');
    }

    if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
}

function updateSidebarActiveState(section) {
    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.classList.remove('bg-sidebar-accent', 'text-sidebar-accent-foreground');
    });
    const activeLink = document.querySelector(`.sidebar-link[data-section="${section}"]`);
    if (activeLink) {
        activeLink.classList.add('bg-sidebar-accent', 'text-sidebar-accent-foreground');
    }
    document.querySelectorAll('.mobile-nav-item').forEach(item => {
        item.classList.remove('text-primary');
        if (item.dataset.section === section) {
            item.classList.add('text-primary');
        }
    });
}

function updateUserInfo() {
    const user = getCurrentUser();
    const name = user?.name || 'User';
    const initials = getInitials(name);
    const profileUrl = user?.profileImage || user?.profilePicture || '';

    const avatarWrap = document.getElementById('sidebar-avatar-wrap') || document.getElementById('user-initials')?.parentElement;
    const userName = document.getElementById('user-name');
    const dropdownName = document.getElementById('dropdown-user-name');
    const dropdownEmail = document.getElementById('dropdown-user-email');

    if (avatarWrap) {
        if (profileUrl) {
            const src = typeof resolveMediaUrl === 'function' ? resolveMediaUrl(profileUrl) : profileUrl;
            avatarWrap.classList.add('overflow-hidden');
            avatarWrap.innerHTML = `<img src="${escapeHtml(src)}" class="h-full w-full rounded-full object-cover" data-current-user-avatar alt="${escapeHtml(name)}">`;
        } else {
            avatarWrap.innerHTML = `<span id="user-initials">${initials}</span>`;
            avatarWrap.className = 'h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white font-medium text-sm overflow-hidden';
        }
    }

    if (userName) userName.textContent = name;
    if (dropdownName) dropdownName.textContent = name;
    if (dropdownEmail) dropdownEmail.textContent = user?.email || '';
}

// Function to update sidebar school name (called when school name changes)
function updateSidebarSchoolName(newName) {
    if (window.BrandingManager && typeof window.BrandingManager.updateSidebarSchoolName === 'function') {
        return window.BrandingManager.updateSidebarSchoolName(newName);
    }
    const schoolNameSpan = document.getElementById('sidebar-school-name');
    if (schoolNameSpan && newName) {
        schoolNameSpan.textContent = newName;
        console.log('Sidebar school name updated to:', newName);
    }
}

// Export functions
window.updateSidebar = updateSidebar;
window.updateSidebarActiveState = updateSidebarActiveState;
window.updateUserInfo = updateUserInfo;
window.updateSidebarSchoolName = updateSidebarSchoolName;


// ===== dashboard-core.js merged into dashboard-controller.js =====
// dashboard-core.js - Core dashboard state and navigation

// ============ GLOBAL VARIABLES ============
let currentRole = null;
let currentSection = 'dashboard';
var dashboardData = {};
let schoolSettings = {};
let customSubjects = [];
let schoolUpdateCallbacks = [];
let clickCount = 0;

// ============ SCHOOL SETTINGS ============
async function loadSchoolSettings() {
    try {
        const cached = localStorage.getItem('schoolSettings');
        if (cached) {
            try {
                const parsed = JSON.parse(cached);
                if (parsed && parsed.curriculum) {
                    window.schoolSettings = parsed;
                    window.customSubjects = parsed.settings?.customSubjects || [];
                    console.log('✅ Settings loaded from cache');
                    return window.schoolSettings;
                }
            } catch (e) {}
        }
        
        try {
            // Add a small debounce/cache check to prevent redundant API calls in same session
            if (window.__schoolSettingsLoading) return window.schoolSettings;
            window.__schoolSettingsLoading = true;

            const response = await api.admin.getSchoolSettings();
            window.__schoolSettingsLoading = false;

            if (response && response.success && response.data) {
                // Assign the entire response data
                window.schoolSettings = response.data;
                // Ensure curriculum is accessible via both 'curriculum' and 'system'
                window.schoolSettings.curriculum = response.data.system;
                // Extract schoolLevel from nested settings
                window.schoolSettings.schoolLevel = response.data.settings?.schoolLevel || 'both';
                window.customSubjects = response.data.settings?.customSubjects || [];
                localStorage.setItem('schoolSettings', JSON.stringify(window.schoolSettings));
                console.log('✅ School settings loaded from API');
                return window.schoolSettings;
            }
        } catch (apiError) {
            window.__schoolSettingsLoading = false;
            console.warn('⚠️ Cannot fetch school settings:', apiError.message);
        }
        
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

// ============ CONSENT CHECK ============
async function checkConsentAndDPA() {
    try {
        const consentStatus = await api.consent.getStatus();
        const consent = consentStatus.data;
        if (!consent || !consent.termsAccepted || !consent.privacyAccepted) {
            showTermsModal();
            return false;
        }
        
        const user = getCurrentUser();
        if (user.role === 'admin') {
            const dpaStatus = await api.consent.getDPAStatus();
            if (!dpaStatus.data?.accepted) {
                showDPAModal();
                return false;
            }
        }
        return true;
    } catch (error) {
        console.error('Consent check error:', error);
        // If consent endpoints not yet deployed, allow access but log
        return true;
    }
}

function showTermsModal() {
    // Simple modal for terms acceptance
    const modal = document.getElementById('auth-modal');
    const titleEl = document.getElementById('auth-modal-title');
    const contentEl = document.getElementById('auth-modal-content');
    if (!modal) return;
    
    titleEl.textContent = 'Accept Terms';
    contentEl.innerHTML = `
        <div class="space-y-4">
            <p class="text-sm">Please accept the Terms of Service and Privacy Policy to continue.</p>
            <div class="flex items-start gap-2">
                <input type="checkbox" id="modal-terms" class="mt-1 rounded">
                <label for="modal-terms" class="text-xs">I accept the Terms of Service and Privacy Policy</label>
            </div>
            <div class="flex justify-end gap-2">
                <button onclick="logout()" class="px-4 py-2 border rounded-lg">Logout</button>
                <button onclick="submitTermsAcceptance()" class="px-4 py-2 bg-primary text-white rounded-lg">Continue</button>
            </div>
        </div>
    `;
    modal.classList.remove('hidden');
    window.submitTermsAcceptance = async function() {
        if (!document.getElementById('modal-terms').checked) {
            showToast('You must accept the terms', 'error');
            return;
        }
        showLoading();
        try {
            await api.consent.accept(true, true);
            modal.classList.add('hidden');
            await showDashboard(currentRole);
        } catch (e) {
            showToast('Failed to record consent', 'error');
        } finally {
            hideLoading();
        }
    };
}

function showDPAModal() {
    const modal = document.getElementById('auth-modal');
    const titleEl = document.getElementById('auth-modal-title');
    const contentEl = document.getElementById('auth-modal-content');
    if (!modal) return;
    
    titleEl.textContent = 'Data Processing Agreement';
    contentEl.innerHTML = `
        <div class="space-y-4">
            <p class="text-sm">As a school administrator, you must accept the Data Processing Agreement (DPA) to manage student data.</p>
            <div class="flex items-start gap-2">
                <input type="checkbox" id="modal-dpa" class="mt-1 rounded">
                <label for="modal-dpa" class="text-xs">I have read and accept the Data Processing Agreement</label>
            </div>
            <div class="flex justify-end gap-2">
                <button onclick="logout()" class="px-4 py-2 border rounded-lg">Logout</button>
                <button onclick="submitDPAAcceptance()" class="px-4 py-2 bg-primary text-white rounded-lg">Accept DPA</button>
            </div>
        </div>
    `;
    modal.classList.remove('hidden');
    window.submitDPAAcceptance = async function() {
        if (!document.getElementById('modal-dpa').checked) {
            showToast('You must accept the DPA', 'error');
            return;
        }
        showLoading();
        try {
            await api.consent.acceptDPA();
            modal.classList.add('hidden');
            await showDashboard(currentRole);
        } catch (e) {
            showToast('Failed to record DPA acceptance', 'error');
        } finally {
            hideLoading();
        }
    };
}

// ============ DASHBOARD RENDERING ============
async function showDashboard(role) {
    window.__shuleDashboardRunId = (window.__shuleDashboardRunId || 0) + 1;
    const __runId = window.__shuleDashboardRunId;
    const __storedUser = (typeof getCurrentUser === 'function') ? getCurrentUser() : {};
    const __storedRole = __storedUser?.role || localStorage.getItem('userRole');
    if (__storedRole && role && __storedRole !== role && !(role === 'superadmin' && __storedRole === 'super_admin')) {
        console.warn('Ignoring stale dashboard render for role:', role, 'current role:', __storedRole);
        role = (__storedRole === 'super_admin') ? 'superadmin' : __storedRole;
    }
    console.log('🔵 showDashboard called with role:', role);

    if (!role) {
        if (typeof getCurrentRole === 'function') role = getCurrentRole();
        if (!role) role = localStorage.getItem('userRole');
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

    // Check consent before showing dashboard
    const canProceed = await checkConsentAndDPA();
    if (!canProceed) return;

    const landingPage = document.getElementById('landing-page');
    const dashboardContainer = document.getElementById('dashboard-container');

    if (landingPage) landingPage.style.display = 'none';
    if (dashboardContainer) {
        dashboardContainer.style.display = 'block';
        dashboardContainer.setAttribute('data-current-role', role);
    }

    if (role === 'admin' || role === 'superadmin' || role === 'teacher') {
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
        if (__runId !== window.__shuleDashboardRunId) return;
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
            const savedChildId = localStorage.getItem('shule_selected_child_id');
            const selectedId = savedChildId || (children.data && children.data.length > 0 ? children.data[0].id : null);
            
            if (selectedId) {
                childSummary = await api.parent.getChildSummary(selectedId).catch(err => ({ data: {} }));
            }
            dashboardData = { 
                children: children.data, 
                selectedChild: childSummary?.data,
                selectedChildId: selectedId 
            };
        } else if (role === 'student') {
            const [studentDash, grades, attendance] = await Promise.all([
                api.student.getDashboard().catch(err => ({ data: {} })),
                api.student.getGrades().catch(err => ({ data: [] })),
                api.student.getAttendance().catch(err => ({ data: [] }))
            ]);
            dashboardData = { ...(studentDash.data || {}), grades: grades.data, attendance: attendance.data };
            window.studentDashboardData = dashboardData;
            if (dashboardData.school) {
                const schoolName = dashboardData.school.schoolName || dashboardData.school.name;
                const branding = dashboardData.school.branding || {};
                const logo = dashboardData.school.logo || branding.logoDataUrl || branding.logoUrl || branding.logo;
                try {
                    const storedSchool = JSON.parse(localStorage.getItem('school') || '{}') || {};
                    localStorage.setItem('school', JSON.stringify({ ...storedSchool, name: schoolName || storedSchool.name, schoolName: schoolName || storedSchool.schoolName, schoolId: dashboardData.school.schoolCode || storedSchool.schoolId, schoolCode: dashboardData.school.schoolCode || storedSchool.schoolCode, settings: { ...(storedSchool.settings || {}), branding: { ...(storedSchool.settings?.branding || {}), ...branding } } }));
                    localStorage.setItem('schoolBranding', JSON.stringify({ ...(JSON.parse(localStorage.getItem('schoolBranding') || '{}') || {}), ...branding, schoolName, displayName: schoolName, logo: logo || branding.logo || null, logoDataUrl: branding.logoDataUrl || (String(logo || '').startsWith('data:') ? logo : null), logoUrl: branding.logoUrl || (!String(logo || '').startsWith('data:') ? logo : null) }));
                    if (window.BrandingManager && typeof window.BrandingManager.forceApply === 'function') window.BrandingManager.forceApply(schoolName);
                } catch (_) {}
            }
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
            'student-subject-selection': 'Student Subject Selection',
            teachers: 'Teachers',
            classes: 'Classes',
            attendance: 'Attendance',
            grades: 'Grades',
            analytics: 'Analytics',
            duty: 'Duty Management',
            calendar: 'School Calendar',
            sms: 'Bulk SMS',
            'subject-requests': 'Subject Requests',
            'subject-choice': 'Subject Choice',
            'subject-selection': 'Subject Choices',
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
            'finance-fees': 'Finance & Fees',
            'fee-structures': 'Finance & Fees',
            'payment-settings': 'Finance & Fees',
            'subscription-billing': 'Subscription & Billing',
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
            'teacher-workload': 'Teacher Workload',
            alerts: 'Alerts Center',
            'parent-messages': 'Parent Messages',
            'career-path': 'Career Path'
        };
        pageTitle.textContent = sectionNames[section] || 'Dashboard';

        content.innerHTML = await renderDashboardSection(currentRole, section);

        setTimeout(() => { if (typeof applyGlobalProfilePictures === 'function') applyGlobalProfilePictures(); }, 80);

        updateSidebarActiveState(section);

        if (section === 'alerts') {
            setTimeout(() => { if (typeof v94LoadAlerts === 'function') v94LoadAlerts(); }, 100);
        }

        if (currentRole === 'admin' && section === 'duty') {
            setTimeout(() => { if (typeof v93LoadAdminDuty === 'function') v93LoadAdminDuty(); }, 100);
        }
        if (currentRole === 'teacher' && section === 'duty') {
            setTimeout(() => { if (typeof v93LoadTeacherDuty === 'function') v93LoadTeacherDuty(); }, 100);
        }

        if (currentRole === 'admin' && section === 'departments') {
            setTimeout(() => { if (typeof v92LoadDepartments === 'function') v92LoadDepartments(); }, 100);
        }

        // Dashboard pages must stay card/table based only.
        // Charts are initialized only inside the dedicated Analytics section.
        if (currentRole === 'teacher' && (section === 'chat' || section === 'messages' || section === 'staff-chat')) {
            setTimeout(() => { if (typeof v9RefreshTeacherChat === 'function') v9RefreshTeacherChat(); }, 100);
        }
        if (currentRole === 'student' && (section === 'chat' || section === 'classroom')) {
            setTimeout(() => { if (typeof v9LoadStudentThreads === 'function') v9LoadStudentThreads(); }, 100);
        }

        if (section === 'analytics') {
            setTimeout(() => {
                if (typeof initRoleCharts === 'function') {
                    initRoleCharts(currentRole, dashboardData);
                }
            }, 300);
        }

        setupSectionListeners(currentRole, section);

        // Dynamic dashboard sections are inserted after the branding manager may have booted.
        // Re-apply once after each render so student/parent headers and sidebar logos stay correct.
        setTimeout(() => {
            try {
                if (window.BrandingManager && typeof window.BrandingManager.forceApply === 'function') {
                    window.BrandingManager.forceApply();
                } else if (typeof window.updateAllSchoolNameElements === 'function') {
                    window.updateAllSchoolNameElements();
                }
            } catch (_) {}
        }, 30);

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
            if (section === 'analytics') {
                return await renderAnalyticsSection('superadmin');
            }
            if (typeof renderSuperAdminSection !== 'function') {
                console.error('renderSuperAdminSection missing');
                return '<div class="text-center py-12 text-red-500">Error: Super Admin module not loaded</div>';
            }
            return await renderSuperAdminSection(section);
        case 'admin':
            if (section === 'analytics') {
                return await renderAnalyticsSection('admin');
            }
            if (typeof renderAdminSection !== 'function') {
                console.error('renderAdminSection missing');
                return '<div class="text-center py-12 text-red-500">Error: Admin module not loaded</div>';
            }
            return await renderAdminSection(section);
        case 'teacher':
            if (section === 'analytics') {
                return await renderAnalyticsSection('teacher');
            }
            if (typeof renderTeacherSection !== 'function') {
                console.warn('renderTeacherSection missing – using built-in fallback');
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
            if (section === 'analytics') {
                return await renderAnalyticsSection('parent');
            }
            if (typeof renderParentSection !== 'function') {
                console.error('renderParentSection missing');
                return '<div class="text-center py-12 text-red-500">Error: Parent module not loaded</div>';
            }
            return await renderParentSection(section);
        case 'student':
            if (section === 'analytics') {
                return await renderAnalyticsSection('student');
            }
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
window.checkConsentAndDPA = checkConsentAndDPA;


// ===== dashboard-production.js merged into dashboard-controller.js =====

(function () {
  function getRole() {
    try {
      const user = JSON.parse(localStorage.getItem('shule_user') || localStorage.getItem('user') || 'null');
      return (user && (user.role || user.userRole || user.type)) || window.currentRole || '';
    } catch (_) {
      return window.currentRole || '';
    }
  }

  function normalizeRole(role) {
    return String(role || '').replace('-', '_').toLowerCase();
  }

  function applyRoleClass() {
    const role = normalizeRole(getRole());
    document.body.classList.remove('role-admin', 'role-teacher', 'role-parent', 'role-student', 'role-super_admin', 'role-superadmin');
    if (role) document.body.classList.add('role-' + role);
    if (role === 'super_admin') document.body.classList.add('role-superadmin');
  }

  function enhanceSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar || document.getElementById('desktop-sidebar-collapse')) return;

    const header = sidebar.querySelector('.h-16');
    if (!header) return;

    const button = document.createElement('button');
    button.id = 'desktop-sidebar-collapse';
    button.type = 'button';
    button.className = 'hidden lg:inline-flex h-10 w-10 items-center justify-center rounded-xl border hover:bg-accent';
    button.innerHTML = '<i data-lucide="panel-left-close" class="h-4 w-4"></i>';
    button.addEventListener('click', function () {
      document.body.classList.toggle('sidebar-collapsed');
      localStorage.setItem('shule_sidebar_collapsed', document.body.classList.contains('sidebar-collapsed') ? '1' : '0');
      if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
        if (typeof applyGlobalProfilePictures === 'function') applyGlobalProfilePictures();
    });

    header.classList.add('justify-between');
    header.appendChild(button);

    if (localStorage.getItem('shule_sidebar_collapsed') === '1') {
      document.body.classList.add('sidebar-collapsed');
    }
  }

  function enhanceTheme() {
    const saved = localStorage.getItem('shule_theme');
    if (saved === 'dark') document.documentElement.classList.add('dark');
    if (saved === 'light') document.documentElement.classList.remove('dark');

    const originalToggleTheme = window.toggleTheme;
    window.toggleTheme = function () {
      if (typeof originalToggleTheme === 'function') {
        originalToggleTheme();
      } else {
        document.documentElement.classList.toggle('dark');
      }
      localStorage.setItem('shule_theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
      setTimeout(applyRoleClass, 0);
    };
  }

  function markActiveLinks() {
    const current = window.currentSection || '';
    document.querySelectorAll('.sidebar-link, .mobile-nav-item').forEach(link => {
      const isActive = current && link.dataset.section === current;
      link.classList.toggle('sidebar-link-active', isActive);
      link.classList.toggle('active', isActive);
    });
  }

  function patchShowDashboardSection() {
    if (window.__dashboardProductionPatched) return;
    if (typeof window.showDashboardSection !== 'function') return;

    const original = window.showDashboardSection;
    window.showDashboardSection = async function (section) {
      window.currentSection = section;
      applyRoleClass();
      const result = await original.apply(this, arguments);
      setTimeout(function () {
        applyRoleClass();
        enhanceSidebar();
        markActiveLinks();
        injectStudentXP();
        if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
        if (typeof applyGlobalProfilePictures === 'function') applyGlobalProfilePictures();
      }, 0);
      return result;
    };
    window.__dashboardProductionPatched = true;
  }

  function patchShowDashboard() {
    if (window.__dashboardShellPatched) return;
    if (typeof window.showDashboard !== 'function') return;

    const original = window.showDashboard;
    window.showDashboard = async function () {
      applyRoleClass();
      const result = await original.apply(this, arguments);
      setTimeout(function () {
        applyRoleClass();
        enhanceSidebar();
        markActiveLinks();
        injectStudentXP();
        if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
        if (typeof applyGlobalProfilePictures === 'function') applyGlobalProfilePictures();
      }, 0);
      return result;
    };
    window.__dashboardShellPatched = true;
  }

  function injectStudentXP() {
    if (!document.body.classList.contains('role-student')) return;
    const content = document.getElementById('dashboard-content');
    if (!content || content.querySelector('.student-xp-hero')) return;
    if (!content.textContent.includes('Welcome back') && !content.textContent.includes('My ELIMUID')) return;

    let user = {};
    try { user = JSON.parse(localStorage.getItem('shule_user') || localStorage.getItem('user') || '{}'); } catch (_) {}
    const name = user.name || 'Student';
    const initials = name.split(' ').map(x => x[0]).join('').slice(0,2).toUpperCase() || 'ST';

    const hero = document.createElement('div');
    hero.className = 'student-xp-hero mb-6';
    hero.innerHTML = `
      <div class="flex items-center gap-4">
        <div class="student-xp-avatar">${initials}</div>
        <div>
          <p class="text-white/70 text-sm font-semibold">Welcome back</p>
          <h2 class="text-3xl font-black tracking-tight m-0">${name}</h2>
          <p class="text-white/75 text-sm mt-1">Level 8 learner • Keep your streak alive</p>
        </div>
      </div>
      <div class="student-xp-bar">
        <div class="flex justify-between gap-3 text-sm">
          <span class="text-white/75 font-semibold">XP Progress</span>
          <strong>1,240 / 1,500 XP</strong>
        </div>
        <div class="student-xp-bar-track"><span style="width:82%"></span></div>
      </div>
    `;
    content.prepend(hero);
  }

  function boot() {
    enhanceTheme();
    applyRoleClass();
    enhanceSidebar();
    patchShowDashboard();
    patchShowDashboardSection();
    markActiveLinks();

    const observer = new MutationObserver(function () {
      applyRoleClass();
      enhanceSidebar();
      markActiveLinks();
      injectStudentXP();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  window.addEventListener('load', function () {
    patchShowDashboard();
    patchShowDashboardSection();
    applyRoleClass();
    enhanceSidebar();
    markActiveLinks();
  });
})();


// ===== mobile-navigation-v18.js merged into dashboard-controller.js =====
// mobile-navigation-v18.js - production mobile/tablet responsiveness layer
(function () {
  'use strict';

  const w = window;
  const d = document;
  const MOBILE_MAX = 1023;

  function isMobile() {
    return w.matchMedia && w.matchMedia(`(max-width: ${MOBILE_MAX}px)`).matches;
  }

  function currentRole() {
    try {
      const user = JSON.parse(localStorage.getItem('currentUser') || localStorage.getItem('user') || '{}');
      return user.role || localStorage.getItem('userRole') || 'student';
    } catch (_) {
      return localStorage.getItem('userRole') || 'student';
    }
  }

  function setMobileClass() {
    d.documentElement.classList.add('mobile-ready');
    d.body.classList.add('mobile-ready');
    d.body.classList.toggle('is-mobile-viewport', isMobile());
  }

  function sidebarOpen() {
    const sidebar = d.getElementById('sidebar');
    const overlay = d.getElementById('mobile-overlay');
    if (!sidebar) return;
    sidebar.classList.remove('-translate-x-full');
    if (overlay) overlay.classList.remove('hidden');
    d.body.classList.add('mobile-sidebar-open', 'v18-no-scroll');
  }

  function sidebarClose() {
    const sidebar = d.getElementById('sidebar');
    const overlay = d.getElementById('mobile-overlay');
    if (!sidebar) return;
    if (isMobile()) sidebar.classList.add('-translate-x-full');
    if (overlay) overlay.classList.add('hidden');
    d.body.classList.remove('mobile-sidebar-open', 'v18-no-scroll');
  }

  const originalToggle = w.toggleMobileSidebar;
  w.toggleMobileSidebar = function v18ToggleMobileSidebar() {
    const sidebar = d.getElementById('sidebar');
    if (!sidebar) return;
    const isOpen = !sidebar.classList.contains('-translate-x-full') || d.body.classList.contains('mobile-sidebar-open');
    if (isOpen) sidebarClose(); else sidebarOpen();
    return false;
  };
  w.v18CloseMobileSidebar = sidebarClose;

  function normalizeBottomNav() {
    const mobileNav = d.getElementById('mobile-nav');
    if (!mobileNav) return;
    const items = Array.from(mobileNav.querySelectorAll('a,button'));
    items.forEach((item) => {
      item.classList.add('mobile-nav-item');
      item.addEventListener('click', () => setTimeout(sidebarClose, 25), { passive: true });
    });
    if (items.length > 5) {
      items.slice(5).forEach((item) => item.classList.add('hidden'));
    }
  }

  function enhanceSidebarLinks() {
    d.querySelectorAll('#sidebar-nav a, #settings-nav a, .mobile-nav-item').forEach((link) => {
      if (link.dataset.v18Bound) return;
      link.dataset.v18Bound = '1';
      link.addEventListener('click', () => {
        if (isMobile()) setTimeout(sidebarClose, 80);
      }, { passive: true });
    });
  }

  function enhanceTables(root = d) {
    const content = d.getElementById('dashboard-content');
    if (!content) return;
    root.querySelectorAll?.('#dashboard-content table').forEach((table) => {
      if (table.dataset.v18TableReady) return;
      table.dataset.v18TableReady = '1';
      table.classList.add('v18-card-table');

      const headers = Array.from(table.querySelectorAll('thead th')).map((th) => th.textContent.trim());
      table.querySelectorAll('tbody tr').forEach((row) => {
        Array.from(row.children).forEach((cell, idx) => {
          if (!cell.getAttribute('data-label')) cell.setAttribute('data-label', headers[idx] || `Field ${idx + 1}`);
        });
      });

      const parent = table.parentElement;
      if (parent && !parent.classList.contains('v18-table-scroll') && parent.id !== 'dashboard-content') {
        const computed = w.getComputedStyle(parent);
        if (computed.overflowX === 'visible') parent.classList.add('v18-table-scroll');
      } else if (parent && parent.id === 'dashboard-content') {
        const wrap = d.createElement('div');
        wrap.className = 'v18-table-scroll';
        table.parentNode.insertBefore(wrap, table);
        wrap.appendChild(table);
      }
    });
  }

  function enhanceForms(root = d) {
    root.querySelectorAll?.('#dashboard-content form, #dashboard-content .grid, #dashboard-content .flex').forEach((el) => {
      if (el.dataset.v18FormReady) return;
      const hasInput = el.querySelector('input, select, textarea');
      if (hasInput) el.dataset.v18FormReady = '1';
    });

    root.querySelectorAll?.('#dashboard-content input, #dashboard-content select, #dashboard-content textarea').forEach((el) => {
      if (el.dataset.v18InputReady) return;
      el.dataset.v18InputReady = '1';
      if (!el.getAttribute('autocomplete') && /name/i.test(el.name || el.id || '')) el.setAttribute('autocomplete', 'name');
      if (!el.getAttribute('inputmode')) {
        const type = (el.getAttribute('type') || '').toLowerCase();
        const id = `${el.id || ''} ${el.name || ''} ${el.placeholder || ''}`.toLowerCase();
        if (type === 'tel' || id.includes('phone')) el.setAttribute('inputmode', 'tel');
        if (type === 'number' || id.includes('marks') || id.includes('score') || id.includes('amount')) el.setAttribute('inputmode', 'decimal');
      }
    });
  }

  function enhanceModals(root = d) {
    root.querySelectorAll?.('.fixed.inset-0, [id$="modal"], [id$="Modal"], .modal').forEach((modal) => {
      if (modal.dataset.v18ModalReady) return;
      modal.dataset.v18ModalReady = '1';
      modal.addEventListener('click', (event) => {
        if (!isMobile()) return;
        if (event.target === modal && /modal|overlay/i.test(modal.id || modal.className || '')) {
          const close = modal.querySelector('[onclick*="close"], [data-close], .close, button[aria-label="Close"]');
          if (close) close.click();
        }
      });
    });
  }

  function enhanceCharts(root = d) {
    root.querySelectorAll?.('#dashboard-content canvas').forEach((canvas) => {
      if (canvas.dataset.v18ChartReady) return;
      canvas.dataset.v18ChartReady = '1';
      const parent = canvas.parentElement;
      if (parent) parent.classList.add('v18-chart-wrap');
    });
  }

  function enhanceButtons(root = d) {
    root.querySelectorAll?.('#dashboard-content button, #dashboard-content a[onclick]').forEach((btn) => {
      if (btn.dataset.v18ButtonReady) return;
      btn.dataset.v18ButtonReady = '1';
      btn.classList.add('touch-target');
    });
  }

  function enhanceTimetables(root = d) {
    root.querySelectorAll?.('.timetable-grid, .v12-timetable-grid, .timetable-board, .timetable-container, .timetable-wrapper').forEach((el) => {
      el.classList.add('v18-horizontal-scroll');
    });
  }

  function enhanceContent(root = d) {
    setMobileClass();
    normalizeBottomNav();
    enhanceSidebarLinks();
    enhanceTables(root);
    enhanceForms(root);
    enhanceModals(root);
    enhanceCharts(root);
    enhanceButtons(root);
    enhanceTimetables(root);
  }

  function addMobileMoreNav() {
    const mobileNav = d.getElementById('mobile-nav');
    if (!mobileNav || mobileNav.dataset.v18MoreReady) return;
    mobileNav.dataset.v18MoreReady = '1';
    const more = d.createElement('button');
    more.type = 'button';
    more.className = 'mobile-nav-item flex flex-col items-center justify-center flex-1 h-14 text-muted-foreground';
    more.innerHTML = '<i data-lucide="menu" class="h-5 w-5"></i><span class="text-xs mt-1">More</span>';
    more.onclick = function () { sidebarOpen(); return false; };
    if (mobileNav.children.length >= 4) mobileNav.appendChild(more);
    if (w.lucide?.createIcons) w.lucide.createIcons();
  }

  function patchSectionRenderer() {
    if (w.__v18SectionRendererPatched) return;
    const original = w.showDashboardSection;
    if (typeof original !== 'function') return;
    w.__v18SectionRendererPatched = true;
    w.showDashboardSection = async function v18ShowDashboardSection(section) {
      const result = await original.apply(this, arguments);
      setTimeout(() => {
        enhanceContent(d);
        addMobileMoreNav();
        if (isMobile()) sidebarClose();
      }, 30);
      return result;
    };
  }

  function installMutationObserver() {
    const target = d.getElementById('dashboard-content') || d.body;
    if (!target || w.__v18MobileObserver) return;
    w.__v18MobileObserver = new MutationObserver((mutations) => {
      let shouldEnhance = false;
      for (const mutation of mutations) {
        if (mutation.addedNodes && mutation.addedNodes.length) { shouldEnhance = true; break; }
      }
      if (shouldEnhance) w.requestAnimationFrame(() => enhanceContent(target));
    });
    w.__v18MobileObserver.observe(target, { childList: true, subtree: true });
  }

  function patchResize() {
    w.addEventListener('resize', () => {
      setMobileClass();
      if (!isMobile()) sidebarClose();
    }, { passive: true });
    w.addEventListener('orientationchange', () => setTimeout(enhanceContent, 250), { passive: true });
  }

  function init() {
    setMobileClass();
    enhanceContent(d);
    addMobileMoreNav();
    patchSectionRenderer();
    installMutationObserver();
    patchResize();
    if (isMobile()) sidebarClose();

    // Some older files rebuild mobile nav after login; re-run after common async loads.
    setTimeout(() => { enhanceContent(d); addMobileMoreNav(); patchSectionRenderer(); }, 500);
    setTimeout(() => { enhanceContent(d); addMobileMoreNav(); patchSectionRenderer(); }, 1500);
  }

  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', init);
  else init();

  w.v18EnhanceMobileLayout = enhanceContent;
})();


// ===== v34 dashboard cleanup =====
(function(){
  function cleanupSidebar(){
    document.querySelectorAll('[data-section="payment-settings"],[data-section="fee-structures"]').forEach(el=>el.remove());
    document.querySelectorAll('.sidebar-link, .nav-item, button, a').forEach(el=>{
      const t=(el.textContent||'').trim().toLowerCase();
      if(t==='payment details' || t==='fee structures') el.remove();
    });
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', cleanupSidebar); else cleanupSidebar();
  const mo=new MutationObserver(cleanupSidebar);
  if(document.body) mo.observe(document.body,{childList:true,subtree:true});
})();
