import "server-only";
import { z } from "zod";
import { getSupabaseAdmin } from "@/server/supabase-admin";
import { getSiteUrl } from "@/server/site-url";
import { OWNER_EMAIL } from "@/server/email";
import { notify } from "@/server/notifications";
import {
  customerThankYouEmail,
  ownerNewBookingEmail,
  customerConfirmedEmail,
  customerDeclinedEmail,
  customerProposedTimeEmail,
  ownerCustomerRespondedEmail,
} from "@/server/email-templates";
import { SERVICE_IDS, resolveServices } from "@/lib/services";
import { isRateLimited } from "./rate-limit";
import type { Booking, BookingStatus } from "@/server/types";

// Framework-agnostic booking core. Everything here is a plain async function:
// the Server Actions in src/actions/bookings.ts and the POST /api/bookings
// route are both thin wrappers over these. The "server-only" import is what
// keeps the service-role client out of the client bundle now that there is no
// createServerFn boundary doing it.

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

// `\d{2}` alone accepts "99:99", which Postgres then rejects at insert time as
// an opaque 500. Bound the fields properly and check the slot semantically.
const dateString = z
  .string({ required_error: "Please pick a date." })
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Please pick a date.");
const timeString = z
  .string({ required_error: "Please pick a time." })
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Please pick a time.");

const OPENING_MINUTES = 10 * 60;
const CLOSING_MINUTES_WEEKDAY = 20 * 60;
const CLOSING_MINUTES_SUNDAY = 18 * 60;

// The shop's hours and "in the past" are Europe/London wall-clock concepts, but
// the server runs in UTC — during BST a 00:30 booking would otherwise still
// read as yesterday and be rejected.
function londonToday(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London" }).format(new Date());
}

function parseDateParts(dateStr: string): { year: number; month: number; day: number } {
  const [year, month, day] = dateStr.split("-").map(Number);
  return { year, month, day };
}

function isRealDate(dateStr: string): boolean {
  const { year, month, day } = parseDateParts(dateStr);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

/** 0 = Sunday. Built in UTC so the local timezone can't shift the weekday. */
function dayOfWeek(dateStr: string): number {
  const { year, month, day } = parseDateParts(dateStr);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

type SlotIssue = { field: "date" | "time"; message: string };

function slotIssue(dateStr: string, timeStr: string): SlotIssue | null {
  if (!isRealDate(dateStr)) {
    return { field: "date", message: "That date doesn't exist — please pick another." };
  }
  if (dateStr < londonToday()) {
    return {
      field: "date",
      message: "That date is in the past — please pick a day from today on.",
    };
  }

  const [hours, minutes] = timeStr.split(":").map(Number);
  const atMinutes = hours * 60 + minutes;
  const isSunday = dayOfWeek(dateStr) === 0;
  const closing = isSunday ? CLOSING_MINUTES_SUNDAY : CLOSING_MINUTES_WEEKDAY;

  if (atMinutes < OPENING_MINUTES || atMinutes > closing) {
    return {
      field: "time",
      message: isSunday
        ? "We're open 10:00–18:00 on Sundays — please pick a time in that window."
        : "We're open 10:00–20:00 Monday to Saturday — please pick a time in that window.",
    };
  }
  return null;
}

// Prices and names are resolved server-side from SERVICE_IDS: the client sends
// ids only, so total_price_from can't be forged by editing the request body.
const createBookingSchema = z
  .object({
    customerName: z
      .string({ required_error: "Please tell us your name." })
      .min(1, "Please tell us your name."),
    customerEmail: z
      .string({ required_error: "Please give us an email address." })
      .email("That email address doesn't look right."),
    customerPhone: z.string().optional(),
    serviceIds: z
      .array(z.enum(SERVICE_IDS), { required_error: "Please pick at least one service." })
      .min(1, "Please pick at least one service."),
    preferredBarber: z.enum(["baggio", "rahul"]).nullable().optional(),
    preferredDate: dateString,
    preferredTime: timeString,
    message: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const issue = slotIssue(data.preferredDate, data.preferredTime);
    if (issue) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: issue.message,
        path: [issue.field === "date" ? "preferredDate" : "preferredTime"],
      });
    }
  });

const tokenSchema = z.object({ token: z.string().uuid() });

const proposeSchema = z
  .object({
    token: z.string().uuid(),
    date: dateString,
    time: timeString,
  })
  .superRefine((data, ctx) => {
    const issue = slotIssue(data.date, data.time);
    if (issue) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: issue.message, path: [issue.field] });
    }
  });

function firstIssue(error: z.ZodError, fallback: string): string {
  return error.issues[0]?.message ?? fallback;
}

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

function ownerLinks(ownerToken: string) {
  const base = `${getSiteUrl()}/booking/owner/${ownerToken}`;
  return {
    approveUrl: `${base}/approve`,
    rejectUrl: `${base}/reject`,
    proposeUrl: `${base}/propose`,
  };
}

