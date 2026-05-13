/* v66 Academic Core & Curriculum Sync
 * Central academic helper layer used by teacher/student/parent/admin dashboards.
 * This file contains pure frontend helpers only; backend remains source of truth.
 */
(function(){
  const w = window;
  const DEFAULT_TERMS = ['Term 1','Term 2','Term 3'];
  const ASSESSMENT_TYPES = ['CAT','Exam','Assignment','Quiz','Practical','Project','Custom'];

  const DEFAULT_SCALES = {
    cbc: [
      { grade:'EE', label:'Exceeding Expectations', min:90, max:100 },
      { grade:'ME', label:'Meeting Expectations', min:75, max:89 },
      { grade:'AE', label:'Approaching Expectations', min:50, max:74 },
      { grade:'BE', label:'Below Expectations', min:0, max:49 }
    ],
    '8-4-4': [
      { grade:'A', min:80, max:100 }, { grade:'A-', min:75, max:79 }, { grade:'B+', min:70, max:74 },
      { grade:'B', min:65, max:69 }, { grade:'B-', min:60, max:64 }, { grade:'C+', min:55, max:59 },
      { grade:'C', min:50, max:54 }, { grade:'C-', min:45, max:49 }, { grade:'D+', min:40, max:44 },
      { grade:'D', min:35, max:39 }, { grade:'D-', min:30, max:34 }, { grade:'E', min:0, max:29 }
    ],
    '844': [
      { grade:'A', min:80, max:100 }, { grade:'A-', min:75, max:79 }, { grade:'B+', min:70, max:74 },
      { grade:'B', min:65, max:69 }, { grade:'B-', min:60, max:64 }, { grade:'C+', min:55, max:59 },
      { grade:'C', min:50, max:54 }, { grade:'C-', min:45, max:49 }, { grade:'D+', min:40, max:44 },
      { grade:'D', min:35, max:39 }, { grade:'D-', min:30, max:34 }, { grade:'E', min:0, max:29 }
    ],
    igcse: [
      { grade:'A*', min:90, max:100 }, { grade:'A', min:80, max:89 }, { grade:'B', min:70, max:79 },
      { grade:'C', min:60, max:69 }, { grade:'D', min:50, max:59 }, { grade:'E', min:40, max:49 },
      { grade:'F', min:30, max:39 }, { grade:'G', min:20, max:29 }, { grade:'U', min:0, max:19 }
    ],
    cambridge: [
      { grade:'A*', min:90, max:100 }, { grade:'A', min:80, max:89 }, { grade:'B', min:70, max:79 },
      { grade:'C', min:60, max:69 }, { grade:'D', min:50, max:59 }, { grade:'E', min:40, max:49 },
      { grade:'F', min:30, max:39 }, { grade:'G', min:20, max:29 }, { grade:'U', min:0, max:19 }
    ]
  };

  function normCurriculum(value){
    const v = String(value || '').trim().toLowerCase();
    if (!v) return 'cbc';
    if (v.includes('8') || v.includes('844') || v.includes('8-4-4')) return '8-4-4';
    if (v.includes('igcse')) return 'igcse';
    if (v.includes('cambridge')) return 'cambridge';
    if (v.includes('custom')) return 'custom';
    return v;
  }

  function getSchoolAcademicSettings(){
    const s = w.schoolSettings || JSON.parse(localStorage.getItem('schoolSettings') || '{}') || {};
    return {
      curriculum: normCurriculum(s.curriculum || s.system || s.curriculumType || 'cbc'),
      schoolLevel: s.schoolLevel || s?.settings?.schoolLevel || 'secondary',
      gradingScale: s.gradingScale || s.academicGradingScale || w.currentGradingScale || null,
      terms: s.terms || DEFAULT_TERMS,
      academicYear: s.academicYear || new Date().getFullYear()
    };
  }

  function getGradingScale(curriculum, overrideScale){
    if (Array.isArray(overrideScale) && overrideScale.length) return overrideScale.map(normalizeBand);
    const c = normCurriculum(curriculum);
    return (DEFAULT_SCALES[c] || DEFAULT_SCALES.cbc).map(normalizeBand);
  }

  function normalizeBand(b){
    const min = Number(b.min ?? String(b.range || '').split('-')[0] ?? 0);
    const max = Number(b.max ?? String(b.range || '').split('-')[1] ?? 100);
    return { grade: b.grade || b.level || b.name || '-', label: b.label || b.description || '', min, max };
  }

  function gradeScore(score, curriculum, overrideScale){
    const n = Number(score);
    if (!Number.isFinite(n)) return '-';
    const scale = getGradingScale(curriculum, overrideScale);
    const hit = scale.find(b => n >= b.min && n <= b.max);
    return hit ? hit.grade : '-';
  }

  function gradeBandClass(grade){
    const g = String(grade || '').toUpperCase();
    if (['EE','A*','A','A-'].includes(g)) return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200';
    if (['ME','B+','B','B-'].includes(g)) return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200';
    if (['AE','C+','C','C-'].includes(g)) return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200';
    return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200';
  }

  function buildTermYearControls(prefix='academic'){
    const settings = getSchoolAcademicSettings();
    const year = Number(settings.academicYear || new Date().getFullYear());
    const years = [year-1, year, year+1];
    return `<div class="flex gap-2 flex-wrap">
      <select id="${prefix}-term" class="rounded-xl border bg-background px-3 py-2 text-sm">
        ${settings.terms.map(t=>`<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`).join('')}
      </select>
      <select id="${prefix}-year" class="rounded-xl border bg-background px-3 py-2 text-sm">
        ${years.map(y=>`<option value="${y}" ${y===year?'selected':''}>${y}</option>`).join('')}
      </select>
    </div>`;
  }

  function academicSummary(records=[]){
    const scores = records.map(r => Number(r.score)).filter(Number.isFinite);
    const avg = scores.length ? Math.round(scores.reduce((a,b)=>a+b,0)/scores.length) : 0;
    const weak = records.filter(r => Number(r.score) < 50).length;
    const top = records.filter(r => Number(r.score) >= 80).length;
    return { average: avg, weakCount: weak, topCount: top, total: records.length };
  }

  function renderAcademicAlertCards(records=[], context='student'){
    const sum = academicSummary(records);
    const alerts=[];
    if (sum.weakCount) alerts.push({icon:'alert-triangle', title:'Academic support needed', msg:`${sum.weakCount} low score area(s) need follow-up.`, tone:'amber'});
    if (sum.topCount) alerts.push({icon:'star', title:'Strong performance', msg:`${sum.topCount} high performing subject/assessment result(s).`, tone:'emerald'});
    if (!records.length) alerts.push({icon:'info', title:'No academic records yet', msg:'Grades will appear once teachers publish marks.', tone:'blue'});
    return `<div class="grid gap-3 md:grid-cols-3">${alerts.map(a=>`<div class="rounded-2xl border bg-card p-4 shadow-sm"><div class="flex gap-3"><span class="h-10 w-10 rounded-xl bg-muted flex items-center justify-center"><i data-lucide="${a.icon}" class="h-5 w-5"></i></span><div><p class="font-semibold">${a.title}</p><p class="text-sm text-muted-foreground">${a.msg}</p></div></div></div>`).join('')}</div>`;
  }

  function safeRecords(data){
    if (Array.isArray(data)) return data;
    return data?.grades || data?.records || data?.academicRecords || data?.data || [];
  }

  w.AcademicCoreV66 = {
    DEFAULT_SCALES, ASSESSMENT_TYPES, DEFAULT_TERMS,
    normCurriculum, getSchoolAcademicSettings, getGradingScale, gradeScore, gradeBandClass,
    buildTermYearControls, academicSummary, renderAcademicAlertCards, safeRecords
  };

  // Keep old global grade function compatible but curriculum-aware.
  const oldGetGrade = w.getGradeFromScore;
  w.getGradeFromScore = function(score, curriculum, level, customScale){
    try { return gradeScore(score, curriculum || getSchoolAcademicSettings().curriculum, customScale || getSchoolAcademicSettings().gradingScale); }
    catch(e){ return typeof oldGetGrade === 'function' ? oldGetGrade(score, curriculum, level, customScale) : '-'; }
  };
})();
