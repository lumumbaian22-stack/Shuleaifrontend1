function stripLargeMediaForStorage(obj){try{const clone=JSON.parse(JSON.stringify(obj||{}));if(clone.preferences){if(String(clone.preferences.signatureDataUrl||'').startsWith('data:'))clone.preferences.signatureDataUrl=null;if(String(clone.preferences.profileImageDataUrl||'').startsWith('data:'))clone.preferences.profileImageDataUrl=null;}if(String(clone.signature||'').startsWith('data:'))clone.signature=clone.preferences?.signatureFileUrl||clone.signatureUrl||'';if(String(clone.signatureUrl||'').startsWith('data:'))clone.signatureUrl=clone.preferences?.signatureFileUrl||clone.signature||'';return clone;}catch(_){return obj||{};}}
// auth-modal.js - Authentication modal handling

function openAuthModal(role, mode) {
    window.authModalRole = role;
    const modal = document.getElementById('auth-modal');
    const titleEl = document.getElementById('auth-modal-title');
    const contentEl = document.getElementById('auth-modal-content');

    if (!modal || !titleEl || !contentEl) return;

    const roleLabel = role === 'superadmin' ? 'Super Admin' : role === 'finance_officer' ? 'Finance Staff' : role.charAt(0).toUpperCase() + role.slice(1);
    titleEl.textContent = mode === 'signin' ? `Sign In as ${roleLabel}` : `Sign Up as ${roleLabel}`;
    contentEl.innerHTML = getAuthForm(role, mode);
    modal.classList.remove('hidden');
    if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
}


function showAuthInlineError(message) {
    const contentEl = document.getElementById('auth-modal-content');
    if (!contentEl) return;
    let box = document.getElementById('auth-inline-error');
    if (!box) {
        box = document.createElement('div');
        box.id = 'auth-inline-error';
        box.className = 'mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300';
        contentEl.prepend(box);
    }
    box.textContent = message || 'Something went wrong. Please try again.';
}
function clearAuthInlineError() {
    const box = document.getElementById('auth-inline-error');
    if (box) box.remove();
}
function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}

