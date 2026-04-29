# Shule AI frontend - original styling preserved

This package keeps your original HTML, Tailwind styling, assets, pages, and dashboard scripts.

Fixes applied:
- Preserved original `index.html`, `css/style.css`, `assets/`, `pages/`, and all dashboard UI files.
- Fixed missing script reference: `admin-approvals.js` → `admin-approval.js`.
- Added `js/boot-guard.js` so runtime errors show on-screen instead of a blank white page.
- Added `js/app-health.js` so an empty dashboard recovers with a visible message.
- Patched known wrong frontend API endpoint aliases to match the scanned backend routes.
- Added configurable backend URL.

## Run

```bash
cd shule-ai-frontend-original-style-fixed
python -m http.server 5173
```

Open:

```text
http://localhost:5173
```

## Backend URL

Default backend:

```text
https://shuleaibackend-32h1.onrender.com
```

To change it from the browser console:

```js
setShuleApiBaseUrl('http://localhost:5000')
```

Then reload.
