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

/**
 * Distance from the card's edge that the cut line and the tools both ride, in px.
 *
 * Not decorative — load-bearing. `.ticket` and `.barber` are both
 * `overflow: hidden` (the barber cards need it for their oversized initial), so
 * anything centred on the true border has half its width clipped away. At the
 * previous 6px inset a 24px tool showed a 6px sliver, which is why the line
 * appeared to travel on its own. This must stay >= half the tool's width.
 */
const RIDE_INSET = 16;

/** Walk a tool clockwise around the card's inset perimeter. */
function placeOnPerimeter(el: HTMLElement, card: HTMLElement, t: number, inset = RIDE_INSET) {
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

// Trimmer, not a straight razor: cutting.jpg is Baggio working with clippers,
// so this is the tool he actually uses. The body is the handle; the blade group
// is the fine cutting head that gets the buzz.
const TRIMMER_SVG = `
  <svg class="tk-tool tk-trimmer" viewBox="0 0 100 100" fill="none">
    <rect x="30" y="24" width="40" height="46" rx="7"
          stroke="currentColor" stroke-width="5"/>
    <line x1="42" y1="36" x2="42" y2="58" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/>
    <line x1="58" y1="36" x2="58" y2="58" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/>
    <g class="tk-trimmer-head">
      <rect x="34" y="70" width="32" height="9" rx="2" stroke="currentColor" stroke-width="4"/>
      <line x1="39" y1="79" x2="39" y2="84" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
      <line x1="47" y1="79" x2="47" y2="84" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
      <line x1="53" y1="79" x2="53" y2="84" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
      <line x1="61" y1="79" x2="61" y2="84" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
    </g>
  </svg>`;

const EDGE_SVG = `
  <svg class="tk-edge" preserveAspectRatio="none" viewBox="0 0 100 100">
    <rect class="tk-cut" x="0.6" y="0.6" width="98.8" height="98.8" rx="1.6"
          pathLength="100" vector-effect="non-scaling-stroke"/>
  </svg>`;

const barberFx = (isRazor: boolean) =>
  `<span class="tk-fx" aria-hidden="true">${EDGE_SVG}${isRazor ? TRIMMER_SVG : SCISSORS_SVG + COMB_SVG}</span>`;

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
      const built = new Map<
        HTMLElement,
        {
          cut: gsap.core.Timeline;
          mend: gsap.core.Timeline;
          buzz: gsap.core.Timeline;
          scissors: HTMLElement;
        }
      >();

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

        // Loops for as long as the pointer is on the card: the tool keeps
        // working rather than doing one lap and abandoning it. `ease: "none"` so
        // the seam between laps is invisible — any easing would make the blade
        // decelerate into the corner it started at and give the loop a seam.
        /*
         * The lap and the buzz are SEPARATE timelines on purpose. An
         * infinitely-repeating child gives its parent an infinite duration, so
         * the parent's own `repeat: -1` can never fire — the lap would run once
         * and park in the corner while the blades kept chattering. Keep the
         * repeating timeline's children finite and drive the buzz alongside it.
         */
        const buzz = gsap
          .timeline({ paused: true, repeat: -1, yoyo: true })
          .to(a, { rotate: -15, transformOrigin: "26px 50px", duration: 0.13 }, 0)
          .to(b, { rotate: 15, transformOrigin: "26px 50px", duration: 0.13 }, 0);

        // ease: "none" so the seam between laps is invisible — any easing would
        // decelerate the blade into the corner it is about to leave from.
        const cutTl = gsap.timeline({ paused: true, repeat: -1 }).to(p, {
          t: 1,
          // A calm lap: slow enough to read as a tool working an edge, not a
          // light chasing the border. ~2.4s for a full circuit.
          duration: 3.2,
          ease: "none",
          onUpdate: () => {
            placeOnPerimeter(scissors, card, p.t);
            gsap.set(cut, { strokeDashoffset: 100 - p.t * 100 });
          },
        });

        const q = { t: 0 };
        const mendTl = gsap
          .timeline({ paused: true })
          .set(comb, { opacity: 1 })
          .to(
            q,
            {
              t: 1,
              duration: 1.4,
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

        const rec = { cut: cutTl, mend: mendTl, buzz, scissors };
        built.set(card, rec);
        return rec;
      };

      const enter = (e: Event) => {
        const card = e.currentTarget as HTMLElement;
        const rec = built.get(card) ?? build(card);
        rec.mend.pause(0);
        gsap.set(rec.scissors, { opacity: 1 });
        rec.cut.restart();
        rec.buzz.play();
      };

      const leave = (e: Event) => {
        const card = e.currentTarget as HTMLElement;
        const rec = built.get(card);
        if (!rec) return;
        rec.cut.pause();
        rec.buzz.pause();
        gsap.set(rec.scissors, { opacity: 0 });
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
      const barberRec = new Map<
        HTMLElement,
        { tl: gsap.core.Timeline; buzz: gsap.core.Timeline; tools: HTMLElement[] }
      >();

      const buildBarber = (card: HTMLElement) => {
        const isRazor = card.dataset.tool === "razor";
        card.insertAdjacentHTML("beforeend", barberFx(isRazor));
        const fx = card.querySelector<HTMLElement>(".tk-fx")!;
        const cut = fx.querySelector<SVGRectElement>(".tk-cut")!;
        const tools = Array.from(fx.querySelectorAll<HTMLElement>(".tk-tool"));
        const head = fx.querySelector(".tk-trimmer-head");
        const a = fx.querySelector(".tk-blade-a");
        const b = fx.querySelector(".tk-blade-b");
        const comb = fx.querySelector<HTMLElement>(".tk-comb");
        const scissors = fx.querySelector<HTMLElement>(".tk-scissors");

        const p = { t: 0 };

        // Same separation as the tickets: the repeating lap holds only finite
        // children, and the tool's own motion runs as its own repeating timeline.
        const buzz = gsap.timeline({ paused: true, repeat: -1, yoyo: true });
        if (isRazor) {
          // A trimmer vibrates in place — a tiny, fast oscillation of the cutting
          // head, not a rock. Sub-pixel travel at high frequency reads as a buzz.
          buzz.to(head, { y: 1.4, duration: 0.05, ease: "none" }, 0);
        } else {
          buzz
            .to(a, { rotate: -15, transformOrigin: "26px 50px", duration: 0.13 }, 0)
            .to(b, { rotate: 15, transformOrigin: "26px 50px", duration: 0.13 }, 0);
        }

        const tl = gsap.timeline({ paused: true, repeat: -1 }).to(p, {
          t: 1,
          // Same calm pace as the ticket lap — the barber cards are larger, so a
          // touch slower keeps the travel speed even between the two.
          duration: 4.0,
          ease: "none",
          onUpdate: () => {
            if (isRazor) {
              placeOnPerimeter(tools[0], card, p.t);
            } else {
              // The comb leads by 4% of the lap; the scissors work behind it —
              // scissor-over-comb, which is the technique, not two icons sharing
              // a path.
              placeOnPerimeter(comb!, card, p.t + 0.04);
              placeOnPerimeter(scissors!, card, p.t);
            }
            gsap.set(cut, { strokeDashoffset: 100 - p.t * 100 });
          },
        });

        barberRec.set(card, { tl, buzz, tools });
        return { tl, buzz, tools };
      };

      const barberEnter = (e: Event) => {
        const card = e.currentTarget as HTMLElement;
        const rec = barberRec.get(card) ?? buildBarber(card);
        gsap.set(rec.tools, { opacity: 1 });
        rec.tl.restart();
        rec.buzz.play();
      };

      const barberLeave = (e: Event) => {
        const card = e.currentTarget as HTMLElement;
        const rec = barberRec.get(card);
        if (!rec) return;
        rec.tl.pause();
        rec.buzz.pause();
        gsap.to(rec.tools, { opacity: 0, duration: 0.2 });
        gsap.to(card.querySelector(".tk-cut"), { strokeDashoffset: 100, duration: 0.35 });
      };

      cards.forEach((c) => {
        c.addEventListener("mouseenter", enter);
        c.addEventListener("mouseleave", leave);
      });
      barbers.forEach((c) => {
        c.addEventListener("mouseenter", barberEnter);
        c.addEventListener("mouseleave", barberLeave);
      });

      return () => {
        barbers.forEach((c) => {
          c.removeEventListener("mouseenter", barberEnter);
          c.removeEventListener("mouseleave", barberLeave);
        });
        barberRec.forEach((r) => {
          r.tl.kill();
          r.buzz.kill();
        });
        cards.forEach((c) => {
          c.removeEventListener("mouseenter", enter);
          c.removeEventListener("mouseleave", leave);
        });
        built.forEach((r) => {
          r.cut.kill();
          r.mend.kill();
          r.buzz.kill();
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
