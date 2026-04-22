// js/student-details-unified.js
// Unified Student Details Modal for all roles

let currentStudentData = null;

async function showUnifiedStudentModal(studentId) {
    showLoading();
    try {
        const res = await api.students.getFullDetails(studentId);
        if (!res.success) throw new Error(res.message);
        currentStudentData = res.data;
        renderStudentModal(currentStudentData);
    } catch (error) {
        console.error('Failed to load student details:', error);
        showToast('Failed to load student details', 'error');
    } finally {
        hideLoading();
    }
}

function renderStudentModal(data) {
    // Create modal if not exists
    let modal = document.getElementById('unified-student-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'unified-student-modal';
        modal.className = 'fixed inset-0 z-50 hidden';
        modal.innerHTML = `
            <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" onclick="closeUnifiedStudentModal()"></div>
            <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl max-h-[90vh] overflow-y-auto p-4">
                <div class="rounded-2xl border bg-card shadow-2xl">
                    <div class="sticky top-0 bg-card border-b px-6 py-4 flex justify-between items-center">
                        <h3 class="text-xl font-semibold">Student Profile</h3>
                        <div class="flex gap-2">
                            <button onclick="printReportCard()" class="px-3 py-1 bg-primary text-primary-foreground rounded-lg text-sm">
                                <i data-lucide="download" class="h-4 w-4 inline mr-1"></i> Download
                            </button>
                            <button onclick="closeUnifiedStudentModal()" class="p-2 hover:bg-accent rounded-lg">
                                <i data-lucide="x" class="h-5 w-5"></i>
                            </button>
                        </div>
                    </div>
                    <div id="unified-modal-content" class="p-6"></div>
                </div>
            </div>
        </div>`;
        document.body.appendChild(modal);
    }

    const content = document.getElementById('unified-modal-content');
    content.innerHTML = generateStudentModalHTML(data);
    modal.classList.remove('hidden');
    
    // Initialize tabs
    setupModalTabs();
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function generateStudentModalHTML(data) {
    const student = data.student || {};
    const user = data.user || {};
    const parents = data.parents || [];
    const classTeacher = data.classTeacher || {};
    const academic = data.academicSummary || {};
    const attendance = data.attendanceSummary || {};
    const recent = data.recentAssessments || [];
    const address = data.address || 'Not provided';

    return `
        <div class="flex flex-col md:flex-row gap-6">
            <!-- Left sidebar with photo and basic info -->
            <div class="md:w-64 flex-shrink-0">
                <div class="text-center">
                    ${student.photo ? `<img src="${student.photo}" class="h-32 w-32 rounded-full object-cover mx-auto border-4 border-primary/20">` : 
                        `<div class="h-32 w-32 rounded-full bg-primary/10 flex items-center justify-center mx-auto"><span class="text-4xl font-bold text-primary">${getInitials(user.name)}</span></div>`}
                    <h3 class="text-xl font-bold mt-3">${escapeHtml(user.name)}</h3>
                    <p class="text-sm text-muted-foreground">${escapeHtml(student.elimuid)}</p>
                    ${student.isPrefect ? '<span class="inline-block mt-2 px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium"><i data-lucide="shield" class="h-3 w-3 inline mr-1"></i>Prefect</span>' : ''}
                </div>
                <div class="mt-4 space-y-2 text-sm">
                    <div><span class="font-medium">Grade:</span> ${escapeHtml(student.grade)}</div>
                    <div><span class="font-medium">Status:</span> <span class="capitalize ${student.status === 'active' ? 'text-green-600' : 'text-yellow-600'}">${student.status}</span></div>
                    <div><span class="font-medium">Enrolled:</span> ${formatDate(student.enrollmentDate)}</div>
                    <div><span class="font-medium">DOB:</span> ${student.dateOfBirth ? formatDate(student.dateOfBirth) : 'N/A'}</div>
                    <div><span class="font-medium">Gender:</span> ${escapeHtml(student.gender || 'N/A')}</div>
                </div>
            </div>

            <!-- Right content with tabs -->
            <div class="flex-1">
                <div class="border-b mb-4">
                    <nav class="flex gap-4" id="modal-tabs">
                        <button class="tab-btn px-4 py-2 text-sm font-medium border-b-2 border-primary text-primary" data-tab="overview">Overview</button>
                        <button class="tab-btn px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground" data-tab="contact">Contact</button>
                        <button class="tab-btn px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground" data-tab="academic">Academic</button>
                        <button class="tab-btn px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground" data-tab="attendance">Attendance</button>
                    </nav>
                </div>

                <!-- Tab panes -->
                <div id="tab-overview" class="tab-pane">
                    <div class="grid grid-cols-2 gap-4">
                        <div class="col-span-2">
                            <h4 class="font-medium mb-2">Address</h4>
                            <p class="text-sm text-muted-foreground">${escapeHtml(address)}</p>
                        </div>
                        <div>
                            <h4 class="font-medium mb-2">Class Teacher</h4>
                            <p class="text-sm">${classTeacher ? `${escapeHtml(classTeacher.name)}<br><span class="text-muted-foreground">${escapeHtml(classTeacher.email)}</span>` : 'Not assigned'}</p>
                        </div>
                        <div>
                            <h4 class="font-medium mb-2">Overall Average</h4>
                            <p class="text-2xl font-bold ${academic.overallAverage >= 70 ? 'text-green-600' : academic.overallAverage >= 50 ? 'text-yellow-600' : 'text-red-600'}">${academic.overallAverage || 0}%</p>
                        </div>
                    </div>
                    ${recent.length ? `
                    <div class="mt-6">
                        <h4 class="font-medium mb-2">Recent Assessments</h4>
                        <table class="w-full text-sm">
                            <thead><tr><th class="text-left py-1">Subject</th><th class="text-left">Assessment</th><th class="text-right">Score</th></tr></thead>
                            <tbody>${recent.map(r => `<tr><td class="py-1">${escapeHtml(r.subject)}</td><td>${escapeHtml(r.assessment)}</td><td class="text-right">${r.score}%</td></tr>`).join('')}</tbody>
                        </table>
                    </div>` : ''}
                </div>

                <div id="tab-contact" class="tab-pane hidden">
                    <div class="space-y-4">
                        <div>
                            <h4 class="font-medium mb-2">Parents/Guardians</h4>
                            ${parents.length ? parents.map(p => `
                                <div class="p-3 border rounded-lg mb-2">
                                    <p class="font-medium">${escapeHtml(p.name)} (${escapeHtml(p.relationship)})</p>
                                    <p class="text-sm"><i data-lucide="phone" class="h-3 w-3 inline mr-1"></i> ${escapeHtml(p.phone || 'N/A')}</p>
                                    <p class="text-sm"><i data-lucide="mail" class="h-3 w-3 inline mr-1"></i> ${escapeHtml(p.email || 'N/A')}</p>
                                </div>
                            `).join('') : '<p class="text-muted-foreground">No parents linked</p>'}
                        </div>
                        <div>
                            <h4 class="font-medium mb-2">Class Teacher</h4>
                            ${classTeacher ? `
                                <div class="p-3 border rounded-lg">
                                    <p class="font-medium">${escapeHtml(classTeacher.name)}</p>
                                    <p class="text-sm"><i data-lucide="phone" class="h-3 w-3 inline mr-1"></i> ${escapeHtml(classTeacher.phone || 'N/A')}</p>
                                    <p class="text-sm"><i data-lucide="mail" class="h-3 w-3 inline mr-1"></i> ${escapeHtml(classTeacher.email || 'N/A')}</p>
                                </div>` : '<p class="text-muted-foreground">Not assigned</p>'}
                        </div>
                    </div>
                </div>

                <div id="tab-academic" class="tab-pane hidden">
                    <div class="mb-4">
                        <h4 class="font-medium mb-2">Term Averages</h4>
                        <div class="flex gap-4">
                            ${academic.termAverages?.map(t => `<div class="text-center"><span class="text-sm text-muted-foreground">${t.term}</span><p class="text-xl font-bold">${t.average}%</p></div>`).join('') || '<p class="text-muted-foreground">No data</p>'}
                        </div>
                    </div>
                    <div>
                        <h4 class="font-medium mb-2">Subject Performance</h4>
                        <table class="w-full text-sm">
                            <thead><tr><th class="text-left py-1">Subject</th><th class="text-right">Average</th><th class="text-right">Grade</th></tr></thead>
                            <tbody>${academic.subjects?.map(s => `<tr><td class="py-1">${escapeHtml(s.subject)}</td><td class="text-right">${s.average}%</td><td class="text-right font-medium">${s.grade}</td></tr>`).join('') || '<tr><td colspan="3" class="text-center py-4 text-muted-foreground">No grades</td></tr>'}</tbody>
                        </table>
                    </div>
                </div>

                <div id="tab-attendance" class="tab-pane hidden">
                    <div class="grid grid-cols-3 gap-4 mb-6">
                        <div class="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <p class="text-3xl font-bold text-green-600">${attendance.rate || 0}%</p>
                            <p class="text-sm text-muted-foreground">Attendance Rate</p>
                        </div>
                        <div class="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <p class="text-3xl font-bold text-blue-600">${attendance.present || 0}</p>
                            <p class="text-sm text-muted-foreground">Present</p>
                        </div>
                        <div class="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                            <p class="text-3xl font-bold text-red-600">${attendance.absent || 0}</p>
                            <p class="text-sm text-muted-foreground">Absent</p>
                        </div>
                    </div>
                    <div class="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div class="h-full bg-green-500 rounded-full" style="width: ${attendance.rate || 0}%"></div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function generatePrintFriendlyHTML(data) {
    const student = data.student || {};
    const user = data.user || {};
    const academic = data.academicSummary || {};
    const attendance = data.attendanceSummary || {};
    
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Report Card - ${escapeHtml(user.name)}</title>
            <style>
                body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
                .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; }
                .student-info { display: flex; gap: 20px; margin: 20px 0; }
                .photo { width: 100px; height: 100px; border-radius: 50%; object-fit: cover; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                .signature { margin-top: 40px; display: flex; justify-content: space-between; }
                .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>ShuleAI Academy</h1>
                <h2>Student Report Card</h2>
                <p>Term 1, 2026</p>
            </div>
            <div class="student-info">
                ${student.photo ? `<img src="${student.photo}" class="photo">` : ''}
                <div>
                    <h3>${escapeHtml(user.name)}</h3>
                    <p><strong>ELIMUID:</strong> ${escapeHtml(student.elimuid)}</p>
                    <p><strong>Grade:</strong> ${escapeHtml(student.grade)}</p>
                    <p><strong>Enrollment Date:</strong> ${formatDate(student.enrollmentDate)}</p>
                </div>
            </div>
            <h3>Academic Performance</h3>
            <table>
                <thead>
                    <tr><th>Subject</th><th>Average</th><th>Grade</th></tr>
                </thead>
                <tbody>
                    ${academic.subjects?.map(s => `<tr><td>${escapeHtml(s.subject)}</td><td>${s.average}%</td><td>${s.grade}</td></tr>`).join('') || '<tr><td colspan="3">No grades available</td></tr>'}
                </tbody>
            </table>
            <p><strong>Overall Average:</strong> ${academic.overallAverage || 0}%</p>
            <h3>Attendance Summary</h3>
            <table>
                <thead><tr><th>Present</th><th>Absent</th><th>Late</th><th>Rate</th></tr></thead>
                <tbody><tr><td>${attendance.present || 0}</td><td>${attendance.absent || 0}</td><td>${attendance.late || 0}</td><td>${attendance.rate || 0}%</td></tr></tbody>
            </table>
            <div class="signature">
                <div>_________________________<br>Class Teacher</div>
                <div>_________________________<br>Principal</div>
            </div>
            <div class="footer">
                <p>Generated on ${new Date().toLocaleDateString()} - ShuleAI School Intelligence System</p>
            </div>
        </body>
        </html>
    `;
}

function printReportCard() {
    if (!currentStudentData) {
        showToast('No student data available', 'error');
        return;
    }
    const printWindow = window.open('', '_blank');
    printWindow.document.write(generatePrintFriendlyHTML(currentStudentData));
    printWindow.document.close();
    printWindow.print();
}

function setupModalTabs() {
    const tabs = document.querySelectorAll('#modal-tabs .tab-btn');
    const panes = {
        overview: document.getElementById('tab-overview'),
        contact: document.getElementById('tab-contact'),
        academic: document.getElementById('tab-academic'),
        attendance: document.getElementById('tab-attendance')
    };

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            tabs.forEach(t => {
                t.classList.remove('border-primary', 'text-primary');
                t.classList.add('text-muted-foreground');
            });
            tab.classList.add('border-primary', 'text-primary');
            tab.classList.remove('text-muted-foreground');
            Object.values(panes).forEach(p => p?.classList.add('hidden'));
            if (panes[tabName]) panes[tabName].classList.remove('hidden');
        });
    });
}

function closeUnifiedStudentModal() {
    const modal = document.getElementById('unified-student-modal');
    if (modal) modal.classList.add('hidden');
    currentStudentData = null;
}

// Helper functions
function getInitials(name) {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Expose globally
window.showUnifiedStudentModal = showUnifiedStudentModal;
window.closeUnifiedStudentModal = closeUnifiedStudentModal;
window.printReportCard = printReportCard;
