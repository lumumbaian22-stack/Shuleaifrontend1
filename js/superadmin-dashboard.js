// superadmin-dashboard.js - Super Admin dashboard rendering

// ============ RENDER SUPER ADMIN SECTION ============
async function renderSuperAdminSection(section) {
    try {
        switch(section) {
            case 'dashboard':
                return renderSuperAdminDashboard();
            case 'schools':
                return await renderSuperAdminSchools();
            case 'school-approvals':
                return await renderSuperAdminPendingSchools();
            case 'pending-approvals':
                return await renderSuperAdminPendingSchools();
            case 'name-change-requests':
                return await renderSuperAdminNameChangeRequests();
             case 'help':
                return renderHelpSection();   
            case 'platform-health':
                return await renderSuperAdminHealth();
            case 'platform-payments':
            case 'platform-payment-options':
            case 'platform-payment-approvals':
            case 'payment-options':
                return await renderSuperAdminPlatformPayments();
            case 'settings':
                return renderSuperAdminSettings();
            case 'alerts':
                return await (window.v12RenderAlertsCenter || window.renderAlertsCenter)('superadmin');
            case 'sms':
                return await renderSuperAdminBulkSms();
            default:
                return renderSuperAdminDashboard();
        }
    } catch (error) {
        console.error('Error rendering super admin section:', error);
        return `<div class="text-center py-12 text-red-500">Error loading section: ${error.message}</div>`;
    }
}



function renderPlatformPlanInputs(ownerType, plans) {
    const defaults = ownerType === 'parent'
        ? [
            { code:'child_basic', name:'Basic', amount:100, days:30, features:['Report cards','Attendance','Progress'] },
            { code:'child_premium', name:'Premium', amount:250, days:30, features:['Everything in Basic','AI Tutor: 6 messages/day','Child timetable if school has timetable'] },
            { code:'child_ultimate', name:'Ultimate', amount:500, days:30, features:['Everything in Premium','Extended AI Tutor','Live child analytics','Stronger alerts','Child recommendations'] }
          ]
        : [
            { code:'school_starter', name:'Starter', amount:0, days:30, minStudents:1, maxStudents:400, features:['Complete Shule AI school platform'] },
            { code:'school_growth', name:'Growth', amount:100000, days:30, minStudents:401, maxStudents:800, features:['Complete Shule AI school platform'] },
            { code:'school_enterprise', name:'Enterprise', amount:180000, days:30, minStudents:801, maxStudents:null, features:['Complete Shule AI school platform'] }
          ];
    const list = Array.isArray(plans) && plans.length ? plans : defaults;
    return list.map((p, i) => {
        const code = p.code || (ownerType === 'parent' ? `child_plan_${i+1}` : `school_plan_${i+1}`);
        const features = Array.isArray(p.features) ? p.features.join(' | ') : String(p.features || '');
        return `<div class="rounded-xl border bg-background p-3" data-platform-plan="${ownerType}" data-plan-index="${i}">
          <div class="grid gap-2 md:grid-cols-3">
            <label class="text-xs">Code<input data-plan-field="code" value="${escapeHtml(code)}" class="mt-1 w-full rounded-lg border bg-card px-2 py-2 text-sm"></label>
            <label class="text-xs">Name<input data-plan-field="name" value="${escapeHtml(p.displayName || p.name || code)}" class="mt-1 w-full rounded-lg border bg-card px-2 py-2 text-sm"></label>
            <label class="text-xs">Monthly KES<input data-plan-field="amount" type="number" min="0" value="${Number(p.amount ?? p.monthlyPriceKes ?? p.price_kes ?? 0)}" class="mt-1 w-full rounded-lg border bg-card px-2 py-2 text-sm"></label>
            <label class="text-xs">Days<input data-plan-field="days" type="number" min="1" value="${Number(p.days || p.limits?.days || 30)}" class="mt-1 w-full rounded-lg border bg-card px-2 py-2 text-sm"></label>
            ${ownerType === 'school' ? `<label class="text-xs">Minimum active students<input data-plan-field="minStudents" type="number" min="1" value="${Number(p.minStudents ?? p.limits?.minStudents ?? (i===0?1:i===1?401:801))}" class="mt-1 w-full rounded-lg border bg-card px-2 py-2 text-sm"></label><label class="text-xs">Maximum active students<input data-plan-field="maxStudents" type="number" min="1" value="${p.maxStudents ?? p.limits?.maxStudents ?? (i===0?400:i===1?800:'')}" placeholder="No limit" class="mt-1 w-full rounded-lg border bg-card px-2 py-2 text-sm"></label><input data-plan-field="features" type="hidden" value="Complete Shule AI school platform"><div class="md:col-span-3 rounded-lg bg-muted/50 p-3 text-xs"><strong>All core features included.</strong> This plan changes capacity, pricing, storage, support and usage allowances only.</div>` : `<label class="text-xs md:col-span-2">Features, separated with |<input data-plan-field="features" value="${escapeHtml(features)}" class="mt-1 w-full rounded-lg border bg-card px-2 py-2 text-sm"></label>`}
          </div>
        </div>`;
    }).join('');
}

function collectPlatformPlanInputs(ownerType) {
    return Array.from(document.querySelectorAll(`[data-platform-plan="${ownerType}"]`)).map((card, idx) => {
        const field = (name) => card.querySelector(`[data-plan-field="${name}"]`)?.value?.trim() || '';
        const amount = Number(field('amount') || 0);
        const days=Number(field('days')||30);
        const minStudents=Number(field('minStudents')||0)||null; const maxStudents=field('maxStudents')?Number(field('maxStudents')):null;
        return {
            code: field('code'),
            name: field('name'),
            displayName: field('name'),
            amount,
            monthlyPriceKes: amount,
            price_kes: amount,
            days,
            limits:{ days, ...(ownerType==='school'?{minStudents,maxStudents}: {}) },
            minStudents:ownerType==='school'?minStudents:undefined, maxStudents:ownerType==='school'?maxStudents:undefined,
            features: field('features').split('|').map(x => x.trim()).filter(Boolean),
            sortOrder: idx + 1,
            isActive: true
        };
    }).filter(p => p.code && p.name);
}
const PLATFORM_PAYMENT_AGENT_DEFS = [
    { provider:'mpesa', label:'M-Pesa', description:'M-Pesa checkout / STK for school and parent subscriptions.', fields:[['environment','Environment / Mode','sandbox or production'],['consumerKey','Consumer Key',''],['consumerSecret','Consumer Secret','',true],['passkey','Passkey','',true],['shortcode','Shortcode',''],['callbackUrl','Callback URL','']] },
    { provider:'pesapal', label:'Pesapal', description:'Pesapal checkout for Shule AI platform subscriptions.', fields:[['environment','Environment / Mode','sandbox or production'],['consumerKey','Consumer Key',''],['consumerSecret','Consumer Secret','',true],['ipnId','IPN ID',''],['callbackUrl','Callback URL',''],['checkoutUrl','Checkout URL / test link','']] },
    { provider:'paystack', label:'Paystack', description:'Paystack checkout for card, bank and mobile money where available.', fields:[['publicKey','Public Key',''],['secretKey','Secret Key','',true],['callbackUrl','Callback URL',''],['returnUrl','Return URL','']] },
    { provider:'flutterwave', label:'Flutterwave', description:'Flutterwave checkout for card, bank and mobile money where available.', fields:[['publicKey','Public Key',''],['secretKey','Secret Key','',true],['encryptionKey','Encryption Key','',true],['callbackUrl','Callback URL',''],['returnUrl','Return URL','']] },
    { provider:'stripe', label:'Stripe', description:'Stripe checkout for card subscription payments.', fields:[['publicKey','Publishable Key',''],['secretKey','Secret Key','',true],['webhookSecret','Webhook Secret','',true],['successUrl','Success URL',''],['cancelUrl','Cancel URL','']] }
];

