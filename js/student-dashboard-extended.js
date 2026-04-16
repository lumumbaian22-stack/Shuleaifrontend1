// student-dashboard-extended.js - Student dashboard rendering with dynamic school name

async function renderStudentSection(section) {
    switch(section) {
        case 'dashboard':
            return await renderStudentDashboard();
        case 'grades':
            return await renderStudentGrades();
        case 'attendance':
            return await renderStudentAttendance();
        case 'chat':
            return renderStudentChat();
        case 'ai-tutor':
            return renderStudentAITutor();
        case 'schedule':
            return renderStudentSchedule();
        case 'settings':
            return renderUserSettings('student');
        default:
            return await renderStudentDashboard();
    }
}

async function renderStudentDashboard() {
    try {
        const data = dashboardData || {};
        const user = getCurrentUser();
        const school = getCurrentSchool();

        return `
            <div class="space-y-6 animate-fade-in">
                <!-- School Name Header -->
                <div class="rounded-xl border bg-card p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700">
                    <h2 id="student-school-name" class="text-xl font-semibold">${(school && school.status === 'active') ? school.name : 'ShuleAI'}</h2>
                    <p class="text-sm text-muted-foreground">Welcome back, ${user?.name || 'Student'}</p>
                </div>
                
                <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div class="rounded-xl border bg-card p-6 card-hover">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-muted-foreground">My ELIMUID</p>
                                <h3 class="text-lg font-mono font-bold mt-1" id="student-elimuid">${user?.elimuid || 'ELI-2024-001'}</h3>
                            </div>
                            <div class="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center">
                                <i data-lucide="id-card" class="h-6 w-6 text-purple-600"></i>
                            </div>
                        </div>
                    </div>
                    <div class="rounded-xl border bg-card p-6 card-hover">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-muted-foreground">Class Average</p>
                                <h3 class="text-2xl font-bold mt-1" id="class-average-student">82%</h3>
                            </div>
                            <div class="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
                                <i data-lucide="trending-up" class="h-6 w-6 text-green-600"></i>
                            </div>
                        </div>
                    </div>
                    <div class="rounded-xl border bg-card p-6 card-hover">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-muted-foreground">My Attendance</p>
                                <h3 class="text-2xl font-bold mt-1" id="student-attendance">95%</h3>
                            </div>
                            <div class="h-12 w-12 rounded-lg bg-amber-100 flex items-center justify-center">
                                <i data-lucide="calendar-check" class="h-6 w-6 text-amber-600"></i>
                            </div>
                        </div>
                    </div>
                    <div class="rounded-xl border bg-card p-6 card-hover">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-muted-foreground">Study Groups</p>
                                <h3 class="text-2xl font-bold mt-1" id="study-groups-count">3</h3>
                            </div>
                            <div class="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                                <i data-lucide="message-circle" class="h-6 w-6 text-blue-600"></i>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="grid gap-4 md:grid-cols-2">
                    <button onclick="showDashboardSection('chat')" class="p-6 border rounded-lg hover:bg-accent transition-colors text-left flex items-center gap-4">
                        <div class="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                            <i data-lucide="message-circle" class="h-6 w-6 text-blue-600"></i>
                        </div>
                        <div>
                            <h4 class="font-semibold">Study Groups</h4>
                            <p class="text-sm text-muted-foreground">Chat with students from other schools</p>
                        </div>
                    </button>
                    <button onclick="showDashboardSection('ai-tutor')" class="p-6 border rounded-lg hover:bg-accent transition-colors text-left flex items-center gap-4">
                        <div class="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                            <i data-lucide="bot" class="h-6 w-6 text-purple-600"></i>
                        </div>
                        <div>
                            <h4 class="font-semibold">AI Tutor</h4>
                            <p class="text-sm text-muted-foreground">Get help with any subject</p>
                        </div>
                    </button>
                </div>
            </div>
        `;
    } catch (error) {
        return `<div class="text-center py-12 text-red-500">Error loading dashboard: ${error.message}</div>`;
    }
}

