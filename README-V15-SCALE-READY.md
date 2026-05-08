# Shule AI Frontend v15 Scale Upgrade

Adds scale-safe frontend helpers:

- `scaleAPI.students/teachers/parents/...` use paginated backend endpoints.
- `v15LoadScaleStudents()` and `v15LoadScaleTeachers()` render paged tables where matching containers exist.
- `v15QueueLargeImport()` sends heavy imports into the queue foundation instead of pretending a large import should run in one browser request.

Deploy this with backend v15.