function platformProviderConfig(provider, providerSettings) {
    return (providerSettings || {})?.providers?.[provider] || {};
}

function renderPlatformPaymentAgentFields(provider, fields, providerSettings) {
    const cfg = platformProviderConfig(provider, providerSettings);
    return fields.map(([name, label, placeholder, secret]) => `<label class="text-sm">${escapeHtml(label)}<input ${secret ? 'type="password" autocomplete="off"' : ''} data-platform-provider-field="${escapeHtml(name)}" class="mt-1 w-full rounded-lg border bg-background px-3 py-2" placeholder="${secret ? 'Leave blank to keep existing' : escapeHtml(placeholder || '')}" value="${secret ? '' : escapeHtml(cfg[name] || '')}"></label>`).join('');
}

function renderPlatformPaymentAgents(providerSettings = {}) {
    providerSettings = providerSettings || {};
    const activeProvider = providerSettings.activeProvider || providerSettings.defaultProvider || '';
    const activeLabel = (PLATFORM_PAYMENT_AGENT_DEFS.find(a => a.provider === activeProvider) || {}).label || 'None selected';
    const methodDefaults = (provider) => provider === 'mpesa' ? ['mobile_money'] : provider === 'stripe' ? ['card'] : ['mobile_money','card','bank'];
    const methodChecks = (provider) => {
        const cfg = platformProviderConfig(provider, providerSettings);
        const methods = Array.isArray(cfg.methods) && cfg.methods.length ? cfg.methods : methodDefaults(provider);
        const checked = m => methods.includes(m) ? 'checked' : '';
        return `<div class="payment-lock-method-checks"><label><input type="checkbox" data-platform-provider-method="mobile_money" ${checked('mobile_money')}> Mobile Money</label><label><input type="checkbox" data-platform-provider-method="card" ${checked('card')}> Card Payments</label><label><input type="checkbox" data-platform-provider-method="bank" ${checked('bank')}> Bank Transfer</label></div>`;
    };
    const row = (agent) => {
        const active = activeProvider === agent.provider;
        return `<details class="payment-lock-provider-card ${active ? 'active' : ''}" data-platform-provider="${agent.provider}" ${active ? 'open' : ''}>
            <summary class="payment-lock-provider-summary"><span class="payment-lock-radio">${active ? '●' : '○'}</span><span><strong>${escapeHtml(agent.label)}</strong><small>${escapeHtml(agent.description)}</small></span><em>${active ? 'Active' : 'Set Up'}</em></summary>
            <div class="payment-lock-provider-body">
                <div class="payment-lock-exclusive-note">Only one platform provider can be active. Saving this provider as active disables all other providers automatically. M-Pesa is treated exactly like every other provider.</div>
                <label class="flex items-center gap-2 text-sm"><input type="checkbox" data-platform-provider-enabled ${active ? 'checked' : ''}> Make this the active platform provider</label>
                <div class="grid gap-3 md:grid-cols-3 mt-3">${renderPlatformPaymentAgentFields(agent.provider, agent.fields, providerSettings)}</div>
                <h4 class="payment-lock-subtitle">Platform payment methods allowed</h4>
                ${methodChecks(agent.provider)}
                <div class="mt-3 flex justify-end"><button onclick="savePlatformPaymentAgent('${agent.provider}')" class="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm">Save ${escapeHtml(agent.label)}</button></div>
            </div>
        </details>`;
    };
    return `<div class="rounded-xl border bg-card p-6 payment-lock-settings-card"><h3 class="font-semibold mb-2">Platform Payment Providers</h3><p class="text-xs text-muted-foreground mb-4">All providers are equal. Super Admin chooses exactly one active provider for ShuleAI subscriptions and platform add-ons. Schools and parents never see private provider credentials.</p><div class="payment-lock-active-banner"><strong>Active Provider:</strong> ${escapeHtml(activeLabel)}<span>Other providers are automatically disabled.</span></div><div class="grid gap-3 mt-4">${PLATFORM_PAYMENT_AGENT_DEFS.map(row).join('')}</div></div>`;
}
async function renderSuperAdminPlatformPayments() {
    let settings = {}, providerSettings = null, queue = [], error = '';
    try {
        const [settingsRes, providersRes, queueRes] = await Promise.all([
            api.payments.getPlatformSettings().catch(e => ({ success:false, data:{}, message:e.message })),
            (api.payments.getPlatformProviders ? api.payments.getPlatformProviders() : apiRequest('/api/payments/superadmin/providers')).catch(e => ({ success:false, data:null, message:e.message })),
            api.payments.getPlatformManualQueue().catch(e => ({ success:false, data:[], message:e.message }))
        ]);
        settings = settingsRes.data || {};
        providerSettings = providersRes.data || null;
        queue = Array.isArray(queueRes.data) ? queueRes.data : (queueRes.data?.payments || queueRes.data?.requests || []);
        if (settingsRes.message || providersRes.message || queueRes.message) error = [settingsRes.message, providersRes.message, queueRes.message].filter(Boolean).join(' - ');
    } catch (e) { error = e.message || 'Could not load platform payments.'; }
    const d = settings.darajaCredentials || {};
    const mode = settings.paymentMode || 'manual';
    const queueRows = queue.length ? queue.map(p => {
        const who = p.schoolName || p.parentName || p.Parent?.User?.name || p.Student?.User?.name || p.User?.name || p.schoolCode || 'Platform payment';
        const ref = p.reference || p.mpesaCode || p.transactionCode || p.transactionId || '';
        return `<tr class="border-t"><td class="p-3"><div class="font-medium">${escapeHtml(who)}</div><div class="text-xs text-muted-foreground">${escapeHtml(p.ownerType || p.paymentType || 'subscription')} • ${escapeHtml(p.planName || p.planCode || p.plan || '')}</div></td><td class="p-3 font-mono text-xs">${escapeHtml(ref)}</td><td class="p-3">KES ${Number(p.amount || 0).toLocaleString()}</td><td class="p-3"><span class="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-700">${escapeHtml(p.status || 'pending')}</span></td><td class="p-3">${typeof formatDate === 'function' ? formatDate(p.createdAt) : (p.createdAt || '')}</td><td class="p-3 text-right space-x-2"><button onclick="reviewPlatformManualPayment('${p.id}','approve')" class="px-3 py-1 rounded-lg bg-green-600 text-white text-xs">Approve</button><button onclick="reviewPlatformManualPayment('${p.id}','reject')" class="px-3 py-1 rounded-lg bg-red-600 text-white text-xs">Reject</button></td></tr>`;
    }).join('') : '<tr><td colspan="6" class="p-8 text-center text-muted-foreground">No platform manual payment requests pending.</td></tr>';
    return `
    <div class="space-y-6 animate-fade-in">
      <div><h2 class="text-2xl font-bold">Platform Payment Options</h2><p class="text-sm text-muted-foreground">Configure Shule AI collection options for school subscriptions and parent/student subscriptions, then approve manual payment references from the queue below.</p></div>
      ${error ? `<div class="rounded-xl border border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 p-4 text-sm text-yellow-700 dark:text-yellow-300">${escapeHtml(error)}</div>` : ''}
      <div class="grid gap-4 lg:grid-cols-3">
        <div class="rounded-xl border bg-card p-6 lg:col-span-1">
          <h3 class="font-semibold mb-4">Platform Payment Settings</h3>
          <label class="text-sm">Mode<select id="platform-payment-mode" class="mt-1 w-full rounded-lg border bg-background px-3 py-2"><option value="manual" ${mode==='manual'?'selected':''}>Manual Reference only</option><option value="daraja" ${mode==='daraja'?'selected':''}>M-Pesa STK only</option><option value="both" ${mode==='both'?'selected':''}>Both Manual + M-Pesa</option></select></label>
          <label class="mt-3 flex gap-2 items-center text-sm"><input id="platform-parent-enabled" type="checkbox" ${settings.parentSubscriptionsEnabled !== false ? 'checked' : ''}> Parent subscriptions enabled</label>
          <label class="mt-2 flex gap-2 items-center text-sm"><input id="platform-school-enabled" type="checkbox" ${settings.schoolSubscriptionsEnabled !== false ? 'checked' : ''}> School/admin subscriptions enabled</label>
        </div>
        <div class="rounded-xl border bg-card p-6 lg:col-span-2">
          <h3 class="font-semibold mb-4">Manual M-Pesa / Shule AI Account Details</h3>
          <div class="grid gap-3 md:grid-cols-2">
            <label class="text-sm">Account Name<input id="platform-account-name" value="${escapeHtml(settings.accountName || 'Shule AI')}" class="mt-1 w-full rounded-lg border bg-background px-3 py-2"></label>
            <label class="text-sm">Paybill<input id="platform-paybill" value="${escapeHtml(settings.paybill || settings.shortcode || '')}" class="mt-1 w-full rounded-lg border bg-background px-3 py-2"></label>
            <label class="text-sm">Till Number<input id="platform-till" value="${escapeHtml(settings.till || '')}" class="mt-1 w-full rounded-lg border bg-background px-3 py-2"></label>
            <label class="text-sm">Account Reference Format<input id="platform-ref-format" value="${escapeHtml(settings.referenceFormat || 'SHULEAI-{schoolCode}/{studentId}')}" class="mt-1 w-full rounded-lg border bg-background px-3 py-2"></label>
            <label class="text-sm md:col-span-2">Manual Instructions<textarea id="platform-manual-instructions" rows="3" class="mt-1 w-full rounded-lg border bg-background px-3 py-2">${escapeHtml(settings.manualInstructions || 'Pay to Shule AI, then submit the M-Pesa code for Super Admin approval.')}</textarea></label>
          </div>
        </div>
      </div>
      <div class="rounded-xl border bg-card p-6">
        <h3 class="font-semibold mb-2">Subscription Amounts Shule AI Collects</h3>
        <p class="text-xs text-muted-foreground mb-4">These prices sync to parent dashboards, school/admin billing screens, STK amounts and manual approval requests after saving.</p>
        <div class="grid gap-4 lg:grid-cols-2">
          <div>
            <h4 class="font-semibold mb-3">Parent / Child Subscription Plans</h4>
            <div class="grid gap-3">
              ${renderPlatformPlanInputs('parent', settings.parentPlans || [])}
            </div>
          </div>
          <div>
            <h4 class="font-semibold mb-3">School / Admin Subscription Plans</h4>
            <div class="grid gap-3">
              ${renderPlatformPlanInputs('school', settings.schoolPlans || [])}
            </div>
          </div>
        </div>
      </div>

      <div class="rounded-xl border bg-card p-6">
        <h3 class="font-semibold mb-4">Daraja STK Credentials</h3>
        <div class="grid gap-3 md:grid-cols-3">
          <label class="text-sm">Environment<select id="platform-daraja-env" class="mt-1 w-full rounded-lg border bg-background px-3 py-2"><option value="sandbox" ${(d.mode||'sandbox')==='sandbox'?'selected':''}>Sandbox</option><option value="production" ${d.mode==='production'?'selected':''}>Production</option></select></label>
          <label class="text-sm">Consumer Key<input id="platform-daraja-key" value="${escapeHtml(d.consumerKey || '')}" class="mt-1 w-full rounded-lg border bg-background px-3 py-2"></label>
          <label class="text-sm">Consumer Secret<input id="platform-daraja-secret" type="password" value="${escapeHtml(d.consumerSecret || '')}" class="mt-1 w-full rounded-lg border bg-background px-3 py-2"></label>
          <label class="text-sm">Shortcode<input id="platform-daraja-shortcode" value="${escapeHtml(d.shortcode || '')}" class="mt-1 w-full rounded-lg border bg-background px-3 py-2"></label>
          <label class="text-sm">Passkey<input id="platform-daraja-passkey" type="password" value="${escapeHtml(d.passkey || '')}" class="mt-1 w-full rounded-lg border bg-background px-3 py-2"></label>
          <label class="text-sm">Transaction Type<input id="platform-daraja-transaction-type" value="${escapeHtml(d.transactionType || 'CustomerPayBillOnline')}" class="mt-1 w-full rounded-lg border bg-background px-3 py-2"></label>
          <label class="text-sm md:col-span-3">Callback URL<input id="platform-daraja-callback" value="${escapeHtml(d.callbackUrl || '')}" class="mt-1 w-full rounded-lg border bg-background px-3 py-2"></label>
        </div>
        <div class="mt-4 flex justify-end"><button onclick="savePlatformPaymentSettings()" class="px-5 py-2 rounded-lg bg-primary text-primary-foreground">Save Platform Payment Settings</button></div>
      </div>
      ${renderPlatformPaymentAgents(providerSettings)}
      <div class="rounded-xl border bg-card overflow-hidden"><div class="p-4 border-b bg-muted/30"><h3 class="font-semibold">Manual Approval Queue</h3><p class="text-xs text-muted-foreground">Approve school/admin subscriptions and parent child-subscription references submitted manually.</p></div><table class="w-full text-sm"><thead class="bg-muted/40"><tr><th class="p-3 text-left">School/Parent</th><th class="p-3 text-left">Reference</th><th class="p-3 text-left">Amount</th><th class="p-3 text-left">Status</th><th class="p-3 text-left">Date</th><th class="p-3 text-right">Actions</th></tr></thead><tbody>${queueRows}</tbody></table></div>
    </div>`;
}

