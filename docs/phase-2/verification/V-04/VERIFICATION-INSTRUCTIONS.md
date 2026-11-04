<!-- V-04/VERIFICATION-INSTRUCTIONS.md -->
# V-04 — VERIFY SECURITY
Re-run: gate:security, audit:policy, scan:secrets, check, build:netlify.
Falsify: F-05, F-07, F-08, plus: rename a PDF to .xlsx; send a zip-slip archive;
call /api/auth/refresh with an expired token; call the proxy with 169.254.169.254.
Then deploy a preview and curl the headers yourself — do not accept a local test.
  - confirm no stack trace in any production 500
  - confirm the RBAC matrix covers 100% of project-scoped routes
  - confirm the xlsx exception has an owner AND an expiry
  - confirm .xls still parses after the migration (this is R-04, the biggest risk)
Fail if: the .xls capability regressed, or any route is unguarded, or a secret is in
the bundle.
