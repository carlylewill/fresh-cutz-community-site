import { RevealImage } from "@/components/media/reveal-image";
import { MEDIA, SIZES } from "@/lib/media";
import { SHOP } from "@/lib/services";
import {
  ADDRESS_REST,
  ADDRESS_STREET,
  DIRECTIONS_URL,
  INSTAGRAM_HANDLE,
} from "@/components/site/shop-links";

function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-line reveal border-b py-[18px]" data-anim="fade">
      <div className="font-mono text-brass text-[11px] tracking-[0.24em] uppercase">{label}</div>
      <div className="font-display mt-1.5 text-[19px] font-medium tracking-[0.04em] uppercase">
        {children}
      </div>
    </div>
  );
}

/** Resets the display font/casing for the secondary line inside a .vv. */
const SUB =
  "font-body text-steel mt-0.5 block text-[13.5px] font-light tracking-normal normal-case";

export function Visit() {
  return (
    <section id="visit" className="sec">
      <div className="wrap">
        <div className="eyebrow sec-eyebrow reveal" data-anim="fade">
          Visit
        </div>
        <h2
          className="font-display reveal max-w-[900px] text-[clamp(34px,5.5vw,72px)] leading-[1.02] font-bold tracking-[-0.005em] uppercase"
          data-anim="lines"
        >
          Come down to <span className="text-brass">Canning Road.</span>
        </h2>

        <div className="mt-14 grid items-start gap-11 max-[860px]:grid-cols-1 min-[861px]:grid-cols-[1.2fr_1fr]">
          {/*
           * The box is the file's REAL ratio (1264/848 = 1.491), not the
           * prototype's nominal 16/11 and not a rounded 3:2 — a nominal ratio
           * against a source that isn't quite that shape is where a hairline
           * letterbox comes from.
           *
           * No `reveal`/`data-anim` wrapper here: RevealImage runs its own clip
           * reveal on scroll, and stacking ScrollReveals' fade on top would mean
           * two triggers animating one element with different starts.
           */}
          <RevealImage
            src={MEDIA.shopfront.src}
            alt="The Fresh Cutz shopfront on Canning Road, Wealdstone"
            ratio={MEDIA.shopfront.ratio}
            variant="clip"
            sizes={SIZES.wrapWideColumn}
            className="border-line rounded-md border"
          />

          <div>
            <Block label="Address">
              <a
                href={DIRECTIONS_URL}
                target="_blank"
                rel="noreferrer"
                className="hover:text-brass"
              >
                {ADDRESS_STREET}
                <small className={SUB}>{ADDRESS_REST} · Tap for directions</small>
              </a>
            </Block>
            <Block label="Call / WhatsApp">
              <a href={SHOP.phoneHref} className="hover:text-brass">
                {SHOP.phoneDisplay}
              </a>
            </Block>
            <Block label="Hours">
              Mon–Sat 10–20
              <small className={SUB}>Sunday 10:00 – 18:00 · Walk-ins when chairs are free</small>
            </Block>
            <Block label="Instagram">
              <a
                href={SHOP.instagram}
                target="_blank"
                rel="noreferrer"
                className="hover:text-brass lowercase"
              >
                {INSTAGRAM_HANDLE}
              </a>
            </Block>
          </div>
        </div>
      </div>
    </section>
  );
}
