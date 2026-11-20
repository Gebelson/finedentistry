import assert from "node:assert/strict";
import { calendarExportHandler } from "../cms/calendar-export.ts";

const slot = {
  id: 23,
  doctor: "trivedi",
  status: "scheduled",
  startsAt: "2026-03-10T14:00:00.000Z",
  endsAt: "2026-03-10T15:00:00.000Z",
  contactName: "PRIVATE PATIENT",
  email: "private@example.com",
  phone: "555-555-1234",
  treatment: "PRIVATE TREATMENT",
  notes: "PRIVATE NOTES",
  contact: { name: "PRIVATE RELATIONSHIP" },
};
function request(month = "2026-03", role = "reception", pages = [[slot]]) {
  const calls = [];
  return {
    url: `http://localhost/api/calendar-export?month=${encodeURIComponent(month)}`,
    user: role ? { id: 1, role } : null,
    calls,
    payload: {
      secret: "deterministic-test-secret",
      find: async (args) => {
        calls.push(args);
        return {
          docs: pages[args.page - 1] || [],
          hasNextPage: args.page < pages.length,
        };
      },
    },
  };
}
// Nov 30 23:30–Dec 1 00:30 Orlando overlaps December despite starting in November.
// A slot ending exactly at December's start has no overlap and must be excluded.
const crossing = {
  ...slot,
  id: 301,
  startsAt: "2026-12-01T04:30:00.000Z",
  endsAt: "2026-12-01T05:30:00.000Z",
};
const touching = {
  ...slot,
  id: 302,
  startsAt: "2026-12-01T04:00:00.000Z",
  endsAt: "2026-12-01T05:00:00.000Z",
};
const overlapBody = await (
  await calendarExportHandler(
    request("2026-12", "reception", [[crossing, touching]]),
  )
).text();
assert.equal(overlapBody.match(/BEGIN:VEVENT/g)?.length, 1);
assert.match(overlapBody, /DTSTART:20261201T043000Z\r\nDTEND:20261201T053000Z/);
assert.ok(!overlapBody.includes("DTEND:20261201T050000Z"));
// Removing authorization must fail before the database is queried.
for (const [role, status] of [
  [null, 401],
  ["editor", 403],
]) {
  const req = request("2026-03", role);
  assert.equal((await calendarExportHandler(req)).status, status);
  assert.equal(req.calls.length, 0);
}
for (const month of [
  "",
  "2026-13",
  "2026-00",
  "26-03",
  "2026-03\r\nATTACH:x",
  "0000-01",
]) {
  const req = request(month);
  assert.equal((await calendarExportHandler(req)).status, 400);
  assert.equal(req.calls.length, 0);
}
for (const role of ["reception", "admin"]) {
  const req = request("2026-03", role, [
    [slot],
    [{ ...slot, id: 24, doctor: "perez" }],
  ]);
  const response = await calendarExportHandler(req);
  assert.equal(response.status, 200);
  assert.equal(
    response.headers.get("content-type"),
    "text/calendar; charset=utf-8",
  );
  assert.match(
    response.headers.get("content-disposition"),
    /attachment; filename="fine-dentistry-busy-2026-03\.ics"/,
  );
  assert.match(response.headers.get("cache-control"), /private, no-store/);
  assert.match(response.headers.get("vary"), /Cookie/);
  const body = await response.text();
  assert.equal(body.match(/BEGIN:VEVENT/g)?.length, 2);
  assert.match(body, /DTSTART:20260310T140000Z\r\nDTEND:20260310T150000Z/);
  assert.match(body, /SUMMARY:Busy - Dr\. Trivedi/);
  assert.match(body, /CLASS:PRIVATE/);
  assert.match(body, /TRANSP:OPAQUE/);
  assert.ok(body.endsWith("END:VCALENDAR\r\n"));
  assert.ok(!body.replaceAll("\r\n", "").includes("\n"));
  for (const line of body.split("\r\n"))
    assert.ok(Buffer.byteLength(line) <= 75);
  for (const privateValue of [
    "PRIVATE PATIENT",
    "PRIVATE TREATMENT",
    "PRIVATE NOTES",
    "PRIVATE RELATIONSHIP",
    "private@example.com",
    "555-555-1234",
    "contactName",
    "ATTENDEE",
    "DESCRIPTION",
    "LOCATION",
  ]) {
    assert.ok(!body.includes(privateValue), privateValue);
  }
  assert.equal(req.calls.length, 2);
  for (const args of req.calls) {
    assert.equal(args.req, req);
    assert.equal(args.overrideAccess, false);
    assert.equal(args.depth, 0);
    assert.deepEqual(Object.keys(args.select).sort(), [
      "doctor",
      "endsAt",
      "startsAt",
      "status",
    ]);
    assert.deepEqual(args.where, {
      and: [
        { status: { equals: "scheduled" } },
        {
          startsAt: {
            less_than: "2026-04-01T04:00:00.000Z",
          },
        },
        { endsAt: { greater_than: "2026-03-01T05:00:00.000Z" } },
      ],
    });
  }
  const again = await (await calendarExportHandler(request())).text();
  assert.equal(body.match(/UID:([^\r]+)/)[1], again.match(/UID:([^\r]+)/)[1]);
  assert.notEqual(body.match(/UID:([^\r]+)/)[1], "23");
}
// Defense in depth: malformed dates, injected doctor values, unrelated statuses and out-of-month rows never leave the handler.
const invalid = [
  { startsAt: "invalid" },
  { endsAt: "invalid" },
  { endsAt: slot.startsAt },
  { startsAt: "2026-02-30T14:00:00.000Z" },
  { endsAt: "2026-03-11T15:00:00.000Z" },
  { startsAt: "2026-04-01T04:00:00.000Z" },
  { status: "canceled" },
  { doctor: "trivedi\r\nATTACH:https://private.example" },
  { doctor: "PRIVATE PATIENT" },
].map((patch, index) => ({ ...slot, id: 100 + index, ...patch }));
const filtered = await (
  await calendarExportHandler(request("2026-03", "admin", [[slot, ...invalid]]))
).text();
assert.equal(filtered.match(/BEGIN:VEVENT/g)?.length, 1);
assert.ok(!filtered.includes("ATTACH"));
const november = request("2026-11");
await calendarExportHandler(november);
assert.deepEqual(november.calls[0].where.and[1], {
  startsAt: {
    less_than: "2026-12-01T05:00:00.000Z",
  },
});
assert.deepEqual(november.calls[0].where.and[2], {
  endsAt: { greater_than: "2026-11-01T04:00:00.000Z" },
});
const overflow = request();
overflow.payload.find = async (args) => {
  overflow.calls.push(args);
  return { docs: [slot], hasNextPage: true };
};
assert.equal((await calendarExportHandler(overflow)).status, 503);
assert.ok(overflow.calls.length <= 25);
const outage = request();
outage.payload.find = async () => {
  throw Error("PRIVATE DATABASE DETAILS");
};
const failed = await calendarExportHandler(outage);
assert.equal(failed.status, 503);
assert.ok(!(await failed.text()).includes("PRIVATE DATABASE DETAILS"));
console.log(
  "Calendar export: authorization, private ICS, opaque stable IDs, DST month bounds, pagination, safe failures and patient-data exclusion passed.",
);

