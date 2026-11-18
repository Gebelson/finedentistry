const { chromium } = require("playwright");
const assert = require("node:assert/strict");
(async () => {
  const b = await chromium.launch({ channel: "chrome" });
  const p = await b.newPage();
  try {
    for (const width of [390, 768, 1440]) {
      await p.setViewportSize({ width, height: 900 });
      for (const route of ["/", "/contact"]) {
        await p.goto("http://127.0.0.1:3000" + route);
        const contact = p.locator(".contact-grid");
        const icons = contact.locator(".contact-social-icons");
        assert.equal(await icons.locator("a svg").count(), 2);
        assert.equal(
          await icons.evaluate((e) =>
            e.previousElementSibling.getAttribute("href"),
          ),
          "mailto:frontoffice@finedentistryorlando.com",
        );
        assert.equal(
          await contact.getByText("Stay connected", { exact: true }).count(),
          0,
        );
        assert.equal(await contact.locator(".hours-note").count(), 0);
        const columns = contact.locator(".office-hours-columns dl");
        assert.equal(await columns.count(), 2);
        assert.deepEqual(await columns.nth(0).locator("dt").allTextContents(), [
          "Monday",
          "Tuesday",
          "Wednesday",
        ]);
        assert.deepEqual(await columns.nth(1).locator("dt").allTextContents(), [
          "Thursday",
          "Friday",
          "Saturday",
        ]);
        const boxes = await columns.evaluateAll((es) =>
          es.map((e) => ({
            x: e.getBoundingClientRect().x,
            y: e.getBoundingClientRect().y,
          })),
        );
        assert.ok(boxes[1].x > boxes[0].x);
        assert.equal(boxes[0].y, boxes[1].y);
        assert.ok(
          await p.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        );
        console.log("PASS contact icons and two-column hours", route, width);
      }
    }
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
