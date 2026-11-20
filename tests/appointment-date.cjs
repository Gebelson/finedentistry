const assert = require("node:assert/strict");
const { chromium } = require("playwright");
const { mount } = require("./component-fixture.cjs");
(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const { date: payloadDateValidation } =
    await import("../node_modules/payload/dist/fields/validations.js");
  try {
    const blank = await browser.newPage();
    const blankErrors = [];
    blank.on("pageerror", (error) => blankErrors.push(error.message));
    await mount(
      blank,
      "components/admin/appointment-date.tsx",
      "AppointmentDate",
      {
        value: undefined,
        props: {
          path: "startsAt",
          field: { label: "Start time", type: "date" },
        },
      },
    );
    assert.equal(
      await blank.getByLabel("Start time", { exact: true }).inputValue(),
      "",
    );
    assert.deepEqual(
      blankErrors,
      [],
      "An uninitialized create form must render without errors",
    );
    await blank.close();
    for (const timezoneId of ["Asia/Tokyo", "America/Sao_Paulo"]) {
      const page = await browser.newPage({ timezoneId });
      await mount(
        page,
        "components/admin/appointment-date.tsx",
        "AppointmentDate",
        {
          value: "2026-11-20T14:00:00.000Z",
          props: {
            path: "startsAt",
            field: { label: "Start time", type: "date" },
          },
        },
      );
      const input = page.getByLabel("Start time", { exact: true });
      await input.waitFor();
      assert.equal(await input.inputValue(), "2026-11-20T09:00");
      await page.getByText(/Orlando time/).waitFor();
      assert.equal(
        await page.evaluate(() => window.savedField),
        undefined,
        "Mounting must not rewrite the stored UTC instant",
      );
      await input.fill("2026-12-01T09:00");
      assert.equal(
        await page.evaluate(() => window.savedField),
        "2026-12-01T14:00:00.000Z",
      );
      await input.fill("2026-07-01T09:00");
      assert.equal(
        await page.evaluate(() => window.savedField),
        "2026-07-01T13:00:00.000Z",
      );
      await input.fill("2026-03-08T02:30");
      assert.equal(await input.inputValue(), "2026-03-08T02:30");
      await page
        .getByRole("alert")
        .filter({ hasText: /does not exist/ })
        .waitFor();
      const invalid = await page.evaluate(() => ({
        value: window.savedField,
        result: window.fixtureValidate(window.savedField, {}),
      }));
      assert.ok(
        Number.isNaN(Date.parse(invalid.value)),
        "A nonexistent clock time must never become a valid shifted instant",
      );
      assert.match(invalid.result, /does not exist/);
      assert.notEqual(
        payloadDateValidation(invalid.value, {
          name: "startsAt",
          req: { t: (key) => key },
          siblingData: {},
        }),
        true,
        "Payload server-side date validation must reject nonexistent clock times too",
      );
      assert.equal(
        await input.evaluate((element) => element.checkValidity()),
        false,
      );
      await input.fill("2026-03-08T03:30");
      assert.equal(
        await page.evaluate(() => window.savedField),
        "2026-03-08T07:30:00.000Z",
      );
      assert.equal(
        await page.evaluate(() =>
          window.fixtureValidate(window.savedField, {}),
        ),
        true,
      );
      await input.fill("");
      assert.equal(await page.evaluate(() => window.savedField), null);
      await page.close();
    }
    console.log(
      "PASS Orlando appointment field in Tokyo/Sao Paulo: UTC-preserving mount, winter/summer conversion, nonexistent DST rejection, form validation, recovery and optional clearing.",
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
