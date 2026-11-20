const assert = require("node:assert/strict");
const { chromium } = require("playwright");
const { mount } = require("./component-fixture.cjs");
(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  let release;
  try {
    const page = await browser.newPage();
    let status = 202,
      received;
    await page.route("**/api/appointment-request", async (route) => {
      received();
      await new Promise((resolve) => {
        release = resolve;
      });
      await route.fulfill({
        status,
        json: status === 202 ? { received: true } : { error: "Unavailable" },
      });
    });
    await mount(
      page,
      "components/appointment-request-form.tsx",
      "AppointmentRequestForm",
      {
        replaceable: true,
        props: { treatment: "New patient visit", doctor: "No preference" },
      },
    );
    const submit = async () => {
      await page
        .getByLabel("Your name", { exact: true })
        .fill("Lifecycle verification");
      await page.getByLabel("Phone number", { exact: true }).fill("4075550198");
      await page.getByRole("checkbox").check();
      const pending = new Promise((resolve) => {
        received = resolve;
      });
      await page
        .getByRole("button", { name: "Send appointment request", exact: true })
        .click();
      await pending;
    };
    const complete = async () => {
      const response = page.waitForResponse((r) =>
        r.url().endsWith("/api/appointment-request"),
      );
      release();
      await response;
      await page.waitForTimeout(80);
    };
    await submit();
    await page.getByRole("button", { name: "Replace form instance" }).click();
    await complete();
    assert.deepEqual(
      await page.evaluate(() => window.receivedInstances || []),
      [],
      "An old success must not advance a new booking flow",
    );
    status = 503;
    await submit();
    await page.getByRole("button", { name: "Replace form instance" }).click();
    await complete();
    assert.equal(
      await page.getByRole("alert").count(),
      0,
      "An old failure must not appear on the replacement form",
    );
    status = 202;
    await submit();
    await complete();
    assert.deepEqual(
      await page.evaluate(() => window.receivedInstances),
      [2],
      "The currently mounted form must still receive success",
    );
    console.log(
      "PASS replaced appointment forms ignore stale success/failure; current form success still works. API intercepted; no records stored.",
    );
  } finally {
    release?.();
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
