// super-admin-approvals.js - Complete with working view and edit functions

// ============ SCHOOL MANAGEMENT ============

// Load pending schools
async function loadPendingSchools() {
    try {
        const response = await api.superAdmin.getPendingSchools();
        return response.data || [];
    } catch (error) {
        console.error('Failed to load pending schools:', error);
        showToast('Failed to load pending schools', 'error');
        return [];
    }
}

// Load all schools
async function loadAllSchools() {
    try {
        const response = await api.superAdmin.getSchools();
        return response.data || [];
    } catch (error) {
        console.error('Failed to load schools:', error);
        showToast('Failed to load schools', 'error');
        return [];
    }
}

// Load suspended schools
async function loadSuspendedSchools() {
    try {
        if (!api.superAdmin.getSuspendedSchools) {
            console.warn('getSuspendedSchools endpoint not available');
            return [];
        }
        const response = await api.superAdmin.getSuspendedSchools();
        return response.data || [];
    } catch (error) {
        console.error('Failed to load suspended schools:', error);
        return [];
    }
}

// ============ RENDER PENDING SCHOOLS TABLE ============

// Render pending schools table
function renderPendingSchoolsTable(schools) {
    console.log('Rendering pending schools table with:', schools);
    
    if (!schools || schools.length === 0) {
        return '<div class="text-center py-8 text-muted-foreground">No pending schools</div>';
    }
    
    let tableHtml = `
        <div class="overflow-x-auto">
            <table class="w-full text-sm">
                <thead class="bg-muted/50">
                    <tr>
                        <th class="px-4 py-3 text-left font-medium">School</th>
                        <th class="px-4 py-3 text-left font-medium">Admin Email</th>
                        <th class="px-4 py-3 text-left font-medium">Short Code</th>
                        <th class="px-4 py-3 text-left font-medium">Level</th>
                        <th class="px-4 py-3 text-left font-medium">Curriculum</th>
                        <th class="px-4 py-3 text-left font-medium">Applied</th>
                        <th class="px-4 py-3 text-right font-medium">Actions</th>
                    </tr>
                </thead>
                <tbody class="divide-y">
    `;
    
    schools.forEach(school => {
        // Get the admin from the admins array (directly on the school object)
        const admin = school.admins && school.admins.length > 0 ? school.admins[0] : null;
        
        tableHtml += `
            <tr class="hover:bg-accent/50 transition-colors">
                <td class="px-4 py-3 font-medium">${school.name || 'N/A'}</td>
                <td class="px-4 py-3">${admin ? admin.email : 'No admin yet'}</td>
                <td class="px-4 py-3">
                    <span class="font-mono text-xs bg-muted px-2 py-1 rounded">${school.shortCode || 'N/A'}</span>
                </td>
                <td class="px-4 py-3">${school.settings?.schoolLevel || 'N/A'}</td>
                <td class="px-4 py-3">${school.system || 'N/A'}</td>
                <td class="px-4 py-3">${timeAgo(school.createdAt)}</td>
                <td class="px-4 py-3 text-right">
                    <button onclick="approveSchool('${school.id}')" class="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full hover:bg-green-200 mr-2">
                        Approve
                    </button>
                    <button onclick="rejectSchool('${school.id}')" class="px-3 py-1 bg-red-100 text-red-700 text-xs rounded-full hover:bg-red-200">
                        Reject
                    </button>
                    <button onclick="viewSchoolDetails('${school.id}')" class="p-2 hover:bg-accent rounded-lg">
                        <i data-lucide="eye" class="h-4 w-4"></i>
                    </button>
                </td>
            </tr>
        `;
    });
    
    tableHtml += `
                </tbody>
            </table>
        </div>
    `;
    
    return tableHtml;
}

// ============ SCHOOL ACTIONS ============

// Approve school
async function approveSchool(schoolId) {
    if (!confirm('Approve this school? The admin will be able to log in.')) {
        return;
    }
    
    showLoading();
    try {
        const response = await api.superAdmin.approveSchool(schoolId);
        showToast('✅ School approved successfully', 'success');
        await refreshPendingSchools();
        await refreshSchoolsList();
        return response;
    } catch (error) {
        showToast(error.message || 'Failed to approve school', 'error');
    } finally {
        hideLoading();
    }
}

// Reject school
async function rejectSchool(schoolId) {
    const reason = prompt('Please enter rejection reason:');
    if (reason === null) return;
    
    showLoading();
    try {
        const response = await api.superAdmin.rejectSchool(schoolId, reason);
        showToast('School rejected', 'info');
        await refreshPendingSchools();
        await refreshSchoolsList();
        return response;
    } catch (error) {
        showToast(error.message || 'Failed to reject school', 'error');
    } finally {
        hideLoading();
    }
}

