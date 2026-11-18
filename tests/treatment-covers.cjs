const { chromium } = require("playwright");
const fs = require("node:fs");
const path = require("node:path");
const { createHash } = require("node:crypto");
const assert = require("node:assert/strict");
const covers = require("../data/service-covers.json");
const services = require("../data/ui.json").services;
const hashes = new Set();
assert.equal(Object.keys(covers).length, services.length);
for (const service of services) {
  const cover = covers[service.slug];
  assert.ok(cover?.alt);
  const file = fs.readFileSync(
    path.join(__dirname, "../public/images", cover.image),
  );
  hashes.add(createHash("sha256").update(file).digest("hex"));
}
assert.equal(
  hashes.size,
  23,
  "23 different image files, not duplicated assets",
);
const imagePath = (src) =>
  new URL(src, "http://127.0.0.1:3000").searchParams.get("url");
(async () => {
  const browser = await chromium.launch({ channel: "chrome" });
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  try {
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto("http://127.0.0.1:3000/services");
      const cards = page.locator(".service-card");
      assert.equal(await cards.count(), 23);
      for (let i = 0; i < 23; i++) {
        const card = cards.nth(i),
          image = card.locator("img");
        const href = (await card.getAttribute("href")).slice(1);
        assert.equal(
          imagePath(await image.getAttribute("src")),
          "/images/" + covers[href].image,
        );
        assert.equal(await image.getAttribute("alt"), covers[href].alt);
        await image.scrollIntoViewIfNeeded();
        await image.evaluate((e) => e.decode());
      }
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
      await cards.first().scrollIntoViewIfNeeded();
      await page.screenshot({
        path: `research/screenshots/treatment-grid-${width}.png`,
      });
      // Check every individual treatment page, not just the overview cards.
      for (const service of services) {
        await page.goto("http://127.0.0.1:3000/" + service.slug);
        const image = page.locator(".care-aside img");
        assert.equal(
          imagePath(await image.getAttribute("src")),
          "/images/" + covers[service.slug].image,
        );
        await image.scrollIntoViewIfNeeded();
        await image.evaluate((e) => e.decode());
        assert.ok(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        );
      }
      console.log(
        "PASS 23 unique covers: overview cards and 23 internal pages, loaded images/alt/no overflow",
        width,
      );
    }
    await page.goto("http://127.0.0.1:3000");
    for (const image of await page.locator(".service-card img").all()) {
      assert.match(
        imagePath(await image.getAttribute("src")),
        /^\/images\/treatments\//,
      );
    }
    assert.deepEqual(errors, []);
    console.log("PASS home featured cards use new covers; no browser errors");
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
