# Clinic access implementation plan

Goal: start the approved Praxis platform with a footer entry and authenticated administration.

Architecture: Payload owns authentication and server access checks. Separate Next route groups keep public styling, transitions and bundles outside the admin. Local SQLite enables testing; production requires a persistent PostgreSQL database and a stable secret. No external services are provisioned in this stage.

Scope: footer login, branded admin/login, administrator-managed users with admin/editor/reception roles, and a truthful initial dashboard. No fake appointments, conversations or analytics. Initial administrator creation is CLI-only; public registration is blocked, including the first-user endpoint.

Tasks:
- Add browser checks for footer access, guest protection, rejected registration and login/logout.
- Integrate Payload, isolated route layouts, database configuration and a local administrator setup command.
- Add server-enforced user permissions, branding and initial dashboard with explicit integration status.
- Run focused auth/security browser checks, public navigation regression, typecheck, lint and build.

Acceptance: guest cannot access protected user data or create accounts; invalid credentials fail; authenticated access works; logout removes access; public home and internal routes remain intact; mobile login is usable; local secrets/database never enter Git.

This implements the first slice of the agreed administration brief at work/clinic-admin/implementation-brief.md. Website editing, blog migration into the CMS, assistant, inbox and scheduling remain subsequent work.
