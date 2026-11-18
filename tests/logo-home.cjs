const { chromium } = require('playwright');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({ channel: 'chrome' });
  const page = await browser.newPage();
  try {
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('http://127.0.0.1:3000/#about');
      await page.waitForFunction(() => scrollY > 100);
      await page.locator('.header .wordmark').click();
      await page.waitForFunction(() => scrollY < 1 && location.hash === '');
      assert.equal(new URL(page.url()).pathname, '/');
      await page.locator('.footer-brand').scrollIntoViewIfNeeded();
      await page.locator('.footer-brand').click();
      await page.waitForFunction(() => scrollY < 1);
      await page.goto('http://127.0.0.1:3000/contact');
      await page.locator('.header .wordmark').click();
      await page.waitForURL('http://127.0.0.1:3000/');
      await page.waitForFunction(() => scrollY < 1);
      console.log('PASS header/footer logos return to home top, clear anchor, navigate from contact', width);
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
