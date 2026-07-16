/**
 * Every file in /public/media: path, intrinsic size, ratio, and for video the
 * duration and poster. Nothing else in the tree may hard-code a /media path or
 * a dimension — a re-encode or a rename should be one edit here.
 *
 * PILLARBOXING — hero-1 and hero-3 are not shaped like their dimensions claim.
 * They are 1920x1080 files whose real footage is a centred 608x1080 portrait
 * column with near-black (rgb 2,0,2) bars either side: phone video padded out to
 * landscape before it ever reached us. `contentRatio` records the shape of the
 * footage; `ratio` records the shape of the file.
 *
 * That distinction is load-bearing wherever it still applies: an
 * `object-fit: cover` box at 608/1080 centre-crops a 1080-tall source to exactly
 * 608 wide — exactly the footage, bars gone, at 1:1 with no upscale. Hand one of
 * these clips a 16:9 box instead and two thirds of it is black.
 *
 * Every OTHER clip here is full-frame and its `contentRatio` equals its `ratio`
 * — verified with ffmpeg cropdetect, which reports the full frame for each.
 * hero-2 was re-exported as a true 1920x1080 landscape and the strip clips are
 * genuine 720x1280 portrait, so the pillarbox workaround they once needed is
 * gone. `contentRatio` stays on every video rather than becoming optional: the
 * property is the question "what shape is the footage", and "the same as the
 * file" is an answer to it, not an absence of one.
 */

export type ImageAsset = {
  readonly src: string;
  /** Intrinsic pixel size of the file. */
  readonly width: number;
  readonly height: number;
  /** width / height of the file. */
  readonly ratio: number;
};

export type VideoAsset = ImageAsset & {
  readonly duration: number;
  readonly poster?: string;
  /**
   * width / height of the *footage*, which is what a cover box wants. Equal to
   * `ratio` unless the file is pillarboxed — see the note above.
   */
  readonly contentRatio: number;
};

/** The real footage box inside the padded 1920x1080 hero-1 / hero-3 clips. */
const HERO_CONTENT_RATIO = 608 / 1080;

