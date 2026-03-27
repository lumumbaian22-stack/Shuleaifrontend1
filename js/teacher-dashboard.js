// teacher-dashboard.js - Teacher dashboard rendering

async function renderTeacherSection(section) {
    switch(section) {
        case 'dashboard':
            return renderTeacherDashboard();
        case 'students':
            return await renderTeacherStudents();
        case 'attendance':
            return await renderTeacherAttendance();
        case 'grades':
            return await renderTeacherGrades();
        case 'tasks':
            return renderTeacherTasks();
        case 'duty':
            return await renderTeacherDuty();
        case 'duty-preferences':
            return renderTeacherDutyPreferences();
        case 'chat':
            return renderTeacherChat();
        case 'settings':
            return renderUserSettings('teacher');
        default:
            return renderTeacherDashboard();
    }
}

function renderTeacherDashboard() {
    const data = dashboardData || {};
    const user = getCurrentUser();

    return `
        <div class="space-y-6 animate-fade-in">
            <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div class="rounded-xl border bg-card p-6 card-hover">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-muted-foreground">My Students</p>
                            <h3 class="text-2xl font-bold mt-1" id="my-students-count">${data.students?.length || 0}</h3>
                            <p class="text-xs text-muted-foreground mt-1">Enrolled students</p>
                        </div>
                        <div class="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                            <i data-lucide="users" class="h-6 w-6 text-blue-600"></i>
                        </div>
                    </div>
                </div>

                <div class="rounded-xl border bg-card p-6 card-hover">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-muted-foreground">Class Average</p>
                            <h3 class="text-2xl font-bold mt-1">78.5%</h3>
                            <p class="text-xs text-green-600 mt-1 flex items-center gap-1">
                                <i data-lucide="trending-up" class="h-3 w-3"></i>
                                This term
                            </p>
                        </div>
                        <div class="h-12 w-12 rounded-lg bg-violet-100 flex items-center justify-center">
                            <i data-lucide="trending-up" class="h-6 w-6 text-violet-600"></i>
                        </div>
                    </div>
                </div>

                <div class="rounded-xl border bg-card p-6 card-hover">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-muted-foreground">Attendance Today</p>
                            <h3 class="text-2xl font-bold mt-1">0/0</h3>
                            <p class="text-xs text-yellow-600 mt-1 flex items-center gap-1">
                                <i data-lucide="alert-circle" class="h-3 w-3"></i>
                                Not taken yet
                            </p>
                        </div>
                        <div class="h-12 w-12 rounded-lg bg-amber-100 flex items-center justify-center">
                            <i data-lucide="calendar-check" class="h-6 w-6 text-amber-600"></i>
                        </div>
                    </div>
                </div>

                <div class="rounded-xl border bg-card p-6 card-hover">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-muted-foreground">Pending Tasks</p>
                            <h3 class="text-2xl font-bold mt-1">5</h3>
                            <p class="text-xs text-red-600 mt-1 flex items-center gap-1">
                                <i data-lucide="clock" class="h-3 w-3"></i>
                                To complete
                            </p>
                        </div>
                        <div class="h-12 w-12 rounded-lg bg-red-100 flex items-center justify-center">
                            <i data-lucide="check-square" class="h-6 w-6 text-red-600"></i>
                        </div>
                    </div>
                </div>
            </div>

            <div class="rounded-xl border bg-card p-6">
                <div class="flex justify-between items-center mb-4">
                    <div class="flex items-center gap-2">
                        <i data-lucide="message-circle" class="h-5 w-5 text-primary"></i>
                        <h3 class="font-semibold text-lg">Parent Messages</h3>
                    </div>
                    <span class="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-medium" id="teacher-message-count-badge">0</span>
                </div>
                <div id="teacher-messages-list" class="space-y-2 max-h-96 overflow-y-auto">
                    <div class="text-center text-muted-foreground py-8">
                        <i data-lucide="message-circle" class="h-12 w-12 mx-auto mb-3 opacity-50"></i>
                        <p>Loading messages...</p>
                    </div>
                </div>
                <button onclick="loadTeacherMessages()" class="mt-4 w-full py-2 text-sm border rounded-lg hover:bg-accent flex items-center justify-center gap-2 transition-colors">
                    <i data-lucide="refresh-cw" class="h-4 w-4"></i>
                    Refresh Messages
                </button>
            </div>

            <div class="grid gap-4 md:grid-cols-3">
                <button onclick="showDashboardSection('attendance')" class="p-4 border rounded-lg hover:bg-accent transition-colors text-left">
                    <i data-lucide="calendar-check" class="h-6 w-6 text-blue-600 mb-2"></i>
                    <p class="font-medium">Take Attendance</p>
                    <p class="text-xs text-muted-foreground">Mark today's attendance</p>
                </button>
                <button onclick="showDashboardSection('grades')" class="p-4 border rounded-lg hover:bg-accent transition-colors text-left">
                    <i data-lucide="trending-up" class="h-6 w-6 text-green-600 mb-2"></i>
                    <p class="font-medium">Enter Marks</p>
                    <p class="text-xs text-muted-foreground">Record exam results</p>
                </button>
                <button onclick="showDashboardSection('students')" class="p-4 border rounded-lg hover:bg-accent transition-colors text-left">
                    <i data-lucide="users" class="h-6 w-6 text-purple-600 mb-2"></i>
                    <p class="font-medium">Manage Students</p>
                    <p class="text-xs text-muted-foreground">Add or view students</p>
                </button>
            </div>

            <div class="rounded-xl border bg-card p-6" id="duty-card">
                <div class="flex justify-between items-start">
                    <div>
                        <h3 class="font-semibold">Today's Duty</h3>
                        <p class="text-sm text-muted-foreground" id="duty-location">${data.todayDuty?.duties?.find(d => d.teacherId === user?.id)?.area || 'No duty today'}</p>
                    </div>
                    <span class="duty-status px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full" id="duty-status">Not Checked In</span>
                </div>
                <div class="mt-4 flex gap-3">
                    <button onclick="handleCheckIn()" class="flex-1 bg-primary text-primary-foreground py-2 rounded-lg hover:bg-primary/90" id="check-in-btn">
                        <i data-lucide="log-in" class="inline h-4 w-4 mr-2"></i>
                        Check In
                    </button>
                    <button onclick="handleCheckOut()" class="flex-1 border border-input bg-background py-2 rounded-lg hover:bg-accent" id="check-out-btn" disabled>
                        <i data-lucide="log-out" class="inline h-4 w-4 mr-2"></i>
                        Check Out
                    </button>
                </div>
                <div class="mt-3 text-xs text-muted-foreground" id="duty-rating">
                    Last duty rating: <span id="last-rating">4.5</span>/5
                </div>
            </div>
        </div>
    `;
}

