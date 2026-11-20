import { TZDate } from "@date-fns/tz";
import type { PayloadRequest, Where } from "payload";
import { CLINIC_TIMEZONE } from "../lib/clinic-calendar";

export type ReportPeriod = "7" | "30" | "90" | "all";
export type WorkspaceReport = {
  period: ReportPeriod;
  start: string | null;
  end: string;
  rows: { label: string; count: number; group: string }[];
};
export function reportBounds(period: ReportPeriod, now = new Date()) {
  const local = new TZDate(now, CLINIC_TIMEZONE);
  return {
    start:
      period === "all"
        ? null
        : new Date(
            new TZDate(
              local.getFullYear(),
              local.getMonth(),
              local.getDate() - Number(period) + 1,
              CLINIC_TIMEZONE,
            ).getTime(),
          ).toISOString(),
    end: now.toISOString(),
  };
}

export async function workspaceReportsHandler(
  req: PayloadRequest,
): Promise<Response> {
  const headers = {
    "Cache-Control": "private, no-store",
    Vary: "Cookie, Authorization",
  };
  if (req.user?.role !== "admin")
    return Response.json(
      { error: "Administrator access required." },
      { status: 403, headers },
    );
  const query = new URL(req.url || "http://localhost/api/workspace-reports")
    .searchParams;
  const period = query.get("period") || "30";
  if (!["7", "30", "90", "all"].includes(period))
    return Response.json(
      { error: "Choose 7, 30, 90 days or all time." },
      { status: 400, headers },
    );
  const format = query.get("format");
  if (format && format !== "csv")
    return Response.json(
      { error: "Unsupported report format." },
      { status: 400, headers },
    );
  const bounds = reportBounds(period as ReportPeriod);
  const dateWhere = (field: string): Where => ({
    [field]: {
      ...(bounds.start ? { greater_than_equal: bounds.start } : {}),
      less_than_equal: bounds.end,
    },
  });
  const definitions: {
    collection: "contacts" | "conversations" | "appointments" | "posts";
    group: string;
    label: string;
    where?: Where;
  }[] = [
    {
      collection: "contacts" as const,
      group: "Reception contacts",
      label: "Contacts created",
    },
    ...["website", "phone", "referral", "other"].map((source) => ({
      collection: "contacts" as const,
      group: "Contact sources",
      label: `Source: ${source}`,
      where: { source: { equals: source } },
    })),
    {
      collection: "conversations" as const,
      group: "Website conversations",
      label: "Conversations created",
    },
    ...["open", "waiting", "resolved"].map((status) => ({
      collection: "conversations" as const,
      group: "Conversation status",
      label: `Currently ${status}`,
      where: { status: { equals: status } },
    })),
    {
      collection: "appointments" as const,
      group: "Internal appointments",
      label: "Appointment records created",
    },
    ...["requested", "scheduled", "completed", "canceled"].map((status) => ({
      collection: "appointments" as const,
      group: "Appointment status",
      label:
        status === "scheduled"
          ? "Currently scheduled internally"
          : `Currently ${status}`,
      where: { status: { equals: status } },
    })),
    {
      collection: "posts",
      group: "Editorial",
      label: "Currently published articles by publication date",
      where: { _status: { equals: "published" } },
    },
  ];
  try {
    const rows = await Promise.all(
      definitions.map(async (definition) => {
        const result = await req.payload.count({
          collection: definition.collection,
          req,
          overrideAccess: false,
          where: {
            and: [
              dateWhere(
                definition.collection === "posts" ? "publishedAt" : "createdAt",
              ),
              ...(definition.where ? [definition.where] : []),
            ],
          },
        });
        return {
          label: definition.label,
          group: definition.group,
          count: result.totalDocs,
        };
      }),
    );
    const report: WorkspaceReport = {
      period: period as ReportPeriod,
      ...bounds,
      rows,
    };
    if (format === "csv") {
      const quote = (value: string | number) =>
        `"${String(value).replaceAll('"', '""')}"`;
      const records = [
        ["Period", "From (UTC)", "Through (UTC)", "Group", "Metric", "Count"],
        ...rows.map((row) => [
          period === "all" ? "All time" : `${period} days`,
          bounds.start || "All time",
          bounds.end,
          row.group,
          row.label,
          row.count,
        ]),
      ];
      return new Response(
        records.map((record) => record.map(quote).join(",")).join("\r\n") +
          "\r\n",
        {
          headers: {
            ...headers,
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="workspace-report-${period}.csv"`,
          },
        },
      );
    }
    return Response.json(report, { headers });
  } catch {
    return Response.json(
      { error: "Reports are temporarily unavailable. Please retry." },
      { status: 503, headers },
    );
  }
}
