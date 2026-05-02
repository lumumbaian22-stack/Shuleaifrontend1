// V9.7 modal close + stability layer
(function(){
  function removeModal(el){
    if (!el) return;
    if (el.id === 'auth-modal') {
      el.classList.add('hidden');
      return;
    }
    el.remove();
  }

  window.closeAllShuleModals = function(){
    document.querySelectorAll('.v95-overlay, .v94-modal-backdrop, #marks-entry-modal, #v96-student-view, #v96-student-edit, #v95-student-view, #v95-student-edit, #v95-teacher-view, #v95-teacher-edit, #v95-create-alert, #v94-student-view, #v94-student-edit, #v94-teacher-details, #v94-teacher-edit, #v94-create-alert').forEach(removeModal);
  };

  document.addEventListener('click', function(e){
    const overlay = e.target.closest('.v95-overlay, .v94-modal-backdrop');
    if (overlay && e.target === overlay) {
      overlay.remove();
      return;
    }

    const marksOverlay = e.target.closest('#marks-entry-modal');
    if (marksOverlay && e.target === marksOverlay.firstElementChild) {
      if (typeof closeMarksEntryModal === 'function') closeMarksEntryModal();
      else marksOverlay.remove();
    }
  }, true);

  document.addEventListener('keydown', function(e){
    if (e.key !== 'Escape') return;
    const top = Array.from(document.querySelectorAll('.v95-overlay, .v94-modal-backdrop, #marks-entry-modal')).pop();
    if (top) {
      if (top.id === 'marks-entry-modal' && typeof closeMarksEntryModal === 'function') closeMarksEntryModal();
      else top.remove();
    }
  });

  // Fix old hidden modals that get reopened without being removed.
  const originalShowToast = window.showToast;
  window.ensureNoDuplicateShuleModal = function(id){
    const matches = document.querySelectorAll(`#${id}`);
    matches.forEach((m, idx) => { if (idx < matches.length - 1) m.remove(); });
  };

  // Keep marks section teacher-only even if an old route is called.
  window.v97BlockAdminMarks = function(){
    const user = typeof getCurrentUser === 'function' ? getCurrentUser() : {};
    if (user?.role !== 'teacher') {
      if (typeof showToast === 'function') showToast('Marks entry belongs in Teacher → Grades. Admin reviews/publishes reports through academic workflows, not direct entry.', 'warning');
      return true;
    }
    return false;
  };
})();
