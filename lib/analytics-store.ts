import { createHmac } from "node:crypto";
import { Pool } from "pg";
import type { Client } from "@libsql/client";
import type {
  AnalyticsEvent,
  AnalyticsSource,
  AnalyticsSummary,
} from "./analytics-types";

type Value = string | number | null;
type Statement = { sql: string; args: Value[] };
let pgPool: Pool | undefined;
let sqliteClient: Client | undefined;
let initializedURI = "";
const uri = () =>
  process.env.ANALYTICS_DATABASE_URI || process.env.DATABASE_URI || "";
async function postgres() {
  return (pgPool ||= new Pool({
    connectionString: uri(),
    max: 4,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 10000,
  }));
}
async function sqlite() {
  if (!sqliteClient) {
    const { createClient } = await import("@libsql/client");
    sqliteClient ||= createClient({ url: uri() });
  }
  return sqliteClient;
}
function sqliteStatement(statement: Statement) {
  const args: Value[] = [];
  const sql = statement.sql.replace(/\$(\d+)/g, (_, index) => {
    args.push(statement.args[Number(index) - 1]);
    return "?";
  });
  return { sql, args };
}
async function query(
  sql: string,
  args: Value[] = [],
): Promise<Record<string, unknown>[]> {
  if (uri().startsWith("postgres"))
    return (await (await postgres()).query(sql, args)).rows;
  return (await (await sqlite()).execute(sqliteStatement({ sql, args })))
    .rows as unknown as Record<string, unknown>[];
}
async function batch(statements: Statement[]) {
  if (uri().startsWith("postgres")) {
    const client = await (await postgres()).connect();
    try {
      await client.query("BEGIN");
      for (const item of statements) await client.query(item.sql, item.args);
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } else await (await sqlite()).batch(statements.map(sqliteStatement), "write");
}
export async function initializeAnalyticsStore() {
  if (!uri()) throw Error("Analytics database is not configured.");
  await query(
    "CREATE TABLE IF NOT EXISTS site_analytics_visitors (day TEXT NOT NULL, visitor_key TEXT NOT NULL, first_seen TEXT NOT NULL, last_seen TEXT NOT NULL, PRIMARY KEY (day,visitor_key))",
  );
  await query(
    "CREATE INDEX IF NOT EXISTS site_analytics_visitors_seen ON site_analytics_visitors(last_seen)",
  );
  await query(
    "CREATE TABLE IF NOT EXISTS site_analytics_metrics (day TEXT NOT NULL, dimension TEXT NOT NULL, value TEXT NOT NULL, event TEXT NOT NULL, count INTEGER NOT NULL DEFAULT 0, PRIMARY KEY(day,dimension,value,event))",
  );
  initializedURI = uri();
}
export async function closeAnalyticsStore() {
  await pgPool?.end();
  sqliteClient?.close();
  pgPool = undefined;
  sqliteClient = undefined;
  initializedURI = "";
}
export const analyticsDay = (date: Date) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
export function anonymousVisitorKey(day: string, ip: string, agent: string) {
  const secret = process.env.ANALYTICS_SECRET || process.env.PAYLOAD_SECRET;
  if (!secret) throw Error("Analytics secret is not configured.");
  return createHmac("sha256", secret)
    .update(`${day}|${ip}|${agent}`)
    .digest("hex");
}
export async function recordSiteMetric(input: {
  event: AnalyticsEvent | "heartbeat";
  path: string;
  source: AnalyticsSource;
  device: string;
  country: string;
  ip: string;
  agent: string;
  now?: Date;
}) {
  if (initializedURI !== uri()) await initializeAnalyticsStore();
  const now = input.now || new Date(),
    day = analyticsDay(now),
    stamp = now.toISOString(),
    key = anonymousVisitorKey(day, input.ip, input.agent);
  if (input.event === "heartbeat") {
    await query(
      "UPDATE site_analytics_visitors SET last_seen=$1 WHERE day=$2 AND visitor_key=$3",
      [stamp, day, key],
    );
    return;
  }
  const statements: Statement[] = [];
  if (input.event === "pageview")
    statements.push({
      sql: "INSERT INTO site_analytics_visitors(day,visitor_key,first_seen,last_seen) VALUES($1,$2,$3,$3) ON CONFLICT(day,visitor_key) DO UPDATE SET last_seen=EXCLUDED.last_seen",
      args: [day, key, stamp],
    });
  const dimensions = [
    ["total", "all"],
    ["page", input.path],
  ];
  if (input.event === "pageview")
    dimensions.push(
      ["source", input.source],
      ["device", input.device],
      ["country", input.country],
    );
  for (const [dimension, value] of dimensions)
    statements.push({
      sql: "INSERT INTO site_analytics_metrics(day,dimension,value,event,count) VALUES($1,$2,$3,$4,1) ON CONFLICT(day,dimension,value,event) DO UPDATE SET count=site_analytics_metrics.count+1",
      args: [day, dimension, value, input.event],
    });
  await batch(statements);
}
export async function siteAnalyticsSummary(
  days = 30,
  now = new Date(),
): Promise<AnalyticsSummary> {
  if (![7, 30, 90].includes(days)) days = 30;
  if (initializedURI !== uri()) await initializeAnalyticsStore();
  const today = analyticsDay(now),
    start = new Date(today + "T12:00:00Z");
  start.setUTCDate(start.getUTCDate() - (days - 1));
  const first = start.toISOString().slice(0, 10);
  const [metrics, visitors, active, firstRecorded] = await Promise.all([
    query(
      "SELECT day,dimension,value,event,count FROM site_analytics_metrics WHERE day >= $1 AND day <= $2",
      [first, today],
    ),
    query(
      "SELECT day,COUNT(*) AS count FROM site_analytics_visitors WHERE day >= $1 AND day <= $2 GROUP BY day",
      [first, today],
    ),
    query(
      "SELECT COUNT(*) AS count FROM site_analytics_visitors WHERE last_seen >= $1",
      [new Date(now.getTime() - 300000).toISOString()],
    ),
    query("SELECT MIN(day) AS day FROM site_analytics_metrics"),
  ]);
  const aggregate = (dimension: string, event = "pageview") => {
    const counts = new Map<string, number>();
    for (const row of metrics)
      if (row.dimension === dimension && row.event === event) {
        const key = String(row.value);
        counts.set(key, (counts.get(key) || 0) + Number(row.count));
      }
    return [...counts]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  };
  const byDay = new Map(
    visitors.map((row) => [String(row.day), Number(row.count)]),
  );
  const daily = Array.from({ length: days }, (_, i) => {
    const date = new Date(start);
    date.setUTCDate(date.getUTCDate() + i);
    const day = date.toISOString().slice(0, 10);
    return {
      day,
      views: metrics
        .filter(
          (r) =>
            r.day === day && r.dimension === "total" && r.event === "pageview",
        )
        .reduce((sum, r) => sum + Number(r.count), 0),
      visitors: byDay.get(day) || 0,
    };
  });
  const conversions = [
    "appointment_click",
    "phone_click",
    "email_click",
    "chat_open",
  ].map((name) => ({
    name,
    count: aggregate("total", name).reduce((sum, item) => sum + item.count, 0),
  }));
  return {
    days,
    views: aggregate("total").reduce((sum, item) => sum + item.count, 0),
    visitorDays: visitors.reduce((sum, row) => sum + Number(row.count), 0),
    active: Number(active[0]?.count || 0),
    conversions,
    daily,
    pages: aggregate("page").slice(0, 12),
    sources: aggregate("source"),
    devices: aggregate("device"),
    countries: aggregate("country"),
    firstRecordedDay: firstRecorded[0]?.day
      ? String(firstRecorded[0].day)
      : null,
  };
}