function customerLinks(customerToken: string) {
  const base = `${getSiteUrl()}/booking/respond/${customerToken}`;
  return {
    acceptUrl: `${base}/accept`,
    declineUrl: `${base}/decline`,
    counterProposeUrl: `${base}/propose`,
  };
}

async function lookupByOwnerToken(token: string): Promise<Booking | null> {
  if (!tokenSchema.safeParse({ token }).success) return null;
  const { data, error } = await getSupabaseAdmin()
    .from("bookings")
    .select("*")
    .eq("owner_token", token)
    .maybeSingle();
  if (error) {
    console.error("[bookings] lookup by owner_token failed", error);
    return null;
  }
  return data as Booking | null;
}

async function lookupByCustomerToken(token: string): Promise<Booking | null> {
  if (!tokenSchema.safeParse({ token }).success) return null;
  const { data, error } = await getSupabaseAdmin()
    .from("bookings")
    .select("*")
    .eq("customer_token", token)
    .maybeSingle();
  if (error) {
    console.error("[bookings] lookup by customer_token failed", error);
    return null;
  }
  return data as Booking | null;
}

async function patchBooking(id: string, patch: Partial<Booking>): Promise<Booking | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("bookings")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error || !data) {
    console.error("[bookings] update failed", error);
    return null;
  }
  return data as Booking;
}

// The status guards are the idempotency layer: a second click on an emailed
// link lands on already_handled rather than re-firing the mutation and the
// email. The pages read these to decide whether to offer the action at all.
export const OWNER_ACTIONABLE_STATUSES: readonly BookingStatus[] = [
  "pending",
  "proposed_by_customer",
];
export const CUSTOMER_ACTIONABLE_STATUSES: readonly BookingStatus[] = ["proposed_by_owner"];

export type ActionResult =
  | { status: "invalid" }
  | { status: "already_handled"; booking: Booking }
  | { status: "success"; booking: Booking };

/** Adds the validation-failure case the two propose forms surface inline. */
export type ProposalResult = ActionResult | { status: "invalid_input"; error: string };

export type CreateBookingResult =
  | { ok: true; bookingId: string }
  | { ok: false; reason: "invalid" | "rate_limited" | "failed"; error: string };

// ---------------------------------------------------------------------------
// Create booking (called from the booking form and POST /api/bookings)
// ---------------------------------------------------------------------------

export async function createBookingCore(input: unknown): Promise<CreateBookingResult> {
  const parsed = createBookingSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      reason: "invalid",
      error: firstIssue(parsed.error, "Please check the form and try again."),
    };
  }
  const data = parsed.data;

  if (await isRateLimited(data.customerEmail)) {
    return {
      ok: false,
      reason: "rate_limited",
      error: "You've sent a few requests already — give us a moment, or call the shop.",
    };
  }

  const services = resolveServices(data.serviceIds).map((s) => ({
    name: s.name,
    priceFrom: s.priceFrom,
  }));
  const totalPriceFrom = services.reduce((sum, s) => sum + s.priceFrom, 0);

  const { data: row, error } = await getSupabaseAdmin()
    .from("bookings")
    .insert({
      customer_name: data.customerName,
      customer_email: data.customerEmail,
      customer_phone: data.customerPhone ?? null,
      services,
      total_price_from: totalPriceFrom,
      preferred_barber: data.preferredBarber ?? null,
      preferred_date: data.preferredDate,
      preferred_time: data.preferredTime,
      message: data.message ?? null,
    })
    .select()
    .single();

  if (error || !row) {
    console.error("[bookings] insert failed", error);
    return {
      ok: false,
      reason: "failed",
      error: "Could not create booking. Please call us instead.",
    };
  }

  const booking = row as Booking;

  await notify({
    bookingId: booking.id,
    template: "customer_thank_you",
    recipient: booking.customer_email,
    ...customerThankYouEmail(booking),
  });
  await notify({
    bookingId: booking.id,
    template: "owner_new_booking",
    recipient: OWNER_EMAIL,
    ...ownerNewBookingEmail(booking, ownerLinks(booking.owner_token)),
  });

  return { ok: true, bookingId: booking.id };
}

// ---------------------------------------------------------------------------
// Owner actions
// ---------------------------------------------------------------------------

export async function getOwnerBookingView(token: string): Promise<Booking | null> {
  return lookupByOwnerToken(token);
}

export async function approveBookingCore(token: string): Promise<ActionResult> {
  const booking = await lookupByOwnerToken(token);
  if (!booking) return { status: "invalid" };
  if (!OWNER_ACTIONABLE_STATUSES.includes(booking.status)) {
    return { status: "already_handled", booking };
  }
  const fromCustomerProposal = booking.status === "proposed_by_customer";
  const confirmedDate = fromCustomerProposal ? booking.proposed_date! : booking.preferred_date;
  const confirmedTime = fromCustomerProposal ? booking.proposed_time! : booking.preferred_time;

  const updated = await patchBooking(booking.id, {
    status: "confirmed",
    confirmed_date: confirmedDate,
    confirmed_time: confirmedTime,
  });
  if (!updated) return { status: "invalid" };

  await notify({
    bookingId: updated.id,
    template: "customer_confirmed",
    recipient: updated.customer_email,
    ...customerConfirmedEmail(updated),
  });
  return { status: "success", booking: updated };
}

