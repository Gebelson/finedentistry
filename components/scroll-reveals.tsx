"use client";
import { useLayoutEffect } from "react";
import { usePathname } from "next/navigation";

export function ScrollReveals() {
  const path = usePathname();
  useLayoutEffect(() => {
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !("IntersectionObserver" in window)
    )
      return;
    const seen = new WeakSet<Element>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).dataset.revealState = "visible";
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -5% 0px" },
    );
    function register(element: HTMLElement) {
      if (seen.has(element)) return;
      seen.add(element);
      if (element.dataset.reveal === "mobile-item") {
        const items = element.parentElement?.querySelectorAll(
          ':scope > [data-reveal="mobile-item"]',
        );
        if (items)
          element.style.setProperty(
            "--reveal-delay",
            `${Array.from(items).indexOf(element) * 120}ms`,
          );
      }
      const siblings = element.parentElement?.querySelectorAll(
        ':scope > [data-reveal="card"]',
      );
      if (element.dataset.reveal === "card" && siblings)
        element.style.setProperty(
          "--reveal-delay",
          `${(Array.from(siblings).indexOf(element) % 3) * 90}ms`,
        );
      element.dataset.revealState = "pending";
      observer.observe(element);
    }
    const main = document.getElementById("main");
    main?.querySelectorAll<HTMLElement>("[data-reveal]").forEach(register);
    const mutations = new MutationObserver((records) => {
      for (const record of records)
        for (const added of record.addedNodes) {
          if (!(added instanceof HTMLElement)) continue;
          if (added.matches("[data-reveal]")) register(added);
          added
            .querySelectorAll<HTMLElement>("[data-reveal]")
            .forEach(register);
        }
    });
    if (main) mutations.observe(main, { childList: true, subtree: true });
    const onFocus = (event: FocusEvent) => {
      if (event.target instanceof HTMLElement)
        event.target
          .closest<HTMLElement>("[data-reveal]")
          ?.setAttribute("data-reveal-state", "visible");
    };
    main?.addEventListener("focusin", onFocus);
    const portraits = main?.querySelectorAll<HTMLElement>(".doctor-image");
    let zoomFrame = 0;
    const updateZoom = () => {
      zoomFrame = 0;
      if (!window.matchMedia("(max-width: 767px)").matches) return;
      const height = window.innerHeight;
      portraits?.forEach((portrait) => {
        const rect = portrait.getBoundingClientRect();
        if (rect.top >= height || rect.bottom <= 0) return;
        const progress = Math.max(
          0,
          Math.min(1, (height - rect.top) / (height + rect.height)),
        );
        portrait.style.setProperty(
          "--doctor-zoom",
          (1 + progress * 0.06).toFixed(4),
        );
      });
    };
    const scheduleZoom = () => {
      if (!zoomFrame) zoomFrame = requestAnimationFrame(updateZoom);
    };
    if (portraits?.length) {
      window.addEventListener("scroll", scheduleZoom, { passive: true });
      window.addEventListener("resize", scheduleZoom);
      scheduleZoom();
    }
    return () => {
      cancelAnimationFrame(zoomFrame);
      window.removeEventListener("scroll", scheduleZoom);
      window.removeEventListener("resize", scheduleZoom);
      observer.disconnect();
      mutations.disconnect();
      main?.removeEventListener("focusin", onFocus);
      main
        ?.querySelectorAll<HTMLElement>("[data-reveal-state]")
        .forEach((e) => (e.dataset.revealState = "visible"));
    };
  }, [path]);
  return null;
}