async function renderStudentGrades() {
    try {
        const data = dashboardData || {};
        const school = getCurrentSchool();
        
        return `
            <div class="space-y-6 animate-fade-in">
                <div class="flex justify-between items-center">
                    <h2 class="text-2xl font-bold">My Grades</h2>
                    <div class="text-sm text-muted-foreground">${(school && school.status === 'active') ? school.name : 'ShuleAI'}</div>
                    </div>
                </div>
                <div class="rounded-xl border bg-card overflow-hidden">
                    <div class="overflow-x-auto">
                        <table class="w-full text-sm">
                            <thead class="bg-muted/50">
                                <tr>
                                    <th class="px-4 py-3 text-left font-medium">Subject</th>
                                    <th class="px-4 py-3 text-left font-medium">Assessment</th>
                                    <th class="px-4 py-3 text-center font-medium">Score</th>
                                    <th class="px-4 py-3 text-center font-medium">Grade</th>
                                    <th class="px-4 py-3 text-left font-medium">Date</th>
                                 </thead>
                            <tbody class="divide-y" id="grades-table-body">
                                <tr class="hover:bg-accent/50 transition-colors">
                                    <td class="px-4 py-3 font-medium">Mathematics</td>
                                    <td class="px-4 py-3">Mid-term Exam</td>
                                    <td class="px-4 py-3 text-center">85%</td>
                                    <td class="px-4 py-3 text-center">
                                        <span class="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">A-</span>
                                    </td>
                                    <td class="px-4 py-3">Mar 15, 2024</td>
                                </tr>
                                <tr class="hover:bg-accent/50 transition-colors">
                                    <td class="px-4 py-3 font-medium">English</td>
                                    <td class="px-4 py-3">Essay</td>
                                    <td class="px-4 py-3 text-center">78%</td>
                                    <td class="px-4 py-3 text-center">
                                        <span class="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">B+</span>
                                    </td>
                                    <td class="px-4 py-3">Mar 14, 2024</td>
                                </tr>
                                <tr class="hover:bg-accent/50 transition-colors">
                                    <td class="px-4 py-3 font-medium">Science</td>
                                    <td class="px-4 py-3">Lab Report</td>
                                    <td class="px-4 py-3 text-center">92%</td>
                                    <td class="px-4 py-3 text-center">
                                        <span class="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">A</span>
                                    </td>
                                    <td class="px-4 py-3">Mar 12, 2024</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        return `<div class="text-center py-12 text-red-500">Error loading grades: ${error.message}</div>`;
    }
}

async function renderStudentAttendance() {
    try {
        const data = dashboardData || {};
        const school = getCurrentSchool();
        
        return `
            <div class="space-y-6 animate-fade-in">
                <div class="flex justify-between items-center">
                    <h2 class="text-2xl font-bold">My Attendance</h2>
                    <div class="text-sm text-muted-foreground">${(school && school.status === 'active') ? school.name : 'ShuleAI'}</div>
                    </div>
                </div>
                <div class="rounded-xl border bg-card p-6">
                    <div class="grid gap-4 md:grid-cols-3">
                        <div class="text-center p-4">
                            <p class="text-sm text-muted-foreground">Present</p>
                            <p class="text-3xl font-bold text-green-600">42</p>
                        </div>
                        <div class="text-center p-4">
                            <p class="text-sm text-muted-foreground">Absent</p>
                            <p class="text-3xl font-bold text-red-600">2</p>
                        </div>
                        <div class="text-center p-4">
                            <p class="text-sm text-muted-foreground">Late</p>
                            <p class="text-3xl font-bold text-yellow-600">1</p>
                        </div>
                    </div>
                </div>
                <div class="rounded-xl border bg-card overflow-hidden">
                    <div class="p-4 border-b">
                        <h3 class="font-semibold">Attendance History</h3>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="w-full text-sm">
                            <thead class="bg-muted/50">
                                 <tr>
                                    <th class="px-4 py-3 text-left font-medium">Date</th>
                                    <th class="px-4 py-3 text-left font-medium">Status</th>
                                    <th class="px-4 py-3 text-left font-medium">Reason</th>
                                 </tr>
                            </thead>
                            <tbody class="divide-y" id="attendance-history-body">
                                <tr class="hover:bg-accent/50 transition-colors">
                                    <td class="px-4 py-3">Mar 15, 2024</td>
                                    <td class="px-4 py-3">
                                        <span class="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">present</span>
                                    </td>
                                    <td class="px-4 py-3">-</td>
                                </tr>
                                <tr class="hover:bg-accent/50 transition-colors">
                                    <td class="px-4 py-3">Mar 14, 2024</td>
                                    <td class="px-4 py-3">
                                        <span class="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">present</span>
                                    </td>
                                    <td class="px-4 py-3">-</td>
                                </tr>
                                <tr class="hover:bg-accent/50 transition-colors">
                                    <td class="px-4 py-3">Mar 13, 2024</td>
                                    <td class="px-4 py-3">
                                        <span class="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">absent</span>
                                    </td>
                                    <td class="px-4 py-3">Sick</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        return `<div class="text-center py-12 text-red-500">Error loading attendance: ${error.message}</div>`;
    }
}

