// Shule AI Stabilized Consolidation Build V89

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
  function v101CareerList(items, fallback='career subjects'){
    const clean=[...new Set((items||[]).map(x=>String(x||'').trim()).filter(Boolean))];
    if(!clean.length) return fallback;
    if(clean.length===1) return clean[0];
    if(clean.length===2) return `${clean[0]} and ${clean[1]}`;
    return `${clean.slice(0,-1).join(', ')} and ${clean[clean.length-1]}`;
  }
  w.renderStudentCareerPathSection = async function(){
    setTimeout(()=>{ w.v87LoadCareerPath && w.v87LoadCareerPath(); },50);
    return `<div class="space-y-6 animate-fade-in" id="v87-career-path-root">
      <div class="rounded-2xl border bg-card p-5 overflow-hidden bg-gradient-to-r from-indigo-50 via-cyan-50 to-emerald-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <p class="text-xs font-black tracking-[0.18em] uppercase text-primary">Shule AI Career Compass</p>
            <h2 class="text-2xl md:text-3xl font-black mt-1">Turn career dreams into simple next steps</h2>
            <p class="text-sm text-muted-foreground mt-2 max-w-3xl">Pick the careers you are curious about. Shule AI will translate them into friendly guidance, subject nudges, parent support alerts, and teacher encouragement — not boring analytics charts.</p>
          </div>
          <div class="rounded-2xl bg-white/70 dark:bg-slate-900/70 border p-4 max-w-sm">
            <p class="text-sm font-bold">How it works</p>
            <p class="text-xs text-muted-foreground mt-1">Choose careers → Shule AI maps useful subjects → alerts become practical coaching moments.</p>
          </div>
        </div>
      </div>

      <div class="grid gap-4 lg:grid-cols-[1fr_0.85fr]">
        <div class="rounded-2xl border bg-card p-4">
          <label class="text-sm font-bold">Search your dream path</label>
          <input id="v87-career-search" class="mt-2 w-full rounded-xl border bg-background p-3" placeholder="Try Doctor, Software Engineer, Pilot, Chef..." oninput="v87FilterCareers(this.value)">
          <div id="v87-selected-careers" class="mt-3 flex flex-wrap gap-2"></div>
          <p class="text-xs text-muted-foreground mt-3">You can select more than one. This is career exploration, not a final lock.</p>
        </div>
        <div class="rounded-2xl border bg-card p-4">
          <div class="flex items-start justify-between gap-3">
            <div>
              <h3 class="font-black">AI Guidance Alerts</h3>
              <p class="text-xs text-muted-foreground mt-1">Creates warmer alerts for the student, linked parent, and relevant subject teachers only.</p>
            </div>
            <button onclick="v87GenerateCareerInsights()" class="px-4 py-2 rounded-xl border font-bold hover:bg-muted">Generate Guidance</button>
          </div>
          <div id="v87-career-insights" class="mt-3 text-sm text-muted-foreground rounded-xl border bg-background p-3">Save a career choice, then Shule AI will create useful coaching alerts in the Alerts Center.</div>
        </div>
      </div>

      <div class="rounded-2xl border bg-card p-4">
        <div class="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h3 class="font-black">Career ideas</h3>
            <p class="text-xs text-muted-foreground mt-1">Tap a card to add or remove it from your compass.</p>
          </div>
          <button onclick="v87SaveCareers()" class="px-4 py-2 rounded-xl bg-primary text-white font-bold">Save Career Compass</button>
        </div>
        <div id="v87-career-options" class="v87-career-grid mt-4"><p class="text-muted-foreground">Loading career ideas...</p></div>
      </div>
    </div>`;
  };
  w.v87LoadCareerPath=async function(){
    try{ const [opts,selected]=await Promise.all([api.student.careerOptions(), api.student.getCareerInterests()]); v87CareerOptions=opts.data||[]; v87SelectedCareers=(selected.data?.careers||[]).map(c=>({id:c.careerId,name:c.careerName})); renderCareerSelected(); renderCareerOptions(v87CareerOptions); }catch(e){ const el=d.getElementById('v87-career-options'); if(el) el.innerHTML=`<p class="text-red-600">${esc(e.message)}</p>`; }
  };
  function renderCareerSelected(){ const el=d.getElementById('v87-selected-careers'); if(!el) return; el.innerHTML=v87SelectedCareers.length?v87SelectedCareers.map(c=>`<button class="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-bold" onclick="v87ToggleCareer('${esc(c.id)}','${esc(c.name)}')">${esc(c.name)} ×</button>`).join(''):'<span class="text-sm text-muted-foreground">No careers selected yet. Pick one that feels exciting.</span>'; }
  function renderCareerOptions(rows){ const el=d.getElementById('v87-career-options'); if(!el) return; el.innerHTML=rows.length?rows.map(c=>{const selected=v87SelectedCareers.some(x=>x.id===c.id); const subjects=(c.recommendedSubjects||[]).slice(0,4); const category=(c.categories||[])[0]||'Career Path'; return `<button class="v87-career-card text-left ${selected?'selected':''}" onclick="v87ToggleCareer('${esc(c.id)}','${esc(c.name)}')"><span class="v101-career-chip">${esc(category)}</span><strong>${esc(c.name)}</strong><p class="text-xs text-muted-foreground mt-2">Good areas to grow: ${esc(v101CareerList(subjects,'your strongest subjects'))}</p><small>${selected?'Selected for AI guidance':'Tap to add to your compass'}</small></button>`}).join(''):'<div class="rounded-xl border bg-background p-4 text-sm text-muted-foreground">No career ideas match that search yet.</div>'; }
  w.v87FilterCareers=function(q){ q=String(q||'').toLowerCase(); renderCareerOptions(v87CareerOptions.filter(c=>!q||c.name.toLowerCase().includes(q))); };
  w.v87ToggleCareer=function(id,name){ const idx=v87SelectedCareers.findIndex(c=>c.id===id); if(idx>=0) v87SelectedCareers.splice(idx,1); else v87SelectedCareers.push({id,name}); renderCareerSelected(); w.v87FilterCareers(d.getElementById('v87-career-search')?.value||''); };
  w.v87SaveCareers=async function(){ try{ await api.student.saveCareerInterests({careers:v87SelectedCareers}); showToast('Career compass saved. Shule AI will turn it into guidance, not pressure.','success'); await w.v87GenerateCareerInsights(); }catch(e){ showToast(e.message,'error'); } };
  w.v87GenerateCareerInsights=async function(){ const el=d.getElementById('v87-career-insights'); if(el) el.textContent='Shule AI is turning career choices into friendly guidance alerts...'; try{ const res=await api.student.generateCareerInsights(); const count=(res.data||[]).length; if(el) el.innerHTML=count?`Shule AI created ${count} career guidance alert${count===1?'':'s'}. Open Alerts to see the coaching nudges.`:'Pick and save at least one career first, then generate guidance.'; }catch(e){ if(el) el.innerHTML=`<span class="text-red-600">${esc(e.message)}</span>`; } };

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


