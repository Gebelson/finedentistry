# Codex Efficiency Policy

1. `gpt-6.1-sol` is the primary model; never substitute or downgrade automatically. Standard reasoning is medium. Do not escalate to max or ultra for routine tasks.
2. Identify relevant files and lines before reading. Prefer targeted rg or file lookup over broad scans.
3. Avoid re-reading unchanged files already analyzed.
4. Summarize verbose tool, build and test logs; preserve errors and relevant context.
5. Make scoped minimal edits; avoid unsolicited refactors.
6. Run focused tests first; broaden only when scope or risk warrants it.
7. Avoid extra parallel agents unless they provide clear architectural value.
8. Avoid unnecessary web searches and extraneous MCP calls.
9. Use rtk commands explicitly for compact output when available and appropriate. Never use hooks to bypass security.
10. Correctness and test integrity take priority over savings.


# Fine Dentistry — project guidance for Codex

## Goal
Rebuild the Fine Dentistry of Downtown Orlando website in an original implementation, using https://nova-dental-dev.webflow.io/ only as the visual/interaction reference and https://www.finedentistryorlando.com/ as the authoritative content/brand source.

Read `PROMPT-MESTRE.md` in full before doing work. The full task, research scope, acceptance criteria, engineering phases and skills are documented there.

## Non-negotiable requirements
- Output website copy in English (US); progress reports can be in Portuguese (BR).
- Preserve accurate business name, doctors, services and content. Never use Nova Dental's fictitious staff, testimonials, branding or source code.
- Audit source URLs and evidence; flag contradictory hours, phone extensions, promotions and provider designation.
- Reproduce reference layout and motion faithfully and responsively, while respecting licenses and avoiding copying proprietary assets.
- Deliver all major routes, not just a landing page; no dead links, faux forms, fabricated reviews or dummy content.
- Don't put personal/medical data in analytics, logs, localStorage or mocked booking confirmations.
- Do not deploy, push, merge or change external configurations without specific authorization.
- Test build, navigation, mobile, forms and accessibility, and report failures honestly.

## Skills
Use: frontend-design, ui-ux-pro-max, web-design-guidelines, playwright-cli, webapp-testing and vercel-react-best-practices when available. Install only from reviewed origins and when permitted.

## First task
Inspect the repository and source/reference websites. Build evidence-based research files in `research/`, then implement the complete site described in `PROMPT-MESTRE.md`. Continue beyond planning.


## Latest user decisions
- Hero uses the official team photograph with a separately saved AI-restored variant; preserve original and document reconstruction limits.
- Map is a standalone full-width section, 320px desktop / 280px mobile, after the final CTA and immediately above the footer.

