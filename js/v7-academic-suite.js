
// js/v7-academic-suite.js
// Final chosen UI: card dashboards, editable break-aware timetable, simple marks modal, Option 1 report card.

window.v7State = {
  timetable: null,
  selectedClassId: null,
  marksContext: null,
  marksStudents: [],
  gradingScale: [
    { grade:'A', min:80, max:100, point:5, description:'Excellent' },
    { grade:'B', min:70, max:79, point:4, description:'Very Good' },
    { grade:'C', min:60, max:69, point:3, description:'Good' },
    { grade:'D', min:50, max:59, point:2, description:'Fair' },
    { grade:'E', min:40, max:49, point:1, description:'Pass' },
    { grade:'F', min:0, max:39, point:0, description:'Fail' }
  ]
};

function v7Esc(text) {
  if (text === null || text === undefined) return '';
  const div = document.createElement('div');
  div.textContent = String(text);
  return div.innerHTML;
}
function v7DayTitle(day) { return String(day || '').charAt(0).toUpperCase() + String(day || '').slice(1); }
function v7TodayWeekStart() {
  if (typeof moment !== 'undefined') return moment().startOf('isoWeek').format('YYYY-MM-DD');
  const d = new Date(); const day = d.getDay() || 7; d.setDate(d.getDate() - day + 1); return d.toISOString().slice(0,10);
}
function v7Selected(id) { const el=document.getElementById(id); return el ? el.value : ''; }
function v7BreakRows() {
  const count = Number(v7Selected('v7-break-count') || 2);
  const schoolType = v7Selected('v7-school-type') || 'day';
  const rows = [];
  for (let i=1; i<=count; i++) rows.push({ type:'short', name:`Break ${i}`, startTime: i === 1 ? '10:20' : '14:40', duration:20, label:`Break ${i}` });
  rows.push({ type:'lunch', name:'Lunch', startTime:'12:40', duration:60, label:'Lunch Break' });
  if (schoolType === 'boarding' || document.getElementById('v7-include-games')?.checked) rows.push({ type:'games', name:'Games', startTime:'15:30', duration:30, label:'Games Break' });
  return rows;
}
function v7RenderBreakConfigRows() {
  const holder = document.getElementById('v7-break-config-rows');
  if (!holder) return;
  holder.innerHTML = v7BreakRows().map((b, idx) => `
    <div class="v7-grid-4 v7-card" data-break-row="${idx}">
      <label class="v7-field">Type
        <select data-break-type><option value="short" ${b.type==='short'?'selected':''}>Short Break</option><option value="lunch" ${b.type==='lunch'?'selected':''}>Lunch</option><option value="games" ${b.type==='games'?'selected':''}>Games</option></select>
      </label>
      <label class="v7-field">Name <input data-break-name value="${v7Esc(b.name)}"></label>
      <label class="v7-field">Start Time <input data-break-start type="time" value="${b.startTime}"></label>
      <label class="v7-field">Duration (min) <input data-break-duration type="number" value="${b.duration}" min="5" step="5"></label>
    </div>
  `).join('');
}
function v7CollectTimetableSettings() {
  const rows = [...document.querySelectorAll('[data-break-row]')].map(row => ({
    type: row.querySelector('[data-break-type]')?.value || 'short',
    name: row.querySelector('[data-break-name]')?.value || 'Break',
    startTime: row.querySelector('[data-break-start]')?.value || '10:20',
    duration: Number(row.querySelector('[data-break-duration]')?.value || 20),
    label: row.querySelector('[data-break-name]')?.value || 'Break'
  }));
  return {
    lessonDuration: Number(v7Selected('v7-lesson-duration') || 40),
    shortLessonDuration: Number(v7Selected('v7-short-lesson-duration') || v7Selected('v7-lesson-duration') || 40),
    breakCount: Number(v7Selected('v7-break-count') || 2),
    schoolType: v7Selected('v7-school-type') || 'day',
    dayStart: v7Selected('v7-day-start') || '08:00',
    dayEnd: v7Selected('v7-day-end') || '16:00',
    includeGamesBreak: !!document.getElementById('v7-include-games')?.checked,
    remedialDuration: Number(v7Selected('v7-remedial-duration') || 60),
    breaks: rows
  };
}

