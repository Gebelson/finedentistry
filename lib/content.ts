import records from "@/data/content.json";
import serviceCovers from "@/data/service-covers.json";
export const pages = records.map((page) => ({
  ...page,
  ...serviceCovers[page.slug as keyof typeof serviceCovers],
}));
export const technologies = pages.filter((p) =>
  p.slug.startsWith("technology/"),
);
export const sourceFAQs: { q: string; a: string; list: string[] }[] = [];
for (const section of pages.find((p) => p.slug === "faq")?.sections || []) {
  if (/^H[23]$/.test(section.tag))
    sourceFAQs.push({ q: section.text, a: "", list: [] });
  else if (sourceFAQs.length && section.tag === "P")
    sourceFAQs[sourceFAQs.length - 1].a +=
      (sourceFAQs[sourceFAQs.length - 1].a ? "\n\n" : "") + section.text;
  else if (sourceFAQs.length && ["UL", "OL"].includes(section.tag))
    sourceFAQs[sourceFAQs.length - 1].list.push(...section.items);
}
export { siteConfig } from "./site-data";
