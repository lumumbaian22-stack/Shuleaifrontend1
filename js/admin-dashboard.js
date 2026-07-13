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
                                        ${student.isPrefect ? '<span class="ml-2 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800"><i data-lucide="shield" class="h-3 w-3 mr-1"></i>Prefect</span>' : ''}
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
                                        ${avatarHTML(teacher.User?.name || 'Unknown', teacher.User?.profileImage || teacher.User?.profilePicture || teacher.profileImage || teacher.profilePicture, 'h-8 w-8')}
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
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                    <option value="graduated">Graduated</option>
                                    <option value="transferred">Transferred</option>
                                </select>
                            </div>
                            <div>
                                <label class="flex items-center gap-2">
                                    <input type="checkbox" id="edit-student-prefect" class="rounded">
                                    <span class="text-sm font-medium">School Prefect</span>
                                </label>
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
            ${avatarHTML(student.User?.name || 'Student', student.User?.profileImage || student.User?.profilePicture || student.profileImage || student.profilePicture, 'h-16 w-16')}
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
    document.getElementById('edit-student-prefect').checked = student.isPrefect || false; // <-- new line
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
            ${avatarHTML(teacher.User?.name || 'Teacher', teacher.User?.profileImage || teacher.User?.profilePicture || teacher.profileImage || teacher.profilePicture, 'h-16 w-16')}
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
    if (!confirm('Deactivate this teacher? Their history and assignments will be preserved.')) return;
    try {
        await api.admin.deleteTeacher(teacherId);
        showToast('Teacher deactivated safely', 'success');
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
    if (!id) return;
    showLoading();
    try {
        const name = document.getElementById('edit-student-name')?.value;
        const email = document.getElementById('edit-student-email')?.value?.trim();
        const grade = document.getElementById('edit-student-grade')?.value;
        const status = document.getElementById('edit-student-status')?.value;
        const isPrefect = document.getElementById('edit-student-prefect')?.checked || false;

        const updateData = { name, grade, status, isPrefect };
        // Only include email if it's a non‑empty valid email
        if (email) updateData.email = email;

        await api.admin.updateStudent(id, updateData);
        showToast('Student updated', 'success');
        closeEditStudentModal();
        await renderAdminStudents();
    } catch (e) {
        showToast(e.message, 'error');
    } finally {
        hideLoading();
    }
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
            case 'calendar-management':
                return await window.v12RenderAcademicCalendar();
            case 'students': {
                const html = await renderAdminStudents();
                return renderAdminStudentSubjectToolbar(html);
            }
            case 'student-subject-selection':
                return await renderAdminStudentSubjectSelection();
            case 'student-lifecycle':
                return await window.renderStudentLifecycleHome();
            case 'class-transfers':
                return await window.renderClassTransferCentre('admin');
            case 'birthdays':
                return await window.renderBirthdayCentre('admin');
            case 'report-history':
                return await window.renderReportHistoryCentre('admin');
            case 'academic-year-transition':
                return await window.renderAcademicYearTransition();
            case 'attendance-corrections':
                return await window.renderAttendanceCorrections();
            case 'timetable':
                 return await (window.v12RenderAdminTimetable || window.renderAdminTimetable)();
            case 'calendar':
                await refreshCalendarEvents();
                return renderAdminCalendar();
            case 'teachers':
                return await renderAdminTeachers();
            case 'departments':
                return await renderAdminDepartments();
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
                return await renderAdminSmartDuty();
            case 'profile': return await renderProfileSection();    
            case 'fairness-report':
                return await renderAdminFairnessReport();
            case 'custom-subjects':
                return renderAdminCustomSubjects();
            case 'report-settings':
                return await renderAdminReportSettings();
            case 'teacher-workload':
                return await renderAdminTeacherWorkload();
            case 'settings':
                return renderAdminSettings();
            case 'school-branding':
                return renderAdminBrandingSection ? await renderAdminBrandingSection() : await renderAdminSettings('branding');
            case 'subscription-billing':
                return `${await renderAdminSubscriptionBilling()}<div class="mt-6">${renderAdminPaymentConfirmationCard()}</div>`;
            case 'sms':
                return await renderAdminSms();
            case 'alerts':
                return await (window.v12RenderAlertsCenter || window.renderAlertsCenter)('admin');
            case 'parent-messages':
                return await renderAdminParentMessages();
            case 'finance-fees':
            case 'fee-structures':
                if (typeof window.v31RenderFinanceFeesSection === 'function') {
                    const tab = section === 'fee-structures' ? 'structures' : 'overview';
                    return await window.v31RenderFinanceFeesSection(tab);
                }
                if (typeof window.v31RenderFinanceFees === 'function') {
                    return await window.v31RenderFinanceFees();
                }
                return '<div class="text-center py-12 text-red-500">Finance & Fees module not loaded. Please refresh the page.</div>';
            default:
                return '<div class="text-center py-12">Section not found</div>';
        }
    } catch (error) {
        console.error('Error rendering admin section:', error);
        return `<div class="text-center py-12 text-red-500">Error loading section: ${error.message}</div>`;
    }
}

function adminSubscriptionReminderHtml(enforcement = {}) {
    if (!enforcement || enforcement.enforcementEnabled !== true) return '';
    const state = String(enforcement.billingState || '').toLowerCase();
    if (!['payment_required', 'due_soon', 'grace', 'restricted', 'overdue'].includes(state)) return '';

    const restricted = enforcement.restricted === true || ['restricted', 'overdue'].includes(state);
    const dueDate = enforcement.nextDueDate ? new Date(enforcement.nextDueDate) : null;
    const graceDate = enforcement.graceEndsAt ? new Date(enforcement.graceEndsAt) : null;
    const dueText = dueDate && !Number.isNaN(dueDate.getTime()) ? dueDate.toLocaleDateString() : 'now';
    const graceText = graceDate && !Number.isNaN(graceDate.getTime()) ? graceDate.toLocaleString() : '';
    const cycle = escapeHtml(String(enforcement.billingCycle || 'monthly').replace(/_/g, ' '));
    const period = enforcement.academicPeriod?.term
        ? `${escapeHtml(enforcement.academicPeriod.term)} ${escapeHtml(enforcement.academicPeriod.academicYear || '')}`
        : (enforcement.academicPeriod?.academicYear ? `Academic year ${escapeHtml(enforcement.academicPeriod.academicYear)}` : '');

    return `
        <div class="rounded-xl border ${restricted ? 'border-red-300 bg-red-50 text-red-950 dark:border-red-700 dark:bg-red-950/30 dark:text-red-100' : 'border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-100'} p-4 shadow-sm">
            <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <h3 class="font-semibold">${restricted ? 'Subscription payment overdue — access is restricted' : 'Shule AI subscription payment reminder'}</h3>
                    <p class="mt-1 text-sm">Your ${cycle} payment is due ${dueText}.${restricted ? ' Pay to restore full access; no school data has been deleted.' : ' Reminders continue until payment is confirmed.'}</p>
                    ${period ? `<p class="mt-1 text-xs">Billing period: ${period}</p>` : ''}
                    ${graceText ? `<p class="mt-1 text-xs">Grace period ends: ${graceText}</p>` : ''}
                </div>
                <button type="button" onclick="showDashboardSection('subscription-billing')" class="shrink-0 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">Open Subscription & Billing</button>
            </div>
        </div>`;
}

async function refreshAdminSubscriptionReminder() {
    const target = document.getElementById('admin-subscription-reminder');
    if (!target || !window.api?.subscription?.getSchoolStatus) return;
    try {
        const response = await api.subscription.getSchoolStatus();
        const enforcement = response?.data?.enforcement || {};
        window.__schoolSubscriptionEnforcement = enforcement;
        target.innerHTML = adminSubscriptionReminderHtml(enforcement);
        if (typeof lucide !== 'undefined' && lucide?.createIcons) lucide.createIcons();
    } catch (error) {
        console.warn('[Subscription] Could not refresh dashboard reminder:', error?.message || error);
    }
}

function renderAdminDashboard() {
    const school = getCurrentSchool();
    const currentUser = typeof getCurrentUser === 'function' ? getCurrentUser() : {};
    const schoolJoinCode = school?.schoolCode || school?.schoolId || school?.code || currentUser?.schoolCode || school?.shortCode || 'Not assigned';
    const data = dashboardData || {};
    const calendarAllowed = typeof hasSchoolFeature === 'function' ? hasSchoolFeature('calendar') : true;
    const cachedEnforcement = window.__schoolSubscriptionEnforcement || school?.settings?.billing || {};
    const totalStudents = Array.isArray(data.students) ? data.students.length : Number(data.studentsCount ?? data.stats?.students ?? data.students ?? 0);
    const totalTeachers = Array.isArray(data.teachers) ? data.teachers.length : Number(data.teachersCount ?? data.stats?.teachers ?? data.teachers ?? 0);
    const totalClasses = Array.isArray(data.classes) ? data.classes.length : Number(data.classesCount ?? data.stats?.classes ?? data.classes ?? 0);
    const pendingTeachersCount = Array.isArray(data.pendingTeachers) ? data.pendingTeachers.length : Number(data.pendingTeachersCount ?? data.stats?.pendingApprovals ?? data.pendingApprovals ?? 0);
    setTimeout(() => {
        if (calendarAllowed && typeof window.loadAdminCalendarPreviewEvents === 'function') window.loadAdminCalendarPreviewEvents();
        if (typeof window.setupAnnouncementRecipientControls === 'function') window.setupAnnouncementRecipientControls();
        if (typeof window.v130UpdateSmsEstimate === 'function') window.v130UpdateSmsEstimate();
        refreshAdminSubscriptionReminder();
    }, 120);
    return `
        <div class="space-y-6 animate-fade-in">
            <div id="admin-subscription-reminder">${adminSubscriptionReminderHtml(cachedEnforcement)}</div>
            <!-- School Profile Card -->
            <div class="rounded-xl border bg-card p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 card-hover">
                <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <div class="flex items-center gap-3 mb-2">
                            <h2 id="dashboard-school-name" class="text-2xl font-bold">${school?.name || 'Your School'}</h2>
                            <span class="px-3 py-1 ${school?.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'} text-xs rounded-full">${school?.status || 'pending'}</span>
                        </div>
                        <div class="flex items-center gap-4">
                            <p class="text-sm"><span class="font-mono bg-muted px-2 py-1 rounded">Teacher signup code: ${escapeHtml(schoolJoinCode)}</span></p>
                        </div>
                    </div>
                    <div class="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm">
                        <p class="text-xs text-muted-foreground">Give this code to teachers during signup</p>
                        <div class="flex items-center gap-2"><p class="text-lg font-mono font-bold">${escapeHtml(schoolJoinCode)}</p><button class="text-xs px-2 py-1 rounded border" data-code="${escapeHtml(schoolJoinCode)}" onclick="navigator.clipboard?.writeText(this.dataset.code || '');showToast('School code copied','success')">Copy</button></div>
                    </div>
                </div>
            </div>

            <!-- Stats Grid -->
            <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div class="rounded-xl border bg-card p-6 card-hover"><div class="flex items-center justify-between"><div><p class="text-sm font-medium text-muted-foreground">Total Students</p><h3 class="text-2xl font-bold mt-1" id="total-students">${totalStudents}</h3></div><div class="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center"><i data-lucide="users" class="h-6 w-6 text-blue-600"></i></div></div></div>
                <div class="rounded-xl border bg-card p-6 card-hover"><div class="flex items-center justify-between"><div><p class="text-sm font-medium text-muted-foreground">Teachers</p><h3 class="text-2xl font-bold mt-1" id="total-teachers">${totalTeachers}</h3><p class="text-xs text-green-600 mt-1 flex items-center gap-1"><i data-lucide="trending-up" class="h-3 w-3"></i> +${pendingTeachersCount} pending approval</p></div><div class="h-12 w-12 rounded-lg bg-violet-100 flex items-center justify-center"><i data-lucide="user-plus" class="h-6 w-6 text-violet-600"></i></div></div></div>
                <div class="rounded-xl border bg-card p-6 card-hover"><div class="flex items-center justify-between"><div><p class="text-sm font-medium text-muted-foreground">Classes</p><h3 class="text-2xl font-bold mt-1" id="total-classes">${totalClasses}</h3></div><div class="h-12 w-12 rounded-lg bg-emerald-100 flex items-center justify-center"><i data-lucide="book-open" class="h-6 w-6 text-emerald-600"></i></div></div></div>
                <div class="rounded-xl border bg-card p-6 card-hover"><div class="flex items-center justify-between"><div><p class="text-sm font-medium text-muted-foreground">Attendance Rate</p><h3 class="text-2xl font-bold mt-1">94.2%</h3></div><div class="h-12 w-12 rounded-lg bg-amber-100 flex items-center justify-center"><i data-lucide="calendar-check" class="h-6 w-6 text-amber-600"></i></div></div></div>
            </div>

            <!-- Quick Actions -->
            <div class="grid gap-4 md:grid-cols-3">
                <button onclick="showDashboardSection('teacher-approvals')" class="p-6 border rounded-lg hover:bg-accent transition-colors text-left">
                    <i data-lucide="user-plus" class="h-8 w-8 text-blue-600 mb-3"></i>
                    <h4 class="font-semibold">Teacher Approvals</h4>
                    <p class="text-sm text-muted-foreground">Approve pending teachers</p>
                    <span class="mt-2 inline-flex items-center rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700" id="pending-count-badge">${pendingTeachersCount} pending</span>
                </button>
                <button onclick="showDashboardSection('students')" class="p-6 border rounded-lg hover:bg-accent transition-colors text-left">
                    <i data-lucide="users" class="h-8 w-8 text-green-600 mb-3"></i>
                    <h4 class="font-semibold">Student Management</h4>
                    <p class="text-sm text-muted-foreground">View and manage all students</p>
                </button>
                <button onclick="showDashboardSection('settings')" class="p-6 border rounded-lg hover:bg-accent transition-colors text-left">
                    <i data-lucide="settings" class="h-8 w-8 text-purple-600 mb-3"></i>
                    <h4 class="font-semibold">School Settings</h4>
                    <p class="text-sm text-muted-foreground">Configure curriculum and subjects</p>
                </button>
            </div>

            <!-- Send Announcement Card with Shule AI suggestions -->
            <div class="rounded-xl border bg-card p-6">
                <h3 class="font-semibold mb-4 flex items-center gap-2">
                    <i data-lucide="megaphone" class="h-5 w-5 text-primary"></i>
                    📢 Send Announcement
                    <span class="ml-auto text-[11px] rounded-full bg-primary/10 text-primary px-2 py-1">✨ Shule AI Announcement Assistant</span>
                </h3>
                <div class="space-y-3">
                    <div class="grid gap-3 md:grid-cols-2">
                        <div>
                            <label class="block text-sm font-medium mb-1">Recipients</label>
                            <select id="announcement-recipients" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                                <option value="all_parents">All Parents</option>
                                <option value="whole_school">Whole School</option>
                                <option value="specific_class">Specific Class</option>
                                <option value="individual_parent">Individual Parent</option>
                                <option value="teachers">Teachers</option>
                                <option value="students">Students</option>
                                <option value="fee_defaulters">Fee Defaulters</option>
                                <option value="pending_payments">Parents with Pending Payments</option>
                                <option value="subscription_expiry">Parents with Subscription Expiry</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium mb-1">Topic</label>
                            <select id="announcement-ai-topic" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                                <option value="Fee reminder">Fee reminder</option>
                                <option value="School event">School event</option>
                                <option value="Exam reminder">Exam reminder</option>
                                <option value="Attendance concern">Attendance concern</option>
                                <option value="Homework reminder">Homework reminder</option>
                                <option value="Discipline notice">Discipline notice</option>
                                <option value="Subscription renewal">Subscription renewal</option>
                                <option value="Emergency alert">Emergency alert</option>
                                <option value="General announcement">General announcement</option>
                                <option value="Wellness reminder">Wellness reminder</option>
                            </select>
                        </div>
                    </div>
                    <div id="class-selector-container" class="hidden">
                        <label class="block text-sm font-medium mb-1">Select Class</label>
                        <select id="announcement-class" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                            <option value="">Loading classes...</option>
                        </select>
                    </div>
                    <div id="parent-selector-container" class="hidden">
                        <label class="block text-sm font-medium mb-1">Select Parent</label>
                        <select id="announcement-parent" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                            <option value="">Loading parents...</option>
                        </select>
                    </div>
                    <div class="grid gap-3 md:grid-cols-2">
                        <div>
                            <label class="block text-sm font-medium mb-1">Tone</label>
                            <select id="announcement-ai-tone" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                                <option value="Professional">Professional</option>
                                <option value="Friendly">Friendly</option>
                                <option value="Urgent">Urgent</option>
                                <option value="Polite">Polite</option>
                                <option value="Formal">Formal</option>
                                <option value="Encouraging">Encouraging</option>
                                <option value="Short and direct">Short and direct</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium mb-1">Delivery Method</label>
                            <select id="announcement-channel" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" onchange="v130UpdateSmsEstimate()">
                                <option value="platform">Platform alert only</option>
                                <option value="sms">SMS only</option>
                                <option value="both">Both platform alert + SMS</option>
                            </select>
                            <p id="announcement-sms-estimate" class="text-xs text-muted-foreground mt-1"></p>
                        </div>
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-1">Title</label>
                        <input type="text" id="announcement-title" placeholder="Announcement Title" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-1">Brief description / message</label>
                        <textarea id="announcement-message" rows="4" placeholder="Example: Tell Grade 4 parents that Term 2 balances should be cleared by Friday and thank them for support." class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"></textarea>
                    </div>
                    <div id="announcement-ai-suggestion-panel" class="hidden rounded-xl border bg-muted/30 p-3 text-sm space-y-2"></div>
                    <div class="grid gap-2 md:grid-cols-2">
                        <button onclick="generateAnnouncementSuggestion()" class="w-full border border-primary/30 text-primary py-2 rounded-lg hover:bg-primary/10 flex items-center justify-center gap-2">
                            <i data-lucide="sparkles" class="h-4 w-4"></i> Get Shule AI Suggestion
                        </button>
                        <button onclick="sendAnnouncement()" class="w-full bg-primary text-primary-foreground py-2 rounded-lg hover:bg-primary/90">Send Announcement</button>
                    </div>
                    <p class="text-xs text-muted-foreground">AI suggestions are optional. You can type your own title/message and press Send Announcement without using AI. AI suggestions are limited by the school subscription and must be reviewed before sending.</p>
                </div>
            </div>

            ${calendarAllowed ? `<!-- Calendar Preview -->
            <div class="rounded-xl border bg-card p-6">
                 <h3 class="font-semibold mb-4 flex items-center gap-2">
                     <i data-lucide="calendar" class="h-5 w-5"></i> Academic Calendar
                 </h3>
                 <div id="admin-calendar-events">
                     <p class="text-sm text-muted-foreground">Loading...</p>
                 </div>
                 <button onclick="showAddCalendarEventModal()" class="mt-4 px-4 py-2 bg-primary text-white rounded-lg text-sm">
                     + Add Event
                  </button>
             </div>` : ''}
        </div>
    `;
}

