"use client";

import { gsap, useIsoLayoutEffect } from "@/lib/motion";
import "./flourish.css";

/**
 * Hovering a service ticket cuts it out. Scissors travel clockwise around the
 * card's edge, leaving a dashed brass cut behind them; on the way out the comb
 * crawls back the other way and the solid border returns behind it.
 *
 * The perimeter, not a line across the top: these cards are ticket stubs, and
 * cutting round the edge is what you do to a ticket. It also reuses the site's
 * grammar — the blade cuts, the comb puts it back, same as the hero.
 *
 * Sequenced rather than simultaneous. Two tools chasing each other around a
 * 300px card at once reads as clutter; cut-on-enter / mend-on-leave gives each
 * one a job and makes leaving the card an event rather than an absence.
 *
 * Mounted once at the root and attached by selector, so it needs no markup from
 * services.tsx and no rules in sections.css — it cannot collide with work in
 * either. The overlay is injected on first hover, not rendered for eight cards
 * that may never be touched.
 *
 * Desktop pointers only via gsap.matchMedia: on touch there is no hover, so this
 * would either never fire or fire on tap and fight the link. Reduced motion keeps
 * the brass glow and nothing else.
 */

/** Walk a tool clockwise around the card's inset perimeter. */
function placeOnPerimeter(el: HTMLElement, card: HTMLElement, t: number, inset = 6) {
  const w = card.clientWidth - inset * 2;
  const h = card.clientHeight - inset * 2;
  const per = 2 * (w + h);
  let d = (t % 1) * per;
  let x: number, y: number, angle: number;

  if (d < w) {
    x = d;
    y = 0;
    angle = 0;
  } else if ((d -= w) < h) {
    x = w;
    y = d;
    angle = 90;
  } else if ((d -= h) < w) {
    x = w - d;
    y = h;
    angle = 180;
  } else {
    d -= w;
    x = 0;
    y = h - d;
    angle = 270;
  }
  gsap.set(el, { x: x + inset, y: y + inset, rotate: angle });
}

/**
 * The barber cards get the same perimeter cut, but with the tool each one's own
 * copy describes:
 *
 *   Baggio  — razor. His card says "detail after detail", and cutting.jpg is him
 *             doing edge-up work with a trimmer. The razor is the detail tool.
 *   Rahul   — scissors AND comb together, running the seam in tandem the way you
 *             actually cut scissor-over-comb. His copy says "careful scissor
 *             work"; his tag says "Scissor cuts".
 *
 * Deliberately keyed off `data-tool`, which is derived from each barber's
 * description — NOT from anything about the barber. The site's headline is
 * "Every hair type. One chair." and Baggio's own tags list all four textures;
 * assigning tools by anything other than the stated craft would contradict the
 * page it sits on.
 */
const SCISSORS_SVG = `
  <svg class="tk-tool tk-scissors" viewBox="0 0 100 100" fill="none">
    <g class="tk-blade-a">
      <path d="M20 44 L86 50" stroke="currentColor" stroke-width="6" stroke-linecap="round"/>
      <circle cx="14" cy="40" r="9" stroke="currentColor" stroke-width="6"/>
    </g>
    <g class="tk-blade-b">
      <path d="M20 56 L86 50" stroke="currentColor" stroke-width="6" stroke-linecap="round"/>
      <circle cx="14" cy="60" r="9" stroke="currentColor" stroke-width="6"/>
    </g>
  </svg>`;

const COMB_SVG = `
  <svg class="tk-tool tk-comb" viewBox="0 0 100 100" fill="none">
    <path d="M18 34 H82 V44 H18 Z" stroke="currentColor" stroke-width="6" stroke-linejoin="round"/>
    <path d="M24 44 V70 M34 44 V70 M44 44 V70 M54 44 V70 M64 44 V70 M74 44 V70"
          stroke="currentColor" stroke-width="4.5" stroke-linecap="round"/>
  </svg>`;

