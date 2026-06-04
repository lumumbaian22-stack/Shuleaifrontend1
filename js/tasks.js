// tasks.js - Task management

function addTeacherTask() {
    if (typeof showAddTaskModal === 'function') return showAddTaskModal();
    const modal = document.getElementById('add-task-modal');
    if (modal) modal.classList.remove('hidden');
}

async function saveTask() {
    const title = document.getElementById('task-title')?.value?.trim();
    if (!title) {
        showToast('Please enter a task title', 'error');
        return;
    }
    const payload = {
        title,
        description: document.getElementById('task-desc')?.value?.trim() || '',
        dueDate: document.getElementById('task-due')?.value || null,
        priority: document.getElementById('task-priority')?.value || 'medium'
    };
    showLoading?.();
    try {
        if (!window.api?.tasks?.createTask) throw new Error('Task API is not available');
        await window.api.tasks.createTask(payload);
        showToast('Task saved successfully', 'success');
        closeAddTaskModal();
        if (typeof showDashboardSection === 'function') await showDashboardSection('tasks');
    } catch (error) {
        showToast(error.message || 'Failed to save task', 'error');
    } finally {
        hideLoading?.();
    }
}

function closeAddTaskModal() {
    const modal = document.getElementById('add-task-modal');
    if (modal) modal.classList.add('hidden');
}

window.addTeacherTask = addTeacherTask;
window.saveTask = saveTask;
window.closeAddTaskModal = closeAddTaskModal;
