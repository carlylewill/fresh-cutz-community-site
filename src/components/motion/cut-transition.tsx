"use client";

import { useRef } from "react";
import { gsap, ScrollTrigger, useIsoLayoutEffect } from "@/lib/motion";
import { useLoaderDone } from "./loader-gate";
import { createShearPanels, shearApart, type ShearPanels } from "./shear";

/** Clipper teeth, drawn once. Even spacing across the blade's cutting edge. */
const TEETH = Array.from({ length: 9 }, (_, i) => `M${32 + i * 4.5} 78 V85`).join(" ");

/**
 * THE signature moment — a VERTICAL cut.
 *
 * You scroll down, so the blade travels down. That is the whole idea, and it is
 * why this is vertical rather than horizontal: a horizontal cut-line fights the
 * scroll axis — it plays *at* you while you scroll past it. A vertical one is
 * driven by the scroll, so the further you scroll the deeper the cut goes, and
 * the gesture becomes cause-and-effect you can feel in your fingers rather than
 * an animation that happened to fire. The hero then parts left and right and the
 * marquee is behind it.
 *
 * IT MUST NOT REPEAT THE PRELOADER. The loader already does scissors + a
 * horizontal shear before the site opens; doing the same beat again on scroll
 * devalues both. Same shop, different tool, different axis:
 *
 *   preloader : scissors, blades ROTATING open/shut, cut ACROSS, halves up/down,
 *               straight edge, timeline-driven.
 *   here      : clipper, blade VIBRATING side to side, cut DOWN, halves
 *               left/right, TORN edge, scroll-driven.
 *
 * The clipper is the right tool for a downward cut — scissors travelling
 * point-first down a line read as a knife, and a barber's clipper is the thing
 * that actually moves in one long downward pass. Its blade vibrates rather than
 * snips, which is both true to the tool and instantly distinct from the loader.
 *
 * SCROLL RANGE — `start: "bottom bottom-=1"`, `end: "bottom top"`. Shared with
 * <ShearSplit />, and derived rather than tuned:
 *
 * The freeze must last exactly one viewport of scroll. `bottom bottom` is the
 * last moment the section still fills the screen on its own, and `bottom top` is
 * the first moment it is entirely gone — between them the copy is a seamless
 * stand-in with nothing else on screen to pop, and the range is exactly the
 * scroll the section would have taken to leave anyway. It adds nothing and hides
 * nothing. Anchoring on the section's *top* instead would work for a 100svh hero
 * and freeze a `.sec` taller than the viewport for its whole height.
 *
 * The `-=1` keeps it off scroll 0: for a hero exactly one viewport tall
 * `bottom bottom` IS scroll 0, and a trigger already past its start at load
 * would freeze a copy over the intro.
 *
 * `bottom top` is also what makes the reveal real: at progress 1 the marquee is
 * at the top of the viewport, so the halves part onto the live page rather than
 * a reconstruction of it.
 */
