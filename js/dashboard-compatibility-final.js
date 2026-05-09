
// dashboard-compatibility-final.js
// Keeps older dashboard section function names available without changing approved layouts.
(function(w){
  function fallbackCard(title, text){
    return `<div class="card p-6"><h3 class="text-xl font-bold mb-2">${title}</h3><p class="text-muted-foreground">${text}</p></div>`;
  }
  w.v12RenderTeacherDuty = w.v12RenderTeacherDuty || w.renderTeacherDuty || (async function(){
    if (typeof renderDutySection === 'function') return await renderDutySection('teacher');
    return fallbackCard('Teacher Duty','Duty records are available from the duty section.');
  });
  w.v12RenderTeacherHomework = w.v12RenderTeacherHomework || w.renderTeacherHomework || (async function(){
    if (typeof renderHomeworkSection === 'function') return await renderHomeworkSection('teacher');
    if (typeof renderTeacherHomework === 'function') return await renderTeacherHomework();
    return fallbackCard('Teacher Homework','Homework tools are loading.');
  });
  w.v12RenderParentPayments = w.v12RenderParentPayments || w.renderParentPayments || (async function(){
    if (typeof renderParentPayments === 'function') return await renderParentPayments();
    if (typeof renderFinanceFeesSection === 'function') return await renderFinanceFeesSection('payments');
    return fallbackCard('Payments','Payment records are available under Finance & Fees.');
  });
  w.v12RenderStudentHomework = w.v12RenderStudentHomework || w.renderStudentHomework || (async function(){
    if (typeof renderStudentHomework === 'function') return await renderStudentHomework();
    return fallbackCard('My Homework','Homework records are loading.');
  });
  w.v12RenderAlertsCenter = w.v12RenderAlertsCenter || w.renderAlertsCenter || (async function(role){
    if (typeof renderAlertsCenter === 'function') return await renderAlertsCenter(role);
    return fallbackCard('Alerts Center','Alerts will appear here when available.');
  });
  w.v12RenderAdminTimetable = w.v12RenderAdminTimetable || w.renderAdminTimetable || (async function(){
    if (typeof renderTimetableSection === 'function') return await renderTimetableSection('admin');
    return fallbackCard('Timetable','Timetable tools are loading.');
  });
  w.v12RenderParentTimetable = w.v12RenderParentTimetable || w.renderParentTimetable || (async function(){
    if (typeof renderParentTimetable === 'function') return await renderParentTimetable();
    return fallbackCard('Timetable','Your child timetable will appear here.');
  });
  w.v12RenderStudentTimetable = w.v12RenderStudentTimetable || w.renderStudentTimetable || (async function(){
    if (typeof renderStudentTimetable === 'function') return await renderStudentTimetable();
    return fallbackCard('Timetable','Your timetable will appear here.');
  });
})(window);
