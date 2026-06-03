// Shule AI v118 final locks + isolation + curriculum/report logic.
(function(){
  'use strict';
  if (window.__v118FinalLocksLoaded) return;
  window.__v118FinalLocksLoaded = true;

  const PLAN_FEATURES = {
    starter: ['dashboard','teachers','teacher_approvals','students','analytics','alerts','finance_fees','parent_messages','school_settings','billing','classes','report_cards'],
    growth: ['dashboard','teachers','teacher_approvals','students','analytics','alerts','finance_fees','parent_messages','school_settings','billing','classes','report_cards','calendar','school_branding','timetable','homework'],
    enterprise: ['dashboard','teachers','teacher_approvals','students','analytics','alerts','finance_fees','parent_messages','school_settings','billing','classes','report_cards','calendar','school_branding','timetable','homework','duty','fairness_report','departments','bulk_sms','senior_subject_choice']
  };
  const SECTION_FEATURE = {
    calendar:'calendar', homework:'homework', 'my-homework':'homework', timetable:'timetable', 'my-timetable':'timetable', schedule:'timetable', duty:'duty', 'duty-preferences':'duty', departments:'departments', sms:'bulk_sms', 'fairness-report':'fairness_report', 'teacher-workload':'fairness_report', 'school-branding':'school_branding', 'student-subject-selection':'senior_subject_choice', 'subject-choice':'senior_subject_choice', 'subject-selection':'senior_subject_choice', 'subject-requests':'senior_subject_choice', 'subscription-billing':'billing', payments:'billing', 'finance-fees':'finance_fees', 'fee-structures':'finance_fees', 'payment-settings':'finance_fees', alerts:'alerts', 'parent-messages':'parent_messages', students:'students', teachers:'teachers', classes:'classes', analytics:'analytics', settings:'school_settings'
  };
  const SCHOOL_DEFAULT_BRANDING = { schoolName:'Shule AI', displayName:'Shule AI', name:'Shule AI', logo:'assets/logo.png', logoUrl:'assets/logo.png', logoDataUrl:null, primaryColor:'#083A85', accentColor:'#11B5B1', colorName:'Shule Blue' };
  function esc(v){ if(typeof escapeHtml==='function') return escapeHtml(v); const d=document.createElement('div'); d.textContent=String(v??''); return d.innerHTML; }
  function role(){ return String((typeof getCurrentRole==='function'?getCurrentRole():localStorage.getItem('userRole')||'')||'').toLowerCase().replace('-', '_'); }
  function schoolPlan(){ const s=window.ShulePlanState||{}; const raw=String(s.planCode||s.currentPlan||s.schoolTier||'starter').toLowerCase().replace(/^school_/, ''); if(raw.includes('enterprise')) return 'enterprise'; if(raw.includes('growth')) return 'growth'; return 'starter'; }
  function features(){ const st=window.ShulePlanState||{}; if(Array.isArray(st.features)&&st.features.length) return new Set(st.features); return new Set(PLAN_FEATURES[schoolPlan()]||PLAN_FEATURES.starter); }
  function hasFeature(f){ if(!f) return true; if(role()==='superadmin'||role()==='super_admin') return true; const set=features(); return set.has(f); }
  function selectedChild(){ return window.dashboardData?.selectedChild || window.dashboardData?.children?.find?.(c=>String(c.id||c.studentId)===String(window.dashboardData?.selectedChildId||localStorage.getItem('shule_selected_child_id'))) || null; }
  function isSeniorText(text){ return /(^|\D)(grade\s*)?(10|11|12)(\D|$)|senior|g10|g11|g12/i.test(String(text||'')); }
  function seniorEnabled(){ const school=JSON.parse(localStorage.getItem('school')||'{}')||{}; const settings=school.settings||window.schoolSettings?.settings||{}; const text=[settings.schoolStructure,settings.structureType,settings.schoolLevel,settings.enabledLevels,school.schoolLevel,school.type].filter(Boolean).join(' ').toLowerCase(); if(/primary_only|primary only|junior_only|junior only/.test(text)) return false; if(/senior|secondary|mixed|full|grade\s*1[0-2]/.test(text)) return true; return !!(settings.hasSeniorSchool||settings.seniorEnabled||settings.seniorSchoolEnabled); }
  function sectionAllowed(section){ const f=SECTION_FEATURE[section]; if(!hasFeature(f)) return false; if(f==='senior_subject_choice') { const c=selectedChild(); const text=[c?.grade,c?.className,c?.Class?.name,c?.levelCode,window.dashboardData?.student?.grade].join(' '); return seniorEnabled() && (isSeniorText(text)||role()==='admin'||role()==='teacher'); } return true; }
  async function loadPlanState(){
    try{
      if(!localStorage.getItem('token')) return;
      const res=await apiRequest('/api/subscriptions/my-status');
      const d=res?.data||{};
      window.ShulePlanState={...(window.ShulePlanState||{}),...d, features:d.features||d.featureList||d.subscription?.features||null, planCode:d.planCode||d.currentPlan||d.schoolTier||d.subscription?.planCode||d.subscription?.planName||undefined};
      applyDefaultBrandingIfNeeded();
    }catch(e){ console.warn('[v118] plan state load skipped:', e.message); }
  }
  function applyDefaultBrandingIfNeeded(){
    if(role()==='superadmin'||role()==='super_admin') return;
    if(hasFeature('school_branding')) return;
    window.schoolBranding={...(window.schoolBranding||{}),...SCHOOL_DEFAULT_BRANDING};
    try{ localStorage.setItem('schoolBranding', JSON.stringify(window.schoolBranding)); }catch(_){ }
    document.querySelectorAll('#sidebar-school-name,.school-name,.school-name-display,[data-school-name]').forEach(el=>{ el.textContent='Shule AI'; el.setAttribute('title','Shule AI'); });
    document.querySelectorAll('[data-school-logo],.school-logo,.sidebar-logo,img[data-branding-logo-preview]').forEach(img=>{ if(img.tagName==='IMG') { img.setAttribute('src','assets/logo.png'); img.onerror=()=>img.setAttribute('src','assets/logo.png'); } });
    if(window.BrandingManager?.apply) setTimeout(()=>window.BrandingManager.apply('Shule AI',{force:true}),10);
  }
  function pruneUnavailable(root=document){
    const links=root.querySelectorAll?.('[data-section], [onclick*="showDashboardSection"]')||[];
    links.forEach(el=>{
      const section=el.getAttribute('data-section') || ((el.getAttribute('onclick')||'').match(/showDashboardSection\(['"]([^'"]+)/)||[])[1];
      if(section && !sectionAllowed(section)) el.remove();
    });
    const unavailableTexts=[];
    if(!hasFeature('calendar')) unavailableTexts.push('calendar');
    if(!hasFeature('school_branding')) unavailableTexts.push('school branding','branding');
    if(!hasFeature('timetable')) unavailableTexts.push('timetable');
    if(!hasFeature('duty')) unavailableTexts.push('duty','duty preferences');
    if(!hasFeature('fairness_report')) unavailableTexts.push('fairness report','teacher workload');
    if(!hasFeature('departments')) unavailableTexts.push('departments');
    if(!hasFeature('bulk_sms')) unavailableTexts.push('bulk sms','sms');
    if(!hasFeature('senior_subject_choice')||!seniorEnabled()) unavailableTexts.push('subject choice','subject requests','student subject selection');
    root.querySelectorAll?.('.dashboard-card,.card,.quick-card,.analytics-card,button,a,section,article').forEach(el=>{
      const text=(el.textContent||'').trim().toLowerCase();
      if(text && unavailableTexts.some(t=>text===t || (text.includes(t)&&text.length<80))) el.remove();
    });
  }
  const oldUpdateSidebar=window.updateSidebar;
  window.updateSidebar=function(r){ const out=oldUpdateSidebar?oldUpdateSidebar.apply(this,arguments):undefined; try{ pruneUnavailable(document); applyDefaultBrandingIfNeeded(); }catch(e){ console.warn('[v118] sidebar prune failed',e); } return out; };
  const oldShow=window.showDashboardSection;
  window.showDashboardSection=async function(section){ if(section&&!sectionAllowed(section)){ if(typeof showToast==='function') showToast('This section is not available for this school setup.','info'); return oldShow?oldShow.call(this,'dashboard'):null; } return oldShow?oldShow.apply(this,arguments):null; };
  const oldRender=window.renderDashboardSection;
  if(oldRender){ window.renderDashboardSection=async function(r,section){ if(section&&!sectionAllowed(section)) return '<div class="rounded-xl border bg-card p-6 text-muted-foreground">Section unavailable.</div>'; const html=await oldRender.apply(this,arguments); setTimeout(()=>pruneUnavailable(document),30); return html; }; }

  // Alert source labels everywhere, including dashboard preview cards.
  function labelForAlert(alert){ const data=alert?.data||{}; return alert?.sourceLabel||data.sourceLabel||data.aiLabel||data.sourceType||alert?.type||'System'; }
  window.v118DecorateAlertHtml=function(alert){ const source=labelForAlert(alert); const target=alert?.targetLabel||alert?.data?.targetLabel||alert?.studentName||alert?.data?.studentName||''; return `<div class="flex flex-wrap gap-1 mt-1"><span class="text-[10px] rounded-full bg-primary/10 text-primary px-2 py-0.5">From: ${esc(source)}</span>${target?`<span class="text-[10px] rounded-full bg-muted px-2 py-0.5">For: ${esc(target)}</span>`:''}</div>`; };
  function decorateAlertCards(){ document.querySelectorAll('.alert-v82-card,.alert-card,[data-alert-id]').forEach(card=>{ if(card.querySelector('.v118-alert-source')) return; const badge=card.querySelector('.alert-v82-source'); if(badge){ badge.textContent=badge.textContent||'System'; return; } const chip=document.createElement('div'); chip.className='v118-alert-source text-[10px] rounded-full bg-primary/10 text-primary px-2 py-0.5 inline-flex mt-1'; chip.textContent='From: System'; card.querySelector('h3,p')?.after(chip); }); }
  setInterval(decorateAlertCards,2500);

  // Admin assessment settings panel used inside custom subjects / curriculum area.
  window.v118RenderAssessmentSettings=async function(){
    let rows=[]; try{ rows=(await apiRequest('/api/admin/assessment-settings')).data||[]; }catch(_){ rows=[{assessmentType:'cat',label:'CAT',showOnReport:true,countInFinal:true,weight:20,displayOrder:1},{assessmentType:'midterm',label:'Midterm',showOnReport:true,countInFinal:true,weight:30,displayOrder:2},{assessmentType:'end_term',label:'End Term',showOnReport:true,countInFinal:true,weight:50,displayOrder:3},{assessmentType:'sba',label:'SBA',showOnReport:false,countInFinal:false,weight:0,displayOrder:4},{assessmentType:'project',label:'Project',showOnReport:false,countInFinal:false,weight:0,displayOrder:5},{assessmentType:'practical',label:'Practical',showOnReport:false,countInFinal:false,weight:0,displayOrder:6}]; }
    return `<div class="rounded-xl border bg-card p-6 space-y-4"><div><h3 class="font-semibold text-lg">Report Card Assessment Components</h3><p class="text-sm text-muted-foreground">Choose which Kenyan school tests appear and which ones count in the final report card.</p></div><div class="overflow-x-auto"><table class="w-full text-sm"><thead><tr><th class="text-left p-2">Test</th><th>Show</th><th>Count</th><th>Weight %</th><th>Order</th></tr></thead><tbody>${rows.map((r,i)=>`<tr data-v118-assessment="${esc(r.assessmentType)}"><td class="p-2"><input class="v118-ass-label rounded border px-2 py-1 bg-background" value="${esc(r.label||r.assessmentType)}"></td><td class="text-center"><input type="checkbox" class="v118-ass-show" ${r.showOnReport!==false?'checked':''}></td><td class="text-center"><input type="checkbox" class="v118-ass-count" ${r.countInFinal!==false?'checked':''}></td><td><input type="number" class="v118-ass-weight w-20 rounded border px-2 py-1 bg-background" value="${Number(r.weight||0)}"></td><td><input type="number" class="v118-ass-order w-16 rounded border px-2 py-1 bg-background" value="${Number(r.displayOrder||i+1)}"></td></tr>`).join('')}</tbody></table></div><button onclick="v118SaveAssessmentSettings()" class="px-4 py-2 rounded-lg bg-primary text-primary-foreground">Save Assessment Settings</button></div>`;
  };
  window.v118SaveAssessmentSettings=async function(){ const settings=[...document.querySelectorAll('[data-v118-assessment]')].map(row=>({assessmentType:row.dataset.v118Assessment,label:row.querySelector('.v118-ass-label').value,showOnReport:row.querySelector('.v118-ass-show').checked,countInFinal:row.querySelector('.v118-ass-count').checked,weight:Number(row.querySelector('.v118-ass-weight').value||0),displayOrder:Number(row.querySelector('.v118-ass-order').value||0)})); await apiRequest('/api/admin/assessment-settings',{method:'PUT',body:JSON.stringify({settings})}); if(typeof showToast==='function') showToast('Assessment settings saved','success'); };
  const oldCustom=window.renderCustomSubjects;
  if(oldCustom){ window.renderCustomSubjects=async function(){ const html=await oldCustom.apply(this,arguments); const panel=await window.v118RenderAssessmentSettings(); return `${html}<div class="mt-6">${panel}</div>`; }; }

  // One-page report card template with child photo, top logo, watermark, and admin-selected components.
  window.buildReportCardHTML=async function(studentId){
    if(!studentId){ const dash=await api.student.getDashboard().catch(()=>null); studentId=dash?.data?.student?.id||window.dashboardData?.student?.id; }
    if(!studentId) throw new Error('Student ID not available');
    const res=await (typeof v113LoadReportCardDetails==='function'?v113LoadReportCardDetails(studentId):api.students.getFullDetails(studentId));
    if(!res.success) throw new Error(res.message||'Failed to load report card data');
    const data=res.data||{}, student=data.student||{}, user=data.user||{}, academic=data.academicSummary||{}, attendance=data.attendanceSummary||{}, school=data.school||getCurrentSchool()||{};
    const branding=(!hasFeature('school_branding')&&role()!=='superadmin')?SCHOOL_DEFAULT_BRANDING:(window.BrandingManager?.getStoredBranding?window.BrandingManager.getStoredBranding():JSON.parse(localStorage.getItem('schoolBranding')||'{}'));
    const logo=branding.logoDataUrl||branding.logoUrl||branding.logo||school.logo||school.branding?.logoDataUrl||school.branding?.logoUrl||school.branding?.logo||'';
    const photo=(student.photo&&typeof resolveMediaUrl==='function')?resolveMediaUrl(student.photo):student.photo;
    const subjects=academic.subjects||[];
    const testLabels=[...new Set(subjects.flatMap(s=>(s.components||[]).map(c=>c.label)).filter(Boolean))].slice(0,6);
    const primary=branding.primaryColor||'#083A85', accent=branding.accentColor||'#11B5B1';
    const compScore=(s,label)=>{ const c=(s.components||[]).find(x=>x.label===label); return c?`${c.score}%`:''; };
    return `<!doctype html><html><head><meta charset="utf-8"><title>Report Card - ${esc(user.name||'Student')}</title><style>@page{size:A4;margin:8mm}*{box-sizing:border-box}body{font-family:Arial,sans-serif;margin:0;color:#172033;background:white;font-size:11px}.actions{display:flex;justify-content:flex-end;gap:8px;margin:8px}.actions button{padding:8px 12px;border-radius:8px;border:1px solid #cbd5e1;background:white}.actions .primary{background:${primary};color:white}.report{width:100%;max-width:780px;min-height:1080px;margin:auto;border:1px solid #d9e2ef;border-radius:14px;padding:14px;position:relative;overflow:hidden}.wm{position:absolute;inset:210px 70px auto 70px;height:420px;display:flex;align-items:center;justify-content:center;opacity:.055}.wm img{max-width:360px;max-height:360px}.top{display:grid;grid-template-columns:90px 1fr 82px;gap:10px;align-items:center;border-bottom:3px solid ${primary};padding-bottom:8px}.logo{max-width:82px;max-height:72px;object-fit:contain}.photo{width:74px;height:74px;border-radius:12px;object-fit:cover;border:2px solid ${accent}}h1{margin:0;color:${primary};font-size:22px}.muted{color:#64748b}.bio{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin:10px 0}.box{border:1px solid #e2e8f0;border-radius:8px;padding:6px;background:#f8fafc}.box b{display:block;color:${primary}}table{width:100%;border-collapse:collapse;position:relative;z-index:1}th{background:${primary};color:white;padding:5px;text-align:left}td{border-bottom:1px solid #e2e8f0;padding:5px}.summary{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin:8px 0}.comments{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px}.sig{border-top:1px solid #334155;padding-top:5px;margin-top:18px}.footer{text-align:center;margin-top:6px;color:#64748b}@media print{.actions{display:none}.report{border:0;border-radius:0;min-height:auto;padding:0}body{font-size:10px}}</style></head><body><div class="actions"><button class="primary" onclick="window.print()">Print / Save PDF</button></div><main class="report">${logo?`<div class="wm"><img src="${esc(logo)}"></div>`:''}<section class="top">${logo?`<img class="logo" src="${esc(logo)}">`:'<div></div>'}<div><h1>${esc(branding.schoolName||school.schoolName||school.name||'Shule AI School')}</h1><div class="muted">Official Student Report Card • ${esc((school.curriculum||school.system||'CBC').toUpperCase())}</div></div>${photo?`<img class="photo" src="${esc(photo)}">`:`<div class="photo" style="display:flex;align-items:center;justify-content:center;background:${primary};color:#fff;font-weight:700">${esc((user.name||'S').slice(0,2).toUpperCase())}</div>`}</section><section class="bio"><div class="box"><b>Student</b>${esc(user.name||'Student')}</div><div class="box"><b>Class</b>${esc(student.grade||student.className||'-')}</div><div class="box"><b>Elimu/Adm No.</b>${esc(student.elimuid||student.admissionNumber||'-')}</div><div class="box"><b>Date</b>${new Date().toLocaleDateString()}</div></section><section class="summary"><div class="box"><b>Average</b>${academic.overallAverage??0}%</div><div class="box"><b>Attendance</b>${attendance.rate??0}%</div><div class="box"><b>Present</b>${attendance.present??0}</div><div class="box"><b>Absent/Late</b>${attendance.absent??0}/${attendance.late??0}</div></section><table><thead><tr><th>Subject / Learning Area</th>${testLabels.map(l=>`<th>${esc(l)}</th>`).join('')}<th>Final</th><th>Level/Grade</th><th>Teacher Comment</th></tr></thead><tbody>${subjects.length?subjects.map(s=>`<tr><td>${esc(s.subject)}</td>${testLabels.map(l=>`<td>${esc(compScore(s,l))}</td>`).join('')}<td><b>${s.average??0}%</b></td><td><b>${esc(s.grade||'-')}</b></td><td>${esc(s.comment||'')}</td></tr>`).join(''):'<tr><td colspan="6">No published marks yet.</td></tr>'}</tbody></table><section class="comments"><div class="box"><b>Class Teacher Comment</b><br>${esc(data.classTeacher?.comment||'')}</div><div class="box"><b>Headteacher / Principal Comment</b><br>${esc(data.principalComment||'')}</div></section><section class="comments"><div class="sig">Class Teacher Signature</div><div class="sig">Headteacher / Principal Signature</div></section><div class="footer">Generated by Shule AI • ${esc(branding.reportFooter||'')}</div></main></body></html>`;
  };

  document.addEventListener('DOMContentLoaded',()=>{ loadPlanState().then(()=>{ pruneUnavailable(document); applyDefaultBrandingIfNeeded(); }); });
  setTimeout(()=>loadPlanState().then(()=>pruneUnavailable(document)),800);
})();
