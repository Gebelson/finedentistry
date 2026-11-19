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
    await p.getByLabel("Treatment", { exact: true }).selectOption("Dental Implants");
    await p.getByRole("button", { name: "Continue", exact: true }).click();
    await p.getByRole("button", { name: "Continue", exact: true }).click();
    assert.equal(
      await p
        .getByRole("link", { name: "Continue on the clinic website" })
        .getAttribute("href"),
      "https://www.finedentistryorlando.com/Contact",
    );
    assert.equal(
      await p.getByText("Your appointment is not confirmed.").count(),
      1,
    );
    await p.keyboard.press("Escape");
    assert.equal(await p.getByRole("dialog").count(), 0);
    console.log("PASS booking fallback and dialog keyboard behavior");
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});

