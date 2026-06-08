// messaging.js - Complete messaging system for teachers and parents

// ============ MESSAGING STATE ============

let currentChatPartner = null;
let currentChatType = 'group'; // 'group', 'private', 'parent'
let messages = {
    group: [],
    private: {},
    parent: {}
};

// ============ INITIALIZATION ============

async function initMessaging() {
    await loadGroupMessages();
    await loadTeachers();
    renderChatUI();
}

// ============ LOAD DATA ============

async function loadTeachers() {
    try {
        const role = getCurrentRole();
        let teachers = [];
        
        if (role === 'teacher') {
            // Teachers can see other teachers in the same school
            const response = await api.admin.getTeachers();
            teachers = response.data || [];
        } else if (role === 'parent') {
            // Parents can see their child's teachers
            const children = await api.parent.getChildren();
            // This would need to fetch teachers for each child
            teachers = []; // Placeholder
        }
        
        return teachers;
    } catch (error) {
        console.error('Failed to load teachers:', error);
        return [];
    }
}

async function loadGroupMessages() {
    // In a real implementation, this would fetch from API
    const stored = localStorage.getItem('group_messages');
    if (stored) {
        messages.group = JSON.parse(stored);
    } else {
        // Sample data
        messages.group = [
            {
                id: 1,
                sender: 'Mr. Kamau',
                senderId: 2,
                content: 'Has anyone prepared the math exam for Grade 10?',
                timestamp: new Date(Date.now() - 3600000).toISOString(),
                type: 'group'
            },
            {
                id: 2,
                sender: 'Ms. Atieno',
                senderId: 3,
                content: 'Yes, I have it ready. I will share it in the staff drive.',
                timestamp: new Date(Date.now() - 1800000).toISOString(),
                type: 'group'
            }
        ];
        localStorage.setItem('group_messages', JSON.stringify(messages.group));
    }
}

async function loadPrivateMessages(teacherId) {
    const key = `private_${teacherId}`;
    const stored = localStorage.getItem(key);
    if (stored) {
        messages.private[teacherId] = JSON.parse(stored);
    } else {
        messages.private[teacherId] = [];
    }
    return messages.private[teacherId];
}

async function loadParentMessages(parentId) {
    const key = `parent_${parentId}`;
    const stored = localStorage.getItem(key);
    if (stored) {
        messages.parent[parentId] = JSON.parse(stored);
    } else {
        messages.parent[parentId] = [];
    }
    return messages.parent[parentId];
}

// ============ SEND MESSAGES ============

async function sendGroupMessage(content) {
    const user = getCurrentUser();
    const newMessage = {
        id: Date.now(),
        sender: user.name,
        senderId: user.id,
        content,
        timestamp: new Date().toISOString(),
        type: 'group'
    };
    
    messages.group.push(newMessage);
    localStorage.setItem('group_messages', JSON.stringify(messages.group));
    
    // Notify other teachers via WebSocket (if connected)
    if (typeof sendMessage === 'function') {
        sendMessage('group', newMessage);
    }
    
    return newMessage;
}

async function sendPrivateMessage(receiverId, content) {
    const user = getCurrentUser();
    const newMessage = {
        id: Date.now(),
        sender: user.name,
        senderId: user.id,
        receiverId,
        content,
        timestamp: new Date().toISOString(),
        type: 'private',
        read: false
    };
    
    if (!messages.private[receiverId]) {
        messages.private[receiverId] = [];
    }
    
    messages.private[receiverId].push(newMessage);
    localStorage.setItem(`private_${receiverId}`, JSON.stringify(messages.private[receiverId]));
    
    // Notify via WebSocket
    if (typeof sendMessage === 'function') {
        sendMessage('private', newMessage, receiverId);
    }
    
    return newMessage;
}

async function sendParentMessage(teacherId, content) {
    const user = getCurrentUser();
    const newMessage = {
        id: Date.now(),
        sender: user.name,
        senderId: user.id,
        receiverId: teacherId,
        content,
        timestamp: new Date().toISOString(),
        type: 'parent',
        read: false
    };
    
    if (!messages.parent[teacherId]) {
        messages.parent[teacherId] = [];
    }
    
    messages.parent[teacherId].push(newMessage);
    localStorage.setItem(`parent_${teacherId}`, JSON.stringify(messages.parent[teacherId]));
    
    // Notify via WebSocket
    if (typeof sendMessage === 'function') {
        sendMessage('parent', newMessage, teacherId);
    }
    
    return newMessage;
}

// ============ RENDER FUNCTIONS ============

