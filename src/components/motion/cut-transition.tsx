"use client";

import { useRef } from "react";
import { gsap, ScrollTrigger, scrollTop, useIsoLayoutEffect, viewportHeight } from "@/lib/motion";
import { useLoaderDone } from "./loader-gate";
import {
  createRiser,
  createShearPanels,
  tearOffsetAt,
  SHEAR_CLEAR,
  type Riser,
  type ShearPanels,
} from "./shear";

/** Clipper teeth, drawn once. Even spacing across the blade's cutting edge. */
const CLIPPER_TEETH = Array.from({ length: 9 }, (_, i) => `M${32 + i * 4.5} 78 V85`).join(" ");
/** Comb teeth, pointing UP — the way it travels when it mends. */
const COMB_TEETH = Array.from({ length: 13 }, (_, i) => `M${25 + i * 4.2} 58 V30`).join(" ");

/**
 * How far the page below starts down, as a % of the VIEWPORT, before it rises.
 *
 * Applied as a pixel `y` off the cached viewport height rather than `yPercent`:
 * yPercent resolves against the riser's own height, which is however many
 * sibling sections it took to fill the screen — so the same 15 would mean a
 * different distance on a page with a taller next section, and the constant
 * would be lying about its own units.
 */
const RISE = 15;

/**
 * The last bit of that distance, as a % of the viewport, spent CATCHING UP to
 * the real page's scroll speed rather than creeping at the riser's own.
 *
 * Landing the stand-in on the right pixel at progress 1 is only half of a
 * seamless handoff, and the half that is easy to stop at. The riser is
 * `position: fixed`, so while the cut runs the page behind the gap travels
 * RISE% of a viewport across the hero's entire scroll — 0.15px for every pixel
 * of scroll — while the real page it hands over to travels 1. Match the
 * positions and the swap is still visible: the section behind the gap is
 * creeping, and then in one frame it is moving at full scroll speed. At a
 * normal flick that is ~7px per frame becoming ~50.
 *
 * So the rise is creep PLUS a small saturating term whose slope is exactly the
 * shortfall (1 - creep's rate) at the seam and ~0 for the rest of the cut. Sum
 * the two and the last pixel of the cut is already moving at the page's speed,
 * so the destroy-and-swap changes neither where anything is nor how fast it is
 * going. tanh, not an ease: it must be monotonic (a curve that dips back would
 * have the next section retreating as you scroll toward it) and it must have a
 * known derivative at 0, which is what makes the match exact rather than tuned.
 *
 * 4% is ~33px at 900 tall. Big enough to absorb the speed change, small enough
 * that the choreography above it is the one that was art-directed: for the
 * first 80% of the cut this adds under a pixel of movement per frame.
 */
const CATCH = 4;

