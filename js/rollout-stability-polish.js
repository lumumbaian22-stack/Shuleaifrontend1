/* v66 Section 2 — Rollout Stability Polish
   Guards only. No business logic rewrites. */
(function () {
  'use strict';

  const AUTH_PATH_PATTERNS = [
    '/api/student/dashboard',
    '/api/parent/dashboard',
    '/api/teacher/dashboard',
    '/api/admin/dashboard'
  ];

  function hasToken() {
    return !!(localStorage.getItem('token') || localStorage.getItem('authToken') || sessionStorage.getItem('token'));
  }

  function getRole() {
    try {
      const raw = localStorage.getItem('user') || localStorage.getItem('currentUser');
      if (!raw) return '';
      const user = JSON.parse(raw);
      return String(user.role || '').toLowerCase();
    } catch (_) {
      return '';
    }
  }

  function currentDashboardRole() {
    const bodyRole = document.body && document.body.dataset ? document.body.dataset.role : '';
    return String(bodyRole || getRole() || '').toLowerCase();
  }

  // Stop role-specific dashboard loaders from running on the public landing page after logout.
  window.v66CanRunRoleDashboard = function (role) {
    if (!hasToken()) return false;
    if (!role) return true;
    const activeRole = currentDashboardRole();
    return !activeRole || activeRole === String(role).toLowerCase();
  };

  // Safe wrapper helper used by late-running dashboard widgets.
  window.v66RunIfAuthenticated = function (role, fn) {
    if (typeof fn !== 'function') return null;
    if (!window.v66CanRunRoleDashboard(role)) return null;
    try {
      return fn();
    } catch (error) {
      console.warn('Stable dashboard guard caught:', error && error.message ? error.message : error);
      return null;
    }
  };

  // Prevent noisy unauthenticated background calls after logout or failed login.
  if (window.fetch && !window.__v66FetchGuardInstalled) {
    const originalFetch = window.fetch.bind(window);
    window.fetch = function (input, init) {
      const url = typeof input === 'string' ? input : (input && input.url) || '';
      const isProtectedDashboard = AUTH_PATH_PATTERNS.some((pattern) => url.includes(pattern));
      if (isProtectedDashboard && !hasToken()) {
        return Promise.resolve(new Response(JSON.stringify({ success: false, message: 'Not authenticated' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }));
      }
      return originalFetch(input, init);
    };
    window.__v66FetchGuardInstalled = true;
  }

  // Make dynamic tables responsive without changing their content.
  function wrapTables(root) {
    const scope = root || document;
    scope.querySelectorAll('table').forEach((table) => {
      if (table.closest('.table-responsive,.table-wrap,.overflow-x-auto')) return;
      const wrapper = document.createElement('div');
      wrapper.className = 'table-responsive';
      table.parentNode.insertBefore(wrapper, table);
      wrapper.appendChild(table);
    });
  }

  function stabilizeMedia(root) {
    const scope = root || document;
    scope.querySelectorAll('img').forEach((img) => {
      img.loading = img.loading || 'lazy';
      img.decoding = img.decoding || 'async';
      img.style.maxWidth = img.style.maxWidth || '100%';
    });
  }

  function syncThemeMeta() {
    const dark = document.documentElement.classList.contains('dark') || document.body.classList.contains('dark');
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'theme-color';
      document.head.appendChild(meta);
    }
    meta.content = dark ? '#0f172a' : '#3b82f6';
  }

  function applyStabilityPass(root) {
    wrapTables(root);
    stabilizeMedia(root);
    syncThemeMeta();
  }

  document.addEventListener('DOMContentLoaded', function () {
    applyStabilityPass(document);
    document.body.classList.add('v66-section2-stable');

    const target = document.getElementById('dashboard-content') || document.body;
    if (window.MutationObserver && target) {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node && node.nodeType === 1) applyStabilityPass(node);
          });
        });
      });
      observer.observe(target, { childList: true, subtree: true });
    }
  });

  // Reduce console noise from expected logged-out checks while preserving real errors.
  window.addEventListener('unhandledrejection', function (event) {
    const message = String((event.reason && (event.reason.message || event.reason.error)) || event.reason || '');
    if (/Not authorized|Not authenticated|Unauthorized/i.test(message) && !hasToken()) {
      event.preventDefault();
    }
  });
})();
