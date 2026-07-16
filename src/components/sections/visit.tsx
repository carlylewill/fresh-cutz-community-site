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

/**
 * The tappable half of a block. `min-h-[44px]` is the touch-target floor, and it
 * is what a bare 19px line misses by half — the two-line rows (Address,
 * WhatsApp) already clear it on their own. flex-col so those two keep stacking
 * their <small> under the value rather than beside it.
 */
const LINK = "hover:text-brass inline-flex min-h-[44px] flex-col justify-center";

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

        {/*
         * NOT `items-start`. The columns hold different amounts of content — the
         * photo is one 1.49-ratio box, the contact list is five rows — so a
         * start-aligned row ends the left column ~460px above the right one and
         * leaves the whole left half of a wide viewport as bare section
         * background. Stretch plus the two slack absorbers below (the map's
         * flex-1, the CTA's mt-auto) makes the columns end on the same line at
         * every width instead.
         */}
        <div className="mt-14 grid gap-11 max-[860px]:grid-cols-1 min-[861px]:grid-cols-[1.2fr_1fr]">
          {/* The place itself: the shopfront over the map it stands on. Grouping
              both here is what gives the right column a clean typographic run. */}
          <div className="flex flex-col gap-5">
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

            {/* Keyless embed, so there's no API key or billing account to break.
                Greyscale + brass border so a stock Google map doesn't fight the
                v2 palette; it comes to full colour on hover like the hair cards.
                flex-1 over a fixed height: the map is the slack absorber on this
                side, so it grows into whatever the contact column is taller by
                rather than letting the row end ragged. min-h keeps it a map and
                not a letterbox when there's nothing to absorb. */}
            <div
              className="reveal border-line relative min-h-[230px] flex-1 overflow-hidden rounded-md border"
              data-anim="fade"
            >
              <iframe
                src={MAP_EMBED_URL}
                title="Fresh Cutz Barbers on Google Maps"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
                className="absolute inset-0 block h-full w-full grayscale transition-[filter] duration-500 hover:grayscale-0"
              />
            </div>
          </div>

          <div className="flex flex-col">
            <Block label="Address" icon={<MapPinIcon />}>
              <a href={DIRECTIONS_URL} target="_blank" rel="noreferrer" className={LINK}>
                {ADDRESS_STREET}
                <small className={SUB}>{ADDRESS_REST}</small>
              </a>
            </Block>
            <Block label="Call" icon={<PhoneIcon />}>
              <a href={SHOP.phoneHref} className={LINK}>
                {SHOP.phoneDisplay}
              </a>
            </Block>
            {/* Split out from the old combined "Call / WhatsApp" row: that one
                only ever emitted a tel: link, so the WhatsApp half was a label
                with nothing behind it. */}
            <Block label="WhatsApp" icon={<WhatsAppIcon />}>
              <a href={SHOP.whatsapp} target="_blank" rel="noreferrer" className={LINK}>
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
                className={`${LINK} lowercase`}
              >
                {INSTAGRAM_HANDLE}
              </a>
            </Block>

            {/* The CTA sits in a wrapper rather than carrying the spacing itself:
                `mt-auto` is what pins it to the foot of the column and eats the
                slack when the photo+map side runs taller, and `pt-7` is the floor
                under that so it never lands flush on the last block's rule. The
                button stays inline-flex (.btn-primary's own display) — the old
                `flex w-full` stretched it into a brass slab as wide as the map. */}
            <div className="reveal mt-auto pt-7" data-anim="fade">
              <a href={DIRECTIONS_URL} target="_blank" rel="noreferrer" className="btn-primary">
                <i className="sweep" />
                <span className="relative flex items-center gap-2.5">
                  <MapPinIcon />
                  Get directions
                </span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
