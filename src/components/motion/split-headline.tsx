"use client";

import type { ReactNode } from "react";
import { gsap, useIsoLayoutEffect } from "@/lib/motion";
import { useLoaderDone } from "./loader-gate";

/**
 * The line-mask reveal itself, shared by the hero h1 (below, on the loader) and
 * every section h2 (<ScrollReveals />, on scroll). One implementation, two
 * triggers — the tween is the house's headline gesture and should only ever be
 * described once.
 *
 * Callers own the trigger and the calibration; this owns the gesture and the
 * will-change discipline. The lines are one-shots, so the layers are promoted in
 * `onStart` and dropped in `onComplete` rather than standing in CSS.
 */
export function lineMaskTween(lines: HTMLElement[], vars: gsap.TweenVars = {}) {
  return gsap.fromTo(
    lines,
    // -110%, i.e. the line drops in from above its own mask. The brief said
    // 110% (rise), and every reveal on the page has been flipped the same way
    // for the same reason: cut hair falls. A headline that rises out of a slot
    // and cards that fall into one are two different sites.
    //
    // `y: 0` IS LOAD-BEARING. Without it this tween silently never arrives, and
    // it is worth being precise about why, because the bug is invisible in the
    // code and total on the screen:
    //
    // The hero's from-state is CSS (`html[data-loader="play"] .hero-line > span
    // { transform: translateY(-110%) }`), which has to be CSS — the h1 paints
    // before this JS runs. But GSAP doesn't see `-110%`. It reads the *computed
    // matrix*, which the browser has already resolved to pixels, and records
    // that as `y: -155.1px` (110% of a 141px line at 1440w). `yPercent` and `y`
    // are separate channels that GSAP composes, so tweening yPercent to 0 leaves
    // the parsed `y: -155.1px` untouched and the line settles 155px outside the
    // mask that `overflow: hidden` then clips. The reveal "runs" perfectly, to
    // completion, onto an element nobody can see.
    //
    // Declaring `y: 0` in the from-state overrides what GSAP parsed instead of
    // inheriting it, so the CSS arms the animation and this owns it.
    { yPercent: -110, y: 0 },
    {
      yPercent: 0,
      y: 0,
      duration: 1,
      ease: "power3.out",
      onStart: () => gsap.set(lines, { willChange: "transform" }),
      onComplete: () => gsap.set(lines, { clearProps: "willChange" }),
      ...vars,
    },
  );
}

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

      // expo.out over 1s at a 0.1 stagger, not the sections' power3.out/0.08:
      // the h1 is three long lines arriving into an empty screen off the back of
      // the loader's shear, and it is calibrated to that. The h2s are one or two
      // short lines arriving mid-scroll. Same gesture, different room.
      lineMaskTween(lines, { duration: 1, stagger: 0.1, ease: "expo.out" });
    });

    return () => mm.revert();
  }, [done]);

  return <>{children}</>;
}
