"use client";

import { useRef } from "react";
import { gsap, ScrollTrigger, useIsoLayoutEffect } from "@/lib/motion";

/** The CSS keyframe's 26s, kept: it's the calibrated reading speed, not a default. */
const DURATION = 26;
/** Velocity (px/s) that earns the full nudge. Roughly a firm flick. */
const VELOCITY_REF = 2000;
/** Ceiling on the speed-up. Past ~2.6x the phrases stop being readable. */
const MAX_TIMESCALE = 2.6;

/**
 * The ticket strip.
 *
 * Now a client component driving a GSAP loop, where it used to be a server
 * component riding a CSS keyframe. The keyframe was the better call for a strip
 * that only ever runs at one speed — it composites off-main-thread and costs no
 * JS. It stops being the better call the moment the speed has to respond to
 * scroll: `animation-duration` can't be nudged per-frame without a style
 * recalc per frame, which is the thing the keyframe was chosen to avoid. A GSAP
 * timeline exposes `timeScale`, which is a number the tween already reads.
 *
 * The duplicated track is still server-rendered and still exactly two copies:
 * `xPercent: -50` only lands on a seam because the phrases below are rendered
 * twice. (The prototype did `mq.innerHTML += mq.innerHTML` at runtime, which
 * makes frame one a seam.)
 */
export function Marquee({ items }: { items: string[] }) {
  const track = useRef<HTMLDivElement>(null);

  useIsoLayoutEffect(() => {
    const mm = gsap.matchMedia();

    // Reduced motion: the track never moves. The final state of a loop is
    // wherever it started, so a static strip at xPercent 0 is complete, not
    // frozen mid-gesture. globals.css also kills the (now absent) keyframe.
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const el = track.current;
      if (!el) return;

      const loop = gsap.to(el, {
        xPercent: -50,
        duration: DURATION,
        ease: "none",
        repeat: -1,
      });

      const trigger = ScrollTrigger.create({
        trigger: el,
        // The strip is the only thing on this bar, so its own box is the honest
        // measure of whether any of it is on screen.
        start: "top bottom",
        end: "bottom top",
        onUpdate: (self) => {
          // Direction is deliberately ignored — Math.abs. The strip is a fixed
          // piece of shop signage, not a scroll indicator; reversing it on an
          // upward scroll would make it a readout of the user's input.
          const boost = Math.min(Math.abs(self.getVelocity()) / VELOCITY_REF, 1);
          gsap.to(loop, {
            timeScale: 1 + boost * (MAX_TIMESCALE - 1),
            duration: 0.2,
            overwrite: true,
            // Eases back to 1 on its own: onUpdate stops firing the moment
            // scrolling stops, so nothing would ever reset it otherwise, and the
            // strip would run fast forever after one flick.
            onComplete: () => gsap.to(loop, { timeScale: 1, duration: 0.8, overwrite: true }),
          });
        },
        // The footer is a long way past this bar, and a repeat: -1 tween left
        // running there is a tween the compositor pays for on every frame of a
        // page the strip isn't even on.
        onToggle: (self) => (self.isActive ? loop.play() : loop.pause()),
      });

      return () => {
        trigger.kill();
        loop.kill();
      };
    });

    return () => mm.revert();
  }, []);

  return (
    <div className="marquee-track" ref={track}>
      {items.map((item, i) => (
        <span key={`a${i}`}>{item}</span>
      ))}
      {items.map((item, i) => (
        <span key={`b${i}`} aria-hidden="true">
          {item}
        </span>
      ))}
    </div>
  );
}
