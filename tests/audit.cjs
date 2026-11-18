const { chromium } = require("playwright");
const { AxeBuilder } = require("@axe-core/playwright");
const fs = require("fs");
const assert = require("node:assert/strict");
const origin = process.env.TEST_URL || "http://127.0.0.1:3000";
(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const results = {
    origin,
    checkedAt: new Date().toISOString(),
    routes: [],
    viewports: [],
    interactions: [],
    axe: [],
    consoleErrors: errors,
  };
  try {
    for (const route of [
      "/",
      ...require("../data/content.json").map((p) => "/" + p.slug),
      "/technology",
      "/privacy",
      ...Array.from(
        {
          length:
            Math.ceil(
              require("../data/content.json").filter((p) =>
                p.slug.startsWith("blog/"),
              ).length / 12,
            ) - 1,
        },
        (_, i) => `/blog/page/${i + 2}`,
      ),
    ]) {
      const r = await page.goto(origin + route);
      await page.locator("h1").waitFor();
      const bad = await page
        .locator("a")
        .evaluateAll(
          (as) => as.filter((a) => a.getAttribute("href") === "#").length,
        );
      assert.equal(r.status(), 200, route);
      assert.equal(await page.locator("h1").count(), 1, route);
      assert.equal(bad, 0, route);
      results.routes.push({
        route,
        status: r.status(),
        h1: await page.locator("h1").textContent(),
      });
    }
    await page.goto(origin);
    assert.equal(await page.locator(".location-map").count(), 0);
    assert.match(
      await page.locator(".hero-photo").getAttribute("src"),
      /team-enhanced-v2/,
    );
    results.interactions.push("enhanced team hero; map removed");
    await page.evaluate(() => {
      for (const i of document.images) i.loading = "eager";
    });
    for (const width of [320, 375, 390, 430, 768, 1024, 1440, 1920]) {
      const height = width === 390 ? 844 : width === 375 ? 812 : 900;
      await page.setViewportSize({ width, height });
      await page.evaluate(() =>
        Promise.all(
          [...document.images].map((i) => i.decode().catch(() => {})),
        ),
      );
      const state = await page.evaluate(() => ({
        viewport: innerWidth,
        scroll: document.documentElement.scrollWidth,
        broken: [...document.images]
          .filter((i) => i.complete && !i.naturalWidth)
          .map((i) => i.src),
      }));
      results.viewports.push({ width, ...state });
      assert.ok(state.scroll <= width, `overflow at ${width}: ${state.scroll}`);
      assert.deepEqual(state.broken, [], `broken images at ${width}`);
      if ([375, 390, 768, 1024, 1440, 1920].includes(width))
        await page.screenshot({
          path: `research/visual-qa/local-${width}.png`,
          fullPage: true,
        });
      if ([390, 1440].includes(width))
        await page.screenshot({
          path: `research/visual-qa/local-${width}-viewport.png`,
        });
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole("button", { name: "Menu +", exact: true }).click();
    assert.equal(
      await page
        .getByRole("button", { name: "Close −" })
        .getAttribute("aria-expanded"),
      "true",
    );
    await page
      .getByRole("navigation", { name: "Mobile navigation" })
      .getByRole("link", { name: "Treatments", exact: true })
      .click();
    await page.waitForURL("**/services");
    assert.equal(
      await page.getByRole("navigation", { name: "Mobile navigation" }).count(),
      0,
    );
    await page.getByRole("button", { name: "Aesthetics", exact: true }).click();
    assert.equal(await page.locator(".service-card").count(), 3);
    results.interactions.push("mobile menu navigation and treatment filter");
    await page.goto(origin);
    await page.locator(".faq-list summary").first().click();
    assert.equal(
      await page.locator(".faq-list details").first().getAttribute("open"),
      "",
    );
    await page.getByRole("button", { name: "Next patient story" }).click();
    assert.equal(await page.getByText("Lilibeth Villarroel", { exact: true }).count(), 1);
    await page.getByRole("button", { name: "View smile case 1" }).click();
    assert.equal(
      await page.getByRole("dialog", { name: "Smile case viewer" }).isVisible(),
      true,
    );
    await page.getByRole("button", { name: "Next smile case" }).click();
    assert.equal(await page.getByText("Case 2 of 20").count(), 1);
    await page.keyboard.press("Escape");
    results.interactions.push(
      "FAQ accordion, patient carousel, gallery viewer and Escape",
    );
    await page
      .getByRole("button", { name: "Request an Appointment", exact: true })
      .filter({ visible: true })
      .first()
      .click();
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    assert.equal(
      await page
        .getByLabel("Treatment", { exact: true })
        .evaluate((e) => e.validity.valueMissing),
      true,
    );
    await page
      .getByLabel("Treatment", { exact: true })
      .selectOption("Dental Implants");
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await page.getByRole("button", { name: "← Back" }).click();
    assert.equal(
      await page.getByLabel("Treatment", { exact: true }).inputValue(),
      "Dental Implants",
    );
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    assert.equal(
      await page
        .getByRole("link", { name: "Continue on the clinic website" })
        .getAttribute("href"),
      "https://www.finedentistryorlando.com/Contact",
    );
    assert.equal(await page.locator("input").count(), 0);
    await page.screenshot({ path: "research/visual-qa/booking-mobile.png" });
    await page.keyboard.press("Escape");
    assert.equal(await page.getByRole("dialog").count(), 0);
    assert.equal(
      await page.evaluate(() => document.activeElement?.textContent),
      "Request an Appointment",
    );
    results.interactions.push(
      "booking validation, back/preserved treatment, honest official fallback, Escape and focus return",
    );
    for (const [url, width] of [
      ["/", 390],
      ["/", 1440],
      ["/services", 1440],
      ["/our-team", 390],
      ["/contact", 390],
    ]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(origin + url);
      const scan = await new AxeBuilder({ page })
        .withTags([
          "wcag2a",
          "wcag2aa",
          "wcag21a",
          "wcag21aa",
          "wcag22a",
          "wcag22aa",
        ])
        .analyze();
      results.axe.push({
        url,
        width,
        violations: scan.violations.map((v) => ({
          id: v.id,
          impact: v.impact,
          description: v.description,
          nodes: v.nodes.map((n) => ({
            target: n.target,
            summary: n.failureSummary,
          })),
        })),
      });
    }
    await page.emulateMedia({ reducedMotion: "reduce" });
    assert.equal(
      await page.evaluate(
        () => getComputedStyle(document.documentElement).scrollBehavior,
      ),
      "auto",
    );
    results.interactions.push("reduced motion");
    await page.setViewportSize({ width: 640, height: 450 });
    await page.goto(origin);
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    results.interactions.push("200% equivalent reflow at 640 CSS pixels");
    const unknown = await page.goto(origin + "/not-a-page");
    assert.equal(unknown.status(), 404);
    results.interactions.push("real 404");
    assert.equal(errors.length, 0);
    console.log(
      JSON.stringify({
        routes: results.routes.length,
        viewports: results.viewports.length,
        interactions: results.interactions,
        axe: results.axe.map((a) => ({
          url: a.url,
          width: a.width,
          violations: a.violations.length,
        })),
        consoleErrors: errors,
      }),
    );
  } finally {
    fs.writeFileSync(
      "research/qa-results.json",
      JSON.stringify(results, null, 2),
    );
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
