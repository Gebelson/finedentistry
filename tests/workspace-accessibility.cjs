const assert = require("node:assert/strict");
const { chromium } = require("playwright");
const AxeBuilder = require("@axe-core/playwright").default;
(async () => {
  const b = await chromium.launch({ channel: "chrome", headless: true });
  try {
    const base = process.env.TEST_URL || "http://localhost:3000";
    const c = await b.newContext({ extraHTTPHeaders: { Origin: base } });
    await c.request.post(base + "/api/users/login", {
      data: {
        username: process.env.TEST_ADMIN_USERNAME,
        password: process.env.TEST_ADMIN_PASSWORD,
      },
    });
    const p = await c.newPage();
    const findings = [];
    for (const [path, scope] of [
      ["/admin/calendar", ".clinic-calendar"],
      ["/admin/reports", ".clinic-reports"],
      ["/admin/collections/appointments/create", ".date-time-field"],
    ]) {
      await p.goto(base + path);
      await p.locator(scope).first().waitFor();
      if (path.endsWith("/reports"))
        await p.getByRole("region", { name: "Report results" }).waitFor();
      const result = await new AxeBuilder({ page: p })
        .include(scope)
        .withTags(["wcag2a", "wcag2aa"])
        .analyze();
      findings.push({
        path,
        violations: result.violations.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((n) => n.target),
        })),
      });
    }
    const publicPage = await c.newPage();
    await publicPage.goto(base);
    await publicPage
      .getByRole("button", { name: "Request an Appointment", exact: true })
      .first()
      .click();
    await publicPage
      .getByLabel("Treatment", { exact: true })
      .selectOption("New patient visit");
    await publicPage
      .getByRole("button", { name: "Continue", exact: true })
      .click();
    await publicPage.getByLabel("Your name", { exact: true }).waitFor();
    const result = await new AxeBuilder({ page: publicPage })
      .include(".booking")
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    findings.push({
      path: "Public request form",
      violations: result.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => n.target),
      })),
    });
    console.log(JSON.stringify(findings));
    assert.ok(findings.every((f) => f.violations.length === 0));
    console.log(
      "PASS scoped WCAG A/AA checks for calendar, reports, Orlando date fields and public appointment request.",
    );
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
