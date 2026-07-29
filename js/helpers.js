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

function currentReportRole() {
    try {
        const role = (typeof getCurrentRole === 'function' ? getCurrentRole() : '') || getCurrentUser()?.role || localStorage.getItem('userRole') || localStorage.getItem('role') || '';
        return String(role || '').toLowerCase().replace(/-/g, '_');
    } catch (_) {
        return String(localStorage.getItem('userRole') || localStorage.getItem('role') || '').toLowerCase().replace(/-/g, '_');
    }
}
window.currentReportRole = window.currentReportRole || currentReportRole;


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

function resolveReportStudentId(explicitStudentId = null) {
    const explicit = String(explicitStudentId || '').trim();
    if (explicit && explicit !== 'undefined' && explicit !== 'null') return explicit;
    const role = String((typeof getCurrentRole === 'function' ? getCurrentRole() : localStorage.getItem('userRole')) || '')
        .toLowerCase().replace('-', '_');
    if (role === 'parent') {
        const selected = window.dashboardData?.selectedChildId ||
            window.parentDashboardData?.selectedChildId ||
            (typeof getStoredSelectedChildId === 'function' ? getStoredSelectedChildId() : '') ||
            localStorage.getItem('shule_selected_child_id');
        return selected ? String(selected) : '';
    }
    if (role === 'student') {
        const user = typeof getCurrentUser === 'function' ? (getCurrentUser() || {}) : {};
        const selected = window.dashboardData?.student?.id ||
            window.dashboardData?.student?.studentId ||
            window.dashboardData?.studentId ||
            window.studentDashboardData?.student?.id ||
            window.studentDashboardData?.studentId ||
            user.studentId || user.student?.id;
        return selected ? String(selected) : '';
    }
    return '';
}
window.resolveReportStudentId = resolveReportStudentId;

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

    const source = res.data?.snapshot ? res.data.snapshot : res.data;
    const data = source || {};
    const draftPreview = !!(data.draftPreview || data.reportPreview || data.visibility === 'class_teacher_preview' || data.status === 'draft');
    const student = data.student || {};
    const user = data.user || {};
    const academic = data.academicSummary || data.academic || {};
    const attendance = data.attendanceSummary || data.attendance || {};
    const school = data.school || getCurrentSchool() || {};
    const classTeacher = data.classTeacher || {};
    const storedBranding = window.BrandingManager && window.BrandingManager.getStoredBranding ? window.BrandingManager.getStoredBranding() : (() => { try { return JSON.parse(localStorage.getItem('schoolBranding') || '{}'); } catch (_) { return {}; } })();
    const branding = { ...(school.branding || {}), ...(storedBranding || {}) };
    const settings = { ...(school.reportCardSettings || {}), ...(branding.reportCardSettings || {}) };
    const show = (key, fallback = true) => settings[key] === undefined ? fallback : settings[key] !== false;
    const val = (...items) => items.find(v => v !== undefined && v !== null && String(v).trim() !== '') || '';
    const esc = (v) => escapeHtml(v == null ? '' : String(v));
    const media = (value) => {
      if (!value || String(value).includes('/undefined') || String(value).includes('/null')) return '';
      try { return typeof resolveMediaUrl === 'function' ? resolveMediaUrl(value) : value; } catch (_) { return value; }
    };
    const officialLogo = (() => { try { return new URL('assets/logo.png', window.location.href).href; } catch (_) { return 'assets/logo.png'; } })();
    const rawSchoolLogo = media(val(branding.logoDataUrl, branding.logoUrl, branding.logo, school.logo, school.logoUrl, school.watermarkLogo));
    const schoolName = val(settings.schoolDisplayName, branding.schoolName, branding.displayName, school.schoolName, school.name, 'ShuleAI School');
    const schoolInitials = getInitials(schoolName || 'SA');
    const logoFallback = String(settings.logoFallback || settings.headerLogoSource || 'school_initials');
    const headerLogo = rawSchoolLogo || (logoFallback === 'shuleai_logo' ? officialLogo : '');
    const primary = val(branding.primaryColor, settings.primaryColor, '#102A54');
    const accent = val(branding.accentColor, settings.accentColor, '#B99037');
    const watermarkType = String(settings.watermarkType || (rawSchoolLogo ? 'school_logo' : logoFallback === 'shuleai_logo' ? 'shuleai_logo' : 'school_initials'));
    const watermarkImg = watermarkType === 'school_logo' ? rawSchoolLogo : (watermarkType === 'shuleai_logo' ? officialLogo : '');
    const watermarkText = watermarkImg || watermarkType === 'none' ? '' : (watermarkType === 'school_name' ? schoolName : schoolInitials);

    const studentName = val(user.name, student.name, data.studentName, 'Student');
    const studentPhoto = media(val(student.photo, student.profileImage, student.profilePicture, user.profileImage, user.profilePicture));
    const termLabel = val(data.term, academic.term, data.reportCard?.term, '-');
    const yearLabel = val(data.year, academic.year, data.reportCard?.year, new Date().getFullYear());
    const classLabel = val(student.className, student.currentClass, student.grade, student.Class?.name, data.class?.name, '-');
    const streamLabel = val(student.stream, data.class?.stream, '-');
    const classTeacherName = val(classTeacher.name, data.classTeacher?.User?.name, data.signatures?.classTeacher?.name, 'Class Teacher');
    const headName = val(data.headteacher?.name, data.principal?.name, data.signatures?.headteacher?.name, 'Headteacher / Principal');
    const curriculumLabel = val(settings.curriculumLabel, school.curriculum, school.system, data.curriculum, 'CBC');
    const reportTypeLabel = val(settings.reportTypeLabel, data.reportTypeLabel, data.reportType, 'End Term Report');
    const promotionStatus = val(data.promotionStatus, student.promotionStatus, data.promotion?.status, settings.defaultPromotionStatus, '');
    const reportId = val(data.reportId, data.reportID, data.id ? `SHULEAI-RPT-${data.id}` : '', `SHULEAI-RPT-${yearLabel}-${String(student.id || student.userId || '000123').padStart(6,'0')}`);
    const verificationCode = val(data.verificationCode, data.verifyCode, `${String(reportId).slice(-4).toUpperCase()}-${String(student.id || '91HD').padStart(4,'0')}`);
    const generatedDate = val(data.generatedDate, data.generatedAt && new Date(data.generatedAt).toLocaleDateString(), new Date().toLocaleDateString());
    const publishedDate = draftPreview ? val(data.publishedDate, 'Not published') : val(data.publishedDate, data.publishedAt && new Date(data.publishedAt).toLocaleDateString(), generatedDate);

    let subjects = Array.isArray(academic.subjects) ? academic.subjects.slice() : (Array.isArray(data.subjects) ? data.subjects.slice() : []);
    const assessments = Array.isArray(data.recentAssessments) ? data.recentAssessments : [];
    const hasSubjectScores = subjects.some(s => Number.isFinite(Number(s.average ?? s.score ?? s.finalScore)));
    if (draftPreview && assessments.length && !hasSubjectScores) {
        const grouped = new Map();
        assessments.forEach(a => {
            const subject = String(a.subject || '').trim();
            if (!subject || /^all subjects$/i.test(subject)) return;
            const score = Number(a.score ?? a.marks ?? a.average);
            if (!Number.isFinite(score)) return;
            const row = grouped.get(subject) || []; row.push(score); grouped.set(subject, row);
        });
        if (grouped.size) subjects = Array.from(grouped.entries()).map(([subject, scores]) => {
            const avg = Math.round(scores.reduce((a,b)=>a+b,0)/scores.length);
            const grade = avg >= 80 ? 'EE' : avg >= 50 ? 'ME' : avg >= 30 ? 'AE' : 'BE';
            return { subject, average: avg, score: avg, grade, remark: `${scores.length} assessment${scores.length===1?'':'s'} counted` };
        });
    }
    const assessmentColumns = (() => {
      const config = Array.isArray(data.assessmentSettings) ? data.assessmentSettings : [];
      const fromSettings = config.filter(x => x && x.showOnReport !== false).sort((a,b)=>Number(a.displayOrder||0)-Number(b.displayOrder||0)).slice(0,3).map((x, idx) => {
        const label = val(x.label, x.displayName, x.name, x.assessmentType, `Assessment ${idx+1}`);
        const weight = Number(x.weightPercent ?? x.weight ?? 0);
        return { ...x, label: weight ? `${label} (${weight}%)` : label, rawLabel: label, index:idx };
      });
      if (fromSettings.length) return fromSettings;
      const labels = [];
      subjects.forEach(row => (row.components || row.assessments || []).forEach(c => {
        const label = c.label || c.assessment || c.assessmentName || c.assessmentType || c.key;
        if (label && !labels.some(x => String(x).toLowerCase() === String(label).toLowerCase())) labels.push(label);
      }));
      const fallback = labels.length ? labels.slice(0,3) : ['CAT (40%)', 'Mid Term (20%)', 'End Term (40%)'];
      return fallback.map((label,index)=>({ label, rawLabel:label, index }));
    })();
    const norm = v => String(v || '').toLowerCase().replace(/[^a-z0-9]+/g,'');
    const scoreForColumn = (row, column, index) => {
      const list = Array.isArray(row.components) ? row.components : (Array.isArray(row.assessments) ? row.assessments : []);
      const wanted = [column.key, column.assessmentKey, column.assessmentType, column.rawLabel, column.label].map(norm).filter(Boolean);
      const item = list.find(c => [c?.key,c?.assessmentKey,c?.assessmentType,c?.label,c?.assessment,c?.assessmentName,c?.type].map(norm).some(v => wanted.includes(v))) || list[index];
      const raw = item?.score ?? item?.mark ?? item?.rawScore ?? item?.value;
      return raw === undefined || raw === null || raw === '' ? '—' : raw;
    };
    const validScores = subjects.map(s => Number(s.average ?? s.finalScore ?? s.score)).filter(Number.isFinite);
    const overall = Number(academic.overallAverage ?? data.overallAverage);
    const computedOverall = Number.isFinite(overall) && overall > 0 ? Math.round(overall) : (validScores.length ? Math.round(validScores.reduce((a,b)=>a+b,0)/validScores.length) : 0);
    const overallGrade = val(academic.overallGrade, data.overallGrade, computedOverall >= 80 ? 'EE' : computedOverall >= 50 ? 'ME' : computedOverall >= 30 ? 'AE' : 'BE');
    const present = val(attendance.present, data.attendance?.present, '—');
    const absent = val(attendance.absent, data.attendance?.absent, '—');
    const late = val(attendance.late, data.attendance?.late, '—');
    const totalDays = val(attendance.total, data.attendance?.total, Number(present) + Number(absent) + Number(late) || '—');
    const attendanceRate = val(attendance.rate, attendance.attendanceRate, data.attendance?.rate, totalDays && present !== '—' ? Math.round(Number(present)/Number(totalDays)*100) : '—');
    const attendanceRemark = val(attendance.remark, data.attendanceRemark, Number(attendanceRate) >= 90 ? 'Very good attendance' : Number(attendanceRate) >= 75 ? 'Satisfactory attendance' : 'Attendance needs support');

    const rows = subjects.length ? subjects : [{ subject:'No academic records yet', average:null, grade:'—', remark:'Marks will appear after assessment entry.' }];
    const tableRows = rows.map((row,i) => {
      const final = row.average ?? row.finalScore ?? row.score;
      const grade = val(row.grade, row.meanGrade, final === null || final === undefined ? '—' : (Number(final)>=80?'EE':Number(final)>=50?'ME':Number(final)>=30?'AE':'BE'));
      return `<tr><td>${i+1}</td><td class="subject">${esc(row.subject || row.name || 'Learning Area')}</td>${assessmentColumns.map((column,idx)=>`<td>${esc(scoreForColumn(row,column,idx))}</td>`).join('')}<td class="final">${esc(final ?? '—')}</td><td><span class="level">${esc(grade)}</span></td><td>${esc(row.remark || row.teacherRemark || row.status || '')}</td></tr>`;
    }).join('');
    const classTeacherSig = media(val(data.reportSignatures?.classTeacher, data.signatures?.classTeacher?.image, classTeacher?.signatureUrl, classTeacher?.signature, classTeacher?.User?.preferences?.signatureUrl));
    const headSig = media(val(data.reportSignatures?.headteacher, data.reportSignatures?.principal, data.signatures?.headteacher?.image, data.headteacher?.signatureUrl, data.headteacher?.signature, data.principal?.signatureUrl, data.principal?.signature));
    const stampImg = media(val(data.reportSignatures?.stamp, data.signatures?.stamp?.image, school.stampUrl, branding.stampUrl, settings.stampUrl));
    const strengths = val(data.feedback?.strengths, data.insights?.strengths, academic.strengths, '');
    const support = val(data.feedback?.support, data.insights?.support, academic.support, '');
    const recommendation = val(data.feedback?.recommendation, data.insights?.nextSteps, academic.recommendation, '');
    const classComment = val(data.comments?.classTeacher, data.comments?.general, academic.teacherComment, '');
    const headComment = val(data.comments?.headteacher, data.headteacherComment, '');
    const termInfo = data.termInformation || data.termInfo || {};
    const closingDate = val(termInfo.closingDate, data.closingDate, settings.closingDate, '');
    const opensNextTerm = val(termInfo.opensNextTerm, data.opensNextTerm, settings.opensNextTerm, '');
    const feeBalance = val(termInfo.feeBalance, data.feeBalance, data.finance?.feeBalance, student.feeBalance, settings.feeBalance, '');
    const coreSource = data.coreValues || academic.coreValues || data.behaviour || {};
    const coreValue = (key) => val(coreSource[key], coreSource[key.toLowerCase()], coreSource[key.replace(/\s+/g,'')], '—');
    const coreValues = [
      ['Responsibility', coreValue('Responsibility')],
      ['Respect', coreValue('Respect')],
      ['Integrity', coreValue('Integrity')],
      ['Peace & Unity', val(coreSource.peaceAndUnity, coreSource['Peace & Unity'], coreSource.peaceUnity, '—')],
      ['Patriotism', coreValue('Patriotism')]
    ];

    const crestHtml = headerLogo ? `<img src="${esc(headerLogo)}" alt="School logo">` : `<div class="crest-fallback">${esc(schoolInitials)}</div><small>LOGO</small>`;
    const studentPhotoHtml = show('showStudentPhoto') && studentPhoto ? `<img src="${esc(studentPhoto)}" alt="Student photo">` : `<span>PHOTO</span>`;
    const watermarkHtml = watermarkImg ? `<div class="watermark"><img src="${esc(watermarkImg)}" alt=""></div>` : (watermarkText ? `<div class="watermark watermark-text">${esc(watermarkText)}</div>` : '');
    const contactLine = [show('showPhone') && val(settings.phone, school.phone), show('showEmail') && val(settings.email, school.email), show('showWebsite') && val(settings.website, school.website), show('showCurriculum') && `Curriculum: ${curriculumLabel}`].filter(Boolean).map(esc).join('  •  ');
    const credentialLine = [show('showRegistrationNumber') && val(settings.registrationNumber, school.registrationNumber) ? `Registration No: ${val(settings.registrationNumber, school.registrationNumber)}` : '', show('showPostalAddress') && val(settings.postalAddress, settings.poBox, school.postalAddress, school.address)].filter(Boolean).map(esc).join('  •  ');
    const reportStatus = draftPreview ? 'DRAFT PREVIEW' : 'PUBLISHED / OFFICIAL';
    const feedbackHtml = `<b>Strengths:</b> ${esc(strengths || '—')}<br><b>Areas Needing Support:</b> ${esc(support || '—')}<br><b>Recommendation:</b> ${esc(recommendation || '—')}`;
    const showTerm = show('showTermInformation', true);
    const showCore = show('showCoreValues', true);
    const showFeedback = show('showTeacherFeedback', true);
    const showPromotion = show('showPromotionStatus', true);

    return `<!doctype html><html><head><meta charset="utf-8"><title>${draftPreview ? 'Draft Preview - ' : 'Report Card - '}${esc(studentName)}</title><style>
      :root{--primary:${esc(primary)};--accent:${esc(accent)};--ink:#172033;--line:#d8dee8;--muted:#5f6b7a;--soft:#f7f9fc}
      *{box-sizing:border-box}body{margin:0;background:#e9edf3;color:var(--ink);font-family:"Times New Roman",Georgia,serif}.no-print{position:sticky;top:0;z-index:5;background:#fff;border-bottom:1px solid #ddd;padding:10px;text-align:center}.no-print button{margin:0 4px;padding:8px 14px;border:1px solid var(--primary);border-radius:6px;background:#fff;color:var(--primary);font-weight:700}.no-print button.primary{background:var(--primary);color:#fff}
      .page{width:210mm;min-height:297mm;margin:18px auto;background:#fff;padding:14mm 12mm 10mm;position:relative;box-shadow:0 14px 35px rgba(15,23,42,.16);overflow:hidden}.watermark{position:absolute;left:50%;top:52%;transform:translate(-50%,-50%);opacity:.045;pointer-events:none;z-index:0;text-align:center}.watermark img{width:360px;max-height:360px;object-fit:contain}.watermark-text{font-size:88px;font-weight:900;color:var(--primary);transform:translate(-50%,-50%) rotate(-18deg);white-space:nowrap}.content{position:relative;z-index:1}
      .top{display:grid;grid-template-columns:92px 1fr 160px;gap:14px;align-items:start}.logo{text-align:center;color:#7b8794;font-size:10px}.logo img{max-width:58px;max-height:58px;object-fit:contain}.crest-fallback{width:50px;height:58px;margin:auto;border:2px solid #97a6b6;border-radius:18px 18px 22px 22px;display:flex;align-items:center;justify-content:center;font-weight:900;color:var(--primary)}
      .school{text-align:center}.school h1{margin:0;color:var(--primary);font-size:27px;letter-spacing:.5px;font-weight:900}.motto{margin-top:2px;color:var(--accent);font-size:13px;font-style:italic;font-weight:700}.cred,.contact{font-size:9.5px;color:#435064;margin-top:5px;line-height:1.35}.report-title{text-align:center;color:var(--primary);font-weight:900}.report-title h2{font-size:20px;margin:0 0 4px;text-transform:uppercase}.report-title div{font-size:8px;color:#617085;line-height:1.35}
      .gold-line{height:4px;background:var(--accent);margin:20px 0 12px}.student-row{display:grid;grid-template-columns:90px 1fr 1fr 1fr;border:1px solid var(--line);min-height:67px}.student-row>div{padding:8px;border-right:1px solid var(--line);font-size:10px;line-height:1.5}.student-row>div:last-child{border-right:0}.photo{display:flex;align-items:center;justify-content:center;color:#9aa5b1;font-weight:700}.photo img{width:78px;height:58px;object-fit:cover;border:1px solid #cbd5e1}.name{font-weight:900;color:var(--primary);font-size:15px;margin-bottom:4px}.promotion{color:#087f5b;font-weight:900}
      .section-title{margin-top:26px;background:var(--primary);color:#fff;padding:8px 10px;font-size:13px;font-weight:900;text-transform:uppercase}.marks{width:100%;border-collapse:collapse;font-size:9px}.marks th{background:var(--primary);color:#fff;border:1px solid var(--primary);padding:7px 5px;text-align:left}.marks th:not(:nth-child(2)),.marks td:not(:nth-child(2)){text-align:center}.marks td{border:1px solid var(--line);padding:5px 5px}.marks tbody tr:nth-child(even){background:#f3f6fa}.marks .subject{text-align:left;font-weight:700}.marks .final{font-weight:900}.level{display:inline-block;border:1px solid var(--accent);border-radius:3px;padding:1px 8px;color:#936318;font-weight:900;background:#fffdf5}.key{font-size:8.3px;color:#64748b;margin-top:5px}
      .triple{display:grid;grid-template-columns:1fr 1fr 1fr;border:1px solid var(--line);margin-top:28px}.box{min-height:88px;border-right:1px solid var(--line);font-size:10px}.box:last-child{border-right:0}.box h3{margin:0;background:#f8fafc;color:var(--primary);border-bottom:1px solid var(--line);padding:8px;font-size:12px;text-transform:uppercase}.box-body{padding:8px;line-height:1.55}.box-body b{font-weight:900}.feedback{border:1px solid var(--line);margin-top:26px;font-size:10px}.feedback h3{margin:0;background:var(--primary);color:#fff;padding:8px 10px;font-size:12px;text-transform:uppercase}.feedback-body{padding:8px;line-height:1.6}.comments{display:grid;grid-template-columns:1fr 1fr;border:1px solid var(--line);margin-top:26px}.comment{padding:10px;border-right:1px solid var(--line);font-size:10px;min-height:72px}.comment:last-child{border-right:0}.comment h3{margin:0 0 7px;color:var(--primary);font-size:12px;text-transform:uppercase}.comment p{margin:0 0 8px;line-height:1.45}.term{border:1px solid var(--line);margin-top:26px;font-size:10px}.term h3{margin:0;background:var(--primary);color:#fff;padding:8px 10px;font-size:12px;text-transform:uppercase}.term-grid{display:grid;grid-template-columns:1fr 1fr 1fr;background:#fffaf0}.term-grid>div{padding:7px 8px;border-right:1px solid var(--line)}.term-grid>div:last-child{border-right:0}.fee{color:#b42318;font-weight:900}
      .sigs{display:grid;grid-template-columns:1fr 1fr 1fr;gap:34px;margin-top:66px;font-size:9px}.sig-line{border-top:1px solid #94a3b8;text-align:left;padding-top:9px}.sig-img{height:24px;max-width:100px;object-fit:contain;display:block;margin-bottom:3px}.footer{text-align:center;color:#64748b;font-size:8px;margin-top:18px}
      @media print{body{background:#fff}.no-print{display:none}.page{margin:0;box-shadow:none;width:210mm;min-height:297mm;page-break-after:always}@page{size:A4;margin:0}}
    </style></head><body><div class="no-print"><button class="primary" onclick="window.print()">Print / Save PDF</button><button onclick="document.documentElement.requestFullscreen && document.documentElement.requestFullscreen()">Full screen</button></div><main class="page"><div class="content">${watermarkHtml}
      <header class="top"><div class="logo">${crestHtml}</div><div class="school"><h1>${esc(schoolName).toUpperCase()}</h1>${show('showMotto') ? `<div class="motto">${esc(val(settings.motto, school.motto, branding.motto))}</div>` : ''}${credentialLine ? `<div class="cred">${credentialLine}</div>` : ''}${contactLine ? `<div class="contact">${contactLine}</div>` : ''}</div><div class="report-title"><h2>REPORT CARD</h2><div>Report ID: ${esc(reportId)}</div>${show('showVerificationCode') ? `<div>Verify at ${esc(val(settings.verifyUrl, 'verify.shuleai.com'))} • Code: ${esc(verificationCode)}</div>` : ''}<div style="margin-top:5px;font-weight:900;color:${esc(primary)}">${esc(reportStatus)}</div></div></header>
      <div class="gold-line"></div>
      <section class="student-row"><div class="photo">${studentPhotoHtml}</div><div><div class="name">${esc(studentName).toUpperCase()}</div><b>Elimu ID:</b> ${esc(val(student.elimuid, '-'))}<br><b>Admission No:</b> ${esc(val(student.admissionNumber, '-'))}<br><b>Class Teacher:</b> ${esc(classTeacherName)}</div><div><b>Class:</b> ${esc(classLabel)}<br><b>Stream:</b> ${esc(streamLabel)}<br><b>Report Type:</b> ${esc(reportTypeLabel)}${showPromotion && promotionStatus ? `<br><b>Promotion Status:</b> <span class="promotion">${esc(promotionStatus)}</span>` : ''}</div><div><b>Term:</b> ${esc(termLabel)}<br><b>Academic Year:</b> ${esc(yearLabel)}<br><b>Generated:</b> ${esc(generatedDate)}<br><b>Published:</b> ${esc(publishedDate)}</div></section>
      <div class="section-title">Academic Performance</div><table class="marks"><thead><tr><th>No.</th><th>Learning Area</th>${assessmentColumns.map(c=>`<th>${esc(c.label)}</th>`).join('')}<th>Final (100%)</th><th>Level</th><th>Teacher Remark</th></tr></thead><tbody>${tableRows}</tbody></table>
      <div class="key"><b>Performance Level Key:</b> <b style="color:#047857">EE</b> Exceeding Expectation &nbsp; <b style="color:#b99037">ME</b> Meeting Expectation &nbsp; <b style="color:#d97706">AE</b> Approaching Expectation &nbsp; <b style="color:#be123c">BE</b> Below Expectation</div>
      <section class="triple"><div class="box"><h3>Performance Summary</h3><div class="box-body"><b>Mean Score:</b> ${esc(computedOverall || '—')}%<br><b>Overall Grade:</b> ${esc(overallGrade)}<br><b>Class Position:</b> ${show('showClassPosition', false) ? esc(val(data.ranking?.classPosition, '-')) : '—'}<br><b>Stream Position:</b> ${show('showStreamPosition', false) ? esc(val(data.ranking?.streamPosition, '-')) : '—'}<br><b>Subjects Taken:</b> ${esc(subjects.length || '—')}</div></div><div class="box"><h3>Attendance Summary</h3><div class="box-body">${show('showAttendance') ? `<b>School Days:</b> ${esc(totalDays)}<br><b>Present:</b> ${esc(present)}<br><b>Absent:</b> ${esc(absent)}<br><b>Attendance %:</b> ${esc(attendanceRate)}%<br><b>Remark:</b> ${esc(attendanceRemark)}` : 'Hidden by school settings.'}</div></div><div class="box"><h3>Core Values (CBC)</h3><div class="box-body">${showCore ? coreValues.map(([k,v])=>`<b>${esc(k)}:</b> ${esc(v)}`).join('<br>') : 'Hidden by school settings.'}</div></div></section>
      ${showFeedback ? `<section class="feedback"><h3>Teacher Feedback</h3><div class="feedback-body">${feedbackHtml}</div></section>` : ''}
      <section class="comments"><div class="comment"><h3>Class Teacher's Comment</h3><p>${show('showTeacherComment') ? esc(classComment || '—') : 'Hidden by school settings.'}</p><b>${esc(classTeacherName)}</b></div><div class="comment"><h3>Headteacher's Comment</h3><p>${show('showHeadteacherComment') ? esc(headComment || '—') : 'Hidden by school settings.'}</p><b>${esc(headName)}</b></div></section>
      ${showTerm ? `<section class="term"><h3>Term Information</h3><div class="term-grid"><div><b>Closing Date:</b> ${esc(closingDate || '—')}</div><div><b>Opens Next Term:</b> ${esc(opensNextTerm || '—')}</div><div><b>Fee Balance:</b> <span class="fee">${esc(feeBalance || '—')}</span></div></div></section>` : ''}
      <section class="sigs">${show('showSignatures') ? `<div class="sig-line">${classTeacherSig ? `<img class="sig-img" src="${esc(classTeacherSig)}">` : ''}<b>Class Teacher</b><br>${esc(classTeacherName)}</div><div class="sig-line">${headSig ? `<img class="sig-img" src="${esc(headSig)}">` : ''}<b>Headteacher / Principal</b><br>${esc(headName)}</div><div class="sig-line">${stampImg && show('showStamp') ? `<img class="sig-img" src="${esc(stampImg)}">` : ''}<b>Parent / Guardian</b><br>Sign & Date</div>` : ''}</section>
      <footer class="footer">${esc(schoolName)} • ${esc(termLabel)}, ${esc(yearLabel)} • Page 1 of 1 • Report ID: ${esc(reportId)} • Verification Code: ${esc(verificationCode)}</footer>
    </div></main></body></html>`;
}

