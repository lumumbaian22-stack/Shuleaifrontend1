// Shule AI v46 — Approved Simple Student/Teacher View + Edit UI
// Vanilla JS only. Overrides only student/teacher view/edit modals.
(function(){
  function esc(v){
    if (typeof escapeHtml === 'function') return escapeHtml(v ?? '');
    return String(v ?? '').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  }
  function val(id){ return document.getElementById(id)?.value?.trim() || ''; }
  function initials(name){ return typeof getInitials === 'function' ? getInitials(name || 'User') : String(name||'U').split(/\s+/).map(x=>x[0]).join('').slice(0,2).toUpperCase(); }
  function media(url){ return typeof resolveMediaUrl === 'function' ? resolveMediaUrl(url || '') : (url || ''); }
  function notify(message, type){
    if (typeof showToast === 'function') showToast(message, type || 'info');
    else console[type === 'error' ? 'error' : 'log'](message);
  }
  function showBusy(){ if (typeof showLoading === 'function') showLoading(); }
  function hideBusy(){ if (typeof hideLoading === 'function') hideLoading(); }
  function avatar(name, photo){ const src = media(photo || ''); return `<div class="approved-avatar">${src ? `<img src="${esc(src)}" alt="${esc(name)}">` : esc(initials(name))}</div>`; }
  function close(id){ document.getElementById(id)?.remove(); }
  function modal(id,title,subtitle,body,footer,wide){
    close(id);
    document.body.insertAdjacentHTML('beforeend', `<div id="${id}" class="approved-modal-overlay"><div class="approved-modal ${wide?'':'simple'}"><div class="approved-head"><div><h3 class="approved-title">${esc(title)}</h3>${subtitle?`<div class="approved-subtitle">${esc(subtitle)}</div>`:''}</div><button class="approved-close" onclick="document.getElementById('${id}')?.remove()">×</button></div><div class="approved-body">${body}</div><div class="approved-foot">${footer}</div></div></div>`);
    setTimeout(()=>{ if(window.lucide?.createIcons) lucide.createIcons(); if(window.applyGlobalProfilePictures) applyGlobalProfilePictures(); },40);
  }
  async function allTeachers(){
    const res = await api.admin.getTeachers();
    return Array.isArray(res) ? res : (res.data || res.teachers || []);
  }
  async function getTeacher(id){
    const list = await allTeachers();
    return list.find(t => String(t.id) === String(id) || String(t.teacherId) === String(id)) || null;
  }
  function teacherProfile(t){ return (t && t.duties && typeof t.duties === 'object' && !Array.isArray(t.duties)) ? (t.duties.profile || {}) : {}; }
  function teacherName(t){ return t?.User?.name || t?.name || 'Teacher'; }
  function teacherEmail(t){ return t?.User?.email || t?.email || ''; }
  function teacherPhone(t){ return t?.User?.phone || t?.phone || ''; }
  function teacherPhoto(t){ return t?.User?.profileImage || t?.User?.profilePicture || t?.profileImage || t?.profilePicture || ''; }
  function subjectsText(t){ return Array.isArray(t?.subjects) ? t.subjects.join(', ') : (t?.subjects || ''); }

  window.viewTeacherDetails = async function(id){
    try{
      showBusy();
      const t = await getTeacher(id);
      if(!t) throw new Error('Teacher not found');
      const p = teacherProfile(t), name = teacherName(t);
      const body = `<div class="approved-profile-row">${avatar(name, teacherPhoto(t))}<div><h2 class="approved-name">${esc(name)}</h2><div class="approved-meta"><span class="approved-pill">${esc(t.approvalStatus || 'active')}</span><span class="approved-pill">${esc(t.department || 'General')}</span></div></div></div><div class="approved-grid three"><div class="approved-card"><span class="approved-label">Teacher ID</span><div class="approved-value">${esc(t.employeeId || '-')}</div></div><div class="approved-card"><span class="approved-label">TSC Number</span><div class="approved-value">${esc(p.tscNumber || t.tscNumber || '-')}</div></div><div class="approved-card"><span class="approved-label">Phone</span><div class="approved-value">${esc(teacherPhone(t) || '-')}</div></div><div class="approved-card"><span class="approved-label">Email</span><div class="approved-value">${esc(teacherEmail(t) || '-')}</div></div><div class="approved-card"><span class="approved-label">Qualification</span><div class="approved-value">${esc(t.qualification || '-')}</div></div><div class="approved-card"><span class="approved-label">Specialization</span><div class="approved-value">${esc(t.specialization || subjectsText(t) || '-')}</div></div><div class="approved-card"><span class="approved-label">Subjects</span><div class="approved-value">${esc(subjectsText(t) || '-')}</div></div><div class="approved-card"><span class="approved-label">Class Teacher</span><div class="approved-value">${esc(t.classTeacher || '-')}</div></div><div class="approved-card"><span class="approved-label">Joined</span><div class="approved-value">${esc(t.dateJoined ? new Date(t.dateJoined).toLocaleDateString() : '-')}</div></div></div>`;
      modal('approved-teacher-view','View Teacher','Simple teacher profile',body,`<button class="approved-btn" onclick="document.getElementById('approved-teacher-view')?.remove()">Close</button><button class="approved-btn primary" onclick="document.getElementById('approved-teacher-view')?.remove(); editTeacher('${id}')">Edit Teacher</button>`,true);
    }catch(e){ notify(e.message || 'Could not open teacher', 'error'); } finally{ hideBusy(); }
  };

  window.editTeacher = async function(id){
    try{
      showBusy();
      const t = await getTeacher(id);
      if(!t) throw new Error('Teacher not found');
      const p = teacherProfile(t), name = teacherName(t);
      const body = `<div class="approved-profile-row">${avatar(name, teacherPhoto(t))}<div><h2 class="approved-name">Edit Teacher</h2><div class="approved-subtitle">Update basic professional information only.</div></div></div><div class="approved-form-grid"><div class="approved-field"><label>Full Name</label><input id="approved-teacher-name" value="${esc(name)}"></div><div class="approved-field"><label>Teacher ID</label><input id="approved-teacher-employee" value="${esc(t.employeeId || '')}"></div><div class="approved-field"><label>TSC Number</label><input id="approved-teacher-tsc" value="${esc(p.tscNumber || t.tscNumber || '')}"></div><div class="approved-field"><label>Phone Number</label><input id="approved-teacher-phone" value="${esc(teacherPhone(t))}"></div><div class="approved-field"><label>Email Address</label><input type="email" id="approved-teacher-email" value="${esc(teacherEmail(t))}"></div><div class="approved-field"><label>Department</label><input id="approved-teacher-department" value="${esc(t.department || '')}"></div><div class="approved-field"><label>Qualification</label><input id="approved-teacher-qualification" value="${esc(t.qualification || '')}"></div><div class="approved-field"><label>Specialization / Main Subject</label><input id="approved-teacher-specialization" value="${esc(t.specialization || '')}"></div><div class="approved-field approved-span-2"><label>Subjects Taught</label><input id="approved-teacher-subjects" value="${esc(subjectsText(t))}" placeholder="Mathematics, Science"></div><div class="approved-field"><label>Class Teacher</label><input id="approved-teacher-class-teacher" value="${esc(t.classTeacher || '')}" placeholder="Grade 6 Blue"></div><div class="approved-field"><label>Status</label><select id="approved-teacher-status"><option value="approved" ${t.approvalStatus==='approved'?'selected':''}>Active</option><option value="pending" ${t.approvalStatus==='pending'?'selected':''}>Pending</option><option value="suspended" ${t.approvalStatus==='suspended'?'selected':''}>Suspended</option><option value="rejected" ${t.approvalStatus==='rejected'?'selected':''}>Rejected</option></select></div><div class="approved-field approved-span-2"><label>Notes</label><textarea id="approved-teacher-notes">${esc(p.notes || '')}</textarea></div></div>`;
      modal('approved-teacher-edit','Edit Teacher','Simple professional details',body,`<button class="approved-btn" onclick="document.getElementById('approved-teacher-edit')?.remove()">Cancel</button><button class="approved-btn primary" onclick="approvedSaveTeacher('${id}')">Save Changes</button>`,true);
    }catch(e){ notify(e.message || 'Could not edit teacher', 'error'); } finally{ hideBusy(); }
  };

  window.approvedSaveTeacher = async function(id){
    try{
      showBusy();
      const subjects = val('approved-teacher-subjects').split(',').map(s=>s.trim()).filter(Boolean);
      await api.admin.updateTeacher(id,{ name:val('approved-teacher-name'), employeeId:val('approved-teacher-employee'), tscNumber:val('approved-teacher-tsc'), phone:val('approved-teacher-phone'), email:val('approved-teacher-email'), department:val('approved-teacher-department'), qualification:val('approved-teacher-qualification'), specialization:val('approved-teacher-specialization'), subjects, classTeacher:val('approved-teacher-class-teacher'), approvalStatus:val('approved-teacher-status'), notes:val('approved-teacher-notes') });
      close('approved-teacher-edit');
      if(window.renderAdminTeachers) await renderAdminTeachers();
      else if(window.showDashboardSection) await showDashboardSection('teachers');
      notify('Teacher updated successfully','success');
    }catch(e){ notify(e.message || 'Teacher update failed', 'error'); } finally{ hideBusy(); }
  };

  async function getStudent(id){
    const current = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
    const role = current?.role || localStorage.getItem('userRole');
    const tryTeacherStudent = async () => {
      const res = await apiRequest(`/api/teacher/students/${id}`, { cache: false });
      return res.data || res.student || res;
    };
    if (role === 'teacher') {
      try { return await tryTeacherStudent(); } catch (e) {
        const listRes = await api.teacher.getMyStudents();
        const students = listRes.data?.students || listRes.data || [];
        const found = students.find(st => String(st.id) === String(id) || String(st.studentId) === String(id));
        if (found) return found;
        throw e;
      }
    }
    if (role === 'admin' || role === 'superadmin' || role === 'super_admin') {
      try {
        if (api?.admin?.getStudentDetails) { const res = await api.admin.getStudentDetails(id); return res.data || res.student || res; }
      } catch (e) {
        // If stale role state sends a teacher through an admin-only route, fall through to safe teacher route.
        if (e.status !== 403 && !String(e.message || '').includes('Forbidden')) throw e;
        try { return await tryTeacherStudent(); } catch (_) { throw e; }
      }
    }
    if (api?.students?.getFullDetails) { const res = await api.students.getFullDetails(id); return res.data?.student || res.data || res; }
    throw new Error('Student details API missing');
  }
  function studentName(s){ return s?.User?.name || s?.name || 'Student'; }
  function studentEmail(s){ return s?.User?.email || s?.email || ''; }
  function studentPhone(s){ return s?.User?.phone || s?.phone || ''; }
  function studentPhoto(s){ return s?.User?.profileImage || s?.User?.profilePicture || s?.profileImage || s?.profilePicture || ''; }
  function pref(s){ return s?.preferences && typeof s.preferences === 'object' ? s.preferences : {}; }

  async function openStudent(id, edit){
    try{
      showBusy();
      const s = await getStudent(id), p = pref(s), name = studentName(s);
      if(edit) return renderStudentEdit(id,s,p,name);
      return renderStudentView(id,s,p,name);
    }catch(e){ notify(e.message || 'Could not open student', 'error'); } finally{ hideBusy(); }
  }
  function renderStudentView(id,s,p,name){
    const admission = s.admissionNumber || s.elimuid || '';
    const body = `<div class="approved-profile-row">${avatar(name, studentPhoto(s))}<div><h2 class="approved-name">${esc(name)}</h2><div class="approved-meta"><span class="approved-pill">${esc(s.grade || 'Class not set')}</span><span class="approved-pill">${esc(s.status || 'active')}</span></div></div></div><div class="approved-grid three"><div class="approved-card"><span class="approved-label">Admission Number</span><div class="approved-value">${esc(admission || '-')}</div></div><div class="approved-card"><span class="approved-label">Assessment Number</span><div class="approved-value">${esc(s.assessmentNumber || '-')}</div></div><div class="approved-card"><span class="approved-label">NEMIS Number</span><div class="approved-value">${esc(s.nemisNumber || '-')}</div></div><div class="approved-card"><span class="approved-label">Class / Grade</span><div class="approved-value">${esc(s.grade || '-')}</div></div><div class="approved-card"><span class="approved-label">Stream</span><div class="approved-value">${esc(p.stream || '-')}</div></div><div class="approved-card"><span class="approved-label">Gender</span><div class="approved-value">${esc(s.gender || '-')}</div></div><div class="approved-card"><span class="approved-label">Date of Birth</span><div class="approved-value">${esc(s.dateOfBirth ? String(s.dateOfBirth).slice(0,10) : '-')}</div></div><div class="approved-card"><span class="approved-label">Parent / Guardian</span><div class="approved-value">${esc(s.parentName || '-')}</div></div><div class="approved-card"><span class="approved-label">Parent Phone</span><div class="approved-value">${esc(s.parentPhone || '-')}</div></div></div>`;
    modal('approved-student-view','View Student','Simple student profile',body,`<button class="approved-btn" onclick="document.getElementById('approved-student-view')?.remove()">Close</button><button class="approved-btn primary" onclick="document.getElementById('approved-student-view')?.remove(); approvedEditStudent('${id}')">Edit Student</button>`,true);
  }
  function renderStudentEdit(id,s,p,name){
    const admission = s.admissionNumber || s.elimuid || '';
    const body = `<div class="approved-profile-row">${avatar(name, studentPhoto(s))}<div><h2 class="approved-name">Edit Student</h2><div class="approved-subtitle">Simple academic identity and guardian details.</div></div></div><div class="approved-form-grid"><div class="approved-field"><label>Full Name</label><input id="approved-student-name" value="${esc(name)}"></div><div class="approved-field"><label>Admission Number</label><input id="approved-student-admission" value="${esc(admission)}"></div><div class="approved-field"><label>Assessment Number</label><input id="approved-student-assessment" value="${esc(s.assessmentNumber || '')}"></div><div class="approved-field"><label>NEMIS Number</label><input id="approved-student-nemis" value="${esc(s.nemisNumber || '')}"></div><div class="approved-field"><label>Class / Grade</label><input id="approved-student-grade" value="${esc(s.grade || '')}"></div><div class="approved-field"><label>Stream</label><input id="approved-student-stream" value="${esc(p.stream || '')}"></div><div class="approved-field"><label>Gender</label><select id="approved-student-gender"><option value="">Select</option><option value="male" ${s.gender==='male'?'selected':''}>Male</option><option value="female" ${s.gender==='female'?'selected':''}>Female</option><option value="other" ${s.gender==='other'?'selected':''}>Other</option></select></div><div class="approved-field"><label>Date of Birth</label><input type="date" id="approved-student-dob" value="${esc(s.dateOfBirth ? String(s.dateOfBirth).slice(0,10) : '')}"></div><div class="approved-field"><label>Status</label><select id="approved-student-status"><option value="active" ${s.status==='active'?'selected':''}>Active</option><option value="inactive" ${s.status==='inactive'?'selected':''}>Inactive</option><option value="suspended" ${s.status==='suspended'?'selected':''}>Suspended</option><option value="transferred" ${s.status==='transferred'?'selected':''}>Transferred</option></select></div><div class="approved-field"><label>Parent / Guardian</label><input id="approved-student-parent" value="${esc(s.parentName || '')}"></div><div class="approved-field"><label>Parent Phone</label><input id="approved-student-parent-phone" value="${esc(s.parentPhone || '')}"></div><div class="approved-field"><label>Parent Email</label><input type="email" id="approved-student-parent-email" value="${esc(s.parentEmail || '')}"></div><div class="approved-field approved-span-2"><label>Location</label><input id="approved-student-location" value="${esc(s.location || '')}"></div></div>`;
    modal('approved-student-edit','Edit Student','Simple student information',body,`<button class="approved-btn" onclick="document.getElementById('approved-student-edit')?.remove()">Cancel</button><button class="approved-btn primary" onclick="approvedSaveStudent('${id}')">Save Changes</button>`,true);
  }
  window.approvedEditStudent = function(id){ return openStudent(id,true); };
  window.viewStudentDetails = function(id){ return openStudent(id,false); };
  window.editStudent = function(id){ return openStudent(id,true); };
  window.adminEditStudent = function(id){ return openStudent(id,true); };
  window.showUnifiedStudentModal = function(id){ return openStudent(id,false); };
  window.approvedSaveStudent = async function(id){
    try{
      showBusy();
      await api.admin.updateStudent(id,{ name:val('approved-student-name'), admissionNumber:val('approved-student-admission'), elimuid:val('approved-student-admission'), assessmentNumber:val('approved-student-assessment'), nemisNumber:val('approved-student-nemis'), grade:val('approved-student-grade'), stream:val('approved-student-stream'), gender:val('approved-student-gender'), dateOfBirth:val('approved-student-dob'), status:val('approved-student-status'), parentName:val('approved-student-parent'), parentPhone:val('approved-student-parent-phone'), parentEmail:val('approved-student-parent-email'), location:val('approved-student-location') });
      close('approved-student-edit');
      if(window.renderAdminStudents) await renderAdminStudents();
      else if(window.showDashboardSection) await showDashboardSection('students');
      notify('Student updated successfully','success');
    }catch(e){ notify(e.message || 'Student update failed', 'error'); } finally{ hideBusy(); }
  };
})();
