import { gsap } from "@/lib/motion";

/**
 * The shear mechanism, shared by <CutTransition /> and <ShearSplit />.
 *
 * WHY A CLONE, AND WHY NO ScrollTrigger `pin`
 * -------------------------------------------
 * The effect needs three things at once: the source section held still, a cut
 * drawn across it, and the *next* section sitting behind it ready to be
 * revealed when the halves part. ScrollTrigger's pin can't give all three:
 *
 *   - `pin: true` (pinSpacing: true) inserts a spacer the height of the pin
 *     range, so the page below never advances while pinned. When the halves
 *     part they reveal the pinned section itself. There is nothing behind it.
 *   - `pin: true, pinSpacing: false` does let the page below slide up behind —
 *     but the hero has no background of its own (it inherits the body's ink),
 *     so the marquee would show *through* the headline for the whole pin. The
 *     fixes for that are a z-index/opaque-background war fought inside a
 *     ScrollTrigger-authored `.pin-spacer` wrapper whose stacking context we
 *     don't control.
 *
 * So the pin is done by standing in for the section instead of fixing it: an
 * opaque, fixed, viewport-covering copy is dropped over the page at the moment
 * the range opens. The copy is what the user sees; the real section keeps
 * scrolling normally underneath, and by the end of the range it has scrolled
 * off and the next section is genuinely in the viewport. The halves part and
 * reveal it — no spacer, no wrapper, no mutation of a section we don't own,
 * and Lenis's native scroll is never touched.
 *
 * DOCUMENTED EXCEPTION to transform/opacity-only: the halves are cut with
 * `clip-path`. It is set ONCE per panel, never tweened — the two panels are
 * static clips that then move on `xPercent`/`yPercent` alone. clip-path is
 * composited and triggers no layout, which is exactly why it beats the
 * alternative (wrappers with `overflow: hidden` and the copy offset inside
 * each) for something that must hold 60fps mid-scroll. It is also the only way
 * to get a torn edge at all — see TEAR below.
 */

/** The background a frozen section sits on. Must match the real section's. */
export type ShearTone = "ink" | "ink-deep";

/**
 * Which way the section comes apart.
 *
 * `vertical` — cut down the middle, halves part left/right. The hero's
 * signature: you scroll down, so the blade travels down, and the scroll IS the
 * cut. Torn edges.
 * `horizontal` — cut across the middle, halves part up/down. Straight edges.
 */
export type ShearAxis = "vertical" | "horizontal";

export type ShearPanels = {
  /** [top, bottom] for horizontal; [left, right] for vertical. */
  readonly halves: readonly [HTMLElement, HTMLElement];
  readonly axis: ShearAxis;
  /** Removes both panels from the DOM. Safe to call twice. */
  readonly destroy: () => void;
};

/**
 * The tear.
 *
 * Offsets from the centre line, as a percentage of the panel's width, sampled
 * evenly down its height. Hand-authored rather than generated: it is 15 numbers
 * that decide whether the edge reads as torn paper or as broken CSS, and they
 * want to be looked at and tuned, not re-rolled differently on every mount.
 *
 * Amplitude is ~2.4% — ~35px at 1440, ~9px at 390. The first pass was half this
 * and it was the right instinct for a STATIC edge: at rest, subtle reads as
 * paper and loud reads as a mistake. But this edge is never seen at rest. It is
 * only on screen while the two halves are travelling apart, and a 14px jag on a
 * moving edge is invisible — the user's note that the edges didn't look torn was
 * simply correct. An edge that moves has to be drawn louder than one that
 * doesn't.
 *
 * The SAME array drives both halves, which is the whole trick: the left half's
 * right edge and the right half's left edge are the same polyline, so at rest
 * they interlock perfectly with no seam and no overlap. Two independent
 * jitters would show a ragged gap before the shear ever started.
 */
/*
 * Amplitude raised again (max 2.4% -> 4.2%) — the previous pass was still
 * reading as "wobbly" rather than "torn". Deliberately angular rather than
 * wave-like: consecutive entries swing across the centre line instead of
 * drifting around it, because a blade leaves facets, not ripples.
 *
 * First and last are pinned to 0 so the cut meets the top and bottom edges
 * exactly — a non-zero endpoint would leave a notch at the viewport edge where
 * the two halves fail to meet.
 */
const TEAR = [0, 3.2, -2.1, 4.2, -1.6, 2.6, -3.9, 1.8, -3.0, 3.5, -1.1, 2.8, -3.3, 1.4, 0];

/**
 * How far a vertical half must travel (in % of its own width) to fully clear the
 * viewport: 50% for its share of the screen, plus the tear's worst outward
 * excursion, plus a hair of margin. Derived from TEAR rather than guessed —
 * raise the tear and this follows, instead of leaving a sliver of hero parked at
 * the screen edge.
 */
export const SHEAR_CLEAR = 50 + Math.max(...TEAR.map(Math.abs)) + 1.5;

/** The torn centre line as [x%, y%] points, top to bottom. */
function tearEdge(): Array<[number, number]> {
  return TEAR.map((dx, i) => [50 + dx, (i / (TEAR.length - 1)) * 100]);
}

