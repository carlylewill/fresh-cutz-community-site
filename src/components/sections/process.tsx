"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { MEDIA, SIZES } from "@/lib/media";
import { gsap, ScrollTrigger, useIsoLayoutEffect } from "@/lib/motion";

/**
 * One clip per beat, and they are four genuinely different scenes — the whole
 * point of this section is that it is not the same footage four times. Verified
 * pairwise rather than assumed: the closest pair differs by 44.5 mean luma,
 * against the 0.61 that exposed the duplicate this section used to ship.
 *
 * The mapping is semantic: `processArrive` is the walk-in with the shopfront
 * sign (it reads as *arriving*, which is what Consultation is), `processCut` is
 * clippers on the hairline, `processDetail` is close work, `processFinish` is
 * the spray-down.
 *
 * `still` is the sharp 9:16 original, not a frame of the blur-filled clip — see
 * lib/media.ts. It is what the stacked path shows.
 */
const BEATS = [
  {
    time: "10:02",
    step: "Consultation",
    title: "Two minutes before the clippers touch down.",
    copy: "Length, texture, what's not working right now — Baggio or Rahul talks it through before a single cut, not after.",
    media: MEDIA.processArrive,
    still: MEDIA.processArriveStill,
    mobile: MEDIA.processArriveMobile,
    alt: "A client arriving at Fresh Cutz Barbers in Wealdstone, Harrow",
  },
  {
    time: "10:09",
    step: "The cut",
    title: "Dialled to your hair's grain, not a guard number.",
    copy: "Skin fades, tapers, scissor work — afro, Asian or Caucasian hair, cut with the pattern it actually grows in.",
    media: MEDIA.processCut,
    still: MEDIA.processCutStill,
    mobile: MEDIA.processCutMobile,
    alt: "A barber running clippers along a client's hairline at Fresh Cutz Barbers",
  },
  {
    time: "10:24",
    step: "The detail",
    title: "The five minutes that make it look intentional.",
    copy: "Lineups, edge-ups, a hot towel finish. The difference between a haircut and a good haircut.",
    media: MEDIA.processDetail,
    still: MEDIA.processDetailStill,
    mobile: MEDIA.processDetailMobile,
    alt: "Close detail work on a fresh cut at Fresh Cutz Barbers",
  },
  {
    time: "10:31",
    step: "Out the chair",
    title: "Mirror check, brush down, done.",
    copy: "No rush, no small talk you didn't ask for. Unhurried the whole way through.",
    media: MEDIA.processFinish,
    still: MEDIA.processFinishStill,
    mobile: MEDIA.processFinishMobile,
    alt: "A barber finishing a client's cut at Fresh Cutz Barbers",
  },
];

/**
 * The one condition under which this section pins and plays, shared verbatim by
 * the CSS (as `motion-safe:md:`) and by gsap.matchMedia below. `48rem` rather
 * than `768px` to match Tailwind's `md` byte for byte — a media query resolves
 * `rem` against the initial root font size, so the two are the same 768px
 * regardless of any html font-size.
 *
 * MOBILE IS DELIBERATELY EXCLUDED from the pin: the URL bar collapsing resizes
 * the viewport and fights it, and four video decoders on the weakest hardware
 * for a decorative effect is the wrong trade. A phone gets the same four beats
 * as a stacked list, each with its own sharp portrait still — the per-step story
 * survives at full quality, it just doesn't move, and Process costs a phone zero
 * video bytes. A list cannot read as "stuck": nothing is holding the scroll.
 */
const PLAY_QUERY = "(prefers-reduced-motion: no-preference) and (min-width: 48rem)";

/**
 * Crossfade width, in units of one beat's quarter. A beat fades out over the
 * last 18% of its own quarter while the next fades in over the same window, so
 * the two always sum to ~1 and there is never a gap to see through.
 */
const FADE = 0.18;

/** How far a beat's copy drifts across its own quarter, in px. See `presence`. */
const DRIFT = 56;

/**
 * A beat's opacity as a function of `d` — where it sits in its own quarter, in
 * quarters. d=0 is the start of its quarter, d=1 the end, d<0 means the previous
 * beat is still on screen.
 *
 * Pure function of scroll position and nothing else, which is the whole point:
 * it is what makes 1->0 reverse for free.
 */
function presence(d: number): number {
  if (d <= -FADE || d >= 1) return 0;
  if (d < 0) return (d + FADE) / FADE; // fading in, over the previous beat's tail
  if (d > 1 - FADE) return (1 - d) / FADE; // fading out, as the next one fades in
  return 1;
}

