# Operational admin dashboard implementation plan

Goal: replace the site's editorial treatment in the admin with a compact management interface inspired by the supplied current DentalROI dashboard.

Architecture: retain Payload authentication, roles, navigation and collection editors. Rebuild the dashboard using existing authorized database records; reuse the first-party analytics endpoint for live filters and charts. No schema changes, external integrations or sample business figures.

Design: light gray workspace (#f3f5f8), white panels, blue (#3976d3) header/actions, slate text (#243247), small green/amber status indicators. Arial for all admin UI, 26px page headings, 13px body, 12px table labels. Dense desktop grid, stacked mobile panels; no display serif or marketing copy. Fine Dentistry logo and small Praxis attribution.

1. Add browser regression for dashboard KPIs, embedded traffic chart, real counts, filters, compact title and responsive quick actions; reproduce failure.
2. Rebuild dashboard data/components with role-aware parallel queries, reception/appointments/content summaries, quick actions and integration statuses.
3. Rework shared analytics into a compact dashboard/full view with accessible SVG activity/donut charts and real-data tables.
4. Apply admin-only visual styles and functional page names. Retain site appearance and native auth/editor behavior.
5. Build/lint; run dashboard/layout, analytics, admin-access, chat and calendar checks. Inspect desktop/mobile screenshots. Commit/push, await Vercel and verify the public admin routes.

User delegated design decisions and opted out of further questions earlier. Execute inline; no additional agents.