function getAuthForm(role, mode) {
    const logoHtml = `
        <div class="flex justify-center mb-6">
            <img src="assets/logo-light.png" alt="Logo" class="h-16 w-16 object-contain block dark:hidden">
            <img src="assets/logo-dark.png" alt="Logo" class="h-16 w-16 object-contain hidden dark:block">
        </div>
    `;

    if (role === 'superadmin') {
        return logoHtml + `
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium mb-1">Email</label>
                    <input type="email" id="auth-email" autocomplete="email" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" placeholder="super@shuleai.com">
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">Password</label>
                    <input type="password" id="auth-password" autocomplete="current-password" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">Secret Key</label>
                    <input type="password" id="auth-secret-key" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" placeholder="Enter super admin key">
                    <p class="text-xs text-muted-foreground mt-1">Contact system administrator for the key</p>
                </div>
            </div>
        `;
    }

    if (role === 'student' && mode === 'signin') {
        return logoHtml + `
            <div class="space-y-4">
                <div class="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300">
                    <strong>Student Login</strong><br>
                    Use your ELIMUID and password given by your school.
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">ELIMUID</label>
                    <input type="text" id="auth-elimuid" autocomplete="username" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" placeholder="e.g., ELI-2024-001">
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">Password</label>
                    <input type="password" id="auth-password" autocomplete="current-password" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" placeholder="Enter your password">
                </div>
                <p class="text-xs text-muted-foreground">First time? Use the default password issued by the school, then change it after logging in.</p>
            </div>
        `;
    }

    if (mode === 'signin') {
        return logoHtml + `
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium mb-1">Email</label>
                    <input type="email" id="auth-email" autocomplete="email" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">Password</label>
                    <input type="password" id="auth-password" autocomplete="current-password" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                </div>
            </div>
        `;
    } else {
        // Signup forms with Terms & Privacy checkboxes
        if (role === 'admin') {
            return logoHtml + `
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium mb-1">Full Name</label>
                        <input type="text" id="auth-name" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-1">Email</label>
                        <input type="email" id="auth-email" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-1">School Name</label>
                        <input type="text" id="auth-school-name" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2">School Type</label>
                        <div class="grid grid-cols-1 gap-2">
                            <label class="flex items-start gap-3 rounded-xl border p-3 cursor-pointer hover:bg-accent">
                                <input type="radio" name="auth-school-type" value="day" class="mt-1" checked>
                                <span><strong>Day School</strong><small class="block text-muted-foreground">Students attend during the day and return home.</small></span>
                            </label>
                            <label class="flex items-start gap-3 rounded-xl border p-3 cursor-pointer hover:bg-accent">
                                <input type="radio" name="auth-school-type" value="boarding" class="mt-1">
                                <span><strong>Boarding School</strong><small class="block text-muted-foreground">Students stay at school in dormitories.</small></span>
                            </label>
                            <label class="flex items-start gap-3 rounded-xl border p-3 cursor-pointer hover:bg-accent">
                                <input type="radio" name="auth-school-type" value="day_boarding" class="mt-1">
                                <span><strong>Day & Boarding</strong><small class="block text-muted-foreground">School supports both day and boarding students.</small></span>
                            </label>
                        </div>
                    </div>
                    <div class="rounded-xl border bg-muted/20 p-4 space-y-4">
                        <div class="grid gap-3 md:grid-cols-2">
                            <div>
                                <label class="block text-sm font-medium mb-1">Curriculum</label>
                                <select id="auth-curriculum" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                                    <option value="cbc">CBC / CBE</option>
                                    <option value="844">8-4-4 System</option>
                                    <option value="british">British / Cambridge</option>
                                    <option value="american">American</option>
                                    <option value="custom">Custom</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-medium mb-1">School Structure</label>
                                <select id="auth-school-level" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                                    <option value="primary_only">Primary only</option>
                                    <option value="junior_only">Junior only</option>
                                    <option value="senior_only">Senior secondary only</option>
                                    <option value="secondary_only">8-4-4 Secondary only</option>
                                    <option value="mixed" selected>Mixed / Full</option>
                                    <option value="custom">Custom selected levels</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <p class="text-sm font-semibold mb-2">Enabled CBC / CBE levels for class generation</p>
                            <div class="grid gap-2 md:grid-cols-2">
                                <label class="flex items-start gap-2 rounded-lg border bg-background p-3"><input type="checkbox" class="auth-level-group mt-1" value="early_learning" data-levels="playgroup,pp1,pp2" onchange="authApplyLevelGroup(this)" checked><span><b>Early Learning</b><small class="block text-muted-foreground">Playgroup, PP1–PP2</small></span></label>
                                <label class="flex items-start gap-2 rounded-lg border bg-background p-3"><input type="checkbox" class="auth-level-group mt-1" value="primary_learning" data-levels="grade_1,grade_2,grade_3,grade_4,grade_5,grade_6" onchange="authApplyLevelGroup(this)" checked><span><b>Primary Learning</b><small class="block text-muted-foreground">Grade 1–6</small></span></label>
                                <label class="flex items-start gap-2 rounded-lg border bg-background p-3"><input type="checkbox" class="auth-level-group mt-1" value="junior_school" data-levels="grade_7,grade_8,grade_9" onchange="authApplyLevelGroup(this)" checked><span><b>Junior School</b><small class="block text-muted-foreground">Grade 7–9</small></span></label>
                                <label class="flex items-start gap-2 rounded-lg border bg-background p-3"><input type="checkbox" class="auth-level-group mt-1" value="senior_secondary" data-levels="grade_10,grade_11,grade_12" onchange="authApplyLevelGroup(this)"><span><b>Senior Secondary</b><small class="block text-muted-foreground">Grade 10–12</small></span></label>
                            </div>
                        </div>
                        <details class="rounded-lg border bg-background p-3">
                            <summary class="cursor-pointer text-sm font-medium">Advanced individual levels</summary>
                            <div class="grid gap-2 md:grid-cols-3 mt-3 text-sm">
                                ${['playgroup:Playgroup:Pre-primary','pp1:PP1:Pre-primary','pp2:PP2:Pre-primary','grade_1:Grade 1:Lower Primary','grade_2:Grade 2:Lower Primary','grade_3:Grade 3:Lower Primary','grade_4:Grade 4:Upper Primary','grade_5:Grade 5:Upper Primary','grade_6:Grade 6:Upper Primary','grade_7:Grade 7:Junior School','grade_8:Grade 8:Junior School','grade_9:Grade 9:Junior School','grade_10:Grade 10:Senior School','grade_11:Grade 11:Senior School','grade_12:Grade 12:Senior School'].map(item => { const [code,label,group]=item.split(':'); const checked=!['grade_10','grade_11','grade_12'].includes(code); return `<label class="flex items-center gap-2 rounded border p-2"><input type="checkbox" class="auth-enabled-level" value="${code}" ${checked?'checked':''}><span>${label}<small class="block text-muted-foreground">${group}</small></span></label>`; }).join('')}
                            </div>
                        </details>
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-1">Phone</label>
                        <input type="tel" id="auth-phone" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-1">Password</label>
                        <input type="password" id="auth-password" autocomplete="current-password" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                    </div>
                    <div class="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                        <p class="text-xs text-blue-600 dark:text-blue-400">
                            <i data-lucide="info" class="h-3 w-3 inline mr-1"></i>
                            Your school will be pending approval. You'll receive a short code for teachers to use.
                        </p>
                    </div>
                    <div class="flex items-start gap-2 mt-4">
                        <input type="checkbox" id="auth-terms" class="mt-1 rounded" required>
                        <label for="auth-terms" class="text-xs text-muted-foreground">
                            I agree to the <a href="legal/terms.html" target="_blank" rel="noopener" onclick="return showTerms(event)" class="text-primary hover:underline">Terms of Service</a> and 
                            <a href="legal/privacy.html" target="_blank" rel="noopener" onclick="return showPrivacy(event)" class="text-primary hover:underline">Privacy Policy</a>.
                        </label>
                    </div>
                </div>
            `;
        } else if (role === 'teacher') {
            return logoHtml + `
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium mb-1">Full Name</label>
                        <input type="text" id="auth-name" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-1">Email</label>
                        <input type="email" id="auth-email" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                    </div>
                    <div class="flex gap-2">
                        <div class="flex-1">
                            <label class="block text-sm font-medium mb-1">School Code</label>
                            <input type="text" id="auth-school-code" placeholder="e.g., SHL-A7K29" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                        </div>
                        <div class="flex items-end">
                            <button type="button" onclick="verifySchoolCodeInput()" class="px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm mb-[1px]">Verify</button>
                        </div>
                    </div>
                    <div id="school-verify-status" class="text-xs hidden"></div>
                    <div>
                        <label class="block text-sm font-medium mb-1">Subjects (comma separated)</label>
                        <input type="text" id="auth-subjects" placeholder="Mathematics, Science, English" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-1">Qualification</label>
                        <input type="text" id="auth-qualification" placeholder="e.g., B.Ed Mathematics" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-1">Phone</label>
                        <input type="tel" id="auth-phone" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-1">Password</label>
                        <input type="password" id="auth-password" autocomplete="current-password" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                    </div>
                    <div class="flex items-start gap-2 mt-4">
                        <input type="checkbox" id="auth-terms" class="mt-1 rounded" required>
                        <label for="auth-terms" class="text-xs text-muted-foreground">
                            I agree to the <a href="legal/terms.html" target="_blank" rel="noopener" onclick="return showTerms(event)" class="text-primary hover:underline">Terms of Service</a> and 
                            <a href="legal/privacy.html" target="_blank" rel="noopener" onclick="return showPrivacy(event)" class="text-primary hover:underline">Privacy Policy</a>.
                        </label>
                    </div>
                </div>
            `;
        } else if (role === 'parent') {
            return logoHtml + `
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium mb-1">Full Name</label>
                        <input type="text" id="auth-name" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-1">Email</label>
                        <input type="email" id="auth-email" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-1">Student's ELIMUID</label>
                        <input type="text" id="auth-student-elimuid" placeholder="e.g., ELI-2024-001" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-1">Phone</label>
                        <input type="tel" id="auth-phone" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-1">Password</label>
                        <input type="password" id="auth-password" autocomplete="current-password" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                    </div>
                    <div class="flex items-start gap-2 mt-4">
                        <input type="checkbox" id="auth-terms" class="mt-1 rounded" required>
                        <label for="auth-terms" class="text-xs text-muted-foreground">
                            I agree to the <a href="legal/terms.html" target="_blank" rel="noopener" onclick="return showTerms(event)" class="text-primary hover:underline">Terms of Service</a> and 
                            <a href="legal/privacy.html" target="_blank" rel="noopener" onclick="return showPrivacy(event)" class="text-primary hover:underline">Privacy Policy</a>.
                        </label>
                    </div>
                </div>
            `;
        }
    }
    return '';
}

