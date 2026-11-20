const assert = require("node:assert/strict");
const { randomBytes } = require("node:crypto");
const { chromium } = require("playwright");
const base = process.env.TEST_URL || "http://localhost:3000";
(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const staff = await browser.newContext({
    extraHTTPHeaders: { Origin: base },
  });
  const visitor = await browser.newContext({
    extraHTTPHeaders: { Origin: base },
  });
  const conversations = [],
    users = [];
  let settings;
  try {
    assert.equal(
      (
        await staff.request.post(base + "/api/users/login", {
          data: {
            username: process.env.TEST_ADMIN_USERNAME,
            password: process.env.TEST_ADMIN_PASSWORD,
          },
        })
      ).status(),
      200,
    );
    const page = await staff.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    for (const [path, heading] of [
      ["/admin/reports", "Workspace reports"],
      ["/admin/integrations", "Connections"],
      ["/admin/collections/media", "Media"],
      ["/admin/collections/users", "Team members"],
      ["/admin/collections/contacts", "Contacts"],
      ["/admin/collections/appointments", "Appointments"],
      ["/admin/globals/home-page", "Dev Mode · Homepage"],
      ["/admin/globals/chat-settings", "Chat & assistant settings"],
    ]) {
      const response = await page.goto(base + path);
      assert.equal(response.status(), 200, path);
      await page.getByRole("heading", { name: heading, exact: true }).waitFor();
      assert.equal(await page.locator(".template-default").count(), 1, path);
    }
    const media = await (
      await staff.request.get(base + "/api/media?limit=100")
    ).json();
    assert.ok(media.docs.length > 0);
    for (const item of media.docs) {
      const response = await visitor.request.get(new URL(item.url, base).href);
      assert.equal(
        response.status(),
        200,
        "Stored website image must be retrievable",
      );
      assert.match(response.headers()["content-type"], /^image\//);
    }
    settings = await (
      await staff.request.get(base + "/api/globals/chat-settings")
    ).json();
    for (const mode of ["reception", "assistant", "hybrid"]) {
      assert.equal(
        (
          await staff.request.post(base + "/api/globals/chat-settings", {
            data: { enabled: true, mode },
          })
        ).status(),
        200,
      );
      const publicSettings = await (
        await visitor.request.get(base + "/api/clinic-chat")
      ).json();
      assert.equal(publicSettings.mode, mode);
      const response = await visitor.request.post(base + "/api/clinic-chat", {
        data: { action: "start" },
      });
      assert.equal(response.status(), 201);
      const session = await response.json();
      conversations.push(session.id);
      const headers = { "x-conversation-token": session.token };
      assert.equal(
        (
          await visitor.request.post(base + "/api/clinic-chat", {
            headers,
            data: {
              action: "message",
              id: session.id,
              text: "How do dental implants work?",
            },
          })
        ).status(),
        200,
      );
      const result = await (
        await visitor.request.get(
          base + "/api/clinic-chat?conversation=" + session.id,
          { headers },
        )
      ).json();
      assert.equal(
        result.controller,
        mode === "reception" ? "reception" : "assistant",
      );
      assert.equal(
        result.messages.filter((message) => message.sender === "assistant")
          .length,
        mode === "reception" ? 1 : 2,
      );
    }
    await staff.request.post(base + "/api/globals/chat-settings", {
      data: { enabled: false },
    });
    assert.equal(
      (
        await visitor.request.post(base + "/api/clinic-chat", {
          data: { action: "start" },
        })
      ).status(),
      503,
    );
    for (const role of ["editor", "reception"]) {
      const password = randomBytes(24).toString("hex");
      const email = `audit-${role}-${Date.now()}@example.invalid`;
      const created = await staff.request.post(base + "/api/users", {
        data: { name: "Temporary audit account", email, password, role },
      });
      assert.equal(created.status(), 201);
      const user = (await created.json()).doc;
      users.push(user.id);
      const limited = await browser.newContext({
        extraHTTPHeaders: { Origin: base },
      });
      try {
        assert.equal(
          (
            await limited.request.post(base + "/api/users/login", {
              data: { email, password },
            })
          ).status(),
          200,
        );
        for (const [path, allowed] of [
          ["/api/posts?limit=1", role === "editor"],
          ["/api/contacts?limit=1", role === "reception"],
          ["/api/appointments?limit=1", role === "reception"],
          ["/api/conversations?limit=1", role === "reception"],
          ["/api/site-analytics", false],
          ["/api/globals/home-page", role === "editor"],
        ])
          assert.equal(
            (await limited.request.get(base + path)).status(),
            allowed ? 200 : 403,
            role + " " + path,
          );
        assert.equal(
          (
            await limited.request.post(base + "/api/globals/chat-settings", {
              data: { enabled: false },
            })
          ).status(),
          403,
        );
        assert.equal(
          (
            await limited.request.delete(base + "/api/users/" + user.id)
          ).status(),
          403,
        );
        const own = await (
          await limited.request.get(base + "/api/users?limit=100")
        ).json();
        assert.deepEqual(
          own.docs.map((item) => item.id),
          [user.id],
        );
        const restricted = await limited.newPage();
        for (const path of [
          "/admin/analytics",
          "/admin/reports",
          "/admin/integrations",
        ]) {
          await restricted.goto(base + path);
          assert.equal(new URL(restricted.url()).pathname, "/admin");
        }
      } finally {
        await limited.close();
      }
    }
    assert.deepEqual(errors, []);
    console.log(
      "PASS all remaining menu screens; persistent media delivery; three chat modes and disabled state; editor/reception API matrix; private reports/analytics; own-account visibility and prohibited mutations.",
    );
  } finally {
    for (const id of conversations)
      assert.equal(
        (
          await staff.request.delete(base + "/api/conversations/" + id)
        ).status(),
        200,
      );
    for (const id of users)
      assert.equal(
        (await staff.request.delete(base + "/api/users/" + id)).status(),
        200,
      );
    if (settings)
      assert.equal(
        (
          await staff.request.post(base + "/api/globals/chat-settings", {
            data: settings,
          })
        ).status(),
        200,
      );
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
