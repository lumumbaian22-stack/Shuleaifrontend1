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

  window.v12RenderPlatformPayments = async function(){
    const settings = await (api.payments?.getPlatformSettings ? api.payments.getPlatformSettings() : apiReq('/api/payments/platform-settings')).catch(() => ({data:{}}));
    const cfg = settings.data || {};
    const reqs = await (api.superAdmin?.getPaymentRequests ? api.superAdmin.getPaymentRequests({status:'pending'}) : apiReq('/api/super-admin/payment-requests?status=pending')).catch(() => ({data:[]}));
    const rows = arr(reqs);
    return `<div class="space-y-6 animate-fade-in"><div class="rounded-xl border bg-card p-5"><h2 class="text-2xl font-bold">Platform Payments</h2><p class="text-sm text-muted-foreground">Manual M-Pesa confirmation now; Daraja credentials can be added later for STK automation.</p></div>
      <div class="grid lg:grid-cols-2 gap-5"><div class="rounded-xl border bg-card p-5 space-y-3"><h3 class="font-semibold">Payment Method & Credentials</h3>
        <select id="pay-mode" class="w-full rounded-lg border px-3 py-2 bg-background"><option value="manual">Manual Verification</option><option value="daraja">Daraja STK</option><option value="mixed">Manual + Daraja</option></select>
        <input id="pay-account" value="${esc(cfg.accountName || 'Shule AI')}" class="w-full rounded-lg border px-3 py-2 bg-background" placeholder="Account name">
        <input id="pay-paybill" value="${esc(cfg.paybill || '')}" class="w-full rounded-lg border px-3 py-2 bg-background" placeholder="Paybill / shortcode">
        <input id="pay-till" value="${esc(cfg.till || '')}" class="w-full rounded-lg border px-3 py-2 bg-background" placeholder="Till number">
        <textarea id="pay-daraja" rows="6" class="w-full rounded-lg border px-3 py-2 bg-background font-mono text-xs" placeholder='Daraja JSON credentials'>${esc(JSON.stringify(cfg.daraja || {}, null, 2))}</textarea>
        <button onclick="v110SavePlatformPaymentSettings()" class="px-4 py-2 rounded-lg bg-primary text-primary-foreground">Save Payment Settings</button>
      </div><div class="rounded-xl border bg-card p-5"><h3 class="font-semibold mb-3">Pending Manual Payment Confirmations</h3>${rows.length ? `<div class="space-y-3">${rows.map(r => `<div class="border rounded-lg p-3"><div class="flex justify-between gap-2"><div><p class="font-semibold">${esc(r.schoolName || r.schoolCode)}</p><p class="text-xs text-muted-foreground">${esc(r.method)} • ${esc(r.reference)} • KES ${Number(r.amount || 0).toLocaleString()}</p></div><div class="flex gap-2"><button onclick="v110ReviewPayment('${r.id}','approve')" class="px-3 py-1 rounded bg-green-600 text-white">Approve 30 days</button><button onclick="v110ReviewPayment('${r.id}','reject')" class="px-3 py-1 rounded bg-red-600 text-white">Reject</button></div></div></div>`).join('')}</div>` : `<p class="text-sm text-muted-foreground">No pending requests.</p>`}</div></div></div>`;
  };
  window.v110SavePlatformPaymentSettings = async function(){
    let daraja = {}; try { daraja = JSON.parse($('pay-daraja')?.value || '{}'); } catch(e) { return toast('Daraja JSON is invalid', 'error'); }
    const payload = { mode:$('pay-mode')?.value || 'manual', accountName:$('pay-account')?.value || 'Shule AI', paybill:$('pay-paybill')?.value || '', till:$('pay-till')?.value || '', daraja };
    await (api.payments?.updatePlatformSettings ? api.payments.updatePlatformSettings(payload) : apiReq('/api/payments/platform-settings', {method:'PUT', body:JSON.stringify(payload)}));
    toast('Platform payment settings saved');
  };
  window.v110ReviewPayment = async function(id, action){ await api.superAdmin.reviewPaymentRequest(id, { action, reviewNotes: action === 'approve' ? 'Confirmed manual M-Pesa payment; activate 30 days.' : 'Rejected by super admin' }); toast(`Payment ${action}d`); await window.showDashboardSection?.('platform-payments'); };

  window.v110RenderSms = async function(){
    const res = await api.sms.getConfig().catch(() => ({data:{}})); const cfg = res.data || {};
    return `<div class="space-y-5 animate-fade-in"><div class="rounded-xl border bg-card p-5"><h2 class="text-2xl font-bold">Bulk SMS</h2><p class="text-sm text-muted-foreground">Provider-neutral SMS module. Add provider credentials later; schools can be token-limited by subscription.</p></div>
      <div class="grid lg:grid-cols-2 gap-5"><div class="rounded-xl border bg-card p-5 space-y-3"><h3 class="font-semibold">SMS Settings</h3><input id="sms-sender" value="${esc(cfg.senderId || 'SHULEAI')}" class="w-full rounded-lg border px-3 py-2 bg-background" placeholder="Sender ID"><input id="sms-provider" value="${esc(cfg.activeProvider || 'noop')}" class="w-full rounded-lg border px-3 py-2 bg-background" placeholder="Provider key"><input id="sms-tokens" type="number" value="${Number(cfg.tokenBalance || 0)}" class="w-full rounded-lg border px-3 py-2 bg-background" placeholder="Token balance"><textarea id="sms-providers" rows="6" class="w-full rounded-lg border px-3 py-2 bg-background font-mono text-xs" placeholder="Provider credentials JSON array">${esc(JSON.stringify(cfg.providers || [], null, 2))}</textarea><label class="flex gap-2 items-center text-sm"><input id="sms-ready" type="checkbox" ${cfg.apiReady ? 'checked' : ''}> API provider connected</label><button onclick="v110SaveSmsConfig()" class="px-4 py-2 rounded-lg bg-primary text-primary-foreground">Save SMS Config</button></div>
      <div class="rounded-xl border bg-card p-5 space-y-3"><h3 class="font-semibold">Test / Draft SMS</h3><input id="sms-recipients" class="w-full rounded-lg border px-3 py-2 bg-background" placeholder="Phone numbers, comma separated"><textarea id="sms-message" rows="5" class="w-full rounded-lg border px-3 py-2 bg-background" placeholder="Message"></textarea><button onclick="v110SendSmsDraft()" class="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground">Validate / Queue SMS</button><p class="text-xs text-muted-foreground">Current usage: ${Number(cfg.usedThisMonth || 0)} used from ${Number(cfg.tokenBalance || 0)} tokens.</p></div></div></div>`;
  };
  window.v110SaveSmsConfig = async function(){
    let providers = []; try { providers = JSON.parse($('sms-providers')?.value || '[]'); } catch(e) { return toast('Provider JSON is invalid', 'error'); }
    await api.sms.saveConfig({ senderId:$('sms-sender')?.value || 'SHULEAI', activeProvider:$('sms-provider')?.value || 'noop', tokenBalance:Number($('sms-tokens')?.value || 0), providers, apiReady:!!$('sms-ready')?.checked }); toast('SMS settings saved');
  };
  window.v110SendSmsDraft = async function(){
    const recipients = ($('sms-recipients')?.value || '').split(',').map(x=>x.trim()).filter(Boolean); const message = $('sms-message')?.value || '';
    const res = await api.sms.send({ recipients, message }); toast(res.message || 'SMS request processed');
  };

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
  window.renderSuperAdminSection = async function(section){ if(section === 'platform-payments') return await window.v12RenderPlatformPayments(); if(section === 'sms') return await window.v110RenderSms(); if(section === 'analytics') return await window.v110RenderSuperAdminAnalytics(); if(section === 'platform-health') return await window.v110RenderSuperAdminHealth(); return oldSuper ? oldSuper(section) : ''; };

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
