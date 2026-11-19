# Clinic workspace — content and reception delivery

Date: 2026-11-19. Environment: local only, http://127.0.0.1:3010. This supersedes the implementation status in the first access-only report.

## Functional modules

1. Authenticated team administration with administrator/editor/reception permissions.
2. Homepage Dev Mode: hero, introduction, treatment heading and final banner copy/images; draft, published state and version history.
3. Authenticated live preview using the real homepage components and desktop/mobile viewport controls. Preview pages do not expose drafts to anonymous visitors.
4. Blog: 222 imported articles; visual editor for paragraphs, headings, lists, links, tables and images; author/source details, dates and SEO metadata; publication updates the public route and journal.
5. Public website media library with six existing clinic photographs and upload/selection controls. Uploaded files are website assets, not private patient documents.
6. Website reception inbox: private visitor conversation credentials, transcripts, staff replies, takeover and resolve; the browser polls for updates.
7. Configurable reception-only, FAQ-only and hybrid chat. This is a deterministic FAQ assistant using existing practice information, not generative AI. Clinical/symptom questions are directed to the practice phone.
8. Reception contacts and an internal monthly calendar in Orlando time. Appointment entry validates date ordering/duration and checks same-doctor overlaps. No online booking or external patient confirmation is claimed.
9. Live aggregate workspace reports. No invented traffic, patient acquisition or ROI figures.
10. Integration status page distinguishing active local capabilities from missing external services.

## Verification evidence

- Content suite: all 222 body/author structures equal the original import; draft route returns 404 publicly; authenticated draft preview renders links/tables; visual editing persists; publishing creates a usable public route and journal entry; unsafe AST content is rejected; homepage draft remains private and public content is restored after testing.
- Chat suite: tokenless visitor access and unauthorized transcript access rejected; FAQ response persisted; handoff changes ownership; reception UI reply appears in visitor messages; assistant stops after takeover; resolve works; mobile widget sends a real stored message without page overflow.
- Calendar suite: contact/appointment creation, invalid duration rejection, overlapping same-doctor rejection, different-doctor availability, calendar rendering on desktop/mobile, anonymous data rejection and editor-role restrictions.
- Manual browser checks: dashboard, calendar, reports, integrations and homepage editor return 200. Live-preview iframe renders the team hero, and the Mobile control sets a 390px viewport. Browser runtime error collection on dashboard/editor was empty.
- Visual evidence: .cache/admin-qa/, including dev-mode-loaded.png and dev-mode-mobile-preview.png. Build/lint/typecheck and final production-suite results are recorded by the completion report after execution.

## Data and security boundaries

Public pages consume published CMS data through cached server queries. Draft previews require a current administrator/editor session. Reception data is denied to content editors and anonymous clients. Chat visitor credentials are random; only their hashes are stored in the database. No chat transcript is stored in browser persistence or analytics.

The local database was backed up during schema work. A Drizzle schema-push failure affected internal relation-table upgrades; nullable references were aligned, account/article counts verified, and automatic schema pushes during requests disabled. Existing login and all imported articles were preserved. Future schema changes require deliberate migrations. Local database files and media are excluded from Git and Vercel uploads.

## Remaining scope

This is not complete DentalROI parity. Generative AI, external scheduling/PMS integration, SMS, email delivery, call tracking/recording, marketing campaigns, Google/social account connections, rank/keyword data, patient-intake forms, payment plans and memberships still require implementation and authorized service configuration. Preview search indexing remains disabled. Appointment checks are suitable for the internal local planning flow; public booking needs transaction-level concurrency protection and validation against the clinic calendar. Chat rate limits currently run in process memory; production needs shared abuse controls and operational hardening.

Production PostgreSQL, persistent media storage, migrations and approved deployment remain prerequisites. No production deployment or external account changes were performed. This implementation makes no automatic healthcare-compliance claim.

## Final production verification

Executed against the local optimized production server after the final build:

- `npm run lint`: passed.
- `npm run build`: passed, including TypeScript and 298 prerendered/static routes; admin/API/preview routes remain dynamic.
- `npm run test:admin`: passed authenticated login, permissions, HTTP-only session, CSRF rejection, logout and mobile layout.
- `npm run test:content`: passed import fidelity for 222 articles/authors, private drafts, visual editing/autosave, image selection, publish/new public route/journal, unsafe content rejection and private homepage preview.
- `npm run test:chat`: passed visitor isolation, protected transcripts, FAQ response, handoff, reception UI reply, ownership after takeover, resolution and mobile widget.
- `npm run test:calendar`: passed contacts, internal planning records, overlapping same-doctor rejection, different-doctor entries, invalid duration, responsive calendar and role restrictions.
- `npm test`: existing booking fallback and keyboard behavior passed.
- `node tests/blog-content.cjs`: passed all 222 source records, 966 links, 15 tables, bylines/disclaimers, 320/390/768/1440 layouts, table panning, scoped accessibility checks and browser runtime-error checks.
- An authenticated multipart image upload returned 201 with a unique filename; an anonymous image fetch returned 200 with PNG content type. The temporary upload was removed afterward.
- Live-preview iframe rendered the real hero; the Mobile selector produced a 390px iframe. Draft-home preview now uses the homepage header treatment.

The existing blog test's page-ready condition was changed from network-idle to DOM-ready plus a visible article table, preserving its content/accessibility assertions. This avoids waiting on unrelated ongoing requests. Test-created content, contacts, appointments, users, conversations and temporary upload records were removed; published homepage values and chat settings were restored. Local chat remains enabled in hybrid mode for review.
