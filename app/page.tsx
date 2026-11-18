import { LineReveal } from "@/components/line-reveal";
import { SiteImage } from "@/components/site-image";
import { Recognition } from "@/components/recognition";
import Link from "next/link";
import Image from "next/image";
import { AppointmentButton } from "@/components/site-chrome";
import {
  FAQ,
  ServicesGrid,
  SmileGallery,
  Testimonials,
} from "@/components/interactive";
import {
  ContactBlock,
  Doctors,
  FinalCTA,
  PatientResources,
  SectionHeading,
} from "@/components/editorial";
export default function Home() {
  return (
    <main id="main" className="home">
      <section className="hero">
        <div className="hero-image-reveal">
          <Image
            className="hero-photo"
            src="/images/team-enhanced-v2.png"
            alt="The Fine Dentistry of Downtown Orlando team"
            fill
            priority
            sizes="(max-width: 767px) 1686px, (max-aspect-ratio: 9/5) 181vh, 100vw"
            quality={85}
            fetchPriority="high"
          />
        </div>
        <div className="hero-shade" />
        <div className="hero-content wrap">
          <div className="hero-bottom hero-composition">
            <h1>
              <LineReveal>
                Your smile.
                <br />
                Our dedication.
                <br />
                <em>Beautifully personal.</em>
              </LineReveal>
            </h1>
            <div className="hero-aside">
              <p>
                Comprehensive care. Thoughtful details.
                <br />A dental experience centered on you.
              </p>
              <AppointmentButton />
              <a className="hero-scroll hero-scroll-bottom" href="#about">
                Scroll to discover ↓
              </a>
            </div>
          </div>
        </div>
      </section>
      <div className="home-content">
        <section className="section wrap about-section" id="about">
          <span className="section-label">
            A different kind of dental experience
          </span>
          <div>
            <h2 className="statement" data-reveal="heading">
              <LineReveal>
                Exceptional care begins
                <br />
                with a simple idea.
                <br />
                <span className="statement-muted">
                  Getting to know <em>you.</em>
                </span>
              </LineReveal>
            </h2>
            <div className="about-bottom">
              <SiteImage
                src="/images/Dentist_orlando.webp"
                sizes="(min-width: 1440px) 466px, (min-width: 768px) 33vw, calc(100vw - 40px)"
                data-reveal="visual"
                alt="A personal consultation with Dr. Trivedi"
                width="600"
                height="400"
                loading="lazy"
              />
              <div>
                <p>
                  At Fine Dentistry of Downtown Orlando, we bring general,
                  cosmetic and restorative care together in one welcoming
                  practice. Our approach starts with listening, and continues
                  with care shaped around your goals.
                </p>
                <Link className="bracket" href="/about">
                  Discover Our Practice
                </Link>
              </div>
            </div>
          </div>
        </section>
        <Recognition />
        <section className="section section-tint" id="services">
          <div className="wrap">
            <div className="treatment-stack-scroll">
              <div className="treatment-stack-stage">
                <SectionHeading
                  label="Our treatments"
                  title={
                    <>
                      Every smile has
                      <br />
                      its own <em>possibilities.</em>
                    </>
                  }
                  description="From everyday care to a new chapter for your smile. Explore treatments tailored to your needs, with your comfort at the heart of every visit."
                />
                <ServicesGrid featured />
              </div>
            </div>
            <div className="section-end">
              <p>General · Cosmetic · Restorative · Aesthetics</p>
              <Link className="bracket" href="/services">
                Explore All Treatments
              </Link>
            </div>
          </div>
        </section>
        <section className="section wrap" id="why-us">
          <SectionHeading
            label="The Fine Dentistry difference"
            title={
              <>
                Personal attention.
                <br />
                <em>Modern possibilities.</em>
              </>
            }
            description="A thoughtful balance of clinical technology, experienced people and the details that help you feel at ease."
          />
          <div className="feature-layout">
            <div className="feature-photo" data-reveal="visual">
              <SiteImage
                src="/images/Dentist_orlando2.webp"
                alt="Dr. Trivedi reviewing a digital scan with a patient"
                width="900"
                height="1000"
                loading="lazy"
              />
            </div>
            <div className="feature-list">
              {[
                [
                  "Care that starts with listening",
                  "Your questions, comfort and individual goals guide the conversation.",
                  "about",
                ],
                [
                  "Technology with a purpose",
                  "CEREC same-day crowns, digital imaging and 3D scans support your care.",
                  "technology",
                ],
                [
                  "People behind your smile",
                  "Meet Dr. Trivedi, Dr. Lascurain and Dr. Perez.",
                  "our-team",
                ],
                [
                  "A welcome for the whole family",
                  "Comprehensive dentistry for children and adults in one Downtown Orlando practice.",
                  "new-patients",
                ],
              ].map(([t, p, u], i) => (
                <Link href={"/" + u} key={t} data-reveal="mobile-item">
                  <span>(0{i + 1})</span>
                  <div>
                    <h3>{t}</h3>
                    <p>{p}</p>
                  </div>
                  <span aria-hidden="true">↗</span>
                </Link>
              ))}
            </div>
          </div>
          <div className="credentials">
            <span>Care informed by experience</span>
            <Link href="/about/fagd">
              Fellowship in the Academy
              <br />
              of General Dentistry
            </Link>
            <Link href="/about/dawson-certified">
              Dawson Certified
              <br />
              Practice
            </Link>
            <Link href="/technology">
              Digital dentistry
              <br />& in-house milling
            </Link>
          </div>
        </section>
        <section className="section section-tint">
          <div className="wrap">
            <SectionHeading
              label="Patient stories"
              title={
                <>
                  Behind every smile,
                  <br />
                  <em>a personal story.</em>
                </>
              }
            />
            <Testimonials />
          </div>
        </section>
        <section className="section wrap" id="team">
          <SectionHeading
            label="Meet your doctors"
            title={
              <>
                Expertise with
                <br />a <em>human touch.</em>
              </>
            }
            description="Get to know the people who take the time to know you."
          />
          <Doctors />
          <div className="section-end">
            <span>Personalized care starts with a conversation.</span>
            <Link className="bracket" href="/our-team">
              Meet Our Doctors
            </Link>
          </div>
        </section>
        <section className="section wrap gallery-section">
          <SectionHeading
            label="Smile gallery"
            title={
              <>
                Real people.
                <br />
                <em>Individual journeys.</em>
              </>
            }
            description="Explore before-and-after cases shared by our practice."
          />
          <SmileGallery />
          <div className="section-end">
            <span>Every treatment plan starts with you.</span>
            <Link className="bracket" href="/smile-gallery">
              Explore the Gallery
            </Link>
          </div>
        </section>
        <section className="section section-tint">
          <div className="wrap">
            <SectionHeading
              label="New to Fine Dentistry?"
              title={
                <>
                  Make yourself
                  <br />
                  <em>at home.</em>
                </>
              }
            />
            <PatientResources />
          </div>
        </section>
        <section className="section wrap">
          <SectionHeading
            label="A little clarity"
            title={
              <>
                Good questions.
                <br />
                <em>Thoughtful answers.</em>
              </>
            }
          />
          <FAQ />
        </section>
        <section className="section wrap">
          <SectionHeading
            label="Find us in Downtown Orlando"
            title={
              <>
                Your neighborhood.
                <br />
                <em>Your dental home.</em>
              </>
            }
          />
          <SiteImage
            className="neighborhood-photo"
            src="/images/neighborhood-sign.png"
            alt="Fine Dentistry of Downtown Orlando sign and the practice exterior"
            width={354}
            height={277}
            sizes="(min-width: 1024px) 640px, 100vw"
            loading="lazy"
            data-reveal="visual"
          />
          <ContactBlock />
        </section>
        <FinalCTA />
      </div>
    </main>
  );
}
