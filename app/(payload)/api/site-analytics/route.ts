import { NextRequest } from "next/server";
import { pages } from "@/lib/content";
import { cmsPayload, getPost } from "@/lib/cms-content";
import {
  analyticsEvents,
  type AnalyticsEvent,
  type AnalyticsSource,
} from "@/lib/analytics-types";
import { recordSiteMetric, siteAnalyticsSummary } from "@/lib/analytics-store";

const publicPaths = new Set([
  "/",
  "/technology",
  "/privacy",
  ...pages.map((page) => "/" + page.slug),
]);
const sources = new Set([
  "direct",
  "google",
  "bing",
  "yahoo",
  "duckduckgo",
  "facebook",
  "instagram",
  "linkedin",
  "other",
]);
const ok = () =>
  new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
export async function POST(request: NextRequest) {
  if (
    process.env.ANALYTICS_ENABLED === "false" ||
    request.headers.get("dnt") === "1" ||
    request.headers.get("sec-gpc") === "1"
  )
    return ok();
  if (request.headers.get("cookie")?.includes("payload-token=")) return ok();
  const origin = request.headers.get("origin");
  if (
    origin !== request.nextUrl.origin &&
    origin !== process.env.ADMIN_SERVER_URL
  )
    return new Response(null, { status: 403 });
  const agent = request.headers.get("user-agent") || "";
  if (/bot|crawler|spider|headless|lighthouse|pagespeed/i.test(agent))
    return ok();
  const raw = await request.text();
  if (raw.length > 1000) return new Response(null, { status: 413 });
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(raw);
  } catch {
    return new Response(null, { status: 400 });
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return new Response(null, { status: 400 });
  const event = String(body.event),
    path = String(body.path || "");
  if (
    ![...analyticsEvents, "heartbeat"].includes(event as AnalyticsEvent) ||
    path.length > 250 ||
    /[?#]/.test(path)
  )
    return new Response(null, { status: 400 });
  if (!publicPaths.has(path)) {
    if (/^\/blog\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(path)) {
      if (!(await getPost(path.slice(1)))) return ok();
    } else if (!/^\/blog\/page\/\d+$/.test(path)) return ok();
  }
  const source = (
    sources.has(String(body.source)) ? String(body.source) : "direct"
  ) as AnalyticsSource;
  const device =
    /ipad|tablet/i.test(agent) ||
    (/android/i.test(agent) && !/mobile/i.test(agent))
      ? "tablet"
      : /mobile|iphone|android/i.test(agent)
        ? "mobile"
        : "desktop";
  const country = request.headers.get("x-vercel-ip-country") || "";
  try {
    await recordSiteMetric({
      event: event as AnalyticsEvent | "heartbeat",
      path,
      source,
      device,
      country: /^[A-Z]{2}$/.test(country) ? country : "Unknown",
      ip:
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        "local",
      agent,
    });
  } catch {
    console.error("Website analytics storage is unavailable.");
    return new Response(null, { status: 503 });
  }
  return ok();
}
export async function GET(request: NextRequest) {
  const payload = await cmsPayload();
  const { user } = await payload.auth({ headers: request.headers });
  if (user?.role !== "admin")
    return Response.json(
      { error: "Administrator access required." },
      { status: 403 },
    );
  const days = Number(request.nextUrl.searchParams.get("days") || 30);
  return Response.json(await siteAnalyticsSummary(days), {
    headers: { "Cache-Control": "private, no-store" },
  });
}