export function CutTransition({ source = "#top" }: { source?: string }) {
  const root = useRef<HTMLDivElement>(null);
  const done = useLoaderDone();

  useIsoLayoutEffect(() => {
    // Gated on the loader, never a delay: arming at mount would let a fast
    // scroll freeze a copy of the hero mid-intro.
    if (!done) return;

    const mm = gsap.matchMedia();

    // Reduced motion gets no branch at all: no copy, no trigger, and the hero
    // scrolls out normally. That IS the final state — the cut is decoration
    // between two sections already in the right places without it.
    //
    // The cut IS kept at 390px, against the suggestion to degrade it to a fade.
    // A vertical cut needs height, not width, and the halves part sideways off a
    // narrow screen more dramatically than on a wide one — this is the strongest
    // the moment ever looks, on the devices most of this shop's traffic uses.
    // The only thing that doesn't survive is the 92px clipper, and that is a CSS
    // scale (see `.cut-clipper` in globals.css), not a reason to drop the cut.
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const hero = document.querySelector<HTMLElement>(source);
      const overlay = root.current;
      if (!hero || !overlay) return;

      // Scoped to the overlay, never selector strings: <Preloader /> leaves its
      // own `.cut-line-inner` in the document (its timeline ends on
      // display:none, not removal), so a global `.cut-line-inner` here would
      // drive both this cut and the dead loader's.
      const lineInner = overlay.querySelector<HTMLElement>(".cut-line-inner");
      const line = overlay.querySelector<HTMLElement>(".cut-line");
      const clipper = overlay.querySelector<HTMLElement>(".cut-clipper");
      const blade = overlay.querySelector<SVGGElement>(".cut-blade");
      if (!lineInner || !line || !clipper || !blade) return;

      let panels: ShearPanels | null = null;
      let buzz: gsap.core.Tween | null = null;
      let sheared = false;
      // Cached on refresh rather than read per frame: the clipper travels the
      // viewport's height, and ScrollTrigger already recomputes on resize, so
      // this is the one place that number is allowed to come from.
      let travel = window.innerHeight;

      function unfreeze() {
        panels?.destroy();
        panels = null;
        buzz?.kill();
        buzz = null;
      }

      const trigger = ScrollTrigger.create({
        trigger: hero,
        start: "bottom bottom-=1",
        end: "bottom top",
        // `scrub: true`, never a number. Lenis already smooths the scroll
        // position ScrollTrigger reads, so a numeric scrub stacks a second lag
        // and the blade visibly trails the page — which would break the one
        // thing this effect is for. (Same call as <HeroParallax />.) Lenis
        // drives native window scroll and ScrollTrigger reads it natively —
        // there is deliberately no scrollerProxy.
        scrub: true,
        onRefresh: () => {
          travel = window.innerHeight;
        },
        onEnter: () => {
          if (sheared || panels) return;
          // Freeze here, not at mount: the copy must be of what is on screen at
          // this instant.
          panels = createShearPanels(hero, { axis: "vertical" });
          overlay.dataset.cutting = "";
          // GSAP owns the clipper's transform outright. Nothing centres it in
          // CSS on purpose: GSAP parses an existing `translateX(-50%)` into its
          // own channel and composes the two, which is exactly the trap that
          // stranded the h1 155px outside its mask (see lineMaskTween).
          gsap.set(clipper, { xPercent: -50 });
          // The blade buzzes rather than snips — a clipper's cutting edge
          // vibrates side to side. Tiny and fast, and killed the moment the cut
          // lands. This is the loader's yoyo idiom on a different property, so
          // the two tools read as the same shop and not the same animation.
          buzz = gsap.to(blade, {
            x: 1.1,
            duration: 0.05,
            repeat: -1,
            yoyo: true,
            ease: "none",
          });
        },
        onUpdate: (self) => {
          if (sheared || !panels) return;
          // Scrubbed straight off progress rather than through a timeline: two
          // linear properties off one number, and a timeline would only add a
          // layer to keep in sync with the same number.
          const p = self.progress;
          // The line grows downward (transform-origin: top) and the clipper
          // rides its leading tip, so the blade is always exactly where the cut
          // currently ends. That coupling is the effect.
          gsap.set(lineInner, { scaleY: p });
          gsap.set(clipper, { y: p * travel });
        },
        onLeave: () => {
          // Progress 1: the hero is off-screen and the marquee is at the top of
          // the viewport behind the halves. Part onto it.
          if (sheared || !panels) return;
          sheared = true;
          const held = panels;
          panels = null;
          buzz?.kill();
          buzz = null;
          // The line and the clipper did the cut; the instant the halves start
          // parting they'd otherwise hang over the section being revealed for
          // the whole 0.9s. 0.2s reads as them leaving with the cut.
          gsap.to([line, clipper], { opacity: 0, duration: 0.2 });
          shearApart(held, {
            onComplete: () => {
              held.destroy();
              overlay.style.display = "none";
              // Once it has played it is dead weight on every subsequent scroll
              // event. One-shot by contract.
              trigger.kill();
            },
          });
        },
        // Scrolling back up before the cut lands unfreezes cleanly: the copy is
        // dropped and the real hero is right there behind it, never modified.
        onLeaveBack: () => {
          if (sheared) return;
          unfreeze();
          delete overlay.dataset.cutting;
        },
      });

      return () => {
        unfreeze();
        trigger.kill();
      };
    });

    return () => mm.revert();
  }, [done, source]);

  return (
    // data-shear-exclude: this overlay is `position: fixed`, so if it ever ends
    // up inside the subtree being cloned, shear.ts strips it — otherwise the
    // copy's cut-line escapes the panel and repaints across the viewport.
    <div className="cut-overlay" ref={root} aria-hidden="true" data-shear-exclude>
      <div className="cut-line">
        <div className="cut-line-inner" />
      </div>
      <div className="cut-clipper">
        <svg viewBox="0 0 100 100" fill="none">
          {/* Body: the part you hold. Static — only the blade moves. */}
          <rect
            x="32"
            y="8"
            width="36"
            height="58"
            rx="7"
            stroke="#C7A83B"
            strokeWidth="3"
            fill="#14171C"
          />
          <path d="M39 22 H61 M39 30 H61" stroke="#C7A83B" strokeWidth="2" strokeLinecap="round" />
          {/* Blade: buzzes side to side. Brass-bright so the cutting edge is the
              brightest thing on the tool, the way the light catches it. */}
          <g className="cut-blade">
            <path
              d="M28 66 H72 L68 78 H32 Z"
              stroke="#E7CE6E"
              strokeWidth="3"
              strokeLinejoin="round"
              fill="#14171C"
            />
            <path d={TEETH} stroke="#E7CE6E" strokeWidth="2" strokeLinecap="round" />
          </g>
        </svg>
      </div>
    </div>
  );
}
