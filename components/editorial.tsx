import { LineReveal } from "@/components/line-reveal";
import { SiteImage } from "@/components/site-image";
import { OfficeHours } from "@/components/visit-information";
import { FooterSocialIcons } from "@/components/footer-social-icons";
import Link from "next/link";
import { AppointmentButton } from "./site-chrome";
import { doctors, siteConfig } from "@/lib/site-data";
export function SectionHeading({
  label,
  title,
  description,
}: {
  label: string;
  title: React.ReactNode;
  description?: string;
}) {
  return (
    <div className="section-heading">
      <span className="section-label">{label}</span>
      <h2 data-reveal="heading">
        <LineReveal>{title}</LineReveal>
      </h2>
      {description && <p>{description}</p>}
    </div>
  );
}
export function Doctors({ detailed = false }: { detailed?: boolean }) {
  return (
    <div className="doctors-grid">
      {doctors.map((d, i) => (
        <article data-reveal="card" className="doctor" key={d.name}>
          <div className="doctor-image">
            <SiteImage
              src={"/images/" + d.image}
              sizes="(min-width: 1440px) 427px, (min-width: 768px) calc((100vw - 112px) / 3), calc(100vw - 40px)"
              alt={d.name}
              width="600"
              height="750"
              loading="lazy"
            />
          </div>
          <div className="doctor-meta">
            <span>0{i + 1}</span>
            <span>{d.credential}</span>
          </div>
          <h3>{d.name}</h3>
          <p>{d.bio}</p>
          {detailed && (
            <details>
              <summary>Read biography</summary>
              {d.paragraphs.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </details>
          )}
        </article>
      ))}
    </div>
  );
}
export function FinalCTA() {
  return (
    <section className="final-cta">
      <SiteImage
        sizes="(max-width: 767px) 1536px, 100vw"
        src="/images/Dentist_orlando.webp"
        alt="Dr. Trivedi speaking with a patient in the Orlando practice"
        loading="lazy"
        width="1600"
        height="1000"
      />
      <div className="wrap">
        <p>Your smile. Your next chapter.</p>
        <div className="cta-composition">
          <h2 data-reveal="heading">
            <LineReveal>
              Dental care,
              <br />
              <em>with you in mind.</em>
            </LineReveal>
          </h2>
          <div className="cta-bottom">
            <p>
              Discover a personal approach to dentistry.
              <br />
              Right here in Downtown Orlando.
            </p>
            <AppointmentButton />
          </div>
        </div>
      </div>
    </section>
  );
}
export function ContactBlock() {
  return (
    <div className="contact-grid" data-reveal="fade">
      <div>
        <h3>
          A place to feel
          <br />
          <em>at home.</em>
        </h3>
        <p>{siteConfig.address}</p>
        <a
          className="text-link"
          href={siteConfig.directions}
          target="_blank"
          rel="noreferrer"
        >
          Get directions ↗
        </a>
      </div>
      <div>
        <a className="contact-phone" href={siteConfig.tel}>
          {siteConfig.phone}
        </a>
        <a href={"mailto:" + siteConfig.email}>{siteConfig.email}</a>
        <FooterSocialIcons className="contact-social-icons" />
        <p>
          Call our team to confirm current office hours and appointment
          availability.
        </p>
        <AppointmentButton className="button" />
      </div>
      <SiteImage
        src="/images/fine_dentistry_sign.webp"
        alt="Fine Dentistry of Downtown Orlando practice sign"
        width="600"
        height="400"
        loading="lazy"
      />
      <div className="visit-details">
        <OfficeHours />
      </div>
    </div>
  );
}
export function PatientResources() {
  return (
    <div className="resource-grid">
      {[
        [
          "Your first visit",
          "A warm welcome, a conversation, and a plan made for you.",
          "new-patients",
        ],
        [
          "Flexible ways to pay",
          "Explore financing and in-house membership options.",
          "financing",
        ],
        [
          "Before you arrive",
          "Complete your forms through the clinic’s official website.",
          "https://www.finedentistryorlando.com/Form/Fill/Patient-Registration",
        ],
      ].map(([t, p, u], i) => (
        <article key={t} data-reveal="card">
          <span>0{i + 1}</span>
          <h3>{t}</h3>
          <p>{p}</p>
          <Link href={u.startsWith("http") ? u : "/" + u}>Learn more ↗</Link>
        </article>
      ))}
    </div>
  );
}
