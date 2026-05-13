// chat-v9-ui.js — v69 targeted messaging module
// Keeps approved dashboards intact; replaces only chat/study-room rendering and actions.
(function () {
  'use strict';

  const state = {
    role: null,
    tab: 'study',
    query: '',
    groups: [],
    threads: [],
    peers: [],
    contacts: [],
    children: [],
    childId: null,
    messages: [],
    directMessages: [],
    selectedGroupId: null,
    selectedThreadId: null,
    selectedPeerId: null,
    attachment: null,
    replyTo: null,
    recording: false,
    recorder: null,
    chunks: [],
    achievements: null,
    typingTimer: null,
  };

  const $ = (id) => document.getElementById(id);
  const me = () => (typeof getCurrentUser === 'function' ? getCurrentUser() : JSON.parse(localStorage.getItem('user') || '{}')) || {};
  const esc = (v) => String(v ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const initials = (name) => String(name || 'U').split(' ').filter(Boolean).map(x => x[0]).join('').slice(0,2).toUpperCase();
  const time = (d) => d ? new Date(d).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }) : '';
  const toast = (msg, type='info') => typeof showToast === 'function' ? showToast(msg, type) : console.log(type, msg);
  const media = (url) => typeof resolveMediaUrl === 'function' ? resolveMediaUrl(url) : url;
  const avatar = (u={}, size='') => u.profileImage ? `<img class="v69-avatar ${size}" src="${esc(media(u.profileImage))}" alt="${esc(u.name || 'User')}">` : `<span class="v69-avatar ${size}">${initials(u.name)}</span>`;
  const arr = (x) => Array.isArray(x) ? x : [];
  const meta = (x) => x?.metadata || {};
  const approval = (t) => meta(t).approvalStatus || (t?.Creator?.role === 'student' ? 'pending' : 'approved');
  const isMine = (id) => Number(id) === Number(me().id);
  const currentGroup = () => state.groups.find(g => String(g.id) === String(state.selectedGroupId)) || state.groups[0] || null;
  const currentThread = () => state.threads.find(t => Number(t.id) === Number(state.selectedThreadId)) || state.threads[0] || null;
  const currentPeer = () => [...state.peers, ...state.contacts].find(p => Number(p.id) === Number(state.selectedPeerId)) || null;
  const threadReplies = (t) => arr(t?.ThreadReplies || t?.replies).filter(r => meta(r).moderation?.action !== 'hidden');
  const participantsFor = (thread) => arr(thread?.participants).length ? arr(thread.participants) : arr(currentGroup()?.participants || state.peers);
  const unreadCount = (items) => arr(items).filter(m => !m.isRead && !isMine(m.senderId)).length;

  function shell(title, sub, actions, rootId) {
    return `<div class="v69-page animate-fade-in">
      <div class="v69-head">
        <div><p class="v69-eyebrow">Communication</p><h2>${esc(title)}</h2><p>${esc(sub)}</p></div>
        <div class="v69-actions">${actions || ''}</div>
      </div>
      <div id="${rootId}" class="v69-shell"><div class="v69-empty">Loading...</div></div>
    </div>`;
  }

  function tabs(items) {
    return `<div class="v69-tabs">${items.map(([key, label]) => `<button class="${state.tab === key ? 'active' : ''}" onclick="v69SetTab('${key}')">${label}</button>`).join('')}</div>`;
  }

  function fileLink(url, label='Attachment', mime='') {
    if (!url) return '';
    const isAudio = String(mime || url).includes('audio') || String(label).toLowerCase().includes('voice');
    if (isAudio) return `<audio class="v69-audio" controls src="${esc(media(url))}"></audio>`;
    return `<a class="v69-attachment" href="${esc(media(url))}" target="_blank" rel="noopener">📎 ${esc(label)}</a>`;
  }

  async function uploadFile(file) {
    if (!file) return null;
    const fd = new FormData();
    fd.append('file', file);
    const res = await chatV9API.uploadAttachment(fd);
    return res.data;
  }

  function listItem(item, active, onclick, sub='', icon='💬', badge='') {
    return `<button class="v69-list-item ${active ? 'active' : ''}" onclick="${onclick}">
      <span class="v69-list-icon">${icon}</span>
      <span class="v69-list-text"><strong>${esc(item.name || item.topic || 'Untitled')}</strong><small>${esc(sub)}</small></span>
      ${badge ? `<b class="v69-badge">${badge}</b>` : ''}
    </button>`;
  }

  function renderLeft(title, subtitle, items, empty='No items yet') {
    const q = state.query.toLowerCase();
    const filtered = arr(items).filter(x => !q || String(x.name || x.topic || '').toLowerCase().includes(q));
    return `<aside class="v69-list-panel">
      <div class="v69-panel-title"><h3>${esc(title)}</h3><small>${esc(subtitle)}</small></div>
      <input class="v69-search" value="${esc(state.query)}" oninput="v69Search(this.value)" placeholder="Search chats">
      <div class="v69-list-scroll">${filtered.length ? filtered.map(x => x.__html).join('') : `<div class="v69-empty small">${esc(empty)}</div>`}</div>
    </aside>`;
  }

  function renderComposer(kind, id) {
    const reply = state.replyTo ? `<div class="v69-reply-preview"><span>Replying to <b>${esc(state.replyTo.name || 'message')}</b>: ${esc(state.replyTo.text || '').slice(0, 90)}</span><button onclick="v69CancelReply()">×</button></div>` : '';
    const file = state.attachment ? `<div class="v69-file-preview">${fileLink(state.attachment.url, state.attachment.name || 'Attachment', state.attachment.mimeType)} <button onclick="v69ClearFile()">×</button></div>` : '';
    return `<footer class="v69-composer">
      ${reply}${file}<div id="v69-typing-line" class="v69-typing-line"></div>
      <div class="v69-compose-row">
        <button onclick="v69Emoji('${kind}','${id}','😊')" title="Emoji">😊</button>
        <button onclick="v69PickFile()" title="Attach">📎</button>
        <button onclick="v69ToggleVoice()" class="${state.recording ? 'recording' : ''}" title="Voice note">🎙</button>
        <input id="v69-input-${kind}-${id}" placeholder="Type a message..." oninput="v69Typing()" onkeydown="if(event.key==='Enter')v69Send('${kind}','${id}')">
        <button class="send" onclick="v69Send('${kind}','${id}')">➤</button>
        <input id="v69-file-input" class="v69-hidden" type="file" onchange="v69UploadFile(this.files[0])">
      </div>
    </footer>`;
  }

  function bubble(m, opts={}) {
    const sender = m.Sender || m.Author || {};
    const mine = opts.mine ?? isMine(m.senderId || m.userId);
    const mta = meta(m);
    if (mta.moderation?.action === 'hidden') return '';
    const reactions = mta.reactions || {};
    const id = Number(m.id);
    const replyMode = !!opts.reply;
    const attachment = m.attachmentUrl || mta.attachmentUrl;
    const attachmentName = mta.attachmentName || (attachment ? 'Attachment' : '');
    const attachmentType = mta.attachmentType || '';
    const senderRole = sender.role || m.role || '';
    const canReward = opts.canReward && senderRole === 'student';
    const messageText = esc(m.content || '');
    const quote = mta.replyTo ? `<div class="v69-quote">↪ ${esc(mta.replyTo.text || '')}</div>` : '';
    return `<article class="v69-msg ${mine ? 'mine' : ''} ${mta.pinned ? 'pinned' : ''}">
      ${mine ? '' : avatar(sender, 'sm')}
      <div class="v69-bubble ${mine ? 'mine' : ''} ${senderRole === 'teacher' ? 'teacher' : ''}">
        ${!mine ? `<strong>${esc(sender.name || 'User')} ${senderRole ? `<small>• ${esc(senderRole)}</small>` : ''}</strong>` : ''}
        ${mta.pinned ? '<div class="v69-pin">📌 Pinned</div>' : ''}
        ${quote}<p>${messageText}</p>${fileLink(attachment, attachmentName, attachmentType)}
        <div class="v69-meta"><span>${time(m.createdAt)}</span>${mine ? '<span>✓✓</span>' : ''}${m.pointsAwarded ? `<span>⭐ ${m.pointsAwarded}</span>` : ''}${m.streakAwarded ? `<span>🔥 ${m.streakAwarded}</span>` : ''}</div>
        <div class="v69-reactions">${Object.entries(reactions).map(([e,u]) => `<button onclick="${replyMode ? 'v69ReactReply' : 'v69React'}(${id},'${esc(e)}')">${esc(e)} ${arr(u).length}</button>`).join('')}</div>
        <div class="v69-mini-actions">
          <button onclick="v69SetReply('${replyMode ? 'thread' : (state.tab === 'groups' ? 'group' : 'private')}',${id},'${esc(sender.name || 'User')}','${messageText.replace(/'/g, '&#39;')}')">Reply</button>
          <button onclick="${replyMode ? 'v69ReactReply' : 'v69React'}(${id},'👍')">👍</button>
          <button onclick="${replyMode ? 'v69ReactReply' : 'v69React'}(${id},'❤️')">❤️</button>
          <button onclick="${replyMode ? 'v69PinReply' : 'v69Pin'}(${id})">Pin</button>
          ${canReward ? `<button onclick="${replyMode ? 'v69AwardReply' : 'v69AwardMessage'}(${id},1,0)">⭐</button><button onclick="${replyMode ? 'v69AwardReply' : 'v69AwardMessage'}(${id},5,1)">🔥</button>` : ''}
          <button onclick="${replyMode ? 'v69ModerateReply' : 'v69Moderate'}(${id})">Report</button>
        </div>
      </div>
    </article>`;
  }

  function scrollBottom(){ setTimeout(() => { const f = $('v69-feed'); if (f) f.scrollTop = f.scrollHeight; }, 60); }

  // ---------------- STUDENT ----------------
  window.renderStudentV9Classroom = async function () {
    setTimeout(v69LoadStudent, 80);
    return shell('Study Chat', 'WhatsApp-style class discussions and private messages with classmates.', '<button class="v69-btn" onclick="v69LoadStudent()">Refresh</button><button class="v69-btn primary" onclick="v69OpenTopicModal()">+ Topic</button>', 'v69-student-root');
  };

  window.v69LoadStudent = async function () {
    state.role = 'student';
    if (!['study','private'].includes(state.tab)) state.tab = 'study';
    const root = $('v69-student-root'); if (root) root.innerHTML = '<div class="v69-empty">Loading study chat...</div>';
    try {
      const [threadsRes, achRes] = await Promise.all([chatV9API.getClassroomThreads(), chatV9API.getMyAchievements().catch(() => ({ data: null }))]);
      state.threads = arr(threadsRes.data);
      state.groups = arr(threadsRes.meta?.groups);
      state.achievements = achRes.data || null;
      if (!state.groups.length) {
        const participants = arr(threadsRes.meta?.participants || []);
        state.groups = [{ id: 'my-class', name: 'My Class Study Group', type: 'class-study-group', participantCount: participants.length, participants }];
      }
      if (!state.selectedGroupId && state.groups[0]) state.selectedGroupId = state.groups[0].id;
      const group = currentGroup();
      state.peers = [...new Map(arr(group?.participants).filter(p => !isMine(p.id)).map(p => [p.id, p])).values()];
      const visibleThreads = state.threads.filter(t => !group?.classId || Number(t.classId) === Number(group.classId) || !t.classId);
      if (!state.selectedThreadId && visibleThreads[0]) state.selectedThreadId = visibleThreads[0].id;
      renderStudent();
    } catch (e) { if (root) root.innerHTML = `<div class="v69-empty error">${esc(e.message || 'Could not load study chat')}</div>`; }
  };

  function renderStudent() {
    const root = $('v69-student-root'); if (!root) return;
    const group = currentGroup();
    const leftItems = state.tab === 'private'
      ? state.peers.map(p => ({ ...p, __html: listItem(p, Number(p.id) === Number(state.selectedPeerId), `v69SelectPeer(${Number(p.id)})`, 'Classmate • private chat', '👤', '') }))
      : state.groups.map(g => ({ ...g, __html: listItem(g, String(g.id) === String(state.selectedGroupId), `v69SelectGroup('${g.id}')`, `${g.participantCount || arr(g.participants).length || 0} classmates`, '👥', '') }));
    root.innerHTML = `<div class="v69-main-grid student">
      ${renderLeft(state.tab === 'private' ? 'Classmates' : 'Study Groups', state.tab === 'private' ? 'Private messages' : 'Class discussion rooms', leftItems, 'No classmates found')}
      <section class="v69-chat-panel">${tabs([['study','Study Group'],['private','Private Messages']])}${state.tab === 'private' ? renderPrivateWindow(currentPeer()) : renderStudyWindow(group, currentThread())}</section>
      <aside class="v69-info-panel">${state.tab === 'private' ? renderPrivateInfo(currentPeer()) : renderStudyInfo(group, currentThread())}</aside>
    </div>`;
    scrollBottom();
  }

  function renderStudyWindow(group, thread) {
    const threads = state.threads.filter(t => !group?.classId || Number(t.classId) === Number(group.classId) || !t.classId);
    if (!thread && threads[0]) thread = threads[0];
    const pending = thread && approval(thread) === 'pending';
    const replies = threadReplies(thread);
    return `<header class="v69-chat-head"><div>${avatar({ name: group?.name || 'Study' }, 'group')}<div><h3>${esc(group?.name || 'Class Study Group')}</h3><p><span class="v69-online"></span>${arr(group?.participants).length || state.peers.length || 0} classmates • group study</p></div></div><button class="v69-icon-btn" onclick="v69OpenTopicModal()">＋</button></header>
      <div class="v69-topic-strip">${threads.map(t => `<button class="${Number(t.id) === Number(state.selectedThreadId) ? 'active' : ''}" onclick="v69SelectThread(${Number(t.id)})">${approval(t)==='pending'?'⏳':'💬'} ${esc(t.topic)}</button>`).join('') || '<button onclick="v69OpenTopicModal()">+ Start Topic</button>'}</div>
      ${thread ? `<div class="v69-pinned">📌 <b>${esc(thread.topic)}</b><span>${esc(thread.Creator?.role === 'teacher' ? 'Teacher topic' : 'Student topic')}</span></div>` : ''}
      <main class="v69-feed" id="v69-feed">${pending ? '<div class="v69-warning">Waiting for teacher approval before full class discussion.</div>' : ''}${replies.length ? replies.map(r => bubble(r, { reply: true, mine: isMine(r.userId), canReward: false })).join('') : '<div class="v69-empty small">No replies yet. Ask or answer first.</div>'}</main>
      ${thread && !pending ? renderComposer('thread', thread.id) : ''}`;
  }

  function renderStudyInfo(group, thread) {
    const participants = arr(group?.participants || state.peers);
    const totals = state.achievements?.totals || {};
    return `<div class="v69-card"><h3>${esc(group?.name || 'Study Group')}</h3><p>${participants.length} participants visible</p><div class="v69-stats"><span>⭐ ${totals.points || 0}</span><span>🔥 ${totals.streak || 0}</span><span>💬 ${state.threads.length}</span></div><button class="v69-btn primary" onclick="v69OpenTopicModal()">Create Topic</button></div>
      <div class="v69-card"><h4>Participants</h4><div class="v69-member-list">${participants.length ? participants.map(p => `<button onclick="v69SelectPeer(${Number(p.id)})">${avatar(p,'sm')}<span>${esc(p.name)}<small>Private message</small></span></button>`).join('') : '<p>No classmates found. Check student class assignment.</p>'}</div></div>`;
  }

  // ---------------- TEACHER ----------------
  window.renderTeacherV9Messages = async function () {
    setTimeout(v69LoadTeacher, 80);
    return shell('Messages & Study Rooms', 'Simple staff chats, class groups, parent messages and study moderation.', '<button class="v69-btn" onclick="v69LoadTeacher()">Refresh</button><button class="v69-btn primary" onclick="v69TeacherNew()">+ New</button>', 'v69-teacher-root');
  };

  window.v69LoadTeacher = async function () {
    state.role = 'teacher';
    if (!['groups','private','study','announcements'].includes(state.tab)) state.tab = 'groups';
    const root = $('v69-teacher-root'); if (root) root.innerHTML = '<div class="v69-empty">Loading messages...</div>';
    try {
      const [groupsRes, contactsRes, threadsRes] = await Promise.all([chatV9API.getTeacherGroups(), chatV9API.getTeachers(), chatV9API.getClassroomThreads()]);
      state.groups = arr(groupsRes.data);
      state.contacts = arr(contactsRes.data).filter(u => !isMine(u.id));
      state.threads = arr(threadsRes.data);
      if (!state.selectedGroupId && state.groups[0]) state.selectedGroupId = state.groups[0].id;
      if (!state.selectedPeerId && state.contacts[0]) state.selectedPeerId = state.contacts[0].id;
      if (!state.selectedThreadId && state.threads[0]) state.selectedThreadId = state.threads[0].id;
      if (state.tab === 'groups' && state.selectedGroupId) await v69LoadGroup(state.selectedGroupId, false);
      if (state.tab === 'private' && state.selectedPeerId) await v69LoadDirect(state.selectedPeerId, false);
      renderTeacher();
    } catch(e) { if (root) root.innerHTML = `<div class="v69-empty error">${esc(e.message || 'Could not load messages')}</div>`; }
  };

  function renderTeacher() {
    const root = $('v69-teacher-root'); if (!root) return;
    let items=[];
    if (state.tab === 'groups') items = state.groups.map(g => ({ ...g, __html: listItem(g, Number(g.id) === Number(state.selectedGroupId), `v69SelectGroup(${Number(g.id)})`, `${g.type || 'group'} • ${g.membershipRole || 'member'}`, '👥', unreadCount(state.messages)||'') }));
    if (state.tab === 'private') items = state.contacts.map(c => ({ ...c, __html: listItem(c, Number(c.id) === Number(state.selectedPeerId), `v69SelectPeer(${Number(c.id)})`, c.role || 'teacher', c.role === 'admin' ? '🏫' : '👤') }));
    if (state.tab === 'study') items = state.threads.map(t => ({ ...t, __html: listItem(t, Number(t.id) === Number(state.selectedThreadId), `v69SelectThread(${Number(t.id)})`, `${approval(t)} • ${arr(t.ThreadReplies).length} replies`, approval(t)==='pending'?'⏳':'💬') }));
    if (state.tab === 'announcements') items = state.groups.filter(g => ['staff','department','announcement'].includes(g.type)).map(g => ({ ...g, __html: listItem(g, Number(g.id) === Number(state.selectedGroupId), `v69SelectGroup(${Number(g.id)})`, 'Broadcast/department group', '📣') }));
    root.innerHTML = `<div class="v69-main-grid teacher">
      ${renderLeft(tabTitle(), tabSub(), items, 'Nothing here yet')}
      <section class="v69-chat-panel">${tabs([['groups','Groups'],['private','Direct'],['study','Study Rooms'],['announcements','Announcements']])}${teacherCenter()}</section>
      <aside class="v69-info-panel">${teacherInfo()}</aside>
    </div>`;
    scrollBottom();
  }
  function tabTitle(){ return state.tab === 'groups' ? 'Groups' : state.tab === 'private' ? 'Direct Messages' : state.tab === 'study' ? 'Study Rooms' : 'Announcements'; }
  function tabSub(){ return state.tab === 'study' ? 'Approve & monitor student topics' : state.tab === 'announcements' ? 'School and department notices' : 'Select a chat'; }
  function teacherCenter(){ if (state.tab === 'study') return renderTeacherStudy(currentThread()); if (state.tab === 'groups' || state.tab === 'announcements') return renderGroupWindow(currentGroup()); return renderPrivateWindow(currentPeer()); }
  function teacherInfo(){ if (state.tab === 'study') return renderTeacherStudyInfo(currentThread()); if (state.tab === 'groups' || state.tab === 'announcements') return renderGroupInfo(currentGroup()); return renderPrivateInfo(currentPeer()); }

  function renderGroupWindow(group) {
    if (!group) return '<div class="v69-empty">Select or create a group.</div>';
    return `<header class="v69-chat-head"><div>${avatar({ name: group.name }, 'group')}<div><h3>${esc(group.name)}</h3><p><span class="v69-online"></span>${esc(group.type || 'group')} • ${state.members.length || 0} members</p></div></div><button class="v69-icon-btn" onclick="v69OpenMembersModal(${Number(group.id)})">Members</button></header>${pinnedMessages(state.messages)}<main class="v69-feed" id="v69-feed">${state.messages.length ? state.messages.map(m => bubble(m, { mine: isMine(m.senderId), canReward: m.Sender?.role === 'student' })).join('') : '<div class="v69-empty small">No messages yet.</div>'}</main>${renderComposer('group', group.id)}`;
  }

  function renderGroupInfo(group) {
    return group ? `<div class="v69-card"><h3>${esc(group.name)}</h3><p>${esc(group.description || group.type || 'Group chat')}</p><button class="v69-btn primary" onclick="v69OpenMembersModal(${Number(group.id)})">Manage Members</button></div><div class="v69-card"><h4>Members</h4><div class="v69-member-list">${state.members.length ? state.members.map(m => `<div>${avatar(m.User,'sm')}<span>${esc(m.User?.name || 'User')}<small>${esc(m.User?.role || m.role)}</small></span></div>`).join('') : '<p>Open a group to load members.</p>'}</div></div>` : '';
  }

  function renderTeacherStudy(thread) {
    if (!thread) return '<div class="v69-empty">Select or create a study room thread.</div>';
    const replies = threadReplies(thread);
    return `<header class="v69-chat-head"><div>${avatar(thread.Creator || { name:'Thread' }, 'group')}<div><h3>${esc(thread.topic)}</h3><p>${esc(thread.subject)} • ${approval(thread)}</p></div></div><button class="v69-icon-btn" onclick="v69OpenTeacherThreadModal()">＋</button></header><div class="v69-pinned">${esc(thread.content)}</div><main class="v69-feed" id="v69-feed">${replies.length ? replies.map(r => bubble(r, { reply:true, mine:isMine(r.userId), canReward:r.Author?.role === 'student' })).join('') : '<div class="v69-empty small">No replies yet.</div>'}</main>${renderComposer('thread', thread.id)}`;
  }

  function renderTeacherStudyInfo(thread) {
    const participants = participantsFor(thread);
    if (!thread) return `<div class="v69-card"><h3>Study Room Tools</h3><button class="v69-btn primary" onclick="v69OpenTeacherThreadModal()">Create Thread</button></div>`;
    return `<div class="v69-card"><h3>Moderation</h3><p>${esc(thread.topic)}</p><div class="v69-stack"><button class="v69-btn primary" onclick="v69ApproveThread(${Number(thread.id)})">Approve</button><button class="v69-btn" onclick="v69ToggleThread(${Number(thread.id)},${!thread.isClosed})">${thread.isClosed ? 'Reopen' : 'Close'}</button><button class="v69-btn" onclick="v69PinThread(${Number(thread.id)},${!thread.isPinned})">${thread.isPinned ? 'Unpin' : 'Pin'}</button></div></div><div class="v69-card"><h4>Participants</h4><div class="v69-member-list">${participants.length ? participants.map(p => `<div>${avatar(p,'sm')}<span>${esc(p.name)}<small>student</small></span></div>`).join('') : '<p>No participants found.</p>'}</div></div>`;
  }

  // ---------------- PARENT ----------------
  window.renderParentChat = async function () {
    setTimeout(v69LoadParent, 80);
    return shell('Parent Messages', 'Child-specific conversations with teachers and admin.', '<button class="v69-btn" onclick="v69LoadParent()">Refresh</button>', 'v69-parent-root');
  };
  window.v69LoadParent = async function () {
    state.role = 'parent'; state.tab = 'parent';
    const root = $('v69-parent-root'); if (root) root.innerHTML = '<div class="v69-empty">Loading parent messages...</div>';
    try {
      const [childrenRes, contactsRes] = await Promise.all([api.parent.getChildren().catch(() => ({ data: [] })), chatV9API.getParentContacts()]);
      state.children = arr(childrenRes.data);
      state.contacts = arr(contactsRes.data);
      state.childId = localStorage.getItem('shule_selected_child_id') || state.children[0]?.id || null;
      if (!state.selectedPeerId && state.contacts[0]) state.selectedPeerId = state.contacts[0].id;
      if (state.selectedPeerId) await v69LoadDirect(state.selectedPeerId, false);
      renderParent();
    } catch(e) { if (root) root.innerHTML = `<div class="v69-empty error">${esc(e.message || 'Could not load parent messages')}</div>`; }
  };
  function renderParent() {
    const root = $('v69-parent-root'); if (!root) return;
    const contacts = state.contacts.map(c => ({ ...c, __html: listItem(c, Number(c.id) === Number(state.selectedPeerId), `v69SelectPeer(${Number(c.id)})`, `${c.role} • child-specific`, c.role === 'admin' ? '🏫' : '📚') }));
    const selected = state.children.find(c => String(c.id) === String(state.childId));
    root.innerHTML = `<div class="v69-main-grid parent">
      <aside class="v69-list-panel"><div class="v69-panel-title"><h3>My Children</h3><small>Switch child context</small></div><select class="v69-search" onchange="v69SelectChild(this.value)">${state.children.map(c => `<option value="${c.id}" ${String(c.id) === String(state.childId) ? 'selected' : ''}>${esc(c.User?.name || c.name || 'Child')}</option>`).join('')}</select>${renderLeft('Contacts','Teachers & admin', contacts, 'No contacts found')}</aside>
      <section class="v69-chat-panel">${renderPrivateWindow(currentPeer())}</section>
      <aside class="v69-info-panel"><div class="v69-card"><h3>Conversation Context</h3><p><b>Selected child:</b> ${esc(selected?.User?.name || selected?.name || 'Not selected')}</p><p>Messages stay linked to this child context.</p><button class="v69-btn" onclick="v69PickFile()">Attach File</button><button class="v69-btn" onclick="v69ToggleVoice()">Voice Note</button></div></aside>
    </div>`;
    scrollBottom();
  }

  function renderPrivateWindow(peer) {
    if (!peer) return '<div class="v69-empty">Select a contact.</div>';
    return `<header class="v69-chat-head"><div>${avatar(peer)}<div><h3>${esc(peer.name)}</h3><p><span class="v69-online"></span>Online • private message</p></div></div><button class="v69-icon-btn" onclick="v69LoadDirect(${Number(peer.id)})">↻</button></header>${pinnedMessages(state.directMessages)}<main class="v69-feed" id="v69-feed">${state.directMessages.length ? state.directMessages.map(m => bubble(m, { mine:isMine(m.senderId), canReward:false })).join('') : '<div class="v69-empty small">No messages yet.</div>'}</main>${renderComposer('private', peer.id)}`;
  }
  function renderPrivateInfo(peer){ return peer ? `<div class="v69-card">${avatar(peer,'big')}<h3>${esc(peer.name)}</h3><p>${esc(peer.role || 'Contact')}</p></div>` : ''; }
  function pinnedMessages(messages){ const pins = arr(messages).filter(m => meta(m).pinned); return pins.length ? `<div class="v69-pinned-list">${pins.slice(-2).map(p => `<span>📌 ${esc(p.content).slice(0,80)}</span>`).join('')}</div>` : ''; }

  // ---------------- ACTIONS ----------------
  window.v69SetTab = function (tab) { state.tab = tab; state.query = ''; if (state.role === 'teacher') v69LoadTeacher(); else if (state.role === 'parent') v69LoadParent(); else v69LoadStudent(); };
  window.v69Search = function (q) { state.query = q || ''; if (state.role === 'teacher') renderTeacher(); else if (state.role === 'parent') renderParent(); else renderStudent(); };
  window.v69SelectGroup = async function (id) { state.selectedGroupId = id; if (state.role === 'student') { const g = currentGroup(); state.peers = arr(g?.participants).filter(p => !isMine(p.id)); state.selectedThreadId = null; renderStudent(); } else { await v69LoadGroup(id); } };
  window.v69SelectThread = function (id) { state.selectedThreadId = id; state.role === 'teacher' ? renderTeacher() : renderStudent(); };
  window.v69SelectPeer = async function (id) { state.selectedPeerId = id; state.tab = state.role === 'student' ? 'private' : state.tab; await v69LoadDirect(id); };
  window.v69SelectChild = async function (id) { state.childId = id; localStorage.setItem('shule_selected_child_id', id); renderParent(); };

  window.v69LoadDirect = async function (id, rerender=true) { const res = await chatV9API.getDirectMessages(id); state.directMessages = arr(res.data); if (rerender) { if (state.role === 'parent') renderParent(); else if (state.role === 'teacher') renderTeacher(); else renderStudent(); } };
  window.v69LoadGroup = async function (id, rerender=true) { const [msgs, members] = await Promise.all([chatV9API.getGroupMessages(id), chatV9API.getGroupMembers(id)]); state.messages = arr(msgs.data); state.members = arr(members.data); if (rerender) renderTeacher(); };

  window.v69Send = async function (kind, id) {
    const input = $(`v69-input-${kind}-${id}`);
    const content = input?.value?.trim() || (state.attachment ? 'Shared an attachment' : '');
    if (!content) return;
    const replyTo = state.replyTo ? { id: state.replyTo.id, text: state.replyTo.text, name: state.replyTo.name } : null;
    try {
      if (kind === 'private') await chatV9API.sendDirectMessage(Number(id), content, state.attachment?.url || null, state.attachment || null, replyTo);
      else if (kind === 'group') await chatV9API.sendGroupMessage(Number(id), content, state.attachment?.url || null, state.attachment || null, replyTo);
      else await chatV9API.replyToThread(Number(id), content, null, state.attachment?.url || null, state.attachment || null, replyTo);
      state.attachment = null; state.replyTo = null; if (input) input.value = '';
      if (kind === 'private') await v69LoadDirect(id); else if (kind === 'group') await v69LoadGroup(id); else state.role === 'teacher' ? await v69LoadTeacher() : await v69LoadStudent();
    } catch(e) { toast(e.message || 'Send failed', 'error'); }
  };
  window.v69Emoji = (kind,id,emoji) => { const input = $(`v69-input-${kind}-${id}`); if (input) { input.value += emoji; input.focus(); } };
  window.v69Typing = () => { const line = $('v69-typing-line'); if (!line) return; line.textContent = 'Typing...'; clearTimeout(state.typingTimer); state.typingTimer = setTimeout(() => line.textContent = '', 1100); };
  window.v69PickFile = () => $('v69-file-input')?.click();
  window.v69UploadFile = async (file) => { try { state.attachment = await uploadFile(file); const row = document.querySelector('.v69-file-preview'); if (row) row.innerHTML = `${fileLink(state.attachment.url, state.attachment.name, state.attachment.mimeType)} <button onclick="v69ClearFile()">×</button>`; } catch(e) { toast(e.message || 'Upload failed', 'error'); } };
  window.v69ClearFile = () => { state.attachment = null; const row = document.querySelector('.v69-file-preview'); if (row) row.innerHTML = ''; };
  window.v69SetReply = (kind,id,name,text) => { state.replyTo = { kind, id, name, text }; state.role === 'teacher' ? renderTeacher() : state.role === 'parent' ? renderParent() : renderStudent(); };
  window.v69CancelReply = () => { state.replyTo = null; state.role === 'teacher' ? renderTeacher() : state.role === 'parent' ? renderParent() : renderStudent(); };
  window.v69React = async (id,emoji) => { try { await chatV9API.reactToMessage(id, emoji); state.tab === 'groups' || state.tab === 'announcements' ? await v69LoadGroup(state.selectedGroupId) : await v69LoadDirect(state.selectedPeerId); } catch(e) { toast(e.message || 'Reaction failed', 'error'); } };
  window.v69ReactReply = async (id,emoji) => { try { await chatV9API.reactToReply(id, emoji); state.role === 'teacher' ? await v69LoadTeacher() : await v69LoadStudent(); } catch(e) { toast(e.message || 'Reaction failed', 'error'); } };
  window.v69Pin = async (id) => { try { await chatV9API.pinMessage(id); state.tab === 'groups' || state.tab === 'announcements' ? await v69LoadGroup(state.selectedGroupId) : await v69LoadDirect(state.selectedPeerId); } catch(e) { toast(e.message || 'Pin failed', 'error'); } };
  window.v69PinReply = async (id) => { try { await chatV9API.pinReply(id); state.role === 'teacher' ? await v69LoadTeacher() : await v69LoadStudent(); } catch(e) { toast(e.message || 'Pin failed', 'error'); } };
  window.v69Moderate = async (id) => { try { await chatV9API.moderateMessage(id, { action:'reported', reason:'Reported from chat' }); toast('Reported for moderation', 'success'); } catch(e) { toast(e.message || 'Report failed', 'error'); } };
  window.v69ModerateReply = async (id) => { try { await chatV9API.moderateReply(id, { action:'reported', reason:'Reported from study room' }); toast('Reported for moderation', 'success'); } catch(e) { toast(e.message || 'Report failed', 'error'); } };
  window.v69AwardMessage = async (id, points, streak) => { try { await chatV9API.awardChatMessage(id, points, streak, 'Teacher reward'); await v69LoadGroup(state.selectedGroupId); toast('Student rewarded', 'success'); } catch(e) { toast(e.message || 'Only students can receive stars/streaks', 'error'); } };
  window.v69AwardReply = async (id, points, streak) => { try { await chatV9API.awardThreadReply(id, points, streak, 'Good study contribution'); await v69LoadTeacher(); toast('Student rewarded', 'success'); } catch(e) { toast(e.message || 'Reward failed', 'error'); } };
  window.v69ApproveThread = async (id) => { try { await chatV9API.updateClassroomThread(id, { approvalStatus:'approved' }); await v69LoadTeacher(); } catch(e) { toast(e.message, 'error'); } };
  window.v69ToggleThread = async (id, closed) => { try { await chatV9API.updateClassroomThread(id, { isClosed: closed }); await v69LoadTeacher(); } catch(e) { toast(e.message, 'error'); } };
  window.v69PinThread = async (id, pinned) => { try { await chatV9API.updateClassroomThread(id, { isPinned: pinned }); await v69LoadTeacher(); } catch(e) { toast(e.message, 'error'); } };

  window.v69ToggleVoice = async function () {
    try {
      if (state.recording && state.recorder) { state.recorder.stop(); state.recording = false; return; }
      const stream = await navigator.mediaDevices.getUserMedia({ audio:true });
      state.chunks = []; state.recorder = new MediaRecorder(stream); state.recording = true; toast('Recording voice note... click mic again to stop', 'info');
      state.recorder.ondataavailable = (e) => state.chunks.push(e.data);
      state.recorder.onstop = async () => { stream.getTracks().forEach(t => t.stop()); const blob = new Blob(state.chunks, { type:'audio/webm' }); const file = new File([blob], `voice-note-${Date.now()}.webm`, { type:'audio/webm' }); state.attachment = await uploadFile(file); toast('Voice note attached', 'success'); state.role === 'teacher' ? renderTeacher() : state.role === 'parent' ? renderParent() : renderStudent(); };
      state.recorder.start();
    } catch(e) { toast('Voice recording needs microphone permission. You can still attach an audio file.', 'error'); }
  };

  function modal(html) { let m = $('v69-modal'); if (!m) { m = document.createElement('div'); m.id = 'v69-modal'; document.body.appendChild(m); } m.className = 'v69-modal'; m.innerHTML = `<div class="v69-modal-card"><button class="v69-close" onclick="v69CloseModal()">×</button>${html}</div>`; }
  window.v69CloseModal = () => $('v69-modal')?.remove();
  window.v69OpenTopicModal = () => modal(`<h3>Create Study Topic</h3><p>Student topics wait for teacher approval. Teacher topics open immediately.</p><label>Subject</label><input id="v69-topic-subject" placeholder="Mathematics"><label>Topic</label><input id="v69-topic-title" placeholder="Fractions revision"><label>Question</label><textarea id="v69-topic-content" placeholder="Ask your question..."></textarea><div class="v69-modal-actions"><button class="v69-btn" onclick="v69CloseModal()">Cancel</button><button class="v69-btn primary" onclick="v69SubmitTopic()">Create</button></div>`);
  window.v69SubmitTopic = async () => { const g = currentGroup(); const subject = $('v69-topic-subject')?.value?.trim() || 'Study Group'; const topic = $('v69-topic-title')?.value?.trim(); const content = $('v69-topic-content')?.value?.trim(); if (!topic || !content) return toast('Topic and question are required','error'); try { await chatV9API.createClassroomThread({ classId: g?.classId || null, subject, topic, content, metadata:{ approvalStatus: state.role === 'student' ? 'pending' : 'approved', source:`${state.role}-created-topic` } }); v69CloseModal(); state.role === 'teacher' ? await v69LoadTeacher() : await v69LoadStudent(); } catch(e) { toast(e.message,'error'); } };
  window.v69OpenTeacherThreadModal = () => { state.role = 'teacher'; v69OpenTopicModal(); };
  window.v69TeacherNew = () => state.tab === 'groups' ? v69OpenGroupModal() : state.tab === 'study' ? v69OpenTeacherThreadModal() : toast('Open Groups or Study Rooms to create items', 'info');
  window.v69OpenGroupModal = async () => { try { const res = await chatV9API.getAvailableMembers(); state.available = arr(res.data); } catch { state.available = []; } modal(`<h3>Create Group</h3><label>Group name</label><input id="v69-group-name" placeholder="Grade 6 Maths"><label>Description</label><input id="v69-group-desc" placeholder="Optional"><label>Add members</label><div class="v69-member-picker">${state.available.map(u => `<label><input type="checkbox" value="${Number(u.id)}"> ${esc(u.name)} <small>• ${esc(u.role)}</small></label>`).join('')}</div><div class="v69-modal-actions"><button class="v69-btn" onclick="v69CloseModal()">Cancel</button><button class="v69-btn primary" onclick="v69CreateGroup()">Create Group</button></div>`); };
  window.v69CreateGroup = async () => { const name = $('v69-group-name')?.value?.trim(); if (!name) return toast('Group name required','error'); const ids = [...document.querySelectorAll('.v69-member-picker input:checked')].map(x => Number(x.value)); try { await chatV9API.createTeacherGroup({ name, description:$('v69-group-desc')?.value || '', type:'study', memberUserIds:ids }); v69CloseModal(); await v69LoadTeacher(); } catch(e) { toast(e.message,'error'); } };
  window.v69OpenMembersModal = async (groupId) => { try { const [m,a] = await Promise.all([chatV9API.getGroupMembers(groupId), chatV9API.getAvailableMembers()]); const selected = new Set(arr(m.data).map(x => Number(x.User?.id || x.userId))); state.available = arr(a.data); modal(`<h3>Manage Members</h3><p>Add/remove students, teachers, parents and admins.</p><div class="v69-member-picker">${state.available.map(u => `<label><input type="checkbox" value="${Number(u.id)}" ${selected.has(Number(u.id)) ? 'checked' : ''}> ${esc(u.name)} <small>• ${esc(u.role)}</small></label>`).join('')}</div><div class="v69-modal-actions"><button class="v69-btn" onclick="v69CloseModal()">Cancel</button><button class="v69-btn primary" onclick="v69SaveMembers(${Number(groupId)})">Save</button></div>`); } catch(e) { toast(e.message,'error'); } };
  window.v69SaveMembers = async (groupId) => { const ids = [...document.querySelectorAll('.v69-member-picker input:checked')].map(x => Number(x.value)); try { await chatV9API.updateGroupMembers(groupId, ids); v69CloseModal(); await v69LoadGroup(groupId); } catch(e) { toast(e.message,'error'); } };

  // Dashboard-controller integration names
  window.v9RefreshTeacherChat = window.v69LoadTeacher;
  window.v9LoadStudentThreads = window.v69LoadStudent;
})();
