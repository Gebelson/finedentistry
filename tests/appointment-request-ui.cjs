const assert = require("node:assert/strict");
const { chromium } = require("playwright");
const { mount } = require("./component-fixture.cjs");
(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  try {
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
    });
    let sent = 0;
    const bodies = [];
    await page.route("**/api/appointment-request", async (route) => {
      sent++;
      bodies.push(route.request().postDataJSON());
      await new Promise((resolve) => setTimeout(resolve, 150));
      return route.fulfill({ status: 503, json: { error: "Unavailable" } });
    });
    await mount(
      page,
      "components/appointment-request-form.tsx",
      "AppointmentRequestForm",
    );
    await page.getByLabel("Your name", { exact: true }).fill("Browser Test");
    await page.getByLabel("Phone number", { exact: true }).fill("4075550199");
    await page.getByRole("checkbox").check();
    await page
      .getByRole("button", { name: "Send appointment request" })
      .click();
    await page.getByRole("button", { name: "Sending request…" }).waitFor();
    assert.equal(
      await page.getByRole("button", { name: "Sending request…" }).isDisabled(),
      true,
    );
    await page
      .getByRole("alert")
      .filter({ hasText: "could not save" })
      .waitFor();
    assert.equal(sent, 1);
    assert.equal(bodies[0].consent, true);
    assert.equal(bodies[0].phone, "4075550199");
    assert.equal(bodies[0].startsAt, undefined);
    assert.equal(
      await page.getByLabel("Your name", { exact: true }).inputValue(),
      "Browser Test",
    );
    await page
      .getByRole("link", { name: "Continue on the clinic website" })
      .waitFor();
    await page.getByLabel("How should we contact you?").selectOption("email");
    assert.equal(
      await page
        .getByLabel("Email address", { exact: true })
        .getAttribute("required"),
      "",
    );
    await page
      .getByRole("button", { name: "Send appointment request" })
      .click();
    assert.equal(sent, 1);
    assert.deepEqual(await page.evaluate(() => Object.keys(localStorage)), []);
    console.log(
      "Appointment request form: guarded submit, honest failure/fallback, preserved details and conditional email validation passed.",
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
