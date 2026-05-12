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
  attachment: null,
  threadAttachment: null
};

function v9Initials(name) {
  return (name || 'U').split(' ').filter(Boolean).map(x => x[0]).join('').slice(0,2).toUpperCase();
}
function v9Time(value) {
  if (!value) return '';
  try { return new Date(value).toLocaleString([], { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' }); } catch { return ''; }
}
function v9RoleLabel(user) { return user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Member'; }
function v9AttachmentLink(url, label = 'Attachment') {
  if (!url) return '';
  const safe = typeof resolveMediaUrl === 'function' ? resolveMediaUrl(url) : url;
  return `<a class="v9-attachment-chip" href="${escapeHtml(safe)}" target="_blank" rel="noopener">📎 ${escapeHtml(label)}</a>`;
}
function v9ThreadReplies(thread) { return thread?.ThreadReplies || thread?.replies || []; }
function v9ClassName(thread) { return thread?.Class?.name || thread?.className || 'Class group'; }

async function renderTeacherV9Messages() {
  return `
    <div class="teacher-message-workspace animate-fade-in">
      <div class="tm-hero">
        <div>
          <p class="tm-eyebrow">Teacher Workspace</p>
          <h2>Messages & Study Rooms</h2>
          <p>Communicate, manage groups, monitor student study threads, share resources and reward student participation.</p>
        </div>
        <div class="tm-hero-actions">
          <button onclick="v9OpenCreateGroupModal()" class="tm-primary">+ Create Group</button>
          <button onclick="v9OpenCreateThreadModal()" class="tm-outline">+ Study Thread</button>
          <button onclick="v9RefreshTeacherChat()" class="tm-ghost">Refresh</button>
        </div>
      </div>

      <div class="tm-top-tabs">
        <button class="${v9ChatState.activeTab === 'chats' ? 'active' : ''}" onclick="v9SetMainTab('chats')">💬 Chats</button>
        <button class="${v9ChatState.activeTab === 'groups' ? 'active' : ''}" onclick="v9SetMainTab('groups')">👥 Groups</button>
        <button class="${v9ChatState.activeTab === 'study' ? 'active' : ''}" onclick="v9SetMainTab('study')">🎓 Study Rooms</button>
        <button class="${v9ChatState.activeTab === 'announcements' ? 'active' : ''}" onclick="v9SetMainTab('announcements')">📣 Announcements</button>
      </div>

      <div id="v9-teacher-chat-root" class="tm-root"><div class="v9-empty">Loading teacher messages...</div></div>
    </div>`;
}

async function v9RefreshTeacherChat() {
  const root = document.getElementById('v9-teacher-chat-root');
  if (!root) return;
  root.innerHTML = '<div class="v9-empty">Loading teacher workspace...</div>';
  try {
    const [teachersRes, groupsRes, threadsRes] = await Promise.all([
      chatV9API.getTeachers(),
      chatV9API.getTeacherGroups(),
      chatV9API.getClassroomThreads()
    ]);
    v9ChatState.teachers = (teachersRes.data || []).filter(t => t.id !== getCurrentUser()?.id);
    v9ChatState.groups = groupsRes.data || [];
    v9ChatState.threads = threadsRes.data || [];
    if (!v9ChatState.selectedTeacher && v9ChatState.teachers[0]) v9ChatState.selectedTeacher = v9ChatState.teachers[0];
    if (!v9ChatState.selectedGroup && v9ChatState.groups[0]) v9ChatState.selectedGroup = v9ChatState.groups[0];
    if (!v9ChatState.selectedThread && v9ChatState.threads[0]) v9ChatState.selectedThread = v9ChatState.threads[0];
    await v9LoadCurrentMessages();
  } catch (err) {
    console.error('Teacher workspace load failed:', err);
    root.innerHTML = `<div class="v9-empty text-red-500">Could not load teacher messages: ${escapeHtml(err.message)}</div>`;
  }
}

function v9SetMainTab(tab) {
  v9ChatState.activeTab = tab;
  if (tab === 'groups') v9ChatState.mode = 'group';
  if (tab === 'chats') v9ChatState.mode = 'direct';
  v9LoadCurrentMessages();
}

async function v9LoadCurrentMessages() {
  try {
    if (v9ChatState.activeTab === 'study') {
      v9RenderTeacherShell();
      return;
    }
    let res;
    if (v9ChatState.mode === 'direct' && v9ChatState.selectedTeacher) {
      res = await chatV9API.getDirectMessages(v9ChatState.selectedTeacher.id);
    } else if (v9ChatState.mode === 'group' && v9ChatState.selectedGroup) {
      res = await chatV9API.getGroupMessages(v9ChatState.selectedGroup.id);
      try {
        const membersRes = await chatV9API.getGroupMembers(v9ChatState.selectedGroup.id);
        v9ChatState.members = membersRes.data || [];
      } catch { v9ChatState.members = []; }
    } else {
      v9ChatState.messages = [];
      v9RenderTeacherShell();
      return;
    }
    v9ChatState.messages = res.data || [];
    v9RenderTeacherShell();
  } catch (err) {
    console.error('Messages load failed:', err);
    v9ChatState.messages = [];
    v9RenderTeacherShell();
  }
}

function v9RenderTeacherShell() {
  const root = document.getElementById('v9-teacher-chat-root');
  if (!root) return;
  if (v9ChatState.activeTab === 'study') return v9RenderStudyRooms(root);
  if (v9ChatState.activeTab === 'announcements') return v9RenderAnnouncements(root);

  const currentUser = getCurrentUser();
  const selected = v9ChatState.mode === 'direct' ? v9ChatState.selectedTeacher : v9ChatState.selectedGroup;
  root.innerHTML = `
    <aside class="v9-chat-list">
      <input class="v9-chat-search" placeholder="Search conversations..." oninput="v9FilterConversations(this.value)">
      <div class="v9-tabs">
        <button class="${v9ChatState.mode === 'direct' ? 'active' : ''}" onclick="v9SetChatMode('direct')">Direct</button>
        <button class="${v9ChatState.mode === 'group' ? 'active' : ''}" onclick="v9SetChatMode('group')">Groups</button>
      </div>
      <div id="v9-conversation-list">${v9RenderConversationList()}</div>
    </aside>

    <section class="v9-chat-main">
      <header class="v9-chat-header">
        <div class="flex items-center gap-3">
          <div class="v9-avatar">${v9Initials(selected?.name || selected?.schoolCode || 'Chat')}</div>
          <div>
            <h3 class="font-bold text-lg">${escapeHtml(selected?.name || 'Select conversation')}</h3>
            <small>${v9ChatState.mode === 'direct' ? 'Teacher direct chat • emoji reactions only' : `${selected?.type || 'group'} group • manage members`}</small>
          </div>
        </div>
        <div class="v9-chat-actions">
          ${v9ChatState.mode === 'group' && selected ? `<button class="v9-icon-btn" title="Manage Members" onclick="v9OpenManageMembersModal(${selected.id})">👥</button>` : ''}
          <button class="v9-icon-btn" title="Attach" onclick="v9PickAttachment()">📎</button>
          <input id="v9-file-input" type="file" class="hidden" onchange="v9UploadAttachment(this.files[0])">
        </div>
      </header>
      <main class="v9-messages" id="v9-message-list">${v9RenderMessages(currentUser)}</main>
      <footer class="v9-composer">
        <div id="v9-selected-attachment" class="v9-selected-attachment">${v9ChatState.attachment ? v9AttachmentLink(v9ChatState.attachment.url, v9ChatState.attachment.name) + '<button onclick="v9ClearAttachment()">×</button>' : ''}</div>
        <input id="v9-message-input" placeholder="Type a message..." onkeydown="if(event.key==='Enter')v9SendMessage()">
        <button class="v9-send" onclick="v9SendMessage()">➤</button>
      </footer>
    </section>

    <aside class="v9-chat-info">${v9RenderInfoPanel()}</aside>`;
  const msgList = document.getElementById('v9-message-list');
  if (msgList) msgList.scrollTop = msgList.scrollHeight;
}

function v9RenderConversationList() {
  if (v9ChatState.mode === 'direct') {
    if (!v9ChatState.teachers.length) return '<div class="v9-empty">No teachers found yet.</div>';
    return v9ChatState.teachers.map(t => `
      <div class="v9-conversation ${v9ChatState.selectedTeacher?.id === t.id ? 'active' : ''}" onclick="v9SelectTeacher(${t.id})">
        <div class="v9-avatar">${v9Initials(t.name)}</div>
        <div class="min-w-0"><div class="font-bold truncate">${escapeHtml(t.name)}</div><small>${escapeHtml(t.email || 'Teacher')}</small></div>
      </div>`).join('');
  }
  if (!v9ChatState.groups.length) return '<div class="v9-empty">No groups yet. Create a group and add members.</div>';
  return v9ChatState.groups.map(g => `
    <div class="v9-conversation ${v9ChatState.selectedGroup?.id === g.id ? 'active' : ''}" onclick="v9SelectGroup(${g.id})">
      <div class="v9-avatar">${g.type === 'department' ? '🏫' : g.type === 'staff' ? '👥' : '💬'}</div>
      <div class="min-w-0"><div class="font-bold truncate">${escapeHtml(g.name)}</div><small>${g.type === 'department' ? `Department${g.headName ? ' • ' + escapeHtml(g.headName) : ''}` : escapeHtml(g.type || 'group')}</small></div>
    </div>`).join('');
}

function v9RenderMessages(currentUser) {
  if (!v9ChatState.messages.length) return '<div class="v9-empty">No messages yet. Start the conversation.</div>';
  return v9ChatState.messages.map(m => {
    const mine = m.senderId === currentUser?.id;
    const sender = m.Sender || {};
    const reactions = m.metadata?.reactions || {};
    return `<div class="v9-msg ${mine ? 'mine' : ''}">
      <div class="v9-avatar">${v9Initials(sender.name || 'U')}</div>
      <div>
        <div class="v9-bubble">
          ${!mine ? `<div class="font-bold text-xs mb-1">${escapeHtml(sender.name || 'User')} <span class="opacity-70">${escapeHtml(v9RoleLabel(sender))}</span></div>` : ''}
          <div>${escapeHtml(m.content || '')}</div>
          ${v9AttachmentLink(m.attachmentUrl, m.metadata?.attachmentName || 'Attachment')}
          <div class="meta"><span>${v9Time(m.createdAt)}</span>${m.pointsAwarded ? `<span class="v9-award-pill">⭐ +${m.pointsAwarded}</span>` : ''}${m.streakAwarded ? `<span class="v9-award-pill">🔥 +${m.streakAwarded}</span>` : ''}</div>
          <div class="v9-reactions">${Object.entries(reactions).map(([emoji, users]) => `<button onclick="v9ReactToMessage(${m.id}, '${emoji}')">${emoji} ${(users||[]).length}</button>`).join('')}</div>
        </div>
        ${!mine ? v9RenderMessageActions(m, sender) : ''}
      </div>
    </div>`;
  }).join('');
}
function v9RenderMessageActions(m, sender) {
  if (sender.role === 'student') {
    return `<div class="v9-award-menu"><button onclick="v9AwardMessage(${m.id},1,0)">⭐ +1</button><button onclick="v9AwardMessage(${m.id},3,0)">⭐ +3</button><button onclick="v9AwardMessage(${m.id},5,1)">⭐ +5 🔥</button></div>`;
  }
  return `<div class="v9-award-menu"><button onclick="v9ReactToMessage(${m.id}, '👍')">👍</button><button onclick="v9ReactToMessage(${m.id}, '👏')">👏</button><button onclick="v9ReactToMessage(${m.id}, '✅')">✅</button><button onclick="v9ReactToMessage(${m.id}, '🔥')">🔥</button><button onclick="v9ReactToMessage(${m.id}, '😂')">😂</button></div>`;
}

function v9RenderInfoPanel() {
  const selected = v9ChatState.mode === 'direct' ? v9ChatState.selectedTeacher : v9ChatState.selectedGroup;
  const members = v9ChatState.mode === 'group' ? v9ChatState.members : [];
  return `<div class="v9-info-card text-center"><div class="v9-avatar mx-auto mb-3">${v9Initials(selected?.name || 'Chat')}</div><h3 class="font-bold">${escapeHtml(selected?.name || 'Conversation')}</h3><small>${v9ChatState.mode === 'direct' ? 'Personal teacher chat' : `${members.length} members`}</small></div>
  ${v9ChatState.mode === 'group' ? `<div class="v9-info-card"><div class="flex justify-between items-center mb-2"><h4 class="font-bold">Members</h4><button class="tm-link" onclick="v9OpenManageMembersModal(${selected?.id})">Manage</button></div>${members.slice(0,8).map(m => `<div class="v9-member-row"><div class="v9-avatar small">${v9Initials(m.User?.name || 'U')}</div><div><strong>${escapeHtml(m.User?.name || 'User')}</strong><small>${escapeHtml(m.User?.role || m.role || 'member')}</small></div></div>`).join('') || '<small>No members loaded.</small>'}</div>` : ''}
  <div class="v9-info-card"><h4 class="font-bold mb-2">Rules</h4><small>Teachers give students stars/streaks. Teacher-to-teacher messages use emoji reactions only.</small></div>
  <div class="v9-info-card"><h4 class="font-bold mb-2">Attachments</h4><small>PDFs, images, videos, audio, Word, PowerPoint, spreadsheets, archives and links are supported through the attachment picker.</small></div>`;
}

function v9RenderStudyRooms(root) {
  const selected = v9ChatState.selectedThread || v9ChatState.threads[0];
  v9ChatState.selectedThread = selected || null;
  root.innerHTML = `<div class="tm-study-shell">
    <aside class="tm-study-list">
      <div class="tm-list-head"><h3>Study Room Threads</h3><button onclick="v9OpenCreateThreadModal()">+ Create</button></div>
      <div class="tm-thread-filters"><button class="active">Active <span>${v9ChatState.threads.filter(t=>!t.isClosed).length}</span></button><button>Pending Replies</button><button>Closed</button></div>
      <input class="v9-chat-search" placeholder="Search threads..." oninput="v9FilterThreads(this.value)">
      <div id="v9-thread-list">${v9RenderTeacherThreadList()}</div>
    </aside>
    <section class="tm-thread-detail">${selected ? v9RenderTeacherThreadDetail(selected) : '<div class="v9-empty">No study room threads yet.</div>'}</section>
  </div>`;
}
function v9RenderTeacherThreadList() {
  if (!v9ChatState.threads.length) return '<div class="v9-empty">Create the first study thread for your class.</div>';
  return v9ChatState.threads.map(t => {
    const replies = v9ThreadReplies(t);
    const studentReplies = replies.filter(r => r.Author?.role === 'student');
    const total = t.metadata?.studentCount || t.studentCount || '?';
    return `<button class="tm-thread-card ${v9ChatState.selectedThread?.id === t.id ? 'active' : ''}" onclick="v9SelectThread(${t.id})">
      <div><h4>${escapeHtml(t.topic)}</h4><p>${escapeHtml(v9ClassName(t))} • ${escapeHtml(t.subject || 'Subject')}</p><small>${escapeHtml((t.content || '').slice(0,90))}${(t.content||'').length>90?'...':''}</small></div>
      <div class="tm-thread-progress"><strong>${studentReplies.length}/${total}</strong><span>replied</span></div>
    </button>`;
  }).join('');
}
function v9RenderTeacherThreadDetail(t) {
  const replies = v9ThreadReplies(t);
  const studentReplies = replies.filter(r => r.Author?.role === 'student');
  const teacherReplies = replies.filter(r => r.Author?.role !== 'student');
  const attachments = t.metadata?.attachments || [];
  return `<div class="tm-detail-card">
    <div class="tm-detail-head"><div><h3>${escapeHtml(t.topic)}</h3><p>${escapeHtml(v9ClassName(t))} • ${escapeHtml(t.subject)} • ${t.isClosed ? 'Closed' : 'Active'}</p></div><button onclick="v9CloseThread(${t.id})">${t.isClosed ? 'Reopen' : 'Close Thread'}</button></div>
    <div class="tm-detail-tabs"><button class="active">Thread</button><button>Responses <span>${studentReplies.length}</span></button><button>Analytics</button></div>
    <section class="tm-question"><label>Question / Topic</label><p>${escapeHtml(t.content || '')}</p>${attachments.map(a => v9AttachmentLink(a.url, a.name || 'Attachment')).join('')}</section>
    <div class="tm-action-grid"><button onclick="v9OpenThreadReply(${t.id})">💬 Reply / Feedback</button><button onclick="v9RemindThread(${t.id})">🔔 Remind Students</button><button onclick="v9DuplicateThread(${t.id})">📋 Duplicate</button><button onclick="v9OpenCreateThreadModal()">➕ New Thread</button></div>
    <h4 class="tm-section-title">Student Responses</h4>
    <div class="tm-response-list">${replies.length ? replies.map(r => v9RenderTeacherReply(r)).join('') : '<div class="v9-empty">No replies yet.</div>'}</div>
  </div>`;
}
function v9RenderTeacherReply(r) {
  const author = r.Author || {};
  const isStudent = author.role === 'student';
  return `<div class="v9-reply ${author.role === 'teacher' ? 'teacher' : ''}">
    <div class="v9-reply-head"><div class="flex items-center gap-2"><div class="v9-avatar small">${v9Initials(author.name || 'U')}</div><div><strong>${escapeHtml(author.name || 'User')}</strong><span class="ml-2 v9-subject-pill">${escapeHtml(v9RoleLabel(author))}</span></div></div><small>${v9Time(r.createdAt)}</small></div>
    <p>${escapeHtml(r.content || '')}</p>${v9AttachmentLink(r.metadata?.attachmentUrl, r.metadata?.attachmentName || 'Attachment')}
    <div class="flex gap-2 flex-wrap mt-2">${r.pointsAwarded ? `<span class="v9-award-pill">⭐ +${r.pointsAwarded}</span>` : ''}${r.streakAwarded ? `<span class="v9-award-pill">🔥 +${r.streakAwarded}</span>` : ''}</div>
    ${isStudent ? `<div class="v9-award-menu"><button onclick="v9AwardReply(${r.id},1,0)">⭐ +1</button><button onclick="v9AwardReply(${r.id},3,0)">⭐ +3</button><button onclick="v9AwardReply(${r.id},5,1)">⭐ +5 🔥</button></div>` : `<div class="v9-award-menu"><button onclick="v9HelpfulReply(${r.id})">👍 Helpful</button></div>`}
  </div>`;
}
function v9RenderAnnouncements(root) {
  root.innerHTML = `<div class="tm-placeholder"><h3>Announcements</h3><p>Use group chats or study room threads for now. This panel is reserved for school/class broadcasts.</p></div>`;
}

function v9SetChatMode(mode) { v9ChatState.mode = mode; v9LoadCurrentMessages(); }
function v9SelectTeacher(id) { v9ChatState.selectedTeacher = v9ChatState.teachers.find(t => Number(t.id) === Number(id)); v9ChatState.mode = 'direct'; v9LoadCurrentMessages(); }
function v9SelectGroup(id) { v9ChatState.selectedGroup = v9ChatState.groups.find(g => Number(g.id) === Number(id)); v9ChatState.mode = 'group'; v9LoadCurrentMessages(); }
function v9SelectThread(id) { v9ChatState.selectedThread = v9ChatState.threads.find(t => Number(t.id) === Number(id)); v9RenderTeacherShell(); }
function v9FilterConversations(value) { const q=(value||'').toLowerCase(); document.querySelectorAll('#v9-conversation-list .v9-conversation').forEach(el => { el.style.display = el.textContent.toLowerCase().includes(q) ? '' : 'none'; }); }
function v9FilterThreads(value) { const q=(value||'').toLowerCase(); document.querySelectorAll('#v9-thread-list .tm-thread-card').forEach(el => { el.style.display = el.textContent.toLowerCase().includes(q) ? '' : 'none'; }); }
function v9PickAttachment() { document.getElementById('v9-file-input')?.click(); }
function v9ClearAttachment() { v9ChatState.attachment = null; v9RenderTeacherShell(); }
async function v9UploadAttachment(file) { if (!file) return; try { const fd = new FormData(); fd.append('file', file); const res = await chatV9API.uploadAttachment(fd); v9ChatState.attachment = res.data; v9RenderTeacherShell(); showToast('Attachment added', 'success'); } catch(err){ showToast(err.message || 'Upload failed', 'error'); } }

async function v9SendMessage() {
  const input = document.getElementById('v9-message-input');
  const content = input?.value?.trim() || (v9ChatState.attachment ? 'Shared an attachment' : '');
  if (!content) return;
  try {
    const attachmentUrl = v9ChatState.attachment?.url || null;
    if (v9ChatState.mode === 'direct' && v9ChatState.selectedTeacher) await chatV9API.sendDirectMessage(v9ChatState.selectedTeacher.id, content, attachmentUrl, v9ChatState.attachment);
    else if (v9ChatState.mode === 'group' && v9ChatState.selectedGroup) await chatV9API.sendGroupMessage(v9ChatState.selectedGroup.id, content, attachmentUrl, v9ChatState.attachment);
    input.value = ''; v9ChatState.attachment = null; await v9LoadCurrentMessages();
  } catch (err) { showToast(err.message || 'Message failed', 'error'); }
}
async function v9AwardMessage(messageId, points, streakDelta) { try { await chatV9API.awardChatMessage(messageId, points, streakDelta, 'Great student contribution'); await v9LoadCurrentMessages(); } catch (err) { showToast(err.message || 'Only students can receive stars/streaks', 'error'); } }
async function v9ReactToMessage(messageId, emoji) { try { await chatV9API.reactToMessage(messageId, emoji); await v9LoadCurrentMessages(); } catch (err) { showToast(err.message || 'Reaction failed', 'error'); } }
async function v9AwardReply(replyId, points, streakDelta) { try { await chatV9API.awardThreadReply(replyId, points, streakDelta, 'Good study room response'); await v9RefreshTeacherChat(); } catch (err) { showToast(err.message || 'Award failed', 'error'); } }
async function v9HelpfulReply(replyId) { showToast('Marked as helpful', 'success'); }

async function v9OpenCreateGroupModal() {
  await v9EnsureModal();
  const teachers = v9ChatState.teachers;
  const modal = document.getElementById('v9-modal');
  modal.innerHTML = `<div class="v9-modal-card"><button class="v9-modal-close" onclick="v9CloseModal()">×</button><h3>Create Teacher Group</h3><p>Select members now or manage them later.</p><input id="v9-new-group-name" placeholder="Group name" class="tm-input"><textarea id="v9-new-group-desc" placeholder="Description" class="tm-input"></textarea><div class="tm-member-picker">${teachers.map(t => `<label><input type="checkbox" value="${t.id}"> ${escapeHtml(t.name)}</label>`).join('')}</div><button class="tm-primary w-full" onclick="v9SubmitCreateGroup()">Create Group</button></div>`;
  modal.classList.remove('hidden');
}
async function v9SubmitCreateGroup() {
  const name = document.getElementById('v9-new-group-name')?.value?.trim();
  const description = document.getElementById('v9-new-group-desc')?.value?.trim();
  const memberUserIds = [...document.querySelectorAll('#v9-modal input[type="checkbox"]:checked')].map(x => Number(x.value));
  if (!name) return showToast('Group name is required', 'error');
  try { await chatV9API.createTeacherGroup({ name, description, type:'teacher_group', memberUserIds }); v9CloseModal(); await v9RefreshTeacherChat(); } catch(err){ showToast(err.message || 'Group creation failed', 'error'); }
}
async function v9OpenManageMembersModal(groupId) {
  if (!groupId) return;
  await v9EnsureModal();
  const modal = document.getElementById('v9-modal');
  try {
    const [membersRes, availableRes] = await Promise.all([chatV9API.getGroupMembers(groupId), chatV9API.getAvailableMembers()]);
    const current = new Set((membersRes.data || []).map(m => Number(m.userId)));
    const users = availableRes.data || [];
    modal.innerHTML = `<div class="v9-modal-card wide"><button class="v9-modal-close" onclick="v9CloseModal()">×</button><h3>Manage Group Members</h3><p>Add teachers, students, parents or admins to this group.</p><div class="tm-member-picker two-col">${users.map(u => `<label><input type="checkbox" value="${u.id}" ${current.has(Number(u.id)) ? 'checked' : ''}> <span>${escapeHtml(u.name)}</span><small>${escapeHtml(u.role)}${u.className ? ' • '+escapeHtml(u.className) : ''}</small></label>`).join('')}</div><button class="tm-primary w-full" onclick="v9SaveGroupMembers(${groupId})">Save Members</button></div>`;
    modal.classList.remove('hidden');
  } catch(err){ showToast(err.message || 'Could not load members', 'error'); }
}
async function v9SaveGroupMembers(groupId) { try { const memberUserIds = [...document.querySelectorAll('#v9-modal input[type="checkbox"]:checked')].map(x => Number(x.value)); await chatV9API.updateGroupMembers(groupId, memberUserIds); v9CloseModal(); await v9LoadCurrentMessages(); } catch(err){ showToast(err.message || 'Member update failed', 'error'); } }

async function v9OpenCreateThreadModal() {
  await v9EnsureModal();
  const modal = document.getElementById('v9-modal');
  modal.innerHTML = `<div class="v9-modal-card wide"><button class="v9-modal-close" onclick="v9CloseModal()">×</button><h3>Create Study Room Thread</h3><p>Create a guided question for students to answer.</p><div class="tm-form-grid"><input id="v9-thread-topic" class="tm-input" placeholder="Topic e.g. Fractions Revision"><input id="v9-thread-subject" class="tm-input" placeholder="Subject e.g. Mathematics"><input id="v9-thread-class" class="tm-input" placeholder="Class ID optional"><input id="v9-thread-due" class="tm-input" type="date"></div><textarea id="v9-thread-content" class="tm-input" placeholder="Question / instructions"></textarea><div class="tm-attachment-row"><input id="v9-thread-file" type="file" onchange="v9UploadThreadAttachment(this.files[0])"><span id="v9-thread-attachment-label">No attachment selected</span></div><button class="tm-primary w-full" onclick="v9SubmitCreateThread()">Create Study Thread</button></div>`;
  modal.classList.remove('hidden');
}
async function v9UploadThreadAttachment(file) { if (!file) return; try { const fd = new FormData(); fd.append('file', file); const res = await chatV9API.uploadAttachment(fd); v9ChatState.threadAttachment = res.data; document.getElementById('v9-thread-attachment-label').textContent = res.data?.name || 'Attachment selected'; } catch(err){ showToast(err.message || 'Attachment failed', 'error'); } }
async function v9SubmitCreateThread() { const topic=document.getElementById('v9-thread-topic')?.value?.trim(); const subject=document.getElementById('v9-thread-subject')?.value?.trim(); const content=document.getElementById('v9-thread-content')?.value?.trim(); const classId=document.getElementById('v9-thread-class')?.value?.trim(); const dueDate=document.getElementById('v9-thread-due')?.value; if(!topic||!subject||!content) return showToast('Topic, subject and question are required','error'); try { await chatV9API.createClassroomThread({ topic, subject, content, classId: classId || null, metadata:{ dueDate, attachments: v9ChatState.threadAttachment ? [v9ChatState.threadAttachment] : [] } }); v9ChatState.threadAttachment=null; v9CloseModal(); await v9RefreshTeacherChat(); } catch(err){ showToast(err.message || 'Thread creation failed','error'); } }
async function v9OpenThreadReply(threadId) { const content = prompt('Write feedback/reply to this study room thread'); if (!content) return; try { await chatV9API.replyToThread(threadId, content); await v9RefreshTeacherChat(); } catch(err){ showToast(err.message || 'Reply failed','error'); } }
function v9RemindThread() { showToast('Reminder action is ready for notification integration.', 'info'); }
function v9DuplicateThread(id) { const t = v9ChatState.threads.find(x => Number(x.id) === Number(id)); if (!t) return; v9ChatState.threadAttachment = null; v9OpenCreateThreadModal(); setTimeout(()=>{ document.getElementById('v9-thread-topic').value = `${t.topic} Copy`; document.getElementById('v9-thread-subject').value = t.subject || ''; document.getElementById('v9-thread-content').value = t.content || ''; }, 50); }
async function v9CloseThread() { showToast('Close/reopen thread endpoint is reserved; thread remains visible.', 'info'); }

async function v9EnsureModal() { if (!document.getElementById('v9-modal')) { const div=document.createElement('div'); div.id='v9-modal'; div.className='v9-modal hidden'; document.body.appendChild(div); } }
function v9CloseModal() { document.getElementById('v9-modal')?.classList.add('hidden'); }

// Student classroom threads keep existing access
async function renderStudentV9Classroom() { return `<div class="space-y-6 animate-fade-in"><div class="student-xp-hero"><div class="flex items-center gap-4"><div class="student-xp-avatar">${v9Initials(getCurrentUser()?.name || 'Student')}</div><div><p class="text-white/70 text-sm font-semibold">Classroom Threads</p><h2 class="text-3xl font-black tracking-tight m-0">Structured Study Discussions</h2><p class="text-white/75 text-sm mt-1">Ask questions, reply to teacher topics, earn stars and streaks.</p></div></div><div class="student-xp-bar"><div class="flex justify-between gap-3 text-sm"><span class="text-white/75 font-semibold">Achievement Progress</span><strong id="v9-achievement-total">Loading...</strong></div><div class="student-xp-bar-track"><span style="width:72%"></span></div></div></div><div class="v9-thread-layout"><main class="v9-thread-panel" id="v9-thread-root"><div class="v9-empty">Loading classroom threads...</div></main><aside class="v9-achieve-panel" id="v9-achievement-root"><div class="v9-empty">Loading achievements...</div></aside></div></div>`; }
async function v9LoadStudentThreads() { const root=document.getElementById('v9-thread-root'); const achieve=document.getElementById('v9-achievement-root'); if(!root)return; try{ const [threadsRes, achievementsRes]=await Promise.all([chatV9API.getClassroomThreads(), chatV9API.getMyAchievements()]); const threads=threadsRes.data||[]; const achievementData=achievementsRes.data||{totals:{points:0,streak:0},events:[]}; root.innerHTML=v9RenderThreads(threads); if(achieve) achieve.innerHTML=v9RenderAchievements(achievementData); const totalEl=document.getElementById('v9-achievement-total'); if(totalEl) totalEl.textContent=`⭐ ${achievementData.totals?.points||0} pts • 🔥 ${achievementData.totals?.streak||0}`; }catch(err){ root.innerHTML=`<div class="v9-empty text-red-500">Could not load classroom threads: ${escapeHtml(err.message)}</div>`; } }
function v9RenderThreads(threads) { if(!threads.length) return `<div class="v9-empty"><h3 class="font-bold text-lg mb-2">No classroom threads yet</h3><p>Your teacher will post structured study questions here.</p></div>`; return threads.map(t=>`<article class="v9-thread-card"><div class="v9-thread-top"><div><span class="v9-subject-pill">${escapeHtml(t.subject||'Subject')}</span><h3 class="text-xl font-bold mt-3">${escapeHtml(t.topic||'Classroom Topic')}</h3><p class="text-muted-foreground">${escapeHtml(t.content||'')}</p>${(t.metadata?.attachments||[]).map(a=>v9AttachmentLink(a.url,a.name)).join('')}</div>${t.isPinned?'<span class="v9-award-pill">📌 Pinned</span>':''}</div><div class="mt-4">${v9ThreadReplies(t).map(r=>v9RenderReply(r)).join('')}</div><div class="v9-reply-form"><input id="v9-reply-input-${t.id}" placeholder="Write your reply or question..." onkeydown="if(event.key===\'Enter\')v9ReplyToThread(${t.id})"><button class="v9-send" onclick="v9ReplyToThread(${t.id})">➤</button></div></article>`).join(''); }
function v9RenderReply(r) { const author=r.Author||{}; const isTeacher=author.role==='teacher'; return `<div class="v9-reply ${isTeacher?'teacher':''}"><div class="v9-reply-head"><div class="flex items-center gap-2"><div class="v9-avatar small">${v9Initials(author.name||'U')}</div><div><strong>${escapeHtml(author.name||'User')}</strong>${isTeacher?'<span class="ml-2 v9-subject-pill">Teacher</span>':''}</div></div><small>${v9Time(r.createdAt)}</small></div><p>${escapeHtml(r.content)}</p>${v9AttachmentLink(r.metadata?.attachmentUrl, r.metadata?.attachmentName||'Attachment')}<div class="flex gap-2 flex-wrap mt-2">${r.pointsAwarded?`<span class="v9-award-pill">⭐ +${r.pointsAwarded}</span>`:''}${r.streakAwarded?`<span class="v9-award-pill">🔥 +${r.streakAwarded}</span>`:''}<span class="v9-award-pill">👍 ${r.helpfulCount||0}</span></div></div>`; }
async function v9ReplyToThread(threadId) { const input=document.getElementById(`v9-reply-input-${threadId}`); const content=input?.value?.trim(); if(!content)return; try{ await chatV9API.replyToThread(threadId, content); input.value=''; await v9LoadStudentThreads(); }catch(err){ showToast(err.message||'Reply failed','error'); } }
function v9RenderAchievements(data) { const totals=data.totals||{points:0,streak:0}; const events=data.events||[]; return `<h3 class="font-bold text-xl">Achievements</h3><p class="text-muted-foreground text-sm">Stars and streaks awarded by teachers.</p><div class="v9-achievement-stat"><div><span class="text-muted-foreground text-sm">Points</span><strong>⭐ ${totals.points||0}</strong></div><div><span class="text-muted-foreground text-sm">Streak</span><strong>🔥 ${totals.streak||0}</strong></div></div><div class="space-y-3">${events.length?events.slice(0,8).map(e=>`<div class="v9-info-card"><div class="flex justify-between gap-2"><strong>${escapeHtml(e.title||'Achievement')}</strong><span class="v9-award-pill">+${e.points||0} pts</span></div><small>${escapeHtml(e.note||'Teacher awarded achievement')}</small></div>`).join(''):'<div class="v9-empty">No achievements yet. Participate in threads to earn stars.</div>'}</div>`; }

window.renderTeacherV9Messages = renderTeacherV9Messages;
window.v9RefreshTeacherChat = v9RefreshTeacherChat;
window.renderStudentV9Classroom = renderStudentV9Classroom;
window.v9LoadStudentThreads = v9LoadStudentThreads;
