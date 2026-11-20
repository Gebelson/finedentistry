const assert = require("node:assert/strict");
const { chromium } = require("playwright");
const base = process.env.TEST_URL || "http://localhost:3000";
(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  try {
    const c = await browser.newContext({
      extraHTTPHeaders: { Origin: base },
      timezoneId: "Asia/Tokyo",
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
    const pages = [];
    await p.route("**/api/appointments?*", async (route) => {
      const q = new URL(route.request().url()).searchParams;
      const page = Number(q.get("page") || 1);
      pages.push(page);
      const start = new Date(q.get("where[startsAt][greater_than_equal]"));
      start.setUTCDate(15);
      await route.fulfill({
        json: {
          docs: [
            {
              id: 9000 + page,
              contactName:
                page === 1
                  ? "First page verification"
                  : "Second page verification",
              doctor: page === 1 ? "trivedi" : "perez",
              status: page === 1 ? "scheduled" : "completed",
              startsAt: start.toISOString(),
            },
          ],
          hasNextPage: page === 1,
        },
      });
    });
    await p.goto(base + "/admin/calendar");
    await p.getByText("Second page verification", { exact: true }).waitFor();
    assert.deepEqual(pages, [1, 2]);
    assert.equal(await p.locator(".calendar-event").count(), 2);
    await p.getByLabel("Doctor", { exact: true }).selectOption("perez");
    assert.equal(await p.locator(".calendar-event").count(), 1);
    await p.getByText("Second page verification", { exact: true }).waitFor();
    await p.getByLabel("Status", { exact: true }).selectOption("scheduled");
    await p
      .getByText("No appointments match these filters.", { exact: true })
      .waitFor();
    await p.getByRole("button", { name: "Clear filters", exact: true }).click();
    await p.getByRole("button", { name: "Agenda", exact: true }).click();
    assert.equal(await p.locator(".clinic-calendar-grid").count(), 0);
    assert.equal(
      await p.locator(".workspace-agenda .calendar-event").count(),
      2,
    );
    await p.getByRole("button", { name: "Next month", exact: true }).click();
    await p.getByRole("button", { name: "Today", exact: true }).click();
    await p.getByText("Second page verification", { exact: true }).waitFor();
    await p.setViewportSize({ width: 390, height: 844 });
    assert.equal(
      await p.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    );
    console.log(
      "PASS complete calendar pagination, doctor/status filters, clearing filters, agenda view, Today and mobile width.",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
