import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { getOwnerBookingView, submitOwnerProposal } from "@/functions/bookings";
import { BookingShell, BookingHeading, BookingBackLink } from "@/components/booking-shell";
import { formatDate, formatTime } from "@/lib/format-date";

export const Route = createFileRoute("/booking/owner/$token/propose")({
  component: ProposeTime,
  loader: async ({ params }) => ({
    token: params.token,
    booking: await getOwnerBookingView({ data: { token: params.token } }),
  }),
  head: () => ({ meta: [{ title: "Propose a new time | Fresh Cutz Barbers" }] }),
});

const inputCls =
  "mt-1 block w-full min-h-[44px] rounded-md border border-border bg-background px-3 py-2 text-sm text-bone placeholder:text-bone/40 focus:border-brass focus:outline-none focus:ring-2 focus:ring-brass/40";

function ProposeTime() {
  const { token, booking } = Route.useLoaderData();
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<Awaited<ReturnType<typeof submitOwnerProposal>> | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!booking) {
    return (
      <BookingShell>
        <BookingHeading>Link not found.</BookingHeading>
        <p className="mt-4 text-bone/70">This link is invalid or has expired.</p>
        <BookingBackLink />
      </BookingShell>
    );
  }

  if (!["pending", "proposed_by_customer"].includes(booking.status)) {
    return (
      <BookingShell>
        <BookingHeading>This booking is {booking.status.replace(/_/g, " ")}.</BookingHeading>
        <p className="mt-4 text-bone/70">A new time can't be proposed from this state.</p>
        <BookingBackLink />
      </BookingShell>
    );
  }

  if (result?.status === "success") {
    return (
      <BookingShell>
        <p className="eyebrow text-brass">Proposal sent</p>
        <BookingHeading>New time suggested.</BookingHeading>
        <p className="mt-4 text-bone/70">
          {booking.customer_name} has been emailed {formatDate(date)} at {formatTime(time)} to accept, decline,
          or suggest another time.
        </p>
        <BookingBackLink />
      </BookingShell>
    );
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!date || !time) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await submitOwnerProposal({ data: { token, date, time } });
      setResult(res);
    } catch {
      setError("Something went wrong sending that. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <BookingShell>
      <p className="eyebrow text-brass">Propose a different time</p>
      <BookingHeading>{booking.customer_name}</BookingHeading>
      <p className="mt-2 text-sm text-bone/60">
        Requested {formatDate(booking.preferred_date)} at {formatTime(booking.preferred_time)}
      </p>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4 text-left">
        <label className="block text-sm text-bone/80">
          New date
          <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
        </label>
        <label className="block text-sm text-bone/80">
          New time
          <input type="time" required value={time} onChange={(e) => setTime(e.target.value)} className={inputCls} />
        </label>
        {error && <p className="text-sm text-crimson">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex min-h-[44px] w-full items-center justify-center rounded-full bg-brass px-6 py-3 font-semibold text-charcoal transition-transform hover:-translate-y-0.5 disabled:opacity-60"
        >
          {submitting ? "Sending…" : "Send proposal"}
        </button>
      </form>
      <BookingBackLink />
    </BookingShell>
  );
}