let studentReplyTo = null;

function renderStudentChat() {
  return `
    <div class="max-w-4xl mx-auto h-[600px] flex flex-col">
      <div class="flex-1 overflow-y-auto p-4 space-y-3" id="student-chat-messages">
        <div class="text-center text-muted-foreground py-8">Loading messages...</div>
      </div>
      <div id="reply-preview" class="hidden text-xs bg-muted p-2 rounded-lg mb-2 flex justify-between items-center">
        <span id="reply-preview-text"></span>
        <button onclick="cancelStudentReply()" class="text-red-500">✖</button>
      </div>
      <div class="flex gap-2 p-4 border-t">
        <input type="text" id="student-chat-input" placeholder="Type a message..." class="flex-1 rounded-lg border p-2 bg-background">
        <button onclick="sendStudentChatMessage()" class="px-4 py-2 bg-primary text-white rounded-lg">Send</button>
      </div>
    </div>
  `;
}

async function loadStudentChatMessages() {
  const container = document.getElementById('student-chat-messages');
  if (!container) return;
  try {
    const res = await api.student.getGroupMessages();
    const messages = res.data || [];
    const currentUser = getCurrentUser();

    container.innerHTML = messages.map(msg => {
      const isSent = msg.senderId === currentUser.id;
      return `
        <div class="flex ${isSent ? 'justify-end' : 'justify-start'} group relative">
          <div class="${isSent ? 'chat-bubble-sent' : 'chat-bubble-received'} max-w-[70%]">
            ${msg.replyToMessageId ? `<div class="text-xs border-l-2 border-primary pl-2 mb-1 italic text-muted-foreground">Replying to a message</div>` : ''}
            ${!isSent ? `<p class="text-xs font-medium">${escapeHtml(msg.Sender?.name)}</p>` : ''}
            <p class="text-sm">${escapeHtml(msg.content)}</p>
            <p class="text-xs text-muted-foreground mt-1">${timeAgo(msg.createdAt)}</p>
          </div>
          <button onclick="setStudentReply(${msg.id}, '${escapeHtml(msg.content.substring(0, 30))}')" class="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 bg-primary text-white rounded-full p-1 text-xs">↩️</button>
        </div>
      `;
    }).join('') || '<div class="text-center text-muted-foreground py-8">No messages yet</div>';

    container.scrollTop = container.scrollHeight;
  } catch (e) {
    container.innerHTML = '<div class="text-red-500 text-center py-8">Failed to load messages</div>';
  }
}

