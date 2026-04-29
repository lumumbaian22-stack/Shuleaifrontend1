// main.js - Entry point

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🔵 DOM Content Loaded - Starting initialization');

    if (typeof lucide !== 'undefined' && lucide.createIcons) {
        lucide.createIcons();
    }

    const savedSettings = localStorage.getItem('schoolSettings');
    if (savedSettings) {
        try {
            schoolSettings = JSON.parse(savedSettings);
            customSubjects = schoolSettings.customSubjects || [];
            console.log('✅ School settings loaded from localStorage');
        } catch (e) {
            console.error('Failed to parse school settings:', e);
        }
    }

    await new Promise(resolve => setTimeout(resolve, 100));

    console.log('Checking authentication...');
    const isAuthenticated = await checkAuth();
    console.log('Is authenticated:', isAuthenticated);

    if (isAuthenticated) {
        let role = null;
        if (currentUser && currentUser.role) role = currentUser.role;
        if (!role && typeof getCurrentRole === 'function') role = getCurrentRole();
        if (!role) role = localStorage.getItem('userRole');
        if (!role) {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            role = user.role;
        }
        if (!role) {
            const user = getCurrentUser();
            role = user.role;
        }
        if (!role) {
            console.log('⚠️ No role found in storage, attempting API call...');
            try {
                const response = await api.auth.getMe();
                if (response && response.data && response.data.user) {
                    role = response.data.user.role;
                    localStorage.setItem('userRole', role);
                    localStorage.setItem('user', JSON.stringify(response.data.user));
                    console.log('✅ Role from API:', role);
                }
            } catch (error) {
                console.error('❌ Failed to fetch user from API:', error);
            }
        }

        if (role) {
            console.log('🎯 Final role determined:', role);
            if (role === 'super_admin') {
                role = 'superadmin';
                console.log('🔄 Converted super_admin to superadmin');
            }
            await showDashboard(role);
            if (typeof connectWebSocket === 'function') {
                setTimeout(connectWebSocket, 500);
            }
        } else {
            console.error('❌ Authenticated but no role could be determined');
            showToast('Session error. Please log in again.', 'error');
            setTimeout(() => {
                window.location.href = '/';
            }, 2000);
        }
    } else {
        console.log('User not authenticated, showing landing page');
    }

    setupEventListeners();

    const currentDateEl = document.getElementById('current-date');
    if (currentDateEl) {
        currentDateEl.textContent = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    console.log('✅ Initialization complete');
});

function setupEventListeners() {
    const secretTrigger = document.getElementById('secret-logo-trigger');
    if (secretTrigger) {
        secretTrigger.addEventListener('click', () => {
            clickCount++;
            if (clickCount === 3) {
                const superAdminCard = document.getElementById('superadmin-role-card');
                if (superAdminCard) {
                    superAdminCard.classList.remove('hidden');
                    showToast('Super Admin access granted', 'info');
                }
                clickCount = 0;
            }
            setTimeout(() => clickCount = 0, 2000);
        });
    }

    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('bg-black/50')) {
            if (typeof closeAuthModal === 'function') closeAuthModal();
            if (typeof closeNameChangeModal === 'function') closeNameChangeModal();
            if (typeof closeDayDetailsModal === 'function') closeDayDetailsModal();
        }
    });

    document.addEventListener('click', (e) => {
        const menu = document.getElementById('user-menu');
        const btn = e.target.closest('button');
        if (menu && !menu.contains(e.target) && (!btn || !btn.onclick || !btn.onclick.toString().includes('toggleUserMenu'))) {
            if (typeof toggleUserMenu === 'function') menu.classList.add('hidden');
        }
    });
}

// ============ SCHOOL NAME CHANGE CROSS-TAB SYNC ============

