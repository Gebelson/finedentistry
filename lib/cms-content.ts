import "server-only";
import { unstable_cache } from "next/cache";
import { getPayload } from "payload";
import type { ArticleNode, BlogArticle } from "./blog-content";
import { homeDefaults } from "@/cms/home-defaults";

type ImageReference =
  number | { url?: string | null; alt?: string | null } | null;
export type HomeContent = {
  [K in keyof typeof homeDefaults]: (typeof homeDefaults)[K] & {
    image?: ImageReference;
  };
};
export async function cmsPayload() {
  const { default: config } = await import("@payload-config");
  return getPayload({ config });
}
export const getHomeContent = unstable_cache(
  async (): Promise<HomeContent> => {
    const payload = await cmsPayload();
    const doc = await payload.findGlobal({
      slug: "home-page",
      depth: 1,
      draft: false,
    });
    return Object.fromEntries(
      Object.entries(homeDefaults).map(([key, value]) => [
        key,
        { ...value, ...doc[key as keyof typeof homeDefaults] },
      ]),
    ) as HomeContent;
  },
  ["clinic-home"],
  { tags: ["clinic-content"], revalidate: 3600 },
);

export const getPost = unstable_cache(
  async (slug: string) => {
    const payload = await cmsPayload();
    const result = await payload.find({
      collection: "posts",
      where: {
        and: [{ slug: { equals: slug } }, { _status: { equals: "published" } }],
      },
      draft: false,
      depth: 0,
      limit: 1,
    });
    return result.docs[0] || null;
  },
  ["clinic-post"],
  { tags: ["clinic-content"], revalidate: 3600 },
);

export const getJournal = unstable_cache(
  async () => {
    const payload = await cmsPayload();
    const result = await payload.find({
      collection: "posts",
      where: { _status: { equals: "published" } },
      draft: false,
      depth: 0,
      limit: 10000,
      sort: "-publishedAt",
    });
    return result.docs.map((doc) => ({
      slug: doc.slug,
      title: doc.title,
      excerpt: doc.excerpt || "",
      authorLabel: doc.authorLabel || "",
    }));
  },
  ["clinic-journal"],
  { tags: ["clinic-content"], revalidate: 3600 },
);

export function asBlogArticle(doc: {
  title: string;
  excerpt?: string | null;
  source?: string | null;
  body?: unknown;
  authorLabel?: string | null;
  authorContent?: unknown;
  authorURL?: string | null;
  publishedAt?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
}): BlogArticle {
  return {
    title: doc.title,
    excerpt: doc.excerpt || "",
    source: doc.source || "",
    nodes: (doc.body || []) as ArticleNode[],
    published: doc.publishedAt?.slice(0, 10),
    seoTitle: doc.seoTitle || undefined,
    seoDescription: doc.seoDescription || undefined,
    ...(doc.authorLabel
      ? {
          author: {
            label: doc.authorLabel,
            nodes: (doc.authorContent || []) as ArticleNode[],
            url: doc.authorURL || undefined,
          },
        }
      : {}),
  };
}
export function mediaSource(
  image: ImageReference | undefined,
  fallback: string,
) {
  return image && typeof image === "object" && image.url ? image.url : fallback;
}
export function mediaAlt(image: ImageReference | undefined, fallback: string) {
  return image && typeof image === "object" && image.alt ? image.alt : fallback;
}
