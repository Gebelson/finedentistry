import assert from "node:assert/strict";
import {
  calendarMonth,
  calendarBounds,
  calendarDateKey,
} from "../lib/clinic-calendar.ts";
const march = calendarBounds(calendarMonth(new Date("2026-03-15T12:00:00Z")));
assert.equal(march.start, "2026-03-01T05:00:00.000Z");
assert.equal(march.end, "2026-04-01T04:00:00.000Z");
const november = calendarBounds(
  calendarMonth(new Date("2026-11-15T12:00:00Z")),
);
assert.equal(november.start, "2026-11-01T04:00:00.000Z");
assert.equal(november.end, "2026-12-01T05:00:00.000Z");
assert.equal(calendarMonth(new Date("2026-12-01T02:00:00Z")).getMonth(), 10);
assert.equal(calendarDateKey("2026-12-01T02:00:00Z"), "2026-11-30");
console.log(
  "PASS Orlando month boundaries, both daylight-saving transitions and browser-independent Today.",
);
