// profile.js - Profile section with profile picture and signature upload

async function renderProfileSection() {
    const user = getCurrentUser();
    const school = getCurrentSchool();

    const stats = await loadUserStats(user.role);
    const roleLabel = user.role === 'finance_officer' ? 'Finance Officer / Bursar' : String(user.role || 'User').replace(/_/g, ' ');
    const identityValue = user.role === 'student'
        ? (user.elimuid || user.student?.elimuid || '')
        : (user.email || user.phone || '');
    const identityLine = [roleLabel, identityValue].filter(value => String(value || '').trim()).map(escapeHtml).join(' • ');

    // Profile picture preview URL
    const profileImageRaw = user.preferences?.profileImageDataUrl || user.profileImage || user.profilePicture || '';
    const profileImageUrl = profileImageRaw ? resolveMediaUrl(profileImageRaw) : '';

    return `
        <div class="space-y-6 animate-fade-in max-w-4xl mx-auto">
            <!-- Profile Header with Picture Upload -->
            <div class="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#083A85] via-[#0B2F6B] to-[#11B5B1] p-8 text-white">
                <div class="absolute right-0 top-0 -mt-10 -mr-10 h-40 w-40 rounded-full bg-white/10"></div>
                <div class="absolute bottom-0 left-0 -mb-10 -ml-10 h-40 w-40 rounded-full bg-black/10"></div>
                <div class="relative z-10 flex items-center gap-6">
                    <!-- Profile Picture with Upload -->
                    <div class="relative">
                        <div class="h-24 w-24 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-4xl font-bold border-4 border-white shadow-xl overflow-hidden">
                            ${profileImageUrl ? `<img id="profile-preview" src="${escapeHtml(profileImageUrl)}" alt="Profile" class="h-full w-full object-cover" data-current-user-avatar>` : `<span>${escapeHtml(getInitials(user.name))}</span>`}
                        </div>
                        <label class="absolute bottom-0 right-0 bg-primary text-white rounded-full p-1 cursor-pointer hover:bg-primary/90 transition-colors">
                            <i data-lucide="camera" class="h-4 w-4"></i>
                            <input type="file" id="profile-picture-input" accept="image/*" class="hidden" onchange="uploadProfilePicture(this.files[0])">
                        </label>
                    </div>
                    <div>
                        <h2 class="text-3xl font-bold">${escapeHtml(user.name || 'User')}</h2>
                        <p class="text-white/80 capitalize">${identityLine}</p>
                        <div class="flex gap-2 mt-2">
                            <span class="px-2 py-1 bg-white/20 rounded-full text-xs">ID: ${escapeHtml(user.role === 'student' ? (user.elimuid || user.student?.elimuid || user.studentId || user.id) : user.id)}</span>
                            ${school?.shortCode ? `<span class="px-2 py-1 bg-white/20 rounded-full text-xs">School: ${escapeHtml(school.shortCode)}</span>` : ''}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Stats Cards -->
            <div class="grid gap-4 md:grid-cols-3">
                <div class="rounded-xl border bg-card p-4">
                    <p class="text-sm text-muted-foreground">Member Since</p>
                    <p class="text-lg font-semibold">${formatDate(user.createdAt)}</p>
                </div>
                <div class="rounded-xl border bg-card p-4">
                    <p class="text-sm text-muted-foreground">Last Login</p>
                    <p class="text-lg font-semibold">${user.lastLogin ? timeAgo(user.lastLogin) : 'N/A'}</p>
                </div>
                <div class="rounded-xl border bg-card p-4">
                    <p class="text-sm text-muted-foreground">Account Status</p>
                    <p class="text-lg font-semibold text-green-600">${user.isActive ? 'Active' : 'Inactive'}</p>
                </div>
            </div>

            <!-- Profile Information Form -->
            <div class="rounded-xl border bg-card p-6">
                <h3 class="font-semibold text-lg mb-4">Profile Information</h3>
                <form id="profile-form" class="space-y-4" onsubmit="updateProfile(event)">
                    <div class="grid gap-4 md:grid-cols-2">
                        <div>
                            <label class="block text-sm font-medium mb-1">Full Name</label>
                            <input type="text" name="name" value="${escapeHtml(user.name || '')}"
                                   class="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm focus:ring-2 focus:ring-primary transition-all">
                        </div>
                        <div>
                            <label class="block text-sm font-medium mb-1">Email</label>
                            <input type="email" name="email" value="${escapeHtml(user.email || '')}"
                                   class="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm focus:ring-2 focus:ring-primary transition-all">
                        </div>
                    </div>
                    <div class="grid gap-4 md:grid-cols-2">
                        <div>
                            <label class="block text-sm font-medium mb-1">Phone</label>
                            <input type="tel" name="phone" value="${escapeHtml(user.phone || '')}"
                                   class="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm focus:ring-2 focus:ring-primary transition-all">
                        </div>
                        <div>
                            <label class="block text-sm font-medium mb-1">Role</label>
                            <input type="text" value="${escapeHtml(roleLabel)}" disabled
                                   class="w-full rounded-lg border border-input bg-muted px-4 py-2 text-sm text-muted-foreground">
                        </div>
                    </div>
                    <div class="flex justify-end">
                        <button type="submit" class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                            Update Profile
                        </button>
                    </div>
                </form>
            </div>

            <!-- Change Password -->
            <div class="rounded-xl border bg-card p-6">
                <h3 class="font-semibold text-lg mb-4">Change Password</h3>
                <form id="password-form" class="space-y-4" onsubmit="updatePassword(event)">
                    <div>
                        <label class="block text-sm font-medium mb-1">Current Password</label>
                        <input type="password" id="current-password" required
                               class="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm focus:ring-2 focus:ring-primary transition-all">
                    </div>
                    <div class="grid gap-4 md:grid-cols-2">
                        <div>
                            <label class="block text-sm font-medium mb-1">New Password</label>
                            <input type="password" id="new-password" required minlength="8"
                                   class="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm focus:ring-2 focus:ring-primary transition-all">
                        </div>
                        <div>
                            <label class="block text-sm font-medium mb-1">Confirm New Password</label>
                            <input type="password" id="confirm-password" required
                                   class="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm focus:ring-2 focus:ring-primary transition-all">
                        </div>
                    </div>
                    <div class="flex justify-end">
                        <button type="submit" class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                            Update Password
                        </button>
                    </div>
                </form>
            </div>

            <!-- Signature Upload -->
            ${(user.role === 'teacher' || user.role === 'admin') ? `
            <div class="mt-4">
                <label class="block text-sm font-medium mb-1">Signature</label>
                <div class="flex items-center gap-4">
                    <img id="signature-preview" src="${escapeHtml(v116ResolveUploadedMediaUrl(user.preferences?.signatureDataUrl || user.signature || user.signatureUrl || user.preferences?.signatureUrl || ''))}" class="h-16 border rounded" onerror="this.removeAttribute('src')">
                    <label class="px-4 py-2 bg-primary text-white rounded-lg cursor-pointer">
                        Upload Signature
                        <input type="file" id="signature-upload" accept="image/*" class="hidden" onchange="uploadSignature(this.files[0])">
                    </label>
                </div>
                <p class="text-xs text-muted-foreground mt-2">Your signature will appear on report cards and official documents.</p>
            ` : ''}
            </div>

            <!-- Preferences -->
            <div class="rounded-xl border bg-card p-6">
                <h3 class="font-semibold text-lg mb-4">Preferences</h3>
                <div class="space-y-4">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="font-medium">Email Notifications</p>
                            <p class="text-sm text-muted-foreground">Receive email updates about important events</p>
                        </div>
                        <button onclick="togglePreference('email')" id="pref-email" 
                                class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${user.preferences?.email !== false ? 'bg-primary' : 'bg-muted'}">
                            <span class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${user.preferences?.email !== false ? 'translate-x-6' : 'translate-x-1'}"></span>
                        </button>
                    </div>
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="font-medium">Push Notifications</p>
                            <p class="text-sm text-muted-foreground">Show desktop notifications</p>
                        </div>
                        <button onclick="togglePreference('push')" id="pref-push" 
                                class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${user.preferences?.push !== false ? 'bg-primary' : 'bg-muted'}">
                            <span class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${user.preferences?.push !== false ? 'translate-x-6' : 'translate-x-1'}"></span>
                        </button>
                    </div>
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="font-medium">Dark Mode</p>
                            <p class="text-sm text-muted-foreground">Use dark theme</p>
                        </div>
                        <button onclick="togglePreference('darkMode')" id="pref-darkmode" 
                                class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${document.documentElement.classList.contains('dark') ? 'bg-primary' : 'bg-muted'}">
                            <span class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${document.documentElement.classList.contains('dark') ? 'translate-x-6' : 'translate-x-1'}"></span>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Account Actions -->
            <div class="rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 p-6">
                <h3 class="font-semibold text-lg mb-4 text-red-700 dark:text-red-400">Account Actions</h3>
                <div class="flex gap-3">
                    <button onclick="downloadMyData()" class="px-4 py-2 border rounded-lg hover:bg-red-100 transition-colors">
                        <i data-lucide="download" class="h-4 w-4 inline mr-2"></i>
                        Download My Data
                    </button>
                    <button onclick="deactivateAccount()" class="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-100 transition-colors">
                        <i data-lucide="user-x" class="h-4 w-4 inline mr-2"></i>
                        Deactivate Account
                    </button>
                </div>
            </div>
        </div>
    `;
}

