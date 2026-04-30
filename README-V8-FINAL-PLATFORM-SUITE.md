# Shule AI Frontend V8 Final Platform Suite

Built on V7.

## Included
- Correct school display-name behavior.
- Sidebar uses approved/platform display name only.
- Super admin command center with live stats.
- Role-aware search panel.
- Role-aware help center.
- Curriculum progress dashboard.
- Existing V7 timetable, marks, and report-card UI retained.
- Analytics/chart fit improvements inherited from V6/V7.

## Test order
1. Login super admin → Dashboard should show live platform stats.
2. Create school/request school name → sidebar remains ShuleAI School until approval.
3. Approve name request → sidebar changes to approved name.
4. Reject request → sidebar remains platform/default name.
5. Admin/Teacher → Curriculum Progress section.
6. Search bar → searches only data allowed for that role.
