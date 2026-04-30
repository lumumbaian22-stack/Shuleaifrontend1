// student-dashboard.js - Student Dashboard Functionality

// Load student dashboard data
async function loadStudentDashboard() {
    try {
        const response = await api.student.getDashboard();
        return response.data || {};
    } catch (error) {
        console.error('Failed to load student dashboard:', error);
        showToast('Failed to load dashboard data', 'error');
        return {};
    }
}

// Load student grades
async function loadStudentGrades() {
    try {
        const response = await api.student.getGrades();
        return response.data || [];
    } catch (error) {
        console.error('Failed to load grades:', error);
        showToast('Failed to load grades', 'error');
        return [];
    }
}

// Load student attendance
async function loadStudentAttendance() {
    try {
        const response = await api.student.getAttendance();
        return response.data || [];
    } catch (error) {
        console.error('Failed to load attendance:', error);
        showToast('Failed to load attendance', 'error');
        return [];
    }
}

// Refresh student dashboard
async function refreshStudentDashboard() {
    const container = document.getElementById('dashboard-content');
    if (!container) return;
    
    const data = await loadStudentDashboard();
    const grades = await loadStudentGrades();
    const attendance = await loadStudentAttendance();
    
    // Update stats
    const elimuidEl = document.getElementById('student-elimuid');
    const avgEl = document.getElementById('class-average-student');
    const attendanceEl = document.getElementById('student-attendance');
    
    if (elimuidEl) elimuidEl.textContent = data.student?.elimuid || 'ELI-****';
    if (avgEl) avgEl.textContent = data.stats?.averageScore || '0%';
    if (attendanceEl) attendanceEl.textContent = data.stats?.attendanceRate || '0%';
    
    // Update grades display
    updateGradesDisplay(grades);
    
    // Update attendance display
    updateAttendanceDisplay(attendance);
}