/**
 * "The Chair, Start to Finish" — four beats, four different clips, pinned, each
 * clip full-bleed behind its own step text.
 *
 * EVERYTHING VISUAL IS A PURE FUNCTION OF `self.progress`, and that is a fix
 * rather than a preference. This section previously drove the beats from
 * `floor(p*n)` alone, guarded by a bail-unless-the-index-changed. The guard is a
 * real optimisation — it stops 12 tweens being constructed every scroll frame —
 * but combined with a discrete index it meant that *within* a beat the only
 * scroll-linked thing on screen was a 1px rail hairline. For 25% of the scroll
 * the page ate your scrolling and gave nothing back, then everything moved at
 * once at the boundary. Users read that, correctly, as "stuck, then it all
 * happens at the end".
 *
 * So the split is now by cost, not by convenience:
 *   - Per frame, as gsap.set (cheap — a direct style write, no tween object):
 *     rail fill, and every beat's opacity and drift. These are continuous, so
 *     scrolling always visibly moves something, and scrolling back up runs the
 *     whole thing backwards with no extra code.
 *   - On beat change only, still bailed: play/pause and the dot colours. These
 *     are the genuinely discrete, genuinely expensive ones.
 *
 * WHY THESE PLAY RATHER THAN SCRUB. An earlier build seeked one long clip's
 * `currentTime` from scroll, which worked only because that clip was re-encoded
 * with a keyframe every 0.5s. These four have 1-2 keyframes in the entire file
 * (`proc-2-cut`: 2 across 422 frames), so every seek would decode from frame 0 —
 * hundreds of frames per scroll tick. They also run at three different frame
 * rates (24/30/25) and from 2.2s to 14.1s, so a per-beat seek would scrub at
 * four different speeds for no reason.
 *
 * REDUCED MOTION / MOBILE: no pin, no scrub, no video. The base markup IS the
 * final state — four beats in flow, each with its own still — so those visitors
 * land on a finished section, and the layout switch is pure CSS
 * (`motion-safe:md:`), never JS. Branching the markup in render would be a
 * hydration mismatch; branching it in an effect would pop the section in after
 * hydration and invalidate every ScrollTrigger below it.
 */
