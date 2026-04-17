// auth-modal.js - Authentication modal handling

function openAuthModal(role, mode) {
    window.authModalRole = role;
    const modal = document.getElementById('auth-modal');
    const titleEl = document.getElementById('auth-modal-title');
    const contentEl = document.getElementById('auth-modal-content');

    if (!modal || !titleEl || !contentEl) return;

    titleEl.textContent = mode === 'signin' ? `Sign In as ${role}` : `Sign Up as ${role}`;
    contentEl.innerHTML = getAuthForm(role, mode);
    modal.classList.remove('hidden');
    if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
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
                    <input type="email" id="auth-email" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" placeholder="super@shuleai.com">
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">Password</label>
                    <input type="password" id="auth-password" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">Secret Key</label>
                    <input type="password" id="auth-secret-key" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" placeholder="Enter super admin key">
                    <p class="text-xs text-muted-foreground mt-1">Contact system administrator for the key</p>
                </div>
            </div>
        `;
    }

    if (mode === 'signin') {
        return logoHtml + `
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium mb-1">Email</label>
                    <input type="email" id="auth-email" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">Password</label>
                    <input type="password" id="auth-password" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
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
                        <label class="block text-sm font-medium mb-1">School Level</label>
                        <select id="auth-school-level" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                            <option value="primary">Primary</option>
                            <option value="secondary">Secondary</option>
                            <option value="both">Both Primary & Secondary</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-1">Curriculum</label>
                        <select id="auth-curriculum" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                            <option value="cbc">CBC (Competency Based Curriculum)</option>
                            <option value="844">8-4-4 System</option>
                            <option value="british">British Curriculum</option>
                            <option value="american">American Curriculum</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-1">Phone</label>
                        <input type="tel" id="auth-phone" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-1">Password</label>
                        <input type="password" id="auth-password" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
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
                            I agree to the <a href="#" onclick="showTerms()" class="text-primary hover:underline">Terms of Service</a> and 
                            <a href="#" onclick="showPrivacy()" class="text-primary hover:underline">Privacy Policy</a>.
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
                        <input type="password" id="auth-password" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                    </div>
                    <div class="flex items-start gap-2 mt-4">
                        <input type="checkbox" id="auth-terms" class="mt-1 rounded" required>
                        <label for="auth-terms" class="text-xs text-muted-foreground">
                            I agree to the <a href="#" onclick="showTerms()" class="text-primary hover:underline">Terms of Service</a> and 
                            <a href="#" onclick="showPrivacy()" class="text-primary hover:underline">Privacy Policy</a>.
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
                        <input type="password" id="auth-password" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                    </div>
                    <div class="flex items-start gap-2 mt-4">
                        <input type="checkbox" id="auth-terms" class="mt-1 rounded" required>
                        <label for="auth-terms" class="text-xs text-muted-foreground">
                            I agree to the <a href="#" onclick="showTerms()" class="text-primary hover:underline">Terms of Service</a> and 
                            <a href="#" onclick="showPrivacy()" class="text-primary hover:underline">Privacy Policy</a>.
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

            if (!email || !password || !secretKey) {
                showToast('All fields are required', 'error');
                hideLoading();
                return;
            }

            const response = await superAdminLogin(email, password, secretKey);
            showToast('Super Admin login successful', 'success');
            await showDashboard('superadmin');
            closeAuthModal();

        } else if (role === 'student' && mode === 'signin') {
            const elimuid = document.getElementById('auth-elimuid')?.value;
            const password = document.getElementById('auth-password')?.value;

            if (!elimuid || !password) {
                showToast('ELIMUID and password required', 'error');
                hideLoading();
                return;
            }

            const response = await studentLogin(elimuid, password);
            showToast('Login successful', 'success');
            await showDashboard('student');
            closeAuthModal();

        } else if (mode === 'signin') {
            const email = document.getElementById('auth-email')?.value;
            const password = document.getElementById('auth-password')?.value;

            if (!email || !password) {
                showToast('Email and password required', 'error');
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
                    curriculum: document.getElementById('auth-curriculum')?.value
                };

                if (!adminData.name || !adminData.email || !adminData.password || !adminData.schoolName) {
                    showToast('Please fill all required fields', 'error');
                    hideLoading();
                    return;
                }

                const response = await adminSignup(adminData);
                // Record consent
                await api.consent.accept(true, true);
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
                    qualification: document.getElementById('auth-qualification')?.value
                };

                console.log('📤 Teacher signup payload:', teacherData);

                if (!teacherData.name || !teacherData.email || !teacherData.password) {
                    showToast('Please fill all required fields', 'error');
                    hideLoading();
                    return;
                }

                const response = await teacherSignup(teacherData);
                await api.consent.accept(true, true);
                showToast(response.message, 'success');
                closeAuthModal();

            } else if (role === 'parent') {
                const parentData = {
                    name: document.getElementById('auth-name')?.value,
                    email: document.getElementById('auth-email')?.value,
                    password: document.getElementById('auth-password')?.value,
                    phone: document.getElementById('auth-phone')?.value,
                    studentElimuid: document.getElementById('auth-student-elimuid')?.value
                };

                if (!parentData.name || !parentData.email || !parentData.password || !parentData.studentElimuid) {
                    showToast('Please fill all required fields', 'error');
                    hideLoading();
                    return;
                }

                const response = await parentSignup(parentData);
                await api.consent.accept(true, true);
                showToast(response.message, 'success');
                closeAuthModal();
            }
        }
    } catch (error) {
        console.error('Auth error:', error);
        showToast(error.message || 'Authentication failed', 'error');
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
                    <span>Welcome! Use your ELIMUID and the default password: <strong>Student123!</strong></span>
                </p>
            </div>
            <div>
                <label class="block text-sm font-medium mb-1">ELIMUID</label>
                <input type="text" id="auth-elimuid" placeholder="e.g., ELI-2024-001" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" required>
            </div>
            <div>
                <label class="block text-sm font-medium mb-1">Password</label>
                <input type="password" id="auth-password" placeholder="Enter your password" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" required>
            </div>
            <div class="flex justify-end gap-2 mt-6">
                <button onclick="closeAuthModal()" class="px-4 py-2 text-sm border rounded-lg hover:bg-accent">Cancel</button>
                <button onclick="handleStudentLogin()" class="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">Login</button>
            </div>
            <div class="text-center mt-4 pt-4 border-t">
                <p class="text-xs text-muted-foreground">
                    First time? Use default password: <strong>Student123!</strong><br>
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
            localStorage.setItem('user', JSON.stringify(response.data.user));
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

// Terms and Privacy placeholders (you can implement actual modals later)
function showTerms() {
    alert('Terms of Service: By using ShuleAI, you agree to our terms...');
}

function showPrivacy() {
    alert('Privacy Policy: We protect your data...');
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
