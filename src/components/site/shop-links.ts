import { SHOP } from "@/lib/services";

/**
 * Derived from SHOP.instagram rather than written out again, so the label can
 * never drift from the link it describes — which is exactly what happened on the
 * live site, where the href and the visible handle pointed at different accounts.
 */
export const INSTAGRAM_HANDLE = `@${new URL(SHOP.instagram).pathname.replace(/\//g, "")}`;

/** Street line vs the rest, for the two-tier address block. */
const [STREET, ...REST] = SHOP.address.split(", ");
export const ADDRESS_STREET = STREET;
export const ADDRESS_REST = REST.join(", ");

/**
 * `dir/?api=1` deep-links straight into turn-by-turn navigation — on a phone it
 * hands off to the Google Maps app rather than dropping the user on a search
 * page they then have to tap "Directions" on.
 */
export const DIRECTIONS_URL = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
  SHOP.address,
)}`;

/** Keyless embed — no API key, no billing account, no quota to run out. */
export const MAP_EMBED_URL = `https://www.google.com/maps?q=${encodeURIComponent(
  SHOP.address,
)}&output=embed`;
