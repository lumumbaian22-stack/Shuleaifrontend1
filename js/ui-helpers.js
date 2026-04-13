// ui-helpers.js - UI helper functions

function showLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.classList.remove('hidden');
}

function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.classList.add('hidden');
}

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

function toggleTheme() {
  const isDark = document.documentElement.classList.contains('dark');
  if (isDark) {
    document.documentElement.classList.remove('dark');
  } else {
    document.documentElement.classList.add('dark');
  }
  // Update the dark mode toggle button UI if it exists
  const darkModeBtn = document.getElementById('pref-darkmode');
  if (darkModeBtn) {
    const newDarkMode = document.documentElement.classList.contains('dark');
    if (newDarkMode) {
      darkModeBtn.classList.remove('bg-muted');
      darkModeBtn.classList.add('bg-primary');
      darkModeBtn.querySelector('span').classList.remove('translate-x-1');
      darkModeBtn.querySelector('span').classList.add('translate-x-6');
    } else {
      darkModeBtn.classList.remove('bg-primary');
      darkModeBtn.classList.add('bg-muted');
      darkModeBtn.querySelector('span').classList.remove('translate-x-6');
      darkModeBtn.querySelector('span').classList.add('translate-x-1');
    }
  }
  if (typeof updateChartTheme === 'function') updateChartTheme();
}

function toggleMobileSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('mobile-overlay');
    if (sidebar) sidebar.classList.toggle('-translate-x-full');
    if (overlay) overlay.classList.toggle('hidden');
}

function toggleUserMenu() {
    const menu = document.getElementById('user-menu');
    if (menu) menu.classList.toggle('hidden');
}

function toggleNotifications() {
    const panel = document.getElementById('notifications-panel');
    if (panel) {
        panel.classList.toggle('hidden');
        if (!panel.classList.contains('hidden')) {
            if (typeof loadNotifications === 'function') loadNotifications();
        }
    } else {
        showToast('Notifications coming soon', 'info');
    }
}

let popupInterval = null;
function startSmartPopups() {
  if (popupInterval) clearInterval(popupInterval);
  popupInterval = setInterval(() => {
    const messages = [
      "Did you know? You can upload students via CSV!",
      "Reminder: Duty check-in is available 15 minutes before start.",
      "Tip: Use the AI Tutor for extra help."
    ];
    const random = messages[Math.floor(Math.random() * messages.length)];
    showToast(random, 'info', 5000);
  }, 60000); // every minute
}
// Call startSmartPopups() after login.

// Add search functionality
window.searchContent = function() {
    const searchInput = document.getElementById('global-search');
    const searchTerm = searchInput?.value.toLowerCase().trim();

    if (!searchTerm) {
        // Show all content
        document.querySelectorAll('.searchable').forEach(el => el.style.display = '');
        return;
    }

    // Find all searchable elements (tables, cards, etc.)
    const searchableElements = document.querySelectorAll('.searchable, table tbody tr, .card');
    let foundCount = 0;

    searchableElements.forEach(el => {
        const text = el.textContent.toLowerCase();
        if (text.includes(searchTerm)) {
            el.style.display = '';
            foundCount++;
        } else {
            el.style.display = 'none';
        }
    });

    if (foundCount === 0) {
        showToast('No results found', 'info');
    }
};

// Add search input listener in main.js or here
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('global-search');
    if (searchInput) {
        searchInput.addEventListener('input', window.searchContent);
    }
});

// Add fade-out animation
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

window.showLoading = showLoading;
window.hideLoading = hideLoading;
window.showToast = showToast;
window.toggleSwitch = toggleSwitch;
window.toggleTheme = toggleTheme;
window.toggleMobileSidebar = toggleMobileSidebar;
window.toggleUserMenu = toggleUserMenu;
window.toggleNotifications = toggleNotifications;
