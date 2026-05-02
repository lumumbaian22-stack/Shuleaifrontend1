# Shule AI Frontend V9.6 - Functional Approved Visuals

This version fixes the V9.5 problem where the approved visuals appeared but some functionality was static/mock.

## Fixed

### 1. Admin Enter Marks removed
Admin no longer has `Exams / Marks` in sidebar.
Admin dashboard no longer renders an enter marks preview.

Marks entry belongs only in:

```txt
Teacher Dashboard → Grades
```

### 2. Marks entry restored to real teacher workflow
The approved marks popup still appears visually, but it now keeps the real teacher marks flow:

- Uses `currentMarksStudents`
- Uses `currentMarksSubject`
- Uses `currentMarksClassId`
- Uses `currentMarksTerm`
- Uses `currentMarksYear`
- Uses original `api.teacher.enterMarks`
- Uses original publish workflow through `api.teacher.publishMarks`
- Uses real students loaded from teacher class endpoint
- No mock students

### 3. Student details now global and real
The old student information view has been replaced across the app through aliases:

- `viewStudentDetails`
- `adminViewStudentDetails`
- `adminEditStudent`
- `editStudent`
- `showUnifiedStudentModal`
- `showStudentDetailsModal`
- `adminShowStudentDetailsModal`
- `showStudentDetailModalFromStudent`

So admin, teacher, and unified student detail flows now open the approved V9.6 modal.

### 4. No mock alert data
Alerts Center no longer injects demo alerts.
If backend has no alerts, it shows an empty state.

### 5. V9.5 visuals preserved
The exact approved visuals are preserved, but now attached to real backend/data flows.

## Deploy order

1. Deploy backend V9.6
2. Run:

```bash
npm run migrate
```

3. Restart backend
4. Replace frontend with V9.6

## Important
Hard refresh browser after deployment:

```txt
Ctrl + Shift + R
```
