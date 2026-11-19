import type { MetadataRoute } from "next";
import { pages } from "@/lib/content";
import { getJournal } from "@/lib/cms-content";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.SITE_URL;
  if (!base) return [];
  return [
    "/",
    ...pages
      .filter((p) => !p.slug.startsWith("blog/"))
      .map((p) => "/" + p.slug),
    ...(await getJournal()).map((p) => "/" + p.slug),
    "/technology",
    "/privacy",
  ].map((route) => ({ url: new URL(route, base).href }));
}
