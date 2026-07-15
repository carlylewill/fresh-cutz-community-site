import { Marquee } from "@/components/motion/marquee";

const ITEMS = [
  "Skin Fades",
  "Taper Fades",
  "Afro Specialists",
  "Kids' First Cuts",
  "Hot Towel Shaves",
  "Walk-ins Welcome",
  "Est. 2015",
  "Wealdstone · Harrow",
];

export function MarqueeStrip() {
  return (
    <div
      className="marquee border-line bg-ink-deep overflow-hidden border-y py-5"
      aria-hidden="true"
    >
      <Marquee items={ITEMS} />
    </div>
  );
}
