const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("fs");
(async () => {
  const b = await chromium.launch({ channel: "chrome", headless: true });
  const p = await b.newPage();
  try {
    await p.goto(process.env.TEST_URL || "http://127.0.0.1:3000");
    assert.match(await p.title(), /Fine Dentistry/);
    await p
      .getByRole("button", { name: "Request an Appointment", exact: true })
      .first()
      .click();
    await p
      .getByLabel("Treatment", { exact: true })
      .selectOption("Dental Implants");
    await p.getByRole("button", { name: "Continue", exact: true }).click();
    let requestCount = 0;
    await p.route("**/api/appointment-request", (route) => {
      requestCount++;
      return route.fulfill(
        requestCount === 1
          ? { status: 503, json: { error: "Unavailable" } }
          : { status: 202, json: { received: true } },
      );
    });
    await p.getByLabel("Your name", { exact: true }).fill("Browser Test");
    await p.getByLabel("Phone number", { exact: true }).fill("4075550199");
    await p.getByRole("checkbox").check();
    await p.getByRole("button", { name: "Send appointment request" }).click();
    await p.getByRole("alert").filter({ hasText: "could not save" }).waitFor();
    assert.equal(
      await p
        .getByRole("link", { name: "Continue on the clinic website" })
        .getAttribute("href"),
      "https://www.finedentistryorlando.com/Contact",
    );
    await p.getByRole("button", { name: "Send appointment request" }).click();
    await p
      .getByText("Your appointment request was received by reception.")
      .waitFor();
    assert.equal(
      await p.getByText("Your appointment is not confirmed.").count(),
      1,
    );
    await p.keyboard.press("Escape");
    assert.equal(await p.getByRole("dialog").count(), 0);
    console.log(
      "PASS appointment request recovery, receipt, fallback and dialog keyboard behavior (API intercepted; no records written)",
    );
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
