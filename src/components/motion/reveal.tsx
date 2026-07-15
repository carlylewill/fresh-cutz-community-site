"use client";

import { gsap, ScrollTrigger, useIsoLayoutEffect, REVEAL_GRIDS } from "@/lib/motion";

/** data-anim -> travel distance, from the prototype. */
const TRAVEL: Record<string, number> = { card: 44, lines: 34, fade: 20 };

function promote(targets: gsap.TweenTarget) {
  gsap.set(targets, { willChange: "transform, opacity" });
}
function demote(targets: gsap.TweenTarget) {
  gsap.set(targets, { clearProps: "willChange" });
}

/**
 * Mount once, near the root. Renders null.
 *
 * The prototype gave every `.reveal` its own trigger AND ran ScrollTrigger.batch
 * over grid items that are themselves `.reveal` — two triggers animating the same
 * element with different starts and durations. `:not([data-batch])` splits the two
 * populations so each element is owned by exactly one pass.
 */
export function ScrollReveals() {
  useIsoLayoutEffect(() => {
    // matchMedia, not a one-shot boolean: toggling the OS setting reverts these
    // live, and revert leaves every element at its natural (final) state.
    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
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
              ease: "power3.out",
              overwrite: true,
              onStart: () => promote(els),
              onComplete: () => demote(els),
            }),
        });
      });
    });

    return () => mm.revert();
  }, []);

  return null;
}
