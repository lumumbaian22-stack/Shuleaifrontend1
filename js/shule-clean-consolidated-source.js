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
      const u = user(); const rawImg = u.profileImage || u.profilePicture || u.avatar || '';
      const img = (typeof w.resolveMediaUrl === 'function' ? w.resolveMediaUrl(rawImg) : rawImg);
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
    if (role() === 'teacher') {
      try {
        await (w.api?.tasks?.completeTask ? w.api.tasks.completeTask(taskId) : apiRequest(`/api/tasks/${taskId}/complete`, { method:'POST' }));
        show('Task marked complete.','success');
        if (typeof w.showDashboardSection === 'function') await w.showDashboardSection('tasks');
        return;
      } catch(e) {
        show(e.message || 'Could not complete your task.','error');
        return;
      }
    }
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

/* ========================================================================
   Shule AI v125 clean merged final build
   NOTE: The old v110-v117/v124 browser hotfix files are no longer loaded
   from index.html. Their stable runtime logic is merged here so the app has
   one frontend load path instead of a stack of competing patch scripts.
   ======================================================================== */

/* ---- merged from v110-final-fixes.js ---- */
// Shule AI v110 final integrated fixes
(function(){
  'use strict';
  const $ = (id) => document.getElementById(id);
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const arr = (res) => Array.isArray(res?.data) ? res.data : (Array.isArray(res?.data?.data) ? res.data.data : (Array.isArray(res) ? res : []));
  const toast = (msg, type='success') => (window.showToast ? showToast(msg, type) : alert(msg));
  const apiReq = (path, opts={}) => (window.apiRequest ? window.apiRequest(path, opts) : Promise.reject(new Error('API helper not loaded')));

  window.api = window.api || {};
  api.student = api.student || {};
  api.parent = api.parent || {};
  api.teacher = api.teacher || {};
  api.admin = api.admin || {};
  api.sms = api.sms || {};

  api.student.getSubjectSelection = () => apiReq('/api/student/subject-selection');
  api.student.saveSubjectSelection = (payload) => apiReq('/api/student/subject-selection', { method:'PUT', body: JSON.stringify(payload) });
  api.parent.getChildSubjectSelection = (studentId) => apiReq(`/api/parent/child/${studentId}/subject-selection`);
  api.parent.saveChildSubjectSelection = (studentId, payload) => apiReq(`/api/parent/child/${studentId}/subject-selection`, { method:'PUT', body: JSON.stringify(payload) });
  api.teacher.getSubjectSelectionRequests = () => apiReq('/api/teacher/subject-selection-requests');
  api.teacher.reviewSubjectSelectionRequest = (id, payload) => apiReq(`/api/teacher/subject-selection-requests/${id}/review`, { method:'POST', body: JSON.stringify(payload) });
  api.admin.verifySubjectSelection = (studentId, payload={}) => apiReq(`/api/admin/students/${studentId}/subject-selection/verify`, { method:'POST', body: JSON.stringify(payload) });
  api.sms.getConfig = () => apiReq('/api/sms/config');
  api.sms.saveConfig = (payload) => apiReq('/api/sms/config', { method:'PUT', body: JSON.stringify(payload) });
  api.sms.send = (payload) => apiReq('/api/sms/send', { method:'POST', body: JSON.stringify(payload) });

  function subjectChecklist(data, formId) {
    const eligible = data.eligibleSubjects || [];
    const selected = new Map((data.selections || []).map(s => [String(s.subjectName || s.name || '').toLowerCase(), s]));
    if (!eligible.length) return `<div class="rounded-xl border bg-card p-6 text-center text-muted-foreground">No valid subjects found for this class. Save the curriculum structure and Add Subjects checklist first.</div>`;
    return `<div id="${formId}" class="space-y-3">
      <div class="grid md:grid-cols-2 gap-3">${eligible.map(sub => {
        const name = sub.subjectName || sub.name || sub.subject;
        const pick = selected.get(String(name).toLowerCase());
        const compulsory = !!sub.isCompulsory;
        const checked = compulsory || !!pick;
        return `<label class="rounded-xl border bg-card p-4 flex items-start gap-3 ${compulsory ? 'opacity-90' : ''}">
          <input type="checkbox" class="mt-1 subject-choice-box" data-subject-name="${esc(name)}" data-subject-id="${esc(sub.subjectId || sub.id || '')}" data-compulsory="${compulsory ? 'true' : 'false'}" ${checked ? 'checked' : ''} ${compulsory ? 'disabled' : ''}>
          <span class="flex-1"><span class="font-semibold">${esc(name)}</span><br><span class="text-xs text-muted-foreground">${compulsory ? 'Compulsory — automatically included' : 'Elective subject'}${pick?.status ? ` • Status: ${esc(pick.status)}` : ''}</span></span>
        </label>`;
      }).join('')}</div>
    </div>`;
  }
  function collectSubjects(containerId) {
    return Array.from(document.querySelectorAll(`#${containerId} .subject-choice-box`)).filter(cb => cb.checked || cb.dataset.compulsory === 'true').map(cb => ({
      subjectId: cb.dataset.subjectId || null,
      subjectName: cb.dataset.subjectName,
      isCompulsory: cb.dataset.compulsory === 'true',
      isElective: cb.dataset.compulsory !== 'true'
    }));
  }
  function selectionHeader(data, who='Student') {
    const student = data.student || {};
    const cls = data.class || {};
    return `<div class="rounded-xl border bg-card p-5">
      <p class="text-xs uppercase tracking-wide text-muted-foreground">Grade 10–12 Subject Choice</p>
      <h2 class="text-2xl font-bold">${esc(student.User?.name || student.name || who)}</h2>
      <p class="text-sm text-muted-foreground">${esc(cls.name || cls.grade || student.grade || 'Class not assigned')} • Student chooses first, parent can help, then teacher/admin verify.</p>
    </div>`;
  }

  window.v110RenderStudentSubjectSelection = async function(){
    const res = await api.student.getSubjectSelection(); const data = res.data || {};
    if (!data.senior) return `${selectionHeader(data)}<div class="rounded-xl border bg-card p-6 text-muted-foreground">This class uses the default curriculum subjects. Subject choices only open when the learner reaches Grade 10, 11 or 12.</div>`;
    return `<div class="space-y-5 animate-fade-in">${selectionHeader(data)}
      <div class="rounded-xl border bg-card p-5 grid md:grid-cols-2 gap-3"><input id="student-pathway" value="${esc(data.selections?.[0]?.pathway || '')}" placeholder="Pathway / career direction" class="rounded-lg border px-3 py-2 bg-background"><input id="student-track" value="${esc(data.selections?.[0]?.track || '')}" placeholder="Track" class="rounded-lg border px-3 py-2 bg-background"></div>
      ${subjectChecklist(data, 'student-subject-form')}
      <button onclick="v110SubmitStudentSubjectSelection()" class="px-5 py-3 rounded-lg bg-primary text-primary-foreground">Submit Subject Choices</button>
    </div>`;
  };
  window.v110SubmitStudentSubjectSelection = async function(){
    const payload = { pathway:$('student-pathway')?.value || '', track:$('student-track')?.value || '', subjects:collectSubjects('student-subject-form') };
    await api.student.saveSubjectSelection(payload); toast('Subject choices submitted for verification'); await window.showDashboardSection?.('subject-selection');
  };

  window.v110RenderParentSubjectChoice = async function(){
    const child = window.dashboardData?.selectedChild?.student || (window.dashboardData?.children || [])[0];
    const childId = window.dashboardData?.selectedChildId || child?.id || child?.studentId;
    if (!childId) return `<div class="text-center py-12 text-muted-foreground">Select or link a child first.</div>`;
    const res = await api.parent.getChildSubjectSelection(childId); const data = res.data || {};
    if (!data.senior) return `${selectionHeader(data, 'Child')}<div class="rounded-xl border bg-card p-6 text-muted-foreground">This child is not yet in Grade 10–12, so the normal curriculum subjects remain active.</div>`;
    return `<div class="space-y-5 animate-fade-in">${selectionHeader(data, 'Child')}
      <div class="rounded-xl border bg-card p-5 grid md:grid-cols-2 gap-3"><input id="parent-pathway" value="${esc(data.selections?.[0]?.pathway || '')}" placeholder="Suggested pathway" class="rounded-lg border px-3 py-2 bg-background"><input id="parent-track" value="${esc(data.selections?.[0]?.track || '')}" placeholder="Suggested track" class="rounded-lg border px-3 py-2 bg-background"></div>
      ${subjectChecklist(data, 'parent-subject-form')}
      <button onclick="v110SubmitParentSubjectChoice('${esc(childId)}')" class="px-5 py-3 rounded-lg bg-primary text-primary-foreground">Save & Send to School</button>
    </div>`;
  };
  window.v110SubmitParentSubjectChoice = async function(childId){
    await api.parent.saveChildSubjectSelection(childId, { pathway:$('parent-pathway')?.value || '', track:$('parent-track')?.value || '', subjects:collectSubjects('parent-subject-form') });
    toast('Subject choices saved and sent for school verification'); await window.showDashboardSection?.('subject-choice');
  };

  window.v110RenderTeacherSubjectRequests = async function(){
    const res = await api.teacher.getSubjectSelectionRequests(); const data = res.data || {}; const requests = data.requests || [];
    return `<div class="space-y-5 animate-fade-in"><div class="rounded-xl border bg-card p-5"><h2 class="text-2xl font-bold">Subject Entry Requests</h2><p class="text-sm text-muted-foreground">Students who chose subjects you teach. Accept or deny entry per subject.</p></div>
      <div class="rounded-xl border bg-card overflow-hidden"><table class="w-full text-sm"><thead class="bg-muted"><tr><th class="p-3 text-left">Student</th><th class="p-3 text-left">Class</th><th class="p-3 text-left">Subject</th><th class="p-3 text-left">Pathway</th><th class="p-3 text-left">Status</th><th class="p-3 text-right">Action</th></tr></thead><tbody>${requests.length ? requests.map(r => `<tr class="border-t"><td class="p-3 font-medium">${esc(r.studentName || r.elimuid || r.studentId)}</td><td class="p-3">${esc(r.className || r.grade || '')}</td><td class="p-3">${esc(r.subjectName)}</td><td class="p-3">${esc(r.pathway || r.track || '')}</td><td class="p-3">${esc(r.status)}</td><td class="p-3 text-right"><button onclick="v110ReviewSubject('${r.id}','accept')" class="px-3 py-1 rounded bg-green-600 text-white">Accept</button> <button onclick="v110ReviewSubject('${r.id}','reject')" class="px-3 py-1 rounded bg-red-600 text-white">Deny</button></td></tr>`).join('') : `<tr><td colspan="6" class="p-8 text-center text-muted-foreground">No subject-choice requests yet.</td></tr>`}</tbody></table></div></div>`;
  };
  window.v110ReviewSubject = async (id, action) => { await api.teacher.reviewSubjectSelectionRequest(id, { action }); toast('Subject request updated'); await window.showDashboardSection?.('subject-requests'); };

  window.v110AdminVerifySubjectSelection = async function(studentId){ await api.admin.verifySubjectSelection(studentId, { status:'verified_by_admin' }); toast('Student subject choices verified'); await window.showDashboardSection?.('student-subject-selection'); };

  function v112PaymentMode(cfg){ return cfg.paymentMode || cfg.mode || (cfg.darajaEnabled && cfg.manualEnabled ? 'both' : cfg.darajaEnabled ? 'daraja' : 'manual'); }
  function v112DarajaSettings(cfg){ return cfg.darajaCredentials || cfg.daraja || {}; }
  function v112PaymentJson(value, fallback){ try { return JSON.parse(value || JSON.stringify(fallback || {})); } catch(e) { toast('JSON field is invalid', 'error'); throw e; } }

  window.v12RenderPlatformPayments = async function(){
    const settings = await (api.payments?.getPlatformSettings ? api.payments.getPlatformSettings() : apiReq('/api/payments/superadmin/platform-settings')).catch(() => ({data:{}}));
    const cfg = settings.data || {};
    const d = v112DarajaSettings(cfg);
    const mode = v112PaymentMode(cfg);
    const reqs = await (api.superAdmin?.getPaymentRequests ? api.superAdmin.getPaymentRequests({status:'pending'}) : apiReq('/api/super-admin/payment-requests?status=pending')).catch(() => ({data:[]}));
    const rows = arr(reqs);
    const manualActive = mode === 'manual' || mode === 'both';
    const darajaActive = mode === 'daraja' || mode === 'both';
    return `<div class="space-y-6 animate-fade-in">
      <div class="rounded-2xl border bg-card p-6 shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div><p class="text-xs uppercase tracking-wide text-muted-foreground">Super Admin Billing</p><h2 class="text-3xl font-bold">Platform Payments</h2><p class="text-sm text-muted-foreground mt-1">Choose how Shule AI collects platform money: manual verification, Daraja STK, or both during rollout.</p></div>
        <div class="grid grid-cols-3 gap-2 text-center text-xs"><div class="rounded-xl border p-3"><b>${esc(mode.toUpperCase())}</b><span class="block text-muted-foreground">Mode</span></div><div class="rounded-xl border p-3"><b>${manualActive ? 'ON':'OFF'}</b><span class="block text-muted-foreground">Manual</span></div><div class="rounded-xl border p-3"><b>${darajaActive ? 'ON':'OFF'}</b><span class="block text-muted-foreground">Daraja</span></div></div>
      </div>
      <div class="grid xl:grid-cols-[1.2fr_.8fr] gap-5">
        <div class="rounded-2xl border bg-card p-6 space-y-5">
          <div class="grid md:grid-cols-3 gap-3">
            ${['manual','daraja','both'].map(m => `<button type="button" onclick="v112SetPlatformPaymentMode('${m}')" class="platform-mode-card rounded-xl border p-4 text-left ${mode===m?'ring-2 ring-primary bg-primary/5':''}" data-mode-card="${m}"><b>${m==='manual'?'Manual Verification':m==='daraja'?'Daraja STK Only':'Manual + Daraja'}</b><small class="block text-muted-foreground mt-1">${m==='manual'?'Admin sends code, super admin confirms.':m==='daraja'?'Cards trigger STK and callback update.':'Use STK where ready, manual as backup.'}</small></button>`).join('')}
          </div>
          <input id="pay-mode" type="hidden" value="${esc(mode)}">
          <div class="grid md:grid-cols-2 gap-4">
            <label class="space-y-1"><span class="text-sm font-medium">Platform account name</span><input id="pay-account" value="${esc(cfg.accountName || 'Shule AI') }" class="w-full rounded-lg border px-3 py-2 bg-background"></label>
            <label class="space-y-1"><span class="text-sm font-medium">Currency</span><input id="pay-currency" value="${esc(cfg.currency || 'KES')}" class="w-full rounded-lg border px-3 py-2 bg-background"></label>
            <label class="space-y-1"><span class="text-sm font-medium">Manual Paybill / shortcode</span><input id="pay-paybill" value="${esc(cfg.paybill || cfg.shortcode || '')}" class="w-full rounded-lg border px-3 py-2 bg-background" placeholder="e.g. 400200"></label>
            <label class="space-y-1"><span class="text-sm font-medium">Manual Till number</span><input id="pay-till" value="${esc(cfg.till || '')}" class="w-full rounded-lg border px-3 py-2 bg-background"></label>
          </div>
          <div id="manual-payment-panel" class="rounded-xl border p-4 space-y-3 ${manualActive?'':'hidden'}">
            <h3 class="font-semibold">Manual verification instructions</h3>
            <textarea id="pay-manual-instructions" rows="4" class="w-full rounded-lg border px-3 py-2 bg-background" placeholder="Tell school admins what code/reference to send.">${esc(cfg.manualInstructions || 'Send M-Pesa confirmation code, amount, school name, and billing plan. Super admin will approve and activate 30 days.')}</textarea>
          </div>
          <div id="daraja-payment-panel" class="rounded-xl border p-4 space-y-3 ${darajaActive?'':'hidden'}">
            <div class="flex items-center justify-between gap-3"><h3 class="font-semibold">Daraja STK credentials</h3><span class="text-xs rounded-full border px-2 py-1">${darajaActive ? 'STK fields active' : 'Inactive until Daraja mode is selected'}</span></div>
            <div class="grid md:grid-cols-2 gap-3">
              <label class="space-y-1"><span class="text-sm font-medium">Environment</span><select id="pay-daraja-env" class="w-full rounded-lg border px-3 py-2 bg-background"><option value="sandbox" ${(d.environment || d.env)==='sandbox'?'selected':''}>Sandbox</option><option value="production" ${(d.environment || d.env)==='production'?'selected':''}>Production</option></select></label>
              <label class="space-y-1"><span class="text-sm font-medium">Business shortcode</span><input id="pay-daraja-shortcode" value="${esc(d.shortcode || d.businessShortCode || cfg.shortcode || '')}" class="w-full rounded-lg border px-3 py-2 bg-background"></label>
              <label class="space-y-1"><span class="text-sm font-medium">Consumer key</span><input id="pay-daraja-key" value="${esc(d.consumerKey || '')}" class="w-full rounded-lg border px-3 py-2 bg-background"></label>
              <label class="space-y-1"><span class="text-sm font-medium">Consumer secret</span><input id="pay-daraja-secret" value="${esc(d.consumerSecret || '')}" class="w-full rounded-lg border px-3 py-2 bg-background" type="password"></label>
              <label class="space-y-1 md:col-span-2"><span class="text-sm font-medium">Passkey</span><input id="pay-daraja-passkey" value="${esc(d.passkey || '')}" class="w-full rounded-lg border px-3 py-2 bg-background"></label>
              <label class="space-y-1 md:col-span-2"><span class="text-sm font-medium">Callback URL</span><input id="pay-daraja-callback" value="${esc(d.callbackUrl || cfg.callbackUrl || '')}" class="w-full rounded-lg border px-3 py-2 bg-background" placeholder="https://your-backend/api/payments/callback"></label>
            </div>
          </div>
          <div class="grid md:grid-cols-2 gap-4">
            <label class="space-y-1"><span class="text-sm font-medium">Parent subscription plans JSON</span><textarea id="pay-parent-plans" rows="5" class="w-full rounded-lg border px-3 py-2 bg-background font-mono text-xs">${esc(JSON.stringify(cfg.parentPlans || [
              {code:'child_basic',name:'Basic',amount:100,days:30,features:['Report cards','Attendance','Progress'],limits:{aiTutor:false,aiQuestionsPerDay:0,aiQuestionsPerMonth:0}},
              {code:'child_premium',name:'Premium',amount:250,days:30,features:['Everything in Basic','AI Tutor: 6 messages/day','Child timetable if school has timetable'],limits:{aiTutor:true,aiQuestionsPerDay:6,aiQuestionsPerMonth:180}},
              {code:'child_ultimate',name:'Ultimate',amount:500,days:30,features:['Everything in Premium','Extended AI Tutor','Live child analytics','Stronger alerts','Child recommendations'],limits:{aiTutor:true,aiQuestionsPerDay:50,aiQuestionsPerMonth:1500}}
            ], null, 2))}</textarea></label>
            <label class="space-y-1"><span class="text-sm font-medium">School subscription plans JSON</span><textarea id="pay-school-plans" rows="5" class="w-full rounded-lg border px-3 py-2 bg-background font-mono text-xs">${esc(JSON.stringify(cfg.schoolPlans || [{code:'standard',name:'School Standard',amount:100000,days:365}], null, 2))}</textarea></label>
          </div>
          <div class="flex flex-wrap gap-3 items-center">
            <label class="text-sm flex gap-2 items-center"><input id="pay-parent-enabled" type="checkbox" ${cfg.parentSubscriptionsEnabled !== false ? 'checked' : ''}> Parent subscriptions</label>
            <label class="text-sm flex gap-2 items-center"><input id="pay-school-enabled" type="checkbox" ${cfg.schoolSubscriptionsEnabled !== false ? 'checked' : ''}> School subscriptions</label>
            <label class="text-sm flex gap-2 items-center"><input id="pay-namechange-enabled" type="checkbox" ${cfg.nameChangePaymentsEnabled ? 'checked' : ''}> Paid name changes</label>
          </div>
          <div class="flex gap-3"><button onclick="v110SavePlatformPaymentSettings()" class="px-5 py-3 rounded-xl bg-primary text-primary-foreground font-semibold">Save Platform Payment Settings</button><button onclick="v112PingPlatformPaymentMode()" class="px-5 py-3 rounded-xl border">Check Mode</button></div>
        </div>
        <div class="rounded-2xl border bg-card p-6"><div class="flex items-center justify-between gap-3 mb-4"><div><h3 class="font-semibold text-lg">Pending Manual Confirmations</h3><p class="text-sm text-muted-foreground">Approving activates/renews 30 days.</p></div><span class="rounded-full border px-3 py-1 text-sm">${rows.length}</span></div>${rows.length ? `<div class="space-y-3">${rows.map(r => `<div class="border rounded-xl p-4"><div class="flex justify-between gap-3"><div><p class="font-semibold">${esc(r.schoolName || r.schoolCode || 'School')}</p><p class="text-xs text-muted-foreground">${esc(r.method || 'manual')} • ${esc(r.reference || r.mpesaCode || '')}</p><p class="text-sm mt-1">KES ${Number(r.amount || 0).toLocaleString()} ${r.planCode ? '• '+esc(r.planCode) : ''}</p></div><div class="flex flex-col gap-2"><button onclick="v110ReviewPayment('${r.id}','approve')" class="px-3 py-2 rounded-lg bg-green-600 text-white">Approve</button><button onclick="v110ReviewPayment('${r.id}','reject')" class="px-3 py-2 rounded-lg bg-red-600 text-white">Reject</button></div></div></div>`).join('')}</div>` : `<div class="text-center text-muted-foreground py-12">No pending manual payment requests.</div>`}</div>
      </div>
    </div>`;
  };
  window.v112SetPlatformPaymentMode = function(mode){
    const input = $('pay-mode'); if (input) input.value = mode;
    document.querySelectorAll('[data-mode-card]').forEach(card => card.classList.toggle('ring-2', card.dataset.modeCard === mode));
    const manual = mode === 'manual' || mode === 'both';
    const daraja = mode === 'daraja' || mode === 'both';
    $('manual-payment-panel')?.classList.toggle('hidden', !manual);
    $('daraja-payment-panel')?.classList.toggle('hidden', !daraja);
  };
  window.v112PingPlatformPaymentMode = function(){
    const mode = $('pay-mode')?.value || 'manual';
    const msg = mode === 'manual' ? 'Manual mode: schools submit M-Pesa codes; super admin confirms.' : mode === 'daraja' ? 'Daraja mode: subscription cards should trigger STK and callbacks update status.' : 'Both mode: STK is preferred, manual verification remains as backup.';
    toast(msg, 'info');
  };
  window.v110SavePlatformPaymentSettings = async function(){
    const mode = $('pay-mode')?.value || 'manual';
    const daraja = {
      environment:$('pay-daraja-env')?.value || 'sandbox',
      shortcode:$('pay-daraja-shortcode')?.value || '',
      consumerKey:$('pay-daraja-key')?.value || '',
      consumerSecret:$('pay-daraja-secret')?.value || '',
      passkey:$('pay-daraja-passkey')?.value || '',
      callbackUrl:$('pay-daraja-callback')?.value || ''
    };
    const payload = {
      paymentMode: mode,
      mode,
      manualEnabled: mode === 'manual' || mode === 'both',
      darajaEnabled: mode === 'daraja' || mode === 'both',
      accountName:$('pay-account')?.value || 'Shule AI',
      currency:$('pay-currency')?.value || 'KES',
      paybill:$('pay-paybill')?.value || '',
      till:$('pay-till')?.value || '',
      manualInstructions:$('pay-manual-instructions')?.value || '',
      darajaCredentials: daraja,
      daraja,
      parentSubscriptionsEnabled: !!$('pay-parent-enabled')?.checked,
      schoolSubscriptionsEnabled: !!$('pay-school-enabled')?.checked,
      nameChangePaymentsEnabled: !!$('pay-namechange-enabled')?.checked,
      parentPlans: v112PaymentJson($('pay-parent-plans')?.value, []),
      schoolPlans: v112PaymentJson($('pay-school-plans')?.value, [])
    };
    await (api.payments?.updatePlatformSettings ? api.payments.updatePlatformSettings(payload) : apiReq('/api/payments/superadmin/platform-settings', {method:'PUT', body:JSON.stringify(payload)}));
    toast('Platform payment settings saved');
    await window.showDashboardSection?.('platform-payments');
  };
  window.v110ReviewPayment = async function(id, action){ await api.superAdmin.reviewPaymentRequest(id, { action, reviewNotes: action === 'approve' ? 'Confirmed manual M-Pesa payment; activate 30 days.' : 'Rejected by super admin' }); toast(`Payment ${action}d`); await window.showDashboardSection?.('platform-payments'); };


  function msgAttachment(m){ const a = m.metadata?.attachment || m.attachment; if(!a) return ''; const url = a.url || a.fileUrl || a.path; return `<div class="mt-2 text-xs"><a class="underline" target="_blank" href="${esc(url || '#')}">📎 ${esc(a.originalName || a.filename || 'Attachment')}</a></div>`; }
  window.loadParentRecipientConversation = async function(){
    const type = $('parent-recipient-type')?.value || 'teacher'; const box = $('parent-chat-messages'); if(!box) return;
    box.innerHTML = '<div class="text-center text-muted-foreground py-8">Loading conversation...</div>';
    const conv = await api.parent.getConversations().catch(()=>({data:[]})); const conversations = arr(conv);
    const match = conversations.find(c => (type === 'teacher' && c.conversationType === 'parent_class_teacher') || (type === 'admin' && c.conversationType === 'parent_admin'));
    const messages = match?.userId ? arr(await api.parent.getMessages(match.userId).catch(()=>({data:match.messages || []}))) : [];
    const me = JSON.parse(localStorage.getItem('user') || '{}');
    box.innerHTML = messages.length ? messages.map(m => { const mine = Number(m.senderId) === Number(me.id); return `<div class="flex ${mine?'justify-end':'justify-start'}"><div class="max-w-[75%] rounded-2xl px-4 py-2 ${mine?'bg-primary text-primary-foreground':'bg-background border'}"><p class="text-sm whitespace-pre-wrap">${esc(m.content)}</p>${msgAttachment(m)}<p class="text-[10px] opacity-70 mt-1">${new Date(m.createdAt).toLocaleString()}</p></div></div>`; }).join('') : '<div class="text-center text-muted-foreground py-8">No messages yet. Send the first message.</div>';
    box.scrollTop = box.scrollHeight;
  };
  window.sendParentMessage = async function(){
    const input = $('parent-chat-input'); const file = $('parent-chat-attachment')?.files?.[0] || null; const text = input?.value?.trim() || '';
    const selectedChild = window.dashboardData?.selectedChild?.student || (window.dashboardData?.children || [])[0]; const studentId = window.dashboardData?.selectedChildId || selectedChild?.id || selectedChild?.studentId;
    if(!studentId) return toast('Select a child first','error'); if(!text && !file) return toast('Type a message or attach a file','error');
    let attachment = null;
    if(file && api.chatV9?.uploadAttachment){ const fd = new FormData(); fd.append('file', file); const up = await api.chatV9.uploadAttachment(fd); attachment = up.data || up.file || up; attachment.originalName = attachment.originalName || file.name; }
    await api.parent.sendMessage({ studentId, message:text || file?.name || '', recipientType:$('parent-recipient-type')?.value || 'teacher', attachment });
    if(input) input.value=''; if($('parent-chat-attachment')) $('parent-chat-attachment').value=''; await window.loadParentRecipientConversation();
  };

  const oldRenderParentChat = window.renderParentChat;
  window.renderParentChat = async function(){
    const html = oldRenderParentChat ? await oldRenderParentChat() : '<div></div>';
    if (html.includes('parent-chat-attachment')) return html;
    return html.replace('<div class="flex gap-2">', '<div class="flex gap-2 mb-2"><input type="file" id="parent-chat-attachment" class="flex-1 rounded-lg border px-3 py-2 text-sm bg-background" accept="image/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"></div><div class="flex gap-2">');
  };


  window.v112RenderSuperAdminAnalytics = async function(){
    const res = await (api.superAdmin?.getAnalytics ? api.superAdmin.getAnalytics() : apiReq('/api/super-admin/analytics')).catch(() => ({data:{}}));
    const d = res.data || {};
    if (typeof renderSuperAdminAnalytics === 'function') return renderSuperAdminAnalytics(d);
    return window.v110RenderSuperAdminAnalytics ? window.v110RenderSuperAdminAnalytics() : '<div class="p-6">Platform analytics unavailable.</div>';
  };

  window.v110RenderSuperAdminAnalytics = async function(){
    const res = await (api.superAdmin?.getAnalytics ? api.superAdmin.getAnalytics() : apiReq('/api/super-admin/analytics')).catch(() => ({data:{}}));
    const d = res.data || {}; const ov = d.overview || d || {};
    const cards = [
      ['Schools', ov.totalSchools || ov.schools || 0], ['Students', ov.totalStudents || ov.students || 0], ['Teachers', ov.totalTeachers || ov.teachers || 0], ['Parents', ov.totalParents || ov.parents || 0], ['Revenue', `KES ${Number(ov.totalRevenue || ov.revenue || 0).toLocaleString()}`]
    ];
    return `<div class="space-y-6 animate-fade-in"><div class="rounded-xl border bg-card p-5"><h2 class="text-2xl font-bold">Platform Analytics</h2><p class="text-sm text-muted-foreground">Super-admin platform totals only. This does not use a single school/admin analytics scope.</p></div><div class="grid gap-4 md:grid-cols-2 lg:grid-cols-5">${cards.map(c => `<div class="rounded-xl border bg-card p-5"><p class="text-sm text-muted-foreground">${esc(c[0])}</p><h3 class="text-2xl font-bold mt-1">${esc(c[1])}</h3></div>`).join('')}</div><div class="rounded-xl border bg-card p-5"><h3 class="font-semibold mb-3">Raw platform snapshot</h3><pre class="text-xs overflow-auto bg-muted p-3 rounded-lg">${esc(JSON.stringify(d, null, 2))}</pre></div></div>`;
  };

  window.v110RenderSuperAdminHealth = async function(){
    const status = await apiReq('/api/super-admin/system/status').catch(() => null);
    const metrics = await apiReq('/api/super-admin/metrics').catch(() => null);
    return `<div class="space-y-5 animate-fade-in"><div class="rounded-xl border bg-card p-5"><h2 class="text-2xl font-bold">Platform Health</h2><p class="text-sm text-muted-foreground">Live checks only. If a metric is unavailable, it is shown as unavailable instead of fake alerts.</p></div><div class="grid md:grid-cols-2 gap-4"><div class="rounded-xl border bg-card p-5"><h3 class="font-semibold mb-2">System Status</h3><pre class="text-xs overflow-auto bg-muted p-3 rounded">${esc(JSON.stringify(status?.data || status || {status:'unavailable'}, null, 2))}</pre></div><div class="rounded-xl border bg-card p-5"><h3 class="font-semibold mb-2">Metrics</h3><pre class="text-xs overflow-auto bg-muted p-3 rounded">${esc(JSON.stringify(metrics?.data || metrics || {metrics:'unavailable'}, null, 2))}</pre></div></div></div>`;
  };

  const oldStudent = window.renderStudentSection;
  window.renderStudentSection = async function(section){ if(section === 'subject-selection') return await window.v110RenderStudentSubjectSelection(); return oldStudent ? oldStudent(section) : ''; };
  const oldParent = window.renderParentSection;
  window.renderParentSection = async function(section){ if(section === 'subject-choice') return await window.v110RenderParentSubjectChoice(); if(section === 'chat') return await window.renderParentChat(); return oldParent ? oldParent(section) : ''; };
  const oldTeacher = window.renderTeacherSection;
  window.renderTeacherSection = async function(section){ if(section === 'subject-requests') return await window.v110RenderTeacherSubjectRequests(); return oldTeacher ? oldTeacher(section) : ''; };
  const oldAdmin = window.renderAdminSection;
  window.renderAdminSection = async function(section){ if(section === 'sms') return await window.v110RenderSms(); return oldAdmin ? oldAdmin(section) : ''; };
  const oldSuper = window.renderSuperAdminSection;
  window.renderSuperAdminSection = async function(section){ if(section === 'platform-payments') return await window.v12RenderPlatformPayments(); if(section === 'sms') return await window.v110RenderSms(); if(section === 'analytics') return await window.v112RenderSuperAdminAnalytics(); if(section === 'platform-health') return await window.v110RenderSuperAdminHealth(); return oldSuper ? oldSuper(section) : ''; };

  const oldBrandApply = window.BrandingManager?.apply;
  if (window.BrandingManager && oldBrandApply) {
    window.BrandingManager.apply = function(){
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (String(user.role || '').replace('-','_') === 'super_admin') {
        const el = document.getElementById('sidebar-school-name'); if (el) el.textContent = 'Shule AI';
        return;
      }
      return oldBrandApply.apply(this, arguments);
    };
  }
})();

