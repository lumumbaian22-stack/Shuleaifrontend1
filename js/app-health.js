(function(){
  window.addEventListener('error', function(e){ console.error('Runtime error:', e.message, e.error || ''); });
  window.addEventListener('unhandledrejection', function(e){ console.error('Unhandled promise rejection:', e.reason); });
  window.addEventListener('load', function(){ setTimeout(function(){ var overlay=document.getElementById('loading-overlay'); if(overlay) overlay.classList.add('hidden'); }, 1800); });
})();
