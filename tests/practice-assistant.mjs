import assert from "node:assert/strict";
import { createHash } from "node:crypto";
const assistant = await import("../cms/practice-assistant.ts").catch(
  () => ({}),
);
assert.equal(
  typeof assistant.practiceReply,
  "function",
  "practiceReply must implement the AI/FAQ boundary",
);
assert.equal(typeof assistant.probePracticeAI, "function");
const { practiceReply, probePracticeAI } = assistant;
const savedEnv = { ...process.env };
const savedFetch = globalThis.fetch;
const model = "nvidia/nemotron-3.5-lightning-free";
const req = { headers: new Headers() };
let calls = [];
let price = "0";
let generationStatus = 200;
let errorCode;
let generationText =
  "The practice offers financing. Please call the team for current options.";
let duringGeneration;
function installFetch() {
  calls = [];
  globalThis.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), options });
    if (String(url).endsWith("/models"))
      return Response.json({
        object: "list",
        data: [
          {
            id: model,
            type: "language",
            pricing: { input: price, output: "0" },
          },
        ],
      });
    if (duringGeneration) await duringGeneration();
    return Response.json(
      {
        error: errorCode ? { code: errorCode } : undefined,
        choices: [{ message: { content: generationText } }],
      },
      { status: generationStatus },
    );
  };
}
try {
  process.env.PRACTICE_AI_ENABLED = "true";
  process.env.AI_GATEWAY_API_KEY = "test-secret";
  delete process.env.VERCEL;
  delete process.env.VERCEL_OIDC_TOKEN;
  installFetch();
  const result = await practiceReply(
    "My name is Jane Unique, jane@example.test, 4075550199. Does your office offer financing?",
    req,
  );
  assert.equal(result.source, "ai");
  assert.equal(result.text, generationText);
  assert.equal(calls.length, 2);
  const sent = JSON.stringify(calls);
  assert.ok(
    !/Jane Unique|jane@example|4075550199/.test(sent),
    "visitor details must never cross AI boundary",
  );
  const body = JSON.parse(calls[1].options.body);
  assert.equal(body.model, model);
  assert.ok(!body.tools && !body.models);
  assert.match(body.messages[1].content, /financing/i);
  price = "0.001";
  installFetch();
  assert.equal(
    (await practiceReply("Does your office offer financing?", req)).source,
    "faq",
  );
  assert.equal(calls.length, 1, "paid model must never generate");
  assert.equal((await probePracticeAI(req)).status, "pricing_unverified");
  price = "";
  installFetch();
  assert.equal(
    (await probePracticeAI(req)).status,
    "pricing_unverified",
    "missing or empty price is not zero",
  );
  price = "0";
  generationStatus = 401;
  installFetch();
  assert.equal(
    (await practiceReply("Does your office offer financing?", req)).source,
    "faq",
  );
  assert.equal((await probePracticeAI(req)).status, "auth_failed");
  generationStatus = 403;
  errorCode = "customer_verification_required";
  installFetch();
  assert.equal(
    (await probePracticeAI(req)).status,
    "account_verification_required",
  );
  generationStatus = 402;
  errorCode = "insufficient_funds";
  installFetch();
  assert.equal((await probePracticeAI(req)).status, "credits_required");
  errorCode = undefined;
  generationStatus = 200;
  installFetch();
  assert.match(
    (await practiceReply("My tooth hurts, what medication dose?", req)).text,
    /call \(407\) 898-1621/,
  );
  assert.equal(
    calls.length,
    0,
    "clinical escalation must remain entirely local",
  );
  assert.equal(
    (await practiceReply("Unmatched request zxqv", req)).source,
    "faq",
  );
  assert.equal(calls.length, 0);
  process.env.VERCEL = "1";
  installFetch();
  assert.equal(
    (await probePracticeAI(req)).status,
    "missing_auth",
    "Vercel requires request scoped OIDC",
  );
  assert.equal(calls.length, 0);
  const oidcReq = {
    headers: new Headers({ "x-vercel-oidc-token": "test-oidc" }),
  };
  assert.equal((await probePracticeAI(oidcReq)).status, "ready");
  assert.equal(calls.at(-1).options.headers.Authorization, "Bearer test-oidc");
  process.env.PRACTICE_AI_ENABLED = "false";
  installFetch();
  assert.equal((await probePracticeAI(req)).status, "disabled");
  assert.equal(calls.length, 0);
  process.env.PRACTICE_AI_ENABLED = "true";
  delete process.env.VERCEL;
  const { chatPost } = await import("../cms/chat-endpoint.ts");
  let controller = "assistant";
  let mode = "hybrid";
  const messages = [];
  const request = {
    headers: new Headers({
      origin: "http://test.local",
      "x-conversation-token": "visitor-token",
    }),
    json: async () => ({
      action: "message",
      id: 1,
      text: "Does your office offer financing?",
    }),
    payload: {
      config: { csrf: ["http://test.local"] },
      findGlobal: async () => ({ enabled: true, mode }),
      findByID: async () => ({
        id: 1,
        status: "open",
        controller,
        visitorTokenHash: createHash("sha256")
          .update("visitor-token")
          .digest("hex"),
      }),
      create: async ({ data }) => {
        messages.push(data);
        return data;
      },
    },
  };
  duringGeneration = async () => {
    controller = "reception";
  };
  installFetch();
  assert.equal((await chatPost(request)).status, 200);
  assert.deepEqual(
    messages.map((m) => m.sender),
    ["visitor"],
    "staff takeover suppresses pending AI response",
  );
  controller = "assistant";
  messages.length = 0;
  duringGeneration = async () => {
    mode = "reception";
  };
  installFetch();
  await chatPost(request);
  assert.deepEqual(
    messages.map((m) => m.sender),
    ["visitor"],
    "mode change suppresses pending AI response",
  );
  console.log(
    "PASS AI generation, current zero-price gate, auth failure fallback, PII boundary, clinical escalation, request OIDC, disabled mode, takeover and mode races.",
  );
} finally {
  globalThis.fetch = savedFetch;
  process.env = savedEnv;
}
