# Clinic administration — first delivery

Historical access-only delivery. For the current functional content/reception workspace, see `clinic-workspace-validation.md`.

Validated on 2026-11-19, locally. Not deployed.

Follow-up: username-or-email login enabled and the requested local administrator provisioned. Browser verification passed for that username, admin role and logout; a second account with a short password was rejected with 400. The private local bootstrap exception does not apply to accounts created through the panel. An empty local database migration encountered a Drizzle schema-push error; the empty database was backed up and rebuilt with the new schema. Existing accounts: zero before provisioning. No password is recorded in this report or source code.

## Implemented

- Footer entry: Clinic login → /admin.
- Isolated Payload authentication/admin routes; public pages keep their existing content and styling.
- Branded login and initial dashboard with real team count and explicit integration status.
- Administrator-managed accounts; admin, editor and reception roles enforced server-side.
- CLI-only initial administrator setup; public account creation and the first-register endpoint are rejected even with an empty database.
- HTTP-only session cookie, one-hour sessions, production secure cookies, 14-character password minimum, login attempt limits and explicit CSRF origins.
- Private/no-store and noindex response headers on admin/API routes; robots excludes these routes even if the public site is indexed later.
- Disabled email adapter and honest recovery information until delivery is configured.

## Evidence

- npm run build: passed, 297 static pages plus dynamic admin/API routes; no build warnings in the final run.
- npm run typecheck and npm run lint: passed.
- Browser session suite passed on both development and the local production server: footer navigation, guest rejection, invalid login, successful login, HTTP-only cookie, cross-origin mutation rejection, role escalation rejection, team creation/deletion, logout, mobile layout and recovery information.
- Public first-register request with an empty database returned 403 before private account provisioning.
- npm test: booking dialog/fallback and keyboard test passed against the local production server.
- /about, /services, /smile-gallery and the bridge-versus-implant article returned 200 on the production server.
- Public home, catch-all content page and not-found source are identical to their prior versions after newline normalization. Their files moved into the public route group.
- Desktop dashboard and mobile login screenshots inspected in .cache/admin-qa/. A missing Payload stylesheet was detected visually, fixed, and covered by an additional input-height assertion.
- Tests create random temporary credentials without printing the password; fixture accounts are removed afterward. No default administrator remains.

## Deployment prerequisites / limits

Production PostgreSQL, migrations, a stable secret and the authorized HTTPS origin are still required. SQLite is local only and excluded from deployment. Production database migrations and external setup were not executed.

Website editing, blog content migration into Payload, the assistant, human inbox, appointment scheduling, marketing and payments are subsequent modules; none are represented as connected.

npm audit reports six moderate dependency findings in the Drizzle tooling → @esbuild-kit → esbuild chain, with no upstream fix offered for the current dependency set. Two lower-severity DOMPurify/Monaco findings were removed by pinning DOMPurify 3.4.18. No esbuild development server is exposed by this app. This dependency report does not constitute a full security audit.

The machine's global Node remains 24.13.1; npm scripts use the project-installed 24.22.3 runtime. The package engine and README require the supported 24.22.3+ line.
