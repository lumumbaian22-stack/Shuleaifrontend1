(function(){
  const state = { children: [], selectedChildId: null, plans: [{id:'basic', name:'Basic', amount:150},{id:'premium', name:'Premium', amount:300},{id:'ultimate', name:'Ultimate', amount:800}], lastCheckout: null };
  function h(v){ return typeof escapeHtml === 'function' ? escapeHtml(String(v ?? '')) : String(v ?? ''); }
  function money(v){ return `KES ${Number(v || 0).toLocaleString()}`; }
  function currentUser(){ return typeof getCurrentUser === 'function' ? getCurrentUser() : {}; }
  function showBusy(){ if (typeof showLoading === 'function') showLoading(); }
  function hideBusy(){ if (typeof hideLoading === 'function') hideLoading(); }
  function toast(msg,type='success'){ if (typeof showToast === 'function') showToast(msg,type); else alert(msg); }
  function childName(child){ return child?.User?.name || child?.name || child?.student?.name || 'Student'; }
  function initials(name){ return String(name||'').split(' ').map(p=>p[0]||'').slice(0,2).join('').toUpperCase() || 'ST'; }
  function normalizePhone(v){ const raw=String(v||'').replace(/\D/g,''); if(raw.startsWith('0')) return '254'+raw.slice(1); if(raw.startsWith('7')||raw.startsWith('1')) return '254'+raw; return raw || '254708374149'; }
  function selectedChild(){ return state.children.find(c => Number(c.id) === Number(state.selectedChildId)) || state.children[0] || null; }

  async function loadChildren(){
    if (!window.api?.parent?.getChildren) return [];
    const res = await api.parent.getChildren();
    state.children = res.data || [];
    if (!state.selectedChildId && state.children[0]) state.selectedChildId = state.children[0].id;
    return state.children;
  }

  function childSelector(){
    return `<div class="pay-child-strip">${state.children.map(c=>`<button class="pay-child-card ${Number(c.id)===Number(state.selectedChildId)?'active':''}" onclick="v11SelectPaymentChild(${c.id})"><div class="pay-avatar">${initials(childName(c))}</div><div><strong>${h(childName(c))}</strong><span>${h(c.grade || c.className || '')}</span><small>${h(c.elimuid || '')}</small></div></button>`).join('')}</div>`;
  }

  window.v11SelectPaymentChild = function(id){ state.selectedChildId = Number(id); const el=document.getElementById('dashboard-content'); if(el) renderParentPaymentsV11().then(html=>{el.innerHTML=html; initIcons();}); };
  function initIcons(){ if (window.lucide?.createIcons) lucide.createIcons(); }

  async function renderParentPaymentsV11(){
    showBusy();
    try{
      await loadChildren();
      const child = selectedChild();
      let summary = null;
      if(child?.id && api.parent.getChildSummary){ try { summary = (await api.parent.getChildSummary(child.id)).data; } catch(e){} }
      const feeBalance = summary?.outstandingFees?.balance || summary?.outstandingFees?.totalAmount || 0;
      const paid = summary?.outstandingFees?.paidAmount || 0;
      const schoolName = summary?.school?.name || getCurrentSchool?.()?.name || 'School';
      hideBusy();
      return `
        <div class="pay-page animate-fade-in">
          <div class="pay-hero">
            <div><h2>Payments & Subscriptions</h2><p>Pay school fees directly to the school and Shule AI subscriptions to the platform using M-PESA STK Push.</p></div>
            <div class="pay-hero-phone"><span>M-PESA Express</span><strong>Sandbox Ready</strong></div>
          </div>
          ${childSelector()}
          <div class="pay-parent-grid">
            <section class="pay-main-card">
              <div class="pay-section-head"><div><h3>${h(childName(child))}</h3><p>${h(schoolName)} • ${h(child?.grade || '')}</p></div><button class="pay-btn ghost" onclick="showDashboardSection('timetable')">View Timetable</button></div>
              <div class="pay-card-strip">
                <div class="pay-stat-card"><span>Outstanding Fees</span><strong>${money(feeBalance)}</strong><em>${paid ? money(paid)+' paid' : 'No payment recorded yet'}</em></div>
                <div class="pay-stat-card"><span>Subscription</span><strong>${h(child?.subscriptionPlan || 'Basic')}</strong><em>${h(child?.subscriptionStatus || 'inactive')}</em></div>
                <div class="pay-stat-card"><span>Payment Phone</span><strong>2547...</strong><em>Use sandbox test number first</em></div>
              </div>
              <div class="pay-action-grid">
                <div class="pay-action-card school"><div class="pay-icon">🏫</div><div><h3>Pay School Fees</h3><p>Fees are tagged to the student, school, term and payment reference.</p></div><button class="pay-btn primary" onclick="v11OpenFeeModal()">Pay Fees</button></div>
                <div class="pay-action-card platform"><div class="pay-icon">🤖</div><div><h3>Shule AI Subscription</h3><p>Unlock parent/student platform services and premium access.</p></div><button class="pay-btn primary purple" onclick="v11OpenSubscriptionModal()">Subscribe</button></div>
              </div>
              <div class="pay-history-card"><h3>Recent Payment Activity</h3><div class="pay-empty-history">Payment records will appear here after Daraja callback confirms transactions.</div></div>
            </section>
            <aside class="pay-side-panel">
              <div class="pay-side-card"><h3>Payment Routing</h3><div class="pay-route-row"><strong>School Fees</strong><span>Destination: School Account</span></div><div class="pay-route-row"><strong>Subscription</strong><span>Destination: Shule AI Account</span></div></div>
              <div class="pay-side-card"><h3>Sandbox Testing</h3><p>Use this test phone in sandbox:</p><code>254708374149</code><p>Use amount <strong>KES 1</strong> first.</p></div>
              <div class="pay-side-card"><h3>STK Status</h3><div id="v11-stk-status" class="pay-status-box">No active STK request yet.</div></div>
            </aside>
          </div>
        </div>`;
    } catch(e){ hideBusy(); return `<div class="text-red-500">${h(e.message)}</div>`; }
  }

  function modal(id, title, body, foot){
    document.getElementById(id)?.remove();
    const d=document.createElement('div'); d.id=id; d.className='pay-modal-overlay';
    d.innerHTML=`<div class="pay-modal"><div class="pay-modal-head"><div><h3>${title}</h3><p>M-PESA Express STK Push</p></div><button onclick="this.closest('.pay-modal-overlay').remove()">×</button></div><div class="pay-modal-body">${body}</div><div class="pay-modal-foot">${foot}</div></div>`;
    document.body.appendChild(d); d.addEventListener('click',e=>{if(e.target===d)d.remove();}); initIcons();
  }

  window.v11OpenFeeModal = function(){
    const c=selectedChild();
    modal('v11-fee-modal','Complete School Fees Payment',`
      <div class="pay-modal-grid"><div><label>Student</label><input value="${h(childName(c))}" disabled></div><div><label>Payment Type</label><input value="School Fees" disabled></div><div><label>Category</label><select id="v11-fee-category"><option>Tuition Fees</option><option>Transport</option><option>Lunch</option><option>Uniform</option><option>Activity Fees</option></select></div><div><label>Term</label><select id="v11-fee-term"><option>Term 1</option><option>Term 2</option><option>Term 3</option></select></div><div><label>Amount (KES)</label><input id="v11-fee-amount" type="number" value="1" min="1"></div><div><label>Phone Number</label><input id="v11-fee-phone" value="254708374149"></div></div><div class="pay-phone-preview"><strong>Phone Prompt Preview</strong><span>Customer receives an M-PESA prompt and enters PIN.</span></div>`, `<button class="pay-btn ghost" onclick="this.closest('.pay-modal-overlay').remove()">Cancel</button><button class="pay-btn primary" onclick="v11SendFeeSTK()">Prompt My Phone</button>`);
  };
  window.v11OpenSubscriptionModal = function(){
    const c=selectedChild();
    modal('v11-sub-modal','Pay Shule AI Subscription',`
      <div class="pay-plan-grid">${state.plans.map(p=>`<label class="pay-plan-card"><input type="radio" name="v11-plan" value="${p.id}" data-amount="${p.amount}" ${p.id==='basic'?'checked':''}><strong>${p.name}</strong><span>${money(p.amount)} / month</span></label>`).join('')}</div><div class="pay-modal-grid"><div><label>Student</label><input value="${h(childName(c))}" disabled></div><div><label>Phone Number</label><input id="v11-sub-phone" value="254708374149"></div></div><div class="pay-phone-preview purple"><strong>Subscription Prompt Preview</strong><span>Payment goes to Shule AI platform account.</span></div>`, `<button class="pay-btn ghost" onclick="this.closest('.pay-modal-overlay').remove()">Cancel</button><button class="pay-btn primary purple" onclick="v11SendSubSTK()">Prompt My Phone</button>`);
  };

  async function handleSTK(promise){
    showBusy();
    try{
      const res=await promise;
      const data=res.data || {};
      state.lastCheckout = data.stk?.CheckoutRequestID || data.checkoutRequestId || data.payment?.transactionId;
      toast(res.message || 'M-PESA prompt sent','success');
      document.querySelector('.pay-modal-overlay')?.remove();
      const box=document.getElementById('v11-stk-status'); if(box) box.innerHTML=`<strong>Prompt sent</strong><span>Checkout: ${h(state.lastCheckout || 'pending')}</span>`;
    }catch(e){ toast(e.message || 'Payment prompt failed','error'); }
    finally{ hideBusy(); }
  }
  window.v11SendFeeSTK = function(){
    const c=selectedChild(); if(!c) return toast('No child selected','error');
    return handleSTK(api.payments.parentFeeSTK({ studentId:c.id, amount:document.getElementById('v11-fee-amount')?.value, phone:normalizePhone(document.getElementById('v11-fee-phone')?.value), category:document.getElementById('v11-fee-category')?.value, term:document.getElementById('v11-fee-term')?.value }));
  };
  window.v11SendSubSTK = function(){
    const c=selectedChild(); if(!c) return toast('No child selected','error');
    const picked=document.querySelector('input[name="v11-plan"]:checked');
    return handleSTK(api.payments.parentSubscriptionSTK({ studentId:c.id, plan:picked?.value || 'basic', amount:picked?.dataset.amount || 150, phone:normalizePhone(document.getElementById('v11-sub-phone')?.value) }));
  };

  async function renderAdminPaymentSettings(){
    showBusy();
    try{
      const res=await api.payments.getSchoolSettings(); const s=res.data?.paymentSettings || {}; hideBusy();
      return `<div class="pay-page animate-fade-in"><div class="pay-hero"><div><h2>School Payment Details</h2><p>Set the school account where parents pay school fees. This is separate from Shule AI platform payments.</p></div><button class="pay-btn primary" onclick="v11SaveSchoolPaymentSettings()">Save Settings</button></div><div class="pay-settings-grid"><section class="pay-main-card"><h3>School Account Setup</h3><div class="pay-modal-grid"><div><label>PayBill Number</label><input id="school-paybill" value="${h(s.paybill)}" placeholder="e.g. 123456"></div><div><label>Till Number</label><input id="school-till" value="${h(s.till)}" placeholder="optional"></div><div><label>Account Name</label><input id="school-account-name" value="${h(s.accountName)}"></div><div><label>Support Phone</label><input id="school-support-phone" value="${h(s.supportPhone)}"></div><div><label>Settlement Bank</label><input id="school-settlement-bank" value="${h(s.settlementBank)}"></div><div><label>Settlement Account</label><input id="school-settlement-account" value="${h(s.settlementAccount)}"></div></div><div class="pay-toggle-row"><label><input id="school-payments-active" type="checkbox" ${s.active?'checked':''}> Activate school fee payment collection</label></div></section><aside class="pay-side-panel"><div class="pay-side-card"><h3>Parent Preview</h3><p>Parents will see this as the school fee payment destination.</p><div class="pay-route-row"><strong>${h(s.accountName || 'School Account')}</strong><span>${h(s.paybill || s.till || 'Not set')}</span></div></div><div class="pay-side-card"><h3>Important</h3><p>For direct settlement to each school, each school needs its own Daraja-approved shortcode/passkey or a payment aggregator flow.</p></div></aside></div></div>`;
    }catch(e){ hideBusy(); return `<div class="text-red-500">${h(e.message)}</div>`; }
  }
  window.v11SaveSchoolPaymentSettings = async function(){
    showBusy(); try{
      await api.payments.updateSchoolSettings({ paybill:document.getElementById('school-paybill')?.value, till:document.getElementById('school-till')?.value, accountName:document.getElementById('school-account-name')?.value, supportPhone:document.getElementById('school-support-phone')?.value, settlementBank:document.getElementById('school-settlement-bank')?.value, settlementAccount:document.getElementById('school-settlement-account')?.value, active:document.getElementById('school-payments-active')?.checked });
      toast('School payment settings saved','success');
    }catch(e){ toast(e.message,'error'); } finally{ hideBusy(); }
  };

  async function renderPlatformPaymentSystem(){
    showBusy();
    try{ const res=await api.payments.getPlatformSettings(); const s=res.data || {}; hideBusy();
      return `<div class="pay-page animate-fade-in"><div class="pay-hero platform"><div><h2>Platform Payment System</h2><p>Set Shule AI account details, subscription plans, maintenance fees and name-change charges.</p></div><button class="pay-btn primary purple" onclick="v11SavePlatformPaymentSettings()">Save Platform Payments</button></div><div class="pay-settings-grid"><section class="pay-main-card"><h3>Shule AI Payment Account</h3><div class="pay-modal-grid"><div><label>Account Name</label><input id="platform-account-name" value="${h(s.accountName || 'Shule AI')}"></div><div><label>PayBill</label><input id="platform-paybill" value="${h(s.paybill || '')}"></div><div><label>Till</label><input id="platform-till" value="${h(s.till || '')}"></div><div><label>Support Phone</label><input id="platform-support-phone" value="${h(s.supportPhone || '')}"></div><div><label>Name Change Fee</label><input id="platform-namechange-fee" type="number" value="${h(s.fees?.nameChange || 500)}"></div><div><label>Maintenance Fee</label><input id="platform-maintenance-fee" type="number" value="${h(s.fees?.maintenance || 2500)}"></div></div><h3 class="mt-6">Parent Subscription Plans</h3><div class="pay-plan-row"><input id="platform-basic" type="number" value="${h(s.parentPlans?.[0]?.amount || 150)}"><input id="platform-premium" type="number" value="${h(s.parentPlans?.[1]?.amount || 300)}"><input id="platform-ultimate" type="number" value="${h(s.parentPlans?.[2]?.amount || 800)}"></div></section><aside class="pay-side-panel"><div class="pay-side-card"><h3>Daraja Mode</h3><code>${h(s.darajaMode || 'sandbox')}</code><p>Actual Daraja keys are read from backend environment variables, not this UI.</p></div><div class="pay-side-card"><h3>Revenue Routing</h3><div class="pay-route-row"><strong>Subscriptions</strong><span>Shule AI</span></div><div class="pay-route-row"><strong>Name Change</strong><span>Shule AI</span></div><div class="pay-route-row"><strong>Maintenance</strong><span>Shule AI</span></div></div></aside></div></div>`;
    }catch(e){ hideBusy(); return `<div class="text-red-500">${h(e.message)}</div>`; }
  }
  window.v11SavePlatformPaymentSettings = async function(){
    showBusy(); try{
      await api.payments.updatePlatformSettings({ accountName:document.getElementById('platform-account-name')?.value, paybill:document.getElementById('platform-paybill')?.value, till:document.getElementById('platform-till')?.value, supportPhone:document.getElementById('platform-support-phone')?.value, fees:{ nameChange:Number(document.getElementById('platform-namechange-fee')?.value||500), maintenance:Number(document.getElementById('platform-maintenance-fee')?.value||2500) }, parentPlans:[{id:'basic',name:'Basic',amount:Number(document.getElementById('platform-basic')?.value||150)},{id:'premium',name:'Premium',amount:Number(document.getElementById('platform-premium')?.value||300)},{id:'ultimate',name:'Ultimate',amount:Number(document.getElementById('platform-ultimate')?.value||800)}] });
      toast('Platform payment settings saved','success');
    }catch(e){ toast(e.message,'error'); } finally{ hideBusy(); }
  };

  // Name change payment-first flow
  const oldProcessNameChange = window.processNameChange;
  window.processNameChange = function(){
    const newName=document.getElementById('new-school-name')?.value;
    const reason=document.getElementById('change-reason')?.value || 'School name change request';
    if(!newName) return toast('Please enter a new school name','error');
    modal('v11-namechange-payment','Pay Name Change Request Fee',`<div class="pay-modal-grid"><div><label>New School Name</label><input id="v11-nc-name" value="${h(newName)}" disabled></div><div><label>Amount (KES)</label><input id="v11-nc-amount" type="number" value="500"></div><div><label>Phone Number</label><input id="v11-nc-phone" value="254708374149"></div><div><label>Reason</label><input value="${h(reason)}" disabled></div></div><div class="pay-phone-preview purple"><strong>Admin Phone Prompt</strong><span>Pay first, then submit the request to super admin.</span></div>`, `<button class="pay-btn ghost" onclick="this.closest('.pay-modal-overlay').remove()">Cancel</button><button class="pay-btn primary purple" onclick="v11PayNameChangeAndSubmit()">Prompt My Phone</button>`);
  };
  window.v11PayNameChangeAndSubmit = async function(){
    const newName=document.getElementById('new-school-name')?.value; const reason=document.getElementById('change-reason')?.value || 'School name change request';
    showBusy(); try{
      const res=await api.payments.adminNameChangeSTK({ newName, reason, phone:normalizePhone(document.getElementById('v11-nc-phone')?.value), amount:document.getElementById('v11-nc-amount')?.value });
      toast(res.message || 'Payment prompt sent','success'); document.getElementById('v11-namechange-payment')?.remove();
      // Keep the actual request submit available after payment prompt is sent.
      if (typeof oldProcessNameChange === 'function') await oldProcessNameChange();
    }catch(e){ toast(e.message,'error'); } finally{ hideBusy(); }
  };

  // Dashboard section overrides
  const oldParentSection = window.renderParentSection;
  window.renderParentSection = async function(section){ if(section==='payments') return await renderParentPaymentsV11(); return oldParentSection(section); };
  const oldAdminSection = window.renderAdminSection;
  window.renderAdminSection = async function(section){ if(section==='payment-settings') return await renderAdminPaymentSettings(); return oldAdminSection(section); };
  const oldSuperSection = window.renderSuperAdminSection;
  window.renderSuperAdminSection = async function(section){ if(section==='platform-payments') return await renderPlatformPaymentSystem(); return oldSuperSection(section); };

  const oldSidebar = window.updateSidebar;
  window.updateSidebar = function(role){
    oldSidebar(role);
    const nav=document.getElementById('sidebar-nav'); if(!nav) return;
    function add(section,label,icon,after){ if(nav.querySelector(`[data-section="${section}"]`)) return; const a=document.createElement('a'); a.href='#'; a.setAttribute('onclick',`showDashboardSection('${section}')`); a.className='flex items-center gap-3 rounded-lg px-3 py-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors sidebar-link'; a.dataset.section=section; a.innerHTML=`<i data-lucide="${icon}" class="h-5 w-5"></i><span>${label}</span>`; const afterEl=after?nav.querySelector(`[data-section="${after}"]`):null; if(afterEl?.nextSibling) nav.insertBefore(a, afterEl.nextSibling); else nav.appendChild(a); }
    if(role==='admin') add('payment-settings','Payment Details','credit-card','timetable');
    if(role==='superadmin') add('platform-payments','Payment System','credit-card','analytics');
    if(role==='parent') { const p=nav.querySelector('[data-section="payments"] span'); if(p) p.textContent='Payments & Subscriptions'; }
    initIcons();
  };
})();
