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
        assert.equal(await p.locator(".location-map").count(), 0);
        assert.equal(await footer.locator(".office-hours").count(), 0);
        assert.equal(await p.locator(".contact-grid .office-hours").count(), 1);
        const icons = footer.locator(".footer-social-icons");
        assert.equal(await icons.locator("a svg").count(), 2);
        assert.equal(
          await icons.evaluate((e) =>
            e.previousElementSibling?.getAttribute("href"),
          ),
          "mailto:frontoffice@finedentistryorlando.com",
        );
        for (const name of ["Facebook", "Instagram"]) {
          const link = icons.getByRole("link", { name, exact: true });
          assert.ok(await link.isVisible());
          assert.match(
            await link.getAttribute("href"),
            name === "Facebook"
              ? /facebook.com\/FineDentistryDowntownOrlando/
              : /instagram.com\/finedentistryofdowntownorlando/,
          );
        }
        assert.ok(
          await p.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        );
        console.log(
          "PASS footer icons below email, no map or footer hours",
          route,
          width,
        );
      }
    }
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
