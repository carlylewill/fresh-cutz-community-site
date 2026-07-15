"use client";

import { useEffect, useRef, useState } from "react";
import { videoBySrc } from "@/lib/media";
import { cn } from "@/lib/utils";

type VideoCardProps = {
  /** A path from MEDIA — the box is resolved from the manifest entry. */
  src: string;
  /** Only heroLoop ships one today; see the note on `preload` below. */
  poster?: string;
  /** Box shape for a src the manifest doesn't know. Ignored when it does. */
  portrait?: boolean;
  /** Describes the footage: these are content, not decoration. */
  alt: string;
  className?: string;
};

const PORTRAIT_RATIO = 9 / 16;
const LANDSCAPE_RATIO = 16 / 9;

/**
 * A clip in the Recent cuts rail.
 *
 * The aspect-ratio box is not styling, it's a correctness fix: a `<video>` with
 * no intrinsic size laid out at the spec's 300x150 and then jumped to its real
 * shape on metadata load — CLS, and a ScrollTrigger invalidation for every
 * trigger below it on the page. Reserving the box means the rail never moves.
 *
 * The ratio comes from `contentRatio`, so the pillarboxed hero clips get a
 * portrait box and `object-cover` crops their black bars away exactly. See
 * src/lib/media.ts.
 */
export function VideoCard({ src, poster, portrait, alt, className }: VideoCardProps) {
  const video = useRef<HTMLVideoElement>(null);
  const [reduce, setReduce] = useState(false);

  const asset = videoBySrc(src);
  const ratio = asset?.contentRatio ?? (portrait ? PORTRAIT_RATIO : LANDSCAPE_RATIO);

  useEffect(() => {
    setReduce(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useEffect(() => {
    const el = video.current;
    if (!el || reduce) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          el.pause();
          return;
        }
        // Rejects if the element is torn down or the tab backgrounds mid-call.
        // Nothing to recover: the poster/first frame is already the fallback.
        void el.play().catch(() => {});
      },
      { threshold: 0.25 },
    );

    io.observe(el);
    return () => io.disconnect();
  }, [reduce]);

  return (
    <figure
      className={cn("border-line bg-ink-soft relative overflow-hidden rounded border", className)}
      // Inline, not a utility: the value is per-asset data from the manifest, so
      // Tailwind could never have generated the class.
      style={{ aspectRatio: ratio }}
    >
      <video
        ref={video}
        className="h-full w-full object-cover"
        poster={poster}
        muted
        loop
        playsInline
        // "none" is the point of the lazy play: these sit below a hero that is
        // already pulling ~950K, and three cards preloading metadata would race
        // it for the connection. play() loads on demand when the card is in view.
        //
        // Under reduce nothing will ever call play(), so "none" would leave a
        // permanently empty box for the assets that have no poster. "metadata"
        // gets a first frame painted instead — a still of the shop, which is the
        // correct reduced-motion representation of a silent loop anyway.
        preload={reduce ? "metadata" : "none"}
        aria-label={alt}
      >
        <source src={src} type="video/mp4" />
      </video>
    </figure>
  );
}
