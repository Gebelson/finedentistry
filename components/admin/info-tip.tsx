"use client";
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

export function InfoTip({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const overTrigger = useRef(false);
  const overPanel = useRef(false);
  const pinned = useRef(false);
  const activation = useRef<{ pointerType: string; wasOpen: boolean } | null>(
    null,
  );
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function cancelClose() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }
  function closeWhenIdle() {
    cancelClose();
    timer.current = setTimeout(() => {
      if (
        !overTrigger.current &&
        !overPanel.current &&
        !pinned.current &&
        document.activeElement !== trigger.current &&
        !panel.current?.contains(document.activeElement)
      )
        setOpen(false);
    }, 160);
  }
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  useEffect(() => {
    if (!open) return;
    function dismiss() {
      pinned.current = false;
      overTrigger.current = false;
      overPanel.current = false;
      setOpen(false);
    }
    function outside(event: PointerEvent) {
      const target = event.target as Node;
      if (
        !trigger.current?.contains(target) &&
        !panel.current?.contains(target)
      )
        dismiss();
    }
    function escape(event: KeyboardEvent) {
      if (event.key === "Escape") dismiss();
    }
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);
  useLayoutEffect(() => {
    if (!open) return;
    function position() {
      if (!trigger.current || !panel.current) return;
      const anchor = trigger.current.getBoundingClientRect();
      const viewportWidth = document.documentElement.clientWidth;
      const viewportHeight = window.innerHeight;
      const roomAbove = Math.max(0, anchor.top - 20);
      const roomBelow = Math.max(0, viewportHeight - anchor.bottom - 20);
      // Long explanations scroll on the roomier side without covering their trigger.
      panel.current.style.maxHeight = `${Math.max(44, Math.min(viewportHeight - 24, Math.max(roomAbove, roomBelow)))}px`;
      const box = panel.current.getBoundingClientRect();
      const left = Math.max(
        12,
        Math.min(anchor.left, viewportWidth - box.width - 12),
      );
      const below = anchor.bottom + 8;
      const preferredTop =
        below + box.height <= viewportHeight - 12
          ? below
          : Math.max(
              12,
              Math.min(
                anchor.top - box.height - 8,
                viewportHeight - box.height - 12,
              ),
            );
      const top = Math.max(
        12,
        Math.min(preferredTop, viewportHeight - box.height - 12),
      );
      panel.current.style.left = `${left}px`;
      panel.current.style.top = `${top}px`;
      panel.current.style.visibility = "visible";
    }
    position();
    window.addEventListener("resize", position);
    window.addEventListener("scroll", position, true);
    return () => {
      window.removeEventListener("resize", position);
      window.removeEventListener("scroll", position, true);
    };
  }, [open, children]);
  return (
    <>
      <button
        ref={trigger}
        type="button"
        className="workspace-info-tip workspace-info-tip-trigger"
        aria-label={label}
        aria-expanded={open}
        aria-describedby={open ? id : undefined}
        onPointerEnter={(event) => {
          if (event.pointerType !== "touch") {
            overTrigger.current = true;
            cancelClose();
            setOpen(true);
          }
        }}
        onPointerLeave={(event) => {
          if (event.pointerType !== "touch") {
            overTrigger.current = false;
            closeWhenIdle();
          }
        }}
        onPointerDown={(event) => {
          activation.current = {
            pointerType: event.pointerType,
            wasOpen: open,
          };
        }}
        onPointerCancel={() => {
          activation.current = null;
        }}
        onFocus={() => {
          if (!activation.current) {
            cancelClose();
            setOpen(true);
          }
        }}
        onBlur={closeWhenIdle}
        onClick={() => {
          const pointer = activation.current;
          activation.current = null;
          if (pointer?.pointerType === "touch") {
            pinned.current = !pointer.wasOpen;
            setOpen(!pointer.wasOpen);
          } else {
            setOpen(true);
          }
        }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          aria-hidden="true"
          focusable="false"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M12 10.5v6" strokeLinecap="round" />
          <circle cx="12" cy="7.5" r=".8" fill="currentColor" stroke="none" />
        </svg>
      </button>
      {open &&
        createPortal(
          <div
            ref={panel}
            id={id}
            role="tooltip"
            className="workspace-info-tip-panel"
            onPointerEnter={(event) => {
              if (event.pointerType !== "touch") {
                overPanel.current = true;
                cancelClose();
              }
            }}
            onPointerLeave={(event) => {
              if (event.pointerType !== "touch") {
                overPanel.current = false;
                closeWhenIdle();
              }
            }}
          >
            {children}
          </div>,
          document.body,
        )}
    </>
  );
}
export function HeadingInfo({
  title,
  level = 2,
  id,
  children,
}: {
  title: string;
  level?: 1 | 2 | 3;
  id?: string;
  children: ReactNode;
}) {
  const Heading = `h${level}` as "h1" | "h2" | "h3";
  return (
    <div className="workspace-heading-with-info">
      <Heading id={id}>{title}</Heading>
      <InfoTip label={`About ${title}`}>{children}</InfoTip>
    </div>
  );
}
