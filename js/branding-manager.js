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

  function hexToHslParts(hex) {
    const raw = String(hex || '').replace('#', '').trim();
    if (!/^[0-9a-f]{6}$/i.test(raw)) return null;
    let r = parseInt(raw.slice(0, 2), 16) / 255;
    let g = parseInt(raw.slice(2, 4), 16) / 255;
    let b = parseInt(raw.slice(4, 6), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  }

  function ensureLogoPair(container) {
    if (!container) return;
    const schoolLogo = getLogoSource();
    const lightLogo = schoolLogo || LOGO_LIGHT;
    const darkLogo = schoolLogo || LOGO_DARK;

    // Do NOT inject a new logo if the approved sidebar already has one.
    // Important: keep the school logo here; the previous version reset the
    // existing sidebar images back to Shule AI after applyLogos(), which is why
    // uploaded logos did not appear in the sidebar.
    const existingImgs = Array.from(container.querySelectorAll('img'));
    if (existingImgs.length) {
      existingImgs.forEach((img, index) => {
        const isDarkLogo = img.classList.contains('dark:block') || img.dataset.brandLogoDark !== undefined || index === 1 || /dark/i.test(img.src || '');
        img.src = isDarkLogo ? darkLogo : lightLogo;
        img.alt = `${getDisplayName()} Logo`;
        img.loading = 'eager';
        img.decoding = 'async';
        img.setAttribute('data-school-logo', 'true');
        if (isDarkLogo) img.setAttribute('data-brand-logo-dark', 'true');
        else img.setAttribute('data-brand-logo-light', 'true');
        img.onerror = function(){ this.onerror = null; this.src = isDarkLogo ? LOGO_DARK : LOGO_LIGHT; };
      });
      return;
    }

    const wrapper = document.createElement('span');
    wrapper.className = 'brand-logo-pair inline-flex items-center shrink-0';
    wrapper.innerHTML = `
      <img src="${lightLogo}" alt="${getDisplayName()} Logo" data-school-logo data-brand-logo-light class="h-10 w-10 object-contain block dark:hidden" onerror="this.onerror=null;this.src='${LOGO_LIGHT}'">
      <img src="${darkLogo}" alt="${getDisplayName()} Logo" data-school-logo data-brand-logo-dark class="h-10 w-10 object-contain hidden dark:block" onerror="this.onerror=null;this.src='${LOGO_DARK}'">
    `;
    container.prepend(wrapper);
  }

  function applyLogos() {
    const schoolLogo = getLogoSource();
    const lightLogo = schoolLogo || LOGO_LIGHT;
    const darkLogo = schoolLogo || LOGO_DARK;
    document.querySelectorAll('img[alt="Logo"], img[alt="Shule AI Logo"], img[data-brand-logo-light], img[data-brand-logo-dark], img[data-school-logo], .brand-logo-pair img').forEach((img) => {
      const isDarkLogo = img.classList.contains('dark:block') || img.dataset.brandLogoDark !== undefined || /dark/i.test(img.src || '');
      img.src = isDarkLogo ? darkLogo : lightLogo;
      img.alt = `${getDisplayName()} Logo`;
      img.loading = 'eager';
      img.decoding = 'async';
      img.setAttribute('data-school-logo', 'true');
      img.onerror = function(){ this.onerror = null; this.src = isDarkLogo ? LOGO_DARK : LOGO_LIGHT; };
    });

    const sidebarName = document.getElementById('sidebar-school-name');
    if (sidebarName?.parentElement) ensureLogoPair(sidebarName.parentElement);
  }

  function applyColors() {
    const colors = getColorPreset();
    const primaryHsl = hexToHslParts(colors.primaryColor);
    const accentHsl = hexToHslParts(colors.accentColor);
    document.documentElement.style.setProperty('--school-primary-color', colors.primaryColor);
    document.documentElement.style.setProperty('--school-accent-color', colors.accentColor);
    // Also update the app's actual CSS variables used by Tailwind classes like
    // bg-primary/text-primary/ring-primary. V98 only set custom school vars, so
    // many visible buttons/cards never changed color.
    if (primaryHsl) {
      document.documentElement.style.setProperty('--primary', primaryHsl);
      document.documentElement.style.setProperty('--ring', primaryHsl);
      document.documentElement.style.setProperty('--sidebar-primary', primaryHsl);
    }
    if (accentHsl) {
      document.documentElement.style.setProperty('--accent-brand', accentHsl);
      document.documentElement.style.setProperty('--sidebar-ring', accentHsl);
    }
    document.documentElement.setAttribute('data-school-color-name', colors.colorName);
    document.body?.setAttribute('data-school-color-name', colors.colorName);
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
