"use client";

import Image from "next/image";
import { useRef } from "react";
import { gsap, useIsoLayoutEffect } from "@/lib/motion";
import { cn } from "@/lib/utils";

export type RevealVariant = "clip" | "greyscale";

type RevealImageProps = {
  /** A path from MEDIA. */
  src: string;
  alt: string;
  /** Box shape, from MEDIA.<asset>.ratio — or a crop of your choosing. */
  ratio: number;
  variant?: RevealVariant;
  /** Required on purpose — see SIZES in src/lib/media.ts. */
  sizes: string;
  className?: string;
};

type Spec = {
  from: gsap.TweenVars;
  to: gsap.TweenVars;
  willChange: string;
  duration: number;
  ease: string;
};

/*
 * DOCUMENTED EXCEPTION to transform/opacity-only, on the same terms as the
 * razor's strokeDashoffset and .hair-card's grayscale:
 *
 * `clip-path` — there is no transform that wipes an image open from its own
 * edge; a transformed mask element would have to be a second box tracking the
 * first through the parallax. clip-path composites on the GPU and triggers
 * paint, not layout, so nothing below it re-measures and no ScrollTrigger is
 * invalidated. `filter: grayscale` is the device already established in
 * .hair-card. Both run once per element and drop their layer on complete.
 */
const TWEEN: Record<RevealVariant, Spec> = {
  clip: {
    from: { clipPath: "inset(0% 0% 100% 0%)" },
    to: { clipPath: "inset(0% 0% 0% 0%)" },
    willChange: "clip-path",
    duration: 1.1,
    ease: "power3.out",
  },
  greyscale: {
    from: { filter: "grayscale(1)" },
    to: { filter: "grayscale(0)" },
    willChange: "filter",
    duration: 1.2,
    ease: "power2.out",
  },
};

/**
 * An image that reveals itself once, on scroll.
 *
 * The from-state is set in JS, not CSS, unlike `.reveal`. That choice is what
 * makes reduced motion and no-JS both correct for free: the natural state of the
 * markup is the finished one — fully revealed, full colour — so anything that
 * doesn't run the tween lands there rather than on a half-erased image. This is
 * only safe under useIsoLayoutEffect, which arms the from-state before paint.
 */
export function RevealImage({
  src,
  alt,
  ratio,
  variant = "clip",
  sizes,
  className,
}: RevealImageProps) {
  const root = useRef<HTMLDivElement>(null);

  useIsoLayoutEffect(() => {
    const el = root.current;
    const img = el?.querySelector("img");
    if (!el || !img) return;

    // Scoped matchMedia is a gsap.Context: revert() undoes the tweens, the
    // inline from-state and the ScrollTrigger together, and it re-runs live if
    // the OS setting is toggled.
    const mm = gsap.matchMedia(root);

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const spec = TWEEN[variant];
      gsap.fromTo(img, spec.from, {
        ...spec.to,
        duration: spec.duration,
        ease: spec.ease,
        scrollTrigger: { trigger: el, start: "top 82%", once: true },
        onStart: () => gsap.set(img, { willChange: spec.willChange }),
        onComplete: () => gsap.set(img, { clearProps: "willChange" }),
      });
    });

    return () => mm.revert();
  }, [variant]);

  return (
    <div
      ref={root}
      className={cn("relative overflow-hidden", className)}
      // Reserves the box before decode; per-asset data, so it can't be a utility.
      style={{ aspectRatio: ratio }}
    >
      {/* No `priority`: every one of these is below the fold, and a second
          preload would compete with the hero poster that is the actual LCP. */}
      <Image src={src} alt={alt} fill sizes={sizes} className="object-cover" />
    </div>
  );
}
