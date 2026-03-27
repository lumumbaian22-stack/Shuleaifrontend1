// admin-student-management.js - Complete with all admin student functions

async function loadAllStudents() {
    try {
        const response = await api.admin.getStudents();
        return response.data || [];
    } catch (error) {
        console.error('Failed to load students:', error);
        if (error.message.includes('403')) {
            showToast('You do not have admin permissions', 'error');
        } else {
            showToast(error.message || 'Failed to load students', 'error');
        }
        return [];
    }
}

async function refreshAdminStudentList() {
    const container = document.getElementById('admin-students-table-body');
    if (!container) return;

    try {
        container.innerHTML = '<tr><td colspan="6" class="px-4 py-8 text-center">Loading...</td></tr>';

        const students = await loadAllStudents();

        if (!students || students.length === 0) {
            container.innerHTML = '<tr><td colspan="6" class="px-4 py-8 text-center text-muted-foreground">No students found</td></tr>';
            return;
        }

        let html = '';
        students.forEach(student => {
            const user = student.User || {};
            const name = user.name || 'Unknown';
            const elimuid = student.elimuid || 'N/A';
            const grade = student.grade || 'N/A';
            const status = student.status || 'active';
            const statusClass = status === 'active' ? 'bg-green-100 text-green-700' : status === 'suspended' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700';

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
                    <td class="px-4 py-3">
                        <span class="font-mono text-xs bg-muted px-2 py-1 rounded">${elimuid}</span>
                    </td>
                    <td class="px-4 py-3">${grade}</td>
                    <td class="px-4 py-3">
                        <span class="px-2 py-1 ${statusClass} text-xs rounded-full">${status}</span>
                    </td>
                    <td class="px-4 py-3">${student.parents?.length || 0} parent(s)</td>
                    <td class="px-4 py-3 text-right">
                        <button onclick="viewAdminStudent('${student.id}')" class="p-2 hover:bg-accent rounded-lg">
                            <i data-lucide="eye" class="h-4 w-4"></i>
                        </button>
                        <button onclick="editAdminStudent('${student.id}')" class="p-2 hover:bg-accent rounded-lg">
                            <i data-lucide="edit" class="h-4 w-4"></i>
                        </button>
                        <button onclick="copyToClipboard('${elimuid}')" class="p-2 hover:bg-accent rounded-lg">
                            <i data-lucide="copy" class="h-4 w-4"></i>
                        </button>
                    </td>
                </tr>
            `;
        });

        container.innerHTML = html;

        const totalEl = document.getElementById('total-students');
        if (totalEl) totalEl.textContent = students.length;

        if (window.lucide) lucide.createIcons();

    } catch (error) {
        console.error('Error refreshing admin student list:', error);
        container.innerHTML = '<tr><td colspan="6" class="px-4 py-8 text-center text-red-500">Error loading students</td></tr>';
    }
}

async function viewAdminStudent(studentId) {
    showLoading();
    try {
        const students = await loadAllStudents();
        const student = students.find(s => s.id == studentId);
        if (!student) {
            showToast('Student not found', 'error');
            return;
        }
        showStudentDetailsModal(student);
    } catch (error) {
        showToast('Failed to load student details', 'error');
    } finally {
        hideLoading();
    }
}

async function editAdminStudent(studentId) {
    showLoading();
    try {
        const students = await loadAllStudents();
        const student = students.find(s => s.id == studentId);
        if (!student) {
            showToast('Student not found', 'error');
            return;
        }
        showEditStudentModal(student);
    } catch (error) {
        showToast('Failed to load student data', 'error');
    } finally {
        hideLoading();
    }
}

function showEditStudentModal(student) {
    let modal = document.getElementById('edit-student-modal');
    if (!modal) {
        createEditStudentModal();
        modal = document.getElementById('edit-student-modal');
    }

    document.getElementById('edit-student-id').value = student.id;
    document.getElementById('edit-student-name').value = student.User?.name || '';
    document.getElementById('edit-student-email').value = student.User?.email || '';
    document.getElementById('edit-student-grade').value = student.grade || '';
    document.getElementById('edit-student-status').value = student.status || 'active';

    modal.classList.remove('hidden');
}

function createEditStudentModal() {
    const modalHTML = `
        <div id="edit-student-modal" class="fixed inset-0 z-50 hidden">
            <div class="absolute inset-0 bg-black/50" onclick="closeEditStudentModal()"></div>
            <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md p-4">
                <div class="rounded-xl border bg-card p-6 shadow-xl animate-fade-in">
                    <h3 class="text-lg font-semibold mb-4">Edit Student</h3>
                    <input type="hidden" id="edit-student-id">
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium mb-1">Full Name</label>
                            <input type="text" id="edit-student-name" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                        </div>
                        <div>
                            <label class="block text-sm font-medium mb-1">Email</label>
                            <input type="email" id="edit-student-email" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                        </div>
                        <div>
                            <label class="block text-sm font-medium mb-1">Grade/Class</label>
                            <input type="text" id="edit-student-grade" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                        </div>
                        <div>
                            <label class="block text-sm font-medium mb-1">Status</label>
                            <select id="edit-student-status" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                                <option value="active">Active</option>
                                <option value="suspended">Suspended</option>
                                <option value="graduated">Graduated</option>
                                <option value="transferred">Transferred</option>
                            </select>
                        </div>
                    </div>
                    <div class="flex justify-end gap-2 mt-6">
                        <button onclick="closeEditStudentModal()" class="px-4 py-2 text-sm border rounded-lg hover:bg-accent">Cancel</button>
                        <button onclick="handleUpdateStudent()" class="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">Update Student</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

async function handleUpdateStudent() {
    const studentId = document.getElementById('edit-student-id')?.value;
    const name = document.getElementById('edit-student-name')?.value;
    const email = document.getElementById('edit-student-email')?.value;
    const grade = document.getElementById('edit-student-grade')?.value;
    const status = document.getElementById('edit-student-status')?.value;

    if (!studentId) {
        showToast('Student ID not found', 'error');
        return;
    }

    showLoading();
    try {
        const response = await api.admin.updateStudent(studentId, { name, email, grade, status });
        if (response.success) {
            showToast('✅ Student updated successfully', 'success');
            closeEditStudentModal();
            await refreshAdminStudentList();
        }
    } catch (error) {
        showToast(error.message || 'Failed to update student', 'error');
    } finally {
        hideLoading();
    }
}

function closeEditStudentModal() {
    const modal = document.getElementById('edit-student-modal');
    if (modal) modal.classList.add('hidden');
}

async function suspendStudent(studentId, studentName) {
    const reason = prompt(`Enter reason for suspending ${studentName}:`);
    if (!reason) return;

    if (!confirm(`⚠️ Are you sure you want to suspend ${studentName}?`)) return;

    showLoading();
    try {
        const response = await api.admin.suspendStudent(studentId, { reason });
        if (response.success) {
            showToast(`✅ ${studentName} suspended`, 'success');
            await refreshAdminStudentList();
        }
    } catch (error) {
        showToast(error.message || 'Failed to suspend student', 'error');
    } finally {
        hideLoading();
    }
}

async function reactivateStudent(studentId, studentName) {
    if (!confirm(`Reactivate ${studentName}?`)) return;

    showLoading();
    try {
        const response = await api.admin.reactivateStudent(studentId);
        if (response.success) {
            showToast(`✅ ${studentName} reactivated`, 'success');
            await refreshAdminStudentList();
        }
    } catch (error) {
        showToast(error.message || 'Failed to reactivate student', 'error');
    } finally {
        hideLoading();
    }
}

async function deleteStudent(studentId, studentName) {
    if (!confirm(`⚠️ Are you sure you want to permanently delete ${studentName}? This action cannot be undone.`)) return;

    const confirmText = prompt('Type "DELETE" to confirm:');
    if (confirmText !== 'DELETE') {
        showToast('Cancelled', 'info');
        return;
    }

    showLoading();
    try {
        const response = await api.admin.deleteStudent(studentId);
        if (response.success) {
            showToast(`✅ ${studentName} deleted`, 'success');
            await refreshAdminStudentList();
        }
    } catch (error) {
        showToast(error.message || 'Failed to delete student', 'error');
    } finally {
        hideLoading();
    }
}

function showStudentDetailsModal(student) {
    let modal = document.getElementById('student-details-modal');
    if (!modal) {
        createStudentDetailsModal();
        modal = document.getElementById('student-details-modal');
    }

    const modalContent = modal.querySelector('.modal-content');
    if (modalContent) {
        modalContent.innerHTML = getStudentDetailsHTML(student);
    }

    modal.classList.remove('hidden');
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function createStudentDetailsModal() {
    const modalHTML = `
        <div id="student-details-modal" class="fixed inset-0 z-50 hidden">
            <div class="absolute inset-0 bg-black/50" onclick="closeStudentDetailsModal()"></div>
            <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md p-4">
                <div class="rounded-xl border bg-card p-6 shadow-xl animate-fade-in">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-lg font-semibold">Student Details</h3>
                        <button onclick="closeStudentDetailsModal()" class="p-2 hover:bg-accent rounded-lg">
                            <i data-lucide="x" class="h-5 w-5"></i>
                        </button>
                    </div>
                    <div class="modal-content space-y-4"></div>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function getStudentDetailsHTML(student) {
    const user = student.User || {};
    return `
        <div class="space-y-4">
            <div class="flex items-center gap-4">
                <div class="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                    <span class="font-medium text-green-700 text-xl">${getInitials(user.name)}</span>
                </div>
                <div>
                    <h4 class="font-medium text-lg">${user.name || 'N/A'}</h4>
                    <p class="text-sm text-muted-foreground">${user.email || 'No email'}</p>
                </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div class="p-3 bg-muted/30 rounded-lg">
                    <p class="text-xs text-muted-foreground">ELIMUID</p>
                    <p class="font-mono text-sm font-bold text-primary">${student.elimuid || 'N/A'}</p>
                </div>
                <div class="p-3 bg-muted/30 rounded-lg">
                    <p class="text-xs text-muted-foreground">Grade</p>
                    <p class="font-medium">${student.grade || 'N/A'}</p>
                </div>
            </div>
            <div class="border-t pt-4">
                <p class="text-sm"><span class="font-medium">Gender:</span> ${student.gender || 'Not specified'}</p>
                <p class="text-sm"><span class="font-medium">DOB:</span> ${student.dateOfBirth ? formatDate(student.dateOfBirth) : 'N/A'}</p>
                <p class="text-sm"><span class="font-medium">Status:</span> ${student.status || 'active'}</p>
            </div>
            <div class="flex justify-end gap-2 pt-4 border-t">
                <button onclick="closeStudentDetailsModal()" class="px-4 py-2 text-sm border rounded-lg hover:bg-accent">Close</button>
                <button onclick="copyToClipboard('${student.elimuid}')" class="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">Copy ELIMUID</button>
            </div>
        </div>
    `;
}

function closeStudentDetailsModal() {
    const modal = document.getElementById('student-details-modal');
    if (modal) modal.classList.add('hidden');
}

// Add after other functions

async function editStudent(studentId) {
    showLoading();
    try {
        const students = await loadAllStudents();
        const student = students.find(s => s.id == studentId);
        if (!student) {
            showToast('Student not found', 'error');
            return;
        }
        showEditStudentModal(student);
    } catch (error) {
        console.error('Error loading student for edit:', error);
        showToast('Failed to load student data', 'error');
    } finally {
        hideLoading();
    }
}

// Export
window.loadAllStudents = loadAllStudents;
window.refreshAdminStudentList = refreshAdminStudentList;
window.viewAdminStudent = viewAdminStudent;
window.editAdminStudent = editAdminStudent;
window.suspendStudent = suspendStudent;
window.reactivateStudent = reactivateStudent;
window.deleteStudent = deleteStudent;
window.editStudent = editStudent;  
window.showStudentDetailsModal = showStudentDetailsModal;
window.closeStudentDetailsModal = closeStudentDetailsModal;
