// Duty Management Functions

// Load today's duty
async function loadTodayDuty() {
    try {
        const response = await api.duty.getTodayDuty();
        return response.data;
    } catch (error) {
        console.error('Failed to load today duty:', error);
        showToast('Failed to load duty schedule', 'error');
        return null;
    }
}

// Load weekly duty
async function loadWeeklyDuty() {
    try {
        const response = await api.duty.getWeeklyDuty();
        return response.data;
    } catch (error) {
        console.error('Failed to load weekly duty:', error);
        showToast('Failed to load weekly duty', 'error');
        return null;
    }
}

// Check in to duty
async function checkInDuty(location = 'School Gate', notes = '') {
    try {
        const response = await api.duty.checkIn({ location, notes });
        showToast('✅ Checked in successfully!', 'success');
        
        // Update UI
        updateDutyStatus('checked-in');
        
        return response;
    } catch (error) {
        showToast(error.message || 'Failed to check in', 'error');
        throw error;
    }
}

// Check out from duty
async function checkOutDuty(location = 'School Gate', notes = '') {
    try {
        const response = await api.duty.checkOut({ location, notes });
        showToast('✅ Checked out successfully!', 'success');
        
        // Update UI
        updateDutyStatus('checked-out');
        
        return response;
    } catch (error) {
        showToast(error.message || 'Failed to check out', 'error');
        throw error;
    }
}

// Update duty preferences
async function updateDutyPreferences(preferences) {
    try {
        const response = await api.duty.updatePreferences(preferences);
        showToast('✅ Preferences updated', 'success');
        return response;
    } catch (error) {
        showToast(error.message || 'Failed to update preferences', 'error');
        throw error;
    }
}

// Request duty swap
async function requestDutySwap(dutyDate, reason, targetTeacherId = null) {
    try {
        const response = await api.duty.requestSwap({ dutyDate, reason, targetTeacherId });
        showToast('✅ Swap request sent to admin', 'success');
        return response;
    } catch (error) {
        showToast(error.message || 'Failed to request swap', 'error');
        throw error;
    }
}

// Generate duty roster (admin only)
async function generateDutyRoster(startDate, endDate) {
    try {
        const response = await api.admin.generateDutyRoster(startDate, endDate);
        showToast(`✅ Generated ${response.data.rosters.length} rosters`, 'success');
        
        // Show understaffed alerts
        if (response.data.understaffed?.length > 0) {
            showToast(`⚠️ ${response.data.understaffed.length} understaffed slots detected`, 'warning');
        }
        
        return response;
    } catch (error) {
        showToast(error.message || 'Failed to generate roster', 'error');
        throw error;
    }
}

// Get fairness report (admin only)
async function loadFairnessReport() {
    try {
        const response = await api.admin.getFairnessReport();
        return response.data;
    } catch (error) {
        console.error('Failed to load fairness report:', error);
        showToast('Failed to load fairness report', 'error');
        return null;
    }
}

// Get understaffed areas (admin only)
async function loadUnderstaffedAreas() {
    try {
        const response = await api.admin.getUnderstaffedAreas();
        return response.data;
    } catch (error) {
        console.error('Failed to load understaffed areas:', error);
        return [];
    }
}

// Get teacher workload (admin only)
async function loadTeacherWorkload() {
    try {
        const response = await api.admin.getTeacherWorkload();
        return response.data;
    } catch (error) {
        console.error('Failed to load teacher workload:', error);
        return [];
    }
}

// Manual duty adjustment (admin only)
async function manualAdjustDuty(date, teacherId, newTeacherId, dutyType, reason, newTeacherName) {
    try {
        const response = await api.admin.manualAdjustDuty({
            date,
            teacherId,
            newTeacherId,
            dutyType,
            reason,
            newTeacherName
        });
        showToast('✅ Duty adjusted successfully', 'success');
        return response;
    } catch (error) {
        showToast(error.message || 'Failed to adjust duty', 'error');
        throw error;
    }
}

// Update UI based on duty status
function updateDutyStatus(status) {
    const dutyCard = document.getElementById('duty-card');
    if (!dutyCard) return;
    
    const statusSpan = dutyCard.querySelector('.duty-status');
    const checkInBtn = document.getElementById('check-in-btn');
    const checkOutBtn = document.getElementById('check-out-btn');
    
    if (status === 'checked-in') {
        if (statusSpan) {
            statusSpan.textContent = 'Checked In';
            statusSpan.className = 'duty-status px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full';
        }
        if (checkInBtn) checkInBtn.disabled = true;
        if (checkOutBtn) checkOutBtn.disabled = false;
    } else if (status === 'checked-out') {
        if (statusSpan) {
            statusSpan.textContent = 'Checked Out';
            statusSpan.className = 'duty-status px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full';
        }
        if (checkInBtn) checkInBtn.disabled = true;
        if (checkOutBtn) checkOutBtn.disabled = true;
    } else {
        if (statusSpan) {
            statusSpan.textContent = 'Not Checked In';
            statusSpan.className = 'duty-status px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full';
        }
        if (checkInBtn) checkInBtn.disabled = false;
        if (checkOutBtn) checkOutBtn.disabled = true;
    }
}

