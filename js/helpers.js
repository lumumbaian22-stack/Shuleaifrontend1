// helpers.js - Common utility functions

function getInitials(name) {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

function timeAgo(timestamp) {
    if (!timestamp) return 'N/A';
    const seconds = Math.floor((new Date() - new Date(timestamp)) / 1000);

    const intervals = {
        year: 31536000,
        month: 2592000,
        week: 604800,
        day: 86400,
        hour: 3600,
        minute: 60
    };

    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
        const interval = Math.floor(seconds / secondsInUnit);
        if (interval >= 1) {
            return `${interval} ${unit}${interval === 1 ? '' : 's'} ago`;
        }
    }
    return 'just now';
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

function copyToClipboard(text) {
    if (!text) {
        showToast('No text to copy', 'error');
        return;
    }
    navigator.clipboard.writeText(text)
        .then(() => showToast('✅ Copied to clipboard', 'success'))
        .catch(() => showToast('Failed to copy', 'error'));
}

const copyElimuid = copyToClipboard;

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getCurrentUser() {
    try {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
        console.error('Error parsing user:', error);
        return null;
    }
}

function getCurrentSchool() {
    try {
        const schoolStr = localStorage.getItem('school');
        return schoolStr ? JSON.parse(schoolStr) : null;
    } catch (error) {
        console.error('Error parsing school:', error);
        return null;
    }
}

function getCurrentRole() {
    const user = getCurrentUser();
    if (user && user.role) return user.role;
    return localStorage.getItem('userRole');
}

// Export
window.getInitials = getInitials;
window.timeAgo = timeAgo;
window.formatDate = formatDate;
window.copyToClipboard = copyToClipboard;
window.copyElimuid = copyElimuid;
window.escapeHtml = escapeHtml;
window.getCurrentUser = getCurrentUser;
window.getCurrentSchool = getCurrentSchool;
window.getCurrentRole = getCurrentRole;
