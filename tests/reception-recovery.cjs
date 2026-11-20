const assert = require("node:assert/strict");
const { chromium } = require("playwright");
const { mount } = require("./component-fixture.cjs");
(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  let offline = false,
    failSend = true,
    release,
    releaseOldest,
    received;
  let firstLoad = true;
  const sent = [];
  await page.route("**/api/clinic-chat**", async (route) => {
    if (route.request().method() === "GET") {
      if (offline) return route.abort("failed");
      const first = firstLoad;
      firstLoad = false;
      if (first)
        await new Promise((resolve) => {
          releaseOldest = resolve;
        });
      return route.fulfill({
        json: {
          status: "open",
          controller: "reception",
          messages: first
            ? []
            : [
                {
                  id: 1,
                  sender: "visitor",
                  text: "Latest question",
                  createdAt: "2026-11-20T12:00:00Z",
                },
              ],
        },
      });
    }
    sent.push(route.request().postDataJSON());
    if (received) {
      received();
      received = undefined;
      await new Promise((resolve) => {
        release = resolve;
      });
    }
    await route.fulfill({
      status: failSend ? 503 : 200,
      json: { saved: !failSend },
    });
  });
  try {
    await mount(
      page,
      "components/admin/conversation-tools.tsx",
      "ConversationTools",
    );
    await page
      .getByText("Latest question", { exact: true })
      .waitFor({ timeout: 6000 });
    releaseOldest();
    await page.waitForTimeout(100);
    assert.equal(
      await page.getByText("Latest question", { exact: true }).count(),
      1,
      "Delayed polling must not replace newer messages",
    );
    const composer = page.getByLabel("Reply from reception", { exact: true });
    await composer.fill("Personal draft");
    await page
      .getByLabel("Quick replies", { exact: true })
      .selectOption({ label: "Appointment request" });
    assert.match(
      await composer.inputValue(),
      /^Personal draft\n\nPlease call \(407\) 898-1621/,
    );
    assert.equal(
      sent.length,
      0,
      "Inserting a quick reply must never send automatically",
    );
    await page.getByRole("button", { name: "Send reply", exact: true }).click();
    await page
      .getByRole("alert")
      .filter({ hasText: /not saved/ })
      .waitFor();
    assert.match(await composer.inputValue(), /^Personal draft/);
    failSend = false;
    const pending = new Promise((resolve) => {
      received = resolve;
    });
    await page.getByRole("button", { name: "Send reply", exact: true }).click();
    await pending;
    await composer.fill("Next reply");
    release();
    await page
      .getByRole("button", { name: "Send reply", exact: true })
      .waitFor();
    assert.equal(await composer.inputValue(), "Next reply");
    offline = true;
    await page
      .getByRole("alert")
      .filter({ hasText: /Reconnecting/ })
      .waitFor({ timeout: 6000 });
    offline = false;
    await page
      .getByRole("alert")
      .filter({ hasText: /Reconnecting/ })
      .waitFor({ state: "detached", timeout: 6000 });
    assert.deepEqual(errors, []);
    console.log(
      "PASS reception ignores stale polling; quick replies append without sending; failed/pending sends preserve drafts; connection recovers. No stored records.",
    );
  } finally {
    release?.();
    releaseOldest?.();
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
