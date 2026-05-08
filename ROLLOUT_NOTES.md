# Shule AI v14 National Rollout - Frontend

This frontend loads `js/national-full-rollout.js` after the existing production stabilizer.

## What the rollout layer does
- Disables all live money collection buttons and STK push calls
- Replaces protected placeholder handlers with real API-backed actions where backend routes exist
- Adds teacher lifecycle actions, duty roster generation, duty swap request, task creation/completion, calendar event save, teacher messaging, school view/manage modals, safe analytics viewer, and a local study-helper tutor
- Keeps the app usable for school operations without exposing users to fake payment success flows
