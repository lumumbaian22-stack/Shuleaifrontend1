// ui-helpers.js - UI helper functions (loading, toasts, modals, theme)

// ============ LOADING OVERLAY ============
function showLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.classList.remove('hidden');
}

function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.classList.add('hidden');
}

// ============ TOAST NOTIFICATIONS ============
function showToast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');

    const colors = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        warning: 'bg-amber-500',
        info: 'bg-blue-500'
    };

    const icons = {
        success: 'check-circle',
        error: 'x-circle',
        warning: 'alert-triangle',
        info: 'info'
    };

    toast.className = `${colors[type]} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-slide-in`;
    toast.innerHTML = `<i data-lucide="${icons[type]}" class="h-5 w-5 flex-shrink-0"></i><span>${message}</span>`;

    container.appendChild(toast);
    if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();

    setTimeout(() => {
        toast.classList.add('animate-fade-out');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// ============ TOGGLE SWITCH (for preferences) ============
function toggleSwitch(btn) {
    const checked = btn.dataset.checked === 'true';
    btn.dataset.checked = !checked;

    const span = btn.querySelector('span');
    if (!checked) {
        btn.classList.remove('bg-muted');
        btn.classList.add('bg-primary');
        span.classList.remove('translate-x-1');
        span.classList.add('translate-x-6');
    } else {
        btn.classList.remove('bg-primary');
        btn.classList.add('bg-muted');
        span.classList.remove('translate-x-6');
        span.classList.add('translate-x-1');
    }
}

// ============ THEME TOGGLE ============
function toggleTheme() {
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
    if (typeof updateChartTheme === 'function') updateChartTheme();
}

// ============ MOBILE SIDEBAR ============
function toggleMobileSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('mobile-overlay');
    if (sidebar) sidebar.classList.toggle('-translate-x-full');
    if (overlay) overlay.classList.toggle('hidden');
}

// ============ USER MENU ============
function toggleUserMenu() {
    const menu = document.getElementById('user-menu');
    if (menu) menu.classList.toggle('hidden');
}

// ui-helpers.js - Add this at the end

// Add fade-out animation class
const style = document.createElement('style');
style.textContent = `
    .animate-fade-out {
        animation: fadeOut 0.3s ease-out forwards;
    }
    @keyframes fadeOut {
        from { opacity: 1; transform: translateX(0); }
        to { opacity: 0; transform: translateX(20px); }
    }
`;
document.head.appendChild(style);

// Expose globally
window.showLoading = showLoading;
window.hideLoading = hideLoading;
window.showToast = showToast;
window.toggleSwitch = toggleSwitch;
window.toggleTheme = toggleTheme;
window.toggleMobileSidebar = toggleMobileSidebar;
window.toggleUserMenu = toggleUserMenu;