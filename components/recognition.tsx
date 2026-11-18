"use client";
import { useRef } from "react";
import { LineReveal } from "@/components/line-reveal";
const recognitions = [
  {
    file: "icon-cred-3-opt.webp",
    label: "Invisalign Blue Diamond Provider 2026",
  },
  {
    file: "icon-cred-4.webp",
    label: "Proud member of the Dawson Alumni Association",
  },
  { file: "ada-new.webp", label: "American Dental Association" },
  {
    file: "top-dentists-orlando-magazine-2026.webp",
    label: "Orlando Magazine Top Dentists 2026",
  },
  { file: "fda.webp", label: "Florida Dental Association" },
  {
    file: "OFM_TopDentists_2026-opt.webp",
    label: "Orlando Family Magazine Top Dentists 2026",
  },
];
export function Recognition() {
  const track = useRef<HTMLDivElement>(null);
  function changeSpeed(rate: number) {
    track.current
      ?.getAnimations()
      .forEach((animation) => animation.updatePlaybackRate(rate));
  }
  return (
    <section
      className="recognition-section"
      aria-labelledby="recognition-title"
    >
      <div className="recognition-heading wrap">
        <div>
          <h2 id="recognition-title" data-reveal="heading">
            <LineReveal>The Fine Dentistry Difference</LineReveal>
          </h2>
          <p>
            Recognition, professional affiliations and training featured by our
            practice.
          </p>
        </div>
      </div>
      <div
        className="recognition-strip"
        tabIndex={0}
        role="region"
        aria-label="Practice recognition and affiliations"
        onPointerEnter={(event) => {
          if (event.pointerType === "mouse") changeSpeed(0.35);
        }}
        onPointerLeave={(event) => {
          if (event.pointerType === "mouse") changeSpeed(1);
        }}
      >
        <div className="recognition-track" ref={track}>
          {[0, 1].map((copy) => (
            <div
              className="recognition-set"
              key={copy}
              aria-hidden={copy === 1 ? true : undefined}
            >
              {recognitions.map((r) => (
                <figure key={r.file}>
                  <img
                    src={"/images/" + r.file}
                    alt={copy === 0 ? r.label : ""}
                    width="220"
                    height="160"
                    loading="lazy"
                  />
                </figure>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
