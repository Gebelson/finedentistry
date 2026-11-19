export const analyticsEvents = [
  "pageview",
  "appointment_click",
  "phone_click",
  "email_click",
  "chat_open",
] as const;
export type AnalyticsEvent = (typeof analyticsEvents)[number];
export type AnalyticsSource =
  | "direct"
  | "google"
  | "bing"
  | "yahoo"
  | "duckduckgo"
  | "facebook"
  | "instagram"
  | "linkedin"
  | "other";
export type AnalyticsSummary = {
  days: number;
  views: number;
  visitorDays: number;
  active: number;
  conversions: { name: string; count: number }[];
  daily: { day: string; views: number; visitors: number }[];
  pages: { name: string; count: number }[];
  sources: { name: string; count: number }[];
  devices: { name: string; count: number }[];
  countries: { name: string; count: number }[];
  firstRecordedDay: string | null;
};
export function referralSource(hostname: string): AnalyticsSource {
  const host = hostname.toLowerCase();
  if (!host) return "direct";
  if (/(^|\.)google\.[a-z.]+$/.test(host)) return "google";
  for (const source of [
    "bing",
    "yahoo",
    "duckduckgo",
    "facebook",
    "instagram",
    "linkedin",
  ] as const)
    if (host === source + ".com" || host.endsWith("." + source + ".com"))
      return source;
  return "other";
}
