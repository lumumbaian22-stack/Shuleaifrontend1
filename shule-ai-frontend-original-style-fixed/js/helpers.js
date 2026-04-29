// helpers.js - Common utility functions (consolidated)

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

function saveUser(userData) {
    if (!userData) return;
    if (userData.role === 'teacher') {
        userData.teacher = userData.teacher || {};
        userData.teacher.type = userData.teacher.type || 'subject_teacher';
        userData.teacher.subjects = userData.teacher.subjects || [];
        userData.teacher.classId = userData.teacher.classId || null;
        userData.teacher.className = userData.teacher.className || null;
        userData.teacher.studentCount = userData.teacher.studentCount || 0;
    }
    if (userData.role === 'admin') {
        userData.admin = userData.admin || {};
    }
    localStorage.setItem('user', JSON.stringify(userData));
    return userData;
}

function updateAllSchoolNameElements(newName) {
    console.log('Updating all school name elements to:', newName);
    const sidebarSchoolName = document.getElementById('sidebar-school-name');
    if (sidebarSchoolName) sidebarSchoolName.textContent = newName;
    const adminSchoolName = document.getElementById('dashboard-school-name');
    if (adminSchoolName) adminSchoolName.textContent = newName;
    const teacherSchoolName = document.getElementById('teacher-school-name');
    if (teacherSchoolName) teacherSchoolName.textContent = newName;
    const parentSchoolName = document.getElementById('parent-school-name');
    if (parentSchoolName) parentSchoolName.textContent = newName;
    const studentSchoolName = document.getElementById('student-school-name');
    if (studentSchoolName) studentSchoolName.textContent = newName;
    document.querySelectorAll('.school-name, .school-name-display, [data-school-name]').forEach(el => {
        el.textContent = newName;
    });
    const adminCardSchoolName = document.querySelector('.rounded-xl.border.bg-card.p-6 h2.text-2xl.font-bold');
    if (adminCardSchoolName) adminCardSchoolName.textContent = newName;
    const profileSchoolName = document.querySelector('#profile-section .school-name');
    if (profileSchoolName) profileSchoolName.textContent = newName;
    setTimeout(() => {
        if (typeof showDashboardSection === 'function' && window.currentSection) {
            showDashboardSection(window.currentSection);
        }
    }, 100);
}

async function openReportCard(studentId) {
    showLoading();
    try {
        // If studentId not provided (student self-view), get from current user
        if (!studentId) {
            const user = getCurrentUser();
            if (user.role === 'student') {
                // Fetch student record via userId
                const studentRes = await apiRequest('/api/student/dashboard'); // small hack to get student id
                // actually we need a proper endpoint; simpler: use the unified details with a known id.
                // We'll use the student's own data from dashboardData.
                studentId = dashboardData?.student?.id;
            }
        }
        if (!studentId) throw new Error('Student ID not available');
        const res = await api.students.getFullDetails(studentId);
        if (!res.success) throw new Error(res.message);
        const data = res.data;
        const student = data.student;
        const user = data.user;
        const academic = data.academicSummary;
        const attendance = data.attendanceSummary;
        const classTeacher = data.classTeacher;
        const school = getCurrentSchool();

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
            <head><title>Report Card – ${escapeHtml(user.name)}</title>
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; }
                .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #007bff; padding-bottom: 20px; }
                .header h1 { margin: 0; color: #007bff; }
                .header h2 { margin: 5px 0; font-weight: normal; }
                .student-info { display: flex; align-items: center; gap: 20px; margin-bottom: 30px; }
                .student-info img { height: 90px; width: 90px; border-radius: 50%; object-fit: cover; border: 3px solid #007bff; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th { background: #007bff; color: white; padding: 10px; text-align: left; }
                td { padding: 10px; border-bottom: 1px solid #ddd; }
                .footer { margin-top: 30px; font-size: 12px; color: #666; text-align: center; }
                .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; background: #ffd700; color: #333; font-weight: bold; }
                @media print { body { padding: 20px; } }
            </style></head>
            <body>
                <div class="header">
                    <h1>${escapeHtml(school?.name || 'ShuleAI School')}</h1>
                    <h2>Student Report Card</h2>
                    <p>Term 1, 2026</p>
                </div>
                <div class="student-info">
                    ${student.photo ? `<img src="${student.photo}" />` : '<div style="height:90px;width:90px;background:#007bff;color:white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:36px;">${getInitials(user.name)}</div>'}
                    <div>
                        <h3>${escapeHtml(user.name)} ${student.isPrefect ? '<span class="badge">Prefect</span>' : ''}</h3>
                        <p>ELIMUID: ${escapeHtml(student.elimuid)} &nbsp;|&nbsp; Grade: ${escapeHtml(student.grade)}</p>
                        <p>Enrollment: ${formatDate(student.enrollmentDate)} &nbsp;|&nbsp; DOB: ${student.dateOfBirth ? formatDate(student.dateOfBirth) : 'N/A'}</p>
                        <p>Class Teacher: ${classTeacher?.name ? `${escapeHtml(classTeacher.name)} (${classTeacher.email})` : 'Not assigned'}</p>
                    </div>
                </div>
                <h3>Academic Performance</h3>
                <table>
                    <tr><th>Subject</th><th>Average Score</th><th>Grade</th></tr>
                    ${(academic.subjects || []).map(s => `
                        <tr><td>${escapeHtml(s.subject)}</td><td>${s.average}%</td><td><strong>${s.grade}</strong></td></tr>
                    `).join('')}
                </table>
                <p style="margin-top:20px;"><strong>Overall Average:</strong> ${academic.overallAverage}%</p>
                <h3>Attendance</h3>
                <p>Attendance Rate: ${attendance.rate}% &nbsp;|&nbsp; Present: ${attendance.present} days &nbsp;|&nbsp; Absent: ${attendance.absent} days &nbsp;|&nbsp; Late: ${attendance.late} days</p>
                <h3>Recent Assessments</h3>
                <table>
                    <tr><th>Subject</th><th>Assessment</th><th>Score</th></tr>
                    ${(data.recentAssessments || []).map(a => `
                        <tr><td>${escapeHtml(a.subject)}</td><td>${escapeHtml(a.assessment)}</td><td>${a.score}%</td></tr>
                    `).join('')}
                </table>
                <div class="footer">
                    <p>Generated on ${new Date().toLocaleDateString()} by ShuleAI &bull; This is an unofficial report card.</p>
                </div>
            </body></html>
        `);
        printWindow.document.close();
        printWindow.print();
    } catch (e) {
        showToast('Failed to load report card', 'error');
    } finally {
        hideLoading();
    }
}

// Export
window.getInitials = getInitials;
window.timeAgo = timeAgo;
window.formatDate = formatDate;
window.copyToClipboard = copyToClipboard;
window.copyElimuid = copyElimuid;
window.escapeHtml = escapeHtml;
window.saveUser = saveUser;
window.getCurrentUser = getCurrentUser;
window.getCurrentSchool = getCurrentSchool;
window.getCurrentRole = getCurrentRole;
window.updateAllSchoolNameElements = updateAllSchoolNameElements;
window.openReportCard = openReportCard;

