const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { randomBytes } = require("node:crypto");
const base = process.env.TEST_URL || "http://127.0.0.1:3010";
const identifier =
  process.env.TEST_ADMIN_USERNAME || process.env.TEST_ADMIN_EMAIL;
const editorPassword = randomBytes(24).toString("hex");

(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage();
  await page.context().setExtraHTTPHeaders({ Origin: new URL(base).origin });
  try {
    await page.goto(base);
    const login = page
      .locator("footer")
      .getByRole("link", { name: "Clinic login", exact: true });
    assert.equal(await login.count(), 1, "footer must expose clinic login");
    await login.click();
    await page.waitForURL(/\/admin\/login/);
    await page
      .locator('input[name="email"], input[name="username"]')
      .first()
      .waitFor();
    assert.ok(
      (
        await page
          .locator('input[name="email"], input[name="username"]')
          .first()
          .boundingBox()
      ).height >= 35,
      "login stylesheet must load",
    );
    assert.equal(
      await page.locator(".header").count(),
      0,
      "public chrome must stay out of admin",
    );
    const users = await page.request.get(`${base}/api/users`);
    assert.equal(users.status(), 403);
    for (const path of ["/api/users", "/api/users/first-register"]) {
      const response = await page.request.post(`${base}${path}`, {
        data: {
          email: "unauthorized@example.invalid",
          password: "NotAnAllowedAccount123!",
          role: "admin",
        },
      });
      assert.ok(
        response.status() >= 400,
        `public account creation must fail: ${path}`,
      );
    }
    const invalid = await page.request.post(`${base}/api/users/login`, {
      data: {
        email: "nobody@example.invalid",
        password: "IncorrectPassword123!",
      },
    });
    assert.equal(invalid.status(), 401);
    if (identifier && process.env.TEST_ADMIN_PASSWORD) {
      await page
        .locator('input[name="email"], input[name="username"]')
        .first()
        .fill(identifier);
      await page
        .locator('input[name="password"]')
        .fill(process.env.TEST_ADMIN_PASSWORD);
      await page.getByRole("button", { name: "Login", exact: true }).click();
      await page.waitForURL(/\/admin$/);
      await page
        .getByRole("heading", { name: "Dashboard" })
        .waitFor();
      fs.mkdirSync(".cache/admin-qa", { recursive: true });
      await page.screenshot({
        path: ".cache/admin-qa/dashboard.png",
        fullPage: true,
      });
      const authenticated = await page.request.get(`${base}/api/users`);
      assert.equal(authenticated.status(), 200);
      const cookies = await page.context().cookies();
      assert.ok(
        cookies.some(
          (cookie) => cookie.name === "payload-token" && cookie.httpOnly,
        ),
        "session cookie must be HTTP-only",
      );
      assert.equal(
        (
          await page.request.post(`${base}/api/users`, {
            headers: { Origin: "https://untrusted.example.invalid" },
            data: {
              name: "Cross-site test",
              email: "cross-site@example.invalid",
              password: editorPassword,
              role: "admin",
            },
          })
        ).status(),
        403,
        "cross-site mutations must be rejected",
      );
      const created = await page.request.post(`${base}/api/users`, {
        data: {
          name: "Editor permission test",
          email: "editor-test@example.invalid",
          password: editorPassword,
          role: "editor",
        },
      });
      assert.equal(created.status(), 201);
      const editorID = (await created.json()).doc.id;
      const editor = await browser.newContext({
        extraHTTPHeaders: { Origin: new URL(base).origin },
      });
      try {
        assert.equal(
          (
            await editor.request.post(`${base}/api/users/login`, {
              data: {
                email: "editor-test@example.invalid",
                password: editorPassword,
              },
            })
          ).status(),
          200,
        );
        assert.equal(
          (
            await editor.request.patch(`${base}/api/users/${editorID}`, {
              data: { role: "admin" },
            })
          ).status(),
          403,
        );
        const editorPage = await editor.newPage();
        await editorPage.goto(`${base}/admin`);
        const editorNav = editorPage.locator('.workspace-nav');
        assert.equal(await editorNav.getByRole('link', { name: 'Blog articles', exact: true, includeHidden: true }).count(), 1);
        assert.equal(await editorNav.getByRole('link', { name: 'Inbox', exact: true, includeHidden: true }).count(), 0);
        assert.equal(await editorNav.getByRole('link', { name: 'Team members', exact: true, includeHidden: true }).count(), 0);
        assert.equal(
          (
            await editor.request.post(`${base}/api/users`, {
              data: {
                name: "Escalation",
                email: "escalation@example.invalid",
                password: editorPassword,
                role: "admin",
              },
            })
          ).status(),
          403,
        );
      } finally {
        await editor.close();
        assert.equal(
          (await page.request.delete(`${base}/api/users/${editorID}`)).status(),
          200,
        );
      }
      await page.request.post(`${base}/api/users/logout`);
      await page.goto(`${base}/admin`);
      await page.waitForURL(/\/admin\/login/);
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${base}/admin/login`);
    await page.screenshot({
      path: ".cache/admin-qa/login-mobile.png",
      fullPage: true,
    });
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
    );
    await page.getByRole("link", { name: "Forgot password?" }).click();
    await page
      .getByRole("heading", { name: "Need help signing in?" })
      .waitFor();
    console.log(
      identifier && process.env.TEST_ADMIN_PASSWORD
        ? "PASS footer entry, guest protection, closed registration, invalid login, authenticated access, role enforcement, logout and mobile layout"
        : "PASS guest protection, closed registration, invalid login and mobile layout; authenticated cycle skipped (credentials not supplied)",
    );
  } catch (error) {
    console.log((await page.locator("body").innerText()).slice(0, 1800));
    throw error;
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
