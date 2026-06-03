
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
      {code:'child_essential', name:'Essential', monthlyPriceKes:100, features:['Report cards','Attendance','Homework tracking','Teacher communication']},
      {code:'child_smart', name:'Smart', monthlyPriceKes:300, features:['Progress analytics','Study insights','Priority updates']},
      {code:'child_genius', name:'Genius', monthlyPriceKes:500, features:['AI tutor','Full analytics','Smart recommendations']}
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
