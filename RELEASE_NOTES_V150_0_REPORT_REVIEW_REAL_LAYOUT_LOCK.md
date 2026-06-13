# Shule AI v150.0 — Report Review Real Layout Lock

This frontend build replaces the actual class-teacher report-review rendering path, not only the design mockup.

Locked changes:
- Removes the old confusing Review Full Class Report / Saved Term Reports mixed layout from the active class-teacher report review path.
- Current Draft Review, Published Archive, and Data Issues are separate tabs.
- The old compressed subject-mark student table is no longer displayed directly under the report review panel.
- Class roster is simplified and separate from report review.
- Report review auto-loads after the class teacher students screen renders.
- Publish is blocked by unresolved duplicate identities or missing marks.
- Frontend cache is bumped to ?v=1500.
