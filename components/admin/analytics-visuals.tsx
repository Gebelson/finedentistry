"use client";
import { useId, useState, type KeyboardEvent, type PointerEvent } from "react";
import type { AnalyticsSummary } from "@/lib/analytics-types";
import { WorkspaceIcon } from "./workspace-icon";
type Row = { name: string; count: number };
const shortDate = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});
export const analyticsDate = (day: string) =>
  shortDate.format(new Date(day + "T12:00:00Z"));
export function ActivityChart({ daily }: { daily: AnalyticsSummary["daily"] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const helpId = useId();
  const maximum = Math.max(
    1,
    ...daily.flatMap((day) => [day.views, day.visitors]),
  );
  const max = maximum <= 4 ? maximum : Math.ceil(maximum / 4) * 4,
    ticks = Math.min(4, max);
  const width = 600,
    height = 160,
    step = width / Math.max(daily.length, 1);
  const total = daily.reduce((sum, day) => sum + day.views, 0);
  const active = activeIndex === null ? null : daily[activeIndex];
  const points = daily
    .map(
      (day, index) =>
        `${index * step + step / 2},${height - (day.visitors / max) * height}`,
    )
    .join(" ");
  function point(event: PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    if (!rect.width || !daily.length) return;
    setActiveIndex(
      Math.max(
        0,
        Math.min(
          daily.length - 1,
          Math.floor(((event.clientX - rect.left) / rect.width) * daily.length),
        ),
      ),
    );
  }
  function key(event: KeyboardEvent<HTMLDivElement>) {
    if (!daily.length) return;
    const current = activeIndex ?? 0;
    const next =
      event.key === "ArrowRight"
        ? Math.min(daily.length - 1, current + 1)
        : event.key === "ArrowLeft"
          ? Math.max(0, current - 1)
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? daily.length - 1
              : undefined;
    if (next !== undefined) {
      event.preventDefault();
      setActiveIndex(next);
    } else if (event.key === "Escape") {
      event.preventDefault();
      setActiveIndex(null);
    }
  }
  return (
    <>
      <div className="ops-chart-legend">
        <span>
          <i className="ops-key ops-key-blue" />
          Page views
        </span>
        <span>
          <i className="ops-key ops-key-green" />
          Daily visitor estimates
        </span>
      </div>
      <div className="ops-chart-area">
        <div className="ops-chart-y" aria-hidden="true">
          {Array.from(
            { length: ticks + 1 },
            (_, i) => max - (i * max) / ticks,
          ).map((value) => (
            <span key={value}>{value.toLocaleString("en-US")}</span>
          ))}
        </div>
        <div
          className="ops-chart-plot ops-chart-interactive"
          role="group"
          aria-label="Website activity chart"
          aria-describedby={helpId}
          tabIndex={0}
          onPointerMove={point}
          onPointerDown={point}
          onPointerLeave={() => setActiveIndex(null)}
          onFocus={() => setActiveIndex(daily.length ? 0 : null)}
          onBlur={() => setActiveIndex(null)}
          onKeyDown={key}
        >
          <svg
            viewBox={`0 0 ${width} ${height}`}
            preserveAspectRatio="none"
            role="img"
            aria-label={`Daily website activity: ${total} page views over ${daily.length} days.`}
          >
            {Array.from({ length: ticks + 1 }, (_, i) => (
              <line
                key={i}
                x1="0"
                x2={width}
                y1={(i * height) / ticks}
                y2={(i * height) / ticks}
                stroke="var(--ops-border)"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
              />
            ))}
            {daily.map((day, index) => (
              <rect
                key={day.day}
                x={index * step + step * 0.22}
                y={height - (day.views / max) * height}
                width={Math.max(1, step * 0.56)}
                height={(day.views / max) * height}
                fill={activeIndex === index ? "#315f9f" : "#7998c7"}
                className="ops-chart-series-bar"
              >
                <title>{`${day.day}: ${day.views} views`}</title>
              </rect>
            ))}
            <polyline
            className="ops-chart-series-line"
            pathLength="100"
              points={points}
              fill="none"
              stroke="#24918b"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
            {active && activeIndex !== null && (
              <>
                <line
                  x1={activeIndex * step + step / 2}
                  x2={activeIndex * step + step / 2}
                  y1="0"
                  y2={height}
                  stroke="#8a9bb2"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                  vectorEffect="non-scaling-stroke"
                />
                <circle
                  cx={activeIndex * step + step / 2}
                  cy={height - (active.visitors / max) * height}
                  r="3"
                  fill="#24918b"
                  vectorEffect="non-scaling-stroke"
                />
              </>
            )}
          </svg>
          {!total && !active && (
            <div className="ops-chart-empty ops-chart-empty-detail">
              <WorkspaceIcon name="analytics" width="26" height="26" />
              <strong>Your traffic overview starts here</strong>
              <span>Eligible website visits will appear in this chart.</span>
            </div>
          )}
          {active && activeIndex !== null && (
            <div
              data-testid="activity-tooltip"
              className="ops-chart-tooltip"
              aria-hidden="true"
              style={{
                left: `clamp(84px, ${((activeIndex + 0.5) / daily.length) * 100}%, calc(100% - 84px))`,
              }}
            >
              <strong>{analyticsDate(active.day)}</strong>
              <span>
                <i className="ops-key ops-key-blue" />
                Page views <b>{active.views.toLocaleString("en-US")}</b>
              </span>
              <span>
                <i className="ops-key ops-key-green" />
                Visitor estimates{" "}
                <b>{active.visitors.toLocaleString("en-US")}</b>
              </span>
            </div>
          )}
        </div>
      </div>
      <p id={helpId} className="ops-visually-hidden">
        Use the left and right arrow keys to explore dates, Home or End to jump,
        or Escape to clear the selection.
      </p>
      <p className="ops-visually-hidden" aria-live="polite">
        {active
          ? `${active.day}: ${active.views} page views, ${active.visitors} estimated visitors.`
          : ""}
      </p>
      <div className="ops-chart-dates">
        <span>{daily[0] ? analyticsDate(daily[0].day) : ""}</span>
        <span>{daily.at(-1) ? analyticsDate(daily.at(-1)!.day) : ""}</span>
      </div>
    </>
  );
}
export function InteractionChart({ rows }: { rows: Row[] }) {
  const total = rows.reduce((sum, row) => sum + row.count, 0),
    colors = ["#3976d3", "#22a58a", "#dfaa47", "#9173cc"];
  return (
    <div className="ops-interaction-chart">
      <div className="ops-donut">
        <svg
          viewBox="0 0 120 120"
          role="img"
          aria-label={`${total} contact interactions`}
        >
          <circle
            cx="60"
            cy="60"
            r="48"
            fill="none"
            stroke="var(--ops-border)"
            strokeWidth="10"
          />
          {rows.map((row, index) => {
            const length = total ? (row.count / total) * 100 : 0;
            const start = total
              ? (rows
                  .slice(0, index)
                  .reduce((sum, item) => sum + item.count, 0) /
                  total) *
                100
              : 0;
            return (
              <circle
                key={row.name}
                cx="60"
                cy="60"
                r="48"
                fill="none"
                stroke={colors[index % colors.length]}
                strokeWidth="10"
                pathLength="100"
                strokeDasharray={`${length} ${100 - length}`}
                strokeDashoffset={-start}
                transform="rotate(-90 60 60)"
              />
            );
          })}
        </svg>
        <div>
          <strong>{total.toLocaleString("en-US")}</strong>
          <span>Interactions</span>
        </div>
      </div>
      <ul className="ops-donut-legend">
        {rows.map((row, index) => (
          <li key={row.name}>
            <i style={{ background: colors[index % colors.length] }} />
            <span>{row.name}</span>
            <strong>{row.count.toLocaleString("en-US")}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}
export function Breakdown({
  rows,
  limit = 6,
}: {
  rows: Row[];
  limit?: number;
}) {
  const max = Math.max(1, ...rows.map((row) => row.count));
  return rows.length ? (
    <ul className="ops-breakdown">
      {rows.slice(0, limit).map((row) => (
        <li key={row.name}>
          <div>
            <span>{row.name}</span>
            <strong>{row.count.toLocaleString("en-US")}</strong>
          </div>
          <div className="ops-bar-track">
            <span style={{ width: `${(row.count / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  ) : (
    <div className="ops-empty">
      <p>No activity recorded in this period.</p>
    </div>
  );
}
