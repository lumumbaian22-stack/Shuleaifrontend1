/* Shule AI v62 - Simplified Teacher Messages & Study Rooms
   Clean Option 6 layout, real group/member/chat/thread functions, dark/light adaptive. */

let v9ChatState = {
  activeTab: 'study',
  mode: 'group',
  teachers: [],
  groups: [],
  threads: [],
  selectedTeacher: null,
  selectedGroup: null,
  selectedThread: null,
  messages: [],
  members: [],
  availableMembers: [],
  attachment: null,
  threadAttachment: null,
  studyDetailTab: 'thread',
  listFilter: 'active'
};

function v9Safe(value) {
  const text = String(value ?? '');
  if (typeof escapeHtml === 'function') return escapeHtml(text);
  return text.replace(/[&<>'"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[c]));
}
function v9CurrentUser() { try { return typeof getCurrentUser === 'function' ? getCurrentUser() : null; } catch { return null; } }
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

function v9IsStaffUser() {
  const role = v9CurrentUser()?.role;
  return ['teacher','admin','super_admin'].includes(role);
}
function v9RenderMessageListOnly() {
  const list = document.getElementById('v9-message-list');
  if (!list) return;
  list.innerHTML = v9RenderMessages(v9CurrentUser());
  list.scrollTop = list.scrollHeight;
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
    const [teachersRes, groupsRes, threadsRes] = await Promise.all([
      chatV9API.getTeachers(),
      chatV9API.getTeacherGroups(),
      chatV9API.getClassroomThreads()
    ]);
    const me = v9CurrentUser();
    v9ChatState.teachers = (teachersRes.data || []).filter(t => Number(t.id) !== Number(me?.id));
    v9ChatState.groups = groupsRes.data || [];
    v9ChatState.threads = threadsRes.data || [];
    if (!v9ChatState.selectedTeacher && v9ChatState.teachers[0]) v9ChatState.selectedTeacher = v9ChatState.teachers[0];
    if (!v9ChatState.selectedGroup && v9ChatState.groups[0]) v9ChatState.selectedGroup = v9ChatState.groups[0];
    if (!v9ChatState.selectedThread && v9ChatState.threads[0]) v9ChatState.selectedThread = v9ChatState.threads[0];
    await v9LoadCurrentMessages();
  } catch (err) {
    console.error('Teacher messages load failed:', err);
    if (root) root.innerHTML = `<div class="tm6-empty error">${v9Safe(err.message || 'Could not load messages')}</div>`;
  }
}

function v9SetMainTab(tab) {
  v9ChatState.activeTab = tab;
  if (tab === 'chats') v9ChatState.mode = 'direct';
  if (tab === 'groups') v9ChatState.mode = 'group';
  v9LoadCurrentMessages();
}
function v9SetChatMode(mode) { v9ChatState.mode = mode; v9LoadCurrentMessages(); }

async function v9LoadCurrentMessages() {
  try {
    if (v9ChatState.activeTab === 'study') return v9RenderTeacherShell();
    if (v9ChatState.activeTab === 'announcements') return v9RenderTeacherShell();
    let res = { data: [] };
    if (v9ChatState.mode === 'direct' && v9ChatState.selectedTeacher) {
      res = await chatV9API.getDirectMessages(v9ChatState.selectedTeacher.id);
    } else if (v9ChatState.mode === 'group' && v9ChatState.selectedGroup) {
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

  const list = v9ChatState.activeTab === 'chats' ? v9RenderDirectList() : v9RenderGroupList();
  const selected = v9ChatState.activeTab === 'chats' ? v9ChatState.selectedTeacher : v9ChatState.selectedGroup;
  root.innerHTML = `
    <div class="tm6-chat-layout">
      <aside class="tm6-list-panel">
        <div class="tm6-panel-title">
          <div><h3>${v9ChatState.activeTab === 'chats' ? 'Direct Chats' : 'Groups'}</h3><p>${v9ChatState.activeTab === 'chats' ? 'Teacher-to-teacher messages' : 'Teacher and student groups'}</p></div>
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
  if (!v9ChatState.teachers.length) return '<div class="tm6-empty small">No teachers found.</div>';
  return v9ChatState.teachers.map(t => `
    <button class="tm6-list-item ${Number(v9ChatState.selectedTeacher?.id) === Number(t.id) ? 'active' : ''}" onclick="v9SelectTeacher(${Number(t.id)})">
      <span class="tm6-avatar">${v9Initials(t.name)}</span>
      <span><strong>${v9Safe(t.name)}</strong><small>${v9Safe(t.email || 'Teacher')}</small></span>
    </button>`).join('');
}
function v9RenderGroupList() {
  if (!v9ChatState.groups.length) return '<div class="tm6-empty small">No groups yet. Create one and add members.</div>';
  return v9ChatState.groups.map(g => `
    <button class="tm6-list-item ${Number(v9ChatState.selectedGroup?.id) === Number(g.id) ? 'active' : ''}" onclick="v9SelectGroup(${Number(g.id)})">
      <span class="tm6-avatar ${g.type || ''}">${g.type === 'department' ? '🏫' : g.type === 'staff' ? '👥' : '💬'}</span>
      <span><strong>${v9Safe(g.name)}</strong><small>${v9Safe(g.type || 'group')}${g.headName ? ' • '+v9Safe(g.headName) : ''}</small></span>
    </button>`).join('');
}
function v9RenderChatWindow(selected) {
  const isGroup = v9ChatState.activeTab === 'groups';
  return `
    <header class="tm6-chat-head">
      <div class="tm6-title-row"><span class="tm6-avatar big">${isGroup ? '👥' : v9Initials(selected.name)}</span><div><h3>${v9Safe(selected.name || 'Conversation')}</h3><p>${isGroup ? `${v9ChatState.members.length} members • managed group` : 'Emoji reactions only between teachers'}</p></div></div>
      <div class="tm6-chat-actions">
        ${isGroup && v9IsStaffUser() ? `<button class="tm6-btn light" onclick="v9OpenManageMembersModal(${Number(selected.id)})">Manage Members</button>` : ''}
        <button class="tm6-btn light" onclick="v9PickAttachment()">Attach</button>
        <input id="v9-file-input" type="file" class="hidden" onchange="v9UploadAttachment(this.files[0])">
      </div>
    </header>
    <main class="tm6-messages" id="v9-message-list">${v9RenderMessages(v9CurrentUser())}</main>
    <footer class="tm6-composer">
      <div id="v9-selected-attachment" class="tm6-selected-file">${v9ChatState.attachment ? `${v9AttachmentLink(v9ChatState.attachment.url, v9AttachmentLabel(v9ChatState.attachment))}<button onclick="v9ClearAttachment()">×</button>` : ''}</div>
      <div class="tm6-compose-row"><input id="v9-message-input" placeholder="Type a message..." onkeydown="if(event.key==='Enter')v9SendMessage()"><button onclick="v9SendMessage()">➤</button></div>
    </footer>`;
}

function v9RenderMessages(currentUser) {
  if (!v9ChatState.messages.length) return '<div class="tm6-empty">No messages yet. Start the conversation.</div>';
  return v9ChatState.messages.map(m => {
    const mine = Number(m.senderId) === Number(currentUser?.id);
    const sender = m.Sender || {};
    const reactions = m.metadata?.reactions || {};
    return `<article class="tm6-msg ${mine ? 'mine' : ''}">
      <span class="tm6-avatar small">${v9Initials(sender.name || 'U')}</span>
      <div class="tm6-bubble">
        ${!mine ? `<strong>${v9Safe(sender.name || 'User')}</strong>` : ''}
        <p>${v9Safe(m.content || '')}</p>
        ${v9AttachmentLink(m.attachmentUrl, m.metadata?.attachmentName || 'Attachment')}
        <div class="tm6-meta"><span>${v9Time(m.createdAt)}</span>${m.pointsAwarded ? `<span>⭐ ${m.pointsAwarded}</span>` : ''}${m.streakAwarded ? `<span>🔥 ${m.streakAwarded}</span>` : ''}</div>
        <div class="tm6-reactions">${Object.entries(reactions).map(([emoji, users]) => `<button onclick="v9ReactToMessage(${Number(m.id)}, '${v9Safe(emoji)}')">${v9Safe(emoji)} ${(users || []).length}</button>`).join('')}</div>
        ${!mine ? v9RenderMessageActions(m, sender) : ''}
      </div>
    </article>`;
  }).join('');
}
function v9RenderMessageActions(m, sender) {
  if (sender.role === 'student') {
    return `<div class="tm6-mini-actions"><button onclick="v9AwardMessage(${Number(m.id)},1,0)">⭐ +1</button><button onclick="v9AwardMessage(${Number(m.id)},5,1)">⭐ +5 🔥</button></div>`;
  }
  return `<div class="tm6-mini-actions"><button onclick="v9ReactToMessage(${Number(m.id)}, '👍')">👍</button><button onclick="v9ReactToMessage(${Number(m.id)}, '👏')">👏</button><button onclick="v9ReactToMessage(${Number(m.id)}, '✅')">✅</button><button onclick="v9ReactToMessage(${Number(m.id)}, '🔥')">🔥</button></div>`;
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
  if (v9ChatState.studyDetailTab === 'responses') return v9RenderResponses(t, replies);
  if (v9ChatState.studyDetailTab === 'analytics') return v9RenderThreadAnalytics(t, replies);
  return `<section class="tm6-question"><label>Question / Topic</label><p>${v9Safe(t.content || '')}</p>${attachments.length ? `<div class="tm6-file-row">${attachments.map(a => v9AttachmentLink(a.url, a.name || 'Attachment')).join('')}</div>` : ''}</section>
    <div class="tm6-action-grid">
      ${pending ? `<button onclick="v9ApproveThread(${Number(t.id)})">✅ Approve</button>` : `<button onclick="v9OpenThreadReply(${Number(t.id)})">💬 Feedback</button>`}
      <button onclick="v9OpenCreateThreadModal()">➕ New</button>
      <button onclick="v9RemindThread(${Number(t.id)})">🔔 Remind</button>
      <button onclick="v9CloseThread(${Number(t.id)})">${t.isClosed ? '🔓 Reopen' : '🔒 Close'}</button>
    </div>`;
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
  return `<article class="tm6-response">
    <div class="tm6-response-head"><span class="tm6-avatar small">${v9Initials(author.name || 'U')}</span><div><strong>${v9Safe(author.name || 'User')}</strong><small>${v9Time(r.createdAt)}</small></div><button class="tm6-icon" onclick="${isStudent ? `v9OpenRewardModal(${Number(r.id)})` : `v9HelpfulReply(${Number(r.id)})`}">${isStudent ? '⭐' : '👍'}</button></div>
    <p>${v9Safe(r.content || '')}</p>
    ${v9AttachmentLink(r.metadata?.attachmentUrl, r.metadata?.attachmentName || 'Attachment')}
    <div class="tm6-mini-actions">${r.pointsAwarded ? `<span>⭐ ${r.pointsAwarded}</span>` : ''}${r.streakAwarded ? `<span>🔥 ${r.streakAwarded}</span>` : ''}${isStudent ? `<button onclick="v9AwardReply(${Number(r.id)},1,0)">⭐ +1</button><button onclick="v9AwardReply(${Number(r.id)},5,1)">⭐ +5 🔥</button>` : `<button onclick="v9HelpfulReply(${Number(r.id)})">👍 Helpful</button>`}</div>
  </article>`;
}
function v9RenderAnnouncements(root) {
  root.innerHTML = `<div class="tm6-announcements"><h3>Announcements</h3><p>Use this area for class or group broadcasts. The announcement composer will reuse the same attachment and group delivery logic.</p><button class="tm6-btn primary" onclick="v9OpenCreateGroupModal()">Create announcement group</button></div>`;
}

function v9SelectTeacher(id) { v9ChatState.selectedTeacher = v9ChatState.teachers.find(t => Number(t.id) === Number(id)); v9ChatState.mode = 'direct'; v9LoadCurrentMessages(); }
function v9SelectGroup(id) { v9ChatState.selectedGroup = v9ChatState.groups.find(g => Number(g.id) === Number(id)); v9ChatState.mode = 'group'; v9LoadCurrentMessages(); }
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
  const input = document.getElementById('v9-message-input');
  const content = input?.value?.trim() || (v9ChatState.attachment ? 'Shared an attachment' : '');
  if (!content) return;
  const attachment = v9ChatState.attachment;
  const attachmentUrl = attachment?.url || null;
  const previousValue = input?.value || '';
  try {
    if (input) input.value = '';
    v9ChatState.attachment = null;
    const attachmentBox = document.getElementById('v9-selected-attachment');
    if (attachmentBox) attachmentBox.innerHTML = '';
    let res = null;
    if (v9ChatState.mode === 'direct' && v9ChatState.selectedTeacher) res = await chatV9API.sendDirectMessage(v9ChatState.selectedTeacher.id, content, attachmentUrl, attachment);
    if (v9ChatState.mode === 'group' && v9ChatState.selectedGroup) res = await chatV9API.sendGroupMessage(v9ChatState.selectedGroup.id, content, attachmentUrl, attachment);
    if (res?.data) v9AppendMessageToState(res.data);
    else await v9LoadCurrentMessages();
  } catch (err) {
    if (input) input.value = previousValue;
    v9ChatState.attachment = attachment;
    v9Toast(err.message || 'Message failed', 'error');
  }
}
async function v9AwardMessage(messageId, points, streakDelta) { try { await chatV9API.awardChatMessage(messageId, points, streakDelta, 'Great student contribution'); await v9LoadCurrentMessages(); } catch (err) { v9Toast(err.message || 'Only students can receive stars/streaks', 'error'); } }
async function v9ReactToMessage(messageId, emoji) { try { await chatV9API.reactToMessage(messageId, emoji); await v9LoadCurrentMessages(); } catch (err) { v9Toast(err.message || 'Reaction failed', 'error'); } }
async function v9AwardReply(replyId, points, streakDelta) { try { await chatV9API.awardThreadReply(replyId, points, streakDelta, 'Good study room response'); await v9RefreshTeacherChat(); } catch (err) { v9Toast(err.message || 'Award failed', 'error'); } }
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
  achievements: { totals: { points: 0, streak: 0 }, events: [] },
  mode: 'study',
  filter: 'all',
  query: ''
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
  return v9StudentCurrentParticipants().filter(p => Number(p.id) !== Number(me?.id));
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
    const [threadsRes, achievementsRes] = await Promise.all([chatV9API.getClassroomThreads(), chatV9API.getMyAchievements()]);
    const allThreads = threadsRes.data || [];
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
    <div class="v9-wa-composer"><button type="button">😊</button><input id="v9-private-input-${Number(peer.id)}" placeholder="Type a private message..." onkeydown="if(event.key==='Enter')v9SendStudentPrivateMessage(${Number(peer.id)})"><button type="button" onclick="v9SendStudentPrivateMessage(${Number(peer.id)})">➤</button></div>
  </div>`;
}
function v9RenderStudentReplyComposer(threadId) {
  if (!threadId) return '';
  return `<div class="v9-wa-composer"><button type="button">😊</button><input id="v9-reply-input-${Number(threadId)}" placeholder="Type a message..." onkeydown="if(event.key==='Enter')v9ReplyToThread(${Number(threadId)})"><button type="button" onclick="v9ReplyToThread(${Number(threadId)})">➤</button></div>`;
}
function v9RenderWhatsAppReply(r) {
  const me = v9CurrentUser();
  const author = r.Author || {};
  const mine = Number(author.id || r.userId) === Number(me?.id);
  const teacher = author.role === 'teacher';
  return `<div class="v9-wa-msg-row ${mine?'mine':''}">${mine?'':`<span class="v9-wa-avatar sm">${v9Initials(author.name || 'U')}</span>`}<div class="v9-wa-bubble ${mine?'mine':''} ${teacher?'teacher':''}">${!mine?`<strong>${v9Safe(author.name || 'Student')}</strong>`:''}<p>${v9Safe(r.content)}</p>${v9AttachmentLink(r.metadata?.attachmentUrl, r.metadata?.attachmentName||'Attachment')}<footer>${r.pointsAwarded?`⭐ +${r.pointsAwarded}`:''} ${r.streakAwarded?`🔥 +${r.streakAwarded}`:''}<span>${v9Time(r.createdAt)}</span></footer><div class="v9-wa-reactions"><button onclick="v9HelpfulReply(${Number(r.id)})">👍 ${r.helpfulCount||''}</button><button onclick="v9HelpfulReply(${Number(r.id)})">❤️</button></div></div>${mine?`<span class="v9-wa-avatar sm">${v9Initials(me?.name || 'Me')}</span>`:''}</div>`;
}
function v9RenderWhatsAppMessage(m, mine) {
  const sender = m.Sender || {};
  return `<div class="v9-wa-msg-row ${mine?'mine':''}">${mine?'':`<span class="v9-wa-avatar sm">${v9Initials(sender.name || 'U')}</span>`}<div class="v9-wa-bubble ${mine?'mine':''}">${!mine?`<strong>${v9Safe(sender.name || 'Classmate')}</strong>`:''}<p>${v9Safe(m.content || '')}</p>${v9AttachmentLink(m.attachmentUrl, m.metadata?.attachmentName||'Attachment')}<footer><span>${v9Time(m.createdAt)}</span></footer></div></div>`;
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
  try { const res = await chatV9API.getDirectMessages(userId); v9StudentState.directMessages = res.data || []; }
  catch (err) { console.error('Student private messages failed:', err); v9StudentState.directMessages = []; }
  if (rerender) v9RenderStudentStudyRoom();
}
async function v9SendStudentPrivateMessage(userId) {
  const input = document.getElementById(`v9-private-input-${Number(userId)}`);
  const content = input?.value?.trim();
  if (!content) return;
  const previous = input.value;
  try {
    const res = await chatV9API.sendDirectMessage(userId, content);
    input.value = '';
    if (res?.data) {
      if (!Array.isArray(v9StudentState.directMessages)) v9StudentState.directMessages = [];
      v9StudentState.directMessages.push(res.data);
      v9RenderStudentStudyRoom();
    } else {
      await v9LoadStudentPrivateMessages(userId);
    }
  }
  catch (err) { input.value = previous; v9Toast(err.message || 'Private message failed', 'error'); }
}
function v9SelectStudentGroup(groupId) { v9StudentState.mode = 'study'; v9StudentState.selectedGroupId = groupId; v9StudentState.selectedThreadId = null; v9RenderStudentStudyRoom(); }
function v9SelectStudentThread(threadId) { v9StudentState.mode = 'study'; v9StudentState.selectedThreadId = threadId; v9RenderStudentStudyRoom(); }
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
async function v9ReplyToThread(threadId) { const input=document.getElementById(`v9-reply-input-${Number(threadId)}`); const content=input?.value?.trim(); if(!content)return; try{ await chatV9API.replyToThread(threadId, content); input.value=''; await v9LoadStudentThreads(); }catch(err){ v9Toast(err.message||'Reply failed','error'); } }
async function v9HelpfulReply(replyId) { v9Toast('Reaction saved for this reply', 'success'); }
function v9RenderAchievements(data) { const totals=data.totals||{points:0,streak:0}; return `<div class="v9-wa-stats"><span>⭐ ${totals.points||0}</span><span>🔥 ${totals.streak||0}</span></div>`; }

function v9RenderThreads(threads) { if(!threads.length) return `<div class="v9-empty"><h3 class="font-bold text-lg mb-2">No classroom threads yet</h3><p>Your teacher will post structured study questions here.</p></div>`; return threads.map(t=>`<article class="v9-thread-card"><div class="v9-thread-top"><div><span class="v9-subject-pill">${v9Safe(t.subject||'Subject')}</span><h3 class="text-xl font-bold mt-3">${v9Safe(t.topic||'Classroom Topic')}</h3><p class="text-muted-foreground">${v9Safe(t.content||'')}</p>${(t.metadata?.attachments||[]).map(a=>v9AttachmentLink(a.url,a.name)).join('')}</div>${t.isPinned?'<span class="v9-award-pill">📌 Pinned</span>':''}</div><div class="mt-4">${v9ThreadReplies(t).map(r=>v9RenderReply(r)).join('')}</div><div class="v9-reply-form"><input id="v9-reply-input-${Number(t.id)}" placeholder="Write your reply or question..." onkeydown="if(event.key==='Enter')v9ReplyToThread(${Number(t.id)})"><button class="v9-send" onclick="v9ReplyToThread(${Number(t.id)})">➤</button></div></article>`).join(''); }
function v9RenderReply(r) { const author=r.Author||{}; const isTeacher=author.role==='teacher'; return `<div class="v9-reply ${isTeacher?'teacher':''}"><div class="v9-reply-head"><div class="flex items-center gap-2"><div class="v9-avatar small">${v9Initials(author.name||'U')}</div><div><strong>${v9Safe(author.name||'User')}</strong>${isTeacher?'<span class="ml-2 v9-subject-pill">Teacher</span>':''}</div></div><small>${v9Time(r.createdAt)}</small></div><p>${v9Safe(r.content)}</p>${v9AttachmentLink(r.metadata?.attachmentUrl, r.metadata?.attachmentName||'Attachment')}<div class="flex gap-2 flex-wrap mt-2">${r.pointsAwarded?`<span class="v9-award-pill">⭐ +${r.pointsAwarded}</span>`:''}${r.streakAwarded?`<span class="v9-award-pill">🔥 +${r.streakAwarded}</span>`:''}<button class="v9-award-pill" onclick="v9HelpfulReply(${Number(r.id)})">👍 ${r.helpfulCount||0}</button></div></div>`; }
async function v9ReplyToThread(threadId) { const input=document.getElementById(`v9-reply-input-${Number(threadId)}`); const content=input?.value?.trim(); if(!content)return; const previous=input.value; try{ const res=await chatV9API.replyToThread(threadId, content); input.value=''; const studentRoot=document.getElementById('v9-student-study-root'); if(res?.data && v9AppendReplyToThread(threadId, res.data)){ if(studentRoot) v9RenderStudentStudyRoom(); else v9RenderTeacherShell(); } else { if(studentRoot) await v9LoadStudentThreads(); else await v9RefreshTeacherChat(); } }catch(err){ input.value=previous; v9Toast(err.message||'Reply failed','error'); } }
async function v9HelpfulReply(replyId) { v9Toast('Reaction saved for this reply', 'success'); }
function v9RenderAchievements(data) { const totals=data.totals||{points:0,streak:0}; const events=data.events||[]; return `<div class="v9-achievements-card"><h3 class="font-bold text-xl">Achievements</h3><p class="text-muted-foreground text-sm">Stars and streaks awarded by teachers.</p><div class="v9-achievement-stat"><div><span class="text-muted-foreground text-sm">Points</span><strong>⭐ ${totals.points||0}</strong></div><div><span class="text-muted-foreground text-sm">Streak</span><strong>🔥 ${totals.streak||0}</strong></div></div><div class="space-y-3">${events.length?events.slice(0,5).map(e=>`<div class="v9-info-card"><div class="flex justify-between gap-2"><strong>${v9Safe(e.title||'Achievement')}</strong><span class="v9-award-pill">+${e.points||0} pts</span></div><small>${v9Safe(e.note||'Teacher awarded achievement')}</small></div>`).join(''):'<div class="v9-empty small">No achievements yet. Participate in threads to earn stars.</div>'}</div></div>`; }


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

