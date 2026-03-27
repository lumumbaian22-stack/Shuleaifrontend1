// profile.js - User profile and settings

async function renderProfileSection() {
    const user = getCurrentUser();
    const school = getCurrentSchool();
    const stats = await loadUserStats(user.role);

    return `
        <div class="space-y-6 animate-fade-in max-w-4xl mx-auto">
            <div class="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white">
                <div class="absolute right-0 top-0 -mt-10 -mr-10 h-40 w-40 rounded-full bg-white/10"></div>
                <div class="absolute bottom-0 left-0 -mb-10 -ml-10 h-40 w-40 rounded-full bg-black/10"></div>
                <div class="relative z-10 flex items-center gap-6">
                    <div class="h-24 w-24 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-4xl font-bold border-4 border-white shadow-xl">
                        ${getInitials(user.name)}
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

            <div class="grid gap-4 md:grid-cols-3">
                <div class="rounded-xl border bg-card p-4"><p class="text-sm text-muted-foreground">Member Since</p><p class="text-lg font-semibold">${formatDate(user.createdAt)}</p></div>
                <div class="rounded-xl border bg-card p-4"><p class="text-sm text-muted-foreground">Last Login</p><p class="text-lg font-semibold">${user.lastLogin ? timeAgo(user.lastLogin) : 'N/A'}</p></div>
                <div class="rounded-xl border bg-card p-4"><p class="text-sm text-muted-foreground">Account Status</p><p class="text-lg font-semibold text-green-600">${user.isActive ? 'Active' : 'Inactive'}</p></div>
            </div>

            <div class="rounded-xl border bg-card p-6">
                <h3 class="font-semibold text-lg mb-4">Profile Information</h3>
                <form id="profile-form" class="space-y-4" onsubmit="updateProfile(event)">
                    <div class="grid gap-4 md:grid-cols-2">
                        <div><label class="block text-sm font-medium mb-1">Full Name</label><input type="text" name="name" value="${user.name || ''}" class="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm focus:ring-2 focus:ring-primary transition-all"></div>
                        <div><label class="block text-sm font-medium mb-1">Email</label><input type="email" name="email" value="${user.email || ''}" class="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm focus:ring-2 focus:ring-primary transition-all"></div>
                    </div>
                    <div class="grid gap-4 md:grid-cols-2">
                        <div><label class="block text-sm font-medium mb-1">Phone</label><input type="tel" name="phone" value="${user.phone || ''}" class="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm focus:ring-2 focus:ring-primary transition-all"></div>
                        <div><label class="block text-sm font-medium mb-1">Role</label><input type="text" value="${user.role}" disabled class="w-full rounded-lg border border-input bg-muted px-4 py-2 text-sm text-muted-foreground"></div>
                    </div>
                    <div class="flex justify-end"><button type="submit" class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">Update Profile</button></div>
                </form>
            </div>

            <div class="rounded-xl border bg-card p-6">
                <h3 class="font-semibold text-lg mb-4">Change Password</h3>
                <form id="password-form" class="space-y-4" onsubmit="updatePassword(event)">
                    <div><label class="block text-sm font-medium mb-1">Current Password</label><input type="password" id="current-password" required class="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm focus:ring-2 focus:ring-primary transition-all"></div>
                    <div class="grid gap-4 md:grid-cols-2">
                        <div><label class="block text-sm font-medium mb-1">New Password</label><input type="password" id="new-password" required minlength="8" class="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm focus:ring-2 focus:ring-primary transition-all"></div>
                        <div><label class="block text-sm font-medium mb-1">Confirm New Password</label><input type="password" id="confirm-password" required class="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm focus:ring-2 focus:ring-primary transition-all"></div>
                    </div>
                    <div class="flex justify-end"><button type="submit" class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">Update Password</button></div>
                </form>
            </div>

            <div class="rounded-xl border bg-card p-6">
                <h3 class="font-semibold text-lg mb-4">Preferences</h3>
                <div class="space-y-4">
                    <div class="flex items-center justify-between">
                        <div><p class="font-medium">Email Notifications</p><p class="text-sm text-muted-foreground">Receive email updates about important events</p></div>
                        <button onclick="togglePreference('email')" id="pref-email" class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${user.preferences?.email !== false ? 'bg-primary' : 'bg-muted'}">
                            <span class="translate-x-${user.preferences?.email !== false ? '6' : '1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform"></span>
                        </button>
                    </div>
                    <div class="flex items-center justify-between">
                        <div><p class="font-medium">Push Notifications</p><p class="text-sm text-muted-foreground">Show desktop notifications</p></div>
                        <button onclick="togglePreference('push')" id="pref-push" class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${user.preferences?.push !== false ? 'bg-primary' : 'bg-muted'}">
                            <span class="translate-x-${user.preferences?.push !== false ? '6' : '1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform"></span>
                        </button>
                    </div>
                    <div class="flex items-center justify-between">
                        <div><p class="font-medium">Dark Mode</p><p class="text-sm text-muted-foreground">Use dark theme</p></div>
                        <button onclick="togglePreference('darkMode')" id="pref-darkmode" class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${document.documentElement.classList.contains('dark') ? 'bg-primary' : 'bg-muted'}">
                            <span class="translate-x-${document.documentElement.classList.contains('dark') ? '6' : '1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform"></span>
                        </button>
                    </div>
                </div>
            </div>

            <div class="rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 p-6">
                <h3 class="font-semibold text-lg mb-4 text-red-700 dark:text-red-400">Account Actions</h3>
                <div class="flex gap-3">
                    <button onclick="downloadMyData()" class="px-4 py-2 border rounded-lg hover:bg-red-100 transition-colors"><i data-lucide="download" class="h-4 w-4 inline mr-2"></i>Download My Data</button>
                    <button onclick="deactivateAccount()" class="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-100 transition-colors"><i data-lucide="user-x" class="h-4 w-4 inline mr-2"></i>Deactivate Account</button>
                </div>
            </div>
        </div>
    `;
}

