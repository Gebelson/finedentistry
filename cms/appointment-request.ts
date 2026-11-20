import { createHmac, randomBytes } from "node:crypto";
import {
  commitTransaction,
  initTransaction,
  killTransaction,
  type PayloadRequest,
} from "payload";
import { services } from "../lib/site-data";
import type { Appointment } from "./payload-types";

const processSalt = randomBytes(32);
const digest = (value: string) =>
  createHmac("sha256", processSalt).update(value).digest("hex");
const attempts = new Map<string, { count: number; until: number }>();
const pending = new Map<string, Promise<boolean>>();
const completed = new Map<string, number>();
const doctors: Record<string, "trivedi" | "lascurain" | "perez"> = {
  "Dr. Aileen Trivedi": "trivedi",
  "Dr. Sergio Lascurain": "lascurain",
  "Dr. Amanda Perez": "perez",
};
const headers = { "Cache-Control": "no-store" };
const receipt = () =>
  Response.json(
    {
      received: true,
      message:
        "Your request was received. Your appointment is not confirmed. Our team will contact you to discuss availability.",
    },
    { status: 202, headers },
  );

export async function appointmentRequestHandler(
  req: PayloadRequest,
): Promise<Response> {
  const origin = req.headers.get("origin");
  if (
    !origin ||
    !req.payload.config.csrf.includes(origin) ||
    req.headers.get("sec-fetch-site") === "cross-site"
  )
    return Response.json(
      { error: "Request origin is not allowed." },
      { status: 403, headers },
    );
  if (!req.headers.get("content-type")?.includes("application/json"))
    return Response.json(
      { error: "Send a JSON request." },
      { status: 415, headers },
    );
  if (Number(req.headers.get("content-length") || 0) > 4096)
    return Response.json(
      { error: "Request is too large." },
      { status: 413, headers },
    );
  const now = Date.now();
  for (const [key, value] of attempts)
    if (value.until <= now) attempts.delete(key);
  for (const [key, until] of completed) if (until <= now) completed.delete(key);
  const addressKey = digest(
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local",
  );
  const attempt = attempts.get(addressKey) || {
    count: 0,
    until: now + 15 * 60_000,
  };
  attempt.count++;
  if (attempt.count > 8 || attempts.size >= 5000)
    return Response.json(
      { error: "Please call the practice to continue." },
      { status: 429, headers: { ...headers, "Retry-After": "900" } },
    );
  attempts.set(addressKey, attempt);
  let body: Record<string, unknown>;
  try {
    const input: unknown = await req.json!();
    if (
      !input ||
      typeof input !== "object" ||
      Array.isArray(input) ||
      JSON.stringify(input).length > 4096
    )
      throw Error();
    body = input as Record<string, unknown>;
  } catch {
    return Response.json(
      { error: "Send a valid request." },
      { status: 400, headers },
    );
  }
  if (body.website)
    return Response.json(
      { error: "Unable to accept this request. Please call the practice." },
      { status: 400, headers },
    );
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const phoneInput = typeof body.phone === "string" ? body.phone.trim() : "";
  const phone = phoneInput.replace(/\D/g, "");
  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const treatment = typeof body.treatment === "string" ? body.treatment : "";
  const preferredContact =
    body.preferredContact === "email" ? "email" : "phone";
  const doctorLabel =
    typeof body.doctor === "string" ? body.doctor : "No preference";
  const service = services.find((item) => item.title === treatment);
  if (
    (body.email !== undefined && typeof body.email !== "string") ||
    name.length < 2 ||
    name.length > 100 ||
    /[\r\n<>]/.test(name) ||
    phoneInput.length > 32 ||
    !/^[+\d().\s-]+$/.test(phoneInput) ||
    phone.length < 10 ||
    phone.length > 15 ||
    email.length > 254 ||
    (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) ||
    (preferredContact === "email" && !email) ||
    (!service && treatment !== "New patient visit") ||
    (doctorLabel !== "No preference" && !doctors[doctorLabel]) ||
    body.consent !== true ||
    (body.preferredContact !== "phone" && body.preferredContact !== "email")
  ) {
    return Response.json(
      {
        error:
          "Check your name, phone, email and contact preferences, then try again.",
      },
      { status: 400, headers },
    );
  }
  const key = digest(
    JSON.stringify([
      name.toLowerCase(),
      phone,
      email,
      treatment,
      doctorLabel,
      preferredContact,
    ]),
  );
  if (completed.has(key)) return receipt();
  const existing = pending.get(key);
  if (existing)
    return (await existing)
      ? receipt()
      : Response.json(
          {
            error:
              "Your request could not be saved. Please retry or call the practice.",
          },
          { status: 503, headers },
        );
  const save = async () => {
    let ownsTransaction = false;
    try {
      ownsTransaction = await initTransaction(req);
      if (!ownsTransaction) throw Error("Transaction unavailable");
      // Suppress a recent retried submission across warm instances using existing records.
      const contacts = await req.payload.find({
        collection: "contacts",
        req,
        overrideAccess: true,
        depth: 0,
        limit: 10,
        where: {
          and: [
            { phone: { equals: phone } },
            { name: { equals: name } },
            { preferredContact: { equals: preferredContact } },
            ...(email
              ? [{ email: { equals: email } }]
              : [{ email: { exists: false } }]),
            {
              createdAt: {
                greater_than: new Date(now - 10 * 60_000).toISOString(),
              },
            },
          ],
        },
      });
      if (contacts.docs.length) {
        const duplicates = await req.payload.count({
          collection: "appointments",
          req,
          overrideAccess: true,
          where: {
            and: [
              { contact: { in: contacts.docs.map((contact) => contact.id) } },
              { status: { equals: "requested" } },
              {
                createdAt: {
                  greater_than: new Date(now - 10 * 60_000).toISOString(),
                },
              },
              ...(service
                ? [{ treatment: { equals: service.slug } }]
                : [{ treatment: { exists: false } }]),
              ...(doctors[doctorLabel]
                ? [{ doctor: { equals: doctors[doctorLabel] } }]
                : [{ doctor: { exists: false } }]),
            ],
          },
        });
        if (duplicates.totalDocs) {
          await commitTransaction(req);
          return true;
        }
      }
      const contact = await req.payload.create({
        collection: "contacts",
        req,
        overrideAccess: true,
        data: {
          name,
          phone,
          ...(email ? { email } : {}),
          source: "website",
          preferredContact,
        },
      });
      await req.payload.create({
        collection: "appointments",
        req,
        overrideAccess: true,
        data: {
          contactName: name,
          contact: contact.id,
          status: "requested",
          ...(service
            ? { treatment: service.slug as Appointment["treatment"] }
            : {}),
          ...(doctors[doctorLabel] ? { doctor: doctors[doctorLabel] } : {}),
        },
      });
      await commitTransaction(req);
      return true;
    } catch {
      if (ownsTransaction) await killTransaction(req);
      return false;
    }
  };
  const saving = save();
  pending.set(key, saving);
  const saved = await saving;
  pending.delete(key);
  if (!saved)
    return Response.json(
      {
        error:
          "Your request could not be saved. Please retry or call the practice.",
      },
      { status: 503, headers },
    );
  completed.set(key, now + 10 * 60_000);
  return receipt();
}