// Render duty preferences form
function renderDutyPreferencesForm(preferences = {}) {
    return `
        <div class="space-y-4">
            <div>
                <label class="block text-sm font-medium mb-1">Preferred Days</label>
                <div class="flex flex-wrap gap-2">
                    ${['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => `
                        <label class="flex items-center gap-1">
                            <input type="checkbox" value="${day.toLowerCase()}" 
                                ${preferences.preferredDays?.includes(day.toLowerCase()) ? 'checked' : ''}>
                            <span class="text-sm">${day}</span>
                        </label>
                    `).join('')}
                </div>
            </div>
            
            <div>
                <label class="block text-sm font-medium mb-1">Preferred Areas</label>
                <div class="flex flex-wrap gap-2">
                    ${['morning', 'lunch', 'afternoon', 'whole_day'].map(area => `
                        <label class="flex items-center gap-1">
                            <input type="checkbox" value="${area}" 
                                ${preferences.preferredAreas?.includes(area) ? 'checked' : ''}>
                            <span class="text-sm">${area.replace('_', ' ').charAt(0).toUpperCase() + area.replace('_', ' ').slice(1)}</span>
                        </label>
                    `).join('')}
                </div>
            </div>
            
            <div>
                <label class="block text-sm font-medium mb-1">Max Duties Per Week</label>
                <input type="number" id="max-duties" value="${preferences.maxDutiesPerWeek || 3}" 
                    min="1" max="5" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
            </div>
            
            <div>
                <label class="block text-sm font-medium mb-1">Blackout Dates</label>
                <input type="date" id="blackout-date" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                <button onclick="addBlackoutDate()" class="mt-2 text-sm text-primary hover:underline">Add Date</button>
                <div id="blackout-dates-list" class="mt-2 space-y-1">
                    ${(preferences.blackoutDates || []).map(date => `
                        <div class="flex justify-between items-center p-2 bg-muted/30 rounded">
                            <span class="text-sm">${new Date(date).toLocaleDateString()}</span>
                            <button onclick="removeBlackoutDate('${date}')" class="text-red-600">
                                <i data-lucide="x" class="h-4 w-4"></i>
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <button onclick="saveDutyPreferences()" class="w-full bg-primary text-primary-foreground py-2 rounded-lg">
                Save Preferences
            </button>
        </div>
    `;
}

// ============ DUTY ROSTER GENERATION ============
window.handleGenerateDutyRoster = async function() {
    const startDate = document.getElementById('duty-start-date')?.value;
    const endDate = document.getElementById('duty-end-date')?.value;
    
    if (!startDate || !endDate) {
        showToast('Please select start and end dates', 'error');
        return;
    }
    
    showLoading();
    try {
        // Ensure user is defined – get from localStorage if needed
        const user = getCurrentUser();
        if (!user) {
            throw new Error('User not authenticated');
        }
        
        const response = await api.admin.generateDutyRoster(startDate, endDate);
        
        if (response.success) {
            showToast(`✅ Generated ${response.data.rosters?.length || 0} duty rosters`, 'success');
            if (response.data.understaffed?.length > 0) {
                showToast(`⚠️ ${response.data.understaffed.length} understaffed slots detected`, 'warning');
            }
            // Refresh the duty section to show new data
            await showDashboardSection('duty');
        } else {
            throw new Error(response.message || 'Generation failed');
        }
    } catch (error) {
        console.error('Generate roster error:', error);
        showToast(error.message || 'Failed to generate duty roster', 'error');
    } finally {
        hideLoading();
    }
};

// Export functions
window.loadTodayDuty = loadTodayDuty;
window.loadWeeklyDuty = loadWeeklyDuty;
window.checkInDuty = checkInDuty;
window.checkOutDuty = checkOutDuty;
window.updateDutyPreferences = updateDutyPreferences;
window.requestDutySwap = requestDutySwap;
window.generateDutyRoster = generateDutyRoster;
window.loadFairnessReport = loadFairnessReport;
window.loadUnderstaffedAreas = loadUnderstaffedAreas;
window.loadTeacherWorkload = loadTeacherWorkload;
window.manualAdjustDuty = manualAdjustDuty;
