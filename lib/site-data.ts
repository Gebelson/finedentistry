import compact from "@/data/ui.json";
import galleryCases from "@/data/gallery.json";
import googleReviews from "@/data/google-reviews.json";
import serviceCovers from "@/data/service-covers.json";
export const services = compact.services.map((service) => ({
  ...service,
  ...serviceCovers[service.slug as keyof typeof serviceCovers],
}));
export const siteConfig = {
  name: "Fine Dentistry of Downtown Orlando",
  phone: "(407) 898-1621",
  tel: "tel:+14078981621",
  email: "frontoffice@finedentistryorlando.com",
  address: "429 N Fern Creek Avenue, Orlando, FL 32803",
  official: "https://www.finedentistryorlando.com",
  directions:
    "https://www.google.com/maps/search/?api=1&query=Fine+Dentistry+429+N+Fern+Creek+Avenue+Orlando",
  instagram: "https://www.instagram.com/finedentistryofdowntownorlando/",
  facebook: "https://www.facebook.com/FineDentistryDowntownOrlando/",
  googleReviews: "https://share.google/i1p8ost5lxPQNV0h8",
};
export const socialLinks = [
  { name: "Instagram", url: siteConfig.instagram },
  { name: "Facebook", url: siteConfig.facebook },
];
export const officeHours = [
  { day: "Monday", hours: "7 AM – 7 PM" },
  { day: "Tuesday", hours: "7 AM – 7 PM" },
  { day: "Wednesday", hours: "7 AM – 7 PM" },
  { day: "Thursday", hours: "Please call to confirm" },
  { day: "Friday", hours: "7 AM – 4 PM" },
  { day: "Saturday", hours: "9 AM – 1 PM" },
];
export const doctors = [
  {
    name: "Dr. Aileen Trivedi",
    credential: "DMD, FAGD",
    image: "dr-trivedi.webp",
    bio: "A Boston University graduate and Fellow in the Academy of General Dentistry, Dr. Trivedi combines comprehensive and cosmetic dentistry with an attentive, personal approach.",
    paragraphs: compact.doctorParagraphs[0],
  },
  {
    name: "Dr. Sergio Lascurain",
    credential: "General Dentist",
    image: "2-optimized.webp",
    bio: "Dr. Lascurain brings experience in general dentistry and endodontics. He speaks English and Spanish and focuses on communication, comfort and lasting oral health.",
    paragraphs: compact.doctorParagraphs[1],
  },
  {
    name: "Dr. Amanda Perez",
    credential: "DDS",
    image: "Dr-Amanda-Perez.webp",
    bio: "Originally from Miami, Dr. Perez focuses on compassionate care, patient education and individualized treatment plans for patients of all ages.",
    paragraphs: compact.doctorParagraphs[2],
  },
];
export const faq = [
  {
    q: "What happens during a same-day crown visit?",
    a: "Your dentist prepares the tooth, takes a digital scan and designs the crown. The restoration is milled in the office. Your dentist will explain the timing and whether this approach is suitable for you.",
  },
  {
    q: "Can you help with a dental emergency?",
    a: "The practice makes an effort to see emergency patients the same day. Call (407) 898-1621 as soon as possible so the team can discuss availability.",
  },
  {
    q: "What if I don’t have dental insurance?",
    a: "Fine Dentistry offers in-house dental membership plans for patients without insurance. Ask the team about current plan benefits, eligibility and terms.",
  },
  {
    q: "Are financing options available?",
    a: "The practice lists Cherry, CareCredit and Sunbit among its financing options. Contact the team to discuss current availability, terms and your payment options.",
  },
  {
    q: "How do I prepare for my first appointment?",
    a: "Complete the official new patient forms before your visit and bring your insurance information if applicable. The team will take time to get to know you and discuss your dental goals.",
  },
];
export const testimonials = googleReviews;
export const gallery = galleryCases;
