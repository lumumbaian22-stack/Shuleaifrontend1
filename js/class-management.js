// class-management.js - COMPLETE WORKING VERSION

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

async function getSchoolSubjects() {
    const curriculum = window.schoolSettings?.curriculum || 'cbc';
    const schoolLevel = window.schoolSettings?.schoolLevel || 'both';

    // ✅ FIX: Read custom subjects from nested settings
    const customSubjects = window.schoolSettings?.settings?.customSubjects || window.customSubjects || [];

    const subjectsByCurriculum = {
        'cbc': {
            pre_primary: ['Language Activities', 'Mathematics Activities', 'Environmental Activities', 'Psychomotor and Creative Activities', 'Religious Education'],
            primary: ['Mathematics', 'English', 'Kiswahili', 'Science and Technology', 'Agriculture and Nutrition', 'Creative Arts', 'Social Studies', 'Religious Education', 'Physical and Health Education'],
            junior_secondary: ['English', 'Kiswahili', 'Mathematics', 'Integrated Science', 'Health Education', 'Social Studies', 'Pre-Technical and Pre-Career Education', 'Agriculture', 'Business Studies', 'Religious Education', 'Life Skills Education', 'Sports and Physical Education', 'Visual Arts', 'Performing Arts'],
            senior_secondary: ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'Aviation Technology', 'Agriculture', 'Music', 'Fine Arts', 'Performing Arts', 'Media Studies', 'Physical Education', 'Creative Writing', 'History', 'Geography', 'English Literature', 'Religious Education', 'Business Studies', 'Sociology', 'Philosophy', 'Foreign Languages']
        },
        '844': {
            primary: ['Mathematics', 'English', 'Kiswahili', 'Science', 'Social Studies', 'Religious Education', 'Physical Education'],
            secondary: ['Mathematics', 'English', 'Kiswahili', 'Biology', 'Chemistry', 'Physics', 'History', 'Geography', 'Religious Education', 'Business Studies', 'Agriculture', 'Computer Studies']
        },
        'british': {
            primary: ['English', 'Mathematics', 'Science', 'History', 'Geography', 'Art', 'Music', 'Physical Education', 'Computing'],
            secondary: ['English Literature', 'English Language', 'Mathematics', 'Biology', 'Chemistry', 'Physics', 'History', 'Geography', 'French', 'Spanish', 'Computer Science', 'Business Studies', 'Economics', 'Psychology', 'Sociology', 'Art', 'Music']
        },
        'american': {
            elementary: ['English Language Arts', 'Mathematics', 'Science', 'Social Studies', 'Art', 'Music', 'Physical Education'],
            middle: ['English', 'Mathematics', 'Science', 'Social Studies', 'Spanish', 'French', 'Computer Science', 'Art', 'Music', 'Physical Education'],
            high: ['English', 'Mathematics', 'Biology', 'Chemistry', 'Physics', 'History', 'Government', 'Economics', 'Spanish', 'French', 'Computer Science', 'Business', 'Art', 'Music', 'Physical Education', 'Psychology', 'Sociology']
        }
    };

    let subjects = [];
    const level = schoolLevel;

    if (curriculum === 'cbc') {
        if (level === 'primary') {
            subjects = subjectsByCurriculum.cbc.primary;
        } else if (level === 'secondary') {
            subjects = [...subjectsByCurriculum.cbc.junior_secondary, ...subjectsByCurriculum.cbc.senior_secondary];
        } else if (level === 'both') {
            subjects = [...subjectsByCurriculum.cbc.primary, ...subjectsByCurriculum.cbc.junior_secondary, ...subjectsByCurriculum.cbc.senior_secondary];
        }
    } else if (curriculum === '844') {
        if (level === 'primary') {
            subjects = subjectsByCurriculum['844'].primary;
        } else if (level === 'secondary') {
            subjects = subjectsByCurriculum['844'].secondary;
        } else if (level === 'both') {
            subjects = [...subjectsByCurriculum['844'].primary, ...subjectsByCurriculum['844'].secondary];
        }
    } else if (curriculum === 'british') {
        if (level === 'primary') {
            subjects = subjectsByCurriculum.british.primary;
        } else if (level === 'secondary') {
            subjects = subjectsByCurriculum.british.secondary;
        } else if (level === 'both') {
            subjects = [...subjectsByCurriculum.british.primary, ...subjectsByCurriculum.british.secondary];
        }
    } else if (curriculum === 'american') {
        if (level === 'primary') {
            subjects = subjectsByCurriculum.american.elementary;
        } else if (level === 'secondary') {
            subjects = [...subjectsByCurriculum.american.middle, ...subjectsByCurriculum.american.high];
        } else if (level === 'both') {
            subjects = [...subjectsByCurriculum.american.elementary, ...subjectsByCurriculum.american.middle, ...subjectsByCurriculum.american.high];
        }
    }

    // Merge and deduplicate
    const allSubjects = [...new Set([...subjects, ...customSubjects])];
    return allSubjects;
}

