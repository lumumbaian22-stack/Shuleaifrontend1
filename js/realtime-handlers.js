(function(){
  'use strict';
  const timers=new Map();
  function debounce(key,fn,ms=350){clearTimeout(timers.get(key));timers.set(key,setTimeout(()=>{timers.delete(key);Promise.resolve(fn()).catch(e=>console.warn('[Realtime handler]',key,e.message));},ms));}
  function call(name,...args){return typeof window[name]==='function'?window[name](...args):null;}
  function section(){return String(window.currentSection||window.activeDashboardSection||'');}
  function patchChat(evt){
    if(window.ShuleChatV9Realtime?.applyEvent?.(evt))return;
    window.dispatchEvent(new CustomEvent('shule:chat-event',{detail:evt}));
  }
  function refreshAlert(){debounce('alerts',()=>Promise.allSettled([call('loadNotifications'),section()==='alerts'?call('loadAlerts'):null]));}
  function route(evt){
    const type=String(evt?.type||''); if(!type)return;
    if(type.startsWith('chat:')){patchChat(evt);return;}
    if(type==='alert:created'||type==='alert:updated'||type==='alert:deleted'||type==='alerts:read_all'||type.includes('announcement')||type.includes('birthday')||type==='class:released')refreshAlert();
    if(type.includes('payment')||type.includes('fee_balance'))debounce('finance',()=>{
      const user=(typeof getCurrentUser==='function'?getCurrentUser():{})||{};
      const role=String((typeof getCurrentRole==='function'?getCurrentRole():user.role)||'').toLowerCase().replace(/-/g,'_');
      const jobs=[call('refreshParentPaymentsSilent'),call('loadParentPaymentHistory')];
      if(['admin','finance_officer','super_admin','superadmin'].includes(role)) jobs.push(call('financeV31Refresh'));
      return Promise.allSettled(jobs.filter(Boolean));
    });
    if(type.includes('subscription'))debounce('subscription',()=>Promise.allSettled([call('refreshSubscriptionBilling'),call('loadParentSubscriptions')]));
    if(type.includes('attendance'))debounce('attendance',()=>Promise.allSettled([call('loadStudentAttendance'),call('loadLiveAttendance'),call('refreshMyStudents')]));
    if(type.includes('marks')||type.includes('report_card'))debounce('academics',()=>{
      const user=(typeof getCurrentUser==='function'?getCurrentUser():{})||{};
      const role=String((typeof getCurrentRole==='function'?getCurrentRole():user.role)||'').toLowerCase().replace(/-/g, '_');
      const jobs=[];
      if(role==='student' && typeof window.loadStudentGrades === 'function') jobs.push(call('loadStudentGrades'));
      if(role==='teacher'||role==='class_teacher') {
        const classId = window.__activeClassReportClassId || document.querySelector('#class-report-review-table')?.dataset?.classId || window.dashboardData?.teacher?.classId || window.dashboardData?.profile?.classId || user.classId || user.teacher?.classId;
        if(classId && String(classId) !== 'undefined' && String(classId) !== 'null') jobs.push(call('refreshSavedClassReports', classId, { silent:true }));
        jobs.push(call('refreshTeacherGrades'));
      }
      if(role==='parent') jobs.push(call('refreshParentReportCardsSilent'), call('loadParentChildren'));
      return Promise.allSettled(jobs.filter(Boolean));
    });
    if(type==='analytics:invalidated'&&section()==='analytics')debounce('analytics',()=>call('v152RefreshAnalytics',{silent:true,reason:'realtime'}),900);
    if(type.includes('homework'))debounce('homework',()=>Promise.allSettled([call('v66LoadStudentHomework'),call('loadStudentHomework'),call('refreshTeacherHomework')]));
    if(type.includes('timetable'))debounce('timetable',()=>Promise.allSettled([section()==='timetable'?call('showDashboardSection','timetable'):null,call('loadTimetable')]));
    if(type.includes('calendar'))debounce('calendar',()=>Promise.allSettled([call('loadCalendarEvents'),section()==='calendar'?call('showDashboardSection','calendar'):null]));
    if(type.startsWith('duty:'))debounce('duty',()=>Promise.allSettled([call('v145LoadAdminDuty'),call('v145LoadTeacherDuty')]));
    if(type.includes('branding')||type.includes('school_settings'))debounce('branding',()=>call('loadAndApplySchoolBranding'));
    if(type.includes('student:')||type.includes('class:updated')||type.includes('promotion:')){
      debounce('people',()=>Promise.allSettled([call('refreshStudentsList'),call('refreshClassesList'),call('refreshMyStudents')]));
      if(['class-transfers','student-lifecycle'].includes(section()))debounce('class-transfer-view',()=>{const role=String((typeof getCurrentUser==='function'?getCurrentUser()?.role:'')||'');return role==='teacher'?call('refreshClassTransferCentre','teacher'):role==='admin'?call('refreshClassTransferCentre','admin'):null;},500);
      if(section()==='school-history')debounce('school-history',()=>call('showDashboardSection','school-history'),500);
      if(type==='student:class_changed'&&['dashboard','students','attendance','grades','timetable','schedule','chat','parent-messages'].includes(section()))debounce('class-context',()=>call('showDashboardSection',section()),700);
    }
    window.dispatchEvent(new CustomEvent('shule:realtime-update',{detail:evt}));
  }
  window.addEventListener('shule:realtime-event',e=>route(e.detail));
  window.ShuleRealtimeHandlers={route};
})();
