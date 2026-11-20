const assert = require("node:assert/strict");
const { randomBytes } = require("node:crypto");
const { chromium } = require("playwright");
const base = process.env.TEST_URL || "http://127.0.0.1:3010";
(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const context = await browser.newContext({
    extraHTTPHeaders: { Origin: base },
  });
  const ids = [];
  let contact;
  let editor;
  try {
    assert.equal(
      (
        await context.request.post(`${base}/api/users/login`, {
          data: {
            username: process.env.TEST_ADMIN_USERNAME,
            password: process.env.TEST_ADMIN_PASSWORD,
          },
        })
      ).status(),
      200,
    );
    const createdContact = await context.request.post(`${base}/api/contacts`, {
      data: {
        name: "Calendar verification",
        email: "calendar-check@example.invalid",
        source: "website",
      },
    });
    assert.equal(createdContact.status(), 201);
    contact = (await createdContact.json()).doc;
    const now = new Date(),
      start = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 15, 15),
      ),
      end = new Date(start.getTime() + 3600000);
    const data = {
      contactName: "Calendar verification",
      contact: contact.id,
      doctor: "trivedi",
      startsAt: start.toISOString(),
      endsAt: end.toISOString(),
      status: "scheduled",
    };
    const created = await context.request.post(`${base}/api/appointments`, {
      data,
    });
    assert.equal(created.status(), 201, await created.text());
    const appointment = (await created.json()).doc;
    ids.push(appointment.id);
    const conflict = await context.request.post(`${base}/api/appointments`, {
      data: {
        ...data,
        startsAt: new Date(start.getTime() + 900000).toISOString(),
      },
    });
    assert.equal(conflict.status(), 409, await conflict.text());
    const other = await context.request.post(`${base}/api/appointments`, {
      data: { ...data, doctor: "perez" },
    });
    assert.equal(other.status(), 201);
    ids.push((await other.json()).doc.id);
    const invalid = await context.request.post(`${base}/api/appointments`, {
      data: { ...data, endsAt: start.toISOString() },
    });
    assert.equal(invalid.status(), 400);
    const page = await context.newPage();
    await page.goto(`${base}/admin/calendar`);
    await page.getByRole("heading", { name: "Appointments" }).waitFor();
    await page
      .locator(".calendar-event")
      .filter({ hasText: "Calendar verification" })
      .first()
      .waitFor();
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
    );
    const editedContact = await context.request.patch(
      `${base}/api/contacts/${contact.id}`,
      {
        data: { preferredContact: "email", phone: "4075550100" },
      },
    );
    assert.equal(editedContact.status(), 200);
    const persistedContact = await (
      await context.request.get(`${base}/api/contacts/${contact.id}`)
    ).json();
    assert.equal(persistedContact.preferredContact, "email");
    assert.equal(persistedContact.phone, "4075550100");
    assert.equal(
      (
        await context.request.patch(
          `${base}/api/appointments/${appointment.id}`,
          { data: { status: "completed" } },
        )
      ).status(),
      200,
    );
    assert.equal(
      (
        await (
          await context.request.get(
            `${base}/api/appointments/${appointment.id}`,
          )
        ).json()
      ).status,
      "completed",
    );
    const guest = await browser.newContext();
    try {
      assert.equal(
        (await guest.request.get(`${base}/api/appointments`)).status(),
        403,
      );
      assert.equal(
        (await guest.request.get(`${base}/api/contacts`)).status(),
        403,
      );
    } finally {
      await guest.close();
    }
    const editorPassword = randomBytes(24).toString("hex");
    const user = await context.request.post(`${base}/api/users`, {
      data: {
        name: "Editor calendar access check",
        email: "calendar-editor@example.invalid",
        password: editorPassword,
        role: "editor",
      },
    });
    assert.equal(user.status(), 201);
    editor = (await user.json()).doc;
    const limited = await browser.newContext({
      extraHTTPHeaders: { Origin: base },
    });
    try {
      await limited.request.post(`${base}/api/users/login`, {
        data: {
          email: "calendar-editor@example.invalid",
          password: editorPassword,
        },
      });
      assert.equal(
        (await limited.request.get(`${base}/api/appointments`)).status(),
        403,
      );
      const limitedPage = await limited.newPage();
      await limitedPage.goto(`${base}/admin/calendar`);
      assert.equal(new URL(limitedPage.url()).pathname, "/admin");
    } finally {
      await limited.close();
    }
    console.log(
      "PASS contacts; internal appointment CRUD; same-doctor conflict rejection; different doctors; invalid duration; calendar desktop/mobile; private data and editor-role restrictions.",
    );
  } finally {
    for (const id of ids)
      await context.request.delete(`${base}/api/appointments/${id}`);
    if (contact)
      await context.request.delete(`${base}/api/contacts/${contact.id}`);
    if (editor) await context.request.delete(`${base}/api/users/${editor.id}`);
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
