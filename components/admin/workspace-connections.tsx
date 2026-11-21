"use client";
import { HeadingInfo } from "./info-tip";
import { ArrowUpRight } from "@/components/arrow-up-right";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type {
  ConnectionReport,
  ConnectionStatus,
} from "../../cms/connections-endpoint";
import "./workspace-connections.css";

const labels: Record<ConnectionStatus, string> = {
  verified: "Verified",
  disabled: "Disabled",
  needs_setup: "Setup required",
  needs_verification: "Test required",
  error: "Check failed",
};
async function fetchReport(
  probe: boolean,
  signal: AbortSignal,
): Promise<ConnectionReport> {
  const response = await fetch("/api/workspace-connections", {
    method: probe ? "POST" : "GET",
    ...(probe
      ? {
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "ai" }),
        }
      : {}),
    cache: "no-store",
    signal: signal,
  });
  if (!response.ok)
    throw Error(
      response.status === 401 || response.status === 403
        ? "Administrator access is required. Sign in again to continue."
        : "Connection checks could not load. Please retry.",
    );
  const result: ConnectionReport = await response.json();
  if (!Array.isArray(result.connections))
    throw Error("Connection checks could not load. Please retry.");
  return result;
}
export function WorkspaceConnections() {
  const [report, setReport] = useState<ConnectionReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState("");
  const active = useRef<AbortController | null>(null);
  const load = useCallback(async (probe = false) => {
    active.current?.abort();
    const controller = new AbortController();
    active.current = controller;
    setLoading(true);
    setTesting(probe);
    setError("");
    try {
      const result = await fetchReport(probe, controller.signal);
      if (!controller.signal.aborted) setReport(result);
    } catch (reason) {
      if (!controller.signal.aborted)
        setError(
          reason instanceof Error
            ? reason.message
            : "Connection checks could not load. Please retry.",
        );
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
        setTesting(false);
      }
    }
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    active.current = controller;
    fetchReport(false, controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setReport(result);
      })
      .catch((reason) => {
        if (!controller.signal.aborted)
          setError(
            reason instanceof Error
              ? reason.message
              : "Connection checks could not load. Please retry.",
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => active.current?.abort();
  }, []);
  return (
    <section
      className="gutter--left gutter--right clinic-reports workspace-connections"
      aria-busy={loading}
    >
      <div className="connections-heading">
        <div>
          <p className="connections-kicker">WORKSPACE / CONNECTIONS</p>
          <HeadingInfo title="Connections" level={1}>
            <p>
              Verified means the described check succeeded. Email, telephone,
              payments and clinic-software synchronization need their own
              authorized service accounts. Credentials alone do not activate
              them.
            </p>
            <p>
              AI testing sends a fixed public practice question, with no visitor
              transcript or personal details. Checks never send email or SMS,
              place calls or charge a payment. Search indexing stays disabled
              for the preview domain.
            </p>
          </HeadingInfo>
        </div>
        <button type="button" onClick={() => void load()} disabled={loading}>
          {loading && !testing ? "Checking…" : "Refresh checks"}
        </button>
      </div>
      {error && (
        <div className="connections-error" role="alert">
          <p>{error}</p>
          <button type="button" disabled={loading} onClick={() => void load()}>
            Retry checks
          </button>
        </div>
      )}
      <p className="connections-summary" role="status" aria-live="polite">
        {report ? (
          <>
            {
              report.connections.filter((item) => item.status === "verified")
                .length
            }{" "}
            of {report.connections.length} checks verified ·{" "}
            {new Intl.DateTimeFormat("en-US", {
              timeZone: "America/New_York",
              dateStyle: "medium",
              timeStyle: "short",
            }).format(new Date(report.checkedAt))}{" "}
            Orlando time{loading ? " · Rechecking…" : ""}
          </>
        ) : loading ? (
          "Checking configured services…"
        ) : (
          "No completed checks yet."
        )}
      </p>
      {report && (
        <div
          className="clinic-connections"
          role="region"
          aria-label="Connection results"
        >
          {report.connections.map((item) => (
            <article key={item.id} data-status={item.status}>
              <div className="connection-title">
                <HeadingInfo title={item.name}>
                  <p>{item.detail}</p>
                  <p>{item.next}</p>
                </HeadingInfo>
                <span className="connection-badge">{labels[item.status]}</span>
              </div>
              <div className="connection-actions">
                {item.id === "ai" && (
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => void load(true)}
                  >
                    {testing ? "Testing AI…" : "Test AI connection"}
                  </button>
                )}
                {item.href &&
                  (item.href.startsWith("/") ? (
                    <Link href={item.href}>{item.linkLabel}</Link>
                  ) : (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {item.linkLabel}{" "}
                      <span aria-hidden="true">
                        <ArrowUpRight />
                      </span>
                    </a>
                  ))}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