export const MEDIA = {
  /**
   * Hero backdrop: the cutting loop, full-bleed behind the headline. Genuine
   * full-frame landscape — no bars — so it covers a hero at any width.
   *
   * True 1080p, so a 1440px hero downscales it — no upscale ceiling. Normal GOP:
   * an earlier encode forced a keyframe every 0.5s so Process could seek this
   * clip, which cost 1.4MB (3.7 -> 2.3) on the hero's LCP-adjacent asset.
   * Process now plays four separate clips and never touches this one, so that
   * capability was pure overhead. Nothing should magnify it further — no
   * zoom on hover. The longest clip, hence the only one worth a poster.
   */
  heroLoop: {
    src: "/media/hero-2.mp4",
    width: 1920,
    height: 1080,
    ratio: 1920 / 1080,
    duration: 14.04,
    poster: "/media/hero-poster.jpg",
    // No pillarbox: this is a true full-frame 1080p export, so the footage shape
    // and the file shape are the same. (hero-1/hero-3 were not, which is why
    // contentRatio exists at all — check cropdetect, never the container dims.)
    contentRatio: 1920 / 1080,
  },
  /** Extracted from heroLoop, so it matches it frame for frame. */
  heroPoster: {
    src: "/media/hero-poster.jpg",
    width: 1920,
    height: 1080,
    ratio: 1920 / 1080,
  },
  /**
   * PILLARBOXED — see the note at the top. Unused since the strip moved to the
   * full-frame clips below and the hero stopped needing a portrait panel; kept
   * because the footage (the walk-in: empty chairs, shop front to back) is the
   * only record of that shot and re-adding the entry is harder than keeping it.
   */
  walkIn: {
    src: "/media/hero-1.mp4",
    width: 1920,
    height: 1080,
    ratio: 1920 / 1080,
    duration: 2.77,
    contentRatio: HERO_CONTENT_RATIO,
  },
  /** PILLARBOXED, and unused, on the same terms as walkIn. Caped client in the
      chair, barber working the top. */
  chairWork: {
    src: "/media/hero-3.mp4",
    width: 1920,
    height: 1080,
    ratio: 1920 / 1080,
    duration: 4.23,
    contentRatio: HERO_CONTENT_RATIO,
  },
  /** Recent cuts, card 1. Genuine full-frame 9:16 portrait. */
  cutsLoop: {
    src: "/media/cuts-loop.mp4",
    width: 720,
    height: 1280,
    ratio: 720 / 1280,
    duration: 2.24,
    contentRatio: 720 / 1280,
  },
  /** Recent cuts, card 3. Genuine full-frame 9:16 portrait. */
  stripClip1: {
    src: "/media/strip-clip-1.mp4",
    width: 720,
    height: 1280,
    ratio: 720 / 1280,
    duration: 2.77,
    contentRatio: 720 / 1280,
  },
  /** Recent cuts, card 4. Genuine full-frame 9:16 portrait. */
  stripClip2: {
    src: "/media/strip-clip-2.mp4",
    width: 720,
    height: 1280,
    ratio: 720 / 1280,
    duration: 4.23,
    contentRatio: 720 / 1280,
  },
  /**
   * PROCESS BEATS — one clip per step, four distinct scenes (verified pairwise:
   * closest pair 44.5 mean luma diff, against the 0.61 that exposed the old
   * process-cut/process-detail duplicate).
   *
   * These are BLUR-FILLED to 1920x1080: the sharp 9:16 original sits centred and
   * a blurred, darkened copy of it fills the wings. That is a real compromise and
   * it is only payable here — Process lays a heavy gradient over the whole frame,
   * so the wings read as depth of field rather than as a fix. The hero has no
   * such gradient and must never use these.
   *
   * PLAYED, NEVER SEEKED. Each file has 1-2 keyframes in total (proc-2-cut: 2
   * across 422 frames), so any seek decodes from frame 0. `duration` is here to
   * document the clip, not to scrub it.
   *
   * `contentRatio` is the FILE ratio, deliberately: unlike the pillarboxed
   * hero-1/hero-3, the wings here are real picture rather than black bars, so a
   * cover box wants the whole 16:9 frame.
   */
  /** Beat 1, Consultation. The walk-in — shopfront sign, client at the door. */
  processArrive: {
    src: "/media/proc-1-consult.mp4",
    width: 1920,
    height: 1080,
    ratio: 1920 / 1080,
    duration: 5.04,
    poster: "/media/proc-1-consult-poster.jpg",
    contentRatio: 1920 / 1080,
  },
  /** Beat 2, The Cut. Clippers on the front hairline. */
  processCut: {
    src: "/media/proc-2-cut.mp4",
    width: 1920,
    height: 1080,
    ratio: 1920 / 1080,
    duration: 14.07,
    poster: "/media/proc-2-cut-poster.jpg",
    contentRatio: 1920 / 1080,
  },
  /**
   * Beat 3, The Detail. Derived from gallery-detail, NOT from the deleted
   * process-detail.mp4 — that file was the same footage as process-cut (mean
   * luma diff 0.61/255 at five timestamps, identical 422 frames), which is what
   * made the old section show one clip for two beats. Same scene as stripClip2
   * (Recent Cuts card 4); reusing it is the known cost of a five-scene library.
   */
  processDetail: {
    src: "/media/proc-3-detail.mp4",
    width: 1920,
    height: 1080,
    ratio: 1920 / 1080,
    duration: 4.23,
    poster: "/media/proc-3-detail-poster.jpg",
    contentRatio: 1920 / 1080,
  },
  /** Beat 4, Out the Chair. The spray-down finish. Same scene as cutsLoop. */
  processFinish: {
    src: "/media/proc-4-finish.mp4",
    width: 1920,
    height: 1080,
    ratio: 1920 / 1080,
    duration: 2.24,
    poster: "/media/proc-4-finish-poster.jpg",
    contentRatio: 1920 / 1080,
  },

  /**
   * The stacked path's stills — one per beat, and deliberately the SHARP 9:16
   * originals rather than a frame of the blur-filled clips above. A phone is
   * portrait: it can show this footage at its true shape, so it gets no wings,
   * no blur, and no upscale. The blur-fill exists to solve a landscape problem
   * that does not exist on a 390px screen.
   */
  processArriveStill: {
    src: "/videos/hero-walkin-poster.jpg",
    width: 720,
    height: 1280,
    ratio: 720 / 1280,
  },
  processCutStill: {
    src: "/videos/process-cut-poster.jpg",
    width: 720,
    height: 1280,
    ratio: 720 / 1280,
  },
  processDetailStill: {
    src: "/videos/gallery-detail-poster.jpg",
    width: 640,
    height: 1138,
    ratio: 640 / 1138,
  },
  processFinishStill: {
    src: "/videos/gallery-finish-poster.jpg",
    width: 640,
    height: 1138,
    ratio: 640 / 1138,
  },

  /**
   * PROCESS BEATS — the mobile portrait videos, one per beat. The phone plays
   * the sharp 9:16 ORIGINAL, never the blur-filled 1920x1080 landscape the
   * desktop pins: a phone is portrait, so it shows this footage at its true shape
   * with no wings, no blur and no upscale. `poster` is the matching still above —
   * the same frame — so the `aspect-[9/16]` box is never a blank rectangle before
   * the clip decodes. Fetched lazily, one in-view beat at a time via an
   * IntersectionObserver (see process.tsx), never all four upfront, so Process
   * costs a phone one clip's bytes rather than ~4MB. `contentRatio` equals
   * `ratio`: these are full-frame portrait, not pillarboxed.
   */
  processArriveMobile: {
    src: "/videos/hero-walkin.mp4",
    width: 720,
    height: 1280,
    ratio: 720 / 1280,
    duration: 5.04,
    poster: "/videos/hero-walkin-poster.jpg",
    contentRatio: 720 / 1280,
  },
  processCutMobile: {
    src: "/videos/process-cut.mp4",
    width: 720,
    height: 1280,
    ratio: 720 / 1280,
    duration: 14.07,
    poster: "/videos/process-cut-poster.jpg",
    contentRatio: 720 / 1280,
  },
  processDetailMobile: {
    src: "/videos/gallery-detail.mp4",
    width: 640,
    height: 1138,
    ratio: 640 / 1138,
    duration: 4.23,
    poster: "/videos/gallery-detail-poster.jpg",
    contentRatio: 640 / 1138,
  },
  processFinishMobile: {
    src: "/videos/gallery-finish.mp4",
    width: 640,
    height: 1138,
    ratio: 640 / 1138,
    duration: 2.24,
    poster: "/videos/gallery-finish-poster.jpg",
    contentRatio: 640 / 1138,
  },
  tools: {
    src: "/media/tools.jpg",
    width: 1376,
    height: 768,
    ratio: 1376 / 768,
  },
  interior: {
    src: "/media/interior.jpg",
    width: 1376,
    height: 768,
    ratio: 1376 / 768,
  },
  shopfront: {
    src: "/media/shopfront.jpg",
    width: 1264,
    height: 848,
    ratio: 1264 / 848,
  },
  cutting: {
    src: "/media/cutting.jpg",
    width: 896,
    height: 1200,
    ratio: 896 / 1200,
  },
} as const satisfies Record<string, ImageAsset | VideoAsset>;

