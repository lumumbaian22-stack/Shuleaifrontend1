// curriculum.js - Curriculum definitions and grade calculations

// ============ CURRICULUM DATA ============
const CURRICULUMS = {
    'cbc': {
        name: 'CBC (Competency Based Curriculum)',
        levels: {
            primary: ['PP1', 'PP2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6'],
            secondary: ['Grade 7', 'Grade 8', 'Grade 9']
        },
        subjects: {
            primary: ['Mathematics', 'English', 'Kiswahili', 'Science', 'Social Studies', 'CRE/IRE', 'Physical Education', 'Art & Craft', 'Music'],
            secondary: ['Mathematics', 'English', 'Kiswahili', 'Biology', 'Chemistry', 'Physics', 'History', 'Geography', 'CRE/IRE', 'Business Studies', 'Agriculture', 'Computer Studies']
        },
        grading: {
            primary: [
                { grade: 'EE', range: '80-100', description: 'Exceeding Expectations' },
                { grade: 'ME', range: '60-79', description: 'Meeting Expectations' },
                { grade: 'AE', range: '40-59', description: 'Approaching Expectations' },
                { grade: 'BE', range: '0-39', description: 'Below Expectations' }
            ],
            secondary: [
                { grade: 'A', range: '81-100', description: 'Excellent' },
                { grade: 'A-', range: '75-80', description: 'Very Good' },
                { grade: 'B+', range: '70-74', description: 'Good' },
                { grade: 'B', range: '65-69', description: 'Above Average' },
                { grade: 'B-', range: '60-64', description: 'Average' },
                { grade: 'C+', range: '55-59', description: 'Below Average' },
                { grade: 'C', range: '50-54', description: 'Fair' },
                { grade: 'C-', range: '45-49', description: 'Poor' },
                { grade: 'D+', range: '40-44', description: 'Very Poor' },
                { grade: 'D', range: '35-39', description: 'Weak' },
                { grade: 'D-', range: '30-34', description: 'Very Weak' },
                { grade: 'E', range: '0-29', description: 'Fail' }
            ]
        },
        countries: ['Kenya']
    },
    '844': {
        name: '8-4-4 System',
        levels: {
            primary: ['Standard 1', 'Standard 2', 'Standard 3', 'Standard 4', 'Standard 5', 'Standard 6', 'Standard 7', 'Standard 8'],
            secondary: ['Form 1', 'Form 2', 'Form 3', 'Form 4']
        },
        subjects: {
            primary: ['Mathematics', 'English', 'Kiswahili', 'Science', 'Social Studies', 'CRE/IRE', 'Physical Education'],
            secondary: ['Mathematics', 'English', 'Kiswahili', 'Biology', 'Chemistry', 'Physics', 'History', 'Geography', 'CRE/IRE', 'Business Studies', 'Agriculture', 'Computer Studies']
        },
        grading: {
            primary: [
                { grade: 'A', range: '81-100', description: 'Excellent' },
                { grade: 'A-', range: '75-80', description: 'Very Good' },
                { grade: 'B+', range: '70-74', description: 'Good' },
                { grade: 'B', range: '65-69', description: 'Above Average' },
                { grade: 'B-', range: '60-64', description: 'Average' },
                { grade: 'C+', range: '55-59', description: 'Below Average' },
                { grade: 'C', range: '50-54', description: 'Fair' },
                { grade: 'C-', range: '45-49', description: 'Poor' },
                { grade: 'D+', range: '40-44', description: 'Very Poor' },
                { grade: 'D', range: '35-39', description: 'Weak' },
                { grade: 'D-', range: '30-34', description: 'Very Weak' },
                { grade: 'E', range: '0-29', description: 'Fail' }
            ],
            secondary: [
                { grade: 'A', range: '81-100', description: 'Excellent' },
                { grade: 'A-', range: '75-80', description: 'Very Good' },
                { grade: 'B+', range: '70-74', description: 'Good' },
                { grade: 'B', range: '65-69', description: 'Above Average' },
                { grade: 'B-', range: '60-64', description: 'Average' },
                { grade: 'C+', range: '55-59', description: 'Below Average' },
                { grade: 'C', range: '50-54', description: 'Fair' },
                { grade: 'C-', range: '45-49', description: 'Poor' },
                { grade: 'D+', range: '40-44', description: 'Very Poor' },
                { grade: 'D', range: '35-39', description: 'Weak' },
                { grade: 'D-', range: '30-34', description: 'Very Weak' },
                { grade: 'E', range: '0-29', description: 'Fail' }
            ]
        },
        countries: ['Kenya']
    },
    'british': {
        name: 'British Curriculum',
        levels: {
            primary: ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Year 6'],
            secondary: ['Year 7', 'Year 8', 'Year 9', 'Year 10', 'Year 11', 'Year 12', 'Year 13']
        },
        subjects: {
            primary: ['English', 'Mathematics', 'Science', 'History', 'Geography', 'Art', 'Music', 'Physical Education'],
            secondary: ['English Literature', 'English Language', 'Mathematics', 'Biology', 'Chemistry', 'Physics', 'History', 'Geography', 'French', 'Spanish', 'Computer Science', 'Business Studies', 'Economics', 'Art & Design', 'Music', 'Physical Education']
        },
        grading: {
            primary: [
                { grade: 'A*', range: '90-100', description: 'Exceptional' },
                { grade: 'A', range: '80-89', description: 'Excellent' },
                { grade: 'B', range: '70-79', description: 'Very Good' },
                { grade: 'C', range: '60-69', description: 'Good' },
                { grade: 'D', range: '50-59', description: 'Satisfactory' },
                { grade: 'E', range: '40-49', description: 'Below Average' },
                { grade: 'F', range: '30-39', description: 'Poor' },
                { grade: 'G', range: '20-29', description: 'Very Poor' },
                { grade: 'U', range: '0-19', description: 'Ungraded' }
            ],
            secondary: [
                { grade: 'A*', range: '90-100', description: 'Exceptional' },
                { grade: 'A', range: '80-89', description: 'Excellent' },
                { grade: 'B', range: '70-79', description: 'Very Good' },
                { grade: 'C', range: '60-69', description: 'Good' },
                { grade: 'D', range: '50-59', description: 'Satisfactory' },
                { grade: 'E', range: '40-49', description: 'Below Average' },
                { grade: 'F', range: '30-39', description: 'Poor' },
                { grade: 'G', range: '20-29', description: 'Very Poor' },
                { grade: 'U', range: '0-19', description: 'Ungraded' }
            ]
        },
        countries: ['UK', 'International']
    },
    'american': {
        name: 'American Curriculum',
        levels: {
            primary: ['Kindergarten', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5'],
            secondary: ['Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12']
        },
        subjects: {
            primary: ['English Language Arts', 'Mathematics', 'Science', 'Social Studies', 'Art', 'Music', 'Physical Education'],
            secondary: ['English', 'Mathematics', 'Biology', 'Chemistry', 'Physics', 'History', 'Geography', 'Spanish', 'French', 'Computer Science', 'Business', 'Economics', 'Art', 'Music', 'Physical Education']
        },
        grading: {
            primary: [
                { grade: 'A', range: '90-100', description: 'Excellent', gpa: 4.0 },
                { grade: 'B', range: '80-89', description: 'Good', gpa: 3.0 },
                { grade: 'C', range: '70-79', description: 'Average', gpa: 2.0 },
                { grade: 'D', range: '60-69', description: 'Below Average', gpa: 1.0 },
                { grade: 'F', range: '0-59', description: 'Failing', gpa: 0.0 }
            ],
            secondary: [
                { grade: 'A', range: '90-100', description: 'Excellent', gpa: 4.0 },
                { grade: 'B', range: '80-89', description: 'Good', gpa: 3.0 },
                { grade: 'C', range: '70-79', description: 'Average', gpa: 2.0 },
                { grade: 'D', range: '60-69', description: 'Below Average', gpa: 1.0 },
                { grade: 'F', range: '0-59', description: 'Failing', gpa: 0.0 }
            ]
        },
        countries: ['USA', 'International']
    }
};

const CURRICULUM_STRUCTURE = {
    'cbc': {
        name: 'CBC (Competency Based Curriculum)',
        levels: {
            pre_primary: { name: 'Pre-Primary', classes: ['PP1', 'PP2'], subjects: ['Language Activities', 'Mathematics Activities', 'Environmental Activities', 'Psychomotor and Creative Activities', 'Religious Education'] },
            lower_primary: { name: 'Lower Primary (Grade 1-3)', classes: ['Grade 1', 'Grade 2', 'Grade 3'], subjects: ['Literacy (English)', 'Literacy (Kiswahili)', 'Mathematics', 'Environmental Activities', 'Religious Education', 'Creative Arts', 'Physical and Health Education'] },
            upper_primary: { name: 'Upper Primary (Grade 4-6)', classes: ['Grade 4', 'Grade 5', 'Grade 6'], subjects: ['English', 'Kiswahili', 'Mathematics', 'Science and Technology', 'Agriculture and Nutrition', 'Creative Arts', 'Social Studies', 'Religious Education', 'Physical and Health Education'] },
            junior_secondary: { name: 'Junior Secondary (Grade 7-9)', classes: ['Grade 7', 'Grade 8', 'Grade 9'], subjects: ['English', 'Kiswahili', 'Mathematics', 'Integrated Science', 'Health Education', 'Social Studies', 'Pre-Technical and Pre-Career Education', 'Agriculture', 'Business Studies', 'Religious Education', 'Life Skills Education', 'Sports and Physical Education', 'Visual Arts', 'Performing Arts'], optional_subjects: ['German', 'French', 'Mandarin', 'Indigenous Languages', 'Computer Science'] },
            senior_secondary: { name: 'Senior Secondary (Grade 10-12)', classes: ['Grade 10', 'Grade 11', 'Grade 12'], pathways: { stem: { name: 'STEM Pathway', subjects: ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'Aviation Technology', 'Agriculture'] }, arts_sports: { name: 'Arts and Sports Science', subjects: ['Music', 'Fine Arts', 'Performing Arts', 'Media Studies', 'Physical Education', 'Creative Writing'] }, social_sciences: { name: 'Social Sciences', subjects: ['History', 'Geography', 'English Literature', 'Religious Education', 'Business Studies', 'Sociology', 'Philosophy', 'Foreign Languages'] } }, mandatory_subjects: ['English', 'Kiswahili', 'Physical Education', 'Community Service Learning'] }
        }
    },
    '844': {
        name: '8-4-4 System',
        levels: {
            primary: { name: 'Primary (Standard 1-8)', classes: ['Standard 1', 'Standard 2', 'Standard 3', 'Standard 4', 'Standard 5', 'Standard 6', 'Standard 7', 'Standard 8'], subjects: ['Mathematics', 'English', 'Kiswahili', 'Science', 'Social Studies', 'Religious Education', 'Physical Education'] },
            secondary: { name: 'Secondary (Form 1-4)', classes: ['Form 1', 'Form 2', 'Form 3', 'Form 4'], subjects: ['Mathematics', 'English', 'Kiswahili', 'Biology', 'Chemistry', 'Physics', 'History', 'Geography', 'Religious Education', 'Business Studies', 'Agriculture', 'Computer Studies'], optional_subjects: ['French', 'German', 'Arabic', 'Music', 'Art and Design'] }
        }
    },
    'british': {
        name: 'British Curriculum',
        levels: {
            primary: { name: 'Primary (Year 1-6)', classes: ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Year 6'], subjects: ['English', 'Mathematics', 'Science', 'History', 'Geography', 'Art', 'Music', 'Physical Education', 'Computing'] },
            lower_secondary: { name: 'Lower Secondary (Year 7-9)', classes: ['Year 7', 'Year 8', 'Year 9'], subjects: ['English', 'Mathematics', 'Biology', 'Chemistry', 'Physics', 'History', 'Geography', 'French', 'Spanish', 'Computer Science', 'Art', 'Music', 'Physical Education'] },
            upper_secondary: { name: 'Upper Secondary (Year 10-13)', classes: ['Year 10', 'Year 11', 'Year 12', 'Year 13'], subjects: ['English Literature', 'English Language', 'Mathematics', 'Biology', 'Chemistry', 'Physics', 'History', 'Geography', 'French', 'Spanish', 'Computer Science', 'Business Studies', 'Economics', 'Psychology', 'Sociology', 'Art', 'Music'] }
        }
    },
    'american': {
        name: 'American Curriculum',
        levels: {
            elementary: { name: 'Elementary (K-5)', classes: ['Kindergarten', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5'], subjects: ['English Language Arts', 'Mathematics', 'Science', 'Social Studies', 'Art', 'Music', 'Physical Education'] },
            middle: { name: 'Middle School (6-8)', classes: ['Grade 6', 'Grade 7', 'Grade 8'], subjects: ['English', 'Mathematics', 'Science', 'Social Studies', 'Spanish', 'French', 'Computer Science', 'Art', 'Music', 'Physical Education'] },
            high: { name: 'High School (9-12)', classes: ['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'], subjects: ['English', 'Mathematics', 'Biology', 'Chemistry', 'Physics', 'History', 'Government', 'Economics', 'Spanish', 'French', 'Computer Science', 'Business', 'Art', 'Music', 'Physical Education', 'Psychology', 'Sociology'] }
        }
    }
};

// ============ HELPER: Normalize level for grading ============
function normalizeLevel(level) {
    if (level === 'both') return 'secondary';
    return level;
}

// ============ GRADE CALCULATION ============
function parseGradeRange(entry) {
    if (!entry || typeof entry !== 'object') return null;
    let min = entry.min ?? entry.minScore ?? entry.from ?? entry.low ?? null;
    let max = entry.max ?? entry.maxScore ?? entry.to ?? entry.high ?? null;
    const rawRange = entry.range ?? entry.scoreRange ?? entry.marksRange ?? entry.bounds;
    if ((min === null || max === null) && Array.isArray(rawRange) && rawRange.length >= 2) {
        min = rawRange[0]; max = rawRange[1];
    }
    if ((min === null || max === null) && typeof rawRange === 'string') {
        const m = rawRange.match(/(-?\d+(?:\.\d+)?)\s*(?:-|–|to)\s*(-?\d+(?:\.\d+)?)/i);
        if (m) { min = m[1]; max = m[2]; }
    }
    min = Number(min); max = Number(max);
    if (!Number.isFinite(min) || !Number.isFinite(max)) return null;
    if (min > max) [min, max] = [max, min];
    return { min, max };
}

function normalizeGradeLevelForScore(level, className) {
    const raw = String(level || className || '').toLowerCase();
    if (/pp\s*1|pp\s*2|play|pre.?primary|early|grade\s*[1-6]\b|grade_[1-6]\b|primary|standard\s*[1-8]/.test(raw)) return 'primary';
    if (/grade\s*[7-9]\b|grade_[7-9]\b|junior/.test(raw)) return 'primary'; // CBC/CBE junior uses competency levels unless school changes grading.
    if (/grade\s*1[0-2]\b|grade_1[0-2]\b|senior|secondary|form\s*[1-4]/.test(raw)) return 'secondary';
    if (raw === 'both' || raw === 'mixed' || raw === 'full') return 'primary';
    return raw || 'primary';
}

// ============ GRADE CALCULATION ============
function getGradeFromScore(score, curriculum, level, customScale) {
    const scoreNum = Number(score);
    if (!Number.isFinite(scoreNum)) return 'N/A';

    if (Array.isArray(customScale) && customScale.length > 0) {
        for (const entry of customScale) {
            const bounds = parseGradeRange(entry);
            if (!bounds) continue;
            if (scoreNum >= bounds.min && scoreNum <= bounds.max) return entry.grade || entry.label || entry.name || 'N/A';
        }
    }
    if (customScale && (customScale.passMark !== undefined || customScale.failMark !== undefined)) {
        if (customScale.passMark !== undefined && scoreNum >= Number(customScale.passMark)) return 'PASS';
        if (customScale.failMark !== undefined && scoreNum < Number(customScale.failMark)) return 'FAIL';
    }

    const cur = String(curriculum || window.schoolSettings?.curriculum || window.schoolSettings?.system || 'cbc').toLowerCase().replace(/[-_]/g,'');
    const normalizedLevel = normalizeGradeLevelForScore(level || window.schoolSettings?.schoolLevel, window.currentMarksClassName);

    if (cur.includes('844') || cur.includes('american') || cur.includes('british') || ((cur.includes('cbc') || cur.includes('cbe')) && normalizedLevel === 'secondary')) {
        if (scoreNum >= 80) return cur.includes('british') ? 'A*' : 'A';
        if (scoreNum >= 70) return 'B';
        if (scoreNum >= 60) return 'C';
        if (scoreNum >= 50) return 'D';
        return cur.includes('american') ? 'F' : 'E';
    }
    if (cur.includes('cbc') || cur.includes('cbe')) {
        if (scoreNum >= 80) return 'EE';
        if (scoreNum >= 50) return 'ME';
        if (scoreNum >= 20) return 'AE';
        return 'BE';
    }

    const curriculumData = CURRICULUMS[curriculum] || CURRICULUMS[String(curriculum || '').toLowerCase()];
    if (curriculumData?.grading) {
        const scale = curriculumData.grading[normalizedLevel] || curriculumData.grading.primary || curriculumData.grading.secondary || [];
        for (const entry of scale) {
            const bounds = parseGradeRange(entry);
            if (bounds && scoreNum >= bounds.min && scoreNum <= bounds.max) return entry.grade;
        }
    }
    return 'N/A';
}

function updateGradingSystem(curriculum) {
    window.currentCurriculum = curriculum;
    // Re-render any open modals or tables that use grading
    const activeModals = document.querySelectorAll('.modal:not(.hidden)');
    activeModals.forEach(modal => {
        const content = modal.querySelector('.modal-content');
        if (content && content.innerHTML.includes('grade')) {
            const studentId = modal.dataset.studentId;
            if (studentId && typeof loadStudentDetails === 'function') {
                loadStudentDetails(studentId);
            }
        }
    });
}

// ============ CLASS GENERATION FROM CURRICULUM ============
async function generateClassesFromCurriculum(returnOnly = false) {
    showLoading();
    try {
        const schoolResponse = await api.admin.getSchoolSettings();
        if (!schoolResponse || !schoolResponse.success) {
            showToast('Failed to load school settings', 'error');
            hideLoading();
            return returnOnly ? [] : undefined;
        }

        const schoolData = schoolResponse.data;
        const curriculum = schoolData.system || schoolData.curriculum || 'cbc';
        const schoolLevel = schoolData.settings?.schoolLevel || 'both';

        console.log('📚 REAL School Curriculum:', curriculum);
        console.log('🏫 REAL School Level:', schoolLevel);

        const streamCount = parseInt(prompt('Number of streams? (e.g., 1, 2, 3)', '1') || '1');
        if (isNaN(streamCount) || streamCount < 1) {
            showToast('Invalid stream count', 'error');
            hideLoading();
            return returnOnly ? [] : undefined;
        }

        let streamNames = [];
        if (streamCount > 1) {
            const input = prompt('Stream names (comma separated):\nExample: A, B, C', 'A, B, C');
            if (input) streamNames = input.split(',').map(s => s.trim());
            if (streamNames.length !== streamCount) {
                streamNames = Array.from({ length: streamCount }, (_, i) => String.fromCharCode(65 + i));
            }
        }

        let classesToCreate = [];

        // Use CURRICULUM_STRUCTURE for all curricula
        const structure = CURRICULUM_STRUCTURE[curriculum];
        if (structure) {
            // Determine which levels to include based on schoolLevel
            let levelsToInclude = [];
            if (schoolLevel === 'primary') {
                if (structure.levels.primary) levelsToInclude.push(structure.levels.primary);
                if (structure.levels.elementary) levelsToInclude.push(structure.levels.elementary);
                if (structure.levels.lower_primary) levelsToInclude.push(structure.levels.lower_primary);
                if (structure.levels.upper_primary) levelsToInclude.push(structure.levels.upper_primary);
            } else if (schoolLevel === 'secondary') {
                if (structure.levels.secondary) levelsToInclude.push(structure.levels.secondary);
                if (structure.levels.junior_secondary) levelsToInclude.push(structure.levels.junior_secondary);
                if (structure.levels.senior_secondary) levelsToInclude.push(structure.levels.senior_secondary);
                if (structure.levels.middle) levelsToInclude.push(structure.levels.middle);
                if (structure.levels.high) levelsToInclude.push(structure.levels.high);
                if (structure.levels.lower_secondary) levelsToInclude.push(structure.levels.lower_secondary);
                if (structure.levels.upper_secondary) levelsToInclude.push(structure.levels.upper_secondary);
            } else if (schoolLevel === 'both') {
                // Include all levels
                Object.values(structure.levels).forEach(level => levelsToInclude.push(level));
            }

            levelsToInclude.forEach(level => {
                if (level.classes && Array.isArray(level.classes)) {
                    level.classes.forEach(cls => {
                        for (let s = 0; s < streamCount; s++) {
                            const suffix = streamCount > 1 ? ` ${streamNames[s]}` : '';
                            classesToCreate.push({
                                name: `${cls}${suffix}`,
                                grade: cls
                            });
                        }
                    });
                }
            });
        }

        // Fallback for CBC specific if structure missing (keep original logic)
        if (classesToCreate.length === 0 && curriculum === 'cbc') {
            if (schoolLevel === 'primary') {
                const grades = ['PP1', 'PP2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9'];
                for (const grade of grades) {
                    for (let s = 0; s < streamCount; s++) {
                        const suffix = streamCount > 1 ? ` ${streamNames[s]}` : '';
                        classesToCreate.push({ name: `${grade}${suffix}`, grade: grade });
                    }
                }
            } else if (schoolLevel === 'secondary') {
                for (let g = 10; g <= 12; g++) {
                    for (let s = 0; s < streamCount; s++) {
                        const suffix = streamCount > 1 ? ` ${streamNames[s]}` : '';
                        classesToCreate.push({ name: `Grade ${g}${suffix}`, grade: `Grade ${g}` });
                    }
                }
            } else if (schoolLevel === 'both') {
                const allGrades = ['PP1', 'PP2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];
                for (const grade of allGrades) {
                    for (let s = 0; s < streamCount; s++) {
                        const suffix = streamCount > 1 ? ` ${streamNames[s]}` : '';
                        classesToCreate.push({ name: `${grade}${suffix}`, grade: grade });
                    }
                }
            }
        }

        if (classesToCreate.length === 0) {
            showToast('No classes to generate for this school type', 'info');
            hideLoading();
            return returnOnly ? [] : undefined;
        }

        if (returnOnly) {
            hideLoading();
            return classesToCreate;
        }

        const existingClasses = await loadAllClasses();
        const existingNames = new Set(existingClasses.map(c => c.name));
        const newClasses = classesToCreate.filter(c => !existingNames.has(c.name));

        if (newClasses.length === 0) {
            showToast('All classes already exist', 'info');
            hideLoading();
            return;
        }

        const confirmMessage = `Generate ${newClasses.length} new classes?\n\n📚 School: ${schoolData.name || 'Your School'}\n📖 Level: ${schoolLevel.toUpperCase()}\n📊 Streams: ${streamCount} (${streamNames.join(', ') || 'None'})\n\nProceed?`;
        if (!confirm(confirmMessage)) {
            hideLoading();
            return;
        }

        let created = 0;
        let failed = 0;

        for (const classData of newClasses) {
            try {
                // Validation
                if (!classData.name || !classData.grade) {
                    console.warn('Skipping invalid class:', classData);
                    failed++;
                    continue;
                }
                await api.admin.createClass({
                    name: classData.name,
                    grade: classData.grade,
                    stream: streamCount > 1 ? streamNames[classData.name.split(' ').pop()] || null : null,
                    academicYear: new Date().getFullYear().toString()
                });
                created++;
                console.log(`✅ Created: ${classData.name}`);
            } catch (error) {
                console.error(`❌ Failed: ${classData.name}`, error);
                failed++;
            }
        }

        hideLoading();

        if (created > 0) {
            showToast(`✅ Created ${created} classes${failed > 0 ? `, ${failed} failed` : ''}`, 'success');
            await showDashboardSection('classes');
            if (typeof updateAdminStats === 'function') await updateAdminStats();
        } else {
            showToast('Failed to create classes', 'error');
        }

    } catch (error) {
        console.error('Error:', error);
        showToast(error.message || 'Failed to generate classes', 'error');
        hideLoading();
        if (returnOnly) return [];
    }
}

function updateStreamNamesInputs() {
    const streamCount = parseInt(document.getElementById('stream-count')?.value || 1);
    const container = document.getElementById('stream-names-container');
    const inputsContainer = document.getElementById('stream-names-inputs');

    if (streamCount > 1) {
        container.classList.remove('hidden');
        inputsContainer.innerHTML = '';
        for (let i = 0; i < streamCount; i++) {
            const defaultName = String.fromCharCode(65 + i);
            inputsContainer.innerHTML += `
                <div class="flex gap-2">
                    <input type="text" class="stream-name w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" 
                           placeholder="Stream ${i+1} Name" value="${defaultName}">
                </div>
            `;
        }
    } else {
        container.classList.add('hidden');
    }
}

function saveStreamSettings() {
    const streamCount = parseInt(document.getElementById('stream-count')?.value || 1);
    const streamNames = [];
    if (streamCount > 1) {
        const nameInputs = document.querySelectorAll('.stream-name');
        nameInputs.forEach(input => {
            if (input.value.trim()) {
                streamNames.push(input.value.trim());
            }
        });
    }
    const streamSettings = { count: streamCount, names: streamNames };
    const school = getCurrentSchool();
    if (school) {
        school.streams = streamSettings;
        if(typeof safeSessionSet==='function')safeSessionSet('school',JSON.stringify(typeof minimalSchoolForStorage==='function'?minimalSchoolForStorage(school,typeof getCurrentUser==='function'?getCurrentUser():null):school));
    }
    if (!window.schoolSettings) window.schoolSettings = {};
    window.schoolSettings.streams = streamSettings;
    showToast('Stream settings saved', 'success');
}

async function autoGenerateClassesOnCurriculumChange() {
    showLoading();
    try {
        if (!window.api?.admin?.previewClassGeneration || !window.api?.admin?.generateClassesFromSettings) {
            throw new Error('Safe class generation is unavailable in this build.');
        }
        const previewRes = await window.api.admin.previewClassGeneration();
        const preview = previewRes?.data || {};
        const toCreate = Array.isArray(preview.toCreate) ? preview.toCreate : [];
        const skipped = Array.isArray(preview.skippedExisting) ? preview.skippedExisting : [];
        if (!toCreate.length) {
            showToast(`No missing classes. ${skipped.length} existing class(es) were preserved.`, 'info');
            return;
        }
        const visible = toCreate.slice(0, 40).map(item => `• ${item.name}`).join('\n');
        const more = toCreate.length > 40 ? `\n• …and ${toCreate.length - 40} more` : '';
        const confirmed = confirm(
            `Review class generation\n\nClasses to add (${toCreate.length}):\n${visible}${more}\n\n` +
            `Existing classes skipped safely: ${skipped.length}\n\n` +
            `No existing class, student, teacher assignment or history will be changed. Create these missing classes now?`
        );
        if (!confirmed) {
            showToast('Class generation cancelled. Settings were saved and existing classes were untouched.', 'info');
            return;
        }
        const result = await window.api.admin.generateClassesFromSettings(preview.previewToken);
        showToast(result?.message || `${result?.data?.createdCount || 0} missing class(es) created safely.`, 'success');
        if (typeof loadClasses === 'function') await loadClasses().catch(() => null);
        if (typeof renderClassManagement === 'function' && document.getElementById('dashboard-content')) {
            document.getElementById('dashboard-content').innerHTML = await renderClassManagement();
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }
    } catch (error) {
        console.error('Safe class generation error:', error);
        showToast(error.message || 'Failed to generate classes from the saved school setup', 'error');
    } finally {
        hideLoading();
    }
}

// Override handleCurriculumChange to broadcast to all users
async function handleCurriculumChange(newCurriculum) {
    if (!newCurriculum) return;

    showLoading();
    try {
        const school = getCurrentSchool();
        if (!school) {
            showToast('School not found', 'error');
            return;
        }

        const response = await api.admin.updateSchoolSettings({
            ...school.settings,
            curriculum: newCurriculum
        });

        if (response.success) {
            window.schoolSettings.curriculum = newCurriculum;

            if (typeof emitCurriculumUpdate === 'function') {
                emitCurriculumUpdate(newCurriculum);
            }

            updateGradingSystem(newCurriculum);

            const user = getCurrentUser();
            const role = user?.role;
            const updateTimestamp = new Date().toISOString();
            localStorage.setItem('curriculumUpdateTimestamp', updateTimestamp);

            // Use event-based updates instead of full refreshes
            window.dispatchEvent(new CustomEvent('curriculumChanged', {
                detail: { curriculum: newCurriculum }
            }));

            // Minimal refresh for current user's dashboard
            if (role === 'teacher') {
                if (typeof refreshMyStudents === 'function') await refreshMyStudents();
            } else if (role === 'admin') {
                if (typeof refreshStudentsList === 'function') await refreshStudentsList();
                if (typeof refreshTeachersList === 'function') await refreshTeachersList();
                if (typeof refreshClassesList === 'function') await refreshClassesList();
                if (typeof updateAdminStats === 'function') await updateAdminStats();
            } else if (role === 'parent' && typeof refreshParentDashboard === 'function') {
                await refreshParentDashboard();
            } else if (role === 'student' && typeof refreshStudentDashboard === 'function') {
                await refreshStudentDashboard();
            }

            const curriculumName = CURRICULUMS[newCurriculum]?.name || newCurriculum;
            showToast(`✅ Curriculum changed to ${curriculumName}. All users will see updated grading.`, 'success');
            document.cookie = `schoolCurriculum=${newCurriculum}; path=/; max-age=${30*24*60*60}`;
        }
    } catch (error) {
        console.error('Curriculum change error:', error);
        showToast('Failed to update curriculum', 'error');
    } finally {
        hideLoading();
    }
}

// Expose globally
window.CURRICULUMS = CURRICULUMS;
window.CURRICULUM_STRUCTURE = CURRICULUM_STRUCTURE;
window.getGradeFromScore = getGradeFromScore;
window.updateGradingSystem = updateGradingSystem;
window.generateClassesFromCurriculum = generateClassesFromCurriculum;
window.updateStreamNamesInputs = updateStreamNamesInputs;
window.saveStreamSettings = saveStreamSettings;
window.autoGenerateClassesOnCurriculumChange = autoGenerateClassesOnCurriculumChange;
window.handleCurriculumChange = handleCurriculumChange;
