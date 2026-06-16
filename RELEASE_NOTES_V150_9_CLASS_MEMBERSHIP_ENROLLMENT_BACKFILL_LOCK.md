# Shule AI v150.9 - Class Membership + Enrollment Backfill Lock

This build repairs the class membership pipeline without redesigning dashboards.

- Adds idempotent v150.9 migration to create active StudentEnrollment rows for existing students where a safe class match exists.
- Syncs Students.classId and Students.activeEnrollmentId from active enrollments.
- Does not blindly assign ambiguous grades such as Grade 10A when no exact active class exists.
- Manual teacher admission now creates StudentEnrollment and activeEnrollmentId when a class can be resolved.
- Teacher CSV upload and shared CSV processor now create active StudentEnrollment rows.
- Admin class-student list now uses the shared class membership resolver.
- Student group messaging now uses resolved class membership instead of classId-only fallback.
- Frontend cache bumped to v1509.
