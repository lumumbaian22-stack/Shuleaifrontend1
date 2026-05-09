// Load classes
async function loadClasses() {
    try {
        const response = await api.admin.getClasses();
        return response.data || [];
    } catch (error) {
        console.error('Load classes error:', error);
        showToast('Failed to load classes', 'error');
        return [];
    }
}

// Load available teachers
async function loadAvailableTeachers() {
    try {
        const response = await api.admin.getAvailableTeachers();
        return response.data || [];
    } catch (error) {
        console.error('Load teachers error:', error);
        return [];
    }
}

// Render classes management page
async function renderClassesManagement() {
    const classes = await loadClasses();
    const teachers = await loadAvailableTeachers();
    
    return `
        <div class="space-y-6">
            <div class="flex justify-between items-center">
                <h2 class="text-2xl font-bold">Class Management</h2>
                <button onclick="showAddClassModal()" class="px-4 py-2 bg-primary text-primary-foreground rounded-lg">
                    <i data-lucide="plus" class="h-4 w-4 inline mr-2"></i>
                    Add Class
                </button>
            </div>
            
            <div class="grid gap-4">
                ${classes.map(cls => `
                    <div class="border rounded-lg p-4 bg-card">
                        <div class="flex justify-between items-start">
                            <div>
                                <h3 class="font-semibold text-lg">${cls.name} (Grade ${cls.grade} ${cls.stream || ''})</h3>
                                <p class="text-sm text-muted-foreground">Academic Year: ${cls.academicYear}</p>
                            </div>
                            <div class="flex gap-2">
                                <button onclick="editClass('${cls.id}')" class="p-2 hover:bg-accent rounded-lg">
                                    <i data-lucide="edit" class="h-4 w-4"></i>
                                </button>
                            </div>
                        </div>
                        
                        <div class="mt-4 p-3 bg-muted/30 rounded-lg">
                            <div class="flex justify-between items-center">
                                <div>
                                    <p class="text-sm font-medium">Class Teacher</p>
                                    ${cls.Teacher ? `
                                        <p class="text-sm">${cls.Teacher.User?.name || 'Unknown'}</p>
                                        <p class="text-xs text-muted-foreground">${cls.Teacher.User?.email || ''}</p>
                                    ` : `
                                        <p class="text-sm text-yellow-600">No teacher assigned</p>
                                    `}
                                </div>
                                <button onclick="showAssignTeacherModal('${cls.id}', '${cls.name}')" 
                                        class="px-3 py-1 bg-primary text-primary-foreground text-sm rounded-lg">
                                    ${cls.Teacher ? 'Change Teacher' : 'Assign Teacher'}
                                </button>
                            </div>
                        </div>
                        
                        <!-- Student list summary -->
                        <div class="mt-3 text-sm">
                            <span class="font-medium">Students:</span>
                            <span class="text-muted-foreground ml-2">${cls.studentCount || 0} enrolled</span>
                            <button onclick="viewClassStudents('${cls.id}')" class="text-primary hover:underline ml-4">
                                View all
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// Show assign teacher modal
function showAssignTeacherModal(classId, className) {
    let modal = document.getElementById('assign-teacher-modal');
    
    if (!modal) {
        createAssignTeacherModal();
        modal = document.getElementById('assign-teacher-modal');
    }
    
    document.getElementById('assign-class-id').value = classId;
    document.getElementById('assign-class-name').textContent = className;
    
    // Load teachers into select
    loadAvailableTeachers().then(teachers => {
        const select = document.getElementById('assign-teacher-select');
        select.innerHTML = '<option value="">Select a teacher</option>';
        teachers.forEach(teacher => {
            select.innerHTML += `
                <option value="${teacher.id}">${teacher.User?.name} (${teacher.subjects?.join(', ') || 'No subjects'})</option>
            `;
        });
    });
    
    modal.classList.remove('hidden');
}

// Create assign teacher modal
function createAssignTeacherModal() {
    const modalHTML = `
        <div id="assign-teacher-modal" class="fixed inset-0 z-50 hidden">
            <div class="absolute inset-0 bg-black/50" onclick="closeAssignTeacherModal()"></div>
            <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md p-4">
                <div class="rounded-xl border bg-card p-6 shadow-xl">
                    <h3 class="text-lg font-semibold mb-4">Assign Class Teacher</h3>
                    <p class="text-sm mb-4">Class: <span id="assign-class-name" class="font-medium"></span></p>
                    <input type="hidden" id="assign-class-id">
                    
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium mb-2">Select Teacher</label>
                            <select id="assign-teacher-select" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                                <option value="">Loading teachers...</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="flex justify-end gap-2 mt-6">
                        <button onclick="closeAssignTeacherModal()" class="px-4 py-2 text-sm border rounded-lg">Cancel</button>
                        <button onclick="handleAssignTeacher()" class="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg">Assign</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Close assign teacher modal
function closeAssignTeacherModal() {
    const modal = document.getElementById('assign-teacher-modal');
    if (modal) modal.classList.add('hidden');
}

// Handle assign teacher
async function handleAssignTeacher() {
    const classId = document.getElementById('assign-class-id').value;
    const teacherId = document.getElementById('assign-teacher-select').value;
    
    if (!teacherId) {
        showToast('Please select a teacher', 'error');
        return;
    }
    
    showLoading();
    try {
        const response = await api.admin.assignTeacherToClass(classId, teacherId);
        showToast('✅ Teacher assigned successfully', 'success');
        closeAssignTeacherModal();
        
        // Refresh the classes view
        await showDashboardSection('classes');
    } catch (error) {
        showToast(error.message || 'Failed to assign teacher', 'error');
    } finally {
        hideLoading();
    }
}

// Add to sidebar config
// In the admin sidebar section, add: { icon: 'users', label: 'Classes', section: 'classes' }