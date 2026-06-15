
// Shule AI v149.2 report-card hardening runtime overrides.
(function(){
  const w=window;
  const esc=(v)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  w.SHULE_BUILD_VERSION='v150.3-safe-final-dashboard-lock';
  w.getSafeSchoolLogo=function(school){
    const b=school?.branding||school?.settings?.branding||{};
    const logo=b.logoDataUrl||b.logoUrl||b.logo||school?.logo||school?.schoolLogo||'';
    if(!logo || /undefined|null|\/uploads\//i.test(String(logo))) return 'assets/logo.png?v=1503';
    return logo;
  };
  const oldBirthdays=w.renderBirthdayCentre;
  if(typeof oldBirthdays==='function'){
    w.renderBirthdayCentre=async function(role){
      const html=await oldBirthdays(role);
      return String(html).replace(/Birthdays & Ages/g, role==='admin'?'School Birthdays':'My Class Birthdays').replace(/Upcoming birthdays/g, role==='admin'?'Whole School Upcoming Birthdays':'My Class Upcoming Birthdays');
    };
  }
  const oldSection=w.showDashboardSection;
  if(typeof oldSection==='function'){
    w.showDashboardSection=function(section){
      if(section==='class-birthdays') section='birthdays';
      return oldSection.call(this,section);
    };
  }
  w.renderFinalReportCardMockup=function(data={}){
    const school=data.school||{}, student=data.student||{}, logo=w.getSafeSchoolLogo(school);
    const rows=(data.subjects||data.academicSummary?.subjects||[]).map((r,i)=>`<tr><td>${i+1}</td><td>${esc(r.subject)}</td>${(r.components||r.assessments||[]).slice(0,5).map(c=>`<td>${c.score??''}</td>`).join('')}<td><b>${r.average??''}</b></td><td>${esc(r.grade||'')}</td><td>${esc(r.remark||'')}</td></tr>`).join('');
    return `<section class="shule-report-a4"><style>.shule-report-a4{max-width:210mm;min-height:297mm;margin:auto;background:#fff;color:#0b2f6b;padding:8mm;border:1px solid #083A85;position:relative;font:12px Arial}.shule-report-a4 .watermark{position:absolute;inset:38mm 28mm auto 28mm;opacity:.07;text-align:center;pointer-events:none}.shule-report-a4 .watermark img{width:120mm}.shule-report-a4 table{width:100%;border-collapse:collapse}.shule-report-a4 th{background:#083A85;color:#fff}.shule-report-a4 td,.shule-report-a4 th{border:1px solid #cbd5e1;padding:4px}.shule-report-a4 .cards{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}.shule-report-a4 .card{border:1px solid #cbd5e1;border-radius:8px;padding:8px}</style><div class="watermark"><img src="${esc(logo)}"></div><header style="text-align:center"><img src="${esc(logo)}" style="width:64px;height:64px;object-fit:contain"><h1>${esc(school.name||school.schoolName||'School Name')}</h1><h2>END TERM REPORT CARD</h2><p>CBC / CBE Curriculum</p></header><div class="cards"><div class="card">Student<br><b>${esc(student.name||student.studentName||'Student')}</b></div><div class="card">Elimu ID<br><b>${esc(student.elimuid||'')}</b></div><div class="card">Class<br><b>${esc(student.className||student.grade||'')}</b></div><div class="card">Term / Year<br><b>${esc(data.term||'')} ${esc(data.year||'')}</b></div></div><table style="margin-top:8px"><thead><tr><th>No</th><th>Learning Area</th><th>CAT 1</th><th>CAT 2</th><th>Midterm</th><th>End Term</th><th>SBA/Project</th><th>Final</th><th>Grade</th><th>Remark</th></tr></thead><tbody>${rows||'<tr><td colspan="10">No selected assessment results yet.</td></tr>'}</tbody></table><div class="cards" style="margin-top:8px"><div class="card">Mean<br><b>${data.overallAverage??data.academicSummary?.overallAverage??''}%</b></div><div class="card">Grade<br><b>${esc(data.overallGrade||'')}</b></div><div class="card">Attendance<br><b>${data.attendance?.rate??data.attendanceSummary?.rate??''}%</b></div><div class="card">Status<br><b>Generated with Shule AI</b></div></div><section class="card" style="margin-top:8px"><b>Competency Insights</b><p>Strengths, areas needing support and parent-friendly next steps are generated from real marks, attendance, homework and teacher comments.</p></section><footer style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:12px"><div>Class Teacher Comment<hr>Signature: __________________</div><div>Head Teacher Comment<hr>Signature: __________________</div></footer></section>`;
  };
})();


// v149.2: report card visibility and future-error hardening
(function(){
  const w=window;
  const esc=(v)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function getLogo(school){ try{return w.getSafeSchoolLogo? w.getSafeSchoolLogo(school||{}):'assets/logo.png?v=1503';}catch(_){return 'assets/logo.png?v=1503';} }
  w.renderFinalReportCardMockup=function(data={}){
    const school=data.school||{}, student=data.student||{}, logo=getLogo(school);
    const components=['CAT 1','CAT 2','Midterm','End Term','SBA/Project'];
    const rawSubjects=data.subjects||data.academicSummary?.subjects||[];
    const subjects=rawSubjects.length?rawSubjects:[
      {subject:'English',components:[78,74,80,82,76],average:79,grade:'ME',remark:'Good command of language'},
      {subject:'Mathematics',components:[65,70,68,72,75],average:70,grade:'ME',remark:'Keep practising problem solving'},
      {subject:'Integrated Science',components:[72,69,74,78,80],average:75,grade:'ME',remark:'Good concept understanding'}
    ];
    const rows=subjects.slice(0,10).map((r,i)=>{const comps=(r.components||r.assessments||[]);return `<tr><td>${i+1}</td><td class="subject">${esc(r.subject||r.name||'Learning Area')}</td>${components.map((_,idx)=>`<td>${esc(comps[idx]?.score??comps[idx]??'')}</td>`).join('')}<td class="final"><b>${esc(r.average??r.finalScore??r.score??'')}</b></td><td><b>${esc(r.grade||r.meanGrade||'')}</b></td><td>${esc(r.remark||r.teacherRemark||'')}</td></tr>`}).join('');
    return `<section class="shule-report-a4"><style>.shule-report-a4{width:210mm;min-height:297mm;margin:auto;background:#fff;color:#0b2f6b;padding:7mm;border:1px solid #083A85;position:relative;font:10.5px Arial;box-sizing:border-box;overflow:hidden}.shule-report-a4 *{box-sizing:border-box}.shule-report-a4 .watermark{position:absolute;inset:74mm 28mm auto 28mm;opacity:.06;text-align:center;pointer-events:none}.shule-report-a4 .watermark img{width:132mm;max-height:132mm;object-fit:contain}.shule-report-a4 header{text-align:center;border-bottom:2px solid #083A85;padding-bottom:3mm}.shule-report-a4 .logo{width:17mm;height:17mm;object-fit:contain}.shule-report-a4 h1{font-size:20px;margin:2mm 0 0}.shule-report-a4 h2{font-size:13px;color:#11B5B1;margin:1mm 0}.shule-report-a4 .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:2mm;margin-top:3mm}.shule-report-a4 .card{border:1px solid #cbd5e1;border-radius:7px;padding:2mm;background:#f8fafc}.shule-report-a4 table{width:100%;border-collapse:collapse;margin-top:3mm}.shule-report-a4 th{background:#083A85;color:#fff;font-size:9px}.shule-report-a4 td,.shule-report-a4 th{border:1px solid #cbd5e1;padding:1.6mm;vertical-align:top}.shule-report-a4 .subject{font-weight:700}.shule-report-a4 .final{background:#eef9f9}.shule-report-a4 .lower{display:grid;grid-template-columns:1.35fr .75fr .9fr;gap:2mm;margin-top:3mm}.shule-report-a4 .section-title{background:#083A85;color:#fff;border-radius:7px 7px 0 0;padding:1.6mm;font-weight:700}.shule-report-a4 .box{border:1px solid #cbd5e1;border-radius:7px;background:#fff;overflow:hidden}.shule-report-a4 .box-body{padding:2mm}.shule-report-a4 footer{display:grid;grid-template-columns:1fr 1fr;gap:8mm;margin-top:3mm}.shule-report-a4 .sig{border-top:1px solid #64748b;padding-top:2mm}.shule-report-a4 .bottom{position:absolute;left:7mm;right:7mm;bottom:5mm;text-align:center;color:#64748b;font-size:8px}</style><div class="watermark"><img src="${esc(logo)}" alt="watermark"></div><header><img class="logo" src="${esc(logo)}" alt="school logo"><h1>${esc(school.name||school.schoolName||'School Name')}</h1><h2>END TERM REPORT CARD</h2><p>${esc(data.curriculum||'CBC / CBE Curriculum')} • ${esc(data.term||'Term')} ${esc(data.year||new Date().getFullYear())}</p></header><div class="grid"><div class="card">Student<br><b>${esc(student.name||student.studentName||'Student Name')}</b></div><div class="card">Elimu ID<br><b>${esc(student.elimuid||student.elimuId||'—')}</b></div><div class="card">Class / Stream<br><b>${esc(student.className||student.grade||'—')}</b></div><div class="card">Photo<br><b>${student.photo?'Attached':'Placeholder'}</b></div></div><table><thead><tr><th>No</th><th>Learning Area</th>${components.map(x=>`<th>${x}</th>`).join('')}<th>Final</th><th>Grade</th><th>Teacher Remark</th></tr></thead><tbody>${rows}</tbody></table><div class="grid"><div class="card">Overall Mean<br><b>${esc(data.overallAverage??data.academicSummary?.overallAverage??'—')}%</b></div><div class="card">Overall Grade<br><b>${esc(data.overallGrade||data.academicSummary?.overallGrade||'—')}</b></div><div class="card">Attendance<br><b>${esc(data.attendance?.rate??data.attendanceSummary?.rate??'—')}%</b></div><div class="card">Status<br><b>${esc(data.status||'Official report')}</b></div></div><div class="lower"><div class="box"><div class="section-title">Competency Insights</div><div class="box-body"><b>Strengths:</b> ${esc(data.insights?.strengths||'Generated from real marks, attendance, homework and teacher comments.')}<br><b>Needs support:</b> ${esc(data.insights?.support||'Areas needing support appear here.')}<br><b>Next steps:</b> ${esc(data.insights?.nextSteps||'Parent-friendly next steps appear here.')}</div></div><div class="box"><div class="section-title" style="background:#11B5B1">Attendance</div><div class="box-body">Present: ${esc(data.attendance?.present??'—')}<br>Absent: ${esc(data.attendance?.absent??'—')}<br>Late: ${esc(data.attendance?.late??'—')}</div></div><div class="box"><div class="section-title">Account Summary</div><div class="box-body">Fee balance: ${data.feeBalance==null?'—':'KES '+Number(data.feeBalance||0).toLocaleString('en-KE')}<br><small>Shown only if school enables it.</small></div></div></div><footer><div><b>Class Teacher Comment</b><p>${esc(data.comments?.classTeacher||'Teacher comment appears here.')}</p><div class="sig">Class Teacher Signature</div></div><div><b>Head Teacher Comment</b><p>${esc(data.comments?.headteacher||'Head teacher comment appears here.')}</p><div class="sig">Head Teacher Signature</div></div></footer><div class="bottom">Generated with Shule AI • Official logo/watermark uses school logo, otherwise neutral Shule AI fallback.</div></section>`;
  };
})();


// v150.3: remove fake final report-card mockup cards from dashboards. Official PDFs use report history only.
window.renderFinalReportCardMockup = function(){ return '<div class="rounded-xl border bg-card p-6 text-sm text-muted-foreground">Official report cards appear only after publishing from the class teacher review. Use Report History / View PDF for published snapshots.</div>'; };
