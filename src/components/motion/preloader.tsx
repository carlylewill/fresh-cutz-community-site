"use client";

import { useRef } from "react";
import { gsap, getScroller, useIsoLayoutEffect } from "@/lib/motion";
import { useLenis } from "./smooth-scroll-provider";

/**
 * Lenis alone doesn't block keyboard/spacebar scroll, so the loader also clamps
 * the scroll container outright.
 *
 * #scroller, NOT documentElement: <html> has not scrolled since the app shell
 * landed, so locking it would be a no-op and the page would scroll away
 * underneath the overlay on the first spacebar. See globals.css.
 */
function lockScroll(locked: boolean) {
  const el = getScroller();
  if (el) el.style.overflow = locked ? "hidden" : "";
}

/**
 * "The Cut" — ported from freshcutz-v2_1.html with four deliberate changes:
 *
 * 1. ~1.5s, not the prototype's ~3.4s. The loader is opaque and fixed over the
 *    hero, so whatever it shows IS the LCP element and the h1 can't paint until
 *    the shear opens. At 3.4s that's a guaranteed Core Web Vitals failure on a
 *    site whose traffic is local Google search. This is the shortest duration
 *    that still reads as a deliberate cut.
 * 2. `.cut-line` scales instead of animating `width` (a layout property).
 * 3. `#scissors` uses xPercent rather than a pixel value derived from a
 *    once-read `innerWidth`, which broke on resize.
 * 4. Markup renders unconditionally and identically on server and client; the
 *    skip decision comes from html[data-loader], stamped by a blocking head
 *    script before first paint. Branching in render would be a hydration
 *    mismatch; branching in an effect would let the loader flash in.
 */
export function Preloader({ onDone }: { onDone: () => void }) {
  const root = useRef<HTMLDivElement>(null);
  const num = useRef<HTMLDivElement>(null);
  const lenis = useLenis();

  useIsoLayoutEffect(() => {
    if (document.documentElement.dataset.loader === "skip") {
      onDone();
      return;
    }

    const ctx = gsap.context(() => {
      const counter = { v: 2014 };
      const tl = gsap.timeline({
        defaults: { ease: "power3.out" },
        onComplete: () => {
          try {
            sessionStorage.setItem("fc:loader", "seen");
          } catch {
            // Private mode — the loader simply plays again. Not worth failing for.
          }
          lockScroll(false);
          lenis?.start();
          onDone();
        },
      });

      tl.to(counter, {
        v: 2026,
        duration: 0.7,
        ease: "power2.inOut",
        onUpdate: () => {
          // textContent via ref, never state: this would be ~40 re-renders.
          if (num.current) num.current.textContent = String(Math.round(counter.v));
        },
      })
        .to("#scissors", { xPercent: 1400, duration: 0.75, ease: "power2.inOut" }, "-=0.15")
        .to(".cut-line-inner", { scaleX: 1, duration: 0.75, ease: "power2.inOut" }, "<")
        .to(
          "#blade-top",
          { rotate: -9, transformOrigin: "26px 50px", yoyo: true, repeat: 3, duration: 0.14 },
          "<",
        )
        .to(
          "#blade-bot",
          { rotate: 9, transformOrigin: "26px 50px", yoyo: true, repeat: 3, duration: 0.14 },
          "<",
        )
        .to(".loader-ticket", { opacity: 0, y: -24, duration: 0.3 }, "-=0.35")
        .to(".shear-top", { yPercent: -100, duration: 0.6, ease: "expo.inOut" })
        .to(".shear-bot", { yPercent: 100, duration: 0.6, ease: "expo.inOut" }, "<")
        .to(".cut-line", { opacity: 0, duration: 0.2 }, "<")
        // Let the page be clicked ~0.6s before the shear finishes.
        .set(root.current, { pointerEvents: "none" }, "<")
        .set(root.current, { display: "none" });

      // Nov 2026 speed pass: same sequence, played back at whatever speed
      // makes the whole loader take ~0.6s (was ~1.5s). First visit per session only.
      tl.timeScale(tl.duration() / 0.6);

      lenis?.stop();
      lockScroll(true);

      // Failsafe: never trap someone behind the overlay if a tween is starved.
      gsap.delayedCall(5, () => {
        if (tl.isActive()) tl.progress(1);
      });
    }, root);

    return () => {
      ctx.revert();
      lockScroll(false);
      lenis?.start();
    };
  }, [lenis]);

  return (
    <div id="loader" ref={root} aria-hidden="true">
      <div className="shear shear-top" />
      <div className="shear shear-bot" />
      <div className="cut-line">
        <div className="cut-line-inner" />
      </div>
      <div className="loader-ticket">
        <div className="lt-label">Now Serving</div>
        <div className="lt-num" ref={num}>
          2014
        </div>
        <div className="lt-sub">Fresh Cutz · Wealdstone</div>
      </div>
      <div id="scissors">
        <svg viewBox="0 0 100 100" fill="none">
          <g id="blade-top">
            <path d="M20 44 L86 50" stroke="#C7A83B" strokeWidth="3" strokeLinecap="round" />
            <circle cx="14" cy="40" r="9" stroke="#C7A83B" strokeWidth="3" />
          </g>
          <g id="blade-bot">
            <path d="M20 56 L86 50" stroke="#E7CE6E" strokeWidth="3" strokeLinecap="round" />
            <circle cx="14" cy="60" r="9" stroke="#E7CE6E" strokeWidth="3" />
          </g>
          <circle cx="26" cy="50" r="2.6" fill="#F2ECE1" />
        </svg>
      </div>
    </div>
  );
}
