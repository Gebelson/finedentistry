# Admin application shell refinement

Goal: replace the generic Payload sidebar and inconsistent presentation with a coherent, practical management application.

Design: slate navigation (#182534), neutral application header and canvas, restrained blue (#315f9f) for actions, unified system UI typography, outlined 18px navigation icons, grouped destinations and explicit active states. Sidebar owns clinic branding, account and sign-out; header uses a compact workspace label. Remove rainbow KPI accents. Keep primary analytics and operational data visible.

Implementation: custom role-aware Payload Nav server/client components using the existing useNav context and native layout lifecycle; admin-only refinement stylesheet; shared icon component; updated native header mark. No new database or external services.

Verification: browser regression for navigation groups, active nested routes, role-specific links, mobile drawer open/close/navigation, account/logout destinations, one sidebar/layout, dashboard/filter behavior, native collection/editor display. Inspect desktop with sidebar open plus mobile. Lint/build and publish with existing authorization; verify deployed routes.

Execute inline, following the user's standing direction to choose details without additional questions and avoid extra agents.
