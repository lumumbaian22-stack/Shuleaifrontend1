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
          <div><h3>${v9ChatState.activeTab === 'chats' ? 'Direct Chats' : 'Groups'}</h3><p>${v9ChatState.activeTab === 'chats' ? 'Teacher-to-teacher messages' : 'Class, parent and staff groups'}</p></div>
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
        ${isGroup ? `<button class="tm6-btn light" onclick="v9OpenManageMembersModal(${Number(selected.id)})">Manage Members</button>` : ''}
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
  try {
    const attachmentUrl = v9ChatState.attachment?.url || null;
    if (v9ChatState.mode === 'direct' && v9ChatState.selectedTeacher) await chatV9API.sendDirectMessage(v9ChatState.selectedTeacher.id, content, attachmentUrl, v9ChatState.attachment);
    if (v9ChatState.mode === 'group' && v9ChatState.selectedGroup) await chatV9API.sendGroupMessage(v9ChatState.selectedGroup.id, content, attachmentUrl, v9ChatState.attachment);
    input.value = ''; v9ChatState.attachment = null; await v9LoadCurrentMessages();
  } catch (err) { v9Toast(err.message || 'Message failed', 'error'); }
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
    const users = availableRes.data || [];
    modal.innerHTML = `<div class="v9-modal-card wide"><button class="v9-modal-close" onclick="v9CloseModal()">×</button><h3>Manage Members</h3><p>Select who belongs in this group.</p><input class="tm-input" placeholder="Search members..." oninput="v9FilterMemberPicker(this.value)"><div class="tm-member-picker two-col" id="v9-member-picker">${users.map(u => `<label><input type="checkbox" value="${Number(u.id)}" ${current.has(Number(u.id)) ? 'checked' : ''}> <span>${v9Safe(u.name)}</span><small>${v9Safe(u.role)}${u.className ? ' • '+v9Safe(u.className) : ''}</small></label>`).join('')}</div><button class="tm6-btn primary full" onclick="v9SaveGroupMembers(${Number(groupId)})">Save Members</button></div>`;
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

