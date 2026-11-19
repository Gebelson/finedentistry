import records from "@/data/blog-content.json";

export type ArticleNode =
  | string
  | {
      tag: string;
      children: ArticleNode[];
      href?: string;
      newTab?: boolean;
      id?: string;
      colSpan?: number;
      rowSpan?: number;
      scope?: "row" | "col" | "rowgroup" | "colgroup";
      src?: string;
      alt?: string;
    };

export type BlogArticle = {
  title?: string;
  excerpt?: string;
  seoTitle?: string;
  seoDescription?: string;
  source: string;
  nodes: ArticleNode[];
  published?: string;
  author?: { label: string; nodes: ArticleNode[]; url?: string };
};

const articles = records as unknown as Record<string, BlogArticle>;

export function getOriginalBlogArticle(slug: string): BlogArticle | undefined {
  return articles[slug];
}

export async function getBlogArticle(
  slug: string,
): Promise<BlogArticle | undefined> {
  const { getPost, asBlogArticle } = await import("./cms-content");
  const post = await getPost(slug);
  return post ? asBlogArticle(post) : undefined;
}