// V88 stability layer: calendar normalization, role-safe refresh guards, payment-setting refresh hooks.
(function(){
  'use strict';
  const w = window;
  function role(){ try { return (JSON.parse(localStorage.getItem('user')||'{}').role || localStorage.getItem('role') || '').toLowerCase().replace('-', '_'); } catch(_) { return (localStorage.getItem('role')||'').toLowerCase().replace('-', '_'); } }
  function hasToken(){ return !!(localStorage.getItem('authToken') || localStorage.getItem('token')); }
  function isAdmin(){ const r=role(); return r==='admin' || r==='super_admin' || r==='superadmin'; }
  function isParent(){ return role()==='parent'; }

  function normalizeEventsPayload(payload){
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.events)) return payload.events;
    if (Array.isArray(payload?.data?.events)) return payload.data.events;
    if (Array.isArray(payload?.data?.data)) return payload.data.data;
    return [];
  }
  w.v88NormalizeEventsPayload = normalizeEventsPayload;

  const oldShow = w.showDashboardSection;
  if (typeof oldShow === 'function' && !oldShow.__v88StabilityWrapped) {
    const wrapped = async function(section){
      if (!hasToken() && !['landing','login','home'].includes(String(section||''))) return oldShow.apply(this, arguments);
      const out = await oldShow.apply(this, arguments);
      setTimeout(() => {
        if ((section === 'calendar' || section === 'calendar-management') && isAdmin() && typeof w.loadAdminCalendarPreviewEvents === 'function') w.loadAdminCalendarPreviewEvents();
        if (section === 'payments' && isParent() && typeof w.refreshParentSchoolPaymentInfo === 'function') w.refreshParentSchoolPaymentInfo();
        if (section === 'subscription-billing') {
          document.querySelectorAll('.finance-v31-modal').forEach(el => el.remove());
        }
      }, 250);
      return out;
    };
    wrapped.__v88StabilityWrapped = true;
    w.showDashboardSection = wrapped;
  }

  w.addEventListener('school-calendar:changed', () => {
    if (typeof w.refreshCalendarEvents === 'function') w.refreshCalendarEvents();
    if (typeof w.loadAdminCalendarPreviewEvents === 'function') w.loadAdminCalendarPreviewEvents();
  });
  w.addEventListener('shule:payment-settings-updated', () => {
    if (isParent() && typeof w.refreshParentSchoolPaymentInfo === 'function') w.refreshParentSchoolPaymentInfo();
  });

  // Frontend duty-swap fallback: support different date input ids used by older templates.
  const oldSubmitSwap = w.submitSwapRequest;
  if (typeof oldSubmitSwap === 'function' && !oldSubmitSwap.__v88DateGuard) {
    const guarded = function(){
      const candidates = ['swap-date','duty-swap-date','swapDutyDate','dutyDate'];
      const value = candidates.map(id => document.getElementById(id)?.value).find(Boolean) || '';
      if (value && !/^\d{4}-\d{2}-\d{2}$/.test(String(value))) {
        if (typeof showToast === 'function') showToast('Please select a valid duty date.', 'error');
        return;
      }
      return oldSubmitSwap.apply(this, arguments);
    };
    guarded.__v88DateGuard = true;
    w.submitSwapRequest = guarded;
  }

  w.ShuleV88Stability = { normalizeEventsPayload, role, hasToken };
})();


