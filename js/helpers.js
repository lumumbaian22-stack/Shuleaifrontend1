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
    const minimal=typeof stripLargeMediaForStorage==='function'?stripLargeMediaForStorage(userData):userData;if(typeof safeSessionSet==='function')safeSessionSet('user',JSON.stringify(minimal));else localStorage.setItem('user',JSON.stringify(minimal));
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
    let storedUser = {};
    try { storedUser = JSON.parse(localStorage.getItem('user') || localStorage.getItem('shule_user') || '{}'); } catch (_) {}
    const rawRole = (typeof getCurrentRole === 'function' ? getCurrentRole() : '') || storedUser.role || localStorage.getItem('userRole') || localStorage.getItem('role') || '';
    const role = String(rawRole || '').toLowerCase().replace('-', '_');
    const parentRoute = async () => {
        // Backend ownership is the final authority. The frontend check is only advisory because
        // selected child can be stored as Student.id, User.id, or child.studentId in older accounts.
        if (api?.parent?.getChildReportCardDetails) return await api.parent.getChildReportCardDetails(studentId);
        if (typeof apiRequest === 'function') return await apiRequest(`/api/parent/child/${studentId}/report-card-details`);
        throw new Error('Parent report card route is unavailable');
    };
    if (role === 'parent') return await parentRoute();
    if (role === 'teacher') {
        const ctx = window.__teacherReportPreviewContext || {};
        if (api?.teacher?.getStudentReportPreview) {
            return await api.teacher.getStudentReportPreview(studentId, {
                ...(ctx.classId ? { classId: ctx.classId } : {}),
                ...(ctx.term ? { term: ctx.term } : {}),
                ...(ctx.year ? { year: ctx.year } : {}),
                ...(ctx.assessmentName ? { assessmentName: ctx.assessmentName } : {})
            });
        }
    }
    try {
        return await api.students.getFullDetails(studentId);
    } catch (e) {
        // If the generic route is forbidden, try the parent-safe endpoint once.
        // If the logged-in user is not the linked parent, the backend will still reject it.
        if (e.status === 403 || /forbidden/i.test(e.message || '')) {
            try { return await parentRoute(); } catch (_) {}
        }
        throw e;
    }
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
    const draftPreview = !!(data.draftPreview || data.reportPreview || data.visibility === 'class_teacher_preview');
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
    const termLabel = data.term || academic.term || data.reportCard?.term || '-';
    const yearLabel = data.year || academic.year || data.reportCard?.year || new Date().getFullYear();
    const classLabel = student.className || student.currentClass || student.grade || student.Class?.name || '-';
    const totalScore = subjects.reduce((sum, s) => sum + (Number(s.average ?? s.score ?? 0) || 0), 0);
    const media = (value) => {
      if (!value || String(value).includes('/undefined') || String(value).includes('/null')) return '';
      try { return typeof resolveMediaUrl === 'function' ? resolveMediaUrl(value) : value; } catch (_) { return value; }
    };
    const studentPhoto = media(student.photo);
    const classTeacherSig = media(data.reportSignatures?.classTeacher || classTeacher?.signatureUrl || classTeacher?.signature || classTeacher?.User?.preferences?.signatureUrl);
    const headSig = media(data.reportSignatures?.headteacher || data.reportSignatures?.principal || data.headteacher?.signatureUrl || data.headteacher?.signature || data.principal?.signatureUrl || data.principal?.signature);
    const signatureBlock = (label, name, src) => src ? `<div class="sig"><img class="sig-img" src="${escapeHtml(src)}" onerror="this.closest('.sig').classList.add('line');this.remove();"><span>${escapeHtml(name || label)}</span><small>${escapeHtml(label)}</small></div>` : `<div class="sig line"><span>${escapeHtml(name || '')}</span><small>${escapeHtml(label)}</small></div>`;
    const safeName = escapeHtml(user.name || 'Student');
    return `<!doctype html><html><head><meta charset="utf-8"><title>${draftPreview ? 'Class Teacher Preview - ' : 'Report Card - '}${safeName}</title>
    <style>
      body{font-family:Arial,sans-serif;margin:0;padding:24px;color:#172033;background:#eef4fb}.report-actions{max-width:900px;margin:0 auto 16px;display:flex;gap:10px;justify-content:flex-end}.report-actions button{border:1px solid #cbd5e1;background:#fff;border-radius:10px;padding:9px 13px;cursor:pointer;font-weight:600}.report-actions button.primary{background:${schoolPrimary};border-color:${schoolPrimary};color:#fff}.report{max-width:900px;margin:auto;border:1px solid #d9e2ef;border-radius:20px;padding:26px;position:relative;overflow:hidden;background:#fff;box-shadow:0 18px 45px rgba(15,23,42,.12)}.watermark{position:absolute;inset:120px 60px auto 60px;height:420px;display:flex;align-items:center;justify-content:center;opacity:.055;pointer-events:none}.watermark img{max-width:420px;max-height:420px;object-fit:contain}.preview-banner{background:#fff7ed;border:1px solid #fdba74;color:#9a3412;border-radius:12px;padding:10px 14px;margin:0 auto 16px;max-width:900px;font-weight:700;text-align:center}.header{text-align:center;border-bottom:4px double ${schoolPrimary};padding-bottom:16px;margin-bottom:18px}.school-meta{display:flex;justify-content:center;gap:14px;flex-wrap:wrap;font-size:12px;color:#475569;margin-top:8px}.identity-grid{display:grid;grid-template-columns:1.2fr 1fr;gap:12px;margin-bottom:18px}.identity-box{border:1px solid #e2e8f0;border-radius:12px;padding:10px;background:#f8fafc}.identity-box small{display:block;color:#64748b;text-transform:uppercase;font-weight:700;font-size:10px;letter-spacing:.06em}.identity-box strong{display:block;margin-top:3px}.school-logo{height:72px;max-width:110px;object-fit:contain;margin:0 auto 8px}.header h1{margin:0;color:${schoolPrimary}}.muted{color:#64748b}.student{display:flex;gap:18px;align-items:center;background:#f8fafc;border-radius:14px;padding:16px;margin-bottom:20px}.photo{height:88px;width:88px;border-radius:50%;object-fit:cover;border:3px solid ${schoolAccent}}.avatar{height:88px;width:88px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:${schoolPrimary};color:#fff;font-size:28px;font-weight:700}table{width:100%;border-collapse:collapse;margin-top:12px}th{background:${schoolPrimary};color:#fff;text-align:left;padding:10px}td{border-bottom:1px solid #e2e8f0;padding:10px}.summary{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:18px 0}.card{border:1px solid #e2e8f0;border-radius:12px;padding:12px;background:#f8fafc}.signatures{display:grid;grid-template-columns:repeat(2,1fr);gap:28px;margin-top:35px}.sig{border-top:1px solid #334155;padding-top:8px;font-size:12px;min-height:66px}.sig-img{max-height:52px;max-width:170px;display:block;margin:0 0 6px}.sig small{display:block;color:#64748b;margin-top:2px}.sig.line span{display:block;min-height:36px}.footer{text-align:center;margin-top:24px;font-size:12px;color:#64748b}@media print{body{padding:0}.report-actions{display:none}.report{border:0}.no-print{display:none}}
    </style></head><body>${draftPreview ? `<div class="preview-banner no-print">CLASS TEACHER DRAFT PREVIEW — verify marks, comments, signatures and layout before publishing. Parents/students cannot see this until you publish.</div>` : ''}<div class="report-actions no-print"><button onclick="window.print()" class="primary">Print / Save PDF</button><button onclick="document.documentElement.requestFullscreen && document.documentElement.requestFullscreen()">Full screen</button></div><div class="report">
      ${schoolLogo ? `<div class="watermark"><img src="${escapeHtml(schoolLogo)}"></div>` : ''}<div class="header">${schoolLogo ? `<img class="school-logo" src="${escapeHtml(schoolLogo)}">` : ''}<h1>${escapeHtml(branding.schoolName || school.schoolName || school.name || 'Shule AI School')}</h1><h2>${draftPreview ? 'Class Teacher Draft Report Card Preview' : 'Official Student Report Card'}</h2><div class="school-meta"><span>${escapeHtml(school.curriculum || school.system || 'cbc').toUpperCase()}</span><span>Term: ${escapeHtml(termLabel)}</span><span>Year: ${escapeHtml(yearLabel)}</span><span>Generated ${new Date().toLocaleDateString()}</span></div></div>
      <div class="student">${studentPhoto ? `<img class="photo" src="${escapeHtml(studentPhoto)}">` : `<div class="avatar">${getInitials(user.name || 'S')}</div>`}<div><h2>${safeName}</h2><div class="identity-grid"><div class="identity-box"><small>Elimu ID</small><strong>${escapeHtml(student.elimuid || '-')}</strong></div><div class="identity-box"><small>Class</small><strong>${escapeHtml(classLabel)}</strong></div><div class="identity-box"><small>Class Teacher</small><strong>${classTeacher?.name ? escapeHtml(classTeacher.name) : 'Not assigned'}</strong></div><div class="identity-box"><small>Report Status</small><strong>${draftPreview?'Draft Preview':'Published / Official'}</strong></div></div></div></div>
      <div class="summary"><div class="card"><small>Overall Average</small><h2>${academic.overallAverage ?? 0}%</h2></div><div class="card"><small>Attendance</small><h2>${attendance.rate ?? 0}%</h2></div><div class="card"><small>Subjects Counted</small><h2>${subjects.length}</h2></div></div>
      <h3>Academic Performance</h3><table><thead><tr><th>Subject</th><th>Score / Average</th><th>Grade</th><th>Remark</th></tr></thead><tbody>${subjects.length ? subjects.map(s => `<tr><td>${escapeHtml(s.subject)}</td><td>${escapeHtml(s.average ?? s.score ?? '-')}%</td><td><strong>${escapeHtml(s.grade || '-')}</strong></td><td>${escapeHtml(s.remark || s.comment || s.level || '')}</td></tr>`).join('') : (draftPreview ? '<tr><td colspan="4">No marks captured for this preview yet.</td></tr>' : '<tr><td colspan="4">No published marks yet.</td></tr>')}</tbody></table>
      <h3>Recent Assessments</h3><table><thead><tr><th>Subject</th><th>Assessment</th><th>Score</th><th>Date</th></tr></thead><tbody>${assessments.length ? assessments.map(a => `<tr><td>${escapeHtml(a.subject)}</td><td>${escapeHtml(a.assessment || '')}</td><td>${a.score}%</td><td>${a.date ? new Date(a.date).toLocaleDateString() : '-'}</td></tr>`).join('') : '<tr><td colspan="4">No recent assessments.</td></tr>'}</tbody></table>
      <h3>Attendance Summary</h3><p>Present: ${attendance.present ?? 0} • Absent: ${attendance.absent ?? 0} • Late: ${attendance.late ?? 0}</p>
      <div class="signatures">${signatureBlock('Class Teacher', classTeacher?.name, classTeacherSig)}${signatureBlock('Headteacher / Principal', data.headteacher?.name || data.principal?.name, headSig)}</div>
      <p class="footer">${escapeHtml(reportFooter)}</p>
    </div></body></html>`;
}

