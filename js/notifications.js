// notifications.js - Complete notification system

// ============ NOTIFICATION STATE ============

let notifications = [];
let unreadCount = 0;

// ============ NOTIFICATION TYPES ============

const NOTIFICATION_TYPES = {
    SYSTEM: 'system',
    ALERT: 'alert',
    MESSAGE: 'message',
    DUTY: 'duty',
    APPROVAL: 'approval',
    ATTENDANCE: 'attendance',
    PAYMENT: 'payment'
};

// ============ LOAD NOTIFICATIONS ============

async function loadNotifications() {
    try {
        const user = getCurrentUser();
        if (!user) return [];
        
        // In a real implementation, this would fetch from API
        const stored = localStorage.getItem(`notifications_${user.role}_${user.schoolCode || 'super'}`);
        
        if (stored) {
            notifications = JSON.parse(stored);
        } else {
            // Sample notifications for demonstration
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
            {
                id: 1,
                type: NOTIFICATION_TYPES.SYSTEM,
                title: 'New School Registered',
                message: 'Mombasa Academy has registered and is pending approval',
                timestamp: new Date(now - 3600000).toISOString(),
                read: false,
                actionable: true,
                action: 'approve_school',
                data: { schoolId: 123 }
            },
            {
                id: 2,
                type: NOTIFICATION_TYPES.APPROVAL,
                title: 'Name Change Request',
                message: 'Nairobi High School requests name change to "Nairobi Academy"',
                timestamp: new Date(now - 86400000).toISOString(),
                read: false,
                actionable: true,
                action: 'review_name_change',
                data: { requestId: 456 }
            }
        ],
        admin: [
            {
                id: 1,
                type: NOTIFICATION_TYPES.APPROVAL,
                title: 'New Teacher Signup',
                message: 'Jane Doe has requested to join as Mathematics teacher',
                timestamp: new Date(now - 7200000).toISOString(),
                read: false,
                actionable: true,
                action: 'approve_teacher',
                data: { teacherId: 789 }
            },
            {
                id: 2,
                type: NOTIFICATION_TYPES.DUTY,
                title: 'Duty Roster Updated',
                message: 'Next week\'s duty roster has been generated',
                timestamp: new Date(now - 172800000).toISOString(),
                read: true,
                actionable: false
            },
            {
                id: 3,
                type: NOTIFICATION_TYPES.ATTENDANCE,
                title: 'Low Attendance Alert',
                message: 'Grade 10A has below 80% attendance this week',
                timestamp: new Date(now - 259200000).toISOString(),
                read: false,
                actionable: true,
                action: 'view_attendance',
                data: { classId: '10A' }
            }
        ],
        teacher: [
            {
                id: 1,
                type: NOTIFICATION_TYPES.DUTY,
                title: 'Duty Assignment',
                message: 'You are assigned to morning duty tomorrow',
                timestamp: new Date(now - 10800000).toISOString(),
                read: false,
                actionable: true,
                action: 'view_duty',
                data: { dutyId: 101 }
            },
            {
                id: 2,
                type: NOTIFICATION_TYPES.MESSAGE,
                title: 'New Message',
                message: 'Ms. Atieno sent you a message',
                timestamp: new Date(now - 3600000).toISOString(),
                read: false,
                actionable: true,
                action: 'open_chat',
                data: { senderId: 202 }
            }
        ],
        parent: [
            {
                id: 1,
                type: NOTIFICATION_TYPES.ATTENDANCE,
                title: 'Attendance Update',
                message: 'Sarah was marked present today',
                timestamp: new Date(now - 14400000).toISOString(),
                read: true,
                actionable: false
            },
            {
                id: 2,
                type: NOTIFICATION_TYPES.PAYMENT,
                title: 'Fee Reminder',
                message: 'Term 2 fees are due in 7 days',
                timestamp: new Date(now - 86400000).toISOString(),
                read: false,
                actionable: true,
                action: 'make_payment',
                data: { studentId: 303 }
            }
        ],
        student: [
            {
                id: 1,
                type: NOTIFICATION_TYPES.ALERT,
                title: 'Homework Due',
                message: 'Mathematics assignment due tomorrow',
                timestamp: new Date(now - 43200000).toISOString(),
                read: false,
                actionable: true,
                action: 'view_homework',
                data: { homeworkId: 404 }
            }
        ]
    };
    
    return samples[role] || [];
}

