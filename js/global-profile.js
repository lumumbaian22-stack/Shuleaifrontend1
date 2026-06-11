// Stable Global Profile Picture Manager - V9.3
(function () {
  function getStoredUser() {
    try { return JSON.parse(localStorage.getItem('user') || localStorage.getItem('shule_user') || '{}'); }
    catch (_) { return {}; }
  }

  const brokenProfileImages = new Set();
  const brokenProfileFilenames = window.__brokenProfileImageFiles || new Set();
  window.__brokenProfileImageFiles = brokenProfileFilenames;
  function media(url) {
    if (!url) return '';
    let resolved = '';
    if (typeof resolveMediaUrl === 'function') resolved = resolveMediaUrl(url);
    else if (/^https?:\/\//i.test(url) || url.startsWith('data:') || url.startsWith('blob:')) resolved = url;
    else {
      const base = (window.API_BASE_URL || '').replace(/\/$/, '');
      resolved = base ? base + (url.startsWith('/') ? url : '/' + url) : url;
    }
    try { const file = String(resolved).split('/').pop(); if (brokenProfileFilenames.has(file)) return ''; } catch (_) {}
    return brokenProfileImages.has(resolved) ? '' : resolved;
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

  function fallbackAvatarHtml(name) {
    return `<span class="h-full w-full rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">${safeName(initials(name))}</span>`;
  }

  function markBrokenProfileImage(src, el, name) {
    if (src) {
      brokenProfileImages.add(src);
      try {
        const file = String(src).split('/').pop();
        brokenProfileFilenames.add(file);
        // Remove stale Render /uploads image paths from localStorage so every section does not retry them.
        ['user'].forEach((key) => {
          try {
            const raw = localStorage.getItem(key);
            if (!raw || !file || !raw.includes(file)) return;
            const obj = JSON.parse(raw);
            ['profileImage','profilePicture','avatar','photoUrl','signature','signatureUrl'].forEach((field) => {
              if (String(obj[field] || '').includes(file)) obj[field] = '';
            });
            if (obj.preferences && typeof obj.preferences === 'object') {
              ['profileImage','profilePicture','avatar','profileImageUrl','signatureUrl','signatureFileUrl'].forEach((field) => {
                if (String(obj.preferences[field] || '').includes(file)) obj.preferences[field] = '';
              });
            }
            const minimal=typeof stripLargeMediaForStorage==='function'?stripLargeMediaForStorage(obj):obj;if(typeof safeSessionSet==='function')safeSessionSet(key,JSON.stringify(minimal));
          } catch (_) {}
        });
      } catch (_) {}
    }
    if (!el) return;
    if (el.tagName === 'IMG') {
      const span = document.createElement('span');
      span.className = el.className || 'h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold';
      span.classList.remove('object-cover', 'global-profile-click');
      span.textContent = initials(name || 'User');
      el.replaceWith(span);
      return;
    }
    el.innerHTML = fallbackAvatarHtml(name || 'User');
  }

  function setImageIntoElement(el, src, name) {
    if (!el) return;
    src = media(src);
    if (!src) { if (!el.querySelector?.('img') && !el.textContent.trim()) el.innerHTML = fallbackAvatarHtml(name || 'User'); return; }

    if (el.tagName === 'IMG') {
      el.onerror = function(){ markBrokenProfileImage(src, this, name); };
      el.src = src;
      el.alt = name || 'Profile picture';
      el.classList.add('global-profile-click');
      el.dataset.profileFull = src;
      el.dataset.profileName = name || 'Profile picture';
      return;
    }

    el.innerHTML = `<img src="${src}" alt="${safeName(name || 'Profile picture')}" class="h-full w-full rounded-full object-cover global-profile-click cursor-pointer" data-profile-full="${src}" data-profile-name="${safeName(name || 'Profile picture')}" onerror="this.dispatchEvent(new CustomEvent('profile-image-broken',{bubbles:true,detail:{src:this.src,name:this.dataset.profileName}}))">`;
  }

  let profileApplyInProgress = false;

  function applyGlobalProfilePictures() {
    if (profileApplyInProgress) return;
    profileApplyInProgress = true;
    try {
      const current = getStoredUser();
      const currentSrc = media(current.profileImage || current.profilePicture || current.avatar || '');
      const currentName = current.name || current.fullName || 'User';

      // Keep the sidebar/header avatar fresh as well.
      if (typeof updateUserInfo === 'function') {
        updateUserInfo();
      }

      // Current logged-in user avatars only.
      document.querySelectorAll('[data-current-user-avatar], #profile-preview, #user-avatar, #sidebar-user-avatar, img.user-avatar').forEach(el => {
        if (currentSrc) setImageIntoElement(el, currentSrc, currentName);
      });

      // Any explicitly data-bound avatar.
      document.querySelectorAll('[data-profile-image]').forEach(el => {
        const src = media(el.dataset.profileImage || el.getAttribute('data-profile-image') || '');
        const name = el.dataset.userName || el.dataset.profileName || 'Profile picture';
        if (src) setImageIntoElement(el, src, name);
        else if (!el.querySelector?.('img') && !el.textContent.trim()) el.textContent = initials(name);
      });
    } finally {
      profileApplyInProgress = false;
    }
  }

  let profileObserver = null;
  let profileObserverTimer = null;
  function startProfileMutationObserver() {
    const target = document.getElementById('dashboard-content');
    if (!target || profileObserver) return;
    profileObserver = new MutationObserver((mutations) => {
      if (!mutations.some(m => m.type === 'childList')) return;
      clearTimeout(profileObserverTimer);
      profileObserverTimer = setTimeout(applyGlobalProfilePictures, 60);
    });
    profileObserver.observe(target, { childList: true, subtree: true });
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
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
  }

  function closeProfileImageModal() {
    document.getElementById('global-profile-image-modal')?.remove();
  }

  document.addEventListener('profile-image-broken', function(e){ markBrokenProfileImage(e.detail?.src, e.target?.parentElement, e.detail?.name); });

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
    setTimeout(applyGlobalProfilePictures, 80);
    setTimeout(startProfileMutationObserver, 100);
  });

  window.applyGlobalProfilePictures = applyGlobalProfilePictures;
  window.startProfileMutationObserver = startProfileMutationObserver;
  window.openProfileImageModal = openProfileImageModal;
  window.closeProfileImageModal = closeProfileImageModal;
})();
