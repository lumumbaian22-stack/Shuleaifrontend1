(function () {
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>]/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;"}[c]; });
  }

  function ensureDebugBox() {
    var box = document.getElementById('frontend-debug-box');
    if (box) return box;
    box = document.createElement('div');
    box.id = 'frontend-debug-box';
    box.style.cssText = 'position:fixed;right:16px;bottom:16px;z-index:999999;max-width:min(760px,calc(100vw - 32px));max-height:55vh;overflow:auto;background:#111827;color:#f9fafb;border:1px solid rgba(255,255,255,.2);border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,.35);padding:14px;font:13px/1.45 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;white-space:pre-wrap';
    document.body.appendChild(box);
    return box;
  }

  function showFatal(title, detail) {
    try {
      var loading = document.getElementById('loading-overlay');
      if (loading) loading.classList.add('hidden');

      var landing = document.getElementById('landing-page');
      var dashboard = document.getElementById('dashboard-container');
      var content = document.getElementById('dashboard-content');

      if (dashboard) dashboard.style.display = 'block';
      if (landing && (!content || !content.innerHTML.trim())) landing.style.display = 'block';

      if (content && !content.innerHTML.trim()) {
        content.innerHTML =
          '<div class="rounded-xl border bg-card p-6 m-4">' +
          '<h2 class="text-xl font-bold text-red-600 mb-2">Frontend error stopped rendering</h2>' +
          '<p class="text-sm text-muted-foreground mb-4">The app did not white-screen silently. Open DevTools Console for the full stack.</p>' +
          '<pre class="bg-red-50 text-red-700 p-4 rounded-lg overflow-auto text-xs">' + esc(title + "\\n" + detail) + '</pre>' +
          '<div class="flex gap-2 mt-4 flex-wrap">' +
          '<button onclick="localStorage.clear(); location.reload()" class="px-4 py-2 bg-primary text-primary-foreground rounded-lg">Clear session and reload</button>' +
          '<button onclick="document.getElementById(&quot;landing-page&quot;).style.display=&quot;block&quot;; document.getElementById(&quot;dashboard-container&quot;).style.display=&quot;none&quot;;" class="px-4 py-2 border rounded-lg">Back to landing</button>' +
          '</div>' +
          '</div>';
      }

      ensureDebugBox().textContent += '\n\n' + title + '\n' + detail;
    } catch (e) {
      console.error('Boot guard failed while rendering error:', e);
    }
  }

  window.addEventListener('error', function (event) {
    showFatal('Runtime error: ' + event.message, (event.filename || '') + ':' + (event.lineno || '') + ':' + (event.colno || '') + '\n' + (event.error && event.error.stack ? event.error.stack : ''));
  });

  window.addEventListener('unhandledrejection', function (event) {
    var reason = event.reason;
    var detail;
    try { detail = reason && reason.stack ? reason.stack : JSON.stringify(reason, null, 2); }
    catch (_) { detail = String(reason); }
    showFatal('Unhandled promise rejection', detail);
  });

  window.__SHULE_SHOW_FATAL__ = showFatal;
})();