const assert = require("node:assert/strict");
const { chromium } = require("playwright");
const base = process.env.TEST_URL || "http://localhost:3000";
(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  try {
    const context = await browser.newContext({
      extraHTTPHeaders: { Origin: base },
    });
    const response = await context.request.post(base + "/api/users/login", {
      data: {
        username: process.env.TEST_ADMIN_USERNAME,
        password: process.env.TEST_ADMIN_PASSWORD,
      },
    });
    assert.equal(response.status(), 200);
    const session = await response.json();
    const issuedAt = JSON.parse(
      Buffer.from(session.token.split(".")[1], "base64url").toString(),
    ).iat;
    assert.equal(
      session.exp - issuedAt,
      12 * 60 * 60,
      "Login should last a full workday",
    );
    const cookie = (await context.cookies()).find(
      (item) => item.name === "payload-token",
    );
    assert.ok(cookie.httpOnly);
    assert.equal(cookie.sameSite, "Lax");
    if (base.startsWith("https:")) assert.ok(cookie.secure);
    assert.ok(cookie.expires * 1000 > Date.now() + 11.9 * 60 * 60 * 1000);
    const page = await context.newPage();
    await page.goto(base + "/admin");
    await page
      .getByRole("heading", { name: "Dashboard", exact: true })
      .waitFor();
    await page.waitForTimeout(1100);
    const refreshed = await context.request.post(
      base + "/api/users/refresh-token",
    );
    assert.equal(refreshed.status(), 200);
    const renewal = await refreshed.json();
    assert.ok(renewal.exp > session.exp, "Refresh must extend the session");
    await page.reload();
    await page
      .getByRole("heading", { name: "Dashboard", exact: true })
      .waitFor();
    assert.equal(
      (await context.request.post(base + "/api/users/logout")).status(),
      200,
    );
    assert.ok(
      (
        await context.request.post(base + "/api/users/refresh-token")
      ).status() >= 400,
    );
    await page.goto(base + "/admin");
    await page.waitForURL("**/admin/login");
    console.log(
      "PASS 12-hour session, persistent protected cookie, session renewal and explicit logout.",
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
