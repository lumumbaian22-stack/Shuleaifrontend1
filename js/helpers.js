// helpers.js - Common utility functions

/**
 * Get initials from a name
 * @param {string} name - Full name
 * @returns {string} Uppercase initials (max 2 letters)
 */
function getInitials(name) {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

/**
 * Convert ISO date string to "X time ago"
 * @param {string} timestamp - ISO timestamp
 * @returns {string} Human readable relative time
 */
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

/**
 * Format date to short readable format
 * @param {string} dateString - ISO date or date string
 * @returns {string} Formatted date (e.g., "Mar 15, 2024")
 */
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 */
function copyToClipboard(text) {
    if (!text) {
        showToast('No text to copy', 'error');
        return;
    }
    navigator.clipboard.writeText(text)
        .then(() => showToast('✅ Copied to clipboard', 'success'))
        .catch(() => showToast('Failed to copy', 'error'));
}

// Alias for backward compatibility
const copyElimuid = copyToClipboard;

/**
 * Escape HTML special characters to prevent XSS
 * @param {string} text - Raw text
 * @returns {string} Escaped HTML string
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// helpers.js - Add these functions at the end

// Get current user from localStorage
function getCurrentUser() {
    try {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
        console.error('Error parsing user:', error);
        return null;
    }
}

// Get current school from localStorage
function getCurrentSchool() {
    try {
        const schoolStr = localStorage.getItem('school');
        return schoolStr ? JSON.parse(schoolStr) : null;
    } catch (error) {
        console.error('Error parsing school:', error);
        return null;
    }
}

// Get current user role
function getCurrentRole() {
    const user = getCurrentUser();
    if (user && user.role) return user.role;
    return localStorage.getItem('userRole');
}

// Export
window.getCurrentUser = getCurrentUser;
window.getCurrentSchool = getCurrentSchool;
window.getCurrentRole = getCurrentRole;

// Expose globally
window.getInitials = getInitials;
window.timeAgo = timeAgo;
window.formatDate = formatDate;
window.copyElimuid = copyElimuid;
window.escapeHtml = escapeHtml;