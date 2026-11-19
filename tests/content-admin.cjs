const assert = require("node:assert/strict");
const { chromium } = require("playwright");
const originals = require("../data/blog-content.json");
const base = process.env.TEST_URL || "http://127.0.0.1:3010";
const username = process.env.TEST_ADMIN_USERNAME;
const password = process.env.TEST_ADMIN_PASSWORD;
if (!username || !password)
  throw Error("Set test administrator credentials in the environment.");

(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const ctx = await browser.newContext({
    extraHTTPHeaders: { Origin: new URL(base).origin },
  });
  const page = await ctx.newPage();
  let fixture;
  let originalHome;
  try {
    const login = await ctx.request.post(`${base}/api/users/login`, {
      data: { username, password },
    });
    assert.equal(login.status(), 200);
    const imported = await ctx.request.get(
      `${base}/api/posts?limit=1000&depth=0`,
    );
    assert.equal(imported.status(), 200);
    const posts = (await imported.json()).docs;
    assert.ok(posts.length >= 222);
    for (const post of posts)
      if (originals[post.slug]) {
        assert.deepEqual(
          post.body,
          originals[post.slug].nodes,
          `Article structure: ${post.slug}`,
        );
        assert.deepEqual(
          post.authorContent || [],
          originals[post.slug].author?.nodes || [],
          `Author: ${post.slug}`,
        );
      }
    const slug = `blog/workspace-verification-${Date.now()}`;
    const body = [
      {
        tag: "p",
        children: [
          "Draft text ",
          { tag: "a", href: "/services", children: ["treatments"] },
        ],
      },
      {
        tag: "table",
        children: [
          {
            tag: "tbody",
            children: [
              {
                tag: "tr",
                children: [
                  { tag: "th", children: ["Heading"] },
                  { tag: "th", children: ["Details"] },
                ],
              },
              {
                tag: "tr",
                children: [
                  { tag: "td", children: ["First"] },
                  { tag: "td", children: ["Second"] },
                ],
              },
            ],
          },
        ],
      },
    ];
    const created = await ctx.request.post(`${base}/api/posts?draft=true`, {
      data: {
        title: "Workspace verification",
        slug,
        excerpt: "Verification only",
        body,
        authorLabel: "Verification author",
        publishedAt: new Date().toISOString(),
        _status: "draft",
      },
    });
    assert.equal(created.status(), 201, await created.text());
    fixture = (await created.json()).doc;
    assert.equal((await ctx.request.get(`${base}/${slug}`)).status(), 404);
    await page.goto(`${base}/workspace-preview?kind=post&slug=${slug}`);
    await page
      .getByRole("heading", { name: "Workspace verification", exact: true })
      .waitFor();
    assert.equal(await page.locator("table").count(), 1);
    await page.goto(`${base}/admin/collections/posts/${fixture.id}`);
    await page.locator('[contenteditable="true"]').first().waitFor();
    await page
      .locator('[contenteditable="true"]')
      .first()
      .press("Control+Home");
    await page
      .locator('[contenteditable="true"]')
      .first()
      .pressSequentially("UI editor verification. ");
    await page
      .locator(".clinic-rich-field")
      .first()
      .getByRole("button", { name: "Image", exact: true })
      .click();
    await page
      .locator(".clinic-media-dialog:modal .clinic-media-grid button")
      .first()
      .click();
    let savedDraft;
    for (let attempt = 0; attempt < 15; attempt++) {
      savedDraft = await (
        await ctx.request.get(`${base}/api/posts/${fixture.id}?draft=true`)
      ).json();
      if (
        JSON.stringify(savedDraft.body).includes("UI editor verification.") &&
        JSON.stringify(savedDraft.body).includes('"tag":"img"')
      )
        break;
      await page.waitForTimeout(500);
    }
    assert.match(
      JSON.stringify(savedDraft.body),
      /UI editor verification\./,
      "Rich editor changes must be saved",
    );
    assert.match(
      JSON.stringify(savedDraft.body),
      /"tag":"img"/,
      "Chosen image must be saved",
    );
    // Publish through the authenticated API, then verify the real public route.
    const published = await ctx.request.patch(
      `${base}/api/posts/${fixture.id}`,
      { data: { ...savedDraft, _status: "published" } },
    );
    assert.equal(published.status(), 200, await published.text());
    const publicPage = await ctx.request.get(`${base}/${slug}`);
    assert.equal(publicPage.status(), 200);
    assert.match(await publicPage.text(), /Workspace verification/);
    assert.match(await publicPage.text(), /UI editor verification\./);
    assert.match(
      await (await ctx.request.get(`${base}/blog`)).text(),
      /Workspace verification/,
    );
    const malformed = await ctx.request.patch(
      `${base}/api/posts/${fixture.id}`,
      { data: { body: [{ tag: "script", children: ["bad"] }] } },
    );
    assert.equal(malformed.status(), 400);
    originalHome = await (
      await ctx.request.get(`${base}/api/globals/home-page?draft=false&depth=0`)
    ).json();
    const changedHero = {
      ...originalHome.hero,
      line1: "Private draft verification.",
    };
    assert.equal(
      (
        await ctx.request.post(`${base}/api/globals/home-page?draft=true`, {
          data: { hero: changedHero, _status: "draft" },
        })
      ).status(),
      200,
    );
    assert.doesNotMatch(
      await (await ctx.request.get(base)).text(),
      /Private draft verification\./,
    );
    await page.goto(`${base}/workspace-preview?kind=home`);
    await page
      .getByText("Private draft verification.", { exact: true })
      .waitFor();
    const guest = await browser.newContext();
    try {
      assert.equal(
        (await guest.request.get(`${base}/api/posts`)).status(),
        403,
      );
      const response = await guest.request.get(
        `${base}/workspace-preview?kind=home`,
        { maxRedirects: 0 },
      );
      assert.ok([303, 307].includes(response.status()));
    } finally {
      await guest.close();
    }
    console.log(
      "PASS 222 article bodies/authors preserved; draft privacy; rich editor; links/table preview; real publish/new route/journal; unsafe content rejected; homepage draft preview.",
    );
  } finally {
    if (originalHome)
      await ctx.request.post(`${base}/api/globals/home-page`, {
        data: { ...originalHome, _status: "published" },
      });
    if (fixture) await ctx.request.delete(`${base}/api/posts/${fixture.id}`);
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