function currentReportRole() {
    let stored = {};
    try { stored = JSON.parse(localStorage.getItem('user') || localStorage.getItem('shule_user') || '{}'); } catch (_) {}
    return String((typeof getCurrentRole === 'function' ? getCurrentRole() : '') || stored.role || localStorage.getItem('userRole') || localStorage.getItem('role') || '').toLowerCase().replace('-', '_');
}

async function fetchPublishedReportPdf(studentId) {
    if (!studentId) {
        const dash = await api.student.getDashboard().catch(() => null);
        studentId = dash?.data?.student?.id || window.dashboardData?.student?.id;
    }
    if (!studentId) throw new Error('Student ID not available');

    // Official report cards must come from immutable published history first.
    // This prevents noisy /latest/:studentId/pdf 404s when no current report exists.
    const history = await apiRequest(`/api/report-cards/history?studentId=${encodeURIComponent(studentId || '')}`).catch(() => null);
    const reports = Array.isArray(history?.data) ? history.data : [];
    const latest = reports.find(r => r.isCurrent) || reports[0];
    if (!latest?.id) throw new Error('No published report card yet. Publish the report first from the class teacher review.');

    return await fetchHistoricalReportPdf(latest.id);
}

async function openReportCard(studentId) {
    const reportWindow = window.open('', '_blank');
    if (reportWindow) {
        reportWindow.document.write('<!doctype html><html><head><title>Loading report card...</title></head><body style="font-family:Arial;padding:24px">Loading published report card...</body></html>');
        reportWindow.document.close();
    }
    showLoading();
    try {
        // Class teachers preview drafts through the existing protected preview endpoint.
        if (currentReportRole() === 'teacher' && window.__teacherReportPreviewContext) {
            const html = await buildReportCardHTML(studentId);
            if (!reportWindow) throw new Error('Your browser blocked the report preview window');
            reportWindow.document.open(); reportWindow.document.write(html); reportWindow.document.close(); reportWindow.focus();
            return;
        }
        const { blob } = await fetchPublishedReportPdf(studentId);
        const url = URL.createObjectURL(blob);
        if (reportWindow && !reportWindow.closed) reportWindow.location.replace(url);
        else window.open(url, '_blank', 'noopener');
        setTimeout(() => URL.revokeObjectURL(url), 120000);
    } catch (e) {
        if (reportWindow && !reportWindow.closed) {
            reportWindow.document.open();
            reportWindow.document.write(`<!doctype html><html><body style="font-family:Arial;padding:24px;color:#b91c1c"><h2>Report card could not load</h2><p>${escapeHtml(e.message || 'Failed to load report card')}</p></body></html>`);
            reportWindow.document.close();
        }
        showToast(e.message || 'Failed to load report card', 'error');
    } finally { hideLoading(); }
}