// Suspend school
async function suspendSchool(schoolId) {
    if (!api.superAdmin.suspendSchool) {
        showToast('Suspend school feature coming soon', 'info');
        return;
    }
    
    const reason = prompt('Please enter suspension reason:');
    if (reason === null) return;
    
    if (!confirm('⚠️ Are you sure you want to suspend this school? All users will be locked out.')) {
        return;
    }
    
    showLoading();
    try {
        const response = await api.superAdmin.suspendSchool(schoolId, reason);
        showToast('✅ School suspended successfully', 'success');
        await refreshSchoolsList();
        await refreshSuspendedSchools();
        return response;
    } catch (error) {
        showToast(error.message || 'Failed to suspend school', 'error');
    } finally {
        hideLoading();
    }
}

// Reactivate school
async function reactivateSchool(schoolId) {
    if (!api.superAdmin.reactivateSchool) {
        showToast('Reactivate school feature coming soon', 'info');
        return;
    }
    
    const reason = prompt('Please enter reactivation reason:');
    if (reason === null) return;
    
    showLoading();
    try {
        const response = await api.superAdmin.reactivateSchool(schoolId, reason);
        showToast('✅ School reactivated successfully', 'success');
        await refreshSchoolsList();
        await refreshSuspendedSchools();
        return response;
    } catch (error) {
        showToast(error.message || 'Failed to reactivate school', 'error');
    } finally {
        hideLoading();
    }
}

// Delete school
async function deleteSchool(schoolId) {
    if (!confirm('⚠️ Are you sure? This will delete ALL data for this school! This action cannot be undone.')) {
        return;
    }
    
    showLoading();
    try {
        const response = await api.superAdmin.deleteSchool(schoolId);
        showToast('School deleted', 'info');
        await refreshSchoolsList();
        await refreshPendingSchools();
        await refreshSuspendedSchools();
        return response;
    } catch (error) {
        showToast(error.message || 'Failed to delete school', 'error');
    } finally {
        hideLoading();
    }
}

// ============ VIEW SCHOOL DETAILS ============

// View school details
async function viewSchoolDetails(schoolId) {
    showLoading();
    try {
        const schools = await loadAllSchools();
        const school = schools.find(s => s.id == schoolId);
        
        if (!school) {
            showToast('School not found', 'error');
            return;
        }
        
        showSchoolDetailsModal(school);
    } catch (error) {
        console.error('Error viewing school details:', error);
        showToast('Failed to load school details', 'error');
    } finally {
        hideLoading();
    }
}

// Show school details modal
function showSchoolDetailsModal(school) {
    let modal = document.getElementById('school-details-modal');
    
    if (!modal) {
        createSchoolDetailsModal();
        modal = document.getElementById('school-details-modal');
    }
    
    const modalContent = modal.querySelector('.modal-content');
    if (modalContent) {
        modalContent.innerHTML = getSchoolDetailsHTML(school);
    }
    
    modal.classList.remove('hidden');
    
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
        lucide.createIcons();
    }
}

