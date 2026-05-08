// Stable Global Profile Picture Manager - V34
(function () {
  let observerStarted = false;
  let pendingApply = null;
  let updatingSidebar = false;

  function getStoredUser() {
    try {
      return JSON.parse(localStorage.getItem('user') || localStorage.getItem('shule_user') || '{}') || {};
    } catch (_) {
      return {};
    }
  }

  function media(url) {
    if (!url) return '';
    if (typeof safeResolveMediaUrl === 'function') return safeResolveMediaUrl(url);
    if (typeof resolveMediaUrl === 'function') return resolveMediaUrl(url);
    if (/^https?:\/\//i.test(url) || String(url).startsWith('data:') || String(url).startsWith('blob:')) return url;
    const base = (window.API_BASE_URL || localStorage.getItem('API_BASE_URL') || '').replace(/\/$/, '');
    return base ? base + (String(url).startsWith('/') ? url : '/' + url) : url;
  }

  function initials(name) {
    if (typeof getInitials === 'function') return getInitials(name || 'User');
    return String(name || 'U').split(/\s+/).filter(Boolean).map(x => x[0]).join('').slice(0,2).toUpperCase() || 'U';
  }

  function safeName(value) {
    if (typeof escapeHtml === 'function') return escapeHtml(value || '');
    const div = document.createElement('div');
    div.textContent = value || '';
    return div.innerHTML;
  }

  function setImageIntoElement(el, src, name) {
    if (!el || !src) return;
    const safe = safeName(name || 'Profile picture');
    if (el.tagName === 'IMG') {
      if (el.getAttribute('src') !== src) el.src = src;
      el.alt = name || 'Profile picture';
      el.classList.add('global-profile-click', 'object-cover', 'rounded-full');
      el.dataset.profileFull = src;
      el.dataset.profileName = name || 'Profile picture';
      return;
    }
    el.innerHTML = `<img src="${src}" alt="${safe}" class="h-full w-full rounded-full object-cover global-profile-click cursor-pointer" data-current-user-avatar data-profile-full="${src}" data-profile-name="${safe}">`;
  }

  function applyGlobalProfilePictures() {
    const current = getStoredUser();
    const currentSrc = media(current.profileImage || current.profilePicture || current.avatar || current.photo || '');
    const currentName = current.name || current.fullName || 'User';

    document.querySelectorAll('[data-current-user-avatar], #profile-preview, #user-avatar, #sidebar-user-avatar, img.user-avatar').forEach(el => {
      if (currentSrc) setImageIntoElement(el, currentSrc, currentName);
    });

    document.querySelectorAll('[data-profile-image]').forEach(el => {
      const explicit = el.dataset.profileImage || el.getAttribute('src') || '';
      const src = media(explicit);
      const name = el.dataset.userName || el.dataset.profileName || el.getAttribute('alt') || 'Profile picture';
      if (src) setImageIntoElement(el, src, name);
      else if (!el.querySelector('img') && !el.textContent.trim()) el.textContent = initials(name);
    });

    if (!updatingSidebar && typeof updateUserInfo === 'function') {
      updatingSidebar = true;
      try { updateUserInfo(); } catch (e) { console.warn('updateUserInfo from profile sync failed:', e); }
      updatingSidebar = false;
    }
  }

  function scheduleApply(delay = 60) {
    clearTimeout(pendingApply);
    pendingApply = setTimeout(() => {
      try { applyGlobalProfilePictures(); } catch (e) { console.warn('Profile picture refresh failed:', e); }
    }, delay);
  }

  function observeDashboardContent() {
    if (observerStarted) return;
    const target = document.getElementById('dashboard-content');
    if (!target) return;
    observerStarted = true;
    const observer = new MutationObserver(mutations => {
      if (mutations.some(m => m.type === 'childList')) scheduleApply(60);
    });
    observer.observe(target, { childList: true, subtree: true });
    window.__profileAvatarObserver = observer;
  }

  function openProfileImageModal(src, name) {
    src = media(src);
    if (!src) return;
    document.getElementById('global-profile-image-modal')?.remove();
    const html = `
      <div id="global-profile-image-modal" class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4" onclick="closeProfileImageModal()">
        <div class="relative max-w-3xl w-full" onclick="event.stopPropagation()">
          <button onclick="closeProfileImageModal()" class="absolute -top-12 right-0 h-10 w-10 rounded-full bg-white/10 text-white hover:bg-white/20">✕</button>
          <div class="rounded-2xl overflow-hidden bg-background shadow-2xl">
            <img src="${src}" alt="${safeName(name || 'Profile picture')}" class="w-full max-h-[78vh] object-contain bg-black">
            <div class="p-4 flex items-center justify-between">
              <strong>${safeName(name || 'Profile picture')}</strong>
              <a href="${src}" target="_blank" class="px-3 py-2 rounded-lg border text-sm">Open Full Image</a>
            </div>
          </div>
        </div>
      </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
  }

  function closeProfileImageModal() {
    document.getElementById('global-profile-image-modal')?.remove();
  }

  document.addEventListener('click', function (e) {
    const target = e.target.closest('.global-profile-click, img[data-profile-full], img.user-avatar, #profile-preview');
    if (!target) return;
    const src = target.dataset.profileFull || target.getAttribute('src');
    const name = target.dataset.profileName || target.getAttribute('alt') || 'Profile picture';
    if (src) {
      e.preventDefault();
      openProfileImageModal(src, name);
    }
  });

  document.addEventListener('DOMContentLoaded', function () {
    observeDashboardContent();
    scheduleApply(80);
    setTimeout(observeDashboardContent, 300);
  });

  window.applyGlobalProfilePictures = applyGlobalProfilePictures;
  window.scheduleApplyGlobalProfilePictures = scheduleApply;
  window.observeDashboardProfilePictures = observeDashboardContent;
  window.openProfileImageModal = openProfileImageModal;
  window.closeProfileImageModal = closeProfileImageModal;
})();
