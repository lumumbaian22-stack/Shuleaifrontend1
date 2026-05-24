// Shule AI v66 Final Rollout Candidate - soft subscription locks
(function(){
  const CHILD_PREMIUM_SECTIONS = new Set(['ai-tutor', 'analytics']);
  const SCHOOL_PREMIUM_SECTIONS = new Set(['analytics']);

  const CHILD_FEATURES = {
    'ai-tutor': 'AI Tutor',
    analytics: 'Study Analytics'
  };
  const SCHOOL_FEATURES = {
    analytics: 'Advanced School Analytics'
  };

  let cache = null;
  let cacheAt = 0;
  const TTL = 60 * 1000;

  function currentRole(){
    try { return (window.currentRole || (typeof getCurrentUser === 'function' ? getCurrentUser()?.role : '') || '').toLowerCase(); }
    catch(_) { return ''; }
  }

  function activeSub(sub){
    if (!sub) return false;
    const status = String(sub.status || '').toLowerCase();
    const end = sub.endDate || sub.expiry || sub.expiresAt || sub.subscriptionExpiry;
    return status === 'active' && (!end || new Date(end) > new Date());
  }

  function featuresOf(sub){
    return Array.isArray(sub?.features) ? sub.features : [];
  }

  function hasAnyFeature(sub, keys){
    if (!activeSub(sub)) return false;
    const features = featuresOf(sub);
    return features.includes('*') || keys.some(k => features.includes(k));
  }

  function selectedChildId(){
    try {
      return window.v66SelectedChild?.id || window.selectedChildId || localStorage.getItem('selectedChildId') || localStorage.getItem('selectedStudentId');
    } catch(_) { return null; }
  }

  async function fetchStatus(force=false){
    const now = Date.now();
    if (!force && cache && now - cacheAt < TTL) return cache;
    if (!window.api?.subscription?.getMyStatus) return { success:false, data:null };
    try {
      cache = await window.api.subscription.getMyStatus();
      cacheAt = now;
      return cache;
    } catch (error) {
      cache = { success:false, data:null, error };
      cacheAt = now;
      return cache;
    }
  }

  async function canAccess(role, section){
    role = String(role || currentRole()).toLowerCase();
    if (['superadmin', 'super_admin'].includes(role)) return { allowed:true };

    if (['student', 'parent'].includes(role) && CHILD_PREMIUM_SECTIONS.has(section)) {
      const status = await fetchStatus();
      const data = status?.data || {};
      let sub = null;
      if (role === 'student') sub = data.subscription;
      if (role === 'parent') {
        const sid = selectedChildId();
        const child = (data.students || []).find(s => String(s.id || s.studentId) === String(sid)) || data.primary || (data.students || [])[0];
        sub = child?.subscription;
      }
      const aliases = section === 'ai-tutor'
        ? ['ai_tutor', 'unlimited_ai_tutor', 'full_ai_tutor']
        : ['study_analytics', 'deep_analytics', 'advanced_insights', 'advanced_exam_preparation'];
      if (hasAnyFeature(sub, aliases)) return { allowed:true };
      return { allowed:false, ownerType:'child', feature:CHILD_FEATURES[section] || 'Premium Feature', section, plan: sub?.planName || sub?.planCode || 'Basic/Inactive' };
    }

    if (['admin', 'teacher'].includes(role) && SCHOOL_PREMIUM_SECTIONS.has(section)) {
      const status = await fetchStatus();
      const sub = status?.data?.subscription;
      const aliases = ['ai_analytics', 'advanced_analytics', 'advanced_reports', 'premium_dashboards'];
      if (hasAnyFeature(sub, aliases)) return { allowed:true };
      return { allowed:false, ownerType:'school', feature:SCHOOL_FEATURES[section] || 'School Premium Feature', section, plan: sub?.planName || sub?.planCode || status?.data?.currentPlan || 'Inactive' };
    }
    return { allowed:true };
  }

  function lockCard(info){
    const isSchool = info?.ownerType === 'school';
    const title = isSchool ? 'School premium feature locked' : 'Premium learner feature locked';
    const body = isSchool
      ? 'Core school operations remain available. Upgrade or renew the school subscription to unlock this advanced feature.'
      : 'Grades, attendance, homework, timetable, and fees remain available. Upgrade the child subscription to unlock this premium learning feature.';
    const action = isSchool ? 'Open Subscription & Billing' : 'Open Subscription Options';
    const click = isSchool ? "showDashboardSection('subscription-billing')" : "showDashboardSection('payments')";
    return `
      <div class="rounded-2xl border bg-card p-8 max-w-3xl mx-auto shadow-sm">
        <div class="flex items-start gap-4">
          <div class="h-12 w-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center text-2xl">🔒</div>
          <div class="space-y-3 flex-1">
            <div>
              <h2 class="text-2xl font-bold">${title}</h2>
              <p class="text-muted-foreground mt-1">${body}</p>
            </div>
            <div class="rounded-xl border bg-background p-4 text-sm">
              <div><strong>Feature:</strong> ${String(info?.feature || 'Premium Feature')}</div>
              <div><strong>Current plan/status:</strong> ${String(info?.plan || 'Inactive')}</div>
            </div>
            <button class="px-4 py-2 rounded-lg bg-primary text-primary-foreground" onclick="${click}">${action}</button>
          </div>
        </div>
      </div>`;
  }

  window.ShuleSubscriptionLock = { canAccess, lockCard, refresh: () => fetchStatus(true), clear: () => { cache = null; cacheAt = 0; } };
})();
