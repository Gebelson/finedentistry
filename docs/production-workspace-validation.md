# Production workspace and website analytics

Date: 2026-11-19. Target: existing finedentistry project, zapi-group, production. Release authorized by the user. Neon Free legal acceptance was explicitly authorized and completed. No paid plan upgrade.

## Infrastructure and preserved data

- Persistent Neon PostgreSQL, explicit versioned Payload baseline migration, runtime schema push disabled.
- Public Vercel Blob for editorial assets, direct authenticated uploads and immutable filenames.
- Existing administrator login preserved without source-code credentials; new stable production session secret.
- All 222 original article bodies and author structures compared against the local source; six clinic images verified in persistent storage.
- Test fixtures removed: one administrator, 222 articles, six editorial images, zero synthetic contacts/appointments/conversations/messages before activation.

## Analytics

- Admin overview and `/admin/analytics`, with 7/30/90-day filters, page views, daily visitor estimates, five-minute activity, referral categories, devices, countries and contact clicks.
- Real collection only, starting at activation. Visitor-days are summed daily estimates; contact clicks are not confirmed appointments.
- No browser identifiers, messages, patient fields, full referrers or query strings. Raw IP/user-agent values are not stored; a keyed daily estimate is separate from aggregate page dimensions.
- Staff sessions, bots, DNT/GPC and private routes excluded. Administrator-only summary endpoint.
- Synthetic deployed page-view/contact events were verified through the endpoint and Neon, then removed before activation.

## Verification

- Local optimized build/typecheck, lint, analytics storage/privacy tests and booking dialog smoke test passed.
- Staged production Vercel build passed. Browser plugin unavailable; Playwright used for the repository's end-to-end tests.
- Deployed browser suites passed: footer login, closed registration, authentication/permissions/logout, analytics privacy/filters/mobile layout/noindex, article fidelity and rich editing/publication/private drafts, chat isolation/FAQ/handoff/reception replies/resolution/mobile widget, contacts and calendar validation/role restrictions.
- Native browser upload above 4.5 MB passed through direct Blob storage and returned an accessible image. Temporary upload removed afterward.
- Chat test now waits for the saved POST and reception transcript entry, rather than matching text still in the reply input.
- Evidence screenshots in `.cache/admin-qa/`, including analytics-desktop.png and analytics-mobile.png. Access credentials and deployment automation token are excluded from Git.

## Deliberate limits

The assistant uses the clinic FAQ; generative AI is not configured. The calendar is internal planning and does not synchronize with an unknown practice-management system or confirm appointments. SMS, external email, telephone tracking, campaigns, payment processing and external marketing accounts are not connected. No claim of full DentalROI parity is made. Preview-domain indexing remains disabled.
