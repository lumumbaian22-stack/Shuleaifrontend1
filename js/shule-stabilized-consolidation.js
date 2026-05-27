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
        if (/subscription/i.test(s)) d.querySelectorAll('.finance-v31,.finance-v31-modal').forEach(el => { if (!el.closest('#dashboard-content')) el.remove(); });
        if (s === 'dashboard' && isRole('admin','super_admin','superadmin')) w.loadAdminCalendarPreviewEvents && w.loadAdminCalendarPreviewEvents();
        if (s === 'payments' && isRole('parent')) w.refreshParentSchoolPaymentInfo && w.refreshParentSchoolPaymentInfo();
      }, 250);
      return out;
    };
    safeShow.__v89Consolidated = true;
    w.showDashboardSection = safeShow;
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
