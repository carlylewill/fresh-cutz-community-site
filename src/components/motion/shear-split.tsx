"use client";

import { gsap, ScrollTrigger, useIsoLayoutEffect } from "@/lib/motion";
import { createShearPanels, shearApart, type ShearPanels, type ShearTone } from "./shear";

/**
 * The shear without the cut-line or the tool — the transition into Booking.
 *
 * The whole mechanism is shear.ts, shared with <CutTransition />: freeze a copy
 * of `source` when it starts leaving, let the real page scroll on behind it,
 * then part the halves once `source` is off-screen and Booking is genuinely at
 * the top of the viewport. What's different here is only what's missing — no
 * draw, so no scrub either. The range exists purely to bracket the freeze, and
 * the shear is the same one-shot 0.9s `expo.inOut`.
 *
 * HORIZONTAL, AND STAYING HORIZONTAL. There are three partings on this page and
 * they must not read as the same beat three times. The hero's vertical cut is
 * THE signature: blade, glow, torn edge, scroll-driven. Making this one vertical
 * too would spend that signature a second time, twenty sections later, on a
 * transition that isn't the point of the page.
 *
 * So this stays on the loader's axis — but it cannot be confused with the loader
 * either, because it has no tool, no line, no glow and no timeline: it is a
 * silent scene change, not a cut. It also can't collide with the loader in
 * practice; the loader is behind a sessionStorage skip and most people scrolling
 * this far have not seen it this session. Quiet horizontal here, loud vertical at
 * the hero: the signature stays rare, which is the only thing that makes it one.
 *
 * Renders null and takes `source` as a selector: it is mounted next to the
 * section it copies but must not be inside it (a fixed overlay in the copied
 * subtree would be copied too).
 *
 * `tone` must match the background `source` actually sits on. The panels are
 * opaque by necessity — they hide a page that is still scrolling — so an
 * `bg-ink-deep` section frozen onto an ink panel seams at the viewport edges.
 */
export function ShearSplit({
  source = "#recent-cuts",
  tone = "ink-deep",
}: {
  source?: string;
  tone?: ShearTone;
}) {
  useIsoLayoutEffect(() => {
    const mm = gsap.matchMedia();

    // Reduced motion: no copy, no trigger, Booking scrolls in normally. That is
    // already the final state — nothing to fake, nothing left half-open.
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const section = document.querySelector<HTMLElement>(source);
      if (!section) return;

      let panels: ShearPanels | null = null;
      let sheared = false;

      const trigger = ScrollTrigger.create({
        trigger: section,
        // The bracket is the section's exit and nothing more: `bottom bottom` is
        // the last moment it fills the screen alone, `bottom top` the first
        // moment it is gone, and the shear fires between them.
        //
        // Deliberately NOT <CutTransition />'s `top top+=1`, which these two used
        // to share. That range exists to be scrubbed, so it wants every pixel of
        // the hero's scroll; this one has no scrub — it only has to bracket the
        // freeze — and starting it at the section's top would hold a still of
        // #recent-cuts over the live page for the section's entire height to no
        // purpose. Same shape, different jobs.
        start: "bottom bottom-=1",
        end: "bottom top",
        onEnter: () => {
          if (sheared || panels) return;
          panels = createShearPanels(section, { tone, axis: "horizontal" });
        },
        onLeave: () => {
          if (sheared || !panels) return;
          sheared = true;
          const held = panels;
          panels = null;
          shearApart(held, {
            onComplete: () => {
              held.destroy();
              trigger.kill();
            },
          });
        },
        onLeaveBack: () => {
          if (sheared) return;
          panels?.destroy();
          panels = null;
        },
      });

      return () => {
        panels?.destroy();
        trigger.kill();
      };
    });

    return () => mm.revert();
  }, [source, tone]);

  return null;
}
