(function(){
  const $ = (id) => document.getElementById(id);
  function esc(s){ return String(s ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
  function toast(msg,type='info'){ if(window.showToast) showToast(msg,type); else console.log(type.toUpperCase()+': '+msg); }
  function modal(title, body){
    let root = $('production-modal-root');
    if(!root){ root=document.createElement('div'); root.id='production-modal-root'; document.body.appendChild(root); }
    root.innerHTML = `<div class="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4"><div class="bg-card text-card-foreground border rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden shadow-2xl"><div class="p-5 border-b flex justify-between items-center"><h3 class="text-xl font-bold">${esc(title)}</h3><button class="p-2 rounded-lg hover:bg-accent" onclick="document.getElementById('production-modal-root').innerHTML=''">✕</button></div><div class="p-5 overflow-y-auto max-h-[70vh] whitespace-pre-wrap leading-7 text-sm">${body}</div></div></div>`;
  }
  async function showLegal(type){
    try { const res = await (window.legalAPI ? legalAPI.get(type) : apiRequest(`/api/legal/${type}`)); const d=res.data; modal(d.title || type, esc(d.content || '').replace(/\n/g,'<br>')); }
    catch(e){ modal(type === 'privacy' ? 'Privacy Notice' : 'Terms of Service', 'Unable to load the latest legal document. Please check your connection and try again.'); }
  }
  window.showTerms = () => showLegal('terms');
  window.showPrivacy = () => showLegal('privacy');
  window.showTermsModal = async function(){ await showLegal('terms'); };

  window.loadStudentLearningMaterials = async function(subject = ''){
    const container = $('learning-materials-container') || $('student-materials-container') || $('main-content');
    if(!container) return;
    container.innerHTML = '<div class="p-6 text-center">Loading learning materials...</div>';
    try{
      const res = await learningAPI.getMaterials(subject ? { subject } : {});
      const items = res.data || [];
      container.innerHTML = `<div class="space-y-4"><div class="flex justify-between items-center"><h2 class="text-2xl font-bold">Learning Materials</h2><select onchange="loadStudentLearningMaterials(this.value)" class="rounded-lg border bg-background p-2"><option value="">All subjects</option>${[...new Set(items.map(i=>i.subject))].map(s=>`<option value="${esc(s)}">${esc(s)}</option>`).join('')}</select></div><div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">${items.map(m=>`<div class="rounded-xl border bg-card p-4"><div class="flex justify-between gap-2"><h3 class="font-semibold">${esc(m.title)}</h3><span class="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary h-fit">${esc(m.accessLevel||'basic')}</span></div><p class="text-sm text-muted-foreground mt-1">${esc(m.subject)} • ${esc(m.gradeLevel||'General')}</p><p class="text-sm mt-3">${esc(m.summary||'')}</p><div class="mt-3 text-xs"><b>Activities:</b><ul class="list-disc ml-5">${(m.activities||[]).slice(0,3).map(a=>`<li>${esc(a)}</li>`).join('')}</ul></div></div>`).join('')}</div></div>`;
      if(window.lucide) lucide.createIcons();
    }catch(e){ container.innerHTML = `<div class="p-6 rounded-xl border text-red-600">${esc(e.message || 'Failed to load materials')}</div>`; }
  };

  window.askAITutor = async function(){
    const input = $('ai-question-input') || $('ai-input');
    const container = $('ai-chat-container') || $('ai-chat-messages');
    const text = input?.value?.trim(); if(!text || !container) return;
    container.innerHTML += `<div class="flex justify-end mb-3"><div class="chat-bubble-sent max-w-[75%]"><p class="text-sm">${esc(text)}</p></div></div>`;
    input.value=''; container.scrollTop=container.scrollHeight;
    try{
      const res = await tutorAPI.chat({ message:text });
      const d=res.data;
      container.innerHTML += `<div class="flex justify-start mb-3"><div class="chat-bubble-received max-w-[80%]"><p class="text-sm font-semibold">AI Tutor • ${esc(d.subject)} (${Math.round((d.confidence||0)*100)}%)</p><p class="text-sm whitespace-pre-wrap mt-2">${esc(d.answer)}</p>${d.practice?.length?`<div class="mt-3 text-xs"><b>Practice:</b><ul class="list-disc ml-5">${d.practice.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>`:''}</div></div>`;
    }catch(e){
      const upgrade = e.message && /subscription|premium|402/i.test(e.message);
      container.innerHTML += `<div class="flex justify-start mb-3"><div class="chat-bubble-received max-w-[75%]"><p class="text-sm ${upgrade?'text-amber-600':'text-red-600'}">${esc(e.message || 'AI tutor failed')}</p></div></div>`;
    }
    container.scrollTop=container.scrollHeight;
  };
  window.askAI = window.askAITutor;

  window.showLearningMaterialsSection = async function(){
    const c=$('dashboard-content')||$('main-content'); if(c) c.innerHTML='<div id="learning-materials-container"></div>'; await window.loadStudentLearningMaterials();
  };

  window.updateSuperAdminChart = window.updateSuperAdminChart || function(value){ document.querySelectorAll('[data-chart-filter]').forEach(el=>el.dataset.chartFilter=value); };
  window.updateSuperAdminPieChart = window.updateSuperAdminPieChart || function(value){ document.querySelectorAll('[data-pie-filter]').forEach(el=>el.dataset.pieFilter=value); };
})();
