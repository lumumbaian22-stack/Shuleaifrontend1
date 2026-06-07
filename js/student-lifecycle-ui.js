// Shule AI v143 — Academic year transition UI. Historical enrolments are never overwritten.
(function(){
  const esc=value=>typeof escapeHtml==='function'?escapeHtml(value):String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const unwrap=response=>response?.data?.data||response?.data||response||{};
  let currentBatch=null;
  let classOptions=[];

  async function loadClasses(){
    try{const payload=unwrap(await api.admin.getClasses());classOptions=Array.isArray(payload)?payload:(payload.classes||[]);}catch(_){classOptions=[];}
    return classOptions;
  }

  async function renderAcademicYearTransition(){
    const year=new Date().getFullYear();
    let batches=[];
    try{batches=unwrap(await api.admin.listPromotionBatches())||[];}catch(error){console.error(error);}
    return `<div class="space-y-6 animate-fade-in">
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3"><div><p class="text-xs uppercase tracking-wide text-muted-foreground">Student lifecycle</p><h2 class="text-2xl font-bold">Academic Year Transition</h2><p class="text-sm text-muted-foreground">Preview, validate, schedule and audit promotions without deleting the learner’s previous class history.</p></div><button onclick="showDashboardSection('students')" class="px-4 py-2 rounded-lg border">Back to Students</button></div>
      <section class="rounded-2xl border bg-card p-5"><h3 class="font-semibold text-lg">1. Generate promotion preview</h3><div class="mt-4 grid gap-4 md:grid-cols-3"><label class="text-sm">Closing academic year<input id="transition-closing-year" type="number" class="mt-1 w-full rounded-lg border bg-background px-3 py-2" value="${year}"></label><label class="text-sm">New academic year<input id="transition-new-year" type="number" class="mt-1 w-full rounded-lg border bg-background px-3 py-2" value="${year+1}"></label><label class="text-sm">Effective date<input id="transition-effective-date" type="date" class="mt-1 w-full rounded-lg border bg-background px-3 py-2" value="${year+1}-01-01"></label></div><div class="mt-4 flex justify-end"><button onclick="generatePromotionPreview()" class="px-5 py-2.5 rounded-lg bg-primary text-white">Generate Preview</button></div></section>
      <section class="rounded-2xl border bg-card overflow-hidden"><div class="p-5 border-b"><h3 class="font-semibold text-lg">Saved transition batches</h3><p class="text-sm text-muted-foreground">Scheduled batches take effect automatically on their effective date.</p></div><div class="divide-y">${batches.length?batches.map(batch=>`<button class="w-full text-left p-4 hover:bg-accent/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3" onclick="openPromotionBatch(${batch.id})"><div><p class="font-semibold">${batch.closingYear} → ${batch.newYear}</p><p class="text-xs text-muted-foreground">Effective ${esc(batch.effectiveDate)} · Created ${batch.createdAt?new Date(batch.createdAt).toLocaleString():'—'}</p></div><span class="rounded-full border px-3 py-1 text-xs font-semibold">${esc(batch.status)}</span></button>`).join(''):'<div class="p-10 text-center text-muted-foreground">No transition preview has been created yet.</div>'}</div></section>
      <div id="promotion-batch-workspace"></div>
    </div>`;
  }

  async function generatePromotionPreview(){
    const closingYear=Number(document.getElementById('transition-closing-year')?.value||0);
    const newYear=Number(document.getElementById('transition-new-year')?.value||0);
    const effectiveDate=document.getElementById('transition-effective-date')?.value||`${newYear}-01-01`;
    if(!closingYear||!newYear||newYear<=closingYear)return showToast('Choose a valid closing year and later new year','error');
    showLoading();
    try{const response=await api.admin.createPromotionPreview({closingYear,newYear,effectiveDate});const batch=unwrap(response);showToast('Promotion preview generated','success');await showDashboardSection('academic-year-transition');setTimeout(()=>openPromotionBatch(batch.id),50);}
    catch(error){showToast(error.message||'Promotion preview could not be generated','error');}
    finally{hideLoading();}
  }

  function decisionName(decision){return decision.Student?.User?.name||decision.metadata?.studentName||`Student ${decision.studentId}`;}
  function className(id,fallback=''){return classOptions.find(item=>Number(item.id)===Number(id))?.name||fallback||'—';}
  function destinationOptions(decision){return `<option value="">No destination</option>${classOptions.map(cls=>`<option value="${cls.id}" ${Number(cls.id)===Number(decision.toClassId)?'selected':''}>${esc(cls.name)}${cls.stream?` · ${esc(cls.stream)}`:''}</option>`).join('')}`;}

  async function openPromotionBatch(id){
    const workspace=document.getElementById('promotion-batch-workspace');if(!workspace)return;
    workspace.innerHTML='<div class="rounded-xl border bg-card p-8 text-center text-muted-foreground">Loading transition preview…</div>';
    try{
      await loadClasses();currentBatch=unwrap(await api.admin.getPromotionBatch(id));
      const decisions=currentBatch.PromotionDecisions||[];const editable=currentBatch.status==='draft';
      const unresolved=decisions.filter(d=>d.outcome==='hold_review'||d.status==='blocked'||(d.warnings||[]).length).length;
      workspace.innerHTML=`<section class="rounded-2xl border bg-card overflow-hidden"><div class="p-5 border-b flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4"><div><p class="text-xs uppercase tracking-wide text-muted-foreground">Batch #${currentBatch.id}</p><h3 class="text-xl font-bold">${currentBatch.closingYear} → ${currentBatch.newYear}</h3><p class="text-sm text-muted-foreground">Effective ${esc(currentBatch.effectiveDate)} · ${decisions.length} learners · ${unresolved} warning/unresolved</p></div><div class="flex flex-wrap gap-2"><button onclick="downloadPromotionExport(${currentBatch.id},'pdf')" class="px-3 py-2 rounded-lg border">Summary PDF</button><button onclick="downloadPromotionExport(${currentBatch.id},'xlsx')" class="px-3 py-2 rounded-lg border">Lists Excel</button>${currentBatch.status==='applied'?`<button onclick="rollbackPromotionBatch(${currentBatch.id})" class="px-3 py-2 rounded-lg border border-red-300 text-red-700">Rollback</button>`:''}</div></div>
        <div class="overflow-x-auto"><table class="w-full text-sm min-w-[1050px]"><thead class="bg-muted/50"><tr><th class="p-3 text-left">Learner</th><th class="p-3 text-left">Current</th><th class="p-3 text-left">Outcome</th><th class="p-3 text-left">Destination</th><th class="p-3 text-left">Stream</th><th class="p-3 text-left">Validation</th><th class="p-3 text-center">Save</th></tr></thead><tbody class="divide-y">${decisions.map(d=>`<tr data-promotion-decision="${d.id}"><td class="p-3 font-medium">${esc(decisionName(d))}</td><td class="p-3">${esc(className(d.fromClassId,d.metadata?.fromClassName))}${d.fromStream?`<div class="text-xs text-muted-foreground">${esc(d.fromStream)}</div>`:''}</td><td class="p-3"><select class="promotion-outcome rounded-lg border bg-background px-2 py-2" ${editable?'':'disabled'}><option value="promote" ${d.outcome==='promote'?'selected':''}>Promote</option><option value="repeat" ${d.outcome==='repeat'?'selected':''}>Repeat current class</option><option value="move_stream" ${d.outcome==='move_stream'?'selected':''}>Move to another stream</option><option value="graduate" ${d.outcome==='graduate'?'selected':''}>Graduate</option><option value="transfer_out" ${d.outcome==='transfer_out'?'selected':''}>Transfer out</option><option value="withdraw" ${d.outcome==='withdraw'?'selected':''}>Withdraw</option><option value="hold_review" ${d.outcome==='hold_review'?'selected':''}>Hold for review</option></select></td><td class="p-3"><select class="promotion-destination min-w-[180px] rounded-lg border bg-background px-2 py-2" ${editable?'':'disabled'}>${destinationOptions(d)}</select></td><td class="p-3"><input class="promotion-stream w-28 rounded-lg border bg-background px-2 py-2" value="${esc(d.toStream||'')}" ${editable?'':'disabled'}></td><td class="p-3 max-w-xs">${(d.warnings||[]).length?`<ul class="text-xs text-amber-700 space-y-1">${d.warnings.map(w=>`<li>• ${esc(w)}</li>`).join('')}</ul>`:`<span class="text-xs text-green-700">Validated</span>`}</td><td class="p-3 text-center">${editable?`<button onclick="savePromotionDecision(${currentBatch.id},${d.id})" class="px-3 py-2 rounded-lg border">Save</button>`:`<span class="text-xs">${esc(d.status)}</span>`}</td></tr>`).join('')}</tbody></table></div>
        ${editable?`<div class="p-5 border-t flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3"><label class="flex gap-2 items-start text-sm"><input id="allow-unresolved-promotions" type="checkbox" class="mt-1"><span>Allow unresolved learners to remain unchanged while valid decisions are applied. Held learners stay in their current enrolment.</span></label><button onclick="confirmPromotionBatch(${currentBatch.id})" class="px-5 py-2.5 rounded-lg bg-primary text-white">Confirm / Schedule Transition</button></div>`:''}
      </section>`;
      workspace.scrollIntoView({behavior:'smooth',block:'start'});
    }catch(error){workspace.innerHTML=`<div class="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">${esc(error.message||'Transition batch could not be loaded')}</div>`;}
  }

  async function savePromotionDecision(batchId,decisionId){
    const row=document.querySelector(`[data-promotion-decision="${decisionId}"]`);if(!row)return;
    const data={outcome:row.querySelector('.promotion-outcome')?.value,toClassId:row.querySelector('.promotion-destination')?.value||null,toStream:row.querySelector('.promotion-stream')?.value||null};
    try{await api.admin.updatePromotionDecision(batchId,decisionId,data);showToast('Learner decision saved','success');await openPromotionBatch(batchId);}catch(error){showToast(error.message||'Decision could not be saved','error');}
  }

  async function confirmPromotionBatch(id){
    if(!confirm('Confirm this transition? If the effective date is in the future, it will be scheduled and current classes remain active until that date.'))return;
    showLoading();try{const response=await api.admin.confirmPromotionBatch(id,{allowUnresolved:!!document.getElementById('allow-unresolved-promotions')?.checked});showToast(response.message||'Transition confirmed','success');await showDashboardSection('academic-year-transition');setTimeout(()=>openPromotionBatch(id),50);}catch(error){showToast(error.message||'Transition could not be confirmed','error');}finally{hideLoading();}
  }

  async function rollbackPromotionBatch(id){const reason=prompt('Enter the required reason for reversing this transition:');if(!reason?.trim())return;showLoading();try{await api.admin.rollbackPromotionBatch(id,reason.trim());showToast('Previous enrolments restored and rollback audited','success');await showDashboardSection('academic-year-transition');setTimeout(()=>openPromotionBatch(id),50);}catch(error){showToast(error.message||'Rollback failed','error');}finally{hideLoading();}}

  async function downloadPromotionExport(id,format){
    try{const token=localStorage.getItem('authToken')||localStorage.getItem('token')||'';const response=await fetch(`${API_BASE_URL}/api/lifecycle/promotions/${id}/export/${format}`,{headers:token?{Authorization:`Bearer ${token}`}:{}});if(!response.ok){let message='Export failed';try{message=(await response.json()).message||message;}catch(_){}throw new Error(message);}const blob=await response.blob();const disposition=response.headers.get('content-disposition')||'';const filename=disposition.match(/filename="?([^";]+)"?/i)?.[1]||`Academic_Year_Transition.${format}`;const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);}catch(error){showToast(error.message||'Export failed','error');}}

  window.renderAcademicYearTransition=renderAcademicYearTransition;
  window.generatePromotionPreview=generatePromotionPreview;
  window.openPromotionBatch=openPromotionBatch;
  window.savePromotionDecision=savePromotionDecision;
  window.confirmPromotionBatch=confirmPromotionBatch;
  window.rollbackPromotionBatch=rollbackPromotionBatch;
  window.downloadPromotionExport=downloadPromotionExport;
})();
