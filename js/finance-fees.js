// Shule AI Finance & Fees — complete module
// Handles fee structures, school payment settings, and fee account records.
(function(){
  const w = window;
  const money = (n) => 'KES ' + Number(n || 0).toLocaleString();
  const esc = (v) => String(v ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const state = { tab:'structures', structures:[], classes:[], settings:{}, payments:[], loading:false, filters:{ className:'', term:'', year:String(new Date().getFullYear()) } };

  function apiSafe(){ return w.api || {}; }
  async function call(fn, fallback){ try { const res = await fn(); return res?.data ?? res ?? fallback; } catch(e){ console.error('[Finance & Fees]', e); return fallback; } }
  function schoolSettings(){ return state.settings?.paymentSettings || state.settings || {}; }
  function bankSettings(){ return state.settings?.bankDetails || state.settings?.bank || {}; }
  function getClassName(c){ return c?.name || c?.grade || c?.className || c?.level || 'Class'; }
  function getStructureClassName(s){ return s?.className || s?.classGrade || s?.gradeLevel || s?.Class?.name || 'Class'; }
  function normalizedStatus(s){ return String(s?.status || 'draft').trim().toLowerCase(); }

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
    const res = await call(() => api.feeStructures?.studentAccounts ? api.feeStructures.studentAccounts({}) : apiRequest('/api/fee-structures/student-accounts'), []);
    state.payments = Array.isArray(res) ? res : (res.accounts || res.items || res.data || []);
  }
  async function loadAll(){ state.loading=true; await Promise.all([loadClasses(), loadStructures(), loadSettings(), loadPayments()]); state.loading=false; }

  function totals(){
    const structures = state.structures || [];
    const accounts = state.payments || [];
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
    const ref = s.accountReferenceFormat || s.referenceFormat || 'admissionNumber';
    return `<div class="finance-v31-body"><div id="finance-v31-message" class="finance-v31-message"></div><div class="finance-v31-toolbar"><div><h2 style="margin:0;font-size:22px;font-weight:900">Payment Settings</h2><p style="margin:4px 0 0;color:var(--ff-muted)">Configure where parents pay school fees. School fees go directly to the school account.</p></div><button class="finance-v31-btn primary" onclick="financeV31SavePaymentSettings()">Save Settings</button></div><div class="finance-v31-settings-grid"><div class="finance-v31-form-card"><h3>School Fee Collection Account</h3><div class="finance-v31-methods"><span class="finance-v31-method active">MPESA Paybill</span><span class="finance-v31-method">Till Number</span><span class="finance-v31-method">Bank Account</span><span class="finance-v31-method">Card Provider</span></div><label>Business Shortcode / Paybill / Till</label><input id="finance-paybill" class="finance-v31-input" value="${esc(s.paybill||s.businessShortcode||s.shortcode||s.till||'')}" placeholder="e.g. 222222"><label>Account Reference Format</label><select id="finance-reference" class="finance-v31-select"><option value="admissionNumber" ${ref==='admissionNumber'?'selected':''}>Student Admission Number</option><option value="studentId" ${ref==='studentId'?'selected':''}>Student ID</option><option value="custom" ${ref==='custom'?'selected':''}>Custom Reference</option></select><div class="finance-v31-notice">Real fee completion must come from Daraja callback confirmation, not from the browser.</div></div><div class="finance-v31-form-card"><h3>Bank Details</h3><input id="finance-bank-name" class="finance-v31-input" placeholder="Bank Name" value="${esc(b.bankName||s.bankName||'')}"><input id="finance-account-name" class="finance-v31-input" placeholder="Account Name" value="${esc(b.accountName||s.accountName||'')}"><input id="finance-account-number" class="finance-v31-input" placeholder="Account Number" value="${esc(b.accountNumber||s.bankAccount||s.accountNumber||'')}"><input id="finance-branch" class="finance-v31-input" placeholder="Branch" value="${esc(b.branch||s.branch||'')}"></div><div class="finance-v31-total-box"><strong>Important</strong><p style="color:var(--ff-muted)">Parents pay school fees to the school. Shule AI tracks and verifies payments. Platform subscriptions remain separate from school fee collection.</p><button class="finance-v31-btn blue" onclick="financeV31TestConnection()">Test Connection</button></div></div></div>`;
  }

  function renderRecords(){
    const rows=state.payments||[];
    return `<div class="finance-v31-body"><div id="finance-v31-message" class="finance-v31-message"></div><div class="finance-v31-toolbar"><div><h2 style="margin:0;font-size:22px;font-weight:900">Payment Records</h2><p style="margin:4px 0 0;color:var(--ff-muted)">Track fee accounts, balances, and reconciliation status.</p></div><button class="finance-v31-btn primary" onclick="financeV31ExportRecords()">Export CSV</button></div><input id="finance-v31-record-search" oninput="financeV31RenderRecordsOnly()" class="finance-v31-input" style="width:100%;margin-bottom:14px" placeholder="Search by student, admission number, or transaction code"><div id="finance-v31-record-table">${recordsTable(rows)}</div></div>`;
  }
  function recordsTable(rows){
    const q = String(document.getElementById('finance-v31-record-search')?.value || '').toLowerCase();
    const filtered = (rows || []).filter(r => !q || JSON.stringify(r).toLowerCase().includes(q));
    return `<div class="finance-v31-table-wrap"><table class="finance-v31-table"><thead><tr><th>Student</th><th>Class</th><th>Term</th><th>Total</th><th>Paid</th><th>Balance</th><th>Status</th><th>Actions</th></tr></thead><tbody>${filtered.length?filtered.map(r=>`<tr><td>${esc(r.studentName||r.Student?.User?.name||r.Student?.name||r.studentId||'Student')}</td><td>${esc(r.className||r.classGrade||r.Student?.className||'—')}</td><td>${esc(r.term||'—')}</td><td>${money(r.totalAmount)}</td><td>${money(r.paidAmount)}</td><td>${money(r.balance ?? Math.max(0,Number(r.totalAmount||0)-Number(r.paidAmount||0)))}</td><td><span class="finance-v31-badge ${esc(String(r.status||'unpaid').toLowerCase())}">${esc(r.status||'Unpaid')}</span></td><td><button class="finance-v31-btn" onclick="financeV31ViewRecord('${esc(r.id||'')}')">View</button></td></tr>`).join(''):'<tr><td colspan="8"><div class="finance-v31-empty">No payment records found.</div></td></tr>'}</tbody></table></div>`;
  }

  function body(){ if(state.tab==='settings') return renderSettings(); if(state.tab==='records') return renderRecords(); return renderStructures(); }
  async function render(){ const root=document.getElementById('dashboard-content'); if(!root) return; root.innerHTML='<div class="finance-v31"><div class="finance-v31-empty">Loading Finance & Fees...</div></div>'; await loadAll(); root.innerHTML=`<section class="finance-v31"><div class="finance-v31-header"><div class="finance-v31-title"><h1>Finance & Fees</h1><p>Manage fee structures, payment settings, and all school payment records.</p></div><div class="finance-v31-actions"><button class="finance-v31-btn" onclick="financeV31Refresh()">Refresh</button><button class="finance-v31-btn primary" onclick="financeV31OpenStructureModal()">+ Create Fee Structure</button></div></div>${renderSummary()}<div class="finance-v31-shell">${renderTabs()}<div id="finance-v31-tab-body">${body()}</div></div></section>`; }

  w.financeV31Refresh = render;
  w.financeV31SetTab = function(tab){ state.tab=tab; const el=document.getElementById('finance-v31-tab-body'); if(el) el.innerHTML=body(); document.querySelectorAll('.finance-v31-tab').forEach(x=>x.classList.toggle('active', x.getAttribute('onclick')?.includes(tab))); };
  w.financeV31ApplyFilter = function(){ state.filters.className=document.getElementById('finance-v31-class-filter')?.value||''; state.filters.term=document.getElementById('finance-v31-term-filter')?.value||''; state.filters.year=document.getElementById('finance-v31-year-filter')?.value||''; const el=document.getElementById('finance-v31-tab-body'); if(el) el.innerHTML=renderStructures(); };
  w.financeV31OpenStructureModal = function(id){ const s=(state.structures||[]).find(x=>String(x.id)===String(id))||{}; const classOptions=state.classes.map(c=>`<option value="${esc(c.id||c.name)}" ${String(s.classId||'')===String(c.id)?'selected':''}>${esc(getClassName(c))}</option>`).join(''); document.body.insertAdjacentHTML('beforeend',`<div class="finance-v31 finance-v31-modal"><div class="finance-v31-modal-inner"><div class="finance-v31-modal-head"><div><strong>${id?'Edit':'Create'} Fee Structure</strong><p style="margin:4px 0 0;color:var(--ff-muted)">Class-based fee setup</p></div><button class="finance-v31-close" onclick="this.closest('.finance-v31-modal').remove()">×</button></div><div class="finance-v31-modal-body"><div id="finance-v31-modal-message" class="finance-v31-message"></div><div class="finance-v31-form-grid"><div class="finance-v31-form-card"><div class="finance-v31-form-row"><input id="ff-name" class="finance-v31-input" placeholder="Structure name" value="${esc(s.name||'')}"><select id="ff-class" class="finance-v31-select"><option value="">Select class</option>${classOptions}</select><select id="ff-term" class="finance-v31-select"><option ${s.term==='Term 1'?'selected':''}>Term 1</option><option ${s.term==='Term 2'?'selected':''}>Term 2</option><option ${s.term==='Term 3'?'selected':''}>Term 3</option></select></div><div class="finance-v31-form-row"><input id="ff-year" class="finance-v31-input" type="number" value="${esc(s.year||new Date().getFullYear())}"><select id="ff-curriculum" class="finance-v31-select"><option ${s.curriculum==='CBC'?'selected':''}>CBC</option><option ${s.curriculum==='CBE'?'selected':''}>CBE</option><option ${s.curriculum==='8-4-4'?'selected':''}>8-4-4</option></select><input id="ff-due" class="finance-v31-input" type="date" value="${esc((s.dueDate||'').slice(0,10))}"></div><h3>Fee Items</h3><div id="ff-items"></div><button class="finance-v31-btn" onclick="financeV31AddFeeItem()">+ Add Item</button></div><div class="finance-v31-total-box"><strong>Calculated Total</strong><h2 id="ff-total">KES 0</h2><p style="color:var(--ff-muted)">Required items are included in the total fee assigned to students.</p><button class="finance-v31-btn" onclick="this.closest('.finance-v31-modal').remove()">Cancel</button> <button class="finance-v31-btn primary" onclick="financeV31SaveStructure('${esc(id||'')}')">Save Fee Structure</button></div></div></div></div></div>`); const items=Array.isArray(s.items)?s.items:Array.isArray(s.feeItems)?s.feeItems:[{name:'Tuition',amount:''},{name:'Lunch',amount:''},{name:'Transport',amount:''}]; items.forEach(i=>financeV31AddFeeItem(i)); financeV31RecalcTotal(); };
  w.financeV31AddFeeItem = function(item={}){ const box=document.getElementById('ff-items'); if(!box)return; box.insertAdjacentHTML('beforeend',`<div class="finance-v31-fee-item"><input class="finance-v31-input ff-item-name" placeholder="Item name" value="${esc(item.name||item.itemName||'')}"><input class="finance-v31-input ff-item-amount" type="number" placeholder="Amount" value="${esc(item.amount||'')}" oninput="financeV31RecalcTotal()"><select class="finance-v31-select ff-item-type"><option value="required" ${item.required===false?'':'selected'}>Required</option><option value="optional" ${item.required===false?'selected':''}>Optional</option></select><button class="finance-v31-btn danger" onclick="this.closest('.finance-v31-fee-item').remove();financeV31RecalcTotal()">Remove</button></div>`); };
  w.financeV31RecalcTotal = function(){ let total=0; document.querySelectorAll('.finance-v31-fee-item').forEach(r=>{ const type=r.querySelector('.ff-item-type')?.value; if(type!=='optional') total+=Number(r.querySelector('.ff-item-amount')?.value||0); }); const el=document.getElementById('ff-total'); if(el)el.textContent=money(total); };
  w.financeV31SaveStructure = async function(id){ const rows=[...document.querySelectorAll('.finance-v31-fee-item')]; const items=rows.map(r=>({name:r.querySelector('.ff-item-name')?.value?.trim(), amount:Number(r.querySelector('.ff-item-amount')?.value||0), required:r.querySelector('.ff-item-type')?.value!=='optional'})).filter(i=>i.name&&i.amount>0); const classSelect=document.getElementById('ff-class'); const selectedClass=state.classes.find(c=>String(c.id)===String(classSelect?.value)); const data={ name:document.getElementById('ff-name')?.value?.trim(), classId:classSelect?.value || null, className:selectedClass ? getClassName(selectedClass) : '', gradeLevel:selectedClass ? getClassName(selectedClass) : '', term:document.getElementById('ff-term')?.value, year:Number(document.getElementById('ff-year')?.value), curriculum:document.getElementById('ff-curriculum')?.value, dueDate:document.getElementById('ff-due')?.value || null, items, feeItems:items, totalAmount:items.filter(i=>i.required!==false).reduce((s,i)=>s+i.amount,0) }; if(!data.name||!data.classId||!items.length){ const m=document.getElementById('finance-v31-modal-message'); if(m){m.className='finance-v31-message show error';m.textContent='Please select class, name the structure, and add fee items with amounts.';} return; } try{ if(id) await apiSafe().feeStructures.update(id,data); else await apiSafe().feeStructures.create(data); document.querySelector('.finance-v31-modal')?.remove(); await render(); }catch(e){ const m=document.getElementById('finance-v31-modal-message'); if(m){m.className='finance-v31-message show error';m.textContent=e.message||'Could not save fee structure.';} } };
  w.financeV31Activate = async function(id){ clearMessage(); try{ await apiSafe().feeStructures.activate(id); setMessage('success','Fee structure activated. You can now assign it to students.'); await render(); }catch(e){ setMessage('error',e.message||'Could not activate fee structure.'); } };
  w.financeV31Assign = async function(id){ clearMessage(); try{ await apiSafe().feeStructures.assign(id,{ overwrite:false }); setMessage('success','Fee structure assigned to eligible students.'); await Promise.all([loadStructures(), loadPayments()]); const el=document.getElementById('finance-v31-tab-body'); if(el) el.innerHTML=renderStructures(); }catch(e){ setMessage('error',e.message||'Assignment failed.'); } };
  w.financeV31Lock = async function(id){ clearMessage(); if(!confirm('Lock this fee structure? Locked structures cannot be silently edited.'))return; try{ await apiSafe().feeStructures.lock(id); setMessage('success','Fee structure locked.'); await render(); }catch(e){ setMessage('error',e.message||'Could not lock fee structure.'); } };
  w.financeV31SavePaymentSettings = async function(){ clearMessage(); const data={ paybill:document.getElementById('finance-paybill')?.value, businessShortcode:document.getElementById('finance-paybill')?.value, referenceFormat:document.getElementById('finance-reference')?.value, bankName:document.getElementById('finance-bank-name')?.value, accountName:document.getElementById('finance-account-name')?.value, bankAccount:document.getElementById('finance-account-number')?.value, accountNumber:document.getElementById('finance-account-number')?.value, branch:document.getElementById('finance-branch')?.value, bankDetails:{ bankName:document.getElementById('finance-bank-name')?.value, accountName:document.getElementById('finance-account-name')?.value, accountNumber:document.getElementById('finance-account-number')?.value, branch:document.getElementById('finance-branch')?.value } }; try{ await apiSafe().payments.updateSchoolSettings(data); setMessage('success','Payment settings saved.'); await loadSettings(); }catch(e){ setMessage('error',e.message||'Could not save payment settings.'); } };
  w.financeV31TestConnection = async function(){ clearMessage(); try{ const res = await (apiSafe().payments?.testSchoolConnection ? apiSafe().payments.testSchoolConnection() : apiRequest('/api/payments/admin/test-connection',{method:'POST'})); setMessage('success', res?.message || 'Daraja connection verified successfully.'); }catch(e){ setMessage('error', e.message || 'Daraja connection test failed.'); } };
  w.financeV31RenderRecordsOnly = function(){ const el=document.getElementById('finance-v31-record-table'); if(el) el.innerHTML = recordsTable(state.payments || []); };
  w.financeV31ViewRecord = function(id){ const r=(state.payments||[]).find(x=>String(x.id)===String(id)); if(!r) return; alert(`Student: ${r.studentName||r.Student?.User?.name||'Student'}\nTotal: ${money(r.totalAmount)}\nPaid: ${money(r.paidAmount)}\nBalance: ${money(r.balance ?? Math.max(0,Number(r.totalAmount||0)-Number(r.paidAmount||0)))}\nStatus: ${r.status||'Unpaid'}`); };
  w.financeV31ExportRecords = function(){
    clearMessage();
    const rows = state.payments || [];
    if(!rows.length){ setMessage('error','No payment records available to export.'); return; }
    const headers = ['Student','Class','Term','Year','Total','Paid','Balance','Status'];
    const csvRows = [headers, ...rows.map(r=>[
      r.studentName||r.Student?.User?.name||r.Student?.name||r.studentId||'Student',
      r.className||r.classGrade||r.Student?.className||'',
      r.term||'', r.year||'',
      Number(r.totalAmount||0), Number(r.paidAmount||0), Number(r.balance ?? Math.max(0,Number(r.totalAmount||0)-Number(r.paidAmount||0))), r.status||'unpaid'
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
