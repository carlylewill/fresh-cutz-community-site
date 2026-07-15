import "server-only";
import { getSupabaseAdmin } from "./supabase-admin";
import { sendEmail } from "./email";
import { sendWhatsApp } from "./whatsapp";
import type { NotificationChannel, NotificationStatus } from "./types";

type Common = { bookingId: string; template: string; recipient: string };

// Email is the default channel — `...customerThankYouEmail(booking)` spreads
// straight into it. WhatsApp is dark until WHATSAPP_ENABLED is true, at which
// point sendWhatsApp reports 'skipped' rather than failing.
export type NotifyInput =
  | (Common & { channel?: "email"; subject: string; html: string })
  | (Common & { channel: "whatsapp"; body: string });

async function log(row: {
  booking_id: string;
  channel: NotificationChannel;
  template: string;
  recipient: string;
  status: NotificationStatus;
  provider_message_id: string | null;
  error: string | null;
}): Promise<void> {
  try {
    const { error } = await getSupabaseAdmin().from("booking_notifications").insert(row);
    if (error) console.error("[notifications] log insert failed", error);
  } catch (err) {
    console.error("[notifications] log insert threw", err);
  }
}

// Never throws, for the same reason sendEmail and sendWhatsApp never throw: a
// notification — or a failure to record one — must not break the booking it
// describes. Writes exactly one booking_notifications row per attempt.
export async function notify(input: NotifyInput): Promise<void> {
  const channel: NotificationChannel = input.channel ?? "email";
  let status: NotificationStatus;
  let providerMessageId: string | null = null;
  let error: string | null = null;

  if (input.channel === "whatsapp") {
    const result = await sendWhatsApp({ to: input.recipient, body: input.body });
    status = result.status;
    if (result.status === "sent") providerMessageId = result.providerMessageId;
    if (result.status === "failed") error = result.error;
    if (result.status === "skipped") error = result.reason;
  } else {
    const result = await sendEmail({
      to: input.recipient,
      subject: input.subject,
      html: input.html,
    });
    status = result.ok ? "sent" : "failed";
    if (result.ok) providerMessageId = result.id;
    else error = result.error;
  }

  await log({
    booking_id: input.bookingId,
    channel,
    template: input.template,
    recipient: input.recipient,
    status,
    provider_message_id: providerMessageId,
    error,
  });
}