async function renderV7AdminTimetable() {
  const weekStart = v7TodayWeekStart();
  let res = await api.timetable.getCurrent({ weekStartDate: weekStart }).catch(() => ({ data:null }));
  const timetable = res.data || null;
  window.v7State.timetable = timetable;
  const selectedClassId = window.v7State.selectedClassId || timetable?.classes?.[0]?.classId || null;
  window.v7State.selectedClassId = selectedClassId;

  return `
  <div class="v7-shell animate-fade-in">
    <div class="v7-card v7-card-soft">
      <div class="v7-toolbar">
        <div>
          <h2 class="v7-section-title">Timetable Management</h2>
          <p class="text-sm text-muted-foreground">Generate, edit, and publish full-school timetables by term or year.</p>
        </div>
        <div class="flex gap-2 flex-wrap">
          <button class="v7-btn" onclick="v7OpenTimetableSettings()">Breaks & Durations</button>
          <button class="v7-btn v7-btn-primary" onclick="v7GenerateTimetable()">Generate Timetable</button>
          ${timetable ? `<button class="v7-btn v7-btn-success" onclick="v7PublishTimetable()">Publish</button>` : ''}
        </div>
      </div>
    </div>

    <div class="v7-card">
      <div class="v7-grid-4">
        <label class="v7-field">Week Start <input id="v7-week-start" type="date" value="${weekStart}"></label>
        <label class="v7-field">Term <select id="v7-term"><option>Term 1</option><option>Term 2</option><option>Term 3</option></select></label>
        <label class="v7-field">Year <input id="v7-year" type="number" value="${new Date().getFullYear()}"></label>
        <label class="v7-field">Scope <select id="v7-scope"><option value="term">Per Term</option><option value="year">Full Year</option><option value="week">Weekly</option></select></label>
      </div>
    </div>

    ${timetable ? `
      <div class="v7-card">
        <div class="v7-toolbar mb-3">
          <div>
            <h3 class="font-bold">Generated Classes</h3>
            <p class="text-xs text-muted-foreground">Click a class to view and edit that class timetable.</p>
          </div>
          <span class="text-xs px-3 py-1 rounded-full bg-blue-100 text-blue-700">${timetable.classes?.length || 0} classes • ${timetable.term || ''} ${timetable.year || ''}</span>
        </div>
        <div class="v7-class-tabs">
          ${(timetable.classes || []).map(c => `<button class="v7-class-tab ${Number(c.classId)===Number(selectedClassId)?'active':''}" onclick="v7SelectTimetableClass(${c.classId})">${v7Esc(c.className)}</button>`).join('')}
        </div>
      </div>
      <div id="v7-class-timetable">${v7RenderClassTimetable(timetable, selectedClassId)}</div>
      ${timetable.warnings?.length ? `<div class="v7-card border-yellow-200 bg-yellow-50"><h3 class="font-bold text-yellow-800 mb-2">Generation Warnings</h3>${timetable.warnings.map(w=>`<p class="text-sm text-yellow-700">• ${v7Esc(w.className || '')}: ${v7Esc(w.message)}</p>`).join('')}</div>` : ''}
    ` : `<div class="v7-card text-center py-12"><h3 class="font-bold">No timetable generated yet</h3><p class="text-muted-foreground mt-2">Configure breaks and durations, then generate a timetable for all classes.</p></div>`}
  </div>`;
}