// Listen for school name changes from other tabs/windows
window.addEventListener('storage', function(e) {
    if (e.key === 'pendingSchoolNameChange' && e.newValue) {
        try {
            const nameChangeData = JSON.parse(e.newValue);
            const currentSchool = getCurrentSchool();
            
            console.log('Storage event detected - School name change:', nameChangeData);
            
            // Check if this name change affects the current user's school
            if (currentSchool && (currentSchool.id === nameChangeData.schoolId || 
                                   currentSchool.shortCode === nameChangeData.schoolCode)) {
                console.log('✅ School name change applies to current user. Updating to:', nameChangeData.newName);
                
                // Update school in localStorage
                const updatedSchool = {
                    ...currentSchool,
                    name: nameChangeData.newName,
                    settings: { ...currentSchool.settings, schoolName: nameChangeData.newName }
                };
                localStorage.setItem('school', JSON.stringify(updatedSchool));
                
                // Update schoolSettings
                const settings = JSON.parse(localStorage.getItem('schoolSettings') || '{}');
                settings.schoolName = nameChangeData.newName;
                localStorage.setItem('schoolSettings', JSON.stringify(settings));
                
                // Update global variables
                if (typeof window.schoolSettings !== 'undefined') {
                    window.schoolSettings.schoolName = nameChangeData.newName;
                }
                if (typeof window.currentSchool !== 'undefined') {
                    window.currentSchool = updatedSchool;
                }
                
                // Update ALL UI elements
                updateAllSchoolNameElements(nameChangeData.newName);
                
                // Refresh current section to show updated name
                if (typeof showDashboardSection === 'function' && window.currentSection) {
                    showDashboardSection(window.currentSection);
                }
                
                // Show toast notification
                showToast(`School name changed to "${nameChangeData.newName}"`, 'info', 5000);
                
                // Clear the pending change to prevent repeated updates
                localStorage.removeItem('pendingSchoolNameChange');
            }
        } catch (error) {
            console.error('Error processing school name change:', error);
        }
    }
});

// Listen for custom event (for same-tab updates)
window.addEventListener('school-name-changed', function(event) {
    const { newName, schoolId, schoolCode } = event.detail;
    const currentSchool = getCurrentSchool();
    
    console.log('Custom event detected - School name change:', newName);
    
    if (currentSchool && (currentSchool.id === schoolId || currentSchool.shortCode === schoolCode)) {
        updateAllSchoolNameElements(newName);
        showToast(`School name changed to "${newName}"`, 'info', 5000);
    }
});

// Function to update all school name elements across the entire application
function updateAllSchoolNameElements(newName) {
    console.log('🔄 Updating all school name elements to:', newName);
    
    // Update sidebar school name (by ID)
    const sidebarSchoolName = document.getElementById('sidebar-school-name');
    if (sidebarSchoolName) {
        sidebarSchoolName.textContent = newName;
        console.log('✅ Updated sidebar school name');
    }
    
    // Update admin dashboard school name
    const adminSchoolName = document.getElementById('dashboard-school-name');
    if (adminSchoolName) {
        adminSchoolName.textContent = newName;
        console.log('✅ Updated admin dashboard school name');
    }
    
    // Update teacher dashboard school name
    const teacherSchoolName = document.getElementById('teacher-school-name');
    if (teacherSchoolName) {
        teacherSchoolName.textContent = newName;
        console.log('✅ Updated teacher dashboard school name');
    }
    
    // Update parent dashboard school name
    const parentSchoolName = document.getElementById('parent-school-name');
    if (parentSchoolName) {
        parentSchoolName.textContent = newName;
        console.log('✅ Updated parent dashboard school name');
    }
    
    // Update student dashboard school name
    const studentSchoolName = document.getElementById('student-school-name');
    if (studentSchoolName) {
        studentSchoolName.textContent = newName;
        console.log('✅ Updated student dashboard school name');
    }
    
    // Update any elements with class .school-name
    document.querySelectorAll('.school-name, .school-name-display, [data-school-name]').forEach(el => {
        el.textContent = newName;
        console.log('✅ Updated element with class:', el.className);
    });
    
    // Update the main school name in admin dashboard card (fallback)
    const adminCardSchoolName = document.querySelector('.rounded-xl.border.bg-card.p-6 h2.text-2xl.font-bold');
    if (adminCardSchoolName && adminCardSchoolName.id !== 'dashboard-school-name') {
        adminCardSchoolName.textContent = newName;
        console.log('✅ Updated admin card school name');
    }
    
    // Update school name in profile section if visible
    const profileSchoolName = document.querySelector('#profile-section .school-name, .profile-school-name');
    if (profileSchoolName) {
        profileSchoolName.textContent = newName;
        console.log('✅ Updated profile school name');
    }
    
    // Update landing page school name if visible (for super admin preview)
    const landingSchoolName = document.querySelector('.landing-school-name, #landing-school-name');
    if (landingSchoolName) {
        landingSchoolName.textContent = newName;
        console.log('✅ Updated landing page school name');
    }
    
    // Force a re-render of the current section to catch any dynamically loaded elements
    setTimeout(() => {
        if (typeof showDashboardSection === 'function' && window.currentSection) {
            showDashboardSection(window.currentSection);
        }
    }, 100);
}

// Make the function globally available
window.updateAllSchoolNameElements = updateAllSchoolNameElements;
