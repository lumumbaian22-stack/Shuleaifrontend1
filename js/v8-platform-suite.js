
// js/v8-platform-suite.js
// Platform consistency: school display name, super admin live stats, role labels, role-aware search/help, curriculum progress.

function v8Esc(value) {
  const div = document.createElement('div');
  div.textContent = value == null ? '' : String(value);
  return div.innerHTML;
}
function v8SchoolName(school) {
  if (typeof getSchoolDisplayName === 'function') return getSchoolDisplayName(school);
  return school?.approvedName || school?.displayName || school?.platformDisplayName || 'ShuleAI School';
}
function v8RoleBadge(userOrTeacher, classItem) {
  const roles = [];
  if (userOrTeacher?.isClassTeacher || userOrTeacher?.classTeacher || classItem?.teacherId === userOrTeacher?.id) roles.push(`Class Teacher${classItem?.name ? ' — ' + classItem.name : ''}`);
  if (userOrTeacher?.subjects?.length || userOrTeacher?.subjectAssignments?.length) roles.push('Subject Teacher');
  return roles.length ? roles.map(r=>`<span class="px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">${v8Esc(r)}</span>`).join(' ') : '<span class="px-2 py-1 rounded-full bg-slate-100 text-slate-600 text-xs">Teacher</span>';
}

async function renderV8SuperAdminDashboard() {
  const res = await api.superAdmin.getLiveStats();
  const data = res.data || {};
  const ov = data.overview || {};
  return `
  <div class="space-y-6 animate-fade-in">
    <div class="rounded-xl border bg-gradient-to-r from-slate-900 to-blue-900 text-white p-6">
      <div class="flex justify-between gap-4 flex-wrap">
        <div>
          <h2 class="text-2xl font-bold">Platform Command Center</h2>
          <p class="text-blue-100">Live platform analytics. Updated: ${new Date(data.updatedAt || Date.now()).toLocaleString()}</p>
        </div>
        <button onclick="showDashboardSection('dashboard')" class="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20">Refresh</button>
      </div>
    </div>
    <div class="grid gap-4 md:grid-cols-4">
      ${[
        ['Schools', ov.schools, 'building-2'],
        ['Active Schools', ov.activeSchools, 'check-circle'],
        ['Students', ov.students, 'graduation-cap'],
        ['Teachers', ov.teachers, 'users'],
        ['Parents', ov.parents, 'heart'],
        ['Classes', ov.classes, 'layers'],
        ['Users', ov.users, 'user'],
        ['Pending Names', ov.pendingNameRequests, 'file-edit']
      ].map(s=>`<div class="rounded-xl border bg-card p-4"><p class="text-sm text-muted-foreground">${s[0]}</p><h3 class="text-2xl font-bold">${s[1] || 0}</h3></div>`).join('')}
    </div>
    <div class="rounded-xl border bg-card overflow-hidden">
      <div class="p-4 border-b flex justify-between items-center">
        <h3 class="font-bold">Schools Live Stats</h3>
        <span class="text-xs text-muted-foreground">No cached placeholders — these numbers come from live API queries.</span>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-muted/50"><tr><th class="p-3 text-left">School</th><th class="p-3">Status</th><th class="p-3">Curriculum</th><th class="p-3">Students</th><th class="p-3">Teachers</th><th class="p-3">Parents</th><th class="p-3">Classes</th><th class="p-3">Name Approval</th></tr></thead>
          <tbody>${(data.schools || []).map(s=>`<tr class="border-t"><td class="p-3"><strong>${v8Esc(s.displayName)}</strong><br><span class="text-xs text-muted-foreground">${v8Esc(s.schoolId)}</span></td><td class="p-3 text-center">${v8Esc(s.status)}</td><td class="p-3 text-center">${v8Esc(s.curriculum)}</td><td class="p-3 text-center">${s.students}</td><td class="p-3 text-center">${s.teachers}</td><td class="p-3 text-center">${s.parents}</td><td class="p-3 text-center">${s.classes}</td><td class="p-3 text-center">${v8Esc(s.nameApprovalStatus || 'platform')}</td></tr>`).join('') || `<tr><td colspan="8" class="p-8 text-center text-muted-foreground">No schools yet.</td></tr>`}</tbody>
        </table>
      </div>
    </div>
  </div>`;
}

async function renderV8HelpSection() {
  const res = await api.help.getArticles();
  const payload = res.data || {};
  return `<div class="space-y-6 animate-fade-in">
    <div class="rounded-xl border bg-card p-6">
      <h2 class="text-2xl font-bold">Help Center</h2>
      <p class="text-muted-foreground">Role-aware help for ${v8Esc(payload.role || 'user')}. It explains the exact features available to this dashboard.</p>
      <div class="mt-4 flex gap-2"><input id="v8-help-search" class="flex-1 rounded-lg border px-3 py-2 bg-background" placeholder="Search help, e.g. timetable, marks, report card, payments"><button onclick="v8SearchHelp()" class="px-4 py-2 bg-primary text-white rounded-lg">Search</button></div>
    </div>
    <div id="v8-help-results" class="grid gap-4 md:grid-cols-2">${(payload.articles || []).map(a=>v8HelpCard(a)).join('')}</div>
  </div>`;
}
function v8HelpCard(a){ return `<div class="rounded-xl border bg-card p-5"><h3 class="font-bold">${v8Esc(a.title)}</h3><p class="text-sm text-muted-foreground mt-2">${v8Esc(a.content)}</p></div>`; }
async function v8SearchHelp() {
  const q = document.getElementById('v8-help-search')?.value || '';
  const res = await api.help.search(q);
  const box = document.getElementById('v8-help-results');
  if (box) box.innerHTML = (res.data || []).map(a=>v8HelpCard(a)).join('') || '<div class="rounded-xl border bg-card p-6 text-muted-foreground">No help article matched that search.</div>';
}

