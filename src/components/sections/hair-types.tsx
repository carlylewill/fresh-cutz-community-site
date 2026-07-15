import { HairCard } from "@/components/motion/hair-card";
import afroCoily from "@/assets/hair-afro-coily.jpg";
import asianStraight from "@/assets/hair-asian-straight.jpg";
import caucasianWavy from "@/assets/hair-caucasian-wavy.jpg";

const CARDS = [
  {
    src: afroCoily,
    alt: "Afro coily hair cut at Fresh Cutz Barbers",
    tag: "Afro / Coily",
    title: "Cut with the grain",
    copy: "Fades, shape-ups, tapers, sponge twists — cutting with the grain of your curl pattern, never against it.",
  },
  {
    src: asianStraight,
    alt: "Asian straight hair cut at Fresh Cutz Barbers",
    tag: "Asian / Straight",
    title: "Patient with thick hair",
    copy: "Clean lines, textured crops, scissor work — a specialist's hand for thick, straight hair.",
  },
  {
    src: caucasianWavy,
    alt: "Wavy hair cut at Fresh Cutz Barbers",
    tag: "Caucasian / Wavy",
    title: "Precision blends",
    copy: "Skin fades, classic side parts, modern crops — precision blends for wavy and straight European hair.",
  },
];

export function HairTypes() {
  return (
    <section id="hair" className="sec">
      <div className="wrap">
        <div className="eyebrow sec-eyebrow reveal" data-anim="fade">
          The Signature
        </div>
        <h2
          className="font-display reveal max-w-[900px] text-[clamp(34px,5.5vw,72px)] leading-[1.02] font-bold tracking-[-0.005em] uppercase"
          data-anim="lines"
        >
          A barber for <span className="text-brass">all</span> hair types.
        </h2>
        <p className="text-steel reveal mt-[18px] max-w-[560px] text-[15.5px]" data-anim="fade">
          Most shops quietly specialise in one texture. We don&rsquo;t. Three textures, one chair,
          and the technique to match whichever one walks in.
        </p>

        {/* .hair-grid > .hair-card is a ScrollTrigger.batch selector (lib/motion
            REVEAL_GRIDS) — the class names are the binding, not decoration. */}
        <div className="hair-grid mt-[60px] grid gap-[22px] max-[860px]:grid-cols-1 min-[861px]:grid-cols-3">
          {CARDS.map((c) => (
            <HairCard key={c.tag} src={c.src} alt={c.alt} title={c.title} tag={c.tag}>
              {c.copy}
            </HairCard>
          ))}
        </div>
      </div>
    </section>
  );
}
