"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useLoaderDone } from "@/components/motion/loader-gate";
import { getScroller } from "@/lib/motion";
import "./nav.css";

const LINKS: [string, string][] = [
  ["#hair", "Hair Types"],
  ["#services", "Services"],
  ["#barbers", "Barbers"],
  ["#reviews", "Reviews"],
  ["#visit", "Visit"],
];

export function Nav() {
  const loaderDone = useLoaderDone();
  const [scrolled, setScrolled] = useState(false);
  const bar = useRef<HTMLElement>(null);
  // Mounted from the root layout, which has no route knowledge. The /booking
  // pages are token-scoped one-page flows and have never carried the site nav.
  const onSite = usePathname() === "/";

  useEffect(() => {
    // #scroller scrolls now, not the window — window "scroll" would never fire
    // and the bar would be stuck in its transparent top state forever. See the
    // app-shell note in globals.css.
    const el = getScroller();
    if (!el) return;
    const onScroll = () => setScrolled(el.scrollTop > 40);
    onScroll();
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [onSite]);

  /**
   * Publish the bar's measured height as --nav-h on <html>.
   *
   * Load-bearing, not informational: the header is no longer an overlay, so it
   * eats real height out of the scrolling box. Anything that wants to be exactly
   * one scroller-viewport tall has to subtract it — `100svh` inside #scroller
   * now overflows by precisely this number. Measured rather than hardcoded
   * because the bar's padding is `max(18px, env(safe-area-inset-top))`, which
   * differs between a notched phone, a flat one and a desktop.
   */
  useEffect(() => {
    const el = bar.current;
    const root = document.documentElement;
    if (!el) {
      root.style.removeProperty("--nav-h");
      return;
    }
    // offsetHeight, not entry.contentRect.height: contentRect is the CONTENT
    // box, and this bar's whole variable part is padding
    // (`max(18px, env(safe-area-inset-top))` plus 18px below). Measuring the
    // content box would under-report by ~36px on every device and put every
    // full-height section back into overflow.
    const publish = () => root.style.setProperty("--nav-h", `${el.offsetHeight}px`);
    publish();
    const ro = new ResizeObserver(publish);
    ro.observe(el);
    return () => {
      ro.disconnect();
      root.style.removeProperty("--nav-h");
    };
  }, [onSite]);

  if (!onSite) return null;

  return (
    /*
     * NOT fixed, NOT sticky, and no z-index race with the page — deliberately.
     * This is an ordinary flex child of <body>, sitting OUTSIDE #scroller, which
     * is the only arrangement iOS Safari cannot paint content above while its
     * URL bar collapses. The full reasoning is in globals.css; the short version
     * is that a fixed bar and the URL bar are moved by different agents, so no
     * amount of covering can keep them welded together.
     *
     * `position: relative` + z-index 50 only so the bar paints over the
     * scroller's own fixed overlays (the shear panels at 40, the cut at 41).
     *
     * The prototype's backdrop-filter: blur(8px) is deliberately dropped. It
     * forces the compositor to re-blur a full-width bar every scroll frame, and
     * `.scrolled` already paints a near-opaque background over it — so it cost a
     * repaint per frame to produce an effect nothing could see.
     *
     * Slides in off the loader rather than off a hardcoded delay, so retiming
     * the preloader can't desync it.
     */
    <header
      ref={bar}
      className={`nav-bar ease-shear relative z-50 flex flex-none items-center justify-between px-[clamp(20px,4vw,48px)] pb-[18px] transition-[background,transform,border-color] duration-400 ${
        scrolled ? "border-line bg-ink-deep/92 border-b" : "nav-top border-b border-transparent"
      } ${loaderDone ? "translate-y-0" : "-translate-y-full"}`}
    >
      <a className="flex min-h-[44px] items-center gap-3" href="#top">
        <Image
          src="/logo.svg"
          alt="Fresh Cutz logo"
          width={38}
          height={38}
          className="rounded-full"
        />
        <span className="font-display text-sm font-semibold tracking-[0.18em] uppercase">
          Fresh Cutz
        </span>
      </a>

      {/* The <nav> is the link list, now that the bar itself is the <header>. */}
      <nav className="font-mono hidden gap-7 text-xs tracking-[0.12em] uppercase md:flex">
        {LINKS.map(([href, label]) => (
          <a
            key={href}
            href={href}
            className="text-steel hover:text-brass-bright transition-colors duration-250"
          >
            {label}
          </a>
        ))}
      </nav>

      <a
        className="font-display text-ink bg-brass hover:bg-brass-bright inline-flex min-h-[44px] items-center rounded-xs px-[22px] py-3 text-xs font-semibold tracking-[0.22em] uppercase transition-colors duration-250"
        href="#book"
      >
        Book a Chair
      </a>
    </header>
  );
}
