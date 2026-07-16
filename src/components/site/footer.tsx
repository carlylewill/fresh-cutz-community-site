import Image from "next/image";

export function Footer() {
  return (
    <footer className="border-line bg-ink-deep border-t px-[clamp(20px,4vw,48px)] py-[34px]">
      {/*
       * Studio credit, ported from the live urlashtrap.com footer. TitanStudio's
       * own colours are kept deliberately — #fafafa/#3b82f6 is their brand mark,
       * and a studio credit is meant to read as a separate entity from the shop.
       * Recolouring it to brass would erase the identity it exists to carry. The
       * blue is the only one on the site, which is what makes it read as a
       * signature rather than part of the barber's palette; it sits against the
       * same dark ink base the original does, so the contrast holds. Only the
       * chrome is mapped to Fresh Cutz tokens (powder -> paper, brass-tinted
       * border) so the container belongs to this site.
       */}
      <div className="border-line bg-ink/40 flex flex-col items-center gap-4 rounded-3xl border p-6 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
        <a
          href="https://titanstudio.co.uk"
          target="_blank"
          rel="noopener noreferrer"
          className="group"
        >
          <p className="text-paper/40 font-mono text-[10px] font-bold tracking-[0.3em] uppercase">
            Built by
          </p>
          <p className="font-display mt-1 text-2xl font-bold tracking-tight">
            <span className="text-[#fafafa]">Titan</span>{" "}
            <span className="text-[#3b82f6] transition group-hover:brightness-125">Studio</span>
          </p>
          <p className="text-paper/55 mt-1 text-sm">
            Premium websites &amp; custom systems, shipped in 24 hours.
          </p>
        </a>
        <div className="flex flex-col gap-1.5 text-sm sm:items-end">
          <a
            href="https://titanstudio.co.uk"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-[#3b82f6] hover:brightness-125"
          >
            titanstudio.co.uk →
          </a>
          <a href="mailto:grow@titanstudio.co.uk" className="text-paper/60 hover:text-paper">
            grow@titanstudio.co.uk
          </a>
          <a
            href="https://wa.me/447776716783"
            target="_blank"
            rel="noopener noreferrer"
            className="text-paper/60 hover:text-paper"
          >
            +44 7776 716783
          </a>
        </div>
      </div>

      <div className="border-line mt-6 flex flex-wrap items-center justify-between gap-4 border-t pt-6">
        <div className="font-display flex items-center gap-3 text-[13px] font-semibold tracking-[0.16em] uppercase">
          <Image src="/logo.png" alt="" width={32} height={32} className="rounded-full" />
          Fresh Cutz · Wealdstone
        </div>
        <div className="font-mono text-steel text-[11px] tracking-[0.1em]">
          © {new Date().getFullYear()} Fresh Cutz Barbers · Built by TitanStudio
        </div>
      </div>
    </footer>
  );
}