/* ---- end merged from v110-final-fixes.js ---- */

/* ---- merged from v111-media-url-hotfix.js ---- */
// Shule AI V111 media/data URL hotfix
// Prevents data:image/blob URLs from being prefixed with API_BASE_URL and repairs cached bad values.
(function () {
  const DATA_IMAGE_RE = /data:image\/[a-zA-Z0-9.+-]+;base64,/i;

  function normalizeMediaUrl(value) {
    if (!value) return '';
    let raw = String(value).trim();
    if (!raw) return '';

    const dataIndex = raw.search(DATA_IMAGE_RE);
    if (dataIndex >= 0) return raw.slice(dataIndex);

    if (/^(data|blob):/i.test(raw)) return raw;
    if (/^\/?data:image\//i.test(raw)) return raw.replace(/^\/+/, '');
    if (/^https?:\/\//i.test(raw)) return raw;

    if (/^[A-Za-z0-9+/\r\n]+={0,2}$/.test(raw) && raw.length > 500) {
      return 'data:image/png;base64,' + raw.replace(/\s+/g, '');
    }

    const base = String(window.API_BASE_URL || localStorage.getItem('SHULE_API_BASE_URL') || 'https://shuleaibackend-32h1.onrender.com').replace(/\/$/, '');
    return base ? base + (raw.startsWith('/') ? raw : '/' + raw) : raw;
  }

  const previousResolve = window.resolveMediaUrl;
  window.normalizeShuleMediaUrl = normalizeMediaUrl;
  window.resolveMediaUrl = function (url) {
    return normalizeMediaUrl(url || '');
  };

  function normalizeObjectImageFields(obj) {
    if (!obj || typeof obj !== 'object') return false;
    let changed = false;
    const imageKeys = new Set([
      'profileImage', 'profilePicture', 'avatar', 'photo', 'photoUrl',
      'logo', 'logoUrl', 'schoolLogo', 'schoolLogoUrl', 'brandingLogo',
      'image', 'imageUrl'
    ]);

    for (const key of Object.keys(obj)) {
      const value = obj[key];
      if (imageKeys.has(key) && typeof value === 'string') {
        const fixed = normalizeMediaUrl(value);
        if (fixed && fixed !== value) {
          obj[key] = fixed;
          changed = true;
        }
      } else if (value && typeof value === 'object' && !Array.isArray(value)) {
        if (normalizeObjectImageFields(value)) changed = true;
      }
    }
    return changed;
  }

  function repairCachedImages() {
    [
      'user', 'shule_user', 'currentUser', 'schoolSettings', 'brandingSettings',
      'schoolBranding', 'dashboardData', 'selectedSchool'
    ].forEach(key => {
      try {
        const raw = localStorage.getItem(key);
        if (!raw || raw[0] !== '{') return;
        const parsed = JSON.parse(raw);
        if (normalizeObjectImageFields(parsed)) {
          localStorage.setItem(key, JSON.stringify(parsed));
        }
      } catch (_) {}
    });
  }

  function repairLiveImages(root) {
    const scope = root && root.querySelectorAll ? root : document;
    scope.querySelectorAll('img[src*="/data:image"], img[src*="data:image"], img[data-profile-full*="/data:image"], [data-profile-image*="/data:image"]').forEach(el => {
      if (el.tagName === 'IMG') {
        const fixedSrc = normalizeMediaUrl(el.getAttribute('src') || '');
        if (fixedSrc) el.setAttribute('src', fixedSrc);
      }
      if (el.dataset) {
        if (el.dataset.profileFull) el.dataset.profileFull = normalizeMediaUrl(el.dataset.profileFull);
        if (el.dataset.profileImage) el.dataset.profileImage = normalizeMediaUrl(el.dataset.profileImage);
      }
    });
  }

  function boot() {
    repairCachedImages();
    repairLiveImages(document);
    if (typeof window.applyGlobalProfilePictures === 'function') {
      window.applyGlobalProfilePictures();
    }
  }

  document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 120));
  window.addEventListener('shule:section-rendered', () => setTimeout(boot, 80));

  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.type === 'childList') {
        m.addedNodes.forEach(node => {
          if (node && node.nodeType === 1) repairLiveImages(node);
        });
      }
    }
  });
  document.addEventListener('DOMContentLoaded', () => {
    try { observer.observe(document.body, { childList: true, subtree: true }); } catch (_) {}
  });
})();

/* ---- end merged from v111-media-url-hotfix.js ---- */

/* ---- merged from v112-stability-polish.js ---- */

