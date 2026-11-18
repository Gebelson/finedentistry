import { LineReveal } from "@/components/line-reveal";
import { SiteImage } from "@/components/site-image";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Journal, journalPageCount } from "@/components/journal";
import { pages, technologies, siteConfig, sourceFAQs } from "@/lib/content";
import { FAQ, ServicesGrid, SmileGallery } from "@/components/interactive";
import { ReviewGrid } from "@/components/reviews";
import { AppointmentButton } from "@/components/site-chrome";
import {
  ContactBlock,
  Doctors,
  FinalCTA,
  PatientResources,
} from "@/components/editorial";
const extra = [
  ...Array.from({ length: journalPageCount - 1 }, (_, i) => ({
    slug: `blog/page/${i + 2}`,
    title: "The Fine Dentistry Journal",
  })),
  { slug: "technology", title: "Technology, Thoughtfully Applied" },
  { slug: "privacy", title: "Privacy Information" },
];
export function generateStaticParams() {
  return [...pages, ...extra].map((p) => ({ slug: p.slug.split("/") }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = [...pages, ...extra].find((p) => p.slug === slug.join("/"));
  return {
    title: p?.title || "Page not found",
    description: p
      ? `Explore ${p.title.toLowerCase()} at Fine Dentistry of Downtown Orlando. Personalized care in Orlando, FL.`
      : undefined,
    alternates: process.env.SITE_URL
      ? { canonical: new URL("/" + slug.join("/"), process.env.SITE_URL).href }
      : undefined,
  };
}
export default async function ContentPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug: parts } = await params;
  const slug = parts.join("/"),
    page = pages.find((p) => p.slug === slug),
    special = extra.find((p) => p.slug === slug);
  if (!page && !special) notFound();
  const title = page?.title || special!.title;
  const isJournal = slug === "blog" || /^blog\/page\/\d+$/.test(slug);
  const blogPage = isJournal ? Number(parts[2]) || 1 : 1;
  const editorial =
    !isJournal &&
    ![
      "services",
      "our-team",
      "smile-gallery",
      "patient-reviews",
      "faq",
      "contact",
      "blog",
      "technology",
      "privacy",
    ].includes(slug);
  return (
    <main id="main">
      <section className="page-hero wrap">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span>/</span>
          {parts.length > 1 && (
            <>
              <Link href={"/" + parts[0]}>
                {parts[0] === "about"
                  ? "Our Practice"
                  : parts[0] === "our-team"
                    ? "Our Doctors"
                    : parts[0]}
              </Link>
              <span>/</span>
            </>
          )}
          <span>{title}</span>
        </nav>
        <div className="page-heading">
          <span className="section-label">
            {page?.category || "Our practice"}
          </span>
          <h1 data-reveal="heading">
            <LineReveal>{title}</LineReveal>
          </h1>
        </div>
        <div className="page-intro">
          <p>
            {slug === "services"
              ? "Comprehensive care, considered for you. Explore our general, cosmetic, restorative and aesthetic treatments."
              : slug === "our-team"
                ? "Different backgrounds. A shared commitment to personal, thoughtful care. Meet your Downtown Orlando dental team."
                : slug === "technology"
                  ? "Digital tools that help us see clearly, plan carefully and care personally."
                  : slug === "blog"
                    ? "Ideas, answers and guidance from the Fine Dentistry team."
                    : page?.paragraphs[0] ||
                      "Explore care at Fine Dentistry of Downtown Orlando."}
          </p>
          <AppointmentButton />
        </div>
      </section>
      <div className="wrap page-content">
        {slug === "services" && <ServicesGrid filter />}
        {slug === "our-team" && <Doctors detailed />}
        {slug === "smile-gallery" && <SmileGallery full />}
        {slug === "patient-reviews" && (
          <>
            <ReviewGrid />
            <p className="reading-note">Read patient feedback at its source.</p>
            <a
              className="button"
              href={siteConfig.official + "/Patient-Reviews"}
            >
              Read official patient reviews ↗
            </a>
          </>
        )}
        {slug === "faq" && (
          <FAQ items={sourceFAQs.filter((f) => f.a.trim().length > 0)} />
        )}
        {slug === "contact" && <ContactBlock />}
        {slug === "technology" && (
          <div className="resource-grid">
            {technologies.map((t, i) => (
              <article key={t.slug}>
                <span>0{i + 1}</span>
                <h2>{t.title}</h2>
                <p>{t.paragraphs[0]}</p>
                <Link className="text-link" href={"/" + t.slug}>
                  Explore technology ↗
                </Link>
              </article>
            ))}
            <article>
              <h2>CEREC Same-Day Crowns</h2>
              <p>Digital scanning and in-office restoration milling.</p>
              <Link href="/services/same-day-crowns">Explore CEREC ↗</Link>
            </article>
            <article>
              <h2>iTero & Digital Impressions</h2>
              <p>Learn how digital scans support Invisalign planning.</p>
              <Link href="/invisalign">Explore Invisalign ↗</Link>
            </article>
          </div>
        )}
        {isJournal && <Journal page={blogPage} />}{" "}
        {slug === "privacy" && (
          <div className="prose">
            <h2>Your information</h2>
            <p>
              This local website preview does not collect appointment details,
              process payments or use analytics. Appointment requests, patient
              registration, medical history and payments continue on the
              clinic’s official website.
            </p>
            <p>
              For questions about the clinic’s privacy practices and patient
              records, contact the practice directly at{" "}
              <a href={"mailto:" + siteConfig.email}>{siteConfig.email}</a>.
            </p>
            <p>
              Directions links open Google Maps. Google’s privacy practices
              apply when you visit that service.
            </p>
            <p>
              A clinic-approved privacy notice is required before enabling any
              data collection on this website.
            </p>
          </div>
        )}
        {editorial && (
          <div className="editorial-layout">
            <article className="prose">
              {page?.slug === "about" && (
                <SiteImage
                  className="editorial-photo"
                  src="/images/team_photo.webp"
                  alt="The Fine Dentistry team"
                  width="1000"
                  height="700"
                />
              )}
              {page && "sections" in page && page.sections?.length
                ? page.sections
                    .filter(
                      (s) =>
                        s.text !== page.paragraphs[0] && s.text !== page.title,
                    )
                    .map((s, i) =>
                      s.tag === "H2" ? (
                        <h2 key={i}>{s.text}</h2>
                      ) : s.tag === "H3" ? (
                        <h3 key={i}>{s.text}</h3>
                      ) : s.tag === "UL" ? (
                        <ul key={i}>
                          {s.items.map((item: string, j: number) => (
                            <li key={j}>{item}</li>
                          ))}
                        </ul>
                      ) : s.tag === "OL" ? (
                        <ol key={i}>
                          {s.items.map((item: string, j: number) => (
                            <li key={j}>{item}</li>
                          ))}
                        </ol>
                      ) : (
                        <p key={i}>{s.text}</p>
                      ),
                    )
                : page?.paragraphs.slice(1).map((p, i) => <p key={i}>{p}</p>)}
              {page?.paragraphs.length === 1 && (
                <p>
                  Our team can discuss how this service fits your goals and
                  answer your questions at your visit.
                </p>
              )}
              {slug === "our-team/team" && (
                <SiteImage
                  className="editorial-photo"
                  src="/images/team_photo.webp"
                  alt="Fine Dentistry clinical and front office team"
                  width="1000"
                  height="700"
                />
              )}
              {slug === "new-patients" && <PatientResources />}
              {slug === "financing" && (
                <div className="inline-links">
                  {page?.links
                    .filter(
                      (l) =>
                        /Cherry|carecredit|sunbit|Finance Direct/i.test(
                          l.text,
                        ) && !l.url.startsWith("/"),
                    )
                    .map((l, i) => (
                      <a key={i} href={l.url}>
                        {l.text} ↗
                      </a>
                    ))}
                </div>
              )}
              {slug === "membership" && (
                <a
                  className="text-link"
                  href={siteConfig.official + "/Membership-Plans"}
                >
                  Review current plans on the clinic website ↗
                </a>
              )}
              {slug === "specials" && (
                <a
                  className="text-link"
                  href={siteConfig.official + "/New-Patient-Specials"}
                >
                  Review current offers with the clinic ↗
                </a>
              )}
              {slug === "news" && (
                <div className="news-links">
                  {page?.links
                    .filter((l) => l.text.startsWith("Read the Full"))
                    .map((l) => (
                      <a
                        key={l.text}
                        href={l.url.replace(
                          /^chrome-extension:\/\/[^/]+\//,
                          "",
                        )}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {l.text} ↗
                      </a>
                    ))}
                </div>
              )}
              {slug === "about" && (
                <div className="inline-links">
                  <Link href="/about/fagd">Why choose an FAGD dentist?</Link>
                  <Link href="/about/dawson-certified">
                    Our Dawson training
                  </Link>
                  <Link href="/our-team">Meet your doctors</Link>
                </div>
              )}
              {page?.source && (
                <p className="source-note">
                  Adapted from the practice’s published information.{" "}
                  <a href={page.source}>View the official source ↗</a>
                </p>
              )}
            </article>
            <aside className="care-aside">
              <SiteImage
                src={"/images/" + (page?.image || "Dentist_orlando.webp")}
                alt={page?.alt || "Care at Fine Dentistry"}
                width="600"
                height="700"
              />
              <h2>
                A conversation
                <br />
                comes first.
              </h2>
              <p>
                We’ll take the time to understand your goals and discuss your
                options.
              </p>
              <AppointmentButton className="button" />
              <a href={siteConfig.tel}>{siteConfig.phone}</a>
              <Link href="/financing">Explore financing</Link>
            </aside>
          </div>
        )}
      </div>
      <section className="section wrap related">
        <h2>Continue exploring</h2>
        <div className="inline-links">
          <Link href="/services">All treatments ↗</Link>
          <Link href="/our-team">Meet the doctors ↗</Link>
          <Link href="/new-patients">Your first visit ↗</Link>
          <Link href="/contact">Visit our practice ↗</Link>
        </div>
      </section>
      <FinalCTA />
    </main>
  );
}
