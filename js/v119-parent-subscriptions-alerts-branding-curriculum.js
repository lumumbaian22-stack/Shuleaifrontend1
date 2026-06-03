// Shule AI v119 parent child isolation + subscription tiers + logo stability + curriculum-aware dashboard polish.
(function(){
  'use strict';
  if (window.__v119ParentStabilityLoaded) return;
  window.__v119ParentStabilityLoaded = true;

  const DEFAULT_LOGO = 'assets/logo.png';
  const PARENT_TIERS = [
    { code:'child_basic', name:'Basic', amount:100, features:['Report cards','Attendance','Progress'] },
    { code:'child_premium', name:'Premium', amount:250, features:['Everything in Basic','AI Tutor: 6 messages/day','Child timetable if school has timetable'] },
    { code:'child_ultimate', name:'Ultimate', amount:500, features:['Everything in Premium','Extended AI Tutor','Live child analytics','Smarter alerts','Child recommendations'] }
  ];
  const SCHOOL_PLAN_FEATURES = {
    starter:['dashboard','teachers','teacher_approvals','students','analytics','alerts','finance_fees','parent_messages','school_settings','billing','classes','report_cards'],
    growth:['dashboard','teachers','teacher_approvals','students','analytics','alerts','finance_fees','parent_messages','school_settings','billing','classes','report_cards','calendar','school_branding','timetable','homework'],
    enterprise:['dashboard','teachers','teacher_approvals','students','analytics','alerts','finance_fees','parent_messages','school_settings','billing','classes','report_cards','calendar','school_branding','timetable','homework','duty','fairness_report','departments','bulk_sms','senior_subject_choice']
  };
  const SECTION_FEATURE = { homework:'homework','my-homework':'homework',calendar:'calendar',timetable:'timetable','my-timetable':'timetable','school-branding':'school_branding',duty:'duty',departments:'departments',sms:'bulk_sms','bulk-sms':'bulk_sms','fairness-report':'fairness_report','subject-choice':'senior_subject_choice','student-subject-selection':'senior_subject_choice','subject-selection':'senior_subject_choice' };

  function esc(v){ return String(v ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch])); }
  function toast(m,t='info'){ return typeof showToast === 'function' ? showToast(m,t) : console.log(`[${t}] ${m}`); }
  function apiReq(url, opts){ return window.apiRequest ? window.apiRequest(url, opts) : fetch(url, opts).then(r=>r.json()); }
  function currentUser(){ try { const u = typeof getCurrentUser === 'function' ? getCurrentUser() : JSON.parse(localStorage.getItem('user') || '{}'); return u && typeof u === 'object' ? u : {}; } catch { return {}; } }
  function role(){ return String(currentUser().role || localStorage.getItem('userRole') || '').toLowerCase().replace('-', '_'); }
  function selectedChildId(){ return String(window.dashboardData?.selectedChildId || localStorage.getItem('shule_selected_child_id') || '').trim(); }
  function children(){ return Array.isArray(window.dashboardData?.children) ? window.dashboardData.children : []; }
  function selectedChild(){ const id=selectedChildId(); return window.dashboardData?.selectedChild || children().find(c => String(c.id || c.studentId) === id) || null; }
  function planCode(){ const st=window.ShulePlanState || {}; const raw=String(st.planCode || st.currentPlan || st.schoolTier || localStorage.getItem('schoolPlan') || 'starter').toLowerCase(); if(raw.includes('enterprise')) return 'enterprise'; if(raw.includes('growth')) return 'growth'; return 'starter'; }
  function featureSet(){ const st=window.ShulePlanState || {}; if(Array.isArray(st.features) && st.features.length) return new Set(st.features); return new Set(SCHOOL_PLAN_FEATURES[planCode()] || SCHOOL_PLAN_FEATURES.starter); }
  function hasFeature(f){ if(!f) return true; const r=role(); if(r==='super_admin'||r==='superadmin') return true; return featureSet().has(f); }
  function isSeniorGrade(text){ return /(^|\D)(grade\s*)?(10|11|12)(\D|$)|g10|g11|g12|senior/i.test(String(text||'')); }
  function curriculumOf(child=selectedChild()){ return String(child?.curriculum || child?.school?.system || window.dashboardData?.selectedChild?.curriculum || 'cbc').toLowerCase().replace(/[^a-z0-9_-]/g,''); }
  function childClassText(child=selectedChild()){ return [child?.grade, child?.className, child?.Class?.name, child?.level, window.dashboardData?.selectedChild?.student?.grade].filter(Boolean).join(' '); }

  function stableLogoUrl(raw){
    const value = String(raw || '').trim();
    if (!value || value === 'undefined' || value === 'null' || /\/undefined($|\?)/.test(value)) return DEFAULT_LOGO;
    if (/^data:image\//i.test(value) || /^blob:/i.test(value) || /^https?:\/\//i.test(value)) return value;
    if (/^[A-Za-z0-9+/=]{80,}$/.test(value)) return `data:image/png;base64,${value}`;
    return value;
  }
  function stabilizeBranding(){
    const allowBranding = hasFeature('school_branding');
    const branding = allowBranding ? (window.schoolBranding || JSON.parse(localStorage.getItem('schoolBranding') || '{}')) : { schoolName:'Shule AI', logo:DEFAULT_LOGO };
    const logo = allowBranding ? stableLogoUrl(branding.logoDataUrl || branding.logoUrl || branding.logo || DEFAULT_LOGO) : DEFAULT_LOGO;
    const name = allowBranding ? (branding.schoolName || branding.displayName || branding.name || 'Shule AI') : 'Shule AI';
    document.querySelectorAll('#sidebar-school-name,.school-name,.school-name-display,[data-school-name]').forEach(el => { if(el.textContent !== name) el.textContent = name; el.setAttribute('title', name); });
    document.querySelectorAll('img.sidebar-logo,img.school-logo,img[data-school-logo],[data-school-logo] img,.brand-logo img').forEach(img => {
      if (img.tagName !== 'IMG') return;
      const current = String(img.getAttribute('src') || '');
      if (!current || current === 'undefined' || /\/undefined($|\?)/.test(current) || (!allowBranding && current !== logo)) img.setAttribute('src', logo);
      img.onerror = () => { if (img.getAttribute('src') !== DEFAULT_LOGO) img.setAttribute('src', DEFAULT_LOGO); };
      img.style.opacity = '1';
      img.style.visibility = 'visible';
    });
  }

  function featureAllowedForSection(section){
    const f = SECTION_FEATURE[String(section || '')];
    if (!hasFeature(f)) return false;
    if (f === 'senior_subject_choice') {
      const cur = curriculumOf();
      return ['cbc','cbe'].includes(cur) && isSeniorGrade(childClassText());
    }
    return true;
  }
  function pruneUnavailable(root=document){
    root.querySelectorAll?.('[data-section], [onclick*="showDashboardSection"]').forEach(el => {
      const section = el.getAttribute('data-section') || ((el.getAttribute('onclick') || '').match(/showDashboardSection\(['"]([^'"]+)/) || [])[1];
      if (section && !featureAllowedForSection(section)) el.remove();
    });
    const hiddenTerms=[];
    if(!hasFeature('homework')) hiddenTerms.push('homework','my homework');
    if(!hasFeature('calendar')) hiddenTerms.push('calendar');
    if(!hasFeature('timetable')) hiddenTerms.push('timetable');
    if(!hasFeature('school_branding')) hiddenTerms.push('school branding','branding');
    if(!hasFeature('bulk_sms')) hiddenTerms.push('bulk sms','sms');
    if(!hasFeature('duty')) hiddenTerms.push('duty');
    if(!hasFeature('departments')) hiddenTerms.push('departments');
    if(!hasFeature('fairness_report')) hiddenTerms.push('fairness report');
    const cur = curriculumOf();
    if(!['cbc','cbe'].includes(cur) || !isSeniorGrade(childClassText())) hiddenTerms.push('career pathway','subject choice','subject choices','student subject selection','pathway');
    root.querySelectorAll?.('.dashboard-card,.quick-card,.card,button,a,section,article').forEach(el => {
      const txt=(el.textContent||'').trim().toLowerCase();
      if(txt && hiddenTerms.some(t => (txt === t || (txt.includes(t) && txt.length < 90)))) el.remove();
    });
  }

  window.v119ChildLearningContextHtml = function(child=selectedChild()){
    if (!child) return '';
    const cur = curriculumOf(child);
    const cls = childClassText(child);
    let title='Learning Context'; let body='This child dashboard is filtered by the selected class, school and curriculum.';
    if (['cbc','cbe'].includes(cur)) {
      if (isSeniorGrade(cls)) { title='CBC/CBE Senior School'; body='Career pathway, track, and subject-choice support are available for this Grade 10–12 child if the school has senior school enabled.'; }
      else if (/grade\s*9|\bg9\b/i.test(cls)) { title='CBC/CBE Junior School'; body='Career guidance can be shown, but final senior subject choice is hidden until Grade 10–12.'; }
      else { title='CBC/CBE Primary/Junior'; body='The dashboard shows attendance, progress, report cards and allowed school-plan features only.'; }
    } else if (/844|8-4-4/.test(cur)) {
      title='8-4-4 Curriculum'; body=/form\s*[1-3]/i.test(cls) ? 'Shows Form 1–3 subject progress, attendance, homework where allowed, and report cards. CBC pathways are hidden.' : 'Shows the correct 8-4-4 primary/secondary academic view. CBC pathways are hidden.';
    } else if (/british/.test(cur)) { title='British Curriculum'; body='Shows year/stage progress and elective/IGCSE/A-Level subject choices only where the school enables them.'; }
    else if (/american/.test(cur)) { title='American Curriculum'; body='Shows grade/course progress, credits/GPA-style views only where the school enables them.'; }
    return `<div class="rounded-xl border bg-card p-4 mb-4" data-v119-child-context="true"><p class="text-xs uppercase tracking-wide text-muted-foreground">Selected child context</p><h3 class="font-semibold">${esc(title)} • ${esc(child.name || child.User?.name || 'Child')}</h3><p class="text-sm text-muted-foreground">${esc(body)}</p></div>`;
  };
  function injectChildContext(){
    if (role() !== 'parent') return;
    const content = document.getElementById('dashboard-content'); if(!content) return;
    content.querySelectorAll('[data-v119-child-context]').forEach(el=>el.remove());
    const first = content.firstElementChild; if(first) first.insertAdjacentHTML('afterbegin', window.v119ChildLearningContextHtml());
  }

  function sourceLabel(a){ return a?.sourceLabel || a?.data?.sourceLabel || a?.sourceType || a?.type || 'System'; }
  function targetLabel(a){ return a?.targetLabel || a?.data?.targetLabel || a?.studentName || a?.data?.studentName || selectedChild()?.name || ''; }
  window.loadParentAlerts = async function(){
    const container = document.getElementById('parent-alerts-container');
    if (!container) return;
    const studentId = selectedChildId();
    container.innerHTML = '<div class="text-center text-muted-foreground py-4">Loading selected child alerts...</div>';
    try {
      const res = await apiReq('/api/alerts' + (studentId ? `?studentId=${encodeURIComponent(studentId)}&limit=80` : '?limit=80'));
      const data = Array.isArray(res?.data) ? res.data : [];
      const filtered = data.filter(a => {
        const sid = String(a.studentId || a.data?.studentId || a.data?.student_id || '');
        if (sid && studentId && sid !== studentId) return false;
        return true;
      });
      if (!filtered.length) { container.innerHTML = '<div class="text-center text-muted-foreground py-4">No alerts for the selected child yet.</div>'; return; }
      container.innerHTML = filtered.slice(0,8).map(a => `<div class="p-3 border rounded-lg ${!a.isRead?'bg-primary/5':''}"><div class="flex items-start justify-between gap-2"><div><p class="font-medium text-sm">${esc(a.title || 'Alert')}</p><p class="text-xs text-muted-foreground">${esc(a.message || '')}</p></div><span class="text-[10px] rounded-full bg-primary/10 text-primary px-2 py-0.5 whitespace-nowrap">From: ${esc(sourceLabel(a))}</span></div><div class="flex flex-wrap gap-1 mt-2"><span class="text-[10px] rounded-full bg-muted px-2 py-0.5">For: ${esc(targetLabel(a) || 'Selected child')}</span><span class="text-[10px] text-muted-foreground">${typeof timeAgo==='function'?timeAgo(a.createdAt):new Date(a.createdAt||Date.now()).toLocaleString()}</span></div></div>`).join('');
    } catch(e) { container.innerHTML = `<div class="text-red-500">Failed to load selected child alerts: ${esc(e.message || 'Unknown error')}</div>`; }
  };

  async function getParentPlans(){
    try {
      const res = await (window.api?.parent?.getSubscriptionPlans ? window.api.parent.getSubscriptionPlans() : apiReq('/api/subscriptions/plans?ownerType=child'));
      const arr = Array.isArray(res?.data) ? res.data : [];
      if (arr.length) return arr.map(p => {
        const raw=String(p.code || p.id || p.name || '').toLowerCase();
        const tier = raw.includes('ultimate') || raw.includes('genius') ? PARENT_TIERS[2] : raw.includes('premium') || raw.includes('smart') ? PARENT_TIERS[1] : PARENT_TIERS[0];
        return { ...tier, ...p, code:tier.code, name:tier.name, displayName:tier.name, features:Array.isArray(p.features)&&p.features.length?p.features:tier.features, monthlyPriceKes:Number(p.monthlyPriceKes ?? p.price ?? p.amount ?? tier.amount) };
      });
    } catch(_) {}
    return PARENT_TIERS.map(p => ({...p, displayName:p.name, monthlyPriceKes:p.amount}));
  }
  window.v119RenderParentPayments = async function(){
    const old = window.__v119OldParentPayments;
    const base = old ? await old() : '<div class="space-y-6"></div>';
    const plans = await getParentPlans();
    const studentId = selectedChildId();
    const cardHtml = `<div class="rounded-xl border bg-card p-6" data-v119-parent-subscription-cards="true"><div class="flex items-center justify-between gap-3 flex-wrap mb-4"><div><h3 class="font-semibold text-lg">Shule AI Child Subscription</h3><p class="text-sm text-muted-foreground">Per-child subscription. Switching children changes these cards and access limits.</p></div><span class="text-xs rounded-full px-3 py-1 bg-primary/10 text-primary">Selected child: ${esc(selectedChild()?.name || studentId || 'none')}</span></div><div class="grid gap-4 md:grid-cols-3">${plans.map(p=>{ const code=p.code; const amount=Number(p.monthlyPriceKes ?? p.amount ?? p.price ?? 0); const safe=String(code).replace(/[^a-zA-Z0-9_-]/g,'_'); return `<div class="rounded-2xl border p-5 bg-gradient-to-br from-background to-muted/30 flex flex-col"><h4 class="text-xl font-bold">${esc(p.displayName || p.name)}</h4><p class="text-2xl font-extrabold mt-2">KES ${amount.toLocaleString()}<span class="text-xs font-normal text-muted-foreground"> / month</span></p><ul class="text-sm text-muted-foreground mt-3 space-y-1 flex-1">${(p.features||[]).map(f=>`<li>✓ ${esc(f)}</li>`).join('')}</ul><button class="mt-4 w-full rounded-xl bg-primary text-primary-foreground py-2 font-semibold" onclick="v114StartParentSubscription('${esc(code)}', ${amount})">Pay ${esc(p.displayName || p.name)}</button><div class="mt-3 rounded-xl border border-dashed p-3 space-y-2" data-manual-subscription-box><label class="text-xs font-medium">Manual M-Pesa code/reference</label><input id="sub-manual-code-${esc(safe)}" class="w-full rounded-lg border bg-background px-3 py-2 text-sm uppercase" placeholder="e.g. QEH123ABC"><button class="w-full rounded-lg border py-2 text-sm font-semibold" onclick="v116SubmitParentSubscriptionManual('${esc(code)}', ${amount})">Submit Code for Approval</button></div></div>`; }).join('')}</div></div>`;
    const cleaned = String(base).replace(/[\s\S]*?data-v116-subscription-cards="true"[\s\S]*?(?=<div class="grid gap-4 lg:grid-cols-3"|$)/, '').replace(/<div class="rounded-xl border bg-card p-6"[^>]*>\s*<div[^>]*>\s*<div>\s*<h3[^>]*>Shule AI Platform Subscription[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/, '');
    return `<div class="space-y-6">${cardHtml}${cleaned}</div>`;
  };
  if (!window.__v119OldParentPayments) window.__v119OldParentPayments = window.renderParentPayments || window.v12RenderParentPayments || window.v116RenderParentPayments;
  window.renderParentPayments = window.v119RenderParentPayments;
  window.v12RenderParentPayments = window.v119RenderParentPayments;

  const oldSelectChild = window.selectChild;
  window.selectChild = async function(childId){
    document.querySelectorAll('#parent-alerts-container,#parent-chat-messages,#parent-payment-history,#parent-subscription-cards,[data-v119-child-context]').forEach(el => { el.innerHTML = '<div class="text-center text-muted-foreground py-4">Switching child...</div>'; });
    localStorage.setItem('shule_selected_child_id', childId);
    if (window.dashboardData) {
      window.dashboardData.selectedChildId = childId;
      window.dashboardData.selectedChild = children().find(c => String(c.id || c.studentId) === String(childId)) || null;
    }
    window.dispatchEvent(new CustomEvent('shule:child-switched', { detail:{ studentId: childId, child: selectedChild() } }));
    const result = oldSelectChild ? await oldSelectChild.apply(this, arguments) : null;
    setTimeout(()=>{ try{ window.loadParentAlerts?.(); injectChildContext(); pruneUnavailable(document); stabilizeBranding(); }catch(_){} }, 80);
    return result;
  };

  const oldShow = window.showDashboardSection;
  window.showDashboardSection = async function(section){
    if (section && !featureAllowedForSection(section)) return oldShow ? oldShow.call(this, 'dashboard') : null;
    const out = oldShow ? await oldShow.apply(this, arguments) : null;
    setTimeout(()=>{ pruneUnavailable(document); stabilizeBranding(); injectChildContext(); if(role()==='parent') window.loadParentAlerts?.(); }, 60);
    return out;
  };

  document.addEventListener('DOMContentLoaded', () => {
    stabilizeBranding(); pruneUnavailable(document); injectChildContext();
    try { new MutationObserver(() => { stabilizeBranding(); pruneUnavailable(document); }).observe(document.body, { childList:true, subtree:true, attributes:true, attributeFilter:['src','class','style'] }); } catch(_) {}
  });
  window.addEventListener('shule:child-switched', () => setTimeout(()=>{ injectChildContext(); window.loadParentAlerts?.(); }, 50));
  setInterval(stabilizeBranding, 1800);
})();
