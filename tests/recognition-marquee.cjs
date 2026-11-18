const { chromium } = require("playwright");
const assert = require("node:assert/strict");
(async () => {
  const b = await chromium.launch({ channel: "chrome" });
  const p = await b.newPage();
  try {
    for (const width of [390, 1440, 1920]) {
      await p.setViewportSize({ width, height: 900 });
      await p.goto("http://127.0.0.1:3000");
      const region = p.locator(".recognition-strip");
      assert.equal(await region.locator("img").count(), 12);
      assert.equal(await region.locator("figcaption").count(), 0);
      assert.equal(
        await region.evaluate((e) => e.getBoundingClientRect().left),
        0,
      );
      assert.equal(
        await region.evaluate((e) => e.getBoundingClientRect().width),
        width,
      );
      assert.notEqual(
        await region.evaluate((e) => getComputedStyle(e).maskImage),
        "none",
      );
      const logo = await p.locator(".header .wordmark").evaluate((e) => ({
        left: e.getBoundingClientRect().left,
        imageLeft: e.querySelector("img").getBoundingClientRect().left,
        imageWidth: e.querySelector("img").getBoundingClientRect().width,
      }));
      const gutter = await p
        .locator(".hero-content")
        .evaluate(
          (e) =>
            e.getBoundingClientRect().left +
            parseFloat(getComputedStyle(e).paddingLeft),
        );
      assert.ok(Math.abs(logo.left - gutter) < 1);
      assert.ok(
        Math.abs(logo.imageLeft + (logo.imageWidth * 94) / 947 - gutter) < 1,
        "visible logo aligns to content margin",
      );
      await region.scrollIntoViewIfNeeded();
      await p.mouse.move(width - 1, 0);
      const track = region.locator(".recognition-track");
      await p.waitForTimeout(150);
      const first = await track.evaluate((e) => getComputedStyle(e).transform);
      await p.waitForTimeout(300);
      const second = await track.evaluate((e) => getComputedStyle(e).transform);
      assert.notEqual(first, second);
      assert.equal(await p.locator(".recognition-toggle").count(), 0);
      assert.equal(
        await region.locator('img[src*="icon-cred-2-opt"]').count(),
        0,
      );
      await region.hover();
      await p.waitForTimeout(100);
      const time1 = await track.evaluate((e) =>
        Number(e.getAnimations()[0].currentTime),
      );
      await p.waitForTimeout(300);
      const time2 = await track.evaluate((e) =>
        Number(e.getAnimations()[0].currentTime),
      );
      assert.ok(
        time2 - time1 > 20 && time2 - time1 < 200,
        "hover slows movement without stopping",
      );
      assert.equal(
        await track.evaluate((e) => getComputedStyle(e).animationPlayState),
        "running",
      );
      await p.mouse.move(width - 1, 0);
      await p.waitForTimeout(80);
      assert.equal(
        await track.evaluate((e) => e.getAnimations()[0].playbackRate),
        1,
      );
      assert.ok(
        await p.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
      console.log(
        "PASS infinite full-width marquee, fade, hover slowdown and logo at content margin",
        width,
      );
    }
    await p.emulateMedia({ reducedMotion: "reduce" });
    assert.equal(
      await p
        .locator(".recognition-track")
        .evaluate((e) => getComputedStyle(e).animationName),
      "none",
    );
    console.log("PASS reduced motion");
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
