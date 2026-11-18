const { chromium } = require("playwright");
const assert = require("node:assert/strict");
(async () => {
  const browser = await chromium.launch({ channel: "chrome" });
  const page = await browser.newPage();
  try {
    await page.goto("http://127.0.0.1:3000");
    const carousel = page.getByRole("region", {
      name: "Selected Google reviews",
    });
    await carousel.waitFor({ timeout: 5000 });
    const names = [
      "Moises Sarmiento",
      "Lilibeth Villarroel",
      "Grant Pennell",
      "Ty Ashton",
      "Shirley Fitzsimmons",
      "Valerie O'Neil",
    ];
    for (const name of names) {
      assert.equal(
        await carousel.locator(".review-author-name").innerText(),
        name,
      );
      assert.match(
        await carousel
          .getByRole("link", { name: "Read this review on Google" })
          .getAttribute("href"),
        /^https:\/\/share.google\//,
      );
      await carousel
        .getByRole("button", { name: "Next patient story" })
        .click();
    }
    assert.equal(
      await carousel.locator(".review-author-name").innerText(),
      names[0],
    );
    await carousel
      .getByRole("button", { name: "Previous patient story" })
      .click();
    assert.equal(
      await carousel.locator(".review-author-name").innerText(),
      names[5],
    );
    await carousel.focus();
    await page.keyboard.press("ArrowRight");
    assert.equal(
      await carousel.locator(".review-author-name").innerText(),
      names[0],
    );
    await carousel.dispatchEvent("touchstart", { touches: [{ identifier: 1, clientX: 240, clientY: 150 }] });
    await carousel.dispatchEvent("touchend", {
      changedTouches: [{ identifier: 1, clientX: 100, clientY: 150 }],
    });
    assert.equal(
      await carousel.locator(".review-author-name").innerText(),
      names[1],
    );
    await carousel.dispatchEvent("touchstart", { touches: [{ identifier: 1, clientX: 100, clientY: 150 }] });
    await carousel.dispatchEvent("touchend", {
      changedTouches: [{ identifier: 1, clientX: 240, clientY: 150 }],
    });
    assert.equal(
      await carousel.locator(".review-author-name").innerText(),
      names[0],
    );
    for (const width of [390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("http://127.0.0.1:3000/patient-reviews");
      assert.equal(await page.locator(".review-card").count(), 6);
      assert.equal(await page.locator(".review-card a").count(), 6);
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
    }
    console.log(
      "PASS: six attributed Google reviews, forward/back/wrap, keyboard/swipe, review grid at 390/768/1440px",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
