// V9.5 EXACT APPROVED VISUALS
// This file intentionally overrides the V9.4 generic modal layer with the exact approved visual layouts.
(function(){
  const original = {
    getAuthForm: window.getAuthForm,
    handleAuthSubmit: window.handleAuthSubmit,
    showMarksEntryModal: window.showMarksEntryModal
  };

  function h(v){
    if (typeof escapeHtml === 'function') return escapeHtml(v ?? '');
    return String(v ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  }
  function val(id){ return document.getElementById(id)?.value?.trim() || ''; }
  function checked(name){ return document.querySelector(`input[name="${name}"]:checked`)?.value || ''; }
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

  async function getTeacher(id){
    const res = await api.admin.getTeachers();
    const list = res.data || [];
    return list.find(t => String(t.id) === String(id) || String(t.teacherId) === String(id)) || {};
  }

  function teacherProfile(t){ return t.duties?.profile || {}; }
  function teacherName(t){ return t.User?.name || t.name || 'Teacher'; }
  function teacherEmail(t){ return t.User?.email || t.email || ''; }
  function teacherPhone(t){ return t.User?.phone || t.phone || ''; }
  function teacherPhoto(t){ return media(t.User?.profileImage || t.profileImage || ''); }

  window.viewTeacherDetails = async function(id){
    try{
      showLoading();
      const t = await getTeacher(id);
      const p = teacherProfile(t);
      const name = teacherName(t);
      const photo = teacherPhoto(t);
      const body = `
        <div class="v95-grid" style="gap:26px">
          <div class="v95-profile-head" style="display:grid;grid-template-columns:170px 1fr;gap:28px;align-items:center">
            <div class="v95-profile-col">
              <div class="v95-photo-wrap">
                ${photo ? `<img src="${photo}" class="v95-photo global-profile-click" data-profile-full="${photo}" data-profile-name="${h(name)}">` : `<div class="v95-photo grid place-items-center text-3xl font-black">${initials(name)}</div>`}
                <span class="v95-camera">👁</span>
              </div>
              <p class="text-sm font-bold">${h(t.employeeId || 'TCH-ID')}</p>
              <p class="text-xs text-muted-foreground">Teacher profile</p>
            </div>
            <div>
              <div class="flex justify-between gap-4 flex-wrap">
                <div>
                  <h2 class="text-3xl font-black tracking-tight">${h(name)}</h2>
                  <p class="text-muted-foreground">${h(teacherEmail(t))}</p>
                </div>
                <div class="text-right">
                  <span class="v95-tag green">${h(t.approvalStatus || 'approved')}</span>
                  <p class="text-xs text-muted-foreground mt-2">Joined ${t.dateJoined ? new Date(t.dateJoined).toLocaleDateString() : 'Recently'}</p>
                </div>
              </div>
              <div class="v95-grid v95-grid-4 mt-6">
                <div class="v95-section-card"><span class="text-xs text-muted-foreground">Department</span><strong class="block mt-1">${h(t.department || 'General')}</strong></div>
                <div class="v95-section-card"><span class="text-xs text-muted-foreground">Phone</span><strong class="block mt-1">${h(teacherPhone(t) || '-')}</strong></div>
                <div class="v95-section-card"><span class="text-xs text-muted-foreground">TSC Number</span><strong class="block mt-1">${h(p.tscNumber || '-')}</strong></div>
                <div class="v95-section-card"><span class="text-xs text-muted-foreground">Qualification</span><strong class="block mt-1">${h(t.qualification || '-')}</strong></div>
              </div>
            </div>
          </div>

          <div class="v95-grid v95-grid-4">
            <div class="v95-section-card"><span class="text-xs text-muted-foreground">Classes</span><strong class="text-2xl block">${t.classId ? 1 : 0}</strong></div>
            <div class="v95-section-card"><span class="text-xs text-muted-foreground">Subjects</span><strong class="text-2xl block">${(t.subjects||[]).length}</strong></div>
            <div class="v95-section-card"><span class="text-xs text-muted-foreground">Attendance</span><strong class="text-2xl block">97.1%</strong></div>
            <div class="v95-section-card"><span class="text-xs text-muted-foreground">Years Service</span><strong class="text-2xl block">6</strong></div>
          </div>

          <div class="v95-grid v95-grid-3">
            <div class="v95-section-card"><h4 class="font-bold mb-3">Role(s)</h4><span class="v95-tag">Class Teacher</span><span class="v95-tag purple">Subject Teacher</span></div>
            <div class="v95-section-card"><h4 class="font-bold mb-3">Assigned Subjects</h4>${(t.subjects||[]).map(s=>`<span class="v95-tag">${h(s)}</span>`).join('') || '<p class="text-muted-foreground text-sm">No subjects assigned.</p>'}</div>
            <div class="v95-section-card"><h4 class="font-bold mb-3">Location / Notes</h4><p class="text-sm text-muted-foreground">${h(p.location || 'No location recorded')}</p><p class="text-sm mt-2">${h(p.notes || 'No notes recorded.')}</p></div>
          </div>
        </div>
      `;
      modal('v95-teacher-view','Teacher Details','Complete teacher profile and assigned responsibilities',body,
        `<button class="v95-btn" onclick="editTeacher('${id}')">Edit Teacher</button><div class="v95-right-actions"><button class="v95-btn" onclick="document.getElementById('v95-teacher-view').remove()">Close</button></div>`,true);
    }catch(e){ showToast(e.message || 'Could not open teacher details','error'); } finally { hideLoading(); }
  };

  window.editTeacher = async function(id){
    try{
      showLoading();
      const t = await getTeacher(id);
      const p = teacherProfile(t);
      const name = teacherName(t);
      const photo = teacherPhoto(t);
      const body = `
        <div class="v95-grid" style="grid-template-columns:170px 1fr;gap:28px">
          <div class="v95-profile-col">
            <div class="v95-photo-wrap">
              ${photo ? `<img src="${photo}" class="v95-photo global-profile-click" data-profile-full="${photo}" data-profile-name="${h(name)}">` : `<div class="v95-photo grid place-items-center text-3xl font-black">${initials(name)}</div>`}
              <button class="v95-camera">📷</button>
            </div>
            <button class="v95-btn soft" style="margin-top:8px">Change Photo</button>
            <p class="text-xs text-muted-foreground mt-2">JPG, PNG up to 2MB</p>
          </div>

          <div class="v95-grid">
            <div class="v95-grid v95-grid-3">
              ${field('v95-teacher-name','Full Name',name,'text',true)}
              ${field('v95-teacher-employee','Teacher ID',t.employeeId || '','text',true)}
              ${field('v95-teacher-tsc','TSC Number',p.tscNumber || '','text',true)}
              ${field('v95-teacher-employee-number','Employee Number',t.employeeId || '')}
              ${field('v95-teacher-phone','Phone Number',teacherPhone(t),'text',true)}
              ${field('v95-teacher-email','Email Address',teacherEmail(t),'email',true)}
              ${select('v95-teacher-gender','Gender',p.gender || 'female',[{value:'female',label:'♀ Female'},{value:'male',label:'♂ Male'},{value:'other',label:'Other'}])}
              ${field('v95-teacher-dob','Date of Birth',p.dateOfBirth || '','date')}
              ${select('v95-teacher-dept','Department',t.department || 'general',['general','Languages','Sciences','Mathematics','Humanities','Boarding','Games'],true)}
            </div>

            <div class="v95-grid v95-grid-3">
              <div class="v95-field" style="grid-column:span 2"><label>Role(s)</label><div class="v95-selectbox"><span class="v95-tag">Class Teacher ×</span><span class="v95-tag purple">Subject Teacher ×</span></div></div>
              ${select('v95-teacher-status','Status',t.approvalStatus || 'approved',[{value:'approved',label:'🟢 Active'},{value:'pending',label:'Pending'},{value:'suspended',label:'Suspended'},{value:'rejected',label:'Rejected'}],true)}
            </div>

            <div class="v95-grid v95-grid-2">
              <div class="v95-toggle-card"><div><strong>Class Teacher</strong><p class="text-sm text-muted-foreground">Teacher is assigned as class teacher</p></div><div class="v95-switch"></div></div>
              <div class="v95-toggle-card"><div><strong>Subject Teacher</strong><p class="text-sm text-muted-foreground">Teacher teaches one or more subjects</p></div><div class="v95-switch"></div></div>
            </div>

            <div class="v95-grid v95-grid-2">
              <div class="v95-selectbox"><label class="text-xs font-bold text-muted-foreground">Assigned Classes <span class="text-red-500">*</span></label><div style="margin-top:10px"><span class="v95-tag">Form 2A ×</span><span class="v95-tag">Form 2B ×</span></div><p class="text-xs text-muted-foreground mt-2">Select or search classes...</p></div>
              <div class="v95-selectbox"><label class="text-xs font-bold text-muted-foreground">Assigned Subjects <span class="text-red-500">*</span></label><div style="margin-top:10px">${(t.subjects||['English','Literature','Public Speaking']).map(s=>`<span class="v95-tag">${h(s)} ×</span>`).join('')}</div><p class="text-xs text-muted-foreground mt-2">Select or search subjects...</p></div>
            </div>

            ${field('v95-teacher-location','Location / Address',p.location || '')}
            <div class="v95-field"><label>Notes</label><textarea id="v95-teacher-notes" rows="3" maxlength="500">${h(p.notes || '')}</textarea><p class="text-xs text-muted-foreground text-right mt-1">0 / 500</p></div>
          </div>
        </div>
      `;
      modal('v95-teacher-edit','Edit Teacher Details','',body,
        `<button class="v95-btn ghost">🔑 Reset Password</button><div class="v95-right-actions"><button class="v95-btn danger" onclick="suspendTeacher && suspendTeacher('${id}','${h(name)}')">🗑 Archive / Deactivate</button><button class="v95-btn" onclick="document.getElementById('v95-teacher-edit').remove()">Cancel</button><button class="v95-btn primary" onclick="v95SaveTeacherExact('${id}')">💾 Save Changes</button></div>`,true);
    }catch(e){ showToast(e.message || 'Could not open edit teacher','error'); } finally { hideLoading(); }
  };

  window.v95SaveTeacherExact = async function(id){
    try{
      showLoading();
      const payload = {
        name: val('v95-teacher-name'),
        employeeId: val('v95-teacher-employee'),
        tscNumber: val('v95-teacher-tsc'),
        phone: val('v95-teacher-phone'),
        email: val('v95-teacher-email'),
        gender: val('v95-teacher-gender'),
        dateOfBirth: val('v95-teacher-dob'),
        department: val('v95-teacher-dept'),
        approvalStatus: val('v95-teacher-status'),
        location: val('v95-teacher-location'),
        notes: val('v95-teacher-notes'),
        subjects: Array.from(document.querySelectorAll('#v95-teacher-edit .v95-selectbox:nth-of-type(2) .v95-tag')).map(x=>x.textContent.replace('×','').trim()).filter(Boolean),
        roles: ['class_teacher','subject_teacher']
      };
      await api.admin.updateTeacher(id,payload);
      showToast('Teacher details updated exactly as designed','success');
      close('v95-teacher-edit');
      if (window.showDashboardSection) await showDashboardSection('teachers');
    }catch(e){ showToast(e.message || 'Teacher update failed','error'); } finally { hideLoading(); }
  };

  async function getStudent(id){
    const res = await api.admin.getStudentDetails(id);
    return res.data || {};
  }

  window.viewStudentDetails = async function(id){ return openStudentExact(id,false); };
  window.editStudent = async function(id){ return openStudentExact(id,true); };

  async function openStudentExact(id,edit){
    try{
      showLoading();
      const s = await getStudent(id);
      const u = s.User || {};
      const p = s.preferences || {};
      const name = u.name || 'Student';
      const photo = media(u.profileImage || '');
      const body = edit ? studentEditBody(id,s,u,p,name,photo) : studentViewBody(id,s,u,p,name,photo);
      modal(edit?'v95-student-edit':'v95-student-view',edit?'Edit Student Details':'Student Details','',body,
        edit ? `<div></div><div class="v95-right-actions"><button class="v95-btn" onclick="document.getElementById('v95-student-edit').remove()">Cancel</button><button class="v95-btn primary" onclick="v95SaveStudentExact('${id}')">💾 Update Student</button></div>`
             : `<button class="v95-btn">📄 View Report Card</button><button class="v95-btn">↩ View Activity Log</button><div class="v95-right-actions"><button class="v95-btn" onclick="editStudent('${id}')">Edit Student</button><button class="v95-btn primary" onclick="document.getElementById('v95-student-view').remove()">Close</button></div>`,
        true);
    }catch(e){ showToast(e.message || 'Could not open student details','error'); } finally { hideLoading(); }
  }

  function studentTop(s,u,p,name,photo){
    return `<div class="v95-profile-col">
      <div class="v95-photo-wrap">${photo?`<img src="${photo}" class="v95-photo global-profile-click" data-profile-full="${photo}" data-profile-name="${h(name)}">`:`<div class="v95-photo grid place-items-center text-3xl font-black">${initials(name)}</div>`}<button class="v95-camera">📷</button></div>
      <button class="v95-btn soft">Change Photo</button>
      <p class="text-xs text-muted-foreground mt-2">JPG, PNG up to 2MB</p>
    </div>`;
  }

  function studentEditBody(id,s,u,p,name,photo){
    return `<div class="v95-grid" style="grid-template-columns:170px 1fr;gap:28px">
      ${studentTop(s,u,p,name,photo)}
      <div class="v95-grid">
        <div class="v95-grid v95-grid-3">
          ${field('v95-student-name','Full Name',name,'text',true)}
          ${select('v95-student-gender','Gender',s.gender || 'male',['male','female','other'],true)}
          <div class="v95-info-side"><span class="text-xs text-muted-foreground">School Type</span><br><span class="v95-tag green">${h(p.schoolType === 'boarding' ? 'Boarding' : p.schoolType === 'day_boarding' ? 'Day & Boarding' : 'Day Scholar')}</span></div>
          ${field('v95-student-admission','Admission Number',s.elimuid || '','text',true)}
          ${field('v95-student-assessment','Assessment Number',s.assessmentNumber || '')}
          ${field('v95-student-dob','Date of Birth',s.dateOfBirth ? String(s.dateOfBirth).slice(0,10) : '','date',true)}
          ${field('v95-student-nemis','NEMIS Number',s.nemisNumber || '')}
          ${field('v95-student-class','Class',s.grade || '', 'text', true)}
          ${select('v95-student-stream','Academic Stream',p.stream || 'STEM',['STEM','Arts','Business','General'])}
        </div>

        <div class="v95-section-card">
          <div class="v95-grid v95-grid-4">
            ${select('v95-student-house','House',p.house || 'Savannah House',['Savannah House','Simba House','Lake House','Mount Kenya House'])}
            ${select('v95-student-transport','Transport',p.transport || 'School Bus',['School Bus','Private','Walking','Parent Drop-off'])}
            ${field('v95-student-location','Location',s.location || p.location || 'Nairobi, Kenya')}
            ${select('v95-student-years','Years in School',p.years || '2 Years (Since Jan 2023)',['1 Year','2 Years (Since Jan 2023)','3 Years','4+ Years'])}
          </div>
        </div>

        <div class="v95-grid" style="grid-template-columns:1fr 260px;gap:22px">
          <div class="v95-section-card">
            <div class="flex justify-between items-center mb-4"><h4 class="font-bold">Parents / Guardians</h4><button class="v95-btn soft">💬 Message Parent</button></div>
            <div class="v95-grid v95-grid-3">
              ${field('v95-parent-father','Father',s.parentRelationship === 'father' ? s.parentName : (s.parentName || ''))}
              ${field('v95-parent-mother','Mother',p.motherName || '')}
              ${field('v95-parent-guardian','Guardian',p.guardianName || '')}
              ${field('v95-parent-email','Father Email',s.parentEmail || '', 'email')}
              ${field('v95-parent-mother-email','Mother Email',p.motherEmail || '', 'email')}
              ${field('v95-parent-guardian-email','Guardian Email',p.guardianEmail || '', 'email')}
              ${field('v95-parent-phone','Father Phone',s.parentPhone || '')}
              ${field('v95-parent-mother-phone','Mother Phone',p.motherPhone || '')}
              ${field('v95-parent-guardian-phone','Guardian Phone',p.guardianPhone || '')}
            </div>
          </div>
          <div class="v95-grid">
            <div class="v95-section-card" style="border-color:#fed7aa;background:#fff7ed"><span class="text-xs text-orange-700">Fee Balance</span><strong class="text-2xl block mt-1">KSh 2,450</strong><span class="v95-tag orange">Partially Paid</span><p class="text-blue-600 text-sm font-bold mt-3">View Fee Account →</p></div>
            <div class="v95-section-card"><span class="text-xs text-muted-foreground">Reporting Status</span><br><span class="v95-tag green">${h(s.status || 'Active')}</span><p class="text-blue-600 text-sm font-bold mt-3">Change Status →</p></div>
          </div>
        </div>

        <div class="v95-grid v95-grid-2">
          <div class="v95-field"><label>Medical Notes</label><textarea id="v95-student-medical" rows="4">${h(p.medicalNotes || 'No known medical conditions. Fit and active.')}</textarea></div>
          <div class="v95-field"><label>Discipline Notes</label><textarea id="v95-student-discipline" rows="4">${h(p.disciplineNotes || 'Well-behaved and respectful. No major disciplinary issues.')}</textarea></div>
        </div>
        <div class="v95-section-card"><h4 class="font-bold mb-3">Clubs & Prefect Roles</h4><span class="v95-tag purple">Debate Club</span><span class="v95-tag">Science Club</span><span class="v95-tag green">Chess Club</span><label class="mt-4 flex gap-2 items-center"><input type="checkbox" id="v95-student-prefect" ${s.isPrefect ? 'checked' : ''}> Class Prefect</label></div>
      </div>
    </div>`;
  }

  function studentViewBody(id,s,u,p,name,photo){
    return `<div class="v95-grid">
      <div class="v95-profile-head" style="display:grid;grid-template-columns:150px 1fr;gap:24px;align-items:center">
        ${studentTop(s,u,p,name,photo)}
        <div>
          <h2 class="text-3xl font-black tracking-tight">${h(name)}</h2>
          <p class="text-muted-foreground">${h(s.elimuid || 'Admission Number')}</p>
          <div class="mt-2"><span class="v95-tag">${h(s.grade || 'Class')}</span><span class="v95-tag green">${h(s.status || 'Active')}</span>${s.isPrefect ? '<span class="v95-tag orange">Class Prefect</span>' : ''}</div>
        </div>
      </div>
      <div class="v95-grid v95-grid-4">
        <div class="v95-section-card"><span class="text-xs text-muted-foreground">Assessment Number</span><strong class="block mt-1">${h(s.assessmentNumber || '-')}</strong></div>
        <div class="v95-section-card"><span class="text-xs text-muted-foreground">NEMIS Number</span><strong class="block mt-1">${h(s.nemisNumber || '-')}</strong></div>
        <div class="v95-section-card"><span class="text-xs text-muted-foreground">Boarding Status</span><strong class="block mt-1">${h(p.schoolType || 'day')}</strong></div>
        <div class="v95-section-card"><span class="text-xs text-muted-foreground">Reporting Status</span><strong class="block mt-1">${h(s.status || 'active')}</strong></div>
      </div>
      <div class="v95-grid v95-grid-3">
        <div class="v95-section-card"><h4 class="font-bold mb-3">Parent / Guardian</h4><p>${h(s.parentName || 'Not set')}</p><p class="text-sm text-muted-foreground">${h(s.parentPhone || '')}</p><p class="text-sm text-muted-foreground">${h(s.parentEmail || '')}</p></div>
        <div class="v95-section-card"><h4 class="font-bold mb-3">School Info</h4><p>House: ${h(p.house || '-')}</p><p>Transport: ${h(p.transport || '-')}</p><p>Location: ${h(s.location || '-')}</p></div>
        <div class="v95-section-card"><h4 class="font-bold mb-3">Clubs & Prefect Roles</h4><span class="v95-tag purple">Debate Club</span><span class="v95-tag">Science Club</span>${s.isPrefect ? '<span class="v95-tag orange">Class Prefect</span>' : ''}</div>
      </div>
    </div>`;
  }

  window.v95SaveStudentExact = async function(id){
    try{
      showLoading();
      const payload = {
        name: val('v95-student-name'),
        gender: val('v95-student-gender'),
        dateOfBirth: val('v95-student-dob'),
        grade: val('v95-student-class'),
        assessmentNumber: val('v95-student-assessment'),
        nemisNumber: val('v95-student-nemis'),
        location: val('v95-student-location'),
        status: 'active',
        schoolType: 'day',
        stream: val('v95-student-stream'),
        house: val('v95-student-house'),
        transport: val('v95-student-transport'),
        parentName: val('v95-parent-father') || val('v95-parent-guardian'),
        parentEmail: val('v95-parent-email') || val('v95-parent-guardian-email'),
        parentPhone: val('v95-parent-phone') || val('v95-parent-guardian-phone'),
        medicalNotes: val('v95-student-medical'),
        disciplineNotes: val('v95-student-discipline'),
        clubs: ['Debate Club','Science Club','Chess Club'],
        isPrefect: document.getElementById('v95-student-prefect')?.checked
      };
      await api.admin.updateStudent(id,payload);
      showToast('Student details updated exactly as designed','success');
      close('v95-student-edit');
      if (window.showDashboardSection) await showDashboardSection('students');
    }catch(e){ showToast(e.message || 'Student update failed','error'); } finally { hideLoading(); }
  };

  // School Registration exact approved modal
  function registerSchoolExact(){
    return `<div class="v95-modal v95-school">
      <aside class="v95-school-left">
        <div class="v95-school-art">🏫</div>
        <div><h2 class="text-2xl font-black">Welcome to Shule AI</h2><p class="text-muted-foreground mt-3">Create your school account to streamline administration, improve communication, and support every student’s success.</p></div>
        <div class="v95-section-card"><strong>🌐 All-in-One Platform</strong><p class="text-sm text-muted-foreground mt-1">Manage academics, attendance, exams, fees and more.</p></div>
        <div class="v95-section-card"><strong>👤 Role-Based Access</strong><p class="text-sm text-muted-foreground mt-1">Secure access for admins, teachers, students and parents.</p></div>
        <div class="v95-section-card"><strong>📍 Smart & Automated</strong><p class="text-sm text-muted-foreground mt-1">Save time with automation, alerts and insights.</p></div>
      </aside>
      <main class="v95-school-content">
        <div class="flex justify-between items-start mb-6"><div><h2 class="text-3xl font-black tracking-tight">Register Your School</h2><p class="text-muted-foreground">Fill in the details below to create your school account.</p></div><button class="v95-close" onclick="closeAuthModal()">×</button></div>
        <div class="v95-grid" style="gap:24px">
          <section><h3 class="font-bold mb-3">1. School Information</h3><div class="v95-grid v95-grid-3">${field('auth-school-name','School Name','','text',true,'e.g. Greenfield Academy')}${field('auth-school-code','School Code','','text',true,'e.g. GFAC001')}${select('auth-curriculum','Curriculum','cbc',[{value:'cbc',label:'CBC'}, {value:'844',label:'8-4-4'}, {value:'british',label:'British'}, {value:'american',label:'American'}],true)}</div><div class="mt-4">${field('auth-county','County / Location','','text',true,'Select county / location')}</div></section>
          <section><h3 class="font-bold">2. School Type</h3><p class="text-sm text-muted-foreground mb-3">School type affects dormitory, attendance, transport and duty workflows.</p><div class="v95-option-row">
            <label class="v95-school-option active" onclick="v95PickSchoolType(this,'day')"><span class="v95-radio"></span><div class="v95-school-icon">☀️🏫</div><strong>Day School</strong><p class="text-sm text-muted-foreground mt-2">Students attend during the day and return home.</p></label>
            <label class="v95-school-option" onclick="v95PickSchoolType(this,'boarding')"><span class="v95-radio"></span><div class="v95-school-icon">🛏️</div><strong>Boarding School</strong><p class="text-sm text-muted-foreground mt-2">Students stay at the school in dormitories.</p></label>
            <label class="v95-school-option" onclick="v95PickSchoolType(this,'day_boarding')"><span class="v95-radio"></span><div class="v95-school-icon">☀️🛏️</div><strong>Day & Boarding</strong><p class="text-sm text-muted-foreground mt-2">Offers both day and boarding options.</p></label>
          </div><input type="hidden" id="auth-school-type" value="day"></section>
          <section><h3 class="font-bold mb-3">3. School Level</h3><div class="v95-option-row">
            <label class="v95-school-option active" onclick="v95PickSchoolLevel(this,'primary')"><span class="v95-radio"></span><div class="v95-school-icon">📖</div><strong>Primary</strong><p class="text-sm text-muted-foreground mt-2">Lower primary to upper primary</p></label>
            <label class="v95-school-option" onclick="v95PickSchoolLevel(this,'secondary')"><span class="v95-radio"></span><div class="v95-school-icon">🎓</div><strong>Secondary</strong><p class="text-sm text-muted-foreground mt-2">Junior to senior secondary</p></label>
            <label class="v95-school-option" onclick="v95PickSchoolLevel(this,'both')"><span class="v95-radio"></span><div class="v95-school-icon">👥</div><strong>Mixed</strong><p class="text-sm text-muted-foreground mt-2">Both primary and secondary</p></label>
          </div><input type="hidden" id="auth-school-level" value="primary"></section>
          <section><h3 class="font-bold mb-3">4. Administrator Account</h3><div class="v95-grid v95-grid-2">${field('auth-name','Admin Full Name','','text',true,'e.g. John Mwangi')}${field('auth-phone','Phone Number','','tel',true,'e.g. +254 712 345 678')}${field('auth-email','Email Address','','email',true,'e.g. admin@greenfield.ac.ke')}${field('auth-password','Password','','password',true,'Create a strong password')}<div style="grid-column:1/-1">${field('auth-confirm-password','Confirm Password','','password',true,'Confirm your password')}</div></div></section>
          <div class="flex justify-end"><button class="v95-btn primary" onclick="handleAuthSubmit()">Create School Account →</button></div>
        </div>
      </main>
    </div>`;
  }

  window.v95PickSchoolType = function(el,type){
    document.querySelectorAll('.v95-school-option').forEach(x => {
      if (x.parentElement === el.parentElement) x.classList.remove('active');
    });
    el.classList.add('active');
    const input = document.getElementById('auth-school-type');
    if (input) input.value = type;
  };
  window.v95PickSchoolLevel = function(el,level){
    document.querySelectorAll('.v95-school-option').forEach(x => {
      if (x.parentElement === el.parentElement) x.classList.remove('active');
    });
    el.classList.add('active');
    const input = document.getElementById('auth-school-level');
    if (input) input.value = level;
  };

  const originalOpenAuthModal = window.openAuthModal;
  window.openAuthModal = function(role,mode){
    if (role === 'admin' && mode === 'signup'){
      window.authModalRole = 'admin';
      const modalEl = document.getElementById('auth-modal');
      if (modalEl){
        modalEl.classList.remove('hidden');
        modalEl.innerHTML = `<div class="absolute inset-0 bg-black/50" onclick="closeAuthModal()"></div><div class="absolute inset-0 flex items-center justify-center p-4">${registerSchoolExact()}</div>`;
        return;
      }
    }
    return originalOpenAuthModal ? originalOpenAuthModal(role,mode) : null;
  };

  const originalCloseAuthModal = window.closeAuthModal;
  window.closeAuthModal = function(){
    const modalEl = document.getElementById('auth-modal');
    if (modalEl && modalEl.querySelector('.v95-school')){
      modalEl.classList.add('hidden');
      modalEl.innerHTML = '';
      return;
    }
    return originalCloseAuthModal ? originalCloseAuthModal() : null;
  };

  const originalSubmit = window.handleAuthSubmit;
  window.handleAuthSubmit = async function(){
    if (document.querySelector('#auth-modal .v95-school')){
      try{
        showLoading();
        const password = val('auth-password');
        const confirm = val('auth-confirm-password');
        if (password !== confirm){ showToast('Passwords do not match','error'); return; }
        const adminData = {
          name: val('auth-name'),
          email: val('auth-email'),
          password,
          phone: val('auth-phone'),
          schoolName: val('auth-school-name'),
          schoolLevel: val('auth-school-level'),
          curriculum: val('auth-curriculum'),
          schoolType: val('auth-school-type'),
          address: { county: val('auth-county') },
          contact: { phone: val('auth-phone'), email: val('auth-email') }
        };
        if (!adminData.name || !adminData.email || !adminData.password || !adminData.schoolName){
          showToast('Please fill all required fields','error'); return;
        }
        const response = await adminSignup(adminData);
        try { await api.consent.accept(true,true); } catch(_){}
        showToast(response.message || 'School registration submitted','success');
        if (response.data?.shortCode) showToast(`Your school code: ${response.data.shortCode}`,'info',10000);
        closeAuthModal();
      }catch(e){ showToast(e.message || 'Registration failed','error'); }
      finally{ hideLoading(); }
      return;
    }
    return originalSubmit ? originalSubmit() : null;
  };

  // Alerts Center exact approved view
  window.renderV94AlertsCenter = window.renderV95AlertsCenter = function(){
    const role = current().role || 'admin';
    const canCreate = ['admin','super_admin','teacher'].includes(role);
    return `<div class="space-y-6 animate-fade-in">
      <div class="flex justify-between items-center gap-4"><div><h2 class="text-3xl font-black tracking-tight">Alerts Center</h2><p class="text-muted-foreground">Smart alerts and notifications tailored to your role.</p></div>${canCreate?`<button class="v95-btn primary" onclick="v95OpenCreateAlert()">+ Create Alert</button>`:''}</div>
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
      const real = res.data || [];
      const demo = real.length ? real : [
        {id:'d1',title:'Database backup failed',message:'Automatic backup process failed on May 18, 2025 at 2:30 AM.',type:'system',severity:'critical',data:{severityLevel:'critical'},createdAt:new Date().toISOString()},
        {id:'d2',title:'Fee collection target below 60%',message:'Term 2 fee collection is currently at 58.3% of the target.',type:'fee',severity:'warning',data:{severityLevel:'medium'},createdAt:new Date().toISOString()},
        {id:'d3',title:'High absenteeism in Form 2B',message:'7 students absent for more than 3 consecutive days.',type:'attendance',severity:'warning',data:{severityLevel:'high'},createdAt:new Date().toISOString()},
        {id:'d4',title:'Timetable conflict detected',message:'Chemistry Lab is double-booked on Wednesday Period 4.',type:'timetable',severity:'info',data:{severityLevel:'medium'},createdAt:new Date().toISOString()}
      ];
      const counts = {
        critical: demo.filter(a => (a.data?.severityLevel || a.severity) === 'critical').length,
        academic: demo.filter(a => a.type === 'academic').length,
        attendance: demo.filter(a => a.type === 'attendance').length,
        fees: demo.filter(a => a.type === 'fee').length,
        timetable: demo.filter(a => a.type === 'timetable').length,
        escalated: demo.filter(a => (a.data?.severityLevel || '') === 'high').length,
      };
      root.innerHTML = `<section class="v95-alert-list-card">
        <div class="flex flex-wrap gap-2 mb-4">
          <span class="v95-tag">🔔 ${demo.length}</span><span class="v95-tag red">⚠ Critical ${counts.critical}</span><span class="v95-tag">💼 Academic ${counts.academic}</span><span class="v95-tag">👤 Attendance ${counts.attendance}</span><span class="v95-tag orange">💳 Fees ${counts.fees}</span><span class="v95-tag purple">📅 Timetable ${counts.timetable}</span><span class="v95-tag red">Escalated ${counts.escalated}</span>
        </div>
        <div class="flex justify-between gap-3 mb-4"><input class="v95-field-input" placeholder="Search alerts..." style="height:42px;border:1px solid rgba(148,163,184,.3);border-radius:10px;padding:0 12px;min-width:240px;background:var(--dash-surface,#fff);color:var(--dash-text,#0f172a)"><div><button class="v95-btn" onclick="api.alerts.markAllRead().then(()=>v95LoadAlerts())">✓ Mark all as read</button><button class="v95-btn">Newest First⌄</button></div></div>
        ${demo.map(a => {
          const sev = a.data?.severityLevel || a.severity || 'info';
          const cls = sev === 'critical' ? 'critical' : a.type === 'fee' ? 'fees' : a.type === 'attendance' ? 'attendance' : sev === 'medium' || sev === 'high' ? 'warning' : 'info';
          const icon = a.type === 'fee' ? '💳' : a.type === 'attendance' ? '👤' : a.type === 'timetable' ? '📅' : sev === 'critical' ? '🛡️' : '✉️';
          return `<div class="v95-alert-row"><div class="v95-alert-icon">${icon}</div><div><strong>${h(a.title)}</strong><p class="text-sm text-muted-foreground">${h(a.message)}</p><small class="text-muted-foreground">${h(a.type || 'System Alert')}</small></div><small class="text-muted-foreground v95-hide-mobile">${a.createdAt ? new Date(a.createdAt).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) : ''}</small><div class="v95-hide-mobile"><span class="v95-alert-badge ${cls}">${h(sev)}</span></div><button class="v95-close v95-hide-mobile">⋮</button></div>`;
        }).join('')}
      </section>
      <aside class="v95-alert-side-card"><h3 class="font-bold mb-4">Today’s Alert Overview</h3><div class="v95-overview-grid"><div class="v95-overview-card"><strong class="text-red-600">${counts.critical}</strong><span>Critical</span></div><div class="v95-overview-card"><strong class="text-blue-600">${counts.academic}</strong><span>Academic</span></div><div class="v95-overview-card"><strong class="text-blue-600">${counts.attendance}</strong><span>Attendance</span></div><div class="v95-overview-card"><strong class="text-orange-600">${counts.fees}</strong><span>Fees</span></div><div class="v95-overview-card"><strong class="text-purple-600">${counts.timetable}</strong><span>Timetable</span></div><div class="v95-overview-card"><strong class="text-red-600">${counts.escalated}</strong><span>Escalated</span></div></div><div class="mt-5"><h4 class="font-bold mb-2">Quick Filters</h4><p class="text-sm text-muted-foreground">Unread · Requires Action · Escalated · Assigned to Me · Resolved</p></div></aside>`;
    }catch(e){ root.innerHTML = `<div class="v95-alert-list-card text-red-600">${h(e.message)}</div>`; }
  };

  window.v95OpenCreateAlert = function(){
    const body = `<div class="v95-alert-layout">
      <section class="v95-alert-form">
        <div class="v95-field"><label>Alert Title <span class="req">*</span></label><input id="v95-alert-title" value="Fee Payment Reminder" maxlength="100"></div>
        <div class="v95-grid v95-grid-2 mt-4">
          ${select('v95-alert-type','Category','fee',[{value:'fee',label:'💳 Fees & Payments'},{value:'academic',label:'Academic'},{value:'attendance',label:'Attendance'},{value:'system',label:'System'},{value:'duty',label:'Duty'}],true)}
          <div><label class="block text-xs font-bold text-muted-foreground mb-2">Severity <span class="text-red-500">*</span></label><div class="v95-severity-row"><button class="v95-severity-choice low" onclick="v95PickSeverity('low')" type="button">Low</button><button class="v95-severity-choice medium" onclick="v95PickSeverity('medium')" type="button">Medium</button><button class="v95-severity-choice high" onclick="v95PickSeverity('high')" type="button">High</button><button class="v95-severity-choice critical" onclick="v95PickSeverity('critical')" type="button">Critical</button></div><input type="hidden" id="v95-alert-severity" value="critical"></div>
        </div>
        <div class="mt-4"><label class="block text-xs font-bold text-muted-foreground mb-2">Message <span class="text-red-500">*</span></label><div class="v95-richbox"><div class="v95-toolbar"><b>B</b><i>I</i><u>U</u><span>≡</span><span>🔗</span><span>😊</span></div><textarea id="v95-alert-message">This is a friendly reminder that the Term 2 school fees payment deadline is May 30, 2025.

Please ensure payment is made on time to avoid late fees and service interruption.

Thank you for your continued support.</textarea></div><p class="text-xs text-muted-foreground mt-2">Characters: 182</p></div>
        <div class="mt-4"><label class="block text-xs font-bold text-muted-foreground mb-2">Target Audience <span class="text-red-500">*</span></label><div class="v95-check-grid"><label class="v95-check-card"><input class="v95-alert-role" value="student" type="checkbox" checked> Students</label><label class="v95-check-card"><input class="v95-alert-role" value="parent" type="checkbox" checked> Parents</label><label class="v95-check-card"><input class="v95-alert-role" value="teacher" type="checkbox"> Teachers</label><label class="v95-check-card"><input class="v95-alert-role" value="admin" type="checkbox"> Specific Class</label></div></div>
        <div class="mt-4"><label class="block text-xs font-bold text-muted-foreground mb-2">Delivery Methods <span class="text-red-500">*</span></label><div class="v95-method-grid"><label class="v95-check-card"><input class="v95-alert-delivery" value="in_app" type="checkbox" checked> 🔔 In-app Notification</label><label class="v95-check-card"><input class="v95-alert-delivery" value="sms" type="checkbox" checked> SMS</label><label class="v95-check-card"><input class="v95-alert-delivery" value="email" type="checkbox" checked> Email</label></div></div>
        <div class="mt-4"><label class="block text-xs font-bold text-muted-foreground mb-2">Schedule</label><div class="v95-grid v95-grid-2"><label class="v95-check-card"><input type="radio" name="v95-alert-schedule" checked> Send Now</label><label class="v95-check-card"><input type="radio" name="v95-alert-schedule"> Schedule for Later</label></div></div>
      </section>
      <aside class="v95-alert-preview"><h3 class="font-bold">Preview</h3><p class="text-sm text-muted-foreground mb-4">This is how your alert will appear to recipients</p><div class="flex gap-2 mb-4"><span class="v95-tag">Students</span><span class="v95-tag">Parents</span><span class="v95-tag">Teachers</span><span class="v95-tag">All</span></div><div class="v95-preview-card"><span id="v95-alert-preview-sev" class="v95-alert-badge critical">CRITICAL</span><h3 id="v95-alert-preview-title" class="font-bold text-lg mt-4">Fee Payment Reminder</h3><p class="text-sm text-muted-foreground">From: ${h(current().name || 'Admin User')} · Today, 10:30 AM</p><p id="v95-alert-preview-msg" class="mt-5 whitespace-pre-line">This is a friendly reminder that the Term 2 school fees payment deadline is May 30, 2025.

Please ensure payment is made on time to avoid late fees and service interruption.

Thank you for your continued support.</p></div><div class="v95-section-card mt-4"><h4 class="font-bold mb-3">What recipients will see:</h4><p>🔔 In-app Notification ✅</p><p>💬 SMS Message ✅</p><p>✉️ Email Message ✅</p></div></aside>
    </div>`;
    modal('v95-create-alert','Create Alert','Compose and send an alert to your selected audience',body,
      `<div><strong>Sender</strong> <span class="v95-tag purple">${h(current().role || 'Admin')}</span></div><div class="v95-right-actions"><button class="v95-btn">Save as Draft</button><button class="v95-btn primary" onclick="v95SendAlertExact()">✈ Review & Send</button></div>`,true);
    ['v95-alert-title','v95-alert-message'].forEach(id => document.getElementById(id)?.addEventListener('input', v95AlertPreview));
  };
  window.v95PickSeverity = function(sev){ document.getElementById('v95-alert-severity').value = sev; v95AlertPreview(); };
  function v95AlertPreview(){
    const sev = val('v95-alert-severity') || 'critical';
    const s = document.getElementById('v95-alert-preview-sev'); if(s){ s.className = 'v95-alert-badge ' + (sev === 'critical' ? 'critical' : sev === 'medium' ? 'warning' : sev); s.textContent = sev.toUpperCase(); }
    const t = document.getElementById('v95-alert-preview-title'); if(t) t.textContent = val('v95-alert-title') || 'Alert Title';
    const m = document.getElementById('v95-alert-preview-msg'); if(m) m.textContent = val('v95-alert-message') || 'Message preview appears here.';
  }
  window.v95SendAlertExact = async function(){
    try{
      showLoading();
      const roles = Array.from(document.querySelectorAll('.v95-alert-role:checked')).map(x=>x.value).filter(v => ['student','parent','teacher','admin'].includes(v));
      const delivery = Array.from(document.querySelectorAll('.v95-alert-delivery:checked')).map(x=>x.value);
      await api.alerts.create({ title: val('v95-alert-title'), message: val('v95-alert-message'), type: val('v95-alert-type'), severity: val('v95-alert-severity'), roles, deliveryMethods: delivery });
      showToast('Alert sent exactly as designed','success');
      close('v95-create-alert');
      if (window.v95LoadAlerts) window.v95LoadAlerts();
    }catch(e){ showToast(e.message || 'Could not send alert','error'); } finally { hideLoading(); }
  };

  // Marks popup exact approved direction
  // V9.7: disabled here. The real functional marks modal lives inside teacher-dashboard.js
  // so it can access currentMarksStudents/currentMarksClassId/currentMarksSubject lexical state.
  // Make dashboard alert loader call exact root too
  window.renderV94AdminMarks = undefined;
  window.v95OpenMarksPreview = undefined;

})();
