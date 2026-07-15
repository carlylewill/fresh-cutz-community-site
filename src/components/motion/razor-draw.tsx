"use client";

import { useRef } from "react";
import { gsap, useIsoLayoutEffect } from "@/lib/motion";
import { useLoaderDone } from "./loader-gate";

/**
 * The hero razor, drawn on once the loader clears.
 *
 * DOCUMENTED EXCEPTION to transform/opacity-only: this animates
 * `strokeDashoffset`. There is no transform-based way to progressively draw a
 * curved stroke, and the alternatives (clip-path sweep, mask) can't follow the
 * blade's spine. It's four short paths in a `pointer-events: none` layer that
 * runs once, so the repaint cost is bounded and off the interaction path.
 *
 * Timing comes from useLoaderDone(), not the prototype's `delay: 3.4` — that
 * number was a hand-copy of the loader's length and desyncs the moment the
 * loader is retimed (it now runs ~1.5s).
 */
export function RazorDraw() {
  const root = useRef<HTMLDivElement>(null);
  const done = useLoaderDone();

  // useIsoLayoutEffect, not useEffect: getTotalLength() needs layout, and returns
  // 0 on a display:none element.
  useIsoLayoutEffect(() => {
    if (!done) return;

    const mm = gsap.matchMedia(root);
    mm.add(
      {
        play: "(prefers-reduced-motion: no-preference)",
        reduce: "(prefers-reduced-motion: reduce)",
      },
      (ctx) => {
        const paths = gsap.utils.toArray<SVGGeometryElement>(".razor-stroke");
        // Fallback for jsdom/older engines where getTotalLength is missing; 1000
        // over-runs the real length, which just means the draw finishes early.
        const lengths = paths.map((p) =>
          typeof p.getTotalLength === "function" ? p.getTotalLength() || 1000 : 1000,
        );

        // Final state first, so reduced motion is a fully drawn razor and never a
        // half-erased one.
        gsap.set(paths, { strokeDasharray: (i: number) => lengths[i], strokeDashoffset: 0 });
        if (ctx.conditions?.reduce) return;

        gsap.set(paths, { strokeDashoffset: (i: number) => lengths[i] });
        gsap.to(paths, {
          strokeDashoffset: 0,
          duration: 2.2,
          ease: "power2.inOut",
          stagger: 0.12,
        });
      },
    );

    return () => mm.revert();
  }, [done]);

  return (
    <div id="razor-wrap" ref={root} aria-hidden="true">
      <svg viewBox="0 0 520 200" fill="none">
        <path
          className="razor-stroke"
          d="M30 150 C 60 120, 120 96, 190 88 L 396 66 C 410 64, 422 70, 424 82 L 428 104 C 430 116, 422 126, 408 128 L 202 150 C 160 154, 100 162, 60 172 C 44 176, 30 166, 30 150 Z"
        />
        <path
          className="razor-stroke"
          d="M396 66 L 442 30 C 452 22, 468 22, 476 32 C 484 42, 482 56, 472 64 L 428 104"
          opacity=".85"
        />
        <path className="razor-stroke" d="M198 92 L 402 70" opacity=".6" />
        <circle className="razor-stroke" cx="452" cy="46" r="5" />
      </svg>
    </div>
  );
}
