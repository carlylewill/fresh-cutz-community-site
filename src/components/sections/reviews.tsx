import { Counter } from "@/components/motion/counter";
import { RATING, REVIEW_COUNT } from "@/lib/services";

/** v2's trimmed quotes — the live site's full-length versions are cut to the line that lands. */
const REVIEWS = [
  {
    name: "David Tse",
    tag: "Detail obsessive",
    quote:
      "Honestly the best hairdresser I've ever had. I showed him two reference photos and he kept carefully comparing my hair to the pictures through the whole appointment.",
  },
  {
    name: "Forward Horizon",
    tag: "Regular · 20+ years",
    quote:
      "Thank you for a great cut as usual — I have been with you over 20 years and I'm always happy with the cut!",
  },
  {
    name: "Larisa Cirlan",
    tag: "Parent · first-cut rescue",
    quote:
      "My son had a bad experience elsewhere that left him hating barbers. We tried here — the haircut was 10 out of 10 and now this is the only way he wants his hair cut.",
  },
];

const STATS: { to: number; decimals?: number; label: string }[] = [
  { to: Number(RATING), decimals: 1, label: "Google rating" },
  { to: Number(REVIEW_COUNT), label: "Reviews" },
  { to: 10, label: "Years+ in Wealdstone" },
];

export function Reviews() {
  return (
    <section id="reviews" className="sec bg-ink-deep">
      <div className="wrap">
        <div className="eyebrow sec-eyebrow reveal" data-anim="fade">
          Straight From the Chair
        </div>
        <h2
          className="font-display reveal max-w-[900px] text-[clamp(34px,5.5vw,72px)] leading-[1.02] font-bold tracking-[-0.005em] uppercase"
          data-anim="lines"
        >
          The regulars <span className="text-brass">keep coming back.</span>
        </h2>

        <div
          className="font-mono reveal mt-2 flex flex-wrap items-baseline gap-10"
          data-anim="fade"
        >
          {STATS.map((s) => (
            <div key={s.label}>
              <Counter
                to={s.to}
                decimals={s.decimals}
                className="font-ticket text-brass text-[clamp(70px,10vw,120px)] leading-none"
              />
              <div className="text-steel text-xs tracking-[0.2em] uppercase">{s.label}</div>
            </div>
          ))}
        </div>

        {/* .rev-grid > .rev is a ScrollTrigger.batch selector. */}
        <div className="rev-grid mt-[54px] grid gap-5 max-[860px]:grid-cols-1 min-[861px]:grid-cols-3">
          {REVIEWS.map((r) => (
            <article
              key={r.name}
              className="rev reveal border-line border-l-brass bg-ink-soft rounded border border-l-[3px] px-[26px] py-7"
              data-anim="card"
              data-batch=""
            >
              <q className="text-paper block text-[14.5px] font-light">{r.quote}</q>
              <div className="font-mono text-brass-bright mt-5 text-xs">{r.name}</div>
              <div className="font-mono text-steel mt-0.5 text-[11px]">{r.tag}</div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
