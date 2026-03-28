// csv-upload.js - Complete CSV upload and processing system

// ============ CSV PARSING AND VALIDATION ============

function parseCSV(fileContent) {
    const lines = fileContent.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
        throw new Error('CSV file must contain headers and at least one data row');
    }
    
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
    
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
        
        // Parse CSV line (handle quoted values)
        let values = [];
        let inQuote = false;
        let currentValue = '';
        
        for (let char of lines[i]) {
            if (char === '"') {
                inQuote = !inQuote;
            } else if (char === ',' && !inQuote) {
                values.push(currentValue.trim());
                currentValue = '';
            } else {
                currentValue += char;
            }
        }
        values.push(currentValue.trim());
        
        const student = {};
        headers.forEach((header, index) => {
            if (values[index]) {
                student[header] = values[index].replace(/^"|"$/g, '');
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
    const fileInput = document.getElementById('csv-file-input');
    if (fileInput) fileInput.value = '';
    
    const previewContainer = document.getElementById('csv-preview-container');
    if (previewContainer) previewContainer.classList.add('hidden');
    
    const progressContainer = document.getElementById('upload-progress-container');
    if (progressContainer) progressContainer.classList.add('hidden');
    
    const statusDiv = document.getElementById('csv-upload-status');
    if (statusDiv) {
        statusDiv.innerHTML = '';
        statusDiv.classList.add('hidden');
    }
    
    const confirmBtn = document.getElementById('confirm-upload-btn');
    if (confirmBtn) confirmBtn.disabled = true;
    
    modal.classList.remove('hidden');
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function createCSVUploadModal() {
    const modalHTML = `
        <div id="csv-upload-modal" class="fixed inset-0 z-50 hidden">
            <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" onclick="closeCSVUploadModal()"></div>
            <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-5xl p-4">
                <div class="rounded-2xl border bg-card shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
                    <div class="sticky top-0 bg-card border-b px-6 py-4 flex justify-between items-center">
                        <h3 class="text-xl font-semibold">Upload Students via CSV</h3>
                        <button onclick="closeCSVUploadModal()" class="p-2 hover:bg-accent rounded-lg transition-colors">
                            <i data-lucide="x" class="h-5 w-5"></i>
                        </button>
                    </div>
                    
                    <div class="p-6 space-y-6">
                        <!-- Instructions -->
                        <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                            <p class="text-sm font-medium mb-2 flex items-center gap-2">
                                <i data-lucide="file-text" class="h-4 w-4"></i>
                                CSV Format Instructions:
                            </p>
                            <ul class="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                                <li>Required columns: <strong class="text-primary">name, grade</strong></li>
                                <li>Optional columns: parentEmail, parentPhone, dateOfBirth, gender</li>
                                <li>Example: <code class="bg-muted px-1 rounded">John Doe,Grade 10A,john@email.com,0712345678,2010-01-01,Male</code></li>
                                <li>Maximum file size: <strong>10MB</strong></li>
                            </ul>
                            <button onclick="downloadCSVTemplate()" class="mt-3 text-xs text-primary hover:underline flex items-center gap-1 transition-colors">
                                <i data-lucide="download" class="h-3 w-3"></i>
                                Download CSV Template
                            </button>
                        </div>
                        
                        <!-- File Drop Zone -->
                        <div id="csv-drop-zone" class="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer">
                            <i data-lucide="upload-cloud" class="h-12 w-12 mx-auto text-muted-foreground mb-3"></i>
                            <p class="text-sm font-medium">Drag & drop CSV file here or click to browse</p>
                            <p class="text-xs text-muted-foreground mt-1">Supported format: .csv</p>
                            <input type="file" id="csv-file-input" accept=".csv" class="hidden">
                        </div>
                        
                        <!-- Progress Bar -->
                        <div id="upload-progress-container" class="hidden">
                            <div class="flex justify-between text-sm mb-1">
                                <span>Processing file...</span>
                                <span id="upload-progress-percent">0%</span>
                            </div>
                            <div class="w-full bg-muted rounded-full h-2 overflow-hidden">
                                <div id="upload-progress-bar" class="bg-primary h-2 rounded-full transition-all duration-300" style="width: 0%"></div>
                            </div>
                        </div>
                        
                        <!-- Preview Table -->
                        <div id="csv-preview-container" class="hidden">
                            <div class="flex justify-between items-center mb-3">
                                <h4 class="font-semibold">Preview Students to Upload</h4>
                                <span class="text-xs text-muted-foreground" id="preview-count"></span>
                            </div>
                            <div class="overflow-x-auto border rounded-lg">
                                <table class="w-full text-sm" id="csv-preview-table">
                                    <thead class="bg-muted/50 sticky top-0">
                                        <tr id="csv-preview-header"></tr>
                                    </thead>
                                    <tbody id="csv-preview-body"></tbody>
                                </table>
                            </div>
                            <div id="csv-upload-status" class="mt-4 p-3 rounded-lg hidden"></div>
                        </div>
                        
                        <!-- Action Buttons -->
                        <div class="flex justify-end gap-3 pt-4 border-t">
                            <button onclick="closeCSVUploadModal()" class="px-4 py-2 border rounded-lg hover:bg-accent transition-colors">
                                Cancel
                            </button>
                            <button id="confirm-upload-btn" onclick="processCSVUpload()" 
                                    class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                                    disabled>
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
    
    if (dropZone && fileInput) {
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
}

function closeCSVUploadModal() {
    const modal = document.getElementById('csv-upload-modal');
    if (modal) modal.classList.add('hidden');
    currentCSVData = null;
    currentCSVFile = null;
}

async function handleCSVFile(file) {
    if (!file.name.toLowerCase().endsWith('.csv')) {
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
    
    if (progressContainer) progressContainer.classList.remove('hidden');
    if (progressBar) progressBar.style.width = '30%';
    if (progressPercent) progressPercent.textContent = '30%';
    
    // Simulate progress for better UX
    setTimeout(() => {
        if (progressBar) progressBar.style.width = '60%';
        if (progressPercent) progressPercent.textContent = '60%';
    }, 200);
    
    try {
        const text = await file.text();
        
        setTimeout(() => {
            if (progressBar) progressBar.style.width = '100%';
            if (progressPercent) progressPercent.textContent = '100%';
        }, 400);
        
        setTimeout(() => {
            if (progressContainer) progressContainer.classList.add('hidden');
            parseAndPreviewCSV(text);
        }, 600);
        
    } catch (error) {
        console.error('Error reading file:', error);
        showToast('Failed to read file', 'error');
        if (progressContainer) progressContainer.classList.add('hidden');
    }
}

function parseAndPreviewCSV(content) {
    try {
        const { students, errors, headers } = parseCSV(content);
        currentCSVData = students;
        
        const previewContainer = document.getElementById('csv-preview-container');
        const confirmBtn = document.getElementById('confirm-upload-btn');
        const statusDiv = document.getElementById('csv-upload-status');
        const previewCount = document.getElementById('preview-count');
        
        if (students.length === 0) {
            if (statusDiv) {
                statusDiv.innerHTML = `
                    <div class="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-3 rounded-lg border border-red-200 dark:border-red-800">
                        <i data-lucide="alert-circle" class="h-4 w-4 inline mr-2"></i>
                        No valid students found in CSV. Please check the format.
                    </div>
                `;
                statusDiv.classList.remove('hidden');
            }
            if (confirmBtn) confirmBtn.disabled = true;
            return;
        }
        
        if (previewCount) previewCount.textContent = `${students.length} student(s) ready`;
        
        if (errors.length > 0 && statusDiv) {
            statusDiv.innerHTML = `
                <div class="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800 mb-3">
                    <i data-lucide="alert-triangle" class="h-4 w-4 inline mr-2"></i>
                    ${errors.length} warning(s) found. These rows will be skipped.
                </div>
                <div class="max-h-32 overflow-y-auto text-xs space-y-1">
                    ${errors.map(e => `<div class="text-yellow-600 dark:text-yellow-400">⚠️ ${escapeHtml(e)}</div>`).join('')}
                </div>
            `;
            statusDiv.classList.remove('hidden');
        } else if (statusDiv) {
            statusDiv.innerHTML = `
                <div class="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 p-3 rounded-lg border border-green-200 dark:border-green-800">
                    <i data-lucide="check-circle" class="h-4 w-4 inline mr-2"></i>
                    Found ${students.length} valid student(s) ready to upload.
                </div>
            `;
            statusDiv.classList.remove('hidden');
        }
        
        // Build preview table
        const displayHeaders = ['Student Name', 'Grade', 'Parent Email', 'Parent Phone', 'DOB', 'Gender', 'Status'];
        const headerRow = document.getElementById('csv-preview-header');
        const bodyRow = document.getElementById('csv-preview-body');
        
        if (headerRow) {
            headerRow.innerHTML = displayHeaders.map(h => 
                `<th class="px-4 py-2 text-left font-medium border-b">${h}</th>`
            ).join('');
        }
        
        if (bodyRow) {
            bodyRow.innerHTML = students.slice(0, 10).map(student => `
                <tr class="border-t hover:bg-accent/50 transition-colors">
                    <td class="px-4 py-2 font-medium">${escapeHtml(student.name)}</td>
                    <td class="px-4 py-2">${escapeHtml(student.grade)}</td>
                    <td class="px-4 py-2 text-muted-foreground">${escapeHtml(student.parentEmail || '-')}</td>
                    <td class="px-4 py-2 text-muted-foreground">${escapeHtml(student.parentPhone || '-')}</td>
                    <td class="px-4 py-2 text-muted-foreground">${escapeHtml(student.dateOfBirth || '-')}</td>
                    <td class="px-4 py-2 text-muted-foreground">${escapeHtml(student.gender || '-')}</td>
                    <td class="px-4 py-2"><span class="px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs rounded-full">Ready</span></td>
                </tr>
            `).join('');
            
            if (students.length > 10 && bodyRow) {
                bodyRow.innerHTML += `
                    <tr class="border-t bg-muted/30">
                        <td colspan="7" class="px-4 py-2 text-center text-muted-foreground text-sm">
                            + ${students.length - 10} more student(s)...
                        </td>
                    </tr>
                `;
            }
        }
        
        if (previewContainer) previewContainer.classList.remove('hidden');
        if (confirmBtn) confirmBtn.disabled = false;
        
        if (typeof lucide !== 'undefined') lucide.createIcons();
        
    } catch (error) {
        console.error('Parse error:', error);
        const statusDiv = document.getElementById('csv-upload-status');
        if (statusDiv) {
            statusDiv.innerHTML = `
                <div class="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-3 rounded-lg border border-red-200 dark:border-red-800">
                    <i data-lucide="alert-circle" class="h-4 w-4 inline mr-2"></i>
                    Error parsing CSV: ${escapeHtml(error.message)}
                </div>
            `;
            statusDiv.classList.remove('hidden');
        }
        const confirmBtn = document.getElementById('confirm-upload-btn');
        if (confirmBtn) confirmBtn.disabled = true;
    }
}

async function processCSVUpload() {
    if (!currentCSVData || currentCSVData.length === 0) {
        showToast('No students to upload', 'error');
        return;
    }
    
    const confirmBtn = document.getElementById('confirm-upload-btn');
    const statusDiv = document.getElementById('csv-upload-status');
    const progressContainer = document.getElementById('upload-progress-container');
    const progressBar = document.getElementById('upload-progress-bar');
    const progressPercent = document.getElementById('upload-progress-percent');
    
    if (confirmBtn) {
        confirmBtn.disabled = true;
        confirmBtn.innerHTML = '<i data-lucide="loader-2" class="h-4 w-4 animate-spin mr-2"></i>Uploading...';
    }
    
    if (progressContainer) progressContainer.classList.remove('hidden');
    if (progressBar) progressBar.style.width = '0%';
    if (progressPercent) progressPercent.textContent = '0%';
    
    let successCount = 0;
    let failedCount = 0;
    const failedStudents = [];
    const generatedElimuids = [];
    
    for (let i = 0; i < currentCSVData.length; i++) {
        const student = currentCSVData[i];
        const percent = Math.round(((i + 1) / currentCSVData.length) * 100);
        
        if (progressBar) progressBar.style.width = `${percent}%`;
        if (progressPercent) progressPercent.textContent = `${percent}%`;
        
        try {
            const response = await api.teacher.addStudent({
                name: student.name,
                grade: student.grade,
                parentEmail: student.parentEmail,
                parentPhone: student.parentPhone,
                dateOfBirth: student.dateOfBirth,
                gender: student.gender
            });
            
            if (response && response.success) {
                successCount++;
                generatedElimuids.push({
                    name: student.name,
                    elimuid: response.data?.elimuid || 'Generated'
                });
                console.log(`✅ Added: ${student.name}`);
            } else {
                failedCount++;
                failedStudents.push({ 
                    name: student.name, 
                    reason: response?.message || 'Unknown error' 
                });
            }
        } catch (error) {
            failedCount++;
            failedStudents.push({ 
                name: student.name, 
                reason: error.message || 'API error' 
            });
            console.error(`❌ Failed to add ${student.name}:`, error);
        }
        
        // Small delay to prevent rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    if (progressContainer) progressContainer.classList.add('hidden');
    
    // Show final result
    let resultHtml = `
        <div class="rounded-lg ${successCount > 0 ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'} p-4">
            <div class="flex items-center gap-2 mb-2">
                <i data-lucide="${successCount > 0 ? 'check-circle' : 'alert-circle'}" class="h-5 w-5 ${successCount > 0 ? 'text-green-600' : 'text-red-600'}"></i>
                <span class="font-semibold">Upload Complete</span>
            </div>
            <p class="text-sm">✅ Successfully added: <strong class="text-green-600">${successCount}</strong> student(s)</p>
            ${failedCount > 0 ? `<p class="text-sm text-red-600">❌ Failed: ${failedCount} student(s)</p>` : ''}
    `;
    
    if (generatedElimuids.length > 0) {
        resultHtml += `
            <div class="mt-3">
                <p class="text-sm font-medium mb-2">Generated ELIMUIDs:</p>
                <div class="max-h-40 overflow-y-auto text-xs space-y-1 bg-muted/30 p-2 rounded">
                    ${generatedElimuids.map(e => `<div class="font-mono">• ${escapeHtml(e.name)}: <span class="text-primary font-bold">${escapeHtml(e.elimuid)}</span></div>`).join('')}
                </div>
            </div>
        `;
    }
    
    if (failedStudents.length > 0) {
        resultHtml += `
            <div class="mt-3">
                <p class="text-sm font-medium mb-2 text-red-600">Failed Students:</p>
                <div class="max-h-32 overflow-y-auto text-xs space-y-1 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                    ${failedStudents.map(f => `<div class="text-red-600">• ${escapeHtml(f.name)}: ${escapeHtml(f.reason)}</div>`).join('')}
                </div>
            </div>
        `;
    }
    
    resultHtml += `</div>`;
    
    if (statusDiv) {
        statusDiv.innerHTML = resultHtml;
        statusDiv.classList.remove('hidden');
    }
    
    if (confirmBtn) {
        confirmBtn.innerHTML = 'Upload Students';
        confirmBtn.disabled = false;
    }
    
    if (successCount > 0) {
        if (typeof refreshMyStudents === 'function') {
            await refreshMyStudents();
        }
        if (typeof refreshStudentList === 'function') {
            await refreshStudentList();
        }
        
        setTimeout(() => {
            closeCSVUploadModal();
            showToast(`✅ Successfully added ${successCount} student${successCount !== 1 ? 's' : ''}`, 'success');
        }, 3000);
    }
    
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function downloadCSVTemplate() {
    const template = `name,grade,parentEmail,parentPhone,dateOfBirth,gender
John Doe,Grade 10A,john.parent@example.com,0712345678,2010-01-01,Male
Jane Smith,Grade 10B,jane.parent@example.com,0723456789,2010-02-15,Female
Michael Brown,Grade 9A,michael.parent@example.com,0734567890,2009-05-20,Male
Sarah Wilson,Grade 11A,sarah.parent@example.com,0745678901,2008-08-10,Female
David Lee,Grade 8B,david.parent@example.com,0756789012,2011-03-25,Male`;
    
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'students_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Template downloaded successfully', 'success');
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Export
window.showCSVUploadModal = showCSVUploadModal;
window.closeCSVUploadModal = closeCSVUploadModal;
window.downloadCSVTemplate = downloadCSVTemplate;
window.processCSVUpload = processCSVUpload;
