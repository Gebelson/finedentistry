const assert = require("node:assert/strict");
const { chromium, webkit } = require("playwright");
const base = process.env.TEST_URL || "http://localhost:3000";
if (process.env.TEST_BROWSER === "webkit" && !base.startsWith("https://")) {
  throw Error(
    "Use HTTPS for WebKit production-session verification; the compiled app issues Secure cookies.",
  );
}
(async () => {
  const browser =
    process.env.TEST_BROWSER === "webkit"
      ? await webkit.launch({ headless: true })
      : await chromium.launch({ channel: "chrome", headless: true });
  const staff = await browser.newContext();
  const visitor = await browser.newContext();
  let id;
  try {
    assert.equal(
      (
        await staff.request.post(base + "/api/users/login", {
          headers: { Origin: base },
          data: {
            username: process.env.TEST_ADMIN_USERNAME,
            password: process.env.TEST_ADMIN_PASSWORD,
          },
        })
      ).status(),
      200,
    );
    const settings = await (
      await staff.request.get(base + "/api/globals/chat-settings", {
        headers: { Origin: base },
      })
    ).json();
    assert.equal(settings.enabled, true);
    assert.notEqual(settings.mode, "assistant");
    const dashboard = await staff.newPage();
    const inbox = await staff.newPage();
    const errors = [];
    for (const page of [dashboard, inbox])
      page.on("pageerror", (e) => errors.push(e.message));
    await dashboard.goto(base + "/admin");
    await dashboard.locator('[data-metric="waiting"]').waitFor();
    const waiting = Number(
      await dashboard.locator('[data-metric="waiting"]').innerText(),
    );
    await inbox.goto(base + "/admin/collections/conversations");
    await inbox
      .getByRole("heading", { name: "Conversations", exact: true })
      .waitFor();
    await dashboard.waitForTimeout(1500);
    const start = await visitor.request.post(base + "/api/clinic-chat", {
      headers: { Origin: base },
      data: { action: "start" },
    });
    assert.equal(start.status(), 201);
    const session = await start.json();
    id = session.id;
    assert.equal(
      (
        await visitor.request.post(base + "/api/clinic-chat", {
          headers: { Origin: base, "x-conversation-token": session.token },
          data: { action: "handoff", id },
        })
      ).status(),
      200,
    );
    const saved = await (
      await staff.request.get(
        base +
          "/api/conversations/" +
          id +
          "?select[reference]=true&select[status]=true&select[controller]=true",
        { headers: { Origin: base } },
      )
    ).json();
    assert.equal(saved.status, "waiting");
    assert.equal(saved.controller, "reception");
    await dashboard.bringToFront();
    await dashboard.waitForFunction(
      (previous) =>
        Number(document.querySelector('[data-metric="waiting"]')?.textContent) >
        previous,
      waiting,
      { timeout: 14000 },
    );
    await inbox.bringToFront();
    await inbox
      .getByRole("link", { name: saved.reference, exact: true })
      .waitFor({ timeout: 14000 });
    await inbox
      .getByRole("link", { name: saved.reference, exact: true })
      .click();
    await inbox.locator(".clinic-inbox").waitFor();
    const draft = inbox.locator("#reception-reply");
    await draft.fill("Unsent verification draft");
    await inbox.waitForTimeout(6000);
    assert.equal(await draft.inputValue(), "Unsent verification draft");
    await dashboard.bringToFront();
    await dashboard.route("**/api/conversations?*", (route) =>
      route.request().url().includes("limit=1&")
        ? route.fulfill({
            status: 503,
            contentType: "application/json",
            body: "{}",
          })
        : route.continue(),
    );
    await dashboard
      .getByRole("button", { name: "Retry updates" })
      .waitFor({ timeout: 14000 });
    await dashboard.setViewportSize({ width: 320, height: 844 });
    assert.equal(
      await dashboard.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
    );
    await dashboard.unroute("**/api/conversations?*");
    await dashboard.getByRole("button", { name: "Retry updates" }).click();
    await dashboard
      .locator(".reception-update-error")
      .waitFor({ state: "detached" });
    assert.deepEqual(errors, []);
    console.log(
      "PASS visitor handoff appears automatically in the already-open dashboard and inbox, without reload; conversation draft survives, failed checks recover and the error notice fits mobile.",
    );
  } finally {
    if (id)
      assert.equal(
        (
          await staff.request.delete(base + "/api/conversations/" + id, {
            headers: { Origin: base },
          })
        ).status(),
        200,
      );
    await staff.request
      .post(base + "/api/users/logout", { headers: { Origin: base } })
      .catch(() => {});
    await browser.close();
  }
})().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
