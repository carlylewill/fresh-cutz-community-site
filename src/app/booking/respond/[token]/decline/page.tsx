import type { Metadata } from "next";
import { getCustomerBookingView, CUSTOMER_ACTIONABLE_STATUSES } from "@/lib/bookings/service";
import { declineAction } from "@/actions/bookings";
import { BookingShell, BookingHeading, BookingBackLink } from "@/components/booking-shell";
import { BookingSummary } from "@/app/booking/booking-summary";

// Read-only GET — see the note in ../../../owner/[token]/approve/page.tsx.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Decline new time | Fresh Cutz Barbers" };

export default async function DeclineProposalPage({
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
    const declined = booking.status === "declined";
    return (
      <BookingShell>
        <p className="eyebrow">{declined ? "Declined" : "Already handled"}</p>
        <BookingHeading>
          {declined
            ? "No problem — booking declined."
            : `This booking is ${booking.status.replace(/_/g, " ")}.`}
        </BookingHeading>
        <p className="mt-4 text-steel">
          Fancy a different time instead? Call or text 07415 409277 and we&rsquo;ll sort it.
        </p>
        <BookingBackLink />
      </BookingShell>
    );
  }

  return (
    <BookingShell>
      <p className="eyebrow">Decline new time</p>
      <BookingHeading>Turn this time down?</BookingHeading>
      <BookingSummary
        booking={booking}
        date={booking.proposed_date!}
        time={booking.proposed_time!}
      />
      <p className="mt-4 text-sm text-steel">
        Want a different time rather than none? Suggest one instead and the shop will confirm.
      </p>
      {done && (
        <p className="mt-4 text-sm text-brass-bright">That didn&rsquo;t go through — try again.</p>
      )}
      <form action={declineAction} className="mt-6">
        <input type="hidden" name="token" value={token} />
        <button
          type="submit"
          className="inline-flex min-h-[44px] w-full items-center justify-center rounded-full border border-line px-6 py-3 font-semibold text-paper transition-transform hover:-translate-y-0.5"
        >
          Decline this time
        </button>
      </form>
      <BookingBackLink />
    </BookingShell>
  );
}
