// superadmin-dashboard.js - Super Admin dashboard rendering

// ============ RENDER SUPER ADMIN SECTION ============
async function renderSuperAdminSection(section) {
    try {
        switch(section) {
            case 'dashboard':
                return renderSuperAdminDashboard();
            case 'schools':
                return await renderSuperAdminSchools();
            case 'school-approvals':
                return await renderSuperAdminPendingSchools();
            case 'pending-approvals':
                return await renderSuperAdminPendingSchools();
            case 'name-change-requests':
                return await renderSuperAdminNameChangeRequests();
             case 'help':
                return renderHelpSection();   
            case 'platform-health':
                return renderSuperAdminHealth();
            case 'settings':
                return renderSuperAdminSettings();
            default:
                return renderSuperAdminDashboard();
        }
    } catch (error) {
        console.error('Error rendering super admin section:', error);
        return `<div class="text-center py-12 text-red-500">Error loading section: ${error.message}</div>`;
    }
}

// ============ MAIN DASHBOARD ============
async function renderSuperAdminDashboard() {
    if (typeof renderV8SuperAdminDashboard === 'function') return await renderV8SuperAdminDashboard();
    return '<div class="text-red-500">V8 super admin module not loaded.</div>';
}

// ============ SCHOOLS MANAGEMENT ============
async function renderSuperAdminSchools() {
    try {
        const schools = await loadAllSchools();
        return `
            <div class="space-y-6 animate-fade-in">
                <div class="flex justify-between items-center">
                    <h2 class="text-2xl font-bold">School Management</h2>
                    <button onclick="showCreateSchoolModal()" class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 flex items-center gap-2">
                        <i data-lucide="plus" class="h-4 w-4"></i>
                        Add New School
                    </button>
                </div>
                <div id="schools-table-container" class="rounded-xl border bg-card overflow-hidden">
                    ${renderSchoolsTable(schools)}
                </div>
            </div>
        `;
    } catch (error) {
        return `<div class="text-center py-12 text-red-500">Error loading schools: ${error.message}</div>`;
    }
}

async function renderSuperAdminPendingSchools() {
    try {
        const schools = await loadPendingSchools();
        return `
            <div class="space-y-6 animate-fade-in">
                <h2 class="text-2xl font-bold">Pending School Approvals</h2>
                <div id="pending-schools-container" class="rounded-xl border bg-card overflow-hidden">
                    ${renderPendingSchoolsTable(schools)}
                </div>
            </div>
        `;
    } catch (error) {
        return `<div class="text-center py-12 text-red-500">Error loading pending schools: ${error.message}</div>`;
    }
}

