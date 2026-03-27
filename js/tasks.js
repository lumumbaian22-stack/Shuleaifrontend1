// tasks.js - Task management

function addTeacherTask() {
    const modal = document.getElementById('add-task-modal');
    if (modal) modal.classList.remove('hidden');
}

function saveTask() {
    const title = document.getElementById('task-title')?.value;
    if (!title) {
        showToast('Please enter a task title', 'error');
        return;
    }
    showToast('Task added successfully', 'success');
    closeAddTaskModal();
}

function closeAddTaskModal() {
    const modal = document.getElementById('add-task-modal');
    if (modal) modal.classList.add('hidden');
}

window.addTeacherTask = addTeacherTask;
window.saveTask = saveTask;
window.closeAddTaskModal = closeAddTaskModal;