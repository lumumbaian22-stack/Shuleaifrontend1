// upload.js - Complete CSV upload with preview and validation

// ============ DOWNLOAD TEMPLATE ============
async function downloadTemplate(type) {
    try {
        const templates = {
            students: `name,grade,parentEmail,dateOfBirth,gender
John Doe,10A,parent@example.com,2010-01-01,male
Jane Smith,10B,jane.parent@example.com,2010-02-15,female
Michael Brown,10A,michael.parent@example.com,2010-03-20,male`,

            marks: `studentId,elimuid,subject,score,assessmentType,date,assessmentName
,ELI-2024-001,Mathematics,85,exam,2024-03-15,Math Mid-Term
,ELI-2024-002,English,78,test,2024-03-14,English Essay
,ELI-2024-001,Science,92,exam,2024-03-16,Science Exam`,

            attendance: `studentId,elimuid,date,status,reason
,ELI-2024-001,2024-03-15,present,
,ELI-2024-002,2024-03-15,absent,Sick
,ELI-2024-001,2024-03-16,late,Traffic delay`
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

// ============ CSV FILE UPLOAD SETUP ============
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

        if (isUploading) {
            showToast('Upload in progress...', 'info');
            return;
        }

        if (!file.name.toLowerCase().endsWith('.csv')) {
            showToast('Please upload a CSV file', 'error');
            return;
        }

        // Preview CSV before upload
        await previewCSV(file, type);
        
        // Confirm upload
        const confirmUpload = confirm('Preview loaded. Do you want to upload this file?');
        if (!confirmUpload) return;

        isUploading = true;
        showToast(`⏫ Uploading ${file.name}...`, 'info');

        try {
            const formData = new FormData();
            formData.append('file', file);

            let response;
            if (type === 'students') {
                response = await api.upload.uploadStudents(formData);
            } else if (type === 'marks') {
                response = await api.upload.uploadMarks(formData);
            } else if (type === 'attendance') {
                response = await api.upload.uploadAttendance(formData);
            } else {
                throw new Error('Invalid upload type');
            }

            if (response && response.success) {
                const stats = response.data || {};
                const successCount = stats.successCount || stats.processed || 0;
                const failedCount = stats.failedCount || stats.errors || 0;
                
                showToast(`✅ Upload complete: ${successCount} successful, ${failedCount} failed`, 'success');
                
                // Refresh the data display
                await refreshAllData();
            } else {
                throw new Error(response?.message || 'Upload failed');
            }

        } catch (error) {
            const message = error?.response?.data?.message || error.message || 'Upload failed';
            showToast(`❌ ${message}`, 'error');
            console.error('Upload error:', error);
        } finally {
            fileInput.value = '';
            isUploading = false;
            closePreviewModal();
        }
    }
}

// ============ CSV PREVIEW FUNCTION ============
async function previewCSV(file, type) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const content = e.target.result;
            const lines = content.split('\n');
            const headers = lines[0].split(',');
            const data = [];
            
            // Parse CSV data
            for (let i = 1; i < Math.min(lines.length, 11); i++) {
                if (lines[i].trim()) {
                    const values = parseCSVLine(lines[i]);
                    const row = {};
                    headers.forEach((header, index) => {
                        row[header.trim()] = values[index]?.trim() || '';
                    });
                    data.push(row);
                }
            }
            
            showPreviewModal({
                fileName: file.name,
                headers: headers,
                data: data,
                totalRows: lines.length - 1,
                type: type
            });
            resolve();
        };
        
        reader.onerror = function() {
            showToast('Failed to read file', 'error');
            reject();
        };
        
        reader.readAsText(file);
    });
}

// Parse CSV line handling quoted fields
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current);
    return result;
}

