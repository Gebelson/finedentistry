const { chromium } = require("playwright");
const assert = require("node:assert/strict");
(async () => {
  const b = await chromium.launch({ channel: "chrome" });
  const p = await b.newPage();
  try {
    for (const width of [390, 1440]) {
      await p.setViewportSize({ width, height: 900 });
      await p.goto("http://127.0.0.1:3000");
      assert.equal(
        await p
          .getByRole("heading", {
            name: "The Fine Dentistry Difference",
            exact: true,
          })
          .count(),
        1,
      );
      assert.equal(
        await p.locator(".recognition-set:not([aria-hidden]) img").count(),
        6,
      );
      const logo = p.locator("header .wordmark img");
      assert.match(await logo.getAttribute("src"), /bannerlogo/);
      assert.match(
        await logo.evaluate((e) => getComputedStyle(e).filter),
        /invert\(1\)/,
      );
      await p.evaluate(() => scrollTo(0, 1000));
      await p.waitForTimeout(100);
      assert.ok(
        !(await logo.evaluate((e) => getComputedStyle(e).filter)).includes(
          "invert(1)",
        ),
      );
      assert.match(
        await p
          .locator("footer .footer-brand img")
          .evaluate((e) => getComputedStyle(e).filter),
        /invert\(1\)/,
      );
      assert.ok(
        await p.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
      console.log("PASS original logo and recognition", width);
    }
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
