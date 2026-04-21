// sidebar.js - Sidebar navigation and user info

function updateSidebar(role) {
    const nav = document.getElementById('sidebar-nav');
    const settingsNav = document.getElementById('settings-nav');
    const mobileNav = document.getElementById('mobile-nav');
    
    // Update sidebar school name
    const schoolNameSpan = document.getElementById('sidebar-school-name');
    const school = getCurrentSchool();
    
    if (schoolNameSpan && school && school.status === 'active' && school.name) {
        schoolNameSpan.textContent = school.name;
    } else if (schoolNameSpan) {
        schoolNameSpan.textContent = 'ShuleAI';
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
                { icon: 'bar-chart-2', label: 'Analytics', section: 'analytics' }
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
                { icon: 'user-plus', label: 'Teacher Approvals', section: 'teacher-approvals' },
                { icon: 'graduation-cap', label: 'Students', section: 'students' },
                { icon: 'calendar', label: 'Calendar', section: 'calendar' },
                { icon: 'clock', label: 'Duty', section: 'duty' },
                { icon: 'bar-chart-2', label: 'Fairness Report', section: 'fairness-report' },
                { icon: 'book-open', label: 'Custom Subjects', section: 'custom-subjects' },
                { icon: 'trending-up', label: 'Analytics', section: 'analytics' }
            ],
            settings: [
                { icon: 'settings', label: 'School Settings', section: 'settings' },
                { icon: 'help-circle', label: 'Help', section: 'help' },
                { icon: 'users', label: 'Classes', section: 'classes' }
            ]
        },
        teacher: {
            main: [
                { icon: 'layout-dashboard', label: 'Dashboard', section: 'dashboard' },
                { icon: 'users', label: 'My Students', section: 'students' },
                { icon: 'calendar-check', label: 'Attendance', section: 'attendance' },
                { icon: 'trending-up', label: 'Grades', section: 'grades' },
                { icon: 'check-square', label: 'Tasks', section: 'tasks' },
                { icon: 'clock', label: 'My Duty', section: 'duty' },
                { icon: 'settings', label: 'Duty Preferences', section: 'duty-preferences' },
                { icon: 'message-circle', label: 'Staff Chat', section: 'staff-chat' },
                { icon: 'bar-chart-2', label: 'Analytics', section: 'analytics' }
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
                { icon: 'message-circle', label: 'Messages', section: 'chat' },
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
                { icon: 'calendar', label: 'Schedule', section: 'schedule' },
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

    const userInitials = document.getElementById('user-initials');
    const userName = document.getElementById('user-name');
    const dropdownName = document.getElementById('dropdown-user-name');
    const dropdownEmail = document.getElementById('dropdown-user-email');

    if (userInitials) userInitials.textContent = initials;
    if (userName) userName.textContent = name;
    if (dropdownName) dropdownName.textContent = name;
    if (dropdownEmail) dropdownEmail.textContent = user?.email || '';
}

// Function to update sidebar school name (called when school name changes)
function updateSidebarSchoolName(newName) {
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