async function updateProfile(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);

    const profileData = {
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone')
    };

    showLoading();
    try {
        const response = await api.user.updateProfile(profileData);
        if (response.success) {
            showToast('✅ Profile updated successfully', 'success');
            const user = getCurrentUser();
            user.name = profileData.name;
            user.email = profileData.email;
            user.phone = profileData.phone;
            safeSetUserStorage(user);
            updateUserInfo();
        }
    } catch (error) {
        showToast(error.message || 'Failed to update profile', 'error');
    } finally {
        hideLoading();
    }
}

async function updatePassword(event) {
    event.preventDefault();
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    if (!currentPassword || !newPassword || !confirmPassword) {
        showToast('Please fill all password fields', 'error');
        return;
    }

    if (newPassword !== confirmPassword) {
        showToast('New passwords do not match', 'error');
        return;
    }

    if (newPassword.length < 8) {
        showToast('Password must be at least 8 characters', 'error');
        return;
    }

    showLoading();
    try {
        const response = await api.auth.changePassword(currentPassword, newPassword);
        if (response.success) {
            showToast('✅ Password changed successfully', 'success');
            document.getElementById('current-password').value = '';
            document.getElementById('new-password').value = '';
            document.getElementById('confirm-password').value = '';
        }
    } catch (error) {
        showToast(error.message || 'Failed to change password', 'error');
    } finally {
        hideLoading();
    }
}

