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
    };

export type BlogArticle = {
  source: string;
  nodes: ArticleNode[];
  published?: string;
  author?: { label: string; nodes: ArticleNode[]; url?: string };
};

const articles = records as unknown as Record<string, BlogArticle>;

export function getBlogArticle(slug: string): BlogArticle | undefined {
  return articles[slug];
}