async function verifySchoolCodeInput() {
    const code = document.getElementById('auth-school-code')?.value;
    if (!code) {
        showToast('Please enter a school code', 'error');
        return;
    }

    showLoading();
    try {
        const response = await verifySchoolCode(code);
        const statusDiv = document.getElementById('school-verify-status');
        statusDiv.className = 'text-xs mt-1 p-2 bg-green-100 text-green-700 rounded-lg';
        statusDiv.innerHTML = `<i data-lucide="check-circle" class="h-3 w-3 inline mr-1"></i> Verified: ${response.data.schoolName}`;
        statusDiv.classList.remove('hidden');
        if (typeof lucide !== 'undefined') lucide.createIcons();
        showToast(`School found: ${response.data.schoolName}`, 'success');
    } catch (error) {
        const statusDiv = document.getElementById('school-verify-status');
        statusDiv.className = 'text-xs mt-1 p-2 bg-red-100 text-red-700 rounded-lg';
        statusDiv.innerHTML = `<i data-lucide="x-circle" class="h-3 w-3 inline mr-1"></i> ${error.message}`;
        statusDiv.classList.remove('hidden');
        if (typeof lucide !== 'undefined') lucide.createIcons();
        showToast(error.message || 'Invalid school code', 'error');
    } finally {
        hideLoading();
    }
}


