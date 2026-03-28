// ============ ROLE DETECTION FUNCTIONS ============
// Add these at the top of your file after the existing code

function getTeacherRole() {
    const user = getCurrentUser();
    if (!user || user.role !== 'teacher') return null;
    
    // Get teacher data from user object
    const teacherData = user.teacher || {};
    return teacherData.type || 'subject_teacher'; // class_teacher, subject_teacher, both
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
    if (role === 'class_teacher') {
        return 'You are the Class Teacher. You can manage students, upload via CSV, and enter marks for all subjects.';
    } else if (role === 'subject_teacher') {
        return 'You are a Subject Teacher. You can enter marks for your assigned subjects and classes.';
    } else if (role === 'both') {
        return 'You are both a Class Teacher and Subject Teacher. You have full access to student management and marks entry.';
    }
    return 'Manage your classes, students, and grades.';
}

// ============ UPDATED renderTeacherDashboard with Role Badge ============
// Replace your existing renderTeacherDashboard with this one

function renderTeacherDashboard() {
    const data = dashboardData || {};
    const user = getCurrentUser();
    const school = getCurrentSchool();
    const isClassTeacherFlag = isClassTeacher();
    const isSubjectTeacherFlag = isSubjectTeacher();
    const teacherRole = getTeacherRole();
    
    let roleBadge = '';
    if (teacherRole === 'class_teacher') roleBadge = '<span class="ml-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">Class Teacher</span>';
    else if (teacherRole === 'subject_teacher') roleBadge = '<span class="ml-2 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Subject Teacher</span>';
    else if (teacherRole === 'both') roleBadge = '<span class="ml-2 px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">Class & Subject Teacher</span>';

    return `
        <div class="space-y-6 animate-fade-in">
            <!-- School Name Header -->
            <div class="rounded-xl border bg-card p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700">
                <div class="flex justify-between items-center">
                    <div>
                        <h2 id="teacher-school-name" class="text-xl font-semibold">${school?.name || 'Your School'}</h2>
                        <p class="text-sm text-muted-foreground">Welcome back, ${user?.name || 'Teacher'}! ${roleBadge}</p>
                        <p class="text-xs text-muted-foreground mt-1">${getTeacherRoleDescription()}</p>
                    </div>
                    <div class="text-right">
                        <p class="text-xs text-muted-foreground">${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                        ${isClassTeacherFlag ? `
                            <button onclick="showCSVUploadModal()" class="mt-2 px-3 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 flex items-center gap-1">
                                <i data-lucide="upload" class="h-3 w-3"></i>
                                Upload CSV
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>

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
                            <p class="text-sm font-medium text-muted-foreground">My Subjects</p>
                            <h3 class="text-2xl font-bold mt-1" id="my-subjects-count">${data.subjects?.length || 0}</h3>
                            <p class="text-xs text-muted-foreground mt-1">Assigned to teach</p>
                        </div>
                        <div class="h-12 w-12 rounded-lg bg-violet-100 flex items-center justify-center">
                            <i data-lucide="book-open" class="h-6 w-6 text-violet-600"></i>
                        </div>
                    </div>
                </div>

                <div class="rounded-xl border bg-card p-6 card-hover">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-muted-foreground">Attendance Today</p>
                            <h3 class="text-2xl font-bold mt-1" id="attendance-today">0/0</h3>
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
                            <h3 class="text-2xl font-bold mt-1" id="pending-tasks">0</h3>
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

            <!-- Quick Actions based on Role -->
            <div class="grid gap-4 md:grid-cols-4">
                ${isClassTeacherFlag ? `
                    <button onclick="showDashboardSection('my-class')" class="p-4 border rounded-lg hover:bg-accent transition-colors text-left">
                        <i data-lucide="graduation-cap" class="h-6 w-6 text-blue-600 mb-2"></i>
                        <p class="font-medium">My Class</p>
                        <p class="text-xs text-muted-foreground">Class dashboard & analytics</p>
                    </button>
                ` : ''}
                
                ${isSubjectTeacherFlag ? `
                    <button onclick="showDashboardSection('my-subjects')" class="p-4 border rounded-lg hover:bg-accent transition-colors text-left">
                        <i data-lucide="book-open" class="h-6 w-6 text-green-600 mb-2"></i>
                        <p class="font-medium">My Subjects</p>
                        <p class="text-xs text-muted-foreground">View subjects you teach</p>
                    </button>
                ` : ''}
                
                <button onclick="showDashboardSection('marks')" class="p-4 border rounded-lg hover:bg-accent transition-colors text-left">
                    <i data-lucide="trending-up" class="h-6 w-6 text-purple-600 mb-2"></i>
                    <p class="font-medium">Enter Marks</p>
                    <p class="text-xs text-muted-foreground">Record student grades</p>
                </button>
                
                <button onclick="showDashboardSection('attendance')" class="p-4 border rounded-lg hover:bg-accent transition-colors text-left">
                    <i data-lucide="calendar-check" class="h-6 w-6 text-amber-600 mb-2"></i>
                    <p class="font-medium">Attendance</p>
                    <p class="text-xs text-muted-foreground">Mark today's attendance</p>
                </button>
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

// ============ NEW FUNCTIONS FOR ROLE-BASED SECTIONS ============
// Add these after your existing render functions

async function renderTeacherMyClass() {
    const user = getCurrentUser();
    const teacherClass = user?.teacher?.classId || null;
    
    if (!teacherClass) {
        return `<div class="text-center py-12 text-muted-foreground">No class assigned to you as Class Teacher.</div>`;
    }
    
    const students = await loadMyStudents();
    const classData = await api.admin.getClassDetails(teacherClass);
    const school = getCurrentSchool();
    
    return `
        <div class="space-y-6 animate-fade-in">
            <div class="rounded-xl border bg-card p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700">
                <h2 id="teacher-myclass-school-name" class="text-xl font-semibold">${school?.name || 'Your School'} - My Class</h2>
            </div>

            <div class="flex justify-between items-center">
                <div>
                    <h2 class="text-2xl font-bold">${classData?.name || 'Your Class'}</h2>
                    <p class="text-muted-foreground mt-1">${students.length} students enrolled</p>
                </div>
                <button onclick="showCSVUploadModal()" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2">
                    <i data-lucide="upload" class="h-4 w-4"></i>
                    Upload Students
                </button>
            </div>
            
            <!-- Class Analytics -->
            <div class="grid gap-4 md:grid-cols-3">
                <div class="rounded-xl border bg-card p-4">
                    <p class="text-sm text-muted-foreground">Class Average</p>
                    <p class="text-2xl font-bold">${calculateClassAverage(students)}%</p>
                </div>
                <div class="rounded-xl border bg-card p-4">
                    <p class="text-sm text-muted-foreground">Attendance Rate</p>
                    <p class="text-2xl font-bold">${calculateClassAttendance(students)}%</p>
                </div>
                <div class="rounded-xl border bg-card p-4">
                    <p class="text-sm text-muted-foreground">Top Performer</p>
                    <p class="text-lg font-bold truncate">${getTopPerformer(students)}</p>
                </div>
            </div>
            
            <!-- Student List -->
            <div class="rounded-xl border bg-card overflow-hidden">
                <div class="p-4 border-b">
                    <h3 class="font-semibold">Student List</h3>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-sm">
                        <thead class="bg-muted/50">
                            <tr>
                                <th class="px-4 py-3 text-left">Student</th>
                                <th class="px-4 py-3 text-left">ELIMUID</th>
                                <th class="px-4 py-3 text-center">Average</th>
                                <th class="px-4 py-3 text-center">Attendance</th>
                                <th class="px-4 py-3 text-right">Actions</th>
                            </thead>
                        <tbody>
                            ${students.map(student => `
                                <tr class="hover:bg-accent/50">
                                    <td class="px-4 py-3 font-medium">${student.User?.name}  </td>
                                    <td class="px-4 py-3"><span class="font-mono text-xs bg-muted px-2 py-1 rounded">${student.elimuid}</span></td>
                                    <td class="px-4 py-3 text-center">${student.average || 0}%</td>
                                    <td class="px-4 py-3 text-center">${student.attendance || 95}%</td>
                                    <td class="px-4 py-3 text-right">
                                        <button onclick="viewStudentDetails('${student.id}')" class="p-2 hover:bg-accent rounded-lg">
                                            <i data-lucide="eye" class="h-4 w-4"></i>
                                        </button>
                                        <button onclick="openMarksEntryForStudent('${student.id}', '${student.User?.name}')" class="p-2 hover:bg-accent rounded-lg">
                                            <i data-lucide="edit-3" class="h-4 w-4"></i>
                                        </button>
                                    </td>
                                 </tr>
                            `).join('')}
                        </tbody>
                     </table>
                </div>
            </div>
        </div>
    `;
}

async function renderTeacherMySubjects() {
    const user = getCurrentUser();
    const teacherSubjects = user?.teacher?.subjects || [];
    const school = getCurrentSchool();
    
    return `
        <div class="space-y-6 animate-fade-in">
            <div class="rounded-xl border bg-card p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700">
                <h2 id="teacher-mysubjects-school-name" class="text-xl font-semibold">${school?.name || 'Your School'} - My Subjects</h2>
            </div>

            <h2 class="text-2xl font-bold">My Subjects</h2>
            
            <div class="grid gap-4 md:grid-cols-2">
                ${teacherSubjects.map(subject => `
                    <div class="rounded-xl border bg-card p-6 hover:shadow-md transition-all">
                        <div class="flex items-center justify-between mb-4">
                            <div class="flex items-center gap-3">
                                <div class="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <i data-lucide="book" class="h-5 w-5 text-primary"></i>
                                </div>
                                <h3 class="font-semibold text-lg">${subject.name}</h3>
                            </div>
                            <span class="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">${subject.classes?.length || 0} classes</span>
                        </div>
                        <div class="space-y-2">
                            ${(subject.classes || []).map(cls => `
                                <div class="flex justify-between items-center p-2 bg-muted/30 rounded-lg">
                                    <span class="text-sm">${cls.name}</span>
                                    <span class="text-xs text-muted-foreground">${cls.studentCount} students</span>
                                    <button onclick="openMarksEntry('${subject.name}', '${cls.id}', '${cls.name}')" 
                                            class="px-3 py-1 bg-primary text-primary-foreground text-xs rounded-lg hover:bg-primary/90">
                                        Enter Marks
                                    </button>
                                </div>
                            `).join('')}
                            ${(!subject.classes || subject.classes.length === 0) ? '<p class="text-sm text-muted-foreground">No classes assigned for this subject</p>' : ''}
                        </div>
                    </div>
                `).join('')}
                ${teacherSubjects.length === 0 ? '<div class="text-center py-12 text-muted-foreground col-span-2">No subjects assigned to you yet.</div>' : ''}
            </div>
        </div>
    `;
}

async function renderTeacherMarksEntry() {
    const user = getCurrentUser();
    const teacherSubjects = user?.teacher?.subjects || [];
    const teacherClass = user?.teacher?.classId;
    const school = getCurrentSchool();
    
    // Get all teaching assignments
    const assignments = [];
    
    if (teacherClass) {
        assignments.push({ type: 'class', id: teacherClass, name: 'My Class', subject: 'All Subjects' });
    }
    
    teacherSubjects.forEach(subject => {
        (subject.classes || []).forEach(cls => {
            assignments.push({
                type: 'subject',
                id: cls.id,
                name: cls.name,
                subject: subject.name
            });
        });
    });
    
    return `
        <div class="space-y-6 animate-fade-in">
            <div class="rounded-xl border bg-card p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700">
                <h2 id="teacher-marks-school-name" class="text-xl font-semibold">${school?.name || 'Your School'} - Enter Marks</h2>
            </div>

            <h2 class="text-2xl font-bold">Enter Marks</h2>
            <p class="text-muted-foreground">Select a class and subject to enter student grades</p>
            
            <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                ${assignments.map(ass => `
                    <div class="rounded-xl border bg-card p-4 hover:shadow-md transition-all cursor-pointer" 
                         onclick="openMarksEntry('${ass.subject || 'All Subjects'}', '${ass.id}', '${ass.name}')">
                        <div class="flex items-center gap-3 mb-2">
                            <div class="h-10 w-10 rounded-lg ${ass.type === 'class' ? 'bg-blue-100' : 'bg-green-100'} flex items-center justify-center">
                                <i data-lucide="${ass.type === 'class' ? 'graduation-cap' : 'book'}" class="h-5 w-5 ${ass.type === 'class' ? 'text-blue-600' : 'text-green-600'}"></i>
                            </div>
                            <div>
                                <p class="font-semibold">${ass.name}</p>
                                <p class="text-xs text-muted-foreground">${ass.subject}</p>
                            </div>
                        </div>
                        <button class="w-full mt-2 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
                            Enter Marks
                        </button>
                    </div>
                `).join('')}
                ${assignments.length === 0 ? '<div class="text-center py-12 text-muted-foreground col-span-3">No classes or subjects assigned to you yet.</div>' : ''}
            </div>
        </div>
    `;
}

// ============ MARKS ENTRY MODAL ============

let currentMarksClassId = null;
let currentMarksSubject = null;
let currentMarksClassName = null;
let currentMarksStudents = [];

async function openMarksEntry(subject, classId, className) {
    currentMarksSubject = subject;
    currentMarksClassId = classId;
    currentMarksClassName = className;
    
    showLoading();
    try {
        // Get students for this class
        const students = await api.admin.getClassStudents(classId);
        currentMarksStudents = students.data || [];
        
        showMarksEntryModal();
    } catch (error) {
        console.error('Error loading students:', error);
        showToast('Failed to load students', 'error');
    } finally {
        hideLoading();
    }
}

function openMarksEntryForStudent(studentId, studentName) {
    // For individual student mark entry
    showToast(`Enter marks for ${studentName}`, 'info');
}

function showMarksEntryModal() {
    let modal = document.getElementById('marks-entry-modal');
    if (!modal) {
        createMarksEntryModal();
        modal = document.getElementById('marks-entry-modal');
    }
    
    const modalContent = modal.querySelector('.modal-content');
    
    modalContent.innerHTML = `
        <div class="space-y-4">
            <div class="border-b pb-3 flex justify-between items-center">
                <div>
                    <h3 class="text-lg font-semibold">Enter Marks</h3>
                    <p class="text-sm text-muted-foreground">${currentMarksClassName} - ${currentMarksSubject}</p>
                </div>
                <button onclick="closeMarksEntryModal()" class="p-2 hover:bg-accent rounded-lg">
                    <i data-lucide="x" class="h-5 w-5"></i>
                </button>
            </div>
            
            <div class="flex gap-3 mb-4">
                <select id="assessment-type" class="rounded-lg border border-input bg-background px-3 py-2 text-sm">
                    <option value="test">Test</option>
                    <option value="exam">Exam</option>
                    <option value="assignment">Assignment</option>
                    <option value="project">Project</option>
                    <option value="quiz">Quiz</option>
                </select>
                <input type="text" id="assessment-name" placeholder="Assessment Name (e.g., Mid-term, Week 3 Test)" 
                       class="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm">
                <input type="date" id="assessment-date" value="${new Date().toISOString().split('T')[0]}" 
                       class="rounded-lg border border-input bg-background px-3 py-2 text-sm">
            </div>
            
            <div class="overflow-x-auto max-h-[50vh] overflow-y-auto">
                <table class="w-full text-sm">
                    <thead class="bg-muted/50 sticky top-0">
                        <tr>
                            <th class="px-4 py-2 text-left">Student</th>
                            <th class="px-4 py-2 text-left">ELIMUID</th>
                            <th class="px-4 py-2 text-center">Score (%)</th>
                            <th class="px-4 py-2 text-left">Grade</th>
                         </thead>
                        <tbody>
                            ${currentMarksStudents.map(student => `
                                <tr class="border-t">
                                    <td class="px-4 py-2 font-medium">${student.User?.name}</td>
                                    <td class="px-4 py-2"><span class="font-mono text-xs">${student.elimuid}</span></td>
                                    <td class="px-4 py-2 text-center">
                                        <input type="number" id="score-${student.id}" class="score-input w-20 rounded border px-2 py-1 text-center" 
                                               min="0" max="100" step="0.5" onchange="updateGradeDisplayForStudent('${student.id}')">
                                    </td>
                                    <td class="px-4 py-2">
                                        <span id="grade-${student.id}" class="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">-</span>
                                    </td>
                                 </tr>
                            `).join('')}
                        </tbody>
                     </table>
                </div>
            
            <div class="flex justify-end gap-3 pt-4 border-t">
                <button onclick="closeMarksEntryModal()" class="px-4 py-2 border rounded-lg hover:bg-accent">Cancel</button>
                <button onclick="saveAllMarks()" class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
                    Save All Marks
                </button>
            </div>
        </div>
    `;
    
    modal.classList.remove('hidden');
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function createMarksEntryModal() {
    const modalHTML = `
        <div id="marks-entry-modal" class="fixed inset-0 z-50 hidden">
            <div class="absolute inset-0 bg-black/50" onclick="closeMarksEntryModal()"></div>
            <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl p-4">
                <div class="rounded-xl border bg-card shadow-xl animate-fade-in max-h-[85vh] overflow-hidden flex flex-col">
                    <div class="modal-content p-6 overflow-y-auto"></div>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeMarksEntryModal() {
    const modal = document.getElementById('marks-entry-modal');
    if (modal) modal.classList.add('hidden');
    currentMarksClassId = null;
    currentMarksSubject = null;
    currentMarksStudents = [];
}

window.updateGradeDisplayForStudent = function(studentId) {
    const scoreInput = document.getElementById(`score-${studentId}`);
    const gradeSpan = document.getElementById(`grade-${studentId}`);
    const score = parseFloat(scoreInput.value);
    
    if (!isNaN(score) && score >= 0 && score <= 100) {
        let grade = '';
        if (score >= 80) grade = 'A';
        else if (score >= 75) grade = 'A-';
        else if (score >= 70) grade = 'B+';
        else if (score >= 65) grade = 'B';
        else if (score >= 60) grade = 'B-';
        else if (score >= 55) grade = 'C+';
        else if (score >= 50) grade = 'C';
        else if (score >= 45) grade = 'C-';
        else if (score >= 40) grade = 'D+';
        else if (score >= 35) grade = 'D';
        else if (score >= 30) grade = 'D-';
        else grade = 'E';
        
        gradeSpan.textContent = grade;
        let color = 'gray';
        if (score >= 80) color = 'green';
        else if (score >= 70) color = 'blue';
        else if (score >= 60) color = 'yellow';
        else if (score >= 50) color = 'orange';
        else color = 'red';
        
        gradeSpan.className = `px-2 py-1 bg-${color}-100 text-${color}-700 text-xs rounded-full`;
    } else {
        gradeSpan.textContent = '-';
        gradeSpan.className = 'px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full';
    }
};

async function saveAllMarks() {
    const assessmentType = document.getElementById('assessment-type')?.value;
    const assessmentName = document.getElementById('assessment-name')?.value;
    const assessmentDate = document.getElementById('assessment-date')?.value;
    
    if (!assessmentName) {
        showToast('Please enter an assessment name', 'error');
        return;
    }
    
    showLoading();
    
    let saved = 0;
    let failed = 0;
    
    for (const student of currentMarksStudents) {
        const scoreInput = document.getElementById(`score-${student.id}`);
        const score = parseFloat(scoreInput?.value);
        
        if (!isNaN(score) && score >= 0 && score <= 100) {
            try {
                await api.teacher.enterMarks({
                    studentId: student.id,
                    classId: currentMarksClassId,
                    subject: currentMarksSubject,
                    assessmentType: assessmentType,
                    assessmentName: assessmentName,
                    score: score,
                    date: assessmentDate
                });
                saved++;
            } catch (error) {
                console.error(`Failed to save marks for ${student.User?.name}:`, error);
                failed++;
            }
        }
    }
    
    hideLoading();
    
    if (saved > 0) {
        showToast(`✅ Saved marks for ${saved} student(s)`, 'success');
        closeMarksEntryModal();
        
        // Refresh dashboards
        if (typeof refreshMyStudents === 'function') refreshMyStudents();
    }
    
    if (failed > 0) {
        showToast(`⚠️ Failed to save for ${failed} student(s)`, 'warning');
    }
}

// ============ HELPER FUNCTIONS ============

function calculateClassAverage(students) {
    if (!students || students.length === 0) return 0;
    const sum = students.reduce((acc, s) => acc + (s.average || 0), 0);
    return Math.round(sum / students.length);
}

function calculateClassAttendance(students) {
    if (!students || students.length === 0) return 0;
    const sum = students.reduce((acc, s) => acc + (s.attendance || 95), 0);
    return Math.round(sum / students.length);
}

function getTopPerformer(students) {
    if (!students || students.length === 0) return 'N/A';
    const top = [...students].sort((a, b) => (b.average || 0) - (a.average || 0))[0];
    return top.User?.name || 'Unknown';
}

// ============ UPDATE renderTeacherSection to include new sections ============
// Replace your existing renderTeacherSection with this one

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
        case 'marks':
            return await renderTeacherMarksEntry();
        case 'my-class':
            if (isClassTeacher()) {
                return await renderTeacherMyClass();
            } else {
                return '<div class="text-center py-12 text-muted-foreground">You are not assigned as a Class Teacher.</div>';
            }
        case 'my-subjects':
            if (isSubjectTeacher()) {
                return await renderTeacherMySubjects();
            } else {
                return '<div class="text-center py-12 text-muted-foreground">You are not assigned as a Subject Teacher.</div>';
            }
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

// ============ EXPORT NEW FUNCTIONS ============

window.renderTeacherMyClass = renderTeacherMyClass;
window.renderTeacherMySubjects = renderTeacherMySubjects;
window.renderTeacherMarksEntry = renderTeacherMarksEntry;
window.openMarksEntry = openMarksEntry;
window.closeMarksEntryModal = closeMarksEntryModal;
window.saveAllMarks = saveAllMarks;
window.updateGradeDisplayForStudent = updateGradeDisplayForStudent;
window.getTeacherRole = getTeacherRole;
window.isClassTeacher = isClassTeacher;
window.isSubjectTeacher = isSubjectTeacher;
window.calculateClassAverage = calculateClassAverage;
window.calculateClassAttendance = calculateClassAttendance;
window.getTopPerformer = getTopPerformer;
