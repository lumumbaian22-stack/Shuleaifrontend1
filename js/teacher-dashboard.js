// teacher-dashboard.js - Complete functional version with dark mode support

let replyingTo = null;

// ============ ROLE DETECTION ============
function getTeacherRole() {
  const user = getCurrentUser();
  if (!user || user.role !== 'teacher') return 'subject_teacher';
  // Check if teacher has a class assigned via classId (most reliable)
  if (user.teacher && user.teacher.classId) return 'class_teacher';
  if (user.classId) return 'class_teacher';
  // Fallback to string (legacy)
  if (user.classTeacher) return 'class_teacher';
  if (user.teacher && user.teacher.classTeacher) return 'class_teacher';
  return 'subject_teacher';
}

function isClassTeacher() {
  const role = getTeacherRole();
  return role === 'class_teacher' || role === 'both';
}

function isSubjectTeacher() {
  const role = getTeacherRole();
  return role === 'subject_teacher' || role === 'both';
}

function getTeacherRoleDescription() {
  const role = getTeacherRole();
  if (role === 'class_teacher') return 'You are the Class Teacher. You can manage students, upload via CSV, and enter marks for all subjects in your class.';
  if (role === 'subject_teacher') return 'You are a Subject Teacher. You can enter marks for your assigned subjects and classes.';
  if (role === 'both') return 'You are both a Class Teacher and Subject Teacher. You have full access.';
  return 'Manage your classes, students, and grades.';
}

function getTeacherAssignedClass() {
  const user = getCurrentUser();
  if (!user || user.role !== 'teacher') return null;
  if (!user.teacher) user.teacher = {};
  if (user.teacher.classId) {
    return { id: user.teacher.classId, name: user.teacher.className || 'Assigned Class', studentCount: user.teacher.studentCount || 0 };
  }
  if (user.classTeacher) {
    return { id: null, name: user.classTeacher, studentCount: 0 };
  }
  return null;
}

// ============ RENDER TEACHER SECTIONS ============
async function renderTeacherSection(section) {
  try {
    switch(section) {
      case 'dashboard': return await renderTeacherDashboard();
      case 'competency': return await renderTeacherCompetency();
      case 'students': return isClassTeacher() ? await renderTeacherStudents() : '<div class="text-center py-12"><i data-lucide="lock" class="h-12 w-12 mx-auto mb-3"></i><p>Only Class Teachers can manage students.</p></div>';
      case 'attendance': return await renderTeacherAttendance();
      case 'grades': return await renderTeacherMarksEntry();
      case 'tasks': return await renderTeacherTasks();
      case 'duty': return await renderTeacherDuty();
      case 'duty-preferences': return renderTeacherDutyPreferences();
      case 'staff-chat': return await renderStaffChat();
      case 'parent-chat': return await renderParentChat();
      case 'settings': return await renderTeacherSettings();
      case 'help': return await renderHelpSection('teacher');
      case 'profile': return await renderProfileSection();
      default: return await renderTeacherDashboard();
    }
  } catch (error) {
    console.error('Error rendering teacher section:', error);
    return `<div class="text-center py-12 text-red-500">Error loading section: ${error.message}</div>`;
  }
}

