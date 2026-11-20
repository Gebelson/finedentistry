"use client";
import { useState } from "react";
import Link from "next/link";
import type { AnalyticsSummary } from "@/lib/analytics-types";
import {
  ActivityChart,
  InteractionChart,
  Breakdown,
  analyticsDate,
} from "./analytics-visuals";
const format = (value: number) => new Intl.NumberFormat("en-US").format(value);
const labels: Record<string, string> = {
  appointment_click: "Appointment clicks",
  phone_click: "Telephone clicks",
  email_click: "Email clicks",
  chat_open: "Chat opens",
};
export function WebsiteAnalytics({
  initial,
  overview = false,
}: {
  initial: AnalyticsSummary;
  overview?: boolean;
}) {
  const [data, setData] = useState(initial),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function refresh(days: number) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/site-analytics?days=" + days);
      if (!response.ok) throw Error();
      setData(await response.json());
    } catch {
      setError("Analytics could not be refreshed. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  const conversions = data.conversions.map((row) => ({
    ...row,
    name: labels[row.name],
  }));
  const interactionTotal = conversions.reduce((sum, row) => sum + row.count, 0);
  const breakdowns: [string, { name: string; count: number }[]][] = overview
    ? [
        ["Referral sources", data.sources],
        ["Devices", data.devices],
      ]
    : [
        ["Most viewed pages", data.pages],
        ["Referral sources", data.sources],
        ["Devices", data.devices],
        ["Countries", data.countries],
      ];
  return (
    <div
      className={`clinic-analytics ops-analytics ${overview ? "ops-analytics-overview" : ""}`}
      aria-busy={busy}
    >
      <div className="ops-analytics-toolbar">
        <p>
          {data.firstRecordedDay
            ? `Tracking since ${analyticsDate(data.firstRecordedDay)}`
            : "Tracking starts with the first eligible visit"}{" "}
          <span className="ops-status ops-status-active">
            First-party analytics
          </span>
        </p>
        <div>
          <label>
            Period{" "}
            <select
              aria-label="Period"
              value={data.days}
              disabled={busy}
              onChange={(event) => refresh(Number(event.target.value))}
            >
              {[7, 30, 90].map((days) => (
                <option key={days} value={days}>
                  Last {days} days
                </option>
              ))}
            </select>
          </label>
          <button
            className="ops-button ops-button-secondary"
            type="button"
            disabled={busy}
            onClick={() => refresh(data.days)}
          >
            {busy ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </div>
      {error && (
        <p className="ops-error" role="alert">
          {error}
        </p>
      )}
      <dl className="ops-traffic-kpis">
        {[
          ["Page views", data.views],
          ["Estimated visitor-days", data.visitorDays],
          ["Active in last 5 minutes", data.active],
          ["Contact interactions", interactionTotal],
        ].map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{format(Number(value))}</dd>
          </div>
        ))}
      </dl>
      <div className="ops-analytics-main">
        <article className="ops-panel">
          <div className="ops-panel-heading">
            <h2>Website activity</h2>
            <span>Daily · Orlando time</span>
          </div>
          <div className="ops-panel-body">
            <ActivityChart daily={data.daily} />
            {!overview && (
              <details className="ops-daily-details">
                <summary>View daily figures</summary>
                <div className="ops-table-scroll">
                  <table className="ops-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Page views</th>
                        <th>Daily visitor estimates</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.daily.map((day) => (
                        <tr key={day.day}>
                          <td>{day.day}</td>
                          <td>{format(day.views)}</td>
                          <td>{format(day.visitors)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            )}
          </div>
        </article>
        <article className="ops-panel">
          <div className="ops-panel-heading">
            <h2>Contact interactions</h2>
            <span>{format(interactionTotal)} total</span>
          </div>
          <div className="ops-panel-body">
            <InteractionChart rows={conversions} />
          </div>
          <p className="ops-panel-description ops-panel-note">
            Button and link clicks, not confirmed appointments.
          </p>
        </article>
      </div>
      <div className="ops-analytics-breakdowns">
        {breakdowns.map(([title, rows]) => (
          <article className="ops-panel" key={title}>
            <div className="ops-panel-heading">
              <h2>{title}</h2>
              <span>Page views</span>
            </div>
            <div className="ops-panel-body">
              <Breakdown rows={rows} />
            </div>
          </article>
        ))}
      </div>
      <div className="ops-analytics-note">
        <p>
          Visitor-days add daily estimates; they are not unique people across
          the period. Staff, known bots and browsers requesting DNT/GPC are
          excluded.
        </p>
        {overview ? (
          <Link href="/admin/analytics">View all analytics</Link>
        ) : (
          <p>
            No patient information, messages, query strings or form contents are
            collected.
          </p>
        )}
      </div>
    </div>
  );
}
