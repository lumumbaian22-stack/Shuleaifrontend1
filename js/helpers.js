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
    if (window.BrandingManager && typeof window.BrandingManager.updateAllSchoolNameElements === 'function') {
        return window.BrandingManager.updateAllSchoolNameElements(newName);
    }
    const displayName = newName || 'ShuleAI';
    document.querySelectorAll('#sidebar-school-name, #school-name, #dashboard-school-name, #teacher-school-name, #parent-school-name, #parent-school-name-progress, #parent-school-name-payments, #student-school-name, .school-name, .school-name-display, [data-school-name], .profile-school-name').forEach(el => {
        el.textContent = displayName;
        el.setAttribute('title', displayName);
    });
    return displayName;
}



function v116ParentAllowedReportStudentId(studentId) {
    const wanted = String(studentId || '').trim();
    if (!wanted) return false;
    const role = String((typeof getCurrentRole === 'function' ? getCurrentRole() : localStorage.getItem('userRole') || localStorage.getItem('role') || '') || '').toLowerCase().replace('-', '_');
    if (role !== 'parent') return true;
    const selected = String(window.dashboardData?.selectedChildId || localStorage.getItem('shule_selected_child_id') || '').trim();
    const children = Array.isArray(window.dashboardData?.children) ? window.dashboardData.children : [];
    const ids = new Set([selected].filter(Boolean));
    children.forEach(c => {
        [c?.id, c?.studentId, c?.userId, c?.student?.id, c?.student?.studentId, c?.student?.userId, c?.User?.id].forEach(v => { if (v !== undefined && v !== null && String(v).trim()) ids.add(String(v)); });
    });
    return ids.has(wanted);
}

async function v113LoadReportCardDetails(studentId) {
    const role = String((typeof getCurrentRole === 'function' ? getCurrentRole() : localStorage.getItem('userRole') || localStorage.getItem('role') || '') || '').toLowerCase().replace('-', '_');
    if (role === 'parent') {
        if (!v116ParentAllowedReportStudentId(studentId)) {
            throw new Error('This report card is not linked to the selected parent child. Select the linked child first.');
        }
        if (api?.parent?.getChildReportCardDetails) return await api.parent.getChildReportCardDetails(studentId);
        if (typeof apiRequest === 'function') return await apiRequest(`/api/parent/child/${studentId}/report-card-details`);
        throw new Error('Parent report card route is unavailable');
    }
    return await api.students.getFullDetails(studentId);
}