/**
 * THE signature moment — a VERTICAL cut, fused to the scroll in both directions.
 *
 * ONE PROGRESS DRIVES EVERYTHING. This is the whole design, and the first
 * version got it wrong: it drew the line on scrub and then fired the halves
 * apart as a one-shot when the draw finished. Two beats. The user's read was
 * exact — "the pages don't go to side until I scroll and reach down". A cut that
 * plays *at* you is an animation; a cut where every property hangs off the same
 * number is something you are doing. At progress 0.3 the blade is 30% down, the
 * halves are 30% apart, the page below is 30% risen and 30% brightened. Always,
 * and only, together.
 *
 * `ease: "none"` everywhere, and nothing is a timeline. Any easing desyncs a
 * property from the finger; any one-shot breaks the reverse.
 *
 * TWO TOOLS, ONE SEAM. Scroll down and a clipper cuts the page apart. Scroll up
 * and a COMB travels back up the same seam and the halves knit together behind
 * it. A barber's comb is the tool that puts hair back — it is already this
 * site's motif (the dividers, <CombWipe />), so the hero borrows the vocabulary
 * rather than inventing a prop the trade doesn't own. The tear is the same
 * polyline on both facing edges, so the halves visibly *fit back together*
 * rather than merely approaching each other: the payoff of both halves sharing
 * one offsets array.
 *
 * REVERSING IS FREE, AND THAT IS THE POINT OF PURE SCRUB. Nothing here fires at
 * a threshold, so progress running 1→0 plays the entire thing backwards on its
 * own — halves rejoin, gap closes, the page below retreats and re-darkens. The
 * old one-shot is exactly why scrolling up used to throw it all away.
 *
 * IT MUST NOT REPEAT THE PRELOADER. The loader already does scissors + a
 * horizontal shear before the site opens. Same shop, different tool, different
 * axis:
 *
 *   preloader : scissors, blades ROTATING open/shut, cut ACROSS, halves up/down,
 *               straight edge, timeline-driven, one direction.
 *   here      : clipper/comb, blade VIBRATING, cut DOWN, halves left/right,
 *               TORN edge, scroll-driven, reversible.
 *
 * SCROLL RANGE — `start: "top top-=1"`, `end: "bottom top"`. Derived, not tuned:
 * it is every pixel of scroll the hero owns, from the first one to the one that
 * carries it off. `bottom top` is the first moment the hero is entirely gone, so
 * the cut cannot still be running once the next section is up; `top top` is the
 * earliest a scroll-driven anything can begin. It adds no scroll and hides none.
 * The `-=1` keeps it off scroll 0, where a trigger already past its start would
 * freeze a copy over the intro.
 *
 * HOW LONG THE CUT TAKES IS THE HERO'S HEIGHT, and there is no other lever here.
 * The complaint that the cut fires too fast is real, but it was never the range:
 * the range is already this trigger's whole budget, and `end` cannot move later
 * without the cut outliving the hero. Measured at both breakpoints: the hero is
 * `min-h-[100svh]` and its content fits inside that, so offsetHeight is exactly
 * innerHeight — 900 at 1440x900, 844 at 390x844 — and progress tracks scrollY/900
 * and scrollY/844 from scroll 1 to the hero's last pixel. One viewport of scroll,
 * because the hero is one viewport tall.
 *
 * Which is why `top top+=1` rather than the `bottom bottom-=1` this used to say.
 * The two are the same trigger today (a hero exactly one viewport tall reaches
 * `bottom bottom` at scroll 0), but `bottom bottom` caps the cut at the LAST
 * viewport of the hero's scroll however tall the hero is, and `top top` spends
 * all of it. Give the hero height — a shorter phone, longer copy, a bigger
 * accessibility font, or a deliberate `min-h-[170svh]` in hero.tsx with the copy
 * held in a 100svh box — and the cut lengthens to match, with nothing here to
 * retune. That is the only way to make it slower.
 */
