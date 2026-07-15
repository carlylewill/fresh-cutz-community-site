"use client";

import { gsap, useIsoLayoutEffect } from "@/lib/motion";

/**
 * Fresh config object per tween: ScrollTrigger attaches live state to whatever
 * it's handed, so two tweens sharing one literal share one trigger.
 *
 * `scrub: true`, never a number. Lenis already smooths the scroll position that
 * feeds ScrollTrigger, so a numeric scrub would stack a second lag on top and the
 * razor would visibly trail the page instead of belonging to it.
 */
const range = () => ({ trigger: "header", start: "top top", end: "bottom top", scrub: true });

export function HeroParallax() {
  useIsoLayoutEffect(() => {
    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      // .hero-media is on both the poster <img> and the <video>. Targeting the
      // img alone would scrub the poster underneath a stationary video — i.e.
      // invisibly — on desktop. On mobile/reduced-motion the video isn't
      // rendered at all and this matches just the poster.
      const bg = document.querySelectorAll(".hero-bg .hero-media");
      const razor = document.querySelector("#razor-wrap");

      // Scrubbed transforms repaint every frame the hero is on screen — the other
      // place a standing will-change is earned. gsap.set is reverted with mm.
      if (bg.length) {
        gsap.set(bg, { willChange: "transform" });
        gsap.to(bg, { yPercent: 12, ease: "none", scrollTrigger: range() });
      }
      if (razor) {
        gsap.set(razor, { willChange: "transform" });
        gsap.to(razor, { yPercent: -18, ease: "none", scrollTrigger: range() });
      }
    });

    return () => mm.revert();
  }, []);

  return null;
}
