const { chromium } = require("playwright");
const fs = require("node:fs");
const assert = require("node:assert/strict");
const base = process.env.TEST_URL || "http://localhost:3000";
const widths = [320, 360, 375, 390, 414, 430, 768, 1024, 1440];
async function interactions(context, page) {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base + "/admin");
  if (process.env.MOBILE_SOURCE_CSS)
    for (const path of [
      "app/(payload)/workspace-shell.css",
      "app/(payload)/workspace-tools.css",
    ])
      await page.addStyleTag({ content: fs.readFileSync(path, "utf8") });
  await page
    .locator(".workspace-nav.nav--nav-hydrated")
    .waitFor({ state: "attached" });
  await page.locator(".app-header__mobile-nav-toggler").click();
  await page.locator(".workspace-nav.nav--nav-open").waitFor();
  const connections = page.getByRole("link", {
    name: "Connections",
    exact: true,
  });
  await connections.scrollIntoViewIfNeeded();
  assert.ok(await connections.isVisible());
  await page.setViewportSize({ width: 844, height: 390 });
  await page.locator(".app-header__mobile-nav-toggler").click();
  await page.locator(".workspace-nav.nav--nav-open").waitFor();
  await connections.scrollIntoViewIfNeeded();
  assert.ok(await connections.isVisible());
  await page
    .getByRole("button", { name: "Close navigation", exact: true })
    .click();
  await page
    .locator(".workspace-nav.nav--nav-open")
    .waitFor({ state: "detached" });
  if (!process.env.MOBILE_SOURCE_CSS) {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(base + "/admin/calendar");
    await page.getByRole("button", { name: "Agenda", exact: true }).waitFor();
    await page.waitForFunction(
      () =>
        document.querySelector(
          '.workspace-view-switch button[aria-pressed="true"]',
        )?.textContent === "Agenda",
    );
    await page.getByRole("button", { name: "Month", exact: true }).click();
    await page.setViewportSize({ width: 844, height: 390 });
    assert.equal(
      await page
        .getByRole("button", { name: "Month", exact: true })
        .getAttribute("aria-pressed"),
      "true",
    );
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(base + "/admin/calendar");
    assert.equal(
      await page
        .getByRole("button", { name: "Month", exact: true })
        .getAttribute("aria-pressed"),
      "true",
    );
  }
  const publicPage = await context.newPage();
  for (const viewport of [
    { width: 320, height: 844 },
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 844, height: 390 },
  ]) {
    await publicPage.setViewportSize(viewport);
    await publicPage.goto(base);
    if (process.env.MOBILE_SOURCE_CSS)
      for (const path of [
        "components/appointment-request-form.css",
        "components/mobile-interactions.css",
      ])
        await publicPage.addStyleTag({
          content: fs.readFileSync(path, "utf8"),
        });
    await publicPage
      .getByRole("button", { name: "Request an Appointment", exact: true })
      .first()
      .click();
    await publicPage
      .getByLabel("Treatment", { exact: true })
      .selectOption("New patient visit");
    await publicPage
      .getByRole("button", { name: "Continue", exact: true })
      .click();
    const input = publicPage.getByLabel("Your name", { exact: true });
    await input.waitFor();
    await input.fill("Mobile QA");
    await input.focus();
    assert.ok(
      await input.evaluate(
        (e) => parseFloat(getComputedStyle(e).fontSize) >= 16,
      ),
    );
    await publicPage.setViewportSize({ width: viewport.width, height: 390 });
    await input.scrollIntoViewIfNeeded();
    assert.equal(await input.inputValue(), "Mobile QA");
    const dialog = publicPage.locator(".booking");
    assert.ok(
      await dialog.evaluate((e) => {
        const r = e.getBoundingClientRect();
        return (
          r.left >= 0 &&
          r.right <= innerWidth + 1 &&
          r.height <= innerHeight + 1
        );
      }),
    );
    await publicPage.screenshot({
      path:
        ".cache/admin-qa/mobile/booking-" +
        viewport.width +
        (process.env.MOBILE_SOURCE_CSS ? "-source" : "-live") +
        ".png",
    });
    const closeBooking = publicPage.getByRole("button", {
      name: "Close appointment dialog",
      exact: true,
    });
    await closeBooking.scrollIntoViewIfNeeded();
    await closeBooking.click();
    assert.equal(await dialog.getAttribute("open"), null);
    await publicPage.setViewportSize(viewport);
    const chat = publicPage.locator(".clinic-chat-toggle");
    await chat.waitFor();
    await chat.click();
    const message = publicPage.getByLabel("Your message", { exact: true });
    await message.fill("Mobile QA");
    await message.focus();
    assert.ok(
      await message.evaluate(
        (e) => parseFloat(getComputedStyle(e).fontSize) >= 16,
      ),
    );
    await publicPage.setViewportSize({ width: viewport.width, height: 390 });
    await message.scrollIntoViewIfNeeded();
    assert.equal(await message.inputValue(), "Mobile QA");
    assert.ok(
      await publicPage.locator(".clinic-chat-panel").evaluate((e) => {
        const r = e.getBoundingClientRect();
        return (
          r.left >= 0 &&
          r.right <= innerWidth + 1 &&
          r.top >= -1 &&
          r.bottom <= innerHeight + 1
        );
      }),
    );
    await publicPage.screenshot({
      path:
        ".cache/admin-qa/mobile/chat-" +
        viewport.width +
        (process.env.MOBILE_SOURCE_CSS ? "-source" : "-live") +
        ".png",
    });
    await publicPage
      .getByRole("button", { name: "Close chat", exact: true })
      .first()
      .click();
  }
  await publicPage.close();
  console.log(
    "PASS drawer scrolling/orientation plus public booking/chat focus, draft preservation and keyboard-like viewport resizing; no submissions.",
  );
}