function v7RenderClassTimetable(timetable, classId) {
  const cls = (timetable.classes || []).find(c => Number(c.classId) === Number(classId)) || timetable.classes?.[0];
  if (!cls) return '<div class="v7-card text-center py-10">No class timetable available.</div>';
  const days = cls.timetable || [];
  const maxPeriods = Math.max(...days.map(d => (d.periods || []).length), 0);
  const rows = [];
  for (let i=0; i<maxPeriods; i++) {
    const firstPeriod = days.find(d => d.periods?.[i])?.periods?.[i];
    rows.push(`
      <tr>
        <td class="v7-time-col">${v7Esc(firstPeriod?.start || '')} - ${v7Esc(firstPeriod?.end || '')}</td>
        ${days.map(day => {
          const p = day.periods?.[i];
          if (!p) return '<td></td>';
          if (p.break) return `<td><div class="v7-break v7-break-${v7Esc(p.breakType || 'short')}">${v7Esc(p.label)}<br><span class="text-xs font-normal">${v7Esc(p.purpose || '')}</span></div></td>`;
          const lesson = p.classes?.[0];
          return `<td onclick="v7OpenSlotEditor(${cls.classId}, '${day.day}', ${i})">
            ${lesson ? `<div class="v7-lesson"><strong>${v7Esc(lesson.subject)}</strong><br><span class="text-xs">${v7Esc(lesson.teacherName)}</span><br><span class="text-xs">${v7Esc(lesson.room || '')}</span></div>` : `<div class="v7-lesson bg-slate-50 border-dashed text-slate-400">Free / Click to edit</div>`}
          </td>`;
        }).join('')}
      </tr>`);
  }
  return `
  <div class="v7-card">
    <div class="v7-toolbar mb-3">
      <div><h3 class="font-bold">${v7Esc(cls.className)} Timetable</h3><p class="text-xs text-muted-foreground">Click any lesson slot to edit subject, teacher, or room.</p></div>
      <button class="v7-btn" onclick="v7RefreshTimetable()">Refresh</button>
    </div>
    <div class="v7-timetable-wrap">
      <table class="v7-timetable">
        <thead><tr><th>Time</th>${days.map(d=>`<th>${v7DayTitle(d.day)}</th>`).join('')}</tr></thead>
        <tbody>${rows.join('')}</tbody>
      </table>
    </div>
  </div>`;
}

function v7SelectTimetableClass(classId) {
  window.v7State.selectedClassId = classId;
  const holder = document.getElementById('v7-class-timetable');
  if (holder) holder.innerHTML = v7RenderClassTimetable(window.v7State.timetable, classId);
  document.querySelectorAll('.v7-class-tab').forEach(btn => btn.classList.remove('active'));
  event?.target?.classList.add('active');
}

function v7OpenTimetableSettings() {
  const existing = document.getElementById('v7-timetable-settings-modal');
  if (existing) existing.remove();
  const modal = document.createElement('div');
  modal.id = 'v7-timetable-settings-modal';
  modal.className = 'v7-modal-backdrop';
  modal.innerHTML = `
    <div class="v7-modal">
      <div class="v7-modal-head"><h3 class="font-bold">Timetable Settings — Breaks & Durations</h3><button onclick="this.closest('.v7-modal-backdrop').remove()">✕</button></div>
      <div class="v7-modal-body v7-shell">
        <div class="v7-grid-4">
          <label class="v7-field">School Type <select id="v7-school-type" onchange="v7RenderBreakConfigRows()"><option value="day">Day School</option><option value="boarding">Boarding School</option></select></label>
          <label class="v7-field">Lesson Duration <input id="v7-lesson-duration" type="number" value="40" min="20" step="5"></label>
          <label class="v7-field">Short Lesson Duration <input id="v7-short-lesson-duration" type="number" value="40" min="20" step="5"></label>
          <label class="v7-field">Number of Short Breaks <select id="v7-break-count" onchange="v7RenderBreakConfigRows()"><option value="1">1 Break</option><option value="2" selected>2 Breaks</option><option value="3">3 Breaks</option></select></label>
          <label class="v7-field">Day Start <input id="v7-day-start" type="time" value="08:00"></label>
          <label class="v7-field">Day End <input id="v7-day-end" type="time" value="16:00"></label>
          <label class="v7-field">Remedial Duration <input id="v7-remedial-duration" type="number" value="60" min="0" step="5"></label>
          <label class="v7-field">Games Break <span><input id="v7-include-games" type="checkbox" checked> Include games break</span></label>
        </div>
        <div><h4 class="font-bold mb-2">Break Setup</h4><div id="v7-break-config-rows" class="v7-shell"></div></div>
        <div class="flex justify-end gap-2"><button class="v7-btn" onclick="this.closest('.v7-modal-backdrop').remove()">Close</button><button class="v7-btn v7-btn-primary" onclick="this.closest('.v7-modal-backdrop').remove(); showToast('Timetable settings ready. Generate to apply.', 'success')">Save Settings</button></div>
      </div>
    </div>`;
  document.body.appendChild(modal);
  v7RenderBreakConfigRows();
}

