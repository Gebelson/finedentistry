"use client";

import { useEffect, useRef } from "react";

export function Scrollbar() {
  const railRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const rail = railRef.current!;
    const thumb = thumbRef.current!;
    const root = document.documentElement;
    let frame = 0;
    let timer: ReturnType<typeof setTimeout>;
    let dragging = false;
    let grabOffset = 0;
    let thumbHeight = 48;
    let travel = 0;
    let maxScroll = 0;

    function update() {
      frame = 0;
      const progress = maxScroll
        ? Math.min(1, Math.max(0, scrollY / maxScroll))
        : 0;
      thumb.style.transform = `translateY(${progress * travel}px)`;
      rail.setAttribute("aria-valuenow", String(Math.round(progress * 100)));
    }
    function measure() {
      const height = rail.clientHeight;
      maxScroll = Math.max(0, root.scrollHeight - innerHeight);
      thumbHeight = Math.min(
        height,
        Math.max(48, Math.min(120, (height * innerHeight) / root.scrollHeight)),
      );
      travel = height - thumbHeight;
      thumb.style.height = `${thumbHeight}px`;
      rail.hidden = !maxScroll;
      schedule();
    }
    function schedule() {
      if (!frame) frame = requestAnimationFrame(update);
    }
    function activate() {
      rail.dataset.active = "";
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (!dragging) delete rail.dataset.active;
      }, 900);
      schedule();
    }
    function move(event: PointerEvent) {
      if (!dragging || !travel) return;
      const progress =
        (event.clientY - rail.getBoundingClientRect().top - grabOffset) /
        travel;
      window.scrollTo({
        top: Math.max(0, Math.min(1, progress)) * maxScroll,
        behavior: "instant",
      });
    }
    function down(event: PointerEvent) {
      if (event.button !== 0) return;
      event.preventDefault();
      measure();
      dragging = true;
      grabOffset =
        event.target === thumb
          ? event.clientY - thumb.getBoundingClientRect().top
          : thumbHeight / 2;
      rail.setPointerCapture(event.pointerId);
      activate();
      move(event);
    }
    function up() {
      dragging = false;
      activate();
    }
    function key(event: KeyboardEvent) {
      const targets: Record<string, number> = {
        ArrowDown: scrollY + 80,
        ArrowUp: scrollY - 80,
        PageDown: scrollY + innerHeight * 0.85,
        PageUp: scrollY - innerHeight * 0.85,
        Home: 0,
        End: maxScroll,
      };
      if (!(event.key in targets)) return;
      event.preventDefault();
      window.scrollTo({ top: targets[event.key], behavior: "instant" });
      activate();
    }
    root.dataset.customScroll = "";
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(document.body);
    window.addEventListener("scroll", activate, { passive: true });
    window.addEventListener("resize", measure);
    rail.addEventListener("pointerdown", down);
    rail.addEventListener("pointermove", move);
    rail.addEventListener("pointerup", up);
    rail.addEventListener("pointercancel", up);
    rail.addEventListener("keydown", key);
    return () => {
      delete root.dataset.customScroll;
      observer.disconnect();
      cancelAnimationFrame(frame);
      clearTimeout(timer);
      window.removeEventListener("scroll", activate);
      window.removeEventListener("resize", measure);
      rail.removeEventListener("pointerdown", down);
      rail.removeEventListener("pointermove", move);
      rail.removeEventListener("pointerup", up);
      rail.removeEventListener("pointercancel", up);
      rail.removeEventListener("keydown", key);
    };
  }, []);

  return (
    <div
      ref={railRef}
      className="scroll-rail"
      role="scrollbar"
      tabIndex={0}
      aria-label="Page scroll"
      aria-controls="main"
      aria-orientation="vertical"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={0}
    >
      <span ref={thumbRef} className="scroll-rail-thumb" />
    </div>
  );
}
