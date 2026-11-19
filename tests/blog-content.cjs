const assert = require("node:assert/strict");
const { chromium } = require("playwright");
const { AxeBuilder } = require("@axe-core/playwright");
const records = require("../data/content.json");
const articles = require("../data/blog-content.json");
const base = process.env.TEST_URL || "http://127.0.0.1:3000";
const sample =
  "blog/dental-bridge-vs-dental-implant-which-is-better-for-a-missing-tooth";
const flatText = (nodes) =>
  nodes
    .map((n) => (typeof n === "string" ? n : flatText(n.children)))
    .join("")
    .replace(/\s+/g, " ")
    .trim();
function flatten(nodes) {
  return nodes.flatMap((node) =>
    typeof node === "string" ? [] : [node, ...flatten(node.children)],
  );
}

(async () => {
  const posts = records.filter((p) => p.slug.startsWith("blog/"));
  assert.equal(Object.keys(articles).length, posts.length);
  let tables = 0;
  let links = 0;
  for (const post of posts) {
    const article = articles[post.slug];
    assert.equal(article.source, post.source);
    const nodes = flatten(article.nodes);
    const anchors = nodes.filter((n) => n.tag === "a" && n.href);
    assert.equal(
      nodes.filter((n) => n.tag === "table").length,
      article.tableCount,
      post.slug,
    );
    assert.ok(
      !nodes.some((n) => ["script", "style", "iframe", "form"].includes(n.tag)),
      post.slug,
    );
    for (const source of article.sourceLinks.filter(
      (l) => l.text && l.destination,
    )) {
      assert.ok(
        anchors.some(
          (a) =>
            a.href === source.destination &&
            flatText(a.children) === source.text,
        ),
        `${post.slug}: missing ${source.text}`,
      );
    }
    for (const a of anchors)
      assert.match(a.href, /^(https?:\/\/|mailto:|tel:|\/(?!\/)|#)/i);
    tables += article.tableCount;
    links += anchors.length;
  }
  assert.equal(tables, 15);
  console.log(
    `PASS ${posts.length} articles: source links, ${tables} tables, safe markup (${links} rendered links)`,
  );

  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  try {
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`${base}/${sample}`, { waitUntil: "domcontentloaded" });
      await page.locator(".prose table").waitFor({ state: "visible" });
      await page.waitForTimeout(1200);
      assert.equal(await page.locator(".prose table").count(), 1);
      assert.deepEqual(
        await page.locator(".prose table th").allTextContents(),
        ["Consideration", "Bridge", "Implant"],
      );
      assert.equal(
        await page
          .locator('.prose a[href="/services/dental-implants"]')
          .count(),
        1,
      );
      assert.match(
        await page.locator(".article-meta").innerText(),
        /Contributed by DentalROI/,
      );
      assert.equal(
        await page.locator(".article-meta time").getAttribute("datetime"),
        "2026-11-13",
      );
      assert.match(
        await page.locator(".article-author").innerText(),
        /Contributed by DentalROI/,
      );
      assert.match(
        await page.locator(".article-author").innerText(),
        /not intended as a substitute for professional medical advice/,
      );
      assert.equal(
        await page
          .locator('.article-author a[href="https://www.dentalroi.com/"]')
          .count(),
        1,
      );
      assert.match(
        await page.locator(".prose").innerText(),
        /reviewed by the dental team/,
      );
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `overflow at ${width}`,
      );
      const table = page.locator(".article-table-scroll");
      await table.scrollIntoViewIfNeeded();
      if (width < 768) {
        const result = await table.evaluate((element) => {
          element.scrollLeft = element.scrollWidth;
          return {
            moved: element.scrollLeft > 0,
            bar: getComputedStyle(element).scrollbarWidth,
          };
        });
        assert.ok(result.moved);
        assert.equal(result.bar, "none");
      }
      if ([390, 1440].includes(width)) {
        const axe = await new AxeBuilder({ page }).include(".prose").analyze();
        assert.deepEqual(
          axe.violations.map((v) => v.id),
          [],
        );
      }
      console.log(
        `PASS links, table, byline, original disclaimer and responsive layout at ${width}px`,
      );
    }
    const oldPost = "blog/the-tooth-fairy";
    await page.goto(`${base}/${oldPost}`);
    assert.equal(
      await page.locator(".article-author").count(),
      0,
      "Do not invent missing source attribution",
    );
    await page.goto(`${base}/blog`);
    assert.ok((await page.locator(".journal-byline").count()) > 0);
    assert.deepEqual(errors, []);
    console.log(
      "PASS journal bylines, empty source author and no browser runtime errors",
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