async function togglePreference(prefKey) {
    const user = getCurrentUser();
    const preferences = user.preferences || {};
    preferences[prefKey] = !preferences[prefKey];

    if (prefKey === 'darkMode') {
        toggleTheme();
    }

    showLoading();
    try {
        const response = await api.user.updatePreferences(preferences);
        if (response.success) {
            user.preferences = preferences;
            safeSetUserStorage(user);
            showToast('Preferences updated', 'success');
        }
    } catch (error) {
        showToast('Failed to update preferences', 'error');
    } finally {
        hideLoading();
    }
}

async function downloadMyData() {
    showLoading();
    try {
        const response = await api.user.exportMyData();
        downloadStructuredCsv(response.data, `Shule_AI_My_Data_${new Date().toISOString().split('T')[0]}.csv`);
        showToast('✅ Data exported successfully', 'success');
    } catch (error) {
        showToast('Failed to export data', 'error');
    } finally {
        hideLoading();
    }
}

async function deactivateAccount() {
    if (!confirm('⚠️ Are you sure you want to deactivate your account? You can reactivate later by contacting support.')) return;

    const reason = prompt('Please tell us why you are deactivating (optional):');

    showLoading();
    try {
        const response = await api.user.deactivateAccount(reason);
        if (response.success) {
            showToast('Account deactivated. Logging out...', 'info');
            setTimeout(() => {
                logout();
            }, 2000);
        }
    } catch (error) {
        showToast(error.message || 'Failed to deactivate account', 'error');
    } finally {
        hideLoading();
    }
}