(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  try {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
      hasTouch: true,
      isMobile: true,
      reducedMotion: "reduce",
      extraHTTPHeaders: { Origin: base },
    });
    assert.equal(
      (
        await context.request.post(base + "/api/users/login", {
          data: {
            username: process.env.TEST_ADMIN_USERNAME,
            password: process.env.TEST_ADMIN_PASSWORD,
          },
        })
      ).status(),
      200,
    );
    const page = await context.newPage();
    const findings = [];
    const styles = [
      "app/(payload)/workspace-shell.css",
      "app/(payload)/workspace-tools.css",
      "components/admin/workspace-reports.css",
    ];
    async function inspect(route, width, height = 844) {
      await page.setViewportSize({ width, height });
      await page.goto(base + route);
      await page.locator("h1").first().waitFor();
      await page.evaluate(() => document.fonts.ready);
      if (process.env.MOBILE_SOURCE_CSS)
        for (const path of styles)
          await page.addStyleTag({ content: fs.readFileSync(path, "utf8") });
      const geometry = await page.evaluate(() => ({
        scroll: document.documentElement.scrollWidth,
        width: innerWidth,
        inputs: [
          ...document.querySelectorAll(
            "input:not([type=hidden]):not([type=checkbox]):not([type=radio]),textarea,select,[contenteditable=true]",
          ),
        ]
          .filter((e) => e.getClientRects().length)
          .map((e) => ({
            tag: e.tagName,
            type: e.type || "",
            font: parseFloat(getComputedStyle(e).fontSize),
            height: Math.round(e.getBoundingClientRect().height),
          })),
        small: [
          ...document.querySelectorAll(
            ".ops-button,.workspace-calendar-toolbar button,.workspace-calendar-filters select,.workspace-view-switch button,.workspace-report-toolbar button,.workspace-report-toolbar select,.workspace-nav-close,.app-header__mobile-nav-toggler",
          ),
        ]
          .filter(
            (e) =>
              e.getClientRects().length && e.getBoundingClientRect().width > 0,
          )
          .map((e) => ({
            tag: e.tagName,
            class: e.className,
            width: Math.round(e.getBoundingClientRect().width),
            height: Math.round(e.getBoundingClientRect().height),
          }))
          .filter((e) => e.width < 44 || e.height < 44),
        overflow: [
          ...document.querySelectorAll("main *, .template-default__wrap *"),
        ]
          .filter((e) => {
            const r = e.getBoundingClientRect();
            return (
              r.width &&
              r.right > innerWidth + 1 &&
              !e.closest(
                ".workspace-nav,.ops-table-scroll,.table,.template-default__nav-toggler-wrapper",
              )
            );
          })
          .slice(0, 5)
          .map((e) => ({
            tag: e.tagName,
            class: typeof e.className === "string" ? e.className : "",
          })),
      }));
      findings.push({ route, requestedWidth: width, height, ...geometry });
      if ([320, 390, 768, 1440].includes(width)) {
        fs.mkdirSync(".cache/admin-qa/mobile", { recursive: true });
        await page.screenshot({
          path:
            ".cache/admin-qa/mobile/" +
            route.replace(/[^a-z0-9]/gi, "-") +
            "-" +
            width +
            (process.env.MOBILE_SOURCE_CSS ? "-source" : "-live") +
            ".png",
          fullPage: true,
        });
      }
    }
    for (const route of [
      "/admin",
      "/admin/calendar",
      "/admin/reports",
      "/admin/collections/contacts/create",
      "/admin/collections/appointments/create",
      "/admin/collections/posts/create",
    ])
      for (const width of widths) await inspect(route, width);
    await inspect("/admin/calendar", 844, 390);
    fs.writeFileSync(
      ".cache/admin-qa/mobile/" +
        (process.env.MOBILE_SOURCE_CSS ? "source" : "live") +
        "-geometry.json",
      JSON.stringify(findings, null, 2),
    );
    await interactions(context, page);
    const issues = findings.filter(
      (x) =>
        x.scroll > x.requestedWidth ||
        (x.width <= 1024 &&
          (x.small.length || x.inputs.some((i) => i.font < 16))),
    );
    console.log(
      JSON.stringify(
        issues.map((x) => ({
          route: x.route,
          width: x.width,
          overflow: x.scroll - x.width,
          smallCount: x.small.length,
          inputFonts: [...new Set(x.inputs.map((i) => i.font))],
          causes: x.overflow,
        })),
        null,
        2,
      ),
    );
    if (!process.env.MOBILE_AUDIT_ONLY)
      assert.equal(
        issues.length,
        0,
        "Mobile geometry, control sizing or text-input font failure",
      );
    console.log(
      "Completed " +
        findings.length +
        " viewport/route checks; Chromium touch emulation, DPR2, reduced motion.",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