// ============ REPLACE renderAdminStudents WITH THIS VERSION ============
async function renderAdminStudents() {
    try {
        const [classesRes, studentsRes] = await Promise.all([
            api.admin.getClasses(),
            api.admin.getStudents()
        ]);
        const classes = classesRes.data || [];
        const allStudents = studentsRes.data || [];

        // Group students by grade (class name)
        const studentsByGrade = {};
        allStudents.forEach(s => {
            const grade = s.grade || 'Unassigned';
            if (!studentsByGrade[grade]) studentsByGrade[grade] = [];
            studentsByGrade[grade].push(s);
        });

        // Determine selected class from localStorage or default
        let selectedClassName = localStorage.getItem('adminSelectedClass');
        if (!selectedClassName || !studentsByGrade[selectedClassName]) {
            selectedClassName = classes.length > 0 ? classes[0].name : (Object.keys(studentsByGrade)[0] || '');
        }
        localStorage.setItem('adminSelectedClass', selectedClassName);

        const selectedStudents = studentsByGrade[selectedClassName] || [];

        // Stats for selected class
        const totalInClass = selectedStudents.length;
        const activeInClass = selectedStudents.filter(s => s.status === 'active').length;
        const inactiveInClass = selectedStudents.filter(s => s.status === 'inactive').length;
        const graduatedInClass = selectedStudents.filter(s => s.status === 'graduated').length;

        // Overall stats
        const totalAll = allStudents.length;
        const activeAll = allStudents.filter(s => s.status === 'active').length;
        const inactiveAll = allStudents.filter(s => s.status === 'inactive').length;
        const graduatedAll = allStudents.filter(s => s.status === 'graduated').length;

        // Build class list HTML
        let classListHtml = classes.map(cls => {
            const count = (studentsByGrade[cls.name] || []).length;
            const isSelected = cls.name === selectedClassName;
            return `
                <div class="class-item p-3 rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}"
                     data-class-name="${escapeHtml(cls.name)}"
                     onclick="selectAdminClass('${escapeHtml(cls.name).replace(/'/g, "\\'")}')">
                    <div class="flex justify-between items-center">
                        <span class="font-medium">${escapeHtml(cls.name)}</span>
                        <span class="text-xs ${isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'}">${count} students</span>
                    </div>
                    ${cls.stream ? `<p class="text-xs ${isSelected ? 'text-primary-foreground/70' : 'text-muted-foreground'}">Stream: ${escapeHtml(cls.stream)}</p>` : ''}
                </div>
            `;
        }).join('');

        // Also show grades that have students but no class record
        const classNamesFromClasses = new Set(classes.map(c => c.name));
        const orphanGrades = Object.keys(studentsByGrade).filter(g => !classNamesFromClasses.has(g) && g !== 'Unassigned');
        orphanGrades.forEach(grade => {
            const count = studentsByGrade[grade].length;
            const isSelected = grade === selectedClassName;
            classListHtml += `
                <div class="class-item p-3 rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}"
                     data-class-name="${escapeHtml(grade)}"
                     onclick="selectAdminClass('${escapeHtml(grade).replace(/'/g, "\\'")}')">
                    <div class="flex justify-between items-center">
                        <span class="font-medium">${escapeHtml(grade)}</span>
                        <span class="text-xs ${isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'}">${count} students</span>
                    </div>
                    <p class="text-xs ${isSelected ? 'text-primary-foreground/70' : 'text-muted-foreground'}">No class record</p>
                </div>
            `;
        });

        // Students table for selected class
        const studentsTableHtml = selectedStudents.length === 0 ? `
            <div class="text-center py-12 text-muted-foreground">
                <i data-lucide="users" class="h-12 w-12 mx-auto mb-3 opacity-50"></i>
                <p>No students in this class</p>
            </div>
        ` : `
            <div class="overflow-x-auto">
                <table class="w-full text-sm">
                    <thead class="bg-muted/50 sticky top-0">
                        <tr>
                            <th class="px-4 py-3 text-left font-medium">Student</th>
                            <th class="px-4 py-3 text-left font-medium">ELIMUID</th>
                            <th class="px-4 py-3 text-left font-medium">Status</th>
                            <th class="px-4 py-3 text-left font-medium">Parent Email</th>
                            <th class="px-4 py-3 text-center font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y">
                        ${selectedStudents.map(student => {
                            const user = student.User || {};
                            const name = user.name || 'Unknown';
                            const email = user.email || 'N/A';
                            const status = student.status || 'active';
                            const statusClass = status === 'active' ? 'bg-green-100 text-green-700' : 
                                               status === 'inactive' ? 'bg-red-100 text-red-700' : 
                                               'bg-gray-100 text-gray-700';
                            const initials = getInitials(name);
                            const photoUrl = resolveMediaUrl(user.profileImage) || '';
                            const isPrefect = student.isPrefect || false;

                            return `
                                <tr class="hover:bg-accent/50 transition-colors">
                                    <td class="px-4 py-3">
                                        <div class="flex items-center gap-3">
                                            ${photoUrl ? 
                                                `<img src="${photoUrl}" class="h-8 w-8 rounded-full object-cover">` :
                                                `<div class="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                                    <span class="font-medium text-blue-700 text-sm">${initials}</span>
                                                </div>`
                                            }
                                            <div>
                                                <span class="font-medium">${escapeHtml(name)}</span>
                                                ${isPrefect ? '<span class="ml-2 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800"><i data-lucide="shield" class="h-3 w-3 mr-1"></i>Prefect</span>' : ''}
                                            </div>
                                        </div>
                                    </td>
                                    <td class="px-4 py-3">
                                        <span class="font-mono text-xs bg-muted px-2 py-1 rounded">${escapeHtml(student.elimuid || 'N/A')}</span>
                                    </td>
                                    <td class="px-4 py-3">
                                        <span class="px-2 py-1 ${statusClass} text-xs rounded-full">${status}</span>
                                    </td>
                                    <td class="px-4 py-3">${escapeHtml(email)}</td>
                                    <td class="px-4 py-3 text-center">
                                        <div class="flex items-center justify-center gap-1">
                                            <button onclick="showUnifiedStudentModal('${student.id}')" class="p-2 hover:bg-accent rounded-lg" title="View Details">
                                                <i data-lucide="eye" class="h-4 w-4 text-blue-600"></i>
                                            </button>
                                            <button onclick="adminEditStudent('${student.id}')" class="p-2 hover:bg-accent rounded-lg" title="Edit">
                                                <i data-lucide="edit" class="h-4 w-4 text-green-600"></i>
                                            </button>
                                            ${status === 'active' ? 
                                                `<button onclick="adminSuspendStudent('${student.id}', '${escapeHtml(name).replace(/'/g, "\\'")}')" class="p-2 hover:bg-yellow-100 rounded-lg" title="Suspend">
                                                    <i data-lucide="pause-circle" class="h-4 w-4 text-yellow-600"></i>
                                                </button>` : 
                                                `<button onclick="adminReactivateStudent('${student.id}', '${escapeHtml(name).replace(/'/g, "\\'")}')" class="p-2 hover:bg-green-100 rounded-lg" title="Reactivate">
                                                    <i data-lucide="play-circle" class="h-4 w-4 text-green-600"></i>
                                                </button>`
                                            }
                                            <button onclick="adminDeleteStudent('${student.id}', '${escapeHtml(name).replace(/'/g, "\\'")}')" class="p-2 hover:bg-red-100 rounded-lg" title="Delete">
                                                <i data-lucide="trash-2" class="h-4 w-4 text-red-600"></i>
                                            </button>
                                            <button onclick="copyToClipboard('${escapeHtml(student.elimuid).replace(/'/g, "\\'")}')" class="p-2 hover:bg-purple-100 rounded-lg" title="Copy ELIMUID">
                                                <i data-lucide="copy" class="h-4 w-4 text-purple-600"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;

        return `
            <div class="space-y-6 animate-fade-in">
                <div class="flex justify-between items-center">
                    <h2 class="text-2xl font-bold">Student Management</h2>
                    <div class="flex flex-wrap gap-2"><button onclick="showCSVUploadModal()" class="px-4 py-2 border rounded-lg hover:bg-accent flex items-center gap-2"><i data-lucide="file-up" class="h-4 w-4"></i>Upload CSV</button><button onclick="showAddStudentModal()" class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 flex items-center gap-2">
                        <i data-lucide="plus" class="h-4 w-4"></i>
                        Add Student
                    </button></div>
                </div>

                <!-- Overall Stats -->
                <div class="grid gap-4 md:grid-cols-4">
                    <div class="rounded-xl border bg-card p-4">
                        <p class="text-sm text-muted-foreground">Total Students</p>
                        <p class="text-2xl font-bold">${totalAll}</p>
                    </div>
                    <div class="rounded-xl border bg-card p-4">
                        <p class="text-sm text-muted-foreground">Active</p>
                        <p class="text-2xl font-bold text-green-600">${activeAll}</p>
                    </div>
                    <div class="rounded-xl border bg-card p-4">
                        <p class="text-sm text-muted-foreground">Inactive</p>
                        <p class="text-2xl font-bold text-red-600">${inactiveAll}</p>
                    </div>
                    <div class="rounded-xl border bg-card p-4">
                        <p class="text-sm text-muted-foreground">Graduated</p>
                        <p class="text-2xl font-bold text-blue-600">${graduatedAll}</p>
                    </div>
                </div>

                <!-- Class Selector + Students Panel -->
                <div class="flex flex-col lg:flex-row gap-6">
                    <!-- Left Sidebar: Classes -->
                    <div class="lg:w-72 flex-shrink-0">
                        <div class="rounded-xl border bg-card overflow-hidden">
                            <div class="p-4 border-b bg-muted/30">
                                <h3 class="font-semibold flex items-center gap-2">
                                    <i data-lucide="book-open" class="h-5 w-5"></i>
                                    Classes
                                </h3>
                                <p class="text-xs text-muted-foreground mt-1">Select a class to view students</p>
                            </div>
                            <div class="p-2 max-h-[500px] overflow-y-auto" id="class-list-container">
                                ${classListHtml || '<p class="text-center py-4 text-muted-foreground">No classes found</p>'}
                            </div>
                        </div>
                    </div>

                    <!-- Right Panel: Students in Selected Class -->
                    <div class="flex-1 min-w-0">
                        <div class="rounded-xl border bg-card overflow-hidden">
                            <div class="p-4 border-b bg-muted/30 flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <h3 class="font-semibold flex items-center gap-2">
                                        <i data-lucide="users" class="h-5 w-5"></i>
                                        ${escapeHtml(selectedClassName)} Students
                                    </h3>
                                    <p class="text-xs text-muted-foreground mt-1">
                                        ${totalInClass} total · ${activeInClass} active · ${inactiveInClass} inactive
                                    </p>
                                </div>
                                <div class="relative">
                                    <i data-lucide="search" class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"></i>
                                    <input type="text" id="class-student-search" placeholder="Search in this class..." 
                                           class="pl-9 pr-4 py-2 text-sm rounded-md border bg-background w-64"
                                           oninput="filterStudentsInCurrentClass(this.value)">
                                </div>
                            </div>
                            <div id="selected-class-students-container">
                                ${studentsTableHtml}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error loading students:', error);
        return `<div class="text-center py-12 text-red-500">Error loading students: ${error.message}</div>`;
    }
}

// ============ HELPER FUNCTIONS (ADD THESE TO GLOBAL SCOPE) ============

// Called when a class is clicked in the sidebar
window.selectAdminClass = function(className) {
    localStorage.setItem('adminSelectedClass', className);
    showDashboardSection('students'); // Re-render the section
};

// Filter students within the currently displayed class (client-side)
window.filterStudentsInCurrentClass = function(searchTerm) {
    const container = document.getElementById('selected-class-students-container');
    if (!container) return;
    
    const rows = container.querySelectorAll('tbody tr');
    const term = searchTerm.toLowerCase().trim();
    
    let visibleCount = 0;
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        const match = term === '' || text.includes(term);
        row.style.display = match ? '' : 'none';
        if (match) visibleCount++;
    });
    
    // Optionally show a "no results" message
    const existingMsg = document.getElementById('no-search-results');
    if (visibleCount === 0 && term !== '') {
        if (!existingMsg) {
            const msg = document.createElement('div');
            msg.id = 'no-search-results';
            msg.className = 'text-center py-8 text-muted-foreground';
            msg.innerHTML = `<i data-lucide="search-x" class="h-12 w-12 mx-auto mb-3 opacity-50"></i><p>No students match "${escapeHtml(searchTerm)}"</p>`;
            container.appendChild(msg);
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }
    } else if (existingMsg) {
        existingMsg.remove();
    }
};

// Helper: escape HTML (ensure available globally)
function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"]/g, function(c) {
        if (c === '&') return '&amp;';
        if (c === '<') return '&lt;';
        if (c === '>') return '&gt;';
        if (c === '"') return '&quot;';
        return c;
    });
}

async function loadAdminCalendarPreviewEvents() {
    if (typeof hasSchoolFeature === 'function' && !hasSchoolFeature('calendar')) return;
    const container = document.getElementById('admin-calendar-events');
    if (!container) return;
    container.innerHTML = '<p class="text-sm text-muted-foreground">Loading calendar events…</p>';
    try {
        const res = await apiRequest('/api/calendar');
        const events = Array.isArray(res.data) ? res.data : (Array.isArray(res.events) ? res.events : (Array.isArray(res.data?.events) ? res.data.events : []));
        const now = new Date(); now.setHours(0,0,0,0);
        const sorted = events.slice().sort((a,b)=>new Date(a.startDate||a.date)-new Date(b.startDate||b.date));
        const upcoming = sorted.filter(e=>new Date(e.endDate||e.startDate||e.date)>=now).slice(0,5);
        const recent = sorted.filter(e=>new Date(e.endDate||e.startDate||e.date)<now).sort((a,b)=>new Date(b.startDate||b.date)-new Date(a.startDate||a.date)).slice(0,4);
        const rows = list => list.map(e => `<div class="flex items-center justify-between gap-3 border rounded-lg p-3"><div><p class="font-medium text-sm">${escapeHtml(e.eventName || e.title || 'Event')}</p><p class="text-xs text-muted-foreground">${formatDate(e.startDate || e.date)}${e.endDate&&e.endDate!==e.startDate?` – ${formatDate(e.endDate)}`:''} ${e.eventType ? '• '+escapeHtml(e.eventType) : ''}</p></div><button onclick="deleteCalendarEvent(${e.id})" class="text-red-600 text-xs shrink-0">Delete</button></div>`).join('');
        container.innerHTML = `<div><div class="flex items-center justify-between"><strong class="text-sm">Upcoming</strong><button onclick="showDashboardSection('calendar')" class="text-xs text-primary">Open calendar</button></div><div class="mt-2 space-y-2">${upcoming.length?rows(upcoming):'<p class="text-sm text-muted-foreground">No upcoming events.</p>'}</div></div><div class="mt-5"><strong class="text-sm">Recent events</strong><div class="mt-2 space-y-2">${recent.length?rows(recent):'<p class="text-sm text-muted-foreground">No recent events.</p>'}</div></div>`;
    } catch (e) {
        container.innerHTML = `<p class="text-sm text-red-600">${escapeHtml(e.message || 'Calendar events could not load.')}</p>`;
        console.warn('Calendar preview failed:', e.message);
    }
}
function showAddCalendarEventModal() {
    if (typeof hasSchoolFeature === 'function' && !hasSchoolFeature('calendar')) return showToast('Calendar is included for every active school. Refresh the school session if it does not load.', 'warning');
    const name = prompt('Event name:');
    if (!name) return;
    const startDate = prompt('Start date (YYYY-MM-DD):');
    if (!startDate) return;
    const endDate = prompt('End date (YYYY-MM-DD, optional):');
    const eventType = prompt('Type (term_start, term_end, holiday, exam, meeting):', 'other');
    apiRequest('/api/calendar', {
        method: 'POST',
        body: JSON.stringify({ eventName: name, startDate, endDate: endDate || null, eventType: eventType || 'other' })
    }).then(() => loadAdminCalendarPreviewEvents()).catch(e => showToast(e.message, 'error'));
}

async function deleteCalendarEvent(id) {
    if (confirm('Delete this event?')) {
        await apiRequest(`/api/calendar/${id}`, { method: 'DELETE' });
        loadAdminCalendarPreviewEvents();
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
    if (typeof hasSchoolFeature === 'function' && !hasSchoolFeature('duty')) {
        return `<div class="rounded-xl border bg-card p-6"><h2 class="text-2xl font-bold mb-2">Duty Management</h2><p class="text-muted-foreground">Duty is included for every active school. Refresh the school session if it does not load.</p></div>`;
    }
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
    const curriculum = schoolSettings.curriculum || schoolSettings.system || 'cbc';
    const schoolLevel = schoolSettings.settings?.schoolLevel || 'secondary';
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

// ============ ADMIN TIMETABLE (single, clean version) ============
let currentTimetableId = null;

async function renderAdminTimetable() {
    const weekStart = moment().startOf('isoWeek').format('YYYY-MM-DD');
    showLoading();
    try {
        const res = await apiRequest(`/api/timetable?weekStartDate=${weekStart}`);
        const timetable = (res && res.data) ? res.data : null;
        if (timetable) currentTimetableId = timetable.id;
        hideLoading();

        return `
        <div class="space-y-6 animate-fade-in">
            <div class="flex justify-between items-center">
                <h2 class="text-2xl font-bold">Timetable Management</h2>
                <div class="flex gap-3">
                    <button onclick="generateTimetable('${weekStart}')" class="px-4 py-2 bg-primary text-white rounded-lg">Generate New</button>
                    ${timetable && !timetable.isPublished ? 
                        `<button onclick="publishTimetable()" class="px-4 py-2 bg-green-600 text-white rounded-lg">Publish</button>` : ''}
                </div>
            </div>
            <div class="text-sm text-muted-foreground">Current week: ${weekStart}</div>
            <div id="admin-timetable-grid">
                ${timetable ? window.renderTimetableGrid(timetable.slots) : '<div class="text-center py-12">No timetable yet. Click Generate to create one.</div>'}
            </div>
        </div>`;
    } catch(e) { hideLoading(); return `<div class="text-red-500">Error: ${escapeHtml(e.message)}</div>`; }
}

async function generateTimetable(prefilledWeek) {
    const weekStart = prompt('Week start date (YYYY-MM-DD):', prefilledWeek || moment().startOf('isoWeek').format('YYYY-MM-DD'));
    if (!weekStart) return;
    showLoading();
    try {
        const res = await apiRequest('/api/timetable/generate', {
            method: 'POST',
            body: JSON.stringify({ weekStartDate: weekStart })
        });
        if (res.success) {
            currentTimetableId = res.data.id;
            // Re‑open the timetable page so the new grid appears instantly
            await showDashboardSection('timetable');
            showToast('Timetable generated', 'success');
        } else {
            showToast(res.message || 'Generation failed', 'error');
        }
    } catch(e) { showToast(e.message, 'error'); } finally { hideLoading(); }
}

async function publishTimetable() {
    if (!currentTimetableId) {
        showToast('No timetable to publish', 'error');
        return;
    }
    showLoading();
    try {
        await apiRequest(`/api/timetable/${currentTimetableId}/publish`, { method: 'POST' });
        showToast('Published', 'success');
        await showDashboardSection('timetable');
    } catch(e) { showToast(e.message, 'error'); } finally { hideLoading(); }
}

// Grid renderer (also used by teacher view)
function renderTimetableGrid(slots) {
    if (!slots || !Array.isArray(slots)) return '<p class="text-muted-foreground">No slots available</p>';
    const daysOrder = ['monday','tuesday','wednesday','thursday','friday'];
    const timeSlots = ['08:00','09:00','10:00','11:00','12:00','14:00','15:00'];
    const endTimes   = ['09:00','10:00','11:00','12:00','13:00','15:00','16:00'];

    let html = '<div class="overflow-x-auto"><table class="w-full text-sm border-collapse border"><thead><tr><th class="border p-2 bg-muted">Time</th>';
    daysOrder.forEach(d => html += `<th class="border p-2 bg-muted capitalize">${d.slice(0,3)}</th>`);
    html += '</tr></thead><tbody>';

    for (let i = 0; i < timeSlots.length; i++) {
        html += `<tr><td class="border p-2 font-medium">${timeSlots[i]} - ${endTimes[i]}</td>`;
        for (const day of daysOrder) {
            const daySlot = slots.find(s => s.day === day);
            const period = daySlot ? daySlot.periods.find(p => p.startTime === timeSlots[i]) : null;
            html += period ?
                `<td class="border p-2 bg-blue-50 dark:bg-blue-900/20 text-xs">
                    <strong>${escapeHtml(period.subject)}</strong><br>${escapeHtml(period.className)}<br><span class="text-muted-foreground">${escapeHtml(period.teacherName)}</span>
                </td>` :
                '<td class="border p-2 text-center text-muted-foreground">-</td>';
        }
        html += '</tr>';
    }
    html += '</tbody></table></div>';
    return html;
}

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
            <img id="profile-preview" src="${resolveMediaUrl(user.profileImage) || ''}" class="h-24 w-24 rounded-full object-cover border-4 border-white shadow bg-white">
            <label class="absolute bottom-0 right-0 bg-primary text-white rounded-full p-1 cursor-pointer">
              <i data-lucide="camera" class="h-4 w-4"></i>
              <input type="file" class="profile-picture-input" accept="image/*" class="hidden">
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
    if(typeof safeSessionSet==='function')safeSessionSet('user',JSON.stringify(typeof stripLargeMediaForStorage==='function'?stripLargeMediaForStorage(user):user));
    showToast('Profile updated', 'success');
    await showDashboardSection('profile');
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
      document.getElementById('profile-preview').src = resolveMediaUrl(data.data.profileImage);
      // Update local user object
      const user = getCurrentUser();
      user.profileImage = resolveMediaUrl(data.data.profileImage);
      if(typeof safeSessionSet==='function')safeSessionSet('user',JSON.stringify(typeof stripLargeMediaForStorage==='function'?stripLargeMediaForStorage(user):user));
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
            await showDashboardSection('custom-subjects');
            showToast(`Subject "${subject}" removed`, 'info');
            await refreshClassManagementIfVisible();
        } else {
            throw new Error(response?.message || 'Save failed');
        }
    } catch (error) { showToast(error.message, 'error'); }
    finally { hideLoading(); }
};

// Canonical School Settings save handler is defined in the v148.6 curriculum section below.

// ============ HELP SECTION ============
function renderHelpSection() {
    const user = getCurrentUser();
    const role = user?.role || 'user';
    const helpArticles = {
        superadmin: [{ title: 'How to approve a new school', content: 'Go to School Approvals, review school details, click Approve. The school will be activated immediately.', keywords: ['approve', 'school', 'activate'] }],
        admin: [{ title: 'How to add a student', content: 'Go to Students, click Add Student, fill in details. The student receives an ELIMUID automatically.', keywords: ['add', 'student'] }, { title: 'Grouped fee structures', content: 'Go to Finance & Fees, create one fee structure, tick one or many classes, then save. Use View Classes or Edit to see, add or remove classes inside the same grouped structure. Activate to generate individual student fee accounts.', keywords: ['finance','fees','classes','structure'] }, { title: 'Manual payments and bursaries', content: 'In Payment Records, find the individual student, then Record Payment or Add Bursary/Credit. Cash, bank, card and manual M-Pesa update that student only after approved/successful status.', keywords: ['cash','bank','card','bursary','payment'] }, { title: 'How to approve a teacher', content: 'Go to Teacher Approvals, review teacher details, click Approve or Reject.', keywords: ['teacher', 'approve'] }, { title: 'How to generate duty roster', content: 'Go to Duty Management, select dates, click Generate Roster.', keywords: ['duty', 'roster'] }, { title: 'How to change curriculum', content: 'Go to Settings, select new curriculum, click Save.', keywords: ['curriculum', 'change'] }],
        teacher: [{ title: 'How to take attendance', content: 'Go to Attendance, mark each student as Present/Absent/Late, add notes, click Save Attendance.', keywords: ['attendance'] }, { title: 'How to enter grades', content: 'Go to Grades, select subject and assessment type, enter scores, click Save.', keywords: ['grade', 'marks'] }, { title: 'How to check in for duty', content: 'Go to Dashboard, find Duty Card, click Check In.', keywords: ['duty', 'checkin'] }],
        parent: [{ title: 'How to view child progress', content: 'Select your child from the top, view grades, attendance, and teacher comments.', keywords: ['progress', 'grades'] }, { title: 'How to report absence', content: 'Click Report Absence, select date, enter reason, submit.', keywords: ['absence', 'report'] }, { title: 'How to use Payments', content: 'Go to Payments, select one child, then view that child’s total, parent-paid amount, bursary/credit and balance. Use history filters for Pending, Successful, Failed, Rejected and Bursaries/Credits. Siblings are never mixed.', keywords: ['payment','balance','history','child'] }],
        student: [{ title: 'How to view my grades', content: 'Go to My Grades to see all your scores and performance.', keywords: ['grade'] }, { title: 'How to use AI Tutor', content: 'Type your question in AI Tutor chat, get instant help.', keywords: ['ai', 'tutor'] }, { title: 'How to join study groups', content: 'Go to Study Chat to connect with other students.', keywords: ['study', 'chat'] }]
    };
    const articles = helpArticles[role] || helpArticles.admin;
    return `
        <div class="space-y-6 animate-fade-in max-w-5xl mx-auto">
            <div class="text-center"><h2 class="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Help Center</h2><p class="text-muted-foreground mt-2">Find answers to common questions and learn how to use the platform</p></div>
            <div class="relative"><i data-lucide="search" class="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground"></i><input type="text" id="help-search" placeholder="Search help articles..." onkeyup="searchHelpArticles()" class="w-full pl-10 pr-4 py-3 rounded-xl border bg-card focus:ring-2 focus:ring-primary transition-all"></div>
            <div id="help-articles-container" class="grid gap-4">${articles.map(article => `<div class="help-article rounded-xl border bg-card p-6 hover:shadow-md transition-all cursor-pointer" data-title="${article.title.toLowerCase()}" data-content="${article.content.toLowerCase()}" data-keywords="${article.keywords.join(' ').toLowerCase()}" onclick="showHelpArticleDetail('${article.title.replace(/'/g, "\\'")}', '${article.content.replace(/'/g, "\\'")}')"><h3 class="font-semibold text-lg mb-2">📚 ${article.title}</h3><p class="text-muted-foreground">${article.content.substring(0, 150)}${article.content.length > 150 ? '...' : ''}</p></div>`).join('')}</div>
            <div class="rounded-xl border bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 p-6 text-center"><h3 class="font-semibold text-lg mb-2">💬 Still Need Help?</h3><p class="text-muted-foreground mb-4">Contact our support team for assistance</p><div class="flex gap-3 justify-center"><button onclick="openShuleWhatsappSupport()" class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"><i data-lucide="message-circle" class="h-4 w-4 inline mr-2"></i> Live Chat</button><button onclick="openShuleEmailSupport()" class="px-4 py-2 border rounded-lg hover:bg-accent"><i data-lucide="mail" class="h-4 w-4 inline mr-2"></i> Email Support</button></div></div>
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
        modalContent.innerHTML = `<div class="space-y-4"><div class="border-b pb-3"><h3 class="text-xl font-semibold">${title}</h3></div><div class="prose prose-sm max-w-none"><p class="text-muted-foreground">${content}</p></div><div class="flex justify-end gap-2 pt-4 border-t"><button onclick="closeHelpArticleModal()" class="px-4 py-2 border rounded-lg hover:bg-accent">Close</button><button onclick="openShuleEmailSupport()" class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">Contact Support</button></div></div>`;
    }
    modal.classList.remove('hidden');
    if (typeof lucide !== 'undefined') lucide.createIcons();
};

