import type { Metadata } from "next";
import { getCustomerBookingView, CUSTOMER_ACTIONABLE_STATUSES } from "@/lib/bookings/service";
import { acceptAction } from "@/actions/bookings";
import { BookingShell, BookingHeading, BookingBackLink } from "@/components/booking-shell";
import { BookingSummary } from "@/app/booking/booking-summary";

// Read-only GET — see the note in ../../../owner/[token]/approve/page.tsx.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Accept new time | Fresh Cutz Barbers" };

export default async function AcceptProposalPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ done?: string }>;
}) {
  const { token } = await params;
  const { done } = await searchParams;
  const booking = await getCustomerBookingView(token);

  if (!booking) {
    return (
      <BookingShell>
        <BookingHeading>Link not found.</BookingHeading>
        <p className="mt-4 text-steel">This link is invalid or has expired.</p>
        <BookingBackLink />
      </BookingShell>
    );
  }

  if (!CUSTOMER_ACTIONABLE_STATUSES.includes(booking.status)) {
    const confirmed = booking.status === "confirmed";
    return (
      <BookingShell>
        <p className="eyebrow">{confirmed ? "Confirmed" : "Already handled"}</p>
        <BookingHeading>
          {confirmed
            ? "You're booked in."
            : `This booking is ${booking.status.replace(/_/g, " ")}.`}
        </BookingHeading>
        <BookingSummary
          booking={booking}
          date={booking.confirmed_date ?? booking.preferred_date}
          time={booking.confirmed_time ?? booking.preferred_time}
        />
        <BookingBackLink />
      </BookingShell>
    );
  }

  return (
    <BookingShell>
      <p className="eyebrow">Accept new time</p>
      <BookingHeading>Does this time work?</BookingHeading>
      <BookingSummary
        booking={booking}
        date={booking.proposed_date!}
        time={booking.proposed_time!}
      />
      {done && (
        <p className="mt-4 text-sm text-brass-bright">That didn&rsquo;t go through — try again.</p>
      )}
      <form action={acceptAction} className="mt-6">
        <input type="hidden" name="token" value={token} />
        <button
          type="submit"
          className="inline-flex min-h-[44px] w-full items-center justify-center rounded-full bg-brass px-6 py-3 font-semibold text-ink transition-transform hover:-translate-y-0.5"
        >
          Accept this time
        </button>
      </form>
      <BookingBackLink />
    </BookingShell>
  );
}
