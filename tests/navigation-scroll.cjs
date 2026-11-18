const { chromium } = require("playwright");
const assert = require("node:assert/strict");
(async () => {
  const browser = await chromium.launch({ channel: "chrome" });
  const page = await browser.newPage();
  try {
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("http://127.0.0.1:3000");
      const link = page.locator('footer a[href="/services"]').first();
      await link.scrollIntoViewIfNeeded();
      assert.ok(await page.evaluate(() => scrollY > 1000));
      await page.evaluate(() => {
        window.routeScrollFrames = [];
        const sample = () => {
          if (location.pathname === "/services")
            window.routeScrollFrames.push({
              y: scrollY,
              phase: document.querySelector(".page-transition")?.dataset.phase,
            });
          window.routeScrollRaf = requestAnimationFrame(sample);
        };
        sample();
      });
      await link.click();
      await page.waitForURL("**/services");
      await page.waitForFunction(
        () =>
          document.querySelector(".page-transition").dataset.phase === "idle",
      );
      await page.waitForTimeout(200);
      const frames = await page.evaluate(() => {
        cancelAnimationFrame(window.routeScrollRaf);
        return window.routeScrollFrames.filter(
          (f) => f.phase === "revealing" || f.phase === "idle",
        );
      });
      assert.ok(frames.length > 0);
      assert.ok(
        frames.every((f) => f.y < 1),
        "new route must already be at top during every visible reveal frame: " +
          JSON.stringify(frames.filter((f) => f.y > 0).slice(0, 4)),
      );
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.locator('footer a[href="/about"]').first().click();
      await page.waitForURL("**/about");
      assert.ok(await page.evaluate(() => scrollY < 1));
      await page.emulateMedia({ reducedMotion: "no-preference" });
      console.log(
        "PASS navigation from footer starts at top throughout reveal and with reduced motion",
        width,
      );
    }
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
