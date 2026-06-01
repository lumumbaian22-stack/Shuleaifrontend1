/*
 * Shule AI Branding Manager V101
 * Stable branding runtime: no flicker, no logo fighting, dark-mode safe logo, visible school colors.
 * One source of truth: window.schoolBranding/localStorage + backend /api/owner/branding.
 */
(function () {
  'use strict';

  const PLATFORM_SHORT_NAME = 'ShuleAI';
  const PLATFORM_LOGO_LIGHT = 'assets/logo-light.png';
  const PLATFORM_LOGO_DARK = 'assets/logo-dark.png';
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
    return window.schoolSettings || safeParse(localStorage.getItem('schoolSettings'), {}) || {};
  }

  function getStoredBranding() {
    const school = getStoredSchool();
    const settings = getStoredSettings();
    const direct = window.schoolBranding || safeParse(localStorage.getItem('schoolBranding'), {}) || {};
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

  function isSchoolBranded() { return !isSuperAdmin() && !!getSchoolNameFromAnySource(); }
  function getDisplayName() { return isSchoolBranded() ? getSchoolNameFromAnySource() : PLATFORM_SHORT_NAME; }

  function resolveBrandImage(value) {
    const raw = clean(value);
    if (!raw || raw === 'undefined' || raw === 'null') return '';
    if (/^data:image\//i.test(raw)) return raw;
    if (/^https?:\/\//i.test(raw)) return raw;
    if (/^(blob:|file:)/i.test(raw)) return raw;
    if (raw.includes('data:image/')) return '';
    if (typeof window.resolveMediaUrl === 'function') return window.resolveMediaUrl(raw);
    return raw;
  }

  function getLogoSource() {
    if (isSuperAdmin()) return '';
    const b = getStoredBranding();
    return resolveBrandImage(b.logoDataUrl) || resolveBrandImage(b.logoUrl) || resolveBrandImage(b.logo) || '';
  }

  function currentMode() { return document.documentElement.classList.contains('dark') ? 'dark' : 'light'; }

  function getLogoForMode(mode) {
    const schoolLogo = getLogoSource();
    if (schoolLogo && !isSuperAdmin()) return schoolLogo;
    // Use light logo if dark logo is not visually suitable. Keep dark asset only if no school logo.
    return mode === 'dark' ? PLATFORM_LOGO_DARK : PLATFORM_LOGO_LIGHT;
  }

  function normalizeColorPreset() {
    const b = getStoredBranding();
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
      light.className = 'h-10 w-10 object-contain block dark:hidden school-sidebar-logo';
      light.setAttribute('data-school-logo', 'true');
      light.setAttribute('data-brand-logo-light', 'true');
      container.insertBefore(light, container.firstChild);
    }
    if (!dark) {
      dark = document.createElement('img');
      dark.id = 'sidebar-logo-dark';
      dark.className = 'h-10 w-10 object-contain hidden dark:block school-sidebar-logo';
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
    const name = `${getDisplayName()} Logo`;
    const schoolLogo = getLogoSource();
    const lightSrc = schoolLogo && !isSuperAdmin() ? schoolLogo : PLATFORM_LOGO_LIGHT;
    const darkSrc = schoolLogo && !isSuperAdmin() ? schoolLogo : PLATFORM_LOGO_DARK;

    setImageStable(light, lightSrc, PLATFORM_LOGO_LIGHT, name);
    setImageStable(dark, darkSrc, PLATFORM_LOGO_LIGHT, name); // dark fallback uses visible light asset to avoid disappearing

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
    const root = document.documentElement;
    if (isSuperAdmin()) {
      document.body?.classList.remove('school-theme-scope');
      document.body?.classList.add('platform-theme-scope');
      root.setAttribute('data-dashboard-scope', 'platform');
      root.style.setProperty('--school-primary-color', '#083A85');
      root.style.setProperty('--school-accent-color', '#11B5B1');
      root.style.setProperty('--school-primary-hsl', '214 89% 28%');
      root.style.setProperty('--school-accent-hsl', '179 83% 39%');
      document.body?.removeAttribute('data-school-color-name');
      return;
    }
    const colors = normalizeColorPreset();
    const primaryHsl = hexToHslParts(colors.primaryColor);
    const accentHsl = hexToHslParts(colors.accentColor);
    document.body?.classList.remove('platform-theme-scope');
    document.body?.classList.add('school-theme-scope');
    root.setAttribute('data-dashboard-scope', 'school');
    // Scoped branding tokens only. Do not overwrite core --primary/--background/card tokens,
    // because that breaks dashboards and leaks one school's theme into platform screens.
    root.style.setProperty('--school-primary-color', colors.primaryColor);
    root.style.setProperty('--school-accent-color', colors.accentColor);
    root.style.setProperty('--school-primary-hsl', primaryHsl || '217 91% 60%');
    root.style.setProperty('--school-accent-hsl', accentHsl || '174 82% 39%');
    if (accentHsl) root.style.setProperty('--brand-accent-hsl', accentHsl);
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
    if (newName) syncStoredSchoolName(newName);
    const displayName = newName ? clean(newName) : getDisplayName();
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
    if (isSuperAdmin()) {
      loadedOnce = true;
      try { localStorage.removeItem('schoolBranding'); } catch (_) {}
      window.schoolBranding = {};
      apply(PLATFORM_SHORT_NAME, { force: true });
      return {};
    }
    if (typeof window.apiRequest !== 'function') { apply(null, { force: true }); return getStoredBranding(); }
    if (!(localStorage.getItem('token') || localStorage.getItem('authToken'))) { apply(null, { force: true }); return getStoredBranding(); }
    try {
      const res = await window.apiRequest('/api/owner/branding');
      const branding = res?.data || {};
      loadedOnce = true;
      window.schoolBranding = branding;
      localStorage.setItem('schoolBranding', JSON.stringify(branding));
      apply(branding.schoolName || branding.displayName || branding.name, { force: true });
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
    try { localStorage.setItem('schoolBranding', JSON.stringify(window.schoolBranding)); } catch (_) {}
    apply(branding.schoolName || branding.displayName || branding.name, { force: true });
  });
  window.addEventListener('school-name-changed', (event) => {
    const nextName = event?.detail?.newName || event?.detail?.schoolName || event?.detail?.name;
    apply(nextName, { force: true });
  });
  window.addEventListener('themechange', () => apply(null, { force: true }));
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
