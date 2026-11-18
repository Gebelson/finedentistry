"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

/** Covers the old route before navigation, then reveals the committed destination. */
export function PageTransition() {
  const router = useRouter();
  const pathname = usePathname();
  const curtain = useRef<HTMLDivElement>(null);
  const destination = useRef<string | null>(null);
  const reveal = useRef<(() => void) | null>(null);

  useEffect(() => {
    const panel = curtain.current;
    if (!panel) return;
    let phase = "idle";
    let disposed = false;
    let animation: Animation | undefined;
    let timeout: ReturnType<typeof setTimeout> | undefined;

    const reset = () => {
      clearTimeout(timeout);
      animation?.cancel();
      panel.dataset.phase = phase = "idle";
      destination.current = null;
    };
    reveal.current = () => {
      if (phase !== "waiting") return;
      clearTimeout(timeout);
      if (!window.location.hash) {
        window.scrollTo({ top: 0, behavior: "instant" });
      }
      panel.dataset.phase = phase = "revealing";
      animation?.cancel();
      animation = panel.animate(
        [{ transform: "translateY(0)" }, { transform: "translateY(-100%)" }],
        {
          duration: 460,
          easing: "cubic-bezier(.76,0,.24,1)",
          fill: "forwards",
        },
      );
      void animation.finished
        .then(() => {
          if (disposed) return;
          reset();
          const main = document.getElementById("main");
          main?.setAttribute("tabindex", "-1");
          main?.focus({ preventScroll: true });
        })
        .catch(() => {});
    };

    const navigate = async (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const link =
        event.target instanceof Element
          ? event.target.closest<HTMLAnchorElement>("a[href]")
          : null;
      if (
        !link ||
        link.hasAttribute("download") ||
        (link.target && link.target !== "_self") ||
        link.rel.split(/\s+/).includes("external")
      )
        return;
      const url = new URL(link.href, window.location.href);
      if (
        url.origin !== window.location.origin ||
        !/^https?:$/.test(url.protocol)
      )
        return;
      if (url.pathname === window.location.pathname) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      event.preventDefault();
      if (phase !== "idle") return;
      destination.current = url.pathname;
      router.prefetch(url.pathname + url.search);
      panel.dataset.phase = phase = "covering";
      animation = panel.animate(
        [{ transform: "translateY(100%)" }, { transform: "translateY(0)" }],
        {
          duration: 340,
          easing: "cubic-bezier(.76,0,.24,1)",
          fill: "forwards",
        },
      );
      try {
        await animation.finished;
      } catch {
        return;
      }
      if (disposed) return;
      panel.dataset.phase = phase = "waiting";
      // A failed navigation must never leave the page behind an opaque panel.
      timeout = setTimeout(reset, 8000);
      router.push(url.pathname + url.search + url.hash);
    };
    document.addEventListener("click", navigate, true);
    return () => {
      disposed = true;
      document.removeEventListener("click", navigate, true);
      reveal.current = null;
      reset();
    };
  }, [router]);

  useEffect(() => {
    if (destination.current === pathname) reveal.current?.();
  }, [pathname]);

  return (
    <div
      ref={curtain}
      className="page-transition"
      data-phase="idle"
      aria-hidden="true"
    />
  );
}
