/**
 * Single source of truth for the service catalogue — imported by the UI and by
 * the server. The server resolves ids to names/prices itself rather than
 * trusting the client, so `total_price_from` can't be forged.
 *
 * Copy and prices are carried over verbatim from the live site.
 */
export type Service = { id: string; name: string; desc: string; priceFrom: number };

export const SERVICES: Service[] = [
  {
    id: "skin-fade",
    name: "Skin fade",
    desc: "Tight, precise fade — clipper and razor finish.",
    priceFrom: 25,
  },
  {
    id: "classic-cut",
    name: "Classic cut",
    desc: "Scissor and clipper work, wash and finish.",
    priceFrom: 25,
  },
  {
    id: "taper-fade",
    name: "Taper fade",
    desc: "Gradual taper with a crisp neckline and finish.",
    priceFrom: 25,
  },
  {
    id: "kids-cut",
    name: "Kids' cut",
    desc: "Patient, gentle, and unrushed. Ages welcome.",
    priceFrom: 15,
  },
  {
    id: "buzz-lineup",
    name: "Buzz cut & line-up",
    desc: "All-over buzz with a sharp edge-up.",
    priceFrom: 30,
  },
  {
    id: "trim-shave",
    name: "Trim & shave",
    desc: "Haircut and hot-towel shave combo.",
    priceFrom: 30,
  },
  {
    id: "trim-wash",
    name: "Trim & wash",
    desc: "Cut finished with a wash and style.",
    priceFrom: 30,
  },
  {
    id: "trim-dye",
    name: "Trim & dye",
    desc: "Cut with a full colour or tone refresh.",
    priceFrom: 30,
  },
];

export const SERVICE_IDS = SERVICES.map((s) => s.id) as [string, ...string[]];

export function resolveServices(ids: string[]): Service[] {
  return ids.map((id) => SERVICES.find((s) => s.id === id)).filter((s): s is Service => Boolean(s));
}

/** Shop-editable display values. */
export const RATING = "4.8";
export const REVIEW_COUNT = "106";
export const BARBERS = [
  { id: "baggio", label: "Baggio" },
  { id: "rahul", label: "Rahul" },
] as const;

export const SHOP = {
  phoneDisplay: "07415 409277",
  phoneHref: "tel:07415409277",
  address: "18 Canning Road, Wealdstone, Harrow, HA3 7SJ",
  instagram: "https://www.instagram.com/fresh.cutz.barbers/",
} as const;