const RAZOR_SVG = `
  <svg class="tk-tool tk-razor" viewBox="0 0 100 100" fill="none">
    <path class="tk-razor-blade" d="M16 58 L74 34 L82 44 L24 68 Z"
          stroke="currentColor" stroke-width="5" stroke-linejoin="round"/>
    <path d="M22 66 L12 78" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>
    <circle cx="12" cy="80" r="4" stroke="currentColor" stroke-width="4"/>
  </svg>`;

const EDGE_SVG = `
  <svg class="tk-edge" preserveAspectRatio="none" viewBox="0 0 100 100">
    <rect class="tk-cut" x="0.6" y="0.6" width="98.8" height="98.8" rx="1.6"
          pathLength="100" vector-effect="non-scaling-stroke"/>
  </svg>`;

const barberFx = (isRazor: boolean) =>
  `<span class="tk-fx" aria-hidden="true">${EDGE_SVG}${isRazor ? RAZOR_SVG : SCISSORS_SVG + COMB_SVG}</span>`;

/**
 * Service tickets: scissors cut round, comb mends on the way out.
 * `pathLength="100"` on the rect normalises the perimeter, so the same dash
 * numbers work on every card at every breakpoint without measuring anything.
 */
const FX = `<span class="tk-fx" aria-hidden="true">${EDGE_SVG}${SCISSORS_SVG}${COMB_SVG}</span>`;

