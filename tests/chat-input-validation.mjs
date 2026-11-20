import assert from "node:assert/strict";
import { chatGet, chatPost } from "../cms/chat-endpoint.ts";

let reads = 0;
const request = (body) => ({
  url: "http://localhost:3000/api/clinic-chat",
  headers: new Headers({ origin: "http://localhost:3000" }),
  json: async () => JSON.parse(body),
  payload: {
    config: { csrf: ["http://localhost:3000"] },
    findGlobal: async () => {
      reads++;
      return { enabled: true };
    },
    findByID: async () => {
      throw Error("Invalid IDs must not reach the database");
    },
  },
});
for (const body of ["null", "[]", '"message"', "{"]) {
  await assert.rejects(
    () => chatPost(request(body)),
    (error) => error.status === 400,
    "Malformed chat requests must return a useful 400 error",
  );
}
assert.equal(
  reads,
  0,
  "Malformed requests must be rejected before loading settings",
);
for (const id of ["0", "-1", "1.5", "abc", "9007199254740992", ""]) {
  const req = request("{}");
  req.url += `?conversation=${id}`;
  await assert.rejects(
    () => chatGet(req),
    (error) => error.status === 400,
    "Invalid conversation IDs must not return chat settings or reach the database",
  );
}
console.log(
  "PASS malformed chat JSON/object and invalid conversation IDs return 400 without database access.",
);
