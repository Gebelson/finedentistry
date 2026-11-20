const assert = require("node:assert/strict");
const { chromium } = require("playwright");
const base = process.env.TEST_URL || "http://localhost:3000";
(async () => {
  const b = await chromium.launch({ channel: "chrome", headless: true });
  const c = await b.newContext({
    viewport: { width: 1440, height: 1000 },
    extraHTTPHeaders: { Origin: base },
  });
  const visitor = await b.newContext({ extraHTTPHeaders: { Origin: base } });
  let original;
  const ids = [];
  try {
    assert.equal(
      (
        await c.request.post(base + "/api/users/login", {
          data: {
            username: process.env.TEST_ADMIN_USERNAME,
            password: process.env.TEST_ADMIN_PASSWORD,
          },
        })
      ).status(),
      200,
    );
    original = await (
      await c.request.get(base + "/api/globals/chat-settings")
    ).json();
    await c.request.post(base + "/api/globals/chat-settings", {
      data: { enabled: true, mode: "hybrid" },
    });
    const refs = [];
    for (let i = 0; i < 3; i++) {
      const started = await visitor.request.post(base + "/api/clinic-chat", {
        data: { action: "start" },
      });
      assert.equal(started.status(), 201);
      const s = await started.json();
      ids.push(s.id);
      if (i > 0)
        assert.equal(
          (
            await visitor.request.post(base + "/api/clinic-chat", {
              headers: { "x-conversation-token": s.token },
              data: { action: "handoff", id: s.id },
            })
          ).status(),
          200,
        );
      const doc = await (
        await c.request.get(base + "/api/conversations/" + s.id)
      ).json();
      refs.push(doc.reference);
    }
    const p = await c.newPage();
    await p.goto(base + "/admin");
    const links = await p
      .locator(".ops-work-grid .ops-panel")
      .first()
      .locator("tbody tr td:first-child a")
      .allTextContents();
    assert.ok(links.indexOf(refs[1]) < links.indexOf(refs[0]));
    assert.ok(links.indexOf(refs[1]) < links.indexOf(refs[2]));
    await p.getByRole("link", { name: /^Waiting \d/ }).click();
    await p.waitForURL("**/admin/collections/conversations?*");
    await p.getByRole("link", { name: refs[1], exact: true }).waitFor();
    assert.equal(
      await p.getByRole("link", { name: refs[0], exact: true }).count(),
      0,
    );
    await p.goto(base + "/admin");
    await p.getByRole("link", { name: /^Open \d/ }).click();
    await p.waitForURL("**/admin/collections/conversations?*");
    await p.getByRole("link", { name: refs[0], exact: true }).waitFor();
    assert.equal(
      await p.getByRole("link", { name: refs[1], exact: true }).count(),
      0,
    );
    console.log(
      "PASS reception prioritizes oldest waiting activity and native Waiting/Open filters show the correct saved conversations.",
    );
  } finally {
    for (const id of ids)
      assert.equal(
        (await c.request.delete(base + "/api/conversations/" + id)).status(),
        200,
      );
    if (original)
      assert.equal(
        (
          await c.request.post(base + "/api/globals/chat-settings", {
            data: original,
          })
        ).status(),
        200,
      );
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