async function buildReportCardHTML(studentId) {
    if (!studentId) {
        const dash = await api.student.getDashboard().catch(() => null);
        studentId = dash?.data?.student?.id || window.dashboardData?.student?.id;
    }
    if (!studentId) throw new Error('Student ID not available');
    const res = await v113LoadReportCardDetails(studentId);
    if (!res.success) throw new Error(res.message || 'Failed to load report card data');
    const data = res.data;
    const student = data.student || {};
    const user = data.user || {};
    const academic = data.academicSummary || {};
    const attendance = data.attendanceSummary || {};
    const classTeacher = data.classTeacher || null;
    const school = data.school || getCurrentSchool() || {};
    const branding = window.BrandingManager && window.BrandingManager.getStoredBranding ? window.BrandingManager.getStoredBranding() : JSON.parse(localStorage.getItem('schoolBranding') || '{}');
    const schoolLogo = branding.logoDataUrl || branding.logoUrl || branding.logo || school.logo || school.branding?.logoDataUrl || school.branding?.logoUrl || school.branding?.logo || '';
    const schoolPrimary = branding.primaryColor || '#083A85';
    const schoolAccent = branding.accentColor || '#11B5B1';
    const reportFooter = branding.reportFooter || 'Generated by Shule AI. This report uses published marks only.';
    const subjects = academic.subjects || [];
    const assessments = data.recentAssessments || [];
    const media = (value) => {
      if (!value || String(value).includes('/undefined') || String(value).includes('/null')) return '';
      try { return typeof resolveMediaUrl === 'function' ? resolveMediaUrl(value) : value; } catch (_) { return value; }
    };
    const studentPhoto = media(student.photo);
    const classTeacherSig = media(data.reportSignatures?.classTeacher || classTeacher?.signatureUrl || classTeacher?.signature || classTeacher?.User?.preferences?.signatureUrl);
    const headSig = media(data.reportSignatures?.headteacher || data.reportSignatures?.principal || data.headteacher?.signatureUrl || data.headteacher?.signature || data.principal?.signatureUrl || data.principal?.signature);
    const signatureBlock = (label, name, src) => src ? `<div class="sig"><img class="sig-img" src="${escapeHtml(src)}"><span>${escapeHtml(name || label)}</span><small>${escapeHtml(label)}</small></div>` : `<div class="sig line"><span>${escapeHtml(name || '')}</span><small>${escapeHtml(label)}</small></div>`;
    const safeName = escapeHtml(user.name || 'Student');
    return `<!doctype html><html><head><meta charset="utf-8"><title>Report Card - ${safeName}</title>
    <style>
      body{font-family:Arial,sans-serif;margin:0;padding:32px;color:#172033;background:#fff}.report-actions{max-width:900px;margin:0 auto 16px;display:flex;gap:10px;justify-content:flex-end}.report-actions button{border:1px solid #cbd5e1;background:#fff;border-radius:10px;padding:9px 13px;cursor:pointer;font-weight:600}.report-actions button.primary{background:${schoolPrimary};border-color:${schoolPrimary};color:#fff}.report{max-width:900px;margin:auto;border:1px solid #d9e2ef;border-radius:18px;padding:28px;position:relative;overflow:hidden}.watermark{position:absolute;inset:120px 60px auto 60px;height:420px;display:flex;align-items:center;justify-content:center;opacity:.055;pointer-events:none}.watermark img{max-width:420px;max-height:420px;object-fit:contain}.header{text-align:center;border-bottom:3px solid ${schoolPrimary};padding-bottom:18px;margin-bottom:22px}.school-logo{height:72px;max-width:110px;object-fit:contain;margin:0 auto 8px}.header h1{margin:0;color:${schoolPrimary}}.muted{color:#64748b}.student{display:flex;gap:18px;align-items:center;background:#f8fafc;border-radius:14px;padding:16px;margin-bottom:20px}.photo{height:88px;width:88px;border-radius:50%;object-fit:cover;border:3px solid ${schoolAccent}}.avatar{height:88px;width:88px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:${schoolPrimary};color:#fff;font-size:28px;font-weight:700}table{width:100%;border-collapse:collapse;margin-top:12px}th{background:${schoolPrimary};color:#fff;text-align:left;padding:10px}td{border-bottom:1px solid #e2e8f0;padding:10px}.summary{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:18px 0}.card{border:1px solid #e2e8f0;border-radius:12px;padding:12px;background:#f8fafc}.signatures{display:grid;grid-template-columns:repeat(2,1fr);gap:28px;margin-top:35px}.sig{border-top:1px solid #334155;padding-top:8px;font-size:12px;min-height:66px}.sig-img{max-height:52px;max-width:170px;display:block;margin:0 0 6px}.sig small{display:block;color:#64748b;margin-top:2px}.sig.line span{display:block;min-height:36px}.footer{text-align:center;margin-top:24px;font-size:12px;color:#64748b}@media print{body{padding:0}.report-actions{display:none}.report{border:0}.no-print{display:none}}
    </style></head><body><div class="report-actions no-print"><button onclick="window.print()" class="primary">Print / Save PDF</button><button onclick="document.documentElement.requestFullscreen && document.documentElement.requestFullscreen()">Full screen</button></div><div class="report">
      ${schoolLogo ? `<div class="watermark"><img src="${escapeHtml(schoolLogo)}"></div>` : ''}<div class="header">${schoolLogo ? `<img class="school-logo" src="${escapeHtml(schoolLogo)}">` : ''}<h1>${escapeHtml(branding.schoolName || school.schoolName || school.name || 'Shule AI School')}</h1><h2>Official Student Report Card</h2><p class="muted">${escapeHtml(school.curriculum || school.system || 'cbc').toUpperCase()} • Generated ${new Date().toLocaleDateString()}</p></div>
      <div class="student">${studentPhoto ? `<img class="photo" src="${escapeHtml(studentPhoto)}">` : `<div class="avatar">${getInitials(user.name || 'S')}</div>`}<div><h2>${safeName}</h2><p>Elimu ID: <strong>${escapeHtml(student.elimuid || '-')}</strong> • Class: <strong>${escapeHtml(student.grade || '-')}</strong></p><p class="muted">Class Teacher: ${classTeacher?.name ? escapeHtml(classTeacher.name) : 'Not assigned'}</p></div></div>
      <div class="summary"><div class="card"><small>Overall Average</small><h2>${academic.overallAverage ?? 0}%</h2></div><div class="card"><small>Attendance</small><h2>${attendance.rate ?? 0}%</h2></div><div class="card"><small>Subjects</small><h2>${subjects.length}</h2></div></div>
      <h3>Academic Performance</h3><table><thead><tr><th>Subject</th><th>Average</th><th>Grade</th></tr></thead><tbody>${subjects.length ? subjects.map(s => `<tr><td>${escapeHtml(s.subject)}</td><td>${s.average}%</td><td><strong>${escapeHtml(s.grade)}</strong></td></tr>`).join('') : '<tr><td colspan="3">No published marks yet.</td></tr>'}</tbody></table>
      <h3>Recent Assessments</h3><table><thead><tr><th>Subject</th><th>Assessment</th><th>Score</th><th>Date</th></tr></thead><tbody>${assessments.length ? assessments.map(a => `<tr><td>${escapeHtml(a.subject)}</td><td>${escapeHtml(a.assessment || '')}</td><td>${a.score}%</td><td>${a.date ? new Date(a.date).toLocaleDateString() : '-'}</td></tr>`).join('') : '<tr><td colspan="4">No recent assessments.</td></tr>'}</tbody></table>
      <h3>Attendance Summary</h3><p>Present: ${attendance.present ?? 0} • Absent: ${attendance.absent ?? 0} • Late: ${attendance.late ?? 0}</p>
      <div class="signatures">${signatureBlock('Class Teacher', classTeacher?.name, classTeacherSig)}${signatureBlock('Headteacher / Principal', data.headteacher?.name || data.principal?.name, headSig)}</div>
      <p class="footer">${escapeHtml(reportFooter)}</p>
    </div></body></html>`;
}

