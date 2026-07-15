"use client";

import type { ReactNode } from "react";
import { gsap, useIsoLayoutEffect } from "@/lib/motion";
import { useLoaderDone } from "./loader-gate";

/**
 * Plays the hero h1 in once the loader clears. Renders {children} untouched — the
 * `.hero-line > span` structure is authored in the section, because where the
 * headline breaks is art direction, and a JS split would reflow the LCP element
 * after hydration.
 *
 * The from-state is CSS (`html[data-loader="play"] .hero-line > span`), not a
 * gsap.set here: the h1 paints long before this component's JS runs, so arming it
 * in an effect would show the finished headline for a frame and yank it back
 * down. That also makes reduced motion free — the same CSS gives `transform:
 * none` and this effect just never runs.
 *
 * Selector is unscoped by design: `.hero-line` is already a global singleton
 * contract shared with globals.css and sections.css. Scoping would need a
 * wrapper element around the h1 that the hero's layout doesn't want.
 */
export function SplitHeadline({ children }: { children: ReactNode }) {
  const done = useLoaderDone();

  useIsoLayoutEffect(() => {
    if (!done) return;

    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const lines = gsap.utils.toArray<HTMLElement>(".hero-line > span");
      if (!lines.length) return;

      gsap.fromTo(
        lines,
        { yPercent: 110 },
        {
          yPercent: 0,
          duration: 1,
          stagger: 0.1,
          ease: "expo.out",
          // One-shot: promote for the tween, drop the layers after. (sections.css
          // currently also declares `will-change: transform` on this selector
          // permanently, which defeats the clear — see the handover note.)
          onStart: () => gsap.set(lines, { willChange: "transform" }),
          onComplete: () => gsap.set(lines, { clearProps: "willChange" }),
        },
      );
    });

    return () => mm.revert();
  }, [done]);

  return <>{children}</>;
}
