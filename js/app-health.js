(function(){
  window.addEventListener('error', function(e){ console.error('Runtime error:', e.message, e.error || ''); });
  window.addEventListener('unhandledrejection', function (event) { console.warn('Unhandled promise rejection:', event.reason); });
  window.addEventListener('load', function(){
    setTimeout(function(){
      var overlay=document.getElementById('loading-overlay');
      var dashboard=document.getElementById('dashboard-container');
      var landing=document.getElementById('landing-page');
      var hasToken=!!localStorage.getItem('authToken');
      var dashboardVisible=dashboard && dashboard.style.display !== 'none' && !dashboard.classList.contains('hidden');
      var landingVisible=landing && landing.style.display !== 'none' && !landing.classList.contains('hidden');
      // Do not cut off an authenticated dashboard fetch. Hide only when the app shell is visibly ready.
      if(overlay && (!hasToken || dashboardVisible || landingVisible)) overlay.classList.add('hidden');
    }, 1800);
  });
})();
