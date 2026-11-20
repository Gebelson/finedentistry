import { randomBytes, createHash, timingSafeEqual } from "node:crypto";
import { APIError, type PayloadRequest } from "payload";
import { sourceFAQs } from "@/lib/content";

const hash = (value: string) =>
  createHash("sha256").update(value).digest("hex");
const staff = (req: PayloadRequest) =>
  ["admin", "reception"].includes(req.user?.role || "");
function text(value: unknown) {
  if (typeof value !== "string" || !value.trim() || value.length > 4000)
    throw new APIError("Enter a message of 1–4000 characters.", 400);
  return value.trim();
}
const firstRequest = new Map<string, { count: number; until: number }>();
function limit(req: PayloadRequest) {
  const key = hash(
    req.headers.get("x-forwarded-for")?.split(",")[0] || "local",
  );
  const current = firstRequest.get(key);
  if (!current || current.until < Date.now()) {
    firstRequest.set(key, { count: 1, until: Date.now() + 3600000 });
    return;
  }
  if (++current.count > 30)
    throw new APIError("Please call the practice to continue.", 429);
}
async function ownConversation(req: PayloadRequest, id: number) {
  const conversation = await req.payload.findByID({
    collection: "conversations",
    id,
    depth: 0,
    overrideAccess: true,
    showHiddenFields: true,
    select: {
      visitorTokenHash: true,
      status: true,
      controller: true,
      reference: true,
    },
  });
  if (!staff(req)) {
    const token = req.headers.get("x-conversation-token") || "";
    const expected = conversation.visitorTokenHash;
    if (
      !expected ||
      expected.length !== 64 ||
      !token ||
      !timingSafeEqual(Buffer.from(hash(token)), Buffer.from(expected))
    )
      throw new APIError("Conversation access denied.", 403);
  }
  return conversation;
}
async function append(
  req: PayloadRequest,
  id: number,
  sender: "visitor" | "assistant" | "reception",
  message: string,
) {
  await req.payload.create({
    collection: "messages",
    overrideAccess: true,
    data: { conversation: id, sender, text: message },
  });
}
function faqReply(message: string): string {
  if (
    /\b(pain|hurts?|toothache|bleeding|swelling|fever|dose|medication|emergency)\b/i.test(
      message,
    )
  )
    return "For symptoms, medication questions or urgent dental concerns, please call (407) 898-1621 so the practice team can advise you. This assistant provides general practice information only.";
  const words = new Set(message.toLowerCase().match(/[a-z]{4,}/g) || []);
  const skip = new Set([
    "what",
    "when",
    "where",
    "with",
    "that",
    "have",
    "does",
    "your",
    "this",
    "please",
    "would",
    "could",
    "about",
  ]);
  const ranked = sourceFAQs
    .filter((faq) => faq.a.trim())
    .map((faq) => ({
      faq,
      score: [...words].filter(
        (word) => !skip.has(word) && faq.q.toLowerCase().includes(word),
      ).length,
    }))
    .sort((a, b) => b.score - a.score);
  if (ranked[0]?.score >= 1) return ranked[0].faq.a.slice(0, 2200);
  return "Our team can help with that question. Please call (407) 898-1621. This assistant provides general practice information and cannot confirm appointments or give a diagnosis.";
}
export async function chatGet(req: PayloadRequest) {
  const query = new URL(req.url!).searchParams;
  const id = Number(query.get("conversation"));
  if (query.has("conversation") && (!Number.isSafeInteger(id) || id < 1))
    throw new APIError("Invalid conversation.", 400);
  const settings = await req.payload.findGlobal({
    slug: "chat-settings",
    overrideAccess: true,
  });
  if (!id)
    return Response.json(
      {
        enabled: !!settings.enabled,
        mode: settings.mode,
        welcome: settings.welcome,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  const conversation = await ownConversation(req, id);
  const messages = await req.payload.find({
    collection: "messages",
    where: { conversation: { equals: id } },
    sort: "createdAt",
    limit: 1000,
    depth: 0,
    overrideAccess: true,
  });
  return Response.json(
    {
      status: conversation.status,
      controller: conversation.controller,
      messages: messages.docs.map((m) => ({
        id: m.id,
        sender: m.sender,
        text: m.text,
        createdAt: m.createdAt,
      })),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
export async function chatPost(req: PayloadRequest) {
  const origin = req.headers.get("origin");
  if (!origin || !req.payload.config.csrf.includes(origin))
    throw new APIError("Request origin is not allowed.", 403);
  let input: unknown;
  try {
    input = await req.json!();
  } catch {
    throw new APIError("Send a valid JSON request.", 400);
  }
  if (!input || typeof input !== "object" || Array.isArray(input))
    throw new APIError("Send a valid chat request.", 400);
  const body = input as Record<string, unknown>;
  const settings = await req.payload.findGlobal({
    slug: "chat-settings",
    overrideAccess: true,
  });
  if (body.action === "start") {
    if (!settings.enabled)
      throw new APIError("Website chat is currently unavailable.", 503);
    limit(req);
    const token = randomBytes(32).toString("hex");
    const conversation = await req.payload.create({
      collection: "conversations",
      overrideAccess: true,
      data: {
        reference: `WEB-${randomBytes(5).toString("hex").toUpperCase()}`,
        visitorTokenHash: hash(token),
        status: settings.mode === "reception" ? "waiting" : "open",
        controller: settings.mode === "reception" ? "reception" : "assistant",
      },
    });
    await append(
      req,
      conversation.id,
      "assistant",
      settings.welcome || "Welcome to Fine Dentistry.",
    );
    return Response.json({ id: conversation.id, token }, { status: 201 });
  }
  const id = Number(body.id);
  if (!Number.isSafeInteger(id) || id < 1)
    throw new APIError("Invalid conversation.", 400);
  const conversation = await ownConversation(req, id);
  if (
    body.action === "takeover" ||
    body.action === "resolve" ||
    body.action === "reply"
  ) {
    if (!staff(req)) throw new APIError("Reception access required.", 403);
    if (body.action === "reply")
      await append(req, id, "reception", text(body.text));
    await req.payload.update({
      collection: "conversations",
      id,
      overrideAccess: true,
      data: {
        controller: "reception",
        status: body.action === "resolve" ? "resolved" : "open",
        assignedTo: req.user!.id,
      },
    });
    return Response.json({ saved: true });
  }
  if (body.action !== "message" && body.action !== "handoff")
    throw new APIError("Unsupported action.", 400);
  if (!settings.enabled)
    throw new APIError("Website chat is currently unavailable.", 503);
  if (
    settings.mode === "reception" &&
    conversation.controller === "assistant"
  ) {
    await req.payload.update({
      collection: "conversations",
      id,
      overrideAccess: true,
      data: { controller: "reception", status: "waiting" },
    });
    conversation.controller = "reception";
  }
  const message =
    body.action === "handoff"
      ? "I would like to speak with reception."
      : text(body.text);
  await append(req, id, "visitor", message);
  if (
    conversation.controller === "assistant" &&
    settings.mode !== "assistant" &&
    (body.action === "handoff" ||
      /\b(human|reception|person|staff|someone)\b/i.test(message))
  ) {
    await req.payload.update({
      collection: "conversations",
      id,
      overrideAccess: true,
      data: { controller: "reception", status: "waiting" },
    });
    await append(
      req,
      id,
      "assistant",
      "Your message has been added to the reception queue. You can also call (407) 898-1621.",
    );
  } else if (
    settings.mode !== "reception" &&
    conversation.controller === "assistant"
  ) {
    const latest = await req.payload.findByID({
      collection: "conversations",
      id,
      overrideAccess: true,
    });
    if (latest.controller === "assistant")
      await append(req, id, "assistant", faqReply(message));
  } else if (conversation.status === "resolved") {
    await req.payload.update({
      collection: "conversations",
      id,
      overrideAccess: true,
      data: { status: "waiting", controller: "reception" },
    });
  }
  return Response.json({ saved: true });
}
