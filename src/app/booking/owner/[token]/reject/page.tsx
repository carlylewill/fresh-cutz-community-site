import type { Metadata } from "next";
import { getOwnerBookingView, OWNER_ACTIONABLE_STATUSES } from "@/lib/bookings/service";
import { rejectAction } from "@/actions/bookings";
import { BookingShell, BookingHeading, BookingBackLink } from "@/components/booking-shell";
import { BookingSummary } from "@/app/booking/booking-summary";

// Read-only GET — see the note in ../approve/page.tsx.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Reject booking | Fresh Cutz Barbers" };

export default async function RejectBookingPage({
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
        <p className="mt-4 text-steel">This link is invalid or has expired.</p>
        <BookingBackLink />
      </BookingShell>
    );
  }

  if (!OWNER_ACTIONABLE_STATUSES.includes(booking.status)) {
    const declined = booking.status === "declined";
    return (
      <BookingShell>
        <p className="eyebrow">{declined ? "Declined" : "Already handled"}</p>
        <BookingHeading>
          {declined ? "Booking declined." : `This booking is ${booking.status.replace(/_/g, " ")}.`}
        </BookingHeading>
        <BookingSummary
          booking={booking}
          date={booking.preferred_date}
          time={booking.preferred_time}
        />
        {declined && (
          <p className="mt-4 text-sm text-steel">
            The customer has been emailed and pointed to call 07415 409277 to rebook.
          </p>
        )}
        <BookingBackLink />
      </BookingShell>
    );
  }

  return (
    <BookingShell>
      <p className="eyebrow">Reject booking</p>
      <BookingHeading>Turn this booking down?</BookingHeading>
      <BookingSummary
        booking={booking}
        date={booking.preferred_date}
        time={booking.preferred_time}
      />
      <p className="mt-4 text-sm text-steel">
        If a different time would work, propose one instead — the customer can accept it in a click.
      </p>
      {done && (
        <p className="mt-4 text-sm text-brass-bright">That didn&rsquo;t go through — try again.</p>
      )}
      <form action={rejectAction} className="mt-6">
        <input type="hidden" name="token" value={token} />
        <button
          type="submit"
          className="inline-flex min-h-[44px] w-full items-center justify-center rounded-full border border-line px-6 py-3 font-semibold text-paper transition-transform hover:-translate-y-0.5"
        >
          Reject booking
        </button>
      </form>
      <BookingBackLink />
    </BookingShell>
  );
}
