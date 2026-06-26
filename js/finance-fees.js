// Shule AI Finance & Fees — complete module
// Handles fee structures, school payment settings, and fee account records.
(function(){
  const w = window;
  const money = (n) => 'KES ' + Number(n || 0).toLocaleString();
  const esc = (v) => String(v ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const FINANCE_PERMS={overview:'Overview',fee_structures:'Fee Structures',invoices:'Student Fee Accounts & Invoices',payments:'Payments & Receipts',verification:'Verification & Reconciliation',balances:'Balances, Defaulters & Bursaries',expenses:'Expenses',alerts:'Alerts',analytics:'Analytics',reports:'Reports',settings:'Settings',audit:'Audit Trail'};
  const state={tab:'overview',structures:[],classes:[],students:[],financeStaff:[],settings:{},providerSettings:null,accounts:[],paymentRecords:[],manualQueue:[],overview:null,expenses:[],financeAlerts:[],invoices:[],financeAnalytics:null,auditTrail:[],paymentLoadError:'',loading:false,filters:{className:'',term:'',year:String(new Date().getFullYear())}};
  function currentUser(){ try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch(_) { return {}; } }
  function currentRole(){ return String(currentUser().role || localStorage.getItem('role') || '').toLowerCase().replace('-', '_'); }
  function isAdminFinanceRole(){ const r=currentRole(); return r==='admin' || r==='finance_officer' || r==='super_admin' || r==='superadmin'; }
  function canManageFinanceStaff(){return currentRole()==='admin'||currentRole()==='super_admin'||currentRole()==='superadmin';}function isSchoolAdminView(){return currentRole()==='admin';}function isFinanceStaffView(){return currentRole()==='finance_officer';}function financeStaffTitle(){const u=currentUser();return u?.financeTitle||u?.preferences?.finance?.title||state?.overview?.permissions?.financeTitle||'Finance Officer';}function normalizedFinanceTitle(){return String(financeStaffTitle()||'').trim().toLowerCase();}function financeAllowed(p){const u=currentUser(),c=u?.financePermissions||u?.preferences?.finance?.permissions||[];if(!isFinanceStaffView())return true;if(normalizedFinanceTitle()==='bursar'&&['settings','analytics'].includes(p))return true;return!Array.isArray(c)||!c.length||c.includes(p);}const FINANCE_ROLE_PRESETS={"Finance Officer":['overview','fee_structures','invoices','payments','verification','balances','expenses','alerts','analytics','reports','settings','audit'],Bursar:['overview','fee_structures','invoices','payments','verification','balances','reports','settings','analytics','alerts'],Accountant:['overview','payments','verification','expenses','analytics','reports','audit']};
  function blockNonAdminFinance(){ if(isAdminFinanceRole()) return false; console.warn('[Finance & Fees] Blocked admin finance render/refresh for role:', currentRole() || 'unknown'); return true; }

  function apiSafe(){ return w.api || {}; }
  async function call(fn, fallback){ try { const res = await fn(); return res?.data ?? res ?? fallback; } catch(e){ if(e?.message !== 'Forbidden') console.error('[Finance & Fees]', e); return fallback; } }
  function schoolSettings(){ return state.settings?.paymentSettings || state.settings || {}; }
  function bankSettings(){ return state.settings?.bankDetails || state.settings?.bank || {}; }

  const PAYMENT_AGENT_DEFS = [
    { provider:'daraja', label:'M-Pesa Daraja STK', description:'School fee STK prompts using the school shortcode.', fields:[['environment','Environment / Mode','sandbox or production'],['consumerKey','Consumer Key',''],['consumerSecret','Consumer Secret','',true],['passkey','Passkey','',true],['shortcode','Shortcode',''],['callbackUrl','Callback URL','']] },
    { provider:'pesapal', label:'Pesapal', description:'Pesapal checkout for school fee payments.', fields:[['consumerKey','Consumer Key',''],['consumerSecret','Consumer Secret','',true],['ipnId','IPN ID',''],['callbackUrl','Callback URL',''],['checkoutUrl','Checkout URL / test link','']] },
    { provider:'paystack', label:'Paystack', description:'Paystack checkout for card, bank and mobile money where available.', fields:[['publicKey','Public Key',''],['secretKey','Secret Key','',true],['callbackUrl','Callback URL',''],['returnUrl','Return URL','']] },
    { provider:'flutterwave', label:'Flutterwave', description:'Flutterwave checkout for card, bank and mobile money where available.', fields:[['publicKey','Public Key',''],['secretKey','Secret Key','',true],['encryptionKey','Encryption Key','',true],['callbackUrl','Callback URL',''],['returnUrl','Return URL','']] },
    { provider:'stripe', label:'Stripe', description:'Stripe checkout for card payments.', fields:[['publicKey','Publishable Key',''],['secretKey','Secret Key','',true],['webhookSecret','Webhook Secret','',true],['successUrl','Success URL',''],['cancelUrl','Cancel URL','']] }
  ];
  function paymentAgentConfig(provider){ return state.providerSettings?.providers?.[provider] || {}; }
  function renderPaymentAgentFields(provider, fields){ const cfg=paymentAgentConfig(provider); return fields.map(([name,label,placeholder,secret])=>`<label>${esc(label)}<input ${secret?'type="password" autocomplete="off"':''} data-provider-field="${esc(name)}" class="finance-v31-input" placeholder="${secret?'Leave blank to keep existing':esc(placeholder||'')}" value="${secret?'':esc(cfg[name]||'')}"></label>`).join(''); }
  function renderSchoolPaymentAgents(){ const settings=state.providerSettings||{},enabled=new Set(settings.enabledProviders||[]),def=settings.defaultProvider||'manual'; return `<div class="finance-v31-form-card spacious"><h3>5. Payment Agents / Provider Keys</h3><p style="margin-top:-6px;color:var(--ff-muted);font-size:13px">These are the school-owned payment providers parents can use for school fees. Private keys are encrypted on save and never shown to parents.</p><div class="finance-v31-settings-stack">${PAYMENT_AGENT_DEFS.map(agent=>`<div class="rounded-xl border bg-card p-4" data-school-provider="${agent.provider}"><div class="flex flex-col gap-2 md:flex-row md:items-start md:justify-between"><div><strong>${esc(agent.label)}</strong><p class="text-sm text-muted-foreground">${esc(agent.description)}</p></div><div class="flex flex-wrap gap-3 text-sm"><label class="finance-v31-check"><input type="checkbox" data-provider-enabled ${enabled.has(agent.provider)?'checked':''}> Enabled</label><label class="finance-v31-check"><input type="radio" name="school-default-provider" data-provider-default ${def===agent.provider?'checked':''}> Default</label></div></div><div class="finance-v31-form-row mt-3">${renderPaymentAgentFields(agent.provider, agent.fields)}</div><div class="mt-3 flex justify-end"><button type="button" class="finance-v31-btn primary" onclick="financeV31SaveProviderAgent('${agent.provider}')">Save ${esc(agent.label)}</button></div></div>`).join('')}</div></div>`; }
  function getClassName(c){ return c?.name || c?.grade || c?.className || c?.level || 'Class'; }
  function getStructureClassName(s){ const assigned=Array.isArray(s?.assignedClasses)?s.assignedClasses:[]; if(assigned.length) return assigned.map(c=>c.name||c.grade||c.id).filter(Boolean).join(', '); return s?.className || s?.classGrade || s?.gradeLevel || s?.Class?.name || 'Class'; }
  function normalizedStatus(s){ return String(s?.status || 'draft').trim().toLowerCase(); }
  function classKeyFromName(name){ return String(name || '').trim(); }
  function accountStudentName(a){ return a.Student?.User?.name || a.Student?.name || a.studentName || 'Student'; }
  function accountClassName(a){ return a.Student?.className || a.Student?.grade || a.Student?.Class?.name || a.className || a.metadata?.className || 'Unassigned'; }
  function recordClassName(r){ return r.Student?.className || r.Student?.grade || r.Student?.Class?.name || r.className || r.metadata?.className || 'Unassigned'; }
  function recordStudentName(r){ return r.Student?.User?.name || r.Student?.name || r.studentName || r.studentId || 'Student'; }
  function recordElimuId(r){ return r.metadata?.studentElimuid || r.metadata?.elimuId || r.accountReference || r.Student?.elimuid || r.Student?.elimuId || r.Student?.admissionNumber || '—'; }
  function visibleClasses(){
    const byKey = new Map();
    (state.classes || []).filter(c => c && c.isActive !== false).forEach(c => {
      const name = String(getClassName(c) || '').trim();
      if (!name) return;
      const key = name.toLocaleLowerCase();
      if (!byKey.has(key)) byKey.set(key, name);
    });
    return [...byKey.values()].sort((a,b)=>String(a).localeCompare(String(b), undefined, {numeric:true,sensitivity:'base'}));
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

  function studentClassName(s){ return s?.className || s?.Class?.name || s?.grade || s?.class || s?.stream || 'Unassigned'; }
  function studentDisplayName(s){ return s?.User?.name || s?.name || s?.fullName || `Student ${s?.id || ''}`.trim(); }
  function accountForStudent(studentId){ return (state.accounts||[]).find(a => String(a.studentId) === String(studentId)); }
  function classStudentBalanceRows(className){
    const rows = [];
    const seen = new Set();
    (state.accounts||[]).forEach(a => {
      if (className && accountClassName(a) !== className) return;
      rows.push(a); seen.add(String(a.studentId));
    });
    (state.students||[]).forEach(st => {
      if (className && studentClassName(st) !== className) return;
      if (seen.has(String(st.id))) return;
      rows.push({
        studentId: st.id,
        studentName: studentDisplayName(st),
        className: studentClassName(st),
        term: '—', year: '', totalAmount: 0, parentPaidAmount: 0, creditAmount: 0, balance: 0,
        __missingFeeAccount: true
      });
    });
    return rows;
  }


  async function loadFinanceContext(){
    const api = apiSafe();
    if (currentRole()==='finance_officer') {
      const ctx = await call(() => api.payments?.getFinanceContext ? api.payments.getFinanceContext() : apiRequest('/api/payments/admin/context'), {});
      state.classes = Array.isArray(ctx.classes) ? ctx.classes : [];
      state.students = Array.isArray(ctx.students) ? ctx.students : [];
      return;
    }
    const [classesRes, studentsRes] = await Promise.all([
      call(() => api.admin?.getClasses ? api.admin.getClasses() : apiRequest('/api/admin/classes'), []),
      call(() => api.admin?.getStudents ? api.admin.getStudents() : apiRequest('/api/admin/students'), [])
    ]);
    state.classes = Array.isArray(classesRes) ? classesRes : (classesRes.classes || classesRes.items || classesRes.data || []);
    state.students = Array.isArray(studentsRes) ? studentsRes : (studentsRes.students || studentsRes.items || studentsRes.data || []);
  }
  async function loadFinanceStaff(){
    if(!canManageFinanceStaff()){ state.financeStaff=[]; return; }
    const rows = await call(() => apiSafe().admin?.getFinanceStaff ? apiSafe().admin.getFinanceStaff() : [], []);
    state.financeStaff = Array.isArray(rows) ? rows : (rows.data || rows.items || []);
  }
  async function loadStructures(){
    const api = apiSafe();
    const res = await call(() => api.feeStructures?.list ? api.feeStructures.list({}) : apiRequest('/api/fee-structures'), []);
    state.structures = Array.isArray(res) ? res : (res.structures || res.items || res.data || []);
  }
  async function loadSettings(){
    const api = apiSafe();
    const [settings, providers] = await Promise.all([
      call(() => api.payments?.getSchoolSettings ? api.payments.getSchoolSettings() : apiRequest('/api/payments/admin/school-settings'), {}),
      call(() => api.payments?.getSchoolProviders ? api.payments.getSchoolProviders() : apiRequest('/api/payments/admin/providers'), null)
    ]);
    state.settings = settings || {};
    state.providerSettings = providers || null;
  }
  async function loadPayments(){
    const api = apiSafe();
    const accountsRes = await call(() => api.feeStructures?.studentAccounts ? api.feeStructures.studentAccounts({}) : apiRequest('/api/fee-structures/student-accounts'), []);
    state.accounts = Array.isArray(accountsRes) ? accountsRes : (accountsRes.accounts || accountsRes.items || accountsRes.data || []);
    try {
      const recordsRes = await (api.payments?.getAdminRecords ? api.payments.getAdminRecords({ page: 1, limit: 100 }) : apiRequest('/api/payments/admin/records?page=1&limit=100'));
      const payload = recordsRes?.data ?? recordsRes ?? {};
      const records = Array.isArray(payload) ? payload : (payload.records || payload.items || payload.data || []);
      state.paymentRecords = Array.isArray(records) ? records : [];
      state.paymentLoadError = '';
    } catch (error) {
      state.paymentLoadError = error?.message || 'Payment records could not be loaded.';
      console.error('[Finance & Fees] Payment records retained after load failure:', error);
      // Keep the last successful records instead of presenting a false empty ledger.
    }
  }
  async function loadManualQueue(){ const api = apiSafe(); state.manualQueue = await call(() => api.payments?.getManualQueue ? api.payments.getManualQueue() : apiRequest('/api/payments/admin/manual-queue'), []); }
  async function loadOverview(){const params={};if(state.filters.year)params.year=state.filters.year;if(state.filters.term)params.term=state.filters.term;state.overview=await call(()=>apiSafe().finance.getOverview(params),null);}
  async function loadExpenses(){state.expenses=isFinanceStaffView()&&financeAllowed('expenses')?await call(()=>apiSafe().finance.getExpenses(),[]):[];}
  async function loadInvoices(){state.invoices=isFinanceStaffView()&&financeAllowed('invoices')?((await call(()=>apiSafe().finance.getInvoices({...state.filters.year?{year:state.filters.year}:{},...state.filters.term?{term:state.filters.term}:{}}),{}))?.invoices||[]):[];}
  async function loadFinanceAnalytics(){state.financeAnalytics=isFinanceStaffView()&&financeAllowed('analytics')?await call(()=>apiSafe().finance.getAnalytics({...state.filters.year?{year:state.filters.year}:{},...state.filters.term?{term:state.filters.term}:{}}),null):null;}
  async function loadAuditTrail(){state.auditTrail=isFinanceStaffView()&&financeAllowed('audit')?await call(()=>apiSafe().finance.getAuditTrail({limit:200}),[]):[];}
  async function loadFinanceAlerts(){state.financeAlerts=isFinanceStaffView()&&financeAllowed('alerts')?await call(()=>apiSafe().finance.getAlerts(250),[]):[];}
  async function loadAll(){if(blockNonAdminFinance()){state.loading=false;return;}state.loading=true;if(isSchoolAdminView())await Promise.all([loadOverview(),loadFinanceStaff()]);else{const jobs=[loadOverview()];if(['fee_structures','payments','verification','balances'].some(financeAllowed))jobs.push(loadFinanceContext());if(financeAllowed('fee_structures'))jobs.push(loadStructures());if(financeAllowed('settings'))jobs.push(loadSettings());if(financeAllowed('payments')||financeAllowed('verification')||financeAllowed('balances'))jobs.push(loadPayments());if(financeAllowed('verification'))jobs.push(loadManualQueue());if(financeAllowed('invoices'))jobs.push(loadInvoices());if(financeAllowed('expenses'))jobs.push(loadExpenses());if(financeAllowed('analytics'))jobs.push(loadFinanceAnalytics());if(financeAllowed('audit'))jobs.push(loadAuditTrail());if(financeAllowed('alerts'))jobs.push(loadFinanceAlerts());await Promise.all(jobs);}state.loading=false;}

  function totals(){if(state.overview?.totals){const t=state.overview.totals;return{expected:Number(t.expected||0),paid:Number(t.paid||0),parentPaid:Number(t.paid||0),credits:Number(t.credits||0),outstanding:Number(t.outstanding||0),active:Number(state.structures.length||0),defaulterCount:Number(t.defaulterCount||0),pendingVerification:Number(t.pendingVerification||0),totalExpenses:Number(t.totalExpenses||0),netCollected:Number(t.netCollected||0)};}
    const structures = state.structures || [];
    const accounts = state.accounts || [];
    const expected = accounts.length ? accounts.reduce((s,x)=>s+Number(x.totalAmount || x.total || 0),0) : structures.reduce((s,x)=>s+Number(x.totalAmount || x.total || 0),0);
    const parentPaid = accounts.reduce((s,x)=>s+Number(x.parentPaidAmount ?? x.paidAmount ?? x.paid ?? 0),0);
    const credits = accounts.reduce((s,x)=>s+Number(x.creditAmount || 0),0);
    const accountPaid = parentPaid + credits;
    const recordPaid = (state.paymentRecords||[]).filter(r=>['completed','success','paid'].includes(String(r.status||'').toLowerCase())).reduce((s,r)=>s+Number(r.amount||0),0);
    const paid = accountPaid || recordPaid;
    const balances = accounts.reduce((s,x)=>s+Number(x.balance ?? Math.max(0, Number(x.totalAmount||0)-Number(x.paidAmount||0))),0);
    return { expected, paid, parentPaid, credits, outstanding: balances || Math.max(0, expected-paid), active: structures.filter(x=>['active','locked'].includes(normalizedStatus(x))).length };
  }

  function setMessage(type,msg){ const el=document.getElementById('finance-v31-message'); if(!el)return; el.className='finance-v31-message show '+type; el.textContent=msg; }
  function clearMessage(){ const el=document.getElementById('finance-v31-message'); if(el){el.className='finance-v31-message';el.textContent='';} }


  function renderBodyOnly(){
    const root = document.querySelector('.finance-v31');
    const bodyEl = document.getElementById('finance-v31-tab-body');
    const summaryEl = document.getElementById('finance-v31-summary-wrap');
    if (summaryEl) summaryEl.innerHTML = renderSummary();
    if (bodyEl) bodyEl.innerHTML = body();
    else if (root) root.innerHTML = `<div id="finance-v31-summary-wrap">${renderSummary()}</div>${renderTabs()}<div id="finance-v31-tab-body">${body()}</div>`;
  }

  function renderSummary(){ const t=totals(); return `<div class="finance-v31-summary">
    <div class="finance-v31-metric"><div><strong style="color:var(--ff-green)">Total Expected Fees</strong><h3>${money(t.expected)}</h3><small>This term</small></div><div class="finance-v31-icon green">₭</div></div>
    <div class="finance-v31-metric"><div><strong style="color:var(--ff-blue)">Total Paid</strong><h3>${money(t.paid || 0)}</h3><small>Credits/Bursaries: ${money(t.credits || 0)}</small></div><div class="finance-v31-icon blue">↓</div></div>
    <div class="finance-v31-metric"><div><strong style="color:var(--ff-orange)">Outstanding Balance</strong><h3>${money(t.outstanding)}</h3><small>Remaining</small></div><div class="finance-v31-icon orange">!</div></div>
    <div class="finance-v31-metric"><div><strong style="color:var(--ff-purple)">Defaulters</strong><h3>${t.defaulterCount || 0}</h3><small>${t.pendingVerification || 0} verification pending</small></div><div class="finance-v31-icon purple">▣</div></div>
  </div>`; }

  function renderTabs(){if(isSchoolAdminView())return`<div class="finance-v31-tabs"><div class="finance-v31-tab ${state.tab==='overview'?'active':''}" onclick="financeV31SetTab('overview')">⌂ Finance Overview</div><div class="finance-v31-tab ${state.tab==='team'?'active':''}" onclick="financeV31SetTab('team')">👥 Finance Team</div></div>`;const tab=(perm,key,label)=>financeAllowed(perm)?`<div class="finance-v31-tab ${state.tab===key?'active':''}" onclick="financeV31SetTab('${key}')">${label}</div>`:'';return`<div class="finance-v31-tabs">${tab('overview','overview','⌂ Overview')}${tab('fee_structures','structures','▦ Fee Structures')}${tab('invoices','invoices','▧ Invoices')}${tab('payments','records','▥ Payments & Receipts')}${tab('balances','balances','◫ Balances & Bursaries')}${tab('verification','verification','✓ Verification & Reconciliation')}${tab('expenses','expenses','↗ Expenses')}${tab('alerts','finance-alerts','🔔 Alerts')}${tab('analytics','finance-analytics','◈ Analytics')}${tab('reports','reports','▤ Reports')}${tab('settings','settings','⚙ Settings')}${tab('audit','audit','🧾 Audit Trail')}</div>`;}

  function structureItems(s){
    const items = Array.isArray(s.items) ? s.items : Array.isArray(s.feeItems) ? s.feeItems : [];
    if(!items.length) return '<div class="finance-v31-item-row"><span>No fee items configured</span><span></span></div>';
    return items.map(i=>`<div class="finance-v31-item-row"><span>${esc(i.name || i.itemName || i.label)}</span><span>${money(i.amount)}</span></div>`).join('');
  }
  function groupedStructures(){
    const map = new Map();
    (state.structures || []).forEach(s=>{
      const key = String(s.groupKey || [s.schoolCode, s.name, s.term, s.year, s.curriculum || 'CBC'].join(':')).toLowerCase();
      const existing = map.get(key);
      if(!existing){
        map.set(key, {...s, classIds:[...(Array.isArray(s.classIds)?s.classIds:[]), s.classId].filter(Boolean), assignedClasses:Array.isArray(s.assignedClasses)?[...s.assignedClasses]:[]});
        return;
      }
      existing.classIds = [...new Set([...(existing.classIds||[]), ...(Array.isArray(s.classIds)?s.classIds:[]), s.classId].filter(Boolean).map(String))];
      const allClasses = [...(existing.assignedClasses||[]), ...(Array.isArray(s.assignedClasses)?s.assignedClasses:[])];
      const classMap = new Map();
      allClasses.forEach(c=>{ const k=String(c.id||c.name||c.grade||''); if(k) classMap.set(k,c); });
      existing.assignedClasses = [...classMap.values()];
      existing.studentsAssigned = Math.max(Number(existing.studentsAssigned||0), Number(s.studentsAssigned||0));
    });
    return [...map.values()];
  }

  function filteredStructures(){
    return groupedStructures().filter(s=>{
      const className = getStructureClassName(s);
      if(state.filters.className && !String(className).split(',').map(x=>x.trim()).includes(state.filters.className)) return false;
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
      : `<button class="finance-v31-btn blue" onclick="financeV31Assign('${id}')">Generate/Update Accounts</button>`;
    const lock = status === 'locked'
      ? `<button class="finance-v31-btn muted" disabled>Locked</button>`
      : `<button class="finance-v31-btn danger" onclick="financeV31Lock('${id}')">Lock</button>`;
    return `<button class="finance-v31-btn" onclick="financeV31ViewStructure('${id}')">View Classes</button><button class="finance-v31-btn" onclick="financeV31OpenStructureModal('${id}')">Edit</button>${main}${lock}<button class="finance-v31-btn danger" onclick="financeV31DeleteStructure('${id}')">Delete/Archive</button>`;
  }
  function renderStructures(){
    const structures = filteredStructures();
    const year = new Date().getFullYear();
    const cardHtml = structures.length ? structures.map(s=>{
      const assigned = Array.isArray(s.assignedClasses) ? s.assignedClasses : [];
      const classNames = assigned.length ? assigned.map(c=>c.name||c.grade||c.id).filter(Boolean) : getStructureClassName(s).split(',').map(x=>x.trim()).filter(Boolean);
      const visible = classNames.slice(0,4).map(c=>`<span class="finance-v31-chip">${esc(c)}</span>`).join('');
      const more = classNames.length > 4 ? `<span class="finance-v31-chip muted">+${classNames.length-4} more</span>` : '';
      return `<div class="finance-v31-card grouped"><div class="finance-v31-card-head"><div><h3>${esc(s.name || `${getStructureClassName(s)} — ${s.term}`)}</h3><p>${esc(s.term || 'Term')} ${esc(String(s.year || ''))} • ${esc(s.curriculum || 'CBC')}</p></div><span class="finance-v31-badge ${normalizedStatus(s)}">${esc(s.status || 'draft')}</span></div><div class="finance-v31-class-list">${visible}${more || ''}</div><div class="finance-v31-items">${structureItems(s)}</div><div class="finance-v31-card-foot"><strong>${money(s.totalAmount || 0)}</strong><small>${Number(s.studentsAssigned||0).toLocaleString()} students assigned • ${classNames.length || 1} class${(classNames.length||1)===1?'':'es'}</small></div><div class="finance-v31-actions-row">${actionButtons(s)}</div></div>`;
    }).join('') : '<div class="finance-v31-empty">No fee structures yet. Create one grouped structure and assign it to one or more classes.</div>';
    const paymentErrorBanner = state.paymentLoadError ? `<div class="rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/30 p-4 text-sm text-amber-900 dark:text-amber-100"><strong>Payment history is temporarily unavailable.</strong><p class="mt-1">${esc(state.paymentLoadError)} Existing balances remain visible; no records were deleted.</p></div>` : '';
    return `<div class="finance-v31-body finance-v31-settings-stack"><div id="finance-v31-message" class="finance-v31-message"></div>${paymentErrorBanner}
      <div class="finance-v31-toolbar"><div><h2 style="margin:0;font-size:22px;font-weight:900">Fee Structures</h2><p style="margin:4px 0 0;color:var(--ff-muted)">Create one grouped fee structure and attach one or multiple classes. Classes remain grouped inside the same structure card.</p></div><button class="finance-v31-btn primary" onclick="financeV31OpenStructureModal()">+ Create Fee Structure</button></div>
      <div class="finance-v31-filters">
        <select id="finance-v31-class-filter" class="finance-v31-select" onchange="financeV31ApplyFilter()"><option value="">All Classes</option>${state.classes.map(c=>`<option value="${esc(getClassName(c))}" ${state.filters.className===getClassName(c)?'selected':''}>${esc(getClassName(c))}</option>`).join('')}</select>
        <select id="finance-v31-term-filter" class="finance-v31-select" onchange="financeV31ApplyFilter()"><option value="">All Terms</option><option ${state.filters.term==='Term 1'?'selected':''}>Term 1</option><option ${state.filters.term==='Term 2'?'selected':''}>Term 2</option><option ${state.filters.term==='Term 3'?'selected':''}>Term 3</option></select>
        <select id="finance-v31-year-filter" class="finance-v31-select" onchange="financeV31ApplyFilter()"><option ${String(state.filters.year)===String(year)?'selected':''}>${year}</option><option ${String(state.filters.year)===String(year+1)?'selected':''}>${year+1}</option><option value="">All Years</option></select>
      </div>
      <div class="finance-v31-grid" style="margin-top:16px">${cardHtml}</div>
    </div>`;
  }

  function renderSettings(){
    const s=schoolSettings(), b=bankSettings();
    const ref=s.accountReferenceFormat||s.referenceFormat||'elimuid';
    const mode=s.paymentMode || 'manual';
    const cashEnabled = s.cashEnabled !== false && s.metadata?.cashEnabled !== false;
    const cardEnabled = s.cardEnabled === true || s.metadata?.cardEnabled === true;
    const mpesaType = s.mpesaType || (s.till ? 'till' : 'paybill');
    return `<div class="finance-v31-body finance-v31-settings-stack"><div id="finance-v31-message" class="finance-v31-message"></div>
      <div class="finance-v31-toolbar finance-v31-settings-toolbar"><div><h2 style="margin:0;font-size:22px;font-weight:900">Payment Settings</h2><p style="margin:4px 0 0;color:var(--ff-muted)">Choose how this school collects fees. Parents only see safe public payment details; Daraja secrets remain private. Click Save Settings so changes stick until changed again.</p><small id="finance-settings-save-status" style="color:var(--ff-muted)">Loaded from saved school settings.</small></div><button class="finance-v31-btn primary" onclick="financeV31SavePaymentSettings()">Save Settings</button></div>
      <div class="finance-v31-settings-stack v95-payment-settings-organized" onchange="financeV31MarkSettingsDirty()" oninput="financeV31MarkSettingsDirty()" >
        <div class="finance-v31-form-card spacious"><h3>1. Collection Mode</h3>
          <div class="finance-v31-form-row"><div><label>Collection Mode</label><select id="finance-payment-mode" class="finance-v31-select" onchange="financeV31TogglePaymentMode()">
            <option value="manual" ${mode==='manual'?'selected':''}>Manual M-Pesa verification only</option>
            <option value="daraja" ${mode==='daraja'?'selected':''}>Daraja STK Push only</option>
            <option value="mixed" ${mode==='mixed'?'selected':''}>Both Manual M-Pesa + Daraja STK</option>
            <option value="bank" ${mode==='bank'?'selected':''}>Bank/Cash/Card instructions only</option>
          </select></div><div><label>Account Reference Format</label><select id="finance-reference" class="finance-v31-select"><option value="elimuid" ${ref==='elimuid'?'selected':''}>Elimu ID</option><option value="admissionNumber" ${ref==='admissionNumber'?'selected':''}>Student Admission Number</option><option value="studentId" ${ref==='studentId'?'selected':''}>Student ID</option><option value="term" ${ref==='term'?'selected':''}>Student + Term</option></select></div></div>
          <div class="finance-v31-notice">Manual, STK, bank, cash and card settings can be enabled without interfering with school operations. Balances reduce only after approved/successful transactions.</div>
        </div>

        <div id="finance-manual-card" class="finance-v31-form-card spacious"><h3>2. Manual M-Pesa Public Details</h3>
          <div class="finance-v31-form-row"><div><label>M-Pesa Type</label><select id="finance-mpesa-type" class="finance-v31-select" onchange="financeV31ToggleMpesaType()"><option value="paybill" ${mpesaType!=='till'?'selected':''}>Paybill</option><option value="till" ${mpesaType==='till'?'selected':''}>Till</option></select></div><div id="finance-paybill-wrap"><label>Paybill Number</label><input id="finance-paybill" class="finance-v31-input" value="${esc(s.paybill||s.paybillNumber||s.businessShortcode||'')}" placeholder="e.g. 400200"></div><div id="finance-till-wrap"><label>Till Number</label><input id="finance-till" class="finance-v31-input" value="${esc(s.till||s.tillNumber||'')}" placeholder="School till number"></div></div>
          <label>Parent Manual Payment Instructions</label><textarea id="finance-manual-instructions" class="finance-v31-input" rows="4" placeholder="Example: Pay to the school paybill/till then submit the M-Pesa code for verification.">${esc(s.manualInstructions||s.metadata?.manualInstructions||'Pay using the displayed school account details, then submit your payment reference for verification.')}</textarea>
          <div class="finance-v31-notice">Only the selected Paybill/Till type is shown to parents. Daraja private keys are never exposed.</div>
        </div>

        <div id="finance-daraja-card" class="finance-v31-form-card spacious"><h3>3. Daraja STK Private Credentials</h3>
          <div class="finance-v31-form-row"><div><label>Daraja Consumer Key</label><input id="finance-daraja-key" class="finance-v31-input" placeholder="Private: only for Daraja mode" autocomplete="off"></div><div><label>Daraja Consumer Secret</label><input id="finance-daraja-secret" class="finance-v31-input" placeholder="Private: only for Daraja mode" autocomplete="off"></div></div>
          <div class="finance-v31-form-row"><div><label>Daraja Passkey</label><input id="finance-daraja-passkey" class="finance-v31-input" placeholder="Private: only for Daraja mode" autocomplete="off"></div><div><label>Daraja Shortcode</label><input id="finance-daraja-shortcode" class="finance-v31-input" value="${esc(s.shortcode||s.businessShortcode||'')}" placeholder="Shortcode used for STK"></div></div>
          <div class="finance-v31-notice">Parents only see the STK Pay button when Daraja is enabled and configured. They never see consumer keys, secrets or passkeys.</div>
        </div>

        <div id="finance-bank-card" class="finance-v31-form-card spacious"><h3>4. Bank / Cash / Card Details</h3>
          <div class="finance-v31-form-row"><div><label>Bank Name</label><input id="finance-bank-name" class="finance-v31-input" placeholder="Bank Name" value="${esc(b.bankName||s.bankName||'')}"></div><div><label>Account Name</label><input id="finance-account-name" class="finance-v31-input" placeholder="Account Name" value="${esc(b.accountName||s.accountName||'')}"></div></div>
          <div class="finance-v31-form-row"><div><label>Account Number</label><input id="finance-account-number" class="finance-v31-input" placeholder="Account Number" value="${esc(b.accountNumber||s.bankAccount||s.accountNumber||'')}"></div><div><label>Branch</label><input id="finance-branch" class="finance-v31-input" placeholder="Branch" value="${esc(b.branch||s.branch||'')}"></div></div>
          <div class="finance-v31-form-row"><label class="finance-v31-check"><input id="finance-cash-enabled" type="checkbox" ${cashEnabled?'checked':''}> Cash accepted at school office</label><label class="finance-v31-check"><input id="finance-card-enabled" type="checkbox" ${cardEnabled?'checked':''}> Card/POS accepted at school office</label></div>
          <label>Offline Instructions</label><textarea id="finance-offline-instructions" class="finance-v31-input" rows="3" placeholder="Where parents should go or what receipt/reference they should submit.">${esc(s.offlineInstructions||s.metadata?.offlineInstructions||'Cash/card payments should be made at the school office and receipt/reference submitted for records.')}</textarea>
        </div>

        ${renderSchoolPaymentAgents()}

        <div class="finance-v31-total-box"><strong>Parent Visibility</strong><p style="color:var(--ff-muted)">Parents see safe public payment instructions based on the selected payment mode. They never receive private Daraja credentials.</p><div class="finance-v31-settings-actions"><button class="finance-v31-btn blue" onclick="financeV31TestConnection()">Test Daraja Connection</button><button class="finance-v31-btn primary" onclick="financeV31SavePaymentSettings()">Save Settings</button></div></div><div class="finance-v31-sticky-save"><span id="finance-settings-sticky-status">Payment settings loaded</span><button class="finance-v31-btn primary" onclick="financeV31SavePaymentSettings()">Save Settings</button></div>
      </div></div>`;
  }

  function renderRecords(){
    const classes = visibleClasses();
    const selectedClass = getSelectedRecordClass();
    const summary = classFinancialSummary(selectedClass);
    const rows=(state.paymentRecords||[]).filter(r=>{
      const className = r.className || recordClassName(r);
      if(selectedClass && className !== selectedClass) return false;
      if(state.filters.term && (r.term || r.feeTerm || r.Fee?.term || r.metadata?.term) !== state.filters.term) return false;
      if(state.filters.year && String(r.year || r.feeYear || r.Fee?.year || r.metadata?.year || '') !== String(state.filters.year)) return false;
      return true;
    });
    const accounts = classStudentBalanceRows(selectedClass);
    const totalExpected = accounts.reduce((s,a)=>s+Number(a.feeTotalAmount ?? a.totalAmount ?? 0),0);
    const parentPaid = accounts.reduce((s,a)=>s+Number(a.feeParentPaidAmount ?? a.parentPaidAmount ?? a.feePaidAmount ?? a.paidAmount ?? 0),0);
    const credits = accounts.reduce((s,a)=>s+Number(a.feeCreditAmount ?? a.creditAmount ?? 0),0);
    const outstanding = accounts.reduce((s,a)=>s+Number(a.feeBalance ?? a.balance ?? Math.max(0,Number((a.feeTotalAmount ?? a.totalAmount) || 0)-Number((a.feeParentPaidAmount ?? a.parentPaidAmount ?? a.paidAmount) || 0)-Number((a.feeCreditAmount ?? a.creditAmount) || 0))),0);
    const defaulters = accounts.filter(a=>Number(a.feeBalance ?? a.balance ?? 0)>0);
    return `<div class="finance-v31-body finance-v31-settings-stack"><div id="finance-v31-message" class="finance-v31-message"></div>
      <div class="finance-v31-toolbar"><div><h2 style="margin:0;font-size:22px;font-weight:900">Payment Records</h2><p style="margin:4px 0 0;color:var(--ff-muted)">Student-specific fee accounts, balances, bursaries and payment history.</p></div><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="finance-v31-btn" onclick="financeV31Refresh()">Refresh Records</button><button class="finance-v31-btn blue" onclick="financeV31OpenManualModal()">Record Payment</button><button class="finance-v31-btn" onclick="financeV31OpenBursaryModal()">Add Bursary/Credit</button></div></div>
      <div class="finance-v31-class-tabs"><button class="finance-v31-class-tab ${!selectedClass?'active':''}" onclick="financeV31SetRecordClass('')">All Classes</button>${classes.map(c=>`<button class="finance-v31-class-tab ${selectedClass===c?'active':''}" onclick="financeV31SetRecordClass('${esc(c)}')">${esc(c)}</button>`).join('')}</div>
      <div class="finance-v31-summary compact"><div class="finance-v31-metric"><div><strong>Total Expected</strong><h3>${money(totalExpected)}</h3></div></div><div class="finance-v31-metric"><div><strong>Parent Paid</strong><h3>${money(parentPaid)}</h3></div></div><div class="finance-v31-metric"><div><strong>Bursaries/Credits</strong><h3>${money(credits)}</h3></div></div><div class="finance-v31-metric"><div><strong>Outstanding</strong><h3>${money(outstanding)}</h3></div></div><div class="finance-v31-metric"><div><strong>Fee Defaulters</strong><h3>${defaulters.length}</h3></div></div></div>
      <div class="finance-v31-card wide"><h3 style="margin-top:0">${selectedClass?esc(selectedClass):'All Classes'} Student Balances</h3><div class="finance-v31-table-wrap"><table class="finance-v31-table"><thead><tr><th>Student</th><th>Class</th><th>Term</th><th>Total</th><th>Parent Paid</th><th>Bursary/Credit</th><th>Balance</th><th>Status</th><th>Actions</th></tr></thead><tbody>${accounts.length?accounts.map(a=>{ const feeId=a.feeId||a.id; const studentId=a.studentId; const bal=Number(a.feeBalance ?? a.balance ?? 0); return `<tr><td>${esc(a.studentName || accountStudentName(a))}</td><td>${esc(a.className || accountClassName(a))}</td><td>${esc(a.__missingFeeAccount ? 'No active fee account' : ((a.term || a.feeTerm || '—') + ' ' + String(a.year || a.feeYear || '')))}</td><td>${money(a.feeTotalAmount ?? a.totalAmount)}</td><td>${money(a.feeParentPaidAmount ?? a.parentPaidAmount ?? a.paidAmount)}</td><td>${money(a.feeCreditAmount ?? a.creditAmount)}</td><td><strong>${money(bal)}</strong></td><td><span class="finance-v31-badge ${a.__missingFeeAccount?'draft':(bal>0?'partial':'paid')}">${a.__missingFeeAccount?'Needs fee account':(bal>0?'Balance':'Paid')}</span></td><td>${a.__missingFeeAccount ? '<span class="text-xs text-muted-foreground">Activate/assign fee structure first</span>' : `<button class="finance-v31-btn blue" onclick="financeV31OpenManualModal('${esc(studentId)}','${esc(feeId)}')">Record Payment</button><button class="finance-v31-btn" onclick="financeV31OpenBursaryModal('${esc(studentId)}','${esc(feeId)}')">Bursary</button><button class="finance-v31-btn" onclick="financeV31ViewStudentHistory('${esc(studentId)}')">History</button>`}</td></tr>`}).join(''):'<tr><td colspan="9"><div class="finance-v31-empty">No fee accounts found. Activate/assign a grouped fee structure first.</div></td></tr>'}</tbody></table></div></div>
    </div>`;
  }


  function renderVerification(){
    const rows = state.manualQueue || [];
    return `<div class="finance-v31-body finance-v31-settings-stack"><div id="finance-v31-message" class="finance-v31-message"></div><div class="finance-v31-toolbar"><div><h2 style="margin:0;font-size:22px;font-weight:900">Payment Verification Queue</h2><p style="margin:4px 0 0;color:var(--ff-muted)">Approve manual M-Pesa payments after checking the school statement/SMS.</p></div><button class="finance-v31-btn" onclick="financeV31RefreshQueue()">Refresh</button></div><div class="finance-v31-table-wrap"><table class="finance-v31-table"><thead><tr><th>Student</th><th>Elimu ID</th><th>Amount</th><th>M-Pesa Code</th><th>Parent</th><th>Date</th><th>Actions</th></tr></thead><tbody>${rows.length?rows.map(p=>`<tr><td>${esc(p.Student?.User?.name || p.studentId || 'Student')}</td><td>${esc(p.metadata?.studentElimuid || p.accountReference || '—')}</td><td>${money(p.amount)}</td><td><strong>${esc(p.reference || '—')}</strong></td><td>${esc(p.Parent?.User?.name || p.Parent?.User?.phone || 'Parent')}</td><td>${esc((p.createdAt||'').slice(0,10))}</td><td><button class="finance-v31-btn blue" onclick="financeV31ApproveManual('${esc(p.id)}')">Approve</button><button class="finance-v31-btn danger" onclick="financeV31RejectManual('${esc(p.id)}')">Reject</button></td></tr>`).join(''):'<tr><td colspan="7"><div class="finance-v31-empty">No pending manual payments.</div></td></tr>'}</tbody></table></div></div>`;
  }

  function renderFinanceOverview(){const t=totals(),defs=state.overview?.defaulters||[];if(isSchoolAdminView())return`<div class="space-y-4"><div class="rounded-xl border bg-card p-5"><div class="flex items-center justify-between"><div><h3 class="font-semibold text-lg">School Finance Overview</h3><p class="text-sm text-muted-foreground">Daily operations are handled by the Finance Team.</p></div><button onclick="financeV31SetTab('team')" class="finance-v31-btn">Manage Finance Team</button></div><div class="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4"><div class="rounded-lg border p-4"><span>Expected</span><strong class="block text-xl">${money(t.expected)}</strong></div><div class="rounded-lg border p-4"><span>Paid</span><strong class="block text-xl">${money(t.paid)}</strong></div><div class="rounded-lg border p-4"><span>Remaining</span><strong class="block text-xl">${money(t.outstanding)}</strong></div><div class="rounded-lg border p-4"><span>Pending verification</span><strong class="block text-xl">${t.pendingVerification||state.manualQueue.length}</strong></div></div></div><div class="rounded-xl border bg-card overflow-hidden"><div class="p-4 border-b"><h3 class="font-semibold">Defaulters</h3><p class="text-sm text-muted-foreground">${defs.length} learner(s) with an outstanding balance.</p></div><div class="overflow-x-auto"><table class="finance-v31-table"><thead><tr><th>Student</th><th>Elimu ID</th><th>Class</th><th>Outstanding</th></tr></thead><tbody>${defs.length?defs.slice(0,100).map(x=>`<tr><td>${esc(x.studentName)}</td><td>${esc(x.elimuid||'—')}</td><td>${esc(x.className||'Unassigned')}</td><td><strong>${money(x.balance)}</strong></td></tr>`).join(''):'<tr><td colspan="4"><div class="finance-v31-empty">No defaulters found.</div></td></tr>'}</tbody></table></div></div></div>`;return`<div class="space-y-4"><div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4"><button onclick="financeV31SetTab('verification')" class="rounded-xl border bg-card p-4 text-left"><span>Verification queue</span><strong class="block text-xl">${t.pendingVerification||state.manualQueue.length}</strong></button><button onclick="financeV31SetTab('balances')" class="rounded-xl border bg-card p-4 text-left"><span>Defaulters</span><strong class="block text-xl">${t.defaulterCount||defs.length}</strong></button><button onclick="financeV31SetTab('expenses')" class="rounded-xl border bg-card p-4 text-left"><span>Expenses</span><strong class="block text-xl">${money(t.totalExpenses||0)}</strong></button><button onclick="financeV31SetTab('finance-alerts')" class="rounded-xl border bg-card p-4 text-left"><span>Unread finance alerts</span><strong class="block text-xl">${state.financeAlerts.filter(a=>!a.isRead).length}</strong></button></div></div>`;}
  function renderDefaulters(){ const rows=classStudentBalanceRows('').filter(a=>Number(a.balance ?? Math.max(0,Number(a.totalAmount||0)-Number(a.paidAmount||0)))>0).sort((a,b)=>Number(b.balance||0)-Number(a.balance||0)); return `<div class="rounded-xl border bg-card overflow-hidden"><div class="p-4 border-b"><h3 class="font-semibold">Outstanding Balances</h3><p class="text-sm text-muted-foreground">Students with active unpaid balances. Select a student to view their history.</p></div><div class="overflow-x-auto"><table class="finance-v31-table"><thead><tr><th>Student</th><th>Class</th><th>Expected</th><th>Paid</th><th>Balance</th><th></th></tr></thead><tbody>${rows.length?rows.map(a=>`<tr><td>${esc(accountStudentName(a)||a.studentName)}</td><td>${esc(accountClassName(a)||a.className)}</td><td>${money(a.totalAmount||0)}</td><td>${money(a.paidAmount||a.parentPaidAmount||0)}</td><td><strong>${money(a.balance||0)}</strong></td><td><button class="finance-v31-btn" onclick="financeV31ViewStudentHistory('${a.studentId}')">History</button></td></tr>`).join(''):'<tr><td colspan="6"><div class="finance-v31-empty">No outstanding balances.</div></td></tr>'}</tbody></table></div></div>`; }
  function renderFinanceTeam(){if(!canManageFinanceStaff())return'<div class="rounded-xl border bg-card p-5">Only the school administrator can manage Finance Team accounts.</div>';const rows=state.financeStaff||[];return`<div class="grid gap-5 xl:grid-cols-[1fr_390px]"><div class="rounded-2xl border bg-card overflow-hidden"><div class="p-5 border-b"><h3 class="font-semibold">Finance Team</h3><p class="text-sm text-muted-foreground">Finance Officers, Bursars and Accountants use the dedicated Finance Workspace.</p></div><div class="divide-y">${rows.length?rows.map(u=>`<div class="p-4 flex items-center justify-between gap-3"><div><strong>${esc(u.name)}</strong><p class="text-sm text-muted-foreground">${esc(u.title||'Finance Officer')} • ${esc(u.email)}</p><p class="text-xs ${u.isActive?'text-green-600':'text-red-600'}">${u.isActive?'Active':'Suspended'}${u.isAdditionalRole?' • Additional role':''}</p></div><div class="flex gap-2"><button onclick="financeV31ToggleStaff(${u.id},${u.isActive?'false':'true'})" class="finance-v31-btn">${u.isActive?'Suspend':'Reactivate'}</button><button onclick="financeV148RemoveStaff(${u.id})" class="finance-v31-btn danger">Remove</button></div></div>`).join(''):'<div class="p-8 text-center text-muted-foreground">No Finance Team member assigned.</div>'}</div></div><form onsubmit="financeV31CreateStaff(event)" class="rounded-2xl border bg-card p-5 space-y-3"><h3 class="font-semibold">Add or Assign Finance Staff</h3><p class="text-sm text-muted-foreground">An existing same-school email can be assigned without creating a duplicate account.</p><div id="finance-staff-inline-message" class="hidden"></div><label class="block text-sm">Role title<select id="finance-staff-title" onchange="financeV148ApplyRolePreset()" class="mt-1 w-full rounded-lg border bg-background p-2"><option>Finance Officer</option><option>Bursar</option><option>Accountant</option></select></label><label class="block text-sm">Full name<input id="finance-staff-name" class="mt-1 w-full rounded-lg border bg-background p-2"></label><label class="block text-sm">Email<input id="finance-staff-email" type="email" required class="mt-1 w-full rounded-lg border bg-background p-2"></label><label class="block text-sm">Phone<input id="finance-staff-phone" class="mt-1 w-full rounded-lg border bg-background p-2"></label><label class="block text-sm">Temporary password<input id="finance-staff-password" type="password" minlength="8" class="mt-1 w-full rounded-lg border bg-background p-2"><span class="text-xs text-muted-foreground">Only required for a new account.</span></label><details class="rounded-lg border p-3"><summary class="cursor-pointer text-sm font-medium">Permissions</summary><div class="mt-3 grid grid-cols-2 gap-2">${Object.entries(FINANCE_PERMS).map(([k,l])=>`<label class="flex items-center gap-2 text-xs"><input type="checkbox" class="finance-new-permission" value="${k}" checked> ${l}</label>`).join('')}</div></details><button class="finance-v31-btn primary w-full">Add to Finance Team</button></form></div>`;}

  function renderBalances(){return renderRecords();}
  function renderExpenses(){const rows=state.expenses||[];return`<div class="space-y-4"><div class="finance-v31-toolbar"><div><h2>School Expenses</h2><p>Record and audit expenses for this school only.</p></div><button onclick="financeV148OpenExpenseModal()" class="finance-v31-btn primary">+ Record Expense</button></div><div class="rounded-xl border bg-card overflow-hidden"><table class="finance-v31-table"><thead><tr><th>Date</th><th>Category</th><th>Description</th><th>Payee</th><th>Amount</th><th>Status</th><th></th></tr></thead><tbody>${rows.length?rows.map(x=>`<tr><td>${esc(x.expenseDate)}</td><td>${esc(x.category)}</td><td>${esc(x.description)}</td><td>${esc(x.payee||'—')}</td><td><strong>${money(x.amount)}</strong></td><td>${esc(x.status)}</td><td><button onclick="financeV148VoidExpense(${x.id})" class="finance-v31-btn danger">Void</button></td></tr>`).join(''):'<tr><td colspan="7"><div class="finance-v31-empty">No expenses recorded.</div></td></tr>'}</tbody></table></div></div>`;}
  function renderFinanceAlerts(){const rows=state.financeAlerts||[];return`<div class="rounded-xl border bg-card overflow-hidden"><div class="p-5 border-b"><h3 class="font-semibold">Finance Alerts and Fee Confirmations</h3></div><div class="divide-y">${rows.length?rows.map(a=>`<div class="p-4 ${a.isRead?'':'bg-primary/5'}"><strong>${esc(a.title||'Finance alert')}</strong><p class="text-sm">${esc(a.message||'')}</p><p class="text-xs text-muted-foreground">${esc(a.sourceLabel||'School Finance')} • ${esc(new Date(a.createdAt).toLocaleString())}</p></div>`).join(''):'<div class="p-8 text-center text-muted-foreground">No finance alerts yet.</div>'}</div></div>`;}
  function renderReports(){const t=totals();return`<div class="space-y-4"><div class="rounded-xl border bg-card p-5"><h3 class="font-semibold">Finance Reports</h3><p class="text-sm text-muted-foreground">Download a clean school-scoped CSV summary or print this page.</p><div class="mt-4 flex gap-2"><button onclick="financeV148DownloadReportCsv()" class="finance-v31-btn primary">Download CSV Summary</button><button onclick="window.print()" class="finance-v31-btn">Print</button></div></div><div class="grid gap-3 md:grid-cols-4"><div class="rounded-xl border p-4">Expected<strong class="block">${money(t.expected)}</strong></div><div class="rounded-xl border p-4">Paid<strong class="block">${money(t.paid)}</strong></div><div class="rounded-xl border p-4">Expenses<strong class="block">${money(t.totalExpenses||0)}</strong></div><div class="rounded-xl border p-4">Net<strong class="block">${money(t.netCollected??(t.paid-(t.totalExpenses||0)))}</strong></div></div></div>`;}


  function renderInvoices(){const rows=(state.invoices||[]);return`<div class="space-y-4"><div class="finance-v31-toolbar"><div><h2>Student Fee Accounts & Invoices</h2><p>Issued invoices are immutable after payment/part-payment; changes use audited adjustments.</p></div><button onclick="financeV31Refresh()" class="finance-v31-btn">Refresh</button></div><div class="finance-v31-table-wrap"><table class="finance-v31-table"><thead><tr><th>Invoice</th><th>Student</th><th>Class</th><th>Term</th><th>Total</th><th>Paid</th><th>Credit</th><th>Balance</th><th>Status</th></tr></thead><tbody>${rows.length?rows.map(x=>`<tr><td>${esc(x.invoiceNo||x.id)}</td><td>${esc(x.studentName||'Student')}<br><small>${esc(x.elimuid||'')}</small></td><td>${esc(x.className||'Unassigned')}</td><td>${esc(x.term||'')} ${esc(x.year||'')}</td><td>${money(x.totalAmount)}</td><td>${money(x.parentPaidAmount)}</td><td>${money(x.creditAmount)}</td><td><strong>${money(x.balance)}</strong></td><td><span class="finance-v31-badge ${esc(String(x.status||'issued').toLowerCase())}">${esc(x.status||'issued')}</span></td></tr>`).join(''):'<tr><td colspan="9"><div class="finance-v31-empty">No invoices generated yet. Create/activate fee structures and generate student accounts.</div></td></tr>'}</tbody></table></div></div>`;}
  function renderFinanceAnalytics(){const a=state.financeAnalytics||{},s=a.summary||totals(),classes=a.classCollection||[],methods=a.paymentMethodSplit||{},expenses=a.expenseBreakdown||{};return`<div class="space-y-4"><div class="finance-v31-toolbar"><div><h2>Finance Analytics</h2><p>Collection rate, outstanding balances, expenses, net position and payment-method split.</p></div><button onclick="financeV31Refresh()" class="finance-v31-btn">Refresh</button></div><div class="grid gap-3 md:grid-cols-4"><div class="rounded-xl border p-4">Collection Rate<strong class="block text-xl">${Number(s.collectionRate||0)}%</strong></div><div class="rounded-xl border p-4">Outstanding<strong class="block text-xl">${money(s.outstanding)}</strong></div><div class="rounded-xl border p-4">Expenses<strong class="block text-xl">${money(s.totalExpenses||0)}</strong></div><div class="rounded-xl border p-4">Net Position<strong class="block text-xl">${money(s.netPosition??s.netCollected??0)}</strong></div></div><div class="finance-v31-table-wrap"><h3 class="font-semibold mb-2">Class Collection</h3><table class="finance-v31-table"><thead><tr><th>Class</th><th>Expected</th><th>Paid</th><th>Credits</th><th>Outstanding</th><th>Accounts</th></tr></thead><tbody>${classes.length?classes.map(c=>`<tr><td>${esc(c.className)}</td><td>${money(c.expected)}</td><td>${money(c.paid)}</td><td>${money(c.credits)}</td><td>${money(c.outstanding)}</td><td>${Number(c.count||0)}</td></tr>`).join(''):'<tr><td colspan="6"><div class="finance-v31-empty">No class collection data yet.</div></td></tr>'}</tbody></table></div><div class="grid gap-4 md:grid-cols-2"><div class="rounded-xl border p-4"><h3 class="font-semibold">Payment Methods</h3>${Object.entries(methods).map(([k,v])=>`<p class="flex justify-between"><span>${esc(k)}</span><strong>${money(v)}</strong></p>`).join('')||'<p class="text-muted-foreground text-sm">No verified payments yet.</p>'}</div><div class="rounded-xl border p-4"><h3 class="font-semibold">Expense Breakdown</h3>${Object.entries(expenses).map(([k,v])=>`<p class="flex justify-between"><span>${esc(k)}</span><strong>${money(v)}</strong></p>`).join('')||'<p class="text-muted-foreground text-sm">No expenses yet.</p>'}</div></div></div>`;}
  function renderAuditTrail(){const rows=state.auditTrail||[];return`<div class="space-y-4"><div class="finance-v31-toolbar"><div><h2>Finance Audit Trail</h2><p>Every finance action is logged with actor, action, entity and timestamp.</p></div></div><div class="finance-v31-table-wrap"><table class="finance-v31-table"><thead><tr><th>Date</th><th>Actor</th><th>Action</th><th>Entity</th><th>Details</th></tr></thead><tbody>${rows.length?rows.map(r=>`<tr><td>${esc(String(r.createdAt||'').slice(0,19).replace('T',' '))}</td><td>${esc(r.actorRole||'')} #${esc(r.actorUserId||'')}</td><td>${esc(r.action||'')}</td><td>${esc(r.entityType||'')} ${esc(r.entityId||'')}</td><td>${esc(JSON.stringify(r.metadata||r.after||{}).slice(0,180))}</td></tr>`).join(''):'<tr><td colspan="5"><div class="finance-v31-empty">No finance audit entries yet.</div></td></tr>'}</tbody></table></div></div>`;}

  function body(){if(state.tab==='overview')return renderFinanceOverview();if(state.tab==='team')return renderFinanceTeam();if(state.tab==='settings')return renderSettings();if(state.tab==='invoices')return renderInvoices();if(state.tab==='records'||state.tab==='balances')return renderRecords();if(state.tab==='defaulters')return renderDefaulters();if(state.tab==='verification')return renderVerification();if(state.tab==='expenses')return renderExpenses();if(state.tab==='finance-alerts')return renderFinanceAlerts();if(state.tab==='finance-analytics')return renderFinanceAnalytics();if(state.tab==='audit')return renderAuditTrail();if(state.tab==='reports')return renderReports();return renderStructures();}
  async function render(){if(blockNonAdminFinance())return'<div class="rounded-xl border bg-card p-6 text-red-600">Finance access is not assigned to this account.</div>';if(isSchoolAdminView()&&!['overview','team'].includes(state.tab))state.tab='overview';await loadAll();const admin=isSchoolAdminView();return`<section class="finance-v31 space-y-5"><div class="flex flex-col gap-3 rounded-2xl border bg-card p-6 md:flex-row md:items-center md:justify-between"><div><p class="text-xs font-semibold uppercase tracking-[0.18em] text-primary">School Finance</p><h1 class="mt-1 text-2xl font-bold">${admin?'Finance Overview':esc(financeStaffTitle()+' Workspace')}</h1><p class="mt-1 text-sm text-muted-foreground">${admin?'School totals, defaulters and Finance Team management.':'Role-specific finance tools for '+esc(financeStaffTitle())+'.'}</p></div><div class="flex gap-2"><button class="finance-v31-btn" onclick="financeV31Refresh()">Refresh</button>${admin||!financeAllowed('fee_structures')?'':`<button class="finance-v31-btn primary" onclick="financeV31OpenStructureModal()">+ Create Fee Structure</button>`}</div></div><div id="finance-v31-summary-wrap">${renderSummary()}</div><div class="finance-v31-shell">${renderTabs()}<div id="finance-v31-tab-body">${body()}</div></div></section>`;}

  w.financeV31Refresh = async function(){
    if(blockNonAdminFinance()) return;
    await loadAll();
    const root=document.querySelector('.finance-v31');
    if(root){
      const wrapper=document.createElement('div');
      wrapper.innerHTML=await render();
      root.replaceWith(wrapper.firstElementChild);
    }
  };
  w.financeV31SetTab = function(tab){ state.tab=tab; const el=document.getElementById('finance-v31-tab-body'); if(el) el.innerHTML=body(); document.querySelectorAll('.finance-v31-tab').forEach(x=>x.classList.toggle('active', x.getAttribute('onclick')?.includes(tab))); if(tab==='settings') setTimeout(()=>{ w.financeV31TogglePaymentMode&&w.financeV31TogglePaymentMode(); w.financeV31ToggleMpesaType&&w.financeV31ToggleMpesaType(); },0); };
  w.financeV31ApplyFilter = function(){ state.filters.className=document.getElementById('finance-v31-class-filter')?.value||''; state.filters.term=document.getElementById('finance-v31-term-filter')?.value||''; state.filters.year=document.getElementById('finance-v31-year-filter')?.value||''; const el=document.getElementById('finance-v31-tab-body'); if(el) el.innerHTML=renderStructures(); };
  w.financeV31OpenStructureModal = function(id){
    const s=(state.structures||[]).find(x=>String(x.id)===String(id))||{};
    const selectedIds = new Set([...(Array.isArray(s.classIds)?s.classIds:[]), s.classId].filter(Boolean).map(String));
    const classChecks=state.classes.map(c=>`<label class="finance-v31-check"><input type="checkbox" class="ff-class-check" value="${esc(c.id||getClassName(c))}" data-name="${esc(getClassName(c))}" ${selectedIds.has(String(c.id))?'checked':''}> <span>${esc(getClassName(c))}</span></label>`).join('');
    document.body.insertAdjacentHTML('beforeend',`<div class="finance-v31 finance-v31-modal"><div class="finance-v31-modal-inner wide"><div class="finance-v31-modal-head"><div><strong>${id?'Edit Grouped Fee Structure':'Create Grouped Fee Structure'}</strong><p style="margin:4px 0 0;color:var(--ff-muted)">${id?'Add, remove or edit classes inside this same structure.':'Select one or multiple classes; they will stay grouped under one structure card.'}</p></div><button class="finance-v31-close" onclick="this.closest('.finance-v31-modal').remove()">×</button></div><div class="finance-v31-modal-body spacious"><div id="finance-v31-modal-message" class="finance-v31-message"></div><div class="finance-v31-form-grid wide"><div class="finance-v31-form-card full"><div class="finance-v31-form-row"><input id="ff-name" class="finance-v31-input" placeholder="Structure name e.g. Term 1 Fees" value="${esc(s.name||'')}"><select id="ff-term" class="finance-v31-select"><option ${s.term==='Term 1'?'selected':''}>Term 1</option><option ${s.term==='Term 2'?'selected':''}>Term 2</option><option ${s.term==='Term 3'?'selected':''}>Term 3</option></select><input id="ff-year" class="finance-v31-input" type="number" value="${esc(s.year||new Date().getFullYear())}"></div><div class="finance-v31-form-row"><select id="ff-curriculum" class="finance-v31-select"><option ${s.curriculum==='CBC'?'selected':''}>CBC</option><option ${s.curriculum==='CBE'?'selected':''}>CBE</option><option ${s.curriculum==='8-4-4'?'selected':''}>8-4-4</option></select><input id="ff-due" class="finance-v31-input" type="date" value="${esc((s.dueDate||'').slice(0,10))}"></div><div class="finance-v31-target-box"><div><strong>Assigned Classes</strong><p style="margin:4px 0 10px;color:var(--ff-muted)">Tick classes to include. Untick to remove a class from this grouped structure.</p></div><div class="finance-v31-class-checks">${classChecks || '<div class="finance-v31-empty">No classes found.</div>'}</div><div class="finance-v31-mini-actions"><button type="button" class="finance-v31-btn" onclick="document.querySelectorAll('.ff-class-check').forEach(x=>x.checked=true)">Select All</button><button type="button" class="finance-v31-btn" onclick="document.querySelectorAll('.ff-class-check').forEach(x=>x.checked=false)">Clear</button></div></div><h3>Fee Items</h3><div id="ff-items"></div><button class="finance-v31-btn" onclick="financeV31AddFeeItem()">+ Add Item</button></div><div class="finance-v31-total-box sticky"><strong>Calculated Total</strong><h2 id="ff-total">KES 0</h2><p style="color:var(--ff-muted)">One grouped structure can cover many classes, while every student still gets their own personal fee account.</p><button class="finance-v31-btn" onclick="this.closest('.finance-v31-modal').remove()">Cancel</button> <button class="finance-v31-btn primary" onclick="financeV31SaveStructure('${esc(id||'')}')">Save Fee Structure</button></div></div></div></div></div>`);
    const items=Array.isArray(s.items)?s.items:Array.isArray(s.feeItems)?s.feeItems:[{name:'Tuition',amount:''},{name:'Lunch',amount:''},{name:'Transport',amount:''}];
    items.forEach(i=>financeV31AddFeeItem(i)); financeV31RecalcTotal();
  };

  w.financeV31AddFeeItem = function(item={}){ const box=document.getElementById('ff-items'); if(!box)return; box.insertAdjacentHTML('beforeend',`<div class="finance-v31-fee-item"><input class="finance-v31-input ff-item-name" placeholder="Item name" value="${esc(item.name||item.itemName||'')}"><input class="finance-v31-input ff-item-amount" type="number" placeholder="Amount" value="${esc(item.amount||'')}" oninput="financeV31RecalcTotal()"><select class="finance-v31-select ff-item-type"><option value="required" ${item.required===false?'':'selected'}>Required</option><option value="optional" ${item.required===false?'selected':''}>Optional</option></select><button class="finance-v31-btn danger" onclick="this.closest('.finance-v31-fee-item').remove();financeV31RecalcTotal()">Remove</button></div>`); };
  w.financeV31RecalcTotal = function(){ let total=0; document.querySelectorAll('.finance-v31-fee-item').forEach(r=>{ const type=r.querySelector('.ff-item-type')?.value; if(type!=='optional') total+=Number(r.querySelector('.ff-item-amount')?.value||0); }); const el=document.getElementById('ff-total'); if(el)el.textContent=money(total); };
  w.financeV31SaveStructure = async function(id){
    const rows=[...document.querySelectorAll('.finance-v31-fee-item')];
    const items=rows.map(r=>({name:r.querySelector('.ff-item-name')?.value?.trim(), amount:Number(r.querySelector('.ff-item-amount')?.value||0), required:r.querySelector('.ff-item-type')?.value!=='optional'})).filter(i=>i.name && i.amount>=0);
    const checked=[...document.querySelectorAll('.ff-class-check:checked')].map(x=>({id:x.value, name:x.dataset.name||x.value}));
    const base={ name:document.getElementById('ff-name')?.value?.trim(), term:document.getElementById('ff-term')?.value, year:Number(document.getElementById('ff-year')?.value), curriculum:document.getElementById('ff-curriculum')?.value, dueDate:document.getElementById('ff-due')?.value || null, items, classIds: checked.map(c=>c.id), classes: checked.map(c=>c.id), assignedClasses: checked, className: checked.map(c=>c.name).join(', '), gradeLevel: checked.map(c=>c.name).join(', ') };
    const m=document.getElementById('finance-v31-modal-message');
    if(!base.name || !items.length){ if(m){m.className='finance-v31-message show error';m.textContent='Please name the structure and add fee items with amounts.';} return; }
    if(!checked.length){ if(m){m.className='finance-v31-message show error';m.textContent='Select at least one class for this grouped fee structure.';} return; }
    try{
      if(id) await apiSafe().feeStructures.update(id, base); else await apiSafe().feeStructures.create(base);
      document.querySelector('.finance-v31-modal')?.remove();
      window.dispatchEvent(new CustomEvent('shule:finance-updated',{detail:{type:'fee-structure-saved'}}));
      await render();
    }catch(e){ if(m){m.className='finance-v31-message show error';m.textContent=e.message||'Could not save fee structure.';} }
  };


  w.financeV31ViewStructure = function(id){
    const s=(state.structures||[]).find(x=>String(x.id)===String(id));
    if(!s) return;
    const assigned = Array.isArray(s.assignedClasses) ? s.assignedClasses : [];
    const classNames = assigned.length ? assigned.map(c=>c.name||c.grade||c.id).filter(Boolean) : getStructureClassName(s).split(',').map(x=>x.trim()).filter(Boolean);
    document.body.insertAdjacentHTML('beforeend', `<div class="finance-v31 finance-v31-modal"><div class="finance-v31-modal-inner wide"><div class="finance-v31-modal-head"><div><strong>${esc(s.name || 'Fee Structure')}</strong><p style="margin:4px 0 0;color:var(--ff-muted)">${esc(s.term || '')} ${esc(String(s.year || ''))} • ${esc(s.curriculum || 'CBC')}</p></div><button class="finance-v31-close" onclick="this.closest('.finance-v31-modal').remove()">×</button></div><div class="finance-v31-modal-body spacious"><div class="finance-v31-summary compact"><div class="finance-v31-metric"><strong>Total</strong><h3>${money(s.totalAmount||0)}</h3></div><div class="finance-v31-metric"><strong>Status</strong><h3>${esc(s.status||'draft')}</h3></div><div class="finance-v31-metric"><strong>Classes</strong><h3>${classNames.length||1}</h3></div><div class="finance-v31-metric"><strong>Students</strong><h3>${Number(s.studentsAssigned||0).toLocaleString()}</h3></div></div><div class="finance-v31-card"><h3>Classes in this fee structure</h3><div class="finance-v31-class-list large">${classNames.length?classNames.map(c=>`<span class="finance-v31-chip">${esc(c)}</span>`).join(''):'<div class="finance-v31-empty">No classes attached yet.</div>'}</div></div><div class="finance-v31-card"><h3>Fee items</h3><div class="finance-v31-items">${structureItems(s)}</div></div><div style="display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap;margin-top:14px"><button class="finance-v31-btn" onclick="this.closest('.finance-v31-modal').remove();financeV31OpenStructureModal('${esc(id)}')">Edit / Add / Remove Classes</button><button class="finance-v31-btn danger" onclick="this.closest('.finance-v31-modal').remove();financeV31DeleteStructure('${esc(id)}')">Delete / Archive</button></div></div></div></div>`);
  };

  w.financeV31DeleteStructure = async function(id){
    clearMessage();
    const s=(state.structures||[]).find(x=>String(x.id)===String(id));
    const ok = confirm(`Delete/archive ${s?.name || 'this fee structure'}?\n\nIf payments or fee accounts already exist, it will be archived safely instead of permanently deleted.`);
    if(!ok) return;
    try{
      if(apiSafe().feeStructures.delete) await apiSafe().feeStructures.delete(id); else await apiRequest(`/api/fee-structures/${id}`, { method:'DELETE' });
      setMessage('success','Fee structure deleted or archived safely.');
      await loadAll(); renderBodyOnly();
    }catch(e){ setMessage('error', e.message || 'Could not delete/archive fee structure.'); }
  };

  w.financeV31Activate = async function(id){ clearMessage(); try{ await apiSafe().feeStructures.activate(id); setMessage('success','Fee structure activated and fee accounts generated for eligible students.'); await loadAll(); renderBodyOnly(); }catch(e){ setMessage('error',e.message||'Could not activate fee structure.'); } };
  w.financeV31Assign = async function(id){ clearMessage(); try{ await apiSafe().feeStructures.assign(id,{ overwrite:false }); setMessage('success','Fee structure assigned to eligible students.'); await Promise.all([loadStructures(), loadPayments()]); const el=document.getElementById('finance-v31-tab-body'); if(el) el.innerHTML=renderStructures(); }catch(e){ setMessage('error',e.message||'Assignment failed.'); } };
  w.financeV31Lock = async function(id){ clearMessage(); if(!confirm('Lock this fee structure? Locked structures cannot be silently edited.'))return; try{ await apiSafe().feeStructures.lock(id); setMessage('success','Fee structure locked.'); await loadAll(); renderBodyOnly(); }catch(e){ setMessage('error',e.message||'Could not lock fee structure.'); } };
  w.financeV31SavePaymentSettings = async function(){ clearMessage(); const mpesaType=document.getElementById('finance-mpesa-type')?.value || 'paybill'; const paybillNumber=document.getElementById('finance-paybill')?.value || ''; const tillNumber=document.getElementById('finance-till')?.value || ''; const mpesaNumber=mpesaType==='till'?tillNumber:paybillNumber; const data={ paymentMode:document.getElementById('finance-payment-mode')?.value || 'manual', mpesaType, paybill:paybillNumber, paybillNumber, till:tillNumber, tillNumber, businessShortcode:mpesaNumber, shortcode:document.getElementById('finance-daraja-shortcode')?.value || mpesaNumber, consumerKey:document.getElementById('finance-daraja-key')?.value, consumerSecret:document.getElementById('finance-daraja-secret')?.value, passkey:document.getElementById('finance-daraja-passkey')?.value, referenceFormat:document.getElementById('finance-reference')?.value || 'elimuid', manualInstructions:document.getElementById('finance-manual-instructions')?.value, offlineInstructions:document.getElementById('finance-offline-instructions')?.value, cashEnabled:!!document.getElementById('finance-cash-enabled')?.checked, cardEnabled:!!document.getElementById('finance-card-enabled')?.checked, bankName:document.getElementById('finance-bank-name')?.value, accountName:document.getElementById('finance-account-name')?.value, bankAccount:document.getElementById('finance-account-number')?.value, accountNumber:document.getElementById('finance-account-number')?.value, branch:document.getElementById('finance-branch')?.value, bankDetails:{ bankName:document.getElementById('finance-bank-name')?.value, accountName:document.getElementById('finance-account-name')?.value, accountNumber:document.getElementById('finance-account-number')?.value, branch:document.getElementById('finance-branch')?.value } }; try{ await apiSafe().payments.updateSchoolSettings(data); setMessage('success','Payment settings saved and parent payment instructions updated.'); if (typeof showToast==='function') showToast('Payment settings saved and updated for parents', 'success'); const st=document.getElementById('finance-settings-save-status'); if(st) st.textContent='Saved at '+new Date().toLocaleTimeString(); const ss=document.getElementById('finance-settings-sticky-status'); if(ss) ss.textContent='Saved at '+new Date().toLocaleTimeString(); await loadSettings(); window.dispatchEvent(new CustomEvent('shule:payment-settings-updated',{detail:{type:'payment-settings'}})); }catch(e){ setMessage('error',e.message||'Could not save payment settings.'); } };  w.financeV31SaveProviderAgent = async function(provider){
    clearMessage();
    const card = document.querySelector(`[data-school-provider="${provider}"]`);
    if(!card){ setMessage('error','Payment agent form was not found.'); return; }
    const config = {};
    card.querySelectorAll('[data-provider-field]').forEach(input => {
      const key = input.getAttribute('data-provider-field');
      const value = input.value?.trim() || '';
      if(value) config[key] = value;
    });
    const payload = { provider, enabled: !!card.querySelector('[data-provider-enabled]')?.checked, isDefault: !!card.querySelector('[data-provider-default]')?.checked, config };
    try{
      const res = await (apiSafe().payments?.saveSchoolProvider ? apiSafe().payments.saveSchoolProvider(payload) : apiRequest('/api/payments/admin/providers',{method:'PUT',body:JSON.stringify(payload)}));
      setMessage('success', res?.message || 'Payment agent saved for this school.');
      if(typeof showToast==='function') showToast('Payment agent saved for this school', 'success');
      await loadSettings();
      renderBodyOnly();
    }catch(e){ setMessage('error', e.message || 'Could not save payment agent.'); }
  };

  w.financeV31TestConnection = async function(){ clearMessage(); try{ const res = await (apiSafe().payments?.testSchoolConnection ? apiSafe().payments.testSchoolConnection() : apiRequest('/api/payments/admin/test-connection',{method:'POST'})); setMessage('success', res?.message || 'Daraja connection verified successfully.'); }catch(e){ setMessage('error', e.message || 'Daraja connection test failed.'); } };
  w.financeV31RefreshQueue = async function(){ clearMessage(); await loadManualQueue(); const el=document.getElementById('finance-v31-tab-body'); if(el) el.innerHTML=renderVerification(); };
  w.financeV31ApproveManual = async function(id){ clearMessage(); if(!confirm('Approve this payment and update the student balance?')) return; try{ await apiSafe().payments.approveManualPayment(id,{}); await loadAll(); renderBodyOnly(); window.dispatchEvent(new CustomEvent('shule:finance-updated',{detail:{type:'payment-approved',id}})); localStorage.setItem('shule:lastFinanceUpdate', String(Date.now())); setMessage('success','Payment approved. Records and balances updated.'); }catch(e){ setMessage('error',e.message||'Could not approve payment.'); } };
  w.financeV31RejectManual = async function(id){ clearMessage(); const reason=prompt('Reason for rejection?') || 'Rejected by school finance/admin'; try{ await apiSafe().payments.rejectManualPayment(id,{reason}); await loadAll(); renderBodyOnly(); window.dispatchEvent(new CustomEvent('shule:finance-updated',{detail:{type:'payment-rejected',id}})); localStorage.setItem('shule:lastFinanceUpdate', String(Date.now())); setMessage('success','Payment rejected. Records refreshed.'); }catch(e){ setMessage('error',e.message||'Could not reject payment.'); } };
  w.financeV31RenderRecordsOnly = function(){ const el=document.getElementById('finance-v31-tab-body'); if(el) el.innerHTML = renderRecords(); };
  w.financeV31SetRecordClass = setRecordClass;
  w.financeV31ViewRecord = function(id){
    const r=(state.paymentRecords||[]).find(x=>String(x.id)===String(id));
    if(!r) return;
    document.body.insertAdjacentHTML('beforeend', `<div class="finance-v31 finance-v31-modal"><div class="finance-v31-modal-inner"><div class="finance-v31-modal-head"><div><strong>Payment Record</strong><p style="margin:4px 0 0;color:var(--ff-muted)">${esc(recordStudentName(r))} • ${esc(recordClassName(r))}</p></div><button class="finance-v31-close" onclick="this.closest('.finance-v31-modal').remove()">×</button></div><div class="finance-v31-modal-body spacious"><div class="finance-v31-summary compact"><div class="finance-v31-metric"><strong>Amount</strong><h3>${money(r.amount)}</h3></div><div class="finance-v31-metric"><strong>Status</strong><h3>${esc(r.status||'pending')}</h3></div><div class="finance-v31-metric"><strong>Method</strong><h3>${esc(r.method||r.paymentGateway||'—')}</h3></div></div><div class="finance-v31-card"><p><strong>Reference:</strong> ${esc(r.mpesaReceiptNumber || r.reference || '—')}</p><p><strong>Date:</strong> ${esc((r.completedAt || r.verifiedAt || r.createdAt || '').slice(0,10))}</p><p><strong>Notes:</strong> ${esc(r.notes || '—')}</p></div></div></div></div>`);
  };
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

  function allAccountRows(){
    const merged=[]; const seen=new Set();
    (state.accounts||[]).forEach(a=>{ const key=`a:${a.studentId}:${a.id||a.feeId||''}`; if(!seen.has(key)){seen.add(key); merged.push(a);} });
    (state.paymentRecords||[]).forEach(r=>{ const key=`r:${r.studentId}:${r.feeId||r.id||''}`; if(!seen.has(key)){seen.add(key); merged.push(r);} });
    return merged;
  }
  function studentsForClass(className=''){
    const seen=new Set();
    const fromStudents=(state.students||[]).map(s=>({id:s.id||s.studentId, name:s.name||s.User?.name||s.studentName||s.fullName||'Student', className:s.className||s.Class?.name||s.grade||s.class||'Unassigned'}));
    const fromAccounts=allAccountRows().map(a=>({id:a.studentId, name:a.studentName||accountStudentName(a)||recordStudentName(a), className:a.className||accountClassName(a)||recordClassName(a)}));
    return [...fromStudents, ...fromAccounts].filter(a=>!className || String(a.className)===String(className)).filter(a=>a.id && !seen.has(String(a.id)) && seen.add(String(a.id))).sort((a,b)=>String(a.name).localeCompare(String(b.name)));
  }
  function classOptions(selected=''){
    return `<option value="">Select class</option>${visibleClasses().map(c=>`<option value="${esc(c)}" ${String(selected)===String(c)?'selected':''}>${esc(c)}</option>`).join('')}`;
  }
  function studentOptions(selectedId='', className=''){
    return studentsForClass(className).map(a=>`<option value="${esc(a.id)}" ${String(selectedId)===String(a.id)?'selected':''}>${esc(a.name)} • ${esc(a.className||'')}</option>`).join('');
  }
  function feeOptions(studentId='', selectedFeeId=''){
    return allAccountRows().filter(a=>!studentId || String(a.studentId)===String(studentId)).map(a=>({id:a.feeId||a.id, label:`${a.term||a.feeTerm||a.Fee?.term||a.metadata?.term||'Fee'} ${a.year||a.feeYear||a.Fee?.year||a.metadata?.year||''} • Balance ${money(a.feeBalance??a.balance??0)}`})).filter(a=>a.id).map(a=>`<option value="${esc(a.id)}" ${String(selectedFeeId)===String(a.id)?'selected':''}>${esc(a.label)}</option>`).join('');
  }
  function openFinanceTransactionModal(kind, studentId='', feeId=''){
    const isBursary = kind === 'bursary';
    const pre = allAccountRows().find(a=>String(a.studentId)===String(studentId) || String(a.feeId||a.id)===String(feeId));
    const preClass = pre ? (pre.className || accountClassName(pre) || recordClassName(pre)) : getSelectedRecordClass();
    document.body.insertAdjacentHTML('beforeend', `<div class="finance-v31 finance-v31-modal"><div class="finance-v31-modal-inner finance-v31-payment-modal"><div class="finance-v31-modal-head"><div><strong>${isBursary?'Add Bursary / Credit':'Record Manual Payment'}</strong><p style="margin:4px 0 0;color:var(--ff-muted)">First choose the class, then the student in that class. This updates one selected student only.</p></div><button class="finance-v31-close" onclick="this.closest('.finance-v31-modal').remove()">×</button></div><div class="finance-v31-modal-body spacious"><div id="finance-tx-message" class="finance-v31-message"></div><div class="finance-v31-form-card spacious"><div class="finance-v31-form-row"><div><label>Class</label><select id="finance-tx-class" class="finance-v31-select" onchange="financeV31OnTxClassChange()">${classOptions(preClass)}</select></div><div><label>Student</label><select id="finance-tx-student" class="finance-v31-select" onchange="document.getElementById('finance-tx-fee').innerHTML=financeV31FeeOptions(this.value)"><option value="">Select student</option>${studentOptions(studentId, preClass)}</select></div></div><div class="finance-v31-form-row"><div><label>Fee Account / Term</label><select id="finance-tx-fee" class="finance-v31-select"><option value="">Select fee account</option>${feeOptions(studentId, feeId)}</select></div><div><label>Amount</label><input id="finance-tx-amount" type="number" class="finance-v31-input" placeholder="Amount"></div></div><div class="finance-v31-form-row"><div><label>${isBursary?'Bursary / Credit Type':'Payment Method'}</label><select id="finance-tx-method" class="finance-v31-select">${isBursary?'<option value="bursary">Government/County Bursary</option><option value="scholarship">School Scholarship</option><option value="waiver">Hardship Waiver</option><option value="discount">Discount</option><option value="adjustment">Correction / Adjustment</option>':'<option value="cash">Cash</option><option value="bank">Bank Transfer</option><option value="card">Card</option><option value="manual_mpesa">Manual M-Pesa</option><option value="admin_adjustment">Correction / Adjustment</option>'}</select></div><div><label>Status</label><select id="finance-tx-status" class="finance-v31-select"><option value="completed">Approved / Successful now</option><option value="pending">Pending verification</option><option value="rejected">Rejected</option></select></div></div><label>Reference / Receipt No.</label><input id="finance-tx-reference" class="finance-v31-input" placeholder="Reference number"><label>Notes</label><textarea id="finance-tx-notes" class="finance-v31-input" rows="4" placeholder="Optional notes"></textarea><div class="finance-v31-modal-actions"><button class="finance-v31-btn" onclick="this.closest('.finance-v31-modal').remove()">Cancel</button><button class="finance-v31-btn primary" onclick="financeV31SaveTransaction('${kind}')">Save</button></div></div></div></div></div>`);
  }
  w.financeV31MarkSettingsDirty = function(){ const st=document.getElementById('finance-settings-save-status'); if(st) st.textContent='Unsaved changes — click Save Settings to apply to parent dashboards.'; const ss=document.getElementById('finance-settings-sticky-status'); if(ss) ss.textContent='Unsaved changes'; };
  w.financeV31StudentOptionsForClass = function(className){ return '<option value="">Select student</option>' + studentOptions('', className || ''); };
  w.financeV31OnTxClassChange = function(){ const className=document.getElementById('finance-tx-class')?.value || ''; const student=document.getElementById('finance-tx-student'); const fee=document.getElementById('finance-tx-fee'); if(student) student.innerHTML=w.financeV31StudentOptionsForClass(className); if(fee) fee.innerHTML='<option value="">Select fee account</option>'; };
  w.financeV31ToggleMpesaType = function(){ const type=document.getElementById('finance-mpesa-type')?.value || 'paybill'; const pay=document.getElementById('finance-paybill-wrap'); const till=document.getElementById('finance-till-wrap'); if(pay) pay.style.display = type==='paybill' ? '' : 'none'; if(till) till.style.display = type==='till' ? '' : 'none'; };
  w.financeV31TogglePaymentMode = function(){ const mode=document.getElementById('finance-payment-mode')?.value || 'manual'; const manual=document.getElementById('finance-manual-card'); const daraja=document.getElementById('finance-daraja-card'); const bank=document.getElementById('finance-bank-card'); if(manual) manual.style.display = ['manual','mixed'].includes(mode) ? '' : 'none'; if(daraja) daraja.style.display = ['daraja','mixed'].includes(mode) ? '' : 'none'; if(bank) bank.style.display = ['bank','manual','mixed'].includes(mode) ? '' : 'none'; setTimeout(()=>w.financeV31ToggleMpesaType&&w.financeV31ToggleMpesaType(),0); };
  setTimeout(()=>{ w.financeV31TogglePaymentMode&&w.financeV31TogglePaymentMode(); w.financeV31ToggleMpesaType&&w.financeV31ToggleMpesaType(); },0);
  w.financeV31FeeOptions = feeOptions;
  w.financeV31OpenManualModal = function(studentId='', feeId=''){ openFinanceTransactionModal('payment', studentId, feeId); };
  w.financeV31OpenBursaryModal = function(studentId='', feeId=''){ openFinanceTransactionModal('bursary', studentId, feeId); };
  w.financeV31SaveTransaction = async function(kind){
    const msg=document.getElementById('finance-tx-message');
    const studentId=document.getElementById('finance-tx-student')?.value;
    const feeId=document.getElementById('finance-tx-fee')?.value;
    const amount=Number(document.getElementById('finance-tx-amount')?.value||0);
    const method=document.getElementById('finance-tx-method')?.value;
    const reference=document.getElementById('finance-tx-reference')?.value?.trim();
    const status=document.getElementById('finance-tx-status')?.value;
    const notes=document.getElementById('finance-tx-notes')?.value?.trim();
    if(!studentId || !feeId || !amount || amount<=0){ if(msg){msg.className='finance-v31-message show error';msg.textContent='Select student, fee account and amount.';} return; }
    try{
      const payload={feeId, amount, method, reference, status, notes, transactionType:kind==='bursary'?'bursary':'payment'};
      if(kind==='bursary') await apiSafe().payments.recordBursary(studentId,payload); else await apiSafe().payments.recordManualPayment(studentId,payload);
      document.querySelector('.finance-v31-modal')?.remove();
      await loadAll(); renderBodyOnly(); setMessage('success', kind==='bursary'?'Bursary/credit recorded.':'Payment recorded.');
      window.dispatchEvent(new CustomEvent('shule:finance-updated',{detail:{type:'finance-transaction-saved', studentId}}));
    }catch(e){ if(msg){msg.className='finance-v31-message show error';msg.textContent=e.message||'Could not save transaction.';} }
  };
  w.financeV31ViewStudentHistory = async function(studentId){
    try{
      const [historyRes, financeRes] = await Promise.allSettled([apiSafe().payments.getStudentHistory(studentId,{}), apiSafe().payments.getStudentFinance(studentId)]);
      const rows = historyRes.status==='fulfilled' ? (historyRes.value?.data || historyRes.value || []) : [];
      const finance = financeRes.status==='fulfilled' ? (financeRes.value?.data || financeRes.value || {}) : {};
      const accounts = finance.accounts || finance.feeAccounts || [];
      const first = accounts[0] || (state.accounts||[]).find(a=>String(a.studentId)===String(studentId)) || {};
      const studentName = finance.student?.name || first.studentName || accountStudentName(first) || 'Student';
      const className = finance.student?.className || first.className || accountClassName(first) || 'Class';
      const summary = finance.summary || { totalExpected:first.totalAmount||first.feeTotalAmount||0, parentPaid:first.parentPaidAmount||first.feeParentPaidAmount||0, credits:first.creditAmount||first.feeCreditAmount||0, balance:first.balance||first.feeBalance||0 };
      const bodyRows = rows.length ? rows.map(r=>`<tr><td>${esc((r.createdAt||r.paymentDate||'').slice(0,10))}</td><td>${esc(r.transactionType||'payment')}</td><td>${esc(r.method||r.paymentGateway||'—')}</td><td>${money(r.amount)}</td><td>${esc(r.reference||r.mpesaReceiptNumber||'—')}</td><td><span class="finance-v31-badge ${esc(String(r.status||'pending').toLowerCase())}">${esc(r.status||'pending')}</span></td><td>${esc(r.processedByName||r.approvedByName||r.processedBy||'—')}</td><td>${esc(r.notes||'')}</td></tr>`).join('') : '<tr><td colspan="8"><div class="finance-v31-empty">No payment history for this student yet.</div></td></tr>';
      document.body.insertAdjacentHTML('beforeend', `<div class="finance-v31 finance-v31-modal"><div class="finance-v31-modal-inner wide"><div class="finance-v31-modal-head"><div><strong>${esc(studentName)} — Payment History</strong><p style="margin:4px 0 0;color:var(--ff-muted)">${esc(className)} • individual student records only</p></div><button class="finance-v31-close" onclick="this.closest('.finance-v31-modal').remove()">×</button></div><div class="finance-v31-modal-body spacious"><div class="finance-v31-summary compact"><div class="finance-v31-metric"><strong>Total Expected</strong><h3>${money(summary.totalExpected||0)}</h3></div><div class="finance-v31-metric"><strong>Parent Paid</strong><h3>${money(summary.parentPaid||0)}</h3></div><div class="finance-v31-metric"><strong>Bursary/Credit</strong><h3>${money(summary.credits||0)}</h3></div><div class="finance-v31-metric"><strong>Balance</strong><h3>${money(summary.balance||0)}</h3></div></div><div class="finance-v31-table-wrap"><table class="finance-v31-table"><thead><tr><th>Date</th><th>Type</th><th>Method</th><th>Amount</th><th>Reference</th><th>Status</th><th>Processed By</th><th>Notes</th></tr></thead><tbody>${bodyRows}</tbody></table></div></div></div></div>`);
    }catch(e){ setMessage('error', e.message||'Could not load student history.'); }
  };

  function financeStaffInline(message,type='info',button=''){const box=document.getElementById('finance-staff-inline-message');if(!box)return;box.className=`rounded-lg border p-3 text-sm ${type==='error'?'border-red-300 bg-red-50 text-red-700':type==='success'?'border-green-300 bg-green-50 text-green-700':'border-amber-300 bg-amber-50 text-amber-800'}`;box.innerHTML=`${esc(message)}${button}`;}
  w.financeV148ApplyRolePreset=function(){const title=document.getElementById('finance-staff-title')?.value||'Finance Officer';const allowed=new Set(FINANCE_ROLE_PRESETS[title]||FINANCE_ROLE_PRESETS['Finance Officer']);document.querySelectorAll('.finance-new-permission').forEach(box=>{box.checked=allowed.has(box.value);});};
  w.financeV31CreateStaff=async function(event){event.preventDefault();const payload={name:document.getElementById('finance-staff-name')?.value?.trim(),email:document.getElementById('finance-staff-email')?.value?.trim(),phone:document.getElementById('finance-staff-phone')?.value?.trim(),password:document.getElementById('finance-staff-password')?.value||'',title:document.getElementById('finance-staff-title')?.value||'Finance Officer',permissions:Array.from(document.querySelectorAll('.finance-new-permission:checked')).map(x=>x.value)};try{const r=await apiSafe().admin.createFinanceStaff(payload);financeStaffInline(r.message||'Finance Team member added.','success');event.target.reset();await loadFinanceStaff();renderBodyOnly();}catch(e){if(e?.data?.code==='EXISTING_SAME_SCHOOL_USER'){window.__pendingFinanceExisting={...payload,user:e.data.data};financeStaffInline(e.message,'info',`<button type="button" onclick="financeV148AssignExistingStaff()" class="mt-3 w-full rounded-lg bg-primary px-3 py-2 text-white">Assign ${esc(e.data.data?.name||'existing user')}</button>`);}else financeStaffInline(e.message||'Finance Team member could not be added.','error');}};
  w.financeV148AssignExistingStaff=async function(){const p=window.__pendingFinanceExisting;if(!p)return;try{const r=await apiSafe().admin.createFinanceStaff({...p,assignExisting:true});financeStaffInline(r.message||'Existing user assigned.','success');window.__pendingFinanceExisting=null;await loadFinanceStaff();renderBodyOnly();}catch(e){financeStaffInline(e.message||'Could not assign existing user.','error');}};

  w.financeV31ToggleStaff = async function(userId,isActive){
    try{ await apiSafe().admin.updateFinanceStaff(userId,{isActive:!!isActive}); await loadFinanceStaff(); document.getElementById('finance-v31-tab-body').innerHTML=renderFinanceTeam(); if(typeof showToast==='function')showToast('Finance staff account updated','success'); }catch(e){ if(typeof showToast==='function')showToast(e.message||'Could not update finance account','error'); }
  };

  w.renderFinanceFeesV31 = render;
  w.v31RenderFinanceFeesSection = async function(tab){ if(tab) state.tab = tab; return render(); };
  w.financeV148RemoveStaff=async function(id){if(!confirm('Remove Finance Team access?'))return;try{await apiSafe().admin.updateFinanceStaff(id,{removeFinanceRole:true});await loadFinanceStaff();renderBodyOnly();showToast('Finance role removed','success');}catch(e){showToast(e.message||'Could not remove role','error');}};
  w.financeV148OpenExpenseModal=function(){document.body.insertAdjacentHTML('beforeend',`<div class="finance-v31 finance-v31-modal"><div class="finance-v31-modal-inner"><div class="finance-v31-modal-head"><strong>Record School Expense</strong><button class="finance-v31-close" onclick="this.closest('.finance-v31-modal').remove()">×</button></div><form onsubmit="financeV148SaveExpense(event)" class="finance-v31-modal-body spacious"><input id="expense-category" class="finance-v31-input" placeholder="Category" required><input id="expense-date" type="date" value="${new Date().toISOString().slice(0,10)}" class="finance-v31-input" required><textarea id="expense-description" class="finance-v31-input" placeholder="Description" required></textarea><input id="expense-amount" type="number" min="1" class="finance-v31-input" placeholder="Amount" required><input id="expense-payee" class="finance-v31-input" placeholder="Payee"><input id="expense-reference" class="finance-v31-input" placeholder="Reference"><button class="finance-v31-btn primary">Save Expense</button></form></div></div>`);};
  w.financeV148SaveExpense=async function(e){e.preventDefault();try{await apiSafe().finance.createExpense({category:document.getElementById('expense-category').value,expenseDate:document.getElementById('expense-date').value,description:document.getElementById('expense-description').value,amount:Number(document.getElementById('expense-amount').value),payee:document.getElementById('expense-payee').value,reference:document.getElementById('expense-reference').value});e.target.closest('.finance-v31-modal')?.remove();await Promise.all([loadExpenses(),loadOverview()]);renderBodyOnly();showToast('Expense recorded','success');}catch(x){showToast(x.message||'Expense could not be saved','error');}};
  w.financeV148VoidExpense=async function(id){if(!confirm('Void this expense?'))return;try{await apiSafe().finance.deleteExpense(id);await Promise.all([loadExpenses(),loadOverview()]);renderBodyOnly();showToast('Expense voided','success');}catch(e){showToast(e.message||'Could not void expense','error');}};
  w.financeV148DownloadReportCsv=async function(){try{const r=await apiSafe().finance.getReport({...state.filters.year?{year:state.filters.year}:{},...state.filters.term?{term:state.filters.term}:{}}),d=r?.data||r||{},rows=[['Metric','Value'],['Expected',d.summary?.expected||0],['Paid',d.summary?.paid||0],['Outstanding',d.summary?.outstanding||0],['Expenses',d.summary?.totalExpenses||0],[],['Student','Class','Elimu ID','Balance'],...(d.defaulters||[]).map(x=>[x.studentName,x.className,x.elimuid,x.balance])],csv=rows.map(row=>row.map(v=>`"${String(v??'').replace(/"/g,'""')}"`).join(',')).join('\n'),blob=new Blob([csv],{type:'text/csv'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`School_Finance_Summary_${new Date().toISOString().slice(0,10)}.csv`;a.click();URL.revokeObjectURL(a.href);}catch(e){showToast(e.message||'Report failed','error');}};

  w.v31RenderFinanceFees = render;
  window.addEventListener('shule:finance-updated', async function(){
    if(isAdminFinanceRole() && document.querySelector('.finance-v31')) { await loadAll(); renderBodyOnly(); }
  });
  window.addEventListener('storage', async function(e){
    if(e.key === 'shule:lastFinanceUpdate' && document.querySelector('.finance-v31')) { await loadAll(); renderBodyOnly(); }
  });
  w.financeV31SoftRefresh = async function(){ if(isAdminFinanceRole() && document.querySelector('.finance-v31')) { await loadAll(); renderBodyOnly(); } };

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
    .finance-v31-modal{position:fixed;inset:0;z-index:9999;background:rgba(15,23,42,.62);display:flex;align-items:center;justify-content:center;padding:18px;overflow:auto}.finance-v31-modal-inner{width:min(980px,96vw);max-height:92vh;overflow:auto;background:var(--ff-panel);color:var(--ff-text);border:1px solid var(--ff-border);border-radius:20px;box-shadow:0 24px 70px rgba(0,0,0,.3)}.finance-v31-modal-inner.wide{width:min(1120px,98vw)}.finance-v31-modal-body{padding:18px;overflow:visible}.finance-v31-form-grid.wide{display:grid;grid-template-columns:minmax(0,1fr) 270px;gap:16px;align-items:start}.finance-v31-form-card.full{min-width:0}.finance-v31-form-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;margin-bottom:12px}.finance-v31-target-box{border:1px solid var(--ff-border);border-radius:16px;padding:12px;margin:12px 0;background:var(--ff-card-2)}.finance-v31-class-checks{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;max-height:240px;overflow:auto;padding-right:4px}.finance-v31-check{display:flex;gap:8px;align-items:center;padding:9px 10px;border:1px solid var(--ff-border);border-radius:12px;background:var(--ff-card);font-size:13px;line-height:1.2}.finance-v31-mini-actions{display:flex;gap:8px;margin-top:10px}.finance-v31-total-box.sticky{position:sticky;top:12px}.finance-v31-class-tabs{display:flex;flex-wrap:wrap;gap:8px;margin:14px 0}.finance-v31-class-tab{border:1px solid var(--ff-border);background:var(--ff-card);color:var(--ff-text);border-radius:999px;padding:8px 12px;font-weight:800;font-size:13px;cursor:pointer}.finance-v31-class-tab.active{background:#083A85;color:white;border-color:#083A85}.finance-v31-summary.compact{grid-template-columns:repeat(auto-fit,minmax(170px,1fr));margin:10px 0 14px}.finance-v31-two-col{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(280px,.8fr);gap:14px}.finance-v31-card.wide{min-width:0}.finance-v31-defaulter-list{display:grid;gap:8px;max-height:520px;overflow:auto}.finance-v31-defaulter{display:flex;justify-content:space-between;gap:12px;padding:10px;border-radius:12px;border:1px solid var(--ff-border);background:var(--ff-card-2)}.finance-v31-defaulter small{display:block;color:var(--ff-muted);font-size:11px}.finance-v31-defaulter.owing{border-left:4px solid #f97316}.finance-v31-defaulter.paid{border-left:4px solid #22c55e}.finance-v31-btn,.finance-v31-tab,.finance-v31-select,.finance-v31-input{color:var(--ff-text)!important;background-color:var(--ff-card-2)!important;border-color:var(--ff-border)!important}.finance-v31-btn.primary,.finance-v31-btn.blue,.finance-v31-btn.danger,.finance-v31-class-tab.active{color:#fff!important}@media(max-width:860px){.finance-v31-form-grid.wide,.finance-v31-two-col{grid-template-columns:1fr}.finance-v31-total-box.sticky{position:static}.finance-v31-modal{align-items:flex-start;padding:10px}.finance-v31-modal-inner{max-height:96vh}.finance-v31-class-checks{grid-template-columns:1fr}.finance-v31-table-wrap{overflow-x:auto}}
  `;
  document.head.appendChild(style);
})();


// v76 finance role-gate + grouped structure UI refinements.
(function(){
  if (document.getElementById('finance-v76-locked-style')) return;
  const style=document.createElement('style');
  style.id='finance-v76-locked-style';
  style.textContent=`
    .finance-v31-card.grouped{display:flex;flex-direction:column;gap:12px}.finance-v31-class-list{display:flex;flex-wrap:wrap;gap:8px;margin:8px 0}.finance-v31-class-list.large{gap:10px}.finance-v31-chip{display:inline-flex;align-items:center;border:1px solid var(--ff-border);border-radius:999px;padding:6px 10px;font-size:12px;font-weight:800;background:var(--ff-card-2);color:var(--ff-text)}.finance-v31-chip.muted{color:var(--ff-muted)}.finance-v31-actions-row{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}.finance-v31-modal-body.spacious{padding:24px}.finance-v31-form-card.spacious{padding:22px;border-radius:18px}.finance-v31-payment-modal{width:min(920px,96vw)}.finance-v31-modal-actions{display:flex;gap:10px;justify-content:flex-end;margin-top:18px;padding-top:14px;border-top:1px solid var(--ff-border)}.finance-v31-payment-modal label{display:block;margin:10px 0 6px;font-weight:800}.finance-v31-payment-modal .finance-v31-input,.finance-v31-payment-modal .finance-v31-select{min-height:46px}.finance-v31-payment-modal textarea.finance-v31-input{min-height:110px}.finance-v31-settings-stack{display:grid;grid-template-columns:1fr;gap:18px}.finance-v31-settings-stack .finance-v31-form-card{width:100%}.finance-v31-settings-stack textarea.finance-v31-input{min-height:100px;resize:vertical}.finance-v31-settings-stack h3{margin:0 0 12px;font-size:16px;font-weight:900}.finance-v31-settings-stack .finance-v31-notice{margin-top:12px}.finance-v31-settings-stack .finance-v31-form-row{grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px}.finance-v31-settings-stack label{font-weight:800;font-size:13px;margin-bottom:6px;display:block}.finance-v31-card-foot{display:flex;justify-content:space-between;gap:12px;align-items:flex-end}.finance-v31-card-foot small{color:var(--ff-muted);font-weight:700}@media(max-width:720px){.finance-v31-card-foot{display:block}.finance-v31-actions-row .finance-v31-btn{width:100%;justify-content:center}.finance-v31-payment-modal{width:98vw}.finance-v31-modal-body.spacious{padding:14px}}
  `;
  document.head.appendChild(style);
})();


// v77 finance theme sync: make Finance & Fees and all popups follow dashboard light/dark mode.
(function(){
  if (document.getElementById('finance-v77-theme-style')) return;
  const style = document.createElement('style');
  style.id = 'finance-v77-theme-style';
  style.textContent = `
    .finance-v31,.finance-v31-modal{--ff-bg:transparent;--ff-panel:#0B1628;--ff-card:#12213A;--ff-card-2:#0F1B2D;--ff-border:rgba(148,163,184,.24);--ff-text:#F5F7FA;--ff-muted:#A7B4C6;color-scheme:dark;color:var(--ff-text)!important}
    html:not(.dark) .finance-v31,html:not(.dark) .finance-v31-modal,[data-theme="light"] .finance-v31,[data-theme="light"] .finance-v31-modal{--ff-bg:transparent;--ff-panel:#FFFFFF;--ff-card:#FFFFFF;--ff-card-2:#F5F7FA;--ff-border:#E2E8F0;--ff-text:#2D3748;--ff-muted:#64748B;color-scheme:light}
    html.dark .finance-v31,html.dark .finance-v31-modal,body.dark .finance-v31,body.dark .finance-v31-modal,.dark .finance-v31,.dark .finance-v31-modal,[data-theme="dark"] .finance-v31,[data-theme="dark"] .finance-v31-modal{--ff-bg:#07111f;--ff-panel:#0f1b2d;--ff-card:#122139;--ff-card-2:#0b1624;--ff-border:rgba(148,163,184,.24);--ff-text:#e5eef8;--ff-muted:#9fb0c8;color-scheme:dark}
    .finance-v31{background:transparent!important;color:var(--ff-text)!important}
    html:not(.dark) .finance-v31,[data-theme="light"] .finance-v31{background:var(--ff-bg)!important}
    .finance-v31-modal{background:rgba(2,6,23,.72)!important;color:var(--ff-text)!important}
    .finance-v31-modal-inner,.finance-v31-shell,.finance-v31-card,.finance-v31-card.grouped,.finance-v31-metric,.finance-v31-form-card,.finance-v31-total-box,.finance-v31-empty,.finance-v31-table-wrap,.finance-v31-target-box,.finance-v31-check,.finance-v31-chip,.finance-v31-defaulter,.finance-v31-notice,.finance-v31-message{background-color:var(--ff-card)!important;color:var(--ff-text)!important;border-color:var(--ff-border)!important}
    .finance-v31-modal-head,.finance-v31-tabs,.finance-v31-table th,.finance-v31-input,.finance-v31-select,.finance-v31 textarea,.finance-v31-modal input,.finance-v31-modal select,.finance-v31-modal textarea,.finance-v31-method,.finance-v31-class-tab,.finance-v31-btn:not(.primary):not(.blue):not(.danger),.finance-v31-close{background-color:var(--ff-card-2)!important;color:var(--ff-text)!important;border-color:var(--ff-border)!important}
    .finance-v31 h1,.finance-v31 h2,.finance-v31 h3,.finance-v31 strong,.finance-v31 label,.finance-v31-modal h1,.finance-v31-modal h2,.finance-v31-modal h3,.finance-v31-modal strong,.finance-v31-modal label{color:var(--ff-text)!important}
    .finance-v31 p,.finance-v31 small,.finance-v31-modal p,.finance-v31-modal small,.finance-v31 .text-muted-foreground,.finance-v31-modal .text-muted-foreground{color:var(--ff-muted)!important}
    .finance-v31-table,.finance-v31-table tbody,.finance-v31-table tr,.finance-v31-table td{background:var(--ff-card)!important;color:var(--ff-text)!important;border-color:var(--ff-border)!important}
    .finance-v31-table th{background:var(--ff-card-2)!important;color:var(--ff-muted)!important}
    .finance-v31-input::placeholder,.finance-v31-modal input::placeholder,.finance-v31-modal textarea::placeholder{color:var(--ff-muted)!important;opacity:1}
    .finance-v31-select option,.finance-v31-modal select option{background:var(--ff-panel)!important;color:var(--ff-text)!important}
    .finance-v31-btn.primary,.finance-v31-btn.blue,.finance-v31-btn.danger,.finance-v31-class-tab.active{color:#fff!important}
    .finance-v31-badge.active,.finance-v31-method.active,.finance-v31-tab.active{background:rgba(34,197,94,.16)!important;color:#22c55e!important;border-color:rgba(34,197,94,.38)!important}
  `;
  document.head.appendChild(style);
  const sync = () => document.querySelectorAll('.finance-v31,.finance-v31-modal').forEach(el => {
    el.setAttribute('data-finance-theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
  });
  sync();
  new MutationObserver(sync).observe(document.documentElement,{attributes:true,attributeFilter:['class','data-theme']});
})();
