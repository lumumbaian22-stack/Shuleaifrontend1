# Shule AI Frontend V9.4

## Added

### Teacher details popup
- Premium view modal
- Full profile overview
- Assigned classes/subjects
- Duty/performance/recent activity cards
- Edit Teacher Details modal
- Save changes through `api.admin.updateTeacher`

### Student details popup
- Premium student view modal
- Full profile summary
- Parent/guardian details
- Assessment number, NEMIS, location
- Clubs/prefect roles
- Edit Student Details modal
- Save changes through `api.admin.updateStudent`

### School registration school type
Admin signup now includes:
- Day School
- Boarding School
- Day & Boarding

The value is sent as `schoolType`.

### Alerts Center
- Added Alerts Center sidebar item
- Role-aware alerts view for admin, teacher, parent, student, super admin
- Severity: low, medium, high, critical
- Create Alert modal
- Audience targeting by role
- Delivery method selection: in-app, SMS, email
- Sends through `/api/alerts`

### Marks Entry popup
- Premium marks entry modal
- Exam/class/subject/term selectors
- CAT + Exam score columns
- Auto total and grade
- Entry summary
- Submit for review / Publish
- Saves through existing `api.teacher.enterMarks`

## Also preserved
- V9.3 Duty GPS/QR verification
- V9.3 department group chat fix
- V9.3 stable global profile image handling
- V9.2 departments
- V9.1 teacher messages
- V8.2 student login fix

## Deploy order
1. Deploy backend V9.4
2. Run `npm run migrate`
3. Restart backend
4. Replace frontend with V9.4
