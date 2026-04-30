# Shule AI Frontend V7 Complete Academic Suite

Uses chosen UI direction:
- Card-based dashboards.
- Editable break-aware timetable.
- Simple marks entry modal.
- Report Card Option 1 Modern Blue.

## Where to test

### Admin
Open Admin → Timetable.
You should see:
- Breaks & Durations button.
- Generate Timetable button.
- Class tabs after generation.
- Editable slots.

### Teacher
Open Teacher dashboard.
You should see:
- Academic Tools card.
- Open Marks Entry button.
- Marks modal with class, subject, term, year, assessment type, backtesting mode, grading scale, student rows, Analyze, Save Draft.

### Report Card
Use:
```js
v7OpenReportCard(studentId)
```
from browser console or hook it into a student detail button after marks are published.
