import type { MetadataRoute } from "next";
import { pages } from "@/lib/content";
export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.SITE_URL;
  if (!base) return [];
  return [
    "/",
    ...pages.map((p) => "/" + p.slug),
    "/technology",
    "/privacy",
  ].map((route) => ({ url: new URL(route, base).href }));
}
