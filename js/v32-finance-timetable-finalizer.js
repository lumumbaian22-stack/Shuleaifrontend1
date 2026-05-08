(function(){
  const w=window;
  function removeLegacyFeeModals(){
    document.querySelectorAll('.v30-modal-shell,.v30-modal-backdrop').forEach(el=>el.remove());
    document.querySelectorAll('body > div').forEach(el=>{
      const txt=(el.innerText||'').trim();
      if(txt.includes('Fee setup') && txt.includes('Save Fee Structure') && txt.includes('Calculated total')) el.remove();
    });
  }
  function disableLegacyFeeRenderer(){
    w.v28OpenFeeStructureForm=function(){
      removeLegacyFeeModals();
      if(typeof w.financeV31OpenStructureModal==='function') return w.financeV31OpenStructureModal();
      if(typeof w.showDashboardSection==='function') return w.showDashboardSection('finance-fees');
    };
    w.v28SaveFeeStructure=function(){
      const msg='Legacy fee modal is disabled. Use Finance & Fees.';
      const box=document.getElementById('finance-v31-modal-message');
      if(box) box.textContent=msg; else console.warn(msg);
    };
    w.renderAdminFeeStructures=function(){
      if(typeof w.v31RenderFinanceFees==='function') return w.v31RenderFinanceFees();
      return '<section class="finance-v31"><div class="finance-v31-empty">Finance & Fees module is loading. Refresh if it does not appear.</div></section>';
    };
  }
  const observer=new MutationObserver(removeLegacyFeeModals);
  function start(){
    disableLegacyFeeRenderer();
    removeLegacyFeeModals();
    observer.observe(document.body,{childList:true,subtree:false});
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start); else start();
})();
