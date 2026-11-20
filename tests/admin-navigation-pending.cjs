const assert = require("node:assert/strict");
const { chromium } = require("playwright");
const base = process.env.TEST_URL || "http://localhost:3000";
(async () => {
  const b = await chromium.launch({ channel: "chrome", headless: true });
  let release;
  try {
    const c = await b.newContext({
      viewport: { width: 1440, height: 1000 },
      extraHTTPHeaders: { Origin: base },
    });
    assert.equal(
      (
        await c.request.post(base + "/api/users/login", {
          data: {
            username: process.env.TEST_ADMIN_USERNAME,
            password: process.env.TEST_ADMIN_PASSWORD,
          },
        })
      ).status(),
      200,
    );
    const p = await c.newPage();
    await p.goto(base + "/admin");
    await p
      .locator(".workspace-nav.nav--nav-hydrated")
      .waitFor({ state: "attached" });
    const toggle = p.locator(".template-default__nav-toggler");
    if (/^open/i.test(await toggle.getAttribute("aria-label")))
      await toggle.click();
    let intercepted;
    const caught = new Promise((resolve) => {
      intercepted = resolve;
    });
    await p.route("**/admin/analytics?*", async (route) => {
      if (route.request().headers().rsc) {
        intercepted();
        await new Promise((resolve) => {
          release = resolve;
        });
      }
      await route.continue();
    });
    const link = p
      .getByRole("navigation", { name: "Workspace navigation" })
      .locator('a[href="/admin/analytics"]');
    await link.click({ noWaitAfter: true });
    await caught;
    await link
      .getByRole("status", { name: "Opening Analytics" })
      .waitFor({ timeout: 2000 });
    assert.equal(new URL(p.url()).pathname, "/admin");
    release();
    await p.waitForURL(base + "/admin/analytics");
    await p
      .getByRole("heading", { name: "Website analytics", exact: true })
      .waitFor();
    assert.equal(await p.locator(".workspace-link-pending").count(), 0);
    await p.emulateMedia({ reducedMotion: "reduce" });
    assert.equal(
      await p
        .locator(".clinic-reports")
        .evaluate((n) => getComputedStyle(n).animationName),
      "none",
    );
    console.log(
      "PASS immediate sidebar pending feedback before the server responds, destination commit, automatic pending cleanup and reduced motion.",
    );
  } finally {
    release?.();
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
