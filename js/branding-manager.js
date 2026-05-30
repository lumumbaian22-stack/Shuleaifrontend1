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
  const BRAND_COLOR_PRESETS = {
    'Shule Blue': { primaryColor: '#083A85', accentColor: '#11B5B1' },
    'Royal Blue': { primaryColor: '#0B2F6B', accentColor: '#3B82F6' },
    'Emerald Green': { primaryColor: '#047857', accentColor: '#10B981' },
    'Purple': { primaryColor: '#6D28D9', accentColor: '#A78BFA' },
    'Orange': { primaryColor: '#C2410C', accentColor: '#FB923C' },
    'Red': { primaryColor: '#B91C1C', accentColor: '#F87171' },
    'Gold': { primaryColor: '#92400E', accentColor: '#FBBF24' },
    'Slate': { primaryColor: '#334155', accentColor: '#64748B' }
  };

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

  function getStoredBranding() {
    const direct = window.schoolBranding || safeParse(localStorage.getItem('schoolBranding'), null) || {};
    const school = getStoredSchool();
    const settings = getStoredSettings();
    return { ...(school?.settings?.branding || {}), ...(settings?.branding || {}), ...direct };
  }

  function getLogoSource() {
    const branding = getStoredBranding();
    return branding.logoDataUrl || branding.logoUrl || branding.logo || '';
  }

  function getColorPreset() {
    const branding = getStoredBranding();
    const name = branding.colorName && BRAND_COLOR_PRESETS[branding.colorName] ? branding.colorName : 'Shule Blue';
    const preset = BRAND_COLOR_PRESETS[name];
    return { colorName: name, primaryColor: branding.primaryColor || preset.primaryColor, accentColor: branding.accentColor || preset.accentColor };
  }

  function cleanName(value) {
    return typeof value === 'string' ? value.trim() : '';
  }

  function getSchoolNameFromAnySource() {
    const school = getStoredSchool();
    const settings = getStoredSettings();
    const user = getStoredUser();
    const dashboardData = window.dashboardData || window.studentDashboardData || {};

    return (
      cleanName(getStoredBranding()?.schoolName) ||
      cleanName(getStoredBranding()?.displayName) ||
      cleanName(getStoredBranding()?.name) ||
      cleanName(dashboardData?.school?.name) ||
      cleanName(dashboardData?.schoolName) ||
      cleanName(dashboardData?.student?.school?.name) ||
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
    const dashboardData = window.dashboardData || window.studentDashboardData || {};
    if (dashboardData?.schoolName || dashboardData?.school?.name || dashboardData?.student?.school?.name) return true;
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

    // Do NOT inject a new logo if the approved sidebar already has one.
    // The previous v66 attempt prepended a second logo pair here, which caused double logos.
    const existingImgs = Array.from(container.querySelectorAll('img'));
    if (existingImgs.length) {
      existingImgs.forEach((img, index) => {
        const isDarkLogo = img.classList.contains('dark:block') || index === 1 || /dark/i.test(img.src || '');
        img.src = isDarkLogo ? LOGO_DARK : LOGO_LIGHT;
        img.alt = `${PLATFORM_NAME} Logo`;
        img.loading = 'eager';
        img.decoding = 'async';
        if (isDarkLogo) img.setAttribute('data-brand-logo-dark', 'true');
        else img.setAttribute('data-brand-logo-light', 'true');
      });
      return;
    }

    const wrapper = document.createElement('span');
    wrapper.className = 'brand-logo-pair inline-flex items-center shrink-0';
    wrapper.innerHTML = `
      <img src="${LOGO_LIGHT}" alt="${PLATFORM_NAME} Logo" data-brand-logo-light class="h-10 w-10 object-contain block dark:hidden" onerror="this.style.display='none'">
      <img src="${LOGO_DARK}" alt="${PLATFORM_NAME} Logo" data-brand-logo-dark class="h-10 w-10 object-contain hidden dark:block" onerror="this.style.display='none'">
    `;
    container.prepend(wrapper);
  }

  function applyLogos() {
    const schoolLogo = getLogoSource();
    const lightLogo = schoolLogo || LOGO_LIGHT;
    const darkLogo = schoolLogo || LOGO_DARK;
    document.querySelectorAll('img[alt="Logo"], img[alt="Shule AI Logo"], img[data-brand-logo-light], img[data-brand-logo-dark], img[data-school-logo]').forEach((img) => {
      const isDarkLogo = img.classList.contains('dark:block') || img.dataset.brandLogoDark !== undefined || /dark/i.test(img.src || '');
      img.src = isDarkLogo ? darkLogo : lightLogo;
      img.alt = `${getDisplayName()} Logo`;
      img.loading = 'eager';
      img.decoding = 'async';
      img.onerror = function(){ this.onerror = null; this.src = isDarkLogo ? LOGO_DARK : LOGO_LIGHT; };
    });

    const sidebarName = document.getElementById('sidebar-school-name');
    if (sidebarName?.parentElement) ensureLogoPair(sidebarName.parentElement);
  }

  function applyColors() {
    const colors = getColorPreset();
    document.documentElement.style.setProperty('--school-primary-color', colors.primaryColor);
    document.documentElement.style.setProperty('--school-accent-color', colors.accentColor);
    document.documentElement.setAttribute('data-school-color-name', colors.colorName);
  }

  function applyReportBrandingHelpers() {
    const branding = getStoredBranding();
    document.documentElement.setAttribute('data-report-footer', branding.reportFooter || '');
    document.documentElement.setAttribute('data-payment-instructions', branding.paymentInstructions || '');
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
    applyColors();
    applyReportBrandingHelpers();
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

  let applyTimer = null;

  function scheduleApply(newName) {
    if (applyTimer) clearTimeout(applyTimer);
    applyTimer = setTimeout(function () {
      applyTimer = null;
      apply(newName);
    }, 30);
  }

  function observeDashboardContent() {
    const targets = [document.getElementById('dashboard-content'), document.getElementById('dashboard-container')].filter(Boolean);
    targets.forEach((target) => {
      if (target.dataset.brandingObserved === 'true') return;
      target.dataset.brandingObserved = 'true';
      new MutationObserver(function () {
        scheduleApply();
      }).observe(target, { childList: true, subtree: true });
    });
  }

  function boot() {
    if (typeof window.apiRequest === 'function' && (localStorage.getItem('token') || localStorage.getItem('authToken'))) { loadSchoolBranding().finally(function(){ apply(); }); }
    apply();
    observeDashboardContent();
    setTimeout(apply, 0);
    setTimeout(apply, 250);
    setTimeout(apply, 1000);
  }

  async function loadSchoolBranding() {
    if (typeof window.apiRequest !== 'function') return getStoredBranding();
    try {
      const res = await window.apiRequest('/api/owner/branding');
      const branding = res?.data || {};
      window.schoolBranding = branding;
      localStorage.setItem('schoolBranding', JSON.stringify(branding));
      apply(branding.schoolName || branding.displayName || branding.name);
      return branding;
    } catch (_) { return getStoredBranding(); }
  }

  window.BrandingManager = {
    platformName: PLATFORM_NAME,
    platformShortName: PLATFORM_SHORT_NAME,
    getDisplayName,
    getStoredBranding,
    loadSchoolBranding,
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
  window.addEventListener('school-branding-updated', function (event) {
    const branding = event?.detail || {};
    window.schoolBranding = { ...(window.schoolBranding || {}), ...branding };
    try { localStorage.setItem('schoolBranding', JSON.stringify(window.schoolBranding)); } catch (_) {}
    apply(branding.schoolName || branding.displayName || branding.name);
  });
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
