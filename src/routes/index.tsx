import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/")({
  component: Index,
});

const PHONE_DISPLAY = "07415 409277";
const PHONE_TEL = "tel:+447415409277";
const INSTAGRAM_URL = "https://www.instagram.com/fresh.cutz.barbers/";
const ADDRESS = "18 Canning Road, Wealdstone, Harrow, HA3 7SJ";
const MAP_QUERY = encodeURIComponent("Fresh Cutz Barbers, 18 Canning Road, Wealdstone, Harrow, HA3 7SJ");

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
        <Reviews />
        <SafeSpace />
        <Visit />
      </main>
      <Footer />
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
    ["Visit", "#visit"],
  ];
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <a href="#top" className="flex items-center gap-2">
          <ScissorsMark className="h-6 w-6 text-brass" />
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
        <a
          href={PHONE_TEL}
          className="hidden rounded-full border border-brass/60 px-4 py-2 text-sm font-medium text-brass transition-colors hover:bg-brass hover:text-charcoal md:inline-flex"
        >
          {PHONE_DISPLAY}
        </a>
        <button
          aria-label="Menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="rounded-md border border-border p-2 md:hidden"
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
                className="eyebrow border-b border-border/60 py-3 text-bone/80"
              >
                {label}
              </a>
            ))}
            <a
              href={PHONE_TEL}
              className="mt-4 rounded-full border border-brass px-4 py-3 text-center text-sm font-medium text-brass"
            >
              Call {PHONE_DISPLAY}
            </a>
          </div>
        </div>
      )}
    </header>
  );
}

