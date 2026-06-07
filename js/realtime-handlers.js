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
    if(type==='alert:created'||type.includes('announcement')||type.includes('birthday')||type==='class:released')refreshAlert();
    if(type.includes('payment')||type.includes('fee_balance'))debounce('finance',()=>Promise.allSettled([call('refreshParentPaymentsSilent'),call('loadParentPaymentHistory'),call('financeV31Refresh')]));
    if(type.includes('subscription'))debounce('subscription',()=>Promise.allSettled([call('refreshSubscriptionBilling'),call('loadParentSubscriptions')]));
    if(type.includes('attendance'))debounce('attendance',()=>Promise.allSettled([call('loadStudentAttendance'),call('loadLiveAttendance'),call('refreshMyStudents')]));
    if(type.includes('marks')||type.includes('report_card'))debounce('academics',()=>Promise.allSettled([call('loadStudentGrades'),call('refreshSavedClassReports'),call('refreshTeacherGrades')]));
    if(type==='analytics:invalidated'&&section()==='analytics')debounce('analytics',()=>Promise.allSettled([call('loadAnalytics'),call('refreshAnalytics'),call('renderAnalyticsDashboard')]),700);
    if(type.includes('homework'))debounce('homework',()=>Promise.allSettled([call('v66LoadStudentHomework'),call('loadStudentHomework'),call('refreshTeacherHomework')]));
    if(type.includes('timetable')||type.includes('calendar'))debounce('schedule',()=>Promise.allSettled([call('loadTimetable'),call('loadCalendarEvents')]));
    if(type.includes('branding')||type.includes('school_settings'))debounce('branding',()=>call('loadAndApplySchoolBranding'));
    if(type.includes('student:')||type.includes('class:updated')||type.includes('promotion:'))debounce('people',()=>Promise.allSettled([call('refreshStudentsList'),call('refreshClassesList'),call('refreshMyStudents')]));
    window.dispatchEvent(new CustomEvent('shule:realtime-update',{detail:evt}));
  }
  window.addEventListener('shule:realtime-event',e=>route(e.detail));
  window.ShuleRealtimeHandlers={route};
})();
