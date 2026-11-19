import nextEnv from "@next/env";
import { readFileSync } from "node:fs";
import { existsSync } from "node:fs";
import path from "node:path";
import { doctors } from "../lib/site-data";
import { homeDefaults } from "../cms/home-defaults";
import { allowFreshLocalSchema } from "../cms/database-init";
nextEnv.loadEnvConfig(process.cwd(), true);
allowFreshLocalSchema();
const { getPayload } = await import("payload");
const { default: config } = await import("../payload.config");
const payload = await getPayload({ config });
try {
  const originals = JSON.parse(readFileSync("data/blog-content.json", "utf8"));
  const pages: { slug: string; title: string; paragraphs: string[] }[] =
    JSON.parse(readFileSync("data/content.json", "utf8"));
  let imported = 0;
  for (const [slug, value] of Object.entries(originals)) {
    const article = value as {
      nodes: unknown[];
      source: string;
      published?: string;
      author?: { label: string; nodes: unknown[]; url?: string };
    };
    const exists = await payload.count({
      collection: "posts",
      where: { slug: { equals: slug } },
    });
    if (exists.totalDocs) continue;
    const page = pages.find((p) => p.slug === slug);
    await payload.create({
      collection: "posts",
      context: { seedContent: true },
      data: {
        title: page?.title || slug.split("/").pop()!,
        slug,
        excerpt: page?.paragraphs[0] || "",
        body: article.nodes,
        source: article.source,
        authorLabel: article.author?.label,
        authorContent: article.author?.nodes,
        authorURL: article.author?.url,
        publishedAt: article.published
          ? `${article.published}T12:00:00.000Z`
          : undefined,
        _status: "published",
      },
    });
    imported++;
  }
  const home = await payload.findGlobal({ slug: "home-page" });
  if (!home.hero?.line1)
    await payload.updateGlobal({
      slug: "home-page",
      context: { seedContent: true },
      data: { ...homeDefaults, _status: "published" },
    });
  console.log(
    `Content ready: ${imported} articles imported; existing records preserved.`,
  );
  const images = [
    ["team-enhanced-v2.png", "Fine Dentistry of Downtown Orlando team"],
    ["Dentist_orlando.webp", "Dr. Trivedi speaking with a patient"],
    [
      "Dentist_orlando2.webp",
      "Dr. Trivedi reviewing a digital scan with a patient",
    ],
    ...doctors.map((doctor) => [doctor.image, doctor.name]),
  ];
  let mediaCount = 0;
  for (const [image, alt] of images) {
    const filePath = path.resolve("public/images", image);
    if (!existsSync(filePath)) continue;
    const existing = await payload.count({
      collection: "media",
      where: { alt: { equals: alt } },
    });
    if (!existing.totalDocs) {
      await payload.create({
        collection: "media",
        data: { alt },
        filePath,
        context: { seedContent: true },
      });
      mediaCount++;
    }
  }
  console.log(`Media library: ${mediaCount} existing clinic images added.`);
} finally {
  await payload.destroy();
}