function getGradeLevel(gradeName) {
    const primaryKeywords = ['PP1', 'PP2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Standard', 'Primary'];
    const secondaryKeywords = ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12', 'Form', 'Secondary', 'High School'];
    
    const lower = gradeName.toLowerCase();
    if (primaryKeywords.some(k => lower.includes(k.toLowerCase()))) {
        return 'primary';
    }
    if (secondaryKeywords.some(k => lower.includes(k.toLowerCase()))) {
        return 'secondary';
    }
    return window.schoolSettings?.schoolLevel || 'both';
}

// ============ RENDER CLASS MANAGEMENT PAGE ============

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
                    <button onclick="window.removeSubjectAssignment('${st.id}', ${cls.id})" 
                            class="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                            title="Remove teacher from this subject">
                        <i data-lucide="x" class="h-4 w-4"></i>
                    </button>
                </div>
            `).join('')}
        </div>
    `;
}

function renderClassesList(classes, teachers) {
    if (!classes || classes.length === 0) {
        return `
            <div class="text-center py-12 border rounded-lg bg-card">
                <i data-lucide="users" class="h-12 w-12 mx-auto text-muted-foreground mb-4"></i>
                <p class="text-muted-foreground">No classes found. Click "Add New Class" to create one.</p>
            </div>
        `;
    }
    
    const gradeOrder = ['PP1', 'PP2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];
    const sortedClasses = [...classes].sort((a, b) => {
        const indexA = gradeOrder.indexOf(a.grade);
        const indexB = gradeOrder.indexOf(b.grade);
        return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
    });
    
    return sortedClasses.map(cls => {
        const teacher = teachers.find(t => t.id === cls.teacherId);
        const currentTeacher = teacher ? teacher.User?.name : 'Not assigned';
        const teacherOptions = teachers.map(t => `
            <option value="${t.id}" ${t.id === cls.teacherId ? 'selected' : ''}>
                ${t.User?.name || 'Unknown'} (${t.subjects?.join(', ') || 'No subjects'})
            </option>
        `).join('');
        
        const subjectTeachers = cls.subjectTeachers || [];
        
        return `
            <div class="border rounded-lg p-4 bg-card hover:shadow-md transition-shadow mb-4" data-class-id="${cls.id}">
                <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div class="flex-1">
                        <h3 class="font-semibold text-lg">${escapeHtml(cls.name)}</h3>
                        <p class="text-sm text-muted-foreground">Grade: ${escapeHtml(cls.grade)} | Stream: ${escapeHtml(cls.stream || 'N/A')}</p>
                        <p class="text-sm mt-2">
                            <span class="font-medium">Current Teacher:</span> 
                            <span class="${teacher ? 'text-green-600' : 'text-yellow-600'}">${escapeHtml(currentTeacher)}</span>
                        </p>
                        <p class="text-xs text-muted-foreground mt-1">${cls.studentCount || 0} students enrolled</p>
                        
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
                        <button onclick="window.assignClassTeacher(${cls.id})" 
                                class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 text-sm whitespace-nowrap">
                            Assign
                        </button>
                        <button onclick="window.toggleClassDetails(${cls.id})" 
                                class="p-2 border rounded-lg hover:bg-accent" title="View Subject Teachers">
                            <i data-lucide="users" class="h-4 w-4"></i>
                        </button>
                        <button onclick="window.openSubjectAssignmentModal(${cls.id}, '${escapeHtml(cls.name)}')" 
                                class="p-2 border rounded-lg hover:bg-accent" title="Assign Subjects">
                            <i data-lucide="book-open" class="h-4 w-4"></i>
                        </button>
                        <button onclick="window.editClass(${cls.id})" 
                                class="p-2 border rounded-lg hover:bg-accent">
                            <i data-lucide="edit" class="h-4 w-4"></i>
                        </button>
                        <button onclick="window.deleteClass(${cls.id})" 
                                class="p-2 border rounded-lg hover:bg-red-100 text-red-600">
                            <i data-lucide="trash-2" class="h-4 w-4"></i>
                        </button>
                    </div>
                </div>
                
                <div id="class-details-${cls.id}" class="hidden mt-4 pt-4 border-t">
                    <div class="flex justify-between items-center mb-3">
                        <h4 class="font-medium">Subject Teachers</h4>
                        <button onclick="window.openSubjectAssignmentModal(${cls.id}, '${escapeHtml(cls.name)}')" 
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

async function renderClassManagement() {
    await loadSchoolSettings();
    try {
        const [classes, teachers] = await Promise.all([
            loadAllClasses(),
            loadAvailableTeachers()
        ]);

        if (!classes || classes.length === 0) {
            return `
                <div class="space-y-6">
                    <div class="flex justify-between items-center">
                        <h2 class="text-2xl font-bold">Class Management</h2>
                        <div class="flex gap-3">
                            <button onclick="window.showAddClassModal()" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600">
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

        return `
            <div class="space-y-6">
                <div class="flex justify-between items-center">
                    <div>
                        <h2 class="text-2xl font-bold">Class Management</h2>
                        <p class="text-sm text-muted-foreground">${classes.length} total classes</p>
                    </div>
                    <div class="flex gap-3">
                        <button onclick="window.showAddClassModal()" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600">
                            <i data-lucide="plus" class="h-4 w-4 inline mr-2"></i>
                            Add Class
                        </button>
                        <button onclick="autoGenerateClassesOnCurriculumChange()" class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">
                            <i data-lucide="wand-2" class="h-4 w-4 inline mr-2"></i>
                            Generate Classes
                        </button>
                    </div>
                </div>
                <div id="classes-list-container">
                    ${renderClassesList(classes, teachers)}
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error rendering class management:', error);
        return `<div class="text-center py-12 text-red-500">Error loading class management: ${error.message}</div>`;
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
            await refreshClassesList();
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
            await refreshClassesList();
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
            await refreshClassesList();
            await showDashboardSection('classes');
        }
    } catch (error) {
        showToast(error.message || 'Failed to delete class', 'error');
    } finally {
        hideLoading();
    }
}

// Replace your assignClassTeacher function with this debug version
async function assignClassTeacher(classId) {
    const select = document.getElementById(`teacher-${classId}`);
    const teacherId = select?.value;
    const teacherName = select?.options[select.selectedIndex]?.text || 'Unknown';

    if (!teacherId) {
        showToast('Please select a teacher', 'error');
        console.log('❌ No teacher selected for class:', classId);
        return;
    }

    console.log('📤 Assigning teacher to class:', {
        classId: classId,
        teacherId: teacherId,
        teacherName: teacherName,
        timestamp: new Date().toISOString()
    });

    showLoading();
    try {
        const response = await api.admin.assignTeacherToClass(classId, teacherId);
        
        console.log('📥 API Response:', response);
        
        if (response && response.success) {
            showToast(`✅ Class teacher assigned successfully to ${teacherName}`, 'success');
            
            // Verify the assignment by fetching the class again
            const updatedClass = await api.admin.getClassDetails(classId);
            console.log('🔍 Verified class after assignment:', updatedClass);
            
            if (updatedClass.data && updatedClass.data.teacherId === parseInt(teacherId)) {
                console.log('✅ Assignment verified in database! Teacher ID:', updatedClass.data.teacherId);
                showToast(`✅ Verified: ${teacherName} is now the class teacher`, 'success', 5000);
            } else {
                console.warn('⚠️ Assignment may not have persisted. Expected teacher:', teacherId, 'Got:', updatedClass.data?.teacherId);
            }
            
            // Refresh the UI
            await refreshClassesList();
            await showDashboardSection('classes');
            
            // Also refresh teacher's dashboard if they are the assigned teacher
            const currentUser = getCurrentUser();
            if (currentUser && currentUser.id == teacherId) {
                console.log('🔄 Current user is the assigned teacher, refreshing their dashboard');
                if (typeof showDashboardSection === 'function') {
                    await showDashboardSection('dashboard');
                }
            }
            
            return response;
        } else {
            throw new Error(response?.message || 'Assignment failed - no success flag');
        }
    } catch (error) {
        console.error('❌ Error assigning teacher:', {
            error: error.message,
            stack: error.stack,
            classId: classId,
            teacherId: teacherId
        });
        showToast(error.message || 'Failed to assign teacher', 'error');
    } finally {
        hideLoading();
    }
}

// Add this function to debug teacher assignments
async function checkTeacherAssignment(teacherId) {
    console.log('🔍 Checking teacher assignment for teacher ID:', teacherId);
    
    showLoading();
    try {
        // Get teacher details
        const teacherResponse = await api.admin.getTeachers();
        const teacher = teacherResponse.data?.find(t => t.id == teacherId);
        
        if (teacher) {
            console.log('👤 Teacher found:', {
                id: teacher.id,
                name: teacher.User?.name,
                email: teacher.User?.email,
                assignedClassId: teacher.classId,
                assignedClass: teacher.Class?.name
            });
            
            if (teacher.classId) {
                // Get class details
                const classResponse = await api.admin.getClassDetails(teacher.classId);
                console.log('📚 Assigned class details:', classResponse.data);
                
                showToast(`✅ Teacher ${teacher.User?.name} is assigned to class: ${classResponse.data?.name || 'Unknown'}`, 'success');
            } else {
                console.warn('⚠️ Teacher has no class assigned');
                showToast(`⚠️ Teacher ${teacher.User?.name} has no class assigned`, 'warning');
            }
        } else {
            console.error('❌ Teacher not found with ID:', teacherId);
            showToast('Teacher not found', 'error');
        }
    } catch (error) {
        console.error('Error checking teacher assignment:', error);
        showToast('Failed to check teacher assignment', 'error');
    } finally {
        hideLoading();
    }
}

// Add this to debug all teachers in the school
async function listAllTeachersAndClasses() {
    console.log('📊 Fetching all teachers and their class assignments...');
    
    showLoading();
    try {
        const response = await api.admin.getTeachers();
        const teachers = response.data || [];
        
        console.log('=' .repeat(60));
        console.log('TEACHER ASSIGNMENTS REPORT');
        console.log('=' .repeat(60));
        
        teachers.forEach(teacher => {
            const userName = teacher.User?.name || 'Unknown';
            const classId = teacher.classId;
            const className = teacher.Class?.name || (classId ? 'Class ID: ' + classId : 'Not assigned');
            
            console.log(`📌 ${userName}:`);
            console.log(`   - Teacher ID: ${teacher.id}`);
            console.log(`   - Email: ${teacher.User?.email}`);
            console.log(`   - Class: ${className}`);
            console.log(`   - Status: ${teacher.isActive ? 'Active' : 'Inactive'}`);
            console.log('-'.repeat(40));
        });
        
        console.log('=' .repeat(60));
        
        showToast(`Found ${teachers.length} teachers. Check console for details.`, 'info');
    } catch (error) {
        console.error('Error listing teachers:', error);
        showToast('Failed to fetch teacher list', 'error');
    } finally {
        hideLoading();
    }
}



// ============ SUBJECT ASSIGNMENT ============

async function openSubjectAssignmentModal(classId, className) {
    showLoading();
    try {
        const [teachers, existingAssignments, allSubjects] = await Promise.all([
            loadAvailableTeachers(),
            loadSubjectAssignmentsForClass(classId),
            getSchoolSubjects()  // returns all subjects (core + custom)
        ]);

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
                            <p class="text-xs text-muted-foreground mt-1">All school subjects are listed below. Assign teachers to subjects your class offers.</p>
                        </div>
                        <button onclick="closeSubjectAssignmentModal()" class="p-2 hover:bg-accent rounded-lg">
                            <i data-lucide="x" class="h-5 w-5"></i>
                        </button>
                    </div>

                    <div class="overflow-x-auto max-h-[60vh] overflow-y-auto border rounded-lg">
                        <table class="w-full text-sm">
                            <thead class="bg-muted/50 sticky top-0">
                                <tr>
                                    <th class="px-4 py-3 text-left font-medium border-b">Subject</th>
                                    <th class="px-4 py-3 text-left font-medium border-b">Teacher</th>
                                    <th class="px-4 py-3 text-center font-medium border-b">Action</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y">
                                ${allSubjects.map(subject => {
                                    const existing = existingMap[subject];
                                    return `
                                        <tr class="hover:bg-accent/50 transition-colors">
                                            <td class="px-4 py-3 font-medium border-r">${escapeHtml(subject)}</td>
                                            <td class="px-4 py-3">
                                                <select id="subject-teacher-${subject.replace(/\s/g, '_')}" 
                                                        class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary">
                                                    <option value="">-- Select Teacher --</option>
                                                    ${teachers.map(t => `
                                                        <option value="${t.id}" ${existing?.teacherId === t.id ? 'selected' : ''}>
                                                            ${escapeHtml(t.User?.name || 'Unknown')} 
                                                            ${t.subjects?.length ? `(${t.subjects.join(', ')})` : ''}
                                                        </option>
                                                    `).join('')}
                                                </select>
                                            </td>
                                            <td class="px-4 py-3 text-center">
                                                <button onclick="saveSubjectAssignment(${classId}, '${subject.replace(/'/g, "\\'")}')"
                                                        class="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 transition-colors">
                                                    ${existing ? 'Update' : 'Assign'}
                                                </button>
                                                ${existing ? `
                                                    <button onclick="removeSubjectAssignment('${existing.id}', ${classId})" 
                                                            class="ml-2 px-4 py-2 bg-red-100 text-red-700 rounded-md text-sm hover:bg-red-200 transition-colors">
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

                    <div class="flex gap-2 pt-4 border-t">
                        <button onclick="closeSubjectAssignmentModal()" class="px-4 py-2 border rounded-lg hover:bg-accent">Close</button>
                        <button onclick="saveAllSubjectAssignments(${classId})" class="mt-4 w-full bg-primary text-white py-2 rounded-lg">Save All Assignments</button>
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
                <div class="rounded-xl border bg-card shadow-2xl animate-fade-in max-h-[85vh] overflow-hidden flex flex-col dark:bg-gray-900">
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
            await refreshClassesList();
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

async function saveAllSubjectAssignments(classId) {
  const modal = document.getElementById('subject-assignment-modal');
  if (!modal) return;

  const selects = modal.querySelectorAll('select[id^="subject-teacher-"]');
  const assignments = [];
  const promises = [];

  selects.forEach(select => {
    const teacherId = select.value;
    if (!teacherId) return;

    const subject = select.id.replace('subject-teacher-', '').replace(/_/g, ' ');
    assignments.push({ teacherId, subject });
  });

  if (assignments.length === 0) {
    showToast('No assignments to save', 'info');
    return;
  }

  showLoading();
  try {
    await api.admin.batchAssignSubjects({ classId: parseInt(classId), assignments });
    showToast(`✅ Saved ${assignments.length} subject assignments`, 'success');
    closeSubjectAssignmentModal();
    await refreshClassesList();
    await showDashboardSection('classes');
  } catch (error) {
    showToast(error.message || 'Failed to save assignments', 'error');
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
            await refreshClassesList();
            await showDashboardSection('classes');
        }
    } catch (error) {
        console.error('Error removing subject assignment:', error);
        showToast(error.message || 'Failed to remove teacher from subject', 'error');
    } finally {
        hideLoading();
    }
}

function toggleClassDetails(classId) {
    const row = document.getElementById(`class-details-${classId}`);
    if (row) row.classList.toggle('hidden');
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============ EXPORT ALL FUNCTIONS GLOBALLY ============
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
window.getSchoolSubjects = getSchoolSubjects;
window.escapeHtml = escapeHtml;
window.toggleClassDetails = toggleClassDetails;
window.refreshClassesList = refreshClassesList;
window.renderSubjectTeachers = renderSubjectTeachers;
window.saveAllSubjectAssignments = saveAllSubjectAssignments;
window.checkTeacherAssignment = checkTeacherAssignment;
window.listAllTeachersAndClasses = listAllTeachersAndClasses;
