// Shule AI v146 — grounded consolidation helpers.
(function (w) {
  'use strict';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const currentUser = () => { try { return typeof getCurrentUser === 'function' ? getCurrentUser() : JSON.parse(localStorage.getItem('user') || '{}'); } catch (_) { return {}; } };
  const unwrap = response => response?.data?.data ?? response?.data ?? response ?? {};
  const array = value => Array.isArray(value) ? value : [];
  const toast = (message, type='info') => typeof showToast === 'function' ? showToast(message, type) : console.log(message);
  const uuid = () => w.crypto?.randomUUID?.() || `act-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  // ---------- Recent alerts: one shared source for every dashboard ----------
  async function renderRecentAlertsPreview() {
    const host = document.getElementById('dashboard-recent-alerts-v146');
    if (!host) return;
    host.innerHTML = '<div class="text-sm text-muted-foreground">Loading alerts…</div>';
    try {
      const childId = String(w.dashboardData?.selectedChildId || localStorage.getItem('shule_selected_child_id') || '').trim();
      const role = String(currentUser()?.role || '').toLowerCase();
      const response = await apiRequest(`/api/alerts?limit=5${role === 'parent' && childId ? `&studentId=${encodeURIComponent(childId)}` : ''}`);
      const rows = array(response?.data).slice(0,5);
      host.innerHTML = rows.length ? rows.map(alert => `
        <button class="w-full text-left rounded-lg border p-3 hover:bg-accent ${alert.isRead ? '' : 'bg-primary/5'}" onclick="showDashboardSection('alerts')">
          <div class="flex items-start justify-between gap-3"><strong class="text-sm">${esc(alert.title || 'Alert')}</strong><span class="text-[11px] text-muted-foreground">${new Date(alert.createdAt || Date.now()).toLocaleString()}</span></div>
          <p class="mt-1 text-xs text-muted-foreground">${esc(alert.sourceLabel || alert.data?.sourceLabel || 'Shule AI System')} • ${esc(alert.message || '')}</p>
        </button>`).join('') : '<div class="rounded-lg bg-muted/30 p-4 text-sm text-muted-foreground">No recent alerts.</div>';
    } catch (error) {
      host.innerHTML = `<div class="text-sm text-red-600">${esc(error.message || 'Alerts could not load.')}</div>`;
    }
  }
  w.renderRecentAlertsPreview = renderRecentAlertsPreview;

  // ---------- Parent chat: selected-child scoped, optimistic, realtime ----------
  const parentChat = { conversations: [], active: null, messages: [], clientIds: new Set() };
  function parentChildId(){ return String(w.dashboardData?.selectedChildId || localStorage.getItem('shule_selected_child_id') || '').trim(); }
  function parentConversationType(){ return document.getElementById('parent-recipient-type')?.value === 'admin' ? 'parent_admin' : 'parent_class_teacher'; }
  function parentChatPartnerLabel(){ return parentConversationType() === 'parent_admin' ? 'School Administration' : 'Class Teacher'; }
  function messageKey(m){ return String(m?.id || m?.clientMessageId || m?.metadata?.clientMessageId || ''); }
  function normalizeParentMessage(m={}){
    const meta=m.metadata||{};
    return { ...m, conversationKey:m.conversationKey||m.conversationId||meta.conversationKey||'', clientMessageId:m.clientMessageId||meta.clientMessageId||null, senderName:m.Sender?.name||m.senderName||meta.senderName||meta.teacherName||meta.parentName||'School Staff' };
  }
  function renderParentMessageRows(forceBottom=false){
    const host=document.getElementById('parent-chat-messages'); if(!host)return;
    const nearBottom=forceBottom || host.scrollHeight-host.scrollTop-host.clientHeight<100;
    const me=Number(currentUser()?.id);
    host.innerHTML=parentChat.messages.length?parentChat.messages.map(raw=>{const m=normalizeParentMessage(raw);const mine=Number(m.senderId)===me;const status=m.pending?'Sending…':m.failed?'Failed — tap Retry':(m.deliveryStatus==='read'?'Read':m.deliveryStatus==='delivered'?'Delivered':'Sent');return `<div class="flex ${mine?'justify-end':'justify-start'}" data-parent-message="${esc(messageKey(m))}"><div class="${mine?'chat-bubble-sent':'chat-bubble-received'} max-w-[78%]"><p class="text-xs font-semibold">${mine?'You':esc(m.senderName)}</p><p class="text-sm whitespace-pre-wrap">${esc(m.content||'')}</p><div class="mt-1 flex items-center justify-between gap-3 text-[10px] opacity-75"><span>${new Date(m.createdAt||Date.now()).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</span>${mine?`<button ${m.failed?`onclick="retryParentMessage('${esc(m.clientMessageId||'')}')"`:''}>${status}</button>`:''}</div></div></div>`}).join(''):'<div class="text-center text-muted-foreground py-10">No messages yet. Start the conversation.</div>';
    if(nearBottom)host.scrollTop=host.scrollHeight;
  }
  function upsertParentMessage(raw){
    const item=normalizeParentMessage(raw); const key=messageKey(item);
    const idx=parentChat.messages.findIndex(m => (item.clientMessageId && normalizeParentMessage(m).clientMessageId===item.clientMessageId) || (key && messageKey(m)===key));
    if(idx>=0)parentChat.messages[idx]={...parentChat.messages[idx],...item,pending:false,failed:false}; else parentChat.messages.push(item);
    parentChat.messages.sort((a,b)=>new Date(a.createdAt||0)-new Date(b.createdAt||0)); renderParentMessageRows();
  }
  async function loadParentRecipientConversation(){
    const host=document.getElementById('parent-chat-messages'); if(!host)return;
    host.innerHTML='<div class="text-center text-muted-foreground py-10">Loading conversation…</div>';
    try{
      const childId=parentChildId();
      const response=await api.parent.getConversations({studentId:childId});
      parentChat.conversations=array(response?.data);
      const wanted=parentConversationType();
      parentChat.active=parentChat.conversations.find(c=>String(c.conversationType)===wanted && (!childId || String(c.studentId||'')===childId)) || null;
      if(parentChat.active?.userId){
        const detail=await api.parent.getMessages(parentChat.active.userId,{studentId:childId,recipientType:document.getElementById('parent-recipient-type')?.value||'teacher'});
        parentChat.messages=array(detail?.data).slice().sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt));
      } else parentChat.messages=[];
      if(parentChat.active?.conversationKey) w.ShuleRealtime?.joinConversation?.(parentChat.active.conversationKey); else w.ShuleRealtime?.leaveConversation?.();
      parentChat.messages.filter(m=>Number(m.receiverId)===Number(currentUser()?.id)&&!m.isRead&&m.id).forEach(m=>w.socket?.emit('chat:message_read',{messageId:m.id}));
      renderParentMessageRows(true);
      const title=document.getElementById('parent-chat-current-title'); if(title)title.textContent=parentChatPartnerLabel();
    }catch(error){host.innerHTML=`<div class="text-center text-red-600 py-10">${esc(error.message||'Conversation failed to load.')}</div>`;}
  }
  async function sendParentMessageV146(){
    const input=document.getElementById('parent-chat-input'); const content=String(input?.value||'').trim(); const childId=parentChildId();
    if(!childId)return toast('Select a child first.','error'); if(!content)return;
    const clientMessageId=uuid(); const temp={id:`temp-${clientMessageId}`,clientMessageId,senderId:currentUser()?.id,content,createdAt:new Date().toISOString(),pending:true,deliveryStatus:'sending',metadata:{clientMessageId,conversationKey:parentChat.active?.conversationKey||''}};
    parentChat.messages.push(temp); input.value=''; renderParentMessageRows(true);
    try{
      const response=await api.parent.sendMessage({studentId:Number(childId),recipientType:document.getElementById('parent-recipient-type')?.value||'teacher',message:content,clientMessageId});
      upsertParentMessage({...response.data,clientMessageId,pending:false});
      if(response.data?.conversationKey){parentChat.active={...(parentChat.active||{}),conversationKey:response.data.conversationKey};w.ShuleRealtime?.joinConversation?.(response.data.conversationKey);}
    }catch(error){const row=parentChat.messages.find(m=>normalizeParentMessage(m).clientMessageId===clientMessageId);if(row){row.pending=false;row.failed=true;}renderParentMessageRows();toast(error.message||'Message failed.','error');}
  }
  async function retryParentMessage(clientMessageId){
    const row=parentChat.messages.find(m=>normalizeParentMessage(m).clientMessageId===clientMessageId); if(!row)return;
    document.getElementById('parent-chat-input').value=row.content||''; parentChat.messages=parentChat.messages.filter(m=>normalizeParentMessage(m).clientMessageId!==clientMessageId); renderParentMessageRows(); return sendParentMessageV146();
  }
  w.loadParentRecipientConversation=loadParentRecipientConversation;
  w.sendParentMessage=sendParentMessageV146;
  w.retryParentMessage=retryParentMessage;
  w.addEventListener('shule:realtime-event', event=>{
    const evt=event.detail||{}; if(!String(evt.type||'').startsWith('chat:'))return;
    const data=normalizeParentMessage(evt.data||{}); const user=currentUser();
    const incomingKey=String(data.conversationKey||data.conversationId||data.metadata?.conversationKey||'');
    if(String(user.role)==='parent'){
      const activeKey=String(parentChat.active?.conversationKey||'');
      if(activeKey && incomingKey===activeKey){
        if(evt.type==='chat:message_created'||evt.type==='chat:message_updated'||evt.type==='chat:message_edited'||evt.type==='chat:message_deleted')upsertParentMessage(data);
        if((evt.type==='chat:message_delivered'||evt.type==='chat:message_read')&&data.messageId){const row=parentChat.messages.find(m=>String(m.id)===String(data.messageId));if(row){row.deliveryStatus=evt.type.endsWith('read')?'read':'delivered';renderParentMessageRows();}}
        if(evt.type==='chat:message_created'&&Number(data.senderId)!==Number(user.id)&&data.id)w.socket?.emit('chat:message_read',{messageId:data.id});
      }
    }
    if(String(user.role)==='admin' && document.getElementById('admin-parent-chat-modal') && !document.getElementById('admin-parent-chat-modal').classList.contains('hidden')){
      const activeKey=String(w.__activeAdminParentConversationKey||'');
      const activeParent=String(w.__activeAdminParentId||'');
      if((activeKey&&incomingKey===activeKey)||String(data.senderId||data.receiverId||'')===activeParent){
        if(evt.type==='chat:message_created'||evt.type==='chat:message_updated'||evt.type==='chat:message_edited'||evt.type==='chat:message_deleted')w.openAdminParentConversation?.(activeParent);
      }
    }
  });

  // ---------- Mixed-class CSV admission ----------
  function showStudentCsvUploadModal(){
    document.getElementById('student-csv-modal-v146')?.remove();
    const modal=document.createElement('div');modal.id='student-csv-modal-v146';modal.className='fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-4';
    modal.innerHTML=`<div class="w-full max-w-2xl rounded-2xl bg-card p-6 shadow-2xl"><div class="flex items-start justify-between"><div><h3 class="text-xl font-bold">Upload students from multiple classes</h3><p class="text-sm text-muted-foreground">The Class column is matched to real school classes. Successful rows receive unique Elimu IDs; failed rows are reported separately.</p></div><button onclick="document.getElementById('student-csv-modal-v146').remove()" class="text-2xl">×</button></div><div class="mt-5 rounded-xl border p-4"><input id="student-csv-file-v146" type="file" accept=".csv,text/csv" class="w-full"><p class="mt-2 text-xs text-muted-foreground">Recommended columns: name, email, class, stream, parentName, parentPhone, parentEmail, dob, gender.</p></div><div id="student-csv-result-v146" class="mt-4"></div><div class="mt-5 flex justify-end gap-2"><button onclick="downloadStudentCsvTemplateV146()" class="rounded-lg border px-4 py-2">Download template</button><button onclick="uploadStudentCsvV146()" class="rounded-lg bg-primary px-4 py-2 text-white">Upload and sort students</button></div></div>`;
    document.body.appendChild(modal);
  }
  function downloadStudentCsvTemplateV146(){
    const csv='name,email,class,stream,parentName,parentPhone,parentEmail,dob,gender\nAmina Otieno,,Grade 5,North,Jane Otieno,0712345678,,2015-01-10,F\n';
    const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download='Shule_AI_Mixed_Class_Student_Import.csv';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  }
  async function uploadStudentCsvV146(){
    const file=document.getElementById('student-csv-file-v146')?.files?.[0];const result=document.getElementById('student-csv-result-v146');if(!file)return toast('Choose a CSV file.','warning');
    result.innerHTML='<div class="text-sm text-muted-foreground">Uploading and validating…</div>';
    try{const form=new FormData();form.append('file',file);const response=await api.upload.uploadStudents(form);const data=unwrap(response);const stats=data.stats||data;const errors=array(data.errors||data.failedRows);window.__studentImportErrorsV146=errors;result.innerHTML=`<div class="rounded-xl border p-4"><strong>${Number(stats.created||0)} students created</strong><p class="text-sm text-muted-foreground">${Number(stats.processed||0)} processed • ${errors.length} failed</p>${errors.length?`<button onclick="downloadStudentImportErrorsV146()" class="mt-3 rounded-lg border px-3 py-2 text-sm">Download failed rows CSV</button>`:''}</div>`;toast('Student import completed.','success');setTimeout(()=>showDashboardSection('students'),500);}catch(error){result.innerHTML=`<div class="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">${esc(error.message||'Upload failed.')}</div>`;}
  }
  function downloadStudentImportErrorsV146(){
    const rows=Array.isArray(window.__studentImportErrorsV146)?window.__studentImportErrorsV146:[];const headers=['row','name','class','error'];const lines=[headers.join(',')].concat(rows.map((r,i)=>[r.row||i+2,r.name||r.data?.name||'',r.class||r.data?.class||r.data?.grade||'',r.error||r.message||'Invalid row'].map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')));const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([lines.join('\n')],{type:'text/csv'}));a.download='Shule_AI_Student_Import_Errors.csv';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  }
  w.showStudentCsvUploadModal=showStudentCsvUploadModal;w.downloadStudentCsvTemplateV146=downloadStudentCsvTemplateV146;w.uploadStudentCsvV146=uploadStudentCsvV146;w.downloadStudentImportErrorsV146=downloadStudentImportErrorsV146;

  // ---------- Student School Cycle: one section, tabbed workflows ----------
  let cycleTab='overview';
  const cycleTabs=[['overview','Student Overview','users'],['transition','Academic Year Transition','arrow-up-right'],['attendance','Attendance Corrections','clipboard-check'],['reports','Report History','file-clock'],['birthdays','Birthdays & Ages','cake'],['transfers','Transfers & Withdrawals','repeat-2'],['enrolments','Enrolment History','history']];
  async function renderStudentSchoolCycle(){
    setTimeout(()=>studentCycleOpen(cycleTab),50);
    return `<div class="space-y-5 animate-fade-in"><div><p class="text-xs uppercase tracking-wide text-muted-foreground">Continuous learner history</p><h2 class="text-2xl font-bold">Student School Cycle</h2><p class="text-sm text-muted-foreground">Admission, attendance, reports, promotions, transfers and graduation are kept together without deleting previous records.</p></div><div class="flex gap-2 overflow-x-auto pb-1">${cycleTabs.map(([id,label,icon])=>`<button id="cycle-tab-${id}" onclick="studentCycleOpen('${id}')" class="shrink-0 rounded-lg border px-3 py-2 text-sm flex items-center gap-2"><i data-lucide="${icon}" class="h-4 w-4"></i>${label}</button>`).join('')}</div><div id="student-cycle-workspace" class="min-h-[320px]"><div class="rounded-xl border bg-card p-8 text-center text-muted-foreground">Loading student school cycle…</div></div></div>`;
  }
  async function cycleOverview(){
    const [classesRes,studentsRes]=await Promise.all([api.admin.getClasses(),api.admin.getStudents()]);const classes=array(unwrap(classesRes));const students=array(unwrap(studentsRes));return `<div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">${classes.map(cls=>{const count=students.filter(s=>String(s.classId||'')===String(cls.id)||(!s.classId&&String(s.grade||'')===String(cls.name||''))).length;return `<button onclick="localStorage.setItem('adminSelectedClass','${esc(cls.name)}');showDashboardSection('students')" class="rounded-xl border bg-card p-5 text-left hover:bg-accent"><strong>${esc(cls.name||cls.grade||'Class')}</strong><p class="mt-1 text-sm text-muted-foreground">${count} students • ${esc(cls.stream||'No stream')}</p></button>`}).join('')||'<div class="rounded-xl border p-6 text-muted-foreground">No classes configured.</div>'}</div>`;
  }
  async function cycleReportHistory(){
    const [classesRes,studentsRes]=await Promise.all([api.admin.getClasses(),api.admin.getStudents()]);const classes=array(unwrap(classesRes));const students=array(unwrap(studentsRes));window.__cycleReportStudents=students;return `<div class="space-y-4"><div class="rounded-xl border bg-card p-5"><h3 class="font-semibold">Report History</h3><p class="text-sm text-muted-foreground">Select a class first, then a student. Reports are never shown as one school-wide flat list.</p><div class="mt-4 grid gap-3 md:grid-cols-2"><label class="text-sm">Class<select id="cycle-report-class" onchange="cyclePopulateReportStudents()" class="mt-1 w-full rounded-lg border bg-background p-2"><option value="">Choose class</option>${classes.map(c=>`<option value="${c.id}">${esc(c.name||c.grade)}</option>`).join('')}</select></label><label class="text-sm">Student<select id="cycle-report-student" onchange="cycleLoadStudentReports()" class="mt-1 w-full rounded-lg border bg-background p-2"><option value="">Choose student</option></select></label></div></div><div id="cycle-report-list" class="rounded-xl border bg-card p-5 text-muted-foreground">Choose a class and student.</div></div>`;
  }
  async function studentCycleOpen(tab){
    cycleTab=tab;document.querySelectorAll('[id^="cycle-tab-"]').forEach(btn=>btn.classList.toggle('bg-primary',btn.id===`cycle-tab-${tab}`));document.querySelectorAll('[id^="cycle-tab-"]').forEach(btn=>btn.classList.toggle('text-white',btn.id===`cycle-tab-${tab}`));const host=document.getElementById('student-cycle-workspace');if(!host)return;host.innerHTML='<div class="rounded-xl border bg-card p-8 text-center text-muted-foreground">Loading…</div>';
    try{let html='';if(tab==='overview')html=await cycleOverview();else if(tab==='transition')html=await w.renderAcademicYearTransition();else if(tab==='attendance')html=await w.renderAttendanceCorrections();else if(tab==='reports')html=await cycleReportHistory();else if(tab==='birthdays')html=await w.renderBirthdayCentre('admin');else html=`<div class="rounded-xl border bg-card p-6"><h3 class="font-semibold">${esc(cycleTabs.find(x=>x[0]===tab)?.[1]||'Student School Cycle')}</h3><p class="mt-2 text-sm text-muted-foreground">This view uses each learner’s preserved enrolment and school history. Open the Students section to select a class and learner.</p><button onclick="showDashboardSection('students')" class="mt-4 rounded-lg bg-primary px-4 py-2 text-white">Open class students</button></div>`;host.innerHTML=html;if(w.lucide)lucide.createIcons();}catch(error){host.innerHTML=`<div class="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">${esc(error.message||'Could not load this workflow.')}</div>`;}
  }
  function cyclePopulateReportStudents(){const classId=document.getElementById('cycle-report-class')?.value;const select=document.getElementById('cycle-report-student');if(!select)return;let rows=Array.isArray(window.__cycleReportStudents)?window.__cycleReportStudents:[];rows=rows.filter(s=>String(s.classId||'')===String(classId));select.innerHTML='<option value="">Choose student</option>'+rows.map(s=>`<option value="${s.id}">${esc(s.User?.name||s.name||`Student ${s.id}`)} • ${esc(s.elimuid||'')}</option>`).join('');document.getElementById('cycle-report-list').innerHTML='<span class="text-muted-foreground">Choose a student.</span>';}
  async function cycleLoadStudentReports(){const studentId=document.getElementById('cycle-report-student')?.value;const host=document.getElementById('cycle-report-list');if(!studentId||!host)return;host.innerHTML='Loading reports…';try{const response=await api.lifecycle.getReportHistory({studentId});const rows=array(unwrap(response));host.innerHTML=rows.length?rows.map(r=>`<div class="border-b py-3 last:border-0"><div class="flex items-center justify-between gap-3"><div><strong>${esc(r.term||'Term')} ${esc(r.year||'')}</strong><p class="text-xs text-muted-foreground">${esc(r.assessment||r.assessmentType||'Published report')} • Version ${esc(r.version||1)}</p></div><button onclick="openReportSnapshotPdf(${r.id})" class="rounded-lg border px-3 py-2 text-sm">View report</button></div></div>`).join(''):'<div class="text-muted-foreground">No published reports for this learner.</div>';}catch(error){host.innerHTML=`<div class="text-red-600">${esc(error.message||'Reports could not load.')}</div>`;}}
  w.renderStudentLifecycleHome=renderStudentSchoolCycle;w.studentCycleOpen=studentCycleOpen;w.cyclePopulateReportStudents=cyclePopulateReportStudents;w.cycleLoadStudentReports=cycleLoadStudentReports;

  // refresh dashboard previews when alerts/child context change
  w.addEventListener('shule:realtime-event',event=>{const type=String(event.detail?.type||'');if(type.startsWith('alert:')||type==='class:released')renderRecentAlertsPreview();if(type.startsWith('calendar:')){if(typeof window.loadAdminCalendarPreviewEvents==='function')window.loadAdminCalendarPreviewEvents();if(window.currentSection==='calendar'&&typeof window.refreshCalendarEvents==='function')window.refreshCalendarEvents();}});
  w.addEventListener('shule:child-switched',()=>setTimeout(()=>{renderRecentAlertsPreview();if(w.currentSection==='chat')loadParentRecipientConversation();},100));
})(window);
