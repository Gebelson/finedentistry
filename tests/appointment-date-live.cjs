const assert = require("node:assert/strict");
const { chromium } = require("playwright");
const base = process.env.TEST_URL || "http://localhost:3000";
(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  try {
    for (const timezoneId of ["Asia/Tokyo", "America/Sao_Paulo"]) {
      const context = await browser.newContext({
        timezoneId,
        extraHTTPHeaders: { Origin: new URL(base).origin },
      });
      let id;
      try {
        assert.equal(
          (
            await context.request.post(`${base}/api/users/login`, {
              data: {
                username: process.env.TEST_ADMIN_USERNAME,
                password: process.env.TEST_ADMIN_PASSWORD,
              },
            })
          ).status(),
          200,
        );
        const created = await context.request.post(`${base}/api/appointments`, {
          data: {
            contactName: "Orlando timezone verification",
            status: "requested",
            startsAt: "2026-11-20T14:00:00.000Z",
            endsAt: "2026-11-20T15:00:00.000Z",
          },
        });
        assert.equal(created.status(), 201);
        id = (await created.json()).doc.id;
        const page = await context.newPage();
        const endpoint = `${base}/api/appointments/${id}`;
        await page.goto(`${base}/admin/collections/appointments/${id}`);
        const start = page.locator('input[name="startsAt"]');
        const end = page.locator('input[name="endsAt"]');
        await start.waitFor();
        assert.equal(await start.inputValue(), "2026-11-20T09:00");
        assert.equal(await end.inputValue(), "2026-11-20T10:00");
        const save = async () => {
          const response = page.waitForResponse(
            (r) =>
              r.url().split("?")[0] === endpoint &&
              r.request().method() === "PATCH",
          );
          await page.locator("#action-save").click();
          assert.equal((await response).status(), 200);
        };
        await start.fill("2026-12-01T09:00");
        await end.fill("2026-12-01T10:00");
        await save();
        let stored = await (await context.request.get(endpoint)).json();
        assert.equal(
          new Date(stored.startsAt).toISOString(),
          "2026-12-01T14:00:00.000Z",
        );
        assert.equal(
          new Date(stored.endsAt).toISOString(),
          "2026-12-01T15:00:00.000Z",
        );
        await start.fill("2026-07-01T09:00");
        await end.fill("2026-07-01T10:00");
        await save();
        stored = await (await context.request.get(endpoint)).json();
        assert.equal(
          new Date(stored.startsAt).toISOString(),
          "2026-07-01T13:00:00.000Z",
        );
        assert.equal(
          new Date(stored.endsAt).toISOString(),
          "2026-07-01T14:00:00.000Z",
        );
        await start.fill("2026-03-08T02:30");
        await page
          .getByRole("alert")
          .filter({ hasText: /does not exist/ })
          .first()
          .waitFor();
        // Payload's integrated Save can reach server validation. A rejected
        // PATCH is safe; verify the response and the persisted UTC values.
        const invalidSave = page.waitForResponse(
          (response) =>
            response.url().split("?")[0] === endpoint &&
            response.request().method() === "PATCH",
        );
        await page.locator("#action-save").click();
        assert.equal(
          (await invalidSave).status(),
          400,
          "Payload must reject saving a nonexistent Orlando time",
        );
        stored = await (await context.request.get(endpoint)).json();
        assert.equal(
          new Date(stored.startsAt).toISOString(),
          "2026-07-01T13:00:00.000Z",
        );
        assert.equal(
          new Date(stored.endsAt).toISOString(),
          "2026-07-01T14:00:00.000Z",
        );
      } finally {
        if (id) await context.request.delete(`${base}/api/appointments/${id}`);
        await context.close();
      }
    }
    console.log(
      "PASS live appointment forms save winter/summer UTC correctly from Tokyo/Sao Paulo; invalid Orlando DST time cannot save. Verification records removed.",
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