async function openReportCard(studentId) {
    studentId = resolveReportStudentId(studentId);
    if (!studentId) {
        showToast('Student profile is still loading. Reopen the report card after the dashboard loads.', 'error');
        return;
    }
    const reportWindow = window.open('', '_blank');
    if (reportWindow) {
        reportWindow.document.write('<!doctype html><html><head><title>Loading report card...</title></head><body style="font-family:Arial;padding:24px">Loading published report card...</body></html>');
        reportWindow.document.close();
    }
    showLoading();
    try {
        // Class teachers preview drafts through the existing protected preview endpoint.
        if ((typeof currentReportRole === 'function' ? currentReportRole() : (typeof getCurrentRole === 'function' ? getCurrentRole() : localStorage.getItem('userRole'))) === 'teacher' && window.__teacherReportPreviewContext) {
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
    studentId = resolveReportStudentId(studentId);
    if (!studentId) {
        showToast('Student profile is still loading. Reopen the report card after the dashboard loads.', 'error');
        return;
    }
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
    studentId = resolveReportStudentId(studentId);
    if (!studentId) {
        showToast('Student profile is still loading. Reopen report history after the dashboard loads.', 'error');
        return;
    }
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
    const lastBirthdayYear = (
        now.getMonth() > dob.getMonth()
        || (now.getMonth() === dob.getMonth() && now.getDate() >= dob.getDate())
    ) ? now.getFullYear() : now.getFullYear() - 1;
    const remainderDays = Math.max(0, Math.floor((
        new Date(now.getFullYear(), now.getMonth(), now.getDate())
        - new Date(lastBirthdayYear, dob.getMonth(), dob.getDate())
    ) / 86400000));
    return compact ? `${years} year${years === 1 ? '' : 's'}, ${remainderDays} day${remainderDays === 1 ? '' : 's'} old` : `${years} year${years === 1 ? '' : 's'}, ${months} month${months === 1 ? '' : 's'}, ${days} day${days === 1 ? '' : 's'} old`;
}
window.formatStudentAge = formatStudentAge;

function localDateInputValue(value = new Date(), timeZone = 'Africa/Nairobi') {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    try {
        const parts = new Intl.DateTimeFormat('en-CA', {
            timeZone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).formatToParts(date);
        const byType = Object.fromEntries(parts.map(part => [part.type, part.value]));
        return `${byType.year}-${byType.month}-${byType.day}`;
    } catch (_) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
}
window.localDateInputValue = localDateInputValue;

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
