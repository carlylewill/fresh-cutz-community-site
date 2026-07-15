import type { Metadata } from "next";
import { getOwnerBookingView, OWNER_ACTIONABLE_STATUSES } from "@/lib/bookings/service";
import { submitOwnerProposalAction } from "@/actions/bookings";
import { BookingShell, BookingHeading, BookingBackLink } from "@/components/booking-shell";
import { BookingSummary } from "@/app/booking/booking-summary";
import { ProposeForm } from "@/app/booking/propose-form";
import { formatDate, formatTime } from "@/lib/format-date";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Propose a new time | Fresh Cutz Barbers" };

export default async function ProposeTimePage({
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

  // Checked before the actionable guard: proposed_by_owner is exactly the state
  // a successful proposal leaves behind, and it isn't actionable any more.
  if (done && booking.status === "proposed_by_owner") {
    return (
      <BookingShell>
        <p className="eyebrow">Proposal sent</p>
        <BookingHeading>New time suggested.</BookingHeading>
        <p className="mt-4 text-steel">
          {booking.customer_name} has been emailed {formatDate(booking.proposed_date!)} at{" "}
          {formatTime(booking.proposed_time!)} to accept, decline, or suggest another time.
        </p>
        <BookingBackLink />
      </BookingShell>
    );
  }

  if (!OWNER_ACTIONABLE_STATUSES.includes(booking.status)) {
    return (
      <BookingShell>
        <BookingHeading>This booking is {booking.status.replace(/_/g, " ")}.</BookingHeading>
        <p className="mt-4 text-steel">A new time can&rsquo;t be proposed from this state.</p>
        <BookingBackLink />
      </BookingShell>
    );
  }

  return (
    <BookingShell>
      <p className="eyebrow">Propose a different time</p>
      <BookingHeading>{booking.customer_name}</BookingHeading>
      <BookingSummary
        booking={booking}
        date={booking.preferred_date}
        time={booking.preferred_time}
      />
      <ProposeForm
        token={token}
        action={submitOwnerProposalAction}
        dateLabel="New date"
        timeLabel="New time"
        submitLabel="Send proposal"
      />
      <BookingBackLink />
    </BookingShell>
  );
}
