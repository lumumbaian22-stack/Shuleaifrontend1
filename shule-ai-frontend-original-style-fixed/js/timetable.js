// Timetable Management

let currentTimetable = null;

async function loadTimetableForWeek(weekStart) {
    const res = await apiRequest(`/api/timetable?weekStartDate=${weekStart}`);
    if (res.success) {
        currentTimetable = res.data; // { id, slots, isPublished }
        renderTimetableGrid(currentTimetable.slots);
    } else {
        showToast('Failed to load timetable', 'error');
    }
}

function renderTimetableGrid(slots) {
    const container = document.getElementById('timetable-grid');
    if (!container) return;
    const days = ['monday','tuesday','wednesday','thursday','friday'];
    const periods = ['08:00-09:00','09:00-10:00','10:00-11:00','11:00-12:00','12:00-13:00','14:00-15:00','15:00-16:00'];
    let html = '<table class="w-full text-sm border"><thead><tr><th>Time</th>'+days.map(d=>'<th>'+d.charAt(0).toUpperCase()+d.slice(1)+'</th>').join('')+'</tr></thead><tbody>';
    for (let p=0; p<periods.length; p++) {
        html += '<tr><td class="border p-1">'+periods[p]+'</td>';
        for (let d=0; d<days.length; d++) {
            const daySlots = slots.find(s=>s.day===days[d]);
            const periodSlots = daySlots ? daySlots.periods.filter(per=>per.startTime===periods[p].split('-')[0]) : [];
            const content = periodSlots.length>0 ? periodSlots.map(ps=>`${ps.className}-${ps.subject} (${ps.teacherName})`).join(', ') : '';
            html += `<td class="border p-1 text-xs ${content ? 'bg-blue-50' : ''}" onclick="editSlot('${days[d]}','${periods[p].split('-')[0]}')">${content || '<span class="text-muted-foreground">-</span>'}</td>`;
        }
        html += '</tr>';
    }
    html += '</tbody></table>';
    container.innerHTML = html;
}

function editSlot(day, startTime) {
    const newTeacherId = prompt('Enter teacher ID for this slot (or leave empty to clear):');
    const newSubject = prompt('Subject:');
    // Update currentTimetable.slots directly and then call API to save
    // In production, call manual update
    // For simplicity, we'll just update the data and refresh
    const teacher = { id: parseInt(newTeacherId), name: 'Temporary' };
    const period = { subject: newSubject, teacherId: teacher.id, teacherName: teacher.name, startTime, endTime: startTime+':59' };
    // Update the slot data locally
    // Then call API to persist
}
