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
 * Amplitude is deliberately about 1% — ~14px at 1440, ~4px at 390. A hint reads
 * as paper. Anything more reads as a mistake, and at h1 sizes a big jag starts
 * eating glyphs.
 *
 * The SAME array drives both halves, which is the whole trick: the left half's
 * right edge and the right half's left edge are the same polyline, so at rest
 * they interlock perfectly with no seam and no overlap. Two independent
 * jitters would show a ragged gap before the shear ever started.
 */
const TEAR = [0, 0.9, -0.6, 1.2, -0.4, 0.7, -1.1, 0.5, -0.8, 1.0, -0.3, 0.8, -0.9, 0.4, 0];

/** The torn centre line as [x%, y%] points, top to bottom. */
function tearEdge(): Array<[number, number]> {
  return TEAR.map((dx, i) => [50 + dx, (i / (TEAR.length - 1)) * 100]);
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