async function v7GenerateTimetable() {
  try {
    showLoading();
    const payload = {
      weekStartDate: v7Selected('v7-week-start') || v7TodayWeekStart(),
      term: v7Selected('v7-term') || 'Term 1',
      year: Number(v7Selected('v7-year') || new Date().getFullYear()),
      scope: v7Selected('v7-scope') || 'term',
      settings: v7CollectTimetableSettings()
    };
    const res = await api.timetable.generate(payload);
    showToast(res.message || 'Timetable generated', 'success');
    await showDashboardSection('timetable');
  } catch (e) { showToast(e.message, 'error'); }
  finally { hideLoading(); }
}
async function v7PublishTimetable() {
  if (!window.v7State.timetable?.id) return showToast('No timetable to publish', 'error');
  await api.timetable.publish(window.v7State.timetable.id);
  showToast('Timetable published', 'success');
  await showDashboardSection('timetable');
}
async function v7RefreshTimetable() { await showDashboardSection('timetable'); }

function v7OpenSlotEditor(classId, day, periodIndex) {
  const tt = window.v7State.timetable;
  const cls = tt?.classes?.find(c => Number(c.classId) === Number(classId));
  const period = cls?.timetable?.find(d=>d.day===day)?.periods?.[periodIndex];
  if (!tt || !period || period.break) return;
  const lesson = period.classes?.[0] || {};
  const modal = document.createElement('div');
  modal.className = 'v7-modal-backdrop';
  modal.innerHTML = `
    <div class="v7-modal" style="max-width:560px">
      <div class="v7-modal-head"><h3 class="font-bold">Edit Timetable Slot</h3><button onclick="this.closest('.v7-modal-backdrop').remove()">✕</button></div>
      <div class="v7-modal-body v7-shell">
        <div class="v7-grid-2">
          <label class="v7-field">Class <input value="${v7Esc(cls.className)}" disabled></label>
          <label class="v7-field">Time <input value="${v7Esc(day)} ${v7Esc(period.start)}-${v7Esc(period.end)}" disabled></label>
          <label class="v7-field">Subject <input id="v7-slot-subject" value="${v7Esc(lesson.subject || '')}"></label>
          <label class="v7-field">Teacher Name <input id="v7-slot-teacher" value="${v7Esc(lesson.teacherName || '')}"></label>
          <label class="v7-field">Teacher ID <input id="v7-slot-teacher-id" type="number" value="${v7Esc(lesson.teacherId || '')}"></label>
          <label class="v7-field">Room <input id="v7-slot-room" value="${v7Esc(lesson.room || '')}"></label>
        </div>
        <div class="flex justify-end gap-2"><button class="v7-btn" onclick="this.closest('.v7-modal-backdrop').remove()">Cancel</button><button class="v7-btn v7-btn-primary" onclick="v7SaveSlot(${classId}, '${day}', ${periodIndex}, this)">Save Slot</button></div>
      </div>
    </div>`;
  document.body.appendChild(modal);
}
async function v7SaveSlot(classId, day, periodIndex, btn) {
  try {
    await api.timetable.updateSlot(window.v7State.timetable.id, {
      classId, day, periodIndex,
      subject: document.getElementById('v7-slot-subject').value,
      teacherName: document.getElementById('v7-slot-teacher').value,
      teacherId: document.getElementById('v7-slot-teacher-id').value || null,
      room: document.getElementById('v7-slot-room').value
    });
    btn.closest('.v7-modal-backdrop').remove();
    showToast('Slot updated', 'success');
    await showDashboardSection('timetable');
  } catch (e) { showToast(e.message, 'error'); }
}

