// profile.js - Profile section with profile picture and signature upload

async function renderProfileSection() {
    const user = getCurrentUser();
    const school = getCurrentSchool();

    const stats = await loadUserStats(user.role);

    // Profile picture preview URL
    const profileImageUrl = user.profileImage ? user.profileImage : '';

    return `
        <div class="space-y-6 animate-fade-in max-w-4xl mx-auto">
            <!-- Profile Header with Picture Upload -->
            <div class="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white">
                <div class="absolute right-0 top-0 -mt-10 -mr-10 h-40 w-40 rounded-full bg-white/10"></div>
                <div class="absolute bottom-0 left-0 -mb-10 -ml-10 h-40 w-40 rounded-full bg-black/10"></div>
                <div class="relative z-10 flex items-center gap-6">
                    <!-- Profile Picture with Upload -->
                    <div class="relative">
                        <div class="h-24 w-24 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-4xl font-bold border-4 border-white shadow-xl overflow-hidden">
                            ${profileImageUrl ? `<img src="${profileImageUrl}" alt="Profile" class="h-full w-full object-cover">` : `<span>${getInitials(user.name)}</span>`}
                        </div>
                        <label class="absolute bottom-0 right-0 bg-primary text-white rounded-full p-1 cursor-pointer hover:bg-primary/90 transition-colors">
                            <i data-lucide="camera" class="h-4 w-4"></i>
                            <input type="file" id="profile-picture-input" accept="image/*" class="hidden" onchange="uploadProfilePicture(this.files[0])">
                        </label>
                    </div>
                    <div>
                        <h2 class="text-3xl font-bold">${user.name}</h2>
                        <p class="text-white/80 capitalize">${user.role} • ${user.email}</p>
                        <div class="flex gap-2 mt-2">
                            <span class="px-2 py-1 bg-white/20 rounded-full text-xs">ID: ${user.id}</span>
                            ${school?.shortCode ? `<span class="px-2 py-1 bg-white/20 rounded-full text-xs">School: ${school.shortCode}</span>` : ''}
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
                            <input type="text" name="name" value="${user.name || ''}" 
                                   class="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm focus:ring-2 focus:ring-primary transition-all">
                        </div>
                        <div>
                            <label class="block text-sm font-medium mb-1">Email</label>
                            <input type="email" name="email" value="${user.email || ''}" 
                                   class="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm focus:ring-2 focus:ring-primary transition-all">
                        </div>
                    </div>
                    <div class="grid gap-4 md:grid-cols-2">
                        <div>
                            <label class="block text-sm font-medium mb-1">Phone</label>
                            <input type="tel" name="phone" value="${user.phone || ''}" 
                                   class="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm focus:ring-2 focus:ring-primary transition-all">
                        </div>
                        <div>
                            <label class="block text-sm font-medium mb-1">Role</label>
                            <input type="text" value="${user.role}" disabled 
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
                    <img id="signature-preview" src="${user.signature || ''}" class="h-16 border rounded">
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
            localStorage.setItem('user', JSON.stringify(user));
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
            localStorage.setItem('user', JSON.stringify(user));
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
        const data = response.data;
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `shuleai_my_data_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
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

// Profile picture upload function
async function uploadProfilePicture(file) {
    if (!file) return;
    const formData = new FormData();
    formData.append('picture', file);
    const token = localStorage.getItem('authToken');
    showLoading();
    try {
        const response = await fetch(`${API_BASE_URL}/api/user/profile-picture`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        const data = await response.json();
        if (response.ok && data.success) {
            const user = getCurrentUser();
            user.profileImage = data.data.profileImage;
            localStorage.setItem('user', JSON.stringify(user));

            document.querySelectorAll('.user-avatar, #profile-preview, #user-initials').forEach(el => {
                if (el.tagName === 'IMG') {
                    el.src = data.data.profileImage;
                } else if (el.id === 'user-initials') {
                    // ignore
                }
            });

            const headerAvatar = document.querySelector('#user-menu-button img');
            if (headerAvatar) headerAvatar.src = data.data.profileImage;

            await showDashboardSection('profile');
            showToast('Profile picture updated successfully', 'success');
        } else {
            throw new Error(data.message || 'Upload failed');
        }
    } catch (error) {
        console.error('Profile picture upload error:', error);
        showToast(error.message || 'Failed to upload profile picture', 'error');
    } finally {
        hideLoading();
    }
}

// Signature upload function
async function uploadSignature(file) {
    if (!file) return;
    const formData = new FormData();
    formData.append('signature', file);
    const token = localStorage.getItem('authToken');
    showLoading();
    try {
        const response = await fetch(`${API_BASE_URL}/api/user/signature`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        const data = await response.json();
        if (response.ok && data.success) {
            const user = getCurrentUser();
            user.signature = data.data.signature;
            localStorage.setItem('user', JSON.stringify(user));
            document.getElementById('signature-preview').src = data.data.signature;
            showToast('Signature uploaded successfully', 'success');
        } else {
            throw new Error(data.message || 'Upload failed');
        }
    } catch (error) {
        console.error('Signature upload error:', error);
        showToast(error.message || 'Failed to upload signature', 'error');
    } finally {
        hideLoading();
    }
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
