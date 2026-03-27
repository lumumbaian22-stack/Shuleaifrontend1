// upload.js - Complete stable version (no logic changes, improved safety)

// ===============================
// DOWNLOAD TEMPLATE
// ===============================
async function downloadTemplate(type) {
    try {
        const templates = {
            students: `name,grade,parentEmail,dateOfBirth,gender
John Doe,10A,parent@example.com,2010-01-01,male
Jane Smith,10B,jane.parent@example.com,2010-02-15,female`,

            marks: `studentId,elimuid,subject,score,assessmentType,date
,ELI-2024-001,Mathematics,85,exam,2024-03-15
,ELI-2024-002,English,78,test,2024-03-14`,

            attendance: `studentId,elimuid,date,status,reason
,ELI-2024-001,2024-03-15,present,
,ELI-2024-002,2024-03-15,absent,Sick`
        };

        const template = templates[type];

        if (!template) {
            showToast('Invalid template type', 'error');
            return;
        }

        const blob = new Blob([template], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${type}_template.csv`);

        document.body.appendChild(link);
        link.click();
        link.remove();

        window.URL.revokeObjectURL(url);

        showToast(`✅ ${type} template downloaded`, 'success');
    } catch (error) {
        console.error('Download template error:', error);
        showToast('Failed to download template', 'error');
    }
}

// ===============================
// FILE UPLOAD SETUP
// ===============================
function setupFileUpload(dropZoneId, fileInputId, type) {
    const dropZone = document.getElementById(dropZoneId);
    const fileInput = document.getElementById(fileInputId);

    if (!dropZone || !fileInput) {
        console.error('Required elements not found');
        return;
    }

    let isUploading = false;

    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });

    dropZone.addEventListener('drop', handleDrop, false);
    dropZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileSelect, false);

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    function highlight() {
        dropZone.classList.add('border-primary', 'bg-primary/5');
    }

    function unhighlight() {
        dropZone.classList.remove('border-primary', 'bg-primary/5');
    }

    function handleDrop(e) {
        const dt = e.dataTransfer;
        handleFiles(dt.files);
    }

    function handleFileSelect(e) {
        handleFiles(e.target.files);
    }

    async function handleFiles(files) {
        const file = files[0];
        if (!file) return;

        // Prevent double upload
        if (isUploading) {
            showToast('Upload in progress...', 'info');
            return;
        }

        // Validate file type
        if (!file.name.toLowerCase().endsWith('.csv')) {
            showToast('Please upload a CSV file', 'error');
            return;
        }

        // Basic CSV validation
        try {
            const text = await file.text();
            const lines = text.split('\n');

            if (lines.length < 2) {
                showToast('CSV is empty or invalid', 'error');
                return;
            }
        } catch (e) {
            showToast('Failed to read file', 'error');
            return;
        }

        showToast(`⏫ Uploading ${file.name}...`, 'info');

        isUploading = true;

        try {
            let response;
            const formData = new FormData();
            formData.append('file', file);

            // Route to correct endpoint
            if (type === 'students') {
                response = await api.upload.uploadStudents(formData);
            } else if (type === 'marks') {
                response = await api.upload.uploadMarks(formData);
            } else if (type === 'attendance') {
                response = await api.upload.uploadAttendance(formData);
            } else {
                throw new Error('Invalid upload type');
            }

            // Success message (safe fallback)
            const successCount = response?.data?.successCount ?? '';
            const failedCount = response?.data?.failedCount ?? '';

            if (successCount !== '') {
                showToast(
                    `✅ Uploaded: ${successCount} success, ${failedCount} failed`,
                    'success'
                );
            } else {
                showToast(`✅ ${file.name} uploaded successfully`, 'success');
            }

            // Refresh dashboards
            await refreshAllData();

        } catch (error) {
            const message =
                error?.response?.data?.message ||
                error?.response?.data?.error ||
                error.message ||
                'Upload failed';

            showToast(`❌ ${message}`, 'error');
            console.error('Upload error:', error);

        } finally {
            fileInput.value = '';
            isUploading = false;
        }
    }
}

// ===============================
// REFRESH ALL DATA
// ===============================
async function refreshAllData() {
    console.log('🔄 Refreshing all dashboard data...');

    const user = getCurrentUser();
    if (!user) return;

    try {
        if (user.role === 'teacher') {
            if (typeof refreshMyStudents === 'function') {
                await refreshMyStudents();
            }
            if (typeof loadTodayDuty === 'function') {
                await loadTodayDuty();
            }

        } else if (user.role === 'admin') {
            if (typeof refreshStudentsList === 'function') {
                await refreshStudentsList();
            }
            if (typeof refreshTeachersList === 'function') {
                await refreshTeachersList();
            }

        } else if (user.role === 'super_admin') {
            if (typeof refreshSchoolsList === 'function') {
                await refreshSchoolsList();
            }
            if (typeof refreshPendingSchools === 'function') {
                await refreshPendingSchools();
            }
        }

        // Refresh current section safely
        const currentSection = window.currentSection ?? 'dashboard';

        if (
            ['students', 'teachers', 'dashboard'].includes(currentSection) &&
            typeof showDashboardSection === 'function'
        ) {
            await showDashboardSection(currentSection);
        }

        console.log('✅ Dashboard refresh complete');

    } catch (error) {
        console.error('Refresh error:', error);
    }
}

// ===============================
// LOAD UPLOAD HISTORY
// ===============================
async function loadUploadHistory() {
    try {
        const response = await api.upload.getUploadHistory();

        if (response && response.data) {
            const history = response.data;

            // Sort latest first
            history.sort(
                (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
            );

            renderUploadHistory(history);
        }

    } catch (error) {
        console.error('Failed to load upload history:', error);
    }
}

// ===============================
// RENDER UPLOAD HISTORY
// ===============================
function renderUploadHistory(history) {
    const container = document.getElementById('upload-history');
    if (!container) return;

    container.innerHTML = `
        <div class="space-y-2">
            ${history.map(item => `
                <div class="flex justify-between items-center p-2 bg-muted/30 rounded">
                    <div>
                        <p class="text-sm font-medium">${item.type} Upload</p>
                        <p class="text-xs text-muted-foreground">
                            ${item.count || 0} records • ${formatDate(item.createdAt)}
                        </p>
                    </div>
                    <span class="text-xs ${
                        item.status === 'success'
                            ? 'text-green-600'
                            : 'text-red-600'
                    }">
                        ${item.status}
                    </span>
                </div>
            `).join('')}
        </div>
    `;
}

// ===============================
// FORMAT DATE
// ===============================
function formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

// ===============================
// GET CURRENT USER
// ===============================
function getCurrentUser() {
    const userStr = localStorage.getItem('user');

    if (!userStr) return null;

    try {
        return JSON.parse(userStr);
    } catch (e) {
        return null;
    }
}

// ===============================
// EXPORTS
// ===============================
window.downloadTemplate = downloadTemplate;
window.setupFileUpload = setupFileUpload;
window.loadUploadHistory = loadUploadHistory;
window.refreshAllData = refreshAllData;