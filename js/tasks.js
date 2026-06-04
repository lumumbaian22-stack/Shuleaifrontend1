// tasks.js - Task management with real backend persistence

function addTeacherTask() {
    const modal = document.getElementById('add-task-modal');
    if (modal) modal.classList.remove('hidden');
}

async function saveTask() {
    const title = document.getElementById('task-title')?.value?.trim();
    const description = document.getElementById('task-description')?.value?.trim() || '';
    const dueDate = document.getElementById('task-due-date')?.value || null;
    if (!title) {
        showToast('Please enter a task title', 'error');
        return;
    }
    try {
        if (typeof showLoading === 'function') showLoading();
        await (window.api?.tasks?.createTask
            ? window.api.tasks.createTask({ title, description, dueDate })
            : window.apiRequest('/api/tasks', { method: 'POST', body: JSON.stringify({ title, description, dueDate }) }));
        showToast('Task saved successfully', 'success');
        closeAddTaskModal();
        if (window.currentSection === 'tasks' && typeof window.showDashboardSection === 'function') {
            await window.showDashboardSection('tasks');
        }
    } catch (error) {
        showToast(error.message || 'Failed to save task', 'error');
    } finally {
        if (typeof hideLoading === 'function') hideLoading();
    }
}

function closeAddTaskModal() {
    const modal = document.getElementById('add-task-modal');
    if (modal) modal.classList.add('hidden');
}

window.addTeacherTask = addTeacherTask;
window.saveTask = saveTask;
window.closeAddTaskModal = closeAddTaskModal;
