// rollout-fixes-v16.js - production fixes for homework, grades, theme, duty, analytics, alerts, and safe remove actions
(function(){
  const w = window;
  const toast = (m,t='info') => (w.showToast ? w.showToast(m,t) : w.toast ? w.toast(m,t) : console.log(`[${t}] ${m}`));
  const esc = (s)=> String(s ?? '').replace(/[&<>'"]/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[c]));
  const currentRole = ()=> (w.getCurrentUser?.()?.role || JSON.parse(localStorage.getItem('user')||'{}')?.role || '').toLowerCase();

  // 1) Homework: backend requires instructions, older modal sent description only.
  w.v12SaveHomework = async function(){
    try {
      const title = document.getElementById('v12-hw-title')?.value?.trim();
      const subject = document.getElementById('v12-hw-subject')?.value?.trim() || 'General';
      const className = document.getElementById('v12-hw-class')?.value?.trim();
      const dueDate = document.getElementById('v12-hw-due')?.value || null;
      const instructions = document.getElementById('v12-hw-desc')?.value?.trim();
      if (!title) return toast('Enter homework title', 'warning');
      if (!instructions) return toast('Enter homework instructions', 'warning');
      const payload = { title, subject, instructions, description: instructions, className, dueDate };
      const res = await w.api.homework.createAssignment(payload);
      document.getElementById('v12-hw-create')?.remove();
      toast(res?.message || 'Homework assigned', res?.data?.assignedCount ? 'success' : 'warning');
      if (typeof w.showDashboardSection === 'function') await w.showDashboardSection('homework');
    } catch(e){ toast(e.message || 'Failed to create homework', 'error'); }
  };

  // 2) Teacher grades: use class-students endpoint, understand multiple response shapes, and show useful empty states.
  w.v16OpenMarksEntry = async function(subject, classId, className){
    try {
      w.currentMarksSubject = subject;
      w.currentMarksClassId = classId;
      w.currentMarksClassName = className;
      if (w.showLoading) w.showLoading();
      const res = await w.api.teacher.getClassStudents(classId);
      const raw = Array.isArray(res?.data) ? res.data : Array.isArray(res?.data?.students) ? res.data.students : [];
      w.currentMarksStudents = raw.map(s => ({
        ...s,
        name: s.name || s.User?.name || s.user?.name || 'Student',
        admissionNumber: s.admissionNumber || s.elimuid || s.assessmentNumber || '-'
      }));
      if (!w.currentMarksStudents.length) {
        toast(`No students found for ${className || 'this class'}. Check that students have the same grade/class as the class setup.`, 'warning');
        return;
      }
      if (typeof w.showMarksEntryModal === 'function') w.showMarksEntryModal(className);
      else if (typeof w.openMarksEntry === 'function') w.openMarksEntry(subject, classId, className);
    } catch(e){ toast(e.message || 'Failed to load students for marks entry', 'error'); }
    finally { if (w.hideLoading) w.hideLoading(); }
  };

  // Replace onclicks after grades section renders so old cards call the safer loader.
  const oldShow = w.showDashboardSection;
  if (typeof oldShow === 'function' && !oldShow.__v16Wrapped) {
    const wrapped = async function(section, ...args){
      const out = await oldShow.call(this, section, ...args);
      setTimeout(() => {
        if (section === 'grades' || section === 'marks') {
          document.querySelectorAll('[onclick^="openMarksEntry("]').forEach(el => {
            const oc = el.getAttribute('onclick') || '';
            const m = oc.match(/openMarksEntry\('([^']*)',\s*'([^']*)',\s*'([^']*)'\)/);
            if (m) el.setAttribute('onclick', `v16OpenMarksEntry('${m[1]}','${m[2]}','${m[3]}')`);
          });
        }
      }, 50);
      return out;
    };
    wrapped.__v16Wrapped = true;
    w.showDashboardSection = wrapped;
  }

  // 3) Stop null .remove() crashes from older inline handlers.
  document.addEventListener('click', function(e){
    const el = e.target.closest('[onclick]');
    if (!el) return;
    const oc = el.getAttribute('onclick') || '';
    const ids = [...oc.matchAll(/getElementById\(['"]([^'"]+)['"]\)\.remove\(\)/g)].map(m=>m[1]);
    for (const id of ids) {
      if (!document.getElementById(id)) {
        e.preventDefault(); e.stopImmediatePropagation();
        toast('That panel is already closed.', 'info');
        return false;
      }
    }
  }, true);

  // 4) Upload setup should not scream when upload widgets are absent on the current screen.
  const oldConsoleError = console.error;
  console.error = function(...args){
    if (String(args[0] || '').includes('Required elements not found')) return;
    oldConsoleError.apply(console, args);
  };

  // 5) Duty: resilient teacher duty loader for current/today card.
  w.v16RefreshTeacherDutyCard = async function(){
    try {
      const res = await w.api.duty.getTodayDuty();
      const data = res?.data || res || {};
      const duty = data.duty || (Array.isArray(data.duties) ? data.duties[0] : null);
      const loc = document.getElementById('duty-location') || document.getElementById('v93-teacher-duty-location');
      const stat = document.getElementById('duty-status') || document.getElementById('v93-teacher-duty-status');
      const inBtn = document.getElementById('check-in-btn');
      const outBtn = document.getElementById('check-out-btn');
      if (loc) loc.textContent = duty ? `${duty.area || duty.type || 'Duty'} ${duty.timeSlot?.start ? '• '+duty.timeSlot.start : ''}` : 'No duty assigned today';
      const checkedIn = !!(duty?.checkedIn || duty?.checkedInAt);
      if (stat) stat.textContent = duty ? (checkedIn ? 'Checked In' : 'Not Checked In') : 'No Duty';
      if (inBtn) inBtn.disabled = !duty || checkedIn;
      if (outBtn) outBtn.disabled = !duty || !checkedIn;
      return duty;
    } catch(e){ toast(e.message || 'Duty could not be loaded', 'warning'); return null; }
  };
  w.loadTodayDuty = w.v16RefreshTeacherDutyCard;
  setTimeout(w.v16RefreshTeacherDutyCard, 500);

  // 6) Alerts: non-admins are view-only in UI.
  w.v16CanCreateAlerts = () => ['admin','super_admin'].includes(currentRole());
  w.v16RenderAlertActions = () => w.v16CanCreateAlerts() ? `<button class="v12-btn primary" onclick="v95OpenCreateAlert && v95OpenCreateAlert()">Create Alert</button>` : `<span class="text-sm text-muted-foreground">View-only alerts</span>`;

  // Hide create-alert buttons for teacher/parent/student without breaking admin.
  function enforceAlertRoleUI(){
    if (w.v16CanCreateAlerts()) return;
    document.querySelectorAll('button,[role="button"]').forEach(btn=>{
      const txt = (btn.textContent||'').toLowerCase();
      const oc = (btn.getAttribute('onclick')||'').toLowerCase();
      if (txt.includes('create alert') || txt.includes('new alert') || oc.includes('createalert')) {
        btn.disabled = true;
        btn.title = 'Only school admin can create alerts';
        btn.classList.add('opacity-50','cursor-not-allowed');
      }
    });
  }
  setInterval(enforceAlertRoleUI, 1500);

  // 7) Theme hardening for newly added/recovery cards and old white panels.
  const css = `
    .dark .v12-card,.dark .v95-section-card,.dark .v94-card,.dark .modal-content,.dark .lp-price-card{background:#111827!important;color:#f9fafb!important;border-color:#374151!important}
    .dark .v12-input,.dark .v12-textarea,.dark input,.dark select,.dark textarea{background:#0f172a!important;color:#f9fafb!important;border-color:#475569!important}
    .dark .bg-white{background-color:#111827!important}.dark .text-gray-900{color:#f9fafb!important}.dark .text-gray-700{color:#d1d5db!important}.dark .text-gray-600{color:#cbd5e1!important}
    .dark table,.dark thead,.dark tbody,.dark tr,.dark td,.dark th{border-color:#374151!important}.dark th{background:#1f2937!important;color:#f9fafb!important}.dark td{color:#e5e7eb!important}
    .dark .lp-light{background:#020617!important;color:#f9fafb!important}.dark .lp-muted{background:#0f172a!important;color:#f9fafb!important}
  `;
  const style=document.createElement('style'); style.id='v16-theme-fixes'; style.textContent=css; document.head.appendChild(style);

  // 8) Demo route from pricing free trial. Uses real app shell with demo credentials/data isolation flag.
  w.openFullSystemDemo = function(){
    localStorage.setItem('SHULE_DEMO_MODE','true');
    localStorage.setItem('SHULE_API_BASE_URL', localStorage.getItem('SHULE_API_BASE_URL') || 'https://shuleaibackend-32h1.onrender.com');
    if (typeof w.openAuthModal === 'function') {
      toast('Opening full system demo. Use the demo accounts shown in the login panel.', 'info');
      w.openAuthModal('admin','login');
      setTimeout(()=>{
        const box=document.querySelector('#auth-modal .text-xs,#auth-modal');
        if(box && !document.getElementById('v16-demo-note')){
          const note=document.createElement('div'); note.id='v16-demo-note'; note.className='mt-3 rounded-lg border p-3 text-sm bg-blue-50 dark:bg-blue-950/30';
          note.innerHTML='<strong>Demo route:</strong> this opens the real dashboard system with demo data/accounts. Real money collection remains disabled.';
          box.appendChild(note);
        }
      },300);
    } else location.hash = '#demo';
  };

  console.log('✅ v16 rollout fixes loaded');
})();
