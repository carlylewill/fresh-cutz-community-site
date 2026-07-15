"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { MEDIA, SIZES } from "@/lib/media";

/**
 * The hero media.
 *
 * Art direction is dictated by the footage: hero-2.mp4 is a 608×1080 portrait
 * column pillarboxed into a 1920×1080 file (phone video padded to landscape —
 * see the note in lib/media.ts). There is no way to fill a desktop-width hero
 * from it: the file's own 16:9 box shows black bars, and cropping to the real
 * content and covering 1440px upscales ~2.4× and throws away ~65% of the frame
 * height. So the layout follows the content rather than fighting it:
 *
 *   - Desktop: a portrait panel at the footage's true 608/1080, beside the
 *     headline. No upscale, no bars, nothing cropped.
 *   - Mobile: full-bleed, where a 9:16-ish column fits the viewport natively
 *     and is the strongest use of this clip.
 *
 * The gate is mounted state, not CSS. A <video> that renders on the server and
 * is hidden with display:none, hidden, or a media query still fetches:
 * preload="metadata" pulls the moov atom and browsers pull leading fragments
 * besides. <source media> is evaluated once at load and never re-evaluated.
 * The only construction where a reduced-motion visitor provably spends zero
 * bytes on the video is one where the element does not exist.
 *
 * No `poster` attribute, deliberately: next/image has already painted that exact
 * frame underneath from an /_next/image URL. The attribute points at the
 * original, so it would refetch the same picture under a second URL and hand the
 * browser a second viewport-sized LCP candidate — against the rule that the
 * video must never be LCP. The video paints transparent until its first frame
 * decodes, so the identical poster shows through and there is nothing to fix.
 */
export function HeroVideo() {
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    // Reduced motion is the only gate now. The clip plays at both breakpoints —
    // it's 948K, and on mobile it's the whole brand moment.
    setShowVideo(!window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  return (
    <div className="hero-bg">
      <div className="hero-media-layer">
        {/*
         * The tint lives on this layer, not on the two media elements: they
         * overlap, so at opacity .14 each the video over the poster would
         * composite to ~.26 and both frames would show at once — ghosting,
         * since the poster is heroLoop @1.5s and the video isn't. One tinted
         * layer makes the video opaque over the poster so the handoff is
         * invisible, and keeps .hero-bg::after out of the opacity.
         */}
        <Image
          src={MEDIA.heroPoster.src}
          alt=""
          width={MEDIA.heroPoster.width}
          height={MEDIA.heroPoster.height}
          priority
          sizes={SIZES.fullBleed}
          className="hero-media"
        />
        {showVideo ? (
          <video className="hero-media" autoPlay muted loop playsInline preload="metadata">
            <source src={MEDIA.heroLoop.src} type="video/mp4" />
          </video>
        ) : null}
      </div>
    </div>
  );
}
