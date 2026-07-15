"use client";

import { useRef, type ReactNode } from "react";
import Image, { type StaticImageData } from "next/image";
import { gsap, ScrollTrigger, useIsoLayoutEffect } from "@/lib/motion";
import { cn } from "@/lib/utils";

type HairCardProps = {
  src: StaticImageData;
  alt: string;
  title: string;
  tag: string;
  /** Body copy. */
  children?: ReactNode;
  className?: string;
};

/**
 * The card renders its own `reveal` / `data-batch` markers: REVEAL_GRIDS already
 * claims `.hair-grid .hair-card` for the batched pass, so the two have to agree
 * and the marker belongs next to the class the selector matches, not at each
 * call site where it can be forgotten.
 *
 * `.img-clip` / `.hair-card img` from-states live in sections.css.
 */
export function HairCard({ src, alt, title, tag, children, className }: HairCardProps) {
  const card = useRef<HTMLElement>(null);

  useIsoLayoutEffect(() => {
    const el = card.current;
    const img = el?.querySelector("img");
    if (!el || !img) return;

    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      let onEnd: (() => void) | undefined;

      ScrollTrigger.create({
        trigger: el,
        start: "top 70%",
        once: true,
        onEnter: () => {
          // DOCUMENTED EXCEPTION to transform/opacity-only: `filter: grayscale`
          // was explicitly requested — the shot lands mono and the colour bleeds
          // in. It composites on the GPU, runs once per card, and the will-change
          // hint is dropped the moment the transition ends, so no layer lingers.
          img.style.willChange = "filter";
          onEnd = () => {
            img.style.willChange = "";
          };
          img.addEventListener("transitionend", onEnd, { once: true });
          el.classList.add("in-view");
        },
      });

      // Pure transform, and it scrubs every frame the card is on screen — the
      // case where a standing will-change is actually earned. Reverted with mm.
      gsap.set(img, { willChange: "transform" });
      gsap.to(img, {
        scale: 1,
        ease: "none",
        scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true },
      });

      return () => {
        if (onEnd) img.removeEventListener("transitionend", onEnd);
        img.style.willChange = "";
        el.classList.remove("in-view");
      };
    });

    return () => mm.revert();
  }, []);

  return (
    <article
      ref={card}
      className={cn(
        "hair-card reveal border-line bg-ink-soft relative overflow-hidden rounded-[4px] border",
        className,
      )}
      data-anim="card"
      data-batch=""
    >
      <div className="img-clip">
        <Image src={src} alt={alt} sizes="(max-width: 860px) 100vw, 33vw" />
      </div>
      <span className="hc-tag font-mono border-line text-brass-bright bg-ink-deep/80 absolute top-[14px] left-[14px] rounded-xs border px-[10px] py-[6px] text-[10.5px] tracking-[0.2em] uppercase">
        {tag}
      </span>
      <div className="hc-body p-[22px] pb-[26px]">
        <h3 className="font-display text-brass-bright text-[19px] font-semibold tracking-[0.08em] uppercase">
          {title}
        </h3>
        {children ? <p className="text-steel mt-2 text-[14px]">{children}</p> : null}
      </div>
    </article>
  );
}