// ============ NAME CHANGE REQUESTS ============
async function renderSuperAdminNameChangeRequests() {
    try {
        const requests = await loadNameChangeRequests();
        return `
            <div class="space-y-6 animate-fade-in">
                <div class="flex justify-between items-center">
                    <h2 class="text-2xl font-bold">Name Change Requests</h2>
                    <div class="text-sm text-muted-foreground">
                        <span class="font-medium">${requests.length}</span> pending requests
                    </div>
                </div>
                <div class="rounded-xl border bg-card overflow-hidden">
                    ${renderNameChangeRequestsTable(requests)}
                </div>
                <div class="rounded-xl border bg-card">
                    <div class="p-4 border-b bg-muted/30">
                        <h3 class="font-semibold">Request History</h3>
                    </div>
                    <div class="p-4 text-center text-muted-foreground">
                        <i data-lucide="history" class="h-8 w-8 mx-auto mb-2 opacity-50"></i>
                        <p class="text-sm">Recent request history will appear here</p>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        return `<div class="text-center py-12 text-red-500">Error loading name change requests: ${error.message}</div>`;
    }
}

// ============ PLATFORM HEALTH ============
function renderSuperAdminHealth() {
    const data = dashboardData || {};
    return `
        <div class="space-y-6 animate-fade-in">
            <div class="flex justify-between items-center">
                <h2 class="text-2xl font-bold">Platform Health</h2>
                <button onclick="renderSuperAdminHealth()" class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 flex items-center gap-2">
                    <i data-lucide="refresh-cw" class="h-4 w-4"></i>
                    Refresh
                </button>
            </div>
            <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div class="rounded-xl border bg-card p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-muted-foreground">Database</p>
                            <div class="flex items-center gap-2 mt-1">
                                <div class="h-3 w-3 rounded-full bg-green-500 animate-pulse"></div>
                                <h3 class="text-xl font-bold">Operational</h3>
                            </div>
                            <p class="text-xs text-muted-foreground mt-1">Last checked: just now</p>
                        </div>
                        <div class="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
                            <i data-lucide="database" class="h-6 w-6 text-green-600"></i>
                        </div>
                    </div>
                </div>
                <div class="rounded-xl border bg-card p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-muted-foreground">API Server</p>
                            <div class="flex items-center gap-2 mt-1">
                                <div class="h-3 w-3 rounded-full bg-green-500 animate-pulse"></div>
                                <h3 class="text-xl font-bold">Operational</h3>
                            </div>
                            <p class="text-xs text-muted-foreground mt-1">Response: 42ms</p>
                        </div>
                        <div class="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
                            <i data-lucide="server" class="h-6 w-6 text-green-600"></i>
                        </div>
                    </div>
                </div>
                <div class="rounded-xl border bg-card p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-muted-foreground">Storage</p>
                            <div class="mt-1">
                                <h3 class="text-xl font-bold">45GB / 100GB</h3>
                                <div class="w-full h-2 bg-muted rounded-full mt-2 overflow-hidden">
                                    <div class="h-full rounded-full bg-green-500" style="width: 45%"></div>
                                </div>
                                <p class="text-xs text-muted-foreground mt-1">45% Used</p>
                            </div>
                        </div>
                        <div class="h-12 w-12 rounded-lg bg-amber-100 flex items-center justify-center">
                            <i data-lucide="hard-drive" class="h-6 w-6 text-amber-600"></i>
                        </div>
                    </div>
                </div>
                <div class="rounded-xl border bg-card p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-muted-foreground">WebSocket</p>
                            <div class="flex items-center gap-2 mt-1">
                                <div class="h-3 w-3 rounded-full bg-green-500 animate-pulse"></div>
                                <h3 class="text-xl font-bold">Connected</h3>
                            </div>
                            <p class="text-xs text-muted-foreground mt-1">Active connections: 124</p>
                        </div>
                        <div class="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
                            <i data-lucide="zap" class="h-6 w-6 text-green-600"></i>
                        </div>
                    </div>
                </div>
            </div>
            <div class="grid gap-4 md:grid-cols-2">
                <div class="rounded-xl border bg-card p-6">
                    <h3 class="font-semibold mb-4">CPU Usage</h3>
                    <div class="relative pt-1">
                        <div class="flex mb-2 items-center justify-between">
                            <div><span class="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full bg-blue-100 text-blue-700">Current</span></div>
                            <div class="text-right"><span class="text-xs font-semibold inline-block text-blue-600">32%</span></div>
                        </div>
                        <div class="overflow-hidden h-3 mb-4 text-xs flex rounded bg-blue-100">
                            <div style="width:32%" class="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 transition-all duration-500"></div>
                        </div>
                        <div class="flex justify-between text-xs text-muted-foreground">
                            <span>Min: 15%</span><span>Avg: 35%</span><span>Max: 75%</span>
                        </div>
                    </div>
                </div>
                <div class="rounded-xl border bg-card p-6">
                    <h3 class="font-semibold mb-4">Memory Usage</h3>
                    <div class="relative pt-1">
                        <div class="flex mb-2 items-center justify-between">
                            <div><span class="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full bg-purple-100 text-purple-700">Current</span></div>
                            <div class="text-right"><span class="text-xs font-semibold inline-block text-purple-600">48%</span></div>
                        </div>
                        <div class="overflow-hidden h-3 mb-4 text-xs flex rounded bg-purple-100">
                            <div style="width:48%" class="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-purple-500 transition-all duration-500"></div>
                        </div>
                        <div class="flex justify-between text-xs text-muted-foreground">
                            <span>Used: 3.2GB</span><span>Total: 8GB</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="rounded-xl border bg-card">
                <div class="p-4 border-b">
                    <h3 class="font-semibold">Recent Platform Events</h3>
                </div>
                <div class="divide-y">
                    <div class="p-4 flex items-center gap-4 hover:bg-accent/50 transition-colors">
                        <div class="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <i data-lucide="building-2" class="h-5 w-5 text-blue-600"></i>
                        </div>
                        <div class="flex-1">
                            <p class="text-sm font-medium">New School Registered</p>
                            <p class="text-xs text-muted-foreground">Mombasa Academy signed up</p>
                        </div>
                        <span class="text-xs text-muted-foreground">2 hours ago</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// ============ PLATFORM SETTINGS ============
function renderSuperAdminSettings() {
    const settings = window.platformSettings || {};
    return `
        <div class="space-y-6 animate-fade-in">
            <h2 class="text-2xl font-bold">Platform Settings</h2>
            <p class="text-sm text-muted-foreground">Configure global platform settings. Changes affect all schools.</p>
            <div class="grid gap-6">
                <div class="rounded-xl border bg-card p-6">
                    <h3 class="font-semibold mb-4">General Settings</h3>
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium mb-1">Platform Name</label>
                            <input type="text" id="platform-name" value="${settings.platformName || 'ShuleAI'}" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary transition-all">
                        </div>
                        <div>
                            <label class="block text-sm font-medium mb-1">Default Curriculum for New Schools</label>
                            <select id="default-curriculum" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                                <option value="cbc" ${settings.defaultCurriculum === 'cbc' ? 'selected' : ''}>CBC (Competency Based Curriculum)</option>
                                <option value="844" ${settings.defaultCurriculum === '844' ? 'selected' : ''}>8-4-4 System</option>
                                <option value="british" ${settings.defaultCurriculum === 'british' ? 'selected' : ''}>British Curriculum</option>
                                <option value="american" ${settings.defaultCurriculum === 'american' ? 'selected' : ''}>American Curriculum</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium mb-1">Name Change Fee ($)</label>
                            <input type="number" id="name-change-fee" value="${settings.nameChangeFee || 50}" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                        </div>
                    </div>
                </div>
                <div class="rounded-xl border bg-card p-6">
                    <h3 class="font-semibold mb-4">Platform Controls</h3>
                    <div class="space-y-4">
                        <div class="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                            <div>
                                <p class="font-medium">Maintenance Mode</p>
                                <p class="text-sm text-muted-foreground">When enabled, only super admins can access the platform</p>
                            </div>
                            <button id="maintenance-mode" onclick="toggleMaintenanceMode()" class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors bg-muted">
                                <span class="translate-x-1 inline-block h-4 w-4 transform rounded-full bg-white transition-transform"></span>
                            </button>
                        </div>
                        <div class="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                            <div>
                                <p class="font-medium">Allow New Registrations</p>
                                <p class="text-sm text-muted-foreground">Allow new schools to sign up</p>
                            </div>
                            <button id="allow-registrations" onclick="toggleNewRegistrations()" class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors bg-primary">
                                <span class="translate-x-6 inline-block h-4 w-4 transform rounded-full bg-white transition-transform"></span>
                            </button>
                        </div>
                    </div>
                </div>
                <div class="rounded-xl border bg-card p-6">
                    <h3 class="font-semibold mb-4">Data Management</h3>
                    <div class="space-y-4">
                        <button onclick="exportPlatformData()" class="w-full py-2 border rounded-lg hover:bg-accent transition-colors flex items-center justify-center gap-2">
                            <i data-lucide="download" class="h-4 w-4"></i> Export All Platform Data (JSON)
                        </button>
                        <button onclick="clearPlatformCache()" class="w-full py-2 border rounded-lg hover:bg-accent transition-colors flex items-center justify-center gap-2 text-yellow-600">
                            <i data-lucide="trash-2" class="h-4 w-4"></i> Clear Platform Cache
                        </button>
                        <button onclick="runSystemBackup()" class="w-full py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
                            <i data-lucide="database-backup" class="h-4 w-4"></i> Run System Backup
                        </button>
                    </div>
                </div>
                <div class="flex justify-end gap-3">
                    <button onclick="resetPlatformSettings()" class="px-6 py-3 border rounded-lg hover:bg-accent transition-colors">Reset to Default</button>
                    <button onclick="saveSuperAdminSettings()" class="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2">
                        <i data-lucide="save" class="h-4 w-4"></i> Save All Settings
                    </button>
                </div>
            </div>
        </div>
    `;
}

// ============ HELPERS FOR SUPER ADMIN ============
function getEventIcon(type) {
    const icons = { system: 'settings', school: 'building-2', user: 'user-plus', error: 'alert-circle', warning: 'alert-triangle', success: 'check-circle', approval: 'check-circle', message: 'message-circle', duty: 'clock', attendance: 'calendar-check', payment: 'credit-card' };
    return icons[type] || 'activity';
}
function getEventIconBg(type) {
    const bgs = { system: 'bg-gray-100', school: 'bg-blue-100', user: 'bg-green-100', error: 'bg-red-100', warning: 'bg-amber-100', success: 'bg-green-100', approval: 'bg-green-100', message: 'bg-blue-100', duty: 'bg-amber-100', attendance: 'bg-purple-100', payment: 'bg-emerald-100' };
    return bgs[type] || 'bg-gray-100';
}
function getEventIconColor(type) {
    const colors = { system: 'text-gray-600', school: 'text-blue-600', user: 'text-green-600', error: 'text-red-600', warning: 'text-amber-600', success: 'text-green-600', approval: 'text-green-600', message: 'text-blue-600', duty: 'text-amber-600', attendance: 'text-purple-600', payment: 'text-emerald-600' };
    return colors[type] || 'text-gray-600';
}

// Global functions for UI actions
window.updateSuperAdminChart = function(value) { console.log('Chart update:', value); };
window.updateSuperAdminPieChart = function(value) { console.log('Pie chart update:', value); };
window.toggleMaintenanceMode = function() {
    const btn = document.getElementById('maintenance-mode');
    const isEnabled = btn.classList.contains('bg-primary');
    if (isEnabled) {
        btn.classList.remove('bg-primary'); btn.classList.add('bg-muted');
        btn.querySelector('span').classList.remove('translate-x-6'); btn.querySelector('span').classList.add('translate-x-1');
    } else {
        btn.classList.remove('bg-muted'); btn.classList.add('bg-primary');
        btn.querySelector('span').classList.remove('translate-x-1'); btn.querySelector('span').classList.add('translate-x-6');
    }
};
window.toggleNewRegistrations = function() {
    const btn = document.getElementById('allow-registrations');
    const isEnabled = btn.classList.contains('bg-primary');
    if (isEnabled) {
        btn.classList.remove('bg-primary'); btn.classList.add('bg-muted');
        btn.querySelector('span').classList.remove('translate-x-6'); btn.querySelector('span').classList.add('translate-x-1');
    } else {
        btn.classList.remove('bg-muted'); btn.classList.add('bg-primary');
        btn.querySelector('span').classList.remove('translate-x-1'); btn.querySelector('span').classList.add('translate-x-6');
    }
};
window.exportPlatformData = async function() {
    showLoading();
    try {
        const response = await api.superAdmin.exportData();
        const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `shuleai_export_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('✅ Data exported successfully', 'success');
    } catch (error) { showToast('Failed to export data', 'error'); }
    finally { hideLoading(); }
};
window.clearPlatformCache = async function() {
    if (!confirm('⚠️ Clear all platform caches? This may temporarily slow down the system.')) return;
    showLoading();
    try {
        await api.superAdmin.clearCache();
        showToast('✅ Cache cleared successfully', 'success');
    } catch (error) { showToast('Failed to clear cache', 'error'); }
    finally { hideLoading(); }
};
window.runSystemBackup = async function() {
    showLoading();
    try {
        const response = await api.superAdmin.runBackup();
        showToast(`✅ Backup completed: ${response.data.filename}`, 'success');
    } catch (error) { showToast('Failed to run backup', 'error'); }
    finally { hideLoading(); }
};
window.resetPlatformSettings = async function() {
    if (!confirm('⚠️ Reset all platform settings to default? This cannot be undone.')) return;
    showLoading();
    try {
        await api.superAdmin.resetSettings();
        await loadSuperAdminSettings();
        showToast('✅ Settings reset to default', 'success');
    } catch (error) { showToast('Failed to reset settings', 'error'); }
    finally { hideLoading(); }
};
window.saveSuperAdminSettings = async function() {
    const platformName = document.getElementById('platform-name')?.value;
    const defaultCurriculum = document.getElementById('default-curriculum')?.value;
    const nameChangeFee = document.getElementById('name-change-fee')?.value;
    const maintenanceMode = document.getElementById('maintenance-mode')?.classList.contains('bg-primary');
    const allowNewRegistrations = document.getElementById('allow-registrations')?.classList.contains('bg-primary');
    showLoading();
    try {
        const response = await api.superAdmin.updatePlatformSettings({ platformName, defaultCurriculum, nameChangeFee: parseInt(nameChangeFee), maintenanceMode, allowNewRegistrations });
        if (response.success) {
            showToast('✅ Platform settings saved successfully', 'success');
            await showDashboardSection('settings');
        }
    } catch (error) {
        showToast(error.message || 'Failed to save settings', 'error');
    } finally { hideLoading(); }
};
window.loadSuperAdminSettings = async function() {
    try {
        const settings = await api.superAdmin.getPlatformSettings();
        window.platformSettings = settings.data;
        // populate form if needed
    } catch (error) { console.error('Error loading settings:', error); }
};
