"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { siteConfig } from "../lib/site-data";

export function AppointmentRequestForm({
  treatment,
  doctor,
  onReceived,
}: {
  treatment: string;
  doctor: string;
  onReceived: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const sending = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const [preferredContact, setPreferredContact] = useState("phone");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending.current) return;
    sending.current = true;
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/appointment-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          phone: form.get("phone"),
          email: form.get("email"),
          website: form.get("website"),
          consent: form.get("consent") === "on",
          treatment,
          doctor,
          preferredContact,
        }),
      });
      if (!response.ok)
        throw Error(
          response.status === 429
            ? "Please call our team to continue your request."
            : response.status === 400
              ? "Please check your contact details and try again."
              : "We could not save your request. Please retry or contact our team directly.",
        );
      const result = await response.json();
      if (result.received !== true)
        throw Error(
          "We could not verify receipt. Please call our team before sending again.",
        );
      // Leaving this step does not cancel a server save. Its response belongs
      // to this form instance and must not advance a newly opened request.
      if (mounted.current) onReceived();
    } catch (reason) {
      if (mounted.current)
        setError(
          reason instanceof Error
            ? reason.message
            : "Unable to connect. Please call our team.",
        );
    } finally {
      sending.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  return (
    <form onSubmit={(event) => void submit(event)} aria-busy={busy}>
      <p>
        You’re interested in <strong>{treatment}</strong>
        {doctor !== "No preference" ? ` with ${doctor}` : ""}.
      </p>
      <p>
        Share your contact details so reception can discuss availability. This
        is an appointment request, not a reservation.
      </p>
      <label htmlFor="request-name">Your name</label>
      <input
        id="request-name"
        name="name"
        autoComplete="name"
        required
        minLength={2}
        maxLength={100}
        disabled={busy}
      />
      <label htmlFor="request-phone">Phone number</label>
      <input
        id="request-phone"
        name="phone"
        type="tel"
        autoComplete="tel"
        required
        minLength={10}
        maxLength={32}
        disabled={busy}
      />
      <label htmlFor="request-email">
        Email address {preferredContact === "email" ? "" : "(optional)"}
      </label>
      <input
        id="request-email"
        name="email"
        type="email"
        autoComplete="email"
        required={preferredContact === "email"}
        maxLength={254}
        disabled={busy}
      />
      <label htmlFor="request-method">How should we contact you?</label>
      <select
        id="request-method"
        value={preferredContact}
        onChange={(event) => setPreferredContact(event.target.value)}
        disabled={busy}
      >
        <option value="phone">Phone</option>
        <option value="email">Email</option>
      </select>
      <div
        style={{
          position: "absolute",
          left: "-10000px",
          width: 1,
          height: 1,
          overflow: "hidden",
        }}
        aria-hidden="true"
      >
        <label htmlFor="request-website">Leave this field empty</label>
        <input
          id="request-website"
          name="website"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>
      <label className="appointment-consent">
        <input type="checkbox" name="consent" required disabled={busy} /> I
        agree that Fine Dentistry may contact me about this appointment request.
      </label>
      <p className="notice">
        Please do not include symptoms, medical history, insurance or payment
        details. For urgent concerns, call the practice.
      </p>
      {error && <p role="alert">{error}</p>}
      <button className="button" type="submit" disabled={busy}>
        {busy ? "Sending request…" : "Send appointment request"}
      </button>
      <p role="status" aria-live="polite">
        {busy ? "Sending your request to reception…" : ""}
      </p>
      <a className="text-link" href={siteConfig.tel}>
        Call {siteConfig.phone}
      </a>
      <a className="text-link" href={siteConfig.official + "/Contact"}>
        Continue on the clinic website
      </a>
    </form>
  );
}
