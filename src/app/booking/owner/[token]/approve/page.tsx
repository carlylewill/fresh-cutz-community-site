import type { Metadata } from "next";
import { getOwnerBookingView, OWNER_ACTIONABLE_STATUSES } from "@/lib/bookings/service";
import { approveAction } from "@/actions/bookings";
import { BookingShell, BookingHeading, BookingBackLink } from "@/components/booking-shell";
import { BookingSummary } from "@/app/booking/booking-summary";

// The GET only reads. Approving is behind the form's POST because this URL
// lives in an email: an Outlook SafeLinks scan or a mail-client prefetch would
// otherwise confirm the booking with nobody having clicked anything.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Approve booking | Fresh Cutz Barbers" };

export default async function ApproveBookingPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ done?: string }>;
}) {
  const { token } = await params;
  const { done } = await searchParams;
  const booking = await getOwnerBookingView(token);

  if (!booking) {
    return (
      <BookingShell>
        <BookingHeading>Link not found.</BookingHeading>
        <p className="mt-4 text-steel">This approval link is invalid or has expired.</p>
        <BookingBackLink />
      </BookingShell>
    );
  }

  const date = booking.confirmed_date ?? booking.preferred_date;
  const time = booking.confirmed_time ?? booking.preferred_time;

  if (!OWNER_ACTIONABLE_STATUSES.includes(booking.status)) {
    const confirmed = booking.status === "confirmed";
    return (
      <BookingShell>
        <p className="eyebrow">{confirmed ? "Approved" : "Already handled"}</p>
        <BookingHeading>
          {confirmed
            ? "Booking confirmed."
            : `This booking is ${booking.status.replace(/_/g, " ")}.`}
        </BookingHeading>
        <BookingSummary booking={booking} date={date} time={time} />
        {confirmed && (
          <p className="mt-4 text-sm text-steel">
            The customer has been emailed their confirmation.
          </p>
        )}
        <BookingBackLink />
      </BookingShell>
    );
  }

  return (
    <BookingShell>
      <p className="eyebrow">Approve booking</p>
      <BookingHeading>Confirm this booking?</BookingHeading>
      <BookingSummary booking={booking} date={date} time={time} />
      {/* Still actionable after a submit means the write didn't land. */}
      {done && (
        <p className="mt-4 text-sm text-brass-bright">That didn&rsquo;t go through — try again.</p>
      )}
      <form action={approveAction} className="mt-6">
        <input type="hidden" name="token" value={token} />
        <button
          type="submit"
          className="inline-flex min-h-[44px] w-full items-center justify-center rounded-full bg-brass px-6 py-3 font-semibold text-ink transition-transform hover:-translate-y-0.5"
        >
          Approve &amp; confirm
        </button>
      </form>
      <BookingBackLink />
    </BookingShell>
  );
}
