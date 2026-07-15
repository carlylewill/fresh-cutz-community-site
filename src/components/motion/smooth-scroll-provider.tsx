"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger, prefersReducedMotion } from "@/lib/motion";

type LenisCtx = { lenis: Lenis | null };
const LenisContext = createContext<LenisCtx>({ lenis: null });

/** Lets the preloader stop/start scroll while the loader is up. */
export function useLenis() {
  return useContext(LenisContext).lenis;
}

/**
 * Renders {children} with no wrapper element on purpose: Lenis is constructed
 * without a `wrapper`/`content` option, so it drives window + documentElement.
 * A wrapper div would silently break that.
 */
export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  const [lenis, setLenis] = useState<Lenis | null>(null);
  const refreshed = useRef(false);

  useEffect(() => {
    if (prefersReducedMotion()) return;

    const instance = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    instance.on("scroll", ScrollTrigger.update);

    function raf(time: number) {
      instance.raf(time * 1000);
    }
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    // Route in-page anchor clicks through Lenis so they glide rather than jump.
    function onClick(e: MouseEvent) {
      const anchor = (e.target as HTMLElement).closest("a[href^='#']");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || href === "#") return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      instance.scrollTo(target as HTMLElement, { duration: 1.2 });
    }
    document.addEventListener("click", onClick);
    setLenis(instance);

    return () => {
      document.removeEventListener("click", onClick);
      gsap.ticker.remove(raf);
      instance.destroy();
      setLenis(null);
    };
  }, []);

  // Exactly one refresh, after fonts and images settle. Refreshing per-image
  // would recompute every trigger N times and land mid-scroll.
  useEffect(() => {
    if (refreshed.current) return;
    refreshed.current = true;
    const loaded =
      document.readyState === "complete"
        ? Promise.resolve()
        : new Promise<void>((r) => window.addEventListener("load", () => r(), { once: true }));
    Promise.all([document.fonts.ready, loaded]).then(() => ScrollTrigger.refresh());
  }, []);

  return <LenisContext.Provider value={{ lenis }}>{children}</LenisContext.Provider>;
}
