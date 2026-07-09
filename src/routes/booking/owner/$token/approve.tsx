import { createFileRoute } from "@tanstack/react-router";
import { approveBookingAction } from "@/functions/bookings";
import { BookingShell, BookingHeading, BookingBackLink } from "@/components/booking-shell";
import { formatDate, formatTime } from "@/lib/format-date";

export const Route = createFileRoute("/booking/owner/$token/approve")({
  component: ApproveBooking,
  loader: async ({ params }) => approveBookingAction({ data: { token: params.token } }),
  head: () => ({ meta: [{ title: "Approve booking | Fresh Cutz Barbers" }] }),
});

function ApproveBooking() {
  const result = Route.useLoaderData();

  if (result.status === "invalid") {
    return (
      <BookingShell>
        <BookingHeading>Link not found.</BookingHeading>
        <p className="mt-4 text-bone/70">This approval link is invalid or has expired.</p>
        <BookingBackLink />
      </BookingShell>
    );
  }

  const { booking } = result;
  const isConfirmed = booking.status === "confirmed";
  const date = booking.confirmed_date ?? booking.preferred_date;
  const time = booking.confirmed_time ?? booking.preferred_time;

  return (
    <BookingShell>
      <p className="eyebrow text-brass">{result.status === "success" ? "Approved" : "Already handled"}</p>
      <BookingHeading>
        {isConfirmed ? "Booking confirmed." : `This booking is ${booking.status.replace(/_/g, " ")}.`}
      </BookingHeading>
      <p className="mt-4 text-bone/70">
        {booking.customer_name} &middot; {formatDate(date)} at {formatTime(time)}
      </p>
      {result.status === "success" && (
        <p className="mt-2 text-sm text-bone/50">The customer has been emailed their confirmation.</p>
      )}
      <BookingBackLink />
    </BookingShell>
  );
}
