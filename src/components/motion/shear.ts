import { gsap, getScroller } from "@/lib/motion";

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
 * evenly down its height. Hand-authored rather than generated: these numbers
 * decide whether the edge reads as torn paper or as broken CSS, and they want to
 * be looked at and tuned, not re-rolled differently on every mount.
 *
 * TUNING HISTORY, so nobody walks this road a fourth time. The amplitude went
 * 1.2% -> 2.4% ("too small, doesn't read as torn") -> 4.2% ("enormous cartoon
 * sawtooth teeth; reads as broken"). Both corrections were right and the fix was
 * never the amplitude alone: at 15 points over a viewport, each tooth is ~64px
 * tall, so ANY amplitude loud enough to see becomes a zigzag with a huge
 * horizontal swing per tooth. Frequency was the missing variable.
 *
 * So: 37 points at max 3.0% rather than 15 at 4.2%. Two things carry it —
 *
 *   FREQUENCY. ~25px between points at 1440, ~23px at 390. Small enough that a
 *   jag is an edge detail rather than a feature of the layout.
 *
 *   VARIED DEPTH, ON A STRICT ALTERNATION. Every entry crosses the centre line;
 *   the magnitudes are what wander (0.3% to 3.0%, no two neighbours alike), so
 *   adjacent points swing anywhere from 1.3% to 5.2% apart.
 *
 * That second one is the whole thing, and it is worth being precise about
 * because the obvious reading of "irregular" is wrong. A draft of this tried
 * irregularity by SIGN — runs of two or three same-side entries, on the theory
 * that a tear has near-straight stretches a saw doesn't. Screenshotted, it was
 * the worst of the three: each run merges its segments into one long smooth
 * diagonal, so the edge loses its high frequency exactly where it is most
 * visible and the seam reads as a giant lightning bolt. The gap between the
 * halves is a constant-width ribbon (both edges are this same polyline), so
 * low-frequency wander in the polyline becomes a wandering ribbon — the single
 * most cartoonish thing this edge can do.
 *
 * Alternating every point keeps the ribbon straight and lets the depth do the
 * work: the edge flips side every ~25px, ragged rather than machined because no
 * two neighbouring swings match. Fine and irregular reads as torn; coarse and
 * irregular reads as broken, whatever the amplitude.
 *
 * WHY 37 AND NOT MORE. 49 points at 2.8% was also screenshotted, and at 1440 it
 * is arguably the prettiest of the lot — a deckle edge. At 390 it collapses: 17px
 * between points and a ±11px swing average out to a line that is very nearly
 * straight, which is the original "the edges don't look torn" complaint coming
 * back on the breakpoint most of this shop's traffic actually uses. 37 is the
 * highest frequency that still reads as torn at 390, so it is the answer at both.
 * Judge any future change to this array at 390 FIRST; desktop flatters it.
 *
 * The edge is only ever seen in motion, while the halves travel apart, so it has
 * to be drawn louder than a static edge would be — that part of the 2.4% -> 4.2%
 * reasoning stands, and 3.0% (~43px at 1440, ~12px at 390) keeps it. What 4.2%
 * bought on top of that was not legibility, it was a comic-book tear.
 *
 * The SAME array drives both halves, which is the whole trick: the left half's
 * right edge and the right half's left edge are the same polyline, so at rest
 * they interlock perfectly with no seam and no overlap. Two independent jitters
 * would show a ragged gap before the shear ever started. It also drives the
 * comb's x on the way back up (see tearOffsetAt), so the mend knits along the
 * identical jags the cut left.
 *
 * First and last are pinned to 0 so the cut meets the top and bottom edges
 * exactly — a non-zero endpoint would leave a notch at the viewport edge where
 * the two halves fail to meet.
 */
const TEAR = [
  0, 1.2, -0.6, 2.1, -1.4, 0.4, -2.3, 1.0, -0.3, 2.8, -1.1, 0.7, -1.9, 1.6, -0.5, 2.4, -1.2, 0.3,
  -2.6, 1.3, -0.8, 1.8, -1.5, 0.5, -2.2, 3.0, -0.4, 1.1, -1.8, 2.5, -0.9, 0.6, -2.7, 1.4, -1.0, 0.5,
  0,
];

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
 * `top` — WHERE THE COPY SITS, and the one number that has to be right.
 *
 * The panels stand in for `source` AT PROGRESS 0 of the range that owns them:
 * closed, they must be pixel-identical to the real section, because progress 0
 * is the moment the panels are built or destroyed and the real section takes
 * over. Everything after that is the halves travelling away from a picture that
 * already matched.
 *
 * It defaults to `getBoundingClientRect().top` because for a range entered from
 * the top — scrolling down, onEnter at `start` — those are the same number.
 * Entered from the BOTTOM they are not, and that is a ~900px difference: on
 * `onEnterBack` the caller is at `end`, where the section has already scrolled
 * clean off, and freezing the live rect parks the copy a viewport above the
 * screen. What is left inside the panel is its own opaque [data-tone] fill and
 * nothing else — two grey slabs closing over the page, then the real section
 * snapping in at progress 0. So a caller that can be entered from either edge
 * must state the progress-0 offset rather than let it be read off the clock.
 *
 * `settle` — a selector for the caller's SCRUBBED elements, whose inline
 * transforms are a mid-scroll snapshot rather than a resting value. Same reason
 * as `top`, one layer in: see settleScrub.
 */
export function createShearPanels(
  source: HTMLElement,
  {
    tone = "ink",
    axis = "horizontal",
    top,
    settle,
  }: { tone?: ShearTone; axis?: ShearAxis; top?: number; settle?: string } = {},
): ShearPanels {
  const live = source.getBoundingClientRect();
  const rect = { left: live.left, width: live.width, height: live.height, top: top ?? live.top };
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
    // --cut-y). The vertical ones are torn, and a torn edge is a couple of dozen
    // computed points — it can only be expressed here.
    if (tear) panel.style.clipPath = half === "a" ? tear.left : tear.right;

    const clone = source.cloneNode(true) as HTMLElement;
    prepareClone(clone);
    if (settle) settleScrub(clone, settle);
    clone.classList.add("shear-clone");
    // A rect, not `inset: 0`: the section may be part-scrolled at progress 0, and
    // the panel has to reproduce that exact offset or the copy visibly jumps into
    // place at the freeze.
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
  /*
   * WHERE `y: 0` PUTS THE PAGE BELOW — the one number the whole handoff hangs
   * on, and the one this got wrong.
   *
   * `.cut-riser` is fixed to the WINDOW; the real page paints inside #scroller,
   * which starts one header-height down. Left on the stylesheet's `top: 0` the
   * stand-in therefore sits --nav-h ABOVE the thing it is standing in for, so
   * the contract two paragraphs up ("at progress 1 this must be pixel-identical
   * to the real thing") was broken by exactly the header's height, every time.
   *
   * Measured at 1440x900 before the fix: the next section painted at window y
   * 0.3px at progress 0.998, and at 79px two pixels of scroll later once the
   * riser was destroyed. An 81px downward snap the instant the cut finished —
   * the jerk at the end of the hero.
   *
   * Read off the live element rather than var(--nav-h): this has to be the
   * scroller's actual offset, and --nav-h is <Nav />'s measurement of itself,
   * which is the same number only for as long as nothing else is ever a flex
   * child of <body>.
   */
  inner.style.top = `${getScroller()?.getBoundingClientRect().top ?? 0}px`;

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
 * The other half of "the copy must match at progress 0" — see createShearPanels.
 *
 * Getting the panel's offset right puts the copy back on screen; it does not make
 * it match. A SCRUBBED transform is the section's position on its own trigger's
 * clock, written inline by GSAP, and cloneNode copies it verbatim. The hero has
 * two: <HeroParallax /> scrubs `.hero-bg .hero-media` to yPercent 12 and
 * `#razor-wrap` to -18, across exactly the scroll the cut spans. So a copy taken
 * on the way back up freezes the backdrop 108px down and holds it there while the
 * halves close over a real hero that is at 0. Measured: clone `translate(0, 108)`
 * against a real hero at `translate(0, 18)`, a 90px jump at the handoff.
 *
 * Dropping the inline value falls back to the stylesheet, which is the rest state
 * and therefore the progress-0 state — both parallax ranges start where the cut's
 * does. Fall back, rather than force `none`: if a target is positioned by a CSS
 * transform, GSAP composed its channel on top of that and the stylesheet's own
 * value is what progress 0 means for it.
 *
 * WHY A SELECTOR AND NOT EVERY INLINE TRANSFORM IN THE COPY, which is what this
 * did first and is the tempting generalisation: because a scrubbed transform is
 * the only kind that is WRONG in a clone. Every other inline transform in a
 * settled section is already the resting value, so a copy that keeps it is
 * correct and a copy that drops it is not. `.hero-line > span` is the one that
 * bites — its from-state is CSS (`html[data-loader="play"] .hero-line > span {
 * transform: translateY(-110%) }`, see split-headline.tsx) and is live for a
 * first-time visitor's entire session, held off only by the inline transform the
 * intro tween left behind. Drop that and the copy's headline leaves the screen.
 * Only the caller knows which of its targets are on a scrub; it has to say.
 */
function settleScrub(clone: HTMLElement, selector: string) {
  clone.querySelectorAll<HTMLElement>(selector).forEach((el) => {
    el.style.transform = "";
    // Cloned from a live tween's target; the copy tweens nothing.
    el.style.willChange = "";
  });
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
