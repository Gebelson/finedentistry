const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("fs");
const crypto = require("crypto");
(async () => {
  const browser = await chromium.launch({ channel: "chrome" });
  const page = await browser.newPage();
  const reports = [];
  const originalClinical = Object.fromEntries(
    fs
      .readdirSync("public/images")
      .filter((n) => n.startsWith("Before-After-"))
      .map((n) => [
        n,
        crypto
          .createHash("sha256")
          .update(fs.readFileSync("public/images/" + n))
          .digest("hex"),
      ]),
  );
  try {
    for (const width of [390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      for (const route of [
        "/",
        "/services",
        "/our-team",
        "/about",
        "/contact",
        "/smile-gallery",
        "/services/veneers",
      ]) {
        await page.goto("http://127.0.0.1:3000" + route);
        await page.evaluate(() => {
          for (const i of document.images) i.loading = "eager";
        });
        await page.evaluate(() =>
          Promise.all(
            [...document.images].map((i) => i.decode().catch(() => {})),
          ),
        );
        const images = await page
          .locator("img")
          .evaluateAll((images) =>
            images.map((i) => ({
              src: decodeURIComponent(i.currentSrc || i.src),
              loaded: i.complete && i.naturalWidth > 0,
              srcset: !!i.srcset,
            })),
          );
        assert.ok(
          images.every((i) => i.loaded),
          `${route} ${width}: broken image`,
        );
        if (route === "/services") {
          assert.ok(
            images.some((i) => i.src.includes("ser1-enhanced-v2.png")),
            "restored service image is rendered",
          );
          assert.ok(
            images
              .filter((i) => i.src.includes("-enhanced-v2.png"))
              .every((i) => i.srcset),
            "responsive source sizes present",
          );
        }
        if (route === "/our-team") {
          assert.ok(
            images.some((i) => i.src.includes("dr-trivedi-enhanced-v2.png")),
          );
          assert.ok(
            images.some((i) =>
              i.src.includes("Dr-Amanda-Perez-enhanced-v2.png"),
            ),
          );
        }
        if (route === "/smile-gallery")
          assert.ok(
            images
              .filter((i) => i.src.includes("Before-After-"))
              .every(
                (i) =>
                  !i.src.includes("_next/image") && !i.src.includes("enhanced"),
              ),
            "clinical originals are served unchanged",
          );
        assert.ok(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          `overflow ${route} ${width}`,
        );
        reports.push({ route, width, images: images.length, broken: 0 });
        if (width === 1440 && ["/services", "/our-team"].includes(route))
          await page.screenshot({
            path: `research/visual-qa/restored-${route.slice(1)}.png`,
            fullPage: true,
          });
      }
    }
    console.log(
      "PASS",
      reports.length,
      "route/viewport combinations; clinical originals unchanged; responsive restorations rendered",
    );
  } finally {
    fs.writeFileSync(
      "research/image-quality-qa.json",
      JSON.stringify(
        { reports, clinicalOriginalHashes: originalClinical },
        null,
        2,
      ),
    );
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
