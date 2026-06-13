(function () {
  'use strict';

  const REQUIRED_WINDOW_FUNCTIONS = [
    'listAllTeachersAndClasses',
    'updateGradeDisplayForStudent',
    'addBlackoutDate',
    'saveDutyPreferences',
    'sendStudentMessage',
    'addCustomSubject',
    'removeCustomSubject',
    'printReportCard',
    'loadNotifications'
  ];

  window.testStudentAuthForm = function () {
    if (typeof openAuthModal !== 'function') {
      console.error('openAuthModal is not loaded');
      return false;
    }
    openAuthModal('student', 'signin');
    const hasElimuid = !!document.getElementById('auth-elimuid');
    const hasPassword = !!document.getElementById('auth-password');
    console.log('Student auth form test:', { hasElimuid, hasPassword });
    return hasElimuid && hasPassword;
  };

  window.runShuleRuntimeSelfTest = function () {
    const missing = REQUIRED_WINDOW_FUNCTIONS.filter(name => typeof window[name] !== 'function');
    window.__shuleRuntimeSelfTest = { ok: missing.length === 0, missing, checkedAt: new Date().toISOString() };
    if (missing.length) console.error('[ShuleAI Runtime Self-Test] Missing functions:', missing.join(', '));
    else console.log('[ShuleAI Runtime Self-Test] Required runtime functions loaded.');
    return window.__shuleRuntimeSelfTest;
  };

  window.addEventListener('load', function () {
    setTimeout(window.runShuleRuntimeSelfTest, 250);
  });
})();
