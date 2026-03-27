// main.js - Entry point, initialises the application
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
            closeAuthModal();
            closeNameChangeModal();
        }
    });

    document.addEventListener('click', (e) => {
        const menu = document.getElementById('user-menu');
        const btn = e.target.closest('button');
        if (menu && !menu.contains(e.target) && (!btn || !btn.onclick || !btn.onclick.toString().includes('toggleUserMenu'))) {
            menu.classList.add('hidden');
        }
    });
}