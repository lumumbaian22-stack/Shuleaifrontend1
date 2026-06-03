SHULE AI v128 FRONTEND ROOT DEPLOY FIX

This package fixes the plain unstyled page problem caused when index.html is deployed without its css/js/assets folders at the same web root.

Deploy the CONTENTS of this folder to the static site root.
Your deployed root must contain:
- index.html
- css/
- js/
- assets/
- manifest.json
- service-worker.js
- CNAME

Do NOT deploy only index.html.
Do NOT deploy the outer source folder as the website root.
After deploy, clear site data for shuleai.live or hard refresh Ctrl+Shift+R.

Backend code is unchanged from v127. This is a frontend deployment/root packaging fix only.