async function renderV8CurriculumProgress(role) {
  const res = role === 'teacher' ? await api.teacher.getCurriculumProgress() : await api.admin.getCurriculumProgress();
  const data = res.data || {};
  const classes = data.classes || [];
  return `<div class="space-y-6 animate-fade-in">
    <div class="rounded-xl border bg-card p-6">
      <h2 class="text-2xl font-bold">Curriculum Progress</h2>
      <p class="text-muted-foreground">Tracks start/progress/completion for subjects by class and teacher. Updated: ${new Date(data.updatedAt || Date.now()).toLocaleString()}</p>
    </div>
    ${classes.map(c=>`<div class="rounded-xl border bg-card p-5">
      <div class="flex justify-between gap-3 flex-wrap mb-4"><div><h3 class="font-bold">${v8Esc(c.className)}</h3><p class="text-xs text-muted-foreground">${c.isClassTeacher ? 'Class Teacher View' : 'Subject Teacher View'}</p></div>${c.averageProgress != null ? `<strong>${c.averageProgress}% complete</strong>` : ''}</div>
      <div class="space-y-3">${(c.subjects || []).map(s=>`<div class="border rounded-lg p-3">
        <div class="flex justify-between gap-3"><strong>${v8Esc(s.subject)}</strong><span>${s.progress || 0}%</span></div>
        <div class="h-2 bg-muted rounded-full mt-2 overflow-hidden"><div class="h-full bg-primary" style="width:${s.progress || 0}%"></div></div>
        <p class="text-xs text-muted-foreground mt-1">${s.completedTopics || 0}/${s.totalTopics || 0} topics • ${v8Esc(s.status)}</p>
        ${role === 'teacher' ? `<button class="mt-2 text-xs text-primary underline" onclick="v8OpenCurriculumUpdate(${c.classId}, '${v8Esc(s.subject)}', ${s.totalTopics || 10}, ${s.completedTopics || 0})">Update progress</button>` : ''}
      </div>`).join('') || '<p class="text-muted-foreground">No subject assignments found.</p>'}</div>
    </div>`).join('') || `<div class="rounded-xl border bg-card p-8 text-center text-muted-foreground">No curriculum progress data yet. Assign teachers to subjects first.</div>`}
  </div>`;
}
function v8OpenCurriculumUpdate(classId, subject, total, completed) {
  const modal = document.createElement('div');
  modal.className = 'v7-modal-backdrop';
  modal.innerHTML = `<div class="v7-modal" style="max-width:560px"><div class="v7-modal-head"><h3>Update Curriculum Progress</h3><button onclick="this.closest('.v7-modal-backdrop').remove()">✕</button></div><div class="v7-modal-body v7-shell">
    <label class="v7-field">Subject <input id="v8-cp-subject" value="${subject}" disabled></label>
    <label class="v7-field">Total Topics <input id="v8-cp-total" type="number" value="${total}"></label>
    <label class="v7-field">Completed Topics <input id="v8-cp-completed" type="number" value="${completed}"></label>
    <label class="v7-field">Notes <textarea id="v8-cp-notes"></textarea></label>
    <button class="v7-btn v7-btn-primary" onclick="v8SaveCurriculumProgress(${classId}, '${subject}', this)">Save</button>
  </div></div>`;
  document.body.appendChild(modal);
}
async function v8SaveCurriculumProgress(classId, subject, btn) {
  await api.teacher.updateCurriculumProgress({ classId, subject, totalTopics:Number(document.getElementById('v8-cp-total').value), completedTopics:Number(document.getElementById('v8-cp-completed').value), notes:document.getElementById('v8-cp-notes').value });
  btn.closest('.v7-modal-backdrop').remove();
  showToast('Curriculum progress updated', 'success');
  await showDashboardSection('curriculum-progress');
}

// Search UI
async function v8GlobalSearch(q) {
  if (!q || q.trim().length < 2) return;
  const res = await api.search.globalSearch(q);
  const data = res.data || {};
  let panel = document.getElementById('v8-search-panel');
  if (!panel) {
    panel = document.createElement('div');
    panel.id = 'v8-search-panel';
    panel.className = 'absolute left-4 right-4 top-16 z-50 rounded-xl border bg-popover shadow-lg p-3 max-h-96 overflow-auto';
    document.querySelector('header')?.appendChild(panel);
  }
  panel.innerHTML = (data.results || []).map(r=>`<button class="w-full text-left p-3 rounded-lg hover:bg-accent" onclick="showDashboardSection('${v8Esc(r.section || 'dashboard')}'); document.getElementById('v8-search-panel')?.remove();"><strong>${v8Esc(r.title)}</strong><br><span class="text-xs text-muted-foreground">${v8Esc(r.type)} • ${v8Esc(r.subtitle || '')}</span></button>`).join('') || '<div class="p-4 text-muted-foreground">No results found.</div>';
}

window.renderV8SuperAdminDashboard = renderV8SuperAdminDashboard;
window.renderV8HelpSection = renderV8HelpSection;
window.renderV8CurriculumProgress = renderV8CurriculumProgress;
window.v8GlobalSearch = v8GlobalSearch;
