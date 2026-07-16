import { RevealImage } from "@/components/media/reveal-image";
import { MEDIA, SIZES } from "@/lib/media";
import { SHOP } from "@/lib/services";
import {
  ADDRESS_REST,
  ADDRESS_STREET,
  DIRECTIONS_URL,
  INSTAGRAM_HANDLE,
  MAP_EMBED_URL,
} from "@/components/site/shop-links";
import {
  ClockIcon,
  InstagramIcon,
  MapPinIcon,
  PhoneIcon,
  WhatsAppIcon,
} from "@/components/site/icons";

function Block({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="border-line reveal border-b py-[18px]" data-anim="fade">
      <div className="font-mono text-brass flex items-center gap-2.5 text-[11px] tracking-[0.24em] uppercase">
        {icon}
        {label}
      </div>
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
            <Block label="Address" icon={<MapPinIcon />}>
              <a
                href={DIRECTIONS_URL}
                target="_blank"
                rel="noreferrer"
                className="hover:text-brass"
              >
                {ADDRESS_STREET}
                <small className={SUB}>{ADDRESS_REST}</small>
              </a>
            </Block>
            <Block label="Call" icon={<PhoneIcon />}>
              <a href={SHOP.phoneHref} className="hover:text-brass">
                {SHOP.phoneDisplay}
              </a>
            </Block>
            {/* Split out from the old combined "Call / WhatsApp" row: that one
                only ever emitted a tel: link, so the WhatsApp half was a label
                with nothing behind it. */}
            <Block label="WhatsApp" icon={<WhatsAppIcon />}>
              <a href={SHOP.whatsapp} target="_blank" rel="noreferrer" className="hover:text-brass">
                {SHOP.phoneDisplay}
                <small className={SUB}>Message the shop directly</small>
              </a>
            </Block>
            <Block label="Hours" icon={<ClockIcon />}>
              Mon–Sat 10–20
              <small className={SUB}>Sunday 10:00 – 18:00 · Walk-ins when chairs are free</small>
            </Block>
            <Block label="Instagram" icon={<InstagramIcon />}>
              <a
                href={SHOP.instagram}
                target="_blank"
                rel="noreferrer"
                className="hover:text-brass lowercase"
              >
                {INSTAGRAM_HANDLE}
              </a>
            </Block>

            {/* Keyless embed, so there's no API key or billing account to break.
                Greyscale + brass border so a stock Google map doesn't fight the
                v2 palette; it comes to full colour on hover like the hair cards. */}
            <div
              className="reveal border-line mt-8 overflow-hidden rounded-md border"
              data-anim="fade"
            >
              <iframe
                src={MAP_EMBED_URL}
                title="Fresh Cutz Barbers on Google Maps"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
                className="block h-[260px] w-full grayscale transition-[filter] duration-500 hover:grayscale-0"
              />
            </div>

            <a
              href={DIRECTIONS_URL}
              target="_blank"
              rel="noreferrer"
              className="btn-primary reveal mt-4 flex w-full justify-center"
              data-anim="fade"
            >
              <i className="sweep" />
              <span className="relative flex items-center gap-2.5">
                <MapPinIcon />
                Get directions
              </span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
