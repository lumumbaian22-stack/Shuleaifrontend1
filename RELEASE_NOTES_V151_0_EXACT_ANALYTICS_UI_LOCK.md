# Shule AI v151.0 — Exact Analytics UI Lock

This build keeps the v150.9 database/class-membership repair intact and changes only the Analytics presentation layer.

## Locked changes
- Adds an exact visual Analytics layout matching the approved generated designs.
- Adds role-specific Analytics screens for Super Admin, School Admin, Teacher, Finance Officer, Parent, and Student.
- Adds scoped analytics CSS only under `.analytics-exact-lock` so working dashboard screens are not restyled.
- Keeps all existing API calls and backend linkage logic untouched.
- Adds Finance Officer Analytics navigation and renderer using existing `/api/finance/analytics` and `/api/finance/overview` endpoints.
- Bumps frontend cache to `?v=1510` and service worker cache to `shule-ai-1510-exact-analytics-ui-lock`.

## Not touched
- v150.9 StudentEnrollment backfill and class membership logic.
- Timetable save/publish.
- Report-card access and snapshots.
- Parent/student/teacher linkage repair.
- Finance backend operations.
