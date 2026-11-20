const assert = require("node:assert/strict");
const { webkit } = require("playwright");
const base = process.env.TEST_URL || "https://finedentistry.vercel.app";
(async () => {
  const b = await webkit.launch({ headless: true });
  const c = await b.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    reducedMotion: "reduce",
  });
  try {
    assert.equal(
      (
        await c.request.post(base + "/api/users/login", {
          headers: { Origin: base },
          data: {
            username: process.env.TEST_ADMIN_USERNAME,
            password: process.env.TEST_ADMIN_PASSWORD,
          },
        })
      ).status(),
      200,
    );
    const p = await c.newPage();
    const errors = [];
    p.on("pageerror", (e) => errors.push(e.message));
    async function openAdmin(path) {
      const sessionReady = p.waitForResponse(
        (response) => new URL(response.url()).pathname === "/api/users/me",
      );
      await p.goto(base + path);
      await (await sessionReady).finished();
    }
    await openAdmin("/admin");
    await p.getByRole("heading", { name: "Dashboard", exact: true }).waitFor();
    await p
      .locator(".workspace-nav.nav--nav-hydrated")
      .waitFor({ state: "attached" });
    const toggle = p.locator(".app-header__mobile-nav-toggler");
    if (/^open/i.test(await toggle.getAttribute("aria-label")))
      await toggle.tap();
    await p
      .getByRole("navigation", { name: "Workspace navigation" })
      .getByRole("link", { name: "Calendar", exact: true })
      .tap();
    await p.waitForURL(base + "/admin/calendar");
    await p.getByRole("button", { name: "Agenda", exact: true }).waitFor();
    await p.waitForFunction(() =>
      [...document.querySelectorAll(".workspace-view-switch button")].some(
        (button) =>
          button.textContent === "Agenda" &&
          button.getAttribute("aria-pressed") === "true",
      ),
    );
    assert.equal(
      await p
        .getByRole("button", { name: "Agenda", exact: true })
        .getAttribute("aria-pressed"),
      "true",
    );
    assert.equal(
      await p.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    );
    await p.getByRole("button", { name: "Month", exact: true }).tap();
    await p.setViewportSize({ width: 844, height: 390 });
    assert.equal(
      await p
        .getByRole("button", { name: "Month", exact: true })
        .getAttribute("aria-pressed"),
      "true",
    );
    await p.waitForFunction(
      () =>
        document
          .querySelector(".clinic-calendar-grid")
          ?.getAttribute("aria-busy") === "false",
    );
    await openAdmin("/admin/collections/appointments/create");
    await p.locator("input[name=startsAt]").waitFor();
    assert.equal(await p.locator("input[name=startsAt]").inputValue(), "");
    await p.setViewportSize({ width: 390, height: 844 });
    await p.locator("input[name=startsAt]").focus();
    assert.ok(
      await p
        .locator("input[name=startsAt]")
        .evaluate((e) => parseFloat(getComputedStyle(e).fontSize) >= 16),
    );
    assert.equal(
      await p.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    );
    await openAdmin("/admin/reports");
    await p.getByRole("region", { name: "Report results" }).waitFor();
    await p.getByLabel("Reporting period", { exact: true }).selectOption("7");
    await p.waitForFunction(
      () =>
        !document.querySelector(".workspace-report-toolbar button").disabled,
    );
    const downloaded = p.waitForEvent("download");
    await p
      .getByRole("button", { name: "Download aggregate CSV", exact: true })
      .tap();
    const file = await downloaded;
    assert.equal(file.suggestedFilename(), "workspace-report-7.csv");
    assert.equal(await file.failure(), null);
    await p.goto(base);
    await p
      .getByRole("button", { name: "Request an Appointment", exact: true })
      .first()
      .tap();
    await p
      .getByLabel("Treatment", { exact: true })
      .selectOption("New patient visit");
    await p.getByRole("button", { name: "Continue", exact: true }).tap();
    await p.getByLabel("Your name", { exact: true }).focus();
    await p.setViewportSize({ width: 390, height: 390 });
    assert.ok(
      await p
        .getByLabel("Your name", { exact: true })
        .evaluate((e) => parseFloat(getComputedStyle(e).fontSize) >= 16),
    );
    const dialog = await p.getByRole("dialog").evaluate((e) => ({
      height: e.getBoundingClientRect().height,
      available: innerHeight,
      scroll: e.scrollHeight,
      client: e.clientHeight,
    }));
    assert.ok(dialog.height <= dialog.available);
    await p
      .getByRole("button", { name: "Close appointment dialog", exact: true })
      .tap();
    assert.equal(await p.getByRole("dialog").count(), 0);
    assert.deepEqual(errors, []);
    console.log(
      "PASS WebKit mobile touch navigation, Agenda/orientation, blank date form, 16px inputs, CSV download and keyboard-like booking viewport. No records submitted.",
    );
  } finally {
    await c.request
      .post(base + "/api/users/logout", { headers: { Origin: base } })
      .catch(() => {});
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
