// Shule AI v143 — Academic year transition UI. Historical enrolments are never overwritten.
(function(){
  const esc=value=>typeof escapeHtml==='function'?escapeHtml(value):String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const unwrap=response=>response?.data?.data||response?.data||response||{};
  let currentBatch=null;
  let classOptions=[];

  async function loadClasses(){
    try{const payload=unwrap(await (api.admin.getActiveClasses ? api.admin.getActiveClasses() : api.admin.getClasses({status:'active'})));classOptions=Array.isArray(payload)?payload:(payload.classes||[]);}catch(_){classOptions=[];}
    return classOptions;
  }

  async function renderAcademicYearTransition(){
    const year=new Date().getFullYear();
    let batches=[];
    try{batches=unwrap(await api.admin.listPromotionBatches())||[];}catch(error){console.error(error);}
    return `<div class="space-y-6 animate-fade-in">
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3"><div><p class="text-xs uppercase tracking-wide text-muted-foreground">Student lifecycle</p><h2 class="text-2xl font-bold">Academic Year Transition</h2><p class="text-sm text-muted-foreground">Preview, validate, schedule and audit promotions without deleting the learner’s previous class history.</p></div><button onclick="showDashboardSection('students')" class="px-4 py-2 rounded-lg border">Back to Students</button></div>
      <section class="rounded-2xl border bg-card p-5"><h3 class="font-semibold text-lg">1. Generate promotion preview</h3><div class="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-5"><label class="text-sm">Closing academic year<input id="transition-closing-year" type="number" class="mt-1 w-full rounded-lg border bg-background px-3 py-2" value="${year}"></label><label class="text-sm">Closing term<select id="transition-closing-term" class="mt-1 w-full rounded-lg border bg-background px-3 py-2"><option>Term 1</option><option>Term 2</option><option selected>Term 3</option></select></label><label class="text-sm">New academic year<input id="transition-new-year" type="number" class="mt-1 w-full rounded-lg border bg-background px-3 py-2" value="${year+1}"></label><label class="text-sm">Starting term<select id="transition-new-term" class="mt-1 w-full rounded-lg border bg-background px-3 py-2"><option selected>Term 1</option><option>Term 2</option><option>Term 3</option></select></label><label class="text-sm">Effective date<input id="transition-effective-date" type="date" class="mt-1 w-full rounded-lg border bg-background px-3 py-2" value="${year+1}-01-01"></label></div><div class="mt-4 flex justify-end"><button onclick="generatePromotionPreview()" class="px-5 py-2.5 rounded-lg bg-primary text-white">Generate Preview</button></div></section>
      <section class="rounded-2xl border bg-card overflow-hidden"><div class="p-5 border-b"><h3 class="font-semibold text-lg">Saved transition batches</h3><p class="text-sm text-muted-foreground">Scheduled batches take effect automatically on their effective date.</p></div><div class="divide-y">${batches.length?batches.map(batch=>`<button class="w-full text-left p-4 hover:bg-accent/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3" onclick="openPromotionBatch(${batch.id})"><div><p class="font-semibold">${batch.closingYear} → ${batch.newYear}</p><p class="text-xs text-muted-foreground">Effective ${esc(batch.effectiveDate)} · Created ${batch.createdAt?new Date(batch.createdAt).toLocaleString():'—'}</p></div><span class="rounded-full border px-3 py-1 text-xs font-semibold">${esc(batch.status)}</span></button>`).join(''):'<div class="p-10 text-center text-muted-foreground">No transition preview has been created yet.</div>'}</div></section>
      <div id="promotion-batch-workspace"></div>
    </div>`;
  }

  async function generatePromotionPreview(){
    const closingYear=Number(document.getElementById('transition-closing-year')?.value||0);
    const newYear=Number(document.getElementById('transition-new-year')?.value||0);
    const effectiveDate=document.getElementById('transition-effective-date')?.value||`${newYear}-01-01`;
    const closingTerm=document.getElementById('transition-closing-term')?.value||'Term 3';
    const newTerm=document.getElementById('transition-new-term')?.value||'Term 1';
    if(!closingYear||!newYear||newYear<=closingYear)return showToast('Choose a valid closing year and later new year','error');
    showLoading();
    try{const response=await api.admin.createPromotionPreview({closingYear,newYear,effectiveDate,closingTerm,newTerm});const batch=unwrap(response);showToast('Promotion preview generated','success');await showDashboardSection('academic-year-transition');setTimeout(()=>openPromotionBatch(batch.id),50);}
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

// Shule AI v148.6 — individual class transfer + role-safe enrollment history.
(function(){
  const esc=value=>typeof escapeHtml==='function'?escapeHtml(value):String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const unwrap=response=>response?.data?.data||response?.data||response||{};
  const rows=value=>Array.isArray(value)?value:(Array.isArray(value?.data)?value.data:[]);
  const currentYear=()=>new Date().getFullYear();
  let transferState={role:'admin',options:{classes:[],students:[]},preview:null,requests:[]};

  function roleApi(role){return role==='teacher'?api.teacher:api.admin;}
  function classLabel(id){const cls=transferState.options.classes.find(c=>Number(c.id)===Number(id));return cls?`${cls.name}${cls.stream&& !String(cls.name).toLowerCase().includes(String(cls.stream).toLowerCase())?` · ${cls.stream}`:''}`:'—';}
  function studentLabel(student){return student?.User?.name||student?.name||`Student ${student?.id||''}`;}
  function statusBadge(status){const map={pending:'bg-amber-100 text-amber-800',approved:'bg-blue-100 text-blue-800',scheduled:'bg-indigo-100 text-indigo-800',applied:'bg-green-100 text-green-800',rejected:'bg-red-100 text-red-800',cancelled:'bg-gray-100 text-gray-700',rolled_back:'bg-purple-100 text-purple-800',failed:'bg-red-100 text-red-800'};return `<span class="rounded-full px-2.5 py-1 text-xs font-semibold ${map[status]||'bg-muted'}">${esc(String(status||'unknown').replace(/_/g,' '))}</span>`;}

  function asArray(value){return Array.isArray(value)?value:(Array.isArray(value?.data)?value.data:(Array.isArray(value?.students)?value.students:(Array.isArray(value?.classes)?value.classes:[])));}
  function transferClassId(student){return student?.classId||student?.currentClassId||student?.Class?.id||student?.class?.id||student?.activeEnrollment?.classId||student?.activeEnrollment?.Class?.id||'';}
  function normalizeStudent(student){return {...student,classId:transferClassId(student),className:student?.className||student?.Class?.name||student?.class?.name||student?.activeEnrollment?.Class?.name||''};}
  function normalizeClass(cls){return {...cls,id:cls?.id||cls?.classId,name:cls?.name||cls?.className||cls?.grade||`Class ${cls?.id||''}`};}
  function classGroupLabel(cls){ const level=cls?.grade||cls?.levelLabel||cls?.levelCode||cls?.curriculumLevel||'Other classes'; return String(level||'Other classes'); }
  function groupedClassOptions(classes, selected=''){
    const groups=new Map();
    (classes||[]).forEach(c=>{ const key=classGroupLabel(c); if(!groups.has(key))groups.set(key,[]); groups.get(key).push(c); });
    return Array.from(groups.entries()).map(([label,list])=>`<optgroup label="${esc(label)}">${list.map(c=>`<option value="${c.id}" ${String(c.id)===String(selected)?'selected':''}>${esc(c.name)}${c.stream?` · ${esc(c.stream)}`:''}</option>`).join('')}</optgroup>`).join('');
  }
  function studentOptionsForClass(students, classId=''){
    const list=(students||[]).filter(s=>!classId||String(s.classId||'')===String(classId));
    const head=`<option value="">${classId?'Select student in this class':'Select class first'}</option>`;
    if(classId && !list.length) return head + '<option value="" disabled>No active students found in this class</option>';
    return head+list.map(s=>`<option value="${s.id}" data-class-id="${s.classId||''}">${esc(studentLabel(s))} · ${esc(s.elimuid||'No Elimu ID')}</option>`).join('');
  }
  function transferType(){return document.getElementById('class-transfer-type')?.value||'internal';}
  function toggleTransferType(){
    const external=transferType()==='external';
    document.querySelectorAll('[data-transfer-external]').forEach(n=>n.classList.toggle('hidden',!external));
    document.querySelectorAll('[data-transfer-internal]').forEach(n=>n.classList.toggle('hidden',external));
    const target=document.getElementById('class-transfer-target'); if(target) target.disabled=external;
  }
  async function fallbackTransferOptions(role, options){
    const out={classes:rows(options.classes).map(normalizeClass).filter(c=>c.id),students:rows(options.students).map(normalizeStudent)};
    if(out.classes.length && out.students.length) return out;
    try{
      if(role==='admin'){
        if(!out.classes.length && api?.admin?.getClasses){const r=unwrap(await (api.admin.getActiveClasses ? api.admin.getActiveClasses() : api.admin.getClasses({status:'active'})));out.classes=asArray(r).map(normalizeClass).filter(c=>c.id);}
        if(!out.students.length && api?.admin?.getStudents){const r=unwrap(await api.admin.getStudents());out.students=asArray(r).map(normalizeStudent);}
      } else if(role==='teacher'){
        const candidates=[];
        if(api?.teacher?.getMyStudents) candidates.push(api.teacher.getMyStudents());
        if(api?.teacher?.getStudents) candidates.push(api.teacher.getStudents());
        const settled=await Promise.allSettled(candidates);
        settled.forEach(x=>{if(x.status==='fulfilled'&&!out.students.length){out.students=asArray(unwrap(x.value)).map(normalizeStudent);}});
        const classMap=new Map(out.classes.map(c=>[String(c.id),c]));
        out.students.forEach(st=>{const cid=transferClassId(st); if(cid&&!classMap.has(String(cid))) classMap.set(String(cid),normalizeClass({id:cid,name:st.className||st.Class?.name||`Class ${cid}`}));});
        out.classes=[...classMap.values()];
      }
    }catch(error){console.warn('[Class transfer fallback options]',error);}
    out.classes.sort((a,b)=>String(a.name||'').localeCompare(String(b.name||''),undefined,{numeric:true,sensitivity:'base'}));
    out.students.sort((a,b)=>studentLabel(a).localeCompare(studentLabel(b),undefined,{numeric:true,sensitivity:'base'}));
    return out;
  }

  async function renderClassTransferCentre(role='admin'){
    transferState.role=role;
    const client=roleApi(role);
    let options={classes:[],students:[]},requests=[];
    try{options=unwrap(await client.getClassTransferOptions())||options;}catch(error){console.error('[Class transfer options]',error);}
    options=await fallbackTransferOptions(role,options);
    try{requests=rows(unwrap(await client.listClassTransfers()));}catch(error){console.error('[Class transfer list]',error);}
    transferState.options={classes:rows(options.classes).map(normalizeClass).filter(c=>c.id),students:rows(options.students).map(normalizeStudent)};transferState.requests=requests;transferState.preview=null;
    const students=transferState.options.students,classes=transferState.options.classes;
    const isAdmin=role==='admin';
    return `<div class="space-y-6 animate-fade-in">
      <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3"><div><p class="text-xs uppercase tracking-wide text-muted-foreground">Student School Cycle</p><h2 class="text-2xl font-bold">${isAdmin?'Transfer a Student':'Request a Class Transfer'}</h2><p class="text-sm text-muted-foreground">The old enrollment is closed and a new enrollment is created. Marks, attendance, reports, fees and audit history are never deleted.</p></div>${isAdmin?'<button onclick="showDashboardSection(\'student-lifecycle\')" class="px-4 py-2 rounded-lg border">Back to School Cycle</button>':''}</div>
      <section class="rounded-2xl border bg-card p-5"><div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <label class="text-sm">Movement type<select id="class-transfer-type" onchange="toggleTransferType()" class="mt-1 w-full rounded-lg border bg-background px-3 py-2"><option value="internal">Within this school</option>${isAdmin?'<option value="external">Transfer to another school</option>':''}</select></label>
        <label class="text-sm">Current class<select id="class-transfer-source" onchange="filterClassTransferStudents()" class="mt-1 w-full rounded-lg border bg-background px-3 py-2"><option value="">Select current class</option>${groupedClassOptions(classes)}</select></label>
        <label class="text-sm">Student<select id="class-transfer-student" onchange="updateTransferCurrentClass()" class="mt-1 w-full rounded-lg border bg-background px-3 py-2"><option value="">Select class first</option></select></label>
        <label class="text-sm">Current class / stream<input id="class-transfer-current" readonly class="mt-1 w-full rounded-lg border bg-muted px-3 py-2" value="Select class and student"></label>
        <label data-transfer-internal class="text-sm">Target class<select id="class-transfer-target" class="mt-1 w-full rounded-lg border bg-background px-3 py-2"><option value="">Select target class</option>${groupedClassOptions(classes)}</select></label>
        <label data-transfer-external class="text-sm hidden">Receiving school<input id="class-transfer-target-school" class="mt-1 w-full rounded-lg border bg-background px-3 py-2" placeholder="Receiving school name"></label>
        <label data-transfer-external class="text-sm hidden">Receiving class / stream<input id="class-transfer-target-class-name" class="mt-1 w-full rounded-lg border bg-background px-3 py-2" placeholder="Optional class/stream at new school"></label>
        <label class="text-sm">Effective date<input id="class-transfer-date" type="date" class="mt-1 w-full rounded-lg border bg-background px-3 py-2" value="${new Date().toISOString().slice(0,10)}"></label>
        <label class="text-sm">Academic year<input id="class-transfer-year" type="number" min="2000" max="2200" class="mt-1 w-full rounded-lg border bg-background px-3 py-2" value="${currentYear()}"></label>
        <label class="text-sm">Term<select id="class-transfer-term" class="mt-1 w-full rounded-lg border bg-background px-3 py-2"><option>Term 1</option><option>Term 2</option><option>Term 3</option></select></label>
        <label class="text-sm xl:col-span-2">Reason<input id="class-transfer-reason" class="mt-1 w-full rounded-lg border bg-background px-3 py-2" placeholder="Stream balancing, parent request, subject pathway..."></label>
        <label class="text-sm xl:col-span-2">Optional note<textarea id="class-transfer-note" rows="2" class="mt-1 w-full rounded-lg border bg-background px-3 py-2" placeholder="Additional context for the audit record"></textarea></label>
        ${isAdmin?`<label class="text-sm xl:col-span-2">Fee handling<select id="class-transfer-fee-action" class="mt-1 w-full rounded-lg border bg-background px-3 py-2"><option value="keep_current_period">Keep current-period invoice unchanged</option><option value="apply_next_period">Apply target-class fees from next billing period</option><option value="create_adjustment">Create an audited current-period adjustment</option></select></label>`:''}
      </div><div class="mt-4 flex justify-end"><button onclick="previewStudentClassTransfer('${role}')" class="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground">Review Transfer</button></div></section>
      <div id="class-transfer-preview"></div>
      <section class="rounded-2xl border bg-card overflow-hidden"><div class="p-5 border-b flex items-center justify-between"><div><h3 class="font-semibold text-lg">${isAdmin?'Transfer requests and history':'My submitted requests'}</h3><p class="text-sm text-muted-foreground">Scheduled transfers do not change the current class until their effective date.</p></div><button onclick="refreshClassTransferCentre('${role}')" class="px-3 py-2 rounded-lg border">Refresh</button></div>
      ${requests.length?`<div class="overflow-x-auto"><table class="w-full text-sm min-w-[1000px]"><thead class="bg-muted/50"><tr><th class="p-3 text-left">Student</th><th class="p-3 text-left">Movement</th><th class="p-3 text-left">Effective</th><th class="p-3 text-left">Reason</th><th class="p-3 text-left">Status</th><th class="p-3 text-left">Actions</th></tr></thead><tbody class="divide-y">${requests.map(r=>`<tr><td class="p-3 font-medium">${esc(studentLabel(r.Student))}<button onclick="openStudentEnrollmentHistory(${r.studentId},'${role}')" class="block text-xs text-primary mt-1">View enrollment history</button></td><td class="p-3">${esc(r.FromClass?.name||classLabel(r.fromClassId))} → ${esc(r.ToClass?.name||classLabel(r.toClassId))}</td><td class="p-3">${esc(r.effectiveDate)}<div class="text-xs text-muted-foreground">${esc(r.term)} · ${esc(r.academicYear)}</div></td><td class="p-3 max-w-xs">${esc(r.reason||'—')}${r.impactPreview?.requiresAcknowledgement?`<div class="mt-1 text-xs text-amber-700">Historical-impact review required</div>`:''}${Number(r.feePreview?.difference||0)!==0?`<div class="mt-1 text-xs text-muted-foreground">Fee difference: KES ${Number(r.feePreview.difference).toLocaleString()}</div>`:''}</td><td class="p-3">${statusBadge(r.status)}</td><td class="p-3"><div class="flex flex-wrap gap-2">${isAdmin&&r.status==='pending'?`<select id="transfer-fee-${r.id}" class="rounded border bg-background px-2 py-1 text-xs"><option value="keep_current_period">Keep current fee</option><option value="apply_next_period">Next period fee</option><option value="create_adjustment">Adjust now</option></select><button onclick="approveClassTransfer(${r.id})" class="px-3 py-1.5 rounded bg-primary text-white">Approve</button><button onclick="rejectClassTransfer(${r.id})" class="px-3 py-1.5 rounded border border-red-300 text-red-700">Reject</button>`:''}${['pending','scheduled','approved'].includes(r.status)?`<button onclick="cancelClassTransfer(${r.id},'${role}')" class="px-3 py-1.5 rounded border">Cancel</button>`:''}${isAdmin&&r.status==='applied'?`<button onclick="rollbackClassTransfer(${r.id})" class="px-3 py-1.5 rounded border border-red-300 text-red-700">Rollback</button>`:''}</div></td></tr>`).join('')}</tbody></table></div>`:'<div class="p-10 text-center text-muted-foreground">No class-transfer requests yet.</div>'}</section>
      <div id="student-enrollment-history-panel"></div>
    </div>`;
  }

  function readTransferForm(){return {movementType:transferType(),studentId:Number(document.getElementById('class-transfer-student')?.value||0),toClassId:Number(document.getElementById('class-transfer-target')?.value||0),targetSchoolName:document.getElementById('class-transfer-target-school')?.value?.trim()||'',targetClassName:document.getElementById('class-transfer-target-class-name')?.value?.trim()||'',effectiveDate:document.getElementById('class-transfer-date')?.value,academicYear:Number(document.getElementById('class-transfer-year')?.value||0),term:document.getElementById('class-transfer-term')?.value,reason:document.getElementById('class-transfer-reason')?.value?.trim(),note:document.getElementById('class-transfer-note')?.value?.trim()||null,feeAction:document.getElementById('class-transfer-fee-action')?.value||'keep_current_period'};}

  function filterClassTransferStudents(){
    const classId=document.getElementById('class-transfer-source')?.value||'';
    const studentSelect=document.getElementById('class-transfer-student');
    if(studentSelect){ studentSelect.innerHTML=studentOptionsForClass(transferState.options.students,classId); studentSelect.value=''; }
    const field=document.getElementById('class-transfer-current'); if(field)field.value=classId?classLabel(classId):'Select class and student';
    const target=document.getElementById('class-transfer-target'); if(target){ for(const option of target.options) option.disabled=!!classId && String(option.value)===String(classId); }
    toggleTransferType();
  }
  function updateTransferCurrentClass(){const studentId=Number(document.getElementById('class-transfer-student')?.value||0);const student=transferState.options.students.find(s=>Number(s.id)===studentId);const field=document.getElementById('class-transfer-current');if(field)field.value=student?classLabel(student.classId):'Select a student';const target=document.getElementById('class-transfer-target');if(target&&student)for(const option of target.options)option.disabled=Number(option.value)===Number(student.classId);toggleTransferType();}

  async function previewStudentClassTransfer(role){
    const payload=readTransferForm();
    if(!payload.studentId||!payload.effectiveDate||!payload.academicYear||!payload.term||!payload.reason)return showToast('Complete the student, date, year, term and reason.','error');
    if(payload.movementType==='external'&&!payload.targetSchoolName)return showToast('Enter the receiving school name.','error');
    if(payload.movementType!=='external'&&!payload.toClassId)return showToast('Select the target class.','error');
    showLoading();try{
      const response=payload.movementType==='external'?await api.admin.previewSchoolTransferOut(payload):await roleApi(role).previewClassTransfer(payload);
      const preview=unwrap(response);transferState.preview={...payload,...preview};const panel=document.getElementById('class-transfer-preview');const fee=preview.feePreview||{},impact=preview.impactPreview||{};
      const movement=payload.movementType==='external'?`${esc(preview.fromClass?.name||classLabel(transferState.options.students.find(s=>Number(s.id)===Number(payload.studentId))?.classId))} → ${esc(preview.targetSchoolName)}${preview.targetClassName?` · ${esc(preview.targetClassName)}`:''}`:`${esc(preview.fromClass?.name)} → ${esc(preview.toClass?.name)}`;
      panel.innerHTML=`<section class="rounded-2xl border bg-card p-5"><h3 class="font-semibold text-lg">Transfer review</h3><div class="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4"><div class="rounded-xl bg-muted/40 p-4"><p class="text-xs text-muted-foreground">Student</p><p class="font-semibold">${esc(preview.student?.name)}</p><p class="text-xs">${esc(preview.student?.elimuid||'')}</p></div><div class="rounded-xl bg-muted/40 p-4"><p class="text-xs text-muted-foreground">Movement</p><p class="font-semibold">${movement}</p><p class="text-xs">${payload.movementType==='external'?'Transfer to another school':'Internal class transfer'}</p></div><div class="rounded-xl bg-muted/40 p-4"><p class="text-xs text-muted-foreground">Effective</p><p class="font-semibold">${esc(preview.effectiveDate)}</p><p class="text-xs">${esc(preview.term)} · ${esc(preview.academicYear)}</p></div><div class="rounded-xl bg-muted/40 p-4"><p class="text-xs text-muted-foreground">Fee difference</p><p class="font-semibold">${payload.movementType==='external'?'N/A':`KES ${Number(fee.difference||0).toLocaleString()}`}</p><p class="text-xs">${esc(payload.movementType==='external'?'Finance records remain in this school history.':(fee.message||'Existing fees remain unchanged.'))}</p></div></div>${impact.requiresAcknowledgement?`<label class="mt-4 flex gap-2 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900"><input id="class-transfer-impact-ack" type="checkbox" class="mt-1"><span>I acknowledge that this ${payload.movementType==='external'?'transfer out':'transfer'} touches ${impact.attendanceCount||0} attendance record(s), ${impact.academicRecordCount||0} academic record(s), and ${impact.publishedReportCount||0} published report(s). These records will remain under the old class and will not be rewritten.</span></label>`:''}<div class="mt-4 rounded-xl border p-4 text-sm"><strong>History protection:</strong> The current enrollment will close on the day before ${esc(preview.effectiveDate)}. ${payload.movementType==='external'?'The learner will be marked transferred to another school.':'A new active enrollment starts on '+esc(preview.effectiveDate)+'.'} Marks, reports, payments and attendance already recorded remain unchanged.</div><div class="mt-4 flex justify-end"><button onclick="submitStudentClassTransfer('${role}')" class="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground">${payload.movementType==='external'?'Confirm Transfer Out':(role==='teacher'?'Send for Admin Approval':'Confirm Transfer')}</button></div></section>`;panel.scrollIntoView({behavior:'smooth',block:'start'});
    }catch(error){showToast(error.message||'Transfer preview failed','error');}finally{hideLoading();}
  }

  async function submitStudentClassTransfer(role){const payload={...readTransferForm(),acknowledgeHistoricalImpact:!!document.getElementById('class-transfer-impact-ack')?.checked};if(transferState.preview?.impactPreview?.requiresAcknowledgement&&!payload.acknowledgeHistoricalImpact)return showToast('Confirm the historical-record acknowledgement before continuing.','error');const external=payload.movementType==='external';if(!confirm(external?'Confirm this learner is transferring to another school?':(role==='teacher'?'Send this transfer request to the school administrator?':'Confirm this student class transfer?')))return;showLoading();try{const response=external?await api.admin.createSchoolTransferOut(payload):(role==='teacher'?await api.teacher.requestClassTransfer(payload):await api.admin.createClassTransfer(payload));{ const st=transferState.options.students.find(s=>Number(s.id)===Number(payload.studentId)); showToast(response.message||(external?`${studentLabel(st)} transferred out to ${payload.targetSchoolName}.`:`${studentLabel(st)} moved from ${classLabel(st?.classId)} to ${classLabel(payload.toClassId)}.`), 'success'); }await refreshClassTransferCentre(role);}catch(error){showToast(error.message||'Class transfer failed','error');}finally{hideLoading();}}

  async function refreshClassTransferCentre(role){const content=document.getElementById('dashboard-content');if(content)content.innerHTML=await renderClassTransferCentre(role);if(window.lucide)lucide.createIcons();}
  async function approveClassTransfer(id){const row=transferState.requests.find(r=>Number(r.id)===Number(id));const feeAction=document.getElementById(`transfer-fee-${id}`)?.value||'keep_current_period';let acknowledgeHistoricalImpact=false;if(row?.impactPreview?.requiresAcknowledgement){const impact=row.impactPreview;if(!confirm(`This backdated or same-day transfer touches ${impact.attendanceCount||0} attendance record(s), ${impact.academicRecordCount||0} academic record(s), and ${impact.publishedReportCount||0} published report(s). They will remain under the old class and will not be rewritten. Approve with this acknowledgement?`))return;acknowledgeHistoricalImpact=true;}else if(!confirm('Approve this transfer? It will apply immediately when due, or remain scheduled until its effective date.'))return;showLoading();try{const response=await api.admin.approveClassTransfer(id,{feeAction,acknowledgeHistoricalImpact});showToast(response.message||'Transfer approved','success');await refreshClassTransferCentre('admin');}catch(error){showToast(error.message||'Approval failed','error');}finally{hideLoading();}}
  async function rejectClassTransfer(id){const reason=prompt('Reason for rejecting this transfer request:');if(!reason?.trim())return;showLoading();try{await api.admin.rejectClassTransfer(id,reason.trim());showToast('Transfer request rejected','success');await refreshClassTransferCentre('admin');}catch(error){showToast(error.message||'Rejection failed','error');}finally{hideLoading();}}
  async function cancelClassTransfer(id,role){const reason=prompt('Optional cancellation reason:')||'';showLoading();try{await roleApi(role).cancelClassTransfer(id,reason.trim());showToast('Transfer request cancelled','success');await refreshClassTransferCentre(role);}catch(error){showToast(error.message||'Cancellation failed','error');}finally{hideLoading();}}
  async function rollbackClassTransfer(id){const reason=prompt('Required rollback reason:');if(!reason?.trim())return;showLoading();try{await api.admin.rollbackClassTransfer(id,reason.trim());showToast('Transfer rolled back and enrollment history preserved','success');await refreshClassTransferCentre('admin');}catch(error){showToast(error.message||'Rollback failed','error');}finally{hideLoading();}}

  function historyHtml(data){const student=data.student||{},enrollments=rows(data.enrollments);return `<section class="rounded-2xl border bg-card overflow-hidden"><div class="p-5 border-b"><h3 class="font-semibold text-lg">${esc(student.name||'Student')} enrollment history</h3><p class="text-sm text-muted-foreground">Permanent Elimu ID: ${esc(student.elimuid||'—')}</p></div>${enrollments.length?`<div class="overflow-x-auto"><table class="w-full text-sm"><thead class="bg-muted/50"><tr><th class="p-3 text-left">Class</th><th class="p-3 text-left">Academic period</th><th class="p-3 text-left">Start</th><th class="p-3 text-left">End</th><th class="p-3 text-left">Status</th><th class="p-3 text-left">Reason</th></tr></thead><tbody class="divide-y">${enrollments.map(e=>`<tr><td class="p-3 font-medium">${esc(e.Class?.name||'Unassigned')}</td><td class="p-3">${esc(e.startTerm||'—')} · ${esc(e.academicYear)}</td><td class="p-3">${esc(e.effectiveFrom)}</td><td class="p-3">${esc(e.effectiveTo||'Current')}</td><td class="p-3">${statusBadge(e.status)}</td><td class="p-3">${esc(e.movementReason||e.endedReason||'—')}</td></tr>`).join('')}</tbody></table></div>`:'<div class="p-8 text-center text-muted-foreground">No enrollment history found.</div>'}</section>`;}
  async function openStudentEnrollmentHistory(studentId,role='admin'){const panel=document.getElementById('student-enrollment-history-panel');if(panel)panel.innerHTML='<div class="rounded-xl border bg-card p-6 text-center">Loading enrollment history…</div>';try{const response=await roleApi(role).getStudentEnrollmentHistory(studentId);if(panel){panel.innerHTML=historyHtml(unwrap(response));panel.scrollIntoView({behavior:'smooth',block:'start'});}}catch(error){if(panel)panel.innerHTML=`<div class="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">${esc(error.message||'Enrollment history could not load')}</div>`;}}
  async function renderOwnEnrollmentHistory(owner='student'){try{let response;if(owner==='student')response=await api.student.getEnrollmentHistory();else{const selected=window.dashboardData?.selectedChildId||(typeof getStoredSelectedChildId==='function'?getStoredSelectedChildId():null)||localStorage.getItem('shule_selected_child_id')||window.selectedChildId||window.currentChildId;if(!selected)return '<div class="rounded-xl border bg-card p-8 text-center text-muted-foreground">Select a child first.</div>';response=await api.parent.getChildEnrollmentHistory(selected);}return `<div class="space-y-6 animate-fade-in"><div><p class="text-xs uppercase tracking-wide text-muted-foreground">Student School Cycle</p><h2 class="text-2xl font-bold">${owner==='student'?'My School History':'Child School History'}</h2><p class="text-sm text-muted-foreground">Current and previous classes remain available without changing old reports, marks or attendance.</p></div>${historyHtml(unwrap(response))}</div>`;}catch(error){return `<div class="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">${esc(error.message||'School history could not load')}</div>`;}}

  window.renderClassTransferCentre=renderClassTransferCentre;window.previewStudentClassTransfer=previewStudentClassTransfer;window.submitStudentClassTransfer=submitStudentClassTransfer;window.refreshClassTransferCentre=refreshClassTransferCentre;window.updateTransferCurrentClass=updateTransferCurrentClass;window.filterClassTransferStudents=filterClassTransferStudents;window.toggleTransferType=toggleTransferType;window.approveClassTransfer=approveClassTransfer;window.rejectClassTransfer=rejectClassTransfer;window.cancelClassTransfer=cancelClassTransfer;window.rollbackClassTransfer=rollbackClassTransfer;window.openStudentEnrollmentHistory=openStudentEnrollmentHistory;window.renderOwnEnrollmentHistory=renderOwnEnrollmentHistory;
})();