function setStudentReply(messageId, contentPreview) {
  studentReplyTo = { id: messageId, content: contentPreview };
  document.getElementById('reply-preview-text').textContent = `Replying to: ${contentPreview}...`;
  document.getElementById('reply-preview').classList.remove('hidden');
}

function cancelStudentReply() {
  studentReplyTo = null;
  document.getElementById('reply-preview').classList.add('hidden');
}

async function sendStudentChatMessage() {
  const input = document.getElementById('student-chat-input');
  const content = input.value.trim();
  if (!content) return;

  const data = { content };
  if (studentReplyTo) {
    data.replyToId = studentReplyTo.id;
  }

  try {
    await api.student.sendGroupMessage(data);
    input.value = '';
    cancelStudentReply();
    await loadStudentChatMessages();
  } catch (e) {
    showToast(e.message, 'error');
  }
}


function renderStudentAITutor() {
    const curriculum = schoolSettings.curriculum || 'cbc';
    const school = getCurrentSchool();
    
    return `
        <div class="max-w-4xl mx-auto space-y-6 animate-fade-in">
            <div class="flex justify-between items-center">
                <h2 class="text-2xl font-bold">AI Tutor</h2>
                <div class="text-sm text-muted-foreground">${(school && school.status === 'active') ? school.name : 'ShuleAI'}</div>
                </div>
            </div>
            <div class="rounded-xl border bg-card p-4 h-[600px] flex flex-col">
                <div class="flex items-center gap-3 mb-4 pb-2 border-b">
                    <div class="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                        <i data-lucide="bot" class="h-6 w-6 text-white"></i>
                    </div>
                    <div>
                        <h3 class="font-semibold text-lg">AI Tutor</h3>
                        <p class="text-xs text-muted-foreground">Curriculum: ${CURRICULUMS[curriculum]?.name || 'CBC'}</p>
                    </div>
                </div>
                <div class="flex-1 overflow-y-auto space-y-4 mb-4 p-4 bg-muted/20 rounded-lg" id="ai-chat-container">
                    <div class="flex justify-start">
                        <div class="chat-bubble-received max-w-[70%]">
                            <p class="text-sm">Hi! I'm your AI tutor. I can help you with ${CURRICULUMS[curriculum]?.name || 'your'} curriculum. What would you like to learn about today?</p>
                        </div>
                    </div>
                </div>
                <div class="flex gap-2">
                    <input type="text" id="ai-question-input" placeholder="Ask me anything..." class="flex-1 rounded-lg border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                    <button onclick="askAITutor()" class="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 flex items-center gap-2">
                        <i data-lucide="send" class="h-4 w-4"></i>
                        Ask
                    </button>
                </div>
            </div>
        </div>
    `;
}