function closeHelpArticleModal() { const m = document.getElementById('help-article-modal'); if(m) m.classList.add('hidden'); }

// At the end of admin-dashboard.js, add:

document.addEventListener('change', function(e) {
    if (e.target.id === 'announcement-recipients') {
        const val = e.target.value;
        document.getElementById('class-selector-container').classList.toggle('hidden', val !== 'specific_class');
        document.getElementById('parent-selector-container').classList.toggle('hidden', val !== 'individual_parent');
        if (val === 'specific_class') loadClassesForSelect();
        if (val === 'individual_parent') loadParentsForSelect();
    }
});

async function loadClassesForSelect() {
    try {
        const response = await api.admin.getClasses();
        const select = document.getElementById('announcement-class');
        select.innerHTML = '<option value="">Select a class</option>';
        response.data.forEach(cls => {
            select.innerHTML += `<option value="${cls.id}">${escapeHtml(cls.name)} (Grade ${escapeHtml(cls.grade)})</option>`;
        });
    } catch (error) {
        console.error('Failed to load classes:', error);
    }
}

async function loadParentsForSelect() {
    try {
        const response = await api.admin.getParents();
        const select = document.getElementById('announcement-parent');
        select.innerHTML = '<option value="">Select a parent</option>';
        response.data.forEach(parent => {
            const user = parent.User || {};
            select.innerHTML += `<option value="${user.id}">${escapeHtml(user.name)} (${escapeHtml(user.email)})</option>`;
        });
    } catch (error) {
        console.error('Failed to load parents:', error);
    }
}




async function renderAdminSms() {
    try {
        const [cfgRes, historyRes] = await Promise.all([
            api.sms?.getConfig ? api.sms.getConfig().catch(e => ({ success:false, data:{ enabled:false, tokensRemaining:0, message:e.message } })) : Promise.resolve({ data:{ enabled:false, tokensRemaining:0 } }),
            api.sms?.getHistory ? api.sms.getHistory().catch(() => ({ data:[] })) : Promise.resolve({ data:[] })
        ]);
        const cfg = cfgRes.data || {};
        const history = Array.isArray(historyRes.data) ? historyRes.data : [];
        if (cfg.enabled === false) {
            return `<div class="rounded-xl border bg-card p-6"><h2 class="text-2xl font-bold mb-2">Bulk SMS</h2><p class="text-muted-foreground">Bulk SMS is included for every active school. Ask Super Admin to configure the SMS provider and allocate SMS tokens.</p></div>`;
        }
        return `<div class="space-y-6 animate-fade-in">
            <div class="flex justify-between items-start gap-4 flex-wrap"><div><h2 class="text-2xl font-bold">Bulk SMS</h2><p class="text-sm text-muted-foreground">Compose and send only. Provider/API credentials are managed by Super Admin.</p></div><div class="rounded-xl border bg-card px-4 py-3"><p class="text-xs text-muted-foreground">Tokens remaining</p><p class="text-2xl font-bold text-primary">${Number(cfg.tokensRemaining || 0).toLocaleString()}</p></div></div>
            <div class="rounded-xl border bg-card p-6 space-y-4">
                <div class="grid md:grid-cols-2 gap-4">
                    <div><label class="block text-sm font-medium mb-1">Audience / Recipients</label><select id="sms-audience" class="w-full rounded-lg border bg-background px-3 py-2 text-sm" onchange="updateSmsAudienceHint()"><option value="all_parents">All Parents</option><option value="whole_school">Whole School</option><option value="teachers">Teachers</option><option value="students">Students</option><option value="specific_class">Specific Class Parents</option><option value="fee_defaulters">Fee Defaulters</option><option value="selected_parents">Selected Parents</option></select><p id="sms-audience-hint" class="text-xs text-muted-foreground mt-1">Choose who should receive this SMS.</p></div>
                    <div><label class="block text-sm font-medium mb-1">Sender ID</label><input class="w-full rounded-lg border bg-muted px-3 py-2 text-sm" value="${escapeHtml(cfg.senderId || 'SHULEAI')}" readonly></div>
                </div>
                <div><label class="block text-sm font-medium mb-1">SMS Message</label><textarea id="sms-message" rows="5" maxlength="480" class="w-full rounded-lg border bg-background px-3 py-2 text-sm" placeholder="Write the SMS message here..."></textarea><p class="text-xs text-muted-foreground mt-1">Tokens are deducted only when SMS is sent.</p></div>
                <div class="flex justify-end"><button onclick="sendAdminSms()" class="px-6 py-3 bg-primary text-primary-foreground rounded-lg">Send SMS</button></div>
            </div>
            <div class="rounded-xl border bg-card p-6"><h3 class="font-semibold mb-4">SMS History</h3>${history.length ? `<div class="overflow-x-auto"><table class="w-full text-sm"><thead class="bg-muted/40"><tr><th class="p-3 text-left">Date</th><th class="p-3 text-left">Audience</th><th class="p-3 text-left">Message</th><th class="p-3 text-right">Reached</th><th class="p-3 text-right">Tokens</th></tr></thead><tbody>${history.map(r => `<tr class="border-t"><td class="p-3">${escapeHtml(new Date(r.createdAt || r.created_at || Date.now()).toLocaleString())}</td><td class="p-3">${escapeHtml(r.audience || '-')}</td><td class="p-3">${escapeHtml(r.message || '').slice(0,120)}</td><td class="p-3 text-right">${Number(r.successCount ?? r.recipientCount ?? 0)}</td><td class="p-3 text-right">${Number(r.tokensUsed ?? r.recipientCount ?? 0)}</td></tr>`).join('')}</tbody></table></div>` : '<p class="text-sm text-muted-foreground">No SMS history yet.</p>'}</div>
        </div>`;
    } catch (error) {
        return `<div class="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700"><h2 class="font-bold">SMS could not load</h2><p>${escapeHtml(error.message || 'Unknown error')}</p></div>`;
    }
}
function updateSmsAudienceHint() {
    const audience = document.getElementById('sms-audience')?.value || 'all_parents';
    const hint = document.getElementById('sms-audience-hint');
    if (hint) hint.textContent = audience === 'specific_class' ? 'Class selection can be added before final send; current backend will resolve recipients by audience.' : 'Backend resolves recipients by selected audience and school scope.';
}
async function sendAdminSms() {
    const audience = document.getElementById('sms-audience')?.value || 'all_parents';
    const message = document.getElementById('sms-message')?.value?.trim() || '';
    if (!message) return showToast('Write the SMS message first.', 'error');
    showLoading();
    try {
        const res = await api.sms.send({ audience, message, recipientType: audience });
        showToast(`SMS sent. Tokens used: ${res.data?.tokensUsed ?? '-'}`, 'success');
        await showDashboardSection('sms');
    } catch (e) { showToast(e.message || 'Failed to send SMS', 'error'); }
    finally { hideLoading(); }
}
window.renderAdminSms = renderAdminSms;
window.updateSmsAudienceHint = updateSmsAudienceHint;
window.sendAdminSms = sendAdminSms;

