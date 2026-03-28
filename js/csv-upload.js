// csv-upload.js - Complete CSV upload and processing system

// ============ CSV PARSING AND VALIDATION ============

function parseCSV(fileContent) {
    const lines = fileContent.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    // Validate required headers
    const requiredHeaders = ['name', 'grade'];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    
    if (missingHeaders.length > 0) {
        throw new Error(`Missing required columns: ${missingHeaders.join(', ')}. Please include name and grade.`);
    }
    
    const students = [];
    const errors = [];
    
    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        const values = lines[i].split(',').map(v => v.trim());
        const student = {};
        
        headers.forEach((header, index) => {
            if (values[index]) {
                student[header] = values[index];
            }
        });
        
        // Validate required fields
        if (!student.name) {
            errors.push(`Row ${i + 1}: Missing student name`);
            continue;
        }
        
        if (!student.grade) {
            errors.push(`Row ${i + 1}: Missing grade for student ${student.name}`);
            continue;
        }
        
        // Optional fields with defaults
        student.parentEmail = student.parentemail || student.parent_email || '';
        student.parentPhone = student.parentphone || student.parent_phone || '';
        student.dateOfBirth = student.dateofbirth || student.dob || '';
        student.gender = student.gender || '';
        
        students.push(student);
    }
    
    return { students, errors, headers };
}

// ============ CSV UPLOAD MODAL ============

let currentCSVData = null;
let currentCSVFile = null;

