(function(){
  const build = window.SHULE_BUILD_VERSION || '2038-functional-flow-integrity-lock';
  function apiBase(){
    try { return window.SHULE_API_BASE || window.API_BASE_URL || localStorage.getItem('shule_api_base') || 'https://api.shuleai.live/api'; }
    catch (_) { return 'https://api.shuleai.live/api'; }
  }
  let lastSent = 0;
  function send(payload){
    const now = Date.now();
    if (now - lastSent < 1500) return;
    lastSent = now;
    try {
      const url = apiBase().replace(/\/$/, '') + '/monitoring/frontend-error';
      const body = JSON.stringify({ ...payload, build, url: location.href, userAgent: navigator.userAgent });
      if (navigator.sendBeacon) {
        const blob = new Blob([body], { type: 'application/json' });
        navigator.sendBeacon(url, blob);
        return;
      }
      fetch(url, { method:'POST', headers:{'Content-Type':'application/json'}, body, keepalive:true }).catch(()=>{});
    } catch (_) {}
  }
  window.addEventListener('error', function(event){
    send({ name: event.error?.name || 'WindowError', message: event.message || String(event.error || 'Script error'), stack: event.error?.stack || '', source: event.filename, line: event.lineno, column: event.colno });
  });
  window.addEventListener('unhandledrejection', function(event){
    const reason = event.reason || {};
    send({ name: reason.name || 'UnhandledRejection', message: reason.message || String(reason), stack: reason.stack || '' });
  });
})();
