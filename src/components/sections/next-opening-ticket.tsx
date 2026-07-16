"use client";

import { useEffect, useState } from "react";

/*
 * WHAT THIS IS NOT: a booking availability lookup.
 *
 * The old hero carried `NEXT_AVAILABLE = "Thursday 2pm"`, hard-coded, which was
 * a claim about the diary that nothing in this codebase can substantiate — the
 * shop's bookings live in Supabase behind an approval step, and there is no
 * notion of a free slot to read. It was deleted for being false.
 *
 * What IS derivable from what we hold is the opening hours, so that is what this
 * says, and it is labelled "Next opening" rather than "Next available" for that
 * exact reason. Widen this to real availability only when there's a query that
 * answers it.
 */

/** Mon–Sat 10:00–20:00, Sun 10:00–18:00. The one source for both fields below. */
const OPENS_MIN = 10 * 60;
const CLOSES_MIN = { sun: 18 * 60, other: 20 * 60 };

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const DAY_NAMES: Record<string, string> = {
  Sun: "Sunday",
  Mon: "Monday",
  Tue: "Tuesday",
  Wed: "Wednesday",
  Thu: "Thursday",
  Fri: "Friday",
  Sat: "Saturday",
};

/** 600 -> "10am", 1080 -> "6pm", 810 -> "1.30pm". */
function clock(minutes: number): string {
  const h24 = Math.floor(minutes / 60);
  const m = minutes % 60;
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}${m ? `.${String(m).padStart(2, "0")}` : ""}${h24 < 12 ? "am" : "pm"}`;
}

function closesAt(weekday: string): number {
  return weekday === "Sun" ? CLOSES_MIN.sun : CLOSES_MIN.other;
}

/**
 * Resolved in Europe/London via Intl rather than the visitor's own clock — a
 * client in New York must still see the shop's hours, not theirs. Same pattern
 * as getLondonOpenStatus() in components/site/open-status-badge.tsx; the two are
 * intentionally separate because they answer different questions and only share
 * the hours, which are a handful of constants.
 */
function getLondonNextOpening(): { lead: string; when: string } {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const weekday = get("weekday");
  const minutesNow = Number(get("hour")) * 60 + Number(get("minute"));

  const closes = closesAt(weekday);
  if (minutesNow >= OPENS_MIN && minutesNow < closes) {
    return { lead: "Open now", when: `Chair's turning until ${clock(closes)}` };
  }

  // Before opening it's still today. After closing — and there is no day the
  // shop is shut — it is always tomorrow, so one step round the week is enough
  // and there's no loop to bound.
  if (minutesNow < OPENS_MIN) {
    return { lead: "Opens today", when: `${clock(OPENS_MIN)} · ${DAY_NAMES[weekday] ?? weekday}` };
  }
  const next = DAYS[(DAYS.indexOf(weekday as (typeof DAYS)[number]) + 1) % 7];
  return { lead: "Opens tomorrow", when: `${clock(OPENS_MIN)} · ${DAY_NAMES[next] ?? next}` };
}

/**
 * Returns null until mounted. The answer is a function of "now", so rendering it
 * on the server would bake the build time into the HTML and mismatch on hydrate.
 * The interval keeps it honest for anyone sitting on the page across 10:00/20:00.
 */
export function NextOpeningTicket() {
  const [slot, setSlot] = useState<{ lead: string; when: string } | null>(null);

  useEffect(() => {
    setSlot(getLondonNextOpening());
    const id = setInterval(() => setSlot(getLondonNextOpening()), 60_000);
    return () => clearInterval(id);
  }, []);

  if (!slot) return null;

  return (
    <aside id="hero-ticket">
      <div className="font-mono text-steel text-[10.5px] tracking-[0.24em] uppercase">
        Next opening
      </div>
      <div className="font-display text-paper mt-2 text-[19px] leading-none font-semibold tracking-[0.05em] uppercase">
        {slot.lead}
      </div>
      <div className="t-perf" />
      <div className="font-mono text-brass-bright text-[12px] tracking-[0.04em]">{slot.when}</div>
    </aside>
  );
}
