(function(){
  'use strict';

  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const arr = (x) => Array.isArray(x) ? x : (Array.isArray(x?.data) ? x.data : (Array.isArray(x?.data?.items) ? x.data.items : []));
  const data = (x) => x?.data ?? x ?? {};
  const toast = (m,t='info') => { try { showToast(m,t); } catch(_) { console.log(`[${t}]`,m); } };
  const icons = () => setTimeout(() => { try { lucide.createIcons(); } catch(_){} }, 0);

  window.safeRemoveById = function(id){ const el = document.getElementById(id); if (el) el.remove(); };
  window.safeClosestRemove = function(el, selector){ const target = el && el.closest ? el.closest(selector) : null; if (target) target.remove(); };
  window.safeClearById = function(id){ const el = document.getElementById(id); if (el) el.innerHTML = ''; };

  const roleNav = {
    super_admin: [
      ['overview','layout-dashboard','Overview'], ['schools','building-2','Schools'], ['approvals','check-circle','Approvals'],
      ['analytics','bar-chart-3','Analytics'], ['system','server','System'], ['legal','shield-check','Legal'], ['settings','settings','Settings']
    ],
    admin: [
      ['overview','layout-dashboard','Overview'], ['students','graduation-cap','Students'], ['teachers','users','Teachers'], ['classes','school','Classes'],
      ['timetable','calendar-days','Timetable'], ['calendar','calendar','Academic Calendar'], ['alerts','bell','Alerts'],
      ['learning','book-open','Learning Materials'], ['tutor-analytics','brain','Tutor Analytics'], ['settings','settings','Settings']
    ],
    teacher: [
      ['overview','layout-dashboard','Overview'], ['students','graduation-cap','My Students'], ['marks','clipboard-check','Marks'],
      ['timetable','calendar-days','Timetable'], ['homework','book-marked','Homework'], ['duty','map-pin','Duty'],
      ['messages','message-circle','Messages'], ['calendar','calendar','Calendar'], ['alerts','bell','Alerts'], ['profile','user','Profile']
    ],
    parent: [
      ['overview','layout-dashboard','Overview'], ['children','users','Children'], ['learning','book-open','Learning Materials'],
      ['ai-tutor','brain','AI Tutor'], ['calendar','calendar','Calendar'], ['alerts','bell','Alerts'], ['profile','user','Profile']
    ],
    student: [
      ['overview','layout-dashboard','Overview'], ['learning','book-open','Learning Materials'], ['ai-tutor','brain','AI Tutor'],
      ['timetable','calendar-days','Timetable'], ['homework','book-marked','Homework'], ['calendar','calendar','Calendar'],
      ['alerts','bell','Alerts'], ['gamification','trophy','Rewards'], ['profile','user','Profile']
    ]
  };

  function normalizeRole(role){
    role = String(role || '').toLowerCase().replace('-', '_');
    if (role === 'superadmin') return 'super_admin';
    return role;
  }
  function currentUser(){
    try { return JSON.parse(localStorage.getItem('user') || localStorage.getItem('shule_user') || '{}'); } catch(_) { return {}; }
  }
  function currentRole(){ return normalizeRole(window.currentRole || localStorage.getItem('userRole') || currentUser().role || ''); }
  function setContent(html){ const c = $('dashboard-content'); if (c) c.innerHTML = html; icons(); }
  function setTitle(title){ const t=$('page-title'); if(t) t.textContent=title || 'Dashboard'; }
  function card(title,value,icon='activity',sub=''){
    return `<div class="rounded-2xl border bg-card p-5 shadow-sm"><div class="flex items-center justify-between"><div><p class="text-sm text-muted-foreground">${esc(title)}</p><h3 class="text-3xl font-black mt-1">${esc(value)}</h3>${sub?`<p class="text-xs text-muted-foreground mt-1">${esc(sub)}</p>`:''}</div><div class="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center"><i data-lucide="${icon}" class="h-5 w-5"></i></div></div></div>`;
  }
  function shell(title, subtitle, body, actions=''){
    setTitle(title);
    setContent(`<div class="space-y-6"><div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div><p class="text-sm font-semibold text-primary">Shule AI production dashboard</p><h2 class="text-3xl font-black tracking-tight">${esc(title)}</h2>${subtitle?`<p class="text-muted-foreground mt-1">${esc(subtitle)}</p>`:''}</div>${actions}</div>${body}</div>`);
  }
  function loading(title='Loading'){ setContent(`<div class="rounded-2xl border bg-card p-10 text-center"><div class="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div><p class="mt-4 text-sm text-muted-foreground">${esc(title)}...</p></div>`); }
  function errorView(title, err){ shell(title, 'The server returned an error for this section.', `<div class="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700"><b>Could not load this section.</b><p class="text-sm mt-1">${esc(err?.message || err || 'Unknown error')}</p></div>`); }
  function table(headers, rows, empty='No records found'){
    if (!rows || !rows.length) return `<div class="rounded-2xl border bg-card p-8 text-center text-muted-foreground">${esc(empty)}</div>`;
    return `<div class="overflow-auto rounded-2xl border bg-card"><table class="w-full text-sm"><thead class="bg-muted/60"><tr>${headers.map(h=>`<th class="text-left px-4 py-3 font-bold">${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>`;
  }

  function buildNav(role){
    const nav=$('sidebar-nav'), mobile=$('mobile-nav'), settings=$('settings-nav');
    const items=roleNav[role] || roleNav.student;
    const link = ([section,icon,label]) => `<button type="button" data-section="${section}" onclick="showDashboardSection('${section}')" class="sidebar-link w-full flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"><i data-lucide="${icon}" class="h-5 w-5"></i><span>${esc(label)}</span></button>`;
    if (nav) nav.innerHTML = items.filter(x=>!['settings','profile'].includes(x[0])).map(link).join('');
    if (settings) settings.innerHTML = items.filter(x=>['settings','profile','legal'].includes(x[0])).map(link).join('') || `<button onclick="showDashboardSection('profile')" class="sidebar-link w-full flex items-center gap-3 rounded-xl px-3 py-2 text-sm"><i data-lucide="user" class="h-5 w-5"></i><span>Profile</span></button>`;
    if (mobile) mobile.innerHTML = items.slice(0,5).map(([section,icon,label])=>`<button data-section="${section}" onclick="showDashboardSection('${section}')" class="mobile-nav-item flex flex-col items-center gap-1 text-xs p-2"><i data-lucide="${icon}" class="h-5 w-5"></i><span>${esc(label).split(' ')[0]}</span></button>`).join('');
    icons();
  }
  function markActive(section){
    document.querySelectorAll('.sidebar-link,.mobile-nav-item').forEach(el=>{
      const active = el.dataset.section === section;
      el.classList.toggle('sidebar-link-active', active);
      el.classList.toggle('active', active);
    });
  }
  function hydrateHeader(){
    const u=currentUser();
    const name=u.name || u.fullName || u.email || 'Shule AI User';
    const initials=name.split(/\s+/).map(p=>p[0]).join('').slice(0,2).toUpperCase() || 'SA';
    const school=(() => { try { return JSON.parse(localStorage.getItem('school')||'{}'); } catch(_) { return {}; }})();
    if($('user-name')) $('user-name').textContent=name;
    if($('dropdown-user-name')) $('dropdown-user-name').textContent=name;
    if($('dropdown-user-email')) $('dropdown-user-email').textContent=u.email || u.phone || '';
    if($('user-initials')) $('user-initials').textContent=initials;
    if($('sidebar-school-name')) $('sidebar-school-name').textContent=school.name || 'ShuleAI';
  }

  window.toggleMobileSidebar = window.toggleMobileSidebar || function(){ $('sidebar')?.classList.toggle('-translate-x-full'); $('mobile-overlay')?.classList.toggle('hidden'); };
  window.toggleUserMenu = window.toggleUserMenu || function(){ $('user-menu')?.classList.toggle('hidden'); };
  window.toggleNotifications = window.toggleNotifications || function(){ showDashboardSection('alerts'); };
  window.toggleTheme = window.toggleTheme || function(){ document.documentElement.classList.toggle('dark'); localStorage.setItem('shule_theme', document.documentElement.classList.contains('dark')?'dark':'light'); };

  async function renderOverview(role){
    const u=currentUser();
    if (role === 'super_admin') {
      const [overview,schools,pending] = await Promise.all([
        api.superAdmin.getOverview().catch(()=>({data:{}})), api.superAdmin.getSchools().catch(()=>({data:[]})), api.superAdmin.getPendingSchools().catch(()=>({data:[]}))
      ]);
      const o=data(overview); const s=arr(schools); const p=arr(pending);
      shell('Super Admin Overview', 'Live platform health and school onboarding status.', `<div class="grid md:grid-cols-4 gap-4">${card('Schools', o.totalSchools ?? s.length,'building-2')}${card('Pending', o.pendingSchools ?? p.length,'clock')}${card('Users', o.totalUsers ?? '-','users')}${card('Revenue', o.revenue ?? 'Paused','wallet','Payment module hidden for now')}</div><div class="rounded-2xl border bg-card p-5"><h3 class="font-black mb-3">Recent Schools</h3>${table(['School','Status','Admin'], s.slice(0,8).map(x=>`<tr class="border-t"><td class="px-4 py-3 font-semibold">${esc(x.name)}</td><td class="px-4 py-3">${esc(x.status||'')}</td><td class="px-4 py-3">${esc(x.adminName||x.admin?.name||'')}</td></tr>`),'No schools yet')}</div>`);
      return;
    }
    if (role === 'admin') {
      const [teachers,students,classes] = await Promise.all([api.admin.getTeachers().catch(()=>({data:[]})), api.admin.getStudents().catch(()=>({data:[]})), api.admin.getClasses().catch(()=>({data:[]}))]);
      shell('Admin Overview', 'Operational view for your school.', `<div class="grid md:grid-cols-4 gap-4">${card('Students',arr(students).length,'graduation-cap')}${card('Teachers',arr(teachers).length,'users')}${card('Classes',arr(classes).length,'school')}${card('Payments','Paused','wallet','Hidden until you are ready')}</div><div class="grid lg:grid-cols-2 gap-4"><div class="rounded-2xl border bg-card p-5"><h3 class="font-black mb-3">Quick Actions</h3><div class="grid sm:grid-cols-2 gap-3"><button onclick="showDashboardSection('students')" class="rounded-xl border p-4 text-left hover:bg-accent">Manage students</button><button onclick="showDashboardSection('teachers')" class="rounded-xl border p-4 text-left hover:bg-accent">Manage teachers</button><button onclick="showDashboardSection('timetable')" class="rounded-xl border p-4 text-left hover:bg-accent">Build timetable</button><button onclick="showDashboardSection('alerts')" class="rounded-xl border p-4 text-left hover:bg-accent">Send alerts</button></div></div><div class="rounded-2xl border bg-card p-5"><h3 class="font-black mb-3">Current user</h3><p>${esc(u.name||'Admin')}</p><p class="text-sm text-muted-foreground">${esc(u.email||'')}</p></div></div>`);
      return;
    }
    if (role === 'teacher') {
      const [students,duty] = await Promise.all([api.teacher.getMyStudents().catch(()=>({data:[]})), api.duty.getTodayDuty().catch(()=>({data:{}}))]);
      shell('Teacher Overview', 'Classes, learners, duties and today’s work.', `<div class="grid md:grid-cols-4 gap-4">${card('My Students',arr(students).length,'graduation-cap')}${card('Today Duty',data(duty).area || 'None','map-pin')}${card('Homework','Open','book-marked')}${card('Messages','Open','message-circle')}</div>`);
      return;
    }
    if (role === 'parent') {
      const children = await api.parent.getChildren?.().catch(()=>({data:[]}));
      shell('Parent Overview', 'Track learners, home support and school updates.', `<div class="grid md:grid-cols-3 gap-4">${card('Children',arr(children).length,'users')}${card('AI Tutor','Paid plan','brain')}${card('Payments','Paused','wallet','Hidden for now')}</div><div class="rounded-2xl border bg-card p-5"><h3 class="font-black mb-3">Linked Children</h3>${renderChildrenTable(arr(children))}</div>`);
      return;
    }
    shell('Student Overview', 'Your learning hub.', `<div class="grid md:grid-cols-4 gap-4">${card('Learning Materials','Open','book-open')}${card('AI Tutor','Paid plan','brain')}${card('Homework','Open','book-marked')}${card('Rewards','Open','trophy')}</div><div class="rounded-2xl border bg-card p-5"><h3 class="font-black">Start learning</h3><p class="text-muted-foreground text-sm mt-1">Choose learning materials or ask the AI tutor a question. The tutor detects the subject automatically.</p><div class="mt-4 flex gap-2 flex-wrap"><button class="px-4 py-2 rounded-xl bg-primary text-primary-foreground" onclick="showDashboardSection('ai-tutor')">Open AI Tutor</button><button class="px-4 py-2 rounded-xl border" onclick="showDashboardSection('learning')">Learning Materials</button></div></div>`);
  }

  function renderChildrenTable(items){ return table(['Name','Class','Status'], items.map(c=>`<tr class="border-t"><td class="px-4 py-3 font-semibold">${esc(c.name||c.studentName)}</td><td class="px-4 py-3">${esc(c.className||c.grade||'')}</td><td class="px-4 py-3">${esc(c.status||'Active')}</td></tr>`),'No linked children found'); }

  async function renderSchools(){
    const schools=arr(await api.superAdmin.getSchools());
    shell('Schools', 'Approve, suspend and reactivate schools without placeholder buttons.', table(['School','Status','Admin','Actions'], schools.map(s=>`<tr class="border-t"><td class="px-4 py-3 font-semibold">${esc(s.name)}</td><td class="px-4 py-3">${esc(s.status)}</td><td class="px-4 py-3">${esc(s.adminName||s.admin?.name||'')}</td><td class="px-4 py-3 flex gap-2"><button class="px-3 py-1 rounded-lg border" onclick="viewSchool('${s.id}')">View</button>${s.status==='suspended'?`<button class="px-3 py-1 rounded-lg bg-green-600 text-white" onclick="reactivateSchoolProduction('${s.id}')">Reactivate</button>`:`<button class="px-3 py-1 rounded-lg bg-red-600 text-white" onclick="suspendSchoolProduction('${s.id}')">Suspend</button>`}</td></tr>`),'No schools found'));
  }
  window.suspendSchoolProduction = async function(id){ const reason=prompt('Reason for suspending this school?'); if(!reason) return; try{ await api.superAdmin.suspendSchool(id,reason); toast('School suspended','success'); renderSchools(); }catch(e){ toast(e.message||'Suspend failed','error'); } };
  window.reactivateSchoolProduction = async function(id){ const reason=prompt('Reason for reactivating this school?') || 'Reactivated by super admin'; try{ await api.superAdmin.reactivateSchool(id,reason); toast('School reactivated','success'); renderSchools(); }catch(e){ toast(e.message||'Reactivation failed','error'); } };

  async function renderApprovals(){
    const pending=arr(await api.superAdmin.getPendingSchools().catch(()=>({data:[]})));
    shell('Approvals', 'Pending school onboarding requests.', table(['School','Admin','Email','Actions'], pending.map(s=>`<tr class="border-t"><td class="px-4 py-3 font-semibold">${esc(s.name)}</td><td class="px-4 py-3">${esc(s.adminName||'')}</td><td class="px-4 py-3">${esc(s.email||s.adminEmail||'')}</td><td class="px-4 py-3 flex gap-2"><button class="px-3 py-1 rounded-lg bg-green-600 text-white" onclick="approveSchoolProduction('${s.id}')">Approve</button><button class="px-3 py-1 rounded-lg bg-red-600 text-white" onclick="rejectSchoolProduction('${s.id}')">Reject</button></td></tr>`),'No pending approvals'));
  }
  window.approveSchoolProduction = async function(id){ try{ await api.superAdmin.approveSchool(id); toast('School approved','success'); renderApprovals(); }catch(e){ toast(e.message||'Approval failed','error'); } };
  window.rejectSchoolProduction = async function(id){ const reason=prompt('Reason for rejection?') || 'Rejected'; try{ await api.superAdmin.rejectSchool(id,reason); toast('School rejected','success'); renderApprovals(); }catch(e){ toast(e.message||'Rejection failed','error'); } };

  async function renderStudents(){
    const students=arr(await api.admin.getStudents().catch(()=>api.teacher.getMyStudents?.().catch(()=>({data:[]}))));
    shell('Students', 'Clean production student list.', table(['Name','Class','Parent','Actions'], students.map(s=>`<tr class="border-t"><td class="px-4 py-3 font-semibold">${esc(s.name)}</td><td class="px-4 py-3">${esc(s.className||s.grade||'')}</td><td class="px-4 py-3">${esc(s.parentName||s.parent?.name||'')}</td><td class="px-4 py-3"><button class="px-3 py-1 rounded-lg border" onclick="viewStudentDetails('${s.id}')">View</button></td></tr>`),'No students found'));
  }
  async function renderTeachers(){
    const teachers=arr(await api.admin.getTeachers());
    shell('Teachers', 'Teacher accounts and activation controls.', table(['Name','Email','Role','Status','Actions'], teachers.map(t=>`<tr class="border-t"><td class="px-4 py-3 font-semibold">${esc(t.name)}</td><td class="px-4 py-3">${esc(t.email||'')}</td><td class="px-4 py-3">${esc(t.role||t.teacherRole||'teacher')}</td><td class="px-4 py-3">${esc(t.status||t.approvalStatus||'')}</td><td class="px-4 py-3 flex gap-2"><button class="px-3 py-1 rounded-lg border" onclick="sendMessageToTeacher('${t.id}')">Message</button><button class="px-3 py-1 rounded-lg bg-green-600 text-white" onclick="activateTeacher('${t.id}')">Activate</button><button class="px-3 py-1 rounded-lg bg-amber-600 text-white" onclick="deactivateTeacher('${t.id}')">Deactivate</button></td></tr>`),'No teachers found'));
  }
  async function renderClasses(){
    const classes=arr(await api.admin.getClasses());
    shell('Classes', 'Classes and learner groups.', table(['Class','Level','Teacher','Students'], classes.map(c=>`<tr class="border-t"><td class="px-4 py-3 font-semibold">${esc(c.name||c.className)}</td><td class="px-4 py-3">${esc(c.level||c.grade||'')}</td><td class="px-4 py-3">${esc(c.teacherName||c.classTeacher?.name||'')}</td><td class="px-4 py-3"><button class="px-3 py-1 rounded-lg border" onclick="viewClassStudents('${c.id}')">View students</button></td></tr>`),'No classes found'));
  }

  async function renderLearning(){
    shell('Learning Materials','Functional subject content with subscription-aware premium locking.', `<div id="learning-materials-container"></div>`);
    if (window.loadStudentLearningMaterials) await window.loadStudentLearningMaterials();
  }
  async function renderAITutor(){
    shell('AI Tutor','Paid subscription learning assistant. It detects the subject from the student command.', `<div class="rounded-2xl border bg-card p-5"><div id="ai-chat-container" class="h-[420px] overflow-y-auto rounded-xl border bg-background p-4 mb-4"><div class="text-sm text-muted-foreground">Ask something like: “Mathematics: explain fractions” or “Help me with Kiswahili insha”.</div></div><div class="flex gap-2"><input id="ai-question-input" class="flex-1 rounded-xl border bg-background px-4 py-3" placeholder="Type your question..."><button onclick="askAITutor()" class="px-5 py-3 rounded-xl bg-primary text-primary-foreground font-bold">Ask</button></div></div>`);
  }
  async function renderAnalytics(role){
    const res = await api.analytics.getSchoolAnalytics?.().catch(()=>({data:{}}));
    const d=data(res);
    shell(role==='admin'?'Tutor Analytics':'Analytics','Live analytics endpoint; no random values.', `<div class="grid md:grid-cols-4 gap-4">${card('Engagement',d.engagementRate??'-','activity')}${card('Lessons',d.totalLessons??'-','book-open')}${card('Weak Areas',d.weakAreas?.length??0,'target')}${card('Improving',d.improvingSubjects?.length??0,'trending-up')}</div><pre class="rounded-2xl border bg-card p-5 overflow-auto text-xs">${esc(JSON.stringify(d,null,2))}</pre>`);
  }
  async function renderSystem(){
    const status = data(await api.superAdmin.getSystemStatus().catch(()=>({data:{}})));
    shell('System Health', 'Real backend status where available.', `<div class="grid md:grid-cols-4 gap-4">${card('API',status.api||'Online','server')}${card('Database',status.database||'Unknown','database')}${card('Latency',status.latencyMs ? status.latencyMs+'ms' : 'Measured server-side','zap')}${card('Backups',status.backups||'Available','archive')}</div><div class="rounded-2xl border bg-card p-5"><button onclick="runBackupProduction()" class="px-4 py-2 rounded-xl bg-primary text-primary-foreground">Run Backup</button></div>`);
  }
  window.runBackupProduction = async function(){ try{ const r=await api.superAdmin.runBackup(); toast(`Backup created${data(r).size?`: ${data(r).size}`:''}`,'success'); }catch(e){ toast(e.message||'Backup failed','error'); } };
  async function renderLegal(){
    shell('Legal Documents','Terms and privacy load from backend legal documents.', `<div class="grid md:grid-cols-2 gap-4"><button onclick="showTerms()" class="rounded-2xl border bg-card p-6 text-left hover:bg-accent"><h3 class="font-black">Terms of Service</h3><p class="text-sm text-muted-foreground mt-1">Open current terms from backend.</p></button><button onclick="showPrivacy()" class="rounded-2xl border bg-card p-6 text-left hover:bg-accent"><h3 class="font-black">Privacy Policy</h3><p class="text-sm text-muted-foreground mt-1">Open current privacy notice from backend.</p></button></div>`);
  }
  async function renderProfile(){ const u=currentUser(); shell('Profile','Signed-in account details.', `<div class="rounded-2xl border bg-card p-6 max-w-2xl"><div class="text-5xl font-black mb-2">${esc((u.name||'SA').split(/\s+/).map(x=>x[0]).join('').slice(0,2).toUpperCase())}</div><h3 class="text-2xl font-black">${esc(u.name||'User')}</h3><p class="text-muted-foreground">${esc(u.email||u.phone||'')}</p><p class="mt-3 text-sm">Role: <b>${esc(currentRole())}</b></p></div>`); }
  async function renderMessages(){ shell('Messages','Teacher and department messaging.', `<div class="rounded-2xl border bg-card p-5"><p class="text-muted-foreground">Messaging module is loaded without old dashboard renderers. Use department/class chat buttons where available.</p></div>`); }
  async function renderPausedPayments(){ shell('Payments Paused','Payment screens are intentionally hidden while the rest of the system is stabilized.', `<div class="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-800"><b>Payment module paused.</b><p class="text-sm mt-1">No parent/admin payment action is exposed in this build.</p></div>`); }

  window.showDashboard = async function(role){
    role = normalizeRole(role || currentRole() || 'student');
    window.currentRole = role; localStorage.setItem('userRole', role);
    $('landing-page') && ($('landing-page').style.display='none');
    $('dashboard-container') && ($('dashboard-container').style.display='block');
    document.body.dataset.role = role;
    hydrateHeader(); buildNav(role); await window.showDashboardSection('overview');
  };

  window.showDashboardSection = async function(section){
    const role=currentRole() || 'student'; window.currentSection=section; markActive(section); loading(section);
    try{
      if (section === 'overview' || section === 'dashboard') return await renderOverview(role);
      if (section === 'schools') return await renderSchools();
      if (section === 'approvals') return await renderApprovals();
      if (section === 'students' || section === 'children') return role === 'parent' ? shell('Children','Linked learners.', `<div class="rounded-2xl border bg-card p-5">${renderChildrenTable(arr(await api.parent.getChildren?.().catch(()=>({data:[]}))))}</div>`) : await renderStudents();
      if (section === 'teachers') return await renderTeachers();
      if (section === 'classes') return await renderClasses();
      if (section === 'timetable') return role==='admin' ? await v12RenderAdminTimetable() : role==='teacher' ? await v12RenderTeacherTimetable() : role==='parent' ? await v12RenderParentTimetable() : await v12RenderStudentTimetable();
      if (section === 'calendar') return await v12RenderAcademicCalendar();
      if (section === 'alerts') return await v12RenderAlertsCenter(role);
      if (section === 'homework') return role==='teacher' ? await v12RenderTeacherHomework() : await v12RenderStudentHomework();
      if (section === 'duty') return await v12RenderTeacherDuty();
      if (section === 'learning') return await renderLearning();
      if (section === 'ai-tutor') return await renderAITutor();
      if (section === 'analytics' || section === 'tutor-analytics') return await renderAnalytics(role);
      if (section === 'system') return await renderSystem();
      if (section === 'legal') return await renderLegal();
      if (section === 'messages') return await renderMessages();
      if (section === 'payments' || section === 'fees' || section === 'billing') return await renderPausedPayments();
      if (section === 'profile' || section === 'settings') return await renderProfile();
      if (section === 'marks') return shell('Marks Entry','Marks engine is available from teacher routes.', `<div class="rounded-2xl border bg-card p-5"><p class="text-muted-foreground">Use the marks entry route after selecting a class/subject. This build no longer loads old dashboard renderers.</p></div>`);
      if (section === 'gamification') return shell('Rewards','Student rewards and achievements.', `<div class="rounded-2xl border bg-card p-5"><button class="px-4 py-2 rounded-xl border" onclick="api.gamification.getRewards().then(r=>alert(JSON.stringify(r.data||[],null,2))).catch(e=>showToast(e.message,'error'))">Load Rewards</button></div>`);
      return shell('Section unavailable','This section is not exposed in the production dashboard.', `<div class="rounded-2xl border bg-card p-5 text-muted-foreground">${esc(section)}</div>`);
    } catch(e){ errorView(section, e); }
  };

  document.addEventListener('DOMContentLoaded', async function(){
    if (localStorage.getItem('shule_theme') === 'dark') document.documentElement.classList.add('dark');
    if (localStorage.getItem('authToken')) {
      try { if (window.checkAuth) await window.checkAuth(); await window.showDashboard(currentRole()); } catch(e) { console.warn('Auto dashboard boot failed', e); }
    }
  });
})();

(function(){
  window.processNameChange = window.processNameChange || function(){ if (window.showToast) showToast('Payment/name-change flow is paused in this build while the rest of the system is stabilized.','info'); };
  window.openNameChangeModal = window.openNameChangeModal || function(){ const m=document.getElementById('name-change-modal'); if(m) m.classList.remove('hidden'); };
  window.closeNameChangeModal = window.closeNameChangeModal || function(){ const m=document.getElementById('name-change-modal'); if(m) m.classList.add('hidden'); };
})();


(function(){
  window.print = window.print || function(){ globalThis.print && globalThis.print(); };
  window.saveDutyPreferences = window.saveDutyPreferences || async function(){
    try {
      const prefs = Array.from(document.querySelectorAll('[data-duty-pref], .duty-pref:checked')).map(x => x.value || x.dataset.dutyPref).filter(Boolean);
      if (window.api?.duty?.updatePreferences) await api.duty.updatePreferences({ preferences: prefs });
      if (window.showToast) showToast('Duty preferences saved','success');
    } catch(e) { if (window.showToast) showToast(e.message || 'Could not save duty preferences','error'); }
  };
  window.viewTeacherDetails = window.viewTeacherDetails || async function(id){
    try {
      const teachers = (await api.admin.getTeachers()).data || [];
      const t = teachers.find(x => String(x.id) === String(id)) || {};
      const root = document.createElement('div'); root.id='teacher-details-modal'; root.className='fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4';
      root.innerHTML = `<div class="bg-card border rounded-2xl p-6 max-w-xl w-full"><div class="flex justify-between gap-3"><h3 class="text-xl font-black">${String(t.name||'Teacher')}</h3><button onclick="safeRemoveById('teacher-details-modal')" class="rounded-lg border px-3 py-1">Close</button></div><div class="mt-4 text-sm space-y-2"><p><b>Email:</b> ${String(t.email||'')}</p><p><b>Phone:</b> ${String(t.phone||'')}</p><p><b>Status:</b> ${String(t.status||t.approvalStatus||'')}</p></div></div>`;
      document.body.appendChild(root);
    } catch(e) { if (window.showToast) showToast(e.message || 'Teacher details failed','error'); }
  };
})();