export function TicketSnip() {
  useIsoLayoutEffect(() => {
    const mm = gsap.matchMedia();

    mm.add("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)", () => {
      const cards = gsap.utils.toArray<HTMLElement>(".ticket");
      const built = new Map<HTMLElement, { cut: gsap.core.Timeline; mend: gsap.core.Timeline }>();

      const build = (card: HTMLElement) => {
        card.insertAdjacentHTML("beforeend", FX);
        const fx = card.querySelector<HTMLElement>(".tk-fx")!;
        const cut = fx.querySelector<SVGRectElement>(".tk-cut")!;
        const scissors = fx.querySelector<HTMLElement>(".tk-scissors")!;
        const comb = fx.querySelector<HTMLElement>(".tk-comb")!;
        const a = fx.querySelector(".tk-blade-a");
        const b = fx.querySelector(".tk-blade-b");

        // The dash draws from the same 0 point the tools start from, so the cut
        // appears under the blades rather than merely near them.
        const p = { t: 0 };

        const cutTl = gsap
          .timeline({ paused: true })
          .set([scissors], { opacity: 1 })
          .set(cut, { strokeDashoffset: 100 })
          .to(
            p,
            {
              t: 1,
              duration: 0.85,
              ease: "power1.inOut",
              onUpdate: () => {
                placeOnPerimeter(scissors, card, p.t);
                gsap.set(cut, { strokeDashoffset: 100 - p.t * 100 });
              },
            },
            0,
          )
          // Blades buzz the whole way round rather than snipping once — a single
          // snip on an 0.85s traverse reads as a glitch.
          .to(
            a,
            { rotate: -15, transformOrigin: "26px 50px", duration: 0.085, yoyo: true, repeat: 9 },
            0,
          )
          .to(
            b,
            { rotate: 15, transformOrigin: "26px 50px", duration: 0.085, yoyo: true, repeat: 9 },
            0,
          )
          .to(scissors, { opacity: 0, duration: 0.12 }, 0.78);

        const q = { t: 0 };
        const mendTl = gsap
          .timeline({ paused: true })
          .set(comb, { opacity: 1 })
          .to(
            q,
            {
              t: 1,
              duration: 0.7,
              ease: "power2.out",
              onUpdate: () => {
                // Anticlockwise from where the scissors finished: the comb
                // retraces the cut rather than making a second lap of its own.
                placeOnPerimeter(comb, card, 1 - q.t);
                gsap.set(cut, { strokeDashoffset: -q.t * 100 });
              },
            },
            0,
          )
          .to(comb, { opacity: 0, duration: 0.12 }, 0.62);

        const rec = { cut: cutTl, mend: mendTl };
        built.set(card, rec);
        return rec;
      };

      const enter = (e: Event) => {
        const card = e.currentTarget as HTMLElement;
        const rec = built.get(card) ?? build(card);
        rec.mend.pause(0);
        rec.cut.restart();
      };

      const leave = (e: Event) => {
        const card = e.currentTarget as HTMLElement;
        const rec = built.get(card);
        if (!rec) return;
        rec.cut.pause();
        rec.mend.restart();
      };

      /**
       * Barber cards: same perimeter walk, tool chosen by `data-tool`.
       * `razor` runs one blade round with a slight rocking cant, as a razor is
       * held. `scissors-comb` runs both tools together, the comb a step ahead of
       * the blades — scissor-over-comb, which is the actual technique, not two
       * icons sharing a path.
       */
      const barbers = gsap.utils.toArray<HTMLElement>(".barber");
      const barberTl = new Map<HTMLElement, gsap.core.Timeline>();

      const buildBarber = (card: HTMLElement) => {
        const isRazor = card.dataset.tool === "razor";
        card.insertAdjacentHTML("beforeend", barberFx(isRazor));
        const fx = card.querySelector<HTMLElement>(".tk-fx")!;
        const cut = fx.querySelector<SVGRectElement>(".tk-cut")!;
        const tools = Array.from(fx.querySelectorAll<HTMLElement>(".tk-tool"));
        const blade = fx.querySelector(".tk-razor-blade");
        const a = fx.querySelector(".tk-blade-a");
        const b = fx.querySelector(".tk-blade-b");
        const comb = fx.querySelector<HTMLElement>(".tk-comb");
        const scissors = fx.querySelector<HTMLElement>(".tk-scissors");

        const p = { t: 0 };
        const tl = gsap
          .timeline({ paused: true })
          .set(tools, { opacity: 1 })
          .set(cut, { strokeDashoffset: 100 })
          .to(
            p,
            {
              t: 1,
              duration: 0.95,
              ease: "power1.inOut",
              onUpdate: () => {
                if (isRazor) {
                  placeOnPerimeter(tools[0], card, p.t);
                } else {
                  // The comb leads by 4% of the lap; the scissors work behind it.
                  placeOnPerimeter(comb!, card, p.t + 0.04);
                  placeOnPerimeter(scissors!, card, p.t);
                }
                gsap.set(cut, { strokeDashoffset: 100 - p.t * 100 });
              },
            },
            0,
          );

        if (isRazor) {
          // A razor is rocked, not opened and shut.
          tl.to(
            blade,
            { rotate: -7, transformOrigin: "50px 50px", duration: 0.16, yoyo: true, repeat: 10 },
            0,
          );
        } else {
          tl.to(
            a,
            { rotate: -15, transformOrigin: "26px 50px", duration: 0.09, yoyo: true, repeat: 9 },
            0,
          ).to(
            b,
            { rotate: 15, transformOrigin: "26px 50px", duration: 0.09, yoyo: true, repeat: 9 },
            0,
          );
        }
        tl.to(tools, { opacity: 0, duration: 0.14 }, 0.86);

        barberTl.set(card, tl);
        return tl;
      };

      const barberEnter = (e: Event) => {
        const card = e.currentTarget as HTMLElement;
        (barberTl.get(card) ?? buildBarber(card)).restart();
      };

      cards.forEach((c) => {
        c.addEventListener("mouseenter", enter);
        c.addEventListener("mouseleave", leave);
      });
      barbers.forEach((c) => c.addEventListener("mouseenter", barberEnter));

      return () => {
        barbers.forEach((c) => c.removeEventListener("mouseenter", barberEnter));
        barberTl.forEach((t) => t.kill());
        cards.forEach((c) => {
          c.removeEventListener("mouseenter", enter);
          c.removeEventListener("mouseleave", leave);
        });
        built.forEach((r) => {
          r.cut.kill();
          r.mend.kill();
        });
        // The markup is ours; leaving it behind would strand transformed nodes
        // if reduced motion is switched on mid-session.
        document.querySelectorAll(".tk-fx").forEach((n) => n.remove());
      };
    });

    return () => mm.revert();
  }, []);

  return null;
}
