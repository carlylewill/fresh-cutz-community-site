import { createFileRoute } from "@tanstack/react-router";
import { rejectBookingAction } from "@/functions/bookings";
import { BookingShell, BookingHeading, BookingBackLink } from "@/components/booking-shell";
import { formatDate, formatTime } from "@/lib/format-date";

export const Route = createFileRoute("/booking/owner/$token/reject")({
  component: RejectBooking,
  loader: async ({ params }) => rejectBookingAction({ data: { token: params.token } }),
  head: () => ({ meta: [{ title: "Reject booking | Fresh Cutz Barbers" }] }),
});

function RejectBooking() {
  const result = Route.useLoaderData();

  if (result.status === "invalid") {
    return (
      <BookingShell>
        <BookingHeading>Link not found.</BookingHeading>
        <p className="mt-4 text-bone/70">This link is invalid or has expired.</p>
        <BookingBackLink />
      </BookingShell>
    );
  }

  const { booking } = result;

  return (
    <BookingShell>
      <p className="eyebrow text-brass">{result.status === "success" ? "Declined" : "Already handled"}</p>
      <BookingHeading>
        {booking.status === "declined"
          ? "Booking declined."
          : `This booking is ${booking.status.replace(/_/g, " ")}.`}
      </BookingHeading>
      <p className="mt-4 text-bone/70">
        {booking.customer_name} &middot; {formatDate(booking.preferred_date)} at{" "}
        {formatTime(booking.preferred_time)}
      </p>
      {result.status === "success" && (
        <p className="mt-2 text-sm text-bone/50">
          The customer has been emailed and pointed to call {"07415 409277"} to rebook.
        </p>
      )}
      <BookingBackLink />
    </BookingShell>
  );
}