async function renderTeacherStudents() {
    try {
        const students = await loadMyStudents();
        const curriculum = schoolSettings.curriculum || 'cbc';
        const schoolLevel = schoolSettings.schoolLevel || 'secondary';
        const curriculumInfo = CURRICULUMS[curriculum];
        const subjectInfo = curriculumInfo?.subjects[schoolLevel] || [];
        const allSubjects = [...subjectInfo, ...(customSubjects || [])];

        return `
            <div class="space-y-6 animate-fade-in">
                <div class="flex justify-between items-center">
                    <h2 class="text-2xl font-bold">My Students</h2>
                    <button onclick="showAddStudentModal()" class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 flex items-center gap-2">
                        <i data-lucide="plus" class="h-4 w-4"></i>
                        Add Student
                    </button>
                </div>

                <div class="rounded-xl border bg-card overflow-hidden">
                    <div class="overflow-x-auto">
                        <table class="w-full text-sm">
                            <thead class="bg-muted/50">
                                <tr>
                                    <th class="px-4 py-3 text-left font-medium">Student</th>
                                    <th class="px-4 py-3 text-left font-medium">Class</th>
                                    <th class="px-4 py-3 text-left font-medium">ELIMUID</th>
                                    <th class="px-4 py-3 text-left font-medium">Attendance</th>
                                    <th class="px-4 py-3 text-left font-medium">Average</th>
                                    <th class="px-4 py-3 text-right font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y" id="my-students-table">
                                ${students.map(student => `
                                    <tr class="hover:bg-accent/50 transition-colors">
                                        <td class="px-4 py-3">
                                            <div class="flex items-center gap-3">
                                                <div class="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                                    <span class="font-medium text-blue-700 text-sm">${getInitials(student.User?.name)}</span>
                                                </div>
                                                <span class="font-medium">${student.User?.name}</span>
                                            </div>
                                        </td>
                                        <td class="px-4 py-3">Grade ${student.grade}</td>
                                        <td class="px-4 py-3">
                                            <span class="font-mono text-xs bg-muted px-2 py-1 rounded">${student.elimuid}</span>
                                        </td>
                                        <td class="px-4 py-3">
                                            <div class="flex items-center gap-2">
                                                <div class="h-2 w-16 rounded-full bg-muted overflow-hidden">
                                                    <div class="h-full w-[${student.attendance || 95}%] bg-green-500 rounded-full"></div>
                                                </div>
                                                <span class="text-xs">${student.attendance || 95}%</span>
                                            </div>
                                        </td>
                                        <td class="px-4 py-3">
                                            <span class="font-semibold ${(student.average || 0) > 80 ? 'text-green-600' : (student.average || 0) > 60 ? 'text-yellow-600' : 'text-red-600'}">${student.average || 0}%</span>
                                        </td>
                                        <td class="px-4 py-3 text-right">
                                            <button onclick="copyElimuid('${student.elimuid}')" class="p-2 hover:bg-accent rounded-lg">
                                                <i data-lucide="copy" class="h-4 w-4"></i>
                                            </button>
                                            <button onclick="viewStudentDetails('${student.id}')" class="p-2 hover:bg-accent rounded-lg">
                                                <i data-lucide="eye" class="h-4 w-4"></i>
                                            </button>
                                        </td>
                                    </tr>
                                `).join('')}
                                ${students.length === 0 ? '<tr><td colspan="6" class="px-4 py-8 text-center text-muted-foreground">No students yet. Click "Add Student" to get started.</td></tr>' : ''}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="rounded-xl border bg-card p-6">
                    <h3 class="font-semibold mb-4">CSV Bulk Upload</h3>
                    <div id="csv-drop-zone" class="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                        <i data-lucide="upload" class="h-10 w-10 mx-auto text-muted-foreground"></i>
                        <p class="text-sm mt-2">Drag & drop CSV file or click to browse</p>
                        <p class="text-xs text-muted-foreground mt-1">Analytics engine will process automatically</p>
                        <input type="file" id="csv-file-input" accept=".csv" class="hidden">
                    </div>
                    <div id="upload-progress-container" class="mt-3 hidden">
                        <div class="w-full bg-muted rounded-full h-2">
                            <div id="upload-progress" class="bg-primary h-2 rounded-full" style="width: 0%"></div>
                        </div>
                        <p id="upload-progress-text" class="text-xs text-center mt-1">0%</p>
                    </div>
                    <button onclick="downloadTemplate('students')" class="mt-4 text-sm text-primary hover:underline flex items-center gap-1">
                        <i data-lucide="download" class="h-4 w-4"></i>
                        Download CSV Template
                    </button>
                </div>
            </div>
        `;
    } catch (error) {
        return `<div class="text-center py-12 text-red-500">Error loading students: ${error.message}</div>`;
    }
}

