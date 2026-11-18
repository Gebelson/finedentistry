const { chromium } = require("playwright");
const assert = require("node:assert/strict");
(async () => {
  const b = await chromium.launch({ channel: "chrome" });
  const p = await b.newPage();
  try {
    for (const width of [390, 1440]) {
      await p.setViewportSize({ width, height: 900 });
      await p.goto("http://127.0.0.1:3000/smile-gallery");
      assert.equal(await p.locator(".gallery-item").count(), 20);
      for (const name of [
        "Cosmetic Crowns & Whitening",
        "Implant Retained Hybrid Denture",
        "Bridges, Crowns & Whitening",
      ])
        assert.ok(
          (await p.locator(".gallery-item").filter({ hasText: name }).count()) >
            0,
          name,
        );
      await p.evaluate(() => {
        for (const i of document.images) i.loading = "eager";
      });
      await p.evaluate(() =>
        Promise.all(
          [...document.images].map((i) => i.decode().catch(() => {})),
        ),
      );
      assert.equal(
        await p
          .locator("img")
          .evaluateAll(
            (images) => images.filter((i) => !i.naturalWidth).length,
          ),
        0,
      );
      assert.ok(
        await p.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
      const card = p
        .locator(".gallery-item")
        .filter({ hasText: "Implant Retained Hybrid Denture" });
      await card.click();
      const dialog = p.getByRole("dialog", { name: "Smile case viewer" });
      assert.ok(
        await dialog
          .getByText("Implant Retained Hybrid Denture", { exact: true })
          .isVisible(),
      );
      await p.getByRole("button", { name: "Next smile case" }).click();
      assert.match(
        await dialog.locator(".gallery-case-title").textContent(),
        /Invisalign|Crowns|Cosmetic|Bridges|Denture/,
      );
      await p.keyboard.press("Escape");
      assert.equal(await dialog.count(), 0);
      console.log(
        "PASS gallery 20 originals, correct labels and viewer",
        width,
      );
    }
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
