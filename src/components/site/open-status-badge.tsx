"use client";

import { useEffect, useState } from "react";

/**
 * Carried over verbatim from the live site. Mon–Sat 10–20, Sun 10–18, resolved
 * in Europe/London via Intl rather than the visitor's own clock — a client in
 * New York must still see the shop's hours, not theirs.
 */
function getLondonOpenStatus(): { open: boolean; label: string } {
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
  const isSunday = weekday === "Sun";
  const opens = 10 * 60;
  const closes = isSunday ? 18 * 60 : 20 * 60;
  const open = minutesNow >= opens && minutesNow < closes;
  const closingSoon = open && closes - minutesNow <= 30;
  if (open) return { open: true, label: closingSoon ? "Open · closing soon" : "Open now" };
  return { open: false, label: minutesNow < opens ? "Opens 10am" : "Closed" };
}

/**
 * Returns null until mounted. The status is a function of "now", so rendering it
 * on the server would bake the build time into the HTML and mismatch on hydrate.
 * The interval keeps it honest for anyone sitting on the page across 10:00/20:00.
 */
export function OpenStatusBadge() {
  const [status, setStatus] = useState<{ open: boolean; label: string } | null>(null);

  useEffect(() => {
    setStatus(getLondonOpenStatus());
    const id = setInterval(() => setStatus(getLondonOpenStatus()), 60_000);
    return () => clearInterval(id);
  }, []);

  if (!status) return null;

  return (
    <span className="font-mono text-steel inline-flex items-center gap-2.5 text-[13px]">
      <span
        className={`h-2 w-2 shrink-0 rounded-full ${status.open ? "bg-brass" : "bg-steel"}`}
        aria-hidden
      />
      {status.label}
    </span>
  );
}
