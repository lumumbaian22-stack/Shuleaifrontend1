
// Shule AI v149 final locked runtime overrides.
(function(){
  const w=window;
  const esc=(v)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  w.SHULE_BUILD_VERSION='v149.0-final-locked';
  w.getSafeSchoolLogo=function(school){
    const b=school?.branding||school?.settings?.branding||{};
    const logo=b.logoDataUrl||b.logoUrl||b.logo||school?.logo||school?.schoolLogo||'';
    if(!logo || /undefined|null|\/uploads\//i.test(String(logo))) return 'assets/logo.png?v=1490';
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