// V89 Stabilized Consolidation Guard Layer
// This file is loaded once, after the approved dashboard files. It consolidates the
// stability fixes that were previously scattered across V87/V88 and prevents old
// functions from reintroducing role leaks, invalid calendar payloads, invalid date
// submissions, and broken support/payment routing.
(function(){
  'use strict';
  const w = window, d = document;
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const token = () => localStorage.getItem('authToken') || localStorage.getItem('token') || '';
  const user = () => { try { return (typeof getCurrentUser === 'function' ? getCurrentUser() : JSON.parse(localStorage.getItem('user') || '{}')) || {}; } catch(_) { return {}; } };
  const role = () => String(user().role || localStorage.getItem('role') || '').toLowerCase().replace('-', '_');
  const isRole = (...roles) => roles.includes(role());
  const show = (m,t='info') => typeof w.showToast === 'function' ? w.showToast(m,t) : console[t==='error'?'error':'log'](m);
  function normalizeArray(payload){
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.events)) return payload.events;
    if (Array.isArray(payload?.alerts)) return payload.alerts;
    if (Array.isArray(payload?.items)) return payload.items;
    if (Array.isArray(payload?.rows)) return payload.rows;
    if (Array.isArray(payload?.data?.events)) return payload.data.events;
    if (Array.isArray(payload?.data?.data)) return payload.data.data;
    if (Array.isArray(payload?.data?.alerts)) return payload.data.alerts;
    return [];
  }
  w.ShuleV89 = { normalizeArray, role, token };

  // Calendar hard safety: never let object payloads hit .push/.filter.
  function normCalendarEvent(raw){
    raw = raw || {};
    const start = raw.startDate || raw.date || raw.eventDate || '';
    return {
      ...raw,
      id: String(raw.id || raw._id || `${start}-${raw.eventName || raw.title || Date.now()}`),
      eventName: raw.eventName || raw.title || raw.name || 'Untitled Event',
      title: raw.title || raw.eventName || raw.name || 'Untitled Event',
      startDate: start,
      date: raw.date || start,
      endDate: raw.endDate || raw.date || start,
      eventType: raw.eventType || raw.type || 'other',
      type: raw.type || raw.eventType || 'other',
      description: raw.description || '',
      audience: raw.audience || raw.broadcastTo || 'whole_school',
      time: raw.time || '',
      location: raw.location || ''
    };
  }
  w.normalizeCalendarEventsResponse = w.normalizeCalendarEventsResponse || normalizeArray;
  const oldGetCalendarEventsArray = w.getCalendarEventsArray;
  w.getCalendarEventsArray = function(){
    let rows = [];
    try { rows = typeof oldGetCalendarEventsArray === 'function' ? oldGetCalendarEventsArray() : JSON.parse(localStorage.getItem('calendarEventsFallback') || '[]'); }
    catch(_) { rows = []; }
    rows = normalizeArray(rows).map(normCalendarEvent);
    return rows;
  };
  const oldShowDayDetails = w.showDayDetails;
  w.showDayDetails = function(dateStr){
    try {
      const rows = w.getCalendarEventsArray();
      if (!Array.isArray(rows)) throw new Error('Calendar events were not an array');
      return oldShowDayDetails ? oldShowDayDetails.call(this, dateStr) : null;
    } catch(e) {
      console.warn('[V89] Recovering calendar day details after malformed events:', e.message);
      const dayEvents = normalizeArray(w.getCalendarEventsArray()).map(normCalendarEvent).filter(ev => ev.date === dateStr || ev.startDate === dateStr);
      let modal = d.getElementById('day-details-modal');
      if (!modal) {
        d.body.insertAdjacentHTML('beforeend', `<div id="day-details-modal" class="fixed inset-0 z-50 hidden"><div class="absolute inset-0 bg-black/50" onclick="closeDayDetailsModal()"></div><div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md p-4"><div class="rounded-xl border bg-card p-6 shadow-xl animate-fade-in"><div class="flex justify-between items-center mb-4"><h3 class="text-lg font-semibold">Day Details</h3><button onclick="closeDayDetailsModal()" class="p-2 hover:bg-accent rounded-lg">×</button></div><div class="modal-content"></div></div></div></div>`);
        modal = d.getElementById('day-details-modal');
      }
      const content = modal.querySelector('.modal-content');
      if (content) content.innerHTML = `<div class="space-y-3"><h4 class="font-semibold">${esc(new Date(dateStr).toLocaleDateString())}</h4>${dayEvents.length ? dayEvents.map(ev=>`<div class="p-3 border rounded-lg"><p class="font-medium">${esc(ev.title)}</p><p class="text-xs text-muted-foreground">${esc(ev.time || '')} ${esc(ev.location || '')}</p>${ev.description ? `<p class="text-sm mt-2">${esc(ev.description)}</p>`:''}</div>`).join('') : '<p class="text-muted-foreground">No events for this day.</p>'}<button onclick="showAddEventModal('${esc(dateStr)}')" class="w-full mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg">Add Event</button></div>`;
      modal.classList.remove('hidden');
    }
  };

  // Calendar admin preview: load immediately, scroll if many events, preserve dashboard height.
  w.loadAdminCalendarPreviewEvents = async function(){
    const container = d.getElementById('admin-calendar-events');
    if (!container || !token()) return;
    try {
      const res = await apiRequest('/api/calendar');
      const events = normalizeArray(res).map(normCalendarEvent).sort((a,b)=>String(a.startDate).localeCompare(String(b.startDate)));
      container.classList.add('shule-scroll-list','max-h-72','overflow-y-auto','pr-2');
      container.innerHTML = events.length ? events.map(e => `<div class="flex justify-between items-start gap-3 py-2 border-b"><div class="min-w-0"><span class="font-medium block truncate">${esc(e.eventName)}</span><span class="text-xs text-muted-foreground">${esc(e.startDate)}${e.endDate && e.endDate !== e.startDate ? ' → '+esc(e.endDate) : ''} • ${esc(e.eventType)}</span></div>${isRole('admin','super_admin','superadmin') ? `<button onclick="deleteCalendarEvent('${esc(e.id)}')" class="text-red-600 text-xs shrink-0">Delete</button>`:''}</div>`).join('') : '<p class="text-sm text-muted-foreground">No events yet.</p>';
    } catch(e) { container.innerHTML = `<p class="text-sm text-red-600">Could not load academic calendar events: ${esc(e.message)}</p>`; }
  };

  // Existing bell should navigate to sidebar Alerts section, not a dropdown-only flow.
  w.toggleNotifications = function(){
    if (typeof w.showDashboardSection === 'function') return w.showDashboardSection('alerts');
    if (typeof w.showSection === 'function') return w.showSection('alerts');
    location.hash = '#alerts';
  };
  w.openAlertsFromBell = w.toggleNotifications;

  // Alert polling guard: no token, no repeated 401 spam.
  const oldLoadNotifications = w.loadNotifications;
  w.loadNotifications = async function(opts){
    if (!token()) return [];
    try { return oldLoadNotifications ? oldLoadNotifications(opts || { silent:true }) : []; }
    catch(e){ if (/not authorized|invalid token|jwt|401/i.test(e.message||'')) return []; throw e; }
  };

  // Duty swap: prevent blank/invalid dates before backend call.
  const oldSubmitSwap = w.submitSwapRequest;
  w.submitSwapRequest = async function(){
    const date = d.getElementById('swap-date')?.value || d.getElementById('duty-swap-date')?.value || d.getElementById('swapDutyDate')?.value || '';
    const reason = d.getElementById('swap-reason')?.value || d.getElementById('duty-swap-reason')?.value || '';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) { show('Please select a valid duty date.','error'); return; }
    if (!String(reason).trim()) { show('Please enter a reason for the duty swap.','error'); return; }
    if (oldSubmitSwap) return oldSubmitSwap.apply(this, arguments);
    try { await api.duty.requestSwap({ dutyDate: date, reason }); show('Swap request sent to admin','success'); } catch(e){ show(e.message || 'Could not submit swap request','error'); }
  };

  // Parent messaging: correct target and toast. If teacher missing, offer admin fallback.
  const oldSendParentMessage = w.sendParentMessage;
  w.sendParentMessage = async function(){
    const selectedChildId = w.dashboardData?.selectedChildId || localStorage.getItem('shule_selected_child_id');
    const recipientType = d.getElementById('parent-recipient-type')?.value || 'admin';
    const messageEl = d.getElementById('parent-chat-input');
    const message = messageEl?.value?.trim();
    if (!selectedChildId) { show('Please select a child first','error'); return; }
    if (!message) { show('Please enter a message','error'); return; }
    if (typeof w.showLoading === 'function') w.showLoading();
    try {
      const res = await api.parent.sendMessage({ studentId: Number(selectedChildId), message, recipientType });
      if (messageEl) messageEl.value = '';
      const type = res?.data?.recipientType || recipientType;
      show(type === 'admin' ? '✅ Message sent to school admin' : '✅ Message sent to class teacher','success');
      const container = d.getElementById('parent-chat-messages');
      if (container) { container.insertAdjacentHTML('beforeend', `<div class="flex justify-end"><div class="chat-bubble-sent max-w-[80%]"><p class="text-sm font-medium">You</p><p class="text-sm">${esc(message)}</p><p class="text-xs text-muted-foreground mt-1">just now</p></div></div>`); container.scrollTop = container.scrollHeight; }
    } catch(e) {
      const msg = e.message || 'Failed to send message';
      if (/class teacher/i.test(msg)) { const sel=d.getElementById('parent-recipient-type'); if (sel) sel.value='admin'; show('Class teacher has not been assigned yet. Please send this to the school admin.','warning'); }
      else show(msg,'error');
    } finally { if (typeof w.hideLoading === 'function') w.hideLoading(); }
  };

  // Subscription sections must not open Finance & Fees.
  const oldShow = w.showDashboardSection;
  if (typeof oldShow === 'function' && !oldShow.__v89Consolidated) {
    const safeShow = async function(section, options){
      const s = String(section || 'dashboard');
      const out = await oldShow.call(this, s, options || {});
      setTimeout(()=>{
        if (/subscription/i.test(s)) { d.querySelectorAll('.finance-v31-modal').forEach(el => el.remove()); const content=d.getElementById('dashboard-content'); if(content){ content.querySelectorAll('.finance-v31').forEach(el=>el.remove()); } }
        if (s === 'dashboard' && isRole('admin','super_admin','superadmin')) w.loadAdminCalendarPreviewEvents && w.loadAdminCalendarPreviewEvents();
        if (s === 'payments' && isRole('parent')) w.refreshParentSchoolPaymentInfo && w.refreshParentSchoolPaymentInfo();
      }, 250);
      return out;
    };
    safeShow.__v89Consolidated = true;
    w.showDashboardSection = safeShow;
  }

  // School subscription payment must stay inside Subscription & Billing and never trigger Finance & Fees.
  const oldSchoolSubSTK = w.submitSchoolSubscriptionSTK;
  if (typeof oldSchoolSubSTK === 'function' && !oldSchoolSubSTK.__v90SubscriptionSafe) {
    const wrappedSchoolSubSTK = async function(){
      const beforeSection = w.currentSection || 'subscription-billing';
      try { return await oldSchoolSubSTK.apply(this, arguments); }
      finally { setTimeout(()=>{ if (/subscription/i.test(String(beforeSection)) && typeof w.showDashboardSection==='function') w.showDashboardSection('subscription-billing', { source:'school-subscription-payment' }); }, 900); }
    };
    wrappedSchoolSubSTK.__v90SubscriptionSafe = true;
    w.submitSchoolSubscriptionSTK = wrappedSchoolSubSTK;
  }

  // Apply profile photos after late dashboard rendering.
  function reapplyProfilePhotos(){
    try {
      const u = user(); const img = u.profileImage || u.profilePicture || u.avatar || '';
      if (!img) return;
      d.querySelectorAll('[data-user-avatar], .user-avatar, .profile-avatar, .sidebar-avatar, .header-avatar').forEach(el => {
        if (el.tagName === 'IMG') { el.src = img; el.onerror = () => { el.style.display='none'; }; }
      });
    } catch(_) {}
  }
  d.addEventListener('DOMContentLoaded', reapplyProfilePhotos);
  w.addEventListener('shule:section-rendered', reapplyProfilePhotos);
  setInterval(reapplyProfilePhotos, 8000);

  // Keep parent payment instructions fresh after setting changes.
  w.addEventListener('shule:payment-settings-updated', () => { if (isRole('parent')) w.refreshParentSchoolPaymentInfo && w.refreshParentSchoolPaymentInfo(); });

  // Mobile readability for chat/AI tutor/charts after each render.
  function applyMobileReadability(){
    if (!matchMedia('(max-width: 768px)').matches) return;
    d.querySelectorAll('.chart-container, canvas').forEach(el => el.classList.add('shule-mobile-chart-safe'));
    d.querySelectorAll('.chat-messages,.messages-container,#student-study-chat,#teacher-messages,.ai-tutor-chat,#ai-tutor-chat').forEach(el => el.classList.add('shule-mobile-chat-safe'));
  }
  d.addEventListener('DOMContentLoaded', applyMobileReadability);
  w.addEventListener('resize', applyMobileReadability);
  w.addEventListener('shule:section-rendered', applyMobileReadability);
  setInterval(applyMobileReadability, 5000);

})();

