// ============ CRITICAL FALLBACKS for admin-dashboard ============
if (typeof window.loadAllTeachers !== 'function') {
    console.warn('loadAllTeachers not defined – using fallback');
    window.loadAllTeachers = async function() {
        try {
            const response = await api.admin.getTeachers();
            return response.data || [];
        } catch (error) {
            console.error('Fallback loadAllTeachers error:', error);
            return [];
        }
    };
}

if (typeof window.renderStudentsTable !== 'function') {
    console.warn('renderStudentsTable not defined – using fallback');
    window.renderStudentsTable = function(students) {
        if (!students || students.length === 0) {
            return '<div class="text-center py-8 text-muted-foreground">No students found</div>';
        }
        return `
            <div class="overflow-x-auto">
                <table class="w-full text-sm">
                    <thead class="bg-muted/50">
                        <tr>
                            <th class="px-4 py-3 text-left">Student</th>
                            <th class="px-4 py-3 text-left">ELIMUID</th>
                            <th class="px-4 py-3 text-left">Grade</th>
                            <th class="px-4 py-3 text-left">Status</th>
                            <th class="px-4 py-3 text-left">Parent Email</th>
                            <th class="px-4 py-3 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y">
                        ${students.map(student => {
                            const user = student.User || {};
                            const name = user.name || 'Unknown';
                            const email = user.email || 'N/A';
                            const status = student.status || 'active';
                            const statusClass = status === 'active' ? 'bg-green-100 text-green-700' : 
                                               status === 'inactive' ? 'bg-red-100 text-red-700' : 
                                               'bg-gray-100 text-gray-700';
                            const initials = getInitials(name);
                            return `
                                <tr class="hover:bg-accent/50">
                                    <td class="px-4 py-3">
                                        <div class="flex items-center gap-3">
                                            <div class="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                                <span class="font-medium text-blue-700 text-sm">${initials}</span>
                                            </div>
                                            <span class="font-medium">${escapeHtml(name)}</span>
                                        </div>
                                    </td>
                                    <td class="px-4 py-3"><span class="font-mono text-xs bg-muted px-2 py-1 rounded">${student.elimuid || 'N/A'}</span></td>
                                    <td class="px-4 py-3">${student.grade || 'N/A'}</td>
                                    <td class="px-4 py-3"><span class="px-2 py-1 ${statusClass} text-xs rounded-full">${status}</span></td>
                                    <td class="px-4 py-3">${email}</td>
                                    <td class="px-4 py-3 text-center">
                                        <button onclick="adminViewStudentDetails('${student.id}')" class="p-1 hover:bg-accent rounded" title="View"><i data-lucide="eye" class="h-4 w-4"></i></button>
                                        <button onclick="adminEditStudent('${student.id}')" class="p-1 hover:bg-accent rounded" title="Edit"><i data-lucide="edit" class="h-4 w-4"></i></button>
                                        ${status === 'active' ? 
                                            `<button onclick="adminSuspendStudent('${student.id}', '${escapeHtml(name)}')" class="p-1 hover:bg-yellow-100 rounded" title="Suspend"><i data-lucide="pause-circle" class="h-4 w-4 text-yellow-600"></i></button>` : 
                                            `<button onclick="adminReactivateStudent('${student.id}', '${escapeHtml(name)}')" class="p-1 hover:bg-green-100 rounded" title="Reactivate"><i data-lucide="play-circle" class="h-4 w-4 text-green-600"></i></button>`
                                        }
                                        <button onclick="adminDeleteStudent('${student.id}', '${escapeHtml(name)}')" class="p-1 hover:bg-red-100 rounded" title="Delete"><i data-lucide="trash-2" class="h-4 w-4 text-red-600"></i></button>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    };
}

if (typeof window.loadPendingTeachers !== 'function') {
    console.warn('loadPendingTeachers not defined – using fallback');
    window.loadPendingTeachers = async function() {
        try {
            const response = await api.admin.getPendingApprovals();
            return response?.data?.teachers || [];
        } catch (error) {
            console.error('Fallback loadPendingTeachers error:', error);
            return [];
        }
    };
}