async function updateProfile(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const profileData = { name: formData.get('name'), email: formData.get('email'), phone: formData.get('phone') };
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
    } catch (error) { showToast(error.message || 'Failed to update profile', 'error'); }
    finally { hideLoading(); }
}

async function updatePassword(event) {
    event.preventDefault();
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    if (!currentPassword || !newPassword || !confirmPassword) { showToast('Please fill all password fields', 'error'); return; }
    if (newPassword !== confirmPassword) { showToast('New passwords do not match', 'error'); return; }
    if (newPassword.length < 8) { showToast('Password must be at least 8 characters', 'error'); return; }
    showLoading();
    try {
        const response = await api.auth.changePassword(currentPassword, newPassword);
        if (response.success) {
            showToast('✅ Password changed successfully', 'success');
            document.getElementById('current-password').value = '';
            document.getElementById('new-password').value = '';
            document.getElementById('confirm-password').value = '';
        }
    } catch (error) { showToast(error.message || 'Failed to change password', 'error'); }
    finally { hideLoading(); }
}

async function togglePreference(prefKey) {
    const user = getCurrentUser();
    const preferences = user.preferences || {};
    preferences[prefKey] = !preferences[prefKey];
    if (prefKey === 'darkMode') toggleTheme();
    showLoading();
    try {
        const response = await api.user.updatePreferences(preferences);
        if (response.success) {
            user.preferences = preferences;
            localStorage.setItem('user', JSON.stringify(user));
            showToast('Preferences updated', 'success');
        }
    } catch (error) { showToast('Failed to update preferences', 'error'); }
    finally { hideLoading(); }
}

