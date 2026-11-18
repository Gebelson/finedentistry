import type { Metadata } from "next";
import "./globals.css";
import { SiteChrome } from "@/components/site-chrome";
import { PageTransition } from "@/components/page-transition";
import { Scrollbar } from "@/components/scrollbar";
import { siteConfig } from "@/lib/content";
const siteUrl = process.env.SITE_URL;
export const metadata: Metadata = {
  metadataBase: siteUrl ? new URL(siteUrl) : undefined,
  alternates: siteUrl ? { canonical: "/" } : undefined,
  title: {
    default: "Fine Dentistry of Downtown Orlando | Care, Thoughtfully Crafted",
    template: "%s | Fine Dentistry of Downtown Orlando",
  },
  description:
    "Personalized general, cosmetic and restorative dentistry in Downtown Orlando. Meet our doctors and explore Invisalign, veneers, implants and same-day crowns.",
  robots: {
    index: process.env.SITE_INDEXABLE === "true" && !!siteUrl,
    follow: process.env.SITE_INDEXABLE === "true" && !!siteUrl,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: siteConfig.name,
    url: siteUrl,
    title: siteConfig.name,
    description: "Personalized dental care in Downtown Orlando.",
  },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-US" data-scroll-behavior="smooth">
      <body>
        <a className="skip" href="#main">
          Skip to content
        </a>
        <SiteChrome>{children}</SiteChrome>
        <PageTransition />
        <Scrollbar />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Dentist",
              name: siteConfig.name,
              telephone: "+14078981621",
              email: siteConfig.email,
              address: {
                "@type": "PostalAddress",
                streetAddress: "429 N Fern Creek Avenue",
                addressLocality: "Orlando",
                addressRegion: "FL",
                postalCode: "32803",
                addressCountry: "US",
              },
              sameAs: [siteConfig.instagram],
            }),
          }}
        />
      </body>
    </html>
  );
}
