import type { ArticleNode } from "./blog-content";

export const articleTags = new Set([
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
  "a",
  "table",
  "thead",
  "tbody",
  "tfoot",
  "tr",
  "th",
  "td",
  "caption",
  "img",
]);
export const safeArticleLink = (href: string) =>
  /^(https?:\/\/|mailto:|tel:|\/(?!\/)|#)/i.test(href);
export const safeArticleImage = (src: string) =>
  /^\/(?:images\/|api\/media\/file\/)[^<>"\s]+$/i.test(src);
const escape = (text: string) =>
  text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

export function articleHTML(nodes: ArticleNode[]): string {
  return nodes
    .map((node) => {
      if (typeof node === "string") return escape(node);
      if (!articleTags.has(node.tag)) return articleHTML(node.children || []);
      const attrs: string[] = [];
      if (node.tag === "a" && node.href && safeArticleLink(node.href))
        attrs.push(
          `href="${escape(node.href)}"`,
          ...(node.newTab
            ? ['target="_blank"', 'rel="noopener noreferrer"']
            : []),
        );
      if (node.tag === "img" && node.src && safeArticleImage(node.src))
        attrs.push(
          `src="${escape(node.src)}"`,
          `alt="${escape(node.alt || "")}"`,
        );
      if (node.tag === "img" && !attrs.length) return "";
      for (const [key, value] of [
        ["colspan", node.colSpan],
        ["rowspan", node.rowSpan],
        ["scope", node.scope],
      ] as const)
        if (value) attrs.push(`${key}="${escape(String(value))}"`);
      const open = `<${node.tag}${attrs.length ? " " + attrs.join(" ") : ""}>`;
      return ["img", "br", "hr"].includes(node.tag)
        ? open
        : `${open}${articleHTML(node.children || [])}</${node.tag}>`;
    })
    .join("");
}

export function validArticleAST(value: unknown, depth = 0): boolean {
  if (!Array.isArray(value) || depth > 30 || value.length > 10000) return false;
  return value.every(
    (node) =>
      typeof node === "string" ||
      (node &&
        typeof node === "object" &&
        articleTags.has(node.tag) &&
        (!node.href ||
          (typeof node.href === "string" && safeArticleLink(node.href))) &&
        (!node.src ||
          (typeof node.src === "string" && safeArticleImage(node.src))) &&
        validArticleAST(node.children || [], depth + 1)),
  );
}

export function parseArticleHTML(html: string): ArticleNode[] {
  const root = new DOMParser().parseFromString(html, "text/html");
  function walk(parent: Node): ArticleNode[] {
    return Array.from(parent.childNodes).flatMap((node): ArticleNode[] => {
      if (node.nodeType === Node.TEXT_NODE) return [node.textContent || ""];
      if (!(node instanceof Element)) return [];
      let tag = node.tagName.toLowerCase();
      if (tag === "b") tag = "strong";
      if (tag === "i") tag = "em";
      if (["script", "style", "iframe", "object"].includes(tag)) return [];
      if (!articleTags.has(tag)) return walk(node);
      const item: Exclude<ArticleNode, string> = { tag, children: walk(node) };
      const href = node.getAttribute("href");
      if (tag === "a" && href && safeArticleLink(href)) {
        item.href = href;
        item.newTab = node.getAttribute("target") === "_blank";
      }
      if (tag === "img") {
        const src = node.getAttribute("src") || "";
        if (!safeArticleImage(src)) return [];
        item.src = src;
        item.alt = node.getAttribute("alt") || "";
      }
      if (["th", "td"].includes(tag)) {
        item.colSpan = Number(node.getAttribute("colspan")) || undefined;
        item.rowSpan = Number(node.getAttribute("rowspan")) || undefined;
        if (tag === "th") item.scope = "col";
      }
      return [item];
    });
  }
  return walk(root.body);
}