async function renderTeacherAttendance() {
    try {
        const students = await loadMyStudents();

        return `
            <div class="space-y-6 animate-fade-in">
                <div class="flex justify-between items-center">
                    <h2 class="text-2xl font-bold">Take Attendance</h2>
                    <div class="flex items-center gap-4">
                        <select id="attendance-class" class="px-3 py-2 border rounded-lg bg-background">
                            <option value="">All Classes</option>
                            <option value="10A">Class 10A</option>
                            <option value="10B">Class 10B</option>
                        </select>
                        <span class="text-sm font-medium">${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                </div>

                <div class="rounded-xl border bg-card overflow-hidden">
                    <div class="p-4 border-b bg-muted/30 flex justify-between items-center">
                        <div class="flex items-center gap-4">
                            <span class="flex items-center gap-2"><span class="h-3 w-3 bg-green-500 rounded-full"></span> Present</span>
                            <span class="flex items-center gap-2"><span class="h-3 w-3 bg-red-500 rounded-full"></span> Absent</span>
                            <span class="flex items-center gap-2"><span class="h-3 w-3 bg-yellow-500 rounded-full"></span> Late</span>
                        </div>
                        <button onclick="saveAttendance()" class="px-4 py-2 bg-primary text-primary-foreground rounded-lg">Save Attendance</button>
                    </div>

                    <div class="overflow-x-auto">
                        <table class="w-full text-sm">
                            <thead class="bg-muted/50">
                                <tr>
                                    <th class="px-4 py-3 text-left font-medium">Student</th>
                                    <th class="px-4 py-3 text-left font-medium">ELIMUID</th>
                                    <th class="px-4 py-3 text-center font-medium">Status</th>
                                    <th class="px-4 py-3 text-left font-medium">Notes</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y">
                                ${students.map(student => `
                                    <tr class="hover:bg-accent/50 transition-colors" data-student-id="${student.id}">
                                        <td class="px-4 py-3">
                                            <div class="flex items-center gap-3">
                                                <div class="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                                    <span class="font-medium text-blue-700 text-sm">${getInitials(student.User?.name)}</span>
                                                </div>
                                                <span class="font-medium">${student.User?.name}</span>
                                            </div>
                                        </td>
                                        <td class="px-4 py-3">
                                            <span class="font-mono text-xs bg-muted px-2 py-1 rounded">${student.elimuid}</span>
                                        </td>
                                        <td class="px-4 py-3 text-center">
                                            <select class="attendance-status rounded-lg border border-input bg-background px-3 py-1 text-sm">
                                                <option value="present" selected>Present</option>
                                                <option value="absent">Absent</option>
                                                <option value="late">Late</option>
                                                <option value="sick">Sick</option>
                                                <option value="holiday">Holiday</option>
                                            </select>
                                        </td>
                                        <td class="px-4 py-3">
                                            <input type="text" class="attendance-note w-full rounded border-0 bg-transparent text-sm focus:ring-0" placeholder="Add note...">
                                        </td>
                                    </tr>
                                `).join('')}
                                ${students.length === 0 ? '<tr><td colspan="4" class="px-4 py-8 text-center text-muted-foreground">No students found</td></tr>' : ''}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        return `<div class="text-center py-12 text-red-500">Error loading attendance: ${error.message}</div>`;
    }
}

async function renderTeacherGrades() {
    try {
        const students = await loadMyStudents();
        const curriculum = schoolSettings.curriculum || 'cbc';
        const schoolLevel = schoolSettings.schoolLevel || 'secondary';
        const curriculumInfo = CURRICULUMS[curriculum];
        const subjectInfo = curriculumInfo?.subjects[schoolLevel] || [];
        const allSubjects = [...subjectInfo, ...(customSubjects || [])];

        return `
            <div class="space-y-6 animate-fade-in">
                <div class="flex justify-between items-center">
                    <h2 class="text-2xl font-bold">Grade Management</h2>
                    <div class="flex gap-2">
                        <select id="grade-class" class="px-3 py-2 border rounded-lg bg-background">
                            <option value="">All Classes</option>
                            <option value="10A">Class 10A</option>
                            <option value="10B">Class 10B</option>
                        </select>
                        <select id="grade-subject" class="px-3 py-2 border rounded-lg bg-background">
                            ${allSubjects.map(subject => `<option value="${subject}">${subject}</option>`).join('')}
                        </select>
                        <select id="grade-type" class="px-3 py-2 border rounded-lg bg-background">
                            <option value="test">Test</option>
                            <option value="exam">Exam</option>
                            <option value="assignment">Assignment</option>
                            <option value="project">Project</option>
                            <option value="quiz">Quiz</option>
                        </select>
                    </div>
                </div>

                <div class="rounded-xl border bg-card overflow-hidden">
                    <div class="overflow-x-auto">
                        <table class="w-full text-sm">
                            <thead class="bg-muted/50">
                                <tr>
                                    <th class="px-4 py-3 text-left font-medium">Student</th>
                                    <th class="px-4 py-3 text-left font-medium">ELIMUID</th>
                                    <th class="px-4 py-3 text-center font-medium">Score</th>
                                    <th class="px-4 py-3 text-center font-medium">Grade</th>
                                    <th class="px-4 py-3 text-left font-medium">Comments</th>
                                    <th class="px-4 py-3 text-center font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y" id="grades-table-body">
                                ${students.map(student => {
                                    const gradeInfo = getGradeFromScore(0, curriculum, schoolLevel);
                                    return `
                                        <tr class="hover:bg-accent/50 transition-colors" data-student-id="${student.id}">
                                            <td class="px-4 py-3">
                                                <div class="flex items-center gap-3">
                                                    <div class="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                                        <span class="font-medium text-blue-700 text-sm">${getInitials(student.User?.name)}</span>
                                                    </div>
                                                    <span class="font-medium">${student.User?.name}</span>
                                                </div>
                                            </td>
                                            <td class="px-4 py-3">
                                                <span class="font-mono text-xs bg-muted px-2 py-1 rounded">${student.elimuid}</span>
                                            </td>
                                            <td class="px-4 py-3 text-center">
                                                <input type="number" class="student-score w-20 rounded-lg border border-input bg-background px-2 py-1 text-sm text-center" min="0" max="100" onchange="updateGradeDisplay(this, '${curriculum}', '${schoolLevel}')">
                                            </td>
                                            <td class="px-4 py-3 text-center">
                                                <span class="student-grade px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">-</span>
                                            </td>
                                            <td class="px-4 py-3">
                                                <input type="text" class="student-comment w-full rounded border-0 bg-transparent text-sm focus:ring-0" placeholder="Add comment...">
                                            </td>
                                            <td class="px-4 py-3 text-center">
                                                <button onclick="saveStudentGrade(this)" class="px-3 py-1 bg-primary text-primary-foreground text-xs rounded-lg">Save</button>
                                            </td>
                                        </tr>
                                    `;
                                }).join('')}
                                ${students.length === 0 ? '<tr><td colspan="6" class="px-4 py-8 text-center text-muted-foreground">No students found</td></tr>' : ''}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        return `<div class="text-center py-12 text-red-500">Error loading grades: ${error.message}</div>`;
    }
}

