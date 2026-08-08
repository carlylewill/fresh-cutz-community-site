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
 * The id of the one scrolling element on the page. See the app-shell comment in
 * globals.css for why the window no longer scrolls.
 */
export const SCROLLER_ID = "scroller";

/**
 * The scrolling element, or null during SSR / before the shell has mounted.
 *
 * Everything that used to read `window.scrollY` or `window.innerHeight` for a
 * scroll-relative measurement must go through this: the window's scroll position
 * is now permanently 0 and its height is taller than the scrolled area by the
 * header.
 */
export function getScroller(): HTMLElement | null {
  if (typeof document === "undefined") return null;
  return document.getElementById(SCROLLER_ID);
}

/** How far the page has scrolled. `window.scrollY`'s replacement. */
export function scrollTop(): number {
  return getScroller()?.scrollTop ?? 0;
}

/**
 * The height of the scrolled viewport. `window.innerHeight`'s replacement —
 * shorter than the window by the header, which is the whole point.
 */
export function viewportHeight(): number {
  return getScroller()?.clientHeight ?? (typeof window === "undefined" ? 0 : window.innerHeight);
}

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