// ============ PREVIEW MODAL ============
function showPreviewModal(previewData) {
    let modal = document.getElementById('csv-preview-modal');
    if (!modal) {
        createPreviewModal();
        modal = document.getElementById('csv-preview-modal');
    }
    
    const modalContent = modal.querySelector('.modal-content');
    if (modalContent) {
        modalContent.innerHTML = `
            <div class="space-y-4">
                <div class="flex justify-between items-center border-b pb-3">
                    <div>
                        <h3 class="text-lg font-semibold">CSV Preview: ${previewData.fileName}</h3>
                        <p class="text-sm text-muted-foreground">Total rows: ${previewData.totalRows} | Showing first ${previewData.data.length} rows</p>
                    </div>
                    <button onclick="closePreviewModal()" class="p-2 hover:bg-accent rounded-lg">
                        <i data-lucide="x" class="h-5 w-5"></i>
                    </button>
                </div>
                
                <div class="overflow-x-auto max-h-96 overflow-y-auto border rounded-lg">
                    <table class="w-full text-sm">
                        <thead class="bg-muted/50 sticky top-0">
                            <tr>
                                ${previewData.headers.map(header => `
                                    <th class="px-4 py-2 text-left font-medium">${escapeHtml(header)}</th>
                                `).join('')}
                            </tr>
                        </thead>
                        <tbody class="divide-y">
                            ${previewData.data.map(row => `
                                <tr class="hover:bg-accent/50">
                                    ${previewData.headers.map(header => `
                                        <td class="px-4 py-2 text-sm">${escapeHtml(row[header] || '-')}</td>
                                    `).join('')}
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                
                <div class="flex justify-end gap-3 pt-4 border-t">
                    <button onclick="closePreviewModal()" class="px-4 py-2 border rounded-lg hover:bg-accent">
                        Cancel
                    </button>
                    <button onclick="confirmUpload()" class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
                        Confirm Upload
                    </button>
                </div>
            </div>
        `;
    }
    
    modal.classList.remove('hidden');
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function createPreviewModal() {
    const modalHTML = `
        <div id="csv-preview-modal" class="fixed inset-0 z-50 hidden">
            <div class="absolute inset-0 bg-black/50" onclick="closePreviewModal()"></div>
            <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl p-4">
                <div class="rounded-xl border bg-card shadow-xl animate-fade-in max-h-[85vh] overflow-hidden flex flex-col">
                    <div class="modal-content p-6 overflow-y-auto">
                        <!-- Content filled dynamically -->
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closePreviewModal() {
    const modal = document.getElementById('csv-preview-modal');
    if (modal) modal.classList.add('hidden');
}

// Global variable to store pending upload
let pendingUpload = null;

function setPendingUpload(file, type) {
    pendingUpload = { file, type };
}

function confirmUpload() {
    closePreviewModal();
    if (pendingUpload) {
        // Trigger the actual upload
        handleFileUpload(pendingUpload.file, pendingUpload.type);
        pendingUpload = null;
    }
}

async function handleFileUpload(file, type) {
    const formData = new FormData();
    formData.append('file', file);
    
    showLoading();
    try {
        let response;
        if (type === 'students') {
            response = await api.upload.uploadStudents(formData);
        } else if (type === 'marks') {
            response = await api.upload.uploadMarks(formData);
        } else if (type === 'attendance') {
            response = await api.upload.uploadAttendance(formData);
        }
        
        if (response && response.success) {
            showToast('✅ Upload successful!', 'success');
            await refreshAllData();
        } else {
            throw new Error(response?.message || 'Upload failed');
        }
    } catch (error) {
        showToast(error.message || 'Upload failed', 'error');
    } finally {
        hideLoading();
    }
}

// ============ REFRESH ALL DATA ============
async function refreshAllData() {
    console.log('🔄 Refreshing all dashboard data...');
    
    const user = getCurrentUser();
    if (!user) return;
    
    try {
        if (user.role === 'teacher') {
            if (typeof refreshMyStudents === 'function') {
                await refreshMyStudents();
            }
        } else if (user.role === 'admin') {
            if (typeof refreshStudentsList === 'function') {
                await refreshStudentsList();
            }
            if (typeof refreshTeachersList === 'function') {
                await refreshTeachersList();
            }
        }
        
        // Refresh current section
        if (typeof showDashboardSection === 'function') {
            await showDashboardSection(window.currentSection || 'dashboard');
        }
        
        console.log('✅ Dashboard refresh complete');
    } catch (error) {
        console.error('Refresh error:', error);
    }
}

// ============ LOAD UPLOAD HISTORY ============
async function loadUploadHistory() {
    try {
        const response = await api.upload.getUploadHistory();
        if (response && response.data) {
            renderUploadHistory(response.data);
        }
    } catch (error) {
        console.error('Failed to load upload history:', error);
    }
}

function renderUploadHistory(history) {
    const container = document.getElementById('upload-history');
    if (!container) return;
    
    if (!history || history.length === 0) {
        container.innerHTML = '<div class="text-center py-8 text-muted-foreground">No upload history</div>';
        return;
    }
    
    container.innerHTML = `
        <div class="space-y-2">
            ${history.slice(0, 5).map(item => `
                <div class="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                    <div>
                        <p class="text-sm font-medium capitalize">${item.type} Upload</p>
                        <p class="text-xs text-muted-foreground">
                            ${item.count || 0} records • ${formatDate(item.createdAt)}
                        </p>
                    </div>
                    <span class="text-xs px-2 py-1 rounded-full ${item.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">
                        ${item.status || 'completed'}
                    </span>
                </div>
            `).join('')}
        </div>
    `;
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getCurrentUser() {
    try {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    } catch (e) {
        return null;
    }
}

// ============ EXPORTS ============
window.downloadTemplate = downloadTemplate;
window.setupFileUpload = setupFileUpload;
window.loadUploadHistory = loadUploadHistory;
window.refreshAllData = refreshAllData;
window.previewCSV = previewCSV;
window.closePreviewModal = closePreviewModal;
window.confirmUpload = confirmUpload;
