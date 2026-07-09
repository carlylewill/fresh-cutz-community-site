import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSupabaseAdmin } from "@/server/supabase-admin";
import { getSiteUrl } from "@/server/site-url";
import { sendEmail, OWNER_EMAIL } from "@/server/email";
import {
  customerThankYouEmail,
  ownerNewBookingEmail,
  customerConfirmedEmail,
  customerDeclinedEmail,
  customerProposedTimeEmail,
  ownerCustomerRespondedEmail,
} from "@/server/email-templates";
import type { Booking } from "@/server/types";

// NOTE: every function in this file that touches Supabase is wrapped in
// createServerFn, even the ones only ever invoked from route `loader`s. That
// is not optional here — TanStack Start's client/server code-splitting only
// strips server-only code for createServerFn handlers. A route `loader` can
// run on the client during client-side navigations, so a plain exported
// async function calling getSupabaseAdmin() directly would risk pulling the
// service-role client into the browser bundle. Small private helpers below
// are fine because they're only ever referenced from inside a handler
// closure, never imported independently.

const bookingServiceSchema = z.object({
  name: z.string().min(1),
  priceFrom: z.number().nonnegative(),
});

const createBookingSchema = z.object({
  customerName: z.string().min(1),
  customerEmail: z.string().email(),
  customerPhone: z.string().optional(),
  services: z.array(bookingServiceSchema).min(1),
  preferredBarber: z.enum(["baggio", "rahul"]).nullable().optional(),
  preferredDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  preferredTime: z.string().regex(/^\d{2}:\d{2}$/),
  message: z.string().optional(),
});

const tokenSchema = z.object({ token: z.string().uuid() });

const proposeSchema = z.object({
  token: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
});

function ownerLinks(ownerToken: string) {
  const base = `${getSiteUrl()}/booking/owner/${ownerToken}`;
  return { approveUrl: `${base}/approve`, rejectUrl: `${base}/reject`, proposeUrl: `${base}/propose` };
}

function customerLinks(customerToken: string) {
  const base = `${getSiteUrl()}/booking/respond/${customerToken}`;
  return { acceptUrl: `${base}/accept`, declineUrl: `${base}/decline`, counterProposeUrl: `${base}/propose` };
}

