"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { MEDIA, SIZES } from "@/lib/media";
import { gsap, ScrollTrigger, useIsoLayoutEffect } from "@/lib/motion";

const BEATS = [
  {
    time: "10:02",
    step: "Consultation",
    title: "Two minutes before the clippers touch down.",
    copy: "Length, texture, what's not working right now — Baggio or Rahul talks it through before a single cut, not after.",
  },
  {
    time: "10:09",
    step: "The cut",
    title: "Dialled to your hair's grain, not a guard number.",
    copy: "Skin fades, tapers, scissor work — afro, Asian or Caucasian hair, cut with the pattern it actually grows in.",
  },
  {
    time: "10:24",
    step: "The detail",
    title: "The five minutes that make it look intentional.",
    copy: "Lineups, edge-ups, a hot towel finish. The difference between a haircut and a good haircut.",
  },
  {
    time: "10:31",
    step: "Out the chair",
    title: "Mirror check, brush down, done.",
    copy: "No rush, no small talk you didn't ask for. Unhurried the whole way through.",
  },
];

/**
 * The one condition under which this section scrubs, shared verbatim by the CSS
 * (as `motion-safe:md:`) and by gsap.matchMedia below. `48rem` rather than
 * `768px` to match Tailwind's `md` byte for byte — a media query resolves `rem`
 * against the initial root font size, so the two are the same 768px regardless
 * of any html font-size.
 *
 * MOBILE IS DELIBERATELY EXCLUDED, on three counts:
 *   1. iOS Safari's programmatic `currentTime` seeking on an unplayed video is
 *      unreliable, so the mechanic's whole payload is the thing most likely to
 *      silently not happen.
 *   2. The URL bar collapsing resizes the viewport, which fights a pin.
 *   3. Decoding 1080p while seeking every frame is the most expensive thing on
 *      the page, on the weakest hardware, for a decorative effect.
 * A phone gets the stacked list instead — the same content, no pin, no video.
 */
const SCRUB_QUERY = "(prefers-reduced-motion: no-preference) and (min-width: 48rem)";

/** hero-2 is 24fps (ffprobe: r_frame_rate=24/1). One frame = the seek quantum. */
const FRAME = 1 / 24;

/**
 * "The Chair, Start to Finish" — the four beats over hero-2.mp4, whose playback
 * position is scrubbed from scroll rather than played. It is 14s of one
 * continuous cut, so advancing the scroll advances the actual haircut: the video
 * IS the timeline.
 *
 * WHY SEEKING IS SAFE HERE (it is normally a jank generator):
 * hero-2 was re-encoded with a keyframe every 0.5s at 24fps, so any seek decodes
 * at most 12 frames from the preceding keyframe. Combined with the two guards in
 * `seek()` below it holds 60fps at 6x CPU throttle — see the notes there.
 *
 * `video.currentTime` is not a CSS property, so it is outside the house
 * transform/opacity rule by nature: there is no compositor path for "show a
 * different frame". The rule's intent — never write layout/paint properties per
 * frame — is honoured instead by rate-limiting the write to one per *video*
 * frame and never issuing a seek while one is in flight. Everything else this
 * section animates (beats, rail fill) is transform/opacity only.
 *
 * REDUCED MOTION / MOBILE: no pin, no scrub, no video element at all. The base
 * markup IS the final state — all four beats in flow over a static still — so
 * those visitors land on a finished section rather than a broken one, and the
 * layout switch is pure CSS (`motion-safe:md:`), never JS. Branching the markup
 * in render would be a hydration mismatch; branching it in an effect would pop
 * the section in after hydration and invalidate every ScrollTrigger below it.
 */
