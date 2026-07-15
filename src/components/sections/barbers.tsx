const ROSTER = [
  {
    initial: "B",
    role: "Owner & Lead Barber",
    name: "Baggio",
    copy: "Runs the shop. Known for patience, precision, and comparing your hair to your reference photos throughout the cut — detail after detail.",
    tags: ["Afro-textured", "Asian hair", "Caucasian hair", "Kids' first cuts"],
  },
  {
    initial: "R",
    role: "Barber",
    name: "Rahul",
    copy: "Trusted by a loyal Asian clientele. Clean skin fades, textured crops and careful scissor work on thick, straight hair.",
    tags: ["Asian hair specialist", "Skin fades", "Scissor cuts"],
  },
];

export function Barbers() {
  return (
    <section id="barbers" className="sec">
      <div className="wrap">
        <div className="eyebrow sec-eyebrow reveal" data-anim="fade">
          Meet the Barbers
        </div>
        <h2
          className="font-display reveal max-w-[900px] text-[clamp(34px,5.5vw,72px)] leading-[1.02] font-bold tracking-[-0.005em] uppercase"
          data-anim="lines"
        >
          Two chairs. <span className="text-brass">Decades</span> of hands-on.
        </h2>

        {/* .barber-grid > .barber is a ScrollTrigger.batch selector. */}
        <div className="barber-grid mt-14 grid gap-[22px] max-[820px]:grid-cols-1 min-[821px]:grid-cols-2">
          {ROSTER.map((b) => (
            <article
              key={b.name}
              className="barber reveal border-line bg-ink-soft relative overflow-hidden rounded-md border px-[30px] py-[34px]"
              data-anim="card"
              data-batch=""
            >
              <span className="b-init" aria-hidden>
                {b.initial}
              </span>
              <div className="font-mono text-brass text-[11px] tracking-[0.24em] uppercase">
                {b.role}
              </div>
              <h3 className="font-display mt-2.5 mb-3 text-[34px] font-bold tracking-[0.03em] uppercase">
                {b.name}
              </h3>
              <p className="text-steel max-w-[400px] text-[14.5px]">{b.copy}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {b.tags.map((t) => (
                  <span
                    key={t}
                    className="font-mono border-line text-paper rounded-full border px-3 py-[7px] text-[10.5px] tracking-[0.12em] uppercase"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