// Marks Entry Modal
async function v7OpenMarksEntryModal() {
  const existing = document.getElementById('v7-marks-modal'); if (existing) existing.remove();
  const ctx = await api.teacher.getMarksContext();
  window.v7State.marksContext = ctx.data;
  window.v7State.gradingScale = ctx.data.defaultScale || window.v7State.gradingScale;
  const classes = ctx.data.classes || [];
  const modal = document.createElement('div');
  modal.id = 'v7-marks-modal';
  modal.className = 'v7-modal-backdrop';
  modal.innerHTML = `
    <div class="v7-modal">
      <div class="v7-modal-head"><h3 class="font-bold">Marks Entry — Simple & Clear</h3><button onclick="this.closest('.v7-modal-backdrop').remove()">✕</button></div>
      <div class="v7-modal-body v7-shell">
        <div class="v7-grid-4">
          <label class="v7-field">Class <select id="v7-marks-class" onchange="v7MarksClassChanged()">${classes.map(c=>`<option value="${c.classId}">${v7Esc(c.className)} ${c.isClassTeacher?'(Class Teacher)':''}</option>`).join('')}</select></label>
          <label class="v7-field">Subject <select id="v7-marks-subject"></select></label>
          <label class="v7-field">Term <select id="v7-marks-term">${ctx.data.terms.map(t=>`<option>${t}</option>`).join('')}</select></label>
          <label class="v7-field">Academic Year <select id="v7-marks-year">${ctx.data.years.map(y=>`<option>${y}</option>`).join('')}</select></label>
          <label class="v7-field">Assessment Type <select id="v7-marks-type"><option value="test">Test</option><option value="exam">Exam</option><option value="assignment">Assignment</option><option value="project">Project</option><option value="quiz">Quiz</option><option value="backtesting">Backtesting / Previous Year</option></select></label>
          <label class="v7-field">Assessment Name <input id="v7-marks-name" placeholder="End of Term Test"></label>
          <label class="v7-field">Date <input id="v7-marks-date" type="date" value="${new Date().toISOString().slice(0,10)}"></label>
          <label class="v7-field">Mode <select id="v7-marks-mode"><option>manual</option><option>backtesting</option></select></label>
        </div>

        <div class="v7-grid-3">
          <button class="v7-btn v7-btn-primary" onclick="v7LoadMarksStudents()">Load Students</button>
          <button class="v7-btn" onclick="v7AnalyzeMarks()">Analyze Before Save</button>
          <button class="v7-btn v7-btn-success" onclick="v7SaveMarks()">Save Draft Marks</button>
        </div>

        <div id="v7-marks-analysis"></div>
        <div id="v7-marks-table" class="v7-timetable-wrap"><div class="p-8 text-center text-muted-foreground">Choose class/subject and load students.</div></div>

        <div class="v7-card">
          <h3 class="font-bold mb-3">Grading System (Set by Teacher)</h3>
          <div class="v7-timetable-wrap">
            <table class="v7-table"><thead><tr><th>Grade</th><th>Min %</th><th>Max %</th><th>Point</th><th>Description</th></tr></thead>
            <tbody>${window.v7State.gradingScale.map((g,i)=>`<tr><td><input class="v7-score-input" data-scale-grade="${i}" value="${g.grade}"></td><td><input class="v7-score-input" data-scale-min="${i}" value="${g.min}"></td><td><input class="v7-score-input" data-scale-max="${i}" value="${g.max}"></td><td><input class="v7-score-input" data-scale-point="${i}" value="${g.point}"></td><td><input data-scale-description="${i}" value="${g.description}" class="w-full border rounded p-2"></td></tr>`).join('')}</tbody></table>
          </div>
        </div>
      </div>
    </div>`;
  document.body.appendChild(modal);
  v7MarksClassChanged();
}
function v7MarksClassChanged() {
  const classId = Number(v7Selected('v7-marks-class'));
  const cls = window.v7State.marksContext?.classes?.find(c=>Number(c.classId)===classId);
  const subjectSelect = document.getElementById('v7-marks-subject');
  if (!subjectSelect) return;
  const subjects = cls?.subjects?.length ? cls.subjects : ['Mathematics','English','Kiswahili','Science'];
  subjectSelect.innerHTML = subjects.map(s=>`<option>${v7Esc(s)}</option>`).join('');
}
async function v7LoadMarksStudents() {
  const classId = v7Selected('v7-marks-class');
  const res = await api.teacher.getMarksStudents(classId);
  window.v7State.marksStudents = res.data || [];
  const holder = document.getElementById('v7-marks-table');
  holder.innerHTML = `
    <table class="v7-table"><thead><tr><th>#</th><th>Student</th><th>Admission No.</th><th>Score</th><th>Out Of</th><th>Grade</th><th>Remarks</th></tr></thead>
    <tbody>${window.v7State.marksStudents.map((s,i)=>`<tr data-mark-row="${s.id}"><td>${i+1}</td><td>${v7Esc(s.name)}</td><td>${v7Esc(s.admissionNo || s.elimuid || '')}</td><td><input class="v7-score-input" data-score="${s.id}" type="number" min="0" max="100" value=""></td><td><input class="v7-score-input" value="100" disabled></td><td data-grade="${s.id}">-</td><td><input class="w-full border rounded p-2" data-remarks="${s.id}" placeholder="Optional"></td></tr>`).join('')}</tbody></table>`;
}
function v7GetScaleFromUI() {
  return window.v7State.gradingScale.map((g,i)=>({
    grade: document.querySelector(`[data-scale-grade="${i}"]`)?.value || g.grade,
    min: Number(document.querySelector(`[data-scale-min="${i}"]`)?.value || g.min),
    max: Number(document.querySelector(`[data-scale-max="${i}"]`)?.value || g.max),
    point: Number(document.querySelector(`[data-scale-point="${i}"]`)?.value || g.point),
    description: document.querySelector(`[data-scale-description="${i}"]`)?.value || g.description
  }));
}
function v7CollectMarks() {
  return window.v7State.marksStudents.map(s=>({
    studentId:s.id,
    score: Number(document.querySelector(`[data-score="${s.id}"]`)?.value || 0),
    remarks: document.querySelector(`[data-remarks="${s.id}"]`)?.value || ''
  })).filter(m=>Number.isFinite(m.score));
}
async function v7AnalyzeMarks() {
  const res = await api.teacher.analyzeMarks({ subject:v7Selected('v7-marks-subject'), marks:v7CollectMarks(), gradingScale:v7GetScaleFromUI() });
  const box = document.getElementById('v7-marks-analysis');
  const a = res.data.analysis || {};
  res.data.rows?.forEach(r => {
    const g = document.querySelector(`[data-grade="${r.studentId}"]`);
    if (g) g.textContent = r.grade;
  });
  box.innerHTML = `<div class="v7-grid-4">
    <div class="v7-card"><p class="text-sm text-muted-foreground">Average</p><h3 class="text-2xl font-bold">${a.average || 0}%</h3></div>
    <div class="v7-card"><p class="text-sm text-muted-foreground">Highest</p><h3 class="text-2xl font-bold text-green-600">${a.highest || 0}%</h3></div>
    <div class="v7-card"><p class="text-sm text-muted-foreground">Lowest</p><h3 class="text-2xl font-bold text-red-600">${a.lowest || 0}%</h3></div>
    <div class="v7-card"><p class="text-sm text-muted-foreground">Pass Rate</p><h3 class="text-2xl font-bold">${a.passRate || 0}%</h3></div>
  </div><div class="v7-card mt-3"><strong>Recommendation:</strong> ${v7Esc(a.recommendation || '')}</div>`;
}
async function v7SaveMarks() {
  await v7AnalyzeMarks();
  const payload = {
    classId: Number(v7Selected('v7-marks-class')),
    subject: v7Selected('v7-marks-subject'),
    term: v7Selected('v7-marks-term'),
    year: Number(v7Selected('v7-marks-year')),
    assessmentType: v7Selected('v7-marks-type') === 'backtesting' ? 'test' : v7Selected('v7-marks-type'),
    assessmentName: v7Selected('v7-marks-name') || `${v7Selected('v7-marks-subject')} ${v7Selected('v7-marks-type')}`,
    date: v7Selected('v7-marks-date'),
    backtesting: v7Selected('v7-marks-mode') === 'backtesting' || v7Selected('v7-marks-type') === 'backtesting',
    gradingScale: v7GetScaleFromUI(),
    marks: v7CollectMarks()
  };
  const res = await api.teacher.saveBulkMarks(payload);
  showToast(res.message || 'Draft marks saved', 'success');
}

