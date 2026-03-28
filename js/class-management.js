// class-management.js - Complete with subject teacher assignment

// ============ LOAD FUNCTIONS ============

async function loadAllClasses() {
    try {
        const response = await api.admin.getClasses();
        return response.data || [];
    } catch (error) {
        console.error('Failed to load classes:', error);
        showToast('Failed to load classes', 'error');
        return [];
    }
}

async function loadAvailableTeachers() {
    try {
        const response = await api.admin.getAvailableTeachers();
        return response.data || [];
    } catch (error) {
        console.error('Failed to load teachers:', error);
        return [];
    }
}

async function loadSubjectAssignmentsForClass(classId) {
    try {
        const response = await api.admin.getClassSubjectAssignments(classId);
        return response.data || [];
    } catch (error) {
        console.error('Failed to load subject assignments:', error);
        return [];
    }
}

async function getAllSubjects() {
    const curriculum = window.schoolSettings?.curriculum || 'cbc';
    const schoolLevel = window.schoolSettings?.schoolLevel || 'secondary';

    const subjectsByCurriculum = {
        'cbc': {
            primary: ['Mathematics', 'English', 'Kiswahili', 'Science', 'Social Studies', 'CRE/IRE', 'Physical Education', 'Art & Craft', 'Music'],
            secondary: ['Mathematics', 'English', 'Kiswahili', 'Biology', 'Chemistry', 'Physics', 'History', 'Geography', 'CRE/IRE', 'Business Studies', 'Agriculture', 'Computer Studies']
        },
        '844': {
            primary: ['Mathematics', 'English', 'Kiswahili', 'Science', 'Social Studies', 'CRE/IRE', 'Physical Education'],
            secondary: ['Mathematics', 'English', 'Kiswahili', 'Biology', 'Chemistry', 'Physics', 'History', 'Geography', 'CRE/IRE', 'Business Studies', 'Agriculture', 'Computer Studies']
        },
        'british': {
            primary: ['English', 'Mathematics', 'Science', 'History', 'Geography', 'Art', 'Music', 'Physical Education'],
            secondary: ['English Literature', 'English Language', 'Mathematics', 'Biology', 'Chemistry', 'Physics', 'History', 'Geography', 'French', 'Spanish', 'Computer Science', 'Business Studies', 'Economics', 'Art & Design', 'Music', 'Physical Education']
        },
        'american': {
            primary: ['English Language Arts', 'Mathematics', 'Science', 'Social Studies', 'Art', 'Music', 'Physical Education'],
            secondary: ['English', 'Mathematics', 'Biology', 'Chemistry', 'Physics', 'History', 'Geography', 'Spanish', 'French', 'Computer Science', 'Business', 'Economics', 'Art', 'Music', 'Physical Education']
        }
    };

    const level = schoolLevel === 'primary' ? 'primary' : 'secondary';
    const subjects = subjectsByCurriculum[curriculum]?.[level] || subjectsByCurriculum['cbc'][level];
    const customSubjects = window.schoolSettings?.customSubjects || [];

    return [...subjects, ...customSubjects];
}

// ============ RENDER CLASS MANAGEMENT PAGE ============

