"use client";

import { useActionState, useState } from "react";
import { SERVICES, BARBERS } from "@/lib/services";
import { Magnetic } from "@/components/motion/magnetic";
import { createBookingAction, type BookingFormState } from "@/actions/bookings";

const STEPS = ["Services", "Barber", "Time", "Details"] as const;

const initialState: BookingFormState = { status: "idle" };

/**
 * The v2 four-step wizard. `whatsappEnabled` is passed from the server so the
 * confirmation copy tracks the real flag — the prototype promises "WhatsApp and
 * email" unconditionally, which is false while WHATSAPP_ENABLED=false.
 */
export function BookingWizard({ whatsappEnabled }: { whatsappEnabled: boolean }) {
  const [step, setStep] = useState(1);
  const [picked, setPicked] = useState<string[]>([]);
  const [barber, setBarber] = useState<string | null>(null);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("14:00");
  const [state, formAction, pending] = useActionState(createBookingAction, initialState);

  const sent = state.status === "sent";
  const channels = whatsappEnabled ? "WhatsApp and email" : "email";

  const toggle = (id: string) =>
    setPicked((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));

  const barberLabel = barber
    ? (BARBERS.find((b) => b.id === barber)?.label ?? barber)
    : "No preference";
  const summary = [
    picked.length
      ? picked.map((id) => SERVICES.find((s) => s.id === id)?.name).join(", ")
      : "No service selected yet",
    `with ${barberLabel}`,
    date || "any day",
    `at ${time || "any time"}`,
  ].join(" · ");

  // The wizard's own step gating is UX only — the server re-validates everything.
  const canLeaveServices = picked.length > 0;

  return (
    <div className="book-shell reveal" data-anim="card">
      <div className="book-head" role="list">
        {STEPS.map((label, i) => {
          const n = i + 1;
          return (
            <div
              key={label}
              role="listitem"
              className={`bstep${sent ? " done" : n === step ? " active" : n < step ? " done" : ""}`}
            >
              {n} · {label}
            </div>
          );
        })}
      </div>

      <div className="book-body">
        {sent ? (
          <div className="bpanel show">
            <div className="sent">
              <div className="s-ic" aria-hidden>
                ✂
              </div>
              <h3>Request sent.</h3>
              <p>
                Your ticket&rsquo;s in the queue. The shop gets your request instantly by{" "}
                <b className="text-brass-bright">{channels}</b> — as soon as Baggio or Rahul
                approves it, you&rsquo;ll get a confirmation the same way.
              </p>
              <div className="flow-note">
                <div>
                  <b>You</b>Request sent
                </div>
                <div>
                  <b>Shop</b>
                  {whatsappEnabled ? "WhatsApp + email alert" : "Email alert"}
                </div>
                <div>
                  <b>Baggio</b>Approves the slot
                </div>
                <div>
                  <b>You</b>Confirmed ✓
                </div>
              </div>
            </div>
          </div>
        ) : (
          <form action={formAction}>
            {/* Carried across steps: only the visible panel changes, so these
                must be hidden inputs rather than per-panel fields. */}
            {picked.map((id) => (
              <input key={id} type="hidden" name="serviceIds" value={id} />
            ))}
            <input type="hidden" name="preferredBarber" value={barber ?? ""} />

            <div className={`bpanel${step === 1 ? " show" : ""}`} hidden={step !== 1}>
              <h3>What are you in for?</h3>
              <div className="chip-row">
                {SERVICES.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className={`chip${picked.includes(s.id) ? " on" : ""}`}
                    aria-pressed={picked.includes(s.id)}
                    onClick={() => toggle(s.id)}
                  >
                    {s.name} · £{s.priceFrom}
                  </button>
                ))}
              </div>
              <div className="book-nav">
                <span />
                <Magnetic>
                  <button
                    type="button"
                    className="btn-primary"
                    disabled={!canLeaveServices}
                    onClick={() => setStep(2)}
                  >
                    <i className="sweep" />
                    <span>Next</span>
                  </button>
                </Magnetic>
              </div>
            </div>

            <div className={`bpanel${step === 2 ? " show" : ""}`} hidden={step !== 2}>
              <h3>Preferred barber</h3>
              <div className="chip-row">
                {/* "No preference" maps to NULL — preferred_barber is nullable
                    and CHECK-constrained to baggio|rahul. */}
                <button
                  type="button"
                  className={`chip${barber === null ? " on" : ""}`}
                  aria-pressed={barber === null}
                  onClick={() => setBarber(null)}
                >
                  No preference
                </button>
                {BARBERS.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    className={`chip${barber === b.id ? " on" : ""}`}
                    aria-pressed={barber === b.id}
                    onClick={() => setBarber(b.id)}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
              <div className="book-nav">
                <button type="button" className="btn-ghost" onClick={() => setStep(1)}>
                  Back
                </button>
                <Magnetic>
                  <button type="button" className="btn-primary" onClick={() => setStep(3)}>
                    <i className="sweep" />
                    <span>Next</span>
                  </button>
                </Magnetic>
              </div>
            </div>

            <div className={`bpanel${step === 3 ? " show" : ""}`} hidden={step !== 3}>
              <h3>Pick a time</h3>
              <div className="f2">
                <div className="field">
                  <label htmlFor="fDate">Preferred date</label>
                  <input
                    id="fDate"
                    name="preferredDate"
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label htmlFor="fTime">Preferred time</label>
                  <input
                    id="fTime"
                    name="preferredTime"
                    type="time"
                    required
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                  />
                </div>
              </div>
              <div className="book-summary">
                Open <b>Mon–Sat 10:00–20:00</b> · <b>Sun 10:00–18:00</b>. This is a request — the
                time is locked in only once the shop confirms.
              </div>
              <div className="book-nav">
                <button type="button" className="btn-ghost" onClick={() => setStep(2)}>
                  Back
                </button>
                <Magnetic>
                  <button type="button" className="btn-primary" onClick={() => setStep(4)}>
                    <i className="sweep" />
                    <span>Next</span>
                  </button>
                </Magnetic>
              </div>
            </div>

            <div className={`bpanel${step === 4 ? " show" : ""}`} hidden={step !== 4}>
              <h3>Your details</h3>
              <div className="book-summary">{summary}</div>
              <div className="f2">
                <div className="field">
                  <label htmlFor="fName">Name</label>
                  <input
                    id="fName"
                    name="customerName"
                    type="text"
                    required
                    placeholder="Your name"
                  />
                </div>
                <div className="field">
                  <label htmlFor="fPhone">
                    {whatsappEnabled ? "WhatsApp number" : "Phone number"}
                  </label>
                  <input id="fPhone" name="customerPhone" type="tel" placeholder="07…" />
                </div>
              </div>
              <div className="field">
                <label htmlFor="fEmail">Email</label>
                <input
                  id="fEmail"
                  name="customerEmail"
                  type="email"
                  required
                  placeholder="you@email.com"
                />
              </div>
              <div className="field">
                <label htmlFor="fNotes">
                  Anything we should know?{" "}
                  <span style={{ textTransform: "none", letterSpacing: 0 }}>(optional)</span>
                </label>
                <textarea
                  id="fNotes"
                  name="message"
                  rows={2}
                  placeholder="Reference photo coming, nervous first-timer, etc."
                />
              </div>
              {state.status === "error" ? (
                <p className="book-error" role="alert">
                  {state.error}
                </p>
              ) : null}
              <div className="book-nav">
                <button type="button" className="btn-ghost" onClick={() => setStep(3)}>
                  Back
                </button>
                <Magnetic>
                  <button type="submit" className="btn-primary" disabled={pending}>
                    <i className="sweep" />
                    <span>{pending ? "Sending…" : "Request Booking"}</span>
                  </button>
                </Magnetic>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
