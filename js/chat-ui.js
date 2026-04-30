(function () {
  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function media(url) {
    if (window.resolveMediaUrl) return window.resolveMediaUrl(url || '');
    return url || '';
  }
  function initials(name) {
    return String(name || 'U').split(/\s+/).filter(Boolean).slice(0,2).map(x => x[0]).join('').toUpperCase() || 'U';
  }
  function avatar(user, size = 'md') {
    const img = media(user?.profileImage || user?.profilePicture || user?.photo || user?.avatar);
    const name = user?.name || user?.fullName || user?.email || 'User';
    const cls = size === 'sm' ? 'chat-avatar sm' : 'chat-avatar';
    return `
      <div class="${cls}">
        ${img ? `<img src="${esc(img)}" alt="${esc(name)}" onerror="this.style.display='none'; this.parentElement.classList.add('fallback');" />` : ''}
        <span>${esc(initials(name))}</span>
      </div>
    `;
  }
  function userRow(user, onclick = '') {
    const name = user?.name || user?.fullName || user?.email || 'Unknown user';
    const role = user?.role || user?.grade || user?.email || '';
    return `
      <button class="chat-user-row" ${onclick ? `onclick="${onclick}"` : ''}>
        ${avatar(user)}
        <span class="chat-user-meta">
          <strong>${esc(name)}</strong>
          <small>${esc(role)}</small>
        </span>
      </button>
    `;
  }
  function messageBubble(message, currentUserId) {
    const sender = message.sender || message.Sender || message.User || {};
    const mine = String(message.senderId || sender.id) === String(currentUserId);
    const text = message.message || message.content || message.text || '';
    const time = message.createdAt ? new Date(message.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '';
    return `
      <div class="chat-message ${mine ? 'mine' : 'theirs'}">
        ${mine ? '' : avatar(sender, 'sm')}
        <div class="chat-bubble">
          ${mine ? '' : `<div class="chat-name">${esc(sender.name || 'User')}</div>`}
          <div>${esc(text)}</div>
          <div class="chat-time">${esc(time)}</div>
        </div>
      </div>
    `;
  }
  function shell({ title, subtitle, membersHtml, messagesHtml, inputId, sendFnName }) {
    return `
      <div class="wa-chat-shell">
        <aside class="wa-chat-list">
          <div class="wa-chat-header">
            <h3>${esc(title)}</h3>
            <p>${esc(subtitle || '')}</p>
          </div>
          <div class="wa-chat-users">${membersHtml || ''}</div>
        </aside>
        <section class="wa-chat-main">
          <div class="wa-chat-thread" id="chat-thread">${messagesHtml || '<div class="chat-empty">No messages yet. Start the conversation.</div>'}</div>
          <div class="wa-chat-input">
            <input id="${esc(inputId)}" placeholder="Type a message..." onkeydown="if(event.key==='Enter'){window.${sendFnName}()}" />
            <button onclick="window.${sendFnName}()">Send</button>
          </div>
        </section>
      </div>
    `;
  }
  window.ShuleChatUI = { avatar, userRow, messageBubble, shell, esc, media };
})();