async function loadUserStats(role) {
    try {
        const response = await api.user.getMyStats();
        return response.data || {};
    } catch (error) {
        console.error('Failed to load user stats:', error);
        return {};
    }
}

// Image preparation keeps uploads small enough to persist safely in PostgreSQL.
async function prepareProfileMedia(file, { signature = false } = {}) {
    if (!file || !/^image\/(png|jpe?g|webp|gif)$/i.test(file.type || '')) throw new Error('Choose a PNG, JPG, WEBP or GIF image.');
    const maxOriginal = signature ? 2 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxOriginal) throw new Error(signature ? 'Signature must be 2 MB or smaller.' : 'Profile image must be 5 MB or smaller.');
    if (file.type === 'image/gif' || typeof createImageBitmap !== 'function') return file;
    const bitmap = await createImageBitmap(file);
    const maxSide = signature ? 1200 : 900;
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const ctx = canvas.getContext('2d');
    if (!signature) { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height); }
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close?.();
    const mime = signature ? 'image/png' : 'image/jpeg';
    const quality = signature ? undefined : 0.86;
    const blob = await new Promise((resolve, reject) => canvas.toBlob(b => b ? resolve(b) : reject(new Error('Could not prepare image.')), mime, quality));
    return new File([blob], signature ? 'signature.png' : 'profile.jpg', { type: mime });
}

function persistUploadedUserMedia(user, { displayUrl, fileUrl, signature = false }) {
    const memoryUser = { ...user, preferences: { ...(user.preferences || {}) } };
    const storageUser = { ...memoryUser, preferences: { ...memoryUser.preferences } };
    if (signature) {
        memoryUser.signature = displayUrl;
        memoryUser.signatureUrl = displayUrl;
        memoryUser.preferences.signatureDataUrl = String(displayUrl).startsWith('data:') ? displayUrl : null;
        memoryUser.preferences.signatureUrl = displayUrl;
        memoryUser.preferences.signatureFileUrl = fileUrl || memoryUser.preferences.signatureFileUrl || '';
        storageUser.signature = fileUrl || displayUrl;
        storageUser.signatureUrl = fileUrl || displayUrl;
        storageUser.preferences.signatureDataUrl = null;
        storageUser.preferences.signatureUrl = fileUrl || displayUrl;
        storageUser.preferences.signatureFileUrl = fileUrl || '';
    } else {
        memoryUser.profileImage = displayUrl;
        memoryUser.profilePicture = displayUrl;
        memoryUser.preferences.profileImageDataUrl = String(displayUrl).startsWith('data:') ? displayUrl : null;
        memoryUser.preferences.profileImageFileUrl = fileUrl || memoryUser.preferences.profileImageFileUrl || '';
        storageUser.profileImage = fileUrl || displayUrl;
        storageUser.profilePicture = fileUrl || displayUrl;
        storageUser.preferences.profileImageDataUrl = null;
        storageUser.preferences.profileImageFileUrl = fileUrl || '';
    }
    const activeUser = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
    if (activeUser && typeof activeUser === 'object') {
        Object.keys(activeUser).forEach(key => { if (!(key in memoryUser)) delete activeUser[key]; });
        Object.assign(activeUser, memoryUser);
        window.currentUser = activeUser;
    } else {
        window.currentUser = memoryUser;
    }
    if (window.dashboardData) {
        window.dashboardData.user = { ...(window.dashboardData.user || {}), ...memoryUser };
        window.dashboardData.profile = { ...(window.dashboardData.profile || {}), ...(signature ? { signature: displayUrl, signatureUrl: displayUrl } : { profileImage: displayUrl, profilePicture: displayUrl }) };
    }
    const minimal=typeof stripLargeMediaForStorage==='function'?stripLargeMediaForStorage(storageUser):storageUser;try{if(typeof safeSessionSet==='function')safeSessionSet('user',JSON.stringify(minimal));else localStorage.setItem('user',JSON.stringify(minimal));}catch(_){}try{localStorage.removeItem('currentUser');localStorage.removeItem('shule_user');}catch(_){}
    return memoryUser;
}

