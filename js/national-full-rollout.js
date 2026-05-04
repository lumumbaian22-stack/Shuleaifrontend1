// national-full-rollout.js - Shule AI v14 school-operations rollout layer
// Real money collection is intentionally disabled. Core school workflows are wired to backend APIs.
(function(){
  'use strict';
  const w = window;
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const toast = (m,t='info') => { try { w.showToast(m,t); } catch { console.log(`[${t}]`, m); } };
  const load = (on) => { try { on ? w.showLoading?.() : w.hideLoading?.(); } catch {} };
  const moneyMessage = 'Real money collection is disabled in this school-operations build. Use the system for school operations now; Daraja/live payments should be enabled only after a separate payment audit.';
  function modal(id,title,body,actions=''){
    $(id)?.remove();
    document.body.insertAdjacentHTML('beforeend', `<div id="${id}" class="v12-modal-backdrop"><div class="v12-modal"><div class="flex items-start justify-between gap-3 mb-4"><div><div class="v12-label">National Rollout</div><h2 class="text-2xl font-black">${esc(title)}</h2></div><button class="v12-btn" onclick="document.getElementById('${id}')?.remove()">Close</button></div>${body}${actions?`<div class="mt-5 flex justify-end gap-2 flex-wrap">${actions}</div>`:''}</div></div>`);
    setTimeout(()=>{ try { lucide.createIcons(); } catch {} }, 30);
  }
  function val(id){ return ($(id)?.value ?? '').trim(); }
  function fmtDate(d){ return new Date(d).toISOString().slice(0,10); }

  // Frontend payment lock: visible and safe. No STK push or subscription activation from this build.
  if (w.api?.payments) {
    ['parentFeeSTK','parentSubscriptionSTK','adminNameChangeSTK','platformSTK'].forEach(k => w.api.payments[k] = async () => { throw new Error(moneyMessage); });
  }
  if (w.api?.parent) {
    ['makePayment','confirmPayment','upgradePlan'].forEach(k => w.api.parent[k] = async () => { throw new Error(moneyMessage); });
  }
  if (w.api?.subscription) {
    w.api.subscription.upgrade = async () => { throw new Error(moneyMessage); };
  }
  w.v12OpenMpesaModal = function(){ modal('money-disabled','Payments Disabled',`<div class="v12-card"><h3 class="font-black mb-2">No live collections in this build</h3><p>${esc(moneyMessage)}</p></div>`); };
  w.v12RenderAdminPaymentSettings = async function(){ return `<div class="v12-page"><section class="v12-hero"><div class="v12-hero-inner"><div><div class="v12-eyebrow">Payments</div><h1 class="v12-title">Payments are disabled</h1><p class="v12-sub">This rollout build leaves real money collection out. School operations can continue without Daraja/STK push.</p></div></div></section><div class="v12-card"><h3 class="font-black mb-2">What is active?</h3><p>Student records, classes, teachers, marks, attendance, calendar, timetable, homework, duties, alerts, messaging, gamification and analytics.</p></div></div>`; };
  w.v12RenderPlatformPayments = w.v12RenderAdminPaymentSettings;

  // Admin teacher lifecycle.
  w.activateTeacher = async function(id){ if(!id) return toast('Teacher ID missing','error'); try{ load(true); await w.api.admin.activateTeacher(id); toast('Teacher activated','success'); await w.showDashboardSection?.('teachers'); }catch(e){ toast(e.message,'error'); }finally{ load(false); } };
  w.deactivateTeacher = async function(id){ const reason = prompt('Reason for deactivation?') || 'Deactivated by admin'; try{ load(true); await w.api.admin.deactivateTeacher(id,{reason}); toast('Teacher deactivated','success'); await w.showDashboardSection?.('teachers'); }catch(e){ toast(e.message,'error'); }finally{ load(false); } };
  w.removeTeacher = async function(id){ if(!confirm('Remove this teacher? This cannot be undone.')) return; try{ load(true); await w.api.admin.deleteTeacher(id); toast('Teacher removed','success'); await w.showDashboardSection?.('teachers'); }catch(e){ toast(e.message,'error'); }finally{ load(false); } };

  // Super admin school view/manage.
  w.viewSchool = async function(id){ try{ load(true); const [schools, stats] = await Promise.all([w.api.superAdmin.getSchools(), w.api.superAdmin.getSchoolStats(id).catch(()=>({data:null}))]); const school=(schools.data||schools.schools||[]).find(s=>String(s.id)===String(id)||String(s.schoolId)===String(id)); modal('school-view','School Details', school?`<div class="v12-grid cols-2"><div class="v12-card"><h3 class="font-black">${esc(school.name)}</h3><p>${esc(school.schoolId||school.code||'')}</p><p>${esc(school.email||school.contactEmail||'')}</p></div><div class="v12-card"><h3 class="font-black">Stats</h3><pre class="text-xs overflow-auto">${esc(JSON.stringify(stats.data||{},null,2))}</pre></div></div>`:'<p>School not found.</p>'); }catch(e){ toast(e.message,'error'); }finally{ load(false); } };
  w.manageSchool = async function(id){ modal('school-manage','Manage School',`<p class="mb-3">Choose an action for school <strong>${esc(id)}</strong>.</p><textarea id="school-action-reason" class="v12-textarea" placeholder="Reason / note"></textarea>`,`<button class="v12-btn" onclick="viewSchool('${esc(id)}')">View</button><button class="v12-btn" onclick="nationalSuspendSchool('${esc(id)}')">Suspend</button><button class="v12-btn primary" onclick="nationalReactivateSchool('${esc(id)}')">Reactivate</button>`); };
  w.nationalSuspendSchool = async function(id){ try{ load(true); await w.api.superAdmin.suspendSchool(id, val('school-action-reason')||'Suspended by super admin'); toast('School suspended','success'); $('school-manage')?.remove(); }catch(e){ toast(e.message,'error'); }finally{ load(false); } };
  w.nationalReactivateSchool = async function(id){ try{ load(true); await w.api.superAdmin.reactivateSchool(id, val('school-action-reason')||'Reactivated by super admin'); toast('School reactivated','success'); $('school-manage')?.remove(); }catch(e){ toast(e.message,'error'); }finally{ load(false); } };

  // Calendar CRUD.
  w.addCalendarEvent = () => w.v12OpenCalendarEvent ? w.v12OpenCalendarEvent() : modal('calendar-add','Add Calendar Event',`<input id="cal-title" class="v12-input" placeholder="Title"><input id="cal-date" type="date" class="v12-input mt-2"><textarea id="cal-desc" class="v12-textarea mt-2" placeholder="Description"></textarea>`,`<button class="v12-btn primary" onclick="nationalSaveCalendarEvent()">Save Event</button>`);
  w.nationalSaveCalendarEvent = async function(){ try{ load(true); await w.api.calendar.createEvent({ title:val('cal-title')||val('v12-cal-title'), date:val('cal-date')||val('v12-cal-date'), description:val('cal-desc')||val('v12-cal-desc'), type:val('v12-cal-type')||'Activity' }); toast('Calendar event saved','success'); document.querySelector('.v12-modal-backdrop')?.remove(); await w.showDashboardSection?.('calendar'); }catch(e){ toast(e.message,'error'); }finally{ load(false); } };

  // Tasks.
  w.addTask = function(){ modal('task-add','Add Task',`<input id="task-title" class="v12-input" placeholder="Task title"><textarea id="task-desc" class="v12-textarea mt-2" placeholder="Description"></textarea><input id="task-due" type="date" class="v12-input mt-2">`,`<button class="v12-btn primary" onclick="nationalCreateTask()">Create Task</button>`); };
  w.nationalCreateTask = async function(){ try{ load(true); await w.api.tasks.createTask({ title:val('task-title'), description:val('task-desc'), dueDate:val('task-due')||null, status:'pending' }); toast('Task created','success'); $('task-add')?.remove(); await w.showDashboardSection?.('tasks'); }catch(e){ toast(e.message,'error'); }finally{ load(false); } };
  w.toggleTask = async function(id){ try{ load(true); await w.api.tasks.completeTask(id); toast('Task updated','success'); await w.showDashboardSection?.('tasks'); }catch(e){ toast(e.message,'error'); }finally{ load(false); } };

  // Duty management.
  w.assignDuty = function(){ const today=fmtDate(new Date()); const end=fmtDate(new Date(Date.now()+6*86400000)); modal('duty-generate','Generate Duty Roster',`<div class="v12-grid cols-2"><label>Start date<input id="duty-start" type="date" value="${today}" class="v12-input"></label><label>End date<input id="duty-end" type="date" value="${end}" class="v12-input"></label></div>`,`<button class="v12-btn primary" onclick="nationalGenerateDuty()">Generate Roster</button>`); };
  w.nationalGenerateDuty = async function(){ try{ load(true); await w.api.admin.generateDutyRoster(val('duty-start'), val('duty-end')); toast('Duty roster generated','success'); $('duty-generate')?.remove(); await w.showDashboardSection?.('duty'); }catch(e){ toast(e.message,'error'); }finally{ load(false); } };
  w.showDutySwapModal = function(){ modal('duty-swap','Request Duty Swap',`<input id="swap-duty-id" class="v12-input" placeholder="Duty ID"><input id="swap-teacher-id" class="v12-input mt-2" placeholder="Target teacher ID"><textarea id="swap-reason" class="v12-textarea mt-2" placeholder="Reason"></textarea>`,`<button class="v12-btn primary" onclick="nationalRequestDutySwap()">Send Request</button>`); };
  w.nationalRequestDutySwap = async function(){ try{ load(true); await w.api.duty.requestSwap({ dutyId:val('swap-duty-id'), targetTeacherId:val('swap-teacher-id'), reason:val('swap-reason') }); toast('Duty swap requested','success'); $('duty-swap')?.remove(); }catch(e){ toast(e.message,'error'); }finally{ load(false); } };

  // Teacher/admin messaging via chat-v9 direct message.
  w.sendMessageToTeacher = function(id){ modal('teacher-message','Message Teacher',`<input id="msg-teacher-id" class="v12-input" value="${esc(id||'')}" placeholder="Teacher ID or User ID"><textarea id="msg-content" class="v12-textarea mt-2" placeholder="Message"></textarea>`,`<button class="v12-btn primary" onclick="nationalSendTeacherMessage()">Send</button>`); };
  w.nationalSendTeacherMessage = async function(){ try{ load(true); let id=val('msg-teacher-id'); const teachers=await w.api.admin.getTeachers().catch(()=>({data:[]})); const t=(teachers.data||[]).find(x=>String(x.id)===String(id)||String(x.userId)===String(id)||String(x.User?.id)===String(id)); const userId=t?.User?.id || t?.userId || id; await w.chatV9API.sendDirectMessage(userId, val('msg-content')); toast('Message sent','success'); $('teacher-message')?.remove(); }catch(e){ toast(e.message,'error'); }finally{ load(false); } };
  w.showGroupMembers = async function(groupId){ try{ load(true); const messages = await w.chatV9API.getGroupMessages(groupId); const senders=[...new Map((messages.data||[]).map(m=>[m.Sender?.id,m.Sender]).filter(x=>x[0])).values()]; modal('group-members','Group Members / Active Participants', senders.length?`<div class="space-y-2">${senders.map(u=>`<div class="p-3 rounded-xl border"><strong>${esc(u.name)}</strong><br><small>${esc(u.role||'')}</small></div>`).join('')}</div>`:'<p>No active participants found yet.</p>'); }catch(e){ toast(e.message,'error'); }finally{ load(false); } };

  // Student performance render helpers.
  w.openAdvancedAnalytics = async function(){ try{ load(true); const role=JSON.parse(localStorage.getItem('currentUser')||'{}').role; let data = role==='admin' ? await w.api.analytics.getSchoolAnalytics() : role==='student' ? await w.api.student.getAnalytics() : null; modal('advanced-analytics','Analytics',`<pre class="text-xs overflow-auto bg-muted/20 p-3 rounded-xl">${esc(JSON.stringify(data?.data||data,null,2))}</pre>`); }catch(e){ toast(e.message,'error'); }finally{ load(false); } };

  // AI tutor: offline/school-safe study helper, not external AI billing/API. It gives structured guidance from user input.
  w.openAITutor = function(){ modal('ai-tutor','School-Safe Study Helper',`<div class="v12-card"><p>This build includes a local guided-study helper. It does not call external AI services or collect payment.</p><textarea id="tutor-question" class="v12-textarea mt-3" placeholder="Ask a study question..."></textarea><div id="tutor-answer" class="mt-3"></div></div>`,`<button class="v12-btn primary" onclick="nationalTutorAnswer()">Get Help</button>`); };
  w.nationalTutorAnswer = function(){ const q=val('tutor-question'); const steps = [`Understand the question: ${q || 'your topic'}.`, 'List what you already know from class notes.', 'Break it into small parts: definition, example, practice question.', 'Try one answer, then compare it with your textbook/teacher notes.', 'Ask your teacher or parent to review the part you are unsure about.']; $('tutor-answer').innerHTML = `<div class="v12-card"><h3 class="font-black mb-2">Guided answer plan</h3><ol class="list-decimal ml-5 space-y-1">${steps.map(s=>`<li>${esc(s)}</li>`).join('')}</ol></div>`; };

  // Payment buttons in old parent UI should never silently proceed.
  w.makePayment = w.makePayment || (() => toast(moneyMessage,'warning'));
  w.initiatePayment = w.initiatePayment || (() => toast(moneyMessage,'warning'));
  w.upgradePlan = w.upgradePlan || (() => toast(moneyMessage,'warning'));

  console.log('✅ Shule AI national full rollout layer loaded: school operations active, real money disabled');
})();
