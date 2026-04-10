// notifications.js - Complete real-time notification system

let notifications = [];
let unreadCount = 0;
let notificationSocket = null;

// Load notifications from backend
async function loadNotifications() {
  try {
    const res = await api.user.getAlerts(); // you'll need to add this to api.js
    notifications = res.data || [];
    updateUnreadCount();
    renderNotificationsPanel();
    return notifications;
  } catch (error) {
    console.error('Failed to load notifications:', error);
    return [];
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

async function saveNotifications() {
  localStorage.setItem(`notifications_${getCurrentUser()?.id}`, JSON.stringify(notifications));
  updateUnreadCount();
}

async function markAsRead(notificationId) {
  const notif = notifications.find(n => n.id === notificationId);
  if (notif && !notif.read) {
    notif.read = true;
    await saveNotifications();
    renderNotificationsPanel();
    // Optionally call API to mark as read on server
    // await api.notifications.markAsRead(notificationId);
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

function toggleNotifications() {
  let panel = document.getElementById('notifications-panel');
  if (!panel) {
    createNotificationsPanel();
    panel = document.getElementById('notifications-panel');
  }
  if (panel.classList.contains('hidden')) {
    renderNotificationsPanel();
    panel.classList.remove('hidden');
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
    container.innerHTML = `<div class="p-8 text-center"><i data-lucide="bell-off" class="h-12 w-12 mx-auto text-muted-foreground mb-3"></i><p class="text-muted-foreground">No notifications</p></div>`;
    if (window.lucide) lucide.createIcons();
    return;
  }
  container.innerHTML = notifications.map(notif => `
    <div class="p-4 border-b hover:bg-accent/50 transition-colors ${!notif.read ? 'bg-primary/5' : ''}" onclick="markAsRead('${notif.id}')">
      <div class="flex gap-3">
        <div class="h-10 w-10 rounded-full ${getNotifBg(notif.type)} flex items-center justify-center flex-shrink-0">
          <i data-lucide="${getNotifIcon(notif.type)}" class="h-5 w-5 ${getNotifColor(notif.type)}"></i>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium">${escapeHtml(notif.title)}</p>
          <p class="text-xs text-muted-foreground mt-1">${escapeHtml(notif.message)}</p>
          <p class="text-xs text-muted-foreground mt-2">${timeAgo(notif.timestamp)}</p>
        </div>
        ${!notif.read ? '<span class="h-2 w-2 bg-primary rounded-full flex-shrink-0 mt-2"></span>' : ''}
      </div>
    </div>
  `).join('');
  if (window.lucide) lucide.createIcons();
}

function getNotifIcon(type) {
  const icons = { system: 'settings', alert: 'alert-triangle', message: 'message-circle', duty: 'clock', approval: 'check-circle', attendance: 'calendar-check', payment: 'credit-card', academic: 'book-open' };
  return icons[type] || 'bell';
}
function getNotifBg(type) {
  const bgs = { system: 'bg-gray-100', alert: 'bg-red-100', message: 'bg-blue-100', duty: 'bg-amber-100', approval: 'bg-green-100', attendance: 'bg-purple-100', payment: 'bg-emerald-100', academic: 'bg-indigo-100' };
  return bgs[type] || 'bg-gray-100';
}
function getNotifColor(type) {
  const colors = { system: 'text-gray-600', alert: 'text-red-600', message: 'text-blue-600', duty: 'text-amber-600', approval: 'text-green-600', attendance: 'text-purple-600', payment: 'text-emerald-600', academic: 'text-indigo-600' };
  return colors[type] || 'text-gray-600';
}

function viewAllNotifications() {
  showDashboardSection('notifications');
  const panel = document.getElementById('notifications-panel');
  if (panel) panel.classList.add('hidden');
}

async function viewAllNotifications() {
  await loadNotifications();
  // Show a modal or a full page with list
  let modal = document.getElementById('all-notifications-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'all-notifications-modal';
    modal.className = 'fixed inset-0 z-50 hidden bg-black/50 flex items-center justify-center';
    modal.innerHTML = `<div class="bg-card rounded-xl max-w-2xl w-full max-h-[80vh] overflow-auto p-4"><div class="flex justify-between items-center border-b pb-2"><h3 class="font-bold">All Notifications</h3><button onclick="closeAllNotificationsModal()">✖</button></div><div id="all-notifications-list" class="mt-4 space-y-2"></div></div>`;
    document.body.appendChild(modal);
  }
  const listDiv = document.getElementById('all-notifications-list');
  listDiv.innerHTML = notifications.map(n => `<div class="p-3 border rounded ${!n.read ? 'bg-primary/5' : ''}"><p class="font-medium">${n.title}</p><p class="text-sm">${n.message}</p><p class="text-xs text-muted-foreground">${timeAgo(n.timestamp)}</p></div>`).join('');
  modal.classList.remove('hidden');
}
window.viewAllNotifications = viewAllNotifications;
window.closeAllNotificationsModal = () => document.getElementById('all-notifications-modal')?.classList.add('hidden');

// WebSocket integration: listen for real-time alerts
function initNotificationWebSocket() {
  if (window.socket) {
    window.socket.on('alert', (alert) => {
      // Add new notification
      const newNotif = {
        id: alert.id || Date.now(),
        title: alert.title,
        message: alert.message,
        type: alert.type,
        timestamp: alert.createdAt || new Date().toISOString(),
        read: false
      };
      notifications.unshift(newNotif);
      saveNotifications();
      renderNotificationsPanel();
      showToast(alert.title, 'info');
    });
  }
}

// Call this after WebSocket connects
window.addEventListener('load', () => {
  setTimeout(initNotificationWebSocket, 1000);
});

// Export functions
window.loadNotifications = loadNotifications;
window.markAsRead = markAsRead;
window.markAllAsRead = markAllAsRead;
window.deleteNotification = deleteNotification;
window.clearAllNotifications = clearAllNotifications;
window.toggleNotifications = toggleNotifications;
window.renderNotificationsPanel = renderNotificationsPanel;