async function uploadProfilePicture(file) {
    if (!file) return;
    showLoading();
    try {
        const prepared = await prepareProfileMedia(file);
        const formData = new FormData();
        formData.append('picture', prepared);
        const data = await api.user.uploadProfilePicture(formData);
        const displayUrl = data?.data?.displayUrl || data?.data?.profileImage || data?.profileImage || '';
        const fileUrl = data?.data?.fileUrl || data?.data?.profileImagePath || '';
        if (!displayUrl) throw new Error('Upload completed but the server returned no profile image.');
        persistUploadedUserMedia(getCurrentUser() || {}, { displayUrl, fileUrl, signature: false });
        const preview = document.getElementById('profile-preview');
        if (preview) { preview.src = v116ResolveUploadedMediaUrl(displayUrl); preview.setAttribute('data-current-user-avatar', ''); }
        if (typeof updateUserInfo === 'function') updateUserInfo();
        if (typeof applyGlobalProfilePictures === 'function') applyGlobalProfilePictures();
        showToast('Profile picture saved successfully', 'success');
    } catch (error) {
        console.error('Profile picture upload error:', error);
        showToast(error.message || 'Failed to upload profile picture', 'error');
    } finally { hideLoading(); }
}

function v116ResolveUploadedMediaUrl(value) {
    const raw = String(value || '').trim();
    if (!raw || raw === 'undefined' || raw === 'null') return '';
    if (/^(data:|blob:)/i.test(raw)) return raw;
    if (typeof resolveMediaUrl === 'function') return resolveMediaUrl(raw);
    if (/\/uploads\/(profiles|signatures)\//i.test(raw)) return '';
    if (/^https?:\/\//i.test(raw)) return raw;
    const base = (typeof API_BASE_URL !== 'undefined' ? API_BASE_URL : '').replace(/\/$/, '');
    return `${base}/${raw.replace(/^\/+/, '')}`;
}

async function uploadSignature(file) {
    if (!file) return;
    showLoading();
    try {
        const prepared = await prepareProfileMedia(file, { signature: true });
        const formData = new FormData();
        formData.append('signature', prepared);
        const data = await api.user.uploadSignature(formData);
        const displayUrl = data?.data?.displayUrl || data?.data?.signatureUrl || data?.data?.signature || '';
        const fileUrl = data?.data?.fileUrl || data?.data?.signatureFileUrl || '';
        if (!displayUrl) throw new Error('Upload completed but the server returned no signature.');
        persistUploadedUserMedia(getCurrentUser() || {}, { displayUrl, fileUrl, signature: true });
        const preview = document.getElementById('signature-preview');
        if (preview) { preview.src = v116ResolveUploadedMediaUrl(displayUrl); preview.dataset.savedSignature = 'true'; }
        showToast('Signature saved successfully', 'success');
    } catch (error) {
        console.error('Signature upload error:', error);
        showToast(error.message || 'Failed to upload signature', 'error');
    } finally { hideLoading(); }
}

// Export all functions
window.renderProfileSection = renderProfileSection;
window.updateProfile = updateProfile;
window.updatePassword = updatePassword;
window.togglePreference = togglePreference;
window.downloadMyData = downloadMyData;
window.deactivateAccount = deactivateAccount;
window.loadUserStats = loadUserStats;
window.uploadProfilePicture = uploadProfilePicture;
window.uploadSignature = uploadSignature;
