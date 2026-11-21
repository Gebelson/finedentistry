"use client";
import { ArrowUpRight } from "@/components/arrow-up-right";
import Link from "next/link";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { TZDate } from "@date-fns/tz";
import {
  calendarMonth,
  calendarBounds,
  calendarDateKey,
  calendarDoctors,
  calendarStatuses,
  calendarDayLabel,
  CLINIC_TIMEZONE,
} from "@/lib/clinic-calendar";

type Entry = {
  id: number;
  contactName: string;
  doctor?: string;
  status: string;
  startsAt?: string;
};
const phoneQuery = "(max-width: 700px)";
const subscribePhone = (notify: () => void) => {
  const query = window.matchMedia(phoneQuery);
  query.addEventListener("change", notify);
  return () => query.removeEventListener("change", notify);
};
const phoneSnapshot = () => window.matchMedia(phoneQuery).matches;
const serverPhoneSnapshot = () => false;
const time = (value: string) =>
  new Date(value).toLocaleTimeString("en-US", {
    timeZone: CLINIC_TIMEZONE,
    hour: "numeric",
    minute: "2-digit",
  });
function CalendarEntry({ entry }: { entry: Entry }) {
  return (
    <Link
      className={"calendar-event calendar-event-" + entry.status}
      href={"/admin/collections/appointments/" + entry.id}
    >
      <time dateTime={entry.startsAt}>{time(entry.startsAt!)}</time>
      <strong>{entry.contactName}</strong>
      <small>
        {entry.doctor
          ? calendarDoctors[entry.doctor] || entry.doctor
          : "Unassigned"}{" "}
        · {calendarStatuses[entry.status] || entry.status}
      </small>
    </Link>
  );
}
export function ClinicCalendar() {
  const [month, setMonth] = useState(() => calendarMonth());
  const [entries, setEntries] = useState<Entry[]>([]);
  const [error, setError] = useState("");
  const [downloadError, setDownloadError] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  const [doctor, setDoctor] = useState("");
  const [status, setStatus] = useState("");
  const [preferredView, setView] = useState<"month" | "agenda" | null>(null);
  const phone = useSyncExternalStore(
    subscribePhone,
    phoneSnapshot,
    serverPhoneSnapshot,
  );
  const view = preferredView ?? (phone ? "agenda" : "month");
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const bounds = calendarBounds(month);
    async function load() {
      const loaded: Entry[] = [];
      let page = 1;
      while (true) {
        const query = new URLSearchParams({
          limit: "200",
          page: String(page),
          depth: "0",
          "where[startsAt][greater_than_equal]": bounds.start,
          "where[startsAt][less_than]": bounds.end,
          sort: "startsAt",
        });
        const response = await fetch("/api/appointments?" + query, {
          signal: controller.signal,
        });
        if (!response.ok) throw Error("Calendar unavailable");
        const result = await response.json();
        loaded.push(...result.docs);
        if (!result.hasNextPage) break;
        page++;
      }
      if (active) setEntries(loaded);
    }
    void load()
      .catch(() => {
        if (active)
          setError(
            "Unable to load appointments. Your records have not changed. Please retry.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [month, revision]);
  function prepareLoad() {
    setLoading(true);
    setEntries([]);
    setError("");
  }
  function changeMonth(offset: number) {
    prepareLoad();
    setMonth(
      new TZDate(
        month.getFullYear(),
        month.getMonth() + offset,
        1,
        CLINIC_TIMEZONE,
      ),
    );
  }
  async function downloadCalendar() {
    setDownloading(true);
    setDownloadError("");
    const selectedMonth = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`;
    try {
      const response = await fetch(
        "/api/calendar-export?" + new URLSearchParams({ month: selectedMonth }),
        { cache: "no-store", credentials: "same-origin" },
      );
      if (
        !response.ok ||
        !response.headers.get("content-type")?.includes("text/calendar")
      )
        throw new Error("Calendar download unavailable");
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = `fine-dentistry-busy-${selectedMonth}.ics`;
      document.body.append(link);
      link.click();
      link.remove();
      // Allow the browser to consume the file before releasing its in-memory URL.
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setDownloadError(
        "Unable to download the calendar. Please retry. Your records have not changed.",
      );
    } finally {
      setDownloading(false);
    }
  }
  const filtered = useMemo(
    () =>
      entries.filter(
        (entry) =>
          (!doctor || entry.doctor === doctor) &&
          (!status || entry.status === status),
      ),
    [entries, doctor, status],
  );
  const grouped = useMemo(() => {
    const result = new Map<string, Entry[]>();
    for (const entry of filtered)
      if (entry.startsAt) {
        const key = calendarDateKey(entry.startsAt);
        result.set(key, [...(result.get(key) || []), entry]);
      }
    return result;
  }, [filtered]);
  const days = new TZDate(
    month.getFullYear(),
    month.getMonth() + 1,
    0,
    CLINIC_TIMEZONE,
  ).getDate();
  const today = calendarDateKey(new Date());
  return (
    <section
      className="clinic-calendar"
      data-auto-view={preferredView === null ? "true" : undefined}
    >
      <div className="clinic-calendar-top">
        <div>
          <p>Reception / Internal planning</p>
          <h1>Appointments</h1>
        </div>
        <Link href="/admin/collections/appointments/create">
          New appointment <ArrowUpRight />
        </Link>
      </div>
      <p className="clinic-calendar-note">
        All times shown in Orlando time. This calendar is not synchronized with
        practice software and does not send patient confirmations.
      </p>
      <p className="clinic-calendar-note">
        Download this month’s scheduled busy times and doctors as an .ics file.
        Patient details are excluded. Imports are snapshots; changes require a
        new download.
      </p>
      <div className="workspace-calendar-toolbar">
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
          <button
            type="button"
            onClick={() => {
              prepareLoad();
              setMonth(calendarMonth());
            }}
          >
            Today
          </button>
        </div>
        <button
          type="button"
          className="workspace-calendar-download"
          disabled={downloading}
          aria-busy={downloading}
          onClick={() => void downloadCalendar()}
        >
          {downloading ? "Downloading…" : "Download calendar"}
        </button>
        <div
          className="workspace-view-switch"
          role="group"
          aria-label="Calendar view"
        >
          <button
            type="button"
            aria-pressed={view === "month"}
            onClick={() => setView("month")}
          >
            Month
          </button>
          <button
            type="button"
            aria-pressed={view === "agenda"}
            onClick={() => setView("agenda")}
          >
            Agenda
          </button>
        </div>
      </div>
      {downloadError && <p role="alert">{downloadError}</p>}
      <div className="workspace-calendar-filters">
        <label>
          Doctor
          <select
            aria-label="Doctor"
            value={doctor}
            onChange={(event) => setDoctor(event.target.value)}
          >
            <option value="">All doctors</option>
            {Object.entries(calendarDoctors).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Status
          <select
            aria-label="Status"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="">All statuses</option>
            {Object.entries(calendarStatuses).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <p aria-live="polite">
          {loading
            ? "Loading appointments…"
            : `${filtered.length} appointment${filtered.length === 1 ? "" : "s"}`}
        </p>
        {(doctor || status) && (
          <button
            type="button"
            onClick={() => {
              setDoctor("");
              setStatus("");
            }}
          >
            Clear filters
          </button>
        )}
      </div>
      {error && (
        <div className="workspace-calendar-error">
          <p role="alert">{error}</p>
          <button
            type="button"
            onClick={() => {
              prepareLoad();
              setRevision((value) => value + 1);
            }}
          >
            Retry calendar
          </button>
        </div>
      )}
      {loading && <p role="status">Loading appointments…</p>}
      {view === "month" ? (
        <div className="clinic-calendar-grid" aria-busy={loading}>
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div className="clinic-calendar-weekday" key={day}>
              {day}
            </div>
          ))}
          {Array.from({ length: month.getDay() }, (_, index) => (
            <div key={"pad" + index} className="clinic-calendar-empty" />
          ))}
          {Array.from({ length: days }, (_, index) => {
            const day = index + 1,
              key = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            return (
              <div
                className={
                  "clinic-calendar-day" +
                  (key === today ? " workspace-calendar-today" : "")
                }
                key={key}
              >
                <span aria-current={key === today ? "date" : undefined}>
                  {day}
                </span>
                {(grouped.get(key) || []).map((entry) => (
                  <CalendarEntry entry={entry} key={entry.id} />
                ))}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="workspace-agenda" aria-busy={loading}>
          {[...grouped].map(([key, items]) => (
            <section key={key}>
              <h3>{calendarDayLabel(key)}</h3>
              <div>
                {items.map((entry) => (
                  <CalendarEntry entry={entry} key={entry.id} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
      {!loading && !error && !filtered.length && (
        <p className="workspace-calendar-empty">
          {doctor || status
            ? "No appointments match these filters."
            : "No dated appointments this month. Unscheduled requests are available in the appointment list."}
        </p>
      )}
      <Link
        className="clinic-calendar-list-link"
        href="/admin/collections/appointments"
      >
        View requests and appointment list <ArrowUpRight />
      </Link>
    </section>
  );
}