export function Process() {
  const section = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const railFill = useRef<HTMLDivElement>(null);
  const videos = useRef<(HTMLVideoElement | null)[]>([]);
  const mobileVideos = useRef<(HTMLVideoElement | null)[]>([]);

  /**
   * Whether to put <video> elements in the DOM at all. This is a fetch decision,
   * so CSS cannot make it: a <video> hidden by a media query still downloads,
   * and <source media> is evaluated once at load and never re-evaluated. It also
   * gates the stills the other way, so the two media sets are never both in the
   * document. Live rather than one-shot — the listener keeps it in step with
   * gsap.matchMedia, which is watching the same query.
   */
  const [playable, setPlayable] = useState(false);
  useEffect(() => {
    const q = window.matchMedia(PLAY_QUERY);
    const sync = () => setPlayable(q.matches);
    sync();
    q.addEventListener("change", sync);
    return () => q.removeEventListener("change", sync);
  }, []);

  /**
   * The STACKED path's video playback. Mirrors the desktop byte budget on a
   * phone: each beat renders a <video preload="none"> with no src, sitting over
   * its poster still, and this effect is the only thing that ever gives it a src
   * or presses play — so a beat that never scrolls near the viewport fetches zero
   * video bytes, and Process costs a phone one clip at a time rather than ~4MB of
   * eager decoders.
   *
   * Only runs on the stacked path (`!playable`), and only when motion is allowed:
   * a reduced-motion visitor is `!playable` too, and they must keep the still and
   * fetch nothing — so we bail before setting any src, leaving the empty <video>
   * inert over its poster. Keeping the <video> in the markup either way is what
   * lets the render stay a pure function of `playable` (no per-visitor branch to
   * mismatch on hydration); this effect, not the markup, is where the video comes
   * alive.
   *
   * `rootMargin: 600px` warms the beat one screenful early and plays at most the
   * in-view beat plus its neighbour, never all four — one or two decoders, which
   * is the whole point of not eager-loading. IntersectionObserver rather than a
   * scroll listener so the browser does the intersection maths off the main
   * thread.
   */
  useEffect(() => {
    if (playable) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const els = mobileVideos.current.filter((v): v is HTMLVideoElement => v != null);
    if (!els.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const v = entry.target as HTMLVideoElement;
          if (entry.isIntersecting) {
            // First time near view: give it its src and warm it. `preload="none"`
            // plus no initial src means nothing was fetched until exactly here.
            if (!v.getAttribute("src") && v.dataset.src) {
              v.src = v.dataset.src;
              v.load();
            }
            void v.play().catch(() => {});
          } else {
            // Scrolled away: pause so no off-screen decoder keeps running. The
            // already-fetched bytes stay buffered, so scrolling back is instant.
            v.pause();
          }
        }
      },
      { rootMargin: "600px 0px" },
    );

    els.forEach((v) => io.observe(v));
    return () => {
      io.disconnect();
      // A <video> left playing behind a switched-away path decodes forever.
      els.forEach((v) => v.pause());
    };
  }, [playable]);

  useIsoLayoutEffect(() => {
    const mm = gsap.matchMedia(section);

    mm.add(PLAY_QUERY, () => {
      const beats = gsap.utils.toArray<HTMLElement>(".p-beat", section.current);
      const media = gsap.utils.toArray<HTMLElement>(".p-media", section.current);
      const dots = gsap.utils.toArray<HTMLElement>(".p-dot", section.current);
      const fill = railFill.current;
      if (!beats.length || !stage.current) return;

      gsap.set(fill, { scaleX: 0 });

      /**
       * Warmed at most once each: preload="none" means nothing is fetched until
       * we ask, which is the whole byte budget of this section.
       *
       * `load()` is NOT free — it resets the element and re-runs resource
       * selection on the main thread. Calling it from onUpdate (during the
       * pinned scroll) measured a 175ms spike, so it happens here instead, off
       * the scroll path, from the approach trigger below.
       */
      const warmed = new Set<number>();
      const warm = (i: number) => {
        const v = videos.current[i];
        if (!v || warmed.has(i)) return;
        warmed.add(i);
        v.preload = "auto";
        v.load();
        // NO decoder pre-roll, and that is measured rather than an omission.
        // Each clip start costs 2-3 rAF frames of ~33ms even at readyState 4,
        // and both fixes were worse: play/pause/rewind knocked readyState from 4
        // back to 2 and cost a 166ms stall (on files with 1-2 keyframes even the
        // seek to frame 0 dumps the buffer), and priming without the rewind
        // moved 9 spikes to 8, i.e. noise. The spin-up is inherent to starting
        // playback and is not main-thread bound — it gets *rarer* under CPU
        // throttle, and longtask reports zero.
      };

      let idleHandle = 0;
      let idleTimer = 0;
      const warmQueue = BEATS.map((_, i) => i);
      const drain = () => {
        const i = warmQueue.shift();
        if (i === undefined) return;
        warm(i);
        // 400ms, not 1200: at 1200 per clip the queue took up to ~4.8s to drain
        // and a visitor scrolling in at a normal pace hit beats whose clip had
        // not started loading — they saw one clip and three dark boxes, and only
        // on the way back up were all four warm. The timeout is the ceiling, not
        // the target; idle slots usually fire far sooner.
        if (typeof requestIdleCallback === "function") {
          idleHandle = requestIdleCallback(drain, { timeout: 400 });
        } else {
          idleTimer = window.setTimeout(drain, 120);
        }
      };

      let current = -1;
      ScrollTrigger.create({
        trigger: section.current,
        start: "top top",
        end: "bottom bottom",
        pin: stage.current,
        // `scrub: true`, never a number. Lenis already smooths the scroll
        // position ScrollTrigger reads, so a numeric scrub stacks a second lag
        // and the rail visibly trails the page (same call as <HeroParallax />
        // and <CutTransition />).
        scrub: true,
        onUpdate: (self) => {
          const raw = self.progress * BEATS.length;

          // ---- continuous, every frame: transform/opacity only, via gsap.set
          // so no tween object is constructed. This is what makes the pin feel
          // connected to the scroll instead of frozen.
          if (fill) gsap.set(fill, { scaleX: self.progress });
          beats.forEach((b, i) => {
            const d = raw - i;
            // The copy drifts up through its own quarter and hands over to the
            // next one already moving — so there is always something responding
            // to the wheel, at every scroll position, in both directions.
            gsap.set(b, { autoAlpha: presence(d), y: (0.5 - d) * DRIFT });
          });
          media.forEach((m, i) => gsap.set(m, { autoAlpha: presence(raw - i) }));

          // ---- discrete, on beat change only
          // `raw + FADE` rather than `raw`: a clip must start playing the moment
          // it starts fading IN, not when it finishes. Switching at the boundary
          // would fade a frozen frame up over ~135px of scroll and then start it
          // — which is its own little "stuck, then it moves". The outgoing clip
          // pauses at the same instant, so exactly one decoder is ever running.
          const idx = Math.min(BEATS.length - 1, Math.floor(raw + FADE));
          if (idx === current) return;
          current = idx;

          videos.current.forEach((v, i) => {
            if (!v) return;
            if (i === idx) void v.play().catch(() => {});
            else v.pause();
          });
          dots.forEach((d, i) =>
            gsap.to(d, {
              // DOCUMENTED EXCEPTION to transform/opacity-only: backgroundColor
              // is a paint property. Four 10px dots, repainted only when the
              // beat index changes — the layered-dot alternative would double the
              // DOM to save a repaint too small to measure. Kept behind the bail
              // for exactly that reason.
              backgroundColor: i <= idx ? "var(--color-brass)" : "var(--color-line)",
              scale: i === idx ? 1.4 : 1,
              duration: 0.3,
              overwrite: "auto",
            }),
          );
        },
      });

      // 1.5 viewports of warning, and beats 1-2 warmed synchronously rather than
      // through the queue: this fires during ordinary scrolling, nowhere near the
      // pin, so it can afford the load() calls the pinned scroll cannot. Beat 1
      // is on screen the instant the section pins and cannot wait for an idle
      // slot. Anyone who never scrolls this far still pays nothing.
      const prefetch = ScrollTrigger.create({
        trigger: section.current,
        start: "top bottom+=150%",
        once: true,
        onEnter: () => {
          warm(0);
          warm(1);
          drain();
        },
      });

      // The ScrollTriggers and every gsap.set/to above are collected by the
      // matchMedia context and reverted for us. These are not: a <video> left
      // playing behind a reverted section decodes forever, and a queued idle
      // callback would warm clips for a section that no longer exists.
      return () => {
        prefetch.kill();
        if (idleHandle && typeof cancelIdleCallback === "function") cancelIdleCallback(idleHandle);
        if (idleTimer) clearTimeout(idleTimer);
        videos.current.forEach((v) => v?.pause());
      };
    });

    // Reverts the pin too — a pinned section that skips this leaves its
    // pin-spacer div behind and every trigger below it measures against a ghost.
    return () => mm.revert();
  }, [playable]);

  return (
    <section
      id="process"
      ref={section}
      className="bg-ink-deep relative motion-safe:md:h-[calc(var(--p-beats)*(100dvh-var(--nav-h,64px)))]"
      // The scroll length is one viewport per beat, kept live against BEATS
      // rather than hardcoded as `400vh`. It goes through a custom property
      // because the height must be media-query-scoped (an inline height would
      // apply on mobile too, where there is no pin to fill it).
      style={{ "--p-beats": BEATS.length } as React.CSSProperties}
    >
      {/* Pinned on desktop; on mobile/reduced-motion an ordinary block whose
          height comes from the beat list inside it. */}
      {/* One SCROLLER viewport, not one browser viewport. The pinned stage lives
          inside #scroller, which is shorter than the window by the header — at
          100svh the bottom of every beat would be pinned out of sight. Section
          height stays exactly one stage per beat so the scrub still maps 1:1. */}
      <div
        ref={stage}
        className="relative overflow-hidden motion-safe:md:h-[calc(100dvh-var(--nav-h,64px))]"
      >
        {/*
         * The full-bleed clips, one per beat, stacked and crossfaded in place.
         * Only on the playing path — the stacked path carries its own portrait
         * stills inside each beat, so the two media sets are never both in the
         * document and a phone fetches none of this.
         */}
        {playable ? (
          <div className="absolute inset-0" aria-hidden>
            {BEATS.map((b, i) => (
              <div key={b.step} className="p-media absolute inset-0">
                {/*
                 * The poster is NOT optional decoration — it is why a beat is
                 * never a blank box. `preload="none"` means a clip has no frame
                 * to show until it is warmed, and a video with nothing decoded
                 * paints transparent; without this the early beats were dark
                 * rectangles until their clip arrived. next/image is used rather
                 * than the <video poster> attribute so these are re-encoded and
                 * sized (the attribute would serve the raw 1920x1080 JPEG, ~390KB
                 * across the four). They are lazy, but every one of them is
                 * inside the viewport the moment the section is, so they all
                 * arrive together and ahead of the clips.
                 */}
                <Image
                  src={b.media.poster}
                  alt=""
                  fill
                  sizes={SIZES.fullBleed}
                  className="object-cover"
                />
                <video
                  ref={(el) => {
                    videos.current[i] = el;
                  }}
                  className="absolute inset-0 h-full w-full object-cover"
                  muted
                  playsInline
                  loop
                  preload="none"
                >
                  <source src={b.media.src} type="video/mp4" />
                </video>
              </div>
            ))}
          </div>
        ) : null}

        {/*
         * The scrim, and it is the playing path's alone. The stacked path puts
         * its copy on solid ink beside a still, so it has no image behind text to
         * fight and a scrim there would only mute the photo for nothing.
         *
         * v2's hero vignette verbatim (radial, ellipse at 30% 40%) plus a bottom
         * ramp. Both earn their place: the beats sit bottom-left, the blur-filled
         * wings are already soft there, and the sharp action is centre — so the
         * vignette settles the frame and the ramp buys the copy its contrast
         * without either one covering the barber.
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
          className="from-ink-deep via-ink-deep/70 to-ink-deep/30 absolute inset-0 hidden bg-gradient-to-t motion-safe:md:block"
          aria-hidden
        />

        <div className="relative z-10 mx-auto flex h-full max-w-[1240px] flex-col justify-center px-[clamp(20px,4vw,48px)] py-14 motion-safe:md:justify-end motion-safe:md:pt-0 motion-safe:md:pb-24">
          <div className="eyebrow sec-eyebrow">The Chair, Start to Finish</div>

          {/*
           * Desktop: a fixed-height box with the beats absolutely stacked, so it
           * must reserve the tallest one or the rail below it jumps between
           * beats. Mobile/reduced-motion: the same four beats in flow — the base
           * state, so it needs no JS to be correct.
           */}
          <div className="mt-6 space-y-16 motion-safe:md:relative motion-safe:md:mt-4 motion-safe:md:h-[260px] motion-safe:md:space-y-0">
            {BEATS.map((b, i) => (
              <div
                key={b.step}
                className="p-beat motion-safe:md:absolute motion-safe:md:inset-x-0 motion-safe:md:top-0 motion-safe:md:max-w-2xl"
              >
                {/*
                 * The stacked path's clip. `aspect-[9/16]` reserves the box before
                 * a byte arrives, so nothing here reflows the beats below it as the
                 * poster or the video decodes. Only in the DOM when the landscape
                 * clips are not, so desktop never fetches these and the two media
                 * sets are never both in the document.
                 *
                 * The poster still sits UNDERNEATH the video (same pattern as the
                 * desktop path): a <video preload="none"> with no src has no frame
                 * to show and paints transparent, so the still is what fills the box
                 * until the clip decodes — the box is never blank. The <video> is
                 * always here in the markup but inert (no src) until the
                 * IntersectionObserver above warms it; a reduced-motion visitor
                 * keeps the still and it stays empty.
                 */}
                {!playable ? (
                  // Centred, and larger on the stacked path — it was left-aligned
                  // at 220px with a wide black gutter to its right on a phone.
                  <div className="ring-line relative mx-auto mb-6 aspect-[9/16] w-full max-w-[300px] overflow-hidden rounded-md bg-black/40 ring-1">
                    <Image
                      src={b.still.src}
                      alt={b.alt}
                      width={b.still.width}
                      height={b.still.height}
                      sizes={SIZES.processPanel}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                    <video
                      ref={(el) => {
                        mobileVideos.current[i] = el;
                        // Set imperatively rather than as JSX props: keeps them off
                        // the typed intrinsic element (x-webkit-airplay is not a
                        // standard attribute) while still reaching the DOM. Both
                        // suppress the iOS AirPlay control on an inline decorative
                        // loop that should never route to a TV.
                        if (el) {
                          el.disableRemotePlayback = true;
                          el.setAttribute("x-webkit-airplay", "deny");
                        }
                      }}
                      className="absolute inset-0 h-full w-full object-cover"
                      // muted + playsInline is what lets iOS autoplay inline at all;
                      // loop so a 2-5s beat keeps running. No src and preload="none"
                      // so nothing loads until the observer sets data-src.
                      muted
                      playsInline
                      loop
                      preload="none"
                      data-src={b.mobile.src}
                      aria-hidden
                    />
                  </div>
                ) : null}

                <p className="font-ticket text-brass mt-2 text-3xl tracking-[0.08em]">{b.time}</p>
                {/* The step name lives in the rail on desktop; the rail is gone
                    on the stacked path, so it comes back here instead. */}
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
           * The rail belongs to the scrub: it reports scroll position, and with
           * no scroll to report (every beat already on screen) it would be four
           * lit dots saying nothing. The stacked path drops it and labels each
           * beat directly instead.
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
