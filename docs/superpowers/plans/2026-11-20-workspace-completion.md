# Fine Dentistry workspace completion plan

> **For agentic workers:** Execute the independent workstreams with scoped agents and run root integration verification before release.

**Goal:** Make the existing clinic workspace materially more useful, polished and reliable, informed by public DentalROI evidence and reviewed GitHub projects.
**Architecture:** Keep Next.js/Payload, server-enforced roles, persistent PostgreSQL/Blob and the public site. Reuse supported hooks and small compatible libraries. Do not replace the stack or present missing external services as active.
**Tech Stack:** Next 16, React 19, Payload 3, PostgreSQL, Playwright, jose, @date-fns/tz.
**Spec:** Latest user requests authorize autonomous work, agents, research, persistent login, published improvements, no questions.

## Constraints

- UI en-US; reports pt-BR. Keep preview noindex.
- No personal/medical data in browser storage, analytics or logs.
- No paid plans, external communications or invented integrations/results.
- Preserve native single Payload shell and server authorization; keep logout/session revocation.
- Keep independently owned files isolated across agents; review diffs before deployment.

## Review focus

- Persistent tokens must have no inactivity deadline yet remain revocable; cookies remain HttpOnly/Secure/SameSite and subject to browser retention.
- Rapid calendar navigation must ignore stale requests; month limits and Today use Orlando/DST, with pagination and clear errors.
- Chat failure/slow send must preserve in-progress drafts, avoid duplicates and recover without unhandled promises.
- Editor must retain original article formatting and reject unsafe links/content.
- Every displayed metric/function must correspond to actual data or a clearly disclosed external prerequisite.

## Workstreams

- [x] Research: official DentalROI capability matrix and GitHub license/fit evaluation.
- [x] Authentication: native revocable sessions with non-expiring signed tokens, rolling browser cookie and regression tests for logout/replay.
- [x] Calendar: Orlando time boundaries using date-fns/tz, Today, filters, month/agenda view, pagination, retry and tests.
- [x] Reception/editor: reliable composer/polling, quick replies, malformed request handling, preserved rich formatting and focused tests.
- [x] Design: coherent application tokens/sidebar/dashboard, responsive/native form consistency and restrained motion.
- [x] Reporting: useful actual period-based operational summaries/export if implementation remains schema-neutral.
- [x] Integration gate: lint, type/build, full admin/site connected-flow regression, desktop/mobile screenshots, accessibility and console checks.
- [x] Review, release to authorized GitHub/Vercel target, verify public alias and changed workflows; restore/delete fixtures and report exact capabilities/limits.
