const assert = require("node:assert/strict");
const { chromium } = require("playwright");
const base = process.env.TEST_URL || "http://localhost:3000";
(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const context = await browser.newContext({
    extraHTTPHeaders: { Origin: base },
  });
  let release, conversation, original;
  const failures = [];
  try {
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
    const page = await context.newPage();
    let first = true,
      received;
    const held = new Promise((resolve) => {
      received = resolve;
    });
    await page.route("**/api/appointments?*", async (route) => {
      if (first) {
        first = false;
        received();
        await new Promise((resolve) => {
          release = resolve;
        });
        await route.fulfill({ json: { docs: [] } }).catch(() => {});
      } else {
        const query = new URL(route.request().url()).searchParams;
        const start = new Date(query.get("where[startsAt][less_than]"));
        start.setUTCDate(15);
        start.setUTCMonth(start.getUTCMonth() - 1);
        await route.fulfill({
          json: {
            docs: [
              {
                id: 999999,
                contactName: "New month verification",
                status: "scheduled",
                doctor: "perez",
                startsAt: start.toISOString(),
              },
            ],
          },
        });
      }
    });
    await page.goto(base + "/admin/calendar");
    await held;
    await page.getByRole("button", { name: "Next month", exact: true }).click();
    await page.getByText("New month verification", { exact: true }).waitFor();
    release();
    await page.waitForTimeout(300);
    try {
      assert.equal(
        await page.getByText("New month verification", { exact: true }).count(),
        1,
        "An older month response must not replace the selected month",
      );
    } catch (e) {
      failures.push(e.message);
    }
    original = await (
      await context.request.get(base + "/api/globals/chat-settings")
    ).json();
    await context.request.post(base + "/api/globals/chat-settings", {
      data: { enabled: true },
    });
    const start = await context.request.post(base + "/api/clinic-chat", {
      data: { action: "start" },
    });
    assert.equal(start.status(), 201);
    conversation = (await start.json()).id;
    const inbox = await context.newPage();
    const errors = [];
    inbox.on("pageerror", (error) => errors.push(error.message));
    await inbox.route("**/api/clinic-chat?conversation=*", (route) =>
      route.fulfill({ status: 503, json: { error: "Temporary outage" } }),
    );
    await inbox.goto(base + "/admin/collections/conversations/" + conversation);
    try {
      await inbox
        .locator(".clinic-inbox")
        .getByRole("alert")
        .filter({ hasText: /Unable to load the conversation/ })
        .waitFor({ timeout: 4000 });
    } catch {
      failures.push(
        "Conversation loading failure must display a visible error",
      );
    }
    await inbox.unroute("**/api/clinic-chat?conversation=*");
    await inbox
      .locator(".clinic-inbox-messages .clinic-message")
      .first()
      .waitFor({ timeout: 6000 });
    assert.equal(
      await inbox.locator(".clinic-inbox").getByRole("alert").count(),
      0,
      "Polling recovers after the connection is restored",
    );
    await inbox.route("**/api/clinic-chat?conversation=*", (route) =>
      route.abort("failed"),
    );
    await inbox
      .locator(".clinic-inbox")
      .getByRole("alert")
      .waitFor({ timeout: 6000 });
    await inbox.unroute("**/api/clinic-chat?conversation=*");
    await inbox
      .locator(".clinic-inbox")
      .getByRole("alert")
      .waitFor({ state: "detached", timeout: 6000 });
    assert.deepEqual(errors, []);
    assert.deepEqual(failures, []);
    console.log(
      "PASS calendar ignores delayed previous-month responses; inbox reports failures and automatically recovers without runtime errors.",
    );
  } finally {
    release?.();
    if (conversation)
      await context.request.delete(base + "/api/conversations/" + conversation);
    if (original)
      await context.request.post(base + "/api/globals/chat-settings", {
        data: original,
      });
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
