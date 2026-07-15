import Image from "next/image";

export function Footer() {
  return (
    <footer className="border-line bg-ink-deep flex flex-wrap items-center justify-between gap-4 border-t px-[clamp(20px,4vw,48px)] py-[34px]">
      <div className="font-display flex items-center gap-3 text-[13px] font-semibold tracking-[0.16em] uppercase">
        <Image src="/logo.png" alt="" width={32} height={32} className="rounded-full" />
        Fresh Cutz · Wealdstone
      </div>
      <div className="font-mono text-steel text-[11px] tracking-[0.1em]">
        © {new Date().getFullYear()} Fresh Cutz Barbers · Built by TitanStudio
      </div>
    </footer>
  );
}
