// teacher-student-management.js - COMPLETE FIXED VERSION

// ============ LOAD TEACHER'S STUDENTS ============

async function loadMyStudents() {
    try {
        console.log('📥 Loading teacher students...');
        const response = await api.teacher.getMyStudents();
        return response.data || [];
    } catch (error) {
        console.error('❌ Failed to load students:', error);
        if (error.message.includes('403')) {
            showToast('You are not logged in as a teacher', 'error');
        } else {
            showToast(error.message || 'Failed to load students', 'error');
        }
        return [];
    }
}

// ============ REFRESH TEACHER STUDENT TABLE ============

async function refreshTeacherStudentList() {
    const container = document.getElementById('teacher-students-table-body');
    if (!container) {
        console.warn('⚠️ Teacher student table container not found - using fallback');
        // Try fallback IDs
        const fallback = document.getElementById('my-students-table') || 
                        document.querySelector('table tbody');
        if (fallback) {
            await refreshWithFallback(fallback);
        }
        return;
    }
    
    try {
        container.innerHTML = '<tr><td colspan="6" class="px-4 py-8 text-center">Loading...</td></tr>';
        
        const students = await loadMyStudents();
        
        if (!students || students.length === 0) {
            container.innerHTML = '<tr><td colspan="6" class="px-4 py-8 text-center text-muted-foreground">No students in your class yet</td></tr>';
            return;
        }
        
        let html = '';
        students.forEach(student => {
            const user = student.User || {};
            const name = user.name || 'Unknown';
            const grade = student.grade || 'N/A';
            const elimuid = student.elimuid || 'N/A';
            const attendance = student.attendance || 95;
            const average = student.average || 0;
            
            const avgClass = average > 80 ? 'text-green-600' : 
                            average > 60 ? 'text-yellow-600' : 'text-red-600';
            
            html += `
                <tr class="hover:bg-accent/50 transition-colors">
                    <td class="px-4 py-3">
                        <div class="flex items-center gap-3">
                            <div class="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                <span class="font-medium text-blue-700 text-sm">${getInitials(name)}</span>
                            </div>
                            <span class="font-medium">${name}</span>
                        </div>
                    </td>
                    <td class="px-4 py-3">${grade}</td>
                    <td class="px-4 py-3">
                        <span class="font-mono text-xs bg-muted px-2 py-1 rounded">${elimuid}</span>
                    </td>
                    <td class="px-4 py-3">
                        <div class="flex items-center gap-2">
                            <div class="h-2 w-16 rounded-full bg-muted overflow-hidden">
                                <div class="h-full w-[${attendance}%] bg-green-500 rounded-full"></div>
                            </div>
                            <span class="text-xs">${attendance}%</span>
                        </div>
                    </td>
                    <td class="px-4 py-3">
                        <span class="font-semibold ${avgClass}">${average}%</span>
                    </td>
                    <td class="px-4 py-3 text-right">
                        <button onclick="viewStudentDetails('${student.id}')" class="p-2 hover:bg-accent rounded-lg">
                            <i data-lucide="eye" class="h-4 w-4"></i>
                        </button>
                        <button onclick="copyElimuid('${elimuid}')" class="p-2 hover:bg-accent rounded-lg">
                            <i data-lucide="copy" class="h-4 w-4"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
        
        container.innerHTML = html;
        
        // Update stats
        const countEl = document.getElementById('my-students-count');
        if (countEl) countEl.textContent = students.length;
        
        if (window.lucide) lucide.createIcons();
        
    } catch (error) {
        console.error('Error refreshing teacher student list:', error);
        container.innerHTML = '<tr><td colspan="6" class="px-4 py-8 text-center text-red-500">Error loading students</td></tr>';
    }
}

// Fallback function
async function refreshWithFallback(container) {
    try {
        const students = await loadMyStudents();
        if (!students || students.length === 0) {
            container.innerHTML = '<tr><td colspan="6" class="px-4 py-8 text-center">No students</td></tr>';
            return;
        }
        // Simple render
        container.innerHTML = students.map(s => `
            <tr><td>${s.User?.name}</td><td>${s.elimuid}</td></tr>
        `).join('');
    } catch (e) {
        console.error('Fallback failed:', e);
    }
}

// ============ ADD STUDENT ============

function showAddStudentModal() {
    const modal = document.getElementById('add-student-modal');
    if (modal) {
        modal.classList.remove('hidden');
    } else {
        createAddStudentModal();
    }
}

function createAddStudentModal() {
    const modalHTML = `
        <div id="add-student-modal" class="fixed inset-0 z-50 hidden">
            <div class="absolute inset-0 bg-black/50" onclick="closeAddStudentModal()"></div>
            <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md p-4">
                <div class="rounded-xl border bg-card p-6 shadow-xl">
                    <h3 class="text-lg font-semibold mb-4">Add New Student</h3>
                    <div class="space-y-4">
                        <input type="text" id="student-name" placeholder="Full Name" class="w-full rounded-lg border p-2">
                        <input type="text" id="student-grade" placeholder="Grade" class="w-full rounded-lg border p-2">
                        <input type="email" id="parent-email" placeholder="Parent Email" class="w-full rounded-lg border p-2">
                        <button onclick="handleAddStudent()" class="w-full bg-primary text-white p-2 rounded-lg">Add Student</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeAddStudentModal() {
    const modal = document.getElementById('add-student-modal');
    if (modal) modal.classList.add('hidden');
}

async function handleAddStudent() {
    const name = document.getElementById('student-name')?.value;
    const grade = document.getElementById('student-grade')?.value;
    const parentEmail = document.getElementById('parent-email')?.value;
    
    if (!name || !grade) {
        showToast('Name and grade required', 'error');
        return;
    }
    
    showLoading();
    try {
        const response = await api.teacher.addStudent({ name, grade, parentEmail });
        showToast(`✅ Student added! ELIMUID: ${response.data.elimuid}`, 'success');
        closeAddStudentModal();
        await refreshTeacherStudentList();
    } catch (error) {
        showToast(error.message || 'Failed to add student', 'error');
    } finally {
        hideLoading();
    }
}

// ============ VIEW STUDENT DETAILS ============

async function viewStudentDetails(studentId) {
    showLoading();
    try {
        const students = await loadMyStudents();
        const student = students.find(s => s.id == studentId);
        
        if (!student) {
            showToast('Student not found', 'error');
            return;
        }
        
        alert(`Student: ${student.User?.name}\nELIMUID: ${student.elimuid}\nGrade: ${student.grade}`);
    } catch (error) {
        showToast('Error loading student details', 'error');
    } finally {
        hideLoading();
    }
}

// ============ EXPORT ============
window.loadMyStudents = loadMyStudents;
window.refreshTeacherStudentList = refreshTeacherStudentList;
window.showAddStudentModal = showAddStudentModal;
window.closeAddStudentModal = closeAddStudentModal;
window.handleAddStudent = handleAddStudent;
window.viewStudentDetails = viewStudentDetails;