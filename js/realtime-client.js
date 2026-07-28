(function () {
  'use strict';

  let socket = null;
  let recovering = false;
  let reconnectTimer = null;
  let reconnectAttempt = 0;
  const boundEvents = new Set();
  const DIRECT_EVENTS = [
    'chat:message_created', 'chat:message_edited', 'chat:message_deleted',
    'chat:message_delivered', 'chat:message_read', 'chat:message_pinned',
    'chat:message_unpinned', 'private-message', 'new-private-message',
    'new-message', 'new-student-message', 'new-group-message',
    'message:new', 'message:created'
  ];
  const DOMAIN_EVENTS = [
    'alert:created', 'analytics:invalidated', 'attendance:updated',
    'grade:updated', 'report:published', 'payment:updated',
    'timetable:updated', 'duty:updated', 'task:updated'
  ];

  function token() {
    return localStorage.getItem('authToken') || localStorage.getItem('token') || '';
  }

  function currentUser() {
    try { return JSON.parse(localStorage.getItem('user') || '{}') || {}; }
    catch (_) { return {}; }
  }

  function baseUrl() {
    return String(
      localStorage.getItem('SHULE_API_BASE_URL') ||
      window.SHULE_API_BASE_URL ||
      'https://api.shuleai.live'
    ).replace(/\/api\/?$/, '').replace(/\/$/, '');
  }

  function setStatus(value) {
    document.documentElement.dataset.realtime = value;
    window.dispatchEvent(new CustomEvent('shule:realtime-status', {
      detail: { status: value }
    }));
  }

  function stableEventId(type, data) {
    const payload = data || {};
    const identity = payload.eventId || payload.id || payload.messageId ||
      payload.clientMessageId || payload.metadata?.clientMessageId || '';
    const stamp = payload.createdAt || payload.sentAt || payload.timestamp || '';
    return identity
      ? `socket:${type}:${identity}`
      : `socket:${type}:${payload.senderId || payload.from || ''}:${payload.receiverId || payload.to || ''}:${stamp}:${String(payload.content || payload.message || '').slice(0, 64)}`;
  }

  function normalizeEnvelope(type, payload) {
    if (payload?.eventId && payload?.type && payload?.data) return payload;
    const user = currentUser();
    const data = { ...(payload?.data || payload || {}) };
    if (data.from && !data.senderId) data.senderId = data.from;
    if (data.to && !data.receiverId) data.receiverId = data.to;
    if (data.message && !data.content) data.content = data.message;
    if (!data.schoolCode && user.schoolCode) data.schoolCode = user.schoolCode;
    const canonicalType = DIRECT_EVENTS.includes(type) && !type.startsWith('chat:')
      ? 'chat:message_created'
      : type;
    const eventId = stableEventId(canonicalType, data);
    return {
      eventId,
      type: canonicalType,
      schoolCode: data.schoolCode || user.schoolCode || null,
      entity: {
        type: data.threadId ? 'ThreadReply' : (canonicalType.startsWith('chat:') ? 'Message' : 'Event'),
        id: data.id || data.messageId || data.clientMessageId || eventId,
        version: Number(data.version || 1)
      },
      audience: data.audience || { school: false },
      data,
      createdAt: data.createdAt || data.sentAt || data.timestamp || new Date().toISOString()
    };
  }

  function isAuthorizedEnvelope(envelope) {
    const user = currentUser();
    if (!envelope) return false;
    if (envelope.schoolCode && user.schoolCode &&
        String(envelope.schoolCode) !== String(user.schoolCode) &&
        user.role !== 'super_admin') return false;
    const audience = envelope.audience || {};
    if (Array.isArray(audience.userIds) && audience.userIds.length &&
        !audience.userIds.some(id => String(id) === String(user.id))) return false;
    if (Array.isArray(audience.roles) && audience.roles.length &&
        !audience.roles.includes(user.role)) return false;
    return true;
  }

  function route(envelope) {
    if (!isAuthorizedEnvelope(envelope)) return;
    if (window.ShuleRealtimeStore?.accept &&
        !window.ShuleRealtimeStore.accept(envelope)) return;
    window.dispatchEvent(new CustomEvent('shule:realtime-event', { detail: envelope }));
    window.dispatchEvent(new CustomEvent(envelope.type, { detail: envelope.data }));
  }

  async function recover() {
    if (recovering || !token() || typeof window.apiRequest !== 'function') return;
    recovering = true;
    try {
      let after = window.ShuleRealtimeStore?.lastEventId?.() || 0;
      let loops = 0;
      do {
        const response = await window.apiRequest(`/api/realtime/sync?after=${encodeURIComponent(after)}&limit=200`);
        const events = response?.data?.events || response?.events || response?.data || [];
        if (!Array.isArray(events) || !events.length) break;
        for (const event of events) {
          route(normalizeEnvelope(event.type || 'realtime:event', event));
          after = event.eventId || event.id || after;
        }
        loops += 1;
        if (events.length < 200) break;
      } while (loops < 10 && token());
    } catch (error) {
      console.warn('Realtime recovery failed:', error?.message || error);
    } finally {
      recovering = false;
    }
  }

  function clearBindings() {
    if (!socket) return;
    for (const eventName of boundEvents) socket.off(eventName);
    boundEvents.clear();
  }

  function bind(eventName) {
    if (!socket || boundEvents.has(eventName)) return;
    socket.on(eventName, payload => route(normalizeEnvelope(eventName, payload)));
    boundEvents.add(eventName);
  }

  function scheduleReconnect() {
    if (!token() || reconnectTimer) return;
    const delay = Math.min(30000, 1000 * (2 ** Math.min(reconnectAttempt, 5)));
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      reconnectAttempt += 1;
      connect();
    }, delay);
  }

  function connect() {
    if (!token() || typeof window.io !== 'function') {
      setStatus(token() ? 'unavailable' : 'signed-out');
      return null;
    }
    if (socket?.connected) return socket;
    if (socket) {
      clearBindings();
      socket.disconnect();
      socket = null;
    }
    setStatus('connecting');
    socket = window.io(baseUrl(), {
      auth: { token: token() },
      transports: ['websocket', 'polling'],
      reconnection: false,
      timeout: 15000
    });
    socket.on('connect', () => {
      reconnectAttempt = 0;
      setStatus('connected');
      recover();
    });
    socket.on('disconnect', reason => {
      setStatus('disconnected');
      if (reason !== 'io client disconnect') scheduleReconnect();
    });
    socket.on('connect_error', error => {
      setStatus('error');
      console.warn('Realtime connection failed:', error?.message || error);
      scheduleReconnect();
    });
    [...DIRECT_EVENTS, ...DOMAIN_EVENTS, 'realtime:event'].forEach(bind);
    return socket;
  }

  function disconnect() {
    if (reconnectTimer) clearTimeout(reconnectTimer);
    reconnectTimer = null;
    reconnectAttempt = 0;
    recovering = false;
    if (socket) {
      clearBindings();
      socket.disconnect();
      socket = null;
    }
    setStatus('signed-out');
  }

  window.ShuleRealtime = Object.freeze({
    connect,
    disconnect,
    recover,
    isConnected: () => Boolean(socket?.connected)
  });
})();
