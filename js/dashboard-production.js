
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
