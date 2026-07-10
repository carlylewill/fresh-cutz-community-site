import { createFileRoute } from "@tanstack/react-router";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { createBooking } from "@/functions/bookings";
import shopfrontImg from "@/assets/shopfront.jpeg";
import cuttingHairImg from "@/assets/cutting-hair.jpeg";
import afroFrontImg from "@/assets/afro-front.jpeg";
import afroSideImg from "@/assets/afro-side.jpeg";
import hairAfroCoilyImg from "@/assets/hair-afro-coily.jpg";
import hairAsianStraightImg from "@/assets/hair-asian-straight.jpg";
import hairCaucasianWavyImg from "@/assets/hair-caucasian-wavy.jpg";

/*
 * ============================================================================
 * FRESH CUTZ BARBERS — MANUAL SETUP CHECKLIST
 * ============================================================================
 * 1. Booking widget account (Fresha / Squire / Booksy) — paste embed into
 *    the <BookingEmbed /> placeholder below.
 * 2. Claim & verify Google Business Profile — match address, phone, hours.
 * 3. Google Reviews widget account (e.g. Elfsight / EmbedSocial) — paste
 *    embed into the <GoogleReviewsEmbed /> placeholder.
 * 4. Instagram feed widget (Elfsight / SnapWidget / IG embed) — paste
 *    into <InstagramFeedEmbed /> placeholder.
 * 5. Google Analytics (GA4) — replace GA_MEASUREMENT_ID in __root.tsx / here.
 * 6. Google Search Console — verify domain.
 * 7. Real photography — replace [Add photo: ...] captions in <ChairShowcase />.
 * 8. Confirm live rating & review count with owner (see RATING / REVIEW_COUNT)
 *    before publishing.
 * 9. Wire up <ContactForm /> submissions to email / CRM (search TODO).
 * ============================================================================
 */

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      {
        title:
          "Fresh Cutz Barbers | Barber in Wealdstone, Harrow — All Hair Types Welcome",
      },
      {
        name: "description",
        content:
          "Barber in Wealdstone, Harrow. Afro, Asian & Caucasian hair specialists. 17+ years cutting the community. Book with Baggio or Rahul.",
      },
      {
        property: "og:title",
        content:
          "Fresh Cutz Barbers | Barber in Wealdstone, Harrow — All Hair Types Welcome",
      },
      {
        property: "og:description",
        content:
          "Afro, Asian & Caucasian hair specialists in Wealdstone, Harrow. 17+ years, patient and precise.",
      },
      { property: "og:url", content: "https://freshcutzbarber.co/" },
    ],
    links: [{ rel: "canonical", href: "https://freshcutzbarber.co/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
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
          sameAs: ["https://www.instagram.com/fresh.cutz.barbers/"],
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: "4.8",
            reviewCount: "106",
          },
          priceRange: "££",
          openingHoursSpecification: [
            {
              "@type": "OpeningHoursSpecification",
              dayOfWeek: [
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
              ],
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
        }),
      },
      // TODO: Replace G-XXXXXXXXXX with your real GA4 Measurement ID.
      {
        async: true,
        src: "https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX",
      },
      {
        children: `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-XXXXXXXXXX');
        `,
      },
    ],
  }),
});

const PHONE_DISPLAY = "07415 409277";
const PHONE_TEL = "tel:+447415409277";
const PHONE_HREF_RAW = "tel:07415409277";
const INSTAGRAM_URL = "https://www.instagram.com/fresh.cutz.barbers/";
const ADDRESS = "18 Canning Road, Wealdstone, Harrow, HA3 7SJ";
const MAP_QUERY = encodeURIComponent("Fresh Cutz Barbers, 18 Canning Road, Wealdstone, Harrow, HA3 7SJ");
const DIRECTIONS_URL = `https://www.google.com/maps/dir/?api=1&destination=${MAP_QUERY}`;

// Editable variables — shop can update these without hunting through JSX.
const RATING = "4.8";
const REVIEW_COUNT = "106";
const NEXT_AVAILABLE = "Thursday 2pm"; // Update this line to reflect current availability

type Service = { id: string; name: string; desc: string; priceFrom: number };

const SERVICES: Service[] = [
  { id: "skin-fade", name: "Skin fade", desc: "Tight, precise fade — clipper and razor finish.", priceFrom: 25 },
  { id: "classic-cut", name: "Classic cut", desc: "Scissor and clipper work, wash and finish.", priceFrom: 25 },
  { id: "taper-fade", name: "Taper fade", desc: "Gradual taper with a crisp neckline and finish.", priceFrom: 25 },
  { id: "kids-cut", name: "Kids' cut", desc: "Patient, gentle, and unrushed. Ages welcome.", priceFrom: 15 },
  { id: "buzz-lineup", name: "Buzz cut & line-up", desc: "All-over buzz with a sharp edge-up.", priceFrom: 30 },
  { id: "trim-shave", name: "Trim & shave", desc: "Haircut and hot-towel shave combo.", priceFrom: 30 },
  { id: "trim-wash", name: "Trim & wash", desc: "Cut finished with a wash and style.", priceFrom: 30 },
  { id: "trim-dye", name: "Trim & dye", desc: "Cut with a full colour or tone refresh.", priceFrom: 30 },
];

