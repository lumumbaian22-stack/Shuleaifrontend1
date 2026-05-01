# Shule AI Frontend V8.2 Student Login Fix

Fixes the issue where clicking Student Login showed:

```txt
ELIMUID and password required
```

with no Network request.

## Root cause

The Student portal was opening the generic email/password form, but submit logic expected:

```txt
#auth-elimuid
#auth-password
```

Since `#auth-elimuid` did not exist, the frontend stopped before fetching.

## Fix

- Student login now shows a real ELIMUID + password form.
- Submit trims ELIMUID and sends `/api/auth/student/login`.
- Inline error appears inside the modal.
- Added browser console helper:

```js
testStudentAuthForm()
```

It should return `true`.
