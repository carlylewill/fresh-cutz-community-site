"use client";

import { useRef } from "react";
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

/** One clip per beat, parallel to BEATS, so the story cycles real footage. */
const MEDIA = [
  {
    src: "/videos/gallery-station.mp4",
    poster: "/videos/gallery-station-poster.jpg",
    alt: "The tool station at Fresh Cutz Barbers before a cut",
  },
  {
    src: "/videos/process-cut.mp4",
    poster: "/videos/process-cut-poster.jpg",
    alt: "Baggio cutting a client's hair at Fresh Cutz Barbers",
  },
  {
    src: "/videos/process-detail.mp4",
    poster: "/videos/process-detail-poster.jpg",
    alt: "Detail work on a fresh cut at Fresh Cutz Barbers",
  },
  {
    src: "/videos/gallery-finish.mp4",
    poster: "/videos/gallery-finish-poster.jpg",
    alt: "Finishing touches on a fresh cut at Fresh Cutz Barbers",
  },
];

/**
 * Portrait phone footage in a landscape frame: a blurred, scaled copy fills the
 * edges so the sharp centre copy never crops the subject.
 */
function CinematicVideo({ src, poster, alt }: { src: string; poster: string; alt: string }) {
  return (
    <div className="bg-ink absolute inset-0 overflow-hidden">
      <video
        className="absolute inset-0 h-full w-full scale-110 object-cover object-center blur-3xl brightness-[0.45] saturate-150"
        autoPlay
        muted
        loop
        playsInline
        poster={poster}
        aria-hidden
      >
        <source src={src} type="video/mp4" />
      </video>
      <video
        className="absolute inset-0 h-full w-full object-contain"
        poster={poster}
        autoPlay
        muted
        loop
        playsInline
        preload="none"
        aria-label={alt}
      >
        <source src={src} type="video/mp4" />
      </video>
    </div>
  );
}

/**
 * The pinned 4-beat story. Mechanic carried over from the live site; the styling
 * is v2 (Oswald beats, mono step labels, brass rail).
 *
 * Reduced motion is handled with gsap.matchMedia rather than the live site's
 * `useState(null)` + effect, which returned null on the server and made the whole
 * section pop in after hydration — invalidating every ScrollTrigger below it.
 * Here the markup is identical either way; only the pin is conditional.
 */
export function Process() {
  const section = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);

  useIsoLayoutEffect(() => {
    const mm = gsap.matchMedia(section);

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const beats = gsap.utils.toArray<HTMLElement>(".p-beat", section.current);
      const dots = gsap.utils.toArray<HTMLElement>(".p-dot", section.current);
      const media = gsap.utils.toArray<HTMLElement>(".p-media", section.current);
      if (!beats.length || !stage.current) return;

      gsap.set(beats.slice(1), { autoAlpha: 0, y: 24 });
      gsap.set(beats[0], { autoAlpha: 1, y: 0 });
      gsap.set(media.slice(1), { autoAlpha: 0 });
      gsap.set(media[0], { autoAlpha: 1 });

      let current = -1;
      ScrollTrigger.create({
        trigger: section.current,
        start: "top top",
        end: "bottom bottom",
        pin: stage.current,
        scrub: 0.6,
        onUpdate: (self) => {
          const idx = Math.min(beats.length - 1, Math.round(self.progress * (beats.length - 1)));
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
              backgroundColor: i <= idx ? "var(--color-brass)" : "var(--color-line)",
              scale: i === idx ? 1.4 : 1,
              duration: 0.3,
              overwrite: true,
            }),
          );
          media.forEach((m, i) =>
            gsap.to(m, { autoAlpha: i === idx ? 1 : 0, duration: 0.5, overwrite: true }),
          );
        },
      });
    });

    return () => mm.revert();
  }, []);

  return (
    <section
      id="process"
      ref={section}
      className="bg-ink-deep relative"
      style={{ height: `${BEATS.length * 100}vh` }}
    >
      <div ref={stage} className="relative h-[100svh] w-full overflow-hidden">
        {MEDIA.map((m) => (
          <div key={m.src} className="p-media absolute inset-0">
            <CinematicVideo src={m.src} poster={m.poster} alt={m.alt} />
          </div>
        ))}

        <div className="from-ink-deep via-ink-deep/60 to-ink-deep/40 absolute inset-0 bg-gradient-to-t" />

        <div className="relative z-10 mx-auto flex h-full max-w-[1240px] flex-col justify-end px-[clamp(20px,4vw,48px)] pb-24">
          <div className="eyebrow sec-eyebrow">The Chair, Start to Finish</div>

          {/* Fixed-height stage: the beats are absolutely stacked, so the box must
              reserve the tallest one or the rail below it jumps between beats. */}
          <div className="relative mt-4 h-[260px] sm:h-[220px]">
            {BEATS.map((b) => (
              <div key={b.step} className="p-beat absolute inset-x-0 top-0 max-w-2xl">
                <p className="font-ticket text-brass text-3xl tracking-[0.08em]">{b.time}</p>
                <h3 className="font-display mt-1 text-[clamp(26px,3.6vw,48px)] leading-[1.05] font-bold uppercase">
                  {b.title}
                </h3>
                <p className="text-steel mt-3 max-w-lg text-[15px]">{b.copy}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 flex items-center gap-3">
            {BEATS.map((b, i) => (
              <div key={b.step} className="flex flex-1 items-center gap-3">
                <span className="p-dot bg-line h-2.5 w-2.5 shrink-0 rounded-full" />
                <span className="font-mono text-steel hidden text-[10.5px] tracking-[0.2em] uppercase sm:inline">
                  {b.step}
                </span>
                {i < BEATS.length - 1 && <span className="bg-line h-px flex-1" aria-hidden />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