async function safeAcceptAuthConsent() {
    try {
        const token = localStorage.getItem('authToken') || localStorage.getItem('token');
        if (!token || !window.api?.consent?.accept) return;
        await safeAcceptAuthConsent();
    } catch (error) {
        // Signup flows can complete before a login token exists, especially pending teacher approval.
        // Do not fail account/request creation just because consent recording needs auth.
        console.warn('Consent acceptance skipped until authenticated:', error.message);
    }
}

async function handleAuthSubmit() {
    const modalTitle = document.getElementById('auth-modal-title').textContent;
    const mode = modalTitle.includes('Sign In') ? 'signin' : 'signup';
    const role = window.authModalRole;

    showLoading();

    try {
        if (role === 'superadmin' && mode === 'signin') {
            const email = document.getElementById('auth-email')?.value;
            const password = document.getElementById('auth-password')?.value;
            const secretKey = document.getElementById('auth-secret-key')?.value;

            clearAuthInlineError();
            if (!email || !password || !secretKey) {
                showAuthInlineError('Email, password, and secret key are required.');
                showToast('All fields are required', 'error');
                hideLoading();
                return;
            }
            if (!isValidEmail(email)) {
                showAuthInlineError('Please enter a valid Super Admin email address.');
                showToast('Use a valid email address', 'error');
                hideLoading();
                return;
            }

            const response = await superAdminLogin(email.trim(), password, secretKey);
            showToast('Super Admin login successful', 'success');
            await showDashboard('superadmin');
            closeAuthModal();

        } else if (role === 'student' && mode === 'signin') {
            clearAuthInlineError();
            const elimuid = document.getElementById('auth-elimuid')?.value?.trim();
            const password = document.getElementById('auth-password')?.value;

            if (!elimuid || !password) {
                showAuthInlineError('ELIMUID and password are required.');
                showToast('ELIMUID and password required', 'error');
                hideLoading();
                return;
            }

            const response = typeof studentLogin === 'function'
                ? await studentLogin(elimuid, password)
                : await api.auth.studentLogin(elimuid, password);

            showToast('Login successful', 'success');
            await showDashboard('student');
            closeAuthModal();

        } else if (mode === 'signin') {
            clearAuthInlineError();
            const email = document.getElementById('auth-email')?.value?.trim();
            const password = document.getElementById('auth-password')?.value;

            if (!email || !password) {
                showAuthInlineError('Email and password are required.');
                showToast('Email and password required', 'error');
                hideLoading();
                return;
            }

            if (!isValidEmail(email)) {
                showAuthInlineError('Please enter a valid email address. Phone login is not accepted by the current backend validation.');
                showToast('Use a valid email address', 'error');
                hideLoading();
                return;
            }

            const response = await login(email, password, role);
            showToast('Login successful', 'success');
            await showDashboard(role);
            closeAuthModal();

        } else {
            // Signup flows
            const termsChecked = document.getElementById('auth-terms')?.checked;
            if (!termsChecked) {
                showToast('You must accept the Terms of Service and Privacy Policy', 'error');
                hideLoading();
                return;
            }

            if (role === 'admin') {
                const adminData = {
                    name: document.getElementById('auth-name')?.value,
                    email: document.getElementById('auth-email')?.value,
                    password: document.getElementById('auth-password')?.value,
                    phone: document.getElementById('auth-phone')?.value,
                    schoolName: document.getElementById('auth-school-name')?.value,
                    schoolLevel: document.getElementById('auth-school-level')?.value,
                    structureType: document.getElementById('auth-school-level')?.value,
                    schoolStructure: document.getElementById('auth-school-level')?.value,
                    curriculum: document.getElementById('auth-curriculum')?.value,
                    enabledLevels: getAuthEnabledLevels(),
                    enabledLevelGroups: getAuthEnabledLevelGroups(),
                    schoolType: document.querySelector('input[name="auth-school-type"]:checked')?.value || 'day',
                    termsAccepted: true,
                    privacyAccepted: true
                };

                if (!adminData.name || !adminData.email || !adminData.password || !adminData.schoolName) {
                    showToast('Please fill all required fields', 'error');
                    hideLoading();
                    return;
                }

                const response = await adminSignup(adminData);
                // Record consent
                await safeAcceptAuthConsent();
                showToast(response.message, 'success');

                if (response.data) {
                    showToast(`Your school code: ${response.data.shortCode}`, 'info', 10000);
                }

                closeAuthModal();

            } else if (role === 'teacher') {
                const schoolCode = document.getElementById('auth-school-code')?.value;
                if (!schoolCode) {
                    showToast('School code is required', 'error');
                    hideLoading();
                    return;
                }

                const subjects = document.getElementById('auth-subjects')?.value;
                const teacherData = {
                    name: document.getElementById('auth-name')?.value,
                    email: document.getElementById('auth-email')?.value,
                    password: document.getElementById('auth-password')?.value,
                    phone: document.getElementById('auth-phone')?.value,
                    schoolCode: schoolCode,
                    subjects: subjects ? subjects.split(',').map(s => s.trim()) : [],
                    qualification: document.getElementById('auth-qualification')?.value,
                    termsAccepted: true,
                    privacyAccepted: true
                };

                console.log('📤 Teacher signup payload:', teacherData);

                if (!teacherData.name || !teacherData.email || !teacherData.password) {
                    showToast('Please fill all required fields', 'error');
                    hideLoading();
                    return;
                }

                const response = await teacherSignup(teacherData);
                await safeAcceptAuthConsent();
                showToast(response.message, 'success');
                closeAuthModal();

            } else if (role === 'parent') {
                const parentData = {
                    name: document.getElementById('auth-name')?.value,
                    email: document.getElementById('auth-email')?.value,
                    password: document.getElementById('auth-password')?.value,
                    phone: document.getElementById('auth-phone')?.value,
                    studentElimuid: document.getElementById('auth-student-elimuid')?.value,
                    termsAccepted: true,
                    privacyAccepted: true
                };

                if (!parentData.name || !parentData.email || !parentData.password || !parentData.studentElimuid) {
                    showToast('Please fill all required fields', 'error');
                    hideLoading();
                    return;
                }

                const response = await parentSignup(parentData);
                await safeAcceptAuthConsent();
                showToast(response.message, 'success');
                closeAuthModal();
            }
        }
    } catch (error) {
        console.error('Auth error:', error);
        const message = error.message || 'Authentication failed';
        showAuthInlineError(message);
        showToast(message, 'error');
    } finally {
        hideLoading();
    }
}

function closeAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) modal.classList.add('hidden');
}

function openStudentLoginModal() {
    window.authModalRole = 'student';
    const modal = document.getElementById('auth-modal');
    const titleEl = document.getElementById('auth-modal-title');
    const contentEl = document.getElementById('auth-modal-content');

    if (!modal || !titleEl || !contentEl) return;

    titleEl.textContent = 'Student Login';
    contentEl.innerHTML = `
        <div class="flex justify-center mb-6">
            <img src="assets/logo-light.png" alt="Logo" class="h-16 w-16 object-contain block dark:hidden">
            <img src="assets/logo-dark.png" alt="Logo" class="h-16 w-16 object-contain hidden dark:block">
        </div>
        <div class="space-y-4">
            <div class="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg mb-4">
                <p class="text-xs text-blue-600 dark:text-blue-400 flex items-start gap-2">
                    <i data-lucide="info" class="h-4 w-4 flex-shrink-0 mt-0.5"></i>
                    <span>Welcome! Use your ELIMUID and the temporary password issued by your school. You will be asked to change it on first login.</span>
                </p>
            </div>
            <div>
                <label class="block text-sm font-medium mb-1">ELIMUID</label>
                <input type="text" id="auth-elimuid" placeholder="e.g., ELI-2024-001" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" required>
            </div>
            <div>
                <label class="block text-sm font-medium mb-1">Password</label>
                <input type="password" id="auth-password" autocomplete="current-password" placeholder="Enter your password" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" required>
            </div>
            <div class="flex justify-end gap-2 mt-6">
                <button onclick="closeAuthModal()" class="px-4 py-2 text-sm border rounded-lg hover:bg-accent">Cancel</button>
                <button onclick="handleStudentLogin()" class="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">Login</button>
            </div>
            <div class="text-center mt-4 pt-4 border-t">
                <p class="text-xs text-muted-foreground">
                    First time? Use the temporary password issued by your school.<br>
                    You'll be asked to change it after logging in.
                </p>
            </div>
        </div>
    `;
    modal.classList.remove('hidden');
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

async function handleStudentLogin() {
    const elimuid = document.getElementById('auth-elimuid')?.value;
    const password = document.getElementById('auth-password')?.value;

    if (!elimuid || !password) {
        showToast('ELIMUID and password required', 'error');
        return;
    }

    showLoading();
    try {
        const response = await api.auth.studentLogin(elimuid, password);

        if (response.success) {
            authToken = response.data.token;        // Update global authToken
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('user', JSON.stringify(stripLargeMediaForStorage(response.data.user)));
            localStorage.setItem('student', JSON.stringify(response.data.student));
            localStorage.setItem('userRole', 'student');

            if (response.data.user.firstLogin) {
                closeAuthModal();
                showFirstTimePasswordModal(elimuid);
            } else {
                showToast('Login successful!', 'success');
                await showDashboard('student');
                closeAuthModal();
            }
        }
    } catch (error) {
        showToast(error.message || 'Invalid ELIMUID or password', 'error');
    } finally {
        hideLoading();
    }
}

function showFirstTimePasswordModal(elimuid) {
    const modal = document.getElementById('auth-modal');
    const titleEl = document.getElementById('auth-modal-title');
    const contentEl = document.getElementById('auth-modal-content');

    if (!modal || !titleEl || !contentEl) return;

    titleEl.textContent = 'Set Your Password';
    contentEl.innerHTML = `
        <div class="flex justify-center mb-6">
            <img src="assets/logo-light.png" alt="Logo" class="h-16 w-16 object-contain block dark:hidden">
            <img src="assets/logo-dark.png" alt="Logo" class="h-16 w-16 object-contain hidden dark:block">
        </div>
        <div class="space-y-4">
            <div class="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                <p class="text-sm text-yellow-800 dark:text-yellow-200 flex items-start gap-2">
                    <i data-lucide="alert-circle" class="h-5 w-5 flex-shrink-0"></i>
                    <span>This is your first login. Please set a new password to continue.</span>
                </p>
            </div>
            <div>
                <label class="block text-sm font-medium mb-1">New Password</label>
                <input type="password" id="new-password" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" placeholder="Enter new password" required>
                <p class="text-xs text-muted-foreground mt-1">Minimum 8 characters</p>
            </div>
            <div>
                <label class="block text-sm font-medium mb-1">Confirm New Password</label>
                <input type="password" id="confirm-password" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" placeholder="Confirm new password" required>
            </div>
            <div class="flex justify-end gap-2 mt-6">
                <button onclick="closeAuthModal()" class="px-4 py-2 text-sm border rounded-lg hover:bg-accent">Cancel</button>
                <button onclick="handleFirstPasswordChange('${elimuid}')" class="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
                    Set Password
                </button>
            </div>
        </div>
    `;
    modal.classList.remove('hidden');
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

async function handleFirstPasswordChange(elimuid) {
    const newPassword = document.getElementById('new-password')?.value;
    const confirmPassword = document.getElementById('confirm-password')?.value;

    if (!newPassword || !confirmPassword) {
        showToast('Please enter and confirm your new password', 'error');
        return;
    }
    if (newPassword !== confirmPassword) {
        showToast('Passwords do not match', 'error');
        return;
    }
    if (newPassword.length < 8) {
        showToast('Password must be at least 8 characters', 'error');
        return;
    }

    showLoading();
    try {
        const response = await api.student.setFirstPassword({
            elimuid: elimuid,
            newPassword: newPassword
        });

        if (response.success) {
            showToast('Password set successfully! Please login with your new password.', 'success');
            openStudentLoginModal();
        }
    } catch (error) {
        showToast(error.message || 'Failed to set password', 'error');
    } finally {
        hideLoading();
    }
}

function showStudentHelp() {
    showToast('Contact your teacher to reset your password or get your ELIMUID', 'info', 5000);
}

function openLegalDocument(path, event) {
    if (event && typeof event.preventDefault === 'function') event.preventDefault();
    const normalizedPath = String(path || '').replace(/^\/+/, '');
    const url = normalizedPath.startsWith('legal/') ? normalizedPath : `legal/${normalizedPath}`;
    try {
        const opened = window.open(url, '_blank', 'noopener,noreferrer');
        if (!opened) window.location.href = url;
    } catch (error) {
        window.location.href = url;
    }
    return false;
}

function showTerms(event) {
    return openLegalDocument('legal/terms.html', event);
}

function showPrivacy(event) {
    return openLegalDocument('legal/privacy.html', event);
}

function showDPA(event) {
    return openLegalDocument('legal/dpa.html', event);
}

window.openAuthModal = openAuthModal;
window.closeAuthModal = closeAuthModal;
window.handleAuthSubmit = handleAuthSubmit;
window.verifySchoolCodeInput = verifySchoolCodeInput;
window.openStudentLoginModal = openStudentLoginModal;
window.handleStudentLogin = handleStudentLogin;
window.showFirstTimePasswordModal = showFirstTimePasswordModal;
window.handleFirstPasswordChange = handleFirstPasswordChange;
window.showStudentHelp = showStudentHelp;
window.showTerms = showTerms;
window.showPrivacy = showPrivacy;
window.showDPA = showDPA;
window.openLegalDocument = openLegalDocument;

// Keep grouped curriculum checkboxes and individual levels in sync.
window.authApplyLevelGroup = function(groupCheckbox) {
  const levels = String(groupCheckbox?.dataset?.levels || '').split(',').map(x => x.trim()).filter(Boolean);
  document.querySelectorAll('.auth-enabled-level').forEach(box => {
    if (levels.includes(box.value)) box.checked = !!groupCheckbox.checked;
  });
  const select = document.getElementById('auth-school-level');
  const groups = [...document.querySelectorAll('.auth-level-group:checked')].map(x => x.value);
  if (select) {
    if (groups.length === 1 && groups[0] === 'primary_learning') select.value = 'primary_only';
    else if (groups.length === 1 && groups[0] === 'junior_school') select.value = 'junior_only';
    else if (groups.length === 1 && groups[0] === 'senior_secondary') select.value = 'senior_only';
    else select.value = groups.length ? 'mixed' : 'custom';
  }
};
