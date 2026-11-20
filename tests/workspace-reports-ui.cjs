const assert = require("node:assert/strict");
const { chromium } = require("playwright");
const { mount } = require("./component-fixture.cjs");

(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  try {
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
    });
    let fail = true;
    let failExport = true;
    const periods = [];
    await page.route("**/api/workspace-reports?*", async (route) => {
      const query = new URL(route.request().url()).searchParams;
      if (query.get("format") === "csv")
        return route.fulfill({
          status: failExport ? 503 : 200,
          contentType: "text/csv",
          body: '"Metric","Count"\r\n"Contacts created","2"',
        });
      periods.push(query.get("period"));
      await new Promise((resolve) => setTimeout(resolve, 80));
      if (fail)
        return route.fulfill({ status: 503, json: { error: "Unavailable" } });
      return route.fulfill({
        json: {
          period: query.get("period"),
          start: null,
          end: "2026-11-20T16:00:00Z",
          rows: [
            {
              label: "Contacts created",
              count: 2,
              group: "Reception contacts",
            },
          ],
        },
      });
    });
    await mount(
      page,
      "components/admin/workspace-reports.tsx",
      "WorkspaceReports",
    );
    await page.getByRole("button", { name: "Retry reports" }).waitFor();
    assert.equal(
      await page
        .getByRole("button", { name: "Download aggregate CSV" })
        .isDisabled(),
      true,
    );
    fail = false;
    await page.getByRole("button", { name: "Retry reports" }).click();
    await page.getByText("Contacts created", { exact: true }).waitFor();
    await page.getByLabel("Reporting period").selectOption("7");
    await page
      .getByRole("status")
      .filter({ hasText: "Loading workspace reports" })
      .waitFor();
    await page.getByText("Contacts created", { exact: true }).waitFor();
    assert.equal(periods.at(-1), "7");
    await page.getByRole("button", { name: "Download aggregate CSV" }).click();
    await page
      .getByRole("alert")
      .filter({ hasText: "Unable to download" })
      .waitFor();
    failExport = false;
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download aggregate CSV" }).click();
    const download = await downloadPromise;
    assert.equal(download.suggestedFilename(), "workspace-report-7.csv");
    await page.getByLabel("Reporting period").selectOption("all");
    await page.getByText("Contacts created", { exact: true }).waitFor();
    assert.equal(periods.at(-1), "all");
    console.log(
      "Workspace reports UI: outage retry, period loading/recovery, CSV error recovery and download passed.",
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
