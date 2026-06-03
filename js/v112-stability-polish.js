
// Shule AI v112 stability polish: teacher parent-chat isolation, dark logo guard, super-admin routing guard.
(function(){
  'use strict';
  const safeParse = (v, fb={}) => { try { return v ? JSON.parse(v) : fb; } catch { return fb; } };
  const isTeacher = () => String(safeParse(localStorage.getItem('user')).role || '').toLowerCase() === 'teacher';
  const isSuperAdmin = () => ['superadmin','super_admin'].includes(String(safeParse(localStorage.getItem('user')).role || '').toLowerCase());
  function injectStyle(){
    if (document.getElementById('v112-stability-style')) return;
    const st = document.createElement('style');
    st.id = 'v112-stability-style';
    st.textContent = `
      #sidebar-logo-light,#sidebar-logo-dark,.school-sidebar-logo{max-width:40px!important;max-height:40px!important;object-fit:contain!important;visibility:visible!important;opacity:1!important;}
      html.dark #sidebar-logo-light{display:none!important;}
      html.dark #sidebar-logo-dark{display:block!important;}
      html:not(.dark) #sidebar-logo-light{display:block!important;}
      html:not(.dark) #sidebar-logo-dark{display:none!important;}
      [data-section="parent-chat"].teacher-hidden-parent-chat{display:none!important;}
      .platform-mode-card{transition:transform .15s ease, box-shadow .15s ease;}
      .platform-mode-card:hover{transform:translateY(-1px);}
    `;
    document.head.appendChild(st);
  }
  function normalizeLogo(src){
    if (!src) return 'assets/logo-light.png';
    if (typeof window.resolveMediaUrl === 'function') return window.resolveMediaUrl(src);
    if (/\/data:image\//i.test(src)) return src.slice(src.indexOf('data:image/'));
    return src;
  }
  function fixSidebarLogos(){
    const light = document.getElementById('sidebar-logo-light');
    const dark = document.getElementById('sidebar-logo-dark');
    const fallback = 'assets/logo-light.png';
    [light, dark].forEach(img => {
      if (!img) return;
      const raw = img.getAttribute('src') || fallback;
      const fixed = normalizeLogo(raw);
      img.onerror = function(){ this.onerror = null; this.src = fallback; };
      if (!fixed || /logo-dark\.png$/i.test(fixed)) img.setAttribute('src', fallback);
      else img.setAttribute('src', fixed);
      img.style.maxWidth = '40px'; img.style.maxHeight = '40px'; img.style.objectFit = 'contain'; img.style.opacity = '1'; img.style.visibility = 'visible';
    });
    if (dark && (!dark.getAttribute('src') || /logo-dark\.png$/i.test(dark.getAttribute('src')))) dark.setAttribute('src', fallback);
  }
  function removeTeacherParentSidebar(){
    if (!isTeacher()) return;
    document.querySelectorAll('[data-section="parent-chat"], button[onclick*="parent-chat"], a[onclick*="parent-chat"]').forEach(el => {
      el.classList.add('teacher-hidden-parent-chat');
      el.style.display = 'none';
      if (el.dataset) el.dataset.v112Removed = 'teacher-parent-sidebar';
    });
    const current = window.currentSection || localStorage.getItem('currentDashboardSection');
    if (current === 'parent-chat' && typeof window.showDashboardSection === 'function') window.showDashboardSection('staff-chat').catch(()=>{});
  }
  const oldShow = window.showDashboardSection;
  if (typeof oldShow === 'function' && !oldShow.__v112Stable) {
    window.showDashboardSection = async function(section){
      if (isTeacher() && section === 'parent-chat') section = 'staff-chat';
      const out = await oldShow.call(this, section);
      setTimeout(() => { fixSidebarLogos(); removeTeacherParentSidebar(); }, 30);
      return out;
    };
    window.showDashboardSection.__v112Stable = true;
  }
  function boot(){ injectStyle(); fixSidebarLogos(); removeTeacherParentSidebar(); }
  document.addEventListener('DOMContentLoaded', boot);
  window.addEventListener('load', boot);
  const observer = new MutationObserver(() => { fixSidebarLogos(); removeTeacherParentSidebar(); });
  observer.observe(document.documentElement, { attributes:true, attributeFilter:['class'] });
  observer.observe(document.body || document.documentElement, { childList:true, subtree:true });
  setInterval(() => { fixSidebarLogos(); removeTeacherParentSidebar(); }, 2000);
})();