// Update grades display
function updateGradesDisplay(grades) {
    const container = document.getElementById('my-grades');
    if (!container) return;
    
    if (!grades || grades.length === 0) {
        container.innerHTML = '<p class="text-muted-foreground text-center py-4">No grades available</p>';
        return;
    }
    
    let html = '';
    grades.slice(0, 5).forEach(grade => {
        const score = grade.score || 0;
        const colorClass = score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-blue-500' : 'bg-yellow-500';
        
        html += `
            <div class="mb-3">
                <div class="flex justify-between items-center">
                    <span class="text-sm">${grade.subject || 'Subject'}</span>
                    <span class="text-sm font-semibold">${score}% (${grade.grade || 'N/A'})</span>
                </div>
                <div class="w-full h-2 bg-muted rounded-full overflow-hidden mt-1">
                    <div class="h-full ${colorClass} rounded-full" style="width: ${score}%"></div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Update attendance display
function updateAttendanceDisplay(attendance) {
    const container = document.getElementById('recent-attendance');
    if (!container) return;
    
    if (!attendance || attendance.length === 0) {
        container.innerHTML = '<p class="text-muted-foreground text-center py-4">No attendance records</p>';
        return;
    }
    
    let html = '';
    attendance.slice(0, 5).forEach(record => {
        const statusColor = record.status === 'present' ? 'text-green-600' : 
                           record.status === 'absent' ? 'text-red-600' : 'text-yellow-600';
        
        html += `
            <div class="flex justify-between items-center p-2 border-b last:border-0">
                <span class="text-sm">${new Date(record.date).toLocaleDateString()}</span>
                <span class="text-sm ${statusColor} capitalize">${record.status}</span>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Send chat message
async function sendStudentMessage() {
    const input = document.getElementById('chat-input');
    const message = input?.value.trim();
    
    if (!message) return;
    
    const container = document.getElementById('chat-messages');
    if (container) {
        container.innerHTML += `
            <div class="flex justify-end mb-3">
                <div class="chat-bubble-sent max-w-[70%]">
                    <p class="text-sm">${message}</p>
                    <p class="text-xs text-muted-foreground mt-1">just now</p>
                </div>
            </div>
        `;
        container.scrollTop = container.scrollHeight;
    }
    
    input.value = '';
}

// Ask AI tutor
async function askAI() {
    const input = document.getElementById('ai-input');
    const question = input?.value.trim();
    
    if (!question) return;
    
    const container = document.getElementById('ai-chat-messages');
    if (!container) return;
    
    // Add user message
    container.innerHTML += `
        <div class="flex justify-end mb-3">
            <div class="chat-bubble-sent max-w-[70%]">
                <p class="text-sm">${question}</p>
                <p class="text-xs text-muted-foreground mt-1">just now</p>
            </div>
        </div>
    `;
    
    input.value = '';
    container.scrollTop = container.scrollHeight;
    
    // Simulate AI response
    setTimeout(() => {
        container.innerHTML += `
            <div class="flex justify-start mb-3">
                <div class="chat-bubble-received max-w-[70%]">
                    <p class="text-sm font-medium">AI Tutor</p>
                    <p class="text-sm">I'm here to help! What would you like to know about?</p>
                </div>
            </div>
        `;
        container.scrollTop = container.scrollHeight;
    }, 1000);
}

// Export functions
window.loadStudentDashboard = loadStudentDashboard;
window.loadStudentGrades = loadStudentGrades;
window.loadStudentAttendance = loadStudentAttendance;
window.refreshStudentDashboard = refreshStudentDashboard;
window.sendStudentMessage = sendStudentMessage;
window.askAI = askAI;

// V6 Student class-scoped WhatsApp-style chat
let selectedStudentChatMember = null;

async function renderStudentClassChat() {
    try {
        const [membersRes, messagesRes] = await Promise.all([
            api.studentChat.getClassMembers(),
            api.studentChat.getClassGroupMessages()
        ]);

        const members = membersRes.data || [];
        const messages = messagesRes.data || [];
        const currentUser = getCurrentUser && getCurrentUser();

        const membersHtml = members.length
            ? members.map(m => ShuleChatUI.userRow(m, `openStudentPrivateChat(${m.userId || m.id})`)).join('')
            : '<div class="p-4 text-sm text-muted-foreground">No classmates found for your class yet.</div>';

        const messagesHtml = messages.map(m => ShuleChatUI.messageBubble(m, currentUser?.id)).join('');

        return ShuleChatUI.shell({
            title: 'Class Group Chat',
            subtitle: 'Only students in your class can participate',
            membersHtml,
            messagesHtml,
            inputId: 'student-class-chat-input',
            sendFnName: 'sendStudentClassGroupMessage'
        });
    } catch (error) {
        console.error('Student class chat error:', error);
        return `<div class="card p-6">
            <h3 class="font-bold text-red-600">Chat could not load</h3>
            <p class="text-sm text-muted-foreground">${escapeHtml(error.message || 'Please try again later')}</p>
        </div>`;
    }
}

async function sendStudentClassGroupMessage() {
    const input = document.getElementById('student-class-chat-input');
    const message = input?.value?.trim();
    if (!message) return;
    await api.studentChat.sendClassGroupMessage(message);
    input.value = '';
    const content = document.getElementById('dashboard-content');
    if (content) content.innerHTML = await renderStudentClassChat();
}

async function openStudentPrivateChat(userId) {
    selectedStudentChatMember = userId;
    try {
        const [membersRes, messagesRes] = await Promise.all([
            api.studentChat.getClassMembers(),
            api.studentChat.getPrivateMessages(userId)
        ]);
        const members = membersRes.data || [];
        const messages = messagesRes.data || [];
        const currentUser = getCurrentUser && getCurrentUser();
        const selected = members.find(m => String(m.userId || m.id) === String(userId));

        const membersHtml = members.map(m => ShuleChatUI.userRow(m, `openStudentPrivateChat(${m.userId || m.id})`)).join('');
        const messagesHtml = messages.map(m => ShuleChatUI.messageBubble(m, currentUser?.id)).join('');

        const content = document.getElementById('dashboard-content');
        if (content) {
            content.innerHTML = ShuleChatUI.shell({
                title: selected?.name || 'Private Chat',
                subtitle: 'Private chat with your classmate',
                membersHtml,
                messagesHtml,
                inputId: 'student-private-chat-input',
                sendFnName: 'sendStudentPrivateMessage'
            });
        }
    } catch (error) {
        showToast(error.message || 'Private chat failed', 'error');
    }
}

async function sendStudentPrivateMessage() {
    const input = document.getElementById('student-private-chat-input');
    const message = input?.value?.trim();
    if (!message || !selectedStudentChatMember) return;
    await api.studentChat.sendPrivateMessage(selectedStudentChatMember, message);
    input.value = '';
    await openStudentPrivateChat(selectedStudentChatMember);
}

window.renderStudentClassChat = renderStudentClassChat;
window.sendStudentClassGroupMessage = sendStudentClassGroupMessage;
window.openStudentPrivateChat = openStudentPrivateChat;
window.sendStudentPrivateMessage = sendStudentPrivateMessage;
