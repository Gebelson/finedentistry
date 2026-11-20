import assert from "node:assert/strict";
import { SignJWT, jwtVerify } from "jose";
import {
  persistAuthenticatedSession,
  renewPersistentCookie,
} from "../cms/persistent-session.ts";
const secret = "test-only-persistent-session-key-000000000000000000000000";
const encoded = new TextEncoder().encode(secret);
const native = await new SignJWT({
  id: 1,
  collection: "users",
  sid: "session-1",
  role: "admin",
})
  .setProtectedHeader({ alg: "HS256", authVersion: 1, typ: "JWT" })
  .setIssuedAt()
  .setExpirationTime("12h")
  .sign(encoded);
let update;
const req = {
  payload: {
    secret,
    config: { cookiePrefix: "payload" },
    db: {
      findOne: async () => ({
        id: 1,
        sessions: [
          {
            id: "session-1",
            createdAt: "2026-11-20T00:00:00Z",
            expiresAt: "2026-11-21T00:00:00Z",
          },
        ],
      }),
      updateOne: async (args) => {
        update = args;
      },
    },
  },
};
const result = await persistAuthenticatedSession({
  operation: "login",
  result: { token: native, exp: 123, user: { id: 1 } },
  req,
});
const verified = await jwtVerify(result.token, encoded);
assert.equal(verified.payload.exp, undefined);
assert.equal(verified.payload.sid, "session-1");
assert.equal(verified.protectedHeader.authVersion, 1);
assert.equal(result.exp, undefined);
assert.equal(update.data.sessions[0].expiresAt, "9999-12-31T23:59:59.000Z");
assert.equal(update.req, req);
const response = { user: { id: 1 }, token: result.token };
renewPersistentCookie({ req, response });
assert.match(
  req.responseHeaders.get("set-cookie"),
  /HttpOnly; SameSite=Lax; Max-Age=34560000/,
);
const unrelated = { docs: [] };
assert.equal(
  await persistAuthenticatedSession({
    operation: "find",
    result: unrelated,
    req,
  }),
  unrelated,
);
const expired = { user: { id: 1 }, token: native };
const untouched = { ...req, responseHeaders: undefined };
renewPersistentCookie({ req: untouched, response: expired });
assert.equal(untouched.responseHeaders, undefined);
const missing = {
  payload: {
    ...req.payload,
    db: { ...req.payload.db, findOne: async () => ({ id: 1, sessions: [] }) },
  },
};
await assert.rejects(
  () =>
    persistAuthenticatedSession({
      operation: "login",
      result: { user: { id: 1 }, token: native },
      req: missing,
    }),
  /session is unavailable/,
);
console.log(
  "PASS persistent-session JWT signature/header/sid preservation, non-expiry, transactional metadata, rolling cookie and missing-session rejection.",
);
