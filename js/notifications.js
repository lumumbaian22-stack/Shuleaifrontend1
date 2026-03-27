// notifications.js - Complete notification system with UI panel

let notifications = [];
let unreadCount = 0;

async function loadNotifications() {
    try {
        const user = getCurrentUser();
        if (!user) return [];

        // In a real implementation, fetch from API
        const stored = localStorage.getItem(`notifications_${user.role}_${user.schoolCode || 'super'}`);

        if (stored) {
            notifications = JSON.parse(stored);
        } else {
            notifications = getSampleNotifications(user.role);
            localStorage.setItem(`notifications_${user.role}_${user.schoolCode || 'super'}`, JSON.stringify(notifications));
        }

        updateUnreadCount();
        return notifications;
    } catch (error) {
        console.error('Failed to load notifications:', error);
        return [];
    }
}

function getSampleNotifications(role) {
    const now = new Date();
    const samples = {
        superadmin: [
            { id: 1, type: 'system', title: 'New School Registered', message: 'Mombasa Academy has registered and is pending approval', timestamp: new Date(now - 3600000).toISOString(), read: false, actionable: true, action: 'approve_school', data: { schoolId: 123 } },
            { id: 2, type: 'approval', title: 'Name Change Request', message: 'Nairobi High School requests name change to "Nairobi Academy"', timestamp: new Date(now - 86400000).toISOString(), read: false, actionable: true, action: 'review_name_change', data: { requestId: 456 } }
        ],
        admin: [
            { id: 1, type: 'approval', title: 'New Teacher Signup', message: 'Jane Doe has requested to join as Mathematics teacher', timestamp: new Date(now - 7200000).toISOString(), read: false, actionable: true, action: 'approve_teacher', data: { teacherId: 789 } },
            { id: 2, type: 'duty', title: 'Duty Roster Updated', message: 'Next week\'s duty roster has been generated', timestamp: new Date(now - 172800000).toISOString(), read: true, actionable: false },
            { id: 3, type: 'attendance', title: 'Low Attendance Alert', message: 'Grade 10A has below 80% attendance this week', timestamp: new Date(now - 259200000).toISOString(), read: false, actionable: true, action: 'view_attendance', data: { classId: '10A' } }
        ],
        teacher: [
            { id: 1, type: 'duty', title: 'Duty Assignment', message: 'You are assigned to morning duty tomorrow', timestamp: new Date(now - 10800000).toISOString(), read: false, actionable: true, action: 'view_duty', data: { dutyId: 101 } },
            { id: 2, type: 'message', title: 'New Message', message: 'Ms. Atieno sent you a message', timestamp: new Date(now - 3600000).toISOString(), read: false, actionable: true, action: 'open_chat', data: { senderId: 202 } }
        ],
        parent: [
            { id: 1, type: 'attendance', title: 'Attendance Update', message: 'Sarah was marked present today', timestamp: new Date(now - 14400000).toISOString(), read: true, actionable: false },
            { id: 2, type: 'payment', title: 'Fee Reminder', message: 'Term 2 fees are due in 7 days', timestamp: new Date(now - 86400000).toISOString(), read: false, actionable: true, action: 'make_payment', data: { studentId: 303 } }
        ],
        student: [
            { id: 1, type: 'alert', title: 'Homework Due', message: 'Mathematics assignment due tomorrow', timestamp: new Date(now - 43200000).toISOString(), read: false, actionable: true, action: 'view_homework', data: { homeworkId: 404 } }
        ]
    };
    return samples[role] || [];
}

async function saveNotifications() {
    const user = getCurrentUser();
    if (!user) return;
    localStorage.setItem(`notifications_${user.role}_${user.schoolCode || 'super'}`, JSON.stringify(notifications));
    updateUnreadCount();
}

async function markAsRead(notificationId) {
    const notification = notifications.find(n => n.id === notificationId);
    if (notification && !notification.read) {
        notification.read = true;
        await saveNotifications();
        renderNotificationsPanel();
    }
}

async function markAllAsRead() {
    notifications.forEach(n => n.read = true);
    await saveNotifications();
    renderNotificationsPanel();
    showToast('All notifications marked as read', 'success');
}

async function deleteNotification(notificationId) {
    notifications = notifications.filter(n => n.id !== notificationId);
    await saveNotifications();
    renderNotificationsPanel();
}

async function clearAllNotifications() {
    if (notifications.length === 0) return;
    if (confirm('Clear all notifications?')) {
        notifications = [];
        await saveNotifications();
        renderNotificationsPanel();
        showToast('All notifications cleared', 'info');
    }
}

