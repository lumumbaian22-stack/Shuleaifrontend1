// V9.4 Premium Modals, Alerts Center, School Type, Marks Entry
(function(){
  function h(v){ return typeof escapeHtml === 'function' ? escapeHtml(v ?? '') : String(v ?? '').replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;' }[m])); }
  function current(){ try{return getCurrentUser ? getCurrentUser() : JSON.parse(localStorage.getItem('user')||'{}')}catch{return {}} }
  function media(url){ return typeof resolveMediaUrl === 'function' ? resolveMediaUrl(url) : (url || ''); }
  function initials(name){ return typeof getInitials === 'function' ? getInitials(name||'User') : String(name||'U').split(' ').map(x=>x[0]).join('').slice(0,2).toUpperCase(); }
  function modal(id,title,body,foot='',wide=false){
    document.getElementById(id)?.remove();
    const html=`<div id="${id}" class="v94-modal-backdrop"><div class="v94-modal ${wide?'wide':''}">
      <div class="v94-modal-head"><h3 class="text-xl font-bold">${title}</h3><button class="v94-x" onclick="document.getElementById('${id}').remove()">✕</button></div>
      <div class="v94-modal-body">${body}</div>
      <div class="v94-modal-foot">${foot || `<button class="v94-btn primary" onclick="document.getElementById('${id}').remove()">Close</button>`}</div>
    </div></div>`;
    document.body.insertAdjacentHTML('beforeend', html);
    setTimeout(()=>{ if(window.lucide?.createIcons) lucide.createIcons(); if(window.applyGlobalProfilePictures) applyGlobalProfilePictures(); },50);
  }
  async function loadTeacher(id){
    const list=(await api.admin.getTeachers()).data||[];
    return list.find(t=>String(t.id)===String(id) || String(t.teacherId)===String(id)) || {};
  }
  function teacherName(t){return t.User?.name || t.name || 'Teacher'}
  function teacherPhoto(t){return media(t.User?.profileImage || t.profileImage || '')}
  window.viewTeacherDetails = async function(id){
    try{
      showLoading();
      const t=await loadTeacher(id); const u=t.User||t; const name=teacherName(t); const photo=teacherPhoto(t); const prof=t.duties?.profile||{};
      const body=`<div class="space-y-6">
        <div class="v94-profile-head">
          <div class="v94-photo-wrap">${photo?`<img src="${photo}" class="v94-photo global-profile-click" data-profile-full="${photo}" data-profile-name="${h(name)}">`:`<div class="v94-photo grid place-items-center text-3xl font-black">${initials(name)}</div>`}<span class="absolute right-1 bottom-2 h-5 w-5 rounded-full bg-green-500 border-4 border-white"></span></div>
          <div class="grid gap-4 md:grid-cols-[1fr_1fr]">
            <div><h2 class="text-2xl font-black">${h(name)}</h2><p class="text-muted-foreground">${h(t.employeeId||'TCH-ID')}</p><div class="flex gap-2 mt-2 flex-wrap"><span class="v94-pill">Class Teacher</span><span class="v94-pill">Subject Teacher</span></div></div>
            <div class="grid gap-2 text-sm">
              <div><strong>Department:</strong> ${h(t.department||'General')}</div><div><strong>Phone:</strong> ${h(u.phone||'-')}</div><div><strong>Email:</strong> ${h(u.email||'-')}</div><div><strong>TSC:</strong> ${h(prof.tscNumber||'-')}</div><div><strong>Status:</strong> <span class="v94-pill green">${h(t.approvalStatus||'active')}</span></div>
            </div>
          </div>
        </div>
        <div class="v94-grid cols-4"><div class="v94-stat"><span>Attendance</span><strong>96.4%</strong></div><div class="v94-stat"><span>Classes</span><strong>${t.classId?1:0}</strong></div><div class="v94-stat"><span>Subjects</span><strong>${(t.subjects||[]).length}</strong></div><div class="v94-stat"><span>Rating</span><strong>4.7/5</strong></div></div>
        <div class="v94-grid cols-3">
          <div class="v94-card"><h4 class="font-bold mb-3">Assigned Classes</h4><span class="v94-pill">Class ${h(t.classTeacher||t.classId||'Unassigned')}</span></div>
          <div class="v94-card"><h4 class="font-bold mb-3">Assigned Subjects</h4><div class="flex flex-wrap gap-2">${(t.subjects||[]).map(s=>`<span class="v94-pill">${h(s)}</span>`).join('')||'<span class="text-muted-foreground">No subjects</span>'}</div></div>
          <div class="v94-card"><h4 class="font-bold mb-3">Recent Activity</h4><p class="text-sm text-muted-foreground">Marked attendance, updated marks, uploaded lesson plan.</p></div>
        </div>
      </div>`;
      modal('v94-teacher-details','Teacher Details',body,`<button class="v94-btn" onclick="editTeacher('${id}')">Edit Profile</button><button class="v94-btn" onclick="showDashboardSection('timetable')">View Timetable</button><button class="v94-btn primary" onclick="document.getElementById('v94-teacher-details').remove()">Close</button>`,true);
    }catch(e){showToast(e.message||'Failed to view teacher','error')}finally{hideLoading();}
  };
  window.editTeacher = async function(id){
    try{
      showLoading(); const t=await loadTeacher(id); const u=t.User||t; const name=teacherName(t); const photo=teacherPhoto(t); const prof=t.duties?.profile||{};
      const body=`<div class="space-y-6">
        <div class="grid gap-6 md:grid-cols-[170px_1fr]">
          <div class="text-center"><div class="v94-photo-wrap mx-auto">${photo?`<img src="${photo}" class="v94-photo global-profile-click" data-profile-full="${photo}">`:`<div class="v94-photo grid place-items-center text-3xl font-black">${initials(name)}</div>`}<button class="v94-photo-btn">📷</button></div><p class="text-xs text-muted-foreground mt-3">Click image to view full photo.</p></div>
          <div class="v94-grid cols-3">
            ${field('teacher-name','Full Name',name)}${field('teacher-employee','Teacher ID',t.employeeId||'')}${field('teacher-tsc','TSC Number',prof.tscNumber||'')}
            ${field('teacher-phone','Phone Number',u.phone||'')}${field('teacher-email','Email Address',u.email||'')}${select('teacher-dept','Department',t.department||'general',['general','Languages','Sciences','Mathematics','Humanities','Boarding','Games'])}
            ${select('teacher-status','Status',t.approvalStatus||'approved',['approved','pending','suspended','rejected'])}${field('teacher-location','Location / Address',prof.location||'')}${field('teacher-qualification','Qualification',t.qualification||'')}
          </div>
        </div>
        <div class="v94-grid cols-2"><div class="v94-card"><h4 class="font-bold">Role(s)</h4><label><input type="checkbox" id="teacher-class-role" checked> Class Teacher</label><br><label><input type="checkbox" id="teacher-subject-role" checked> Subject Teacher</label></div><div class="v94-card"><h4 class="font-bold">Subjects</h4><input id="teacher-subjects" class="w-full rounded-lg border p-2" value="${h((t.subjects||[]).join(', '))}" placeholder="English, Literature"></div></div>
        <div class="v94-field"><label>Notes</label><textarea id="teacher-notes" rows="3">${h(prof.notes||'')}</textarea></div>
      </div>`;
      modal('v94-teacher-edit','Edit Teacher Details',body,`<button class="v94-btn danger" onclick="suspendTeacher && suspendTeacher('${id}','${h(name)}')">Archive / Deactivate</button><button class="v94-btn" onclick="document.getElementById('v94-teacher-edit').remove()">Cancel</button><button class="v94-btn primary" onclick="v94SaveTeacher('${id}')">Save Changes</button>`,true);
    }catch(e){showToast(e.message||'Failed to edit teacher','error')}finally{hideLoading();}
  };
  window.v94SaveTeacher = async function(id){
    try{showLoading(); const payload={name:val('teacher-name'),employeeId:val('teacher-employee'),tscNumber:val('teacher-tsc'),phone:val('teacher-phone'),email:val('teacher-email'),department:val('teacher-dept'),approvalStatus:val('teacher-status'),location:val('teacher-location'),qualification:val('teacher-qualification'),subjects:val('teacher-subjects').split(',').map(x=>x.trim()).filter(Boolean),notes:val('teacher-notes'),roles:[document.getElementById('teacher-class-role')?.checked?'class_teacher':null,document.getElementById('teacher-subject-role')?.checked?'subject_teacher':null].filter(Boolean)}; await api.admin.updateTeacher(id,payload); showToast('Teacher updated','success'); document.getElementById('v94-teacher-edit')?.remove(); if(window.showDashboardSection) await showDashboardSection('teachers');}catch(e){showToast(e.message||'Teacher update failed','error')}finally{hideLoading();}}
  window.viewStudentDetails = async function(id){ return v94StudentModal(id,false); };
  window.editStudent = async function(id){ return v94StudentModal(id,true); };
  async function v94StudentModal(id,edit){
    try{showLoading(); const res=await api.admin.getStudentDetails(id); const s=res.data||{}; const u=s.User||{}; const name=u.name||'Student'; const photo=media(u.profileImage||''); const pref=s.preferences||{};
      const body= edit ? studentEditBody(s,u,pref,photo,name) : studentViewBody(s,u,pref,photo,name);
      modal(edit?'v94-student-edit':'v94-student-view',edit?'Edit Student Details':'Student Details',body,edit?`<button class="v94-btn" onclick="document.getElementById('v94-student-edit').remove()">Cancel</button><button class="v94-btn primary" onclick="v94SaveStudent('${id}')">Update Student</button>`:`<button class="v94-btn" onclick="editStudent('${id}')">Edit Student</button><button class="v94-btn" onclick="showDashboardSection('analytics')">View Report Card</button><button class="v94-btn primary" onclick="document.getElementById('v94-student-view').remove()">Close</button>`,true);
    }catch(e){showToast(e.message||'Failed to load student','error')}finally{hideLoading();}
  }
  function studentViewBody(s,u,p,photo,name){return `<div class="space-y-6"><div class="v94-profile-head"><div>${photo?`<img src="${photo}" class="v94-photo global-profile-click" data-profile-full="${photo}" data-profile-name="${h(name)}">`:`<div class="v94-photo grid place-items-center text-3xl font-black">${initials(name)}</div>`}</div><div><h2 class="text-2xl font-black">${h(name)}</h2><p class="text-muted-foreground">${h(s.elimuid||'')}</p><div class="flex gap-2 mt-2 flex-wrap"><span class="v94-pill">${h(s.grade||'Class')}</span>${s.isPrefect?'<span class="v94-pill orange">Class Prefect</span>':''}<span class="v94-pill green">${h(s.status||'Active')}</span></div></div></div><div class="v94-grid cols-4"><div class="v94-stat"><span>Attendance</span><strong>95.6%</strong></div><div class="v94-stat"><span>Average</span><strong>78.4%</strong></div><div class="v94-stat"><span>Assessment No.</span><strong>${h(s.assessmentNumber||'-')}</strong></div><div class="v94-stat"><span>NEMIS</span><strong>${h(s.nemisNumber||'-')}</strong></div></div><div class="v94-grid cols-3"><div class="v94-card"><h4 class="font-bold">Parent / Guardian</h4><p>${h(s.parentName||'Not set')}</p><p class="text-sm text-muted-foreground">${h(s.parentPhone||'')}</p><p class="text-sm text-muted-foreground">${h(s.parentEmail||'')}</p></div><div class="v94-card"><h4 class="font-bold">School Info</h4><p>House: ${h(p.house||'-')}</p><p>Transport: ${h(p.transport||'-')}</p><p>School type: ${h(p.schoolType||'day')}</p></div><div class="v94-card"><h4 class="font-bold">Clubs & Roles</h4><p>${h((p.clubs||[]).join(', ')||'No clubs')}</p></div></div></div>`}
  function studentEditBody(s,u,p,photo,name){return `<div class="space-y-6"><div class="grid gap-6 md:grid-cols-[170px_1fr]"><div class="text-center">${photo?`<img src="${photo}" class="v94-photo global-profile-click" data-profile-full="${photo}">`:`<div class="v94-photo grid place-items-center text-3xl font-black">${initials(name)}</div>`}<p class="text-xs text-muted-foreground mt-3">Change photo from profile upload.</p></div><div class="v94-grid cols-3">${field('student-name','Full Name',name)}${select('student-gender','Gender',s.gender||'', ['','male','female','other'])}${field('student-dob','Date of Birth',s.dateOfBirth?String(s.dateOfBirth).slice(0,10):'','date')}${field('student-grade','Class',s.grade||'')}${field('student-assessment','Assessment Number',s.assessmentNumber||'')}${field('student-nemis','NEMIS Number',s.nemisNumber||'')}${field('student-location','Location',s.location||'')}${select('student-status','Status',s.status||'active',['active','inactive','graduated','transferred'])}${select('student-school-type','Boarding Status',p.schoolType||'day',['day','boarding','day_boarding'])}</div></div><div class="v94-grid cols-3">${field('student-parent-name','Parent / Guardian Name',s.parentName||'')}${field('student-parent-email','Parent Email',s.parentEmail||'')}${field('student-parent-phone','Parent Phone',s.parentPhone||'')}${field('student-house','House',p.house||'')}${field('student-transport','Transport',p.transport||'')}${field('student-clubs','Clubs / Roles',(p.clubs||[]).join(', '))}</div><div class="v94-grid cols-2"><div class="v94-field"><label>Medical Notes</label><textarea id="student-medical" rows="3">${h(p.medicalNotes||'')}</textarea></div><div class="v94-field"><label>Discipline Notes</label><textarea id="student-discipline" rows="3">${h(p.disciplineNotes||'')}</textarea></div></div><label class="flex gap-2 items-center"><input type="checkbox" id="student-prefect" ${s.isPrefect?'checked':''}> Student is a prefect</label></div>`}
  window.v94SaveStudent = async function(id){try{showLoading(); const payload={name:val('student-name'),gender:val('student-gender'),dateOfBirth:val('student-dob'),grade:val('student-grade'),assessmentNumber:val('student-assessment'),nemisNumber:val('student-nemis'),location:val('student-location'),status:val('student-status'),schoolType:val('student-school-type'),parentName:val('student-parent-name'),parentEmail:val('student-parent-email'),parentPhone:val('student-parent-phone'),house:val('student-house'),transport:val('student-transport'),clubs:val('student-clubs'),medicalNotes:val('student-medical'),disciplineNotes:val('student-discipline'),isPrefect:document.getElementById('student-prefect')?.checked}; await api.admin.updateStudent(id,payload); showToast('Student updated','success'); document.getElementById('v94-student-edit')?.remove(); if(window.showDashboardSection) await showDashboardSection('students');}catch(e){showToast(e.message||'Student update failed','error')}finally{hideLoading();}}
  function field(id,label,value,type='text'){return `<div class="v94-field"><label>${label}</label><input id="${id}" type="${type}" value="${h(value)}"></div>`}
  function select(id,label,value,opts){return `<div class="v94-field"><label>${label}</label><select id="${id}">${opts.map(o=>`<option value="${h(o)}" ${String(o)===String(value)?'selected':''}>${h(o||'Select')}</option>`).join('')}</select></div>`}
  function val(id){return document.getElementById(id)?.value?.trim()||''}

  window.renderV94AlertsCenter = function(){
    return `<div class="space-y-6 animate-fade-in"><div class="rounded-xl border bg-card p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700"><div class="flex justify-between gap-4 items-center"><div><h2 class="text-2xl font-bold">Alerts Center</h2><p class="text-muted-foreground">Smart alerts tailored to each user role.</p></div>${['admin','super_admin','teacher'].includes(current().role)?`<button class="v94-btn primary" onclick="v94OpenCreateAlert()">+ Create Alert</button>`:''}</div></div><div id="v94-alerts-root" class="v94-alert-shell"><div class="v94-card">Loading alerts...</div></div></div>`;
  };
  window.v94LoadAlerts = async function(){
    const root=document.getElementById('v94-alerts-root'); if(!root)return;
    try{const res=await api.alerts.getMine(); const alerts=res.data||[]; const role=current().role||'admin'; const filtered=alerts; const counts={critical:0,academic:0,attendance:0,fee:0,timetable:0}; filtered.forEach(a=>{if((a.data?.severityLevel||a.severity)==='critical')counts.critical++; if(a.type==='academic')counts.academic++; if(a.type==='attendance')counts.attendance++; if(a.type==='fee')counts.fee++;});
      root.innerHTML=`<section class="v94-card"><div class="flex flex-wrap gap-2 mb-4"><span class="v94-pill">Role: ${h(role)}</span><span class="v94-pill red">Critical ${counts.critical}</span><span class="v94-pill">Academic ${counts.academic}</span><span class="v94-pill orange">Attendance ${counts.attendance}</span><span class="v94-pill green">Fees ${counts.fee}</span></div>${filtered.length?filtered.map(a=>alertRow(a)).join(''):'<div class="text-center py-12 text-muted-foreground">No alerts yet.</div>'}</section><aside class="v94-card"><h3 class="font-bold mb-3">Today’s Alert Overview</h3><div class="v94-grid cols-2"><div class="v94-stat"><span>Critical</span><strong>${counts.critical}</strong></div><div class="v94-stat"><span>Unread</span><strong>${filtered.filter(a=>!a.isRead).length}</strong></div><div class="v94-stat"><span>Attendance</span><strong>${counts.attendance}</strong></div><div class="v94-stat"><span>Fees</span><strong>${counts.fee}</strong></div></div><button class="v94-btn mt-4 w-full" onclick="api.alerts.markAllRead().then(()=>v94LoadAlerts())">Mark all as read</button></aside>`;
    }catch(e){root.innerHTML=`<div class="v94-card text-red-500">${h(e.message)}</div>`}
  };
  function alertRow(a){const sev=a.data?.severityLevel||a.severity||'low';return `<div class="v94-alert-row"><div class="v94-alert-icon">${sev==='critical'?'!':a.type==='fee'?'💳':a.type==='attendance'?'👥':'🔔'}</div><div><strong>${h(a.title)}</strong><p class="text-sm text-muted-foreground">${h(a.message)}</p><small>${a.createdAt?new Date(a.createdAt).toLocaleString():''}</small></div><div class="text-right"><span class="v94-severity ${h(sev)}">${h(sev).toUpperCase()}</span><br><button class="v94-btn mt-2" onclick="api.alerts.markRead('${a.id}').then(()=>v94LoadAlerts())">View</button></div></div>`}
  window.v94OpenCreateAlert=function(){const body=`<div class="v94-grid cols-2"><section class="space-y-4">${field('alert-title','Alert Title','')}<div class="v94-grid cols-2">${select('alert-type','Category','system',['academic','attendance','fee','system','duty','approval'])}${select('alert-severity','Severity','medium',['low','medium','high','critical'])}</div><div class="v94-field"><label>Message</label><textarea id="alert-message" rows="7"></textarea></div><div class="v94-field"><label>Target Audience</label><div class="grid gap-2 grid-cols-2"><label><input type="checkbox" class="alert-role" value="student" checked> Students</label><label><input type="checkbox" class="alert-role" value="parent"> Parents</label><label><input type="checkbox" class="alert-role" value="teacher"> Teachers</label><label><input type="checkbox" class="alert-role" value="admin"> Admins</label></div></div><div class="v94-field"><label>Delivery</label><div class="grid gap-2 grid-cols-3"><label><input type="checkbox" class="alert-delivery" value="in_app" checked> In-app</label><label><input type="checkbox" class="alert-delivery" value="sms"> SMS</label><label><input type="checkbox" class="alert-delivery" value="email"> Email</label></div></div></section><aside class="v94-card"><h4 class="font-bold mb-3">Preview</h4><div class="v94-alert-row" style="grid-template-columns:48px 1fr"><div class="v94-alert-icon">🔔</div><div><span id="alert-preview-sev" class="v94-severity medium">MEDIUM</span><h3 id="alert-preview-title" class="font-bold mt-3">Alert title</h3><p id="alert-preview-msg" class="text-sm text-muted-foreground">Message preview appears here.</p></div></div><div class="mt-4 text-sm text-muted-foreground">Recipients will only see alerts relevant to their role.</div></aside></div>`; modal('v94-create-alert','Create Alert',body,`<button class="v94-btn" onclick="document.getElementById('v94-create-alert').remove()">Cancel</button><button class="v94-btn primary" onclick="v94SendAlert()">Review & Send</button>`,true);['alert-title','alert-message','alert-severity'].forEach(id=>document.getElementById(id)?.addEventListener('input',v94UpdateAlertPreview));v94UpdateAlertPreview();}
  window.v94UpdateAlertPreview=function(){const sev=val('alert-severity')||'medium'; const s=document.getElementById('alert-preview-sev'); if(s){s.className='v94-severity '+sev;s.textContent=sev.toUpperCase()} const t=document.getElementById('alert-preview-title'); if(t)t.textContent=val('alert-title')||'Alert title'; const m=document.getElementById('alert-preview-msg'); if(m)m.textContent=val('alert-message')||'Message preview appears here.'}
  window.v94SendAlert=async function(){try{showLoading();const roles=[...document.querySelectorAll('.alert-role:checked')].map(x=>x.value);const delivery=[...document.querySelectorAll('.alert-delivery:checked')].map(x=>x.value);await api.alerts.create({title:val('alert-title'),message:val('alert-message'),type:val('alert-type'),severity:val('alert-severity'),roles,deliveryMethods:delivery});showToast('Alert sent','success');document.getElementById('v94-create-alert')?.remove();v94LoadAlerts();}catch(e){showToast(e.message||'Alert failed','error')}finally{hideLoading();}}
  window.renderV94AdminMarks=function(){return `<div class="space-y-6 animate-fade-in"><div class="rounded-xl border bg-card p-6"><h2 class="text-2xl font-bold">Exams & Marks</h2><p class="text-muted-foreground">Use the teacher marks entry workflow. Subject teachers enter marks and class teachers publish final reviewed marks.</p><button class="v94-btn primary mt-4" onclick="v94OpenStandaloneMarks()">Open Marks Entry Preview</button></div></div>`}
  window.v94OpenStandaloneMarks=function(){window.currentMarksStudents=[{id:1,elimuid:'GA/24/001',User:{name:'Akinyi Brenda'}},{id:2,elimuid:'GA/24/002',User:{name:'Mwangi Brian'}},{id:3,elimuid:'GA/24/003',User:{name:'Njeri Faith'}}];window.currentMarksSubject='English';window.currentMarksClassName='Form 2A';showMarksEntryModal('Form 2A')}
  const oldShow=window.showMarksEntryModal;
  window.showMarksEntryModal=function(className){const students=window.currentMarksStudents||[];const body=`<div class="space-y-4"><div class="v94-grid cols-5">${select('v94-exam','Exam','Mid Term Exam',['CAT','Mid Term Exam','End Term Exam','Assignment'])}${field('v94-class','Class',className||window.currentMarksClassName||'Class')}${field('v94-subject','Subject',window.currentMarksSubject||'Subject')}${select('v94-term','Term','Term 2',['Term 1','Term 2','Term 3'])}${field('v94-teacher','Teacher',current().name||'Teacher')}</div><div class="v94-marks-layout"><section class="v94-card overflow-x-auto"><table class="v94-marks-table"><thead><tr><th>#</th><th>Admission No</th><th>Student Name</th><th>CAT /20</th><th>Exam /80</th><th>Total</th><th>Grade</th><th>Remarks</th></tr></thead><tbody>${students.map((s,i)=>`<tr><td>${i+1}</td><td>${h(s.elimuid||s.admissionNumber||'-')}</td><td>${h(s.User?.name||s.name||'Student')}</td><td><input type="number" min="0" max="20" class="v94-cat" data-i="${i}" oninput="v94CalcMarks()"></td><td><input type="number" min="0" max="80" class="v94-exam-score" data-i="${i}" oninput="v94CalcMarks()"></td><td id="v94-total-${i}">-</td><td id="v94-grade-${i}">-</td><td><input id="v94-remark-${i}" placeholder="Remark"></td></tr>`).join('')}</tbody></table></section><aside class="v94-card"><h4 class="font-bold mb-3">Entry Summary</h4><div class="space-y-2 text-sm"><div>Students: <strong>${students.length}</strong></div><div>Average: <strong id="v94-avg">0%</strong></div><div>Missing: <strong id="v94-missing">${students.length}</strong></div></div><div class="v94-card mt-4 bg-orange-50"><strong>Moderation & Approval</strong><p class="text-sm text-muted-foreground">Class teacher review before final publish.</p><label class="mt-2 block"><input type="checkbox" checked> Publish after approval</label></div></aside></div></div>`;modal('marks-entry-modal','Marks Entry',body,`<button class="v94-btn">Save Draft</button><button class="v94-btn">Preview Report</button><button class="v94-btn" onclick="v94SubmitMarks(false)">Submit for Review</button><button class="v94-btn primary" onclick="v94SubmitMarks(true)">Publish Marks</button>`,true)}
  window.v94CalcMarks=function(){const rows=[...document.querySelectorAll('.v94-cat')];let total=0,entered=0;rows.forEach((c,i)=>{const cat=Number(c.value||0);const ex=Number(document.querySelector(`.v94-exam-score[data-i="${i}"]`)?.value||0);const t=(c.value||ex)?cat+ex:null;document.getElementById(`v94-total-${i}`).textContent=t??'-';let g='-';if(t!==null){entered++;total+=t;g=t>=80?'A':t>=70?'B+':t>=60?'B':t>=50?'C+':t>=40?'C':'D'}document.getElementById(`v94-grade-${i}`).innerHTML=g==='-'?'-':`<span class="v94-pill ${t>=70?'green':t>=50?'orange':'red'}">${g}</span>`});document.getElementById('v94-avg').textContent=entered?Math.round(total/entered)+'%':'0%';document.getElementById('v94-missing').textContent=rows.length-entered}
  window.v94SubmitMarks=async function(publish){
    try{
      showLoading();
      const students=window.currentMarksStudents||[];
      const assessmentName=val('v94-exam')||'Assessment';
      const term=val('v94-term')||window.currentMarksTerm||'Term 1';
      const subject=val('v94-subject')||window.currentMarksSubject||'Subject';
      let saved=0, failed=0;
      for(const [i,s] of students.entries()){
        const cat=Number(document.querySelector(`.v94-cat[data-i="${i}"]`)?.value||0);
        const exam=Number(document.querySelector(`.v94-exam-score[data-i="${i}"]`)?.value||0);
        if(!cat && !exam) continue;
        const score=cat+exam;
        try{
          await api.teacher.enterMarks({
            studentId:s.id,
            subject,
            assessmentType:assessmentName.toLowerCase().includes('exam')?'exam':'test',
            assessmentName,
            score,
            catScore:cat,
            examScore:exam,
            remarks:document.getElementById(`v94-remark-${i}`)?.value||'',
            date:new Date().toISOString().slice(0,10),
            term,
            year:new Date().getFullYear(),
            isPublished:!!publish
          });
          saved++;
        }catch(e){ failed++; }
      }
      showToast(`${publish?'Published':'Saved'} ${saved} marks${failed?`, ${failed} failed`:''}`, saved?'success':'warning');
      document.getElementById('marks-entry-modal')?.remove();
    }catch(e){showToast(e.message||'Marks save failed','error')}finally{hideLoading();}
  }
})();