// Exercise the real component: selecting another month changes the downloaded file,
// failed HTTP responses show an error and never trigger a fake download.
const { createRequire } = await import("node:module");
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const { mount } = require("./component-fixture.cjs");
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const page = await browser.newPage({ acceptDownloads: true });
  page.setDefaultTimeout(5000);
  await page.route("**/api/appointments?*", (route) =>
    route.fulfill({ json: { docs: [], hasNextPage: false } }),
  );
  let failedDownload = false;
  let selectedMonth;
  let releaseDownload;
  await page.route("**/api/calendar-export?*", async (route) => {
    selectedMonth = new URL(route.request().url()).searchParams.get("month");
    if (!failedDownload)
      await new Promise((resolve) => {
        releaseDownload = resolve;
      });
    await route.fulfill(
      failedDownload
        ? { status: 503, json: { error: "Unavailable" } }
        : {
            contentType: "text/calendar; charset=utf-8",
            body: "BEGIN:VCALENDAR\r\nEND:VCALENDAR\r\n",
          },
    );
  });
  await mount(page, "components/admin/clinic-calendar.tsx", "ClinicCalendar");
  await page.getByRole("button", { name: "Next month", exact: true }).click();
  const monthHeading = await page
    .locator(".clinic-calendar-nav h2")
    .innerText();
  const downloadEvent = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Download calendar", exact: true })
    .click();
  assert.equal(
    await page
      .getByRole("button", { name: "Downloading…", exact: true })
      .isDisabled(),
    true,
  );
  releaseDownload();
  const download = await downloadEvent;
  assert.equal(
    download.suggestedFilename(),
    `fine-dentistry-busy-${selectedMonth}.ics`,
  );
  const [year, month] = selectedMonth.split("-").map(Number);
  assert.equal(
    monthHeading,
    new Date(year, month - 1, 1).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    }),
  );
  failedDownload = true;
  let unexpectedDownload = false;
  page.on("download", () => {
    unexpectedDownload = true;
  });
  await page
    .getByRole("button", { name: "Download calendar", exact: true })
    .click();
  await page
    .getByRole("alert")
    .filter({ hasText: "Unable to download" })
    .waitFor();
  assert.equal(unexpectedDownload, false);
  assert.equal(
    await page
      .getByRole("button", { name: "Download calendar", exact: true })
      .isEnabled(),
    true,
  );
  console.log(
    "Calendar download UI: selected month, real .ics download and honest HTTP error recovery passed.",
  );
} finally {
  await browser.close();
}
