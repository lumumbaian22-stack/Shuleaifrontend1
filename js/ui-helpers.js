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
    const messages = [
        "📚 Did you know? CBC focuses on competencies, not just exams!",
        "🧠 A short break every 45 minutes boosts productivity.",
        "💧 Stay hydrated – it improves concentration by 20%.",
        "🏃 Physical activity before study time enhances memory.",
        "🎯 Set small daily goals for your child to build momentum."
    ];
    popupInterval = setInterval(() => {
        const randomMsg = messages[Math.floor(Math.random() * messages.length)];
        showToast(randomMsg, 'info', 6000);
    }, 120000); // every 2 minutes
}
// Call startSmartPopups() after login (in showDashboard)

// Add search functionality
function initGlobalSearch() {
    const searchInput = document.getElementById('global-search');
    const searchResults = document.getElementById('search-results');
    if (!searchInput || !searchResults) return;

    let debounceTimer;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        const term = e.target.value.trim();
        if (term.length < 2) {
            searchResults.classList.add('hidden');
            return;
        }
        debounceTimer = setTimeout(() => performSearch(term), 300);
    });

    searchInput.addEventListener('focus', () => {
        const term = searchInput.value.trim();
        if (term.length >= 2) {
            performSearch(term);
        }
    });

    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
            searchResults.classList.add('hidden');
        }
    });
}

async function performSearch(term) {
    const searchResults = document.getElementById('search-results');
    try {
        const response = await apiRequest(`/api/search?q=${encodeURIComponent(term)}`);
        if (response.success) {
            renderSearchResults(response.data);
        }
    } catch (error) {
        console.error('Search error:', error);
        searchResults.innerHTML = '<div class="p-4 text-center text-red-500">Search failed</div>';
        searchResults.classList.remove('hidden');
    }
}

function renderSearchResults(data) {
    const searchResults = document.getElementById('search-results');
    let html = '';
    if (data.students?.length) {
        html += '<div class="p-2 text-xs font-semibold text-muted-foreground border-b">Students</div>';
        data.students.forEach(s => {
            html += `<div class="p-2 hover:bg-accent cursor-pointer flex items-center gap-2" onclick="showUnifiedStudentModal('${s.id}')">
                ${s.photo ? `<img src="${s.photo}" class="h-6 w-6 rounded-full object-cover">` : `<div class="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center"><span class="text-xs">${getInitials(s.name)}</span></div>`}
                <div><span class="font-medium">${escapeHtml(s.name)}</span><br><span class="text-xs text-muted-foreground">${escapeHtml(s.elimuid)} · Grade ${escapeHtml(s.grade)}</span></div>
            </div>`;
        });
    }
    if (data.teachers?.length) {
        html += '<div class="p-2 text-xs font-semibold text-muted-foreground border-b">Teachers</div>';
        data.teachers.forEach(t => {
            html += `<div class="p-2 hover:bg-accent cursor-pointer" onclick="viewTeacherDetails('${t.id}')">
                <span class="font-medium">${escapeHtml(t.name)}</span><br><span class="text-xs text-muted-foreground">${escapeHtml(t.employeeId)} · ${escapeHtml(t.email)}</span>
            </div>`;
        });
    }
    if (data.classes?.length) {
        html += '<div class="p-2 text-xs font-semibold text-muted-foreground border-b">Classes</div>';
        data.classes.forEach(c => {
            html += `<div class="p-2 hover:bg-accent cursor-pointer" onclick="showDashboardSection('classes'); setTimeout(() => { if(typeof filterClass === 'function') filterClass(${c.id}); }, 200);">
                <span class="font-medium">${escapeHtml(c.name)}</span> (Grade ${escapeHtml(c.grade)}${c.stream ? ' ' + escapeHtml(c.stream) : ''})
            </div>`;
        });
    }
    if (!html) {
        html = '<div class="p-4 text-center text-muted-foreground">No results</div>';
    }
    searchResults.innerHTML = html;
    searchResults.classList.remove('hidden');
}

// Call initGlobalSearch on DOM ready
document.addEventListener('DOMContentLoaded', initGlobalSearch);

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
