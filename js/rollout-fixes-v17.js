// rollout-fixes-v17.js - duty/auth/curriculum/theme/demo/help/analytics fixes
(function(){
  const w = window;
  const $ = (id) => document.getElementById(id);
  const toast = (m,t='info') => (w.showToast ? w.showToast(m,t) : console.log(`[${t}]`, m));
  const esc = (s='') => String(s ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const currentUser = () => { try { return w.getCurrentUser ? w.getCurrentUser() : JSON.parse(localStorage.getItem('currentUser') || '{}'); } catch { return {}; } };

  // ---------- Curriculum metadata ----------
  w.v17LoadSchoolCurriculum = async function(){
    try {
      const res = await w.apiRequest('/api/school/curriculum');
      if (res?.data) {
        w.schoolSettings = { ...(w.schoolSettings || {}), ...res.data };
        w.currentGradingScale = res.data.gradingScale || null;
      }
      return res?.data || null;
    } catch(e) { console.warn('v17 curriculum load failed:', e.message); return null; }
  };

  // ---------- Duty card: no auth spam, GPS-aware verified check-in, clear button states ----------
  function getBrowserGps(){
    return new Promise((resolve) => {
      if (!navigator.geolocation) return resolve(null);
      navigator.geolocation.getCurrentPosition(
        p => resolve({ latitude:p.coords.latitude, longitude:p.coords.longitude, accuracy:p.coords.accuracy }),
        () => resolve(null),
        { enableHighAccuracy:true, timeout:8000, maximumAge:60000 }
      );
    });
  }
  function normaliseDuty(res){
    const data = res?.data || res || {};
    const duties = Array.isArray(data) ? data : (data.duties || data.duty ? [data.duty].filter(Boolean) : []);
    const user = currentUser();
    return duties.find(d => d.isOnDuty || Number(d.teacherId) === Number(user.teacher?.id) || Number(d.teacherId) === Number(user.id)) || duties[0] || null;
  }
  w.v16RefreshTeacherDutyCard = w.v17RefreshTeacherDutyCard = async function(){
    const user = currentUser();
    const card = $('duty-card');
    if (!card || user.role !== 'teacher') return;
    const locationEl = $('duty-location'), statusEl = $('duty-status'), inBtn = $('check-in-btn'), outBtn = $('check-out-btn');
    try {
      const res = await w.api.duty.getTodayDuty();
      const duty = normaliseDuty(res);
      if (!duty) {
        if (locationEl) locationEl.textContent = 'No duty assigned today';
        if (statusEl) { statusEl.textContent = 'No Duty'; statusEl.className = 'duty-status px-2 py-1 bg-muted text-muted-foreground text-xs rounded-full'; }
        if (inBtn) { inBtn.disabled = true; inBtn.textContent = 'No Duty'; }
        if (outBtn) outBtn.disabled = true;
        return;
      }
      const slot = duty.timeSlot || {};
      const start = slot.start || duty.startTime || duty.time || 'Today';
      const area = duty.area || duty.location || duty.type || 'Assigned area';
      if (locationEl) locationEl.textContent = `${area} • ${start}`;
      const checkedIn = !!duty.checkedIn || duty.status === 'checked_in' || duty.status === 'late' || duty.status === 'completed';
      const checkedOut = !!duty.checkedOut || duty.status === 'completed';
      if (statusEl) {
        statusEl.textContent = checkedOut ? 'Completed' : checkedIn ? 'Checked In' : 'Pending';
        statusEl.className = checkedOut ? 'duty-status px-2 py-1 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 text-xs rounded-full' : checkedIn ? 'duty-status px-2 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs rounded-full' : 'duty-status px-2 py-1 bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 text-xs rounded-full';
      }
      if (inBtn) { inBtn.disabled = checkedIn; inBtn.textContent = checkedIn ? 'Checked In' : 'Check In'; }
      if (outBtn) { outBtn.disabled = !checkedIn || checkedOut; outBtn.textContent = checkedOut ? 'Checked Out' : 'Check Out'; }
    } catch(e) {
      if (e.status === 401 || /not authorized/i.test(e.message)) {
        if (locationEl) locationEl.textContent = 'Please sign in again to load duty';
        if (inBtn) inBtn.disabled = true;
        if (outBtn) outBtn.disabled = true;
        return;
      }
      if (locationEl) locationEl.textContent = e.message || 'Duty unavailable';
    }
  };
  w.loadTodayDuty = w.v17RefreshTeacherDutyCard;

  w.handleCheckIn = async function(){
    try {
      w.showLoading?.();
      const gps = await getBrowserGps();
      let res;
      try { res = await w.api.duty.verifiedCheckIn({ gps, notes:'Teacher dashboard check-in', deviceInfo:{ userAgent:navigator.userAgent } }); }
      catch(e){
        if (/GPS location is required/i.test(e.message)) throw new Error('GPS is required by this school. Please allow location access and try again.');
        if (/within .* minutes/i.test(e.message)) throw new Error(e.message + '. The duty is assigned, but check-in is locked outside the allowed time window.');
        res = await w.api.duty.checkIn({ location:gps ? 'GPS provided' : 'School', notes:'Teacher dashboard check-in' });
      }
      toast(res?.message || 'Checked in successfully','success');
      await w.v17RefreshTeacherDutyCard();
    } catch(e){ toast(e.message,'error'); } finally { w.hideLoading?.(); }
  };
  w.handleCheckOut = async function(){
    try {
      w.showLoading?.();
      const gps = await getBrowserGps();
      let res;
      try { res = await w.api.duty.verifiedCheckOut({ gps, notes:'Teacher dashboard check-out', deviceInfo:{ userAgent:navigator.userAgent } }); }
      catch(e){
        if (/GPS location is required/i.test(e.message)) throw new Error('GPS is required by this school. Please allow location access and try again.');
        res = await w.api.duty.checkOut({ location:gps ? 'GPS provided' : 'School', notes:'Teacher dashboard check-out' });
      }
      toast(res?.message || 'Checked out successfully','success');
      await w.v17RefreshTeacherDutyCard();
    } catch(e){ toast(e.message,'error'); } finally { w.hideLoading?.(); }
  };
  w.v12DutyCheckIn = w.handleCheckIn;
  w.v12DutyCheckOut = w.handleCheckOut;

  // ---------- Teacher student detail real actions ----------
  w.reportAbsenceForStudent = async function(studentId){
    const reason = prompt('Reason/remarks for absence:', 'Absent today') || 'Absent today';
    try { w.showLoading?.(); await w.apiRequest(`/api/teacher/students/${studentId}/report-absence`, { method:'POST', body:JSON.stringify({ reason }) }); toast('Absence recorded for today','success'); }
    catch(e){ toast(e.message,'error'); } finally { w.hideLoading?.(); }
  };
  w.openMessageParent = async function(studentId){
    try {
      w.showLoading?.();
      const res = await w.apiRequest(`/api/teacher/students/${studentId}/parent-contact`);
      const p = res.data;
      if (typeof w.openParentConversation === 'function') return w.openParentConversation(p.parentId);
      toast(`Parent: ${p.name || ''} ${p.phone || p.email || ''}`,'info');
    } catch(e){ toast(e.message,'error'); } finally { w.hideLoading?.(); }
  };

  // ---------- Parent analytics: load children if dashboardData is empty ----------
  const oldRenderAnalytics = w.renderAnalyticsSection;
  if (typeof oldRenderAnalytics === 'function') {
    w.renderAnalyticsSection = async function(role){
      if (role === 'parent' && (!w.dashboardData?.selectedChildId && !w.dashboardData?.children?.length)) {
        try {
          const kids = await w.api.parent.getChildren();
          const children = kids.data || [];
          w.dashboardData = { ...(w.dashboardData || {}), children, selectedChildId: children[0]?.id, selectedChild: children[0] };
        } catch(e) { console.warn('Could not preload parent children for analytics:', e.message); }
      }
      return oldRenderAnalytics(role);
    };
  }

  // ---------- Help centre: richer articles per role ----------
  const helpHTML = (role='user') => {
    const packs = {
      admin:['Create classes, streams and subject allocations','Approve teacher accounts and manage permissions','Create school-wide alerts; teachers, parents and students only view them','Set academic calendar events and terms','Use analytics to monitor marks, attendance and workload','Upload CSV students safely and check duplicate reports','Configure curriculum so grading and subjects align to the school system'],
      teacher:['Enter marks using the school curriculum grading scale','Save draft marks before class-teacher publishing','View student details, report absence and message linked parents','Create homework with instructions and due dates','Check duty status and check in/out with GPS if required','Use analytics to find weak subjects and at-risk learners','Upload marks CSV only for assigned classes/subjects'],
      parent:['Switch between linked children','View published marks, attendance and subject analytics','Read school alerts and announcements','Message teachers from the chat section','View homework and support home tasks','Understand curriculum grades such as EE/ME/AE/BE or A/B/C'],
      student:['View grades and attendance','Read alerts only; students cannot create alerts','Use learning materials based on your grade and curriculum','Track homework and home tasks','Use chat/study tools safely','Understand how your school grading scale works'],
      super_admin:['Approve and monitor schools','View national system metrics','Manage platform settings with real money disabled in this build','Audit logs, school status and usage trends']
    };
    const list = packs[role] || packs.admin;
    return `<div class="space-y-6"><div class="rounded-2xl border bg-card p-6"><p class="text-xs uppercase text-muted-foreground">Help Centre</p><h2 class="text-2xl font-bold">${esc(role.replace('_',' '))} guide</h2><p class="text-muted-foreground mt-2">Practical help for the live school operations system.</p></div><div class="grid gap-4 md:grid-cols-2">${list.map((x,i)=>`<article class="rounded-xl border bg-card p-5"><h3 class="font-bold mb-2">${i+1}. ${esc(x)}</h3><p class="text-sm text-muted-foreground">Open the related dashboard section, confirm the selected school/class/child, then complete the action. The system uses real school data and respects role permissions.</p></article>`).join('')}</div><div class="rounded-xl border bg-card p-5"><h3 class="font-bold">Need support?</h3><p class="text-sm text-muted-foreground">Check your login role, school code, selected class, and whether the feature is admin-only. Real money collection is intentionally disabled in this build.</p></div></div>`;
  };
  w.renderHelpSection = function(role){ return helpHTML(role || currentUser().role || 'admin'); };

  // ---------- Demo route: real-looking full demo with local demo data and no payments ----------
  const demoUsers = {
    admin:{ role:'admin', name:'Demo Admin', schoolCode:'DEMO-SCHOOL', email:'admin.demo@shule.ai' },
    teacher:{ role:'teacher', name:'Demo Teacher', schoolCode:'DEMO-SCHOOL', email:'teacher.demo@shule.ai', teacher:{ classTeacher:'Grade 6 North', classId:1 } },
    parent:{ role:'parent', name:'Demo Parent', schoolCode:'DEMO-SCHOOL', email:'parent.demo@shule.ai' },
    student:{ role:'student', name:'Demo Student', schoolCode:'DEMO-SCHOOL', email:'student.demo@shule.ai' }
  };
  w.openFullSystemDemo = function(){
    localStorage.setItem('SHULE_DEMO_MODE','true');
    document.body.insertAdjacentHTML('beforeend', `<div id="v17-demo-modal" class="fixed inset-0 z-[9999]"><div class="absolute inset-0 bg-black/60" onclick="this.parentElement.remove()"></div><div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl p-4"><div class="rounded-2xl border bg-card text-card-foreground p-6 shadow-2xl"><div class="flex justify-between gap-4"><div><p class="text-xs uppercase text-muted-foreground">Full system demo</p><h2 class="text-2xl font-bold">Choose a demo dashboard</h2><p class="text-sm text-muted-foreground mt-1">This uses the real dashboard shell with safe demo mode enabled. Payments remain disabled.</p></div><button onclick="document.getElementById('v17-demo-modal')?.remove()" class="text-2xl">×</button></div><div class="grid gap-3 md:grid-cols-4 mt-6">${Object.keys(demoUsers).map(r=>`<button class="rounded-xl border p-4 hover:bg-accent text-left" onclick="v17EnterDemo('${r}')"><strong class="block capitalize">${r}</strong><span class="text-xs text-muted-foreground">Open ${r} portal</span></button>`).join('')}</div></div></div></div>`);
  };
  w.v17EnterDemo = function(role){
    const u = { id:9000 + Object.keys(demoUsers).indexOf(role), ...demoUsers[role] };
    localStorage.setItem('currentUser', JSON.stringify(u));
    localStorage.setItem('authToken', localStorage.getItem('authToken') || 'demo-local-token');
    localStorage.setItem('currentSchool', JSON.stringify({ name:'Shule AI Demo School', schoolCode:'DEMO-SCHOOL', shortCode:'DEMO', system:'cbc', settings:{ schoolLevel:'primary' } }));
    document.getElementById('v17-demo-modal')?.remove();
    if (typeof w.loadDashboard === 'function') w.loadDashboard(u);
    else if (typeof w.showDashboard === 'function') w.showDashboard(role);
    else location.hash = `#demo-${role}`;
    toast(`Demo ${role} dashboard opened`, 'success');
  };
  if (location.hash === '#demo') setTimeout(w.openFullSystemDemo, 300);

  // ---------- Theme hardening for timetables, marks and mixed old panels ----------
  const css = document.createElement('style');
  css.id = 'v17-theme-hardening';
  css.textContent = `
    .dark .timetable-grid,.dark .timetable-card,.dark .timetable-cell,.dark .calendar-grid,.dark .v12-timetable,.dark .v95-marks-table,.dark .v95-section-card,.dark .v95-summary-card{background:rgb(17 24 39)!important;color:rgb(243 244 246)!important;border-color:rgb(55 65 81)!important}
    .dark .v95-marks-table th,.dark .v95-marks-table td,.dark table th,.dark table td{border-color:rgb(55 65 81)!important;color:rgb(243 244 246)}
    .dark .v95-marks-table input,.dark .v95-field input,.dark .v95-field select,.dark .v95-field textarea,.dark .timetable-grid input,.dark .timetable-grid select{background:rgb(31 41 55)!important;color:rgb(249 250 251)!important;border-color:rgb(75 85 99)!important}
    .dark .bg-white,.dark .lp-light .bg-white{background-color:rgb(17 24 39)!important;color:rgb(243 244 246)!important}
    .v95-marks-layout{display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:1rem;align-items:start}.v95-marks-panel{overflow:auto}.v95-marks-table{min-width:860px}.v95-marks-table th,.v95-marks-table td{padding:.7rem .55rem;vertical-align:middle}.v95-score-input{width:5.5rem}.v95-summary-card{position:sticky;top:0}.v17-grading-scale{overflow:hidden}
    @media(max-width:1024px){.v95-marks-layout{grid-template-columns:1fr}.v95-summary-card{position:relative}.v95-marks-table{min-width:760px}}
    [data-theme="dark"] .timetable-card,[data-theme="dark"] .timetable-cell{background:rgb(17 24 39)!important;color:rgb(243 244 246)!important;border-color:rgb(55 65 81)!important}
  `;
  document.head.appendChild(css);

  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => { if (currentUser().role === 'teacher') w.v17RefreshTeacherDutyCard?.(); }, 900);
  });
})();