/**
 * The tear's horizontal offset (in % of width) at `t` down the seam, 0..1,
 * linearly interpolated between the authored points.
 *
 * Lets a tool riding the seam track the edge it is working rather than float
 * down a straight line beside it — the comb's teeth catch the torn edge as they
 * pass, because they are reading the same polyline the edge was cut from.
 */
export function tearOffsetAt(t: number): number {
  const span = (TEAR.length - 1) * Math.min(Math.max(t, 0), 1);
  const i = Math.min(Math.floor(span), TEAR.length - 2);
  return TEAR[i] + (TEAR[i + 1] - TEAR[i]) * (span - i);
}

function tearClipPaths(): { left: string; right: string } {
  const edge = tearEdge();
  const pt = ([x, y]: [number, number]) => `${x.toFixed(2)}% ${y.toFixed(2)}%`;

  // Left region: down the left side, then up the tear.
  const left = ["0% 0%", ...edge.map(pt), "0% 100%"];
  // Right region: from the tear's top point, around the right side, then back
  // up the tear in reverse so the two polygons share an identical boundary.
  const right = [pt(edge[0]), "100% 0%", "100% 100%", ...[...edge].reverse().slice(0, -1).map(pt)];

  return {
    left: `polygon(${left.join(", ")})`,
    right: `polygon(${right.join(", ")})`,
  };
}

/**
 * <video> in the copy is replaced by nothing, deliberately. A cloned <video>
 * carries `autoplay`, so the browser would fetch and decode a second copy of
 * hero-2.mp4 from frame zero purely to paint it behind a panel that exists for
 * under a second. <HeroVideo /> layers the poster <img> underneath the video at
 * identical framing, so dropping the video leaves that poster showing and the
 * copy still reads as the hero.
 *
 * IDS ARE DELIBERATELY LEFT ALONE, and that is not an oversight.
 *
 * Stripping them is the obvious move — duplicate ids are invalid, and the copy
 * duplicates `#top` and `#razor-wrap`. It is also completely wrong here, because
 * on this page ids carry LAYOUT: `#razor-wrap { position: absolute }` lives in
 * sections.css, so an id-less copy drops the razor into normal flow, adds ~480px
 * to the hero's `justify-center` column and shoves the whole headline 307px up.
 * The copy stops being a copy — which is the one thing it has to be.
 *
 * The duplicates are survivable in a way that broken layout isn't: every
 * `querySelector` in the app resolves document order, and the real hero comes
 * before a panel appended to <body>, so `#top` and `#razor-wrap` keep resolving
 * to the originals. The copy is aria-hidden and inert, and it exists for under a
 * second. If a lookup ever does need to exclude it, `[data-shear-exclude]` on
 * the panel is the hook — don't reach for id-stripping again.
 */
function prepareClone(clone: HTMLElement) {
  clone.querySelectorAll("video").forEach((v) => v.remove());
  // The machinery that drives the shear must not be inside the thing it shears.
  // <CutTransition />'s overlay is `position: fixed` — a copy of it would escape
  // the panel and repaint the cut-line across the viewport.
  clone.querySelectorAll("[data-shear-exclude]").forEach((el) => el.remove());
  // The copy is a picture, not a page: it duplicates every link and button in
  // the section, and without this they are all in the tab order twice.
  clone.setAttribute("inert", "");
  clone.setAttribute("aria-hidden", "true");
}

/**
 * Copies `source` into two fixed, opaque, viewport-sized panels clipped to its
 * two halves, and inserts them into <body>.
 *
 * The copy is positioned from `source.getBoundingClientRect()` at call time, so
 * whatever the user is looking at the instant this runs is what freezes — the
 * panel is a pixel-accurate stand-in, not an assumption that the section
 * happens to be flush with the viewport.
 */
export function createShearPanels(
  source: HTMLElement,
  { tone = "ink", axis = "horizontal" }: { tone?: ShearTone; axis?: ShearAxis } = {},
): ShearPanels {
  const rect = source.getBoundingClientRect();
  const tear = axis === "vertical" ? tearClipPaths() : null;

  const make = (half: "a" | "b"): HTMLElement => {
    const panel = document.createElement("div");
    const name =
      axis === "vertical" ? (half === "a" ? "left" : "right") : half === "a" ? "top" : "bot";
    panel.className = `shear-panel shear-panel-${name}`;
    // The panel is opaque so the page can keep scrolling behind the freeze, so
    // it has to be the background the copied section actually sits on — a
    // `bg-ink-deep` section frozen onto an ink panel shows a seam wherever the
    // copy doesn't reach the viewport edge.
    panel.dataset.tone = tone;
    panel.setAttribute("aria-hidden", "true");

    // The horizontal halves take their clip from globals.css (a straight edge on
    // --cut-y). The vertical ones are torn, and a torn edge is 15 computed
    // points — it can only be expressed here.
    if (tear) panel.style.clipPath = half === "a" ? tear.left : tear.right;

    const clone = source.cloneNode(true) as HTMLElement;
    prepareClone(clone);
    clone.classList.add("shear-clone");
    // The rect, not `inset: 0`: the section may be part-scrolled when the range
    // opens, and the panel has to reproduce that exact offset or the copy
    // visibly jumps into place at the freeze.
    clone.style.top = `${rect.top}px`;
    clone.style.left = `${rect.left}px`;
    clone.style.width = `${rect.width}px`;
    clone.style.height = `${rect.height}px`;

    panel.appendChild(clone);
    document.body.appendChild(panel);
    return panel;
  };

  const halves = [make("a"), make("b")] as const;

  return {
    halves,
    axis,
    destroy: () => halves.forEach((el) => el.remove()),
  };
}

