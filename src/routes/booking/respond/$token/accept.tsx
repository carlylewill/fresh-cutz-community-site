import { createFileRoute } from "@tanstack/react-router";
import { acceptProposalAction } from "@/functions/bookings";
import { BookingShell, BookingHeading, BookingBackLink } from "@/components/booking-shell";
import { formatDate, formatTime } from "@/lib/format-date";

export const Route = createFileRoute("/booking/respond/$token/accept")({
  component: AcceptProposal,
  loader: async ({ params }) => acceptProposalAction({ data: { token: params.token } }),
  head: () => ({ meta: [{ title: "Accept new time | Fresh Cutz Barbers" }] }),
});

function AcceptProposal() {
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
  const date = booking.confirmed_date ?? booking.preferred_date;
  const time = booking.confirmed_time ?? booking.preferred_time;

  return (
    <BookingShell>
      <p className="eyebrow text-brass">{result.status === "success" ? "Confirmed" : "Already handled"}</p>
      <BookingHeading>
        {booking.status === "confirmed"
          ? "You're booked in."
          : `This booking is ${booking.status.replace(/_/g, " ")}.`}
      </BookingHeading>
      <p className="mt-4 text-bone/70">
        {formatDate(date)} at {formatTime(time)}
      </p>
      <BookingBackLink />
    </BookingShell>
  );
}
