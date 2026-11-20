const assert = require("node:assert/strict");
const { chromium } = require("playwright");
const base = process.env.TEST_URL || "http://localhost:3000";
(async () => {
  const b = await chromium.launch({ channel: "chrome", headless: true });
  try {
    const c = await b.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
      hasTouch: true,
      isMobile: true,
    });
    const p = await c.newPage();
    for (const width of [320, 360, 390, 430, 768]) {
      await p.setViewportSize({ width, height: 844 });
      await p.goto(base + "/admin/login");
      await p.locator("input[name=password]").waitFor();
      assert.ok((await p.title()).includes("Fine Dentistry"));
      for (const input of await p.locator("input:not([type=hidden])").all()) {
        assert.ok(
          await input.evaluate(
            (e) => parseFloat(getComputedStyle(e).fontSize) >= 16,
          ),
          "Login text must avoid small focus text",
        );
        assert.ok((await input.boundingBox()).height >= 44);
      }
      assert.ok(
        (
          await p
            .getByRole("button", { name: "Login", exact: true })
            .boundingBox()
        ).height >= 44,
      );
      assert.equal(
        await p.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
      );
    }
    console.log(
      "PASS login text sizing, touch controls and reflow at320/360/390/430/768. No login submitted.",
    );
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
