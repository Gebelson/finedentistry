const assert = require("node:assert/strict");
const { chromium } = require("playwright");
const AxeBuilder = require("@axe-core/playwright").default;
const base = process.env.TEST_URL || "http://localhost:3000";
(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const guest = await browser.newContext();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    extraHTTPHeaders: { Origin: base },
  });
  let appointmentId;
  try {
    assert.equal(
      (await guest.request.get(base + "/api/workspace-connections")).status(),
      401,
    );
    assert.equal(
      (
        await context.request.post(base + "/api/users/login", {
          data: {
            username: process.env.TEST_ADMIN_USERNAME,
            password: process.env.TEST_ADMIN_PASSWORD,
          },
        })
      ).status(),
      200,
    );
    const api = await context.request.get(base + "/api/workspace-connections");
    assert.equal(api.status(), 200);
    assert.match(api.headers()["cache-control"], /no-store/);
    const result = await api.json();
    assert.equal(result.connections.length, 10);
    for (const id of ["content", "chat", "assistant", "analytics", "data"])
      assert.equal(
        result.connections.find((x) => x.id === id).status,
        "verified",
      );
    for (const id of ["email", "sms", "payments", "calendar"])
      assert.equal(
        result.connections.find((x) => x.id === id).status,
        "needs_setup",
      );
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(base + "/admin/integrations");
    await page.getByRole("region", { name: "Connection results" }).waitFor();
    assert.equal(await page.locator(".clinic-connections article").count(), 10);
    for (const width of [1440, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
        "Connections must fit " + width,
      );
      const small = await page
        .locator(".workspace-connections button,.workspace-connections a")
        .evaluateAll(
          (nodes) =>
            nodes.filter((node) => node.getBoundingClientRect().height < 44)
              .length,
        );
      assert.equal(small, 0);
    }
    const scan = await new AxeBuilder({ page })
      .include(".workspace-connections")
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    if (scan.violations.length)
      console.log(
        JSON.stringify(
          scan.violations.map((v) => ({
            id: v.id,
            nodes: v.nodes.map((n) => ({
              target: n.target,
              summary: n.failureSummary,
            })),
          })),
          null,
          2,
        ),
      );
    assert.deepEqual(
      scan.violations.map((x) => ({ id: x.id, impact: x.impact })),
      [],
    );
    await page.route("**/api/workspace-connections", (route) =>
      route.request().method() === "POST"
        ? route.fulfill({
            status: 503,
            contentType: "application/json",
            body: "{}",
          })
        : route.continue(),
    );
    await page.getByRole("button", { name: "Test AI connection" }).click();
    await page.locator('.workspace-connections [role="alert"]').waitFor();
    await page.unroute("**/api/workspace-connections");
    await page.getByRole("button", { name: "Retry checks" }).click();
    await page
      .locator('.workspace-connections [role="alert"]')
      .waitFor({ state: "detached" });
    await page.waitForFunction(
      () =>
        document
          .querySelector(".workspace-connections")
          ?.getAttribute("aria-busy") === "false",
    );
    await page.getByRole("region", { name: "Connection results" }).waitFor();
    assert.deepEqual(errors, []);
    assert.equal(
      (
        await guest.request.get(base + "/api/calendar-export?month=2099-12")
      ).status(),
      401,
    );
    const created = await context.request.post(base + "/api/appointments", {
      data: {
        contactName: "Private export verification",
        doctor: "trivedi",
        startsAt: "2099-12-01T04:30:00.000Z",
        endsAt: "2099-12-01T05:30:00.000Z",
        status: "scheduled",
      },
    });
    assert.equal(created.status(), 201);
    appointmentId = (await created.json()).doc.id;
    const calendar = await context.request.get(
      base + "/api/calendar-export?month=2099-12",
    );
    assert.equal(calendar.status(), 200);
    assert.match(calendar.headers()["content-type"], /text\/calendar/);
    assert.match(calendar.headers()["content-disposition"], /attachment/);
    assert.match(calendar.headers()["cache-control"], /no-store/);
    const content = await calendar.text();
    assert.match(content, /DTSTART:20991201T043000Z/);
    assert.match(content, /DTEND:20991201T053000Z/);
    assert.ok(!content.includes("Private export verification"));
    await page.goto(base + "/admin/calendar");
    await page
      .getByRole("button", { name: "Download calendar", exact: true })
      .waitFor();
    for (const width of [1440, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
        "Calendar must fit " + width,
      );
    }
    console.log(
      "PASS real appointment database → month-boundary busy calendar download, with private contact excluded.",
    );
    console.log(
      "PASS live authorized connections, 10 honest status cards, refresh/error recovery, 1440/768/390/320 touch layout, no overflow/runtime errors and zero scoped Axe violations.",
    );
    if (process.env.TEST_AI_PROBE === "true") {
      const tested = await context.request.post(
        base + "/api/workspace-connections",
        { data: { action: "ai" } },
      );
      assert.equal(tested.status(), 200);
      const ai = (await tested.json()).connections.find((x) => x.id === "ai");
      console.log(
        "Live AI check:",
        JSON.stringify({ status: ai.status, detail: ai.detail }),
      );
    }
  } finally {
    if (appointmentId)
      assert.equal(
        (
          await context.request.delete(
            base + "/api/appointments/" + appointmentId,
          )
        ).status(),
        200,
      );
    await context.request.post(base + "/api/users/logout").catch(() => {});
    await browser.close();
  }
})().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
