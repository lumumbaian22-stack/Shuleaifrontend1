# Shule AI v150.1 — Report Review UX Lock

Base: v149.8 final timetable DB lock.

## Locked changes

- Rebuilt the Class Teacher Control Center report review screen into three clear tabs:
  - Current Draft Review
  - Published Archive
  - Data Issues
- Removed the confusing mixed view where saved published reports and current draft marks appeared together.
- Replaced the wide raw subject-mark table with a clean readiness table:
  - Student
  - Elimu ID
  - Completion
  - Average
  - Attendance
  - Status
  - Actions
- Subject marks now appear inside expandable student rows, not as many cramped columns.
- Added readiness cards for total students, ready students, missing marks, and possible duplicates.
- Added Data Issues panel for:
  - possible duplicate names with different Elimu IDs/student records
  - missing marks
  - attendance records without marks
- Publishing is locked until missing marks and duplicate identity issues are resolved or confirmed.
- Published reports are now shown only inside Published Archive using official report snapshots.
- Cache bumped to ?v=1501.

## Backend

Backend remains the working v149.8 timetable DB lock. No timetable backend changes were made in this UX release.