export function CutTransition({ source = "#top" }: { source?: string }) {
  const root = useRef<HTMLDivElement>(null);
  const done = useLoaderDone();

  useIsoLayoutEffect(() => {
    // Gated on the loader, never a delay: arming at mount would let a fast
    // scroll freeze a copy of the hero mid-intro.
    if (!done) return;

    const mm = gsap.matchMedia();

    // Reduced motion gets no branch at all: no copy, no riser, no trigger, and
    // the hero scrolls out normally in both directions. That IS the final state.
    //
    // The cut IS kept at 390px, against the suggestion to degrade it to a fade.
    // A vertical cut needs height, not width, and the halves part sideways off a
    // narrow screen more dramatically than on a wide one — this is the strongest
    // the moment ever looks, on the devices most of this shop's traffic uses.
    // Only the 92px tool doesn't survive, and that is a CSS scale.
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const hero = document.querySelector<HTMLElement>(source);
      const overlay = root.current;
      if (!hero || !overlay) return;

      // Scoped to the overlay, never selector strings: <Preloader /> leaves its
      // own `.cut-line-inner` in the document (its timeline ends on
      // display:none, not removal), so a global selector would drive both this
      // cut and the dead loader's.
      const lineInner = overlay.querySelector<HTMLElement>(".cut-line-inner");
      const clipper = overlay.querySelector<HTMLElement>(".cut-clipper");
      const comb = overlay.querySelector<HTMLElement>(".cut-comb");
      const blade = overlay.querySelector<SVGGElement>(".cut-blade");
      if (!lineInner || !clipper || !comb || !blade) return;

      let panels: ShearPanels | null = null;
      let riser: Riser | null = null;
      let buzz: gsap.core.Tween | null = null;
      let facing = 0;
      // Cached on refresh rather than read per frame: the tool travels the
      // viewport's height, and ScrollTrigger already recomputes on resize.
      //
      // The SCROLLER's height, not window.innerHeight — the two differ by the
      // header now. Using the window's would overshoot the tool and the riser by
      // ~80px, so the blade would still be travelling after the cut was fully
      // open. See the app-shell note in globals.css.
      let travel = viewportHeight();

      function open(self: ScrollTrigger) {
        if (panels) return;
        // Built here, not at mount: the copy must be of the hero as it stands at
        // progress 0. Rebuilt on re-entry from either side, so the effect is as
        // reversible as the scrub that drives it.
        riser = createRiser(hero!, { tone: "ink" });
        // THE OFFSET IS DERIVED FROM THE TRIGGER, not from the clock.
        //
        // `open` runs at `start` coming down and at `end` going up, so
        // getBoundingClientRect() answers two different questions depending on
        // which way the user arrived — and going up it answers the wrong one, by
        // a viewport. `self.start` is the scroll position where progress is 0,
        // so this is the hero's top relative to the viewport at that scroll,
        // which is the only state the panels are ever seen closed in. Same
        // number in both directions, by construction.
        //
        // Reading the trigger rather than re-deriving `start`'s rule ("the
        // hero's bottom on the viewport's bottom") means the two cannot drift:
        // change the range below and this follows it.
        // scrollTop(), not window.scrollY: the window's scroll position is
        // permanently 0 under the app shell, so this would collapse to the
        // hero's viewport-relative top and the panels would be a viewport out on
        // the way back up.
        const heroTopDoc = hero!.getBoundingClientRect().top + scrollTop();
        panels = createShearPanels(hero!, {
          axis: "vertical",
          top: heroTopDoc - self.start,
          // <HeroParallax />'s two targets, and the only things in the hero whose
          // inline transform is a position on a clock rather than a resting
          // value. Named here because this component is what knows the hero has
          // a parallax on it; shear.ts can't tell a scrub from a settled tween.
          settle: ".hero-bg .hero-media, #razor-wrap",
        });
        overlay!.dataset.cutting = "";
        // GSAP owns the tools' transforms outright. Nothing centres them in CSS
        // on purpose: GSAP parses an existing `translateX(-50%)` into its own
        // channel and composes the two, which is the trap that stranded the h1
        // 155px outside its mask (see lineMaskTween).
        gsap.set([clipper, comb], { xPercent: -50 });
        // The blade buzzes rather than snips — a clipper's edge vibrates. This
        // is the loader's yoyo idiom on a different property, so the two tools
        // read as the same shop and not the same animation. It is the one thing
        // here that isn't scrubbed, because a real clipper's buzz doesn't care
        // how fast you move it.
        buzz = gsap.to(blade, { x: 1.1, duration: 0.05, repeat: -1, yoyo: true, ease: "none" });
      }

      function close() {
        panels?.destroy();
        panels = null;
        riser?.destroy();
        riser = null;
        buzz?.kill();
        buzz = null;
        delete overlay!.dataset.cutting;
      }

      const trigger = ScrollTrigger.create({
        trigger: hero,
        // `top-=1`, not `top+=1`. The offset moves the VIEWPORT line, so `+=1`
        // pushes it a pixel down the screen and the hero's top reaches it at
        // scroll -1 — i.e. before the page has moved, which is precisely the
        // "already past its start" case this is meant to avoid. Measured: the
        // panels were live at scroll 0. `-=1` puts the line a pixel above the
        // viewport top, reached at scroll 1.
        start: "top top-=1",
        end: "bottom top",
        // `scrub: true`, never a number. Lenis already smooths the scroll
        // position ScrollTrigger reads, so a numeric scrub stacks a second lag
        // and the blade trails the finger — which would break the one thing this
        // effect is for. Lenis drives native window scroll and ScrollTrigger
        // reads it natively: no scrollerProxy, deliberately.
        scrub: true,
        onRefresh: () => {
          travel = viewportHeight();
        },
        // Both edges, both directions: the cut exists whenever the hero is
        // mid-exit, however the user got there. `open` is handed the trigger
        // because the panels' geometry comes from `self.start` — the one thing
        // that is the same whichever edge fired.
        onEnter: open,
        onEnterBack: open,
        onLeave: close,
        onLeaveBack: close,
        onUpdate: (self) => {
          if (!panels || !riser) return;
          const p = self.progress;

          // Swap the tool to match the direction of travel. Only on a change:
          // this fires every frame, and both tools ride the same progress-
          // derived y, so they can never desync or both be on screen.
          if (self.direction !== facing) {
            facing = self.direction;
            gsap.set(clipper, { autoAlpha: facing === 1 ? 1 : 0 });
            gsap.set(comb, { autoAlpha: facing === 1 ? 0 : 1 });
          }

          const y = p * travel;
          // 1. cut depth — the seam drawn to wherever the tool has reached.
          gsap.set(lineInner, { scaleY: p });
          gsap.set(clipper, { y });
          // The comb rides the torn edge instead of a straight line: its teeth
          // catch the jags as it passes, because it samples the same polyline
          // the edge was cut from. Damped so it tracks rather than wobbles.
          gsap.set(comb, { y, x: tearOffsetAt(p) * 0.004 * travel });
          // 2. half separation — off the same progress, linear, so the gap is
          // exactly as open as the cut is deep. This is the fix.
          gsap.set(panels.halves[0], { xPercent: -SHEAR_CLEAR * p });
          gsap.set(panels.halves[1], { xPercent: SHEAR_CLEAR * p });
          // 3 + 4. the page below rises and brightens into the gap, landing at
          // exactly 0 / 0 at progress 1 — which is what makes the handoff to the
          // real page invisible. See createRiser().
          //
          // `left` is how much scroll the REAL page below still has to travel
          // before it is where the riser is pretending it already is, so it is
          // both the creep's input and the yardstick the catch-up matches. Taken
          // off the trigger rather than assumed equal to `travel`: they are the
          // same today only because the hero is exactly one viewport tall, and
          // the header of this file explicitly invites giving it more height.
          const span = self.end - self.start;
          const left = span * (1 - p);
          // Capped at 1: a hero short enough that RISE% of a viewport is more
          // scroll than the whole range already arrives at the page's speed,
          // and an uncapped rate would make the catch-up term negative — i.e.
          // the page below sliding backwards as it lands.
          const creepRate = span > 0 ? Math.min(((RISE / 100) * travel) / span, 1) : 1;
          const catchUp = (CATCH / 100) * travel;
          gsap.set(riser.inner, {
            y: creepRate * left + catchUp * Math.tanh(((1 - creepRate) * left) / catchUp),
          });
          gsap.set(riser.shade, { opacity: 1 - p });
        },
      });

      return () => {
        close();
        trigger.kill();
      };
    });

    return () => mm.revert();
  }, [done, source]);

  return (
    // data-shear-exclude: this overlay is `position: fixed`, so if it ever ends
    // up inside a cloned subtree, shear.ts strips it — otherwise the copy's
    // cut-line escapes the panel and repaints across the viewport.
    <div className="cut-overlay" ref={root} aria-hidden="true" data-shear-exclude>
      <div className="cut-line">
        <div className="cut-line-inner" />
      </div>

      {/* Cutting, on the way down. Blade at the bottom — the leading edge. */}
      <div className="cut-clipper">
        <svg viewBox="0 0 100 100" fill="none">
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
          <g className="cut-blade">
            <path
              d="M28 66 H72 L68 78 H32 Z"
              stroke="#E7CE6E"
              strokeWidth="3"
              strokeLinejoin="round"
              fill="#14171C"
            />
            <path d={CLIPPER_TEETH} stroke="#E7CE6E" strokeWidth="2" strokeLinecap="round" />
          </g>
        </svg>
      </div>

      {/* Mending, on the way up. Teeth point up — the leading edge, mirroring
          the clipper's blade. Same silhouette language, opposite job. */}
      <div className="cut-comb">
        <svg viewBox="0 0 100 100" fill="none">
          <rect
            x="20"
            y="58"
            width="60"
            height="13"
            rx="3"
            stroke="#C7A83B"
            strokeWidth="3"
            fill="#14171C"
          />
          <path d={COMB_TEETH} stroke="#E7CE6E" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}