// ============ SAVE NOTIFICATIONS ============

async function saveNotifications() {
    const user = getCurrentUser();
    if (!user) return;
    
    localStorage.setItem(`notifications_${user.role}_${user.schoolCode || 'super'}`, JSON.stringify(notifications));
    updateUnreadCount();
}

// ============ NOTIFICATION ACTIONS ============

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
    
    // Update badge in UI
    const badge = document.getElementById('notification-badge');
    if (badge) {
        if (unreadCount > 0) {
            badge.textContent = unreadCount > 9 ? '9+' : unreadCount;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }
}

// ============ SEND NOTIFICATIONS (Admin) ============

async function sendNotification(recipients, notification) {
    // In a real implementation, this would send to API
    // For now, we'll simulate by saving to localStorage
    
    const newNotification = {
        id: Date.now(),
        ...notification,
        timestamp: new Date().toISOString(),
        read: false
    };
    
    // For each recipient type, we would store in their notification list
    // This is simplified for demonstration
    
    showToast(`Notification sent to ${recipients}`, 'success');
    return newNotification;
}

async function sendBulkNotification(type, data) {
    const { recipientType, title, message, action, targetIds } = data;
    
    // This would be implemented with actual API calls
    console.log(`Sending ${type} notification to ${recipientType}:`, { title, message });
    
    showToast(`Notification sent to ${recipientType}`, 'success');
}

// ============ RENDER FUNCTIONS ============