/* ---------------- Booking cart ---------------- */
type CartContextValue = {
  items: Service[];
  toggle: (service: Service) => void;
  remove: (id: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within <CartProvider>");
  return ctx;
}

function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Service[]>([]);
  const toggle = (service: Service) =>
    setItems((prev) =>
      prev.some((i) => i.id === service.id)
        ? prev.filter((i) => i.id !== service.id)
        : [...prev, service],
    );
  const remove = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));
  const clear = () => setItems([]);
  return <CartContext.Provider value={{ items, toggle, remove, clear }}>{children}</CartContext.Provider>;
}

function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>(".reveal");
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("reveal-in");
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.12 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

function Index() {
  useReveal();
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <main>
        <Hero />
        <HairTypes />
        <Barbers />
        <CartProvider>
          <Services />
          <ChairShowcase />
          <InstagramFeed />
          <Booking />
        </CartProvider>
        <SafeSpace />
        <Visit />
      </main>
      <Footer />
      <FloatingBookNow />
    </div>
  );
}

/* ---------------- Nav ---------------- */
function Nav() {
  const [open, setOpen] = useState(false);
  const links = [
    ["Hair types", "#hair-types"],
    ["Barbers", "#barbers"],
    ["Services", "#services"],
    ["Reviews", "#reviews"],
    ["Book", "#booking"],
    ["Visit", "#visit"],
  ];
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <a href="#top" className="flex items-center gap-2">
          <img
            src="/logo.png"
            alt="Fresh Cutz Barbers"
            className="h-10 w-10 rounded-full object-cover"
          />
          <span className="font-display text-lg font-semibold tracking-tight">
            Fresh Cutz <span className="text-brass">Barbers</span>
          </span>
        </a>
        <nav className="hidden gap-8 md:flex">
          {links.map(([label, href]) => (
            <a
              key={href}
              href={href}
              className="eyebrow text-bone/70 transition-colors hover:text-brass"
            >
              {label}
            </a>
          ))}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <a
            id="call-button"
            href={PHONE_HREF_RAW}
            className="inline-flex min-h-[44px] items-center rounded-full border border-brass/60 px-4 py-2 text-sm font-medium text-brass transition-colors hover:bg-brass hover:text-charcoal"
          >
            {PHONE_DISPLAY}
          </a>
          <a
            id="book-now-header"
            href="#booking"
            className="inline-flex min-h-[44px] items-center rounded-full bg-brass px-5 py-2 text-sm font-semibold text-charcoal transition-transform hover:-translate-y-0.5"
          >
            Book Now
          </a>
        </div>
        <button
          aria-label="Menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="min-h-[44px] min-w-[44px] rounded-md border border-border p-2 md:hidden"
        >
          <span className="block h-0.5 w-5 bg-bone" />
          <span className="mt-1 block h-0.5 w-5 bg-bone" />
          <span className="mt-1 block h-0.5 w-5 bg-bone" />
        </button>
      </div>
      {open && (
        <div className="border-t border-border md:hidden">
          <div className="mx-auto flex max-w-6xl flex-col px-5 py-4">
            {links.map(([label, href]) => (
              <a
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="eyebrow min-h-[44px] border-b border-border/60 py-3 text-bone/80"
              >
                {label}
              </a>
            ))}
            <a
              id="call-button-mobile"
              href={PHONE_HREF_RAW}
              className="mt-4 min-h-[44px] rounded-full border border-brass px-4 py-3 text-center text-sm font-medium text-brass"
            >
              Call {PHONE_DISPLAY}
            </a>
            <a
              href="#booking"
              onClick={() => setOpen(false)}
              className="mt-3 min-h-[44px] rounded-full bg-brass px-4 py-3 text-center text-sm font-semibold text-charcoal"
            >
              Book Now
            </a>
          </div>
        </div>
      )}
    </header>
  );
}

