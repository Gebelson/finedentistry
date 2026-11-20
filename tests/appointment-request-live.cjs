const assert = require("node:assert/strict");
const { chromium } = require("playwright");
const base = process.env.TEST_URL || "http://localhost:3000";
(async () => {
  const b = await chromium.launch({ channel: "chrome", headless: true });
  let contactId, appointmentId;
  const staff = await b.newContext({ extraHTTPHeaders: { Origin: base } });
  try {
    assert.equal(
      (
        await staff.request.post(base + "/api/users/login", {
          data: {
            username: process.env.TEST_ADMIN_USERNAME,
            password: process.env.TEST_ADMIN_PASSWORD,
          },
        })
      ).status(),
      200,
    );
    const visitor = await b.newContext({
      viewport: { width: 390, height: 844 },
      extraHTTPHeaders: { Origin: base },
    });
    const p = await visitor.newPage();
    await p.goto(base);
    await p
      .getByRole("button", { name: "Request an Appointment", exact: true })
      .first()
      .click();
    await p
      .getByLabel("Treatment", { exact: true })
      .selectOption("New patient visit");
    await p.getByRole("button", { name: "Continue", exact: true }).click();
    const stamp = Date.now();
    const name = "Temporary booking verification " + stamp;
    const email = "booking-" + stamp + "@example.invalid";
    await p.getByLabel("Your name", { exact: true }).fill(name);
    await p.getByLabel("Phone number", { exact: true }).fill("4075550198");
    await p.getByLabel("Email address (optional)", { exact: true }).fill(email);
    await p.getByRole("checkbox").check();
    const received = p.waitForResponse(
      (r) =>
        new URL(r.url()).pathname === "/api/appointment-request" &&
        r.request().method() === "POST",
    );
    await p
      .getByRole("button", { name: "Send appointment request", exact: true })
      .click();
    const response = await received;
    assert.equal(response.status(), 202);
    await p
      .getByText("Your appointment request was received by reception.", {
        exact: true,
      })
      .waitFor();
    assert.equal(
      await p
        .getByText("Your appointment is not confirmed.", { exact: true })
        .count(),
      1,
    );
    const contacts = await (
      await staff.request.get(
        base +
          "/api/contacts?where[email][equals]=" +
          encodeURIComponent(email),
      )
    ).json();
    assert.equal(contacts.totalDocs, 1);
    contactId = contacts.docs[0].id;
    assert.equal(contacts.docs[0].source, "website");
    const appointments = await (
      await staff.request.get(
        base + "/api/appointments?where[contact][equals]=" + contactId,
      )
    ).json();
    assert.equal(appointments.totalDocs, 1);
    appointmentId = appointments.docs[0].id;
    assert.equal(appointments.docs[0].status, "requested");
    assert.ok(!appointments.docs[0].startsAt);
    assert.ok(!appointments.docs[0].endsAt);
    const duplicate = await visitor.request.post(
      base + "/api/appointment-request",
      {
        data: {
          name,
          email,
          phone: "4075550198",
          treatment: "New patient visit",
          doctor: "No preference",
          preferredContact: "phone",
          consent: true,
          website: "",
        },
      },
    );
    assert.equal(duplicate.status(), 202);
    assert.equal(
      (
        await (
          await staff.request.get(
            base + "/api/appointments?where[contact][equals]=" + contactId,
          )
        ).json()
      ).totalDocs,
      1,
    );
    assert.equal(
      (await visitor.request.get(base + "/api/appointments")).status(),
      403,
    );
    assert.equal(
      await p.evaluate(
        ({ name, email }) =>
          JSON.stringify({ ...localStorage }).includes(name) ||
          JSON.stringify({ ...localStorage }).includes(email),
        { name, email },
      ),
      false,
    );
    const dashboard = await staff.newPage();
    await dashboard.goto(base + "/admin");
    assert.ok(
      Number(await dashboard.locator("[data-metric=requests]").innerText()) >=
        1,
    );
    assert.equal(
      await p.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    );
    console.log(
      "PASS real mobile website request creates one contact and Requested appointment, shows honest receipt, suppresses retry duplicate, appears in dashboard and remains private.",
    );
  } finally {
    if (appointmentId)
      assert.equal(
        (
          await staff.request.delete(
            base + "/api/appointments/" + appointmentId,
          )
        ).status(),
        200,
      );
    if (contactId)
      assert.equal(
        (
          await staff.request.delete(base + "/api/contacts/" + contactId)
        ).status(),
        200,
      );
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