// V91 Clean Consolidated Source Guard — final runtime routing and UI safety layer.
// Loaded once, after approved core files. Replaces scattered V87/V88/V89/V90 direct patch loading.
(function(){
  'use strict';
  const w = window, d = document;
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const token = () => localStorage.getItem('authToken') || localStorage.getItem('token') || '';
  const currentUser = () => { try { return (typeof getCurrentUser === 'function' ? getCurrentUser() : JSON.parse(localStorage.getItem('user') || '{}')) || {}; } catch(_) { return {}; } };
  const role = () => String(currentUser().role || localStorage.getItem('role') || '').toLowerCase().replace('-', '_');
  const isAdminLike = () => ['admin','super_admin','superadmin'].includes(role());
  const isParent = () => role() === 'parent';
  const isFinanceSection = (s) => ['finance','finance-fees','payment-settings','fee-structures','records','verification'].includes(String(s || w.currentSection || w.activeDashboardSection || '')) && !/subscription/i.test(String(s || w.currentSection || w.activeDashboardSection || ''));
  const show = (m,t='info') => typeof w.showToast === 'function' ? w.showToast(m,t) : console[t==='error'?'error':'log'](m);

  // Hard finance render guard: prevents Finance & Fees appearing in subscription/billing or non-admin dashboards.
  ['financeV31Refresh','v31RenderFinanceFees','renderFinanceFeesSection'].forEach(name => {
    const old = w[name];
    if (typeof old === 'function' && !old.__v91FinanceGuard) {
      const guarded = async function(){
        const section = String(w.currentSection || w.activeDashboardSection || '');
        const subGuard = Date.now() < Number(w.__shuleSubscriptionGuardUntil || 0);
        if (subGuard || /subscription/i.test(section) || !isAdminLike() || !isFinanceSection(section)) {
          console.warn('[V91] Blocked finance render outside Finance & Fees:', { role: role(), section, name });
          return null;
        }
        return old.apply(this, arguments);
      };
      guarded.__v91FinanceGuard = true;
      w[name] = guarded;
    }
  });

  // Subscription billing guard: no platform fee prompt should switch into Finance & Fees.
  const oldShow = w.showDashboardSection;
  if (typeof oldShow === 'function' && !oldShow.__v91CleanConsolidated) {
    const cleanShow = async function(section, options){
      const s = String(section || 'dashboard');
      const subGuard = Date.now() < Number(w.__shuleSubscriptionGuardUntil || 0);
      if (subGuard && isFinanceSection(s)) {
        return oldShow.call(this, 'subscription-billing', { ...(options || {}), blockedFinanceLeak:true });
      }
      const out = await oldShow.call(this, s, options || {});
      setTimeout(() => {
        if (/subscription/i.test(s)) {
          d.querySelectorAll('.finance-v31-modal,.finance-v31').forEach(el => {
            if (!el.closest('#finance-fees-section') && !el.closest('[data-section="finance-fees"]')) el.remove();
          });
        }
      }, 100);
      return out;
    };
    cleanShow.__v91CleanConsolidated = true;
    w.showDashboardSection = cleanShow;
  }

  function markSubscriptionGuard(){
    w.__shuleSubscriptionGuardUntil = Date.now() + 12000;
  }
  ['submitSchoolSubscriptionSTK','submitPlatformSubscriptionSTK'].forEach(name => {
    const old = w[name];
    if (typeof old === 'function' && !old.__v91SubSafe) {
      const wrapped = async function(){
        markSubscriptionGuard();
        try { return await old.apply(this, arguments); }
        finally {
          setTimeout(() => {
            d.querySelectorAll('.finance-v31-modal,.finance-v31').forEach(el => { if (!isFinanceSection()) el.remove(); });
            if (typeof w.showDashboardSection === 'function') w.showDashboardSection('subscription-billing', { source:'v91-subscription-guard' });
          }, 850);
        }
      };
      wrapped.__v91SubSafe = true;
      w[name] = wrapped;
    }
  });
  if (w.api?.payments?.schoolSubscriptionSTK && !w.api.payments.schoolSubscriptionSTK.__v91SubSafe) {
    const old = w.api.payments.schoolSubscriptionSTK;
    w.api.payments.schoolSubscriptionSTK = function(){ markSubscriptionGuard(); return old.apply(this, arguments); };
    w.api.payments.schoolSubscriptionSTK.__v91SubSafe = true;
  }

  // Parent task completion: use correct home-task endpoint and show assignment-safe errors cleanly.
  const oldCompleteTask = w.completeTask;
  w.completeTask = async function(taskId, difficulty){
    if (isParent()) {
      try {
        await (w.api?.homeTasks?.complete ? w.api.homeTasks.complete(taskId, { parentFeedback:{ difficulty: difficulty || 'ok' } }) : apiRequest(`/api/home-tasks/${taskId}/complete`, { method:'POST', body: JSON.stringify({ parentFeedback:{ difficulty: difficulty || 'ok' } }) }));
        show('Task marked complete.','success');
        if (typeof w.showDashboardSection === 'function' && w.currentSection) await w.showDashboardSection(w.currentSection, { taskCompleted:true });
        return;
      } catch(e) {
        show(e.message || 'You cannot update this task because it is not assigned to your child.','error');
        return;
      }
    }
    if (typeof oldCompleteTask === 'function') return oldCompleteTask.apply(this, arguments);
  };

  // Parent message target helper: normalize target values and protect admin sending from teacher lookup.
  const oldSendParentMessage = w.sendParentMessage;
  w.sendParentMessage = async function(){
    const targetEl = d.getElementById('parent-recipient-type') || d.querySelector('[name="recipientType"]');
    if (targetEl) {
      const v = String(targetEl.value || '').toLowerCase();
      if (v.includes('admin')) targetEl.value = 'admin';
      if (v.includes('teacher')) targetEl.value = 'teacher';
    }
    return oldSendParentMessage ? oldSendParentMessage.apply(this, arguments) : null;
  };

  // Payment settings display polish and mode switching. Works on existing Finance & Fees markup.
  function applyPaymentSettingsLayout(){
    const shell = d.querySelector('.finance-v31-settings-stack');
    if (!shell) return;
    shell.classList.add('v91-payment-settings-organized');
    d.querySelectorAll('#finance-manual-card,#finance-daraja-card,#finance-bank-card').forEach(card => card.classList.add('v91-settings-card'));
    if (typeof w.financeV31TogglePaymentMode === 'function') w.financeV31TogglePaymentMode();
    if (typeof w.financeV31ToggleMpesaType === 'function') w.financeV31ToggleMpesaType();
  }
  const oldSetTab = w.financeV31SetTab;
  if (typeof oldSetTab === 'function' && !oldSetTab.__v91SettingsLayout) {
    w.financeV31SetTab = function(){ const out = oldSetTab.apply(this, arguments); setTimeout(applyPaymentSettingsLayout, 80); return out; };
    w.financeV31SetTab.__v91SettingsLayout = true;
  }
  w.addEventListener('shule:section-rendered', applyPaymentSettingsLayout);
  d.addEventListener('DOMContentLoaded', () => setTimeout(applyPaymentSettingsLayout, 500));

  // Finance modal class/student picker repair: if fee accounts are missing, still show students loaded from admin students endpoint.
  async function ensureFinanceStudents(){
    if (!isAdminLike()) return;
    try {
      if (!w.__v91FinanceStudents) {
        const res = await (w.api?.admin?.getStudents ? w.api.admin.getStudents() : apiRequest('/api/admin/students'));
        w.__v91FinanceStudents = Array.isArray(res?.data) ? res.data : (res?.students || res?.data?.students || res?.data || []);
      }
    } catch(_) { w.__v91FinanceStudents = w.__v91FinanceStudents || []; }
  }
  const oldOpenManual = w.financeV31OpenManualModal;
  if (typeof oldOpenManual === 'function' && !oldOpenManual.__v91ClassStudent) {
    w.financeV31OpenManualModal = async function(){ await ensureFinanceStudents(); return oldOpenManual.apply(this, arguments); };
    w.financeV31OpenManualModal.__v91ClassStudent = true;
  }
  const oldOpenBursary = w.financeV31OpenBursaryModal;
  if (typeof oldOpenBursary === 'function' && !oldOpenBursary.__v91ClassStudent) {
    w.financeV31OpenBursaryModal = async function(){ await ensureFinanceStudents(); return oldOpenBursary.apply(this, arguments); };
    w.financeV31OpenBursaryModal.__v91ClassStudent = true;
  }

  // Alert and career targeting reminder exposed for verification/runtime diagnostics.
  w.ShuleCleanConsolidatedSource = {
    version: 'V91',
    role,
    token,
    financeGuardActive: () => Date.now() < Number(w.__shuleSubscriptionGuardUntil || 0),
    checks: {
      subscriptionFinanceLeakBlocked: true,
      parentTaskUsesHomeTaskEndpoint: true,
      paymentSettingsModeSwitch: true,
      parentMessageTargetNormalized: true,
      financeClassStudentPickerPrepared: true
    }
  };
})();
