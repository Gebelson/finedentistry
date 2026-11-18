const { chromium } = require("playwright");
const assert = require("node:assert/strict");
(async () => {
  const b = await chromium.launch({ channel: "chrome" });
  const p = await b.newPage();
  try {
    for (const width of [390, 1440]) {
      await p.setViewportSize({ width, height: 900 });
      await p.goto("http://127.0.0.1:3000");
      assert.equal(await p.locator(".hero h1 .reveal-line").count(), 3);
      const initialScale = await p
        .locator(".hero-photo")
        .evaluate(
          (e) => new DOMMatrixReadOnly(getComputedStyle(e).transform).a,
        );
      assert.ok(
        initialScale > 1 && initialScale <= 1.1,
        "hero photograph begins gently enlarged",
      );
      const supportDelay = await p
        .locator(".hero-aside > p")
        .evaluate((e) => parseFloat(getComputedStyle(e).animationDelay));
      const buttonDelay = await p
        .locator(".hero-aside > button")
        .evaluate((e) => parseFloat(getComputedStyle(e).animationDelay));
      assert.ok(
        buttonDelay > supportDelay,
        "button enters after the supporting text",
      );
      await p.waitForTimeout(2300);
      assert.equal(
        await p
          .locator(".hero-photo")
          .evaluate(
            (e) => new DOMMatrixReadOnly(getComputedStyle(e).transform).a,
          ),
        1,
      );
      assert.ok(
        await p
          .locator(".hero h1 .reveal-line-content")
          .evaluateAll((es) =>
            es.every((e) => getComputedStyle(e).opacity === "1"),
          ),
      );
      const heading = p.locator("#services h2");
      assert.equal(await heading.getAttribute("data-reveal-state"), "pending");
      await heading.scrollIntoViewIfNeeded();
      await p.waitForTimeout(150);
      assert.equal(await heading.getAttribute("data-reveal-state"), "visible");
      assert.ok(
        await heading
          .locator(".reveal-line-content")
          .first()
          .evaluate((e) => e.getAnimations().length > 0),
      );
      await p.waitForTimeout(1300);
      assert.ok(
        await heading
          .locator(".reveal-line-content")
          .evaluateAll((es) =>
            es.every((e) => getComputedStyle(e).opacity === "1"),
          ),
      );
      assert.ok(
        await p.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
      console.log("PASS hero line reveal and scroll-triggered headings", width);
    }
    await p.emulateMedia({ reducedMotion: "reduce" });
    await p.reload();
    assert.ok(
      await p
        .locator("[data-reveal]")
        .evaluateAll((es) =>
          es.every((e) => getComputedStyle(e).opacity === "1"),
        ),
    );
    assert.equal(
      await p
        .locator(".hero .reveal-line-content")
        .first()
        .evaluate((e) => getComputedStyle(e).animationName),
      "none",
    );
    console.log("PASS reduced motion visible content");
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
