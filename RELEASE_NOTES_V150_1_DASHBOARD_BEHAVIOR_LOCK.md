# Shule AI v150.1 — Dashboard Behaviour Lock

This frontend release fixes the v150.0 behaviour regressions while keeping the working v149.8 timetable DB stability.

## Locked fixes
- Removed Final Report Card / Report Cards navigation from role sidebars.
- Removed the final report-card preview/mockup card from the report history view.
- Restored class teacher My Students roster fallback so the assigned class is shown even when the primary endpoint returns empty/fails transiently.
- Added inline marks editing inside expanded class-teacher report review rows, saving directly through the teacher marks API.
- Report publishing can proceed with unresolved issues after explicit confirmation; the issue summary is sent with the publish request.
- Parent timetable supports selected linked child and shows current/today lessons.
- Student/parent timetable rendering uses published class timetable subjects instead of compact class summaries.
- Student leaderboard, badges and learning tasks no longer remain stuck on Loading; they show data or honest empty states.
- Report card PDF opening now uses report history first to avoid noisy latest-report 404s.
- Stale legacy /uploads profile/signature paths are safely ignored/fallbacked.
- API retry handling is more tolerant of transient connection closures.

## Cache
Frontend cache/script version: `?v=1501`.
