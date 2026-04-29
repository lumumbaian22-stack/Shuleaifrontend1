(function () {
  function isVisible(el) {
    if (!el) return false;
    var style = window.getComputedStyle(el);
    return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
  }

  function showRecovery(message) {
    var loading = document.getElementById('loading-overlay');
    if (loading) loading.classList.add('hidden');

    var landing = document.getElementById('landing-page');
    var dashboard = document.getElementById('dashboard-container');
    var content = document.getElementById('dashboard-content');

    if (dashboard && isVisible(dashboard) && content && !content.innerHTML.trim()) {
      content.innerHTML =
        '<div class="rounded-xl border bg-card p-6 m-4">' +
        '<h2 class="text-xl font-bold mb-2">Dashboard did not render</h2>' +
        '<p class="text-sm text-muted-foreground mb-4">' + message + '</p>' +
        '<div class="flex gap-2 flex-wrap">' +
        '<button onclick="localStorage.clear(); location.reload()" class="px-4 py-2 bg-primary text-primary-foreground rounded-lg">Clear session and reload</button>' +
        '<button onclick="document.getElementById(&quot;landing-page&quot;).style.display=&quot;block&quot;; document.getElementById(&quot;dashboard-container&quot;).style.display=&quot;none&quot;;" class="px-4 py-2 border rounded-lg">Back to landing</button>' +
        '</div>' +
        '</div>';
    }

    if ((!dashboard || !isVisible(dashboard)) && landing) {
      landing.style.display = 'block';
    }
  }

  window.addEventListener('load', function () {
    setTimeout(function () {
      showRecovery('The dashboard container was visible but empty. This usually means auth/API data failed or a dashboard renderer crashed.');
    }, 2500);
  });
})();