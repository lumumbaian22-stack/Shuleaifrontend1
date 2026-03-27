 // duty-points.js - Duty points system and weighted roster generation

let dutyPoints = {
    teachers: {},
    areas: {
        'morning': { basePoints: 10, multiplier: 1 },
        'lunch': { basePoints: 15, multiplier: 1.5 },
        'afternoon': { basePoints: 12, multiplier: 1.2 },
        'whole_day': { basePoints: 25, multiplier: 2.5 }
    }
};

function loadDutyPoints() {
    try {
        const saved = localStorage.getItem('dutyPoints');
        if (saved) dutyPoints = JSON.parse(saved);
    } catch (error) { console.error('Error loading duty points:', error); }
}

function saveDutyPoints() {
    localStorage.setItem('dutyPoints', JSON.stringify(dutyPoints));
}

function updateTeacherDutyPoints(teacherId, points, reason) {
    if (!dutyPoints.teachers[teacherId]) {
        dutyPoints.teachers[teacherId] = { points: 0, history: [], preferences: {}, rating: 0 };
    }
    dutyPoints.teachers[teacherId].points += points;
    dutyPoints.teachers[teacherId].history.push({
        date: new Date().toISOString(),
        points: points,
        reason: reason,
        total: dutyPoints.teachers[teacherId].points
    });
    saveDutyPoints();
    showToast(`Added ${points} points to teacher`, 'success');
    refreshDutyPointsDisplay();
}

function getTeacherDutyPoints(teacherId) {
    return dutyPoints.teachers[teacherId]?.points || 0;
}

