import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { chromium } from "playwright";
import records from "../data/content.json" with { type: "json" };
const cache =
  process.env.BLOG_SOURCE_CACHE || path.resolve(".cache/blog-source");

async function main() {
  fs.mkdirSync(cache, { recursive: true });
  const posts = records.filter((page) => page.slug.startsWith("blog/"));
  const routes = Object.fromEntries(
    records.map((page) => [
      new URL(page.source).pathname.replace(/\/+$/, "").toLowerCase(),
      "/" + page.slug,
    ]),
  );
  routes["/blog"] = "/blog";
  routes[""] = "/";
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const articles = {};
  const failures = [];
  let cursor = 0;
  try {
    await Promise.all(
      Array.from({ length: 4 }, async () => {
        const page = await browser.newPage();
        while (cursor < posts.length) {
          const post = posts[cursor++];
          try {
            const filename = path.join(
              cache,
              crypto
                .createHash("sha256")
                .update(post.source)
                .digest("hex")
                .slice(0, 20) + ".html",
            );
            let html;
            if (fs.existsSync(filename))
              html = fs.readFileSync(filename, "utf8");
            else {
              let response;
              for (let attempt = 0; attempt < 3; attempt++) {
                response = await fetch(post.source, {
                  signal: AbortSignal.timeout(30000),
                });
                if (response.ok) break;
                if (![429, 500, 502, 503, 504].includes(response.status)) break;
                await new Promise((resolve) =>
                  setTimeout(resolve, 1000 * (attempt + 1)),
                );
              }
              if (!response.ok) throw new Error(`HTTP ${response.status}`);
              html = await response.text();
              if (!html.includes('class="post-content"'))
                throw new Error("Missing article body");
              fs.writeFileSync(filename, html);
            }
            const article = await page.evaluate(
              ({ html, source, routes }) => {
                const doc = new DOMParser().parseFromString(html, "text/html");
                const content = doc.querySelector(".post-content");
                if (!content) throw new Error("Missing article body");
                const tags = new Set([
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
                  "a",
                  "br",
                  "sup",
                  "sub",
                  "blockquote",
                  "hr",
                  "table",
                  "thead",
                  "tbody",
                  "tfoot",
                  "tr",
                  "th",
                  "td",
                  "caption",
                ]);
                const excluded = new Set([
                  "SCRIPT",
                  "STYLE",
                  "IFRAME",
                  "FORM",
                  "INPUT",
                  "BUTTON",
                  "NOSCRIPT",
                  "SVG",
                  "IMG",
                ]);
                const clean = (text) => text.replace(/\s+/g, " ").trim();
                const href = (raw) => {
                  if (!raw) return undefined;
                  try {
                    const url = new URL(raw, source);
                    if (
                      !["https:", "http:", "mailto:", "tel:"].includes(
                        url.protocol,
                      )
                    )
                      return undefined;
                    if (
                      [
                        "finedentistryorlando.com",
                        "www.finedentistryorlando.com",
                      ].includes(url.hostname)
                    ) {
                      const mapped =
                        routes[url.pathname.replace(/\/+$/, "").toLowerCase()];
                      if (mapped) return mapped + url.search + url.hash;
                    }
                    return url.href;
                  } catch {
                    return undefined;
                  }
                };
                function children(element) {
                  return Array.from(element.childNodes).flatMap(serialize);
                }
                function serialize(node) {
                  if (node.nodeType === Node.TEXT_NODE) {
                    const value = node.textContent.replace(/\s+/g, " ");
                    if (
                      !value.trim() &&
                      /^(TABLE|THEAD|TBODY|TFOOT|TR|UL|OL)$/.test(
                        node.parentElement?.tagName || "",
                      )
                    )
                      return [];
                    return [value];
                  }
                  if (
                    node.nodeType !== Node.ELEMENT_NODE ||
                    excluded.has(node.tagName)
                  )
                    return [];
                  let tag = node.tagName.toLowerCase();
                  if (tag === "b") tag = "strong";
                  if (tag === "i") tag = "em";
                  const nested = children(node);
                  if (!tags.has(tag)) return nested;
                  if (
                    !["br", "hr"].includes(tag) &&
                    !nested.some(
                      (child) => typeof child !== "string" || child.trim(),
                    )
                  )
                    return [];
                  const result = { tag, children: nested };
                  const id =
                    node.getAttribute("id") || node.getAttribute("name");
                  if (id && /^[a-zA-Z][\w:.-]*$/.test(id)) result.id = id;
                  if (tag === "a") {
                    result.href = href(node.getAttribute("href"));
                    if (node.getAttribute("target") === "_blank")
                      result.newTab = true;
                  }
                  if (["td", "th"].includes(tag)) {
                    for (const [attribute, property] of [
                      ["colspan", "colSpan"],
                      ["rowspan", "rowSpan"],
                    ]) {
                      const value = Number(node.getAttribute(attribute));
                      if (Number.isInteger(value) && value > 1 && value <= 100)
                        result[property] = value;
                    }
                    if (tag === "th")
                      result.scope =
                        node.getAttribute("scope") ||
                        (node.closest("thead") ||
                        node.parentElement ===
                          node.closest("table")?.querySelector("tr")
                          ? "col"
                          : "row");
                  }
                  return [result];
                }
                const author = doc.querySelector(".post-author");
                const details =
                  author?.querySelector(".media-heading") ||
                  author?.querySelector(".media-body");
                const authorNodes = details ? children(details) : [];
                const label = details
                  ? clean(
                      (details.querySelector("p, h3, h4, strong") || details)
                        .textContent,
                    )
                  : "";
                const authorLink = author?.querySelector("a[href]");
                const published = clean(
                  doc.querySelector(".published")?.textContent || "",
                );
                const date = published.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
                return {
                  source,
                  nodes: children(content),
                  ...(label && {
                    author: {
                      label,
                      nodes: authorNodes,
                      ...(authorLink && {
                        url: href(authorLink.getAttribute("href")),
                      }),
                    },
                  }),
                  ...(date && {
                    published: `${date[3]}-${date[1].padStart(2, "0")}-${date[2].padStart(2, "0")}`,
                  }),
                  sourceLinks: Array.from(
                    content.querySelectorAll("a[href]"),
                  ).map((a) => ({
                    text: clean(a.textContent),
                    original: new URL(a.getAttribute("href"), source).href,
                    destination: href(a.getAttribute("href")),
                  })),
                  tableCount: content.querySelectorAll("table").length,
                };
              },
              { html, source: post.source, routes },
            );
            articles[post.slug] = article;
            if (Object.keys(articles).length % 40 === 0)
              console.log(
                `Restored ${Object.keys(articles).length}/${posts.length} articles`,
              );
          } catch (error) {
            failures.push({
              slug: post.slug,
              source: post.source,
              error: error.message,
            });
          }
        }
        await page.close();
      }),
    );
  } finally {
    await browser.close();
  }
  if (failures.length) throw new Error(JSON.stringify(failures));
  const ordered = Object.fromEntries(
    posts.map((post) => [post.slug, articles[post.slug]]),
  );
  fs.writeFileSync(
    "data/blog-content.json",
    JSON.stringify(ordered, null, 2) + "\n",
  );
  const summary = {
    checkedAt: new Date().toISOString(),
    articles: posts.length,
    links: Object.values(ordered).reduce(
      (sum, a) => sum + a.sourceLinks.length,
      0,
    ),
    tables: Object.values(ordered).reduce((sum, a) => sum + a.tableCount, 0),
    withAuthor: Object.values(ordered).filter((a) => a.author).length,
    withoutAuthor: Object.entries(ordered)
      .filter(([, a]) => !a.author)
      .map(([slug]) => slug),
    posts: Object.entries(ordered).map(([slug, a]) => ({
      slug,
      source: a.source,
      links: a.sourceLinks.length,
      tables: a.tableCount,
      author: a.author?.label || null,
    })),
  };
  fs.writeFileSync(
    "research/blog-rich-content-audit.json",
    JSON.stringify(summary, null, 2) + "\n",
  );
  console.log(
    JSON.stringify({
      articles: summary.articles,
      links: summary.links,
      tables: summary.tables,
      withAuthor: summary.withAuthor,
      missingAuthor: summary.withoutAuthor.length,
    }),
  );
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