async function renderClassManagement() {
    try {
        const [classes, teachers, allSubjects] = await Promise.all([
            loadAllClasses(),
            loadAvailableTeachers(),
            getAllSubjects()
        ]);

        if (!classes || classes.length === 0) {
            return `
                <div class="space-y-6">
                    <div class="flex justify-between items-center">
                        <h2 class="text-2xl font-bold">Class Management</h2>
                        <div class="flex gap-3">
                            <button onclick="showAddClassModal()" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                                <i data-lucide="plus" class="h-4 w-4 inline mr-2"></i>
                                Add Class
                            </button>
                            <button onclick="autoGenerateClassesOnCurriculumChange()" class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">
                                <i data-lucide="wand-2" class="h-4 w-4 inline mr-2"></i>
                                Generate Classes
                            </button>
                        </div>
                    </div>
                    <div class="text-center py-12 border rounded-lg bg-card">
                        <i data-lucide="school" class="h-12 w-12 mx-auto text-muted-foreground mb-4"></i>
                        <p class="text-muted-foreground">No classes found. Click "Generate Classes" to create them based on your curriculum.</p>
                    </div>
                </div>
            `;
        }

        // Sort classes by grade order
        const gradeOrder = ['PP1', 'PP2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];
        const sortedClasses = [...classes].sort((a, b) => {
            const indexA = gradeOrder.indexOf(a.grade);
            const indexB = gradeOrder.indexOf(b.grade);
            return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
        });

        let html = `
            <div class="space-y-6">
                <div class="flex justify-between items-center">
                    <div>
                        <h2 class="text-2xl font-bold">Class Management</h2>
                        <p class="text-sm text-muted-foreground">${classes.length} total classes</p>
                    </div>
                    <div class="flex gap-3">
                        <button onclick="showAddClassModal()" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                            <i data-lucide="plus" class="h-4 w-4 inline mr-2"></i>
                            Add Class
                        </button>
                        <button onclick="autoGenerateClassesOnCurriculumChange()" class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">
                            <i data-lucide="wand-2" class="h-4 w-4 inline mr-2"></i>
                            Generate Classes
                        </button>
                    </div>
                </div>

                <div class="border rounded-lg overflow-hidden">
                    <table class="w-full text-sm">
                        <thead class="bg-muted/50">
                            <tr>
                                <th class="px-4 py-3 text-left font-medium">Class</th>
                                <th class="px-4 py-3 text-left font-medium">Grade</th>
                                <th class="px-4 py-3 text-left font-medium">Class Teacher</th>
                                <th class="px-4 py-3 text-left font-medium">Students</th>
                                <th class="px-4 py-3 text-right font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y">
        `;

        for (const cls of sortedClasses) {
            const currentTeacher = cls.Teacher?.User?.name || 'Not assigned';
            const hasTeacher = cls.Teacher !== null;

            html += `
                <tr class="hover:bg-accent/50 transition-colors">
                    <td class="px-4 py-3 font-medium">${escapeHtml(cls.name)}</td>
                    <td class="px-4 py-3">${escapeHtml(cls.grade)}</td>
                    <td class="px-4 py-3">
                        <select id="teacher-${cls.id}" class="rounded border px-2 py-1 text-sm">
                            <option value="">-- Select Class Teacher --</option>
                            ${teachers.map(t => `
                                <option value="${t.id}" ${t.id === cls.teacherId ? 'selected' : ''}>
                                    ${escapeHtml(t.User?.name || 'Unknown')} (${t.subjects?.join(', ') || 'No subjects'})
                                </option>
                            `).join('')}
                        </select>
                        <button onclick="assignClassTeacher(${cls.id})" class="ml-2 text-primary hover:underline text-sm">Save</button>
                        <span class="ml-2 text-xs ${hasTeacher ? 'text-green-600' : 'text-yellow-600'}">${currentTeacher}</span>
                    </td>
                    <td class="px-4 py-3">${cls.studentCount || 0}</td>
                    <td class="px-4 py-3 text-right">
                        <button onclick="toggleClassDetails(${cls.id})" class="p-1 hover:bg-accent rounded" title="Subject Teachers">
                            <i data-lucide="users" class="h-4 w-4"></i>
                        </button>
                        <button onclick="openSubjectAssignmentModal(${cls.id}, '${escapeHtml(cls.name)}')" class="p-1 hover:bg-accent rounded" title="Assign Subjects">
                            <i data-lucide="book-open" class="h-4 w-4"></i>
                        </button>
                        <button onclick="editClass(${cls.id})" class="p-1 hover:bg-accent rounded" title="Edit Class">
                            <i data-lucide="edit" class="h-4 w-4"></i>
                        </button>
                        <button onclick="deleteClass(${cls.id})" class="p-1 hover:bg-red-100 rounded text-red-600" title="Delete Class">
                            <i data-lucide="trash-2" class="h-4 w-4"></i>
                        </button>
                    </td>
                </tr>
                <tr id="class-details-${cls.id}" class="hidden bg-muted/20">
                    <td colspan="5" class="px-4 py-3">
                        <div class="p-4">
                            <div class="flex justify-between items-center mb-3">
                                <h4 class="font-medium">Subject Teachers</h4>
                                <button onclick="openSubjectAssignmentModal(${cls.id}, '${escapeHtml(cls.name)}')" class="text-sm text-primary hover:underline flex items-center gap-1">
                                    <i data-lucide="plus-circle" class="h-4 w-4"></i>
                                    Assign Subjects
                                </button>
                            </div>
                            <div id="subject-assignments-${cls.id}" class="space-y-2">
                                <div class="text-sm text-muted-foreground text-center py-4 bg-muted/20 rounded">
                                    <i data-lucide="loader-2" class="h-4 w-4 animate-spin inline mr-2"></i>
                                    Loading subject teachers...
                                </div>
                            </div>
                        </div>
                    </td>
                </tr>
            `;
        }

        html += `
                        </tbody>
                    </table>
                </div>
            </div>

            <script>
                function toggleClassDetails(classId) {
                    const row = document.getElementById('class-details-' + classId);
                    if (row) row.classList.toggle('hidden');
                }
            </script>
        `;

        // Load subject assignments for each class
        setTimeout(async () => {
            for (const cls of classes) {
                await loadAndDisplaySubjectAssignments(cls.id);
            }
        }, 100);

        return html;

    } catch (error) {
        console.error('Error rendering class management:', error);
        return `<div class="text-center py-12 text-red-500">Error loading class management: ${error.message}</div>`;
    }
}

async function loadAndDisplaySubjectAssignments(classId) {
    const container = document.getElementById(`subject-assignments-${classId}`);
    if (!container) return;

    try {
        const assignments = await loadSubjectAssignmentsForClass(classId);

        if (!assignments || assignments.length === 0) {
            container.innerHTML = `
                <div class="text-sm text-muted-foreground text-center py-4 bg-muted/20 rounded">
                    <i data-lucide="info" class="h-4 w-4 inline mr-2"></i>
                    No subject teachers assigned yet. Click "Assign Subjects" to add teachers.
                </div>
            `;
            if (typeof lucide !== 'undefined') lucide.createIcons();
            return;
        }

        container.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                ${assignments.map(ass => `
                    <div class="flex justify-between items-center p-3 bg-card border rounded-lg shadow-sm">
                        <div>
                            <span class="font-medium text-sm">📚 ${escapeHtml(ass.subject)}</span>
                            <div class="flex items-center gap-2 mt-1">
                                <span class="text-xs text-muted-foreground">Teacher:</span>
                                <span class="text-xs font-medium text-primary">${escapeHtml(ass.teacherName)}</span>
                            </div>
                        </div>
                        <button onclick="removeSubjectAssignment(${ass.id}, ${classId})" 
                                class="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                                title="Remove teacher from this subject">
                            <i data-lucide="x" class="h-4 w-4"></i>
                        </button>
                    </div>
                `).join('')}
            </div>
        `;

        if (typeof lucide !== 'undefined') lucide.createIcons();

    } catch (error) {
        console.error('Error loading subject assignments:', error);
        container.innerHTML = `
            <div class="text-sm text-red-500 text-center py-4 bg-red-50 rounded">
                <i data-lucide="alert-circle" class="h-4 w-4 inline mr-2"></i>
                Error loading subject assignments. Please try again.
            </div>
        `;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
}

// ============ SUBJECT ASSIGNMENT MODAL ============

async function openSubjectAssignmentModal(classId, className) {
    showLoading();
    try {
        const [teachers, existingAssignments, allSubjects] = await Promise.all([
            loadAvailableTeachers(),
            loadSubjectAssignmentsForClass(classId),
            getAllSubjects()
        ]);

        // Create a map of existing assignments for quick lookup
        const existingMap = {};
        existingAssignments.forEach(a => {
            existingMap[a.subject] = a;
        });

        let modal = document.getElementById('subject-assignment-modal');
        if (!modal) {
            createSubjectAssignmentModal();
            modal = document.getElementById('subject-assignment-modal');
        }

        const modalContent = modal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.innerHTML = `
                <div class="space-y-4">
                    <div class="border-b pb-3 flex justify-between items-center">
                        <div>
                            <h3 class="text-lg font-semibold">Assign Subject Teachers</h3>
                            <p class="text-sm text-muted-foreground">Class: ${escapeHtml(className)}</p>
                        </div>
                        <button onclick="closeSubjectAssignmentModal()" class="p-2 hover:bg-accent rounded-lg">
                            <i data-lucide="x" class="h-5 w-5"></i>
                        </button>
                    </div>

                    <div class="overflow-x-auto max-h-[60vh] overflow-y-auto">
                        <table class="w-full text-sm">
                            <thead class="bg-muted/50 sticky top-0">
                                <tr>
                                    <th class="px-4 py-3 text-left font-medium">Subject</th>
                                    <th class="px-4 py-3 text-left font-medium">Teacher</th>
                                    <th class="px-4 py-3 text-center font-medium">Action</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y">
                                ${allSubjects.map(subject => {
                                    const existing = existingMap[subject];
                                    const teachersWithSubject = teachers.filter(t => 
                                        t.subjects?.includes(subject) || 
                                        t.subjects?.includes('All') ||
                                        !existing
                                    );
                                    return `
                                        <tr class="hover:bg-accent/50 transition-colors">
                                            <td class="px-4 py-3 font-medium">
                                                <div class="flex items-center gap-2">
                                                    <i data-lucide="book" class="h-4 w-4 text-muted-foreground"></i>
                                                    ${escapeHtml(subject)}
                                                </div>
                                            </td>
                                            <td class="px-4 py-3">
                                                <select id="subject-teacher-${subject.replace(/\s/g, '_')}" 
                                                        class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary">
                                                    <option value="">-- Select Teacher --</option>
                                                    ${teachers.map(t => `
                                                        <option value="${t.id}" ${existing?.teacherId === t.id ? 'selected' : ''}>
                                                            ${escapeHtml(t.User?.name || 'Unknown')} 
                                                            ${t.subjects?.length ? `(${t.subjects.join(', ')})` : '(No subjects)'}
                                                        </option>
                                                    `).join('')}
                                                </select>
                                            </td>
                                            <td class="px-4 py-3 text-center">
                                                <button onclick="saveSubjectAssignment(${classId}, '${subject.replace(/'/g, "\\'")}')" 
                                                        class="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90 transition-colors flex items-center gap-2 mx-auto">
                                                    <i data-lucide="${existing ? 'refresh-cw' : 'save'}" class="h-4 w-4"></i>
                                                    ${existing ? 'Update' : 'Assign'}
                                                </button>
                                                ${existing ? `
                                                    <button onclick="removeSubjectAssignment(${existing.id}, ${classId})" 
                                                            class="mt-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200 transition-colors flex items-center gap-2 mx-auto">
                                                        <i data-lucide="trash-2" class="h-4 w-4"></i>
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

                    <div class="flex justify-end gap-2 pt-4 border-t">
                        <button onclick="closeSubjectAssignmentModal()" class="px-4 py-2 border rounded-lg hover:bg-accent transition-colors">
                            Close
                        </button>
                    </div>
                </div>
            `;
        }

        modal.classList.remove('hidden');
        if (typeof lucide !== 'undefined') lucide.createIcons();

    } catch (error) {
        console.error('Error opening subject assignment modal:', error);
        showToast('Failed to load subject assignment data', 'error');
    } finally {
        hideLoading();
    }
}

function createSubjectAssignmentModal() {
    const modalHTML = `
        <div id="subject-assignment-modal" class="fixed inset-0 z-50 hidden">
            <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" onclick="closeSubjectAssignmentModal()"></div>
            <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl p-4">
                <div class="rounded-xl border bg-card shadow-2xl animate-fade-in max-h-[85vh] overflow-hidden flex flex-col">
                    <div class="modal-content p-6 overflow-y-auto">
                        <!-- Content filled dynamically -->
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeSubjectAssignmentModal() {
    const modal = document.getElementById('subject-assignment-modal');
    if (modal) modal.classList.add('hidden');
}

// ============ SUBJECT ASSIGNMENT ACTIONS ============

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
            showToast(`✅ ${subject} assigned to teacher successfully`, 'success');
            closeSubjectAssignmentModal();
            await showDashboardSection('classes');
        } else {
            throw new Error(response.message || 'Assignment failed');
        }
    } catch (error) {
        console.error('Error assigning subject:', error);
        showToast(error.message || 'Failed to assign teacher to subject', 'error');
    } finally {
        hideLoading();
    }
}

async function removeSubjectAssignment(assignmentId, classId) {
    if (!confirm('Remove this teacher from this subject? This action can be undone later.')) return;

    showLoading();
    try {
        const response = await api.admin.removeSubjectAssignment(assignmentId);
        if (response.success) {
            showToast('✅ Teacher removed from subject', 'success');
            await showDashboardSection('classes');
        }
    } catch (error) {
        console.error('Error removing subject assignment:', error);
        showToast(error.message || 'Failed to remove teacher from subject', 'error');
    } finally {
        hideLoading();
    }
}

// ============ CLASS ACTIONS ============

async function showAddClassModal() {
    const className = prompt('Enter class name (e.g., Form 3A, Grade 10):');
    if (!className) return;

    const grade = prompt('Enter grade/level (e.g., Form 3, Grade 10):');
    if (!grade) return;

    const stream = prompt('Enter stream (optional, e.g., A, B, Science):', '');

    showLoading();
    try {
        const response = await api.admin.createClass({ name: className, grade, stream });
        if (response.success) {
            showToast('✅ Class created successfully', 'success');
            await showDashboardSection('classes');
        }
    } catch (error) {
        showToast(error.message || 'Failed to create class', 'error');
    } finally {
        hideLoading();
    }
}

async function editClass(classId) {
    const classes = await loadAllClasses();
    const classData = classes.find(c => c.id == classId);

    if (!classData) {
        showToast('Class not found', 'error');
        return;
    }

    const newName = prompt('Enter new class name:', classData.name);
    if (!newName) return;

    const newGrade = prompt('Enter new grade:', classData.grade);
    if (!newGrade) return;

    const newStream = prompt('Enter new stream:', classData.stream || '');

    showLoading();
    try {
        const response = await api.admin.updateClass(classId, {
            name: newName,
            grade: newGrade,
            stream: newStream
        });
        if (response.success) {
            showToast('✅ Class updated successfully', 'success');
            await showDashboardSection('classes');
        }
    } catch (error) {
        showToast(error.message || 'Failed to update class', 'error');
    } finally {
        hideLoading();
    }
}

async function deleteClass(classId) {
    if (!confirm('⚠️ Are you sure you want to delete this class? This will remove all student associations.')) return;

    showLoading();
    try {
        const response = await api.admin.deleteClass(classId);
        if (response.success) {
            showToast('✅ Class deleted successfully', 'success');
            await showDashboardSection('classes');
        }
    } catch (error) {
        showToast(error.message || 'Failed to delete class', 'error');
    } finally {
        hideLoading();
    }
}

async function assignClassTeacher(classId) {
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
            showToast('✅ Class teacher assigned successfully', 'success');
            await showDashboardSection('classes');
        }
    } catch (error) {
        showToast(error.message || 'Failed to assign teacher', 'error');
    } finally {
        hideLoading();
    }
}

// ============ HELPER FUNCTIONS ============

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============ EXPORT FUNCTIONS ============

window.renderClassManagement = renderClassManagement;
window.loadAllClasses = loadAllClasses;
window.loadAvailableTeachers = loadAvailableTeachers;
window.loadSubjectAssignmentsForClass = loadSubjectAssignmentsForClass;
window.showAddClassModal = showAddClassModal;
window.editClass = editClass;
window.deleteClass = deleteClass;
window.assignClassTeacher = assignClassTeacher;
window.openSubjectAssignmentModal = openSubjectAssignmentModal;
window.closeSubjectAssignmentModal = closeSubjectAssignmentModal;
window.saveSubjectAssignment = saveSubjectAssignment;
window.removeSubjectAssignment = removeSubjectAssignment;
window.getAllSubjects = getAllSubjects;
window.escapeHtml = escapeHtml;
window.toggleClassDetails = function(classId) {
    const row = document.getElementById('class-details-' + classId);
    if (row) row.classList.toggle('hidden');
};
