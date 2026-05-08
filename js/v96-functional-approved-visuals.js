// V9.6 FUNCTIONAL APPROVED VISUALS
// Fixes V9.5 static/mock overlays while keeping the approved visual design.
// - No admin marks entry
// - Real alerts only
// - Real student details across admin/teacher/unified flows
// - Teacher marks popup keeps real teacher marks workflow and IDs
(function(){
  function h(v){
    if (typeof escapeHtml === 'function') return escapeHtml(v ?? '');
    return String(v ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  }
  function val(id){ return document.getElementById(id)?.value?.trim() || ''; }
  function current(){ try { return typeof getCurrentUser === 'function' ? getCurrentUser() : JSON.parse(localStorage.getItem('user')||'{}'); } catch { return {}; } }
  function initials(name){ return typeof getInitials === 'function' ? getInitials(name || 'User') : String(name||'U').split(/\s+/).map(x=>x[0]).join('').slice(0,2).toUpperCase(); }
  function media(url){ return typeof resolveMediaUrl === 'function' ? resolveMediaUrl(url || '') : (url || ''); }
  function close(id){ document.getElementById(id)?.remove(); }
  function mount(id, html){
    document.getElementById(id)?.remove();
    document.body.insertAdjacentHTML('beforeend', html);
    setTimeout(() => {
      if (window.lucide?.createIcons) lucide.createIcons();
      if (window.applyGlobalProfilePictures) applyGlobalProfilePictures();
    }, 50);
  }
  function field(id,label,value='',type='text',req=false,placeholder=''){
    return `<div class="v95-field"><label>${h(label)} ${req?'<span class="req">*</span>':''}</label><input id="${id}" type="${type}" value="${h(value)}" placeholder="${h(placeholder)}"></div>`;
  }
  function select(id,label,value='',opts=[],req=false){
    return `<div class="v95-field"><label>${h(label)} ${req?'<span class="req">*</span>':''}</label><select id="${id}">${opts.map(o => {
      const ov = typeof o === 'object' ? o.value : o;
      const ol = typeof o === 'object' ? o.label : o;
      return `<option value="${h(ov)}" ${String(ov) === String(value) ? 'selected' : ''}>${h(ol)}</option>`;
    }).join('')}</select></div>`;
  }
  function modal(id,title,subtitle,body,footer,wide=false){
    mount(id, `<div class="v95-overlay"><div class="v95-modal ${wide?'v95-wide':''}">
      <div class="v95-modal-head"><div><div class="v95-title">${title}</div>${subtitle?`<div class="v95-subtitle">${subtitle}</div>`:''}</div><button class="v95-close" onclick="document.getElementById('${id}').remove()">×</button></div>
      <div class="v95-modal-body">${body}</div>
      <div class="v95-modal-foot">${footer}</div>
    </div></div>`);
  }

  // ========= Remove admin enter-marks functionality =========
  window.renderV94AdminMarks = undefined;
  window.v94OpenStandaloneMarks = undefined;
  window.v95OpenMarksPreview = undefined;

  // ========= Real role-aware student data =========
  async function fetchStudentReal(studentId, fallbackStudent=null){
    const user = current();
    if (fallbackStudent) return normalizeStudent(fallbackStudent);

    if ((user.role === 'admin' || user.role === 'super_admin') && api.admin?.getStudentDetails) {
      const res = await api.admin.getStudentDetails(studentId);
      return normalizeStudent(res.data || res);
    }

    if (api.students?.getFullDetails) {
      try {
        const res = await api.students.getFullDetails(studentId);
        return normalizeStudent(res.data || res);
      } catch(_) {}
    }

    if (typeof loadMyStudents === 'function') {
      const data = await loadMyStudents();
      const students = data.students || data.data || data || [];
      const student = Array.isArray(students) ? students.find(s => String(s.id) === String(studentId)) : null;
      if (student) return normalizeStudent(student);
    }

    if (window.dashboardData) {
      const pools = [dashboardData.students, dashboardData.children, dashboardData.myStudents, dashboardData.classStudents].filter(Array.isArray);
      for (const pool of pools) {
        const student = pool.find(s => String(s.id) === String(studentId));
        if (student) return normalizeStudent(student);
      }
    }

    throw new Error('Student details not found from the available dashboard data.');
  }

  function normalizeStudent(s){
    if (!s) return {};
    const u = s.User || s.user || {};
    return {
      ...s,
      User: {
        id: u.id || s.userId || s.id,
        name: u.name || s.name || s.fullName || 'Student',
        email: u.email || s.email || '',
        phone: u.phone || s.phone || '',
        profileImage: u.profileImage || s.profileImage || ''
      },
      preferences: s.preferences || s.studentPreferences || {},
      parents: s.parents || [],
      subjectScores: s.subjectScores || s.scores || {},
      analytics: s.analytics || null
    };
  }

  function studentPhoto(s){ return media(s.User?.profileImage || s.profileImage || ''); }
  function studentName(s){ return s.User?.name || s.name || 'Student'; }
  function feeBalance(s){
    const p = s.paymentStatus || {};
    return p.balance ?? p.balanceDue ?? s.feeBalance ?? s.balance ?? null;
  }
  function valueOrDash(v){ return (v !== undefined && v !== null && v !== '') ? h(v) : '-'; }

  function studentTop(s){
    const name = studentName(s);
    const photo = studentPhoto(s);
    return `<div class="v95-profile-col">
      <div class="v95-photo-wrap">${photo?`<img src="${photo}" class="v95-photo global-profile-click" data-profile-full="${photo}" data-profile-name="${h(name)}">`:`<div class="v95-photo grid place-items-center text-3xl font-black">${initials(name)}</div>`}<button class="v95-camera">👁</button></div>
      <p class="text-sm font-bold">${h(s.elimuid || s.admissionNumber || 'Admission No')}</p>
      <p class="text-xs text-muted-foreground">Student profile</p>
    </div>`;
  }

  function studentViewBody(s){
    const p = s.preferences || {};
    const name = studentName(s);
    const clubs = Array.isArray(p.clubs) ? p.clubs : [];
    const balance = feeBalance(s);
    const subjectRows = Object.entries(s.subjectScores || {}).slice(0,5).map(([sub,score]) =>
      `<div class="flex justify-between py-2 border-b last:border-b-0"><span>${h(sub)}</span><strong>${score ?? '-'}</strong></div>`
    ).join('');

    return `<div class="v95-grid">
      <div class="v95-profile-head" style="display:grid;grid-template-columns:150px 1fr;gap:24px;align-items:center">
        ${studentTop(s)}
        <div>
          <h2 class="text-3xl font-black tracking-tight">${h(name)}</h2>
          <p class="text-muted-foreground">${h(s.elimuid || s.admissionNumber || '')}</p>
          <div class="mt-2"><span class="v95-tag">${h(s.grade || 'Class not assigned')}</span><span class="v95-tag green">${h(s.status || 'active')}</span>${s.isPrefect ? '<span class="v95-tag orange">Class Prefect</span>' : ''}</div>
        </div>
      </div>

      <div class="v95-grid v95-grid-4">
        <div class="v95-section-card"><span class="text-xs text-muted-foreground">Assessment Number</span><strong class="block mt-1">${valueOrDash(s.assessmentNumber)}</strong></div>
        <div class="v95-section-card"><span class="text-xs text-muted-foreground">NEMIS Number</span><strong class="block mt-1">${valueOrDash(s.nemisNumber)}</strong></div>
        <div class="v95-section-card"><span class="text-xs text-muted-foreground">School Type</span><strong class="block mt-1">${h(p.schoolType || 'day')}</strong></div>
        <div class="v95-section-card"><span class="text-xs text-muted-foreground">Academic Status</span><strong class="block mt-1">${h(s.academicStatus || '-')}</strong></div>
      </div>

      <div class="v95-grid v95-grid-3">
        <div class="v95-section-card"><h4 class="font-bold mb-3">Parent / Guardian</h4><p>${valueOrDash(s.parentName || s.parents?.[0]?.name)}</p><p class="text-sm text-muted-foreground">${valueOrDash(s.parentPhone || s.parents?.[0]?.phone)}</p><p class="text-sm text-muted-foreground">${valueOrDash(s.parentEmail || s.parents?.[0]?.email)}</p></div>
        <div class="v95-section-card"><h4 class="font-bold mb-3">School Info</h4><p>House: ${valueOrDash(p.house)}</p><p>Transport: ${valueOrDash(p.transport)}</p><p>Location: ${valueOrDash(s.location || p.location)}</p></div>
        <div class="v95-section-card"><h4 class="font-bold mb-3">Fee / Payment</h4><strong class="text-2xl">${balance === null ? 'Not recorded' : `KSh ${Number(balance).toLocaleString()}`}</strong><p class="text-sm text-muted-foreground">${h(s.subscriptionStatus || s.paymentStatus?.status || '')}</p></div>
      </div>

      <div class="v95-grid v95-grid-3">
        <div class="v95-section-card"><h4 class="font-bold mb-3">Recent Scores</h4>${subjectRows || '<p class="text-sm text-muted-foreground">No scores recorded yet.</p>'}</div>
        <div class="v95-section-card"><h4 class="font-bold mb-3">Medical Notes</h4><p class="text-sm text-muted-foreground">${valueOrDash(p.medicalNotes)}</p></div>
        <div class="v95-section-card"><h4 class="font-bold mb-3">Clubs & Roles</h4>${clubs.length ? clubs.map(c=>`<span class="v95-tag">${h(c)}</span>`).join('') : '<p class="text-sm text-muted-foreground">No clubs recorded.</p>'}${s.isPrefect ? '<span class="v95-tag orange">Prefect</span>' : ''}</div>
      </div>
    </div>`;
  }

  function studentEditBody(s){
    const p = s.preferences || {};
    const name = studentName(s);
    const clubs = Array.isArray(p.clubs) ? p.clubs.join(', ') : (p.clubs || '');
    return `<div class="v95-grid" style="grid-template-columns:170px 1fr;gap:28px">
      ${studentTop(s)}
      <div class="v95-grid">
        <div class="v95-grid v95-grid-3">
          ${field('v96-student-name','Full Name',name,'text',true)}
          ${select('v96-student-gender','Gender',s.gender || '',[{value:'',label:'Select'},{value:'male',label:'Male'},{value:'female',label:'Female'},{value:'other',label:'Other'}])}
          ${select('v96-student-school-type','School Type',p.schoolType || 'day',[{value:'day',label:'Day Scholar'},{value:'boarding',label:'Boarding'},{value:'day_boarding',label:'Day & Boarding'}])}
          ${field('v96-student-admission','Admission / ELIMUID',s.elimuid || s.admissionNumber || '', 'text', true)}
          ${field('v96-student-assessment','Assessment Number',s.assessmentNumber || '')}
          ${field('v96-student-dob','Date of Birth',s.dateOfBirth ? String(s.dateOfBirth).slice(0,10) : '','date')}
          ${field('v96-student-nemis','NEMIS Number',s.nemisNumber || '')}
          ${field('v96-student-class','Class',s.grade || '', 'text', true)}
          ${select('v96-student-status','Status',s.status || 'active',['active','inactive','graduated','transferred'])}
        </div>

        <div class="v95-section-card">
          <div class="v95-grid v95-grid-4">
            ${field('v96-student-house','House',p.house || '')}
            ${field('v96-student-transport','Transport',p.transport || '')}
            ${field('v96-student-location','Location',s.location || p.location || '')}
            ${field('v96-student-stream','Stream',p.stream || '')}
          </div>
        </div>

        <div class="v95-section-card">
          <div class="flex justify-between items-center mb-4"><h4 class="font-bold">Parent / Guardian Details</h4></div>
          <div class="v95-grid v95-grid-3">
            ${field('v96-parent-name','Parent / Guardian Name',s.parentName || s.parents?.[0]?.name || '')}
            ${field('v96-parent-email','Parent Email',s.parentEmail || s.parents?.[0]?.email || '', 'email')}
            ${field('v96-parent-phone','Parent Phone',s.parentPhone || s.parents?.[0]?.phone || '')}
          </div>
        </div>

        <div class="v95-grid v95-grid-2">
          <div class="v95-field"><label>Medical Notes</label><textarea id="v96-student-medical" rows="4">${h(p.medicalNotes || '')}</textarea></div>
          <div class="v95-field"><label>Discipline Notes</label><textarea id="v96-student-discipline" rows="4">${h(p.disciplineNotes || '')}</textarea></div>
        </div>
        <div class="v95-section-card"><h4 class="font-bold mb-3">Clubs & Prefect Roles</h4>${field('v96-student-clubs','Clubs / Roles',clubs)}<label class="mt-4 flex gap-2 items-center"><input type="checkbox" id="v96-student-prefect" ${s.isPrefect ? 'checked' : ''}> Student is a prefect</label></div>
      </div>
    </div>`;
  }

  async function openStudentModal(studentId, edit=false, fallbackStudent=null){
    try{
      showLoading();
      const s = await fetchStudentReal(studentId, fallbackStudent);
      const body = edit ? studentEditBody(s) : studentViewBody(s);
      modal(edit?'v96-student-edit':'v96-student-view', edit?'Edit Student Details':'Student Details', 'Live student information from the system, not mock data.', body,
        edit
          ? `<div></div><div class="v95-right-actions"><button class="v95-btn" onclick="document.getElementById('v96-student-edit').remove()">Cancel</button><button class="v95-btn primary" onclick="v96SaveStudent('${s.id}')">Update Student</button></div>`
          : `<button class="v95-btn" onclick="openStudentModal('${s.id}', true)">Edit Student</button><div class="v95-right-actions"><button class="v95-btn primary" onclick="document.getElementById('v96-student-view').remove()">Close</button></div>`,
        true);
    }catch(e){
      showToast(e.message || 'Could not open student details', 'error');
    }finally{ hideLoading(); }
  }

  window.openStudentModal = openStudentModal;
  window.viewStudentDetails = function(studentId){ return openStudentModal(studentId, false); };
  window.adminViewStudentDetails = function(studentId){ return openStudentModal(studentId, false); };
  window.adminEditStudent = function(studentId){ return openStudentModal(studentId, true); };
  window.editStudent = function(studentId){ return openStudentModal(studentId, true); };
  window.showUnifiedStudentModal = function(studentId){ return openStudentModal(studentId, false); };
  window.showStudentDetailsModal = function(student){ return openStudentModal(student.id, false, student); };
  window.adminShowStudentDetailsModal = function(student){ return openStudentModal(student.id, false, student); };
  window.showStudentDetailModalFromStudent = function(student){ return openStudentModal(student.id, false, student); };

  window.v96SaveStudent = async function(id){
    try{
      showLoading();
      const payload = {
        name: val('v96-student-name'),
        gender: val('v96-student-gender'),
        dateOfBirth: val('v96-student-dob'),
        grade: val('v96-student-class'),
        assessmentNumber: val('v96-student-assessment'),
        nemisNumber: val('v96-student-nemis'),
        location: val('v96-student-location'),
        status: val('v96-student-status'),
        schoolType: val('v96-student-school-type'),
        stream: val('v96-student-stream'),
        house: val('v96-student-house'),
        transport: val('v96-student-transport'),
        parentName: val('v96-parent-name'),
        parentEmail: val('v96-parent-email'),
        parentPhone: val('v96-parent-phone'),
        medicalNotes: val('v96-student-medical'),
        disciplineNotes: val('v96-student-discipline'),
        clubs: val('v96-student-clubs'),
        isPrefect: document.getElementById('v96-student-prefect')?.checked || false
      };

      if (api.admin?.updateStudent && ['admin','super_admin'].includes(current().role)) {
        await api.admin.updateStudent(id, payload);
        showToast('Student details updated', 'success');
      } else {
        showToast('Only admin can edit student master details.', 'warning');
      }

      close('v96-student-edit');
      if (window.showDashboardSection && ['admin','super_admin'].includes(current().role)) await showDashboardSection('students');
    }catch(e){ showToast(e.message || 'Student update failed', 'error'); }
    finally{ hideLoading(); }
  };

  // ========= Real alerts only: no demo fallback =========
  window.renderV94AlertsCenter = window.renderV95AlertsCenter = function(){
    const role = current().role || 'admin';
    const canCreate = ['admin','super_admin','teacher'].includes(role);
    return `<div class="space-y-6 animate-fade-in">
      <div class="flex justify-between items-center gap-4"><div><h2 class="text-3xl font-black tracking-tight">Alerts Center</h2><p class="text-muted-foreground">Real alerts from your backend, filtered by your role.</p></div>${canCreate?`<button class="v95-btn primary" onclick="v95OpenCreateAlert()">+ Create Alert</button>`:''}</div>
      <div class="v95-role-tabs">
        <div class="v95-role-card ${role==='admin'||role==='super_admin'?'active':''}"><div class="v95-alert-icon">🛡️</div><div><strong>Admin View</strong><p class="text-sm text-muted-foreground">System-wide alerts</p></div></div>
        <div class="v95-role-card ${role==='teacher'?'active':''}"><div class="v95-alert-icon">👤</div><div><strong>Teacher View</strong><p class="text-sm text-muted-foreground">Class & academic alerts</p></div></div>
        <div class="v95-role-card ${role==='parent'?'active':''}"><div class="v95-alert-icon">👪</div><div><strong>Parent View</strong><p class="text-sm text-muted-foreground">Student progress updates</p></div></div>
        <div class="v95-role-card ${role==='student'?'active':''}"><div class="v95-alert-icon">🎓</div><div><strong>Student View</strong><p class="text-sm text-muted-foreground">Personal reminders</p></div></div>
      </div>
      <div id="v95-alert-root" class="v95-alert-center-layout"><div class="v95-alert-list-card">Loading alerts...</div></div>
    </div>`;
  };

  window.v94LoadAlerts = window.v95LoadAlerts = async function(){
    const root = document.getElementById('v95-alert-root') || document.getElementById('v94-alerts-root');
    if (!root) return;
    try{
      const res = await api.alerts.getMine();
      const alerts = res.data || [];
      const counts = {
        critical: alerts.filter(a => (a.data?.severityLevel || a.severity) === 'critical').length,
        academic: alerts.filter(a => a.type === 'academic').length,
        attendance: alerts.filter(a => a.type === 'attendance').length,
        fees: alerts.filter(a => a.type === 'fee').length,
        timetable: alerts.filter(a => a.type === 'timetable').length,
        escalated: alerts.filter(a => ['high','critical'].includes(a.data?.severityLevel || '')).length,
      };
      root.innerHTML = `<section class="v95-alert-list-card">
        <div class="flex flex-wrap gap-2 mb-4">
          <span class="v95-tag">🔔 ${alerts.length}</span><span class="v95-tag red">⚠ Critical ${counts.critical}</span><span class="v95-tag">💼 Academic ${counts.academic}</span><span class="v95-tag">👤 Attendance ${counts.attendance}</span><span class="v95-tag orange">💳 Fees ${counts.fees}</span><span class="v95-tag purple">📅 Timetable ${counts.timetable}</span><span class="v95-tag red">Escalated ${counts.escalated}</span>
        </div>
        <div class="flex justify-between gap-3 mb-4"><input placeholder="Search alerts..." style="height:42px;border:1px solid rgba(148,163,184,.3);border-radius:10px;padding:0 12px;min-width:240px;background:var(--dash-surface,#fff);color:var(--dash-text,#0f172a)"><div><button class="v95-btn" onclick="api.alerts.markAllRead().then(()=>v95LoadAlerts())">✓ Mark all as read</button></div></div>
        ${alerts.length ? alerts.map(a => {
          const sev = a.data?.severityLevel || a.severity || 'info';
          const cls = sev === 'critical' ? 'critical' : a.type === 'fee' ? 'fees' : a.type === 'attendance' ? 'attendance' : sev === 'medium' || sev === 'high' ? 'warning' : 'info';
          const icon = a.type === 'fee' ? '💳' : a.type === 'attendance' ? '👤' : a.type === 'timetable' ? '📅' : sev === 'critical' ? '🛡️' : '✉️';
          return `<div class="v95-alert-row"><div class="v95-alert-icon">${icon}</div><div><strong>${h(a.title)}</strong><p class="text-sm text-muted-foreground">${h(a.message)}</p><small class="text-muted-foreground">${h(a.type || 'System Alert')}</small></div><small class="text-muted-foreground v95-hide-mobile">${a.createdAt ? new Date(a.createdAt).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) : ''}</small><div class="v95-hide-mobile"><span class="v95-alert-badge ${cls}">${h(sev)}</span></div><button class="v95-close v95-hide-mobile" onclick="api.alerts.markRead('${a.id}').then(()=>v95LoadAlerts())">✓</button></div>`;
        }).join('') : '<div class="text-center py-16 text-muted-foreground">No alerts found for your role yet.</div>'}
      </section>
      <aside class="v95-alert-side-card"><h3 class="font-bold mb-4">Today’s Alert Overview</h3><div class="v95-overview-grid"><div class="v95-overview-card"><strong class="text-red-600">${counts.critical}</strong><span>Critical</span></div><div class="v95-overview-card"><strong class="text-blue-600">${counts.academic}</strong><span>Academic</span></div><div class="v95-overview-card"><strong class="text-blue-600">${counts.attendance}</strong><span>Attendance</span></div><div class="v95-overview-card"><strong class="text-orange-600">${counts.fees}</strong><span>Fees</span></div><div class="v95-overview-card"><strong class="text-purple-600">${counts.timetable}</strong><span>Timetable</span></div><div class="v95-overview-card"><strong class="text-red-600">${counts.escalated}</strong><span>Escalated</span></div></div></aside>`;
    }catch(e){ root.innerHTML = `<div class="v95-alert-list-card text-red-600">${h(e.message)}</div>`; }
  };

  // ========= Functional marks entry =========
  // V9.7: intentionally does not override showMarksEntryModal from this external file.
  // The working modal is patched directly inside teacher-dashboard.js.

})();