function renderTeacherChat() {
    const user = getCurrentUser();
    const teachers = []; // This would be loaded from API
    
    return `
        <div class="max-w-6xl mx-auto space-y-6 animate-fade-in">
            <div class="grid grid-cols-4 gap-4 h-[700px]">
                <!-- Sidebar -->
                <div class="col-span-1 rounded-xl border bg-card overflow-hidden flex flex-col">
                    <div class="p-4 border-b">
                        <h3 class="font-semibold">Chats</h3>
                    </div>
                    <div class="flex-1 overflow-y-auto p-2">
                        <div class="space-y-1">
                            <button onclick="switchChat('group')" class="w-full text-left p-3 rounded-lg hover:bg-accent transition-colors ${currentChatType === 'group' ? 'bg-accent' : ''}">
                                <div class="flex items-center gap-3">
                                    <div class="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                        <i data-lucide="users" class="h-4 w-4 text-primary"></i>
                                    </div>
                                    <div>
                                        <p class="font-medium">Staff Room</p>
                                        <p class="text-xs text-muted-foreground">Group chat</p>
                                    </div>
                                </div>
                            </button>
                            
                            <div class="pt-2 mt-2 border-t">
                                <p class="text-xs font-medium text-muted-foreground px-3 mb-2">TEACHERS</p>
                                ${teachers.map(t => `
                                    <button onclick="switchChat('private', ${t.id})" class="w-full text-left p-3 rounded-lg hover:bg-accent transition-colors ${currentChatType === 'private' && currentChatPartner === t.id ? 'bg-accent' : ''}">
                                        <div class="flex items-center gap-3">
                                            <div class="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                                <span class="font-medium text-blue-700 text-sm">${getInitials(t.name)}</span>
                                            </div>
                                            <div>
                                                <p class="font-medium">${t.name}</p>
                                                <p class="text-xs text-muted-foreground">${t.subject || 'Teacher'}</p>
                                            </div>
                                        </div>
                                    </button>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Chat Area -->
                <div class="col-span-3 rounded-xl border bg-card flex flex-col">
                    <div class="p-4 border-b">
                        <h3 class="font-semibold">
                            ${currentChatType === 'group' ? 'Staff Room' : 
                              currentChatType === 'private' ? `Chat with ${getChatPartnerName()}` : 
                              'Parent Messages'}
                        </h3>
                    </div>
                    
                    <div class="flex-1 overflow-y-auto p-4 space-y-4" id="chat-messages-container">
                        ${renderMessages()}
                    </div>
                    
                    <div class="p-4 border-t">
                        <div class="flex gap-2">
                            <input type="text" id="chat-message-input" placeholder="Type your message..." 
                                   class="flex-1 rounded-lg border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                            <button onclick="handleSendMessage()" class="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 flex items-center gap-2">
                                <i data-lucide="send" class="h-4 w-4"></i>
                                Send
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderMessages() {
    let messageList = [];
    
    if (currentChatType === 'group') {
        messageList = messages.group || [];
    } else if (currentChatType === 'private' && currentChatPartner) {
        messageList = messages.private[currentChatPartner] || [];
    } else if (currentChatType === 'parent' && currentChatPartner) {
        messageList = messages.parent[currentChatPartner] || [];
    }
    
    const user = getCurrentUser();
    
    return messageList.map(msg => {
        const isSent = msg.senderId === user.id;
        return `
            <div class="flex ${isSent ? 'justify-end' : 'justify-start'}">
                <div class="${isSent ? 'chat-bubble-sent' : 'chat-bubble-received'} max-w-[70%]">
                    ${!isSent ? `<p class="text-sm font-medium mb-1">${msg.sender}</p>` : ''}
                    <p class="text-sm">${msg.content}</p>
                    <p class="text-xs text-muted-foreground mt-1">${timeAgo(msg.timestamp)}</p>
                </div>
            </div>
        `;
    }).join('') || '<div class="text-center text-muted-foreground py-8">No messages yet. Start the conversation!</div>';
}

function getChatPartnerName() {
    // This would fetch the teacher's name from loaded teachers
    return 'Teacher';
}

// ============ CHAT ACTIONS ============

function switchChat(type, partnerId = null) {
    currentChatType = type;
    currentChatPartner = partnerId;
    
    // Reload messages for this chat
    if (type === 'private' && partnerId) {
        loadPrivateMessages(partnerId);
    } else if (type === 'parent' && partnerId) {
        loadParentMessages(partnerId);
    }
    
    // Refresh the chat display
    const container = document.getElementById('chat-messages-container');
    if (container) {
        container.innerHTML = renderMessages();
        container.scrollTop = container.scrollHeight;
    }
}

async function handleSendMessage() {
    const input = document.getElementById('chat-message-input');
    const content = input?.value.trim();
    
    if (!content) return;
    
    let message;
    if (currentChatType === 'group') {
        message = await sendGroupMessage(content);
    } else if (currentChatType === 'private' && currentChatPartner) {
        message = await sendPrivateMessage(currentChatPartner, content);
    } else if (currentChatType === 'parent' && currentChatPartner) {
        message = await sendParentMessage(currentChatPartner, content);
    } else {
        showToast('Cannot send message: No chat selected', 'error');
        return;
    }
    
    // Clear input
    input.value = '';
    
    // Refresh messages
    const container = document.getElementById('chat-messages-container');
    if (container) {
        container.innerHTML = renderMessages();
        container.scrollTop = container.scrollHeight;
    }
    
    showToast('Message sent', 'success');
}

// ============ EXPORT ============

window.initMessaging = initMessaging;
window.switchChat = switchChat;
window.handleSendMessage = handleSendMessage;
window.renderTeacherChat = renderTeacherChat;