// ============ MAIN DASHBOARD ============
function renderSuperAdminDashboard() {
    const data = dashboardData || {};
    const recentSchools = [...(data.pendingSchools || []), ...(data.schools || [])].slice(0, 5);
    const recentActivityRows = recentSchools.length ? recentSchools.map(s => `<div class="p-4 flex items-center gap-4 hover:bg-accent/50 transition-colors"><div class="h-10 w-10 rounded-full ${s.status === 'active' ? 'bg-green-100' : 'bg-yellow-100'} flex items-center justify-center"><i data-lucide="${s.status === 'active' ? 'check-circle' : 'clock'}" class="h-5 w-5 ${s.status === 'active' ? 'text-green-600' : 'text-yellow-600'}"></i></div><div class="flex-1"><p class="text-sm font-medium">${s.status === 'active' ? 'School Active' : 'School Registration'}</p><p class="text-xs text-muted-foreground">${escapeHtml(s.officialSchoolName || s.name || s.schoolName || 'Unnamed School')} • ${escapeHtml(s.shortCode || s.schoolId || '')}</p></div><span class="text-xs text-muted-foreground">${typeof formatDate === 'function' ? formatDate(s.createdAt || s.updatedAt) : (s.createdAt || '')}</span></div>`).join('') : '<div class="p-6 text-sm text-muted-foreground">No platform activity found yet.</div>';
    return `
        <div class="space-y-6 animate-fade-in">
            <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div class="rounded-xl border bg-card p-6 card-hover">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-muted-foreground">Total Schools</p>
                            <h3 class="text-2xl font-bold mt-1" id="total-schools">${data.schools?.length || 0}</h3>
                            <p class="text-xs text-green-600 mt-1 flex items-center gap-1">
                                <i data-lucide="trending-up" class="h-3 w-3"></i>
                                <span id="new-schools">${data.pendingSchools?.length || 0}</span> pending approval
                            </p>
                        </div>
                        <div class="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                            <i data-lucide="building-2" class="h-6 w-6 text-blue-600"></i>
                        </div>
                    </div>
                </div>
                <div class="rounded-xl border bg-card p-6 card-hover">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-muted-foreground">Active Schools</p>
                            <h3 class="text-2xl font-bold mt-1" id="active-admins">${data.schools?.filter(s => s.status === 'active').length || 0}</h3>
                            <p class="text-xs text-green-600 mt-1 flex items-center gap-1">
                                <i data-lucide="trending-up" class="h-3 w-3"></i>
                                <span id="new-admins">${data.schools?.filter(s => s.status !== 'active').length || 0}</span> inactive
                            </p>
                        </div>
                        <div class="h-12 w-12 rounded-lg bg-emerald-100 flex items-center justify-center">
                            <i data-lucide="check-circle" class="h-6 w-6 text-emerald-600"></i>
                        </div>
                    </div>
                </div>
                <div class="rounded-xl border bg-card p-6 card-hover">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-muted-foreground">Pending Approvals</p>
                            <h3 class="text-2xl font-bold mt-1" id="pending-approvals">${data.pendingSchools?.length || 0}</h3>
                            <p class="text-xs text-yellow-600 mt-1 flex items-center gap-1">
                                <i data-lucide="clock" class="h-3 w-3"></i>
                                Awaiting review
                            </p>
                        </div>
                        <div class="h-12 w-12 rounded-lg bg-amber-100 flex items-center justify-center">
                            <i data-lucide="alert-circle" class="h-6 w-6 text-amber-600"></i>
                        </div>
                    </div>
                </div>
                <div class="rounded-xl border bg-card p-6 card-hover">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-muted-foreground">Revenue (MTD)</p>
                            <h3 class="text-2xl font-bold mt-1" id="revenue">$0</h3>
                            <p class="text-xs text-green-600 mt-1 flex items-center gap-1">
                                <i data-lucide="trending-up" class="h-3 w-3"></i>
                                +<span id="revenue-growth">0</span>% from last month
                            </p>
                        </div>
                        <div class="h-12 w-12 rounded-lg bg-emerald-100 flex items-center justify-center">
                            <i data-lucide="dollar-sign" class="h-6 w-6 text-emerald-600"></i>
                        </div>
                    </div>
                </div>
            </div>
            <div class="grid gap-4 lg:grid-cols-2">
                <div class="rounded-xl border bg-card p-6">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="font-semibold">School Growth Trends</h3>
                        <select class="text-sm border rounded-md px-2 py-1 bg-background" onchange="updateSuperAdminChart(this.value)">
                            <option value="year">This Year</option>
                            <option value="last-year">Last Year</option>
                        </select>
                    </div>
                    <div class="chart-container h-64">
                        <canvas id="superadmin-enrollmentChart"></canvas>
                    </div>
                </div>
                <div class="rounded-xl border bg-card p-6">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="font-semibold">School Distribution</h3>
                        <select class="text-sm border rounded-md px-2 py-1 bg-background" onchange="updateSuperAdminPieChart(this.value)">
                            <option value="level">By Level</option>
                            <option value="region">By Region</option>
                        </select>
                    </div>
                    <div class="chart-container h-64">
                        <canvas id="superadmin-gradeChart"></canvas>
                    </div>
                </div>
            </div>
            <div class="rounded-xl border bg-card">
                <div class="p-4 border-b">
                    <h3 class="font-semibold">Recent Activity</h3>
                </div>
                <div class="divide-y">${recentActivityRows}</div>
            </div>
        </div>
    `;
}

