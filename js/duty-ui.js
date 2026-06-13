// Shule AI v146 - simplified, role-safe Duty UI
(function (w) {
  'use strict';
  const state = { today:null, week:[], config:null, report:null, gps:null, points:[], slots:[], scanner:null };
  const e = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const val = id => document.getElementById(id)?.value || '';
  const checked = id => !!document.getElementById(id)?.checked;
  const todayIso = () => new Date().toISOString().slice(0,10);
  function toast(message,type='info'){ if(typeof w.showToast==='function') w.showToast(message,type); }
  function busy(on){ if(on && typeof w.showLoading==='function') w.showLoading(); if(!on && typeof w.hideLoading==='function') w.hideLoading(); }
  function unwrap(res){ return res?.data ?? res ?? null; }

  function gps() {
    return new Promise((resolve,reject) => {
      if(!navigator.geolocation) return reject(new Error('Location is not supported on this device.'));
      navigator.geolocation.getCurrentPosition(p => resolve({ latitude:p.coords.latitude, longitude:p.coords.longitude, accuracy:p.coords.accuracy, capturedAt:new Date().toISOString() }), err => reject(new Error(err.message || 'Location permission was not granted.')), { enableHighAccuracy:true, timeout:15000, maximumAge:30000 });
    });
  }

  function dutyLabel(d){ return [d?.area || d?.type || 'Duty', d?.timeSlot?.start && d?.timeSlot?.end ? `${d.timeSlot.start}–${d.timeSlot.end}` : ''].filter(Boolean).join(' • '); }
  function dutyStatus(d){
    if(!d) return {text:'No duty',cls:'bg-slate-100 text-slate-700'};
    if(d.checkedOut || d.status==='completed') return {text:'Completed',cls:'bg-green-100 text-green-700'};
    if(d.status==='rejected') return {text:'Verification rejected',cls:'bg-red-100 text-red-700'};
    if(d.checkedIn || ['checked_in','late'].includes(d.status)) return {text:d.status==='late'?'Checked in late':'Checked in',cls:'bg-amber-100 text-amber-800'};
    return {text:'Scheduled',cls:'bg-blue-100 text-blue-700'};
  }

  w.renderAdminSmartDuty = async function renderAdminSmartDuty(){
    return `<div class="space-y-5 animate-fade-in" id="duty-admin-v145">
      <section class="rounded-xl border bg-card p-6">
        <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div><div class="text-xs font-semibold uppercase tracking-wide text-primary">Duty management</div><h2 class="text-2xl font-bold">Create and monitor the duty roster</h2><p class="text-muted-foreground">Generate duties, review today’s assignments and check attendance. Advanced verification is optional.</p></div>
          <button class="px-4 py-2 border rounded-lg" onclick="v145LoadAdminDuty()">Refresh</button>
        </div>
      </section>
      <section class="grid gap-4 lg:grid-cols-[340px_minmax(0,1fr)]">
        <div class="rounded-xl border bg-card p-5 space-y-4">
          <h3 class="font-bold text-lg">Generate roster</h3>
          <label class="block text-sm">From<input id="duty-start-v145" type="date" class="mt-1 w-full rounded-lg border p-2" value="${todayIso()}"></label>
          <label class="block text-sm">To<input id="duty-end-v145" type="date" class="mt-1 w-full rounded-lg border p-2"></label>
          <details open class="rounded-lg border p-3"><summary class="cursor-pointer font-medium">Duty points and times</summary>
            <div class="pt-3 space-y-4 text-sm">
              <div><div class="flex items-center justify-between"><strong>Duty points</strong><button onclick="v146AddDutyPoint()" class="rounded border px-2 py-1">+ Point</button></div><div id="duty-points-v146" class="mt-2 space-y-2"></div></div>
              <div><div class="flex items-center justify-between"><strong>Duty schedules</strong><button onclick="v146AddDutySlot()" class="rounded border px-2 py-1">+ Time</button></div><div id="duty-slots-v146" class="mt-2 space-y-2"></div></div>
              <button class="w-full rounded-lg border px-3 py-2" onclick="v145SaveDutyConfig()">Save points and times</button>
            </div>
          </details>
          <details class="rounded-lg border p-3">
            <summary class="cursor-pointer font-medium">Arrival verification</summary>
            <div class="space-y-3 pt-3 text-sm">
              <label class="flex items-center justify-between gap-3"><span>Require GPS</span><input id="duty-gps-v145" type="checkbox"></label>
              <label class="flex items-center justify-between gap-3"><span>Require QR scan</span><input id="duty-qr-v145" type="checkbox"></label>
              <label class="block">Allowed radius (metres)<input id="duty-radius-v145" type="number" min="20" class="mt-1 w-full rounded-lg border p-2" value="150"></label>
              <div class="grid grid-cols-2 gap-2"><input id="duty-lat-v145" type="number" step="any" class="rounded-lg border p-2" placeholder="Latitude"><input id="duty-lng-v145" type="number" step="any" class="rounded-lg border p-2" placeholder="Longitude"></div>
              <button class="w-full rounded-lg border px-3 py-2" onclick="v145UseSchoolLocation()">Use my current location</button>
              <button class="w-full rounded-lg border px-3 py-2" onclick="v145SaveDutyConfig()">Save verification settings</button>
              <div id="duty-token-v145" class="rounded-lg bg-muted p-3 text-center text-xs"></div>
            </div>
          </details>
        </div>
        <div class="space-y-4">
          <div id="duty-summary-v145" class="grid gap-3 sm:grid-cols-4"></div>
          <div class="rounded-xl border bg-card p-5"><div class="flex items-center justify-between"><div><h3 class="font-bold text-lg">Today’s roster</h3><p class="text-sm text-muted-foreground">Assignments and live check-in status</p></div><span id="duty-date-v145" class="text-sm"></span></div><div id="duty-roster-v145" class="mt-4 overflow-x-auto"><p class="text-muted-foreground">Loading…</p></div></div>
          <div class="rounded-xl border bg-card p-5"><h3 class="font-bold text-lg">This week</h3><div id="duty-week-v145" class="mt-4 overflow-x-auto"><p class="text-muted-foreground">Loading…</p></div></div>
        </div>
      </section>
    </div>`;
  };

  w.v145LoadAdminDuty = async function(){
    try {
      const [todayR,weekR,configR,reportR] = await Promise.allSettled([api.duty.getTodayDuty(),api.duty.getWeeklyDuty(),api.duty.getVerificationConfig(),api.duty.getComplianceReport(todayIso())]);
      state.today=unwrap(todayR.value)||{}; state.week=unwrap(weekR.value)||[]; state.config=unwrap(configR.value)||{}; state.report=unwrap(reportR.value)||{};
      const settings=state.config.settings||{};
      state.points=Array.isArray(settings.dutyPoints)?settings.dutyPoints.slice():[];
      state.slots=Array.isArray(settings.dutySlots)?settings.dutySlots.slice():[];
      if(!state.points.length) state.points=[{id:'main-gate',name:'Main Gate',description:'',active:true}];
      if(!state.slots.length) state.slots=[{id:'morning',label:'Morning Duty',pointId:state.points[0].id,start:'07:00',end:'08:00',teachersPerSlot:2,active:true}];
      const set=(id,v)=>{const x=document.getElementById(id);if(x&&v!==undefined&&v!==null)x.value=v}; const chk=(id,v)=>{const x=document.getElementById(id);if(x)x.checked=!!v};
      chk('duty-gps-v145',settings.requireGps); chk('duty-qr-v145',settings.requireQr); set('duty-radius-v145',settings.radiusMeters||150); set('duty-lat-v145',settings.schoolLat||''); set('duty-lng-v145',settings.schoolLng||'');
      const token=document.getElementById('duty-token-v145'); if(token) token.innerHTML=state.config.todayQrDataUrl ? `<img src="${e(state.config.todayQrDataUrl)}" alt="Duty QR" class="mx-auto h-56 w-56 rounded-lg bg-white p-2"><p class="mt-2">Display this QR at the duty point on a separate device.</p>` : (settings.requireQr?'<p>QR unavailable. Save settings and refresh.</p>':'<p>QR verification is off.</p>');
      renderDutyConfigRows(); renderAdminData();
    } catch(err){ toast(err.message||'Could not load Duty','error'); }
  };

  function renderAdminData(){
    const duties=Array.isArray(state.today?.duties)?state.today.duties:[]; const summary=state.report?.summary||{};
    const cards=[['Assigned',duties.length],['Checked in',summary.checkedIn ?? duties.filter(d=>d.checkedIn&&d.status!=='rejected').length],['Late',summary.late ?? duties.filter(d=>d.status==='late').length],['Not checked in',summary.notCheckedIn ?? duties.filter(d=>!d.checkedIn).length]];
    const sr=document.getElementById('duty-summary-v145'); if(sr) sr.innerHTML=cards.map(([a,b])=>`<div class="rounded-xl border bg-card p-4"><span class="text-sm text-muted-foreground">${e(a)}</span><strong class="block text-2xl">${e(b)}</strong></div>`).join('');
    const date=document.getElementById('duty-date-v145'); if(date) date.textContent=state.today?.date||todayIso();
    const root=document.getElementById('duty-roster-v145'); if(root) root.innerHTML=duties.length?`<table class="w-full min-w-[680px] text-sm"><thead><tr><th class="text-left p-2">Teacher</th><th class="text-left p-2">Duty</th><th class="text-left p-2">Status</th><th class="text-left p-2">Time</th></tr></thead><tbody>${duties.map(d=>{const st=dutyStatus(d);return `<tr class="border-t"><td class="p-2 font-medium">${e(d.teacherName||'Teacher')}</td><td class="p-2">${e(d.area||d.type||'Duty')}</td><td class="p-2"><span class="rounded-full px-2 py-1 text-xs ${st.cls}">${e(st.text)}</span></td><td class="p-2">${e(d.timeSlot?.start||'')} ${d.timeSlot?.end?'– '+e(d.timeSlot.end):''}</td></tr>`}).join('')}</tbody></table>`:'<div class="rounded-lg bg-muted/40 p-5 text-muted-foreground">No roster exists for today. Choose dates and generate one.</div>';
    const wr=document.getElementById('duty-week-v145'); if(wr) wr.innerHTML=Array.isArray(state.week)&&state.week.length?`<div class="grid gap-2">${state.week.map(day=>`<div class="rounded-lg border p-3"><div class="flex justify-between"><strong>${e(day.dayName)}</strong><span class="text-sm text-muted-foreground">${e(day.date)}</span></div><div class="mt-2 text-sm">${(day.duties||[]).length?(day.duties||[]).map(d=>`${e(d.teacherName||'Teacher')} — ${e(d.area||d.type||'Duty')}`).join('<br>'):'No duties'}</div></div>`).join('')}</div>`:'<p class="text-muted-foreground">No weekly roster found.</p>';
  }

  w.v145GenerateDuty = async function(){
    const start=val('duty-start-v145')||todayIso(); let end=val('duty-end-v145'); if(!end){const d=new Date(start);d.setDate(d.getDate()+6);end=d.toISOString().slice(0,10);}
    try{busy(true);const res=await api.duty.generate(start,end);toast(res.message||'Duty roster generated','success');await w.v145LoadAdminDuty();}catch(err){toast(err.message||'Duty generation failed','error')}finally{busy(false)}
  };
  w.v145UseSchoolLocation = async function(){try{busy(true);state.gps=await gps();const lat=document.getElementById('duty-lat-v145'),lng=document.getElementById('duty-lng-v145');if(lat)lat.value=state.gps.latitude;if(lng)lng.value=state.gps.longitude;toast('School location captured','success')}catch(err){toast(err.message,'error')}finally{busy(false)}};
  w.v145SaveDutyConfig = async function(){try{busy(true);await api.duty.updateVerificationConfig({requireGps:checked('duty-gps-v145'),requireQr:checked('duty-qr-v145'),radiusMeters:Number(val('duty-radius-v145')||150),schoolLat:Number(val('duty-lat-v145')||0),schoolLng:Number(val('duty-lng-v145')||0),dutyPoints:readDutyPoints(),dutySlots:readDutySlots()});toast('Duty verification settings saved','success');await w.v145LoadAdminDuty()}catch(err){toast(err.message||'Could not save settings','error')}finally{busy(false)}};

  w.renderTeacherSmartDuty = async function(){
    return `<div class="space-y-5 animate-fade-in" id="duty-teacher-v145">
      <section class="rounded-xl border bg-card p-6"><div class="text-xs font-semibold uppercase tracking-wide text-primary">My duty</div><h2 class="text-2xl font-bold">Today’s assignment</h2><p class="text-muted-foreground">One clear check-in and check-out flow. GPS or QR appears only when your school requires it.</p></section>
      <section class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div class="rounded-xl border bg-card p-6"><div class="flex items-start justify-between gap-3"><div><h3 id="teacher-duty-title-v145" class="text-xl font-bold">Loading…</h3><p id="teacher-duty-time-v145" class="text-muted-foreground"></p></div><span id="teacher-duty-status-v145" class="rounded-full px-3 py-1 text-sm"></span></div><div id="teacher-duty-verification-v145" class="mt-5 space-y-3"></div><label class="mt-4 block text-sm">Optional note<textarea id="teacher-duty-note-v145" class="mt-1 w-full rounded-lg border p-2" rows="2"></textarea></label><div class="mt-4 flex flex-wrap gap-3"><button id="teacher-duty-in-v145" class="rounded-lg bg-primary px-4 py-2 text-white" onclick="v145TeacherDutyAction('in')">Check in</button><button id="teacher-duty-out-v145" class="rounded-lg border px-4 py-2" onclick="v145TeacherDutyAction('out')">Check out</button></div></div>
        <aside class="rounded-xl border bg-card p-5"><h3 class="font-bold">This week</h3><div id="teacher-duty-week-v145" class="mt-3 space-y-2 text-sm">Loading…</div></aside>
      </section>
    </div>`;
  };

  w.v145LoadTeacherDuty = async function(){
    try{
      const [todayR,weekR,configR]=await Promise.allSettled([api.duty.getTodayDuty(),api.duty.getWeeklyDuty(),api.duty.getVerificationConfig()]);
      state.today=unwrap(todayR.value)||{};state.week=unwrap(weekR.value)||[];state.config=unwrap(configR.value)||{};
      const d=state.today.duty || state.today.duties?.[0] || null; const st=dutyStatus(d);
      const title=document.getElementById('teacher-duty-title-v145');if(title)title.textContent=d?dutyLabel(d):'No duty assigned today';
      const time=document.getElementById('teacher-duty-time-v145');if(time)time.textContent=d?`${state.today.date||todayIso()} • ${d.teacherName||''}`:'You do not need to check in.';
      const status=document.getElementById('teacher-duty-status-v145');if(status){status.textContent=st.text;status.className=`rounded-full px-3 py-1 text-sm ${st.cls}`}
      const verification=state.config.settings||{}; const vr=document.getElementById('teacher-duty-verification-v145');if(vr)vr.innerHTML=[verification.requireGps?'<div class="rounded-lg bg-muted/50 p-3 text-sm">Location verification is required.</div>':'',verification.requireQr?'<div class="space-y-2"><button onclick="v146StartDutyScanner()" class="w-full rounded-lg border px-3 py-2">Scan duty QR with camera</button><label class="block text-sm">Or enter token manually<input id="teacher-duty-qr-v145" class="mt-1 w-full rounded-lg border p-2" placeholder="QR token"></label><div id="duty-scanner-v146"></div></div>':''].filter(Boolean).join('') || '<div class="rounded-lg bg-muted/50 p-3 text-sm">No extra verification is required.</div>';
      const inBtn=document.getElementById('teacher-duty-in-v145'),outBtn=document.getElementById('teacher-duty-out-v145');if(inBtn)inBtn.disabled=!d||!!d.checkedIn;if(outBtn)outBtn.disabled=!d||!d.checkedIn||!!d.checkedOut;
      const wr=document.getElementById('teacher-duty-week-v145');if(wr)wr.innerHTML=(state.week||[]).filter(x=>(x.duties||[]).length).map(x=>`<div class="rounded-lg border p-3"><strong>${e(x.dayName)}</strong><div>${(x.duties||[]).map(d=>e(dutyLabel(d))).join('<br>')}</div></div>`).join('')||'<p class="text-muted-foreground">No duties this week.</p>';
    }catch(err){toast(err.message||'Could not load your duty','error')}
  };

  w.v145TeacherDutyAction = async function(action){
    const d=state.today?.duty||state.today?.duties?.[0];if(!d)return toast('No duty is assigned today','warning');
    const settings=state.config?.settings||{}; const payload={notes:val('teacher-duty-note-v145'),deviceInfo:{userAgent:navigator.userAgent,capturedAt:new Date().toISOString()}};
    try{busy(true);if(settings.requireGps)payload.gps=await gps();if(settings.requireQr){payload.qrToken=val('teacher-duty-qr-v145').trim();if(!payload.qrToken)throw new Error('Enter today’s duty QR token.');}
      let res;if(settings.requireGps||settings.requireQr)res=action==='in'?await api.duty.verifiedCheckIn(payload):await api.duty.verifiedCheckOut(payload);else res=action==='in'?await api.duty.checkIn({location:'School',notes:payload.notes}):await api.duty.checkOut({location:'School',notes:payload.notes});toast(res.message||`Checked ${action==='in'?'in':'out'}`,'success');await w.v145LoadTeacherDuty();
    }catch(err){toast(err.message||'Duty action failed','error')}finally{busy(false)}
  };


  function renderDutyConfigRows(){
    const points=document.getElementById('duty-points-v146');if(points)points.innerHTML=state.points.map((p,i)=>`<div class="rounded-lg border p-2 grid gap-2"><div class="flex gap-2"><input data-duty-point-name="${i}" class="min-w-0 flex-1 rounded border p-2" value="${e(p.name||'')}" placeholder="Point name"><button onclick="v146RemoveDutyPoint(${i})" class="text-red-600">Remove</button></div><input data-duty-point-description="${i}" class="rounded border p-2" value="${e(p.description||'')}" placeholder="Description (optional)"></div>`).join('');
    const slots=document.getElementById('duty-slots-v146');if(slots)slots.innerHTML=state.slots.map((slot,i)=>`<div class="rounded-lg border p-2 space-y-2"><div class="flex gap-2"><input data-duty-slot-label="${i}" class="min-w-0 flex-1 rounded border p-2" value="${e(slot.label||'')}" placeholder="Schedule name"><button onclick="v146RemoveDutySlot(${i})" class="text-red-600">Remove</button></div><select data-duty-slot-point="${i}" class="w-full rounded border p-2">${state.points.map(p=>`<option value="${e(p.id)}" ${String(p.id)===String(slot.pointId)?'selected':''}>${e(p.name)}</option>`).join('')}</select><div class="grid grid-cols-3 gap-2"><input data-duty-slot-start="${i}" type="time" class="rounded border p-2" value="${e(slot.start||'07:00')}"><input data-duty-slot-end="${i}" type="time" class="rounded border p-2" value="${e(slot.end||'08:00')}"><input data-duty-slot-teachers="${i}" type="number" min="1" class="rounded border p-2" value="${Number(slot.teachersPerSlot||1)}" title="Teachers"></div></div>`).join('');
  }
  function readDutyPoints(){return state.points.map((p,i)=>({...p,id:p.id||`point-${i+1}`,name:document.querySelector(`[data-duty-point-name="${i}"]`)?.value?.trim()||'',description:document.querySelector(`[data-duty-point-description="${i}"]`)?.value?.trim()||''})).filter(p=>p.name);}
  function readDutySlots(){const points=readDutyPoints();return state.slots.map((slot,i)=>({...slot,id:slot.id||`slot-${i+1}`,label:document.querySelector(`[data-duty-slot-label="${i}"]`)?.value?.trim()||'',pointId:document.querySelector(`[data-duty-slot-point="${i}"]`)?.value||points[0]?.id||'',start:document.querySelector(`[data-duty-slot-start="${i}"]`)?.value||'07:00',end:document.querySelector(`[data-duty-slot-end="${i}"]`)?.value||'08:00',teachersPerSlot:Number(document.querySelector(`[data-duty-slot-teachers="${i}"]`)?.value||1)})).filter(s=>s.label&&s.pointId);}
  w.v146AddDutyPoint=function(){state.points=readDutyPoints();state.points.push({id:`point-${Date.now()}`,name:'New Duty Point',description:'',active:true});renderDutyConfigRows();};
  w.v146RemoveDutyPoint=function(i){state.points=readDutyPoints();if(state.points.length<=1)return toast('Keep at least one duty point.','warning');const removed=state.points.splice(i,1)[0];state.slots=readDutySlots().map(s=>String(s.pointId)===String(removed.id)?{...s,pointId:state.points[0].id}:s);renderDutyConfigRows();};
  w.v146AddDutySlot=function(){state.points=readDutyPoints();state.slots=readDutySlots();state.slots.push({id:`slot-${Date.now()}`,label:'New Duty Time',pointId:state.points[0]?.id||'',start:'07:00',end:'08:00',teachersPerSlot:1,active:true});renderDutyConfigRows();};
  w.v146RemoveDutySlot=function(i){state.slots=readDutySlots();state.slots.splice(i,1);renderDutyConfigRows();};
  w.v146StartDutyScanner=async function(){const host=document.getElementById('duty-scanner-v146');if(!host)return; if(!('BarcodeDetector' in window)){host.innerHTML='<p class="text-xs text-amber-700">Camera QR scanning is not supported by this browser. Enter the token manually.</p>';return;}try{const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}});host.innerHTML='<video id="duty-scan-video-v146" class="mt-2 w-full rounded-lg" autoplay playsinline></video><button onclick="v146StopDutyScanner()" class="mt-2 rounded border px-3 py-1">Stop camera</button>';const video=document.getElementById('duty-scan-video-v146');video.srcObject=stream;state.scanner={stream,stopped:false};const detector=new BarcodeDetector({formats:['qr_code']});const scan=async()=>{if(state.scanner?.stopped)return;try{const codes=await detector.detect(video);if(codes[0]?.rawValue){const input=document.getElementById('teacher-duty-qr-v145');if(input)input.value=codes[0].rawValue;toast('Duty QR scanned.','success');w.v146StopDutyScanner();return;}}catch(_){}requestAnimationFrame(scan)};requestAnimationFrame(scan);}catch(err){host.innerHTML=`<p class="text-xs text-red-600">${e(err.message||'Camera could not start.')}</p>`;}};
  w.v146StopDutyScanner=function(){if(state.scanner){state.scanner.stopped=true;state.scanner.stream?.getTracks?.().forEach(t=>t.stop());state.scanner=null;}const host=document.getElementById('duty-scanner-v146');if(host)host.innerHTML='';};

  // Make the simplified v145 screen the single visible Duty UI.
  w.renderTeacherDuty = w.renderTeacherSmartDuty;
  w.v12RenderTeacherDuty = w.renderTeacherSmartDuty;

  // Backwards-compatible names used by dashboard-controller and older buttons.
  w.v93LoadAdminDuty=w.v145LoadAdminDuty; w.v93GenerateDutyRoster=w.v145GenerateDuty; w.v93SaveDutyConfig=w.v145SaveDutyConfig; w.v93UseCurrentLocationAsSchool=w.v145UseSchoolLocation;
  w.v93LoadTeacherDuty=w.v145LoadTeacherDuty; w.v93TeacherCheckIn=()=>w.v145TeacherDutyAction('in'); w.v93TeacherCheckOut=()=>w.v145TeacherDutyAction('out');
  w.v93CaptureTeacherGps=async()=>{try{state.gps=await gps();toast('Location captured','success')}catch(err){toast(err.message,'error')}};
})(window);

// Compatibility alias for the original admin Duty button. The visible Duty module
// has one owner; old dashboard buttons delegate to it instead of throwing.
window.handleGenerateDutyRoster = function(){
  if (typeof window.v145GenerateDuty === 'function') return window.v145GenerateDuty();
  if (typeof showToast === 'function') showToast('Duty module is still loading.', 'warning');
};
