"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import {
  checkGuard,
  clientIp,
  GUARD_ERROR,
  HONEYPOT_FIELD,
  STARTED_FIELD,
} from "@/lib/bookings/spam-guard";
import {
  createBookingCore,
  approveBookingCore,
  rejectBookingCore,
  submitOwnerProposalCore,
  acceptProposalCore,
  declineProposalCore,
  submitCustomerCounterProposalCore,
} from "@/lib/bookings/service";

// Thin wrappers over the core. Next verifies the Origin header on every Server
// Action, so these are the CSRF-protected entry points for the forms; all of
// the actual logic and validation lives in @/lib/bookings/service.

export type BookingFormState =
  | { status: "idle" }
  | { status: "sent" }
  | { status: "error"; error: string };

function field(formData: FormData, name: string): string {
  return String(formData.get(name) ?? "");
}

/** Empty string means "no preference" — the column is nullable and CHECK-constrained. */
function optional(formData: FormData, name: string): string | undefined {
  const value = field(formData, name).trim();
  return value === "" ? undefined : value;
}

export async function createBookingAction(
  _prevState: BookingFormState,
  formData: FormData,
): Promise<BookingFormState> {
  const h = await headers();
  const blocked = checkGuard({
    honeypot: formData.get(HONEYPOT_FIELD),
    startedAt: formData.get(STARTED_FIELD),
    origin: h.get("origin"),
    ip: clientIp(h),
  });
  if (blocked) return { status: "error", error: GUARD_ERROR };

  const result = await createBookingCore({
    customerName: field(formData, "customerName").trim(),
    customerEmail: field(formData, "customerEmail").trim(),
    customerPhone: optional(formData, "customerPhone"),
    serviceIds: formData.getAll("serviceIds").map(String),
    preferredBarber: optional(formData, "preferredBarber") ?? null,
    preferredDate: field(formData, "preferredDate"),
    preferredTime: field(formData, "preferredTime"),
    message: optional(formData, "message"),
  });

  if (!result.ok) return { status: "error", error: result.error };
  return { status: "sent" };
}

// ---------------------------------------------------------------------------
// Owner actions — POST-only. Each mutates then redirects to ?done=1 so the
// page can re-read the row and report the real outcome, and so a refresh
// re-runs the read rather than the mutation.
// ---------------------------------------------------------------------------

export async function approveAction(formData: FormData): Promise<void> {
  const token = field(formData, "token");
  await approveBookingCore(token);
  redirect(`/booking/owner/${encodeURIComponent(token)}/approve?done=1`);
}

export async function rejectAction(formData: FormData): Promise<void> {
  const token = field(formData, "token");
  await rejectBookingCore(token);
  redirect(`/booking/owner/${encodeURIComponent(token)}/reject?done=1`);
}

export type ProposeFormState = { error: string | null };

export async function submitOwnerProposalAction(
  _prevState: ProposeFormState,
  formData: FormData,
): Promise<ProposeFormState> {
  const token = field(formData, "token");
  const result = await submitOwnerProposalCore({
    token,
    date: field(formData, "date"),
    time: field(formData, "time"),
  });

  if (result.status === "invalid_input") return { error: result.error };
  if (result.status === "invalid") {
    return { error: "Something went wrong sending that. Please try again." };
  }
  redirect(`/booking/owner/${encodeURIComponent(token)}/propose?done=1`);
}

// ---------------------------------------------------------------------------
// Customer actions
// ---------------------------------------------------------------------------

export async function acceptAction(formData: FormData): Promise<void> {
  const token = field(formData, "token");
  await acceptProposalCore(token);
  redirect(`/booking/respond/${encodeURIComponent(token)}/accept?done=1`);
}

export async function declineAction(formData: FormData): Promise<void> {
  const token = field(formData, "token");
  await declineProposalCore(token);
  redirect(`/booking/respond/${encodeURIComponent(token)}/decline?done=1`);
}

export async function submitCustomerCounterProposalAction(
  _prevState: ProposeFormState,
  formData: FormData,
): Promise<ProposeFormState> {
  const token = field(formData, "token");
  const result = await submitCustomerCounterProposalCore({
    token,
    date: field(formData, "date"),
    time: field(formData, "time"),
  });

  if (result.status === "invalid_input") return { error: result.error };
  if (result.status === "invalid") {
    return { error: "Something went wrong sending that. Please try again." };
  }
  redirect(`/booking/respond/${encodeURIComponent(token)}/propose?done=1`);
}