function showCSVUploadModal() {
    let modal = document.getElementById('csv-upload-modal');
    if (!modal) {
        createCSVUploadModal();
        modal = document.getElementById('csv-upload-modal');
    }
    
    // Reset modal
    document.getElementById('csv-file-input').value = '';
    document.getElementById('csv-preview-container').classList.add('hidden');
    document.getElementById('upload-progress-container').classList.add('hidden');
    document.getElementById('csv-upload-status').innerHTML = '';
    document.getElementById('csv-upload-status').classList.add('hidden');
    document.getElementById('confirm-upload-btn').disabled = true;
    
    modal.classList.remove('hidden');
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function createCSVUploadModal() {
    const modalHTML = `
        <div id="csv-upload-modal" class="fixed inset-0 z-50 hidden">
            <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" onclick="closeCSVUploadModal()"></div>
            <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl p-4">
                <div class="rounded-2xl border bg-card shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
                    <div class="sticky top-0 bg-card border-b px-6 py-4 flex justify-between items-center">
                        <h3 class="text-xl font-semibold">Upload Students via CSV</h3>
                        <button onclick="closeCSVUploadModal()" class="p-2 hover:bg-accent rounded-lg">
                            <i data-lucide="x" class="h-5 w-5"></i>
                        </button>
                    </div>
                    
                    <div class="p-6 space-y-6">
                        <!-- Instructions -->
                        <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                            <p class="text-sm font-medium mb-2">📄 CSV Format Instructions:</p>
                            <ul class="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                                <li>Required columns: <strong>name, grade</strong></li>
                                <li>Optional columns: parentEmail, parentPhone, dateOfBirth, gender</li>
                                <li>Example: John Doe,Grade 10A,john@email.com,0712345678,2010-01-01,Male</li>
                            </ul>
                            <button onclick="downloadCSVTemplate()" class="mt-3 text-xs text-primary hover:underline flex items-center gap-1">
                                <i data-lucide="download" class="h-3 w-3"></i>
                                Download CSV Template
                            </button>
                        </div>
                        
                        <!-- File Drop Zone -->
                        <div id="csv-drop-zone" class="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                            <i data-lucide="upload-cloud" class="h-12 w-12 mx-auto text-muted-foreground mb-3"></i>
                            <p class="text-sm">Drag & drop CSV file here or click to browse</p>
                            <p class="text-xs text-muted-foreground mt-1">Maximum file size: 10MB</p>
                            <input type="file" id="csv-file-input" accept=".csv" class="hidden">
                        </div>
                        
                        <!-- Progress Bar -->
                        <div id="upload-progress-container" class="hidden">
                            <div class="flex justify-between text-sm mb-1">
                                <span>Processing...</span>
                                <span id="upload-progress-percent">0%</span>
                            </div>
                            <div class="w-full bg-muted rounded-full h-2">
                                <div id="upload-progress-bar" class="bg-primary h-2 rounded-full transition-all" style="width: 0%"></div>
                            </div>
                        </div>
                        
                        <!-- Preview Table -->
                        <div id="csv-preview-container" class="hidden">
                            <h4 class="font-semibold mb-3">Preview Students to Upload</h4>
                            <div class="overflow-x-auto border rounded-lg">
                                <table class="w-full text-sm" id="csv-preview-table">
                                    <thead class="bg-muted/50">
                                        <tr id="csv-preview-header"></tr>
                                    </thead>
                                    <tbody id="csv-preview-body"></tbody>
                                </table>
                            </div>
                            <div id="csv-upload-status" class="mt-4 p-3 rounded-lg hidden"></div>
                        </div>
                        
                        <!-- Action Buttons -->
                        <div class="flex justify-end gap-3 pt-4 border-t">
                            <button onclick="closeCSVUploadModal()" class="px-4 py-2 border rounded-lg hover:bg-accent">Cancel</button>
                            <button id="confirm-upload-btn" onclick="processCSVUpload()" class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90" disabled>
                                Upload Students
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Setup drop zone
    const dropZone = document.getElementById('csv-drop-zone');
    const fileInput = document.getElementById('csv-file-input');
    
    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('border-primary', 'bg-primary/5');
    });
    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('border-primary', 'bg-primary/5');
    });
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('border-primary', 'bg-primary/5');
        const file = e.dataTransfer.files[0];
        if (file && file.name.endsWith('.csv')) {
            handleCSVFile(file);
        } else {
            showToast('Please upload a CSV file', 'error');
        }
    });
    
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleCSVFile(e.target.files[0]);
        }
    });
}

function closeCSVUploadModal() {
    const modal = document.getElementById('csv-upload-modal');
    if (modal) modal.classList.add('hidden');
    currentCSVData = null;
    currentCSVFile = null;
}

async function handleCSVFile(file) {
    if (!file.name.endsWith('.csv')) {
        showToast('Please select a CSV file', 'error');
        return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
        showToast('File size exceeds 10MB limit', 'error');
        return;
    }
    
    currentCSVFile = file;
    
    const progressContainer = document.getElementById('upload-progress-container');
    const progressBar = document.getElementById('upload-progress-bar');
    const progressPercent = document.getElementById('upload-progress-percent');
    
    progressContainer.classList.remove('hidden');
    progressBar.style.width = '30%';
    progressPercent.textContent = '30%';
    
    // Simulate progress
    setTimeout(() => {
        progressBar.style.width = '60%';
        progressPercent.textContent = '60%';
    }, 200);
    
    try {
        const text = await file.text();
        
        setTimeout(() => {
            progressBar.style.width = '100%';
            progressPercent.textContent = '100%';
        }, 400);
        
        setTimeout(() => {
            progressContainer.classList.add('hidden');
            parseAndPreviewCSV(text);
        }, 600);
        
    } catch (error) {
        console.error('Error reading file:', error);
        showToast('Failed to read file', 'error');
        progressContainer.classList.add('hidden');
    }
}

function parseAndPreviewCSV(content) {
    try {
        const { students, errors, headers } = parseCSV(content);
        currentCSVData = students;
        
        const previewContainer = document.getElementById('csv-preview-container');
        const confirmBtn = document.getElementById('confirm-upload-btn');
        const statusDiv = document.getElementById('csv-upload-status');
        
        if (students.length === 0) {
            statusDiv.innerHTML = `
                <div class="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-3 rounded-lg">
                    <i data-lucide="alert-circle" class="h-4 w-4 inline mr-2"></i>
                    No valid students found in CSV. Please check the format.
                </div>
            `;
            statusDiv.classList.remove('hidden');
            confirmBtn.disabled = true;
            return;
        }
        
        if (errors.length > 0) {
            statusDiv.innerHTML = `
                <div class="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 p-3 rounded-lg mb-3">
                    <i data-lucide="alert-triangle" class="h-4 w-4 inline mr-2"></i>
                    ${errors.length} warning(s) found. These rows will be skipped.
                </div>
                <div class="max-h-32 overflow-y-auto text-xs">
                    ${errors.map(e => `<div>⚠️ ${e}</div>`).join('')}
                </div>
            `;
            statusDiv.classList.remove('hidden');
        } else {
            statusDiv.innerHTML = `
                <div class="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 p-3 rounded-lg">
                    <i data-lucide="check-circle" class="h-4 w-4 inline mr-2"></i>
                    Found ${students.length} valid student(s) ready to upload.
                </div>
            `;
            statusDiv.classList.remove('hidden');
        }
        
        // Build preview table
        const displayHeaders = ['Name', 'Grade', 'Parent Email', 'Parent Phone', 'Status'];
        const headerRow = document.getElementById('csv-preview-header');
        const bodyRow = document.getElementById('csv-preview-body');
        
        headerRow.innerHTML = displayHeaders.map(h => `<th class="px-4 py-2 text-left font-medium">${h}</th>`).join('');
        
        bodyRow.innerHTML = students.slice(0, 10).map(student => `
            <tr class="border-t hover:bg-accent/50">
                <td class="px-4 py-2">${escapeHtml(student.name)}</td>
                <td class="px-4 py-2">${escapeHtml(student.grade)}</td>
                <td class="px-4 py-2">${escapeHtml(student.parentEmail || '-')}</td>
                <td class="px-4 py-2">${escapeHtml(student.parentPhone || '-')}</td>
                <td class="px-4 py-2"><span class="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Ready</span></td>
            </tr>
        `).join('');
        
        if (students.length > 10) {
            bodyRow.innerHTML += `
                <tr class="border-t bg-muted/30">
                    <td colspan="5" class="px-4 py-2 text-center text-muted-foreground text-sm">
                        + ${students.length - 10} more students...
                    </td>
                </tr>
            `;
        }
        
        previewContainer.classList.remove('hidden');
        confirmBtn.disabled = false;
        
        if (typeof lucide !== 'undefined') lucide.createIcons();
        
    } catch (error) {
        console.error('Parse error:', error);
        const statusDiv = document.getElementById('csv-upload-status');
        statusDiv.innerHTML = `
            <div class="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-3 rounded-lg">
                <i data-lucide="alert-circle" class="h-4 w-4 inline mr-2"></i>
                Error parsing CSV: ${error.message}
            </div>
        `;
        statusDiv.classList.remove('hidden');
        document.getElementById('confirm-upload-btn').disabled = true;
    }
}

async function processCSVUpload() {
    if (!currentCSVData || currentCSVData.length === 0) {
        showToast('No students to upload', 'error');
        return;
    }
    
    const confirmBtn = document.getElementById('confirm-upload-btn');
    const statusDiv = document.getElementById('csv-upload-status');
    
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = '<i data-lucide="loader-2" class="h-4 w-4 animate-spin mr-2"></i>Uploading...';
    
    let successCount = 0;
    let failedCount = 0;
    const failedStudents = [];
    
    for (const student of currentCSVData) {
        try {
            const response = await api.teacher.addStudent({
                name: student.name,
                grade: student.grade,
                parentEmail: student.parentEmail,
                parentPhone: student.parentPhone,
                dateOfBirth: student.dateOfBirth,
                gender: student.gender
            });
            
            if (response.success) {
                successCount++;
                console.log(`✅ Added: ${student.name} - ELIMUID: ${response.data.elimuid}`);
            } else {
                failedCount++;
                failedStudents.push({ name: student.name, reason: response.message || 'Unknown error' });
            }
        } catch (error) {
            failedCount++;
            failedStudents.push({ name: student.name, reason: error.message || 'API error' });
            console.error(`❌ Failed to add ${student.name}:`, error);
        }
    }
    
    // Show final result
    let resultHtml = `
        <div class="p-4 rounded-lg ${successCount > 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}">
            <div class="flex items-center gap-2 mb-2">
                <i data-lucide="${successCount > 0 ? 'check-circle' : 'alert-circle'}" class="h-5 w-5 ${successCount > 0 ? 'text-green-600' : 'text-red-600'}"></i>
                <span class="font-semibold">Upload Complete</span>
            </div>
            <p class="text-sm">✅ Successfully added: ${successCount} student(s)</p>
            ${failedCount > 0 ? `<p class="text-sm text-red-600">❌ Failed: ${failedCount} student(s)</p>` : ''}
        </div>
    `;
    
    if (failedStudents.length > 0) {
        resultHtml += `
            <div class="mt-3">
                <p class="text-sm font-medium mb-2">Failed Students:</p>
                <div class="max-h-40 overflow-y-auto text-xs space-y-1">
                    ${failedStudents.map(f => `<div class="text-red-600">• ${f.name}: ${f.reason}</div>`).join('')}
                </div>
            </div>
        `;
    }
    
    statusDiv.innerHTML = resultHtml;
    statusDiv.classList.remove('hidden');
    
    confirmBtn.innerHTML = 'Upload Students';
    confirmBtn.disabled = false;
    
    if (successCount > 0) {
        // Refresh student list
        if (typeof refreshMyStudents === 'function') {
            await refreshMyStudents();
        }
        
        // Close modal after 3 seconds
        setTimeout(() => {
            closeCSVUploadModal();
            showToast(`✅ Successfully added ${successCount} students`, 'success');
        }, 3000);
    }
    
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function downloadCSVTemplate() {
    const template = `name,grade,parentEmail,parentPhone,dateOfBirth,gender
John Doe,Grade 10A,parent@example.com,0712345678,2010-01-01,Male
Jane Smith,Grade 10B,parent2@example.com,0723456789,2010-02-15,Female
Michael Brown,Grade 9A,,,2009-05-20,Male`;
    
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'students_template.csv';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Template downloaded', 'success');
}

// Export
window.showCSVUploadModal = showCSVUploadModal;
window.closeCSVUploadModal = closeCSVUploadModal;
window.downloadCSVTemplate = downloadCSVTemplate;