function renderDutyPointsManagement() {
    const teachers = dashboardData?.teachers || [];
    return `
        <div class="space-y-6 animate-fade-in">
            <div class="flex justify-between items-center">
                <h2 class="text-2xl font-bold">Duty Points Management</h2>
                <button onclick="resetDutyPoints()" class="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200">
                    Reset All Points
                </button>
            </div>
            <div class="grid gap-6">
                <div class="rounded-xl border bg-card p-6">
                    <h3 class="font-semibold mb-4">Manual Point Assignment</h3>
                    <div class="grid gap-4 md:grid-cols-3">
                        <div>
                            <label class="block text-sm font-medium mb-1">Select Teacher</label>
                            <select id="point-teacher" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                                <option value="">-- Select Teacher --</option>
                                ${teachers.map(t => `<option value="${t.id}">${t.User?.name || 'Unknown'}</option>`).join('')}
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium mb-1">Points to Add</label>
                            <input type="number" id="point-amount" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" placeholder="e.g., 10, -5">
                        </div>
                        <div>
                            <label class="block text-sm font-medium mb-1">Reason</label>
                            <input type="text" id="point-reason" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" placeholder="e.g., Completed extra duty">
                        </div>
                    </div>
                    <button onclick="assignManualPoints()" class="mt-4 w-full bg-primary text-primary-foreground py-2 rounded-lg hover:bg-primary/90">
                        Assign Points
                    </button>
                </div>

                <div class="rounded-xl border bg-card p-6">
                    <h3 class="font-semibold mb-4">Duty Area Point Configuration</h3>
                    <div class="space-y-3">
                        <div class="grid gap-4 md:grid-cols-2">
                            <div class="p-3 bg-muted/30 rounded-lg">
                                <p class="font-medium">Morning Duty</p>
                                <p class="text-sm text-muted-foreground">Base Points: <span id="morning-points">${dutyPoints.areas.morning.basePoints}</span></p>
                                <input type="number" id="morning-points-input" value="${dutyPoints.areas.morning.basePoints}" class="mt-2 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm">
                                <button onclick="updateAreaPoints('morning')" class="mt-2 w-full text-sm bg-primary/10 text-primary py-1 rounded hover:bg-primary/20">Update</button>
                            </div>
                            <div class="p-3 bg-muted/30 rounded-lg">
                                <p class="font-medium">Lunch Duty</p>
                                <p class="text-sm text-muted-foreground">Base Points: <span id="lunch-points">${dutyPoints.areas.lunch.basePoints}</span></p>
                                <input type="number" id="lunch-points-input" value="${dutyPoints.areas.lunch.basePoints}" class="mt-2 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm">
                                <button onclick="updateAreaPoints('lunch')" class="mt-2 w-full text-sm bg-primary/10 text-primary py-1 rounded hover:bg-primary/20">Update</button>
                            </div>
                            <div class="p-3 bg-muted/30 rounded-lg">
                                <p class="font-medium">Afternoon Duty</p>
                                <p class="text-sm text-muted-foreground">Base Points: <span id="afternoon-points">${dutyPoints.areas.afternoon.basePoints}</span></p>
                                <input type="number" id="afternoon-points-input" value="${dutyPoints.areas.afternoon.basePoints}" class="mt-2 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm">
                                <button onclick="updateAreaPoints('afternoon')" class="mt-2 w-full text-sm bg-primary/10 text-primary py-1 rounded hover:bg-primary/20">Update</button>
                            </div>
                            <div class="p-3 bg-muted/30 rounded-lg">
                                <p class="font-medium">Whole Day Duty</p>
                                <p class="text-sm text-muted-foreground">Base Points: <span id="whole_day-points">${dutyPoints.areas.whole_day.basePoints}</span></p>
                                <input type="number" id="whole_day-points-input" value="${dutyPoints.areas.whole_day.basePoints}" class="mt-2 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm">
                                <button onclick="updateAreaPoints('whole_day')" class="mt-2 w-full text-sm bg-primary/10 text-primary py-1 rounded hover:bg-primary/20">Update</button>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="rounded-xl border bg-card overflow-hidden">
                    <div class="p-4 border-b">
                        <h3 class="font-semibold">Teacher Duty Points Leaderboard</h3>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="w-full text-sm">
                            <thead class="bg-muted/50">
                                <tr>
                                    <th class="px-4 py-3 text-left font-medium">Teacher</th>
                                    <th class="px-4 py-3 text-center font-medium">Total Points</th>
                                    <th class="px-4 py-3 text-center font-medium">Duties Completed</th>
                                    <th class="px-4 py-3 text-center font-medium">Reliability</th>
                                    <th class="px-4 py-3 text-right font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y" id="teacher-points-table">
                                ${teachers.map(t => {
                                    const points = dutyPoints.teachers[t.id]?.points || 0;
                                    const reliability = t.statistics?.reliabilityScore || 100;
                                    const dutiesCompleted = t.statistics?.dutiesCompleted || 0;
                                    return `
                                        <tr class="hover:bg-accent/50 transition-colors">
                                            <td class="px-4 py-3 font-medium">${t.User?.name || 'Unknown'}</td>
                                            <td class="px-4 py-3 text-center">
                                                <span class="font-bold text-lg ${points >= 100 ? 'text-green-600' : points >= 50 ? 'text-blue-600' : 'text-gray-600'}">
                                                    ${points}
                                                </span>
                                            </td>
                                            <td class="px-4 py-3 text-center">${dutiesCompleted}</td>
                                            <td class="px-4 py-3 text-center">
                                                <div class="flex items-center justify-center gap-2">
                                                    <div class="h-2 w-16 rounded-full bg-muted overflow-hidden">
                                                        <div class="h-full w-[${reliability}%] bg-green-500 rounded-full"></div>
                                                    </div>
                                                    <span>${reliability}%</span>
                                                </div>
                                            </td>
                                            <td class="px-4 py-3 text-right">
                                                <button onclick="showTeacherPointHistory('${t.id}')" class="p-2 hover:bg-accent rounded-lg" title="View History">
                                                    <i data-lucide="history" class="h-4 w-4"></i>
                                                </button>
                                                <button onclick="showAddPointsModal('${t.id}', '${t.User?.name}')" class="p-2 hover:bg-accent rounded-lg" title="Add Points">
                                                    <i data-lucide="plus-circle" class="h-4 w-4 text-green-600"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function assignManualPoints() {
    const teacherId = document.getElementById('point-teacher')?.value;
    const amount = parseInt(document.getElementById('point-amount')?.value);
    const reason = document.getElementById('point-reason')?.value;
    if (!teacherId || !amount) {
        showToast('Please select teacher and enter points', 'error');
        return;
    }
    updateTeacherDutyPoints(teacherId, amount, reason || 'Manual assignment');
    document.getElementById('point-amount').value = '';
    document.getElementById('point-reason').value = '';
}

function updateAreaPoints(area) {
    const inputId = `${area}-points-input`;
    const newPoints = parseInt(document.getElementById(inputId)?.value);
    if (!newPoints || newPoints < 0) {
        showToast('Please enter valid points', 'error');
        return;
    }
    dutyPoints.areas[area].basePoints = newPoints;
    saveDutyPoints();
    const spanId = `${area}-points`;
    if (document.getElementById(spanId)) document.getElementById(spanId).textContent = newPoints;
    showToast(`Updated ${area} duty points to ${newPoints}`, 'success');
}

async function generateDutyRosterWithPoints(startDate, endDate) {
    showLoading();
    try {
        const teachers = await loadAllTeachers();
        const availableTeachers = teachers.filter(t => t.approvalStatus === 'approved' && t.User?.isActive);
        const teacherWeights = availableTeachers.map(teacher => {
            const points = getTeacherDutyPoints(teacher.id);
            const reliability = teacher.statistics?.reliabilityScore || 100;
            const weight = Math.max(1, 100 - (points / 10) - (reliability / 2));
            return { teacher, points, reliability, weight, preferences: teacher.dutyPreferences || {} };
        });
        teacherWeights.sort((a, b) => a.weight - b.weight);
        const start = moment(startDate);
        const end = moment(endDate);
        const days = end.diff(start, 'days') + 1;
        const rosters = [];
        for (let i = 0; i < days; i++) {
            const currentDate = start.clone().add(i, 'days');
            if (currentDate.day() === 0) continue;
            const dateStr = currentDate.format('YYYY-MM-DD');
            const dayOfWeek = currentDate.format('dddd').toLowerCase();
            const dayDuties = [];
            const assignedTeachers = new Set();
            for (const [slot, config] of Object.entries(dutyPoints.areas)) {
                const required = 2;
                const basePoints = config.basePoints;
                const available = teacherWeights.filter(tw => !assignedTeachers.has(tw.teacher.id));
                const eligible = available.filter(tw => !(tw.preferences.blackoutDates || []).includes(dateStr));
                const weeklyEligible = eligible.filter(tw => {
                    const weeklyCount = tw.teacher.statistics?.weeklyDutyCount || 0;
                    const maxWeekly = tw.preferences.maxDutiesPerWeek || 3;
                    return weeklyCount < maxWeekly;
                });
                const selected = weeklyEligible.slice(0, required);
                selected.forEach(tw => {
                    dayDuties.push({
                        teacherId: tw.teacher.id,
                        teacherName: tw.teacher.User?.name || 'Unknown',
                        type: slot,
                        area: slot === 'morning' ? 'Main Gate / Assembly Area' :
                              slot === 'lunch' ? 'Dining Hall / Playground' :
                              slot === 'afternoon' ? 'School Compound' : 'General Supervision',
                        timeSlot: { start: slot === 'morning' ? '07:30' : slot === 'lunch' ? '12:30' : slot === 'afternoon' ? '15:30' : '07:30',
                                    end: slot === 'morning' ? '08:30' : slot === 'lunch' ? '14:00' : slot === 'afternoon' ? '16:30' : '16:30' },
                        pointsEarned: basePoints,
                        status: 'scheduled'
                    });
                    assignedTeachers.add(tw.teacher.id);
                    updateTeacherDutyPoints(tw.teacher.id, basePoints, `${slot} duty on ${dateStr}`);
                });
            }
            if (dayDuties.length > 0) {
                rosters.push({ date: dateStr, duties: dayDuties, totalPoints: dayDuties.reduce((sum, d) => sum + d.pointsEarned, 0) });
            }
        }
        localStorage.setItem('dutyRoster', JSON.stringify(rosters));
        showToast(`✅ Generated ${rosters.length} days of duty roster with point-based assignment`, 'success');
        await showDashboardSection('duty');
    } catch (error) {
        console.error('Error generating duty roster:', error);
        showToast(error.message || 'Failed to generate duty roster', 'error');
    } finally {
        hideLoading();
    }
}

function loadDutyRoster() {
    try {
        const saved = localStorage.getItem('dutyRoster');
        return saved ? JSON.parse(saved) : [];
    } catch (error) { return []; }
}

window.resetDutyPoints = function() {
    if (!confirm('⚠️ Are you sure you want to reset ALL duty points for ALL teachers? This action cannot be undone.')) return;
    dutyPoints = {
        teachers: {},
        areas: { morning: { basePoints: 10, multiplier: 1 }, lunch: { basePoints: 15, multiplier: 1.5 }, afternoon: { basePoints: 12, multiplier: 1.2 }, whole_day: { basePoints: 25, multiplier: 2.5 } }
    };
    saveDutyPoints();
    refreshDutyPointsDisplay();
    showToast('All duty points have been reset', 'info');
};

window.showTeacherPointHistory = function(teacherId) {
    const teacher = dutyPoints.teachers[teacherId];
    if (!teacher || !teacher.history || teacher.history.length === 0) {
        showToast('No history available for this teacher', 'info');
        return;
    }
    alert(`Point History:\n${teacher.history.map(h => `${h.points > 0 ? '+' : ''}${h.points}: ${h.reason} (${formatDate(h.date)})`).join('\n')}`);
};

window.showAddPointsModal = function(teacherId, teacherName) {
    const points = prompt(`Enter points to add for ${teacherName}:`, '10');
    if (points === null) return;
    const amount = parseInt(points);
    if (isNaN(amount)) { showToast('Please enter a valid number', 'error'); return; }
    const reason = prompt('Enter reason for adding points:', 'Manual adjustment');
    if (reason === null) return;
    updateTeacherDutyPoints(teacherId, amount, reason);
};

function refreshDutyPointsDisplay() {
    const container = document.getElementById('teacher-points-table');
    if (!container) return;
    const teachers = dashboardData?.teachers || [];
    let html = '';
    teachers.forEach(t => {
        const points = dutyPoints.teachers[t.id]?.points || 0;
        const reliability = t.statistics?.reliabilityScore || 100;
        const dutiesCompleted = t.statistics?.dutiesCompleted || 0;
        html += `
            <tr class="hover:bg-accent/50 transition-colors">
                <td class="px-4 py-3 font-medium">${t.User?.name || 'Unknown'}</td>
                <td class="px-4 py-3 text-center">
                    <span class="font-bold text-lg ${points >= 100 ? 'text-green-600' : points >= 50 ? 'text-blue-600' : 'text-gray-600'}">
                        ${points}
                    </span>
                </td>
                <td class="px-4 py-3 text-center">${dutiesCompleted}</td>
                <td class="px-4 py-3 text-center">
                    <div class="flex items-center justify-center gap-2">
                        <div class="h-2 w-16 rounded-full bg-muted overflow-hidden">
                            <div class="h-full w-[${reliability}%] bg-green-500 rounded-full"></div>
                        </div>
                        <span>${reliability}%</span>
                    </div>
                </td>
                <td class="px-4 py-3 text-right">
                    <button onclick="showTeacherPointHistory('${t.id}')" class="p-2 hover:bg-accent rounded-lg"><i data-lucide="history" class="h-4 w-4"></i></button>
                    <button onclick="showAddPointsModal('${t.id}', '${t.User?.name}')" class="p-2 hover:bg-accent rounded-lg"><i data-lucide="plus-circle" class="h-4 w-4 text-green-600"></i></button>
                </td>
            </tr>
        `;
    });
    container.innerHTML = html;
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

window.renderDutyPreferencesForm = function(preferences) {
    return `
        <div class="space-y-4">
            <div>
                <label class="block text-sm font-medium mb-1">Preferred Days</label>
                <div class="flex flex-wrap gap-3">
                    ${['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => `
                        <label class="flex items-center gap-2">
                            <input type="checkbox" name="preferredDays" value="${day.toLowerCase()}" ${preferences.preferredDays?.includes(day.toLowerCase()) ? 'checked' : ''} class="rounded border-input">
                            <span class="text-sm">${day}</span>
                        </label>
                    `).join('')}
                </div>
            </div>
            <div>
                <label class="block text-sm font-medium mb-1">Preferred Duty Areas</label>
                <div class="flex flex-wrap gap-3">
                    ${[
                        { value: 'morning', label: 'Morning (7:30-8:30)' },
                        { value: 'lunch', label: 'Lunch (12:30-14:00)' },
                        { value: 'afternoon', label: 'Afternoon (15:30-16:30)' },
                        { value: 'whole_day', label: 'Whole Day' }
                    ].map(area => `
                        <label class="flex items-center gap-2">
                            <input type="checkbox" name="preferredAreas" value="${area.value}" ${preferences.preferredAreas?.includes(area.value) ? 'checked' : ''} class="rounded border-input">
                            <span class="text-sm">${area.label}</span>
                        </label>
                    `).join('')}
                </div>
            </div>
            <div>
                <label class="block text-sm font-medium mb-1">Max Duties Per Week</label>
                <input type="number" id="max-duties" value="${preferences.maxDutiesPerWeek || 3}" min="1" max="5" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
            </div>
            <div>
                <label class="block text-sm font-medium mb-1">Blackout Dates (Cannot do duty)</label>
                <div class="flex gap-2">
                    <input type="date" id="blackout-date" class="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm">
                    <button type="button" onclick="addBlackoutDate()" class="px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm">Add</button>
                </div>
                <div id="blackout-dates-list" class="mt-2 space-y-1">
                    ${(preferences.blackoutDates || []).map(date => `
                        <div class="flex justify-between items-center p-2 bg-muted/30 rounded">
                            <span class="text-sm">${new Date(date).toLocaleDateString()}</span>
                            <button type="button" onclick="removeBlackoutDate('${date}')" class="text-red-600"><i data-lucide="x" class="h-4 w-4"></i></button>
                        </div>
                    `).join('')}
                </div>
            </div>
            <button type="button" onclick="saveDutyPreferences()" class="w-full bg-primary text-primary-foreground py-2 rounded-lg hover:bg-primary/90">Save Preferences</button>
        </div>
    `;
};

window.addBlackoutDate = function() {
    const dateInput = document.getElementById('blackout-date');
    const date = dateInput?.value;
    if (!date) { showToast('Please select a date', 'error'); return; }
    const listContainer = document.getElementById('blackout-dates-list');
    if (listContainer) {
        if (listContainer.innerHTML.includes(date)) { showToast('Date already added', 'warning'); return; }
        listContainer.innerHTML += `
            <div class="flex justify-between items-center p-2 bg-muted/30 rounded">
                <span class="text-sm">${new Date(date).toLocaleDateString()}</span>
                <button onclick="removeBlackoutDate('${date}')" class="text-red-600"><i data-lucide="x" class="h-4 w-4"></i></button>
            </div>
        `;
        dateInput.value = '';
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
};

window.removeBlackoutDate = function(date) {
    const listContainer = document.getElementById('blackout-dates-list');
    if (listContainer) {
        const item = Array.from(listContainer.children).find(div => div.textContent.includes(new Date(date).toLocaleDateString()));
        if (item) item.remove();
    }
};

window.generateDutyRoster = generateDutyRosterWithPoints;
window.loadDutyPoints = loadDutyPoints;
window.saveDutyPoints = saveDutyPoints;
window.updateTeacherDutyPoints = updateTeacherDutyPoints;
window.getTeacherDutyPoints = getTeacherDutyPoints;
window.renderDutyPointsManagement = renderDutyPointsManagement;
window.assignManualPoints = assignManualPoints;
window.updateAreaPoints = updateAreaPoints;
window.loadDutyRoster = loadDutyRoster;
window.refreshDutyPointsDisplay = refreshDutyPointsDisplay;

loadDutyPoints();