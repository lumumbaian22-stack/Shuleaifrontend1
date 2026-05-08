# Shule AI Frontend V6 Refinements

Changes:
- Removed dashboard-embedded charts from teacher/student dashboards.
- Dashboard pages no longer auto-initialize Chart.js.
- Analytics charts initialize only inside the Analytics section.
- Analytics API calls are cache-busted so they fetch fresh data each time.
- Parent chat no longer assumes/mixes first conversation messages; it shows parent-owned conversations and loads a selected conversation.
- Teacher dashboard parent messages are filtered to parent-only conversations.

Deploy after backend V6.