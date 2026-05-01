let v9ChatState = {
  mode: 'direct',
  teachers: [],
  groups: [],
  selectedTeacher: null,
  selectedGroup: null,
  messages: []
};

function v9Initials(name) {
  return (name || 'U').split(' ').map(x => x[0]).join('').slice(0,2).toUpperCase();
}

function v9Time(value) {
  if (!value) return '';
  try { return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); } catch { return ''; }
}

async function renderTeacherV9Messages() {
  return `
    <div class="space-y-6 animate-fade-in">
      <div class="rounded-xl border bg-card p-6 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-gray-800 dark:to-gray-700">
        <div class="flex flex-col md:flex-row justify-between gap-4 md:items-center">
          <div>
            <h2 class="text-2xl font-bold">Teacher Communication Center</h2>
            <p class="text-muted-foreground">Direct teacher chats, staff groups, department groups, and teacher-awarded student points.</p>
          </div>
          <div class="flex gap-2 flex-wrap">
            <button onclick="v9CreateDemoGroup()" class="px-4 py-2 bg-primary text-white rounded-lg">+ New Group</button>
            <button onclick="v9RefreshTeacherChat()" class="px-4 py-2 border rounded-lg">Refresh</button>
          </div>
        </div>
      </div>
      <div id="v9-teacher-chat-root" class="v9-chat-shell">
        <div class="v9-empty">Loading teacher chats...</div>
      </div>
    </div>
  `;
}

async function v9RefreshTeacherChat() {
  const root = document.getElementById('v9-teacher-chat-root');
  if (!root) return;
  root.innerHTML = '<div class="v9-empty">Loading teacher chats...</div>';
  try {
    const [teachersRes, groupsRes] = await Promise.all([
      chatV9API.getTeachers(),
      chatV9API.getTeacherGroups()
    ]);
    v9ChatState.teachers = (teachersRes.data || []).filter(t => t.id !== getCurrentUser()?.id);
    v9ChatState.groups = groupsRes.data || [];
    if (!v9ChatState.selectedTeacher && v9ChatState.teachers[0]) v9ChatState.selectedTeacher = v9ChatState.teachers[0];
    if (!v9ChatState.selectedGroup && v9ChatState.groups[0]) v9ChatState.selectedGroup = v9ChatState.groups[0];
    await v9LoadCurrentMessages();
  } catch (err) {
    console.error('Teacher chat load failed:', err);
    root.innerHTML = `<div class="v9-empty text-red-500">Could not load chats: ${escapeHtml(err.message)}</div>`;
  }
}