export type Riser = {
  /** Transform this to make the page below rise. */
  readonly inner: HTMLElement;
  /** Fade this out to brighten it. */
  readonly shade: HTMLElement;
  readonly destroy: () => void;
};

/**
 * THE PAGE BELOW, rising behind the gap.
 *
 * This exists because fusing the cut into one scrubbed progress broke something
 * the phased version hid. The halves used to part only at progress 1, by which
 * point the hero had scrolled away and the marquee was really sitting at the top
 * of the viewport — so the gap revealed the live page and needed no help. Once
 * the halves start parting at progress 0.1, the gap opens onto what is ACTUALLY
 * behind the hero at 10% scroll: the hero itself, still in the flow, 90% of it
 * still filling the screen. Hide it and the gap is a 900px ink void instead.
 *
 * So the thing the gap opens onto has to be built: an opaque, fixed stand-in for
 * the page below, which rises and brightens on the same progress as everything
 * else. It is the answer to "the part below should simultaneously keep coming up
 * too" — not decoration on top of the reveal, but the only reason there is
 * anything to reveal.
 *
 * THE HANDOFF IS THE WHOLE CONTRACT. At progress 1 this is destroyed and the
 * real page takes over mid-scroll, so at progress 1 it must be pixel-identical
 * to the real thing: `inner` at yPercent 0 and `shade` at opacity 0 reproduce
 * the real page at exactly the scroll offset where the range ends (the hero's
 * bottom on the viewport's top). Any easing on either would land them somewhere
 * other than 0 at the moment of the swap, and the page would jump.
 */
export function createRiser(
  after: HTMLElement,
  { tone = "ink" }: { tone?: ShearTone } = {},
): Riser {
  const riser = document.createElement("div");
  riser.className = "cut-riser";
  riser.dataset.tone = tone;
  riser.setAttribute("aria-hidden", "true");

  const inner = document.createElement("div");
  inner.className = "cut-riser-inner";
  inner.style.width = `${after.getBoundingClientRect().width}px`;

  // Enough siblings to fill the screen once, and no more. Cloning to the end of
  // the document would copy the whole page to show one viewport of it.
  let filled = 0;
  let next = after.nextElementSibling;
  while (next && filled < window.innerHeight * 1.2) {
    const copy = next.cloneNode(true) as HTMLElement;
    prepareClone(copy);
    settleReveals(copy);
    inner.appendChild(copy);
    filled += (next as HTMLElement).offsetHeight;
    next = next.nextElementSibling;
  }

  const shade = document.createElement("div");
  shade.className = "cut-riser-shade";

  riser.append(inner, shade);
  document.body.appendChild(riser);

  return { inner, shade, destroy: () => riser.remove() };
}

/**
 * A copy is a snapshot, and a snapshot of an unrevealed section is a picture of
 * nothing: `.reveal[data-batch]` is `opacity: 0` in CSS until its own
 * ScrollTrigger fires, and a clone never gets one. Meanwhile the REAL section's
 * triggers do fire during the hero's scroll, so by the handoff the real page is
 * revealed and an untouched copy would pop from empty to full at progress 1.
 * Forcing the copy to the revealed state is what makes the swap invisible.
 */
function settleReveals(clone: HTMLElement) {
  clone.querySelectorAll<HTMLElement>(".reveal").forEach((el) => {
    el.style.opacity = "1";
    el.style.transform = "none";
  });
}

/**
 * The shear itself: the halves part, ~0.9s, `expo.inOut`.
 *
 * will-change is set here rather than in CSS: this is a one-shot, so the layers
 * are earned only for the tween's life and `clearProps` drops them the moment
 * it lands.
 */
export function shearApart(
  panels: ShearPanels,
  { onComplete }: { onComplete?: () => void } = {},
): gsap.core.Timeline {
  const [a, b] = panels.halves;
  const prop = panels.axis === "vertical" ? "xPercent" : "yPercent";

  return gsap
    .timeline({
      defaults: { duration: 0.9, ease: "expo.inOut" },
      onStart: () => gsap.set([a, b], { willChange: "transform" }),
      onComplete: () => {
        gsap.set([a, b], { clearProps: "willChange" });
        onComplete?.();
      },
    })
    .to(a, { [prop]: -100 }, 0)
    .to(b, { [prop]: 100 }, 0);
}
