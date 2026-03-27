// admin-approvals.js - Complete with all load functions

async function loadPendingTeachers() {
    try {
        const response = await api.admin.getPendingApprovals();
        return response?.data?.teachers || [];
    } catch (error) {
        console.error('Failed to load pending teachers:', error);
        showToast('Failed to load pending teachers', 'error');
        return [];
    }
}

async function loadAllTeachers() {
    try {
        const response = await api.admin.getTeachers();
        return response?.data || [];
    } catch (error) {
        console.error('Failed to load teachers:', error);
        showToast('Failed to load teachers', 'error');
        return [];
    }
}

async function loadAllStudents() {
    try {
        const response = await api.admin.getStudents();
        return response?.data || [];
    } catch (error) {
        console.error('Failed to load students:', error);
        showToast('Failed to load students', 'error');
        return [];
    }
}

async function loadAllParents() {
    try {
        const response = await api.admin.getParents();
        return response?.data || [];
    } catch (error) {
        console.error('Failed to load parents:', error);
        showToast('Failed to load parents', 'error');
        return [];
    }
}

async function approveTeacher(teacherId) {
    if (!teacherId) return;
    if (!confirm('Approve this teacher?')) return;

    showLoading();
    try {
        const response = await api.admin.approveTeacher(teacherId, 'approve');
        showToast('✅ Teacher approved successfully', 'success');
        await refreshPendingTeachers();
        await refreshTeachersList();
        return response;
    } catch (error) {
        showToast(error.message || 'Failed to approve teacher', 'error');
    } finally {
        hideLoading();
    }
}

async function rejectTeacher(teacherId) {
    if (!teacherId) return;
    const reason = prompt('Please enter rejection reason:');
    if (reason === null) return;

    showLoading();
    try {
        const response = await api.admin.approveTeacher(teacherId, 'reject', reason);
        showToast('Teacher rejected', 'info');
        await refreshPendingTeachers();
        return response;
    } catch (error) {
        showToast(error.message || 'Failed to reject teacher', 'error');
    } finally {
        hideLoading();
    }
}

async function refreshPendingTeachers() {
    const container = document.querySelector('#pending-teachers-table');
    if (!container) return;

    const teachers = await loadPendingTeachers();
    container.innerHTML = renderPendingTeachersTable(teachers);
    if (window.lucide) lucide.createIcons();
}

async function refreshTeachersList() {
    const container = document.getElementById('teachers-table-container');
    if (!container) return;

    const teachers = await loadAllTeachers();
    container.innerHTML = renderTeachersTable(teachers);
    if (window.lucide) lucide.createIcons();
}

function renderPendingTeachersTable(teachers) {
    if (!teachers || teachers.length === 0) {
        return '<div class="text-center py-8 text-muted-foreground">No pending teachers</div>';
    }

    return `
        <div class="overflow-x-auto">
            <table class="w-full text-sm">
                <thead class="bg-muted/50">
                    <tr>
                        <th class="px-4 py-3 text-left font-medium">Teacher</th>
                        <th class="px-4 py-3 text-left font-medium">Email</th>
                        <th class="px-4 py-3 text-left font-medium">Subjects</th>
                        <th class="px-4 py-3 text-left font-medium">Qualification</th>
                        <th class="px-4 py-3 text-left font-medium">Applied</th>
                        <th class="px-4 py-3 text-right font-medium">Actions</th>
                    </tr>
                </thead>
                <tbody class="divide-y">
                    ${teachers.map(teacher => {
                        const user = teacher.User || {};
                        return `
                            <tr class="hover:bg-accent/50 transition-colors">
                                <td class="px-4 py-3">
                                    <div class="flex items-center gap-3">
                                        <div class="h-8 w-8 rounded-full bg-violet-100 flex items-center justify-center">
                                            <span class="font-medium text-violet-700 text-sm">${getInitials(user.name)}</span>
                                        </div>
                                        <span class="font-medium">${user.name || 'Unknown'}</span>
                                    </div>
                                </td>
                                <td class="px-4 py-3">${user.email || 'N/A'}</td>
                                <td class="px-4 py-3">${(teacher.subjects || []).join(', ')}</td>
                                <td class="px-4 py-3">${teacher.qualification || 'N/A'}</td>
                                <td class="px-4 py-3">${timeAgo(teacher.createdAt)}</td>
                                <td class="px-4 py-3 text-right">
                                    <button onclick="approveTeacher('${teacher.id}')" class="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full hover:bg-green-200 mr-2">Approve</button>
                                    <button onclick="rejectTeacher('${teacher.id}')" class="px-3 py-1 bg-red-100 text-red-700 text-xs rounded-full hover:bg-red-200">Reject</button>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function renderTeachersTable(teachers) {
    if (!teachers || teachers.length === 0) {
        return '<div class="text-center py-8 text-muted-foreground">No teachers found</div>';
    }

    return `
        <div class="overflow-x-auto">
            <table class="w-full text-sm">
                <thead class="bg-muted/50">
                    <tr>
                        <th class="px-4 py-3 text-left font-medium">Teacher</th>
                        <th class="px-4 py-3 text-left font-medium">Email</th>
                        <th class="px-4 py-3 text-left font-medium">Subjects</th>
                        <th class="px-4 py-3 text-left font-medium">Status</th>
                        <th class="px-4 py-3 text-right font-medium">Actions</th>
                    </tr>
                </thead>
                <tbody class="divide-y">
                    ${teachers.map(teacher => {
                        const user = teacher.User || {};
                        const isActive = teacher.isActive !== false;
                        return `
                            <tr class="hover:bg-accent/50 transition-colors">
                                <td class="px-4 py-3">
                                    <div class="flex items-center gap-3">
                                        <div class="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                            <span class="font-medium text-blue-700 text-sm">${getInitials(user.name)}</span>
                                        </div>
                                        <span class="font-medium">${user.name || 'Unknown'}</span>
                                    </div>
                                </td>
                                <td class="px-4 py-3">${user.email || 'N/A'}</td>
                                <td class="px-4 py-3">${(teacher.subjects || []).join(', ')}</td>
                                <td class="px-4 py-3">
                                    <span class="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">
                                        ${isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td class="px-4 py-3 text-right">
                                    <button onclick="viewTeacherDetails('${teacher.id}')" class="p-2 hover:bg-accent rounded-lg"><i data-lucide="eye" class="h-4 w-4"></i></button>
                                    ${isActive ? 
                                        `<button onclick="deactivateTeacher('${teacher.id}', '${user.name}')" class="p-2 hover:bg-yellow-100 rounded-lg text-yellow-600"><i data-lucide="pause-circle" class="h-4 w-4"></i></button>` : 
                                        `<button onclick="activateTeacher('${teacher.id}', '${user.name}')" class="p-2 hover:bg-green-100 rounded-lg text-green-600"><i data-lucide="play-circle" class="h-4 w-4"></i></button>`
                                    }
                                    <button onclick="removeTeacher('${teacher.id}')" class="p-2 hover:bg-red-100 rounded-lg text-red-600"><i data-lucide="trash-2" class="h-4 w-4"></i></button>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// Export all
window.loadPendingTeachers = loadPendingTeachers;
window.loadAllTeachers = loadAllTeachers;
window.loadAllStudents = loadAllStudents;
window.loadAllParents = loadAllParents;
window.approveTeacher = approveTeacher;
window.rejectTeacher = rejectTeacher;
window.refreshPendingTeachers = refreshPendingTeachers;
window.refreshTeachersList = refreshTeachersList;
window.renderPendingTeachersTable = renderPendingTeachersTable;
window.renderTeachersTable = renderTeachersTable;
