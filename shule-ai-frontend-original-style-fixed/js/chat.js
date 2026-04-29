// chat.js - Chat functions for teachers and parents

async function loadTeacherMessages() {
    try {
        const response = await api.teacher.getConversations();
        const conversations = response.data || [];
        const container = document.getElementById('teacher-messages-list');
        const badge = document.getElementById('teacher-message-count-badge');
        if (!container) return;
        let totalUnread = 0;
        let html = '';
        if (conversations.length === 0) {
            html = `<div class="text-center text-muted-foreground py-8"><i data-lucide="message-circle" class="h-12 w-12 mx-auto mb-3 opacity-50"></i><p>No messages from parents yet</p></div>`;
        } else {
            conversations.forEach(conv => {
                totalUnread += conv.unreadCount;
                html += `
                    <div class="p-3 border rounded-lg hover:bg-accent cursor-pointer transition-all ${conv.unreadCount > 0 ? 'bg-primary/5 border-primary' : ''}" onclick="openTeacherConversation('${conv.userId}')">
                        <div class="flex justify-between items-start">
                            <div>
                                <p class="font-medium">${conv.userName || 'Parent'}</p>
                                <p class="text-xs text-muted-foreground">${conv.studentName ? `about ${conv.studentName} (Grade ${conv.studentGrade})` : ''}</p>
                                <p class="text-sm mt-1">${conv.lastMessage?.substring(0, 50) || ''}${conv.lastMessage?.length > 50 ? '...' : ''}</p>
                            </div>
                            <div class="text-right">
                                <p class="text-xs text-muted-foreground">${timeAgo(conv.lastMessageTime)}</p>
                                ${conv.unreadCount > 0 ? `<span class="bg-red-500 text-white text-xs rounded-full px-2 py-1 mt-1 inline-block">${conv.unreadCount}</span>` : ''}
                            </div>
                        </div>
                    </div>
                `;
            });
        }
        if (badge) {
            badge.textContent = totalUnread;
            if (totalUnread > 0) badge.classList.remove('hidden');
        }
        container.innerHTML = html;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    } catch (error) { console.error('Load messages error:', error); }
}

async function openTeacherConversation(otherUserId) {
    try {
        showLoading();
        const response = await api.teacher.getMessages(otherUserId);
        const messages = response.data || [];
        showTeacherConversationModal(messages, otherUserId);
        await loadTeacherMessages();
    } catch (error) {
        console.error('Open conversation error:', error);
        showToast('Failed to load conversation', 'error');
    } finally { hideLoading(); }
}

function showTeacherConversationModal(messages, otherUserId) {
    let modal = document.getElementById('teacher-conversation-modal');
    if (!modal) {
        createTeacherConversationModal();
        modal = document.getElementById('teacher-conversation-modal');
    }
    let messagesHTML = '';
    messages.forEach(msg => {
        const isSent = msg.senderId === getCurrentUser()?.id;
        messagesHTML += `
            <div class="flex ${isSent ? 'justify-end' : 'justify-start'}">
                <div class="${isSent ? 'chat-bubble-sent' : 'chat-bubble-received'} max-w-[70%]">
                    ${!isSent ? `<p class="text-sm font-medium">${msg.Sender?.name || 'Parent'}</p>` : ''}
                    <p class="text-sm">${msg.content}</p>
                    <p class="text-xs text-muted-foreground mt-1">${timeAgo(msg.createdAt)}</p>
                </div>
            </div>
        `;
    });
    const modalContent = modal.querySelector('.modal-content');
    if (modalContent) {
        modalContent.innerHTML = `
            <div class="space-y-4">
                <div class="flex justify-between items-center border-b pb-2">
                    <h4 class="font-semibold">Conversation with Parent</h4>
                    <button onclick="closeTeacherConversationModal()" class="p-1 hover:bg-accent rounded"><i data-lucide="x" class="h-5 w-5"></i></button>
                </div>
                <div class="space-y-4 max-h-96 overflow-y-auto p-2" id="conversation-messages">
                    ${messagesHTML || '<p class="text-center text-muted-foreground py-8">No messages</p>'}
                </div>
                <div class="flex gap-2 pt-2 border-t">
                    <input type="text" id="teacher-reply-input" placeholder="Type your reply..." class="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm">
                    <button onclick="sendTeacherReply('${otherUserId}')" class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"><i data-lucide="send" class="h-4 w-4"></i></button>
                </div>
            </div>
        `;
    }
    modal.classList.remove('hidden');
    setTimeout(() => {
        const messagesDiv = document.getElementById('conversation-messages');
        if (messagesDiv) messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }, 100);
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function createTeacherConversationModal() {
    const modalHTML = `
        <div id="teacher-conversation-modal" class="fixed inset-0 z-50 hidden">
            <div class="absolute inset-0 bg-black/50" onclick="closeTeacherConversationModal()"></div>
            <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl p-4">
                <div class="rounded-xl border bg-card shadow-xl animate-fade-in"><div class="modal-content p-6"></div></div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeTeacherConversationModal() {
    const modal = document.getElementById('teacher-conversation-modal');
    if (modal) modal.classList.add('hidden');
}

async function sendTeacherReply(parentId) {
    const replyInput = document.getElementById('teacher-reply-input');
    const message = replyInput?.value.trim();
    if (!message) { showToast('Please enter a message', 'error'); return; }
    showLoading();
    try {
        const response = await api.teacher.replyToParent({ parentId: parentId, message: message });
        if (response.success) {
            replyInput.value = '';
            const container = document.getElementById('conversation-messages');
            container.innerHTML += `
                <div class="flex justify-end">
                    <div class="chat-bubble-sent max-w-[70%]">
                        <p class="text-sm font-medium">You</p>
                        <p class="text-sm">${message}</p>
                        <p class="text-xs text-muted-foreground mt-1">just now</p>
                    </div>
                </div>
            `;
            container.scrollTop = container.scrollHeight;
            showToast('✅ Reply sent', 'success');
        }
    } catch (error) {
        console.error('Reply error:', error);
        showToast(error.message || 'Failed to send reply', 'error');
    } finally { hideLoading(); }
}

function sendChatMessage() {
    const input = document.getElementById('chat-message-input');
    const message = input?.value.trim();
    if (!message) return;
    const container = document.getElementById('chat-messages-container');
    if (container) {
        container.innerHTML += `
            <div class="flex justify-end">
                <div class="chat-bubble-sent max-w-[70%]">
                    <p class="text-sm font-medium">You</p>
                    <p class="text-sm">${message}</p>
                    <p class="text-xs text-muted-foreground mt-1">just now</p>
                </div>
            </div>
        `;
        container.scrollTop = container.scrollHeight;
    }
    input.value = '';
    setTimeout(() => {
        if (container) {
            container.innerHTML += `
                <div class="flex justify-start">
                    <div class="chat-bubble-received max-w-[70%]">
                        <p class="text-sm font-medium">${currentRole === 'teacher' ? 'Ms. Atieno' : 'Alex'}</p>
                        <p class="text-sm">Thanks for your message! I'll get back to you soon.</p>
                        <p class="text-xs text-muted-foreground mt-1">just now</p>
                    </div>
                </div>
            `;
            container.scrollTop = container.scrollHeight;
        }
    }, 1000);
}

window.loadTeacherMessages = loadTeacherMessages;
window.openTeacherConversation = openTeacherConversation;
window.closeTeacherConversationModal = closeTeacherConversationModal;
window.sendTeacherReply = sendTeacherReply;
window.sendChatMessage = sendChatMessage;