async function renderAdminReportSettings() {
    const fallback = [
        { key:'opener', label:'Opener Exam', showOnReport:true, countInFinal:false, weight:0, displayOrder:1, assessmentType:'Opener', type:'Opener', classLevel:'all', curriculum:'any', maxScore:100, isActive:true },
        { key:'cat1', label:'CAT 1', showOnReport:true, countInFinal:true, weight:10, displayOrder:2, assessmentType:'CAT 1', type:'CAT', classLevel:'all', curriculum:'any', maxScore:100, isActive:true },
        { key:'cat2', label:'CAT 2', showOnReport:true, countInFinal:true, weight:10, displayOrder:3, assessmentType:'CAT 2', type:'CAT', classLevel:'all', curriculum:'any', maxScore:100, isActive:true },
        { key:'midterm', label:'Midterm', showOnReport:true, countInFinal:true, weight:20, displayOrder:4, assessmentType:'Midterm', type:'Midterm', classLevel:'all', curriculum:'any', maxScore:100, isActive:true },
        { key:'endterm', label:'End Term', showOnReport:true, countInFinal:true, weight:50, displayOrder:5, assessmentType:'End Term', type:'EndTerm', classLevel:'all', curriculum:'any', maxScore:100, isActive:true },
        { key:'sba', label:'SBA / Project', showOnReport:true, countInFinal:true, weight:10, displayOrder:6, assessmentType:'SBA', type:'SBA', classLevel:'all', curriculum:'cbc', maxScore:100, isActive:true },
        { key:'practical', label:'Practical', showOnReport:false, countInFinal:false, weight:0, displayOrder:7, assessmentType:'Practical', type:'Practical', classLevel:'all', curriculum:'any', maxScore:100, isActive:true }
    ];
    const res = await (api.admin.getAssessmentSettings ? api.admin.getAssessmentSettings() : Promise.resolve({data:{assessmentSettings:fallback}})).catch(() => ({data:{assessmentSettings:fallback}}));
    const rows = (res.data?.assessmentSettings?.length ? res.data.assessmentSettings : fallback).map((r,i)=>({
      key:r.key || r.assessmentKey || `custom_${i+1}`, label:r.label || r.displayName || r.assessmentName || r.assessmentType || `Assessment ${i+1}`,
      assessmentType:r.assessmentType || r.type || r.label || 'Custom', type:r.type || r.assessmentType || 'Custom', curriculum:r.curriculum || 'any', classLevel:r.classLevel || r.level || 'all',
      showOnReport:r.showOnReport !== false, countInFinal:r.countInFinal !== false, weight:Number(r.weight ?? r.weightPercent ?? 0), displayOrder:Number(r.displayOrder || i+1), maxScore:Number(r.maxScore || 100), isActive:r.isActive !== false
    })).sort((a,b)=>a.displayOrder-b.displayOrder);
    const rcs = res.data?.reportCardSettings || res.data?.config?.reportCardSettings || {};
    const rVal = (key, fallback='') => escapeHtml(rcs[key] ?? fallback);
    const checked = (key, fallback=true) => (rcs[key] === undefined ? fallback : rcs[key] !== false) ? 'checked' : '';
    const typeOptions=['Opener','CAT','Midterm','EndTerm','SBA','Project','Practical','Custom'];
    const rowHtml = (r,i)=>`<tr class="border-t" data-assessment-row data-key="${escapeHtml(r.key)}">
      <td class="p-2"><input class="assess-label w-44 rounded border bg-background px-2 py-1" value="${escapeHtml(r.label)}"></td>
      <td class="p-2"><select class="assess-type rounded border bg-background px-2 py-1">${typeOptions.map(t=>`<option value="${t}" ${String(r.type).toLowerCase()===t.toLowerCase()?'selected':''}>${t}</option>`).join('')}</select></td>
      <td class="p-2 text-center"><input type="checkbox" class="assess-show" ${r.showOnReport?'checked':''}></td>
      <td class="p-2 text-center"><input type="checkbox" class="assess-count" ${r.countInFinal?'checked':''}></td>
      <td class="p-2"><input type="number" min="0" max="100" class="assess-weight w-20 rounded border bg-background px-2 py-1" value="${Number(r.weight||0)}"></td>
      <td class="p-2"><input type="number" min="1" class="assess-order w-16 rounded border bg-background px-2 py-1" value="${Number(r.displayOrder||i+1)}"></td>
      <td class="p-2"><input class="assess-level w-32 rounded border bg-background px-2 py-1" value="${escapeHtml(r.classLevel)}" placeholder="all / Grade 6"></td>
      <td class="p-2"><input class="assess-curriculum w-24 rounded border bg-background px-2 py-1" value="${escapeHtml(r.curriculum)}"></td>
      <td class="p-2"><input type="number" class="assess-max w-20 rounded border bg-background px-2 py-1" value="${Number(r.maxScore||100)}"></td>
      <td class="p-2 text-center"><input type="checkbox" class="assess-active" ${r.isActive?'checked':''}></td>
      <td class="p-2"><button type="button" class="px-2 py-1 rounded border text-xs" onclick="this.closest('tr').remove()">Remove</button></td>
    </tr>`;
    return `<div class="space-y-6 animate-fade-in"><div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"><div><p class="text-xs uppercase tracking-wide text-muted-foreground">School Settings → Academic & Report Card Settings</p><h2 class="text-2xl font-bold">Report Card Settings</h2><p class="text-sm text-muted-foreground mt-1">Add openers/custom tests, choose which tests show on reports, which count, their weights, and class/curriculum applicability. Published reports keep an immutable copy of the settings used.</p></div><button onclick="showDashboardSection('settings')" class="px-4 py-2 rounded-lg border hover:bg-accent">Back to School Settings</button></div>
      <div class="rounded-xl border bg-card p-4"><h3 class="font-semibold">Dynamic Assessment Columns</h3><p class="text-sm text-muted-foreground mt-1">Use classLevel for school-wide or specific classes/levels. Counted weights should total 100%; if not, the engine normalizes with a warning.</p><button type="button" onclick="addAssessmentSettingRow()" class="mt-3 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm">Add Custom Test / Opener</button></div>
      <div class="rounded-xl border bg-card overflow-auto"><table class="w-full text-sm min-w-[1100px]"><thead class="bg-muted/40"><tr><th class="p-2 text-left">Assessment / Test</th><th class="p-2">Type</th><th class="p-2">Show</th><th class="p-2">Count</th><th class="p-2">Weight %</th><th class="p-2">Order</th><th class="p-2">Class/Level</th><th class="p-2">Curriculum</th><th class="p-2">Max</th><th class="p-2">Active</th><th class="p-2"></th></tr></thead><tbody id="assessment-settings-body">${rows.map(rowHtml).join('')}</tbody></table></div>
      <div class="rounded-xl border bg-card p-4 space-y-5"><div><h3 class="font-semibold">Official CBC Report Card Template</h3><p class="text-sm text-muted-foreground mt-1">Uses the uploaded CBC template layout: school header, verification, student info row, academic table, summaries, core values, feedback, comments, term information, signatures and footer. Draft and final use this same design.</p></div><div class="grid gap-3 md:grid-cols-3"><label class="text-sm">Motto<input id="rc-motto" class="mt-1 w-full rounded border bg-background px-3 py-2" value="${rVal('motto')}"></label><label class="text-sm">Registration No<input id="rc-registrationNumber" class="mt-1 w-full rounded border bg-background px-3 py-2" value="${rVal('registrationNumber')}"></label><label class="text-sm">Curriculum Label<input id="rc-curriculumLabel" class="mt-1 w-full rounded border bg-background px-3 py-2" value="${rVal('curriculumLabel','CBC')}"></label><label class="text-sm md:col-span-2">Postal Address / P.O. Box<input id="rc-postalAddress" class="mt-1 w-full rounded border bg-background px-3 py-2" value="${rVal('postalAddress')}"></label><label class="text-sm">County / Location<input id="rc-county" class="mt-1 w-full rounded border bg-background px-3 py-2" value="${rVal('county')}"></label><label class="text-sm">Phone<input id="rc-phone" class="mt-1 w-full rounded border bg-background px-3 py-2" value="${rVal('phone')}"></label><label class="text-sm">Email<input id="rc-email" class="mt-1 w-full rounded border bg-background px-3 py-2" value="${rVal('email')}"></label><label class="text-sm">Website<input id="rc-website" class="mt-1 w-full rounded border bg-background px-3 py-2" value="${rVal('website')}"></label><label class="text-sm">Report Type Label<input id="rc-reportTypeLabel" class="mt-1 w-full rounded border bg-background px-3 py-2" value="${rVal('reportTypeLabel','End Term Report')}"></label><label class="text-sm">Verification URL<input id="rc-verifyUrl" class="mt-1 w-full rounded border bg-background px-3 py-2" value="${rVal('verifyUrl','verify.shuleai.com')}"></label><label class="text-sm">Default Promotion Status<input id="rc-defaultPromotionStatus" class="mt-1 w-full rounded border bg-background px-3 py-2" value="${rVal('defaultPromotionStatus')}" placeholder="Optional"></label><label class="text-sm">Closing Date<input id="rc-closingDate" class="mt-1 w-full rounded border bg-background px-3 py-2" value="${rVal('closingDate')}" placeholder="Optional"></label><label class="text-sm">Opens Next Term<input id="rc-opensNextTerm" class="mt-1 w-full rounded border bg-background px-3 py-2" value="${rVal('opensNextTerm')}" placeholder="Optional"></label><label class="text-sm">Fee Balance Display<input id="rc-feeBalance" class="mt-1 w-full rounded border bg-background px-3 py-2" value="${rVal('feeBalance')}" placeholder="Optional/fallback only"></label><label class="text-sm">No-logo fallback<select id="rc-logoFallback" class="mt-1 w-full rounded border bg-background px-3 py-2"><option value="school_initials" ${rcs.logoFallback==='shuleai_logo'?'':'selected'}>School initials</option><option value="shuleai_logo" ${rcs.logoFallback==='shuleai_logo'?'selected':''}>ShuleAI official logo</option></select></label><label class="text-sm">Watermark<select id="rc-watermarkType" class="mt-1 w-full rounded border bg-background px-3 py-2">${['school_logo','school_initials','school_name','shuleai_logo','none'].map(v=>`<option value="${v}" ${String(rcs.watermarkType||'school_logo')===v?'selected':''}>${v.replace(/_/g,' ')}</option>`).join('')}</select></label></div><div><p class="text-xs uppercase tracking-wide text-muted-foreground mb-2">Visible sections</p><div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 text-sm">${[['showMotto','Motto'],['showRegistrationNumber','Registration no.'],['showPostalAddress','Postal address'],['showPhone','Phone'],['showEmail','Email'],['showWebsite','Website'],['showCurriculum','Curriculum'],['showStudentPhoto','Student photo'],['showPromotionStatus','Promotion status'],['showAttendance','Attendance'],['showCoreValues','Core values'],['showTeacherFeedback','Teacher feedback'],['showTeacherComment','Teacher comment'],['showHeadteacherComment','Headteacher comment'],['showTermInformation','Term information'],['showSignatures','Signatures'],['showStamp','School stamp'],['showVerificationCode','Verification code']].map(([id,label])=>`<label class="flex items-center gap-2"><input id="rc-${id}" type="checkbox" ${checked(id, !['showWebsite'].includes(id))}> ${label}</label>`).join('')}</div></div></div>
      <div class="rounded-xl border bg-amber-50 dark:bg-amber-950/20 p-4 text-sm"><b>Locked rule:</b> report cards list all selected tests, calculate only selected counted tests, exclude subjects not taken, and show blank/Not assessed for missing marks instead of inventing scores.</div><div class="flex justify-end"><button onclick="saveAdminReportSettings()" class="px-6 py-3 bg-primary text-primary-foreground rounded-lg">Save Report Card Settings</button></div></div>`;
}

