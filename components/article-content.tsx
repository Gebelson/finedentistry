import { createElement, Fragment, type ReactNode } from "react";
import Link from "next/link";
import type { ArticleNode, BlogArticle } from "@/lib/blog-content";

const allowedTags = new Set([
  "p",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "ul",
  "ol",
  "li",
  "strong",
  "em",
  "br",
  "sup",
  "sub",
  "blockquote",
  "hr",
  "thead",
  "tbody",
  "tfoot",
  "tr",
  "th",
  "td",
  "caption",
]);

function renderNodes(nodes: ArticleNode[]): ReactNode {
  return nodes.map((node, index) => {
    if (typeof node === "string") return node;
    const children = renderNodes(node.children);
    if (node.tag === "a") {
      if (
        !node.href ||
        !/^(https?:\/\/|mailto:|tel:|\/(?!\/)|#)/i.test(node.href)
      )
        return <Fragment key={index}>{children}</Fragment>;
      const props = {
        id: node.id,
        href: node.href,
        ...(node.newTab
          ? { target: "_blank", rel: "noopener noreferrer" }
          : {}),
      };
      return node.href.startsWith("/") ? (
        <Link key={index} {...props}>
          {children}
        </Link>
      ) : (
        <a key={index} {...props}>
          {children}
        </a>
      );
    }
    if (node.tag === "table") {
      return (
        <div className="article-table-wrap" key={index}>
          <p className="article-table-hint">
            Scroll horizontally to view the full table.
          </p>
          <div
            className="article-table-scroll"
            role="region"
            aria-label="Article table"
            tabIndex={0}
          >
            <table id={node.id}>{children}</table>
          </div>
        </div>
      );
    }
    if (!allowedTags.has(node.tag))
      return <Fragment key={index}>{children}</Fragment>;
    return createElement(
      node.tag,
      {
        key: index,
        id: node.id,
        ...(["th", "td"].includes(node.tag)
          ? {
              colSpan: node.colSpan,
              rowSpan: node.rowSpan,
              ...(node.tag === "th" ? { scope: node.scope } : {}),
            }
          : {}),
      },
      ["br", "hr"].includes(node.tag) ? undefined : children,
    );
  });
}

export function ArticleMeta({ article }: { article: BlogArticle }) {
  if (!article.author && !article.published) return null;
  return (
    <div className="article-meta">
      {article.author && <span>{article.author.label}</span>}
      {article.published && (
        <time dateTime={article.published}>
          {new Intl.DateTimeFormat("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
            timeZone: "UTC",
          }).format(new Date(article.published + "T00:00:00Z"))}
        </time>
      )}
    </div>
  );
}

export function ArticleContent({ article }: { article: BlogArticle }) {
  return (
    <>
      {renderNodes(article.nodes)}
      {article.author && (
        <section
          className="article-author"
          aria-labelledby="article-author-heading"
        >
          <h2 id="article-author-heading">Blog Post Author</h2>
          {renderNodes(article.author.nodes)}
          {article.author.url && (
            <a
              href={article.author.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              Contributor website ↗
            </a>
          )}
        </section>
      )}
    </>
  );
}
