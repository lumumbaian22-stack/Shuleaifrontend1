// Shule AI v66 Stage 4D - Timetable generator + period controls cleanup
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
  let timetableDirty = false;
  let activeLiveTimetableId = null;
  let activeHasUnpublishedChanges = false;

  function clone(v) { return JSON.parse(JSON.stringify(v || [])); }
  function weekStart() { const d = new Date(); const day = d.getDay() || 7; d.setDate(d.getDate() - day + 1); return d.toISOString().slice(0, 10); }
  async function req(path, opts) {
    try { return await apiRequest(path, opts || {}); }
    catch (error) {
      if (/connection terminated unexpectedly|networkerror|ecconnreset|econnreset|timeout/i.test(String(error?.message || error))) {
        await new Promise(resolve => setTimeout(resolve, 700));
        return await apiRequest(path, opts || {});
      }
      throw error;
    }
  }
  function norm(v) { return String(v ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim(); }
  function classIdOf(c) { return c?.classId ?? c?.id ?? c?.ClassId ?? c?.class_id ?? null; }
  function classNameOf(c) { return c?.className || c?.name || c?.grade || c?.label || 'Class'; }
  function teacherIdOf(t) { return t?.teacherId ?? t?.id ?? t?.TeacherId ?? null; }
  function teacherNameOf(t) { return t?.User?.name || t?.user?.name || t?.name || t?.fullName || t?.email || 'Teacher'; }
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
      const matchedClass = activeClasses.find(c => String(classIdOf(c)) === String(lesson.classId ?? '') || norm(classNameOf(c)) === norm(lesson.className || lesson.grade));
      const key = String(lesson.classId || (matchedClass && classIdOf(matchedClass)) || lesson.className || 'unknown');
      if (!byClass.has(key)) byClass.set(key, { classId: lesson.classId || (matchedClass && classIdOf(matchedClass)) || null, className: lesson.className || (matchedClass && classNameOf(matchedClass)) || 'Class', grade: lesson.grade || matchedClass?.grade || '', stream: lesson.stream || matchedClass?.stream || '', periods: clone(activePeriods), timetable: shell(activePeriods) });
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
  function markTimetableDirty(reason) {
    timetableDirty = true;
    activeHasUnpublishedChanges = true;
    const status = document.querySelector('[data-tt-status]');
    if (status) status.innerHTML = renderVisibilityBadge();
    const notice = document.querySelector('[data-tt-notice]');
    if (notice) notice.outerHTML = renderVisibilityNotice();
    const saveBtn = document.querySelector('[data-tt-save-btn]');
    if (saveBtn) saveBtn.textContent = 'Save Draft';
    const publishBtn = document.querySelector('[data-tt-publish-btn]');
    if (publishBtn) publishBtn.textContent = 'Publish Changes';
  }
  function renderVisibilityBadge() {
    if (!activeTimetable) return '<span class="v12-pill">No timetable</span>';
    if (timetableDirty) return '<span class="v12-pill amber">Unsaved edits</span>';
    if (activeTimetable.isPublished && !activeHasUnpublishedChanges) return '<span class="v12-pill green">Live published</span>';
    return '<span class="v12-pill amber">Draft changes pending</span>';
  }
  function renderVisibilityNotice() {
    if (!activeTimetable) return '<div data-tt-notice></div>';
    if (activeTimetable.isPublished && !timetableDirty && !activeHasUnpublishedChanges) {
      return '<div data-tt-notice class="mt-3 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">This timetable is live. Teachers, students and parents can see this published version.</div>';
    }
    if (timetableDirty) {
      return '<div data-tt-notice class="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"><strong>Unsaved edits:</strong> save the draft, then publish changes for teachers, students and parents to see the new timetable.</div>';
    }
    return '<div data-tt-notice class="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"><strong>Draft only:</strong> these timetable changes are saved for Admin review but are not visible to teachers, students or parents until you click Publish Changes.</div>';
  }
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
    return `<details class="tt-period-panel compact v12-card"><summary class="tt-section-head" style="cursor:pointer"><div><h3>School day and lesson times</h3><p class="tt-help">Optional: open only when you need to change period times.</p></div><span class="v12-pill">${activePeriods.length} periods</span></summary><div class="mt-4"><div class="flex justify-end mb-3"><button class="timetable-v33-btn primary" onclick="v66AddPeriod()">Add lesson/break</button></div><div class="tt-period-table"><div class="tt-period-header"><span>Period</span><span>Type</span><span>Start</span><span>End</span><span></span></div>${activePeriods.map((p, i) => `<div class="tt-period-row"><input aria-label="Period label" value="${esc(p.label)}" onchange="v66SetPeriod(${i},'label',this.value)"><select aria-label="Period type" onchange="v66SetPeriod(${i},'type',this.value)"><option value="lesson" ${p.type !== 'break' ? 'selected' : ''}>Lesson</option><option value="break" ${p.type === 'break' ? 'selected' : ''}>Break</option></select><input aria-label="Start time" type="time" value="${esc(p.startTime)}" onchange="v66SetPeriod(${i},'startTime',this.value)"><input aria-label="End time" type="time" value="${esc(p.endTime)}" onchange="v66SetPeriod(${i},'endTime',this.value)"><button type="button" onclick="v66RemovePeriod(${i})">Remove</button></div>`).join('')}</div></div></details>`;
  }
  async function loadAdminTimetable() {
    const week = weekStart();
    const [ttRes, classRes, teacherRes] = await Promise.allSettled([req(`/api/timetable?weekStartDate=${week}`), req('/api/timetable/classes'), w.api?.admin?.getTeachers ? w.api.admin.getTeachers() : req('/api/admin/teachers')]);
    activeTimetable = ttRes.value?.data || null;
    activeTimetableId = activeTimetable?.id || null;
    activeLiveTimetableId = activeTimetable?.liveTimetableId || (activeTimetable?.isPublished ? activeTimetable.id : null);
    activeHasUnpublishedChanges = !!activeTimetable?.hasUnpublishedChanges || (!!activeTimetable && !activeTimetable.isPublished);
    timetableDirty = false;
    activeClasses = classRes.value?.data || classRes.value?.classes || [];
    activeTeachers = teacherRes.value?.data || teacherRes.value?.teachers || [];
    const sourceSlots = activeTimetable?.slots?.length ? activeTimetable.slots : (activeTimetable?.classes || []).find(c => c?.timetable?.length)?.timetable;
    activePeriods = getPeriodsFromSlots(sourceSlots || DEFAULT_PERIODS);
    activeTimetable = { ...(activeTimetable || {}), weekStartDate: week, slots: normalizeSlots(activeTimetable?.slots || [], activePeriods), classes: activeTimetable?.classes || [] };
    if (!activeClasses.find(c => String(classIdOf(c)) === String(selectedClassId))) selectedClassId = 'all';
  }
  function renderClassCounters() { return ''; }
  w.renderAdminTimetable = async function () {
    try {
      if (w.showLoading) showLoading(); await loadAdminTimetable(); if (w.hideLoading) hideLoading();
      const lessonsTotal = lessonCount('all');
      const classOptions = ['<option value="all">All classes</option>'].concat((activeClasses || []).map(c => `<option value="${esc(classIdOf(c))}" ${String(selectedClassId) === String(classIdOf(c)) ? 'selected' : ''}>${esc(classNameOf(c))}${c.stream ? ` • ${esc(c.stream)}` : ''}</option>`)).join('');
      const gridSlots = displaySlots(selectedClassId);
      const selectedCount = selectedClassId === 'all' ? lessonsTotal : lessonCount(selectedClassId);
      return `<div class="timetable-v66-page timetable-v33-page timetable-v41-page animate-fade-in"><section class="timetable-v33-hero timetable-v41-hero v12-hero"><div class="v12-hero-inner timetable-v41-hero-inner"><div><div class="v12-eyebrow">Timetable</div><h1 class="v12-title">Timetable</h1><p class="v12-sub">1. Generate a draft &nbsp; 2. Review or edit lessons &nbsp; 3. Publish to teachers, parents and students.</p></div><div class="v12-actions timetable-v41-actions"><button class="timetable-v33-btn primary" onclick="v66GenerateTimetable()">Generate</button><button data-tt-save-btn class="timetable-v33-btn" onclick="v66SaveTimetable()">Save Draft</button><button data-tt-publish-btn class="timetable-v33-btn" onclick="v66PublishTimetable()">Publish Changes</button></div></div></section><section class="tt-toolbar v12-card"><label>Class view<select onchange="v66SelectClass(this.value)">${classOptions}</select></label><label>Scope<select id="ttScope"><option value="term" ${activeTimetable.scope === 'term' ? 'selected' : ''}>Term</option><option value="year" ${activeTimetable.scope === 'year' ? 'selected' : ''}>Year</option></select></label><label>Term<input id="ttTerm" value="${esc(activeTimetable.term || 'Term 1')}"></label><label>Year<input id="ttYear" type="number" value="${esc(activeTimetable.year || new Date().getFullYear())}"></label><span class="v12-pill green tt-counter-pill">${lessonsTotal} total lessons</span><span class="v12-pill tt-counter-pill">${selectedClassId === 'all' ? activeClasses.length + ' classes' : selectedCount + ' class lessons'}</span><span data-tt-status>${renderVisibilityBadge()}</span></section>${renderVisibilityNotice()}${renderPeriodEditor()}<div class="timetable-v33-card timetable-v41-grid-card v12-card"><div class="timetable-v41-grid-head"><h3>${selectedClassId === 'all' ? 'School-wide timetable' : 'Selected class timetable'}</h3><span>${activeTimetable.isPublished ? 'Published' : 'Draft'}</span></div>${renderGrid(gridSlots, { editable: true, classId: selectedClassId === 'all' ? 'all' : selectedClassId })}</div></div>`;
    } catch (e) { if (w.hideLoading) hideLoading(); return `<div class="timetable-v33-card v12-card"><h2>Timetable failed to load</h2><p class="text-red-500">${esc(e.message)}</p></div>`; }
  };
  w.v66SelectClass = function (id) { selectedClassId = id || 'all'; w.showDashboardSection?.('timetable'); };
  w.v66SetPeriod = function (idx, key, value) { if (!activePeriods[idx]) return; activePeriods[idx][key] = value; activePeriods[idx].break = activePeriods[idx].type === 'break'; activeTimetable.slots = normalizeSlots(activeTimetable.slots, activePeriods); markTimetableDirty('period'); const root = document.querySelector('.tt-period-panel'); if (root) root.outerHTML = renderPeriodEditor(); const grid = document.querySelector('.timetable-v66-fit'); if (grid) grid.outerHTML = renderGrid(displaySlots(selectedClassId), { editable: true, classId: selectedClassId }); };
  
  function refreshTimetableView() {
    activeTimetable.slots = normalizeSlots(activeTimetable.slots || [], activePeriods);
    activeTimetable.classes = buildClassBlocks(activeTimetable.slots);
    const panel = document.querySelector('.tt-period-panel'); if (panel) panel.outerHTML = renderPeriodEditor();
    const grid = document.querySelector('.timetable-v66-fit'); if (grid) grid.outerHTML = renderGrid(displaySlots(selectedClassId), { editable: true, classId: selectedClassId });
    const pills = document.querySelectorAll('.tt-counter-pill');
    if (pills[0]) pills[0].textContent = lessonCount('all') + ' total lessons';
    if (pills[1]) pills[1].textContent = selectedClassId === 'all' ? activeClasses.length + ' classes' : lessonCount(selectedClassId) + ' class lessons';
  }
  w.v66AddPeriod = function () {
    const last = activePeriods[activePeriods.length - 1] || { endTime: '16:00' };
    const startTime = last.endTime || '16:00';
    activePeriods.push({ label: 'Extra Lesson', startTime, endTime: startTime, type: 'lesson', break: false, classes: [] });
    markTimetableDirty('period-added');
    activeTimetable.slots = (activeTimetable.slots && activeTimetable.slots.length ? activeTimetable.slots : shell(activePeriods.slice(0, -1))).map(day => ({ ...day, periods: [...(day.periods || []), { ...cleanPeriod(activePeriods[activePeriods.length - 1], activePeriods.length - 1), classes: [] }] }));
    refreshTimetableView();
  };
  w.v66RemovePeriod = function (idx) {
    if (!activePeriods[idx]) return;
    if (!confirm('Remove this period from the timetable? Lessons in this period will also be removed.')) return;
    activePeriods.splice(idx, 1);
    markTimetableDirty('period-removed');
    activeTimetable.slots = (activeTimetable.slots || []).map(day => ({ ...day, periods: (day.periods || []).filter((_, i) => i !== idx) }));
    refreshTimetableView();
  };
  w.v66EditPeriod = function (idx) {
    const row=document.querySelectorAll('.tt-period-row')[idx];
    if(row){ row.scrollIntoView({behavior:'smooth',block:'center'}); row.classList.add('ring-2','ring-primary'); setTimeout(()=>row.classList.remove('ring-2','ring-primary'),1400); row.querySelector('input')?.focus(); }
  };
  w.v66EditSlot = function (day, pi, li) {
    const gridSlots=displaySlots(selectedClassId); const dayBlock=gridSlots?.find(d=>d.day===day); const period=dayBlock?.periods?.[pi];
    if(!period)return; if(period.break){w.showToast?showToast('Edit break times in Lesson Time Settings.','info'):alert('Edit break times in Lesson Time Settings.');return;}
    const old=(period.classes&&period.classes[li])||{};
    const defaultClass=selectedClassId!=='all'?selectedClassId:(old.classId||classIdOf(activeClasses[0])||'');
    const classOptions=(activeClasses||[]).map(c=>`<option value="${esc(classIdOf(c))}" ${String(defaultClass)===String(classIdOf(c))?'selected':''}>${esc(classNameOf(c))}${c.stream?` • ${esc(c.stream)}`:''}</option>`).join('');
    const teacherOptions=['<option value="">Unassigned</option>'].concat((activeTeachers||[]).map(t=>`<option value="${esc(teacherIdOf(t))}" ${String(old.teacherId||'')===String(teacherIdOf(t))?'selected':''}>${esc(teacherNameOf(t))}</option>`)).join('');
    document.getElementById('tt-lesson-modal-v145')?.remove();
    const modal=document.createElement('div'); modal.id='tt-lesson-modal-v145'; modal.className='fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-4';
    modal.innerHTML=`<div class="w-full max-w-lg rounded-xl bg-card p-6 shadow-2xl"><div class="flex justify-between gap-3"><div><h3 class="text-xl font-bold">${old.subject?'Edit lesson':'Add lesson'}</h3><p class="text-sm text-muted-foreground">${esc(DAY_LABELS[day]||day)} • ${esc(period.startTime)}–${esc(period.endTime)}</p></div><button class="text-2xl" onclick="v66CloseLessonEditor()">×</button></div><div class="mt-5 grid gap-4"><label class="text-sm">Class<select id="tt-edit-class-v145" class="mt-1 w-full rounded-lg border p-2">${classOptions}</select></label><label class="text-sm">Subject<input id="tt-edit-subject-v145" class="mt-1 w-full rounded-lg border p-2" value="${esc(old.subject||'')}" placeholder="Subject or learning area"></label><label class="text-sm">Teacher<select id="tt-edit-teacher-v145" class="mt-1 w-full rounded-lg border p-2">${teacherOptions}</select></label><label class="text-sm">Room<input id="tt-edit-room-v145" class="mt-1 w-full rounded-lg border p-2" value="${esc(old.room||'')}" placeholder="Optional"></label></div><div class="mt-6 flex justify-end gap-3"><button class="rounded-lg border px-4 py-2" onclick="v66CloseLessonEditor()">Cancel</button>${old.subject?`<button class="rounded-lg border border-red-300 px-4 py-2 text-red-600" onclick="v66SaveLessonEditor('${day}',${pi},${li},true)">Remove</button>`:''}<button class="rounded-lg bg-primary px-4 py-2 text-white" onclick="v66SaveLessonEditor('${day}',${pi},${li},false)">Save lesson</button></div></div>`;
    modal.addEventListener('click',ev=>{if(ev.target===modal)w.v66CloseLessonEditor()}); document.body.appendChild(modal); setTimeout(()=>document.getElementById('tt-edit-subject-v145')?.focus(),50);
  };
  w.v66CloseLessonEditor=function(){document.getElementById('tt-lesson-modal-v145')?.remove();};
  w.v66SaveLessonEditor=function(day,pi,li,remove){
    const classId=document.getElementById('tt-edit-class-v145')?.value||''; const subject=document.getElementById('tt-edit-subject-v145')?.value?.trim()||''; const teacherId=document.getElementById('tt-edit-teacher-v145')?.value||''; const room=document.getElementById('tt-edit-room-v145')?.value?.trim()||'';
    if(!remove&&!subject){return w.showToast?showToast('Enter a subject.','warning'):alert('Enter a subject.');}
    const cls=activeClasses.find(c=>String(classIdOf(c))===String(classId)); const teacher=activeTeachers.find(t=>String(teacherIdOf(t))===String(teacherId));
    const globalDay=activeTimetable.slots.find(d=>d.day===day); const globalPeriod=globalDay?.periods?.[pi]; if(!globalPeriod)return;
    globalPeriod.classes=globalPeriod.classes||[];
    const oldDisplayed=(displaySlots(selectedClassId)?.find(d=>d.day===day)?.periods?.[pi]?.classes||[])[li]||{};
    const oldIndex=globalPeriod.classes.findIndex(x=>x===oldDisplayed || (String(x.classId||'')===String(oldDisplayed.classId||classId)&&String(x.subject||'')===String(oldDisplayed.subject||'')&&String(x.teacherId||'')===String(oldDisplayed.teacherId||'')));
    if(remove){if(oldIndex>=0)globalPeriod.classes.splice(oldIndex,1);} else {
      const lesson={...oldDisplayed,subject,classId:classId?Number(classId):null,className:cls?classNameOf(cls):'',grade:cls?.grade||'',stream:cls?.stream||'',teacherId:teacherId?Number(teacherId):null,teacherName:teacher?teacherNameOf(teacher):'Unassigned Teacher',room,startTime:globalPeriod.startTime,endTime:globalPeriod.endTime,day};
      if(oldIndex>=0)globalPeriod.classes[oldIndex]=lesson;else globalPeriod.classes.push(lesson);
    }
    activeTimetable.classes=buildClassBlocks(activeTimetable.slots); markTimetableDirty('lesson'); w.v66CloseLessonEditor(); refreshTimetableView();
  };

  w.v66SaveTimetable = async function (opts = {}) {
    if (!activeTimetableId) { alert('Generate a timetable first before saving edits.'); return false; }
    try {
      if (!opts.silent && w.showLoading) showLoading();
      const scope = document.getElementById('ttScope')?.value || activeTimetable.scope || 'term'; const term = document.getElementById('ttTerm')?.value || activeTimetable.term || 'Term 1'; const year = Number(document.getElementById('ttYear')?.value || activeTimetable.year || new Date().getFullYear());
      activeTimetable.slots = normalizeSlots(activeTimetable.slots || [], activePeriods);
      activeTimetable.classes = buildClassBlocks(activeTimetable.slots);
      const saved = await req(`/api/timetable/${activeTimetableId}`, { method: 'PUT', body: JSON.stringify({ slots: activeTimetable.slots, classes: activeTimetable.classes, warnings: activeTimetable.warnings || [], scope, term, year }) });
      const savedRow=saved?.data||saved;
      if(savedRow?.id){
        activeTimetableId=savedRow.id;
        activeTimetable={...savedRow, slots: normalizeSlots(savedRow.slots || activeTimetable.slots || [], activePeriods), classes: savedRow.classes || activeTimetable.classes || []};
        activeLiveTimetableId=savedRow.liveTimetableId || activeLiveTimetableId;
        activeHasUnpublishedChanges=!!savedRow.requiresPublish || !savedRow.isPublished;
        timetableDirty=false;
      }
      if (!opts.silent && w.showToast) showToast(saved?.message || 'Timetable draft saved. Click Publish Changes for users to see it.', 'success');
      refreshTimetableView();
      return savedRow || true;
    } catch (e) { w.showToast ? showToast(e.message, 'error') : alert(e.message); return false; } finally { if (!opts.silent && w.hideLoading) hideLoading(); }
  };
  w.v66GenerateTimetable = async function () {
    try {
      if (w.showLoading) showLoading();
      const scope = document.getElementById('ttScope')?.value || 'term'; const term = document.getElementById('ttTerm')?.value || 'Term 1'; const year = Number(document.getElementById('ttYear')?.value || new Date().getFullYear());
      const response = await req('/api/timetable/generate', { method: 'POST', body: JSON.stringify({ weekStartDate: weekStart(), periods: activePeriods, scope, term, year }) });
      const generated = response?.data || response;
      if (generated) {
        activeTimetable = generated;
        activeTimetableId = generated.id || generated.timetableId || activeTimetableId;
        activePeriods = getPeriodsFromSlots(generated.slots || []);
        activeTimetable.slots = normalizeSlots(generated.slots || [], activePeriods);
        activeTimetable.classes = generated.classes && generated.classes.length ? generated.classes : buildClassBlocks(activeTimetable.slots);
        activeLiveTimetableId = generated.liveTimetableId || activeLiveTimetableId || null;
        activeHasUnpublishedChanges = true;
        timetableDirty = false;
      }
      if (w.showToast) showToast('Timetable generated', 'success');
      await w.showDashboardSection?.('timetable');
    } catch (e) { w.showToast ? showToast(e.message, 'error') : alert(e.message); } finally { if (w.hideLoading) hideLoading(); }
  };
  w.v66PublishTimetable = async function () {
    if (!activeTimetableId) { alert('Generate or load a timetable first.'); return; }
    try {
      if (w.showLoading) showLoading();
      const saved = await w.v66SaveTimetable({ silent: true });
      if (!saved) return;
      const scope = document.getElementById('ttScope')?.value || activeTimetable.scope || 'term'; const term = document.getElementById('ttTerm')?.value || activeTimetable.term || 'Term 1'; const year = Number(document.getElementById('ttYear')?.value || activeTimetable.year || new Date().getFullYear());
      const published=await req(`/api/timetable/${activeTimetableId}/publish`, { method:'POST', body:JSON.stringify({scope,term,year}) });
      const row = published?.data || {};
      if (row.id) {
        activeTimetableId = row.id;
        activeLiveTimetableId = row.id;
        activeTimetable = {...row, slots: normalizeSlots(row.slots || activeTimetable.slots || [], activePeriods), classes: row.classes || activeTimetable.classes || []};
      } else {
        activeTimetable.isPublished=true; activeTimetable.status='published';
      }
      timetableDirty=false; activeHasUnpublishedChanges=false;
      w.showToast && showToast(published.message || `Timetable published for the ${scope}. The latest changes are now visible to users.`, 'success');
      await w.showDashboardSection?.('timetable');
    } catch (e) { w.showToast ? showToast(e.message, 'error') : alert(e.message); } finally { if (w.hideLoading) hideLoading(); }
  };

  async function renderReadOnlyTimetableFrom(path,title,opts={}){
    try{
      const r=await req(path); const data=r?.data??r; const meta=r?.meta||data?.meta||{};
      const raw=data?.timetable??data;
      if(meta.published===false || (Array.isArray(raw)&&raw.length===0)) return `<div class="timetable-v33-card v12-card"><h2>${esc(title)}</h2><div class="mt-4 rounded-lg bg-muted/40 p-5"><strong>Not published yet</strong><p class="mt-1 text-muted-foreground">The school has not published this timetable. The last published timetable will appear here automatically.</p></div></div>`;
      activePeriods=getPeriodsFromSlots(raw); const slots=normalizeSlots(raw,activePeriods); const subtitle=[data?.classInfo?.name||meta?.classInfo?.name,data?.term||meta?.term,data?.year||meta?.year,data?.scope||meta?.scope].filter(Boolean).join(' • ');
      return `<div class="timetable-v66-page timetable-v33-page timetable-v41-page animate-fade-in"><section class="timetable-v33-hero timetable-v41-hero v12-hero"><div class="v12-hero-inner timetable-v41-hero-inner"><div><div class="v12-eyebrow">Timetable</div><h1 class="v12-title">${esc(title)}</h1><p class="v12-sub">${esc(subtitle||'Published timetable')}</p></div></div></section>${opts.todayOnly?renderToday(slots,opts.todayTitle||'Today’s Lessons',opts.parentStatus):''}<div class="timetable-v33-card timetable-v41-grid-card v12-card">${renderGrid(slots,{editable:false,classId:'all',parentStatus:opts.parentStatus})}</div></div>`;
    }catch(e){return `<div class="timetable-v33-card v12-card"><h2>${esc(title)}</h2><p class="text-red-500">${esc(e.message)}</p></div>`;}
  }

  w.renderStudentTimetable = async function () { return renderReadOnlyTimetableFrom('/api/timetable/student/me', 'My Timetable', { todayOnly: true, todayTitle: 'Today’s Lessons' }); };
  w.renderParentTimetable = async function () {
    const childId = window.dashboardData?.selectedChildId || localStorage.getItem('shule_selected_child_id') || window.selectedChildId || '';
    return childId ? renderReadOnlyTimetableFrom(`/api/timetable/parent/child/${childId}`, 'Child Timetable', { todayOnly: true, todayTitle: 'Today’s Lessons', parentStatus: true }) : `<div class="timetable-v33-card v12-card"><h2>Child Timetable</h2><p>Select a linked child to view the timetable.</p></div>`;
  };
  w.renderTeacherTimetable = async function () {
    return renderReadOnlyTimetableFrom('/api/timetable/teacher/me', 'My Teaching Timetable');
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