function collectAdminReportCardAppearanceSettings() {
    const get = id => document.getElementById(id)?.value?.trim() || '';
    const checked = (id, fallback=true) => document.getElementById(id) ? !!document.getElementById(id).checked : fallback;
    return {
      motto:get('rc-motto'), registrationNumber:get('rc-registrationNumber'), postalAddress:get('rc-postalAddress'), county:get('rc-county'), phone:get('rc-phone'), email:get('rc-email'), website:get('rc-website'), curriculumLabel:get('rc-curriculumLabel') || 'CBC', reportTypeLabel:get('rc-reportTypeLabel') || 'End Term Report', verifyUrl:get('rc-verifyUrl') || 'verify.shuleai.com', defaultPromotionStatus:get('rc-defaultPromotionStatus'), closingDate:get('rc-closingDate'), opensNextTerm:get('rc-opensNextTerm'), feeBalance:get('rc-feeBalance'),
      logoFallback:get('rc-logoFallback') || 'school_initials', headerLogoSource:get('rc-logoFallback') || 'school_initials', watermarkType:get('rc-watermarkType') || 'school_logo',
      showMotto:checked('rc-showMotto'), showRegistrationNumber:checked('rc-showRegistrationNumber'), showPostalAddress:checked('rc-showPostalAddress'), showPhone:checked('rc-showPhone'), showEmail:checked('rc-showEmail'), showWebsite:checked('rc-showWebsite', false), showCurriculum:checked('rc-showCurriculum'), showStudentPhoto:checked('rc-showStudentPhoto'), showPromotionStatus:checked('rc-showPromotionStatus'), showAttendance:checked('rc-showAttendance'), showCoreValues:checked('rc-showCoreValues'), showTeacherFeedback:checked('rc-showTeacherFeedback'), showTeacherComment:checked('rc-showTeacherComment'), showHeadteacherComment:checked('rc-showHeadteacherComment'), showTermInformation:checked('rc-showTermInformation'), showSignatures:checked('rc-showSignatures'), showStamp:checked('rc-showStamp'), showVerificationCode:checked('rc-showVerificationCode')
    };
}
async function saveAdminReportSettings() {
    const assessmentSettings = [...document.querySelectorAll('[data-assessment-row]')].map((row, index) => {
      const label = row.querySelector('.assess-label')?.value?.trim() || `Assessment ${index+1}`;
      const type = row.querySelector('.assess-type')?.value || 'Custom';
      const keyBase = row.dataset.key && !/^custom_new/.test(row.dataset.key) ? row.dataset.key : `${type}_${label}`;
      return {
        key: String(keyBase).toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'') || `custom_${index+1}`,
        name: label,
        label,
        displayName: label,
        assessmentType: type,
        type,
        showOnReport: !!row.querySelector('.assess-show')?.checked,
        countInFinal: !!row.querySelector('.assess-count')?.checked,
        weight: Number(row.querySelector('.assess-weight')?.value || 0),
        weightPercent: Number(row.querySelector('.assess-weight')?.value || 0),
        displayOrder: Number(row.querySelector('.assess-order')?.value || index + 1),
        classLevel: row.querySelector('.assess-level')?.value?.trim() || 'all',
        curriculum: row.querySelector('.assess-curriculum')?.value?.trim() || 'any',
        maxScore: Number(row.querySelector('.assess-max')?.value || 100),
        isActive: !!row.querySelector('.assess-active')?.checked
      };
    });
    const reportCardSettings = collectAdminReportCardAppearanceSettings();
    await api.admin.saveAssessmentSettings(assessmentSettings, reportCardSettings);
    showToast('Assessment/report settings saved', 'success');
}
function addAssessmentSettingRow() {
  const body = document.getElementById('assessment-settings-body'); if (!body) return;
  const idx = body.querySelectorAll('[data-assessment-row]').length + 1;
  body.insertAdjacentHTML('beforeend', `<tr class="border-t" data-assessment-row data-key="custom_new_${idx}">
    <td class="p-2"><input class="assess-label w-44 rounded border bg-background px-2 py-1" value="Custom Test ${idx}"></td>
    <td class="p-2"><select class="assess-type rounded border bg-background px-2 py-1"><option>Opener</option><option>CAT</option><option>Midterm</option><option>EndTerm</option><option>SBA</option><option>Project</option><option>Practical</option><option selected>Custom</option></select></td>
    <td class="p-2 text-center"><input type="checkbox" class="assess-show" checked></td><td class="p-2 text-center"><input type="checkbox" class="assess-count"></td>
    <td class="p-2"><input type="number" min="0" max="100" class="assess-weight w-20 rounded border bg-background px-2 py-1" value="0"></td>
    <td class="p-2"><input type="number" min="1" class="assess-order w-16 rounded border bg-background px-2 py-1" value="${idx}"></td>
    <td class="p-2"><input class="assess-level w-32 rounded border bg-background px-2 py-1" value="all"></td><td class="p-2"><input class="assess-curriculum w-24 rounded border bg-background px-2 py-1" value="any"></td><td class="p-2"><input type="number" class="assess-max w-20 rounded border bg-background px-2 py-1" value="100"></td><td class="p-2 text-center"><input type="checkbox" class="assess-active" checked></td><td class="p-2"><button type="button" class="px-2 py-1 rounded border text-xs" onclick="this.closest('tr').remove()">Remove</button></td>
  </tr>`);
}
window.addAssessmentSettingRow = addAssessmentSettingRow;
function v132AnnouncementOption(title, platformMessage, smsMessage, tone) { return { title, platformMessage, smsMessage, tone }; }
function normalizeAnnouncementOptionsFromResponse(res, fallback) {
    const raw = res?.data?.suggestion || res?.suggestion || res?.data || res || {};
    let options = Array.isArray(raw.options) ? raw.options : [];
    if (!options.length && Array.isArray(raw.alternatives)) {
        options = raw.alternatives.map((x, i) => ({ title: x.title || `${fallback.purpose} Option ${i+1}`, platformMessage: x.platformMessage || x.message || x, smsMessage: x.smsMessage || String(x.message || x || '').slice(0,155), tone: x.tone || fallback.tone }));
    }
    if (!options.length && (raw.title || raw.message)) options = [{ title: raw.title || fallback.title, platformMessage: raw.platformMessage || raw.message || fallback.message, smsMessage: raw.smsMessage || String(raw.message || fallback.message).slice(0,155), tone: raw.tone || fallback.tone }];
    return options.slice(0,3).map((o, i) => v132AnnouncementOption(o.title || `${fallback.purpose} Notice`, o.platformMessage || o.message || fallback.message, (o.smsMessage || o.sms || o.message || fallback.message).slice(0,155), o.tone || ['Formal','Friendly','Short'][i] || fallback.tone));
}
async function generateAnnouncementSuggestion() {
    const purpose = document.getElementById('announcement-ai-topic')?.value || 'General announcement';
    const tone = document.getElementById('announcement-ai-tone')?.value || 'Professional';
    const audience = document.getElementById('announcement-recipients')?.value || 'all_parents';
    const channel = document.getElementById('announcement-channel')?.value || 'platform';
    const keyPoints = document.getElementById('announcement-message')?.value.trim() || '';
    const titleInput = document.getElementById('announcement-title')?.value.trim() || `${purpose} Notice`;
    const panel = document.getElementById('announcement-ai-suggestion-panel');
    window.__announcementOptions = [];
    if (panel) { panel.classList.remove('hidden'); panel.innerHTML = '<p class="text-xs text-muted-foreground">Generating fresh Shule AI suggestions…</p>'; }
    if (!keyPoints) { if (panel) { panel.classList.add('hidden'); panel.innerHTML = ''; } return showToast('Write the key points/message first.', 'error'); }
    const fallback = { purpose, tone, title:titleInput, message:`${tone} ${purpose.toLowerCase()} for ${audience.replace(/_/g,' ')}. ${keyPoints}`.replace(/\s+/g,' ').trim() };
    let options = [];
    try {
        const res = await (api.alerts?.suggestAnnouncement ? api.alerts.suggestAnnouncement({ title: titleInput, topic: purpose, tone, audience, channel, description: keyPoints }) : apiRequest('/api/alerts/suggest-announcement', { method:'POST', body: JSON.stringify({ title:titleInput, topic:purpose, tone, audience, channel, description:keyPoints }) }));
        options = normalizeAnnouncementOptionsFromResponse(res, fallback);
    } catch (e) {
        console.warn('AI suggestion unavailable, using local formatter:', e.message);
    }
    if (!options.length) {
        options = [
            v132AnnouncementOption(titleInput, fallback.message, `${purpose}: ${keyPoints}`.replace(/\s+/g,' ').slice(0,155), 'Formal'),
            v132AnnouncementOption(`${purpose} Reminder`, `Hello, kindly note: ${keyPoints}. Thank you for your continued support.`, `Reminder: ${keyPoints}`.slice(0,155), 'Friendly'),
            v132AnnouncementOption(`Important ${purpose}`, `Important update: ${keyPoints}. Please take the necessary action.`, `Important: ${keyPoints}`.slice(0,155), 'Short')
        ];
    }
    window.__announcementOptions = options;
    if (panel) {
        panel.classList.remove('hidden');
        panel.innerHTML = `<div class="space-y-3"><p class="text-xs font-semibold text-muted-foreground">Choose one. AI does not send automatically.</p>${options.map((o,i)=>`<div class="rounded-lg border bg-background p-3"><div class="flex items-center justify-between"><b>Option ${i+1}: ${escapeHtml(o.tone)}</b><div class="flex gap-2"><button type="button" onclick="useAnnouncementSuggestion(${i}, 'platform')" class="text-xs px-3 py-1 rounded border">Use platform</button><button type="button" onclick="useAnnouncementSuggestion(${i}, 'sms')" class="text-xs px-3 py-1 rounded bg-primary text-primary-foreground">Use SMS</button></div></div><p class="mt-2 font-semibold">${escapeHtml(o.title)}</p><p class="text-sm mt-1"><b>Platform:</b> ${escapeHtml(o.platformMessage)}</p><p class="text-xs mt-1 text-muted-foreground"><b>SMS:</b> ${escapeHtml(o.smsMessage)}</p></div>`).join('')}</div>`;
    }
}
function useAnnouncementSuggestion(index, preferredChannel) {
    const o = (window.__announcementOptions || [])[index];
    if (!o) return;
    const channel = preferredChannel || document.getElementById('announcement-channel')?.value || 'platform';
    const titleEl = document.getElementById('announcement-title');
    const msgEl = document.getElementById('announcement-message');
    if (titleEl) titleEl.value = o.title || '';
    if (msgEl) msgEl.value = channel === 'sms' ? (o.smsMessage || o.platformMessage || '') : (o.platformMessage || o.smsMessage || '');
    if (preferredChannel && document.getElementById('announcement-channel')) document.getElementById('announcement-channel').value = preferredChannel;
    v130UpdateSmsEstimate();
}
function v130UpdateSmsEstimate() {
    const channel = document.getElementById('announcement-channel')?.value || 'platform';
    const target = document.getElementById('announcement-sms-estimate');
    if (target) target.textContent = channel === 'platform' ? 'No SMS tokens will be used.' : 'SMS tokens will be estimated from the selected audience before sending.';
}
async function setupAnnouncementRecipientControls() {
    const recipients = document.getElementById('announcement-recipients');
    if (!recipients || recipients.dataset.bound === 'true') return;
    recipients.dataset.bound = 'true';
    const classBox = document.getElementById('class-selector-container');
    const parentBox = document.getElementById('parent-selector-container');
    const update = async () => {
        const value = recipients.value;
        if (classBox) classBox.classList.toggle('hidden', value !== 'specific_class');
        if (parentBox) parentBox.classList.toggle('hidden', value !== 'individual_parent');
        if (value === 'specific_class') {
            const select = document.getElementById('announcement-class');
            if (select && !select.dataset.loaded) {
                const res = await api.admin.getClasses().catch(() => ({data: []}));
                select.innerHTML = '<option value="">Select class</option>' + (res.data || []).map(c => `<option value="${c.id}">${escapeHtml(c.name || c.grade || 'Class')}</option>`).join('');
                select.dataset.loaded = 'true';
            }
        }
        if (value === 'individual_parent') {
            const select = document.getElementById('announcement-parent');
            if (select && !select.dataset.loaded) {
                const res = await api.admin.getParents().catch(() => ({data: []}));
                select.innerHTML = '<option value="">Select parent</option>' + (res.data || []).map(p => `<option value="${p.userId || p.User?.id || p.id}">${escapeHtml(p.User?.name || p.name || p.email || 'Parent')}</option>`).join('');
                select.dataset.loaded = 'true';
            }
        }
    };
    recipients.addEventListener('change', update);
    update();
}
async function sendAnnouncement() {
    const recipientType = document.getElementById('announcement-recipients')?.value || 'all_parents';
    const channel = document.getElementById('announcement-channel')?.value || 'platform';
    const title = document.getElementById('announcement-title')?.value.trim() || '';
    const message = document.getElementById('announcement-message')?.value.trim() || '';
    if (!title || !message) return showToast('Please enter a title and message', 'error');
    showLoading();
    try {
        let userIds = [];
        if (['all_parents','fee_defaulters','pending_payments','subscription_expiry'].includes(recipientType)) {
            const parents = await api.admin.getParents();
            userIds = (parents.data || []).map(p => p.userId || p.User?.id).filter(Boolean);
        } else if (recipientType === 'whole_school') {
            const [parents, teachers, students] = await Promise.allSettled([api.admin.getParents(), api.admin.getTeachers ? api.admin.getTeachers() : Promise.resolve({data: []}), api.admin.getStudents ? api.admin.getStudents() : Promise.resolve({data: []})]);
            userIds = [...((parents.value?.data || []).map(p => p.userId || p.User?.id)), ...((teachers.value?.data || []).map(t => t.userId || t.User?.id)), ...((students.value?.data || []).map(st => st.userId || st.User?.id))].filter(Boolean);
        } else if (recipientType === 'teachers') {
            const teachers = await (api.admin.getTeachers ? api.admin.getTeachers() : apiRequest('/api/admin/teachers'));
            userIds = (teachers.data || []).map(t => t.userId || t.User?.id).filter(Boolean);
        } else if (recipientType === 'students') {
            const students = await (api.admin.getStudents ? api.admin.getStudents() : apiRequest('/api/admin/students'));
            userIds = (students.data || []).map(st => st.userId || st.User?.id).filter(Boolean);
        } else if (recipientType === 'specific_class') {
            const classId = document.getElementById('announcement-class')?.value;
            if (!classId) throw new Error('Please select a class');
            const students = await api.admin.getClassStudents(classId);
            const parentIds = new Set();
            (students.data || []).forEach(student => (student.parents || student.Parents || []).forEach(parent => { const uid = parent.userId || parent.User?.id; if (uid) parentIds.add(uid); }));
            userIds = [...parentIds];
        } else if (recipientType === 'individual_parent') {
            const parentId = document.getElementById('announcement-parent')?.value;
            if (!parentId) throw new Error('Please select a parent');
            userIds = [parentId];
        }
        if ((channel === 'sms' || channel === 'both')) {
            await api.sms.send({ audience: recipientType, recipientCount: userIds.length, message, title, recipientIds:userIds });
        }
        if (channel === 'platform' || channel === 'both') {
            for (const userId of userIds) {
                await apiRequest('/api/alerts', { method:'POST', body: JSON.stringify({ userId, type:'system', category:'Announcement', severity:'info', title, message, sourceLabel:'Admin announcement', data:{ sourceType:'admin_announcement', channel } }) });
            }
        }
        showToast(`Announcement sent to ${userIds.length} recipient(s) via ${channel}`, 'success');
        document.getElementById('announcement-title').value = '';
        document.getElementById('announcement-message').value = '';
        window.__announcementOptions = [];
        const panel = document.getElementById('announcement-ai-suggestion-panel');
        if (panel) { panel.classList.add('hidden'); panel.innerHTML = ''; }
    } catch (error) {
        showToast(error.message || 'Failed to send announcement', 'error');
    } finally { hideLoading(); }
}
window.renderAdminReportSettings = renderAdminReportSettings;
window.saveAdminReportSettings = saveAdminReportSettings;
window.collectAdminReportCardAppearanceSettings = collectAdminReportCardAppearanceSettings;
window.generateAnnouncementSuggestion = generateAnnouncementSuggestion;
window.useAnnouncementSuggestion = useAnnouncementSuggestion;
window.setupAnnouncementRecipientControls = setupAnnouncementRecipientControls;
window.v130UpdateSmsEstimate = v130UpdateSmsEstimate;

async function renderCalendarManagement() {
    showLoading();
    try {
        const res = await apiRequest('/api/calendar');
        const events = Array.isArray(res.data) ? res.data : (Array.isArray(res.events) ? res.events : (Array.isArray(res.data?.events) ? res.data.events : []));
        hideLoading();
        return `
            <div class="space-y-6 animate-fade-in">
                <div class="flex justify-between items-center">
                    <h2 class="text-2xl font-bold">Academic Calendar</h2>
                    <button onclick="showAddCalendarEventModal()" class="px-4 py-2 bg-primary text-white rounded-lg">+ Add Event</button>
                </div>
                <div id="admin-calendar-events" class="space-y-2">
                    ${events.length === 0 ? '<p class="text-center text-muted-foreground">No events yet</p>' :
                      events.map(e => `
                        <div class="flex justify-between items-center p-3 border rounded-lg">
                            <div>
                                <span class="font-medium">${escapeHtml(e.eventName)}</span>
                                <span class="text-xs text-muted-foreground ml-2">${formatDate(e.startDate)} ${e.endDate ? '→ '+formatDate(e.endDate) : ''} (${e.eventType})</span>
                            </div>
                            <button onclick="deleteCalendarEvent(${e.id})" class="text-red-600 text-sm">Delete</button>
                        </div>
                      `).join('')}
                </div>
            </div>`;
    } catch(e) { hideLoading(); return `<div class="text-red-500">Error loading calendar</div>`; }
}


async function renderAdminBrandingSection() {
    if (typeof hasSchoolFeature === 'function' && !hasSchoolFeature('school_branding')) {
        return `<div class="space-y-4 animate-fade-in"><h2 class="text-2xl font-bold">School Branding</h2><div class="rounded-xl border bg-card p-6"><p class="text-muted-foreground">School branding is included for every active school. Refresh the school session if this section does not load.</p></div></div>`;
    }
    let branding = {};
    try { branding = (await apiRequest('/api/owner/branding')).data || {}; } catch (_) { branding = (window.BrandingManager?.getStoredBranding?.() || {}); }
    const presets = window.BrandingManager?.colorPresets || { 'Shule Blue': { primaryColor:'#083A85', accentColor:'#11B5B1' } };
    const selectedPreset = branding.colorName || 'Shule Blue';
    const logo = branding.logoDataUrl || branding.logoUrl || branding.logo || '';
    const primary = branding.primaryColor || presets[selectedPreset]?.primaryColor || '#083A85';
    const accent = branding.accentColor || presets[selectedPreset]?.accentColor || '#11B5B1';
    return `<div class="space-y-6 animate-fade-in">
      <div><h2 class="text-2xl font-bold">School Branding</h2><p class="text-sm text-muted-foreground">Customize the sidebar identity, report branding, school colours and payment instructions for this school.</p></div>
      <div class="rounded-xl border bg-card p-6 grid gap-5 lg:grid-cols-2">
        <div class="space-y-4">
          <label class="block text-sm font-medium">Sidebar / Report Display Name<input id="branding-school-name" value="${escapeHtml(branding.schoolName || branding.displayName || '')}" class="mt-1 w-full rounded-lg border bg-background px-3 py-2"></label>
          <label class="block text-sm font-medium">Color Preset<select id="branding-color-name" class="mt-1 w-full rounded-lg border bg-background px-3 py-2" onchange="applyBrandingPresetPreview()">${Object.keys(presets).map(k => `<option value="${escapeHtml(k)}" ${k === selectedPreset ? 'selected' : ''}>${escapeHtml(k)}</option>`).join('')}</select></label>
          <div class="grid grid-cols-2 gap-3">
            <label class="block text-sm font-medium">Primary Color<input id="branding-primary-color" type="color" value="${escapeHtml(primary)}" class="mt-1 w-full h-11 rounded-lg border bg-background px-2 py-1"></label>
            <label class="block text-sm font-medium">Accent Color<input id="branding-accent-color" type="color" value="${escapeHtml(accent)}" class="mt-1 w-full h-11 rounded-lg border bg-background px-2 py-1"></label>
          </div>
          <label class="block text-sm font-medium">Logo URL<input id="branding-logo-url" value="${escapeHtml(branding.logoUrl || '')}" placeholder="https://..." class="mt-1 w-full rounded-lg border bg-background px-3 py-2"></label>
          <label class="block text-sm font-medium">Upload Logo<input id="branding-logo-file" type="file" accept="image/*" class="mt-1 w-full rounded-lg border bg-background px-3 py-2"></label>
        </div>
        <div class="space-y-4">
          <div class="rounded-xl border bg-muted/30 p-4"><p class="text-sm font-medium mb-2">Preview</p><div data-branding-logo-preview class="h-24 flex items-center justify-center bg-background rounded-lg border">${logo ? `<img src="${escapeHtml(logo)}" class="max-h-20 max-w-40 object-contain" onerror="this.replaceWith(document.createTextNode('Logo preview unavailable'))">` : '<span class="text-sm text-muted-foreground">Shule AI default logo</span>'}</div><div class="mt-3 flex gap-2"><span id="branding-primary-preview" class="h-8 w-16 rounded border" style="background:${escapeHtml(primary)}"></span><span id="branding-accent-preview" class="h-8 w-16 rounded border" style="background:${escapeHtml(accent)}"></span></div></div>
          <label class="block text-sm font-medium">Report Footer<textarea id="branding-report-footer" rows="3" class="mt-1 w-full rounded-lg border bg-background px-3 py-2">${escapeHtml(branding.reportFooter || '')}</textarea></label>
          <label class="block text-sm font-medium">Payment Instructions<textarea id="branding-payment-instructions" rows="3" class="mt-1 w-full rounded-lg border bg-background px-3 py-2">${escapeHtml(branding.paymentInstructions || '')}</textarea></label>
        </div>
        <div class="lg:col-span-2 flex justify-end"><button onclick="saveAdminBranding()" class="px-6 py-3 rounded-lg bg-primary text-primary-foreground">Save Branding</button></div>
      </div>
    </div>`;
}

function applyBrandingPresetPreview() {
  const presets = window.BrandingManager?.colorPresets || {};
  const selected = document.getElementById('branding-color-name')?.value;
  const preset = presets[selected];
  if (!preset) return;
  const primary = document.getElementById('branding-primary-color');
  const accent = document.getElementById('branding-accent-color');
  if (primary) primary.value = preset.primaryColor;
  if (accent) accent.value = preset.accentColor;
  const pp = document.getElementById('branding-primary-preview');
  const ap = document.getElementById('branding-accent-preview');
  if (pp) pp.style.background = preset.primaryColor;
  if (ap) ap.style.background = preset.accentColor;
}

async function saveAdminBranding() {
    const file = document.getElementById('branding-logo-file')?.files?.[0];
    const payload = { schoolName: document.getElementById('branding-school-name')?.value?.trim(), colorName: document.getElementById('branding-color-name')?.value, primaryColor: document.getElementById('branding-primary-color')?.value, accentColor: document.getElementById('branding-accent-color')?.value, reportFooter: document.getElementById('branding-report-footer')?.value?.trim(), paymentInstructions: document.getElementById('branding-payment-instructions')?.value?.trim() };
    const logoUrl = document.getElementById('branding-logo-url')?.value?.trim();
    if (logoUrl) payload.logoUrl = logoUrl;
    if (file) payload.logoDataUrl = await new Promise((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(r.result); r.onerror = reject; r.readAsDataURL(file); });
    showLoading();
    try { const res = await apiRequest('/api/owner/branding', { method:'PUT', body: JSON.stringify(payload) }); window.schoolBranding=res.data||payload;if(typeof safeSessionSet==='function')safeSessionSet('schoolBranding',JSON.stringify(typeof minimalBrandingForStorage==='function'?minimalBrandingForStorage(window.schoolBranding):window.schoolBranding));try{if(window.schoolScopedKey)localStorage.removeItem(window.schoolScopedKey('schoolBranding'))}catch(_){} window.dispatchEvent(new CustomEvent('school-branding-updated', { detail: window.schoolBranding })); showToast('Branding saved', 'success'); await showDashboardSection('school-branding'); } catch (e) { showToast(e.message || 'Could not save branding', 'error'); } finally { hideLoading(); }
}
window.renderAdminBrandingSection = renderAdminBrandingSection;
window.applyBrandingPresetPreview = applyBrandingPresetPreview;
window.saveAdminBranding = saveAdminBranding;

