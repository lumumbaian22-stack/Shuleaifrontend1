/* Shule AI v62 - Simplified Teacher Messages & Study Rooms
   Clean Option 6 layout, real group/member/chat/thread functions, dark/light adaptive. */

let v9ChatState = {
  activeTab: 'study',
  mode: 'group',
  teachers: [],
  parents: [],
  groups: [],
  threads: [],
  selectedTeacher: null,
  selectedParent: null,
  selectedGroup: null,
  selectedThread: null,
  messages: [],
  members: [],
  availableMembers: [],
  attachment: null,
  threadAttachment: null,
  studyDetailTab: 'thread',
  listFilter: 'active',
  replyToMessage: null,
  editingMessage: null
};

function v9Safe(value) {
  const text = String(value ?? '');
  if (typeof escapeHtml === 'function') return escapeHtml(text);
  return text.replace(/[&<>'"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[c]));
}
function v9CurrentUser() { try { return typeof getCurrentUser === 'function' ? getCurrentUser() : null; } catch { return null; } }
function v9ClientMessageId(){ return (window.crypto?.randomUUID?.() || `msg-${Date.now()}-${Math.random().toString(16).slice(2)}`); }
function v9DirectKey(a,b){ return `direct:${[Number(a),Number(b)].sort((x,y)=>x-y).join(':')}`; }
function v9JoinConversation(key){ window.ShuleRealtime?.joinConversation?.(key || null); }
function v9Initials(name) { return String(name || 'U').split(' ').filter(Boolean).map(x => x[0]).join('').slice(0,2).toUpperCase(); }
function v9Time(value) { if (!value) return ''; try { return new Date(value).toLocaleString([], { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' }); } catch { return ''; } }
function v9AttachmentLabel(file) { if (!file) return ''; return file.name || file.originalname || 'Attachment'; }
function v9AttachmentLink(url, label = 'Attachment') {
  if (!url) return '';
  const safe = typeof resolveMediaUrl === 'function' ? resolveMediaUrl(url) : url;
  return `<a class="v9-file-chip" href="${v9Safe(safe)}" target="_blank" rel="noopener">📎 ${v9Safe(label)}</a>`;
}
function v9ThreadReplies(thread) { return thread?.ThreadReplies || thread?.replies || []; }
function v9ClassName(thread) { return thread?.Class?.name || thread?.className || thread?.metadata?.className || 'Class group'; }
function v9ThreadApproval(thread) { return thread?.metadata?.approvalStatus || (thread?.Creator?.role === 'student' ? 'pending' : 'approved'); }
function v9IsThreadActive(thread) { return !thread?.isClosed && v9ThreadApproval(thread) !== 'pending'; }
function v9StudentReplyCount(thread) { return v9ThreadReplies(thread).filter(r => (r.Author?.role || r.authorRole) === 'student').length; }
function v9TotalStudents(thread) { return thread?.metadata?.studentCount || thread?.studentCount || thread?.metadata?.participantsCount || '—'; }
function v9Toast(message, type='info') { if (typeof showToast === 'function') showToast(message, type); else console[type === 'error' ? 'error' : 'log'](message); }

function v9MessageReplyPreview(meta = {}) {
  const replyTo = meta.replyTo;
  if (!replyTo) return '';
  return `<div class="v9-reply-preview"><strong>↪ ${v9Safe(replyTo.senderName || replyTo.authorName || 'User')}</strong><span>${v9Safe(replyTo.content || '')}</span></div>`;
}
function v9EditedLabel(item) { return item?.metadata?.edited ? '<span>edited</span>' : ''; }
function v9CanEditOwn(ownerId) { return Number(ownerId) === Number(v9CurrentUser()?.id); }
function v9IsDeleted(item) { return Boolean(item?.metadata?.deletedForEveryone) || item?.messageType === 'deleted'; }
function v9CancelChatAction() { v9ChatState.replyToMessage = null; v9ChatState.editingMessage = null; v9RenderTeacherShell(); }
function v9CancelStudentAction() { v9StudentState.replyToMessage = null; v9StudentState.editingMessage = null; v9StudentState.replyToReply = null; v9StudentState.editingReply = null; v9RenderStudentStudyRoom(); }

function v9IsStaffUser() {
  const role = v9CurrentUser()?.role;
  return ['teacher','admin','super_admin'].includes(role);
}
function v9CanShowParentsTab() {
  try { return typeof isClassTeacher === 'function' ? !!isClassTeacher() : false; } catch { return false; }
}
function v9ParentDisplayName(parent) {
  return parent?.userName || parent?.parentName || parent?.name || 'Parent';
}
function v9ConversationName(selected) {
  if (!selected) return 'Conversation';
  if (v9ChatState.activeTab === 'parents') return v9ParentDisplayName(selected);
  return selected.name || selected.userName || 'Conversation';
}
function v9ConversationSubtitle(selected) {
  if (!selected) return '';
  if (v9ChatState.activeTab === 'parents') {
    const parts = [];
    if (selected.studentName) parts.push(`Parent of ${selected.studentName}`);
    if (selected.className || selected.studentGrade) parts.push(selected.className || selected.studentGrade);
    return parts.join(' • ') || 'Parent linked to your class';
  }
  if (v9ChatState.activeTab === 'groups') return `${v9ChatState.members.length} members • managed group`;
  return 'Teacher-to-teacher private chat';
}
function v9RenderMessageListOnly(forceBottom = false) {
  const list = document.getElementById('v9-message-list');
  if (!list) return;
  const wasNearBottom = forceBottom || (list.scrollHeight - list.scrollTop - list.clientHeight < 96);
  const previousTop = list.scrollTop;
  list.innerHTML = v9RenderMessages(v9CurrentUser());
  list.scrollTop = wasNearBottom ? list.scrollHeight : previousTop;
}
function v9RenderConversationListOnly() {
  const list = document.getElementById('v9-conversation-list');
  if (!list) return;
  list.innerHTML = v9ChatState.activeTab === 'chats' ? v9RenderDirectList() : v9ChatState.activeTab === 'parents' ? v9RenderParentList() : v9RenderGroupList();
}
function v9AppendMessageToState(message) {
  if (!message) return;
  const exists = v9ChatState.messages.some(m => Number(m.id) === Number(message.id));
  if (!exists) v9ChatState.messages.push(message);
  v9RenderMessageListOnly();
}
function v9AppendReplyToThread(threadId, reply) {
  const thread = (v9StudentState?.threads || v9ChatState.threads || []).find(t => Number(t.id) === Number(threadId));
  if (!thread || !reply) return false;
  if (!Array.isArray(thread.ThreadReplies)) thread.ThreadReplies = thread.replies || [];
  if (!thread.ThreadReplies.some(r => Number(r.id) === Number(reply.id))) thread.ThreadReplies.push(reply);
  return true;
}

async function renderTeacherV9Messages() {
  return `
    <div class="tm6-page animate-fade-in">
      <div class="tm6-header">
        <div>
          <p class="tm6-eyebrow">Teacher Communication</p>
          <h2>Messages & Study Rooms</h2>
          <p>Simple chats, managed groups, student study threads, attachments, and student rewards.</p>
        </div>
        <div class="tm6-header-actions">
          <button class="tm6-btn ghost" onclick="v9RefreshTeacherChat()">Refresh</button>
          <button class="tm6-btn primary" onclick="v9OpenCreateMenu()">+ New</button>
        </div>
      </div>

      <div class="tm6-tabs" role="tablist">
        <button class="${v9ChatState.activeTab === 'chats' ? 'active' : ''}" onclick="v9SetMainTab('chats')">Chats</button>
        ${v9CanShowParentsTab() ? `<button class="${v9ChatState.activeTab === 'parents' ? 'active' : ''}" onclick="v9SetMainTab('parents')">Parents</button>` : ''}
        <button class="${v9ChatState.activeTab === 'groups' ? 'active' : ''}" onclick="v9SetMainTab('groups')">Groups</button>
        <button class="${v9ChatState.activeTab === 'study' ? 'active' : ''}" onclick="v9SetMainTab('study')">Study Rooms</button>
        <button class="${v9ChatState.activeTab === 'announcements' ? 'active' : ''}" onclick="v9SetMainTab('announcements')">Announcements</button>
      </div>

      <div id="v9-teacher-chat-root" class="tm6-root">
        <div class="tm6-empty">Loading messages...</div>
      </div>
    </div>`;
}

async function v9RefreshTeacherChat() {
  const root = document.getElementById('v9-teacher-chat-root');
  if (root) root.innerHTML = '<div class="tm6-empty">Loading teacher workspace...</div>';
  try {
    const parentPromise = v9CanShowParentsTab() && window.api?.teacher?.getParentConversations
      ? window.api.teacher.getParentConversations().catch(() => ({ data: [] }))
      : Promise.resolve({ data: [] });
    const [teachersRes, groupsRes, threadsRes, parentsRes] = await Promise.all([
      chatV9API.getTeachers(),
      chatV9API.getTeacherGroups(),
      chatV9API.getClassroomThreads(),
      parentPromise
    ]);
    const me = v9CurrentUser();
    v9ChatState.teachers = (teachersRes.data || []).filter(t => Number(t.id) !== Number(me?.id) && t.role === 'teacher');
    v9ChatState.parents = v9CanShowParentsTab() ? (parentsRes.data || []) : [];
    v9ChatState.groups = groupsRes.data || [];
    v9ChatState.threads = threadsRes.data || [];
    if (!v9ChatState.selectedTeacher && v9ChatState.teachers[0]) v9ChatState.selectedTeacher = v9ChatState.teachers[0];
    if (!v9ChatState.selectedParent && v9ChatState.parents[0]) v9ChatState.selectedParent = v9ChatState.parents[0];
    if (!v9ChatState.selectedGroup && v9ChatState.groups[0]) v9ChatState.selectedGroup = v9ChatState.groups[0];
    if (!v9ChatState.selectedThread && v9ChatState.threads[0]) v9ChatState.selectedThread = v9ChatState.threads[0];
    if (v9ChatState.activeTab === 'parents' && !v9CanShowParentsTab()) { v9ChatState.activeTab = 'chats'; v9ChatState.mode = 'direct'; }
    await v9LoadCurrentMessages();
  } catch (err) {
    console.error('Teacher messages load failed:', err);
    if (root) root.innerHTML = `<div class="tm6-empty error">${v9Safe(err.message || 'Could not load messages')}</div>`;
  }
}

function v9SetMainTab(tab) {
  v9ChatState.activeTab = tab;
  if (tab === 'chats') v9ChatState.mode = 'direct';
  if (tab === 'parents') v9ChatState.mode = 'parent';
  if (tab === 'groups') v9ChatState.mode = 'group';
  v9LoadCurrentMessages();
}
function v9SetChatMode(mode) { v9ChatState.mode = mode; v9LoadCurrentMessages(); }

async function v9LoadCurrentMessages() {
  try {
    if (v9ChatState.activeTab === 'study') return v9RenderTeacherShell();
    if (v9ChatState.activeTab === 'announcements') return v9RenderTeacherShell();
    let res = { data: [] };
    const me = v9CurrentUser();
    if (v9ChatState.mode === 'direct' && v9ChatState.selectedTeacher) {
      v9JoinConversation(v9DirectKey(me?.id, v9ChatState.selectedTeacher.id));
      res = await chatV9API.getDirectMessages(v9ChatState.selectedTeacher.id);
    } else if (v9ChatState.mode === 'parent' && v9ChatState.selectedParent && window.api?.teacher?.getParentMessages) {
      v9JoinConversation(null);
      res = await window.api.teacher.getParentMessages(v9ChatState.selectedParent.userId);
      const selectedKey = v9ChatState.selectedParent.conversationKey;
      if (selectedKey) res.data = (res.data || []).filter(m => !m.metadata?.conversationKey || m.metadata.conversationKey === selectedKey);
    } else if (v9ChatState.mode === 'group' && v9ChatState.selectedGroup) {
      v9JoinConversation(`group:${Number(v9ChatState.selectedGroup.id)}`);
      res = await chatV9API.getGroupMessages(v9ChatState.selectedGroup.id);
      await v9LoadMembers(v9ChatState.selectedGroup.id);
    }
    v9ChatState.messages = res.data || [];
    v9RenderTeacherShell();
  } catch (err) {
    console.error('Messages load failed:', err);
    v9ChatState.messages = [];
    v9RenderTeacherShell();
  }
}

async function v9LoadMembers(groupId) {
  if (!groupId) return;
  try { const res = await chatV9API.getGroupMembers(groupId); v9ChatState.members = res.data || []; }
  catch { v9ChatState.members = []; }
}

function v9RenderTeacherShell() {
  const root = document.getElementById('v9-teacher-chat-root');
  if (!root) return;
  if (v9ChatState.activeTab === 'study') return v9RenderStudyRooms(root);
  if (v9ChatState.activeTab === 'announcements') return v9RenderAnnouncements(root);

  const isParents = v9ChatState.activeTab === 'parents';
  const list = v9ChatState.activeTab === 'chats' ? v9RenderDirectList() : isParents ? v9RenderParentList() : v9RenderGroupList();
  const selected = v9ChatState.activeTab === 'chats' ? v9ChatState.selectedTeacher : isParents ? v9ChatState.selectedParent : v9ChatState.selectedGroup;
  const panelTitle = v9ChatState.activeTab === 'chats' ? 'Teacher Chats' : isParents ? 'Parents' : 'Groups';
  const panelSub = v9ChatState.activeTab === 'chats' ? 'Fellow teachers only' : isParents ? 'Parents of your class only' : 'Teacher and student groups';
  root.innerHTML = `
    <div class="tm6-chat-layout">
      <aside class="tm6-list-panel">
        <div class="tm6-panel-title">
          <div><h3>${panelTitle}</h3><p>${panelSub}</p></div>
          ${v9ChatState.activeTab === 'groups' ? '<button onclick="v9OpenCreateGroupModal()">+</button>' : ''}
        </div>
        <input class="tm6-search" placeholder="Search..." oninput="v9FilterConversations(this.value)">
        <div id="v9-conversation-list">${list}</div>
      </aside>
      <section class="tm6-chat-panel">
        ${selected ? v9RenderChatWindow(selected) : '<div class="tm6-empty">Select a conversation.</div>'}
      </section>
    </div>`;
  const msgList = document.getElementById('v9-message-list');
  if (msgList) msgList.scrollTop = msgList.scrollHeight;
}

function v9RenderDirectList() {
  if (!v9ChatState.teachers.length) return '<div class="tm6-empty small">No approved private-chat contacts found.</div>';
  return v9ChatState.teachers.map(t => `
    <button class="tm6-list-item ${Number(v9ChatState.selectedTeacher?.id) === Number(t.id) ? 'active' : ''}" onclick="v9SelectTeacher(${Number(t.id)})">
      <span class="tm6-avatar">${v9Initials(t.name)}</span>
      <span><strong>${v9Safe(t.name)}</strong><small>${v9Safe(t.role === 'student' ? (t.Student?.grade || t.className || 'Student') : (t.email || 'Teacher'))}${t.unreadCount ? ` • ${t.unreadCount} unread` : ''}</small></span>
    </button>`).join('');
}
function v9RenderParentList() {
  if (!v9CanShowParentsTab()) return '<div class="tm6-empty small">Parent chats are visible only to class teachers.</div>';
  if (!v9ChatState.parents.length) return '<div class="tm6-empty small">No linked parents found for your class yet.</div>';
  return v9ChatState.parents.map(p => {
    const active = Number(v9ChatState.selectedParent?.userId) === Number(p.userId) && String(v9ChatState.selectedParent?.conversationKey || '') === String(p.conversationKey || '');
    return `<button class="tm6-list-item ${active ? 'active' : ''}" onclick="v9SelectParent(${Number(p.userId)}, '${v9Safe(p.conversationKey || '')}')">
      <span class="tm6-avatar parent">${v9Initials(v9ParentDisplayName(p))}</span>
      <span><strong>${v9Safe(v9ParentDisplayName(p))}</strong><small>${v9Safe(p.studentName ? `Parent of ${p.studentName}` : 'Parent')} ${p.unreadCount ? `• ${p.unreadCount} unread` : ''}</small></span>
    </button>`;
  }).join('');
}
function v9RenderGroupList() {
  if (!v9ChatState.groups.length) return '<div class="tm6-empty small">No groups yet. Create one and add members.</div>';
  return v9ChatState.groups.map(g => `
    <button class="tm6-list-item ${Number(v9ChatState.selectedGroup?.id) === Number(g.id) ? 'active' : ''}" onclick="v9SelectGroup(${Number(g.id)})">
      <span class="tm6-avatar ${g.type || ''}">${g.type === 'department' ? '🏫' : g.type === 'staff' ? '👥' : '💬'}</span>
      <span><strong>${v9Safe(g.name)}</strong><small>${v9Safe(g.type || 'group')}${g.headName ? ' • '+v9Safe(g.headName) : ''}${g.unreadCount ? ` • ${g.unreadCount} unread` : ''}</small></span>
    </button>`).join('');
}
function v9RenderChatWindow(selected) {
  const isGroup = v9ChatState.activeTab === 'groups';
  const isParent = v9ChatState.activeTab === 'parents';
  const displayName = v9ConversationName(selected);
  return `
    <header class="tm6-chat-head">
      <div class="tm6-title-row"><span class="tm6-avatar big">${isGroup ? '👥' : v9Initials(displayName)}</span><div><h3>${v9Safe(displayName)}</h3><p>${v9Safe(v9ConversationSubtitle(selected))}</p></div></div>
      <div class="tm6-chat-actions">
        ${isGroup && v9IsStaffUser() ? `<button class="tm6-btn light" onclick="v9OpenManageMembersModal(${Number(selected.id)})">Manage Members</button>` : ''}
        ${!isParent ? `<button class="tm6-btn light" onclick="v9PickAttachment()">Attach</button>` : ''}
        <input id="v9-file-input" type="file" class="hidden" onchange="v9UploadAttachment(this.files[0])">
      </div>
    </header>
    <main class="tm6-messages" id="v9-message-list">${v9RenderMessages(v9CurrentUser())}</main>
    <footer class="tm6-composer">
      <div id="v9-selected-attachment" class="tm6-selected-file">${v9ChatState.attachment ? `${v9AttachmentLink(v9ChatState.attachment.url, v9AttachmentLabel(v9ChatState.attachment))}<button onclick="v9ClearAttachment()">×</button>` : ''}</div>
      ${(v9ChatState.replyToMessage || v9ChatState.editingMessage) ? `<div class="tm6-selected-file"><span>${v9ChatState.editingMessage ? '✏️ Editing' : '↪ Replying to'} ${v9Safe((v9ChatState.editingMessage || v9ChatState.replyToMessage)?.content || '')}</span><button onclick="v9CancelChatAction()">×</button></div>` : ''}
      <div class="tm6-compose-row"><input id="v9-message-input" placeholder="${v9ChatState.editingMessage ? 'Edit message...' : 'Type a message...'}" onkeydown="if(event.key==='Enter')v9SendMessage()"><button onclick="v9SendMessage()">${v9ChatState.editingMessage ? 'Save' : '➤'}</button></div>
    </footer>`;
}

function v9RenderMessages(currentUser) {
  if (!v9ChatState.messages.length) return '<div class="tm6-empty">No messages yet. Start the conversation.</div>';
  return v9ChatState.messages.map(m => {
    const mine = Number(m.senderId) === Number(currentUser?.id);
    const sender = m.Sender || {};
    const reactions = m.metadata?.reactions || {};
    const deleted = v9IsDeleted(m);
    return `<article class="tm6-msg ${mine ? 'mine' : ''}">
      <span class="tm6-avatar small">${v9Initials(sender.name || 'U')}</span>
      <div class="tm6-bubble">
        ${!mine ? `<strong>${v9Safe(sender.name || 'User')}</strong>` : ''}
        ${v9MessageReplyPreview(m.metadata || {})}
        <p>${v9Safe(m.content || '')}</p>
        ${!deleted ? v9AttachmentLink(m.attachmentUrl, m.metadata?.attachmentName || 'Attachment') : ''}
        <div class="tm6-meta"><span>${v9Time(m.createdAt)}</span>${v9EditedLabel(m)}${m.pointsAwarded ? `<span>⭐ ${m.pointsAwarded}</span>` : ''}${m.streakAwarded ? `<span>🔥 ${m.streakAwarded}</span>` : ''}</div>
        ${!deleted ? `<div class="tm6-reactions">${Object.entries(reactions).map(([emoji, users]) => `<button onclick="v9ReactToMessage(${Number(m.id)}, '${v9Safe(emoji)}')">${v9Safe(emoji)} ${(users || []).length}</button>`).join('')}</div>` : ''}
        ${!deleted ? v9RenderMessageActions(m, sender, mine) : ''}
      </div>
    </article>`;
  }).join('');
}
function v9RenderMessageActions(m, sender, mine) {
  const base = [`<button onclick="v9StartReplyMessage(${Number(m.id)})">↩ Reply</button>`];
  if (mine) {
    base.push(`<button onclick="v9StartEditMessage(${Number(m.id)})">✏️ Edit</button>`);
    base.push(`<button onclick="v9DeleteMessage(${Number(m.id)}, 'me')">🗑️ Delete for me</button>`);
    base.push(`<button onclick="v9DeleteMessage(${Number(m.id)}, 'everyone')">🚫 Delete everyone</button>`);
  } else {
    base.push(`<button onclick="v9DeleteMessage(${Number(m.id)}, 'me')">🗑️ Delete for me</button>`);
    if (sender.role === 'student') {
      base.push(`<button onclick="v9AwardMessage(${Number(m.id)},1,0)">⭐ +1</button><button onclick="v9AwardMessage(${Number(m.id)},5,1)">⭐ +5 🔥</button>`);
    } else {
      base.push(`<button onclick="v9ReactToMessage(${Number(m.id)}, '👍')">👍</button><button onclick="v9ReactToMessage(${Number(m.id)}, '👏')">👏</button><button onclick="v9ReactToMessage(${Number(m.id)}, '✅')">✅</button><button onclick="v9ReactToMessage(${Number(m.id)}, '🔥')">🔥</button>`);
    }
  }
  return `<div class="tm6-mini-actions">${base.join('')}</div>`;
}


function v9RenderStudyRooms(root) {
  const filtered = v9FilteredThreads();
  if (!v9ChatState.selectedThread || !v9ChatState.threads.find(t => Number(t.id) === Number(v9ChatState.selectedThread?.id))) {
    v9ChatState.selectedThread = filtered[0] || v9ChatState.threads[0] || null;
  }
  root.innerHTML = `
    <div class="tm6-study-layout">
      <section class="tm6-study-main">
        <div class="tm6-study-head">
          <div><h3>Study Rooms</h3><p>Approve student study requests, post questions, monitor replies, and reward students.</p></div>
          <button class="tm6-btn primary" onclick="v9OpenCreateThreadModal()">+ New Thread</button>
        </div>
        <div class="tm6-filter-row">
          <button class="${v9ChatState.listFilter === 'active' ? 'active' : ''}" onclick="v9SetThreadFilter('active')">Active</button>
          <button class="${v9ChatState.listFilter === 'pending' ? 'active' : ''}" onclick="v9SetThreadFilter('pending')">Pending Approval</button>
          <button class="${v9ChatState.listFilter === 'closed' ? 'active' : ''}" onclick="v9SetThreadFilter('closed')">Closed</button>
          <button class="${v9ChatState.listFilter === 'all' ? 'active' : ''}" onclick="v9SetThreadFilter('all')">All</button>
        </div>
        <div class="tm6-thread-list" id="v9-thread-list">${v9RenderThreadCards(filtered)}</div>
      </section>
      <aside class="tm6-thread-side">${v9ChatState.selectedThread ? v9RenderThreadDetail(v9ChatState.selectedThread) : '<div class="tm6-empty">No study room selected.</div>'}</aside>
    </div>`;
}
function v9FilteredThreads() {
  const list = v9ChatState.threads || [];
  if (v9ChatState.listFilter === 'pending') return list.filter(t => v9ThreadApproval(t) === 'pending');
  if (v9ChatState.listFilter === 'closed') return list.filter(t => t.isClosed);
  if (v9ChatState.listFilter === 'active') return list.filter(t => v9IsThreadActive(t));
  return list;
}
function v9SetThreadFilter(filter) { v9ChatState.listFilter = filter; v9RenderTeacherShell(); }
function v9RenderThreadCards(threads) {
  if (!threads.length) return '<div class="tm6-empty">No threads in this view.</div>';
  return threads.map(t => {
    const replied = v9StudentReplyCount(t);
    const total = v9TotalStudents(t);
    const pending = v9ThreadApproval(t) === 'pending';
    return `<button class="tm6-thread-card ${Number(v9ChatState.selectedThread?.id) === Number(t.id) ? 'active' : ''}" onclick="v9SelectThread(${Number(t.id)})">
      <span class="tm6-thread-icon">${pending ? '⏳' : t.isClosed ? '🔒' : '📝'}</span>
      <span class="tm6-thread-copy"><strong>${v9Safe(t.topic || 'Untitled')}</strong><small>${v9Safe(v9ClassName(t))} • ${v9Safe(t.subject || 'Subject')}</small><em>${v9Safe((t.content || '').slice(0, 80))}</em></span>
      <span class="tm6-progress"><b>${replied}/${total}</b><small>replied</small></span>
    </button>`;
  }).join('');
}
function v9RenderThreadDetail(t) {
  const replies = v9ThreadReplies(t);
  const studentReplies = replies.filter(r => (r.Author?.role || r.authorRole) === 'student');
  const attachments = t.metadata?.attachments || [];
  const pending = v9ThreadApproval(t) === 'pending';
  return `<div class="tm6-thread-detail">
    <div class="tm6-detail-head"><div><span class="tm6-pill">${v9Safe(t.subject || 'Subject')}</span><h3>${v9Safe(t.topic || 'Study Thread')}</h3><p>${v9Safe(v9ClassName(t))} • ${pending ? 'Pending teacher approval' : t.isClosed ? 'Closed' : 'Active'}</p></div><button class="tm6-icon" onclick="v9OpenThreadActions(${Number(t.id)})">⋯</button></div>
    <div class="tm6-detail-tabs"><button class="${v9ChatState.studyDetailTab === 'thread' ? 'active' : ''}" onclick="v9SetStudyDetailTab('thread')">Thread</button><button class="${v9ChatState.studyDetailTab === 'responses' ? 'active' : ''}" onclick="v9SetStudyDetailTab('responses')">Responses <span>${studentReplies.length}</span></button><button class="${v9ChatState.studyDetailTab === 'analytics' ? 'active' : ''}" onclick="v9SetStudyDetailTab('analytics')">Analytics</button></div>
    <div class="tm6-detail-body">${v9RenderStudyDetailBody(t, replies, attachments, pending)}</div>
  </div>`;
}
function v9SetStudyDetailTab(tab) { v9ChatState.studyDetailTab = tab; v9RenderTeacherShell(); }
function v9RenderStudyDetailBody(t, replies, attachments, pending) {
  if (v9ChatState.studyDetailTab === 'responses') return v9RenderResponses(t, replies) + (!pending && !t.isClosed ? v9RenderStudentReplyComposer(t.id) : '');
  if (v9ChatState.studyDetailTab === 'analytics') return v9RenderThreadAnalytics(t, replies);
  return `<section class="tm6-question"><label>Question / Topic</label><p>${v9Safe(t.content || '')}</p>${attachments.length ? `<div class="tm6-file-row">${attachments.map(a => v9AttachmentLink(a.url, a.name || 'Attachment')).join('')}</div>` : ''}</section>
    <div class="tm6-action-grid">
      ${pending ? `<button onclick="v9ApproveThread(${Number(t.id)})">✅ Approve</button>` : `<button onclick="v9OpenThreadReply(${Number(t.id)})">💬 Feedback</button>`}
      <button onclick="v9OpenCreateThreadModal()">➕ New</button>
      <button onclick="v9RemindThread(${Number(t.id)})">🔔 Remind</button>
      <button onclick="v9CloseThread(${Number(t.id)})">${t.isClosed ? '🔓 Reopen' : '🔒 Close'}</button>
    </div>${!pending && !t.isClosed ? v9RenderStudentReplyComposer(t.id) : ''}`;
}
function v9RenderResponses(t, replies) {
  if (!replies.length) return '<div class="tm6-empty small">No student responses yet.</div>';
  return replies.map(r => v9RenderTeacherReply(r)).join('');
}
function v9RenderThreadAnalytics(t, replies) {
  const studentReplies = replies.filter(r => (r.Author?.role || r.authorRole) === 'student');
  return `<div class="tm6-analytics-grid"><div><strong>${studentReplies.length}</strong><span>Student replies</span></div><div><strong>${v9TotalStudents(t)}</strong><span>Expected</span></div><div><strong>${Math.round((studentReplies.length / (Number(v9TotalStudents(t)) || studentReplies.length || 1)) * 100)}%</strong><span>Participation</span></div></div>`;
}
function v9RenderTeacherReply(r) {
  const author = r.Author || {};
  const isStudent = author.role === 'student';
  const mine = Number(author.id || r.userId) === Number(v9CurrentUser()?.id);
  const deleted = v9IsDeleted(r);
  return `<article class="tm6-response">
    <div class="tm6-response-head"><span class="tm6-avatar small">${v9Initials(author.name || 'U')}</span><div><strong>${v9Safe(author.name || 'User')}</strong><small>${v9Time(r.createdAt)} ${r.metadata?.edited ? '• edited' : ''}</small></div><button class="tm6-icon" onclick="${isStudent ? `v9OpenRewardModal(${Number(r.id)})` : `v9HelpfulReply(${Number(r.id)})`}">${isStudent ? '⭐' : '👍'}</button></div>
    ${v9MessageReplyPreview(r.metadata || {})}
    <p>${v9Safe(r.content || '')}</p>
    ${!deleted ? v9AttachmentLink(r.metadata?.attachmentUrl, r.metadata?.attachmentName || 'Attachment') : ''}
    ${!deleted ? `<div class="tm6-mini-actions"><button onclick="v9StartReplyToThreadReply(${Number(r.id)})">↩ Reply</button>${mine ? `<button onclick="v9StartEditThreadReply(${Number(r.id)})">✏️ Edit</button><button onclick="v9DeleteThreadReply(${Number(r.id)}, 'me')">🗑️ Me</button><button onclick="v9DeleteThreadReply(${Number(r.id)}, 'everyone')">🚫 Everyone</button>` : `<button onclick="v9DeleteThreadReply(${Number(r.id)}, 'me')">🗑️ Me</button>`}${r.pointsAwarded ? `<span>⭐ ${r.pointsAwarded}</span>` : ''}${r.streakAwarded ? `<span>🔥 ${r.streakAwarded}</span>` : ''}${isStudent ? `<button onclick="v9AwardReply(${Number(r.id)},1,0)">⭐ +1</button><button onclick="v9AwardReply(${Number(r.id)},5,1)">⭐ +5 🔥</button>` : `<button onclick="v9HelpfulReply(${Number(r.id)})">👍 Helpful</button>`}</div>` : ''}
  </article>`;
}

function v9RenderAnnouncements(root) {
  root.innerHTML = `<div class="tm6-announcements"><h3>Announcements</h3><p>Use this area for class or group broadcasts. The announcement composer will reuse the same attachment and group delivery logic.</p><button class="tm6-btn primary" onclick="v9OpenCreateGroupModal()">Create announcement group</button></div>`;
}

function v9SelectTeacher(id) { v9ChatState.selectedTeacher = v9ChatState.teachers.find(t => Number(t.id) === Number(id)); if(v9ChatState.selectedTeacher)v9ChatState.selectedTeacher.unreadCount=0; v9ChatState.mode = 'direct'; v9LoadCurrentMessages(); }
function v9SelectParent(id, conversationKey = '') {
  v9ChatState.selectedParent = v9ChatState.parents.find(p => Number(p.userId) === Number(id) && (!conversationKey || String(p.conversationKey || '') === String(conversationKey)))
    || v9ChatState.parents.find(p => Number(p.userId) === Number(id)) || null;
  if(v9ChatState.selectedParent)v9ChatState.selectedParent.unreadCount=0;
  v9ChatState.mode = 'parent';
  v9LoadCurrentMessages();
}
function v9SelectGroup(id) { v9ChatState.selectedGroup = v9ChatState.groups.find(g => Number(g.id) === Number(id)); if(v9ChatState.selectedGroup)v9ChatState.selectedGroup.unreadCount=0; v9ChatState.mode = 'group'; v9LoadCurrentMessages(); }
function v9SelectThread(id) { v9ChatState.selectedThread = v9ChatState.threads.find(t => Number(t.id) === Number(id)); v9ChatState.studyDetailTab = 'thread'; v9RenderTeacherShell(); }
function v9FilterConversations(value) { const q=(value||'').toLowerCase(); document.querySelectorAll('#v9-conversation-list .tm6-list-item').forEach(el => { el.style.display = el.textContent.toLowerCase().includes(q) ? '' : 'none'; }); }
function v9FilterThreads(value) { const q=(value||'').toLowerCase(); document.querySelectorAll('#v9-thread-list .tm6-thread-card').forEach(el => { el.style.display = el.textContent.toLowerCase().includes(q) ? '' : 'none'; }); }
function v9PickAttachment() { document.getElementById('v9-file-input')?.click(); }
function v9ClearAttachment() { v9ChatState.attachment = null; v9RenderTeacherShell(); }

async function v9UploadAttachment(file) {
  if (!file) return;
  try {
    const fd = new FormData(); fd.append('file', file);
    const res = await chatV9API.uploadAttachment(fd);
    v9ChatState.attachment = res.data;
    v9RenderTeacherShell();
  } catch (err) { v9Toast(err.message || 'Upload failed', 'error'); }
}
async function v9SendMessage() {
  const input=document.getElementById('v9-message-input'); const content=input?.value?.trim()||(v9ChatState.attachment?'Shared an attachment':''); if(!content)return;
  const attachment=v9ChatState.attachment, attachmentUrl=attachment?.url||null, previousValue=input?.value||'', editing=v9ChatState.editingMessage, replyTo=v9ChatState.replyToMessage;
  try{
    if(input)input.value='';v9ChatState.attachment=null;v9ChatState.replyToMessage=null;v9ChatState.editingMessage=null;const attachmentBox=document.getElementById('v9-selected-attachment');if(attachmentBox)attachmentBox.innerHTML='';
    if(editing){const res=await chatV9API.editMessage(editing.id,content);const index=v9ChatState.messages.findIndex(m=>Number(m.id)===Number(editing.id));if(index>=0&&res?.data)v9ChatState.messages[index]=res.data;v9RenderMessageListOnly();return;}
    const clientMessageId=v9ClientMessageId(); const me=v9CurrentUser();
    const temp={id:`temp-${clientMessageId}`,clientMessageId,senderId:me?.id,content,attachmentUrl,messageType:attachmentUrl?'file':'text',deliveryStatus:'sending',createdAt:new Date().toISOString(),Sender:{id:me?.id,name:me?.name,role:me?.role},metadata:{replyTo:replyTo?{id:replyTo.id,senderName:replyTo.Sender?.name||'User',content:replyTo.content}:null}};
    v9ChatState.messages.push(temp);v9RenderMessageListOnly();let res=null;
    if(v9ChatState.mode==='direct'&&v9ChatState.selectedTeacher)res=await chatV9API.sendDirectMessage(v9ChatState.selectedTeacher.id,content,attachmentUrl,attachment,replyTo?.id||null,clientMessageId);
    if(v9ChatState.mode==='parent'&&v9ChatState.selectedParent&&window.api?.teacher?.replyToParent)res=await window.api.teacher.replyToParent({parentId:v9ChatState.selectedParent.userId,message:content,originalMessageId:replyTo?.id||v9ChatState.messages.filter(m=>!String(m.id).startsWith('temp-')).at(-1)?.id||null,conversationKey:v9ChatState.selectedParent.conversationKey||null,clientMessageId});
    if(v9ChatState.mode==='group'&&v9ChatState.selectedGroup)res=await chatV9API.sendGroupMessage(v9ChatState.selectedGroup.id,content,attachmentUrl,attachment,replyTo?.id||null,clientMessageId);
    const i=v9ChatState.messages.findIndex(m=>m.clientMessageId===clientMessageId);if(res?.data&&i>=0)v9ChatState.messages[i]=res.data;else if(!res?.data&&i>=0)v9ChatState.messages[i].deliveryStatus='sent';v9RenderMessageListOnly();
  }catch(err){const temp=v9ChatState.messages.find(m=>String(m.id).startsWith('temp-')&&m.content===content);if(temp)temp.deliveryStatus='failed';if(input)input.value=previousValue;v9ChatState.attachment=attachment;v9ChatState.replyToMessage=replyTo;v9ChatState.editingMessage=editing;v9RenderMessageListOnly();v9Toast(err.message||'Message failed','error');}
}
function v9StartReplyMessage(messageId) {
  const msg = v9ChatState.messages.find(m => Number(m.id) === Number(messageId));
  if (!msg || v9IsDeleted(msg)) return;
  v9ChatState.replyToMessage = msg;
  v9ChatState.editingMessage = null;
  v9RenderTeacherShell();
  setTimeout(() => document.getElementById('v9-message-input')?.focus(), 50);
}
function v9StartEditMessage(messageId) {
  const msg = v9ChatState.messages.find(m => Number(m.id) === Number(messageId));
  if (!msg || v9IsDeleted(msg)) return;
  v9ChatState.editingMessage = msg;
  v9ChatState.replyToMessage = null;
  v9RenderTeacherShell();
  setTimeout(() => { const input=document.getElementById('v9-message-input'); if(input){ input.value = msg.content || ''; input.focus(); } }, 50);
}
async function v9DeleteMessage(messageId, mode = 'me') {
  const label = mode === 'everyone' ? 'delete this message for everyone' : 'delete this message for you';
  if (!confirm(`Are you sure you want to ${label}?`)) return;
  try {
    const res = await chatV9API.deleteMessage(messageId, mode);
    if (mode === 'me') v9ChatState.messages = v9ChatState.messages.filter(m => Number(m.id) !== Number(messageId));
    else { const i = v9ChatState.messages.findIndex(m => Number(m.id) === Number(messageId)); if (i >= 0 && res?.data) v9ChatState.messages[i] = res.data; }
    v9RenderMessageListOnly();
  } catch (err) { v9Toast(err.message || 'Delete failed', 'error'); }
}
async function v9AwardMessage(messageId, points, streakDelta) { try { const res = await chatV9API.awardChatMessage(messageId, points, streakDelta, 'Great student contribution'); const msg = v9ChatState.messages.find(m => Number(m.id) === Number(messageId)); if (msg) { msg.pointsAwarded = (Number(msg.pointsAwarded)||0) + Number(points||0); msg.streakAwarded = (Number(msg.streakAwarded)||0) + Number(streakDelta||0); } v9RenderTeacherShell(); v9Toast('Reward saved', 'success'); } catch (err) { v9Toast(err.message || 'Only students can receive stars/streaks', 'error'); } }
async function v9ReactToMessage(messageId, emoji) { try { await chatV9API.reactToMessage(messageId, emoji); await v9LoadCurrentMessages(); } catch (err) { v9Toast(err.message || 'Reaction failed', 'error'); } }
async function v9AwardReply(replyId, points, streakDelta) { try { await chatV9API.awardThreadReply(replyId, points, streakDelta, 'Good study room response'); for (const t of v9ChatState.threads || []) { const replies = v9ThreadReplies(t); const reply = replies.find(r => Number(r.id) === Number(replyId)); if (reply) { reply.pointsAwarded = (Number(reply.pointsAwarded)||0) + Number(points||0); reply.streakAwarded = (Number(reply.streakAwarded)||0) + Number(streakDelta||0); } } v9RenderTeacherShell(); v9Toast('Reward saved', 'success'); } catch (err) { v9Toast(err.message || 'Award failed', 'error'); } }
function v9HelpfulReply() { v9Toast('Marked as helpful', 'success'); }

async function v9OpenCreateMenu() {
  await v9EnsureModal();
  const modal = document.getElementById('v9-modal');
  modal.innerHTML = `<div class="v9-modal-card small"><button class="v9-modal-close" onclick="v9CloseModal()">×</button><h3>Create New</h3><div class="tm6-create-grid"><button onclick="v9OpenCreateGroupModal()">👥 Group</button><button onclick="v9OpenCreateThreadModal()">📝 Study Thread</button><button onclick="v9SetMainTab('chats');v9CloseModal()">💬 Chat</button></div></div>`;
  modal.classList.remove('hidden');
}
async function v9OpenCreateGroupModal() {
  await v9EnsureModal();
  const modal = document.getElementById('v9-modal');
  const teachers = v9ChatState.teachers || [];
  modal.innerHTML = `<div class="v9-modal-card"><button class="v9-modal-close" onclick="v9CloseModal()">×</button><h3>Create Group</h3><p>Start simple. Add members now or manage them later.</p><input id="v9-new-group-name" placeholder="Group name" class="tm-input"><textarea id="v9-new-group-desc" placeholder="Description" class="tm-input"></textarea><div class="tm-member-picker">${teachers.map(t => `<label><input type="checkbox" value="${Number(t.id)}"> ${v9Safe(t.name)}</label>`).join('') || '<small>No teachers loaded yet.</small>'}</div><button class="tm6-btn primary full" onclick="v9SubmitCreateGroup()">Create Group</button></div>`;
  modal.classList.remove('hidden');
}
async function v9SubmitCreateGroup() {
  const name = document.getElementById('v9-new-group-name')?.value?.trim();
  const description = document.getElementById('v9-new-group-desc')?.value?.trim();
  const memberUserIds = [...document.querySelectorAll('#v9-modal input[type="checkbox"]:checked')].map(x => Number(x.value));
  if (!name) return v9Toast('Group name is required', 'error');
  try { await chatV9API.createTeacherGroup({ name, description, type:'teacher_group', memberUserIds }); v9CloseModal(); await v9RefreshTeacherChat(); v9ChatState.activeTab='groups'; } catch(err){ v9Toast(err.message || 'Group creation failed', 'error'); }
}
async function v9OpenManageMembersModal(groupId) {
  if (!groupId) return;
  await v9EnsureModal();
  const modal = document.getElementById('v9-modal');
  try {
    const [membersRes, availableRes] = await Promise.all([chatV9API.getGroupMembers(groupId), chatV9API.getAvailableMembers()]);
    const current = new Set((membersRes.data || []).map(m => Number(m.userId)));
    const users = (availableRes.data || []).filter(u => ['teacher','student'].includes(u.role));
    modal.innerHTML = `<div class="v9-modal-card wide"><button class="v9-modal-close" onclick="v9CloseModal()">×</button><h3>Manage Members</h3><p>Select teachers and students only. Parents are excluded from group member management.</p><input class="tm-input" placeholder="Search members..." oninput="v9FilterMemberPicker(this.value)"><div class="tm-member-picker two-col" id="v9-member-picker">${users.map(u => `<label><input type="checkbox" value="${Number(u.id)}" ${current.has(Number(u.id)) ? 'checked' : ''}> <span>${v9Safe(u.name)}</span><small>${v9Safe(u.role)}${u.className ? ' • '+v9Safe(u.className) : ''}</small></label>`).join('')}</div><button class="tm6-btn primary full" onclick="v9SaveGroupMembers(${Number(groupId)})">Save Members</button></div>`;
    modal.classList.remove('hidden');
  } catch(err){ v9Toast(err.message || 'Could not load members', 'error'); }
}
function v9FilterMemberPicker(value) { const q=(value||'').toLowerCase(); document.querySelectorAll('#v9-member-picker label').forEach(el => { el.style.display = el.textContent.toLowerCase().includes(q) ? '' : 'none'; }); }
async function v9SaveGroupMembers(groupId) { try { const memberUserIds = [...document.querySelectorAll('#v9-modal input[type="checkbox"]:checked')].map(x => Number(x.value)); await chatV9API.updateGroupMembers(groupId, memberUserIds); v9CloseModal(); await v9LoadCurrentMessages(); } catch(err){ v9Toast(err.message || 'Member update failed', 'error'); } }

async function v9OpenCreateThreadModal() {
  await v9EnsureModal();
  const modal = document.getElementById('v9-modal');
  modal.innerHTML = `<div class="v9-modal-card wide"><button class="v9-modal-close" onclick="v9CloseModal()">×</button><h3>Create Study Thread</h3><p>Teacher-created threads become active immediately. Student-created threads require teacher approval.</p><div class="tm-form-grid"><input id="v9-thread-topic" class="tm-input" placeholder="Topic e.g. Fractions Revision"><input id="v9-thread-subject" class="tm-input" placeholder="Subject e.g. Mathematics"><input id="v9-thread-class" class="tm-input" placeholder="Class ID optional"><input id="v9-thread-due" class="tm-input" type="date"></div><textarea id="v9-thread-content" class="tm-input" placeholder="Question / instructions"></textarea><div class="tm-attachment-row"><input id="v9-thread-file" type="file" onchange="v9UploadThreadAttachment(this.files[0])"><span id="v9-thread-attachment-label">No attachment selected</span></div><button class="tm6-btn primary full" onclick="v9SubmitCreateThread()">Create Thread</button></div>`;
  modal.classList.remove('hidden');
}
async function v9UploadThreadAttachment(file) { if (!file) return; try { const fd = new FormData(); fd.append('file', file); const res = await chatV9API.uploadAttachment(fd); v9ChatState.threadAttachment = res.data; const label = document.getElementById('v9-thread-attachment-label'); if (label) label.textContent = res.data?.name || 'Attachment selected'; } catch(err){ v9Toast(err.message || 'Attachment failed', 'error'); } }
async function v9SubmitCreateThread() {
  const topic=document.getElementById('v9-thread-topic')?.value?.trim();
  const subject=document.getElementById('v9-thread-subject')?.value?.trim();
  const content=document.getElementById('v9-thread-content')?.value?.trim();
  const classId=document.getElementById('v9-thread-class')?.value?.trim();
  const dueDate=document.getElementById('v9-thread-due')?.value;
  if(!topic||!subject||!content) return v9Toast('Topic, subject and question are required','error');
  try { await chatV9API.createClassroomThread({ topic, subject, content, classId: classId || null, metadata:{ dueDate, approvalRequired:true, approvalStatus:'approved', createdFrom:'teacher-messages', attachments: v9ChatState.threadAttachment ? [v9ChatState.threadAttachment] : [] } }); v9ChatState.threadAttachment=null; v9CloseModal(); await v9RefreshTeacherChat(); } catch(err){ v9Toast(err.message || 'Thread creation failed','error'); }
}
async function v9OpenThreadReply(threadId) { const content = prompt('Write feedback/reply to this study thread'); if (!content) return; try { await chatV9API.replyToThread(threadId, content); await v9RefreshTeacherChat(); } catch(err){ v9Toast(err.message || 'Reply failed','error'); } }
async function v9ApproveThread(threadId) { try { if (chatV9API.updateClassroomThread) await chatV9API.updateClassroomThread(threadId, { approvalStatus:'approved' }); else await chatV9API.replyToThread(threadId, '✅ Approved by teacher. Students may now continue this study discussion.'); const t = v9ChatState.threads.find(x => Number(x.id) === Number(threadId)); if (t) t.metadata = { ...(t.metadata||{}), approvalStatus:'approved' }; await v9RefreshTeacherChat(); v9Toast('Study thread approved', 'success'); } catch(err){ v9Toast(err.message || 'Approval failed','error'); } }
function v9RemindThread() { v9Toast('Student reminder queued for notification integration.', 'info'); }
function v9DuplicateThread(id) { const t = v9ChatState.threads.find(x => Number(x.id) === Number(id)); v9OpenCreateThreadModal(); setTimeout(()=>{ if (!t) return; document.getElementById('v9-thread-topic').value = `${t.topic || 'Thread'} Copy`; document.getElementById('v9-thread-subject').value = t.subject || ''; document.getElementById('v9-thread-content').value = t.content || ''; }, 80); }
async function v9CloseThread(threadId) { try { const t = v9ChatState.threads.find(x => Number(x.id) === Number(threadId)); const next = !t?.isClosed; if (chatV9API.updateClassroomThread) await chatV9API.updateClassroomThread(threadId, { isClosed: next }); else await chatV9API.replyToThread(threadId, 'Thread status updated by teacher.'); if (t) t.isClosed = next; await v9RefreshTeacherChat(); } catch(err){ v9Toast(err.message || 'Could not update thread', 'error'); } }
function v9OpenThreadActions(id) { v9DuplicateThread(id); }
async function v9OpenRewardModal(replyId) { await v9EnsureModal(); const modal=document.getElementById('v9-modal'); modal.innerHTML = `<div class="v9-modal-card small"><button class="v9-modal-close" onclick="v9CloseModal()">×</button><h3>Give Star / Streak</h3><p>Rewards apply only to students.</p><div class="tm6-create-grid"><button onclick="v9AwardReply(${Number(replyId)},1,0);v9CloseModal()">⭐ +1</button><button onclick="v9AwardReply(${Number(replyId)},3,0);v9CloseModal()">⭐ +3</button><button onclick="v9AwardReply(${Number(replyId)},5,1);v9CloseModal()">⭐ +5 🔥</button></div></div>`; modal.classList.remove('hidden'); }

async function v9EnsureModal() { if (!document.getElementById('v9-modal')) { const div=document.createElement('div'); div.id='v9-modal'; div.className='v9-modal hidden'; document.body.appendChild(div); } }
function v9CloseModal() { document.getElementById('v9-modal')?.classList.add('hidden'); }

// Student study groups: WhatsApp-style class rooms, peer private chats, teacher-approved topics, and simple achievements.
let v9StudentState = {
  groups: [],
  threads: [],
  selectedGroupId: null,
  selectedThreadId: null,
  selectedPeerId: null,
  directMessages: [],
  classmates: [],
  achievements: { totals: { points: 0, streak: 0 }, events: [] },
  mode: 'study',
  filter: 'all',
  query: '',
  replyToMessage: null,
  editingMessage: null,
  replyToReply: null,
  editingReply: null
};

function v9ThreadIsVisibleToStudent(thread) {
  const approval = v9ThreadApproval(thread);
  const me = v9CurrentUser();
  return approval !== 'pending' || Number(thread.createdBy) === Number(me?.id) || Number(thread.Creator?.id) === Number(me?.id);
}
function v9ThreadGroupId(thread) { return `class-${Number(thread.classId || thread.Class?.id || 0)}`; }
function v9ThreadCreatorLabel(thread) {
  const role = thread.Creator?.role || thread.metadata?.createdByRole || 'student';
  return role === 'teacher' ? 'Pinned by Teacher' : role === 'student' ? 'Student Topic' : 'School Topic';
}
function v9CurrentStudentGroup() {
  return v9StudentState.groups.find(g => String(g.id) === String(v9StudentState.selectedGroupId)) || v9StudentState.groups[0] || null;
}
function v9CurrentStudentThread() {
  return v9StudentState.threads.find(t => Number(t.id) === Number(v9StudentState.selectedThreadId)) || v9StudentThreadsForGroup()[0] || null;
}
function v9StudentThreadsForGroup() {
  const group = v9CurrentStudentGroup();
  if (!group) return [];
  const query = String(v9StudentState.query || '').toLowerCase();
  return v9StudentState.threads
    .filter(v9ThreadIsVisibleToStudent)
    .filter(t => String(v9ThreadGroupId(t)) === String(group.id))
    .filter(t => {
      if (v9StudentState.filter === 'teacher') return (t.Creator?.role || t.metadata?.createdByRole) === 'teacher';
      if (v9StudentState.filter === 'student') return (t.Creator?.role || t.metadata?.createdByRole) === 'student';
      if (v9StudentState.filter === 'pending') return v9ThreadApproval(t) === 'pending';
      return true;
    })
    .filter(t => !query || `${t.topic || ''} ${t.content || ''} ${t.subject || ''}`.toLowerCase().includes(query));
}
function v9StudentCurrentParticipants() {
  const group = v9CurrentStudentGroup();
  const thread = v9CurrentStudentThread();
  return group?.participants || thread?.participants || [];
}
function v9StudentPeers() {
  const me = v9CurrentUser();
  const participantPeers = v9StudentCurrentParticipants().filter(p => Number(p.id) !== Number(me?.id));
  const fallbackPeers = (v9StudentState.classmates || []).filter(p => Number(p.id) !== Number(me?.id));
  const merged = new Map();
  [...participantPeers, ...fallbackPeers].forEach(p => { if (p?.id) merged.set(Number(p.id), p); });
  return [...merged.values()];
}
function v9StudentActivePeer() {
  return v9StudentPeers().find(p => Number(p.id) === Number(v9StudentState.selectedPeerId)) || v9StudentPeers()[0] || null;
}

async function renderStudentV9Classroom() {
  return `
    <div class="v9-wa-page animate-fade-in">
      <div class="v9-wa-topbar">
        <div>
          <p>Student Messages</p>
          <h2>Study Chats</h2>
          <small>Simple WhatsApp-style study groups, private messages, shared files, and teacher topics.</small>
        </div>
        <div class="v9-wa-actions">
          <button onclick="v9LoadStudentThreads()">Refresh</button>
          <button class="primary" onclick="v9OpenStudentTopicModal()">+ New Topic</button>
        </div>
      </div>
      <div id="v9-student-study-root" class="v9-student-study-root"><div class="v9-empty">Loading your study chats...</div></div>
    </div>`;
}

async function v9LoadStudentThreads() {
  const root = document.getElementById('v9-student-study-root') || document.getElementById('v9-thread-root');
  if (!root) return;
  root.innerHTML = '<div class="v9-empty">Loading your study chats...</div>';
  try {
    const [threadsRes, achievementsRes, membersRes] = await Promise.all([
      chatV9API.getClassroomThreads(),
      chatV9API.getMyAchievements(),
      chatV9API.getAvailableMembers().catch(() => ({ data: [] }))
    ]);
    const allThreads = threadsRes.data || [];
    v9StudentState.classmates = (membersRes.data || []).filter(u => u.role === 'student');
    const groupsFromApi = threadsRes.meta?.groups || [];
    let groups = groupsFromApi.length ? groupsFromApi : [];
    if (!groups.length) {
      const classIds = [...new Set(allThreads.map(t => Number(t.classId || t.Class?.id || 0)).filter(Boolean))];
      groups = classIds.map(id => ({ id:`class-${id}`, classId:id, name: allThreads.find(t => Number(t.classId) === id)?.className || 'Class Study Group', participants: [], participantCount: 0 }));
    }
    if (!groups.length) groups = [{ id:'class-0', classId:null, name:'My Study Group', participants: [], participantCount:0 }];

    v9StudentState.groups = groups;
    v9StudentState.threads = allThreads;
    v9StudentState.achievements = achievementsRes.data || { totals:{ points:0, streak:0 }, events:[] };
    if (!v9StudentState.selectedGroupId || !groups.some(g => String(g.id) === String(v9StudentState.selectedGroupId))) v9StudentState.selectedGroupId = groups[0].id;
    const currentThreads = v9StudentThreadsForGroup();
    if (!v9StudentState.selectedThreadId || !currentThreads.some(t => Number(t.id) === Number(v9StudentState.selectedThreadId))) v9StudentState.selectedThreadId = currentThreads[0]?.id || null;
    const peer = v9StudentActivePeer();
    if (!v9StudentState.selectedPeerId && peer) v9StudentState.selectedPeerId = peer.id;
    if (v9StudentState.mode === 'private' && v9StudentState.selectedPeerId) await v9LoadStudentPrivateMessages(v9StudentState.selectedPeerId, false);
    v9RenderStudentStudyRoom();
  } catch (err) {
    console.error('Student study chats failed:', err);
    root.innerHTML = `<div class="v9-empty text-red-500">Could not load study chats: ${v9Safe(err.message)}</div>`;
  }
}

function v9RenderStudentStudyRoom() {
  const root = document.getElementById('v9-student-study-root') || document.getElementById('v9-thread-root');
  if (!root) return;
  const group = v9CurrentStudentGroup();
  const threads = v9StudentThreadsForGroup();
  const selected = v9CurrentStudentThread();
  const participants = v9StudentCurrentParticipants();
  const peer = v9StudentActivePeer();
  const achievementData = v9StudentState.achievements || { totals:{points:0,streak:0}, events:[] };
  root.innerHTML = `
    <div class="v9-wa-shell">
      <aside class="v9-wa-list">
        <div class="v9-wa-search"><input placeholder="Search messages or groups..." value="${v9Safe(v9StudentState.query)}" oninput="v9StudentSearchThreads(this.value)"></div>
        <div class="v9-wa-tabs">
          <button class="${v9StudentState.mode === 'private' ? 'active' : ''}" onclick="v9StudentSetMode('private')">Chats</button>
          <button class="${v9StudentState.mode === 'study' ? 'active' : ''}" onclick="v9StudentSetMode('study')">Study Rooms</button>
        </div>
        <section class="v9-wa-list-section">
          <h4>Private Messages</h4>
          ${v9RenderStudentPrivateList()}
        </section>
        <section class="v9-wa-list-section">
          <h4>Study Groups</h4>
          ${v9StudentState.groups.map(g => v9RenderStudyGroupItem(g)).join('')}
        </section>
      </aside>
      <main class="v9-wa-chat">
        ${v9StudentState.mode === 'private' ? v9RenderStudentPrivateChat(peer) : v9RenderStudentGroupChat(group, selected, threads)}
      </main>
      <aside class="v9-wa-info">
        ${v9StudentState.mode === 'private' ? v9RenderStudentPrivateInfo(peer) : v9RenderStudentGroupInfo(group, participants, threads, achievementData)}
      </aside>
    </div>`;
}

function v9RenderStudyGroupItem(g) {
  const active = v9StudentState.mode === 'study' && String(g.id) === String(v9StudentState.selectedGroupId);
  const count = g.participantCount ?? g.participants?.length ?? 0;
  const latest = v9StudentState.threads.filter(t => String(v9ThreadGroupId(t)) === String(g.id))[0];
  return `<button class="v9-wa-list-item ${active?'active':''}" onclick="v9SelectStudentGroup('${v9Safe(g.id)}')"><span class="v9-wa-icon group">👥</span><span><strong>${v9Safe(g.name || 'Study Group')}</strong><small>${count} members</small><em>${v9Safe(latest?.topic || 'Open your class study group')}</em></span><b>${latest ? v9ThreadReplies(latest).length : ''}</b></button>`;
}
function v9RenderStudentPrivateList() {
  const peers = v9StudentPeers();
  if (!peers.length) return '<div class="v9-wa-empty-small">Your classmates will appear here.</div>';
  return peers.slice(0, 8).map(p => {
    const active = v9StudentState.mode === 'private' && Number(v9StudentState.selectedPeerId) === Number(p.id);
    return `<button class="v9-wa-list-item ${active?'active':''}" onclick="v9StudentSelectPeer(${Number(p.id)})"><span class="v9-wa-avatar">${v9Initials(p.name)}</span><span><strong>${v9Safe(p.name)}</strong><small>Classmate</small><em>Private study chat</em></span></button>`;
  }).join('');
}
function v9RenderStudentGroupChat(group, selected, threads) {
  const replies = selected ? v9ThreadReplies(selected) : [];
  return `<div class="v9-wa-chat-card">
    <header class="v9-wa-chat-head">
      <button onclick="v9StudentSetMode('study')">←</button>
      <span class="v9-wa-icon group">👥</span>
      <div><h3>${v9Safe(group?.name || 'Study Group')}</h3><p>${group?.participantCount || group?.participants?.length || 0} members • student discussion room</p></div>
      <button onclick="v9OpenStudentTopicModal()">＋</button>
    </header>
    <div class="v9-wa-pinned">
      <span>📌</span><button onclick="v9OpenTopicPicker()"><strong>${v9Safe(selected?.topic || 'No topic selected')}</strong><small>${selected ? v9Safe(v9ThreadCreatorLabel(selected)) : 'Create or choose a topic'}</small></button>
    </div>
    <div class="v9-wa-topic-strip">${threads.length ? threads.slice(0,8).map(t => v9RenderTopicChip(t)).join('') : '<button onclick="v9OpenStudentTopicModal()">+ Start first topic</button>'}</div>
    <div class="v9-wa-feed">${selected ? (replies.length ? replies.map(r => v9RenderWhatsAppReply(r)).join('') : '<div class="v9-wa-day">No replies yet. Be the first to help.</div>') : '<div class="v9-wa-day">Select a topic to start chatting.</div>'}</div>
    ${selected && v9ThreadApproval(selected) === 'pending' ? '<div class="v9-wa-pending">This topic is waiting for teacher approval.</div>' : v9RenderStudentReplyComposer(selected?.id)}
  </div>`;
}
function v9RenderTopicChip(t) {
  const active = Number(t.id) === Number(v9StudentState.selectedThreadId);
  const pending = v9ThreadApproval(t) === 'pending';
  return `<button class="${active?'active':''}" onclick="v9SelectStudentThread(${Number(t.id)})">${pending?'⏳':'💬'} ${v9Safe(t.topic || 'Topic')}</button>`;
}
function v9RenderStudentPrivateChat(peer) {
  if (!peer) return '<div class="v9-wa-chat-card"><div class="v9-wa-day">Choose a classmate to start a private study chat.</div></div>';
  const me = v9CurrentUser();
  return `<div class="v9-wa-chat-card">
    <header class="v9-wa-chat-head"><button onclick="v9StudentSetMode('private')">←</button><span class="v9-wa-avatar">${v9Initials(peer.name)}</span><div><h3>${v9Safe(peer.name)}</h3><p>Private study message</p></div><button onclick="v9LoadStudentPrivateMessages(${Number(peer.id)})">↻</button></header>
    <div class="v9-wa-feed">${v9StudentState.directMessages.length ? v9StudentState.directMessages.map(m => v9RenderWhatsAppMessage(m, Number(m.senderId || m.Sender?.id) === Number(me?.id))).join('') : '<div class="v9-wa-day">No messages yet. Say hello 👋</div>'}</div>
    ${(v9StudentState.replyToMessage || v9StudentState.editingMessage) ? `<div class="v9-wa-action-bar"><span>${v9StudentState.editingMessage ? '✏️ Editing' : '↪ Replying to'} ${v9Safe((v9StudentState.editingMessage || v9StudentState.replyToMessage)?.content || '')}</span><button onclick="v9CancelStudentAction()">×</button></div>` : ''}
    <div class="v9-wa-composer"><button type="button">😊</button><input id="v9-private-input-${Number(peer.id)}" placeholder="${v9StudentState.editingMessage ? 'Edit message...' : 'Type a private message...'}" onkeydown="if(event.key==='Enter')v9SendStudentPrivateMessage(${Number(peer.id)})"><button type="button" onclick="v9SendStudentPrivateMessage(${Number(peer.id)})">${v9StudentState.editingMessage ? 'Save' : '➤'}</button></div>
  </div>`;
}
function v9RenderStudentReplyComposer(threadId) {
  if (!threadId) return '';
  return `${(v9StudentState.replyToReply || v9StudentState.editingReply) ? `<div class="v9-wa-action-bar"><span>${v9StudentState.editingReply ? '✏️ Editing' : '↪ Replying to'} ${v9Safe((v9StudentState.editingReply || v9StudentState.replyToReply)?.content || '')}</span><button onclick="v9CancelStudentAction()">×</button></div>` : ''}<div class="v9-wa-composer"><button type="button">😊</button><input id="v9-reply-input-${Number(threadId)}" placeholder="${v9StudentState.editingReply ? 'Edit reply...' : 'Type a message...'}" onkeydown="if(event.key==='Enter')v9ReplyToThread(${Number(threadId)})"><button type="button" onclick="v9ReplyToThread(${Number(threadId)})">${v9StudentState.editingReply ? 'Save' : '➤'}</button></div>`;
}
function v9RenderWhatsAppReply(r) {
  const me = v9CurrentUser();
  const author = r.Author || {};
  const mine = Number(author.id || r.userId) === Number(me?.id);
  const teacher = author.role === 'teacher';
  const deleted = v9IsDeleted(r);
  return `<div class="v9-wa-msg-row ${mine?'mine':''}">${mine?'':`<span class="v9-wa-avatar sm">${v9Initials(author.name || 'U')}</span>`}<div class="v9-wa-bubble ${mine?'mine':''} ${teacher?'teacher':''}">${!mine?`<strong>${v9Safe(author.name || 'Student')}</strong>`:''}${v9MessageReplyPreview(r.metadata || {})}<p>${v9Safe(r.content)}</p>${!deleted ? v9AttachmentLink(r.metadata?.attachmentUrl, r.metadata?.attachmentName||'Attachment') : ''}<footer>${r.pointsAwarded?`⭐ +${r.pointsAwarded}`:''} ${r.streakAwarded?`🔥 +${r.streakAwarded}`:''}<span>${v9Time(r.createdAt)}</span>${v9EditedLabel(r)}</footer>${!deleted ? `<div class="v9-wa-reactions"><button onclick="v9StartReplyToThreadReply(${Number(r.id)})">↩ Reply</button>${mine ? `<button onclick="v9StartEditThreadReply(${Number(r.id)})">✏️ Edit</button><button onclick="v9DeleteThreadReply(${Number(r.id)}, 'me')">🗑️ Me</button><button onclick="v9DeleteThreadReply(${Number(r.id)}, 'everyone')">🚫 Everyone</button>` : `<button onclick="v9DeleteThreadReply(${Number(r.id)}, 'me')">🗑️ Me</button>`}<button onclick="v9HelpfulReply(${Number(r.id)})">👍 ${r.helpfulCount||''}</button></div>` : ''}</div>${mine?`<span class="v9-wa-avatar sm">${v9Initials(me?.name || 'Me')}</span>`:''}</div>`;
}
function v9RenderWhatsAppMessage(m, mine) {
  const sender = m.Sender || {};
  const deleted = v9IsDeleted(m);
  return `<div class="v9-wa-msg-row ${mine?'mine':''}">${mine?'':`<span class="v9-wa-avatar sm">${v9Initials(sender.name || 'U')}</span>`}<div class="v9-wa-bubble ${mine?'mine':''}">${!mine?`<strong>${v9Safe(sender.name || 'Classmate')}</strong>`:''}${v9MessageReplyPreview(m.metadata || {})}<p>${v9Safe(m.content || '')}</p>${!deleted ? v9AttachmentLink(m.attachmentUrl, m.metadata?.attachmentName||'Attachment') : ''}<footer><span>${v9Time(m.createdAt)}</span>${v9EditedLabel(m)}</footer>${!deleted ? `<div class="v9-wa-reactions"><button onclick="v9StartStudentReplyMessage(${Number(m.id)})">↩ Reply</button>${mine ? `<button onclick="v9StartStudentEditMessage(${Number(m.id)})">✏️ Edit</button><button onclick="v9StudentDeleteMessage(${Number(m.id)}, 'me')">🗑️ Me</button><button onclick="v9StudentDeleteMessage(${Number(m.id)}, 'everyone')">🚫 Everyone</button>` : `<button onclick="v9StudentDeleteMessage(${Number(m.id)}, 'me')">🗑️ Me</button>`}</div>` : ''}</div></div>`;
}

function v9RenderStudentGroupInfo(group, participants, threads, data) {
  const totals = data.totals || { points: 0, streak: 0 };
  return `<div class="v9-wa-info-card"><button class="v9-wa-info-close">×</button><div class="v9-wa-big-icon">👥</div><h3>${v9Safe(group?.name || 'Study Group')}</h3><p>${participants.length || 0} members</p><small>A safe place to ask questions and help classmates.</small><div class="v9-wa-info-list"><button onclick="v9ShowMembersPanel()">👥 Group Members <b>${participants.length || 0}</b></button><button onclick="v9OpenTopicPicker()">📌 Topics <b>${threads.length || 0}</b></button><button onclick="v9OpenStudentTopicModal()">✏️ Create Topic</button></div><h4>Online Members</h4><div class="v9-wa-avatar-row">${participants.slice(0,7).map(p=>`<span title="${v9Safe(p.name)}" class="v9-wa-avatar sm">${v9Initials(p.name)}</span>`).join('')}${participants.length>7?`<span class="v9-wa-more">+${participants.length-7}</span>`:''}</div><h4>Achievements</h4><div class="v9-wa-stats"><span>⭐ ${totals.points||0}</span><span>🔥 ${totals.streak||0}</span></div></div>`;
}
function v9RenderStudentPrivateInfo(peer) {
  if (!peer) return '<div class="v9-wa-info-card"><h3>Private Messages</h3><p>Select a classmate.</p></div>';
  return `<div class="v9-wa-info-card"><div class="v9-wa-big-icon">${v9Initials(peer.name)}</div><h3>${v9Safe(peer.name)}</h3><p>Classmate</p><small>Private messages are for respectful study help only.</small><div class="v9-wa-info-list"><button onclick="v9StudentSetMode('study')">👥 Back to Study Groups</button><button onclick="v9OpenStudentTopicModal()">✏️ Turn into group topic</button></div></div>`;
}
function v9RenderParticipants(participants = []) {
  if (!participants.length) return '<div class="v9-wa-empty-small">Members will appear once students are linked to this class.</div>';
  return `<div class="v9-wa-member-grid">${participants.slice(0,80).map(p => `<button onclick="v9StudentSelectPeer(${Number(p.id)})"><span class="v9-wa-avatar sm">${v9Initials(p.name)}</span><strong>${v9Safe(p.name)}</strong></button>`).join('')}</div>`;
}
async function v9StudentSetMode(mode) {
  v9StudentState.mode = mode;
  if (mode === 'private') {
    const peer = v9StudentActivePeer();
    if (peer) await v9LoadStudentPrivateMessages(peer.id, false);
  }
  v9RenderStudentStudyRoom();
}
async function v9StudentSelectPeer(userId) {
  v9StudentState.mode = 'private';
  v9StudentState.selectedPeerId = Number(userId);
  await v9LoadStudentPrivateMessages(userId, false);
  v9RenderStudentStudyRoom();
}
async function v9LoadStudentPrivateMessages(userId, rerender = true) {
  if (!userId) return;
  v9JoinConversation(v9DirectKey(v9CurrentUser()?.id, userId));
  try { const res = await chatV9API.getStudentDirectMessages(userId); v9StudentState.directMessages = res.data || []; }
  catch (err) { console.error('Student private messages failed:', err); v9StudentState.directMessages = []; }
  if (rerender) v9RenderStudentStudyRoom();
}
async function v9SendStudentPrivateMessage(userId) {
  const input=document.getElementById(`v9-private-input-${Number(userId)}`);const content=input?.value?.trim();if(!content)return;const previous=input.value,editing=v9StudentState.editingMessage,replyTo=v9StudentState.replyToMessage;
  try{input.value='';v9StudentState.editingMessage=null;v9StudentState.replyToMessage=null;if(editing){const res=await chatV9API.editMessage(editing.id,content);const i=v9StudentState.directMessages.findIndex(m=>Number(m.id)===Number(editing.id));if(i>=0&&res?.data)v9StudentState.directMessages[i]=res.data;v9RenderStudentStudyRoom();return;}
    const clientMessageId=v9ClientMessageId(),me=v9CurrentUser();const temp={id:`temp-${clientMessageId}`,clientMessageId,senderId:me?.id,receiverId:Number(userId),content,deliveryStatus:'sending',createdAt:new Date().toISOString(),Sender:{id:me?.id,name:me?.name,role:'student'},metadata:{replyTo:replyTo?{id:replyTo.id,senderName:replyTo.Sender?.name||'Classmate',content:replyTo.content}:null}};v9StudentState.directMessages.push(temp);v9RenderStudentStudyRoom();
    const res=await chatV9API.sendStudentDirectMessage(userId,content,null,null,replyTo?.id||null,clientMessageId);const i=v9StudentState.directMessages.findIndex(m=>m.clientMessageId===clientMessageId);if(i>=0&&res?.data)v9StudentState.directMessages[i]=res.data;v9RenderStudentStudyRoom();
  }catch(err){const temp=v9StudentState.directMessages.find(m=>String(m.id).startsWith('temp-')&&m.content===content);if(temp)temp.deliveryStatus='failed';input.value=previous;v9StudentState.editingMessage=editing;v9StudentState.replyToMessage=replyTo;v9RenderStudentStudyRoom();v9Toast(err.message||'Private message failed','error');}
}
function v9StartStudentReplyMessage(messageId) {
  const msg = v9StudentState.directMessages.find(m => Number(m.id) === Number(messageId));
  if (!msg || v9IsDeleted(msg)) return;
  v9StudentState.replyToMessage = msg; v9StudentState.editingMessage = null; v9RenderStudentStudyRoom();
}
function v9StartStudentEditMessage(messageId) {
  const msg = v9StudentState.directMessages.find(m => Number(m.id) === Number(messageId));
  if (!msg || v9IsDeleted(msg)) return;
  v9StudentState.editingMessage = msg; v9StudentState.replyToMessage = null; v9RenderStudentStudyRoom();
  setTimeout(()=>{ const input=document.getElementById(`v9-private-input-${Number(v9StudentState.selectedPeerId)}`); if(input){ input.value=msg.content||''; input.focus(); }},50);
}
async function v9StudentDeleteMessage(messageId, mode = 'me') {
  const label = mode === 'everyone' ? 'delete this message for everyone' : 'delete this message for you';
  if (!confirm(`Are you sure you want to ${label}?`)) return;
  try {
    const res = await chatV9API.deleteMessage(messageId, mode);
    if (mode === 'me') v9StudentState.directMessages = v9StudentState.directMessages.filter(m => Number(m.id) !== Number(messageId));
    else { const i = v9StudentState.directMessages.findIndex(m => Number(m.id) === Number(messageId)); if (i >= 0 && res?.data) v9StudentState.directMessages[i] = res.data; }
    v9RenderStudentStudyRoom();
  } catch (err) { v9Toast(err.message || 'Delete failed', 'error'); }
}
function v9SelectStudentGroup(groupId) { v9StudentState.mode = 'study'; v9StudentState.selectedGroupId = groupId; v9StudentState.selectedThreadId = null; v9RenderStudentStudyRoom(); }
function v9SelectStudentThread(threadId) { v9StudentState.mode = 'study'; v9StudentState.selectedThreadId = threadId; v9JoinConversation(`thread:${Number(threadId)}`); v9RenderStudentStudyRoom(); }
function v9StudentSetFilter(filter) { v9StudentState.filter = filter; v9RenderStudentStudyRoom(); }
function v9StudentSearchThreads(query) { v9StudentState.query = query || ''; v9RenderStudentStudyRoom(); }
function v9OpenTopicPicker() { v9StudentSetMode('study'); }
function v9ShowMembersPanel() { v9Toast('Members are shown on the right panel. Tap a classmate to message privately.', 'info'); }

async function v9OpenStudentTopicModal() {
  await v9EnsureModal();
  const group = v9CurrentStudentGroup();
  const modal=document.getElementById('v9-modal');
  modal.innerHTML = `<div class="v9-modal-card"><button class="v9-modal-close" onclick="v9CloseModal()">×</button><h3>Create Study Topic</h3><p>Your topic will be sent to your teacher for approval, then classmates can discuss it.</p><input id="v9-student-topic-subject" class="tm-input" placeholder="Subject e.g. Mathematics"><input id="v9-student-topic-title" class="tm-input" placeholder="Topic title"><textarea id="v9-student-topic-content" class="tm-input" placeholder="Ask your question or explain what classmates should discuss..."></textarea><button class="tm6-btn primary full" onclick="v9SubmitStudentTopic(${group?.classId ? Number(group.classId) : 'null'})">Create Topic</button></div>`;
  modal.classList.remove('hidden');
}
async function v9SubmitStudentTopic(classId) {
  const subject=document.getElementById('v9-student-topic-subject')?.value?.trim() || 'Study Group';
  const topic=document.getElementById('v9-student-topic-title')?.value?.trim();
  const content=document.getElementById('v9-student-topic-content')?.value?.trim();
  if(!topic || !content) return v9Toast('Topic and question are required','error');
  try { await chatV9API.createClassroomThread({ classId, subject, topic, content, metadata:{ approvalStatus:'pending', source:'student-created-topic' } }); v9CloseModal(); await v9LoadStudentThreads(); v9Toast('Topic sent for teacher approval','success'); }
  catch(err){ v9Toast(err.message || 'Could not create topic','error'); }
}
async function v9HelpfulReply(replyId) { v9Toast('Reaction saved for this reply', 'success'); }
function v9RenderAchievements(data) { const totals=data.totals||{points:0,streak:0}; return `<div class="v9-wa-stats"><span>⭐ ${totals.points||0}</span><span>🔥 ${totals.streak||0}</span></div>`; }

function v9RenderThreads(threads) { if(!threads.length) return `<div class="v9-empty"><h3 class="font-bold text-lg mb-2">No classroom threads yet</h3><p>Your teacher will post structured study questions here.</p></div>`; return threads.map(t=>`<article class="v9-thread-card"><div class="v9-thread-top"><div><span class="v9-subject-pill">${v9Safe(t.subject||'Subject')}</span><h3 class="text-xl font-bold mt-3">${v9Safe(t.topic||'Classroom Topic')}</h3><p class="text-muted-foreground">${v9Safe(t.content||'')}</p>${(t.metadata?.attachments||[]).map(a=>v9AttachmentLink(a.url,a.name)).join('')}</div>${t.isPinned?'<span class="v9-award-pill">📌 Pinned</span>':''}</div><div class="mt-4">${v9ThreadReplies(t).map(r=>v9RenderReply(r)).join('')}</div><div class="v9-reply-form"><input id="v9-reply-input-${Number(t.id)}" placeholder="Write your reply or question..." onkeydown="if(event.key==='Enter')v9ReplyToThread(${Number(t.id)})"><button class="v9-send" onclick="v9ReplyToThread(${Number(t.id)})">➤</button></div></article>`).join(''); }
function v9RenderReply(r) { const author=r.Author||{}; const isTeacher=author.role==='teacher'; const mine=Number(author.id||r.userId)===Number(v9CurrentUser()?.id); const deleted=v9IsDeleted(r); return `<div class="v9-reply ${isTeacher?'teacher':''}"><div class="v9-reply-head"><div class="flex items-center gap-2"><div class="v9-avatar small">${v9Initials(author.name||'U')}</div><div><strong>${v9Safe(author.name||'User')}</strong>${isTeacher?'<span class="ml-2 v9-subject-pill">Teacher</span>':''}</div></div><small>${v9Time(r.createdAt)} ${r.metadata?.edited?'• edited':''}</small></div>${v9MessageReplyPreview(r.metadata||{})}<p>${v9Safe(r.content)}</p>${!deleted?v9AttachmentLink(r.metadata?.attachmentUrl, r.metadata?.attachmentName||'Attachment'):''}${!deleted?`<div class="flex gap-2 flex-wrap mt-2">${r.pointsAwarded?`<span class="v9-award-pill">⭐ +${r.pointsAwarded}</span>`:''}${r.streakAwarded?`<span class="v9-award-pill">🔥 +${r.streakAwarded}</span>`:''}<button class="v9-award-pill" onclick="v9StartReplyToThreadReply(${Number(r.id)})">↩ Reply</button>${mine?`<button class="v9-award-pill" onclick="v9StartEditThreadReply(${Number(r.id)})">✏️ Edit</button><button class="v9-award-pill" onclick="v9DeleteThreadReply(${Number(r.id)}, 'me')">🗑️ Me</button><button class="v9-award-pill" onclick="v9DeleteThreadReply(${Number(r.id)}, 'everyone')">🚫 Everyone</button>`:`<button class="v9-award-pill" onclick="v9DeleteThreadReply(${Number(r.id)}, 'me')">🗑️ Me</button>`}<button class="v9-award-pill" onclick="v9HelpfulReply(${Number(r.id)})">👍 ${r.helpfulCount||0}</button></div>`:''}</div>`; }
async function v9ReplyToThread(threadId) { const input=document.getElementById(`v9-reply-input-${Number(threadId)}`); const content=input?.value?.trim(); if(!content)return; const previous=input.value; const editing=v9StudentState.editingReply; const replyTo=v9StudentState.replyToReply; try{ let res=null; if(editing){ res=await chatV9API.editThreadReply(editing.id, content); const thread=(v9StudentState.threads||v9ChatState.threads||[]).find(t=>Number(t.id)===Number(threadId)); const replies=v9ThreadReplies(thread); const i=replies.findIndex(r=>Number(r.id)===Number(editing.id)); if(i>=0 && res?.data) replies[i]=res.data; } else { const clientMessageId=v9ClientMessageId(); res=await chatV9API.replyToThread(threadId, content, replyTo?.id || null, clientMessageId); if(res?.data) v9AppendReplyToThread(threadId, res.data); } input.value=''; v9StudentState.editingReply=null; v9StudentState.replyToReply=null; const studentRoot=document.getElementById('v9-student-study-root'); if(studentRoot) v9RenderStudentStudyRoom(); else v9RenderTeacherShell(); }catch(err){ input.value=previous; v9StudentState.editingReply=editing; v9StudentState.replyToReply=replyTo; v9Toast(err.message||'Reply failed','error'); } }
function v9StartReplyToThreadReply(replyId){ const studentRoot=document.getElementById('v9-student-study-root'); const thread=(studentRoot ? v9CurrentStudentThread() : null) || v9ChatState.selectedThread; const reply=v9ThreadReplies(thread).find(r=>Number(r.id)===Number(replyId)); if(!reply || v9IsDeleted(reply)) return; v9StudentState.replyToReply=reply; v9StudentState.editingReply=null; if(studentRoot) v9RenderStudentStudyRoom(); else v9RenderTeacherShell(); }
function v9StartEditThreadReply(replyId){ const studentRoot=document.getElementById('v9-student-study-root'); const thread=(studentRoot ? v9CurrentStudentThread() : null) || v9ChatState.selectedThread; const reply=v9ThreadReplies(thread).find(r=>Number(r.id)===Number(replyId)); if(!reply || v9IsDeleted(reply)) return; v9StudentState.editingReply=reply; v9StudentState.replyToReply=null; if(studentRoot) v9RenderStudentStudyRoom(); else v9RenderTeacherShell(); setTimeout(()=>{ const input=document.getElementById(`v9-reply-input-${Number(thread?.id)}`); if(input){ input.value=reply.content||''; input.focus(); }},50); }
async function v9DeleteThreadReply(replyId, mode='me'){ const thread=v9CurrentStudentThread() || v9ChatState.selectedThread; if(!thread) return; const label=mode==='everyone'?'delete this reply for everyone':'delete this reply for you'; if(!confirm(`Are you sure you want to ${label}?`)) return; try{ const res=await chatV9API.deleteThreadReply(replyId, mode); const replies=v9ThreadReplies(thread); if(mode==='me') { const next=replies.filter(r=>Number(r.id)!==Number(replyId)); thread.ThreadReplies=next; thread.replies=next; } else { const i=replies.findIndex(r=>Number(r.id)===Number(replyId)); if(i>=0 && res?.data) replies[i]=res.data; } if(document.getElementById('v9-student-study-root')) v9RenderStudentStudyRoom(); else v9RenderTeacherShell(); }catch(err){ v9Toast(err.message||'Delete failed','error'); } }
async function v9HelpfulReply(replyId) { v9Toast('Reaction saved for this reply', 'success'); }
function v9RenderAchievements(data) { const totals=data.totals||{points:0,streak:0}; const events=data.events||[]; return `<div class="v9-achievements-card"><h3 class="font-bold text-xl">Achievements</h3><p class="text-muted-foreground text-sm">Stars and streaks awarded by teachers.</p><div class="v9-achievement-stat"><div><span class="text-muted-foreground text-sm">Points</span><strong>⭐ ${totals.points||0}</strong></div><div><span class="text-muted-foreground text-sm">Streak</span><strong>🔥 ${totals.streak||0}</strong></div></div><div class="space-y-3">${events.length?events.slice(0,5).map(e=>`<div class="v9-info-card"><div class="flex justify-between gap-2"><strong>${v9Safe(e.title||'Achievement')}</strong><span class="v9-award-pill">+${e.points||0} pts</span></div><small>${v9Safe(e.note||'Teacher awarded achievement')}</small></div>`).join(''):'<div class="v9-empty small">No achievements yet. Participate in threads to earn stars.</div>'}</div></div>`; }



function v9ApplyRealtimeEvent(evt){
  const type=String(evt?.type||''), raw=evt?.data||{}; if(!type.startsWith('chat:'))return false;
  const data={...raw};
  if(data.senderId&&!data.Sender){
    data.Sender={
      id:data.senderId,
      name:data.senderName||data.fromName||data.metadata?.teacherName||data.metadata?.parentName||data.metadata?.adminName||'User',
      role:data.senderRole||data.fromRole||data.metadata?.senderRole||data.metadata?.createdByRole||'user'
    };
  }
  const conversation=String(data.conversationId||data.conversationKey||''); const active=window.ShuleRealtime?.activeConversation||'';
  const messageId=data.messageId||data.id;
  const updateStatus=(arr)=>{
    const item=(arr||[]).find(x=>String(x.id)===String(messageId)); if(!item)return false;
    if(type==='chat:message_delivered'){item.deliveryStatus=item.deliveryStatus==='read'?'read':'delivered';item.deliveredAt=data.deliveredAt||item.deliveredAt;}
    if(type==='chat:message_read'){item.deliveryStatus='read';item.isRead=true;item.readAt=data.readAt||item.readAt;item.metadata={...(item.metadata||{}),readBy:data.readBy||item.metadata?.readBy||[]};}
    return true;
  };
  if(type==='chat:message_delivered'||type==='chat:message_read'){
    const changed=updateStatus(v9ChatState.messages)|updateStatus(v9StudentState.directMessages);
    if(changed){document.getElementById('v9-student-study-root')?v9RenderStudentStudyRoom():v9RenderMessageListOnly();return true;}
  }
  const upsert=(arr,item)=>{if(!item)return false;let i=arr.findIndex(x=>(item.clientMessageId&&x.clientMessageId===item.clientMessageId)||String(x.id)===String(item.id));if(type==='chat:message_deleted'&&data.mode==='me'&&i>=0){arr.splice(i,1);return true;}if(i>=0)arr[i]={...arr[i],...item};else if(type==='chat:message_created')arr.push(item);return true;};
  if(conversation&&active&&conversation===active){
    if(conversation.startsWith('thread:')){const threadId=Number(data.threadId||conversation.split(':')[1]);const thread=(v9StudentState.threads||v9ChatState.threads||[]).find(t=>Number(t.id)===threadId);if(thread){if(!Array.isArray(thread.ThreadReplies))thread.ThreadReplies=thread.replies||[];upsert(thread.ThreadReplies,data);document.getElementById('v9-student-study-root')?v9RenderStudentStudyRoom():v9RenderTeacherShell();return true;}}
    const me=v9CurrentUser();if(me?.role==='student'){upsert(v9StudentState.directMessages,data);v9RenderStudentStudyRoom();}else{upsert(v9ChatState.messages,data);v9RenderMessageListOnly();}
    if(type==='chat:message_created'&&Number(data.senderId)!==Number(me?.id)&&data.id){window.socket?.emit('chat:message_delivered',{messageId:data.id});window.socket?.emit('chat:message_read',{messageId:data.id});}return true;
  }
  // Parent conversations use a server-generated ownership key and arrive through the personal room.
  if(v9ChatState.mode==='parent'&&v9ChatState.selectedParent&&data.metadata?.conversationKey===v9ChatState.selectedParent.conversationKey){upsert(v9ChatState.messages,data);v9RenderMessageListOnly();if(type==='chat:message_created'&&Number(data.senderId)!==Number(v9CurrentUser()?.id)&&data.id)window.socket?.emit('chat:message_read',{messageId:data.id});return true;}
  if(type==='chat:message_created'){
    const me=v9CurrentUser(); const sender=Number(data.senderId), receiver=Number(data.receiverId);
    if(conversation.startsWith('group:')){const id=Number(conversation.split(':')[1]);const row=v9ChatState.groups.find(g=>Number(g.id)===id);if(row){row.lastMessage=data.content;row.unreadCount=Number(row.unreadCount||0)+(sender===Number(me?.id)?0:1);}}
    else if(data.metadata?.conversationKey){const row=v9ChatState.parents.find(p=>String(p.conversationKey||'')===String(data.metadata.conversationKey));if(row){row.lastMessage=data.content;row.unreadCount=Number(row.unreadCount||0)+(sender===Number(me?.id)?0:1);}}
    else {const other=sender===Number(me?.id)?receiver:sender;const row=v9ChatState.teachers.find(t=>Number(t.id)===other);if(row){row.lastMessage=data.content;row.unreadCount=Number(row.unreadCount||0)+(sender===Number(me?.id)?0:1);}}
    v9RenderConversationListOnly();
  }
  return false;
}
window.ShuleChatV9Realtime={applyEvent:v9ApplyRealtimeEvent,getTeacherState:()=>v9ChatState,getStudentState:()=>v9StudentState};

window.v9RenderStudentStudyRoom = v9RenderStudentStudyRoom;
window.v9SelectStudentGroup = v9SelectStudentGroup;
window.v9SelectStudentThread = v9SelectStudentThread;
window.v9StudentSetFilter = v9StudentSetFilter;
window.v9StudentSearchThreads = v9StudentSearchThreads;
window.v9OpenStudentTopicModal = v9OpenStudentTopicModal;
window.v9SubmitStudentTopic = v9SubmitStudentTopic;
window.renderTeacherV9Messages = renderTeacherV9Messages;
window.v9RefreshTeacherChat = v9RefreshTeacherChat;
window.v9SetMainTab = v9SetMainTab;
window.v9SetChatMode = v9SetChatMode;
window.v9SelectTeacher = v9SelectTeacher;
window.v9SelectParent = v9SelectParent;
window.v9SelectGroup = v9SelectGroup;
window.v9SelectThread = v9SelectThread;
window.v9SetThreadFilter = v9SetThreadFilter;
window.v9SetStudyDetailTab = v9SetStudyDetailTab;
window.v9FilterConversations = v9FilterConversations;
window.v9FilterThreads = v9FilterThreads;
window.v9FilterMemberPicker = v9FilterMemberPicker;
window.v9PickAttachment = v9PickAttachment;
window.v9ClearAttachment = v9ClearAttachment;
window.v9UploadAttachment = v9UploadAttachment;
window.v9SendMessage = v9SendMessage;
window.v9AwardMessage = v9AwardMessage;
window.v9ReactToMessage = v9ReactToMessage;
window.v9AwardReply = v9AwardReply;
window.v9HelpfulReply = v9HelpfulReply;
window.v9OpenCreateMenu = v9OpenCreateMenu;
window.v9OpenCreateGroupModal = v9OpenCreateGroupModal;
window.v9SubmitCreateGroup = v9SubmitCreateGroup;
window.v9OpenManageMembersModal = v9OpenManageMembersModal;
window.v9SaveGroupMembers = v9SaveGroupMembers;
window.v9OpenCreateThreadModal = v9OpenCreateThreadModal;
window.v9UploadThreadAttachment = v9UploadThreadAttachment;
window.v9SubmitCreateThread = v9SubmitCreateThread;
window.v9OpenThreadReply = v9OpenThreadReply;
window.v9ApproveThread = v9ApproveThread;
window.v9RemindThread = v9RemindThread;
window.v9DuplicateThread = v9DuplicateThread;
window.v9CloseThread = v9CloseThread;
window.v9OpenThreadActions = v9OpenThreadActions;
window.v9OpenRewardModal = v9OpenRewardModal;
window.v9CloseModal = v9CloseModal;
window.renderStudentV9Classroom = renderStudentV9Classroom;
window.v9LoadStudentThreads = v9LoadStudentThreads;
window.v9ReplyToThread = v9ReplyToThread;
window.v9StudentSetMode = v9StudentSetMode;
window.v9StudentSelectPeer = v9StudentSelectPeer;
window.v9LoadStudentPrivateMessages = v9LoadStudentPrivateMessages;
window.v9SendStudentPrivateMessage = v9SendStudentPrivateMessage;
window.v9OpenTopicPicker = v9OpenTopicPicker;
window.v9ShowMembersPanel = v9ShowMembersPanel;

window.v9CancelChatAction = v9CancelChatAction;
window.v9CancelStudentAction = v9CancelStudentAction;
window.v9StartReplyMessage = v9StartReplyMessage;
window.v9StartEditMessage = v9StartEditMessage;
window.v9DeleteMessage = v9DeleteMessage;
window.v9StartStudentReplyMessage = v9StartStudentReplyMessage;
window.v9StartStudentEditMessage = v9StartStudentEditMessage;
window.v9StudentDeleteMessage = v9StudentDeleteMessage;
window.v9StartReplyToThreadReply = v9StartReplyToThreadReply;
window.v9StartEditThreadReply = v9StartEditThreadReply;
window.v9DeleteThreadReply = v9DeleteThreadReply;
