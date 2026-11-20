import { createHmac } from "node:crypto";
import { TZDate } from "@date-fns/tz";
import type { PayloadRequest } from "payload";
import {
  calendarBounds,
  calendarDoctors,
  CLINIC_TIMEZONE,
} from "../lib/clinic-calendar";

const headers = {
  "Cache-Control": "private, no-store",
  Vary: "Cookie, Authorization",
  "X-Content-Type-Options": "nosniff",
};
const escapeText = (value: string) =>
  value
    .replaceAll("\\", "\\\\")
    .replace(/\r\n|\r|\n/g, "\\n")
    .replaceAll(";", "\\;")
    .replaceAll(",", "\\,");
// RFC 5545 limits physical lines to 75 UTF-8 octets, including continuation spaces.
function foldLine(value: string): string {
  const lines: string[] = [];
  let line = "";
  for (const character of value) {
    if (Buffer.byteLength(line + character, "utf8") > 75) {
      lines.push(line);
      line = " ";
    }
    line += character;
  }
  lines.push(line);
  return lines.join("\r\n");
}
function validUTC(value: unknown): Date | null {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value)
  )
    return null;
  const date = new Date(value);
  if (
    !Number.isFinite(date.getTime()) ||
    date.toISOString() !== value.replace(/(?<!\.\d{3})Z$/, ".000Z")
  )
    return null;
  return date;
}
const icsDate = (value: Date) =>
  value
    .toISOString()
    .replaceAll(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");

export async function calendarExportHandler(
  req: PayloadRequest,
): Promise<Response> {
  if (!req.user)
    return Response.json(
      { error: "Sign in to download the calendar." },
      { status: 401, headers },
    );
  if (!["admin", "reception"].includes(req.user.role))
    return Response.json(
      { error: "Reception access required." },
      { status: 403, headers },
    );
  const month =
    new URL(req.url || "http://localhost/api/calendar-export").searchParams.get(
      "month",
    ) || "";
  if (!/^(?:[1-9]\d{3})-(?:0[1-9]|1[0-2])$/.test(month))
    return Response.json(
      { error: "Choose a month in YYYY-MM format." },
      { status: 400, headers },
    );
  const [year, monthNumber] = month.split("-").map(Number);
  const bounds = calendarBounds(
    new TZDate(year, monthNumber - 1, 1, CLINIC_TIMEZONE),
  );
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Fine Dentistry//Internal Busy Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];
  const stamp = icsDate(new Date());
  try {
    if (!req.payload.secret) throw new Error("Calendar unavailable");
    // A hard limit prevents unbounded work; failure never returns a partial calendar.
    for (let page = 1; page <= 25; page++) {
      const result = await req.payload.find({
        collection: "appointments",
        req,
        overrideAccess: false,
        depth: 0,
        limit: 200,
        page,
        sort: "id",
        select: { doctor: true, startsAt: true, endsAt: true, status: true },
        where: {
          and: [
            { status: { equals: "scheduled" } },
            {
              startsAt: {
                less_than: bounds.end,
              },
            },
            { endsAt: { greater_than: bounds.start } },
          ],
        },
      });
      for (const entry of result.docs) {
        const start = validUTC(entry.startsAt),
          end = validUTC(entry.endsAt);
        const doctor =
          entry.doctor && Object.hasOwn(calendarDoctors, entry.doctor)
            ? calendarDoctors[entry.doctor]
            : null;
        if (
          entry.status !== "scheduled" ||
          !doctor ||
          !start ||
          !end ||
          end.toISOString() <= bounds.start ||
          start.toISOString() >= bounds.end ||
          end <= start ||
          end.getTime() - start.getTime() > 8 * 3600000
        )
          continue;
        const uid = createHmac("sha256", req.payload.secret)
          .update(`calendar-appointment:${entry.id}`)
          .digest("hex");
        lines.push(
          "BEGIN:VEVENT",
          `UID:${uid}@calendar.finedentistryorlando.com`,
          `DTSTAMP:${stamp}`,
          `DTSTART:${icsDate(start)}`,
          `DTEND:${icsDate(end)}`,
          `SUMMARY:${escapeText(`Busy - ${doctor}`)}`,
          "STATUS:CONFIRMED",
          "CLASS:PRIVATE",
          "TRANSP:OPAQUE",
          "END:VEVENT",
        );
      }
      if (!result.hasNextPage) {
        lines.push("END:VCALENDAR");
        return new Response(lines.map(foldLine).join("\r\n") + "\r\n", {
          headers: {
            ...headers,
            "Content-Type": "text/calendar; charset=utf-8",
            "Content-Disposition": `attachment; filename="fine-dentistry-busy-${month}.ics"`,
          },
        });
      }
    }
    throw new Error("Calendar limit reached");
  } catch {
    return Response.json(
      {
        error:
          "Calendar download unavailable. Please retry or select another month.",
      },
      { status: 503, headers },
    );
  }
}
