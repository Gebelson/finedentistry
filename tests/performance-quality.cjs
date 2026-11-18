const { chromium } = require("playwright");
const assert = require("node:assert/strict");

// A masked entrance must still produce a real LCP entry, including on mobile.
(async () => {
  const base = process.env.BASE_URL || "http://127.0.0.1:3000";
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  try {
    for (const width of [390, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      await page.addInitScript(() => {
        window.__lcp = [];
        new PerformanceObserver((list) => {
          window.__lcp.push(
            ...list.getEntries().map((entry) => entry.startTime),
          );
        }).observe({ type: "largest-contentful-paint", buffered: true });
      });
      await page.goto(base);
      await page.waitForFunction(() => window.__lcp.length > 0);
      assert.ok(
        (await page.evaluate(() => window.__lcp)).every(Number.isFinite),
      );
      assert.match(
        await page.locator('meta[name="robots"]').getAttribute("content"),
        /noindex/,
      );
      const hero = page.locator(".hero-photo");
      await hero.evaluate((image) => image.decode());
      const imageUrl = await hero.getAttribute("src");
      const response = await page.request.get(new URL(imageUrl, base).href, {
        headers: { Accept: "image/avif,image/webp" },
      });
      assert.equal(response.status(), 200);
      assert.match(response.headers()["content-type"], /image\/avif/);
      assert.ok(
        (await response.body()).length < 350_000,
        "hero stays below 350 KB",
      );
      await page.close();
    }
    console.log(
      "PASS measurable LCP, AVIF image budget and preview noindex on desktop/mobile",
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
