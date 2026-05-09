
(function () {
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
})();
