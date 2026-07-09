import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";

/*
 * ============================================================================
 * FRESH CUTZ BARBERS — MANUAL SETUP CHECKLIST (do outside Lovable)
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
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "HairSalon",
          name: "Fresh Cutz Barbers",
          image: [],
          address: {
            "@type": "PostalAddress",
            streetAddress: "18 Canning Road",
            addressLocality: "Wealdstone",
            addressRegion: "Harrow",
            postalCode: "HA3 7SJ",
            addressCountry: "GB",
          },
          telephone: "+44 7415 409277",
          url: "/",
          sameAs: ["https://www.instagram.com/fresh.cutz.barbers/"],
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
const RATING = "4.8"; // TODO: confirm current Google rating before publishing
const REVIEW_COUNT = "106"; // TODO: confirm current Google review count before publishing
const NEXT_AVAILABLE = "Thursday 2pm"; // Update this line to reflect current availability

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
        <Services />
        <ChairShowcase />
        <InstagramFeed />
        <Booking />
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
  return (
    <a
      id="book-now-floating"
      href="#booking"
      className="fixed bottom-4 right-4 z-40 inline-flex min-h-[44px] items-center gap-2 rounded-full bg-brass px-5 py-3 text-sm font-semibold text-charcoal shadow-lg shadow-black/30 md:hidden"
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
          {/* TODO: Replace src with your own shop photo */}
          <img
            src=""
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
      alt: "Illustration of coily afro hair pattern — afro hair barber Harrow, Fresh Cutz Wealdstone",
      draw: <CoilyPattern />,
    },
    {
      label: "Asian / Straight",
      note: "Clean lines, textured crops, scissor work — Asian hair specialist Harrow, patient with thick, straight hair.",
      alt: "Illustration of straight Asian hair pattern — Asian hair specialist Harrow, Fresh Cutz Wealdstone",
      draw: <StraightPattern />,
    },
    {
      label: "Caucasian / Wavy",
      note: "Skin fades, classic side parts, modern crops — precision blends for wavy and straight European hair.",
      alt: "Illustration of wavy Caucasian hair pattern — barber in Wealdstone, Harrow",
      draw: <WavyPattern />,
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
              <div
                className="aspect-[4/3] overflow-hidden rounded-xl bg-charcoal-2"
                role="img"
                aria-label={t.alt}
              >
                {t.draw}
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
  const items = [
    ["Skin fade", "Tight, precise fade — clipper and razor finish.", "25"],
    ["Classic cut", "Scissor and clipper work, wash and finish.", "25"],
    ["Taper fade", "Gradual taper with a crisp neckline and finish.", "25"],
    ["Kids' cut", "Patient, gentle, and unrushed. Ages welcome.", "15"],
    ["Buzz cut & line-up", "All-over buzz with a sharp edge-up.", "30"],
    ["Trim & shave", "Haircut and hot-towel shave combo.", "30"],
    ["Trim & wash", "Cut finished with a wash and style.", "30"],
    ["Trim & dye", "Cut with a full colour or tone refresh.", "30"],
  ];
  return (
    <section id="services" className="border-y border-border/60 bg-charcoal-2/60 py-24">
      <div className="mx-auto max-w-6xl px-5">
        <div className="reveal flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-xl">
            <p className="eyebrow text-brass">Services</p>
            <h2 className="mt-4 font-display text-4xl font-semibold sm:text-5xl">The menu.</h2>
            <p className="mt-3 text-bone/75">
              A guide to prices. Final price depends on length, texture and time — Baggio will always talk it through before starting.
            </p>
          </div>
          <p className="eyebrow text-bone/50">Prices in £ · guide only</p>
        </div>
        <ul className="reveal mt-12 divide-y divide-border border-y border-border">
          {items.map(([name, desc, price]) => (
            <li key={name} className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-4 py-6">
              <div className="min-w-0">
                <h3 className="font-display text-2xl font-semibold">{name}</h3>
                <p className="mt-1 text-sm text-bone/65">{desc}</p>
              </div>
              <div className="shrink-0 text-right">
                <span className="eyebrow text-bone/50">from</span>
                <span className="ml-2 font-display text-2xl text-brass">£{price}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ---------------- Chair Showcase (gallery + testimonials) ---------------- */
function ChairShowcase() {
  const slots: { label: string; alt: string; span?: string }[] = [
    {
      label: "[Add photo: shopfront on Canning Road]",
      alt: "Fresh Cutz Barbers shopfront, 18 Canning Road, Wealdstone Harrow",
      span: "sm:col-span-2 sm:row-span-2",
    },
    {
      label: "[Add photo: Baggio cutting a fade]",
      alt: "Baggio the barber cutting a skin fade at Fresh Cutz, Wealdstone Harrow",
    },
    {
      label: "[Add photo: Rahul finishing a scissor cut]",
      alt: "Rahul, Asian hair specialist, finishing a scissor cut at Fresh Cutz Harrow",
    },
    {
      label: "[Add photo: kids' first haircut]",
      alt: "Kids' first haircut at Fresh Cutz Barbers, Wealdstone Harrow",
    },
    {
      label: "[Add photo: finished afro shape-up]",
      alt: "Finished afro shape-up by a Harrow afro hair barber",
    },
    {
      label: "[Add photo: shop interior chairs & mirrors]",
      alt: "Inside Fresh Cutz Barbers — chairs and mirrors, Wealdstone Harrow",
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
        <div className="reveal mt-12 grid auto-rows-[minmax(0,1fr)] grid-cols-2 gap-4 sm:grid-cols-4">
          {slots.map((s) => (
            <figure
              key={s.label}
              className={`relative aspect-[4/3] overflow-hidden rounded-xl border border-border bg-charcoal-2 ${s.span ?? ""}`}
            >
              {/* TODO: Replace with <img src="..." alt="..." /> — keep alt text descriptive */}
              <div
                role="img"
                aria-label={s.alt}
                className="grid h-full w-full place-items-center p-4 text-center text-xs text-bone/50"
              >
                {s.label}
              </div>
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

/* ---------------- Instagram Feed (Recent Cuts) ---------------- */
function InstagramFeed() {
  return (
    <section id="recent-cuts" className="border-y border-border/60 bg-charcoal-2/60 py-24">
      <div className="mx-auto max-w-6xl px-5">
        <div className="reveal flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-xl">
            <p className="eyebrow text-brass">Recent cuts</p>
            <h2 className="mt-4 font-display text-4xl font-semibold sm:text-5xl">
              Fresh from the feed.
            </h2>
            <p className="mt-3 text-bone/75">
              The latest work, pulled live from{" "}
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
        <div
          className="reveal mt-10 grid min-h-[320px] grid-cols-2 gap-3 rounded-2xl border border-dashed border-border bg-background/40 p-4 sm:grid-cols-3 md:grid-cols-4"
          aria-label="Instagram feed placeholder"
        >
          {/* INSTAGRAM FEED WIDGET EMBED GOES HERE
              Paste the embed (Elfsight / SnapWidget / Instagram embed) inside this div.
              Remove the placeholder tiles below when the widget is live. */}
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square rounded-lg border border-border bg-charcoal-2/70"
              aria-hidden
            />
          ))}
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
            Book online below, or drop us a call / DM. Baggio and Rahul both take
            walk-ins when the chairs are free.
          </p>
          <p className="mt-4 inline-flex items-center gap-2 text-sm text-bone/70">
            <span className="inline-block h-2 w-2 rounded-full bg-brass" aria-hidden />
            Next available: <span className="text-bone/90">{NEXT_AVAILABLE}</span>
          </p>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          {/* Booking widget embed */}
          <div className="reveal">
            <div
              className="relative min-h-[520px] w-full overflow-hidden rounded-2xl border border-dashed border-brass/40 bg-card"
              aria-label="Booking widget placeholder"
            >
              {/* BOOKING WIDGET EMBED GOES HERE
                  Paste the Fresha / Squire / Booksy embed code inside this div.
                  Keep the min-height so layout doesn't shift when the iframe loads. */}
              <div className="grid h-full min-h-[520px] w-full place-items-center p-8 text-center">
                <div>
                  <p className="eyebrow text-brass">Booking widget</p>
                  <p className="mt-3 font-display text-2xl">
                    Drop in your Fresha / Squire / Booksy embed here.
                  </p>
                  <p className="mt-2 text-sm text-bone/60">
                    Replace this placeholder in <code>src/routes/index.tsx</code> —
                    look for <code>BOOKING WIDGET EMBED GOES HERE</code>.
                  </p>
                </div>
              </div>
            </div>
            <p className="mt-4 text-sm text-bone/70">
              Prefer to call or message?{" "}
              <a href={PHONE_HREF_RAW} className="text-brass hover:underline">
                {PHONE_DISPLAY}
              </a>{" "}
              ·{" "}
              <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" className="text-brass hover:underline">
                @fresh.cutz.barbers
              </a>
            </p>
          </div>

          {/* Fallback contact form */}
          <ContactForm />
        </div>
      </div>
    </section>
  );
}

function ContactForm() {
  const [sent, setSent] = useState(false);
  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // TODO: Wire form submissions to an email service (e.g. Resend, Formspree)
    // or CRM. Read fields from new FormData(e.currentTarget).
    setSent(true);
  }
  const inputCls =
    "mt-1 block w-full min-h-[44px] rounded-md border border-border bg-background px-3 py-2 text-sm text-bone placeholder:text-bone/40 focus:border-brass focus:outline-none focus:ring-2 focus:ring-brass/40";
  return (
    <form
      onSubmit={handleSubmit}
      className="reveal rounded-2xl border border-border bg-card p-6"
      aria-label="Contact Fresh Cutz Barbers"
    >
      <p className="eyebrow text-brass">Or leave your details</p>
      <h3 className="mt-2 font-display text-2xl font-semibold">We'll get back to you.</h3>
      {sent ? (
        <p className="mt-6 rounded-md border border-brass/40 bg-brass/10 p-4 text-sm text-bone">
          Thanks — we'll be in touch shortly.
        </p>
      ) : (
        <div className="mt-6 space-y-4">
          <label className="block text-sm text-bone/80">
            Name
            <input name="name" required className={inputCls} placeholder="Your name" />
          </label>
          <label className="block text-sm text-bone/80">
            Phone or email
            <input
              name="contact"
              required
              className={inputCls}
              placeholder="07…  or  you@email.com"
            />
          </label>
          <label className="block text-sm text-bone/80">
            Preferred barber
            <select name="barber" className={inputCls} defaultValue="">
              <option value="">No preference</option>
              <option value="baggio">Baggio</option>
              <option value="rahul">Rahul</option>
            </select>
          </label>
          <label className="block text-sm text-bone/80">
            Message <span className="text-bone/50">(optional)</span>
            <textarea
              name="message"
              rows={3}
              className={inputCls}
              placeholder="What are you after?"
            />
          </label>
          <button
            type="submit"
            className="inline-flex min-h-[44px] w-full items-center justify-center rounded-full bg-brass px-6 py-3 font-semibold text-charcoal hover:-translate-y-0.5 transition-transform"
          >
            Send
          </button>
          <p className="text-xs text-bone/50">
            {/* TODO: Wire form submission handler in ContactForm() to email service / CRM. */}
            We'll only use these details to get back to you about your booking.
          </p>
        </div>
      )}
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
            <ScissorsMark className="h-6 w-6 text-brass" />
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
function ScissorsMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <circle cx="6" cy="17" r="3" />
      <circle cx="18" cy="17" r="3" />
      <path d="M8.5 14.5 20 4M15.5 14.5 4 4" strokeLinecap="round" />
    </svg>
  );
}


function CoilyPattern() {
  return (
    <svg viewBox="0 0 200 150" className="h-full w-full" aria-hidden>
      {Array.from({ length: 7 }).map((_, r) =>
        Array.from({ length: 10 }).map((_, c) => (
          <circle
            key={`${r}-${c}`}
            cx={12 + c * 20 + (r % 2 ? 8 : 0)}
            cy={14 + r * 18}
            r="6"
            fill="none"
            stroke="oklch(0.78 0.13 82)"
            strokeWidth="1.2"
          />
        )),
      )}
    </svg>
  );
}

function StraightPattern() {
  return (
    <svg viewBox="0 0 200 150" className="h-full w-full" aria-hidden>
      {Array.from({ length: 24 }).map((_, i) => (
        <line
          key={i}
          x1={10 + i * 8}
          y1="10"
          x2={10 + i * 8}
          y2="140"
          stroke="oklch(0.78 0.13 82)"
          strokeWidth="1.2"
        />
      ))}
    </svg>
  );
}

function WavyPattern() {
  return (
    <svg viewBox="0 0 200 150" className="h-full w-full" aria-hidden>
      {Array.from({ length: 9 }).map((_, i) => (
        <path
          key={i}
          d={`M0 ${18 + i * 15} Q 25 ${8 + i * 15}, 50 ${18 + i * 15} T 100 ${18 + i * 15} T 150 ${18 + i * 15} T 200 ${18 + i * 15}`}
          fill="none"
          stroke="oklch(0.78 0.13 82)"
          strokeWidth="1.2"
        />
      ))}
    </svg>
  );
}

function ScissorsBig() {
  return (
    <svg viewBox="0 0 600 400" className="h-full w-full" fill="none" aria-hidden>
      <circle cx="140" cy="300" r="55" stroke="oklch(0.78 0.13 82)" strokeWidth="2" />
      <circle cx="460" cy="300" r="55" stroke="oklch(0.78 0.13 82)" strokeWidth="2" />
      <path d="M180 260 L460 60 M420 260 L140 60" stroke="oklch(0.78 0.13 82)" strokeWidth="2" />
    </svg>
  );
}