export function Process() {
  const section = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const railFill = useRef<HTMLDivElement>(null);

  /**
   * Whether to put a <video> in the DOM at all. This is a fetch decision, so CSS
   * cannot make it: a <video> hidden by a media query still downloads, and
   * <source media> is evaluated once at load and never re-evaluated. Same
   * construction as <HeroVideo />, and live rather than one-shot — the listener
   * keeps it in step with gsap.matchMedia, which is watching the same query.
   */
  const [scrubbable, setScrubbable] = useState(false);
  useEffect(() => {
    const q = window.matchMedia(SCRUB_QUERY);
    const sync = () => setScrubbable(q.matches);
    sync();
    q.addEventListener("change", sync);
    return () => q.removeEventListener("change", sync);
  }, []);

  useIsoLayoutEffect(() => {
    const mm = gsap.matchMedia(section);

    mm.add(SCRUB_QUERY, () => {
      const beats = gsap.utils.toArray<HTMLElement>(".p-beat", section.current);
      const dots = gsap.utils.toArray<HTMLElement>(".p-dot", section.current);
      const fill = railFill.current;
      const vid = video.current;
      if (!beats.length || !stage.current) return;

      gsap.set(beats.slice(1), { autoAlpha: 0, y: 24 });
      gsap.set(beats[0], { autoAlpha: 1, y: 0 });
      gsap.set(fill, { scaleX: 0 });

      // --- video scrub ---
      // The latest scroll progress, written by onUpdate and read by the ticker.
      // The two are deliberately decoupled: onUpdate can fire several times per
      // frame (and not at all between frames), and a seek issued per scroll
      // event rather than per rendered frame is the naive version that stutters.
      let progress = 0;
      let lastWritten = -1;
      let duration = 0;

      const readDuration = () => {
        // Never trust `duration` before metadata: it is NaN until then, and NaN
        // would poison every subsequent seek.
        if (vid && Number.isFinite(vid.duration) && vid.duration > 0) duration = vid.duration;
      };

      const seek = () => {
        if (!vid || !duration) return;
        // HAVE_CURRENT_DATA. Below this there is no frame to swap to and the
        // seek would queue up behind the buffer rather than land.
        if (vid.readyState < 2) return;
        // A seek is already decoding. Writing currentTime now cancels it and
        // restarts the walk from the keyframe — this single guard is the
        // difference between a smooth scrub and a slideshow under throttle.
        if (vid.seeking) return;
        // Clamped a frame short of the end: seeking to exactly `duration` is
        // flaky across browsers and can fire `ended` on a non-looping element.
        const t = Math.min(progress * duration, duration - FRAME);
        // A sub-frame delta cannot change the displayed frame, so the decode it
        // would cost buys nothing.
        if (Math.abs(t - lastWritten) < FRAME) return;
        lastWritten = t;
        vid.currentTime = t;
      };

      if (vid) {
        // Belt and braces — there is no `autoplay`, but a paused element is the
        // precondition for seeking to mean anything.
        vid.pause();
        readDuration();
        vid.addEventListener("loadedmetadata", readDuration);
        gsap.ticker.add(seek);
      }

      let current = -1;
      ScrollTrigger.create({
        trigger: section.current,
        start: "top top",
        end: "bottom bottom",
        pin: stage.current,
        // `scrub: true`, never a number. Lenis already smooths the scroll
        // position ScrollTrigger reads, so a numeric scrub stacks a second lag
        // and the footage visibly trails the page (same call as <HeroParallax />
        // and <CutTransition />).
        scrub: true,
        onUpdate: (self) => {
          progress = self.progress;
          // Transform only, and cheap enough to run unguarded every frame.
          if (fill) gsap.set(fill, { scaleX: self.progress });

          // floor(p * n), not round(p * (n-1)): this gives every beat an equal
          // quarter of the scroll (round() hands the first and last a half
          // share), and it puts the boundary between beat i-1 and beat i at
          // exactly i/n — which is where the rail's dots sit, so the fill head
          // crosses a dot at the instant that beat takes over.
          const idx = Math.min(BEATS.length - 1, Math.floor(self.progress * BEATS.length));
          // The live site re-tweened all 12 elements on every scrub frame. Bail
          // unless the active beat actually changed.
          if (idx === current) return;
          current = idx;

          beats.forEach((b, i) =>
            gsap.to(b, {
              autoAlpha: i === idx ? 1 : 0,
              y: i === idx ? 0 : i < idx ? -16 : 24,
              duration: 0.35,
              overwrite: true,
            }),
          );
          dots.forEach((d, i) =>
            gsap.to(d, {
              // DOCUMENTED EXCEPTION to transform/opacity-only: backgroundColor
              // is a paint property. It is four 10px dots that repaint only when
              // the beat index changes (never per scroll frame, thanks to the
              // bail above), so the layered-dot alternative would double the DOM
              // to save a repaint too small to measure.
              backgroundColor: i <= idx ? "var(--color-brass)" : "var(--color-line)",
              scale: i === idx ? 1.4 : 1,
              duration: 0.3,
              overwrite: true,
            }),
          );
        },
      });

      // The ScrollTrigger and every gsap.set/to above are collected by the
      // matchMedia context and reverted for us. The ticker callback and the DOM
      // listener are not — GSAP has no way to know about them, and a ticker
      // callback that outlives the section would seek a detached element on
      // every frame for the rest of the session.
      return () => {
        if (!vid) return;
        gsap.ticker.remove(seek);
        vid.removeEventListener("loadedmetadata", readDuration);
      };
    });

    // Reverts the pin too — a pinned section that skips this leaves its
    // pin-spacer div behind and every trigger below it measures against a ghost.
    return () => mm.revert();
  }, [scrubbable]);

  return (
    <section
      id="process"
      ref={section}
      className="bg-ink-deep relative motion-safe:md:h-[calc(var(--p-beats)*100vh)]"
      // The scroll length is one viewport per beat, kept live against BEATS
      // rather than hardcoded as `400vh`. It goes through a custom property
      // because the height must be media-query-scoped (an inline height would
      // apply on mobile too, where there is no pin to fill it).
      style={{ "--p-beats": BEATS.length } as React.CSSProperties}
    >
      {/*
       * Pinned on desktop; on mobile/reduced-motion it is an ordinary block whose
       * height comes from the beat list inside it. Either way the media below is
       * absolutely positioned within it, so neither the video nor the still can
       * reflow anything when it loads — there is nothing below them to push.
       */}
      <div
        ref={stage}
        className="relative overflow-hidden motion-safe:md:h-[100svh]"
        // Reserves the box before the media arrives in the one case where the
        // stage would otherwise be empty: mobile, where the still is the only
        // thing painting and the beats sit over it.
      >
        <div className="bg-ink-deep absolute inset-0">
          {scrubbable ? (
            /*
             * NOT autoplay, NOT loop — the scroll is the transport. preload="auto"
             * because it cannot seek smoothly through a buffer it does not have;
             * the bytes are free regardless, since the hero already autoplays this
             * exact URL and the browser serves both elements from one download.
             *
             * `poster` paints the first frame while the buffer fills, so the stage
             * is never empty. It is hero-poster.jpg — the video's own frame — so
             * the handoff to the real footage is invisible.
             */
            <video
              ref={video}
              className="absolute inset-0 h-full w-full object-cover"
              poster={MEDIA.heroLoop.poster}
              muted
              playsInline
              preload="auto"
              aria-hidden
            >
              <source src={MEDIA.heroLoop.src} type="video/mp4" />
            </video>
          ) : (
            /*
             * The stacked path's still. cutting.jpg rather than the video's own
             * poster because this path is overwhelmingly phones: a portrait 896x1200
             * covers a tall narrow box with room to spare, where a 16:9 frame would
             * crop to a slim centre column and lose the barber entirely. Desktop
             * reduced-motion gets the known ~1.6x upscale, cropped to the middle
             * band — which is where the action is.
             *
             * Lazy (next/image's default), which is what keeps it honest: the
             * section is far below the fold, so by the time it could load the
             * scrubbable check has long since run and unmounted it on desktop.
             * Only the phones that actually use it ever fetch it.
             */
            <Image
              src={MEDIA.cutting.src}
              alt=""
              fill
              sizes={SIZES.fullBleed}
              className="object-cover object-center"
              aria-hidden
            />
          )}
        </div>

        {/*
         * TWO overlay treatments, one per layout, because the two layouts put the
         * copy in completely different places and a single gradient cannot serve
         * both.
         *
         * Scrubbing (below): v2's hero vignette verbatim (radial, ellipse at
         * 30% 40%) plus a bottom ramp. The footage is a locked-off wide shot with
         * the barber working centre-right and the left third an empty wall, and
         * one beat at a time sits in that empty corner — so the vignette settles
         * the edges and the ramp buys that corner its contrast, both without
         * touching the action. Art direction, and it depends on knowing exactly
         * where the words are.
         */}
        <div
          className="absolute inset-0 hidden motion-safe:md:block"
          style={{
            background:
              "radial-gradient(ellipse at 30% 40%, transparent 0%, var(--color-ink-deep) 78%)",
          }}
          aria-hidden
        />
        <div
          className="from-ink-deep via-ink-deep/60 to-ink-deep/25 absolute inset-0 hidden bg-gradient-to-t motion-safe:md:block"
          aria-hidden
        />
        {/*
         * Stacked: all four beats run the full height of the still, so there is no
         * empty corner to aim at and the gradients above would leave copy sitting
         * on the brightest part of the frame — measured, not assumed: the body
         * text was unreadable over the middle of cutting.jpg at 390px. A flat
         * scrim instead. It demotes the photo to texture, which is the honest
         * trade on a phone: it cannot be both legible background and visible
         * subject, and the words are the reason the section exists.
         */}
        <div className="bg-ink-deep/80 absolute inset-0 motion-safe:md:hidden" aria-hidden />

        <div className="relative z-10 mx-auto flex max-w-[1240px] flex-col px-[clamp(20px,4vw,48px)] py-24 motion-safe:md:h-full motion-safe:md:justify-end motion-safe:md:pt-0">
          <div className="eyebrow sec-eyebrow">The Chair, Start to Finish</div>

          {/*
           * Desktop: a fixed-height stage with the beats absolutely stacked, so it
           * must reserve the tallest one or the rail below it jumps between beats.
           * Mobile/reduced-motion: the same four beats in flow, spaced — which is
           * the base state, so it needs no JS to be correct.
           */}
          <div className="mt-4 space-y-12 motion-safe:md:relative motion-safe:md:h-[260px] motion-safe:md:space-y-0">
            {BEATS.map((b) => (
              <div
                key={b.step}
                className="p-beat max-w-2xl motion-safe:md:absolute motion-safe:md:inset-x-0 motion-safe:md:top-0"
              >
                <p className="font-ticket text-brass text-3xl tracking-[0.08em]">{b.time}</p>
                {/* The step name lives in the rail on desktop; the rail is gone on
                    the stacked path, so it comes back here instead. */}
                <p className="font-mono text-steel mt-1 text-[10.5px] tracking-[0.2em] uppercase motion-safe:md:hidden">
                  {b.step}
                </p>
                <h3 className="font-display mt-1 text-[clamp(26px,3.6vw,48px)] leading-[1.05] font-bold uppercase">
                  {b.title}
                </h3>
                <p className="text-steel mt-3 max-w-lg text-[15px]">{b.copy}</p>
              </div>
            ))}
          </div>

          {/*
           * The rail belongs to the scrub: it reports scroll position, and with no
           * scroll to report (every beat already on screen) it would be four lit
           * dots saying nothing. The stacked path drops it and labels each beat
           * directly instead.
           */}
          <div className="relative mt-10 hidden motion-safe:md:block">
            <div className="bg-line absolute inset-x-0 top-[5px] h-px" aria-hidden />
            <div
              ref={railFill}
              className="bg-brass absolute inset-x-0 top-[5px] h-px origin-left scale-x-0"
              aria-hidden
            />
            <ol className="relative flex">
              {BEATS.map((b) => (
                // flex-1 puts each dot at the start of its own quarter — 0%, 25%,
                // 50%, 75% — which is exactly where floor(p * n) switches beats.
                <li key={b.step} className="flex flex-1 flex-col gap-2.5">
                  {/* The ring punches the track out from behind the dot so the
                      fill reads as running up to it rather than through it. */}
                  <span className="p-dot bg-line ring-ink-deep h-2.5 w-2.5 rounded-full ring-4" />
                  <span className="font-mono text-steel text-[10.5px] tracking-[0.2em] uppercase">
                    {b.step}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
