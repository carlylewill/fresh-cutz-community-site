import { RevealImage } from "@/components/media/reveal-image";
import { VideoCard } from "@/components/media/video-card";
import { INSTAGRAM_HANDLE } from "@/components/site/shop-links";
import { MEDIA } from "@/lib/media";
import { SHOP } from "@/lib/services";

/**
 * A uniform-HEIGHT rail, not a uniform-width grid of squares.
 *
 * Every asset here is portrait or near-portrait once the pillarboxing is
 * accounted for — cuts-loop is 9:16, the two hero clips are 608/1080 of real
 * footage inside a padded 1920x1080 file, and cutting.jpg is 3:4. Forcing those
 * into square tiles with object-cover would centre-crop a 9:16 portrait to 1:1
 * and throw away nearly half the frame, which is precisely the "never stretched"
 * the brief rules out.
 *
 * Fixing the height and letting each card's width fall out of its own ratio is
 * the only arrangement that shows all four as shot. The cards still line up on a
 * common baseline, so the rail reads as a system rather than a ragged mix.
 */

/* The rail's height. Width per card = height * ratio, so the widest card here
   (cutting.jpg, 3:4) tops out at 460 * 0.747 = ~344px — which is what `sizes`
   below is derived from. */
const RAIL_H = "h-[clamp(320px,52vh,460px)]";

/* Each card is sized by the rail's height, never by the viewport, so a vw-based
   `sizes` would be describing the wrong axis. 344px is the widest any card gets;
   it overstates only on short viewports, where the rail shrinks toward 320px. */
const CARD_SIZES = "344px";

const CARD = `cut-tile ${RAIL_H} w-auto shrink-0 snap-start`;

export function RecentCuts() {
  return (
    <section id="recent-cuts" className="sec bg-ink-deep">
      <div className="wrap">
        <div className="eyebrow sec-eyebrow reveal" data-anim="fade">
          Recent Cuts
        </div>
        <h2
          className="font-display reveal max-w-[900px] text-[clamp(34px,5.5vw,72px)] leading-[1.02] font-bold tracking-[-0.005em] uppercase"
          data-anim="lines"
        >
          Straight off the <span className="text-brass">chair.</span>
        </h2>
        <p className="text-steel reveal mt-[18px] max-w-[560px] text-[15.5px]" data-anim="fade">
          Fresh cuts and shop updates go up on{" "}
          <a
            href={SHOP.instagram}
            target="_blank"
            rel="noreferrer"
            className="text-brass-bright hover:underline"
          >
            {INSTAGRAM_HANDLE}
          </a>
          .
        </p>
      </div>

      {/*
       * Breaks the .wrap on purpose so the rail bleeds to the viewport edge — a
       * scroll rail that stops short of the edge reads as a broken grid. The
       * scroll-px matches the section gutter so a snapped card lands on the same
       * line as the heading above it.
       */}
      <div
        className="reveal mt-14 -mx-[clamp(20px,4vw,48px)] flex snap-x snap-mandatory items-stretch gap-5 overflow-x-auto scroll-px-[clamp(20px,4vw,48px)] px-[clamp(20px,4vw,48px)] pb-4"
        data-anim="fade"
      >
        <VideoCard
          src={MEDIA.cutsLoop.src}
          alt="A fresh cut being finished at Fresh Cutz Barbers, Wealdstone Harrow"
          className={CARD}
        />
        {/*
         * variant="clip", not "greyscale", even though the rail's whole device is
         * greyscale->colour. The hover transition owns `filter` on this element;
         * a greyscale reveal would tween the same property, land on
         * grayscale(0), and permanently defeat the hover. clip-path reveals it
         * without touching filter.
         */}
        <RevealImage
          src={MEDIA.cutting.src}
          alt="Baggio cutting a client's hair at Fresh Cutz Barbers, Wealdstone Harrow"
          ratio={MEDIA.cutting.ratio}
          variant="clip"
          sizes={CARD_SIZES}
          className={`${CARD} border-line bg-ink-soft rounded border`}
        />
        <VideoCard
          src={MEDIA.walkIn.src}
          alt="The chairs and shop floor at Fresh Cutz Barbers, Wealdstone Harrow"
          className={CARD}
        />
        <VideoCard
          src={MEDIA.chairWork.src}
          alt="A barber working the top of a caped client's hair at Fresh Cutz Barbers"
          className={CARD}
        />
      </div>
    </section>
  );
}
