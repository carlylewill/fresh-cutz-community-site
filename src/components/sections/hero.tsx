import { HeroVideo } from "@/components/media/hero-video";
import { Counter } from "@/components/motion/counter";
import { HeroParallax } from "@/components/motion/hero-parallax";
import { Magnetic } from "@/components/motion/magnetic";
import { RazorDraw } from "@/components/motion/razor-draw";
import { SplitHeadline } from "@/components/motion/split-headline";
import { OpenStatusBadge } from "@/components/site/open-status-badge";
import { RATING, REVIEW_COUNT } from "@/lib/services";
import { NextOpeningTicket } from "./next-opening-ticket";

export function Hero() {
  return (
    /*
     * A <section>, not a <header>. The site's only <header> is now the nav bar
     * outside #scroller — two of them and every `querySelector("header")` on the
     * page (<HeroParallax />'s trigger, and any assistive-tech landmark walk)
     * silently resolves to whichever comes first in the DOM, which would be the
     * bar.
     *
     * The height is one SCROLLER viewport, not one browser viewport: the header
     * is a real flex sibling now, so `100svh` here would overflow by its height
     * and leave the hero's last band of copy permanently below the fold.
     * --nav-h is published by <Nav />; the 64px fallback covers the frame or two
     * before its ResizeObserver reports.
     *
     * `pt` is down from a flat 120px, and that is a required knock-on rather
     * than a taste change: the old value was clearance for a fixed bar that
     * overlapped this section. Nothing overlaps it now, so 120 would be counted
     * twice and push the centred copy visibly low.
     *
     * Zero of it on a phone, measured rather than guessed. The copy column is
     * ~525px against a ~583px box at 390x844, so the slack here is the only
     * thing keeping the headline block off the `.scroll-hint` pinned to the
     * bottom-left. At 0 the gap is exactly what it was before this section lost
     * the header's height; anything more eats into it. Desktop has ~300px of
     * room to spare and keeps the breathing space.
     */
    <section
      id="top"
      className="relative flex min-h-[calc(100svh-var(--nav-h,64px))] flex-col justify-center overflow-hidden px-[clamp(20px,4vw,48px)] md:pt-[44px]"
    >
      {/* Renders the .hero-bg container, poster and overlay itself (and owns the
          LCP priority). <HeroParallax /> renders null and scrubs whatever
          .hero-bg holds, so it must come after. */}
      <HeroVideo />
      <HeroParallax />

      <div className="relative z-2 max-w-[1200px]">
        <div className="eyebrow hero-eyebrow reveal" data-anim="fade">
          Barber · Wealdstone, Harrow · Est. 2014
        </div>

        {/*
         * The three lines are the v2 headline. `.hero-line > span` is load-bearing
         * structure, not decoration: globals.css sets the from-state on that exact
         * selector off html[data-loader], so the slide is armed before paint.
         */}
        <SplitHeadline>
          <h1 className="font-display text-[clamp(52px,10.5vw,150px)] leading-[0.94] font-bold tracking-[-0.01em] uppercase">
            <span className="hero-line">
              <span>Every hair type.</span>
            </span>
            <span className="hero-line">
              <span className="text-brass">One chair.</span>
            </span>
            <span className="hero-line">
              <span>Cut with care.</span>
            </span>
          </h1>
        </SplitHeadline>

        <p
          className="hero-sub reveal text-steel mt-[26px] max-w-[520px] text-[clamp(15px,1.4vw,17px)]"
          data-anim="fade"
        >
          Afro hair barber, Asian hair specialist, and the go-to for{" "}
          <strong className="text-paper font-medium">kids&rsquo; first haircuts</strong>. Coils,
          waves, straight — bring whatever you&rsquo;ve got. Baggio and Rahul will take the time to
          get it right.
        </p>

        <div
          className="hero-row reveal mt-[38px] flex flex-wrap items-center gap-[26px]"
          data-anim="fade"
        >
          <Magnetic>
            <a className="btn-primary" href="#book">
              <i className="sweep" aria-hidden />
              <span>Book Now</span>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path
                  d="M2 8h11M9 3l5 5-5 5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
          </Magnetic>

          <div className="font-mono text-steel text-[13px]">
            ★{" "}
            <Counter
              to={Number(RATING)}
              decimals={1}
              className="text-brass-bright text-base font-medium"
            />{" "}
            ·{" "}
            <Counter
              to={Number(REVIEW_COUNT)}
              className="text-brass-bright text-base font-medium"
            />{" "}
            Google reviews
            <br />
            Trusted by regulars for 12 years
          </div>

          <OpenStatusBadge />
        </div>
      </div>

      {/* Both float over the full-bleed video in the right-hand side the copy
          leaves empty, and are positioned as a pair — see sections.css. */}
      <RazorDraw />
      <NextOpeningTicket />

      <div className="scroll-hint font-mono text-steel absolute bottom-7 left-[clamp(20px,4vw,48px)] z-2 flex items-center gap-2.5 text-[11px] tracking-[0.3em] uppercase">
        Scroll
        <i className="drip" aria-hidden />
      </div>
    </section>
  );
}
