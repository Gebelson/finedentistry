const assert = require("node:assert/strict");
const { chromium } = require("playwright");
const AxeBuilder = require("@axe-core/playwright").default;
const base = process.env.TEST_URL || "http://localhost:3000";
(async () => {
  const b = await chromium.launch({ channel: "chrome", headless: true });
  const c = await b.newContext({
    viewport: { width: 1440, height: 1000 },
    hasTouch: true,
    reducedMotion: "reduce",
  });
  try {
    assert.equal(
      (
        await c.request.post(base + "/api/users/login", {
          headers: { Origin: base },
          data: {
            username: process.env.TEST_ADMIN_USERNAME,
            password: process.env.TEST_ADMIN_PASSWORD,
          },
        })
      ).status(),
      200,
    );
    const p = await c.newPage();
    const errors = [];
    p.on("pageerror", (e) => errors.push(e.message));
    for (const [path, title, content] of [
      ["/admin", "Dashboard", "A clear view of your practice"],
      ["/admin/calendar", "Appointments", "not synchronized"],
      [
        "/admin/reports",
        "Workspace reports",
        "Status counts show their current status",
      ],
      [
        "/admin/analytics",
        "Website analytics",
        "Visitor-days add daily estimates",
      ],
      [
        "/admin/integrations",
        "Connections",
        "Credentials alone do not activate",
      ],
    ]) {
      await p.goto(base + path);
      await p.getByRole("heading", { name: title, exact: true }).waitFor();
      const button = p.getByRole("button", {
        name: "About " + title,
        exact: true,
      });
      await button.hover();
      await p.getByRole("tooltip").waitFor();
      assert.ok((await p.getByRole("tooltip").innerText()).includes(content));
      await p.getByRole("tooltip").hover();
      await p.waitForTimeout(220);
      assert.equal(await p.getByRole("tooltip").isVisible(), true);
      const axe = await new AxeBuilder({ page: p })
        .include(".workspace-info-tip-panel")
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      assert.deepEqual(
        axe.violations.map((v) => v.id),
        [],
      );
      await p.keyboard.press("Escape");
      await p.getByRole("tooltip").waitFor({ state: "detached" });
      await p.setViewportSize({ width: 320, height: 844 });
      await button.tap();
      await p.getByRole("tooltip").waitFor();
      const box = await p.getByRole("tooltip").boundingBox();
      assert.ok(
        box.x >= 0 &&
          box.x + box.width <= 320 &&
          box.y >= 0 &&
          box.y + box.height <= 844,
      );
      assert.ok((await button.boundingBox()).height >= 44);
      assert.equal(
        await p.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
      );
      await p.getByRole("heading", { name: title, exact: true }).tap();
      await p.getByRole("tooltip").waitFor({ state: "detached" });
      await p.setViewportSize({ width: 1440, height: 1000 });
    }
    await p.getByRole("region", { name: "Connection results" }).waitFor();
    assert.equal(
      await p
        .locator(
          ".connection-next,.connections-explanation,.connections-footnote",
        )
        .count(),
      0,
    );
    const ai = p.getByRole("button", {
      name: "About Generative AI",
      exact: true,
    });
    await ai.focus();
    await p.getByRole("tooltip").waitFor();
    const checks = await (
      await c.request.get(base + "/api/workspace-connections", {
        headers: { Origin: base },
      })
    ).json();
    const detail = checks.connections.find((item) => item.id === "ai").detail;
    assert.ok((await p.getByRole("tooltip").innerText()).includes(detail));
    await p.keyboard.press("Escape");
    await p.getByRole("tooltip").waitFor({ state: "detached" });
    assert.deepEqual(errors, []);
    console.log(
      "PASS actual admin help placement, preserved heading names, hover/focus/Escape/tap dismissal, mobile geometry, visible statuses/actions and scoped tooltip accessibility on five pages.",
    );
  } finally {
    await c.request
      .post(base + "/api/users/logout", { headers: { Origin: base } })
      .catch(() => {});
    await b.close();
  }
})().catch((e) => {
  console.error(e.stack || e.message);
  process.exitCode = 1;
});
