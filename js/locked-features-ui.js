// Shule AI v145 — visible, role-owned lifecycle screens with simplified workflows.
// These screens connect the already-protected backend services to reachable dashboard sections.
(function(){
  const esc = value => typeof escapeHtml === 'function' ? escapeHtml(value) : String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const unwrap = response => response?.data?.data ?? response?.data ?? response ?? null;
  const asArray = value => Array.isArray(value) ? value : [];
  const fmtDate = value => value ? new Date(value).toLocaleDateString('en-KE', { year:'numeric', month:'short', day:'numeric' }) : '—';
  const fmtDateTime = value => value ? new Date(value).toLocaleString('en-KE', { timeZone:'Africa/Nairobi' }) : '—';
  const currentUser = () => typeof getCurrentUser === 'function' ? (getCurrentUser() || {}) : {};

  function selectedChildId(){
    return window.dashboardData?.selectedChildId || localStorage.getItem('shule_selected_child_id') || '';
  }
  function selectedChild(){
    const id = selectedChildId();
    return asArray(window.dashboardData?.children).find(child => String(child.id) === String(id)) || window.dashboardData?.selectedChild || asArray(window.dashboardData?.children)[0] || null;
  }
  async function ensureParentChild(){
    let child = selectedChild();
    if (child) return child;
    const response = await api.parent.getChildren();
    const children = asArray(unwrap(response));
    const id = selectedChildId() || children[0]?.id;
    child = children.find(row => String(row.id) === String(id)) || children[0] || null;
    window.dashboardData = window.dashboardData || {};
    window.dashboardData.children = children;
    window.dashboardData.selectedChildId = child?.id || null;
    if (child?.id) localStorage.setItem('shule_selected_child_id', String(child.id));
    return child;
  }

  function emptyState(title, message, icon='inbox'){
    return `<div class="rounded-2xl border bg-card p-10 text-center"><i data-lucide="${icon}" class="h-10 w-10 mx-auto text-muted-foreground"></i><h3 class="font-semibold mt-3">${esc(title)}</h3><p class="text-sm text-muted-foreground mt-1">${esc(message)}</p></div>`;
  }
  function errorState(error, title='This section could not load'){
    return `<div class="rounded-2xl border border-red-200 bg-red-50 dark:bg-red-950/20 p-6"><h3 class="font-semibold text-red-700 dark:text-red-300">${esc(title)}</h3><p class="text-sm text-red-700 dark:text-red-300 mt-1">${esc(error?.message || error || 'Unknown error')}</p></div>`;
  }

  // ---------------- Birthday centre ----------------
  function birthdayRow(row, canManage){
    const due = row.daysUntil === 0 ? 'Today' : row.daysUntil === 1 ? 'Tomorrow' : `In ${row.daysUntil} days`;
    const verified = row.dateOfBirthVerified ? '<span class="rounded-full bg-green-100 text-green-700 px-2 py-1 text-xs">Verified DOB</span>' : '<span class="rounded-full bg-amber-100 text-amber-700 px-2 py-1 text-xs">DOB not verified</span>';
    const enabled = row.enabled !== false;
    return `<tr data-birthday-student-id="${row.studentId}">
      <td class="p-3"><div class="flex items-center gap-3">${typeof avatarHTML === 'function' ? avatarHTML(row.studentName,row.profileImage,'h-10 w-10') : ''}<div><p class="font-semibold">${esc(row.studentName)}</p><p class="text-xs text-muted-foreground">${esc(row.className || 'Unassigned')}${row.stream ? ` · ${esc(row.stream)}` : ''}</p></div></div></td>
      <td class="p-3"><p class="font-medium">${esc(fmtDate(row.birthdayDate))}</p><p class="text-xs text-muted-foreground">Turns ${Number(row.ageTurning || 0)}</p></td>
      <td class="p-3"><span class="rounded-full px-2 py-1 text-xs ${row.daysUntil === 0 ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'}">${esc(due)}</span></td>
      <td class="p-3">${verified}</td>
      <td class="p-3"><span class="rounded-full px-2 py-1 text-xs ${row.reminderStatus === 'sent' ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'}">${esc(row.reminderStatus === 'sent' ? 'Reminder sent' : 'Scheduled')}</span></td>
      <td class="p-3 text-right">${canManage ? `<button onclick="openBirthdayPrivacy(${row.studentId},${enabled ? 'true' : 'false'},${row.dateOfBirthVerified ? 'true' : 'false'},${row.privacy?.notifyParent !== false ? 'true' : 'false'},${row.privacy?.notifyTeacher !== false ? 'true' : 'false'},${row.privacy?.notifyStudent !== false ? 'true' : 'false'},${row.privacy?.announceToClass === true ? 'true' : 'false'})" class="px-3 py-2 rounded-lg border hover:bg-accent">Privacy</button>` : '—'}</td>
    </tr>`;
  }

  async function renderBirthdayCentre(role='admin'){
    try {
      const payload = unwrap(await api.lifecycle.getUpcomingBirthdays(90)) || {};
      const rows = asArray(payload.birthdays);
      const settings = payload.settings || {};
      const canManage = ['admin','superadmin','super_admin'].includes(String(role).toLowerCase());
      window.__birthdaySettings = settings;
      return `<div class="space-y-6 animate-fade-in">
        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3"><div><p class="text-xs uppercase tracking-wide text-muted-foreground">Birthday & age engine</p><h2 class="text-2xl font-bold">School Birthday Centre</h2><p class="text-sm text-muted-foreground">Verified dates of birth calculate age daily and power private, duplicate-safe reminders.</p></div>${canManage ? `<button onclick="processBirthdayReminders()" class="px-4 py-2 rounded-lg bg-primary text-primary-foreground">Process Today’s Reminders</button>` : ''}</div>
        ${canManage ? `<section class="rounded-2xl border bg-card p-5"><div class="flex items-center justify-between gap-3"><div><h3 class="font-semibold text-lg">Reminder settings</h3><p class="text-sm text-muted-foreground">Choose advance reminders and who receives them. Class-wide announcements remain off unless explicitly enabled.</p></div><label class="flex items-center gap-2 text-sm"><input id="birthday-enabled" type="checkbox" ${settings.enabled !== false ? 'checked' : ''}> Enabled</label></div><div class="grid gap-4 md:grid-cols-3 mt-4"><label class="text-sm">Advance days<input id="birthday-advance-days" value="${esc(asArray(settings.advanceDays).join(', '))}" class="mt-1 w-full rounded-lg border bg-background px-3 py-2" placeholder="7, 1, 0"></label><label class="text-sm">Timezone<input id="birthday-timezone" value="${esc(settings.timezone || 'Africa/Nairobi')}" class="mt-1 w-full rounded-lg border bg-background px-3 py-2"></label><label class="flex items-center gap-2 text-sm mt-6"><input id="birthday-require-verified" type="checkbox" ${settings.requireVerifiedDateOfBirth === true ? 'checked' : ''}> Send only for verified DOB</label></div><div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 mt-4"><label class="flex items-center gap-2 text-sm"><input id="birthday-audience-admin" type="checkbox" ${settings.audience?.admin !== false ? 'checked' : ''}> Admin</label><label class="flex items-center gap-2 text-sm"><input id="birthday-audience-teacher" type="checkbox" ${settings.audience?.teacher !== false ? 'checked' : ''}> Relevant teachers</label><label class="flex items-center gap-2 text-sm"><input id="birthday-audience-parent" type="checkbox" ${settings.audience?.parent !== false ? 'checked' : ''}> Linked parents</label><label class="flex items-center gap-2 text-sm"><input id="birthday-audience-student" type="checkbox" ${settings.audience?.student !== false ? 'checked' : ''}> Birthday learner</label><label class="flex items-center gap-2 text-sm"><input id="birthday-class-announcement" type="checkbox" ${settings.announceToClass === true ? 'checked' : ''}> Permit class notices</label></div><div class="mt-4 flex justify-end"><button onclick="saveBirthdaySettings()" class="px-4 py-2 rounded-lg bg-primary text-primary-foreground">Save Settings</button></div></section>` : ''}
        <section class="rounded-2xl border bg-card overflow-hidden"><div class="p-5 border-b"><h3 class="font-semibold text-lg">Upcoming birthdays</h3><p class="text-sm text-muted-foreground">Next 90 days · ${rows.length} learner${rows.length === 1 ? '' : 's'}</p></div>${rows.length ? `<div class="overflow-x-auto"><table class="w-full text-sm min-w-[900px]"><thead class="bg-muted/50"><tr><th class="p-3 text-left">Learner</th><th class="p-3 text-left">Birthday</th><th class="p-3 text-left">Due</th><th class="p-3 text-left">Verification</th><th class="p-3 text-left">Reminder</th><th class="p-3 text-right">Control</th></tr></thead><tbody class="divide-y">${rows.map(row => birthdayRow(row,canManage)).join('')}</tbody></table></div>` : `<div class="p-6">${emptyState('No upcoming birthdays','No active learner with a date of birth has a birthday in the next 90 days.','cake')}</div>`}</section>
      </div>`;
    } catch (error) { return errorState(error,'Birthday centre could not load'); }
  }

  async function saveBirthdaySettings(){
    const advanceDays = String(document.getElementById('birthday-advance-days')?.value || '7,1,0').split(',').map(x=>Number(x.trim())).filter(x=>Number.isFinite(x) && x>=0 && x<=90);
    const payload = {
      enabled:document.getElementById('birthday-enabled')?.checked !== false,
      timezone:document.getElementById('birthday-timezone')?.value?.trim() || 'Africa/Nairobi',
      advanceDays,
      requireVerifiedDateOfBirth:document.getElementById('birthday-require-verified')?.checked === true,
      announceToClass:document.getElementById('birthday-class-announcement')?.checked === true,
      audience:{
        admin:document.getElementById('birthday-audience-admin')?.checked !== false,
        teacher:document.getElementById('birthday-audience-teacher')?.checked !== false,
        parent:document.getElementById('birthday-audience-parent')?.checked !== false,
        student:document.getElementById('birthday-audience-student')?.checked !== false
      }
    };
    showLoading();
    try { const response=await api.lifecycle.saveBirthdaySettings(payload); showToast(response.message || 'Birthday settings saved','success'); await showDashboardSection('birthdays'); }
    catch(error){ showToast(error.message || 'Birthday settings could not be saved','error'); }
    finally{ hideLoading(); }
  }
  async function processBirthdayReminders(){
    showLoading();
    try { const response=await api.lifecycle.processBirthdayReminders(); const data=unwrap(response)||{}; showToast(`${response.message || 'Birthday reminders processed'} ${data.created != null ? `(${data.created} created)` : ''}`,'success'); await showDashboardSection('birthdays'); }
    catch(error){ showToast(error.message || 'Birthday reminders could not be processed','error'); }
    finally{ hideLoading(); }
  }
  function openBirthdayPrivacy(studentId,enabled,verified,notifyParent,notifyTeacher,notifyStudent,announceToClass){
    let modal=document.getElementById('birthday-privacy-modal');
    if(!modal){ modal=document.createElement('div'); modal.id='birthday-privacy-modal'; modal.className='fixed inset-0 z-[90] hidden'; document.body.appendChild(modal); }
    modal.innerHTML=`<div class="absolute inset-0 bg-black/55" onclick="this.parentElement.classList.add('hidden')"></div><div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg p-4"><div class="rounded-2xl border bg-card p-6 shadow-2xl"><h3 class="text-xl font-bold">Birthday privacy</h3><p class="text-sm text-muted-foreground mt-1">Control reminders for this learner without deleting their date of birth.</p><div class="mt-4 space-y-3"><label class="flex items-center gap-2"><input id="birthday-student-enabled" type="checkbox" ${enabled?'checked':''}> Birthday reminders enabled</label><label class="flex items-center gap-2"><input id="birthday-student-verified" type="checkbox" ${verified?'checked':''}> Date of birth verified</label><label class="flex items-center gap-2"><input id="birthday-student-parent" type="checkbox" ${notifyParent?'checked':''}> Notify linked parents</label><label class="flex items-center gap-2"><input id="birthday-student-teacher" type="checkbox" ${notifyTeacher?'checked':''}> Notify relevant teachers</label><label class="flex items-center gap-2"><input id="birthday-student-self" type="checkbox" ${notifyStudent?'checked':''}> Notify learner</label><label class="flex items-center gap-2"><input id="birthday-student-class" type="checkbox" ${announceToClass?'checked':''}> Allow class announcement</label></div><div class="mt-5 flex justify-end gap-2"><button onclick="document.getElementById('birthday-privacy-modal').classList.add('hidden')" class="px-4 py-2 rounded-lg border">Cancel</button><button onclick="saveBirthdayPrivacy(${Number(studentId)})" class="px-4 py-2 rounded-lg bg-primary text-primary-foreground">Save Privacy</button></div></div></div>`;
    modal.classList.remove('hidden');
  }
  async function saveBirthdayPrivacy(studentId){
    const payload={ enabled:document.getElementById('birthday-student-enabled')?.checked===true, dateOfBirthVerified:document.getElementById('birthday-student-verified')?.checked===true, notifyParent:document.getElementById('birthday-student-parent')?.checked===true, notifyTeacher:document.getElementById('birthday-student-teacher')?.checked===true, notifyStudent:document.getElementById('birthday-student-self')?.checked===true, announceToClass:document.getElementById('birthday-student-class')?.checked===true };
    showLoading();
    try { const response=await api.lifecycle.updateBirthdayPrivacy(studentId,payload); showToast(response.message || 'Birthday privacy saved','success'); document.getElementById('birthday-privacy-modal')?.classList.add('hidden'); await showDashboardSection('birthdays'); }
    catch(error){ showToast(error.message || 'Privacy could not be saved','error'); }
    finally{ hideLoading(); }
  }

  // ---------------- Permanent report history ----------------
  function reportStudentName(report){ return report?.snapshot?.student?.name || report?.studentName || `Student #${report?.studentId || ''}`; }
  function reportClassName(report){ return report?.snapshot?.student?.className || report?.snapshot?.student?.grade || report?.snapshot?.class?.name || report?.className || 'Unassigned'; }
  function reportActions(report, role){
    const canCorrect=['admin','superadmin','super_admin'].includes(String(role).toLowerCase()) && report.isCurrent;
    const canShare=!['student'].includes(String(role).toLowerCase()) && report.isCurrent;
    return `<div class="flex flex-wrap gap-2 justify-end"><button onclick="openReportSnapshotPdf(${report.id})" class="px-3 py-2 rounded-lg border">View PDF</button><button onclick="downloadReportSnapshotPdf(${report.id})" class="px-3 py-2 rounded-lg bg-primary text-primary-foreground">Download PDF</button>${canShare?`<button onclick="openReportShare(${report.id})" class="px-3 py-2 rounded-lg border">Share</button>`:''}${canCorrect?`<button onclick="correctReportSnapshot(${report.id})" class="px-3 py-2 rounded-lg border border-amber-300 text-amber-700">Correct Version</button>`:''}</div>`;
  }
  function reportHistoryRows(rows,role){
    return rows.map(report=>`<div class="p-4 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4" data-report-id="${report.id}" data-report-search="${esc(`${reportStudentName(report)} ${reportClassName(report)} ${report.term||''} ${report.year||''} ${report.assessmentKey||''}`.toLowerCase())}"><div class="min-w-0"><div class="flex flex-wrap items-center gap-2"><h4 class="font-semibold">${esc(reportStudentName(report))}</h4><span class="rounded-full px-2 py-1 text-xs ${report.isCurrent?'bg-green-100 text-green-700':'bg-muted text-muted-foreground'}">Version ${Number(report.version||1)}${report.isCurrent?' · Current':' · Archived'}</span></div><p class="text-sm text-muted-foreground mt-1">${esc(reportClassName(report))} · ${esc(report.term || 'Term')} ${esc(report.year || '')} · ${esc(report.assessmentKey || report.reportType || 'Term report')}</p><p class="text-xs text-muted-foreground mt-1">Published ${esc(fmtDateTime(report.publishedAt || report.createdAt))}${report.correctionReason?` · Correction reason: ${esc(report.correctionReason)}`:''}</p></div>${reportActions(report,role)}</div>`).join('');
  }

  async function renderReportHistoryCentre(role=currentUser().role){
    try {
      let params={};
      let child=null;
      if(role==='parent') { child=await ensureParentChild(); if(!child) return emptyState('No linked child','Link a child before opening report history.','link'); params.studentId=child.id; }
      const response=await api.lifecycle.getReportHistory(params);
      const rows=asArray(unwrap(response));
      window.__reportHistoryRows=rows;
      const title=role==='parent'?`${child?.User?.name || child?.name || 'Child'} Report Cards`:role==='student'?'My Report Cards':role==='teacher'?'Class Report Cards':'School Report-Card History';
      return `<div class="space-y-6 animate-fade-in"><div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3"><div><p class="text-xs uppercase tracking-wide text-muted-foreground">Immutable academic record</p><h2 class="text-2xl font-bold">${esc(title)}</h2><p class="text-sm text-muted-foreground">Published reports remain permanent. Corrections create a new version instead of replacing history.</p></div>${role==='teacher'&&typeof isClassTeacher==='function'&&isClassTeacher()?`<button onclick="showDashboardSection('students')" class="px-4 py-2 rounded-lg bg-primary text-primary-foreground">Review & Publish Class Reports</button>`:''}</div><section class="rounded-2xl border bg-card overflow-hidden"><div class="p-4 border-b flex flex-col md:flex-row md:items-center md:justify-between gap-3"><div><h3 class="font-semibold">Published versions</h3><p class="text-xs text-muted-foreground">${rows.length} saved version${rows.length===1?'':'s'}</p></div><div class="flex flex-wrap gap-2"><input id="report-history-search" oninput="filterReportHistory()" class="rounded-lg border bg-background px-3 py-2 text-sm" placeholder="Search learner, class, term..."><select id="report-history-year" onchange="filterReportHistory()" class="rounded-lg border bg-background px-3 py-2 text-sm"><option value="">All years</option>${[...new Set(rows.map(r=>r.year).filter(Boolean))].sort((a,b)=>b-a).map(year=>`<option value="${year}">${year}</option>`).join('')}</select><select id="report-history-term" onchange="filterReportHistory()" class="rounded-lg border bg-background px-3 py-2 text-sm"><option value="">All terms</option>${[...new Set(rows.map(r=>r.term).filter(Boolean))].map(term=>`<option value="${esc(term)}">${esc(term)}</option>`).join('')}</select></div></div><div id="report-history-list" class="divide-y">${rows.length?reportHistoryRows(rows,role):`<div class="p-6">${emptyState('No published report cards','Draft reports remain hidden until the class teacher publishes them.','file-text')}</div>`}</div></section></div>`;
    } catch(error){ return errorState(error,'Report-card history could not load'); }
  }
  function filterReportHistory(){
    const search=String(document.getElementById('report-history-search')?.value||'').trim().toLowerCase();
    const year=document.getElementById('report-history-year')?.value||'';
    const term=document.getElementById('report-history-term')?.value||'';
    document.querySelectorAll('#report-history-list [data-report-search]').forEach(node=>{
      const report=(window.__reportHistoryRows||[]).find(r=>String(r.id)===String(node.dataset.reportId)) || null;
      const matchesText=!search||String(node.dataset.reportSearch||'').includes(search);
      const matchesYear=!year||String(report?.year||'')===String(year);
      const matchesTerm=!term||String(report?.term||'')===String(term);
      node.classList.toggle('hidden',!(matchesText&&matchesYear&&matchesTerm));
    });
  }
  async function reportPdf(reportId){
    const token=localStorage.getItem('authToken')||localStorage.getItem('token')||'';
    const response=await fetch(`${API_BASE_URL}/api/report-cards/history/${reportId}/pdf`,{headers:token?{Authorization:`Bearer ${token}`}:{}});
    if(!response.ok){let message='Report PDF could not be loaded';try{message=(await response.json()).message||message;}catch(_){}throw new Error(message);}
    const disposition=response.headers.get('content-disposition')||'';
    return {blob:await response.blob(),filename:disposition.match(/filename="?([^";]+)"?/i)?.[1]||`Report_Card_${reportId}.pdf`};
  }
  async function openReportSnapshotPdf(reportId){ try{const {blob}=await reportPdf(reportId);const url=URL.createObjectURL(blob);window.open(url,'_blank','noopener');setTimeout(()=>URL.revokeObjectURL(url),120000);}catch(error){showToast(error.message||'Report could not open','error');} }
  async function downloadReportSnapshotPdf(reportId){ try{const {blob,filename}=await reportPdf(reportId);const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);showToast('Report PDF downloaded','success');}catch(error){showToast(error.message||'Report could not download','error');} }
  async function correctReportSnapshot(reportId){
    const reason=prompt('Enter the required correction reason. The original version will remain in history:');
    if(!reason?.trim()) return;
    showLoading();
    try{const response=await api.lifecycle.correctReportSnapshot(reportId,{reason:reason.trim()});showToast(response.message||'Corrected report version created','success');await showDashboardSection('report-history');}
    catch(error){showToast(error.message||'Report correction failed','error');}
    finally{hideLoading();}
  }
  function openReportShare(reportId){
    let modal=document.getElementById('report-share-modal');if(!modal){modal=document.createElement('div');modal.id='report-share-modal';modal.className='fixed inset-0 z-[90] hidden';document.body.appendChild(modal);}
    modal.innerHTML=`<div class="absolute inset-0 bg-black/55" onclick="this.parentElement.classList.add('hidden')"></div><div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg p-4"><div class="rounded-2xl border bg-card p-6 shadow-2xl"><h3 class="text-xl font-bold">Share private report card</h3><p class="text-sm text-muted-foreground mt-1">Never post report cards in a public class room. Every share is logged.</p><label class="block text-sm mt-4">Channel<select id="report-share-channel" class="mt-1 w-full rounded-lg border bg-background px-3 py-2"><option value="secure_link">Secure expiring link</option><option value="school_chat">Private school chat</option><option value="email">Approved parent email</option></select></label><label class="block text-sm mt-3">Recipient email or note<input id="report-share-address" class="mt-1 w-full rounded-lg border bg-background px-3 py-2" placeholder="Required for email; optional otherwise"></label><label class="block text-sm mt-3">Link expiry (hours)<input id="report-share-hours" type="number" min="1" max="168" value="72" class="mt-1 w-full rounded-lg border bg-background px-3 py-2"></label><div id="report-share-result" class="hidden mt-4 rounded-lg border bg-muted/30 p-3 text-sm"></div><div class="mt-5 flex justify-end gap-2"><button onclick="document.getElementById('report-share-modal').classList.add('hidden')" class="px-4 py-2 rounded-lg border">Close</button><button onclick="submitReportShare(${Number(reportId)})" class="px-4 py-2 rounded-lg bg-primary text-primary-foreground">Create Logged Share</button></div></div></div>`;modal.classList.remove('hidden');
  }
  async function submitReportShare(reportId){
    const channel=document.getElementById('report-share-channel')?.value||'secure_link';
    const recipientAddress=document.getElementById('report-share-address')?.value?.trim()||null;
    if(channel==='email'&&!recipientAddress)return showToast('Enter the approved parent email address','error');
    showLoading();
    try{const response=await api.lifecycle.shareReportSnapshot(reportId,{channel,recipientAddress,expiresHours:Number(document.getElementById('report-share-hours')?.value||72)});const data=unwrap(response)||{};const box=document.getElementById('report-share-result');if(box){const link=data.token?`${API_BASE_URL}/api/report-cards/shared/${encodeURIComponent(data.token)}`:'';box.classList.remove('hidden');box.innerHTML=`<strong>${esc(response.message||'Share logged')}</strong>${link?`<div class="mt-2 flex gap-2"><input id="secure-report-link" readonly value="${esc(link)}" class="flex-1 rounded-lg border bg-background px-3 py-2"><button onclick="navigator.clipboard.writeText(document.getElementById('secure-report-link').value);showToast('Secure link copied','success')" class="px-3 py-2 rounded-lg border">Copy</button></div>`:'<p class="mt-1 text-muted-foreground">Delivery is queued through the configured provider.</p>'}`;}}
    catch(error){showToast(error.message||'Report share failed','error');}
    finally{hideLoading();}
  }


  // ---------------- Senior subject choice ----------------
  function subjectLabel(subject){ return subject?.subjectName || subject?.name || subject?.subject || 'Subject'; }
  function subjectChoiceEditor(data, owner, child){
    if(!data?.senior) return emptyState('Not available for this class','Subject choice is only shown for Grade 10, 11 and 12 in senior-enabled schools.','list-checks');
    const eligible=asArray(data.eligibleSubjects), selected=asArray(data.selections);
    const selectedMap=new Map(selected.map(row=>[String(subjectLabel(row)).toLowerCase(),row]));
    const childName=child?.User?.name||child?.name||data.student?.User?.name||data.student?.name||'Learner';
    return `<div class="space-y-6 animate-fade-in"><div><p class="text-xs uppercase tracking-wide text-muted-foreground">Senior Secondary only</p><h2 class="text-2xl font-bold">${esc(childName)} Subject Choices</h2><p class="text-sm text-muted-foreground">Choose from subjects allowed by the school’s curriculum and class structure. The school verifies every submission.</p></div><section class="rounded-2xl border bg-card p-5"><div class="grid gap-4 md:grid-cols-2"><label class="text-sm">Pathway<input id="subject-choice-pathway" value="${esc(selected[0]?.pathway||'')}" class="mt-1 w-full rounded-lg border bg-background px-3 py-2" placeholder="STEM, Social Sciences, Arts & Sports..."></label><label class="text-sm">Track<input id="subject-choice-track" value="${esc(selected[0]?.track||'')}" class="mt-1 w-full rounded-lg border bg-background px-3 py-2" placeholder="Optional track"></label></div><div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3 mt-5">${eligible.map((subject,index)=>{const name=subjectLabel(subject);const prior=selectedMap.get(String(name).toLowerCase());const compulsory=subject.isCompulsory===true;return `<label class="rounded-xl border p-4 flex items-start gap-3 ${compulsory?'bg-primary/5':''}"><input class="subject-choice-item mt-1" type="checkbox" data-index="${index}" ${compulsory||prior?'checked':''} ${compulsory?'disabled':''}><span><strong>${esc(name)}</strong><span class="block text-xs text-muted-foreground mt-1">${compulsory?'Compulsory':'Elective'}${prior?.status?` · ${esc(String(prior.status).replace(/_/g,' '))}`:''}</span></span></label>`;}).join('')||'<p class="text-sm text-muted-foreground">No eligible subjects have been configured for this class.</p>'}</div><div class="mt-5 flex justify-end"><button onclick="saveSeniorSubjectChoice('${owner}')" class="px-4 py-2 rounded-lg bg-primary text-primary-foreground">Save & Send for Verification</button></div></section></div>`;
  }
  async function renderSeniorSubjectChoice(owner='parent'){
    try{
      if(owner==='parent'){const child=await ensureParentChild();if(!child)return emptyState('No linked child','Link a child before opening subject choices.','link');const data=unwrap(await api.parent.getChildSubjectSelection(child.id))||{};window.__subjectChoiceContext={owner,child,data};return subjectChoiceEditor(data,owner,child);}
      const data=unwrap(await api.student.getSubjectSelection())||{};window.__subjectChoiceContext={owner:'student',child:null,data};return subjectChoiceEditor(data,'student',null);
    }catch(error){return errorState(error,'Subject choices could not load');}
  }
  async function saveSeniorSubjectChoice(owner){
    const ctx=window.__subjectChoiceContext||{};const eligible=asArray(ctx.data?.eligibleSubjects);const pathway=document.getElementById('subject-choice-pathway')?.value?.trim()||null;const track=document.getElementById('subject-choice-track')?.value?.trim()||null;
    const subjects=[...document.querySelectorAll('.subject-choice-item')].filter(input=>input.checked||input.disabled).map(input=>{const row=eligible[Number(input.dataset.index)]||{};return {...row,subjectName:subjectLabel(row),isCompulsory:row.isCompulsory===true,isElective:row.isCompulsory!==true,status:owner==='parent'?'parent_supported':'requested'};});
    showLoading();try{const response=owner==='parent'?await api.parent.saveChildSubjectSelection(ctx.child.id,{pathway,track,subjects}):await api.student.saveSubjectSelection({pathway,track,subjects});showToast(response.message||'Subject choices sent for verification','success');await showDashboardSection(owner==='parent'?'subject-choice':'career-path');}catch(error){showToast(error.message||'Subject choices could not be saved','error');}finally{hideLoading();}
  }

  // ---------------- Parent child-owned screens ----------------
  async function renderParentAttendanceCentre(){
    try{
      const child=await ensureParentChild();if(!child)return emptyState('No linked child','Link a child before opening attendance.','link');
      const [todayResponse,summaryResponse]=await Promise.all([api.parent.getChildTodayAttendance(child.id).catch(()=>({data:null})),api.parent.getChildSummary(child.id)]);
      const today=unwrap(todayResponse)||{};const summary=unwrap(summaryResponse)||{};const rows=asArray(summary.recentAttendance||summary.attendance||summary.attendanceRecords);
      const counts=rows.reduce((acc,row)=>{const key=String(row.status||'unknown').toLowerCase();acc[key]=(acc[key]||0)+1;return acc;},{});const rate=rows.length?Math.round(((counts.present||0)/rows.length)*100):Number(summary.attendanceRate||0);
      return `<div class="space-y-6 animate-fade-in"><div><p class="text-xs uppercase tracking-wide text-muted-foreground">Child-owned attendance</p><h2 class="text-2xl font-bold">${esc(child.User?.name||child.name||'Child')} Attendance</h2><p class="text-sm text-muted-foreground">Only the selected child’s records are shown.</p></div><div class="grid gap-4 md:grid-cols-4"><div class="rounded-xl border bg-card p-5"><p class="text-xs text-muted-foreground">Attendance rate</p><p class="text-2xl font-bold mt-1">${rate}%</p></div><div class="rounded-xl border bg-card p-5"><p class="text-xs text-muted-foreground">Present</p><p class="text-2xl font-bold mt-1 text-green-600">${counts.present||0}</p></div><div class="rounded-xl border bg-card p-5"><p class="text-xs text-muted-foreground">Absent</p><p class="text-2xl font-bold mt-1 text-red-600">${counts.absent||0}</p></div><div class="rounded-xl border bg-card p-5"><p class="text-xs text-muted-foreground">Today</p><p class="text-lg font-bold mt-1 capitalize">${esc(today.status||today.attendance?.status||'Not submitted')}</p></div></div><section class="rounded-2xl border bg-card overflow-hidden"><div class="p-4 border-b"><h3 class="font-semibold">Recent attendance</h3></div>${rows.length?`<div class="overflow-x-auto"><table class="w-full text-sm"><thead class="bg-muted/50"><tr><th class="p-3 text-left">Date</th><th class="p-3 text-left">Status</th><th class="p-3 text-left">Teacher note</th><th class="p-3 text-left">Locked</th></tr></thead><tbody class="divide-y">${rows.map(row=>`<tr><td class="p-3">${esc(fmtDate(row.date||row.createdAt))}</td><td class="p-3 capitalize font-medium">${esc(row.status||'Unknown')}</td><td class="p-3">${esc(row.reason||row.notes||'—')}</td><td class="p-3">${row.lockedAt||row.session?.lockedAt?'Final':'Recorded'}</td></tr>`).join('')}</tbody></table></div>`:`<div class="p-6">${emptyState('No attendance records','The school has not submitted attendance for this child yet.','calendar-check')}</div>`}</section></div>`;
    }catch(error){return errorState(error,'Child attendance could not load');}
  }
  async function renderParentSubscriptionCentre(){
    try{
      const child=await ensureParentChild();if(!child)return emptyState('No linked child','Link a child before opening subscriptions.','link');
      const [statusResponse,plansResponse]=await Promise.all([api.subscription.getChildStatus?api.subscription.getChildStatus(child.id):apiRequest(`/api/subscription/child/${child.id}/status`),api.subscription.getPlans('child')]);
      const status=unwrap(statusResponse)||{};const plans=asArray(unwrap(plansResponse));
      const phone=currentUser().phone||currentUser().phoneNumber||'';
      return `<div class="space-y-6 animate-fade-in"><div><p class="text-xs uppercase tracking-wide text-muted-foreground">Per-child access</p><h2 class="text-2xl font-bold">${esc(child.User?.name||child.name||'Child')} Subscription</h2><p class="text-sm text-muted-foreground">Each child has a separate Basic, Premium or Ultimate subscription.</p></div><div class="rounded-xl border bg-card p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4"><div><p class="text-sm text-muted-foreground">Current plan</p><h3 class="text-2xl font-bold capitalize">${esc(status.plan||status.subscription?.planName||child.subscriptionPlan||'Basic')}</h3><p class="text-sm text-muted-foreground">Status: ${esc(status.status||status.subscription?.status||child.subscriptionStatus||'inactive')} · ${Number(status.daysRemaining||0)} day(s) remaining</p></div><button onclick="showDashboardSection('payments')" class="px-4 py-2 rounded-lg border">Open School Fees</button></div>${typeof renderParentChildSubscriptionCards==='function'?renderParentChildSubscriptionCards(child.id,child,phone,plans):emptyState('Subscription cards unavailable','Reload the dashboard to load subscription plans.','credit-card')}</div>`;
    }catch(error){return errorState(error,'Child subscription could not load');}
  }

  // ---------------- Admin lifecycle home ----------------
  async function renderStudentLifecycleHome(){
    let batches=[];try{batches=asArray(unwrap(await api.admin.listPromotionBatches()));}catch(_){}
    return `<div class="space-y-6 animate-fade-in"><div><p class="text-xs uppercase tracking-wide text-muted-foreground">Continuous learner history</p><h2 class="text-2xl font-bold">Student Lifecycle</h2><p class="text-sm text-muted-foreground">Admission, daily attendance, report publication, promotion, transfer and graduation stay connected without deleting old records.</p></div><div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><button onclick="showDashboardSection('academic-year-transition')" class="text-left rounded-2xl border bg-card p-5 hover:bg-accent"><i data-lucide="arrow-up-right" class="h-6 w-6 text-primary"></i><h3 class="font-semibold mt-3">Academic Year Transition</h3><p class="text-sm text-muted-foreground mt-1">Preview, validate, schedule, apply or roll back promotions.</p></button><button onclick="showDashboardSection('attendance-corrections')" class="text-left rounded-2xl border bg-card p-5 hover:bg-accent"><i data-lucide="clipboard-check" class="h-6 w-6 text-primary"></i><h3 class="font-semibold mt-3">Attendance Corrections</h3><p class="text-sm text-muted-foreground mt-1">Correct locked attendance with permanent audit history.</p></button><button onclick="showDashboardSection('report-history')" class="text-left rounded-2xl border bg-card p-5 hover:bg-accent"><i data-lucide="file-clock" class="h-6 w-6 text-primary"></i><h3 class="font-semibold mt-3">Report History</h3><p class="text-sm text-muted-foreground mt-1">Open immutable report versions, corrections and sharing logs.</p></button><button onclick="showDashboardSection('birthdays')" class="text-left rounded-2xl border bg-card p-5 hover:bg-accent"><i data-lucide="cake" class="h-6 w-6 text-primary"></i><h3 class="font-semibold mt-3">Birthdays & Ages</h3><p class="text-sm text-muted-foreground mt-1">Manage DOB verification, reminders and privacy.</p></button></div><section class="rounded-2xl border bg-card overflow-hidden"><div class="p-5 border-b"><h3 class="font-semibold">Recent transition batches</h3></div>${batches.length?`<div class="divide-y">${batches.slice(0,10).map(batch=>`<button onclick="showDashboardSection('academic-year-transition');setTimeout(()=>openPromotionBatch(${batch.id}),100)" class="w-full p-4 text-left flex items-center justify-between hover:bg-accent"><span><strong>${esc(batch.closingYear)} → ${esc(batch.newYear)}</strong><span class="block text-xs text-muted-foreground">Effective ${esc(fmtDate(batch.effectiveDate))}</span></span><span class="rounded-full bg-muted px-3 py-1 text-xs capitalize">${esc(batch.status)}</span></button>`).join('')}</div>`:`<div class="p-6">${emptyState('No transition batches','Generate the first promotion preview when the academic year is closing.','graduation-cap')}</div>`}</section></div>`;
  }

  window.renderBirthdayCentre=renderBirthdayCentre;
  window.saveBirthdaySettings=saveBirthdaySettings;
  window.processBirthdayReminders=processBirthdayReminders;
  window.openBirthdayPrivacy=openBirthdayPrivacy;
  window.saveBirthdayPrivacy=saveBirthdayPrivacy;
  window.renderReportHistoryCentre=renderReportHistoryCentre;
  window.filterReportHistory=filterReportHistory;
  window.openReportSnapshotPdf=openReportSnapshotPdf;
  window.downloadReportSnapshotPdf=downloadReportSnapshotPdf;
  window.correctReportSnapshot=correctReportSnapshot;
  window.openReportShare=openReportShare;
  window.submitReportShare=submitReportShare;
  window.renderSeniorSubjectChoice=renderSeniorSubjectChoice;
  window.saveSeniorSubjectChoice=saveSeniorSubjectChoice;
  window.renderParentAttendanceCentre=renderParentAttendanceCentre;
  window.renderParentSubscriptionCentre=renderParentSubscriptionCentre;
  window.renderStudentLifecycleHome=renderStudentLifecycleHome;
})();
