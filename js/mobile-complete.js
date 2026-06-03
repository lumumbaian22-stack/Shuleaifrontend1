// Shule AI V86 - Complete mobile/PWA/performance enhancement layer
// Additive only: no backend calls are changed, no business logic is replaced.
(function () {
  'use strict';

  const MOBILE_MAX = 1023;
  const CARD_TABLE_ROW_STEP = 12;
  let deferredPrompt = null;
  let observer = null;
  let enhanceTimer = null;

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function isMobile() {
    return window.matchMedia ? window.matchMedia(`(max-width: ${MOBILE_MAX}px)`).matches : window.innerWidth <= MOBILE_MAX;
  }

  function getJson(keys) {
    for (const key of keys) {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const data = JSON.parse(raw);
        if (data) return data;
      } catch (_) {}
    }
    return null;
  }

  function user() {
    return (typeof window.getCurrentUser === 'function' && window.getCurrentUser()) || getJson(['shule_user', 'currentUser', 'user']) || window.currentUser || {};
  }

  function role() {
    const u = user();
    return String(u.role || u.userRole || localStorage.getItem('role') || window.currentRole || '').replace('-', '_').toLowerCase();
  }

  function setShellClasses() {
    document.body.classList.toggle('shule-mobile', isMobile());
    document.body.classList.toggle('shule-desktop', !isMobile());
    const standalone = window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone;
    document.body.classList.toggle('shule-pwa-standalone', !!standalone);
  }

  function closeSidebar() {
    document.body.classList.remove('mobile-sidebar-open');
    $('#sidebar')?.classList.remove('mobile-open');
    $('#mobile-overlay')?.classList.remove('mobile-open');
  }

  function openSidebar() {
    document.body.classList.add('mobile-sidebar-open');
    $('#sidebar')?.classList.add('mobile-open');
    $('#mobile-overlay')?.classList.add('mobile-open');
  }

  function patchSidebarToggle() {
    if (window.__v86SidebarPatch) return;
    const previous = window.toggleMobileSidebar;
    window.toggleMobileSidebar = function () {
      if (!isMobile()) return typeof previous === 'function' ? previous.apply(this, arguments) : undefined;
      return document.body.classList.contains('mobile-sidebar-open') ? closeSidebar() : openSidebar();
    };
    window.__v86SidebarPatch = true;
  }

  const navByRole = {
    admin: ['dashboard', 'finance-fees', 'announcements', 'alerts', 'help'],
    superadmin: ['dashboard', 'schools', 'platform-payments', 'alerts', 'help'],
    super_admin: ['dashboard', 'schools', 'platform-payments', 'alerts', 'help'],
    teacher: ['dashboard', 'attendance', 'homework', 'grades', 'alerts'],
    parent: ['dashboard', 'payments', 'subscriptions', 'alerts', 'help'],
    student: ['dashboard', 'my-homework', 'ai-tutor', 'progress', 'alerts']
  };

  const navLabels = {
    dashboard: ['layout-dashboard', 'Home'],
    'finance-fees': ['wallet', 'Fees'],
    announcements: ['megaphone', 'Announce'],
    alerts: ['bell', 'Alerts'],
    help: ['help-circle', 'Help'],
    schools: ['building-2', 'Schools'],
    'platform-payments': ['credit-card', 'Payments'],
    attendance: ['calendar-check', 'Attend'],
    homework: ['book-open', 'Work'],
    grades: ['clipboard-check', 'Marks'],
    payments: ['credit-card', 'Fees'],
    subscriptions: ['sparkles', 'Plans'],
    'my-homework': ['book-open', 'Work'],
    'ai-tutor': ['bot', 'AI Tutor'],
    progress: ['trending-up', 'Progress']
  };

  function navigate(section) {
    if (!section) return;
    if (typeof window.showDashboardSection === 'function') {
      window.showDashboardSection(section);
      return;
    }
    if (typeof window.renderDashboardSection === 'function') {
      window.renderDashboardSection(section);
      return;
    }
    window.location.hash = `#${section}`;
  }

  function renderBottomNav() {
    const nav = $('#mobile-nav');
    if (!nav) return;
    const sections = navByRole[role()] || navByRole.student;
    nav.innerHTML = sections.map(section => {
      const [icon, label] = navLabels[section] || ['circle', section];
      return `<a href="#${section}" class="mobile-nav-item flex flex-col items-center justify-center" data-section="${section}" aria-label="Open ${label}">
        <i data-lucide="${icon}" class="h-5 w-5"></i><span>${label}</span>
      </a>`;
    }).join('');
    $$('#mobile-nav .mobile-nav-item').forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        navigate(link.dataset.section);
        closeSidebar();
      });
    });
    markActiveNav();
    window.lucide?.createIcons?.();
  }

  function markActiveNav() {
    const section = String(window.currentSection || location.hash.replace('#', '') || 'dashboard');
    $$('#mobile-nav .mobile-nav-item').forEach(item => item.classList.toggle('active', item.dataset.section === section));
  }

  function patchNavigation() {
    if (window.__v86NavigationPatch || typeof window.showDashboardSection !== 'function') return;
    const original = window.showDashboardSection;
    window.showDashboardSection = async function (section) {
      const result = await original.apply(this, arguments);
      window.currentSection = section || window.currentSection;
      if (isMobile()) closeSidebar();
      scheduleEnhance();
      return result;
    };
    window.__v86NavigationPatch = true;
  }

  function patchBellToAlerts() {
    if (window.__v86BellPatch) return;
    window.openAlertsFromBell = function () { navigate('alerts'); };
    document.addEventListener('click', event => {
      const bell = event.target.closest('#notification-btn, .notification-bell, .alerts-bell, [data-action="alerts"], [aria-label*="alert" i], [aria-label*="notification" i]');
      if (!bell) return;
      event.preventDefault();
      event.stopPropagation();
      navigate('alerts');
    }, true);
    window.__v86BellPatch = true;
  }

  function tableKey(table) {
    if (!table.dataset.v86TableId) table.dataset.v86TableId = `v86-table-${Math.random().toString(36).slice(2)}`;
    return table.dataset.v86TableId;
  }

  function enhanceTables(root = document) {
    $$('table', root).forEach(table => {
      const headers = $$('thead th', table).map(th => th.textContent.trim()).filter(Boolean);
      if (!headers.length) return;
      table.classList.add('shule-mobile-card-table');
      $$('tbody tr', table).forEach(row => {
        Array.from(row.children).forEach((cell, i) => {
          if (!cell.getAttribute('data-label')) cell.setAttribute('data-label', headers[i] || 'Details');
        });
      });
      paginateTable(table);
    });
  }

  function paginateTable(table) {
    const rows = $$('tbody tr', table);
    if (!isMobile() || rows.length <= CARD_TABLE_ROW_STEP) {
      rows.forEach(r => r.classList.remove('v86-row-hidden'));
      table.nextElementSibling?.matches?.('.v86-load-more') && table.nextElementSibling.remove();
      return;
    }
    const key = tableKey(table);
    const shown = Number(table.dataset.v86Shown || CARD_TABLE_ROW_STEP);
    rows.forEach((row, index) => row.classList.toggle('v86-row-hidden', index >= shown));
    let btn = table.nextElementSibling?.matches?.('.v86-load-more') ? table.nextElementSibling : null;
    if (shown >= rows.length) { if (btn) btn.remove(); return; }
    if (!btn) {
      btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'v86-load-more';
      table.insertAdjacentElement('afterend', btn);
    }
    btn.textContent = `Show more (${Math.max(0, rows.length - shown)} remaining)`;
    btn.onclick = () => {
      table.dataset.v86Shown = String(Math.min(rows.length, shown + CARD_TABLE_ROW_STEP));
      paginateTable(table);
    };
  }

  function enhanceForms(root = document) {
    $$('form, .form-grid, .modal-form, .finance-form, .payment-form, .announcement-form, .profile-form, .attendance-form, .marks-form, .homework-form', root).forEach(form => form.classList.add('v86-mobile-form'));
    $$('.form-actions, .modal-actions, .finance-actions, .payment-actions, .announcement-actions', root).forEach(actions => actions.classList.add('v86-sticky-actions'));
  }

  function enhanceModals(root = document) {
    $$('[id$="modal"], [id$="-modal"], .modal, .shule-modal, .finance-modal, .help-modal, .alert-modal', root).forEach(modal => {
      modal.classList.add('shule-mobile-ready-modal');
      const panel = modal.querySelector(':scope > div:not(:first-child), .rounded-xl, .rounded-2xl, .modal-panel') || modal.firstElementChild;
      if (panel && !panel.querySelector(':scope > .v86-modal-handle')) {
        const handle = document.createElement('div');
        handle.className = 'v86-modal-handle';
        panel.prepend(handle);
      }
    });
  }

  function enhanceTeacherPhoneWorkflows(root = document) {
    const teacherHints = ['attendance', 'homework', 'marks', 'grades', 'submissions'];
    teacherHints.forEach(key => {
      $$(`[id*="${key}" i], [class*="${key}" i]`, root).forEach(el => {
        if (el.matches('section, div, form, table')) el.classList.add(`v86-teacher-${key}-mobile`);
      });
    });
  }

  function enhanceLazyAssets(root = document) {
    $$('img:not([loading])', root).forEach(img => { img.loading = 'lazy'; img.decoding = 'async'; });
    $$('iframe:not([loading])', root).forEach(frame => { frame.loading = 'lazy'; });
  }

  function enhance() {
    setShellClasses();
    renderBottomNav();
    markActiveNav();
    const root = $('#dashboard-content') || document;
    enhanceTables(root);
    enhanceForms(root);
    enhanceModals(root);
    enhanceTeacherPhoneWorkflows(root);
    enhanceLazyAssets(document);
  }

  function scheduleEnhance() {
    clearTimeout(enhanceTimer);
    enhanceTimer = setTimeout(() => {
      const runner = () => enhance();
      if ('requestIdleCallback' in window) window.requestIdleCallback(runner, { timeout: 500 });
      else requestAnimationFrame(runner);
    }, 60);
  }

  function observe() {
    if (observer) observer.disconnect();
    const target = $('#dashboard-content') || document.body;
    observer = new MutationObserver(scheduleEnhance);
    observer.observe(target, { childList: true, subtree: true });
  }

  function registerPwa() {
    if (!('serviceWorker' in navigator)) return;
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js').catch(err => console.warn('[Shule AI PWA] registration failed:', err?.message || err));
    });
  }

  function installPrompt() {
    if ($('#shule-pwa-install-card')) return;
    const card = document.createElement('div');
    card.id = 'shule-pwa-install-card';
    card.innerHTML = `<div class="flex items-start gap-3"><div class="h-11 w-11 rounded-2xl bg-primary/15 text-primary flex items-center justify-center shrink-0"><i data-lucide="smartphone" class="h-5 w-5"></i></div><div class="flex-1 min-w-0"><strong class="block text-sm">Install Shule AI</strong><p class="text-xs text-muted-foreground mt-1">Add Shule AI to this phone for faster access like an app.</p><div class="mt-3 flex gap-2"><button type="button" id="shule-pwa-install-now" class="px-3 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold">Install</button><button type="button" id="shule-pwa-install-later" class="px-3 py-2 rounded-xl border text-sm">Later</button></div></div></div>`;
    document.body.appendChild(card);
    $('#shule-pwa-install-now')?.addEventListener('click', async () => {
      card.classList.remove('show');
      if (deferredPrompt) {
        deferredPrompt.prompt();
        try { await deferredPrompt.userChoice; } catch (_) {}
        deferredPrompt = null;
      }
      localStorage.setItem('shule_pwa_install_seen', String(Date.now()));
    });
    $('#shule-pwa-install-later')?.addEventListener('click', () => {
      card.classList.remove('show');
      localStorage.setItem('shule_pwa_install_seen', String(Date.now()));
    });
    window.lucide?.createIcons?.();
  }

  function maybeShowInstall() {
    const card = $('#shule-pwa-install-card');
    if (!card || !deferredPrompt) return;
    const last = Number(localStorage.getItem('shule_pwa_install_seen') || 0);
    if (!last || (Date.now() - last) > 7 * 86400000) card.classList.add('show');
  }

  function boot() {
    setShellClasses();
    patchSidebarToggle();
    patchNavigation();
    patchBellToAlerts();
    installPrompt();
    observe();
    enhance();
    registerPwa();
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSidebar(); });
    document.addEventListener('click', e => { if (e.target.closest('#mobile-overlay')) closeSidebar(); }, true);
  }

  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferredPrompt = e;
    installPrompt();
    maybeShowInstall();
  });
  window.addEventListener('resize', scheduleEnhance, { passive: true });
  document.addEventListener('DOMContentLoaded', boot);
  window.ShuleMobileV86 = { enhance, navigate, closeSidebar, openSidebar };
})();
