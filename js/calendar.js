// calendar.js - Enhanced calendar with events

// Calendar state
let calendarState = {
    currentDate: new Date(),
    viewMode: 'month',
    selectedDate: null
};

const calendarColors = [
    { bg: 'bg-blue-100 dark:bg-blue-900/30', border: 'border-blue-500', text: 'text-blue-700', dot: 'bg-blue-500' },
    { bg: 'bg-green-100 dark:bg-green-900/30', border: 'border-green-500', text: 'text-green-700', dot: 'bg-green-500' },
    { bg: 'bg-purple-100 dark:bg-purple-900/30', border: 'border-purple-500', text: 'text-purple-700', dot: 'bg-purple-500' },
    { bg: 'bg-amber-100 dark:bg-amber-900/30', border: 'border-amber-500', text: 'text-amber-700', dot: 'bg-amber-500' },
    { bg: 'bg-pink-100 dark:bg-pink-900/30', border: 'border-pink-500', text: 'text-pink-700', dot: 'bg-pink-500' },
    { bg: 'bg-indigo-100 dark:bg-indigo-900/30', border: 'border-indigo-500', text: 'text-indigo-700', dot: 'bg-indigo-500' }
];

// Load events from localStorage
function loadCalendarEvents() {
    try {
        const events = localStorage.getItem('calendarEvents');
        return events ? JSON.parse(events) : [];
    } catch (error) {
        console.error('Error loading calendar events:', error);
        return [];
    }
}

function saveCalendarEvents(events) {
    localStorage.setItem('calendarEvents', JSON.stringify(events));
}