async function lookupByOwnerToken(token: string): Promise<Booking | null> {
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

export type ActionResult =
  | { status: "invalid" }
  | { status: "already_handled"; booking: Booking }
  | { status: "success"; booking: Booking };

// ---------------------------------------------------------------------------
// Create booking (called from the client-side booking form)
// ---------------------------------------------------------------------------

export const createBooking = createServerFn({ method: "POST" })
  .validator((data: unknown) => createBookingSchema.parse(data))
  .handler(async ({ data }) => {
    const totalPriceFrom = data.services.reduce((sum, s) => sum + s.priceFrom, 0);
    const { data: row, error } = await getSupabaseAdmin()
      .from("bookings")
      .insert({
        customer_name: data.customerName,
        customer_email: data.customerEmail,
        customer_phone: data.customerPhone ?? null,
        services: data.services.map((s) => ({ name: s.name, priceFrom: s.priceFrom })),
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
      return { ok: false as const, error: "Could not create booking. Please call us instead." };
    }

    const booking = row as Booking;

    await sendEmail({ to: booking.customer_email, ...customerThankYouEmail(booking) });
    await sendEmail({ to: OWNER_EMAIL, ...ownerNewBookingEmail(booking, ownerLinks(booking.owner_token)) });

    return { ok: true as const, bookingId: booking.id };
  });

// ---------------------------------------------------------------------------
// Owner actions
// ---------------------------------------------------------------------------

export const getOwnerBookingView = createServerFn({ method: "GET" })
  .validator((data: unknown) => tokenSchema.parse(data))
  .handler(async ({ data }) => lookupByOwnerToken(data.token));

export const approveBookingAction = createServerFn({ method: "GET" })
  .validator((data: unknown) => tokenSchema.parse(data))
  .handler(async ({ data }): Promise<ActionResult> => {
    const booking = await lookupByOwnerToken(data.token);
    if (!booking) return { status: "invalid" };
    if (!["pending", "proposed_by_customer"].includes(booking.status)) {
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

    await sendEmail({ to: updated.customer_email, ...customerConfirmedEmail(updated) });
    return { status: "success", booking: updated };
  });

export const rejectBookingAction = createServerFn({ method: "GET" })
  .validator((data: unknown) => tokenSchema.parse(data))
  .handler(async ({ data }): Promise<ActionResult> => {
    const booking = await lookupByOwnerToken(data.token);
    if (!booking) return { status: "invalid" };
    if (!["pending", "proposed_by_customer"].includes(booking.status)) {
      return { status: "already_handled", booking };
    }

    const updated = await patchBooking(booking.id, { status: "declined" });
    if (!updated) return { status: "invalid" };

    await sendEmail({ to: updated.customer_email, ...customerDeclinedEmail(updated) });
    return { status: "success", booking: updated };
  });

export const submitOwnerProposal = createServerFn({ method: "POST" })
  .validator((data: unknown) => proposeSchema.parse(data))
  .handler(async ({ data }): Promise<ActionResult> => {
    const booking = await lookupByOwnerToken(data.token);
    if (!booking) return { status: "invalid" };
    if (!["pending", "proposed_by_customer"].includes(booking.status)) {
      return { status: "already_handled", booking };
    }

    const updated = await patchBooking(booking.id, {
      status: "proposed_by_owner",
      proposed_date: data.date,
      proposed_time: data.time,
      proposed_by: "owner",
    });
    if (!updated) return { status: "invalid" };

    await sendEmail({
      to: updated.customer_email,
      ...customerProposedTimeEmail(updated, customerLinks(updated.customer_token)),
    });
    return { status: "success", booking: updated };
  });

// ---------------------------------------------------------------------------
// Customer actions
// ---------------------------------------------------------------------------

export const getCustomerBookingView = createServerFn({ method: "GET" })
  .validator((data: unknown) => tokenSchema.parse(data))
  .handler(async ({ data }) => lookupByCustomerToken(data.token));

export const acceptProposalAction = createServerFn({ method: "GET" })
  .validator((data: unknown) => tokenSchema.parse(data))
  .handler(async ({ data }): Promise<ActionResult> => {
    const booking = await lookupByCustomerToken(data.token);
    if (!booking) return { status: "invalid" };
    if (booking.status !== "proposed_by_owner") {
      return { status: "already_handled", booking };
    }

    const updated = await patchBooking(booking.id, {
      status: "confirmed",
      confirmed_date: booking.proposed_date,
      confirmed_time: booking.proposed_time,
    });
    if (!updated) return { status: "invalid" };

    await sendEmail({ to: updated.customer_email, ...customerConfirmedEmail(updated) });
    await sendEmail({ to: OWNER_EMAIL, ...ownerCustomerRespondedEmail(updated, "accepted") });
    return { status: "success", booking: updated };
  });

export const declineProposalAction = createServerFn({ method: "GET" })
  .validator((data: unknown) => tokenSchema.parse(data))
  .handler(async ({ data }): Promise<ActionResult> => {
    const booking = await lookupByCustomerToken(data.token);
    if (!booking) return { status: "invalid" };
    if (booking.status !== "proposed_by_owner") {
      return { status: "already_handled", booking };
    }

    const updated = await patchBooking(booking.id, { status: "declined" });
    if (!updated) return { status: "invalid" };

    await sendEmail({ to: OWNER_EMAIL, ...ownerCustomerRespondedEmail(updated, "declined") });
    return { status: "success", booking: updated };
  });

export const submitCustomerCounterProposal = createServerFn({ method: "POST" })
  .validator((data: unknown) => proposeSchema.parse(data))
  .handler(async ({ data }): Promise<ActionResult> => {
    const booking = await lookupByCustomerToken(data.token);
    if (!booking) return { status: "invalid" };
    if (booking.status !== "proposed_by_owner") {
      return { status: "already_handled", booking };
    }

    const updated = await patchBooking(booking.id, {
      status: "proposed_by_customer",
      proposed_date: data.date,
      proposed_time: data.time,
      proposed_by: "customer",
    });
    if (!updated) return { status: "invalid" };

    await sendEmail({
      to: OWNER_EMAIL,
      ...ownerCustomerRespondedEmail(updated, "countered", ownerLinks(updated.owner_token)),
    });
    return { status: "success", booking: updated };
  });
