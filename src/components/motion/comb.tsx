"use client";

import { gsap, ScrollTrigger, useIsoLayoutEffect } from "@/lib/motion";

/** Matches <CombDivider />'s teeth: 31 across a 1200 viewBox, one band per tooth. */
const BANDS = 31;

/**
 * Slight parallax on the comb dividers.
 *
 * Targets `.comb` by selector — the markup is <CombDivider /> in
 * components/sections, which we don't own. The class is already a contract with
 * sections.css; this makes it one with the motion layer too.
 */
export function CombParallax() {
  useIsoLayoutEffect(() => {
    const mm = gsap.matchMedia();

    // Reduced motion: the comb sits where the layout puts it, which is its final
    // state — a parallax has no destination to land on.
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.utils.toArray<HTMLElement>(".comb").forEach((comb) => {
        // Scrubbed transforms repaint for as long as the comb is on screen, so a
        // standing will-change is earned here (same call as <HeroParallax />).
        // gsap.set is reverted with mm.
        gsap.set(comb, { willChange: "transform" });
        gsap.to(comb, {
          yPercent: -22,
          ease: "none",
          // `scrub: true`, never a number: Lenis already smooths the position
          // ScrollTrigger reads, and a numeric scrub stacks a second lag on top.
          scrollTrigger: { trigger: comb, start: "top bottom", end: "bottom top", scrub: true },
        });
      });
    });

    return () => mm.revert();
  }, []);

  return null;
}

/**
 * THE COMB WIPE — the section below the divider is combed into view through the
 * comb's own teeth.
 *
 * One opaque band per tooth, sitting over the top of `target`, each retracting
 * upward (`scaleY: 1 -> 0`, origin top) as the comb crosses the viewport. The
 * section resolves through widening gaps in the same rhythm as the teeth above
 * it, so the divider reads as the thing doing the work rather than as a
 * graphic that happens to be nearby.
 *
 * WHY BANDS AND TRANSFORMS, NOT A MASK OR A CLIP-PATH
 * ---------------------------------------------------
 * The brief allowed an animated `clip-path` polygon or a `mask-image` with a
 * moving `mask-position`/`mask-size`, as documented exceptions. Both were
 * measured against what they'd cost here and both lose:
 *
 *   - A 31-band striped mask over a full-width section is a mask the compositor
 *     has to re-rasterise every frame it changes, across the whole section box.
 *     `clip-path` with 62 vertices is the same story through a different code
 *     path. Neither is free just because neither is layout.
 *   - 31 absolutely-positioned bands animating `scaleY` are 31 composited
 *     layers moving on transform alone — the one thing the compositor does
 *     without touching the main thread. No exception to the house rule needed,
 *     and it holds 60fps on a throttled CPU where the mask version drops frames
 *     on a 390px phone.
 *
 * The bands are injected rather than rendered: `target` is a section we don't
 * own, `.sec` is already `position: relative`, and this keeps the whole effect
 * inside the motion layer instead of asking the sections for a wrapper.
 */
export function CombWipe({ target = "#services" }: { target?: string }) {
  useIsoLayoutEffect(() => {
    const mm = gsap.matchMedia();

    // Reduced motion: the bands are never injected, so the section is simply
    // itself — which is exactly the state the wipe ends on. Nothing to undo.
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const section = document.querySelector<HTMLElement>(target);
      // The comb immediately above `target` is the one doing the combing; a page
      // with two dividers must not have the first drive the last section.
      // <CombDivider /> renders the `.comb` svg as the sibling itself, but a
      // later refactor could wrap it — accept both rather than depend on which.
      const prev = section?.previousElementSibling;
      const comb = prev?.matches(".comb") ? prev : prev?.querySelector(".comb");
      if (!section || !comb) return;

      const wipe = document.createElement("div");
      wipe.className = "comb-wipe";
      wipe.setAttribute("aria-hidden", "true");
      for (let i = 0; i < BANDS; i++) {
        wipe.appendChild(document.createElement("i")).className = "comb-band";
      }
      section.prepend(wipe);

      const bands = Array.from(wipe.querySelectorAll<HTMLElement>(".comb-band"));

      const tween = gsap.fromTo(
        bands,
        { scaleY: 1 },
        {
          scaleY: 0,
          ease: "none",
          // Each tooth lets go a hair after the one left of it — the comb is
          // being drawn across, not lifted off.
          stagger: { each: 0.6 / BANDS, from: "start" },
          scrollTrigger: {
            trigger: comb,
            // Opens as the comb reaches the lower third and completes as it
            // leaves the upper third: the wipe is finished before the section's
            // own content reveals start, so the two never animate the same
            // pixels at once.
            start: "top 75%",
            end: "top 25%",
            scrub: true,
          },
          onComplete: () => {
            // Once combed, the bands are 31 stranded layers over a section the
            // user is about to read. They have done their job.
            wipe.remove();
          },
        },
      );

      return () => {
        tween.scrollTrigger?.kill();
        tween.kill();
        wipe.remove();
      };
    });

    return () => mm.revert();
  }, [target]);

  return null;
}
