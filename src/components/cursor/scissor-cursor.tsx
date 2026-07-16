"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/motion";
import "./cursor.css";

/**
 * The pointer is a pair of scissors, and it snips when it's over something you
 * can act on. On the service tickets it also drops a few clippings.
 *
 * Lives in its own directory rather than components/motion so it can't collide
 * with the cut choreography, and brings its own CSS for the same reason.
 *
 * Gated on `(pointer: fine)` AND no-reduced-motion via gsap.matchMedia, so the
 * listeners are never attached on touch — a custom cursor on a phone is dead
 * weight at best, and `cursor: none` on a device with no cursor is a trap.
 * matchMedia (not a one-shot boolean) means plugging in a mouse or toggling the
 * OS setting takes effect without a reload.
 */

const SNIP_TARGET = ".ticket, .hair-card, .chip, .btn-primary, a, button";
const CLIPPING_TARGET = ".ticket";

export function ScissorCursor() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mm = gsap.matchMedia();

    mm.add("(pointer: fine) and (prefers-reduced-motion: no-preference)", () => {
      const el = root.current;
      if (!el) return;
      const top = el.querySelector(".sc-blade-top");
      const bot = el.querySelector(".sc-blade-bot");
      if (!top || !bot) return;

      document.documentElement.classList.add("has-scissor-cursor");
      gsap.set(el, { opacity: 0 });

      // quickTo, not gsap.to per event: a fresh tween on every mousemove is a
      // new object 60-120x a second, all of it garbage. This reuses one.
      const x = gsap.quickTo(el, "x", { duration: 0.09, ease: "power3" });
      const y = gsap.quickTo(el, "y", { duration: 0.09, ease: "power3" });
      // The blade angle trails the pointer slightly, so the scissors lead with
      // their tip as they travel rather than sliding sideways.
      const rot = gsap.quickTo(el, "rotate", { duration: 0.5, ease: "power3" });

      let lastX = 0;
      let shown = false;
      let snipping: gsap.core.Timeline | null = null;

      const move = (e: MouseEvent) => {
        x(e.clientX);
        y(e.clientY);
        const dx = e.clientX - lastX;
        lastX = e.clientX;
        rot(gsap.utils.clamp(-14, 14, dx * 0.9));
        if (!shown) {
          shown = true;
          gsap.to(el, { opacity: 1, duration: 0.25 });
        }
      };

      const startSnip = () => {
        if (snipping) return;
        snipping = gsap
          .timeline({ repeat: -1, repeatDelay: 0.16 })
          .to(top, {
            rotate: -13,
            transformOrigin: "26px 50px",
            duration: 0.11,
            yoyo: true,
            repeat: 1,
          })
          .to(
            bot,
            { rotate: 13, transformOrigin: "26px 50px", duration: 0.11, yoyo: true, repeat: 1 },
            0,
          );
      };

      const stopSnip = () => {
        snipping?.kill();
        snipping = null;
        gsap.to([top, bot], { rotate: 0, duration: 0.25, ease: "power2.out" });
      };

      /** A few clippings fall from the blades. Pure transform/opacity, removed on complete. */
      const drop = (cx: number, cy: number) => {
        for (let i = 0; i < 3; i++) {
          const hair = document.createElement("span");
          hair.className = "sc-clipping";
          hair.style.left = `${cx + gsap.utils.random(-7, 7)}px`;
          hair.style.top = `${cy + 6}px`;
          document.body.appendChild(hair);
          gsap.to(hair, {
            y: gsap.utils.random(34, 66),
            x: gsap.utils.random(-16, 16),
            rotate: gsap.utils.random(-140, 140),
            opacity: 0,
            duration: gsap.utils.random(0.5, 0.85),
            ease: "power2.in",
            onComplete: () => hair.remove(),
          });
        }
      };

      let dropper: number | undefined;
      const over = (e: MouseEvent) => {
        const t = e.target as HTMLElement;
        if (t.closest(SNIP_TARGET)) {
          startSnip();
          gsap.to(el, { scale: 1.18, duration: 0.25 });
          if (t.closest(CLIPPING_TARGET) && dropper === undefined) {
            dropper = window.setInterval(() => {
              const r = el.getBoundingClientRect();
              drop(r.left + r.width / 2, r.top + r.height / 2);
            }, 190);
          }
        }
      };

      const out = (e: MouseEvent) => {
        if (!(e.target as HTMLElement).closest(SNIP_TARGET)) return;
        stopSnip();
        gsap.to(el, { scale: 1, duration: 0.25 });
        if (dropper !== undefined) {
          clearInterval(dropper);
          dropper = undefined;
        }
      };

      // Hide when the pointer leaves the window, or the scissors hang at the edge.
      const leave = () => {
        shown = false;
        gsap.to(el, { opacity: 0, duration: 0.2 });
      };

      window.addEventListener("mousemove", move, { passive: true });
      document.addEventListener("mouseover", over);
      document.addEventListener("mouseout", out);
      document.addEventListener("mouseleave", leave);

      return () => {
        window.removeEventListener("mousemove", move);
        document.removeEventListener("mouseover", over);
        document.removeEventListener("mouseout", out);
        document.removeEventListener("mouseleave", leave);
        if (dropper !== undefined) clearInterval(dropper);
        snipping?.kill();
        document.documentElement.classList.remove("has-scissor-cursor");
        document.querySelectorAll(".sc-clipping").forEach((n) => n.remove());
      };
    });

    return () => mm.revert();
  }, []);

  // Rendered unconditionally so there is no hydration branch; matchMedia decides
  // whether it ever becomes visible. aria-hidden — it is pure decoration and the
  // real pointer semantics are unchanged.
  return (
    <div ref={root} className="sc-cursor" aria-hidden>
      <svg viewBox="0 0 100 100" fill="none">
        <g className="sc-blade-top">
          <path d="M20 44 L86 50" stroke="#E7CE6E" strokeWidth="5" strokeLinecap="round" />
          <circle cx="14" cy="40" r="9" stroke="#E7CE6E" strokeWidth="5" />
        </g>
        <g className="sc-blade-bot">
          <path d="M20 56 L86 50" stroke="#C7A83B" strokeWidth="5" strokeLinecap="round" />
          <circle cx="14" cy="60" r="9" stroke="#C7A83B" strokeWidth="5" />
        </g>
        <circle cx="26" cy="50" r="3" fill="#F2ECE1" />
      </svg>
    </div>
  );
}
