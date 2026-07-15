"use client";

import { useRef } from "react";
import { gsap, ScrollTrigger, useIsoLayoutEffect } from "@/lib/motion";
import { cn } from "@/lib/utils";

type CounterProps = {
  to: number;
  decimals?: number;
  className?: string;
};

/**
 * The FINAL value is what renders on the server. The prototype shipped `0.0` in
 * the HTML and depended on JS to make it true — so no-JS, a hydration-time crash,
 * or an ad blocker eating the bundle all left "★ 0.0 · 0 Google reviews" on the
 * page, which is a false claim about the business, not just a missing animation.
 *
 * The zeroing happens in a layout effect, i.e. before paint, so there is no flash
 * of the real number first.
 */
export function Counter({ to, decimals = 0, className }: CounterProps) {
  const el = useRef<HTMLSpanElement>(null);
  const final = to.toFixed(decimals);

  useIsoLayoutEffect(() => {
    const node = el.current;
    if (!node) return;

    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const proxy = { v: 0 };
      const write = () => {
        node.textContent = proxy.v.toFixed(decimals);
      };
      write();

      ScrollTrigger.create({
        trigger: node,
        start: "top 90%",
        once: true,
        onEnter: () =>
          // Tween a proxy and write through the ref. Driving this with state would
          // re-render the hero ~96 times over 1.6s.
          gsap.to(proxy, { v: to, duration: 1.6, ease: "power2.out", onUpdate: write }),
      });

      // Runs on unmount and when reduce is switched on mid-count.
      return () => {
        node.textContent = final;
      };
    });

    return () => mm.revert();
  }, [to, decimals, final]);

  return (
    <span
      ref={el}
      className={cn("inline-block tabular-nums", className)}
      // 0 -> 106 changes digit count. tabular-nums stops the digits themselves
      // jittering; the min-width stops the whole rating row reflowing as the
      // string grows. Reserving the final string's width is the only value that
      // is never exceeded.
      style={{ minWidth: `${final.length}ch` }}
    >
      {final}
    </span>
  );
}
