# Shule AI Frontend V9.5 - Exact Approved Visuals

This version fixes the problem where V9.4 used generic modals instead of the exact approved visual presentations.

## What changed

V9.5 adds an override layer:

- `css/v95-exact-approved-visuals.css`
- `js/v95-exact-approved-visuals.js`

These load after V9.4 and force the approved UI designs to appear.

## Exact approved visuals now implemented

### Teacher Details / Edit Teacher
Matches the approved teacher modal structure:
- large centered modal
- left profile image column
- three-column form
- role chips
- class teacher / subject teacher cards
- assigned classes and assigned subjects cards
- location and notes
- reset password / archive / save buttons

### Student Details / Edit Student
Matches the approved student modal structure:
- left student profile column
- student school type/status side card
- school info row
- parents/guardians panel
- fee/account card
- medical and discipline notes
- clubs and prefect roles
- update student button

### School Registration
Matches the approved Register Your School visual:
- left welcome/illustration panel
- school information
- school type cards: Day, Boarding, Day & Boarding
- school level cards
- admin account fields
- create school account button

### Alerts Center
Matches the approved alerts dashboard:
- Admin / Teacher / Parent / Student view tabs
- alert category filter chips
- alert list rows
- right overview cards
- quick filters layout

### Create Alert Popup
Matches the approved create alert modal:
- title, category, severity row
- rich text area
- target audience checkboxes
- delivery methods
- schedule section
- right preview pane
- review and send button

### Marks Entry Popup
Matches the approved marks entry direction:
- class/subject/term selectors
- student marks table
- CAT / Exam / Total / Grade / Remarks
- right entry summary
- moderation and approval card
- submit/publish actions

## Backend
Use the matching V9.5 backend zip. The backend is the same stabilized V9.4 backend with:
- school type support
- alert severity/audience support
- student/teacher edit support
- V9.3 duty GPS/QR
- department group chat fix

## Deploy order

1. Deploy backend V9.5
2. Run `npm run migrate`
3. Restart backend
4. Replace frontend with V9.5
