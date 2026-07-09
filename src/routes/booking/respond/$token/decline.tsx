import { createFileRoute } from "@tanstack/react-router";
import { declineProposalAction } from "@/functions/bookings";
import { BookingShell, BookingHeading, BookingBackLink } from "@/components/booking-shell";

export const Route = createFileRoute("/booking/respond/$token/decline")({
  component: DeclineProposal,
  loader: async ({ params }) => declineProposalAction({ data: { token: params.token } }),
  head: () => ({ meta: [{ title: "Decline new time | Fresh Cutz Barbers" }] }),
});

function DeclineProposal() {
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
          ? "No problem — booking declined."
          : `This booking is ${booking.status.replace(/_/g, " ")}.`}
      </BookingHeading>
      <p className="mt-4 text-bone/70">
        Fancy a different time instead? Call or text {"07415 409277"} and we'll sort it.
      </p>
      <BookingBackLink />
    </BookingShell>
  );
}