async function v9LoadCurrentMessages() {
  try {
    let res;
    if (v9ChatState.mode === 'direct' && v9ChatState.selectedTeacher) {
      res = await chatV9API.getDirectMessages(v9ChatState.selectedTeacher.id);
    } else if (v9ChatState.mode === 'group' && v9ChatState.selectedGroup) {
      res = await chatV9API.getGroupMessages(v9ChatState.selectedGroup.id);
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
  const currentUser = getCurrentUser();
  const selected = v9ChatState.mode === 'direct' ? v9ChatState.selectedTeacher : v9ChatState.selectedGroup;

  root.innerHTML = `
    <aside class="v9-chat-list">
      <input class="v9-chat-search" placeholder="Search conversations..." oninput="v9FilterConversations(this.value)">
      <div class="v9-tabs">
        <button class="${v9ChatState.mode === 'direct' ? 'active' : ''}" onclick="v9SetChatMode('direct')">Direct</button>
        <button class="${v9ChatState.mode === 'group' ? 'active' : ''}" onclick="v9SetChatMode('group')">Groups</button>
      </div>
      <div id="v9-conversation-list">
        ${v9RenderConversationList()}
      </div>
    </aside>

    <section class="v9-chat-main">
      <header class="v9-chat-header">
        <div class="flex items-center gap-3">
          <div class="v9-avatar">${v9Initials(selected?.name || selected?.name || selected?.schoolCode || 'Chat')}</div>
          <div>
            <h3 class="font-bold text-lg">${escapeHtml(selected?.name || 'Select conversation')}</h3>
            <small>${v9ChatState.mode === 'direct' ? 'Teacher direct chat' : `${selected?.type || 'group'} group`}</small>
          </div>
        </div>
        <div class="v9-chat-actions">
          <button class="v9-icon-btn" title="Search">⌕</button>
          <button class="v9-icon-btn" title="Attach">📎</button>
          <button class="v9-icon-btn" title="Info">ⓘ</button>
        </div>
      </header>

      <main class="v9-messages" id="v9-message-list">
        ${v9RenderMessages(currentUser)}
      </main>

      <footer class="v9-composer">
        <input id="v9-message-input" placeholder="Type a message..." onkeydown="if(event.key==='Enter')v9SendMessage()">
        <button class="v9-send" onclick="v9SendMessage()">➤</button>
      </footer>
    </section>

    <aside class="v9-chat-info">
      ${v9RenderInfoPanel()}
    </aside>
  `;
  const msgList = document.getElementById('v9-message-list');
  if (msgList) msgList.scrollTop = msgList.scrollHeight;
}

function v9RenderConversationList() {
  if (v9ChatState.mode === 'direct') {
    if (!v9ChatState.teachers.length) return '<div class="v9-empty">No teachers found yet.</div>';
    return v9ChatState.teachers.map(t => `
      <div class="v9-conversation ${v9ChatState.selectedTeacher?.id === t.id ? 'active' : ''}" onclick="v9SelectTeacher(${t.id})">
        <div class="v9-avatar">${v9Initials(t.name)}</div>
        <div class="min-w-0">
          <div class="font-bold truncate">${escapeHtml(t.name)}</div>
          <small>${escapeHtml(t.email || 'Teacher')}</small>
        </div>
      </div>
    `).join('');
  }
  if (!v9ChatState.groups.length) return '<div class="v9-empty">No groups yet. Staff Room is created automatically.</div>';
  return v9ChatState.groups.map(g => `
    <div class="v9-conversation ${v9ChatState.selectedGroup?.id === g.id ? 'active' : ''}" onclick="v9SelectGroup(${g.id})">
      <div class="v9-avatar">${g.type === 'department' ? '🏫' : g.type === 'staff' ? '👥' : '💬'}</div>
      <div class="min-w-0">
        <div class="font-bold truncate">${escapeHtml(g.name)}</div>
        <small>${g.type === 'department' ? `🏫 Department${g.headName ? ' • Head: ' + escapeHtml(g.headName) : ''}` : escapeHtml(g.type || 'group')}</small>
      </div>
    </div>
  `).join('');
}

function v9RenderMessages(currentUser) {
  if (!v9ChatState.messages.length) return '<div class="v9-empty">No messages yet. Start the conversation.</div>';
  return v9ChatState.messages.map(m => {
    const mine = m.senderId === currentUser?.id;
    const sender = m.Sender || {};
    return `
      <div class="v9-msg ${mine ? 'mine' : ''}">
        <div class="v9-avatar">${v9Initials(sender.name || 'U')}</div>
        <div>
          <div class="v9-bubble">
            ${!mine ? `<div class="font-bold text-xs mb-1">${escapeHtml(sender.name || 'Teacher')}</div>` : ''}
            <div>${escapeHtml(m.content)}</div>
            ${m.attachmentUrl ? `<div class="mt-2"><a href="${escapeHtml(m.attachmentUrl)}" target="_blank">📎 Attachment</a></div>` : ''}
            <div class="meta">
              <span>${v9Time(m.createdAt)}</span>
              ${m.pointsAwarded ? `<span class="v9-award-pill">⭐ +${m.pointsAwarded}</span>` : ''}
              ${m.streakAwarded ? `<span class="v9-award-pill">🔥 +${m.streakAwarded}</span>` : ''}
            </div>
          </div>
          ${!mine ? `
            <div class="v9-award-menu">
              <button onclick="v9AwardMessage(${m.id}, 1, 0)">⭐ +1</button>
              <button onclick="v9AwardMessage(${m.id}, 3, 0)">⭐ +3</button>
              <button onclick="v9AwardMessage(${m.id}, 5, 1)">⭐ +5 🔥</button>
            </div>` : ''}
        </div>
      </div>
    `;
  }).join('');
}

function v9RenderInfoPanel() {
  const selected = v9ChatState.mode === 'direct' ? v9ChatState.selectedTeacher : v9ChatState.selectedGroup;
  return `
    <div class="v9-info-card text-center">
      <div class="v9-avatar mx-auto mb-3">${v9Initials(selected?.name || 'Chat')}</div>
      <h3 class="font-bold">${escapeHtml(selected?.name || 'Conversation')}</h3>
      <small>${v9ChatState.mode === 'direct' ? 'Personal teacher chat' : (selected?.type === 'department' ? 'Department group chat' : 'Group chat')}</small>
      ${selected?.type === 'department' ? `<div class="mt-3 p-3 rounded-lg bg-muted/40 text-sm"><strong>Department Head</strong><br><span class="text-muted-foreground">${escapeHtml(selected.headName || 'Not assigned')}</span></div>` : ''}
    </div>
    <div class="v9-info-card">
      <h4 class="font-bold mb-2">Features</h4>
      <div class="space-y-2 text-sm text-muted-foreground">
        <div>📎 Files and resources</div>
        <div>⭐ Give stars/points</div>
        <div>🔥 Award streaks</div>
        <div>🔎 Search messages</div>
      </div>
    </div>
    <div class="v9-info-card">
      <h4 class="font-bold mb-2">How groups work</h4>
      <small>Staff Room is automatic. Department groups are created when admin creates departments. Teachers can create project/committee groups.</small>
    </div>
  `;
}

function v9SetChatMode(mode) {
  v9ChatState.mode = mode;
  v9LoadCurrentMessages();
}
function v9SelectTeacher(id) {
  v9ChatState.selectedTeacher = v9ChatState.teachers.find(t => t.id === id);
  v9ChatState.mode = 'direct';
  v9LoadCurrentMessages();
}
function v9SelectGroup(id) {
  v9ChatState.selectedGroup = v9ChatState.groups.find(g => g.id === id);
  v9ChatState.mode = 'group';
  v9LoadCurrentMessages();
}
function v9FilterConversations(value) {
  // Lightweight client-side visual filter
  const q = (value || '').toLowerCase();
  document.querySelectorAll('#v9-conversation-list .v9-conversation').forEach(el => {
    el.style.display = el.textContent.toLowerCase().includes(q) ? '' : 'none';
  });
}
async function v9SendMessage() {
  const input = document.getElementById('v9-message-input');
  const content = input?.value?.trim();
  if (!content) return;
  try {
    if (v9ChatState.mode === 'direct' && v9ChatState.selectedTeacher) {
      await chatV9API.sendDirectMessage(v9ChatState.selectedTeacher.id, content);
    } else if (v9ChatState.mode === 'group' && v9ChatState.selectedGroup) {
      await chatV9API.sendGroupMessage(v9ChatState.selectedGroup.id, content);
    }
    input.value = '';
    await v9LoadCurrentMessages();
  } catch (err) {
    showToast(err.message || 'Message failed', 'error');
  }
}
async function v9AwardMessage(messageId, points, streakDelta) {
  try {
    await chatV9API.awardChatMessage(messageId, points, streakDelta, 'Great contribution');
    showToast(`Awarded ⭐ ${points}${streakDelta ? ` and 🔥 ${streakDelta}` : ''}`, 'success');
    await v9LoadCurrentMessages();
  } catch (err) {
    showToast(err.message || 'Award failed', 'error');
  }
}
async function v9CreateDemoGroup() {
  const name = prompt('Group name e.g. Exams Committee, CBC Team, Sports Committee');
  if (!name) return;
  try {
    await chatV9API.createTeacherGroup({ name, type: 'project', memberUserIds: [] });
    showToast('Group created', 'success');
    await v9RefreshTeacherChat();
  } catch (err) {
    showToast(err.message || 'Group creation failed', 'error');
  }
}

// Student classroom threads
async function renderStudentV9Classroom() {
  return `
    <div class="space-y-6 animate-fade-in">
      <div class="student-xp-hero">
        <div class="flex items-center gap-4">
          <div class="student-xp-avatar">${v9Initials(getCurrentUser()?.name || 'Student')}</div>
          <div>
            <p class="text-white/70 text-sm font-semibold">Classroom Threads</p>
            <h2 class="text-3xl font-black tracking-tight m-0">Structured Study Discussions</h2>
            <p class="text-white/75 text-sm mt-1">Ask questions, reply to teacher topics, earn stars, streaks and badges.</p>
          </div>
        </div>
        <div class="student-xp-bar">
          <div class="flex justify-between gap-3 text-sm">
            <span class="text-white/75 font-semibold">Achievement Progress</span>
            <strong id="v9-achievement-total">Loading...</strong>
          </div>
          <div class="student-xp-bar-track"><span style="width:72%"></span></div>
        </div>
      </div>

      <div class="v9-thread-layout">
        <main class="v9-thread-panel" id="v9-thread-root">
          <div class="v9-empty">Loading classroom threads...</div>
        </main>
        <aside class="v9-achieve-panel" id="v9-achievement-root">
          <div class="v9-empty">Loading achievements...</div>
        </aside>
      </div>
    </div>
  `;
}

async function v9LoadStudentThreads() {
  const root = document.getElementById('v9-thread-root');
  const achieve = document.getElementById('v9-achievement-root');
  if (!root) return;
  try {
    const [threadsRes, achievementsRes] = await Promise.all([
      chatV9API.getClassroomThreads(),
      chatV9API.getMyAchievements()
    ]);
    const threads = threadsRes.data || [];
    const achievementData = achievementsRes.data || { totals: { points: 0, streak: 0 }, events: [] };
    root.innerHTML = v9RenderThreads(threads);
    if (achieve) achieve.innerHTML = v9RenderAchievements(achievementData);
    const totalEl = document.getElementById('v9-achievement-total');
    if (totalEl) totalEl.textContent = `⭐ ${achievementData.totals?.points || 0} pts • 🔥 ${achievementData.totals?.streak || 0}`;
  } catch (err) {
    console.error('Student threads failed:', err);
    root.innerHTML = `<div class="v9-empty text-red-500">Could not load classroom threads: ${escapeHtml(err.message)}</div>`;
  }
}

function v9RenderThreads(threads) {
  if (!threads.length) {
    return `
      <div class="v9-empty">
        <h3 class="font-bold text-lg mb-2">No classroom threads yet</h3>
        <p>Your teacher will post structured study questions here.</p>
      </div>
    `;
  }
  return threads.map(t => `
    <article class="v9-thread-card">
      <div class="v9-thread-top">
        <div>
          <span class="v9-subject-pill">${escapeHtml(t.subject || 'Subject')}</span>
          <h3 class="text-xl font-bold mt-3">${escapeHtml(t.topic || 'Classroom Topic')}</h3>
          <p class="text-muted-foreground">${escapeHtml(t.content || '')}</p>
        </div>
        ${t.isPinned ? '<span class="v9-award-pill">📌 Pinned</span>' : ''}
      </div>

      <div class="mt-4">
        ${(t.ThreadReplies || []).map(r => v9RenderReply(r)).join('')}
      </div>

      <div class="v9-reply-form">
        <input id="v9-reply-input-${t.id}" placeholder="Write your reply or question..." onkeydown="if(event.key==='Enter')v9ReplyToThread(${t.id})">
        <button class="v9-send" onclick="v9ReplyToThread(${t.id})">➤</button>
      </div>
    </article>
  `).join('');
}

function v9RenderReply(r) {
  const author = r.Author || {};
  const isTeacher = author.role === 'teacher';
  return `
    <div class="v9-reply ${isTeacher ? 'teacher' : ''}">
      <div class="v9-reply-head">
        <div class="flex items-center gap-2">
          <div class="v9-avatar" style="width:34px;height:34px;border-radius:12px">${v9Initials(author.name || 'U')}</div>
          <div>
            <strong>${escapeHtml(author.name || 'User')}</strong>
            ${isTeacher ? '<span class="ml-2 v9-subject-pill">Teacher</span>' : ''}
          </div>
        </div>
        <small class="text-muted-foreground">${v9Time(r.createdAt)}</small>
      </div>
      <p>${escapeHtml(r.content)}</p>
      <div class="flex gap-2 flex-wrap mt-2">
        ${r.pointsAwarded ? `<span class="v9-award-pill">⭐ +${r.pointsAwarded}</span>` : ''}
        ${r.streakAwarded ? `<span class="v9-award-pill">🔥 +${r.streakAwarded}</span>` : ''}
        <span class="v9-award-pill">👍 ${r.helpfulCount || 0}</span>
      </div>
    </div>
  `;
}

async function v9ReplyToThread(threadId) {
  const input = document.getElementById(`v9-reply-input-${threadId}`);
  const content = input?.value?.trim();
  if (!content) return;
  try {
    await chatV9API.replyToThread(threadId, content);
    input.value = '';
    showToast('Reply posted', 'success');
    await v9LoadStudentThreads();
  } catch (err) {
    showToast(err.message || 'Reply failed', 'error');
  }
}

function v9RenderAchievements(data) {
  const totals = data.totals || { points: 0, streak: 0 };
  const events = data.events || [];
  return `
    <h3 class="font-bold text-xl">Achievements</h3>
    <p class="text-muted-foreground text-sm">Stars and streaks awarded by teachers.</p>
    <div class="v9-achievement-stat">
      <div><span class="text-muted-foreground text-sm">Points</span><strong>⭐ ${totals.points || 0}</strong></div>
      <div><span class="text-muted-foreground text-sm">Streak</span><strong>🔥 ${totals.streak || 0}</strong></div>
    </div>
    <div class="space-y-3">
      ${events.length ? events.slice(0,8).map(e => `
        <div class="v9-info-card">
          <div class="flex justify-between gap-2">
            <strong>${escapeHtml(e.title || 'Achievement')}</strong>
            <span class="v9-award-pill">+${e.points || 0} pts</span>
          </div>
          <small>${escapeHtml(e.note || 'Teacher awarded achievement')}</small>
        </div>
      `).join('') : '<div class="v9-empty">No achievements yet. Participate in threads to earn stars.</div>'}
    </div>
  `;
}

window.renderTeacherV9Messages = renderTeacherV9Messages;
window.v9RefreshTeacherChat = v9RefreshTeacherChat;
window.renderStudentV9Classroom = renderStudentV9Classroom;
window.v9LoadStudentThreads = v9LoadStudentThreads;
