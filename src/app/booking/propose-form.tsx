"use client";

import { useActionState } from "react";
import type { ProposeFormState } from "@/actions/bookings";

const initialState: ProposeFormState = { error: null };

const inputCls =
  "mt-1 block min-h-[44px] w-full rounded-md border border-line bg-ink-deep px-3 py-2 text-sm text-paper focus:border-brass focus:ring-2 focus:ring-brass/40 focus:outline-none";

/**
 * Shared by both propose routes — the Server Action is passed in as a prop, so
 * the owner and customer variants differ only in copy. The action redirects to
 * ?done=1 on success; it only returns here to report a rejected date or time.
 */
export function ProposeForm({
  token,
  action,
  dateLabel,
  timeLabel,
  submitLabel,
}: {
  token: string;
  action: (prevState: ProposeFormState, formData: FormData) => Promise<ProposeFormState>;
  dateLabel: string;
  timeLabel: string;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="mt-6 space-y-4 text-left">
      <input type="hidden" name="token" value={token} />
      <label className="block text-sm text-steel">
        {dateLabel}
        <input type="date" name="date" required className={inputCls} />
      </label>
      <label className="block text-sm text-steel">
        {timeLabel}
        <input type="time" name="time" required className={inputCls} />
      </label>
      {state.error && <p className="text-sm text-brass-bright">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-[44px] w-full items-center justify-center rounded-full bg-brass px-6 py-3 font-semibold text-ink transition-transform hover:-translate-y-0.5 disabled:opacity-60"
      >
        {pending ? "Sending…" : submitLabel}
      </button>
    </form>
  );
}