// ============ SCHOOLS MANAGEMENT ============
async function renderSuperAdminSchools() {
    try {
        const schools = await loadAllSchools();
        return `
            <div class="space-y-6 animate-fade-in">
                <div class="flex justify-between items-center">
                    <h2 class="text-2xl font-bold">School Management</h2>
                    <button onclick="showCreateSchoolModal()" class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 flex items-center gap-2">
                        <i data-lucide="plus" class="h-4 w-4"></i>
                        Add New School
                    </button>
                </div>
                <div id="schools-table-container" class="rounded-xl border bg-card overflow-hidden">
                    ${renderSchoolsTable(schools)}
                </div>
            </div>
        `;
    } catch (error) {
        return `<div class="text-center py-12 text-red-500">Error loading schools: ${error.message}</div>`;
    }
}

async function renderSuperAdminPendingSchools() {
    try {
        const schools = await loadPendingSchools();
        return `
            <div class="space-y-6 animate-fade-in">
                <h2 class="text-2xl font-bold">Pending School Approvals</h2>
                <div id="pending-schools-container" class="rounded-xl border bg-card overflow-hidden">
                    ${renderPendingSchoolsTable(schools)}
                </div>
            </div>
        `;
    } catch (error) {
        return `<div class="text-center py-12 text-red-500">Error loading pending schools: ${error.message}</div>`;
    }
}

