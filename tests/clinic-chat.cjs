const assert = require("node:assert/strict");
const { chromium } = require("playwright");
const base = process.env.TEST_URL || "http://127.0.0.1:3010";
(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const staff = await browser.newContext({
    extraHTTPHeaders: { Origin: base },
  });
  const visitor = await browser.newContext({
    extraHTTPHeaders: { Origin: base },
  });
  let original;
  const ids = [];
  const post = (ctx, data, token) =>
    ctx.request.post(`${base}/api/clinic-chat`, {
      data,
      headers: token ? { "x-conversation-token": token } : undefined,
    });
  try {
    assert.equal(
      (
        await staff.request.post(`${base}/api/users/login`, {
          data: {
            username: process.env.TEST_ADMIN_USERNAME,
            password: process.env.TEST_ADMIN_PASSWORD,
          },
        })
      ).status(),
      200,
    );
    original = await (
      await staff.request.get(`${base}/api/globals/chat-settings`)
    ).json();
    assert.equal(
      (
        await staff.request.post(`${base}/api/globals/chat-settings`, {
          data: {
            enabled: true,
            mode: "hybrid",
            welcome: "Welcome to the practice.",
          },
        })
      ).status(),
      200,
    );
    const start = await post(visitor, { action: "start" });
    assert.equal(start.status(), 201, await start.text());
    const session = await start.json();
    ids.push(session.id);
    const endpoint = `${base}/api/clinic-chat?conversation=${session.id}`;
    assert.equal((await visitor.request.get(endpoint)).status(), 403);
    assert.equal(
      (await visitor.request.get(`${base}/api/conversations`)).status(),
      403,
    );
    assert.equal(
      (await visitor.request.get(`${base}/api/messages`)).status(),
      403,
    );
    assert.equal(
      (
        await post(
          visitor,
          {
            action: "message",
            id: session.id,
            text: "How do dental implants work?",
          },
          session.token,
        )
      ).status(),
      200,
    );
    const first = await (
      await visitor.request.get(endpoint, {
        headers: { "x-conversation-token": session.token },
      })
    ).json();
    assert.ok(
      first.messages.some(
        (m) =>
          m.sender === "assistant" && m.text !== "Welcome to the practice.",
      ),
    );
    assert.equal(
      (
        await post(
          visitor,
          { action: "takeover", id: session.id },
          session.token,
        )
      ).status(),
      403,
    );
    assert.equal(
      (
        await post(
          visitor,
          { action: "handoff", id: session.id },
          session.token,
        )
      ).status(),
      200,
    );
    const handed = await (await staff.request.get(endpoint)).json();
    assert.equal(handed.controller, "reception");
    assert.equal(handed.status, "waiting");
    const page = await staff.newPage();
    await page.goto(`${base}/admin/collections/conversations/${session.id}`);
    await page
      .getByLabel("Reply from reception", { exact: true })
      .fill("Reception verification reply.");
    const replySaved = page.waitForResponse(response => response.url().endsWith('/api/clinic-chat') && response.request().method() === 'POST');
    await page.getByRole("button", { name: "Send reply", exact: true }).click();
    assert.equal((await replySaved).status(), 200);
    await page
      .locator('.clinic-inbox-messages .clinic-message-reception')
      .getByText("Reception verification reply.", { exact: true })
      .waitFor();
    const response = await (
      await visitor.request.get(endpoint, {
        headers: { "x-conversation-token": session.token },
      })
    ).json();
    assert.ok(
      response.messages.some(
        (m) =>
          m.sender === "reception" &&
          m.text === "Reception verification reply.",
      ),
    );
    const assistantCount = response.messages.filter(
      (m) => m.sender === "assistant",
    ).length;
    await post(
      visitor,
      { action: "message", id: session.id, text: "What about appointments?" },
      session.token,
    );
    const after = await (
      await visitor.request.get(endpoint, {
        headers: { "x-conversation-token": session.token },
      })
    ).json();
    assert.equal(
      after.messages.filter((m) => m.sender === "assistant").length,
      assistantCount,
    );
    assert.equal(
      (await post(staff, { action: "resolve", id: session.id })).status(),
      200,
    );
    assert.equal(
      (await (await staff.request.get(endpoint)).json()).status,
      "resolved",
    );
    const publicPage = await visitor.newPage();
    await publicPage.setViewportSize({ width: 390, height: 844 });
    await publicPage.goto(base);
    await publicPage
      .getByRole("button", { name: "Let’s talk", exact: false })
      .click();
    await publicPage
      .getByLabel("Your message", { exact: true })
      .fill("Website widget verification.");
    const created = publicPage.waitForResponse(
      (r) =>
        r.url().endsWith("/api/clinic-chat") &&
        r.request().method() === "POST" &&
        r.status() === 201,
    );
    await publicPage.getByRole("button", { name: "Send", exact: true }).click();
    ids.push((await (await created).json()).id);
    await publicPage
      .locator(".chat-bubble-visitor")
      .filter({ hasText: "Website widget verification." })
      .waitFor();
    assert.equal(
      await publicPage.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
    );
    console.log(
      "PASS private visitor tokens; staff-only transcript access; FAQ response; handoff; reception UI reply; assistant stops after takeover; resolve; mobile widget sends real message.",
    );
  } finally {
    if (original)
      await staff.request.post(`${base}/api/globals/chat-settings`, {
        data: original,
      });
    for (const id of ids)
      await staff.request.delete(`${base}/api/conversations/${id}`);
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
