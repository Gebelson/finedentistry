const assert = require("node:assert/strict");
const { chromium } = require("playwright");
const { mount } = require("./component-fixture.cjs");
(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  let offline = true;
  await page.route("**/api/media?*", (route) =>
    offline
      ? route.abort("failed")
      : route.fulfill({
          json: {
            docs: [
              {
                id: 1,
                url: "/images/editor-test.png",
                alt: "Image verification",
              },
            ],
            totalPages: 1,
          },
        }),
  );
  try {
    await mount(page, "components/admin/rich-editor.tsx", "ArticleEditor", {
      body: [
        {
          tag: "p",
          children: [
            "Format ",
            { tag: "sup", children: ["2"] },
            " and ",
            { tag: "sub", children: ["3"] },
          ],
        },
      ],
    });
    const editor = page.getByRole("textbox", { name: "Article content" });
    await editor.waitFor();
    assert.equal(
      await editor.locator("sup").textContent({ timeout: 1500 }),
      "2",
      "Superscripts from original articles must survive editing",
    );
    assert.equal(await editor.locator("sub").textContent(), "3");
    await editor.press("Control+End");
    await editor.pressSequentially(" Added.");
    const value = await page.evaluate(() => window.savedArticle);
    assert.match(JSON.stringify(value), /"tag":"sup"/);
    assert.match(JSON.stringify(value), /"tag":"sub"/);
    page.once("dialog", (dialog) => dialog.accept("javascript:alert(1)"));
    await page.getByRole("button", { name: "Link", exact: true }).click();
    await page
      .getByRole("alert")
      .filter({ hasText: /valid link/i })
      .waitFor();
    await page.getByRole("button", { name: "Image", exact: true }).click();
    const library = page.getByRole("dialog", {
      name: "Choose a website image",
    });
    await library.getByRole("alert").waitFor();
    offline = false;
    await library
      .getByRole("button", { name: "Refresh image library" })
      .click();
    await library.getByRole("button", { name: "Image verification" }).click();
    await library.waitFor({ state: "hidden" });
    assert.match(
      JSON.stringify(await page.evaluate(() => window.savedArticle)),
      /editor-test.png/,
    );
    assert.deepEqual(errors, []);
    console.log(
      "PASS original superscript/subscript survives editing; unsafe link feedback; image library retries and inserts image without record mutations.",
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
