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
