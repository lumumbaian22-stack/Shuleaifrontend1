// Global Profile Picture Manager - V9.2
(function () {
  function currentUser() {
    try { return JSON.parse(localStorage.getItem('user') || localStorage.getItem('shule_user') || '{}'); } catch (_) { return {}; }
  }

  function media(url) {
    if (!url) return '';
    if (typeof resolveMediaUrl === 'function') return resolveMediaUrl(url);
    return url;
  }

  function initials(name) {
    if (typeof getInitials === 'function') return getInitials(name || 'User');
    return String(name || 'U').split(' ').map(x => x[0]).join('').slice(0,2).toUpperCase();
  }

  function avatarHtml(name, imageUrl, sizeClass = 'h-10 w-10') {
    const src = media(imageUrl);
    if (src) {
      return `<img src="${src}" alt="${escapeHtml(name || 'Profile')}" class="${sizeClass} rounded-full object-cover global-profile-click cursor-pointer" data-profile-full="${src}" data-profile-name="${escapeHtml(name || 'Profile')}">`;
    }
    return `<div class="${sizeClass} rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">${initials(name)}</div>`;
  }

  function applyToElement(el) {
    const user = currentUser();
    const name = el.dataset.userName || user.name || 'User';
    const image = el.dataset.profileImage || user.profileImage || user.profilePicture || '';
    const src = media(image);

    if (!src) {
      if (!el.querySelector('img')) el.textContent = initials(name);
      return;
    }

    if (el.tagName === 'IMG') {
      el.src = src;
      el.classList.add('global-profile-click');
      el.dataset.profileFull = src;
      el.dataset.profileName = name;
      return;
    }

    el.innerHTML = `<img src="${src}" alt="${escapeHtml(name)}" class="h-full w-full rounded-full object-cover global-profile-click cursor-pointer" data-profile-full="${src}" data-profile-name="${escapeHtml(name)}">`;
  }

  function applyGlobalProfilePictures() {
    const user = currentUser();
    const image = user.profileImage || user.profilePicture || '';
    const src = media(image);

    document.querySelectorAll('.user-avatar, .global-avatar, #profile-preview, #user-avatar, #sidebar-user-avatar').forEach(applyToElement);

    const headerButton = document.getElementById('user-menu-button');
    if (headerButton && src) {
      const existingImg = headerButton.querySelector('img');
      if (existingImg) {
        existingImg.src = src;
        existingImg.classList.add('global-profile-click');
        existingImg.dataset.profileFull = src;
        existingImg.dataset.profileName = user.name || 'Profile';
      }
    }

    document.querySelectorAll('[data-profile-image]').forEach(el => {
      if (el.dataset.profileImage) applyToElement(el);
    });
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
            <img src="${src}" alt="${escapeHtml(name || 'Profile picture')}" class="w-full max-h-[78vh] object-contain bg-black">
            <div class="p-4 flex items-center justify-between">
              <strong>${escapeHtml(name || 'Profile picture')}</strong>
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

  document.addEventListener('click', function (e) {
    const target = e.target.closest('.global-profile-click, img[src*="/uploads/"], img[src*="profile_"]');
    if (!target) return;
    const src = target.dataset.profileFull || target.getAttribute('src');
    const name = target.dataset.profileName || target.getAttribute('alt') || 'Profile picture';
    if (src) {
      e.preventDefault();
      openProfileImageModal(src, name);
    }
  });

  const observer = new MutationObserver(() => {
    clearTimeout(window.__globalProfileTimer);
    window.__globalProfileTimer = setTimeout(applyGlobalProfilePictures, 80);
  });

  document.addEventListener('DOMContentLoaded', function () {
    applyGlobalProfilePictures();
    observer.observe(document.body, { childList: true, subtree: true });
  });

  window.applyGlobalProfilePictures = applyGlobalProfilePictures;
  window.openProfileImageModal = openProfileImageModal;
  window.closeProfileImageModal = closeProfileImageModal;
  window.globalAvatarHtml = avatarHtml;
})();