function updateUnreadCount() {
    unreadCount = notifications.filter(n => !n.read).length;
    const badge = document.getElementById('notification-badge');
    if (badge) {
        if (unreadCount > 0) {
            badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }
}

function toggleNotifications() {
    let panel = document.getElementById('notifications-panel');

    if (!panel) {
        createNotificationsPanel();
        panel = document.getElementById('notifications-panel');
    }

    if (panel.classList.contains('hidden')) {
        renderNotificationsPanel();
        panel.classList.remove('hidden');
        markAllAsRead();
    } else {
        panel.classList.add('hidden');
    }
}

function createNotificationsPanel() {
    const panelHTML = `
        <div id="notifications-panel" class="fixed right-4 top-16 z-50 w-96 max-w-[calc(100vw-2rem)] bg-card border rounded-xl shadow-2xl hidden animate-fade-in">
            <div class="flex flex-col h-[500px]">
                <div class="p-4 border-b flex justify-between items-center">
                    <h3 class="font-semibold">Notifications</h3>
                    <div class="flex gap-2">
                        <button onclick="markAllAsRead()" class="text-xs text-primary hover:underline">Mark all read</button>
                        <button onclick="clearAllNotifications()" class="text-xs text-red-600 hover:underline">Clear all</button>
                    </div>
                </div>
                <div id="notifications-list" class="flex-1 overflow-y-auto"></div>
                <div class="p-3 border-t text-center">
                    <button onclick="viewAllNotifications()" class="text-xs text-primary hover:underline">View all notifications</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', panelHTML);
}

function renderNotificationsPanel() {
    const container = document.getElementById('notifications-list');
    if (!container) return;

    if (notifications.length === 0) {
        container.innerHTML = `
            <div class="p-8 text-center">
                <i data-lucide="bell-off" class="h-12 w-12 mx-auto text-muted-foreground mb-3"></i>
                <p class="text-muted-foreground">No notifications</p>
            </div>
        `;
        if (typeof lucide !== 'undefined') lucide.createIcons();
        return;
    }

    container.innerHTML = notifications.map(notification => `
        <div class="p-4 border-b hover:bg-accent/50 transition-colors ${!notification.read ? 'bg-primary/5' : ''}" onclick="markAsRead('${notification.id}')">
            <div class="flex gap-3">
                <div class="h-10 w-10 rounded-full ${getNotificationBg(notification.type)} flex items-center justify-center flex-shrink-0">
                    <i data-lucide="${getNotificationIcon(notification.type)}" class="h-5 w-5 ${getNotificationColor(notification.type)}"></i>
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium">${notification.title}</p>
                    <p class="text-xs text-muted-foreground mt-1">${notification.message}</p>
                    <p class="text-xs text-muted-foreground mt-2">${timeAgo(notification.timestamp)}</p>
                </div>
                ${!notification.read ? '<span class="h-2 w-2 bg-primary rounded-full flex-shrink-0 mt-2"></span>' : ''}
            </div>
        </div>
    `).join('');

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function getNotificationIcon(type) {
    const icons = { system: 'settings', alert: 'alert-triangle', message: 'message-circle', duty: 'clock', approval: 'check-circle', attendance: 'calendar-check', payment: 'credit-card' };
    return icons[type] || 'bell';
}
function getNotificationBg(type) {
    const bgs = { system: 'bg-gray-100', alert: 'bg-red-100', message: 'bg-blue-100', duty: 'bg-amber-100', approval: 'bg-green-100', attendance: 'bg-purple-100', payment: 'bg-emerald-100' };
    return bgs[type] || 'bg-gray-100';
}
function getNotificationColor(type) {
    const colors = { system: 'text-gray-600', alert: 'text-red-600', message: 'text-blue-600', duty: 'text-amber-600', approval: 'text-green-600', attendance: 'text-purple-600', payment: 'text-emerald-600' };
    return colors[type] || 'text-gray-600';
}

function viewAllNotifications() {
    showDashboardSection('notifications');
    const panel = document.getElementById('notifications-panel');
    if (panel) panel.classList.add('hidden');
}

window.loadNotifications = loadNotifications;
window.markAsRead = markAsRead;
window.markAllAsRead = markAllAsRead;
window.deleteNotification = deleteNotification;
window.clearAllNotifications = clearAllNotifications;
window.toggleNotifications = toggleNotifications;
window.renderNotificationsPanel = renderNotificationsPanel;
