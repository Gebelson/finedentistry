const assert = require("node:assert/strict");
const { chromium } = require("playwright");
const { mount } = require("./component-fixture.cjs");
(async () => {
  const b = await chromium.launch({ channel: "chrome", headless: true });
  try {
    const p = await b.newPage({
      viewport: { width: 390, height: 844 },
      hasTouch: true,
    });
    await p.route("**/api/appointments?*", (r) =>
      r.fulfill({ json: { docs: [], hasNextPage: false } }),
    );
    await mount(p, "components/admin/clinic-calendar.tsx", "ClinicCalendar");
    const agenda = p.getByRole("button", { name: "Agenda", exact: true }),
      month = p.getByRole("button", { name: "Month", exact: true });
    await agenda.waitFor();
    assert.equal(await agenda.getAttribute("aria-pressed"), "true");
    assert.equal(await p.locator(".clinic-calendar-grid").count(), 0);
    await p.setViewportSize({ width: 1440, height: 900 });
    await p.waitForFunction(
      () => !!document.querySelector(".clinic-calendar-grid"),
    );
    assert.equal(await month.getAttribute("aria-pressed"), "true");
    await agenda.click();
    await p.setViewportSize({ width: 390, height: 844 });
    await p.setViewportSize({ width: 1440, height: 900 });
    assert.equal(
      await agenda.getAttribute("aria-pressed"),
      "true",
      "Explicit view choice survives orientation/width changes",
    );
    await p.setViewportSize({ width: 390, height: 844 });
    await month.click();
    assert.equal(await month.getAttribute("aria-pressed"), "true");
    assert.equal(
      await p.locator(".clinic-calendar").getAttribute("data-auto-view"),
      null,
    );
    console.log(
      "PASS phone Agenda default, desktop Month default and explicit view choice retained across resize.",
    );
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
