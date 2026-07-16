"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useLoaderDone } from "@/components/motion/loader-gate";

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

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    /*
     * The prototype's backdrop-filter: blur(8px) is deliberately dropped. It
     * forces the compositor to re-blur a full-width fixed bar every scroll
     * frame, and `.scrolled` already paints a near-opaque background over it —
     * so it cost a repaint per frame to produce an effect nothing could see.
     *
     * Slides in off the loader rather than off a hardcoded delay, so retiming
     * the preloader can't desync it.
     */
    <nav
      className={`ease-shear fixed inset-x-0 top-0 z-60 flex items-center justify-between px-[clamp(20px,4vw,48px)] py-[18px] transition-[background,transform,border-color] duration-400 ${
        scrolled ? "border-line bg-ink-deep/92 border-b" : "border-b border-transparent"
      } ${loaderDone ? "translate-y-0" : "-translate-y-full"}`}
      style={
        scrolled
          ? undefined
          : { background: "linear-gradient(rgba(14,16,20,.85), rgba(14,16,20,0))" }
      }
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

      <div className="font-mono hidden gap-7 text-xs tracking-[0.12em] uppercase md:flex">
        {LINKS.map(([href, label]) => (
          <a
            key={href}
            href={href}
            className="text-steel hover:text-brass-bright transition-colors duration-250"
          >
            {label}
          </a>
        ))}
      </div>

      <a
        className="font-display text-ink bg-brass hover:bg-brass-bright inline-flex min-h-[44px] items-center rounded-xs px-[22px] py-3 text-xs font-semibold tracking-[0.22em] uppercase transition-colors duration-250"
        href="#book"
      >
        Book a Chair
      </a>
    </nav>
  );
}
