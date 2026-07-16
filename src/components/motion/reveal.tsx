"use client";

import { gsap, ScrollTrigger, useIsoLayoutEffect, REVEAL_GRIDS } from "@/lib/motion";
import { lineMaskTween } from "./split-headline";
import { CutTransition } from "./cut-transition";
import { ShearSplit } from "./shear-split";
import { CombParallax, CombWipe } from "./comb";

/**
 * data-anim -> travel distance. NEGATIVE: everything on this page falls into
 * place from above rather than rising into it.
 *
 * The prototype's +44 (rise up, fade in) is the default every site ships and it
 * reads as UI sliding. Cut hair falls. Flipping the sign costs nothing, changes
 * nothing about the layout, and makes the whole page read as material settling —
 * which is the only reveal a barbershop should have.
 *
 * Magnitudes are the prototype's, unchanged: they were calibrated against the
 * type scale and the distance is still right, only the direction was wrong.
 */
const TRAVEL: Record<string, number> = { card: -44, lines: -34, fade: -20 };

function promote(targets: gsap.TweenTarget) {
  gsap.set(targets, { willChange: "transform, opacity" });
}
function demote(targets: gsap.TweenTarget) {
  gsap.set(targets, { clearProps: "willChange" });
}

/**
 * Mount once, near the root. Owns the page's scroll choreography.
 *
 * The prototype gave every `.reveal` its own trigger AND ran ScrollTrigger.batch
 * over grid items that are themselves `.reveal` — two triggers animating the same
 * element with different starts and durations. `:not([data-batch])` splits the two
 * populations so each element is owned by exactly one pass.
 *
 * It also mounts the transitions, rather than each section rendering its own.
 * They are all fixed overlays that address their source by selector and append
 * their panels to <body>, so none of them needs to live inside the section it
 * animates — and mounting them here keeps the sections free of motion markup
 * they'd otherwise have to carry (and keeps <CutTransition />'s fixed overlay
 * out of the hero subtree that <CutTransition /> itself clones). The one thing
 * the choreography does ask of the markup is the `.line-mask` spans in each h2.
 */
export function ScrollReveals() {
  useIsoLayoutEffect(() => {
    // matchMedia, not a one-shot boolean: toggling the OS setting reverts these
    // live, and revert leaves every element at its natural (final) state.
    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      // ---- headings: the hero's line-mask, on scroll ----
      // Bound here rather than from a <LineMask> wrapper component because the
      // gesture needs no element of its own, and this is already the page's
      // single binding pass. `.line-mask` joins `.hero-line` as a global
      // structural contract with the sections — see the note in split-headline.
      //
      // Grouped per heading, not one flat toArray: the 0.08 stagger is between
      // the lines of one h2, and a page-wide stagger would ripple across
      // sections nowhere near each other. Grouped by walking up from each mask
      // rather than by an `h2:has(.line-mask)` selector — the heading is the
      // trigger, so it has to be found anyway, and this asks nothing of :has.
      const headings = new Set<HTMLElement>();
      gsap.utils.toArray<HTMLElement>(".line-mask").forEach((mask) => {
        const heading = mask.parentElement;
        if (heading) headings.add(heading);
      });
      headings.forEach((heading) => {
        const lines = gsap.utils.toArray<HTMLElement>(".line-mask > span", heading);
        if (!lines.length) return;
        lineMaskTween(lines, {
          duration: 0.9,
          stagger: 0.08,
          ease: "power3.out",
          scrollTrigger: { trigger: heading, start: "top 85%", once: true },
        });
      });

      gsap.utils.toArray<HTMLElement>(".reveal:not([data-batch])").forEach((el) => {
        const y = TRAVEL[el.dataset.anim ?? ""] ?? TRAVEL.fade;
        gsap.fromTo(
          el,
          { y, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 1,
            ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 86%", once: true },
            onStart: () => promote(el),
            onComplete: () => demote(el),
          },
        );
      });

      // batch has no fromTo — these read their from-state from `.reveal[data-batch]`
      // in globals.css, so the tween is a plain `to`.
      REVEAL_GRIDS.forEach(({ sel, stagger }) => {
        ScrollTrigger.batch(sel, {
          start: "top 88%",
          once: true,
          onEnter: (els) =>
            gsap.to(els, {
              y: 0,
              opacity: 1,
              duration: 0.9,
              stagger,
              // back.out, not power3.out: the grids are the cards, and a card
              // that falls slightly past its mark and settles back has weight.
              // 1.2 is as far as it can overshoot before the ticket stubs read
              // as bouncy rather than as something dropped. The single reveals
              // above keep power3.out — text that overshoots reads as a wobble.
              ease: "back.out(1.2)",
              overwrite: true,
              onStart: () => promote(els),
              onComplete: () => demote(els),
            }),
        });
      });
    });

    return () => mm.revert();
  }, []);

  return (
    <>
      {/* hero -> marquee: the cut. */}
      <CutTransition source="#top" />
      {/* hair types -> services: combed into view through the divider's teeth. */}
      <CombWipe target="#services" />
      <CombParallax />
      {/* recent cuts -> booking: the same blade, no scissors. */}
      <ShearSplit source="#recent-cuts" tone="ink-deep" />
    </>
  );
}