async function downloadMyData() {
    showLoading();
    try {
        const response = await api.user.exportMyData();
        const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `shuleai_my_data_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('✅ Data exported successfully', 'success');
    } catch (error) { showToast('Failed to export data', 'error'); }
    finally { hideLoading(); }
}

async function deactivateAccount() {
    if (!confirm('⚠️ Are you sure you want to deactivate your account? You can reactivate later by contacting support.')) return;
    const reason = prompt('Please tell us why you are deactivating (optional):');
    showLoading();
    try {
        const response = await api.user.deactivateAccount(reason);
        if (response.success) {
            showToast('Account deactivated. Logging out...', 'info');
            setTimeout(() => logout(), 2000);
        }
    } catch (error) { showToast(error.message || 'Failed to deactivate account', 'error'); }
    finally { hideLoading(); }
}

async function loadUserStats(role) {
    try {
        const response = await api.user.getMyStats();
        return response.data || {};
    } catch (error) { console.error('Failed to load user stats:', error); return {}; }
}

function renderUserSettings(role) {
    const user = getCurrentUser();
    return `
        <div class="space-y-6 animate-fade-in">
            <h2 class="text-2xl font-bold">My Settings</h2>
            <div class="max-w-2xl space-y-6">
                <div class="rounded-xl border bg-card p-6">
                    <h3 class="font-semibold mb-4">Profile Information</h3>
                    <div class="space-y-4">
                        <div class="grid gap-4 md:grid-cols-2">
                            <div><label class="block text-sm font-medium mb-1">Name</label><input type="text" value="${user?.name || ''}" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"></div>
                            <div><label class="block text-sm font-medium mb-1">Email</label><input type="email" value="${user?.email || ''}" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"></div>
                        </div>
                        <div><label class="block text-sm font-medium mb-1">Phone</label><input type="tel" value="${user?.phone || ''}" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"></div>
                        <div><label class="block text-sm font-medium mb-1">Role</label><input type="text" value="${role}" disabled class="w-full rounded-lg border border-input bg-muted px-3 py-2 text-sm text-muted-foreground"></div>
                    </div>
                </div>
                <div class="rounded-xl border bg-card p-6">
                    <h3 class="font-semibold mb-4">Change Password</h3>
                    <div class="space-y-4">
                        <div><label class="block text-sm font-medium mb-1">Current Password</label><input type="password" id="current-password" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"></div>
                        <div><label class="block text-sm font-medium mb-1">New Password</label><input type="password" id="new-password" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"></div>
                        <div><label class="block text-sm font-medium mb-1">Confirm New Password</label><input type="password" id="confirm-password" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"></div>
                        <button onclick="handleChangePassword()" class="w-full bg-primary text-primary-foreground py-2 rounded-lg">Update Password</button>
                    </div>
                </div>
                <div class="rounded-xl border bg-card p-6">
                    <h3 class="font-semibold mb-4">Preferences</h3>
                    <div class="space-y-4">
                        <div class="flex items-center justify-between">
                            <div><p class="font-medium">Email Notifications</p><p class="text-sm text-muted-foreground">Receive email updates</p></div>
                            <button onclick="toggleSwitch(this)" class="relative inline-flex h-6 w-11 items-center rounded-full bg-primary transition-colors" data-checked="true"><span class="translate-x-6 inline-block h-4 w-4 transform rounded-full bg-white transition-transform"></span></button>
                        </div>
                        <div class="flex items-center justify-between">
                            <div><p class="font-medium">Dark Mode</p><p class="text-sm text-muted-foreground">Use dark theme</p></div>
                            <button onclick="toggleSwitch(this); toggleTheme()" class="relative inline-flex h-6 w-11 items-center rounded-full bg-muted transition-colors" data-checked="${document.documentElement.classList.contains('dark')}"><span class="${document.documentElement.classList.contains('dark') ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform"></span></button>
                        </div>
                    </div>
                </div>
                <div class="flex justify-end"><button onclick="showToast('Settings saved successfully', 'success')" class="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 flex items-center gap-2"><i data-lucide="save" class="h-4 w-4"></i>Save Changes</button></div>
            </div>
        </div>
    `;
}

async function handleChangePassword() {
    const currentPassword = document.getElementById('current-password')?.value;
    const newPassword = document.getElementById('new-password')?.value;
    const confirmPassword = document.getElementById('confirm-password')?.value;
    if (!currentPassword || !newPassword || !confirmPassword) { showToast('Please fill all password fields', 'error'); return; }
    if (newPassword !== confirmPassword) { showToast('New passwords do not match', 'error'); return; }
    showLoading();
    try {
        await changePassword(currentPassword, newPassword);
        showToast('Password updated successfully', 'success');
        document.getElementById('current-password').value = '';
        document.getElementById('new-password').value = '';
        document.getElementById('confirm-password').value = '';
    } catch (error) { showToast(error.message || 'Failed to update password', 'error'); }
    finally { hideLoading(); }
}

window.renderProfileSection = renderProfileSection;
window.updateProfile = updateProfile;
window.updatePassword = updatePassword;
window.togglePreference = togglePreference;
window.downloadMyData = downloadMyData;
window.deactivateAccount = deactivateAccount;
window.loadUserStats = loadUserStats;
window.renderUserSettings = renderUserSettings;
window.handleChangePassword = handleChangePassword;