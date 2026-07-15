import type { Metadata } from "next";
import { getCustomerBookingView, CUSTOMER_ACTIONABLE_STATUSES } from "@/lib/bookings/service";
import { submitCustomerCounterProposalAction } from "@/actions/bookings";
import { BookingShell, BookingHeading, BookingBackLink } from "@/components/booking-shell";
import { ProposeForm } from "@/app/booking/propose-form";
import { formatDate, formatTime } from "@/lib/format-date";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Suggest another time | Fresh Cutz Barbers" };

export default async function CounterProposePage({
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

  // Checked before the actionable guard: proposed_by_customer is exactly the
  // state a successful suggestion leaves behind, and it isn't actionable.
  if (done && booking.status === "proposed_by_customer") {
    return (
      <BookingShell>
        <p className="eyebrow">Sent</p>
        <BookingHeading>Suggestion sent to the shop.</BookingHeading>
        <p className="mt-4 text-steel">
          We&rsquo;ve asked about {formatDate(booking.proposed_date!)} at{" "}
          {formatTime(booking.proposed_time!)}. You&rsquo;ll hear back once Baggio confirms.
        </p>
        <BookingBackLink />
      </BookingShell>
    );
  }

  if (!CUSTOMER_ACTIONABLE_STATUSES.includes(booking.status)) {
    return (
      <BookingShell>
        <BookingHeading>This booking is {booking.status.replace(/_/g, " ")}.</BookingHeading>
        <p className="mt-4 text-steel">A new time can&rsquo;t be suggested from this state.</p>
        <BookingBackLink />
      </BookingShell>
    );
  }

  return (
    <BookingShell>
      <p className="eyebrow">Suggest another time</p>
      <BookingHeading>Pick a time that works.</BookingHeading>
      <p className="mt-2 text-sm text-steel">
        Shop suggested {formatDate(booking.proposed_date!)} at {formatTime(booking.proposed_time!)}
      </p>
      <ProposeForm
        token={token}
        action={submitCustomerCounterProposalAction}
        dateLabel="Your preferred date"
        timeLabel="Your preferred time"
        submitLabel="Send suggestion"
      />
      <BookingBackLink />
    </BookingShell>
  );
}
