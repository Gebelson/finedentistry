# Connections activation implementation plan

**Goal:** Activate and verify every service possible with the existing authorized account, and expose exact external prerequisites without simulated delivery.

**Architecture:** Keep Payload and existing data/roles. Use native Vercel OIDC and a publicly listed zero-price model for a privacy-limited practice assistant. Verify database-backed capabilities through real queries, provide downloadable internal calendar events, and replace configuration-only connection labels with actionable checks. Resend and Stripe installation currently stop at provider terms; no credentials exist for telephony or the clinic PMS.

**Tech stack:** Next/Payload, TypeScript, fetch, Playwright, existing PostgreSQL/Blob.

**Spec:** User requests all connections working and has opted out of questions. No new paid plans, clinic-domain changes, legal acceptance beyond the prior Neon approval, fabricated credentials, patient-data forwarding, or unsolicited messages.

## Tasks

- [x] Implement a bounded Gateway adapter and grounded assistant response path, preserving FAQ fallback and reception takeover. Send only approved public FAQ context, never raw visitor text/history. Verify zero pricing before generation; reject unknown price/auth/account failures without breaking chat. Unit tests with transport injection and a real neutral production probe.
- [x] Add protected connection diagnostics with actual database reads and a real FAQ check, explicit missing prerequisites for external providers, privacy-safe results, no credential values or raw provider errors. Provide a responsive verification UI and useful setup links.
- [x] Add authenticated internal calendar export without patient identifiers, strict UTC interval validation/escaping, role checks and browser download; label this as export rather than PMS synchronization.
- [x] Run focused tests, compiled checks and desktop/mobile connected-flow verification. Independently review new security boundaries, push/deploy only verified changes and verify live alias. Record actual provider blocking responses.

## Review focus

- Never infer operational delivery from credential presence.
- No visitor transcripts, names, contact details or appointments sent to model providers.
- AI failures preserve FAQ answers; a reception takeover during generation prevents assistant append.
- Private diagnostics/exports must reject guests and editors; no secrets or personal data in responses/logs/browser storage.
- External account/terms/identity/domain prerequisites remain visible until actually satisfied. No production payment or email send is simulated.

## Outstanding external activation gates

- [ ] Vercel account verification: actual generation request returned customer_verification_required. The FAQ remains operational; generation is not active.
- [ ] Resend terms/account provisioning and clinic sender/domain verification, followed by actual email implementation and delivery verification.
- [ ] Stripe terms/clinic business onboarding, followed by actual payment implementation and webhook verification.
- [ ] Authorized telephony account, number and messaging registration, followed by actual messaging/call implementation and verification.
- [ ] Identify the clinic PMS and obtain authorized API access, then implement and verify actual synchronization. ICS is an internal busy-time snapshot only.