// Shule AI v112 stability polish: teacher parent-chat isolation, dark logo guard, super-admin routing guard.
(function(){
  'use strict';
  const safeParse = (v, fb={}) => { try { return v ? JSON.parse(v) : fb; } catch { return fb; } };
  const isTeacher = () => String(safeParse(localStorage.getItem('user')).role || '').toLowerCase() === 'teacher';
  const isSuperAdmin = () => ['superadmin','super_admin'].includes(String(safeParse(localStorage.getItem('user')).role || '').toLowerCase());
  function injectStyle(){
    if (document.getElementById('v112-stability-style')) return;
    const st = document.createElement('style');
    st.id = 'v112-stability-style';
    st.textContent = `
      #sidebar-logo-light,#sidebar-logo-dark,.school-sidebar-logo{max-width:40px!important;max-height:40px!important;object-fit:contain!important;visibility:visible!important;opacity:1!important;}
      html.dark #sidebar-logo-light{display:none!important;}
      html.dark #sidebar-logo-dark{display:block!important;}
      html:not(.dark) #sidebar-logo-light{display:block!important;}
      html:not(.dark) #sidebar-logo-dark{display:none!important;}
      [data-section="parent-chat"].teacher-hidden-parent-chat{display:none!important;}
      .platform-mode-card{transition:transform .15s ease, box-shadow .15s ease;}
      .platform-mode-card:hover{transform:translateY(-1px);}
    `;
    document.head.appendChild(st);
  }
  function normalizeLogo(src){
    if (!src) return 'assets/logo-light.png';
    if (typeof window.resolveMediaUrl === 'function') return window.resolveMediaUrl(src);
    if (/\/data:image\//i.test(src)) return src.slice(src.indexOf('data:image/'));
    return src;
  }
  function fixSidebarLogos(){
    const light = document.getElementById('sidebar-logo-light');
    const dark = document.getElementById('sidebar-logo-dark');
    const fallback = 'assets/logo-light.png';
    [light, dark].forEach(img => {
      if (!img) return;
      const raw = img.getAttribute('src') || fallback;
      const fixed = normalizeLogo(raw);
      img.onerror = function(){ this.onerror = null; this.src = fallback; };
      if (!fixed || /logo-dark\.png$/i.test(fixed)) img.setAttribute('src', fallback);
      else img.setAttribute('src', fixed);
      img.style.maxWidth = '40px'; img.style.maxHeight = '40px'; img.style.objectFit = 'contain'; img.style.opacity = '1'; img.style.visibility = 'visible';
    });
    if (dark && (!dark.getAttribute('src') || /logo-dark\.png$/i.test(dark.getAttribute('src')))) dark.setAttribute('src', fallback);
  }
  function removeTeacherParentSidebar(){
    if (!isTeacher()) return;
    document.querySelectorAll('[data-section="parent-chat"], button[onclick*="parent-chat"], a[onclick*="parent-chat"]').forEach(el => {
      el.classList.add('teacher-hidden-parent-chat');
      el.style.display = 'none';
      if (el.dataset) el.dataset.v112Removed = 'teacher-parent-sidebar';
    });
    const current = window.currentSection || localStorage.getItem('currentDashboardSection');
    if (current === 'parent-chat' && typeof window.showDashboardSection === 'function') window.showDashboardSection('staff-chat').catch(()=>{});
  }
  const oldShow = window.showDashboardSection;
  if (typeof oldShow === 'function' && !oldShow.__v112Stable) {
    window.showDashboardSection = async function(section){
      if (isTeacher() && section === 'parent-chat') section = 'staff-chat';
      const out = await oldShow.call(this, section);
      setTimeout(() => { fixSidebarLogos(); removeTeacherParentSidebar(); }, 30);
      return out;
    };
    window.showDashboardSection.__v112Stable = true;
  }
  function boot(){ injectStyle(); fixSidebarLogos(); removeTeacherParentSidebar(); }
  document.addEventListener('DOMContentLoaded', boot);
  window.addEventListener('load', boot);
  const observer = new MutationObserver(() => { fixSidebarLogos(); removeTeacherParentSidebar(); });
  observer.observe(document.documentElement, { attributes:true, attributeFilter:['class'] });
  observer.observe(document.body || document.documentElement, { childList:true, subtree:true });
  setInterval(() => { fixSidebarLogos(); removeTeacherParentSidebar(); }, 2000);
})();

/* ---- end merged from v112-stability-polish.js ---- */

/* ---- merged from v113-access-billing-hotfix.js ---- */
// Shule AI v113 access, billing, SMS and super-admin isolation fixes.
(function(){
  'use strict';
  const $ = (id) => document.getElementById(id);
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const safeParse = (v, fb={}) => { try { return v ? JSON.parse(v) : fb; } catch { return fb; } };
  const apiReq = (path, opts={}) => window.apiRequest ? window.apiRequest(path, opts) : Promise.reject(new Error('API helper not loaded'));
  const toast = (msg, type='success') => window.showToast ? window.showToast(msg, type) : alert(msg);
  function currentUser(){ return (typeof window.getCurrentUser === 'function' ? window.getCurrentUser() : null) || safeParse(localStorage.getItem('user'), {}); }
  function currentRole(){ return String(currentUser()?.role || localStorage.getItem('userRole') || '').toLowerCase().replace('-', '_'); }
  function isSuper(){ const r=currentRole(); return r === 'superadmin' || r === 'super_admin'; }

  // Super admin must never ask for a school-scoped owner branding record.
  if (window.BrandingManager) {
    const oldLoad = window.BrandingManager.loadSchoolBranding;
    window.BrandingManager.loadSchoolBranding = async function(force){
      if (isSuper()) {
        try { localStorage.removeItem('schoolBranding'); } catch (_) {}
        window.schoolBranding = {};
        if (typeof window.BrandingManager.forceApply === 'function') window.BrandingManager.forceApply('ShuleAI');
        return {};
      }
      return oldLoad ? oldLoad.call(this, force) : {};
    };
  }

  // Role-safe parent report-card API hook. helpers.js uses this when present.
  window.api = window.api || {};
  window.api.parent = window.api.parent || {};
  window.api.sms = window.api.sms || {};
  window.api.parent.getChildReportCardDetails = window.api.parent.getChildReportCardDetails || ((studentId) => apiReq(`/api/parent/child/${studentId}/report-card-details`));
  window.api.sms.getConfig = window.api.sms.getConfig || (() => apiReq('/api/sms/config'));
  window.api.sms.saveConfig = window.api.sms.saveConfig || ((payload) => apiReq('/api/sms/config', { method:'PUT', body:JSON.stringify(payload) }));
  window.api.sms.send = window.api.sms.send || ((payload) => apiReq('/api/sms/send', { method:'POST', body:JSON.stringify(payload) }));
  window.api.sms.getHistory = window.api.sms.getHistory || (() => apiReq('/api/sms/history'));

  function parseRecipients(value){ return String(value || '').split(/[\n,;]+/).map(s => s.trim()).filter(Boolean); }
  function parseProviders(value){ try { const parsed = JSON.parse(value || '[]'); return Array.isArray(parsed) ? parsed : []; } catch { throw new Error('Providers JSON is invalid'); } }

  window.v110RenderSms = async function(){
    const [configRes, historyRes] = await Promise.all([
      window.api.sms.getConfig().catch(e => ({ success:false, message:e.message, data:{} })),
      window.api.sms.getHistory ? window.api.sms.getHistory().catch(() => ({ data:[] })) : Promise.resolve({ data:[] })
    ]);
    const cfg = configRes.data || {};
    const history = historyRes.data || [];
    if (isSuper()) {
      return `<div class="space-y-6 animate-fade-in"><div class="rounded-2xl border bg-card p-6"><h2 class="text-3xl font-bold">Platform SMS Provider</h2><p class="text-sm text-muted-foreground mt-1">Only Super Admin manages provider credentials and school token allocation.</p></div><div class="rounded-2xl border bg-card p-6 space-y-4"><div class="grid md:grid-cols-2 gap-3"><label class="space-y-1"><span class="text-sm font-medium">Provider</span><input id="sms-provider" value="${esc(cfg.provider || '')}" class="w-full rounded-lg border bg-background px-3 py-2"></label><label class="space-y-1"><span class="text-sm font-medium">Sender ID</span><input id="sms-sender-id" value="${esc(cfg.senderId || 'SHULEAI')}" class="w-full rounded-lg border bg-background px-3 py-2"></label><label class="space-y-1 md:col-span-2"><span class="text-sm font-medium">API Key</span><input id="sms-api-key" value="" placeholder="Leave blank to keep existing" class="w-full rounded-lg border bg-background px-3 py-2"></label><label class="flex items-center gap-2 text-sm"><input id="sms-enabled" type="checkbox" ${cfg.providerConfigured ? 'checked' : ''}> Provider enabled/configured</label></div><div class="grid md:grid-cols-2 gap-3"><input id="sms-alloc-school" placeholder="School code e.g. SCH-2026-00001" class="rounded-lg border bg-background px-3 py-2"><input id="sms-alloc-tokens" type="number" placeholder="Token balance" class="rounded-lg border bg-background px-3 py-2"></div><button onclick="v113SaveSmsConfig()" class="px-5 py-3 rounded-xl bg-primary text-primary-foreground font-semibold">Save Platform SMS Settings</button></div></div>`;
    }
    const tokens = Number(cfg.tokensRemaining || 0);
    return `<div class="space-y-6 animate-fade-in"><div class="rounded-2xl border bg-card p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"><div><p class="text-xs uppercase tracking-wide text-muted-foreground">School SMS</p><h2 class="text-3xl font-bold">Bulk SMS Center</h2><p class="text-sm text-muted-foreground mt-1">Compose and send only. Provider/API credentials are controlled by Super Admin.</p></div><div class="rounded-xl border p-4 text-center"><b class="text-2xl">${tokens.toLocaleString()}</b><span class="block text-xs text-muted-foreground">Tokens Remaining</span></div></div><div class="grid xl:grid-cols-[.9fr_1.1fr] gap-5"><div class="rounded-2xl border bg-card p-6 space-y-4"><h3 class="font-semibold text-lg">Send SMS</h3><label class="space-y-1 block"><span class="text-sm font-medium">Audience / Recipients</span><textarea id="sms-recipients" rows="5" class="w-full rounded-lg border bg-background px-3 py-2" placeholder="2547..., one per line or comma separated"></textarea></label><label class="space-y-1 block"><span class="text-sm font-medium">Message</span><textarea id="sms-message" rows="7" maxlength="480" class="w-full rounded-lg border bg-background px-3 py-2" placeholder="Type school SMS..."></textarea></label><button onclick="v113SendSmsDraft()" class="px-5 py-3 rounded-xl bg-primary text-primary-foreground font-semibold">Send SMS</button><div id="sms-send-result" class="text-sm"></div></div><div class="rounded-2xl border bg-card p-6"><h3 class="font-semibold text-lg mb-3">SMS History</h3><div class="space-y-2 max-h-[420px] overflow-auto">${history.length ? history.map(row => `<div class="rounded-lg border p-3 text-sm"><div class="flex justify-between gap-3"><b>${esc(row.audience || 'Audience')}</b><span class="text-xs text-muted-foreground">${esc(row.createdAt || '')}</span></div><p class="mt-1">${esc(row.message || '')}</p><p class="text-xs text-muted-foreground mt-1">Reached: ${Number(row.successCount || 0)} • Failed: ${Number(row.failedCount || 0)} • Tokens: ${Number(row.tokensUsed || 0)}</p></div>`).join('') : '<p class="text-sm text-muted-foreground">No SMS sent yet.</p>'}</div></div></div></div>`;
  };

  window.v113SaveSmsConfig = async function(){
    const payload = { provider: $('sms-provider')?.value || '', senderId: $('sms-sender-id')?.value || 'SHULEAI', apiKey: $('sms-api-key')?.value || undefined, enabled: !!$('sms-enabled')?.checked };
    const schoolCode = $('sms-alloc-school')?.value?.trim();
    const tokens = $('sms-alloc-tokens')?.value;
    if (schoolCode) { payload.schoolCode = schoolCode; payload.tokens = Number(tokens || 0); }
    await window.api.sms.saveConfig(payload);
    toast('SMS settings saved');
    await window.showDashboardSection?.('sms');
  };
  window.v113SendSmsDraft = async function(){
    const result = $('sms-send-result');
    try {
      const recipients = parseRecipients($('sms-recipients')?.value);
      const payload = { recipients, recipientCount: recipients.length, audience:'manual_sms', message: $('sms-message')?.value || '' };
      const res = await window.api.sms.send(payload);
      if (result) result.innerHTML = `<div class="rounded-xl border p-3 ${res.queued ? 'text-green-700' : 'text-amber-700'}">${esc(res.message || 'SMS processed')}<pre class="text-xs mt-2 whitespace-pre-wrap">${esc(JSON.stringify(res.data || {}, null, 2))}</pre></div>`;
      toast(res.message || 'SMS processed', res.queued ? 'success' : 'info');
    } catch(e) { if (result) result.innerHTML = `<div class="rounded-xl border border-red-300 p-3 text-red-600">${esc(e.message)}</div>`; toast(e.message || 'SMS failed', 'error'); }
  };

  // Force true super-admin/platform analytics, never admin analytics.
  window.v112RenderSuperAdminAnalytics = async function(){
    const [analyticsRes, overviewRes] = await Promise.all([
      (window.api?.superAdmin?.getAnalytics ? window.api.superAdmin.getAnalytics() : apiReq('/api/super-admin/analytics')).catch(() => ({data:{}})),
      apiReq('/api/super-admin/overview').catch(() => ({data:{}}))
    ]);
    const data = analyticsRes.data || {};
    const overview = { ...(overviewRes.data || {}), ...(data.overview || {}) };
    const cards = [
      ['Total Schools', overview.totalSchools ?? overview.schools ?? 0],
      ['Active Schools', overview.activeSchools ?? 0],
      ['Pending Schools', overview.pendingSchools ?? 0],
      ['Students', overview.totalStudents ?? overview.students ?? 0],
      ['Teachers', overview.totalTeachers ?? overview.teachers ?? 0],
      ['Parents', overview.totalParents ?? overview.parents ?? 0],
      ['Revenue MTD', `KES ${Number(overview.revenueMTD ?? overview.totalRevenue ?? 0).toLocaleString()}`]
    ];
    setTimeout(() => {
      try {
        if (data.growth?.labels?.length && typeof initLineChart === 'function') initLineChart('v113-platform-growth', data.growth.labels, data.growth.values || [], 'Schools');
        if (data.revenueTrend?.labels?.length && typeof initBarChart === 'function') initBarChart('v113-platform-revenue', data.revenueTrend.labels, data.revenueTrend.values || [], 'KES');
        if (data.distributionByCurriculum && typeof initDoughnutChart === 'function') initDoughnutChart('v113-platform-curriculum', Object.keys(data.distributionByCurriculum), Object.values(data.distributionByCurriculum));
      } catch (_) {}
    }, 120);
    return `<div class="space-y-6 animate-fade-in analytics-container">
      <div class="flex items-center justify-between gap-3 flex-wrap"><div><h2 class="text-2xl font-bold">Super Admin Platform Analytics</h2><p class="text-sm text-muted-foreground">Platform-wide totals across all schools. This section is isolated from admin/school analytics.</p></div><span class="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary">Platform scope only</span></div>
      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">${cards.map(c => `<div class="rounded-xl border bg-card p-4"><p class="text-sm text-muted-foreground">${esc(c[0])}</p><h3 class="text-xl font-bold mt-1">${esc(c[1])}</h3></div>`).join('')}</div>
      <div class="grid gap-4 lg:grid-cols-2"><div class="rounded-xl border bg-card p-6 analytics-card"><h3 class="font-semibold mb-4">School Growth</h3><div class="chart-container"><canvas id="v113-platform-growth"></canvas></div></div><div class="rounded-xl border bg-card p-6 analytics-card"><h3 class="font-semibold mb-4">Platform Revenue</h3><div class="chart-container"><canvas id="v113-platform-revenue"></canvas></div></div></div>
      <div class="grid gap-4 lg:grid-cols-2"><div class="rounded-xl border bg-card p-6 analytics-card"><h3 class="font-semibold mb-4">Curriculum Distribution</h3><div class="chart-container"><canvas id="v113-platform-curriculum"></canvas></div></div><div class="rounded-xl border bg-card p-6"><h3 class="font-semibold mb-3">Access / Level Snapshot</h3><pre class="text-xs bg-muted rounded-lg p-3 overflow-auto">${esc(JSON.stringify({ distributionByLevel:data.distributionByLevel || {}, distributionByCurriculum:data.distributionByCurriculum || {} }, null, 2))}</pre></div></div>
    </div>`;
  };

  const oldRenderAdmin = window.renderAdminSection;
  if (typeof oldRenderAdmin === 'function') {
    window.renderAdminSection = async function(section){
      if (section === 'sms') return await window.v110RenderSms();
      return oldRenderAdmin.call(this, section);
    };
  }
  const oldRenderSuper = window.renderSuperAdminSection;
  if (typeof oldRenderSuper === 'function') {
    window.renderSuperAdminSection = async function(section){
      if (section === 'analytics') return await window.v112RenderSuperAdminAnalytics();
      if (section === 'sms') return await window.v110RenderSms();
      return oldRenderSuper.call(this, section);
    };
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (isSuper() && window.BrandingManager?.forceApply) window.BrandingManager.forceApply('ShuleAI');
  });
})();

/* ---- end merged from v113-access-billing-hotfix.js ---- */

/* ---- merged from v114-isolation-subjects-payments-hotfix.js ---- */

