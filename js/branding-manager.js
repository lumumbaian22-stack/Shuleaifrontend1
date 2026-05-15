/*
 * Shule AI Branding Manager
 * Single source of truth for platform/school identity across all dashboards.
 * This is a production module, not a patch: all old school-name helpers delegate here.
 */
(function () {
  'use strict';

  const PLATFORM_NAME = 'Shule AI';
  const PLATFORM_SHORT_NAME = 'ShuleAI';
  const LOGO_LIGHT = 'assets/logo-light.png';
  const LOGO_DARK = 'assets/logo-dark.png';

  function safeParse(value, fallback = null) {
    try {
      return value ? JSON.parse(value) : fallback;
    } catch (_) {
      return fallback;
    }
  }

  function getStoredUser() {
    if (typeof window.getCurrentUser === 'function') {
      const user = window.getCurrentUser();
      if (user && Object.keys(user).length) return user;
    }
    return safeParse(localStorage.getItem('user'), null) || {};
  }

  function getStoredSchool() {
    if (typeof window.getCurrentSchool === 'function') {
      const school = window.getCurrentSchool();
      if (school && Object.keys(school).length) return school;
    }
    return safeParse(localStorage.getItem('school'), null) || null;
  }

  function getStoredSettings() {
    return (
      window.schoolSettings ||
      safeParse(localStorage.getItem('schoolSettings'), null) ||
      {}
    );
  }

  function cleanName(value) {
    return typeof value === 'string' ? value.trim() : '';
  }

  function getSchoolNameFromAnySource() {
    const school = getStoredSchool();
    const settings = getStoredSettings();
    const user = getStoredUser();

    return (
      cleanName(school?.name) ||
      cleanName(school?.schoolName) ||
      cleanName(school?.settings?.schoolName) ||
      cleanName(settings.schoolName) ||
      cleanName(settings.name) ||
      cleanName(user?.school?.name) ||
      cleanName(user?.schoolName) ||
      cleanName(user?.student?.school?.name) ||
      cleanName(user?.teacher?.school?.name) ||
      cleanName(user?.parent?.school?.name) ||
      ''
    );
  }

  function isSchoolBranded() {
    const school = getStoredSchool();
    const settings = getStoredSettings();
    const user = getStoredUser();
    const role = user?.role || localStorage.getItem('userRole');
    const hasSchoolName = !!getSchoolNameFromAnySource();

    if (role === 'superadmin') return false;
    if (school?.status === 'active' && hasSchoolName) return true;
    if (settings.schoolName || settings.name) return true;
    if (user?.schoolName || user?.school?.name) return true;
    if (user?.student?.school?.name || user?.teacher?.school?.name || user?.parent?.school?.name) return true;
    return false;
  }

  function getDisplayName() {
    return isSchoolBranded() ? getSchoolNameFromAnySource() : PLATFORM_SHORT_NAME;
  }

  function syncStoredSchoolName(newName) {
    const name = cleanName(newName);
    if (!name) return;

    const school = safeParse(localStorage.getItem('school'), null);
    if (school && typeof school === 'object') {
      school.name = name;
      school.schoolName = name;
      school.settings = { ...(school.settings || {}), schoolName: name };
      localStorage.setItem('school', JSON.stringify(school));
      window.currentSchool = school;
    }

    const settings = safeParse(localStorage.getItem('schoolSettings'), {}) || {};
    settings.schoolName = name;
    settings.name = settings.name || name;
    localStorage.setItem('schoolSettings', JSON.stringify(settings));
    window.schoolSettings = { ...(window.schoolSettings || {}), ...settings };
  }

  function setText(selector, value) {
    document.querySelectorAll(selector).forEach((el) => {
      el.textContent = value;
      el.setAttribute('title', value);
    });
  }

  function ensureLogoPair(container) {
    if (!container) return;
    const hasLight = container.querySelector('[data-brand-logo-light]');
    const hasDark = container.querySelector('[data-brand-logo-dark]');
    if (hasLight && hasDark) return;

    const wrapper = document.createElement('span');
    wrapper.className = 'brand-logo-pair inline-flex items-center shrink-0';
    wrapper.innerHTML = `
      <img src="${LOGO_LIGHT}" alt="${PLATFORM_NAME} Logo" data-brand-logo-light class="h-10 w-10 object-contain block dark:hidden" onerror="this.style.display='none'">
      <img src="${LOGO_DARK}" alt="${PLATFORM_NAME} Logo" data-brand-logo-dark class="h-10 w-10 object-contain hidden dark:block" onerror="this.style.display='none'">
    `;
    container.prepend(wrapper);
  }

  function applyLogos() {
    document.querySelectorAll('img[alt="Logo"], img[alt="Shule AI Logo"], img[data-brand-logo-light], img[data-brand-logo-dark]').forEach((img) => {
      const isDarkLogo = img.classList.contains('dark:block') || img.dataset.brandLogoDark !== undefined || /dark/i.test(img.src);
      img.src = isDarkLogo ? LOGO_DARK : LOGO_LIGHT;
      img.alt = `${PLATFORM_NAME} Logo`;
      img.loading = 'eager';
      img.decoding = 'async';
    });

    const sidebarName = document.getElementById('sidebar-school-name');
    if (sidebarName?.parentElement) ensureLogoPair(sidebarName.parentElement);
  }

  function applyThemeToggleVisibility() {
    const themeButtons = document.querySelectorAll('button[onclick="toggleTheme()"], #global-theme-toggle, .theme-toggle-btn');
    themeButtons.forEach((button) => {
      button.id = button.id || 'global-theme-toggle';
      button.classList.add('theme-toggle-btn');
      button.setAttribute('aria-label', 'Toggle dark/light mode');
      button.style.color = 'hsl(var(--foreground))';
      button.style.border = button.style.border || '1px solid hsl(var(--border))';
      button.style.backgroundColor = 'hsl(var(--background))';
    });
  }

  function apply(newName) {
    if (newName) syncStoredSchoolName(newName);
    const displayName = newName ? cleanName(newName) : getDisplayName();

    applyLogos();
    applyThemeToggleVisibility();

    setText('#sidebar-school-name', displayName);
    setText('#school-name', displayName);
    setText('#dashboard-school-name', displayName);
    setText('#teacher-school-name', displayName);
    setText('#parent-school-name', displayName);
    setText('#parent-school-name-progress', displayName);
    setText('#parent-school-name-payments', displayName);
    setText('#student-school-name', displayName);
    setText('.school-name, .school-name-display, [data-school-name], .profile-school-name', displayName);

    document.documentElement.setAttribute('data-brand-name', displayName);
    document.body?.setAttribute('data-brand-name', displayName);
    return displayName;
  }

  function updateAllSchoolNameElements(newName) {
    return apply(newName);
  }

  function updateSidebarSchoolName(newName) {
    return apply(newName);
  }

  function boot() {
    apply();
    setTimeout(apply, 0);
    setTimeout(apply, 250);
  }

  window.BrandingManager = {
    platformName: PLATFORM_NAME,
    platformShortName: PLATFORM_SHORT_NAME,
    getDisplayName,
    getSchoolName: getSchoolNameFromAnySource,
    isSchoolBranded,
    apply,
    syncStoredSchoolName,
    updateAllSchoolNameElements,
    updateSidebarSchoolName,
  };

  window.updateAllSchoolNameElements = updateAllSchoolNameElements;
  window.updateSidebarSchoolName = updateSidebarSchoolName;
  window.getCurrentBrandName = getDisplayName;

  window.addEventListener('DOMContentLoaded', boot);
  window.addEventListener('load', boot);
  window.addEventListener('school-name-changed', function (event) {
    const nextName = event?.detail?.newName || event?.detail?.schoolName || event?.detail?.name;
    apply(nextName);
  });
  window.addEventListener('storage', function (event) {
    if (['school', 'schoolSettings', 'user', 'pendingSchoolNameChange'].includes(event.key)) {
      if (event.key === 'pendingSchoolNameChange' && event.newValue) {
        const payload = safeParse(event.newValue, {});
        apply(payload.newName || payload.schoolName || payload.name);
      } else {
        apply();
      }
    }
  });
})();