// Report Card Option 1
async function v7OpenReportCard(studentId) {
  const term = prompt('Term:', 'Term 1') || 'Term 1';
  const year = prompt('Year:', new Date().getFullYear()) || new Date().getFullYear();
  const res = await api.teacher.getReportCard({ studentId, term, year });
  v7ShowReportCard(res.data);
}
function v7ShowReportCard(data) {
  const modal = document.createElement('div');
  modal.className = 'v7-modal-backdrop';
  modal.innerHTML = `<div class="v7-modal">
    <div class="v7-modal-head no-print"><h3 class="font-bold">Report Card Preview — Option 1 Modern Blue</h3><div class="flex gap-2"><button onclick="window.print()" class="v7-btn v7-btn-success">Print / Save PDF</button><button onclick="this.closest('.v7-modal-backdrop').remove()">✕</button></div></div>
    <div class="v7-modal-body"><div id="v7-report-print">${v7ReportCardHTML(data)}</div></div>
  </div>`;
  document.body.appendChild(modal);
}
function v7ReportCardHTML(data) {
  const s = data.student || {}, sum = data.summary || {}, att = data.attendance || {}, analysis = data.analysis || {};
  return `<div class="v7-report-card">
    <div class="v7-report-header">
      <div><div class="v7-report-title">${v7Esc(data.school?.name || 'ShuleAI Academy')}</div><div>Excellence in Education</div></div>
      <div class="text-right"><strong>REPORT CARD</strong><br>Academic Year: ${v7Esc(data.year)}<br>${v7Esc(data.term)}</div>
    </div>
    <div class="v7-report-body">
      <div class="v7-report-side">
        <div class="v7-report-box"><h3 class="font-bold mb-2">STUDENT INFORMATION</h3>
          <div class="flex gap-3">
            <div class="flex-1 text-sm">
              <p><strong>Name:</strong> ${v7Esc(s.name)}</p><p><strong>Admission No:</strong> ${v7Esc(s.admissionNo)}</p><p><strong>Class:</strong> ${v7Esc(s.class)}</p><p><strong>Stream:</strong> ${v7Esc(s.stream || '-')}</p><p><strong>Assessment No:</strong> ${v7Esc(s.assessmentNumber || '-')}</p><p><strong>NEMIS:</strong> ${v7Esc(s.nemisNumber || '-')}</p>
            </div>
            <div class="w-24 h-28 bg-slate-100 rounded flex items-center justify-center overflow-hidden">${s.photo ? `<img src="${v7Esc(s.photo)}" class="w-full h-full object-cover">` : 'Photo'}</div>
          </div>
        </div>
        <div class="v7-report-box"><h3 class="font-bold mb-2">SUMMARY</h3><div class="v7-report-summary">
          <div class="v7-report-stat">Overall Average<strong>${sum.average || 0}%</strong></div>
          <div class="v7-report-stat">Overall Grade<strong>${v7Esc(sum.overallGrade || '-')}</strong></div>
          <div class="v7-report-stat">Position<strong>${sum.position || '-'} / ${sum.totalStudents || '-'}</strong></div>
          <div class="v7-report-stat">Attendance<strong>${sum.attendanceRate || 0}%</strong></div>
          <div class="v7-report-stat">Passed<strong>${sum.passed || 0}</strong></div>
          <div class="v7-report-stat">Failed<strong>${sum.failed || 0}</strong></div>
        </div></div>
        <div class="v7-report-box"><h3 class="font-bold mb-2">TEACHER'S REMARK</h3><p class="text-sm">${v7Esc(data.remarks?.teacher || '')}</p><br><p class="text-sm">Class Teacher: __________________ Date: __________</p></div>
      </div>
      <div class="v7-report-box">
        <h3 class="font-bold mb-2">SUBJECT PERFORMANCE</h3>
        <table class="v7-table"><thead><tr><th>#</th><th>Subject</th><th>Max</th><th>Score</th><th>%</th><th>Grade</th><th>Point</th><th>Remarks</th></tr></thead>
        <tbody>${(data.subjects || []).map(r=>`<tr><td>${r.no}</td><td>${v7Esc(r.subject)}</td><td>${r.maxMarks}</td><td>${r.score}</td><td>${r.percentage}%</td><td>${v7Esc(r.grade)}</td><td>${r.point}</td><td>${v7Esc(r.remarks)}</td></tr>`).join('')}
        <tr><td></td><td><strong>Aggregate</strong></td><td>${(data.subjects || []).length*100}</td><td><strong>${sum.total || 0}</strong></td><td><strong>${sum.average || 0}%</strong></td><td><strong>${v7Esc(sum.overallGrade || '-')}</strong></td><td></td><td></td></tr></tbody></table>
        <div class="v7-grid-2 mt-4">
          <div class="v7-report-box"><h3 class="font-bold text-green-700">STRENGTHS</h3>${(analysis.strengths || []).length ? analysis.strengths.map(x=>`<p>✓ ${v7Esc(x)}</p>`).join('') : '<p>Keep building consistency.</p>'}</div>
          <div class="v7-report-box"><h3 class="font-bold text-orange-700">AREAS FOR IMPROVEMENT</h3>${(analysis.improvementAreas || []).length ? analysis.improvementAreas.map(x=>`<p>• ${v7Esc(x)}</p>`).join('') : '<p>No major weakness identified.</p>'}</div>
        </div>
        <div class="v7-report-box mt-4"><h3 class="font-bold">ATTENDANCE SUMMARY</h3><div class="v7-grid-4"><div>Days Open<br><strong>${att.daysOpen || 0}</strong></div><div>Present<br><strong>${att.daysPresent || 0}</strong></div><div>Absent<br><strong>${att.daysAbsent || 0}</strong></div><div>Rate<br><strong>${att.attendanceRate || 0}%</strong></div></div></div>
      </div>
    </div>
    <div class="p-4 border-t grid md:grid-cols-2 gap-4">
      <div><strong>GRADING SCALE</strong><div class="grid grid-cols-3 gap-2 text-xs mt-2">${(data.gradingScale || []).map(g=>`<div class="border rounded p-2">${v7Esc(g.grade)} (${g.min}-${g.max}%)<br>${v7Esc(g.description)}</div>`).join('')}</div></div>
      <div><strong>PRINCIPAL'S COMMENT</strong><p class="text-sm mt-2">${v7Esc(data.remarks?.principal || '')}</p><br>Principal Signature: __________________</div>
    </div>
  </div>`;
}

window.renderV7AdminTimetable = renderV7AdminTimetable;
window.v7OpenMarksEntryModal = v7OpenMarksEntryModal;
window.v7OpenReportCard = v7OpenReportCard;
