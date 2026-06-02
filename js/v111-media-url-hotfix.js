// Shule AI V111 media/data URL hotfix
// Prevents data:image/blob URLs from being prefixed with API_BASE_URL and repairs cached bad values.
(function () {
  const DATA_IMAGE_RE = /data:image\/[a-zA-Z0-9.+-]+;base64,/i;

  function normalizeMediaUrl(value) {
    if (!value) return '';
    let raw = String(value).trim();
    if (!raw) return '';

    const dataIndex = raw.search(DATA_IMAGE_RE);
    if (dataIndex >= 0) return raw.slice(dataIndex);

    if (/^(data|blob):/i.test(raw)) return raw;
    if (/^\/?data:image\//i.test(raw)) return raw.replace(/^\/+/, '');
    if (/^https?:\/\//i.test(raw)) return raw;

    if (/^[A-Za-z0-9+/\r\n]+={0,2}$/.test(raw) && raw.length > 500) {
      return 'data:image/png;base64,' + raw.replace(/\s+/g, '');
    }

    const base = String(window.API_BASE_URL || localStorage.getItem('SHULE_API_BASE_URL') || 'https://shuleaibackend-32h1.onrender.com').replace(/\/$/, '');
    return base ? base + (raw.startsWith('/') ? raw : '/' + raw) : raw;
  }

  const previousResolve = window.resolveMediaUrl;
  window.normalizeShuleMediaUrl = normalizeMediaUrl;
  window.resolveMediaUrl = function (url) {
    return normalizeMediaUrl(url || '');
  };

  function normalizeObjectImageFields(obj) {
    if (!obj || typeof obj !== 'object') return false;
    let changed = false;
    const imageKeys = new Set([
      'profileImage', 'profilePicture', 'avatar', 'photo', 'photoUrl',
      'logo', 'logoUrl', 'schoolLogo', 'schoolLogoUrl', 'brandingLogo',
      'image', 'imageUrl'
    ]);

    for (const key of Object.keys(obj)) {
      const value = obj[key];
      if (imageKeys.has(key) && typeof value === 'string') {
        const fixed = normalizeMediaUrl(value);
        if (fixed && fixed !== value) {
          obj[key] = fixed;
          changed = true;
        }
      } else if (value && typeof value === 'object' && !Array.isArray(value)) {
        if (normalizeObjectImageFields(value)) changed = true;
      }
    }
    return changed;
  }

  function repairCachedImages() {
    [
      'user', 'shule_user', 'currentUser', 'schoolSettings', 'brandingSettings',
      'schoolBranding', 'dashboardData', 'selectedSchool'
    ].forEach(key => {
      try {
        const raw = localStorage.getItem(key);
        if (!raw || raw[0] !== '{') return;
        const parsed = JSON.parse(raw);
        if (normalizeObjectImageFields(parsed)) {
          localStorage.setItem(key, JSON.stringify(parsed));
        }
      } catch (_) {}
    });
  }

  function repairLiveImages(root) {
    const scope = root && root.querySelectorAll ? root : document;
    scope.querySelectorAll('img[src*="/data:image"], img[src*="data:image"], img[data-profile-full*="/data:image"], [data-profile-image*="/data:image"]').forEach(el => {
      if (el.tagName === 'IMG') {
        const fixedSrc = normalizeMediaUrl(el.getAttribute('src') || '');
        if (fixedSrc) el.setAttribute('src', fixedSrc);
      }
      if (el.dataset) {
        if (el.dataset.profileFull) el.dataset.profileFull = normalizeMediaUrl(el.dataset.profileFull);
        if (el.dataset.profileImage) el.dataset.profileImage = normalizeMediaUrl(el.dataset.profileImage);
      }
    });
  }

  function boot() {
    repairCachedImages();
    repairLiveImages(document);
    if (typeof window.applyGlobalProfilePictures === 'function') {
      window.applyGlobalProfilePictures();
    }
  }

  document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 120));
  window.addEventListener('shule:section-rendered', () => setTimeout(boot, 80));

  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.type === 'childList') {
        m.addedNodes.forEach(node => {
          if (node && node.nodeType === 1) repairLiveImages(node);
        });
      }
    }
  });
  document.addEventListener('DOMContentLoaded', () => {
    try { observer.observe(document.body, { childList: true, subtree: true }); } catch (_) {}
  });
})();
