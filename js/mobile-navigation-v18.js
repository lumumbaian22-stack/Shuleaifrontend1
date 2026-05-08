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
