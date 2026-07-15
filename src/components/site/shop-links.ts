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

export const DIRECTIONS_URL = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
  SHOP.address,
)}`;
