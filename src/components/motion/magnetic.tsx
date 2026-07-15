"use client";

import { useRef, type ReactNode } from "react";
import { gsap, useIsoLayoutEffect } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * Wraps a control so it leans toward the cursor.
 *
 * The whole effect is gated inside the matchMedia query, so on a touch device the
 * listeners are never attached at all — the prototype bound mousemove on every
 * `.magnetic` regardless, and on hybrid devices a stray hover left the button
 * translated with no mouseleave coming to reset it.
 */
export function Magnetic({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const mm = gsap.matchMedia();
    mm.add("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)", () => {
      // quickTo allocates its tween once and then just re-targets it. The
      // prototype's `gsap.to` per mousemove built a fresh tween ~120x/second,
      // each one overwrite-scanning the timeline and then becoming garbage.
      const xTo = gsap.quickTo(el, "x", { duration: 0.4, ease: "power3.out" });
      const yTo = gsap.quickTo(el, "y", { duration: 0.4, ease: "power3.out" });

      let rect = el.getBoundingClientRect();

      const onEnter = () => {
        // Read once per hover, not per move: getBoundingClientRect inside
        // mousemove forces a synchronous layout on every frame of the effect.
        rect = el.getBoundingClientRect();
        gsap.set(el, { willChange: "transform" });
      };
      const onMove = (e: MouseEvent) => {
        xTo((e.clientX - rect.left - rect.width / 2) * 0.25);
        yTo((e.clientY - rect.top - rect.height / 2) * 0.35);
      };
      const onLeave = () => {
        gsap.to(el, {
          x: 0,
          y: 0,
          duration: 0.6,
          ease: "elastic.out(1,0.4)",
          onComplete: () => gsap.set(el, { clearProps: "willChange" }),
        });
      };

      el.addEventListener("mouseenter", onEnter);
      el.addEventListener("mousemove", onMove);
      el.addEventListener("mouseleave", onLeave);

      return () => {
        el.removeEventListener("mouseenter", onEnter);
        el.removeEventListener("mousemove", onMove);
        el.removeEventListener("mouseleave", onLeave);
      };
    });

    return () => mm.revert();
  }, []);

  // inline-block so the wrapper takes the child's box and transforms apply.
  return (
    <span ref={ref} className={cn("inline-block", className)}>
      {children}
    </span>
  );
}
