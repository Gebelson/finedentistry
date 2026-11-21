"use client";
import { ArrowUpRight } from "@/components/arrow-up-right";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { ReportPeriod, WorkspaceReport } from "../../cms/reports-endpoint";

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

export function WorkspaceReports() {
  const [period, setPeriod] = useState<ReportPeriod>("30");
  const [report, setReport] = useState<WorkspaceReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/workspace-reports?period=${period}`, {
      signal: controller.signal,
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok)
          throw new Error(
            response.status === 403
              ? "Administrator access is required. Sign in again to continue."
              : "Unable to load reports. Please retry.",
          );
        const result: WorkspaceReport = await response.json();
        if (!controller.signal.aborted) setReport(result);
      })
      .catch((reason) => {
        if (!controller.signal.aborted)
          setError(
            reason instanceof Error
              ? reason.message
              : "Unable to load reports.",
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [period, retry]);
  function loadPeriod(next: ReportPeriod) {
    setLoading(true);
    setError("");
    setExportError("");
    setPeriod(next);
    setRetry((value) => value + 1);
  }
  async function download() {
    setExporting(true);
    setExportError("");
    try {
      const response = await fetch(
        `/api/workspace-reports?period=${period}&format=csv`,
        { cache: "no-store" },
      );
      if (!response.ok)
        throw new Error("Unable to download the report. Please retry.");
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = `workspace-report-${period}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (reason) {
      setExportError(
        reason instanceof Error
          ? reason.message
          : "Unable to download the report.",
      );
    } finally {
      setExporting(false);
    }
  }
  const groups = report
    ? Array.from(new Set(report.rows.map((row) => row.group)))
    : [];
  return (
    <section className="gutter--left gutter--right clinic-reports">
      <p className="clinic-report-kicker">WORKSPACE / REPORTS</p>
      <h1>Workspace reports</h1>
      <p>
        Real activity recorded in this workspace. Choose a period and download
        an aggregate report for your team.
      </p>
      <div className="workspace-report-toolbar">
        <label htmlFor="workspace-report-period">
          Reporting period
          <select
            aria-label="Reporting period"
            id="workspace-report-period"
            value={period}
            disabled={exporting}
            onChange={(event) => loadPeriod(event.target.value as ReportPeriod)}
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="all">All time</option>
          </select>
        </label>
        <button
          type="button"
          disabled={loading || !!error || !report || exporting}
          onClick={() => void download()}
        >
          {exporting ? "Preparing CSV…" : "Download aggregate CSV"}
        </button>
      </div>
      {exportError && <p role="alert">{exportError}</p>}
      <p role="status" aria-live="polite">
        {loading
          ? "Loading workspace reports…"
          : error
            ? "Report unavailable."
            : report
              ? `${report.start ? formatDate(report.start) : "All recorded activity"} through ${formatDate(report.end)} · Orlando time`
              : ""}
      </p>
      {error && (
        <div role="alert">
          <p>{error}</p>
          <button type="button" onClick={() => loadPeriod(period)}>
            Retry reports
          </button>
        </div>
      )}
      {!loading && !error && report && (
        <div role="region" aria-label="Report results">
          {groups.map((group) => (
            <section className="workspace-report-section" key={group}>
              <h2>{group}</h2>
              <dl className="clinic-report-grid">
                {report.rows
                  .filter((row) => row.group === group)
                  .map((row) => (
                    <div key={row.label}>
                      <dt>{row.label}</dt>
                      <dd>{row.count.toLocaleString("en-US")}</dd>
                    </div>
                  ))}
              </dl>
            </section>
          ))}
        </div>
      )}
      <div className="clinic-report-note">
        <h2>Understand these numbers</h2>
        <p>
          Contacts, conversations and appointment records are selected by their
          creation date. Status counts show their current status, rather than
          when a status changed. Sources may be unassigned, so source counts may
          not add up to all contacts.
        </p>
        <p>
          Published articles use their saved publication date and current
          published status. Periods start at midnight in Orlando and include
          today through the report time. All time includes only records
          available in this workspace.
        </p>
        <p>
          These records are not a deduplicated patient funnel. Internal
          appointments are not synchronized with practice software. Ad spend,
          revenue and financial ROI are not connected. CSV files contain
          aggregate counts only.
        </p>
        <Link href="/admin/analytics">Open website analytics <ArrowUpRight /></Link>
      </div>
    </section>
  );
}