function renderAdminCalendar() {
    const events = loadCalendarEvents();
    const year = calendarState.currentDate.getFullYear();
    const month = calendarState.currentDate.getMonth();

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    const currentMonth = monthNames[month];
    const currentYear = year;

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    let calendarDays = [];

    // Previous month days
    for (let i = firstDay - 1; i >= 0; i--) {
        const day = daysInPrevMonth - i;
        const date = new Date(year, month - 1, day);
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayEvents = events.filter(e => e.date === dateStr);

        calendarDays.push(renderEnhancedCalendarDay({
            dayNumber: day,
            isCurrentMonth: false,
            isToday: false,
            events: dayEvents,
            date: date,
            dateStr: dateStr
        }));
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const date = new Date(year, month, day);
        const dayEvents = events.filter(e => e.date === dateStr);
        const isToday = date.toDateString() === new Date().toDateString();

        calendarDays.push(renderEnhancedCalendarDay({
            dayNumber: day,
            isCurrentMonth: true,
            isToday: isToday,
            events: dayEvents,
            date: date,
            dateStr: dateStr
        }));
    }

    // Next month days (to fill grid)
    const totalCells = calendarDays.length;
    const remainingCells = 42 - totalCells;
    for (let day = 1; day <= remainingCells; day++) {
        const dateStr = `${year}-${String(month + 2).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayEvents = events.filter(e => e.date === dateStr);

        calendarDays.push(renderEnhancedCalendarDay({
            dayNumber: day,
            isCurrentMonth: false,
            isToday: false,
            events: dayEvents,
            date: new Date(year, month + 1, day),
            dateStr: dateStr
        }));
    }

    const upcomingEvents = getUpcomingEvents(events, 8);
    const totalEvents = events.length;
    const thisMonthEvents = events.filter(e => {
        const eventDate = new Date(e.date);
        return eventDate.getMonth() === month && eventDate.getFullYear() === year;
    }).length;

    return `
        <div class="space-y-6 animate-fade-in">
            <div class="relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white shadow-xl">
                <div class="absolute right-0 top-0 -mt-10 -mr-10 h-40 w-40 rounded-full bg-white/10"></div>
                <div class="absolute bottom-0 left-0 -mb-10 -ml-10 h-40 w-40 rounded-full bg-black/10"></div>
                <div class="relative z-10">
                    <h2 class="text-4xl font-bold">School Calendar</h2>
                    <p class="mt-2 text-white/80">Manage your school events and schedules</p>
                </div>
            </div>

            <div class="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-card p-4 shadow-sm border">
                <div class="flex items-center gap-3">
                    <button onclick="calendarChangeMonth(-1)" class="flex h-10 w-10 items-center justify-center rounded-lg bg-muted hover:bg-primary hover:text-primary-foreground transition-all">
                        <i data-lucide="chevron-left" class="h-5 w-5"></i>
                    </button>
                    <button onclick="calendarGoToToday()" class="h-10 px-4 rounded-lg bg-muted hover:bg-primary hover:text-primary-foreground transition-all font-medium">
                        Today
                    </button>
                    <button onclick="calendarChangeMonth(1)" class="flex h-10 w-10 items-center justify-center rounded-lg bg-muted hover:bg-primary hover:text-primary-foreground transition-all">
                        <i data-lucide="chevron-right" class="h-5 w-5"></i>
                    </button>
                    <h3 class="ml-2 text-2xl font-semibold">${currentMonth} ${currentYear}</h3>
                </div>
                <div class="flex items-center gap-3">
                    <div class="flex items-center gap-2 text-sm">
                        <span class="flex items-center gap-1"><span class="h-3 w-3 rounded-full bg-blue-500"></span> Event</span>
                        <span class="flex items-center gap-1"><span class="h-3 w-3 rounded-full bg-green-500"></span> Today</span>
                    </div>
                    <button onclick="showAddEventModal()" class="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90 transition-all shadow-md">
                        <i data-lucide="plus" class="h-4 w-4"></i>
                        <span>Add Event</span>
                    </button>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div class="lg:col-span-3 rounded-xl bg-card border shadow-lg overflow-hidden">
                    <div class="grid grid-cols-7 bg-gradient-to-r from-primary/5 to-purple-500/5 border-b">
                        ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => `
                            <div class="py-4 text-center font-semibold ${index === 0 ? 'text-red-500' : index === 6 ? 'text-red-500' : 'text-foreground'}">
                                ${day}
                            </div>
                        `).join('')}
                    </div>
                    <div class="grid grid-cols-7 divide-x divide-y">
                        ${calendarDays.join('')}
                    </div>
                </div>

                <div class="lg:col-span-1 space-y-6">
                    <div class="rounded-xl bg-card border shadow-lg p-4">
                        <h3 class="font-semibold mb-4 flex items-center gap-2 text-primary">
                            <i data-lucide="calendar" class="h-5 w-5"></i>
                            ${monthNames[new Date().getMonth()]}
                        </h3>
                        ${renderMiniCalendar()}
                    </div>
                    <div class="rounded-xl bg-card border shadow-lg p-4">
                        <h3 class="font-semibold mb-4 flex items-center gap-2 text-primary">
                            <i data-lucide="calendar-clock" class="h-5 w-5"></i>
                            Upcoming Events
                        </h3>
                        <div class="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                            ${upcomingEvents.length > 0 ? upcomingEvents.map(event => renderEnhancedEventCard(event)).join('') : renderEmptyState('No upcoming events')}
                        </div>
                    </div>
                    <div class="rounded-xl bg-card border shadow-lg p-4">
                        <h3 class="font-semibold mb-4 flex items-center gap-2 text-primary">
                            <i data-lucide="bar-chart-2" class="h-5 w-5"></i>
                            Overview
                        </h3>
                        <div class="grid grid-cols-2 gap-3">
                            ${renderStatCard('Total Events', totalEvents, 'bg-blue-100', 'text-blue-600', 'calendar')}
                            ${renderStatCard('This Month', thisMonthEvents, 'bg-green-100', 'text-green-600', 'trending-up')}
                            ${renderStatCard('Today', events.filter(e => isToday(e.date)).length, 'bg-amber-100', 'text-amber-600', 'sun')}
                            ${renderStatCard('This Week', events.filter(e => isThisWeek(e.date)).length, 'bg-purple-100', 'text-purple-600', 'calendar-check')}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderEnhancedCalendarDay(day) {
    const hasEvents = day.events.length > 0;
    const isWeekend = day.date.getDay() === 0 || day.date.getDay() === 6;
    const eventColor = hasEvents ? calendarColors[day.events[0]?.title?.length % calendarColors.length] : null;

    return `
        <div class="aspect-square p-2 ${!day.isCurrentMonth ? 'bg-muted/30' : 'bg-card'} 
                    ${day.isCurrentMonth ? 'hover:bg-accent/50' : ''} transition-all duration-200 cursor-pointer relative group 
                    border-2 ${day.isToday ? 'border-primary shadow-lg ring-2 ring-primary/20' : 'border-transparent'}"
             onclick="showDayDetails('${day.dateStr}')">
            <div class="flex justify-between items-start">
                <span class="text-sm font-medium ${!day.isCurrentMonth ? 'text-muted-foreground' : ''} 
                             ${day.isToday ? 'bg-primary text-primary-foreground w-7 h-7 flex items-center justify-center rounded-full shadow-sm' : ''}">
                    ${day.dayNumber}
                </span>
                ${hasEvents ? `
                    <div class="flex gap-0.5">
                        ${day.events.slice(0, 3).map((e, i) => {
                            const colors = ['bg-pink-500', 'bg-blue-500', 'bg-green-500', 'bg-purple-500'];
                            return `<span class="w-2 h-2 rounded-full ${colors[i % colors.length]} animate-pulse"></span>`;
                        }).join('')}
                        ${day.events.length > 3 ? '<span class="text-xs font-bold text-primary">+</span>' : ''}
                    </div>
                ` : ''}
            </div>
            ${hasEvents ? `
                <div class="mt-1 space-y-0.5">
                    ${day.events.slice(0, 2).map(event => `
                        <div class="text-[10px] truncate ${eventColor?.text || 'text-primary'} font-medium leading-tight">
                            • ${event.title}
                        </div>
                    `).join('')}
                </div>
            ` : ''}
            ${hasEvents && day.events.length > 2 ? `
                <div class="absolute -top-2 -right-2 w-5 h-5 bg-primary text-white text-xs rounded-full flex items-center justify-center font-bold shadow-lg animate-bounce">
                    ${day.events.length}
                </div>
            ` : ''}
            <div class="absolute z-20 bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-3 bg-popover border shadow-xl rounded-lg opacity-0 group-hover:opacity-100 transition-all pointer-events-none">
                <p class="text-xs font-semibold border-b pb-1 mb-2">
                    ${day.date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
                ${hasEvents ? `
                    <div class="space-y-1 max-h-32 overflow-y-auto">
                        ${day.events.slice(0, 4).map(e => `
                            <div class="text-xs flex items-center gap-1 py-0.5">
                                <span class="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0"></span>
                                <span class="truncate">${e.title}</span>
                            </div>
                        `).join('')}
                        ${day.events.length > 4 ? `<p class="text-xs text-primary mt-1">+${day.events.length - 4} more...</p>` : ''}
                    </div>
                ` : '<p class="text-xs text-muted-foreground">No events scheduled</p>'}
            </div>
        </div>
    `;
}