/* ---------------- Hero ---------------- */
function Hero() {
  return (
    <section id="top" className="relative overflow-hidden">
      <BackdropPattern />
      <div className="relative mx-auto grid max-w-6xl gap-12 px-5 pb-24 pt-16 md:grid-cols-[1.15fr_1fr] md:pt-24">
        <div className="reveal">
          <p className="eyebrow text-brass">Wealdstone, Harrow · Est. 2009</p>
          <h1 className="mt-5 font-display text-5xl leading-[1.02] font-semibold tracking-tight sm:text-6xl md:text-7xl">
            Every hair type,
            <br />
            <span className="italic text-brass">unhurried</span> and
            <br />
            cut with care.
          </h1>
          <p className="mt-6 max-w-lg text-lg text-bone/75">
            A neighbourhood barbershop known for patience and precision. Coils, waves, straight — bring whatever you've got.
            We'll take the time to get it right.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-brass px-6 py-3 font-medium text-charcoal transition-transform hover:-translate-y-0.5"
            >
              Book on Instagram
              <span aria-hidden>→</span>
            </a>
            <a
              href={PHONE_TEL}
              className="inline-flex items-center gap-2 rounded-full border border-bone/40 px-6 py-3 font-medium text-bone transition-colors hover:border-brass hover:text-brass"
            >
              Call {PHONE_DISPLAY}
            </a>
          </div>
          <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-2 text-sm text-bone/60">
            <span>17+ years in the community</span>
            <span className="hidden h-1 w-1 rounded-full bg-brass/60 sm:inline-block" />
            <span>All hair types welcome</span>
            <span className="hidden h-1 w-1 rounded-full bg-brass/60 sm:inline-block" />
            <span>Kids' first cuts</span>
          </div>
        </div>
        <div className="reveal relative">
          <BarberChairIllustration />
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
      note: "Fades, shape-ups, tapers, sponge twists — cut with the grain of your curl pattern.",
      draw: <CoilyPattern />,
    },
    {
      label: "Asian / Straight",
      note: "Clean lines, textured crops, scissor work that respects thick, straight hair.",
      draw: <StraightPattern />,
    },
    {
      label: "Caucasian / Wavy",
      note: "Skin fades, classic side parts, modern crops — precision blends and finish.",
      draw: <WavyPattern />,
    },
  ];
  return (
    <section id="hair-types" className="border-y border-border/60 bg-charcoal-2/60 py-24">
      <div className="mx-auto max-w-6xl px-5">
        <div className="reveal max-w-2xl">
          <p className="eyebrow text-brass">The signature</p>
          <h2 className="mt-4 font-display text-4xl font-semibold sm:text-5xl">
            We welcome <span className="italic text-brass">all</span> hair types.
          </h2>
          <p className="mt-4 text-bone/75">
            Most shops quietly specialise in one texture. We don't. Three textures, one chair — and the technique to match whichever
            one walks in.
          </p>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {types.map((t) => (
            <article
              key={t.label}
              className="reveal group relative overflow-hidden rounded-2xl border border-border bg-background p-6"
            >
              <div className="aspect-[4/3] overflow-hidden rounded-xl bg-charcoal-2">
                {t.draw}
              </div>
              <p className="eyebrow mt-6 text-brass">{t.label}</p>
              <p className="mt-2 font-display text-2xl font-semibold">Cut with the grain.</p>
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
    ["Skin fade", "Tight, precise fade — clipper and razor finish.", "18"],
    ["Classic cut", "Scissor and clipper work, wash and finish.", "18"],
    ["Afro specialist cut", "Shape-up, tapers, sponge twists, texture work.", "22"],
    ["Beard trim & line-up", "Sculpt, edge, and hot-towel finish.", "10"],
    ["Kids' first cut", "Patient, gentle, and unrushed. Ages welcome.", "14"],
    ["Long-hair restyle", "Layered scissor work for longer lengths.", "25"],
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

/* ---------------- Reviews ---------------- */
function Reviews() {
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
          <p className="eyebrow text-brass">In their words</p>
          <h2 className="mt-4 font-display text-4xl font-semibold sm:text-5xl">
            Real reviews from real regulars.
          </h2>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
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
      </div>
    </section>
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
              <p className="mt-2 font-display text-2xl">{ADDRESS}</p>
            </div>
            <div className="grid gap-8 sm:grid-cols-2">
              <div>
                <p className="eyebrow text-bone/50">Phone</p>
                <a href={PHONE_TEL} className="mt-2 block font-display text-2xl text-brass hover:underline">
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

function BarberChairIllustration() {
  return (
    <svg viewBox="0 0 400 460" className="h-full w-full" fill="none" aria-hidden>
      <defs>
        <linearGradient id="chairGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.78 0.13 82)" stopOpacity="0.15" />
          <stop offset="100%" stopColor="oklch(0.48 0.16 25)" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="400" height="460" fill="url(#chairGrad)" rx="24" />
      {/* mirror */}
      <rect x="60" y="40" width="280" height="150" rx="140" stroke="oklch(0.78 0.13 82)" strokeWidth="1.5" />
      <path d="M110 100 Q200 60 290 100" stroke="oklch(0.78 0.13 82)" strokeWidth="1" opacity="0.5" />
      {/* counter */}
      <line x1="30" y1="220" x2="370" y2="220" stroke="oklch(0.78 0.13 82)" strokeWidth="1.5" />
      {/* bottles */}
      <rect x="90" y="185" width="14" height="35" rx="2" stroke="oklch(0.78 0.13 82)" strokeWidth="1.2" />
      <rect x="115" y="175" width="14" height="45" rx="2" stroke="oklch(0.78 0.13 82)" strokeWidth="1.2" />
      <circle cx="260" cy="205" r="10" stroke="oklch(0.48 0.16 25)" strokeWidth="1.4" />
      {/* chair base */}
      <path
        d="M120 420 L120 340 Q120 280 200 280 Q280 280 280 340 L280 420"
        stroke="oklch(0.78 0.13 82)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="M140 330 L260 330" stroke="oklch(0.78 0.13 82)" strokeWidth="1.2" />
      <path d="M200 280 L200 250" stroke="oklch(0.78 0.13 82)" strokeWidth="2" />
      <path
        d="M170 250 Q200 235 230 250"
        stroke="oklch(0.48 0.16 25)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <line x1="90" y1="440" x2="310" y2="440" stroke="oklch(0.78 0.13 82)" strokeWidth="1.5" />
      {/* stars */}
      <circle cx="70" cy="70" r="1.5" fill="oklch(0.78 0.13 82)" />
      <circle cx="330" cy="60" r="1.5" fill="oklch(0.78 0.13 82)" />
      <circle cx="350" cy="140" r="1.5" fill="oklch(0.78 0.13 82)" />
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