async function downloadReportCard(studentId) {
    showLoading();
    try {
        const { blob, filename } = await fetchPublishedReportPdf(studentId);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 60000);
        showToast('Report card PDF downloaded', 'success');
    } catch (e) { showToast(e.message || 'Failed to download report card', 'error'); }
    finally { hideLoading(); }
}

async function openReportHistory(studentId) {
    showLoading();
    try {
        const response = await apiRequest(`/api/report-cards/history?studentId=${encodeURIComponent(studentId || '')}`);
        const reports = response?.data || [];
        let modal = document.getElementById('report-history-modal');
        if (!modal) {
            modal = document.createElement('div'); modal.id='report-history-modal'; modal.className='fixed inset-0 z-[80] hidden'; document.body.appendChild(modal);
        }
        modal.innerHTML = `<div class="absolute inset-0 bg-black/55" onclick="document.getElementById('report-history-modal').classList.add('hidden')"></div><div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl max-h-[88vh] overflow-auto p-4"><div class="rounded-2xl border bg-card shadow-2xl"><div class="p-5 border-b flex justify-between gap-3"><div><h2 class="text-xl font-bold">Permanent Report History</h2><p class="text-sm text-muted-foreground">Published versions remain available even after later corrections.</p></div><button class="h-9 w-9 rounded-lg border" onclick="document.getElementById('report-history-modal').classList.add('hidden')">✕</button></div><div class="divide-y">${reports.length ? reports.map(report => `<div class="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"><div><p class="font-semibold">${escapeHtml(report.term)} ${report.year} · ${escapeHtml(report.assessmentKey || 'Term report')}</p><p class="text-xs text-muted-foreground">Version ${report.version}${report.isCurrent ? ' · Current' : ' · Archived'} · Published ${report.publishedAt ? new Date(report.publishedAt).toLocaleString() : '—'}${report.correctionReason ? ` · Correction: ${escapeHtml(report.correctionReason)}` : ''}</p></div><div class="flex gap-2"><button class="px-3 py-2 rounded-lg border" onclick="openHistoricalReportPdf(${report.id})">View PDF</button><button class="px-3 py-2 rounded-lg bg-primary text-white" onclick="downloadHistoricalReportPdf(${report.id})">Download PDF</button></div></div>`).join('') : '<div class="p-10 text-center text-muted-foreground">This report card has not yet been published by the school.</div>'}</div></div></div>`;
        modal.classList.remove('hidden');
    } catch (error) { showToast(error.message || 'Report history could not be loaded', 'error'); }
    finally { hideLoading(); }
}

