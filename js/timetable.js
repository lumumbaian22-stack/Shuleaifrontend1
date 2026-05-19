// Shule AI v66 Stage 4C - Timetable class-view + counters repair
(function () {
  const w = window;
  const esc = (v) => String(v ?? '').replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
  const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
  const DAY_LABELS = { monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday', thursday: 'Thursday', friday: 'Friday' };
  const DEFAULT_PERIODS = [
    { label: 'Period 1', startTime: '08:00', endTime: '08:40', type: 'lesson' },
    { label: 'Period 2', startTime: '08:40', endTime: '09:20', type: 'lesson' },
    { label: 'Period 3', startTime: '09:20', endTime: '10:00', type: 'lesson' },
    { label: 'Break', startTime: '10:00', endTime: '10:30', type: 'break', break: true },
    { label: 'Period 4', startTime: '10:30', endTime: '11:10', type: 'lesson' },
    { label: 'Period 5', startTime: '11:10', endTime: '11:50', type: 'lesson' },
    { label: 'Period 6', startTime: '11:50', endTime: '12:30', type: 'lesson' },
    { label: 'Lunch', startTime: '12:30', endTime: '14:00', type: 'break', break: true },
    { label: 'Period 7', startTime: '14:00', endTime: '14:40', type: 'lesson' },
    { label: 'Period 8', startTime: '14:40', endTime: '15:20', type: 'lesson' },
    { label: 'Period 9', startTime: '15:20', endTime: '16:00', type: 'lesson' }
  ];

  let activeTimetable = null;
  let activeTimetableId = null;
  let activeClasses = [];
  let activeTeachers = [];
  let activePeriods = clone(DEFAULT_PERIODS);
  let selectedClassId = 'all';

  function clone(v) { return JSON.parse(JSON.stringify(v || [])); }
  function weekStart() { const d = new Date(); const day = d.getDay() || 7; d.setDate(d.getDate() - day + 1); return d.toISOString().slice(0, 10); }
  async function req(path, opts) { return await apiRequest(path, opts || {}); }
  function norm(v) { return String(v ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim(); }
  function classIdOf(c) { return c?.classId ?? c?.id ?? c?.ClassId ?? c?.class_id ?? null; }
  function classNameOf(c) { return c?.className || c?.name || c?.grade || c?.label || 'Class'; }
  function cleanPeriod(p = {}, idx = 0) {
    const label = p.label || `Period ${idx + 1}`;
    const type = p.type || (p.break || /break|lunch|assembly|games|club/i.test(label) ? 'break' : 'lesson');
    return { id: p.id || `period-${idx + 1}`, label, startTime: String(p.startTime || p.start || '08:00').slice(0, 5), endTime: String(p.endTime || p.end || '08:40').slice(0, 5), type, break: type === 'break' || p.break === true, classes: Array.isArray(p.classes) ? p.classes : [] };
  }
  function getPeriodsFromSlots(slots) {
    const first = Array.isArray(slots) && slots[0]?.periods;
    return (first && first.length ? first : DEFAULT_PERIODS).map(cleanPeriod);
  }
  function shell(periods = DEFAULT_PERIODS) { return DAYS.map(day => ({ day, periods: periods.map((p, idx) => ({ ...cleanPeriod(p, idx), classes: [] })) })); }
  function normalizeSlots(data, periods = activePeriods) {
    const raw = Array.isArray(data) ? data : (data?.slots || data?.timetable || data?.data?.slots || data?.data?.timetable || []);
    const byDay = {}; DAYS.forEach(d => byDay[d] = { day: d, periods: periods.map((p, i) => ({ ...cleanPeriod(p, i), classes: [] })) });
    (raw || []).forEach(dayBlock => {
      const day = norm(dayBlock.day || dayBlock.dayOfWeek).split(' ')[0]; if (!byDay[day]) return;
      const rawPeriods = Array.isArray(dayBlock.periods) ? dayBlock.periods : [];
      rawPeriods.forEach((p, idx) => {
        const target = byDay[day].periods[idx]; if (!target) return;
        const cp = cleanPeriod({ ...target, ...p }, idx);
        const classes = Array.isArray(p.classes) ? p.classes : (p.subject ? [{ ...p }] : []);
        Object.assign(target, { ...cp, classes });
      });
    });
    return Object.values(byDay);
  }
  function sameClass(a, b) {
    if (!a || !b || b === 'all') return false;
    if (String(classIdOf(a) ?? '') === String(b)) return true;
    const cls = activeClasses.find(c => String(classIdOf(c)) === String(b));
    if (!cls) return false;
    return norm(a.className || a.name || a.grade) === norm(classNameOf(cls)) || (norm(a.grade) && norm(a.grade) === norm(cls.grade));
  }
  function findClassBlock(classId = selectedClassId) {
    if (!activeTimetable || !classId || classId === 'all') return null;
    const cls = activeClasses.find(c => String(classIdOf(c)) === String(classId));
    const blocks = Array.isArray(activeTimetable.classes) ? activeTimetable.classes : [];
    return blocks.find(b => String(classIdOf(b) ?? '') === String(classId)) ||
      blocks.find(b => cls && norm(classNameOf(b)) === norm(classNameOf(cls))) ||
      blocks.find(b => cls && norm(b.grade) && norm(b.grade) === norm(cls.grade));
  }
  function slotsForClassFromGlobal(classId) {
    const slots = normalizeSlots(activeTimetable?.slots || [], activePeriods);
    return slots.map(day => ({ ...day, periods: day.periods.map(p => ({ ...p, classes: (p.classes || []).filter(l => String(l.classId ?? '') === String(classId) || sameClass(l, classId)) })) }));
  }
  function displaySlots(classId = selectedClassId) {
    if (!classId || classId === 'all') return normalizeSlots(activeTimetable?.slots || [], activePeriods);
    const block = findClassBlock(classId);
    if (block?.timetable?.length) return normalizeSlots(block.timetable, activePeriods);
    return slotsForClassFromGlobal(classId);
  }
  function buildClassBlocks(slots) {
    const byClass = new Map();
    (activeClasses || []).forEach(c => byClass.set(String(classIdOf(c)), { classId: classIdOf(c), className: classNameOf(c), grade: c.grade, stream: c.stream, periods: clone(activePeriods), timetable: shell(activePeriods) }));
    (slots || []).forEach(dayBlock => (dayBlock.periods || []).forEach((period, pi) => (period.classes || []).forEach(lesson => {
      const key = String(lesson.classId || lesson.className || 'unknown');
      if (!byClass.has(key)) byClass.set(key, { classId: lesson.classId || null, className: lesson.className || 'Class', grade: lesson.grade || '', stream: lesson.stream || '', periods: clone(activePeriods), timetable: shell(activePeriods) });
      const block = byClass.get(key); const day = block.timetable.find(d => d.day === dayBlock.day); if (!day || !day.periods[pi]) return;
      day.periods[pi] = { ...cleanPeriod(period, pi), classes: [{ ...lesson, startTime: period.startTime, endTime: period.endTime, day: dayBlock.day }] };
    })));
    return Array.from(byClass.values());
  }
  function isRealLesson(item = {}) {
    const subject = String(item.subject || '').trim();
    const label = String(item.label || item.type || '').trim();
    return !!subject && !item.break && !/^(free|break|lunch|assembly|games|club|remedial)$/i.test(subject) && !/break|lunch/i.test(label);
  }
  function countFromSlots(slots, classId) {
    const seen = new Set();
    normalizeSlots(slots, activePeriods).forEach(d => (d.periods || []).forEach((p, pi) => (p.classes || []).forEach((l, li) => {
      const lesson = { ...l, break: p.break || l.break, label: p.label, startTime: l.startTime || p.startTime };
      if (!isRealLesson(lesson)) return;
      if (classId && classId !== 'all' && !(String(lesson.classId ?? '') === String(classId) || sameClass(lesson, classId))) return;
      seen.add([d.day, pi, li, lesson.classId || '', lesson.subject, lesson.teacherId || lesson.teacherName || '', lesson.startTime].join('|'));
    })));
    return seen.size;
  }
  function lessonCount(classId = selectedClassId) {
    if (!activeTimetable) return 0;
    if (classId && classId !== 'all') return countFromSlots(displaySlots(classId), 'all');
    const fromGlobal = countFromSlots(activeTimetable.slots || [], 'all');
    if (fromGlobal) return fromGlobal;
    return (activeTimetable.classes || []).reduce((sum, b) => sum + countFromSlots(b.timetable || [], 'all'), 0);
  }
  function classLessonCount(classId) { return lessonCount(classId); }
  function currentStatus(period, opts = {}) {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    if (opts.day && opts.day !== today) return 'upcoming';
    const now = new Date().toTimeString().slice(0, 5);
    if (period.endTime && period.endTime <= now) return 'ended';
    if (period.startTime && period.startTime <= now && period.endTime && period.endTime > now) return 'current';
    return 'upcoming';
  }
  function classesForCell(period, classId) {
    const list = Array.isArray(period.classes) ? period.classes : [];
    if (!classId || classId === 'all') return list;
    return list.filter(l => String(l.classId ?? '') === String(classId) || sameClass(l, classId));
  }
  function renderGrid(slots, { editable = false, classId = selectedClassId, parentStatus = false } = {}) {
    const normalized = normalizeSlots(slots, activePeriods);
    let html = '<div class="timetable-v66-fit"><div class="timetable-v66-grid"><div class="timetable-v66-cell timetable-v66-head">Time</div>' + DAYS.map(d => `<div class="timetable-v66-cell timetable-v66-head">${DAY_LABELS[d]}</div>`).join('');
    activePeriods.forEach((base, pi) => {
      html += `<div class="timetable-v66-cell timetable-v66-time"><strong>${esc(base.label)}</strong><br><span>${esc(base.startTime)} - ${esc(base.endTime)}</span>${editable ? `<button class="tt-mini" onclick="v66EditPeriod(${pi})">Edit</button>` : ''}</div>`;
      DAYS.forEach(day => {
        const period = normalized.find(d => d.day === day)?.periods?.[pi] || base;
        const lessons = classesForCell(period, classId);
        const status = parentStatus ? currentStatus(period, { day }) : '';
        const isBreak = period.break || period.type === 'break';
        let lessonHtml = '';
        if (isBreak) {
          lessonHtml = `<div class="tt-lesson tt-break ${status ? `tt-${status}` : ''}"><div class="tt-title">${esc(period.label || base.label)}</div><div class="tt-meta">${esc(period.startTime)} - ${esc(period.endTime)}</div></div>`;
        } else if (lessons.length) {
          lessonHtml = lessons.map((l, li) => `<div class="tt-lesson ${status ? `tt-${status}` : ''}"><div class="tt-title">${esc(l.subject || 'Free')}</div><div class="tt-meta">${esc(l.className || l.grade || '')}</div><div class="tt-meta">${esc(l.teacherName || l.teacher || '')}</div><div class="tt-meta">${esc(l.room || '')}</div>${editable ? `<button class="tt-mini" onclick="v66EditSlot('${day}',${pi},${li})">Edit lesson</button>` : ''}</div>`).join('');
        } else {
          lessonHtml = `<div class="tt-lesson tt-free ${status ? `tt-${status}` : ''}"><div class="tt-title">Free</div><div class="tt-meta">${esc(period.startTime)} - ${esc(period.endTime)}</div>${editable ? `<button class="tt-mini" onclick="v66EditSlot('${day}',${pi},0)">Add lesson</button>` : ''}</div>`;
        }
        html += `<div class="timetable-v66-cell">${lessonHtml}</div>`;
      });
    });
    return html + '</div></div>';
  }
  function renderToday(slots, title = 'Today’s Lessons', parentStatus = false) {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const day = normalizeSlots(slots, activePeriods).find(d => d.day === today) || normalizeSlots(slots, activePeriods)[0];
    const cards = (day?.periods || []).map((p) => {
      const status = parentStatus ? currentStatus(p, { day: day.day }) : '';
      const lesson = p.break ? { subject: p.label, teacherName: '', room: '' } : (p.classes || [])[0] || { subject: 'Free' };
      return `<div class="tt-today-card ${p.break ? 'tt-break' : ''} ${status ? `tt-${status}` : ''}"><div><strong>${esc(lesson.subject || p.label || 'Free')}</strong><span>${esc(p.startTime)} - ${esc(p.endTime)}</span></div><p>${esc(lesson.teacherName || '')}${lesson.room ? ` • ${esc(lesson.room)}` : ''}</p>${parentStatus ? `<small>${status === 'ended' ? 'Lesson ended' : status === 'current' ? 'Current lesson' : 'Upcoming'}</small>` : ''}</div>`;
    }).join('');
    return `<section class="tt-today"><div class="tt-section-head"><h3>${esc(title)}</h3><span>${esc(DAY_LABELS[today] || today)}</span></div><div class="tt-today-grid">${cards || '<p>No lessons for today.</p>'}</div></section>`;
  }
  function renderPeriodEditor() {
    return `<div class="tt-period-panel compact"><div class="tt-section-head"><div><h3>Lesson Time Settings</h3><p class="tt-help">Edit school periods. Breaks and lunch stay visible but do not count as lessons.</p></div><button class="timetable-v33-btn primary" onclick="v66AddPeriod()">Add period</button></div><div class="tt-period-table"><div class="tt-period-header"><span>Period</span><span>Type</span><span>Start</span><span>End</span><span></span></div>${activePeriods.map((p, i) => `<div class="tt-period-row"><input aria-label="Period label" value="${esc(p.label)}" onchange="v66SetPeriod(${i},'label',this.value)"><select aria-label="Period type" onchange="v66SetPeriod(${i},'type',this.value)"><option value="lesson" ${p.type !== 'break' ? 'selected' : ''}>Lesson</option><option value="break" ${p.type === 'break' ? 'selected' : ''}>Break</option></select><input aria-label="Start time" type="time" value="${esc(p.startTime)}" onchange="v66SetPeriod(${i},'startTime',this.value)"><input aria-label="End time" type="time" value="${esc(p.endTime)}" onchange="v66SetPeriod(${i},'endTime',this.value)"><button type="button" onclick="v66RemovePeriod(${i})">Remove</button></div>`).join('')}</div></div>`;
  }
  async function loadAdminTimetable() {
    const week = weekStart();
    const [ttRes, classRes, teacherRes] = await Promise.allSettled([req(`/api/timetable?weekStartDate=${week}`), req('/api/timetable/classes'), w.api?.admin?.getTeachers ? w.api.admin.getTeachers() : req('/api/admin/teachers')]);
    activeTimetable = ttRes.value?.data || null;
    activeTimetableId = activeTimetable?.id || null;
    activeClasses = classRes.value?.data || classRes.value?.classes || [];
    activeTeachers = teacherRes.value?.data || teacherRes.value?.teachers || [];
    const sourceSlots = activeTimetable?.slots?.length ? activeTimetable.slots : (activeTimetable?.classes || []).find(c => c?.timetable?.length)?.timetable;
    activePeriods = getPeriodsFromSlots(sourceSlots || DEFAULT_PERIODS);
    activeTimetable = { ...(activeTimetable || {}), weekStartDate: week, slots: normalizeSlots(activeTimetable?.slots || [], activePeriods), classes: activeTimetable?.classes || [] };
    if (!activeClasses.find(c => String(classIdOf(c)) === String(selectedClassId))) selectedClassId = 'all';
  }
  function renderClassCounters() {
    if (!activeClasses.length) return '<p class="tt-help">No active classes found for this school.</p>';
    return `<div class="tt-class-counts">${activeClasses.map(c => `<button type="button" class="tt-class-count ${String(selectedClassId) === String(classIdOf(c)) ? 'active' : ''}" onclick="v66SelectClass('${esc(classIdOf(c))}')"><strong>${esc(classNameOf(c))}</strong><span>${classLessonCount(classIdOf(c))} lessons</span></button>`).join('')}</div>`;
  }
  w.renderAdminTimetable = async function () {
    try {
      if (w.showLoading) showLoading(); await loadAdminTimetable(); if (w.hideLoading) hideLoading();
      const lessonsTotal = lessonCount('all');
      const classOptions = ['<option value="all">All classes</option>'].concat((activeClasses || []).map(c => `<option value="${esc(classIdOf(c))}" ${String(selectedClassId) === String(classIdOf(c)) ? 'selected' : ''}>${esc(classNameOf(c))}${c.stream ? ` • ${esc(c.stream)}` : ''}</option>`)).join('');
      const gridSlots = displaySlots(selectedClassId);
      const selectedCount = selectedClassId === 'all' ? lessonsTotal : lessonCount(selectedClassId);
      return `<div class="timetable-v66-page timetable-v33-page timetable-v41-page animate-fade-in"><section class="timetable-v33-hero timetable-v41-hero v12-hero"><div class="v12-hero-inner timetable-v41-hero-inner"><div><div class="v12-eyebrow">Timetable</div><h1 class="v12-title">Timetable</h1><p class="v12-sub">Set periods, generate, select a class to view its timetable, then publish.</p></div><div class="v12-actions timetable-v41-actions"><button class="timetable-v33-btn primary" onclick="v66GenerateTimetable()">Generate</button><button class="timetable-v33-btn" onclick="v66SaveTimetable()">Save</button><button class="timetable-v33-btn" onclick="v66PublishTimetable()">Publish</button></div></div></section><section class="tt-toolbar v12-card"><label>Class view<select onchange="v66SelectClass(this.value)">${classOptions}</select></label><label>Scope<select id="ttScope"><option value="term" ${activeTimetable.scope === 'term' ? 'selected' : ''}>Term</option><option value="year" ${activeTimetable.scope === 'year' ? 'selected' : ''}>Year</option></select></label><label>Term<input id="ttTerm" value="${esc(activeTimetable.term || 'Term 1')}"></label><label>Year<input id="ttYear" type="number" value="${esc(activeTimetable.year || new Date().getFullYear())}"></label><span class="v12-pill green">${lessonsTotal} total lessons</span><span class="v12-pill">${selectedClassId === 'all' ? activeClasses.length + ' classes' : selectedCount + ' class lessons'}</span></section>${renderClassCounters()}${renderPeriodEditor()}<div class="timetable-v33-card timetable-v41-grid-card v12-card"><div class="timetable-v41-grid-head"><h3>${selectedClassId === 'all' ? 'School-wide timetable' : 'Selected class timetable'}</h3><span>${activeTimetable.isPublished ? 'Published' : 'Draft'}</span></div>${renderGrid(gridSlots, { editable: true, classId: selectedClassId === 'all' ? 'all' : selectedClassId })}</div></div>`;
    } catch (e) { if (w.hideLoading) hideLoading(); return `<div class="timetable-v33-card v12-card"><h2>Timetable failed to load</h2><p class="text-red-500">${esc(e.message)}</p></div>`; }
  };
  w.v66SelectClass = function (id) { selectedClassId = id || 'all'; w.showDashboardSection?.('timetable'); };
  w.v66SetPeriod = function (idx, key, value) { if (!activePeriods[idx]) return; activePeriods[idx][key] = value; activePeriods[idx].break = activePeriods[idx].type === 'break'; activeTimetable.slots = normalizeSlots(activeTimetable.slots, activePeriods); const root = document.querySelector('.tt-period-panel'); if (root) root.outerHTML = renderPeriodEditor(); const grid = document.querySelector('.timetable-v66-fit'); if (grid) grid.outerHTML = renderGrid(displaySlots(selectedClassId), { editable: true, classId: selectedClassId }); };
  w.v66AddPeriod = function () { activePeriods.push({ label: 'Extra Lesson', startTime: '16:00', endTime: '16:40', type: 'lesson', break: false }); activeTimetable.slots = normalizeSlots(activeTimetable.slots, activePeriods); w.showDashboardSection?.('timetable'); };
  w.v66RemovePeriod = function (idx) { if (!confirm('Remove this period from the timetable?')) return; activePeriods.splice(idx, 1); activeTimetable.slots = normalizeSlots(activeTimetable.slots, activePeriods); w.showDashboardSection?.('timetable'); };
  w.v66EditPeriod = function (pi) {
    const current = activePeriods[pi]; if (!current) return;
    const label = prompt('Period label:', current.label); if (label === null) return;
    const startTime = prompt('Start time (HH:MM):', current.startTime); if (!startTime) return;
    const endTime = prompt('End time (HH:MM):', current.endTime); if (!endTime) return;
    activePeriods[pi] = { ...current, label, startTime, endTime };
    activeTimetable.slots.forEach(day => { if (day.periods?.[pi]) Object.assign(day.periods[pi], activePeriods[pi]); });
    const grid = document.querySelector('.timetable-v66-fit'); if (grid) grid.outerHTML = renderGrid(displaySlots(selectedClassId), { editable: true, classId: selectedClassId });
  };
  w.v66EditSlot = function (day, pi, li) {
    const gridSlots = displaySlots(selectedClassId);
    const dayBlock = gridSlots?.find(d => d.day === day); if (!dayBlock) return; const period = dayBlock.periods[pi]; if (!period) return;
    if (period.break) { alert('This is a break/activity period. Change it in Lesson Time Settings.'); return; }
    const old = (period.classes && period.classes[li]) || {};
    const subject = prompt('Subject:', old.subject || ''); if (subject === null) return;
    const classId = selectedClassId !== 'all' ? selectedClassId : (prompt('Class ID:', old.classId || classIdOf(activeClasses[0]) || '') || old.classId || classIdOf(activeClasses[0]) || null);
    const cls = activeClasses.find(c => String(classIdOf(c)) === String(classId));
    const teacherName = prompt('Teacher name:', old.teacherName || old.teacher || '') || '';
    const room = prompt('Room:', old.room || '') || '';
    const lesson = { ...old, subject, classId: classId ? Number(classId) : null, className: cls ? classNameOf(cls) : old.className || '', grade: cls?.grade || old.grade || '', stream: cls?.stream || old.stream || '', teacherName, room, startTime: period.startTime, endTime: period.endTime };
    const globalDay = activeTimetable.slots.find(d => d.day === day); const globalPeriod = globalDay?.periods?.[pi];
    if (globalPeriod) {
      globalPeriod.classes = globalPeriod.classes || [];
      if (selectedClassId !== 'all') globalPeriod.classes = globalPeriod.classes.filter(l => String(l.classId) !== String(selectedClassId));
      globalPeriod.classes.push(lesson);
    }
    activeTimetable.classes = buildClassBlocks(activeTimetable.slots);
    const grid = document.querySelector('.timetable-v66-fit'); if (grid) grid.outerHTML = renderGrid(displaySlots(selectedClassId), { editable: true, classId: selectedClassId });
  };
  w.v66SaveTimetable = async function () {
    if (!activeTimetableId) { alert('Generate a timetable first before saving edits.'); return; }
    try {
      if (w.showLoading) showLoading();
      const scope = document.getElementById('ttScope')?.value || activeTimetable.scope || 'term'; const term = document.getElementById('ttTerm')?.value || activeTimetable.term || 'Term 1'; const year = Number(document.getElementById('ttYear')?.value || activeTimetable.year || new Date().getFullYear());
      activeTimetable.classes = buildClassBlocks(activeTimetable.slots);
      await req(`/api/timetable/${activeTimetableId}`, { method: 'PUT', body: JSON.stringify({ slots: activeTimetable.slots, classes: activeTimetable.classes, warnings: activeTimetable.warnings || [], scope, term, year }) });
      if (w.showToast) showToast('Timetable changes saved', 'success');
    } catch (e) { w.showToast ? showToast(e.message, 'error') : alert(e.message); } finally { if (w.hideLoading) hideLoading(); }
  };
  w.v66GenerateTimetable = async function () {
    try {
      if (w.showLoading) showLoading();
      const scope = document.getElementById('ttScope')?.value || 'term'; const term = document.getElementById('ttTerm')?.value || 'Term 1'; const year = Number(document.getElementById('ttYear')?.value || new Date().getFullYear());
      await req('/api/timetable/generate', { method: 'POST', body: JSON.stringify({ weekStartDate: weekStart(), periods: activePeriods, scope, term, year }) });
      await w.showDashboardSection?.('timetable');
    } catch (e) { w.showToast ? showToast(e.message, 'error') : alert(e.message); } finally { if (w.hideLoading) hideLoading(); }
  };
  w.v66PublishTimetable = async function () {
    if (!activeTimetableId) { alert('Generate or load a timetable first.'); return; }
    try {
      await w.v66SaveTimetable();
      const scope = document.getElementById('ttScope')?.value || activeTimetable.scope || 'term'; const term = document.getElementById('ttTerm')?.value || activeTimetable.term || 'Term 1'; const year = Number(document.getElementById('ttYear')?.value || activeTimetable.year || new Date().getFullYear());
      await req(`/api/timetable/${activeTimetableId}/publish`, { method: 'POST', body: JSON.stringify({ scope, term, year }) });
      w.showToast && showToast(`Timetable published for the ${scope}`, 'success');
      await w.showDashboardSection?.('timetable');
    } catch (e) { w.showToast ? showToast(e.message, 'error') : alert(e.message); }
  };

  async function renderReadOnlyTimetableFrom(path, title, opts = {}) {
    try {
      const r = await req(path); const data = r?.data || r; activePeriods = getPeriodsFromSlots(data?.timetable || data);
      const slots = normalizeSlots(data?.timetable || data, activePeriods);
      const subtitle = [data?.classInfo?.name || data?.classInfo?.grade, data?.term, data?.year, data?.scope].filter(Boolean).join(' • ');
      return `<div class="timetable-v66-page timetable-v33-page timetable-v41-page animate-fade-in"><section class="timetable-v33-hero timetable-v41-hero v12-hero"><div class="v12-hero-inner timetable-v41-hero-inner"><div><div class="v12-eyebrow">Timetable</div><h1 class="v12-title">${esc(title)}</h1><p class="v12-sub">${esc(subtitle || 'Published timetable')}</p></div></div></section>${opts.todayOnly ? renderToday(slots, opts.todayTitle || 'Today’s Lessons', opts.parentStatus) : ''}<div class="timetable-v33-card timetable-v41-grid-card v12-card">${renderGrid(slots, { editable: false, classId: 'all', parentStatus: opts.parentStatus })}</div></div>`;
    } catch (e) { return `<div class="timetable-v33-card v12-card"><h2>${esc(title)}</h2><p class="text-red-500">${esc(e.message)}</p></div>`; }
  }
  w.renderStudentTimetable = async function () { return renderReadOnlyTimetableFrom('/api/timetable/student/me', 'My Timetable', { todayOnly: true, todayTitle: 'Today’s Lessons' }); };
  w.renderParentTimetable = async function () {
    const childId = window.dashboardData?.selectedChildId || localStorage.getItem('shule_selected_child_id') || window.selectedChildId || '';
    return childId ? renderReadOnlyTimetableFrom(`/api/timetable/parent/child/${childId}`, 'Child Timetable', { todayOnly: true, todayTitle: 'Today’s Lessons', parentStatus: true }) : `<div class="timetable-v33-card v12-card"><h2>Child Timetable</h2><p>Select a linked child to view the timetable.</p></div>`;
  };
  w.renderTeacherTimetable = async function () {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const teacherId = user.teacherId || user.id || '';
    return renderReadOnlyTimetableFrom(`/api/timetable/teacher/${teacherId}`, 'My Teaching Timetable');
  };
  w.renderTimetableGrid = function (slots) { return renderGrid(slots, { editable: false }); };

  w.v33EditPeriod = w.v66EditPeriod;
  w.v33EditSlot = w.v66EditSlot;
  w.v33SaveTimetable = w.v66SaveTimetable;
  w.v33GenerateTimetable = w.v66GenerateTimetable;
  w.v33PublishTimetable = w.v66PublishTimetable;
  w.v12RenderAdminTimetable = w.renderAdminTimetable;
  w.v12RenderTeacherTimetable = w.renderTeacherTimetable;
  w.v12RenderParentTimetable = w.renderParentTimetable;
  w.v12RenderStudentTimetable = w.renderStudentTimetable;
})();
