/**
 * Every file in /public/media: path, intrinsic size, ratio, and for video the
 * duration and poster. Nothing else in the tree may hard-code a /media path or
 * a dimension — a re-encode or a rename should be one edit here.
 *
 * PILLARBOXING — the hero clips are not shaped like their dimensions claim.
 * hero-1/-2/-3 are 1920x1080 files whose real footage is a centred 608x1080
 * portrait column with near-black (rgb 2,0,2) bars either side: phone video
 * padded out to landscape before it ever reached us. `contentRatio` records the
 * shape of the footage; `ratio` records the shape of the file.
 *
 * That distinction is load-bearing, and it is why the cards size themselves off
 * `contentRatio`. An `object-fit: cover` box at 608/1080 centre-crops a
 * 1080-tall source to exactly 608 wide — which is exactly the footage, bars
 * gone, at 1:1 with no upscale and no re-encode. Hand one of these clips a 16:9
 * box instead and two thirds of the card is black.
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

/** The real footage box inside the padded 1920x1080 hero clips. */
const HERO_CONTENT_RATIO = 608 / 1080;

export const MEDIA = {
  /** Hero backdrop: the cutting loop. The longest clip, hence the only poster. */
  heroLoop: {
    src: "/media/hero-2.mp4",
    width: 1920,
    height: 1080,
    ratio: 1920 / 1080,
    duration: 14.07,
    poster: "/media/hero-poster.jpg",
    contentRatio: HERO_CONTENT_RATIO,
  },
  /** Extracted from heroLoop @1.5s, so it is pillarboxed identically. */
  heroPoster: {
    src: "/media/hero-poster.jpg",
    width: 1920,
    height: 1080,
    ratio: 1920 / 1080,
  },
  /** The walk-in shot: empty chairs, shop front to back. */
  walkIn: {
    src: "/media/hero-1.mp4",
    width: 1920,
    height: 1080,
    ratio: 1920 / 1080,
    duration: 2.77,
    contentRatio: HERO_CONTENT_RATIO,
  },
  /** Caped client in the chair, barber working the top. */
  chairWork: {
    src: "/media/hero-3.mp4",
    width: 1920,
    height: 1080,
    ratio: 1920 / 1080,
    duration: 4.23,
    contentRatio: HERO_CONTENT_RATIO,
  },
  /** The only clip framed as shot — genuine full-frame portrait, no bars. */
  cutsLoop: {
    src: "/media/cuts-loop.mp4",
    width: 1080,
    height: 1920,
    ratio: 1080 / 1920,
    duration: 2.24,
    contentRatio: 1080 / 1920,
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
  /** A tile in the Recent cuts rail: `w-[min(72vw,340px)]`. */
  railCard: "(max-width: 480px) 72vw, 340px",
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
