import { RevealImage } from "@/components/media/reveal-image";
import { VideoCard } from "@/components/media/video-card";
import { INSTAGRAM_HANDLE } from "@/components/site/shop-links";
import { MEDIA, SIZES } from "@/lib/media";
import { SHOP } from "@/lib/services";

/**
 * Four equal portrait cards on one row. Layout is `.cut-grid` in sections.css.
 *
 * THE CARD RATIO IS 9:16, and it needs no compromise: the three clips are all
 * genuine full-frame 720x1280, so each one sizes itself to exactly this box off
 * its own manifest entry and nothing is cropped. cutting.jpg is the only outlier
 * at 3:4 (0.747), and is the one asset that gives anything up — cover keeps its
 * full height and takes ~25% off its width, which on a portrait shot of a barber
 * mid-cut is margin, not subject.
 *
 * THREE OF THE FOUR ARE CLIPS rather than the 3-stills-and-a-video the brief
 * imagined, and that is an asset fact: /public/media holds exactly one still
 * that belongs in this strip. hair-*.jpg are the hair-types section's own
 * images, and shopfront/interior/tools are landscape and are not cuts. Three
 * clips and one still shows only the shop's real work and invents nothing.
 * More portrait stills of finished cuts would still improve this section.
 */

/* The card ratio: see above. Taken from the manifest rather than typed out, so a
   re-encode can't silently desync the one cropped asset from the three that
   drive the row's height. */
const CARD_RATIO = MEDIA.cutsLoop.ratio;

const CARD = "cut-tile";

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

        <div className="cut-grid reveal mt-14" data-anim="fade">
          <VideoCard
            src={MEDIA.cutsLoop.src}
            alt="A fresh cut being finished at Fresh Cutz Barbers, Wealdstone Harrow"
            className={CARD}
          />
          {/*
           * variant="clip", not "greyscale", even though the strip's whole device
           * is greyscale->colour. The hover transition owns `filter` on this
           * element; a greyscale reveal would tween the same property, land on
           * grayscale(0), and permanently defeat the hover. clip-path reveals it
           * without touching filter.
           */}
          <RevealImage
            src={MEDIA.cutting.src}
            alt="Baggio cutting a client's hair at Fresh Cutz Barbers, Wealdstone Harrow"
            ratio={CARD_RATIO}
            variant="clip"
            sizes={SIZES.cutsCard}
            className={`${CARD} border-line bg-ink-soft rounded border`}
          />
          <VideoCard
            src={MEDIA.stripClip1.src}
            alt="The chairs and shop floor at Fresh Cutz Barbers, Wealdstone Harrow"
            className={CARD}
          />
          <VideoCard
            src={MEDIA.stripClip2.src}
            alt="A barber working the top of a caped client's hair at Fresh Cutz Barbers"
            className={CARD}
          />
        </div>
      </div>
    </section>
  );
}
