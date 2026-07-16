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
   * True 1080p, so a 1440px hero downscales it — no upscale ceiling. Re-encoded
   * with a keyframe every 0.5s because Process seeks this clip's currentTime
   * from scroll rather than playing it, and seeking between sparse keyframes is
   * what makes a scrub stutter. Nothing should magnify it further — no
   * zoom on hover. The longest clip, hence the only one worth a poster.
   */
  heroLoop: {
    src: "/media/hero-2.mp4",
    width: 1920,
    height: 1080,
    ratio: 1920 / 1080,
    duration: 14.04,
    poster: "/media/hero-poster.jpg",
    // No pillarbox: this is a true full-frame 1080p export, so the footage
    // shape and the file shape are the same. Re-encoded with a keyframe every
    // 0.5s because Process seeks this clip rather than playing it.
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
