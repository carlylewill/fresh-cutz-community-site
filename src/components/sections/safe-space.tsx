import { RevealImage } from "@/components/media/reveal-image";
import { MEDIA, SIZES } from "@/lib/media";

/**
 * The one place the site stops selling.
 *
 * No card, no border, no CTA — every other section is a frame around something
 * you can buy, and this one isn't. The restraint is the design; a container
 * would make it look like another product tile and the statement would stop
 * reading as sincere.
 *
 * The old bone-on-charcoal inversion and its italic Fraunces are gone: the gold
 * accent here is the same device as every h1/h2 on the page, which is what keeps
 * a section this bare from looking like a different site.
 */
export function SafeSpace() {
  return (
    <section className="bg-ink relative px-[clamp(20px,4vw,48px)] py-[clamp(120px,17vw,220px)]">
      <div className="mx-auto max-w-[1000px] text-center">
        <div className="eyebrow reveal justify-center" data-anim="fade">
          A Safe Space
        </div>
        <h2
          className="font-display reveal mt-6 text-[clamp(30px,4.6vw,60px)] leading-[1.06] font-bold tracking-[-0.005em] uppercase"
          data-anim="lines"
        >
          Bring the nervous first-timer. Bring the toddler.{" "}
          <span className="text-brass">Bring yourself, exactly as you are.</span>
        </h2>
        <p className="text-steel reveal mx-auto mt-9 max-w-[640px] text-[16px]" data-anim="fade">
          We&rsquo;re not the cheapest chair on the high street, and we don&rsquo;t want to be. We
          want the one where kids get their first-ever haircut without tears, where grown-ups get
          exactly what they asked for, and where regulars stay for twenty years because
          they&rsquo;ve never had a reason to leave.
        </p>

        {/* The section's one image, and it sits BELOW the statement rather than
            behind it: text over a photograph is a sales layout, and the point
            here is that the words stand on their own first. No border — it
            should read as the room, not as another tile. */}
        <RevealImage
          src={MEDIA.interior.src}
          alt="Inside Fresh Cutz Barbers — the chairs and mirrors on Canning Road, Wealdstone"
          ratio={MEDIA.interior.ratio}
          variant="clip"
          sizes={SIZES.proseFull}
          className="mt-16 rounded-md"
        />
      </div>
    </section>
  );
}
