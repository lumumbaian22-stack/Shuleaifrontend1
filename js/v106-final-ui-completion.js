// V106 final UI completion layer: finishes locked screens without rewriting dashboards.
(function () {
  'use strict';

  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const asArray = (value) => Array.isArray(value) ? value : [];
  const currentYear = () => new Date().getFullYear();

  function statusBadge(status) {
    const s = String(status || 'not_taken').toLowerCase();
    const cls = s === 'taking' || s === 'taking_core'
      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
      : s === 'exempted'
        ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200';
    return `<span class="px-2 py-1 rounded-full text-xs font-semibold ${cls}">${esc(s.replace(/_/g, ' '))}</span>`;
  }

  async function loadAdminStudentSubjectPayload(selectedStudentId) {
    const [studentsRes, classesRes] = await Promise.all([
      api.admin.getStudents(),
      api.admin.getClasses().catch(() => ({ data: [] }))
    ]);
    const students = asArray(studentsRes.data);
    const classes = asArray(classesRes.data);
    let studentId = selectedStudentId || localStorage.getItem('v106SelectedStudentForSubjects') || students[0]?.id || '';
    if (!students.some(s => String(s.id) === String(studentId))) studentId = students[0]?.id || '';
    let detail = null;
    if (studentId) {
      detail = await api.admin.getStudentSubjectSelection(studentId);
      localStorage.setItem('v106SelectedStudentForSubjects', String(studentId));
    }
    return { students, classes, studentId, detail: detail?.data || null };
  }

  function subjectLevelLabel(subject) {
    const levels = subject.levelLabels || subject.levelCodes || [];
    return Array.isArray(levels) && levels.length ? levels.join(', ') : (subject.levelLabel || subject.levelCode || 'Current class');
  }

  function renderSubjectSelectionRows(eligibleSubjects, selections) {
    const selectedByName = new Map(asArray(selections).map(row => [String(row.subjectName || row.name || '').toLowerCase(), row]));
    if (!eligibleSubjects.length) {
      return `<div class="rounded-xl border border-yellow-300 bg-yellow-50 text-yellow-900 dark:bg-yellow-900/20 dark:text-yellow-100 dark:border-yellow-700 p-5">
        <h3 class="font-semibold">No valid subjects found for this student class.</h3>
        <p class="text-sm mt-1">Save the curriculum structure and Add Subjects checklist first. The new engine will not use old/manual subjects.</p>
      </div>`;
    }
    const groups = new Map();
    for (const subject of eligibleSubjects) {
      const key = subject.category || 'subjects';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(subject);
    }
    return [...groups.entries()].map(([category, subjects]) => {
      const rows = subjects.map(subject => {
        const saved = selectedByName.get(String(subject.name || '').toLowerCase());
        const defaultStatus = saved?.status || (subject.isCore || subject.category === 'compulsory' ? 'taking' : 'not_taken');
        const data = {
          subjectId: subject.id,
          subjectName: subject.name,
          name: subject.name,
          category: subject.category || '',
          isCore: !!subject.isCore,
          isCompulsory: !!(subject.isCore || subject.category === 'compulsory'),
          isElective: !!subject.isOptional,
          pathway: subject.pathway || '',
          track: subject.track || ''
        };
        const meta = `${subjectLevelLabel(subject)}${subject.pathway ? ' • ' + subject.pathway : ''}${subject.track ? ' • ' + subject.track : ''}`;
        return `<div class="p-4 grid gap-3 md:grid-cols-[1fr_auto_auto] md:items-center">
          <div>
            <p class="font-semibold">${esc(subject.name)}</p>
            <p class="text-xs text-muted-foreground">${esc(meta)}</p>
          </div>
          <div>${statusBadge(defaultStatus)}</div>
          <select class="v106-subject-status rounded-lg border bg-background px-3 py-2 text-sm" data-subject='${esc(JSON.stringify(data))}'>
            <option value="taking" ${defaultStatus === 'taking' || defaultStatus === 'taking_core' ? 'selected' : ''}>Taking / Counted if marked</option>
            <option value="not_taken" ${defaultStatus === 'not_taken' ? 'selected' : ''}>Not Taken</option>
            <option value="exempted" ${defaultStatus === 'exempted' ? 'selected' : ''}>Exempted</option>
            <option value="pending_approval" ${defaultStatus === 'pending_approval' ? 'selected' : ''}>Pending Approval</option>
          </select>
        </div>`;
      }).join('');
      return `<div class="rounded-xl border bg-card overflow-hidden v106-card">
        <div class="px-4 py-3 border-b bg-muted/30 flex items-center justify-between gap-3">
          <div>
            <h3 class="font-semibold capitalize">${esc(String(category).replace(/_/g, ' '))}</h3>
            <p class="text-xs text-muted-foreground">Choose whether this learner is taking each subject.</p>
          </div>
          <span class="text-xs rounded-full border px-2 py-1">${subjects.length} subject(s)</span>
        </div>
        <div class="divide-y">${rows}</div>
      </div>`;
    }).join('');
  }

  window.v106RenderAdminStudentSubjectSelection = async function () {
    try {
      const selected = localStorage.getItem('v106SelectedStudentForSubjects');
      const { students, studentId, detail } = await loadAdminStudentSubjectPayload(selected);
      const selectedStudent = students.find(s => String(s.id) === String(studentId));
      const studentName = selectedStudent?.User?.name || selectedStudent?.name || detail?.student?.User?.name || 'Student';
      const classItem = detail?.class || null;
      const eligibleSubjects = asArray(detail?.eligibleSubjects);
      const selections = asArray(detail?.selections);
      const seniorLike = /grade\s*1[0-2]|year\s*1[0-3]|form\s*[3-4]|senior/i.test(`${classItem?.name || ''} ${classItem?.grade || ''} ${selectedStudent?.grade || ''}`);
      const pathway = selections.find(s => s.pathway)?.pathway || '';
      const track = selections.find(s => s.track)?.track || '';

      return `<div class="space-y-6 animate-fade-in v106-subject-selection-page">
        <div class="rounded-2xl border bg-card p-6 v106-card">
          <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h2 class="text-2xl font-bold">Student Subject Selection</h2>
              <p class="text-sm text-muted-foreground mt-1">Controlled Grade 10–12 pathway/elective selection. Also works for any class where a learner has Not Taken or Exempted subjects.</p>
            </div>
            <button onclick="showDashboardSection('students')" class="px-4 py-2 rounded-lg border hover:bg-accent">Back to Students</button>
          </div>
          <div class="mt-5 grid gap-4 lg:grid-cols-3">
            <div class="lg:col-span-2">
              <label class="block text-sm font-medium mb-1">Select student</label>
              <select id="v106-student-select" class="w-full rounded-lg border bg-background px-3 py-2" onchange="v106ChangeSubjectSelectionStudent(this.value)">
                ${students.map(s => `<option value="${esc(s.id)}" ${String(s.id) === String(studentId) ? 'selected' : ''}>${esc(s.User?.name || s.name || 'Student')} — ${esc(s.grade || 'No class')}</option>`).join('')}
              </select>
            </div>
            <div class="rounded-xl border bg-muted/30 p-4">
              <p class="text-xs text-muted-foreground">Current class</p>
              <p class="font-bold">${esc(classItem?.name || selectedStudent?.grade || 'No class detected')}</p>
              <p class="text-xs text-muted-foreground mt-1">${eligibleSubjects.length} eligible subject(s)</p>
            </div>
          </div>
        </div>

        <div class="rounded-2xl border bg-card p-5 v106-card">
          <div class="grid gap-4 lg:grid-cols-3">
            <div>
              <label class="block text-sm font-medium mb-1">Pathway ${seniorLike ? '<span class="text-primary">(Senior)</span>' : '<span class="text-muted-foreground">(optional)</span>'}</label>
              <select id="v106-pathway" class="w-full rounded-lg border bg-background px-3 py-2">
                ${['', 'STEM', 'Social Sciences', 'Arts & Sports Science', 'Custom'].map(p => `<option value="${esc(p)}" ${pathway === p ? 'selected' : ''}>${p || 'Not selected'}</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Track</label>
              <input id="v106-track" class="w-full rounded-lg border bg-background px-3 py-2" value="${esc(track)}" placeholder="Pure Sciences, Applied Sciences, Humanities...">
            </div>
            <div class="flex items-end">
              <button onclick="v106SaveStudentSubjectSelection('${esc(studentId)}')" class="w-full px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">Save Subject Selection</button>
            </div>
          </div>
          <p class="text-xs text-muted-foreground mt-3">Saving here controls teacher grading, report cards, Career Compass, and whether optional subjects count.</p>
        </div>

        <div class="space-y-4">
          ${renderSubjectSelectionRows(eligibleSubjects, selections)}
        </div>
      </div>`;
    } catch (error) {
      return `<div class="rounded-xl border bg-card p-8 text-red-500">Error loading subject selection: ${esc(error.message)}</div>`;
    }
  };

  window.v106ChangeSubjectSelectionStudent = function (studentId) {
    localStorage.setItem('v106SelectedStudentForSubjects', String(studentId || ''));
    showDashboardSection('student-subject-selection');
  };

  window.v106SaveStudentSubjectSelection = async function (studentId) {
    if (!studentId) return showToast('Select a student first', 'error');
    const pathway = document.getElementById('v106-pathway')?.value || null;
    const track = document.getElementById('v106-track')?.value || null;
    const subjects = [...document.querySelectorAll('.v106-subject-status')].map(select => {
      const base = JSON.parse(select.dataset.subject || '{}');
      return { ...base, status: select.value, pathway: base.pathway || pathway, track: base.track || track };
    });
    showLoading();
    try {
      const detail = await api.admin.getStudentSubjectSelection(studentId);
      const classId = detail?.data?.class?.id || null;
      await api.admin.saveStudentSubjectSelection(studentId, { classId, pathway, track, subjects });
      showToast('Student subject selection saved. Teacher grading and report cards will use this immediately.', 'success');
      await showDashboardSection('student-subject-selection');
    } catch (error) {
      showToast(error.message || 'Failed to save subject selection', 'error');
    } finally {
      hideLoading();
    }
  };

  function renderPaymentConfirmationCard() {
    return `<div class="rounded-xl border bg-card p-5 v106-card" id="v106-payment-confirmation-card">
      <div class="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h3 class="font-semibold text-lg">Submit Manual Payment Confirmation</h3>
          <p class="text-sm text-muted-foreground mt-1">Use this when the school paid by M-Pesa reference, bank, or cash and it has not reflected automatically. Super admin will approve/reject it.</p>
        </div>
        <span class="text-xs rounded-full border px-3 py-1">Goes to Super Admin</span>
      </div>
      <div class="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <label class="block"><span class="text-sm font-medium">Amount Paid</span><input id="v106-pay-amount" type="number" min="0" class="mt-1 w-full rounded-lg border bg-background px-3 py-2" placeholder="100000"></label>
        <label class="block"><span class="text-sm font-medium">Method</span><select id="v106-pay-method" class="mt-1 w-full rounded-lg border bg-background px-3 py-2"><option value="mpesa">M-Pesa</option><option value="bank">Bank Transfer</option><option value="cash">Cash</option><option value="other">Other</option></select></label>
        <label class="block"><span class="text-sm font-medium">Reference / Receipt</span><input id="v106-pay-reference" class="mt-1 w-full rounded-lg border bg-background px-3 py-2" placeholder="M-Pesa code / bank ref"></label>
        <label class="block"><span class="text-sm font-medium">Paid Date</span><input id="v106-pay-date" type="date" value="${new Date().toISOString().slice(0,10)}" class="mt-1 w-full rounded-lg border bg-background px-3 py-2"></label>
        <label class="block"><span class="text-sm font-medium">Requested Plan</span><select id="v106-pay-plan" class="mt-1 w-full rounded-lg border bg-background px-3 py-2"><option value="school_starter">Starter</option><option value="school_growth" selected>Growth</option><option value="school_enterprise">Enterprise</option><option value="custom">Custom</option></select></label>
        <label class="block"><span class="text-sm font-medium">Proof URL / Note</span><input id="v106-pay-proof" class="mt-1 w-full rounded-lg border bg-background px-3 py-2" placeholder="Optional screenshot URL"></label>
      </div>
      <label class="block mt-4"><span class="text-sm font-medium">Notes</span><textarea id="v106-pay-notes" rows="3" class="mt-1 w-full rounded-lg border bg-background px-3 py-2" placeholder="Example: Paid from school Paybill at 10:32 AM but status did not update."></textarea></label>
      <div class="mt-4 flex justify-end"><button onclick="v106SubmitPaymentConfirmation()" class="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">Submit for Confirmation</button></div>
    </div>`;
  }

  window.v106SubmitPaymentConfirmation = async function () {
    const data = {
      amount: Number(document.getElementById('v106-pay-amount')?.value || 0),
      method: document.getElementById('v106-pay-method')?.value || 'mpesa',
      reference: document.getElementById('v106-pay-reference')?.value || '',
      paidAt: document.getElementById('v106-pay-date')?.value || new Date().toISOString(),
      requestedPlan: document.getElementById('v106-pay-plan')?.value || 'school_growth',
      proofUrl: document.getElementById('v106-pay-proof')?.value || '',
      notes: document.getElementById('v106-pay-notes')?.value || ''
    };
    if (!data.amount || data.amount <= 0) return showToast('Enter the amount paid', 'error');
    if (!data.reference.trim()) return showToast('Enter the M-Pesa code, bank reference, or receipt number', 'error');
    showLoading();
    try {
      await api.admin.submitSchoolPaymentConfirmation(data);
      showToast('Payment confirmation submitted to super admin.', 'success');
      ['v106-pay-amount','v106-pay-reference','v106-pay-proof','v106-pay-notes'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    } catch (error) {
      showToast(error.message || 'Failed to submit payment confirmation', 'error');
    } finally { hideLoading(); }
  };

  function withStudentSubjectToolbar(html) {
    return `<div class="rounded-xl border bg-card p-4 mb-6 v106-card">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div><h3 class="font-semibold">Senior / Elective Subject Selection</h3><p class="text-sm text-muted-foreground">Approve Grade 10–12 pathways, tracks, compulsory subjects, and electives.</p></div>
        <button onclick="showDashboardSection('student-subject-selection')" class="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">Open Subject Selection</button>
      </div>
    </div>${html}`;
  }

  async function renderTeacherAssignmentLabelCard() {
    try {
      const res = await api.teacher.getMyAssignments();
      const data = res.data || {};
      const classTeacher = data.classTeacher || null;
      const subjects = asArray(data.subjects);
      const subjectPreview = subjects.slice(0, 4).map(s => `${s.className || 'Class'} — ${s.subject}`).join(' · ');
      return `<div class="rounded-xl border bg-card p-5 mb-6 v106-card">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p class="text-xs uppercase tracking-wide text-muted-foreground">Teacher assignment</p>
            <h3 class="text-xl font-bold">${classTeacher ? `Class Teacher: ${esc(classTeacher.name)}` : 'Class Teacher: Not assigned'}</h3>
            <p class="text-sm text-muted-foreground mt-1">${classTeacher ? `Actual assigned class: ${esc(classTeacher.name)}${classTeacher.grade ? ` • ${esc(classTeacher.grade)}` : ''}` : (subjectPreview || 'No subject assignment has been configured yet.')}</p>
          </div>
          <div class="flex gap-2 flex-wrap">
            ${classTeacher ? '<span class="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold">Class Teacher</span>' : ''}
            ${subjects.length ? `<span class="px-3 py-1 rounded-full border text-sm">${subjects.length} subject assignment(s)</span>` : ''}
          </div>
        </div>
      </div>`;
    } catch (_) { return ''; }
  }

  function installRenderOverrides() {
    if (window.__v106UiCompletionInstalled) return;
    window.__v106UiCompletionInstalled = true;

    const originalAdmin = window.renderAdminSection;
    if (typeof originalAdmin === 'function') {
      window.renderAdminSection = async function (section) {
        if (section === 'student-subject-selection') return await window.v106RenderAdminStudentSubjectSelection();
        const html = await originalAdmin(section);
        if (section === 'students') return withStudentSubjectToolbar(html);
        if (section === 'subscription-billing') return `${html}<div class="mt-6">${renderPaymentConfirmationCard()}</div>`;
        return html;
      };
    }

    const originalTeacher = window.renderTeacherSection;
    if (typeof originalTeacher === 'function') {
      window.renderTeacherSection = async function (section) {
        const html = await originalTeacher(section);
        if (section === 'dashboard') return `${await renderTeacherAssignmentLabelCard()}${html}`;
        return html;
      };
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installRenderOverrides);
  else installRenderOverrides();
})();