// Create school details modal
function createSchoolDetailsModal() {
    const modalHTML = `
        <div id="school-details-modal" class="fixed inset-0 z-50 hidden">
            <div class="absolute inset-0 bg-black/50" onclick="closeSchoolDetailsModal()"></div>
            <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl p-4">
                <div class="rounded-xl border bg-card p-6 shadow-xl animate-fade-in">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-lg font-semibold">School Details</h3>
                        <button onclick="closeSchoolDetailsModal()" class="p-2 hover:bg-accent rounded-lg">
                            <i data-lucide="x" class="h-5 w-5"></i>
                        </button>
                    </div>
                    <div class="modal-content space-y-4">
                        <!-- Content will be filled dynamically -->
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Get school details HTML
function getSchoolDetailsHTML(school) {
    const admin = school.admins && school.admins.length > 0 ? school.admins[0] : null;
    
    return `
        <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
                <div class="p-3 bg-muted/30 rounded-lg">
                    <p class="text-xs text-muted-foreground">School ID</p>
                    <p class="font-mono text-sm">${school.schoolId || 'N/A'}</p>
                </div>
                <div class="p-3 bg-muted/30 rounded-lg">
                    <p class="text-xs text-muted-foreground">Short Code</p>
                    <p class="font-mono text-sm font-bold text-primary">${school.shortCode || 'N/A'}</p>
                </div>
            </div>
            
            <div class="border-t pt-4">
                <h4 class="font-medium mb-2">Basic Information</h4>
                <div class="grid grid-cols-2 gap-3 text-sm">
                    <div>
                        <p class="text-muted-foreground">School Name</p>
                        <p class="font-medium school-name-display">${school.name || 'N/A'}</p>
                    </div>
                    <div>
                        <p class="text-muted-foreground">Curriculum</p>
                        <p>${school.system || 'N/A'}</p>
                    </div>
                    <div>
                        <p class="text-muted-foreground">Status</p>
                        <p><span class="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium 
                            ${school.status === 'active' ? 'bg-green-100 text-green-700' : 
                              school.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 
                              school.status === 'suspended' ? 'bg-red-100 text-red-700' : 
                              'bg-gray-100 text-gray-700'}">
                            ${school.status}
                        </span></p>
                    </div>
                    <div>
                        <p class="text-muted-foreground">Created</p>
                        <p>${formatDate(school.createdAt)}</p>
                    </div>
                </div>
            </div>
            
            <div class="border-t pt-4">
                <h4 class="font-medium mb-2">Contact Information</h4>
                <div class="grid grid-cols-2 gap-3 text-sm">
                    <div>
                        <p class="text-muted-foreground">Email</p>
                        <p>${school.contact?.email || admin?.email || 'N/A'}</p>
                    </div>
                    <div>
                        <p class="text-muted-foreground">Phone</p>
                        <p>${school.contact?.phone || 'N/A'}</p>
                    </div>
                    <div class="col-span-2">
                        <p class="text-muted-foreground">Address</p>
                        <p>${formatAddress(school.address) || 'N/A'}</p>
                    </div>
                </div>
            </div>
            
            <div class="border-t pt-4">
                <h4 class="font-medium mb-2">Administrator</h4>
                <div class="grid grid-cols-2 gap-3 text-sm">
                    <div>
                        <p class="text-muted-foreground">Name</p>
                        <p>${admin?.name || 'No admin assigned'}</p>
                    </div>
                    <div>
                        <p class="text-muted-foreground">Email</p>
                        <p>${admin?.email || 'N/A'}</p>
                    </div>
                </div>
            </div>
            
            <div class="border-t pt-4">
                <h4 class="font-medium mb-2">Statistics</h4>
                <div class="grid grid-cols-3 gap-3 text-center">
                    <div class="p-2 bg-muted/30 rounded">
                        <p class="text-2xl font-bold text-blue-600">${school.stats?.teachers || 0}</p>
                        <p class="text-xs text-muted-foreground">Teachers</p>
                    </div>
                    <div class="p-2 bg-muted/30 rounded">
                        <p class="text-2xl font-bold text-green-600">${school.stats?.students || 0}</p>
                        <p class="text-xs text-muted-foreground">Students</p>
                    </div>
                    <div class="p-2 bg-muted/30 rounded">
                        <p class="text-2xl font-bold text-purple-600">${school.stats?.parents || 0}</p>
                        <p class="text-xs text-muted-foreground">Parents</p>
                    </div>
                </div>
            </div>
            
            ${school.suspensionReason ? `
            <div class="border-t pt-4">
                <h4 class="font-medium mb-2 text-red-600">Suspension Information</h4>
                <div class="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <p class="text-sm"><span class="font-medium">Reason:</span> ${school.suspensionReason}</p>
                    <p class="text-sm mt-1"><span class="font-medium">Date:</span> ${formatDate(school.suspendedAt)}</p>
                </div>
            </div>
            ` : ''}
            
            <div class="flex justify-end gap-2 pt-4 border-t">
                <button onclick="closeSchoolDetailsModal()" class="px-4 py-2 text-sm border rounded-lg hover:bg-accent">Close</button>
                <button onclick="editSchool('${school.id}')" class="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">Edit School</button>
            </div>
        </div>
    `;
}

// Helper function to format address
function formatAddress(address) {
    if (!address) return null;
    const parts = [];
    if (address.street) parts.push(address.street);
    if (address.city) parts.push(address.city);
    if (address.country) parts.push(address.country);
    return parts.join(', ');
}

// Close school details modal
function closeSchoolDetailsModal() {
    const modal = document.getElementById('school-details-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

// ============ EDIT SCHOOL ============

// Edit school
async function editSchool(schoolId) {
    showLoading();
    try {
        const schools = await loadAllSchools();
        const school = schools.find(s => s.id == schoolId);
        
        if (!school) {
            showToast('School not found', 'error');
            return;
        }
        
        showEditSchoolModal(school);
    } catch (error) {
        console.error('Error loading school for edit:', error);
        showToast('Failed to load school data', 'error');
    } finally {
        hideLoading();
    }
}

// Show edit school modal
function showEditSchoolModal(school) {
    let modal = document.getElementById('edit-school-modal');
    
    if (!modal) {
        createEditSchoolModal();
        modal = document.getElementById('edit-school-modal');
    }
    
    const idField = document.getElementById('edit-school-id');
    const nameField = document.getElementById('edit-school-name');
    const levelField = document.getElementById('edit-school-level');
    const curriculumField = document.getElementById('edit-curriculum');
    const emailField = document.getElementById('edit-contact-email');
    const phoneField = document.getElementById('edit-contact-phone');
    const streetField = document.getElementById('edit-address-street');
    const cityField = document.getElementById('edit-address-city');
    const countryField = document.getElementById('edit-address-country');
    
    if (idField) idField.value = school.id;
    if (nameField) nameField.value = school.name || '';
    if (levelField) levelField.value = school.settings?.schoolLevel || 'secondary';
    if (curriculumField) curriculumField.value = school.system || 'cbc';
    if (emailField) emailField.value = school.contact?.email || '';
    if (phoneField) phoneField.value = school.contact?.phone || '';
    if (streetField) streetField.value = school.address?.street || '';
    if (cityField) cityField.value = school.address?.city || '';
    if (countryField) countryField.value = school.address?.country || '';
    
    modal.classList.remove('hidden');
}

// Create edit school modal
function createEditSchoolModal() {
    const modalHTML = `
        <div id="edit-school-modal" class="fixed inset-0 z-50 hidden">
            <div class="absolute inset-0 bg-black/50" onclick="closeEditSchoolModal()"></div>
            <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl p-4">
                <div class="rounded-xl border bg-card p-6 shadow-xl animate-fade-in">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-lg font-semibold">Edit School</h3>
                        <button onclick="closeEditSchoolModal()" class="p-2 hover:bg-accent rounded-lg">
                            <i data-lucide="x" class="h-5 w-5"></i>
                        </button>
                    </div>
                    
                    <input type="hidden" id="edit-school-id">
                    
                    <div class="space-y-4 max-h-[60vh] overflow-y-auto p-1">
                        <div class="grid grid-cols-2 gap-4">
                            <div class="col-span-2">
                                <label class="block text-sm font-medium mb-1">School Name *</label>
                                <input type="text" id="edit-school-name" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium mb-1">School Level</label>
                                <select id="edit-school-level" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                                    <option value="primary">Primary</option>
                                    <option value="secondary">Secondary</option>
                                    <option value="both">Both</option>
                                </select>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium mb-1">Curriculum</label>
                                <select id="edit-curriculum" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                                    <option value="cbc">CBC</option>
                                    <option value="844">8-4-4</option>
                                    <option value="british">British</option>
                                    <option value="american">American</option>
                                </select>
                            </div>
                            
                            <div class="col-span-2 border-t pt-2 mt-2">
                                <h4 class="font-medium mb-2">Contact Information</h4>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium mb-1">Email</label>
                                <input type="email" id="edit-contact-email" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium mb-1">Phone</label>
                                <input type="tel" id="edit-contact-phone" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                            </div>
                            
                            <div class="col-span-2">
                                <label class="block text-sm font-medium mb-1">Street Address</label>
                                <input type="text" id="edit-address-street" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium mb-1">City</label>
                                <input type="text" id="edit-address-city" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium mb-1">Country</label>
                                <input type="text" id="edit-address-country" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                            </div>
                        </div>
                    </div>
                    
                    <div class="flex justify-end gap-2 mt-6 pt-4 border-t">
                        <button onclick="closeEditSchoolModal()" class="px-4 py-2 text-sm border rounded-lg hover:bg-accent">Cancel</button>
                        <button onclick="handleUpdateSchool()" class="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">Update School</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Close edit school modal
function closeEditSchoolModal() {
    const modal = document.getElementById('edit-school-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

// Handle update school
async function handleUpdateSchool() {
    const schoolId = document.getElementById('edit-school-id')?.value;
    
    if (!schoolId) {
        showToast('School ID not found', 'error');
        return;
    }
    
    const schoolData = {
        name: document.getElementById('edit-school-name')?.value,
        system: document.getElementById('edit-curriculum')?.value,
        settings: {
            schoolLevel: document.getElementById('edit-school-level')?.value
        },
        contact: {
            email: document.getElementById('edit-contact-email')?.value,
            phone: document.getElementById('edit-contact-phone')?.value
        },
        address: {
            street: document.getElementById('edit-address-street')?.value,
            city: document.getElementById('edit-address-city')?.value,
            country: document.getElementById('edit-address-country')?.value
        }
    };
    
    if (!schoolData.name) {
        showToast('School name is required', 'error');
        return;
    }
    
    await updateSchool(schoolId, schoolData);
    closeEditSchoolModal();
}

// Update school
async function updateSchool(schoolId, schoolData) {
    showLoading();
    try {
        const response = await api.superAdmin.updateSchool(schoolId, schoolData);
        showToast('✅ School updated successfully', 'success');
        await refreshSchoolsList();
        return response;
    } catch (error) {
        showToast(error.message || 'Failed to update school', 'error');
        throw error;
    } finally {
        hideLoading();
    }
}

// ============ CREATE SCHOOL ============

// Show create school modal
function showCreateSchoolModal() {
    let modal = document.getElementById('create-school-modal');
    
    if (!modal) {
        createCreateSchoolModal();
        modal = document.getElementById('create-school-modal');
    }
    
    if (modal) {
        modal.classList.remove('hidden');
    }
}

// Create create school modal
function createCreateSchoolModal() {
    const modalHTML = `
        <div id="create-school-modal" class="fixed inset-0 z-50 hidden">
            <div class="absolute inset-0 bg-black/50" onclick="closeCreateSchoolModal()"></div>
            <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md p-4">
                <div class="rounded-xl border bg-card p-6 shadow-xl animate-fade-in">
                    <h3 class="text-lg font-semibold mb-4">Create New School</h3>
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium mb-1">School Name *</label>
                            <input type="text" id="modal-school-name" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                        </div>
                        <div>
                            <label class="block text-sm font-medium mb-1">School Level</label>
                            <select id="modal-school-level" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                                <option value="primary">Primary</option>
                                <option value="secondary">Secondary</option>
                                <option value="both">Both</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium mb-1">Curriculum</label>
                            <select id="modal-curriculum" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                                <option value="cbc">CBC</option>
                                <option value="844">8-4-4</option>
                                <option value="british">British</option>
                                <option value="american">American</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium mb-1">Admin Name *</label>
                            <input type="text" id="modal-admin-name" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                        </div>
                        <div>
                            <label class="block text-sm font-medium mb-1">Admin Email *</label>
                            <input type="email" id="modal-admin-email" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                        </div>
                        <div>
                            <label class="block text-sm font-medium mb-1">Admin Password</label>
                            <input type="password" id="modal-admin-password" value="Admin123!" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                            <p class="text-xs text-muted-foreground mt-1">Default: Admin123!</p>
                        </div>
                    </div>
                    <div class="flex justify-end gap-2 mt-6">
                        <button onclick="closeCreateSchoolModal()" class="px-4 py-2 text-sm border rounded-lg hover:bg-accent">Cancel</button>
                        <button onclick="handleCreateSchool()" class="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">Create School</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Close create school modal
function closeCreateSchoolModal() {
    const modal = document.getElementById('create-school-modal');
    if (modal) {
        modal.classList.add('hidden');
        const nameField = document.getElementById('modal-school-name');
        const levelField = document.getElementById('modal-school-level');
        const curriculumField = document.getElementById('modal-curriculum');
        const adminNameField = document.getElementById('modal-admin-name');
        const adminEmailField = document.getElementById('modal-admin-email');
        
        if (nameField) nameField.value = '';
        if (levelField) levelField.value = 'secondary';
        if (curriculumField) curriculumField.value = 'cbc';
        if (adminNameField) adminNameField.value = '';
        if (adminEmailField) adminEmailField.value = '';
    }
}

// Handle create school
async function handleCreateSchool() {
    const schoolData = {
        name: document.getElementById('modal-school-name')?.value,
        system: document.getElementById('modal-curriculum')?.value,
        adminName: document.getElementById('modal-admin-name')?.value,
        adminEmail: document.getElementById('modal-admin-email')?.value,
        adminPassword: document.getElementById('modal-admin-password')?.value || 'Admin123!',
        settings: {
            schoolLevel: document.getElementById('modal-school-level')?.value
        }
    };
    
    if (!schoolData.name || !schoolData.adminName || !schoolData.adminEmail) {
        showToast('Please fill all required fields', 'error');
        return;
    }
    
    await createSchool(schoolData);
    closeCreateSchoolModal();
}

// Create new school
async function createSchool(schoolData) {
    showLoading();
    try {
        const response = await api.superAdmin.createSchool(schoolData);
        showToast('✅ School created successfully', 'success');
        await refreshSchoolsList();
        return response;
    } catch (error) {
        showToast(error.message || 'Failed to create school', 'error');
        throw error;
    } finally {
        hideLoading();
    }
}

// ============ NAME CHANGE FUNCTIONS ============

// Load name change requests
async function loadNameChangeRequests() {
    try {
        const response = await api.superAdmin.getPendingRequests();
        return response.data || [];
    } catch (error) {
        console.error('Failed to load name change requests:', error);
        return [];
    }
}

// Approve name change
// In super-admin-approvals.js - Replace the approveNameChange function

async function approveNameChange(requestId) {
    showLoading();
    try {
        const response = await api.superAdmin.approveRequest(requestId);
        showToast('✅ Name change approved', 'success');
        
        // Refresh the name change requests list
        await refreshNameChangeRequests();
        
        // Get the request details
        const requests = await loadNameChangeRequests();
        const approvedRequest = requests.find(r => r.id === requestId);
        
        if (approvedRequest) {
            const newSchoolName = approvedRequest.newName;
            const schoolId = approvedRequest.School?.id;
            const schoolCode = approvedRequest.School?.shortCode;
            
            console.log('✅ School name changed to:', newSchoolName);
            console.log('School ID:', schoolId);
            console.log('School Code:', schoolCode);
            
            // ============ UPDATE FOR ALL USERS IN THIS SCHOOL ============
            
            // Store the name change in localStorage for cross-tab sync
            const nameChangeEvent = {
                schoolId: schoolId,
                newName: newSchoolName,
                timestamp: new Date().toISOString()
            };
            localStorage.setItem('pendingSchoolNameChange', JSON.stringify(nameChangeEvent));
            
            // Update current user's localStorage if they belong to this school
            const currentUser = getCurrentUser();
            const currentSchool = getCurrentSchool();
            
            if (currentSchool && (currentSchool.id === schoolId || currentSchool.shortCode === schoolCode)) {
                // Update school object in localStorage
                const updatedSchool = {
                    ...currentSchool,
                    name: newSchoolName,
                    settings: { ...currentSchool.settings, schoolName: newSchoolName }
                };
                localStorage.setItem('school', JSON.stringify(updatedSchool));
                
                // Update schoolSettings
                const settings = JSON.parse(localStorage.getItem('schoolSettings') || '{}');
                settings.schoolName = newSchoolName;
                localStorage.setItem('schoolSettings', JSON.stringify(settings));
                
                // Update global variables
                if (typeof window.schoolSettings !== 'undefined') {
                    window.schoolSettings.schoolName = newSchoolName;
                }
                if (typeof window.currentSchool !== 'undefined') {
                    window.currentSchool = updatedSchool;
                }
                
                // Update ALL UI elements immediately
                updateAllSchoolNameElements(newSchoolName);
                
                // Refresh current dashboard section to show updated name
                if (typeof showDashboardSection === 'function') {
                    await showDashboardSection(window.currentSection || 'dashboard');
                }
                
                // Dispatch event for other tabs/windows
                window.dispatchEvent(new CustomEvent('school-name-changed', { 
                    detail: { newName: newSchoolName, schoolId: schoolId, schoolCode: schoolCode } 
                }));
            }
            
            showToast(`✅ School name updated to "${newSchoolName}"`, 'success');
        }
        
        return response;
    } catch (error) {
        console.error('❌ Approve name change error:', error);
        showToast(error.message || 'Failed to approve name change', 'error');
    } finally {
        hideLoading();
    }
}

// Update all school name elements across the entire application
function updateAllSchoolNameElements(newName) {
    // Update sidebar school name
    const sidebarSchoolName = document.querySelector('#sidebar .text-lg.font-bold');
    if (sidebarSchoolName) sidebarSchoolName.textContent = newName;
    
    // Update admin dashboard school name card
    const adminSchoolName = document.querySelector('.rounded-xl.border.bg-card.p-6 h2.text-2xl.font-bold');
    if (adminSchoolName) adminSchoolName.textContent = newName;
    
    // Update all elements with school-name class
    document.querySelectorAll('.school-name, .school-name-display, [data-school-name]').forEach(el => {
        el.textContent = newName;
    });
    
    // Update profile section if visible
    const profileSchoolName = document.querySelector('#profile-section .school-name');
    if (profileSchoolName) profileSchoolName.textContent = newName;
    
    // Update any h2 elements that contain school name (but not "Dashboard" or other titles)
    document.querySelectorAll('h2').forEach(el => {
        const currentText = el.textContent;
        // If the element contains the old school name (check against localStorage)
        const oldSchool = getCurrentSchool();
        if (oldSchool && currentText.includes(oldSchool.name) && !currentText.includes('Dashboard')) {
            el.textContent = currentText.replace(oldSchool.name, newName);
        }
    });
    
    // Update breadcrumb if exists
    const breadcrumb = document.querySelector('.breadcrumb span:last-child');
    if (breadcrumb) breadcrumb.textContent = newName;
    
    // Force a small delay and try again for dynamically loaded content
    setTimeout(() => {
        // Re-run for any elements that might have been loaded after
        document.querySelectorAll('.school-name, .school-name-display, [data-school-name]').forEach(el => {
            el.textContent = newName;
        });
    }, 500);
}

// Helper function to update all school name elements
function updateAllSchoolNameElements(newName) {
    // All possible selectors where school name might appear
    const selectors = [
        '#school-name',
        '.school-name',
        '.school-name-display',
        'h2.text-2xl.font-bold',  // Main school name in admin dashboard
        '.school-profile h2',
        '.dashboard-header h1',
        '[data-testid="school-name"]',
        '.card .font-semibold', // School name in cards
        '.bg-gradient-to-r h2' // School name in gradient header
    ];
    
    selectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
            // Only update if it contains a school name (not "ShuleAI" platform name)
            if (el.textContent && 
                !el.textContent.includes('ShuleAI') && 
                !el.textContent.includes('Dashboard') &&
                el.textContent.length > 3) {
                console.log(`Updating element with selector "${selector}":`, el);
                el.textContent = newName;
            }
        });
    });
    
    // Also update elements with specific classes
    document.querySelectorAll('.font-bold').forEach(el => {
        if (el.textContent && 
            !el.textContent.includes('ShuleAI') && 
            !el.textContent.includes('Dashboard') &&
            el.textContent.length > 3 &&
            el.textContent.length < 50) { // School names are usually short
            el.textContent = newName;
        }
    });
}

// Reject name change
async function rejectNameChange(requestId) {
    const reason = prompt('Please enter rejection reason:');
    if (reason === null) return;
    
    showLoading();
    try {
        const response = await api.superAdmin.rejectRequest(requestId, reason);
        showToast('Name change rejected', 'info');
        await refreshNameChangeRequests();
        return response;
    } catch (error) {
        showToast(error.message || 'Failed to reject name change', 'error');
    } finally {
        hideLoading();
    }
}

// Render schools management table
function renderSchoolsTable(schools) {
    if (!schools || schools.length === 0) {
        return '<div class="text-center py-8 text-muted-foreground">No schools found</div>';
    }
    
    return `
        <div class="overflow-x-auto">
            <table class="w-full text-sm">
                <thead class="bg-muted/50">
                    <tr>
                        <th class="px-4 py-3 text-left font-medium">School</th>
                        <th class="px-4 py-3 text-left font-medium">Short Code</th>
                        <th class="px-4 py-3 text-left font-medium">Status</th>
                        <th class="px-4 py-3 text-left font-medium">Teachers</th>
                        <th class="px-4 py-3 text-left font-medium">Students</th>
                        <th class="px-4 py-3 text-right font-medium">Actions</th>
                    </tr>
                </thead>
                <tbody class="divide-y">
                    ${schools.map(school => `
                        <tr class="hover:bg-accent/50 transition-colors">
                            <td class="px-4 py-3 font-medium school-name-display">${school.name}</td>
                            <td class="px-4 py-3">
                                <span class="font-mono text-xs bg-muted px-2 py-1 rounded">${school.shortCode}</span>
                            </td>
                            <td class="px-4 py-3">
                                <span class="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium 
                                    ${school.status === 'active' ? 'bg-green-100 text-green-700' : 
                                      school.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 
                                      school.status === 'suspended' ? 'bg-red-100 text-red-700' : 
                                      'bg-gray-100 text-gray-700'}">
                                    ${school.status}
                                </span>
                            </td>
                            <td class="px-4 py-3">${school.stats?.teachers || 0}</td>
                            <td class="px-4 py-3">${school.stats?.students || 0}</td>
                            <td class="px-4 py-3 text-right">
                                <button onclick="viewSchoolDetails('${school.id}')" class="p-2 hover:bg-accent rounded-lg" title="View Details">
                                    <i data-lucide="eye" class="h-4 w-4"></i>
                                </button>
                                <button onclick="editSchool('${school.id}')" class="p-2 hover:bg-accent rounded-lg" title="Edit School">
                                    <i data-lucide="edit" class="h-4 w-4"></i>
                                </button>
                                ${school.status === 'active' ? `
                                    <button onclick="suspendSchool('${school.id}')" class="p-2 hover:bg-yellow-100 rounded-lg text-yellow-600" title="Suspend School">
                                        <i data-lucide="pause-circle" class="h-4 w-4"></i>
                                    </button>
                                ` : school.status === 'suspended' ? `
                                    <button onclick="reactivateSchool('${school.id}')" class="p-2 hover:bg-green-100 rounded-lg text-green-600" title="Reactivate School">
                                        <i data-lucide="play-circle" class="h-4 w-4"></i>
                                    </button>
                                ` : ''}
                                <button onclick="deleteSchool('${school.id}')" class="p-2 hover:bg-red-100 rounded-lg text-red-600" title="Delete School">
                                    <i data-lucide="trash-2" class="h-4 w-4"></i>
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// Render suspended schools table
function renderSuspendedSchoolsTable(schools) {
    if (!schools || schools.length === 0) {
        return '<div class="text-center py-8 text-muted-foreground">No suspended schools</div>';
    }
    
    return `
        <div class="overflow-x-auto">
            <table class="w-full text-sm">
                <thead class="bg-muted/50">
                    <tr>
                        <th class="px-4 py-3 text-left font-medium">School</th>
                        <th class="px-4 py-3 text-left font-medium">Short Code</th>
                        <th class="px-4 py-3 text-left font-medium">Suspended On</th>
                        <th class="px-4 py-3 text-left font-medium">Reason</th>
                        <th class="px-4 py-3 text-right font-medium">Actions</th>
                    </tr>
                </thead>
                <tbody class="divide-y">
                    ${schools.map(school => `
                        <tr class="hover:bg-accent/50 transition-colors">
                            <td class="px-4 py-3 font-medium">${school.name}</td>
                            <td class="px-4 py-3">
                                <span class="font-mono text-xs bg-muted px-2 py-1 rounded">${school.shortCode}</span>
                            </td>
                            <td class="px-4 py-3">${formatDate(school.suspendedAt)}</td>
                            <td class="px-4 py-3">${school.suspensionReason || 'N/A'}</td>
                            <td class="px-4 py-3 text-right">
                                <button onclick="viewSchoolDetails('${school.id}')" class="p-2 hover:bg-accent rounded-lg" title="View Details">
                                    <i data-lucide="eye" class="h-4 w-4"></i>
                                </button>
                                <button onclick="reactivateSchool('${school.id}')" class="p-2 hover:bg-green-100 rounded-lg text-green-600" title="Reactivate">
                                    <i data-lucide="play-circle" class="h-4 w-4"></i>
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// Render name change requests table
function renderNameChangeRequestsTable(requests) {
    if (!requests || requests.length === 0) {
        return '<div class="text-center py-8 text-muted-foreground">No pending requests</div>';
    }
    
    return `
        <div class="overflow-x-auto">
            <table class="w-full text-sm">
                <thead class="bg-muted/50">
                    <tr>
                        <th class="px-4 py-3 text-left font-medium">School</th>
                        <th class="px-4 py-3 text-left font-medium">Current Name</th>
                        <th class="px-4 py-3 text-left font-medium">New Name</th>
                        <th class="px-4 py-3 text-left font-medium">Requested By</th>
                        <th class="px-4 py-3 text-left font-medium">Date</th>
                        <th class="px-4 py-3 text-right font-medium">Actions</th>
                    </tr>
                </thead>
                <tbody class="divide-y">
                    ${requests.map(request => `
                        <tr class="hover:bg-accent/50 transition-colors">
                            <td class="px-4 py-3 font-medium">${request.School?.name || 'N/A'}</td>
                            <td class="px-4 py-3">${request.currentName}</td>
                            <td class="px-4 py-3 font-semibold text-primary">${request.newName}</td>
                            <td class="px-4 py-3">${request.User?.name || 'N/A'}</td>
                            <td class="px-4 py-3">${timeAgo(request.createdAt)}</td>
                            <td class="px-4 py-3 text-right">
                                <button onclick="approveNameChange('${request.id}')" class="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full hover:bg-green-200 mr-2">
                                    Approve
                                </button>
                                <button onclick="rejectNameChange('${request.id}')" class="px-3 py-1 bg-red-100 text-red-700 text-xs rounded-full hover:bg-red-200">
                                    Reject
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// ============ REFRESH FUNCTIONS ============
// Refresh pending schools - WITH RETRY MECHANISM
async function refreshPendingSchools(retryCount = 0) {
    console.log('refreshPendingSchools called, retry:', retryCount);
    const container = document.getElementById('pending-schools-container');
    
    if (!container) {
        console.error('Container not found');
        if (retryCount < 10) {
            console.log('Retrying in 200ms...');
            setTimeout(() => refreshPendingSchools(retryCount + 1), 200);
        }
        return;
    }
    
    // Check if render function is available
    if (typeof renderPendingSchoolsTable !== 'function') {
        console.log('renderPendingSchoolsTable not ready yet');
        if (retryCount < 20) {
            setTimeout(() => refreshPendingSchools(retryCount + 1), 100);
        }
        return;
    }
    
    try {
        const schools = await loadPendingSchools();
        console.log('Schools loaded:', schools.length);
        container.innerHTML = renderPendingSchoolsTable(schools);
        if (typeof lucide !== 'undefined' && lucide.createIcons) {
            lucide.createIcons();
        }
    } catch (error) {
        console.error('Error refreshing pending schools:', error);
        if (retryCount < 5) {
            setTimeout(() => refreshPendingSchools(retryCount + 1), 500);
        }
    }
}

// Refresh schools list
async function refreshSchoolsList() {
    const container = document.getElementById('schools-table-container');
    if (!container) return;
    
    const schools = await loadAllSchools();
    container.innerHTML = renderSchoolsTable(schools);
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
        lucide.createIcons();
    }
}

// Refresh suspended schools
async function refreshSuspendedSchools() {
    const container = document.getElementById('suspended-schools-container');
    if (!container) return;
    
    const schools = await loadSuspendedSchools();
    container.innerHTML = renderSuspendedSchoolsTable(schools);
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
        lucide.createIcons();
    }
}

// Refresh name change requests
async function refreshNameChangeRequests() {
    const container = document.getElementById('name-change-requests-container');
    if (!container) return;
    
    const requests = await loadNameChangeRequests();
    container.innerHTML = renderNameChangeRequestsTable(requests);
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
        lucide.createIcons();
    }
}

// ============ BANK DETAILS ============

// Update bank details
async function updateBankDetails(schoolId, bankData) {
    showLoading();
    try {
        const response = await api.superAdmin.updateBankDetails(schoolId, bankData);
        showToast('✅ Bank details updated', 'success');
        return response;
    } catch (error) {
        showToast(error.message || 'Failed to update bank details', 'error');
        throw error;
    } finally {
        hideLoading();
    }
}

// Helper function for formatting dates
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// ============ EXPORT FUNCTIONS ============

window.loadPendingSchools = loadPendingSchools;
window.loadAllSchools = loadAllSchools;
window.loadSuspendedSchools = loadSuspendedSchools;
window.approveSchool = approveSchool;
window.rejectSchool = rejectSchool;
window.suspendSchool = suspendSchool;
window.reactivateSchool = reactivateSchool;
window.deleteSchool = deleteSchool;
window.viewSchoolDetails = viewSchoolDetails;
window.closeSchoolDetailsModal = closeSchoolDetailsModal;
window.editSchool = editSchool;
window.closeEditSchoolModal = closeEditSchoolModal;
window.handleUpdateSchool = handleUpdateSchool;
window.showCreateSchoolModal = showCreateSchoolModal;
window.closeCreateSchoolModal = closeCreateSchoolModal;
window.handleCreateSchool = handleCreateSchool;
window.createSchool = createSchool;
window.updateSchool = updateSchool;
window.refreshPendingSchools = refreshPendingSchools;
window.refreshSchoolsList = refreshSchoolsList;
window.refreshSuspendedSchools = refreshSuspendedSchools;
window.loadNameChangeRequests = loadNameChangeRequests;
window.approveNameChange = approveNameChange;
window.rejectNameChange = rejectNameChange;
window.updateBankDetails = updateBankDetails;
window.renderPendingSchoolsTable = renderPendingSchoolsTable;
window.renderSchoolsTable = renderSchoolsTable;
window.renderSuspendedSchoolsTable = renderSuspendedSchoolsTable;
window.renderNameChangeRequestsTable = renderNameChangeRequestsTable;
window.refreshNameChangeRequests = refreshNameChangeRequests;
