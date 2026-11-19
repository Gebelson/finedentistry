"use client";
import { useState } from "react";
import type { AnalyticsSummary } from "@/lib/analytics-types";
const format = (n: number) => new Intl.NumberFormat("en-US").format(n);
const labels: Record<string, string> = {
  appointment_click: "Appointment button clicks",
  phone_click: "Telephone link clicks",
  email_click: "Email link clicks",
  chat_open: "Chat opens",
};
export function WebsiteAnalytics({ initial }: { initial: AnalyticsSummary }) {
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
  const max = Math.max(1, ...data.daily.map((day) => day.views));
  return (
    <div aria-busy={busy} className="clinic-analytics">
      <div className="clinic-analytics-toolbar">
        <label>
          Period{" "}
          <select
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
          type="button"
          disabled={busy}
          onClick={() => refresh(data.days)}
        >
          {busy ? "Refreshing…" : "Refresh ↻"}
        </button>
      </div>
      {error && <p role="alert">{error}</p>}
      <dl className="clinic-report-grid">
        {[
          ["Page views", data.views],
          ["Estimated visitor-days", data.visitorDays],
          ["Active in the last 5 minutes", data.active],
          [
            "Contact interactions",
            data.conversions.reduce((sum, row) => sum + row.count, 0),
          ],
        ].map(([name, value]) => (
          <div key={name}>
            <dt>{name}</dt>
            <dd>{format(Number(value))}</dd>
          </div>
        ))}
      </dl>
      <article className="clinic-analytics-panel">
        <h2>Daily website activity</h2>
        <p>Page views · America/New_York</p>
        <div
          className="clinic-analytics-chart"
          role="img"
          aria-label={`Daily page views for the last ${data.days} days. ${data.views} total views.`}
        >
          {data.daily.map((day) => (
            <div
              key={day.day}
              title={`${day.day}: ${day.views} views, ${day.visitors} estimated visitors`}
            >
              <span style={{ height: `${(day.views / max) * 100}%` }} />
            </div>
          ))}
        </div>
        <div className="clinic-analytics-dates">
          <span>{data.daily[0]?.day}</span>
          <span>{data.daily.at(-1)?.day}</span>
        </div>
        <details>
          <summary>View daily figures</summary>
          <div className="clinic-analytics-table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Views</th>
                  <th>Estimated visitors</th>
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
      </article>
      <div className="clinic-analytics-panels">
        {(
          [
            ["Most viewed pages", data.pages],
            ["Referral sources", data.sources],
            ["Devices", data.devices],
            ["Countries", data.countries],
            [
              "Contact interactions",
              data.conversions.map((row) => ({
                ...row,
                name: labels[row.name],
              })),
            ],
          ] as [string, { name: string; count: number }[]][]
        ).map(([title, rows]) => (
          <article className="clinic-analytics-panel" key={title}>
            <h2>{title}</h2>
            {rows.length ? (
              <ul>
                {rows.map((row) => (
                  <li key={row.name}>
                    <span>{row.name}</span>
                    <strong>{format(row.count)}</strong>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No activity recorded in this period.</p>
            )}
          </article>
        ))}
      </div>
      <p className="clinic-report-note">
        {data.firstRecordedDay
          ? `Tracking began ${data.firstRecordedDay}. `
          : "Tracking starts with the first eligible visit. "}
        Visitor estimates reset each day; visitor-days add those daily estimates
        and are not unique people across the selected period. Contact clicks are
        expressions of interest, not confirmed appointments. Staff visits,
        recognized bots and browsers requesting Do Not Track or Global Privacy
        Control are excluded. No patient information, messages, search terms or
        form contents are collected.
      </p>
    </div>
  );
}