// ============ EXPORT FUNCTIONS ============
window.sendAnnouncement = sendAnnouncement;
window.renderAdminSection = renderAdminSection;
window.renderCalendarManagement = renderCalendarManagement;
window.renderAdminDashboard = renderAdminDashboard;
window.renderAdminStudents = renderAdminStudents;
window.renderAdminTeachers = renderAdminTeachers;
window.renderAdminPendingTeachers = renderAdminPendingTeachers;
window.renderAdminDuty = renderAdminDuty;
window.renderAdminFairnessReport = renderAdminFairnessReport;
window.renderAdminTeacherWorkload = renderAdminTeacherWorkload;
window.renderAdminSettings = renderAdminSettings;
window.renderAdminCustomSubjects = renderAdminCustomSubjects;
window.addCustomSubject = window.addCustomSubject || window.v148CreateCustomSubject || async function(){ if(window.showToast) showToast('Custom subject form is not ready. Reload Subjects and try again.', 'warning'); };
window.removeCustomSubject = window.removeCustomSubject || window.v148DeleteCustomSubject || async function(subject){ if(window.showToast) showToast('Custom subject removal is not ready. Reload Subjects and try again.', 'warning'); };
window.renderAdminTimetable = renderAdminTimetable;
window.generateTimetable = generateTimetable;
window.publishTimetable = publishTimetable;
window.renderTimetableGrid = renderTimetableGrid;


// ============ SCHOOL SUBSCRIPTION & BILLING ============
function formatKes(value) {
    return `KES ${Number(value || 0).toLocaleString()}`;
}

function subscriptionStatusBadge(status) {
    const value = String(status || 'pending').toLowerCase();
    const red = ['expired','restricted','cancelled'].includes(value);
    const green = ['active','paid_subscription','pilot_full_access'].includes(value);
    const cls = green ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : red ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300';
    return `<span class="px-2 py-1 rounded-full text-xs font-semibold ${cls}">${escapeHtml(value.replace(/_/g,' '))}</span>`;
}

async function renderAdminSubscriptionBilling() {
    try {
        const [statusRes, plansRes, historyRes] = await Promise.all([
            api.subscription.getSchoolStatus().catch(e => ({ success:false, data:null, message:e.message })),
            api.subscription.getPlans('school').catch(() => ({ data: [] })),
            api.subscription.getSchoolBillingHistory().catch(() => ({ data: [] }))
        ]);
        const status = statusRes.data || {};
        const plans = plansRes.data || [];
        const history = historyRes.data || [];
        const activePlanCode = status.planCode || 'school_starter';
        const enforcement = status.enforcement || {};
        window.__schoolSubscriptionEnforcement = enforcement;
        const schoolSnapshot = typeof getCurrentSchool === 'function' ? (getCurrentSchool() || {}) : {};
        if (schoolSnapshot && typeof schoolSnapshot === 'object') {
            schoolSnapshot.settings = { ...(schoolSnapshot.settings || {}), billing:{ ...(schoolSnapshot.settings?.billing || {}), ...enforcement } };
            schoolSnapshot.accessMode = enforcement.restricted ? 'expired_subscription' : (schoolSnapshot.accessMode || status.accessMode);
        }
        const billingState = enforcement.billingState || 'not_enforced';
        return `
        <div class="space-y-6 animate-fade-in shule-billing-page">
            <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h2 class="text-2xl font-bold">Subscription & Billing</h2>
                    <p class="text-sm text-muted-foreground">Manage the school subscription paid to Shule AI. This is separate from parent school-fee payments.</p>
                </div>
                <button onclick="openSchoolBillingModal('${escapeHtml(activePlanCode)}')" class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">Renew / Upgrade</button>
            </div>

            <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div class="rounded-xl border bg-card p-5">
                    <p class="text-sm text-muted-foreground">Current Plan</p>
                    <h3 class="text-2xl font-bold mt-1">${escapeHtml(status.currentPlan || 'Starter')}</h3>
                    <div class="mt-2">${subscriptionStatusBadge(status.status)}</div>
                </div>
                <div class="rounded-xl border bg-card p-5">
                    <p class="text-sm text-muted-foreground">Billing Cycle</p>
                    <h3 class="text-2xl font-bold mt-1 capitalize">${escapeHtml(status.billingCycle || 'monthly')}</h3>
                    <p class="text-xs text-muted-foreground mt-2">Maintenance included</p>
                </div>
                <div class="rounded-xl border bg-card p-5">
                    <p class="text-sm text-muted-foreground">Next Payment Due</p>
                    <h3 class="text-xl font-bold mt-1">${enforcement.nextDueDate ? new Date(enforcement.nextDueDate).toLocaleDateString() : (status.expiresAt ? new Date(status.expiresAt).toLocaleDateString() : 'Not configured')}</h3>
                    <div class="mt-2">${subscriptionStatusBadge(billingState)}</div>
                </div>
                <div class="rounded-xl border bg-card p-5">
                    <p class="text-sm text-muted-foreground">Students</p>
                    <h3 class="text-2xl font-bold mt-1">${Number(status.studentCount || 0).toLocaleString()}</h3>
                    <p class="text-xs text-muted-foreground mt-2">School tier: ${escapeHtml(status.schoolTier || status.currentPlan || 'Starter')}</p>
                </div>
            </div>

            ${enforcement.enforcementEnabled ? `
                <div class="rounded-xl border ${enforcement.restricted ? 'border-red-300 bg-red-50 text-red-900 dark:bg-red-900/20 dark:text-red-200 dark:border-red-700' : 'border-yellow-300 bg-yellow-50 text-yellow-900 dark:bg-yellow-900/20 dark:text-yellow-200 dark:border-yellow-700'} p-4">
                    <h3 class="font-semibold">${enforcement.restricted ? '⛔ Subscription payment overdue — access restricted' : '⚠ Subscription payment reminders are enforced'}</h3>
                    <p class="text-sm mt-1">${enforcement.restricted ? 'Pay the outstanding subscription to restore full access. Your school information has not been deleted.' : `The ${escapeHtml(enforcement.billingCycle || status.billingCycle || 'monthly')} billing schedule remains active until payment is confirmed.`}</p>
                    ${enforcement.graceEndsAt ? `<p class="text-xs mt-2">Grace period ends: ${new Date(enforcement.graceEndsAt).toLocaleString()}</p>` : ''}
                    ${enforcement.academicPeriod?.term ? `<p class="text-xs mt-1">Academic period: ${escapeHtml(enforcement.academicPeriod.term)} ${escapeHtml(enforcement.academicPeriod.academicYear || '')}</p>` : ''}
                </div>
            ` : `<div class="rounded-xl border border-blue-200 bg-blue-50 text-blue-900 dark:bg-blue-900/20 dark:text-blue-200 p-4"><h3 class="font-semibold">Choose a billing frequency</h3><p class="text-sm mt-1">Monthly, termly and yearly are payment schedules—not separate plans. Once chosen, reminders and payment due dates will be enforced.</p></div>`}

            <div class="grid gap-4 lg:grid-cols-3">
                ${plans.map(plan => `
                    <div class="rounded-xl border bg-card p-5 flex flex-col ${activePlanCode === plan.code ? 'ring-2 ring-primary' : ''}">
                        <div class="flex items-start justify-between gap-3">
                            <div>
                                <h3 class="text-xl font-bold">${escapeHtml(plan.displayName || plan.name)}</h3>
                                <p class="text-sm text-muted-foreground">${plan.code === 'school_growth' || plan.code === 'growth' ? '401–800 active students' : plan.code === 'school_enterprise' || plan.code === 'enterprise' ? '801+ active students' : '1–400 active students'}</p>
                            </div>
                            ${activePlanCode === plan.code ? '<span class="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">Current</span>' : ''}
                        </div>
                        <div class="mt-4 space-y-1">
                            <p class="text-2xl font-bold">${formatKes(plan.monthlyPriceKes || plan.price)}</p>
                            <p class="text-sm text-muted-foreground">${plan.termlyPriceKes ? `${formatKes(plan.termlyPriceKes)} / term` : 'Termly pricing available when configured'}</p><p class="text-sm text-muted-foreground">${plan.yearlyPriceKes ? `${formatKes(plan.yearlyPriceKes)} / year` : 'Custom yearly pricing'}</p>
                            <p class="text-xs text-muted-foreground">Complete core platform included. Plan price is based on active students.</p>
                        </div>
                        <div class="mt-4 flex-1">
                            <p class="text-sm font-semibold mb-2">Included</p>
                            <ul class="text-sm text-muted-foreground space-y-1 max-h-40 overflow-auto">
                                ${(plan.features || []).slice(0, 8).map(f => `<li>• ${escapeHtml(f)}</li>`).join('')}
                            </ul>
                        </div>
                        <button onclick="openSchoolBillingModal('${escapeHtml(plan.code)}')" class="mt-5 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">${activePlanCode === plan.code ? 'Renew Plan' : 'Choose Plan'}</button>
                    </div>
                `).join('')}
            </div>

            <div class="rounded-xl border bg-card overflow-hidden">
                <div class="p-4 border-b flex items-center justify-between">
                    <div><h3 class="font-semibold">Billing History</h3><p class="text-sm text-muted-foreground">Recent school subscription payment attempts and renewals.</p></div>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-sm">
                        <thead class="bg-muted/50"><tr><th class="text-left px-4 py-3">Date</th><th class="text-left px-4 py-3">Plan</th><th class="text-left px-4 py-3">Cycle</th><th class="text-left px-4 py-3">Amount</th><th class="text-left px-4 py-3">Status</th><th class="text-left px-4 py-3">Receipt</th></tr></thead>
                        <tbody class="divide-y">
                            ${history.length ? history.map(row => `<tr><td class="px-4 py-3">${new Date(row.createdAt).toLocaleString()}</td><td class="px-4 py-3">${escapeHtml(row.planName || row.planCode)}</td><td class="px-4 py-3 capitalize">${escapeHtml(row.billingCycle || 'monthly')}</td><td class="px-4 py-3">${formatKes(row.amount)}</td><td class="px-4 py-3">${subscriptionStatusBadge(row.status === 'success' ? 'active' : row.status)}</td><td class="px-4 py-3">${escapeHtml(row.mpesaReceiptNumber || '-')}</td></tr>`).join('') : `<tr><td colspan="6" class="px-4 py-8 text-center text-muted-foreground">No billing history yet.</td></tr>`}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>`;
    } catch (error) {
        return `<div class="rounded-xl border bg-card p-8 text-red-500">Error loading subscription billing: ${escapeHtml(error.message)}</div>`;
    }
}

window.openSchoolBillingModal = async function(defaultPlanCode = 'school_growth') {
    const plansRes = await api.subscription.getPlans('school').catch(() => ({ data: [] }));
    const plans = plansRes.data || [];
    const options = plans.map(plan => `<option value="${escapeHtml(plan.code)}" data-monthly="${Number(plan.monthlyPriceKes || plan.price || plan.amount || 0)}" data-termly="${Number(plan.termlyPriceKes || 0)}" data-yearly="${Number(plan.yearlyPriceKes || 0)}" ${plan.code === defaultPlanCode ? 'selected' : ''}>${escapeHtml(plan.displayName || plan.name)} — ${formatKes(plan.monthlyPriceKes || plan.price || plan.amount)}/month</option>`).join('');
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4';
    modal.id = 'school-billing-modal';
    modal.innerHTML = `
        <div class="w-full max-w-lg rounded-2xl border bg-card text-card-foreground shadow-xl">
            <div class="p-5 border-b flex items-center justify-between">
                <h3 class="text-lg font-bold">Renew / Upgrade School Subscription</h3>
                <button onclick="document.getElementById('school-billing-modal')?.remove()" class="text-muted-foreground hover:text-foreground">×</button>
            </div>
            <div class="p-5 space-y-4">
                <div><label class="text-sm font-medium">Select Plan</label><select id="school-sub-plan" class="mt-1 w-full rounded-lg border bg-background px-3 py-2">${options}</select></div>
                <div><label class="text-sm font-medium">Billing Cycle</label><select id="school-sub-cycle" class="mt-1 w-full rounded-lg border bg-background px-3 py-2"><option value="monthly">Monthly — reminder every month</option><option value="termly">Termly — follows published term dates</option><option value="yearly">Yearly — follows the academic year</option></select></div>
                <div><label class="text-sm font-medium">M-PESA Phone Number</label><input id="school-sub-phone" placeholder="2547XXXXXXXX" class="mt-1 w-full rounded-lg border bg-background px-3 py-2"></div>
                <div class="rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground">This payment goes to the Shule AI platform account, not the school fee account. The selected cycle will be saved and reminders will continue until payment is confirmed. Termly and yearly billing require published academic calendar dates.</div>
            </div>
            <div class="p-5 border-t flex justify-end gap-3"><button onclick="document.getElementById('school-billing-modal')?.remove()" class="px-4 py-2 rounded-lg border">Cancel</button><button onclick="submitSchoolSubscriptionSTK()" class="px-4 py-2 rounded-lg bg-primary text-primary-foreground">Pay via M-PESA</button></div>
        </div>`;
    document.body.appendChild(modal);
};

window.submitSchoolSubscriptionSTK = async function() {
    const planSelect = document.getElementById('school-sub-plan');
    const cycleSelect = document.getElementById('school-sub-cycle');
    const planCode = planSelect?.value;
    const billingCycle = cycleSelect?.value || 'monthly';
    const selected = planSelect?.selectedOptions?.[0];
    const amount = Number(selected?.dataset?.[billingCycle] || selected?.dataset?.monthly || 0);
    const phone = document.getElementById('school-sub-phone')?.value?.trim();
    if (!phone) { alert('Enter payment phone number'); return; }
    if (!amount || amount <= 0) { alert('Could not determine the selected plan amount.'); return; }
    try {
        const res = await api.payments.initiate({
            paymentType: 'platform',
            platformPurpose: 'school_subscription',
            purpose: 'school_subscription',
            ownerType: 'school',
            planCode,
            plan: planCode,
            billingCycle,
            billingPeriod: billingCycle,
            amount,
            phone,
            paymentMethod: 'mobile_money'
        });
        if (res?.data?.checkoutUrl) window.open(res.data.checkoutUrl, '_blank', 'noopener');
        alert(res.message || 'Platform subscription payment started using the active platform provider.');
        document.getElementById('school-billing-modal')?.remove();
        setTimeout(() => showDashboardSection('subscription-billing'), 1200);
    } catch (error) {
        alert(error.message || 'Could not start platform subscription payment.');
    }
};


window.loadAdminCalendarPreviewEvents = loadAdminCalendarPreviewEvents;


function normalizeClassLevelInputKey(value) {
    const raw = String(value || '').trim().toLowerCase().replace(/[-\s]+/g, '_');
    if (/^grade_?\d+$/.test(raw)) return `grade_${raw.match(/\d+/)[0]}`;
    if (/^class_?\d+$/.test(raw)) return `class_${raw.match(/\d+/)[0]}`;
    if (/^form_?\d+$/.test(raw)) return `form_${raw.match(/\d+/)[0]}`;
    if (/^year_?\d+$/.test(raw)) return `year_${raw.match(/\d+/)[0]}`;
    if (raw === 'pre_k' || raw === 'prek') return 'pre_k';
    return raw;
}
function parsePerLevelStreamsText(value) {
    const out = {};
    for (const line of String(value || '').split(/\n+/)) {
        const [left, ...right] = line.split(':');
        if (!left || !right.length) continue;
        const code = normalizeClassLevelInputKey(left);
        const streams = right.join(':').split(',').map(x=>x.trim()).filter(Boolean);
        if (code) out[code] = streams;
    }
    return out;
}

