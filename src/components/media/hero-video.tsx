"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { MEDIA, SIZES } from "@/lib/media";

/**
 * The hero media.
 *
 * hero-2.mp4 is a true full-frame 1920×1080 export, so this is simply
 * full-bleed at every width — cover downscales it rather than stretching it.
 *
 * (History, because it explains the shape of the surrounding code: an earlier
 * cut of this file was a 608×1080 portrait column pillarboxed into a 1920×1080
 * container, which forced a portrait-panel layout to avoid showing the bars.
 * That treatment is gone. If a future export regresses to pillarboxed, cover
 * will happily paint the black bars — check `cropdetect`, don't trust the
 * container dimensions.)
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
