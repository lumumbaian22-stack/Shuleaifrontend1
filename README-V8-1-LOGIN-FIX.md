# Shule AI Frontend V8.1 Login Fix

This version fixes the unhelpful login error:

```txt
Request failed with status 400
```

## What changed

- Frontend now displays backend validation errors from `{ errors: [...] }`.
- Regular Admin/Teacher/Parent login clearly requires email, because the current backend validator rejects phone values.
- Super Admin login validates email before sending.
- Login modal now shows inline error messages inside the modal.
- Existing landing page, dashboard design, and API wiring are preserved.

## Important

If you want phone login later, backend validation must be changed from:

```js
body('email').optional().isEmail()
```

to accepting either email or phone.
