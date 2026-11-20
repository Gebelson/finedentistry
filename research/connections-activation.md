# Connection activation evidence — 2026-11-20

User requested operational connections and opted out of questions. Existing project: zapi-group/finedentistry, PostgreSQL and Blob already provisioned. No new paid service, domain/DNS change, payment charge or external email/SMS/call was authorized by this implementation.

## Available implementation

- `/api/workspace-connections` is administrator-only. GET performs real database/FAQ/analytics reads and returns privacy-safe status details and check time. POST accepts only a same-origin `{action:"ai"}` neutral model probe. Credential values, raw provider errors and patient records are never returned.
- Connections UI supports refresh, retry, an actual AI test, explicit prerequisites and links to the actual tools/provider setup. Verified describes the named read/generation check, not a full synthetic delivery test. Blob configuration is explicitly distinguished from an actual object upload/delivery check.
- The website assistant optionally uses Vercel AI Gateway with project OIDC. Only locally selected, public source FAQ question/answer text is sent. Visitor messages, identities, transcripts and metadata are excluded. Clinical/unmatched questions stay local. The live model catalog must identify every published price as zero before generation; failures retain FAQ answers. There is no paid fallback or credit purchase. Default model was selected from the actual public catalog: `nvidia/nemotron-3.5-lightning-free`.
- Calendar download returns a private ICS of internally scheduled busy intervals/doctor labels, including events overlapping the selected Orlando month. It is a snapshot, not PMS synchronization. Patient identities/contact/treatment/notes are excluded; UIDs are HMAC opaque. Roles, bounds, pagination, failure handling and actual browser download are tested.

## External blockers found through actual account discovery

`vercel integration list` showed only the existing Neon resource. The production environment contains database/Blob/analytics/auth settings; no Resend, Twilio or Stripe credential was available.

`vercel integration add resend --no-claim --non-interactive --scope zapi-group` returned `action_required / integration_terms_acceptance_required`. No Resend resource was installed. It requires the account owner to review the [Marketplace addendum](https://vercel.com/legal/integration-marketplace-end-users-addendum), [Resend terms](https://resend.com/legal/terms-of-service) and [privacy policy](https://resend.com/legal/privacy-policy). The existing Neon acceptance is specific to Neon. Sending to clinic patients additionally needs a verified clinic-owned sender/domain; no DNS changes were made.

The equivalent Stripe install returned the same terms requirement. No Stripe resource was installed. Stripe [business verification/onboarding](https://support.stripe.com/topics/getting-started) and the clinic's payment configuration are separate prerequisites. No merchant identity, bank account or production payment information was invented.

Telephony has no authorized account/number. [Twilio trial requirements](https://www.twilio.com/docs/usage/trials) include verified recipients and restrictions. No number was purchased and no calls/messages were placed. The clinic's practice-management vendor/API remains unknown, so actual scheduling synchronization cannot be implemented against a guessed system.

## Validation

Focused tests cover role/CSRF access, secret/error suppression, real-check isolation, credential-presence false positives, live model pricing, request-token selection, privacy boundary and reception takeover during generation. Calendar regression covers DST, overlapping month edges, 5,000-record bound, byte folding/escaping, private file output and UI error recovery. Optimized build and lint passed.

Compiled browser checks passed actual internal appointment creation → ICS response, connections refresh/error recovery, 1440/768/390/320 layouts for Connections and calendar, touch sizing, zero scoped Axe violations and no runtime errors. The existing full visitor/reception chat flow and native single-shell layout regression passed. Temporary appointments were deleted by finally cleanup. Production generation verification is a separate release gate; no account capability is inferred solely from the environment toggle.

## Actual production result

Release `2a07de2` reached Ready and the public alias https://finedentistry.vercel.app pointed to `finedentistry-bunew1so5-zapi-group.vercel.app`. The same browser/API test passed against that alias, including a real saved appointment overlapping the month boundary, private ICS output, Connections/mobile/error recovery and scoped Axe checks. Its temporary appointment was removed.

The real neutral Gateway generation test returned `customer_verification_required`, mapped to `needs_setup`: “Vercel requires account verification before model access is available.” Project authentication reached the Gateway, but generation is NOT active. `PRACTICE_AI_ENABLED` is configured for the zero-price path; this toggle is not proof of access. No payment method, credit purchase or paid account verification step was performed. Website chat keeps the public FAQ fallback. This external verification gate remains outstanding alongside Resend/Stripe terms, telephony provisioning and clinic PMS access.

References: [Gateway OIDC authentication](https://vercel.com/docs/ai-gateway/authentication-and-byok), [Gateway pricing](https://vercel.com/docs/ai-gateway/pricing), [public model catalog](https://ai-gateway.vercel.sh/v1/models), [Resend Marketplace setup](https://resend.com/docs/guides/vercel-marketplace-integration).