if (typeof window.renderTeachersTable !== 'function') {
    console.warn('renderTeachersTable not defined – using fallback');
    window.renderTeachersTable = function(teachers) {
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
                        ${teachers.map(teacher => `
                            <tr class="hover:bg-accent/50 transition-colors">
                                <td class="px-4 py-3">
                                    <div class="flex items-center gap-3">
                                        <div class="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                            <span class="font-medium text-blue-700 text-sm">${getInitials(teacher.User?.name || 'Unknown')}</span>
                                        </div>
                                        <span class="font-medium">${teacher.User?.name || 'Unknown'}</span>
                                    </div>
                                </td>
                                <td class="px-4 py-3">${teacher.User?.email || 'N/A'}</td>
                                <td class="px-4 py-3">${(teacher.subjects || []).join(', ')}</td>
                                <td class="px-4 py-3">
                                    <span class="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${teacher.isActive === false ? 'bg-red-100 text-red-700' : (teacher.approvalStatus === 'approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700')}">
                                        ${teacher.isActive === false ? 'Suspended' : (teacher.approvalStatus === 'approved' ? 'Active' : 'Pending')}
                                    </span>
                                </td>
                                <td class="px-4 py-3 text-right">
                                    <button onclick="viewTeacherDetails('${teacher.id}')" class="p-2 hover:bg-accent rounded-lg" title="View">
                                        <i data-lucide="eye" class="h-4 w-4"></i>
                                    </button>
                                    <button onclick="editTeacher('${teacher.id}')" class="p-2 hover:bg-accent rounded-lg" title="Edit">
                                        <i data-lucide="edit" class="h-4 w-4"></i>
                                    </button>
                                    <button onclick="suspendTeacher('${teacher.id}', '${escapeHtml(teacher.User?.name || 'Unknown')}')" class="p-2 hover:bg-yellow-100 rounded-lg text-yellow-600" title="Suspend">
                                        <i data-lucide="pause-circle" class="h-4 w-4"></i>
                                    </button>
                                    <button onclick="deleteTeacher('${teacher.id}')" class="p-2 hover:bg-red-100 rounded-lg text-red-600" title="Delete">
                                        <i data-lucide="trash-2" class="h-4 w-4"></i>
                                    </button>   
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    };
}

if (typeof window.renderPendingTeachersTable !== 'function') {
    console.warn('renderPendingTeachersTable not defined – using fallback');
    window.renderPendingTeachersTable = function(teachers) {
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
                            <th class="px-4 py-3 text-left font-medium">Applied</th>
                            <th class="px-4 py-3 text-right font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y">
                        ${teachers.map(teacher => `
                            <tr class="hover:bg-accent/50 transition-colors">
                                <td class="px-4 py-3">
                                    <div class="flex items-center gap-3">
                                        <div class="h-8 w-8 rounded-full bg-violet-100 flex items-center justify-center">
                                            <span class="font-medium text-violet-700 text-sm">${getInitials(teacher.User?.name || 'Unknown')}</span>
                                        </div>
                                        <span class="font-medium">${teacher.User?.name || 'Unknown'}</span>
                                    </div>
                                </td>
                                <td class="px-4 py-3">${teacher.User?.email || 'N/A'}</td>
                                <td class="px-4 py-3">${(teacher.subjects || []).join(', ')}</td>
                                <td class="px-4 py-3">${timeAgo(teacher.createdAt)}</td>
                                <td class="px-4 py-3 text-right">
                                    <button onclick="approveTeacher('${teacher.id}')" class="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full hover:bg-green-200 mr-2">Approve</button>
                                    <button onclick="rejectTeacher('${teacher.id}')" class="px-3 py-1 bg-red-100 text-red-700 text-xs rounded-full hover:bg-red-200">Reject</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    };
}

// Fallback for renderClassManagement
if (typeof window.renderClassManagement !== 'function') {
    window.renderClassManagement = async function() {
        return '<div class="text-center py-12">Class management module loading...</div>';
    };
}

if (typeof window.loadAllStudents !== 'function') {
    console.warn('loadAllStudents not defined – using fallback');
    window.loadAllStudents = async function() {
        try {
            const response = await api.admin.getStudents();
            return response.data || [];
        } catch (error) {
            console.error('Fallback loadAllStudents error:', error);
            return [];
        }
    };
}

// Helper to refresh class management if visible
async function refreshClassManagementIfVisible() {
    if (window.currentSection === 'classes' && typeof refreshClassesList === 'function') {
        await refreshClassesList();
        await showDashboardSection('classes');
    }
}

// ============ DYNAMIC MODAL CREATION ============
function ensureStudentModals() {
    if (!document.getElementById('student-details-modal')) {
        const modalHTML = `
            <div id="student-details-modal" class="fixed inset-0 z-50 hidden">
                <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" onclick="closeStudentDetailsModal()"></div>
                <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md p-4">
                    <div class="rounded-2xl border bg-card shadow-2xl overflow-hidden">
                        <div class="bg-gradient-to-r from-green-600 to-teal-600 px-6 py-4 text-white flex justify-between items-center">
                            <h3 class="text-xl font-semibold">Student Details</h3>
                            <button onclick="closeStudentDetailsModal()" class="text-white hover:text-gray-200"><i data-lucide="x" class="h-5 w-5"></i></button>
                        </div>
                        <div id="student-details-content" class="p-6 space-y-4"></div>
                        <div class="px-6 py-4 bg-muted/30 flex justify-end gap-3">
                            <button onclick="closeStudentDetailsModal()" class="px-4 py-2 border rounded-lg hover:bg-accent">Close</button>
                            <button onclick="editStudentFromModal()" class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">Edit Student</button>
                        </div>
                    </div>
                </div>
            </div>
            <div id="edit-student-modal" class="fixed inset-0 z-50 hidden">
                <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" onclick="closeEditStudentModal()"></div>
                <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md p-4">
                    <div class="rounded-2xl border bg-card shadow-2xl overflow-hidden">
                        <div class="bg-gradient-to-r from-green-600 to-teal-600 px-6 py-4 text-white">
                            <h3 class="text-xl font-semibold">Edit Student</h3>
                        </div>
                        <div class="p-6 space-y-4">
                            <input type="hidden" id="edit-student-id">
                            <div><label class="block text-sm font-medium mb-1">Full Name</label><input type="text" id="edit-student-name" class="w-full rounded-lg border p-2"></div>
                            <div><label class="block text-sm font-medium mb-1">Email</label><input type="email" id="edit-student-email" class="w-full rounded-lg border p-2"></div>
                            <div><label class="block text-sm font-medium mb-1">Grade</label><input type="text" id="edit-student-grade" class="w-full rounded-lg border p-2"></div>
                            <div><label class="block text-sm font-medium mb-1">Status</label>
                                <select id="edit-student-status" class="w-full rounded-lg border p-2">
                                    <option value="active">Active</option><option value="inactive">Inactive</option>
                                    <option value="graduated">Graduated</option><option value="transferred">Transferred</option>
                                </select>
                            </div>
                        </div>
                        <div class="px-6 py-4 bg-muted/30 flex justify-end gap-3">
                            <button onclick="closeEditStudentModal()" class="px-4 py-2 border rounded-lg hover:bg-accent">Cancel</button>
                            <button onclick="saveStudentEdit()" class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">Save Changes</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }
}

function ensureTeacherModals() {
    if (!document.getElementById('teacher-details-modal')) {
        const modalHTML = `
            <div id="teacher-details-modal" class="fixed inset-0 z-50 hidden">
                <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" onclick="closeTeacherDetailsModal()"></div>
                <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md p-4">
                    <div class="rounded-2xl border bg-card shadow-2xl overflow-hidden">
                        <div class="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 text-white flex justify-between items-center">
                            <h3 class="text-xl font-semibold">Teacher Details</h3>
                            <button onclick="closeTeacherDetailsModal()" class="text-white hover:text-gray-200"><i data-lucide="x" class="h-5 w-5"></i></button>
                        </div>
                        <div id="teacher-details-content" class="p-6 space-y-4"></div>
                        <div class="px-6 py-4 bg-muted/30 flex justify-end gap-3">
                            <button onclick="closeTeacherDetailsModal()" class="px-4 py-2 border rounded-lg hover:bg-accent">Close</button>
                            <button onclick="editTeacherFromModal()" class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">Edit Teacher</button>
                        </div>
                    </div>
                </div>
            </div>
            <div id="edit-teacher-modal" class="fixed inset-0 z-50 hidden">
                <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" onclick="closeEditTeacherModal()"></div>
                <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md p-4">
                    <div class="rounded-2xl border bg-card shadow-2xl overflow-hidden">
                        <div class="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 text-white">
                            <h3 class="text-xl font-semibold">Edit Teacher</h3>
                        </div>
                        <div class="p-6 space-y-4">
                            <input type="hidden" id="edit-teacher-id">
                            <div><label class="block text-sm font-medium mb-1">Full Name</label><input type="text" id="edit-teacher-name" class="w-full rounded-lg border p-2"></div>
                            <div><label class="block text-sm font-medium mb-1">Email</label><input type="email" id="edit-teacher-email" class="w-full rounded-lg border p-2"></div>
                            <div><label class="block text-sm font-medium mb-1">Subjects (comma)</label><input type="text" id="edit-teacher-subjects" class="w-full rounded-lg border p-2"></div>
                            <div><label class="block text-sm font-medium mb-1">Department</label><input type="text" id="edit-teacher-department" class="w-full rounded-lg border p-2"></div>
                        </div>
                        <div class="px-6 py-4 bg-muted/30 flex justify-end gap-3">
                            <button onclick="closeEditTeacherModal()" class="px-4 py-2 border rounded-lg hover:bg-accent">Cancel</button>
                            <button onclick="saveTeacherEdit()" class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">Save Changes</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }
}

// ============ ADMIN STUDENT ACTIONS ============
window.adminViewStudentDetails = async function(studentId) {
    ensureStudentModals();
    const students = await window.loadAllStudents();
    const student = students.find(s => s.id == studentId);
    if (!student) { showToast('Student not found', 'error'); return; }
    const content = document.getElementById('student-details-content');
    content.innerHTML = `
        <div class="flex items-center gap-4 pb-4 border-b">
            <div class="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                <span class="text-2xl font-bold text-green-600">${getInitials(student.User?.name)}</span>
            </div>
            <div><p class="text-lg font-semibold">${escapeHtml(student.User?.name)}</p><p class="text-sm text-muted-foreground">${escapeHtml(student.User?.email || 'No email')}</p></div>
        </div>
        <div class="grid grid-cols-2 gap-3 text-sm">
            <div><span class="font-medium">ELIMUID:</span> ${student.elimuid || 'N/A'}</div>
            <div><span class="font-medium">Grade:</span> ${student.grade || 'N/A'}</div>
            <div><span class="font-medium">Status:</span> <span class="px-2 py-0.5 rounded-full text-xs ${student.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">${student.status}</span></div>
            <div><span class="font-medium">Enrolled:</span> ${new Date(student.createdAt).toLocaleDateString()}</div>
        </div>
    `;
    document.getElementById('student-details-modal').classList.remove('hidden');
    if (window.lucide) lucide.createIcons();
};

window.adminEditStudent = async function(studentId) {
    ensureStudentModals();
    const students = await window.loadAllStudents();
    const student = students.find(s => s.id == studentId);
    if (!student) return;
    document.getElementById('edit-student-id').value = student.id;
    document.getElementById('edit-student-name').value = student.User?.name || '';
    document.getElementById('edit-student-email').value = student.User?.email || '';
    document.getElementById('edit-student-grade').value = student.grade || '';
    document.getElementById('edit-student-status').value = student.status || 'active';
    document.getElementById('edit-student-modal').classList.remove('hidden');
};

window.adminSuspendStudent = async function(studentId, studentName) {
    if (!confirm(`Suspend ${studentName}?`)) return;
    try {
        await api.admin.updateStudent(studentId, { status: 'inactive' });
        showToast(`${studentName} suspended`, 'success');
        await renderAdminStudents();
    } catch (error) {
        showToast(error.message, 'error');
    }
};

window.adminReactivateStudent = async function(studentId, studentName) {
    if (!confirm(`Reactivate ${studentName}?`)) return;
    try {
        await api.admin.updateStudent(studentId, { status: 'active' });
        showToast(`${studentName} reactivated`, 'success');
        await renderAdminStudents();
    } catch (error) {
        showToast(error.message, 'error');
    }
};

window.adminDeleteStudent = async function(studentId, studentName) {
    if (!confirm(`Permanently delete ${studentName}? This cannot be undone.`)) return;
    try {
        await api.admin.deleteStudent(studentId);
        showToast(`${studentName} deleted`, 'success');
        await renderAdminStudents();
    } catch (error) {
        showToast(error.message, 'error');
    }
};

// ============ TEACHER ACTIONS ============
let currentTeacherId = null;

window.viewTeacherDetails = async function(teacherId) {
    ensureTeacherModals();
    const teachers = await window.loadAllTeachers();
    const teacher = teachers.find(t => t.id == teacherId);
    if (!teacher) { showToast('Teacher not found', 'error'); return; }
    currentTeacherId = teacher.id;
    const content = document.getElementById('teacher-details-content');
    content.innerHTML = `
        <div class="flex items-center gap-4 pb-4 border-b">
            <div class="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
                <span class="text-2xl font-bold text-blue-600">${getInitials(teacher.User?.name)}</span>
            </div>
            <div><p class="text-lg font-semibold">${escapeHtml(teacher.User?.name)}</p><p class="text-sm text-muted-foreground">${escapeHtml(teacher.User?.email)}</p></div>
        </div>
        <div class="grid grid-cols-2 gap-3 text-sm">
            <div><span class="font-medium">Employee ID:</span> ${teacher.employeeId || 'N/A'}</div>
            <div><span class="font-medium">Department:</span> ${teacher.department || 'N/A'}</div>
            <div><span class="font-medium">Subjects:</span> ${teacher.subjects?.join(', ') || 'None'}</div>
            <div><span class="font-medium">Class Teacher:</span> ${teacher.classTeacher || 'No'}</div>
            <div><span class="font-medium">Status:</span> <span class="px-2 py-0.5 rounded-full text-xs ${teacher.approvalStatus === 'approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}">${teacher.approvalStatus}</span></div>
            <div><span class="font-medium">Joined:</span> ${new Date(teacher.dateJoined).toLocaleDateString()}</div>
        </div>
    `;
    document.getElementById('teacher-details-modal').classList.remove('hidden');
    if (window.lucide) lucide.createIcons();
};

window.editTeacher = async function(teacherId) {
    ensureTeacherModals();
    const teachers = await window.loadAllTeachers();
    const teacher = teachers.find(t => t.id == teacherId);
    if (!teacher) return;
    document.getElementById('edit-teacher-id').value = teacher.id;
    document.getElementById('edit-teacher-name').value = teacher.User?.name || '';
    document.getElementById('edit-teacher-email').value = teacher.User?.email || '';
    document.getElementById('edit-teacher-subjects').value = (teacher.subjects || []).join(', ');
    document.getElementById('edit-teacher-department').value = teacher.department || '';
    document.getElementById('edit-teacher-modal').classList.remove('hidden');
};

window.suspendTeacher = async function(teacherId, teacherName) {
    if (!confirm(`⚠️ Suspend ${teacherName}? This teacher will no longer be able to log in.`)) return;
    showLoading();
    try {
        // Change approvalStatus to 'suspended' or 'rejected'
        await api.admin.updateTeacher(teacherId, { approvalStatus: 'suspended', isActive: false });
        showToast(`${teacherName} suspended`, 'success');
        await renderAdminTeachers();
    } catch (error) {
        showToast(error.message || 'Failed to suspend teacher', 'error');
    } finally {
        hideLoading();
    }
};

window.deleteTeacher = async function(teacherId) {
    if (!confirm('Delete this teacher? This action cannot be undone.')) return;
    try {
        await api.admin.deleteTeacher(teacherId);
        showToast('Teacher deleted', 'success');
        await renderAdminTeachers();
    } catch (error) {
        showToast(error.message, 'error');
    }
};

// Modal helper functions
window.closeStudentDetailsModal = function() { const m = document.getElementById('student-details-modal'); if(m) m.classList.add('hidden'); };
window.closeEditStudentModal = function() { const m = document.getElementById('edit-student-modal'); if(m) m.classList.add('hidden'); };
window.editStudentFromModal = function() { const id = document.getElementById('edit-student-id')?.value; if(id) { closeStudentDetailsModal(); adminEditStudent(id); } };
window.saveStudentEdit = async function() {
    const id = document.getElementById('edit-student-id')?.value;
    if(!id) return;
    showLoading();
    try {
        await api.admin.updateStudent(id, {
            name: document.getElementById('edit-student-name').value,
            email: document.getElementById('edit-student-email').value,
            grade: document.getElementById('edit-student-grade').value,
            status: document.getElementById('edit-student-status').value
        });
        showToast('Student updated', 'success');
        closeEditStudentModal();
        await renderAdminStudents();
    } catch(e) { showToast(e.message, 'error'); } finally { hideLoading(); }
};

window.closeTeacherDetailsModal = function() { const m = document.getElementById('teacher-details-modal'); if(m) m.classList.add('hidden'); };
window.closeEditTeacherModal = function() { const m = document.getElementById('edit-teacher-modal'); if(m) m.classList.add('hidden'); };
window.editTeacherFromModal = function() { const id = document.getElementById('edit-teacher-id')?.value; if(id) { closeTeacherDetailsModal(); editTeacher(id); } };
window.saveTeacherEdit = async function() {
    const id = document.getElementById('edit-teacher-id')?.value;
    if(!id) return;
    const subjects = document.getElementById('edit-teacher-subjects').value.split(',').map(s=>s.trim()).filter(s=>s);
    showLoading();
    try {
        await api.admin.updateTeacher(id, {
            name: document.getElementById('edit-teacher-name').value,
            email: document.getElementById('edit-teacher-email').value,
            subjects: subjects,
            department: document.getElementById('edit-teacher-department').value
        });
        showToast('Teacher updated', 'success');
        closeEditTeacherModal();
        await renderAdminTeachers();
    } catch(e) { showToast(e.message, 'error'); } finally { hideLoading(); }
};

// ============ RENDER ADMIN SECTION ============
async function renderAdminSection(section) {
    try {
        switch(section) {
            case 'help':
                return renderHelpSection();
            case 'dashboard':
                return renderAdminDashboard();
            case 'students':
                return await renderAdminStudents();
            case 'calendar':
                return renderAdminCalendar();
            case 'teachers':
                return await renderAdminTeachers();
            case 'teacher-approvals':
                return await renderAdminPendingTeachers();
            case 'classes':
                if (typeof window.renderClassManagement === 'function') {
                    const html = await window.renderClassManagement();
                    return html;
                } else if (typeof renderClassManagement === 'function') {
                    return await renderClassManagement();
                } else {
                    return '<div class="text-center py-12"><p class="text-red-500">Class management module not loaded. Please refresh the page.</p><button onclick="location.reload()" class="mt-4 px-4 py-2 bg-primary text-white rounded-lg">Refresh Page</button></div>';
                }
            case 'duty':
                return await renderAdminDuty();
            case 'fairness-report':
                return await renderAdminFairnessReport();
            case 'custom-subjects':
                return renderAdminCustomSubjects();
            case 'teacher-workload':
                return await renderAdminTeacherWorkload();
            case 'settings':
                return renderAdminSettings();
            default:
                return '<div class="text-center py-12">Section not found</div>';
        }
    } catch (error) {
        console.error('Error rendering admin section:', error);
        return `<div class="text-center py-12 text-red-500">Error loading section: ${error.message}</div>`;
    }
}

function renderAdminDashboard() {
    const school = getCurrentSchool();
    const data = dashboardData || {};
    return `
        <div class="space-y-6 animate-fade-in">
            <div class="rounded-xl border bg-card p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 card-hover">
                <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <div class="flex items-center gap-3 mb-2">
                            <h2 id="dashboard-school-name" class="text-2xl font-bold">${school?.name || 'Your School'}</h2>
                            <span class="px-3 py-1 ${school?.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'} text-xs rounded-full">${school?.status || 'pending'}</span>
                        </div>
                        <div class="flex items-center gap-4">
                            <p class="text-sm"><span class="font-mono bg-muted px-2 py-1 rounded">Short Code: ${school?.shortCode || 'SHL-XXXXX'}</span></p>
                            <button onclick="showNameChangeModal()" class="text-sm text-primary hover:underline">Change School Name ($50)</button>
                        </div>
                    </div>
                    <div class="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm">
                        <p class="text-xs text-muted-foreground">Share this code with teachers</p>
                        <p class="text-lg font-mono font-bold">${school?.shortCode || 'SHL-XXXXX'}</p>
                    </div>
                </div>
            </div>
            <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div class="rounded-xl border bg-card p-6 card-hover"><div class="flex items-center justify-between"><div><p class="text-sm font-medium text-muted-foreground">Total Students</p><h3 class="text-2xl font-bold mt-1" id="total-students">${data.students?.length || 0}</h3></div><div class="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center"><i data-lucide="users" class="h-6 w-6 text-blue-600"></i></div></div></div>
                <div class="rounded-xl border bg-card p-6 card-hover"><div class="flex items-center justify-between"><div><p class="text-sm font-medium text-muted-foreground">Teachers</p><h3 class="text-2xl font-bold mt-1" id="total-teachers">${data.teachers?.length || 0}</h3><p class="text-xs text-green-600 mt-1 flex items-center gap-1"><i data-lucide="trending-up" class="h-3 w-3"></i> +${data.pendingTeachers?.length || 0} pending approval</p></div><div class="h-12 w-12 rounded-lg bg-violet-100 flex items-center justify-center"><i data-lucide="user-plus" class="h-6 w-6 text-violet-600"></i></div></div></div>
                <div class="rounded-xl border bg-card p-6 card-hover"><div class="flex items-center justify-between"><div><p class="text-sm font-medium text-muted-foreground">Classes</p><h3 class="text-2xl font-bold mt-1" id="total-classes">${data.classes?.length || 0}</h3></div><div class="h-12 w-12 rounded-lg bg-emerald-100 flex items-center justify-center"><i data-lucide="book-open" class="h-6 w-6 text-emerald-600"></i></div></div></div>
                <div class="rounded-xl border bg-card p-6 card-hover"><div class="flex items-center justify-between"><div><p class="text-sm font-medium text-muted-foreground">Attendance Rate</p><h3 class="text-2xl font-bold mt-1">94.2%</h3></div><div class="h-12 w-12 rounded-lg bg-amber-100 flex items-center justify-center"><i data-lucide="calendar-check" class="h-6 w-6 text-amber-600"></i></div></div></div>
            </div>
            <div class="grid gap-4 lg:grid-cols-2">
                <div class="rounded-xl border bg-card p-6"><div class="flex items-center justify-between mb-4"><h3 class="font-semibold">Enrollment Trends</h3></div><div class="chart-container h-64"><canvas id="admin-enrollmentChart"></canvas></div></div>
                <div class="rounded-xl border bg-card p-6"><div class="flex items-center justify-between mb-4"><h3 class="font-semibold">Grade Distribution</h3></div><div class="chart-container h-64"><canvas id="admin-gradeChart"></canvas></div></div>
            </div>
        </div>
    `;
}

async function renderAdminStudents() {
    try {
        const students = await loadAllStudents();

        return `
            <div class="space-y-6 animate-fade-in">
                <div class="flex justify-between items-center">
                    <h2 class="text-2xl font-bold">Student Management</h2>
                    <button onclick="showAddStudentModal()" class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 flex items-center gap-2">
                        <i data-lucide="plus" class="h-4 w-4"></i>
                        Add Student
                    </button>
                </div>

                <div class="grid gap-4 md:grid-cols-4">
                    <div class="rounded-xl border bg-card p-4">
                        <p class="text-sm text-muted-foreground">Total Students</p>
                        <p class="text-2xl font-bold">${students.length}</p>
                    </div>
                    <div class="rounded-xl border bg-card p-4">
                        <p class="text-sm text-muted-foreground">Active</p>
                        <p class="text-2xl font-bold text-green-600">${students.filter(s => s.status === 'active').length}</p>
                    </div>
                    <div class="rounded-xl border bg-card p-4">
                        <p class="text-sm text-muted-foreground">inactive</p>
                        <p class="text-2xl font-bold text-red-600">${students.filter(s => s.status === 'inactive').length}</p>
                    </div>
                    <div class="rounded-xl border bg-card p-4">
                        <p class="text-sm text-muted-foreground">Graduated</p>
                        <p class="text-2xl font-bold text-blue-600">${students.filter(s => s.status === 'graduated').length}</p>
                    </div>
                </div>

                <div class="rounded-xl border bg-card overflow-hidden">
                    <div class="overflow-x-auto">
                        <table class="w-full text-sm">
                            <thead class="bg-muted/50">
                                <tr>
                                    <th class="px-4 py-3 text-left font-medium">Student</th>
                                    <th class="px-4 py-3 text-left font-medium">ELIMUID</th>
                                    <th class="px-4 py-3 text-left font-medium">Grade</th>
                                    <th class="px-4 py-3 text-left font-medium">Status</th>
                                    <th class="px-4 py-3 text-left font-medium">Parent Email</th>
                                    <th class="px-4 py-3 text-center font-medium">Actions</th>
                                 </thead>
                            <tbody class="divide-y" id="students-table-body">
                                ${students.map(student => {
                                    const user = student.User || {};
                                    const name = user.name || 'Unknown';
                                    const email = user.email || 'N/A';
                                    const status = student.status || 'active';
                                    const statusClass = status === 'active' ? 'bg-green-100 text-green-700' : 
                                                       status === 'inactive' ? 'bg-red-100 text-red-700' : 
                                                       'bg-gray-100 text-gray-700';
                                    const initials = getInitials(name);

                                    return `
                                        <tr class="hover:bg-accent/50 transition-colors">
                                            <td class="px-4 py-3">
                                                <div class="flex items-center gap-3">
                                                    <div class="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                                        <span class="font-medium text-blue-700 text-sm">${initials}</span>
                                                    </div>
                                                    <span class="font-medium">${name}</span>
                                                </div>
                                              </td>
                                            <td class="px-4 py-3">
                                                <span class="font-mono text-xs bg-muted px-2 py-1 rounded">${student.elimuid || 'N/A'}</span>
                                              </td>
                                            <td class="px-4 py-3">${student.grade || 'N/A'}</td>
                                            <td class="px-4 py-3">
                                                <span class="px-2 py-1 ${statusClass} text-xs rounded-full">${status}</span>
                                              </td>
                                            <td class="px-4 py-3">${email}</td>
                                            <td class="px-4 py-3 text-center">
                                                <div class="flex items-center justify-center gap-2">
                                                    <button onclick="adminViewStudentDetails('${student.id}')" class="p-2 hover:bg-accent rounded-lg" title="View Details">
                                                        <i data-lucide="eye" class="h-4 w-4 text-blue-600"></i>
                                                    </button>
                                                    <button onclick="adminEditStudent('${student.id}')" class="p-2 hover:bg-accent rounded-lg" title="Edit">
                                                        <i data-lucide="edit" class="h-4 w-4 text-green-600"></i>
                                                    </button>
                                                    ${status === 'active' ? 
                                                        `<button onclick="adminSuspendStudent('${student.id}', '${name}')" class="p-2 hover:bg-yellow-100 rounded-lg" title="Suspend">
                                                            <i data-lucide="pause-circle" class="h-4 w-4 text-yellow-600"></i>
                                                        </button>` : 
                                                        `<button onclick="adminReactivateStudent('${student.id}', '${name}')" class="p-2 hover:bg-green-100 rounded-lg" title="Reactivate">
                                                            <i data-lucide="play-circle" class="h-4 w-4 text-green-600"></i>
                                                        </button>`
                                                    }
                                                    <button onclick="adminDeleteStudent('${student.id}', '${name}')" class="p-2 hover:bg-red-100 rounded-lg" title="Delete">
                                                        <i data-lucide="trash-2" class="h-4 w-4 text-red-600"></i>
                                                    </button>
                                                    <button onclick="copyToClipboard('${student.elimuid}')" class="p-2 hover:bg-purple-100 rounded-lg" title="Copy ELIMUID">
                                                        <i data-lucide="copy" class="h-4 w-4 text-purple-600"></i>
                                                    </button>
                                                </div>
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
        return `<div class="text-center py-12 text-red-500">Error loading students: ${error.message}</div>`;
    }
}

async function renderAdminTeachers() {
    try {
        const teachers = await window.loadAllTeachers();
        const tableHtml = window.renderTeachersTable(teachers);
        return `<div class="space-y-6 animate-fade-in"><h2 class="text-2xl font-bold">Teacher Management</h2><div class="rounded-xl border bg-card overflow-hidden">${tableHtml}</div></div>`;
    } catch (error) {
        return `<div class="text-center py-12 text-red-500">Error loading teachers: ${error.message}</div>`;
    }
}

async function renderAdminPendingTeachers() {
    try {
        const teachers = await window.loadPendingTeachers();
        return `<div class="space-y-6 animate-fade-in"><h2 class="text-2xl font-bold">Pending Teacher Approvals</h2><div class="rounded-xl border bg-card overflow-hidden">${window.renderPendingTeachersTable(teachers)}</div></div>`;
    } catch (error) {
        return `<div class="text-center py-12 text-red-500">Error loading pending teachers: ${error.message}</div>`;
    }
}

async function renderAdminDuty() {
    try {
        const todayDuty = await loadTodayDuty();
        const weeklyDuty = await loadWeeklyDuty();
        const understaffed = await loadUnderstaffedAreas();
        return `
            <div class="space-y-6 animate-fade-in">
                <div class="flex justify-between items-center"><h2 class="text-2xl font-bold">Duty Management</h2><button onclick="handleGenerateDutyRoster()" class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 flex items-center gap-2"><i data-lucide="refresh-cw" class="h-4 w-4"></i> Generate New Roster</button></div>
                ${understaffed && understaffed.length > 0 ? `<div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"><div class="flex items-center gap-2 text-red-700 dark:text-red-400 mb-2"><i data-lucide="alert-triangle" class="h-5 w-5"></i><h3 class="font-semibold">Understaffed Areas Detected</h3></div><div class="space-y-2">${understaffed.map(area => `<div class="text-sm text-red-600 dark:text-red-400">${area.date}: ${area.areas.map(a => `${a.area} (need ${a.required}, have ${a.current})`).join(', ')}</div>`).join('')}</div></div>` : ''}
                <div class="grid gap-4 md:grid-cols-2">
                    <div class="rounded-xl border bg-card p-6"><h3 class="font-semibold mb-4">Generate Duty Roster</h3><div class="space-y-3"><div><label class="block text-sm font-medium mb-1">Start Date</label><input type="date" id="duty-start-date" value="${new Date().toISOString().split('T')[0]}" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"></div><div><label class="block text-sm font-medium mb-1">End Date</label><input type="date" id="duty-end-date" value="${new Date(Date.now() + 7*24*60*60*1000).toISOString().split('T')[0]}" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"></div><button onclick="handleGenerateDutyRoster()" class="w-full bg-primary text-primary-foreground py-2 rounded-lg hover:bg-primary/90">Generate Roster</button></div></div>
                    <div class="rounded-xl border bg-card p-6"><h3 class="font-semibold mb-4">Quick Actions</h3><div class="space-y-2"><button onclick="showDashboardSection('fairness-report')" class="w-full text-left p-3 hover:bg-accent rounded-lg flex items-center gap-3"><i data-lucide="bar-chart-2" class="h-5 w-5 text-blue-600"></i><div><p class="font-medium">Fairness Report</p><p class="text-xs text-muted-foreground">View duty distribution analytics</p></div></button><button onclick="showDashboardSection('teacher-workload')" class="w-full text-left p-3 hover:bg-accent rounded-lg flex items-center gap-3"><i data-lucide="users" class="h-5 w-5 text-green-600"></i><div><p class="font-medium">Teacher Workload</p><p class="text-xs text-muted-foreground">Monitor duty load per teacher</p></div></button></div></div>
                </div>
                <div class="rounded-xl border bg-card p-6"><h3 class="font-semibold mb-4">Today's Duty (${new Date().toLocaleDateString()})</h3><div class="space-y-3">${todayDuty?.duties?.length > 0 ? todayDuty.duties.map(duty => `<div class="flex items-center justify-between p-3 bg-muted/30 rounded-lg"><div><p class="font-medium">${duty.area}</p><p class="text-sm text-muted-foreground">${duty.timeSlot?.start} - ${duty.timeSlot?.end}</p></div><div class="text-right"><p class="font-medium">${duty.teacherName}</p><p class="text-xs ${duty.checkedIn ? 'text-green-600' : 'text-yellow-600'}">${duty.checkedIn ? '✓ Checked In' : '⏳ Pending'}</p></div></div>`).join('') : '<p class="text-center text-muted-foreground py-4">No duty today</p>'}</div></div>
                <div class="rounded-xl border bg-card p-6"><h3 class="font-semibold mb-4">Weekly Schedule</h3><div class="space-y-3">${weeklyDuty?.map(day => `<div class="border rounded-lg overflow-hidden"><div class="bg-muted/30 px-4 py-2 font-medium ${day.isToday ? 'bg-primary/10' : ''}">${day.dayName} ${day.isToday ? '(Today)' : ''}</div><div class="p-3 space-y-2">${day.duties.length > 0 ? day.duties.map(duty => `<div class="flex justify-between text-sm"><span>${duty.area}</span><span>${duty.teacherName}</span></div>`).join('') : '<p class="text-sm text-muted-foreground">No duty</p>'}</div></div>`).join('')}</div></div>
            </div>
        `;
    } catch (error) {
        return `<div class="text-center py-12 text-red-500">Error loading duty: ${error.message}</div>`;
    }
}

async function renderAdminFairnessReport() {
    showLoading();
    try {
        const report = await api.admin.getFairnessReport();
        const fairnessData = report.data || {};
        const hasData = fairnessData.summary && fairnessData.summary.fairnessScore !== undefined;
        return `
            <div class="space-y-6 animate-fade-in">
                <div class="flex justify-between items-center"><h2 class="text-2xl font-bold">Duty Fairness Report</h2><button onclick="renderAdminFairnessReport()" class="px-4 py-2 border rounded-lg hover:bg-accent"><i data-lucide="refresh-cw" class="h-4 w-4"></i> Refresh</button></div>
                ${!hasData ? `<div class="rounded-xl border bg-card p-12 text-center"><i data-lucide="bar-chart-2" class="h-12 w-12 mx-auto text-muted-foreground mb-4"></i><p class="text-muted-foreground">No fairness data available yet.</p><p class="text-xs text-muted-foreground mt-1">Go to Duty Management and generate a roster to see metrics.</p><button onclick="showDashboardSection('duty')" class="mt-4 px-4 py-2 bg-primary text-white rounded-lg">Go to Duty Management</button></div>` : `
                    <div class="grid gap-4 md:grid-cols-3"><div class="rounded-xl border bg-card p-6"><p class="text-sm text-muted-foreground">Fairness Score</p><div class="flex items-end gap-2"><h3 class="text-3xl font-bold">${fairnessData.summary?.fairnessScore || 0}%</h3><span class="text-sm text-muted-foreground mb-1">/ 100</span></div></div><div class="rounded-xl border bg-card p-6"><p class="text-sm text-muted-foreground">Total Duties</p><h3 class="text-3xl font-bold">${fairnessData.summary?.totalDuties || 0}</h3></div><div class="rounded-xl border bg-card p-6"><p class="text-sm text-muted-foreground">Teachers</p><h3 class="text-3xl font-bold">${fairnessData.teacherStats?.length || 0}</h3></div></div>
                    <div class="rounded-xl border bg-card overflow-hidden"><div class="p-4 border-b"><h3 class="font-semibold">Teacher Workload Distribution</h3></div><div class="overflow-x-auto"><table class="w-full text-sm"><thead class="bg-muted/50"><tr><th class="px-4 py-3 text-left">Teacher</th><th class="px-4 py-3 text-left">Department</th><th class="px-4 py-3 text-center">Scheduled</th><th class="px-4 py-3 text-center">Completed</th><th class="px-4 py-3 text-center">Completion Rate</th></tr></thead><tbody class="divide-y">${(fairnessData.teacherStats || []).map(t => `<tr class="hover:bg-accent/50"><td class="px-4 py-3 font-medium">${t.teacherName}</td><td class="px-4 py-3">${t.department}</td><td class="px-4 py-3 text-center">${t.scheduled}</td><td class="px-4 py-3 text-center">${t.completed}</td><td class="px-4 py-3 text-center"><span class="px-2 py-1 rounded-full text-xs ${t.completionRate >= 80 ? 'bg-green-100 text-green-700' : t.completionRate >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}">${t.completionRate}%</span></td></tr>`).join('')}${(!fairnessData.teacherStats || fairnessData.teacherStats.length === 0) ? '<tr><td colspan="5" class="text-center py-8 text-muted-foreground">No data available</td></tr>' : ''}</tbody></table></div></div>
                `}
            </div>
        `;
    } catch (error) {
        return `<div class="text-center py-12 text-red-500">Error loading fairness report: ${error.message}</div>`;
    } finally { hideLoading(); }
}

async function renderAdminTeacherWorkload() {
    try {
        const workload = await loadTeacherWorkload();
        const teachers = workload || [];
        const hasData = teachers.length > 0;
        return `
            <div class="space-y-6 animate-fade-in">
                <h2 class="text-2xl font-bold">Teacher Workload Monitor</h2>
                ${!hasData ? `<div class="rounded-xl border bg-card p-12 text-center"><i data-lucide="users" class="h-12 w-12 mx-auto text-muted-foreground mb-4"></i><p class="text-muted-foreground">No workload data available yet.</p><p class="text-xs text-muted-foreground mt-1">Once duties are assigned, teacher workloads will appear here.</p><button onclick="showDashboardSection('duty')" class="mt-4 px-4 py-2 bg-primary text-white rounded-lg">Go to Duty Management</button></div>` : `
                    <div class="grid gap-4 md:grid-cols-3"><div class="rounded-xl border bg-card p-6"><p class="text-sm text-muted-foreground">Overworked Teachers</p><h3 class="text-3xl font-bold text-red-600">${teachers.filter(t => t.status === 'overworked').length}</h3></div><div class="rounded-xl border bg-card p-6"><p class="text-sm text-muted-foreground">Balanced Teachers</p><h3 class="text-3xl font-bold text-green-600">${teachers.filter(t => t.status === 'balanced').length}</h3></div><div class="rounded-xl border bg-card p-6"><p class="text-sm text-muted-foreground">Underworked Teachers</p><h3 class="text-3xl font-bold text-yellow-600">${teachers.filter(t => t.status === 'underworked').length}</h3></div></div>
                    <div class="rounded-xl border bg-card overflow-hidden"><div class="p-4 border-b"><h3 class="font-semibold">Current Workload Distribution</h3></div><div class="overflow-x-auto"><table class="w-full text-sm"><thead class="bg-muted/50"><tr><th class="px-4 py-3 text-left">Teacher</th><th class="px-4 py-3 text-left">Department</th><th class="px-4 py-3 text-center">Monthly Duties</th><th class="px-4 py-3 text-center">Weekly Duties</th><th class="px-4 py-3 text-center">Reliability</th><th class="px-4 py-3 text-center">Status</th></tr></thead><tbody class="divide-y">${teachers.map(teacher => `<tr class="hover:bg-accent/50"><td class="px-4 py-3 font-medium">${teacher.teacherName}</td><td class="px-4 py-3">${teacher.department}</td><td class="px-4 py-3 text-center">${teacher.monthlyDutyCount}</td><td class="px-4 py-3 text-center">${teacher.weeklyDutyCount}</td><td class="px-4 py-3 text-center">${teacher.reliabilityScore}</td><td class="px-4 py-3 text-center"><span class="px-2 py-1 ${teacher.status === 'overworked' ? 'bg-red-100 text-red-700' : teacher.status === 'underworked' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'} text-xs rounded-full">${teacher.status}</span></td></tr>`).join('')}</tbody></table></div></div>
                `}
            </div>
        `;
    } catch (error) {
        return `<div class="text-center py-12 text-red-500">Error loading workload: ${error.message}</div>`;
    }
}

function renderAdminSettings() {
    const curriculum = schoolSettings.curriculum || 'cbc';
    const schoolLevel = schoolSettings.schoolLevel || 'secondary';
    const curriculumInfo = (window.CURRICULUMS && window.CURRICULUMS[curriculum]) ? window.CURRICULUMS[curriculum] : { subjects: { secondary: [] } };
    const levelInfo = curriculumInfo?.levels[schoolLevel] || [];
    const subjectInfo = curriculumInfo?.subjects[schoolLevel] || [];
    return `
        <div class="space-y-6 animate-fade-in">
            <h2 class="text-2xl font-bold">School Settings</h2>
            <p class="text-sm text-muted-foreground">Changes made here will reflect across all dashboards for this school.</p>
            <div class="grid gap-6">
                <div class="rounded-xl border bg-card p-6"><h3 class="font-semibold mb-4">School Information</h3><div class="space-y-4"><div><label class="block text-sm font-medium mb-1">School Name</label><input type="text" id="settings-school-name" value="${schoolSettings.name || schoolSettings.schoolName || ''}" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"></div><div><label class="block text-sm font-medium mb-1">School Level</label><select id="settings-school-level" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"><option value="primary" ${schoolLevel === 'primary' ? 'selected' : ''}>Primary</option><option value="secondary" ${schoolLevel === 'secondary' ? 'selected' : ''}>Secondary</option><option value="both" ${schoolLevel === 'both' ? 'selected' : ''}>Both</option></select></div></div></div>
                <div class="rounded-xl border bg-card p-6"><h3 class="font-semibold mb-4">Curriculum Settings</h3><div class="space-y-4"><div><label class="block text-sm font-medium mb-1">Select Curriculum</label><select id="settings-curriculum" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"><option value="cbc" ${curriculum === 'cbc' ? 'selected' : ''}>CBC</option><option value="844" ${curriculum === '844' ? 'selected' : ''}>8-4-4</option><option value="british" ${curriculum === 'british' ? 'selected' : ''}>British</option><option value="american" ${curriculum === 'american' ? 'selected' : ''}>American</option></select></div><div class="p-4 bg-muted/30 rounded-lg"><h4 class="font-sm font-medium mb-2">Curriculum Information</h4><p class="text-sm text-muted-foreground"><span class="font-medium">Name:</span> ${curriculumInfo?.name || 'N/A'}</p><p class="text-sm text-muted-foreground mt-1"><span class="font-medium">Grade Levels:</span> ${levelInfo.join(', ')}</p><p class="text-sm text-muted-foreground mt-1"><span class="font-medium">Core Subjects:</span> ${subjectInfo.join(', ')}</p></div></div></div>
                <div class="flex justify-end"><button onclick="saveAllSettings()" class="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">Save Settings</button></div>
            </div>
        </div>
    `;
}

function renderAdminCustomSubjects() {
    const curriculum = window.schoolSettings?.curriculum || 'cbc';
    const schoolLevel = window.schoolSettings?.schoolLevel || 'secondary';
    const curriculumInfo = (window.CURRICULUMS && window.CURRICULUMS[curriculum]) ? window.CURRICULUMS[curriculum] : { subjects: { secondary: [] } };
    const subjectInfo = curriculumInfo?.subjects[schoolLevel] || [];
    return `
        <div class="space-y-6 animate-fade-in">
            <div class="flex justify-between items-center"><h2 class="text-2xl font-bold">Custom Subjects</h2></div>
            <p class="text-sm text-muted-foreground">Add subjects that are not in the standard curriculum</p>
            <div class="rounded-xl border bg-card p-6">
                <div class="space-y-4">
                    <div class="flex gap-2"><input type="text" id="new-subject-name" placeholder="e.g., French, Computer Science, Art" class="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm"><button onclick="addCustomSubject()" class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">Add Subject</button></div>
                    <div><h4 class="text-sm font-medium mb-3">Curriculum Subjects</h4><div class="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">${subjectInfo.map(subject => `<div class="flex items-center justify-between p-3 bg-muted/30 rounded-lg border"><span class="text-sm font-medium">${subject}</span><span class="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">core</span></div>`).join('')}</div></div>
                    <div><h4 class="text-sm font-medium mb-3">Custom Subjects</h4><div class="grid grid-cols-2 md:grid-cols-3 gap-3" id="custom-subjects-container">${customSubjects && customSubjects.length > 0 ? customSubjects.map(subject => `<div class="custom-subject-item flex items-center justify-between p-3 bg-secondary/30 rounded-lg border group" data-subject="${subject}"><span class="text-sm font-medium">${subject}</span><button onclick="removeCustomSubject('${subject}')" class="text-red-500 hover:text-red-700"><i data-lucide="x" class="h-4 w-4"></i></button></div>`).join('') : '<p class="text-sm text-muted-foreground col-span-3 py-4 text-center bg-muted/30 rounded-lg" id="no-custom-subjects-message">No custom subjects added yet</p>'}</div></div>
                </div>
            </div>
            <div class="flex justify-end"><button onclick="saveAllSettings()" class="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 flex items-center gap-2"><i data-lucide="save" class="h-4 w-4"></i> Save Changes</button></div>
        </div>
    `;
}

// ============ CUSTOM SUBJECT ACTIONS ============
window.addCustomSubject = async function() {
    const newSubject = document.getElementById('new-subject-name')?.value.trim();
    if (!newSubject) { showToast('Please enter a subject name', 'error'); return; }
    const updatedSubjects = [...(customSubjects || []), newSubject];
    showLoading();
    try {
        const response = await api.admin.updateSchoolSettings({ customSubjects: updatedSubjects });
        if (response?.success) {
            customSubjects = updatedSubjects;
            window.customSubjects = updatedSubjects;
            window.schoolSettings = response.data;
            localStorage.setItem('schoolSettings', JSON.stringify(response.data));
            await showDashboardSection('custom-subjects');
            showToast(`Subject "${newSubject}" added`, 'success');
            await refreshClassManagementIfVisible();
        } else {
            throw new Error(response?.message || 'Save failed');
        }
    } catch (error) { showToast(error.message, 'error'); }
    finally { hideLoading(); }
};

window.removeCustomSubject = async function(subject) {
    if (!confirm(`Remove "${subject}" from custom subjects?`)) return;
    const updatedSubjects = (customSubjects || []).filter(s => s !== subject);
    showLoading();
    try {
        const response = await api.admin.updateSchoolSettings({ customSubjects: updatedSubjects });
        if (response?.success) {
            customSubjects = updatedSubjects;
            window.customSubjects = updatedSubjects;
            window.schoolSettings = response.data;
            localStorage.setItem('schoolSettings', JSON.stringify(response.data));
            await showDashboardSection('custom-subjects');
            showToast(`Subject "${subject}" removed`, 'info');
            await refreshClassManagementIfVisible();
        } else {
            throw new Error(response?.message || 'Save failed');
        }
    } catch (error) { showToast(error.message, 'error'); }
    finally { hideLoading(); }
};

window.saveAllSettings = async function() {
    const curriculum = document.getElementById('settings-curriculum')?.value;
    const schoolName = document.getElementById('settings-school-name')?.value;
    const schoolLevel = document.getElementById('settings-school-level')?.value;
    if (!schoolName) { showToast('School name is required', 'error'); return; }
    showLoading();
    try {
        const response = await api.admin.updateSchoolSettings({ curriculum, schoolName, schoolLevel, customSubjects });;
        if (response && response.success) {
            window.schoolSettings = response.data;
            window.customSubjects = response.data.settings?.customSubjects || [];
            localStorage.setItem('schoolSettings', JSON.stringify(response.data));
            const school = JSON.parse(localStorage.getItem('school') || '{}');
            school.name = schoolName;
            school.system = curriculum;
            school.settings = response.data.settings;
            localStorage.setItem('school', JSON.stringify(school));
            updateAllSchoolNameElements(schoolName);
            showToast('✅ Settings saved!', 'success');
            await updateAdminStats();
        } else {
            throw new Error(response?.message || 'Save failed');
        }
    } catch (error) {
        console.error('Save error:', error);
        showToast(error.message || 'Failed to save settings', 'error');
    } finally { hideLoading(); }
};

// ============ HELP SECTION ============
function renderHelpSection() {
    const user = getCurrentUser();
    const role = user?.role || 'user';
    const helpArticles = {
        superadmin: [{ title: 'How to approve a new school', content: 'Go to School Approvals, review school details, click Approve. The school will be activated immediately.', keywords: ['approve', 'school', 'activate'] }],
        admin: [{ title: 'How to add a student', content: 'Go to Students, click Add Student, fill in details. The student receives an ELIMUID automatically.', keywords: ['add', 'student'] }, { title: 'How to approve a teacher', content: 'Go to Teacher Approvals, review teacher details, click Approve or Reject.', keywords: ['teacher', 'approve'] }, { title: 'How to generate duty roster', content: 'Go to Duty Management, select dates, click Generate Roster.', keywords: ['duty', 'roster'] }, { title: 'How to change curriculum', content: 'Go to Settings, select new curriculum, click Save.', keywords: ['curriculum', 'change'] }],
        teacher: [{ title: 'How to take attendance', content: 'Go to Attendance, mark each student as Present/Absent/Late, add notes, click Save Attendance.', keywords: ['attendance'] }, { title: 'How to enter grades', content: 'Go to Grades, select subject and assessment type, enter scores, click Save.', keywords: ['grade', 'marks'] }, { title: 'How to check in for duty', content: 'Go to Dashboard, find Duty Card, click Check In.', keywords: ['duty', 'checkin'] }],
        parent: [{ title: 'How to view child progress', content: 'Select your child from the top, view grades, attendance, and teacher comments.', keywords: ['progress', 'grades'] }, { title: 'How to report absence', content: 'Click Report Absence, select date, enter reason, submit.', keywords: ['absence', 'report'] }, { title: 'How to make payment', content: 'Go to Payments, select child, choose plan, enter amount, complete payment.', keywords: ['payment'] }],
        student: [{ title: 'How to view my grades', content: 'Go to My Grades to see all your scores and performance.', keywords: ['grade'] }, { title: 'How to use AI Tutor', content: 'Type your question in AI Tutor chat, get instant help.', keywords: ['ai', 'tutor'] }, { title: 'How to join study groups', content: 'Go to Study Chat to connect with other students.', keywords: ['study', 'chat'] }]
    };
    const articles = helpArticles[role] || helpArticles.admin;
    return `
        <div class="space-y-6 animate-fade-in max-w-5xl mx-auto">
            <div class="text-center"><h2 class="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Help Center</h2><p class="text-muted-foreground mt-2">Find answers to common questions and learn how to use the platform</p></div>
            <div class="relative"><i data-lucide="search" class="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground"></i><input type="text" id="help-search" placeholder="Search help articles..." onkeyup="searchHelpArticles()" class="w-full pl-10 pr-4 py-3 rounded-xl border bg-card focus:ring-2 focus:ring-primary transition-all"></div>
            <div id="help-articles-container" class="grid gap-4">${articles.map(article => `<div class="help-article rounded-xl border bg-card p-6 hover:shadow-md transition-all cursor-pointer" data-title="${article.title.toLowerCase()}" data-content="${article.content.toLowerCase()}" data-keywords="${article.keywords.join(' ').toLowerCase()}" onclick="showHelpArticleDetail('${article.title.replace(/'/g, "\\'")}', '${article.content.replace(/'/g, "\\'")}')"><h3 class="font-semibold text-lg mb-2">📚 ${article.title}</h3><p class="text-muted-foreground">${article.content.substring(0, 150)}${article.content.length > 150 ? '...' : ''}</p></div>`).join('')}</div>
            <div class="rounded-xl border bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 p-6 text-center"><h3 class="font-semibold text-lg mb-2">💬 Still Need Help?</h3><p class="text-muted-foreground mb-4">Contact our support team for assistance</p><div class="flex gap-3 justify-center"><button onclick="showToast('Opening support chat...', 'info')" class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"><i data-lucide="message-circle" class="h-4 w-4 inline mr-2"></i> Live Chat</button><button onclick="window.location.href='mailto:support@shuleai.com'" class="px-4 py-2 border rounded-lg hover:bg-accent"><i data-lucide="mail" class="h-4 w-4 inline mr-2"></i> Email Support</button></div></div>
        </div>
    `;
}

window.searchHelpArticles = function() {
    const searchTerm = document.getElementById('help-search')?.value.toLowerCase().trim();
    const articles = document.querySelectorAll('.help-article');
    if (!searchTerm) { articles.forEach(a => a.style.display = 'block'); return; }
    let found = 0;
    articles.forEach(article => {
        const title = article.dataset.title || '';
        const content = article.dataset.content || '';
        const keywords = article.dataset.keywords || '';
        const matches = title.includes(searchTerm) || content.includes(searchTerm) || keywords.includes(searchTerm);
        article.style.display = matches ? 'block' : 'none';
        if (matches) found++;
    });
    const container = document.getElementById('help-articles-container');
    let noResults = document.getElementById('no-results-message');
    if (found === 0 && searchTerm) {
        if (!noResults) {
            const msg = document.createElement('div');
            msg.id = 'no-results-message';
            msg.className = 'text-center py-12 col-span-full';
            msg.innerHTML = `<i data-lucide="search-x" class="h-12 w-12 mx-auto text-muted-foreground mb-3"></i><p class="text-muted-foreground">No results found for "${searchTerm}"</p><p class="text-sm text-muted-foreground mt-1">Try different keywords or contact support</p>`;
            container.appendChild(msg);
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }
    } else if (noResults) { noResults.remove(); }
};

window.showHelpArticleDetail = function(title, content) {
    let modal = document.getElementById('help-article-modal');
    if (!modal) {
        const modalHTML = `<div id="help-article-modal" class="fixed inset-0 z-50 hidden"><div class="absolute inset-0 bg-black/50" onclick="closeHelpArticleModal()"></div><div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md p-4"><div class="rounded-xl border bg-card p-6 shadow-xl animate-fade-in"><div class="modal-content"></div></div></div></div>`;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        modal = document.getElementById('help-article-modal');
    }
    const modalContent = modal.querySelector('.modal-content');
    if (modalContent) {
        modalContent.innerHTML = `<div class="space-y-4"><div class="border-b pb-3"><h3 class="text-xl font-semibold">${title}</h3></div><div class="prose prose-sm max-w-none"><p class="text-muted-foreground">${content}</p></div><div class="flex justify-end gap-2 pt-4 border-t"><button onclick="closeHelpArticleModal()" class="px-4 py-2 border rounded-lg hover:bg-accent">Close</button><button onclick="window.location.href='mailto:support@shuleai.com'" class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">Contact Support</button></div></div>`;
    }
    modal.classList.remove('hidden');
    if (typeof lucide !== 'undefined') lucide.createIcons();
};

function closeHelpArticleModal() { const m = document.getElementById('help-article-modal'); if(m) m.classList.add('hidden'); }

// ============ EXPORT FUNCTIONS ============
window.renderAdminSection = renderAdminSection;
window.renderAdminDashboard = renderAdminDashboard;
window.renderAdminStudents = renderAdminStudents;
window.renderAdminTeachers = renderAdminTeachers;
window.renderAdminPendingTeachers = renderAdminPendingTeachers;
window.renderAdminDuty = renderAdminDuty;
window.renderAdminFairnessReport = renderAdminFairnessReport;
window.renderAdminTeacherWorkload = renderAdminTeacherWorkload;
window.renderAdminSettings = renderAdminSettings;
window.renderAdminCustomSubjects = renderAdminCustomSubjects;
window.addCustomSubject = addCustomSubject;
window.removeCustomSubject = removeCustomSubject;
window.saveAllSettings = saveAllSettings;