async function openReportCard(studentId) {
    // Open the tab synchronously from the click event before the API call.
    // Otherwise browser popup blockers can stop parent/student report viewing.
    const reportWindow = window.open('', '_blank');
    if (reportWindow) {
        reportWindow.document.write('<!doctype html><html><head><title>Loading report card...</title></head><body style="font-family:Arial;padding:24px">Loading report card...</body></html>');
        reportWindow.document.close();
    }
    showLoading();
    try {
        const html = await buildReportCardHTML(studentId);
        if (reportWindow && !reportWindow.closed) {
            reportWindow.document.open();
            reportWindow.document.write(html);
            reportWindow.document.close();
            reportWindow.focus();
            return;
        }
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.target = '_blank';
        a.rel = 'noopener';
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (e) {
        if (reportWindow && !reportWindow.closed) {
            reportWindow.document.open();
            reportWindow.document.write(`<!doctype html><html><body style="font-family:Arial;padding:24px;color:#b91c1c"><h2>Report card could not load</h2><p>${escapeHtml(e.message || 'Failed to load report card')}</p></body></html>`);
            reportWindow.document.close();
        }
        console.error('Report card view failed:', e);
        showToast(e.message || 'Failed to load report card', 'error');
    } finally { hideLoading(); }
}

async function downloadReportCard(studentId) {
    showLoading();
    try {
        const html = await buildReportCardHTML(studentId);
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `report-card-${studentId || 'student'}.html`; document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (e) {
        console.error('Report card download failed:', e);
        showToast(e.message || 'Failed to download report card', 'error');
    } finally { hideLoading(); }
}
window.openReportCard = openReportCard;
window.downloadReportCard = downloadReportCard;

function avatarHTML(name, photoUrl, sizeClass = 'h-10 w-10') {
    const displayName = name || 'User';
    const safeDisplayName = escapeHtml(displayName);
    const rawUrl = photoUrl || '';
    const resolvedUrl = rawUrl && typeof resolveMediaUrl === 'function' ? resolveMediaUrl(rawUrl) : rawUrl;

    if (resolvedUrl) {
        return `<img src="${escapeHtml(resolvedUrl)}" class="${escapeHtml(sizeClass)} rounded-full object-cover data-profile-image" data-profile-image="${escapeHtml(rawUrl)}" data-user-name="${safeDisplayName}" alt="${safeDisplayName}">`;
    }

    return `<div class="${escapeHtml(sizeClass)} rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white font-bold flex-shrink-0"><span>${getInitials(displayName)}</span></div>`;
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
window.downloadReportCard = downloadReportCard;
window.avatarHTML = avatarHTML;

