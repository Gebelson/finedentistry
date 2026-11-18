"use client";
import { SiteImage } from "@/components/site-image";
import Link from "next/link";
import { useLayoutEffect, useRef, useState } from "react";
import { faq, gallery, services, testimonials } from "@/lib/site-data";
import { ReviewAttribution } from "@/components/reviews";
export function FAQ({
  items = faq,
}: {
  items?: { q: string; a: string; list?: string[] }[];
}) {
  return (
    <div className="faq-list" data-reveal="fade">
      {items.map((f, i) => (
        <details key={f.q}>
          <summary>
            <span className="faq-number">{String(i + 1).padStart(2, "0")}</span>
            {f.q}
            <span className="plus" aria-hidden="true">
              +
            </span>
          </summary>
          <p>{f.a}</p>
          {f.list?.length ? (
            <ul>
              {f.list.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}
        </details>
      ))}
    </div>
  );
}
export function ServicesGrid({
  filter = false,
  featured = false,
}: {
  filter?: boolean;
  featured?: boolean;
}) {
  const [category, setCategory] = useState("All");
  const grid = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!featured) return;
    const section = grid.current?.closest<HTMLElement>("#services");
    const heading = section?.querySelector<HTMLElement>(".section-heading");
    const header = document.querySelector<HTMLElement>(".header");
    const runway = section?.querySelector<HTMLElement>(
      ".treatment-stack-scroll",
    );
    const stage = section?.querySelector<HTMLElement>(".treatment-stack-stage");
    if (!section || !heading || !header || !runway || !stage || !grid.current)
      return;
    const cards = Array.from(
      grid.current.querySelectorAll<HTMLElement>(".service-card"),
    );
    const media = window.matchMedia(
      "(max-width: 767px) and (prefers-reduced-motion: no-preference)",
    );
    let frame = 0,
      step = 1,
      previous = -1;
    const paint = () => {
      frame = 0;
      if (!media.matches) return;
      const progress = Math.max(
        0,
        Math.min(
          cards.length - 1,
          (header.offsetHeight - runway.getBoundingClientRect().top) / step,
        ),
      );
      if (progress === previous) return;
      previous = progress;
      const clamp = (value: number) => Math.max(0, Math.min(1, value));
      cards.forEach((card, i) => {
        const incoming = i === 0 ? 1 : clamp((progress - i + 1 - 0.22) / 0.78);
        const covered = clamp((progress - i - 0.22) / 0.78);
        const remaining = 1 - incoming;
        card.style.setProperty(
          "--stack-offset",
          `calc(${remaining * 100}% + ${remaining * 32 + covered * 20}px)`,
        );
        card.style.setProperty("--stack-scale", `${1 - covered * 0.06}`);
      });
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(paint);
    };
    const measure = () => {
      if (!media.matches) {
        delete section.dataset.stackReady;
        runway.style.height = "";
        previous = -1;
        cards.forEach((card) => {
          card.style.removeProperty("--stack-offset");
          card.style.removeProperty("--stack-scale");
        });
        return;
      }
      section.dataset.stackReady = "true";
      section.style.setProperty(
        "--treatment-heading-height",
        `${heading.offsetHeight}px`,
      );
      section.style.setProperty(
        "--treatment-header-height",
        `${header.offsetHeight}px`,
      );
      step = grid.current!.offsetHeight * 1.3 + 64;
      runway.style.height = `${stage.offsetHeight + (cards.length - 0.6) * step}px`;
      previous = -1;
      schedule();
    };
    const onFocus = (event: FocusEvent) => {
      if (!media.matches || !(event.target instanceof HTMLElement)) return;
      const index = cards.indexOf(
        event.target.closest<HTMLElement>(".service-card")!,
      );
      if (index < 0) return;
      window.scrollTo({
        top:
          window.scrollY +
          runway.getBoundingClientRect().top -
          header.offsetHeight +
          index * step,
        behavior: "instant",
      });
      paint();
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(heading);
    observer.observe(header);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", measure);
    media.addEventListener("change", measure);
    grid.current.addEventListener("focusin", onFocus);
    const element = grid.current;
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", measure);
      media.removeEventListener("change", measure);
      element.removeEventListener("focusin", onFocus);
      delete section.dataset.stackReady;
      runway.style.height = "";
    };
  }, [featured]);
  const order = [
    "dental-implants",
    "veneers",
    "invisalign-adults",
    "same-day-crowns",
    "dental-hygiene",
    "teeth-whitening",
  ];
  const items = featured
    ? order.map((slug) => services.find((s) => s.slug.endsWith("/" + slug))!)
    : services.filter((s) => category === "All" || s.category === category);
  return (
    <>
      {filter && (
        <div className="filters" aria-label="Filter treatments">
          {["All", "General", "Cosmetic", "Restorative", "Aesthetics"].map(
            (c) => (
              <button
                aria-pressed={category === c}
                className={category === c ? "selected" : ""}
                key={c}
                onClick={() => setCategory(c)}
              >
                {c}
              </button>
            ),
          )}
        </div>
      )}
      <div
        ref={grid}
        className={"services-grid" + (featured ? " services-stack" : "")}
      >
        {items.map((s, i) => (
          <Link
            className="service-card"
            data-reveal="card"
            href={"/" + s.slug}
            key={s.slug}
            style={featured ? { zIndex: i + 1 } : undefined}
          >
            <div className="service-image">
              <SiteImage
                src={"/images/" + s.image}
                alt={s.alt}
                loading="lazy"
                width="600"
                height="700"
              />
              <span className="service-plus" aria-hidden="true">
                +
              </span>
            </div>
            <div className="service-title">
              <span>({String(i + 1).padStart(2, "0")})</span>
              <h3>{s.title}</h3>
            </div>
            <span className="service-category">{s.category} Dentistry</span>
          </Link>
        ))}
      </div>
    </>
  );
}
export function Testimonials() {
  const [index, setIndex] = useState(0);
  const start = useRef<number | null>(null);
  const t = testimonials[index];
  const move = (direction: number) =>
    setIndex(
      (current) =>
        (current + direction + testimonials.length) % testimonials.length,
    );
  return (
    <div
      className="testimonials"
      role="region"
      aria-roledescription="carousel"
      aria-label="Selected Google reviews"
      tabIndex={0}
      data-reveal="fade"
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget) return;
        if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
          e.preventDefault();
          move(e.key === "ArrowRight" ? 1 : -1);
        }
      }}
      onTouchStart={(e) => (start.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (start.current !== null) {
          const distance = e.changedTouches[0].clientX - start.current;
          if (Math.abs(distance) > 35) move(distance < 0 ? 1 : -1);
        }
        start.current = null;
      }}
      onTouchCancel={() => (start.current = null)}
    >
      <div className="quote-mark" aria-hidden="true">
        “
      </div>
      <div aria-live="polite">
        <div className="review-quote-frame">
          {testimonials.map((review, i) => (
            <blockquote
              key={review.source}
              aria-hidden={i !== index}
              data-active={i === index}
            >
              {review.quote}
            </blockquote>
          ))}
        </div>
        <ReviewAttribution name={t.name} source={t.source} rating={t.rating} />
      </div>
      <div className="carousel-controls">
        <button onClick={() => move(-1)} aria-label="Previous patient story">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.25"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M19 12H5m5-5-5 5 5 5" />
          </svg>
        </button>
        <span aria-live="polite">
          {String(index + 1).padStart(2, "0")} /{" "}
          {String(testimonials.length).padStart(2, "0")}
        </span>
        <button onClick={() => move(1)} aria-label="Next patient story">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.25"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M5 12h14m-5-5 5 5-5 5" />
          </svg>
        </button>
      </div>
      <Link className="text-link" href="/patient-reviews">
        Read more patient stories
      </Link>
    </div>
  );
}
export function SmileGallery({ full = false }: { full?: boolean }) {
  const [active, setActive] = useState<number | null>(null);
  const d = useRef<HTMLDialogElement>(null);
  return (
    <>
      <div className={"gallery-grid " + (full ? "full" : "")}>
        {gallery.slice(0, full ? gallery.length : 3).map((item, i) => (
          <button
            key={item.file}
            className="gallery-item"
            data-reveal="card"
            onClick={() => {
              setActive(i);
              d.current?.showModal();
            }}
            aria-label={`View smile case ${i + 1} — ${item.title}`}
          >
            <div className="gallery-image-frame">
              <img
                src={"/images/" + item.file}
                alt={`${item.title}, before and after case ${i + 1}, published by Fine Dentistry`}
                width="600"
                height="400"
                loading="lazy"
              />
            </div>
            <span>
              {item.title} <span aria-hidden="true">↗</span>
            </span>
          </button>
        ))}
      </div>
      <p className="caption">
        Individual results vary. Cases published by Fine Dentistry. Treatment
        suitability is assessed at your consultation.
      </p>
      <dialog
        ref={d}
        className="gallery-dialog"
        aria-label="Smile case viewer"
        onClick={(e) => {
          if (e.target === d.current) d.current?.close();
        }}
      >
        <button
          className="dialog-close"
          onClick={() => d.current?.close()}
          aria-label="Close smile case"
        >
          ×
        </button>
        {active !== null && (
          <>
            <img
              src={"/images/" + gallery[active].file}
              alt={`${gallery[active].title}, published before and after case ${active + 1}`}
            />
            <p className="gallery-case-title">{gallery[active].title}</p>
            <div className="carousel-controls">
              <button
                onClick={() =>
                  setActive((active + gallery.length - 1) % gallery.length)
                }
                aria-label="Previous smile case"
              >
                ←
              </button>
              <span>
                Case {active + 1} of {gallery.length}
              </span>
              <button
                onClick={() => setActive((active + 1) % gallery.length)}
                aria-label="Next smile case"
              >
                →
              </button>
            </div>
          </>
        )}
      </dialog>
    </>
  );
}
