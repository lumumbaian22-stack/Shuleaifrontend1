// production-stabilizer.js - final safety layer for Shule AI v13
// Purpose: prevent live users from hitting undefined functions, stop fake success flows,
// and route critical screens to real backend endpoints where they exist.
(function(){
  'use strict';
  const w = window;
  const sh = (s) => String(s ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const toast = (m,t='info') => { try { w.showToast(m,t); } catch { console.log(`[${t}]`, m); } };
  const loading = (on) => { try { on ? w.showLoading?.() : w.hideLoading?.(); } catch {} };
  const weekStart = () => { const d = new Date(); const day = d.getDay() || 7; d.setDate(d.getDate() - day + 1); return d.toISOString().slice(0,10); };
  const flattenTimetable = (payload) => {
    const data = payload?.data ?? payload;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.slots)) return data.slots;
    if (Array.isArray(data?.timetable)) return data.timetable;
    return [];
  };
  const classBlocksToSlots = (blocks) => {
    const rows = [];
    (blocks || []).forEach(day => {
      (day.periods || []).forEach((period, index) => {
        if (period.break) rows.push({ day: day.day, periodIndex: index, subject: period.label || 'Break', startTime: period.start, endTime: period.end, isBreak: true });
        (period.classes || []).forEach(c => rows.push({ ...c, day: day.day, periodIndex: index, startTime: c.startTime || period.start, endTime: c.endTime || period.end }));
      });
    });
    return rows;
  };
  const timetableTable = (slots) => {
    const rows = (slots || []).length ? slots : [];
    if (!rows.length) return '<p class="text-sm text-muted-foreground">No timetable has been generated for this class/week yet.</p>';
    return `<div class="overflow-auto"><table class="w-full text-sm"><thead><tr><th class="text-left p-2">Day</th><th class="text-left p-2">Time</th><th class="text-left p-2">Subject</th><th class="text-left p-2">Teacher</th><th class="text-left p-2">Room/Class</th></tr></thead><tbody>${rows.map(s=>`<tr class="border-t"><td class="p-2">${sh(s.day)}</td><td class="p-2">${sh((s.startTime||'') + (s.endTime?` - ${s.endTime}`:''))}</td><td class="p-2 font-semibold">${sh(s.subject || s.title || 'Free')}</td><td class="p-2">${sh(s.teacherName || s.teacher || '')}</td><td class="p-2">${sh(s.room || s.className || '')}</td></tr>`).join('')}</tbody></table></div>`;
  };
  const modal = (id, title, body, actions='') => {
    document.getElementById(id)?.remove();
    document.body.insertAdjacentHTML('beforeend', `<div id="${id}" class="v12-modal-backdrop"><div class="v12-modal"><div class="flex items-start justify-between gap-3 mb-4"><div><div class="v12-label">Production Safe</div><h2 class="text-2xl font-black">${sh(title)}</h2></div><button class="v12-btn" onclick="document.getElementById('${id}')?.remove()">Close</button></div>${body}${actions ? `<div class="mt-5 flex justify-end gap-2 flex-wrap">${actions}</div>` : ''}</div></div>`);
    setTimeout(()=>{ try { lucide.createIcons(); } catch {} }, 25);
  };
  const notReady = (feature) => toast(`${feature} is protected in this production-safe build until its backend workflow is fully connected.`, 'warning');

  // Extend API object safely after api.js loads.
  if (w.api?.timetable && w.apiRequest) {
    w.api.timetable.update = (id, data) => w.apiRequest(`/api/timetable/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    w.api.timetable.getWeek = (weekStartDate = weekStart()) => w.apiRequest(`/api/timetable?weekStartDate=${encodeURIComponent(weekStartDate)}`);
  }

  // Fix missing class timetable function from v12 admin timetable.
  w.v12SelectClassTimetable = async function(classId){
    if (!classId) return toast('Class ID missing. Refresh classes and try again.', 'error');
    try {
      loading(true);
      const res = await w.api.timetable.getForClass(classId, weekStart());
      const slots = classBlocksToSlots(flattenTimetable(res));
      modal('prod-class-timetable', 'Class Timetable', timetableTable(slots));
    } catch (e) {
      toast(e.message || 'Could not load class timetable.', 'error');
    } finally { loading(false); }
  };

  // Replace fake timetable save with an honest production-safe flow.
  w.v12SaveTimetable = async function(){
    try {
      const res = await w.api.timetable.getWeek?.(weekStart());
      const tt = res?.data;
      if (!tt?.id) return toast('Generate a timetable first. No timetable record exists to save yet.', 'warning');
      toast('Generated timetable is already stored on the backend. Manual slot editing is locked until per-slot persistence is completed.', 'info');
    } catch (e) { toast(e.message || 'Could not verify timetable save state.', 'error'); }
  };

  w.v12PublishTimetable = async function(){
    try {
      loading(true);
      const res = await w.api.timetable.getWeek?.(weekStart());
      const tt = res?.data;
      if (!tt?.id) return toast('Generate a timetable first before publishing.', 'warning');
      await w.api.timetable.publish(tt.id);
      toast('Timetable published successfully.', 'success');
    } catch (e) { toast(e.message || 'Could not publish timetable.', 'error'); }
    finally { loading(false); }
  };

  // Production-safe replacements for frequently missing onclick handlers.
  w.activateTeacher = w.activateTeacher || ((id) => notReady(`Activate teacher ${id || ''}`));
  w.deactivateTeacher = w.deactivateTeacher || ((id) => notReady(`Deactivate teacher ${id || ''}`));
  w.removeTeacher = w.removeTeacher || ((id) => notReady(`Remove teacher ${id || ''}`));
  w.manageSchool = w.manageSchool || ((id) => notReady(`Manage school ${id || ''}`));
  w.viewSchool = w.viewSchool || ((id) => notReady(`View school ${id || ''}`));
  w.refreshAdminStudentList = w.refreshAdminStudentList || (() => { try { w.showDashboardSection?.('students'); } catch { location.reload(); } });
  w.sendMessageToTeacher = w.sendMessageToTeacher || ((id) => notReady(`Message teacher ${id || ''}`));
  w.showDutySwapModal = w.showDutySwapModal || (() => notReady('Duty swap'));
  w.showGroupMembers = w.showGroupMembers || (() => notReady('Group members'));

  // If department chat function still has not loaded, give a safe version that calls the real endpoint.
  w.v93OpenDepartmentGroupChat = w.v93OpenDepartmentGroupChat || (async function(departmentId){
    try {
      loading(true);
      const r = await w.apiRequest(`/api/chat-v9/departments/${departmentId}/group`);
      const g = r.data || r.group || {};
      modal('prod-department-chat', g.name || 'Department Group Chat', `<p class="text-sm text-muted-foreground">Department chat loaded. Use the messaging centre for full conversation actions.</p><pre class="text-xs overflow-auto mt-3 bg-muted/20 p-3 rounded-xl">${sh(JSON.stringify(g, null, 2))}</pre>`);
    } catch(e) { toast(e.message || 'Department group chat could not open.', 'error'); }
    finally { loading(false); }
  });

  // Live feature gates: keep users from assuming unfinished modules are complete.
  w.openAITutor = w.openAITutor || (() => notReady('AI Tutor'));
  w.openAdvancedAnalytics = w.openAdvancedAnalytics || (() => notReady('Advanced analytics'));


  // Extra production-safe handlers discovered during v13.1 verification.
  w.closePasswordChangeModal = w.closePasswordChangeModal || (() => { document.getElementById('passwordChangeModal')?.classList.add('hidden'); document.getElementById('password-change-modal')?.remove(); });
  w.addCalendarEvent = w.addCalendarEvent || (() => notReady('Add calendar event'));
  w.assignDuty = w.assignDuty || (() => notReady('Assign duty'));
  w.addTask = w.addTask || (() => notReady('Add task'));
  w.toggleTask = w.toggleTask || ((id) => notReady(`Toggle task ${id || ''}`));
  w.updateAdminChart = w.updateAdminChart || (() => {});
  w.updateAdminPieChart = w.updateAdminPieChart || (() => {});
  w.updateParentChart = w.updateParentChart || (() => {});
  w.viewClassStudents = w.viewClassStudents || (async (classId) => {
    try {
      loading(true);
      const r = await w.api?.admin?.getClassStudents?.(classId);
      const students = r?.data || r?.students || [];
      modal('prod-class-students', 'Class Students', students.length ? `<div class="space-y-2">${students.map(s=>`<div class="p-3 rounded-xl border"><strong>${sh(s.name || s.User?.name || 'Student')}</strong><br><small>${sh(s.elimuid || s.admissionNumber || '')}</small></div>`).join('')}</div>` : '<p class="text-sm text-muted-foreground">No students found for this class.</p>');
    } catch(e) { toast(e.message || 'Could not load class students.', 'error'); }
    finally { loading(false); }
  });

  console.log('✅ Shule AI production stabilizer loaded');
})();