// ============ V102 CURRICULUM + CUSTOM STRUCTURE + SUBJECT CHECKBOX UI ============
const v102OriginalRenderAdminCustomSubjects = window.renderAdminCustomSubjects || renderAdminCustomSubjects;
window.renderAdminCustomSubjects=async function(){try{const[setup,classesRes]=await Promise.all([api.admin.getCurriculumSetup(),api.admin.getClasses().catch(()=>({data:[]}))]),data=setup.data||{},cfg=data.config||{},subjects=data.subjectBank||[],classes=classesRes?.data||[],allSaved=Array.isArray(cfg.schoolSubjects)?cfg.schoolSubjects:[],custom=allSaved.filter(x=>x.isCustom),saved=new Set(allSaved.filter(x=>x.isOffered!==false).map(x=>x.subjectId||x.id||x.name));window.__v148CustomSubjects=custom;const grouped=subjects.reduce((a,x)=>{const g=x.levelLabels?.[0]||x.levelCodes?.[0]||'Subjects';(a[g]||=[]).push(x);return a;},{});return`<div class="space-y-6"><div><h2 class="text-2xl font-bold">Subjects</h2><p class="text-sm text-muted-foreground">Select curriculum subjects and add school-specific subjects.</p></div><section class="rounded-xl border bg-card p-6"><h3 class="font-semibold text-lg">Add Custom Subject</h3><div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mt-4"><label class="text-sm">Name<input id="custom-subject-name" class="mt-1 w-full rounded-lg border bg-background px-3 py-2" placeholder="Robotics"></label><label class="text-sm">Code<input id="custom-subject-code" class="mt-1 w-full rounded-lg border bg-background px-3 py-2" placeholder="ROB"></label><label class="text-sm">Scope<select id="custom-subject-scope" onchange="v148ToggleCustomSubjectClasses()" class="mt-1 w-full rounded-lg border bg-background px-3 py-2"><option value="school">Whole school</option><option value="class">Selected classes</option></select></label><label class="text-sm">Grading<select id="custom-subject-grading" class="mt-1 w-full rounded-lg border bg-background px-3 py-2"><option value="school_default">School default</option><option value="numeric">Numeric marks</option><option value="competency">Competency</option><option value="pass_fail">Pass / Fail</option></select></label></div><div id="custom-subject-class-box" class="hidden mt-4"><p class="text-sm font-medium">Classes</p><div class="grid gap-2 sm:grid-cols-2 md:grid-cols-3 mt-2">${classes.map(c=>`<label class="flex items-center gap-2 rounded-lg border p-3 text-sm"><input type="checkbox" class="custom-subject-class" value="${c.id}">${escapeHtml(c.name||c.grade||`Class ${c.id}`)}</label>`).join('')}</div></div><button onclick="v148CreateCustomSubject()" class="mt-4 px-4 py-2 rounded-lg bg-primary text-white">Add Custom Subject</button></section><section><h3 class="font-semibold text-lg mb-3">Custom Subjects</h3><div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">${custom.length?custom.map(x=>`<div class="rounded-xl border bg-card p-4"><div class="flex justify-between gap-3"><div><strong>${escapeHtml(x.name)}</strong><p class="text-xs text-muted-foreground">${escapeHtml(x.code||'CUSTOM')} • ${x.scope==='class'?'Selected classes':'Whole school'}</p></div><button onclick="v148DeleteCustomSubject('${escapeHtml(x.subjectId)}')" class="text-red-600 text-xs">Remove</button></div></div>`).join(''):'<div class="rounded-xl border border-dashed p-5 text-muted-foreground">No custom subjects yet.</div>'}</div></section><section class="rounded-xl border bg-card p-6"><div class="flex justify-between"><div><h3 class="font-semibold text-lg">Curriculum Subjects</h3><p class="text-sm text-muted-foreground">${escapeHtml(cfg.curriculum||'CBC')}</p></div><button onclick="v102SaveSchoolSubjectCheckboxes()" class="px-4 py-2 bg-primary text-white rounded-lg">Save Curriculum Subjects</button></div></section><div class="space-y-4">${Object.entries(grouped).map(([g,items])=>`<div class="rounded-xl border bg-card p-5"><h3 class="font-semibold mb-3">${escapeHtml(g)}</h3><div class="grid md:grid-cols-3 gap-3">${items.map(item=>`<label class="flex gap-2 p-3 rounded-lg border"><input type="checkbox" class="v102-school-subject mt-1" data-subject='${JSON.stringify(item).replace(/'/g,'&#39;')}' ${saved.has(item.id)||saved.has(item.name)?'checked':''}><span>${escapeHtml(item.name)}</span></label>`).join('')}</div></div>`).join('')}</div></div>`;}catch(e){return`<div class="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">${escapeHtml(e.message||'Subjects could not be loaded')}</div>`;}};

const v102OriginalRenderAdminSettings = window.renderAdminSettings || renderAdminSettings;
window.renderAdminSettings = function() {
    const curriculum = schoolSettings.curriculum || schoolSettings.system || schoolSettings.settings?.curriculumEngine?.curriculum || 'cbc';
    const engine = schoolSettings.settings?.curriculumEngine || {};
    const classGeneration = schoolSettings.settings?.classGeneration || schoolSettings.classGeneration || engine.classGeneration || {};
    const configuredStreams = Array.isArray(classGeneration.streams) ? classGeneration.streams : [];
    const configuredCustomClasses = Array.isArray(classGeneration.customClasses) ? classGeneration.customClasses : [];
    const configuredPerLevelStreams = classGeneration.perLevelStreams && typeof classGeneration.perLevelStreams === 'object' ? classGeneration.perLevelStreams : {};
    const structureType = engine.structureType || schoolSettings.schoolStructure || schoolSettings.settings?.schoolStructure || 'mixed';
    const enabled = new Set(engine.enabledLevels || schoolSettings.enabledLevels || []);
    const levelList = (schoolSettings.curriculumSetup?.enabledLevels || []).map(l => l.label).join(', ');
    return `
        <div class="space-y-6 animate-fade-in">
            <h2 class="text-2xl font-bold">School Settings</h2>
            <p class="text-sm text-muted-foreground">Curriculum and structure are the master source for classes, subjects, grading, report cards and Career Compass.</p>
            <div class="grid gap-6">
                <div class="rounded-xl border bg-card p-6"><h3 class="font-semibold mb-4">School Information</h3><div class="space-y-4"><div><label class="block text-sm font-medium mb-1">School Name</label><input type="text" id="settings-school-name" value="${schoolSettings.name || schoolSettings.schoolName || ''}" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"></div></div></div>
                <div class="rounded-xl border bg-card p-6">
                    <h3 class="font-semibold mb-4">Curriculum + School Structure</h3>
                    <div class="grid md:grid-cols-2 gap-4">
                        <div><label class="block text-sm font-medium mb-1">Select Curriculum</label><select id="settings-curriculum" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"><option value="cbc" ${curriculum === 'cbc' ? 'selected' : ''}>CBC / CBE</option><option value="844" ${curriculum === '844' ? 'selected' : ''}>8-4-4</option><option value="british" ${curriculum === 'british' ? 'selected' : ''}>British / Cambridge</option><option value="american" ${curriculum === 'american' ? 'selected' : ''}>American</option><option value="custom" ${curriculum === 'custom' ? 'selected' : ''}>Custom</option></select></div>
                        <div><label class="block text-sm font-medium mb-1">School Structure</label><select id="settings-school-structure" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"><option value="primary_only" ${structureType === 'primary_only' ? 'selected' : ''}>Primary only</option><option value="junior_only" ${structureType === 'junior_only' ? 'selected' : ''}>Junior only</option><option value="senior_only" ${structureType === 'senior_only' ? 'selected' : ''}>Senior only</option><option value="secondary_only" ${structureType === 'secondary_only' ? 'selected' : ''}>Secondary only</option><option value="mixed" ${structureType === 'mixed' ? 'selected' : ''}>Mixed / Full</option><option value="custom" ${structureType === 'custom' ? 'selected' : ''}>Custom enabled levels</option></select></div>
                    </div>
                    <div class="mt-4 p-4 bg-muted/30 rounded-lg"><p class="text-sm"><span class="font-medium">Currently enabled:</span> ${levelList || 'Use the structure builder below after saving curriculum.'}</p><button onclick="v102LoadStructureBuilder()" class="mt-3 px-3 py-2 rounded-lg border hover:bg-accent text-sm">Load / Edit Enabled Levels</button><div id="v102-structure-builder" class="mt-4"></div></div>
                </div>
                <div class="rounded-xl border bg-card p-6">
                    <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                        <div><h3 class="font-semibold mb-1">Academic & Report Card Settings</h3><p class="text-sm text-muted-foreground">Set assessment columns, report-card template rules, signatures, comments, ranking/position display, fee-balance visibility, and curriculum grading output from inside School Settings.</p></div>
                        <button onclick="showDashboardSection('report-settings')" class="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm">Open Report Card Settings</button>
                    </div>
                    <div class="mt-4 grid gap-3 md:grid-cols-3 text-sm"><div class="rounded-lg bg-muted/30 p-3"><b>Assessment columns</b><p class="text-muted-foreground">CAT, Midterm, End Term, SBA/Project/Practical.</p></div><div class="rounded-lg bg-muted/30 p-3"><b>Template + signatures</b><p class="text-muted-foreground">Logo, watermark, class teacher/headteacher signatures.</p></div><div class="rounded-lg bg-muted/30 p-3"><b>Calculation rules</b><p class="text-muted-foreground">Counting tests, excluded subjects, position and grading display.</p></div></div>
                </div>
                <div class="rounded-xl border bg-card p-6">
                    <h3 class="font-semibold mb-1">Class Generation Preferences</h3>
                    <p class="text-sm text-muted-foreground mb-4">These settings define only the classes this school actually offers. Saving does not alter existing classes.</p>
                    <div class="grid gap-4 md:grid-cols-2">
                        <div><label class="block text-sm font-medium mb-1">Default streams (comma separated)</label><input id="settings-class-streams" value="${escapeHtml(configuredStreams.join(', '))}" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" placeholder="East, West"><p class="text-xs text-muted-foreground mt-1">Applied to every selected grade unless that grade has an override.</p></div>
                        <div><label class="block text-sm font-medium mb-1">Custom class names</label><textarea id="settings-custom-class-names" rows="3" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" placeholder="Form 3 Blue, Special Unit">${escapeHtml(configuredCustomClasses.map(x=>typeof x==='string'?x:x.name).filter(Boolean).join('\n'))}</textarea></div>
                    </div>
                    <div class="mt-4"><label class="block text-sm font-medium mb-1">Different streams for specific grades</label><textarea id="settings-level-streams" rows="4" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" placeholder="Grade 7: East, West&#10;Grade 8: North">${escapeHtml(Object.entries(configuredPerLevelStreams).map(([code,values])=>`${code}: ${(Array.isArray(values)?values:[]).join(', ')}`).join('\n'))}</textarea><p class="text-xs text-muted-foreground mt-1">One level per line. These entries override the default streams only for that level.</p></div>
                    <div id="class-generation-save-preview" class="mt-4 rounded-lg border border-dashed p-3 text-sm text-muted-foreground">Save settings to calculate the safe missing-class preview.</div>
                    <button type="button" onclick="autoGenerateClassesOnCurriculumChange()" class="mt-3 px-4 py-2 rounded-lg border hover:bg-accent text-sm">Review & Generate Missing Classes</button>
                </div>
                <div class="flex justify-end"><button onclick="saveAllSettings()" class="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">Save Settings</button></div>
            </div>
        </div>`;
};

window.v102ToggleSubjectGroup = function(group, checked) {
    document.querySelectorAll(`[data-v102-group="${group}"] input[type="checkbox"]`).forEach(cb => { cb.checked = checked; });
};

