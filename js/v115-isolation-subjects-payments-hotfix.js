
// Shule AI v115 isolation + custom subject + parent subscription verification hotfix.
(function(){
  'use strict';
  const $ = (id) => document.getElementById(id);
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const arr = (v) => Array.isArray(v?.data) ? v.data : (Array.isArray(v) ? v : []);
  const toast = (m,t='info') => (typeof showToast === 'function' ? showToast(m,t) : console.log(`[${t}]`, m));
  const apiReq = (url, opts={}) => window.apiRequest ? window.apiRequest(url, opts) : fetch(url, opts).then(r=>r.json());
  function currentUser(){ try { const u = typeof getCurrentUser === 'function' ? getCurrentUser() : JSON.parse(localStorage.getItem('user') || '{}'); return u && typeof u === 'object' ? u : {}; } catch { return {}; } }
  function selectedChildId(){ return String(window.dashboardData?.selectedChildId || localStorage.getItem('shule_selected_child_id') || '').trim(); }
  function isParent(){ return String(currentUser()?.role || localStorage.getItem('role') || '').toLowerCase() === 'parent'; }

  // ---------------- Parent chat isolation: every parent conversation request is child-scoped.
  function messageAttachment(m){ const a = m?.metadata?.attachment || m?.attachment; if(!a) return ''; const url = a.url || a.fileUrl || a.path || '#'; return `<div class="mt-2 text-xs"><a class="underline" target="_blank" href="${esc(url)}">📎 ${esc(a.originalName || a.filename || 'Attachment')}</a></div>`; }
  window.loadParentRecipientConversation = async function(){
    const box = $('parent-chat-messages'); if(!box) return;
    const type = $('parent-recipient-type')?.value || 'teacher';
    const studentId = selectedChildId();
    if (!studentId) { box.innerHTML = '<div class="text-center text-muted-foreground py-8">Select a child first.</div>'; return; }
    box.innerHTML = '<div class="text-center text-muted-foreground py-8">Loading child-specific conversation...</div>';
    try {
      const qs = new URLSearchParams({ studentId, recipientType:type }).toString();
      const convRes = await (window.api?.parent?.getConversations ? window.api.parent.getConversations({ studentId, recipientType:type }) : apiReq(`/api/parent/conversations?${qs}`)).catch(()=>({data:[]}));
      const conversations = arr(convRes);
      const wanted = type === 'admin' ? 'parent_admin' : 'parent_class_teacher';
      const match = conversations.find(c => c.conversationType === wanted && String(c.studentId || '') === String(studentId));
      let messages = [];
      if (match?.userId) messages = arr(await (window.api?.parent?.getMessages ? window.api.parent.getMessages(match.userId, { studentId, recipientType:type }) : apiReq(`/api/parent/messages/${match.userId}?${qs}`)).catch(()=>({data: match.messages || []})));
      else messages = arr(match?.messages || []);
      const me = currentUser();
      box.innerHTML = messages.length ? messages.map(m => {
        const mine = Number(m.senderId) === Number(me.id);
        return `<div class="flex ${mine?'justify-end':'justify-start'}"><div class="max-w-[75%] rounded-2xl px-4 py-2 ${mine?'bg-primary text-primary-foreground':'bg-background border'}"><p class="text-sm whitespace-pre-wrap">${esc(m.content || '')}</p>${messageAttachment(m)}<p class="text-[10px] opacity-70 mt-1">${m.createdAt ? new Date(m.createdAt).toLocaleString() : ''}</p></div></div>`;
      }).join('') : '<div class="text-center text-muted-foreground py-8">No messages for this child and recipient yet. Send the first message.</div>';
      box.scrollTop = box.scrollHeight;
    } catch(e){ box.innerHTML = `<div class="text-center text-red-500 py-8">${esc(e.message || 'Could not load conversation')}</div>`; }
  };

  window.sendParentMessage = async function(){
    const input = $('parent-chat-input'); const file = $('parent-chat-attachment')?.files?.[0] || null; const text = input?.value?.trim() || '';
    const studentId = selectedChildId();
    if(!studentId) return toast('Select a child first','error');
    if(!text && !file) return toast('Type a message or attach a file','error');
    let attachment = null;
    if(file && window.api?.chatV9?.uploadAttachment){ const fd = new FormData(); fd.append('file', file); const up = await window.api.chatV9.uploadAttachment(fd); attachment = up.data || up.file || up; attachment.originalName = attachment.originalName || file.name; }
    await (window.api?.parent?.sendMessage ? window.api.parent.sendMessage({ studentId:Number(studentId), message:text || file?.name || '', recipientType:$('parent-recipient-type')?.value || 'teacher', attachment }) : apiReq('/api/parent/message', { method:'POST', body:JSON.stringify({ studentId:Number(studentId), message:text || file?.name || '', recipientType:$('parent-recipient-type')?.value || 'teacher', attachment }) }));
    if(input) input.value=''; if($('parent-chat-attachment')) $('parent-chat-attachment').value='';
    await window.loadParentRecipientConversation();
    toast('Message sent for the selected child only','success');
  };

  // Clear stale child-scoped visuals on child switch.
  const oldSelectChild = window.selectChild;
  if (typeof oldSelectChild === 'function' && !oldSelectChild.__v114Scoped) {
    const wrapped = async function(childId){
      document.querySelectorAll('#parent-chat-messages,#parent-student-payment-history,#alerts-center-v82').forEach(el => { el.innerHTML = '<div class="text-center py-8 text-muted-foreground">Switching child...</div>'; });
      localStorage.setItem('shule_selected_child_id', childId);
      return oldSelectChild.apply(this, arguments);
    };
    wrapped.__v114Scoped = true;
    window.selectChild = wrapped;
  }

  // ---------------- Parent payments: restore platform subscription cards beside school fees.
  function money(v){ return `KES ${Number(v || 0).toLocaleString()}`; }
  async function getPlans(){
    const res = await (window.api?.parent?.getSubscriptionPlans ? window.api.parent.getSubscriptionPlans() : apiReq('/api/parent/plans')).catch(()=>({data:[]}));
    const plans = arr(res);
    return plans.length ? plans : [
      {code:'child_essential', name:'Essential', monthlyPriceKes:100, features:['Report cards','Attendance','Homework','Teacher communication']},
      {code:'child_smart', name:'Smart', monthlyPriceKes:300, features:['Everything in Essential','Progress analytics','Study insights']},
      {code:'child_genius', name:'Genius', monthlyPriceKes:500, features:['Everything in Smart','AI Tutor','Full analytics']}
    ];
  }
  window.v114StartParentSubscription = async function(planCode, amount){
    const studentId = selectedChildId(); const phone = $('payment-phone')?.value?.trim() || currentUser().phone || currentUser().phoneNumber || '';
    if(!studentId) return toast('Select a child first','error');
    if(!phone) return toast('Enter the M-Pesa phone number in the payment form first','error');
    await (window.api?.payments?.parentSubscriptionSTK ? window.api.payments.parentSubscriptionSTK({ studentId:Number(studentId), planCode, plan:planCode, amount:Number(amount), phone, billingCycle:'monthly', reference:`SUB-${Date.now()}` }) : apiReq('/api/payments/parent/subscription/stk',{ method:'POST', body:JSON.stringify({ studentId:Number(studentId), planCode, plan:planCode, amount:Number(amount), phone, billingCycle:'monthly' }) }));
    toast('Subscription request started. Complete the STK push or submit manual verification if configured.','success');
  };
  const oldParentPayments = window.renderParentPayments || window.v12RenderParentPayments;
  window.v114RenderParentPayments = async function(){
    const base = oldParentPayments ? await oldParentPayments() : '<div id="parent-payments-root"></div>';
    const plans = await getPlans();
    const studentId = selectedChildId();
    const cards = `<div class="rounded-xl border bg-card p-6"><div class="flex items-center justify-between gap-3 flex-wrap mb-4"><div><h3 class="font-semibold text-lg">Shule AI Platform Subscription</h3><p class="text-sm text-muted-foreground">These cards are separate from school fees and apply only to the selected child.</p></div><span class="text-xs rounded-full px-3 py-1 bg-primary/10 text-primary">Child ID: ${esc(studentId || 'select child')}</span></div><div class="grid gap-4 md:grid-cols-3">${plans.map(p => { const code = p.code || p.id || p.name; const amount = Number(p.monthlyPriceKes ?? p.price ?? p.amount ?? 0); const features = Array.isArray(p.features) ? p.features : []; return `<div class="rounded-2xl border p-5 bg-gradient-to-br from-background to-muted/30 flex flex-col"><p class="text-xs uppercase tracking-wide text-muted-foreground">${esc(p.interval || 'monthly')}</p><h4 class="text-xl font-bold mt-1">${esc(p.displayName || p.name || code)}</h4><p class="text-2xl font-extrabold mt-2">${money(amount)}<span class="text-xs font-normal text-muted-foreground"> / month</span></p><ul class="text-sm text-muted-foreground mt-3 space-y-1 flex-1">${features.slice(0,5).map(f=>`<li>✓ ${esc(f)}</li>`).join('') || '<li>✓ Student reports</li><li>✓ Attendance & progress</li>'}</ul><button class="mt-4 w-full rounded-xl bg-primary text-primary-foreground py-2 font-semibold" onclick="v114StartParentSubscription('${esc(code)}', ${amount})">Choose ${esc(p.displayName || p.name || code)}</button></div>`; }).join('')}</div></div>`;
    if (String(base).includes('Shule AI Platform Subscription')) return base;
    return `<div class="space-y-6">${cards}${base}</div>`;
  };
  window.renderParentPayments = window.v114RenderParentPayments;
  window.v12RenderParentPayments = window.v114RenderParentPayments;

  // ---------------- Admin Custom Subjects: add whole-school/class custom subject form.
  function parseSubjectData(cb){ try { return JSON.parse((cb.dataset.subject || '{}').replace(/&#39;/g,"'")); } catch { return null; } }
  window.v114SaveSchoolSubjectCheckboxes = async function(){
    const subjects = Array.from(document.querySelectorAll('.v102-school-subject:checked')).map(parseSubjectData).filter(Boolean);
    await (window.api?.admin?.saveSchoolSubjects ? window.api.admin.saveSchoolSubjects(subjects) : apiReq('/api/admin/curriculum/school-subjects',{method:'PUT', body:JSON.stringify({subjects})}));
    toast(`✅ ${subjects.length} subject(s) saved and synced`, 'success');
    await window.showDashboardSection?.('custom-subjects');
  };
  window.v114AddCustomSubjectToList = function(){
    const name = $('v114-custom-subject-name')?.value?.trim(); if(!name) return toast('Enter the custom subject name','error');
    const scope = $('v114-custom-subject-scope')?.value || 'school';
    const classId = $('v114-custom-subject-class')?.value || '';
    const selectedLevels = Array.from(document.querySelectorAll('.v114-custom-level:checked')).map(x=>x.value);
    if(scope === 'class' && !classId) return toast('Choose the class for this subject','error');
    const subject = { id:`custom_${name.toLowerCase().replace(/[^a-z0-9]+/g,'_')}_${Date.now()}`, name, subjectName:name, category:'custom', isCustom:true, source:'custom', scope, classIds: scope === 'class' ? [Number(classId)] : [], levelCodes: scope === 'school' ? selectedLevels : [], isOptional:true, countsInFinalByDefault:true, isOffered:true };
    const holder = $('v114-custom-subjects-holder'); if(!holder) return;
    holder.insertAdjacentHTML('beforeend', `<label class="flex items-start gap-2 p-3 rounded-lg border bg-emerald-50/60 dark:bg-emerald-950/20"><input type="checkbox" checked class="v102-school-subject mt-1" data-subject='${esc(JSON.stringify(subject))}'><span><span class="font-medium text-sm">${esc(name)}</span><span class="block text-xs text-muted-foreground">Custom • ${scope === 'class' ? 'Class only' : (selectedLevels.length ? 'Selected levels' : 'Whole school')}</span></span></label>`);
    $('v114-custom-subject-name').value = '';
    toast(`Added ${name}. Press Save Subjects to persist it.`, 'success');
  };
  const oldCustomRenderer = window.renderAdminCustomSubjects;
  window.renderAdminCustomSubjects = async function(){
    const [setupRes, classRes] = await Promise.all([
      (window.api?.admin?.getCurriculumSetup ? window.api.admin.getCurriculumSetup() : apiReq('/api/admin/curriculum/setup')).catch(()=>({data:{}})),
      (window.api?.admin?.getClasses ? window.api.admin.getClasses() : apiReq('/api/admin/classes')).catch(()=>({data:[]}))
    ]);
    const data = setupRes.data || {}; const cfg = data.config || {}; const levels = data.levels || []; const subjects = data.subjectBank || []; const classes = arr(classRes);
    const savedRows = Array.isArray(cfg.schoolSubjects) ? cfg.schoolSubjects : [];
    const saved = new Set(savedRows.filter(s=>s.isOffered!==false).map(s=>s.subjectId || s.id || s.name));
    const customSaved = savedRows.filter(s => s.isCustom || s.category === 'custom');
    const grouped = subjects.reduce((acc,s)=>{ const group = (s.levelLabels && s.levelLabels[0]) || (s.levelCodes && s.levelCodes[0]) || 'Subjects'; (acc[group] ||= []).push(s); return acc; }, {});
    return `<div class="space-y-6 animate-fade-in"><div class="flex justify-between items-center"><div><h2 class="text-2xl font-bold">Add Subjects</h2><p class="text-sm text-muted-foreground">Choose curriculum subjects and add custom subjects for the whole school or a specific class.</p></div><button onclick="v114SaveSchoolSubjectCheckboxes()" class="px-4 py-2 bg-primary text-primary-foreground rounded-lg">Save Subjects</button></div>
      <div class="rounded-xl border bg-card p-6 space-y-4"><h3 class="font-semibold">Add Custom Subject</h3><div class="grid gap-3 md:grid-cols-4"><input id="v114-custom-subject-name" class="rounded-lg border bg-background px-3 py-2" placeholder="e.g. Robotics, French, Swimming"><select id="v114-custom-subject-scope" class="rounded-lg border bg-background px-3 py-2" onchange="document.getElementById('v114-class-wrap').style.display=this.value==='class'?'block':'none';document.getElementById('v114-level-wrap').style.display=this.value==='school'?'block':'none';"><option value="school">Whole school / selected levels</option><option value="class">Specific class only</option></select><div id="v114-class-wrap" style="display:none"><select id="v114-custom-subject-class" class="w-full rounded-lg border bg-background px-3 py-2"><option value="">Choose class</option>${classes.map(c=>`<option value="${esc(c.id)}">${esc(c.name || c.grade || ('Class '+c.id))}</option>`).join('')}</select></div><button type="button" onclick="v114AddCustomSubjectToList()" class="rounded-lg bg-emerald-600 text-white px-4 py-2">Add Subject</button></div><div id="v114-level-wrap" class="grid gap-2 md:grid-cols-4 text-sm">${levels.map(l=>`<label class="flex items-center gap-2 rounded border p-2"><input type="checkbox" class="v114-custom-level" value="${esc(l.code)}">${esc(l.label || l.code)}</label>`).join('')}<p class="md:col-span-4 text-xs text-muted-foreground">Leave levels unchecked to make the custom subject available across the whole school.</p></div><div id="v114-custom-subjects-holder" class="grid gap-3 md:grid-cols-3">${customSaved.map(s=>`<label class="flex items-start gap-2 p-3 rounded-lg border bg-emerald-50/60 dark:bg-emerald-950/20"><input type="checkbox" checked class="v102-school-subject mt-1" data-subject='${esc(JSON.stringify(s))}'><span><span class="font-medium text-sm">${esc(s.name)}</span><span class="block text-xs text-muted-foreground">Custom • ${esc(s.scope || 'school')}</span></span></label>`).join('')}</div></div>
      <div class="rounded-xl border bg-card p-6"><h3 class="font-semibold mb-3">Curriculum Source</h3><div class="grid md:grid-cols-3 gap-3 text-sm"><div class="p-3 bg-muted/30 rounded-lg"><p class="text-muted-foreground">Curriculum</p><p class="font-bold">${esc(cfg.curriculum || 'cbc')}</p></div><div class="p-3 bg-muted/30 rounded-lg"><p class="text-muted-foreground">Structure</p><p class="font-bold">${esc(cfg.structureType || 'mixed')}</p></div><div class="p-3 bg-muted/30 rounded-lg"><p class="text-muted-foreground">Enabled Levels</p><p class="font-bold">${levels.length}</p></div></div></div>
      <div class="space-y-4">${Object.entries(grouped).map(([group,items])=>`<div class="rounded-xl border bg-card p-5"><div class="flex items-center justify-between mb-3"><h3 class="font-semibold">${esc(group)}</h3><button type="button" onclick="document.querySelectorAll('[data-v102-group=&quot;${esc(group)}&quot;] input').forEach(cb=>cb.checked=true)" class="text-xs px-2 py-1 rounded bg-primary/10 text-primary">Check all</button></div><div class="grid md:grid-cols-3 gap-3">${items.map(s=>`<label data-v102-group="${esc(group)}" class="flex items-start gap-2 p-3 rounded-lg border bg-muted/20"><input type="checkbox" class="v102-school-subject mt-1" data-subject='${esc(JSON.stringify(s))}' ${saved.has(s.id) || saved.has(s.name) ? 'checked' : ''}><span><span class="font-medium text-sm">${esc(s.name)}</span><span class="block text-xs text-muted-foreground">${esc(s.category || 'subject')}${s.pathway ? ` • ${esc(s.pathway)}` : ''}</span></span></label>`).join('')}</div></div>`).join('')}</div><div class="flex justify-end"><button onclick="v114SaveSchoolSubjectCheckboxes()" class="px-6 py-3 bg-primary text-primary-foreground rounded-lg">Save Subjects</button></div></div>`;
  };
  try { if (typeof renderAdminCustomSubjects !== 'undefined') renderAdminCustomSubjects = window.renderAdminCustomSubjects; window.v115RenderAdminCustomSubjects = window.renderAdminCustomSubjects; window.v114RenderAdminCustomSubjects = window.renderAdminCustomSubjects; } catch(_) {}

  // ---------------- Remove the old Parent Messages dashboard card from teacher dashboard only.
  function hideTeacherDashboardParentMessages(){
    const user = currentUser(); if(String(user.role || '').toLowerCase() !== 'teacher') return;
    document.querySelectorAll('#teacher-message-count-badge, #teacher-messages-list').forEach(el => {
      const card = el.closest('.rounded-xl.border.bg-card.p-6') || el.parentElement;
      if(card) { card.remove(); }
    });
    document.querySelectorAll('h3').forEach(h => {
      if (String(h.textContent || '').trim().toLowerCase() === 'parent messages') {
        const card = h.closest('.rounded-xl.border.bg-card.p-6') || h.closest('.rounded-xl');
        if (card && !card.closest('[data-role=admin]')) card.remove();
      }
    });
  }
  const oldTeacherDashboard = window.renderTeacherDashboard;
  if (typeof oldTeacherDashboard === 'function' && !oldTeacherDashboard.__v114NoParentCard) {
    const wrapped = async function(){ const html = await oldTeacherDashboard.apply(this, arguments); setTimeout(hideTeacherDashboardParentMessages, 80); return html; };
    wrapped.__v114NoParentCard = true; window.renderTeacherDashboard = wrapped;
  }
  const obs = new MutationObserver(hideTeacherDashboardParentMessages);
  document.addEventListener('DOMContentLoaded', () => { hideTeacherDashboardParentMessages(); try{ if(document.body) obs.observe(document.body,{childList:true,subtree:true}); }catch(_){} });
})();
