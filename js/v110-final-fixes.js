// Shule AI v110 final integrated fixes
(function(){
  'use strict';
  const $ = (id) => document.getElementById(id);
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const arr = (res) => Array.isArray(res?.data) ? res.data : (Array.isArray(res?.data?.data) ? res.data.data : (Array.isArray(res) ? res : []));
  const toast = (msg, type='success') => (window.showToast ? showToast(msg, type) : alert(msg));
  const apiReq = (path, opts={}) => (window.apiRequest ? window.apiRequest(path, opts) : Promise.reject(new Error('API helper not loaded')));

  window.api = window.api || {};
  api.student = api.student || {};
  api.parent = api.parent || {};
  api.teacher = api.teacher || {};
  api.admin = api.admin || {};
  api.sms = api.sms || {};

  api.student.getSubjectSelection = () => apiReq('/api/student/subject-selection');
  api.student.saveSubjectSelection = (payload) => apiReq('/api/student/subject-selection', { method:'PUT', body: JSON.stringify(payload) });
  api.parent.getChildSubjectSelection = (studentId) => apiReq(`/api/parent/child/${studentId}/subject-selection`);
  api.parent.saveChildSubjectSelection = (studentId, payload) => apiReq(`/api/parent/child/${studentId}/subject-selection`, { method:'PUT', body: JSON.stringify(payload) });
  api.teacher.getSubjectSelectionRequests = () => apiReq('/api/teacher/subject-selection-requests');
  api.teacher.reviewSubjectSelectionRequest = (id, payload) => apiReq(`/api/teacher/subject-selection-requests/${id}/review`, { method:'POST', body: JSON.stringify(payload) });
  api.admin.verifySubjectSelection = (studentId, payload={}) => apiReq(`/api/admin/students/${studentId}/subject-selection/verify`, { method:'POST', body: JSON.stringify(payload) });
  api.sms.getConfig = () => apiReq('/api/sms/config');
  api.sms.saveConfig = (payload) => apiReq('/api/sms/config', { method:'PUT', body: JSON.stringify(payload) });
  api.sms.send = (payload) => apiReq('/api/sms/send', { method:'POST', body: JSON.stringify(payload) });

  function subjectChecklist(data, formId) {
    const eligible = data.eligibleSubjects || [];
    const selected = new Map((data.selections || []).map(s => [String(s.subjectName || s.name || '').toLowerCase(), s]));
    if (!eligible.length) return `<div class="rounded-xl border bg-card p-6 text-center text-muted-foreground">No valid subjects found for this class. Save the curriculum structure and Add Subjects checklist first.</div>`;
    return `<div id="${formId}" class="space-y-3">
      <div class="grid md:grid-cols-2 gap-3">${eligible.map(sub => {
        const name = sub.subjectName || sub.name || sub.subject;
        const pick = selected.get(String(name).toLowerCase());
        const compulsory = !!sub.isCompulsory;
        const checked = compulsory || !!pick;
        return `<label class="rounded-xl border bg-card p-4 flex items-start gap-3 ${compulsory ? 'opacity-90' : ''}">
          <input type="checkbox" class="mt-1 subject-choice-box" data-subject-name="${esc(name)}" data-subject-id="${esc(sub.subjectId || sub.id || '')}" data-compulsory="${compulsory ? 'true' : 'false'}" ${checked ? 'checked' : ''} ${compulsory ? 'disabled' : ''}>
          <span class="flex-1"><span class="font-semibold">${esc(name)}</span><br><span class="text-xs text-muted-foreground">${compulsory ? 'Compulsory — automatically included' : 'Elective subject'}${pick?.status ? ` • Status: ${esc(pick.status)}` : ''}</span></span>
        </label>`;
      }).join('')}</div>
    </div>`;
  }
  function collectSubjects(containerId) {
    return Array.from(document.querySelectorAll(`#${containerId} .subject-choice-box`)).filter(cb => cb.checked || cb.dataset.compulsory === 'true').map(cb => ({
      subjectId: cb.dataset.subjectId || null,
      subjectName: cb.dataset.subjectName,
      isCompulsory: cb.dataset.compulsory === 'true',
      isElective: cb.dataset.compulsory !== 'true'
    }));
  }
  function selectionHeader(data, who='Student') {
    const student = data.student || {};
    const cls = data.class || {};
    return `<div class="rounded-xl border bg-card p-5">
      <p class="text-xs uppercase tracking-wide text-muted-foreground">Grade 10–12 Subject Choice</p>
      <h2 class="text-2xl font-bold">${esc(student.User?.name || student.name || who)}</h2>
      <p class="text-sm text-muted-foreground">${esc(cls.name || cls.grade || student.grade || 'Class not assigned')} • Student chooses first, parent can help, then teacher/admin verify.</p>
    </div>`;
  }

  window.v110RenderStudentSubjectSelection = async function(){
    const res = await api.student.getSubjectSelection(); const data = res.data || {};
    if (!data.senior) return `${selectionHeader(data)}<div class="rounded-xl border bg-card p-6 text-muted-foreground">This class uses the default curriculum subjects. Subject choices only open when the learner reaches Grade 10, 11 or 12.</div>`;
    return `<div class="space-y-5 animate-fade-in">${selectionHeader(data)}
      <div class="rounded-xl border bg-card p-5 grid md:grid-cols-2 gap-3"><input id="student-pathway" value="${esc(data.selections?.[0]?.pathway || '')}" placeholder="Pathway / career direction" class="rounded-lg border px-3 py-2 bg-background"><input id="student-track" value="${esc(data.selections?.[0]?.track || '')}" placeholder="Track" class="rounded-lg border px-3 py-2 bg-background"></div>
      ${subjectChecklist(data, 'student-subject-form')}
      <button onclick="v110SubmitStudentSubjectSelection()" class="px-5 py-3 rounded-lg bg-primary text-primary-foreground">Submit Subject Choices</button>
    </div>`;
  };
  window.v110SubmitStudentSubjectSelection = async function(){
    const payload = { pathway:$('student-pathway')?.value || '', track:$('student-track')?.value || '', subjects:collectSubjects('student-subject-form') };
    await api.student.saveSubjectSelection(payload); toast('Subject choices submitted for verification'); await window.showDashboardSection?.('subject-selection');
  };

  window.v110RenderParentSubjectChoice = async function(){
    const child = window.dashboardData?.selectedChild?.student || (window.dashboardData?.children || [])[0];
    const childId = window.dashboardData?.selectedChildId || child?.id || child?.studentId;
    if (!childId) return `<div class="text-center py-12 text-muted-foreground">Select or link a child first.</div>`;
    const res = await api.parent.getChildSubjectSelection(childId); const data = res.data || {};
    if (!data.senior) return `${selectionHeader(data, 'Child')}<div class="rounded-xl border bg-card p-6 text-muted-foreground">This child is not yet in Grade 10–12, so the normal curriculum subjects remain active.</div>`;
    return `<div class="space-y-5 animate-fade-in">${selectionHeader(data, 'Child')}
      <div class="rounded-xl border bg-card p-5 grid md:grid-cols-2 gap-3"><input id="parent-pathway" value="${esc(data.selections?.[0]?.pathway || '')}" placeholder="Suggested pathway" class="rounded-lg border px-3 py-2 bg-background"><input id="parent-track" value="${esc(data.selections?.[0]?.track || '')}" placeholder="Suggested track" class="rounded-lg border px-3 py-2 bg-background"></div>
      ${subjectChecklist(data, 'parent-subject-form')}
      <button onclick="v110SubmitParentSubjectChoice('${esc(childId)}')" class="px-5 py-3 rounded-lg bg-primary text-primary-foreground">Save & Send to School</button>
    </div>`;
  };
  window.v110SubmitParentSubjectChoice = async function(childId){
    await api.parent.saveChildSubjectSelection(childId, { pathway:$('parent-pathway')?.value || '', track:$('parent-track')?.value || '', subjects:collectSubjects('parent-subject-form') });
    toast('Subject choices saved and sent for school verification'); await window.showDashboardSection?.('subject-choice');
  };

  window.v110RenderTeacherSubjectRequests = async function(){
    const res = await api.teacher.getSubjectSelectionRequests(); const data = res.data || {}; const requests = data.requests || [];
    return `<div class="space-y-5 animate-fade-in"><div class="rounded-xl border bg-card p-5"><h2 class="text-2xl font-bold">Subject Entry Requests</h2><p class="text-sm text-muted-foreground">Students who chose subjects you teach. Accept or deny entry per subject.</p></div>
      <div class="rounded-xl border bg-card overflow-hidden"><table class="w-full text-sm"><thead class="bg-muted"><tr><th class="p-3 text-left">Student</th><th class="p-3 text-left">Class</th><th class="p-3 text-left">Subject</th><th class="p-3 text-left">Pathway</th><th class="p-3 text-left">Status</th><th class="p-3 text-right">Action</th></tr></thead><tbody>${requests.length ? requests.map(r => `<tr class="border-t"><td class="p-3 font-medium">${esc(r.studentName || r.elimuid || r.studentId)}</td><td class="p-3">${esc(r.className || r.grade || '')}</td><td class="p-3">${esc(r.subjectName)}</td><td class="p-3">${esc(r.pathway || r.track || '')}</td><td class="p-3">${esc(r.status)}</td><td class="p-3 text-right"><button onclick="v110ReviewSubject('${r.id}','accept')" class="px-3 py-1 rounded bg-green-600 text-white">Accept</button> <button onclick="v110ReviewSubject('${r.id}','reject')" class="px-3 py-1 rounded bg-red-600 text-white">Deny</button></td></tr>`).join('') : `<tr><td colspan="6" class="p-8 text-center text-muted-foreground">No subject-choice requests yet.</td></tr>`}</tbody></table></div></div>`;
  };
  window.v110ReviewSubject = async (id, action) => { await api.teacher.reviewSubjectSelectionRequest(id, { action }); toast('Subject request updated'); await window.showDashboardSection?.('subject-requests'); };

  window.v110AdminVerifySubjectSelection = async function(studentId){ await api.admin.verifySubjectSelection(studentId, { status:'verified_by_admin' }); toast('Student subject choices verified'); await window.showDashboardSection?.('student-subject-selection'); };

  function v112PaymentMode(cfg){ return cfg.paymentMode || cfg.mode || (cfg.darajaEnabled && cfg.manualEnabled ? 'both' : cfg.darajaEnabled ? 'daraja' : 'manual'); }
  function v112DarajaSettings(cfg){ return cfg.darajaCredentials || cfg.daraja || {}; }
  function v112PaymentJson(value, fallback){ try { return JSON.parse(value || JSON.stringify(fallback || {})); } catch(e) { toast('JSON field is invalid', 'error'); throw e; } }

  window.v12RenderPlatformPayments = async function(){
    const settings = await (api.payments?.getPlatformSettings ? api.payments.getPlatformSettings() : apiReq('/api/payments/superadmin/platform-settings')).catch(() => ({data:{}}));
    const cfg = settings.data || {};
    const d = v112DarajaSettings(cfg);
    const mode = v112PaymentMode(cfg);
    const reqs = await (api.superAdmin?.getPaymentRequests ? api.superAdmin.getPaymentRequests({status:'pending'}) : apiReq('/api/super-admin/payment-requests?status=pending')).catch(() => ({data:[]}));
    const rows = arr(reqs);
    const manualActive = mode === 'manual' || mode === 'both';
    const darajaActive = mode === 'daraja' || mode === 'both';
    return `<div class="space-y-6 animate-fade-in">
      <div class="rounded-2xl border bg-card p-6 shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div><p class="text-xs uppercase tracking-wide text-muted-foreground">Super Admin Billing</p><h2 class="text-3xl font-bold">Platform Payments</h2><p class="text-sm text-muted-foreground mt-1">Choose how Shule AI collects platform money: manual verification, Daraja STK, or both during rollout.</p></div>
        <div class="grid grid-cols-3 gap-2 text-center text-xs"><div class="rounded-xl border p-3"><b>${esc(mode.toUpperCase())}</b><span class="block text-muted-foreground">Mode</span></div><div class="rounded-xl border p-3"><b>${manualActive ? 'ON':'OFF'}</b><span class="block text-muted-foreground">Manual</span></div><div class="rounded-xl border p-3"><b>${darajaActive ? 'ON':'OFF'}</b><span class="block text-muted-foreground">Daraja</span></div></div>
      </div>
      <div class="grid xl:grid-cols-[1.2fr_.8fr] gap-5">
        <div class="rounded-2xl border bg-card p-6 space-y-5">
          <div class="grid md:grid-cols-3 gap-3">
            ${['manual','daraja','both'].map(m => `<button type="button" onclick="v112SetPlatformPaymentMode('${m}')" class="platform-mode-card rounded-xl border p-4 text-left ${mode===m?'ring-2 ring-primary bg-primary/5':''}" data-mode-card="${m}"><b>${m==='manual'?'Manual Verification':m==='daraja'?'Daraja STK Only':'Manual + Daraja'}</b><small class="block text-muted-foreground mt-1">${m==='manual'?'Admin sends code, super admin confirms.':m==='daraja'?'Cards trigger STK and callback update.':'Use STK where ready, manual as backup.'}</small></button>`).join('')}
          </div>
          <input id="pay-mode" type="hidden" value="${esc(mode)}">
          <div class="grid md:grid-cols-2 gap-4">
            <label class="space-y-1"><span class="text-sm font-medium">Platform account name</span><input id="pay-account" value="${esc(cfg.accountName || 'Shule AI') }" class="w-full rounded-lg border px-3 py-2 bg-background"></label>
            <label class="space-y-1"><span class="text-sm font-medium">Currency</span><input id="pay-currency" value="${esc(cfg.currency || 'KES')}" class="w-full rounded-lg border px-3 py-2 bg-background"></label>
            <label class="space-y-1"><span class="text-sm font-medium">Manual Paybill / shortcode</span><input id="pay-paybill" value="${esc(cfg.paybill || cfg.shortcode || '')}" class="w-full rounded-lg border px-3 py-2 bg-background" placeholder="e.g. 400200"></label>
            <label class="space-y-1"><span class="text-sm font-medium">Manual Till number</span><input id="pay-till" value="${esc(cfg.till || '')}" class="w-full rounded-lg border px-3 py-2 bg-background"></label>
          </div>
          <div id="manual-payment-panel" class="rounded-xl border p-4 space-y-3 ${manualActive?'':'hidden'}">
            <h3 class="font-semibold">Manual verification instructions</h3>
            <textarea id="pay-manual-instructions" rows="4" class="w-full rounded-lg border px-3 py-2 bg-background" placeholder="Tell school admins what code/reference to send.">${esc(cfg.manualInstructions || 'Send M-Pesa confirmation code, amount, school name, and billing plan. Super admin will approve and activate 30 days.')}</textarea>
          </div>
          <div id="daraja-payment-panel" class="rounded-xl border p-4 space-y-3 ${darajaActive?'':'hidden'}">
            <div class="flex items-center justify-between gap-3"><h3 class="font-semibold">Daraja STK credentials</h3><span class="text-xs rounded-full border px-2 py-1">${darajaActive ? 'STK fields active' : 'Inactive until Daraja mode is selected'}</span></div>
            <div class="grid md:grid-cols-2 gap-3">
              <label class="space-y-1"><span class="text-sm font-medium">Environment</span><select id="pay-daraja-env" class="w-full rounded-lg border px-3 py-2 bg-background"><option value="sandbox" ${(d.environment || d.env)==='sandbox'?'selected':''}>Sandbox</option><option value="production" ${(d.environment || d.env)==='production'?'selected':''}>Production</option></select></label>
              <label class="space-y-1"><span class="text-sm font-medium">Business shortcode</span><input id="pay-daraja-shortcode" value="${esc(d.shortcode || d.businessShortCode || cfg.shortcode || '')}" class="w-full rounded-lg border px-3 py-2 bg-background"></label>
              <label class="space-y-1"><span class="text-sm font-medium">Consumer key</span><input id="pay-daraja-key" value="${esc(d.consumerKey || '')}" class="w-full rounded-lg border px-3 py-2 bg-background"></label>
              <label class="space-y-1"><span class="text-sm font-medium">Consumer secret</span><input id="pay-daraja-secret" value="${esc(d.consumerSecret || '')}" class="w-full rounded-lg border px-3 py-2 bg-background" type="password"></label>
              <label class="space-y-1 md:col-span-2"><span class="text-sm font-medium">Passkey</span><input id="pay-daraja-passkey" value="${esc(d.passkey || '')}" class="w-full rounded-lg border px-3 py-2 bg-background"></label>
              <label class="space-y-1 md:col-span-2"><span class="text-sm font-medium">Callback URL</span><input id="pay-daraja-callback" value="${esc(d.callbackUrl || cfg.callbackUrl || '')}" class="w-full rounded-lg border px-3 py-2 bg-background" placeholder="https://your-backend/api/payments/callback"></label>
            </div>
          </div>
          <div class="grid md:grid-cols-2 gap-4">
            <label class="space-y-1"><span class="text-sm font-medium">Parent subscription plans JSON</span><textarea id="pay-parent-plans" rows="5" class="w-full rounded-lg border px-3 py-2 bg-background font-mono text-xs">${esc(JSON.stringify(cfg.parentPlans || [{code:'basic',name:'Basic Parent',amount:100,days:30}], null, 2))}</textarea></label>
            <label class="space-y-1"><span class="text-sm font-medium">School subscription plans JSON</span><textarea id="pay-school-plans" rows="5" class="w-full rounded-lg border px-3 py-2 bg-background font-mono text-xs">${esc(JSON.stringify(cfg.schoolPlans || [{code:'standard',name:'School Standard',amount:100000,days:365}], null, 2))}</textarea></label>
          </div>
          <div class="flex flex-wrap gap-3 items-center">
            <label class="text-sm flex gap-2 items-center"><input id="pay-parent-enabled" type="checkbox" ${cfg.parentSubscriptionsEnabled !== false ? 'checked' : ''}> Parent subscriptions</label>
            <label class="text-sm flex gap-2 items-center"><input id="pay-school-enabled" type="checkbox" ${cfg.schoolSubscriptionsEnabled !== false ? 'checked' : ''}> School subscriptions</label>
            <label class="text-sm flex gap-2 items-center"><input id="pay-namechange-enabled" type="checkbox" ${cfg.nameChangePaymentsEnabled ? 'checked' : ''}> Paid name changes</label>
          </div>
          <div class="flex gap-3"><button onclick="v110SavePlatformPaymentSettings()" class="px-5 py-3 rounded-xl bg-primary text-primary-foreground font-semibold">Save Platform Payment Settings</button><button onclick="v112PingPlatformPaymentMode()" class="px-5 py-3 rounded-xl border">Check Mode</button></div>
        </div>
        <div class="rounded-2xl border bg-card p-6"><div class="flex items-center justify-between gap-3 mb-4"><div><h3 class="font-semibold text-lg">Pending Manual Confirmations</h3><p class="text-sm text-muted-foreground">Approving activates/renews 30 days.</p></div><span class="rounded-full border px-3 py-1 text-sm">${rows.length}</span></div>${rows.length ? `<div class="space-y-3">${rows.map(r => `<div class="border rounded-xl p-4"><div class="flex justify-between gap-3"><div><p class="font-semibold">${esc(r.schoolName || r.schoolCode || 'School')}</p><p class="text-xs text-muted-foreground">${esc(r.method || 'manual')} • ${esc(r.reference || r.mpesaCode || '')}</p><p class="text-sm mt-1">KES ${Number(r.amount || 0).toLocaleString()} ${r.planCode ? '• '+esc(r.planCode) : ''}</p></div><div class="flex flex-col gap-2"><button onclick="v110ReviewPayment('${r.id}','approve')" class="px-3 py-2 rounded-lg bg-green-600 text-white">Approve</button><button onclick="v110ReviewPayment('${r.id}','reject')" class="px-3 py-2 rounded-lg bg-red-600 text-white">Reject</button></div></div></div>`).join('')}</div>` : `<div class="text-center text-muted-foreground py-12">No pending manual payment requests.</div>`}</div>
      </div>
    </div>`;
  };
  window.v112SetPlatformPaymentMode = function(mode){
    const input = $('pay-mode'); if (input) input.value = mode;
    document.querySelectorAll('[data-mode-card]').forEach(card => card.classList.toggle('ring-2', card.dataset.modeCard === mode));
    const manual = mode === 'manual' || mode === 'both';
    const daraja = mode === 'daraja' || mode === 'both';
    $('manual-payment-panel')?.classList.toggle('hidden', !manual);
    $('daraja-payment-panel')?.classList.toggle('hidden', !daraja);
  };
  window.v112PingPlatformPaymentMode = function(){
    const mode = $('pay-mode')?.value || 'manual';
    const msg = mode === 'manual' ? 'Manual mode: schools submit M-Pesa codes; super admin confirms.' : mode === 'daraja' ? 'Daraja mode: subscription cards should trigger STK and callbacks update status.' : 'Both mode: STK is preferred, manual verification remains as backup.';
    toast(msg, 'info');
  };
  window.v110SavePlatformPaymentSettings = async function(){
    const mode = $('pay-mode')?.value || 'manual';
    const daraja = {
      environment:$('pay-daraja-env')?.value || 'sandbox',
      shortcode:$('pay-daraja-shortcode')?.value || '',
      consumerKey:$('pay-daraja-key')?.value || '',
      consumerSecret:$('pay-daraja-secret')?.value || '',
      passkey:$('pay-daraja-passkey')?.value || '',
      callbackUrl:$('pay-daraja-callback')?.value || ''
    };
    const payload = {
      paymentMode: mode,
      mode,
      manualEnabled: mode === 'manual' || mode === 'both',
      darajaEnabled: mode === 'daraja' || mode === 'both',
      accountName:$('pay-account')?.value || 'Shule AI',
      currency:$('pay-currency')?.value || 'KES',
      paybill:$('pay-paybill')?.value || '',
      till:$('pay-till')?.value || '',
      manualInstructions:$('pay-manual-instructions')?.value || '',
      darajaCredentials: daraja,
      daraja,
      parentSubscriptionsEnabled: !!$('pay-parent-enabled')?.checked,
      schoolSubscriptionsEnabled: !!$('pay-school-enabled')?.checked,
      nameChangePaymentsEnabled: !!$('pay-namechange-enabled')?.checked,
      parentPlans: v112PaymentJson($('pay-parent-plans')?.value, []),
      schoolPlans: v112PaymentJson($('pay-school-plans')?.value, [])
    };
    await (api.payments?.updatePlatformSettings ? api.payments.updatePlatformSettings(payload) : apiReq('/api/payments/superadmin/platform-settings', {method:'PUT', body:JSON.stringify(payload)}));
    toast('Platform payment settings saved');
    await window.showDashboardSection?.('platform-payments');
  };
  window.v110ReviewPayment = async function(id, action){ await api.superAdmin.reviewPaymentRequest(id, { action, reviewNotes: action === 'approve' ? 'Confirmed manual M-Pesa payment; activate 30 days.' : 'Rejected by super admin' }); toast(`Payment ${action}d`); await window.showDashboardSection?.('platform-payments'); };


  function msgAttachment(m){ const a = m.metadata?.attachment || m.attachment; if(!a) return ''; const url = a.url || a.fileUrl || a.path; return `<div class="mt-2 text-xs"><a class="underline" target="_blank" href="${esc(url || '#')}">📎 ${esc(a.originalName || a.filename || 'Attachment')}</a></div>`; }
  window.loadParentRecipientConversation = async function(){
    const type = $('parent-recipient-type')?.value || 'teacher'; const box = $('parent-chat-messages'); if(!box) return;
    box.innerHTML = '<div class="text-center text-muted-foreground py-8">Loading conversation...</div>';
    const conv = await api.parent.getConversations().catch(()=>({data:[]})); const conversations = arr(conv);
    const match = conversations.find(c => (type === 'teacher' && c.conversationType === 'parent_class_teacher') || (type === 'admin' && c.conversationType === 'parent_admin'));
    const messages = match?.userId ? arr(await api.parent.getMessages(match.userId).catch(()=>({data:match.messages || []}))) : [];
    const me = JSON.parse(localStorage.getItem('user') || '{}');
    box.innerHTML = messages.length ? messages.map(m => { const mine = Number(m.senderId) === Number(me.id); return `<div class="flex ${mine?'justify-end':'justify-start'}"><div class="max-w-[75%] rounded-2xl px-4 py-2 ${mine?'bg-primary text-primary-foreground':'bg-background border'}"><p class="text-sm whitespace-pre-wrap">${esc(m.content)}</p>${msgAttachment(m)}<p class="text-[10px] opacity-70 mt-1">${new Date(m.createdAt).toLocaleString()}</p></div></div>`; }).join('') : '<div class="text-center text-muted-foreground py-8">No messages yet. Send the first message.</div>';
    box.scrollTop = box.scrollHeight;
  };
  window.sendParentMessage = async function(){
    const input = $('parent-chat-input'); const file = $('parent-chat-attachment')?.files?.[0] || null; const text = input?.value?.trim() || '';
    const selectedChild = window.dashboardData?.selectedChild?.student || (window.dashboardData?.children || [])[0]; const studentId = window.dashboardData?.selectedChildId || selectedChild?.id || selectedChild?.studentId;
    if(!studentId) return toast('Select a child first','error'); if(!text && !file) return toast('Type a message or attach a file','error');
    let attachment = null;
    if(file && api.chatV9?.uploadAttachment){ const fd = new FormData(); fd.append('file', file); const up = await api.chatV9.uploadAttachment(fd); attachment = up.data || up.file || up; attachment.originalName = attachment.originalName || file.name; }
    await api.parent.sendMessage({ studentId, message:text || file?.name || '', recipientType:$('parent-recipient-type')?.value || 'teacher', attachment });
    if(input) input.value=''; if($('parent-chat-attachment')) $('parent-chat-attachment').value=''; await window.loadParentRecipientConversation();
  };

  const oldRenderParentChat = window.renderParentChat;
  window.renderParentChat = async function(){
    const html = oldRenderParentChat ? await oldRenderParentChat() : '<div></div>';
    if (html.includes('parent-chat-attachment')) return html;
    return html.replace('<div class="flex gap-2">', '<div class="flex gap-2 mb-2"><input type="file" id="parent-chat-attachment" class="flex-1 rounded-lg border px-3 py-2 text-sm bg-background" accept="image/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"></div><div class="flex gap-2">');
  };


  window.v112RenderSuperAdminAnalytics = async function(){
    const res = await (api.superAdmin?.getAnalytics ? api.superAdmin.getAnalytics() : apiReq('/api/super-admin/analytics')).catch(() => ({data:{}}));
    const d = res.data || {};
    if (typeof renderSuperAdminAnalytics === 'function') return renderSuperAdminAnalytics(d);
    return window.v110RenderSuperAdminAnalytics ? window.v110RenderSuperAdminAnalytics() : '<div class="p-6">Platform analytics unavailable.</div>';
  };

  window.v110RenderSuperAdminAnalytics = async function(){
    const res = await (api.superAdmin?.getAnalytics ? api.superAdmin.getAnalytics() : apiReq('/api/super-admin/analytics')).catch(() => ({data:{}}));
    const d = res.data || {}; const ov = d.overview || d || {};
    const cards = [
      ['Schools', ov.totalSchools || ov.schools || 0], ['Students', ov.totalStudents || ov.students || 0], ['Teachers', ov.totalTeachers || ov.teachers || 0], ['Parents', ov.totalParents || ov.parents || 0], ['Revenue', `KES ${Number(ov.totalRevenue || ov.revenue || 0).toLocaleString()}`]
    ];
    return `<div class="space-y-6 animate-fade-in"><div class="rounded-xl border bg-card p-5"><h2 class="text-2xl font-bold">Platform Analytics</h2><p class="text-sm text-muted-foreground">Super-admin platform totals only. This does not use a single school/admin analytics scope.</p></div><div class="grid gap-4 md:grid-cols-2 lg:grid-cols-5">${cards.map(c => `<div class="rounded-xl border bg-card p-5"><p class="text-sm text-muted-foreground">${esc(c[0])}</p><h3 class="text-2xl font-bold mt-1">${esc(c[1])}</h3></div>`).join('')}</div><div class="rounded-xl border bg-card p-5"><h3 class="font-semibold mb-3">Raw platform snapshot</h3><pre class="text-xs overflow-auto bg-muted p-3 rounded-lg">${esc(JSON.stringify(d, null, 2))}</pre></div></div>`;
  };

  window.v110RenderSuperAdminHealth = async function(){
    const status = await apiReq('/api/super-admin/system/status').catch(() => null);
    const metrics = await apiReq('/api/super-admin/metrics').catch(() => null);
    return `<div class="space-y-5 animate-fade-in"><div class="rounded-xl border bg-card p-5"><h2 class="text-2xl font-bold">Platform Health</h2><p class="text-sm text-muted-foreground">Live checks only. If a metric is unavailable, it is shown as unavailable instead of fake alerts.</p></div><div class="grid md:grid-cols-2 gap-4"><div class="rounded-xl border bg-card p-5"><h3 class="font-semibold mb-2">System Status</h3><pre class="text-xs overflow-auto bg-muted p-3 rounded">${esc(JSON.stringify(status?.data || status || {status:'unavailable'}, null, 2))}</pre></div><div class="rounded-xl border bg-card p-5"><h3 class="font-semibold mb-2">Metrics</h3><pre class="text-xs overflow-auto bg-muted p-3 rounded">${esc(JSON.stringify(metrics?.data || metrics || {metrics:'unavailable'}, null, 2))}</pre></div></div></div>`;
  };

  const oldStudent = window.renderStudentSection;
  window.renderStudentSection = async function(section){ if(section === 'subject-selection') return await window.v110RenderStudentSubjectSelection(); return oldStudent ? oldStudent(section) : ''; };
  const oldParent = window.renderParentSection;
  window.renderParentSection = async function(section){ if(section === 'subject-choice') return await window.v110RenderParentSubjectChoice(); if(section === 'chat') return await window.renderParentChat(); return oldParent ? oldParent(section) : ''; };
  const oldTeacher = window.renderTeacherSection;
  window.renderTeacherSection = async function(section){ if(section === 'subject-requests') return await window.v110RenderTeacherSubjectRequests(); return oldTeacher ? oldTeacher(section) : ''; };
  const oldAdmin = window.renderAdminSection;
  window.renderAdminSection = async function(section){ if(section === 'sms') return await window.v110RenderSms(); return oldAdmin ? oldAdmin(section) : ''; };
  const oldSuper = window.renderSuperAdminSection;
  window.renderSuperAdminSection = async function(section){ if(section === 'platform-payments') return await window.v12RenderPlatformPayments(); if(section === 'sms') return await window.v110RenderSms(); if(section === 'analytics') return await window.v112RenderSuperAdminAnalytics(); if(section === 'platform-health') return await window.v110RenderSuperAdminHealth(); return oldSuper ? oldSuper(section) : ''; };

  const oldBrandApply = window.BrandingManager?.apply;
  if (window.BrandingManager && oldBrandApply) {
    window.BrandingManager.apply = function(){
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (String(user.role || '').replace('-','_') === 'super_admin') {
        const el = document.getElementById('sidebar-school-name'); if (el) el.textContent = 'Shule AI';
        return;
      }
      return oldBrandApply.apply(this, arguments);
    };
  }
})();