async function fetchHistoricalReportPdf(reportId) {
    const token = localStorage.getItem('authToken') || localStorage.getItem('token') || '';
    const response = await fetch(`${API_BASE_URL}/api/report-cards/history/${reportId}/pdf`, { headers: token ? { Authorization:`Bearer ${token}` } : {} });
    if (!response.ok) { let message='Report PDF could not be loaded'; try { message=(await response.json()).message || message; } catch (_) {} throw new Error(message); }
    const disposition=response.headers.get('content-disposition')||'';
    return { blob:await response.blob(), filename:disposition.match(/filename="?([^";]+)"?/i)?.[1] || `Report_Card_${reportId}.pdf` };
}
async function openHistoricalReportPdf(reportId) { try { const {blob}=await fetchHistoricalReportPdf(reportId); const url=URL.createObjectURL(blob); window.open(url,'_blank','noopener'); setTimeout(()=>URL.revokeObjectURL(url),120000); } catch(error){ showToast(error.message,'error'); } }
async function downloadHistoricalReportPdf(reportId) { try { const {blob,filename}=await fetchHistoricalReportPdf(reportId); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000); } catch(error){ showToast(error.message,'error'); } }
window.openReportCard = openReportCard;
window.downloadReportCard = downloadReportCard;
window.openReportHistory = openReportHistory;
window.openHistoricalReportPdf = openHistoricalReportPdf;
window.downloadHistoricalReportPdf = downloadHistoricalReportPdf;

