
// V87 Locked rollout fixes - additive layer only; preserves approved desktop/business logic.
(function(){
  'use strict';
  const w=window, d=document;
  function esc(v){ const div=d.createElement('div'); div.textContent = v == null ? '' : String(v); return div.innerHTML; }
  function isMobile(){ return matchMedia('(max-width: 768px)').matches; }
  function normalizeCurriculum(c){ const s=String(c||'cbc').toLowerCase().replace(/[^a-z0-9]/g,''); if(s.includes('844')||s==='84'||s==='8') return '844'; if(s.includes('brit')) return 'british'; if(s.includes('amer')) return 'american'; return 'cbc'; }
  function gradeFromScoreV87(score, curriculum='cbc', level='secondary', customScale=null){
    const n=Number(score); if(!Number.isFinite(n)) return 'N/A';
    if(Array.isArray(customScale)&&customScale.length){ const band=customScale.find(g=>n>=Number(g.min??String(g.range||'0-0').split('-')[0]) && n<=Number(g.max??String(g.range||'0-100').split('-')[1])); if(band) return band.grade||'N/A'; }
    const c=normalizeCurriculum(curriculum); const l=String(level||'secondary').toLowerCase().includes('primary')?'primary':'secondary';
    const scales={
      cbc:{primary:[[80,100,'EE'],[60,79,'ME'],[40,59,'AE'],[0,39,'BE']],secondary:[[81,100,'A'],[75,80,'A-'],[70,74,'B+'],[65,69,'B'],[60,64,'B-'],[55,59,'C+'],[50,54,'C'],[45,49,'C-'],[40,44,'D+'],[35,39,'D'],[30,34,'D-'],[0,29,'E']]},
      844:{primary:[[81,100,'A'],[75,80,'A-'],[70,74,'B+'],[65,69,'B'],[60,64,'B-'],[55,59,'C+'],[50,54,'C'],[45,49,'C-'],[40,44,'D+'],[35,39,'D'],[30,34,'D'],[0,29,'E']],secondary:[[81,100,'A'],[75,80,'A-'],[70,74,'B+'],[65,69,'B'],[60,64,'B-'],[55,59,'C+'],[50,54,'C'],[45,49,'C-'],[40,44,'D+'],[35,39,'D'],[30,34,'D-'],[0,29,'E']]},
      british:{primary:[[90,100,'A*'],[80,89,'A'],[70,79,'B'],[60,69,'C'],[50,59,'D'],[40,49,'E'],[30,39,'F'],[20,29,'G'],[0,19,'U']],secondary:[[90,100,'A*'],[80,89,'A'],[70,79,'B'],[60,69,'C'],[50,59,'D'],[40,49,'E'],[30,39,'F'],[20,29,'G'],[0,19,'U']]},
      american:{primary:[[90,100,'A'],[80,89,'B'],[70,79,'C'],[60,69,'D'],[0,59,'F']],secondary:[[90,100,'A'],[80,89,'B'],[70,79,'C'],[60,69,'D'],[0,59,'F']]}
    };
    const band=(scales[c]?.[l]||scales.cbc.secondary).find(([min,max])=>n>=min&&n<=max); return band?band[2]:'N/A';
  }
  w.getGradeFromScore = gradeFromScoreV87;
  w.v87GradeFromScore = gradeFromScoreV87;

  // Make teacher student list names-first accordion on mobile without changing desktop render.
  function enhanceTeacherStudentsMobile(){
    if(!isMobile() || w.currentRole !== 'teacher' || w.currentSection !== 'students') return;
    const content=d.getElementById('dashboard-content'); if(!content || content.dataset.v87StudentAccordion==='1') return;
    const cards=Array.from(content.querySelectorAll('.rounded-xl.border.bg-card, .student-card, [data-student-id]')).filter(el=>/ELIMUID|Grade:|Attendance|Overall|View|Report|Parent/i.test(el.textContent||''));
    if(cards.length<2) return;
    cards.forEach((card,i)=>{
      if(card.classList.contains('v87-student-accordion')) return;
      const name=(card.querySelector('h3,h4,.font-medium,strong')?.textContent||`Student ${i+1}`).trim();
      const wrapper=d.createElement('div'); wrapper.className='v87-student-accordion';
      wrapper.innerHTML=`<button type="button"><span>${esc(name)}</span><span>▼</span></button><div class="v87-student-details"></div>`;
      card.parentNode.insertBefore(wrapper,card); wrapper.querySelector('.v87-student-details').appendChild(card);
      wrapper.querySelector('button').addEventListener('click',()=>wrapper.classList.toggle('open'));
    });
    content.dataset.v87StudentAccordion='1';
  }

  // Parent school payment/bank info loader.
  w.refreshParentSchoolPaymentInfo = async function(){
    const body=d.getElementById('parent-school-payment-info-body'); if(!body) return;
    body.textContent='Loading school payment details...';
    try{
      const res=await apiRequest('/api/payments/parent/school-settings'); const s=res.data||{};
      body.innerHTML=`<div class="v87-bank-info-grid">
        <div class="v87-bank-info-item"><span>Mode</span><strong>${esc(s.paymentMode||'manual')}</strong></div>
        <div class="v87-bank-info-item"><span>M-Pesa ${esc(s.mpesaType||'paybill')}</span><strong>${esc(s.paybill||s.till||s.shortcode||'Not set')}</strong></div>
        <div class="v87-bank-info-item"><span>Bank</span><strong>${esc(s.bankName||'Not set')}</strong></div>
        <div class="v87-bank-info-item"><span>Account Name</span><strong>${esc(s.accountName||'Not set')}</strong></div>
        <div class="v87-bank-info-item"><span>Account Number</span><strong>${esc(s.accountNumber||'Not set')}</strong></div>
        <div class="v87-bank-info-item"><span>Branch</span><strong>${esc(s.branch||'Not set')}</strong></div>
      </div><p class="mt-3 text-xs text-muted-foreground">${esc(s.manualInstructions||'Pay using the displayed school account details, then submit your reference for verification.')}</p>`;
    }catch(e){ body.innerHTML=`<span class="text-red-600">Could not load school payment information: ${esc(e.message)}</span>`; }
  };

  // Career Path UI
  let v87CareerOptions=[]; let v87SelectedCareers=[];
  w.renderStudentCareerPathSection = async function(){
    setTimeout(()=>{ w.v87LoadCareerPath && w.v87LoadCareerPath(); },50);
    return `<div class="space-y-6 animate-fade-in" id="v87-career-path-root">
      <div class="rounded-xl border bg-card p-5 bg-gradient-to-r from-indigo-50 to-cyan-50 dark:from-slate-900 dark:to-slate-800">
        <h2 class="text-2xl font-bold">Career Path</h2><p class="text-sm text-muted-foreground">Search or scroll through careers, select one or more, and Shule AI will align insights and alerts to your choices.</p>
      </div>
      <div class="rounded-xl border bg-card p-4"><label class="text-sm font-semibold">Search careers</label><input id="v87-career-search" class="mt-2 w-full rounded-lg border bg-background p-3" placeholder="Doctor, Software Engineer, Pilot, Chef..." oninput="v87FilterCareers(this.value)"><div id="v87-selected-careers" class="mt-3 flex flex-wrap gap-2"></div></div>
      <div class="rounded-xl border bg-card p-4"><div class="flex items-center justify-between gap-3 flex-wrap"><h3 class="font-bold">Available Careers</h3><button onclick="v87SaveCareers()" class="px-4 py-2 rounded-lg bg-primary text-white">Save Career Choices</button></div><div id="v87-career-options" class="v87-career-grid mt-4"><p class="text-muted-foreground">Loading careers...</p></div></div>
      <div class="rounded-xl border bg-card p-4"><div class="flex items-center justify-between gap-3 flex-wrap"><h3 class="font-bold">Career Guidance Insights</h3><button onclick="v87GenerateCareerInsights()" class="px-4 py-2 rounded-lg border">Generate Insights</button></div><div id="v87-career-insights" class="mt-3 text-sm text-muted-foreground">Your career alerts will appear in the Alerts Center after saving your choices.</div></div>
    </div>`;
  };
  w.v87LoadCareerPath=async function(){
    try{ const [opts,selected]=await Promise.all([api.student.careerOptions(), api.student.getCareerInterests()]); v87CareerOptions=opts.data||[]; v87SelectedCareers=(selected.data?.careers||[]).map(c=>({id:c.careerId,name:c.careerName})); renderCareerSelected(); renderCareerOptions(v87CareerOptions); }catch(e){ const el=d.getElementById('v87-career-options'); if(el) el.innerHTML=`<p class="text-red-600">${esc(e.message)}</p>`; }
  };
  function renderCareerSelected(){ const el=d.getElementById('v87-selected-careers'); if(!el) return; el.innerHTML=v87SelectedCareers.length?v87SelectedCareers.map(c=>`<button class="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm" onclick="v87ToggleCareer('${esc(c.id)}','${esc(c.name)}')">${esc(c.name)} ×</button>`).join(''):'<span class="text-sm text-muted-foreground">No careers selected yet.</span>'; }
  function renderCareerOptions(rows){ const el=d.getElementById('v87-career-options'); if(!el) return; el.innerHTML=rows.map(c=>{const selected=v87SelectedCareers.some(x=>x.id===c.id); return `<button class="v87-career-card text-left ${selected?'selected':''}" onclick="v87ToggleCareer('${esc(c.id)}','${esc(c.name)}')"><strong>${esc(c.name)}</strong><p class="text-xs text-muted-foreground mt-1">${esc((c.recommendedSubjects||[]).slice(0,4).join(', '))}</p></button>`}).join(''); }
  w.v87FilterCareers=function(q){ q=String(q||'').toLowerCase(); renderCareerOptions(v87CareerOptions.filter(c=>!q||c.name.toLowerCase().includes(q))); };
  w.v87ToggleCareer=function(id,name){ const idx=v87SelectedCareers.findIndex(c=>c.id===id); if(idx>=0) v87SelectedCareers.splice(idx,1); else v87SelectedCareers.push({id,name}); renderCareerSelected(); w.v87FilterCareers(d.getElementById('v87-career-search')?.value||''); };
  w.v87SaveCareers=async function(){ try{ await api.student.saveCareerInterests({careers:v87SelectedCareers}); showToast('Career choices saved. Shule AI will align insights to your choices.','success'); await w.v87GenerateCareerInsights(); }catch(e){ showToast(e.message,'error'); } };
  w.v87GenerateCareerInsights=async function(){ const el=d.getElementById('v87-career-insights'); if(el) el.textContent='Generating career insights...'; try{ const res=await api.student.generateCareerInsights(); if(el) el.innerHTML=(res.data||[]).length?`Generated ${(res.data||[]).length} career insight alert(s). Open Alerts to view them.`:'Select careers first to generate insights.'; }catch(e){ if(el) el.innerHTML=`<span class="text-red-600">${esc(e.message)}</span>`; } };

  // Wrap showDashboardSection post-render enhancements.
  function patchNavigation(){ if(w.__v87NavPatched || typeof w.showDashboardSection!=='function') return; const original=w.showDashboardSection; w.showDashboardSection=async function(section){ const out=await original.apply(this,arguments); setTimeout(()=>{ d.body.classList.toggle('v87-mobile-ready', isMobile()); enhanceTeacherStudentsMobile(); if(section==='payments') w.refreshParentSchoolPaymentInfo && w.refreshParentSchoolPaymentInfo(); enhanceMobileTables(); },120); return out; }; w.__v87NavPatched=true; }
  function enhanceMobileTables(){ if(!isMobile()) return; d.querySelectorAll('.finance-v31-table-wrap, .overflow-x-auto').forEach(wrap=>{ const table=wrap.querySelector('table'); if(!table||wrap.classList.contains('v87-table-mobile-card')) return; wrap.classList.add('v87-table-mobile-card'); const headers=Array.from(table.querySelectorAll('thead th')).map(th=>th.textContent.trim()); table.querySelectorAll('tbody tr').forEach(tr=>Array.from(tr.children).forEach((td,i)=>td.setAttribute('data-label',headers[i]||''))); }); }
  // Duty swap frontend validation
  const oldSubmit=w.submitSwapRequest; w.submitSwapRequest=async function(){ const date=d.getElementById('swap-date')?.value; if(!/^\d{4}-\d{2}-\d{2}$/.test(String(date||''))){ showToast('Please select a valid duty date.','error'); return; } return oldSubmit?oldSubmit.apply(this,arguments):undefined; };
  // Profile picture: reapply after images fail and after render.
  d.addEventListener('error', function(e){ const img=e.target; if(img && img.tagName==='IMG' && /profile|avatar|uploads/.test(img.src||'')){ img.style.display='none'; const fallback=img.nextElementSibling; if(fallback) fallback.style.display='flex'; } }, true);
  setInterval(()=>{ if(typeof applyGlobalProfilePictures==='function') applyGlobalProfilePictures(); }, 5000);
  d.addEventListener('DOMContentLoaded',()=>{ patchNavigation(); d.body.classList.toggle('v87-mobile-ready', isMobile()); setTimeout(()=>{patchNavigation(); enhanceMobileTables();},600); });
  setTimeout(patchNavigation,1000);
})();