function renderTeacherTasks() {
    return `
        <div class="space-y-6 animate-fade-in">
            <div class="flex justify-between items-center">
                <h2 class="text-2xl font-bold">My Tasks</h2>
                <button onclick="addTeacherTask()" class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 flex items-center gap-2">
                    <i data-lucide="plus" class="h-4 w-4"></i>
                    New Task
                </button>
            </div>

            <div class="grid gap-4 md:grid-cols-2">
                <div class="rounded-xl border bg-card p-6">
                    <h3 class="font-semibold mb-4">Pending Tasks</h3>
                    <div class="space-y-2">
                        <div class="flex items-center gap-3 p-3 hover:bg-accent/50 rounded-lg">
                            <input type="checkbox" class="rounded">
                            <div class="flex-1">
                                <p class="font-medium">Grade Mathematics exams</p>
                                <p class="text-sm text-muted-foreground">Due: ${formatDate(new Date(Date.now() + 2*24*60*60*1000))}</p>
                            </div>
                            <span class="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">Urgent</span>
                        </div>
                        <div class="flex items-center gap-3 p-3 hover:bg-accent/50 rounded-lg">
                            <input type="checkbox" class="rounded">
                            <div class="flex-1">
                                <p class="font-medium">Prepare lesson plan</p>
                                <p class="text-sm text-muted-foreground">Due: ${formatDate(new Date(Date.now() + 5*24*60*60*1000))}</p>
                            </div>
                            <span class="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full">High</span>
                        </div>
                    </div>
                </div>

                <div class="rounded-xl border bg-card p-6">
                    <h3 class="font-semibold mb-4">Completed Tasks</h3>
                    <div class="space-y-2">
                        <div class="flex items-center gap-3 p-3 hover:bg-accent/50 rounded-lg">
                            <input type="checkbox" class="rounded" checked disabled>
                            <div class="flex-1">
                                <p class="font-medium line-through text-muted-foreground">Update gradebook</p>
                                <p class="text-sm text-muted-foreground">Completed ${formatDate(new Date(Date.now() - 1*24*60*60*1000))}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

async function renderTeacherDuty() {
    try {
        const todayDuty = await loadTodayDuty();
        const weeklyDuty = await loadWeeklyDuty();
        const user = getCurrentUser();

        return `
            <div class="space-y-6 animate-fade-in">
                <h2 class="text-2xl font-bold">My Duty Schedule</h2>

                <div class="grid gap-4 md:grid-cols-2">
                    <div class="rounded-xl border bg-card p-6">
                        <h3 class="font-semibold mb-4">This Week's Duty</h3>
                        <div class="space-y-3">
                            ${weeklyDuty?.filter(day => day.duties.some(d => d.teacherId === user?.id)).map(day => day.duties
                                .filter(d => d.teacherId === user?.id)
                                .map(duty => `
                                    <div class="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                                        <div>
                                            <p class="font-medium">${day.dayName}</p>
                                            <p class="text-sm text-muted-foreground">${duty.area}</p>
                                        </div>
                                        <span class="text-sm">${duty.timeSlot?.start} - ${duty.timeSlot?.end}</span>
                                    </div>
                                `).join('')
                            ).join('')}
                            ${!weeklyDuty?.some(day => day.duties.some(d => d.teacherId === user?.id)) ? 
                                '<p class="text-center text-muted-foreground py-4">No duty assigned this week</p>' : ''}
                        </div>
                        <button onclick="showDashboardSection('duty-preferences')" class="mt-4 w-full py-2 border rounded-lg hover:bg-accent flex items-center justify-center gap-2">
                            <i data-lucide="settings" class="h-4 w-4"></i>
                            Set Preferences
                        </button>
                    </div>

                    <div class="rounded-xl border bg-card p-6">
                        <h3 class="font-semibold mb-4">Duty History</h3>
                        <div class="space-y-3">
                            <div class="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                                <div>
                                    <p class="font-medium">${formatDate(new Date(Date.now() - 2*24*60*60*1000))}</p>
                                    <p class="text-sm text-muted-foreground">Main Gate</p>
                                </div>
                                <span class="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Rating: 4.5</span>
                            </div>
                            <div class="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                                <div>
                                    <p class="font-medium">${formatDate(new Date(Date.now() - 5*24*60*60*1000))}</p>
                                    <p class="text-sm text-muted-foreground">Dining Hall</p>
                                </div>
                                <span class="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Rating: 5.0</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="rounded-xl border bg-card p-6">
                    <h3 class="font-semibold mb-4">Request Duty Swap</h3>
                    <div class="space-y-3">
                        <div>
                            <label class="block text-sm font-medium mb-1">Date</label>
                            <input type="date" id="swap-date" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                        </div>
                        <div>
                            <label class="block text-sm font-medium mb-1">Reason</label>
                            <textarea id="swap-reason" rows="2" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" placeholder="Why do you need to swap?"></textarea>
                        </div>
                        <div>
                            <label class="block text-sm font-medium mb-1">Target Teacher (Optional)</label>
                            <select id="swap-target" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                                <option value="">Any available teacher</option>
                                <option value="2">Mr. Kamau</option>
                                <option value="3">Ms. Atieno</option>
                            </select>
                        </div>
                        <button onclick="handleSwapRequest()" class="w-full bg-primary text-primary-foreground py-2 rounded-lg hover:bg-primary/90">
                            Submit Request
                        </button>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        return `<div class="text-center py-12 text-red-500">Error loading duty: ${error.message}</div>`;
    }
}

