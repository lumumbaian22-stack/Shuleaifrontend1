// Shule AI V85 - Full mobile responsive + PWA shell
// Additive enhancement layer. Keeps existing dashboard/business logic intact.
(function () {
  'use strict';

  const MOBILE_MAX = 1023;
  const SUPPORTS_MATCH = typeof window.matchMedia === 'function';
  let deferredInstallPrompt = null;

  function safeJson(keys) {
    for (const key of keys) {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const parsed = JSON.parse(raw);
        if (parsed) return parsed;
      } catch (_) {}
    }
    return null;
  }

  function currentUser() {
    return (typeof window.getCurrentUser === 'function' && window.getCurrentUser()) ||
      safeJson(['shule_user', 'currentUser', 'user']) ||
      window.currentUser || {};
  }

  function currentRole() {
    const u = currentUser();
    return String(u.role || u.userRole || localStorage.getItem('role') || window.currentRole || '').replace('-', '_').toLowerCase();
  }

  function isMobile() {
    return SUPPORTS_MATCH ? window.matchMedia(`(max-width: ${MOBILE_MAX}px)`).matches : window.innerWidth <= MOBILE_MAX;
  }

  function setMobileClass() {
    document.body.classList.toggle('shule-mobile', isMobile());
    document.body.classList.toggle('shule-desktop', !isMobile());
  }

  function closeMobileSidebar() {
    document.body.classList.remove('mobile-sidebar-open');
    document.getElementById('sidebar')?.classList.remove('mobile-open');
    document.getElementById('mobile-overlay')?.classList.remove('mobile-open');
  }

  function openMobileSidebar() {
    document.body.classList.add('mobile-sidebar-open');
    document.getElementById('sidebar')?.classList.add('mobile-open');
    document.getElementById('mobile-overlay')?.classList.add('mobile-open');
  }

  function patchSidebarToggle() {
    if (window.__shuleMobileSidebarPatched) return;
    const original = window.toggleMobileSidebar;
    window.toggleMobileSidebar = function () {
      if (!isMobile()) {
        if (typeof original === 'function') return original.apply(this, arguments);
        return;
      }
      if (document.body.classList.contains('mobile-sidebar-open')) closeMobileSidebar();
      else openMobileSidebar();
    };
    window.__shuleMobileSidebarPatched = true;
  }

  const quickNavByRole = {
    admin: ['dashboard', 'finance-fees', 'students', 'alerts', 'help'],
    superadmin: ['dashboard', 'schools', 'platform-payments', 'alerts', 'help'],
    super_admin: ['dashboard', 'schools', 'platform-payments', 'alerts', 'help'],
    teacher: ['dashboard', 'attendance', 'homework', 'staff-chat', 'alerts'],
    parent: ['dashboard', 'payments', 'chat', 'alerts', 'help'],
    student: ['dashboard', 'my-homework', 'ai-tutor', 'chat', 'alerts']
  };

  const labels = {
    dashboard: ['layout-dashboard', 'Home'],
    'finance-fees': ['wallet', 'Fees'],
    students: ['graduation-cap', 'Students'],
    schools: ['building-2', 'Schools'],
    'platform-payments': ['credit-card', 'Payments'],
    attendance: ['calendar-check', 'Attend'],
    homework: ['book-open', 'Work'],
    'my-homework': ['book-open', 'Work'],
    'staff-chat': ['message-circle', 'Chat'],
    chat: ['message-circle', 'Chat'],
    payments: ['credit-card', 'Fees'],
    'ai-tutor': ['bot', 'AI Tutor'],
    alerts: ['bell', 'Alerts'],
    help: ['help-circle', 'Help']
  };

  function renderMobileQuickNav() {
    const nav = document.getElementById('mobile-nav');
    if (!nav) return;
    const role = currentRole() || 'student';
    const sections = quickNavByRole[role] || quickNavByRole.student;
    nav.innerHTML = sections.map(section => {
      const [icon, label] = labels[section] || ['circle', section];
      return `<a href="#" class="mobile-nav-item flex flex-col items-center justify-center text-muted-foreground" data-section="${section}" onclick="showDashboardSection('${section}'); return false;" aria-label="Open ${label}">
        <i data-lucide="${icon}" class="h-5 w-5"></i>
        <span class="text-xs mt-1">${label}</span>
      </a>`;
    }).join('');
    markMobileActive();
    if (window.lucide?.createIcons) window.lucide.createIcons();
  }

  function markMobileActive() {
    const section = window.currentSection || 'dashboard';
    document.querySelectorAll('#mobile-nav .mobile-nav-item').forEach(item => {
      const active = item.dataset.section === section;
      item.classList.toggle('active', active);
      item.classList.toggle('text-primary', active);
    });
  }

  function patchNavigationClose() {
    if (window.__shuleMobileNavPatched) return;
    const original = window.showDashboardSection;
    if (typeof original !== 'function') return;
    window.showDashboardSection = async function (section) {
      const result = await original.apply(this, arguments);
      if (isMobile()) closeMobileSidebar();
      setTimeout(() => {
        renderMobileQuickNav();
        enhanceMobileTables(document.getElementById('dashboard-content') || document.body);
        enhanceMobileModals();
      }, 0);
      return result;
    };
    window.__shuleMobileNavPatched = true;
  }

  function enhanceMobileTables(root) {
    const scope = root || document;
    scope.querySelectorAll('table:not([data-shule-mobile-checked])').forEach(table => {
      table.setAttribute('data-shule-mobile-checked', '1');
      const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.textContent.trim()).filter(Boolean);
      if (!headers.length) return;
      table.classList.add('shule-mobile-card-table');
      table.querySelectorAll('tbody tr').forEach(row => {
        Array.from(row.children).forEach((cell, i) => {
          if (!cell.getAttribute('data-label')) cell.setAttribute('data-label', headers[i] || 'Details');
        });
      });
    });
  }

  function enhanceMobileModals() {
    document.querySelectorAll('[id$="modal"], [id$="-modal"], .modal, .shule-modal, .finance-modal, .help-modal, .alert-modal').forEach(modal => {
      modal.classList.add('shule-mobile-ready-modal');
    });
  }

  function installPromptMarkup() {
    if (document.getElementById('shule-pwa-install-card')) return;
    const card = document.createElement('div');
    card.id = 'shule-pwa-install-card';
    card.innerHTML = `
      <div class="flex items-start gap-3">
        <div class="h-11 w-11 rounded-2xl bg-primary/15 text-primary flex items-center justify-center shrink-0"><i data-lucide="smartphone" class="h-5 w-5"></i></div>
        <div class="flex-1 min-w-0">
          <strong class="block text-sm">Install Shule AI</strong>
          <p class="text-xs text-muted-foreground mt-1">Add Shule AI to this phone for faster access like an app.</p>
          <div class="mt-3 flex gap-2">
            <button type="button" id="shule-pwa-install-now" class="px-3 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold">Install</button>
            <button type="button" id="shule-pwa-install-later" class="px-3 py-2 rounded-xl border text-sm">Later</button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(card);
    document.getElementById('shule-pwa-install-now')?.addEventListener('click', async () => {
      card.classList.remove('show');
      if (deferredInstallPrompt) {
        deferredInstallPrompt.prompt();
        try { await deferredInstallPrompt.userChoice; } catch (_) {}
        deferredInstallPrompt = null;
      }
      localStorage.setItem('shule_pwa_install_seen', String(Date.now()));
    });
    document.getElementById('shule-pwa-install-later')?.addEventListener('click', () => {
      card.classList.remove('show');
      localStorage.setItem('shule_pwa_install_seen', String(Date.now()));
    });
    if (window.lucide?.createIcons) window.lucide.createIcons();
  }

  function maybeShowInstallPrompt() {
    const card = document.getElementById('shule-pwa-install-card');
    if (!card || !deferredInstallPrompt) return;
    const last = Number(localStorage.getItem('shule_pwa_install_seen') || 0);
    const days = (Date.now() - last) / 86400000;
    if (days > 7 || !last) card.classList.add('show');
  }

  function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js').catch(err => {
        console.warn('[Shule AI PWA] Service worker registration failed:', err?.message || err);
      });
    });
  }

  function observeDashboardContent() {
    const target = document.getElementById('dashboard-content') || document.body;
    const observer = new MutationObserver(mutations => {
      let shouldEnhance = false;
      for (const m of mutations) {
        if (m.addedNodes && m.addedNodes.length) { shouldEnhance = true; break; }
      }
      if (!shouldEnhance) return;
      window.requestAnimationFrame(() => {
        enhanceMobileTables(target);
        enhanceMobileModals();
        markMobileActive();
      });
    });
    observer.observe(target, { childList: true, subtree: true });
  }

  function enhanceTouchSafety() {
    document.addEventListener('click', (event) => {
      const link = event.target.closest('.sidebar-link, #mobile-nav .mobile-nav-item');
      if (link && isMobile()) setTimeout(closeMobileSidebar, 50);
    }, true);

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeMobileSidebar();
    });
  }

  function boot() {
    setMobileClass();
    patchSidebarToggle();
    patchNavigationClose();
    renderMobileQuickNav();
    enhanceMobileTables(document);
    enhanceMobileModals();
    installPromptMarkup();
    observeDashboardContent();
    enhanceTouchSafety();
    registerServiceWorker();
  }

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    installPromptMarkup();
    maybeShowInstallPrompt();
  });

  window.addEventListener('resize', () => {
    setMobileClass();
    markMobileActive();
  }, { passive: true });

  document.addEventListener('DOMContentLoaded', boot);
  window.addEventListener('load', () => {
    setMobileClass();
    renderMobileQuickNav();
    enhanceMobileTables(document);
    enhanceMobileModals();
  });

  window.ShuleMobilePWA = {
    renderMobileQuickNav,
    enhanceMobileTables,
    closeMobileSidebar,
    openMobileSidebar
  };
})();
