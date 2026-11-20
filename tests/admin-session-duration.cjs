const assert = require("node:assert/strict");
const { chromium } = require("playwright");
const base = process.env.TEST_URL || "http://localhost:3000";
(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  try {
    const context = await browser.newContext({
      extraHTTPHeaders: { Origin: base },
    });
    const login = await context.request.post(base + "/api/users/login", {
      data: {
        username: process.env.TEST_ADMIN_USERNAME,
        password: process.env.TEST_ADMIN_PASSWORD,
      },
    });
    assert.equal(login.status(), 200);
    const session = await login.json();
    const claims = JSON.parse(
      Buffer.from(session.token.split(".")[1], "base64url").toString(),
    );
    assert.equal(
      claims.exp,
      undefined,
      "Persistent login must not contain an expiry claim",
    );
    assert.equal(session.exp, undefined);
    const cookie = (await context.cookies()).find(
      (item) => item.name === "payload-token",
    );
    assert.ok(cookie.httpOnly);
    assert.equal(cookie.sameSite, "Lax");
    if (base.startsWith("https:")) assert.ok(cookie.secure);
    assert.ok(cookie.expires * 1000 > Date.now() + 390 * 86400000);
    const page = await context.newPage();
    await page.goto(base + "/admin");
    await page
      .getByRole("heading", { name: "Dashboard", exact: true })
      .waitFor();
    const me = await context.request.get(base + "/api/users/me");
    assert.equal(me.status(), 200);
    assert.match(me.headers()["set-cookie"], /Max-Age=34560000/);
    assert.equal((await me.json()).exp, undefined);
    const snapshot = await context.storageState();
    const reopened = await browser.newContext({
      storageState: snapshot,
      extraHTTPHeaders: { Origin: base },
    });
    try {
      assert.equal(
        (await reopened.request.get(base + "/api/health")).status(),
        200,
      );
    } finally {
      await reopened.close();
    }
    const refreshed = await context.request.post(
      base + "/api/users/refresh-token",
    );
    assert.equal(refreshed.status(), 200);
    const renewed = await refreshed.json();
    assert.equal(renewed.exp, undefined);
    assert.equal(
      JSON.parse(
        Buffer.from(
          renewed.refreshedToken.split(".")[1],
          "base64url",
        ).toString(),
      ).exp,
      undefined,
    );
    const bearer = renewed.refreshedToken;
    assert.equal(
      (await context.request.post(base + "/api/users/logout")).status(),
      200,
    );
    assert.ok(
      (
        await context.request.post(base + "/api/users/refresh-token")
      ).status() >= 400,
    );
    const replay = await browser.newContext({
      extraHTTPHeaders: { Authorization: "JWT " + bearer },
    });
    try {
      assert.equal(
        (await replay.request.get(base + "/api/health")).status(),
        401,
        "Signed tokens must stop working once their server session is revoked",
      );
    } finally {
      await replay.close();
    }
    await page.goto(base + "/admin");
    await page.waitForURL("**/admin/login");
    console.log(
      "PASS non-expiring signed login, rolling protected cookie, browser-session restore, renewal, logout and revoked-token replay rejection.",
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
