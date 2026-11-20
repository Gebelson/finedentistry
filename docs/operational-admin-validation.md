# Operational admin redesign — validation

2026-11-19. User supplied current and earlier DentalROI screenshots and requested a practical management interface instead of the public site's editorial design.

Implemented: light admin theme, blue application header, compact typography, explicit Dashboard heading, role-aware operational KPIs and actions, embedded traffic metrics/filter/activity chart/contact-interaction donut, referral/device breakdowns, reception queue, upcoming internal appointments, recent articles and actual connection status. Other custom admin pages now use direct page names and compact styling. Public site styling and database schema are unchanged.

Actual Payload records populate the dashboard with server-enforced admin/editor/reception access. The existing first-party analytics endpoint drives filters. No financial, call-center or email figures were fabricated; unavailable connections are labelled. Calendar entries remain internal planning.

Validation: optimized build and lint passed. Browser tests passed for live article-count equality, four operational KPIs, embedded analytics, working period filter, compact heading, light theme and 1440/768/390 layouts. Layout tests covered all custom views and native articles, menu toggles, single navigation, mobile return to dashboard and no horizontal overflow. Existing analytics privacy/access, login/roles, visitor/staff chat and calendar suites passed. Browser runtime-error collection was empty after fixing SVG title text hydration. Screenshots: `.cache/admin-qa/operational-dashboard-*.png`.

Rendering issue resolved: SVG title content is passed as one string so React and the browser agree on the server-rendered SVG text. The browser dashboard regression captures hydration/runtime errors.