/**
 * `sizes` strings, derived from the real layout rather than guessed, and kept
 * here so the number and the CSS that justifies it sit together. A `sizes` that
 * overstates the box ships a 2x file to every phone on the high street.
 */
export const SIZES = {
  /** Full-bleed backdrop. */
  fullBleed: "100vw",
  /**
   * The Process step panel. Portrait-native and height-driven: the box is
   * `aspect-[9/16]` off a height clamp, so its width tops out at
   * 540 * 9/16 ≈ 304px on desktop and is capped at 220px on the stacked path.
   * Rounded up to the next sensible bucket, which still lands under the 720px
   * source at 2x — no upscale at any breakpoint.
   */
  processPanel: "(max-width: 767px) 220px, 320px",
  /** Full width of `.wrap`: max-width 1240, gutter clamp(20px,4vw,48px) a side. */
  wrapFull: "(max-width: 1336px) calc(100vw - 96px), 1240px",
  /** The 1.2fr column of Visit's `[1.2fr_1fr]` grid, gap-11 (44px), inside `.wrap`. */
  wrapWideColumn: "(max-width: 860px) 100vw, (max-width: 1240px) 55vw, 660px",
  /** A centred prose column: `max-w-[1000px]` inside the section gutter. */
  proseFull: "(max-width: 1096px) calc(100vw - 96px), 1000px",
  /**
   * A card in the Recent cuts grid (`.cut-grid`), walked breakpoint by
   * breakpoint because the container's gutter is itself a clamp:
   *   >=1336px  .wrap caps at 1240; (1240 - 3*20 gap) / 4          = 295px
   *   1200-1336 gutter pinned at 48; (100vw - 96 - 60) / 4
   *   900-1199  gutter is 4vw, so .wrap is 92vw; (92vw - 60) / 4   = 23vw - 15px
   *   <=899px   snap rail: min(64vw, 300px), which splits at 469px
   */
  cutsCard:
    "(max-width: 468px) 64vw, (max-width: 899px) 300px, (max-width: 1199px) calc(23vw - 15px), (max-width: 1336px) calc((100vw - 156px) / 4), 295px",
} as const;

// Widened before the filter: `as const` types MEDIA's values as literals, and a
// type predicate has to be assignable to what it narrows. The alternative is a
// cast, which would stop `satisfies` from checking anything.
const ASSETS: readonly (ImageAsset | VideoAsset)[] = Object.values(MEDIA);

const VIDEO_BY_SRC = new Map<string, VideoAsset>(
  ASSETS.filter((asset): asset is VideoAsset => "duration" in asset).map((asset) => [
    asset.src,
    asset,
  ]),
);

/**
 * Lets <VideoCard src="..."> recover the shape of what it was handed. Callers
 * pass a path (the natural thing to pass), and the box it needs is a property
 * of the file, not of the call site — so looking it up beats asking every caller
 * to remember that hero-1 is secretly portrait.
 */
export function videoBySrc(src: string): VideoAsset | undefined {
  return VIDEO_BY_SRC.get(src);
}
