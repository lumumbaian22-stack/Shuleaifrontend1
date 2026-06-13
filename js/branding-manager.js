/*
 * Shule AI Branding Manager V101
 * Stable branding runtime: no flicker, no logo fighting, dark-mode safe logo, visible school colors.
 * One source of truth: window.schoolBranding/localStorage + backend /api/owner/branding.
 */
(function () {
  'use strict';

  const PLATFORM_SHORT_NAME = 'Shule AI';
  const PLATFORM_LOGO_LIGHT = 'assets/logo-light.png?v=1494';
  const PLATFORM_LOGO_DARK = 'assets/logo-light.png?v=1494'; // keep visible in dark mode; old dark asset can disappear on some dashboards
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

  let applying = false;
  let applyTimer = null;
  let lastAppliedHash = '';
  let loadedOnce = false;

  function safeParse(value, fallback = null) {
    try { return value ? JSON.parse(value) : fallback; } catch (_) { return fallback; }
  }

  function clean(value) { return typeof value === 'string' ? value.trim() : ''; }

  function getStoredUser() {
    if (typeof window.getCurrentUser === 'function') {
      const u = window.getCurrentUser();
      if (u && Object.keys(u).length) return u;
    }
    return safeParse(localStorage.getItem('user'), {}) || {};
  }

  function getStoredSchool() {
    if (typeof window.getCurrentSchool === 'function') {
      const s = window.getCurrentSchool();
      if (s && Object.keys(s).length) return s;
    }
    return safeParse(localStorage.getItem('school'), null) || window.currentSchool || null;
  }

  function getStoredSettings() {
    return window.schoolSettings || safeParse((localStorage.getItem(window.schoolScopedKey ? window.schoolScopedKey('schoolSettings') : 'schoolSettings') || localStorage.getItem('schoolSettings')), {}) || {};
  }

  function getStoredBranding() {
    const school = getStoredSchool();
    const settings = getStoredSettings();
    const currentSchoolId = clean(school?.schoolId || school?.schoolCode || getStoredUser()?.schoolCode);
    const cached = safeParse(localStorage.getItem('schoolBranding'), {}) || {};
    const cachedSchoolId = clean(cached.schoolId || cached.schoolCode);
    const sameSchoolCache = !cachedSchoolId || !currentSchoolId || cachedSchoolId === currentSchoolId ? cached : {};
    const memory = window.schoolBranding || {};
    const memorySchoolId = clean(memory.schoolId || memory.schoolCode);
    const sameSchoolMemory = !memorySchoolId || !currentSchoolId || memorySchoolId === currentSchoolId ? memory : {};
    const direct = Object.keys(sameSchoolMemory).length ? sameSchoolMemory : sameSchoolCache;
    return { ...(school?.settings?.branding || {}), ...(settings?.branding || {}), ...direct };
  }

  function isSuperAdmin() {
    const u = getStoredUser();
    const role = String(u?.role || localStorage.getItem('userRole') || '').toLowerCase();
    return role === 'superadmin' || role === 'super_admin';
  }

  function getSchoolNameFromAnySource() {
    const b = getStoredBranding();
    const s = getStoredSchool();
    const st = getStoredSettings();
    const u = getStoredUser();
    const d = window.dashboardData || window.studentDashboardData || {};
    return clean(b.schoolName) || clean(b.displayName) || clean(b.name) ||
      clean(d?.school?.name) || clean(d?.schoolName) || clean(d?.student?.school?.name) ||
      clean(s?.name) || clean(s?.schoolName) || clean(s?.settings?.schoolName) ||
      clean(st.schoolName) || clean(st.name) || clean(u?.school?.name) || clean(u?.schoolName) ||
      clean(u?.student?.school?.name) || clean(u?.teacher?.school?.name) || clean(u?.parent?.school?.name) || '';
  }

  function brandingAllowed() {
    if (isSuperAdmin()) return false;
    const dataSchool = (window.dashboardData && window.dashboardData.school) || (window.studentDashboardData && window.studentDashboardData.school) || {};
    const school = { ...(getStoredSchool() || {}), ...(dataSchool || {}) };
    const access = school.access || {};
    return !(school.suspended || access.suspended || String(school.accessMode || '').toLowerCase() === 'suspended');
  }

  function isSchoolBranded() { return brandingAllowed() && !!getSchoolNameFromAnySource(); }
  function getDisplayName() { return isSuperAdmin() ? PLATFORM_SHORT_NAME : (getSchoolNameFromAnySource() || PLATFORM_SHORT_NAME); }

  function getLogoSource() {
    if (!brandingAllowed()) return '';
    const b = getStoredBranding();
    const raw = clean(b.logoDataUrl) || clean(b.logoUrl) || clean(b.logo) || '';
    if (raw && typeof window.resolveMediaUrl === 'function') return window.resolveMediaUrl(raw);
    if (raw && /^data:image\//i.test(raw)) return raw;
    if (raw && /\/data:image\//i.test(raw)) return raw.slice(raw.indexOf('data:image/'));
    return raw;
  }

  function currentMode() { return document.documentElement.classList.contains('dark') ? 'dark' : 'light'; }

  function getLogoForMode(mode) {
    const schoolLogo = getLogoSource();
    if (schoolLogo && !isSuperAdmin()) return schoolLogo;
    // Use light logo if dark logo is not visually suitable. Keep dark asset only if no school logo.
    return mode === 'dark' ? PLATFORM_LOGO_DARK : PLATFORM_LOGO_LIGHT;
  }

  function normalizeColorPreset() {
    const b = brandingAllowed() ? getStoredBranding() : {}; 
    const name = b.colorName && BRAND_COLOR_PRESETS[b.colorName] ? b.colorName : 'Shule Blue';
    const preset = BRAND_COLOR_PRESETS[name];
    return {
      colorName: name,
      primaryColor: /^#[0-9a-f]{6}$/i.test(String(b.primaryColor || '')) ? b.primaryColor : preset.primaryColor,
      accentColor: /^#[0-9a-f]{6}$/i.test(String(b.accentColor || '')) ? b.accentColor : preset.accentColor
    };
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

  function syncStoredSchoolName(newName) {
    const name = clean(newName);
    if (!name) return;
    const school = safeParse(localStorage.getItem('school'), null);
    if (school && typeof school === 'object') {
      school.name = name;
      school.schoolName = name;
      school.settings = { ...(school.settings || {}), schoolName: name };
      if(typeof safeSessionSet==='function')safeSessionSet('school',JSON.stringify(typeof minimalSchoolForStorage==='function'?minimalSchoolForStorage(school,typeof getCurrentUser==='function'?getCurrentUser():null):school));
      window.currentSchool = school;
    }
    const settings = safeParse((localStorage.getItem(window.schoolScopedKey ? window.schoolScopedKey('schoolSettings') : 'schoolSettings') || localStorage.getItem('schoolSettings')), {}) || {};
    settings.schoolName = name;
    settings.name = settings.name || name;
    try{localStorage.removeItem(window.schoolScopedKey?window.schoolScopedKey('schoolSettings'):'schoolSettings')}catch(_){}
    window.schoolSettings = { ...(window.schoolSettings || {}), ...settings };
  }

  function setText(selector, value) {
    document.querySelectorAll(selector).forEach((el) => {
      if (el.textContent !== value) el.textContent = value;
      if (el.getAttribute('title') !== value) el.setAttribute('title', value);
    });
  }

  function ensureSidebarLogoElements() {
    const sidebarName = document.getElementById('sidebar-school-name');
    const container = sidebarName?.parentElement;
    if (!container) return [];
    let light = document.getElementById('sidebar-logo-light') || container.querySelector('[data-brand-logo-light]');
    let dark = document.getElementById('sidebar-logo-dark') || container.querySelector('[data-brand-logo-dark]');
    if (!light) {
      light = document.createElement('img');
      light.id = 'sidebar-logo-light';
      light.className = 'h-10 w-10 object-contain school-sidebar-logo'; light.style.maxWidth = '40px'; light.style.maxHeight = '40px'; light.style.backgroundColor = 'transparent';
      light.setAttribute('data-school-logo', 'true');
      light.setAttribute('data-brand-logo-light', 'true');
      container.insertBefore(light, container.firstChild);
    }
    if (!dark) {
      dark = document.createElement('img');
      dark.id = 'sidebar-logo-dark';
      dark.className = 'h-10 w-10 object-contain school-sidebar-logo'; dark.style.maxWidth = '40px'; dark.style.maxHeight = '40px'; dark.style.backgroundColor = 'transparent';
      dark.setAttribute('data-school-logo', 'true');
      dark.setAttribute('data-brand-logo-dark', 'true');
      container.insertBefore(dark, light.nextSibling);
    }
    return [light, dark];
  }

  function setImageStable(img, src, fallback, alt) {
    if (!img || !src) return;
    if (img.dataset.appliedBrandSrc === src && img.getAttribute('src') === src) return;
    img.dataset.appliedBrandSrc = src;
    img.setAttribute('alt', alt);
    img.loading = 'eager';
    img.decoding = 'async';
    img.onerror = function () {
      this.onerror = null;
      if (this.getAttribute('src') !== fallback) {
        this.dataset.appliedBrandSrc = fallback;
        this.setAttribute('src', fallback);
      }
    };
    img.setAttribute('src', src);
  }

  function applyLogos() {
    const [light, dark] = ensureSidebarLogoElements();
    const modeIsDark = currentMode() === 'dark';
    if (light) {
      light.classList.remove('hidden','block','dark:hidden','dark:block');
      light.style.setProperty('display', modeIsDark ? 'none' : 'block', 'important');
      light.style.setProperty('visibility', modeIsDark ? 'hidden' : 'visible', 'important');
      light.style.setProperty('opacity', modeIsDark ? '0' : '1', 'important');
      light.style.setProperty('width', '40px', 'important');
      light.style.setProperty('height', '40px', 'important');
    }
    if (dark) {
      dark.classList.remove('hidden','block','dark:hidden','dark:block');
      dark.style.setProperty('display', modeIsDark ? 'block' : 'none', 'important');
      dark.style.setProperty('visibility', modeIsDark ? 'visible' : 'hidden', 'important');
      dark.style.setProperty('opacity', modeIsDark ? '1' : '0', 'important');
      dark.style.setProperty('width', '40px', 'important');
      dark.style.setProperty('height', '40px', 'important');
    }
    const name = `${getDisplayName()} Logo`;
    const schoolLogo = getLogoSource();
    const lightSrc = schoolLogo && !isSuperAdmin() ? schoolLogo : PLATFORM_LOGO_LIGHT;
    const darkSrc = schoolLogo && !isSuperAdmin() ? schoolLogo : PLATFORM_LOGO_DARK;

    setImageStable(light, lightSrc, PLATFORM_LOGO_LIGHT, name);
    setImageStable(dark, darkSrc || PLATFORM_LOGO_LIGHT, PLATFORM_LOGO_LIGHT, name); // dark fallback uses visible light asset to avoid disappearing

    document.querySelectorAll('[data-report-school-logo], [data-school-logo-watermark]').forEach((img) => {
      const src = schoolLogo && !isSuperAdmin() ? schoolLogo : PLATFORM_LOGO_LIGHT;
      setImageStable(img, src, PLATFORM_LOGO_LIGHT, name);
      img.setAttribute('data-school-logo', 'true');
    });

    document.querySelectorAll('[data-branding-logo-preview]').forEach((box) => {
      if (box.dataset.localPreview === 'true') return;
      const logo = getLogoSource();
      const existing = box.querySelector('img');
      if (logo) {
        if (!existing || existing.getAttribute('src') !== logo) {
          box.innerHTML = `<img src="${String(logo).replace(/"/g, '&quot;')}" class="h-full w-full object-contain" alt="School logo preview" onerror="this.replaceWith(document.createTextNode('Logo unavailable'))">`;
        }
      } else if (!box.textContent.includes('Shule AI default logo')) {
        box.innerHTML = `<span class="text-xs text-muted-foreground text-center px-2">Shule AI default logo</span>`;
      }
    });
  }

  function applyColors() {
    const colors = normalizeColorPreset();
    const primaryHsl = hexToHslParts(colors.primaryColor);
    const accentHsl = hexToHslParts(colors.accentColor);
    const root = document.documentElement;
    root.style.setProperty('--school-primary-color', colors.primaryColor);
    root.style.setProperty('--school-accent-color', colors.accentColor);
    root.style.setProperty('--school-primary-hsl', primaryHsl || '217 91% 60%');
    root.style.setProperty('--school-accent-hsl', accentHsl || '174 82% 39%');
    if (primaryHsl) {
      root.style.setProperty('--primary', primaryHsl);
      root.style.setProperty('--ring', primaryHsl);
      root.style.setProperty('--sidebar-primary', primaryHsl);
    }
    if (accentHsl) {
      root.style.setProperty('--sidebar-ring', accentHsl);
      root.style.setProperty('--brand-accent-hsl', accentHsl);
    }
    document.body?.setAttribute('data-school-color-name', colors.colorName);
    document.body?.style.setProperty('--school-primary-color', colors.primaryColor);
    document.body?.style.setProperty('--school-accent-color', colors.accentColor);
    root.setAttribute('data-school-color-name', colors.colorName);
  }

  function applyReportBrandingHelpers() {
    const branding = getStoredBranding();
    document.documentElement.setAttribute('data-report-footer', branding.reportFooter || '');
    document.documentElement.setAttribute('data-payment-instructions', branding.paymentInstructions || '');
  }

  function buildHash(displayName) {
    const b = getStoredBranding();
    const colors = normalizeColorPreset();
    return JSON.stringify({
      name: displayName || getDisplayName(),
      logo: getLogoSource(),
      colorName: colors.colorName,
      primaryColor: colors.primaryColor,
      accentColor: colors.accentColor,
      dark: currentMode(),
      footer: b.reportFooter || '',
      pay: b.paymentInstructions || ''
    });
  }

  function apply(newName, opts = {}) {
    if (applying) return getDisplayName();
    if (newName && brandingAllowed()) syncStoredSchoolName(newName);
    const displayName = brandingAllowed() && newName ? clean(newName) : getDisplayName();
    const hash = buildHash(displayName);
    if (!opts.force && hash === lastAppliedHash) return displayName;
    applying = true;
    try {
      applyColors();
      applyLogos();
      applyReportBrandingHelpers();
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
      lastAppliedHash = hash;
      return displayName;
    } finally {
      applying = false;
    }
  }

  function scheduleApply(newName, delay = 80) {
    if (applyTimer) clearTimeout(applyTimer);
    applyTimer = setTimeout(() => { applyTimer = null; apply(newName); }, delay);
  }

  async function loadSchoolBranding(force = false) {
    if (!force && loadedOnce) return getStoredBranding();
    if (typeof window.apiRequest !== 'function') { apply(null, { force: true }); return getStoredBranding(); }
    if (!(localStorage.getItem('token') || localStorage.getItem('authToken'))) { apply(null, { force: true }); return getStoredBranding(); }
    if (isSuperAdmin()) {
      loadedOnce = true;
      window.schoolBranding = {};
      try { localStorage.removeItem('schoolBranding'); } catch (_) {}
      apply(PLATFORM_SHORT_NAME, { force: true });
      return {};
    }
    try {
      const res = await window.apiRequest('/api/owner/branding');
      const branding = res?.data || {};
      loadedOnce = true;
      window.schoolBranding = branding;
      if(typeof safeSessionSet==='function')safeSessionSet('schoolBranding',JSON.stringify(typeof minimalBrandingForStorage==='function'?minimalBrandingForStorage(branding):branding));
      try{if(window.schoolScopedKey)localStorage.removeItem(window.schoolScopedKey('schoolBranding'))}catch(_){}
      apply(branding.schoolName || branding.displayName || branding.name || getSchoolNameFromAnySource(), { force: true });
      return branding;
    } catch (_) {
      loadedOnce = true;
      apply(null, { force: true });
      return getStoredBranding();
    }
  }

  function boot() {
    if (boot.__ran) { scheduleApply(); return; }
    boot.__ran = true;
    loadSchoolBranding(false).finally(() => apply(null, { force: true }));
  }

  window.BrandingManager = {
    platformShortName: PLATFORM_SHORT_NAME,
    colorPresets: BRAND_COLOR_PRESETS,
    getDisplayName,
    getStoredBranding,
    getLogoSource,
    getSchoolName: getSchoolNameFromAnySource,
    isSchoolBranded,
    brandingAllowed,
    loadSchoolBranding,
    apply,
    forceApply: (name) => apply(name, { force: true }),
    updateAllSchoolNameElements: (name) => apply(name, { force: true }),
    updateSidebarSchoolName: (name) => apply(name, { force: true }),
    syncStoredSchoolName,
    debug: () => ({ branding: getStoredBranding(), logo: getLogoSource(), colors: normalizeColorPreset(), name: getDisplayName(), hash: lastAppliedHash })
  };

  window.updateAllSchoolNameElements = window.BrandingManager.updateAllSchoolNameElements;
  window.updateSidebarSchoolName = window.BrandingManager.updateSidebarSchoolName;
  window.getCurrentBrandName = getDisplayName;

  window.addEventListener('DOMContentLoaded', boot);
  window.addEventListener('load', () => scheduleApply(null, 150));
  window.addEventListener('school-branding-updated', (event) => {
    const branding = event?.detail || {};
    window.schoolBranding = { ...(window.schoolBranding || {}), ...branding };
    try{if(typeof safeSessionSet==='function')safeSessionSet('schoolBranding',JSON.stringify(typeof minimalBrandingForStorage==='function'?minimalBrandingForStorage(window.schoolBranding):window.schoolBranding))}catch(_){}
    apply(branding.schoolName || branding.displayName || branding.name || getSchoolNameFromAnySource(), { force: true });
  });
  window.addEventListener('school-name-changed', (event) => {
    const nextName = event?.detail?.newName || event?.detail?.schoolName || event?.detail?.name;
    apply(brandingAllowed() ? nextName : null, { force: true });
  });
  window.addEventListener('themechange', () => { apply(null, { force: true }); setTimeout(() => apply(null, { force: true }), 120); });
  const originalToggleTheme = window.toggleTheme;
  setTimeout(() => {
    if (typeof window.toggleTheme === 'function' && !window.toggleTheme.__brandingWrapped) {
      const t = window.toggleTheme;
      window.toggleTheme = function () {
        const result = t.apply(this, arguments);
        setTimeout(() => apply(null, { force: true }), 60);
        return result;
      };
      window.toggleTheme.__brandingWrapped = true;
    } else if (typeof originalToggleTheme === 'function' && !originalToggleTheme.__brandingWrapped) {
      window.toggleTheme = function () {
        const result = originalToggleTheme.apply(this, arguments);
        setTimeout(() => apply(null, { force: true }), 60);
        return result;
      };
      window.toggleTheme.__brandingWrapped = true;
    }
  }, 0);
})();