// ============ DASHBOARD WITH REAL DATA AND CHARTS ============
async function renderTeacherDashboard() {
  const user = getCurrentUser();
  const role = getTeacherRole();
  const teacherClass = getTeacherAssignedClass();
  const hasClass = teacherClass !== null;
  const className = teacherClass?.name || 'No class assigned';
  
  let stats = { studentCount: 0, classAverage: 0, attendanceToday: '0/0', pendingTasks: 0 };
  let performanceData = { subjectAverages: [], attendanceTrend: [] };
  try {
    const statsRes = await api.teacher.getTeacherStats();
    if (statsRes.success) stats = statsRes.data;
    const perfRes = await api.teacher.getPerformanceData();
    if (perfRes.success) performanceData = perfRes.data;
  } catch(e) { console.error(e); }

  const html = `
    <div class="space-y-6 animate-fade-in">
      <!-- Welcome Header -->
      <div class="rounded-xl border bg-card p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div class="flex items-center flex-wrap gap-2">
              <h2 class="text-2xl font-bold">Welcome, ${escapeHtml(user?.name || 'Teacher')}!</h2>
              <span class="ml-2 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded-full">${role === 'class_teacher' ? 'Class Teacher' : 'Subject Teacher'}</span>
            </div>
            <p class="text-muted-foreground mt-1 text-sm">${getTeacherRoleDescription()}</p>
            ${hasClass ? `<div class="mt-3 p-3 bg-primary/10 rounded-lg inline-block"><span class="text-sm font-medium">📚 Your Class: </span><span class="text-sm font-bold text-primary">${escapeHtml(className)}</span> <span class="text-xs text-muted-foreground ml-2">(${stats.studentCount} students)</span></div>` : ''}
          </div>
          ${isClassTeacher() ? `<button onclick="showCSVUploadModal()" class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2 shadow-sm"><i data-lucide="upload" class="h-4 w-4"></i> Upload Students (CSV)</button>` : ''}
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div class="rounded-xl border bg-card p-6 card-hover"><div class="flex items-center justify-between"><div><p class="text-sm text-muted-foreground">My Students</p><h3 class="text-2xl font-bold mt-1">${stats.studentCount || 0}</h3></div><div class="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center"><i data-lucide="users" class="h-6 w-6 text-blue-600 dark:text-blue-400"></i></div></div></div>
        <div class="rounded-xl border bg-card p-6 card-hover"><div class="flex items-center justify-between"><div><p class="text-sm text-muted-foreground">Class Average</p><h3 class="text-2xl font-bold mt-1">${stats.classAverage || 0}%</h3></div><div class="h-12 w-12 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center"><i data-lucide="trending-up" class="h-6 w-6 text-violet-600 dark:text-violet-400"></i></div></div></div>
        <div class="rounded-xl border bg-card p-6 card-hover"><div class="flex items-center justify-between"><div><p class="text-sm text-muted-foreground">Attendance Today</p><h3 class="text-2xl font-bold mt-1">${stats.attendanceToday || '0/0'}</h3></div><div class="h-12 w-12 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center"><i data-lucide="calendar-check" class="h-6 w-6 text-amber-600 dark:text-amber-400"></i></div></div></div>
        <div class="rounded-xl border bg-card p-6 card-hover"><div class="flex items-center justify-between"><div><p class="text-sm text-muted-foreground">Pending Tasks</p><h3 class="text-2xl font-bold mt-1">${stats.pendingTasks || 0}</h3></div><div class="h-12 w-12 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center"><i data-lucide="check-square" class="h-6 w-6 text-red-600 dark:text-red-400"></i></div></div></div>
      </div>

      <!-- Charts Row -->
      <div class="grid gap-4 lg:grid-cols-2">
        <div class="rounded-xl border bg-card p-6"><div class="flex justify-between items-center mb-4"><h3 class="font-semibold">Subject Performance</h3></div><div class="chart-container h-64"><canvas id="teacher-performanceChart"></canvas></div></div>
        <div class="rounded-xl border bg-card p-6"><div class="flex justify-between items-center mb-4"><h3 class="font-semibold">Attendance Trend (Last 7 days)</h3></div><div class="chart-container h-64"><canvas id="teacher-gradeChart"></canvas></div></div>
      </div>

      <!-- Parent Messages Inbox -->
      <div class="rounded-xl border bg-card p-6">
        <div class="flex justify-between items-center mb-4"><div class="flex items-center gap-2"><i data-lucide="message-circle" class="h-5 w-5 text-primary"></i><h3 class="font-semibold text-lg">Parent Messages</h3></div><span class="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-1 rounded-full text-xs font-medium" id="teacher-message-count-badge">0</span></div>
        <div id="teacher-messages-list" class="space-y-2 max-h-96 overflow-y-auto"><div class="text-center text-muted-foreground py-8"><i data-lucide="message-circle" class="h-12 w-12 mx-auto mb-3 opacity-50"></i><p>Loading messages...</p></div></div>
        <button onclick="loadTeacherMessages()" class="mt-4 w-full py-2 text-sm border rounded-lg hover:bg-accent flex items-center justify-center gap-2"><i data-lucide="refresh-cw" class="h-4 w-4"></i> Refresh Messages</button>
      </div>

      <!-- Duty Card -->
      <div class="rounded-xl border bg-card p-6" id="duty-card"><div class="flex justify-between items-start"><div><h3 class="font-semibold">Today's Duty</h3><p class="text-sm text-muted-foreground" id="duty-location">Loading...</p></div><span class="duty-status px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs rounded-full" id="duty-status">Not Checked In</span></div><div class="mt-4 flex gap-3"><button onclick="handleCheckIn()" class="flex-1 bg-primary text-primary-foreground py-2 rounded-lg" id="check-in-btn">Check In</button><button onclick="handleCheckOut()" class="flex-1 border bg-background py-2 rounded-lg" id="check-out-btn" disabled>Check Out</button></div><div class="mt-3 text-xs text-muted-foreground">Last duty rating: <span id="last-rating">4.5</span>/5</div></div>
    </div>
  `;

  setTimeout(() => {
    const perfCtx = document.getElementById('teacher-performanceChart');
    const gradeCtx = document.getElementById('teacher-gradeChart');
    if (perfCtx && performanceData.subjectAverages && performanceData.subjectAverages.length) {
      if (window.teacherPerfChart) window.teacherPerfChart.destroy();
      window.teacherPerfChart = new Chart(perfCtx, {
        type: 'line',
        data: {
          labels: performanceData.subjectAverages.map(s => s.subject),
          datasets: [{ label: 'Average Score (%)', data: performanceData.subjectAverages.map(s => s.average), borderColor: '#8b5cf6', tension: 0.4, fill: false }]
        },
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, max: 100 } } }
      });
    } else if (perfCtx) {
      perfCtx.parentElement.innerHTML = '<div class="flex items-center justify-center h-full"><p class="text-muted-foreground">No performance data yet</p></div>';
    }
    if (gradeCtx && performanceData.attendanceTrend && performanceData.attendanceTrend.length) {
      if (window.teacherGradeChart) window.teacherGradeChart.destroy();
      window.teacherGradeChart = new Chart(gradeCtx, {
        type: 'bar',
        data: {
          labels: performanceData.attendanceTrend.map(a => moment(a.date).format('MMM D')),
          datasets: [{ label: 'Attendance Rate (%)', data: performanceData.attendanceTrend.map(a => a.rate), backgroundColor: '#3b82f6', borderRadius: 6 }]
        },
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, max: 100 } } }
      });
    } else if (gradeCtx) {
      gradeCtx.parentElement.innerHTML = '<div class="flex items-center justify-center h-full"><p class="text-muted-foreground">No attendance data yet</p></div>';
    }
    loadTodayDuty();
    loadTeacherMessages();
  }, 100);

  return html;
}

// ============ TEACHER STUDENTS ============
async function renderTeacherStudents() {
  const students = await loadMyStudents();
  return renderStudentsTable(students);
}

async function loadMyStudents() {
  try {
    const response = await api.teacher.getMyStudents();
    return response.data || [];
  } catch(e) {
    console.error(e);
    return [];
  }
}

function renderStudentsTable(students) {
  if (!students || students.length === 0) {
    return '<div class="text-center py-8 text-muted-foreground">No students in your class</div>';
  }
  let html = `
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-muted/50">
          <tr>
            <th class="px-4 py-3 text-left">Student</th>
            <th class="px-4 py-3 text-left">ELIMUID</th>
            <th class="px-4 py-3 text-left">Grade</th>
            <th class="px-4 py-3 text-center">Attendance</th>
            <th class="px-4 py-3 text-center">Average</th>
            <th class="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y">
  `;
  for (const s of students) {
    const user = s.User || {};
    const name = user.name || 'Unknown';
    const elimuid = s.elimuid || 'N/A';
    const grade = s.grade || 'N/A';
    const attendance = s.attendance || 95;
    const average = s.average || 0;
    html += `
      <tr class="hover:bg-accent/50">
        <td class="px-4 py-3">${escapeHtml(name)}</td>
        <td class="px-4 py-3"><span class="font-mono text-xs bg-muted px-2 py-1 rounded">${elimuid}</span></td>
        <td class="px-4 py-3">${grade}</td>
        <td class="px-4 py-3 text-center">${attendance}%</td>
        <td class="px-4 py-3 text-center">${average}%</td>
        <td class="px-4 py-3 text-right">
          <button onclick="viewStudentDetails('${s.id}')" class="p-2 hover:bg-accent rounded-lg"><i data-lucide="eye"></i></button>
          <button onclick="copyToClipboard('${elimuid}')" class="p-2 hover:bg-accent rounded-lg"><i data-lucide="copy"></i></button>
        </td>
      </tr>
    `;
  }
  html += `</tbody></table></div>`;
  return html;
}

// ============ ATTENDANCE ============
async function renderTeacherAttendance() {
  const students = await loadMyStudents();
  if (!students.length) return '<div class="text-center py-12">No students in your class</div>';
  const today = new Date().toISOString().split('T')[0];
  let html = `<div class="space-y-6"><h2 class="text-2xl font-bold">Take Attendance - ${today}</h2><div class="rounded-xl border bg-card overflow-hidden"><div class="p-4 border-b flex justify-end"><button onclick="saveAttendance()" class="px-4 py-2 bg-primary text-white rounded-lg">Save Attendance</button></div><div class="overflow-x-auto"><table class="w-full text-sm"><thead class="bg-muted/50"><tr><th class="px-4 py-3 text-left">Student</th><th class="px-4 py-3 text-left">ELIMUID</th><th class="px-4 py-3 text-center">Status</th><th class="px-4 py-3 text-left">Notes</th></tr></thead><tbody>`;
  for (const s of students) {
    html += `<tr data-student-id="${s.id}"><td class="px-4 py-3">${escapeHtml(s.User?.name)}</td><td class="px-4 py-3">${s.elimuid}</td><td class="px-4 py-3 text-center"><select class="attendance-status rounded border px-2 py-1 bg-background"><option value="present">Present</option><option value="absent">Absent</option><option value="late">Late</option><option value="sick">Sick</option></select></td><td class="px-4 py-3"><input type="text" class="attendance-note w-full rounded border px-2 py-1 bg-background" placeholder="Note"></td></tr>`;
  }
  html += `</tbody></table></div></div></div>`;
  return html;
}

async function saveAttendance() {
  const rows = document.querySelectorAll('[data-student-id]');
  const attendanceData = [];
  for (const row of rows) {
    const studentId = row.dataset.studentId;
    const status = row.querySelector('.attendance-status')?.value;
    const reason = row.querySelector('.attendance-note')?.value;
    if (status) attendanceData.push({ studentId: parseInt(studentId), date: new Date().toISOString().split('T')[0], status, reason });
  }
  if (!attendanceData.length) return showToast('No attendance data', 'error');
  showLoading();
  try {
    for (const data of attendanceData) await api.teacher.takeAttendance(data);
    showToast('Attendance saved', 'success');
  } catch(e) { showToast(e.message, 'error'); } finally { hideLoading(); }
}

async function renderTeacherCompetency() {
  const [heatmapData, belowExpectation, insights] = await Promise.all([
    apiRequest('/api/cbe/class-heatmap'),
    apiRequest('/api/cbe/below-expectation'),
    apiRequest('/api/cbe/auto-insights')
  ]);
  return `
    <div class="space-y-6">
      <h2 class="text-2xl font-bold">Competency Dashboard</h2>
      <div class="grid gap-4 lg:grid-cols-2">
        <!-- Heatmap -->
        <div class="rounded-xl border bg-card p-4 overflow-x-auto">
          <h3 class="font-semibold mb-3">Class Competency Heatmap</h3>
          <table class="text-sm min-w-[500px]">
            <thead><tr><th>Student</th>${heatmapData.data.outcomes.map(o => `<th class="px-2">${o.code}</th>`).join('')}</tr></thead>
            <tbody>
              ${heatmapData.data.heatmap.map(row => `
                <tr>
                  <td class="font-medium">${row.studentName}</td>
                  ${row.outcomes.map(out => `<td class="text-center px-2 ${getLevelColor(out.level)}">${out.level}</td>`).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        <!-- Below Expectation List -->
        <div class="rounded-xl border bg-card p-4">
          <h3 class="font-semibold mb-3">Students Below Expectation</h3>
          ${belowExpectation.data.map(s => `
            <div class="border-b py-2">
              <p class="font-medium">${s.studentName}</p>
              <ul class="text-sm text-muted-foreground">
                ${s.weakAreas.map(w => `<li>⚠️ ${w.competency} – ${w.outcome.substring(0,50)} (${w.level})</li>`).join('')}
              </ul>
            </div>
          `).join('')}
        </div>
      </div>
      <!-- Auto Insights -->
      <div class="rounded-xl border bg-card p-4">
        <h3 class="font-semibold mb-2">Auto Insights</h3>
        <ul class="space-y-1">
          ${insights.data.map(i => `<li class="text-sm">🔍 ${i.message}</li>`).join('')}
        </ul>
      </div>
    </div>
  `;
}
function getLevelColor(level) {
  if (level === 'EE') return 'bg-green-100 text-green-800';
  if (level === 'ME') return 'bg-blue-100 text-blue-800';
  if (level === 'AE') return 'bg-yellow-100 text-yellow-800';
  return 'bg-red-100 text-red-800';
}

// ============ MARKS ENTRY ============
async function renderTeacherMarksEntry() {
  let assignments = [];
  let teacherInfo = {};
  try {
    const teacher = await api.teacher.getMyAssignments();
    if (teacher.data) {
      teacherInfo = teacher.data;
      if (teacher.data.classTeacher) assignments.push({ type: 'class', id: teacher.data.classTeacher.id, name: teacher.data.classTeacher.name, subject: 'All Subjects' });
      for (const sub of (teacher.data.subjects || [])) assignments.push({ type: 'subject', id: sub.classId, name: sub.className, subject: sub.subject });
    }
  } catch(e) { console.error(e); }
  if (!assignments.length) return '<div class="text-center py-12">No classes or subjects assigned</div>';

  const currentYear = new Date().getFullYear();
  const terms = ['Term 1', 'Term 2', 'Term 3'];
  const years = [currentYear - 1, currentYear, currentYear + 1];

  let html = `
    <div class="space-y-6">
      <div class="flex justify-between items-center">
        <h2 class="text-2xl font-bold">Enter Marks</h2>
        <div class="flex gap-3">
          <select id="marks-term" class="rounded-lg border p-2 bg-background">
            ${terms.map(t => `<option value="${t}" ${t === 'Term 1' ? 'selected' : ''}>${t}</option>`).join('')}
          </select>
          <select id="marks-year" class="rounded-lg border p-2 bg-background">
            ${years.map(y => `<option value="${y}" ${y === currentYear ? 'selected' : ''}>${y}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="bg-muted/30 p-3 rounded-lg text-sm">
        <p><span class="font-medium">Teacher:</span> ${escapeHtml(teacherInfo.teacherName || getCurrentUser()?.name)}</p>
        <p><span class="font-medium">Department:</span> ${escapeHtml(teacherInfo.department || 'N/A')}</p>
      </div>
      <div class="grid gap-4 md:grid-cols-3">
  `;
  for (const a of assignments) {
    html += `
      <div class="rounded-xl border bg-card p-5 cursor-pointer hover:shadow-md" onclick="openMarksEntry('${a.subject}', '${a.id}', '${a.name}')">
        <div class="flex items-center gap-3 mb-3">
          <div class="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center"><i data-lucide="book" class="h-6 w-6 text-primary"></i></div>
          <div><p class="font-semibold">${escapeHtml(a.name)}</p><p class="text-sm text-muted-foreground">${escapeHtml(a.subject)}</p></div>
        </div>
        <button class="w-full py-2 text-sm bg-primary text-white rounded-lg">Enter Marks</button>
      </div>
    `;
  }
  html += `</div></div>`;
  return html;
}

let currentMarksClassId = null, currentMarksSubject = null, currentMarksStudents = [];
let currentMarksTerm = 'Term 1', currentMarksYear = new Date().getFullYear();
async function openMarksEntry(subject, classId, className) {
  currentMarksSubject = subject;
  currentMarksClassId = classId;
  currentMarksTerm = document.getElementById('marks-term')?.value || 'Term 1';
  currentMarksYear = document.getElementById('marks-year')?.value || new Date().getFullYear();
  showLoading();
  try {
    const res = await api.teacher.getClassStudents(classId);
    currentMarksStudents = res.data || [];
    if (!currentMarksStudents.length) { showToast('No students', 'warning'); hideLoading(); return; }
    showMarksEntryModal(className);
  } catch(e) { showToast(e.message, 'error'); } finally { hideLoading(); }
}

function showMarksEntryModal(className) {
  let modal = document.getElementById('marks-entry-modal');
  if (!modal) { createMarksEntryModal(); modal = document.getElementById('marks-entry-modal'); }
  const modalContent = modal.querySelector('.modal-content');
  const assessmentTypes = ['test', 'exam', 'assignment', 'project', 'quiz'];
  const today = new Date().toISOString().split('T')[0];
  const currentYear = new Date().getFullYear();
  const terms = ['Term 1', 'Term 2', 'Term 3'];
  
  modalContent.innerHTML = `
    <div class="space-y-4">
      <div class="border-b pb-3 flex justify-between items-center">
        <div>
          <h3 class="text-lg font-semibold">Enter Marks</h3>
          <p class="text-sm text-muted-foreground">Class: ${escapeHtml(className)} | Subject: ${escapeHtml(currentMarksSubject)}</p>
          <p class="text-xs text-muted-foreground">Teacher: ${escapeHtml(getCurrentUser()?.name)}</p>
        </div>
        <button onclick="closeMarksEntryModal()" class="p-2 hover:bg-accent rounded-lg"><i data-lucide="x" class="h-5 w-5"></i></button>
      </div>
      
      <div class="flex flex-wrap gap-3 items-end">
        <div class="flex-1 min-w-[150px]">
          <label class="block text-xs font-medium mb-1">Assessment Type</label>
          <select id="assessment-type" class="w-full rounded-lg border p-2 bg-background">
            ${assessmentTypes.map(t => `<option value="${t}">${t.charAt(0).toUpperCase() + t.slice(1)}</option>`).join('')}
          </select>
        </div>
        <div class="flex-1 min-w-[200px]">
          <label class="block text-xs font-medium mb-1">Assessment Name</label>
          <input type="text" id="assessment-name" placeholder="e.g., Mid-term Exam, Week 3 Test" class="w-full rounded-lg border p-2 bg-background">
        </div>
        <div class="w-[130px]">
          <label class="block text-xs font-medium mb-1">Term</label>
          <select id="assessment-term" class="w-full rounded-lg border p-2 bg-background">
            ${terms.map(t => `<option value="${t}" ${t === 'Term 1' ? 'selected' : ''}>${t}</option>`).join('')}
          </select>
        </div>
        <div class="w-[130px]">
          <label class="block text-xs font-medium mb-1">Year</label>
          <select id="assessment-year" class="w-full rounded-lg border p-2 bg-background">
            ${[currentYear - 1, currentYear, currentYear + 1].map(y => `<option value="${y}" ${y === currentYear ? 'selected' : ''}>${y}</option>`).join('')}
          </select>
        </div>
        <div class="w-[150px]">
          <label class="block text-xs font-medium mb-1">Date</label>
          <input type="date" id="assessment-date" value="${today}" class="w-full rounded-lg border p-2 bg-background">
        </div>
      </div>
      
      <div class="overflow-x-auto max-h-[55vh] overflow-y-auto border rounded-lg">
        <table class="w-full text-sm">
          <thead class="bg-muted/50 sticky top-0">
            <tr>
              <th class="px-4 py-2 text-left">Student</th>
              <th class="px-4 py-2 text-left">ELIMUID</th>
              <th class="px-4 py-2 text-center w-32">Score (%)</th>
              <th class="px-4 py-2 text-center w-24">Grade</th>
            </tr>
          </thead>
          <tbody class="divide-y">
            ${currentMarksStudents.map(s => `
              <tr>
                <td class="px-4 py-2">${escapeHtml(s.User?.name)}</td>
                <td class="px-4 py-2">${s.elimuid}</td>
                <td class="px-4 py-2 text-center">
                  <input type="number" id="score-${s.id}" class="score-input w-24 rounded border px-2 py-1 text-center bg-background" min="0" max="100" step="0.5" onchange="updateGradeDisplayForStudent('${s.id}')">
                </td>
                <td class="px-4 py-2 text-center">
                  <span id="grade-${s.id}" class="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs rounded-full">-</span>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      
      <div class="flex justify-end gap-3 pt-4 border-t">
        <button onclick="closeMarksEntryModal()" class="px-4 py-2 border rounded-lg">Cancel</button>
        <button onclick="saveAllMarks()" class="px-4 py-2 bg-primary text-white rounded-lg">Save All Marks</button>
      </div>
    </div>
  `;
  modal.classList.remove('hidden');
  if (window.lucide) lucide.createIcons();
}

function createMarksEntryModal() {
  const modalHTML = `<div id="marks-entry-modal" class="fixed inset-0 z-50 hidden"><div class="absolute inset-0 bg-black/50" onclick="closeMarksEntryModal()"></div><div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-5xl p-4"><div class="rounded-xl border bg-card shadow-xl max-h-[90vh] overflow-hidden flex flex-col"><div class="modal-content p-6 overflow-y-auto"></div></div></div></div>`;
  document.body.insertAdjacentHTML('beforeend', modalHTML);
}
function closeMarksEntryModal() { const m = document.getElementById('marks-entry-modal'); if(m) m.classList.add('hidden'); currentMarksStudents = []; }
window.updateGradeDisplayForStudent = function(studentId) {
  const score = parseFloat(document.getElementById(`score-${studentId}`)?.value);
  const gradeSpan = document.getElementById(`grade-${studentId}`);
  if (!isNaN(score) && score>=0 && score<=100) {
    let grade = ''; let color = 'gray';
    if(score>=80){grade='A';color='green'} else if(score>=75){grade='A-';color='green'} else if(score>=70){grade='B+';color='blue'} else if(score>=65){grade='B';color='blue'} else if(score>=60){grade='B-';color='blue'} else if(score>=55){grade='C+';color='yellow'} else if(score>=50){grade='C';color='yellow'} else if(score>=45){grade='C-';color='yellow'} else if(score>=40){grade='D+';color='orange'} else if(score>=35){grade='D';color='orange'} else if(score>=30){grade='D-';color='orange'} else {grade='E';color='red'}
    gradeSpan.textContent = grade;
    gradeSpan.className = `px-2 py-1 bg-${color}-100 dark:bg-${color}-900/30 text-${color}-700 dark:text-${color}-400 text-xs rounded-full`;
  } else { gradeSpan.textContent = '-'; gradeSpan.className = 'px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs rounded-full'; }
};

async function saveAllMarks() {
  const assessmentType = document.getElementById('assessment-type')?.value;
  const assessmentName = document.getElementById('assessment-name')?.value;
  const assessmentDate = document.getElementById('assessment-date')?.value;
  if (!assessmentName) { showToast('Enter assessment name', 'error'); return; }
  showLoading();
  let saved = 0, failed = 0;
  for (const student of currentMarksStudents) {
    const score = parseFloat(document.getElementById(`score-${student.id}`)?.value);
    if (!isNaN(score) && score>=0 && score<=100) {
      try {
        await api.teacher.enterMarks({
          studentId: student.id,
          subject: currentMarksSubject,
          assessmentType,
          assessmentName,
          score,
          date: assessmentDate,
          term: currentMarksTerm,
          year: currentMarksYear
        });
        saved++;
      } catch(e) { failed++; }
    }
  }
  showToast(`Saved ${saved} marks, failed ${failed}`, saved ? 'success' : 'error');
  closeMarksEntryModal();
  hideLoading();
}

// ============ TASKS ============
async function renderTeacherTasks() {
  let tasks = [];
  try {
    const res = await api.tasks.getTasks();
    tasks = res.data || [];
  } catch(e) { console.error(e); }
  const pending = tasks.filter(t => t.status !== 'completed');
  const completed = tasks.filter(t => t.status === 'completed');
  return `
    <div class="space-y-6"><div class="flex justify-between items-center"><h2 class="text-2xl font-bold">My Tasks</h2><button onclick="showAddTaskModal()" class="px-4 py-2 bg-primary text-white rounded-lg">+ New Task</button></div>
    <div class="grid gap-4 md:grid-cols-2">
      <div class="rounded-xl border bg-card p-6"><h3 class="font-semibold mb-4">Pending (${pending.length})</h3><div class="space-y-2" id="pending-tasks-list">${pending.map(t => `<div class="flex items-center gap-3 p-3 hover:bg-accent/50 rounded-lg"><input type="checkbox" onchange="completeTask('${t.id}')" class="rounded"><div class="flex-1"><p class="font-medium">${escapeHtml(t.title)}</p><p class="text-sm text-muted-foreground">Due: ${t.dueDate ? formatDate(t.dueDate) : 'No date'}</p></div><span class="px-2 py-1 bg-${t.priority === 'high' ? 'red' : t.priority === 'medium' ? 'yellow' : 'green'}-100 dark:bg-${t.priority === 'high' ? 'red' : t.priority === 'medium' ? 'yellow' : 'green'}-900/30 text-${t.priority === 'high' ? 'red' : t.priority === 'medium' ? 'yellow' : 'green'}-700 dark:text-${t.priority === 'high' ? 'red' : t.priority === 'medium' ? 'yellow' : 'green'}-400 text-xs rounded-full">${t.priority}</span><button onclick="deleteTask('${t.id}')" class="text-red-600"><i data-lucide="trash-2" class="h-4 w-4"></i></button></div>`).join('')}</div></div>
      <div class="rounded-xl border bg-card p-6"><h3 class="font-semibold mb-4">Completed (${completed.length})</h3><div class="space-y-2">${completed.map(t => `<div class="flex items-center gap-3 p-3 hover:bg-accent/50 rounded-lg"><input type="checkbox" checked disabled class="rounded"><div class="flex-1"><p class="font-medium line-through">${escapeHtml(t.title)}</p><p class="text-sm text-muted-foreground">Completed ${t.completedAt ? timeAgo(t.completedAt) : ''}</p></div></div>`).join('')}</div></div>
    </div></div>
  `;
}
function showAddTaskModal() {
  let modal = document.getElementById('add-task-modal');
  if (!modal) { createAddTaskModal(); modal = document.getElementById('add-task-modal'); }
  modal.classList.remove('hidden');
}
function createAddTaskModal() {
  const html = `<div id="add-task-modal" class="fixed inset-0 z-50 hidden"><div class="absolute inset-0 bg-black/50" onclick="closeAddTaskModal()"></div><div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md p-4"><div class="rounded-xl border bg-card p-6"><h3 class="text-lg font-semibold mb-4">Add New Task</h3><div class="space-y-4"><input type="text" id="task-title" placeholder="Task Title" class="w-full rounded-lg border p-2 bg-background"><textarea id="task-desc" rows="2" placeholder="Description" class="w-full rounded-lg border p-2 bg-background"></textarea><input type="date" id="task-due" class="w-full rounded-lg border p-2 bg-background"><select id="task-priority" class="w-full rounded-lg border p-2 bg-background"><option value="low">Low</option><option value="medium" selected>Medium</option><option value="high">High</option></select></div><div class="flex justify-end gap-2 mt-6"><button onclick="closeAddTaskModal()" class="px-4 py-2 border rounded-lg">Cancel</button><button onclick="createTask()" class="px-4 py-2 bg-primary text-white rounded-lg">Save</button></div></div></div></div>`;
  document.body.insertAdjacentHTML('beforeend', html);
}
function closeAddTaskModal() { const m = document.getElementById('add-task-modal'); if(m) m.classList.add('hidden'); }
async function createTask() {
  const title = document.getElementById('task-title')?.value;
  if (!title) { showToast('Title required', 'error'); return; }
  const description = document.getElementById('task-desc')?.value;
  const dueDate = document.getElementById('task-due')?.value;
  const priority = document.getElementById('task-priority')?.value;
  showLoading();
  try {
    await api.tasks.createTask({ title, description, dueDate, priority });
    showToast('Task created', 'success');
    closeAddTaskModal();
    await showDashboardSection('tasks');
  } catch(e) { showToast(e.message, 'error'); } finally { hideLoading(); }
}
async function completeTask(taskId) {
  showLoading();
  try {
    await api.tasks.completeTask(taskId);
    await showDashboardSection('tasks');
  } catch(e) { showToast(e.message, 'error'); } finally { hideLoading(); }
}
async function deleteTask(taskId) {
  if (!confirm('Delete this task?')) return;
  showLoading();
  try {
    await api.tasks.deleteTask(taskId);
    await showDashboardSection('tasks');
  } catch(e) { showToast(e.message, 'error'); } finally { hideLoading(); }
}

// Student detail modal
async function showStudentDetails(studentId) {
  try {
    const student = await apiRequest(`/api/admin/students/${studentId}`);
    const analytics = await apiRequest(`/api/analytics/student/${studentId}`);
    // Build modal HTML with grades chart, attendance, competency, report absence button
    const modalHtml = `
      <div class="space-y-4">
        <div class="flex justify-between items-center">
          <h3 class="text-xl font-bold">${escapeHtml(student.data.User.name)}</h3>
          <button onclick="closeStudentModal()" class="text-muted-foreground">✖</button>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div><span class="font-medium">ELIMUID:</span> ${student.data.elimuid}</div>
          <div><span class="font-medium">Grade:</span> ${student.data.grade}</div>
        </div>
        <div class="border-t pt-2">
          <h4 class="font-semibold">Performance Trend</h4>
          <canvas id="student-grade-chart" height="200"></canvas>
        </div>
        <div class="border-t pt-2">
          <h4 class="font-semibold">Attendance</h4>
          <div id="student-attendance-calendar"></div>
        </div>
        <div class="border-t pt-2">
          <h4 class="font-semibold">Competency Progress</h4>
          <div id="student-competency-radar"></div>
        </div>
        <button onclick="reportAbsenceForStudent(${studentId})" class="w-full bg-red-500 text-white py-2 rounded">Report Absence</button>
      </div>
    `;
    showModal('Student Details', modalHtml);
    // Initialize charts with analytics data
    new Chart(document.getElementById('student-grade-chart'), {
      type: 'line',
      data: { labels: analytics.data.records.map(r => r.date), datasets: [{ label: 'Score', data: analytics.data.records.map(r => r.score) }] }
    });
  } catch(e) { showToast(e.message, 'error'); }
}
window.reportAbsenceForStudent = async function(studentId) {
  const reason = prompt('Reason for absence:');
  if (!reason) return;
  await apiRequest('/api/parent/report-absence', { method: 'POST', body: JSON.stringify({ studentId, date: new Date().toISOString().split('T')[0], reason }) });
  showToast('Absence reported to parent', 'success');
};

// ============ DUTY MANAGEMENT ============
async function renderTeacherDuty() {
  let weeklyDuty = [];
  let todayDuty = null;
  try {
    const res = await api.duty.getWeeklyDuty();
    weeklyDuty = res.data || [];
    const todayRes = await api.duty.getTodayDuty();
    todayDuty = todayRes.data;
  } catch(e) { console.error(e); }
  const user = getCurrentUser();
  const myDuties = weeklyDuty.filter(day => day.duties?.some(d => d.teacherId === user?.id));
  return `
    <div class="space-y-6"><h2 class="text-2xl font-bold">My Duty Schedule</h2>
    <div class="grid gap-4 md:grid-cols-2">
      <div class="rounded-xl border bg-card p-6"><h3 class="font-semibold mb-4">This Week's Duty</h3><div class="space-y-3">
        ${myDuties.length ? myDuties.map(day => `<div class="p-3 bg-muted/30 rounded-lg"><p class="font-medium">${day.dayName} (${day.date})</p>${day.duties.filter(d => d.teacherId === user?.id).map(d => `<div class="flex justify-between text-sm"><span>${d.area}</span><span>${d.timeSlot?.start} - ${d.timeSlot?.end}</span></div>`).join('')}</div>`).join('') : '<p class="text-center text-muted-foreground">No duty assigned this week</p>'}
      </div><button onclick="showDashboardSection('duty-preferences')" class="mt-4 w-full py-2 border rounded-lg hover:bg-accent">Set Preferences</button></div>
      <div class="rounded-xl border bg-card p-6"><h3 class="font-semibold mb-4">Request Duty Swap</h3><div class="space-y-3"><input type="date" id="swap-date" class="w-full rounded-lg border p-2 bg-background"><textarea id="swap-reason" rows="2" class="w-full rounded-lg border p-2 bg-background" placeholder="Reason for swap"></textarea><button onclick="submitSwapRequest()" class="w-full bg-primary text-white py-2 rounded-lg">Submit Request</button></div></div>
    </div></div>
  `;
}
async function submitSwapRequest() {
  const date = document.getElementById('swap-date')?.value;
  const reason = document.getElementById('swap-reason')?.value;
  if (!date || !reason) { showToast('Please fill all fields', 'error'); return; }
  showLoading();
  try {
    await api.duty.requestSwap({ dutyDate: date, reason });
    showToast('Swap request sent to admin', 'success');
    document.getElementById('swap-date').value = '';
    document.getElementById('swap-reason').value = '';
  } catch(e) { showToast(e.message, 'error'); } finally { hideLoading(); }
}

// ============ DUTY PREFERENCES ============
function renderTeacherDutyPreferences() {
  return `<div class="space-y-6"><h2 class="text-2xl font-bold">Duty Preferences</h2><div class="rounded-xl border bg-card p-6 max-w-2xl mx-auto"><div class="space-y-4"><div><label class="block text-sm font-medium mb-1">Preferred Days</label><div class="flex flex-wrap gap-3" id="pref-days">${['Monday','Tuesday','Wednesday','Thursday','Friday'].map(d => `<label class="flex items-center gap-2"><input type="checkbox" value="${d.toLowerCase()}" class="pref-day"> <span>${d}</span></label>`).join('')}</div></div><div><label class="block text-sm font-medium mb-1">Preferred Areas</label><div class="flex flex-wrap gap-3" id="pref-areas">${['morning','lunch','afternoon','whole_day'].map(a => `<label class="flex items-center gap-2"><input type="checkbox" value="${a}" class="pref-area"> <span>${a}</span></label>`).join('')}</div></div><div><label class="block text-sm font-medium mb-1">Max Duties Per Week</label><input type="number" id="max-duties" value="3" min="1" max="5" class="w-full rounded-lg border p-2 bg-background"></div><div><label class="block text-sm font-medium mb-1">Blackout Dates</label><div class="flex gap-2"><input type="date" id="blackout-date" class="flex-1 rounded-lg border p-2 bg-background"><button onclick="addBlackoutDate()" class="px-3 py-2 bg-primary text-white rounded-lg">Add</button></div><div id="blackout-dates-list" class="mt-2 space-y-1"></div></div><button onclick="saveDutyPreferences()" class="w-full bg-primary text-white py-2 rounded-lg">Save Preferences</button></div></div></div>`;
}
window.addBlackoutDate = function() {
  const date = document.getElementById('blackout-date')?.value;
  if (!date) return;
  const list = document.getElementById('blackout-dates-list');
  const div = document.createElement('div');
  div.className = 'flex justify-between items-center p-2 bg-muted/30 rounded';
  div.innerHTML = `<span class="text-sm">${new Date(date).toLocaleDateString()}</span><button onclick="this.parentElement.remove()" class="text-red-600"><i data-lucide="x" class="h-4 w-4"></i></button>`;
  list.appendChild(div);
  document.getElementById('blackout-date').value = '';
  if (window.lucide) lucide.createIcons();
};
window.saveDutyPreferences = async function() {
  const preferredDays = Array.from(document.querySelectorAll('.pref-day:checked')).map(cb => cb.value);
  const preferredAreas = Array.from(document.querySelectorAll('.pref-area:checked')).map(cb => cb.value);
  const maxDutiesPerWeek = parseInt(document.getElementById('max-duties')?.value) || 3;
  const blackoutDates = Array.from(document.querySelectorAll('#blackout-dates-list span')).map(span => new Date(span.textContent).toISOString().split('T')[0]);
  showLoading();
  try {
    await api.duty.updatePreferences({ preferredDays, preferredAreas, maxDutiesPerWeek, blackoutDates });
    showToast('Preferences saved', 'success');
  } catch(e) { showToast(e.message, 'error'); } finally { hideLoading(); }
};

// ============ STAFF CHAT (FULLY FUNCTIONAL) ============
let currentStaffChatType = 'group';
let currentStaffChatPartner = null;

async function renderStaffChat() {
  const teachers = await loadStaffMembers();
  return `
    <div class="max-w-6xl mx-auto">
      <div class="grid grid-cols-4 gap-4 h-[700px]">
        <div class="col-span-1 rounded-xl border bg-card overflow-hidden flex flex-col">
          <div class="p-4 border-b"><h3 class="font-semibold">Staff Chat</h3></div>
          <div class="flex-1 overflow-y-auto p-2">
            <button onclick="switchStaffChat('group')" class="w-full text-left p-3 rounded-lg hover:bg-accent mb-2">
              <div class="flex items-center gap-3">
                <div class="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center"><i data-lucide="users"></i></div>
                <div><p class="font-medium">Staff Room</p><p class="text-xs text-muted-foreground">Group chat</p></div>
              </div>
            </button>
            <div class="pt-2 mt-2 border-t">
              <p class="text-xs font-medium px-3 mb-2">TEACHERS</p>
              <div id="staff-list">
                ${teachers.map(t => `
                  <button onclick="switchStaffChat('private', '${t.id}', '${escapeHtml(t.name)}')" class="w-full text-left p-3 rounded-lg hover:bg-accent">
                    <div class="flex items-center gap-3">
                      <div class="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <span class="font-medium text-blue-700 dark:text-blue-400 text-sm">${getInitials(t.name)}</span>
                      </div>
                      <div><p class="font-medium">${escapeHtml(t.name)}</p></div>
                    </div>
                  </button>
                `).join('')}
              </div>
            </div>
          </div>
        </div>
        <div class="col-span-3 rounded-xl border bg-card flex flex-col">
          <div class="p-4 border-b"><h3 class="font-semibold" id="staff-chat-title">Staff Room</h3></div>
          <div class="flex-1 overflow-y-auto p-4 space-y-4" id="staff-chat-messages"></div>
          <div class="p-4 border-t">
            <div class="flex gap-2">
              <input type="text" id="staff-chat-input" placeholder="Type your message..." class="flex-1 rounded-lg border bg-background px-4 py-3">
              <button onclick="sendStaffMessage()" class="px-6 py-3 bg-primary text-white rounded-lg">Send</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

async function loadStaffMembers() {
  try { const res = await api.teacher.getStaffMembers(); return res.data || []; } catch(e) { return []; }
}

async function switchStaffChat(type, partnerId = null, partnerName = '') {
  currentStaffChatType = type;
  currentStaffChatPartner = partnerId;
  document.getElementById('staff-chat-title').innerText = type === 'group' ? 'Staff Room' : `Chat with ${partnerName}`;
  
  let messages = [];
  if (type === 'group') {
    try { const res = await api.teacher.getGroupMessages(); messages = res.data || []; } catch(e) { console.error(e); }
  } else if (partnerId) {
    try { const res = await api.teacher.getPrivateMessages(partnerId); messages = res.data || []; } catch(e) { console.error(e); }
  }
  const container = document.getElementById('staff-chat-messages');
  const user = getCurrentUser();
  container.innerHTML = messages.map(msg => `
    <div class="flex ${msg.senderId === user.id ? 'justify-end' : 'justify-start'} group">
      <div class="${msg.senderId === user.id ? 'chat-bubble-sent' : 'chat-bubble-received'} max-w-[70%] relative">
        ${msg.replyToMessageId ? `<div class="text-xs border-l-2 border-primary pl-2 mb-1 italic text-muted-foreground">Replying to: ${msg.replyToMessageId}</div>` : ''}
        ${msg.senderId !== user.id ? `<p class="text-xs font-medium text-muted-foreground">${msg.Sender?.name}</p>` : ''}
        <p class="text-sm">${escapeHtml(msg.content)}</p>
        <p class="text-xs text-muted-foreground mt-1">${timeAgo(msg.createdAt)}</p>
        <button onclick="setReplyTo(${msg.id}, '${escapeHtml(msg.content)}')" class="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 bg-primary text-white rounded-full p-1 text-xs">↩️</button>
      </div>
    </div>
  `).join('') || '<div class="text-center text-muted-foreground">No messages yet</div>';
  container.scrollTop = container.scrollHeight;
}

async function sendStaffMessage() {
  const input = document.getElementById('staff-chat-input');
  const content = input?.value.trim();
  if (!content) return;
  const data = { content };
  if (replyingTo) {
    data.replyToId = replyingTo.id;
    cancelReply();
  }
  if (currentStaffChatType === 'group') {
    await api.teacher.sendGroupMessage(data);
  } else if (currentStaffChatPartner) {
    await api.teacher.sendPrivateMessage({ ...data, receiverId: currentStaffChatPartner });
  }
  input.value = '';
  await switchStaffChat(currentStaffChatType, currentStaffChatPartner);
}

// ============ PARENT CHAT ============
async function renderParentChat() {
  if (!isClassTeacher()) return '<div class="text-center py-12">Only class teachers can view parent messages</div>';
  let conversations = [];
  try {
    const res = await api.teacher.getParentConversations();
    conversations = res.data || [];
  } catch(e) { console.error(e); }
  return `
    <div class="max-w-4xl mx-auto space-y-6"><div class="rounded-xl border bg-card overflow-hidden"><div class="p-4 border-b"><h3 class="font-semibold">Parent Messages</h3></div><div class="divide-y" id="parent-conversations-list">${conversations.map(conv => `<div class="p-4 hover:bg-accent cursor-pointer" onclick="openParentConversation('${conv.userId}')"><div class="flex justify-between"><div><p class="font-medium">${escapeHtml(conv.userName)}</p><p class="text-xs text-muted-foreground">${conv.studentName ? `about ${conv.studentName}` : ''}</p><p class="text-sm mt-1">${conv.lastMessage?.substring(0,50)}</p></div><div class="text-right"><p class="text-xs">${timeAgo(conv.lastMessageTime)}</p>${conv.unreadCount ? `<span class="bg-red-500 dark:bg-red-900/50 text-white dark:text-red-300 text-xs rounded-full px-2 py-1">${conv.unreadCount}</span>` : ''}</div></div></div>`).join('')}</div></div></div>
  `;
}
async function openParentConversation(parentId) {
  let messages = [];
  try {
    const res = await api.teacher.getParentMessages(parentId);
    messages = res.data || [];
  } catch(e) { console.error(e); }
  let modal = document.getElementById('parent-chat-modal');
  if (!modal) { createParentChatModal(); modal = document.getElementById('parent-chat-modal'); }
  const modalContent = modal.querySelector('.modal-content');
  modalContent.innerHTML = `<div class="space-y-4"><div class="border-b pb-2 flex justify-between"><h4 class="font-semibold">Chat with Parent</h4><button onclick="closeParentChatModal()" class="p-1"><i data-lucide="x"></i></button></div><div class="space-y-4 max-h-96 overflow-y-auto" id="parent-chat-msgs">${messages.map(m => `<div class="flex ${m.senderId === getCurrentUser().id ? 'justify-end' : 'justify-start'}"><div class="${m.senderId === getCurrentUser().id ? 'chat-bubble-sent' : 'chat-bubble-received'} max-w-[70%]"><p class="text-sm">${escapeHtml(m.content)}</p><p class="text-xs mt-1">${timeAgo(m.createdAt)}</p></div></div>`).join('')}</div><div class="flex gap-2 pt-2"><input type="text" id="parent-reply-input" placeholder="Type reply..." class="flex-1 rounded-lg border p-2 bg-background"><button onclick="sendParentReply('${parentId}')" class="px-4 py-2 bg-primary text-white rounded-lg">Send</button></div></div>`;
  modal.classList.remove('hidden');
  if (window.lucide) lucide.createIcons();
}
function createParentChatModal() {
  const html = `<div id="parent-chat-modal" class="fixed inset-0 z-50 hidden"><div class="absolute inset-0 bg-black/50" onclick="closeParentChatModal()"></div><div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl p-4"><div class="rounded-xl border bg-card p-6 shadow-xl"><div class="modal-content"></div></div></div></div>`;
  document.body.insertAdjacentHTML('beforeend', html);
}
function closeParentChatModal() { const m = document.getElementById('parent-chat-modal'); if(m) m.classList.add('hidden'); }
async function sendParentReply(parentId) {
  const message = document.getElementById('parent-reply-input')?.value;
  if (!message) return;
  try {
    await api.teacher.replyToParent({ parentId, message });
    document.getElementById('parent-reply-input').value = '';
    await openParentConversation(parentId);
  } catch(e) { showToast(e.message, 'error'); }
}

// ============ SETTINGS ============
async function renderTeacherSettings() {
  const user = getCurrentUser();
  return `
    <div class="space-y-6 max-w-4xl mx-auto"><div class="rounded-xl border bg-card p-6"><h2 class="text-2xl font-bold mb-4">Teacher Settings</h2>
    <div class="space-y-4"><div class="border-t pt-4"><h3 class="font-semibold mb-2">Profile Information</h3><p class="text-sm">Name: ${escapeHtml(user?.name || 'N/A')}</p><p class="text-sm">Email: ${escapeHtml(user?.email || 'N/A')}</p><p class="text-sm">Role: ${user?.role}</p></div>
    <div class="border-t pt-4"><h3 class="font-semibold mb-2">Class Information</h3><p class="text-sm">Assigned Class: ${getTeacherAssignedClass()?.name || 'None'}</p><p class="text-sm">Teacher Type: ${getTeacherRole()}</p></div>
    <div class="border-t pt-4"><h3 class="font-semibold mb-2">Change Password</h3><div class="space-y-3"><input type="password" id="current-password" placeholder="Current Password" class="w-full rounded-lg border p-2 bg-background"><input type="password" id="new-password" placeholder="New Password" class="w-full rounded-lg border p-2 bg-background"><input type="password" id="confirm-password" placeholder="Confirm Password" class="w-full rounded-lg border p-2 bg-background"><button onclick="handleChangePassword()" class="px-4 py-2 bg-primary text-white rounded-lg">Update Password</button></div></div></div></div></div>
  `;
}
async function handleChangePassword() {
  const current = document.getElementById('current-password')?.value;
  const newPwd = document.getElementById('new-password')?.value;
  const confirm = document.getElementById('confirm-password')?.value;
  if (!current || !newPwd || !confirm) { showToast('Please fill all fields', 'error'); return; }
  if (newPwd !== confirm) { showToast('Passwords do not match', 'error'); return; }
  if (newPwd.length < 8) { showToast('Password must be at least 8 characters', 'error'); return; }
  showLoading();
  try {
    await api.auth.changePassword(current, newPwd);
    showToast('Password changed', 'success');
    document.getElementById('current-password').value = '';
    document.getElementById('new-password').value = '';
    document.getElementById('confirm-password').value = '';
  } catch(e) { showToast(e.message, 'error'); } finally { hideLoading(); }
}

// ============ HELP SECTION ============
async function renderHelpSection(role) {
  let articles = [];
  try {
    const res = await api.help.getArticles(role);
    articles = res.data || [];
  } catch(e) { console.error(e); }
  return `
    <div class="space-y-6 max-w-4xl mx-auto"><div class="text-center"><h2 class="text-3xl font-bold">Help Center</h2><p class="text-muted-foreground mt-2">Find answers to common questions</p></div>
    <div class="relative"><i data-lucide="search" class="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground"></i><input type="text" id="help-search" placeholder="Search help articles..." onkeyup="searchHelpArticles()" class="w-full pl-10 pr-4 py-3 rounded-xl border bg-card"></div>
    <div id="help-articles-container" class="grid gap-4">${articles.map(a => `<div class="rounded-xl border bg-card p-6 cursor-pointer hover:shadow-md" onclick="showHelpArticleDetail('${a.title}', '${a.content}')"><h3 class="font-semibold text-lg">${escapeHtml(a.title)}</h3><p class="text-muted-foreground mt-1">${escapeHtml(a.content.substring(0,150))}...</p></div>`).join('')}</div></div>
  `;
}
window.searchHelpArticles = function() {
  const term = document.getElementById('help-search')?.value.toLowerCase();
  const articles = document.querySelectorAll('.help-article');
  articles.forEach(a => { a.style.display = a.innerText.toLowerCase().includes(term) ? 'block' : 'none'; });
};
window.showHelpArticleDetail = function(title, content) {
  alert(`${title}\n\n${content}`);
};

// ============ PROFILE SECTION ============
async function renderProfileSection() {
  const user = getCurrentUser();
  const emailPref = user.preferences?.email !== false;
  const pushPref = user.preferences?.push !== false;
  const darkModePref = document.documentElement.classList.contains('dark');

  return `
    <div class="space-y-6 max-w-4xl mx-auto">
      <div class="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white">
        <div class="flex items-center gap-6">
          <div class="relative">
            <img id="profile-preview" src="${user.profileImage || ''}" class="h-24 w-24 rounded-full object-cover border-4 border-white shadow bg-white">
            <label class="absolute bottom-0 right-0 bg-primary text-white rounded-full p-1 cursor-pointer">
              <i data-lucide="camera" class="h-4 w-4"></i>
              <input type="file" id="profile-picture-input" accept="image/*" class="hidden" onchange="uploadProfilePicture(this.files[0])">
            </label>
          </div>
          <div>
            <h2 class="text-3xl font-bold">${user.name}</h2>
            <p class="text-white/80 capitalize">${user.role}</p>
          </div>
        </div>
      </div>

      <div class="grid gap-4 md:grid-cols-3">
        <div class="rounded-xl border bg-card p-4"><p class="text-sm text-muted-foreground">Member Since</p><p class="text-lg font-semibold">${formatDate(user.createdAt)}</p></div>
        <div class="rounded-xl border bg-card p-4"><p class="text-sm text-muted-foreground">Last Login</p><p class="text-lg font-semibold">${user.lastLogin ? timeAgo(user.lastLogin) : 'N/A'}</p></div>
        <div class="rounded-xl border bg-card p-4"><p class="text-sm text-muted-foreground">Account Status</p><p class="text-lg font-semibold text-green-600">Active</p></div>
      </div>

      <div class="rounded-xl border bg-card p-6">
        <h3 class="font-semibold text-lg mb-4">Profile Information</h3>
        <form id="profile-form" onsubmit="updateProfile(event)" class="space-y-4">
          <div class="grid gap-4 md:grid-cols-2">
            <div><label class="block text-sm font-medium mb-1">Full Name</label><input type="text" name="name" value="${user.name}" class="w-full rounded-lg border p-2 bg-background"></div>
            <div><label class="block text-sm font-medium mb-1">Email</label><input type="email" name="email" value="${user.email || ''}" class="w-full rounded-lg border p-2 bg-background"></div>
          </div>
          <div><label class="block text-sm font-medium mb-1">Phone</label><input type="tel" name="phone" value="${user.phone || ''}" class="w-full rounded-lg border p-2 bg-background"></div>
          <div class="flex justify-end"><button type="submit" class="px-4 py-2 bg-primary text-white rounded-lg">Update Profile</button></div>
        </form>
      </div>

      <div class="rounded-xl border bg-card p-6">
        <h3 class="font-semibold text-lg mb-4">Change Password</h3>
        <form id="password-form" onsubmit="updatePassword(event)" class="space-y-4">
          <div><label class="block text-sm font-medium mb-1">Current Password</label><input type="password" id="current-password" required class="w-full rounded-lg border p-2 bg-background"></div>
          <div class="grid gap-4 md:grid-cols-2">
            <div><label class="block text-sm font-medium mb-1">New Password</label><input type="password" id="new-password" required minlength="8" class="w-full rounded-lg border p-2 bg-background"></div>
            <div><label class="block text-sm font-medium mb-1">Confirm Password</label><input type="password" id="confirm-password" required class="w-full rounded-lg border p-2 bg-background"></div>
          </div>
          <div class="flex justify-end"><button type="submit" class="px-4 py-2 bg-primary text-white rounded-lg">Update Password</button></div>
        </form>
      </div>

      <div class="rounded-xl border bg-card p-6">
        <h3 class="font-semibold text-lg mb-4">Preferences</h3>
        <div class="space-y-4">
          <div class="flex justify-between items-center">
            <div><p class="font-medium">Email Notifications</p></div>
            <button onclick="togglePreference('email')" id="pref-email" class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${emailPref ? 'bg-primary' : 'bg-muted'}">
              <span class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${emailPref ? 'translate-x-6' : 'translate-x-1'}"></span>
            </button>
          </div>
          <div class="flex justify-between items-center">
            <div><p class="font-medium">Push Notifications</p></div>
            <button onclick="togglePreference('push')" id="pref-push" class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${pushPref ? 'bg-primary' : 'bg-muted'}">
              <span class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${pushPref ? 'translate-x-6' : 'translate-x-1'}"></span>
            </button>
          </div>
          <div class="flex justify-between items-center">
            <div><p class="font-medium">Dark Mode</p></div>
            <button onclick="toggleTheme()" id="pref-darkmode" class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${darkModePref ? 'bg-primary' : 'bg-muted'}">
              <span class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${darkModePref ? 'translate-x-6' : 'translate-x-1'}"></span>
            </button>
          </div>
        </div>
      </div>

      <div class="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-6">
        <h3 class="font-semibold text-lg mb-4 text-red-700 dark:text-red-400">Account Actions</h3>
        <div class="flex gap-3">
          <button onclick="downloadMyData()" class="px-4 py-2 border rounded-lg">Download My Data</button>
          <button onclick="deactivateAccount()" class="px-4 py-2 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 rounded-lg">Deactivate Account</button>
        </div>
      </div>
    </div>
  `;
}

async function updateProfile(event) {
  event.preventDefault();
  const formData = new FormData(event.target);
  const data = { name: formData.get('name'), email: formData.get('email'), phone: formData.get('phone') };
  showLoading();
  try {
    await api.user.updateProfile(data);
    const user = getCurrentUser(); user.name = data.name; user.email = data.email; user.phone = data.phone;
    localStorage.setItem('user', JSON.stringify(user));
    showToast('Profile updated', 'success');
    await showDashboardSection('profile');
  } catch(e) { showToast(e.message, 'error'); } finally { hideLoading(); }
}
async function updatePassword(event) {
  event.preventDefault();
  const current = document.getElementById('current-password').value;
  const newPwd = document.getElementById('new-password').value;
  const confirm = document.getElementById('confirm-password').value;
  if (newPwd !== confirm) return showToast('Passwords do not match', 'error');
  if (newPwd.length < 8) return showToast('Password must be at least 8 characters', 'error');
  showLoading();
  try {
    await api.auth.changePassword(current, newPwd);
    showToast('Password changed', 'success');
    document.getElementById('current-password').value = '';
    document.getElementById('new-password').value = '';
    document.getElementById('confirm-password').value = '';
  } catch(e) { showToast(e.message, 'error'); } finally { hideLoading(); }
}
async function togglePreference(key) {
  const user = getCurrentUser();
  const prefs = user.preferences || {};
  prefs[key] = !prefs[key];
  showLoading();
  try {
    await api.user.updatePreferences(prefs);
    user.preferences = prefs;
    localStorage.setItem('user', JSON.stringify(user));
    // Update the toggle button UI
    const btn = document.getElementById(`pref-${key}`);
    if (btn) {
      const isOn = prefs[key];
      if (isOn) {
        btn.classList.remove('bg-muted');
        btn.classList.add('bg-primary');
        btn.querySelector('span').classList.remove('translate-x-1');
        btn.querySelector('span').classList.add('translate-x-6');
      } else {
        btn.classList.remove('bg-primary');
        btn.classList.add('bg-muted');
        btn.querySelector('span').classList.remove('translate-x-6');
        btn.querySelector('span').classList.add('translate-x-1');
      }
    }
    showToast('Preference updated', 'success');
  } catch(e) { showToast(e.message, 'error'); } finally { hideLoading(); }
}
async function downloadMyData() {
  showLoading();
  try {
    const res = await api.user.exportMyData();
    const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `shuleai_data_${new Date().toISOString()}.json`; a.click();
    URL.revokeObjectURL(url);
    showToast('Data exported', 'success');
  } catch(e) { showToast(e.message, 'error'); } finally { hideLoading(); }
}
async function deactivateAccount() {
  if (!confirm('Deactivate your account? You can reactivate later by contacting support.')) return;
  const reason = prompt('Reason (optional)');
  showLoading();
  try {
    await api.user.deactivateAccount(reason);
    showToast('Account deactivated. Logging out...', 'info');
    setTimeout(() => logout(), 2000);
  } catch(e) { showToast(e.message, 'error'); } finally { hideLoading(); }
}

async function uploadProfilePicture(file) {
  if (!file) return;
  const formData = new FormData();
  formData.append('picture', file);
  showLoading();
  try {
    const response = await fetch('/api/user/profile-picture', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` },
      body: formData
    });
    const data = await response.json();
    if (data.success) {
      document.getElementById('profile-preview').src = data.data.profileImage;
      // Update local user object
      const user = getCurrentUser();
      user.profileImage = data.data.profileImage;
      localStorage.setItem('user', JSON.stringify(user));
      showToast('Profile picture updated', 'success');
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    showToast(error.message || 'Upload failed', 'error');
  } finally {
    hideLoading();
  }
}

// ============ DUTY CARD HELPERS ============
async function loadTodayDuty() {
  try {
    const res = await api.duty.getTodayDuty();
    const duty = res.data?.duties?.find(d => d.teacherId === getCurrentUser().id);
    if (duty) {
      document.getElementById('duty-location').innerText = duty.area;
      document.getElementById('duty-status').innerText = duty.checkedIn ? 'Checked In' : 'Not Checked In';
      document.getElementById('check-in-btn').disabled = duty.checkedIn;
      document.getElementById('check-out-btn').disabled = !duty.checkedIn;
    } else {
      document.getElementById('duty-location').innerText = 'No duty today';
    }
  } catch(e) { console.error(e); }
}
async function handleCheckIn() {
  showLoading();
  try {
    await api.duty.checkIn({ location: 'School', notes: '' });
    showToast('Checked in', 'success');
    await loadTodayDuty();
  } catch(e) { showToast(e.message, 'error'); } finally { hideLoading(); }
}
async function handleCheckOut() {
  showLoading();
  try {
    await api.duty.checkOut({ location: 'School', notes: '' });
    showToast('Checked out', 'success');
    await loadTodayDuty();
  } catch(e) { showToast(e.message, 'error'); } finally { hideLoading(); }
}

// ============ PARENT MESSAGES INBOX ============
async function loadTeacherMessages() {
  try {
    const res = await api.teacher.getParentConversations();
    const convos = res.data || [];
    const container = document.getElementById('teacher-messages-list');
    const badge = document.getElementById('teacher-message-count-badge');
    if (!container) return;
    let totalUnread = 0;
    if (!convos.length) { container.innerHTML = '<div class="text-center py-8 text-muted-foreground">No parent messages</div>'; return; }
    container.innerHTML = convos.map(c => {
      totalUnread += c.unreadCount || 0;
      return `<div class="p-3 border rounded-lg hover:bg-accent cursor-pointer" onclick="openParentConversation('${c.userId}')"><div class="flex justify-between"><div><p class="font-medium">${escapeHtml(c.userName)}</p><p class="text-xs text-muted-foreground">${c.studentName ? `about ${c.studentName}` : ''}</p><p class="text-sm mt-1">${c.lastMessage?.substring(0,50)}</p></div><div class="text-right"><p class="text-xs">${timeAgo(c.lastMessageTime)}</p>${c.unreadCount ? `<span class="bg-red-500 dark:bg-red-900/50 text-white dark:text-red-300 text-xs rounded-full px-2 py-1">${c.unreadCount}</span>` : ''}</div></div></div>`;
    }).join('');
    if (badge) badge.textContent = totalUnread;
  } catch(e) { console.error(e); }
}

// ============ UTILITIES ============
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}
function timeAgo(timestamp) {
  if (!timestamp) return 'N/A';
  const seconds = Math.floor((new Date() - new Date(timestamp)) / 1000);
  const intervals = { year: 31536000, month: 2592000, week: 604800, day: 86400, hour: 3600, minute: 60 };
  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);
    if (interval >= 1) return `${interval} ${unit}${interval === 1 ? '' : 's'} ago`;
  }
  return 'just now';
}
function formatDate(dateString) {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function copyToClipboard(text) {
  if (!text) return;
  navigator.clipboard.writeText(text);
  showToast('Copied to clipboard', 'success');
}

function setReplyTo(messageId, contentPreview) {
  replyingTo = { id: messageId, content: contentPreview };
  let previewDiv = document.getElementById('reply-preview');
  if (!previewDiv) {
    previewDiv = document.createElement('div');
    previewDiv.id = 'reply-preview';
    previewDiv.className = 'text-xs bg-muted p-2 rounded-lg mb-2 flex justify-between items-center';
    const inputContainer = document.getElementById('staff-chat-input').parentElement;
    inputContainer.insertBefore(previewDiv, inputContainer.firstChild);
  }
  previewDiv.innerHTML = `<span>Replying to: ${escapeHtml(contentPreview)}</span><button onclick="cancelReply()" class="text-red-500">✖</button>`;
}

function cancelReply() {
  replyingTo = null;
  const preview = document.getElementById('reply-preview');
  if (preview) preview.remove();
}

// ============ EXPORTS ============
window.renderTeacherSection = renderTeacherSection;
window.renderTeacherDashboard = renderTeacherDashboard;
window.loadMyStudents = loadMyStudents;
window.loadTeacherMessages = loadTeacherMessages;
window.handleCheckIn = handleCheckIn;
window.handleCheckOut = handleCheckOut;
window.loadTodayDuty = loadTodayDuty;
window.saveAttendance = saveAttendance;
window.openMarksEntry = openMarksEntry;
window.closeMarksEntryModal = closeMarksEntryModal;
window.saveAllMarks = saveAllMarks;
window.updateGradeDisplayForStudent = updateGradeDisplayForStudent;
window.showAddTaskModal = showAddTaskModal;
window.closeAddTaskModal = closeAddTaskModal;
window.createTask = createTask;
window.completeTask = completeTask;
window.deleteTask = deleteTask;
window.renderStaffChat = renderStaffChat;
window.renderParentChat = renderParentChat;
window.switchStaffChat = switchStaffChat;
window.sendStaffMessage = sendStaffMessage;
window.openParentConversation = openParentConversation;
window.sendParentReply = sendParentReply;
window.closeParentChatModal = closeParentChatModal;
window.renderTeacherSettings = renderTeacherSettings;
window.handleChangePassword = handleChangePassword;
window.renderHelpSection = renderHelpSection;
window.renderProfileSection = renderProfileSection;
window.updateProfile = updateProfile;
window.updatePassword = updatePassword;
window.togglePreference = togglePreference;
window.uploadProfilePicture = uploadProfilePicture;
window.downloadMyData = downloadMyData;
window.deactivateAccount = deactivateAccount;
window.addBlackoutDate = addBlackoutDate;
window.saveDutyPreferences = saveDutyPreferences;
window.submitSwapRequest = submitSwapRequest;
