// Shule AI v114: parent/child isolation, custom subjects, subscription cards, and teacher dashboard cleanup.
(function(){
  'use strict';
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const safeParse = (v, fb={}) => { try { return v ? JSON.parse(v) : fb; } catch { return fb; } };
  const apiReq = (path, opts={}) => window.apiRequest ? window.apiRequest(path, opts) : Promise.reject(new Error('API helper not loaded'));
  const toast = (msg, type='success') => window.showToast ? window.showToast(msg, type) : console.log(type, msg);
  const selectedChildId = () => String(window.dashboardData?.selectedChildId || localStorage.getItem('shule_selected_child_id') || '').trim();
  const currentUser = () => (typeof window.getCurrentUser === 'function' ? window.getCurrentUser() : null) || safeParse(localStorage.getItem('user'), {});

  function money(v){ return `KES ${Number(v || 0).toLocaleString()}`; }
  function firstAmount(plan){ return Number(plan.monthlyPriceKes ?? plan.price ?? plan.amount ?? plan.price_kes ?? 0) || 0; }

  // Parent API must support child-scoped conversations/messages.
  window.api = window.api || {};
  window.api.parent = window.api.parent || {};
  window.api.parent.getConversationsForChild = (studentId) => apiReq(`/api/parent/conversations?studentId=${encodeURIComponent(studentId || selectedChildId())}`);
  window.api.parent.getMessagesForChild = (otherUserId, studentId) => apiReq(`/api/parent/messages/${encodeURIComponent(otherUserId)}?studentId=${encodeURIComponent(studentId || selectedChildId())}`);

  // Strict child-scoped parent alerts: no visual carry-over from another selected child.
  window.loadParentAlerts = async function(){
    const container = document.getElementById('parent-alerts-container');
    if (!container) return;
    const childId = selectedChildId();
    if (!childId) { container.innerHTML = '<div class="text-center text-muted-foreground py-4">Select a child first</div>'; return; }
    try {
      const res = await apiReq(`/api/user/alerts?studentId=${encodeURIComponent(childId)}&limit=20`);
      const alerts = Array.isArray(res.data) ? res.data : [];
      container.innerHTML = alerts.length ? alerts.slice(0, 5).map(alert => `
        <div class="p-3 border rounded-lg ${!alert.isRead ? 'bg-primary/5' : ''}" data-student-id="${esc(alert.studentId || alert.data?.studentId || childId)}">
          <p class="font-medium text-sm">${esc(alert.title)}</p>
          <p class="text-xs text-muted-foreground">${esc(alert.message)}</p>
          <p class="text-xs text-muted-foreground mt-1">${typeof window.timeAgo === 'function' ? window.timeAgo(alert.createdAt) : esc(alert.createdAt || '')}</p>
        </div>`).join('') : '<div class="text-center text-muted-foreground py-4">No alerts for this selected child</div>';
    } catch(e) { container.innerHTML = `<div class="text-red-500">Failed to load alerts: ${esc(e.message)}</div>`; }
  };

  // Strict child-scoped parent chat history. No fallback to conversations without studentId.
  window.loadParentRecipientConversation = async function(){
    const container = document.getElementById('parent-chat-messages');
    if (!container) return;
    const childId = selectedChildId();
    const target = document.getElementById('parent-recipient-type')?.value || 'teacher';
    if (!childId) { container.innerHTML = '<div class="text-center text-muted-foreground py-8">Select a child first.</div>'; return; }
    container.innerHTML = `<div class="text-center text-muted-foreground py-8"><i data-lucide="message-circle" class="h-10 w-10 mx-auto mb-2 opacity-50"></i><p>Loading ${target === 'admin' ? 'School Admin' : 'Class Teacher'} conversation for this child only...</p></div>`;
    try {
      const res = await window.api.parent.getConversationsForChild(childId);
      const rows = Array.isArray(res?.data) ? res.data : [];
      const wantedType = target === 'admin' ? 'parent_admin' : 'parent_class_teacher';
      const match = rows.find(c => String(c.conversationType || '').toLowerCase() === wantedType && String(c.studentId || '') === String(childId)) || null;
      const messages = match?.messages || [];
      if (!messages.length) {
        container.innerHTML = `<div class="text-center text-muted-foreground py-8"><i data-lucide="message-circle" class="h-12 w-12 mx-auto mb-3 opacity-50"></i><p>No ${target === 'admin' ? 'admin' : 'class teacher'} messages for the selected child yet.</p><p class="text-xs mt-2">This chat is isolated to child #${esc(childId)}.</p></div>`;
      } else {
        container.innerHTML = messages.slice().reverse().map(msg => {
          const mine = Number(msg.senderId) === Number(currentUser()?.id);
          const senderName = mine ? 'You' : (msg.Sender?.name || msg.senderName || match.userName || (target === 'admin' ? 'School Admin' : 'Class Teacher'));
          const attachment = msg.metadata?.attachment || msg.attachment;
          return `<div class="flex ${mine ? 'justify-end' : 'justify-start'}"><div class="${mine ? 'chat-bubble-sent' : 'chat-bubble-received'} max-w-[70%]"><p class="text-sm font-medium">${esc(senderName)}</p><p class="text-sm">${esc(msg.content || '')}</p>${attachment ? `<p class="text-xs mt-1"><i data-lucide="paperclip" class="h-3 w-3 inline"></i> ${esc(attachment.originalName || attachment.filename || 'Attachment')}</p>` : ''}<p class="text-xs text-muted-foreground mt-1">${typeof window.timeAgo === 'function' ? window.timeAgo(msg.createdAt || msg.timestamp) : esc(msg.createdAt || '')}</p></div></div>`;
        }).join('');
        container.scrollTop = container.scrollHeight;
      }
    } catch(e) {
      container.innerHTML = `<div class="text-center text-red-500 py-8">Could not load this child’s conversation: ${esc(e.message)}</div>`;
    }
    if (window.lucide) window.lucide.createIcons();
  };

  // Keep old parent payment page but inject live platform subscription cards above school fees.
  const oldParentPayments = window.renderParentPayments || window.v12RenderParentPayments;
  async function renderParentSubscriptionCards(){
    const childId = selectedChildId();
    let plans = [];
    try { plans = (await window.api.parent.getSubscriptionPlans()).data || []; } catch(e) { console.warn('Parent plans failed', e.message); }
    if (!plans.length) {
      plans = [
        { code:'child_essential', name:'Essential', price:100, features:['Report cards','Attendance','Homework tracking'] },
        { code:'child_smart', name:'Smart', price:300, features:['Everything in Essential','Progress analytics'] },
        { code:'child_genius', name:'Genius', price:500, features:['Everything in Smart','AI tutor'] }
      ];
    }
    return `<section class="rounded-2xl border bg-card p-5" id="parent-platform-subscription-cards" data-student-id="${esc(childId)}">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <div><p class="text-xs uppercase tracking-wide text-muted-foreground">Shule AI platform subscription</p><h3 class="text-xl font-bold">Learning Support Plans</h3><p class="text-sm text-muted-foreground">These cards are separate from school fees and apply only to the selected child.</p></div>
        <span class="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary">Selected child: ${esc(childId || 'None')}</span>
      </div>
      <div class="grid gap-4 md:grid-cols-3">${plans.map((p, idx) => {
        const code = p.code || p.id || `plan_${idx+1}`;
        const amount = firstAmount(p);
        const features = Array.isArray(p.features) ? p.features : [];
        return `<div class="rounded-xl border p-4 bg-gradient-to-br from-background to-muted/30 flex flex-col">
          <div class="flex items-start justify-between gap-2"><div><h4 class="font-bold text-lg">${esc(p.displayName || p.name || code)}</h4><p class="text-xs text-muted-foreground">${esc(p.interval || 'monthly')} child plan</p></div><span class="text-xs rounded-full bg-primary/10 text-primary px-2 py-1">${esc(p.currency || 'KES')}</span></div>
          <p class="text-2xl font-bold mt-3">${money(amount)}<span class="text-xs font-normal text-muted-foreground"> / month</span></p>
          <ul class="text-sm text-muted-foreground mt-3 space-y-1 flex-1">${features.length ? features.slice(0,5).map(f=>`<li>✓ ${esc(f)}</li>`).join('') : '<li>✓ Report cards</li><li>✓ Attendance & progress</li><li>✓ Parent communication</li>'}</ul>
          <button onclick="upgradePlan('${esc(code)}', ${amount})" class="mt-4 w-full rounded-lg bg-primary text-primary-foreground py-2 font-semibold">Choose / Renew</button>
        </div>`;
      }).join('')}</div>
    </section>`;
  }
  window.renderParentPayments = window.v12RenderParentPayments = async function(){
    const base = oldParentPayments ? await oldParentPayments() : '<div id="parent-payments-root" class="space-y-6"></div>';
    const cards = await renderParentSubscriptionCards();
    if (base.includes('id="parent-platform-subscription-cards"')) return base;
    if (base.includes('<div class="grid gap-4 lg:grid-cols-3">')) return base.replace('<div class="grid gap-4 lg:grid-cols-3">', `${cards}<div class="grid gap-4 lg:grid-cols-3">`);
    return `<div class="space-y-6">${cards}${base}</div>`;
  };

  // Add a proper school-wide / class-specific custom subject editor.
  function levelCodeForClass(cls){ return cls?.levelCode || cls?.settings?.curriculumMeta?.levelCode || null; }
  async function loadSubjectState(){
    const [settingsRes, classesRes] = await Promise.all([
      window.api.admin.getSchoolSettings(),
      window.api.admin.getClasses().catch(() => ({data:[]}))
    ]);
    const school = settingsRes.data || {};
    const settings = school.settings || {};
    const engine = settings.curriculumEngine || {};
    const classes = Array.isArray(classesRes.data) ? classesRes.data : (classesRes.data?.classes || []);
    return { school, settings, engine, classes, schoolSubjects: Array.isArray(engine.schoolSubjects) ? engine.schoolSubjects : [], customSubjects: Array.isArray(settings.customSubjects) ? settings.customSubjects : [] };
  }
  function normalizeSubjectName(){ return String(document.getElementById('v114-subject-name')?.value || '').trim().replace(/\s+/g, ' '); }
  window.v114RenderCustomSubjects = async function(){
    const state = await loadSubjectState();
    const allLevelCodes = Array.isArray(state.engine.enabledLevels) && state.engine.enabledLevels.length ? state.engine.enabledLevels : [];
    const customRows = state.schoolSubjects.filter(s => s.source === 'custom' || s.source === 'v114_custom' || (state.customSubjects || []).map(x=>String(x).toLowerCase()).includes(String(s.name).toLowerCase()));
    return `<div class="space-y-6 animate-fade-in">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3"><div><h2 class="text-2xl font-bold">Custom Subjects</h2><p class="text-sm text-muted-foreground">Add a subject either for the whole school or only for one class/level. These subjects become available for teacher assignment, grading and reports.</p></div><span class="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary">Curriculum: ${esc(state.engine.curriculum || state.school.system || 'cbc')}</span></div>
      <div class="rounded-2xl border bg-card p-6 space-y-4">
        <h3 class="font-semibold">Add Subject</h3>
        <div class="grid gap-3 md:grid-cols-[1fr_.7fr_1fr_.6fr]">
          <label class="text-sm">Subject name<input id="v114-subject-name" class="mt-1 w-full rounded-lg border bg-background px-3 py-2" placeholder="e.g. Robotics, French, Computer Science"></label>
          <label class="text-sm">Scope<select id="v114-subject-scope" onchange="document.getElementById('v114-class-box').style.display=this.value==='class'?'block':'none'" class="mt-1 w-full rounded-lg border bg-background px-3 py-2"><option value="school">Whole school / all enabled levels</option><option value="class">One class only</option></select></label>
          <label class="text-sm" id="v114-class-box" style="display:none">Class<select id="v114-subject-class" class="mt-1 w-full rounded-lg border bg-background px-3 py-2">${state.classes.map(c=>`<option value="${esc(c.id)}">${esc(c.name || c.grade)}${c.grade ? ` • ${esc(c.grade)}` : ''}</option>`).join('')}</select></label>
          <label class="text-sm">Counts in final?<select id="v114-subject-counted" class="mt-1 w-full rounded-lg border bg-background px-3 py-2"><option value="true">Yes</option><option value="false">No</option></select></label>
        </div>
        <button onclick="v114AddCustomSubject()" class="px-5 py-3 rounded-xl bg-primary text-primary-foreground font-semibold">Add Custom Subject</button>
        ${!allLevelCodes.length ? '<p class="text-sm text-amber-600">No enabled curriculum levels found yet. Save the school curriculum structure first, then add whole-school subjects.</p>' : ''}
      </div>
      <div class="grid gap-4 lg:grid-cols-2">
        <div class="rounded-2xl border bg-card p-5"><h3 class="font-semibold mb-3">School Custom Subjects</h3>${state.customSubjects.length ? `<div class="space-y-2">${state.customSubjects.map(s=>`<div class="flex items-center justify-between rounded-lg border p-3"><span>${esc(s)}</span><button class="text-red-600 text-sm" onclick="v114RemoveCustomSubject('${esc(String(s)).replace(/'/g,'&#39;')}')">Remove</button></div>`).join('')}</div>` : '<div class="text-sm text-muted-foreground rounded-lg border p-4">No school-wide custom subjects yet.</div>'}</div>
        <div class="rounded-2xl border bg-card p-5"><h3 class="font-semibold mb-3">Live Subject Rows</h3>${customRows.length ? `<div class="space-y-2 max-h-96 overflow-y-auto">${customRows.map(row=>`<div class="rounded-lg border p-3"><div class="flex items-center justify-between"><span class="font-medium">${esc(row.name)}</span><button class="text-red-600 text-sm" onclick="v114RemoveCustomSubject('${esc(String(row.name)).replace(/'/g,'&#39;')}')">Remove</button></div><p class="text-xs text-muted-foreground mt-1">${(row.levelCodes||[]).length ? `Levels: ${(row.levelCodes||[]).map(esc).join(', ')}` : 'No level assigned'} • ${row.countsInFinalByDefault === false ? 'not counted by default' : 'counted by default'}</p></div>`).join('')}</div>` : '<div class="text-sm text-muted-foreground rounded-lg border p-4">No custom subject rows saved in the live curriculum engine yet.</div>'}</div>
      </div>
    </div>`;
  };
  window.v114AddCustomSubject = async function(){
    const state = await loadSubjectState();
    const name = normalizeSubjectName();
    if (!name) return toast('Enter a subject name first', 'error');
    const scope = document.getElementById('v114-subject-scope')?.value || 'school';
    const counted = document.getElementById('v114-subject-counted')?.value !== 'false';
    let levelCodes = [];
    let selectedClass = null;
    if (scope === 'class') {
      const classId = document.getElementById('v114-subject-class')?.value;
      selectedClass = state.classes.find(c => String(c.id) === String(classId));
      const level = levelCodeForClass(selectedClass);
      if (!level) return toast('This class does not have a curriculum level yet. Save the class/structure first.', 'error');
      levelCodes = [level];
    } else {
      levelCodes = Array.isArray(state.engine.enabledLevels) && state.engine.enabledLevels.length ? state.engine.enabledLevels : [];
      if (!levelCodes.length) return toast('Save enabled curriculum levels before adding a whole-school subject.', 'error');
    }
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g,'') || `custom_${Date.now()}`;
    const existing = state.schoolSubjects.filter(s => String(s.name || '').toLowerCase() !== name.toLowerCase());
    const schoolSubjects = [...existing, { id:`custom_${slug}`, subjectId:`custom_${slug}`, name, category:'custom', levelCodes, isCore:false, isOptional:true, countsInFinalByDefault:counted, isOffered:true, source:'v114_custom', order:900 }];
    const customSubjects = Array.from(new Set([...(state.customSubjects || []), name]));
    const payload = { schoolSubjects, customSubjects, curriculum: state.engine.curriculum || state.school.system || state.school.curriculum || 'cbc' };
    await window.api.admin.updateSchoolSettings(payload);
    if (scope === 'class' && selectedClass?.id) {
      const current = selectedClass.settings || {};
      const classCustomSubjects = Array.from(new Set([...(current.customSubjects || []), name]));
      await window.api.admin.updateClass(selectedClass.id, { name:selectedClass.name, grade:selectedClass.grade, stream:selectedClass.stream, teacherId:selectedClass.teacherId, settings:{ ...current, customSubjects: classCustomSubjects } }).catch(()=>null);
    }
    toast(scope === 'class' ? `Added ${name} to ${selectedClass?.name || 'class'}` : `Added ${name} to the whole school`, 'success');
    await window.showDashboardSection?.('custom-subjects');
  };
  window.v114RemoveCustomSubject = async function(name){
    const clean = String(name || '').replace(/&amp;/g,'&').replace(/&#39;/g,"'").trim();
    if (!clean || !confirm(`Remove ${clean} from custom subjects?`)) return;
    const state = await loadSubjectState();
    const customSubjects = (state.customSubjects || []).filter(s => String(s).toLowerCase() !== clean.toLowerCase());
    const schoolSubjects = (state.schoolSubjects || []).filter(s => String(s.name || '').toLowerCase() !== clean.toLowerCase());
    await window.api.admin.updateSchoolSettings({ schoolSubjects, customSubjects, curriculum: state.engine.curriculum || state.school.system || 'cbc' });
    toast(`Removed ${clean}`, 'info');
    await window.showDashboardSection?.('custom-subjects');
  };

  // Route the admin custom-subjects section to the fixed UI.
  const oldAdminSection = window.renderAdminSection;
  if (typeof oldAdminSection === 'function') {
    window.renderAdminSection = async function(section){
      if (section === 'custom-subjects') return await window.v114RenderCustomSubjects();
      return oldAdminSection.call(this, section);
    };
  }

  // Remove the teacher dashboard parent-message widget. Parent access remains inside Messages & Study Rooms > Parents only.
  function stripTeacherDashboardParentWidget(html){
    if (!html || typeof html !== 'string') return html;
    return html.replace(/\n?<div class="rounded-xl border bg-card p-6">\s*<div class="flex justify-between items-center mb-4"><div class="flex items-center gap-2"><i data-lucide="message-circle"[\s\S]*?id="teacher-messages-list"[\s\S]*?<\/button>\s*<\/div>\s*/m, '\n');
  }
  const oldTeacherSection = window.renderTeacherSection;
  if (typeof oldTeacherSection === 'function') {
    window.renderTeacherSection = async function(section){
      const html = await oldTeacherSection.call(this, section);
      return section === 'dashboard' ? stripTeacherDashboardParentWidget(html) : html;
    };
  }
  const oldTeacherDashboard = window.renderTeacherDashboard;
  if (typeof oldTeacherDashboard === 'function') {
    window.renderTeacherDashboard = async function(){ return stripTeacherDashboardParentWidget(await oldTeacherDashboard.apply(this, arguments)); };
  }
  function removeTeacherParentCardsFromDom(){
    const user = currentUser();
    if (String(user.role || '').toLowerCase() !== 'teacher') return;
    document.querySelectorAll('h3').forEach(h => {
      if (/^Parent Messages$/i.test((h.textContent || '').trim())) {
        const card = h.closest('.rounded-xl.border.bg-card');
        if (card && card.querySelector('#teacher-messages-list')) card.remove();
      }
    });
  }
  document.addEventListener('DOMContentLoaded', () => setTimeout(removeTeacherParentCardsFromDom, 300));
  window.addEventListener('shule:child-switched', () => { setTimeout(() => { window.loadParentAlerts?.(); window.loadParentRecipientConversation?.(); }, 150); });
  new MutationObserver(() => removeTeacherParentCardsFromDom()).observe(document.documentElement, { childList:true, subtree:true });
})();