// ============ NAME CHANGE REQUESTS ============
async function renderSuperAdminNameChangeRequests() {
    try {
        const requests = await loadNameChangeRequests();
        return `
            <div class="space-y-6 animate-fade-in">
                <div class="flex justify-between items-center">
                    <h2 class="text-2xl font-bold">Name Change Requests</h2>
                    <div class="text-sm text-muted-foreground">
                        <span class="font-medium">${requests.length}</span> pending requests
                    </div>
                </div>
                <div class="rounded-xl border bg-card overflow-hidden">
                    ${renderNameChangeRequestsTable(requests)}
                </div>
                <div class="rounded-xl border bg-card">
                    <div class="p-4 border-b bg-muted/30">
                        <h3 class="font-semibold">Request History</h3>
                    </div>
                    <div class="p-4 text-center text-muted-foreground">
                        <i data-lucide="history" class="h-8 w-8 mx-auto mb-2 opacity-50"></i>
                        <p class="text-sm">Recent request history will appear here</p>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        return `<div class="text-center py-12 text-red-500">Error loading name change requests: ${error.message}</div>`;
    }
}

// ============ PLATFORM HEALTH ============
async function renderSuperAdminHealth() {
    let status = {}, metrics = {}, events = [];
    try {
        const [statusRes, metricsRes, eventsRes] = await Promise.all([
            apiRequest('/api/super-admin/system/status').catch(e => ({ data:{ error:e.message } })),
            apiRequest('/api/super-admin/system/metrics').catch(e => ({ data:{ error:e.message } })),
            apiRequest('/api/super-admin/system/events').catch(e => ({ data:[] }))
        ]);
        status = statusRes.data || {};
        metrics = metricsRes.data || {};
        events = Array.isArray(eventsRes.data) ? eventsRes.data : [];
    } catch (e) { status = { error:e.message }; }
    const okDot = (state) => String(state || '').toLowerCase().includes('operational') || String(state || '').toLowerCase().includes('connected') ? 'bg-green-500' : 'bg-yellow-500';
    const pct = (n) => Number.isFinite(Number(n)) ? Math.max(0, Math.min(100, Number(n))) : null;
    const cpu = pct(metrics.cpuUsage);
    const mem = pct(metrics.memoryUsage);
    const storage = pct(metrics.storagePercent);
    const eventRows = events.length ? events.map(ev => `<div class="p-4 flex items-center gap-4 hover:bg-accent/50 transition-colors"><div class="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center"><i data-lucide="activity" class="h-5 w-5 text-blue-600"></i></div><div class="flex-1"><p class="text-sm font-medium">${escapeHtml(ev.title || ev.type || 'Platform event')}</p><p class="text-xs text-muted-foreground">${escapeHtml(ev.description || ev.message || '')}</p></div><span class="text-xs text-muted-foreground">${typeof formatDate === 'function' ? formatDate(ev.timestamp || ev.createdAt) : (ev.timestamp || '')}</span></div>`).join('') : `<div class="p-6 text-sm text-muted-foreground">No recent platform events found.</div>`;
    return `
        <div class="space-y-6 animate-fade-in">
            <div class="flex justify-between items-center">
                <h2 class="text-2xl font-bold">Platform Health</h2>
                <button onclick="showDashboardSection('platform-health')" class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 flex items-center gap-2"><i data-lucide="refresh-cw" class="h-4 w-4"></i>Refresh</button>
            </div>
            <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div class="rounded-xl border bg-card p-6"><div class="flex items-center justify-between"><div><p class="text-sm font-medium text-muted-foreground">Database</p><div class="flex items-center gap-2 mt-1"><div class="h-3 w-3 rounded-full ${okDot(status.database)}"></div><h3 class="text-xl font-bold">${escapeHtml(status.database || 'Unknown')}</h3></div><p class="text-xs text-muted-foreground mt-1">Last checked: ${status.databaseLastCheck ? (typeof formatDate === 'function' ? formatDate(status.databaseLastCheck) : status.databaseLastCheck) : 'not available'}</p></div><div class="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center"><i data-lucide="database" class="h-6 w-6 text-green-600"></i></div></div></div>
                <div class="rounded-xl border bg-card p-6"><div class="flex items-center justify-between"><div><p class="text-sm font-medium text-muted-foreground">API Server</p><div class="flex items-center gap-2 mt-1"><div class="h-3 w-3 rounded-full ${okDot(status.api)}"></div><h3 class="text-xl font-bold">${escapeHtml(status.api || 'Unknown')}</h3></div><p class="text-xs text-muted-foreground mt-1">Response: ${status.apiLatency !== undefined ? `${Number(status.apiLatency)}ms` : 'not available'}</p></div><div class="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center"><i data-lucide="server" class="h-6 w-6 text-green-600"></i></div></div></div>
                <div class="rounded-xl border bg-card p-6"><div class="flex items-center justify-between"><div><p class="text-sm font-medium text-muted-foreground">Database Storage</p><div class="mt-1"><h3 class="text-xl font-bold">${metrics.storageUsed !== undefined ? `${Number(metrics.storageUsed).toFixed(2)}GB` : 'Not available'}</h3><div class="w-full h-2 bg-muted rounded-full mt-2 overflow-hidden"><div class="h-full rounded-full bg-green-500" style="width:${storage === null ? 0 : storage}%"></div></div><p class="text-xs text-muted-foreground mt-1">${storage === null ? 'Host quota not exposed' : `${storage}% Used`}</p></div></div><div class="h-12 w-12 rounded-lg bg-amber-100 flex items-center justify-center"><i data-lucide="hard-drive" class="h-6 w-6 text-amber-600"></i></div></div></div>
                <div class="rounded-xl border bg-card p-6"><div class="flex items-center justify-between"><div><p class="text-sm font-medium text-muted-foreground">WebSocket</p><div class="flex items-center gap-2 mt-1"><div class="h-3 w-3 rounded-full ${okDot(status.websocket)}"></div><h3 class="text-xl font-bold">${escapeHtml(status.websocket || 'Unknown')}</h3></div><p class="text-xs text-muted-foreground mt-1">Active connections: ${Number(status.activeConnections || 0)}</p></div><div class="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center"><i data-lucide="zap" class="h-6 w-6 text-green-600"></i></div></div></div>
            </div>
            <div class="grid gap-4 md:grid-cols-2">
                <div class="rounded-xl border bg-card p-6"><h3 class="font-semibold mb-4">CPU Load</h3><div class="flex mb-2 items-center justify-between"><span class="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full bg-blue-100 text-blue-700">Current</span><span class="text-xs font-semibold inline-block text-blue-600">${cpu === null ? 'Not available' : `${cpu}%`}</span></div><div class="overflow-hidden h-3 mb-4 text-xs flex rounded bg-blue-100"><div style="width:${cpu || 0}%" class="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 transition-all duration-500"></div></div><p class="text-xs text-muted-foreground">Host CPU is estimated from runtime load average when available.</p></div>
                <div class="rounded-xl border bg-card p-6"><h3 class="font-semibold mb-4">Memory Usage</h3><div class="flex mb-2 items-center justify-between"><span class="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full bg-purple-100 text-purple-700">Current</span><span class="text-xs font-semibold inline-block text-purple-600">${mem === null ? 'Not available' : `${mem}%`}</span></div><div class="overflow-hidden h-3 mb-4 text-xs flex rounded bg-purple-100"><div style="width:${mem || 0}%" class="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-purple-500 transition-all duration-500"></div></div><div class="flex justify-between text-xs text-muted-foreground"><span>Used: ${metrics.memoryUsed !== undefined ? `${metrics.memoryUsed}GB` : 'N/A'}</span><span>Total: ${metrics.memoryTotal !== undefined ? `${metrics.memoryTotal}GB` : 'N/A'}</span></div></div>
            </div>
            <div class="rounded-xl border bg-card"><div class="p-4 border-b"><h3 class="font-semibold">Recent Platform Events</h3></div><div class="divide-y">${eventRows}</div></div>
        </div>`;
}

// ============ PLATFORM SETTINGS ============
function renderSuperAdminSettings() {
    const settings = window.platformSettings || {};
    return `
        <div class="space-y-6 animate-fade-in">
            <h2 class="text-2xl font-bold">Platform Settings</h2>
            <p class="text-sm text-muted-foreground">Configure global platform settings. Changes affect all schools.</p>
            <div class="grid gap-6">
                <div class="rounded-xl border bg-card p-6">
                    <h3 class="font-semibold mb-4">General Settings</h3>
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium mb-1">Platform Name</label>
                            <input type="text" id="platform-name" value="${settings.platformName || 'ShuleAI'}" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary transition-all">
                        </div>
                        <div>
                            <label class="block text-sm font-medium mb-1">Default Curriculum for New Schools</label>
                            <select id="default-curriculum" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                                <option value="cbc" ${settings.defaultCurriculum === 'cbc' ? 'selected' : ''}>CBC (Competency Based Curriculum)</option>
                                <option value="844" ${settings.defaultCurriculum === '844' ? 'selected' : ''}>8-4-4 System</option>
                                <option value="british" ${settings.defaultCurriculum === 'british' ? 'selected' : ''}>British Curriculum</option>
                                <option value="american" ${settings.defaultCurriculum === 'american' ? 'selected' : ''}>American Curriculum</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium mb-1">Name Change Fee ($)</label>
                            <input type="number" id="name-change-fee" value="${settings.nameChangeFee || 50}" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                        </div>
                    </div>
                </div>
                <div class="rounded-xl border bg-card p-6">
                    <h3 class="font-semibold mb-4">Platform Controls</h3>
                    <div class="space-y-4">
                        <div class="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                            <div>
                                <p class="font-medium">Maintenance Mode</p>
                                <p class="text-sm text-muted-foreground">When enabled, only super admins can access the platform</p>
                            </div>
                            <button id="maintenance-mode" onclick="toggleMaintenanceMode()" class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors bg-muted">
                                <span class="translate-x-1 inline-block h-4 w-4 transform rounded-full bg-white transition-transform"></span>
                            </button>
                        </div>
                        <div class="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                            <div>
                                <p class="font-medium">Allow New Registrations</p>
                                <p class="text-sm text-muted-foreground">Allow new schools to sign up</p>
                            </div>
                            <button id="allow-registrations" onclick="toggleNewRegistrations()" class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors bg-primary">
                                <span class="translate-x-6 inline-block h-4 w-4 transform rounded-full bg-white transition-transform"></span>
                            </button>
                        </div>
                    </div>
                </div>
                <div class="rounded-xl border bg-card p-6">
                    <h3 class="font-semibold mb-4">Data Management</h3>
                    <div class="space-y-4">
                        <button onclick="exportPlatformData()" class="w-full py-2 border rounded-lg hover:bg-accent transition-colors flex items-center justify-center gap-2">
                            <i data-lucide="download" class="h-4 w-4"></i> Download Platform Data CSV
                        </button>
                        <button onclick="clearPlatformCache()" class="w-full py-2 border rounded-lg hover:bg-accent transition-colors flex items-center justify-center gap-2 text-yellow-600">
                            <i data-lucide="trash-2" class="h-4 w-4"></i> Clear Platform Cache
                        </button>
                        <button onclick="runSystemBackup()" class="w-full py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
                            <i data-lucide="database-backup" class="h-4 w-4"></i> Run System Backup
                        </button>
                    </div>
                </div>
                <div class="flex justify-end gap-3">
                    <button onclick="resetPlatformSettings()" class="px-6 py-3 border rounded-lg hover:bg-accent transition-colors">Reset to Default</button>
                    <button onclick="saveSuperAdminSettings()" class="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2">
                        <i data-lucide="save" class="h-4 w-4"></i> Save All Settings
                    </button>
                </div>
            </div>
        </div>
    `;
}


async function renderSuperAdminBulkSms() {
    let cfg = {}, schools = [], history = [], error = '';
    try {
        const [cfgRes, schoolsRes, historyRes] = await Promise.all([
            api.sms.getConfig().catch(e => ({ data:{}, message:e.message })),
            api.superAdmin.getSchools().catch(e => ({ data:[], message:e.message })),
            api.sms.getHistory().catch(e => ({ data:[], message:e.message }))
        ]);
        cfg = cfgRes.data || {};
        schools = Array.isArray(schoolsRes.data) ? schoolsRes.data : [];
        history = Array.isArray(historyRes.data) ? historyRes.data : [];
        error = [cfgRes.message, schoolsRes.message, historyRes.message].filter(Boolean).join(' • ');
    } catch(e) { error = e.message || 'Could not load Bulk SMS settings.'; }
    const tokens = cfg.schoolTokens || {};
    const used = history.reduce((sum, r) => sum + Number(r.tokensUsed || r.recipientCount || 0), 0);
    const remaining = Object.values(tokens).reduce((sum, v) => sum + Number(v || 0), 0);
    const schoolOptions = schools.map(s => `<option value="${escapeHtml(s.schoolId || s.shortCode || '')}">${escapeHtml(s.officialSchoolName || s.schoolName || s.name || s.shortCode || 'School')} • ${escapeHtml(s.schoolId || s.shortCode || '')}</option>`).join('');
    const allocationHistory = Array.isArray(cfg.allocationHistory) ? cfg.allocationHistory : [];
    const rows = schools.length ? schools.map(s => {
        const code = s.schoolId || s.shortCode || '';
        const schoolUsed = history.filter(h => String(h.schoolCode) === String(code)).reduce((sum, r) => sum + Number(r.tokensUsed || r.recipientCount || 0), 0);
        return `<tr class="border-t"><td class="p-3"><div class="font-medium">${escapeHtml(s.officialSchoolName || s.schoolName || s.name || 'School')}</div><div class="text-xs text-muted-foreground">${escapeHtml(code)}</div></td><td class="p-3 font-semibold">${Number(tokens[code] || 0).toLocaleString()}</td><td class="p-3">${schoolUsed.toLocaleString()}</td><td class="p-3"><div class="space-y-2"><input id="sms-token-${escapeHtml(code)}" type="number" min="0" value="${Number(tokens[code] || 0)}" class="w-28 rounded-lg border bg-background px-3 py-2 text-sm"><input id="sms-reason-${escapeHtml(code)}" placeholder="Reason/reference" class="w-44 rounded-lg border bg-background px-3 py-2 text-xs"></div></td><td class="p-3 text-right"><button onclick="saveSchoolSmsTokens('${escapeHtml(code)}')" class="px-3 py-1 rounded-lg bg-primary text-primary-foreground text-xs">Allocate</button></td></tr>`;
    }).join('') : '<tr><td colspan="5" class="p-8 text-center text-muted-foreground">No schools found.</td></tr>';
    const allocationRows = allocationHistory.length ? allocationHistory.slice(0,100).map(a => `<tr class="border-t"><td class="p-3">${escapeHtml(a.schoolName || a.schoolCode || 'School')}</td><td class="p-3 font-semibold ${Number(a.quantity||0)>=0?'text-green-600':'text-red-600'}">${Number(a.quantity||0)>=0?'+':''}${Number(a.quantity||0).toLocaleString()}</td><td class="p-3">${Number(a.previousBalance||0).toLocaleString()} → ${Number(a.newBalance||0).toLocaleString()}</td><td class="p-3">${escapeHtml(a.reason||'')}</td><td class="p-3">${escapeHtml(a.allocatedByName||'Super Admin')}</td><td class="p-3">${typeof formatDate==='function'?formatDate(a.createdAt):(a.createdAt||'')}</td></tr>`).join('') : '<tr><td colspan="6" class="p-8 text-center text-muted-foreground">No allocation history yet.</td></tr>';
    const historyRows = history.length ? history.slice(0,80).map(h => `<tr class="border-t"><td class="p-3">${escapeHtml(h.schoolName || h.schoolCode || 'School')}</td><td class="p-3">${escapeHtml(h.audience || '')}</td><td class="p-3 max-w-md truncate">${escapeHtml(h.message || '')}</td><td class="p-3">${Number(h.successCount || h.recipientCount || 0).toLocaleString()}</td><td class="p-3">${Number(h.failedCount || 0).toLocaleString()}</td><td class="p-3">${Number(h.tokensUsed || h.recipientCount || 0).toLocaleString()}</td><td class="p-3">${typeof formatDate === 'function' ? formatDate(h.createdAt) : (h.createdAt || '')}</td></tr>`).join('') : '<tr><td colspan="7" class="p-8 text-center text-muted-foreground">No SMS history yet.</td></tr>';
    return `<div class="space-y-6 animate-fade-in"><div><h2 class="text-2xl font-bold">Bulk SMS</h2><p class="text-sm text-muted-foreground">Super Admin controls platform SMS provider, token allocation, and usage monitoring. School admins only compose/send.</p></div>${error ? `<div class="rounded-xl border border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 p-4 text-sm text-yellow-700 dark:text-yellow-300">${escapeHtml(error)}</div>` : ''}<div class="grid gap-4 md:grid-cols-4"><div class="rounded-xl border bg-card p-5"><p class="text-sm text-muted-foreground">Total Allocated/Remaining</p><h3 class="text-2xl font-bold">${remaining.toLocaleString()}</h3></div><div class="rounded-xl border bg-card p-5"><p class="text-sm text-muted-foreground">Total Used</p><h3 class="text-2xl font-bold">${used.toLocaleString()}</h3></div><div class="rounded-xl border bg-card p-5"><p class="text-sm text-muted-foreground">Schools With Tokens</p><h3 class="text-2xl font-bold">${Object.keys(tokens).filter(k=>Number(tokens[k])>0).length}</h3></div><div class="rounded-xl border bg-card p-5"><p class="text-sm text-muted-foreground">Provider</p><h3 class="text-lg font-bold">${cfg.providerConfigured ? 'Configured' : 'Not configured'}</h3></div></div><div class="rounded-xl border bg-card p-6"><h3 class="font-semibold mb-4">Platform SMS Provider</h3><div class="grid gap-3 md:grid-cols-4"><label class="text-sm">Provider<input id="sms-provider" value="${escapeHtml(cfg.provider || '')}" placeholder="e.g. AfricasTalking" class="mt-1 w-full rounded-lg border bg-background px-3 py-2"></label><label class="text-sm md:col-span-2">API Key<input id="sms-api-key" type="password" placeholder="Leave blank to keep existing" class="mt-1 w-full rounded-lg border bg-background px-3 py-2"></label><label class="text-sm">Sender ID<input id="sms-sender-id" value="${escapeHtml(cfg.senderId || 'SHULEAI')}" class="mt-1 w-full rounded-lg border bg-background px-3 py-2"></label><label class="flex items-center gap-2 text-sm"><input id="sms-enabled" type="checkbox" ${cfg.enabledRaw || cfg.providerConfigured ? 'checked' : ''}> Enabled</label></div><div class="mt-4 flex justify-end"><button onclick="savePlatformSmsProvider()" class="px-5 py-2 rounded-lg bg-primary text-primary-foreground">Save Provider</button></div></div><div class="rounded-xl border bg-card overflow-hidden"><div class="p-4 border-b bg-muted/30"><h3 class="font-semibold">School Token Allocation</h3></div><table class="w-full text-sm"><thead class="bg-muted/40"><tr><th class="p-3 text-left">School</th><th class="p-3 text-left">Remaining Tokens</th><th class="p-3 text-left">Used</th><th class="p-3 text-left">Set Tokens</th><th class="p-3 text-right">Action</th></tr></thead><tbody>${rows}</tbody></table></div><div class="rounded-xl border bg-card overflow-hidden"><div class="p-4 border-b bg-muted/30"><h3 class="font-semibold">SMS Allocation History</h3><p class="text-xs text-muted-foreground">Every balance change is audited.</p></div><table class="w-full text-sm"><thead class="bg-muted/40"><tr><th class="p-3 text-left">School</th><th class="p-3 text-left">Change</th><th class="p-3 text-left">Balance</th><th class="p-3 text-left">Reason</th><th class="p-3 text-left">Allocated By</th><th class="p-3 text-left">Date</th></tr></thead><tbody>${allocationRows}</tbody></table></div><div class="rounded-xl border bg-card overflow-hidden"><div class="p-4 border-b bg-muted/30"><h3 class="font-semibold">SMS Usage History</h3></div><table class="w-full text-sm"><thead class="bg-muted/40"><tr><th class="p-3 text-left">School</th><th class="p-3 text-left">Audience</th><th class="p-3 text-left">Message</th><th class="p-3 text-left">Reached</th><th class="p-3 text-left">Failed</th><th class="p-3 text-left">Tokens</th><th class="p-3 text-left">Date</th></tr></thead><tbody>${historyRows}</tbody></table></div></div>`;
}
window.savePlatformPaymentAgent = async function(provider) {
    try {
        const card = document.querySelector(`[data-platform-provider="${provider}"]`);
        if (!card) throw new Error('Payment agent form was not found.');
        const config = {};
        card.querySelectorAll('[data-platform-provider-field]').forEach(input => {
            const key = input.getAttribute('data-platform-provider-field');
            const value = input.value?.trim() || '';
            if (value) config[key] = value;
        });
        const methods = [...card.querySelectorAll('[data-platform-provider-method]:checked')].map(input => input.getAttribute('data-platform-provider-method')).filter(Boolean);
        const makeActive = !!card.querySelector('[data-platform-provider-enabled]')?.checked;
        const payload = { provider, enabled: makeActive, isDefault: makeActive, active: makeActive, methods, config: { ...config, methods } };
        await (api.payments.savePlatformProvider ? api.payments.savePlatformProvider(payload) : apiRequest('/api/payments/superadmin/providers', { method:'PUT', body:JSON.stringify(payload) }));
        showToast?.('Platform payment agent saved', 'success');
        await showDashboardSection('platform-payments');
    } catch(e) { showToast?.(e.message || 'Could not save platform payment agent', 'error'); }
};

window.savePlatformPaymentSettings = async function() {
    try {
        const payload = {
            paymentMode: document.getElementById('platform-payment-mode')?.value || 'manual',
            parentSubscriptionsEnabled: !!document.getElementById('platform-parent-enabled')?.checked,
            schoolSubscriptionsEnabled: !!document.getElementById('platform-school-enabled')?.checked,
            accountName: document.getElementById('platform-account-name')?.value || 'Shule AI',
            paybill: document.getElementById('platform-paybill')?.value || '',
            till: document.getElementById('platform-till')?.value || '',
            referenceFormat: document.getElementById('platform-ref-format')?.value || '',
            manualInstructions: document.getElementById('platform-manual-instructions')?.value || '',
            darajaCredentials: {
                mode: document.getElementById('platform-daraja-env')?.value || 'sandbox',
                consumerKey: document.getElementById('platform-daraja-key')?.value || '',
                consumerSecret: document.getElementById('platform-daraja-secret')?.value || '',
                shortcode: document.getElementById('platform-daraja-shortcode')?.value || '',
                passkey: document.getElementById('platform-daraja-passkey')?.value || '',
                callbackUrl: document.getElementById('platform-daraja-callback')?.value || '',
                transactionType: document.getElementById('platform-daraja-transaction-type')?.value || 'CustomerPayBillOnline'
            },
            parentPlans: collectPlatformPlanInputs('parent'),
            schoolPlans: collectPlatformPlanInputs('school')
        };
        await api.payments.updatePlatformSettings(payload);
        showToast?.('Platform payment settings saved', 'success');
        await showDashboardSection('platform-payments');
    } catch(e) { showToast?.(e.message || 'Could not save platform payment settings', 'error'); }
};

window.reviewPlatformManualPayment = async function(paymentId, action) {
    const approve = action !== 'reject';
    const notes = prompt(approve ? 'Approval notes/reference confirmation:' : 'Reason for rejection:') || '';
    try {
        await api.payments.reviewPlatformManualPayment(paymentId, { action: approve ? 'approve' : 'reject', notes });
        showToast?.(approve ? 'Payment approved' : 'Payment rejected', 'success');
        await showDashboardSection('platform-payments');
    } catch(e) { showToast?.(e.message || 'Could not review payment', 'error'); }
};

window.savePlatformSmsProvider = async function() {
    try {
        const payload = {
            provider: document.getElementById('sms-provider')?.value || '',
            senderId: document.getElementById('sms-sender-id')?.value || 'SHULEAI',
            enabled: !!document.getElementById('sms-enabled')?.checked
        };
        const apiKey = document.getElementById('sms-api-key')?.value || '';
        if (apiKey) payload.apiKey = apiKey;
        await api.sms.saveConfig(payload);
        showToast?.('SMS provider settings saved', 'success');
        await showDashboardSection('sms');
    } catch(e) { showToast?.(e.message || 'Could not save SMS provider', 'error'); }
};

window.saveSchoolSmsTokens = async function(schoolCode) {
    try {
        const tokens = Number(document.getElementById(`sms-token-${schoolCode}`)?.value || 0);
        const reason = document.getElementById(`sms-reason-${schoolCode}`)?.value?.trim() || 'SMS bundle allocation';
        await api.sms.saveConfig({ schoolCode, tokens, reason });
        showToast?.('School SMS tokens updated', 'success');
        await showDashboardSection('sms');
    } catch(e) { showToast?.(e.message || 'Could not update school tokens', 'error'); }
};

// ============ HELPERS FOR SUPER ADMIN ============
function getEventIcon(type) {
    const icons = { system: 'settings', school: 'building-2', user: 'user-plus', error: 'alert-circle', warning: 'alert-triangle', success: 'check-circle', approval: 'check-circle', message: 'message-circle', duty: 'clock', attendance: 'calendar-check', payment: 'credit-card' };
    return icons[type] || 'activity';
}
function getEventIconBg(type) {
    const bgs = { system: 'bg-gray-100', school: 'bg-blue-100', user: 'bg-green-100', error: 'bg-red-100', warning: 'bg-amber-100', success: 'bg-green-100', approval: 'bg-green-100', message: 'bg-blue-100', duty: 'bg-amber-100', attendance: 'bg-purple-100', payment: 'bg-emerald-100' };
    return bgs[type] || 'bg-gray-100';
}
function getEventIconColor(type) {
    const colors = { system: 'text-gray-600', school: 'text-blue-600', user: 'text-green-600', error: 'text-red-600', warning: 'text-amber-600', success: 'text-green-600', approval: 'text-green-600', message: 'text-blue-600', duty: 'text-amber-600', attendance: 'text-purple-600', payment: 'text-emerald-600' };
    return colors[type] || 'text-gray-600';
}

// Global functions for UI actions
window.updateSuperAdminChart = function(value) { console.log('Chart update:', value); };
window.updateSuperAdminPieChart = function(value) { console.log('Pie chart update:', value); };
window.toggleMaintenanceMode = function() {
    const btn = document.getElementById('maintenance-mode');
    const isEnabled = btn.classList.contains('bg-primary');
    if (isEnabled) {
        btn.classList.remove('bg-primary'); btn.classList.add('bg-muted');
        btn.querySelector('span').classList.remove('translate-x-6'); btn.querySelector('span').classList.add('translate-x-1');
    } else {
        btn.classList.remove('bg-muted'); btn.classList.add('bg-primary');
        btn.querySelector('span').classList.remove('translate-x-1'); btn.querySelector('span').classList.add('translate-x-6');
    }
};
window.toggleNewRegistrations = function() {
    const btn = document.getElementById('allow-registrations');
    const isEnabled = btn.classList.contains('bg-primary');
    if (isEnabled) {
        btn.classList.remove('bg-primary'); btn.classList.add('bg-muted');
        btn.querySelector('span').classList.remove('translate-x-6'); btn.querySelector('span').classList.add('translate-x-1');
    } else {
        btn.classList.remove('bg-muted'); btn.classList.add('bg-primary');
        btn.querySelector('span').classList.remove('translate-x-1'); btn.querySelector('span').classList.add('translate-x-6');
    }
};
window.exportPlatformData = async function() {
    showLoading();
    try {
        const response = await api.superAdmin.exportData();
        downloadStructuredCsv(response.data, `Shule_AI_Platform_Export_${new Date().toISOString().split('T')[0]}.csv`);
        showToast('✅ Data exported successfully', 'success');
    } catch (error) { showToast('Failed to export data', 'error'); }
    finally { hideLoading(); }
};
window.clearPlatformCache = async function() {
    if (!confirm('⚠️ Clear all platform caches? This may temporarily slow down the system.')) return;
    showLoading();
    try {
        await api.superAdmin.clearCache();
        showToast('✅ Cache cleared successfully', 'success');
    } catch (error) { showToast('Failed to clear cache', 'error'); }
    finally { hideLoading(); }
};
window.runSystemBackup = async function() {
    showLoading();
    try {
        const response = await api.superAdmin.runBackup();
        showToast(`✅ Backup completed: ${response.data.filename}`, 'success');
    } catch (error) { showToast('Failed to run backup', 'error'); }
    finally { hideLoading(); }
};
window.resetPlatformSettings = async function() {
    if (!confirm('⚠️ Reset all platform settings to default? This cannot be undone.')) return;
    showLoading();
    try {
        await api.superAdmin.resetSettings();
        await loadSuperAdminSettings();
        showToast('✅ Settings reset to default', 'success');
    } catch (error) { showToast('Failed to reset settings', 'error'); }
    finally { hideLoading(); }
};
window.saveSuperAdminSettings = async function() {
    const platformName = document.getElementById('platform-name')?.value;
    const defaultCurriculum = document.getElementById('default-curriculum')?.value;
    const nameChangeFee = document.getElementById('name-change-fee')?.value;
    const maintenanceMode = document.getElementById('maintenance-mode')?.classList.contains('bg-primary');
    const allowNewRegistrations = document.getElementById('allow-registrations')?.classList.contains('bg-primary');
    showLoading();
    try {
        const response = await api.superAdmin.updatePlatformSettings({ platformName, defaultCurriculum, nameChangeFee: parseInt(nameChangeFee), maintenanceMode, allowNewRegistrations });
        if (response.success) {
            showToast('✅ Platform settings saved successfully', 'success');
            await showDashboardSection('settings');
        }
    } catch (error) {
        showToast(error.message || 'Failed to save settings', 'error');
    } finally { hideLoading(); }
};
window.loadSuperAdminSettings = async function() {
    try {
        const settings = await api.superAdmin.getPlatformSettings();
        window.platformSettings = settings.data;
        // populate form if needed
    } catch (error) { console.error('Error loading settings:', error); }
};

window.renderSuperAdminPlatformPayments = renderSuperAdminPlatformPayments;