window.v102SaveSchoolSubjectCheckboxes = async function() {
    showLoading();
    try {
        const subjects=Array.from(document.querySelectorAll('.v102-school-subject:checked')).map(cb=>JSON.parse(cb.dataset.subject.replace(/&#39;/g,"'")));const custom=Array.isArray(window.__v148CustomSubjects)?window.__v148CustomSubjects:[];await api.admin.saveSchoolSubjects([...subjects,...custom]);
        showToast(`✅ ${subjects.length} subjects saved and synced to classes/grading`, 'success');
        await showDashboardSection('custom-subjects');
    } catch(error) { showToast(error.message || 'Failed to save subjects', 'error'); }
    finally { hideLoading(); }
};

window.v148ToggleCustomSubjectClasses=function(){document.getElementById('custom-subject-class-box')?.classList.toggle('hidden',document.getElementById('custom-subject-scope')?.value!=='class');};window.v148CreateCustomSubject=async function(){const name=document.getElementById('custom-subject-name')?.value?.trim(),code=document.getElementById('custom-subject-code')?.value?.trim(),scope=document.getElementById('custom-subject-scope')?.value||'school',gradingMethod=document.getElementById('custom-subject-grading')?.value||'school_default',classIds=Array.from(document.querySelectorAll('.custom-subject-class:checked')).map(x=>Number(x.value)).filter(Boolean);if(!name)return showToast('Enter the subject name','error');if(scope==='class'&&!classIds.length)return showToast('Select at least one class','error');try{const r=await api.admin.createCustomSubject({name,code,scope,classIds,gradingMethod});showToast(r.message||'Custom subject added','success');await showDashboardSection('custom-subjects');}catch(e){showToast(e.message||'Could not add subject','error');}};window.v148DeleteCustomSubject=async function(id){if(!confirm('Remove this custom subject?'))return;try{const r=await api.admin.deleteCustomSubject(id);showToast(r.message||'Subject removed','success');await showDashboardSection('custom-subjects');}catch(e){showToast(e.message||'Could not remove subject','error');}};

window.v102LoadStructureBuilder = async function() {
    showLoading();
    try {
        const res = await api.admin.getCurriculumLevels();
        const data = res.data || {};
        const enabled = new Set(data.enabledLevels || []);
        const enabledGroups = new Set(data.enabledLevelGroups || []);
        const box = document.getElementById('v102-structure-builder');
        const groups = data.levelGroups || [];
        const groupHtml = groups.length ? `<div class="grid md:grid-cols-2 gap-3 mb-4">${groups.map(g => {
            const allChecked = (g.levelCodes || []).every(code => enabled.has(code)) || enabledGroups.has(g.code);
            return `<label class="flex items-start gap-3 p-4 rounded-xl border bg-background"><input type="checkbox" class="v130-enabled-group mt-1" value="${g.code}" data-levels="${(g.levelCodes || []).join(',')}" ${allChecked ? 'checked' : ''} onchange="v130ApplyLevelGroup(this)"><span><span class="font-semibold">${g.label}</span><span class="block text-xs text-muted-foreground">${g.description || ''}</span></span></label>`;
        }).join('')}</div>` : '';
        const levelHtml = `<details class="rounded-xl border bg-muted/20 p-3"><summary class="cursor-pointer text-sm font-medium">Advanced individual levels</summary><div class="grid md:grid-cols-3 gap-2 mt-3">${(data.levels || []).map(l => `<label class="flex items-center gap-2 p-2 rounded border bg-background"><input type="checkbox" class="v102-enabled-level" value="${l.code}" ${enabled.has(l.code) ? 'checked' : ''}><span class="text-sm">${l.label}<span class="block text-xs text-muted-foreground">${l.group || ''}</span></span></label>`).join('')}</div></details>`;
        box.innerHTML = `${groupHtml}${levelHtml}`;
    } catch(error) { showToast(error.message || 'Failed to load levels', 'error'); }
    finally { hideLoading(); }
};
window.v130ApplyLevelGroup = function(cb) {
    const levels = String(cb.dataset.levels || '').split(',').filter(Boolean);
    for (const code of levels) {
        const levelBox = document.querySelector(`.v102-enabled-level[value="${code}"]`);
        if (levelBox) levelBox.checked = cb.checked;
    }
};

window.saveAllSettings = async function() {
    const curriculum = document.getElementById('settings-curriculum')?.value;
    const schoolName = document.getElementById('settings-school-name')?.value;
    const structureType = document.getElementById('settings-school-structure')?.value || document.getElementById('settings-school-level')?.value;
    const enabledLevels = Array.from(document.querySelectorAll('.v102-enabled-level:checked')).map(x => x.value);
    const enabledLevelGroups = Array.from(document.querySelectorAll('.v130-enabled-group:checked')).map(x => x.value);
    const streams = String(document.getElementById('settings-class-streams')?.value || '').split(',').map(x=>x.trim()).filter(Boolean);
    const customClasses = String(document.getElementById('settings-custom-class-names')?.value || '').split(/[\n,]+/).map(x=>x.trim()).filter(Boolean).map(name=>({name}));
    const perLevelStreams = parsePerLevelStreamsText(document.getElementById('settings-level-streams')?.value || '');
    if (!schoolName) { showToast('School name is required', 'error'); return; }
    showLoading();
    try {
        const response = await api.admin.updateSchoolSettings({ curriculum, schoolName, structureType, schoolStructure: structureType, enabledLevels, enabledLevelGroups, customSubjects: customSubjects || [], classGeneration:{ streams, customClasses, perLevelStreams } });
        if (response && response.success) {
            window.schoolSettings = response.data;
            window.customSubjects = response.data.settings?.customSubjects || [];
            const school = JSON.parse(localStorage.getItem('school') || '{}');
            school.name = schoolName; school.system = curriculum; school.settings = response.data.settings;
            if(typeof safeSessionSet==='function')safeSessionSet('school',JSON.stringify(typeof minimalSchoolForStorage==='function'?minimalSchoolForStorage(school,typeof getCurrentUser==='function'?getCurrentUser():null):school));
            updateAllSchoolNameElements(schoolName);
            const preview = response.data?.classGenerationPreview || {};
            const previewBox = document.getElementById('class-generation-save-preview');
            if (previewBox) previewBox.textContent = `${Number(preview.createCount || 0)} missing class(es) can be added; ${Number(preview.skipCount || 0)} existing class(es) will be preserved and skipped.`;
            showToast(`✅ Settings saved. ${Number(preview.createCount || 0)} missing class(es) await your confirmation.`, 'success');
            await updateAdminStats();
        } else throw new Error(response?.message || 'Save failed');
    } catch(error) { console.error('V102 save settings error:', error); showToast(error.message || 'Failed to save settings', 'error'); }
    finally { hideLoading(); }
};
try { renderAdminCustomSubjects = window.renderAdminCustomSubjects; renderAdminSettings = window.renderAdminSettings; } catch (e) { console.warn('V102 admin renderer binding skipped', e); }


// ============ V107 INTEGRATED STUDENT SUBJECT SELECTION + MANUAL BILLING ============
function adminEsc(value) {
    return String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}
function adminArray(value) { return Array.isArray(value) ? value : []; }
function adminSubjectStatusBadge(status) {
    const s = String(status || 'not_taken').toLowerCase();
    const cls = s === 'taking' || s === 'taking_core' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : s === 'exempted' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200';
    return `<span class="px-2 py-1 rounded-full text-xs font-semibold ${cls}">${adminEsc(s.replace(/_/g, ' '))}</span>`;
}
async function loadAdminStudentSubjectPayload(selectedStudentId) {
    const [studentsRes, classesRes] = await Promise.all([api.admin.getStudents(), api.admin.getClasses().catch(() => ({ data: [] }))]);
    const students = adminArray(studentsRes.data);
    let studentId = selectedStudentId || localStorage.getItem('selectedStudentForSubjects') || students[0]?.id || '';
    if (!students.some(s => String(s.id) === String(studentId))) studentId = students[0]?.id || '';
    let detail = null;
    if (studentId) {
        detail = await api.admin.getStudentSubjectSelection(studentId);
        localStorage.setItem('selectedStudentForSubjects', String(studentId));
    }
    return { students, classes: adminArray(classesRes.data), studentId, detail: detail?.data || null };
}
function subjectLevelLabel(subject) {
    const levels = subject.levelLabels || subject.levelCodes || [];
    return Array.isArray(levels) && levels.length ? levels.join(', ') : (subject.levelLabel || subject.levelCode || 'Current class');
}
function renderSubjectSelectionRows(eligibleSubjects, selections) {
    const selectedByName = new Map(adminArray(selections).map(row => [String(row.subjectName || row.name || '').toLowerCase(), row]));
    if (!eligibleSubjects.length) {
        return `<div class="rounded-xl border border-yellow-300 bg-yellow-50 text-yellow-900 dark:bg-yellow-900/20 dark:text-yellow-100 dark:border-yellow-700 p-5"><h3 class="font-semibold">No valid subjects found for this student class.</h3><p class="text-sm mt-1">Save the curriculum structure and Add Subjects checklist first. The new engine will not use old/manual subjects.</p></div>`;
    }
    const groups = new Map();
    for (const subject of eligibleSubjects) {
        const key = subject.category || 'subjects';
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(subject);
    }
    return [...groups.entries()].map(([category, subjects]) => `<div class="rounded-xl border bg-card overflow-hidden"><div class="px-4 py-3 border-b bg-muted/30 flex items-center justify-between gap-3"><div><h3 class="font-semibold capitalize">${adminEsc(String(category).replace(/_/g, ' '))}</h3><p class="text-xs text-muted-foreground">Choose whether this learner is taking each subject.</p></div><span class="text-xs rounded-full border px-2 py-1">${subjects.length} subject(s)</span></div><div class="divide-y">${subjects.map(subject => {
        const saved = selectedByName.get(String(subject.name || '').toLowerCase());
        const defaultStatus = saved?.status || (subject.isCore || subject.category === 'compulsory' ? 'taking' : 'not_taken');
        const data = { subjectId: subject.id, subjectName: subject.name, name: subject.name, category: subject.category || '', isCore: !!subject.isCore, isCompulsory: !!(subject.isCore || subject.category === 'compulsory'), isElective: !!subject.isOptional, pathway: subject.pathway || '', track: subject.track || '' };
        const meta = `${subjectLevelLabel(subject)}${subject.pathway ? ' • ' + subject.pathway : ''}${subject.track ? ' • ' + subject.track : ''}`;
        return `<div class="p-4 grid gap-3 md:grid-cols-[1fr_auto_auto] md:items-center"><div><p class="font-semibold">${adminEsc(subject.name)}</p><p class="text-xs text-muted-foreground">${adminEsc(meta)}</p></div><div>${adminSubjectStatusBadge(defaultStatus)}</div><select class="student-subject-status rounded-lg border bg-background px-3 py-2 text-sm" data-subject='${adminEsc(JSON.stringify(data))}'><option value="taking" ${defaultStatus === 'taking' || defaultStatus === 'taking_core' ? 'selected' : ''}>Taking / Counted if marked</option><option value="not_taken" ${defaultStatus === 'not_taken' ? 'selected' : ''}>Not Taken</option><option value="exempted" ${defaultStatus === 'exempted' ? 'selected' : ''}>Exempted</option><option value="pending_approval" ${defaultStatus === 'pending_approval' ? 'selected' : ''}>Pending Approval</option></select></div>`;
    }).join('')}</div></div>`).join('');
}
async function renderAdminStudentSubjectSelection() {
    try {
        const selected = localStorage.getItem('selectedStudentForSubjects');
        const { students, studentId, detail } = await loadAdminStudentSubjectPayload(selected);
        const selectedStudent = students.find(s => String(s.id) === String(studentId));
        const classItem = detail?.class || null;
        const eligibleSubjects = adminArray(detail?.eligibleSubjects);
        const selections = adminArray(detail?.selections);
        const seniorLike = /grade\s*1[0-2]|year\s*1[0-3]|form\s*[3-4]|senior/i.test(`${classItem?.name || ''} ${classItem?.grade || ''} ${selectedStudent?.grade || ''}`);
        const pathway = selections.find(s => s.pathway)?.pathway || '';
        const track = selections.find(s => s.track)?.track || '';
        return `<div class="space-y-6 animate-fade-in"><div class="rounded-2xl border bg-card p-6"><div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"><div><h2 class="text-2xl font-bold">Student Subject Selection</h2><p class="text-sm text-muted-foreground mt-1">Controlled Grade 10–12 pathway/elective selection. Also works for any class where a learner has Not Taken or Exempted subjects.</p></div><button onclick="showDashboardSection('students')" class="px-4 py-2 rounded-lg border hover:bg-accent">Back to Students</button></div><div class="mt-5 grid gap-4 lg:grid-cols-3"><div class="lg:col-span-2"><label class="block text-sm font-medium mb-1">Select student</label><select id="student-subject-select" class="w-full rounded-lg border bg-background px-3 py-2" onchange="changeSubjectSelectionStudent(this.value)">${students.map(s => `<option value="${adminEsc(s.id)}" ${String(s.id) === String(studentId) ? 'selected' : ''}>${adminEsc(s.User?.name || s.name || 'Student')} — ${adminEsc(s.grade || 'No class')}</option>`).join('')}</select></div><div class="rounded-xl border bg-muted/30 p-4"><p class="text-xs text-muted-foreground">Current class</p><p class="font-bold">${adminEsc(classItem?.name || selectedStudent?.grade || 'No class detected')}</p><p class="text-xs text-muted-foreground mt-1">${eligibleSubjects.length} eligible subject(s)</p></div></div></div><div class="rounded-2xl border bg-card p-5"><div class="grid gap-4 lg:grid-cols-3"><div><label class="block text-sm font-medium mb-1">Pathway ${seniorLike ? '<span class="text-primary">(Senior)</span>' : '<span class="text-muted-foreground">(optional)</span>'}</label><select id="student-pathway" class="w-full rounded-lg border bg-background px-3 py-2">${['', 'STEM', 'Social Sciences', 'Arts & Sports Science', 'Custom'].map(p => `<option value="${adminEsc(p)}" ${pathway === p ? 'selected' : ''}>${p || 'Not selected'}</option>`).join('')}</select></div><div><label class="block text-sm font-medium mb-1">Track</label><input id="student-track" class="w-full rounded-lg border bg-background px-3 py-2" value="${adminEsc(track)}" placeholder="Pure Sciences, Applied Sciences, Humanities..."></div><div class="flex items-end"><div class="grid gap-2 w-full"><button onclick="saveStudentSubjectSelection('${adminEsc(studentId)}')" class="w-full px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">Save Subject Selection</button><button onclick="v110AdminVerifySubjectSelection('${adminEsc(studentId)}')" class="w-full px-4 py-2 rounded-lg border hover:bg-accent">Verify Student Choice</button></div></div></div><p class="text-xs text-muted-foreground mt-3">Saving here controls teacher grading, report cards, Career Compass, and whether optional subjects count.</p></div><div class="space-y-4">${renderSubjectSelectionRows(eligibleSubjects, selections)}</div></div>`;
    } catch (error) {
        return `<div class="rounded-xl border bg-card p-8 text-red-500">Error loading subject selection: ${adminEsc(error.message)}</div>`;
    }
}
function changeSubjectSelectionStudent(studentId) {
    localStorage.setItem('selectedStudentForSubjects', String(studentId || ''));
    showDashboardSection('student-subject-selection');
}
async function saveStudentSubjectSelection(studentId) {
    if (!studentId) return showToast('Select a student first', 'error');
    const pathway = document.getElementById('student-pathway')?.value || null;
    const track = document.getElementById('student-track')?.value || null;
    const subjects = [...document.querySelectorAll('.student-subject-status')].map(select => ({ ...JSON.parse(select.dataset.subject || '{}'), status: select.value, pathway: JSON.parse(select.dataset.subject || '{}').pathway || pathway, track: JSON.parse(select.dataset.subject || '{}').track || track }));
    showLoading();
    try {
        const detail = await api.admin.getStudentSubjectSelection(studentId);
        const classId = detail?.data?.class?.id || null;
        await api.admin.saveStudentSubjectSelection(studentId, { classId, pathway, track, subjects });
        showToast('Student subject selection saved.', 'success');
        await showDashboardSection('student-subject-selection');
    } catch (error) { showToast(error.message || 'Failed to save subject selection', 'error'); }
    finally { hideLoading(); }
}
function renderAdminStudentSubjectToolbar(html) {
    if (typeof isSeniorSubjectChoiceVisible === 'function' && !isSeniorSubjectChoiceVisible()) return html;
    return `<div class="rounded-xl border bg-card p-4 mb-6"><div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3"><div><h3 class="font-semibold">Senior / Elective Subject Selection</h3><p class="text-sm text-muted-foreground">Approve Grade 10–12 pathways, tracks, compulsory subjects, and electives.</p></div><button onclick="showDashboardSection('student-subject-selection')" class="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">Open Subject Selection</button></div></div>${html}`;
}
function renderAdminPaymentConfirmationCard() {
    return `<div class="rounded-xl border bg-card p-5" id="payment-confirmation-card"><div class="flex flex-col md:flex-row md:items-start md:justify-between gap-4"><div><h3 class="font-semibold text-lg">Submit Manual Payment Confirmation</h3><p class="text-sm text-muted-foreground mt-1">Use this when the school paid by M-Pesa reference, bank, or cash and it has not reflected automatically. Super admin will approve or reject it.</p></div><span class="text-xs rounded-full border px-3 py-1">Goes to Super Admin</span></div><div class="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3"><label class="block"><span class="text-sm font-medium">Amount Paid</span><input id="pay-amount" type="number" min="0" class="mt-1 w-full rounded-lg border bg-background px-3 py-2" placeholder="100000"></label><label class="block"><span class="text-sm font-medium">Method</span><select id="pay-method" class="mt-1 w-full rounded-lg border bg-background px-3 py-2"><option value="mpesa">M-Pesa</option><option value="bank">Bank Transfer</option><option value="cash">Cash</option><option value="other">Other</option></select></label><label class="block"><span class="text-sm font-medium">Reference / Receipt</span><input id="pay-reference" class="mt-1 w-full rounded-lg border bg-background px-3 py-2" placeholder="M-Pesa code / bank ref"></label><label class="block"><span class="text-sm font-medium">Paid Date</span><input id="pay-date" type="date" value="${new Date().toISOString().slice(0,10)}" class="mt-1 w-full rounded-lg border bg-background px-3 py-2"></label><label class="block"><span class="text-sm font-medium">Requested Plan</span><select id="pay-plan" class="mt-1 w-full rounded-lg border bg-background px-3 py-2"><option value="school_starter">Starter</option><option value="school_growth" selected>Growth</option><option value="school_enterprise">Enterprise</option><option value="custom">Custom</option></select></label><label class="block"><span class="text-sm font-medium">Proof URL / Note</span><input id="pay-proof" class="mt-1 w-full rounded-lg border bg-background px-3 py-2" placeholder="Optional screenshot URL"></label></div><label class="block mt-4"><span class="text-sm font-medium">Notes</span><textarea id="pay-notes" rows="3" class="mt-1 w-full rounded-lg border bg-background px-3 py-2" placeholder="Example: Paid from school Paybill at 10:32 AM but status did not update."></textarea></label><div class="mt-4 flex justify-end"><button onclick="submitPaymentConfirmation()" class="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">Submit for Confirmation</button></div></div>`;
}
async function submitPaymentConfirmation() {
    const data = { amount: Number(document.getElementById('pay-amount')?.value || 0), method: document.getElementById('pay-method')?.value || 'mpesa', reference: document.getElementById('pay-reference')?.value || '', paidAt: document.getElementById('pay-date')?.value || new Date().toISOString(), requestedPlan: document.getElementById('pay-plan')?.value || 'school_growth', proofUrl: document.getElementById('pay-proof')?.value || '', notes: document.getElementById('pay-notes')?.value || '' };
    if (!data.amount || data.amount <= 0) return showToast('Enter the amount paid', 'error');
    if (!data.reference.trim()) return showToast('Enter the M-Pesa code, bank reference, or receipt number', 'error');
    showLoading();
    try { await api.admin.submitSchoolPaymentConfirmation(data); showToast('Payment confirmation submitted to super admin.', 'success'); ['pay-amount','pay-reference','pay-proof','pay-notes'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; }); }
    catch (error) { showToast(error.message || 'Failed to submit payment confirmation', 'error'); }
    finally { hideLoading(); }
}
window.changeSubjectSelectionStudent = changeSubjectSelectionStudent;
window.saveStudentSubjectSelection = saveStudentSubjectSelection;
window.submitPaymentConfirmation = submitPaymentConfirmation;


// ============ V107 INTEGRATED ADMIN PARENT MESSAGES ============
async function renderAdminParentMessages() {
    let conversations = [];
    try { conversations = (await api.admin.getParentConversations()).data || []; } catch (e) { console.error(e); }
    return `<div class="max-w-4xl mx-auto space-y-6 animate-fade-in"><div class="rounded-xl border bg-card overflow-hidden"><div class="p-4 border-b"><h3 class="font-semibold">Parent Messages to Admin</h3><p class="text-sm text-muted-foreground">Only parent-admin conversations for this school appear here.</p></div><div class="divide-y">${conversations.length ? conversations.map(c => `<div class="p-4 hover:bg-accent cursor-pointer" onclick="openAdminParentConversation('${adminEsc(c.userId)}')"><div class="flex justify-between"><div><p class="font-medium">${adminEsc(c.userName)}</p><p class="text-xs text-muted-foreground">${c.studentName ? `about ${adminEsc(c.studentName)}` : 'Parent-admin conversation'}</p><p class="text-sm mt-1">${adminEsc((c.lastMessage || '').substring(0, 80))}</p></div><div class="text-right"><p class="text-xs">${typeof timeAgo === 'function' ? timeAgo(c.lastMessageTime) : ''}</p>${c.unreadCount ? `<span class="bg-red-500 text-white text-xs rounded-full px-2 py-1">${c.unreadCount}</span>` : ''}</div></div></div>`).join('') : '<div class="p-8 text-center text-muted-foreground">No parent-admin messages yet.</div>'}</div></div></div>`;
}
async function openAdminParentConversation(parentId) {
    window.__activeAdminParentId = String(parentId);
    let messages = [];
    try { messages = (await api.admin.getParentMessages(parentId)).data || []; } catch (e) { showToast(e.message || 'Failed to load messages', 'error'); }
    const conversationKey = messages.find(m => m.metadata?.conversationKey)?.metadata?.conversationKey || '';
    if (conversationKey) window.ShuleRealtime?.joinConversation?.(conversationKey);
    const me = typeof getCurrentUser === 'function' ? getCurrentUser() : JSON.parse(localStorage.getItem('user') || '{}');
    messages.filter(m => Number(m.receiverId)===Number(me?.id) && !m.isRead && m.id).forEach(m => window.socket?.emit('chat:message_read',{messageId:m.id}));
    window.__activeAdminParentConversationKey = conversationKey;
    let modal = document.getElementById('admin-parent-chat-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'admin-parent-chat-modal';
        modal.className = 'fixed inset-0 z-50 hidden';
        modal.innerHTML = `<div class="absolute inset-0 bg-black/50" onclick="closeAdminParentConversation()"></div><div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl p-4"><div class="rounded-xl border bg-card p-6 shadow-xl"><div class="modal-content"></div></div></div>`;
        document.body.appendChild(modal);
    }
    const currentUser = typeof getCurrentUser === 'function' ? getCurrentUser() : JSON.parse(localStorage.getItem('user') || '{}');
    modal.querySelector('.modal-content').innerHTML = `<div class="space-y-4"><div class="border-b pb-2 flex justify-between"><h4 class="font-semibold">Chat with Parent</h4><button onclick="closeAdminParentConversation()" class="p-1">×</button></div><div class="space-y-4 max-h-96 overflow-y-auto" id="admin-parent-chat-msgs">${messages.map(m => `<div class="flex ${Number(m.senderId) === Number(currentUser.id) ? 'justify-end' : 'justify-start'}"><div class="${Number(m.senderId) === Number(currentUser.id) ? 'chat-bubble-sent' : 'chat-bubble-received'} max-w-[70%]"><p class="text-sm">${adminEsc(m.content)}</p><p class="text-xs mt-1">${typeof timeAgo === 'function' ? timeAgo(m.createdAt) : ''}</p></div></div>`).join('')}</div><div class="flex gap-2 pt-2"><input type="text" id="admin-parent-reply-input" placeholder="Type reply..." onkeydown="if(event.key==='Enter'){event.preventDefault();sendAdminParentReply('${adminEsc(parentId)}');}" class="flex-1 rounded-lg border p-2 bg-background"><button onclick="sendAdminParentReply('${adminEsc(parentId)}')" class="px-4 py-2 bg-primary text-white rounded-lg">Send</button></div></div>`;
    modal.classList.remove('hidden');
}
function closeAdminParentConversation() { document.getElementById('admin-parent-chat-modal')?.classList.add('hidden'); window.__activeAdminParentId=null; window.__activeAdminParentConversationKey=null; window.ShuleRealtime?.leaveConversation?.(); }
async function sendAdminParentReply(parentId) {
    const input = document.getElementById('admin-parent-reply-input');
    const message = input?.value?.trim();
    if (!message) return;
    try { await api.admin.replyToParent({ parentId, message }); input.value = ''; await openAdminParentConversation(parentId); }
    catch (e) { showToast(e.message || 'Failed to send reply', 'error'); }
}
window.openAdminParentConversation = openAdminParentConversation;
window.closeAdminParentConversation = closeAdminParentConversation;
window.sendAdminParentReply = sendAdminParentReply;

window.v110AdminVerifySubjectSelection = async function(studentId) {
  if (!studentId) return showToast('Select a student first', 'warning');
  try {
    showLoading();
    const detail = await api.admin.getStudentSubjectSelection(studentId);
    const classId = detail?.data?.class?.id || null;
    await apiRequest(`/api/admin/students/${encodeURIComponent(studentId)}/subject-selection/verify`, { method:'POST', body:JSON.stringify({ classId }) });
    showToast('Student subject selection verified.', 'success');
    await showDashboardSection('student-subject-selection');
  } catch (error) { showToast(error.message || 'Could not verify subject selection', 'error'); }
  finally { hideLoading(); }
};