/* ---------------- Floating Book CTA (mobile) ---------------- */
function FloatingBookNow() {
  const [inBookingSection, setInBookingSection] = useState(false);
  useEffect(() => {
    const bookingEl = document.getElementById("booking");
    if (!bookingEl) return;
    const io = new IntersectionObserver(([entry]) => setInBookingSection(entry.isIntersecting), {
      threshold: 0.15,
    });
    io.observe(bookingEl);
    return () => io.disconnect();
  }, []);
  return (
    <a
      id="book-now-floating"
      href="#booking"
      className={`fixed bottom-4 right-4 z-40 inline-flex min-h-[44px] items-center gap-2 rounded-full bg-brass px-5 py-3 text-sm font-semibold text-charcoal shadow-lg shadow-black/30 transition-opacity duration-300 md:hidden ${
        inBookingSection ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
      aria-label="Book Now"
    >
      Book Now
      <span aria-hidden>→</span>
    </a>
  );
}

/* ---------------- Hero ---------------- */
function Hero() {
  return (
    <section id="top" className="relative overflow-hidden">
      <BackdropPattern />
      <div className="relative mx-auto grid max-w-6xl gap-12 px-5 pb-24 pt-16 md:grid-cols-[1.15fr_1fr] md:pt-24">
        <div className="reveal">
          <p className="eyebrow text-brass">Barber in Wealdstone, Harrow · Est. 2009</p>
          <h1 className="mt-5 font-display text-5xl leading-[1.02] font-semibold tracking-tight sm:text-6xl md:text-7xl">
            Every hair type,
            <br />
            <span className="italic text-brass">unhurried</span> and
            <br />
            cut with care.
          </h1>
          <p className="mt-6 max-w-lg text-lg text-bone/75">
            A neighbourhood barber in Wealdstone, Harrow — an afro hair barber, Asian
            hair specialist and go-to for kids' first haircuts. Coils, waves, straight:
            bring whatever you've got, we'll take the time to get it right.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-brass/50 bg-brass/10 px-3 py-1.5 text-sm font-medium text-brass">
              <span aria-hidden>★</span>
              {RATING} · {REVIEW_COUNT} Google Reviews
            </span>
            <span className="text-sm text-bone/70">Trusted by regulars for 20+ years.</span>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              id="book-now-hero"
              href="#booking"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-brass px-6 py-3 font-medium text-charcoal transition-transform hover:-translate-y-0.5"
            >
              Book Now
              <span aria-hidden>→</span>
            </a>
            <a
              href={PHONE_HREF_RAW}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-bone/40 px-6 py-3 font-medium text-bone transition-colors hover:border-brass hover:text-brass"
            >
              Call {PHONE_DISPLAY}
            </a>
          </div>
          <p className="mt-4 text-sm text-bone/60">
            <span className="mr-2 inline-block h-2 w-2 rounded-full bg-brass" aria-hidden />
            Next available: <span className="text-bone/90">{NEXT_AVAILABLE}</span>
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-2 text-sm text-bone/60">
            <span>17+ years in the community</span>
            <span className="hidden h-1 w-1 rounded-full bg-brass/60 sm:inline-block" />
            <span>All hair types welcome</span>
            <span className="hidden h-1 w-1 rounded-full bg-brass/60 sm:inline-block" />
            <span>Kids' first cuts</span>
          </div>
        </div>
        <div className="reveal relative aspect-[4/5] overflow-hidden rounded-2xl border border-border bg-card">
          <img
            src={shopfrontImg}
            alt="Fresh Cutz Barbers shopfront on Canning Road, Wealdstone, Harrow"
            className="h-full w-full object-cover"
            loading="eager"
          />
        </div>
      </div>
    </section>
  );
}

function BackdropPattern() {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.07]"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id="p" width="42" height="42" patternUnits="userSpaceOnUse">
          <path d="M0 21h42M21 0v42" stroke="currentColor" strokeWidth="0.5" className="text-brass" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#p)" />
    </svg>
  );
}

/* ---------------- Hair Types ---------------- */
function HairTypes() {
  const types = [
    {
      label: "Afro / Coily",
      note: "Fades, shape-ups, tapers, sponge twists — an afro hair barber in Harrow cutting with the grain of your curl pattern.",
      alt: "Sharp afro fade with a crisp shape-up lineup — afro hair barber Harrow, Fresh Cutz Wealdstone",
      src: hairAfroCoilyImg,
    },
    {
      label: "Asian / Straight",
      note: "Clean lines, textured crops, scissor work — Asian hair specialist Harrow, patient with thick, straight hair.",
      alt: "Modern textured crop on thick straight Asian hair — Asian hair specialist Harrow, Fresh Cutz Wealdstone",
      src: hairAsianStraightImg,
    },
    {
      label: "Caucasian / Wavy",
      note: "Skin fades, classic side parts, modern crops — precision blends for wavy and straight European hair.",
      alt: "Precision skin fade with a classic side part on wavy hair — barber in Wealdstone, Harrow",
      src: hairCaucasianWavyImg,
    },
  ];
  return (
    <section id="hair-types" className="border-y border-border/60 bg-charcoal-2/60 py-24">
      <div className="mx-auto max-w-6xl px-5">
        <div className="reveal max-w-2xl">
          <p className="eyebrow text-brass">The signature</p>
          <h2 className="mt-4 font-display text-4xl font-semibold sm:text-5xl">
            A barber in Wealdstone for <span className="italic text-brass">all</span> hair types.
          </h2>
          <p className="mt-4 text-bone/75">
            Most shops quietly specialise in one texture. We don't. Afro hair barber, Asian hair
            specialist and Caucasian hair — three textures, one chair, and the technique to match
            whichever one walks in.
          </p>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {types.map((t) => (
            <article
              key={t.label}
              className="reveal group relative overflow-hidden rounded-2xl border border-border bg-background p-6"
            >
              <div className="aspect-[4/3] overflow-hidden rounded-xl bg-charcoal-2">
                <img
                  src={t.src}
                  alt={t.alt}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <p className="eyebrow mt-6 text-brass">{t.label}</p>
              <h3 className="mt-2 font-display text-2xl font-semibold">Cut with the grain.</h3>
              <p className="mt-2 text-sm text-bone/70">{t.note}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Barbers ---------------- */
function Barbers() {
  const barbers = [
    {
      name: "Baggio",
      role: "Owner & lead barber",
      bio: "Runs the shop. Known for patience, precision, and taking the time to compare your hair to your reference photos — detail after detail.",
      tags: ["Afro-textured hair", "Caucasian hair", "Asian hair", "Kids' first cuts"],
    },
    {
      name: "Rahul",
      role: "Barber",
      bio: "Trusted by a loyal Asian clientele. Clean skin fades, textured crops and scissor work on thick, straight hair.",
      tags: ["Asian hair specialist", "Skin fades", "Scissor cuts"],
    },
  ];
  return (
    <section id="barbers" className="py-24">
      <div className="mx-auto max-w-6xl px-5">
        <div className="reveal max-w-2xl">
          <p className="eyebrow text-brass">Meet the barbers</p>
          <h2 className="mt-4 font-display text-4xl font-semibold sm:text-5xl">
            Two chairs. Decades of hands-on.
          </h2>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {barbers.map((b) => (
            <article
              key={b.name}
              className="reveal flex flex-col gap-6 rounded-2xl border border-border bg-card p-8 sm:flex-row"
            >
              <div className="grid h-32 w-32 shrink-0 place-items-center rounded-2xl border border-brass/40 bg-charcoal">
                <span className="font-display text-5xl text-brass">{b.name[0]}</span>
              </div>
              <div className="min-w-0">
                <p className="eyebrow text-brass">{b.role}</p>
                <h3 className="mt-2 font-display text-3xl font-semibold">{b.name}</h3>
                <p className="mt-3 text-bone/75">{b.bio}</p>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {b.tags.map((t) => (
                    <li
                      key={t}
                      className="rounded-full border border-border bg-background px-3 py-1 text-xs text-bone/80"
                    >
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Services ---------------- */
function Services() {
  const { items, toggle } = useCart();
  const selectedIds = new Set(items.map((i) => i.id));
  const total = items.reduce((sum, i) => sum + i.priceFrom, 0);
  return (
    <section id="services" className="border-y border-border/60 bg-charcoal-2/60 py-24">
      <div className="mx-auto max-w-6xl px-5">
        <div className="reveal flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-xl">
            <p className="eyebrow text-brass">Services</p>
            <h2 className="mt-4 font-display text-4xl font-semibold sm:text-5xl">The menu.</h2>
            <p className="mt-3 text-bone/75">
              A guide to prices. Final price depends on length, texture and time — Baggio will
              always talk it through before starting. Add what you're after, then book below.
            </p>
          </div>
          <p className="eyebrow text-bone/50">Prices in £ · guide only</p>
        </div>
        <ul className="reveal mt-12 divide-y divide-border border-y border-border">
          {SERVICES.map((service) => {
            const selected = selectedIds.has(service.id);
            return (
              <li
                key={service.id}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 py-6 sm:grid-cols-[minmax(0,1fr)_auto_auto]"
              >
                <div className="min-w-0">
                  <h3 className="font-display text-2xl font-semibold">{service.name}</h3>
                  <p className="mt-1 text-sm text-bone/65">{service.desc}</p>
                </div>
                <div className="shrink-0 text-right">
                  <span className="eyebrow text-bone/50">from</span>
                  <span className="ml-2 font-display text-2xl text-brass">£{service.priceFrom}</span>
                </div>
                <button
                  type="button"
                  onClick={() => toggle(service)}
                  aria-pressed={selected}
                  className={`col-span-2 min-h-[44px] shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors sm:col-span-1 ${
                    selected
                      ? "border-brass bg-brass text-charcoal"
                      : "border-border text-bone/80 hover:border-brass hover:text-brass"
                  }`}
                >
                  {selected ? "Added ✓" : "Add to booking"}
                </button>
              </li>
            );
          })}
        </ul>
        {items.length > 0 && (
          <div className="reveal mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-brass/40 bg-brass/10 px-6 py-4">
            <p className="text-sm text-bone/80">
              {items.length} service{items.length > 1 ? "s" : ""} added — from £{total}
            </p>
            <a
              href="#booking"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-brass px-5 py-2 text-sm font-semibold text-charcoal transition-transform hover:-translate-y-0.5"
            >
              Continue to booking →
            </a>
          </div>
        )}
      </div>
    </section>
  );
}

/* ---------------- Chair Showcase (gallery + testimonials) ---------------- */
function ChairShowcase() {
  const slots: { src?: string; label?: string; alt: string; span?: string }[] = [
    {
      src: cuttingHairImg,
      alt: "Baggio cutting a client's hair at Fresh Cutz Barbers, Wealdstone Harrow",
      span: "sm:col-span-2 sm:row-span-2",
    },
    {
      src: afroFrontImg,
      alt: "Finished afro shape-up with sharp lineup at Fresh Cutz Barbers, Wealdstone Harrow",
    },
    {
      src: afroSideImg,
      alt: "Side view of afro shape-up and defined hairline by Fresh Cutz Barbers, Harrow",
    },
  ];
  const reviews = [
    {
      name: "David Tse",
      meta: "Detail obsessive",
      quote:
        "He is honestly the best hairdresser I've ever had. I showed him two reference photos, and he kept carefully comparing my hair to the pictures throughout the whole appointment, paying so much attention to every detail.",
    },
    {
      name: "Forward Horizon",
      meta: "Regular · 20+ years",
      quote:
        "Thank you for a great cut as usual — I have been with you over 20 years and I'm always happy with the cut!",
    },
    {
      name: "Larisa Cirlan",
      meta: "Parent · first-cut rescue",
      quote:
        "My son had a very bad experience with a previous barber which left him in tears and hating barbers. After a year we decided to try again and I am so happy I found this place. Barber gives all his time and attention into the haircut, and the haircut was 10 out of 10. My son loved it so much that he said from now on this is how he always wants to cut his hair.",
    },
  ];
  return (
    <section id="reviews" className="py-24">
      <div className="mx-auto max-w-6xl px-5">
        <div className="reveal max-w-2xl">
          <p className="eyebrow text-brass">Straight from the chair</p>
          <h2 className="mt-4 font-display text-4xl font-semibold sm:text-5xl">
            Straight From The Chair.
          </h2>
          <p className="mt-4 text-bone/75">
            A look inside the shop and the words of the regulars who keep coming back.
          </p>
        </div>

        {/* Part A: gallery grid */}
        <div className="reveal mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {slots.map((s) => (
            <figure
              key={s.alt}
              className={`relative aspect-[9/16] overflow-hidden rounded-xl border border-border bg-charcoal-2`}
            >
              {s.src ? (
                <img
                  src={s.src}
                  alt={s.alt}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div
                  role="img"
                  aria-label={s.alt}
                  className="grid h-full w-full place-items-center p-4 text-center text-xs text-bone/50"
                >
                  {s.label}
                </div>
              )}
            </figure>
          ))}
        </div>

        {/* Part B: testimonials */}
        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {reviews.map((r, i) => (
            <figure
              key={r.name}
              className="reveal relative flex flex-col rounded-2xl border border-border bg-card p-8"
              style={{ marginTop: i === 1 ? "2rem" : undefined }}
            >
              <span
                aria-hidden
                className="font-display text-7xl leading-none text-brass/40"
              >
                &ldquo;
              </span>
              <blockquote className="-mt-4 font-display text-lg leading-snug text-bone/90">
                {r.quote}
              </blockquote>
              <figcaption className="mt-6 border-t border-border pt-4">
                <p className="font-display text-lg font-semibold text-brass">{r.name}</p>
                <p className="eyebrow mt-1 text-bone/50">{r.meta}</p>
              </figcaption>
            </figure>
          ))}
        </div>

        {/* Live Google Reviews widget — supplements the hand-picked quotes above. */}
        <div
          className="reveal mt-12 min-h-[240px] rounded-2xl border border-dashed border-border bg-charcoal-2/40 p-6"
          aria-label="Google Reviews widget placeholder"
        >
          {/* LIVE GOOGLE REVIEWS WIDGET EMBED GOES HERE
              Paste the Elfsight / EmbedSocial widget code inside this div. */}
          <p className="eyebrow text-brass">Live from Google</p>
          <p className="mt-2 font-display text-xl">
            Live Google Reviews widget slots in here (Elfsight / EmbedSocial).
          </p>
          <p className="mt-2 text-sm text-bone/60">
            Rating & count shown in the hero: ★ {RATING} · {REVIEW_COUNT} reviews.
            Update <code>RATING</code> and <code>REVIEW_COUNT</code> at the top of the file.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Instagram (Recent Cuts) ---------------- */
function InstagramFeed() {
  return (
    <section id="recent-cuts" className="border-y border-border/60 bg-charcoal-2/60 py-24">
      <div className="mx-auto max-w-6xl px-5">
        <div className="reveal flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-xl">
            <p className="eyebrow text-brass">Recent cuts</p>
            <h2 className="mt-4 font-display text-4xl font-semibold sm:text-5xl">
              See the latest on Instagram.
            </h2>
            <p className="mt-3 text-bone/75">
              We post fresh cuts and shop updates on{" "}
              <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" className="text-brass hover:underline">
                @fresh.cutz.barbers
              </a>
              .
            </p>
          </div>
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-brass/60 px-5 py-2 text-sm font-medium text-brass hover:bg-brass hover:text-charcoal"
          >
            Follow on Instagram →
          </a>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Booking ---------------- */
function Booking() {
  return (
    <section id="booking" className="py-24">
      <div className="mx-auto max-w-6xl px-5">
        <div className="reveal max-w-2xl">
          <p className="eyebrow text-brass">Book</p>
          <h2 className="mt-4 font-display text-4xl font-semibold sm:text-5xl">
            Grab a chair.
          </h2>
          <p className="mt-4 text-bone/75">
            Pick your services, choose a time that works, and send the request. Baggio or Rahul
            will confirm it, suggest a different time, or reach out directly — either way,
            you'll get an email.
          </p>
          <p className="mt-4 inline-flex items-center gap-2 text-sm text-bone/70">
            <span className="inline-block h-2 w-2 rounded-full bg-brass" aria-hidden />
            Next available: <span className="text-bone/90">{NEXT_AVAILABLE}</span>
          </p>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          <BookingForm />

          <div className="reveal space-y-6">
            <div className="rounded-2xl border border-border bg-card p-6">
              <p className="eyebrow text-brass">Prefer to talk first?</p>
              <p className="mt-3 text-sm text-bone/75">
                Call, or drop us a DM — Baggio and Rahul both take walk-ins when the chairs are
                free.
              </p>
              <a
                href={PHONE_HREF_RAW}
                className="mt-4 block font-display text-xl text-brass hover:underline"
              >
                {PHONE_DISPLAY}
              </a>
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noreferrer"
                className="mt-2 block text-sm text-brass hover:underline"
              >
                @fresh.cutz.barbers
              </a>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6">
              <p className="eyebrow text-brass">Opening hours</p>
              <table className="mt-3 w-full text-sm">
                <tbody>
                  <tr className="border-b border-border last:border-0">
                    <th className="py-2 text-left font-normal text-bone/80">Mon – Sat</th>
                    <td className="py-2 text-right text-brass">10:00 – 20:00</td>
                  </tr>
                  <tr>
                    <th className="py-2 text-left font-normal text-bone/80">Sunday</th>
                    <td className="py-2 text-right text-brass">10:00 – 18:00</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const inputCls =
  "mt-1 block w-full min-h-[44px] rounded-md border border-border bg-background px-3 py-2 text-sm text-bone placeholder:text-bone/40 focus:border-brass focus:outline-none focus:ring-2 focus:ring-brass/40";

function BookingForm() {
  const { items, remove, clear } = useCart();
  const [status, setStatus] = useState<"idle" | "pending" | "sent" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const total = items.reduce((sum, i) => sum + i.priceFrom, 0);
  const todayISO = new Date().toISOString().slice(0, 10);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (items.length === 0) {
      setStatus("error");
      setErrorMessage("Pick at least one service above before booking.");
      return;
    }
    const form = new FormData(e.currentTarget);
    const barber = form.get("barber");
    setStatus("pending");
    setErrorMessage("");
    try {
      const result = await createBooking({
        data: {
          customerName: String(form.get("name") || ""),
          customerEmail: String(form.get("email") || ""),
          customerPhone: String(form.get("phone") || "") || undefined,
          services: items.map((i) => ({ name: i.name, priceFrom: i.priceFrom })),
          preferredBarber: barber === "baggio" || barber === "rahul" ? barber : null,
          preferredDate: String(form.get("date") || ""),
          preferredTime: String(form.get("time") || ""),
          message: String(form.get("message") || "") || undefined,
        },
      });
      if (result.ok) {
        setStatus("sent");
        clear();
      } else {
        setStatus("error");
        setErrorMessage(result.error);
      }
    } catch {
      setStatus("error");
      setErrorMessage("Something went wrong sending your request. Please call us instead.");
    }
  }

  if (status === "sent") {
    return (
      <div className="reveal rounded-2xl border border-brass/40 bg-brass/10 p-8">
        <p className="eyebrow text-brass">Request sent</p>
        <h3 className="mt-2 font-display text-2xl font-semibold">Check your email.</h3>
        <p className="mt-3 text-sm text-bone/75">
          We've sent a confirmation to your inbox. Baggio or Rahul will confirm, suggest a
          different time, or get in touch shortly — you'll get another email as soon as they
          respond.
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-6 inline-flex min-h-[44px] items-center rounded-full border border-brass/60 px-5 py-2 text-sm font-medium text-brass hover:bg-brass hover:text-charcoal"
        >
          Book another
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="reveal rounded-2xl border border-border bg-card p-6 sm:p-8"
      aria-label="Book an appointment"
    >
      <p className="eyebrow text-brass">Your booking</p>
      <h3 className="mt-2 font-display text-2xl font-semibold">Services selected</h3>
      {items.length === 0 ? (
        <p className="mt-4 rounded-md border border-dashed border-border p-4 text-sm text-bone/60">
          No services added yet.{" "}
          <a href="#services" className="text-brass hover:underline">
            Pick from the menu
          </a>{" "}
          above.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-border">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3 py-3">
              <span className="text-sm text-bone/85">{item.name}</span>
              <span className="flex items-center gap-3">
                <span className="text-sm text-brass">from £{item.priceFrom}</span>
                <button
                  type="button"
                  onClick={() => remove(item.id)}
                  aria-label={`Remove ${item.name}`}
                  className="text-bone/40 hover:text-crimson"
                >
                  ✕
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
      {items.length > 0 && (
        <p className="mt-4 flex items-center justify-between border-t border-border pt-4 text-sm">
          <span className="text-bone/70">Total</span>
          <span className="font-display text-xl text-brass">from £{total}</span>
        </p>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <label className="block text-sm text-bone/80">
          Name
          <input name="name" required className={inputCls} placeholder="Your name" />
        </label>
        <label className="block text-sm text-bone/80">
          Phone <span className="text-bone/50">(optional)</span>
          <input name="phone" type="tel" className={inputCls} placeholder="07…" />
        </label>
        <label className="block text-sm text-bone/80 sm:col-span-2">
          Email
          <input name="email" type="email" required className={inputCls} placeholder="you@email.com" />
        </label>
        <label className="block text-sm text-bone/80 sm:col-span-2">
          Preferred barber
          <select name="barber" className={inputCls} defaultValue="">
            <option value="">No preference</option>
            <option value="baggio">Baggio</option>
            <option value="rahul">Rahul</option>
          </select>
        </label>
        <label className="block text-sm text-bone/80">
          Preferred date
          <input name="date" type="date" required min={todayISO} className={inputCls} />
        </label>
        <label className="block text-sm text-bone/80">
          Preferred time
          <input name="time" type="time" required className={inputCls} />
        </label>
        <label className="block text-sm text-bone/80 sm:col-span-2">
          Anything we should know? <span className="text-bone/50">(optional)</span>
          <textarea
            name="message"
            rows={3}
            className={inputCls}
            placeholder="Reference photos, length, allergies…"
          />
        </label>
      </div>

      {status === "error" && (
        <p className="mt-4 rounded-md border border-crimson/50 bg-crimson/10 p-3 text-sm text-bone">
          {errorMessage}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "pending"}
        className="mt-6 inline-flex min-h-[44px] w-full items-center justify-center rounded-full bg-brass px-6 py-3 font-semibold text-charcoal transition-transform hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0"
      >
        {status === "pending" ? "Sending…" : "Request booking"}
      </button>
      <p className="mt-3 text-xs text-bone/50">
        This sends a request — Baggio or Rahul will confirm the time before it's locked in.
      </p>
    </form>
  );
}

/* ---------------- Safe Space ---------------- */
function SafeSpace() {
  return (
    <section className="relative overflow-hidden border-y border-border/60 bg-charcoal-2/60 py-24">
      <div className="pointer-events-none absolute inset-0 opacity-10">
        <ScissorsBig />
      </div>
      <div className="relative mx-auto max-w-3xl px-5 text-center">
        <p className="eyebrow reveal text-brass">A safe space</p>
        <h2 className="reveal mt-4 font-display text-4xl font-semibold leading-[1.1] sm:text-5xl md:text-6xl">
          Bring the nervous first-timer. Bring the toddler.
          <br />
          <span className="italic text-brass">Bring yourself, exactly as you are.</span>
        </h2>
        <p className="reveal mx-auto mt-6 max-w-2xl text-lg text-bone/75">
          We're not the cheapest chair on the high street, and we don't want to be. We want the one where kids get their first-ever
          haircut without tears, where grown-ups get exactly what they asked for, and where regulars stay for twenty years because
          they've never had a reason to leave.
        </p>
      </div>
    </section>
  );
}

/* ---------------- Visit ---------------- */
function Visit() {
  const hours: [string, string][] = [
    ["Mon – Sat", "10:00 – 20:00"],
    ["Sunday", "10:00 – 18:00"],
  ];
  return (
    <section id="visit" className="py-24">
      <div className="mx-auto max-w-6xl px-5">
        <div className="reveal max-w-2xl">
          <p className="eyebrow text-brass">Visit</p>
          <h2 className="mt-4 font-display text-4xl font-semibold sm:text-5xl">
            Come down to Canning Road.
          </h2>
        </div>
        <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_1.2fr]">
          <div className="reveal space-y-8 rounded-2xl border border-border bg-card p-8">
            <div>
              <p className="eyebrow text-bone/50">Address</p>
              <a
                id="directions-button"
                href={DIRECTIONS_URL}
                target="_blank"
                rel="noreferrer"
                className="mt-2 block font-display text-2xl text-bone hover:text-brass"
              >
                {ADDRESS}
              </a>
              <p className="mt-2 text-sm text-bone/60">Tap for directions in Google Maps.</p>
            </div>
            <div className="grid gap-8 sm:grid-cols-2">
              <div>
                <p className="eyebrow text-bone/50">Phone</p>
                <a href={PHONE_HREF_RAW} className="mt-2 block font-display text-2xl text-brass hover:underline">
                  {PHONE_DISPLAY}
                </a>
              </div>
              <div>
                <p className="eyebrow text-bone/50">Instagram</p>
                <a
                  href={INSTAGRAM_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 block font-display text-2xl text-brass hover:underline"
                >
                  @fresh.cutz.barbers
                </a>
              </div>
            </div>
            <div>
              <p className="eyebrow text-bone/50">Opening hours</p>
              <table className="mt-3 w-full">
                <tbody>
                  {hours.map(([d, h]) => (
                    <tr key={d} className="border-b border-border last:border-0">
                      <th className="py-3 text-left font-normal text-bone/80">{d}</th>
                      <td className="py-3 text-right font-display text-brass">{h}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="reveal overflow-hidden rounded-2xl border border-border bg-card">
            <iframe
              title="Map to Fresh Cutz Barbers"
              src={`https://www.google.com/maps?q=${MAP_QUERY}&output=embed`}
              width="100%"
              height="100%"
              loading="lazy"
              className="h-full min-h-[380px] w-full grayscale-[0.4]"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Footer ---------------- */
function Footer() {
  return (
    <footer className="border-t border-border bg-charcoal-2/60 py-14">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <img
              src="/logo.png"
              alt="Fresh Cutz Barbers"
              className="h-8 w-8 rounded-full object-cover"
            />
            <span className="font-display text-lg font-semibold">Fresh Cutz Barbers</span>
          </div>
          <p className="mt-3 text-sm text-bone/60">
            Wealdstone, Harrow.
            <br />
            Every hair type, cut with care.
          </p>
        </div>
        <div>
          <p className="eyebrow text-bone/50">Explore</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li><a className="hover:text-brass" href="#hair-types">Hair types</a></li>
            <li><a className="hover:text-brass" href="#barbers">Barbers</a></li>
            <li><a className="hover:text-brass" href="#services">Services</a></li>
            <li><a className="hover:text-brass" href="#reviews">Reviews</a></li>
          </ul>
        </div>
        <div>
          <p className="eyebrow text-bone/50">Contact</p>
          <ul className="mt-3 space-y-2 text-sm text-bone/80">
            <li>{ADDRESS}</li>
            <li><a className="hover:text-brass" href={PHONE_TEL}>{PHONE_DISPLAY}</a></li>
            <li>
              <a className="hover:text-brass" href={INSTAGRAM_URL} target="_blank" rel="noreferrer">
                @fresh.cutz.barbers
              </a>
            </li>
          </ul>
        </div>
        <div>
          <p className="eyebrow text-bone/50">Hours</p>
          <ul className="mt-3 space-y-2 text-sm text-bone/80">
            <li>Mon – Sat · 10:00 – 20:00</li>
            <li>Sunday · 10:00 – 18:00</li>
          </ul>
        </div>
      </div>
      <div className="mx-auto mt-10 max-w-6xl px-5 text-xs text-bone/40">
        © {new Date().getFullYear()} Fresh Cutz Barbers. Est. 2009.
      </div>
    </footer>
  );
}

/* ---------------- SVG illustrations ---------------- */
function ScissorsBig() {
  return (
    <svg viewBox="0 0 600 400" className="h-full w-full" fill="none" aria-hidden>
      <circle cx="140" cy="300" r="55" stroke="oklch(0.78 0.13 82)" strokeWidth="2" />
      <circle cx="460" cy="300" r="55" stroke="oklch(0.78 0.13 82)" strokeWidth="2" />
      <path d="M180 260 L460 60 M420 260 L140 60" stroke="oklch(0.78 0.13 82)" strokeWidth="2" />
    </svg>
  );
}
