# Shule AI v150.5 — Final Logic Lock

Base: stable v149.8 timetable DB lock plus safe v150.3 dashboard line.

Targeted fixes applied only to agreed areas:
- Class Transfer: class-first dropdown, student list per class, clear from/to review and success text.
- Report Card History: class-first archive with class and learner filters; official immutable PDFs preserved.
- Report Card Settings: removed from admin sidebar; remains reachable inside School Settings.
- Timetable conflict handling: exact conflict panel from backend conflict payload; no generic toast loop.
- Class birthdays: teacher assigned-class resolution includes TeacherSubjectAssignment class-teacher records.
- Report preview: draft preview calculates subject averages from current saved assessments when academic summary is blank; draft wording fixed.
- Profile pictures: stale /uploads profile paths fall back safely.
- Cache bumped to ?v=1505.

Not touched:
- v149.8 timetable DB write/retry backend fix.
- Auth/session core.
- Parent/student dashboard core beyond display-safe fixes.
- Realtime architecture.
