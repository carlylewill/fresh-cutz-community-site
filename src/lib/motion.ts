"use client";

import { useEffect, useLayoutEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Client components still execute on the server during SSR, so registering at
// module scope unguarded would touch `document` in Node.
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
  // Without this the iOS URL bar collapsing on scroll fires a resize -> full
  // refresh -> a visible hitch mid-scroll on a 100svh hero.
  ScrollTrigger.config({ ignoreMobileResize: true });
}

/** useLayoutEffect warns during SSR; useEffect is the correct no-op there. */
export const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * One-shot sample. Prefer gsap.matchMedia() inside effects where possible —
 * this reads once at mount and won't react to the OS setting changing.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Per-grid staggers, from the prototype (0.06–0.12). */
export const REVEAL_GRIDS = [
  { sel: "#svcGrid .ticket", stagger: 0.06 },
  { sel: ".hair-grid .hair-card", stagger: 0.1 },
  { sel: ".rev-grid .rev", stagger: 0.1 },
  { sel: ".barber-grid .barber", stagger: 0.12 },
] as const;

export { gsap, ScrollTrigger };
