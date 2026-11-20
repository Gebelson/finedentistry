# DentalROI public product benchmark

Research date: 2026-11-20. Scope: official public product pages, compared with the existing Fine Dentistry Next.js/Payload workspace. No authenticated DentalROI account, private demo, integration connection, purchase or patient data was used. The statements below establish advertised capability, not independent verification that DentalROI delivers the workflow as described. No claim that Fine Dentistry surpasses the entire DentalROI service is justified by this research.

## Public evidence and current gaps

| Capability | Official public evidence | Existing Fine Dentistry baseline | Practical next step |
| --- | --- | --- | --- |
| Marketing dashboard | [KPI Dashboard](https://www.dentalroi.com/Marketing-KPI-Dashboard) describes aggregation across marketing channels. | Real first-party website analytics and simple workspace totals. No ad spend or revenue source. | Add date-filtered operational reports, meaningful status breakdowns and aggregate export; keep contact clicks distinct from booked patients. |
| Website analytics | [Website Analytics](https://www.dentalroi.com/Website-Analytics) describes visitor and engagement analysis. | 7/30/90-day views, daily visitor estimates, contact clicks, devices, referrers and countries. | Improve comparisons, chart readability and report context without changing privacy protections or claiming cross-day unique people. |
| Messaging | [Two-Way Texting](https://www.dentalroi.com/Two-Way-Texting) advertises business-number SMS, templates and communication history. | Website conversation history, human takeover, replies and resolution. SMS disconnected. | Add saved reception reply choices and clearer delivery state to the existing website channel. SMS requires an external provider. |
| Managed chat | [Managed Website Chat](https://www.dentalroi.com/Managed-Website-Chat) describes representatives answering and forwarding contacts. | Clinic FAQ assistant plus reception takeover and open/waiting/resolved records. | Actionable inbox queues, visible waiting age, search/filter and clear next actions. Do not imply external staffing or 24-hour monitoring. |
| Scheduling | [Online Scheduling](https://www.dentalroi.com/Online-Scheduling) describes NexHealth availability and PMS synchronization. | Internal planning calendar, doctor conflict validation, four appointment statuses. | Add doctor/status filters, Today action, readable agenda and accurate Orlando dates. Real synchronized booking needs clinic PMS details and a provider connection. |
| Patient/revenue attribution | [PMS Integrations](https://www.dentalroi.com/PMS-Integrations) advertises campaign-to-patient/revenue measurement. | Contact source field and internal records; no clinic financial/PMS feed. | Report only observed workspace activity. Never calculate financial ROI from clicks or internal appointments. |
| Telephony | [Call Tracking and Recording](https://www.dentalroi.com/Call-Tracking-And-Recording) describes forwarding numbers and recordings. | Phone-link click events only. | Label these as clicks. Call recording, routing and confirmed calls require a telephony account and separate implementation. |
| Reviews | [Automated Review Requests](https://www.dentalroi.com/Automated-Review-Requests) describes post-appointment messages via PMS. | No review platform connection or outbound SMS. | Existing official review links can support manual workflows; do not fabricate review counts or automated sending. |
| SEO intelligence | [Ranking Tracker](https://www.dentalroi.com/Search-Engine-Ranking-Tracker) and [Keyword Explorer](https://www.dentalroi.com/Keyword-Explorer) describe rankings, competition and keyword costs/trends. | Existing editable editorial content; no ranking or search-data feed. | Build editorial completeness checks using saved fields. Live positions, CPC and search volumes require a real data source. |
| Social content | [Social Media Content Library](https://www.dentalroi.com/Social-Media-Content-Library) describes curated reusable media. | Original blog and persistent media library. | Improve content navigation and draft/publication visibility; use only owned/authorized assets. No social publishing connection is established. |
| Payments | [PatientPayments](https://www.dentalroi.com/Patient-Payments) describes payment pages, financing and dashboard integration. | Official clinic payment link; no local payment processing. | Keep the official payment destination accessible. Do not invent transactions, memberships or credit assessments. |

## Highest-value implementation sequence

1. Make the overview operational: waiting conversations and requested appointments link directly to correctly filtered queues; display real queue age and honest zero states.
2. Upgrade reception efficiency: persisted communication history, compose-only saved replies that staff review before sending, reliable loading/retry/success states, and keyboard-friendly controls. Avoid storing messages or patient identifiers in browser storage or analytics.
3. Upgrade the internal calendar: doctor and status filters, Today reset, accessible month controls, agenda display and explicit Orlando dates. Remove silent record truncation or expose incompleteness when datasets exceed the configured page limit.
4. Replace lifetime report totals with date-filtered operational reports, status/source breakdowns and aggregate-only CSV downloads. Use explicit definitions and zero-denominator handling. Preserve admin-only reporting access.
5. Add editorial attention items based on actual content fields and existing editor permissions. Useful checks include missing excerpt, missing/short search description and draft status; do not invent an SEO score or promise rankings.
6. Improve Connections with three distinct states: active local capability, credentials supplied but unverified, and external dependency not configured. Give a concrete next setup requirement without exposing secrets.

## Evidence limits and implementation cautions

- Official pages are readable descriptions and demo invitations. No signed-in competitor workflow was exercised, and no reliable public detailed dashboard walkthrough was established in the targeted video search. Screenshots and claims of superior usability require local browser evidence.
- The existing validation document confirms durable data, role checks, privacy-sensitive analytics exclusions and deployed smoke coverage. Preserve these while improving usability.
- Existing `cms/appointments.ts` validates scheduled doctor overlaps and duration. Preserve this server validation when introducing calendar controls.
- Existing `components/admin/clinic-calendar.tsx` requests a maximum of 1,000 records for the month and uses browser-local month boundaries while grouping records by Orlando day. Handle pagination and timezone edges before claiming complete calendar accuracy.
- Existing reports use lifetime `count` queries, so interval reporting is a substantive feature rather than cosmetic copy. Never label unlinked contacts/conversations as a deduplicated patient funnel.
- Schema changes require explicit migrations and generated types under the existing production setup. Prefer schema-neutral improvements where the same user value can be delivered safely.
- This benchmark authorizes no deployment, paid plan, account connection or external configuration change.
