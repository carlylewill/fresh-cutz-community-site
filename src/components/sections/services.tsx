import { RevealImage } from "@/components/media/reveal-image";
import { MEDIA, SIZES } from "@/lib/media";
import { SERVICES } from "@/lib/services";

export function Services() {
  return (
    <section id="services" className="sec bg-ink-deep overflow-hidden">
      {/* Texture behind the ticket grid, not a photograph — see `.svc-bg` in
          sections.css for why it sits at .09. alt="" and aria-hidden: it carries
          no information the stubs don't, so a screen reader should skip it. */}
      <div className="svc-bg" aria-hidden>
        <RevealImage
          src={MEDIA.tools.src}
          alt=""
          ratio={MEDIA.tools.ratio}
          variant="greyscale"
          sizes={SIZES.fullBleed}
          className="h-full w-full"
        />
      </div>

      <div className="wrap">
        <div className="eyebrow sec-eyebrow reveal" data-anim="fade">
          Take a Ticket
        </div>
        <h2
          className="font-display reveal max-w-[900px] text-[clamp(34px,5.5vw,72px)] leading-[1.02] font-bold tracking-[-0.005em] uppercase"
          data-anim="lines"
        >
          Services &amp; <span className="text-brass">prices.</span>
        </h2>
        <p className="text-steel reveal mt-[18px] max-w-[560px] text-[15.5px]" data-anim="fade">
          A guide to prices — final price depends on length, texture and time. Baggio will always
          talk it through first. Pick your tickets in the booking form below.
        </p>

        {/*
         * #svcGrid .ticket is a ScrollTrigger.batch selector (lib/motion
         * REVEAL_GRIDS). The id and class are the binding.
         *
         * The prototype's per-ticket "Add to booking" button is deliberately not
         * here: selection state lives in <BookingWizard />, and duplicating it
         * across two components means two sources of truth for what's in the
         * basket. The ticket links into the wizard instead.
         */}
        <div
          id="svcGrid"
          className="mt-14 grid grid-cols-[repeat(auto-fill,minmax(270px,1fr))] gap-5"
        >
          {SERVICES.map((service, i) => (
            <article
              key={service.id}
              className="ticket reveal bg-ink-soft border-line rounded-md border px-6 pt-[26px] pb-[22px] relative overflow-hidden"
              data-anim="card"
              data-batch=""
            >
              <div className="font-mono text-steel text-[10.5px] tracking-[0.24em] uppercase">
                Ticket No. {String(i + 1).padStart(2, "0")}
              </div>
              <h3 className="font-display mt-2 text-xl font-semibold tracking-[0.05em] uppercase">
                {service.name}
              </h3>
              {/* min-h keeps the perforation on one line across cards whose
                  descriptions wrap to different heights. */}
              <p className="text-steel mt-1.5 min-h-[42px] text-[13.5px]">{service.desc}</p>
              <div className="t-perf" />
              <div className="flex items-center justify-between">
                <div className="font-mono text-brass-bright text-[17px]">
                  <small className="text-steel mr-1 text-[11px]">from</small>£{service.priceFrom}
                </div>
                <a
                  href="#book"
                  className="font-mono border-line text-paper hover:border-brass hover:text-brass-bright inline-flex min-h-[44px] items-center rounded-xs border px-3.5 py-2.5 text-[11px] tracking-[0.14em] uppercase transition-all duration-250"
                >
                  Add to booking
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
