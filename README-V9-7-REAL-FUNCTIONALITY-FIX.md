# Shule AI Frontend V9.7 - Real Functionality Fix

This version fixes the V9.6/V9.5 issues where visual overlays blocked real behavior.

## Fixed

### Enter Marks
The marks modal is no longer overridden from an external file.

The working marks modal is patched directly inside:

```txt
js/teacher-dashboard.js
```

That means it can access the real teacher-dashboard state:

```txt
currentMarksStudents
currentMarksClassId
currentMarksClassName
currentMarksSubject
currentMarksTerm
currentMarksYear
```

It now:
- fetches real students through `api.teacher.getClassStudents(classId)`
- displays real students
- keeps hidden `score-${student.id}` inputs for the existing save logic
- uses the existing `saveAllMarks()`
- uses the existing `publishAllMarks()`
- keeps marks entry in Teacher → Grades only

### Admin Marks Removed
Admin no longer has:
- `Exams / Marks` sidebar item
- admin marks preview
- mock marks entry

### Student Details
Student details are now routed globally to the same real-data approved modal:
- Admin view student
- Admin edit student
- Teacher view student
- Unified student modal
- Existing student detail aliases

### Modals Closing
Added:
- Escape key close
- click backdrop close
- duplicate modal cleanup
- robust close for marks modal

### Alerts
Removed demo/fake alert fallback.
If backend has no alerts, the UI shows a real empty state.

### Dark/Light Mode
Added `css/v97-theme-and-stability.css` with broad dark-mode fixes for:
- approved modals
- marks table
- alert center
- forms
- legacy hard-coded white/gray utility classes

## Files added
```txt
css/v97-theme-and-stability.css
js/v97-modal-stability.js
```

## Files patched
```txt
js/teacher-dashboard.js
js/v95-exact-approved-visuals.js
js/v96-functional-approved-visuals.js
js/sidebar.js
js/admin-dashboard.js
index.html
```

## Deploy order
1. Deploy backend V9.7
2. Run `npm run migrate`
3. Restart backend
4. Replace frontend with V9.7
5. Hard refresh browser: Ctrl + Shift + R