// Student classroom threads keep existing access, now aligned with teacher approval rule.
async function renderStudentV9Classroom() { return `<div class="space-y-6 animate-fade-in"><div class="student-xp-hero"><div class="flex items-center gap-4"><div class="student-xp-avatar">${v9Initials(v9CurrentUser()?.name || 'Student')}</div><div><p class="text-white/70 text-sm font-semibold">Classroom Threads</p><h2 class="text-3xl font-black tracking-tight m-0">Study Discussions</h2><p class="text-white/75 text-sm mt-1">Reply to teacher topics, ask questions, and earn stars or streaks.</p></div></div><div class="student-xp-bar"><div class="flex justify-between gap-3 text-sm"><span class="text-white/75 font-semibold">Achievement Progress</span><strong id="v9-achievement-total">Loading...</strong></div><div class="student-xp-bar-track"><span style="width:72%"></span></div></div></div><div class="v9-thread-layout"><main class="v9-thread-panel" id="v9-thread-root"><div class="v9-empty">Loading classroom threads...</div></main><aside class="v9-achieve-panel" id="v9-achievement-root"><div class="v9-empty">Loading achievements...</div></aside></div></div>`; }
async function v9LoadStudentThreads() { const root=document.getElementById('v9-thread-root'); const achieve=document.getElementById('v9-achievement-root'); if(!root)return; try{ const [threadsRes, achievementsRes]=await Promise.all([chatV9API.getClassroomThreads(), chatV9API.getMyAchievements()]); const threads=(threadsRes.data||[]).filter(t => v9ThreadApproval(t) !== 'pending'); const achievementData=achievementsRes.data||{totals:{points:0,streak:0},events:[]}; root.innerHTML=v9RenderThreads(threads); if(achieve) achieve.innerHTML=v9RenderAchievements(achievementData); const totalEl=document.getElementById('v9-achievement-total'); if(totalEl) totalEl.textContent=`⭐ ${achievementData.totals?.points||0} pts • 🔥 ${achievementData.totals?.streak||0}`; }catch(err){ root.innerHTML=`<div class="v9-empty text-red-500">Could not load classroom threads: ${v9Safe(err.message)}</div>`; } }
function v9RenderThreads(threads) { if(!threads.length) return `<div class="v9-empty"><h3 class="font-bold text-lg mb-2">No classroom threads yet</h3><p>Your teacher will post structured study questions here.</p></div>`; return threads.map(t=>`<article class="v9-thread-card"><div class="v9-thread-top"><div><span class="v9-subject-pill">${v9Safe(t.subject||'Subject')}</span><h3 class="text-xl font-bold mt-3">${v9Safe(t.topic||'Classroom Topic')}</h3><p class="text-muted-foreground">${v9Safe(t.content||'')}</p>${(t.metadata?.attachments||[]).map(a=>v9AttachmentLink(a.url,a.name)).join('')}</div>${t.isPinned?'<span class="v9-award-pill">📌 Pinned</span>':''}</div><div class="mt-4">${v9ThreadReplies(t).map(r=>v9RenderReply(r)).join('')}</div><div class="v9-reply-form"><input id="v9-reply-input-${Number(t.id)}" placeholder="Write your reply or question..." onkeydown="if(event.key==='Enter')v9ReplyToThread(${Number(t.id)})"><button class="v9-send" onclick="v9ReplyToThread(${Number(t.id)})">➤</button></div></article>`).join(''); }
function v9RenderReply(r) { const author=r.Author||{}; const isTeacher=author.role==='teacher'; return `<div class="v9-reply ${isTeacher?'teacher':''}"><div class="v9-reply-head"><div class="flex items-center gap-2"><div class="v9-avatar small">${v9Initials(author.name||'U')}</div><div><strong>${v9Safe(author.name||'User')}</strong>${isTeacher?'<span class="ml-2 v9-subject-pill">Teacher</span>':''}</div></div><small>${v9Time(r.createdAt)}</small></div><p>${v9Safe(r.content)}</p>${v9AttachmentLink(r.metadata?.attachmentUrl, r.metadata?.attachmentName||'Attachment')}<div class="flex gap-2 flex-wrap mt-2">${r.pointsAwarded?`<span class="v9-award-pill">⭐ +${r.pointsAwarded}</span>`:''}${r.streakAwarded?`<span class="v9-award-pill">🔥 +${r.streakAwarded}</span>`:''}<span class="v9-award-pill">👍 ${r.helpfulCount||0}</span></div></div>`; }
async function v9ReplyToThread(threadId) { const input=document.getElementById(`v9-reply-input-${Number(threadId)}`); const content=input?.value?.trim(); if(!content)return; try{ await chatV9API.replyToThread(threadId, content); input.value=''; await v9LoadStudentThreads(); }catch(err){ v9Toast(err.message||'Reply failed','error'); } }
function v9RenderAchievements(data) { const totals=data.totals||{points:0,streak:0}; const events=data.events||[]; return `<h3 class="font-bold text-xl">Achievements</h3><p class="text-muted-foreground text-sm">Stars and streaks awarded by teachers.</p><div class="v9-achievement-stat"><div><span class="text-muted-foreground text-sm">Points</span><strong>⭐ ${totals.points||0}</strong></div><div><span class="text-muted-foreground text-sm">Streak</span><strong>🔥 ${totals.streak||0}</strong></div></div><div class="space-y-3">${events.length?events.slice(0,8).map(e=>`<div class="v9-info-card"><div class="flex justify-between gap-2"><strong>${v9Safe(e.title||'Achievement')}</strong><span class="v9-award-pill">+${e.points||0} pts</span></div><small>${v9Safe(e.note||'Teacher awarded achievement')}</small></div>`).join(''):'<div class="v9-empty">No achievements yet. Participate in threads to earn stars.</div>'}</div>`; }

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
