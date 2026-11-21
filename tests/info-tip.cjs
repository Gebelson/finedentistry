const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");
const { mount } = require("./component-fixture.cjs");

(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const errors = [];
  async function fixture(context, long = false) {
    const page = await context.newPage();
    page.setDefaultTimeout(2500);
    page.on("pageerror", (error) => errors.push(error.message));
    await mount(page, "components/admin/info-tip.tsx", "HeadingInfo", {
      props: {
        title: "Appointments",
        id: "appointments-heading",
        level: 1,
        children: long
          ? "Long explanation. ".repeat(300)
          : "Internal planning details.",
      },
    });
    await page.evaluate(() => {
      const viewport = document.createElement("meta");
      viewport.name = "viewport";
      viewport.content = "width=device-width,initial-scale=1";
      document.head.append(viewport);
    });
    await page.addStyleTag({
      content: fs.readFileSync(
        path.resolve(__dirname, "../components/admin/info-tip.css"),
        "utf8",
      ),
    });
    return page;
  }
  try {
    const desktop = await browser.newContext({
      viewport: { width: 1280, height: 700 },
    });
    const page = await fixture(desktop);
    assert.equal(
      await page
        .getByRole("heading", { name: "Appointments", exact: true, level: 1 })
        .count(),
      1,
    );
    assert.equal(
      await page
        .getByRole("heading", { name: "Appointments", exact: true })
        .getAttribute("id"),
      "appointments-heading",
    );
    const button = page.getByRole("button", {
      name: "About Appointments",
      exact: true,
    });
    const tip = page.getByRole("tooltip");
    assert.equal(await tip.count(), 0);
    await button.hover();
    await tip.waitFor();
    assert.equal(
      await button.getAttribute("aria-describedby"),
      await tip.getAttribute("id"),
    );
    await tip.hover();
    assert.equal(await tip.isVisible(), true);
    assert.equal(
      await tip.evaluate((node) => node.parentElement === document.body),
      true,
    );
    await page.mouse.move(900, 600);
    await tip.waitFor({ state: "detached" });
    await button.focus();
    await tip.waitFor();
    await page.keyboard.press("Escape");
    await tip.waitFor({ state: "detached" });
    assert.equal(
      await button.evaluate((node) => node === document.activeElement),
      true,
    );
    await button.press("Tab");
    await button.focus();
    await tip.waitFor();
    await page.mouse.click(900, 600);
    await tip.waitFor({ state: "detached" });

    // A keyboard-focused trigger can scroll offscreen while its explanation stays open.
    await page.evaluate(() => {
      document.body.style.minHeight = "2000px";
      document.getElementById("root").style.marginTop = "100px";
    });
    await button.focus();
    await tip.waitFor();
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForFunction(
      () =>
        document
          .querySelector(".workspace-info-tip-trigger")
          .getBoundingClientRect().bottom < 0,
    );
    const scrolledTip = await tip.boundingBox();
    assert.ok(scrolledTip.y >= 0 && scrolledTip.y + scrolledTip.height <= 700);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.keyboard.press("Escape");

    // Specificity must survive the admin's container-level button rules.
    await page.evaluate(() =>
      document.getElementById("root").classList.add("workspace-connections"),
    );
    await page.addStyleTag({
      content:
        ".workspace-connections button{width:100%;min-height:60px;padding:20px;background:red;border-radius:0}",
    });
    const desktopBox = await button.boundingBox();
    assert.equal(desktopBox.width, 24);
    assert.equal(desktopBox.height, 24);
    await page.setViewportSize({ width: 1024, height: 700 });
    const tabletBox = await button.boundingBox();
    assert.equal(tabletBox.width, 44);
    assert.equal(tabletBox.height, 44);
    await desktop.close();

    const mobile = await browser.newContext({
      viewport: { width: 320, height: 480 },
      isMobile: true,
      hasTouch: true,
    });
    const small = await fixture(mobile, true);
    await small.addStyleTag({
      content:
        "#root{position:fixed;right:0;bottom:0;width:210px;height:52px;overflow:hidden}body{margin:0}",
    });
    const touchButton = small.getByRole("button", {
      name: "About Appointments",
      exact: true,
    });
    const touchTip = small.getByRole("tooltip");
    const touchBox = await touchButton.boundingBox();
    assert.ok(touchBox.width >= 44 && touchBox.height >= 44);
    await touchButton.tap();
    await touchTip.waitFor();
    const bounds = await touchTip.boundingBox();
    assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= 320);
    assert.ok(bounds.y >= 0 && bounds.y + bounds.height <= 480);
    assert.equal(
      await touchTip.evaluate(
        (node) =>
          node.scrollHeight > node.clientHeight &&
          getComputedStyle(node).overflowY === "auto",
      ),
      true,
    );
    if (process.env.INFO_TIP_SCREENSHOT)
      await small.screenshot({ path: process.env.INFO_TIP_SCREENSHOT });
    await touchButton.tap();
    await touchTip.waitFor({ state: "detached" });
    await touchButton.tap();
    await touchTip.waitFor();
    await small.touchscreen.tap(5, 5);
    await touchTip.waitFor({ state: "detached" });
    await mobile.close();
    assert.deepEqual(errors, []);
    console.log(
      "Info tips: heading semantics, hover, focus, Escape, outside close, touch toggling, scoped controls and viewport-clamped scrollable portals passed.",
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