function avatarHTML(name, photoUrl, sizeClass = 'h-10 w-10') {
    const displayName = name || 'User';
    const safeDisplayName = escapeHtml(displayName);
    const rawUrl = photoUrl || '';
    const resolvedUrl = rawUrl && typeof resolveMediaUrl === 'function' ? resolveMediaUrl(rawUrl) : rawUrl;

    if (resolvedUrl) {
        return `<img src="${escapeHtml(resolvedUrl)}" class="${escapeHtml(sizeClass)} rounded-full object-cover data-profile-image" data-profile-image="${escapeHtml(rawUrl)}" data-user-name="${safeDisplayName}" alt="${safeDisplayName}" onerror="this.outerHTML='<div class=&quot;${escapeHtml(sizeClass)} rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold&quot;>${getInitials(displayName)}</div>'">`;
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


function formatStudentAge(studentOrDob, compact = false) {
    if (studentOrDob && typeof studentOrDob === 'object') {
        if (compact && studentOrDob.age?.compact) return studentOrDob.age.compact;
        if (!compact && studentOrDob.age?.full) return studentOrDob.age.full;
        if (studentOrDob.ageDisplay) return studentOrDob.ageDisplay;
        studentOrDob = studentOrDob.dateOfBirth;
    }
    if (!studentOrDob) return 'Not available';
    const dob = new Date(studentOrDob), now = new Date();
    if (Number.isNaN(dob.getTime()) || dob > now) return 'Not available';
    let years = now.getFullYear() - dob.getFullYear(), months = now.getMonth() - dob.getMonth(), days = now.getDate() - dob.getDate();
    if (days < 0) { days += new Date(now.getFullYear(), now.getMonth(), 0).getDate(); months--; }
    if (months < 0) { months += 12; years--; }
    return compact ? `${years} year${years === 1 ? '' : 's'}, ${days} day${days === 1 ? '' : 's'} old` : `${years} year${years === 1 ? '' : 's'}, ${months} month${months === 1 ? '' : 's'}, ${days} day${days === 1 ? '' : 's'} old`;
}
window.formatStudentAge = formatStudentAge;

function downloadStructuredCsv(data, filename = 'Shule_AI_Export.csv') {
    const rows = [['Section', 'Field', 'Value']];
    const add = (section, field, value) => {
        if (value === null || value === undefined || value === '') return;
        if (Array.isArray(value)) {
            if (!value.length) return;
            value.forEach((item, index) => {
                if (item && typeof item === 'object') Object.entries(item).forEach(([key, child]) => add(`${section} ${index + 1}`, key, child));
                else add(section, `${field} ${index + 1}`, item);
            });
            return;
        }
        if (typeof value === 'object') {
            Object.entries(value).forEach(([key, child]) => add(section || field, key, child));
            return;
        }
        rows.push([section || 'Overview', field, String(value)]);
    };
    if (data && typeof data === 'object') Object.entries(data).forEach(([key, value]) => add('Overview', key, value));
    else add('Overview', 'Value', data);
    const quote = value => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const csv = '\ufeff' + rows.map(row => row.map(quote).join(',')).join('\n');
    const blob = new Blob([csv], { type:'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = String(filename || 'Shule_AI_Export.csv').replace(/\.json$/i, '.csv');
    document.body.appendChild(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
}
window.downloadStructuredCsv = downloadStructuredCsv;
