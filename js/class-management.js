// class-management.js - COMPLETE WORKING VERSION

// ============ CLASS MANAGEMENT ============

// Load all classes
async function loadAllClasses() {
    try {
        const response = await api.admin.getClasses();
        return response.data || [];
    } catch (error) {
        console.error('Failed to load classes:', error);
        return [];
    }
}

// Load available teachers
async function loadAvailableTeachers() {
    try {
        const response = await api.admin.getAvailableTeachers();
        return response.data || [];
    } catch (error) {
        console.error('Failed to load teachers:', error);
        return [];
    }
}

// Show add class modal
function showAddClassModal() {
    let modal = document.getElementById('add-class-modal');
    
    if (!modal) {
        createAddClassModal();
        modal = document.getElementById('add-class-modal');
    }
    
    document.getElementById('modal-class-name').value = '';
    document.getElementById('modal-class-grade').value = '';
    document.getElementById('modal-class-stream').value = '';
    
    modal.classList.remove('hidden');
}

// Create add class modal
function createAddClassModal() {
    const modalHTML = `
        <div id="add-class-modal" class="fixed inset-0 z-50 hidden">
            <div class="absolute inset-0 bg-black/50" onclick="closeAddClassModal()"></div>
            <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md p-4">
                <div class="rounded-xl border bg-card p-6 shadow-xl animate-fade-in">
                    <h3 class="text-lg font-semibold mb-4">Add New Class</h3>
                    
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium mb-1">Class Name *</label>
                            <input type="text" id="modal-class-name" placeholder="e.g., Form 1A, Grade 10 Science" 
                                   class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium mb-1">Grade/Level *</label>
                            <input type="text" id="modal-class-grade" placeholder="e.g., 10, Form 1" 
                                   class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium mb-1">Stream (Optional)</label>
                            <input type="text" id="modal-class-stream" placeholder="e.g., A, B, Science, Arts" 
                                   class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                        </div>
                    </div>
                    
                    <div class="flex justify-end gap-2 mt-6">
                        <button onclick="closeAddClassModal()" class="px-4 py-2 text-sm border rounded-lg hover:bg-accent">Cancel</button>
                        <button onclick="handleAddClass()" class="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">Create Class</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Close add class modal
function closeAddClassModal() {
    const modal = document.getElementById('add-class-modal');
    if (modal) modal.classList.add('hidden');
}

// Handle add class
async function handleAddClass() {
    const name = document.getElementById('modal-class-name')?.value;
    const grade = document.getElementById('modal-class-grade')?.value;
    const stream = document.getElementById('modal-class-stream')?.value;
    
    if (!name || !grade) {
        showToast('Class name and grade are required', 'error');
        return;
    }
    
    showLoading();
    try {
        const response = await api.admin.createClass({ name, grade, stream });
        
        if (response.success) {
            showToast('✅ Class created successfully', 'success');
            closeAddClassModal();
            await refreshClassesList();
        }
    } catch (error) {
        showToast(error.message || 'Failed to create class', 'error');
    } finally {
        hideLoading();
    }
}

// Refresh classes list
async function refreshClassesList() {
    const container = document.getElementById('classes-list-container');
    if (!container) return;
    
    const [classes, teachers] = await Promise.all([
        loadAllClasses(),
        loadAvailableTeachers()
    ]);
    
    container.innerHTML = renderClassesList(classes, teachers);
    
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
        lucide.createIcons();
    }
}

// Render subject teachers for a class
function renderSubjectTeachers(cls) {
    const subjectTeachers = cls.subjectTeachers || [];
    
    if (subjectTeachers.length === 0) {
        return `
            <div class="text-sm text-muted-foreground text-center py-4 bg-muted/20 rounded">
                <i data-lucide="info" class="h-4 w-4 inline mr-2"></i>
                No subject teachers assigned yet. Click "Assign Subjects" to add teachers.
            </div>
        `;
    }
    
    return `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            ${subjectTeachers.map(st => `
                <div class="flex justify-between items-center p-3 bg-card border rounded-lg shadow-sm">
                    <div>
                        <span class="font-medium text-sm">📚 ${escapeHtml(st.subject)}</span>
                        <div class="flex items-center gap-2 mt-1">
                            <span class="text-xs text-muted-foreground">Teacher:</span>
                            <span class="text-xs font-medium text-primary">${escapeHtml(st.teacherName)}</span>
                        </div>
                    </div>
                    <button onclick="removeSubjectAssignment('${st.id}', ${cls.id})" 
                            class="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                            title="Remove teacher from this subject">
                        <i data-lucide="x" class="h-4 w-4"></i>
                    </button>
                </div>
            `).join('')}
        </div>
    `;
}

// Open subject assignment modal
async function openSubjectAssignmentModal(classId, className) {
    // Fetch available teachers
    const teachers = await loadAvailableTeachers();
    
    // Get current subject assignments for this class
    let existingAssignments = [];
    try {
        const response = await api.admin.getClassSubjectAssignments(classId);
        existingAssignments = response.data || [];
    } catch (error) {
        console.error('Failed to load subject assignments:', error);
    }
    
    // Create a map of existing assignments
    const existingMap = {};
    existingAssignments.forEach(a => {
        existingMap[a.subject] = a;
    });
    
    // Get subjects based on curriculum
    const schoolSettings = JSON.parse(localStorage.getItem('schoolSettings') || '{}');
    const curriculum = schoolSettings.curriculum || 'cbc';
    const subjects = getSubjectsByCurriculum(curriculum);
    
    // Create modal HTML
    const modalHTML = `
        <div id="subject-assign-modal" class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
            <div class="bg-card rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-semibold">Assign Subject Teachers - ${escapeHtml(className)}</h3>
                    <button onclick="closeSubjectAssignmentModal()" class="p-2 hover:bg-accent rounded-lg">
                        <i data-lucide="x" class="h-5 w-5"></i>
                    </button>
                </div>
                
                <div class="space-y-4">
                    <table class="w-full text-sm">
                        <thead class="bg-muted/50">
                            <tr>
                                <th class="px-4 py-2 text-left">Subject</th>
                                <th class="px-4 py-2 text-left">Teacher</th>
                                <th class="px-4 py-2 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${subjects.map(subject => {
                                const existing = existingMap[subject];
                                return `
                                    <tr class="border-t">
                                        <td class="px-4 py-2 font-medium">${escapeHtml(subject)}</td>
                                        <td class="px-4 py-2">
                                            <select id="subject-teacher-${subject.replace(/\s/g, '_')}" class="rounded border px-2 py-1 text-sm w-48">
                                                <option value="">-- Select Teacher --</option>
                                                ${teachers.map(t => `
                                                    <option value="${t.id}" ${existing?.teacherId === t.id ? 'selected' : ''}>
                                                        ${escapeHtml(t.User?.name || 'Unknown')}
                                                    </option>
                                                `).join('')}
                                            </select>
                                        </td>
                                        <td class="px-4 py-2 text-center">
                                            <button onclick="saveSubjectAssignment(${classId}, '${subject.replace(/'/g, "\\'")}')" 
                                                    class="px-3 py-1 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90">
                                                ${existing ? 'Update' : 'Assign'}
                                            </button>
                                            ${existing ? `
                                                <button onclick="removeSubjectAssignment('${existing.id}', ${classId})" 
                                                        class="ml-2 px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200">
                                                    Remove
                                                </button>
                                            ` : ''}
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
                
                <div class="flex justify-end gap-2 mt-6 pt-4 border-t">
                    <button onclick="closeSubjectAssignmentModal()" class="px-4 py-2 border rounded-lg hover:bg-accent">Close</button>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if present
    const existingModal = document.getElementById('subject-assign-modal');
    if (existingModal) existingModal.remove();
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function closeSubjectAssignmentModal() {
    const modal = document.getElementById('subject-assign-modal');
    if (modal) modal.remove();
}

async function saveSubjectAssignment(classId, subject) {
    const selectId = `subject-teacher-${subject.replace(/\s/g, '_')}`;
    const teacherId = document.getElementById(selectId)?.value;
    
    if (!teacherId) {
        showToast('Please select a teacher', 'error');
        return;
    }
    
    showLoading();
    try {
        const response = await api.admin.assignTeacherToSubject({
            classId: parseInt(classId),
            teacherId: parseInt(teacherId),
            subject: subject,
            isClassTeacher: false
        });
        
        if (response.success) {
            showToast(`✅ ${subject} assigned successfully`, 'success');
            closeSubjectAssignmentModal();
            await refreshClassesList();
        }
    } catch (error) {
        showToast(error.message || 'Failed to assign teacher', 'error');
    } finally {
        hideLoading();
    }
}

async function removeSubjectAssignment(assignmentId, classId) {
    if (!confirm('Remove this teacher from this subject?')) return;
    
    showLoading();
    try {
        const response = await api.admin.removeSubjectAssignment(assignmentId);
        if (response.success) {
            showToast('✅ Teacher removed from subject', 'success');
            await refreshClassesList();
        }
    } catch (error) {
        showToast(error.message || 'Failed to remove teacher', 'error');
    } finally {
        hideLoading();
    }
}

function getSubjectsByCurriculum(curriculum) {
    const subjects = {
        cbc: ['Mathematics', 'English', 'Kiswahili', 'Science', 'Social Studies', 'CRE/IRE', 'Physical Education', 'Art', 'Music'],
        '844': ['Mathematics', 'English', 'Kiswahili', 'Science', 'Social Studies', 'CRE/IRE', 'Physical Education'],
        british: ['English', 'Mathematics', 'Science', 'History', 'Geography', 'Art', 'Music', 'Physical Education'],
        american: ['English', 'Mathematics', 'Science', 'Social Studies', 'Art', 'Music', 'Physical Education']
    };
    return subjects[curriculum] || subjects.cbc;
}

// Toggle expanded class details
function toggleClassDetails(classId) {
    const row = document.getElementById(`class-details-${classId}`);
    if (row) {
        row.classList.toggle('hidden');
    }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Render classes list
// Render classes list with subject teachers
function renderClassesList(classes, teachers) {
    if (!classes || classes.length === 0) {
        return `
            <div class="text-center py-12 border rounded-lg bg-card">
                <i data-lucide="users" class="h-12 w-12 mx-auto text-muted-foreground mb-4"></i>
                <p class="text-muted-foreground">No classes found. Click "Add New Class" to create one.</p>
            </div>
        `;
    }
    
    return classes.map(cls => {
        const teacher = teachers.find(t => t.id === cls.teacherId);
        const currentTeacher = teacher ? teacher.User?.name : 'Not assigned';
        const teacherOptions = teachers.map(t => `
            <option value="${t.id}" ${t.id === cls.teacherId ? 'selected' : ''}>
                ${t.User?.name || 'Unknown'} (${t.subjects?.join(', ') || 'No subjects'})
            </option>
        `).join('');
        
        // Get subject teachers from class data
        const subjectTeachers = cls.subjectTeachers || [];
        
        return `
            <div class="border rounded-lg p-4 bg-card hover:shadow-md transition-shadow mb-4" data-class-id="${cls.id}">
                <!-- Main Row -->
                <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div class="flex-1">
                        <h3 class="font-semibold text-lg">${escapeHtml(cls.name)}</h3>
                        <p class="text-sm text-muted-foreground">Grade: ${escapeHtml(cls.grade)} | Stream: ${escapeHtml(cls.stream || 'N/A')}</p>
                        <p class="text-sm mt-2">
                            <span class="font-medium">Current Teacher:</span> 
                            <span class="${teacher ? 'text-green-600' : 'text-yellow-600'}">${escapeHtml(currentTeacher)}</span>
                        </p>
                        <p class="text-xs text-muted-foreground mt-1">${cls.studentCount || 0} students enrolled</p>
                        
                        <!-- Subject Teachers Preview (shows first few) -->
                        ${subjectTeachers.length > 0 ? `
                            <div class="mt-2 flex flex-wrap gap-1">
                                ${subjectTeachers.slice(0, 3).map(st => `
                                    <span class="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">${escapeHtml(st.subject)}: ${escapeHtml(st.teacherName)}</span>
                                `).join('')}
                                ${subjectTeachers.length > 3 ? `<span class="text-xs px-2 py-0.5 bg-muted rounded-full">+${subjectTeachers.length - 3} more</span>` : ''}
                            </div>
                        ` : ''}
                    </div>
                    
                    <div class="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                        <select id="teacher-${cls.id}" class="rounded-lg border border-input bg-background px-3 py-2 text-sm min-w-[200px]">
                            <option value="">-- Select Teacher --</option>
                            ${teacherOptions}
                        </select>
                        <button onclick="assignTeacherToClass('${cls.id}')" 
                                class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 text-sm whitespace-nowrap">
                            Assign
                        </button>
                        <button onclick="toggleClassDetails(${cls.id})" 
                                class="p-2 border rounded-lg hover:bg-accent" title="View Subject Teachers">
                            <i data-lucide="users" class="h-4 w-4"></i>
                        </button>
                        <button onclick="openSubjectAssignmentModal(${cls.id}, '${escapeHtml(cls.name)}')" 
                                class="p-2 border rounded-lg hover:bg-accent" title="Assign Subjects">
                            <i data-lucide="book-open" class="h-4 w-4"></i>
                        </button>
                        <button onclick="editClass('${cls.id}')" 
                                class="p-2 border rounded-lg hover:bg-accent">
                            <i data-lucide="edit" class="h-4 w-4"></i>
                        </button>
                        <button onclick="deleteClass('${cls.id}')" 
                                class="p-2 border rounded-lg hover:bg-red-100 text-red-600">
                            <i data-lucide="trash-2" class="h-4 w-4"></i>
                        </button>
                    </div>
                </div>
                
                <!-- Expanded Row - Shows All Subject Teachers -->
                <div id="class-details-${cls.id}" class="hidden mt-4 pt-4 border-t">
                    <div class="flex justify-between items-center mb-3">
                        <h4 class="font-medium">Subject Teachers</h4>
                        <button onclick="openSubjectAssignmentModal(${cls.id}, '${escapeHtml(cls.name)}')" 
                                class="text-sm text-primary hover:underline flex items-center gap-1">
                            <i data-lucide="plus-circle" class="h-4 w-4"></i>
                            Assign Subjects
                        </button>
                    </div>
                    <div id="subject-assignments-${cls.id}" class="space-y-2">
                        ${renderSubjectTeachers(cls)}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Edit class - FULLY FUNCTIONAL
async function editClass(classId) {
    showLoading();
    try {
        const classes = await loadAllClasses();
        const classData = classes.find(c => c.id == classId);
        
        if (!classData) {
            showToast('Class not found', 'error');
            return;
        }
        
        showEditClassModal(classData);
    } catch (error) {
        console.error('Error loading class:', error);
        showToast('Failed to load class data', 'error');
    } finally {
        hideLoading();
    }
}

// Show edit class modal
function showEditClassModal(classData) {
    let modal = document.getElementById('edit-class-modal');
    
    if (!modal) {
        createEditClassModal();
        modal = document.getElementById('edit-class-modal');
    }
    
    document.getElementById('edit-class-id').value = classData.id;
    document.getElementById('edit-class-name').value = classData.name || '';
    document.getElementById('edit-class-grade').value = classData.grade || '';
    document.getElementById('edit-class-stream').value = classData.stream || '';
    
    modal.classList.remove('hidden');
}

// Create edit class modal
function createEditClassModal() {
    const modalHTML = `
        <div id="edit-class-modal" class="fixed inset-0 z-50 hidden">
            <div class="absolute inset-0 bg-black/50" onclick="closeEditClassModal()"></div>
            <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md p-4">
                <div class="rounded-xl border bg-card p-6 shadow-xl animate-fade-in">
                    <h3 class="text-lg font-semibold mb-4">Edit Class</h3>
                    
                    <input type="hidden" id="edit-class-id">
                    
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium mb-1">Class Name</label>
                            <input type="text" id="edit-class-name" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                        </div>
                        <div>
                            <label class="block text-sm font-medium mb-1">Grade/Level</label>
                            <input type="text" id="edit-class-grade" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                        </div>
                        <div>
                            <label class="block text-sm font-medium mb-1">Stream</label>
                            <input type="text" id="edit-class-stream" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                        </div>
                    </div>
                    
                    <div class="flex justify-end gap-2 mt-6">
                        <button onclick="closeEditClassModal()" class="px-4 py-2 text-sm border rounded-lg hover:bg-accent">Cancel</button>
                        <button onclick="saveClassChanges()" class="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">Save Changes</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Close edit class modal
function closeEditClassModal() {
    const modal = document.getElementById('edit-class-modal');
    if (modal) modal.classList.add('hidden');
}

// Save class changes
async function saveClassChanges() {
    const classId = document.getElementById('edit-class-id')?.value;
    const name = document.getElementById('edit-class-name')?.value;
    const grade = document.getElementById('edit-class-grade')?.value;
    const stream = document.getElementById('edit-class-stream')?.value;
    
    if (!classId) {
        showToast('Class ID not found', 'error');
        return;
    }
    
    if (!name || !grade) {
        showToast('Class name and grade are required', 'error');
        return;
    }
    
    showLoading();
    try {
        const response = await api.admin.updateClass(classId, { name, grade, stream });
        
        if (response.success) {
            showToast('✅ Class updated successfully', 'success');
            closeEditClassModal();
            await refreshClassesList();
        }
    } catch (error) {
        showToast(error.message || 'Failed to update class', 'error');
    } finally {
        hideLoading();
    }
}

// Delete class
async function deleteClass(classId) {
    if (!confirm('⚠️ Are you sure you want to delete this class?')) return;
    
    showLoading();
    try {
        const response = await api.admin.deleteClass(classId);
        
        if (response.success) {
            showToast('✅ Class deleted', 'success');
            await refreshClassesList();
        }
    } catch (error) {
        showToast(error.message || 'Failed to delete class', 'error');
    } finally {
        hideLoading();
    }
}

// Assign teacher to class
async function assignTeacherToClass(classId) {
    const select = document.getElementById(`teacher-${classId}`);
    const teacherId = select?.value;
    
    if (!teacherId) {
        showToast('Please select a teacher', 'error');
        return;
    }
    
    showLoading();
    try {
        const response = await api.admin.assignTeacherToClass(classId, teacherId);
        
        if (response.success) {
            showToast('✅ Teacher assigned successfully', 'success');
            await refreshClassesList();
        }
    } catch (error) {
        showToast(error.message || 'Failed to assign teacher', 'error');
    } finally {
        hideLoading();
    }
}

// Export functions
window.showAddClassModal = showAddClassModal;
window.closeAddClassModal = closeAddClassModal;
window.handleAddClass = handleAddClass;
window.refreshClassesList = refreshClassesList;
window.editClass = editClass;
window.deleteClass = deleteClass;
window.assignTeacherToClass = assignTeacherToClass;
window.closeEditClassModal = closeEditClassModal;
window.saveClassChanges = saveClassChanges;
window.renderClassManagement = renderClassManagement;
window.loadAllClasses = loadAllClasses;
window.loadAvailableTeachers = loadAvailableTeachers;
window.loadSubjectAssignmentsForClass = loadSubjectAssignmentsForClass;
window.assignClassTeacher = assignClassTeacher;
window.getSchoolSubjects = getSchoolSubjects;
window.escapeHtml = escapeHtml;
window.toggleClassDetails = toggleClassDetails;
window.openSubjectAssignmentModal = openSubjectAssignmentModal;
window.closeSubjectAssignmentModal = closeSubjectAssignmentModal;
window.saveSubjectAssignment = saveSubjectAssignment;
window.removeSubjectAssignment = removeSubjectAssignment;
window.renderSubjectTeachers = renderSubjectTeachers;
