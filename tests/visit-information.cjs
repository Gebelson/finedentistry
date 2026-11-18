const { chromium } = require("playwright");
const assert = require("node:assert/strict");
(async () => {
  const b = await chromium.launch({ channel: "chrome" });
  const p = await b.newPage();
  try {
    for (const width of [390, 1440]) {
      await p.setViewportSize({ width, height: 900 });
      for (const route of ["/", "/contact"]) {
        await p.goto("http://127.0.0.1:3000" + route);
        const footer = p.locator("footer");
        assert.equal(
          await p.locator(".contact-grid .office-hours dl>div").count(),
          6,
        );
        assert.match(
          await p.locator(".contact-grid .office-hours").textContent(),
          /7 AM – 7 PM/,
        );
        assert.match(
          await p.locator(".contact-grid .office-hours").textContent(),
          /ThursdayPlease call to confirm/,
        );
        for (const [name, url] of [
          [
            "Instagram",
            "https://www.instagram.com/finedentistryofdowntownorlando/",
          ],
          [
            "Facebook",
            "https://www.facebook.com/FineDentistryDowntownOrlando/",
          ],
        ]) {
          assert.equal(
            await footer
              .getByRole("link", { name, exact: true })
              .getAttribute("href"),
            url,
          );
          assert.equal(
            await p
              .locator(".contact-social-icons")
              .getByRole("link", { name, exact: true })
              .getAttribute("href"),
            url,
          );
        }
        assert.equal(await p.locator(".contact-grid .office-hours").count(), 1);
        assert.ok(
          await p.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        );
        console.log("PASS hours and official social links", route, width);
      }
    }
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
