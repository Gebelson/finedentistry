import assert from "node:assert/strict";
import {
  connectionChecksHandler,
  createConnectionReport,
} from "../cms/connections-endpoint.ts";

let reads = 0;
const req = (role = "admin") => ({
  url: "http://localhost:3000/api/workspace-connections",
  method: "GET",
  headers: new Headers(),
  user: role ? { id: 1, role } : null,
  payload: {
    config: { csrf: ["http://localhost:3000"] },
    count: async () => {
      reads++;
      return { totalDocs: 2 };
    },
    findGlobal: async () => {
      reads++;
      return { enabled: true, mode: "hybrid" };
    },
  },
});
for (const role of [null, "editor", "reception"]) {
  reads = 0;
  const response = await connectionChecksHandler(req(role));
  assert.equal(response.status, role ? 403 : 401);
  assert.equal(reads, 0);
  assert.match(response.headers.get("cache-control"), /no-store/);
}
const options = {
  analyticsCheck: async () => {},
  aiProbe: async () => ({ status: "ready", model: "free-model" }),
  env: {
    DATABASE_URI: "postgres://PRIVATE",
    BLOB_READ_WRITE_TOKEN: "PRIVATE",
    ANALYTICS_ENABLED: "true",
    PRACTICE_AI_ENABLED: "true",
  },
};
const report = await createConnectionReport(req(), options);
assert.equal(report.connections.length, 10);
for (const id of ["content", "chat", "assistant", "analytics", "data"])
  assert.equal(report.connections.find((x) => x.id === id).status, "verified");
for (const id of ["email", "sms", "payments", "calendar"])
  assert.equal(
    report.connections.find((x) => x.id === id).status,
    "needs_setup",
  );
assert.equal(
  report.connections.find((x) => x.id === "ai").status,
  "needs_verification",
);
assert.ok(!JSON.stringify(report).includes("PRIVATE"));
const active = await createConnectionReport(req(), {
  ...options,
  probeAI: true,
});
assert.equal(active.connections.find((x) => x.id === "ai").status, "verified");
const failedReq = req();
failedReq.payload.count = async () => {
  throw Error("PRIVATE DATABASE CONNECTION STRING");
};
const failed = await createConnectionReport(failedReq, {
  ...options,
  analyticsCheck: async () => {
    throw Error("PRIVATE ANALYTICS");
  },
  probeAI: true,
  aiProbe: async () => {
    throw Error("PRIVATE TOKEN");
  },
});
assert.equal(failed.connections.find((x) => x.id === "data").status, "error");
assert.equal(
  failed.connections.find((x) => x.id === "analytics").status,
  "error",
);
assert.equal(failed.connections.find((x) => x.id === "ai").status, "error");
assert.ok(!JSON.stringify(failed).includes("PRIVATE"));
assert.equal(
  failed.connections.find((x) => x.id === "payments").status,
  "needs_setup",
);
const configured = await createConnectionReport(req(), {
  ...options,
  env: {
    ...options.env,
    RESEND_API_KEY: "PRIVATE",
    STRIPE_SECRET_KEY: "PRIVATE",
    TWILIO_AUTH_TOKEN: "PRIVATE",
  },
});
for (const id of ["email", "payments", "sms"])
  assert.equal(
    configured.connections.find((x) => x.id === id).status,
    "needs_setup",
    "Credentials alone must never imply an implemented/verified provider",
  );
for (const headers of [{ origin: "https://evil.example" }, {}]) {
  const post = {
    ...req(),
    method: "POST",
    headers: new Headers(headers),
    json: async () => ({ action: "ai" }),
  };
  assert.equal((await connectionChecksHandler(post)).status, 403);
}
for (const body of [
  null,
  [],
  { action: "send-email" },
  { action: "ai", recipient: "x@example.com" },
]) {
  const post = {
    ...req(),
    method: "POST",
    headers: new Headers({ origin: "http://localhost:3000" }),
    json: async () => body,
  };
  assert.equal((await connectionChecksHandler(post)).status, 400);
}
console.log(
  "PASS protected connection checks, real-read isolation, no secret leakage, explicit external prerequisites and same-origin bounded AI probes.",
);
