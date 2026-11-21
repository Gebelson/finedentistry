"use client";
import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import "./reception-live-updates.css";

const revisionURL =
  "/api/conversations?" +
  new URLSearchParams({
    limit: "1",
    depth: "0",
    sort: "-updatedAt",
    "select[updatedAt]": "true",
    "select[status]": "true",
    "select[controller]": "true",
  });

export function ReceptionLiveUpdates() {
  const path = usePathname().replace(/\/$/, "");
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const active =
    path === "/admin" || path === "/admin/collections/conversations";
  useEffect(() => {
    if (!active) return;
    let disposed = false;
    let version: string | undefined;
    let request: AbortController | undefined;
    async function check() {
      if (disposed || request || document.hidden) return;
      const controller = new AbortController();
      request = controller;
      const timeout = setTimeout(() => controller.abort(), 8000);
      try {
        const response = await fetch(revisionURL, {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) throw Error("Reception update unavailable");
        const result = await response.json();
        if (
          !Array.isArray(result.docs) ||
          !Number.isSafeInteger(result.totalDocs)
        )
          throw Error("Invalid reception update");
        const latest = result.docs[0];
        const next = JSON.stringify([
          result.totalDocs,
          latest?.id,
          latest?.updatedAt,
          latest?.status,
          latest?.controller,
        ]);
        if (disposed) return;
        setError(false);
        if (next !== version) {
          version = next;
          // Refresh server data without reloading the document or changing list filters.
          startTransition(() => router.refresh());
        }
      } catch {
        if (!disposed) setError(true);
      } finally {
        clearTimeout(timeout);
        request = undefined;
      }
    }
    void check();
    const timer = setInterval(() => void check(), 5000);
    const resume = () => {
      if (!document.hidden) void check();
    };
    document.addEventListener("visibilitychange", resume);
    window.addEventListener("focus", resume);
    return () => {
      disposed = true;
      clearInterval(timer);
      request?.abort();
      document.removeEventListener("visibilitychange", resume);
      window.removeEventListener("focus", resume);
    };
  }, [active, path, router, retry, startTransition]);
  if (!active || !error) return null;
  return (
    <div className="reception-update-error" role="status">
      <span>Reception updates interrupted. Reconnecting automatically…</span>
      <button type="button" onClick={() => setRetry((value) => value + 1)}>
        Retry updates
      </button>
    </div>
  );
}