// Shule AI v114 isolation + custom subject + parent subscription hotfix.
(function(){
  'use strict';
  const $ = (id) => document.getElementById(id);
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const arr = (v) => Array.isArray(v?.data) ? v.data : (Array.isArray(v) ? v : []);
  const toast = (m,t='info') => (typeof showToast === 'function' ? showToast(m,t) : console.log(`[${t}]`, m));
  const apiReq = (url, opts={}) => window.apiRequest ? window.apiRequest(url, opts) : fetch(url, opts).then(r=>r.json());
  function currentUser(){ try { const u = typeof getCurrentUser === 'function' ? getCurrentUser() : JSON.parse(localStorage.getItem('user') || '{}'); return u && typeof u === 'object' ? u : {}; } catch { return {}; } }
  function selectedChildId(){ return String(window.dashboardData?.selectedChildId || localStorage.getItem('shule_selected_child_id') || '').trim(); }
  function isParent(){ return String(currentUser()?.role || localStorage.getItem('role') || '').toLowerCase() === 'parent'; }

  // ---------------- Parent chat isolation: every parent conversation request is child-scoped.
  function messageAttachment(m){ const a = m?.metadata?.attachment || m?.attachment; if(!a) return ''; const url = a.url || a.fileUrl || a.path || '#'; return `<div class="mt-2 text-xs"><a class="underline" target="_blank" href="${esc(url)}">📎 ${esc(a.originalName || a.filename || 'Attachment')}</a></div>`; }
  window.loadParentRecipientConversation = async function(){
    const box = $('parent-chat-messages'); if(!box) return;
    const type = $('parent-recipient-type')?.value || 'teacher';
    const studentId = selectedChildId();
    if (!studentId) { box.innerHTML = '<div class="text-center text-muted-foreground py-8">Select a child first.</div>'; return; }
    box.innerHTML = '<div class="text-center text-muted-foreground py-8">Loading child-specific conversation...</div>';
    try {
      const qs = new URLSearchParams({ studentId, recipientType:type }).toString();
      const convRes = await apiReq(`/api/parent/conversations?${qs}`).catch(()=>({data:[]}));
      const conversations = arr(convRes);
      const wanted = type === 'admin' ? 'parent_admin' : 'parent_class_teacher';
      const match = conversations.find(c => c.conversationType === wanted && String(c.studentId || '') === String(studentId));
      let messages = [];
      if (match?.userId) messages = arr(await apiReq(`/api/parent/messages/${match.userId}?${qs}`).catch(()=>({data: match.messages || []})));
      else messages = arr(match?.messages || []);
      const me = currentUser();
      box.innerHTML = messages.length ? messages.map(m => {
        const mine = Number(m.senderId) === Number(me.id);
        return `<div class="flex ${mine?'justify-end':'justify-start'}"><div class="max-w-[75%] rounded-2xl px-4 py-2 ${mine?'bg-primary text-primary-foreground':'bg-background border'}"><p class="text-sm whitespace-pre-wrap">${esc(m.content || '')}</p>${messageAttachment(m)}<p class="text-[10px] opacity-70 mt-1">${m.createdAt ? new Date(m.createdAt).toLocaleString() : ''}</p></div></div>`;
      }).join('') : '<div class="text-center text-muted-foreground py-8">No messages for this child and recipient yet. Send the first message.</div>';
      box.scrollTop = box.scrollHeight;
    } catch(e){ box.innerHTML = `<div class="text-center text-red-500 py-8">${esc(e.message || 'Could not load conversation')}</div>`; }
  };

  window.sendParentMessage = async function(){
    const input = $('parent-chat-input'); const file = $('parent-chat-attachment')?.files?.[0] || null; const text = input?.value?.trim() || '';
    const studentId = selectedChildId();
    if(!studentId) return toast('Select a child first','error');
    if(!text && !file) return toast('Type a message or attach a file','error');
    let attachment = null;
    if(file && window.api?.chatV9?.uploadAttachment){ const fd = new FormData(); fd.append('file', file); const up = await window.api.chatV9.uploadAttachment(fd); attachment = up.data || up.file || up; attachment.originalName = attachment.originalName || file.name; }
    await (window.api?.parent?.sendMessage ? window.api.parent.sendMessage({ studentId:Number(studentId), message:text || file?.name || '', recipientType:$('parent-recipient-type')?.value || 'teacher', attachment }) : apiReq('/api/parent/message', { method:'POST', body:JSON.stringify({ studentId:Number(studentId), message:text || file?.name || '', recipientType:$('parent-recipient-type')?.value || 'teacher', attachment }) }));
    if(input) input.value=''; if($('parent-chat-attachment')) $('parent-chat-attachment').value='';
    await window.loadParentRecipientConversation();
    toast('Message sent for the selected child only','success');
  };

  // Clear stale child-scoped visuals on child switch.
  const oldSelectChild = window.selectChild;
  if (typeof oldSelectChild === 'function' && !oldSelectChild.__v114Scoped) {
    const wrapped = async function(childId){
      document.querySelectorAll('#parent-chat-messages,#parent-student-payment-history,#alerts-center-v82').forEach(el => { el.innerHTML = '<div class="text-center py-8 text-muted-foreground">Switching child...</div>'; });
      localStorage.setItem('shule_selected_child_id', childId);
      return oldSelectChild.apply(this, arguments);
    };
    wrapped.__v114Scoped = true;
    window.selectChild = wrapped;
  }

  // ---------------- Parent payments: restore platform subscription cards beside school fees.
  function money(v){ return `KES ${Number(v || 0).toLocaleString()}`; }
  async function getPlans(){
    const res = await (window.api?.parent?.getSubscriptionPlans ? window.api.parent.getSubscriptionPlans() : apiReq('/api/parent/plans')).catch(()=>({data:[]}));
    const plans = arr(res);
    return plans.length ? plans : [
      {code:'child_basic', name:'Basic', monthlyPriceKes:100, features:['Report cards','Attendance','Progress'], limits:{aiTutor:false, aiQuestionsPerDay:0, aiQuestionsPerMonth:0}},
      {code:'child_premium', name:'Premium', monthlyPriceKes:250, features:['Everything in Basic','AI Tutor: 6 messages/day','Child timetable if school has timetable'], limits:{aiTutor:true, aiQuestionsPerDay:6, aiQuestionsPerMonth:180}},
      {code:'child_ultimate', name:'Ultimate', monthlyPriceKes:500, features:['Everything in Premium','Extended AI Tutor','Live child analytics','Stronger alerts','Child recommendations'], limits:{aiTutor:true, aiQuestionsPerDay:50, aiQuestionsPerMonth:1500}}
    ];
  }
  window.v114StartParentSubscription = async function(planCode, amount){
    const studentId = selectedChildId(); const phone = $('payment-phone')?.value?.trim() || currentUser().phone || currentUser().phoneNumber || '';
    if(!studentId) return toast('Select a child first','error');
    if(!phone) return toast('Enter the M-Pesa phone number in the payment form first','error');
    await (window.api?.payments?.parentSubscriptionSTK ? window.api.payments.parentSubscriptionSTK({ studentId:Number(studentId), planCode, plan:planCode, amount:Number(amount), phone, billingCycle:'monthly', reference:`SUB-${Date.now()}` }) : apiReq('/api/payments/parent/subscription/stk',{ method:'POST', body:JSON.stringify({ studentId:Number(studentId), planCode, plan:planCode, amount:Number(amount), phone, billingCycle:'monthly' }) }));
    toast('Subscription request started. Complete the STK push or submit manual verification if configured.','success');
  };
  const oldParentPayments = window.renderParentPayments || window.v12RenderParentPayments;
  window.v114RenderParentPayments = async function(){
    const base = oldParentPayments ? await oldParentPayments() : '<div id="parent-payments-root"></div>';
    const plans = await getPlans();
    const studentId = selectedChildId();
    const cards = `<div class="rounded-xl border bg-card p-6"><div class="flex items-center justify-between gap-3 flex-wrap mb-4"><div><h3 class="font-semibold text-lg">Shule AI Platform Subscription</h3><p class="text-sm text-muted-foreground">These cards are separate from school fees and apply only to the selected child.</p></div><span class="text-xs rounded-full px-3 py-1 bg-primary/10 text-primary">Child ID: ${esc(studentId || 'select child')}</span></div><div class="grid gap-4 md:grid-cols-3">${plans.map(p => { const code = p.code || p.id || p.name; const amount = Number(p.monthlyPriceKes ?? p.price ?? p.amount ?? 0); const features = Array.isArray(p.features) ? p.features : []; return `<div class="rounded-2xl border p-5 bg-gradient-to-br from-background to-muted/30 flex flex-col"><p class="text-xs uppercase tracking-wide text-muted-foreground">${esc(p.interval || 'monthly')}</p><h4 class="text-xl font-bold mt-1">${esc(p.displayName || p.name || code)}</h4><p class="text-2xl font-extrabold mt-2">${money(amount)}<span class="text-xs font-normal text-muted-foreground"> / month</span></p><ul class="text-sm text-muted-foreground mt-3 space-y-1 flex-1">${features.slice(0,5).map(f=>`<li>✓ ${esc(f)}</li>`).join('') || '<li>✓ Student reports</li><li>✓ Attendance & progress</li>'}</ul><button class="mt-4 w-full rounded-xl bg-primary text-primary-foreground py-2 font-semibold" onclick="v114StartParentSubscription('${esc(code)}', ${amount})">Choose ${esc(p.displayName || p.name || code)}</button></div>`; }).join('')}</div></div>`;
    if (base.includes('id="parent-payments-root"')) return base.replace('<div class="grid gap-4 lg:grid-cols-3">', `${cards}<div class="grid gap-4 lg:grid-cols-3">`);
    return `<div class="space-y-6">${cards}${base}</div>`;
  };
  window.renderParentPayments = window.v114RenderParentPayments;
  window.v12RenderParentPayments = window.v114RenderParentPayments;

  // ---------------- Admin Custom Subjects: add whole-school/class custom subject form.
  function parseSubjectData(cb){ try { return JSON.parse((cb.dataset.subject || '{}').replace(/&#39;/g,"'")); } catch { return null; } }
  window.v114SaveSchoolSubjectCheckboxes = async function(){
    const subjects = Array.from(document.querySelectorAll('.v102-school-subject:checked')).map(parseSubjectData).filter(Boolean);
    await (window.api?.admin?.saveSchoolSubjects ? window.api.admin.saveSchoolSubjects(subjects) : apiReq('/api/admin/curriculum/school-subjects',{method:'PUT', body:JSON.stringify({subjects})}));
    toast(`✅ ${subjects.length} subject(s) saved and synced`, 'success');
    await window.showDashboardSection?.('custom-subjects');
  };
  window.v114AddCustomSubjectToList = function(){
    const name = $('v114-custom-subject-name')?.value?.trim(); if(!name) return toast('Enter the custom subject name','error');
    const scope = $('v114-custom-subject-scope')?.value || 'school';
    const classId = $('v114-custom-subject-class')?.value || '';
    const selectedLevels = Array.from(document.querySelectorAll('.v114-custom-level:checked')).map(x=>x.value);
    if(scope === 'class' && !classId) return toast('Choose the class for this subject','error');
    const subject = { id:`custom_${name.toLowerCase().replace(/[^a-z0-9]+/g,'_')}_${Date.now()}`, name, subjectName:name, category:'custom', isCustom:true, source:'custom', scope, classIds: scope === 'class' ? [Number(classId)] : [], levelCodes: scope === 'school' ? selectedLevels : [], isOptional:true, countsInFinalByDefault:true, isOffered:true };
    const holder = $('v114-custom-subjects-holder'); if(!holder) return;
    holder.insertAdjacentHTML('beforeend', `<label class="flex items-start gap-2 p-3 rounded-lg border bg-emerald-50/60 dark:bg-emerald-950/20"><input type="checkbox" checked class="v102-school-subject mt-1" data-subject='${esc(JSON.stringify(subject))}'><span><span class="font-medium text-sm">${esc(name)}</span><span class="block text-xs text-muted-foreground">Custom • ${scope === 'class' ? 'Class only' : (selectedLevels.length ? 'Selected levels' : 'Whole school')}</span></span></label>`);
    $('v114-custom-subject-name').value = '';
    toast(`Added ${name}. Press Save Subjects to persist it.`, 'success');
  };
  const oldCustomRenderer = window.renderAdminCustomSubjects;
  window.renderAdminCustomSubjects = async function(){
    const [setupRes, classRes] = await Promise.all([
      (window.api?.admin?.getCurriculumSetup ? window.api.admin.getCurriculumSetup() : apiReq('/api/admin/curriculum/setup')).catch(()=>({data:{}})),
      (window.api?.admin?.getClasses ? window.api.admin.getClasses() : apiReq('/api/admin/classes')).catch(()=>({data:[]}))
    ]);
    const data = setupRes.data || {}; const cfg = data.config || {}; const levels = data.levels || []; const subjects = data.subjectBank || []; const classes = arr(classRes);
    const savedRows = Array.isArray(cfg.schoolSubjects) ? cfg.schoolSubjects : [];
    const saved = new Set(savedRows.filter(s=>s.isOffered!==false).map(s=>s.subjectId || s.id || s.name));
    const customSaved = savedRows.filter(s => s.isCustom || s.category === 'custom');
    const grouped = subjects.reduce((acc,s)=>{ const group = (s.levelLabels && s.levelLabels[0]) || (s.levelCodes && s.levelCodes[0]) || 'Subjects'; (acc[group] ||= []).push(s); return acc; }, {});
    return `<div class="space-y-6 animate-fade-in"><div class="flex justify-between items-center"><div><h2 class="text-2xl font-bold">Add Subjects</h2><p class="text-sm text-muted-foreground">Choose curriculum subjects and add custom subjects for the whole school or a specific class.</p></div><button onclick="v114SaveSchoolSubjectCheckboxes()" class="px-4 py-2 bg-primary text-primary-foreground rounded-lg">Save Subjects</button></div>
      <div class="rounded-xl border bg-card p-6 space-y-4"><h3 class="font-semibold">Add Custom Subject</h3><div class="grid gap-3 md:grid-cols-4"><input id="v114-custom-subject-name" class="rounded-lg border bg-background px-3 py-2" placeholder="e.g. Robotics, French, Swimming"><select id="v114-custom-subject-scope" class="rounded-lg border bg-background px-3 py-2" onchange="document.getElementById('v114-class-wrap').style.display=this.value==='class'?'block':'none';document.getElementById('v114-level-wrap').style.display=this.value==='school'?'block':'none';"><option value="school">Whole school / selected levels</option><option value="class">Specific class only</option></select><div id="v114-class-wrap" style="display:none"><select id="v114-custom-subject-class" class="w-full rounded-lg border bg-background px-3 py-2"><option value="">Choose class</option>${classes.map(c=>`<option value="${esc(c.id)}">${esc(c.name || c.grade || ('Class '+c.id))}</option>`).join('')}</select></div><button type="button" onclick="v114AddCustomSubjectToList()" class="rounded-lg bg-emerald-600 text-white px-4 py-2">Add Subject</button></div><div id="v114-level-wrap" class="grid gap-2 md:grid-cols-4 text-sm">${levels.map(l=>`<label class="flex items-center gap-2 rounded border p-2"><input type="checkbox" class="v114-custom-level" value="${esc(l.code)}">${esc(l.label || l.code)}</label>`).join('')}<p class="md:col-span-4 text-xs text-muted-foreground">Leave levels unchecked to make the custom subject available across the whole school.</p></div><div id="v114-custom-subjects-holder" class="grid gap-3 md:grid-cols-3">${customSaved.map(s=>`<label class="flex items-start gap-2 p-3 rounded-lg border bg-emerald-50/60 dark:bg-emerald-950/20"><input type="checkbox" checked class="v102-school-subject mt-1" data-subject='${esc(JSON.stringify(s))}'><span><span class="font-medium text-sm">${esc(s.name)}</span><span class="block text-xs text-muted-foreground">Custom • ${esc(s.scope || 'school')}</span></span></label>`).join('')}</div></div>
      <div class="rounded-xl border bg-card p-6"><h3 class="font-semibold mb-3">Curriculum Source</h3><div class="grid md:grid-cols-3 gap-3 text-sm"><div class="p-3 bg-muted/30 rounded-lg"><p class="text-muted-foreground">Curriculum</p><p class="font-bold">${esc(cfg.curriculum || 'cbc')}</p></div><div class="p-3 bg-muted/30 rounded-lg"><p class="text-muted-foreground">Structure</p><p class="font-bold">${esc(cfg.structureType || 'mixed')}</p></div><div class="p-3 bg-muted/30 rounded-lg"><p class="text-muted-foreground">Enabled Levels</p><p class="font-bold">${levels.length}</p></div></div></div>
      <div class="space-y-4">${Object.entries(grouped).map(([group,items])=>`<div class="rounded-xl border bg-card p-5"><div class="flex items-center justify-between mb-3"><h3 class="font-semibold">${esc(group)}</h3><button type="button" onclick="document.querySelectorAll('[data-v102-group=&quot;${esc(group)}&quot;] input').forEach(cb=>cb.checked=true)" class="text-xs px-2 py-1 rounded bg-primary/10 text-primary">Check all</button></div><div class="grid md:grid-cols-3 gap-3">${items.map(s=>`<label data-v102-group="${esc(group)}" class="flex items-start gap-2 p-3 rounded-lg border bg-muted/20"><input type="checkbox" class="v102-school-subject mt-1" data-subject='${esc(JSON.stringify(s))}' ${saved.has(s.id) || saved.has(s.name) ? 'checked' : ''}><span><span class="font-medium text-sm">${esc(s.name)}</span><span class="block text-xs text-muted-foreground">${esc(s.category || 'subject')}${s.pathway ? ` • ${esc(s.pathway)}` : ''}</span></span></label>`).join('')}</div></div>`).join('')}</div><div class="flex justify-end"><button onclick="v114SaveSchoolSubjectCheckboxes()" class="px-6 py-3 bg-primary text-primary-foreground rounded-lg">Save Subjects</button></div></div>`;
  };
  try { if (typeof renderAdminCustomSubjects !== 'undefined') renderAdminCustomSubjects = window.renderAdminCustomSubjects; } catch(_) {}

  // ---------------- Remove the old Parent Messages dashboard card from teacher dashboard only.
  function hideTeacherDashboardParentMessages(){
    const user = currentUser(); if(String(user.role || '').toLowerCase() !== 'teacher') return;
    document.querySelectorAll('#teacher-message-count-badge, #teacher-messages-list').forEach(el => {
      const card = el.closest('.rounded-xl.border.bg-card.p-6') || el.parentElement;
      if(card) { card.style.display = 'none'; card.setAttribute('data-v114-removed','dashboard-parent-messages'); }
    });
  }
  const oldTeacherDashboard = window.renderTeacherDashboard;
  if (typeof oldTeacherDashboard === 'function' && !oldTeacherDashboard.__v114NoParentCard) {
    const wrapped = async function(){ const html = await oldTeacherDashboard.apply(this, arguments); setTimeout(hideTeacherDashboardParentMessages, 80); return html; };
    wrapped.__v114NoParentCard = true; window.renderTeacherDashboard = wrapped;
  }
  const obs = new MutationObserver(hideTeacherDashboardParentMessages);
  document.addEventListener('DOMContentLoaded', () => { hideTeacherDashboardParentMessages(); try{ if(document.body) obs.observe(document.body,{childList:true,subtree:true}); }catch(_){} });
})();

/* ---- end merged from v114-isolation-subjects-payments-hotfix.js ---- */

/* ---- merged from v115-isolation-subjects-payments-hotfix.js ---- */

// Shule AI v115 isolation + custom subject + parent subscription verification hotfix.
(function(){
  'use strict';
  const $ = (id) => document.getElementById(id);
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const arr = (v) => Array.isArray(v?.data) ? v.data : (Array.isArray(v) ? v : []);
  const toast = (m,t='info') => (typeof showToast === 'function' ? showToast(m,t) : console.log(`[${t}]`, m));
  const apiReq = (url, opts={}) => window.apiRequest ? window.apiRequest(url, opts) : fetch(url, opts).then(r=>r.json());
  function currentUser(){ try { const u = typeof getCurrentUser === 'function' ? getCurrentUser() : JSON.parse(localStorage.getItem('user') || '{}'); return u && typeof u === 'object' ? u : {}; } catch { return {}; } }
  function selectedChildId(){ return String(window.dashboardData?.selectedChildId || localStorage.getItem('shule_selected_child_id') || '').trim(); }
  function isParent(){ return String(currentUser()?.role || localStorage.getItem('role') || '').toLowerCase() === 'parent'; }

  // ---------------- Parent chat isolation: every parent conversation request is child-scoped.
  function messageAttachment(m){ const a = m?.metadata?.attachment || m?.attachment; if(!a) return ''; const url = a.url || a.fileUrl || a.path || '#'; return `<div class="mt-2 text-xs"><a class="underline" target="_blank" href="${esc(url)}">📎 ${esc(a.originalName || a.filename || 'Attachment')}</a></div>`; }
  window.loadParentRecipientConversation = async function(){
    const box = $('parent-chat-messages'); if(!box) return;
    const type = $('parent-recipient-type')?.value || 'teacher';
    const studentId = selectedChildId();
    if (!studentId) { box.innerHTML = '<div class="text-center text-muted-foreground py-8">Select a child first.</div>'; return; }
    box.innerHTML = '<div class="text-center text-muted-foreground py-8">Loading child-specific conversation...</div>';
    try {
      const qs = new URLSearchParams({ studentId, recipientType:type }).toString();
      const convRes = await (window.api?.parent?.getConversations ? window.api.parent.getConversations({ studentId, recipientType:type }) : apiReq(`/api/parent/conversations?${qs}`)).catch(()=>({data:[]}));
      const conversations = arr(convRes);
      const wanted = type === 'admin' ? 'parent_admin' : 'parent_class_teacher';
      const match = conversations.find(c => c.conversationType === wanted && String(c.studentId || '') === String(studentId));
      let messages = [];
      if (match?.userId) messages = arr(await (window.api?.parent?.getMessages ? window.api.parent.getMessages(match.userId, { studentId, recipientType:type }) : apiReq(`/api/parent/messages/${match.userId}?${qs}`)).catch(()=>({data: match.messages || []})));
      else messages = arr(match?.messages || []);
      const me = currentUser();
      box.innerHTML = messages.length ? messages.map(m => {
        const mine = Number(m.senderId) === Number(me.id);
        return `<div class="flex ${mine?'justify-end':'justify-start'}"><div class="max-w-[75%] rounded-2xl px-4 py-2 ${mine?'bg-primary text-primary-foreground':'bg-background border'}"><p class="text-sm whitespace-pre-wrap">${esc(m.content || '')}</p>${messageAttachment(m)}<p class="text-[10px] opacity-70 mt-1">${m.createdAt ? new Date(m.createdAt).toLocaleString() : ''}</p></div></div>`;
      }).join('') : '<div class="text-center text-muted-foreground py-8">No messages for this child and recipient yet. Send the first message.</div>';
      box.scrollTop = box.scrollHeight;
    } catch(e){ box.innerHTML = `<div class="text-center text-red-500 py-8">${esc(e.message || 'Could not load conversation')}</div>`; }
  };

  window.sendParentMessage = async function(){
    const input = $('parent-chat-input'); const file = $('parent-chat-attachment')?.files?.[0] || null; const text = input?.value?.trim() || '';
    const studentId = selectedChildId();
    if(!studentId) return toast('Select a child first','error');
    if(!text && !file) return toast('Type a message or attach a file','error');
    let attachment = null;
    if(file && window.api?.chatV9?.uploadAttachment){ const fd = new FormData(); fd.append('file', file); const up = await window.api.chatV9.uploadAttachment(fd); attachment = up.data || up.file || up; attachment.originalName = attachment.originalName || file.name; }
    await (window.api?.parent?.sendMessage ? window.api.parent.sendMessage({ studentId:Number(studentId), message:text || file?.name || '', recipientType:$('parent-recipient-type')?.value || 'teacher', attachment }) : apiReq('/api/parent/message', { method:'POST', body:JSON.stringify({ studentId:Number(studentId), message:text || file?.name || '', recipientType:$('parent-recipient-type')?.value || 'teacher', attachment }) }));
    if(input) input.value=''; if($('parent-chat-attachment')) $('parent-chat-attachment').value='';
    await window.loadParentRecipientConversation();
    toast('Message sent for the selected child only','success');
  };

  // Clear stale child-scoped visuals on child switch.
  const oldSelectChild = window.selectChild;
  if (typeof oldSelectChild === 'function' && !oldSelectChild.__v114Scoped) {
    const wrapped = async function(childId){
      document.querySelectorAll('#parent-chat-messages,#parent-student-payment-history,#alerts-center-v82').forEach(el => { el.innerHTML = '<div class="text-center py-8 text-muted-foreground">Switching child...</div>'; });
      localStorage.setItem('shule_selected_child_id', childId);
      return oldSelectChild.apply(this, arguments);
    };
    wrapped.__v114Scoped = true;
    window.selectChild = wrapped;
  }

  // ---------------- Parent payments: restore platform subscription cards beside school fees.
  function money(v){ return `KES ${Number(v || 0).toLocaleString()}`; }
  async function getPlans(){
    const res = await (window.api?.parent?.getSubscriptionPlans ? window.api.parent.getSubscriptionPlans() : apiReq('/api/parent/plans')).catch(()=>({data:[]}));
    const plans = arr(res);
    return plans.length ? plans : [
      {code:'child_basic', name:'Basic', monthlyPriceKes:100, features:['Report cards','Attendance','Progress'], limits:{aiTutor:false, aiQuestionsPerDay:0, aiQuestionsPerMonth:0}},
      {code:'child_premium', name:'Premium', monthlyPriceKes:250, features:['Everything in Basic','AI Tutor: 6 messages/day','Child timetable if school has timetable'], limits:{aiTutor:true, aiQuestionsPerDay:6, aiQuestionsPerMonth:180}},
      {code:'child_ultimate', name:'Ultimate', monthlyPriceKes:500, features:['Everything in Premium','Extended AI Tutor','Live child analytics','Stronger alerts','Child recommendations'], limits:{aiTutor:true, aiQuestionsPerDay:50, aiQuestionsPerMonth:1500}}
    ];
  }
  window.v114StartParentSubscription = async function(planCode, amount){
    const studentId = selectedChildId(); const phone = $('payment-phone')?.value?.trim() || currentUser().phone || currentUser().phoneNumber || '';
    if(!studentId) return toast('Select a child first','error');
    if(!phone) return toast('Enter the M-Pesa phone number in the payment form first','error');
    await (window.api?.payments?.parentSubscriptionSTK ? window.api.payments.parentSubscriptionSTK({ studentId:Number(studentId), planCode, plan:planCode, amount:Number(amount), phone, billingCycle:'monthly', reference:`SUB-${Date.now()}` }) : apiReq('/api/payments/parent/subscription/stk',{ method:'POST', body:JSON.stringify({ studentId:Number(studentId), planCode, plan:planCode, amount:Number(amount), phone, billingCycle:'monthly' }) }));
    toast('Subscription request started. Complete the STK push or submit manual verification if configured.','success');
  };
  const oldParentPayments = window.renderParentPayments || window.v12RenderParentPayments;
  window.v114RenderParentPayments = async function(){
    const base = oldParentPayments ? await oldParentPayments() : '<div id="parent-payments-root"></div>';
    const plans = await getPlans();
    const studentId = selectedChildId();
    const cards = `<div class="rounded-xl border bg-card p-6"><div class="flex items-center justify-between gap-3 flex-wrap mb-4"><div><h3 class="font-semibold text-lg">Shule AI Platform Subscription</h3><p class="text-sm text-muted-foreground">These cards are separate from school fees and apply only to the selected child.</p></div><span class="text-xs rounded-full px-3 py-1 bg-primary/10 text-primary">Child ID: ${esc(studentId || 'select child')}</span></div><div class="grid gap-4 md:grid-cols-3">${plans.map(p => { const code = p.code || p.id || p.name; const amount = Number(p.monthlyPriceKes ?? p.price ?? p.amount ?? 0); const features = Array.isArray(p.features) ? p.features : []; return `<div class="rounded-2xl border p-5 bg-gradient-to-br from-background to-muted/30 flex flex-col"><p class="text-xs uppercase tracking-wide text-muted-foreground">${esc(p.interval || 'monthly')}</p><h4 class="text-xl font-bold mt-1">${esc(p.displayName || p.name || code)}</h4><p class="text-2xl font-extrabold mt-2">${money(amount)}<span class="text-xs font-normal text-muted-foreground"> / month</span></p><ul class="text-sm text-muted-foreground mt-3 space-y-1 flex-1">${features.slice(0,5).map(f=>`<li>✓ ${esc(f)}</li>`).join('') || '<li>✓ Student reports</li><li>✓ Attendance & progress</li>'}</ul><button class="mt-4 w-full rounded-xl bg-primary text-primary-foreground py-2 font-semibold" onclick="v114StartParentSubscription('${esc(code)}', ${amount})">Choose ${esc(p.displayName || p.name || code)}</button></div>`; }).join('')}</div></div>`;
    if (String(base).includes('Shule AI Platform Subscription')) return base;
    return `<div class="space-y-6">${cards}${base}</div>`;
  };
  window.renderParentPayments = window.v114RenderParentPayments;
  window.v12RenderParentPayments = window.v114RenderParentPayments;

  // ---------------- Admin Custom Subjects: add whole-school/class custom subject form.
  function parseSubjectData(cb){ try { return JSON.parse((cb.dataset.subject || '{}').replace(/&#39;/g,"'")); } catch { return null; } }
  window.v114SaveSchoolSubjectCheckboxes = async function(){
    const subjects = Array.from(document.querySelectorAll('.v102-school-subject:checked')).map(parseSubjectData).filter(Boolean);
    await (window.api?.admin?.saveSchoolSubjects ? window.api.admin.saveSchoolSubjects(subjects) : apiReq('/api/admin/curriculum/school-subjects',{method:'PUT', body:JSON.stringify({subjects})}));
    toast(`✅ ${subjects.length} subject(s) saved and synced`, 'success');
    await window.showDashboardSection?.('custom-subjects');
  };
  window.v114AddCustomSubjectToList = function(){
    const name = $('v114-custom-subject-name')?.value?.trim(); if(!name) return toast('Enter the custom subject name','error');
    const scope = $('v114-custom-subject-scope')?.value || 'school';
    const classId = $('v114-custom-subject-class')?.value || '';
    const selectedLevels = Array.from(document.querySelectorAll('.v114-custom-level:checked')).map(x=>x.value);
    if(scope === 'class' && !classId) return toast('Choose the class for this subject','error');
    const subject = { id:`custom_${name.toLowerCase().replace(/[^a-z0-9]+/g,'_')}_${Date.now()}`, name, subjectName:name, category:'custom', isCustom:true, source:'custom', scope, classIds: scope === 'class' ? [Number(classId)] : [], levelCodes: scope === 'school' ? selectedLevels : [], isOptional:true, countsInFinalByDefault:true, isOffered:true };
    const holder = $('v114-custom-subjects-holder'); if(!holder) return;
    holder.insertAdjacentHTML('beforeend', `<label class="flex items-start gap-2 p-3 rounded-lg border bg-emerald-50/60 dark:bg-emerald-950/20"><input type="checkbox" checked class="v102-school-subject mt-1" data-subject='${esc(JSON.stringify(subject))}'><span><span class="font-medium text-sm">${esc(name)}</span><span class="block text-xs text-muted-foreground">Custom • ${scope === 'class' ? 'Class only' : (selectedLevels.length ? 'Selected levels' : 'Whole school')}</span></span></label>`);
    $('v114-custom-subject-name').value = '';
    toast(`Added ${name}. Press Save Subjects to persist it.`, 'success');
  };
  const oldCustomRenderer = window.renderAdminCustomSubjects;
  window.renderAdminCustomSubjects = async function(){
    const [setupRes, classRes] = await Promise.all([
      (window.api?.admin?.getCurriculumSetup ? window.api.admin.getCurriculumSetup() : apiReq('/api/admin/curriculum/setup')).catch(()=>({data:{}})),
      (window.api?.admin?.getClasses ? window.api.admin.getClasses() : apiReq('/api/admin/classes')).catch(()=>({data:[]}))
    ]);
    const data = setupRes.data || {}; const cfg = data.config || {}; const levels = data.levels || []; const subjects = data.subjectBank || []; const classes = arr(classRes);
    const savedRows = Array.isArray(cfg.schoolSubjects) ? cfg.schoolSubjects : [];
    const saved = new Set(savedRows.filter(s=>s.isOffered!==false).map(s=>s.subjectId || s.id || s.name));
    const customSaved = savedRows.filter(s => s.isCustom || s.category === 'custom');
    const grouped = subjects.reduce((acc,s)=>{ const group = (s.levelLabels && s.levelLabels[0]) || (s.levelCodes && s.levelCodes[0]) || 'Subjects'; (acc[group] ||= []).push(s); return acc; }, {});
    return `<div class="space-y-6 animate-fade-in"><div class="flex justify-between items-center"><div><h2 class="text-2xl font-bold">Add Subjects</h2><p class="text-sm text-muted-foreground">Choose curriculum subjects and add custom subjects for the whole school or a specific class.</p></div><button onclick="v114SaveSchoolSubjectCheckboxes()" class="px-4 py-2 bg-primary text-primary-foreground rounded-lg">Save Subjects</button></div>
      <div class="rounded-xl border bg-card p-6 space-y-4"><h3 class="font-semibold">Add Custom Subject</h3><div class="grid gap-3 md:grid-cols-4"><input id="v114-custom-subject-name" class="rounded-lg border bg-background px-3 py-2" placeholder="e.g. Robotics, French, Swimming"><select id="v114-custom-subject-scope" class="rounded-lg border bg-background px-3 py-2" onchange="document.getElementById('v114-class-wrap').style.display=this.value==='class'?'block':'none';document.getElementById('v114-level-wrap').style.display=this.value==='school'?'block':'none';"><option value="school">Whole school / selected levels</option><option value="class">Specific class only</option></select><div id="v114-class-wrap" style="display:none"><select id="v114-custom-subject-class" class="w-full rounded-lg border bg-background px-3 py-2"><option value="">Choose class</option>${classes.map(c=>`<option value="${esc(c.id)}">${esc(c.name || c.grade || ('Class '+c.id))}</option>`).join('')}</select></div><button type="button" onclick="v114AddCustomSubjectToList()" class="rounded-lg bg-emerald-600 text-white px-4 py-2">Add Subject</button></div><div id="v114-level-wrap" class="grid gap-2 md:grid-cols-4 text-sm">${levels.map(l=>`<label class="flex items-center gap-2 rounded border p-2"><input type="checkbox" class="v114-custom-level" value="${esc(l.code)}">${esc(l.label || l.code)}</label>`).join('')}<p class="md:col-span-4 text-xs text-muted-foreground">Leave levels unchecked to make the custom subject available across the whole school.</p></div><div id="v114-custom-subjects-holder" class="grid gap-3 md:grid-cols-3">${customSaved.map(s=>`<label class="flex items-start gap-2 p-3 rounded-lg border bg-emerald-50/60 dark:bg-emerald-950/20"><input type="checkbox" checked class="v102-school-subject mt-1" data-subject='${esc(JSON.stringify(s))}'><span><span class="font-medium text-sm">${esc(s.name)}</span><span class="block text-xs text-muted-foreground">Custom • ${esc(s.scope || 'school')}</span></span></label>`).join('')}</div></div>
      <div class="rounded-xl border bg-card p-6"><h3 class="font-semibold mb-3">Curriculum Source</h3><div class="grid md:grid-cols-3 gap-3 text-sm"><div class="p-3 bg-muted/30 rounded-lg"><p class="text-muted-foreground">Curriculum</p><p class="font-bold">${esc(cfg.curriculum || 'cbc')}</p></div><div class="p-3 bg-muted/30 rounded-lg"><p class="text-muted-foreground">Structure</p><p class="font-bold">${esc(cfg.structureType || 'mixed')}</p></div><div class="p-3 bg-muted/30 rounded-lg"><p class="text-muted-foreground">Enabled Levels</p><p class="font-bold">${levels.length}</p></div></div></div>
      <div class="space-y-4">${Object.entries(grouped).map(([group,items])=>`<div class="rounded-xl border bg-card p-5"><div class="flex items-center justify-between mb-3"><h3 class="font-semibold">${esc(group)}</h3><button type="button" onclick="document.querySelectorAll('[data-v102-group=&quot;${esc(group)}&quot;] input').forEach(cb=>cb.checked=true)" class="text-xs px-2 py-1 rounded bg-primary/10 text-primary">Check all</button></div><div class="grid md:grid-cols-3 gap-3">${items.map(s=>`<label data-v102-group="${esc(group)}" class="flex items-start gap-2 p-3 rounded-lg border bg-muted/20"><input type="checkbox" class="v102-school-subject mt-1" data-subject='${esc(JSON.stringify(s))}' ${saved.has(s.id) || saved.has(s.name) ? 'checked' : ''}><span><span class="font-medium text-sm">${esc(s.name)}</span><span class="block text-xs text-muted-foreground">${esc(s.category || 'subject')}${s.pathway ? ` • ${esc(s.pathway)}` : ''}</span></span></label>`).join('')}</div></div>`).join('')}</div><div class="flex justify-end"><button onclick="v114SaveSchoolSubjectCheckboxes()" class="px-6 py-3 bg-primary text-primary-foreground rounded-lg">Save Subjects</button></div></div>`;
  };
  try { if (typeof renderAdminCustomSubjects !== 'undefined') renderAdminCustomSubjects = window.renderAdminCustomSubjects; window.v115RenderAdminCustomSubjects = window.renderAdminCustomSubjects; window.v114RenderAdminCustomSubjects = window.renderAdminCustomSubjects; } catch(_) {}

  // ---------------- Remove the old Parent Messages dashboard card from teacher dashboard only.
  function hideTeacherDashboardParentMessages(){
    const user = currentUser(); if(String(user.role || '').toLowerCase() !== 'teacher') return;
    document.querySelectorAll('#teacher-message-count-badge, #teacher-messages-list').forEach(el => {
      const card = el.closest('.rounded-xl.border.bg-card.p-6') || el.parentElement;
      if(card) { card.remove(); }
    });
    document.querySelectorAll('h3').forEach(h => {
      if (String(h.textContent || '').trim().toLowerCase() === 'parent messages') {
        const card = h.closest('.rounded-xl.border.bg-card.p-6') || h.closest('.rounded-xl');
        if (card && !card.closest('[data-role=admin]')) card.remove();
      }
    });
  }
  const oldTeacherDashboard = window.renderTeacherDashboard;
  if (typeof oldTeacherDashboard === 'function' && !oldTeacherDashboard.__v114NoParentCard) {
    const wrapped = async function(){ const html = await oldTeacherDashboard.apply(this, arguments); setTimeout(hideTeacherDashboardParentMessages, 80); return html; };
    wrapped.__v114NoParentCard = true; window.renderTeacherDashboard = wrapped;
  }
  const obs = new MutationObserver(hideTeacherDashboardParentMessages);
  document.addEventListener('DOMContentLoaded', () => { hideTeacherDashboardParentMessages(); try{ if(document.body) obs.observe(document.body,{childList:true,subtree:true}); }catch(_){} });
})();

/* ---- end merged from v115-isolation-subjects-payments-hotfix.js ---- */

/* ---- merged from v116-hard-isolation-manual-subscription-hotfix.js ---- */

// Shule AI v116 hard isolation + manual subscription + signature/runtime hotfix.
(function(){
  'use strict';
  const $ = (id) => document.getElementById(id);
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const arr = (v) => Array.isArray(v?.data) ? v.data : (Array.isArray(v) ? v : []);
  const toast = (m,t='info') => (typeof showToast === 'function' ? showToast(m,t) : console.log(`[${t}]`, m));
  const apiReq = (url, opts={}) => window.apiRequest ? window.apiRequest(url, opts) : fetch(url, opts).then(r=>r.json());
  function currentUser(){ try { const u = typeof getCurrentUser === 'function' ? getCurrentUser() : JSON.parse(localStorage.getItem('user') || '{}'); return u && typeof u === 'object' ? u : {}; } catch { return {}; } }
  function role(){ return String(currentUser().role || localStorage.getItem('role') || localStorage.getItem('userRole') || '').toLowerCase().replace('-', '_'); }
  function selectedChildId(){ return String(window.dashboardData?.selectedChildId || localStorage.getItem('shule_selected_child_id') || '').trim(); }
  function money(v){ return `KES ${Number(v || 0).toLocaleString()}`; }

  // Runtime-safe removal of old teacher dashboard Parent Messages card.
  window.v116HideTeacherDashboardParentMessages = function(){
    if (role() !== 'teacher') return;
    document.querySelectorAll('#teacher-message-count-badge, #teacher-messages-list').forEach(el => {
      const card = el.closest('.rounded-xl.border.bg-card.p-6') || el.closest('[class*="bg-card"]') || el.parentElement;
      if (card) { card.style.display = 'none'; card.setAttribute('data-v116-removed','teacher-dashboard-parent-messages-card'); }
    });
  };
  document.addEventListener('DOMContentLoaded', () => {
    try { window.v116HideTeacherDashboardParentMessages(); } catch(e) { console.warn('v116 parent-card hide skipped:', e.message); }
    try { new MutationObserver(() => { try { window.v116HideTeacherDashboardParentMessages(); } catch(_){} }).observe(document.body,{childList:true,subtree:true}); } catch(_) {}
  });

  // Parent subscription manual verification.
  window.v116SubmitParentSubscriptionManual = async function(planCode, amount){
    const studentId = selectedChildId();
    const phone = $('payment-phone')?.value?.trim() || currentUser().phone || currentUser().phoneNumber || '';
    const inputId = `sub-manual-code-${String(planCode).replace(/[^a-zA-Z0-9_-]/g,'_')}`;
    const mpesaCode = $(inputId)?.value?.trim()?.toUpperCase();
    if (!studentId) return toast('Select a child first', 'error');
    if (!mpesaCode) return toast('Enter the M-Pesa code/reference for this subscription plan', 'error');
    try {
      await (window.api?.payments?.parentSubscriptionManual ? window.api.payments.parentSubscriptionManual({ studentId:Number(studentId), planCode, plan:planCode, amount:Number(amount), phone, mpesaCode, billingCycle:'monthly' }) : apiReq('/api/payments/parent/subscription/manual', { method:'POST', body:JSON.stringify({ studentId:Number(studentId), planCode, amount:Number(amount), phone, mpesaCode, billingCycle:'monthly' }) }));
      toast('Subscription code submitted for Super Admin approval. It will activate after confirmation.', 'success');
      if ($(inputId)) $(inputId).value = '';
    } catch(e) { toast(e.message || 'Could not submit manual subscription code', 'error'); }
  };

  const previousStart = window.v114StartParentSubscription;
  window.v114StartParentSubscription = async function(planCode, amount){
    try {
      if (previousStart) return await previousStart(planCode, amount);
      const studentId = selectedChildId(); const phone = $('payment-phone')?.value?.trim() || currentUser().phone || currentUser().phoneNumber || '';
      await api.payments.parentSubscriptionSTK({ studentId:Number(studentId), planCode, amount:Number(amount), phone, billingCycle:'monthly' });
    } catch(e) {
      const msg = String(e.message || '');
      if (msg.toLowerCase().includes('manual verification')) {
        toast('Platform is in Manual Verification mode. Enter the M-Pesa code on the subscription card and submit it for approval.', 'info');
        document.querySelectorAll('[data-manual-subscription-box]').forEach(el => el.classList.remove('hidden'));
        return;
      }
      throw e;
    }
  };

  const oldParentPayments = window.renderParentPayments || window.v12RenderParentPayments || window.v114RenderParentPayments;
  async function getPlans(){
    const res = await (window.api?.parent?.getSubscriptionPlans ? window.api.parent.getSubscriptionPlans() : apiReq('/api/parent/plans')).catch(()=>({data:[]}));
    const plans = arr(res);
    return plans.length ? plans : [
      {code:'child_basic', name:'Basic', monthlyPriceKes:100, features:['Report cards','Attendance','Progress'], limits:{aiTutor:false, aiQuestionsPerDay:0, aiQuestionsPerMonth:0}},
      {code:'child_premium', name:'Premium', monthlyPriceKes:250, features:['Everything in Basic','AI Tutor: 6 messages/day','Child timetable if school has timetable'], limits:{aiTutor:true, aiQuestionsPerDay:6, aiQuestionsPerMonth:180}},
      {code:'child_ultimate', name:'Ultimate', monthlyPriceKes:500, features:['Everything in Premium','Extended AI Tutor','Live child analytics','Stronger alerts','Child recommendations'], limits:{aiTutor:true, aiQuestionsPerDay:50, aiQuestionsPerMonth:1500}}
    ];
  }
  window.v116RenderParentPayments = async function(){
    const base = oldParentPayments ? await oldParentPayments() : '<div id="parent-payments-root"></div>';
    const plans = await getPlans(); const studentId = selectedChildId();
    const cards = `<div class="rounded-xl border bg-card p-6" data-v116-subscription-cards="true"><div class="flex items-center justify-between gap-3 flex-wrap mb-4"><div><h3 class="font-semibold text-lg">Shule AI Platform Subscription</h3><p class="text-sm text-muted-foreground">Separate from school fees. Manual mode uses M-Pesa code approval by Super Admin.</p></div><span class="text-xs rounded-full px-3 py-1 bg-primary/10 text-primary">Selected child: ${esc(studentId || 'none')}</span></div><div class="grid gap-4 md:grid-cols-3">${plans.map(p=>{ const code=p.code||p.id||p.name; const safeCode=String(code).replace(/[^a-zA-Z0-9_-]/g,'_'); const amount=Number(p.monthlyPriceKes ?? p.price ?? p.amount ?? p.price_kes ?? 0); const features=Array.isArray(p.features)?p.features:[]; return `<div class="rounded-2xl border p-5 bg-gradient-to-br from-background to-muted/30 flex flex-col"><p class="text-xs uppercase tracking-wide text-muted-foreground">${esc(p.interval || 'monthly')}</p><h4 class="text-xl font-bold mt-1">${esc(p.displayName || p.name || code)}</h4><p class="text-2xl font-extrabold mt-2">${money(amount)}<span class="text-xs font-normal text-muted-foreground"> / month</span></p><ul class="text-sm text-muted-foreground mt-3 space-y-1 flex-1">${features.slice(0,5).map(f=>`<li>✓ ${esc(f)}</li>`).join('') || '<li>✓ Report cards</li><li>✓ Attendance and progress</li>'}</ul><button class="mt-4 w-full rounded-xl bg-primary text-primary-foreground py-2 font-semibold" onclick="v114StartParentSubscription('${esc(code)}', ${amount})">Try STK / Pay ${esc(p.displayName || p.name || code)}</button><div class="mt-3 rounded-xl border border-dashed p-3 space-y-2" data-manual-subscription-box><label class="text-xs font-medium">Manual M-Pesa code/reference</label><input id="sub-manual-code-${esc(safeCode)}" class="w-full rounded-lg border bg-background px-3 py-2 text-sm uppercase" placeholder="e.g. QEH123ABC"><button class="w-full rounded-lg border py-2 text-sm font-semibold" onclick="v116SubmitParentSubscriptionManual('${esc(code)}', ${amount})">Submit Code for Approval</button></div></div>`; }).join('')}</div></div>`;
    if (base.includes('data-v116-subscription-cards')) return base;
    if (base.includes('Shule AI Platform Subscription')) return base.replace(/<div class="rounded-xl border bg-card p-6"><div class="flex items-center justify-between gap-3 flex-wrap mb-4"><div><h3 class="font-semibold text-lg">Shule AI Platform Subscription[\s\S]*?<\/div><\/div><\/div>/, cards);
    if (base.includes('<div class="grid gap-4 lg:grid-cols-3">')) return base.replace('<div class="grid gap-4 lg:grid-cols-3">', `${cards}<div class="grid gap-4 lg:grid-cols-3">`);
    return `<div class="space-y-6">${cards}${base}</div>`;
  };
  window.renderParentPayments = window.v116RenderParentPayments;
  window.v12RenderParentPayments = window.v116RenderParentPayments;

  // Super Admin Platform Payments: include platform manual child subscription queue.
  const oldPlatformPayments = window.v12RenderPlatformPayments;
  window.v12RenderPlatformPayments = async function(){
    const html = oldPlatformPayments ? await oldPlatformPayments() : '<div class="space-y-6"><h2>Platform Payments</h2></div>';
    const queueRes = await (window.api?.payments?.getPlatformManualQueue ? window.api.payments.getPlatformManualQueue() : apiReq('/api/payments/superadmin/platform-manual-queue')).catch(()=>({data:[]}));
    const rows = arr(queueRes);
    const panel = `<div class="rounded-2xl border bg-card p-6" data-v116-platform-manual-queue="true"><div class="flex items-center justify-between gap-3 mb-4"><div><h3 class="font-semibold text-lg">Parent Platform Subscription Manual Codes</h3><p class="text-sm text-muted-foreground">Approve these to activate the selected child subscription. Reject if the code/amount is wrong.</p></div><span class="rounded-full border px-3 py-1 text-sm">${rows.length}</span></div>${rows.length ? `<div class="grid gap-3">${rows.map(r=>{ const student=r.Student||r.student||{}; const parent=r.Parent||r.parent||{}; return `<div class="rounded-xl border p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"><div><p class="font-semibold">${esc(student.User?.name || student.name || 'Student')} • ${esc(r.planName || r.planCode || r.plan || 'Plan')}</p><p class="text-xs text-muted-foreground">Parent: ${esc(parent.User?.name || parent.name || 'Parent')} • ${esc(r.reference || r.transactionId || '')}</p><p class="text-sm mt-1">${money(r.amount)} • ${esc(r.schoolCode || '')}</p></div><div class="flex gap-2"><button onclick="v116ReviewPlatformManualPayment('${esc(r.id)}','approve')" class="px-3 py-2 rounded-lg bg-green-600 text-white">Approve</button><button onclick="v116ReviewPlatformManualPayment('${esc(r.id)}','reject')" class="px-3 py-2 rounded-lg bg-red-600 text-white">Reject</button></div></div>`; }).join('')}</div>` : `<div class="text-center text-muted-foreground py-8">No pending parent platform subscription codes.</div>`}</div>`;
    if (html.includes('data-v116-platform-manual-queue')) return html;
    return `${html}${panel}`;
  };
  window.v116ReviewPlatformManualPayment = async function(id, action){
    await (window.api?.payments?.reviewPlatformManualPayment ? window.api.payments.reviewPlatformManualPayment(id, { action }) : apiReq(`/api/payments/superadmin/platform-manual-queue/${id}/review`, { method:'POST', body:JSON.stringify({ action }) }));
    toast(action === 'reject' ? 'Manual subscription rejected' : 'Manual subscription approved and activated', action === 'reject' ? 'info' : 'success');
    await window.showDashboardSection?.('platform-payments');
  };

  // Parent report card hard frontend lock: no classmates through stale UI buttons.
  function parentAllowedReportStudentId(studentId){
    if (role() !== 'parent') return true;
    const wanted = String(studentId || '').trim(); if (!wanted) return false;
    const ids = new Set([selectedChildId()].filter(Boolean));
    (Array.isArray(window.dashboardData?.children) ? window.dashboardData.children : []).forEach(c => {
      [c?.id,c?.studentId,c?.userId,c?.student?.id,c?.student?.studentId,c?.student?.userId,c?.User?.id].forEach(v => { if(v!==undefined && v!==null && String(v).trim()) ids.add(String(v)); });
    });
    return ids.has(wanted);
  }
  const oldOpen = window.openReportCard;
  if (typeof oldOpen === 'function') window.openReportCard = function(studentId){ if(!parentAllowedReportStudentId(studentId)) return toast('Blocked: parents can only view report cards for their linked children.', 'error'); return oldOpen.apply(this, arguments); };
  const oldDownload = window.downloadReportCard;
  if (typeof oldDownload === 'function') window.downloadReportCard = function(studentId){ if(!parentAllowedReportStudentId(studentId)) return toast('Blocked: parents can only download report cards for their linked children.', 'error'); return oldDownload.apply(this, arguments); };
})();

/* ---- end merged from v116-hard-isolation-manual-subscription-hotfix.js ---- */

/* ---- merged from v117-admin-billing-dedupe-hotfix.js ---- */
// Shule AI v117 admin billing de-duplication hotfix.
// Keeps admin billing tied to Super Admin configured school plans only; removes old legacy monthly/termly/yearly plan cards.
(function(){
  'use strict';
  const $ = (id) => document.getElementById(id);
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money = (v) => `KES ${Number(v || 0).toLocaleString()}`;
  const apiReq = (path, opts={}) => window.apiRequest ? window.apiRequest(path, opts) : Promise.reject(new Error('API helper not loaded'));
  const toast = (msg, type='success') => window.showToast ? window.showToast(msg, type) : alert(msg);
  const arr = (res) => Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);

  function badge(status){
    const value = String(status || 'pending').toLowerCase();
    const cls = value === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : value.includes('expired') ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300';
    return `<span class="px-2 py-1 rounded-full text-xs font-semibold ${cls}">${esc(value.replace(/_/g,' '))}</span>`;
  }

  function canonicalPlanCode(plan){
    return String(plan?.code || plan?.id || plan?.name || plan?.displayName || '').trim().toLowerCase().replace(/\s+/g, '_');
  }
  function cleanPlans(plans){
    const legacy = new Set(['monthly','termly','yearly','month','term','year','old_monthly','old_termly','old_yearly']);
    const seen = new Set();
    return (Array.isArray(plans) ? plans : [])
      .filter(p => p && typeof p === 'object')
      .filter(p => {
        const c = canonicalPlanCode(p);
        const n = String(p.displayName || p.name || '').trim().toLowerCase();
        // These are legacy billing-cycle cards, not real platform-defined school plans.
        if (legacy.has(c) || legacy.has(n)) return false;
        const key = c || n;
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return p.isActive !== false;
      });
  }

  async function getSchoolPlans(){
    // Admin-safe source. Backend v117 also makes this prefer Super Admin platform schoolPlans when saved.
    const res = await (window.api?.subscription?.getPlans ? window.api.subscription.getPlans('school') : apiReq('/api/subscriptions/plans?ownerType=school')).catch(() => ({ data: [] }));
    return cleanPlans(arr(res));
  }

  async function getStatus(){
    return (await (window.api?.subscription?.getSchoolStatus ? window.api.subscription.getSchoolStatus() : apiReq('/api/subscriptions/school/status')).catch(e => ({ data:{ status:'unavailable', error:e.message } }))).data || {};
  }

  async function getHistory(){
    return arr(await (window.api?.subscription?.getSchoolBillingHistory ? window.api.subscription.getSchoolBillingHistory() : apiReq('/api/subscriptions/school/billing-history')).catch(() => ({ data: [] })));
  }

  window.v117RenderAdminSubscriptionBilling = async function(){
    const [status, plans, history] = await Promise.all([getStatus(), getSchoolPlans(), getHistory()]);
    const activePlanCode = String(status.planCode || '').toLowerCase();
    const planCards = plans.length ? plans.map(plan => {
      const code = canonicalPlanCode(plan);
      const amount = Number(plan.monthlyPriceKes ?? plan.price_kes ?? plan.price ?? plan.amount ?? 0);
      const days = Number(plan.days ?? plan.limits?.days ?? 30) || 30;
      const features = Array.isArray(plan.features) ? plan.features : [];
      const isCurrent = activePlanCode && (activePlanCode === code || activePlanCode === String(plan.code || '').toLowerCase());
      return `<div class="rounded-2xl border bg-card p-5 flex flex-col ${isCurrent ? 'ring-2 ring-primary' : ''}" data-v117-live-school-plan="${esc(code)}">
        <div class="flex items-start justify-between gap-3">
          <div><p class="text-xs uppercase tracking-wide text-muted-foreground">Super Admin configured plan</p><h3 class="text-xl font-bold mt-1">${esc(plan.displayName || plan.name || plan.code || 'School Plan')}</h3></div>
          ${isCurrent ? '<span class="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">Current</span>' : ''}
        </div>
        <p class="text-3xl font-extrabold mt-4">${money(amount)}</p>
        <p class="text-xs text-muted-foreground mt-1">Activates/renews for ${days} days after Super Admin confirmation unless Daraja auto-confirms.</p>
        <ul class="mt-4 text-sm text-muted-foreground space-y-1 flex-1">${features.slice(0,8).map(f => `<li>✓ ${esc(f)}</li>`).join('') || '<li>✓ School operating system access</li><li>✓ Admin, teacher, parent and student dashboards</li>'}</ul>
        <button onclick="v117OpenSchoolBillingModal('${esc(plan.code || code)}')" class="mt-5 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold">Choose / Renew</button>
      </div>`;
    }).join('') : `<div class="rounded-xl border bg-card p-8 text-center text-muted-foreground lg:col-span-3">No live school plans found. Open Super Admin → Platform Payments, edit School subscription plans JSON, then press Save Platform Payment Settings.</div>`;

    return `<div class="space-y-6 animate-fade-in shule-billing-page" data-v117-admin-billing="true">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div><h2 class="text-2xl font-bold">Subscription & Billing</h2><p class="text-sm text-muted-foreground">Only the live school plans configured by Super Admin are shown here. Legacy Monthly / Termly / Yearly cards are removed.</p></div>
        <button onclick="v117OpenSchoolBillingModal('${esc(status.planCode || plans[0]?.code || '')}')" class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">Renew / Upgrade</button>
      </div>
      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div class="rounded-xl border bg-card p-5"><p class="text-sm text-muted-foreground">Current Plan</p><h3 class="text-2xl font-bold mt-1">${esc(status.currentPlan || status.planName || 'Not active')}</h3><div class="mt-2">${badge(status.status)}</div></div>
        <div class="rounded-xl border bg-card p-5"><p class="text-sm text-muted-foreground">Access Mode</p><h3 class="text-xl font-bold mt-1">${esc(status.gracefulMode ? 'Limited / Grace' : 'Full Access')}</h3><p class="text-xs text-muted-foreground mt-2">Locks after expiry unless renewed.</p></div>
        <div class="rounded-xl border bg-card p-5"><p class="text-sm text-muted-foreground">Expires</p><h3 class="text-xl font-bold mt-1">${status.expiresAt ? new Date(status.expiresAt).toLocaleDateString() : 'Not active'}</h3><p class="text-xs text-muted-foreground mt-2">${Number(status.daysRemaining || 0)} days remaining</p></div>
        <div class="rounded-xl border bg-card p-5"><p class="text-sm text-muted-foreground">Students</p><h3 class="text-2xl font-bold mt-1">${Number(status.studentCount || 0).toLocaleString()}</h3><p class="text-xs text-muted-foreground mt-2">School code: ${esc(status.schoolCode || '')}</p></div>
      </div>
      ${status.gracefulMode ? `<div class="rounded-xl border border-yellow-300 bg-yellow-50 text-yellow-900 dark:bg-yellow-900/20 dark:text-yellow-200 dark:border-yellow-700 p-4"><h3 class="font-semibold">⚠ School subscription inactive or expired</h3><p class="text-sm mt-1">Premium features remain locked until renewal is approved.</p></div>` : ''}
      <div class="grid gap-4 lg:grid-cols-3" data-v117-live-school-plan-grid="true">${planCards}</div>
      <div class="rounded-xl border bg-card p-5" id="payment-confirmation-card"><div class="flex flex-col md:flex-row md:items-start md:justify-between gap-4"><div><h3 class="font-semibold text-lg">Submit Manual Payment Confirmation</h3><p class="text-sm text-muted-foreground mt-1">Use this when the school paid by M-Pesa reference, bank, or cash. Super Admin approval starts/renews access for the configured plan duration.</p></div><span class="text-xs rounded-full border px-3 py-1">Goes to Super Admin</span></div><div class="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3"><label class="block"><span class="text-sm font-medium">Amount Paid</span><input id="pay-amount" type="number" min="0" class="mt-1 w-full rounded-lg border bg-background px-3 py-2" placeholder="100000"></label><label class="block"><span class="text-sm font-medium">Method</span><select id="pay-method" class="mt-1 w-full rounded-lg border bg-background px-3 py-2"><option value="mpesa">M-Pesa</option><option value="bank">Bank Transfer</option><option value="cash">Cash</option><option value="other">Other</option></select></label><label class="block"><span class="text-sm font-medium">Reference / Receipt</span><input id="pay-reference" class="mt-1 w-full rounded-lg border bg-background px-3 py-2" placeholder="M-Pesa code / bank ref"></label><label class="block"><span class="text-sm font-medium">Paid Date</span><input id="pay-date" type="date" value="${new Date().toISOString().slice(0,10)}" class="mt-1 w-full rounded-lg border bg-background px-3 py-2"></label><label class="block"><span class="text-sm font-medium">Requested Plan</span><select id="pay-plan" class="mt-1 w-full rounded-lg border bg-background px-3 py-2">${plans.map(p=>`<option value="${esc(p.code || canonicalPlanCode(p))}">${esc(p.displayName || p.name || p.code)}</option>`).join('')}</select></label><label class="block"><span class="text-sm font-medium">Proof URL / Note</span><input id="pay-proof" class="mt-1 w-full rounded-lg border bg-background px-3 py-2" placeholder="Optional screenshot URL"></label></div><label class="block mt-4"><span class="text-sm font-medium">Notes</span><textarea id="pay-notes" rows="3" class="mt-1 w-full rounded-lg border bg-background px-3 py-2" placeholder="Example: Paid from school Paybill at 10:32 AM but status did not update."></textarea></label><div class="mt-4 flex justify-end"><button onclick="submitPaymentConfirmation()" class="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">Submit for Confirmation</button></div></div>
      <div class="rounded-xl border bg-card overflow-hidden"><div class="p-4 border-b"><h3 class="font-semibold">Billing History</h3><p class="text-sm text-muted-foreground">Recent school subscription payment attempts and renewals.</p></div><div class="overflow-x-auto"><table class="w-full text-sm"><thead class="bg-muted/50"><tr><th class="text-left px-4 py-3">Date</th><th class="text-left px-4 py-3">Plan</th><th class="text-left px-4 py-3">Amount</th><th class="text-left px-4 py-3">Status</th><th class="text-left px-4 py-3">Receipt</th></tr></thead><tbody class="divide-y">${history.length ? history.map(row => `<tr><td class="px-4 py-3">${new Date(row.createdAt).toLocaleString()}</td><td class="px-4 py-3">${esc(row.planName || row.planCode)}</td><td class="px-4 py-3">${money(row.amount)}</td><td class="px-4 py-3">${badge(row.status === 'success' ? 'active' : row.status)}</td><td class="px-4 py-3">${esc(row.mpesaReceiptNumber || row.reference || '-')}</td></tr>`).join('') : `<tr><td colspan="5" class="px-4 py-8 text-center text-muted-foreground">No billing history yet.</td></tr>`}</tbody></table></div></div>
    </div>`;
  };

  window.v117OpenSchoolBillingModal = async function(defaultPlanCode=''){
    const plans = await getSchoolPlans();
    const defaultCode = String(defaultPlanCode || plans[0]?.code || canonicalPlanCode(plans[0] || '')).toLowerCase();
    const options = plans.map(plan => { const c = String(plan.code || canonicalPlanCode(plan)); return `<option value="${esc(c)}" ${c.toLowerCase() === defaultCode ? 'selected' : ''}>${esc(plan.displayName || plan.name || c)} — ${money(plan.monthlyPriceKes ?? plan.price ?? plan.amount ?? 0)}</option>`; }).join('');
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4';
    modal.id = 'school-billing-modal';
    modal.innerHTML = `<div class="w-full max-w-lg rounded-2xl border bg-card text-card-foreground shadow-xl"><div class="p-5 border-b flex items-center justify-between"><h3 class="text-lg font-bold">Renew / Upgrade School Subscription</h3><button onclick="document.getElementById('school-billing-modal')?.remove()" class="text-muted-foreground hover:text-foreground">×</button></div><div class="p-5 space-y-4"><div><label class="text-sm font-medium">Select Super Admin Plan</label><select id="school-sub-plan" class="mt-1 w-full rounded-lg border bg-background px-3 py-2">${options}</select></div><div><label class="text-sm font-medium">M-PESA Phone Number</label><input id="school-sub-phone" placeholder="2547XXXXXXXX" class="mt-1 w-full rounded-lg border bg-background px-3 py-2"></div><div class="rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground">If the platform is in Manual mode, submit the code using the manual confirmation form below. This STK button is for Daraja/Both mode.</div></div><div class="p-5 border-t flex justify-end gap-3"><button onclick="document.getElementById('school-billing-modal')?.remove()" class="px-4 py-2 rounded-lg border">Cancel</button><button onclick="submitSchoolSubscriptionSTK()" class="px-4 py-2 rounded-lg bg-primary text-primary-foreground">Pay via M-PESA STK</button></div></div>`;
    document.body.appendChild(modal);
  };
  window.openSchoolBillingModal = window.v117OpenSchoolBillingModal;

  const oldAdmin = window.renderAdminSection;
  window.renderAdminSection = async function(section){
    if (section === 'subscription-billing') return await window.v117RenderAdminSubscriptionBilling();
    return oldAdmin ? oldAdmin.apply(this, arguments) : '';
  };

  function removeLegacyCards(){
    const root = document.getElementById('dashboard-content');
    if (!root) return;
    const title = root.querySelector('h2');
    if (!title || !/Subscription\s*&\s*Billing/i.test(title.textContent || '')) return;
    // Extra guard for cached old DOM: remove old cycle-only cards if any survived.
    root.querySelectorAll('.rounded-xl,.rounded-2xl').forEach(card => {
      if (card.closest('[data-v117-admin-billing]')) return;
      const txt = (card.textContent || '').trim().toLowerCase().replace(/\s+/g,' ');
      if (/^(monthly|termly|yearly)( kes|\s)/.test(txt) || /billing cycle.*monthly.*termly.*yearly/.test(txt)) card.remove();
    });
  }
  document.addEventListener('DOMContentLoaded', removeLegacyCards);
  window.addEventListener('load', removeLegacyCards);
  new MutationObserver(removeLegacyCards).observe(document.documentElement, { childList:true, subtree:true });
})();

/* ---- end merged from v117-admin-billing-dedupe-hotfix.js ---- */

/* ---- merged from v124-stable-final-consolidation.js ---- */
// Shule AI v124 stable consolidation built from v117 safe base.
// Purpose: one controlled final layer for plan visibility, pilot override, parent-child isolation, stable logo, parent tiers and final report cards.
(function(){
  'use strict';
  if (window.__v124StableFinalLoaded) return;
  window.__v124StableFinalLoaded = true;

  const DEFAULT_LOGO = 'assets/logo.png';
  const SCHOOL_FEATURES = {
    starter:['dashboard','teachers','teacher_approvals','students','analytics','alerts','finance_fees','parent_messages','school_settings','billing','classes','report_cards'],
    growth:['dashboard','teachers','teacher_approvals','students','analytics','alerts','finance_fees','parent_messages','school_settings','billing','classes','report_cards','calendar','school_branding','timetable','homework'],
    enterprise:['dashboard','teachers','teacher_approvals','students','analytics','alerts','finance_fees','parent_messages','school_settings','billing','classes','report_cards','calendar','school_branding','timetable','homework','duty','fairness_report','departments','bulk_sms','senior_subject_choice']
  };
  const SECTION_FEATURE = {
    dashboard:'dashboard', teachers:'teachers', 'teacher-approvals':'teacher_approvals', students:'students', analytics:'analytics', alerts:'alerts', 'alerts-center':'alerts', finances:'finance_fees', fees:'finance_fees', 'finance-fees':'finance_fees', 'parent-messages':'parent_messages', settings:'school_settings', 'school-settings':'school_settings', billing:'billing', subscription:'billing', 'subscription-billing':'billing', classes:'classes', reports:'report_cards', 'report-cards':'report_cards', calendar:'calendar', 'school-branding':'school_branding', branding:'school_branding', timetable:'timetable', homework:'homework', 'my-homework':'homework', duty:'duty', 'fairness-report':'fairness_report', departments:'departments', sms:'bulk_sms', 'bulk-sms':'bulk_sms', 'subject-choice':'senior_subject_choice', 'subject-selection':'senior_subject_choice', 'student-subject-selection':'senior_subject_choice', pathway:'senior_subject_choice'
  };
  const PARENT_TIERS = [
    { code:'child_basic', name:'Basic', displayName:'Basic', monthlyPriceKes:100, features:['Report cards','Attendance','Progress'], limits:{aiTutor:false, aiQuestionsPerDay:0, aiQuestionsPerMonth:0, days:30} },
    { code:'child_premium', name:'Premium', displayName:'Premium', monthlyPriceKes:250, features:['Everything in Basic','AI Tutor: 6 messages/day','Child timetable if school has timetable'], limits:{aiTutor:true, aiQuestionsPerDay:6, aiQuestionsPerMonth:180, days:30} },
    { code:'child_ultimate', name:'Ultimate', displayName:'Ultimate', monthlyPriceKes:500, features:['Everything in Premium','Extended AI Tutor','Live child analytics','Stronger child alerts','Child recommendations'], limits:{aiTutor:true, aiQuestionsPerDay:50, aiQuestionsPerMonth:1500, days:30} }
  ];

  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const apiReq = (url, opts) => window.apiRequest ? window.apiRequest(url, opts) : fetch(url, opts).then(async r => { const j = await r.json().catch(()=>({})); if(!r.ok) throw new Error(j.message || r.statusText); return j; });
  const toast = (m,t='info') => typeof showToast === 'function' ? showToast(m,t) : console.log(`[${t}] ${m}`);
  function currentUser(){ try { const u = typeof getCurrentUser === 'function' ? getCurrentUser() : JSON.parse(localStorage.getItem('user') || '{}'); return u && typeof u === 'object' ? u : {}; } catch { return {}; } }
  function role(){ return String(currentUser().role || localStorage.getItem('userRole') || localStorage.getItem('role') || '').toLowerCase().replace('-', '_'); }
  function normalizePlan(raw){ raw=String(raw||'starter').toLowerCase(); if(raw.includes('enterprise')) return 'enterprise'; if(raw.includes('growth')) return 'growth'; return 'starter'; }
  function selectedChildId(){ return String(window.dashboardData?.selectedChildId || localStorage.getItem('shule_selected_child_id') || '').trim(); }
  function children(){ return Array.isArray(window.dashboardData?.children) ? window.dashboardData.children : []; }
  function selectedChild(){ const id=selectedChildId(); return window.dashboardData?.selectedChild || children().find(c => String(c.id || c.studentId) === id) || null; }
  function curriculumOf(child=selectedChild()){ return String(child?.curriculum || child?.school?.system || window.dashboardData?.selectedChild?.curriculum || 'cbc').toLowerCase().replace(/[^a-z0-9_-]/g,''); }
  function childClassText(child=selectedChild()){ return [child?.grade, child?.className, child?.Class?.name, child?.level, child?.student?.grade].filter(Boolean).join(' '); }
  function isSeniorGrade(text){ return /(^|\D)(grade\s*)?(10|11|12)(\D|$)|\bg10\b|\bg11\b|\bg12\b|senior/i.test(String(text||'')); }
  function isFullAccessLocal(){
    const u=currentUser(); let school={}; try{ school=JSON.parse(localStorage.getItem('school')||'{}')||{}; }catch{}
    const all=[u, u.school, school, school.settings, school.settings?.billing, school.settings?.access].filter(Boolean);
    return all.some(o => ['pilotFullAccessEnabled','demoMode','freeFullAccess','fullAccess','manualFullAccess'].some(k => o && (o[k]===true || String(o[k]||'').toLowerCase()==='true')));
  }
  function setPlanState(data){
    const d=data || {}; const planCode=normalizePlan(d.planCode || d.currentPlan || d.schoolTier || d.plan || localStorage.getItem('schoolPlan'));
    const fullAccess=!!(d.fullAccess || d.override || d.accessMode==='pilot_full_access' || isFullAccessLocal());
    const features=fullAccess ? ['*',...SCHOOL_FEATURES.enterprise,'ai_tutor','ai_tutor_limited','ai_tutor_extended','live_child_analytics','advanced_alerts','child_recommendations','advanced_report_cards'] : (Array.isArray(d.features)&&d.features.length ? d.features : SCHOOL_FEATURES[planCode]);
    window.ShulePlanState={...(window.ShulePlanState||{}),...d,planCode,features,fullAccess,override:fullAccess};
    localStorage.setItem('shule_plan_state', JSON.stringify(window.ShulePlanState));
  }
  function loadCachedPlan(){ try{ const st=JSON.parse(localStorage.getItem('shule_plan_state')||'{}'); if(st && typeof st==='object') setPlanState(st); }catch{} if(!window.ShulePlanState) setPlanState({}); }
  async function refreshPlanState(){ try{ const r=role(); if(!r || r==='super_admin'||r==='superadmin') { setPlanState({fullAccess:true,override:true,planCode:'enterprise'}); return window.ShulePlanState; } const res=await apiReq('/api/subscriptions/my-status'); setPlanState(res?.data || {}); }catch(e){ loadCachedPlan(); } return window.ShulePlanState; }
  function hasFeature(feature){ if(!feature) return true; const r=role(); if(r==='super_admin'||r==='superadmin') return true; const st=window.ShulePlanState || {}; if(st.fullAccess || st.override || (Array.isArray(st.features)&&st.features.includes('*'))) return true; const f=String(feature); return new Set(Array.isArray(st.features)?st.features:SCHOOL_FEATURES[normalizePlan(st.planCode)]).has(f); }
  window.v124HasFeature = hasFeature; window.v118HasFeature = hasFeature;

  function sectionFeature(section){ const key=String(section||'').toLowerCase().replace(/_/g,'-'); return SECTION_FEATURE[key] || SECTION_FEATURE[key.replace(/\s+/g,'-')] || null; }
  function sectionAllowed(section){ const f=sectionFeature(section); if(!hasFeature(f)) return false; if(f==='senior_subject_choice'){ const cur=curriculumOf(); return ['cbc','cbe'].includes(cur) && isSeniorGrade(childClassText()); } return true; }
  function applyVisibility(root=document){
    const st=window.ShulePlanState||{}; const full=!!st.fullAccess;
    root.querySelectorAll?.('[data-v124-hidden="true"]').forEach(el=>{ if(full || sectionAllowed(el.dataset.v124Section||'')){ el.style.display=el.dataset.v124Display||''; el.removeAttribute('data-v124-hidden'); }});
    root.querySelectorAll?.('[data-section], [onclick*="showDashboardSection"]').forEach(el=>{
      const section = el.getAttribute('data-section') || ((el.getAttribute('onclick')||'').match(/showDashboardSection\(['"]([^'"]+)/)||[])[1];
      if(!section) return;
      if(sectionAllowed(section)) { if(el.getAttribute('data-v124-hidden')==='true'){ el.style.display=el.dataset.v124Display||''; el.removeAttribute('data-v124-hidden'); } return; }
      if(!el.dataset.v124Display) el.dataset.v124Display = el.style.display || '';
      el.dataset.v124Hidden='true'; el.dataset.v124Section=section; el.style.display='none';
    });
    stabilizeLogo();
  }

  function stableLogoUrl(raw){ const v=String(raw||'').trim(); if(!v || v==='undefined'||v==='null'||/\/undefined($|\?)/.test(v)||/\/null($|\?)/.test(v)) return DEFAULT_LOGO; if(/^data:image\//i.test(v)||/^blob:/i.test(v)||/^https?:\/\//i.test(v)) return v; if(/^[A-Za-z0-9+/=]{80,}$/.test(v)) return `data:image/png;base64,${v}`; return v; }
  function stabilizeLogo(){
    const allow=hasFeature('school_branding'); let branding={}; try{ branding=window.BrandingManager?.getStoredBranding ? window.BrandingManager.getStoredBranding() : JSON.parse(localStorage.getItem('schoolBranding')||'{}'); }catch{}
    const name=allow ? (branding.schoolName||branding.displayName||branding.name||'Shule AI') : 'Shule AI'; const logo=allow ? stableLogoUrl(branding.logoDataUrl||branding.logoUrl||branding.logo||DEFAULT_LOGO) : DEFAULT_LOGO;
    document.querySelectorAll('#sidebar-school-name,.school-name,.school-name-display,[data-school-name]').forEach(el=>{ if(el.textContent!==name) el.textContent=name; el.title=name; });
    document.querySelectorAll('img.sidebar-logo,img.school-logo,img[data-school-logo],[data-school-logo] img,.brand-logo img').forEach(img=>{ const src=String(img.getAttribute('src')||''); if(!src||src==='undefined'||/\/undefined($|\?)/.test(src)||(!allow && src!==logo)) img.src=logo; img.onerror=()=>{ if(img.src!==DEFAULT_LOGO) img.src=DEFAULT_LOGO; }; img.style.opacity='1'; img.style.visibility='visible'; });
  }

  function alertSource(a){ return a?.sourceLabel||a?.data?.sourceLabel||a?.sourceType||a?.type||'System'; }
  function alertTarget(a){ return a?.targetLabel||a?.data?.targetLabel||a?.studentName||a?.data?.studentName||selectedChild()?.name||'Selected child'; }
  window.loadParentAlerts = async function(){
    const container=document.getElementById('parent-alerts-container'); if(!container) return;
    const studentId=selectedChildId(); container.innerHTML='<div class="text-center text-muted-foreground py-4">Loading selected child alerts...</div>';
    try{ const res=await apiReq('/api/alerts'+(studentId?`?studentId=${encodeURIComponent(studentId)}&limit=80`:'?limit=80')); const alerts=Array.isArray(res?.data)?res.data:[]; const data=alerts.filter(a=>{const sid=String(a.studentId||a.data?.studentId||a.data?.student_id||''); return !sid || !studentId || sid===studentId;});
      container.innerHTML = data.length ? data.slice(0,12).map(a=>`<div class="p-3 border rounded-lg ${!a.isRead?'bg-primary/5':''}"><div class="flex items-start justify-between gap-2"><div><p class="font-medium text-sm">${esc(a.title||'Alert')}</p><p class="text-xs text-muted-foreground">${esc(a.message||'')}</p></div><span class="text-[10px] rounded-full bg-primary/10 text-primary px-2 py-0.5 whitespace-nowrap">From: ${esc(alertSource(a))}</span></div><div class="flex flex-wrap gap-1 mt-2"><span class="text-[10px] rounded-full bg-muted px-2 py-0.5">For: ${esc(alertTarget(a))}</span><span class="text-[10px] text-muted-foreground">${typeof timeAgo==='function'?timeAgo(a.createdAt):new Date(a.createdAt||Date.now()).toLocaleString()}</span></div></div>`).join('') : '<div class="text-center text-muted-foreground py-4">No alerts for the selected child yet.</div>';
    } catch(e){ container.innerHTML=`<div class="text-red-500">Failed to load selected child alerts: ${esc(e.message||'Unknown error')}</div>`; }
  };

  async function getParentPlans(){ try{ const res=await apiReq('/api/subscriptions/plans?ownerType=child'); const arr=Array.isArray(res?.data)?res.data:[]; if(arr.length) return arr.map(p=>{ const raw=String(p.code||p.name||'').toLowerCase(); const tier=raw.includes('ultimate')||raw.includes('genius')?PARENT_TIERS[2]:raw.includes('premium')||raw.includes('smart')?PARENT_TIERS[1]:PARENT_TIERS[0]; return {...tier,...p,code:tier.code,name:tier.name,displayName:tier.name,features:Array.isArray(p.features)&&p.features.length?p.features:tier.features,monthlyPriceKes:Number(p.monthlyPriceKes??p.price??p.amount??tier.monthlyPriceKes)}; }); }catch{} return PARENT_TIERS; }
  const oldParentPayments = window.renderParentPayments || window.v12RenderParentPayments || window.v116RenderParentPayments;
  window.v124RenderParentPayments = async function(){ const base = oldParentPayments ? await oldParentPayments().catch(()=>'<div class="space-y-6"></div>') : '<div class="space-y-6"></div>'; const plans=await getParentPlans(); const studentId=selectedChildId(); const child=selectedChild(); const cardHtml=`<div class="rounded-xl border bg-card p-6" data-v124-parent-subscription-cards="true"><div class="flex items-center justify-between gap-3 flex-wrap mb-4"><div><h3 class="font-semibold text-lg">Shule AI Child Subscription</h3><p class="text-sm text-muted-foreground">Per-child subscription. Switching children changes access, limits, alerts and recommendations.</p></div><span class="text-xs rounded-full px-3 py-1 bg-primary/10 text-primary">Selected child: ${esc(child?.name||child?.User?.name||studentId||'none')}</span></div><div class="grid gap-4 md:grid-cols-3">${plans.map(p=>{ const amount=Number(p.monthlyPriceKes??p.amount??p.price??0); const safe=String(p.code).replace(/[^a-zA-Z0-9_-]/g,'_'); return `<div class="rounded-2xl border p-5 bg-gradient-to-br from-background to-muted/30 flex flex-col"><h4 class="text-xl font-bold">${esc(p.displayName||p.name)}</h4><p class="text-2xl font-extrabold mt-2">KES ${amount.toLocaleString()}<span class="text-xs font-normal text-muted-foreground"> / month</span></p><ul class="text-sm text-muted-foreground mt-3 space-y-1 flex-1">${(p.features||[]).map(f=>`<li>✓ ${esc(f)}</li>`).join('')}</ul><button class="mt-4 w-full rounded-xl bg-primary text-primary-foreground py-2 font-semibold" onclick="v114StartParentSubscription('${esc(p.code)}', ${amount})">Pay ${esc(p.displayName||p.name)}</button><div class="mt-3 rounded-xl border border-dashed p-3 space-y-2"><label class="text-xs font-medium">Manual M-Pesa code/reference</label><input id="sub-manual-code-${esc(safe)}" class="w-full rounded-lg border bg-background px-3 py-2 text-sm uppercase" placeholder="e.g. QEH123ABC"><button class="w-full rounded-lg border py-2 text-sm font-semibold" onclick="v116SubmitParentSubscriptionManual('${esc(p.code)}', ${amount})">Submit Code for Approval</button></div></div>`;}).join('')}</div></div>`; const cleaned=String(base).replace(/<div[^>]*data-v11[46][^>]*subscription-cards[^>]*>[\s\S]*?<\/div>\s*<\/div>/i,''); return `<div class="space-y-6">${cardHtml}${cleaned}</div>`; };
  window.renderParentPayments=window.v124RenderParentPayments; window.v12RenderParentPayments=window.v124RenderParentPayments;

  function childContextHtml(){ const child=selectedChild(); if(!child) return ''; const cur=curriculumOf(child); const cls=childClassText(child); let title='Learning Context', body='This parent dashboard is filtered by the selected child, class, school and curriculum.'; if(['cbc','cbe'].includes(cur)){ if(isSeniorGrade(cls)){ title='CBC/CBE Senior School'; body='Career pathway, track and subject-choice support are shown only for Grade 10–12 senior-enabled schools.'; } else if(/grade\s*9|\bg9\b/i.test(cls)){ title='CBC/CBE Junior School'; body='Career guidance can be shown where enabled; final subject choice stays hidden until Grade 10–12.'; } else body='Primary/junior view: report cards, attendance, progress and allowed school-plan features only.'; } else if(/844|8-4-4/.test(cur)){ title='8-4-4 Curriculum'; body='Shows Standard/Form academic progress, reports, attendance and positions where enabled. CBC pathways are hidden.'; } else if(/british/.test(cur)){ title='British Curriculum'; body='Shows year/stage progress and electives only where enabled by the school.'; } else if(/american/.test(cur)){ title='American Curriculum'; body='Shows grade/course progress and high-school course choices only where enabled.'; } return `<div class="rounded-xl border bg-card p-4 mb-4" data-v124-child-context="true"><p class="text-xs uppercase tracking-wide text-muted-foreground">Selected child context</p><h3 class="font-semibold">${esc(title)} • ${esc(child.name||child.User?.name||'Child')}</h3><p class="text-sm text-muted-foreground">${esc(body)}</p></div>`; }
  function injectChildContext(){ if(role()!=='parent') return; const c=document.getElementById('dashboard-content'); if(!c) return; c.querySelectorAll('[data-v124-child-context]').forEach(x=>x.remove()); const target=c.firstElementChild||c; target.insertAdjacentHTML('afterbegin', childContextHtml()); }

  const oldSelectChild=window.selectChild;
  window.selectChild=async function(childId){ document.querySelectorAll('#parent-alerts-container,#parent-chat-messages,#parent-payment-history,#parent-subscription-cards,[data-v124-child-context]').forEach(el=>{el.innerHTML='<div class="text-center text-muted-foreground py-4">Switching child...</div>';}); localStorage.setItem('shule_selected_child_id', childId); if(window.dashboardData){ window.dashboardData.selectedChildId=childId; window.dashboardData.selectedChild=children().find(c=>String(c.id||c.studentId)===String(childId))||null; } window.dispatchEvent(new CustomEvent('shule:child-switched',{detail:{studentId:childId,child:selectedChild()}})); const out=oldSelectChild?await oldSelectChild.apply(this,arguments):null; setTimeout(()=>{window.loadParentAlerts?.(); injectChildContext(); applyVisibility(document);},80); return out; };
  const oldShow=window.showDashboardSection;
  window.showDashboardSection=async function(section){ if(section && !sectionAllowed(section)) return oldShow?oldShow.call(this,'dashboard'):null; const out=oldShow?await oldShow.apply(this,arguments):null; setTimeout(()=>{applyVisibility(document); injectChildContext(); if(role()==='parent') window.loadParentAlerts?.();},80); return out; };

  // Final one-page report card renderer: logo, child photo, watermark, admin-selected tests, signatures, no parent/guardian signature.
  const mediaUrl=(value)=>{ const raw=String(value||'').trim(); if(!raw||raw==='undefined'||raw==='null'||raw==='/undefined'||raw==='/null') return ''; if(/^(data:|blob:|https?:\/\/)/i.test(raw)) return raw; if(raw.startsWith('/uploads/')){ const base=String(window.API_BASE_URL||window.API_URL||'').replace(/\/$/,''); return base?`${base}${raw}`:raw; } if(raw.startsWith('uploads/')){ const base=String(window.API_BASE_URL||window.API_URL||'').replace(/\/$/,''); return base?`${base}/${raw}`:`/${raw}`; } try{return new URL(raw.replace(/^\/+/,''), window.location.href).href;}catch{return raw;} };
  const initials=(name)=> typeof getInitials==='function'?getInitials(name):String(name||'S').split(/\s+/).map(x=>x[0]).join('').slice(0,2).toUpperCase();
  function reportBrand(school){ let stored={}; try{ stored=window.BrandingManager?.getStoredBranding?window.BrandingManager.getStoredBranding():JSON.parse(localStorage.getItem('schoolBranding')||'{}'); }catch{} const allow=hasFeature('school_branding'); const raw=allow?{...(school?.branding||{}),...stored}:{schoolName:'Shule AI',logo:DEFAULT_LOGO,primaryColor:'#083A85',accentColor:'#11B5B1'}; return {schoolName:raw.schoolName||raw.name||school?.schoolName||school?.name||'Shule AI',logo:raw.logoDataUrl||raw.logoUrl||raw.logo||school?.logo||DEFAULT_LOGO,primaryColor:raw.primaryColor||'#083A85',accentColor:raw.accentColor||'#11B5B1',reportFooter:raw.reportFooter||school?.reportFooter||'Generated by Shule AI.'}; }
  function labels(subjects){ const m=new Map(); (subjects||[]).forEach(s=>(s.components||[]).forEach(c=>{ const label=c.label||c.assessmentName||c.assessment||c.type; if(label&&!m.has(String(label).toLowerCase())) m.set(String(label).toLowerCase(),{label,order:Number(c.displayOrder||99)}); })); return [...m.values()].sort((a,b)=>a.order-b.order).map(x=>x.label).slice(0,6); }
  function scoreFor(s,l){ const row=(s.components||[]).find(c=>String(c.label||c.assessmentName||c.assessment||c.type).toLowerCase()===String(l).toLowerCase()); return row && row.score!==undefined && row.score!==null && row.score!=='' ? String(Number(row.score)) : '-'; }
  function sig(label,value){ const src=mediaUrl(value); return src?`<div class="sig-slot"><div class="sig-box"><img class="sig-img" src="${esc(src)}" alt="${esc(label)} signature" onerror="this.style.display='none';this.parentElement.classList.add('sig-missing')"></div><div class="sig-label">${esc(label)}</div></div>`:`<div class="sig-slot"><div class="sig-line"></div><div class="sig-label">${esc(label)}</div></div>`; }
  window.buildReportCardHTML = async function(studentId){ if(!studentId) studentId=window.dashboardData?.student?.id||selectedChildId()||localStorage.getItem('shule_selected_child_id'); if(!studentId) throw new Error('Student ID not available'); const res=await (typeof window.v113LoadReportCardDetails==='function'?window.v113LoadReportCardDetails(studentId):apiReq(`/api/parent/child/${studentId}/report-card-details`)); if(!res?.success) throw new Error(res?.message||'Failed to load report card data'); const data=res.data||{}, student=data.student||{}, user=data.user||{}, school=data.school||{}, academic=data.academicSummary||{}, attendance=data.attendanceSummary||{}; const subjects=Array.isArray(academic.subjects)?academic.subjects:[]; const labs=labels(subjects); const br=reportBrand(school), primary=br.primaryColor, accent=br.accentColor, logo=mediaUrl(br.logo), photo=mediaUrl(student.photo||student.profileImage||user.profileImage); const name=user.name||student.name||'Student'; const ranking=data.ranking||{}; const fee=data.feeBalance??data.outstandingFee??null; const sigs=data.reportSignatures||{}; const classTeacherSig=sigs.classTeacher||data.classTeacher?.signatureUrl||data.classTeacher?.signature; const headSig=sigs.headteacher||sigs.principal||data.headteacher?.signatureUrl||data.headteacher?.signature||data.principal?.signatureUrl||data.principal?.signature; const rows=subjects.length?subjects.map(s=>`<tr><td class="subject-cell">${esc(s.subject||s.learningArea||'Subject')}</td>${labs.map(l=>`<td>${esc(scoreFor(s,l))}</td>`).join('')}<td><b>${esc(s.average??s.score??'-')}${typeof (s.average??s.score)==='number'?'%':''}</b></td><td><b>${esc(s.grade||s.level||s.competencyLevel||'-')}</b></td><td class="comment-cell">${esc(s.comment||s.remarks||s.teacherComment||'')}</td></tr>`).join(''):`<tr><td colspan="${labs.length+4}">No published marks yet.</td></tr>`; return `<!doctype html><html><head><meta charset="utf-8"><title>Report Card - ${esc(name)}</title><style>@page{size:A4;margin:7mm}*{box-sizing:border-box}body{margin:0;background:#fff;color:#172033;font-family:Arial,Helvetica,sans-serif;font-size:10.5px}.actions{display:flex;justify-content:flex-end;gap:8px;padding:8px}.actions button{border:1px solid #cbd5e1;border-radius:8px;background:#fff;padding:8px 12px;font-weight:700;cursor:pointer}.actions .primary{background:${primary};border-color:${primary};color:#fff}.report{width:100%;max-width:780px;min-height:1080px;margin:0 auto;border:1px solid #d9e2ef;border-radius:14px;padding:12px;position:relative;overflow:hidden}.wm{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:400px;height:400px;display:flex;align-items:center;justify-content:center;opacity:.055;z-index:0;pointer-events:none}.wm img{max-width:100%;max-height:100%;object-fit:contain}.top,.bio,.summary,.results,.comments,.signatures,.footer{position:relative;z-index:1}.top{display:grid;grid-template-columns:86px 1fr 80px;gap:10px;align-items:center;border-bottom:3px solid ${primary};padding-bottom:7px}.logo{width:82px;height:70px;object-fit:contain}.photo{width:74px;height:74px;border-radius:12px;object-fit:cover;border:2px solid ${accent}}.photo-placeholder{width:74px;height:74px;border-radius:12px;background:${primary};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:20px}h1{margin:0;color:${primary};font-size:21px;line-height:1.1}.subtitle{font-weight:700;margin-top:3px}.muted{color:#64748b}.bio,.summary{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin:8px 0}.box{border:1px solid #e2e8f0;border-radius:8px;padding:5px;background:#f8fafc;min-height:34px}.box b{display:block;color:${primary};font-size:9.5px;text-transform:uppercase;letter-spacing:.02em}.results{width:100%;border-collapse:collapse;margin-top:6px}.results th{background:${primary};color:#fff;padding:5px;text-align:left;font-size:9.5px}.results td{border-bottom:1px solid #e2e8f0;padding:4px;vertical-align:top}.subject-cell{font-weight:700}.comment-cell{max-width:150px;font-size:9.5px}.comments{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:8px}.comment-box{min-height:48px}.signatures{display:grid;grid-template-columns:1fr 1fr 92px;gap:10px;align-items:end;margin-top:10px}.sig-box{height:40px;border-bottom:1px solid #334155;display:flex;align-items:flex-end;justify-content:center}.sig-img{max-height:38px;max-width:170px;object-fit:contain}.sig-line{height:40px;border-bottom:1px solid #334155}.sig-label{text-align:center;font-size:9.5px;margin-top:3px;color:#334155}.stamp{height:58px;border:1px dashed #94a3b8;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#64748b;font-size:9px}.footer{text-align:center;margin-top:6px;color:#64748b;font-size:9px}@media print{body{font-size:9.5px}.actions{display:none}.report{border:0;border-radius:0;min-height:auto;padding:0}.box{padding:4px}.results th,.results td{padding:3px}}</style></head><body><div class="actions"><button class="primary" onclick="window.print()">Print / Save PDF</button></div><main class="report">${logo?`<div class="wm"><img src="${esc(logo)}"></div>`:''}<section class="top">${logo?`<img class="logo" src="${esc(logo)}">`:'<div></div>'}<div><h1>${esc(br.schoolName)}</h1><div class="subtitle">Official Student Report Card</div><div class="muted">${esc((school.curriculum||school.system||student.curriculum||'CBC').toString().toUpperCase())} • Generated ${new Date().toLocaleDateString()}</div></div>${photo?`<img class="photo" src="${esc(photo)}">`:`<div class="photo-placeholder">${esc(initials(name))}</div>`}</section><section class="bio"><div class="box"><b>Student</b>${esc(name)}</div><div class="box"><b>Class / Grade</b>${esc(student.className||student.grade||data.className||'-')}</div><div class="box"><b>Adm / Assessment No.</b>${esc(student.admissionNumber||student.admNo||student.elimuid||student.assessmentNumber||'-')}</div><div class="box"><b>Class Teacher</b>${esc(data.classTeacher?.name||'Not assigned')}</div></section><section class="summary"><div class="box"><b>Average</b>${esc(academic.overallAverage??academic.average??0)}%</div><div class="box"><b>Attendance</b>${esc(attendance.rate??0)}%</div><div class="box"><b>Present</b>${esc(attendance.present??'-')}</div><div class="box"><b>Absent / Late</b>${esc(attendance.absent??'-')} / ${esc(attendance.late??0)}</div></section><table class="results"><thead><tr><th>Subject / Learning Area</th>${labs.map(l=>`<th>${esc(l)}</th>`).join('')}<th>Final</th><th>Level / Grade</th><th>Teacher Comment</th></tr></thead><tbody>${rows}</tbody></table><section class="summary"><div class="box"><b>Total Subjects</b>${subjects.length}</div><div class="box"><b>Fee Balance</b>${fee===null||fee===undefined?'-':`KES ${Number(fee||0).toLocaleString()}`}</div>${ranking.showClassPosition?`<div class="box"><b>Class Position</b>${esc(ranking.classPosition?`${ranking.classPosition}${ranking.classSize?' / '+ranking.classSize:''}`:'-')}</div>`:`<div class="box"><b>Closing Date</b>${esc(data.closingDate||school.closingDate||'-')}</div>`}${ranking.showStreamPosition?`<div class="box"><b>Stream Position</b>${esc(ranking.streamPosition?`${ranking.streamPosition}${ranking.streamSize?' / '+ranking.streamSize:''}`:'-')}</div>`:`<div class="box"><b>Opening Date</b>${esc(data.openingDate||school.openingDate||'-')}</div>`}</section><section class="comments"><div class="box comment-box"><b>Class Teacher Comment</b>${esc(data.classTeacherComment||data.classTeacher?.comment||'')}</div><div class="box comment-box"><b>Headteacher / Principal Comment</b>${esc(data.headteacherComment||data.principalComment||data.headteacher?.comment||data.principal?.comment||'')}</div></section><section class="signatures">${sig('Class Teacher Signature', classTeacherSig)}${sig('Headteacher / Principal Signature', headSig)}<div><div class="stamp">School Stamp</div><div class="sig-label">Stamp</div></div></section><div class="footer">${esc(br.reportFooter)}</div></main></body></html>`; };

  async function boot(){ loadCachedPlan(); await refreshPlanState(); applyVisibility(document); stabilizeLogo(); injectChildContext(); if(role()==='parent') window.loadParentAlerts?.(); }
  document.addEventListener('DOMContentLoaded',()=>{ boot(); try{ new MutationObserver(()=>{ applyVisibility(document); }).observe(document.body,{childList:true,subtree:true}); }catch{} });
  window.addEventListener('shule:child-switched',()=>setTimeout(()=>{injectChildContext(); window.loadParentAlerts?.(); applyVisibility(document);},80));
  setInterval(()=>{ stabilizeLogo(); },2500);
})();

/* ---- end merged from v124-stable-final-consolidation.js ---- */
