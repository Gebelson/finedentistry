"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
type Entry = {
  id: number;
  contactName: string;
  doctor?: string;
  status: string;
  startsAt?: string;
};
const dateKey = (value: string) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
export function ClinicCalendar() {
  const [month, setMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const [entries, setEntries] = useState<Entry[]>([]),
    [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const before = new Date(
        month.getFullYear(),
        month.getMonth(),
        0,
      ).toISOString(),
      after = new Date(
        month.getFullYear(),
        month.getMonth() + 1,
        2,
      ).toISOString();
    const query = new URLSearchParams({
      limit: "1000",
      depth: "0",
      "where[startsAt][greater_than_equal]": before,
      "where[startsAt][less_than]": after,
      sort: "startsAt",
    });
    fetch("/api/appointments?" + query, { signal: controller.signal })
      .then(async (r) => {
        if (!r.ok) throw Error("Unable to load the calendar.");
        const result = await r.json();
        if (active) setEntries(result.docs);
      })
      .catch(() => {
        if (active)
          setError(
            "Unable to load the calendar. Please select the month again to retry.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [month]);
  function changeMonth(offset: number) {
    setLoading(true);
    setEntries([]);
    setError("");
    setMonth(new Date(month.getFullYear(), month.getMonth() + offset, 1));
  }
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate(),
    pad = month.getDay();
  return (
    <section className="clinic-calendar">
      <div className="clinic-calendar-top">
        <div>
          <p>RECEPTION / INTERNAL PLANNING</p>
          <h1>Appointments</h1>
        </div>
        <Link href="/admin/collections/appointments/create">
          New appointment ↗
        </Link>
      </div>
      <p className="clinic-calendar-note">
        All times shown in Orlando time. This calendar is not synchronized with
        practice software and does not send patient confirmations.
      </p>
      <div className="clinic-calendar-nav">
        <button
          type="button"
          aria-label="Previous month"
          onClick={() => changeMonth(-1)}
        >
          ←
        </button>
        <h2>
          {month.toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          })}
        </h2>
        <button
          type="button"
          aria-label="Next month"
          onClick={() => changeMonth(1)}
        >
          →
        </button>
      </div>
      {error && <p role="alert">{error}</p>}
      {loading && <p role="status">Loading appointments…</p>}
      <div className="clinic-calendar-grid" aria-busy={loading}>
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div className="clinic-calendar-weekday" key={d}>
            {d}
          </div>
        ))}
        {Array.from({ length: pad }, (_, i) => (
          <div key={"pad" + i} className="clinic-calendar-empty" />
        ))}
        {Array.from({ length: days }, (_, i) => {
          const day = i + 1,
            key = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          return (
            <div className="clinic-calendar-day" key={key}>
              <span>{day}</span>
              {entries
                .filter((e) => e.startsAt && dateKey(e.startsAt) === key)
                .map((e) => (
                  <Link
                    className={"calendar-event calendar-event-" + e.status}
                    href={"/admin/collections/appointments/" + e.id}
                    key={e.id}
                  >
                    <time>
                      {new Date(e.startsAt!).toLocaleTimeString("en-US", {
                        timeZone: "America/New_York",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </time>
                    <strong>{e.contactName}</strong>
                    <small>
                      {e.doctor} · {e.status}
                    </small>
                  </Link>
                ))}
            </div>
          );
        })}
      </div>
      <Link
        className="clinic-calendar-list-link"
        href="/admin/collections/appointments"
      >
        View requests and appointment list ↗
      </Link>
    </section>
  );
}
