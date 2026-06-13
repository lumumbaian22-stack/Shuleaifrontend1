# Shule AI v149.4 Final Console Audit Lock — Frontend

This frontend package is rebuilt from the uploaded `files(2).zip` source and repairs the confirmed console-audit blockers.

## Included fixes
- Restored `listAllTeachersAndClasses` instead of leaving the old missing-function export removed.
- Confirmed/kept `updateGradeDisplayForStudent`, `addBlackoutDate`, `saveDutyPreferences`, `addCustomSubject`, and `removeCustomSubject` as real runtime functions.
- Replaced student modal raw report-card print with the official published report history PDF flow.
- Replaced local-only `sendStudentMessage` behavior with backend-persisted student group messaging.
- Blocked stale `/uploads/signatures` and `/uploads/profiles` media URLs from being retried in the browser.
- Added runtime self-test for the required window functions.
- Bumped active assets, service worker cache, and build label to `v149.4-final-console-audit-lock` / `?v=1494`.

## Verification performed
- `node --check` passed for all frontend JS files under `js`.
