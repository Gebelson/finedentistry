import assert from "node:assert/strict";
import {
  reportBounds,
  workspaceReportsHandler,
} from "../cms/reports-endpoint.ts";

let calls = [];
const request = (query = "", role = "admin", fail = false) => ({
  url: `http://localhost/api/workspace-reports${query}`,
  user: role ? { id: 1, role } : null,
  payload: {
    count: async (args) => {
      calls.push(args);
      if (fail) throw Error("private backend details");
      return { totalDocs: 3 };
    },
  },
});
for (const role of [null, "editor", "reception"]) {
  calls = [];
  assert.equal((await workspaceReportsHandler(request("", role))).status, 403);
  assert.equal(calls.length, 0);
}
assert.equal(
  (await workspaceReportsHandler(request("?period=999"))).status,
  400,
);
assert.equal(
  (await workspaceReportsHandler(request("?format=json"))).status,
  400,
);
// Calendar days across the spring DST transition use Orlando midnight, not a fixed 24h subtraction.
assert.equal(
  reportBounds("7", new Date("2026-03-10T16:00:00Z")).start,
  "2026-03-04T05:00:00.000Z",
);
assert.equal(
  reportBounds("7", new Date("2026-11-04T16:00:00Z")).start,
  "2026-10-29T04:00:00.000Z",
);
assert.equal(reportBounds("all").start, null);
for (const period of ["7", "30", "90", "all"]) {
  calls = [];
  const req = request(`?period=${period}`);
  const response = await workspaceReportsHandler(req);
  assert.equal(response.status, 200);
  assert.match(response.headers.get("Cache-Control"), /no-store/);
  const report = await response.json();
  assert.equal(report.period, period);
  assert.equal(report.rows.length, 15);
  assert.ok(report.rows.every((row) => row.count === 3));
  for (const call of calls) {
    assert.equal(call.overrideAccess, false);
    assert.equal(call.req, req);
    const key = call.collection === "posts" ? "publishedAt" : "createdAt";
    assert.equal(call.where.and[0][key].less_than_equal, report.end);
    assert.equal(
      call.where.and[0][key].greater_than_equal,
      report.start ?? undefined,
    );
  }
}
const csvResponse = await workspaceReportsHandler(
  request("?period=7&format=csv"),
);
assert.match(
  csvResponse.headers.get("Content-Disposition"),
  /workspace-report-7\.csv/,
);
assert.match(csvResponse.headers.get("Content-Type"), /text\/csv/);
const csv = await csvResponse.text();
assert.equal(csv.trim().split("\r\n").length, 16);
assert.ok(
  csv.includes('"Count"') && csv.includes('"Currently scheduled internally"'),
);
assert.ok(
  !csv.includes("private backend details") &&
    !csv.includes("email") &&
    !csv.includes("contactName"),
);
const outage = await workspaceReportsHandler(request("", "admin", true));
assert.equal(outage.status, 503);
assert.ok(!(await outage.text()).includes("private backend details"));
console.log(
  "Workspace reports: admin authorization, period filtering, DST bounds, access propagation, aggregate CSV and safe outages passed.",
);