function renderStudentSchedule() {
    const school = getCurrentSchool();
    
    return `
        <div class="space-y-6 animate-fade-in">
            <div class="flex justify-between items-center">
                <h2 class="text-2xl font-bold">My Schedule</h2>
                <div class="text-sm text-muted-foreground">${(school && school.status === 'active') ? school.name : 'ShuleAI'}</div>
                </div>
            </div>
            <div class="rounded-xl border bg-card p-6">
                <h3 class="font-semibold mb-4">Today's Classes</h3>
                <div class="space-y-3">
                    <div class="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                        <div>
                            <p class="font-medium">Mathematics</p>
                            <p class="text-sm text-muted-foreground">Mr. Kamau • Room 101</p>
                        </div>
                        <span class="text-sm font-medium">8:00 AM - 9:30 AM</span>
                    </div>
                    <div class="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                        <div>
                            <p class="font-medium">English</p>
                            <p class="text-sm text-muted-foreground">Ms. Atieno • Room 203</p>
                        </div>
                        <span class="text-sm font-medium">10:00 AM - 11:30 AM</span>
                    </div>
                    <div class="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                        <div>
                            <p class="font-medium">Science</p>
                            <p class="text-sm text-muted-foreground">Mr. Omondi • Lab 1</p>
                        </div>
                        <span class="text-sm font-medium">12:00 PM - 1:30 PM</span>
                    </div>
                </div>
            </div>
            <div class="rounded-xl border bg-card p-6">
                <h3 class="font-semibold mb-4">Upcoming Exams</h3>
                <div class="space-y-3">
                    <div class="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                            <p class="font-medium">Mathematics Mid-term</p>
                            <p class="text-sm text-muted-foreground">Topics: Algebra, Calculus</p>
                        </div>
                        <span class="px-3 py-1 bg-red-100 text-red-700 text-xs rounded-full">in 3 days</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// ============ CHAT FUNCTIONS ============
window.sendStudentMessage = function() {
    const input = document.getElementById('chat-message-input');
    const message = input?.value.trim();
    if (!message) return;
    const container = document.getElementById('chat-messages-container');
    if (container) {
        container.innerHTML += `
            <div class="flex justify-end">
                <div class="chat-bubble-sent max-w-[70%]">
                    <p class="text-sm font-medium">You</p>
                    <p class="text-sm">${escapeHtml(message)}</p>
                    <p class="text-xs text-muted-foreground mt-1">just now</p>
                </div>
            </div>
        `;
        container.scrollTop = container.scrollHeight;
    }
    input.value = '';
};

window.askAITutor = function() {
    const input = document.getElementById('ai-question-input');
    const question = input?.value.trim();
    if (!question) return;
    const container = document.getElementById('ai-chat-container');
    if (!container) return;
    container.innerHTML += `
        <div class="flex justify-end">
            <div class="chat-bubble-sent max-w-[70%]">
                <p class="text-sm font-medium">You</p>
                <p class="text-sm">${escapeHtml(question)}</p>
                <p class="text-xs text-muted-foreground mt-1">just now</p>
            </div>
        </div>
    `;
    container.scrollTop = container.scrollHeight;
    input.value = '';
    const typingDiv = document.createElement('div');
    typingDiv.className = 'flex justify-start';
    typingDiv.innerHTML = `<div class="chat-bubble-received"><p class="text-sm text-muted-foreground">AI Tutor is typing...</p></div>`;
    container.appendChild(typingDiv);
    container.scrollTop = container.scrollHeight;
    setTimeout(() => {
        typingDiv.remove();
        const responses = [
            `That's an excellent question! Let me explain...`,
            `Based on the curriculum, here's what you need to know...`,
            `Great question! Here's a step-by-step explanation...`,
            `I'd be happy to help you with that. The answer is...`
        ];
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        container.innerHTML += `
            <div class="flex justify-start">
                <div class="chat-bubble-received max-w-[70%]">
                    <p class="text-sm font-medium">AI Tutor</p>
                    <p class="text-sm">${randomResponse} "${escapeHtml(question)}" is an important concept. Would you like me to provide examples or practice problems?</p>
                    <p class="text-xs text-muted-foreground mt-1">just now</p>
                </div>
            </div>
        `;
        container.scrollTop = container.scrollHeight;
    }, 1500);
};

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============ EXPORT FUNCTIONS ============
window.renderStudentSection = renderStudentSection;
window.renderStudentDashboard = renderStudentDashboard;
window.renderStudentGrades = renderStudentGrades;
window.renderStudentAttendance = renderStudentAttendance;
window.renderStudentChat = renderStudentChat;
window.renderStudentAITutor = renderStudentAITutor;
window.renderStudentSchedule = renderStudentSchedule;
window.sendStudentMessage = sendStudentMessage;
window.askAITutor = askAITutor;
window.setStudentReply = setStudentReply;
window.cancelStudentReply = cancelStudentReply;
window.sendStudentChatMessage = sendStudentChatMessage;
window.loadStudentChatMessages = loadStudentChatMessages;