export async function rejectBookingCore(token: string): Promise<ActionResult> {
  const booking = await lookupByOwnerToken(token);
  if (!booking) return { status: "invalid" };
  if (!OWNER_ACTIONABLE_STATUSES.includes(booking.status)) {
    return { status: "already_handled", booking };
  }

  const updated = await patchBooking(booking.id, { status: "declined" });
  if (!updated) return { status: "invalid" };

  await notify({
    bookingId: updated.id,
    template: "customer_declined",
    recipient: updated.customer_email,
    ...customerDeclinedEmail(updated),
  });
  return { status: "success", booking: updated };
}

export async function submitOwnerProposalCore(input: unknown): Promise<ProposalResult> {
  const parsed = proposeSchema.safeParse(input);
  if (!parsed.success) {
    if (parsed.error.issues.some((i) => i.path[0] === "token")) return { status: "invalid" };
    return { status: "invalid_input", error: firstIssue(parsed.error, "Please check that time.") };
  }
  const data = parsed.data;

  const booking = await lookupByOwnerToken(data.token);
  if (!booking) return { status: "invalid" };
  if (!OWNER_ACTIONABLE_STATUSES.includes(booking.status)) {
    return { status: "already_handled", booking };
  }

  const updated = await patchBooking(booking.id, {
    status: "proposed_by_owner",
    proposed_date: data.date,
    proposed_time: data.time,
    proposed_by: "owner",
  });
  if (!updated) return { status: "invalid" };

  await notify({
    bookingId: updated.id,
    template: "customer_proposed_time",
    recipient: updated.customer_email,
    ...customerProposedTimeEmail(updated, customerLinks(updated.customer_token)),
  });
  return { status: "success", booking: updated };
}

// ---------------------------------------------------------------------------
// Customer actions
// ---------------------------------------------------------------------------

export async function getCustomerBookingView(token: string): Promise<Booking | null> {
  return lookupByCustomerToken(token);
}

export async function acceptProposalCore(token: string): Promise<ActionResult> {
  const booking = await lookupByCustomerToken(token);
  if (!booking) return { status: "invalid" };
  if (!CUSTOMER_ACTIONABLE_STATUSES.includes(booking.status)) {
    return { status: "already_handled", booking };
  }

  const updated = await patchBooking(booking.id, {
    status: "confirmed",
    confirmed_date: booking.proposed_date,
    confirmed_time: booking.proposed_time,
  });
  if (!updated) return { status: "invalid" };

  await notify({
    bookingId: updated.id,
    template: "customer_confirmed",
    recipient: updated.customer_email,
    ...customerConfirmedEmail(updated),
  });
  await notify({
    bookingId: updated.id,
    template: "owner_customer_responded",
    recipient: OWNER_EMAIL,
    ...ownerCustomerRespondedEmail(updated, "accepted"),
  });
  return { status: "success", booking: updated };
}

export async function declineProposalCore(token: string): Promise<ActionResult> {
  const booking = await lookupByCustomerToken(token);
  if (!booking) return { status: "invalid" };
  if (!CUSTOMER_ACTIONABLE_STATUSES.includes(booking.status)) {
    return { status: "already_handled", booking };
  }

  const updated = await patchBooking(booking.id, { status: "declined" });
  if (!updated) return { status: "invalid" };

  await notify({
    bookingId: updated.id,
    template: "owner_customer_responded",
    recipient: OWNER_EMAIL,
    ...ownerCustomerRespondedEmail(updated, "declined"),
  });
  return { status: "success", booking: updated };
}

export async function submitCustomerCounterProposalCore(input: unknown): Promise<ProposalResult> {
  const parsed = proposeSchema.safeParse(input);
  if (!parsed.success) {
    if (parsed.error.issues.some((i) => i.path[0] === "token")) return { status: "invalid" };
    return { status: "invalid_input", error: firstIssue(parsed.error, "Please check that time.") };
  }
  const data = parsed.data;

  const booking = await lookupByCustomerToken(data.token);
  if (!booking) return { status: "invalid" };
  if (!CUSTOMER_ACTIONABLE_STATUSES.includes(booking.status)) {
    return { status: "already_handled", booking };
  }

  const updated = await patchBooking(booking.id, {
    status: "proposed_by_customer",
    proposed_date: data.date,
    proposed_time: data.time,
    proposed_by: "customer",
  });
  if (!updated) return { status: "invalid" };

  await notify({
    bookingId: updated.id,
    template: "owner_customer_responded",
    recipient: OWNER_EMAIL,
    ...ownerCustomerRespondedEmail(updated, "countered", ownerLinks(updated.owner_token)),
  });
  return { status: "success", booking: updated };
}
