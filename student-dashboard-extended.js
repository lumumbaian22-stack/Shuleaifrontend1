// name-change.js - School name change modal

function showNameChangeModal() {
    const modal = document.getElementById('name-change-modal');
    if (modal) modal.classList.remove('hidden');
}

function closeNameChangeModal() {
    const modal = document.getElementById('name-change-modal');
    if (modal) modal.classList.add('hidden');
}

async function processNameChange() {
    const newName = document.getElementById('new-school-name')?.value;
    const reason = document.getElementById('change-reason')?.value || 'School name change request';

    if (!newName) {
        showToast('Please enter a new school name', 'error');
        return;
    }

    console.log('api object:', window.api);
    console.log('school object:', window.api?.school);
    console.log('createNameChangeRequest function:', window.api?.school?.createNameChangeRequest);

    if (!window.api || !window.api.school) {
        showToast('API not properly initialized. Please refresh the page.', 'error');
        console.error('api.school is undefined');
        return;
    }

    if (!window.api.school.createNameChangeRequest) {
        showToast('Name change feature not available', 'error');
        console.error('createNameChangeRequest function not found');
        return;
    }

    showLoading();
    try {
        const response = await window.api.school.createNameChangeRequest({
            newName: newName,
            reason: reason
        });

        if (response.success) {
            showToast('✅ Name change request sent to Super Admin for approval', 'success');
            closeNameChangeModal();

            document.getElementById('new-school-name').value = '';
            if (document.getElementById('change-reason')) {
                document.getElementById('change-reason').value = '';
            }
        }
    } catch (error) {
        console.error('Name change error:', error);
        showToast(error.message || 'Failed to submit name change request', 'error');
    } finally {
        hideLoading();
    }
}

window.showNameChangeModal = showNameChangeModal;
window.closeNameChangeModal = closeNameChangeModal;
window.processNameChange = processNameChange;