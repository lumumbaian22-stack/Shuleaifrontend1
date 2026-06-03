
// Shule AI v122: final pilot/demo/free full-access fix. Loaded last.
(function(){
  'use strict';
  if (window.__v122PilotFullAccessFixLoaded) return;
  window.__v122PilotFullAccessFixLoaded = true;

  const ALL_FEATURES = ['*','dashboard','teachers','teacher_approvals','students','analytics','alerts','finance_fees','parent_messages','school_settings','billing','classes','report_cards','calendar','school_branding','timetable','homework','duty','fairness_report','departments','bulk_sms','senior_subject_choice','advanced_report_cards','ai_tutor','ai_tutor_limited','ai_tutor_extended','live_child_analytics','advanced_alerts','child_recommendations'];
  const SECTION_FEATURE = { homework:'homework','my-homework':'homework',calendar:'calendar',timetable:'timetable','my-timetable':'timetable','school-branding':'school_branding',branding:'school_branding',duty:'duty',departments:'departments',sms:'bulk_sms','bulk-sms':'bulk_sms','fairness-report':'fairness_report','subject-choice':'senior_subject_choice','student-subject-selection':'senior_subject_choice','subject-selection':'senior_subject_choice' };
  function role(){ try{ return String((typeof getCurrentRole==='function'?getCurrentRole():localStorage.getItem('userRole')||JSON.parse(localStorage.getItem('user')||'{}').role||'')).toLowerCase().replace('-','_'); }catch{ return ''; } }
  function looksFullAccess(data){ const d=data||window.ShulePlanState||{}; const text=[d.accessMode,d.status,d.planCode,d.currentPlan,d.schoolTier,d.plan,d.subscription?.planCode,d.subscription?.status].filter(Boolean).join(' ').toLowerCase(); return d.fullAccess===true || d.override===true || d.pilotFullAccessEnabled===true || d.demoMode===true || d.freeFullAccess===true || /pilot[_\s-]*full|full[_\s-]*pilot|demo[_\s-]*full|free[_\s-]*full|full[_\s-]*access/.test(text); }
  function applyFullAccessState(extra){
    window.ShulePlanState = { ...(window.ShulePlanState||{}), ...(extra||{}), fullAccess:true, override:true, accessMode:(extra&&extra.accessMode)||'pilot_full_access', planCode:'enterprise', currentPlan:'Enterprise / Full Access', schoolTier:'Enterprise / Full Access', status:'active', gracefulMode:false, features:[...ALL_FEATURES], featureList:[...ALL_FEATURES] };
    try { localStorage.setItem('schoolPlan','enterprise'); localStorage.setItem('shule_full_access_override','true'); } catch(_) {}
    document.documentElement.setAttribute('data-shule-full-access','true');
  }
  async function refreshFullAccessState(){
    if (!localStorage.getItem('token')) return false;
    try{
      const res = await (window.apiRequest ? window.apiRequest('/api/subscriptions/my-status') : fetch('/api/subscriptions/my-status').then(r=>r.json()));
      const data = res && (res.data || res);
      if (looksFullAccess(data)) { applyFullAccessState(data); return true; }
    }catch(e){ console.warn('[v122] full-access status check skipped:', e.message); }
    if (localStorage.getItem('shule_full_access_override') === 'true' && looksFullAccess(window.ShulePlanState)) { applyFullAccessState(window.ShulePlanState); return true; }
    return false;
  }
  function hasFeature(feature){ if(!feature) return true; if(role()==='super_admin'||role()==='superadmin') return true; const st=window.ShulePlanState||{}; if(looksFullAccess(st)) return true; const list=Array.isArray(st.features)?st.features:[]; return list.includes('*') || list.includes(feature); }
  function restoreAllSections(){
    if(!looksFullAccess(window.ShulePlanState)) return;
    document.querySelectorAll('[data-feature-hidden="true"],[data-shule-pruned="true"]').forEach(el=>{ el.hidden=false; el.style.display=''; el.removeAttribute('data-feature-hidden'); el.removeAttribute('data-shule-pruned'); });
    document.querySelectorAll('[data-section], [onclick*="showDashboardSection"]').forEach(el=>{ el.hidden=false; el.style.display=''; });
  }
  const oldShow = window.showDashboardSection;
  window.showDashboardSection = async function(section){
    if(section && looksFullAccess(window.ShulePlanState)) { restoreAllSections(); return oldShow ? oldShow.apply(this, arguments) : null; }
    const f = SECTION_FEATURE[section];
    if(section && f && !hasFeature(f)) return oldShow ? oldShow.call(this,'dashboard') : null;
    return oldShow ? oldShow.apply(this, arguments) : null;
  };
  const oldRender = window.renderDashboardSection;
  if(oldRender){
    window.renderDashboardSection = async function(r, section){
      if(looksFullAccess(window.ShulePlanState)) return oldRender.apply(this, arguments);
      return oldRender.apply(this, arguments);
    };
  }
  document.addEventListener('DOMContentLoaded', async ()=>{
    const ok = await refreshFullAccessState();
    if(ok){
      restoreAllSections();
      setTimeout(()=>{ try{ if(typeof updateSidebar==='function') updateSidebar(role()); restoreAllSections(); }catch(_){} }, 100);
      setTimeout(restoreAllSections, 1000);
    }
  });
  setTimeout(async()=>{ if(await refreshFullAccessState()) restoreAllSections(); }, 300);
  setInterval(()=>{ if(looksFullAccess(window.ShulePlanState)) restoreAllSections(); }, 2500);
})();
