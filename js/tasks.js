// Tasks section: real backend save, no fake success toast.
async function saveTask() {
  const title = document.getElementById('task-title')?.value?.trim() || document.getElementById('task-name')?.value?.trim();
  const description = document.getElementById('task-description')?.value?.trim() || '';
  const dueDate = document.getElementById('task-due-date')?.value || document.getElementById('task-date')?.value || null;
  if (!title) return showToast('Task title is required', 'error');
  showLoading?.();
  try {
    await (api.tasks?.createTask ? api.tasks.createTask({ title, description, dueDate }) : apiRequest('/api/tasks', { method:'POST', body: JSON.stringify({ title, description, dueDate }) }));
    showToast('Task saved successfully', 'success');
    if (typeof closeTaskModal === 'function') closeTaskModal();
    if (typeof showDashboardSection === 'function') await showDashboardSection('tasks');
  } catch (error) {
    showToast(error.message || 'Failed to save task', 'error');
  } finally { hideLoading?.(); }
}
window.saveTask = saveTask;
