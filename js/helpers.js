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

// Add this to helpers.js - Permanent user save function
function saveUser(userData) {
    if (!userData) return;
    
    // Ensure teacher structure is always correct
    if (userData.role === 'teacher') {
        userData.teacher = userData.teacher || {};
        userData.teacher.type = userData.teacher.type || 'subject_teacher';
        userData.teacher.subjects = userData.teacher.subjects || [];
        userData.teacher.classId = userData.teacher.classId || null;
        userData.teacher.className = userData.teacher.className || null;
        userData.teacher.studentCount = userData.teacher.studentCount || 0;
    }
    
    localStorage.setItem('user', JSON.stringify(userData));
    return userData;
}

// Override getCurrentUser to ensure teacher structure is always valid
const originalGetCurrentUser = getCurrentUser;
window.getCurrentUser = function() {
    const user = originalGetCurrentUser();
    if (user && user.role === 'teacher') {
        user.teacher = user.teacher || {};
        user.teacher.type = user.teacher.type || 'subject_teacher';
        user.teacher.subjects = user.teacher.subjects || [];
    }
    return user;
};

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

// Global function to update all school name elements across the entire app
function updateAllSchoolNameElements(newName) {
    console.log('Updating all school name elements to:', newName);
    
    // Update sidebar
    const sidebarSchoolName = document.getElementById('sidebar-school-name');
    if (sidebarSchoolName) sidebarSchoolName.textContent = newName;
    
    // Update admin dashboard
    const adminSchoolName = document.getElementById('dashboard-school-name');
    if (adminSchoolName) adminSchoolName.textContent = newName;
    
    // Update teacher dashboard
    const teacherSchoolName = document.getElementById('teacher-school-name');
    if (teacherSchoolName) teacherSchoolName.textContent = newName;
    
    // Update parent dashboard
    const parentSchoolName = document.getElementById('parent-school-name');
    if (parentSchoolName) parentSchoolName.textContent = newName;
    
    // Update student dashboard
    const studentSchoolName = document.getElementById('student-school-name');
    if (studentSchoolName) studentSchoolName.textContent = newName;
    
    // Update any elements with class .school-name
    document.querySelectorAll('.school-name, .school-name-display, [data-school-name]').forEach(el => {
        el.textContent = newName;
    });
    
    // Update the main school name in admin dashboard card (fallback)
    const adminCardSchoolName = document.querySelector('.rounded-xl.border.bg-card.p-6 h2.text-2xl.font-bold');
    if (adminCardSchoolName) adminCardSchoolName.textContent = newName;
    
    // Update profile section if visible
    const profileSchoolName = document.querySelector('#profile-section .school-name');
    if (profileSchoolName) profileSchoolName.textContent = newName;
    
    // Force a re-render of the current section to catch any dynamically loaded elements
    setTimeout(() => {
        if (typeof showDashboardSection === 'function' && window.currentSection) {
            showDashboardSection(window.currentSection);
        }
    }, 100);
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
window.updateAllSchoolNameElements = updateAllSchoolNameElements;
