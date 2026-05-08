(function(){
  const w=window;
  const esc=(v)=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const DAYS=['monday','tuesday','wednesday','thursday','friday'];
  const DAY_LABELS={monday:'Monday',tuesday:'Tuesday',wednesday:'Wednesday',thursday:'Thursday',friday:'Friday'};
  const DEFAULT_PERIODS=[
    {label:'Period 1',startTime:'08:00',endTime:'08:40'}, {label:'Period 2',startTime:'08:40',endTime:'09:20'},
    {label:'Period 3',startTime:'09:20',endTime:'10:00'}, {label:'Break',startTime:'10:00',endTime:'10:30',break:true},
    {label:'Period 4',startTime:'10:30',endTime:'11:10'}, {label:'Period 5',startTime:'11:10',endTime:'11:50'},
    {label:'Period 6',startTime:'11:50',endTime:'12:30'}, {label:'Lunch',startTime:'12:30',endTime:'14:00',break:true},
    {label:'Period 7',startTime:'14:00',endTime:'14:40'}, {label:'Period 8',startTime:'14:40',endTime:'15:20'},
    {label:'Period 9',startTime:'15:20',endTime:'16:00'}
  ];
  let activeTimetable=null;
  let activeTimetableId=null;
  let activeClasses=[];
  let activeTeachers=[];
  function weekStart(){const d=new Date();const day=d.getDay()||7;d.setDate(d.getDate()-day+1);return d.toISOString().slice(0,10)}
  async function req(path,opts){return await apiRequest(path,opts||{});}
  function normalizeSlots(data){
    const raw=Array.isArray(data)?data:(data?.slots||data?.timetable||data?.data?.slots||data?.data?.timetable||[]);
    const byDay={}; DAYS.forEach(d=>byDay[d]={day:d,periods:DEFAULT_PERIODS.map(p=>({...p,classes:[]}))});
    (raw||[]).forEach(dayBlock=>{
      const day=String(dayBlock.day||dayBlock.dayOfWeek||'').toLowerCase(); if(!byDay[day]) return;
      const periods=Array.isArray(dayBlock.periods)?dayBlock.periods:[];
      periods.forEach((p,idx)=>{
        const start=p.startTime||p.start||DEFAULT_PERIODS[idx]?.startTime; const target=byDay[day].periods.find(x=>x.startTime===start)||byDay[day].periods[idx]; if(!target) return;
        Object.assign(target,{...p,startTime:start,endTime:p.endTime||p.end||target.endTime,label:p.label||target.label,break:p.break||target.break});
        if(!Array.isArray(target.classes)) target.classes=p.classes? p.classes : (p.subject?[{...p}]:[]);
      });
    });
    return Object.values(byDay);
  }
  function flattenForStats(slots){const out=[];(slots||[]).forEach(d=>(d.periods||[]).forEach(p=>(p.classes&&p.classes.length?p.classes:[p]).forEach(c=>out.push({...c,day:d.day,startTime:p.startTime,endTime:p.endTime,break:p.break||c.break,label:p.label}))));return out;}
  function renderGrid(slots,{editable=false}={}){
    const normalized=normalizeSlots(slots);
    let html='<div class="timetable-v33-scroll"><div class="timetable-v33-grid"><div class="timetable-v33-cell timetable-v33-head">Time</div>'+DAYS.map(d=>`<div class="timetable-v33-cell timetable-v33-head">${DAY_LABELS[d]}</div>`).join('');
    DEFAULT_PERIODS.forEach((base,pi)=>{
      html+=`<div class="timetable-v33-cell timetable-v33-time"><strong>${esc(base.label)}</strong><br><span class="timetable-v33-meta">${esc(base.startTime)} - ${esc(base.endTime)}</span>${editable?`<br><button class="timetable-v33-btn" style="margin-top:6px;padding:4px 8px;font-size:11px" onclick="v33EditPeriod(${pi})">Edit time</button>`:''}</div>`;
      DAYS.forEach(day=>{
        const period=normalized.find(d=>d.day===day)?.periods?.[pi]||base;
        const lessons=Array.isArray(period.classes)?period.classes:[];
        const lessonHtml=period.break?`<div class="timetable-v33-lesson timetable-v33-break"><div class="timetable-v33-title">${esc(period.label||base.label)}</div><div class="timetable-v33-meta">${esc(period.startTime)} - ${esc(period.endTime)}</div></div>`:(lessons.length?lessons.map((l,li)=>`<div class="timetable-v33-lesson"><div class="timetable-v33-title">${esc(l.subject||'Free')}</div><div class="timetable-v33-meta">${esc(l.className||l.grade||'')}</div><div class="timetable-v33-meta">${esc(l.teacherName||l.teacher||'')}</div><div class="timetable-v33-meta">${esc(l.room||'')}</div>${editable?`<button class="timetable-v33-btn" style="margin-top:6px;padding:4px 8px;font-size:11px" onclick="v33EditSlot('${day}',${pi},${li})">Edit lesson</button>`:''}</div>`).join(''):`<div class="timetable-v33-lesson"><div class="timetable-v33-title">Free</div><div class="timetable-v33-meta">${esc(period.startTime)} - ${esc(period.endTime)}</div>${editable?`<button class="timetable-v33-btn" style="margin-top:6px;padding:4px 8px;font-size:11px" onclick="v33EditSlot('${day}',${pi},0)">Add lesson</button>`:''}</div>`);
        html+=`<div class="timetable-v33-cell">${lessonHtml}</div>`;
      });
    });
    return html+'</div></div>';
  }
  async function loadAdminTimetable(){
    const week=weekStart();
    const [ttRes, classRes, teacherRes]=await Promise.allSettled([req(`/api/timetable?weekStartDate=${week}`),req('/api/timetable/classes'),w.api?.admin?.getTeachers?w.api.admin.getTeachers():req('/api/admin/teachers')]);
    activeTimetable=ttRes.value?.data||null; activeTimetableId=activeTimetable?.id||null;
    activeTimetable={...(activeTimetable||{}),weekStartDate:week,slots:normalizeSlots(activeTimetable||{})};
    activeClasses=classRes.value?.data||classRes.value?.classes||[]; activeTeachers=teacherRes.value?.data||teacherRes.value?.teachers||[];
  }
  w.renderAdminTimetable=async function(){
    try{ if(w.showLoading) showLoading(); await loadAdminTimetable(); const flat=flattenForStats(activeTimetable.slots).filter(x=>x.subject&&!x.break&&!/free|break|lunch/i.test(x.subject)); if(w.hideLoading) hideLoading();
      return `<div class="timetable-v33-page space-y-6 animate-fade-in"><section class="timetable-v33-hero v12-hero"><div class="v12-hero-inner"><div><div class="v12-eyebrow">Timetable</div><h1 class="v12-title">School Timetable Management</h1><p class="v12-sub">Responsive weekly grid. Edit lessons, visible times, teachers, rooms and subjects from one place.</p></div><div class="v12-actions"><button class="timetable-v33-btn primary" onclick="v33GenerateTimetable()">Generate Timetable</button><button class="timetable-v33-btn" onclick="v33SaveTimetable()">Save Changes</button><button class="timetable-v33-btn" onclick="v33PublishTimetable()">Publish</button></div></div></section><div class="timetable-v33-layout" style="display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:16px"><div class="timetable-v33-card v12-card"><div style="display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap;margin-bottom:12px"><h3 style="font-weight:900;margin:0">Weekly Grid</h3><span class="v12-pill green">${flat.length} lessons</span></div>${renderGrid(activeTimetable.slots,{editable:true})}</div><aside class="v12-grid"><div class="timetable-v33-card v12-card"><div class="v12-label">Week</div><div class="v12-value">${esc(activeTimetable.weekStartDate)}</div></div><div class="timetable-v33-card v12-card"><div class="v12-label">Classes</div><div class="v12-value">${activeClasses.length}</div></div><div class="timetable-v33-card v12-card"><div class="v12-label">Teachers</div><div class="v12-value">${activeTeachers.length}</div></div><div class="timetable-v33-card v12-card"><h3 style="font-weight:900">Editing Rule</h3><p class="text-sm text-muted-foreground">Any visible time, subject, teacher, room or class can be edited. Click Save Changes to persist.</p></div></aside></div></div>`;
    }catch(e){ if(w.hideLoading) hideLoading(); return `<div class="timetable-v33-card v12-card"><h2>Timetable failed to load</h2><p class="text-red-500">${esc(e.message)}</p></div>`; }
  };
  w.renderTimetableGrid=function(slots){return renderGrid(slots,{editable:false});};
  w.v33EditPeriod=function(pi){
    if(!activeTimetable?.slots) return; const current=activeTimetable.slots[0]?.periods?.[pi]||DEFAULT_PERIODS[pi];
    const start=prompt('Start time (HH:MM):',current.startTime||current.start); if(!start) return;
    const end=prompt('End time (HH:MM):',current.endTime||current.end); if(!end) return;
    const label=prompt('Period label:',current.label||DEFAULT_PERIODS[pi].label)||current.label||DEFAULT_PERIODS[pi].label;
    activeTimetable.slots.forEach(day=>{ if(day.periods?.[pi]) Object.assign(day.periods[pi],{startTime:start,endTime:end,start,end,label}); });
    const grid=document.querySelector('.timetable-v33-scroll'); if(grid) grid.outerHTML=renderGrid(activeTimetable.slots,{editable:true});
  };
  w.v33EditSlot=function(day,pi,li){
    const dayBlock=activeTimetable?.slots?.find(d=>d.day===day); if(!dayBlock) return; const period=dayBlock.periods[pi]; if(!period) return;
    if(period.break){ alert('Break/lunch periods can be changed through Edit time.'); return; }
    const old=(period.classes&&period.classes[li])||{};
    const subject=prompt('Subject:',old.subject||''); if(subject===null) return;
    const teacherName=prompt('Teacher name:',old.teacherName||old.teacher||'')||'';
    const className=prompt('Class name:',old.className||'')||'';
    const room=prompt('Room:',old.room||'')||'';
    const lesson={...old,subject,teacherName,className,room,startTime:period.startTime,endTime:period.endTime};
    period.classes=period.classes||[]; period.classes[li]=lesson;
    const grid=document.querySelector('.timetable-v33-scroll'); if(grid) grid.outerHTML=renderGrid(activeTimetable.slots,{editable:true});
  };
  w.v33SaveTimetable=async function(){
    if(!activeTimetableId){ alert('Generate a timetable first before saving edits.'); return; }
    try{ if(w.showLoading) showLoading(); await req(`/api/timetable/${activeTimetableId}`,{method:'PUT',body:JSON.stringify({slots:activeTimetable.slots,classes:activeTimetable.classes||[],warnings:activeTimetable.warnings||[]})}); if(w.showToast) showToast('Timetable changes saved','success'); }
    catch(e){ if(w.showToast) showToast(e.message,'error'); else alert(e.message); } finally{ if(w.hideLoading) hideLoading(); }
  };
  w.v33GenerateTimetable=async function(){try{if(w.showLoading)showLoading();await req('/api/timetable/generate',{method:'POST',body:JSON.stringify({weekStartDate:weekStart()})});await w.showDashboardSection?.('timetable');}catch(e){w.showToast?showToast(e.message,'error'):alert(e.message)}finally{if(w.hideLoading)hideLoading();}};
  w.v33PublishTimetable=async function(){if(!activeTimetableId){alert('Generate or load a timetable first.');return;}try{await req(`/api/timetable/${activeTimetableId}/publish`,{method:'POST'});w.showToast&&showToast('Timetable published','success');}catch(e){w.showToast?showToast(e.message,'error'):alert(e.message)}};
  // Sidebar cleanup: Payment Details must not appear as a separate admin section.
  function cleanupSidebar(){document.querySelectorAll('[data-section="payment-settings"]').forEach(el=>el.remove());document.querySelectorAll('.sidebar-link').forEach(el=>{if((el.textContent||'').trim().toLowerCase()==='payment details')el.remove();});}
  const oldUpdate=w.updateSidebar; w.updateSidebar=function(role){const r=oldUpdate?oldUpdate(role):undefined; cleanupSidebar(); return r;};
  const obs=new MutationObserver(cleanupSidebar); if(document.body)obs.observe(document.body,{childList:true,subtree:true}); else document.addEventListener('DOMContentLoaded',()=>obs.observe(document.body,{childList:true,subtree:true}));
  // Analytics fail-soft: if backend still returns classId error, show a useful repair message instead of a broken page.
  const oldAnalytics=w.renderAnalyticsSection; if(oldAnalytics){w.renderAnalyticsSection=async function(role){const html=await oldAnalytics(role); if(String(html).includes('classId')&&String(html).includes('Error loading analytics')){return `<div class="v12-card"><h2 style="font-size:24px;font-weight:900">Analytics needs database repair</h2><p class="text-sm text-muted-foreground">The live database still lacks the exact quoted column <strong>Students.classId</strong>. Deploy backend v33 and run <strong>backend/RENDER_CLASSID_FORCE_FIX_V33.sql</strong> once in Render/Postgres.</p></div>`;} return html;};}
})();
