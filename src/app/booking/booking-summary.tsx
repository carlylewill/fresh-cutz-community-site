import type { Booking } from "@/server/types";
import { formatDate, formatTime } from "@/lib/format-date";

/** The "what am I about to act on" block every booking link page shows. */
export function BookingSummary({
  booking,
  date,
  time,
}: {
  booking: Booking;
  date: string;
  time: string;
}) {
  return (
    <div className="mt-6 rounded-xl border border-line px-5 py-4 text-left">
      <p className="font-semibold text-paper">{booking.customer_name}</p>
      <p className="mt-1 text-sm text-steel">{booking.services.map((s) => s.name).join(", ")}</p>
      <p className="mt-1 text-sm text-steel">
        {formatDate(date)} at {formatTime(time)}
      </p>
      <p className="mt-1 text-sm text-brass">from &pound;{booking.total_price_from}</p>
    </div>
  );
}
