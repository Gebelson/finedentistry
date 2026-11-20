const assert = require("node:assert/strict");
const { chromium } = require("playwright");
const base = process.env.TEST_URL || "http://localhost:3000";
(async () => {
  const b = await chromium.launch({ channel: "chrome", headless: true });
  let id;
  const c = await b.newContext({ extraHTTPHeaders: { Origin: base } });
  try {
    const guest = await b.newContext();
    try {
      assert.equal(
        (await guest.request.get(base + "/api/workspace-reports")).status(),
        403,
      );
      assert.equal(
        (
          await guest.request.get(base + "/api/workspace-reports?format=csv")
        ).status(),
        403,
      );
    } finally {
      await guest.close();
    }
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
    const created = await c.request.post(base + "/api/contacts", {
      data: {
        name: "Temporary report verification",
        source: "website",
        email: "report-audit@example.invalid",
      },
    });
    assert.equal(created.status(), 201);
    id = (await created.json()).doc.id;
    for (const period of ["7", "30", "90", "all"]) {
      const response = await c.request.get(
        base + "/api/workspace-reports?period=" + period,
      );
      assert.equal(response.status(), 200);
      assert.match(response.headers()["cache-control"], /no-store/);
      const report = await response.json();
      assert.equal(report.period, period);
      assert.equal(report.rows.length, 15);
      assert.ok(
        report.rows.find((r) => r.label === "Contacts created").count >= 1,
      );
      if (period === "all") {
        const contacts = await (
          await c.request.get(base + "/api/contacts?limit=1")
        ).json();
        assert.equal(
          report.rows.find((r) => r.label === "Contacts created").count,
          contacts.totalDocs,
        );
      }
    }
    assert.equal(
      (
        await c.request.get(base + "/api/workspace-reports?period=200")
      ).status(),
      400,
    );
    const csv = await c.request.get(
      base + "/api/workspace-reports?period=7&format=csv",
    );
    assert.equal(csv.status(), 200);
    assert.match(csv.headers()["content-type"], /text\/csv/);
    assert.equal(
      (await csv.text()).includes("report-audit@example.invalid"),
      false,
    );
    const p = await c.newPage();
    await p.goto(base + "/admin/reports");
    await p.getByRole("region", { name: "Report results" }).waitFor();
    const [changed] = await Promise.all([
      p.waitForResponse((r) =>
        r.url().includes("/api/workspace-reports?period=90"),
      ),
      p.getByLabel("Reporting period", { exact: true }).selectOption("90"),
    ]);
    assert.equal(changed.status(), 200);
    await p
      .getByRole("button", { name: "Download aggregate CSV", exact: true })
      .waitFor();
    await p.waitForFunction(
      () =>
        !document.querySelector(".workspace-report-toolbar button").disabled,
    );
    const downloaded = p.waitForEvent("download");
    await p
      .getByRole("button", { name: "Download aggregate CSV", exact: true })
      .click();
    const file = await downloaded;
    assert.equal(file.suggestedFilename(), "workspace-report-90.csv");
    assert.equal(await file.failure(), null);
    await p.setViewportSize({ width: 390, height: 844 });
    assert.equal(
      await p.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    );
    console.log(
      "PASS real reports authentication, period counts against stored records, aggregate-only CSV, browser download, filters and mobile layout.",
    );
  } finally {
    if (id)
      assert.equal(
        (await c.request.delete(base + "/api/contacts/" + id)).status(),
        200,
      );
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