function renderEnhancedEventCard(event) {
    const eventDate = new Date(event.date);
    const isToday = eventDate.toDateString() === new Date().toDateString();
    const isTomorrow = new Date(eventDate.setDate(eventDate.getDate() - 1)).toDateString() === new Date().toDateString();

    let dateLabel = formatDate(event.date);
    if (isToday) dateLabel = 'Today';
    else if (isTomorrow) dateLabel = 'Tomorrow';

    const colors = [
        { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-l-blue-500', text: 'text-blue-700', icon: 'text-blue-500' },
        { bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-l-green-500', text: 'text-green-700', icon: 'text-green-500' },
        { bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-l-purple-500', text: 'text-purple-700', icon: 'text-purple-500' },
        { bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-l-amber-500', text: 'text-amber-700', icon: 'text-amber-500' },
        { bg: 'bg-pink-50 dark:bg-pink-900/20', border: 'border-l-pink-500', text: 'text-pink-700', icon: 'text-pink-500' }
    ];
    const colorIndex = event.title.length % colors.length;
    const color = colors[colorIndex];

    return `
        <div class="relative group overflow-hidden rounded-lg border-l-4 ${color.border} ${color.bg} hover:shadow-md transition-all p-3 cursor-pointer" onclick="showDayDetails('${event.date}')">
            <div class="flex justify-between items-start">
                <div class="flex-1 min-w-0">
                    <p class="font-semibold text-sm truncate">${event.title}</p>
                    <div class="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <span class="flex items-center gap-1">
                            <i data-lucide="calendar" class="h-3 w-3 ${color.icon}"></i>
                            ${dateLabel}
                        </span>
                        ${event.time ? `
                            <span class="flex items-center gap-1">
                                <i data-lucide="clock" class="h-3 w-3 ${color.icon}"></i>
                                ${event.time}
                            </span>
                        ` : ''}
                    </div>
                    ${event.description ? `
                        <p class="text-xs text-muted-foreground mt-2 line-clamp-2">${event.description.substring(0, 80)}${event.description.length > 80 ? '...' : ''}</p>
                    ` : ''}
                </div>
                <button onclick="event.stopPropagation(); deleteEvent('${event.id}')" class="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded-lg text-red-600 transition-all">
                    <i data-lucide="trash-2" class="h-3 w-3"></i>
                </button>
            </div>
            ${event.location ? `
                <div class="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                    <i data-lucide="map-pin" class="h-3 w-3 ${color.icon}"></i>
                    <span class="truncate">${event.location}</span>
                </div>
            ` : ''}
        </div>
    `;
}

function renderMiniCalendar() {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    let days = [];
    for (let i = 0; i < firstDay; i++) {
        days.push('<div class="aspect-square"></div>');
    }
    for (let d = 1; d <= daysInMonth; d++) {
        const isToday = d === today.getDate();
        days.push(`
            <div class="aspect-square flex items-center justify-center">
                <button onclick="calendarGoToDate(${year}, ${month}, ${d})" 
                    class="w-8 h-8 text-sm rounded-full flex items-center justify-center transition-all
                    ${isToday ? 'bg-primary text-primary-foreground font-bold shadow-md' : 'hover:bg-accent'}">
                    ${d}
                </button>
            </div>
        `);
    }

    return `
        <div class="grid grid-cols-7 gap-1 text-center">
            ${['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => `<div class="text-xs font-medium text-muted-foreground py-1">${day}</div>`).join('')}
            ${days.join('')}
        </div>
    `;
}

function renderStatCard(label, value, bgColor, textColor, icon) {
    return `
        <div class="p-3 ${bgColor} rounded-xl hover:shadow-lg transition-all transform hover:-translate-y-1">
            <div class="flex flex-col items-center text-center">
                <i data-lucide="${icon}" class="h-5 w-5 ${textColor} mb-1"></i>
                <p class="text-xl font-bold ${textColor}">${value}</p>
                <p class="text-xs text-muted-foreground mt-0.5">${label}</p>
            </div>
        </div>
    `;
}

function renderEmptyState(message) {
    return `
        <div class="text-center py-8">
            <i data-lucide="calendar-x" class="h-12 w-12 mx-auto text-muted-foreground mb-3"></i>
            <p class="text-sm text-muted-foreground">${message}</p>
        </div>
    `;
}

function getUpcomingEvents(events, limit = 10) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return events
        .filter(e => new Date(e.date) >= today)
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, limit);
}

function isToday(dateString) {
    const today = new Date();
    const date = new Date(dateString);
    return date.toDateString() === today.toDateString();
}

function isThisWeek(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    return date >= startOfWeek && date <= endOfWeek;
}

function showAddEventModal(prefillDate) {
    let modal = document.getElementById('add-event-modal');
    if (!modal) {
        createAddEventModal();
        modal = document.getElementById('add-event-modal');
    }

    if (prefillDate) {
        document.getElementById('event-date').value = prefillDate;
    } else {
        document.getElementById('event-date').value = new Date().toISOString().split('T')[0];
    }

    document.getElementById('event-title').value = '';
    document.getElementById('event-description').value = '';
    document.getElementById('event-time').value = '';
    document.getElementById('event-location').value = '';

    modal.classList.remove('hidden');
}

function createAddEventModal() {
    const modalHTML = `
        <div id="add-event-modal" class="fixed inset-0 z-50 hidden">
            <div class="absolute inset-0 bg-black/50" onclick="closeAddEventModal()"></div>
            <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md p-4">
                <div class="rounded-xl border bg-card p-6 shadow-xl animate-fade-in">
                    <h3 class="text-lg font-semibold mb-4">Add Calendar Event</h3>
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium mb-1">Event Title *</label>
                            <input type="text" id="event-title" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" required>
                        </div>
                        <div>
                            <label class="block text-sm font-medium mb-1">Date *</label>
                            <input type="date" id="event-date" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" required>
                        </div>
                        <div>
                            <label class="block text-sm font-medium mb-1">Time</label>
                            <input type="time" id="event-time" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                        </div>
                        <div>
                            <label class="block text-sm font-medium mb-1">Location</label>
                            <input type="text" id="event-location" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                        </div>
                        <div>
                            <label class="block text-sm font-medium mb-1">Description</label>
                            <textarea id="event-description" rows="3" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"></textarea>
                        </div>
                    </div>
                    <div class="flex justify-end gap-2 mt-6">
                        <button onclick="closeAddEventModal()" class="px-4 py-2 text-sm border rounded-lg hover:bg-accent">Cancel</button>
                        <button onclick="saveCalendarEvent()" class="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">Save Event</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeAddEventModal() {
    const modal = document.getElementById('add-event-modal');
    if (modal) modal.classList.add('hidden');
}

function saveCalendarEvent() {
    const title = document.getElementById('event-title')?.value;
    const date = document.getElementById('event-date')?.value;
    const time = document.getElementById('event-time')?.value;
    const location = document.getElementById('event-location')?.value;
    const description = document.getElementById('event-description')?.value;

    if (!title || !date) {
        showToast('Title and date are required', 'error');
        return;
    }

    const events = loadCalendarEvents();
    const newEvent = {
        id: Date.now().toString(),
        title,
        date,
        time,
        location,
        description,
        createdAt: new Date().toISOString()
    };

    events.push(newEvent);
    saveCalendarEvents(events);

    showToast('Event added successfully', 'success');
    closeAddEventModal();

    if (currentSection === 'calendar') {
        showDashboardSection('calendar');
    }
}

function deleteEvent(eventId) {
    if (!confirm('Delete this event?')) return;

    const events = loadCalendarEvents();
    const filtered = events.filter(e => e.id !== eventId);
    saveCalendarEvents(filtered);

    showToast('Event deleted', 'success');

    if (currentSection === 'calendar') {
        showDashboardSection('calendar');
    }
}

function showDayDetails(dateStr) {
    const events = loadCalendarEvents();
    const dayEvents = events.filter(e => e.date === dateStr);
    const date = new Date(dateStr);

    let modal = document.getElementById('day-details-modal');
    if (!modal) {
        createDayDetailsModal();
        modal = document.getElementById('day-details-modal');
    }

    const modalContent = modal.querySelector('.modal-content');
    if (modalContent) {
        modalContent.innerHTML = `
            <div class="space-y-4">
                <div class="border-b pb-3">
                    <h4 class="font-semibold text-lg">${date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</h4>
                </div>
                ${dayEvents.length > 0 ? `
                    <div class="space-y-2">
                        ${dayEvents.map(event => `
                            <div class="p-3 border rounded-lg">
                                <p class="font-medium">${event.title}</p>
                                ${event.time ? `<p class="text-sm text-muted-foreground">🕐 ${event.time}</p>` : ''}
                                ${event.location ? `<p class="text-sm text-muted-foreground">📍 ${event.location}</p>` : ''}
                                ${event.description ? `<p class="text-sm mt-2">${event.description}</p>` : ''}
                                <button onclick="deleteEvent('${event.id}')" class="mt-2 text-xs text-red-600 hover:underline">Delete</button>
                            </div>
                        `).join('')}
                    </div>
                ` : '<p class="text-center text-muted-foreground py-8">No events for this day</p>'}
                <button onclick="showAddEventModal('${dateStr}')" class="w-full mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
                    Add Event
                </button>
            </div>
        `;
    }

    modal.classList.remove('hidden');
}

function createDayDetailsModal() {
    const modalHTML = `
        <div id="day-details-modal" class="fixed inset-0 z-50 hidden">
            <div class="absolute inset-0 bg-black/50" onclick="closeDayDetailsModal()"></div>
            <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md p-4">
                <div class="rounded-xl border bg-card p-6 shadow-xl animate-fade-in">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-lg font-semibold">Day Details</h3>
                        <button onclick="closeDayDetailsModal()" class="p-2 hover:bg-accent rounded-lg">
                            <i data-lucide="x" class="h-5 w-5"></i>
                        </button>
                    </div>
                    <div class="modal-content">
                        <!-- Content will be filled dynamically -->
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeDayDetailsModal() {
    const modal = document.getElementById('day-details-modal');
    if (modal) modal.classList.add('hidden');
}

function calendarChangeMonth(direction) {
    if (calendarState && calendarState.currentDate) {
        calendarState.currentDate.setMonth(calendarState.currentDate.getMonth() + direction);
        showDashboardSection('calendar');
    } else {
        calendarState = { currentDate: new Date() };
        calendarState.currentDate.setMonth(calendarState.currentDate.getMonth() + direction);
        showDashboardSection('calendar');
    }
}

function calendarGoToToday() {
    if (calendarState) {
        calendarState.currentDate = new Date();
        showDashboardSection('calendar');
    } else {
        calendarState = { currentDate: new Date() };
        showDashboardSection('calendar');
    }
}

function calendarGoToDate(year, month, day) {
    if (calendarState) {
        calendarState.currentDate = new Date(year, month, day);
        showDashboardSection('calendar');
    } else {
        calendarState = { currentDate: new Date(year, month, day) };
        showDashboardSection('calendar');
    }
}

// Expose globally
window.renderAdminCalendar = renderAdminCalendar;
window.loadCalendarEvents = loadCalendarEvents;
window.saveCalendarEvents = saveCalendarEvents;
window.showDayDetails = showDayDetails;
window.closeDayDetailsModal = closeDayDetailsModal;
window.showAddEventModal = showAddEventModal;
window.closeAddEventModal = closeAddEventModal;
window.saveCalendarEvent = saveCalendarEvent;
window.deleteEvent = deleteEvent;
window.calendarChangeMonth = calendarChangeMonth;
window.calendarGoToToday = calendarGoToToday;
window.calendarGoToDate = calendarGoToDate;