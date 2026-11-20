import assert from "node:assert/strict";
import { appointmentRequestHandler } from "../cms/appointment-request.ts";

let sequence = 0;
const valid = {
  name: "Test Request",
  phone: "407-555-0199",
  email: "test@example.invalid",
  preferredContact: "phone",
  treatment: "New patient visit",
  doctor: "No preference",
  consent: true,
  website: "",
};
function request(body = {}, options = {}) {
  const calls = { creates: [], committed: 0, rolledBack: 0, queries: [] };
  const req = {
    headers: new Headers({
      origin: "http://localhost:3000",
      "content-type": "application/json",
      "x-forwarded-for": `192.0.2.${++sequence}`,
      ...options.headers,
    }),
    json: async () => ({
      ...valid,
      phone: `407555${String(sequence).padStart(4, "0")}`,
      ...body,
    }),
    payload: {
      config: { csrf: ["http://localhost:3000"] },
      db: {
        beginTransaction: async () =>
          options.noTransaction ? null : "transaction",
        commitTransaction: async () => {
          calls.committed++;
        },
        rollbackTransaction: async () => {
          calls.rolledBack++;
        },
      },
      find: async (args) => {
        calls.queries.push(args);
        return { docs: options.duplicate ? [{ id: 42 }] : [] };
      },
      count: async (args) => {
        calls.queries.push(args);
        return { totalDocs: options.duplicate ? 1 : 0 };
      },
      create: async (args) => {
        calls.creates.push(args);
        if (options.fail && args.collection === "appointments")
          throw Error("private database error");
        return { id: 42 };
      },
    },
  };
  return { req, calls };
}
for (const body of [
  { name: "x" },
  { phone: "bad" },
  { email: {} },
  { email: "bad" },
  { consent: false },
  { preferredContact: "sms" },
  { treatment: "Invented" },
  { doctor: "Unknown" },
  { website: "spam" },
  { preferredContact: "email", email: "" },
  { name: "x".repeat(101) },
]) {
  const { req, calls } = request(body);
  assert.equal((await appointmentRequestHandler(req)).status, 400);
  assert.equal(calls.creates.length, 0);
}
for (const headers of [
  { origin: "https://attacker.invalid" },
  { origin: "" },
  { "sec-fetch-site": "cross-site" },
]) {
  const { req, calls } = request({}, { headers });
  assert.equal((await appointmentRequestHandler(req)).status, 403);
  assert.equal(calls.creates.length, 0);
}
const success = request();
const result = await appointmentRequestHandler(success.req);
assert.equal(result.status, 202);
assert.equal((await result.json()).received, true);
assert.equal(success.calls.creates.length, 2);
assert.equal(success.calls.committed, 1);
const appointment = success.calls.creates[1];
assert.equal(appointment.data.status, "requested");
assert.equal(appointment.data.contact, 42);
assert.equal(appointment.data.startsAt, undefined);
assert.equal(appointment.data.doctor, undefined);
assert.ok(
  success.calls.creates.every(
    (call) => call.req === success.req && call.overrideAccess === true,
  ),
);
const failed = request({}, { fail: true });
const failure = await appointmentRequestHandler(failed.req);
assert.equal(failure.status, 503);
assert.equal(failed.calls.rolledBack, 1);
assert.equal(failed.calls.committed, 0);
assert.ok(!(await failure.text()).includes("private database error"));
const unsupported = request({}, { noTransaction: true });
assert.equal((await appointmentRequestHandler(unsupported.req)).status, 503);
assert.equal(unsupported.calls.creates.length, 0);
const duplicate = request({}, { duplicate: true });
assert.equal((await appointmentRequestHandler(duplicate.req)).status, 202);
assert.equal(duplicate.calls.creates.length, 0);
const coalesced = request();
const responses = await Promise.all([
  appointmentRequestHandler(coalesced.req),
  appointmentRequestHandler(coalesced.req),
]);
assert.ok(responses.every((response) => response.status === 202));
assert.equal(coalesced.calls.creates.length, 2);
const limited = request({ consent: false });
for (let index = 0; index < 8; index++)
  assert.equal((await appointmentRequestHandler(limited.req)).status, 400);
assert.equal((await appointmentRequestHandler(limited.req)).status, 429);
console.log(
  "Appointment requests: origin/validation, atomic save/rollback, no reservation, duplicate suppression and bounded rate limiting passed.",
);
