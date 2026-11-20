# Application shell and navigation refinement

2026-11-20. User requested a more mature admin experience, explicitly including the sidebar, and asked to apply relevant skills.

Applied Frontend Design, Frontend Responsive UI and Web Design Guidelines. Reviewed the current guideline source from vercel-labs/web-interface-guidelines. Design: slate sidebar, clinic branding, grouped destinations, consistent outline icons, nested-route active state, account/sign-out footer, quiet application header, neutral KPI panels and consistent system UI typography.

Replaced the default Payload navigation via its supported custom Nav component. The client uses the existing useNav lifecycle for hydration, inert state, transitions, scroll reference and drawer state. Destination visibility follows admin/editor/reception roles; server API permissions remain authoritative. Sidebar links close the drawer on mobile. Retired the previous supplementary navigation exports/configuration.

Admin-only styling unifies dashboard, tables, native article list, editor controls, calendar, reports, connections and header. No external services or database schema changes.

Verification: optimized build, lint and TypeScript passed. New browser regression covers grouped navigation, exact active destination, native article list and rich editor, account/logout destinations, mobile resize/close/reopen/link navigation, single layout and runtime errors. Existing dashboard, layout and login/role suites passed, including the editor's content-only menu. Scoped axe WCAG 2 A/AA checks on navigation and dashboard returned no violations after increasing table-header contrast. Screenshots in `.cache/admin-qa/refined-*.png`.

The visual review included the desktop dashboard with expanded navigation, native article list and editor, and mobile drawer/analytics. CSS also gives compact supporting text stronger contrast and preserves keyboard focus indicators and reduced-motion behavior.

## Typography and interaction refinement — 2026-11-20

Self-hosted the original Inter variable WOFF2 from the Inter project, retaining its OFL license in public/fonts. Admin-only font face and compact type scale now apply consistently. Sidebar branding/collapse control were aligned; the native floating collapse control is hidden while the custom sidebar is open, and remains the reopen control when closed. Desktop and mobile actions are tested separately.

KPI cards now use meaningful outline icons and destination-specific action labels. Empty reception/calendar states give clearer context. Chart dates use readable month/day labels; count axes use integer ticks and adapt to low traffic. The activity chart now supports pointer/touch inspection, arrow keys, Home/End and Escape, with a visible tooltip and an accessible live announcement. No new visitor identifiers or storage were introduced.

Verification: lint, typecheck and optimized build passed; navigation/dashboard/layout suites passed, including self-hosted font loading, collapse/reopen and chart pointer/keyboard interactions. The existing scoped WCAG A/AA checks and runtime-error collection passed. Analytics HTTP/privacy/filter suite also passed. Visual refinements include natural-height content panels and properly sized decorative empty-state icons.
