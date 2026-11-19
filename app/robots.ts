import type { MetadataRoute } from "next";
export default function robots(): MetadataRoute.Robots {
  return process.env.SITE_INDEXABLE === "true" && process.env.SITE_URL
    ? {
        rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api"] },
        sitemap: new URL("/sitemap.xml", process.env.SITE_URL).href,
      }
    : { rules: { userAgent: "*", disallow: "/" } };
}
