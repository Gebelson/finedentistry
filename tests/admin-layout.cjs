const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const fs = require('node:fs');
const base = process.env.TEST_URL || 'http://localhost:3000';
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const context = await browser.newContext({ extraHTTPHeaders: { Origin: base } });
    const login = await context.request.post(base + '/api/users/login', { data: {
      username: process.env.TEST_ADMIN_USERNAME, password: process.env.TEST_ADMIN_PASSWORD,
    } });
    assert.equal(login.status(), 200);
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    fs.mkdirSync('.cache/admin-qa', { recursive: true });
    for (const width of [1440, 571, 390]) {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ colorScheme: width === 571 ? 'dark' : 'light' });
      for (const route of ['/admin', '/admin/analytics', '/admin/calendar', '/admin/reports', '/admin/integrations', '/admin/collections/posts']) {
        await page.goto(base + route);
        await page.locator('.template-default').first().waitFor();
        assert.equal(await page.locator('.template-default').count(), 1, `${route} at ${width}px must have one admin layout`);
        assert.equal(await page.locator('.template-default .template-default').count(), 0);
        if (route === '/admin') {
          await page.getByRole('heading', { name: 'Dashboard' }).waitFor();
          const toggle = page.locator(width >= 1024 ? '.template-default__nav-toggler' : '.app-header__mobile-nav-toggler');
          if (/^open menu$/i.test(await toggle.getAttribute('aria-label'))) await toggle.click();
          const closeMenu = page.locator('.template-default__nav-toggler');
          assert.match(await closeMenu.getAttribute('aria-label'), /^Close menu$/i);
          assert.equal(await page.getByRole('navigation', { name: 'Workspace navigation' }).count(), 1);
          const dashboardLink = page.getByRole('link', { name: 'Dashboard', exact: true });
          assert.equal(await dashboardLink.getAttribute('href'), '/admin');
          assert.equal(await dashboardLink.getAttribute('aria-current'), 'page');
          await page.screenshot({ path: `.cache/admin-qa/navigation-${width}.png` });
          await page.locator(width >= 1024 ? '.template-default__nav-toggler' : '.nav__mobile-close').click();
          await page.waitForFunction(() => document.documentElement.scrollWidth <= innerWidth);
          await page.screenshot({ path: `.cache/admin-qa/navigation-content-${width}.png` });
        }
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${route} at ${width}px must not overflow`);
      }
    }
    await page.goto(base + '/admin/analytics');
    await page.locator('.app-header__mobile-nav-toggler').click();
    await page.getByRole('link', { name: 'Dashboard', exact: true }).click();
    await page.waitForURL(base + '/admin');
    await page.getByRole('heading', { name: 'Dashboard' }).waitFor();
    assert.deepEqual(errors, []);
    console.log('PASS one admin layout/sidebar on dashboard, analytics, calendar, reports, integrations and articles; desktop, 571px dark and mobile; menu toggle and no horizontal overflow/runtime errors.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
