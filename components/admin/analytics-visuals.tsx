import type { AnalyticsSummary } from "@/lib/analytics-types";
type Row = { name: string; count: number };
export function ActivityChart({ daily }: { daily: AnalyticsSummary["daily"] }) {
  const maximum = Math.max(
    4,
    ...daily.flatMap((day) => [day.views, day.visitors]),
  );
  const max = Math.ceil(maximum / 4) * 4;
  const width = 600,
    height = 160,
    step = width / Math.max(daily.length, 1);
  const points = daily
    .map(
      (day, index) =>
        `${index * step + step / 2},${height - (day.visitors / max) * height}`,
    )
    .join(" ");
  const total = daily.reduce((sum, day) => sum + day.views, 0);
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
          {[4, 3, 2, 1, 0].map((value) => (
            <span key={value}>
              {((max * value) / 4).toLocaleString("en-US")}
            </span>
          ))}
        </div>
        <div className="ops-chart-plot">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            preserveAspectRatio="none"
            role="img"
            aria-label={`Daily website activity: ${total} page views over ${daily.length} days.`}
          >
            {[0, 1, 2, 3, 4].map((index) => (
              <line
                key={index}
                x1="0"
                x2={width}
                y1={(index * height) / 4}
                y2={(index * height) / 4}
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
                fill="#6a9ce2"
              >
                <title>{`${day.day}: ${day.views} views`}</title>
              </rect>
            ))}
            <polyline
              points={points}
              fill="none"
              stroke="#22a58a"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          {!total && (
            <p className="ops-chart-empty">
              No website activity recorded for this period
            </p>
          )}
        </div>
      </div>
      <div className="ops-chart-dates">
        <span>{daily[0]?.day}</span>
        <span>{daily.at(-1)?.day}</span>
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
