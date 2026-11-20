const assert = require("node:assert/strict");
const { chromium } = require("playwright");
const { mount } = require("./component-fixture.cjs");
(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  let offline = false,
    failSend = false,
    release;
  let pending;
  const sent = [];
  await page.route("**/api/clinic-chat**", async (route) => {
    const req = route.request();
    if (req.method() === "GET") {
      if (req.url().includes("conversation=")) {
        if (offline) return route.abort("failed");
        return route.fulfill({
          json: { messages: [], controller: "assistant", status: "open" },
        });
      }
      return route.fulfill({
        json: { enabled: true, mode: "hybrid", welcome: "Welcome." },
      });
    }
    const body = req.postDataJSON();
    if (body.action === "start")
      return route.fulfill({
        status: 201,
        json: { id: 999999, token: "test-session-only" },
      });
    sent.push(body);
    if (pending) {
      pending();
      pending = undefined;
      await new Promise((resolve) => {
        release = resolve;
      });
    }
    return route.fulfill({
      status: failSend ? 503 : 200,
      json: { saved: !failSend },
    });
  });
  try {
    await mount(page, "components/clinic-chat.tsx", "ClinicChat");
    await page.getByRole("button", { name: "Let’s talk" }).click();
    const composer = page.getByLabel("Your message", { exact: true });
    await composer.fill("Keep my unsent question");
    await page.getByRole("button", { name: "Ask reception to help" }).click();
    await page.getByRole("button", { name: "Send", exact: true }).waitFor();
    assert.equal(
      await composer.inputValue(),
      "Keep my unsent question",
      "Handoff must preserve the unsent draft",
    );
    failSend = true;
    await page.getByRole("button", { name: "Send", exact: true }).click();
    await page
      .getByRole("alert")
      .filter({ hasText: /not saved/ })
      .waitFor();
    assert.equal(await composer.inputValue(), "Keep my unsent question");
    failSend = false;
    const received = new Promise((resolve) => {
      pending = resolve;
    });
    await page.getByRole("button", { name: "Send", exact: true }).click();
    await received;
    await composer.fill("My next question");
    release();
    await page.getByRole("button", { name: "Send", exact: true }).waitFor();
    assert.equal(
      await composer.inputValue(),
      "My next question",
      "Saving must preserve text typed while the request was pending",
    );
    offline = true;
    await page
      .getByRole("status")
      .filter({ hasText: /Reconnecting/ })
      .waitFor({ timeout: 6000 });
    offline = false;
    await page
      .getByRole("status")
      .filter({ hasText: /Reconnecting/ })
      .waitFor({ state: "detached", timeout: 6000 });
    assert.equal(sent.length, 3);
    assert.deepEqual(
      errors,
      [],
      "Polling failures must not produce unhandled runtime errors",
    );
    console.log(
      "PASS handoff and failed/pending sends preserve drafts; polling reports connection loss and recovers without runtime errors. All chat requests intercepted; no stored records.",
    );
  } finally {
    release?.();
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