function renderTeacherDutyPreferences() {
    const user = getCurrentUser();
    const teacher = user?.teacher || {};
    const preferences = teacher.dutyPreferences || {};

    return `
        <div class="space-y-6 animate-fade-in">
            <h2 class="text-2xl font-bold">Duty Preferences</h2>
            <div class="rounded-xl border bg-card p-6 max-w-2xl mx-auto">
                ${renderDutyPreferencesForm(preferences)}
            </div>
        </div>
    `;
}

function renderTeacherChat() {
    return `
        <div class="max-w-4xl mx-auto space-y-6 animate-fade-in">
            <div class="rounded-xl border bg-card p-4 h-[600px] flex flex-col">
                <div class="flex justify-between items-center mb-4 pb-2 border-b">
                    <div class="flex items-center gap-3">
                        <div class="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
                            <i data-lucide="message-circle" class="h-5 w-5 text-white"></i>
                        </div>
                        <div>
                            <h3 class="font-semibold">Teachers' Staff Room</h3>
                            <p class="text-xs text-muted-foreground">8 members online</p>
                        </div>
                    </div>
                    <button class="p-2 hover:bg-accent rounded-lg" onclick="showToast('Group members: All teachers', 'info')">
                        <i data-lucide="users" class="h-5 w-5"></i>
                    </button>
                </div>

                <div class="flex-1 overflow-y-auto space-y-4 mb-4 p-4 bg-muted/20 rounded-lg" id="chat-messages-container">
                    <div class="flex justify-start">
                        <div class="chat-bubble-received max-w-[70%]">
                            <p class="text-sm font-medium">Mr. Kamau</p>
                            <p class="text-sm">Has anyone prepared the math exam for Grade 10?</p>
                            <p class="text-xs text-muted-foreground mt-1">10:30 AM</p>
                        </div>
                    </div>
                    <div class="flex justify-end">
                        <div class="chat-bubble-sent max-w-[70%]">
                            <p class="text-sm font-medium">You</p>
                            <p class="text-sm">Yes, I have it ready. I'll share it in the staff drive.</p>
                            <p class="text-xs text-muted-foreground mt-1">10:32 AM</p>
                        </div>
                    </div>
                </div>

                <div class="flex gap-2">
                    <input type="text" id="chat-message-input" placeholder="Type your message..." class="flex-1 rounded-lg border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                    <button onclick="sendChatMessage()" class="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 flex items-center gap-2">
                        <i data-lucide="send" class="h-4 w-4"></i>
                        Send
                    </button>
                </div>
            </div>
        </div>
    `;
}

window.renderTeacherSection = renderTeacherSection;
window.renderTeacherDashboard = renderTeacherDashboard;
window.renderTeacherStudents = renderTeacherStudents;
window.renderTeacherAttendance = renderTeacherAttendance;
window.renderTeacherGrades = renderTeacherGrades;
window.renderTeacherTasks = renderTeacherTasks;
window.renderTeacherDuty = renderTeacherDuty;
window.renderTeacherDutyPreferences = renderTeacherDutyPreferences;
window.renderTeacherChat = renderTeacherChat;