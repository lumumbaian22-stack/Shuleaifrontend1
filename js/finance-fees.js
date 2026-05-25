// Shule AI Finance & Fees — complete module
// Handles fee structures, school payment settings, and fee account records.
(function(){
  const w = window;
  const money = (n) => 'KES ' + Number(n || 0).toLocaleString();
  const esc = (v) => String(v ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const state = { tab:'structures', structures:[], classes:[], settings:{}, accounts:[], paymentRecords:[], manualQueue:[], loading:false, filters:{ className:'', term:'', year:String(new Date().getFullYear()) } };

  function apiSafe(){ return w.api || {}; }
  async function call(fn, fallback){ try { const res = await fn(); return res?.data ?? res ?? fallback; } catch(e){ console.error('[Finance & Fees]', e); return fallback; } }
  function schoolSettings(){ return state.settings?.paymentSettings || state.settings || {}; }
  function bankSettings(){ return state.settings?.bankDetails || state.settings?.bank || {}; }
  function getClassName(c){ return c?.name || c?.grade || c?.className || c?.level || 'Class'; }
  function getStructureClassName(s){ return s?.className || s?.classGrade || s?.gradeLevel || s?.Class?.name || 'Class'; }
  function normalizedStatus(s){ return String(s?.status || 'draft').trim().toLowerCase(); }
  function classKeyFromName(name){ return String(name || '').trim(); }
  function accountStudentName(a){ return a.Student?.User?.name || a.Student?.name || a.studentName || 'Student'; }
  function accountClassName(a){ return a.Student?.className || a.Student?.grade || a.Student?.Class?.name || a.className || a.metadata?.className || 'Unassigned'; }
  function recordClassName(r){ return r.Student?.className || r.Student?.grade || r.Student?.Class?.name || r.className || r.metadata?.className || 'Unassigned'; }
  function recordStudentName(r){ return r.Student?.User?.name || r.Student?.name || r.studentName || r.studentId || 'Student'; }
  function recordElimuId(r){ return r.metadata?.studentElimuid || r.metadata?.elimuId || r.accountReference || r.Student?.elimuid || r.Student?.elimuId || r.Student?.admissionNumber || '—'; }
  function visibleClasses(){
    const names = new Set((state.classes||[]).map(getClassName).filter(Boolean));
    (state.accounts||[]).forEach(a=>names.add(accountClassName(a)));
    (state.paymentRecords||[]).forEach(r=>names.add(recordClassName(r)));
    return [...names].filter(Boolean).sort((a,b)=>String(a).localeCompare(String(b), undefined, {numeric:true}));
  }
  function getSelectedRecordClass(){ return state.filters.recordClassName || ''; }
  function setRecordClass(name){ state.filters.recordClassName = name || ''; const el=document.getElementById('finance-v31-tab-body'); if(el) el.innerHTML=renderRecords(); }
  function classFinancialSummary(className){
    const accounts=(state.accounts||[]).filter(a=>!className || accountClassName(a)===className);
    const records=(state.paymentRecords||[]).filter(r=>!className || recordClassName(r)===className);
    const expected=accounts.reduce((s,a)=>s+Number(a.totalAmount||a.total||0),0);
    const paid=accounts.reduce((s,a)=>s+Number(a.paidAmount||a.paid||0),0);
    const outstanding=accounts.reduce((s,a)=>s+Number(a.balance ?? Math.max(0,Number(a.totalAmount||0)-Number(a.paidAmount||0))),0);
    const defaulters=accounts.filter(a=>Number(a.balance ?? Math.max(0,Number(a.totalAmount||0)-Number(a.paidAmount||0)))>0);
    return {accounts,records,expected,paid,outstanding,defaulters};
  }


  async function loadClasses(){
    const api = apiSafe();
    const res = await call(() => api.admin?.getClasses ? api.admin.getClasses() : apiRequest('/api/classes'), []);
    state.classes = Array.isArray(res) ? res : (res.classes || res.items || res.data || []);
  }
  async function loadStructures(){
    const api = apiSafe();
    const res = await call(() => api.feeStructures?.list ? api.feeStructures.list({}) : apiRequest('/api/fee-structures'), []);
    state.structures = Array.isArray(res) ? res : (res.structures || res.items || res.data || []);
  }
  async function loadSettings(){
    const api = apiSafe();
    state.settings = await call(() => api.payments?.getSchoolSettings ? api.payments.getSchoolSettings() : apiRequest('/api/payments/admin/school-settings'), {});
  }
  async function loadPayments(){
    const api = apiSafe();
    const accountsRes = await call(() => api.feeStructures?.studentAccounts ? api.feeStructures.studentAccounts({}) : apiRequest('/api/fee-structures/student-accounts'), []);
    state.accounts = Array.isArray(accountsRes) ? accountsRes : (accountsRes.accounts || accountsRes.items || accountsRes.data || []);
    const recordsRes = await call(() => api.payments?.getAdminRecords ? api.payments.getAdminRecords() : apiRequest('/api/payments/admin/records'), []);
    state.paymentRecords = Array.isArray(recordsRes) ? recordsRes : (recordsRes.records || recordsRes.items || recordsRes.data || []);
  }
  async function loadManualQueue(){ const api = apiSafe(); state.manualQueue = await call(() => api.payments?.getManualQueue ? api.payments.getManualQueue() : apiRequest('/api/payments/admin/manual-queue'), []); }
  async function loadAll(){ state.loading=true; await Promise.all([loadClasses(), loadStructures(), loadSettings(), loadPayments(), loadManualQueue()]); state.loading=false; }

  function totals(){
    const structures = state.structures || [];
    const accounts = state.accounts || [];
    const expected = accounts.length ? accounts.reduce((s,x)=>s+Number(x.totalAmount || x.total || 0),0) : structures.reduce((s,x)=>s+Number(x.totalAmount || x.total || 0),0);
    const paid = accounts.reduce((s,x)=>s+Number(x.paidAmount || x.paid || 0),0);
    const balances = accounts.reduce((s,x)=>s+Number(x.balance ?? Math.max(0, Number(x.totalAmount||0)-Number(x.paidAmount||0))),0);
    return { expected, paid, outstanding: balances || Math.max(0, expected-paid), active: structures.filter(x=>['active','locked'].includes(normalizedStatus(x))).length };
  }

  function setMessage(type,msg){ const el=document.getElementById('finance-v31-message'); if(!el)return; el.className='finance-v31-message show '+type; el.textContent=msg; }
  function clearMessage(){ const el=document.getElementById('finance-v31-message'); if(el){el.className='finance-v31-message';el.textContent='';} }

  function renderSummary(){ const t=totals(); return `<div class="finance-v31-summary">
    <div class="finance-v31-metric"><div><strong style="color:var(--ff-green)">Total Expected Fees</strong><h3>${money(t.expected)}</h3><small>This term</small></div><div class="finance-v31-icon green">₭</div></div>
    <div class="finance-v31-metric"><div><strong style="color:var(--ff-blue)">Total Collected</strong><h3>${money(t.paid)}</h3><small>${t.expected?Math.round(t.paid/t.expected*100):0}% of expected</small></div><div class="finance-v31-icon blue">↓</div></div>
    <div class="finance-v31-metric"><div><strong style="color:var(--ff-orange)">Outstanding Balance</strong><h3>${money(t.outstanding)}</h3><small>Remaining</small></div><div class="finance-v31-icon orange">!</div></div>
    <div class="finance-v31-metric"><div><strong style="color:var(--ff-purple)">Active Fee Structures</strong><h3>${t.active}</h3><small>Across classes</small></div><div class="finance-v31-icon purple">▣</div></div>
  </div>`; }

  function renderTabs(){ return `<div class="finance-v31-tabs">
    <div class="finance-v31-tab ${state.tab==='structures'?'active':''}" onclick="financeV31SetTab('structures')">▦ Fee Structures</div>
    <div class="finance-v31-tab ${state.tab==='settings'?'active':''}" onclick="financeV31SetTab('settings')">▤ Payment Settings</div>
    <div class="finance-v31-tab ${state.tab==='records'?'active':''}" onclick="financeV31SetTab('records')">▥ Payment Records</div>
    <div class="finance-v31-tab ${state.tab==='verification'?'active':''}" onclick="financeV31SetTab('verification')">✓ Verification Queue</div>
  </div>`; }

  function structureItems(s){
    const items = Array.isArray(s.items) ? s.items : Array.isArray(s.feeItems) ? s.feeItems : [];
    if(!items.length) return '<div class="finance-v31-item-row"><span>No fee items configured</span><span></span></div>';
    return items.map(i=>`<div class="finance-v31-item-row"><span>${esc(i.name || i.itemName || i.label)}</span><span>${money(i.amount)}</span></div>`).join('');
  }
  function filteredStructures(){
    return (state.structures || []).filter(s=>{
      const className = getStructureClassName(s);
      if(state.filters.className && className !== state.filters.className) return false;
      if(state.filters.term && s.term !== state.filters.term) return false;
      if(state.filters.year && String(s.year || '') !== String(state.filters.year)) return false;
      return true;
    });
  }
  function actionButtons(s){
    const id = esc(s.id);
    const status = normalizedStatus(s);
    const main = status === 'draft'
      ? `<button class="finance-v31-btn blue" onclick="financeV31Activate('${id}')">Activate</button>`
      : `<button class="finance-v31-btn blue" onclick="financeV31Assign('${id}')">Assign</button>`;
    const lock = status === 'locked'
      ? `<button class="finance-v31-btn muted" disabled>Locked</button>`
      : `<button class="finance-v31-btn danger" onclick="financeV31Lock('${id}')">Lock</button>`;
    return `<button class="finance-v31-btn" onclick="financeV31OpenStructureModal('${id}')">Edit</button>${main}${lock}`;
  }
  function renderStructures(){
    const structures = filteredStructures();
    const year = new Date().getFullYear();
    return `<div class="finance-v31-body"><div id="finance-v31-message" class="finance-v31-message"></div>
      <div class="finance-v31-toolbar"><div><h2 style="margin:0;font-size:22px;font-weight:900">Fee Structures</h2><p style="margin:4px 0 0;color:var(--ff-muted)">Create and manage class-based school fees.</p></div><button class="finance-v31-btn primary" onclick="financeV31OpenStructureModal()">+ Create Fee Structure</button></div>
      <div class="finance-v31-filters">
        <select id="finance-v31-class-filter" class="finance-v31-select" onchange="financeV31ApplyFilter()"><option value="">All Classes</option>${state.classes.map(c=>`<option value="${esc(getClassName(c))}" ${state.filters.className===getClassName(c)?'selected':''}>${esc(getClassName(c))}</option>`).join('')}</select>
        <select id="finance-v31-term-filter" class="finance-v31-select" onchange="financeV31ApplyFilter()"><option value="">All Terms</option><option ${state.filters.term==='Term 1'?'selected':''}>Term 1</option><option ${state.filters.term==='Term 2'?'selected':''}>Term 2</option><option ${state.filters.term==='Term 3'?'selected':''}>Term 3</option></select>
        <select id="finance-v31-year-filter" class="finance-v31-select" onchange="financeV31ApplyFilter()"><option ${String(state.filters.year)===String(year)?'selected':''}>${year}</option><option ${String(state.filters.year)===String(year+1)?'selected':''}>${year+1}</option><option value="">All Years</option></select>
      </div>
      <div class="finance-v31-grid" style="margin-top:16px">${structures.length?structures.map(s=>`<div class="finance-v31-card"><div class="finance-v31-card-head"><h3>${esc(s.name || `${getStructureClassName(s)} — ${s.term || ''} — ${s.year || ''}`)}</h3><span class="finance-v31-badge ${esc(normalizedStatus(s))}">${esc(s.status||'Draft')}</span></div><div class="finance-v31-items">${structureItems(s)}</div><div class="finance-v31-total"><span>Total:</span><span>${money(s.totalAmount || s.total)}</span></div><div class="finance-v31-card-actions">${actionButtons(s)}</div></div>`).join(''):'<div class="finance-v31-empty" style="grid-column:1/-1">No fee structures found for the selected filters.</div>'}</div>
    </div>`;
  }

  function renderSettings(){
    const s=schoolSettings();
    const b=bankSettings();
    const ref = s.accountReferenceFormat || s.referenceFormat || 'elimuid';
    return `<div class="finance-v31-body"><div id="finance-v31-message" class="finance-v31-message"></div><div class="finance-v31-toolbar"><div><h2 style="margin:0;font-size:22px;font-weight:900">Payment Settings</h2><p style="margin:4px 0 0;color:var(--ff-muted)">Configure where parents pay school fees. School fees go directly to the school account.</p></div><button class="finance-v31-btn primary" onclick="financeV31SavePaymentSettings()">Save Settings</button></div><div class="finance-v31-settings-grid"><div class="finance-v31-form-card"><h3>School Fee Collection Account</h3><div class="finance-v31-methods"><span class="finance-v31-method active">MPESA Paybill</span><span class="finance-v31-method">Till Number</span><span class="finance-v31-method">Bank Account</span><span class="finance-v31-method">Card Provider</span></div><label>Payment Mode</label><select id="finance-payment-mode" class="finance-v31-select"><option value="manual" ${s.paymentMode==='manual'?'selected':''}>Manual M-Pesa Verification</option><option value="daraja" ${s.paymentMode==='daraja'?'selected':''}>Daraja Auto STK</option></select><label>M-Pesa Type</label><select id="finance-mpesa-type" class="finance-v31-select"><option value="paybill" ${s.mpesaType!=='till'?'selected':''}>Paybill</option><option value="till" ${s.mpesaType==='till'?'selected':''}>Till</option></select><label>Business Shortcode / Paybill / Till</label><input id="finance-paybill" class="finance-v31-input" value="${esc(s.paybill||s.businessShortcode||s.shortcode||s.till||'')}" placeholder="e.g. 222222"><label>Daraja Consumer Key</label><input id="finance-daraja-key" class="finance-v31-input" placeholder="Only for Daraja mode"><label>Daraja Consumer Secret</label><input id="finance-daraja-secret" class="finance-v31-input" placeholder="Only for Daraja mode"><label>Daraja Passkey</label><input id="finance-daraja-passkey" class="finance-v31-input" placeholder="Only for Daraja mode"><label>Account Reference Format</label><select id="finance-reference" class="finance-v31-select"><option value="elimuid" ${ref==='elimuid'?'selected':''}>Elimu ID</option><option value="admissionNumber" ${ref==='admissionNumber'?'selected':''}>Student Admission Number</option><option value="studentId" ${ref==='studentId'?'selected':''}>Student ID</option></select><div class="finance-v31-notice">Real fee completion must come from Daraja callback confirmation, not from the browser.</div></div><div class="finance-v31-form-card"><h3>Bank Details</h3><input id="finance-bank-name" class="finance-v31-input" placeholder="Bank Name" value="${esc(b.bankName||s.bankName||'')}"><input id="finance-account-name" class="finance-v31-input" placeholder="Account Name" value="${esc(b.accountName||s.accountName||'')}"><input id="finance-account-number" class="finance-v31-input" placeholder="Account Number" value="${esc(b.accountNumber||s.bankAccount||s.accountNumber||'')}"><input id="finance-branch" class="finance-v31-input" placeholder="Branch" value="${esc(b.branch||s.branch||'')}"></div><div class="finance-v31-total-box"><strong>Important</strong><p style="color:var(--ff-muted)">Parents pay school fees to the school. Shule AI tracks and verifies payments. Platform subscriptions remain separate from school fee collection.</p><button class="finance-v31-btn blue" onclick="financeV31TestConnection()">Test Connection</button></div></div></div>`;
  }

  function renderRecords(){
    const classes = visibleClasses();
    const selectedClass = getSelectedRecordClass();
    const summary = classFinancialSummary(selectedClass);
    const rows=(state.paymentRecords||[]).filter(r=>{
      const className = recordClassName(r);
      if(selectedClass && className !== selectedClass) return false;
      if(state.filters.term && (r.Fee?.term || r.metadata?.term) !== state.filters.term) return false;
      if(state.filters.year && String(r.Fee?.year || r.metadata?.year || '') !== String(state.filters.year)) return false;
      return true;
    });
    const accounts = summary.accounts;
    const defaulters = summary.defaulters;
    return `<div class="finance-v31-body"><div id="finance-v31-message" class="finance-v31-message"></div>
      <div class="finance-v31-toolbar"><div><h2 style="margin:0;font-size:22px;font-weight:900">Payment Records</h2><p style="margin:4px 0 0;color:var(--ff-muted)">Backend-saved school fee payments grouped by class and student.</p></div><button class="finance-v31-btn" onclick="financeV31Refresh()">Refresh Records</button></div>
      <div class="finance-v31-class-tabs"><button class="finance-v31-class-tab ${!selectedClass?'active':''}" onclick="financeV31SetRecordClass('')">All Classes</button>${classes.map(c=>`<button class="finance-v31-class-tab ${selectedClass===c?'active':''}" onclick="financeV31SetRecordClass('${esc(c)}')">${esc(c)}</button>`).join('')}</div>
      <div class="finance-v31-summary compact"><div class="finance-v31-metric"><div><strong>Total Expected</strong><h3>${money(summary.expected)}</h3></div></div><div class="finance-v31-metric"><div><strong>Total Paid</strong><h3>${money(summary.paid)}</h3></div></div><div class="finance-v31-metric"><div><strong>Outstanding</strong><h3>${money(summary.outstanding)}</h3></div></div><div class="finance-v31-metric"><div><strong>Fee Defaulters</strong><h3>${defaulters.length}</h3></div></div></div>
      <div class="finance-v31-two-col">
        <div class="finance-v31-card wide"><h3 style="margin-top:0">${selectedClass?esc(selectedClass):'All Classes'} Payment History</h3><div class="finance-v31-table-wrap"><table class="finance-v31-table"><thead><tr><th>Student</th><th>Elimu ID</th><th>Class</th><th>Term</th><th>Amount</th><th>M-Pesa Code</th><th>Status</th><th>Date</th><th>Method</th></tr></thead><tbody>${rows.length?rows.map(r=>`<tr><td>${esc(recordStudentName(r))}</td><td>${esc(recordElimuId(r))}</td><td>${esc(recordClassName(r))}</td><td>${esc(r.Fee?.term || r.metadata?.term || '—')}</td><td>${money(r.amount)}</td><td><strong>${esc(r.mpesaReceiptNumber || r.reference || '—')}</strong></td><td><span class="finance-v31-badge ${esc(String(r.status||'pending').toLowerCase())}">${esc(r.status||'pending')}</span></td><td>${esc((r.completedAt || r.verifiedAt || r.createdAt || '').slice(0,10))}</td><td>${esc(r.paymentGateway || r.method || 'mpesa')}</td></tr>`).join(''):'<tr><td colspan="9"><div class="finance-v31-empty">No payment records found for this class yet.</div></td></tr>'}</tbody></table></div></div>
        <div class="finance-v31-card"><h3 style="margin-top:0">Students With Balances</h3><div class="finance-v31-defaulter-list">${accounts.length?accounts.map(a=>{ const bal=Number(a.balance ?? Math.max(0,Number(a.totalAmount||0)-Number(a.paidAmount||0))); const pct=Number(a.totalAmount||0)?Math.round((Number(a.paidAmount||0)/Number(a.totalAmount||0))*100):0; return `<div class="finance-v31-defaulter ${bal>0?'owing':'paid'}"><div><strong>${esc(accountStudentName(a))}</strong><small>${esc(accountClassName(a))} • ${esc(a.term||'Term')} ${esc(a.year||'')}</small></div><div class="text-right"><strong>${money(bal)}</strong><small>${pct}% paid</small></div></div>` }).join(''):'<div class="finance-v31-empty">No fee accounts found. Assign fee structures first.</div>'}</div></div>
      </div>
    </div>`;
  }

  function renderVerification(){
    const rows = state.manualQueue || [];
    return `<div class="finance-v31-body"><div id="finance-v31-message" class="finance-v31-message"></div><div class="finance-v31-toolbar"><div><h2 style="margin:0;font-size:22px;font-weight:900">Payment Verification Queue</h2><p style="margin:4px 0 0;color:var(--ff-muted)">Approve manual M-Pesa payments after checking the school statement/SMS.</p></div><button class="finance-v31-btn" onclick="financeV31RefreshQueue()">Refresh</button></div><div class="finance-v31-table-wrap"><table class="finance-v31-table"><thead><tr><th>Student</th><th>Elimu ID</th><th>Amount</th><th>M-Pesa Code</th><th>Parent</th><th>Date</th><th>Actions</th></tr></thead><tbody>${rows.length?rows.map(p=>`<tr><td>${esc(p.Student?.User?.name || p.studentId || 'Student')}</td><td>${esc(p.metadata?.studentElimuid || p.accountReference || '—')}</td><td>${money(p.amount)}</td><td><strong>${esc(p.reference || '—')}</strong></td><td>${esc(p.Parent?.User?.name || p.Parent?.User?.phone || 'Parent')}</td><td>${esc((p.createdAt||'').slice(0,10))}</td><td><button class="finance-v31-btn blue" onclick="financeV31ApproveManual('${esc(p.id)}')">Approve</button><button class="finance-v31-btn danger" onclick="financeV31RejectManual('${esc(p.id)}')">Reject</button></td></tr>`).join(''):'<tr><td colspan="7"><div class="finance-v31-empty">No pending manual payments.</div></td></tr>'}</tbody></table></div></div>`;
  }

  function body(){ if(state.tab==='settings') return renderSettings(); if(state.tab==='records') return renderRecords(); if(state.tab==='verification') return renderVerification(); return renderStructures(); }
  function renderBodyOnly(){
    const bodyEl=document.getElementById('finance-v31-tab-body');
    if(bodyEl) bodyEl.innerHTML=body();
    const root=document.querySelector('.finance-v31');
    if(root){
      const summary=root.querySelector('.finance-v31-summary');
      if(summary){
        const fresh=document.createElement('div');
        fresh.innerHTML=renderSummary();
        summary.replaceWith(fresh.firstElementChild);
      }
    }
  }
  async function render(){ const root=document.getElementById('dashboard-content'); if(!root) return; root.innerHTML='<div class="finance-v31"><div class="finance-v31-empty">Loading Finance & Fees...</div></div>'; await loadAll(); root.innerHTML=`<section class="finance-v31"><div class="finance-v31-header"><div class="finance-v31-title"><h1>Finance & Fees</h1><p>Manage fee structures, payment settings, and all school payment records.</p></div><div class="finance-v31-actions"><button class="finance-v31-btn" onclick="financeV31Refresh()">Refresh</button><button class="finance-v31-btn primary" onclick="financeV31Repair()">Repair Accounts</button><button class="finance-v31-btn primary" onclick="financeV31OpenStructureModal()">+ Create Fee Structure</button></div></div>${renderSummary()}<div class="finance-v31-shell">${renderTabs()}<div id="finance-v31-tab-body">${body()}</div></div></section>`; }

  w.financeV31Refresh = render;
  w.financeV31SetTab = function(tab){ state.tab=tab; const el=document.getElementById('finance-v31-tab-body'); if(el) el.innerHTML=body(); document.querySelectorAll('.finance-v31-tab').forEach(x=>x.classList.toggle('active', x.getAttribute('onclick')?.includes(tab))); };
  w.financeV31ApplyFilter = function(){ state.filters.className=document.getElementById('finance-v31-class-filter')?.value||''; state.filters.term=document.getElementById('finance-v31-term-filter')?.value||''; state.filters.year=document.getElementById('finance-v31-year-filter')?.value||''; const el=document.getElementById('finance-v31-tab-body'); if(el) el.innerHTML=renderStructures(); };
  w.financeV31OpenStructureModal = function(id){
    const s=(state.structures||[]).find(x=>String(x.id)===String(id))||{};
    const selectedIds = new Set(String(s.classId||'').split(',').filter(Boolean));
    const classChecks=state.classes.map(c=>`<label class="finance-v31-check"><input type="checkbox" class="ff-class-check" value="${esc(c.id||getClassName(c))}" data-name="${esc(getClassName(c))}" ${selectedIds.has(String(c.id))?'checked':''}> <span>${esc(getClassName(c))}</span></label>`).join('');
    const classOptions=state.classes.map(c=>`<option value="${esc(c.id||c.name)}" ${String(s.classId||'')===String(c.id)?'selected':''}>${esc(getClassName(c))}</option>`).join('');
    document.body.insertAdjacentHTML('beforeend',`<div class="finance-v31 finance-v31-modal"><div class="finance-v31-modal-inner wide"><div class="finance-v31-modal-head"><div><strong>${id?'Edit':'Create'} Fee Structure</strong><p style="margin:4px 0 0;color:var(--ff-muted)">${id?'Edit this fee structure.':'Create one fee structure for one class or many class groups.'}</p></div><button class="finance-v31-close" onclick="this.closest('.finance-v31-modal').remove()">×</button></div><div class="finance-v31-modal-body"><div id="finance-v31-modal-message" class="finance-v31-message"></div><div class="finance-v31-form-grid wide"><div class="finance-v31-form-card full"><div class="finance-v31-form-row"><input id="ff-name" class="finance-v31-input" placeholder="Structure name e.g. Term 1 Fees" value="${esc(s.name||'')}"><select id="ff-term" class="finance-v31-select"><option ${s.term==='Term 1'?'selected':''}>Term 1</option><option ${s.term==='Term 2'?'selected':''}>Term 2</option><option ${s.term==='Term 3'?'selected':''}>Term 3</option></select><input id="ff-year" class="finance-v31-input" type="number" value="${esc(s.year||new Date().getFullYear())}"></div><div class="finance-v31-form-row"><select id="ff-curriculum" class="finance-v31-select"><option ${s.curriculum==='CBC'?'selected':''}>CBC</option><option ${s.curriculum==='CBE'?'selected':''}>CBE</option><option ${s.curriculum==='8-4-4'?'selected':''}>8-4-4</option></select><input id="ff-due" class="finance-v31-input" type="date" value="${esc((s.dueDate||'').slice(0,10))}"></div><div class="finance-v31-target-box"><div><strong>Apply to classes</strong><p style="margin:4px 0 10px;color:var(--ff-muted)">${id?'Editing keeps this structure attached to its current class.':'Select one class or tick several classes/groups such as Grade 1–6.'}</p></div>${id?`<select id="ff-class" class="finance-v31-select"><option value="">Select class</option>${classOptions}</select>`:`<div class="finance-v31-class-checks">${classChecks || '<div class="finance-v31-empty">No classes found.</div>'}</div><div class="finance-v31-mini-actions"><button type="button" class="finance-v31-btn" onclick="document.querySelectorAll('.ff-class-check').forEach(x=>x.checked=true)">Select All</button><button type="button" class="finance-v31-btn" onclick="document.querySelectorAll('.ff-class-check').forEach(x=>x.checked=false)">Clear</button></div>`}</div><h3>Fee Items</h3><div id="ff-items"></div><button class="finance-v31-btn" onclick="financeV31AddFeeItem()">+ Add Item</button></div><div class="finance-v31-total-box sticky"><strong>Calculated Total</strong><h2 id="ff-total">KES 0</h2><p style="color:var(--ff-muted)">Required items are assigned to every selected class. Each class gets its own DB fee structure so records stay clean per school/class.</p><button class="finance-v31-btn" onclick="this.closest('.finance-v31-modal').remove()">Cancel</button> <button class="finance-v31-btn primary" onclick="financeV31SaveStructure('${esc(id||'')}')">Save Fee Structure</button></div></div></div></div></div>`);
    const items=Array.isArray(s.items)?s.items:Array.isArray(s.feeItems)?s.feeItems:[{name:'Tuition',amount:''},{name:'Lunch',amount:''},{name:'Transport',amount:''}];
    items.forEach(i=>financeV31AddFeeItem(i)); financeV31RecalcTotal();
  };

  w.financeV31AddFeeItem = function(item={}){ const box=document.getElementById('ff-items'); if(!box)return; box.insertAdjacentHTML('beforeend',`<div class="finance-v31-fee-item"><input class="finance-v31-input ff-item-name" placeholder="Item name" value="${esc(item.name||item.itemName||'')}"><input class="finance-v31-input ff-item-amount" type="number" placeholder="Amount" value="${esc(item.amount||'')}" oninput="financeV31RecalcTotal()"><select class="finance-v31-select ff-item-type"><option value="required" ${item.required===false?'':'selected'}>Required</option><option value="optional" ${item.required===false?'selected':''}>Optional</option></select><button class="finance-v31-btn danger" onclick="this.closest('.finance-v31-fee-item').remove();financeV31RecalcTotal()">Remove</button></div>`); };
  w.financeV31RecalcTotal = function(){ let total=0; document.querySelectorAll('.finance-v31-fee-item').forEach(r=>{ const type=r.querySelector('.ff-item-type')?.value; if(type!=='optional') total+=Number(r.querySelector('.ff-item-amount')?.value||0); }); const el=document.getElementById('ff-total'); if(el)el.textContent=money(total); };
  w.financeV31SaveStructure = async function(id){
    const rows=[...document.querySelectorAll('.finance-v31-fee-item')];
    const items=rows.map(r=>({name:r.querySelector('.ff-item-name')?.value?.trim(), amount:Number(r.querySelector('.ff-item-amount')?.value||0), required:r.querySelector('.ff-item-type')?.value!=='optional'})).filter(i=>i.name&&i.amount>0);
    const base={ name:document.getElementById('ff-name')?.value?.trim(), term:document.getElementById('ff-term')?.value, year:Number(document.getElementById('ff-year')?.value), curriculum:document.getElementById('ff-curriculum')?.value, dueDate:document.getElementById('ff-due')?.value || null, items, feeItems:items, totalAmount:items.filter(i=>i.required!==false).reduce((s,i)=>s+i.amount,0) };
    const m=document.getElementById('finance-v31-modal-message');
    if(!base.name || !items.length){ if(m){m.className='finance-v31-message show error';m.textContent='Please name the structure and add fee items with amounts.';} return; }
    try{
      if(id){
        const classSelect=document.getElementById('ff-class');
        const selectedClass=state.classes.find(c=>String(c.id)===String(classSelect?.value));
        if(!selectedClass){ if(m){m.className='finance-v31-message show error';m.textContent='Please select a class.';} return; }
        await apiSafe().feeStructures.update(id,{...base, classId:classSelect?.value, className:getClassName(selectedClass), gradeLevel:getClassName(selectedClass)});
      } else {
        const checked=[...document.querySelectorAll('.ff-class-check:checked')].map(x=>({id:x.value, name:x.dataset.name||x.value}));
        if(!checked.length){ if(m){m.className='finance-v31-message show error';m.textContent='Select at least one class. You can select one class or a group of classes.';} return; }
        for(const c of checked){
          await apiSafe().feeStructures.create({...base, name: `${base.name} — ${c.name}`, classId:c.id, className:c.name, gradeLevel:c.name});
        }
      }
      document.querySelector('.finance-v31-modal')?.remove();
      window.dispatchEvent(new CustomEvent('shule:finance-updated',{detail:{type:'fee-structure-saved'}}));
      await render();
    }catch(e){ if(m){m.className='finance-v31-message show error';m.textContent=e.message||'Could not save fee structure.';} }
  };

  w.financeV31Activate = async function(id){ clearMessage(); try{ await apiSafe().feeStructures.activate(id); setMessage('success','Fee structure activated and fee accounts created for eligible students.'); await render(); }catch(e){ setMessage('error',e.message||'Could not activate fee structure.'); } };
  w.financeV31Assign = async function(id){ clearMessage(); try{ await apiSafe().feeStructures.assign(id,{ overwrite:false }); setMessage('success','Fee structure assigned and student fee accounts generated.'); await Promise.all([loadStructures(), loadPayments()]); renderBodyOnly(); }catch(e){ setMessage('error',e.message||'Assignment failed.'); } };
  w.financeV31Repair = async function(){ clearMessage(); try{ if(apiSafe().feeStructures?.repair) await apiSafe().feeStructures.repair(); else await apiRequest('/api/fee-structures/repair',{method:'POST'}); await loadAll(); renderBodyOnly(); setMessage('success','Fee accounts repaired and payment records reconciled.'); }catch(e){ setMessage('error',e.message||'Could not repair fee accounts.'); } };
  w.financeV31Lock = async function(id){ clearMessage(); if(!confirm('Lock this fee structure? Locked structures cannot be silently edited.'))return; try{ await apiSafe().feeStructures.lock(id); setMessage('success','Fee structure locked.'); await render(); }catch(e){ setMessage('error',e.message||'Could not lock fee structure.'); } };
  w.financeV31SavePaymentSettings = async function(){ clearMessage(); const data={ paymentMode:document.getElementById('finance-payment-mode')?.value || 'manual', mpesaType:document.getElementById('finance-mpesa-type')?.value || 'paybill', paybill:document.getElementById('finance-mpesa-type')?.value==='till'?'':document.getElementById('finance-paybill')?.value, till:document.getElementById('finance-mpesa-type')?.value==='till'?document.getElementById('finance-paybill')?.value:'', businessShortcode:document.getElementById('finance-paybill')?.value, shortcode:document.getElementById('finance-paybill')?.value, consumerKey:document.getElementById('finance-daraja-key')?.value, consumerSecret:document.getElementById('finance-daraja-secret')?.value, passkey:document.getElementById('finance-daraja-passkey')?.value, referenceFormat:document.getElementById('finance-reference')?.value || 'elimuid', bankName:document.getElementById('finance-bank-name')?.value, accountName:document.getElementById('finance-account-name')?.value, bankAccount:document.getElementById('finance-account-number')?.value, accountNumber:document.getElementById('finance-account-number')?.value, branch:document.getElementById('finance-branch')?.value, bankDetails:{ bankName:document.getElementById('finance-bank-name')?.value, accountName:document.getElementById('finance-account-name')?.value, accountNumber:document.getElementById('finance-account-number')?.value, branch:document.getElementById('finance-branch')?.value } }; try{ await apiSafe().payments.updateSchoolSettings(data); setMessage('success','Payment settings saved.'); await loadSettings(); }catch(e){ setMessage('error',e.message||'Could not save payment settings.'); } };
  w.financeV31TestConnection = async function(){ clearMessage(); try{ const res = await (apiSafe().payments?.testSchoolConnection ? apiSafe().payments.testSchoolConnection() : apiRequest('/api/payments/admin/test-connection',{method:'POST'})); setMessage('success', res?.message || 'Daraja connection verified successfully.'); }catch(e){ setMessage('error', e.message || 'Daraja connection test failed.'); } };
  w.financeV31RefreshQueue = async function(){ clearMessage(); await loadManualQueue(); const el=document.getElementById('finance-v31-tab-body'); if(el) el.innerHTML=renderVerification(); };
  w.financeV31ApproveManual = async function(id){ clearMessage(); if(!confirm('Approve this payment and update the student balance?')) return; try{ await apiSafe().payments.approveManualPayment(id,{}); await loadAll(); renderBodyOnly(); window.dispatchEvent(new CustomEvent('shule:finance-updated',{detail:{type:'payment-approved',id}})); localStorage.setItem('shule:lastFinanceUpdate', String(Date.now())); setMessage('success','Payment approved. Records and balances updated.'); }catch(e){ setMessage('error',e.message||'Could not approve payment.'); } };
  w.financeV31RejectManual = async function(id){ clearMessage(); const reason=prompt('Reason for rejection?') || 'Rejected by school finance/admin'; try{ await apiSafe().payments.rejectManualPayment(id,{reason}); await loadAll(); renderBodyOnly(); window.dispatchEvent(new CustomEvent('shule:finance-updated',{detail:{type:'payment-rejected',id}})); localStorage.setItem('shule:lastFinanceUpdate', String(Date.now())); setMessage('success','Payment rejected. Records refreshed.'); }catch(e){ setMessage('error',e.message||'Could not reject payment.'); } };
  w.financeV31RenderRecordsOnly = function(){ const el=document.getElementById('finance-v31-tab-body'); if(el) el.innerHTML = renderRecords(); };
  w.financeV31SetRecordClass = setRecordClass;
  w.financeV31ViewRecord = function(id){ const r=(state.paymentRecords||[]).find(x=>String(x.id)===String(id)); if(!r) return; alert(`Student: ${r.Student?.User?.name||r.Student?.name||'Student'}\nAmount: ${money(r.amount)}\nM-Pesa Code: ${r.mpesaReceiptNumber || r.reference || '—'}\nStatus: ${r.status||'pending'}\nDate: ${(r.completedAt || r.verifiedAt || r.createdAt || '').slice(0,10)}`); };
  w.financeV31ExportRecords = function(){
    clearMessage();
    const rows = state.paymentRecords || [];
    if(!rows.length){ setMessage('error','No payment records available to export.'); return; }
    const headers = ['Student','Elimu ID','Class','Term','Amount','M-Pesa Code','Status','Date','Method'];
    const csvRows = [headers, ...rows.map(r=>[
      r.Student?.User?.name || r.Student?.name || r.studentId || 'Student',
      r.metadata?.studentElimuid || r.accountReference || r.Student?.elimuid || r.Student?.elimuId || '',
      r.Student?.className || r.Student?.grade || r.metadata?.className || '',
      r.Fee?.term || r.metadata?.term || '',
      Number(r.amount||0), r.mpesaReceiptNumber || r.reference || '', r.status || 'pending', (r.completedAt || r.verifiedAt || r.createdAt || '').slice(0,10), r.paymentGateway || r.method || 'mpesa'
    ])].map(row=>row.map(v=>`"${String(v ?? '').replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csvRows], { type:'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `shule-ai-payment-records-${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    setMessage('success','Payment records exported.');
  };
  w.renderFinanceFeesV31 = render;
  w.v31RenderFinanceFees = render;
  window.addEventListener('shule:finance-updated', async function(){
    if(document.querySelector('.finance-v31')) { await loadAll(); renderBodyOnly(); }
  });
  window.addEventListener('storage', async function(e){
    if(e.key === 'shule:lastFinanceUpdate' && document.querySelector('.finance-v31')) { await loadAll(); renderBodyOnly(); }
  });
  w.financeV31SoftRefresh = async function(){ if(document.querySelector('.finance-v31')) { await loadAll(); renderBodyOnly(); } };

})();

// Legacy fee modal blocker — redirects old fee actions into the current Finance & Fees module.
(function(){
  const w=window;
  function removeLegacyFeeModals(){
    document.querySelectorAll('.v30-modal-shell,.v30-modal-backdrop').forEach(el=>el.remove());
    document.querySelectorAll('body > div').forEach(el=>{
      const txt=(el.innerText||'').trim();
      if(txt.includes('Fee setup') && txt.includes('Save Fee Structure') && txt.includes('Calculated total')) el.remove();
    });
  }
  function disableLegacyFeeRenderer(){
    w.v28OpenFeeStructureForm=function(){ removeLegacyFeeModals(); if(typeof w.financeV31OpenStructureModal==='function') return w.financeV31OpenStructureModal(); if(typeof w.showDashboardSection==='function') return w.showDashboardSection('finance-fees'); };
    w.v28SaveFeeStructure=function(){ removeLegacyFeeModals(); };
    w.renderAdminFeeStructures=function(){ if(typeof w.v31RenderFinanceFees==='function') return w.v31RenderFinanceFees(); return '<section class="finance-v31"><div class="finance-v31-empty">Finance & Fees module is loading. Refresh if it does not appear.</div></section>'; };
  }
  const observer=new MutationObserver(removeLegacyFeeModals);
  function start(){ disableLegacyFeeRenderer(); removeLegacyFeeModals(); observer.observe(document.body,{childList:true,subtree:false}); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start); else start();
})();

// v66 finance polish: modal sizing, grouped class tabs, visible buttons.
(function(){
  if (document.getElementById('finance-v66-polish-style')) return;
  const style=document.createElement('style');
  style.id='finance-v66-polish-style';
  style.textContent=`
    .finance-v31-modal{position:fixed;inset:0;z-index:9999;background:rgba(15,23,42,.62);display:flex;align-items:center;justify-content:center;padding:18px;overflow:auto}.finance-v31-modal-inner{width:min(980px,96vw);max-height:92vh;overflow:auto;background:var(--card,#fff);color:var(--foreground,#111827);border:1px solid var(--border,#e5e7eb);border-radius:20px;box-shadow:0 24px 70px rgba(0,0,0,.3)}.finance-v31-modal-inner.wide{width:min(1120px,98vw)}.finance-v31-modal-body{padding:18px;overflow:visible}.finance-v31-form-grid.wide{display:grid;grid-template-columns:minmax(0,1fr) 270px;gap:16px;align-items:start}.finance-v31-form-card.full{min-width:0}.finance-v31-form-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;margin-bottom:12px}.finance-v31-target-box{border:1px solid var(--border,#e5e7eb);border-radius:16px;padding:12px;margin:12px 0;background:var(--background,#fff)}.finance-v31-class-checks{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;max-height:240px;overflow:auto;padding-right:4px}.finance-v31-check{display:flex;gap:8px;align-items:center;padding:9px 10px;border:1px solid var(--border,#e5e7eb);border-radius:12px;background:var(--card,#fff);font-size:13px;line-height:1.2}.finance-v31-mini-actions{display:flex;gap:8px;margin-top:10px}.finance-v31-total-box.sticky{position:sticky;top:12px}.finance-v31-class-tabs{display:flex;flex-wrap:wrap;gap:8px;margin:14px 0}.finance-v31-class-tab{border:1px solid var(--border,#e5e7eb);background:var(--card,#fff);color:var(--foreground,#111827);border-radius:999px;padding:8px 12px;font-weight:800;font-size:13px;cursor:pointer}.finance-v31-class-tab.active{background:#0f766e;color:white;border-color:#0f766e}.finance-v31-summary.compact{grid-template-columns:repeat(auto-fit,minmax(170px,1fr));margin:10px 0 14px}.finance-v31-two-col{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(280px,.8fr);gap:14px}.finance-v31-card.wide{min-width:0}.finance-v31-defaulter-list{display:grid;gap:8px;max-height:520px;overflow:auto}.finance-v31-defaulter{display:flex;justify-content:space-between;gap:12px;padding:10px;border-radius:12px;border:1px solid var(--border,#e5e7eb);background:var(--background,#fff)}.finance-v31-defaulter small{display:block;color:var(--muted-foreground,#64748b);font-size:11px}.finance-v31-defaulter.owing{border-left:4px solid #f97316}.finance-v31-defaulter.paid{border-left:4px solid #22c55e}.finance-v31-btn,.finance-v31-tab,.finance-v31-select,.finance-v31-input{color:var(--foreground,#111827)!important}.finance-v31-btn.primary,.finance-v31-btn.blue,.finance-v31-btn.danger,.finance-v31-class-tab.active{color:#fff!important}@media(max-width:860px){.finance-v31-form-grid.wide,.finance-v31-two-col{grid-template-columns:1fr}.finance-v31-total-box.sticky{position:static}.finance-v31-modal{align-items:flex-start;padding:10px}.finance-v31-modal-inner{max-height:96vh}.finance-v31-class-checks{grid-template-columns:1fr}.finance-v31-table-wrap{overflow-x:auto}}
  `;
  document.head.appendChild(style);
})();
