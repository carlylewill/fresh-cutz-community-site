import { ScrollReveals } from "@/components/motion/reveal";
import { BookingWizard } from "@/components/booking/booking-wizard";
import { Nav } from "@/components/site/nav";
import { Footer } from "@/components/site/footer";
import { FloatingBook } from "@/components/site/floating-book";
import { Hero } from "./hero";
import { MarqueeStrip } from "./marquee-strip";
import { HairTypes } from "./hair-types";
import { CombDivider } from "./comb-divider";
import { Services } from "./services";
import { Barbers } from "./barbers";
import { Process } from "./process";
import { Reviews } from "./reviews";
import { RecentCuts } from "./recent-cuts";
import { SafeSpace } from "./safe-space";
import { Visit } from "./visit";
import "@/components/media/media.css";
import "./sections.css";

/*
 * media.css is imported here, at the composition root, next to sections.css.
 * Nothing in components/media imports it — <HeroVideo /> renders `.hero-bg` /
 * `.hero-media-layer` and relies on those rules existing, so without this line
 * the backdrop loses `position: absolute` and lays out in flow, shoving the hero
 * apart. If the media agent later imports it from hero-video.tsx, this becomes a
 * harmless duplicate (the bundler dedupes) rather than a conflict.
 *
 * Ordered before sections.css so section rules win on equal specificity.
 */
export function HomePage({ whatsappEnabled }: { whatsappEnabled: boolean }) {
  return (
    <>
      {/* Mounted once, near the root: it binds every .reveal on the page in a
          single pass rather than per-section. */}
      <ScrollReveals />
      <Nav />
      <main>
        <Hero />
        <MarqueeStrip />
        <HairTypes />
        <CombDivider />
        {/* v2 order: Services before Barbers. The prices are the thing people
            scroll for; the roster is the reassurance after. */}
        <Services />
        <Barbers />
        <Process />
        <Reviews />
        <RecentCuts />

        {/* The wizard is owned by <BookingWizard />; this section is just its
            frame, so the heading matches every other section on the page. */}
        <section id="book" className="sec from-ink to-ink-soft bg-gradient-to-b">
          <div className="wrap">
            <div className="eyebrow sec-eyebrow reveal" data-anim="fade">
              Book
            </div>
            <h2
              className="font-display reveal max-w-[900px] text-[clamp(34px,5.5vw,72px)] leading-[1.02] font-bold tracking-[-0.005em] uppercase"
              data-anim="lines"
            >
              Grab a <span className="text-brass">chair.</span>
            </h2>
            <p className="text-steel reveal mt-[18px] max-w-[560px] text-[15.5px]" data-anim="fade">
              Send a request in four quick steps. Baggio or Rahul confirms it personally —
              you&rsquo;ll get the confirmation by{" "}
              {/* The prototype promises WhatsApp unconditionally. With the
                  integration off that is a false statement about what the
                  business will do, so it tracks the flag. */}
              {whatsappEnabled ? "WhatsApp and email" : "email"}.
            </p>
            <BookingWizard whatsappEnabled={whatsappEnabled} />
          </div>
        </section>

        <SafeSpace />
        <Visit />
      </main>
      <Footer />
      <FloatingBook />
    </>
  );
}