function renderNotificationsPanel() {
    const container = document.getElementById('notifications-panel');
    if (!container) return;
    
    const unreadNotifications = notifications.filter(n => !n.read);
    const readNotifications = notifications.filter(n => n.read);
    
    container.innerHTML = `
        <div class="flex flex-col h-full">
            <div class="p-4 border-b flex justify-between items-center">
                <h3 class="font-semibold">Notifications</h3>
                <div class="flex gap-2">
                    <button onclick="markAllAsRead()" class="text-xs text-primary hover:underline" ${unreadNotifications.length === 0 ? 'disabled' : ''}>
                        Mark all read
                    </button>
                    <button onclick="clearAllNotifications()" class="text-xs text-red-600 hover:underline" ${notifications.length === 0 ? 'disabled' : ''}>
                        Clear all
                    </button>
                </div>
            </div>
            
            <div class="flex-1 overflow-y-auto">
                ${notifications.length === 0 ? `
                    <div class="p-8 text-center">
                        <i data-lucide="bell-off" class="h-12 w-12 mx-auto text-muted-foreground mb-4"></i>
                        <p class="text-muted-foreground">No notifications</p>
                    </div>
                ` : `
                    <div class="divide-y">
                        ${notifications.map(n => `
                            <div class="p-4 hover:bg-accent/50 transition-colors ${!n.read ? 'bg-primary/5' : ''}">
                                <div class="flex items-start gap-3">
                                    <div class="h-8 w-8 rounded-full ${getNotificationIconBg(n.type)} flex items-center justify-center flex-shrink-0">
                                        <i data-lucide="${getNotificationIcon(n.type)}" class="h-4 w-4 ${getNotificationIconColor(n.type)}"></i>
                                    </div>
                                    <div class="flex-1 min-w-0">
                                        <div class="flex justify-between items-start">
                                            <p class="text-sm font-medium">${n.title}</p>
                                            <span class="text-xs text-muted-foreground flex-shrink-0">${timeAgo(n.timestamp)}</span>
                                        </div>
                                        <p class="text-xs text-muted-foreground mt-1">${n.message}</p>
                                        ${n.actionable ? `
                                            <button onclick="handleNotificationAction('${n.action}', ${JSON.stringify(n.data).replace(/"/g, '&quot;')})" 
                                                    class="mt-2 text-xs bg-primary/10 text-primary px-2 py-1 rounded hover:bg-primary/20">
                                                Take action
                                            </button>
                                        ` : ''}
                                    </div>
                                    ${!n.read ? '<span class="h-2 w-2 bg-primary rounded-full flex-shrink-0"></span>' : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `}
            </div>
            
            ${notifications.length > 0 ? `
                <div class="p-3 border-t text-center">
                    <button onclick="showAllNotifications()" class="text-xs text-primary hover:underline">
                        View all notifications
                    </button>
                </div>
            ` : ''}
        </div>
    `;
    
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
        lucide.createIcons();
    }
}

function getNotificationIcon(type) {
    const icons = {
        system: 'settings',
        alert: 'alert-triangle',
        message: 'message-circle',
        duty: 'clock',
        approval: 'check-circle',
        attendance: 'calendar-check',
        payment: 'credit-card'
    };
    return icons[type] || 'bell';
}

function getNotificationIconBg(type) {
    const bgs = {
        system: 'bg-gray-100',
        alert: 'bg-red-100',
        message: 'bg-blue-100',
        duty: 'bg-amber-100',
        approval: 'bg-green-100',
        attendance: 'bg-purple-100',
        payment: 'bg-emerald-100'
    };
    return bgs[type] || 'bg-gray-100';
}

function getNotificationIconColor(type) {
    const colors = {
        system: 'text-gray-600',
        alert: 'text-red-600',
        message: 'text-blue-600',
        duty: 'text-amber-600',
        approval: 'text-green-600',
        attendance: 'text-purple-600',
        payment: 'text-emerald-600'
    };
    return colors[type] || 'text-gray-600';
}

function handleNotificationAction(action, data) {
    console.log('Notification action:', action, data);
    // This would route to the appropriate section
    showToast(`Action: ${action}`, 'info');
}

function showAllNotifications() {
    // Expand notifications panel or navigate to notifications page
    showToast('Viewing all notifications', 'info');
}

// ============ ADMIN NOTIFICATION SENDER ============

function renderAdminNotificationSender() {
    return `
        <div class="space-y-6 animate-fade-in">
            <h2 class="text-2xl font-bold">Send Notification</h2>
            
            <div class="rounded-xl border bg-card p-6">
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium mb-1">Recipient Type</label>
                        <select id="notification-recipient-type" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                            <option value="all_parents">All Parents</option>
                            <option value="class_parents">Parents of Specific Class</option>
                            <option value="specific_parent">Specific Parent</option>
                            <option value="all_teachers">All Teachers</option>
                            <option value="specific_teacher">Specific Teacher</option>
                            <option value="all_students">All Students</option>
                            <option value="specific_student">Specific Student</option>
                        </select>
                    </div>
                    
                    <div id="recipient-selector" class="hidden">
                        <!-- Dynamic content based on selection -->
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium mb-1">Title</label>
                        <input type="text" id="notification-title" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium mb-1">Message</label>
                        <textarea id="notification-message" rows="4" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"></textarea>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium mb-1">Notification Type</label>
                        <select id="notification-type" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                            <option value="info">Information</option>
                            <option value="alert">Alert</option>
                            <option value="reminder">Reminder</option>
                            <option value="announcement">Announcement</option>
                        </select>
                    </div>
                    
                    <div class="flex justify-end gap-2">
                        <button onclick="sendNotification()" class="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
                            Send Notification
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// ============ EXPORT ============

window.loadNotifications = loadNotifications;
window.markAsRead = markAsRead;
window.markAllAsRead = markAllAsRead;
window.deleteNotification = deleteNotification;
window.clearAllNotifications = clearAllNotifications;
window.renderNotificationsPanel = renderNotificationsPanel;
window.renderAdminNotificationSender = renderAdminNotificationSender;
window.handleNotificationAction = handleNotificationAction;
window.showAllNotifications = showAllNotifications;