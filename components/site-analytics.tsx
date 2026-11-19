"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { referralSource } from "@/lib/analytics-types";
export function SiteAnalytics() {
  const path = usePathname();
  const previous = useRef("");
  useEffect(() => {
    if (
      !path ||
      path.startsWith("/admin") ||
      path.startsWith("/api") ||
      path.startsWith("/workspace-preview")
    )
      return;
    if (
      navigator.doNotTrack === "1" ||
      (navigator as Navigator & { globalPrivacyControl?: boolean })
        .globalPrivacyControl
    )
      return;
    let source: ReturnType<typeof referralSource> = "direct";
    try {
      const url = new URL(document.referrer);
      if (url.hostname !== location.hostname)
        source = referralSource(url.hostname);
    } catch {}
    const send = (event: string) => {
      const body = JSON.stringify({ event, path, source });
      void fetch("/api/site-analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      }).catch(() => {});
    };
    if (previous.current !== path) {
      previous.current = path;
      send("pageview");
    }
    const click = (event: MouseEvent) => {
      const element =
        event.target instanceof Element
          ? event.target.closest("a,button")
          : null;
      if (!element) return;
      const explicit = element.getAttribute("data-analytics-event");
      if (explicit) {
        send(explicit);
        return;
      }
      const href = element.getAttribute("href") || "";
      if (href.startsWith("tel:")) send("phone_click");
      else if (href.startsWith("mailto:")) send("email_click");
    };
    document.addEventListener("click", click, true);
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") send("heartbeat");
    }, 60000);
    return () => {
      document.removeEventListener("click", click, true);
      clearInterval(timer);
    };
  }, [path]);
  return null;
}
