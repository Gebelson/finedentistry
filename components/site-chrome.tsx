"use client";
import Link from "next/link";
import { ScrollReveals } from "@/components/scroll-reveals";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { services, siteConfig } from "@/lib/site-data";
import { FooterSocialIcons } from "@/components/footer-social-icons";
const BookingContext = createContext<() => void>(() => {});
export function AppointmentButton({
  className = "bracket",
  children = "Request an Appointment",
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  const open = useContext(BookingContext);
  return (
    <button className={className} onClick={open}>
      {children}
    </button>
  );
}
const navigation = [
  ["Our Practice", "/about"],
  ["Treatments", "/services"],
  ["Our Doctors", "/our-team"],
  ["For Patients", "/new-patients"],
  ["Contact", "/contact"],
  ["Blog", "/blog"],
];
export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [menu, setMenu] = useState(false),
    [step, setStep] = useState(1),
    [treatment, setTreatment] = useState(""),
    [doctor, setDoctor] = useState("No preference");
  const dialog = useRef<HTMLDialogElement>(null),
    trigger = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (!menu) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenu(false);
        document.querySelector<HTMLButtonElement>(".menu-toggle")?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    document.querySelector<HTMLAnchorElement>(".mobile-nav a")?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [menu]);
  useEffect(() => {
    if (dialog.current?.open) document.getElementById("booking-title")?.focus();
  }, [step]);
  useEffect(() => {
    const header = document.querySelector(".header");
    const update = () =>
      header?.classList.toggle("scrolled", window.scrollY > 70);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [pathname]);
  function goHome(event: React.MouseEvent<HTMLAnchorElement>) {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    setMenu(false);
    if (pathname !== "/") return;
    event.preventDefault();
    window.history.replaceState(window.history.state, "", "/");
    window.scrollTo({
      top: 0,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  }
  function open() {
    trigger.current = document.activeElement as HTMLElement;
    setStep(1);
    dialog.current?.showModal();
    document.body.style.overflow = "hidden";
  }
  function closed() {
    document.body.style.overflow = "";
    trigger.current?.focus();
  }
  function close() {
    dialog.current?.close();
  }
  return (
    <BookingContext.Provider value={open}>
      <ScrollReveals />
      <header
        className={"header " + (pathname === "/" ? "over-hero" : "solid")}
      >
        <Link href="/" className="wordmark" onClick={goHome}>
          <img
            src="/images/bannerlogo.webp"
            alt="Fine Dentistry of Downtown Orlando"
            width="947"
            height="357"
          />
        </Link>
        <nav className="desktop-nav" aria-label="Main navigation">
          {navigation.map(([text, url]) => (
            <Link
              className={url === "/blog" ? "nav-blog" : undefined}
              aria-current={pathname === url ? "page" : undefined}
              href={url}
              key={url}
            >
              {text}
            </Link>
          ))}
        </nav>
        <AppointmentButton />
        <button
          className="menu-toggle"
          aria-expanded={menu}
          aria-controls="mobile-navigation"
          onClick={() => setMenu(!menu)}
        >
          {menu ? "Close −" : "Menu +"}
        </button>
      </header>
      {menu && (
        <nav
          className="mobile-nav"
          id="mobile-navigation"
          aria-label="Mobile navigation"
          onKeyDown={(e) => {
            if (e.key === "Escape") setMenu(false);
          }}
        >
          {navigation.map(([text, url]) => (
            <Link href={url} key={url} onClick={() => setMenu(false)}>
              {text}
            </Link>
          ))}
          <Link href="/smile-gallery" onClick={() => setMenu(false)}>
            Smile Gallery
          </Link>
          <a href={siteConfig.tel}>{siteConfig.phone}</a>
        </nav>
      )}
      {children}
      <footer>
        <div className="footer-top">
          <Link href="/" className="footer-brand" onClick={goHome}>
            <img
              src="/images/bannerlogo.webp"
              alt="Fine Dentistry of Downtown Orlando"
              width="947"
              height="357"
              loading="lazy"
            />
          </Link>
          <p>
            Thoughtful care.
            <br />A smile that’s yours.
          </p>
        </div>
        <div className="footer-grid">
          <div>
            <span className="muted">Visit us</span>
            <a href={siteConfig.directions} target="_blank" rel="noreferrer">
              429 N Fern Creek Avenue
              <br />
              Orlando, FL 32803 ↗
            </a>
            <a href={siteConfig.tel}>{siteConfig.phone}</a>
            <a href={"mailto:" + siteConfig.email}>{siteConfig.email}</a>
            <FooterSocialIcons />
          </div>
          <div>
            <span className="muted">Explore</span>
            {navigation.slice(0, 3).map(([t, u]) => (
              <Link key={u} href={u}>
                {t}
              </Link>
            ))}
            <Link href="/technology">Our Technology</Link>
            <Link href="/smile-gallery">Smile Gallery</Link>
          </div>
          <div>
            <span className="muted">For patients</span>
            {[
              ["New Patients", "new-patients"],
              ["Financing", "financing"],
              ["Membership Plans", "membership"],
              ["Patient Reviews", "patient-reviews"],
              ["Questions & Answers", "faq"],
              ["Patient Journal", "blog"],
            ].map(([t, u]) => (
              <Link href={"/" + u} key={u}>
                {t}
              </Link>
            ))}
          </div>
          <div>
            <span className="muted">Practice resources</span>
            <Link href="/careers">Careers</Link>
            <Link href="/news">News & Media</Link>
            <Link href="/post-op">Post-op Instructions</Link>
            <a href={siteConfig.official + "/BillPay"}>Make a Payment ↗</a>
          </div>
        </div>
        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} Fine Dentistry of Downtown Orlando
          </span>
          <Link href="/privacy">Privacy information</Link>
          <span>Made for your smile.</span>
        </div>
      </footer>
      <dialog
        ref={dialog}
        className="booking"
        onClose={closed}
        onClick={(e) => {
          if (e.target === dialog.current) close();
        }}
        aria-labelledby="booking-title"
      >
        <button
          className="dialog-close"
          onClick={close}
          aria-label="Close appointment dialog"
        >
          ×
        </button>
        <p className="eyebrow">Your next chapter starts here</p>
        <div className="steps" aria-label={`Step ${step} of 3`}>
          {["Your care", "Your visit", "Get in touch"].map((s, i) => (
            <span key={s} className={step === i + 1 ? "active" : ""}>
              {i + 1}. {s}
            </span>
          ))}
        </div>
        <h2 id="booking-title" tabIndex={-1}>
          {step === 1
            ? "Let’s start with you."
            : step === 2
              ? "Care on your terms."
              : "Let’s make it happen."}
        </h2>
        {step === 1 ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setStep(2);
            }}
          >
            <label htmlFor="treatment">Treatment</label>
            <select
              id="treatment"
              name="treatment"
              value={treatment}
              required
              onChange={(e) => setTreatment(e.target.value)}
            >
              <option value="">Select a treatment</option>
              <option>New patient visit</option>
              {services.map((s) => (
                <option key={s.slug}>{s.title}</option>
              ))}
            </select>
            <label htmlFor="doctor">Preferred doctor (optional)</label>
            <select
              id="doctor"
              name="doctor"
              value={doctor}
              onChange={(e) => setDoctor(e.target.value)}
            >
              <option>No preference</option>
              <option>Dr. Aileen Trivedi</option>
              <option>Dr. Sergio Lascurain</option>
              <option>Dr. Amanda Perez</option>
            </select>
            <button className="button" type="submit">
              Continue
            </button>
          </form>
        ) : step === 2 ? (
          <div>
            <p>
              You’re interested in <strong>{treatment}</strong>
              {doctor !== "No preference" ? ` with ${doctor}` : ""}.
            </p>
            <p>
              Speak with our team by phone, or continue to the clinic’s official
              appointment form to share your contact details and preferred time.
            </p>
            <p className="notice">
              This preview does not send appointment requests or store your
              personal information. The clinic will confirm availability
              directly.
            </p>
            <button className="button" onClick={() => setStep(3)}>
              Continue
            </button>
          </div>
        ) : (
          <div>
            <p>Contact our Downtown Orlando team to request your visit.</p>
            <a className="button" href={siteConfig.official + "/Contact"}>
              Continue on the clinic website
            </a>
            <a className="text-link" href={siteConfig.tel}>
              Call {siteConfig.phone}
            </a>
            <p className="notice">Your appointment is not confirmed.</p>
          </div>
        )}
        {step > 1 && (
          <button className="back" onClick={() => setStep(step - 1)}>
            ← Back
          </button>
        )}
      </dialog>
    </BookingContext.Provider>
  );
}
