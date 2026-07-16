import type { Metadata } from "next";
import { HomePage } from "@/components/sections/home-page";
import { RATING, REVIEW_COUNT, SHOP } from "@/lib/services";

const TITLE = "Fresh Cutz Barbers | Barber in Wealdstone, Harrow — All Hair Types Welcome";

export const metadata: Metadata = {
  title: TITLE,
  description:
    "Barber in Wealdstone, Harrow. Afro, Asian & Caucasian hair specialists. 12 years cutting the community. Book with Baggio or Rahul.",
  alternates: { canonical: "https://freshcutzbarber.co/" },
  openGraph: {
    title: TITLE,
    description:
      "Afro, Asian & Caucasian hair specialists in Wealdstone, Harrow. 12 years, patient and precise.",
    url: "https://freshcutzbarber.co/",
  },
};

// Carried over verbatim from the live site — the v2 prototype has no structured
// data at all, so this is the one thing production does better and it must
// survive the rebuild. Rating/review count read from the same constants the UI
// uses so they can't drift apart.
const SCHEMA = {
  "@context": "https://schema.org",
  "@type": "HairSalon",
  name: "Fresh Cutz Barbers",
  image: ["https://freshcutzbarber.co/og-image.jpg"],
  address: {
    "@type": "PostalAddress",
    streetAddress: "18 Canning Road",
    addressLocality: "Wealdstone",
    addressRegion: "Harrow",
    postalCode: "HA3 7SJ",
    addressCountry: "GB",
  },
  telephone: "+44 7415 409277",
  url: "https://freshcutzbarber.co/",
  sameAs: [SHOP.instagram],
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: RATING,
    reviewCount: REVIEW_COUNT,
  },
  priceRange: "££",
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      opens: "10:00",
      closes: "20:00",
    },
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: "Sunday",
      opens: "10:00",
      closes: "18:00",
    },
  ],
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(SCHEMA) }}
      />
      <HomePage whatsappEnabled={process.env.WHATSAPP_ENABLED === "true"} />
    </>
  );
}
